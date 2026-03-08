import React, { useState, useEffect, createContext, useContext } from 'react';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import * as casesService from '../services/cases.service';
import TransactionWizard from './TransactionWizard';
import type { Case } from '../types/database';

interface ClientWizardProps {
  token: string;
  role: 'buyer' | 'seller';
  onComplete: () => void;
}

// Minimal TransactionContext for the client wizard (the wizard requires it)
const ClientTransactionContext = createContext<any>(null);

function ClientTransactionProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<any[]>([]);

  const value = {
    transactions,
    addTransaction: (t: any) => setTransactions(prev => [...prev, t]),
    updateTransaction: (_id: string, updates: any) => {
      setTransactions(prev => prev.map(t => ({ ...t, ...updates })));
    },
    updateTransactionProgress: () => {},
    markTransactionComplete: () => {},
    getTransaction: () => undefined,
    getActiveTransactions: () => [],
    getCompletedTransactions: () => [],
  };

  return (
    <ClientTransactionContext.Provider value={value}>
      {children}
    </ClientTransactionContext.Provider>
  );
}

export default function ClientWizard({ token, role, onComplete }: ClientWizardProps) {
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'expired' | 'used' | 'submitted'>('loading');
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function validateToken() {
      try {
        const result = await casesService.getCaseByToken(token);
        if (!result) {
          setStatus('invalid');
          setErrorMessage('This link is not valid. Please contact your conveyancer for a new link.');
          return;
        }
        if (result.expired) {
          setStatus('expired');
          setErrorMessage('This link has expired. Please contact your conveyancer for a new link.');
          return;
        }
        if (result.used) {
          setStatus('used');
          setErrorMessage('This link has already been used. Your information has been submitted.');
          return;
        }
        setCaseData(result.case_);
        setStatus('valid');
      } catch {
        setStatus('invalid');
        setErrorMessage('Unable to validate this link. Please try again later.');
      }
    }
    validateToken();
  }, [token]);

  if (status === 'loading') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Validating your link...</p>
        </div>
      </div>
    );
  }

  if (status === 'submitted') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-green-800 mb-2">Information Submitted</h2>
          <p className="text-sm text-green-700">
            Your {role} information has been submitted to the conveyancer for case {caseData?.case_number}.
            They will contact you with next steps.
          </p>
        </div>
      </div>
    );
  }

  if (status !== 'valid') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-800 mb-2">
            {status === 'expired' ? 'Link Expired' : status === 'used' ? 'Already Submitted' : 'Invalid Link'}
          </h2>
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Banner */}
      <div className="bg-blue-600 text-white px-4 py-3 mb-4 rounded-lg shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">
              You are filling in details as the <span className="font-bold capitalize">{role}</span> for
              case <span className="font-bold">{caseData?.case_number}</span>
            </p>
            <p className="text-xs text-blue-200 mt-0.5">
              Submitted by {caseData?.organization?.name || 'your conveyancer'}
            </p>
          </div>
        </div>
      </div>

      {/* The wizard in client mode */}
      <ClientTransactionProvider>
        <TransactionWizard
          transactionId={caseData?.case_number || token}
          mode="client"
          clientToken={token}
          onClientSubmitComplete={() => {
            setStatus('submitted');
            onComplete();
          }}
        />
      </ClientTransactionProvider>
    </div>
  );
}

// Re-export the context hook so TransactionWizard can use it in client mode
export function useClientTransactions() {
  return useContext(ClientTransactionContext);
}
