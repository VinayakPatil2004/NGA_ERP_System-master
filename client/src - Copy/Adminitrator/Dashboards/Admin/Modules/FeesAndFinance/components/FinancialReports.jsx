import React from 'react';
import { BarChart3, FileSpreadsheet, FilePieChart, Download, Calendar, ArrowRight, TrendingUp, IndianRupee } from 'lucide-react';

const FinancialReports = () => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Report Generation Hero (Responsive Variant) */}
            <div className="bg-primary p-8 lg:p-12 rounded-2xl shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-48 -mt-48 group-hover:scale-125 transition-transform duration-1000"></div>
                <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
                    <div className="space-y-4 lg:space-y-6 flex-1 text-center lg:text-left">
                        <div className="inline-flex items-center gap-3 bg-white/10 border border-white/20 px-6 py-2 rounded-full text-white/80">
                            <BarChart3 className="w-4 h-4 text-amber-400" />
                            <span className="text-[9px] font-black uppercase tracking-[0.2em]">Institutional Analytics Engine</span>
                        </div>
                        <h3 className="text-3xl lg:text-5xl font-black text-white tracking-tighter uppercase leading-tight">Generate Financial <span className="text-amber-400 italic font-medium tracking-tight lowercase">intelligence.</span></h3>
                        <p className="max-w-2xl text-white/50 text-[11px] lg:text-[13px] font-bold leading-relaxed uppercase tracking-wider mx-auto lg:mx-0">
                            Access high-fidelity financial reports. Export mission-critical data in PDF and Excel formats for institutional audits.
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 lg:gap-4 w-full lg:w-auto">
                        <QuickExportBtn icon={FileSpreadsheet} label="EXCEL" color="text-emerald-400" />
                        <QuickExportBtn icon={FilePieChart} label="PDF" color="text-rose-400" />
                        <div className="col-span-2">
                             <button className="w-full py-5 bg-amber-400 text-primary rounded-xl font-black text-[11px] lg:text-[12px] uppercase tracking-[0.2em] shadow-xl hover:bg-white transition-all active:scale-95 flex items-center justify-center gap-3">
                                <Download className="w-5 h-5" /> CUSTOM BUILD REPORT
                             </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Structured Report Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 pb-10">
                <ReportCategory 
                    title="Collection Reports" 
                    items={[
                        "Daily Fee Collection Journal",
                        "Class-wise Collection Analysis",
                        "Payment Mode Distribution"
                    ]}
                    icon={IndianRupee}
                />
                <ReportCategory 
                    title="Defaulter Insights" 
                    items={[
                        "Global Deficiency List",
                        "Critical Defaulter Tracking",
                        "Projected Revenue Recovery"
                    ]}
                    icon={TrendingUp}
                />
                <ReportCategory 
                    title="Yearly Comparison" 
                    items={[
                        "Budget vs Actual (2026-27)",
                        "Annual Growth Metrics",
                        "Capital Expense Audits"
                    ]}
                    icon={Calendar}
                />
            </div>
        </div>
    );
};

const QuickExportBtn = (props) => {
    const { icon: Icon, label, color } = props;
    return (
        <button className="p-8 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center gap-4 hover:bg-white/10 hover:border-white/20 transition-all group">
            <Icon className={`w-8 h-8 ${color} group-hover:scale-110 transition-transform`} />
            <span className="text-[10px] font-black text-white/40 tracking-[0.3em] uppercase">{label}</span>
        </button>
    );
};

const ReportCategory = (props) => {
    const { title, items, icon: Icon } = props;
    return (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full group hover:shadow-xl transition-all">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-[#001736] shadow-inner group-hover:bg-[#001736] group-hover:text-white transition-colors">
                    <Icon className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-black text-[#001736] tracking-tight uppercase">{title}</h4>
            </div>
            <div className="flex-1 space-y-4">
                {items.map((item, idx) => (
                    <button key={idx} className="w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl group/item hover:bg-white hover:border-indigo-500/50 transition-all">
                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest text-left leading-tight group-hover/item:text-indigo-600">{item}</span>
                        <ArrowRight className="w-4 h-4 text-slate-200 group-hover/item:text-indigo-600 transition-all group-hover/item:translate-x-1" />
                    </button>
                ))}
            </div>
        </div>
    );
};

export default FinancialReports;
