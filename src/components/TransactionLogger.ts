import { OrganizationUser, Organization } from '../types/database';

export interface TransactionLogEntry {
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

class TransactionLogger {
  // In a real application, this would connect to a database
  // For this demo, we'll store logs in localStorage
  private static STORAGE_KEY = 'transactionAuditLogs';

  /**
   * Log a transaction action
   */
  static log(
    transactionId: string,
    user: OrganizationUser,
    action: string,
    description: string,
    details: any = {}
  ): void {
    const entry: TransactionLogEntry = {
      transaction_id: transactionId,
      user_id: user.id,
      user: {
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role
      },
      organization_id: user.organization_id,
      organization: user.organization ? {
        name: user.organization.name,
        type: user.organization.type
      } : undefined,
      action,
      description,
      details,
      created_at: new Date().toISOString()
    };

    // Get existing logs
    const existingLogs = this.getTransactionLogs(transactionId);
    
    // Add new log
    existingLogs.push(entry);
    
    // Save logs
    this.saveTransactionLogs(transactionId, existingLogs);
    
    // In a real application, this would make an API call to the backend
    console.log(`Transaction Log [${transactionId}]:`, action, description);
  }

  /**
   * Get all logs for a transaction
   */
  static getTransactionLogs(transactionId: string): TransactionLogEntry[] {
    try {
      const allLogs = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
      return allLogs[transactionId] || [];
    } catch (error) {
      console.error('Error getting transaction logs:', error);
      return [];
    }
  }

  /**
   * Save logs for a transaction
   */
  private static saveTransactionLogs(transactionId: string, logs: TransactionLogEntry[]): void {
    try {
      // Get all logs
      const allLogs = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
      
      // Update logs for this transaction
      allLogs[transactionId] = logs;
      
      // Save back to localStorage
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allLogs));
    } catch (error) {
      console.error('Error saving transaction logs:', error);
    }
  }

  /**
   * Clear all logs (for testing/development)
   */
  static clearAllLogs(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * System log (for automated actions)
   */
  static systemLog(
    transactionId: string,
    action: string,
    description: string,
    details: any = {}
  ): void {
    const systemUser: OrganizationUser = {
      id: 'system',
      organization_id: 'system',
      email: 'system@easyconvey.com',
      first_name: 'System',
      last_name: '',
      role: 'system',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      organization: {
        id: 'system',
        name: 'EasyConvey System',
        type: 'system',
        email: 'system@easyconvey.com',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    };

    this.log(transactionId, systemUser, action, description, details);
  }

  /**
   * Standard action types for consistency
   */
  static ActionTypes = {
    VIEW: 'VIEW',
    EDIT: 'EDIT',
    CREATE: 'CREATE',
    DELETE: 'DELETE',
    ASSIGN: 'ASSIGN',
    STATUS_UPDATE: 'STATUS_UPDATE',
    DOCUMENT_UPLOAD: 'DOCUMENT_UPLOAD',
    DOCUMENT_DOWNLOAD: 'DOCUMENT_DOWNLOAD',
    DOCUMENT_REVIEW: 'DOCUMENT_REVIEW',
    COMMENT_ADD: 'COMMENT_ADD',
    APPLICATION_SUBMISSION: 'APPLICATION_SUBMISSION',
    PAYMENT_REQUEST: 'PAYMENT_REQUEST',
    PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
    NOTIFICATION_SENT: 'NOTIFICATION_SENT'
  };
}

export default TransactionLogger;