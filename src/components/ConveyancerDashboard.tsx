import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Download, 
  Eye, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  User, 
  Users, 
  Building, 
  Calendar,
  Phone,
  Mail,
  MapPin,
  Banknote,
  ArrowLeft,
  Loader2,
  Sparkles,
  FileCheck,
  Printer,
  Shield,
  History,
  Clock as ClockIcon,
  Copy,
  Check,
  Link2
} from 'lucide-react';
import TransactionAuditLog from './TransactionAuditLog';
import TransactionLogger from './TransactionLogger';
import { useAuth } from '../hooks/useAuth';
import { pdf } from '@react-pdf/renderer';
import DeedOfSalePDF from '../lib/pdf/deedOfSale';
import * as casesService from '../services/cases.service';
import type { CaseDocument } from '../services/cases.service';
import type { CaseShareToken } from '../types/database';
import DocumentStreamViewer from './DocumentStreamViewer';

interface ConveyancerDashboardProps {
  transactionId: string;
  buyerData?: any;
  sellerData?: any;
  onBack: () => void;
}

type DocumentType = 'deed_of_sale' | 'deed_of_transfer' | 'transfer_duty' | 'power_of_attorney' | 'declaration_of_purchase' | 'affidavit' | 'bond_registration' | 'compliance_certificate' | 'missing_information';

const DOCUMENT_TYPES: { id: DocumentType; label: string; description: string }[] = [
  { id: 'missing_information', label: 'Missing Information Checklist', description: 'Transaction readiness review — flags missing data and documents' },
  { id: 'deed_of_sale', label: 'Deed of Sale & Transfer', description: 'Full conveyancing agreement between buyer and seller' },
  { id: 'deed_of_transfer', label: 'Deed of Transfer (Registry)', description: 'Actual transfer document registered at the Deeds Registry' },
  { id: 'transfer_duty', label: 'Transfer Duty Declaration', description: 'Transfer Duty Act (Cap 53:01) declaration form' },
  { id: 'power_of_attorney', label: 'Power of Attorney to Transfer', description: 'POA to give transfer and Declaration of Seller' },
  { id: 'declaration_of_purchase', label: 'Declaration of Purchaser', description: 'Statutory declaration by the buyer/purchaser' },
  { id: 'affidavit', label: 'Affidavit', description: 'Sworn statement supporting the property transaction' },
  { id: 'bond_registration', label: 'Bond Registration', description: 'Mortgage bond registration document for the property' },
  { id: 'compliance_certificate', label: 'Compliance Certificate', description: 'Municipal and regulatory compliance declaration' },
];

const ConveyancerDashboard: React.FC<ConveyancerDashboardProps> = ({
  transactionId,
  buyerData,
  sellerData,
  onBack
}) => {
  const { orgUser, organization: authOrg } = useAuth();
  const [isGeneratingDocument, setIsGeneratingDocument] = useState(false);
  const [generatedDocument, setGeneratedDocument] = useState<string | null>(null);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoadingCase, setIsLoadingCase] = useState(true);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [shareTokens, setShareTokens] = useState<CaseShareToken[]>([]);
  const [copiedToken, setCopiedToken] = useState<'buyer' | 'seller' | null>(null);
  const [buyerStatus, setBuyerStatus] = useState<string>('pending');
  const [sellerStatus, setSellerStatus] = useState<string>('pending');
  const [caseDocuments, setCaseDocuments] = useState<CaseDocument[]>([]);
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>('deed_of_sale');
  const [generatedDocuments, setGeneratedDocuments] = useState<Record<DocumentType, string>>({} as Record<DocumentType, string>);

  // Use real user from auth context for logging
  const currentUser = orgUser ? {
    id: orgUser.id,
    organization_id: orgUser.organization_id,
    email: orgUser.email,
    first_name: orgUser.first_name,
    last_name: orgUser.last_name,
    role: orgUser.role,
    is_active: orgUser.is_active,
    created_at: orgUser.created_at,
    updated_at: orgUser.updated_at,
    organization: authOrg ? {
      id: authOrg.id,
      name: authOrg.name,
      type: authOrg.type,
      email: authOrg.email,
      is_active: authOrg.is_active,
      created_at: authOrg.created_at,
      updated_at: authOrg.updated_at,
    } : undefined,
  } : null;

  // Fetch case data from Supabase (real data) with props as fallback
  useEffect(() => {
    async function loadCaseData() {
      let dbBuyerData = buyerData;
      let dbSellerData = sellerData;
      let caseRecord: any = null;

      // Try to fetch real case from database
      try {
        caseRecord = await casesService.getCase(transactionId);
        if (caseRecord) {
          // Use DB data if available, props as fallback
          if (caseRecord.buyer_data) dbBuyerData = caseRecord.buyer_data;
          if (caseRecord.seller_data) dbSellerData = caseRecord.seller_data;
          setBuyerStatus(caseRecord.buyer_status || 'pending');
          setSellerStatus(caseRecord.seller_status || 'pending');
        }
      } catch {
        // Case may not exist in DB (legacy transactions)
      }

      // Fetch share tokens
      try {
        const tokens = await casesService.getTokensForCase(transactionId);
        setShareTokens(tokens);
      } catch {
        // Tokens may not exist
      }

      // Fetch case documents for AI generation
      try {
        const docs = await casesService.getCaseDocuments(transactionId);
        setCaseDocuments(docs);
      } catch {
        // Documents may not exist yet
      }

      // Build transaction display data
      const bd = dbBuyerData;
      const sd = dbSellerData;

      const getBuyerName = () => {
        if (bd?.clientName) return bd.clientName;
        if (bd?.hasAgent) return bd.agentName;
        if (caseRecord?.client_name) return caseRecord.client_name;
        return buyerData?.agentName || 'Buyer';
      };

      const getSellerName = () => {
        if (sd?.clientName) return sd.clientName;
        if (sd?.hasAgent) return sd.agentName;
        return sellerData?.agentName || 'Seller';
      };

      const price = bd?.sellingPrice || sd?.sellingPrice || caseRecord?.property?.price?.toString() || '0';

      const txn = {
        id: transactionId,
        buyerName: getBuyerName(),
        sellerName: getSellerName(),
        propertyPrice: price,
        propertyAddress: caseRecord?.property?.address || 'Address pending',
        status: caseRecord?.status === 'in_progress' ? 'In Progress' : caseRecord?.status === 'completed' ? 'Completed' : 'Documents Uploaded',
        progress: caseRecord?.status === 'completed' ? 100 : (bd && sd ? 75 : 50),
        submissionDate: caseRecord?.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        buyerDocuments: bd?.uploadedDocuments || [],
        sellerDocuments: sd?.uploadedDocuments || [],
        buyerDetails: bd,
        sellerDetails: sd,
        caseNumber: caseRecord?.case_number || transactionId,
      };

      setTransactions([txn]);

      // Log this view
      TransactionLogger.log(
        transactionId,
        currentUser,
        TransactionLogger.ActionTypes.VIEW,
        'Viewed transaction details',
        { dashboard_access: 'conveyancer_dashboard' }
      );
    }

    loadCaseData().finally(() => setIsLoadingCase(false));
  }, [transactionId, buyerData, sellerData]);

  const copyShareLink = (role: 'buyer' | 'seller') => {
    const token = shareTokens.find(t => t.role === role);
    if (!token) return;
    const link = `${window.location.origin}?case=${token.token}&role=${role}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(role);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const currentTransaction = transactions.find(t => t.id === transactionId);

  const formatCurrency = (amount: string) => {
    return `P ${parseInt(amount || '0').toLocaleString()}`;
  };

  const generateConveyancingDocument = useCallback(async (docType?: DocumentType) => {
    const typeToGenerate = docType || selectedDocType;
    let finalText = '';
    setIsGeneratingDocument(true);
    setDocumentError(null);
    setStreamingContent('');
    setShowDocumentViewer(true);
    setGeneratedDocument(null);

    const docLabel = DOCUMENT_TYPES.find(d => d.id === typeToGenerate)?.label || 'Document';

    TransactionLogger.log(
      transactionId,
      currentUser,
      TransactionLogger.ActionTypes.DOCUMENT_REVIEW,
      `Initiated ${docLabel} generation`,
      { document_type: typeToGenerate }
    );

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-conveyancing-document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId,
          documentType: typeToGenerate,
          propertyPrice: formatCurrency(currentTransaction?.propertyPrice || '0'),
          buyerDetails: currentTransaction?.buyerDetails || null,
          sellerDetails: currentTransaction?.sellerDetails || null,
          buyerName: currentTransaction?.buyerName || 'Not specified',
          sellerName: currentTransaction?.sellerName || 'Not specified',
          documentPaths: caseDocuments.map(d => ({ path: d.file_path, bucket: 'documents', name: d.document_name, type: d.document_type })),
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || `API request failed: ${response.status}`);
      }

      // Check if we got SSE stream or JSON
      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('text/event-stream') && response.body) {
        // Stream SSE events from OpenAI Responses API
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

        setGeneratedDocument(fullText);
        setStreamingContent(fullText);
        setGeneratedDocuments(prev => ({ ...prev, [typeToGenerate]: fullText }));
        finalText = fullText;
      } else {
        // Fallback: JSON response (non-streaming)
        const data = await response.json();
        const text = data.document || '';
        setGeneratedDocument(text);
        setStreamingContent(text);
        setGeneratedDocuments(prev => ({ ...prev, [typeToGenerate]: text }));
        finalText = text;
      }

      TransactionLogger.log(
        transactionId,
        currentUser,
        TransactionLogger.ActionTypes.DOCUMENT_REVIEW,
        `Successfully generated ${docLabel}`,
        { document_type: typeToGenerate, document_size: finalText.length }
      );
    } catch (error) {
      console.error('Error generating document:', error);
      setDocumentError(
        error instanceof Error
          ? error.message
          : 'Failed to generate document. Please check your API key and try again.'
      );
      setShowDocumentViewer(false);

      TransactionLogger.log(
        transactionId,
        currentUser,
        TransactionLogger.ActionTypes.DOCUMENT_REVIEW,
        'Failed to generate document',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    } finally {
      setIsGeneratingDocument(false);
    }
  }, [transactionId, currentTransaction, currentUser, caseDocuments, selectedDocType]);

  const downloadDocument = async () => {
    if (!generatedDocument) return;
    
    // Log document download
    TransactionLogger.log(
      transactionId,
      currentUser,
      TransactionLogger.ActionTypes.DOCUMENT_DOWNLOAD,
      'Downloaded conveyancing document',
      { document_type: 'conveyancing_document' }
    );
    
    // Generate a professional PDF from the AI content
    let blob: Blob;
    try {
      blob = await pdf(
        <DeedOfSalePDF
          transactionId={transactionId}
          buyerName={currentTransaction?.buyerName || 'Buyer'}
          sellerName={currentTransaction?.sellerName || 'Seller'}
          propertyPrice={currentTransaction?.propertyPrice || '0'}
          generatedContent={generatedDocument}
          firmName={authOrg?.name}
          lawyerName={orgUser ? `${orgUser.first_name || ''} ${orgUser.last_name || ''}`.trim() : undefined}
        />
      ).toBlob();
    } catch {
      // Fallback to text if PDF generation fails
      blob = new Blob([generatedDocument], { type: 'text/plain' });
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conveyancing-document-${transactionId}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const printDocument = () => {
    if (!generatedDocument) return;
    
    // Log document print
    TransactionLogger.log(
      transactionId,
      currentUser,
      TransactionLogger.ActionTypes.DOCUMENT_DOWNLOAD,
      'Printed conveyancing document',
      { document_type: 'conveyancing_document', print_request: true }
    );
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Conveyancing Document - ${transactionId}</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
              h1, h2, h3 { color: #333; }
              .header { text-align: center; margin-bottom: 30px; }
              .content { white-space: pre-wrap; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Conveyancing Document</h1>
              <p>Transaction ID: ${transactionId}</p>
            </div>
            <div class="content">${generatedDocument.replace(/\n/g, '<br>')}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (isLoadingCase) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading case data...</p>
        </div>
      </div>
    );
  }

  if (!currentTransaction) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-600">Transaction not found.</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button
                onClick={onBack}
                className="mr-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Conveyancer Dashboard</h1>
                <p className="text-sm text-gray-600">Transaction Management & Document Generation</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium">
                Live Transaction
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full font-medium">
                {currentTransaction.status}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Transaction Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Transaction Summary */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FileText className="h-5 w-5 text-blue-600 mr-2" />
                  Transaction Details
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowAuditLog(true)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center"
                  >
                    <History className="h-4 w-4 mr-1" />
                    Audit Log
                  </button>
                  <span className="text-sm text-gray-500">ID: {transactionId}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Submitted: {currentTransaction.submissionDate}</span>
                  </div>
                  <div className="flex items-center">
                    <Banknote className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Property Value: {formatCurrency(currentTransaction.propertyPrice)}</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">Progress</span>
                      <span className="text-sm text-gray-600">{currentTransaction.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${currentTransaction.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Parties Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Buyer Information */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 text-green-600 mr-2" />
                  Buyer Information
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Name</p>
                    <p className="text-gray-900">{currentTransaction.buyerName}</p>
                  </div>
                  
                  {currentTransaction.buyerDetails && (
                    <>
                      {currentTransaction.buyerDetails.hasAgent && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">Agent</p>
                          <p className="text-gray-900">{currentTransaction.buyerDetails.agentName}</p>
                          <p className="text-sm text-gray-600">{currentTransaction.buyerDetails.agentCompany}</p>
                        </div>
                      )}
                      
                      {currentTransaction.buyerDetails.nationality && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">Nationality</p>
                          <p className="text-gray-900">{currentTransaction.buyerDetails.nationality}</p>
                        </div>
                      )}
                      
                      {currentTransaction.buyerDetails.isFirstTimeBuyer && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-sm font-medium text-green-800">First Time Buyer</p>
                          <p className="text-xs text-green-700">Eligible for transfer duty exemption</p>
                        </div>
                      )}
                    </>
                  )}
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700">Documents ({currentTransaction.buyerDocuments.length})</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {currentTransaction.buyerDocuments.slice(0, 3).map((doc: string, index: number) => (
                        <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          {doc}
                        </span>
                      ))}
                      {currentTransaction.buyerDocuments.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{currentTransaction.buyerDocuments.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Seller Information */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Building className="h-5 w-5 text-blue-600 mr-2" />
                  Seller Information
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Name</p>
                    <p className="text-gray-900">{currentTransaction.sellerName}</p>
                  </div>
                  
                  {currentTransaction.sellerDetails && (
                    <>
                      {currentTransaction.sellerDetails.hasAgent && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">Agent</p>
                          <p className="text-gray-900">{currentTransaction.sellerDetails.agentName}</p>
                          <p className="text-sm text-gray-600">{currentTransaction.sellerDetails.agentCompany}</p>
                        </div>
                      )}
                      
                      {currentTransaction.sellerDetails.nationality && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">Nationality</p>
                          <p className="text-gray-900">{currentTransaction.sellerDetails.nationality}</p>
                        </div>
                      )}
                    </>
                  )}
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700">Documents ({currentTransaction.sellerDocuments.length})</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {currentTransaction.sellerDocuments.slice(0, 3).map((doc: string, index: number) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {doc}
                        </span>
                      ))}
                      {currentTransaction.sellerDocuments.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{currentTransaction.sellerDocuments.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Document Generation */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Sparkles className="h-5 w-5 text-purple-600 mr-2" />
                  AI Document Generation
                </h3>
                {generatedDocument && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowDocumentViewer(true)}
                      className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors flex items-center"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </button>
                    <button
                      onClick={printDocument}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
                    >
                      <Printer className="h-4 w-4 mr-1" />
                      Print
                    </button>
                    <button
                      onClick={downloadDocument}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </button>
                  </div>
                )}
              </div>

              {/* Document Type Selector */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Document Type</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DOCUMENT_TYPES.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => {
                        setSelectedDocType(doc.id);
                        // Show previously generated doc if available
                        if (generatedDocuments[doc.id]) {
                          setGeneratedDocument(generatedDocuments[doc.id]);
                          setStreamingContent(generatedDocuments[doc.id]);
                        } else {
                          setGeneratedDocument(null);
                          setStreamingContent('');
                        }
                      }}
                      className={`flex items-start p-3 rounded-lg border-2 transition-colors text-left ${
                        selectedDocType === doc.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900 truncate">{doc.label}</p>
                          {generatedDocuments[doc.id] && (
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-500 ml-1.5 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{doc.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {!generatedDocument && !isGeneratingDocument && (
                <div className="text-center py-8 bg-gradient-to-br from-purple-50 via-white to-indigo-50 rounded-xl border border-purple-100">
                  <div className="relative inline-block mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-purple-500/25">
                      <Sparkles className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <h4 className="text-lg font-serif font-semibold text-gray-900 mb-2">
                    Generate {DOCUMENT_TYPES.find(d => d.id === selectedDocType)?.label}
                  </h4>
                  <p className="text-gray-500 mb-6 max-w-lg mx-auto text-sm leading-relaxed">
                    AI will draft a comprehensive, legally-structured document using all transaction details, buyer and seller information, and property data.
                  </p>
                  <button
                    onClick={() => generateConveyancingDocument()}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg shadow-purple-500/25 flex items-center mx-auto text-sm font-medium"
                  >
                    <Sparkles className="h-5 w-5 mr-2" />
                    Generate with AI
                  </button>
                </div>
              )}

              {generatedDocument && !showDocumentViewer && (
                <div className="space-y-3">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-emerald-600 mr-2" />
                        <div>
                          <p className="text-emerald-900 font-semibold text-sm">
                            {DOCUMENT_TYPES.find(d => d.id === selectedDocType)?.label} Generated
                          </p>
                          <p className="text-emerald-700 text-xs mt-0.5">
                            {generatedDocument.split(/\s+/).filter(Boolean).length.toLocaleString()} words &middot; Ready for review
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => generateConveyancingDocument()}
                          className="px-3 py-1.5 text-xs bg-white border border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors"
                        >
                          Regenerate
                        </button>
                        <button
                          onClick={() => setShowDocumentViewer(true)}
                          className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-xs font-medium flex items-center"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          Open
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Party Status & Share Links */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Link2 className="h-5 w-5 text-blue-600 mr-2" />
                Party Status
              </h3>
              <div className="space-y-4">
                {/* Buyer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Buyer</span>
                  </div>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    buyerStatus === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {buyerStatus === 'completed' ? 'Completed' : 'Pending'}
                  </span>
                </div>
                {shareTokens.find(t => t.role === 'buyer') && (
                  <button
                    onClick={() => copyShareLink('buyer')}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                  >
                    {copiedToken === 'buyer' ? <Check className="h-3.5 w-3.5 mr-1.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
                    {copiedToken === 'buyer' ? 'Copied!' : 'Copy Buyer Link'}
                  </button>
                )}

                {/* Seller */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Building className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Seller</span>
                  </div>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    sellerStatus === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {sellerStatus === 'completed' ? 'Completed' : 'Pending'}
                  </span>
                </div>
                {shareTokens.find(t => t.role === 'seller') && (
                  <button
                    onClick={() => copyShareLink('seller')}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                  >
                    {copiedToken === 'seller' ? <Check className="h-3.5 w-3.5 mr-1.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
                    {copiedToken === 'seller' ? 'Copied!' : 'Copy Seller Link'}
                  </button>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                  <Eye className="h-4 w-4 mr-2" />
                  View All Documents
                </button>
                <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center">
                  <FileCheck className="h-4 w-4 mr-2" />
                  Mark as Reviewed
                </button>
                <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
                  <Download className="h-4 w-4 mr-2" />
                  Export Transaction
                </button>
              </div>
            </div>

            {/* Status Timeline */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Timeline</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Documents Submitted</p>
                    <p className="text-xs text-gray-500">Both parties completed</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <Clock className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Under Review</p>
                    <p className="text-xs text-gray-500">Awaiting conveyancer action</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                    <FileText className="h-4 w-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Document Generation</p>
                    <p className="text-xs text-gray-400">Pending</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                    <CheckCircle className="h-4 w-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Transfer Complete</p>
                    <p className="text-xs text-gray-400">Pending</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction Notes */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
              <textarea
                className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add notes about this transaction..."
                onChange={(e) => {
                  if (e.target.value.trim() !== '') {
                    TransactionLogger.log(
                      transactionId,
                      currentUser,
                      TransactionLogger.ActionTypes.COMMENT_ADD,
                      'Added transaction note',
                      { note_content: e.target.value }
                    );
                  }
                }}
              />
              <button 
                className="mt-3 w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                onClick={() => {
                  TransactionLogger.log(
                    transactionId,
                    currentUser,
                    TransactionLogger.ActionTypes.COMMENT_ADD,
                    'Saved transaction note',
                    { note_saved: true }
                  );
                  alert('Note saved!');
                }}
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Log Modal */}
      <TransactionAuditLog
        isOpen={showAuditLog}
        transactionId={transactionId}
        onClose={() => setShowAuditLog(false)}
      />

      {/* Streaming Document Viewer */}
      <DocumentStreamViewer
        isOpen={showDocumentViewer}
        isStreaming={isGeneratingDocument}
        content={streamingContent || generatedDocument || ''}
        onClose={() => setShowDocumentViewer(false)}
        onDownload={downloadDocument}
        onPrint={printDocument}
        caseNumber={currentTransaction?.caseNumber || transactionId}
        buyerName={currentTransaction?.buyerName || 'Buyer'}
        sellerName={currentTransaction?.sellerName || 'Seller'}
        firmName={authOrg?.name}
        lawyerName={orgUser ? `${orgUser.first_name || ''} ${orgUser.last_name || ''}`.trim() : undefined}
      />

      {/* Error Popup Modal */}
      {documentError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="bg-red-50 px-6 py-4 border-b border-red-100">
              <div className="flex items-center">
                <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
                <h3 className="text-lg font-semibold text-red-900">Document Generation Failed</h3>
              </div>
            </div>
            <div className="px-6 py-5">
              <p className="text-gray-700 text-sm leading-relaxed">{documentError}</p>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => setDocumentError(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Dismiss
              </button>
              <button
                onClick={() => { setDocumentError(null); generateConveyancingDocument(); }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConveyancerDashboard;