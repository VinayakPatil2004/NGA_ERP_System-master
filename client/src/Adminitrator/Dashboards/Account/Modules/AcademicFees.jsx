import React, { useState, useEffect } from 'react';
import {
    Calendar,
    ChevronDown,
    Download,
    PieChart,
    IndianRupee,
    Users,
    ArrowUpRight,
    Search,
    BookOpen,
    Trophy,
    Coffee,
    ShieldCheck
} from 'lucide-react';
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import financeAPI from '../../../../services/financeAPI';
import { toast } from 'react-hot-toast';

/**
 * AcademicFees - Strategic Fee Structure & Revenue Composition
 * Refined to the 'Simplified Premium' aesthetic with rounded-2xl and 1px borders.
 */
const AcademicFees = ({ toggleSidebar }) => {
    const [selectedYear, setSelectedYear] = useState('2025-26');
    const [searchTerm, setSearchTerm] = useState('');
    const [feeBreakdown, setFeeBreakdown] = useState([]);
    const [summaryData, setSummaryData] = useState({
        totalExpected: "₹ 0 L",
        totalCollected: "₹ 0 L",
        pending: "₹ 0 L",
        percentage: "0%"
    });
    const [loading, setLoading] = useState(true);

    const academicYears = ['2023-24', '2024-25', '2025-26'];

    useEffect(() => {
        const fetchFeeStructures = async () => {
            try {
                setLoading(true);
                const data = await financeAPI.getFeeStructures();
                
                // Map backend keys to frontend
                const mappedFees = data.map(item => ({
                    grade: item.class_name || item.id,
                    tuition: item.tuition_fees || 0,
                    library: item.library_fees || 0,
                    sports: item.sports_fees || 0,
                    exam: item.exam_fees || 0,
                    other: item.other_fees || 0,
                    total: item.total_annual_fees || 0
                }));
                setFeeBreakdown(mappedFees);
                
                // Calculate some basic summary from mapped data if backend didn't provide it
                const total = mappedFees.reduce((acc, curr) => acc + curr.total, 0);
                setSummaryData(prev => ({
                    ...prev,
                    totalExpected: `₹ ${(total / 100000).toFixed(1)} L`
                }));

            } catch (error) {
                console.error("Failed to fetch fee structures:", error);
                toast.error("Registry Sync Failure");
            } finally {
                setLoading(false);
            }
        };
        fetchFeeStructures();
    }, [selectedYear]);

    const filteredFees = feeBreakdown.filter(item =>
        (item.grade || "").toString().toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 lg:p-8 space-y-8 min-h-screen bg-[#F8FAFC] font-sans text-left">

            {/* 1. Unified Module Header */}
            <ModuleHeader
                title="Academic Fee Details"
                subTitle="Strategic Revenue Structure & Year-Wise Composition"
                icon={ShieldCheck}
                badge={`AY ${selectedYear}`}
                toggleSidebar={toggleSidebar}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                searchPlaceholder="Search class or grade specificity..."
            >
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="appearance-none bg-white border border-slate-200 px-6 py-3 pr-12 rounded-xl text-[11px] font-bold text-[#001736] focus:outline-none focus:ring-8 focus:ring-indigo-500/5 shadow-sm cursor-pointer hover:border-indigo-400 transition-all uppercase tracking-widest"
                        >
                            {academicYears.map(year => (
                                <option key={year} value={year}>Acd. Year {year}</option>
                            ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-300 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-indigo-500 transition-colors" />
                    </div>

                    <button className="flex items-center gap-2 bg-[#001736] text-white px-6 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-xl hover:bg-black transition-all active:scale-[0.98]">
                        <Download className="w-4 h-4 opacity-40" />
                        <span>Export CSV</span>
                    </button>
                </div>
            </ModuleHeader>

            {/* 2. Summary Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Expected Revenue"
                    value={summaryData.totalExpected}
                    trend="+12% growth cycle"
                    icon={Calendar}
                    color="text-indigo-600"
                    bgColor="bg-indigo-50"
                />
                <StatCard
                    label="Total Collection"
                    value={summaryData.totalCollected}
                    trend={summaryData.percentage + " recovery rate"}
                    icon={IndianRupee}
                    color="text-emerald-600"
                    bgColor="bg-emerald-50"
                />
                <StatCard
                    label="Outstanding Global"
                    value={summaryData.pending}
                    trend="Needs attention"
                    icon={PieChart}
                    color="text-rose-600"
                    bgColor="bg-rose-50"
                />
                <StatCard
                    label="Active Registry"
                    value="1,240"
                    trend="Synchronized count"
                    icon={Users}
                    color="text-amber-600"
                    bgColor="bg-amber-50"
                />
            </div>

            {/* 3. Fee Structure Matrix */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h2 className="text-[11px] font-bold text-[#001736] uppercase tracking-widest opacity-60">Strategic Structure Console</h2>
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-400 uppercase tracking-widest shadow-sm">
                            Identities Tracked: {filteredFees.length}
                        </span>
                    </div>
                </div>

                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left min-w-[1000px]">
                        <thead>
                            <tr className="bg-white border-b border-slate-100">
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[200px]">Class Identity</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Tuition Matrix</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Library</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Gym/Sports</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Exam Logic</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-indigo-500 bg-indigo-50/30 uppercase tracking-widest text-right">Total Annual</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredFees.map((row) => (
                                <tr key={row.grade} className="group hover:bg-slate-50/30 transition-colors">
                                    <td className="px-8 py-6 border-r border-slate-50">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-[#001736] flex items-center justify-center text-white text-[11px] font-bold border border-black/5 shadow-md group-hover:scale-110 transition-transform">
                                                {row.grade.charAt(0)}
                                            </div>
                                            <span className="font-bold text-[#001736] text-[13px] uppercase tracking-tight">{row.grade}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center text-[#001736] font-medium">₹ {row.tuition.toLocaleString()}</td>
                                    <td className="px-8 py-6 text-center text-[#001736] font-medium">₹ {row.library.toLocaleString()}</td>
                                    <td className="px-8 py-6 text-center text-[#001736] font-medium">₹ {row.sports.toLocaleString()}</td>
                                    <td className="px-8 py-6 text-center text-[#001736] font-medium">₹ {row.exam.toLocaleString()}</td>
                                    <td className="px-8 py-6 bg-indigo-50/10 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <span className="text-[17px] font-bold text-indigo-600 tracking-tighter leading-none">₹ {row.total.toLocaleString()}</span>
                                            <ArrowUpRight className="w-3.5 h-3.5 text-indigo-300 opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0" />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 4. Bottom Composition Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
                <div className="lg:col-span-2 bg-[#001736] rounded-2xl p-10 text-white relative overflow-hidden shadow-2xl group border border-white/10">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl group-hover:scale-150 transition-all duration-1000"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="text-xl font-bold tracking-tight uppercase">Fee Composition Logic</h3>
                                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-2">Breakdown of specific revenue channels</p>
                            </div>
                            <button className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400 hover:text-white transition-all bg-white/5 px-4 py-2 rounded-xl border border-white/5">View All Clusters</button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <HeadUsage icon={BookOpen} title="Library Fund" value="₹ 45,000" color="text-indigo-400" />
                            <HeadUsage icon={Trophy} title="Sports Fund" value="₹ 32,500" color="text-amber-400" />
                            <HeadUsage icon={Coffee} title="Cultural Fund" value="₹ 18,200" color="text-rose-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-10 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center space-y-8 group">
                    <div className="w-20 h-20 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100 shadow-inner group-hover:scale-110 transition-transform">
                        <PieChart className="w-10 h-10 text-emerald-500 opacity-60" />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-[#001736] uppercase tracking-tight">Recovery Status</h4>
                        <p className="text-[11px] font-medium text-slate-400 mt-2 uppercase leading-relaxed tracking-tight">Active collection cycle is 5% ahead of institutional projections.</p>
                    </div>
                    <div className="w-full h-2.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                        <div className="w-[70%] h-full bg-emerald-500 transition-all duration-1000 shadow-[0_0_12px_rgba(16,185,129,0.4)]"></div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-4 py-1 rounded-lg border border-emerald-100 shadow-sm">70.3% Target Captured</span>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ label, value, trend, icon, color, bgColor }) => {
    const Icon = icon;
    return (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-xl ${bgColor} border border-black/5 shadow-md transition-transform group-hover:scale-110 duration-300`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <div className="flex flex-col items-end">
                    <ArrowUpRight className="w-4 h-4 text-slate-100 group-hover:text-indigo-400 transition-colors" />
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 animate-pulse" />
                </div>
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 opacity-60 leading-none">{label}</p>
                <h4 className="text-3xl font-bold text-[#001736] tracking-tighter leading-none">{value}</h4>
                <p className="text-[9px] font-bold text-slate-300 mt-4 uppercase tracking-widest flex items-center gap-1.5 leading-none opacity-80">
                    <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                    {trend}
                </p>
            </div>
        </div>
    );
};

const HeadUsage = ({ icon, title, value, color }) => {
    const Icon = icon;
    return (
        <div className="bg-white/5 border border-white/5 rounded-2xl p-6 hover:bg-white/10 transition-all cursor-pointer group/card active:scale-[0.98]">
            <div className={`w-10 h-10 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center mb-5 group-hover/card:border-white/20 transition-all`}>
                <Icon className={`w-5 h-5 ${color} opacity-80 group-hover/card:scale-110 transition-transform`} />
            </div>
            <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-2 leading-none">{title}</p>
            <p className="text-[17px] font-bold text-white tracking-tighter leading-none">{value}</p>
        </div>
    );
};

export default AcademicFees;
