import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  BookOpen,
  Users,
  Bell,
  ChevronRight,
  Megaphone,
  Info,
  LayoutDashboard,
  ShieldCheck,
  Calendar,
  ArrowRight,
  RefreshCw
} from "lucide-react";
import ModuleHeader from "../../../admcomponents/ModuleHeader";

/**
 * Overview - Teacher Pedagogical Hub
 * Synchronized with 'Simplified Premium' aesthetic for global parity.
 */
const Overview = ({ toggleSidebar }) => {
  const [data, setData] = useState({
    teacher: {},
    classes: [],
    announcements: [],
    notices: []
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem("grace_erp_token")}` }
      };

      const [profileRes, annRes, noticeRes] = await Promise.all([
        axios.get("http://localhost:5000/api/teacher/profile", config),
        axios.get("http://localhost:5000/api/teacher/announcements", config),
        axios.get("http://localhost:5000/api/teacher/notices", config)
      ]);

      setData({
        teacher: profileRes.data.teacher,
        classes: profileRes.data.classes,
        announcements: annRes.data,
        notices: noticeRes.data
      });

    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = [
    {
      label: "Total Classrooms",
      value: data.classes.length,
      icon: Users,
      color: "bg-indigo-600",
      description: "Active rooms"
    },
    {
      label: "Subject Expertise",
      value: data.teacher?.subjects?.split(',').length || 0,
      icon: BookOpen,
      color: "bg-amber-500",
      description: "Mapped areas"
    },
    {
      label: "Institutional Broadcasts",
      value: data.announcements.length,
      icon: Megaphone,
      color: "bg-rose-500",
      description: "Global alerts"
    },
    {
      label: "Targeted Notices",
      value: data.notices.length,
      icon: Bell,
      color: "bg-emerald-500",
      description: "Personal alerts"
    },
  ];

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-[#001736] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Synchronizing Matrix...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-[1600px] mx-auto bg-[#F8FAFC]">

      {/* 1. Dark Institutional Welcome Header */}
      <ModuleHeader
        title="Teacher Dashboard"
        subTitle="Grace ERP Executive Console"
        icon={LayoutDashboard}
        badge="AY 2026-27"
        toggleSidebar={toggleSidebar}
      >
        <div className="flex items-center gap-4">
          <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl shadow-xl">
            <span className="text-white text-[11px] font-black uppercase tracking-[0.3em] opacity-40">SYSTEM HEALTHY</span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="p-4 bg-white/5 border border-white/10 rounded-2xl text-amber-400 hover:bg-white/10 hover:text-amber-300 transition-all shadow-xl active:rotate-180 duration-700"
            title="Synchronize Global Console"
          >
            <RefreshCw size={22} className="opacity-80" />
          </button>
        </div>
      </ModuleHeader>

      {/* 2. Personalized Hero Greeting (Borders & Bold) */}
      <div className="bg-white p-8 lg:p-12 border border-slate-200 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 group hover:shadow-md transition-all">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-xl text-emerald-700">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Pedagogical Identity Active</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-black text-[#001736] tracking-tight">
            Welcome, <span className="text-amber-500">{data.teacher?.full_name?.split(' ')[0]}!</span>
          </h2>
          <p className="max-w-xl text-slate-500 font-medium leading-relaxed uppercase tracking-wide text-[11px]">
            Institutional records show you have {data.classes.length} active classrooms and {data.notices.length} pending notices for review. Registry integrity is high.
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="w-24 h-24 border border-slate-200 rounded-2xl flex flex-col items-center justify-center p-4 bg-white shadow-sm hover:shadow-md transition-all">
            <span className="text-3xl font-black text-[#001736] leading-none">{new Date().getDate()}</span>
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mt-1.5">{new Date().toLocaleString('default', { month: 'short' })}</span>
          </div>
          <div className="w-24 h-24 bg-[#001736] rounded-2xl flex flex-col items-center justify-center p-4 text-white shadow-xl">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Year</span>
            <span className="text-xl font-bold">{new Date().getFullYear()}</span>
          </div>
        </div>
      </div>

      {/* 3. Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-6 group hover:shadow-lg transition-all">
            <div className={`w-14 h-14 rounded-xl ${stat.color} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform border border-white/10`}>
              <stat.icon className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <div className="flex items-end gap-2 text-[#001736]">
                <h3 className="text-3xl font-black leading-none">{stat.value}</h3>
                <span className="text-[9px] font-bold uppercase opacity-30 mb-1">{stat.description}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 4. Main Activity Feed */}
      <div className="grid lg:grid-cols-3 gap-8">

        {/* Global Announcements */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-black text-[#001736] flex items-center gap-3 uppercase tracking-tighter">
              <Megaphone className="text-rose-500 w-6 h-6" />
              Institutional Broadcasts
            </h3>
            <button className="text-[10px] font-bold text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-[0.2em]">View History Registry</button>
          </div>

          <div className="grid gap-4">
            {data.announcements.length > 0 ? data.announcements.map((ann, idx) => (
              <div
                key={ann.id}
                className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex gap-8 items-start group"
              >
                <div className="shrink-0 w-14 h-14 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-[#001736] font-black group-hover:bg-[#001736] group-hover:text-white transition-all">
                  {(idx + 1).toString().padStart(2, '0')}
                </div>
                <div className="space-y-3 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-[#001736] text-xl group-hover:text-amber-600 transition-colors">
                      {ann.title}
                    </h4>
                    <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-50 border border-slate-100 px-5 py-2 rounded-lg">
                      {new Date(ann.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[13px] font-medium leading-relaxed uppercase tracking-tight">
                    {ann.content}
                  </p>
                </div>
              </div>
            )) : (
              <div className="p-20 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-400 font-bold uppercase text-[11px] tracking-widest">Registry Zero: No active broadcasts</p>
              </div>
            )}
          </div>
        </div>

        {/* Targeted Notices */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-black text-[#001736] flex items-center gap-3 uppercase tracking-tighter">
              <Bell className="text-amber-500 w-6 h-6" />
              Response Board
            </h3>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50">
              <p className="text-[10px] font-bold text-[#001736] uppercase tracking-[0.3em] opacity-40">Targeted Synchronization</p>
            </div>
            <div className="divide-y divide-slate-100">
              {data.notices.length > 0 ? data.notices.map((notice) => (
                <div key={notice.id} className="p-8 hover:bg-amber-50 transition-colors space-y-4 group">
                  <div className="flex items-center justify-between">
                    <span className="bg-amber-100 text-amber-700 text-[9px] font-bold px-4 py-1.5 rounded-lg border border-amber-200 uppercase tracking-tighter">
                      Staff Alert
                    </span>
                    <span className="text-[10px] font-bold text-slate-300 group-hover:text-[#001736]">
                      {new Date(notice.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h5 className="font-bold text-[#001736] text-[16px] leading-tight group-hover:text-amber-600 transition-colors">
                    {notice.title}
                  </h5>
                  <p className="text-slate-500 text-[12px] font-medium leading-relaxed uppercase tracking-tight opacity-70">
                    {notice.content}
                  </p>
                </div>
              )) : (
                <div className="p-20 text-center">
                  <p className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.3em]">Board Empty</p>
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