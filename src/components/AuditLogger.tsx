import React, { useState, useEffect } from 'react';
import { Eye, FileText, Clock, User, Globe, CheckCircle, AlertCircle } from 'lucide-react';

interface AuditLog {
  timestamp: string;
  action: string;
  user_email: string;
  success: boolean;
  ip_address: string;
  organization_type?: string;
  login_role?: string;
  is_demo_mode?: boolean;
  detected_type?: string;
  error?: string;
}

interface AuditLoggerProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuditLogger: React.FC<AuditLoggerProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Try loading from Supabase audit service first
      import('../services/audit.service').then(async (auditService) => {
        try {
          const supabaseLogs = await auditService.getAuditLogs();
          if (supabaseLogs.length > 0) {
            setLogs(supabaseLogs.map(l => ({
              timestamp: l.created_at,
              action: l.action,
              user_email: l.user_email,
              success: true,
              ip_address: l.ip_address || 'unknown',
              ...l.details,
            })));
            return;
          }
        } catch {
          // Fallback to localStorage
        }
        const storedLogs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
        setLogs(storedLogs.reverse());
      });
    }
  }, [isOpen]);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'LOGIN_ATTEMPT':
        return <User className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (success: boolean) => {
    return success ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (success: boolean) => {
    return success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Audit Trail</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[60vh]">
          {logs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No audit logs found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {logs.map((log, index) => (
                <div key={index} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${log.success ? 'bg-green-100' : 'bg-red-100'}`}>
                        <div className={getStatusColor(log.success)}>
                          {getActionIcon(log.action)}
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">{log.action.replace('_', ' ')}</span>
                          <div className={`flex items-center ${getStatusColor(log.success)}`}>
                            {getStatusIcon(log.success)}
                            <span className="ml-1 text-xs">{log.success ? 'Success' : 'Failed'}</span>
                          </div>
                        </div>
                        
                        <div className="mt-1 space-y-1">
                          <div className="flex items-center text-xs text-gray-500">
                            <User className="h-3 w-3 mr-1" />
                            {log.user_email}
                            {log.organization_type && (
                              <>
                                <span className="mx-2">•</span>
                                <span className="capitalize">{log.organization_type.replace('_', ' ')}</span>
                              </>
                            )}
                            {log.login_role && (
                              <>
                                <span className="mx-2">•</span>
                                <span className="capitalize">{log.login_role.replace('_', ' ')}</span>
                              </>
                            )}
                          </div>
                          
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTimestamp(log.timestamp)}
                            <span className="mx-2">•</span>
                            <Globe className="h-3 w-3 mr-1" />
                            {log.ip_address}
                          </div>
                          
                          {log.is_demo_mode && (
                            <div className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              Demo Mode
                            </div>
                          )}
                          
                          {log.detected_type && (
                            <div className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full ml-2">
                              Auto-detected: {log.detected_type.replace('_', ' ')}
                            </div>
                          )}
                          
                          {log.error && (
                            <div className="mt-1 text-xs text-red-600">
                              Error: {log.error}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>Showing last {logs.length} audit entries</span>
            <span>Data stored locally for demo purposes</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogger;