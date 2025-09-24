import React, { useState, createContext, useContext } from 'react';
import { ArrowRight, Upload, CheckCircle, AlertCircle, User, Users, Mail, Phone, LogIn, LogOut } from 'lucide-react';
import TransactionWizard from './components/TransactionWizard';
import WelcomePage from './components/WelcomePage';
import ConveyancerDashboard from './components/ConveyancerDashboard';
import ConveyancerLogin from './components/ConveyancerLogin';
import ConveyancerOverview from './components/ConveyancerOverview';
import EstateAgentDashboard from './components/dashboards/EstateAgentDashboard';
import FinancialInstitutionDashboard from './components/dashboards/FinancialInstitutionDashboard';
import { Organization, OrganizationUser } from './types/database';

// Enhanced Transaction Data with progress tracking
interface TransactionData {
  id: string;
  type: string;
  submissionDate: string;
  lastUpdate: string;
  status: string;
  progress: number;
  priority: string;
  
  // Progress tracking
  currentStep: number;
  totalSteps: number;
  stepName: string;
  isCompleted: boolean;
  isActive: boolean; // Whether user is currently in the transaction
  lastActivityTime: string;
  
  // Buyer/Seller Data
  buyerName: string;
  sellerName: string;
  propertyPrice: number;
  nationality: string;
  isFirstTimeBuyer?: boolean;
  hasAgent: boolean;
  agentName?: string;
  agentCompany?: string;
  entityType: string;
  
  // Step-by-step progress tracking
  stepProgress: {
    [stepNumber: number]: {
      stepName: string;
      isCompleted: boolean;
      completedAt?: string;
      timeSpent?: number; // in seconds
    }
  };
  
  // Complete transaction data
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
  const [started, setStarted] = useState(false);
  const [showConveyancerDashboard, setShowConveyancerDashboard] = useState(false);
  const [conveyancerData, setConveyancerData] = useState<any>(null);
  const [showPortalLogin, setShowPortalLogin] = useState(false);
  const [isPortalLoggedIn, setIsPortalLoggedIn] = useState(false);
  const [portalUser, setPortalUser] = useState<OrganizationUser | null>(null);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [showConveyancerOverview, setShowConveyancerOverview] = useState(false);
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

  // Mock organizations data
  const mockOrganizations: Organization[] = [
    {
      id: 'org-1',
      name: 'OrionX Legal Services',
      type: 'conveyancer',
      email: 'info@orionxlegal.co.bw',
      phone: '+267 123 4567',
      registration_number: 'LAW001',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'org-2',
      name: 'Premium Properties Ltd',
      type: 'estate_agent',
      email: 'info@premiumproperties.co.bw',
      phone: '+267 234 5678',
      registration_number: 'REA002',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'org-3',
      name: 'Capital Bank Botswana',
      type: 'financial_institution',
      email: 'info@capitalbank.co.bw',
      phone: '+267 345 6789',
      registration_number: 'BANK003',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

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
          
          // Mark previous steps as completed
          for (let i = 1; i < currentStep; i++) {
            if (newStepProgress[i]) {
              newStepProgress[i].isCompleted = true;
              if (!newStepProgress[i].completedAt) {
                newStepProgress[i].completedAt = new Date().toISOString();
              }
            }
          }
          
          // Update current step
          newStepProgress[currentStep] = {
            stepName,
            isCompleted: false,
            completedAt: undefined
          };
          
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

  const getTransaction = (id: string) => {
    return transactions.find(t => t.id === id);
  };

  const getActiveTransactions = () => {
    return transactions.filter(t => t.isActive && !t.isCompleted);
  };

  const getCompletedTransactions = () => {
    return transactions.filter(t => t.isCompleted);
  };

  // Create new transaction when user starts the process
  const handleStartTransaction = () => {
    const newTransactionId = Math.random().toString(36).substring(2, 10).toUpperCase();
    setCurrentTransactionId(newTransactionId);
    
    const newTransaction: TransactionData = {
      id: newTransactionId,
      type: 'unknown', // Will be updated when user selects type
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
      
      stepProgress: {
        1: {
          stepName: 'Agent Information',
          isCompleted: false
        }
      },
      
      fullData: {}
    };
    
    addTransaction(newTransaction);
    setStarted(true);
  };

  // Function to handle shared link access
  const handleSharedLink = (transactionId: string, transactionType: string, sharedPricing?: any) => {
    setSharedTransactionData({
      transactionId,
      transactionType,
      isSharedLink: true,
      sharedPricing: sharedPricing || null
    });
    setStarted(true); // Start the wizard directly
  };

  // Function to handle conveyancer dashboard access
  const handleConveyancerDashboard = (transactionId: string, transactionData: any) => {
    setConveyancerData({
      transactionId,
      buyerData: transactionData,
      sellerData: null // In a real app, this would come from the database
    });
    setShowConveyancerDashboard(true);
  };

  // Enhanced portal login function with organization type and role
  const handlePortalLogin = (email: string, password: string, organizationType: string, loginRole: string) => {
    // Demo password check (in production, this would be proper authentication)
    const validPasswords = ['demo123', 'Templerun2@'];
    
    if (!validPasswords.includes(password)) {
      return false;
    }

    // Find the appropriate organization based on organization type
    const organization = mockOrganizations.find(org => org.type === organizationType);
    
    if (organization) {
      const user: OrganizationUser = {
        id: `user-${Math.random().toString(36).substring(2, 9)}`,
        organization_id: organization.id,
        email: email,
        first_name: email.includes('admin') ? 'Admin' : 'Staff',
        last_name: 'User',
        role: loginRole as 'super_admin' | 'admin' | 'user' | 'viewer',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
        organization: organization
      };

      setIsPortalLoggedIn(true);
      setPortalUser(user);
      setCurrentOrganization(organization);
      setShowPortalLogin(false);
      
      // Smart redirect based on organization type and role
      if (organizationType === 'conveyancer') {
        setShowConveyancerOverview(true);
      }
      // Estate agents and financial institutions go directly to their respective dashboards
      
      return true;
    }
    
    return false;
  };

  // Function to handle portal logout
  const handlePortalLogout = () => {
    setIsPortalLoggedIn(false);
    setPortalUser(null);
    setCurrentOrganization(null);
    setShowConveyancerOverview(false);
    setShowConveyancerDashboard(false);
    setConveyancerData(null);
  };

  // Check for shared link or conveyancer link in URL on app load
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const transactionId = urlParams.get('transaction');
    const transactionType = urlParams.get('type');
    const sharedData = urlParams.get('data');
    const conveyancerId = urlParams.get('conveyancer');
    
    if (conveyancerId && sharedData) {
      // Handle conveyancer dashboard access
      try {
        const parsedData = JSON.parse(decodeURIComponent(sharedData));
        handleConveyancerDashboard(conveyancerId, parsedData);
      } catch (e) {
        console.warn('Failed to parse conveyancer data:', e);
      }
      // Clean up URL parameters after processing
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (transactionId && transactionType) {
      // Handle shared transaction link
      let parsedData = null;
      if (sharedData) {
        try {
          parsedData = JSON.parse(decodeURIComponent(sharedData));
        } catch (e) {
          console.warn('Failed to parse shared data:', e);
        }
      }
      
      handleSharedLink(transactionId, transactionType, parsedData);
      // Clean up URL parameters after processing
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

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

  // Show appropriate dashboard based on user type
  if (isPortalLoggedIn && portalUser && currentOrganization) {
    // Estate Agent Dashboard
    if (currentOrganization.type === 'estate_agent') {
      return (
        <TransactionContext.Provider value={transactionContextValue}>
          <EstateAgentDashboard
            user={portalUser}
            organization={currentOrganization}
            onLogout={handlePortalLogout}
          />
        </TransactionContext.Provider>
      );
    }

    // Financial Institution Dashboard
    if (currentOrganization.type === 'financial_institution') {
      return (
        <TransactionContext.Provider value={transactionContextValue}>
          <FinancialInstitutionDashboard
            user={portalUser}
            organization={currentOrganization}
            onLogout={handlePortalLogout}
          />
        </TransactionContext.Provider>
      );
    }

    // Conveyancer Overview (main dashboard)
    if (currentOrganization.type === 'conveyancer' && showConveyancerOverview) {
      return (
        <TransactionContext.Provider value={transactionContextValue}>
          <ConveyancerOverview
            user={portalUser}
            onLogout={handlePortalLogout}
            onViewTransaction={handleConveyancerDashboard}
            onBack={() => setShowConveyancerOverview(false)}
          />
        </TransactionContext.Provider>
      );
    }
  }

  // If showing individual transaction dashboard
  if (showConveyancerDashboard && conveyancerData) {
    return (
      <TransactionContext.Provider value={transactionContextValue}>
        <ConveyancerDashboard
          transactionId={conveyancerData.transactionId}
          buyerData={conveyancerData.buyerData}
          sellerData={conveyancerData.sellerData}
          onBack={() => {
            if (isPortalLoggedIn && portalUser?.organization?.type === 'conveyancer') {
              setShowConveyancerDashboard(false);
              setConveyancerData(null);
              setShowConveyancerOverview(true);
            } else {
              setShowConveyancerDashboard(false);
              setConveyancerData(null);
            }
          }}
        />
      </TransactionContext.Provider>
    );
  }

  // If showing portal login
  if (showPortalLogin) {
    return (
      <ConveyancerLogin
        onLogin={handlePortalLogin}
        onBack={() => setShowPortalLogin(false)}
      />
    );
  }

  return (
    <TransactionContext.Provider value={transactionContextValue}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-white shadow-soft">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-3 md:py-4">
              <div className="flex items-center">
                <span className="text-lg md:text-xl font-serif font-semibold text-primary">Easy Convey</span>
                {sharedTransactionData.isSharedLink && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    Shared Transaction: {sharedTransactionData.transactionId}
                  </span>
                )}
                {currentTransactionId && (
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Live: {currentTransactionId}
                  </span>
                )}
              </div>
              
              {/* Portal Login/Profile */}
              <div className="flex items-center space-x-3">
                {isPortalLoggedIn && portalUser && currentOrganization ? (
                  <div className="flex items-center space-x-3">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-medium text-gray-900">{portalUser.first_name} {portalUser.last_name}</p>
                      <p className="text-xs text-gray-500">{currentOrganization.name}</p>
                      <p className="text-xs text-blue-600 capitalize">
                        {currentOrganization.type.replace('_', ' ')} • {portalUser.role.replace('_', ' ')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {currentOrganization.type === 'conveyancer' && (
                        <button
                          onClick={() => setShowConveyancerOverview(true)}
                          className="px-3 py-2 text-sm font-medium text-primary bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          Dashboard
                        </button>
                      )}
                      <button
                        onClick={handlePortalLogout}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Logout"
                      >
                        <LogOut className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowPortalLogin(true)}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Portal Login</span>
                    <span className="sm:hidden">Login</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
          {!started ? (
            <WelcomePage onStart={handleStartTransaction} />
          ) : (
            <TransactionWizard 
              transactionId={currentTransactionId}
              onSharedLink={handleSharedLink}
              sharedTransactionData={sharedTransactionData}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white mt-auto border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-4 md:py-6">
              <p className="text-center text-xs md:text-sm text-gray-500">
                © {new Date().getFullYear()} Easy Convey. All rights reserved. Powered by OrionX
              </p>
            </div>
          </div>
        </footer>
      </div>
    </TransactionContext.Provider>
  );
}

export default App;