import React, { useState } from 'react';
import { 
  Plus, 
  Home, 
  Users, 
  TrendingUp, 
  Eye, 
  Edit, 
  MessageSquare,
  Search,
  Filter,
  Building,
  MapPin,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Activity,
  Upload,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  Scale,
  Receipt,
  Download,
  RefreshCw
} from 'lucide-react';
import { Property, Case, Organization, OrganizationUser } from '../../types/database';
import TransactionSubmissionForm from './TransactionSubmissionForm';
import CommissionTracker from './CommissionTracker';

interface EstateAgentDashboardProps {
  user: OrganizationUser;
  organization: Organization;
  onLogout: () => void;
}

// Transaction interface for estate agent submissions
interface EstateTransaction {
  id: string;
  transaction_number: string;
  property_title: string;
  property_address: string;
  selling_price: number;
  buyer_name: string;
  seller_name: string;
  buyer_contact: string;
  seller_contact: string;
  agent_commission_rate: number;
  agent_commission_type: 'percentage' | 'fixed';
  conveyancer_firm: string;
  status: 'submitted' | 'accepted' | 'kyc_complete' | 'documents_draft' | 'lodged' | 'registered' | 'commission_ready' | 'commission_paid';
  progress: number;
  uploaded_documents: string[];
  special_instructions: string;
  submitted_at: string;
  updated_at: string;
  commission_amount: number;
  commission_status: 'pending' | 'approved' | 'paid';
  timeline_events: Array<{
    event: string;
    description: string;
    timestamp: string;
    status: 'completed' | 'current' | 'pending';
  }>;
}

const EstateAgentDashboard: React.FC<EstateAgentDashboardProps> = ({
  user,
  organization,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'properties' | 'commissions' | 'team'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showCommissionTracker, setShowCommissionTracker] = useState(false);

  // Mock data - in real app, this would come from the database
  const [properties] = useState<Property[]>([
    {
      id: '1',
      organization_id: organization.id,
      agent_id: user.id,
      title: 'Modern 3BR House in Gaborone',
      description: 'Beautiful modern house with garden',
      property_type: 'House',
      price: 2500000,
      address: 'Block 8, Gaborone',
      bedrooms: 3,
      bathrooms: 2,
      size_sqm: 250,
      status: 'available',
      images: ['https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '2',
      organization_id: organization.id,
      agent_id: user.id,
      title: 'Luxury Apartment in CBD',
      description: 'Premium apartment with city views',
      property_type: 'Apartment',
      price: 1800000,
      address: 'CBD, Gaborone',
      bedrooms: 2,
      bathrooms: 1,
      size_sqm: 120,
      status: 'under_offer',
      images: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]);

  // Mock estate transactions
  const [estateTransactions, setEstateTransactions] = useState<EstateTransaction[]>([
    {
      id: '1',
      transaction_number: 'TXN-2025-001',
      property_title: 'Modern 3BR House in Gaborone',
      property_address: 'Block 8, Plot 123, Gaborone',
      selling_price: 2500000,
      buyer_name: 'John Doe',
      seller_name: 'Jane Smith',
      buyer_contact: '+267 7X XXX XXX',
      seller_contact: '+267 7Y YYY YYY',
      agent_commission_rate: 5,
      agent_commission_type: 'percentage',
      conveyancer_firm: 'OrionX Legal Services',
      status: 'kyc_complete',
      progress: 40,
      uploaded_documents: ['Sale Agreement', 'Buyer ID', 'Seller ID', 'Title Deed'],
      special_instructions: 'First time buyer, please expedite processing',
      submitted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
      commission_amount: 125000,
      commission_status: 'pending',
      timeline_events: [
        {
          event: 'Transaction Submitted',
          description: 'Transaction submitted to conveyancer',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'completed'
        },
        {
          event: 'Documents Received',
          description: 'All required documents received and verified',
          timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
          status: 'completed'
        },
        {
          event: 'KYC Complete',
          description: 'Buyer and seller identity verification completed',
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          status: 'completed'
        },
        {
          event: 'Documents in Draft',
          description: 'Legal documents being prepared',
          timestamp: new Date().toISOString(),
          status: 'current'
        },
        {
          event: 'Lodged at Deeds Office',
          description: 'Documents submitted to deeds office',
          timestamp: '',
          status: 'pending'
        },
        {
          event: 'Registered',
          description: 'Property transfer registered',
          timestamp: '',
          status: 'pending'
        }
      ]
    },
    {
      id: '2',
      transaction_number: 'TXN-2025-002',
      property_title: 'Luxury Apartment in CBD',
      property_address: 'CBD, Block 3, Gaborone',
      selling_price: 1800000,
      buyer_name: 'Mike Johnson',
      seller_name: 'Sarah Wilson',
      buyer_contact: '+267 7A AAA AAA',
      seller_contact: '+267 7B BBB BBB',
      agent_commission_rate: 4.5,
      agent_commission_type: 'percentage',
      conveyancer_firm: 'Botswana Law Chambers',
      status: 'registered',
      progress: 100,
      uploaded_documents: ['Sale Agreement', 'FICA Documents', 'Property Valuation'],
      special_instructions: '',
      submitted_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      commission_amount: 81000,
      commission_status: 'approved',
      timeline_events: [
        {
          event: 'Transaction Submitted',
          description: 'Transaction submitted to conveyancer',
          timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'completed'
        },
        {
          event: 'KYC Complete',
          description: 'Identity verification completed',
          timestamp: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'completed'
        },
        {
          event: 'Documents in Draft',
          description: 'Legal documents prepared',
          timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'completed'
        },
        {
          event: 'Lodged at Deeds Office',
          description: 'Documents submitted to deeds office',
          timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'completed'
        },
        {
          event: 'Registered',
          description: 'Property transfer registered - Commission Ready!',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'completed'
        }
      ]
    }
  ]);

  const formatCurrency = (amount: number) => `P ${amount.toLocaleString()}`;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'under_offer': return 'bg-yellow-100 text-yellow-800';
      case 'sold': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransactionStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-purple-100 text-purple-800';
      case 'kyc_complete': return 'bg-indigo-100 text-indigo-800';
      case 'documents_draft': return 'bg-yellow-100 text-yellow-800';
      case 'lodged': return 'bg-orange-100 text-orange-800';
      case 'registered': return 'bg-green-100 text-green-800';
      case 'commission_ready': return 'bg-emerald-100 text-emerald-800';
      case 'commission_paid': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransactionStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted': return <Upload className="h-4 w-4" />;
      case 'accepted': return <CheckCircle className="h-4 w-4" />;
      case 'kyc_complete': return <Users className="h-4 w-4" />;
      case 'documents_draft': return <FileText className="h-4 w-4" />;
      case 'lodged': return <Send className="h-4 w-4" />;
      case 'registered': return <CheckCircle className="h-4 w-4" />;
      case 'commission_ready': return <DollarSign className="h-4 w-4" />;
      case 'commission_paid': return <Receipt className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const handleTransactionSubmit = (transactionData: any) => {
    const newTransaction: EstateTransaction = {
      id: `txn-${Date.now()}`,
      transaction_number: `TXN-2025-${String(estateTransactions.length + 1).padStart(3, '0')}`,
      ...transactionData,
      status: 'submitted',
      progress: 10,
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      commission_amount: transactionData.agent_commission_type === 'percentage' 
        ? (transactionData.selling_price * transactionData.agent_commission_rate / 100)
        : transactionData.agent_commission_rate,
      commission_status: 'pending',
      timeline_events: [
        {
          event: 'Transaction Submitted',
          description: 'Transaction submitted to conveyancer',
          timestamp: new Date().toISOString(),
          status: 'completed'
        },
        {
          event: 'Documents Received',
          description: 'Awaiting document verification',
          timestamp: '',
          status: 'pending'
        }
      ]
    };

    setEstateTransactions(prev => [newTransaction, ...prev]);
    setShowTransactionForm(false);
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Transactions</p>
              <p className="text-2xl font-bold text-gray-900">
                {estateTransactions.filter(t => !['registered', 'commission_paid'].includes(t.status)).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {estateTransactions.filter(t => t.status === 'registered').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Commission Ready</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(
                  estateTransactions
                    .filter(t => ['registered', 'commission_ready'].includes(t.status))
                    .reduce((sum, t) => sum + t.commission_amount, 0)
                )}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Home className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Properties Listed</p>
              <p className="text-2xl font-bold text-gray-900">{properties.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
            <button
              onClick={() => setShowTransactionForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Submit New Transaction
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {estateTransactions.slice(0, 3).map((transaction) => (
            <div key={transaction.id} className="border border-gray-200 rounded-lg p-4 mb-4 last:mb-0 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">{transaction.transaction_number}</h4>
                  <p className="text-sm text-gray-600">{transaction.property_title}</p>
                </div>
                <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${getTransactionStatusColor(transaction.status)}`}>
                  {getTransactionStatusIcon(transaction.status)}
                  <span className="ml-1 capitalize">{transaction.status.replace('_', ' ')}</span>
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                <div>
                  <span className="text-sm text-gray-500">Selling Price:</span>
                  <span className="text-sm font-medium text-gray-900 ml-2">{formatCurrency(transaction.selling_price)}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Commission:</span>
                  <span className="text-sm font-medium text-gray-900 ml-2">{formatCurrency(transaction.commission_amount)}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Conveyancer:</span>
                  <span className="text-sm font-medium text-gray-900 ml-2">{transaction.conveyancer_firm}</span>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">Progress</span>
                  <span className="text-sm text-gray-600">{transaction.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${transaction.progress}%` }}
                  ></div>
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
                  <button className="text-green-600 hover:text-green-800 text-sm">
                    <MessageSquare className="h-4 w-4 inline mr-1" />
                    Message
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTransactions = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">All Transactions</h3>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCommissionTracker(true)}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Commission Tracker
          </button>
          <button
            onClick={() => setShowTransactionForm(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Submit New Transaction
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {estateTransactions.map((transaction) => (
          <div key={transaction.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{transaction.transaction_number}</h4>
                <p className="text-sm text-gray-600">{transaction.property_title}</p>
                <p className="text-sm text-gray-500">{transaction.property_address}</p>
              </div>
              <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${getTransactionStatusColor(transaction.status)}`}>
                {getTransactionStatusIcon(transaction.status)}
                <span className="ml-1 capitalize">{transaction.status.replace('_', ' ')}</span>
              </span>
            </div>

            {/* Details */}
            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Buyer:</span>
                  <span className="text-sm font-medium text-gray-900 block">{transaction.buyer_name}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Seller:</span>
                  <span className="text-sm font-medium text-gray-900 block">{transaction.seller_name}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Selling Price:</span>
                  <span className="text-sm font-medium text-gray-900 block">{formatCurrency(transaction.selling_price)}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Your Commission:</span>
                  <span className="text-sm font-medium text-green-600 block">{formatCurrency(transaction.commission_amount)}</span>
                </div>
              </div>
              
              <div>
                <span className="text-sm text-gray-500">Conveyancer:</span>
                <span className="text-sm font-medium text-gray-900 block">{transaction.conveyancer_firm}</span>
              </div>
            </div>

            {/* Progress */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm text-gray-600">{transaction.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    transaction.status === 'registered' ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${transaction.progress}%` }}
                ></div>
              </div>
            </div>

            {/* Timeline */}
            <div className="mb-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Transaction Timeline</h5>
              <div className="space-y-2">
                {transaction.timeline_events.slice(0, 3).map((event, index) => (
                  <div key={index} className="flex items-center text-sm">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      event.status === 'completed' ? 'bg-green-500' :
                      event.status === 'current' ? 'bg-blue-500' : 'bg-gray-300'
                    }`} />
                    <span className={`${
                      event.status === 'completed' ? 'text-green-700' :
                      event.status === 'current' ? 'text-blue-700' : 'text-gray-500'
                    }`}>
                      {event.event}
                    </span>
                    {event.status === 'current' && (
                      <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              <button className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors">
                <Eye className="h-4 w-4 inline mr-1" />
                View Details
              </button>
              <button className="flex-1 px-3 py-2 text-sm bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors">
                <MessageSquare className="h-4 w-4 inline mr-1" />
                Message
              </button>
              {transaction.status === 'registered' && transaction.commission_status === 'pending' && (
                <button className="flex-1 px-3 py-2 text-sm bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 transition-colors">
                  <Receipt className="h-4 w-4 inline mr-1" />
                  Request Payment
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProperties = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Property Portfolio</h3>
        <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4 mr-2" />
          Add Property
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => (
          <div key={property.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-w-16 aspect-h-9">
              <img 
                src={property.images?.[0] || '/api/placeholder/400/250'} 
                alt={property.title}
                className="w-full h-48 object-cover"
              />
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-lg font-semibold text-gray-900 truncate">{property.title}</h4>
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(property.status)}`}>
                  {property.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{property.description}</p>
              <div className="flex items-center text-sm text-gray-500 mb-2">
                <MapPin className="h-4 w-4 mr-1" />
                {property.address}
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-lg font-bold text-blue-600">{formatCurrency(property.price)}</span>
                <div className="flex items-center text-sm text-gray-500">
                  <span>{property.bedrooms}BR</span>
                  <span className="mx-1">•</span>
                  <span>{property.bathrooms}BA</span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors">
                  <Eye className="h-4 w-4 inline mr-1" />
                  View
                </button>
                <button className="flex-1 px-3 py-2 text-sm bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition-colors">
                  <Edit className="h-4 w-4 inline mr-1" />
                  Edit
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Estate Agent Portal</h1>
              <p className="text-sm text-gray-600">{organization.name} • Transaction Management</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.first_name} {user.last_name}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role.replace('_', ' ')}</p>
              </div>
              <button
                onClick={onLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: TrendingUp },
                { id: 'transactions', label: 'Transactions', icon: Activity },
                { id: 'properties', label: 'Properties', icon: Home },
                { id: 'commissions', label: 'Commissions', icon: DollarSign },
                { id: 'team', label: 'Team', icon: Users }
              ].map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <IconComponent className="h-4 w-4 mr-2" />
                    {tab.label}
                    {tab.id === 'commissions' && (
                      <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                        {estateTransactions.filter(t => ['registered', 'commission_ready'].includes(t.status)).length}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'transactions' && renderTransactions()}
            {activeTab === 'properties' && renderProperties()}
            {activeTab === 'commissions' && (
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Commission management and tracking</p>
                <button
                  onClick={() => setShowCommissionTracker(true)}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Open Commission Tracker
                </button>
              </div>
            )}
            {activeTab === 'team' && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Team management coming soon</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transaction Submission Modal */}
      {showTransactionForm && (
        <TransactionSubmissionForm
          onSubmit={handleTransactionSubmit}
          onCancel={() => setShowTransactionForm(false)}
        />
      )}

      {/* Commission Tracker Modal */}
      {showCommissionTracker && (
        <CommissionTracker
          transactions={estateTransactions}
          onClose={() => setShowCommissionTracker(false)}
        />
      )}
    </div>
  );
};

export default EstateAgentDashboard;