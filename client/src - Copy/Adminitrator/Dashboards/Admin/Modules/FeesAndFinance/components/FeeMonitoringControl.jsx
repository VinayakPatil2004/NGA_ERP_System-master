import React from 'react';
import { Activity, IndianRupee, TrendingUp, Users, AlertTriangle, ArrowUpRight, BarChart3 } from 'lucide-react';
import DataTable from '../../../../../admcomponents/DataTable';

const FeeMonitoringControl = () => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Quick Metrics Hero Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <MetricCard 
                    label="Expected Revenue" 
                    value="₹1.42 Cr" 
                    icon={IndianRupee} 
                    color="bg-indigo-600" 
                    trend="+12%" 
                    subtitle="System Total" 
                />
                <MetricCard 
                    label="Realized Collection" 
                    value="₹84.5 L" 
                    icon={TrendingUp} 
                    color="bg-emerald-600" 
                    trend="59.5%" 
                    subtitle="Current Liquidity" 
                />
                <MetricCard 
                    label="Outstanding Dues" 
                    value="₹57.5 L" 
                    icon={AlertTriangle} 
                    color="bg-amber-500" 
                    trend="Requires Action" 
                    subtitle="Defaulter Total" 
                />
                <MetricCard 
                    label="Institutional Reach" 
                    value="842" 
                    icon={Users} 
                    color="bg-rose-500" 
                    trend="Students" 
                    subtitle="Paying Base" 
                />
            </div>

            {/* Analysis & Visualization Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-[450px]">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-xl font-black text-[#001736] tracking-tight uppercase">Revenue Flow Dynamics</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time expected vs collected comparison</p>
                        </div>
                        <div className="flex gap-4">
                            <LegendItem color="bg-indigo-600" label="Expected" />
                            <LegendItem color="bg-emerald-500" label="Collected" />
                        </div>
                    </div>
                    {/* Placeholder for Chart Visualization */}
                    <div className="flex-1 mt-8 border-b-2 border-slate-100 flex items-end justify-between px-6 pt-10">
                        <ChartBar height="40%" label="Apr" />
                        <ChartBar height="65%" label="May" />
                        <ChartBar height="85%" label="Jun" />
                        <ChartBar height="55%" label="Jul" />
                        <ChartBar height="70%" label="Aug" active />
                        <ChartBar height="30%" label="Sep" />
                    </div>
                </div>

                <div className="bg-[#001736] p-8 rounded-2xl shadow-xl flex flex-col h-[450px]">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-center">
                            <Activity className="w-6 h-6 text-rose-500" />
                        </div>
                        <h4 className="text-xl font-black text-white tracking-tight uppercase">Defaulter Intensity</h4>
                    </div>
                    <div className="flex-1 space-y-8">
                        <IntensityItem label="Critical (3+ Months)" value="42 Students" percent={15} color="bg-rose-500" />
                        <IntensityItem label="Moderate (2 Months)" value="128 Students" percent={45} color="bg-amber-500" />
                        <IntensityItem label="Minor (1 Month)" value="312 Students" percent={85} color="bg-emerald-500" />
                    </div>
                    <button className="w-full py-5 bg-white text-[#001736] rounded-xl font-black text-[12px] uppercase tracking-widest shadow-lg hover:bg-amber-400 transition-all active:scale-95 mt-10">
                        DOWNLOAD DRILL-DOWN REPORT
                    </button>
                </div>
            </div>

            {/* Real-time Collection Log */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <h4 className="text-xl font-black text-[#001736] tracking-tight uppercase">Registry Live Stream</h4>
                    <span className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black tracking-widest uppercase text-slate-400">Class-wise Analysis</span>
                </div>
                <DataTable
                    headers={[
                        { label: "Institutional Class", className: "w-[200px]" },
                        { label: "Expected Value" },
                        { label: "Realized Value" },
                        { label: "Deficiency Delta" },
                        { label: "Integrity Metric", className: "text-right" }
                    ]}
                    columnCount={5}
                >
                    <tr className="hover:bg-slate-50 transition-colors group">
                        <td className="px-8 py-5 border-r border-slate-100 font-bold text-[#001736] uppercase tracking-tight">Grade 10 - All Sections</td>
                        <td className="px-8 py-5 border-r border-slate-100 font-mono font-bold text-slate-500">₹12,45,000.00</td>
                        <td className="px-8 py-5 border-r border-slate-100 font-mono font-bold text-emerald-600">₹11,10,000.00</td>
                        <td className="px-8 py-5 border-r border-slate-100 font-mono font-bold text-rose-500">₹1,35,000.00</td>
                        <td className="px-8 py-5 text-right">
                             <span className="px-4 py-1.5 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-lg">89.2% RECOVERY</span>
                        </td>
                    </tr>
                </DataTable>
            </div>
        </div>
    );
};

const MetricCard = (props) => {
    const { label, value, icon: Icon, color, trend, subtitle } = props;
    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-6 group hover:shadow-lg transition-all border-b-4 border-b-transparent hover:border-b-indigo-500">
            <div className="flex items-center justify-between">
                <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-1 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    {trend} <ArrowUpRight className="w-3 h-3" />
                </div>
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{label}</p>
                <h3 className="text-3xl font-black text-[#001736] tracking-tight">{value}</h3>
                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1.5">{subtitle}</p>
            </div>
        </div>
    );
};

const LegendItem = ({ color, label }) => (
    <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${color}`} />
        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{label}</span>
    </div>
);

const IntensityItem = ({ label, value, percent, color }) => (
    <div className="space-y-2">
        <div className="flex justify-between items-center text-white/50 text-[10px] font-bold uppercase tracking-widest">
            <span>{label}</span>
            <span className="text-white">{value}</span>
        </div>
        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
            <div className={`h-full ${color} shadow-lg`} style={{ width: `${percent}%` }} />
        </div>
    </div>
);

const ChartBar = ({ height, label, active }) => (
    <div className="flex flex-col items-center gap-4 group cursor-pointer h-full justify-end">
        <div className="flex items-end gap-1.5 h-full w-10">
            <div className={`w-full bg-slate-100 rounded-t-lg transition-all duration-700 group-hover:bg-indigo-300`} style={{ height }} />
            <div className={`w-full ${active ? 'bg-indigo-600' : 'bg-emerald-500'} rounded-t-lg transition-all duration-700 scale-y-75 group-hover:scale-y-100 group-hover:opacity-100 opacity-80`} style={{ height }} />
        </div>
        <span className={`text-[10px] font-black uppercase tracking-widest ${active ? 'text-indigo-600' : 'text-slate-400'}`}>{label}</span>
    </div>
);

export default FeeMonitoringControl;
