import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Zap,
  RefreshCw,
  Building2,
  Clock,
  ArrowRight,
  Send,
  Eye,
  User,
  Phone,
  Calendar,
  XCircle
} from 'lucide-react';
import { useSalon } from '../context/SalonContext';
import { Appointment, VerifiedBankDeposit } from '../types';

interface AdminBankSmsHubProps {
  onShowToast: (msg: string) => void;
}

export const AdminBankSmsHub: React.FC<AdminBankSmsHubProps> = ({ onShowToast }) => {
  const { appointments, updateAppointmentStatus, settings } = useSalon();
  const [deposits, setDeposits] = useState<VerifiedBankDeposit[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);

  // Simulator Form State
  const [simAmount, setSimAmount] = useState<number>(500);
  const [simUtr, setSimUtr] = useState<string>(() => `${Math.floor(100000000000 + Math.random() * 900000000000)}`);
  const [simBank, setSimBank] = useState<'hdfc' | 'phonepe' | 'boi'>('hdfc');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simResult, setSimResult] = useState<any>(null);

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/webhooks/bank-sms`
    : 'http://localhost:3000/api/webhooks/bank-sms';

  const fetchDeposits = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/webhooks/bank-sms/deposits');
      const data = await res.json();
      if (data.success && Array.isArray(data.deposits)) {
        setDeposits(data.deposits);
      }
    } catch (e) {
      console.warn('Failed to fetch deposits:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
    const timer = setInterval(fetchDeposits, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedUrl(true);
    onShowToast('Webhook URL copied to clipboard!');
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    setSimResult(null);

    try {
      const res = await fetch('/api/webhooks/bank-sms/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: simAmount,
          utr: simUtr,
          bank: simBank
        })
      });

      const data = await res.json();
      setIsSimulating(false);
      setSimResult(data);

      if (data.success) {
        onShowToast(`Simulation Succeeded: ${data.matched ? 'Auto-Matched to Appointment!' : 'Logged as Verified Deposit in Bank Ledger.'}`);
        fetchDeposits();
        // Generate new random UTR for next test
        setSimUtr(`${Math.floor(100000000000 + Math.random() * 900000000000)}`);
      } else {
        onShowToast('Simulation error: ' + (data.error || 'Failed'));
      }
    } catch (err: any) {
      setIsSimulating(false);
      onShowToast('Simulation network failed: ' + err.message);
    }
  };

  const handleManualVerify = async (apt: Appointment) => {
    try {
      const res = await fetch(`/api/appointments/${apt.id}/verify-manually`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        updateAppointmentStatus(apt.id, 'CONFIRMED');
        onShowToast(`Deposit verified for ${apt.clientName} (${apt.bookingRef}). Chair confirmed!`);
        fetchDeposits();
      }
    } catch {
      onShowToast('Failed to verify appointment');
    }
  };

  const handleRejectFake = async (apt: Appointment) => {
    if (!window.confirm(`Are you sure you want to reject UTR "${apt.upiTransactionId}" for ${apt.clientName}? This will cancel the booking and release the chair back to other clients.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/appointments/${apt.id}/reject-fake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Fake / unverified UTR provided by customer' })
      });
      const data = await res.json();
      if (data.success) {
        updateAppointmentStatus(apt.id, 'CANCELLED');
        onShowToast(`Appointment rejected & slot released back to open chairs.`);
        fetchDeposits();
      }
    } catch {
      onShowToast('Failed to reject appointment');
    }
  };

  // Pending Review queue
  const pendingAppointments = appointments.filter(a => 
    (a.bookingStatus === 'PENDING' || a.paymentStatus === 'PENDING') &&
    a.bookingStatus !== 'CANCELLED'
  );

  const totalBankDepositAmount = deposits.reduce((acc, d) => acc + (Number(d.amount) || 0), 0);

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-amber-950/30 border border-emerald-500/30 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg font-bold text-zinc-100">
                  Automated Bank SMS &amp; UPI Verification Hub
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  0% FEE • 100% REAL VERIFICATION
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Direct-to-bank verification powered by live SMS forwarder on owner phone (+91 81040 26257)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchDeposits}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Ledger</span>
            </button>
          </div>
        </div>

        {/* 3 Metric Mini Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
            <div className="text-[10px] uppercase font-bold text-zinc-400">Total Bank SMS Credits</div>
            <div className="text-xl font-bold font-mono text-emerald-400">₹{totalBankDepositAmount.toLocaleString()}</div>
            <div className="text-[10px] text-zinc-500">{deposits.length} verified SMS logs</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
            <div className="text-[10px] uppercase font-bold text-zinc-400">Auto-Matched Appointments</div>
            <div className="text-xl font-bold font-mono text-amber-400">
              {deposits.filter(d => d.status === 'MATCHED').length}
            </div>
            <div className="text-[10px] text-zinc-500">Instantly unlocked chairs</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
            <div className="text-[10px] uppercase font-bold text-zinc-400">Pending Review Queue</div>
            <div className="text-xl font-bold font-mono text-purple-400">
              {pendingAppointments.length}
            </div>
            <div className="text-[10px] text-zinc-500">Manual review or delayed SMS</div>
          </div>
        </div>
      </div>

      {/* Production Setup Guide for Teammates & Owner */}
      <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-sm font-bold text-zinc-200 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>How the Free Zero-Cost Verification Works (Setup Guide)</span>
          </h3>
          <span className="text-[11px] text-zinc-500 font-mono">Terminal SIM: +91 81040 26257</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5">
            <div className="font-bold text-amber-400 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px]">1</span>
              <span>Install Free Android App</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Install <strong>SMS to URL Forwarder</strong> or <strong>MacroDroid</strong> on Dinesh's Android phone (the phone receiving HDFC/PhonePe bank SMS).
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5">
            <div className="font-bold text-amber-400 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px]">2</span>
              <span>Set Forwarding Webhook URL</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Set filter for senders <code>*HDFCBK*</code> or <code>*PhonePe*</code> to POST incoming SMS directly to the Webhook URL below.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5">
            <div className="font-bold text-amber-400 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px]">3</span>
              <span>Instant Server Auto-Match</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Our server extracts the 12-digit UTR and credited amount. When matched with client UTR, the slot is confirmed with zero manual work!
            </p>
          </div>
        </div>

        {/* Webhook URL & Secret Token Bars */}
        <div className="space-y-2">
          <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 truncate text-xs font-mono text-zinc-300">
              <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">POST</span>
              <span className="truncate">{webhookUrl}</span>
            </div>
            <button
              onClick={handleCopyWebhook}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center gap-1 shrink-0 transition cursor-pointer"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedUrl ? 'Copied!' : 'Copy Webhook URL'}</span>
            </button>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 truncate text-xs font-mono text-zinc-300">
              <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">SECRET</span>
              <span className="truncate text-zinc-400">Header: <code className="text-amber-400">x-webhook-secret: modern_salon_sms_secret_token_99</code></span>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText('modern_salon_sms_secret_token_99');
                onShowToast('Webhook Secret Token copied to clipboard!');
              }}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center gap-1 shrink-0 transition cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Secret</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Bank SMS Simulator (For College Demo / Viva / Teammates) */}
      <div className="p-5 rounded-3xl bg-zinc-900 border border-amber-500/30 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-sm font-bold text-amber-300 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Live Bank SMS Simulator (For College Viva &amp; Teammate Demo)</span>
            </h3>
            <p className="text-[11px] text-zinc-400">
              Test real automated webhook parsing and auto-matching without transferring real money!
            </p>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
            Interactive Test Hub
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="text-[11px] font-bold text-zinc-400 block mb-1">Select Bank Source</label>
            <select
              value={simBank}
              onChange={(e) => setSimBank(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-amber-500"
            >
              <option value="hdfc">{settings.bankName || 'HDFC Bank'} (A/c ...{(settings.bankAccountNumber || '50200072074441').slice(-4)})</option>
              <option value="phonepe">PhonePe Merchant ({settings.merchantUpiId || settings.upiId || 'ghodakedinesh@ybl'})</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-zinc-400 block mb-1">Deposit Amount (₹)</label>
            <input
              type="number"
              value={simAmount}
              onChange={(e) => setSimAmount(Number(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 font-mono focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-zinc-400">12-Digit UPI UTR</label>
              <button
                type="button"
                onClick={() => setSimUtr(`${Math.floor(100000000000 + Math.random() * 900000000000)}`)}
                className="text-[10px] text-amber-400 hover:underline cursor-pointer"
              >
                Generate Fresh
              </button>
            </div>
            <input
              type="text"
              maxLength={12}
              value={simUtr}
              onChange={(e) => setSimUtr(e.target.value.replace(/\D/g, '').slice(0, 12))}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 font-mono focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleRunSimulation}
              disabled={isSimulating || simUtr.length !== 12 || simAmount <= 0}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-40 shadow-md shadow-amber-500/20"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSimulating ? 'Sending Webhook...' : 'Simulate Bank SMS Webhook'}</span>
            </button>
          </div>
        </div>

        {simResult && (
          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs space-y-1.5">
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span className="text-emerald-400 font-bold">
                ✓ Webhook Processed Successfully ({simResult.matched ? 'MATCHED TO APPOINTMENT' : 'UNCLAIMED DEPOSIT'})
              </span>
              <span className="text-zinc-500">{new Date().toLocaleTimeString()}</span>
            </div>
            <div className="text-[11px] font-mono text-zinc-300 bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800/80">
              "{simResult.simulatedMessage}"
            </div>
          </div>
        )}
      </div>

      {/* Pending Appointments Queue (Held chairs needing confirmation or review) */}
      {pendingAppointments.length > 0 && (
        <div className="p-5 rounded-3xl bg-zinc-900 border border-purple-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-sm font-bold text-purple-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <span>Pending Customer Claims Awaiting Bank Clearance ({pendingAppointments.length})</span>
            </h3>
            <span className="text-[11px] text-zinc-400">15-minute chair hold active</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-zinc-800 text-[10px] uppercase font-bold text-zinc-400">
                  <th className="py-2.5 px-3">Booking Ref</th>
                  <th className="py-2.5 px-3">Client</th>
                  <th className="py-2.5 px-3">Service &amp; Slot</th>
                  <th className="py-2.5 px-3">Claimed UTR</th>
                  <th className="py-2.5 px-3">Deposit Due</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {pendingAppointments.map(apt => (
                  <tr key={apt.id} className="hover:bg-zinc-800/40">
                    <td className="py-3 px-3 font-mono font-bold text-amber-400">
                      {apt.bookingRef}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-zinc-200">{apt.clientName}</div>
                      <div className="text-zinc-400 text-[11px]">{apt.clientPhone}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-zinc-200 font-medium">{apt.serviceName}</div>
                      <div className="text-zinc-400 text-[11px]">{apt.date} • {apt.timeSlot}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-bold">
                        {apt.upiTransactionId || 'No UTR'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                      ₹{apt.advancePaid}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleManualVerify(apt)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition"
                          title="Verify Bank SMS & Confirm Appointment"
                        >
                          <Check className="w-3 h-3" />
                          <span>Verify Deposit</span>
                        </button>
                        <button
                          onClick={() => handleRejectFake(apt)}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition"
                          title="Reject Fake UTR & Free Slot"
                        >
                          <XCircle className="w-3 h-3" />
                          <span>Reject Fake</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Verified Bank Deposits Ledger Table */}
      <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-sm font-bold text-zinc-200 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span>Official Bank SMS Credit Ledger (Live Received Money)</span>
          </h3>
          <span className="text-[11px] text-zinc-400">{deposits.length} total entries</span>
        </div>

        {deposits.length === 0 ? (
          <div className="py-8 text-center text-zinc-500 text-xs">
            No bank credit SMS received yet. Use the Simulator above or send an SMS webhook to test!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-zinc-800 text-[10px] uppercase font-bold text-zinc-400">
                  <th className="py-2.5 px-3">Received Time</th>
                  <th className="py-2.5 px-3">Bank / Account</th>
                  <th className="py-2.5 px-3">Credited Amount</th>
                  <th className="py-2.5 px-3">UPI UTR Ref</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Matched Booking</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {deposits.map((dep) => (
                  <tr key={dep.id} className="hover:bg-zinc-800/40">
                    <td className="py-3 px-3 text-zinc-400 font-mono text-[11px]">
                      {dep.receivedAt ? new Date(dep.receivedAt).toLocaleTimeString() : 'Just now'}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-zinc-200">{dep.bankName}</span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                      ₹{dep.amount}
                    </td>
                    <td className="py-3 px-3 font-mono text-amber-400">
                      {dep.utr}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        dep.status === 'MATCHED'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {dep.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-zinc-300">
                      {dep.matchedBookingRef || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

