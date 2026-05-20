import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowRight, Search, ShoppingCart, Tag, CheckCircle, FileText,
  Eye, Loader2, AlertCircle, Sparkles, X, Users,
} from 'lucide-react';
import * as casesService from '../../services/cases.service';
import type { SubmittedParty } from '../../services/cases.service';
import * as storageService from '../../services/storage.service';

interface Step6SelectClientsProps {
  orgId?: string;
  transactionType: string;
  currentTransactionData?: any;
  onUpdate: (data: any) => void;
  onSetDocuments: (filePaths: any[], dataUrls: any[]) => void;
  onNext: () => void;
  onPrevious: () => void;
}

type Extracted = { fullName?: string; idNumber?: string; dateOfBirth?: string };

const partyKey = (p: SubmittedParty) => `${p.caseId}:${p.role}`;

const partyDocList = (p: SubmittedParty | null) => {
  if (!p?.data) return [] as { name: string; doc: any }[];
  const paths = (p.data.documentFilePaths || []).map((d: any) => ({ name: d.name || 'Document', doc: d }));
  const urls = (p.data.documentDataUrls || []).map((d: any) => ({ name: d.name || 'Document', doc: d }));
  return [...paths, ...urls];
};

const Step6SelectClients: React.FC<Step6SelectClientsProps> = ({
  orgId,
  currentTransactionData,
  onUpdate,
  onSetDocuments,
  onNext,
  onPrevious,
}) => {
  const [parties, setParties] = useState<SubmittedParty[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedBuyer, setSelectedBuyer] = useState<SubmittedParty | null>(
    currentTransactionData?.selectedParties?.buyer || null
  );
  const [selectedSeller, setSelectedSeller] = useState<SubmittedParty | null>(
    currentTransactionData?.selectedParties?.seller || null
  );
  const [searchBuyer, setSearchBuyer] = useState('');
  const [searchSeller, setSearchSeller] = useState('');
  const [extracting, setExtracting] = useState<{ buyer: boolean; seller: boolean }>({ buyer: false, seller: false });
  const [extracted, setExtracted] = useState<{ buyer?: Extracted; seller?: Extracted }>({});

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!orgId) { setLoading(false); return; }
      try {
        const result = await casesService.getSubmittedParties(orgId);
        if (!cancelled) setParties(result);
      } catch {
        if (!cancelled) setLoadError('Unable to load submitted clients. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [orgId]);

  const buyers = useMemo(
    () => parties.filter(p => p.role === 'buyer' && p.name.toLowerCase().includes(searchBuyer.toLowerCase())),
    [parties, searchBuyer]
  );
  const sellers = useMemo(
    () => parties.filter(p => p.role === 'seller' && p.name.toLowerCase().includes(searchSeller.toLowerCase())),
    [parties, searchSeller]
  );

  // Push the combined buyer + seller selection into the wizard's transaction data
  const writeSelections = (buyer: SubmittedParty | null, seller: SubmittedParty | null) => {
    const buyerPaths = (buyer?.data?.documentFilePaths || []).map((d: any) => ({ ...d, party: 'buyer' }));
    const sellerPaths = (seller?.data?.documentFilePaths || []).map((d: any) => ({ ...d, party: 'seller' }));
    const buyerUrls = (buyer?.data?.documentDataUrls || []).map((d: any) => ({ ...d, party: 'buyer' }));
    const sellerUrls = (seller?.data?.documentDataUrls || []).map((d: any) => ({ ...d, party: 'seller' }));

    onSetDocuments([...buyerPaths, ...sellerPaths], [...buyerUrls, ...sellerUrls]);
    onUpdate({
      selectedParties: { buyer: buyer || null, seller: seller || null },
      uploadedDocuments: [
        ...partyDocList(buyer).map(d => d.name),
        ...partyDocList(seller).map(d => d.name),
      ],
      ...(buyer ? { extractedBuyerName: buyer.name } : {}),
      ...(seller ? { extractedSellerName: seller.name } : {}),
    });
  };

  const fetchBlob = async (doc: any): Promise<File | null> => {
    try {
      let blob: Blob | null = null;
      if (doc.dataUrl) {
        blob = await (await fetch(doc.dataUrl)).blob();
      } else if (doc.path) {
        const url = await storageService.getSignedUrl(doc.path, doc.bucket || 'documents');
        blob = await (await fetch(url)).blob();
      }
      if (!blob) return null;
      return new File([blob], doc.name || 'document');
    } catch {
      return null;
    }
  };

  // Best-effort AI extraction across a party's documents
  const runExtraction = async (role: 'buyer' | 'seller', party: SubmittedParty) => {
    setExtracting(prev => ({ ...prev, [role]: true }));
    const docs = [...(party.data?.documentFilePaths || []), ...(party.data?.documentDataUrls || [])];
    const found: Extracted = {};
    for (const doc of docs) {
      const file = await fetchBlob(doc);
      if (!file) continue;
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/analyze-id', { method: 'POST', body: fd });
        if (res.ok) {
          const d = await res.json();
          if (d.fullName && d.fullName !== 'Unknown') found.fullName = d.fullName;
          if (d.idNumber && d.idNumber !== 'Unknown') found.idNumber = d.idNumber;
          if (d.dateOfBirth && d.dateOfBirth !== 'Unknown') found.dateOfBirth = d.dateOfBirth;
        }
      } catch { /* non-blocking */ }
    }
    setExtracted(prev => ({ ...prev, [role]: found }));
    setExtracting(prev => ({ ...prev, [role]: false }));

    const payload: Record<string, string> = {};
    if (role === 'buyer') {
      if (found.fullName) payload.extractedBuyerName = found.fullName;
      if (found.idNumber) payload.extractedBuyerIdNumber = found.idNumber;
      if (found.dateOfBirth) payload.extractedBuyerDateOfBirth = found.dateOfBirth;
    } else {
      if (found.fullName) payload.extractedSellerName = found.fullName;
      if (found.idNumber) payload.extractedSellerIdNumber = found.idNumber;
      if (found.dateOfBirth) payload.extractedSellerDateOfBirth = found.dateOfBirth;
    }
    if (Object.keys(payload).length) onUpdate(payload);
  };

  const handleSelect = (role: 'buyer' | 'seller', party: SubmittedParty) => {
    if (role === 'buyer') {
      setSelectedBuyer(party);
      writeSelections(party, selectedSeller);
    } else {
      setSelectedSeller(party);
      writeSelections(selectedBuyer, party);
    }
    setExtracted(prev => ({ ...prev, [role]: undefined }));
    runExtraction(role, party);
  };

  const handleClear = (role: 'buyer' | 'seller') => {
    if (role === 'buyer') {
      setSelectedBuyer(null);
      writeSelections(null, selectedSeller);
    } else {
      setSelectedSeller(null);
      writeSelections(selectedBuyer, null);
    }
    setExtracted(prev => ({ ...prev, [role]: undefined }));
  };

  const viewDoc = async (doc: any) => {
    try {
      if (doc.dataUrl) {
        const blob = await (await fetch(doc.dataUrl)).blob();
        window.open(URL.createObjectURL(blob), '_blank');
        return;
      }
      if (doc.path) {
        const url = await storageService.getSignedUrl(doc.path, doc.bucket || 'documents');
        window.open(url, '_blank');
      }
    } catch {
      alert('Unable to open this document.');
    }
  };

  const canProceed = !!selectedBuyer || !!selectedSeller;

  const renderPartyList = (
    role: 'buyer' | 'seller',
    list: SubmittedParty[],
    search: string,
    setSearch: (v: string) => void,
  ) => (
    <>
      <div className="relative mb-3">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={`Search ${role} names...`}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
        />
      </div>
      {list.length === 0 ? (
        <div className="text-center py-8 px-3 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <Users className="h-7 w-7 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">
            {search ? `No ${role}s match "${search}"` : `No ${role} has submitted documents yet`}
          </p>
          {!search && (
            <p className="text-xs text-gray-400 mt-1">
              Send a {role} link from the New Case screen so they can submit.
            </p>
          )}
        </div>
      ) : (
        <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {list.map(p => {
            const docCount = partyDocList(p).length;
            return (
              <li key={partyKey(p)}>
                <button
                  onClick={() => handleSelect(role, p)}
                  className="w-full text-left p-3 rounded-lg border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <p className="text-sm font-semibold text-primary">{p.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Case {p.caseNumber} · {docCount} document{docCount === 1 ? '' : 's'} ·{' '}
                    {new Date(p.submittedAt).toLocaleDateString()}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );

  const renderSelectedParty = (role: 'buyer' | 'seller', party: SubmittedParty) => {
    const docs = partyDocList(party);
    const ex = extracted[role];
    const isExtracting = extracting[role];
    return (
      <div className="rounded-lg border-2 border-primary/40 bg-primary/5 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-success" />
              <p className="text-sm font-bold text-primary">{party.name}</p>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Case {party.caseNumber} · submitted {new Date(party.submittedAt).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={() => handleClear(role)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-error transition-colors"
          >
            <X className="h-3.5 w-3.5" /> Change
          </button>
        </div>

        {/* Documents */}
        <div className="mt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
            Documents ({docs.length})
          </p>
          {docs.length === 0 ? (
            <p className="text-xs text-gray-400">No documents were submitted.</p>
          ) : (
            <ul className="space-y-1.5">
              {docs.map((d, i) => (
                <li key={i} className="flex items-center gap-2 p-2 rounded bg-white border border-gray-200">
                  <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="text-xs text-gray-700 truncate flex-1">{d.name}</span>
                  <button
                    onClick={() => viewDoc(d.doc)}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary-dark"
                  >
                    <Eye className="h-3.5 w-3.5" /> View
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* AI extraction */}
        <div className="mt-3 p-2.5 rounded bg-white border border-blue-200">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">AI Extraction</p>
          </div>
          {isExtracting ? (
            <p className="text-xs text-gray-500 flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Reading the submitted documents...
            </p>
          ) : ex && (ex.fullName || ex.idNumber || ex.dateOfBirth) ? (
            <div className="text-xs text-gray-700 space-y-0.5">
              {ex.fullName && <p><span className="text-gray-400">Name:</span> {ex.fullName}</p>}
              {ex.idNumber && <p><span className="text-gray-400">ID / Passport:</span> {ex.idNumber}</p>}
              {ex.dateOfBirth && <p><span className="text-gray-400">Date of birth:</span> {ex.dateOfBirth}</p>}
            </div>
          ) : (
            <p className="text-xs text-gray-400">
              No identity details could be read automatically — they can be entered manually later.
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="py-4 md:py-8 max-w-4xl mx-auto px-4">
      <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2 md:mb-3 text-center font-serif">
        Select Buyer &amp; Seller
      </h2>
      <p className="text-sm md:text-base text-gray-600 mb-6 md:mb-8 text-center max-w-2xl mx-auto">
        Choose the buyer and seller for this transaction from the clients who have submitted their
        documents. Selecting a name attaches their details and documents, and the AI reads their
        identity information automatically.
      </p>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
          <p className="text-sm text-gray-500">Loading submitted clients...</p>
        </div>
      ) : loadError ? (
        <div className="flex items-start gap-2 bg-error/5 border border-error/30 rounded-lg p-4 mb-6">
          <AlertCircle className="h-5 w-5 text-error flex-shrink-0" />
          <p className="text-sm text-error">{loadError}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
          {/* Buyer */}
          <div className="bg-white rounded-2xl shadow-soft border border-border p-4 md:p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-9 w-9 rounded-full bg-secondary text-primary flex items-center justify-center">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-primary">Buyer</h3>
            </div>
            {selectedBuyer
              ? renderSelectedParty('buyer', selectedBuyer)
              : renderPartyList('buyer', buyers, searchBuyer, setSearchBuyer)}
          </div>

          {/* Seller */}
          <div className="bg-white rounded-2xl shadow-soft border border-border p-4 md:p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-9 w-9 rounded-full bg-primary text-white flex items-center justify-center">
                <Tag className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-primary">Seller</h3>
            </div>
            {selectedSeller
              ? renderSelectedParty('seller', selectedSeller)
              : renderPartyList('seller', sellers, searchSeller, setSearchSeller)}
          </div>
        </div>
      )}

      {/* Readiness hint */}
      {!loading && !loadError && (
        <div
          className={`mt-5 flex items-center gap-2 rounded-lg px-3 py-2 text-xs md:text-sm border ${
            selectedBuyer && selectedSeller
              ? 'bg-green-50 text-green-800 border-green-200'
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}
        >
          {selectedBuyer && selectedSeller
            ? <CheckCircle className="h-4 w-4 flex-shrink-0" />
            : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
          <span>
            {selectedBuyer && selectedSeller
              ? 'Both parties are selected — this transaction is ready to continue.'
              : 'Select a buyer and a seller. You can continue with one side and add the other later.'}
          </span>
        </div>
      )}

      <div className="mt-8 md:mt-12 flex justify-between">
        <button
          onClick={onPrevious}
          className="inline-flex items-center px-4 py-2 md:px-5 md:py-2.5 border-2 border-gray-300 rounded-lg text-sm md:text-base font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-colors"
        >
          <ArrowLeft className="mr-1 md:mr-2 h-4 w-4" /> Back
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className={`inline-flex items-center px-4 py-2 md:px-5 md:py-2.5 border-2 border-transparent rounded-lg text-sm md:text-base font-medium shadow-md text-white ${
            canProceed ? 'bg-primary hover:bg-primary-dark transition-colors' : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          Continue <ArrowRight className="ml-1 md:ml-2 h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Step6SelectClients;
