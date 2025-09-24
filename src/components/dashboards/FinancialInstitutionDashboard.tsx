import React, { useState } from 'react';
import { 
  Plus, 
  CreditCard, 
  Users, 
  TrendingUp, 
  Eye, 
  Edit, 
  MessageSquare,
  Search,
  Filter,
  Building,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Calculator,
  Send,
  Scale,
  UserCheck
} from 'lucide-react';
import { Loan, Case, Organization, OrganizationUser } from '../../types/database';
import ConveyancingApplicationForm from './ConveyancingApplicationForm';

interface FinancialInstitutionDashboardProps {
  user: OrganizationUser;
  organization: Organization;
  onLogout: () => void;
}

const FinancialInstitutionDashboard: React.FC<FinancialInstitutionDashboardProps> = ({
  user,
  organization,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'loans' | 'applications' | 'conveyancing' | 'team'>('loans');
  const [searchTerm, setSearchTerm] = useState('');
  const [showConveyancingForm, setShowConveyancingForm] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);

  // Mock data - in real app, this would come from the database
  const [loans, setLoans] = useState<Loan[]>([
    {
      id: '1',
      organization_id: organization.id,
      loan_officer_id: user.id,
      application_number: 'LOAN-2025-001',
      applicant_name: 'John Doe',
      applicant_email: 'john@example.com',
      loan_amount: 2000000,
      interest_rate: 8.5,
      term_months: 240,
      status: 'approved',
      documents: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '2',
      organization_id: organization.id,
      loan_officer_id: user.id,
      application_number: 'LOAN-2025-002',
      applicant_name: 'Jane Smith',
      applicant_email: 'jane@example.com',
      loan_amount: 1500000,
      interest_rate: 9.0,
      term_months: 180,
      status: 'approved',
      documents: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '3',
      organization_id: organization.id,
      loan_officer_id: user.id,
      application_number: 'LOAN-2025-003',
      applicant_name: 'Michael Chen',
      applicant_email: 'michael@example.com',
      loan_amount: 3200000,
      interest_rate: 8.0,
      term_months: 300,
      status: 'application',
      documents: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]);

  // Mock conveyancing applications submitted by this bank
  const [conveyancingApplications, setConveyancingApplications] = useState([
    {
      id: 'conv-app-1',
      loan_id: '1',
      loan: loans[0],
      conveyancer_firm: 'OrionX Legal Services',
      case_number: 'CONV-2025-001',
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      property_address: 'Block 8, Plot 123, Gaborone',
      transaction_type: 'buying'
    }
  ]);

  const formatCurrency = (amount: number) => `P ${amount.toLocaleString()}`;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'application': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'disbursed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConveyancingStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'application': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <AlertCircle className="h-4 w-4" />;
      case 'disbursed': return <CreditCard className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const calculateMonthlyPayment = (principal: number, rate: number, term: number) => {
    const monthlyRate = rate / 100 / 12;
    const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1);
    return payment;
  };

  const handleSubmitToConveyancer = (loan: Loan) => {
    setSelectedLoan(loan);
    setShowConveyancingForm(true);
  };

  const handleConveyancingSubmit = (applicationData: any) => {
    // Create new conveyancing application
    const newApplication = {
      id: `conv-app-${Date.now()}`,
      loan_id: selectedLoan!.id,
      loan: selectedLoan!,
      conveyancer_firm: applicationData.conveyancerFirm,
      case_number: `CONV-${Date.now()}`,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      property_address: applicationData.propertyAddress,
      transaction_type: applicationData.transactionType
    };

    setConveyancingApplications(prev => [...prev, newApplication]);
    setShowConveyancingForm(false);
    setSelectedLoan(null);

    // Update loan status to indicate conveyancing has been initiated
    setLoans(prev => prev.map(loan => 
      loan.id === selectedLoan!.id 
        ? { ...loan, status: 'disbursed' as any }
        : loan
    ));
  };

  const renderLoans = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Loan Portfolio</h3>
        <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4 mr-2" />
          New Application
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Application
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applicant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loan Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monthly Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loans.map((loan) => (
                <tr key={loan.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{loan.application_number}</div>
                    <div className="text-sm text-gray-500">
                      {loan.interest_rate}% • {loan.term_months} months
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{loan.applicant_name}</div>
                      <div className="text-sm text-gray-500">{loan.applicant_email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(loan.loan_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {loan.interest_rate && loan.term_months ? 
                      formatCurrency(calculateMonthlyPayment(loan.loan_amount, loan.interest_rate, loan.term_months)) :
                      'TBD'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${getStatusColor(loan.status)}`}>
                      {getStatusIcon(loan.status)}
                      <span className="ml-1 capitalize">{loan.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-800">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-800">
                        <Calculator className="h-4 w-4" />
                      </button>
                      {loan.status === 'approved' && (
                        <button 
                          onClick={() => handleSubmitToConveyancer(loan)}
                          className="text-purple-600 hover:text-purple-800"
                          title="Submit to Conveyancer"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      )}
                      <button className="text-gray-600 hover:text-gray-800">
                        <MessageSquare className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderApplications = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Recent Applications</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loans.filter(loan => loan.status === 'application').map((loan) => (
          <div key={loan.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{loan.application_number}</h4>
                <p className="text-sm text-gray-600">{loan.applicant_name}</p>
              </div>
              <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${getStatusColor(loan.status)}`}>
                {getStatusIcon(loan.status)}
                <span className="ml-1">Pending</span>
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Requested Amount:</span>
                <span className="text-sm font-medium">{formatCurrency(loan.loan_amount)}</span>
              </div>
              
              {loan.interest_rate && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Interest Rate:</span>
                  <span className="text-sm font-medium">{loan.interest_rate}%</span>
                </div>
              )}
              
              {loan.term_months && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Term:</span>
                  <span className="text-sm font-medium">{loan.term_months / 12} years</span>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex space-x-2">
              <button className="flex-1 px-3 py-2 text-sm bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors">
                Approve
              </button>
              <button className="flex-1 px-3 py-2 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors">
                Reject
              </button>
              <button className="px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors">
                <Eye className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {loans.filter(loan => loan.status === 'application').length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No pending applications</p>
        </div>
      )}
    </div>
  );

  const renderConveyancingApplications = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Conveyancing Applications</h3>
        <div className="text-sm text-gray-500">
          Applications submitted to conveyancers for legal processing
        </div>
      </div>

      {conveyancingApplications.length === 0 ? (
        <div className="text-center py-12">
          <Scale className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No conveyancing applications submitted yet</p>
          <p className="text-sm text-gray-400">
            Approve loans first, then submit them to conveyancers for legal processing
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {conveyancingApplications.map((application) => (
            <div key={application.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">{application.case_number}</h4>
                  <p className="text-sm text-gray-600">{application.loan.applicant_name}</p>
                </div>
                <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${getConveyancingStatusColor(application.status)}`}>
                  <Scale className="h-3 w-3 mr-1" />
                  {application.status}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Loan Amount:</span>
                  <span className="text-sm font-medium">{formatCurrency(application.loan.loan_amount)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Conveyancer:</span>
                  <span className="text-sm font-medium">{application.conveyancer_firm}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Property:</span>
                  <span className="text-sm font-medium truncate" title={application.property_address}>
                    {application.property_address}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Type:</span>
                  <span className="text-sm font-medium capitalize">{application.transaction_type}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Submitted:</span>
                  <span className="text-sm font-medium">
                    {new Date(application.submitted_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex space-x-2">
                <button className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors">
                  <Eye className="h-4 w-4 inline mr-1" />
                  View
                </button>
                <button className="flex-1 px-3 py-2 text-sm bg-purple-50 text-purple-600 rounded hover:bg-purple-100 transition-colors">
                  <MessageSquare className="h-4 w-4 inline mr-1" />
                  Contact
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Scale className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="ml-3">
            <h4 className="text-sm font-medium text-blue-800">Conveyancing Process</h4>
            <p className="text-sm text-blue-700 mt-1">
              When you approve a loan, you can submit the application to a conveyancer for legal processing. 
              The conveyancer will handle property transfers, title deed verification, and all legal requirements.
            </p>
          </div>
        </div>
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
              <h1 className="text-2xl font-bold text-gray-900">Financial Institution Dashboard</h1>
              <p className="text-sm text-gray-600">{organization.name}</p>
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

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CreditCard className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Loans</p>
                <p className="text-2xl font-bold text-gray-900">{loans.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loans.filter(l => l.status === 'application').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loans.filter(l => l.status === 'approved').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Scale className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">To Conveyancer</p>
                <p className="text-2xl font-bold text-gray-900">{conveyancingApplications.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(loans.reduce((sum, l) => sum + l.loan_amount, 0))}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'loans', label: 'All Loans', icon: CreditCard },
                { id: 'applications', label: 'Applications', icon: FileText },
                { id: 'conveyancing', label: 'Conveyancing', icon: Scale },
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
                    {tab.id === 'conveyancing' && conveyancingApplications.length > 0 && (
                      <span className="ml-2 bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full">
                        {conveyancingApplications.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'loans' && renderLoans()}
            {activeTab === 'applications' && renderApplications()}
            {activeTab === 'conveyancing' && renderConveyancingApplications()}
            {activeTab === 'team' && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Team management coming soon</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Conveyancing Application Form Modal */}
      {showConveyancingForm && selectedLoan && (
        <ConveyancingApplicationForm
          loan={selectedLoan}
          onSubmit={handleConveyancingSubmit}
          onCancel={() => {
            setShowConveyancingForm(false);
            setSelectedLoan(null);
          }}
        />
      )}
    </div>
  );
};

export default FinancialInstitutionDashboard;