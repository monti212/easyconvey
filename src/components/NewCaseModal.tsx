import React, { useState, useEffect } from 'react';
import { X, Link2, FileText, Copy, Check, Send, ClipboardList, Building2, MapPin, Banknote } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import * as casesService from '../services/cases.service';

const STORAGE_KEY = 'easyconvey_last_share_links';

type TransferCategory = 'normal_transfer' | 'sectional_title' | 'tribal_grant';

const TRANSFER_CATEGORIES: { id: TransferCategory; label: string; icon: React.ComponentType<any>; short: string }[] = [
  { id: 'normal_transfer', label: 'Normal Transfer', icon: FileText, short: 'Standard freehold property sale' },
  { id: 'sectional_title', label: 'Sectional Title', icon: Building2, short: 'Unit within a scheme (flat, townhouse)' },
  { id: 'tribal_grant', label: 'Tribal Grant', icon: MapPin, short: 'Tribal/customary land grant' },
];

interface NewCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCaseCreated: (caseId: string, transactionData?: any) => void;
  /** Pre-selects the transfer type when the modal is opened from a dashboard type card. */
  initialCategory?: string | null;
}

export default function NewCaseModal({ isOpen, onClose, onCaseCreated, initialCategory }: NewCaseModalProps) {
  const { organization, orgUser } = useAuth();
  const [caseType, setCaseType] = useState<'buying' | 'selling'>('buying');
  const [transferCategory, setTransferCategory] = useState<TransferCategory>('normal_transfer');
  const [includeBond, setIncludeBond] = useState(false);
  const [clientName, setClientName] = useState('');
  const [mode, setMode] = useState<'manual' | 'links'>('links');
  const [isCreating, setIsCreating] = useState(false);
  const [generatedLinks, setGeneratedLinks] = useState<{ buyerLink: string; sellerLink: string; caseNumber: string } | null>(null);
  const [buyerEmail, setBuyerEmail] = useState('');
  const [sellerEmail, setSellerEmail] = useState('');
  const [copiedLink, setCopiedLink] = useState<'buyer' | 'seller' | 'both' | null>(null);
  const [emailSent, setEmailSent] = useState<{ buyer?: boolean; seller?: boolean }>({});

  // Restore links from localStorage when modal opens
  useEffect(() => {
    if (isOpen && !generatedLinks) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) setGeneratedLinks(JSON.parse(saved));
      } catch { /* ignore */ }
    }
  }, [isOpen]);

  // Pre-select the transfer type when opened from a dashboard type card
  useEffect(() => {
    if (!isOpen || !initialCategory) return;
    if (initialCategory === 'bond') {
      setTransferCategory('normal_transfer');
      setIncludeBond(true);
    } else if (TRANSFER_CATEGORIES.some(c => c.id === initialCategory)) {
      setTransferCategory(initialCategory as TransferCategory);
      setIncludeBond(false);
    }
  }, [isOpen, initialCategory]);

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!organization) return;
    setIsCreating(true);

    try {
      const caseTypeValue = includeBond ? `${transferCategory}_bond` : transferCategory;

      if (mode === 'manual') {
        const case_ = await casesService.createCase({
          organization_id: organization.id,
          case_type: caseTypeValue,
          client_name: clientName || 'Client',
          conveyancer_id: orgUser?.id,
          status: 'initiated',
          priority: 'medium',
          documents: [],
        });
        onCaseCreated(case_.id, {
          transactionType: caseType,
          transactionCategory: transferCategory,
          includeBondRegistration: includeBond,
          clientName,
        });
        onClose();
      } else {
        const { case_, buyerToken, sellerToken } = await casesService.createCaseWithTokens({
          organization_id: organization.id,
          case_type: caseTypeValue,
          client_name: clientName || 'Pending',
          conveyancer_id: orgUser?.id,
          status: 'initiated',
          priority: 'medium',
          documents: [],
        });
        const links = {
          buyerLink: `${window.location.origin}?case=${buyerToken}&role=buyer`,
          sellerLink: `${window.location.origin}?case=${sellerToken}&role=seller`,
          caseNumber: case_.case_number,
        };
        setGeneratedLinks(links);
        // Persist so links survive page navigation
        localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
      }
    } catch (err) {
      console.error('Failed to create case:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = async (link: string, type: 'buyer' | 'seller') => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(type);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch {
      console.error('Failed to copy');
    }
  };

  const handleSendEmail = async (email: string, link: string, role: 'buyer' | 'seller') => {
    if (!email) return;
    try {
      await fetch('/api/send-share-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          link,
          transactionId: generatedLinks?.caseNumber,
          transactionType: role,
          hasPricing: false,
        }),
      });
      setEmailSent(prev => ({ ...prev, [role]: true }));
    } catch {
      console.error('Failed to send email');
    }
  };

  const handleClose = (clearLinks = false) => {
    if (clearLinks) {
      setGeneratedLinks(null);
      localStorage.removeItem(STORAGE_KEY);
    }
    setCaseType('buying');
    setTransferCategory('normal_transfer');
    setIncludeBond(false);
    setClientName('');
    setMode('links');
    setBuyerEmail('');
    setSellerEmail('');
    setEmailSent({});
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative">
        <button onClick={() => handleClose(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="h-5 w-5" />
        </button>

        {!generatedLinks ? (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-4">New Case</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
                <div className="flex gap-3">
                  {(['buying', 'selling'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setCaseType(type)}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium border-2 transition-colors ${
                        caseType === type
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {type === 'buying' ? 'Purchase' : 'Sale'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transfer Type</label>
                <div className="grid grid-cols-1 gap-2">
                  {TRANSFER_CATEGORIES.map(cat => {
                    const Icon = cat.icon;
                    const selected = transferCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setTransferCategory(cat.id)}
                        className={`flex items-center p-2.5 rounded-lg border-2 text-left transition-colors ${
                          selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className={`h-4 w-4 mr-2.5 flex-shrink-0 ${selected ? 'text-blue-600' : 'text-gray-400'}`} />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{cat.label}</p>
                          <p className="text-xs text-gray-500">{cat.short}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <label
                  className={`mt-2 flex items-center p-2.5 rounded-lg border-2 cursor-pointer transition-colors ${
                    includeBond ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={includeBond}
                    onChange={e => setIncludeBond(e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <Banknote className={`h-4 w-4 mx-2.5 flex-shrink-0 ${includeBond ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Include Bond Registration</p>
                    <p className="text-xs text-gray-500">Buyer is financing the purchase with a mortgage</p>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Name (optional)</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  placeholder="Enter client name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">How will client details be provided?</label>
                <div className="space-y-2">
                  <button
                    onClick={() => setMode('links')}
                    className={`w-full flex items-center p-3 rounded-lg border-2 transition-colors text-left ${
                      mode === 'links'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Link2 className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Send links to buyer &amp; seller</p>
                      <p className="text-xs text-gray-500">Each party fills in their own information online</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setMode('manual')}
                    className={`w-full flex items-center p-3 rounded-lg border-2 transition-colors text-left ${
                      mode === 'manual'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <FileText className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">I'll enter the details</p>
                      <p className="text-xs text-gray-500">Client provided info via email or in person</p>
                    </div>
                  </button>
                </div>
              </div>

              <button
                onClick={handleCreate}
                disabled={isCreating}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isCreating ? 'Creating...' : 'Create Case'}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Case Created</h2>
            <p className="text-sm text-gray-500 mb-2">Case {generatedLinks.caseNumber} — share these links with the buyer and seller.</p>

            {/* Copy Both button */}
            <button
              onClick={async () => {
                const text = `Buyer Link:\n${generatedLinks.buyerLink}\n\nSeller Link:\n${generatedLinks.sellerLink}`;
                await navigator.clipboard.writeText(text);
                setCopiedLink('both');
                setTimeout(() => setCopiedLink(null), 2000);
              }}
              className="w-full flex items-center justify-center gap-2 mb-4 py-2 px-4 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors"
            >
              {copiedLink === 'both' ? <Check className="h-4 w-4" /> : <ClipboardList className="h-4 w-4" />}
              {copiedLink === 'both' ? 'Both Links Copied!' : 'Copy Both Links'}
            </button>

            <div className="space-y-4">
              {/* Buyer Link */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="text-sm font-semibold text-blue-800 mb-2">Buyer Link</h3>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    readOnly
                    value={generatedLinks.buyerLink}
                    className="flex-1 text-xs bg-white border border-blue-200 rounded px-2 py-1.5 text-gray-600 truncate"
                  />
                  <button
                    onClick={() => handleCopy(generatedLinks.buyerLink, 'buyer')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  >
                    {copiedLink === 'buyer' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copiedLink === 'buyer' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={buyerEmail}
                    onChange={e => setBuyerEmail(e.target.value)}
                    placeholder="buyer@email.com"
                    className="flex-1 text-xs border border-blue-200 rounded px-2 py-1.5"
                  />
                  <button
                    onClick={() => handleSendEmail(buyerEmail, generatedLinks.buyerLink, 'buyer')}
                    disabled={!buyerEmail || emailSent.buyer}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white border border-blue-300 text-blue-700 text-xs rounded hover:bg-blue-50 disabled:opacity-50"
                  >
                    <Send className="h-3 w-3" />
                    {emailSent.buyer ? 'Sent' : 'Send'}
                  </button>
                </div>
              </div>

              {/* Seller Link */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h3 className="text-sm font-semibold text-green-800 mb-2">Seller Link</h3>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    readOnly
                    value={generatedLinks.sellerLink}
                    className="flex-1 text-xs bg-white border border-green-200 rounded px-2 py-1.5 text-gray-600 truncate"
                  />
                  <button
                    onClick={() => handleCopy(generatedLinks.sellerLink, 'seller')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                  >
                    {copiedLink === 'seller' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copiedLink === 'seller' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={sellerEmail}
                    onChange={e => setSellerEmail(e.target.value)}
                    placeholder="seller@email.com"
                    className="flex-1 text-xs border border-green-200 rounded px-2 py-1.5"
                  />
                  <button
                    onClick={() => handleSendEmail(sellerEmail, generatedLinks.sellerLink, 'seller')}
                    disabled={!sellerEmail || emailSent.seller}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white border border-green-300 text-green-700 text-xs rounded hover:bg-green-50 disabled:opacity-50"
                  >
                    <Send className="h-3 w-3" />
                    {emailSent.seller ? 'Sent' : 'Send'}
                  </button>
                </div>
              </div>

              <button
                onClick={() => handleClose(true)}
                className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Done (clear links)
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
