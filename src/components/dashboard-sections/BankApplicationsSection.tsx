import React, { useState, useEffect } from 'react';
import {
  Inbox,
  X,
  Download,
  User,
  MapPin,
  FileText,
  Eye,
  MessageSquare,
  Calendar,
  Mail,
  Building,
  Home,
  Paperclip,
  ChevronDown,
  ChevronUp,
  Star,
  Archive,
  Filter,
  Search,
  Send,
  ClipboardCheck,
  Link2,
  Check,
  Copy,
  UserCheck,
  Phone,
  Hash,
  DollarSign,
  Briefcase
} from 'lucide-react';

interface InboxAttachment {
  name: string;
  type: string;
  size: string;
}

interface PartyDetails {
  buyer: {
    name: string;
    email: string;
    phone: string;
    id_number: string;
    address: string;
    nationality: string;
    marital_status: string;
  };
  seller: {
    name: string;
    email: string;
    phone: string;
    id_number: string;
    address: string;
  };
  property: {
    address: string;
    erf_number: string;
    title_deed_number: string;
    purchase_price: string;
    transfer_duty: string;
  };
}

interface InboxItem {
  id: string;
  source_type: 'bank' | 'estate_agent';
  source_name: string;
  source_contact: string;
  source_email: string;
  subject: string;
  message: string;
  case_number: string;
  property_address: string;
  applicant_name: string;
  attachments: InboxAttachment[];
  is_read: boolean;
  is_starred: boolean;
  is_archived: boolean;
  received_at: string;
  category: 'document' | 'instruction' | 'update' | 'request';
  party_details: PartyDetails;
}

interface BankApplicationsSectionProps {
  applications: any[];
  onAcceptApplication: (applicationId: string) => void;
  onDeclineApplication: (applicationId: string) => void;
  onCreateCase: (applicationId: string) => void;
}

function applicationsToInboxItems(applications: any[]): InboxItem[] {
  return applications.map((app: any) => ({
    id: app.id,
    source_type: 'bank' as const,
    source_name: app.bank_name || 'Unknown Bank',
    source_contact: app.loan_officer || 'Unassigned',
    source_email: app.applicant_email || '',
    subject: `${app.transaction_type === 'buying' ? 'Purchase' : 'Sale'} Transaction — ${app.applicant_name}`,
    message: `Loan application ${app.case_number} for P ${(app.loan_amount || 0).toLocaleString()} at ${app.property_address}.${app.special_instructions ? `\n\nInstructions: ${app.special_instructions}` : ''}`,
    case_number: app.case_number || app.id,
    property_address: app.property_address || 'Address pending',
    applicant_name: app.applicant_name || 'Unknown',
    attachments: [],
    is_read: app.status === 'accepted',
    is_starred: false,
    is_archived: false,
    received_at: app.submitted_at || new Date().toISOString(),
    category: 'instruction' as const,
    party_details: {
      buyer: {
        name: app.applicant_name || '',
        email: app.applicant_email || '',
        phone: '',
        id_number: '',
        address: '',
        nationality: '',
        marital_status: '',
      },
      seller: { name: '', email: '', phone: '', id_number: '', address: '' },
      property: {
        address: app.property_address || '',
        erf_number: '',
        title_deed_number: '',
        purchase_price: `P ${(app.loan_amount || 0).toLocaleString()}`,
        transfer_duty: '',
      },
    },
  }));
}

const BankApplicationsSection: React.FC<BankApplicationsSectionProps> = ({ applications, onAcceptApplication, onDeclineApplication, onCreateCase }) => {
  const [items, setItems] = useState<InboxItem[]>(() => applicationsToInboxItems(applications));

  // Sync items when applications prop changes — real inbox data only
  useEffect(() => {
    setItems(applicationsToInboxItems(applications));
  }, [applications]);
  const [filterSource, setFilterSource] = useState<'all' | 'bank' | 'estate_agent'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterRead, setFilterRead] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [reviewItem, setReviewItem] = useState<InboxItem | null>(null);
  const [linksSent, setLinksSent] = useState<Record<string, { buyer?: boolean; seller?: boolean }>>({});
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'document': return 'Documents';
      case 'instruction': return 'Instruction';
      case 'update': return 'Update';
      case 'request': return 'Request';
      default: return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'document': return 'bg-blue-100 text-blue-800';
      case 'instruction': return 'bg-purple-100 text-purple-800';
      case 'update': return 'bg-yellow-100 text-yellow-800';
      case 'request': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSourceIcon = (sourceType: string) => {
    return sourceType === 'bank'
      ? <Building className="h-4 w-4" />
      : <Home className="h-4 w-4" />;
  };

  const getSourceColor = (sourceType: string) => {
    return sourceType === 'bank'
      ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
      : 'bg-emerald-100 text-emerald-700 border-emerald-200';
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHrs < 1) return 'Just now';
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
  };

  const toggleRead = (id: string) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, is_read: !item.is_read } : item
    ));
  };

  const toggleStar = (id: string) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, is_starred: !item.is_starred } : item
    ));
  };

  const archiveItem = (id: string) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, is_archived: true } : item
    ));
  };

  const markSelectedAsRead = () => {
    setItems(prev => prev.map(item =>
      selectedItems.has(item.id) ? { ...item, is_read: true } : item
    ));
    setSelectedItems(new Set());
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSendLink = async (itemId: string, role: 'buyer' | 'seller') => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const email = role === 'buyer' ? 'monti@orionx.xyz' : 'bukhosi@orionx.xyz';
    const demoLink = `${window.location.origin}?case=demo-${itemId}&role=${role}`;

    try {
      await fetch('/api/send-share-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          link: demoLink,
          transactionId: item.case_number,
          transactionType: role,
          hasPricing: false,
        }),
      });
    } catch {
      // In demo mode, still mark as sent
    }

    setLinksSent(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], [role]: true },
    }));
  };

  const handleCopyLink = async (itemId: string, role: 'buyer' | 'seller') => {
    const link = `${window.location.origin}?case=demo-${itemId}&role=${role}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(`${itemId}-${role}`);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch {
      console.error('Failed to copy');
    }
  };

  const filteredItems = items.filter(item => {
    if (item.is_archived) return false;
    if (filterSource !== 'all' && item.source_type !== filterSource) return false;
    if (filterCategory !== 'all' && item.category !== filterCategory) return false;
    if (filterRead === 'unread' && item.is_read) return false;
    if (filterRead === 'read' && !item.is_read) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        item.subject.toLowerCase().includes(term) ||
        item.source_name.toLowerCase().includes(term) ||
        item.case_number.toLowerCase().includes(term) ||
        item.applicant_name.toLowerCase().includes(term) ||
        item.property_address.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const unreadCount = items.filter(i => !i.is_read && !i.is_archived).length;
  const bankCount = items.filter(i => i.source_type === 'bank' && !i.is_archived).length;
  const agentCount = items.filter(i => i.source_type === 'estate_agent' && !i.is_archived).length;
  const totalAttachments = items.filter(i => !i.is_archived).reduce((sum, i) => sum + i.attachments.length, 0);

  // Review Modal
  if (reviewItem) {
    const { party_details } = reviewItem;
    const sentStatus = linksSent[reviewItem.id] || {};

    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col">
          {/* Review Header */}
          <div className="bg-gradient-to-r from-primary to-blue-800 p-6 flex-shrink-0">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-white">Review Transaction Details</h2>
                <p className="text-blue-200 text-sm mt-1">
                  {reviewItem.case_number !== 'NEW' ? reviewItem.case_number : 'New Matter'} — {reviewItem.property_address}
                </p>
              </div>
              <button
                onClick={() => setReviewItem(null)}
                className="p-2 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Send Links Bar */}
            <div className="mt-4 bg-white/10 rounded-xl p-4">
              <div className="flex items-center mb-3">
                <Link2 className="h-5 w-5 text-blue-200 mr-2" />
                <h3 className="text-sm font-semibold text-white">Send Transaction Links</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Buyer Link */}
                <div className="bg-white/10 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-blue-200 uppercase tracking-wider">Buyer Link</span>
                    <span className="text-xs text-blue-300">monti@orionx.xyz</span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleSendLink(reviewItem.id, 'buyer')}
                      disabled={sentStatus.buyer}
                      className={`flex-1 inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        sentStatus.buyer
                          ? 'bg-green-500 text-white'
                          : 'bg-white text-blue-700 hover:bg-blue-50'
                      }`}
                    >
                      {sentStatus.buyer ? (
                        <><Check className="h-4 w-4 mr-1.5" />Sent</>
                      ) : (
                        <><Send className="h-4 w-4 mr-1.5" />Send to Buyer</>
                      )}
                    </button>
                    <button
                      onClick={() => handleCopyLink(reviewItem.id, 'buyer')}
                      className="px-3 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
                      title="Copy link"
                    >
                      {copiedLink === `${reviewItem.id}-buyer` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Seller Link */}
                <div className="bg-white/10 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-blue-200 uppercase tracking-wider">Seller Link</span>
                    <span className="text-xs text-blue-300">bukhosi@orionx.xyz</span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleSendLink(reviewItem.id, 'seller')}
                      disabled={sentStatus.seller}
                      className={`flex-1 inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        sentStatus.seller
                          ? 'bg-green-500 text-white'
                          : 'bg-white text-green-700 hover:bg-green-50'
                      }`}
                    >
                      {sentStatus.seller ? (
                        <><Check className="h-4 w-4 mr-1.5" />Sent</>
                      ) : (
                        <><Send className="h-4 w-4 mr-1.5" />Send to Seller</>
                      )}
                    </button>
                    <button
                      onClick={() => handleCopyLink(reviewItem.id, 'seller')}
                      className="px-3 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
                      title="Copy link"
                    >
                      {copiedLink === `${reviewItem.id}-seller` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Review Content */}
          <div className="p-6 overflow-y-auto flex-1">
            <div className="space-y-6">
              {/* Property Details */}
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
                <div className="flex items-center mb-4">
                  <MapPin className="h-5 w-5 text-gray-600 mr-2" />
                  <h3 className="text-base font-semibold text-gray-900">Property Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Address</span>
                    <p className="text-sm font-medium text-gray-900 mt-1">{party_details.property.address}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">ERF Number</span>
                    <p className="text-sm font-medium text-gray-900 mt-1">{party_details.property.erf_number}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Title Deed</span>
                    <p className="text-sm font-medium text-gray-900 mt-1">{party_details.property.title_deed_number}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Price</span>
                    <p className="text-sm font-bold text-green-700 mt-1">{party_details.property.purchase_price}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Transfer Duty</span>
                    <p className="text-sm font-medium text-gray-900 mt-1">{party_details.property.transfer_duty}</p>
                  </div>
                </div>
              </div>

              {/* Buyer & Seller side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Buyer */}
                <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg mr-3">
                      <UserCheck className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-blue-900">Buyer</h3>
                      <p className="text-xs text-blue-600">Purchaser Details</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-blue-400 mr-2 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-blue-600">Full Name</p>
                        <p className="text-sm font-medium text-gray-900">{party_details.buyer.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-blue-400 mr-2 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-blue-600">Email</p>
                        <p className="text-sm text-gray-900">{party_details.buyer.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-blue-400 mr-2 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-blue-600">Phone</p>
                        <p className="text-sm text-gray-900">{party_details.buyer.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Hash className="h-4 w-4 text-blue-400 mr-2 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-blue-600">ID Number</p>
                        <p className="text-sm font-mono text-gray-900">{party_details.buyer.id_number}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-blue-400 mr-2 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-blue-600">Residential Address</p>
                        <p className="text-sm text-gray-900">{party_details.buyer.address}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Briefcase className="h-4 w-4 text-blue-400 mr-2 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-blue-600">Marital Status</p>
                        <p className="text-sm text-gray-900">{party_details.buyer.marital_status}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seller */}
                <div className="bg-green-50 rounded-xl border border-green-200 p-5">
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-green-100 rounded-lg mr-3">
                      <User className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-green-900">Seller</h3>
                      <p className="text-xs text-green-600">Transferor Details</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-green-600">Full Name</p>
                        <p className="text-sm font-medium text-gray-900">{party_details.seller.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-green-600">Email</p>
                        <p className="text-sm text-gray-900">{party_details.seller.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-green-600">Phone</p>
                        <p className="text-sm text-gray-900">{party_details.seller.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Hash className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-green-600">ID Number</p>
                        <p className="text-sm font-mono text-gray-900">{party_details.seller.id_number}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-green-600">Address</p>
                        <p className="text-sm text-gray-900">{party_details.seller.address}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Attachments in review */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center mb-4">
                  <Paperclip className="h-5 w-5 text-gray-600 mr-2" />
                  <h3 className="text-base font-semibold text-gray-900">
                    Received Documents ({reviewItem.attachments.length})
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {reviewItem.attachments.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 hover:border-blue-300 hover:bg-blue-50/30 transition-colors group">
                      <div className="flex items-center min-w-0">
                        <FileText className="h-4 w-4 text-red-500 flex-shrink-0" />
                        <div className="ml-2 min-w-0">
                          <p className="text-sm text-gray-900 truncate">{file.name}</p>
                          <p className="text-xs text-gray-400">{file.size}</p>
                        </div>
                      </div>
                      <button className="ml-2 p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-100 opacity-0 group-hover:opacity-100 transition-all">
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Source info */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center mb-3">
                  {reviewItem.source_type === 'bank'
                    ? <Building className="h-5 w-5 text-indigo-600 mr-2" />
                    : <Home className="h-5 w-5 text-emerald-600 mr-2" />
                  }
                  <h3 className="text-base font-semibold text-gray-900">
                    Received from {reviewItem.source_type === 'bank' ? 'Bank' : 'Estate Agent'}
                  </h3>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{reviewItem.source_contact}</p>
                    <p className="text-sm text-gray-600">{reviewItem.source_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-blue-600">{reviewItem.source_email}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Received {new Date(reviewItem.received_at).toLocaleString('en-ZA', { dateStyle: 'long', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Review Footer */}
          <div className="border-t border-gray-200 p-4 bg-gray-50 flex-shrink-0">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setReviewItem(null)}
                className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close Review
              </button>
              <div className="flex space-x-2">
                <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                  <MessageSquare className="h-4 w-4 mr-1.5" />
                  Reply to {reviewItem.source_contact}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <Mail className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Unread</p>
              <p className="text-2xl font-bold text-gray-900">{unreadCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <Building className="h-8 w-8 text-indigo-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">From Banks</p>
              <p className="text-2xl font-bold text-gray-900">{bankCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <Home className="h-8 w-8 text-emerald-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">From Agents</p>
              <p className="text-2xl font-bold text-gray-900">{agentCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <Paperclip className="h-8 w-8 text-amber-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Attachments</p>
              <p className="text-2xl font-bold text-gray-900">{totalAttachments}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search inbox..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Sources</option>
              <option value="bank">Banks</option>
              <option value="estate_agent">Estate Agents</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="document">Documents</option>
              <option value="instruction">Instructions</option>
              <option value="update">Updates</option>
              <option value="request">Requests</option>
            </select>

            <select
              value={filterRead}
              onChange={(e) => setFilterRead(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>

          {selectedItems.size > 0 && (
            <div className="flex items-center space-x-2 ml-auto">
              <span className="text-sm text-gray-500">{selectedItems.size} selected</span>
              <button
                onClick={markSelectedAsRead}
                className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
              >
                Mark Read
              </button>
            </div>
          )}

          <div className="ml-auto text-sm text-gray-500">
            {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Inbox List */}
      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
        {filteredItems.map((item) => (
          <div key={item.id}>
            {/* Inbox Row */}
            <div
              className={`flex items-start p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                !item.is_read ? 'bg-blue-50/40' : ''
              }`}
              onClick={() => {
                setExpandedItem(expandedItem === item.id ? null : item.id);
                if (!item.is_read) toggleRead(item.id);
              }}
            >
              <div className="flex items-center mr-3 mt-1" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selectedItems.has(item.id)}
                  onChange={() => toggleSelectItem(item.id)}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300"
                />
              </div>

              <button
                className="mr-3 mt-1"
                onClick={(e) => { e.stopPropagation(); toggleStar(item.id); }}
              >
                <Star className={`h-4 w-4 ${item.is_starred ? 'fill-amber-400 text-amber-400' : 'text-gray-300 hover:text-gray-400'}`} />
              </button>

              <div className="mr-3 mt-2">
                <div className={`h-2 w-2 rounded-full ${!item.is_read ? 'bg-blue-600' : 'bg-transparent'}`} />
              </div>

              <div className={`flex items-center px-2 py-1 rounded-full border text-xs font-medium mr-3 mt-0.5 whitespace-nowrap ${getSourceColor(item.source_type)}`}>
                {getSourceIcon(item.source_type)}
                <span className="ml-1">{item.source_type === 'bank' ? 'Bank' : 'Agent'}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm ${!item.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                      {item.source_name}
                    </span>
                    <span className="text-xs text-gray-400">&mdash;</span>
                    <span className="text-xs text-gray-500">{item.source_contact}</span>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap ml-4">{formatTimeAgo(item.received_at)}</span>
                </div>

                <div className="flex items-center space-x-2 mb-1">
                  <span className={`text-sm ${!item.is_read ? 'font-semibold text-gray-900' : 'text-gray-800'} truncate`}>
                    {item.subject}
                  </span>
                  <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-medium ${getCategoryColor(item.category)}`}>
                    {getCategoryLabel(item.category)}
                  </span>
                </div>

                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  {item.case_number !== 'NEW' && (
                    <span className="flex items-center">
                      <FileText className="h-3 w-3 mr-1" />
                      {item.case_number}
                    </span>
                  )}
                  {item.case_number === 'NEW' && (
                    <span className="flex items-center text-orange-600 font-medium">
                      <FileText className="h-3 w-3 mr-1" />
                      New Matter
                    </span>
                  )}
                  <span className="flex items-center">
                    <User className="h-3 w-3 mr-1" />
                    {item.applicant_name}
                  </span>
                  {item.attachments.length > 0 && (
                    <span className="flex items-center">
                      <Paperclip className="h-3 w-3 mr-1" />
                      {item.attachments.length} file{item.attachments.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              <div className="ml-3 mt-1">
                {expandedItem === item.id
                  ? <ChevronUp className="h-4 w-4 text-gray-400" />
                  : <ChevronDown className="h-4 w-4 text-gray-400" />
                }
              </div>
            </div>

            {/* Expanded Detail */}
            {expandedItem === item.id && (
              <div className="px-16 pb-6 bg-gray-50/50 border-t border-gray-100">
                <div className="mt-4 mb-5">
                  <p className="text-sm text-gray-700 leading-relaxed">{item.message}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                  <div className="bg-white rounded-lg border border-gray-200 p-3">
                    <div className="flex items-center mb-2">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Property</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{item.property_address}</p>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-3">
                    <div className="flex items-center mb-2">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Party</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{item.applicant_name}</p>
                  </div>
                </div>

                {item.attachments.length > 0 && (
                  <div className="mb-5">
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                      Attachments ({item.attachments.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {item.attachments.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2.5 hover:border-blue-300 hover:bg-blue-50/30 transition-colors group">
                          <div className="flex items-center min-w-0">
                            <FileText className="h-4 w-4 text-red-500 flex-shrink-0" />
                            <div className="ml-2 min-w-0">
                              <p className="text-sm text-gray-900 truncate">{file.name}</p>
                              <p className="text-xs text-gray-400">{file.size}</p>
                            </div>
                          </div>
                          <button className="ml-2 p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-100 opacity-0 group-hover:opacity-100 transition-all">
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-5 bg-white rounded-lg border border-gray-200 p-3">
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Sender</h4>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${item.source_type === 'bank' ? 'bg-indigo-100' : 'bg-emerald-100'}`}>
                        {item.source_type === 'bank'
                          ? <Building className="h-4 w-4 text-indigo-600" />
                          : <Home className="h-4 w-4 text-emerald-600" />
                        }
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.source_contact}</p>
                        <p className="text-xs text-gray-500">{item.source_name}</p>
                      </div>
                    </div>
                    <a href={`mailto:${item.source_email}`} className="text-xs text-blue-600 hover:underline">{item.source_email}</a>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setReviewItem(item); }}
                    className="inline-flex items-center px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-blue-800 transition-colors"
                  >
                    <ClipboardCheck className="h-4 w-4 mr-1.5" />
                    Review
                  </button>
                  <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                    <MessageSquare className="h-4 w-4 mr-1.5" />
                    Reply
                  </button>
                  {item.case_number === 'NEW' && (
                    <button className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors">
                      <FileText className="h-4 w-4 mr-1.5" />
                      Create Case
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); archiveItem(item.id); setExpandedItem(null); }}
                    className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Archive className="h-4 w-4 mr-1.5" />
                    Archive
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleRead(item.id); }}
                    className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Eye className="h-4 w-4 mr-1.5" />
                    Mark {item.is_read ? 'Unread' : 'Read'}
                  </button>
                  <div className="ml-auto text-xs text-gray-400 flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(item.received_at).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Inbox className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Inbox Empty</h3>
          <p className="text-gray-500">
            {searchTerm || filterSource !== 'all' || filterCategory !== 'all' || filterRead !== 'all'
              ? 'No items match your current filters'
              : 'No files or messages received from banks or estate agents yet'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default BankApplicationsSection;
