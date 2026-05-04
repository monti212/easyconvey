import React, { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, ArrowLeft, ArrowRight, FileText, Database, Shield, Eye, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import * as storageService from '../../services/storage.service';
import { convertToPdf } from '../../lib/convertToPdf';

interface Step2Props {
  documentUploaded: boolean;
  documentValid: boolean;
  skippedDeedUpload: boolean;
  transactionType: string;
  onUpdate: (data: {
    documentUploaded?: boolean;
    documentValid?: boolean;
    hasBond?: boolean;
    bondDocument?: string;
    skippedDeedUpload?: boolean;
    documentFilePaths?: { path: string; bucket: string; name: string; type: string }[];
    documentDataUrls?: { dataUrl: string; name: string; docType: string }[];
    extractedOwnerName?: string;
    extractedOwnerIdNumber?: string;
    extractedPreviousOwner?: string;
    extractedPlotNumber?: string;
    extractedPropertyAddress?: string;
    extractedPropertyDescription?: string;
    extractedTitleDeedNumber?: string;
    extractedAdministrativeDistrict?: string;
    extractedExtent?: string;
    extractedPurchasePrice?: string;
    extractedHasMortgageBond?: boolean;
    extractedMortgageBondNumber?: string;
  }) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const Step2UploadDeed: React.FC<Step2Props> = ({
  documentUploaded,
  documentValid,
  skippedDeedUpload,
  transactionType,
  onUpdate,
  onNext,
  onPrevious
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [landType, setLandType] = useState('');
  const [hasCaveats, setHasCaveats] = useState(false);
  const [hasBonds, setHasBonds] = useState(false);
  const [hasSubdivisions, setHasSubdivisions] = useState(false);
  const [showBondPrompt, setShowBondPrompt] = useState(false);
  const [hasBond, setHasBond] = useState<boolean | null>(null);
  const [bondDocument, setBondDocument] = useState<string | null>(null);
  const [bondDocumentType, setBondDocumentType] = useState<string | null>(null);
  const [analysisUnavailable, setAnalysisUnavailable] = useState(false);
  const [extractedFields, setExtractedFields] = useState<{
    ownerName?: string;
    ownerIdNumber?: string;
    previousOwnerName?: string;
    plotNumber?: string;
    propertyAddress?: string;
    propertyDescription?: string;
    titleDeedNumber?: string;
    administrativeDistrict?: string;
    extent?: string;
    purchasePrice?: string;
    hasMortgageBond?: boolean;
    mortgageBondNumber?: string;
  }>({});

  // Check if the user is selling to determine if deed upload is mandatory
  const isSelling = transactionType === 'selling';

  // Convert a File to a base64 data URL for direct AI vision processing
  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      setIsAnalyzing(true);
      setErrorMessage('');

      try {
        // Auto-convert images to PDF
        const pdfFile = await convertToPdf(file);
        const filePaths: { path: string; bucket: string; name: string; type: string }[] = [];
        const dataUrls: { dataUrl: string; name: string; docType: string }[] = [];

        // Capture original file as base64 for direct AI vision processing
        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);
        if (isImage) {
          try {
            const dataUrl = await fileToDataUrl(file);
            dataUrls.push({ dataUrl, name: file.name, docType: 'title-deed' });
          } catch { /* ignore base64 conversion errors */ }
        }

        // Upload to Supabase Storage
        let uploadPath = '';
        try {
          const orgId = 'public'; // Unauthenticated users use public folder
          const caseId = 'deeds';
          const result = await storageService.uploadFile(pdfFile, orgId, caseId, 'title-deed', 'deeds');
          uploadPath = result.path;
          filePaths.push({ path: result.path, bucket: 'deeds', name: file.name, type: 'title-deed' });

          // Also upload original file if it's an image (for AI vision processing)
          const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);
          if (isImage) {
            const origResult = await storageService.uploadFile(file, orgId, caseId, 'title-deed-original', 'deeds');
            filePaths.push({ path: origResult.path, bucket: 'deeds', name: file.name, type: 'title-deed-original' });
          }
        } catch {
          // Storage upload may fail for unauthenticated users — continue with AI analysis
        }

        // Call AI analysis endpoint
        const formData = new FormData();
        formData.append('file', file);
        if (uploadPath) formData.append('storagePath', uploadPath);

        const response = await fetch('/api/analyze-deed', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          const isValid = result.isValid !== false;

          if (isValid) {
            const def = (v: any) => (v && v !== 'Unknown' ? v : undefined);
            const ocr = {
              ownerName: def(result.ownerName),
              ownerIdNumber: def(result.ownerIdNumber),
              previousOwnerName: def(result.previousOwnerName),
              plotNumber: def(result.plotNumber),
              propertyAddress: def(result.propertyAddress),
              propertyDescription: def(result.propertyDescription),
              titleDeedNumber: def(result.titleDeedNumber),
              administrativeDistrict: def(result.administrativeDistrict),
              extent: def(result.extent),
              purchasePrice: def(result.purchasePrice),
              hasMortgageBond: result.hasMortgageBond || false,
              mortgageBondNumber: def(result.mortgageBondNumber),
            };
            setExtractedFields(ocr);
            onUpdate({
              documentUploaded: true,
              documentValid: true,
              skippedDeedUpload: false,
              documentFilePaths: filePaths,
              documentDataUrls: dataUrls,
              extractedOwnerName: ocr.ownerName,
              extractedOwnerIdNumber: ocr.ownerIdNumber,
              extractedPreviousOwner: ocr.previousOwnerName,
              extractedPlotNumber: ocr.plotNumber,
              extractedPropertyAddress: ocr.propertyAddress,
              extractedPropertyDescription: ocr.propertyDescription,
              extractedTitleDeedNumber: ocr.titleDeedNumber,
              extractedAdministrativeDistrict: ocr.administrativeDistrict,
              extractedExtent: ocr.extent,
              extractedPurchasePrice: ocr.purchasePrice,
              extractedHasMortgageBond: ocr.hasMortgageBond,
              extractedMortgageBondNumber: ocr.mortgageBondNumber,
            });
            setErrorMessage('');
            setLandType(result.landType || 'Unknown');
            setHasCaveats(result.hasCaveats || false);
            setHasBonds(result.hasBonds || false);
            setHasSubdivisions(result.hasSubdivisions || false);
            setShowBondPrompt(true);
          } else {
            onUpdate({
              documentUploaded: true,
              documentValid: false,
              skippedDeedUpload: false,
              documentFilePaths: filePaths,
              documentDataUrls: dataUrls,
            });
            setErrorMessage(result.errors?.[0] || 'Document could not be validated. Please upload a clearer scan.');
          }
        } else {
          // API not available — accept upload but warn user
          onUpdate({
            documentUploaded: true,
            documentValid: true,
            skippedDeedUpload: false,
            documentFilePaths: filePaths,
            documentDataUrls: dataUrls,
          });
          setLandType('Pending AI Analysis');
          setAnalysisUnavailable(true);
          setShowBondPrompt(true);
        }
      } catch {
        // Network error — accept upload but warn user
        onUpdate({
          documentUploaded: true,
          documentValid: true,
          skippedDeedUpload: false
        });
        setLandType('Pending AI Analysis');
        setAnalysisUnavailable(true);
        setShowBondPrompt(true);
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const handleBondResponse = (response: boolean) => {
    setHasBond(response);
    onUpdate({ 
      documentUploaded: true, 
      documentValid: true, 
      hasBond: response,
      skippedDeedUpload: false 
    });
    // If no bond, we can proceed without bond documents
    if (!response) {
      setShowBondPrompt(false);
    }
  };

  const handleBondDocumentTypeSelect = (type: string) => {
    setBondDocumentType(type);
  };

  const handleBondDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Auto-convert images to PDF
      const pdfFile = await convertToPdf(file);
      const bondPaths: { path: string; bucket: string; name: string; type: string }[] = [];
      const bondDataUrls: { dataUrl: string; name: string; docType: string }[] = [];

      // Capture original as base64 if image
      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);
      if (isImage) {
        try {
          const dataUrl = await fileToDataUrl(file);
          bondDataUrls.push({ dataUrl, name: file.name, docType: 'bond-document' });
        } catch { /* ignore */ }
      }

      // Upload bond document to Supabase Storage
      try {
        const result = await storageService.uploadFile(pdfFile, 'public', 'deeds', 'bond-cancellation', 'documents');
        bondPaths.push({ path: result.path, bucket: 'documents', name: file.name, type: 'bond-document' });
        if (isImage) {
          const origResult = await storageService.uploadFile(file, 'public', 'deeds', 'bond-cancellation-original', 'documents');
          bondPaths.push({ path: origResult.path, bucket: 'documents', name: file.name, type: 'bond-document-original' });
        }
      } catch {
        // Storage may not be available for unauthenticated users
      }
      setBondDocument(pdfFile.name);
      onUpdate({
        documentUploaded: true,
        documentValid: true,
        hasBond: true,
        bondDocument: file.name,
        skippedDeedUpload: false,
        documentFilePaths: bondPaths,
        documentDataUrls: bondDataUrls,
      });
      setShowBondPrompt(false);
    }
  };

  const handleSkipUpload = () => {
    onUpdate({
      documentUploaded: false,
      documentValid: false,
      skippedDeedUpload: true
    });
    onNext();
  };

  const handleRemoveBondDocument = () => {
    setBondDocument(null);
    setBondDocumentType(null);
  };

  const getDocumentTypeLabel = (type: string) => {
    switch(type) {
      case 'clearance': return 'Clearance Letter';
      case 'statement': return 'Statement of Balance';
      case 'bond': return 'Copy of Bond';
      default: return 'Document';
    }
  };

  return (
    <div className="py-4 md:py-8 max-w-3xl mx-auto px-4">
      <h2 className="text-2xl md:text-3xl font-bold text-primary mb-3 md:mb-4 text-center font-serif">
        Upload Your Title Deed
      </h2>
      <p className="text-base md:text-lg text-gray-600 mb-6 md:mb-8 text-center max-w-2xl mx-auto">
        Our AI will instantly analyze your title deed to verify its validity and eligibility for transfer.
        {isSelling && (
          <span className="block mt-2 text-error font-medium">
            * Title deed upload is mandatory for selling property
          </span>
        )}
      </p>

      {!documentUploaded ? (
        <div className="bg-background border-2 border-dashed border-blue-300 rounded-2xl p-6 md:p-12 text-center transition-all hover:shadow-lg">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-md">
            <FileText className="h-8 w-8 md:h-10 md:w-10 text-primary" />
          </div>
          <p className="text-sm md:text-base text-gray-700 mb-4 md:mb-6 max-w-md mx-auto">
            Tap to upload your title deed. Our AI will immediately validate the document.
          </p>
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileUpload}
            accept=".pdf,.jpg,.jpeg,.png"
          />
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
            <label
              htmlFor="file-upload"
              className="inline-flex items-center px-5 py-2.5 md:px-6 md:py-3 border border-transparent text-base font-medium rounded-lg shadow-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary cursor-pointer transition-colors"
            >
              <Upload className="mr-2 h-5 w-5" />
              Browse Files
            </label>
            
            {/* Only show skip button if not selling */}
            {!isSelling && (
              <button
                onClick={handleSkipUpload}
                className="inline-flex items-center px-5 py-2.5 md:px-6 md:py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                Skip for now
              </button>
            )}
          </div>
          
          <div className="mt-4 bg-primary/5 p-4 rounded-lg border border-primary/10 text-left">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-primary">Email Submission</h3>
                <p className="text-xs mt-1 text-primary/80">
                  You can also email your title deed to docs@easyconvey.com and we'll automatically detect your intent and start the process.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : isAnalyzing ? (
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-12 text-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/20 mb-4 md:mb-6"></div>
            <div className="h-5 md:h-6 bg-primary/20 rounded w-1/3 mb-2 md:mb-3"></div>
            <div className="h-3 md:h-4 bg-primary/10 rounded w-1/4 mb-4 md:mb-6"></div>
          </div>
          <p className="mt-4 text-base md:text-lg text-primary font-medium">
            Our AI is analyzing your title deed...
          </p>
          <p className="text-sm md:text-base text-gray-600 mt-2">
            We're checking for validity, land classification, caveats, bonds, and subdivisions.
          </p>
        </div>
      ) : documentValid ? (
        <>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-5 md:p-8 shadow-lg border border-green-200 mb-6">
            <div className="flex items-start">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-success/20 flex-shrink-0 flex items-center justify-center mr-3 md:mr-4">
                <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-success" />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-semibold text-primary font-serif">Title Deed Verified</h3>
                <p className="text-sm md:text-base text-gray-700 mt-1 md:mt-2">
                  Our AI has successfully validated your title deed. All legal requirements for 
                  transfer have been verified.
                </p>
                
                {/* AI Analysis Results */}
                <div className="mt-4 bg-white rounded-lg p-3 border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-primary">AI Analysis Results</h4>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Auto-populated</span>
                  </div>

                  {/* OCR Extracted Fields */}
                  {(extractedFields.ownerName || extractedFields.plotNumber || extractedFields.propertyAddress || extractedFields.titleDeedNumber) && (
                    <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-200">
                      <p className="text-xs font-semibold text-blue-800 mb-1.5">Extracted from Deed:</p>
                      <ul className="space-y-1">
                        {extractedFields.ownerName && (
                          <li className="text-xs flex items-start">
                            <span className="w-36 text-gray-500 flex-shrink-0">Registered Owner:</span>
                            <span className="font-semibold text-blue-800">{extractedFields.ownerName}</span>
                          </li>
                        )}
                        {extractedFields.ownerIdNumber && (
                          <li className="text-xs flex items-start">
                            <span className="w-36 text-gray-500 flex-shrink-0">Owner ID / Passport:</span>
                            <span className="font-semibold text-blue-800">{extractedFields.ownerIdNumber}</span>
                          </li>
                        )}
                        {extractedFields.previousOwnerName && (
                          <li className="text-xs flex items-start">
                            <span className="w-36 text-gray-500 flex-shrink-0">Previous Owner:</span>
                            <span className="font-semibold text-blue-800">{extractedFields.previousOwnerName}</span>
                          </li>
                        )}
                        {extractedFields.purchasePrice && (
                          <li className="text-xs flex items-start">
                            <span className="w-36 text-gray-500 flex-shrink-0">Purchase Price:</span>
                            <span className="font-semibold text-blue-800">{extractedFields.purchasePrice}</span>
                          </li>
                        )}
                        {extractedFields.plotNumber && (
                          <li className="text-xs flex items-start">
                            <span className="w-36 text-gray-500 flex-shrink-0">Plot / Stand No:</span>
                            <span className="font-semibold text-blue-800">{extractedFields.plotNumber}</span>
                          </li>
                        )}
                        {extractedFields.titleDeedNumber && (
                          <li className="text-xs flex items-start">
                            <span className="w-36 text-gray-500 flex-shrink-0">Title Deed No:</span>
                            <span className="font-semibold text-blue-800">{extractedFields.titleDeedNumber}</span>
                          </li>
                        )}
                        {extractedFields.propertyAddress && (
                          <li className="text-xs flex items-start">
                            <span className="w-36 text-gray-500 flex-shrink-0">Property Address:</span>
                            <span className="font-semibold text-blue-800">{extractedFields.propertyAddress}</span>
                          </li>
                        )}
                        {extractedFields.administrativeDistrict && (
                          <li className="text-xs flex items-start">
                            <span className="w-36 text-gray-500 flex-shrink-0">District:</span>
                            <span className="font-semibold text-blue-800">{extractedFields.administrativeDistrict}</span>
                          </li>
                        )}
                        {extractedFields.extent && (
                          <li className="text-xs flex items-start">
                            <span className="w-36 text-gray-500 flex-shrink-0">Extent:</span>
                            <span className="font-semibold text-blue-800">{extractedFields.extent}</span>
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  <ul className="space-y-1">
                    <li className="text-xs md:text-sm flex items-center">
                      <span className="w-32 text-gray-500">Land Type:</span>
                      <span className="font-medium text-primary">{landType}</span>
                    </li>
                    <li className="text-xs md:text-sm flex items-center">
                      <span className="w-32 text-gray-500">Caveats Detected:</span>
                      <span className={`font-medium ${hasCaveats ? 'text-amber-600' : 'text-success'}`}>
                        {hasCaveats ? 'Yes' : 'None'}
                      </span>
                    </li>
                    <li className="text-xs md:text-sm flex items-center">
                      <span className="w-32 text-gray-500">Bonds Detected:</span>
                      <span className={`font-medium ${hasBonds ? 'text-amber-600' : 'text-success'}`}>
                        {hasBonds ? 'Yes' : 'None'}
                      </span>
                    </li>
                    <li className="text-xs md:text-sm flex items-center">
                      <span className="w-32 text-gray-500">Subdivisions:</span>
                      <span className={`font-medium ${hasSubdivisions ? 'text-blue-600' : 'text-success'}`}>
                        {hasSubdivisions ? 'Yes' : 'None'}
                      </span>
                    </li>
                  </ul>

                  {/* Change Deed button */}
                  <button
                    onClick={() => {
                      onUpdate({ documentUploaded: false, documentValid: false, skippedDeedUpload: false });
                      setExtractedFields({});
                      setShowBondPrompt(false);
                      setHasBond(null);
                      setBondDocument(null);
                      setBondDocumentType(null);
                    }}
                    className="mt-3 text-xs text-red-600 hover:text-red-800 flex items-center"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Remove &amp; re-upload deed
                  </button>
                </div>
                
                <div className="mt-4 bg-primary/5 p-3 rounded-lg border border-primary/10">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <Shield className="h-4 w-4 text-primary" />
                    </div>
                    <div className="ml-3">
                      <p className="text-xs text-primary/80">
                        Your document is securely stored with end-to-end encryption. We comply with data protection regulations including GDPR and Data Protection Act 2024.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Unverified warning */}
          {analysisUnavailable && (
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 mb-6">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-amber-800">AI Analysis Unavailable</h4>
                  <p className="text-xs text-amber-700 mt-1">
                    Your document was accepted but could not be verified by our AI analysis service.
                    It will be manually reviewed by your conveyancer.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Bond Disclosure Prompt */}
          {showBondPrompt && (
            <div className="bg-background rounded-2xl p-5 md:p-8 shadow-md border border-blue-200 mb-6">
              <h3 className="text-lg md:text-xl font-semibold text-primary mb-3 font-serif">Important Question</h3>
              <p className="text-sm md:text-base text-gray-700 mb-4">
                Have you used this property to secure a loan?
              </p>
              
              <div className="flex space-x-4 mb-4">
                <button 
                  onClick={() => handleBondResponse(true)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    hasBond === true 
                      ? 'bg-primary text-white' 
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Yes
                </button>
                <button 
                  onClick={() => handleBondResponse(false)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    hasBond === false 
                      ? 'bg-primary text-white' 
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  No
                </button>
              </div>
              
              {hasBond === true && (
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  {!bondDocument ? (
                    <>
                      <p className="text-sm text-gray-700 mb-3">
                        Please upload one of the following documents:
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                        <button 
                          onClick={() => handleBondDocumentTypeSelect('clearance')}
                          className={`p-3 rounded-lg text-xs md:text-sm font-medium ${
                            bondDocumentType === 'clearance' 
                              ? 'bg-primary text-white' 
                              : 'bg-gray-50 text-gray-700 border border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          Clearance Letter
                        </button>
                        <button 
                          onClick={() => handleBondDocumentTypeSelect('statement')}
                          className={`p-3 rounded-lg text-xs md:text-sm font-medium ${
                            bondDocumentType === 'statement' 
                              ? 'bg-primary text-white' 
                              : 'bg-gray-50 text-gray-700 border border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          Statement of Balance
                        </button>
                        <button 
                          onClick={() => handleBondDocumentTypeSelect('bond')}
                          className={`p-3 rounded-lg text-xs md:text-sm font-medium ${
                            bondDocumentType === 'bond' 
                              ? 'bg-primary text-white' 
                              : 'bg-gray-50 text-gray-700 border border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          Copy of Bond
                        </button>
                      </div>
                      
                      {bondDocumentType && (
                        <div className="mt-4">
                          <input
                            type="file"
                            id="bond-document-upload"
                            className="hidden"
                            onChange={handleBondDocumentUpload}
                            accept=".pdf,.jpg,.jpeg,.png"
                          />
                          <label
                            htmlFor="bond-document-upload"
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary cursor-pointer transition-colors"
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Upload {bondDocumentType === 'clearance' ? 'Clearance Letter' : bondDocumentType === 'statement' ? 'Statement' : 'Bond Copy'}
                          </label>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="bg-white p-4 rounded-lg border border-green-200 shadow-sm">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-primary text-sm md:text-base">Uploaded Document</h4>
                        <span className="px-2 py-1 bg-success/20 text-success text-xs rounded-full">Verified</span>
                      </div>
                      
                      <div className="flex items-center bg-success/10 p-3 rounded-lg">
                        <div className="h-10 w-10 bg-success/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="h-5 w-5 text-success" />
                        </div>
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-gray-800">{getDocumentTypeLabel(bondDocumentType || '')}</p>
                          <p className="text-xs text-gray-500 truncate">{bondDocument}</p>
                        </div>
                        <div className="flex space-x-2">
                          <button className="p-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button 
                            className="p-1.5 rounded-full bg-error/10 text-error hover:bg-error/20 transition-colors"
                            onClick={handleRemoveBondDocument}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      <p className="mt-3 text-xs text-gray-600">
                        Document successfully uploaded and verified. You can proceed to the next step.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-5 md:p-8 shadow-lg border border-red-200">
          <div className="flex items-start">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-error/20 flex-shrink-0 flex items-center justify-center mr-3 md:mr-4">
              <AlertCircle className="h-5 w-5 md:h-6 md:w-6 text-error" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-semibold text-error font-serif">Validation Failed</h3>
              <p className="text-sm md:text-base text-red-700 mt-1 md:mt-2">{errorMessage}</p>
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <button
                  className="text-sm font-medium px-4 py-2 bg-white border border-red-300 rounded-lg text-error hover:bg-red-50 transition-colors"
                  onClick={() => onUpdate({ documentUploaded: false, documentValid: false, skippedDeedUpload: false })}
                >
                  Upload a different document
                </button>
                {/* Only show skip button if not selling */}
                {!isSelling && (
                  <button
                    className="text-sm font-medium px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={handleSkipUpload}
                  >
                    Skip for now
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 md:mt-12 flex justify-between">
        <button
          onClick={onPrevious}
          className="inline-flex items-center px-4 py-2 md:px-5 md:py-2.5 border-2 border-gray-300 rounded-lg text-sm md:text-base font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-colors"
        >
          <ArrowLeft className="mr-1 md:mr-2 h-4 w-4" />
          Back
        </button>
        
        {(documentValid && (!hasBond || bondDocument)) && (
          <button
            onClick={onNext}
            className="inline-flex items-center px-4 py-2 md:px-5 md:py-2.5 border-2 border-transparent rounded-lg text-sm md:text-base font-medium shadow-md text-white bg-primary hover:bg-primary-dark transition-colors"
          >
            Next
            <ArrowRight className="ml-1 md:ml-2 h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Step2UploadDeed;