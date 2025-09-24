import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Search, 
  BarChart3, 
  FileText, 
  Building, 
  Filter, 
  Bell,
  Settings,
  RefreshCw,
  Eye
} from 'lucide-react';
import { OrganizationUser } from '../types/database';
import TransactionTypesSection from './dashboard-sections/TransactionTypesSection';
import MatterStatusSection from './dashboard-sections/MatterStatusSection';
import OngoingMattersSection from './dashboard-sections/OngoingMattersSection';
import BankApplicationsSection from './dashboard-sections/BankApplicationsSection';
import SearchFiltersSection from './dashboard-sections/SearchFiltersSection';
import AuditLogger from './AuditLogger';

interface ConveyancerOverviewProps {
  user: OrganizationUser;
  onLogout: () => void;
  onViewTransaction: (transactionId: string, transactionData: any) => void;
  onBack: () => void;
}

const ConveyancerOverview: React.FC<ConveyancerOverviewProps> = ({
  user,
  onLogout,
  onViewTransaction,
  onBack
}) => {
  const [activeTab, setActiveTab] = useState<'types' | 'status' | 'ongoing' | 'banks' | 'search'>('types');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAuditLogger, setShowAuditLogger] = useState(false);

  // Mock data for the dashboard
  const mockBankApplications = [
    {
      id: 'app-1',
      loan_id: 'loan-1',
      bank_name: 'Capital Bank Botswana',
      case_number: 'CONV-2025-001',
      applicant_name: 'John Doe',
      applicant_email: 'john@example.com',
      loan_amount: 2000000,
      property_address: 'Block 8, Plot 123, Gaborone',
      transaction_type: 'buying',
      urgency_level: 'high' as const,
      status: 'submitted' as const,
      special_instructions: 'First time buyer, please expedite processing',
      submitted_at: new Date().toISOString(),
      loan_officer: 'Michael Chen',
      interest_rate: 8.5,
      term_months: 240
    },
    {
      id: 'app-2',
      loan_id: 'loan-2',
      bank_name: 'First National Bank',
      case_number: 'CONV-2025-002',
      applicant_name: 'Jane Smith',
      applicant_email: 'jane@example.com',
      loan_amount: 1500000,
      property_address: 'Plot 456, Francistown',
      transaction_type: 'buying',
      urgency_level: 'medium' as const,
      status: 'accepted' as const,
      special_instructions: '',
      submitted_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      loan_officer: 'Sarah Wilson',
      interest_rate: 9.0,
      term_months: 180
    }
  ];

  const mockTeamMembers = [
    {
      id: '1',
      name: 'Sarah K.',
      role: 'Senior Conveyancer',
      activeMatters: 12,
      completedThisMonth: 8,
      averageTime: '18 days'
    },
    {
      id: '2',
      name: 'Mike T.',
      role: 'Conveyancer',
      activeMatters: 9,
      completedThisMonth: 6,
      averageTime: '22 days'
    },
    {
      id: '3',
      name: 'Lisa M.',
      role: 'Junior Conveyancer',
      activeMatters: 6,
      completedThisMonth: 4,
      averageTime: '25 days'
    },
    {
      id: '4',
      name: 'Admin User',
      role: 'Practice Manager',
      activeMatters: 3,
      completedThisMonth: 12,
      averageTime: '15 days'
    }
  ];

  const handleAcceptApplication = (applicationId: string) => {
    console.log(`Accepting application: ${applicationId}`);
    // In real app, this would update the database
  };

  const handleDeclineApplication = (applicationId: string) => {
    console.log(`Declining application: ${applicationId}`);
    // In real app, this would update the database
  };

  const handleCreateCase = (applicationId: string) => {
    const application = mockBankApplications.find(app => app.id === applicationId);
    if (application) {
      // Mock transaction data for the case
      const transactionData = {
        transactionType: application.transaction_type,
        hasAgent: false,
        entityType: 'individual',
        nationality: 'Botswana',
        sellingPrice: application.loan_amount.toString(),
        buyerName: application.applicant_name,
        propertyAddress: application.property_address,
        bankName: application.bank_name,
        loanOfficer: application.loan_officer
      };
      
      onViewTransaction(application.case_number, transactionData);
    }
  };

  const handleApplyFilters = (filters: any) => {
    console.log('Applying filters:', filters);
    // In real app, this would filter the data
  };

  const tabs = [
    {
      id: 'types',
      name: 'Transactions',
      icon: FileText,
      description: 'View by transaction type',
      count: null
    },
    {
      id: 'status',
      name: 'Matter Status',
      icon: BarChart3,
      description: 'Track matter status',
      count: null
    },
    {
      id: 'ongoing',
      name: 'Team & Progress',
      icon: RefreshCw,
      description: 'Team workload overview',
      count: null
    },
    {
      id: 'banks',
      name: 'Bank Applications',
      icon: Building,
      description: 'Financial institution matters',
      count: mockBankApplications.filter(app => app.status === 'submitted').length
    },
    {
      id: 'search',
      name: 'Advanced Search',
      icon: Search,
      description: 'Search and filter tools',
      count: null
    }
  ];

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
                <h1 className="text-2xl font-bold text-gray-900">Conveyancer Admin Dashboard</h1>
                <p className="text-sm text-gray-600">OrionX Legal Services • Practice Management</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </button>
              
              <button
                onClick={() => setShowAuditLogger(true)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="View Audit Logs"
              >
                <Eye className="h-5 w-5" />
              </button>
              
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="h-5 w-5" />
              </button>
              
              <div className="flex items-center space-x-3">
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
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <IconComponent className="h-4 w-4 mr-2" />
                  {tab.name}
                  {tab.count !== null && tab.count > 0 && (
                    <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'types' && (
          <TransactionTypesSection
            searchTerm={searchTerm}
            onSearch={setSearchTerm}
          />
        )}
        
        {activeTab === 'status' && (
          <MatterStatusSection
            searchTerm={searchTerm}
            onSearch={setSearchTerm}
          />
        )}
        
        {activeTab === 'ongoing' && (
          <OngoingMattersSection
            totalMatters={61}
            completedMatters={25}
            teamMembers={mockTeamMembers}
          />
        )}
        
        {activeTab === 'banks' && (
          <BankApplicationsSection
            applications={mockBankApplications}
            onAcceptApplication={handleAcceptApplication}
            onDeclineApplication={handleDeclineApplication}
            onCreateCase={handleCreateCase}
          />
        )}
        
        {activeTab === 'search' && (
          <SearchFiltersSection
            searchTerm={searchTerm}
            onSearch={setSearchTerm}
            onApplyFilters={handleApplyFilters}
          />
        )}
      </div>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="fixed top-16 right-4 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-medium text-gray-900">Notifications</h3>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {[
              { id: 1, message: 'New bank application received', time: '5 minutes ago', type: 'info' },
              { id: 2, message: 'TXN-001 requires your attention', time: '1 hour ago', type: 'warning' },
              { id: 3, message: 'Document uploaded for BOND-012', time: '2 hours ago', type: 'success' }
            ].map(notification => (
              <div key={notification.id} className="p-3 border-b border-gray-100 hover:bg-gray-50">
                <p className="text-sm text-gray-900">{notification.message}</p>
                <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit Logger Modal */}
      <AuditLogger
        isOpen={showAuditLogger}
        onClose={() => setShowAuditLogger(false)}
      />
    </div>
  );
};

export default ConveyancerOverview;