import React, { useState, useEffect } from 'react';
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
  Clock as ClockIcon
} from 'lucide-react';
import TransactionAuditLog from './TransactionAuditLog';
import TransactionLogger from './TransactionLogger';

interface ConveyancerDashboardProps {
  transactionId: string;
  buyerData?: any;
  sellerData?: any;
  onBack: () => void;
}

const ConveyancerDashboard: React.FC<ConveyancerDashboardProps> = ({
  transactionId,
  buyerData,
  sellerData,
  onBack
}) => {
  const [isGeneratingDocument, setIsGeneratingDocument] = useState(false);
  const [generatedDocument, setGeneratedDocument] = useState<string | null>(null);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showAuditLog, setShowAuditLog] = useState(false);
  
  // Mock user for logging actions
  const mockUser = {
    id: 'user-1',
    organization_id: 'org-1',
    email: 'monti@orionx.xyz',
    first_name: 'Monti',
    last_name: 'K.',
    role: 'super_admin',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    organization: {
      id: 'org-1',
      name: 'OrionX Legal Services',
      type: 'conveyancer',
      email: 'info@orionxlegal.co.bw',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  };

  // Mock transaction data - in a real app, this would come from a database
  useEffect(() => {
    // Simulate loading transaction data
    const mockTransactions = [
      {
        id: transactionId,
        buyerName: buyerData?.hasAgent ? buyerData.agentName : (buyerData?.entityType === 'individual' ? 'John Doe' : buyerData?.companyName || 'Buyer Entity'),
        sellerName: sellerData?.hasAgent ? sellerData.agentName : (sellerData?.entityType === 'individual' ? 'Jane Smith' : sellerData?.companyName || 'Seller Entity'),
        propertyPrice: buyerData?.sellingPrice || sellerData?.sellingPrice || '1500000',
        status: 'Documents Uploaded',
        progress: 75,
        submissionDate: new Date().toISOString().split('T')[0],
        buyerDocuments: buyerData?.uploadedDocuments || ['ID Document', 'Proof of Address', 'Bank Statement'],
        sellerDocuments: sellerData?.uploadedDocuments || ['Title Deed', 'Rates Clearance', 'ID Document'],
        buyerDetails: buyerData,
        sellerDetails: sellerData
      }
    ];
    setTransactions(mockTransactions);

    // Log this view in the audit trail
    TransactionLogger.log(
      transactionId,
      mockUser,
      TransactionLogger.ActionTypes.VIEW,
      'Viewed transaction details',
      { dashboard_access: 'conveyancer_dashboard' }
    );
  }, [transactionId, buyerData, sellerData]);

  const currentTransaction = transactions.find(t => t.id === transactionId);

  const formatCurrency = (amount: string) => {
    return `P ${parseInt(amount || '0').toLocaleString()}`;
  };

  const generateConveyancingDocument = async () => {
    setIsGeneratingDocument(true);
    setDocumentError(null);

    // Log the document generation attempt
    TransactionLogger.log(
      transactionId,
      mockUser,
      TransactionLogger.ActionTypes.DOCUMENT_REVIEW,
      'Initiated document generation',
      { document_type: 'conveyancing_document' }
    );

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a legal document generator specializing in property conveyancing documents for Botswana. Generate professional, legally compliant conveyancing documents.'
            },
            {
              role: 'user',
              content: `Generate a comprehensive conveyancing document for a property transaction in Botswana with the following details:

Transaction ID: ${transactionId}
Property Price: ${formatCurrency(currentTransaction?.propertyPrice || '0')}

BUYER INFORMATION:
${currentTransaction?.buyerDetails ? JSON.stringify(currentTransaction.buyerDetails, null, 2) : 'Buyer: ' + currentTransaction?.buyerName}

SELLER INFORMATION:
${currentTransaction?.sellerDetails ? JSON.stringify(currentTransaction.sellerDetails, null, 2) : 'Seller: ' + currentTransaction?.sellerName}

Please generate a complete conveyancing document including:
1. Deed of Sale/Transfer
2. All necessary clauses for Botswana property law
3. Buyer and seller obligations
4. Payment terms
5. Transfer conditions
6. Legal warranties
7. Signature blocks

Format it as a professional legal document with proper headings, clauses, and legal language appropriate for Botswana conveyancing.`
            }
          ],
          max_tokens: 3000,
          temperature: 0.1
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const generatedText = data.choices[0]?.message?.content || 'Failed to generate document';
      
      setGeneratedDocument(generatedText);
      
      // Log successful generation
      TransactionLogger.log(
        transactionId,
        mockUser,
        TransactionLogger.ActionTypes.DOCUMENT_REVIEW,
        'Successfully generated conveyancing document',
        { document_size: generatedText.length }
      );
    } catch (error) {
      console.error('Error generating document:', error);
      setDocumentError('Failed to generate document. Please check your API key and try again.');
      
      // Log error
      TransactionLogger.log(
        transactionId,
        mockUser,
        TransactionLogger.ActionTypes.DOCUMENT_REVIEW,
        'Failed to generate document',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    } finally {
      setIsGeneratingDocument(false);
    }
  };

  const downloadDocument = () => {
    if (!generatedDocument) return;
    
    // Log document download
    TransactionLogger.log(
      transactionId,
      mockUser,
      TransactionLogger.ActionTypes.DOCUMENT_DOWNLOAD,
      'Downloaded conveyancing document',
      { document_type: 'conveyancing_document' }
    );
    
    const blob = new Blob([generatedDocument], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conveyancing-document-${transactionId}.txt`;
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
      mockUser,
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
              
              {!generatedDocument && !isGeneratingDocument && (
                <div className="text-center py-8">
                  <Sparkles className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Generate Conveyancing Document</h4>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Use AI to automatically generate a comprehensive conveyancing document including both buyer and seller information.
                  </p>
                  <button
                    onClick={generateConveyancingDocument}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center mx-auto"
                  >
                    <Sparkles className="h-5 w-5 mr-2" />
                    Generate Document with AI
                  </button>
                </div>
              )}
              
              {isGeneratingDocument && (
                <div className="text-center py-8">
                  <Loader2 className="h-12 w-12 text-purple-600 mx-auto mb-4 animate-spin" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Generating Document...</h4>
                  <p className="text-gray-600">
                    AI is creating your conveyancing document. This may take a few moments.
                  </p>
                </div>
              )}
              
              {documentError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                    <p className="text-red-800 font-medium">Generation Failed</p>
                  </div>
                  <p className="text-red-700 text-sm mt-1">{documentError}</p>
                  <button
                    onClick={generateConveyancingDocument}
                    className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    Try Again
                  </button>
                </div>
              )}
              
              {generatedDocument && (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      <p className="text-green-800 font-medium">Document Generated Successfully</p>
                    </div>
                    <p className="text-green-700 text-sm mt-1">
                      Your conveyancing document has been generated and is ready for review.
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap">{generatedDocument}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
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
                      mockUser,
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
                    mockUser,
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
    </div>
  );
};

export default ConveyancerDashboard;