import React from 'react';
import { ShieldCheck, History, Eye, AlertTriangle, UserCheck, Lock, CheckCircle, Search, Filter } from 'lucide-react';
import DataTable from '../../../../../admcomponents/DataTable';

const AuditCompliance = () => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* System Integrity Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-[#001736] p-10 rounded-2xl shadow-2xl relative overflow-hidden group border border-white/5 flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:scale-125 transition-transform duration-1000"></div>
                    <div className="flex items-center gap-6 mb-12">
                        <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg border border-white/10 group-hover:rotate-12 transition-transform">
                            <ShieldCheck className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h3 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">Registry Integrity</h3>
                            <p className="text-[10px] font-black text-emerald-400 tracking-[0.3em] uppercase mt-2">Database state: Synchronized</p>
                        </div>
                    </div>
                    <div className="space-y-6 pt-10 border-t border-white/5">
                        <StatusLine label="Transaction Logs" status="Unmodified" color="text-emerald-400" />
                        <StatusLine label="Audit Trail" status="Encrypted" color="text-[#FFB606]" />
                        <StatusLine label="Protocol Compliance" status="100% SECURE" color="text-indigo-400" />
                    </div>
                </div>

                <div className="bg-white p-10 rounded-2xl border border-slate-200 shadow-sm space-y-10 group hover:border-amber-500 transition-all">
                     <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg border border-white/10 group-hover:-rotate-12 transition-transform">
                            <AlertTriangle className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h3 className="text-3xl font-black text-[#001736] tracking-tighter uppercase leading-none">Security Leaks</h3>
                            <p className="text-[10px] font-black text-slate-400 tracking-[0.3em] uppercase mt-2">Live Anomaly Detection</p>
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
                        <div className="w-24 h-24 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-700">
                             <CheckCircle className="w-12 h-12 text-emerald-500" />
                        </div>
                        <h4 className="text-xl font-black text-[#001736] uppercase tracking-tight">Zero Anomalies</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 px-12">No unauthorized transaction modifications detected in the last 72 hours.</p>
                    </div>
                </div>
            </div>

            {/* Live Audit Log */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-[#001736] shadow-inner">
                            <History className="w-6 h-6" />
                        </div>
                        <h4 className="text-xl font-black text-[#001736] tracking-tight uppercase">Strategic Audit Trail</h4>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:w-72 group">
                             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                             <input type="text" placeholder="Search logs..." className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-widest outline-none focus:bg-white focus:border-indigo-600 focus:ring-8 focus:ring-indigo-600/5 transition-all" />
                        </div>
                        <button className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-100 transition-all"><Filter className="w-5 h-5" /></button>
                    </div>
                </div>

                <DataTable
                    headers={[
                        { label: "Timestamp (EST)", className: "w-[180px]" },
                        { label: "Operator Identity" },
                        { label: "Action Taken" },
                        { label: "IP Address / Hub" },
                        { label: "Security Level", className: "text-right" }
                    ]}
                    columnCount={5}
                >
                    <tr className="hover:bg-slate-50 transition-colors group">
                        <td className="px-8 py-6 border-r border-slate-100 font-mono text-[11px] font-bold text-slate-400">02 APR 11:25:42</td>
                        <td className="px-8 py-6 border-r border-slate-100">
                             <div className="flex items-center gap-3">
                                <UserCheck className="w-4 h-4 text-indigo-600" />
                                <span className="text-[12px] font-black text-[#001736] uppercase tracking-tight">Super_Admin_01</span>
                             </div>
                        </td>
                        <td className="px-8 py-6 border-r border-slate-100">
                             <div className="flex flex-col gap-1">
                                <span className="text-[11px] font-black text-[#001736] uppercase tracking-widest">Fee Structure Update</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Target: Grade 10-A Tuition</span>
                             </div>
                        </td>
                        <td className="px-8 py-6 border-r border-slate-100 font-mono text-[11px] font-bold text-slate-500">192.168.1.104</td>
                        <td className="px-8 py-6 text-right">
                             <div className="flex items-center justify-end gap-2 text-indigo-600">
                                <Lock className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-lg">Level 4</span>
                             </div>
                        </td>
                    </tr>
                </DataTable>
            </div>
        </div>
    );
};

const StatusLine = ({ label, status, color }) => (
    <div className="flex justify-between items-center group/line">
        <span className="text-[10px] font-black text-white/30 tracking-[0.3em] uppercase group-hover/line:text-white/60 transition-colors">{label}</span>
        <span className={`text-[10px] font-black uppercase tracking-widest ${color}`}>{status}</span>
    </div>
);

export default AuditCompliance;
