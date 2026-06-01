import React, { useEffect, useState, useCallback } from "react";
import * as teacherAPI from "../../../../services/teacherAPI";
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
import NoticeBoard from "../../../admcomponents/NoticeBoard";
import { useAcademicYear } from "../../../../context/AcademicYearContext";
import AttendancePanel from "../../../admcomponents/AttendancePanel";
import VisitorApproval from "../../SecurityGuard/Modules/VisitorApproval";

/**
 * Overview - Teacher Pedagogical Hub
 * Synchronized with 'Simplified Premium' aesthetic for global parity.
 */
const Overview = ({ toggleSidebar }) => {
  const { selectedYear: globalYear } = useAcademicYear();
  const [data, setData] = useState({
    teacher: {},
    classes: [],
    subjectsTaught: [],
    announcements: [],
    notices: []
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const yearId = globalYear?.id;
    if (!yearId) return; // Wait for institutional year context

    try {
      setLoading(true);

      const [profileRes] = await Promise.all([
        teacherAPI.getTeacherProfile(yearId)
      ]);

      setData({
        teacher: profileRes.teacher,
        classes: profileRes.classes,
        subjectsTaught: profileRes.subjectsTaught || []
      });
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }, [globalYear?.id]);

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
      label: "Assigned Subjects",
      value: data.subjectsTaught.length,
      icon: BookOpen,
      color: "bg-amber-500",
      description: "Teaching Load"
    },
    {
      label: "Institutional Broadcasts",
      value: "Active",
      icon: Megaphone,
      color: "bg-rose-500",
      description: "Global alerts"
    },
    {
      label: "Targeted Notices",
      value: "Active",
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
        toggleSidebar={toggleSidebar}
      >
        <div className="flex items-center gap-4">
      
          <button
            onClick={() => window.location.reload()}
            className="p-4 bg-white border border-white/10 rounded-2xl text-amber-400 hover:bg-white/50 hover:text-amber-500 transition-all shadow-xl active:rotate-180 duration-700"
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
            Institutional records show you have {data.classes.length} active classrooms. Registry integrity is high.
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

      {/* 2.5 Attendance & Device Panel (New) */}
      <AttendancePanel />

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
                <span className="text-[9px] font-bold uppercase text-black mb-1">{stat.description}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 4. Main Activity Feed */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
           {/* Assigned Subjects Card */}
           <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    <BookOpen className="text-amber-600 w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-[#001736] uppercase tracking-tight">Assigned Subjects</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Academic Load</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-[#001736] text-white text-[10px] font-bold rounded-full uppercase tracking-widest">
                  {data.subjectsTaught.length} Subjects
                </span>
             </div>
             
             <div className="p-6">
                {data.subjectsTaught.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.subjectsTaught.map((sub, idx) => (
                      <div key={idx} className="group p-5 rounded-2xl border border-slate-100 hover:border-amber-200 hover:bg-amber-50/30 transition-all flex items-center justify-between">
                        <div className="space-y-1">
                          <h4 className="font-black text-[#001736] group-hover:text-amber-600 transition-colors uppercase tracking-tight">
                            {sub.subject_name}
                          </h4>
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-black rounded-md uppercase">
                               Class {sub.class_name} {sub.section}
                             </span>
                             {sub.start_time && (
                               <span className="text-[9px] font-bold text-black flex items-center gap-1 uppercase">
                                 <Calendar size={10} /> {sub.start_time} - {sub.end_time}
                               </span>
                             )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border border-dashed border-slate-200">
                       <BookOpen className="text-slate-300 w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">No Subjects Assigned</p>
                      <p className="text-slate-400 text-[10px]">Contact administrator to map your pedagogical units</p>
                    </div>
                  </div>
                )}
             </div>
           </div>
        </div>

        {/* Action Board (Sidebar context) */}
        <div className="space-y-6">
          <NoticeBoard audience="teacher" gridClass="grid-cols-1" limit={5} />
        </div>
      </div>

    </div>
  );
};

export default Overview;