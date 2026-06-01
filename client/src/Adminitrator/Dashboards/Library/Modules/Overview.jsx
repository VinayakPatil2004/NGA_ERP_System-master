import React, { useState, useEffect } from "react";
import {
  BookOpen,
  ArrowLeftRight,
  Calculator,
  BarChart3,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  Users,
  BookMarked,
  AlertTriangle,
  TrendingUp,
  Clock,
  LayoutDashboard,
  RefreshCw,
  Library,
  ArrowRight,
  MapPin,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ModuleHeader from "../../../admcomponents/ModuleHeader";
import NoticeBoard from "../../../admcomponents/NoticeBoard";
import libraryAPI from "../../../../services/libraryAPI";
import AttendancePanel from "../../../admcomponents/AttendancePanel";
import { useAcademicYear } from "../../../../context/AcademicYearContext";

/**
 * Overview – Library Control Hub
 * Hero slider showcasing all library modules + statistics + recent activity.
 */

const slides = [
  {
    id: 1,
    title: "Book Inventory",
    description:
      "Complete catalog of all library assets. Track books by genre, author, ISBN, and availability status in real time.",
    icon: BookOpen,
    color: "from-indigo-600 to-indigo-800",
    accent: "bg-indigo-500",
    path: "book-inventory",
    stat: "Manage entire collection",
  },
  {
    id: 2,
    title: "Issue & Return",
    description:
      "Seamlessly issue books to students and staff, process returns, and maintain a complete transaction ledger.",
    icon: ArrowLeftRight,
    color: "from-emerald-600 to-emerald-800",
    accent: "bg-emerald-500",
    path: "issue-return",
    stat: "Track all transactions",
  },
  {
    id: 3,
    title: "Book Location",
    description:
      "Physical shelf and rack registry. Instantly locate any book by shelf code or rack number in the library.",
    icon: MapPin,
    color: "from-amber-500 to-amber-700",
    accent: "bg-amber-500",
    path: "location",
    stat: "Shelf & rack mapping",
  },
  {
    id: 4,
    title: "Library Reports",
    description:
      "Comprehensive analytics dashboard with circulation trends, top borrowers, genre distribution, and inventory health.",
    icon: BarChart3,
    color: "from-violet-600 to-violet-800",
    accent: "bg-violet-500",
    path: "reports",
    stat: "Data-driven insights",
  },
  {
    id: 5,
    title: "Notices",
    description:
      "Broadcast library notices, new arrivals, event notices, and policy updates to the entire institution.",
    icon: Megaphone,
    color: "from-rose-500 to-rose-700",
    accent: "bg-rose-500",
    path: "notices",
    stat: "Communicate instantly",
  },
];

const Overview = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const [libStats, setLibStats] = useState(null);
  const { selectedYear } = useAcademicYear();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await libraryAPI.getStats(selectedYear?.id);
        setLibStats(data);
      } catch (error) {
        console.error("Failed to fetch library stats:", error);
      }
    };
    fetchStats();
  }, [selectedYear]);



  // Real stats mapping
  const stats = [
    { label: "Total Books", value: libStats?.totalBooks || 0, icon: BookOpen, color: "bg-indigo-600", desc: ["IN", "CATALOG"] },
    { label: "Active Members", value: libStats?.totalMembers || 0, icon: Users, color: "bg-emerald-500", desc: ["REGIS-", "TERED"] },
    { label: "Books Issued", value: libStats?.activeIssues || 0, icon: BookMarked, color: "bg-amber-500", desc: ["CURRENTLY", "OUT"] },
    { label: "Overdue Items", value: libStats?.overdueIssues || 0, icon: AlertTriangle, color: "bg-rose-500", desc: ["PENDING", "RETURN"] },
  ];

  const recentActivity = libStats?.recentIssues || [];

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-[1600px] mx-auto bg-[#F8FAFC] min-h-screen">
      {/* Module Header */}
      <ModuleHeader
        title="Library Dashboard"
        subTitle="Grace ERP · Library Management System"
        icon={LayoutDashboard}
        badge={selectedYear ? `AY ${selectedYear.year_name}` : "LIBRARY"}
        toggleSidebar={toggleSidebar}
      >
        <div className="flex items-center gap-4">
          <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl shadow-xl hidden lg:block">
            <span className="text-white text-[11px] font-black uppercase tracking-[0.3em] opacity-40">
              SYSTEM ACTIVE
            </span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="p-4 bg-white/5 border border-white/10 rounded-2xl text-amber-400 hover:bg-white/10 hover:text-amber-300 transition-all shadow-xl active:rotate-180 duration-700"
            title="Refresh Console"
          >
            <RefreshCw size={22} className="opacity-80" />
          </button>
        </div>
      </ModuleHeader>

      {/* Attendance & Device Panel */}
      <AttendancePanel />

      {/* ═══════════════════ STATISTICS GRID ═══════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_10px_25px_-10px_rgba(0,0,0,0.08)] flex items-center gap-5 group transition-all duration-300"
          >
            {/* Direct Icon - Scaled down rounding elsewhere */}
            <div className="shrink-0 group-hover:scale-105 transition-transform duration-300">
              <stat.icon
                className="w-10 h-10 text-[#001736] opacity-90"
              />
            </div>

            <div className="flex flex-col">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">
                {stat.label}
              </p>
              <div className="flex items-center gap-2.5">
                <h3 className="text-[32px] font-black text-[#1E293B] tracking-tight leading-none">
                  {stat.value}
                </h3>
                <div className="flex flex-col justify-center">
                  {stat.desc.map((line, lIdx) => (
                    <span key={lIdx} className="text-[8px] font-black text-[#CED8E4] uppercase leading-[1.1] tracking-wide">
                      {line}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ═══════════════════ QUICK ACTIONS + ACTIVITY ═══════════════════ */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Quick Module Access & Notice Board */}
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-6">
            <h3 className="text-xl font-black text-[#001736] flex items-center gap-3 uppercase tracking-tighter px-2">
              <Library className="text-indigo-500 w-6 h-6" />
              Quick Module Access
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {slides.map((slide) => {
                const Icon = slide.icon;
                return (
                  <button
                    key={slide.id}
                    onClick={() => navigate(slide.path)}
                    className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all text-left group hover:border-[#001736]/20 active:scale-[0.98]"
                  >
                    <div className="mb-4 group-hover:scale-105 transition-transform">
                      <Icon className="w-10 h-10 text-[#001736]" />
                    </div>
                    <h4 className="font-black text-[#001736] text-[14px] mb-1 group-hover:text-amber-600 transition-colors">
                      {slide.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      {slide.stat}
                    </p>
                  </button>
                );
              })}
            </div>
            
            {/* Institutional Notice Board */}
            <div className="pt-4 border-t border-slate-200">
               <NoticeBoard audience="staff" limit={5} />
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-6">
          <h3 className="text-xl font-black text-[#001736] flex items-center gap-3 uppercase tracking-tighter px-2">
            <Clock className="text-amber-500 w-6 h-6" />
            Activity Feed
          </h3>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50">
              <p className="text-[10px] font-bold text-[#001736] uppercase tracking-[0.3em] opacity-40">
                Live Transactions
              </p>
            </div>
            <div className="divide-y divide-slate-100">
              {recentActivity.length > 0 ? (
                recentActivity.map((item, idx) => (
                  <div
                    key={idx}
                    className="px-6 py-5 hover:bg-amber-50/50 transition-colors group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-[9px] font-bold px-3 py-1 rounded-lg border uppercase tracking-wider ${
                          item.status === "Active"
                            ? "bg-indigo-50 text-indigo-600 border-indigo-100"
                            : "bg-emerald-50 text-emerald-600 border-emerald-100"
                        }`}
                      >
                        Book {item.status === 'Active' ? 'Issued' : 'Returned'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-300 group-hover:text-[#001736] transition-colors">
                        {new Date(item.issue_date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[12px] text-slate-500 font-medium mt-2 leading-relaxed">
                      "{item.bookTitle}" → {item.member_name} ({item.member_class})
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-10 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                  No recent activities
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
