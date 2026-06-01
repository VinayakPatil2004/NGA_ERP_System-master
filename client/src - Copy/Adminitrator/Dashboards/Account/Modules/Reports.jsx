import React from 'react';
import { BarChart3, TrendingDown, PieChart, Download, Filter, ArrowUpRight, ArrowDownLeft, FileText, ShieldCheck } from 'lucide-react';
import ModuleHeader from '../../../admcomponents/ModuleHeader';

/**
 * Financial Reports - Strategic Analytics & Cash Flow Snapshot
 * Refined to the 'Simplified Premium' aesthetic with rounded-2xl and 1px borders.
 */
const Reports = ({ toggleSidebar }) => {
    return (
        <div className="p-4 lg:p-8 space-y-8 min-h-screen bg-[#F8FAFC] font-sans text-left">

            {/* 1. Unified Module Header */}
            <ModuleHeader
                title="Financial Analytics"
                subTitle="Comprehensive Institutional Revenue & Strategic Reports"
                icon={ShieldCheck}
                badge="ANALYTICS CORE"
                toggleSidebar={toggleSidebar}
                showSearch={false}
            >
                <div className="flex items-center gap-3">
                    <button className="bg-white hover:bg-slate-50 px-5 py-3 rounded-xl flex items-center gap-3 transition-all border border-slate-200 shadow-sm group">
                        <Download className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#001736]">Export CSV</span>
                    </button>
                    <button className="bg-[#001736] hover:bg-black px-5 py-3 rounded-xl flex items-center gap-3 transition-all shadow-xl group text-white active:scale-[0.98]">
                        <FileText className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Generate PDF</span>
                    </button>
                </div>
            </ModuleHeader>

            {/* 2. Quick Insights Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InsightCard label="Monthly Revenue" value="₹ 4.8L" trend="+5.2%" isUp={true} icon={ArrowUpRight} />
                <InsightCard label="Pending Receivables" value="₹ 3.2L" trend="-2.1%" isUp={false} icon={ArrowDownLeft} />
                <InsightCard label="Operational Expense" value="₹ 1.5L" trend="+8%" isUp={true} icon={ArrowUpRight} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Revenue Breakdown */}
                <div className="lg:col-span-8 bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-[#001736] uppercase tracking-tight">Revenue Stream</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 opacity-60">Academic Year 2026-27 Distribution</p>
                        </div>
                        <div className="p-1 bg-slate-50 border border-slate-100 rounded-xl flex gap-1 shadow-inner">
                            <button className="px-4 py-2 bg-white text-[#001736] rounded-lg text-[9px] font-bold uppercase shadow-sm border border-slate-200 tracking-widest">Term 1</button>
                            <button className="px-4 py-2 text-slate-400 rounded-lg text-[9px] font-bold uppercase hover:text-[#001736] tracking-widest">Term 2</button>
                        </div>
                    </div>

                    {/* Visual Chart Placeholder */}
                    <div className="h-64 bg-slate-50/50 rounded-xl flex items-center justify-center border border-slate-100 relative group cursor-pointer hover:bg-slate-50 transition-all">
                        <div className="absolute inset-0 flex items-end justify-around p-8 gap-4 overflow-hidden opacity-40">
                            {[40, 60, 45, 80, 55, 90, 70].map((h, i) => (
                                <div key={i} className="w-full bg-indigo-100 rounded-t-lg group-hover:bg-indigo-200 transition-all" style={{ height: `${h}%` }}>
                                    <div className="w-full bg-indigo-500 rounded-t-lg" style={{ height: '40%' }}></div>
                                </div>
                            ))}
                        </div>
                        <div className="z-10 bg-white/90 backdrop-blur-md px-6 py-2.5 rounded-full border border-slate-200 shadow-sm">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#001736] leading-none">Interactive Revenue Projection (Pending)</p>
                        </div>
                    </div>
                </div>

                {/* Expense Allocation */}
                <div className="lg:col-span-4 bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                    <h3 className="text-xl font-bold text-[#001736] mb-8 uppercase tracking-tight">Fund Allocation</h3>
                    <div className="space-y-6">
                        <AllocationRow label="Faculty Payroll" percentage={65} color="bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.3)]" />
                        <AllocationRow label="Infrastructure" percentage={15} color="bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.3)]" />
                        <AllocationRow label="Events & Extracur." percentage={10} color="bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]" />
                        <AllocationRow label="Operational Utility" percentage={10} color="bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                    </div>
                    <div className="mt-8 pt-6 border-t border-slate-50 flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-500 border border-indigo-100">
                            <PieChart className="w-5 h-5 opacity-60" />
                        </div>
                        <p className="text-[10px] font-medium text-slate-400 uppercase leading-relaxed tracking-tight">Expenses are 12% below the allocated budget for this term.</p>
                    </div>
                </div>
            </div>

            {/* Income/Expense Tracking Table Snapshot */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-8 border-b border-slate-50 pb-6">
                    <h3 className="text-xl font-bold text-[#001736] uppercase tracking-tight">Cash Flow Matrix</h3>
                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <Filter className="w-4 h-4 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2 group-hover:text-indigo-500 transition-colors" />
                            <select className="bg-slate-50 border border-slate-200 pl-11 pr-8 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all appearance-none cursor-pointer">
                                <option>All Categories</option>
                                <option>Salary</option>
                                <option>Supplies</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <TransactionItem title="Term 1 Fee Collection" desc="65% of cyclical target" date="MARCH 2026" amount="+ ₹ 3,45,000" type="income" />
                    <TransactionItem title="Utility Maintenance" desc="Electrical & General" date="MARCH 2026" amount="- ₹ 12,500" type="expense" />
                    <TransactionItem title="Sports Day Event" desc="Equipment & Logistics" date="FEB 2026" amount="- ₹ 45,000" type="expense" />
                    <TransactionItem title="New Enrolments" desc="Admission Premium" date="FEB 2026" amount="+ ₹ 82,000" type="income" />
                </div>
            </div>
        </div>
    );
};

const InsightCard = ({ label, value, trend, isUp, icon }) => {
    const Icon = icon;
    return (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all group">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 opacity-60 leading-none">{label}</p>
            <div className="flex items-end justify-between">
                <h4 className="text-3xl font-bold text-[#001736] tracking-tighter leading-none">{value}</h4>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold border ${isUp ? 'text-emerald-600 bg-emerald-50 border-emerald-100 shadow-[0_0_8px_rgba(16,185,129,0.1)]' : 'text-rose-600 bg-rose-50 border-rose-100 shadow-[0_0_8px_rgba(244,63,94,0.1)]'}`}>
                    <Icon className="w-4 h-4 opacity-60" />
                    {trend}
                </div>
            </div>
        </div>
    );
};

const AllocationRow = ({ label, percentage, color }) => (
    <div className="space-y-3">
        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest leading-none">
            <span className="text-slate-400 opacity-80">{label}</span>
            <span className="text-[#001736] tracking-tighter text-xs">{percentage}%</span>
        </div>
        <div className="h-2 w-full bg-slate-50 border border-slate-100 rounded-full overflow-hidden shadow-inner">
            <div className={`h-full ${color} rounded-full transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
        </div>
    </div>
);

const TransactionItem = ({ title, desc, date, amount, type }) => (
    <div className="flex items-center justify-between p-5 bg-slate-50/50 rounded-xl border border-slate-100 hover:bg-white hover:shadow-md transition-all group cursor-pointer">
        <div className="flex items-center gap-5">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shadow-sm group-hover:scale-110 transition-transform ${type === 'income' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                {type === 'income' ? <ArrowUpRight className="w-5 h-5 opacity-60" /> : <ArrowDownLeft className="w-5 h-5 opacity-60" />}
            </div>
            <div>
                <p className="text-[14px] font-bold text-[#001736] uppercase tracking-tight leading-none mb-1">{title}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">{desc} • {date}</p>
            </div>
        </div>
        <p className={`text-base font-bold tracking-tighter ${type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
            {amount}
        </p>
    </div>
);

export default Reports;
