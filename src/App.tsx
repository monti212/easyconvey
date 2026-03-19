import React, { useState, createContext, useContext, useRef, useEffect } from 'react';
import { LogIn, LogOut, ChevronDown, User, LayoutDashboard, Settings } from 'lucide-react';
import TransactionWizard from './components/TransactionWizard';
import WelcomePage from './components/WelcomePage';
import ConveyancerDashboard from './components/ConveyancerDashboard';
import ConveyancerLogin from './components/ConveyancerLogin';
import ConveyancerOverview from './components/ConveyancerOverview';
import EstateAgentDashboard from './components/dashboards/EstateAgentDashboard';
import FinancialInstitutionDashboard from './components/dashboards/FinancialInstitutionDashboard';
import OrganizationSelector from './components/OrganizationSelector';
import ClientWizard from './components/ClientWizard';
import LoadingSpinner from './components/ui/LoadingSpinner';
import { useAuth } from './hooks/useAuth';

// Enhanced Transaction Data with progress tracking
interface TransactionData {
  id: string;
  type: string;
  submissionDate: string;
  lastUpdate: string;
  status: string;
  progress: number;
  priority: string;
  currentStep: number;
  totalSteps: number;
  stepName: string;
  isCompleted: boolean;
  isActive: boolean;
  lastActivityTime: string;
  buyerName: string;
  sellerName: string;
  propertyPrice: number;
  nationality: string;
  isFirstTimeBuyer?: boolean;
  hasAgent: boolean;
  agentName?: string;
  agentCompany?: string;
  entityType: string;
  stepProgress: {
    [stepNumber: number]: {
      stepName: string;
      isCompleted: boolean;
      completedAt?: string;
      timeSpent?: number;
    }
  };
  fullData: any;
}

interface TransactionContextType {
  transactions: TransactionData[];
  addTransaction: (transaction: TransactionData) => void;
  updateTransaction: (id: string, updates: Partial<TransactionData>) => void;
  updateTransactionProgress: (id: string, currentStep: number, stepName: string, totalSteps: number) => void;
  markTransactionComplete: (id: string) => void;
  getTransaction: (id: string) => TransactionData | undefined;
  getActiveTransactions: () => TransactionData[];
  getCompletedTransactions: () => TransactionData[];
}

const TransactionContext = createContext<TransactionContextType | null>(null);

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within TransactionProvider');
  }
  return context;
};

function App() {
  const { session, orgUser, organization, orgMemberships, loading, signOut: authSignOut } = useAuth();

  const [started, setStarted] = useState(false);
  const [showConveyancerDashboard, setShowConveyancerDashboard] = useState(false);
  const [conveyancerData, setConveyancerData] = useState<any>(null);
  const [showPortalLogin, setShowPortalLogin] = useState(false);
  const [showConveyancerOverview, setShowConveyancerOverview] = useState(false);
  const [showConveyancerWizard, setShowConveyancerWizard] = useState(false);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [currentTransactionId, setCurrentTransactionId] = useState<string | null>(null);
  const [sharedTransactionData, setSharedTransactionData] = useState({
    transactionId: '',
    transactionType: '',
    isSharedLink: false,
    sharedPricing: null as {
      sellingPrice: string;
      valuationAmount: string;
      valuationDocument: string;
    } | null
  });
  const [clientShareToken, setClientShareToken] = useState<string | null>(null);
  const [clientShareRole, setClientShareRole] = useState<'buyer' | 'seller' | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isPortalLoggedIn = !!session && !!orgUser;

  // Transaction management functions
  const addTransaction = (transaction: TransactionData) => {
    setTransactions(prev => [...prev, transaction]);
  };

  const updateTransaction = (id: string, updates: Partial<TransactionData>) => {
    setTransactions(prev =>
      prev.map(transaction =>
        transaction.id === id
          ? { ...transaction, ...updates, lastUpdate: new Date().toISOString(), lastActivityTime: new Date().toISOString() }
          : transaction
      )
    );
  };

  const updateTransactionProgress = (id: string, currentStep: number, stepName: string, totalSteps: number) => {
    setTransactions(prev =>
      prev.map(transaction => {
        if (transaction.id === id) {
          const newStepProgress = { ...transaction.stepProgress };
          for (let i = 1; i < currentStep; i++) {
            if (newStepProgress[i]) {
              newStepProgress[i].isCompleted = true;
              if (!newStepProgress[i].completedAt) {
                newStepProgress[i].completedAt = new Date().toISOString();
              }
            }
          }
          newStepProgress[currentStep] = { stepName, isCompleted: false, completedAt: undefined };
          const progressPercentage = Math.round(((currentStep - 1) / totalSteps) * 100);
          return {
            ...transaction,
            currentStep,
            stepName,
            totalSteps,
            progress: progressPercentage,
            stepProgress: newStepProgress,
            lastUpdate: new Date().toISOString(),
            lastActivityTime: new Date().toISOString(),
            isActive: true,
            status: `Step ${currentStep}: ${stepName}`
          };
        }
        return transaction;
      })
    );
  };

  const markTransactionComplete = (id: string) => {
    setTransactions(prev =>
      prev.map(transaction =>
        transaction.id === id
          ? {
              ...transaction,
              isCompleted: true,
              isActive: false,
              progress: 100,
              status: 'Completed',
              lastUpdate: new Date().toISOString(),
              lastActivityTime: new Date().toISOString()
            }
          : transaction
      )
    );
  };

  const getTransaction = (id: string) => transactions.find(t => t.id === id);
  const getActiveTransactions = () => transactions.filter(t => t.isActive && !t.isCompleted);
  const getCompletedTransactions = () => transactions.filter(t => t.isCompleted);

  const handleStartTransaction = () => {
    const newTransactionId = Math.random().toString(36).substring(2, 10).toUpperCase();
    setCurrentTransactionId(newTransactionId);

    const newTransaction: TransactionData = {
      id: newTransactionId,
      type: 'unknown',
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
      fullData: {}
    };

    addTransaction(newTransaction);
    setStarted(true);
  };

  const handleSharedLink = (transactionId: string, transactionType: string, sharedPricing?: any) => {
    setSharedTransactionData({
      transactionId,
      transactionType,
      isSharedLink: true,
      sharedPricing: sharedPricing || null
    });
    setStarted(true);
  };

  const handleConveyancerDashboard = (transactionId: string, transactionData: any) => {
    setConveyancerData({ transactionId, buyerData: transactionData, sellerData: null });
    setShowConveyancerDashboard(true);
    setShowConveyancerOverview(false);
  };

  const handleStartNewTransaction = (caseId?: string) => {
    if (caseId) {
      // Use the Supabase case ID so the wizard updates the existing case
      setCurrentTransactionId(caseId);
      setStarted(true);
    } else {
      handleStartTransaction();
    }
    setShowConveyancerWizard(true);
    setShowConveyancerOverview(false);
    setShowConveyancerDashboard(false);
  };

  const handlePortalLogout = async () => {
    await authSignOut();
    setShowConveyancerOverview(false);
    setShowConveyancerDashboard(false);
    setConveyancerData(null);
  };

  // Check for shared link or conveyancer link in URL on app load
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

    // New share link format: ?case={token}&role=buyer|seller
    const caseToken = urlParams.get('case');
    const role = urlParams.get('role');
    if (caseToken && (role === 'buyer' || role === 'seller')) {
      setClientShareToken(caseToken);
      setClientShareRole(role);
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    // Legacy formats
    const conveyancerId = urlParams.get('conveyancer');
    const sharedData = urlParams.get('data');
    const transactionId = urlParams.get('transaction');
    const transactionType = urlParams.get('type');

    if (conveyancerId) {
      if (sharedData) {
        try {
          const parsedData = JSON.parse(decodeURIComponent(sharedData));
          handleConveyancerDashboard(conveyancerId, parsedData);
        } catch (e) {
          console.warn('Failed to parse conveyancer data:', e);
        }
      } else {
        handleConveyancerDashboard(conveyancerId, {});
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (transactionId && transactionType) {
      let parsedData = null;
      if (sharedData) {
        try {
          parsedData = JSON.parse(decodeURIComponent(sharedData));
        } catch (e) {
          console.warn('Failed to parse shared data:', e);
        }
      }
      handleSharedLink(transactionId, transactionType, parsedData);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-redirect to conveyancer overview on login
  React.useEffect(() => {
    if (isPortalLoggedIn && organization?.type === 'conveyancer' && !showConveyancerOverview && !showConveyancerDashboard) {
      setShowConveyancerOverview(true);
      setShowPortalLogin(false);
    }
    if (isPortalLoggedIn) {
      setShowPortalLogin(false);
    }
  }, [isPortalLoggedIn, organization]);

  const transactionContextValue: TransactionContextType = {
    transactions,
    addTransaction,
    updateTransaction,
    updateTransactionProgress,
    markTransactionComplete,
    getTransaction,
    getActiveTransactions,
    getCompletedTransactions
  };

  // Show loading while auth initializes
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading..." />
      </div>
    );
  }

  // User is logged in but belongs to multiple orgs — pick one
  if (session && orgMemberships.length > 1 && !orgUser) {
    return <OrganizationSelector />;
  }

  // Show appropriate dashboard based on user type
  if (isPortalLoggedIn && orgUser && organization) {
    if (organization.type === 'estate_agent') {
      return (
        <TransactionContext.Provider value={transactionContextValue}>
          <EstateAgentDashboard user={orgUser} organization={organization} onLogout={handlePortalLogout} />
        </TransactionContext.Provider>
      );
    }

    if (organization.type === 'financial_institution') {
      return (
        <TransactionContext.Provider value={transactionContextValue}>
          <FinancialInstitutionDashboard user={orgUser} organization={organization} onLogout={handlePortalLogout} />
        </TransactionContext.Provider>
      );
    }

    if (organization.type === 'conveyancer') {
      if (showConveyancerWizard && started) {
        return (
          <TransactionContext.Provider value={transactionContextValue}>
            <TransactionWizard
              transactionId={currentTransactionId}
              initialCaseId={currentTransactionId}
              onSharedLink={handleSharedLink}
              sharedTransactionData={sharedTransactionData}
              mode="conveyancer"
              onComplete={() => {
                setShowConveyancerWizard(false);
                setStarted(false);
              }}
            />
          </TransactionContext.Provider>
        );
      }

      if (showConveyancerDashboard && conveyancerData) {
        return (
          <TransactionContext.Provider value={transactionContextValue}>
            <ConveyancerDashboard
              transactionId={conveyancerData.transactionId}
              buyerData={conveyancerData.buyerData}
              sellerData={conveyancerData.sellerData}
              onBack={() => {
                setShowConveyancerDashboard(false);
                setConveyancerData(null);
                setShowConveyancerOverview(true);
              }}
            />
          </TransactionContext.Provider>
        );
      }

      // Default to overview for conveyancer users
      return (
        <TransactionContext.Provider value={transactionContextValue}>
          <ConveyancerOverview
            user={orgUser}
            onLogout={handlePortalLogout}
            onViewTransaction={handleConveyancerDashboard}
            onBack={() => setShowConveyancerOverview(false)}
            onStartNewTransaction={handleStartNewTransaction}
          />
        </TransactionContext.Provider>
      );
    }
  }

  if (showConveyancerDashboard && conveyancerData) {
    return (
      <TransactionContext.Provider value={transactionContextValue}>
        <ConveyancerDashboard
          transactionId={conveyancerData.transactionId}
          buyerData={conveyancerData.buyerData}
          sellerData={conveyancerData.sellerData}
          onBack={() => {
            setShowConveyancerDashboard(false);
            setConveyancerData(null);
          }}
        />
      </TransactionContext.Provider>
    );
  }

  if (showPortalLogin) {
    return <ConveyancerLogin onBack={() => setShowPortalLogin(false)} />;
  }

  return (
    <TransactionContext.Provider value={transactionContextValue}>
      <div className="min-h-screen bg-background">
        <header className="bg-white shadow-soft">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4 md:py-5">
              {/* Brand */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-secondary font-serif font-bold text-sm">M</span>
                </div>
                <span className="text-lg md:text-xl font-serif font-semibold text-primary tracking-tight">
                  Minchin & Kelly<span className="text-secondary">.</span>
                </span>
                {started && sharedTransactionData.isSharedLink && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    Shared: {sharedTransactionData.transactionId}
                  </span>
                )}
                {started && currentTransactionId && (
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Live: {currentTransactionId}
                  </span>
                )}
              </div>

              {/* Right side */}
              <div className="flex items-center space-x-3">
                {isPortalLoggedIn && orgUser && organization ? (
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setUserMenuOpen(prev => !prev)}
                      className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <span className="text-secondary font-semibold text-sm">
                          {orgUser.first_name?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="text-left hidden sm:block">
                        <p className="text-sm font-medium text-gray-900 leading-tight">
                          {orgUser.first_name} {orgUser.last_name}
                        </p>
                        <p className="text-xs text-gray-500 leading-tight capitalize">
                          {organization.type.replace(/_/g, ' ')}
                        </p>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {userMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-border overflow-hidden z-50 animate-fade-in">
                        {/* User info header */}
                        <div className="px-4 py-3 bg-primary/5 border-b border-border">
                          <p className="text-sm font-semibold text-primary">{orgUser.first_name} {orgUser.last_name}</p>
                          <p className="text-xs text-gray-500">{organization.name}</p>
                          <span className="inline-block mt-1 px-2 py-0.5 bg-secondary/15 text-secondary text-xs rounded-full font-medium capitalize">
                            {orgUser.role.replace(/_/g, ' ')}
                          </span>
                        </div>

                        {/* Menu items */}
                        <div className="py-1">
                          {organization.type === 'conveyancer' && (
                            <button
                              onClick={() => { setShowConveyancerOverview(true); setUserMenuOpen(false); }}
                              className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors"
                            >
                              <LayoutDashboard className="h-4 w-4 mr-3 text-secondary" />
                              Dashboard
                            </button>
                          )}
                          <button
                            className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors"
                          >
                            <User className="h-4 w-4 mr-3 text-secondary" />
                            My Profile
                          </button>
                          <button
                            className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors"
                          >
                            <Settings className="h-4 w-4 mr-3 text-secondary" />
                            Settings
                          </button>
                        </div>

                        <div className="border-t border-border py-1">
                          <button
                            onClick={() => { handlePortalLogout(); setUserMenuOpen(false); }}
                            className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut className="h-4 w-4 mr-3" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setShowPortalLogin(true)}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
          {clientShareToken && clientShareRole ? (
            <ClientWizard
              token={clientShareToken}
              role={clientShareRole}
              onComplete={() => {
                setClientShareToken(null);
                setClientShareRole(null);
              }}
            />
          ) : !started ? (
            <WelcomePage onStart={() => setShowPortalLogin(true)} />
          ) : (
            <TransactionWizard
              transactionId={currentTransactionId}
              onSharedLink={handleSharedLink}
              sharedTransactionData={sharedTransactionData}
            />
          )}
        </main>

        <footer className="bg-white mt-auto border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6 md:py-8">
              <div className="flex justify-center gap-6 mb-4">
                <span className="text-sm text-gray-400 hover:text-secondary transition-colors cursor-pointer">Privacy Policy</span>
                <span className="text-sm text-gray-400 hover:text-secondary transition-colors cursor-pointer">Terms of Service</span>
                <span className="text-sm text-gray-400 hover:text-secondary transition-colors cursor-pointer">Contact</span>
              </div>
              <div className="section-divider mb-4" />
              <p className="text-center text-xs text-gray-400">
                &copy; {new Date().getFullYear()} Minchin & Kelly. All rights reserved.
              </p>
            </div>
          </div>
        </footer>

      </div>
    </TransactionContext.Provider>
  );
}

export default App;
