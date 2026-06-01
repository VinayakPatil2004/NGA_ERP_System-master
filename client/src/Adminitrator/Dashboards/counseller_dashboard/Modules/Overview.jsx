import React, { useState, useEffect } from 'react';
import { 
  Users, 
  MessageSquare, 
  Calendar, 
  Clock, 
  UserPlus, 
  FileText,
  TrendingUp,
  LayoutDashboard,
  CheckCircle,
  Megaphone
} from 'lucide-react';
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import { getCounsellorStats } from '../../../../services/counsellorAPI';
import AttendancePanel from '../../../admcomponents/AttendancePanel';
import NoticeBoard from '../../../admcomponents/NoticeBoard';
import { useAcademicYear } from '../../../../context/AcademicYearContext';
import API from '../../../../services/API';

const Overview = ({ toggleSidebar }) => {
  const { selectedYear } = useAcademicYear();
  const [stats, setStats] = useState({
    activeEnquiries: 0,
    totalStudents: 0,
    followupsDue: 0,
    sessionsToday: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getCounsellorStats(selectedYear?.year_name);
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch counsellor stats:", error);
      }
    };
    if (selectedYear) fetchStats();
  }, [selectedYear]);

  const statCards = [
    { title: "Active Enquiries", val: stats.activeEnquiries, icon: MessageSquare, color: "text-amber-600", bg: "bg-amber-50" },
    { title: "Active Students", val: stats.totalStudents, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
    { title: "Follow-ups Due", val: stats.followupsDue, icon: Clock, color: "text-rose-600", bg: "bg-rose-50" },
    { title: "Sessions Today", val: stats.sessionsToday, icon: Calendar, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  return (
    <div className="p-0 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <ModuleHeader
        title="Counsellor Dashboard"
        subTitle="Student Lifecycle & Engagement Hub"
        icon={LayoutDashboard}
        toggleSidebar={toggleSidebar}
      />

      {/* Attendance & Device Panel */}
      <AttendancePanel />

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_10px_25px_-10px_rgba(0,0,0,0.08)] flex items-center gap-5 group transition-all duration-300"
          >
            <div className="shrink-0 group-hover:scale-105 transition-transform duration-300">
              <stat.icon className={`w-10 h-10 ${stat.color} opacity-90`} />
            </div>
            
            <div className="flex flex-col">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">
                {stat.title}
              </p>
              <div className="flex items-center gap-2.5">
                <h3 className="text-[32px] font-black text-[#1E293B] tracking-tight leading-none">
                  {stat.val}
                </h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Quick Module Access */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-black text-[#001736] flex items-center gap-3 uppercase tracking-tighter px-2">
            <LayoutDashboard className="text-indigo-500 w-6 h-6" />
            Quick Module Access
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Enquiry Mgmt', path: '/dashboard/counsellor/enquiry', icon: MessageSquare, stat: 'Track prospects' },
              { label: 'Admission Desk', path: '/dashboard/counsellor/admission', icon: UserPlus, stat: 'Manage new intake' },
              { label: 'Student Desk', path: '/dashboard/counsellor/students', icon: Users, stat: 'Active student registry' },
              { label: 'Follow-ups', path: '/dashboard/counsellor/follow-up', icon: Clock, stat: 'Pending engagements' },
              { label: 'Reports & Analytics', path: '/dashboard/counsellor/reports', icon: TrendingUp, stat: 'Data-driven insights' },
            ].map((module, idx) => (
              <button
                key={idx}
                onClick={() => window.location.href = module.path}
                className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all text-left group hover:border-[#001736]/20 active:scale-[0.98]"
              >
                <div className="mb-4 group-hover:scale-105 transition-transform">
                  <module.icon className="w-10 h-10 text-[#001736]" />
                </div>
                <h4 className="font-black text-[#001736] text-[14px] mb-1 group-hover:text-amber-600 transition-colors">
                  {module.label}
                </h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  {module.stat}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Short Notices Board */}
        <div className="space-y-6">
          <h3 className="text-xl font-black text-[#001736] flex items-center gap-3 uppercase tracking-tighter px-2">
            <Megaphone className="text-rose-500 w-6 h-6" />
            Short Notices
          </h3>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <NoticeBoard audience="staff" gridClass="grid-cols-1" limit={5} compact={true} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
