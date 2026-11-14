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
  RefreshCw,
  AlertCircle,
  Link2,
  UserPlus
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
  const { settings, updateSettings, customers, users, appointments, inquiries } = useSalon();
  const [currentResult, setCurrentResult] = useState<WhatsAppBroadcastLog | null>(broadcastResult);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [copiedNumbers, setCopiedNumbers] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editableGroupMessage, setEditableGroupMessage] = useState('');

  // Salon WhatsApp Community / Group config
  const [communityName, setCommunityName] = useState(
    settings.whatsappCommunityName || 'Modern Unisex Salon VIP Offers Community'
  );
  const [communityUrl, setCommunityUrl] = useState(settings.whatsappCommunityUrl || '');
  const [isSavingGroup, setIsSavingGroup] = useState(false);
  const [showInviteSection, setShowInviteSection] = useState(false);
  const [invitedClientIds, setInvitedClientIds] = useState<Set<string>>(new Set());
  const [statusNotice, setStatusNotice] = useState<{ type: 'success' | 'warning' | 'info'; text: string } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setCommunityName(settings.whatsappCommunityName || 'Modern Unisex Salon VIP Offers Community');
    setCommunityUrl(settings.whatsappCommunityUrl || '');
  }, [settings.whatsappCommunityName, settings.whatsappCommunityUrl, isOpen]);

  const discountText = useMemo(() => {
    if (!offer) return 'Special Offer';
    if (offer.discountPercent && Number(offer.discountPercent) > 0) {
      return `${offer.discountPercent}% OFF`;
    }
    if (offer.discountAmount && Number(offer.discountAmount) > 0) {
      return `₹${offer.discountAmount} OFF`;
    }
    return 'Special Salon Discount';
  }, [offer]);

  // Build default clean Group / Community post message
  const buildDefaultGroupOfferMessage = (targetOffer: OfferCoupon, savedGroupUrl?: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const disc = targetOffer.discountPercent
      ? `${targetOffer.discountPercent}% OFF`
      : targetOffer.discountAmount
        ? `₹${targetOffer.discountAmount} OFF`
        : 'Special Discount';
    const lines = [
      `✨ *${(settings.salonName || 'MODERN UNISEX SALON').toUpperCase()} – EXCLUSIVE OFFER* ✨`,
      ``,
      `🎁 *${targetOffer.title}*`,
      `🎟️ Coupon Code: *${targetOffer.code}*`,
      `💥 Discount: *${disc}*`,
      `💰 Min. Booking: ₹${targetOffer.minBookingAmount || 0}`,
      `📅 Valid Till: ${targetOffer.validTill || targetOffer.expiryDate || '2026-12-31'}`,
      ``,
      `${targetOffer.description || 'Book your appointment today and enjoy our signature salon care!'}`,
      ``,
      origin ? `👉 Book Now (${settings.advancePercentage || 10}% Advance): ${origin}` : '',
      `📍 ${settings.address || 'B.N. Gund Complex, Mohol'}`,
      `📞 Helpline: +91 ${settings.phone || '8104026257'}`,
      savedGroupUrl?.trim() ? `💬 Community Link: ${savedGroupUrl.trim()}` : ''
    ].filter(Boolean);
    return lines.join('\n');
  };

  useEffect(() => {
    if (isOpen && offer) {
      setCurrentResult(broadcastResult);
      setEditableGroupMessage(buildDefaultGroupOfferMessage(offer, settings.whatsappCommunityUrl));
      setStatusNotice(null);
      setShowInviteSection(false);
    }
  }, [isOpen, offer?.id, broadcastResult]);

  // Local deduplicated fallback client directory so Invite-to-Group always stays synced even offline
  const recipients: WhatsAppBroadcastRecipient[] = useMemo(() => {
    if (currentResult?.recipients && currentResult.recipients.length > 0) {
      return currentResult.recipients;
    }
    const map = new Map<string, WhatsAppBroadcastRecipient>();
    const addContact = (id: string, name: string, rawPhone: string, source: string) => {
      const digits = (rawPhone || '').replace(/\D/g, '').slice(-10);
      if (digits.length !== 10 || map.has(digits)) return;
      const formattedPhone = `91${digits}`;
      map.set(digits, {
        id,
        name: name || 'Valued Client',
        phone: digits,
        formattedPhone,
        whatsappUrl: `https://api.whatsapp.com/send?phone=${formattedPhone}`,
        webWhatsappUrl: `https://web.whatsapp.com/send?phone=${formattedPhone}`,
        status: 'QUEUED',
        source
      });
    };
    (customers || []).forEach(c => addContact(c.id, c.name, c.phone, 'customer'));
    (users || []).forEach(u => {
      if (u.role !== 'ADMIN') addContact(u.id, u.name, u.phone, 'user');
    });
    (appointments || []).forEach(a => addContact(`apt-${a.id}`, a.clientName, a.clientPhone, 'appointment'));
    (inquiries || []).forEach(inq => addContact(`inq-${inq.id}`, inq.clientName, inq.phone, 'customer'));
    return Array.from(map.values());
  }, [currentResult, customers, users, appointments, inquiries]);

  if (!isOpen || !offer) return null;

  const cleanGroupUrl = communityUrl.trim();
  const hasValidGroupUrl = /^https?:\/\/(chat\.whatsapp\.com|whatsapp\.com\/channel|wa\.me)\//i.test(cleanGroupUrl);
  const totalCount = recipients.length;

  const filteredRecipients = recipients.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return r.name.toLowerCase().includes(q) || r.phone.includes(q);
  });

  // WhatsApp Group / Community picker link (no phone= so user selects their WhatsApp Group / Community once & sends to ALL members simultaneously!)
  const whatsappSendToGroupPickerUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(editableGroupMessage)}`;

  const buildClientInviteUrl = (rec: WhatsAppBroadcastRecipient) => {
    const inviteLines = [
      `Hello ${rec.name || 'Valued Client'} ✨`,
      ``,
      `Join our official *${communityName.trim() || 'Modern Unisex Salon VIP Offers Community'}* on WhatsApp to receive all new festive offers, coupons, and priority slot alerts in one place!`,
      cleanGroupUrl ? `👉 Join Group: ${cleanGroupUrl}` : '',
      ``,
      `🎁 *Latest Offer*: ${offer.title}`,
      `🎟️ Coupon Code: *${offer.code}* (${discountText})`,
      `📞 +91 ${settings.phone || '8104026257'} • Modern Unisex Salon, Mohol`
    ].filter(Boolean).join('\n');
    return `https://api.whatsapp.com/send?phone=${rec.formattedPhone}&text=${encodeURIComponent(inviteLines)}`;
  };

  const handleSaveCommunityLink = async () => {
    setIsSavingGroup(true);
    try {
      await updateSettings({
        whatsappCommunityName: communityName.trim() || 'Modern Unisex Salon VIP Offers Community',
        whatsappCommunityUrl: cleanGroupUrl
      });
      setStatusNotice({
        type: 'success',
        text: cleanGroupUrl
          ? 'WhatsApp Group / Community link saved! Clients can now join it directly and you can post offers to everyone at once.'
          : 'WhatsApp Community settings updated.'
      });
      onShowToast?.('Salon WhatsApp Community link saved!');
    } finally {
      setIsSavingGroup(false);
    }
  };

  const handleCopyMessage = () => {
    if (!editableGroupMessage.trim()) return;
    navigator.clipboard?.writeText(editableGroupMessage).catch(() => {});
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  const handleCopyNumbers = () => {
    const phones = recipients.map(r => r.formattedPhone || `91${r.phone}`).join(', ');
    navigator.clipboard?.writeText(phones).catch(() => {});
    setCopiedNumbers(true);
    setTimeout(() => setCopiedNumbers(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(offer.code).catch(() => {});
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSendToGroupAction = (openedSavedLink: boolean) => {
    navigator.clipboard?.writeText(editableGroupMessage).catch(() => {});
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2500);
    setStatusNotice({
      type: 'success',
      text: openedSavedLink
        ? `Offer "${offer.code}" copied to clipboard & opened your WhatsApp Community! Paste & send to notify all members at once.`
        : `Opened WhatsApp with your "${offer.code}" offer message ready! Select your Salon WhatsApp Group / Community and tap Send to reach everyone at once.`
    });
    onShowToast?.(`Offer ${offer.code} ready to send in WhatsApp Community!`);
  };

  const handleRefreshClients = async () => {
    setIsRefreshing(true);
    try {
      const list: any[] = [];
      (customers || []).forEach(c => list.push({ id: c.id, name: c.name, phone: c.phone, source: 'customer' }));
      (users || []).forEach(u => {
        if (u.role !== 'ADMIN') list.push({ id: u.id, name: u.name, phone: u.phone, role: u.role, source: 'user' });
      });
      (appointments || []).forEach(a => list.push({ id: `apt-${a.id}`, name: a.clientName, phone: a.clientPhone, source: 'appointment' }));
      (inquiries || []).forEach(inq => list.push({ id: `inq-${inq.id}`, name: inq.clientName, phone: inq.phone, source: 'customer' }));

      const response = await fetch(`/api/offers/${offer.id}/broadcast-preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offer,
          clientContacts: list,
          customMessage: editableGroupMessage,
          appOrigin: typeof window !== 'undefined' ? window.location.origin : ''
        })
      });
      const data = await response.json();
      if (data.success && data.broadcast) {
        setCurrentResult(data.broadcast);
        onBroadcastResultUpdated?.(data.broadcast);
      }
      setStatusNotice({
        type: 'info',
        text: `Synced ${totalCount} unique salon clients for group invites.`
      });
    } catch {
      setStatusNotice({
        type: 'info',
        text: `Showing ${totalCount} unique salon clients from local store.`
      });
    } finally {
      setIsRefreshing(false);
    }
  };

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
                  WhatsApp Community &amp; Group Sender
                </span>
                <span className="text-xs text-zinc-400 font-medium">
                  1-Click Send to All Group Members Simultaneously
                </span>
              </div>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-zinc-100 mt-1">
                Send Offer &amp; Coupon to WhatsApp Group
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-zinc-300">

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
                <button type="button" onClick={handleCopyCode} className="text-zinc-400 hover:text-zinc-200 p-1 cursor-pointer" title="Copy Code">
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <h4 className="font-bold text-sm text-zinc-100">{offer.title}</h4>
              <p className="text-[11px] text-zinc-400 max-w-xl">{offer.description}</p>
            </div>

            <div className="shrink-0 text-right space-y-1 border-t sm:border-t-0 sm:border-l border-zinc-800 pt-2 sm:pt-0 sm:pl-4">
              <div className="text-[10px] text-zinc-400">Min Order: <strong className="text-zinc-200">₹{offer.minBookingAmount || 0}</strong></div>
              <div className="text-[10px] text-zinc-400">Valid Till: <strong className="text-zinc-200">{offer.validTill || offer.expiryDate || '2026-12-31'}</strong></div>
              <div className="text-[10px] text-emerald-400 font-semibold">{totalCount} Synced Clients</div>
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

          {/* 1. SALON WHATSAPP COMMUNITY / GROUP LINK SETUP */}
          <div className="p-4 rounded-2xl bg-zinc-900/90 border border-emerald-500/30 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm text-zinc-100">
                  Salon WhatsApp Community / Group Link
                </span>
              </div>
              {hasValidGroupUrl && (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 self-start sm:self-auto">
                  ● Group Linked &amp; Visible to Clients
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <div className="sm:col-span-4">
                <label className="text-[10px] text-zinc-400 block mb-1">Group / Community Name</label>
                <input
                  type="text"
                  value={communityName}
                  onChange={(e) => setCommunityName(e.target.value)}
                  placeholder="Modern Salon VIP Offers"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="sm:col-span-6">
                <label className="text-[10px] text-zinc-400 block mb-1">WhatsApp Group / Community Invite URL</label>
                <input
                  type="url"
                  value={communityUrl}
                  onChange={(e) => setCommunityUrl(e.target.value)}
                  placeholder="https://chat.whatsapp.com/YourInviteCode..."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-emerald-300 font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="sm:col-span-2 flex items-end">
                <button
                  type="button"
                  onClick={handleSaveCommunityLink}
                  disabled={isSavingGroup}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer disabled:opacity-50 transition"
                >
                  {isSavingGroup ? 'Saving...' : 'Save Link'}
                </button>
              </div>
            </div>

            <p className="text-[10px] text-zinc-400 leading-relaxed">
              Create one <strong>WhatsApp Group or Community</strong> in WhatsApp, tap <em>Invite via Link → Copy Link</em>, and paste it above. Clients can join from the Offers &amp; Contact pages, and you can send every offer to all members together!
            </p>
          </div>

          {/* 2. PRIMARY ACTION: SEND OFFER TO GROUP (ALL AT ONCE) */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-zinc-900 to-teal-950/60 border border-emerald-500/40 shadow-lg space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm text-zinc-100">
                  Post Offer &amp; Coupon to All Group Members at Same Time
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-emerald-300 border border-zinc-700 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
              >
                {copiedMessage ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedMessage ? 'Message Copied!' : 'Copy Offer Text'}</span>
              </button>
            </div>

            {/* Editable Group Message */}
            <textarea
              rows={6}
              value={editableGroupMessage}
              onChange={(e) => setEditableGroupMessage(e.target.value)}
              className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-emerald-300 font-mono text-[11px] leading-relaxed focus:outline-none focus:border-emerald-500"
            />

            {/* Primary Send Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href={whatsappSendToGroupPickerUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleSendToGroupAction(false)}
                className="flex-1 min-w-[230px] px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Send to WhatsApp Group / Community</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              {cleanGroupUrl && (
                <a
                  href={cleanGroupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleSendToGroupAction(true)}
                  className="px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer"
                >
                  <Link2 className="w-4 h-4" />
                  <span>Copy Offer &amp; Open Saved Group</span>
                </a>
              )}
            </div>
          </div>

          {/* 3. OPTIONAL: INVITE EXISTING CLIENTS INTO THE WHATSAPP GROUP / COMMUNITY */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
            <div className="p-3.5 sm:px-4 flex flex-wrap items-center justify-between gap-2 bg-zinc-900/80">
              <button
                type="button"
                onClick={() => setShowInviteSection(!showInviteSection)}
                className="flex items-center gap-2 text-left cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="font-bold text-xs text-zinc-100">
                    Invite Clients to Join Your WhatsApp Group / Community ({totalCount} Clients)
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    {showInviteSection ? 'Hide client invite list' : 'Expand to send your WhatsApp Group invite link or copy client numbers'}
                  </div>
                </div>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyNumbers}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-zinc-700 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>{copiedNumbers ? 'Copied Numbers!' : `Copy All (${totalCount})`}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowInviteSection(!showInviteSection)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold cursor-pointer"
                >
                  {showInviteSection ? 'Hide' : 'Invite Clients'}
                </button>
              </div>
            </div>

            {showInviteSection && (
              <div className="p-4 border-t border-zinc-800 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Search client or phone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleRefreshClients}
                    disabled={isRefreshing}
                    className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
                    <span>Sync Clients</span>
                  </button>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 overflow-hidden max-h-56 overflow-y-auto divide-y divide-zinc-800/80">
                  {filteredRecipients.length === 0 ? (
                    <div className="p-6 text-center text-zinc-500">
                      No matching client contacts found.
                    </div>
                  ) : (
                    filteredRecipients.map((rec, idx) => {
                      const invited = invitedClientIds.has(rec.id);
                      return (
                        <div key={rec.id || idx} className="p-3 flex items-center justify-between gap-3">
                          <div className="min-w-0 truncate">
                            <div className="font-semibold text-zinc-200 truncate flex items-center gap-1.5">
                              <span>{rec.name}</span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/60 font-mono">
                                {rec.source === 'customer' ? 'CRM' : rec.source === 'appointment' ? 'Booking' : 'User'}
                              </span>
                            </div>
                            <div className="text-[11px] font-mono text-zinc-400">+91 {rec.phone}</div>
                          </div>

                          <a
                            href={buildClientInviteUrl(rec)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setInvitedClientIds(prev => new Set(prev).add(rec.id))}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shrink-0 transition ${
                              invited
                                ? 'bg-zinc-800 text-emerald-400 border border-emerald-500/30'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            }`}
                          >
                            <UserPlus className="w-3 h-3" />
                            <span>{invited ? 'Invited' : 'Send Group Invite'}</span>
                          </a>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-zinc-800/80 bg-zinc-900/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-zinc-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Share offers &amp; coupon codes to your entire Salon WhatsApp Community in a single click.
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs cursor-pointer transition-colors"
          >
            Done &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
};
