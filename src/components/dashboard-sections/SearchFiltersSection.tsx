import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Bookmark, 
  X, 
  FileText, 
  User, 
  MapPin, 
  Calendar,
  Building,
  Hash,
  Star,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: any;
  createdAt: string;
}

interface SearchFiltersSectionProps {
  searchTerm: string;
  onSearch: (term: string) => void;
  onApplyFilters: (filters: any) => void;
}

const SearchFiltersSection: React.FC<SearchFiltersSectionProps> = ({
  searchTerm,
  onSearch,
  onApplyFilters
}) => {
  const [activeFilters, setActiveFilters] = useState<any>({
    transactionType: '',
    status: '',
    assignee: '',
    priority: '',
    dateRange: '',
    source: ''
  });
  
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([
    {
      id: '1',
      name: 'High Priority Transfers',
      query: '',
      filters: { transactionType: 'transfers', priority: 'high' },
      createdAt: '2025-01-15'
    },
    {
      id: '2',
      name: 'Bank Bonds This Week',
      query: '',
      filters: { transactionType: 'bonds', source: 'bank', dateRange: 'week' },
      createdAt: '2025-01-10'
    },
    {
      id: '3',
      name: 'Unassigned Matters',
      query: '',
      filters: { assignee: 'unassigned' },
      createdAt: '2025-01-08'
    }
  ]);

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchType, setSearchType] = useState<'general' | 'reference' | 'client' | 'property'>('general');

  const searchPlaceholders = {
    general: 'Search matters by any criteria...',
    reference: 'Enter matter reference (e.g. TXN-001, BOND-2025-001)',
    client: 'Enter client name or company',
    property: 'Enter plot number, address, or property description'
  };

  const quickFilters = [
    { id: 'due_today', label: 'Due Today', icon: Clock, color: 'red' },
    { id: 'high_priority', label: 'High Priority', icon: AlertTriangle, color: 'amber' },
    { id: 'unassigned', label: 'Unassigned', icon: User, color: 'gray' },
    { id: 'completed_today', label: 'Completed Today', icon: CheckCircle, color: 'green' },
    { id: 'needs_review', label: 'Needs Review', icon: FileText, color: 'blue' }
  ];

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...activeFilters, [key]: value };
    setActiveFilters(newFilters);
    onApplyFilters(newFilters);
  };

  const clearAllFilters = () => {
    const clearedFilters = {
      transactionType: '',
      status: '',
      assignee: '',
      priority: '',
      dateRange: '',
      source: ''
    };
    setActiveFilters(clearedFilters);
    onApplyFilters(clearedFilters);
    onSearch('');
  };

  const saveCurrentSearch = () => {
    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name: `Search ${savedSearches.length + 1}`,
      query: searchTerm,
      filters: activeFilters,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setSavedSearches(prev => [...prev, newSearch]);
  };

  const applySavedSearch = (savedSearch: SavedSearch) => {
    setActiveFilters(savedSearch.filters);
    onSearch(savedSearch.query);
    onApplyFilters(savedSearch.filters);
  };

  const deleteSavedSearch = (searchId: string) => {
    setSavedSearches(prev => prev.filter(s => s.id !== searchId));
  };

  const getFilterCount = () => {
    return Object.values(activeFilters).filter(value => value && value !== '').length;
  };

  const getQuickFilterColor = (color: string) => {
    const colorMap = {
      red: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
      amber: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
      gray: 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100',
      green: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
      blue: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.gray;
  };

  return (
    <div className="space-y-6">
      {/* Main Search Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Search & Filters</h3>
        
        {/* Search Type Selection */}
        <div className="flex space-x-2 mb-4">
          {[
            { id: 'general', label: 'General', icon: Search },
            { id: 'reference', label: 'Reference #', icon: Hash },
            { id: 'client', label: 'Client', icon: User },
            { id: 'property', label: 'Property', icon: MapPin }
          ].map((type) => {
            const IconComponent = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => setSearchType(type.id as any)}
                className={`flex items-center px-3 py-2 rounded-lg text-sm ${
                  searchType === type.id
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <IconComponent className="h-4 w-4 mr-1" />
                {type.label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder={searchPlaceholders[searchType]}
          />
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {quickFilters.map((filter) => {
            const IconComponent = filter.icon;
            return (
              <button
                key={filter.id}
                className={`flex items-center px-3 py-2 text-sm border rounded-lg transition-colors ${getQuickFilterColor(filter.color)}`}
              >
                <IconComponent className="h-4 w-4 mr-1" />
                {filter.label}
              </button>
            );
          })}
        </div>

        {/* Advanced Filters Toggle */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter className="h-4 w-4 mr-2" />
            Advanced Filters
            {getFilterCount() > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                {getFilterCount()}
              </span>
            )}
          </button>
          
          {(searchTerm || getFilterCount() > 0) && (
            <button
              onClick={clearAllFilters}
              className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              <X className="h-4 w-4 mr-1" />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-base font-medium text-gray-900 mb-4">Filter Options</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
              <select
                value={activeFilters.transactionType}
                onChange={(e) => handleFilterChange('transactionType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="transfers">Transfers</option>
                <option value="bonds">Bonds</option>
                <option value="subdivisions">Subdivisions</option>
                <option value="servitudes">Servitudes</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={activeFilters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="submitted">Submitted</option>
                <option value="kyc_complete">KYC Complete</option>
                <option value="documents_draft">Documents Draft</option>
                <option value="lodged">Lodged</option>
                <option value="registered">Registered</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
              <select
                value={activeFilters.assignee}
                onChange={(e) => handleFilterChange('assignee', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Assignees</option>
                <option value="unassigned">Unassigned</option>
                <option value="sarah">Sarah K.</option>
                <option value="mike">Mike T.</option>
                <option value="lisa">Lisa M.</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={activeFilters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <select
                value={activeFilters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Dates</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
              <select
                value={activeFilters.source}
                onChange={(e) => handleFilterChange('source', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Sources</option>
                <option value="bank">Banks</option>
                <option value="agent">Estate Agents</option>
                <option value="direct">Direct Clients</option>
                <option value="referral">Referrals</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Saved Searches */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-base font-medium text-gray-900">Saved Searches</h4>
          {(searchTerm || getFilterCount() > 0) && (
            <button
              onClick={saveCurrentSearch}
              className="flex items-center px-3 py-2 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
            >
              <Bookmark className="h-4 w-4 mr-1" />
              Save Current Search
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {savedSearches.map((search) => (
            <div key={search.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h5 className="font-medium text-gray-900 text-sm">{search.name}</h5>
                <button
                  onClick={() => deleteSavedSearch(search.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <div className="flex items-center text-xs text-gray-500 mb-3">
                <Calendar className="h-3 w-3 mr-1" />
                Saved {search.createdAt}
              </div>
              
              <button
                onClick={() => applySavedSearch(search)}
                className="w-full px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Apply Search
              </button>
            </div>
          ))}
        </div>
        
        {savedSearches.length === 0 && (
          <div className="text-center py-8">
            <Bookmark className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No saved searches yet</p>
          </div>
        )}
      </div>

      {/* Search Results Summary */}
      {(searchTerm || getFilterCount() > 0) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Search className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Search Results
                  {searchTerm && <span className="ml-1">for "{searchTerm}"</span>}
                </p>
                <p className="text-xs text-blue-600">
                  {getFilterCount() > 0 && `${getFilterCount()} filters applied`}
                </p>
              </div>
            </div>
            <button
              onClick={clearAllFilters}
              className="px-3 py-1 text-sm text-blue-700 hover:text-blue-800 underline"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Smart Search Suggestions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-base font-medium text-gray-900 mb-4">Smart Search Suggestions</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">Popular Searches</h5>
            <div className="space-y-2">
              {[
                'Matters due this week',
                'High priority transfers',
                'Unassigned bond applications',
                'Recently completed matters'
              ].map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => onSearch(suggestion)}
                  className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">Recent References</h5>
            <div className="space-y-2">
              {[
                'TXN-2025-001',
                'BOND-2025-012',
                'SUB-2025-003',
                'SER-2025-001'
              ].map((ref, index) => (
                <button
                  key={index}
                  onClick={() => onSearch(ref)}
                  className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  {ref}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchFiltersSection;