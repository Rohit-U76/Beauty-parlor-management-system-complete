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
  Filter
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

export const AdminCharts: React.FC = () => {
  const { appointments, services, customers, theme } = useSalon();
  const isDark = theme !== 'light';

  const isActiveBooking = (a: { bookingStatus?: string; status?: string }) =>
    ((a.bookingStatus || a.status || 'CONFIRMED').toUpperCase() !== 'CANCELLED');

  // Chart View Controls
  const [revenueChartType, setRevenueChartType] = useState<'area' | 'bar'>('area');
  const [revenueTimeframe, setRevenueTimeframe] = useState<'all' | 'recent'>('all');
  const [serviceMetric, setServiceMetric] = useState<'bookings' | 'revenue'>('bookings');

  // 1. Monthly Revenue & 10% Advance Deposit Dataset (100% Real Appointments across all accounts)
  const monthlyRevenueData = useMemo(() => {
    const activeApts = appointments.filter(isActiveBooking);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();

    // Build rolling 6-month baseline buckets ending at current month
    const buckets = new Map<string, { month: string; revenue: number; advance: number; bookings: number; avgTicket: number }>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      buckets.set(key, {
        month: monthNames[d.getMonth()],
        revenue: 0,
        advance: 0,
        bookings: 0,
        avgTicket: 0
      });
    }

    activeApts.forEach(a => {
      const dateStr = a.date || a.createdAt || '';
      const parsed = dateStr ? new Date(dateStr) : now;
      const d = isNaN(parsed.getTime()) ? now : parsed;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const existing = buckets.get(key) || {
        month: `${monthNames[d.getMonth()]} '${String(d.getFullYear()).slice(-2)}`,
        revenue: 0,
        advance: 0,
        bookings: 0,
        avgTicket: 0
      };
      existing.revenue += Number(a.totalAmount) || 0;
      existing.advance += Number(a.advancePaid) || 0;
      existing.bookings += 1;
      existing.avgTicket = existing.bookings > 0 ? Math.round(existing.revenue / existing.bookings) : 0;
      buckets.set(key, existing);
    });

    const sorted = Array.from(buckets.entries())
      .sort(([kA], [kB]) => kA.localeCompare(kB))
      .map(([, val]) => val);

    return revenueTimeframe === 'recent' ? sorted.slice(-4) : sorted;
  }, [appointments, revenueTimeframe]);

  // 2. Service Popularity & Category Breakdown Dataset (100% Real Appointments across all accounts)
  const { servicePopularityData, categoryDistributionData, topPerformingService, activeBookingsCount } = useMemo(() => {
    const activeApts = appointments.filter(isActiveBooking);
    const serviceCounts: Record<string, { bookings: number; revenue: number; category: string; price: number }> = {};

    activeApts.forEach(a => {
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

    // Format for Service Popularity Bar Chart (Top 6 booked services)
    const popularityArray = Object.entries(serviceCounts)
      .map(([name, data]) => ({
        name: name.length > 20 ? name.substring(0, 18) + '...' : name,
        fullName: name,
        bookings: data.bookings,
        revenue: data.revenue,
        category: data.category,
        advanceCollected: Math.round(data.revenue * 0.1)
      }))
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 6);

    // Format for Category Distribution Pie Chart
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

    const topService = popularityArray[0] || { fullName: 'No bookings yet', bookings: 0, revenue: 0 };

    return {
      servicePopularityData: popularityArray,
      categoryDistributionData: categoryArray,
      topPerformingService: topService,
      activeBookingsCount: activeApts.length
    };
  }, [appointments]);

  // Overall totals for overview metric cards (computed strictly from active appointments)
  const totalRevenueSum = useMemo(() => {
    return appointments
      .filter(isActiveBooking)
      .reduce((acc, cur) => acc + (Number(cur.totalAmount) || 0), 0);
  }, [appointments]);

  const totalAdvanceSum = useMemo(() => {
    return appointments
      .filter(isActiveBooking)
      .reduce((acc, cur) => acc + (Number(cur.advancePaid) || 0), 0);
  }, [appointments]);

  const avgTicketValue = useMemo(() => {
    return activeBookingsCount > 0 ? Math.round(totalRevenueSum / activeBookingsCount) : 0;
  }, [totalRevenueSum, activeBookingsCount]);

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
            <span>{label} 2026</span>
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
      {/* SECTION HEADER & PERFORMANCE SUMMARY */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b ${isDark ? 'border-zinc-800/80' : 'border-purple-200'}`}>
        <div>
          <h2 className="text-xl font-bold font-serif text-purple-800 dark:text-yellow-400 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600 dark:text-yellow-500" />
            <span>Salon Performance Analytics &amp; Revenue Trends</span>
          </h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
            Combined multi-account performance across all {customers.length} CRM clients, {activeBookingsCount} bookings, and 10% advance deposit receipts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-purple-100 dark:bg-yellow-500/10 border border-purple-200 dark:border-yellow-500/30 text-purple-800 dark:text-yellow-400 text-xs font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>All Users Sync Active ({customers.length} Clients)</span>
          </div>
        </div>
      </div>

      {/* 4 SUMMARY STAT STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-4 rounded-2xl border transition-all ${
          isDark ? 'bg-[#141418] border-zinc-800' : 'bg-white border-purple-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1">
            <span>YTD Realized Revenue</span>
            <DollarSign className="w-4 h-4 text-purple-600 dark:text-yellow-500" />
          </div>
          <div className="text-2xl font-bold text-purple-700 dark:text-yellow-400 font-serif">
            ₹{totalRevenueSum.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-500 flex items-center gap-1 mt-1 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{activeBookingsCount} active booking{activeBookingsCount === 1 ? '' : 's'}</span>
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
            Direct Bank UPI verified capture
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
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Monthly Revenue &amp; 10% Advance Realization
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-yellow-500/10 text-purple-700 dark:text-yellow-400 text-[10px] font-bold">
                All Clients
              </span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Tracking total appointment value alongside verified 10% advance deposit receipts month-by-month.
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Timeframe selector */}
            <div className={`flex items-center p-1 rounded-xl border text-xs ${
              isDark ? 'bg-zinc-900 border-zinc-700/60' : 'bg-purple-50 border-purple-200'
            }`}>
              <button
                type="button"
                onClick={() => setRevenueTimeframe('all')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  revenueTimeframe === 'all'
                    ? 'bg-yellow-500 text-black font-bold shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                All Months
              </button>
              <button
                type="button"
                onClick={() => setRevenueTimeframe('recent')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  revenueTimeframe === 'recent'
                    ? 'bg-yellow-500 text-black font-bold shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                Recent (4 Mos)
              </button>
            </div>

            {/* Type selector */}
            <div className={`flex items-center p-1 rounded-xl border text-xs ${
              isDark ? 'bg-zinc-900 border-zinc-700/60' : 'bg-zinc-100 border-zinc-300'
            }`}>
              <button
                type="button"
                onClick={() => setRevenueChartType('area')}
                className={`p-1.5 rounded-lg transition-all ${
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
                className={`p-1.5 rounded-lg transition-all ${
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
                  tickFormatter={(val) => `₹${val / 1000}k`}
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
                  tickFormatter={(val) => `₹${val / 1000}k`}
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
        
        {/* CHART 2: SERVICE POPULARITY (BAR CHART) */}
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
                Most requested treatments and cumulative client reservations across all accounts.
              </p>
            </div>

            {/* Metric Toggle */}
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

          {/* Popularity Bar Chart */}
          <div className="h-64 sm:h-72 w-full pt-1">
            {servicePopularityData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-xs text-zinc-500 gap-2 border border-dashed border-zinc-800 rounded-2xl">
                <Scissors className="w-6 h-6 text-zinc-600" />
                <span>No service bookings recorded yet.</span>
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

        {/* CHART 3: CATEGORY SHARE DONUT CHART */}
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
                  <div>No category revenue recorded yet.</div>
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

                  {/* Center Stat Badge */}
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

          {/* Category Legend List */}
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
    </div>
  );
};
