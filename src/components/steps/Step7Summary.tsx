import React, { useState, useCallback } from 'react';
import { ArrowLeft, CheckCircle, Clipboard, Download, FileText, Users, Clock, Banknote, UserCircle, Building, Lock, Shield, ExternalLink, Share2, Loader2, Sparkles, Eye, Printer } from 'lucide-react';
import { useTransactions } from '../../App';
import { pdf } from '@react-pdf/renderer';
import TransactionSummaryPDF from '../../lib/pdf/transactionSummary';
import DeedOfSalePDF from '../../lib/pdf/deedOfSale';
import DocumentStreamViewer from '../DocumentStreamViewer';
import * as casesService from '../../services/cases.service';

interface Step7Props {
  transactionData: {
    transactionType: string;
    documentUploaded: boolean;
    documentValid: boolean;
    hasBond?: boolean;
    bondDocument?: string;
    sellingPrice: string;
    valuationAmount?: string;
    valuationDocument?: string;
    hasAgent: boolean;
    agentName: string;
    agentContact: string;
    agentEmail?: string;
    agentIdPassport?: string;
    agentCompany?: string;
    agentRegNumber?: string;
    agentTaxId?: string;
    commissionType?: string;
    commissionValue?: string;
    entityType: string;
    gender: string;
    nationality: string;
    maritalStatus: string;
    requiredDocuments: string[];
    uploadedDocuments: string[];
    isFirstTimeBuyer?: boolean; // Added for first time buyer status
    documentFilePaths?: { path: string; bucket: string; name: string; type: string }[];
    documentDataUrls?: { dataUrl: string; name: string; docType: string }[];
  };
  transactionId: string | null;
  onPrevious: () => void;
  mode?: 'conveyancer' | 'client';
  clientToken?: string;
  onClientSubmitComplete?: () => void;
  onComplete?: () => void;
}

type DocumentType = 'deed_of_sale' | 'transfer_duty' | 'power_of_attorney' | 'affidavit' | 'bond_registration' | 'compliance_certificate';

const DOC_TYPES: { id: DocumentType; label: string; short: string }[] = [
  { id: 'deed_of_sale', label: 'Deed of Sale & Transfer', short: 'Deed of Sale' },
  { id: 'transfer_duty', label: 'Transfer Duty Declaration', short: 'Transfer Duty' },
  { id: 'power_of_attorney', label: 'Power of Attorney', short: 'Power of Attorney' },
  { id: 'affidavit', label: 'Affidavit', short: 'Affidavit' },
  { id: 'bond_registration', label: 'Bond Registration', short: 'Bond Reg.' },
  { id: 'compliance_certificate', label: 'Compliance Certificate', short: 'Compliance' },
];

const Step7Summary: React.FC<Step7Props> = ({
  transactionData,
  transactionId,
  onPrevious,
  mode = 'conveyancer',
  clientToken,
  onClientSubmitComplete,
  onComplete,
}) => {
  const [copied, setCopied] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [conveyancerLinkCopied, setConveyancerLinkCopied] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { markTransactionComplete } = useTransactions();

  const formatPrice = (value: string) => {
    if (!value) return 'P 0';
    return `P ${new Intl.NumberFormat().format(parseInt(value))}`;
  };

  const getMaritalStatusDisplay = (status: string) => {
    switch (status) {
      case 'single': return 'Single';
      case 'married_in': return 'Married (In Community of Property)';
      case 'married_out': return 'Married (Out of Community of Property)';
      case 'divorced': return 'Divorced';
      case 'widowed': return 'Widowed';
      default: return status;
    }
  };

  const getEntityTypeDisplay = (type: string) => {
    switch (type) {
      case 'individual': return 'Individual';
      case 'company': return 'Company';
      case 'trust': return 'Estate Trust';
      default: return type;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const transactionReferenceId = React.useMemo(() => 
    transactionId || Math.random().toString(36).substring(2, 10).toUpperCase(), 
    [transactionId]
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // AI Document Generation state
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>('deed_of_sale');
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);
  const [generatedDocuments, setGeneratedDocuments] = useState<Record<string, string>>({});
  const [activeDocument, setActiveDocument] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState('');
  const [showDocViewer, setShowDocViewer] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);

  const generateDocument = useCallback(async (docType: DocumentType) => {
    setIsGeneratingDoc(true);
    setDocError(null);
    setStreamingContent('');
    setActiveDocument(null);
    setShowDocViewer(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      // Map wizard fields to the format the edge function expects
      const clientName = transactionData.hasAgent ? transactionData.agentName
        : transactionData.entityType === 'company' ? transactionData.companyName
        : transactionData.entityType === 'trust' ? transactionData.trustName
        : transactionData.entityType === 'estate' ? transactionData.deceasedName
        : transactionData.entityType === 'society' ? transactionData.societyName
        : 'Not specified';

      const buyerDetails = {
        clientName,
        entityType: transactionData.entityType || 'Individual',
        gender: transactionData.gender || 'Not specified',
        nationality: transactionData.nationality || 'Not specified',
        maritalStatus: transactionData.maritalStatus || 'Not specified',
        idNumber: transactionData.agentIdPassport || 'To be verified',
        phone: transactionData.agentContact || 'On file',
        email: transactionData.agentEmail || 'On file',
        isFirstTimeBuyer: transactionData.isFirstTimeBuyer || false,
        hasAgent: transactionData.hasAgent,
        agentName: transactionData.agentName,
        agentCompany: transactionData.agentCompany,
        agentContact: transactionData.agentContact,
        agentEmail: transactionData.agentEmail,
        agentRegNumber: transactionData.agentRegNumber,
        commissionType: transactionData.commissionType,
        commissionValue: transactionData.commissionValue,
        sellingPrice: transactionData.sellingPrice,
        valuationAmount: transactionData.valuationAmount,
        uploadedDocuments: transactionData.uploadedDocuments,
        hasBond: transactionData.hasBond,
        // Company details
        companyName: transactionData.companyName,
        registrationNumber: transactionData.registrationNumber,
        // Trust details
        trustName: transactionData.trustName,
        trustNumber: transactionData.trustNumber,
      };

      const response = await fetch(`${supabaseUrl}/functions/v1/generate-conveyancing-document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: transactionReferenceId,
          documentType: docType,
          propertyPrice: transactionData.sellingPrice ? `P ${parseInt(transactionData.sellingPrice).toLocaleString()}` : 'Not specified',
          buyerDetails,
          sellerDetails: null,
          buyerName: clientName,
          sellerName: 'Not specified',
          documentPaths: (transactionData.documentFilePaths || []).map(fp => ({ path: fp.path, bucket: fp.bucket })),
          documentImages: (transactionData.documentDataUrls || []).map(d => ({ dataUrl: d.dataUrl, name: d.name, docType: d.docType })),
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || `API request failed: ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('text/event-stream') && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              // Chat Completions streaming format
              const delta = parsed.choices?.[0]?.delta?.content || '';
              if (typeof delta === 'string' && delta) {
                fullText += delta;
                setStreamingContent(fullText);
              }
            } catch {
              // Skip non-JSON lines
            }
          }
        }

        setActiveDocument(fullText);
        setStreamingContent(fullText);
        setGeneratedDocuments(prev => ({ ...prev, [docType]: fullText }));
      } else {
        const data = await response.json();
        const text = data.document || '';
        setActiveDocument(text);
        setStreamingContent(text);
        setGeneratedDocuments(prev => ({ ...prev, [docType]: text }));
      }
    } catch (error) {
      console.error('Error generating document:', error);
      setDocError(error instanceof Error ? error.message : 'Failed to generate document.');
      setShowDocViewer(false);
    } finally {
      setIsGeneratingDoc(false);
    }
  }, [transactionData, transactionReferenceId]);

  const handleDocDownload = async () => {
    const content = activeDocument || generatedDocuments[selectedDocType];
    if (!content) return;
    let blob: Blob;
    try {
      if (selectedDocType === 'deed_of_sale') {
        blob = await pdf(
          <DeedOfSalePDF
            transactionId={transactionReferenceId}
            buyerName={transactionData.hasAgent ? transactionData.agentName : 'Buyer'}
            sellerName="Seller"
            propertyPrice={transactionData.sellingPrice || '0'}
            generatedContent={content}
          />
        ).toBlob();
      } else {
        // For other document types, use plain text PDF layout
        blob = await pdf(
          <DeedOfSalePDF
            transactionId={transactionReferenceId}
            buyerName={transactionData.hasAgent ? transactionData.agentName : 'Buyer'}
            sellerName="Seller"
            propertyPrice={transactionData.sellingPrice || '0'}
            generatedContent={content}
            documentTitle={DOC_TYPES.find(d => d.id === selectedDocType)?.label}
          />
        ).toBlob();
      }
    } catch {
      blob = new Blob([content], { type: 'text/plain' });
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedDocType}-${transactionReferenceId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDocPrint = () => {
    const content = activeDocument || generatedDocuments[selectedDocType];
    if (!content) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`<html><head><title>${DOC_TYPES.find(d => d.id === selectedDocType)?.label} - ${transactionReferenceId}</title><style>body{font-family:Arial,sans-serif;line-height:1.6;margin:40px}h1,h2,h3{color:#333}.content{white-space:pre-wrap}</style></head><body><div class="content">${content.replace(/\n/g, '<br>')}</div></body></html>`);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleSubmitTransaction = async () => {
    if (mode === 'client' && clientToken) {
      setIsSubmitting(true);
      setSubmitError(null);
      try {
        const result = await casesService.submitPartyData(clientToken, transactionData);
        if (!result.success) {
          setSubmitError(result.error || 'Submission failed. Please try again.');
          return;
        }
        setIsSubmitted(true);
        onClientSubmitComplete?.();
      } catch (err: any) {
        setSubmitError(err.message || 'An unexpected error occurred.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (transactionId) {
        markTransactionComplete(transactionId);
      }
      setIsSubmitted(true);
    }
  };

  const copyReferenceNumber = () => {
    navigator.clipboard.writeText(transactionReferenceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate conveyancer dashboard link (case ID only — conveyancer fetches data from DB)
  const generateConveyancerLink = () => {
    return `${window.location.origin}?conveyancer=${transactionReferenceId}`;
  };

  const copyConveyancerLink = async () => {
    const link = generateConveyancerLink();
    try {
      await navigator.clipboard.writeText(link);
      setConveyancerLinkCopied(true);
      setTimeout(() => setConveyancerLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy conveyancer link:', err);
    }
  };

  const openConveyancerDashboard = () => {
    const link = generateConveyancerLink();
    window.open(link, '_blank');
  };
  
  const handleDownloadSummary = async () => {
    try {
      const blob = await pdf(
        <TransactionSummaryPDF
          transactionId={transactionId || 'UNKNOWN'}
          transactionType={transactionData.transactionType}
          buyerName={transactionData.hasAgent ? transactionData.agentName : 'Buyer'}
          sellerName="Seller"
          propertyPrice={transactionData.sellingPrice}
          nationality={transactionData.nationality}
          entityType={transactionData.entityType}
          hasAgent={transactionData.hasAgent}
          agentName={transactionData.agentName}
          agentCompany={transactionData.agentCompany}
          uploadedDocuments={transactionData.uploadedDocuments}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transaction-summary-${transactionId || 'draft'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Failed to generate PDF. Please try again.');
    }
  };
  
  return (
    <div className="py-4 md:py-8 max-w-4xl mx-auto px-4">
      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 md:p-6 mb-6 md:mb-8">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mr-3">
              <Shield className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-800">Submission Failed</h3>
              <p className="text-sm text-red-700 mt-1">{submitError}</p>
            </div>
          </div>
        </div>
      )}

      {isSubmitted ? (
        <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-4 md:p-6 mb-6 md:mb-8 shadow-lg">
          <div className="flex items-center">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-green-100 flex items-center justify-center mr-3 md:mr-4">
              <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold text-green-800">
                {mode === 'client' ? 'Information Successfully Submitted' : 'Transaction Successfully Submitted'}
              </h3>
              <p className="text-sm md:text-base text-green-700 mt-1">
                {mode === 'client'
                  ? 'Your information has been submitted to the conveyancer. They will review your details and contact you if anything else is needed.'
                  : 'Your property transaction has been submitted and is now visible in the conveyancer\'s live dashboard.'}
              </p>
              {mode === 'conveyancer' && onComplete && (
                <button
                  onClick={onComplete}
                  className="mt-3 px-4 py-2 text-sm font-medium text-green-700 bg-white border border-green-300 rounded-lg hover:bg-green-50 transition-colors"
                >
                  Back to Dashboard
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 md:p-6 mb-6 md:mb-8 shadow-lg">
          <div className="flex items-center">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-100 flex items-center justify-center mr-3 md:mr-4">
              <FileText className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold text-blue-800">Review Your Transaction</h3>
              <p className="text-sm md:text-base text-blue-700 mt-1">
                Please review all details below before submitting your transaction.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Live Transaction Notification — conveyancer mode only */}
      {mode === 'conveyancer' && (
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 md:p-6 mb-6 md:mb-8 shadow-lg">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse mr-3"></div>
            <div>
              <h3 className="text-sm font-medium text-blue-800">Live Data Integration</h3>
              <p className="text-xs text-blue-700 mt-1">
                This transaction is now live in the conveyancer's dashboard with complete step-by-step progress tracking.
                Your conveyancer can see exactly which steps you've completed and monitor the transaction in real-time.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white overflow-hidden rounded-2xl shadow-xl mb-6 md:mb-8">
        <div className="px-4 py-4 md:px-6 md:py-5 bg-gradient-to-r from-blue-900 to-blue-800 relative">
          <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
          <div className="absolute -top-10 -left-10 h-32 w-32 rounded-full bg-blue-500 opacity-20 blur-2xl"></div>
          
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 relative">
            <h3 className="text-lg md:text-xl leading-6 font-bold text-white">
              Transaction Summary
            </h3>
            <span className="inline-flex items-center px-3 py-1 md:px-4 md:py-1.5 rounded-full text-xs md:text-sm font-medium bg-blue-100 text-blue-800 shadow-inner">
              Ref: {transactionReferenceId}
            </span>
          </div>
          <p className="mt-1 max-w-2xl text-xs md:text-sm text-blue-100">
            Complete summary of your property transaction details
          </p>
        </div>
        
        <div className="border-t border-gray-200 px-4 py-4 md:px-6 md:py-5">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 md:gap-x-6 gap-y-4 md:gap-y-8">
            <div className="flex">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center mr-2 md:mr-3">
                <FileText className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
              </div>
              <div>
                <dt className="text-xs md:text-sm font-medium text-gray-500">Transaction Type</dt>
                <dd className="mt-1 text-base md:text-lg text-gray-900 font-medium capitalize">{transactionData.transactionType}</dd>
              </div>
            </div>
            
            <div className="flex">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center mr-2 md:mr-3">
                <Clock className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
              </div>
              <div>
                <dt className="text-xs md:text-sm font-medium text-gray-500">Submission Date</dt>
                <dd className="mt-1 text-base md:text-lg text-gray-900 font-medium">{formatDate(new Date())}</dd>
              </div>
            </div>
            
            <div className="flex">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center mr-2 md:mr-3">
                <Banknote className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
              </div>
              <div>
                <dt className="text-xs md:text-sm font-medium text-gray-500">Property Price</dt>
                <dd className="mt-1 text-base md:text-lg text-gray-900 font-medium">{formatPrice(transactionData.sellingPrice)}</dd>
              </div>
            </div>
            
            {transactionData.valuationAmount && (
              <div className="flex">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center mr-2 md:mr-3">
                  <Building className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                </div>
                <div>
                  <dt className="text-xs md:text-sm font-medium text-gray-500">Valuation Amount</dt>
                  <dd className="mt-1 text-base md:text-lg text-gray-900 font-medium">{formatPrice(transactionData.valuationAmount)}</dd>
                </div>
              </div>
            )}
            
            {/* First Time Buyer Status */}
            {transactionData.transactionType === 'buying' && 
             transactionData.nationality === 'Botswana' && (
              <div className="flex">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center mr-2 md:mr-3">
                  <Building className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                </div>
                <div>
                  <dt className="text-xs md:text-sm font-medium text-gray-500">First Time Buyer</dt>
                  <dd className="mt-1 text-base md:text-lg text-gray-900 font-medium">
                    {transactionData.isFirstTimeBuyer ? 'Yes' : 'No'}
                  </dd>
                </div>
              </div>
            )}
            
            {transactionData.hasAgent ? (
              <div className="flex md:col-span-2">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center mr-2 md:mr-3">
                  <Users className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                </div>
                <div className="flex-grow">
                  <dt className="text-xs md:text-sm font-medium text-gray-500">Estate Agent</dt>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 mt-1">
                    <dd className="text-base md:text-lg text-gray-900 font-medium">{transactionData.agentName}</dd>
                    <dd className="text-base md:text-lg text-gray-900">{transactionData.agentContact}</dd>
                  </div>
                  {transactionData.agentCompany && (
                    <div className="mt-2 text-sm text-gray-700">
                      <span className="font-medium">Company:</span> {transactionData.agentCompany}
                      {transactionData.commissionType && transactionData.commissionValue && (
                        <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                          Commission: {transactionData.commissionType === 'percentage' ? `${transactionData.commissionValue}%` : formatPrice(transactionData.commissionValue)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center mr-2 md:mr-3">
                  <Users className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                </div>
                <div>
                  <dt className="text-xs md:text-sm font-medium text-gray-500">Entity Type</dt>
                  <dd className="mt-1 text-base md:text-lg text-gray-900 font-medium">{getEntityTypeDisplay(transactionData.entityType)}</dd>
                </div>
              </div>
            )}
            
            <div className="flex">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center mr-2 md:mr-3">
                <UserCircle className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
              </div>
              <div>
                <dt className="text-xs md:text-sm font-medium text-gray-500">Personal Information</dt>
                <div className="mt-1 space-y-1">
                  <div className="text-sm text-gray-900">
                    <span className="font-medium">Gender:</span> <span className="capitalize">{transactionData.gender}</span>
                  </div>
                  <div className="text-sm text-gray-900">
                    <span className="font-medium">Nationality:</span> {transactionData.nationality}
                  </div>
                  <div className="text-sm text-gray-900">
                    <span className="font-medium">Marital Status:</span> {getMaritalStatusDisplay(transactionData.maritalStatus)}
                  </div>
                </div>
              </div>
            </div>
            
            {transactionData.hasBond !== undefined && (
              <div className="flex">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center mr-2 md:mr-3">
                  <FileText className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                </div>
                <div>
                  <dt className="text-xs md:text-sm font-medium text-gray-500">Bond Status</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {transactionData.hasBond ? (
                      <div>
                        <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full">Property has a bond</span>
                        {transactionData.bondDocument && (
                          <div className="mt-1 text-xs">
                            <span className="font-medium">Document uploaded:</span> {transactionData.bondDocument}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">No bond on property</span>
                    )}
                  </dd>
                </div>
              </div>
            )}
          </dl>
        </div>
        
        <div className="px-4 py-4 md:px-6 md:py-5 bg-gray-50 border-t border-gray-200">
          <h4 className="text-sm md:text-base font-semibold text-gray-900 mb-3 md:mb-4">
            Uploaded Documents ({transactionData.uploadedDocuments.length})
          </h4>
          <ul className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200 shadow-sm">
            {transactionData.uploadedDocuments.slice(0, 4).map((doc, index) => (
              <li key={index} className="px-3 py-2 md:px-4 md:py-3 flex items-center justify-between text-xs md:text-sm hover:bg-gray-50">
                <div className="w-0 flex-1 flex items-center">
                  <FileText className="flex-shrink-0 h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                  <span className="ml-2 flex-1 w-0 truncate text-gray-700">{doc}</span>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <button className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                    View
                  </button>
                </div>
              </li>
            ))}
            {transactionData.uploadedDocuments.length > 4 && (
              <li className="px-3 py-2 md:px-4 md:py-3 text-center text-xs md:text-sm text-gray-500">
                + {transactionData.uploadedDocuments.length - 4} more documents
              </li>
            )}
          </ul>
        </div>
        
        <div className="px-4 py-4 md:px-6 md:py-5 bg-blue-50 border-t border-blue-200">
          <h4 className="text-sm md:text-base font-semibold text-gray-900 mb-3">
            Data Protection & Privacy
          </h4>
          <div className="flex items-start">
            <Shield className="h-4 w-4 md:h-5 md:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="ml-3">
              <p className="text-xs md:text-sm text-gray-700">
                All your data is encrypted at rest and in transit. We comply with data protection regulations including GDPR and the Data Protection Act 2018. Your information will be stored securely and only used for processing your transaction.
              </p>
              <button className="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center">
                <Lock className="h-3 w-3 mr-1" />
                View Privacy Policy
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conveyancer Dashboard Link Section — conveyancer mode only */}
      {mode === 'conveyancer' && <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4 md:p-6 mb-6 md:mb-8 shadow-lg">
        <div className="flex items-start">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-purple-100 flex items-center justify-center mr-3 md:mr-4 flex-shrink-0">
            <Users className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg md:text-xl font-bold text-purple-800 mb-2">Conveyancer Dashboard Access</h3>
            <p className="text-sm md:text-base text-purple-700 mb-4">
              Share this live dashboard link with your conveyancer to track transaction progress and generate legal documents.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={copyConveyancerLink}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Share2 className="h-4 w-4 mr-2" />
                {conveyancerLinkCopied ? 'Link Copied!' : 'Copy Conveyancer Link'}
              </button>
              
              <button
                onClick={openConveyancerDashboard}
                className="inline-flex items-center px-4 py-2 border border-purple-300 text-purple-700 bg-white rounded-lg hover:bg-purple-50 transition-colors"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Dashboard
              </button>
            </div>
            
            <div className="mt-3 bg-white bg-opacity-70 rounded-lg p-3 border border-purple-200">
              <p className="text-xs text-purple-700">
                <strong>Features:</strong> Live transaction tracking • AI document generation • Both buyer & seller information • Real-time progress updates
              </p>
            </div>
          </div>
        </div>
      </div>}

      {/* AI Document Generation — conveyancer mode */}
      {mode === 'conveyancer' && (
        <div className="bg-white rounded-2xl shadow-xl border mb-6 md:mb-8 overflow-hidden">
          <div className="px-4 py-4 md:px-6 md:py-5 bg-gradient-to-r from-purple-600 to-indigo-600">
            <div className="flex items-center">
              <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-white mr-2 md:mr-3" />
              <div>
                <h3 className="text-base md:text-lg font-bold text-white">AI Document Generation</h3>
                <p className="text-xs md:text-sm text-purple-100 mt-0.5">Generate legal documents from the transaction details entered so far</p>
              </div>
            </div>
          </div>

          <div className="px-4 py-4 md:px-6 md:py-5">
            {/* Document type pills */}
            <div className="flex flex-wrap gap-2 mb-4">
              {DOC_TYPES.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => {
                    setSelectedDocType(doc.id);
                    if (generatedDocuments[doc.id]) {
                      setActiveDocument(generatedDocuments[doc.id]);
                      setStreamingContent(generatedDocuments[doc.id]);
                    } else {
                      setActiveDocument(null);
                      setStreamingContent('');
                    }
                  }}
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selectedDocType === doc.id
                      ? 'bg-purple-100 text-purple-800 border-2 border-purple-400'
                      : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                  }`}
                >
                  {doc.short}
                  {generatedDocuments[doc.id] && (
                    <CheckCircle className="h-3 w-3 text-emerald-500 ml-1" />
                  )}
                </button>
              ))}
            </div>

            {/* Generate / Status area */}
            {!generatedDocuments[selectedDocType] ? (
              <div className="text-center py-6 bg-gradient-to-br from-purple-50 via-white to-indigo-50 rounded-xl border border-purple-100">
                <Sparkles className="h-8 w-8 text-purple-500 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
                  Generate a {DOC_TYPES.find(d => d.id === selectedDocType)?.label} using the transaction information entered. Missing details will be marked for completion.
                </p>
                <button
                  onClick={() => generateDocument(selectedDocType)}
                  disabled={isGeneratingDoc}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md text-sm font-medium inline-flex items-center disabled:opacity-50"
                >
                  {isGeneratingDoc ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
                  ) : (
                    <><Sparkles className="h-4 w-4 mr-2" />Generate with AI</>
                  )}
                </button>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-emerald-600 mr-2" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-900">
                        {DOC_TYPES.find(d => d.id === selectedDocType)?.label} Generated
                      </p>
                      <p className="text-xs text-emerald-700">
                        {generatedDocuments[selectedDocType].split(/\s+/).filter(Boolean).length.toLocaleString()} words
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => generateDocument(selectedDocType)}
                      disabled={isGeneratingDoc}
                      className="px-2.5 py-1.5 text-xs bg-white border border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-50 disabled:opacity-50"
                    >
                      Regenerate
                    </button>
                    <button
                      onClick={() => {
                        setActiveDocument(generatedDocuments[selectedDocType]);
                        setStreamingContent(generatedDocuments[selectedDocType]);
                        setShowDocViewer(true);
                      }}
                      className="px-2.5 py-1.5 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 inline-flex items-center"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />View
                    </button>
                    <button
                      onClick={handleDocPrint}
                      className="px-2.5 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 inline-flex items-center"
                    >
                      <Printer className="h-3.5 w-3.5 mr-1" />Print
                    </button>
                    <button
                      onClick={handleDocDownload}
                      className="px-2.5 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 inline-flex items-center"
                    >
                      <Download className="h-3.5 w-3.5 mr-1" />PDF
                    </button>
                  </div>
                </div>
              </div>
            )}

            {docError && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-between">
                <p className="text-sm text-red-700">{docError}</p>
                <button
                  onClick={() => { setDocError(null); generateDocument(selectedDocType); }}
                  className="px-3 py-1 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {!isSubmitted && (
        <div className="mb-6">
          <button
            onClick={handleSubmitTransaction}
            disabled={isSubmitting}
            className={`w-full py-3 px-6 border-2 border-transparent rounded-xl text-base font-semibold shadow-lg text-white bg-green-600 hover:bg-green-700 transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? (
              <><Loader2 className="inline-block mr-2 h-5 w-5 animate-spin" />Submitting...</>
            ) : (
              <><CheckCircle className="inline-block mr-2 h-5 w-5" />{mode === 'client' ? 'Submit Your Information' : 'Submit Transaction'}</>
            )}
          </button>
        </div>
      )}

      <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
        <button
          onClick={onPrevious}
          disabled={isSubmitted}
          className={`inline-flex items-center px-4 py-2 md:px-5 md:py-2.5 border-2 border-gray-300 rounded-lg text-sm md:text-base font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-colors ${isSubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <ArrowLeft className="mr-1 md:mr-2 h-4 w-4" />
          Back
        </button>
        
        <button
          onClick={copyReferenceNumber}
          className="inline-flex items-center px-4 py-2 md:px-5 md:py-2.5 border-2 border-gray-300 rounded-lg text-sm md:text-base font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-colors"
        >
          <Clipboard className="mr-1 md:mr-2 h-4 w-4 text-blue-600" />
          {copied ? 'Copied!' : 'Copy Reference'}
        </button>
        
        {mode === 'conveyancer' && (
          <>
            <button
              onClick={handleDownloadSummary}
              className="inline-flex items-center px-4 py-2 md:px-5 md:py-2.5 border-2 border-transparent rounded-lg text-sm md:text-base font-medium shadow-md text-white bg-primary hover:bg-primary-dark transition-colors"
            >
              <Download className="mr-1 md:mr-2 h-4 w-4" />
              Download Summary
            </button>

            <button
              onClick={() => setShowRoleModal(true)}
              className="sm:ml-auto inline-flex items-center px-4 py-2 md:px-5 md:py-2.5 border-2 border-gray-300 rounded-lg text-sm md:text-base font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-colors"
            >
              <Users className="mr-1 md:mr-2 h-4 w-4 text-blue-600" />
              View as...
            </button>
          </>
        )}
      </div>

      <div className="mt-6 md:mt-8 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 md:p-6 shadow-md border border-blue-200">
        <div className="flex">
          <div className="flex-shrink-0">
            <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
          </div>
          <div className="ml-3 md:ml-4">
            <h3 className="text-base md:text-lg font-semibold text-blue-900">Next Steps</h3>
            <p className="text-xs md:text-base text-blue-800 mt-1 md:mt-2">
              Our team will review your submission and contact you within 2 business days. 
              Remember to obtain tax clearance, letter of compliance (where necessary), 
              and pay rates clearance to finalize your transaction.
            </p>
            <div className="mt-3 md:mt-4 grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
              <div className="bg-white p-3 rounded-lg border border-blue-200 flex flex-col items-center">
                <span className="text-xs font-medium text-gray-600 mb-1">Your Documents</span>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                  <span className="text-sm font-medium text-green-700">Complete</span>
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-blue-200 flex flex-col items-center">
                <span className="text-xs font-medium text-gray-600 mb-1">Compliance Checks</span>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-amber-500 mr-1"></div>
                  <span className="text-sm font-medium text-amber-700">In Progress</span>
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-blue-200 flex flex-col items-center">
                <span className="text-xs font-medium text-gray-600 mb-1">External Clearances</span>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-gray-300 mr-1"></div>
                  <span className="text-sm font-medium text-gray-700">Pending</span>
                </div>
              </div>
            </div>
            <div className="mt-3 md:mt-4 bg-white p-3 md:p-4 rounded-lg border border-blue-200">
              <p className="text-xs md:text-sm text-gray-600">
                Estimated completion time: <span className="font-medium text-blue-700">3-4 weeks</span>
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Document Stream Viewer */}
      <DocumentStreamViewer
        isOpen={showDocViewer}
        isStreaming={isGeneratingDoc}
        content={streamingContent || activeDocument || ''}
        onClose={() => setShowDocViewer(false)}
        onDownload={handleDocDownload}
        onPrint={handleDocPrint}
        caseNumber={transactionReferenceId}
        buyerName={transactionData.hasAgent ? transactionData.agentName : 'Buyer'}
        sellerName="Seller"
      />

      {/* Role-Based View Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-10 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 md:p-8 m-4 relative overflow-hidden">
            <button 
              onClick={() => setShowRoleModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <div className="relative">
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">Select Role</h3>
              <p className="text-sm text-gray-600 mb-4">
                Select a role to view the dashboard from different perspectives.
              </p>
              
              <div className="grid grid-cols-1 gap-3 mb-5">
                <button
                  className={`flex items-center p-4 rounded-lg border-2 ${
                    selectedRole === 'conveyancer' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedRole('conveyancer')}
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="text-sm font-medium text-gray-900">Conveyancer</h4>
                    <p className="text-xs text-gray-500">Full access to documents and transaction status</p>
                  </div>
                </button>
                
                <button
                  className={`flex items-center p-4 rounded-lg border-2 ${
                    selectedRole === 'agent' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedRole('agent')}
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="text-sm font-medium text-gray-900">Estate Agent</h4>
                    <p className="text-xs text-gray-500">View-only access to transaction status</p>
                  </div>
                </button>
              </div>
              
              <button
                onClick={() => {
                  if (selectedRole) {
                    // In a real app, this would redirect to the appropriate dashboard
                    alert(`Switching to ${selectedRole} view.`);
                    setShowRoleModal(false);
                  }
                }}
                disabled={!selectedRole}
                className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium ${
                  selectedRole ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                } transition-colors`}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step7Summary;