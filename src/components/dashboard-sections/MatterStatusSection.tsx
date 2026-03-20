import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Link2, CheckCircle, Clock, RefreshCw, ChevronDown, ChevronUp,
  User, Users, Zap, FileText, Eye, Timer
} from 'lucide-react';
import * as casesService from '../../services/cases.service';
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription';
import type { Case, CaseShareToken } from '../../types/database';
import type { LinkActivity } from '../../services/cases.service';

interface MatterStatusProps {
  cases: Case[];
  orgId: string;
  onViewTransaction?: (transactionId: string, transactionData: any) => void;
}

interface CaseWithTracking {
  case_: Case;
  tokens: CaseShareToken[];
  activity: LinkActivity[];
}

// ── helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function humanDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function totalDuration(activity: LinkActivity[]) {
  const opened = activity.find(a => a.event_type === 'link_opened');
  if (!opened) return null;
  const submitted = activity.find(a => a.event_type === 'submitted');
  const seconds = Math.round(
    ((submitted ? new Date(submitted.created_at) : new Date()).getTime() - new Date(opened.created_at).getTime()) / 1000
  );
  return humanDuration(seconds);
}

// ── Party status pill ────────────────────────────────────────────────────────

function PartyStatus({ token, activity, role }: { token: CaseShareToken | undefined; activity: LinkActivity[]; role: string }) {
  const isSubmitted = !!token?.used_at;
  const isOpened = activity.some(a => a.event_type === 'link_opened');
  const isSent = !!token;

  const label = isSubmitted ? 'Submitted' : isOpened ? 'In Progress' : isSent ? 'Link Sent' : 'Not Sent';
  const color = isSubmitted
    ? 'bg-green-100 text-green-800 border-green-200'
    : isOpened ? 'bg-blue-100 text-blue-800 border-blue-200'
    : isSent ? 'bg-amber-100 text-amber-800 border-amber-200'
    : 'bg-gray-100 text-gray-500 border-gray-200';
  const dot = isSubmitted ? 'bg-green-500' : isOpened ? 'bg-blue-500 animate-pulse' : isSent ? 'bg-amber-500' : 'bg-gray-400';

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {role}: {label}
    </span>
  );
}

// ── Activity timeline for one party ─────────────────────────────────────────

function ActivityTimeline({ token, activity, role }: { token: CaseShareToken | undefined; activity: LinkActivity[]; role: 'buyer' | 'seller' }) {
  const roleActivity = activity.filter(a => a.role === role);
  const opened = roleActivity.find(a => a.event_type === 'link_opened');
  const submitted = token?.used_at ? new Date(token.used_at) : null;

  if (!token) {
    return <div className="text-xs text-gray-400 italic py-1">No link generated yet.</div>;
  }

  // Build timeline events
  const events: { label: string; time: string; icon: React.ReactNode; color: string }[] = [];

  events.push({
    label: 'Link sent',
    time: `${formatDate(token.created_at)} ${formatTime(token.created_at)}`,
    icon: <Link2 className="h-3 w-3" />,
    color: 'bg-gray-400',
  });

  if (opened) {
    events.push({
      label: 'Link opened',
      time: `${formatDate(opened.created_at)} · ${formatTime(opened.created_at)}`,
      icon: <Eye className="h-3 w-3" />,
      color: 'bg-blue-500',
    });
  }

  // Deduplicate steps by step_number, keep latest visit
  const latestPerStep = new Map<number, LinkActivity>();
  roleActivity
    .filter(a => a.event_type === 'step_viewed' && a.step_number != null)
    .forEach(s => latestPerStep.set(s.step_number!, s));

  Array.from(latestPerStep.values())
    .sort((a, b) => (a.step_number ?? 0) - (b.step_number ?? 0))
    .forEach(step => events.push({
      label: `Step ${step.step_number}: ${step.step_name || 'Page viewed'}${step.duration_seconds ? ` · ${humanDuration(step.duration_seconds)}` : ''}`,
      time: `${formatDate(step.created_at)} · ${formatTime(step.created_at)}`,
      icon: <FileText className="h-3 w-3" />,
      color: 'bg-indigo-400',
    }));

  if (submitted) {
    events.push({
      label: 'Form submitted',
      time: `${formatDate(submitted.toISOString())} · ${formatTime(submitted.toISOString())}`,
      icon: <CheckCircle className="h-3 w-3" />,
      color: 'bg-green-500',
    });
  } else if (opened) {
    events.push({ label: 'Awaiting submission…', time: '', icon: <Timer className="h-3 w-3" />, color: 'bg-amber-400' });
  }

  const duration = totalDuration(roleActivity);

  return (
    <div>
      <ol className="relative ml-3 border-l border-gray-200 space-y-3">
        {events.map((ev, i) => (
          <li key={i} className="ml-4">
            <span className={`absolute -left-1.5 mt-0.5 flex h-3 w-3 items-center justify-center rounded-full ${ev.color} text-white`}>
              {ev.icon}
            </span>
            <p className="text-xs font-medium text-gray-800 leading-tight">{ev.label}</p>
            {ev.time && <p className="text-xs text-gray-400">{ev.time}</p>}
          </li>
        ))}
      </ol>
      {duration && (
        <div className="mt-2 ml-3 flex items-center gap-1 text-xs text-gray-500">
          <Timer className="h-3 w-3" />
          Total time: <span className="font-semibold text-gray-700">{duration}</span>
        </div>
      )}
    </div>
  );
}

// ── Party panel (buyer or seller column in expanded card) ────────────────────

const PARTY_COLORS = {
  buyer: { bg: 'bg-blue-100', text: 'text-blue-600' },
  seller: { bg: 'bg-green-100', text: 'text-green-600' },
};

function PartyPanel({ role, token, activity }: { role: 'buyer' | 'seller'; token: CaseShareToken | undefined; activity: LinkActivity[] }) {
  const colors = PARTY_COLORS[role];
  const label = role === 'buyer' ? 'Buyer' : 'Seller';
  return (
    <div className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-6 h-6 rounded-full ${colors.bg} flex items-center justify-center`}>
          <User className={`h-3.5 w-3.5 ${colors.text}`} />
        </div>
        <span className="text-sm font-semibold text-gray-800">{label}</span>
        {token?.used_at && (
          <span className="ml-auto text-xs text-green-600 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Submitted {formatDate(token.used_at)}
          </span>
        )}
      </div>
      <ActivityTimeline token={token} activity={activity} role={role} />
    </div>
  );
}

// ── Case card ────────────────────────────────────────────────────────────────

function CaseTrackingCard({ item, onView }: { item: CaseWithTracking; onView?: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const { case_, tokens, activity } = item;

  const buyerToken = tokens.find(t => t.role === 'buyer');
  const sellerToken = tokens.find(t => t.role === 'seller');
  const buyerActivity = activity.filter(a => a.role === 'buyer');
  const sellerActivity = activity.filter(a => a.role === 'seller');
  const bothSubmitted = !!buyerToken?.used_at && !!sellerToken?.used_at;
  const lastEvent = activity.length > 0
    ? activity.reduce((a, b) => a.created_at > b.created_at ? a : b)
    : null;

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-shadow hover:shadow-md ${bothSubmitted ? 'border-green-200' : activity.length > 0 ? 'border-blue-200' : 'border-gray-200'}`}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-primary text-sm">{case_.case_number}</span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-sm text-gray-600 truncate">{case_.client_name}</span>
              {bothSubmitted && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                  <CheckCircle className="h-3 w-3" /> Ready
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5 capitalize">{case_.case_type?.replace(/_/g, ' ')} · {case_.priority} priority</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {lastEvent && <span className="text-xs text-gray-400 hidden sm:block">{timeAgo(lastEvent.created_at)}</span>}
            {onView && (
              <button onClick={onView} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View case">
                <Eye className="h-4 w-4" />
              </button>
            )}
            <button onClick={() => setExpanded(v => !v)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <PartyStatus token={buyerToken} activity={buyerActivity} role="Buyer" />
          <PartyStatus token={sellerToken} activity={sellerActivity} role="Seller" />
        </div>

        {activity.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-amber-500" />
              {activity.filter(a => a.event_type === 'step_viewed').length} pages visited
            </span>
            {buyerToken?.used_at && (
              <span className="flex items-center gap-1">
                <Timer className="h-3 w-3 text-blue-500" />
                Buyer: {totalDuration(buyerActivity) ?? '—'}
              </span>
            )}
            {sellerToken?.used_at && (
              <span className="flex items-center gap-1">
                <Timer className="h-3 w-3 text-green-500" />
                Seller: {totalDuration(sellerActivity) ?? '—'}
              </span>
            )}
          </div>
        )}
      </div>

      {expanded && (
        <div className="border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
          <PartyPanel role="buyer" token={buyerToken} activity={activity} />
          <PartyPanel role="seller" token={sellerToken} activity={activity} />
        </div>
      )}
    </div>
  );
}

// ── Live activity feed ───────────────────────────────────────────────────────

function LiveFeed({ activity, cases }: { activity: LinkActivity[]; cases: Case[] }) {
  const recent = activity.slice(0, 12);
  if (recent.length === 0) return null;

  const caseMap = new Map(cases.map(c => [c.id, c]));

  const eventLabel = (ev: LinkActivity) => {
    const party = ev.role === 'buyer' ? 'Buyer' : 'Seller';
    switch (ev.event_type) {
      case 'link_opened': return `${party} opened their link`;
      case 'step_viewed': return `${party} viewed ${ev.step_name || `step ${ev.step_number}`}`;
      case 'submitted': return `${party} submitted their form`;
      default: return ev.event_type;
    }
  };

  const eventColor = (ev: LinkActivity) => {
    switch (ev.event_type) {
      case 'link_opened': return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'step_viewed': return 'bg-indigo-50 border-indigo-200 text-indigo-700';
      case 'submitted': return 'bg-green-50 border-green-200 text-green-700';
      default: return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <h3 className="text-sm font-semibold text-gray-800">Live Activity Feed</h3>
        </div>
        <span className="text-xs text-gray-400">{activity.length} events</span>
      </div>
      <ul className="divide-y divide-gray-50">
        {recent.map(ev => {
          const case_ = caseMap.get(ev.case_id);
          return (
            <li key={ev.id} className="px-5 py-3 flex items-center gap-3">
              <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${eventColor(ev)}`}>
                {ev.role === 'buyer' ? 'B' : 'S'}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-800 truncate">{eventLabel(ev)}</p>
                {case_ && <p className="text-xs text-gray-400 truncate">{case_.case_number} · {case_.client_name}</p>}
              </div>
              <span className="shrink-0 text-xs text-gray-400">{timeAgo(ev.created_at)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ── Summary stats ────────────────────────────────────────────────────────────

function StatsBar({ items }: { items: CaseWithTracking[] }) {
  const totalCases = items.length;
  const casesWithTokens = items.filter(i => i.tokens.length > 0).length;
  const completedLinks = items.reduce((acc, i) => acc + i.tokens.filter(t => !!t.used_at).length, 0);
  const pendingLinks = items.reduce((acc, i) => acc + i.tokens.filter(t => !t.used_at).length, 0);
  const activeNow = items.filter(i =>
    i.activity.some(a => Date.now() - new Date(a.created_at).getTime() < 15 * 60 * 1000)
  ).length;

  const stats = [
    { label: 'Total Cases',  value: totalCases,        color: 'text-gray-800',  bg: 'bg-gray-50',  icon: <FileText  className="h-4 w-4 text-gray-500"  /> },
    { label: 'Links Sent',   value: casesWithTokens*2, color: 'text-blue-700',  bg: 'bg-blue-50',  icon: <Link2     className="h-4 w-4 text-blue-500"  /> },
    { label: 'Submitted',    value: completedLinks,    color: 'text-green-700', bg: 'bg-green-50', icon: <CheckCircle className="h-4 w-4 text-green-500" /> },
    { label: 'Awaiting',     value: pendingLinks,      color: 'text-amber-700', bg: 'bg-amber-50', icon: <Clock     className="h-4 w-4 text-amber-500"  /> },
    { label: 'Active Now',   value: activeNow,         color: 'text-indigo-700',bg: 'bg-indigo-50',icon: <Zap      className="h-4 w-4 text-indigo-500" /> },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {stats.map(s => (
        <div key={s.label} className={`${s.bg} rounded-xl p-4 flex flex-col gap-1`}>
          <div className="flex items-center justify-between">{s.icon}<span className={`text-2xl font-bold ${s.color}`}>{s.value}</span></div>
          <p className="text-xs text-gray-500">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const MatterStatusSection: React.FC<MatterStatusProps> = ({ cases, orgId, onViewTransaction }) => {
  const [tokensData, setTokensData] = useState<CaseShareToken[]>([]);
  const [allActivity, setAllActivity] = useState<LinkActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'pending' | 'complete'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // loadData only depends on orgId — cases are joined in useMemo below
  const loadData = useCallback(async () => {
    if (!orgId) { setLoading(false); return; }
    try {
      const [activity, tokens] = await Promise.all([
        casesService.getAllLinkActivity(orgId),
        casesService.getTokensForOrg(orgId),
      ]);
      setAllActivity(activity);
      setTokensData(tokens);
    } catch (e) {
      console.error('MatterStatus load failed:', e);
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }, [orgId]);

  useEffect(() => { loadData(); }, [loadData]);

  // Real-time: re-fetch when activity is inserted or tokens are updated
  useRealtimeSubscription(
    { table: 'case_link_activity', event: 'INSERT' },
    loadData,
    !!orgId
  );
  useRealtimeSubscription(
    { table: 'case_share_tokens', event: 'UPDATE' },
    loadData,
    !!orgId
  );

  // Build items from cases + fetched tokens/activity (no extra queries per case)
  const items = useMemo((): CaseWithTracking[] => {
    const tokensByCaseId = new Map<string, CaseShareToken[]>();
    tokensData.forEach(t => {
      const arr = tokensByCaseId.get(t.case_id) ?? [];
      arr.push(t);
      tokensByCaseId.set(t.case_id, arr);
    });
    return cases
      .map(c => ({
        case_: c,
        tokens: tokensByCaseId.get(c.id) ?? [],
        activity: allActivity.filter(a => a.case_id === c.id),
      }))
      .sort((a, b) => {
        const aLast = a.activity[0]?.created_at ?? a.case_.updated_at;
        const bLast = b.activity[0]?.created_at ?? b.case_.updated_at;
        return new Date(bLast).getTime() - new Date(aLast).getTime();
      });
  }, [cases, tokensData, allActivity]);

  const filteredItems = useMemo(() => items.filter(item => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term ||
      item.case_.case_number?.toLowerCase().includes(term) ||
      item.case_.client_name?.toLowerCase().includes(term);
    const buyerDone = !!item.tokens.find(t => t.role === 'buyer')?.used_at;
    const sellerDone = !!item.tokens.find(t => t.role === 'seller')?.used_at;
    switch (filter) {
      case 'active':   return matchesSearch && item.activity.length > 0 && !(buyerDone && sellerDone);
      case 'pending':  return matchesSearch && item.tokens.length > 0 && item.activity.length === 0;
      case 'complete': return matchesSearch && buyerDone && sellerDone;
      default:         return matchesSearch;
    }
  }), [items, searchTerm, filter]);

  const handleViewCase = (item: CaseWithTracking) => {
    if (!onViewTransaction) return;
    const c = item.case_;
    onViewTransaction(c.id, {
      transactionType: c.case_type,
      sellingPrice: c.property?.price?.toString() || c.buyer_data?.sellingPrice || '0',
      clientName: c.client_name,
      buyerDetails: c.buyer_data || null,
      sellerDetails: c.seller_data || null,
      buyerName: c.buyer_data?.clientName || c.client_name,
      sellerName: c.seller_data?.clientName || 'Not specified',
      uploadedDocuments: c.documents || [],
      propertyAddress: c.property?.address || '',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <RefreshCw className="h-5 w-5 animate-spin mr-2" />
        Loading matter tracking…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-serif font-bold text-primary">Matter Status</h2>
          <p className="text-sm text-gray-500 mt-0.5">Real-time tracking of shared links, client progress, and submission status.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>Updated {timeAgo(lastRefresh.toISOString())}</span>
          <button onClick={() => { setLoading(true); loadData(); }} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <StatsBar items={items} />

      {allActivity.length > 0 && <LiveFeed activity={allActivity} cases={cases} />}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <input
            type="text"
            placeholder="Search by case number or client…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
          />
          <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {(['all', 'active', 'pending', 'complete'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${filter === f ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No cases match this filter.</p>
          <p className="text-sm mt-1">Create a case with share links to start tracking progress.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map(item => (
            <CaseTrackingCard
              key={item.case_.id}
              item={item}
              onView={onViewTransaction ? () => handleViewCase(item) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MatterStatusSection;
