import React, { useRef, useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, X, ShoppingCart, Tag } from 'lucide-react';
import * as storageService from '../services/storage.service';
import * as casesService from '../services/cases.service';

interface ClientUploadPageProps {
  token: string;
  role: 'buyer' | 'seller';
  caseId: string;
  orgId: string;
  caseNumber?: string;
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
}

const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20 MB per file

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

export default function ClientUploadPage({ token, role, caseId, orgId, caseNumber, onSubmitted }: ClientUploadPageProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [touched, setTouched] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isBuyer = role === 'buyer';
  const doneFiles = files.filter(f => f.status === 'done');
  const uploadingCount = files.filter(f => f.status === 'uploading').length;

  const firstNameError = touched && !firstName.trim() ? 'First name is required' : '';
  const lastNameError = touched && !lastName.trim() ? 'Surname is required' : '';
  const documentsError = touched && doneFiles.length === 0 ? 'Please upload at least one document' : '';

  const processFile = async (file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      setFiles(prev => [
        ...prev,
        { id: crypto.randomUUID(), name: file.name, size: file.size, status: 'error' },
      ]);
      return;
    }
    const id = crypto.randomUUID();
    setFiles(prev => [...prev, { id, name: file.name, size: file.size, status: 'uploading' }]);
    try {
      const { path } = await storageService.uploadFile(file, orgId, caseId, `${role}_documents`);
      setFiles(prev => prev.map(f => (f.id === id ? { ...f, status: 'done', path, bucket: 'documents' } : f)));
    } catch {
      // Storage may be unavailable for an unauthenticated client — embed the file instead
      try {
        const dataUrl = await readDataUrl(file);
        setFiles(prev => prev.map(f => (f.id === id ? { ...f, status: 'done', dataUrl } : f)));
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
    if (!firstName.trim() || !lastName.trim() || doneFiles.length === 0 || uploadingCount > 0) return;

    setIsSubmitting(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const partyData = {
        role,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        fullName,
        // Name keys the conveyancer side and document generation read from
        extractedClientName: fullName,
        [isBuyer ? 'extractedBuyerName' : 'extractedSellerName']: fullName,
        documentFilePaths: doneFiles
          .filter(f => f.path)
          .map(f => ({ path: f.path, bucket: f.bucket || 'documents', name: f.name, type: 'client_document', party: role })),
        documentDataUrls: doneFiles
          .filter(f => !f.path && f.dataUrl)
          .map(f => ({ dataUrl: f.dataUrl, name: f.name, docType: 'client_document', party: role })),
        uploadedDocuments: doneFiles.map(f => f.name),
        submittedAt: new Date().toISOString(),
      };

      const result = await casesService.submitPartyData(token, partyData);
      if (!result.success) {
        setSubmitError(result.error || 'Submission failed. Please try again.');
        return;
      }
      casesService.trackLinkActivity({
        token,
        case_id: caseId,
        role,
        event_type: 'submitted',
        metadata: { documentCount: doneFiles.length, timestamp: new Date().toISOString() },
      });
      onSubmitted();
    } catch (err: any) {
      setSubmitError(err?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pb-12">
      {/* Role banner */}
      <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 mb-6 ${isBuyer ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'}`}>
        <div className={`flex-shrink-0 rounded-full h-10 w-10 flex items-center justify-center ${isBuyer ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'}`}>
          {isBuyer ? <ShoppingCart className="h-5 w-5" /> : <Tag className="h-5 w-5" />}
        </div>
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wide ${isBuyer ? 'text-blue-700' : 'text-green-700'}`}>
            {isBuyer ? 'Buyer' : 'Seller'} submission
          </p>
          <p className="text-sm text-gray-700">
            Enter your name and upload your documents{caseNumber ? ` for case ${caseNumber}` : ''}.
          </p>
        </div>
      </div>

      {/* Your details */}
      <div className="bg-white rounded-2xl shadow-soft border border-border p-5 md:p-6 mb-5">
        <h2 className="text-lg font-semibold text-primary mb-1">Your Details</h2>
        <p className="text-sm text-gray-500 mb-4">
          Please enter your full legal name exactly as it appears on your ID or passport.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              placeholder="e.g. Kabo"
              className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary ${
                firstNameError ? 'border-error ring-1 ring-error' : 'border-gray-300'
              }`}
            />
            {firstNameError && <p className="mt-1 text-xs text-error">{firstNameError}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Surname <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              placeholder="e.g. Molefe"
              className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary ${
                lastNameError ? 'border-error ring-1 ring-error' : 'border-gray-300'
              }`}
            />
            {lastNameError && <p className="mt-1 text-xs text-error">{lastNameError}</p>}
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="bg-white rounded-2xl shadow-soft border border-border p-5 md:p-6 mb-5">
        <h2 className="text-lg font-semibold text-primary mb-1">Your Documents</h2>
        <p className="text-sm text-gray-500 mb-4">
          Upload all documents relevant to this transaction — for example your Omang/ID or passport,
          proof of address, marriage certificate, and the title deed or agreement of sale.
        </p>

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
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={e => { handleFiles(e.target.files); e.target.value = ''; }}
            className="hidden"
          />
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
                  className="flex-shrink-0 p-1 text-gray-400 hover:text-error transition-colors"
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4" />
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
          <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
        ) : uploadingCount > 0 ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Uploading documents...</>
        ) : (
          'Submit to Conveyancer'
        )}
      </button>
      <p className="text-center text-xs text-gray-400 mt-3">
        Once submitted, your conveyancer will receive your details and documents.
      </p>
    </div>
  );
}
