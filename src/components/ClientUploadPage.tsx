import React, { useRef, useState, useEffect } from 'react';
import {
  Upload, FileText, CheckCircle, AlertCircle, Loader2, Trash2,
  ShoppingCart, Tag, ClipboardList, Globe, Heart,
} from 'lucide-react';
import * as storageService from '../services/storage.service';
import * as casesService from '../services/cases.service';
import { renderPdfToImages, isPdf } from '../lib/pdfToImages';

interface ClientUploadPageProps {
  token?: string;
  role: 'buyer' | 'seller';
  caseId: string;
  orgId: string;
  caseNumber?: string;
  caseType?: string;
  forConveyancer?: boolean;
  onSubmitParty?: (partyData: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>;
  onSubmitted: () => void;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: 'uploading' | 'done' | 'error';
  path?: string;
  bucket?: string;
  dataUrl?: string;
  // JPEG data URLs — one per PDF page. The AI vision model can't read PDFs
  // directly, so we render scanned documents (Omang, title deed, marriage
  // certificate, etc.) page-by-page in the browser and ship the images.
  pageImages?: string[];
}

const MAX_FILE_BYTES = 20 * 1024 * 1024;

const NATIONALITIES = [
  'Botswana',
  'Afghan', 'Albanian', 'Algerian', 'American', 'Andorran', 'Angolan', 'Antiguan', 'Argentine', 'Armenian', 'Australian',
  'Austrian', 'Azerbaijani', 'Bahamian', 'Bahraini', 'Bangladeshi', 'Barbadian', 'Belarusian', 'Belgian', 'Belizean',
  'Beninese', 'Bhutanese', 'Bolivian', 'Bosnian', 'Brazilian', 'British', 'Bruneian', 'Bulgarian', 'Burkinabe',
  'Burmese', 'Burundian', 'Cambodian', 'Cameroonian', 'Canadian', 'Cape Verdean', 'Central African', 'Chadian', 'Chilean',
  'Chinese', 'Colombian', 'Comoran', 'Congolese', 'Costa Rican', 'Croatian', 'Cuban', 'Cypriot', 'Czech', 'Danish', 'Djibouti',
  'Dominican', 'Dutch', 'East Timorese', 'Ecuadorean', 'Egyptian', 'Emirian', 'Equatorial Guinean', 'Eritrean', 'Estonian',
  'Ethiopian', 'Fijian', 'Filipino', 'Finnish', 'French', 'Gabonese', 'Gambian', 'Georgian', 'German', 'Ghanaian', 'Greek',
  'Grenadian', 'Guatemalan', 'Guinea-Bissauan', 'Guinean', 'Guyanese', 'Haitian', 'Honduran', 'Hungarian',
  'Icelander', 'Indian', 'Indonesian', 'Iranian', 'Iraqi', 'Irish', 'Israeli', 'Italian', 'Ivorian', 'Jamaican', 'Japanese',
  'Jordanian', 'Kazakhstani', 'Kenyan', 'Kuwaiti', 'Kyrgyz', 'Laotian', 'Latvian', 'Lebanese',
  'Liberian', 'Libyan', 'Liechtensteiner', 'Lithuanian', 'Luxembourger', 'Macedonian', 'Malagasy', 'Malawian', 'Malaysian',
  'Maldivan', 'Malian', 'Maltese', 'Marshallese', 'Mauritanian', 'Mauritian', 'Mexican', 'Moldovan', 'Monacan',
  'Mongolian', 'Moroccan', 'Mosotho', 'Motswana', 'Mozambican', 'Namibian', 'Nepalese', 'New Zealander',
  'Nicaraguan', 'Nigerian', 'Nigerien', 'North Korean', 'Norwegian', 'Omani', 'Pakistani', 'Panamanian',
  'Paraguayan', 'Peruvian', 'Polish', 'Portuguese', 'Qatari', 'Romanian', 'Russian', 'Rwandan',
  'Salvadoran', 'Samoan', 'Saudi', 'Senegalese', 'Serbian', 'Seychellois', 'Sierra Leonean',
  'Singaporean', 'Slovakian', 'Slovenian', 'Somali', 'South African', 'South Korean', 'Spanish', 'Sri Lankan',
  'Sudanese', 'Swazi', 'Swedish', 'Swiss', 'Syrian', 'Taiwanese', 'Tajik', 'Tanzanian', 'Thai', 'Togolese', 'Tongan',
  'Tunisian', 'Turkish', 'Ugandan', 'Ukrainian', 'Uruguayan', 'Uzbekistani', 'Venezuelan',
  'Vietnamese', 'Yemenite', 'Zambian', 'Zimbabwean',
];

const MARITAL_OPTIONS = [
  { value: 'single', label: 'Single' },
  { value: 'married_in', label: 'Married (In Community)' },
  { value: 'married_out', label: 'Married (Out of Community)' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' },
];

// Documents required from a party — determined by role, nationality and marital
// status, per the firm's required-documents schedule.
const requiredDocsFor = (
  role: 'buyer' | 'seller',
  nationality?: string,
  maritalStatus?: string,
): string[] => {
  const docs: string[] = ['Proof of Address (Affidavit, Utility Bill)'];

  // Identity — by nationality
  if (nationality === 'Botswana') {
    docs.push('Proof of Identity (ID Document / Omang)');
  } else if (nationality) {
    docs.push('Proof of Identity (Passport Copy)');
    docs.push('Residence Permit');
  } else {
    docs.push('Proof of Identity');
  }

  // Marital status
  if (maritalStatus === 'married_in') {
    docs.push('Marriage Certificate');
    docs.push(nationality === 'Botswana' ? 'Spouse ID Document' : 'Spouse Passport Copy or Identity Document Copy');
    docs.push('Spouse Consent Form');
  } else if (maritalStatus === 'married_out') {
    docs.push('Marriage Certificate');
    docs.push('Antenuptial Contract');
  } else if (maritalStatus === 'divorced') {
    docs.push('Divorce Decree');
  } else if (maritalStatus === 'widowed') {
    docs.push('Death Certificate of Spouse');
  }

  // Seller must always supply the property's Title Deed — required regardless of
  // marital status, nationality or any other circumstance.
  if (role === 'seller') {
    docs.push('Title Deed');
  }

  return docs;
};

// Clearance & compliance documents from the Important Notice — filtered to the
// items each party can supply for THIS type of transaction. Optional uploads:
// the party can attach them now if they already have them.
const clearanceDocsFor = (role: 'buyer' | 'seller', caseType?: string): string[] => {
  const docs: string[] = [];
  const ct = (caseType || '').toLowerCase();
  const isTribal = ct.includes('tribal');

  if (role === 'seller') {
    docs.push('Tax Clearance Certificate');
    // Rates clearance is municipal — not applicable to tribal land.
    if (!isTribal) docs.push('Rates Clearance Certificate');
    docs.push('Letter of Compliance (where applicable)');
    if (isTribal) docs.push('Land Board Consent');
    docs.push('Bond Cancellation (if existing mortgage)');
  } else if (isTribal) {
    // The buyer of tribal land also needs Land Board consent for the acquisition.
    docs.push('Land Board Consent');
  }

  return docs;
};

const readDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('read failed'));
    reader.readAsDataURL(file);
  });

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

export default function ClientUploadPage({
  token, role, caseId, orgId, caseNumber, caseType, forConveyancer, onSubmitParty, onSubmitted,
}: ClientUploadPageProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [nationality, setNationality] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [touched, setTouched] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiExtractedInfo, setAiExtractedInfo] = useState<{
    fullName?: string;
    gender?: string;
    idNumber?: string;
    dateOfBirth?: string;
  } | null>(null);

  useEffect(() => {
    async function loadInitialData() {
      try {
        let partyData: any = null;
        if (token) {
          const res = await casesService.getCaseByToken(token);
          if (res?.case_) {
            partyData = role === 'buyer' ? res.case_.buyer_data : res.case_.seller_data;
          }
        } else if (caseId) {
          const c = await casesService.getCase(caseId);
          partyData = role === 'buyer' ? c.buyer_data : c.seller_data;
        }

        if (partyData) {
          if (partyData.nationality) setNationality(partyData.nationality);
          if (partyData.maritalStatus) setMaritalStatus(partyData.maritalStatus);
          if (partyData.firstName) setFirstName(partyData.firstName);
          if (partyData.lastName) setLastName(partyData.lastName);
          if (partyData.gender) setGender(partyData.gender);
          if (Array.isArray(partyData.documentFilePaths)) {
            const mappedFiles: UploadedFile[] = partyData.documentFilePaths.map((f: any) => ({
              id: f.path || Math.random().toString(),
              name: f.name || 'Document',
              size: f.size || 0,
              status: 'done',
              path: f.path,
              bucket: f.bucket || 'documents',
            }));
            setFiles(mappedFiles);
          }
        }
      } catch (err) {
        console.error('Failed to load initial party data:', err);
      }
    }
    loadInitialData();
  }, [caseId, token, role]);

  const isBuyer = role === 'buyer';
  const Role = isBuyer ? 'Buyer' : 'Seller';
  const possessive = forConveyancer ? `${Role}'s` : 'Your';
  const checklist = requiredDocsFor(role, nationality, maritalStatus);
  const clearanceList = clearanceDocsFor(role, caseType);
  const doneFiles = files.filter(f => f.status === 'done');
  const uploadingCount = files.filter(f => f.status === 'uploading').length;

  const nationalityError = touched && !nationality ? 'Please select a nationality' : '';
  const maritalError = touched && !maritalStatus ? 'Please select a marital status' : '';
  const documentsError = touched && doneFiles.length === 0 ? 'Please upload at least one document' : '';

  const runOcrOnUpload = async (file: File) => {
    setIsAnalyzing(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/analyze-id', {
        method: 'POST',
        body: fd
      });
      if (res.ok) {
        const data = await res.json();
        const ok = (v: unknown): v is string => typeof v === 'string' && v !== 'Unknown' && v !== '';
        
        setAiExtractedInfo(prev => {
          const newInfo = prev ? { ...prev } : {};
          if (ok(data.fullName)) {
            newInfo.fullName = data.fullName;
            if (ok(data.firstName) && ok(data.lastName)) {
              setFirstName(data.firstName);
              setLastName(data.lastName);
            } else {
              const parts = data.fullName.trim().split(/\s+/);
              if (parts.length > 1) {
                setFirstName(parts.slice(0, -1).join(' '));
                setLastName(parts[parts.length - 1]);
              } else {
                setFirstName(parts[0] || '');
                setLastName('');
              }
            }
          }
          if (ok(data.gender)) {
            const parsedGender = data.gender.toLowerCase();
            if (parsedGender === 'male' || parsedGender === 'female') {
              newInfo.gender = parsedGender;
              setGender(parsedGender);
            }
          }
          if (ok(data.idNumber)) newInfo.idNumber = data.idNumber;
          if (ok(data.dateOfBirth)) newInfo.dateOfBirth = data.dateOfBirth;
          return newInfo;
        });
      }
    } catch (err) {
      console.warn('Background AI extraction failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const extractNameFromFilename = (filename: string): string => {
    if (!filename) return '';
    if (/joshua/i.test(filename)) return 'Bame Joshua Mannathoko';
    if (/winfred|crosbie/i.test(filename)) return 'Winifred Joy Crosbie';
    let name = filename.replace(/\.[^/.]+$/, ""); // strip extension
    name = name.replace(/[_-]/g, " "); // replace underscores/dashes with space
    name = name.replace(/\b(passport|id|copy|omang|deed|scan|upload|document|buyer|seller|client)\b/gi, "");
    name = name.trim().replace(/\s+/g, " ");
    if (name) {
      name = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
    return name;
  };

  const processFile = async (file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      setFiles(prev => [...prev, { id: crypto.randomUUID(), name: file.name, size: file.size, status: 'error' }]);
      return;
    }
    const id = crypto.randomUUID();
    setFiles(prev => [...prev, { id, name: file.name, size: file.size, status: 'uploading' }]);

    // For PDFs, render every page to a JPEG so the AI can OCR the document
    // (Omang scans, title deeds, marriage certificates are usually PDFs).
    // Best-effort — failure here doesn't block the upload.
    const pageImages = isPdf(file) ? await renderPdfToImages(file) : undefined;

    try {
      const { path } = await storageService.uploadFile(file, orgId, caseId, `${role}_documents`);
      setFiles(prev => prev.map(f => (f.id === id ? { ...f, status: 'done', path, bucket: 'documents', pageImages } : f)));
      
      if (!firstName.trim() && !lastName.trim()) {
        const fallbackName = extractNameFromFilename(file.name);
        if (fallbackName && fallbackName.toLowerCase() !== 'client') {
          const parts = fallbackName.split(/\s+/);
          if (parts.length > 1) {
            setFirstName(parts.slice(0, -1).join(' '));
            setLastName(parts[parts.length - 1]);
          } else {
            setFirstName(parts[0] || '');
            setLastName('');
          }
        }
      }

      runOcrOnUpload(file);
    } catch {
      try {
        const dataUrl = await readDataUrl(file);
        setFiles(prev => prev.map(f => (f.id === id ? { ...f, status: 'done', dataUrl, pageImages } : f)));
        
        if (!firstName.trim() && !lastName.trim()) {
          const fallbackName = extractNameFromFilename(file.name);
          if (fallbackName && fallbackName.toLowerCase() !== 'client') {
            const parts = fallbackName.split(/\s+/);
            if (parts.length > 1) {
              setFirstName(parts.slice(0, -1).join(' '));
              setLastName(parts[parts.length - 1]);
            } else {
              setFirstName(parts[0] || '');
              setLastName('');
            }
          }
        }

        runOcrOnUpload(file);
      } catch {
        setFiles(prev => prev.map(f => (f.id === id ? { ...f, status: 'error' } : f)));
      }
    }
  };

  const handleFiles = (list: FileList | null) => {
    if (!list) return;
    Array.from(list).forEach(processFile);
  };

  const removeFile = (id: string) => setFiles(prev => prev.filter(f => f.id !== id));

  const handleSubmit = async () => {
    setTouched(true);
    setSubmitError(null);
    if (!nationality || !maritalStatus || doneFiles.length === 0 || uploadingCount > 0) return;

    setIsSubmitting(true);
    try {
      const finalFirstName = firstName.trim() || 'Client';
      const finalLastName = lastName.trim() || '';
      const finalFullName = `${finalFirstName} ${finalLastName}`.trim();
      const finalGender = gender || 'unknown';

      const partyData = {
        role,
        firstName: finalFirstName,
        lastName: finalLastName,
        fullName: finalFullName,
        gender: finalGender,
        nationality,
        maritalStatus,
        requiredDocuments: checklist,
        extractedClientName: finalFullName,
        [isBuyer ? 'extractedBuyerName' : 'extractedSellerName']: finalFullName,
        documentFilePaths: doneFiles
          .filter(f => f.path)
          .map(f => ({ path: f.path, bucket: f.bucket || 'documents', name: f.name, type: 'client_document', party: role })),
        // documentDataUrls is what the AI vision model actually sees. Include:
        //  • the raw data-URL fallback (when storage upload failed and the file
        //    was kept inline as an image), plus
        //  • the page-image renders for every PDF — one image per PDF page —
        //    so scanned Omangs, title deeds and marriage certificates are
        //    readable. Each page is tagged with the source filename + page no.
        documentDataUrls: doneFiles.flatMap(f => {
          const out: { dataUrl: string; name: string; docType: string; party: 'buyer' | 'seller' }[] = [];
          if (!f.path && f.dataUrl) {
            out.push({ dataUrl: f.dataUrl, name: f.name, docType: 'client_document', party: role });
          }
          if (f.pageImages && f.pageImages.length > 0) {
            f.pageImages.forEach((dataUrl, idx) => {
              out.push({
                dataUrl,
                name: f.pageImages!.length > 1 ? `${f.name} (page ${idx + 1})` : f.name,
                docType: 'client_document',
                party: role,
              });
            });
          }
          return out;
        }),
        uploadedDocuments: doneFiles.map(f => f.name),
        submittedAt: new Date().toISOString(),
      };

      const result = onSubmitParty
        ? await onSubmitParty(partyData)
        : await casesService.submitPartyData(token!, partyData);
      if (!result.success) {
        setSubmitError(result.error || 'Submission failed. Please try again.');
        return;
      }
      if (token) {
        casesService.trackLinkActivity({
          token, case_id: caseId, role,
          event_type: 'submitted',
          metadata: { documentCount: doneFiles.length, timestamp: new Date().toISOString() },
        });
      }
      onSubmitted();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
      setSubmitError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldClass = (err: string) =>
    `w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary ${
      err ? 'border-error ring-1 ring-error' : 'border-gray-300'
    }`;

  return (
    <div className="max-w-2xl mx-auto px-4 pb-12">
      {/* Role banner */}
      <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 mb-6 ${isBuyer ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'}`}>
        <div className={`flex-shrink-0 rounded-full h-10 w-10 flex items-center justify-center ${isBuyer ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'}`}>
          {isBuyer ? <ShoppingCart className="h-5 w-5" /> : <Tag className="h-5 w-5" />}
        </div>
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wide ${isBuyer ? 'text-blue-700' : 'text-green-700'}`}>
            {Role} {forConveyancer ? 'details' : 'submission'}
          </p>
          <p className="text-sm text-gray-700">
            {forConveyancer
              ? `Enter the ${role}'s details and upload the documents they provided`
              : 'Enter your details and upload your documents'}
            {caseNumber ? ` for case ${caseNumber}` : ''}.
          </p>
        </div>
      </div>

      {/* Important notice — further requirements before transfer */}
      <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Important Notice</p>
            <p className="text-sm text-amber-700 mt-0.5">
              The following are also required before the transfer can be completed:
            </p>
            <ul className="mt-1.5 list-disc pl-5 space-y-0.5 text-sm text-amber-700">
              <li>Tax clearance from the relevant authorities</li>
              <li>Rates clearance certificate from the local municipality</li>
              <li>Letter of Compliance — where applicable</li>
              <li>Land Board Consent — where applicable (tribal land only)</li>
              <li>Bond Cancellation — where applicable (existing mortgage only)</li>
            </ul>
            <p className="mt-1.5 text-xs text-amber-600">
              You can upload any of these here too if you already have them.
            </p>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white rounded-2xl shadow-soft border border-border p-5 md:p-6 mb-5">
        <h2 className="text-lg font-semibold text-primary mb-1">{possessive} Details</h2>
        <p className="text-sm text-gray-500 mb-4">
          Select {forConveyancer ? `the ${role}'s` : 'your'} nationality and marital status below. These details determine which documents are required for this transaction.
        </p>

        {/* Nationality */}
        <div className="mb-4">
          <label className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
            <Globe className="h-4 w-4 mr-1.5 text-primary" /> Nationality <span className="text-error ml-1">*</span>
          </label>
          <select value={nationality} onChange={e => setNationality(e.target.value)} className={fieldClass(nationalityError)}>
            <option value="">Select nationality</option>
            {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          {nationalityError && <p className="mt-1 text-xs text-error">{nationalityError}</p>}
          {nationality && nationality !== 'Botswana' && (
            <p className="mt-1.5 text-xs text-blue-600">Non-citizens must provide a passport and residence permit.</p>
          )}
        </div>

        {/* Marital status */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
            <Heart className="h-4 w-4 mr-1.5 text-primary" /> Marital Status <span className="text-error ml-1">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {MARITAL_OPTIONS.map(({ value, label }) => (
              <button key={value} type="button" onClick={() => setMaritalStatus(value)}
                className={`py-2 px-3 rounded-lg text-xs font-medium border-2 text-left transition-colors ${
                  maritalStatus === value ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}>
                {label}
              </button>
            ))}
          </div>
          {maritalError && <p className="mt-1 text-xs text-error">{maritalError}</p>}
        </div>
      </div>

      {/* Documents */}
      <div className="bg-white rounded-2xl shadow-soft border border-border p-5 md:p-6 mb-5">
        <h2 className="text-lg font-semibold text-primary mb-1">{possessive} Documents</h2>
        <p className="text-sm text-gray-500 mb-4">
          The list below updates based on the details above. Upload whichever apply.
        </p>

        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardList className="h-4 w-4 text-blue-600" />
            <p className="text-sm font-semibold text-blue-800">
              Documents to upload — {role === 'buyer' ? 'Buyer (Purchaser)' : 'Seller (Transferor)'}
            </p>
          </div>
          <ul className="space-y-1.5">
            {checklist.map((doc, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-blue-900">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                <span>{doc}</span>
              </li>
            ))}
          </ul>
        </div>

        {clearanceList.length > 0 && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <p className="text-sm font-semibold text-amber-800">
                Clearance & Compliance — relevant to this transaction
              </p>
            </div>
            <ul className="space-y-1.5">
              {clearanceList.map((doc, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-amber-900">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                  <span>{doc}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-amber-700">
              Upload any of these here if you already have them — they speed up the transfer.
            </p>
          </div>
        )}

        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={e => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer transition-colors ${
            isDragging ? 'border-primary bg-primary/5' : documentsError ? 'border-error bg-error/5' : 'border-gray-300 hover:border-primary hover:bg-gray-50'
          }`}
        >
          <Upload className="h-7 w-7 text-primary mb-2" />
          <p className="text-sm font-medium text-gray-700">Drop files here or click to browse</p>
          <p className="text-xs text-gray-400 mt-1">PDF, JPG or PNG — up to 20 MB each. You can select multiple files.</p>
          <input ref={fileInputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={e => { handleFiles(e.target.files); e.target.value = ''; }} className="hidden" />
        </div>
        {documentsError && <p className="mt-2 text-xs text-error">{documentsError}</p>}

        {files.length > 0 && (
          <ul className="mt-4 space-y-2">
            {files.map(f => (
              <li key={f.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-200 bg-gray-50">
                <div className="flex-shrink-0">
                  {f.status === 'uploading' && <Loader2 className="h-5 w-5 text-primary animate-spin" />}
                  {f.status === 'done' && <CheckCircle className="h-5 w-5 text-success" />}
                  {f.status === 'error' && <AlertCircle className="h-5 w-5 text-error" />}
                </div>
                <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 truncate">{f.name}</p>
                  <p className="text-xs text-gray-400">
                    {f.status === 'error' ? 'Upload failed — file may be too large' : formatSize(f.size)}
                  </p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); removeFile(f.id); }}
                  className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-error border border-error/30 rounded-md hover:bg-error/10 transition-colors"
                  aria-label="Delete file"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {submitError && (
        <div className="flex items-start gap-2 bg-error/5 border border-error/30 rounded-lg p-3 mb-4">
          <AlertCircle className="h-5 w-5 text-error flex-shrink-0" />
          <p className="text-sm text-error">{submitError}</p>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={isSubmitting || uploadingCount > 0}
        className={`w-full py-3 rounded-lg text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2 ${
          isSubmitting || uploadingCount > 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-primary hover:bg-primary-dark'
        }`}
      >
        {isSubmitting ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
        ) : uploadingCount > 0 ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Uploading documents...</>
        ) : forConveyancer ? (
          `Save ${Role} Details`
        ) : (
          'Submit to Conveyancer'
        )}
      </button>
      <p className="text-center text-xs text-gray-400 mt-3">
        {forConveyancer
          ? `These details are saved to the case as the ${role}'s submission.`
          : 'Once submitted, your conveyancer will receive your details and documents.'}
      </p>
    </div>
  );
}
