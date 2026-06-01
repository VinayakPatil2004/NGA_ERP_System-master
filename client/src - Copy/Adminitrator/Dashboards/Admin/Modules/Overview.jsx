import React, { useState, useEffect, useCallback } from 'react';
import { IndianRupee, Users, Shield, BookOpen, LayoutDashboard, ShieldCheck, ArrowUpRight, Calendar } from 'lucide-react';
import axios from 'axios';
import ModuleHeader from '../../../admcomponents/ModuleHeader';

/**
 * Overview - Executive Monitoring Hub
 * Redesigned to utilize card-based metrics and high-parity UI components.
 */
const Overview = ({ toggleSidebar }) => {
    const [stats, setStats] = useState({ revenue: 0, students: 0, staff: 0, classrooms: 0 });
    const [selectedYear, setSelectedYear] = useState('');
    const [academicYearsList, setAcademicYearsList] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadInitialData = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/academic-years/all');
            setAcademicYearsList(response.data);
            const activeYear = response.data.find(y => y.is_active);
            if (activeYear) {
                setSelectedYear(activeYear.year_name);
            } else if (response.data.length > 0) {
                setSelectedYear(response.data[0].year_name);
            }
        } catch (error) {
            console.error("Error loading academic years:", error);
        }
    };

    useEffect(() => {
        loadInitialData();
    }, []);

    const fetchStats = useCallback(async () => {
        if (!selectedYear) return;
        try {
            setLoading(true);
            const yearObj = academicYearsList.find(y => y.year_name === selectedYear);
            if (yearObj) {
                const response = await axios.get(`http://localhost:5000/api/academic-years/stats?yearId=${yearObj.id}`);
                setStats(response.data);
            }
        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setLoading(false);
        }
    }, [selectedYear, academicYearsList]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return (
        <div className="p-4 lg:p-8 space-y-8 min-h-screen bg-[#F8FAFC]">

            {/* 1. Standard Module Header */}
            <ModuleHeader
                title="Executive Overview"
                subTitle="Global Institutional Health Monitoring"
                icon={LayoutDashboard}
                badge={`AY ${selectedYear || "..."}`}
                toggleSidebar={toggleSidebar}
                showSearch={false}
            >
                <div className="flex items-center gap-3">
                    <div className="hidden lg:block">
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="bg-white border border-slate-200 text-[#001736] px-5 py-3 rounded-xl text-[12px] font-bold shadow-sm focus:ring-4 focus:ring-amber-500/10 outline-none uppercase tracking-widest cursor-pointer hover:bg-slate-50 transition-all"
                        >
                            {academicYearsList.map(year => (
                                <option key={year.id} value={year.year_name}>{year.year_name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </ModuleHeader>

            {/* 2. Executive Hero Greeting (Simplified Premium) */}
            <div className="bg-white p-8 lg:p-12 border border-slate-200 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-10 group hover:shadow-md transition-all">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-3 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-xl text-emerald-700">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Administrative Synchronized</span>
                    </div>
                    <h2 className="text-4xl lg:text-5xl font-black text-[#001736] tracking-tight">
                        Institutional <span className="text-amber-500">Live Status.</span>
                    </h2>
                    <p className="max-w-xl text-slate-500 font-medium leading-relaxed text-[13px] uppercase tracking-wide">
                        Global metrics are currently reflecting {stats.students} active enrollees for the {selectedYear} academic cycle. Registry integrity is high.
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
            </div>

            {/* 3. Personalized Metrics Architecture (Standardized Cards) */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
                <MetricCard
                    label="Current Revenue"
                    value={loading ? '...' : `₹${(stats.revenue / 100000).toFixed(2)} L`}
                    icon={IndianRupee}
                    color="bg-emerald-500"
                    trend="Institutional Liquidity"
                />
                <MetricCard
                    label="Student Registry"
                    value={loading ? '...' : stats.students.toLocaleString()}
                    icon={Users}
                    color="bg-amber-500"
                    trend="Total Enrollees"
                />
                <MetricCard
                    label="Personnel Force"
                    value={loading ? '...' : stats.staff}
                    icon={Shield}
                    color="bg-indigo-600"
                    trend="Staff Directory"
                />
                <MetricCard
                    label="Academic Hubs"
                    value={loading ? '...' : stats.classrooms || '0'}
                    icon={BookOpen}
                    color="bg-rose-500"
                    trend="Classroom Contexts"
                />
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
        <div className="bg-white p-4 lg:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4 lg:gap-8 group hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
                <div className={`w-10 h-10 lg:w-14 lg:h-14 rounded-xl ${color} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform border border-white/10`}>
                    <Icon className="w-5 h-5 lg:w-7 lg:h-7 text-white" />
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

export default Overview;
