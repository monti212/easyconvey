import React, { useState } from 'react';
import { 
  Building, 
  Clock, 
  CheckCircle, 
  X, 
  DollarSign, 
  User, 
  MapPin, 
  FileText,
  AlertTriangle,
  Eye,
  MessageSquare,
  UserCheck,
  Calendar,
  Phone,
  Mail
} from 'lucide-react';

interface BankApplication {
  id: string;
  loan_id: string;
  bank_name: string;
  case_number: string;
  applicant_name: string;
  applicant_email: string;
  loan_amount: number;
  property_address: string;
  transaction_type: string;
  urgency_level: 'low' | 'medium' | 'high';
  status: 'submitted' | 'accepted' | 'in_progress' | 'completed';
  special_instructions: string;
  submitted_at: string;
  loan_officer: string;
  interest_rate: number;
  term_months: number;
}

interface BankApplicationsSectionProps {
  applications: BankApplication[];
  onAcceptApplication: (applicationId: string) => void;
  onDeclineApplication: (applicationId: string) => void;
  onCreateCase: (applicationId: string) => void;
}

const BankApplicationsSection: React.FC<BankApplicationsSectionProps> = ({
  applications,
  onAcceptApplication,
  onDeclineApplication,
  onCreateCase
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterUrgency, setFilterUrgency] = useState<string>('all');
  const [selectedApplication, setSelectedApplication] = useState<BankApplication | null>(null);

  const formatCurrency = (amount: number) => `P ${amount.toLocaleString()}`;

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
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
      case 'submitted': return <Clock className="h-4 w-4" />;
      case 'accepted': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <FileText className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const filteredApplications = applications.filter(app => {
    const statusMatch = filterStatus === 'all' || app.status === filterStatus;
    const urgencyMatch = filterUrgency === 'all' || app.urgency_level === filterUrgency;
    return statusMatch && urgencyMatch;
  });

  const pendingApplications = applications.filter(app => app.status === 'submitted');
  const acceptedApplications = applications.filter(app => app.status === 'accepted');
  const inProgressApplications = applications.filter(app => app.status === 'in_progress');

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Review</p>
              <p className="text-2xl font-bold text-gray-900">{pendingApplications.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Accepted</p>
              <p className="text-2xl font-bold text-gray-900">{acceptedApplications.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{inProgressApplications.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(applications.reduce((sum, app) => sum + app.loan_amount, 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="submitted">Submitted</option>
              <option value="accepted">Accepted</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Urgency:</span>
            <select
              value={filterUrgency}
              onChange={(e) => setFilterUrgency(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Urgency</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          
          <div className="ml-auto text-sm text-gray-500">
            Showing {filteredApplications.length} of {applications.length} applications
          </div>
        </div>
      </div>

      {/* Applications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredApplications.map((application) => (
          <div key={application.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-semibold text-gray-900">{application.case_number}</h4>
                <p className="text-sm text-gray-600">{application.bank_name}</p>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <span className={`px-2 py-1 text-xs rounded-full border ${getUrgencyColor(application.urgency_level)}`}>
                  {application.urgency_level} priority
                </span>
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(application.status)}`}>
                  {getStatusIcon(application.status)}
                  <span className="ml-1">{application.status}</span>
                </span>
              </div>
            </div>

            {/* Application Details */}
            <div className="space-y-3 mb-4">
              <div className="flex items-start">
                <User className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="ml-2">
                  <p className="text-sm font-medium text-gray-900">{application.applicant_name}</p>
                  <p className="text-xs text-gray-500">{application.applicant_email}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="ml-2">
                  <p className="text-sm text-gray-900">{application.property_address}</p>
                  <p className="text-xs text-gray-500 capitalize">{application.transaction_type}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Loan Amount:</span>
                <span className="text-sm font-medium text-gray-900">{formatCurrency(application.loan_amount)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Interest Rate:</span>
                <span className="text-sm font-medium text-gray-900">{application.interest_rate}%</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Term:</span>
                <span className="text-sm font-medium text-gray-900">{application.term_months / 12} years</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Loan Officer:</span>
                <span className="text-sm font-medium text-gray-900">{application.loan_officer}</span>
              </div>
            </div>

            {/* Special Instructions */}
            {application.special_instructions && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="ml-2">
                    <p className="text-xs font-medium text-amber-800">Special Instructions</p>
                    <p className="text-xs text-amber-700 mt-1">{application.special_instructions}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2">
              {application.status === 'submitted' && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => onAcceptApplication(application.id)}
                    className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    <CheckCircle className="h-4 w-4 inline mr-1" />
                    Accept
                  </button>
                  <button
                    onClick={() => onDeclineApplication(application.id)}
                    className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    <X className="h-4 w-4 inline mr-1" />
                    Decline
                  </button>
                </div>
              )}
              
              {application.status === 'accepted' && (
                <button
                  onClick={() => onCreateCase(application.id)}
                  className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <UserCheck className="h-4 w-4 inline mr-1" />
                  Create Case
                </button>
              )}
              
              <div className="flex space-x-2">
                <button 
                  onClick={() => setSelectedApplication(application)}
                  className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  <Eye className="h-4 w-4 inline mr-1" />
                  View Details
                </button>
                <button className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm">
                  <MessageSquare className="h-4 w-4 inline mr-1" />
                  Message
                </button>
              </div>
            </div>

            {/* Timeline indicator */}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="flex items-center text-xs text-gray-500">
                <Calendar className="h-3 w-3 mr-1" />
                Submitted {new Date(application.submitted_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Application Detail Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Building className="h-8 w-8 text-white mr-3" />
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedApplication.case_number}</h2>
                    <p className="text-blue-100 text-sm">{selectedApplication.bank_name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedApplication(null)}
                  className="p-2 text-blue-100 hover:text-white hover:bg-blue-600 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-6">
                {/* Loan Details */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-blue-800 mb-3">Loan Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-blue-600 font-medium">Amount:</span>
                      <span className="text-sm text-blue-800 ml-2">{formatCurrency(selectedApplication.loan_amount)}</span>
                    </div>
                    <div>
                      <span className="text-sm text-blue-600 font-medium">Interest Rate:</span>
                      <span className="text-sm text-blue-800 ml-2">{selectedApplication.interest_rate}%</span>
                    </div>
                    <div>
                      <span className="text-sm text-blue-600 font-medium">Term:</span>
                      <span className="text-sm text-blue-800 ml-2">{selectedApplication.term_months / 12} years</span>
                    </div>
                    <div>
                      <span className="text-sm text-blue-600 font-medium">Loan Officer:</span>
                      <span className="text-sm text-blue-800 ml-2">{selectedApplication.loan_officer}</span>
                    </div>
                  </div>
                </div>

                {/* Applicant Details */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-green-800 mb-3">Applicant Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-green-600 mr-2" />
                      <span className="text-sm font-medium text-gray-900">{selectedApplication.applicant_name}</span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-green-600 mr-2" />
                      <span className="text-sm text-gray-700">{selectedApplication.applicant_email}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-green-600 mr-2" />
                      <span className="text-sm text-gray-700">{selectedApplication.property_address}</span>
                    </div>
                  </div>
                </div>

                {/* Special Instructions */}
                {selectedApplication.special_instructions && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-amber-800 mb-3">Special Instructions</h3>
                    <p className="text-sm text-amber-700">{selectedApplication.special_instructions}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-3">
                  {selectedApplication.status === 'submitted' && (
                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          onAcceptApplication(selectedApplication.id);
                          setSelectedApplication(null);
                        }}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle className="h-4 w-4 inline mr-2" />
                        Accept Application
                      </button>
                      <button
                        onClick={() => {
                          onDeclineApplication(selectedApplication.id);
                          setSelectedApplication(null);
                        }}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <X className="h-4 w-4 inline mr-2" />
                        Decline
                      </button>
                    </div>
                  )}
                  
                  {selectedApplication.status === 'accepted' && (
                    <button
                      onClick={() => {
                        onCreateCase(selectedApplication.id);
                        setSelectedApplication(null);
                      }}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <UserCheck className="h-4 w-4 inline mr-2" />
                      Create Conveyancing Case
                    </button>
                  )}
                  
                  <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    <MessageSquare className="h-4 w-4 inline mr-2" />
                    Contact Bank
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredApplications.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Bank Applications</h3>
          <p className="text-gray-500">
            {filterStatus !== 'all' || filterUrgency !== 'all' 
              ? 'No applications match your current filters'
              : 'No conveyancing applications from banks yet'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default BankApplicationsSection;