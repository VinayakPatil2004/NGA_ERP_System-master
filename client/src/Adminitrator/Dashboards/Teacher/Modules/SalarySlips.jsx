import React, { useState, useEffect, useCallback } from "react";
import { FileText, Download, Eye, Calendar, DollarSign, RefreshCw, CheckCircle, Clock } from "lucide-react";
import ModuleHeader from "../../../admcomponents/ModuleHeader";
import hrAPI from "../../../../services/hrAPI";
import { toast } from "react-toastify";

const SalarySlips = ({ toggleSidebar }) => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewingSlip, setViewingSlip] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await hrAPI.getMyPayrollRecords();
            setRecords(data || []);
        } catch (err) {
            console.log(err);
            toast.error("Failed to fetch payroll records");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const getMonthName = (month) => {
        return new Date(2000, month - 1).toLocaleString('en-US', { month: 'long' });
    };

    const handleDownload = (slip) => {
        toast.info(`Downloading slip for ${getMonthName(slip.month)} ${slip.year}...`);
        // In a real app, this would trigger a PDF download
    };

    return (
        <div className="p-4 lg:p-8 bg-bg-base min-h-screen animate-in fade-in duration-500 font-sans text-left">
            <ModuleHeader
                title="Salary Slips"
                subTitle="Financial Records & Payroll Statements"
                icon={DollarSign}
                toggleSidebar={toggleSidebar}
            >
                <button
                    onClick={fetchData}
                    className={`p-3 bg-white border border-slate-200 rounded-2xl text-emerald-500 hover:bg-slate-50 transition-all ${loading ? 'animate-spin' : ''}`}
                >
                    <RefreshCw size={18} />
                </button>
            </ModuleHeader>

            <div className="max-w-6xl mx-auto mt-8 space-y-8">
                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col gap-4 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center relative z-10 shadow-inner">
                            <CheckCircle size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Latest Payout</p>
                            <p className="text-2xl font-black text-[#001736] mt-1 italic uppercase tracking-tighter">
                                {records.length > 0 ? `${getMonthName(records[0].month)} ${records[0].year}` : 'N/A'}
                            </p>
                        </div>
                    </div>

                    <div className="bg-[#001736] p-8 rounded-[2.5rem] shadow-xl flex flex-col gap-4 relative overflow-hidden group">
                        <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/5 rounded-full -mb-8 -mr-8" />
                        <div className="w-12 h-12 bg-white/10 text-amber-400 rounded-2xl flex items-center justify-center relative z-10 shadow-inner">
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em]">Total Records</p>
                            <p className="text-3xl font-black text-white mt-1">{records.length}</p>
                        </div>
                    </div>
                </div>

                {/* Records Grid */}
                <div className="space-y-4">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Payroll History</h3>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                            {[1, 2, 3].map(i => <div key={i} className="h-48 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm" />)}
                        </div>
                    ) : records.length === 0 ? (
                        <div className="bg-white/50 border-2 border-dashed border-slate-200 rounded-[3rem] p-24 text-center flex flex-col items-center gap-4 group">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 group-hover:scale-110 transition-transform">
                                <FileText size={40} />
                            </div>
                            <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em]">No Payroll Records Found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {records.map((r) => (
                                <div key={r.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group border-l-4 border-l-emerald-400">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-all">
                                            <Calendar size={20} />
                                        </div>
                                        <span className="bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase px-2 py-1 rounded-full border border-emerald-100 shadow-sm">
                                            {r.status}
                                        </span>
                                    </div>

                                    <div>
                                        <h4 className="text-[#001736] font-black text-xl uppercase tracking-tighter">
                                            {getMonthName(r.month)}
                                        </h4>
                                        <p className="text-slate-400 text-sm font-black mt-1 uppercase tracking-widest">{r.year}</p>
                                    </div>

                                    <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between gap-3">
                                        <button
                                            onClick={() => handleDownload(r)}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#001736] text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
                                        >
                                            <Download size={14} /> Slip
                                        </button>
                                        <button
                                            onClick={() => setViewingSlip(r)}
                                            className="p-3 bg-slate-50 text-slate-400 hover:bg-slate-100 rounded-xl transition-all"
                                        >
                                            <Eye size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Viewing Slip Modal (Mock Preview) */}
            {viewingSlip && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-[#001736]/90 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-400">
                        <div className="p-10 border-b border-slate-100 flex items-center justify-between shrink-0">
                            <div>
                                <h2 className="text-[#001736] font-black text-2xl uppercase tracking-tight">Statement Details</h2>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">{getMonthName(viewingSlip.month)} {viewingSlip.year}</p>
                            </div>
                            <button onClick={() => setViewingSlip(null)} className="p-3 hover:bg-slate-50 rounded-2xl transition-all text-slate-400"><RefreshCw size={20} /></button>
                        </div>

                        <div className="p-10 space-y-8">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Basic Salary</p>
                                    <p className="text-xl font-black text-[#001736]">₹ {viewingSlip.basic_salary?.toLocaleString()}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Net Payable</p>
                                    <p className="text-xl font-black text-emerald-500 italic">₹ {viewingSlip.net_salary?.toLocaleString()}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Attendance</p>
                                    <p className="text-xl font-black text-[#001736]">{viewingSlip.present_days} / {viewingSlip.total_days} Days</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Deductions</p>
                                    <p className="text-xl font-black text-rose-500">₹ {viewingSlip.deductions?.toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-8 rounded-4xl border border-slate-100 shadow-inner">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Remarks</p>
                                <p className="text-slate-600 font-medium italic text-sm">{viewingSlip.remarks || 'Institutional standard payroll processing completed.'}</p>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={() => { handleDownload(viewingSlip); setViewingSlip(null); }}
                                    className="flex-1 py-5 bg-[#001736] text-white rounded-4xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all"
                                >
                                    Download PDF Statement
                                </button>
                                <button
                                    onClick={() => setViewingSlip(null)}
                                    className="px-10 py-5 bg-slate-100 text-[#001736] rounded-4xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalarySlips;
