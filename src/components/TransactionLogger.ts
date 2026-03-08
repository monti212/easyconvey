import { OrganizationUser } from '../types/database';
import * as auditService from '../services/audit.service';

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
  /**
   * Log a transaction action to Supabase (with localStorage fallback)
   */
  static log(
    transactionId: string,
    user: OrganizationUser | null,
    action: string,
    description: string,
    details: any = {}
  ): void {
    const entry: TransactionLogEntry = {
      transaction_id: transactionId,
      user_id: user?.id || 'anonymous',
      user: user ? {
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role
      } : undefined,
      organization_id: user?.organization_id || 'unknown',
      organization: user?.organization ? {
        name: user.organization.name,
        type: user.organization.type
      } : undefined,
      action,
      description,
      details,
      created_at: new Date().toISOString()
    };

    // Write to Supabase (fire-and-forget)
    auditService.logAction({
      transaction_id: transactionId,
      action,
      details: { description, ...details },
      user_email: user?.email || 'anonymous',
    }).catch(err => {
      console.warn('Supabase audit log failed, falling back to localStorage:', err.message);
    });

    // Also store in localStorage as fallback
    try {
      const allLogs = JSON.parse(localStorage.getItem('transactionAuditLogs') || '{}');
      const logs = allLogs[transactionId] || [];
      logs.push(entry);
      allLogs[transactionId] = logs;
      localStorage.setItem('transactionAuditLogs', JSON.stringify(allLogs));
    } catch {
      // localStorage may not be available
    }

    console.log(`Audit [${transactionId}]:`, action, description);
  }

  /**
   * Get all logs for a transaction from Supabase (with localStorage fallback)
   */
  static async getTransactionLogsAsync(transactionId: string): Promise<TransactionLogEntry[]> {
    try {
      const logs = await auditService.getAuditLogs(transactionId);
      return logs.map(l => ({
        transaction_id: l.transaction_id,
        user_id: '',
        organization_id: '',
        action: l.action,
        description: l.details?.description || l.action,
        details: l.details,
        created_at: l.created_at,
      }));
    } catch {
      return this.getTransactionLogs(transactionId);
    }
  }

  /**
   * Get logs from localStorage (sync fallback)
   */
  static getTransactionLogs(transactionId: string): TransactionLogEntry[] {
    try {
      const allLogs = JSON.parse(localStorage.getItem('transactionAuditLogs') || '{}');
      return allLogs[transactionId] || [];
    } catch {
      return [];
    }
  }

  static clearAllLogs(): void {
    localStorage.removeItem('transactionAuditLogs');
  }

  static systemLog(
    transactionId: string,
    action: string,
    description: string,
    details: any = {}
  ): void {
    this.log(transactionId, null, action, description, { ...details, system: true });
  }

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
