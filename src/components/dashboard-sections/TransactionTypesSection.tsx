import React, { useState, useMemo } from 'react';
import {
  FileText,
  CreditCard,
  Users,
  Building,
  ChevronRight,
  Eye,
  Clock,
  CheckCircle,
  Search,
  ArrowRight,
  User
} from 'lucide-react';
import ConveyancerTransactionWizard from './ConveyancerTransactionWizard';
import type { Case } from '../../types/database';

interface TransactionType {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

interface TransactionTypesProps {
  searchTerm: string;
  onSearch: (term: string) => void;
  cases: Case[];
  onViewTransaction: (transactionId: string, transactionData: any) => void;
}

const TransactionTypesSection: React.FC<TransactionTypesProps> = ({
  searchTerm,
  onSearch,
  cases,
  onViewTransaction
}) => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showNewTransaction, setShowNewTransaction] = useState(false);
  const [typeSearchTerm, setTypeSearchTerm] = useState('');

  const transactionTypeDefinitions: TransactionType[] = [
    {
      id: 'normal_transfer',
      name: 'Normal Transfers',
      icon: FileText,
      color: 'blue',
      description: 'Standard property transfers and registrations'
    },
    {
      id: 'sectional_title',
      name: 'Sectional Title',
      icon: Building,
      color: 'green',
      description: 'Sectional title unit transfers and registrations'
    },
    {
      id: 'tribal_grant',
      name: 'Tribal Grants',
      icon: Users,
      color: 'purple',
      description: 'Tribal land grants and certificates'
    },
    {
      id: 'bond',
      name: 'Bonds',
      icon: CreditCard,
      color: 'amber',
      description: 'Bond registrations and cancellations'
    }
  ];

  // Guaranteed demo case linked to real backend data
  const demoCaseId = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
  const demoCase: Case = {
    id: demoCaseId,
    organization_id: '6d00e962-c65e-4bb8-808c-70d2910b45fa',
    conveyancer_id: '04d51ca8-76bb-4c40-abfd-07fe959af627',
    property_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    case_number: 'EC26-DEMO',
    case_type: 'normal_transfer',
    client_name: 'Thabo Molefe',
    client_email: 'thabo.molefe@gmail.com',
    client_phone: '+267 72 345 678',
    status: 'in_progress' as const,
    priority: 'high' as const,
    documents: [
      'Title Deed', 'ID Document (Buyer)', 'ID Document (Seller)',
      'Proof of Address (Buyer)', 'Proof of Address (Seller)',
      'Bank Statement', 'Rates Clearance Certificate',
      'Marriage Certificate (ANC)', 'Valuation Report'
    ],
    notes: 'Complete case — all buyer/seller info submitted, documents verified. Ready for conveyancer agreement generation.',
    buyer_data: {
      clientName: 'Thabo Molefe', entityType: 'individual', gender: 'male',
      nationality: 'Botswana', maritalStatus: 'married_out', transactionType: 'buying',
      sellingPrice: '2850000', valuationAmount: '2900000', isFirstTimeBuyer: false,
      hasAgent: true, agentName: 'Jane Wilson', agentCompany: 'Premium Properties Ltd',
      agentContact: '+267 71 234 567', agentEmail: 'jane@properties.bw',
      uploadedDocuments: ['ID Document', 'Proof of Address', 'Bank Statement', 'Marriage Certificate (ANC)'],
    },
    seller_data: {
      clientName: 'Keitumetse Radebe', entityType: 'individual', gender: 'female',
      nationality: 'Botswana', maritalStatus: 'single', transactionType: 'selling',
      sellingPrice: '2850000',
      uploadedDocuments: ['ID Document', 'Proof of Address', 'Title Deed', 'Rates Clearance Certificate'],
    },
    buyer_status: 'completed',
    seller_status: 'completed',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    property: {
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      organization_id: '6d00e962-c65e-4bb8-808c-70d2910b45fa',
      title: 'Plot 4521, Extension 12, Gaborone',
      property_type: 'residential',
      price: 2850000,
      address: 'Plot 4521, Extension 12, Gaborone, Botswana',
      status: 'under_offer',
      created_at: '',
      updated_at: '',
    },
  };

  // Merge demo case with DB cases (avoid duplicates)
  const allCases = useMemo(() => {
    const dbCases = cases.filter(c => c.id !== demoCaseId);
    return [demoCase, ...dbCases];
  }, [cases]);

  // Only show cases with recognized statuses (exclude wizard step statuses like "Step 1: Agent Information")
  const recognizedStatuses = ['initiated', 'in_progress', 'completed', 'cancelled', 'submitted_to_conveyancer'];

  const activeCases = useMemo(
    () => allCases
      .filter(c => recognizedStatuses.includes(c.status) && c.status !== 'completed' && c.status !== 'cancelled')
      .sort((a, b) => {
        // High priority first, then by most recently updated
        const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
        const pa = priorityOrder[a.priority] ?? 1;
        const pb = priorityOrder[b.priority] ?? 1;
        if (pa !== pb) return pa - pb;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }),
    [allCases]
  );

  const getTypeCount = (typeId: string) =>
    activeCases.filter(c => c.case_type === typeId).length;

  // Also count cases whose case_type doesn't match any defined type — include them in the
  // type that best matches via substring, or fall back to normal_transfer
  const mapCaseToTypeId = (c: Case): string => {
    const ct = (c.case_type || '').toLowerCase();
    if (ct.includes('sectional')) return 'sectional_title';
    if (ct.includes('tribal')) return 'tribal_grant';
    if (ct.includes('bond')) return 'bond';
    // buying, selling, normal_transfer, or anything else → normal_transfer
    return 'normal_transfer';
  };

  const transactionTypes = transactionTypeDefinitions.map(t => ({
    ...t,
    count: activeCases.filter(c => mapCaseToTypeId(c) === t.id).length,
  }));

  // Helpers
  const getRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getConveyancerName = (c: Case) => {
    if (c.conveyancer) {
      return `${c.conveyancer.first_name} ${c.conveyancer.last_name?.charAt(0) || ''}.`;
    }
    return 'Unassigned';
  };

  const getPropertyAddress = (c: Case) => {
    if (c.property?.address) return c.property.address;
    return 'Address pending';
  };

  const getStatusDisplay = (status: string) => {
    const map: Record<string, string> = {
      initiated: 'Initiated',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return map[status] || status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'initiated': return 'bg-amber-100 text-amber-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
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

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: { bg: 'from-blue-50 to-blue-100', border: 'border-blue-200', text: 'text-blue-900', accent: 'text-blue-600', icon: 'bg-blue-100' },
      green: { bg: 'from-green-50 to-green-100', border: 'border-green-200', text: 'text-green-900', accent: 'text-green-600', icon: 'bg-green-100' },
      purple: { bg: 'from-purple-50 to-purple-100', border: 'border-purple-200', text: 'text-purple-900', accent: 'text-purple-600', icon: 'bg-purple-100' },
      amber: { bg: 'from-amber-50 to-amber-100', border: 'border-amber-200', text: 'text-amber-900', accent: 'text-amber-600', icon: 'bg-amber-100' },
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const handleViewDetails = (c: Case) => {
    onViewTransaction(c.id, {
      transactionType: c.case_type,
      sellingPrice: c.property?.price?.toString() || c.buyer_data?.sellingPrice || '0',
      clientName: c.client_name,
      hasAgent: c.buyer_data?.hasAgent || false,
      agentName: c.buyer_data?.agentName,
      agentCompany: c.buyer_data?.agentCompany,
      entityType: c.buyer_data?.entityType || 'individual',
      nationality: c.buyer_data?.nationality || 'Botswana',
      buyerDetails: c.buyer_data || null,
      sellerDetails: c.seller_data || null,
      buyerName: c.buyer_data?.clientName || c.client_name,
      sellerName: c.seller_data?.clientName || 'Not specified',
      uploadedDocuments: c.documents || [],
      propertyAddress: c.property?.address || '',
    });
  };

  // Filter cases for display
  const getFilteredCases = () => {
    let filtered = activeCases;

    if (selectedType) {
      filtered = filtered.filter(c => mapCaseToTypeId(c) === selectedType);
    }

    const term = (selectedType ? typeSearchTerm : searchTerm).toLowerCase();
    if (term) {
      filtered = filtered.filter(c =>
        c.client_name?.toLowerCase().includes(term) ||
        c.case_number?.toLowerCase().includes(term) ||
        c.property?.address?.toLowerCase().includes(term)
      );
    }

    return filtered;
  };

  const filteredCases = getFilteredCases();

  // Render a single case card
  const renderCaseCard = (c: Case) => (
    <div key={c.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-soft transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="text-lg font-semibold text-primary">{c.case_number}</h4>
          <p className="text-gray-600">{c.client_name}</p>
        </div>
        <div className="flex space-x-2">
          <span className={`px-3 py-1 text-xs rounded-full ${getPriorityColor(c.priority)}`}>
            {c.priority}
          </span>
          <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(c.status)}`}>
            {getStatusDisplay(c.status)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <span className="text-sm text-gray-500">Client:</span>
          <span className="text-sm font-medium text-gray-900 ml-2">{c.client_name}</span>
        </div>
        <div>
          <span className="text-sm text-gray-500">Property:</span>
          <span className="text-sm font-medium text-gray-900 ml-2">{getPropertyAddress(c)}</span>
        </div>
        <div>
          <span className="text-sm text-gray-500">Assignee:</span>
          <span className="text-sm font-medium text-gray-900 ml-2">{getConveyancerName(c)}</span>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">Updated {getRelativeTime(c.updated_at)}</span>
        <div className="flex space-x-3">
          <button
            onClick={() => handleViewDetails(c)}
            className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </button>
          {(c.status === 'initiated' || c.status === 'in_progress') && (
            <button
              onClick={() => handleViewDetails(c)}
              className="inline-flex items-center px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // ── Main Overview (no type selected) ──
  if (!selectedType) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-serif font-bold text-primary mb-2">Welcome to Your Dashboard</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Choose a transaction type below to view and manage your matters, or use the search to find specific transactions.
          </p>
        </div>

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
                  {filteredCases.length} transaction{filteredCases.length !== 1 ? 's' : ''} found
                </p>
              </div>

              <div className="p-6">
                {filteredCases.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No transactions found matching your search</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredCases.map(renderCaseCard)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <ConveyancerTransactionWizard
          isOpen={showNewTransaction}
          onClose={() => setShowNewTransaction(false)}
        />
      </div>
    );
  }

  // ── Selected Type Detail View ──
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
            {filteredCases.length} of {selectedTypeData?.count || 0} transactions
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
            {filteredCases.length} transaction{filteredCases.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="p-6">
          {filteredCases.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No {selectedTypeData?.name.toLowerCase()} transactions found</p>
              <p className="text-sm text-gray-400 mt-1">Create a new case to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCases.map(renderCaseCard)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionTypesSection;
