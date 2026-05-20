import React, { useState } from 'react';
import {
  ArrowLeft,
  Search,
  BarChart3,
  FileText,
  Inbox,
  Filter,
  Bell,
  RefreshCw,
  Plus
} from 'lucide-react';
import { OrganizationUser } from '../types/database';
import * as casesService from '../services/cases.service';
import TransactionTypesSection from './dashboard-sections/TransactionTypesSection';
import MatterStatusSection from './dashboard-sections/MatterStatusSection';
import OngoingMattersSection from './dashboard-sections/OngoingMattersSection';
import BankApplicationsSection from './dashboard-sections/BankApplicationsSection';
import SearchFiltersSection from './dashboard-sections/SearchFiltersSection';
import AuditLogger from './AuditLogger';
import { useAuth } from '../hooks/useAuth';
import { useLoans } from '../hooks/useLoans';
import { useOrganization } from '../hooks/useOrganization';
import { useCases } from '../hooks/useCases';
import { useNotifications } from '../hooks/useNotifications';
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription';
import NotificationCenter from './NotificationCenter';
import NewCaseModal from './NewCaseModal';
import ConveyancerPartyEntry from './ConveyancerPartyEntry';

interface ConveyancerOverviewProps {
  user: OrganizationUser;
  onLogout: () => void;
  onViewTransaction: (transactionId: string, transactionData: any) => void;
  onBack: () => void;
  onStartNewTransaction?: (caseId?: string, typeData?: any) => void;
}

const ConveyancerOverview: React.FC<ConveyancerOverviewProps> = ({
  user,
  onLogout,
  onViewTransaction,
  onBack,
  onStartNewTransaction
}) => {
  const { organization: authOrg } = useAuth();
  const orgId = authOrg?.id || user.organization_id;
  const { members } = useOrganization(orgId);
  const { loans } = useLoans(orgId);
  const { unreadCount } = useNotifications(orgId);
  const { cases, refetch: refetchCases } = useCases(orgId);

  // Subscribe to real-time case updates for this org
  useRealtimeSubscription(
    {
      table: 'cases',
      event: '*',
      filter: orgId ? `organization_id=eq.${orgId}` : undefined,
    },
    () => {
      refetchCases();
    },
    !!orgId
  );

  const [activeTab, setActiveTab] = useState<'types' | 'status' | 'ongoing' | 'banks' | 'search'>('types');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAuditLogger, setShowAuditLogger] = useState(false);
  const [showNewCase, setShowNewCase] = useState(false);
  const [newCaseCategory, setNewCaseCategory] = useState<string | null>(null);
  const [partyEntryCaseId, setPartyEntryCaseId] = useState<string | null>(null);

  // Map loans to bank applications format for BankApplicationsSection
  const bankApplications = loans.map(loan => ({
    id: loan.id,
    loan_id: loan.id,
    bank_name: loan.organization?.name || 'Unknown Bank',
    case_number: loan.case?.case_number || loan.application_number,
    applicant_name: loan.applicant_name,
    applicant_email: loan.applicant_email || '',
    loan_amount: loan.loan_amount,
    property_address: loan.property?.address || 'Address pending',
    transaction_type: 'buying',
    urgency_level: 'medium' as const,
    status: (loan.status === 'application' ? 'submitted' : loan.status === 'approved' ? 'accepted' : 'submitted') as 'submitted' | 'accepted',
    special_instructions: '',
    submitted_at: loan.created_at,
    loan_officer: loan.loan_officer?.first_name ? `${loan.loan_officer.first_name} ${loan.loan_officer.last_name}` : 'Unassigned',
    interest_rate: loan.interest_rate || 0,
    term_months: loan.term_months || 0,
  }));

  // Map org members to team members format for OngoingMattersSection
  const teamMembers = members.map(m => ({
    id: m.id,
    name: `${m.first_name} ${m.last_name?.charAt(0) || ''}.`,
    role: m.role === 'super_admin' ? 'Practice Manager' : m.role === 'admin' ? 'Senior Conveyancer' : 'Conveyancer',
    activeMatters: cases.filter(c => c.conveyancer_id === m.id && c.status !== 'completed').length,
    completedThisMonth: cases.filter(c => c.conveyancer_id === m.id && c.status === 'completed').length,
    averageTime: 'N/A',
  }));

  const handleAcceptApplication = async (applicationId: string) => {
    // Loan is already linked to a case by the bank — accepting is an acknowledgment
    console.log(`Application ${applicationId} accepted`);
  };

  const handleDeclineApplication = async (applicationId: string) => {
    // Declining doesn't change the loan status — the conveyancer simply ignores it
    console.log(`Application ${applicationId} declined`);
  };

  const handleCreateCase = async (applicationId: string) => {
    const application = bankApplications.find(app => app.id === applicationId);
    if (!application || !authOrg) return;

    try {
      // Check if the loan already has a linked case
      const loan = loans.find(l => l.id === applicationId);
      const loanTypeData = {
        transactionType: application.transaction_type || 'buying',
        transactionCategory: 'normal_transfer',
        includeBondRegistration: false,
      };
      if (loan?.case_id) {
        // Case already exists — navigate to it
        onStartNewTransaction(loan.case_id, loanTypeData);
        return;
      }

      // Create a new case from the application
      const newCase = await casesService.createCase({
        organization_id: authOrg.id,
        case_type: application.transaction_type,
        client_name: application.applicant_name,
        status: 'initiated',
        priority: 'medium',
        documents: [],
        notes: `From ${application.bank_name} — Loan: ${application.case_number}`,
      });

      onStartNewTransaction(newCase.id, loanTypeData);
    } catch (err) {
      console.error('Failed to create case from application:', err);
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
      name: 'Inbox',
      icon: Inbox,
      description: 'Received files & info from agents and banks',
      count: bankApplications.filter(app => app.status === 'submitted').length
    },
    {
      id: 'search',
      name: 'Advanced Search',
      icon: Search,
      description: 'Search and filter tools',
      count: null
    }
  ];

  if (partyEntryCaseId) {
    return (
      <ConveyancerPartyEntry
        caseId={partyEntryCaseId}
        onDone={() => { setPartyEntryCaseId(null); refetchCases(); }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-soft border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div>
                <h1 className="font-serif text-xl font-semibold text-primary tracking-tight">
                  Minchin &amp; Kelly<span className="text-secondary">.</span>
                </h1>
                <p className="text-sm text-gray-500">{authOrg?.name || 'Practice'} — Practice Management</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowNewCase(true)}
                className="btn-shine inline-flex items-center px-4 py-2 bg-secondary text-primary text-sm font-semibold rounded-lg hover:bg-secondary-dark transition-colors"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                New Case
              </button>

              {unreadCount > 0 && (
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                </button>
              )}

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
                      ? 'border-secondary text-primary'
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
            cases={cases}
            onViewTransaction={onViewTransaction}
            onStartTransaction={(caseId, typeData) => onStartNewTransaction?.(caseId, typeData)}
          />
        )}
        
        {activeTab === 'status' && (
          <MatterStatusSection
            cases={cases}
            orgId={orgId}
            onViewTransaction={onViewTransaction}
          />
        )}
        
        {activeTab === 'ongoing' && (
          <OngoingMattersSection
            totalMatters={cases.length}
            completedMatters={cases.filter(c => c.status === 'completed').length}
            teamMembers={teamMembers}
          />
        )}
        
        {activeTab === 'banks' && (
          <BankApplicationsSection
            applications={bankApplications}
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
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      {/* Audit Logger Modal */}
      <AuditLogger
        isOpen={showAuditLogger}
        onClose={() => setShowAuditLogger(false)}
      />

      {/* New Case Modal */}
      <NewCaseModal
        isOpen={showNewCase}
        initialCategory={newCaseCategory}
        onClose={() => { setShowNewCase(false); setNewCaseCategory(null); }}
        onCaseCreated={(caseId) => {
          setShowNewCase(false);
          setNewCaseCategory(null);
          refetchCases();
          // Manual mode ("I'll enter the details") — the conveyancer now fills
          // in the buyer and seller details before the transaction can start.
          setPartyEntryCaseId(caseId);
        }}
      />
    </div>
  );
};

export default ConveyancerOverview;