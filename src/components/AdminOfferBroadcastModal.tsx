import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  Users,
  Search,
  Sparkles,
  Smartphone,
  Tag,
  Send,
  Loader2,
  RefreshCw,
  Zap,
  ShieldCheck,
  FileCheck,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Layers
} from 'lucide-react';
import { OfferCoupon, WhatsAppBroadcastLog, WhatsAppBroadcastRecipient } from '../types';
import { useSalon } from '../context/SalonContext';

interface AdminOfferBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  offer: OfferCoupon | null;
  broadcastResult: WhatsAppBroadcastLog | null;
  onBroadcastResultUpdated?: (result: WhatsAppBroadcastLog) => void;
  onShowToast?: (message: string) => void;
}

export const AdminOfferBroadcastModal: React.FC<AdminOfferBroadcastModalProps> = ({
  isOpen,
  onClose,
  offer,
  broadcastResult,
  onBroadcastResultUpdated,
  onShowToast
}) => {
  const { customers, users, appointments, inquiries } = useSalon();
  const [currentResult, setCurrentResult] = useState<WhatsAppBroadcastLog | null>(broadcastResult);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [copiedNumbers, setCopiedNumbers] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editableTemplate, setEditableTemplate] = useState('');

  // Multi-client dispatch state
  const [isSendingCloud, setIsSendingCloud] = useState(false);
  const [sentClientIds, setSentClientIds] = useState<Set<string>>(new Set());
  const [statusNotice, setStatusNotice] = useState<{ type: 'success' | 'warning' | 'info'; text: string } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showConfirmationScreen, setShowConfirmationScreen] = useState(false);

  const collectClientContacts = () => {
    const list: any[] = [];
    (customers || []).forEach(c => list.push({ id: c.id, name: c.name, phone: c.phone, source: 'customer' }));
    (users || []).forEach(u => {
      if (u.role !== 'ADMIN') list.push({ id: u.id, name: u.name, phone: u.phone, role: u.role, source: 'user' });
    });
    (appointments || []).forEach(a => list.push({ id: `apt-${a.id}`, name: a.clientName, phone: a.clientPhone, source: 'appointment' }));
    (inquiries || []).forEach(inq => list.push({ id: `inq-${inq.id}`, name: inq.clientName, phone: inq.phone, source: 'customer' }));
    return list;
  };

  useEffect(() => {
    if (broadcastResult) {
      setCurrentResult(broadcastResult);
      setEditableTemplate(broadcastResult.messageText || '');
      const sentSet = new Set<string>();
      if ((broadcastResult as any).deliveryMode === 'WHATSAPP_CLOUD_API') {
        broadcastResult.recipients?.forEach(r => {
          if (r.status === 'SENT') sentSet.add(r.id);
        });
      }
      setSentClientIds(sentSet);
      setStatusNotice(null);
      setShowConfirmationScreen(false);
    }
  }, [broadcastResult]);

  if (!isOpen || !offer) return null;

  const recipients = currentResult?.recipients || broadcastResult?.recipients || [];
  const totalCount = recipients.length;
  const sentCount = sentClientIds.size;
  const pendingRecipients = recipients.filter(r => !sentClientIds.has(r.id));
  const nextPendingRecipient = pendingRecipients[0];
  const isAllSent = totalCount > 0 && sentCount >= totalCount;
  const progressPercent = totalCount > 0 ? Math.round((sentCount / totalCount) * 100) : 0;
  const deliveryMode = (currentResult as any)?.deliveryMode || 'WHATSAPP_LINK_QUEUE';

  const filteredRecipients = recipients.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return r.name.toLowerCase().includes(q) || r.phone.includes(q);
  });

  const buildPersonalizedWhatsAppUrl = (rec: WhatsAppBroadcastRecipient, useWeb = false) => {
    if (!editableTemplate.trim()) {
      return useWeb ? rec.webWhatsappUrl : rec.whatsappUrl;
    }
    const text = editableTemplate.replace(/\{\{\s*client_name\s*\}\}/gi, rec.name || 'Valued Client');
    const encoded = encodeURIComponent(text);
    return useWeb
      ? `https://web.whatsapp.com/send?phone=${rec.formattedPhone}&text=${encoded}`
      : `https://api.whatsapp.com/send?phone=${rec.formattedPhone}&text=${encoded}`;
  };

  const markRecipientAsSent = (rec: WhatsAppBroadcastRecipient) => {
    setSentClientIds(prev => {
      const next = new Set(prev);
      next.add(rec.id);
      return next;
    });
    if (currentResult?.id) {
      fetch(`/api/offers/broadcast-logs/${currentResult.id}/recipient`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: rec.id, phone: rec.phone, status: 'SENT' })
      }).catch(() => {});
    }
  };

  const handleCopyMessage = () => {
    const textToCopy = (editableTemplate || currentResult?.messageText || '').replace(/\{\{\s*client_name\s*\}\}/gi, 'Valued Client');
    if (textToCopy) {
      navigator.clipboard?.writeText(textToCopy);
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2000);
    }
  };

  const handleCopyNumbers = () => {
    const phones = recipients.map(r => r.formattedPhone || `91${r.phone}`).join(', ');
    navigator.clipboard?.writeText(phones);
    setCopiedNumbers(true);
    setTimeout(() => setCopiedNumbers(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(offer.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Send single next pending client directly via WhatsApp (zero popup blocking) & advance queue
  const handleSendNextClient = () => {
    if (!nextPendingRecipient) return;
    const waUrl = buildPersonalizedWhatsAppUrl(nextPendingRecipient, false);
    const openedWin = window.open(waUrl, '_blank', 'noopener,noreferrer');
    if (openedWin) {
      markRecipientAsSent(nextPendingRecipient);
      const remaining = pendingRecipients.length - 1;
      setStatusNotice({
        type: 'success',
        text: remaining > 0
          ? `Opened WhatsApp for ${nextPendingRecipient.name} (+91 ${nextPendingRecipient.phone}). ${remaining} client(s) left in queue.`
          : `All ${totalCount} clients opened in WhatsApp!`
      });
      if (remaining === 0 && onShowToast) {
        onShowToast(`WhatsApp offer ${offer.code} opened for all ${totalCount} clients.`);
      }
    } else {
      setStatusNotice({
        type: 'warning',
        text: 'Browser blocked the new tab. Click "Send" directly on a client row below or allow popups for this site.'
      });
    }
  };

  // Open a batch of up to 5 pending clients directly from click gesture
  const handleOpenBatchWhatsApp = () => {
    if (pendingRecipients.length === 0) return;
    const batch = pendingRecipients.slice(0, 5);
    let openedCount = 0;
    for (const rec of batch) {
      const waUrl = buildPersonalizedWhatsAppUrl(rec, false);
      const win = window.open(waUrl, '_blank', 'noopener,noreferrer');
      if (win) {
        openedCount += 1;
        markRecipientAsSent(rec);
      }
    }

    if (openedCount === 0) {
      setStatusNotice({
        type: 'warning',
        text: 'Browser popup blocker prevented multi-tab WhatsApp launch. Allow popups or use the 1-by-1 "Send Next Client" queue button.'
      });
    } else if (openedCount < batch.length) {
      setStatusNotice({
        type: 'info',
        text: `Opened ${openedCount} of ${batch.length} WhatsApp tabs (browser blocked remaining popups). Click "Send Next Client" or allow popups.`
      });
    } else {
      setStatusNotice({
        type: 'success',
        text: `Launched WhatsApp for ${openedCount} clients! (${pendingRecipients.length - openedCount} remaining)`
      });
    }
  };

  // Trigger Cloud API broadcast or refresh dynamic client directory from Firestore + Backend
  const handleSyncAndPrepareCloud = async () => {
    if (!offer) return;
    setIsSendingCloud(true);
    setStatusNotice(null);

    try {
      const response = await fetch(`/api/offers/${offer.id}/broadcast-whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offer,
          clientContacts: collectClientContacts(),
          customMessage: editableTemplate,
          appOrigin: typeof window !== 'undefined' ? window.location.origin : ''
        })
      });
      const data = await response.json();
      if (data.success && data.broadcast) {
        setCurrentResult(data.broadcast);
        if (data.broadcast.deliveryMode === 'WHATSAPP_CLOUD_API') {
          const sentSet = new Set<string>();
          (data.broadcast.recipients || []).forEach((r: WhatsAppBroadcastRecipient) => {
            if (r.status === 'SENT') sentSet.add(r.id);
          });
          setSentClientIds(sentSet);
          setShowConfirmationScreen(true);
          setStatusNotice({
            type: 'success',
            text: `Sent offer "${offer.code}" automatically via WhatsApp Cloud API to ${sentSet.size} clients.`
          });
        } else {
          setStatusNotice({
            type: 'info',
            text: `Synced ${data.broadcast.recipients?.length || 0} unique clients. Use "Send Next Client" or "Open Next 5 in WhatsApp" below to message them.`
          });
        }
        if (onBroadcastResultUpdated) {
          onBroadcastResultUpdated(data.broadcast);
        }
      }
    } catch (err: any) {
      setStatusNotice({
        type: 'warning',
        text: err?.message || 'Could not refresh client list.'
      });
    } finally {
      setIsSendingCloud(false);
    }
  };

  const handleRefreshClients = async () => {
    if (!offer) return;
    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/offers/${offer.id}/broadcast-preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offer,
          clientContacts: collectClientContacts(),
          customMessage: editableTemplate,
          appOrigin: typeof window !== 'undefined' ? window.location.origin : ''
        })
      });
      const data = await response.json();
      if (data.success && data.broadcast) {
        setCurrentResult(data.broadcast);
        setStatusNotice({
          type: 'info',
          text: `Refreshed directory: ${data.broadcast.recipients?.length || 0} unique client numbers ready.`
        });
        if (onBroadcastResultUpdated) {
          onBroadcastResultUpdated(data.broadcast);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const discountText = offer.discountPercent
    ? `${offer.discountPercent}% OFF`
    : (offer.discountAmount ? `₹${offer.discountAmount} OFF` : 'Special Discount');

  const userCount = recipients.filter(r => r.source === 'user').length;
  const crmCount = recipients.filter(r => r.source === 'customer').length;
  const aptCount = recipients.filter(r => r.source === 'appointment').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden my-6 text-left flex flex-col max-h-[92vh]">

        {/* Top Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-zinc-800/80 bg-zinc-900/60 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold shadow-md shadow-emerald-500/10 shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Multi-Client WhatsApp Dispatcher
                </span>
                <span className="text-xs text-zinc-400 font-medium">
                  {totalCount} Dynamic Client(s) • {sentCount} Sent
                </span>
              </div>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-zinc-100 mt-1">
                Offer WhatsApp Broadcasting
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {showConfirmationScreen && (
              <button
                onClick={() => setShowConfirmationScreen(false)}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>View Client List</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-zinc-300">

          {showConfirmationScreen ? (
            <div className="space-y-5 animate-in fade-in">
              <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950/80 via-zinc-900 to-teal-950/70 border-2 border-emerald-500/60 shadow-2xl space-y-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-7 h-7 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">
                      Campaign Log: {sentCount} of {totalCount} Clients Dispatched
                    </h4>
                    <p className="text-xs text-emerald-300/90 mt-0.5">
                      Offer <strong>{offer.code}</strong> ({discountText}) • Sources: {userCount} Users, {crmCount} CRM, {aptCount} Bookings.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden divide-y divide-zinc-800/80 max-h-72 overflow-y-auto">
                {recipients.map((rec, idx) => {
                  const isSent = sentClientIds.has(rec.id);
                  return (
                    <div key={rec.id || idx} className="p-3.5 flex items-center justify-between gap-3">
                      <div className="min-w-0 truncate">
                        <div className="font-semibold text-zinc-100 flex items-center gap-2">
                          <span>{rec.name}</span>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                            isSent ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}>
                            {isSent ? 'OPENED / SENT' : 'PENDING'}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-zinc-400">+91 {rec.phone}</div>
                      </div>
                      <a
                        href={buildPersonalizedWhatsAppUrl(rec, false)}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => markRecipientAsSent(rec)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600 border border-emerald-500/40 text-emerald-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition"
                      >
                        <Send className="w-3 h-3" />
                        <span>{isSent ? 'Resend' : 'Send Now'}</span>
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              {/* Offer Summary Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-zinc-900 to-amber-950/30 border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-extrabold text-amber-400 bg-zinc-950 px-3 py-1 rounded-xl border border-amber-500/40 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-amber-400" />
                      {offer.code}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30">
                      {discountText}
                    </span>
                    <button onClick={handleCopyCode} className="text-zinc-400 hover:text-zinc-200 p-1 cursor-pointer" title="Copy Code">
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <h4 className="font-bold text-sm text-zinc-100">{offer.title}</h4>
                  <p className="text-[11px] text-zinc-400 max-w-xl">{offer.description}</p>
                </div>

                <div className="shrink-0 text-right space-y-1 border-t sm:border-t-0 sm:border-l border-zinc-800 pt-2 sm:pt-0 sm:pl-4">
                  <div className="text-[10px] text-zinc-400">Min Order: <strong className="text-zinc-200">₹{offer.minBookingAmount || 0}</strong></div>
                  <div className="text-[10px] text-zinc-400">Valid Till: <strong className="text-zinc-200">{offer.validTill || offer.expiryDate || '2026-12-31'}</strong></div>
                  <div className="text-[10px] text-emerald-400 font-semibold">
                    {userCount} Users • {crmCount} CRM • {aptCount} Bookings
                  </div>
                </div>
              </div>

              {/* Status Feedback Banner */}
              {statusNotice && (
                <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                  statusNotice.type === 'success'
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : statusNotice.type === 'warning'
                    ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-200'
                }`}>
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{statusNotice.text}</span>
                </div>
              )}

              {/* MULTI-CLIENT DISPATCH QUEUE BAR */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-zinc-900 to-teal-950/60 border border-emerald-500/40 shadow-lg space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                      <span className="font-bold text-sm text-zinc-100">
                        Multi-Client WhatsApp Queue ({sentCount} / {totalCount} Sent)
                      </span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                        {pendingRecipients.length} Remaining
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      {deliveryMode === 'WHATSAPP_CLOUD_API'
                        ? 'WhatsApp Cloud API is configured for automated server dispatch.'
                        : 'Click "Send Next in WhatsApp" to open each client chat pre-filled cleanly without popup blocking, or launch 5 tabs at once.'}
                    </p>
                  </div>

                  <button
                    onClick={handleRefreshClients}
                    disabled={isRefreshing || isSendingCloud}
                    className="px-3 py-2 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                    title="Sync all customers, registered users & appointments"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
                    <span>Sync Clients</span>
                  </button>
                </div>

                {/* Real Progress Bar */}
                {totalCount > 0 && (
                  <div className="space-y-1">
                    <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 rounded-full"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                      <span>Sent / Opened: {sentCount}</span>
                      <span>{progressPercent}% Complete</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {totalCount === 0 ? (
                  <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 text-amber-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>No client phone numbers found yet. Add clients via Booking, CRM, or Sign-Up, then click Sync Clients.</span>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2.5">
                    {nextPendingRecipient ? (
                      <button
                        type="button"
                        onClick={handleSendNextClient}
                        className="flex-1 min-w-[220px] px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                        <span>
                          Send Next: {nextPendingRecipient.name} (+91 {nextPendingRecipient.phone})
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowConfirmationScreen(true)}
                        className="flex-1 min-w-[220px] px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>All {totalCount} Clients Sent — View Report</span>
                      </button>
                    )}

                    {pendingRecipients.length > 1 && (
                      <button
                        type="button"
                        onClick={handleOpenBatchWhatsApp}
                        className="px-4 py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                        title="Open next 5 pending clients in WhatsApp tabs (requires browser popups allowed)"
                      >
                        <Layers className="w-4 h-4" />
                        <span>Open Next {Math.min(5, pendingRecipients.length)} Tabs</span>
                      </button>
                    )}

                    {deliveryMode === 'WHATSAPP_CLOUD_API' && (
                      <button
                        type="button"
                        onClick={handleSyncAndPrepareCloud}
                        disabled={isSendingCloud}
                        className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isSendingCloud ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                        <span>Auto-Send via Cloud API</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Broadcast Quick Copy Tools */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleCopyMessage}
                  className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 flex items-center justify-between gap-3 text-left transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                      <Copy className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-zinc-200 text-xs">Copy Promo Message</div>
                      <div className="text-[10px] text-zinc-400">Paste into any WhatsApp Broadcast group</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 shrink-0">
                    {copiedMessage ? 'Copied!' : 'Copy'}
                  </span>
                </button>

                <button
                  onClick={handleCopyNumbers}
                  className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 flex items-center justify-between gap-3 text-left transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-zinc-200 text-xs">Copy All Numbers ({totalCount})</div>
                      <div className="text-[10px] text-zinc-400">Comma-separated 91-prefixed list</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-400 shrink-0">
                    {copiedNumbers ? 'Copied!' : 'Copy List'}
                  </span>
                </button>
              </div>

              {/* Editable Message Template */}
              <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-300 text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Customize Broadcast Message (use {'{{client_name}}'} for auto-personalization)</span>
                  </span>
                </div>
                <textarea
                  rows={5}
                  value={editableTemplate}
                  onChange={(e) => setEditableTemplate(e.target.value)}
                  className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-emerald-400 font-mono text-[11px] leading-relaxed focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Dynamic Client Directory & 1-Click WhatsApp Dispatch */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <h4 className="font-bold text-sm text-zinc-200">
                      Target Clients ({filteredRecipients.length} of {totalCount})
                    </h4>
                  </div>

                  <div className="relative w-full sm:w-60">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Search client or phone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden max-h-64 overflow-y-auto">
                  {filteredRecipients.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500">
                      <p>No client contacts found matching your search.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-800/80">
                      {filteredRecipients.map((rec, idx) => {
                        const isSent = sentClientIds.has(rec.id);
                        return (
                          <div
                            key={rec.id || `rec-${idx}`}
                            className={`p-3.5 sm:px-4 flex items-center justify-between gap-3 transition-colors ${
                              isSent ? 'bg-emerald-950/20' : 'hover:bg-zinc-800/40'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-8 h-8 rounded-full border font-bold flex items-center justify-center text-xs shrink-0 ${
                                isSent
                                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                                  : 'bg-zinc-800 border-zinc-700 text-zinc-300'
                              }`}>
                                {isSent ? <Check className="w-4 h-4 text-emerald-400" /> : rec.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0 truncate">
                                <div className="font-semibold text-zinc-200 truncate flex items-center gap-1.5">
                                  <span>{rec.name}</span>
                                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/60 font-mono">
                                    {rec.source === 'customer' ? 'CRM' : rec.source === 'appointment' ? 'Booking' : 'User'}
                                  </span>
                                  {isSent && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
                                      Sent
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] font-mono text-zinc-400">+91 {rec.phone}</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <a
                                href={buildPersonalizedWhatsAppUrl(rec, false)}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => markRecipientAsSent(rec)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                              >
                                <Send className="w-3 h-3" />
                                <span>{isSent ? 'Resend' : 'Send'}</span>
                              </a>

                              <a
                                href={buildPersonalizedWhatsAppUrl(rec, true)}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => markRecipientAsSent(rec)}
                                className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                                title="Open in WhatsApp Web"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-zinc-800/80 bg-zinc-900/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-zinc-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Live sync active across CRM customers, bookings, inquiries &amp; signed-up users.
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {sentCount > 0 && !showConfirmationScreen && (
              <button
                onClick={() => setShowConfirmationScreen(true)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Report ({sentCount}/{totalCount})</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs cursor-pointer transition-colors"
            >
              Done &amp; Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
