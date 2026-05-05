import React, { useState, useMemo } from 'react';
import {
  Building2,
  Settings,
  LogOut,
  Search,
  ChevronRight,
  Clock,
  CheckCircle2,
  Circle,
  Plus,
  LayoutDashboard,
  Home,
  DollarSign,
  ArrowLeft,
  Scale,
} from 'lucide-react';
import { Case, Organization, OrganizationUser } from '../../types/database';
import { useProperties } from '../../hooks/useProperties';
import { useCases } from '../../hooks/useCases';
import { useOrganizationsByType } from '../../hooks/useOrganization';
import { useTransactions } from '../../App';
import * as casesService from '../../services/cases.service';
import * as communicationsService from '../../services/communications.service';
import TransactionWizard from '../TransactionWizard';
import LoadingSpinner from '../ui/LoadingSpinner';

interface EstateAgentDashboardProps {
  user: OrganizationUser;
  organization: Organization;
  onLogout: () => void;
}

type NavPage = 'dashboard' | 'properties' | 'law-firms' | 'settings';

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

// --- Main Dashboard ---

const EstateAgentDashboard: React.FC<EstateAgentDashboardProps> = ({
  user,
  organization,
  onLogout,
}) => {
  const { properties, loading: propsLoading } = useProperties(organization.id);
  const { cases, loading: casesLoading } = useCases(organization.id);
  const { orgs: conveyancerOrgs } = useOrganizationsByType('conveyancer');
  const { addTransaction } = useTransactions();

  const [activePage, setActivePage] = useState<NavPage>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCase, setExpandedCase] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardTransactionId, setWizardTransactionId] = useState<string | null>(null);

  const formatCurrency = (amount: number) => `P ${amount.toLocaleString()}`;

  // Derive transactions from cases
  const transactions = useMemo(() => {
    return cases.map(c => {
      const phase = getTransactionPhase(c);
      const commission = (c.property?.price || 0) * 0.05;
      return { case_: c, phase, commission };
    });
  }, [cases]);

  const filteredTransactions = useMemo(() => {
    if (!searchTerm) return transactions;
    const q = searchTerm.toLowerCase();
    return transactions.filter(
      t =>
        t.case_.case_number.toLowerCase().includes(q) ||
        t.case_.client_name.toLowerCase().includes(q) ||
        t.case_.organization?.name?.toLowerCase().includes(q)
    );
  }, [transactions, searchTerm]);

  const stats = useMemo(() => {
    const total = transactions.length;
    const complete = transactions.filter(t => t.phase.step >= 3).length;
    const inProgress = transactions.filter(t => t.phase.step === 1 || t.phase.step === 2).length;
    const pending = transactions.filter(t => t.phase.step === 0).length;
    const totalCommission = transactions
      .filter(t => t.phase.step >= 3)
      .reduce((sum, t) => sum + t.commission, 0);
    return { total, complete, inProgress, pending, totalCommission, propertiesListed: properties.length };
  }, [transactions, properties]);

  const handleStartWizard = () => {
    const txnId = Math.random().toString(36).substring(2, 10).toUpperCase();
    setWizardTransactionId(txnId);

    addTransaction({
      id: txnId,
      type: 'buying',
      submissionDate: new Date().toISOString().split('T')[0],
      lastUpdate: new Date().toISOString(),
      status: 'Step 1: Agent Information',
      progress: 0,
      priority: 'medium',
      currentStep: 1,
      totalSteps: 7,
      stepName: 'Agent Information',
      isCompleted: false,
      isActive: true,
      lastActivityTime: new Date().toISOString(),
      buyerName: 'In Progress...',
      sellerName: 'In Progress...',
      propertyPrice: 0,
      nationality: 'Unknown',
      hasAgent: false,
      entityType: 'unknown',
      stepProgress: { 1: { stepName: 'Agent Information', isCompleted: false } },
      fullData: {},
    });

    setShowWizard(true);
  };

  if (propsLoading || casesLoading) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Full-screen wizard view
  if (showWizard) {
    return (
      <div className="min-h-screen bg-[#F8F7F4]">
        <header className="bg-[#0B1F3A]">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
            <div className="flex items-center justify-between h-14">
              <button
                onClick={() => setShowWizard(false)}
                className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </button>
              <span className="text-sm font-medium text-[#C8A14F]">New Transaction</span>
            </div>
          </div>
        </header>
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-6">
          <TransactionWizard
            transactionId={wizardTransactionId}
            mode="conveyancer"
            onComplete={() => setShowWizard(false)}
            lawFirms={conveyancerOrgs.map(o => ({ id: o.id, name: o.name }))}
            onSendToLawFirm={async (firmId, firmName) => {
              try {
                // Create a case under the conveyancer's organization
                const { case_ } = await casesService.createCaseWithTokens({
                  organization_id: firmId,
                  case_type: 'buying',
                  client_name: 'Via Estate Agent',
                  status: 'initiated',
                  priority: 'medium',
                  documents: [],
                  notes: `Submitted by ${organization.name} (Estate Agent)`,
                });

                // Send a communication to the conveyancer firm
                await communicationsService.sendMessage({
                  sender_organization_id: organization.id,
                  sender_user_id: user.id,
                  recipient_organization_id: firmId,
                  subject: `New transaction from ${organization.name} — ${case_.case_number}`,
                  message: `A new property transaction has been submitted by ${organization.name}.\n\nCase: ${case_.case_number}\nAgent: ${user.first_name} ${user.last_name}`,
                  case_id: case_.id,
                });
              } catch (err) {
                console.error('Failed to send to law firm:', err);
              }
            }}
          />
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard' as NavPage, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'properties' as NavPage, label: 'Properties', icon: Home },
    { id: 'law-firms' as NavPage, label: 'Law Firms', icon: Building2 },
    { id: 'settings' as NavPage, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      {/* Top Navigation */}
      <header className="bg-[#0B1F3A] border-b border-[#0B1F3A]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-[#C8A14F] flex items-center justify-center">
                  <Home className="h-4 w-4 text-white" />
                </div>
                <span className="text-white font-serif text-lg font-semibold tracking-tight">
                  {organization.name}
                </span>
              </div>

              <nav className="hidden md:flex items-center gap-1">
                {navItems.map(item => {
                  const Icon = item.icon;
                  const isActive = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActivePage(item.id)}
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
          <DashboardView
            stats={stats}
            transactions={filteredTransactions}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            expandedCase={expandedCase}
            onToggleCase={id => setExpandedCase(expandedCase === id ? null : id)}
            formatCurrency={formatCurrency}
            onNewTransaction={handleStartWizard}
          />
        )}

        {activePage === 'properties' && (
          <PropertiesPage properties={properties} formatCurrency={formatCurrency} />
        )}

        {activePage === 'law-firms' && (
          <LawFirmsPage firms={conveyancerOrgs} transactions={transactions} />
        )}

        {activePage === 'settings' && <SettingsPage user={user} organization={organization} />}
      </main>
    </div>
  );
};

// --- Dashboard View ---

interface TransactionItem {
  case_: Case;
  phase: { label: string; color: string; step: number };
  commission: number;
}

function DashboardView({
  stats,
  transactions,
  searchTerm,
  onSearchChange,
  expandedCase,
  onToggleCase,
  formatCurrency,
  onNewTransaction,
}: {
  stats: { total: number; complete: number; inProgress: number; pending: number; totalCommission: number; propertiesListed: number };
  transactions: TransactionItem[];
  searchTerm: string;
  onSearchChange: (v: string) => void;
  expandedCase: string | null;
  onToggleCase: (id: string) => void;
  formatCurrency: (n: number) => string;
  onNewTransaction: () => void;
}) {
  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#0B1F3A] tracking-tight">
            Transaction Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage property transactions and track progress
          </p>
        </div>
        <button
          onClick={onNewTransaction}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#C8A14F] text-white rounded-xl text-sm font-medium hover:bg-[#b8923f] transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          New Transaction
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Transactions" value={stats.total.toString()} accent="navy" />
        <StatCard label="In Progress" value={stats.inProgress.toString()} accent="amber" />
        <StatCard label="Complete" value={stats.complete.toString()} accent="emerald" />
        <StatCard label="Properties Listed" value={stats.propertiesListed.toString()} accent="slate" />
        <StatCard label="Commission Earned" value={formatCurrency(stats.totalCommission)} accent="gold" />
      </div>

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
              Start a new transaction using the wizard
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
  const { case_, phase, commission } = item;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-colors overflow-hidden">
      <button onClick={onToggle} className="w-full px-6 py-5 flex items-center gap-6 text-left">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold text-[#0B1F3A]">{case_.case_number}</p>
            <span className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full bg-${phase.color}-50 text-${phase.color}-700 border border-${phase.color}-200`}>
              {phase.label}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5 truncate">
            {case_.client_name}
            {case_.property?.address && (
              <span className="text-slate-400"> · {case_.property.address}</span>
            )}
          </p>
        </div>

        <div className="hidden lg:flex items-center gap-2">
          <PartyBadge label="Buyer" status={case_.buyer_status} />
          <PartyBadge label="Seller" status={case_.seller_status} />
        </div>

        {case_.property?.price ? (
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-[#0B1F3A]">{formatCurrency(case_.property.price)}</p>
            <p className="text-xs text-slate-400">Commission: {formatCurrency(commission)}</p>
          </div>
        ) : null}

        <div className="w-24 hidden md:block">
          <ProgressSteps step={phase.step} />
        </div>

        <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform flex-shrink-0 ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {expanded && (
        <div className="px-6 pb-6 pt-0 border-t border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5">
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

            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Details</p>
              <div className="text-sm text-slate-600 space-y-1">
                <p>Type: <span className="font-medium capitalize">{case_.case_type}</span></p>
                <p>Priority: <span className="font-medium capitalize">{case_.priority}</span></p>
                <p>Created: <span className="font-medium">{new Date(case_.created_at).toLocaleDateString()}</span></p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4 lg:hidden">
            <PartyBadge label="Buyer" status={case_.buyer_status} />
            <PartyBadge label="Seller" status={case_.seller_status} />
          </div>
        </div>
      )}
    </div>
  );
}

// --- Properties Page ---

function PropertiesPage({
  properties,
  formatCurrency,
}: {
  properties: any[];
  formatCurrency: (n: number) => string;
}) {
  const [search, setSearch] = useState('');
  const filtered = properties.filter(
    p => !search || p.title?.toLowerCase().includes(search.toLowerCase()) || p.address?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'available': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'under_offer': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'sold': return 'bg-slate-50 text-slate-600 border-slate-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-serif font-bold text-[#0B1F3A] tracking-tight">Properties</h1>
        <p className="text-sm text-slate-500 mt-1">Your property portfolio</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search properties..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#C8A14F]/30 focus:border-[#C8A14F]"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <Home className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No properties found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(property => (
            <div
              key={property.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-[#C8A14F]/30 hover:shadow-sm transition-all"
            >
              {property.images?.[0] && (
                <img
                  src={property.images[0]}
                  alt={property.title}
                  className="w-full h-40 object-cover"
                />
              )}
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-semibold text-[#0B1F3A] truncate">{property.title}</p>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${getStatusStyle(property.status)}`}>
                    {property.status?.replace('_', ' ')}
                  </span>
                </div>
                {property.address && (
                  <p className="text-xs text-slate-500 mb-3">{property.address}</p>
                )}
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold text-[#0B1F3A] font-serif">{formatCurrency(property.price)}</p>
                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    {property.bedrooms && <span>{property.bedrooms} bed</span>}
                    {property.bathrooms && <span>{property.bathrooms} bath</span>}
                    {property.size_sqm && <span>{property.size_sqm}m²</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
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

export default EstateAgentDashboard;
