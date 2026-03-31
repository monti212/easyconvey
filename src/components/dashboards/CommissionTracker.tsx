import React, { useState, useRef } from 'react';
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  Receipt,
  Download,
  Upload,
  Eye,
  X,
  AlertCircle,
  CreditCard,
  Calendar,
  FileText
} from 'lucide-react';

interface Transaction {
  id: string;
  transaction_number: string;
  property_title: string;
  selling_price: number;
  commission_amount: number;
  commission_status: 'pending' | 'approved' | 'paid';
  status: string;
  submitted_at: string;
  updated_at: string;
}

interface CommissionTrackerProps {
  transactions: Transaction[];
  onClose: () => void;
}

const CommissionTracker: React.FC<CommissionTrackerProps> = ({
  transactions,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'pending' | 'ready' | 'paid'>('overview');
  const [showInvoiceUpload, setShowInvoiceUpload] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [invoiceSubmitting, setInvoiceSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatCurrency = (amount: number) => `P ${amount.toLocaleString()}`;

  const getCommissionStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'paid': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCommissionStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'paid': return <Receipt className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const pendingCommissions = transactions.filter(t => t.commission_status === 'pending' && t.status !== 'registered');
  const readyCommissions = transactions.filter(t => t.status === 'registered' && t.commission_status === 'pending');
  const approvedCommissions = transactions.filter(t => t.commission_status === 'approved');
  const paidCommissions = transactions.filter(t => t.commission_status === 'paid');

  const totalPending = pendingCommissions.reduce((sum, t) => sum + t.commission_amount, 0);
  const totalReady = readyCommissions.reduce((sum, t) => sum + t.commission_amount, 0);
  const totalApproved = approvedCommissions.reduce((sum, t) => sum + t.commission_amount, 0);
  const totalPaid = paidCommissions.reduce((sum, t) => sum + t.commission_amount, 0);

  const handleInvoiceUpload = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowInvoiceUpload(true);
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-yellow-800">In Progress</p>
              <p className="text-2xl font-bold text-yellow-900">{formatCurrency(totalPending)}</p>
              <p className="text-sm text-yellow-700">{pendingCommissions.length} transactions</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-green-800">Commission Ready</p>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(totalReady)}</p>
              <p className="text-sm text-green-700">{readyCommissions.length} ready for payment</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-800">Approved</p>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(totalApproved)}</p>
              <p className="text-sm text-blue-700">{approvedCommissions.length} approved</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <Receipt className="h-8 w-8 text-gray-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-800">Paid</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPaid)}</p>
              <p className="text-sm text-gray-700">{paidCommissions.length} completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Commission Flow Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Commission Payment Flow</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900">1. Transaction Submitted</p>
              <p className="text-sm text-gray-500">Commission tracked as pending</p>
            </div>
          </div>
          <div className="w-8 h-0.5 bg-gray-300" />
          
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900">2. Property Registered</p>
              <p className="text-sm text-gray-500">Commission becomes ready</p>
            </div>
          </div>
          <div className="w-8 h-0.5 bg-gray-300" />
          
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Upload className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900">3. Upload Invoice</p>
              <p className="text-sm text-gray-500">Submit payment request</p>
            </div>
          </div>
          <div className="w-8 h-0.5 bg-gray-300" />
          
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900">4. Payment Processed</p>
              <p className="text-sm text-gray-500">Commission paid</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ready for Payment */}
      {readyCommissions.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-green-800">Ready for Payment!</h3>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              {readyCommissions.length} transactions
            </span>
          </div>
          <p className="text-green-700 mb-4">
            Total commission ready: <strong>{formatCurrency(totalReady)}</strong>
          </p>
          <div className="space-y-3">
            {readyCommissions.slice(0, 3).map(transaction => (
              <div key={transaction.id} className="bg-white border border-green-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{transaction.transaction_number}</p>
                    <p className="text-sm text-gray-600">{transaction.property_title}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">{formatCurrency(transaction.commission_amount)}</p>
                    <button
                      onClick={() => handleInvoiceUpload(transaction)}
                      className="text-sm text-green-700 hover:text-green-800 underline"
                    >
                      Upload Invoice
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderTransactionsList = (transactionList: Transaction[], title: string, emptyMessage: string) => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      
      {transactionList.length === 0 ? (
        <div className="text-center py-12">
          <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {transactionList.map(transaction => (
            <div key={transaction.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">{transaction.transaction_number}</h4>
                  <p className="text-sm text-gray-600">{transaction.property_title}</p>
                </div>
                <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${getCommissionStatusColor(transaction.commission_status)}`}>
                  {getCommissionStatusIcon(transaction.commission_status)}
                  <span className="ml-1 capitalize">{transaction.commission_status}</span>
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <span className="text-sm text-gray-500">Selling Price:</span>
                  <span className="text-sm font-medium text-gray-900 block">{formatCurrency(transaction.selling_price)}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Commission:</span>
                  <span className="text-sm font-medium text-green-600 block">{formatCurrency(transaction.commission_amount)}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Status:</span>
                  <span className="text-sm font-medium text-gray-900 block capitalize">{transaction.status.replace('_', ' ')}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  Updated: {new Date(transaction.updated_at).toLocaleDateString()}
                </span>
                <div className="flex space-x-2">
                  <button className="text-blue-600 hover:text-blue-800 text-sm">
                    <Eye className="h-4 w-4 inline mr-1" />
                    View
                  </button>
                  {transaction.status === 'registered' && transaction.commission_status === 'pending' && (
                    <button
                      onClick={() => handleInvoiceUpload(transaction)}
                      className="text-green-600 hover:text-green-800 text-sm"
                    >
                      <Upload className="h-4 w-4 inline mr-1" />
                      Upload Invoice
                    </button>
                  )}
                  {transaction.commission_status === 'approved' && (
                    <button className="text-purple-600 hover:text-purple-800 text-sm">
                      <Download className="h-4 w-4 inline mr-1" />
                      Download
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white">Commission Tracker</h2>
              <p className="text-green-100 text-sm">Track and manage your commission payments</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-green-100 hover:text-white hover:bg-green-600 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Summary Stats */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-white">
            <div className="text-center">
              <p className="text-2xl font-bold">{formatCurrency(totalPending + totalReady + totalApproved)}</p>
              <p className="text-sm text-green-100">Total Outstanding</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{formatCurrency(totalReady)}</p>
              <p className="text-sm text-green-100">Ready for Payment</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{formatCurrency(totalPaid)}</p>
              <p className="text-sm text-green-100">Total Paid</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{transactions.length}</p>
              <p className="text-sm text-green-100">Total Transactions</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', count: null },
              { id: 'pending', label: 'In Progress', count: pendingCommissions.length },
              { id: 'ready', label: 'Ready', count: readyCommissions.length },
              { id: 'paid', label: 'Paid', count: paidCommissions.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                {tab.count !== null && tab.count > 0 && (
                  <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'pending' && renderTransactionsList(
            pendingCommissions, 
            'Transactions In Progress', 
            'No commissions pending - all transactions are complete!'
          )}
          {activeTab === 'ready' && renderTransactionsList(
            readyCommissions, 
            'Ready for Payment', 
            'No commissions ready yet - complete transactions to earn commission!'
          )}
          {activeTab === 'paid' && renderTransactionsList(
            paidCommissions, 
            'Paid Commissions', 
            'No commissions paid yet'
          )}
        </div>

        {/* Invoice Upload Modal */}
        {showInvoiceUpload && selectedTransaction && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Commission Invoice</h3>
              <p className="text-sm text-gray-600 mb-4">
                Transaction: <strong>{selectedTransaction.transaction_number}</strong><br />
                Commission: <strong>{formatCurrency(selectedTransaction.commission_amount)}</strong>
              </p>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-4">
                {invoiceFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-6 w-6 text-green-600" />
                    <span className="text-sm font-medium text-gray-900">{invoiceFile.name}</span>
                    <button
                      onClick={() => setInvoiceFile(null)}
                      className="text-gray-400 hover:text-red-500 ml-2"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Upload your commission invoice</p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.png"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) setInvoiceFile(file);
                  }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {invoiceFile ? 'Change File' : 'Select File'}
                </button>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowInvoiceUpload(false);
                    setInvoiceFile(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  disabled={!invoiceFile || invoiceSubmitting}
                  onClick={async () => {
                    if (!invoiceFile) return;
                    setInvoiceSubmitting(true);
                    // File upload would go here via storageService.uploadFile
                    // For now, just close the modal with success
                    setTimeout(() => {
                      setInvoiceSubmitting(false);
                      setShowInvoiceUpload(false);
                      setInvoiceFile(null);
                    }, 500);
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {invoiceSubmitting ? 'Submitting...' : 'Submit Invoice'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommissionTracker;