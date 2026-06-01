import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, ClipboardCheck, IndianRupee, CalendarOff, TrendingUp, ArrowUpRight, Clock, UserCheck, UserX, Briefcase, ShieldCheck } from 'lucide-react';
import API from '../../../../services/API';
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import { useNavigate } from 'react-router-dom';
import NoticeBoard from '../../../admcomponents/NoticeBoard';
import AttendancePanel from '../../../admcomponents/AttendancePanel';

/**
 * HROverview - HR Executive Dashboard
 * Displays key HR metrics: staff count, attendance overview, payroll summary, leave stats
 */
const HROverview = ({ toggleSidebar }) => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalStaff: 0,
        activeStaff: 0,
        inactiveStaff: 0,
        teachingStaff: 0,
        nonTeachingStaff: 0,
        presentToday: 0,
        absentToday: 0,
        onLeaveToday: 0,
        totalPayroll: 0
    });
    const [recentStaff, setRecentStaff] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch staff stats
            await API.get('/staff/stats');
            
            // Fetch all staff for recent additions
            const allStaffRes = await API.get('/staff/all');
            const staffList = allStaffRes.data || [];

            // Fetch today's attendance
            const today = new Date().toISOString().split('T')[0];
            let attendanceData = { present: 0, absent: 0, onLeave: 0 };
            try {
                const attRes = await API.get(`/attendance/staff?date=${today}`);
                const records = attRes.data || [];
                attendanceData.present = records.filter(r => r.status === 'present').length;
                attendanceData.absent = records.filter(r => r.status === 'absent').length;
                attendanceData.onLeave = records.filter(r => r.status === 'leave').length;
            } catch {
                console.log('Attendance data not available yet');
            }

            const activeStaff = staffList.filter(s => s.status === 'active');
            const inactiveStaff = staffList.filter(s => s.status === 'inactive');
            const teachingStaff = staffList.filter(s => s.staff_type === 'teaching');
            const nonTeachingStaff = staffList.filter(s => s.staff_type === 'non-teaching');
            const totalPayroll = staffList.reduce((sum, s) => sum + (parseFloat(s.salary) || 0), 0);

            setStats({
                totalStaff: staffList.length,
                activeStaff: activeStaff.length,
                inactiveStaff: inactiveStaff.length,
                teachingStaff: teachingStaff.length,
                nonTeachingStaff: nonTeachingStaff.length,
                presentToday: attendanceData.present,
                absentToday: attendanceData.absent,
                onLeaveToday: attendanceData.onLeave,
                totalPayroll
            });

            // Get 5 most recently added staff
            const sorted = [...staffList].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setRecentStaff(sorted.slice(0, 5));
        } catch (error) {
            console.error('Error fetching HR dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const quickActions = [
        { label: 'Staff Management', icon: Users, path: '/dashboard/hr/staff-management', color: 'bg-blue-500' },
        { label: 'Mark Attendance', icon: ClipboardCheck, path: '/dashboard/hr/staff-attendance', color: 'bg-emerald-500' },
        { label: 'Process Payroll', icon: IndianRupee, path: '/dashboard/hr/staff-payroll', color: 'bg-amber-500' },
        { label: 'Leave Requests', icon: CalendarOff, path: '/dashboard/hr/leave-management', color: 'bg-rose-500' },
    ];

    return (
        <div className="p-4 lg:p-8 space-y-8 min-h-screen bg-[#F8FAFC]">

            {/* Module Header */}
            <ModuleHeader hideAcademicYear={true}
                title="HR Dashboard"
                subTitle="Human Resource Management Overview"
                icon={LayoutDashboard}
                badge="HR Module"
                toggleSidebar={toggleSidebar}
                showSearch={false}
            />

            {/* Hero Section */}
            <div className="bg-white p-8 lg:p-12 border border-slate-200 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-10 group hover:shadow-md transition-all">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-3 bg-blue-50 border border-blue-100 px-4 py-2 rounded-xl text-blue-700">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">HR System Active</span>
                    </div>
                    <h2 className="text-3xl lg:text-5xl font-black text-[#001736] tracking-tight">
                        Human Resource <span className="text-amber-500">Control Center.</span>
                    </h2>
                    <p className="max-w-xl text-slate-500 font-medium leading-relaxed text-[13px] uppercase tracking-wide">
                        Managing {stats.totalStaff} personnel across {stats.teachingStaff} teaching and {stats.nonTeachingStaff} non-teaching positions. All systems operational.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="w-28 h-28 border border-slate-200 rounded-2xl flex flex-col items-center justify-center p-4 bg-white shadow-sm hover:-translate-y-1 transition-transform">
                        <p className="text-4xl font-black text-[#001736]">{stats.activeStaff}</p>
                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Active</p>
                    </div>
                    <div className="w-28 h-28 bg-[#001736] rounded-2xl flex flex-col items-center justify-center p-4 text-white shadow-xl">
                        <Briefcase className="w-6 h-6 mb-2 opacity-50" />
                        <p className="text-xs font-bold uppercase tracking-widest">Staff</p>
                    </div>
                </div>
            </div>

            {/* Attendance & Device Panel */}
            <AttendancePanel />

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <MetricCard
                    label="Total Staff"
                    value={loading ? '...' : stats.totalStaff}
                    icon={Users}
                    color="bg-blue-600"
                    trend="Active Personnel"
                />
                <MetricCard
                    label="Present Today"
                    value={loading ? '...' : stats.presentToday}
                    icon={UserCheck}
                    color="bg-emerald-500"
                    trend="Today's Attendance"
                />
                <MetricCard
                    label="On Leave"
                    value={loading ? '...' : stats.onLeaveToday}
                    icon={CalendarOff}
                    color="bg-amber-500"
                    trend="Leave Status"
                />
                <MetricCard
                    label="Monthly Payroll"
                    value={loading ? '...' : `₹${(stats.totalPayroll / 1000).toFixed(1)}K`}
                    icon={IndianRupee}
                    color="bg-rose-500"
                    trend="Total Salary Outflow"
                />
            </div>

            {/* Quick Actions & Staff Composition */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <div className="bg-white p-6 lg:p-8 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {quickActions.map(action => (
                            <button
                                key={action.label}
                                onClick={() => navigate(action.path)}
                                className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all group hover:-translate-y-1"
                            >
                                <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                                    <action.icon className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider text-center">{action.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Staff Composition */}
                <div className="bg-white p-6 lg:p-8 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Staff Composition</h3>
                    <div className="space-y-5">
                        <CompositionBar label="Teaching Staff" count={stats.teachingStaff} total={stats.totalStaff} color="bg-blue-500" />
                        <CompositionBar label="Non-Teaching Staff" count={stats.nonTeachingStaff} total={stats.totalStaff} color="bg-amber-500" />
                        <CompositionBar label="Active" count={stats.activeStaff} total={stats.totalStaff} color="bg-emerald-500" />
                        <CompositionBar label="Inactive" count={stats.inactiveStaff} total={stats.totalStaff} color="bg-rose-400" />
                    </div>
                    <div className="mt-8 flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            {stats.totalStaff > 0 ? ((stats.activeStaff / stats.totalStaff) * 100).toFixed(0) : 0}% Active Rate
                        </span>
                    </div>
                </div>

                {/* Recent Staff Additions */}
                <div className="bg-white p-6 lg:p-8 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Recently Added Staff</h3>
                    <div className="space-y-4">
                        {recentStaff.length === 0 && !loading && (
                            <p className="text-sm text-slate-400 text-center py-8">No staff records found</p>
                        )}
                        {recentStaff.map((staff, idx) => (
                            <div key={staff.id || idx} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md">
                                    {staff.full_name?.charAt(0) || '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-[#001736] truncate">{staff.full_name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{staff.employee_id}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                    staff.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                                }`}>
                                    {staff.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Attendance Summary Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-6 group hover:shadow-md transition-all">
                    <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                        <UserCheck className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Present Today</p>
                        <p className="text-3xl font-black text-[#001736]">{stats.presentToday}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-6 group hover:shadow-md transition-all">
                    <div className="w-16 h-16 bg-rose-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                        <UserX className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Absent Today</p>
                        <p className="text-3xl font-black text-[#001736]">{stats.absentToday}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-6 group hover:shadow-md transition-all">
                    <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                        <Clock className="w-8 h-8 text-white" />
                    </div>
                </div>
            </div>

            {/* Notice Board Integration */}
            <div className="pt-4 border-t border-slate-200">
                <NoticeBoard audience="staff" limit={5} />
            </div>
        </div>
    );
};

/** MetricCard Component */
const MetricCard = (props) => {
    const { label, value, icon: MetricIcon, color, trend } = props;
    return (
        <div className="bg-white p-4 lg:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4 lg:gap-8 group hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
                <div className={`w-10 h-10 lg:w-14 lg:h-14 rounded-xl ${color} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform border border-white/10`}>
                    <MetricIcon className="w-5 h-5 lg:w-7 lg:h-7 text-white" />
                </div>
                <ArrowUpRight className="hidden lg:block w-5 h-5 text-slate-200 group-hover:text-[#001736] transition-colors" />
            </div>
            <div>
                <p className="text-[8px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 lg:mb-2">{label}</p>
                <h3 className="text-xl lg:text-4xl font-bold text-[#001736] tracking-tighter leading-none mb-2 lg:mb-3">{value}</h3>
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{trend}</p>
                </div>
            </div>
        </div>
    );
};

/** CompositionBar Component */
const CompositionBar = ({ label, count, total, color }) => {
    const pct = total > 0 ? (count / total) * 100 : 0;
    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">{label}</span>
                <span className="text-[11px] font-black text-[#001736]">{count}</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
};

export default HROverview;
