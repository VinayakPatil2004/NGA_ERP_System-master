import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart3,
  BookOpen,
  Users,
  TrendingUp,
  TrendingDown,
  PieChart,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  BookMarked,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Star,
  Award,
  Filter,
  ChevronDown,
  Download,
  Printer,
} from "lucide-react";
import ModuleHeader from "../../../admcomponents/ModuleHeader";
import libraryAPI from "../../../../services/libraryAPI";

/**
 * LibraryReport – Analytics & Reporting Dashboard
 */

const LibraryReport = ({ toggleSidebar }) => {
  const [period, setPeriod] = useState("monthly");
  const [libStats, setLibStats] = useState(null);
  const [books, setBooks] = useState([]);
  const [fines, setFines] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsData, booksData, finesData, txnsData] = await Promise.all([
          libraryAPI.getStats(),
          libraryAPI.getAllBooks(),
          libraryAPI.getFines(),
          libraryAPI.getTransactions(),
        ]);
        setLibStats(statsData);
        setBooks(booksData);
        setFines(finesData);
        setTransactions(txnsData);
      } catch (error) {
        console.error("Failed to fetch report data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Process data for reports
  const categoryDistribution = useMemo(() => {
    const categoryCounts = {};
    books.forEach(b => {
      categoryCounts[b.genre] = (categoryCounts[b.genre] || 0) + (b.copies || 0);
    });
    const total = books.reduce((acc, b) => acc + (b.copies || 0), 0);
    return Object.entries(categoryCounts).map(([category, count]) => ({
      category,
      count,
      percentage: total > 0 ? ((count / total) * 100).toFixed(1) : 0,
       color: "bg-indigo-500" // Consistent color for simplicity or can be mapped
    })).sort((a,b) => b.count - a.count).slice(0, 8);
  }, [books]);

  const topBorrowers = useMemo(() => {
    const borrowerCounts = {};
    transactions.forEach(t => {
      borrowerCounts[t.member_name] = (borrowerCounts[t.member_name] || 0) + 1;
    });
    return Object.entries(borrowerCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((b, idx) => ({ ...b, rank: idx + 1, badge: idx === 0 ? "🏆" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "" }));
  }, [transactions]);

  const overviewStats = [
    { label: "Total Books", value: libStats?.totalBooks || 0, change: "Live", trend: "up", icon: BookOpen, color: "bg-indigo-600" },
    { label: "Active Members", value: libStats?.totalMembers || 0, change: "Live", trend: "up", icon: Users, color: "bg-emerald-500" },
    { label: "Pending Returns", value: libStats?.activeIssues || 0, change: "Live", trend: "down", icon: BookMarked, color: "bg-amber-500" },
    { label: "Overdue Items", value: libStats?.overdueIssues || 0, change: "Live", trend: "up", icon: AlertTriangle, color: "bg-rose-500" },
  ];

  const fineCollection = {
    totalCollected: fines.filter(f => f.status === 'Paid').reduce((a, b) => a + parseFloat(b.amount || 0), 0),
    pending: fines.filter(f => f.status === 'Pending').reduce((a, b) => a + parseFloat(b.amount || 0), 0),
    count: fines.length,
  };

  const monthlyTrend = useMemo(() => {
    const academicMonths = [
      { name: "Jun", calendarIdx: 5 },
      { name: "Jul", calendarIdx: 6 },
      { name: "Aug", calendarIdx: 7 },
      { name: "Sep", calendarIdx: 8 },
      { name: "Oct", calendarIdx: 9 },
      { name: "Nov", calendarIdx: 10 },
      { name: "Dec", calendarIdx: 11 },
      { name: "Jan", calendarIdx: 0 },
      { name: "Feb", calendarIdx: 1 },
      { name: "Mar", calendarIdx: 2 },
      { name: "Apr", calendarIdx: 3 },
      { name: "May", calendarIdx: 4 }
    ];

    const trend = academicMonths.map(m => ({
      month: m.name,
      calendarIdx: m.calendarIdx,
      issued: 0,
      returned: 0
    }));

    transactions.forEach(t => {
      if (!t.issue_date) return;
      const monthIdx = new Date(t.issue_date).getMonth();
      const target = trend.find(m => m.calendarIdx === monthIdx);
      if (target) {
        target.issued++;
        if (t.status && t.status.includes('Returned')) {
          target.returned++;
        }
      }
    });

    return trend;
  }, [transactions]);

  const maxIssued = Math.max(...monthlyTrend.map((m) => m.issued), 1);

  const recentReturns = transactions
    .filter(t => t.status.includes('Returned'))
    .slice(0, 5)
    .map(t => ({
      book: t.bookTitle,
      member: t.member_name,
      date: new Date(t.return_date || t.issue_date).toLocaleDateString(),
      onTime: t.status === 'Returned'
    }));

  const inventoryHealth = [
    { label: "Available", pct: libStats?.totalBooks ? Math.round((libStats.availableBooks / libStats.totalBooks) * 100) : 0, color: "bg-emerald-500", value: libStats?.availableBooks || 0 },
    { label: "Issued", pct: libStats?.totalBooks ? Math.round((libStats.activeIssues / libStats.totalBooks) * 100) : 0, color: "bg-amber-500", value: libStats?.activeIssues || 0 },
    { label: "Overdue", pct: libStats?.activeIssues ? Math.round((libStats.overdueIssues / libStats.activeIssues) * 100) : 0, color: "bg-rose-500", value: libStats?.overdueIssues || 0 },
    { label: "Members", pct: 100, color: "bg-indigo-500", value: libStats?.totalMembers || 0 },
  ];

  if (loading) return <div className="p-20 text-center font-bold text-slate-400 animate-pulse uppercase tracking-[0.3em]">Generating Reports...</div>;

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-[1600px] mx-auto bg-[#F8FAFC] min-h-screen">
      <ModuleHeader
        title="Library Reports"
        subTitle="Analytics & Institutional Insights"
        icon={BarChart3}
        toggleSidebar={toggleSidebar}
        badge="LIBRARY"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="appearance-none bg-white/10 border border-white/20 text-white text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl outline-none cursor-pointer pr-8"
            >
              <option value="weekly" className="text-[#001736]">Weekly</option>
              <option value="monthly" className="text-[#001736]">Monthly</option>
              <option value="yearly" className="text-[#001736]">Yearly</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/60 pointer-events-none" />
          </div>
          <button onClick={() => window.print()} className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all" title="Print Report">
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </ModuleHeader>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {overviewStats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm group hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-lg border bg-emerald-50 text-emerald-600 border-emerald-200`}>
                {stat.change}
              </div>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-3xl font-black text-[#001736]">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Main Report Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* ─── Circulation Trend (Bar Chart) ─── */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-[#001736] uppercase tracking-tighter">Circulation Trend</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Activity over time</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                <span className="text-[10px] font-black text-[#001736] uppercase tracking-widest">Issued</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-[10px] font-black text-[#001736] uppercase tracking-widest">Returned</span>
              </div>
            </div>
          </div>

          {/* Simple Bar Chart */}
          <div className="flex items-end gap-1.5 lg:gap-3 h-48">
            {monthlyTrend.map((month, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex items-end justify-center gap-0.5 lg:gap-1 h-40">
                  <div
                    className="w-2.5 lg:w-4 bg-red-500 rounded-t-lg transition-all duration-500 hover:bg-red-600"
                    style={{ height: `${(month.issued / maxIssued) * 100}%` }}
                    title={`Issued: ${month.issued}`}
                  />
                  <div
                    className="w-2.5 lg:w-4 bg-emerald-500 rounded-t-lg transition-all duration-500 hover:bg-emerald-600"
                    style={{ height: `${(month.returned / maxIssued) * 100}%` }}
                    title={`Returned: ${month.returned}`}
                  />
                </div>
                <span className="text-[8px] lg:text-[10px] font-black text-slate-400 uppercase tracking-wide">{month.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Category Distribution ─── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-h-[400px] overflow-y-auto">
          <h3 className="text-xl font-black text-[#001736] uppercase tracking-tighter mb-6">Category Distribution</h3>
          <div className="space-y-4">
            {categoryDistribution.map((c, idx) => (
              <div key={idx} className="group">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-slate-600 group-hover:text-[#001736] transition-colors">{c.category}</span>
                  <span className="text-[10px] font-bold text-slate-400">{c.count} ({c.percentage}%)</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${c.color} rounded-full transition-all duration-700`}
                    style={{ width: `${c.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* ─── Top Borrowers ─── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100">
            <h3 className="text-lg font-black text-[#001736] uppercase tracking-tighter flex items-center gap-3">
              <Award className="w-5 h-5 text-amber-500" />
              Top Borrowers
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {topBorrowers.map((b) => (
              <div key={b.name} className="px-8 py-5 flex items-center justify-between hover:bg-amber-50/50 transition-colors group">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-black text-amber-600 border border-slate-200">
                     {b.badge || b.rank}
                   </div>
                   <p className="font-bold text-[#001736] text-[13px]">{b.name}</p>
                </div>
                <p className="text-xl font-black text-[#001736]">{b.count}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Recent Returns ─── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
           <div className="px-8 py-6 border-b border-slate-100">
             <h3 className="text-lg font-black text-[#001736] uppercase tracking-tighter flex items-center gap-3">
               <Clock className="w-5 h-5 text-indigo-500" />
               Recent Activity
             </h3>
           </div>
           <div className="divide-y divide-slate-100">
             {recentReturns.map((ret, idx) => (
               <div key={idx} className="px-8 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-[#001736] text-[12px]">{ret.book}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{ret.member}</p>
                  </div>
                  <CheckCircle2 className={`w-4 h-4 ${ret.onTime ? 'text-emerald-500' : 'text-rose-500'}`} />
               </div>
             ))}
           </div>
        </div>
      </div>

      {/* Inventory Health Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <h3 className="text-lg font-black text-[#001736] uppercase tracking-tighter mb-6 flex items-center gap-3">
          <PieChart className="w-5 h-5 text-violet-500" />
          Health Analytics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {inventoryHealth.map((item, idx) => (
            <div key={idx} className="text-center space-y-3">
              <div className="relative w-24 h-24 mx-auto">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                  <path
                    d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={item.color.includes("emerald") ? "#10b981" : item.color.includes("amber") ? "#f59e0b" : item.color.includes("indigo") ? "#6366f1" : "#ef4444"}
                    strokeWidth="3"
                    strokeDasharray={`${item.pct}, 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-black text-[#001736]">{item.pct}%</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.label}</p>
                <p className="text-lg font-black text-[#001736]">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LibraryReport;
