import React, { useState, useEffect, useCallback } from 'react';
import { IndianRupee, Users, Shield, BookOpen, LayoutDashboard, ShieldCheck, ArrowUpRight, Calendar } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';
import API from '../../../../services/API';
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import AttendancePanel from '../../../admcomponents/AttendancePanel';
import { useAuth } from '../../../../context/AuthContext';
import { useAcademicYear } from '../../../../context/AcademicYearContext';

/**
 * Overview - Executive Monitoring Hub
 * Redesigned to utilize card-based metrics and high-parity UI components.
 */
const Overview = ({ toggleSidebar }) => {
    const { user } = useAuth();
    const { selectedYear: globalYear } = useAcademicYear();
    const isPrincipalUser = user?.role?.toLowerCase() === 'principal';
    const [stats, setStats] = useState({ revenue: 0, students: 0, staff: 0, classrooms: 0 });
    const [chartData, setChartData] = useState({ 
        feeSummary: [], 
        enrollmentTrend: [],
        genderRatio: [],
        staffDepartment: [],
        transportRatio: [],
        feeCollectionMonthWise: [],
        todayAttendance: [],
        classWiseAttendance: []
    });
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async (yearId) => {
        if (!yearId) return;
        try {
            setLoading(true);
            const [statsResponse, chartsResponse] = await Promise.all([
                API.get(`/academic-years/stats?yearId=${yearId}`),
                API.get(`/academic-years/dashboard-charts?yearId=${yearId}`)
            ]);
            setStats(statsResponse.data);
            setChartData(chartsResponse.data);
        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (globalYear?.id) {
            fetchStats(globalYear.id);
        }
    }, [globalYear?.id, fetchStats]);

    return (
        <div className="p-4 lg:p-8 space-y-8 min-h-screen bg-[#F8FAFC]">

            {/* 1. Standard Module Header */}
            <ModuleHeader
                title="Executive Overview"
                subTitle="Global Institutional Health Monitoring"
                icon={LayoutDashboard}
                badge={`AY ${globalYear?.year_name || "..."}`}
                toggleSidebar={toggleSidebar}
                showSearch={false}
            >
           
            </ModuleHeader>

            {/* 2. Executive Hero Greeting (Simplified Premium) */}
            {/* <div className="bg-white p-8 lg:p-12 border border-slate-200 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-10 group hover:shadow-md transition-all">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-3 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-xl text-emerald-700">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Administrative Synchronized</span>
                    </div>
                    <h2 className="text-4xl lg:text-5xl font-black text-[#001736] tracking-tight">
                        Institutional <span className="text-amber-500">Live Status.</span>
                    </h2>
                    <p className="max-w-xl text-slate-500 font-medium leading-relaxed text-[13px] uppercase tracking-wide">
                        Global metrics are currently reflecting {stats.students} active enrollees for the {globalYear?.year_name || "..."} academic cycle. Registry integrity is high.
                    </p>
                </div>

                <div className="flex items-center gap-6">
                    <div className="w-28 h-28 border border-slate-200 rounded-2xl flex flex-col items-center justify-center p-4 bg-white shadow-sm hover:-translate-y-1 transition-transform">
                        <p className="text-4xl font-black text-[#001736]">{new Date().getDate()}</p>
                        <p className="text-[11px] font-bold text-amber-500 uppercase tracking-widest">{new Date().toLocaleString('default', { month: 'short' })}</p>
                    </div>
                    <div className="w-28 h-28 bg-[#001736] rounded-2xl flex flex-col items-center justify-center p-4 text-white shadow-xl">
                        <Calendar className="w-6 h-6 mb-2 opacity-50" />
                        <p className="text-xs font-bold uppercase tracking-widest">{new Date().getFullYear()}</p>
                    </div>
                </div>
            </div> */}

            {/* Conditional Attendance & Device Panel for Principals */}
            {isPrincipalUser && (
                <AttendancePanel />
            )}

            {/* 3. Personalized Metrics Architecture (Standardized Cards) */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
                <MetricCard
                    label="Fee Collected Today"
                    value={loading ? '...' : (stats.revenue < 100000 ? `₹${stats.revenue.toLocaleString('en-IN')}` : `₹${(stats.revenue / 100000).toFixed(2)} L`)}
                    icon={IndianRupee}
                    color="bg-emerald-500"
                    trend="Institutional Liquidity"
                />
                <MetricCard
                    label="Student Admissions"
                    value={loading ? '...' : stats.students.toLocaleString()}
                    icon={Users}
                    color="bg-amber-500"
                    trend="Total Enrollees"
                />
                <MetricCard
                    label="Total staff"
                    value={loading ? '...' : stats.staff}
                    icon={Shield}
                    color="bg-indigo-600"
                    trend="Staff Directory"
                />
                <MetricCard
                    label="Total Classrooms"
                    value={loading ? '...' : stats.classrooms || '0'}
                    icon={BookOpen}
                    color="bg-rose-500"
                    trend="Classroom Contexts"
                />
            </div>

            {/* 4. Dashboard Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
                {/* Chart 1: Fee Summary (Pie/Donut Chart) */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center hover:shadow-lg transition-all">
                    <h3 className="w-full text-lg font-black text-[#001736] tracking-tighter uppercase mb-4">Fee Collection Status</h3>
                    {chartData.feeSummary.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie 
                                    data={chartData.feeSummary} 
                                    dataKey="value" 
                                    nameKey="name" 
                                    cx="50%" 
                                    cy="50%" 
                                    innerRadius={70} 
                                    outerRadius={100}
                                    paddingAngle={5}
                                >
                                    {chartData.feeSummary.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.name === 'Collected' ? '#10B981' : '#F59E0B'} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No fee data available</p>
                        </div>
                    )}
                </div>

                {/* Chart 2: Enrollment Trends (Area Chart) */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all">
                    <h3 className="text-lg font-black text-[#001736] tracking-tighter uppercase mb-4">Admission Trends Yearly</h3>
                    {chartData.enrollmentTrend.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={chartData.enrollmentTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="year_name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Area type="monotone" dataKey="students" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorStudents)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No enrollment data available</p>
                        </div>
                    )}
                </div>
            </div>

            {/* New Row: 3 Pie Charts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-8 mt-8">
                {/* Gender Ratio */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center hover:shadow-lg transition-all">
                    <h3 className="w-full text-[13px] font-black text-[#001736] tracking-tighter uppercase mb-4">Gender Ratio</h3>
                    {chartData.genderRatio.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={chartData.genderRatio} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2}>
                                    {chartData.genderRatio.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={['#3B82F6', '#EC4899', '#8B5CF6'][index % 3]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '10px'}} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : ( <p className="text-[10px] text-slate-400 font-bold uppercase py-10">No data</p> )}
                </div>

                {/* Staff Department */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center hover:shadow-lg transition-all">
                    <h3 className="w-full text-[13px] font-black text-[#001736] tracking-tighter uppercase mb-4">Staff by Department</h3>
                    {chartData.staffDepartment.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={chartData.staffDepartment} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2}>
                                    {chartData.staffDepartment.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={['#F59E0B', '#10B981', '#6366F1', '#EC4899', '#8B5CF6'][index % 5]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '10px'}} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : ( <p className="text-[10px] text-slate-400 font-bold uppercase py-10">No data</p> )}
                </div>

                {/* Transport Ratio */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center hover:shadow-lg transition-all">
                    <h3 className="w-full text-[13px] font-black text-[#001736] tracking-tighter uppercase mb-4">Transport Usage</h3>
                    {chartData.transportRatio.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={chartData.transportRatio} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2}>
                                    {chartData.transportRatio.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.name === 'Used' ? '#10B981' : '#EF4444'} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '10px'}} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : ( <p className="text-[10px] text-slate-400 font-bold uppercase py-10">No data</p> )}
                </div>
            </div>

            {/* New Row: 2 Bar Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 mt-8">
                {/* Fee Collection Month-wise */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all">
                    <h3 className="text-lg font-black text-[#001736] tracking-tighter uppercase mb-4">Fee Collection by Month</h3>
                    {chartData.feeCollectionMonthWise.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData.feeCollectionMonthWise} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                                <Tooltip formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} cursor={{fill: '#f8fafc'}} />
                                <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No fee data available</p>
                        </div>
                    )}
                </div>

                {/* Today's Attendance Overview */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all">
                    <h3 className="text-lg font-black text-[#001736] tracking-tighter uppercase mb-4">Today's Attendance</h3>
                    {chartData.todayAttendance.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData.todayAttendance} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} cursor={{fill: '#f8fafc'}} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                <Bar dataKey="present" name="Present" fill="#10B981" radius={[4, 4, 0, 0]} barSize={40} />
                                <Bar dataKey="absent" name="Absent" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No attendance data available</p>
                        </div>
                    )}
                </div>
            </div>

            {/* New Row: Full Width Bar Chart */}
            <div className="mt-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all overflow-x-auto">
                <h3 className="text-lg font-black text-[#001736] tracking-tighter uppercase mb-4">Class-wise Attendance Today</h3>
                {chartData.classWiseAttendance.length > 0 ? (
                    <div style={{ minWidth: `${Math.max(100, chartData.classWiseAttendance.length * 80)}px` }}>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData.classWiseAttendance} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} cursor={{fill: '#f8fafc'}} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                <Bar dataKey="present" name="Present" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} barSize={50} />
                                <Bar dataKey="absent" name="Absent" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={50} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-[300px] flex items-center justify-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No class-wise attendance data available</p>
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * MetricCard - Standard Administrative Metric Container
 */
// eslint-disable-next-line no-unused-vars
const MetricCard = ({ label, value, icon: Icon, color, trend }) => {
    return (
        <div className="bg-white p-4 lg:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-row gap-4 lg:gap-8 group hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
                <div className={`w-8 h-8 lg:w-12 lg:h-12 rounded-xl ${color} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform border border-white/10`}>
                    <Icon className="w-5 h-5 lg:w-7 lg:h-7 text-white" />
                </div>
                
            </div>
            <div>
                <p className="text-[8px] lg:text-[10px] font-bold text-black uppercase tracking-widest mb-1 lg:mb-2">{label}</p>
                <h3 className="text-xl lg:text-4xl font-bold text-[#001736] tracking-tighter leading-none mb-2 lg:mb-3">{value}</h3>
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                    <p className="text-[8px] font-bold text-black uppercase tracking-widest">{trend}</p>
                </div>
            </div>
        </div>
    );
};

export default Overview;
