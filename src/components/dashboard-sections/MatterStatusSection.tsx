import React, { useState } from 'react';
import { 
  Search, 
  Clock, 
  FileText, 
  User, 
  MapPin, 
  Calendar,
  Eye,
  MessageSquare,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Activity
} from 'lucide-react';

interface MatterStatusProps {
  searchTerm: string;
  onSearch: (term: string) => void;
}

const MatterStatusSection: React.FC<MatterStatusProps> = ({
  searchTerm,
  onSearch
}) => {
  const [selectedSearchType, setSelectedSearchType] = useState<'reference' | 'client' | 'property'>('reference');
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Mock recent activities
  const recentActivities = [
    {
      id: '1',
      type: 'status_update',
      description: 'TXN-001 moved to Documents Draft',
      user: 'Sarah K.',
      timestamp: '2 hours ago',
      matter_ref: 'TXN-001',
      client: 'John Smith'
    },
    {
      id: '2', 
      type: 'document_upload',
      description: 'New ID document uploaded for TXN-003',
      user: 'Lisa M.',
      timestamp: '3 hours ago',
      matter_ref: 'TXN-003',
      client: 'Jane Doe'
    },
    {
      id: '3',
      type: 'assignment',
      description: 'TXN-002 assigned to Mike T.',
      user: 'Admin',
      timestamp: '1 day ago',
      matter_ref: 'TXN-002',
      client: 'ABC Bank'
    },
    {
      id: '4',
      type: 'communication',
      description: 'Message sent to client for TXN-001',
      user: 'Sarah K.',
      timestamp: '1 day ago',
      matter_ref: 'TXN-001',
      client: 'John Smith'
    }
  ];

  // Mock search suggestions based on search type
  const searchSuggestionsMap = {
    reference: ['TXN-001', 'TXN-002', 'TXN-003', 'BOND-2025-001', 'SUB-2025-001'],
    client: ['John Smith', 'Jane Doe', 'ABC Bank', 'Capital Bank', 'Mike Johnson'],
    property: ['Block 8, Plot 123', 'Plot 456, Francistown', 'Unit 12B, CBD Tower']
  };

  const handleSearchChange = (value: string) => {
    onSearch(value);
    
    if (value.length > 0) {
      const suggestions = searchSuggestionsMap[selectedSearchType].filter(item =>
        item.toLowerCase().includes(value.toLowerCase())
      );
      setSearchSuggestions(suggestions.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'status_update': return <Activity className="h-4 w-4 text-blue-600" />;
      case 'document_upload': return <FileText className="h-4 w-4 text-green-600" />;
      case 'assignment': return <User className="h-4 w-4 text-purple-600" />;
      case 'communication': return <MessageSquare className="h-4 w-4 text-orange-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'status_update': return 'bg-blue-50 border-blue-200';
      case 'document_upload': return 'bg-green-50 border-green-200';
      case 'assignment': return 'bg-purple-50 border-purple-200';
      case 'communication': return 'bg-orange-50 border-orange-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Advanced Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Matter Lookup</h3>
        
        {/* Search Type Selection */}
        <div className="flex space-x-4 mb-4">
          {[
            { id: 'reference', label: 'By Reference', icon: FileText },
            { id: 'client', label: 'By Client', icon: User },
            { id: 'property', label: 'By Property', icon: MapPin }
          ].map((type) => {
            const IconComponent = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => setSelectedSearchType(type.id as any)}
                className={`flex items-center px-4 py-2 rounded-lg border ${
                  selectedSearchType === type.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <IconComponent className="h-4 w-4 mr-2" />
                {type.label}
              </button>
            );
          })}
        </div>

        {/* Search Input with Suggestions */}
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => setShowSuggestions(searchTerm.length > 0)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={`Search ${selectedSearchType}...`}
            />
          </div>
          
          {/* Search Suggestions Dropdown */}
          {showSuggestions && searchSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
              {searchSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    onSearch(suggestion);
                    setShowSuggestions(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                >
                  <span className="text-sm text-gray-900">{suggestion}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Filter Buttons */}
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            'Due This Week',
            'High Priority',
            'Unassigned',
            'Pending Documents',
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
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Matter Activities</h3>
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        
        <div className="space-y-4">
          {recentActivities.map((activity) => (
            <div key={activity.id} className={`border rounded-lg p-4 ${getActivityColor(activity.type)}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                    <div className="mt-1 flex items-center space-x-3 text-xs text-gray-500">
                      <span className="flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        {activity.user}
                      </span>
                      <span className="flex items-center">
                        <FileText className="h-3 w-3 mr-1" />
                        {activity.matter_ref}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {activity.timestamp}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="p-1 text-blue-600 hover:text-blue-800">
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Matter Status Lookup Results */}
      {searchTerm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Search Results for "{searchTerm}"
          </h3>
          
          {/* Mock search results */}
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">TXN-001</h4>
                  <p className="text-sm text-gray-600">Standard Transfer - John Smith</p>
                </div>
                <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                  Documents Draft
                </span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Property:</span>
                  <span className="font-medium text-gray-900 block">Block 8, Plot 123</span>
                </div>
                <div>
                  <span className="text-gray-500">Assignee:</span>
                  <span className="font-medium text-gray-900 block">Sarah K.</span>
                </div>
                <div>
                  <span className="text-gray-500">Last Update:</span>
                  <span className="font-medium text-gray-900 block">2 hours ago</span>
                </div>
                <div>
                  <span className="text-gray-500">Priority:</span>
                  <span className="font-medium text-gray-900 block">Medium</span>
                </div>
              </div>
              
              <div className="mt-4 flex space-x-2">
                <button className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
                  <Eye className="h-4 w-4 inline mr-1" />
                  View Full Details
                </button>
                <button className="px-3 py-1 text-sm bg-green-50 text-green-600 rounded hover:bg-green-100">
                  <MessageSquare className="h-4 w-4 inline mr-1" />
                  Message Client
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatterStatusSection;