import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, Search, Filter, CheckCircle, AlertCircle, Bookmark, Loader2, Zap } from 'lucide-react';
import { toast } from 'react-toastify';
import DataTable from '../../../../../admcomponents/DataTable';
import {
    getStudentFeeLedger,
    syncInstitutionalFees,
    recordStudentPayment
} from '../../../../../../services/FeesAndFinance/studentFeeAPI';
import { getAcademicYearsList, getClassrooms } from '../../../../../../services/classroomAPI';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const StudentFeeAssignment = ({ isMobileSearchOpen }) => {
    // 1. Core State
    const [academicYears, setAcademicYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState('');
    const [students, setStudents] = useState([]);
    const [classrooms, setClassrooms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGrade, setSelectedGrade] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'paid', 'pending'
    const [payingStudent, setPayingStudent] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // 2. Initial Data Load
    useEffect(() => {
        const bootstrap = async () => {
            try {
                setLoading(true);
                const [years, grades] = await Promise.all([
                    getAcademicYearsList(),
                    getClassrooms()
                ]);
                setAcademicYears(years);
                setClassrooms(grades);
                const active = years.find(y => y.is_active) || years[0];
                if (active) setSelectedYear(active.id);
            } catch {
                toast.error("Institutional framework synchronization failed.");
            } finally {
                setLoading(false);
            }
        };
        bootstrap();
    }, []);

    // 3. Fetch Student Ledger Summary
    const loadRegistry = useCallback(async () => {
        if (!selectedYear) return;
        try {
            setLoading(true);
            const ledger = await getStudentFeeLedger(selectedYear, selectedGrade, statusFilter);
            setStudents(ledger);
        } catch (error) {
            console.log(error);
            toast.error("Failed to load student ledger matrix.");
        } finally {
            setLoading(false);
        }
    }, [selectedYear, selectedGrade, statusFilter]);

    useEffect(() => {
        loadRegistry();
    }, [loadRegistry]);

    // 4. Global Sync Trigger
    const handleGlobalSync = async () => {
        if (!window.confirm("CRITICAL: This will synchronize all student ledgers with current fee structures. Existing unpaid records will be updated. Proceed?")) return;

        try {
            setSyncing(true);
            const result = await syncInstitutionalFees(selectedYear);
            toast.success(`Institutional Sync Complete: ${result.entries_created} records provisioned.`);
            loadRegistry();
        } catch (error) {
            console.log(error);
            toast.error("Synchronization failed: Internal Protocol Error");
        } finally {
            setSyncing(false);
        }
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.studentIdNo?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleRecordPayment = async () => {
        if (!payingStudent || !paymentAmount) return;
        try {
            setSubmitting(true);
            await recordStudentPayment({
                student_id: payingStudent.id,
                academic_year_id: selectedYear,
                amount: paymentAmount,
                payment_method: 'cash'
            });
            toast.success("Payment synchronized with ledger.");
            setPayingStudent(null);
            setPaymentAmount('');
            loadRegistry();
        } catch (error) {
            console.log(error);
            toast.error("Payment transaction failed.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDownloadReceipt = (student) => {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text("GRACE ENGLISH SCHOOL", 105, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.text("Official Fee Receipt", 105, 30, { align: 'center' });
        doc.line(20, 35, 190, 35);

        doc.setFontSize(10);
        doc.text(`Student Name: ${student.name}`, 20, 45);
        doc.text(`ID Reference: ${student.studentIdNo}`, 20, 52);
        doc.text(`Grade/Class: ${student.grade}`, 20, 59);
        doc.text(`Total Paid: Rs. ${student.totalPaid.toLocaleString()}`, 20, 66);
        doc.text(`Status: ${student.status.toUpperCase()}`, 20, 73);

        doc.save(`${student.studentIdNo}_Receipt.pdf`);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Control Panel (Responsive Toggle) */}
            <div className={`${isMobileSearchOpen ? 'block' : 'hidden lg:block'} bg-[#001736] p-8 lg:p-10 rounded-4xl shadow-2xl relative overflow-hidden group animate-in slide-in-from-top-2 duration-300`}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-1000"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="space-y-3 text-left">
                        <div className="flex items-center gap-3">
                            <h3 className="text-2xl lg:text-3xl font-black text-white tracking-tighter uppercase leading-none">Automated Assignment</h3>
                            <div className="px-3 py-1 bg-amber-400 rounded-lg">
                                <span className="text-[9px] font-black text-[#001736] uppercase tracking-widest">v2.0 Sync Engine</span>
                            </div>
                        </div>
                        <p className="text-[10px] font-black text-amber-400 tracking-[0.3em] uppercase opacity-80">Global class-based fee synchronization</p>
                        <p className="max-w-md text-white/40 text-[11px] font-bold leading-relaxed uppercase tracking-wider hidden sm:block">
                            Instantly map defined fee structures to all students in specific grades. This process validates student categories and transport requirements.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto text-left">
                        <div className="space-y-1 w-full sm:w-auto">
                            <label className="text-[9px] font-black text-indigo-300 uppercase tracking-widest ml-1">Target Academic Session</label>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                className="w-full sm:w-48 bg-white/10 border border-white/20 text-white font-black text-[11px] px-6 py-4 rounded-2xl outline-none focus:bg-white/20 transition-all uppercase tracking-widest"
                            >
                                {academicYears.map(y => <option key={y.id} value={y.id} className="text-black">{y.year_name}</option>)}
                            </select>
                        </div>
                        <button
                            onClick={handleGlobalSync}
                            disabled={syncing}
                            className="w-full md:w-auto px-10 py-5 bg-white text-[#001736] rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-amber-400 hover:scale-105 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 group"
                        >
                            {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-indigo-600 group-hover:scale-125 transition-transform" />}
                            RUN GLOBAL SYNC NOW
                        </button>
                    </div>
                </div>
            </div>

            {/* Manual Assignment / Search (Responsive Grid) */}
            <div className="bg-white p-6 lg:p-8 rounded-4xl border border-slate-100 shadow-sm space-y-6 animate-in slide-in-from-top-2 duration-400">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                    <div className="relative w-full lg:w-1/2 group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-[#001736] transition-colors" />
                        <input
                            type="text"
                            placeholder="SEARCH BY STUDENT NAME OR ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-[#001736] text-[11px] outline-none focus:bg-white focus:border-indigo-400 transition-all uppercase placeholder:text-slate-300 tracking-widest shadow-inner"
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <select
                            value={selectedGrade}
                            onChange={(e) => setSelectedGrade(e.target.value)}
                            className="bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-[11px] font-black uppercase tracking-widest outline-none shadow-inner text-[#001736]"
                        >
                            <option value="">Filter Grade</option>
                            {[...new Set(classrooms.map(g => g.grade_level))].map(grade => (
                                <option key={grade} value={grade}>{grade}</option>
                            ))}
                        </select>
                        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                            <button
                                onClick={() => setStatusFilter('all')}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === 'all' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 opacity-60'}`}
                            >
                                All Entries
                            </button>
                            <button
                                onClick={() => setStatusFilter('pending')}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === 'pending' ? 'bg-white text-rose-500 shadow-md' : 'text-slate-400 opacity-60'}`}
                            >
                                Pending
                            </button>
                            <button
                                onClick={() => setStatusFilter('paid')}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === 'paid' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-400 opacity-60'}`}
                            >
                                Paid
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full mobile-table-scroll bg-white rounded-4xl border border-slate-100 shadow-2xl overflow-hidden">
                <DataTable
                    headers={[
                        { label: "Student Identity", className: "w-[250px]" },
                        { label: "Class" },
                        { label: "Contact (Father)" },
                        { label: "Term 1 Balance", className: "text-center" },
                        { label: "Term 2 Balance", className: "text-center" },
                        { label: "Status", className: "text-center" },
                        { label: "Actions", className: "text-center" }
                    ]}
                    columnCount={7}
                    loading={loading}
                >
                    {filteredStudents.map((s, idx) => (
                        <tr key={idx} className="hover:bg-indigo-50/30 transition-all group">
                            <td className="px-8 py-6 border-b-table border-r-table">
                                <div className="flex items-center gap-4 text-left">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-[#001736] font-black text-sm shadow-sm group-hover:bg-white transition-all">
                                        {s.name?.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-[#001736] uppercase tracking-tight">{s.name}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{s.studentIdNo}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-8 py-6 border-b-table border-r-table text-center">
                                <span className="px-4 py-2 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-xl uppercase border border-indigo-100">{s.grade}</span>
                            </td>
                            <td className="px-8 py-6 border-b-table border-r-table">
                                <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest leading-none">{s.contact || '---'}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Mobile Primary</p>
                            </td>
                            <td className="px-8 py-6 border-b-table border-r-table text-center">
                                <p className={`text-[12px] font-black ${s.t1Balance > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                    ₹{s.t1Balance.toLocaleString()}
                                </p>
                            </td>
                            <td className="px-8 py-6 border-b-table border-r-table text-center">
                                <p className={`text-[12px] font-black ${s.t2Balance > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                    ₹{s.t2Balance.toLocaleString()}
                                </p>
                            </td>
                            <td className="px-8 py-6 border-b-table border-r-table text-center">
                                <div className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest inline-block ${s.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                                    {s.status}
                                </div>
                            </td>
                            <td className="px-8 py-6 border-b-table text-center">
                                <div className="flex items-center justify-center gap-3">
                                    <button
                                        onClick={() => setPayingStudent(s)}
                                        className="p-3 bg-white border border-slate-200 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-90"
                                        title="Add Payment"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDownloadReceipt(s)}
                                        className="px-3 py-3 bg-white border border-slate-200 text-slate-400 rounded-xl hover:bg-[#001736] hover:text-white transition-all shadow-sm active:scale-90 flex items-center gap-2"
                                        title="Receipt"
                                    >
                                        <FileText className="w-4 h-4 text-amber-500" />
                                        <span className="text-[9px] font-black uppercase">Receipt</span>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {filteredStudents.length === 0 && !loading && (
                        <tr>
                            <td colSpan={5} className="py-20 text-center">
                                <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Registry search returned no matches</p>
                            </td>
                        </tr>
                    )}
                </DataTable>
            </div>

            {/* PAYMENT MODAL */}
            {payingStudent && (
                <div className="fixed inset-0 bg-[#001736]/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-4xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="bg-[#001736] p-10 flex items-center justify-between text-white border-b border-white/10">
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter italic">Record Payment</h3>
                                <p className="text-[9px] uppercase font-black tracking-widest text-indigo-300 mt-2">Syncing to Student Ledger: {payingStudent.name}</p>
                            </div>
                            <button onClick={() => setPayingStudent(null)} className="p-3 hover:bg-white/10 rounded-xl transition-all"><X className="w-6 h-6" /></button>
                        </div>
                        <div className="p-10 space-y-8">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">T1 Due</p>
                                    <h4 className="text-xl font-black text-[#001736]">₹{payingStudent.t1Balance.toLocaleString()}</h4>
                                </div>
                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">T2 Due</p>
                                    <h4 className="text-xl font-black text-[#001736]">₹{payingStudent.t2Balance.toLocaleString()}</h4>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-[#001736] uppercase tracking-widest ml-1">Payment Amount (INR)</label>
                                <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100 focus-within:bg-white focus-within:ring-8 focus-within:ring-[#001736]/5 transition-all">
                                    <span className="text-3xl font-black text-slate-300 ml-4">₹</span>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                        className="w-full bg-transparent text-3xl font-black text-[#001736] outline-none"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleRecordPayment}
                                disabled={submitting || !paymentAmount}
                                className="w-full py-6 bg-[#001736] text-white rounded-2xl font-black text-[12px] uppercase tracking-[0.4em] shadow-2xl hover:bg-black transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5 text-emerald-400" />}
                                Sync Transaction
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentFeeAssignment;
