import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  Scissors,
  Calendar,
  Sparkles,
  PieChart as PieIcon,
  BarChart2,
  ShieldCheck,
  Award,
  ArrowUpRight,
  Filter,
  Download
} from 'lucide-react';
import { useSalon } from '../context/SalonContext';

// Luxury Golden Color Palette
const COLORS = {
  gold: '#d4af37',
  goldLight: '#f5e7b2',
  goldChampagne: '#fbf2d5',
  emerald: '#10b981',
  blue: '#38bdf8',
  purple: '#a855f7',
  pink: '#f43f5e',
  amber: '#f59e0b',
  slate: '#94a3b8'
};

const PIE_COLORS = ['#d4af37', '#e5c158', '#10b981', '#38bdf8', '#a855f7', '#f43f5e'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const parseAppointmentMonthKey = (dateStr?: string, fallbackDate: Date = new Date()): string => {
  if (dateStr) {
    const clean = dateStr.trim().split('T')[0];
    const match = clean.match(/^(\d{4})-(\d{1,2})/);
    if (match) {
      const y = Number(match[1]);
      const m = Number(match[2]);
      if (y >= 2020 && m >= 1 && m <= 12) {
        return `${y}-${String(m).padStart(2, '0')}`;
      }
    }
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
    }
  }
  return `${fallbackDate.getFullYear()}-${String(fallbackDate.getMonth() + 1).padStart(2, '0')}`;
};

const formatMonthKeyLabel = (key: string, includeYear = false): string => {
  const [yStr, mStr] = key.split('-');
  const y = Number(yStr);
  const m = Number(mStr);
  if (!y || !m || m < 1 || m > 12) return key;
  return includeYear ? `${MONTH_NAMES[m - 1]} ${y}` : `${MONTH_NAMES[m - 1]} '${String(y).slice(-2)}`;
};

export const AdminCharts: React.FC = () => {
  const { appointments, services, customers, theme } = useSalon();
  const isDark = theme !== 'light';

  const isActiveBooking = (a: { bookingStatus?: string; status?: string }) =>
    ((a.bookingStatus || a.status || 'CONFIRMED').toUpperCase() !== 'CANCELLED');

  // Chart & Filter View Controls
  const [revenueChartType, setRevenueChartType] = useState<'area' | 'bar'>('area');
  const [filterMode, setFilterMode] = useState<'all' | 'single' | 'range'>('all');
  const [serviceMetric, setServiceMetric] = useState<'bookings' | 'revenue'>('bookings');

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Build complete continuous timeline from earliest booking month to latest/current month
  const { monthOptions, activeAppointmentsWithKey } = useMemo(() => {
    const activeApts = appointments.filter(isActiveBooking).map(apt => ({
      apt,
      monthKey: parseAppointmentMonthKey(apt.date || apt.createdAt, now)
    }));

    let minKey = currentMonthKey;
    let maxKey = currentMonthKey;

    if (activeApts.length > 0) {
      activeApts.forEach(({ monthKey }) => {
        if (monthKey < minKey) minKey = monthKey;
        if (monthKey > maxKey) maxKey = monthKey;
      });
    } else {
      const sixBack = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      minKey = `${sixBack.getFullYear()}-${String(sixBack.getMonth() + 1).padStart(2, '0')}`;
    }

    const [minY, minM] = minKey.split('-').map(Number);
    const [maxY, maxM] = maxKey.split('-').map(Number);
    const options: Array<{ key: string; shortLabel: string; fullLabel: string }> = [];

    let cursorY = minY;
    let cursorM = minM;
    let guard = 0;
    while ((cursorY < maxY || (cursorY === maxY && cursorM <= maxM)) && guard < 120) {
      const key = `${cursorY}-${String(cursorM).padStart(2, '0')}`;
      options.push({
        key,
        shortLabel: formatMonthKeyLabel(key, false),
        fullLabel: formatMonthKeyLabel(key, true)
      });
      cursorM += 1;
      if (cursorM > 12) {
        cursorM = 1;
        cursorY += 1;
      }
      guard += 1;
    }

    return {
      monthOptions: options,
      activeAppointmentsWithKey: activeApts
    };
  }, [appointments, currentMonthKey]);

  const firstAvailableKey = monthOptions[0]?.key || currentMonthKey;
  const lastAvailableKey = monthOptions[monthOptions.length - 1]?.key || currentMonthKey;

  const [singleMonthKey, setSingleMonthKey] = useState<string>(currentMonthKey);
  const [startMonthKey, setStartMonthKey] = useState<string>(firstAvailableKey);
  const [endMonthKey, setEndMonthKey] = useState<string>(lastAvailableKey);

  // Resolve effective [start, end] window safely
  const { effectiveStartKey, effectiveEndKey, periodBadgeText } = useMemo(() => {
    const validKeys = new Set(monthOptions.map(o => o.key));
    if (filterMode === 'single') {
      const target = validKeys.has(singleMonthKey) ? singleMonthKey : lastAvailableKey;
      return {
        effectiveStartKey: target,
        effectiveEndKey: target,
        periodBadgeText: formatMonthKeyLabel(target, true)
      };
    }
    if (filterMode === 'range') {
      const rawStart = validKeys.has(startMonthKey) ? startMonthKey : firstAvailableKey;
      const rawEnd = validKeys.has(endMonthKey) ? endMonthKey : lastAvailableKey;
      const effStart = rawStart <= rawEnd ? rawStart : rawEnd;
      const effEnd = rawStart <= rawEnd ? rawEnd : rawStart;
      return {
        effectiveStartKey: effStart,
        effectiveEndKey: effEnd,
        periodBadgeText: `${formatMonthKeyLabel(effStart, true)} → ${formatMonthKeyLabel(effEnd, true)}`
      };
    }
    return {
      effectiveStartKey: firstAvailableKey,
      effectiveEndKey: lastAvailableKey,
      periodBadgeText:
        firstAvailableKey === lastAvailableKey
          ? formatMonthKeyLabel(firstAvailableKey, true)
          : `${formatMonthKeyLabel(firstAvailableKey, true)} → ${formatMonthKeyLabel(lastAvailableKey, true)} (All)`
    };
  }, [filterMode, singleMonthKey, startMonthKey, endMonthKey, firstAvailableKey, lastAvailableKey, monthOptions]);

  // Filtered Appointments within selected month / range
  const filteredActiveApts = useMemo(() => {
    return activeAppointmentsWithKey
      .filter(({ monthKey }) => monthKey >= effectiveStartKey && monthKey <= effectiveEndKey)
      .map(({ apt }) => apt);
  }, [activeAppointmentsWithKey, effectiveStartKey, effectiveEndKey]);

  // 1. Monthly Revenue & 10% Advance Deposit Dataset for selected period
  const monthlyRevenueData = useMemo(() => {
    const selectedMonths = monthOptions.filter(
      opt => opt.key >= effectiveStartKey && opt.key <= effectiveEndKey
    );

    const buckets = new Map<
      string,
      { key: string; month: string; fullLabel: string; revenue: number; advance: number; bookings: number; avgTicket: number }
    >();

    selectedMonths.forEach(opt => {
      buckets.set(opt.key, {
        key: opt.key,
        month: opt.shortLabel,
        fullLabel: opt.fullLabel,
        revenue: 0,
        advance: 0,
        bookings: 0,
        avgTicket: 0
      });
    });

    activeAppointmentsWithKey.forEach(({ apt, monthKey }) => {
      if (monthKey < effectiveStartKey || monthKey > effectiveEndKey) return;
      const existing = buckets.get(monthKey) || {
        key: monthKey,
        month: formatMonthKeyLabel(monthKey, false),
        fullLabel: formatMonthKeyLabel(monthKey, true),
        revenue: 0,
        advance: 0,
        bookings: 0,
        avgTicket: 0
      };
      existing.revenue += Number(apt.totalAmount) || 0;
      existing.advance += Number(apt.advancePaid) || 0;
      existing.bookings += 1;
      existing.avgTicket = existing.bookings > 0 ? Math.round(existing.revenue / existing.bookings) : 0;
      buckets.set(monthKey, existing);
    });

    return Array.from(buckets.values()).sort((a, b) => a.key.localeCompare(b.key));
  }, [monthOptions, activeAppointmentsWithKey, effectiveStartKey, effectiveEndKey]);

  // 2. Service Popularity & Category Breakdown Dataset from filtered bookings
  const { servicePopularityData, categoryDistributionData, topPerformingService, activeBookingsCount } = useMemo(() => {
    const serviceCounts: Record<string, { bookings: number; revenue: number; category: string; price: number }> = {};

    filteredActiveApts.forEach(a => {
      const sName = a.serviceName || 'Salon Service';
      if (!serviceCounts[sName]) {
        serviceCounts[sName] = {
          bookings: 0,
          revenue: 0,
          category: a.category || 'General',
          price: Number(a.totalAmount) || 0
        };
      }
      serviceCounts[sName].bookings += 1;
      serviceCounts[sName].revenue += Number(a.totalAmount) || 0;
    });

    const popularityArray = Object.entries(serviceCounts)
      .map(([name, data]) => ({
        name: name.length > 20 ? name.substring(0, 18) + '...' : name,
        fullName: name,
        bookings: data.bookings,
        revenue: data.revenue,
        category: data.category,
        advanceCollected: Math.round(data.revenue * 0.1)
      }))
      .sort((a, b) => (serviceMetric === 'revenue' ? b.revenue - a.revenue : b.bookings - a.bookings))
      .slice(0, 6);

    const categoryTotals: Record<string, number> = {};
    Object.values(serviceCounts).forEach(item => {
      if (item.revenue > 0) {
        const cat = item.category || 'Other';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + item.revenue;
      }
    });

    const categoryArray = Object.entries(categoryTotals)
      .map(([cat, total]) => ({
        name: cat,
        value: total
      }))
      .sort((a, b) => b.value - a.value);

    const topService = popularityArray[0] || { fullName: 'No bookings in range', bookings: 0, revenue: 0 };

    return {
      servicePopularityData: popularityArray,
      categoryDistributionData: categoryArray,
      topPerformingService: topService,
      activeBookingsCount: filteredActiveApts.length
    };
  }, [filteredActiveApts, serviceMetric]);

  // Summary KPIs strictly for the selected filter window
  const totalRevenueSum = useMemo(() => {
    return filteredActiveApts.reduce((acc, cur) => acc + (Number(cur.totalAmount) || 0), 0);
  }, [filteredActiveApts]);

  const totalAdvanceSum = useMemo(() => {
    return filteredActiveApts.reduce((acc, cur) => acc + (Number(cur.advancePaid) || 0), 0);
  }, [filteredActiveApts]);

  const avgTicketValue = useMemo(() => {
    return activeBookingsCount > 0 ? Math.round(totalRevenueSum / activeBookingsCount) : 0;
  }, [totalRevenueSum, activeBookingsCount]);

  // CSV Export Helper
  const escapeCsv = (val: unknown) => `"${String(val ?? '').replace(/"/g, '""')}"`;

  const handleExportAnalyticsCSV = () => {
    const lines: string[] = [];
    lines.push('MODERN UNISEX SALON - ANALYTICS & REVENUE REPORT');
    lines.push(`Selected Period,${escapeCsv(periodBadgeText)}`);
    lines.push(`Exported On,${escapeCsv(new Date().toISOString())}`);
    lines.push(`Total Bookings,${activeBookingsCount}`);
    lines.push(`Total Revenue (INR),${totalRevenueSum}`);
    lines.push(`10% Advance Collected (INR),${totalAdvanceSum}`);
    lines.push(`Average Booking Ticket (INR),${avgTicketValue}`);
    lines.push('');

    lines.push('MONTHLY PERFORMANCE BREAKDOWN');
    lines.push('Month,Month Key,Bookings,Total Revenue (INR),10% Advance Collected (INR),Avg Ticket Size (INR)');
    monthlyRevenueData.forEach(row => {
      lines.push(
        [
          escapeCsv(row.fullLabel),
          escapeCsv(row.key),
          row.bookings,
          row.revenue,
          row.advance,
          row.avgTicket
        ].join(',')
      );
    });
    lines.push('');

    lines.push('DETAILED BOOKING LEDGER (FILTERED)');
    lines.push('Booking Ref,Date,Time Slot,Client Name,Phone,Service,Category,Stylist,Total Amount (INR),Advance Paid (INR),Balance Due (INR),Payment Status,Booking Status');
    filteredActiveApts
      .slice()
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      .forEach(a => {
        lines.push(
          [
            escapeCsv(a.bookingRef || a.id),
            escapeCsv((a.date || '').split('T')[0]),
            escapeCsv(a.timeSlot),
            escapeCsv(a.clientName),
            escapeCsv(a.clientPhone),
            escapeCsv(a.serviceName),
            escapeCsv(a.category || 'General'),
            escapeCsv(a.stylistName || 'Staff'),
            Number(a.totalAmount) || 0,
            Number(a.advancePaid) || 0,
            Number(a.balanceDue) || 0,
            escapeCsv(a.paymentStatus || 'PAID'),
            escapeCsv(a.bookingStatus || a.status || 'CONFIRMED')
          ].join(',')
        );
      });

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `modern-salon-analytics-${effectiveStartKey}-to-${effectiveEndKey}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Custom Chart Tooltip for Revenue
  const CustomRevenueTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={`p-4 rounded-xl border shadow-xl text-xs space-y-2 backdrop-blur-md ${
          isDark
            ? 'bg-zinc-950/95 border-zinc-700 text-zinc-100'
            : 'bg-white/95 border-zinc-200 text-zinc-800 shadow-slate-300'
        }`}>
          <div className="font-bold text-sm font-serif text-yellow-500 flex items-center justify-between gap-4">
            <span>{data.fullLabel || label}</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-500 font-normal">
              {data.bookings} Bookings
            </span>
          </div>
          <div className={`space-y-1.5 pt-1 border-t font-mono ${isDark ? 'border-zinc-800/60' : 'border-zinc-200'}`}>
            <div className="flex items-center justify-between gap-4">
              <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block"></span>
                Total Revenue:
              </span>
              <span className="font-bold text-amber-600 dark:text-yellow-400">₹{data.revenue.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                10% Advance Deposit:
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{data.advance.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-[11px] pt-1 text-zinc-500 dark:text-zinc-400">
              <span>Avg Ticket Size:</span>
              <span className="text-zinc-800 dark:text-zinc-300 font-semibold">₹{data.avgTicket}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Chart Tooltip for Popularity
  const CustomPopularityTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={`p-4 rounded-xl border shadow-xl text-xs space-y-2 backdrop-blur-md ${
          isDark
            ? 'bg-zinc-950/95 border-zinc-700 text-zinc-100'
            : 'bg-white/95 border-zinc-200 text-zinc-800 shadow-slate-300'
        }`}>
          <div className="font-bold text-sm text-yellow-500">{data.fullName}</div>
          <div className="text-[11px] text-zinc-400">{data.category}</div>
          <div className={`space-y-1 pt-1.5 border-t font-mono ${isDark ? 'border-zinc-800/60' : 'border-zinc-200'}`}>
            <div className="flex items-center justify-between gap-4">
              <span className="text-zinc-500 dark:text-zinc-400">Total Bookings:</span>
              <span className="font-bold text-amber-600 dark:text-yellow-400">{data.bookings} sessions</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-zinc-500 dark:text-zinc-400">Gross Value:</span>
              <span className="font-bold text-zinc-800 dark:text-zinc-200">₹{data.revenue.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-zinc-500 dark:text-zinc-400">10% Adv Online:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{data.advanceCollected.toLocaleString()}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* SECTION HEADER & EXPORT CSV */}
      <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b ${isDark ? 'border-zinc-800/80' : 'border-purple-200'}`}>
        <div>
          <h2 className="text-xl font-bold font-serif text-purple-800 dark:text-yellow-400 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600 dark:text-yellow-500" />
            <span>Salon Performance Analytics &amp; Revenue Trends</span>
          </h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
            Showing <strong className="text-purple-700 dark:text-amber-400">{periodBadgeText}</strong> • {activeBookingsCount} active bookings across {customers.length} CRM clients.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-purple-100 dark:bg-yellow-500/10 border border-purple-200 dark:border-yellow-500/30 text-purple-800 dark:text-yellow-400 text-xs font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Start → End History ({monthOptions.length} Months)</span>
          </div>

          <button
            type="button"
            id="admin-analytics-export-csv"
            onClick={handleExportAnalyticsCSV}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* MONTH & DATE-RANGE FILTER BAR */}
      <div className={`p-4 rounded-2xl border flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${
        isDark ? 'bg-[#141418] border-zinc-800' : 'bg-white border-purple-200 shadow-sm'
      }`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5 mr-1">
            <Filter className="w-3.5 h-3.5 text-purple-600 dark:text-amber-400" />
            <span>Report Period:</span>
          </span>
          <div className={`flex items-center p-1 rounded-xl border text-xs ${
            isDark ? 'bg-zinc-900 border-zinc-700/60' : 'bg-purple-50 border-purple-200'
          }`}>
            <button
              type="button"
              id="analytics-filter-all"
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              All Months (Start → End)
            </button>
            <button
              type="button"
              id="analytics-filter-single"
              onClick={() => {
                setFilterMode('single');
                if (!monthOptions.some(m => m.key === singleMonthKey)) {
                  setSingleMonthKey(lastAvailableKey);
                }
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterMode === 'single'
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Single Month
            </button>
            <button
              type="button"
              id="analytics-filter-range"
              onClick={() => {
                setFilterMode('range');
                if (!monthOptions.some(m => m.key === startMonthKey)) setStartMonthKey(firstAvailableKey);
                if (!monthOptions.some(m => m.key === endMonthKey)) setEndMonthKey(lastAvailableKey);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterMode === 'range'
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Start → End Month
            </button>
          </div>
        </div>

        {/* Dynamic Month Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {filterMode === 'single' && (
            <div className="flex items-center gap-2">
              <label className="font-semibold text-zinc-600 dark:text-zinc-400">Select Month:</label>
              <select
                id="analytics-single-month-select"
                value={effectiveStartKey}
                onChange={(e) => setSingleMonthKey(e.target.value)}
                className={`px-3 py-1.5 rounded-xl border font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/40 ${
                  isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-100' : 'bg-purple-50 border-purple-200 text-zinc-900'
                }`}
              >
                {monthOptions.map(opt => (
                  <option key={opt.key} value={opt.key}>{opt.fullLabel}</option>
                ))}
              </select>
            </div>
          )}

          {filterMode === 'range' && (
            <div className="flex flex-wrap items-center gap-2">
              <label className="font-semibold text-zinc-600 dark:text-zinc-400">Start Month:</label>
              <select
                id="analytics-start-month-select"
                value={startMonthKey}
                onChange={(e) => setStartMonthKey(e.target.value)}
                className={`px-3 py-1.5 rounded-xl border font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/40 ${
                  isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-100' : 'bg-purple-50 border-purple-200 text-zinc-900'
                }`}
              >
                {monthOptions.map(opt => (
                  <option key={opt.key} value={opt.key}>{opt.fullLabel}</option>
                ))}
              </select>

              <span className="text-zinc-500 font-bold">to</span>

              <label className="font-semibold text-zinc-600 dark:text-zinc-400">End Month:</label>
              <select
                id="analytics-end-month-select"
                value={endMonthKey}
                onChange={(e) => setEndMonthKey(e.target.value)}
                className={`px-3 py-1.5 rounded-xl border font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/40 ${
                  isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-100' : 'bg-purple-50 border-purple-200 text-zinc-900'
                }`}
              >
                {monthOptions.map(opt => (
                  <option key={opt.key} value={opt.key}>{opt.fullLabel}</option>
                ))}
              </select>
            </div>
          )}

          {filterMode === 'all' && (
            <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
              Range: {formatMonthKeyLabel(firstAvailableKey, true)} — {formatMonthKeyLabel(lastAvailableKey, true)}
            </span>
          )}
        </div>
      </div>

      {/* 4 SUMMARY STAT STRIP (Filtered) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-4 rounded-2xl border transition-all ${
          isDark ? 'bg-[#141418] border-zinc-800' : 'bg-white border-purple-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1">
            <span>{filterMode === 'all' ? 'All-Time Revenue' : 'Filtered Period Revenue'}</span>
            <DollarSign className="w-4 h-4 text-purple-600 dark:text-yellow-500" />
          </div>
          <div className="text-2xl font-bold text-purple-700 dark:text-yellow-400 font-serif">
            ₹{totalRevenueSum.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-500 flex items-center gap-1 mt-1 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{activeBookingsCount} booking{activeBookingsCount === 1 ? '' : 's'} in range</span>
          </div>
        </div>

        <div className={`p-4 rounded-2xl border transition-all ${
          isDark ? 'bg-[#141418] border-zinc-800' : 'bg-white border-purple-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1">
            <span>Online 10% Deposits</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
            ₹{totalAdvanceSum.toLocaleString()}
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
            PhonePe / Google Pay UPI verified
          </div>
        </div>

        <div className={`p-4 rounded-2xl border transition-all ${
          isDark ? 'bg-[#141418] border-zinc-800' : 'bg-white border-purple-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1">
            <span>Top Performing Service</span>
            <Award className="w-4 h-4 text-purple-600 dark:text-yellow-500" />
          </div>
          <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate mt-1">
            {topPerformingService.fullName}
          </div>
          <div className="text-[11px] text-purple-700 dark:text-yellow-400 mt-1 font-semibold">
            {topPerformingService.bookings} bookings • ₹{topPerformingService.revenue.toLocaleString()}
          </div>
        </div>

        <div className={`p-4 rounded-2xl border transition-all ${
          isDark ? 'bg-[#141418] border-zinc-800' : 'bg-white border-purple-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1">
            <span>Avg Booking Ticket</span>
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-mono">
            ₹{avgTicketValue.toLocaleString()}
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
            Across {customers.length} clients &amp; {services.length} services
          </div>
        </div>
      </div>

      {/* CHART 1: MONTHLY REVENUE & ADVANCE DEPOSIT RECHARTS */}
      <div className={`p-5 sm:p-6 rounded-3xl border shadow-xl space-y-4 transition-all ${
        isDark ? 'bg-[#141418] border-zinc-800' : 'bg-white border-purple-200'
      }`}>
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b ${isDark ? 'border-zinc-800/60' : 'border-purple-200/70'}`}>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-serif text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Monthly Revenue &amp; 10% Advance Realization
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-yellow-500/10 text-purple-700 dark:text-yellow-400 text-[10px] font-bold">
                {periodBadgeText}
              </span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Complete monthly figures from start to end including 10% advance deposit receipts.
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className={`flex items-center p-1 rounded-xl border text-xs ${
              isDark ? 'bg-zinc-900 border-zinc-700/60' : 'bg-zinc-100 border-zinc-300'
            }`}>
              <button
                type="button"
                onClick={() => setRevenueChartType('area')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  revenueChartType === 'area'
                    ? 'bg-yellow-500 text-black font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Area Chart"
              >
                <TrendingUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setRevenueChartType('bar')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  revenueChartType === 'bar'
                    ? 'bg-yellow-500 text-black font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Bar Chart"
              >
                <BarChart2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* RECHARTS CANVAS */}
        <div className="h-72 sm:h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {revenueChartType === 'area' ? (
              <AreaChart
                data={monthlyRevenueData}
                margin={{ top: 10, right: 15, left: 0, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.gold} stopOpacity={0.45} />
                    <stop offset="95%" stopColor={COLORS.gold} stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorAdvance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.emerald} stopOpacity={0.5} />
                    <stop offset="95%" stopColor={COLORS.emerald} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? '#27272a' : '#e2e8f0'}
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  stroke={isDark ? '#71717a' : '#64748b'}
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: isDark ? '#3f3f46' : '#cbd5e1' }}
                />
                <YAxis
                  stroke={isDark ? '#71717a' : '#64748b'}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`}
                />
                <Tooltip content={<CustomRevenueTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={36}
                  formatter={(value) => (
                    <span className="text-xs text-zinc-700 dark:text-zinc-300 font-medium ml-1 mr-4">
                      {value === 'revenue' ? 'Total Service Revenue (₹)' : '10% Advance Deposit Collected (₹)'}
                    </span>
                  )}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={COLORS.gold}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  name="revenue"
                  activeDot={{ r: 6, stroke: '#fef08a', strokeWidth: 2 }}
                />
                <Area
                  type="monotone"
                  dataKey="advance"
                  stroke={COLORS.emerald}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorAdvance)"
                  name="advance"
                  activeDot={{ r: 5, stroke: '#a7f3d0', strokeWidth: 2 }}
                />
              </AreaChart>
            ) : (
              <BarChart
                data={monthlyRevenueData}
                margin={{ top: 10, right: 15, left: 0, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? '#27272a' : '#e2e8f0'}
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  stroke={isDark ? '#71717a' : '#64748b'}
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: isDark ? '#3f3f46' : '#cbd5e1' }}
                />
                <YAxis
                  stroke={isDark ? '#71717a' : '#64748b'}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`}
                />
                <Tooltip content={<CustomRevenueTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={36}
                  formatter={(value) => (
                    <span className="text-xs text-zinc-700 dark:text-zinc-300 font-medium ml-1 mr-4">
                      {value === 'revenue' ? 'Total Service Revenue (₹)' : '10% Advance Deposit Collected (₹)'}
                    </span>
                  )}
                />
                <Bar
                  dataKey="revenue"
                  fill={COLORS.gold}
                  radius={[6, 6, 0, 0]}
                  name="revenue"
                  maxBarSize={38}
                />
                <Bar
                  dataKey="advance"
                  fill={COLORS.emerald}
                  radius={[6, 6, 0, 0]}
                  name="advance"
                  maxBarSize={38}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2-COLUMN GRID: SERVICE POPULARITY & CATEGORY REVENUE DISTRIBUTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className={`lg:col-span-7 p-5 sm:p-6 rounded-3xl border shadow-xl space-y-4 transition-all ${
          isDark ? 'bg-[#141418] border-zinc-800' : 'bg-white border-purple-200'
        }`}>
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b ${isDark ? 'border-zinc-800/60' : 'border-purple-200/70'}`}>
            <div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Scissors className="w-4 h-4 text-purple-600 dark:text-yellow-500" />
                <span>Service Popularity &amp; Booking Volume</span>
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Most requested treatments for {periodBadgeText}.
              </p>
            </div>

            <div className={`flex items-center p-1 rounded-xl border text-xs self-end sm:self-auto ${
              isDark ? 'bg-zinc-900 border-zinc-700/60' : 'bg-purple-50 border-purple-200'
            }`}>
              <button
                type="button"
                onClick={() => setServiceMetric('bookings')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  serviceMetric === 'bookings'
                    ? 'bg-yellow-500 text-black font-bold shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                Bookings Count
              </button>
              <button
                type="button"
                onClick={() => setServiceMetric('revenue')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  serviceMetric === 'revenue'
                    ? 'bg-yellow-500 text-black font-bold shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                Revenue (₹)
              </button>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full pt-1">
            {servicePopularityData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-xs text-zinc-500 gap-2 border border-dashed border-zinc-800 rounded-2xl">
                <Scissors className="w-6 h-6 text-zinc-600" />
                <span>No service bookings recorded in this period.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={servicePopularityData}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isDark ? '#27272a' : '#e2e8f0'}
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    stroke={isDark ? '#71717a' : '#64748b'}
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => serviceMetric === 'revenue' ? `₹${val}` : `${val}`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke={isDark ? '#a1a1aa' : '#334155'}
                    fontSize={11}
                    tickLine={false}
                    width={110}
                  />
                  <Tooltip content={<CustomPopularityTooltip />} />
                  <Bar
                    dataKey={serviceMetric}
                    fill={COLORS.gold}
                    radius={[0, 6, 6, 0]}
                    maxBarSize={22}
                  >
                    {servicePopularityData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className={`lg:col-span-5 p-5 sm:p-6 rounded-3xl border shadow-xl space-y-4 flex flex-col justify-between transition-all ${
          isDark ? 'bg-[#141418] border-zinc-800' : 'bg-white border-purple-200'
        }`}>
          <div>
            <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-zinc-800/60' : 'border-purple-200/70'}`}>
              <div>
                <h3 className="font-serif text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-purple-600 dark:text-yellow-500" />
                  <span>Category Revenue Share</span>
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Distribution of earnings across departments
                </p>
              </div>
            </div>

            <div className="h-52 sm:h-56 w-full relative flex items-center justify-center">
              {categoryDistributionData.length === 0 ? (
                <div className="text-center text-xs text-zinc-500 space-y-1">
                  <PieIcon className="w-6 h-6 text-zinc-600 mx-auto" />
                  <div>No category revenue in this period.</div>
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {categoryDistributionData.map((_, index) => (
                          <Cell
                            key={`cat-cell-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                            stroke={isDark ? '#141418' : '#ffffff'}
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Revenue']}
                        contentStyle={{
                          backgroundColor: isDark ? '#09090b' : '#ffffff',
                          borderColor: isDark ? '#27272a' : '#e2e8f0',
                          borderRadius: '12px',
                          fontSize: '12px',
                          color: isDark ? '#f4f4f5' : '#0f172a'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="absolute flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className="text-[10px] text-zinc-400 uppercase font-mono tracking-widest">
                      DEPARTMENTS
                    </span>
                    <span className="text-lg font-bold text-yellow-400 font-serif">
                      {categoryDistributionData.length}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className={`space-y-1.5 pt-2 border-t text-xs ${isDark ? 'border-zinc-800/60' : 'border-purple-200/70'}`}>
            {categoryDistributionData.length === 0 ? (
              <div className="text-zinc-500 text-center py-1">No department earnings yet</div>
            ) : (
              categoryDistributionData.slice(0, 4).map((cat, idx) => (
                <div key={cat.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                    ></span>
                    <span className="text-zinc-700 dark:text-zinc-300 truncate font-medium">{cat.name}</span>
                  </div>
                  <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-200 shrink-0">
                    ₹{cat.value.toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* MONTHLY BREAKDOWN TABLE (START TO END) */}
      <div className={`p-5 sm:p-6 rounded-3xl border shadow-xl space-y-4 ${
        isDark ? 'bg-[#141418] border-zinc-800' : 'bg-white border-purple-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-serif text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Month-by-Month Performance Ledger
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Full chronological breakdown for {periodBadgeText} ({monthlyRevenueData.length} month{monthlyRevenueData.length === 1 ? '' : 's'})
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportAnalyticsCSV}
            className="px-3 py-1.5 rounded-xl bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-800 dark:hover:bg-zinc-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Download Monthly &amp; Booking CSV</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className={`border-b text-[11px] uppercase tracking-wider ${
                isDark ? 'border-zinc-800 text-zinc-400' : 'border-purple-200 text-zinc-600'
              }`}>
                <th className="py-2.5 pr-4">Month</th>
                <th className="py-2.5 px-3 text-right">Bookings</th>
                <th className="py-2.5 px-3 text-right">Total Revenue</th>
                <th className="py-2.5 px-3 text-right">10% Advance</th>
                <th className="py-2.5 pl-3 text-right">Avg Ticket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60 font-mono">
              {monthlyRevenueData.map(row => (
                <tr key={row.key} className="hover:bg-purple-50/40 dark:hover:bg-zinc-900/60 transition">
                  <td className="py-2.5 pr-4 font-sans font-semibold text-zinc-900 dark:text-zinc-100">{row.fullLabel}</td>
                  <td className="py-2.5 px-3 text-right text-zinc-700 dark:text-zinc-300">{row.bookings}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-purple-700 dark:text-amber-400">₹{row.revenue.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">₹{row.advance.toLocaleString()}</td>
                  <td className="py-2.5 pl-3 text-right text-zinc-600 dark:text-zinc-400">₹{row.avgTicket.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className={`border-t-2 font-mono font-bold ${
                isDark ? 'border-zinc-700 text-zinc-100' : 'border-purple-300 text-zinc-900'
              }`}>
                <td className="py-3 pr-4 font-sans">Period Total</td>
                <td className="py-3 px-3 text-right">{activeBookingsCount}</td>
                <td className="py-3 px-3 text-right text-purple-700 dark:text-amber-400">₹{totalRevenueSum.toLocaleString()}</td>
                <td className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400">₹{totalAdvanceSum.toLocaleString()}</td>
                <td className="py-3 pl-3 text-right">₹{avgTicketValue.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
