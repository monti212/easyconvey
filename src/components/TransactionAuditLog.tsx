import React, { useState, useEffect } from 'react';
import { FileText, Clock, User, Shield, Users, CheckCircle, AlertCircle, Edit, Eye, X } from 'lucide-react';

export interface TransactionAuditLogEntry {
  id: string;
  transaction_id: string;
  user_id: string;
  user?: {
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  };
  organization_id: string;
  organization?: {
    name: string;
    type: string;
  };
  action: string;
  description: string;
  details: any;
  created_at: string;
}

interface TransactionAuditLogProps {
  isOpen: boolean;
  transactionId: string;
  onClose: () => void;
}

const TransactionAuditLog: React.FC<TransactionAuditLogProps> = ({ isOpen, transactionId, onClose }) => {
  const [logs, setLogs] = useState<TransactionAuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      // In a real application, this would fetch from the API/database
      // For this demo, we'll create mock data
      setIsLoading(true);
      
      // Simulate API call delay
      setTimeout(() => {
        const mockLogs: TransactionAuditLogEntry[] = generateMockLogs(transactionId);
        setLogs(mockLogs);
        setIsLoading(false);
      }, 800);
    }
  }, [isOpen, transactionId]);

  const generateMockLogs = (txId: string): TransactionAuditLogEntry[] => {
    const now = new Date();
    
    return [
      {
        id: '1',
        transaction_id: txId,
        user_id: 'user-1',
        user: {
          first_name: 'Monti',
          last_name: 'K.',
          email: 'monti@orionx.xyz',
          role: 'super_admin'
        },
        organization_id: 'org-1',
        organization: {
          name: 'OrionX Legal Services',
          type: 'conveyancer'
        },
        action: 'VIEW',
        description: 'Viewed transaction details',
        details: {},
        created_at: new Date(now.getTime() - 5 * 60000).toISOString() // 5 minutes ago
      },
      {
        id: '2',
        transaction_id: txId,
        user_id: 'user-1',
        user: {
          first_name: 'Monti',
          last_name: 'K.',
          email: 'monti@orionx.xyz',
          role: 'super_admin'
        },
        organization_id: 'org-1',
        organization: {
          name: 'OrionX Legal Services',
          type: 'conveyancer'
        },
        action: 'ASSIGN',
        description: 'Assigned to Monti K.',
        details: {
          assignee_id: 'user-1',
          previous_assignee_id: null
        },
        created_at: new Date(now.getTime() - 10 * 60000).toISOString() // 10 minutes ago
      },
      {
        id: '3',
        transaction_id: txId,
        user_id: 'user-2',
        user: {
          first_name: 'Sarah',
          last_name: 'Johnson',
          email: 'sarah@orionx.xyz',
          role: 'user'
        },
        organization_id: 'org-1',
        organization: {
          name: 'OrionX Legal Services',
          type: 'conveyancer'
        },
        action: 'DOCUMENT_REVIEW',
        description: 'Reviewed title deed document',
        details: {
          document_id: 'doc-1',
          document_name: 'Title_Deed.pdf',
          status: 'approved'
        },
        created_at: new Date(now.getTime() - 3 * 3600000).toISOString() // 3 hours ago
      },
      {
        id: '4',
        transaction_id: txId,
        user_id: 'user-3',
        user: {
          first_name: 'John',
          last_name: 'Smith',
          email: 'john@premiumproperties.co.bw',
          role: 'user'
        },
        organization_id: 'org-2',
        organization: {
          name: 'Premium Properties Ltd',
          type: 'estate_agent'
        },
        action: 'DOCUMENT_UPLOAD',
        description: 'Uploaded sale agreement',
        details: {
          document_id: 'doc-2',
          document_name: 'Sale_Agreement.pdf'
        },
        created_at: new Date(now.getTime() - 24 * 3600000).toISOString() // 24 hours ago
      },
      {
        id: '5',
        transaction_id: txId,
        user_id: 'user-4',
        user: {
          first_name: 'Michael',
          last_name: 'Chen',
          email: 'michael@capitalbank.co.bw',
          role: 'user'
        },
        organization_id: 'org-3',
        organization: {
          name: 'Capital Bank Botswana',
          type: 'financial_institution'
        },
        action: 'APPLICATION_SUBMISSION',
        description: 'Submitted loan application for conveyancing',
        details: {
          loan_id: 'loan-1',
          loan_amount: 2000000
        },
        created_at: new Date(now.getTime() - 48 * 3600000).toISOString() // 48 hours ago
      },
      {
        id: '6',
        transaction_id: txId,
        user_id: 'system',
        user: {
          first_name: 'System',
          last_name: '',
          email: 'system@easyconvey.com',
          role: 'system'
        },
        organization_id: 'org-0',
        organization: {
          name: 'EasyConvey System',
          type: 'system'
        },
        action: 'STATUS_UPDATE',
        description: 'Transaction status updated to KYC Complete',
        details: {
          previous_status: 'documents_received',
          new_status: 'kyc_complete'
        },
        created_at: new Date(now.getTime() - 36 * 3600000).toISOString() // 36 hours ago
      }
    ];
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'VIEW': return <Eye className="h-4 w-4" />;
      case 'EDIT': return <Edit className="h-4 w-4" />;
      case 'ASSIGN': return <Users className="h-4 w-4" />;
      case 'DOCUMENT_UPLOAD': return <FileText className="h-4 w-4" />;
      case 'DOCUMENT_REVIEW': return <CheckCircle className="h-4 w-4" />;
      case 'STATUS_UPDATE': return <Clock className="h-4 w-4" />;
      case 'APPLICATION_SUBMISSION': return <Shield className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getOrganizationIcon = (type: string) => {
    switch (type) {
      case 'conveyancer': return <Shield className="h-4 w-4" />;
      case 'estate_agent': return <Building className="h-4 w-4" />;
      case 'financial_institution': return <Briefcase className="h-4 w-4" />;
      default: return <Building className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'VIEW': return 'bg-blue-100 text-blue-700';
      case 'EDIT': return 'bg-purple-100 text-purple-700';
      case 'ASSIGN': return 'bg-indigo-100 text-indigo-700';
      case 'DOCUMENT_UPLOAD': return 'bg-green-100 text-green-700';
      case 'DOCUMENT_REVIEW': return 'bg-amber-100 text-amber-700';
      case 'STATUS_UPDATE': return 'bg-gray-100 text-gray-700';
      case 'APPLICATION_SUBMISSION': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Clock className="h-6 w-6 text-primary mr-2" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">Transaction Audit Trail</h2>
                <p className="text-sm text-gray-600">Transaction ID: {transactionId}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(80vh-120px)] p-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No audit logs found for this transaction</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute top-0 bottom-0 left-4 w-0.5 bg-gray-200 z-0"></div>
              
              {/* Timeline events */}
              <div className="space-y-6">
                {logs.map((log) => (
                  <div key={log.id} className="relative z-10 pl-10">
                    <div className="absolute left-0.5 w-7 h-7 rounded-full border-4 border-white bg-blue-100 flex items-center justify-center">
                      {getActionIcon(log.action)}
                    </div>
                    
                    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                        <div className="mb-2 sm:mb-0">
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getActionColor(log.action)}`}>
                            {log.action.replace('_', ' ')}
                          </span>
                          <h4 className="text-base font-medium text-gray-900 mt-1">{log.description}</h4>
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatTimestamp(log.created_at)}
                        </div>
                      </div>
                      
                      <div className="mt-3 flex items-center text-sm">
                        <User className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-gray-600 font-medium">
                          {log.user?.first_name} {log.user?.last_name}
                        </span>
                        <span className="mx-1 text-gray-400">•</span>
                        <span className={`inline-flex items-center text-xs text-gray-500`}>
                          {log.user?.role.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="mt-1 flex items-center text-sm">
                        <Shield className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-gray-600">
                          {log.organization?.name}
                        </span>
                        <span className="mx-1 text-gray-400">•</span>
                        <span className="text-gray-500 capitalize">
                          {log.organization?.type.replace('_', ' ')}
                        </span>
                      </div>
                      
                      {Object.keys(log.details).length > 0 && (
                        <div className="mt-3 text-sm">
                          <button 
                            className="text-blue-600 hover:text-blue-800 flex items-center"
                            onClick={() => {/* Toggle details view */}}
                          >
                            <span>View details</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Showing {logs.length} audit entries</span>
            <button 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionAuditLog;

// These were missing from your imports, so I'm adding them
const Building = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="16" height="20" x="4" y="2" rx="2" />
    <path d="M9 22v-4h6v4" />
    <path d="M8 6h.01" />
    <path d="M16 6h.01" />
    <path d="M12 6h.01" />
    <path d="M12 10h.01" />
    <path d="M12 14h.01" />
    <path d="M16 10h.01" />
    <path d="M16 14h.01" />
    <path d="M8 10h.01" />
    <path d="M8 14h.01" />
  </svg>
);

const Briefcase = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="20" height="14" x="2" y="7" rx="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);