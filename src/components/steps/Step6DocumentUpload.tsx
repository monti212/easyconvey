import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Upload, CheckCircle, AlertCircle, Share2, FileText, Eye, X, AlertTriangle, FileType, Sparkles, ShoppingCart, Tag } from 'lucide-react';
import * as storageService from '../../services/storage.service';
import { convertToPdf } from '../../lib/convertToPdf';

interface Step6Props {
  requiredDocuments: string[];
  uploadedDocuments: string[];
  otherPartyDocuments: string[];
  documentUploaded: boolean;
  documentValid: boolean;
  skippedDeedUpload: boolean;
  transactionType: string;
  originalTransactionId?: string;
  isSharedTransaction?: boolean;
  currentTransactionData?: any;
  onUpdate: (data: {
    uploadedDocuments?: string[];
    otherPartyDocuments?: string[];
    documentFilePaths?: { path: string; bucket: string; name: string; type: string; party?: 'buyer' | 'seller' }[];
    documentDataUrls?: { dataUrl: string; name: string; docType: string; party?: 'buyer' | 'seller' }[];
    extractedClientName?: string;
    extractedIdNumber?: string;
    extractedDateOfBirth?: string;
    extractedBuyerName?: string;
    extractedBuyerIdNumber?: string;
    extractedBuyerDateOfBirth?: string;
    extractedSellerName?: string;
    extractedSellerIdNumber?: string;
    extractedSellerDateOfBirth?: string;
    uploadedDocumentsByParty?: Record<string, 'buyer' | 'seller'>;
  }) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSharedLink?: (transactionId: string, transactionType: string, sharedPricing?: any) => void;
}

const Step6DocumentUpload: React.FC<Step6Props> = ({
  requiredDocuments,
  uploadedDocuments,
  otherPartyDocuments,
  documentUploaded,
  documentValid,
  skippedDeedUpload,
  transactionType,
  originalTransactionId,
  isSharedTransaction,
  currentTransactionData,
  onUpdate,
  onNext,
  onPrevious,
  onSharedLink
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [showImportantNote, setShowImportantNote] = useState(true);
  const [documentQuality, setDocumentQuality] = useState<Record<string, string>>({});
  // Which party future uploads belong to. Defaults to the current user's role; user can switch
  // to upload the other party's documents in the same session.
  const [activeParty, setActiveParty] = useState<'buyer' | 'seller'>(transactionType === 'selling' ? 'seller' : 'buyer');
  // Track the party each uploaded filename was tagged with — for grouped display
  const [docsByParty, setDocsByParty] = useState<Record<string, 'buyer' | 'seller'>>({});
  const [showShareModal, setShowShareModal] = useState(false);
  const [partnerEmail, setPartnerEmail] = useState('');
  const [sharedLink, setSharedLink] = useState('');
  const [fullRequiredDocuments, setFullRequiredDocuments] = useState<string[]>([]);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copying' | 'copied' | 'error'>('idle');
  const [storageWarnings, setStorageWarnings] = useState<string[]>([]);
  const [ocrResults, setOcrResults] = useState<Record<string, { fullName?: string; idNumber?: string; dateOfBirth?: string; documentType?: string }>>({});

  // Convert a File to a base64 data URL for direct AI vision processing
  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Check if Title Deed needs to be added to required documents
  useEffect(() => {
    let updatedDocs = [...requiredDocuments];
    
    // Add Title Deed to required documents if it wasn't uploaded in Step 2
    if (skippedDeedUpload || (!documentUploaded && !documentValid)) {
      if (!updatedDocs.includes('Title Deed')) {
        updatedDocs = ['Title Deed', ...updatedDocs];
      }
    }
    
    // Add Sale Agreement to required documents if not already included
    if (!updatedDocs.includes('Sale Agreement or Offer to Sell/Purchase')) {
      updatedDocs.push('Sale Agreement or Offer to Sell/Purchase');
    }
    
    setFullRequiredDocuments(updatedDocs);
  }, [requiredDocuments, documentUploaded, documentValid, skippedDeedUpload]);

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newUploads: string[] = [];
    const newQuality: Record<string, string> = { ...documentQuality };
    const newPaths: { path: string; bucket: string; name: string; type: string; party?: 'buyer' | 'seller' }[] = [];
    const newDataUrls: { dataUrl: string; name: string; docType: string; party?: 'buyer' | 'seller' }[] = [];
    const newDocsByParty: Record<string, 'buyer' | 'seller'> = { ...docsByParty };

    for (const originalFile of Array.from(files)) {
      // Capture original as base64 if image (for direct AI vision processing)
      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(originalFile.name);
      if (isImage) {
        try {
          const dataUrl = await fileToDataUrl(originalFile);
          newDataUrls.push({ dataUrl, name: originalFile.name, docType: 'bulk-upload', party: activeParty });
        } catch { /* ignore */ }
      }

      // Auto-convert images to PDF
      const file = await convertToPdf(originalFile);
      try {
        // Try to upload to Supabase Storage
        try {
          const result = await storageService.uploadFile(file, 'public', 'documents', 'bulk', 'documents');
          newPaths.push({ path: result.path, bucket: 'documents', name: originalFile.name, type: 'bulk-upload', party: activeParty });
          if (isImage) {
            const origResult = await storageService.uploadFile(originalFile, 'public', 'documents', 'bulk-original', 'documents');
            newPaths.push({ path: origResult.path, bucket: 'documents', name: originalFile.name, type: 'bulk-upload-original', party: activeParty });
          }
        } catch {
          setStorageWarnings(prev => [...prev, file.name]);
        }

        // Try AI quality analysis
        try {
          const response = await fetch('/api/analyze-document', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileName: file.name, fileSize: file.size, fileType: file.type }),
          });
          if (response.ok) {
            const result = await response.json();
            newQuality[file.name] = result.quality || 'good';
          } else {
            newQuality[file.name] = 'good';
          }
        } catch {
          newQuality[file.name] = 'good';
        }

        newUploads.push(file.name);
        newDocsByParty[file.name] = activeParty;
      } catch {
        newUploads.push(file.name);
        newQuality[file.name] = 'medium';
        newDocsByParty[file.name] = activeParty;
      }
    }

    onUpdate({
      uploadedDocuments: [...uploadedDocuments, ...newUploads],
      documentFilePaths: newPaths,
      documentDataUrls: newDataUrls,
      uploadedDocumentsByParty: newDocsByParty,
    });
    setDocsByParty(newDocsByParty);
    setDocumentQuality(newQuality);
    setIsUploading(false);
  };

  const isIdDocument = (docType: string) => {
    const lower = docType.toLowerCase();
    return lower.includes('id') || lower.includes('passport') || lower.includes('identity') || lower.includes('residence permit');
  };

  const handleSingleUpload = (docType: string) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const originalFile = e.target.files?.[0];
    if (!originalFile) return;

    const docSlug = docType.replace(/\s+/g, '-');
    const singleDataUrls: { dataUrl: string; name: string; docType: string; party?: 'buyer' | 'seller' }[] = [];

    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(originalFile.name);
    if (isImage) {
      try {
        const dataUrl = await fileToDataUrl(originalFile);
        singleDataUrls.push({ dataUrl, name: originalFile.name, docType: docSlug, party: activeParty });
      } catch { /* ignore */ }
    }

    const file = await convertToPdf(originalFile);
    const newFileName = `${docType.replace(/\s+/g, '_')}.pdf`;

    setIsUploading(true);

    try {
      const singlePaths: { path: string; bucket: string; name: string; type: string; party?: 'buyer' | 'seller' }[] = [];
      try {
        const result = await storageService.uploadFile(file, 'public', 'documents', docSlug, 'documents');
        singlePaths.push({ path: result.path, bucket: 'documents', name: originalFile.name, type: docSlug, party: activeParty });
        if (isImage) {
          const origResult = await storageService.uploadFile(originalFile, 'public', 'documents', `${docSlug}-original`, 'documents');
          singlePaths.push({ path: origResult.path, bucket: 'documents', name: originalFile.name, type: `${docSlug}-original`, party: activeParty });
        }
      } catch {
        setStorageWarnings(prev => [...prev, newFileName]);
      }

      const newUploads = [...uploadedDocuments, newFileName];
      const newDocsByParty = { ...docsByParty, [newFileName]: activeParty };
      setDocsByParty(newDocsByParty);
      const updatePayload: Parameters<typeof onUpdate>[0] = { uploadedDocuments: newUploads, documentFilePaths: singlePaths, documentDataUrls: singleDataUrls, uploadedDocumentsByParty: newDocsByParty };

      // OCR identity documents — route extracted fields to the party-tagged bucket
      // matching the active toggle. Also write to the legacy single-bucket fields
      // (extractedClientName/IdNumber/DateOfBirth) when the active party is the
      // current user's role, so existing readers keep working unchanged.
      if (isIdDocument(docType)) {
        try {
          const formData = new FormData();
          formData.append('file', originalFile);
          const idRes = await fetch('/api/analyze-id', { method: 'POST', body: formData });
          if (idRes.ok) {
            const idData = await idRes.json();
            setOcrResults(prev => ({ ...prev, [newFileName]: idData }));
            const validFullName = idData.fullName && idData.fullName !== 'Unknown' ? idData.fullName : '';
            const validIdNumber = idData.idNumber && idData.idNumber !== 'Unknown' ? idData.idNumber : '';
            const validDob = idData.dateOfBirth && idData.dateOfBirth !== 'Unknown' ? idData.dateOfBirth : '';
            if (activeParty === 'buyer') {
              if (validFullName) updatePayload.extractedBuyerName = validFullName;
              if (validIdNumber) updatePayload.extractedBuyerIdNumber = validIdNumber;
              if (validDob) updatePayload.extractedBuyerDateOfBirth = validDob;
            } else {
              if (validFullName) updatePayload.extractedSellerName = validFullName;
              if (validIdNumber) updatePayload.extractedSellerIdNumber = validIdNumber;
              if (validDob) updatePayload.extractedSellerDateOfBirth = validDob;
            }
            // Legacy single-bucket fields — keep populated for the *current user's* side
            // (transactionType === 'selling' → user is seller; otherwise buyer)
            const userIsSeller = transactionType === 'selling';
            if ((userIsSeller && activeParty === 'seller') || (!userIsSeller && activeParty === 'buyer')) {
              if (validFullName) updatePayload.extractedClientName = validFullName;
              if (validIdNumber) updatePayload.extractedIdNumber = validIdNumber;
              if (validDob) updatePayload.extractedDateOfBirth = validDob;
            }
          }
        } catch { /* OCR failure is non-blocking */ }
      }

      onUpdate(updatePayload);

      // AI quality analysis
      const newQuality = { ...documentQuality };
      try {
        const response = await fetch('/api/analyze-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name, fileSize: file.size, fileType: file.type, docType }),
        });
        if (response.ok) {
          const result = await response.json();
          newQuality[newFileName] = result.quality || 'good';
        } else {
          newQuality[newFileName] = 'good';
        }
      } catch {
        newQuality[newFileName] = 'good';
      }
      setDocumentQuality(newQuality);
    } catch {
      const newUploads = [...uploadedDocuments, newFileName];
      onUpdate({ uploadedDocuments: newUploads });
    } finally {
      setIsUploading(false);
    }
  };

  const handleShare = async () => {
    if (!partnerEmail) return;
    
    // Use the original transaction ID if this is a shared transaction, otherwise generate a new one
    const transactionId = originalTransactionId || Math.random().toString(36).substring(2, 10).toUpperCase();
    const otherPartyType = transactionType === 'buying' ? 'selling' : 'buying';
    
    // Prepare pricing data to share if available
    const sharedPricing = currentTransactionData && currentTransactionData.sellingPrice ? {
      sellingPrice: currentTransactionData.sellingPrice,
      valuationAmount: currentTransactionData.valuationAmount || '',
      valuationDocument: currentTransactionData.valuationDocument || ''
    } : null;
    
    // Encode the shared data
    const encodedData = sharedPricing ? encodeURIComponent(JSON.stringify(sharedPricing)) : '';
    const link = `${window.location.origin}?transaction=${transactionId}&type=${otherPartyType}${encodedData ? `&data=${encodedData}` : ''}`;
    
    setSharedLink(link);

    // Send share link via API
    try {
      const response = await fetch('/api/send-share-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: partnerEmail,
          link,
          transactionId,
          transactionType: otherPartyType,
          hasPricing: !!sharedPricing,
        }),
      });
      if (response.ok) {
        alert(`Share link sent to ${partnerEmail}!\n\nThey will start the complete ${otherPartyType} process from the beginning${sharedPricing ? ' with your pricing information pre-filled' : ''}.`);
      } else {
        alert(`Share link generated but email delivery failed. Please copy the link and send it manually.`);
      }
    } catch {
      alert(`Share link generated but email service unavailable. Please copy the link and send it manually.`);
    }
  };

  const handleTestSharedLink = () => {
    if (onSharedLink && sharedLink) {
      const url = new URL(sharedLink);
      const transactionId = url.searchParams.get('transaction') || '';
      const transactionType = url.searchParams.get('type') || 'buying';
      const sharedData = url.searchParams.get('data');
      
      let parsedData = null;
      if (sharedData) {
        try {
          parsedData = JSON.parse(decodeURIComponent(sharedData));
        } catch (e) {
          console.warn('Failed to parse shared data:', e);
        }
      }
      
      onSharedLink(transactionId, transactionType, parsedData);
    }
  };

  const handleCopyLink = async () => {
    if (!sharedLink) return;
    
    setCopyStatus('copying');
    
    try {
      await navigator.clipboard.writeText(sharedLink);
      setCopyStatus('copied');
      
      // Reset status after 2 seconds
      setTimeout(() => {
        setCopyStatus('idle');
      }, 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      setCopyStatus('error');
      
      // Try fallback method for older browsers
      try {
        const textArea = document.createElement('textarea');
        textArea.value = sharedLink;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        setCopyStatus('copied');
        setTimeout(() => {
          setCopyStatus('idle');
        }, 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr);
        // Reset status after showing error
        setTimeout(() => {
          setCopyStatus('idle');
        }, 2000);
      }
    }
  };

  const getCopyButtonText = () => {
    switch (copyStatus) {
      case 'copying':
        return 'Copying...';
      case 'copied':
        return 'Copied!';
      case 'error':
        return 'Failed';
      default:
        return 'Copy';
    }
  };

  const getCopyButtonClass = () => {
    const baseClass = "text-xs px-2 py-1 rounded transition-colors";
    switch (copyStatus) {
      case 'copying':
        return `${baseClass} text-gray-600 cursor-wait`;
      case 'copied':
        return `${baseClass} text-green-600 bg-green-100`;
      case 'error':
        return `${baseClass} text-red-600 bg-red-100`;
      default:
        return `${baseClass} text-blue-600 hover:text-blue-800 hover:bg-blue-50 cursor-pointer`;
    }
  };

  const getMissingDocuments = () => {
    return fullRequiredDocuments.filter(doc => 
      !uploadedDocuments.some(uploaded => 
        uploaded.toLowerCase().includes(doc.toLowerCase().replace(/\s+/g, '_'))
      )
    );
  };

  const isDocumentUploaded = (docType: string) => {
    return uploadedDocuments.some(doc => 
      doc.toLowerCase().includes(docType.toLowerCase().replace(/\s+/g, '_'))
    );
  };

  const getDocumentName = (docType: string) => {
    return uploadedDocuments.find(doc => 
      doc.toLowerCase().includes(docType.toLowerCase().replace(/\s+/g, '_'))
    ) || '';
  };

  const getQualityFeedback = (doc: string) => {
    const quality = documentQuality[doc];
    if (quality === 'good') {
      return { text: 'Excellent quality ✓', color: 'text-green-600', bg: 'bg-green-100' };
    } else if (quality === 'medium') {
      return { text: 'Acceptable - could be clearer', color: 'text-amber-600', bg: 'bg-amber-100' };
    } else if (quality === 'poor') {
      return { text: 'Too blurry - please re-scan', color: 'text-red-600', bg: 'bg-red-100' };
    }
    return { text: 'Analyzing quality...', color: 'text-gray-600', bg: 'bg-gray-100' };
  };

  const canProceed = uploadedDocuments.length > 0;
  const missingDocuments = getMissingDocuments();
  const hasSharedPricing = currentTransactionData?.sellingPrice && parseInt(currentTransactionData.sellingPrice) > 0;

  return (
    <div className="py-4 md:py-8 max-w-4xl mx-auto px-4">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 md:mb-4 text-center">
        Document Upload
      </h2>
      <p className="text-sm md:text-lg text-gray-600 mb-6 md:mb-8 text-center max-w-2xl mx-auto">
        Please upload all required documents for your transaction. Our AI will analyze them for compliance.
        {isSharedTransaction && (
          <span className="block mt-2 text-primary font-medium">
            This is for transaction: {originalTransactionId}
          </span>
        )}
      </p>

      {/* Party toggle — every upload from this step is tagged with the selected party so the AI never mixes them up */}
      <div className="mb-6 md:mb-8 bg-white rounded-xl shadow-md border border-gray-200 p-4 md:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-gray-500">Uploading documents for</p>
            <p className="text-base md:text-lg font-bold text-primary mt-0.5">
              {activeParty === 'buyer' ? 'BUYER' : 'SELLER'}
              <span className="ml-2 text-xs font-normal text-gray-500">— switch to upload the other party's documents</span>
            </p>
          </div>
          <div className="inline-flex rounded-lg bg-gray-100 p-1 self-start sm:self-auto" role="tablist" aria-label="Document party selector">
            <button
              type="button"
              role="tab"
              aria-selected={activeParty === 'buyer'}
              onClick={() => setActiveParty('buyer')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                activeParty === 'buyer' ? 'bg-secondary text-primary shadow-sm' : 'text-gray-600 hover:text-primary'
              }`}
            >
              <ShoppingCart className="h-4 w-4" />
              Buyer
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeParty === 'seller'}
              onClick={() => setActiveParty('seller')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                activeParty === 'seller' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:text-primary'
              }`}
            >
              <Tag className="h-4 w-4" />
              Seller
            </button>
          </div>
        </div>
        {/* Quick split summary so user sees both sides at a glance */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className={`rounded-lg p-3 border ${activeParty === 'buyer' ? 'bg-secondary/10 border-secondary/40' : 'bg-gray-50 border-gray-200'}`}>
            <p className="text-[10px] font-semibold tracking-wider uppercase text-secondary-dark flex items-center gap-1">
              <ShoppingCart className="h-3 w-3" /> Buyer's documents
            </p>
            <p className="text-lg font-bold text-primary mt-0.5">
              {Object.values(docsByParty).filter(p => p === 'buyer').length}
              <span className="text-xs font-normal text-gray-500 ml-1">uploaded</span>
            </p>
          </div>
          <div className={`rounded-lg p-3 border ${activeParty === 'seller' ? 'bg-primary/5 border-primary/30' : 'bg-gray-50 border-gray-200'}`}>
            <p className="text-[10px] font-semibold tracking-wider uppercase text-primary flex items-center gap-1">
              <Tag className="h-3 w-3" /> Seller's documents
            </p>
            <p className="text-lg font-bold text-primary mt-0.5">
              {Object.values(docsByParty).filter(p => p === 'seller').length}
              <span className="text-xs font-normal text-gray-500 ml-1">uploaded</span>
            </p>
          </div>
        </div>
      </div>

      {/* Important Note Modal */}
      {showImportantNote && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-10 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-5 md:p-8 m-4 relative overflow-hidden">
            <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-red-400 opacity-20 blur-xl"></div>
            <div className="relative">
              <h3 className="text-lg md:text-xl font-bold text-red-600 mb-3 md:mb-4">IMPORTANT NOTICE</h3>
              <div className="text-gray-700 space-y-3 md:space-y-4 mb-5 md:mb-6">
                <p className="text-sm md:text-base">Please note that the following are also required before transfer can be completed:</p>
                <ul className="list-disc pl-5 md:pl-6 space-y-1 md:space-y-2">
                  <li className="text-sm md:text-base">Tax clearance from relevant authorities</li>
                  <li className="text-sm md:text-base">Rates clearance certificate from local municipality</li>
                  <li className="text-sm md:text-base">Letter of Compliance — where applicable</li>
                  <li className="text-sm md:text-base">Land Board Consent — where applicable (tribal land only)</li>
                  <li className="text-sm md:text-base">Bond Cancellation — where applicable (existing mortgage only)</li>
                </ul>
                <p className="text-sm md:text-base font-medium">Requirements marked "where applicable" depend on your specific transaction and location.</p>
              </div>
              <button
                onClick={() => setShowImportantNote(false)}
                className="w-full py-2.5 md:py-3 px-4 border-2 border-transparent text-sm md:text-base font-medium rounded-xl shadow-md text-white bg-primary hover:bg-primary-dark transition-colors"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Share Link Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-10 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-5 md:p-8 m-4 relative">
            <button 
              onClick={() => setShowShareModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">Share with Other Party</h3>
            <p className="text-sm text-gray-600 mb-4">
              Share this transaction with the other party ({transactionType === 'buying' ? 'seller' : 'buyer'}) to allow them to start their complete transaction process from the beginning{hasSharedPricing ? ' with your pricing information pre-filled' : ''}.
            </p>
            
            {hasSharedPricing && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 font-medium">Pricing Information Will Be Shared</p>
                <p className="text-xs text-blue-600 mt-1">
                  Your pricing details (P {parseInt(currentTransactionData.sellingPrice).toLocaleString()}) will be pre-filled for the other party to confirm.
                </p>
              </div>
            )}
            
            <div className="mb-4">
              <label htmlFor="partnerEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="partnerEmail"
                value={partnerEmail}
                onChange={(e) => setPartnerEmail(e.target.value)}
                className="focus:ring-blue-500 focus:border-blue-500 block w-full py-2 px-3 text-sm border-gray-300 rounded-lg"
                placeholder="partner@example.com"
              />
            </div>
            
            {sharedLink ? (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-4">
                <p className="text-sm text-blue-800 font-medium mb-2">Share link generated!</p>
                <div className="flex items-center justify-between bg-white p-2 rounded border border-blue-100 mb-2">
                  <span className="text-xs text-gray-600 truncate mr-2 flex-1">{sharedLink}</span>
                  <button 
                    onClick={handleCopyLink}
                    disabled={copyStatus === 'copying'}
                    className={getCopyButtonClass()}
                  >
                    {getCopyButtonText()}
                  </button>
                </div>
                <p className="text-xs text-blue-600 mb-3">
                  The other party will start their complete {transactionType === 'buying' ? 'selling' : 'buying'} process from the beginning when they click this link{hasSharedPricing ? ' with your pricing pre-filled' : ''}.
                </p>
                <button
                  onClick={handleTestSharedLink}
                  className="w-full py-2 px-3 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Test Shared Link (Demo)
                </button>
              </div>
            ) : (
              <button
                onClick={handleShare}
                disabled={!partnerEmail}
                className={`w-full py-2 px-4 rounded-lg text-sm font-medium ${
                  partnerEmail ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                } transition-colors`}
              >
                Generate Share Link
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 mb-6 md:mb-8">
        {/* Left side - Checklist */}
        <div className="md:col-span-2 bg-background rounded-2xl p-5 md:p-8 shadow-lg">
          <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4 md:mb-6 flex items-center">
            <FileText className="h-4 w-4 md:h-5 md:w-5 text-blue-600 mr-2" />
            Required Documents Checklist
          </h3>
          
          {/* Document format notification */}
          <div className="mb-4 p-3 bg-blue-100 rounded-lg border border-blue-200">
            <div className="flex items-start">
              <AlertCircle className="h-4 w-4 text-blue-700 mt-0.5 flex-shrink-0" />
              <div className="ml-2">
                <p className="text-xs text-blue-700 font-medium">
                  Important: All documents must be clear, legible, and in PDF format
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Our AI analyzes document quality - blurry, dark, or poor quality scans will be rejected. Use good lighting and hold camera steady.
                </p>
              </div>
            </div>
          </div>
          
          <ul className="space-y-3 md:space-y-4">
            {fullRequiredDocuments.map((doc, index) => {
              const isUploaded = isDocumentUploaded(doc);
              const docName = getDocumentName(doc);
              const quality = docName ? getQualityFeedback(docName) : null;
              
              return (
                <li key={index} className={`p-2 md:p-3 rounded-lg ${isUploaded ? 'bg-green-50 border border-green-200' : 'bg-white border border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {isUploaded ? (
                        <div className="h-6 w-6 md:h-8 md:w-8 rounded-full bg-green-100 flex items-center justify-center mr-2 md:mr-3">
                          <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                        </div>
                      ) : (
                        <div className="h-6 w-6 md:h-8 md:w-8 flex-shrink-0 mr-2 md:mr-3">
                          <input
                            type="file"
                            id={`doc-${index}`}
                            className="hidden"
                            onChange={handleSingleUpload(doc)}
                            accept=".pdf,.jpg,.jpeg,.png"
                          />
                          <label
                            htmlFor={`doc-${index}`}
                            className="h-full w-full rounded-full border-2 border-gray-300 hover:border-blue-400 flex items-center justify-center cursor-pointer transition-colors"
                          >
                            <Upload className="h-3 w-3 md:h-4 md:w-4 text-gray-500 hover:text-blue-500" />
                          </label>
                        </div>
                      )}
                      <span className={`text-sm md:text-base ${isUploaded ? 'text-green-700 font-medium' : 'text-gray-700'}`}>
                        {doc}
                        {doc === 'Title Deed' && skippedDeedUpload && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                            Required
                          </span>
                        )}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isUploaded && docsByParty[docName] && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          docsByParty[docName] === 'buyer' ? 'bg-secondary/20 text-primary' : 'bg-primary/10 text-primary'
                        }`}>
                          {docsByParty[docName] === 'buyer' ? <ShoppingCart className="h-3 w-3" /> : <Tag className="h-3 w-3" />}
                          {docsByParty[docName]}
                        </span>
                      )}
                      {isUploaded && quality && (
                        <div className={`px-2 py-1 rounded-full text-xs ${quality.color} ${quality.bg}`}>
                          {quality.text}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {isUploaded && (
                    <div className="mt-2 ml-8">
                      <div className="text-xs text-gray-500 flex items-center">
                        <span className="truncate mr-2">{docName}</span>
                        <button className="text-blue-600 hover:text-blue-800 flex items-center">
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </button>
                        <button
                          className="text-red-600 hover:text-red-800 flex items-center ml-2"
                          onClick={() => {
                            const newDocs = uploadedDocuments.filter(d => d !== docName);
                            onUpdate({ uploadedDocuments: newDocs });
                            const newQuality = { ...documentQuality };
                            delete newQuality[docName];
                            setDocumentQuality(newQuality);
                            const newOcr = { ...ocrResults };
                            delete newOcr[docName];
                            setOcrResults(newOcr);
                          }}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Remove
                        </button>
                      </div>
                      {/* OCR extracted data */}
                      {ocrResults[docName] && (ocrResults[docName].fullName || ocrResults[docName].idNumber) && (
                        <div className="mt-1.5 p-2 bg-blue-50 rounded border border-blue-200 flex items-start gap-1.5">
                          <Sparkles className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-xs font-semibold text-blue-700">Auto-extracted: </span>
                            {ocrResults[docName].fullName && ocrResults[docName].fullName !== 'Unknown' && (
                              <span className="text-xs text-blue-800 mr-2">{ocrResults[docName].fullName}</span>
                            )}
                            {ocrResults[docName].idNumber && ocrResults[docName].idNumber !== 'Unknown' && (
                              <span className="text-xs text-blue-600">ID: {ocrResults[docName].idNumber}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          
          {uploadedDocuments.length > 0 && (() => {
            // Party-specific progress: only count uploads tagged for the active party
            const activeUploadCount = uploadedDocuments.filter(d => docsByParty[d] === activeParty).length;
            const buyerCount = uploadedDocuments.filter(d => docsByParty[d] === 'buyer').length;
            const sellerCount = uploadedDocuments.filter(d => docsByParty[d] === 'seller').length;
            const activePct = Math.min(100, (activeUploadCount / fullRequiredDocuments.length) * 100);
            const isBuyerActive = activeParty === 'buyer';
            return (
              <div className={`mt-6 md:mt-8 bg-white rounded-xl p-4 md:p-5 border-2 ${isBuyerActive ? 'border-secondary/40' : 'border-primary/30'}`}>
                <h4 className="text-sm md:text-base font-medium text-gray-900 mb-3 md:mb-4 flex items-center">
                  <CheckCircle className={`h-4 w-4 mr-2 ${isBuyerActive ? 'text-secondary-dark' : 'text-primary'}`} />
                  {isBuyerActive ? 'Buyer' : 'Seller'} progress
                  <span className="ml-2 text-[10px] font-semibold tracking-wider uppercase text-gray-500">— switch toggle for the other party</span>
                </h4>
                <div className="relative w-full h-4 bg-gray-200 rounded-full mb-2">
                  <div
                    className={`absolute top-0 left-0 h-full rounded-full transition-all ${isBuyerActive ? 'bg-secondary' : 'bg-primary'}`}
                    style={{ width: `${activePct}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600">
                  <span className="font-medium">{activeUploadCount}</span> of <span className="font-medium">{fullRequiredDocuments.length}</span> {isBuyerActive ? 'buyer' : 'seller'} documents uploaded
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                  <div className={`px-2 py-1.5 rounded ${isBuyerActive ? 'bg-secondary/10 text-primary font-semibold' : 'bg-gray-50 text-gray-600'}`}>
                    Buyer total: {buyerCount}
                  </div>
                  <div className={`px-2 py-1.5 rounded ${!isBuyerActive ? 'bg-primary/10 text-primary font-semibold' : 'bg-gray-50 text-gray-600'}`}>
                    Seller total: {sellerCount}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Right side - Upload area */}
        <div className={`bg-white rounded-2xl p-4 md:p-6 shadow-lg border-2 flex flex-col h-full ${activeParty === 'buyer' ? 'border-secondary/50' : 'border-primary/40'}`}>
          <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4 flex items-center">
            <Upload className="h-4 w-4 md:h-5 md:w-5 text-blue-600 mr-2" />
            Bulk Upload
          </h3>
          <div className={`mb-3 px-3 py-2 rounded-md ${activeParty === 'buyer' ? 'bg-secondary/10 border border-secondary/40' : 'bg-primary/5 border border-primary/30'}`}>
            <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-gray-500">Files uploaded here will be tagged as</p>
            <p className="text-sm font-bold text-primary mt-0.5 flex items-center gap-1">
              {activeParty === 'buyer' ? <><ShoppingCart className="h-3.5 w-3.5" /> BUYER's documents</> : <><Tag className="h-3.5 w-3.5" /> SELLER's documents</>}
            </p>
          </div>
          {isUploading ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-blue-50 rounded-xl p-4 md:p-6">
              <div className="animate-pulse flex flex-col items-center">
                <div className="rounded-full bg-blue-400 h-10 w-10 md:h-14 md:w-14 mb-4 md:mb-5"></div>
                <div className="h-4 md:h-5 bg-blue-400 rounded w-3/4 mb-2 md:mb-3"></div>
                <div className="h-4 md:h-5 bg-blue-400 rounded w-1/2"></div>
              </div>
              <p className="mt-4 md:mt-5 text-sm md:text-base text-blue-700 font-medium">Processing your documents...</p>
              <p className="text-xs md:text-sm text-blue-600 mt-1 md:mt-2">Our AI is analyzing your files for compliance and quality</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="border-2 border-dashed border-blue-300 rounded-xl bg-blue-50 p-4 md:p-8 flex-1 flex flex-col items-center justify-center text-center transition-all hover:bg-blue-100">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white flex items-center justify-center mb-3 md:mb-4 shadow-md">
                  <Upload className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
                </div>
                <p className="text-sm md:text-base text-blue-800 font-medium mb-1 md:mb-2">
                  Tap to upload multiple documents
                </p>
                <p className="text-xs md:text-sm text-blue-600 mb-4 md:mb-6">
                  Ensure documents are clear and well-lit before uploading
                </p>
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleBulkUpload}
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center px-4 py-2 md:px-5 md:py-2.5 border-2 border-transparent text-sm md:text-base font-medium rounded-lg shadow-md text-white bg-primary hover:bg-primary-dark transition-colors"
                >
                  Upload Files
                </label>
                
                <div className="mt-3 text-xs text-blue-500">
                  <AlertTriangle className="h-3 w-3 inline-block mr-1" />
                  Poor quality documents will be automatically rejected
                </div>
              </div>
              
              {/* Only show share button if this is not already a shared transaction */}
              {!isSharedTransaction && (
                <div className="mt-4 md:mt-6">
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="w-full flex items-center justify-center px-4 py-2 md:px-5 md:py-3 border-2 border-gray-300 text-xs md:text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-colors"
                  >
                    <Share2 className="mr-1 md:mr-2 h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                    Share Link with Other Party
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Transaction Progress Area */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-md mb-6 md:mb-8 p-4 md:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Progress</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-blue-50 rounded-lg p-3 md:p-4 border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm md:text-base font-medium text-blue-800">Your Documents</h4>
              <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">
                {Math.round((uploadedDocuments.length / fullRequiredDocuments.length) * 100)}% Complete
              </span>
            </div>
            <div className="relative w-full h-2 bg-blue-200 rounded-full">
              <div
                className="absolute top-0 left-0 h-full bg-blue-600 rounded-full"
                style={{
                  width: `${Math.min(100, (uploadedDocuments.length / fullRequiredDocuments.length) * 100)}%`
                }}
              ></div>
            </div>
          </div>
          
          <div className={`rounded-lg p-3 md:p-4 border ${otherPartyDocuments.length > 0 ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <h4 className={`text-sm md:text-base font-medium ${otherPartyDocuments.length > 0 ? 'text-green-800' : 'text-gray-700'}`}>
                Other Party's Documents
              </h4>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                otherPartyDocuments.length > 0 
                  ? 'bg-green-200 text-green-800' 
                  : 'bg-gray-200 text-gray-700'
              }`}>
                {otherPartyDocuments.length > 0 ? `${otherPartyDocuments.length} Uploaded` : 'Awaiting Upload'}
              </span>
            </div>
            <div className="relative w-full h-2 bg-gray-200 rounded-full">
              <div
                className={`absolute top-0 left-0 h-full rounded-full ${
                  otherPartyDocuments.length > 0 ? 'bg-green-500' : 'bg-gray-400'
                }`}
                style={{
                  width: otherPartyDocuments.length > 0 ? '100%' : '0%'
                }}
              ></div>
            </div>
            
            {!isSharedTransaction && (
              <button
                onClick={() => setShowShareModal(true)}
                className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Share link to start their process
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Storage warning */}
      {storageWarnings.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl border-l-4 border-red-400 p-4 md:p-6 mb-6 md:mb-8 shadow-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 md:h-6 md:w-6 text-red-500" />
            </div>
            <div className="ml-3 md:ml-4">
              <h3 className="text-sm md:text-base font-semibold text-red-800">Some files could not be saved to cloud storage</h3>
              <p className="text-xs md:text-sm text-red-700 mt-1">
                The following files were recorded locally but may not have been uploaded: {storageWarnings.join(', ')}.
                Please ensure you are logged in for secure cloud storage.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Important note permanent reminder */}
      <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl border-l-4 border-amber-400 p-4 md:p-6 mb-6 md:mb-8 shadow-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 md:h-6 md:w-6 text-amber-500" />
          </div>
          <div className="ml-3 md:ml-4">
            <p className="text-xs md:text-base text-amber-800">
              <strong className="font-semibold">Important:</strong> After submission, you'll need to obtain tax clearance and rates clearance before transfer. Letter of Compliance, Land Board Consent, and Bond Cancellation are required where applicable.
            </p>
          </div>
        </div>
      </div>

      {/* Missing documents warning */}
      {missingDocuments.length > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border border-orange-200 p-4 md:p-6 mb-6 md:mb-8 shadow-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 md:h-6 md:w-6 text-orange-500" />
            </div>
            <div className="ml-3 md:ml-4">
              <h3 className="text-base md:text-lg font-semibold text-orange-800">Missing Documents</h3>
              <div className="mt-1 md:mt-2 text-sm md:text-base text-orange-700">
                <p className="mb-1 md:mb-2">The following documents are still required:</p>
                <ul className="list-disc space-y-0.5 md:space-y-1 pl-4 md:pl-5">
                  {missingDocuments.map((doc, index) => (
                    <li key={index} className="text-xs md:text-sm">{doc}</li>
                  ))}
                </ul>
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
        
        <button
          onClick={onNext}
          disabled={!canProceed}
          className={`inline-flex items-center px-4 py-2 md:px-5 md:py-2.5 border-2 border-transparent rounded-lg text-sm md:text-base font-medium shadow-md text-white ${
            canProceed ? 'bg-primary hover:bg-primary-dark transition-colors' : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          Submit Documents
          <ArrowRight className="ml-1 md:ml-2 h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Step6DocumentUpload;