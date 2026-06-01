import React from 'react';
import { TrendingDown, IndianRupee, PieChart, Activity, Plus, Search, Filter, AlertCircle, CheckCircle } from 'lucide-react';
import DataTable from '../../../../../admcomponents/DataTable';

const ExpenseMonitoring = ({ isMobileSearchOpen }) => {
    return (
        <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Quick Expense Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
                <MetricCard label="Total Spent" value="₹12.4 L" icon={TrendingDown} color="bg-rose-500" trend="MTD" />
                <MetricCard label="Projected" value="₹18.0 L" icon={Activity} color="bg-indigo-600" trend="+5%" />
                <MetricCard label="Operational" value="₹8.2 L" icon={IndianRupee} color="bg-amber-500" trend="Main Office" />
                <MetricCard label="Academic" value="₹4.2 L" icon={PieChart} color="bg-emerald-600" trend="Inventory" />
            </div>

            {/* Approval & Tracking Row (Responsive Toggle) */}
            <div className={`${isMobileSearchOpen ? 'block' : 'hidden lg:block'} bg-white p-6 lg:p-8 rounded-2xl border border-black/5 shadow-sm space-y-6 animate-in slide-in-from-top-2 duration-300`}>
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                    <div className="text-center lg:text-left">
                        <h4 className="text-lg lg:text-xl font-black text-primary tracking-tight uppercase">High-Value Mandates</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Pending Authorization</p>
                    </div>
                    <div className="w-full lg:w-auto">
                         <button className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95">
                            <Plus className="w-4 h-4" /> RECORD EXPENSE
                        </button>
                    </div>
                </div>
            </div>

            <div className="w-full mobile-table-scroll">
                <DataTable
                    headers={[
                        { label: "Institutional Expense ID", className: "w-[180px]" },
                        { label: "Category / Vendor" },
                        { label: "Monetary Value" },
                        { label: "Compliance Status" },
                        { label: "Actions", className: "text-center" }
                    ]}
                    columnCount={5}
                >
                    <tr className="hover:bg-slate-50 transition-colors group">
                        <td className="px-8 py-5 border-r border-slate-100 font-mono text-[11px] font-bold text-slate-500 tracking-wider">EXP-APR-042</td>
                        <td className="px-8 py-5 border-r border-slate-100">
                            <div>
                                <p className="text-[13px] font-black text-primary uppercase tracking-tight">Main Office Supplies</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Vendor: Reliance Stationary</p>
                            </div>
                        </td>
                        <td className="px-8 py-5 border-r border-slate-100 font-mono font-black text-rose-600 text-base">₹42,500.00</td>
                        <td className="px-8 py-5 border-r border-slate-100">
                             <div className="flex items-center gap-2">
                                <AlertCircle className="w-3 h-3 text-amber-500 animate-pulse" />
                                <span className="text-[9px] font-black uppercase text-amber-600 tracking-widest">Pending</span>
                             </div>
                        </td>
                        <td className="px-8 py-5 text-center">
                             <button className="px-5 py-2.5 bg-emerald-600 text-white text-[9px] font-black rounded-lg uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md">Authorize</button>
                        </td>
                    </tr>
                </DataTable>
            </div>

            {/* Analysis Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 pb-10">
                <div className="bg-white p-6 lg:p-8 rounded-2xl border border-black/5 shadow-sm">
                    <h4 className="text-base lg:text-lg font-black text-primary tracking-tight uppercase mb-8">Intensity Distribution</h4>
                    <div className="space-y-6">
                        <ProgressBar label="Salaries & Payroll" percent={65} color="bg-indigo-600" />
                        <ProgressBar label="Maintenance" percent={18} color="bg-amber-500" />
                        <ProgressBar label="Academic Material" percent={12} color="bg-emerald-500" />
                    </div>
                </div>
                <div className="bg-primary p-8 rounded-2xl shadow-xl flex flex-col justify-between min-h-[250px]">
                    <div>
                        <h4 className="text-xl font-black text-white tracking-tight uppercase mb-2">Liquidity Analysis</h4>
                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Institutional Burn Rate</p>
                    </div>
                    <div className="py-6 text-center">
                        <span className="text-5xl lg:text-6xl font-black text-amber-400 tracking-tighter">₹54,200</span>
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.4em] mt-2">Daily Outflow</p>
                    </div>
                    <button className="w-full py-4 border border-white/10 rounded-xl text-white font-black text-[9px] uppercase tracking-widest hover:bg-white/10 transition-all">VIEW SPENDING TRENDS</button>
                </div>
            </div>
        </div>
    );
};

const MetricCard = (props) => {
    const { label, value, icon: Icon, color, trend } = props;
    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-6 group hover:shadow-lg transition-all border-l-4 border-l-transparent hover:border-l-rose-500">
            <div className="flex items-center justify-between">
                <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{trend}</span>
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{label}</p>
                <h3 className="text-3xl font-black text-[#001736] tracking-tight">{value}</h3>
            </div>
        </div>
    );
};

const ProgressBar = ({ label, percent, color }) => (
    <div className="space-y-2">
        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-[#001736]">
            <span>{label}</span>
            <span>{percent}%</span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
            <div className={`h-full ${color} transition-all duration-1000 shadow-xl`} style={{ width: `${percent}%` }} />
        </div>
    </div>
);

export default ExpenseMonitoring;
