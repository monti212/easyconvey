import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle, Loader2, ShoppingCart, Tag, Pencil } from 'lucide-react';
import * as casesService from '../services/cases.service';
import ClientUploadPage from './ClientUploadPage';
import type { Case } from '../types/database';

interface ConveyancerPartyEntryProps {
  caseId: string;
  onDone: () => void;
}

/**
 * Manual-entry flow: when the conveyancer chose "I'll enter the details" they
 * fill in the buyer's and seller's details/documents themselves — the same
 * page the parties would see via a share link. This is done before the
 * transaction process and unlocks the "Start Transaction" button.
 */
export default function ConveyancerPartyEntry({ caseId, onDone }: ConveyancerPartyEntryProps) {
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRole] = useState<'buyer' | 'seller'>('buyer');
  const [done, setDone] = useState<{ buyer: boolean; seller: boolean }>({ buyer: false, seller: false });

  useEffect(() => {
    let active = true;
    casesService
      .getCase(caseId)
      .then(c => {
        if (!active) return;
        setCaseData(c);
        setDone({ buyer: c.buyer_status === 'completed', seller: c.seller_status === 'completed' });
      })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [caseId]);

  const handleSave = (role: 'buyer' | 'seller') => async (partyData: any) => {
    try {
      await casesService.savePartyData(caseId, role, partyData);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Could not save. Please try again.' };
    }
  };

  const bothDone = done.buyer && done.seller;

  const renderTab = (role: 'buyer' | 'seller') => {
    const isActive = activeRole === role;
    const isDone = done[role];
    const Icon = role === 'buyer' ? ShoppingCart : Tag;
    return (
      <button
        onClick={() => setActiveRole(role)}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
          isActive ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-primary'
        }`}
      >
        <Icon className="h-4 w-4" />
        {role === 'buyer' ? 'Buyer' : 'Seller'}
        {isDone && <CheckCircle className="h-4 w-4 text-success" />}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white shadow-soft">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-serif font-semibold text-primary">Enter Client Details</h1>
            <p className="text-xs text-gray-500">
              {caseData?.case_number ? `Case ${caseData.case_number} · ` : ''}
              Capture the buyer and seller before starting the transaction
            </p>
          </div>
          <button
            onClick={onDone}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-primary hover:bg-gray-50 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
        </div>
      </header>

      <main className="py-6 md:py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
            <p className="text-sm text-gray-500">Loading case...</p>
          </div>
        ) : !caseData ? (
          <div className="max-w-md mx-auto text-center py-20 px-4">
            <p className="text-sm text-gray-600 mb-4">This case could not be loaded.</p>
            <button onClick={onDone} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">
              Back to Dashboard
            </button>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto px-4">
            {/* Tabs */}
            <div className="flex bg-white rounded-t-xl border border-border border-b-0 overflow-hidden">
              {renderTab('buyer')}
              {renderTab('seller')}
            </div>
            <div className="bg-white rounded-b-xl border border-border p-1 mb-6">
              {bothDone && (
                <div className="m-2 flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-800">
                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                  Both parties saved — go back to the dashboard and click “Start Transaction”.
                </div>
              )}
            </div>

            {/* Active party */}
            {done[activeRole] ? (
              <div className="max-w-2xl mx-auto px-4 text-center py-12 bg-white rounded-2xl border border-border">
                <CheckCircle className="h-12 w-12 text-success mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-primary mb-1">
                  {activeRole === 'buyer' ? 'Buyer' : 'Seller'} details saved
                </h3>
                <p className="text-sm text-gray-500 mb-5">
                  This party's details and documents have been saved to the case.
                </p>
                <button
                  onClick={() => setDone(prev => ({ ...prev, [activeRole]: false }))}
                  className="inline-flex items-center gap-1.5 px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Pencil className="h-4 w-4" />
                  Re-enter {activeRole} details
                </button>
              </div>
            ) : (
              <ClientUploadPage
                key={activeRole}
                role={activeRole}
                caseId={caseId}
                orgId={caseData.organization_id}
                caseNumber={caseData.case_number}
                caseType={caseData.case_type}
                forConveyancer
                onSubmitParty={handleSave(activeRole)}
                onSubmitted={() => {
                  setDone(prev => ({ ...prev, [activeRole]: true }));
                  setActiveRole(activeRole === 'buyer' ? 'seller' : 'buyer');
                }}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
