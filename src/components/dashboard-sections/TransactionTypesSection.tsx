import React, { useState, useMemo } from 'react';
import {
  FileText,
  CreditCard,
  Users,
  Building,
  ChevronRight,
  Eye,
  Search,
  ArrowRight,
  CheckCircle,
  Clock,
} from 'lucide-react';
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
  /** Opens the transaction wizard for an existing case (steps 1-6). */
  onStartTransaction?: (caseId: string, typeData?: any) => void;
}

const TransactionTypesSection: React.FC<TransactionTypesProps> = ({
  searchTerm,
  onSearch,
  cases,
  onViewTransaction,
  onStartTransaction,
}) => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
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

  // Use only real cases from the database
  const allCases = useMemo(() => cases, [cases]);

  // Show all cases with recognized statuses (including completed)
  const recognizedStatuses = ['initiated', 'in_progress', 'completed', 'cancelled', 'submitted_to_conveyancer'];

  const activeCases = useMemo(
    () => allCases
      .filter(c => recognizedStatuses.includes(c.status))
      .sort((a, b) => {
        // Active cases first (initiated/in_progress), then completed, then cancelled
        const statusOrder: Record<string, number> = { in_progress: 0, initiated: 1, submitted_to_conveyancer: 2, completed: 3, cancelled: 4 };
        const sa = statusOrder[a.status] ?? 2;
        const sb = statusOrder[b.status] ?? 2;
        if (sa !== sb) return sa - sb;
        // Within same status: high priority first, then by most recently updated
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
    // Transfer + bond cases go to their transfer category, not the bond bucket
    if (ct.includes('sectional')) return 'sectional_title';
    if (ct.includes('tribal')) return 'tribal_grant';
    // Standalone bond only (not combined with a transfer)
    if (ct === 'bond') return 'bond';
    // normal_transfer, normal_transfer_bond, buying, selling, or anything else
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
      uploadedDocuments: c.buyer_data?.uploadedDocuments || [],
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

  // Transaction type data the wizard needs (it no longer asks for it)
  const deriveTypeData = (c: Case) => {
    const ct = (c.case_type || '').toLowerCase();
    let transactionCategory = 'normal_transfer';
    if (ct.includes('sectional')) transactionCategory = 'sectional_title';
    else if (ct.includes('tribal')) transactionCategory = 'tribal_grant';
    return {
      transactionType: 'selling',
      transactionCategory,
      includeBondRegistration: ct.includes('bond'),
    };
  };

  // Render a single case card
  const renderCaseCard = (c: Case) => {
    const buyerDone = c.buyer_status === 'completed';
    const sellerDone = c.seller_status === 'completed';
    const bothSubmitted = buyerDone && sellerDone;
    const isInitiated = c.status === 'initiated';

    return (
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

        {/* Client submission status — the conveyancer can start once both parties submit */}
        {isInitiated && (
          <div className="mb-4 rounded-lg bg-gray-50 border border-gray-200 p-3">
            <p className="text-xs font-medium text-gray-500 mb-2">Client submissions</p>
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                buyerDone ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {buyerDone ? <CheckCircle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                Buyer — {buyerDone ? 'documents submitted' : 'awaiting documents'}
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                sellerDone ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {sellerDone ? <CheckCircle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                Seller — {sellerDone ? 'documents submitted' : 'awaiting documents'}
              </span>
            </div>
            <p className={`text-xs mt-2 font-medium ${bothSubmitted ? 'text-green-700' : 'text-gray-500'}`}>
              {bothSubmitted
                ? 'Both parties have submitted — you can start the transaction.'
                : 'Waiting for both the buyer and seller to submit before the transaction can start.'}
            </p>
          </div>
        )}

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
            {isInitiated && (
              <button
                onClick={() => bothSubmitted && onStartTransaction?.(c.id, deriveTypeData(c))}
                disabled={!bothSubmitted}
                title={bothSubmitted
                  ? 'Start the transaction process'
                  : 'Waiting for both parties to submit their documents'}
                className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                  bothSubmitted
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Start Transaction
              </button>
            )}
            {c.status === 'in_progress' && (
              <button
                onClick={() => onStartTransaction?.(c.id, deriveTypeData(c))}
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
  };

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

                <div className="mt-6 flex items-center justify-end">
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
