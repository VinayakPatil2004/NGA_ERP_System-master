import React, { useState, useEffect } from 'react';
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import { CreditCard, Users, TrendingUp, AlertCircle, Calendar, MessageSquare, ChevronRight, Eye, FileText, Clock, CheckCircle, ShieldCheck } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import StudentProfile from '../../../admpages/StudentProfile';
import NoticeBoard from '../../../admcomponents/NoticeBoard';
import financeAPI from '../../../../services/financeAPI';
import API from '../../../../services/API';
import AttendancePanel from '../../../admcomponents/AttendancePanel';

/**
 * Accountant Overview - Strategic Financial & Registry Insight
 * Refined to the 'Simplified Premium' aesthetic with rounded-2xl and 1px borders.
 */
const Overview = ({ selectedYear, selectedYearName, toggleSidebar }) => {
    const [detailView, setDetailView] = useState(null); // 'pending' or null
    const [viewingStudent, setViewingStudent] = useState(null);
    const [stats, setStats] = useState({ total: 0, pending: 0, inReview: 0, approved: 0, paid: 0, enrolled: 0 });
    const [financeStats, setFinanceStats] = useState({ totalExpenses: 0, pendingBills: 0, monthlyBudget: 0 });
    const [chartData, setChartData] = useState({ feeSummary: [], feeCollectionMonthWise: [] });

    useEffect(() => {
        const fetchAllStats = async () => {
            try {
                // Fetch admission-related stats if available
                // const admissionData = await getAdmissionStats(); 
                
                // Fetch Finance Stats
                const fStats = await financeAPI.getExpenseStats();
                setFinanceStats({
                    totalExpenses: fStats.yearlyTotal || 0,
                    pendingBills: fStats.pending_amount || 0,
                    monthlyBudget: fStats.monthly_limit || 0
                });

                if (selectedYear) {
                    const statsResponse = await API.get(`/academic-years/stats?yearId=${selectedYear}`);
                    setStats(statsResponse.data);

                    const chartsResponse = await API.get(`/academic-years/dashboard-charts?yearId=${selectedYear}`);
                    setChartData(chartsResponse.data);
                }
            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
            }
        };
        fetchAllStats();
    }, [selectedYear]);

    const pendingStudents = [
        { id: 1, name: "Arjun Verma", grade: "10th A", due: "₹ 5,000", phone: "9876543210", srNo: "SR2026001", section: "A" },
        { id: 2, name: "Isha Patel", grade: "8th B", due: "₹ 12,000", phone: "9876543211", srNo: "SR2026002", section: "B" },
        { id: 3, name: "Karan Singh", grade: "5th C", due: "₹ 3,500", phone: "9876543212", srNo: "SR2026003", section: "C" },
    ];

    if (viewingStudent) {
        return <StudentProfile student={viewingStudent} onBack={() => setViewingStudent(null)} />;
    }

    return (
        <div className='p-0 space-y-8 min-h-screen bg-[#F8FAFC] font-sans text-left'>
            <ModuleHeader
                title="Accountant Overview"
                subTitle="Strategic Financial & Registry Insight"
                icon={TrendingUp}
                badge={`AY ${selectedYearName || "..."}`}
                toggleSidebar={toggleSidebar}
                showSearch={false}
            />
            
            {/* Attendance & Device Panel */}
            <AttendancePanel />
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Yearly Expenses" 
                    value={`₹ ${financeStats.totalExpenses?.toLocaleString('en-IN') || 0}`} 
                    trend="Total Expense Yearly" 
                    icon={TrendingUp} 
                    color="bg-rose-600" 
                />
                <StatCard 
                    title="Today's Collection" 
                    value={`₹ ${stats.revenue?.toLocaleString('en-IN') || 0}`} 
                    trend="Fee Collect Today" 
                    icon={CreditCard} 
                    color="bg-indigo-600" 
                />
                <StatCard 
                    title="Pending Students" 
                    value={chartData.pendingStudentsCount || 0} 
                    trend="Pending Fee Quantity" 
                    icon={Clock} 
                    color="bg-amber-500" 
                />
                <StatCard 
                    title="Yearly Collection" 
                    value={`₹ ${(chartData.feeSummary?.find(f => f.name === 'Collected')?.value || 0).toLocaleString('en-IN')}`} 
                    trend="Fee Collected This Year" 
                    icon={CheckCircle} 
                    color="bg-emerald-600" 
                />
            </div>

            {/* Conditional Detail: Pending Fees Students */}
            {detailView === 'pending' && (
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-rose-100 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold text-[#001736] flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-rose-500" />
                            Overdue Registry Reminders
                        </h3>
                        <button onClick={() => setDetailView(null)} className="text-[10px] font-bold text-rose-500 uppercase tracking-widest hover:bg-rose-50 px-4 py-2 rounded-xl transition-all border border-transparent hover:border-rose-100">Dismiss</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {pendingStudents.map(student => (
                            <div key={student.id} className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-rose-200 transition-all flex flex-col items-center text-center group">
                                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center font-bold text-rose-500 text-sm mb-4 border border-slate-100 group-hover:scale-110 transition-transform">
                                    {student.name.charAt(0)}
                                </div>
                                <h4 className="font-bold text-[#001736] mb-1">{student.name}</h4>
                                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-4">{student.grade}</p>
                                <div className="bg-white rounded-xl p-4 w-full border border-slate-100 shadow-sm">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 opacity-60">Pending Dues</p>
                                    <p className="text-lg font-bold text-[#001736] tracking-tighter">{student.due}</p>
                                </div>
                                <button 
                                    onClick={() => setViewingStudent(student)}
                                    className="mt-4 flex items-center gap-2 text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:gap-3 transition-all"
                                >
                                    Review Specification <Eye className="w-3.5 h-3.5 opacity-40" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Charts & Notifications Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Fee Collection Status (Pie Chart) */}
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center hover:shadow-lg transition-all">
                    <h3 className="w-full text-[13px] font-black text-[#001736] tracking-tighter uppercase mb-4">Fee Collection Status</h3>
                    {chartData.feeSummary && chartData.feeSummary.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie 
                                    data={chartData.feeSummary} 
                                    dataKey="value" 
                                    nameKey="name" 
                                    cx="50%" 
                                    cy="50%" 
                                    innerRadius={50} 
                                    outerRadius={80}
                                    paddingAngle={5}
                                >
                                    {chartData.feeSummary.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.name === 'Collected' ? '#10B981' : '#F59E0B'} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '10px'}} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[250px] flex items-center justify-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No data available</p>
                        </div>
                    )}
                </div>

                {/* Fee Collection by Month (Bar Chart) */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all">
                    <h3 className="text-[13px] font-black text-[#001736] tracking-tighter uppercase mb-4">Fee Collection by Month</h3>
                    {chartData.feeCollectionMonthWise && chartData.feeCollectionMonthWise.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={chartData.feeCollectionMonthWise} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                                <Tooltip formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} cursor={{fill: '#f8fafc'}} />
                                <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[250px] flex items-center justify-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No fee data available</p>
                        </div>
                    )}
                </div>

                {/* Short Institutional Notice Board */}
                <div className="lg:col-span-3 space-y-8">
                    <NoticeBoard audience="staff" limit={5} />
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, trend, icon, color, onClick }) => {
    const Icon = icon;
    return (
        <div 
            onClick={onClick}
            className={`p-8 rounded-2xl shadow-sm border border-slate-200 transition-all bg-white relative overflow-hidden group ${onClick ? 'cursor-pointer hover:shadow-lg active:scale-[0.98]' : ''}`}
        >
            <div className="flex items-center justify-between mb-6">
                <div className={`p-4 rounded-xl border border-black/5 shadow-md flex items-center justify-center ${color} text-white group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
            <p className="text-[11px] font-bold text-black uppercase tracking-widest mb-1.5 leading-none">{title}</p>
            <h4 className="text-3xl font-bold text-black tracking-tighter leading-none mb-1.5">{value?.toLocaleString() || 0}</h4>
            <p className="text-[10px] font-bold text-black uppercase tracking-widest italic">{trend}</p>
            
            <div className={`absolute bottom-0 right-0 w-20 h-20 rounded-full bg-slate-50 filter blur-3xl -mr-10 -mb-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
        </div>
    );
};

export default Overview;
