import React, { useState } from 'react';
import { 
  FileText, 
  CreditCard, 
  Users, 
  Building, 
  ChevronRight, 
  Eye, 
  MessageSquare, 
  UserCheck,
  Clock,
  CheckCircle,
  AlertTriangle,
  Search,
  Plus,
  ArrowRight,
  User
} from 'lucide-react';
import ConveyancerTransactionWizard from './ConveyancerTransactionWizard';

interface TransactionType {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  count: number;
  color: string;
  description: string;
}

interface TransactionTypesProps {
  searchTerm: string;
  onSearch: (term: string) => void;
}

const TransactionTypesSection: React.FC<TransactionTypesProps> = ({
  searchTerm,
  onSearch
}) => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showNewTransaction, setShowNewTransaction] = useState(false);
  const [typeSearchTerm, setTypeSearchTerm] = useState('');

  const transactionTypes: TransactionType[] = [
    {
      id: 'normal_transfer',
      name: 'Normal Transfers',
      icon: FileText,
      count: 24,
      color: 'blue',
      description: 'Standard property transfers and registrations'
    },
    {
      id: 'sectional_title',
      name: 'Sectional Title',
      icon: Building,
      count: 12,
      color: 'green',
      description: 'Sectional title unit transfers and registrations'
    },
    {
      id: 'tribal_grant',
      name: 'Tribal Grants',
      icon: Users,
      count: 8,
      color: 'purple',
      description: 'Tribal land grants and certificates'
    },
    {
      id: 'bond',
      name: 'Bonds',
      icon: CreditCard,
      count: 18,
      color: 'amber',
      description: 'Bond registrations and cancellations'
    }
  ];

  const mockTransactions = [
    {
      id: 'TXN-001',
      type: 'Normal Transfer',
      client: 'John Smith',
      property: 'Block 8, Plot 123',
      status: 'documents_draft',
      assignee: 'Sarah K.',
      lastUpdate: '2 hours ago',
      priority: 'medium'
    },
    {
      id: 'TXN-002', 
      type: 'Bond Registration',
      client: 'ABC Bank',
      property: 'Plot 456, Francistown',
      status: 'lodged',
      assignee: 'Mike T.',
      lastUpdate: '1 day ago',
      priority: 'high'
    },
    {
      id: 'TXN-003',
      type: 'Sectional Title',
      client: 'Jane Doe',
      property: 'Unit 12B, CBD Tower',
      status: 'kyc_complete',
      assignee: 'Lisa M.',
      lastUpdate: '3 hours ago',
      priority: 'low'
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: {
        bg: 'from-blue-50 to-blue-100',
        border: 'border-blue-200',
        text: 'text-blue-900',
        accent: 'text-blue-600',
        icon: 'bg-blue-100'
      },
      green: {
        bg: 'from-green-50 to-green-100',
        border: 'border-green-200',
        text: 'text-green-900',
        accent: 'text-green-600',
        icon: 'bg-green-100'
      },
      purple: {
        bg: 'from-purple-50 to-purple-100',
        border: 'border-purple-200',
        text: 'text-purple-900',
        accent: 'text-purple-600',
        icon: 'bg-purple-100'
      },
      amber: {
        bg: 'from-amber-50 to-amber-100',
        border: 'border-amber-200',
        text: 'text-amber-900',
        accent: 'text-amber-600',
        icon: 'bg-amber-100'
      }
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const filteredTransactions = selectedType 
    ? mockTransactions.filter(t => {
        const type = transactionTypes.find(tt => tt.id === selectedType);
        const typeMatch = type && t.type.toLowerCase().includes(type.name.toLowerCase().split(' ')[0]);
        const searchMatch = typeSearchTerm === '' || 
          t.client.toLowerCase().includes(typeSearchTerm.toLowerCase()) ||
          t.property.toLowerCase().includes(typeSearchTerm.toLowerCase()) ||
          t.id.toLowerCase().includes(typeSearchTerm.toLowerCase());
        return typeMatch && searchMatch;
      })
    : mockTransactions.filter(t => 
        searchTerm === '' || 
        t.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.property.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.id.toLowerCase().includes(searchTerm.toLowerCase())
      );

  const getStatusDisplay = (status: string) => {
    const statusMap = {
      'documents_draft': 'Documents Draft',
      'lodged': 'Lodged',
      'kyc_complete': 'KYC Complete',
      'registered': 'Registered'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'documents_draft': return 'bg-amber-100 text-amber-800';
      case 'lodged': return 'bg-blue-100 text-blue-800';
      case 'kyc_complete': return 'bg-green-100 text-green-800';
      case 'registered': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Main Overview - Transaction Type Cards
  if (!selectedType) {
    return (
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="text-center">
          <h2 className="text-2xl font-serif font-bold text-primary mb-2">Welcome to Your Dashboard</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Choose a transaction type below to view and manage your matters, or use the search to find specific transactions.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by client, property, or reference..."
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary shadow-soft"
            />
          </div>
        </div>

        {/* New Transaction Button */}
        {/* Transaction Type Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {transactionTypes.map((type) => {
            const IconComponent = type.icon;
            const colors = getColorClasses(type.color);
            
            return (
              <div
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`bg-gradient-to-br ${colors.bg} ${colors.border} border rounded-2xl p-8 cursor-pointer hover:shadow-soft-md transition-all duration-300 group`}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className={`w-16 h-16 rounded-2xl ${colors.icon} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                    <IconComponent className={`h-8 w-8 ${colors.accent}`} />
                  </div>
                  <div className="text-right">
                    <div className={`text-3xl font-bold ${colors.text}`}>{type.count}</div>
                    <div className={`text-sm ${colors.accent}`}>active</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className={`text-xl font-serif font-semibold ${colors.text}`}>{type.name}</h3>
                  <p className={`text-sm ${colors.accent} leading-relaxed`}>{type.description}</p>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowNewTransaction(true);
                    }}
                    className={`px-4 py-2 bg-white ${colors.accent} rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium border border-current`}
                  >
                    Start New Transaction
                  </button>
                  <div className="flex items-center">
                    <span className={`text-sm font-medium ${colors.accent}`}>View All</span>
                    <ChevronRight className={`h-5 w-5 ${colors.accent} group-hover:translate-x-1 transition-transform duration-200 ml-1`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Search Results */}
        {searchTerm && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-soft border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-primary to-primary-dark p-6">
                <h3 className="text-lg font-serif font-semibold text-white">
                  Search Results for "{searchTerm}"
                </h3>
                <p className="text-gray-200 text-sm mt-1">
                  {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''} found
                </p>
              </div>
              
              <div className="p-6">
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No transactions found matching your search</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredTransactions.map((transaction) => (
                      <div key={transaction.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-soft transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-lg font-semibold text-primary">{transaction.id}</h4>
                            <p className="text-gray-600">{transaction.type}</p>
                          </div>
                          <div className="flex space-x-2">
                            <span className={`px-3 py-1 text-xs rounded-full ${getPriorityColor(transaction.priority)}`}>
                              {transaction.priority}
                            </span>
                            <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(transaction.status)}`}>
                              {getStatusDisplay(transaction.status)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <span className="text-sm text-gray-500">Client:</span>
                            <span className="text-sm font-medium text-gray-900 ml-2">{transaction.client}</span>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Property:</span>
                            <span className="text-sm font-medium text-gray-900 ml-2">{transaction.property}</span>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Assignee:</span>
                            <span className="text-sm font-medium text-gray-900 ml-2">{transaction.assignee}</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Updated {transaction.lastUpdate}</span>
                          <div className="flex space-x-3">
                            <button className="inline-flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800 transition-colors">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </button>
                            <button className="inline-flex items-center px-3 py-1 text-sm text-green-600 hover:text-green-800 transition-colors">
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Message
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* New Transaction Modal */}
        <ConveyancerTransactionWizard
          isOpen={showNewTransaction}
          onClose={() => setShowNewTransaction(false)}
        />
      </div>
    );
  }

  // Selected Type Detail View
  const selectedTypeData = transactionTypes.find(t => t.id === selectedType);
  const colors = selectedTypeData ? getColorClasses(selectedTypeData.color) : getColorClasses('blue');

  return (
    <div className="space-y-6">
      {/* Back to Overview */}
      <div className="flex items-center">
        <button
          onClick={() => {
            setSelectedType(null);
            setTypeSearchTerm('');
          }}
          className="inline-flex items-center px-4 py-2 text-primary hover:text-primary-dark transition-colors"
        >
          ← Back to Overview
        </button>
      </div>

      {/* Selected Type Header */}
      <div className={`bg-gradient-to-br ${colors.bg} ${colors.border} border rounded-2xl p-8 shadow-soft`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`w-16 h-16 rounded-2xl ${colors.icon} flex items-center justify-center mr-6`}>
              {selectedTypeData && (
                <selectedTypeData.icon className={`h-8 w-8 ${colors.accent}`} />
              )}
            </div>
            <div>
              <h2 className={`text-2xl font-serif font-bold ${colors.text}`}>
                {selectedTypeData?.name}
              </h2>
              <p className={`${colors.accent} mt-1`}>{selectedTypeData?.description}</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold ${colors.text}`}>{selectedTypeData?.count}</div>
            <div className={`text-sm ${colors.accent}`}>active transactions</div>
          </div>
        </div>
      </div>

      {/* Search within Selected Type */}
      <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Search & Filter</h3>
          <span className="text-sm text-gray-500">
            {filteredTransactions.length} of {mockTransactions.filter(t => {
              const type = transactionTypes.find(tt => tt.id === selectedType);
              return type && t.type.toLowerCase().includes(type.name.toLowerCase().split(' ')[0]);
            }).length} transactions
          </span>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by client name, property address, or reference number..."
            value={typeSearchTerm}
            onChange={(e) => setTypeSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary shadow-soft"
          />
        </div>
        
        {/* Quick filters for this transaction type */}
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            'Due This Week',
            'High Priority', 
            'Unassigned',
            'Documents Pending',
            'Ready for Lodging'
          ].map((filter) => (
            <button
              key={filter}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
            >
              {filter}
            </button>
          ))}
        </div>
        
        {typeSearchTerm && (
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Searching for "{typeSearchTerm}"
            </span>
            <button
              onClick={() => setTypeSearchTerm('')}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Clear search
            </button>
          </div>
        )}
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary-dark p-6">
          <h3 className="text-lg font-serif font-semibold text-white">
            Active {selectedTypeData?.name}
          </h3>
          <p className="text-gray-200 text-sm mt-1">
            {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="p-6">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No {selectedTypeData?.name.toLowerCase()} transactions found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => (
                <div key={transaction.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-soft transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-primary">{transaction.id}</h4>
                      <p className="text-gray-600">{transaction.type}</p>
                    </div>
                    <div className="flex space-x-2">
                      <span className={`px-3 py-1 text-xs rounded-full ${getPriorityColor(transaction.priority)}`}>
                        {transaction.priority}
                      </span>
                      <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(transaction.status)}`}>
                        {getStatusDisplay(transaction.status)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <span className="text-sm text-gray-500">Client:</span>
                      <span className="text-sm font-medium text-gray-900 ml-2">{transaction.client}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Property:</span>
                      <span className="text-sm font-medium text-gray-900 ml-2">{transaction.property}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Assignee:</span>
                      <span className="text-sm font-medium text-gray-900 ml-2">{transaction.assignee}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Updated {transaction.lastUpdate}</span>
                    <div className="flex space-x-3">
                      <button className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </button>
                      <button className="inline-flex items-center px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Message
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionTypesSection;