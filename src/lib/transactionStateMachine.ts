export type TransactionStatus = 'initiated' | 'in_progress' | 'documents_uploaded' | 'under_review' | 'approved' | 'rejected' | 'completed' | 'cancelled';

const validTransitions: Record<TransactionStatus, TransactionStatus[]> = {
  initiated: ['in_progress', 'cancelled'],
  in_progress: ['documents_uploaded', 'cancelled'],
  documents_uploaded: ['under_review', 'cancelled'],
  under_review: ['approved', 'rejected', 'cancelled'],
  approved: ['completed', 'cancelled'],
  rejected: ['in_progress', 'cancelled'],
  completed: [],
  cancelled: [],
};

export function canTransition(current: TransactionStatus, next: TransactionStatus): boolean {
  return validTransitions[current]?.includes(next) ?? false;
}

export function getNextStatuses(current: TransactionStatus): TransactionStatus[] {
  return validTransitions[current] || [];
}

export function getStatusLabel(status: TransactionStatus): string {
  const labels: Record<TransactionStatus, string> = {
    initiated: 'Initiated',
    in_progress: 'In Progress',
    documents_uploaded: 'Documents Uploaded',
    under_review: 'Under Review',
    approved: 'Approved',
    rejected: 'Rejected',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  return labels[status] || status;
}
