import React, { useState, useMemo } from 'react';
import {
  Send,
  Building2,
  Settings,
  LogOut,
  Search,
  ChevronRight,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Circle,
  Eye,
  Plus,
  LayoutDashboard,
  X,
  Scale,
  MapPin,
  User,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { Loan, Case, Organization, OrganizationUser } from '../../types/database';
import { useLoans } from '../../hooks/useLoans';
import { useCases } from '../../hooks/useCases';
import { useOrganizationsByType } from '../../hooks/useOrganization';
import * as casesService from '../../services/cases.service';
import * as communicationsService from '../../services/communications.service';
import LoadingSpinner from '../ui/LoadingSpinner';

interface FinancialInstitutionDashboardProps {
  user: OrganizationUser;
  organization: Organization;
  onLogout: () => void;
}

type NavPage = 'dashboard' | 'law-firms' | 'send-transaction' | 'settings';

// --- Status helpers ---

function getTransactionPhase(caseData: Case): { label: string; color: string; step: number } {
  if (caseData.status === 'completed') return { label: 'Complete', color: 'emerald', step: 4 };
  if (caseData.buyer_status === 'completed' && caseData.seller_status === 'completed')
    return { label: 'Both Parties Complete', color: 'emerald', step: 3 };
  if (caseData.buyer_status === 'completed' || caseData.seller_status === 'completed')
    return { label: 'Partially Complete', color: 'amber', step: 2 };
  if (caseData.status === 'in_progress') return { label: 'Links Sent', color: 'sky', step: 1 };
  return { label: 'Initiated', color: 'slate', step: 0 };
}

function PartyBadge({ label, status }: { label: string; status?: 'pending' | 'completed' }) {
  if (status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5">
        <CheckCircle2 className="h-3 w-3" /> {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200 rounded-full px-2.5 py-0.5">
      <Circle className="h-3 w-3" /> {label}
    </span>
  );
}

// --- Progress Bar ---

function ProgressSteps({ step }: { step: number }) {
  const steps = ['Initiated', 'Links Sent', 'Partial', 'Complete'];
  return (
    <div className="flex items-center gap-1 w-full">
      {steps.map((s, i) => (
        <div key={s} className="flex-1">
          <div
            className={`h-1 rounded-full transition-colors ${
              i <= step ? 'bg-[#C8A14F]' : 'bg-slate-200'
            }`}
          />
        </div>
      ))}
    </div>
  );
}

// --- Send Transaction Modal ---

function SendTransactionModal({
  loans,
  onClose,
  onSubmit,
  sending,
  sendError,
}: {
  loans: Loan[];
  onClose: () => void;
  onSubmit: (data: any) => void;
  sending?: boolean;
  sendError?: string | null;
}) {
  const approvedLoans = loans.filter(l => l.status === 'approved');
  const { orgs: conveyancerOrgs } = useOrganizationsByType('conveyancer');
  const [selectedLoan, setSelectedLoan] = useState('');
  const [selectedFirm, setSelectedFirm] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [transactionType, setTransactionType] = useState('buying');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loan = approvedLoans.find(l => l.id === selectedLoan);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!selectedLoan) newErrors.loan = 'Select a loan';
    if (!selectedFirm) newErrors.firm = 'Select a law firm';
    if (!propertyAddress.trim()) newErrors.address = 'Property address required';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    onSubmit({
      loanId: selectedLoan,
      conveyancerFirmId: selectedFirm,
      propertyAddress,
      transactionType,
      specialInstructions,
      propertyValue: loan?.loan_amount.toString() || '0',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-[#0B1F3A] px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white font-serif">Send Transaction</h2>
            <p className="text-sm text-slate-300 mt-0.5">Submit an approved loan to a law firm</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Approved Loan</label>
            <select
              value={selectedLoan}
              onChange={e => setSelectedLoan(e.target.value)}
              className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-[#C8A14F]/40 focus:border-[#C8A14F] ${errors.loan ? 'border-red-300' : 'border-slate-300'}`}
            >
              <option value="">Select a loan...</option>
              {approvedLoans.map(l => (
                <option key={l.id} value={l.id}>
                  {l.application_number} — {l.applicant_name} — P {l.loan_amount.toLocaleString()}
                </option>
              ))}
            </select>
            {errors.loan && <p className="text-xs text-red-500 mt-1">{errors.loan}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              <Building2 className="h-3.5 w-3.5 inline mr-1 -mt-0.5" /> Law Firm
            </label>
            <select
              value={selectedFirm}
              onChange={e => setSelectedFirm(e.target.value)}
              className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-[#C8A14F]/40 focus:border-[#C8A14F] ${errors.firm ? 'border-red-300' : 'border-slate-300'}`}
            >
              <option value="">Select a firm...</option>
              {conveyancerOrgs.map(o => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
            {errors.firm && <p className="text-xs text-red-500 mt-1">{errors.firm}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <MapPin className="h-3.5 w-3.5 inline mr-1 -mt-0.5" /> Property Address
              </label>
              <input
                type="text"
                value={propertyAddress}
                onChange={e => setPropertyAddress(e.target.value)}
                placeholder="Block 8, Plot 123, Gaborone"
                className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-[#C8A14F]/40 focus:border-[#C8A14F] ${errors.address ? 'border-red-300' : 'border-slate-300'}`}
              />
              {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Transaction Type</label>
              <select
                value={transactionType}
                onChange={e => setTransactionType(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#C8A14F]/40 focus:border-[#C8A14F]"
              >
                <option value="buying">Buying</option>
                <option value="selling">Selling</option>
                <option value="refinancing">Refinancing</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              <FileText className="h-3.5 w-3.5 inline mr-1 -mt-0.5" /> Special Instructions
            </label>
            <textarea
              value={specialInstructions}
              onChange={e => setSpecialInstructions(e.target.value)}
              rows={2}
              placeholder="Any notes for the conveyancer..."
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#C8A14F]/40 focus:border-[#C8A14F]"
            />
          </div>

          {loan && (
            <div className="bg-[#0B1F3A]/5 border border-[#0B1F3A]/10 rounded-lg p-4">
              <p className="text-xs font-medium text-[#0B1F3A] uppercase tracking-wide mb-2">Loan Summary</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-slate-500">Applicant:</span> <span className="font-medium text-slate-800">{loan.applicant_name}</span></div>
                <div><span className="text-slate-500">Amount:</span> <span className="font-medium text-slate-800">P {loan.loan_amount.toLocaleString()}</span></div>
                <div><span className="text-slate-500">Rate:</span> <span className="font-medium text-slate-800">{loan.interest_rate}%</span></div>
                <div><span className="text-slate-500">Term:</span> <span className="font-medium text-slate-800">{loan.term_months} months</span></div>
              </div>
            </div>
          )}

          {sendError && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-700">{sendError}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={sending}
              className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="flex-1 px-4 py-2.5 bg-[#C8A14F] text-white rounded-lg text-sm font-medium hover:bg-[#b8923f] transition-colors disabled:opacity-50"
            >
              {sending ? 'Sending...' : 'Send to Law Firm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Main Dashboard ---

const FinancialInstitutionDashboard: React.FC<FinancialInstitutionDashboardProps> = ({
  user,
  organization,
  onLogout,
}) => {
  const { loans, loading: loansLoading, update: updateLoan } = useLoans(organization.id);
  const { cases, loading: casesLoading } = useCases(organization.id);
  const { orgs: conveyancerOrgs } = useOrganizationsByType('conveyancer');

  const [activePage, setActivePage] = useState<NavPage>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSendModal, setShowSendModal] = useState(false);
  const [expandedCase, setExpandedCase] = useState<string | null>(null);

  const formatCurrency = (amount: number) => `P ${amount.toLocaleString()}`;

  // Derive transactions from cases linked to this bank's loans
  const transactions = useMemo(() => {
    return cases
      .filter(c => c.case_type === 'buying' || c.property_id)
      .map(c => {
        const loan = loans.find(l => l.case_id === c.id);
        const phase = getTransactionPhase(c);
        return { case_: c, loan, phase };
      });
  }, [cases, loans]);

  const filteredTransactions = useMemo(() => {
    if (!searchTerm) return transactions;
    const q = searchTerm.toLowerCase();
    return transactions.filter(
      t =>
        t.case_.case_number.toLowerCase().includes(q) ||
        t.case_.client_name.toLowerCase().includes(q) ||
        t.loan?.applicant_name.toLowerCase().includes(q) ||
        t.case_.organization?.name?.toLowerCase().includes(q)
    );
  }, [transactions, searchTerm]);

  const stats = useMemo(() => {
    const total = transactions.length;
    const complete = transactions.filter(t => t.phase.step >= 3).length;
    const inProgress = transactions.filter(t => t.phase.step === 1 || t.phase.step === 2).length;
    const pending = transactions.filter(t => t.phase.step === 0).length;
    const totalValue = loans.reduce((sum, l) => sum + l.loan_amount, 0);
    const approvedReady = loans.filter(l => l.status === 'approved').length;
    return { total, complete, inProgress, pending, totalValue, approvedReady };
  }, [transactions, loans]);

  const [sendError, setSendError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const handleSendTransaction = async (data: any) => {
    const loan = loans.find(l => l.id === data.loanId);
    if (!loan) return;

    setSending(true);
    setSendError(null);

    try {
      // 1. Create a case under the conveyancer's organization
      const { case_, buyerToken, sellerToken } = await casesService.createCaseWithTokens({
        organization_id: data.conveyancerFirmId,
        case_type: data.transactionType,
        client_name: loan.applicant_name,
        status: 'initiated',
        priority: 'medium',
        documents: [],
        notes: data.specialInstructions || undefined,
      });

      // 2. Link the loan to the new case and mark as disbursed
      await updateLoan(loan.id, { status: 'disbursed', case_id: case_.id });

      // 3. Send a communication to the conveyancer firm
      await communicationsService.sendMessage({
        sender_organization_id: organization.id,
        sender_user_id: user.id,
        recipient_organization_id: data.conveyancerFirmId,
        subject: `New transaction: ${loan.applicant_name} — ${case_.case_number}`,
        message: `A new ${data.transactionType} transaction has been submitted for ${loan.applicant_name}.\n\nLoan: ${loan.application_number}\nAmount: P ${loan.loan_amount.toLocaleString()}\nProperty: ${data.propertyAddress}\n\n${data.specialInstructions ? `Instructions: ${data.specialInstructions}` : ''}`,
        case_id: case_.id,
        loan_id: loan.id,
      });

      setShowSendModal(false);
    } catch (err) {
      console.error('Failed to send transaction:', err);
      setSendError('Failed to send transaction. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (loansLoading || casesLoading) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard' as NavPage, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'law-firms' as NavPage, label: 'Law Firms', icon: Building2 },
    { id: 'send-transaction' as NavPage, label: 'Send Transaction', icon: Send },
    { id: 'settings' as NavPage, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      {/* Top Navigation */}
      <header className="bg-[#0B1F3A] border-b border-[#0B1F3A]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="flex items-center justify-between h-16">
            {/* Brand */}
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-[#C8A14F] flex items-center justify-center">
                  <Scale className="h-4 w-4 text-white" />
                </div>
                <span className="text-white font-serif text-lg font-semibold tracking-tight">
                  {organization.name}
                </span>
              </div>

              {/* Nav Links */}
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map(item => {
                  const Icon = item.icon;
                  const isActive = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.id === 'send-transaction') {
                          setShowSendModal(true);
                        } else {
                          setActivePage(item.id);
                        }
                      }}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-white/10 text-[#C8A14F]'
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* User */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-xs text-slate-400 capitalize">{user.role.replace('_', ' ')}</p>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white border border-slate-600 hover:border-slate-400 rounded-lg transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-6 lg:px-10 py-8">
        {activePage === 'dashboard' && (
          <DashboardPage
            stats={stats}
            transactions={filteredTransactions}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            expandedCase={expandedCase}
            onToggleCase={id => setExpandedCase(expandedCase === id ? null : id)}
            formatCurrency={formatCurrency}
            onSendTransaction={() => setShowSendModal(true)}
          />
        )}

        {activePage === 'law-firms' && (
          <LawFirmsPage firms={conveyancerOrgs} transactions={transactions} />
        )}

        {activePage === 'settings' && <SettingsPage user={user} organization={organization} />}
      </main>

      {showSendModal && (
        <SendTransactionModal
          loans={loans}
          onClose={() => { setShowSendModal(false); setSendError(null); }}
          onSubmit={handleSendTransaction}
          sending={sending}
          sendError={sendError}
        />
      )}
    </div>
  );
};

// --- Dashboard Page ---

interface TransactionItem {
  case_: Case;
  loan?: Loan;
  phase: { label: string; color: string; step: number };
}

function DashboardPage({
  stats,
  transactions,
  searchTerm,
  onSearchChange,
  expandedCase,
  onToggleCase,
  formatCurrency,
  onSendTransaction,
}: {
  stats: { total: number; complete: number; inProgress: number; pending: number; totalValue: number; approvedReady: number };
  transactions: TransactionItem[];
  searchTerm: string;
  onSearchChange: (v: string) => void;
  expandedCase: string | null;
  onToggleCase: (id: string) => void;
  formatCurrency: (n: number) => string;
  onSendTransaction: () => void;
}) {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#0B1F3A] tracking-tight">
            Transaction Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor all transactions sent to law firms
          </p>
        </div>
        <button
          onClick={onSendTransaction}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#C8A14F] text-white rounded-xl text-sm font-medium hover:bg-[#b8923f] transition-colors shadow-sm"
        >
          <Send className="h-4 w-4" />
          New Transaction
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Total Transactions"
          value={stats.total.toString()}
          accent="navy"
        />
        <StatCard
          label="In Progress"
          value={stats.inProgress.toString()}
          accent="amber"
        />
        <StatCard
          label="Complete"
          value={stats.complete.toString()}
          accent="emerald"
        />
        <StatCard
          label="Awaiting Action"
          value={stats.pending.toString()}
          accent="slate"
        />
        <StatCard
          label="Portfolio Value"
          value={formatCurrency(stats.totalValue)}
          accent="gold"
        />
      </div>

      {stats.approvedReady > 0 && (
        <div className="bg-[#C8A14F]/10 border border-[#C8A14F]/20 rounded-xl px-5 py-3.5 flex items-center justify-between">
          <p className="text-sm text-[#0B1F3A]">
            <span className="font-semibold">{stats.approvedReady} approved loan{stats.approvedReady !== 1 ? 's' : ''}</span>{' '}
            ready to send to a law firm
          </p>
          <button
            onClick={onSendTransaction}
            className="text-sm font-medium text-[#C8A14F] hover:text-[#b8923f] flex items-center gap-1"
          >
            Send now <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search by case, client, or firm..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#C8A14F]/30 focus:border-[#C8A14F] transition-colors"
        />
      </div>

      {/* Transaction List */}
      <div className="space-y-3">
        {transactions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
            <Scale className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No transactions yet</p>
            <p className="text-slate-400 text-xs mt-1">
              Send an approved loan to a law firm to get started
            </p>
          </div>
        ) : (
          transactions.map(t => (
            <TransactionCard
              key={t.case_.id}
              item={t}
              expanded={expandedCase === t.case_.id}
              onToggle={() => onToggleCase(t.case_.id)}
              formatCurrency={formatCurrency}
            />
          ))
        )}
      </div>
    </div>
  );
}

// --- Stat Card ---

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  const borderColors: Record<string, string> = {
    navy: 'border-l-[#0B1F3A]',
    amber: 'border-l-amber-400',
    emerald: 'border-l-emerald-500',
    slate: 'border-l-slate-400',
    gold: 'border-l-[#C8A14F]',
  };

  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-5 border-l-4 ${borderColors[accent] || 'border-l-slate-300'}`}>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold text-[#0B1F3A] mt-1.5 font-serif">{value}</p>
    </div>
  );
}

// --- Transaction Card ---

function TransactionCard({
  item,
  expanded,
  onToggle,
  formatCurrency,
}: {
  item: TransactionItem;
  expanded: boolean;
  onToggle: () => void;
  formatCurrency: (n: number) => string;
}) {
  const { case_, loan, phase } = item;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-colors overflow-hidden">
      {/* Header row */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-5 flex items-center gap-6 text-left"
      >
        {/* Case info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold text-[#0B1F3A]">{case_.case_number}</p>
            <span className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full bg-${phase.color}-50 text-${phase.color}-700 border border-${phase.color}-200`}>
              {phase.label}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5 truncate">
            {case_.client_name}
            {case_.organization?.name && (
              <span className="text-slate-400"> · {case_.organization.name}</span>
            )}
          </p>
        </div>

        {/* Parties */}
        <div className="hidden lg:flex items-center gap-2">
          <PartyBadge label="Buyer" status={case_.buyer_status} />
          <PartyBadge label="Seller" status={case_.seller_status} />
        </div>

        {/* Amount */}
        {loan && (
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-[#0B1F3A]">{formatCurrency(loan.loan_amount)}</p>
            <p className="text-xs text-slate-400">{loan.interest_rate}% · {loan.term_months}mo</p>
          </div>
        )}

        {/* Progress */}
        <div className="w-24 hidden md:block">
          <ProgressSteps step={phase.step} />
        </div>

        <ChevronRight
          className={`h-4 w-4 text-slate-400 transition-transform flex-shrink-0 ${expanded ? 'rotate-90' : ''}`}
        />
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-6 pb-6 pt-0 border-t border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5">
            {/* Buyer */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Buyer Status</p>
              <div className="flex items-center gap-2">
                {case_.buyer_status === 'completed' ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  <Clock className="h-5 w-5 text-slate-400" />
                )}
                <span className={`text-sm font-medium ${case_.buyer_status === 'completed' ? 'text-emerald-700' : 'text-slate-600'}`}>
                  {case_.buyer_status === 'completed' ? 'Information Submitted' : 'Awaiting Response'}
                </span>
              </div>
            </div>

            {/* Seller */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Seller Status</p>
              <div className="flex items-center gap-2">
                {case_.seller_status === 'completed' ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  <Clock className="h-5 w-5 text-slate-400" />
                )}
                <span className={`text-sm font-medium ${case_.seller_status === 'completed' ? 'text-emerald-700' : 'text-slate-600'}`}>
                  {case_.seller_status === 'completed' ? 'Information Submitted' : 'Awaiting Response'}
                </span>
              </div>
            </div>

            {/* Case Details */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Details</p>
              <div className="text-sm text-slate-600 space-y-1">
                <p>Type: <span className="font-medium capitalize">{case_.case_type}</span></p>
                <p>Priority: <span className="font-medium capitalize">{case_.priority}</span></p>
                <p>Created: <span className="font-medium">{new Date(case_.created_at).toLocaleDateString()}</span></p>
              </div>
            </div>
          </div>

          {/* Mobile party badges */}
          <div className="flex items-center gap-2 mt-4 lg:hidden">
            <PartyBadge label="Buyer" status={case_.buyer_status} />
            <PartyBadge label="Seller" status={case_.seller_status} />
          </div>
        </div>
      )}
    </div>
  );
}

// --- Law Firms Page ---

function LawFirmsPage({
  firms,
  transactions,
}: {
  firms: Organization[];
  transactions: TransactionItem[];
}) {
  const [search, setSearch] = useState('');

  const filteredFirms = firms.filter(
    f => !search || f.name.toLowerCase().includes(search.toLowerCase())
  );

  const firmStats = (firmName: string) => {
    const t = transactions.filter(tr => tr.case_.organization?.name === firmName);
    return {
      total: t.length,
      complete: t.filter(tr => tr.phase.step >= 3).length,
      active: t.filter(tr => tr.phase.step > 0 && tr.phase.step < 3).length,
    };
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-serif font-bold text-[#0B1F3A] tracking-tight">Law Firms</h1>
        <p className="text-sm text-slate-500 mt-1">
          Conveyancing firms registered on the platform
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search firms..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#C8A14F]/30 focus:border-[#C8A14F]"
        />
      </div>

      {filteredFirms.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <Building2 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No law firms found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredFirms.map(firm => {
            const s = firmStats(firm.name);
            return (
              <div
                key={firm.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-[#C8A14F]/30 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="h-11 w-11 rounded-xl bg-[#0B1F3A]/5 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-5 w-5 text-[#0B1F3A]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0B1F3A] truncate">{firm.name}</p>
                    {firm.email && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{firm.email}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-100">
                  <div className="text-center">
                    <p className="text-lg font-bold text-[#0B1F3A]">{s.total}</p>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Total</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-amber-500">{s.active}</p>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Active</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-emerald-500">{s.complete}</p>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Done</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// --- Settings Page ---

function SettingsPage({ user, organization }: { user: OrganizationUser; organization: Organization }) {
  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-serif font-bold text-[#0B1F3A] tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Account and organization preferences</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
        <div className="p-6">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-4">Organization</p>
          <div className="space-y-3">
            <SettingRow label="Name" value={organization.name} />
            <SettingRow label="Email" value={organization.email} />
            {organization.phone && <SettingRow label="Phone" value={organization.phone} />}
            {organization.registration_number && (
              <SettingRow label="Registration" value={organization.registration_number} />
            )}
          </div>
        </div>

        <div className="p-6">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-4">Your Account</p>
          <div className="space-y-3">
            <SettingRow label="Name" value={`${user.first_name} ${user.last_name}`} />
            <SettingRow label="Email" value={user.email} />
            <SettingRow label="Role" value={user.role.replace('_', ' ')} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-sm font-medium text-[#0B1F3A] capitalize">{value}</p>
    </div>
  );
}

export default FinancialInstitutionDashboard;
