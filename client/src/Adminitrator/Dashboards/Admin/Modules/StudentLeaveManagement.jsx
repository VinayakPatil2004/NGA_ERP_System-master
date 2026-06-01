import React, { useState, useEffect, useCallback } from 'react';
import {
    CalendarOff, CheckCircle2, XCircle, Search, Clock,
    CalendarCheck, CalendarX, Plus, X, RefreshCw, Filter, Eye, Trash2, User,
    GraduationCap, ClipboardCheck
} from 'lucide-react';
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import DataTable from '../../../admcomponents/DataTable';
import { toast } from 'react-toastify';
import { getAllStudentLeaves, reviewStudentLeave } from '../../../../services/studentAPI';

const LEAVE_TYPES = [
    'Sick Leave', 'Casual Leave', 'Family Emergency/Event', 'Religious Holiday', 'Other'
];

const StudentLeaveManagement = ({ toggleSidebar, hideHeader = false }) => {
    const [leaveList, setLeaveList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterGrade, setFilterGrade] = useState('all');
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [reviewRemarks, setReviewRemarks] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // ── Fetch all student leaves ───────────────────────────────────────────
    const fetchLeaves = useCallback(async () => {
        try {
            setLoading(true);
            const status = filterStatus === 'all' ? '' : filterStatus;
            const grade = filterGrade === 'all' ? '' : filterGrade;
            const data = await getAllStudentLeaves(status, grade);
            setLeaveList(data || []);
        } catch (err) {
            toast.error('Failed to load student leave data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [filterStatus, filterGrade]);

    useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

    // ── Approve / Reject ──────────────────────────────────────────────────
    const handleAction = async (id, status) => {
        try {
            await reviewStudentLeave(id, { status, remarks: reviewRemarks });
            toast.success(`Leave application ${status} [Sync Success]`);
            setSelectedLeave(null);
            setReviewRemarks('');
            fetchLeaves();
        } catch (err) {
            toast.error(err?.response?.data?.error || 'Action failed');
        }
    };

    // ── Filtering ─────────────────────────────────────────────────────────
    const filtered = leaveList.filter(l =>
        l.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.gr_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.student_id_no?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const pendingCount  = leaveList.filter(l => l.status === 'pending').length;
    const approvedCount = leaveList.filter(l => l.status === 'approved').length;
    const rejectedCount = leaveList.filter(l => l.status === 'rejected').length;

    // Reset pagination on filter change
    useEffect(() => { setCurrentPage(1); }, [searchQuery, filterStatus, filterGrade]);

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const statusStyle = {
        pending:  'bg-amber-50  text-amber-600  border border-amber-100',
        approved: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
        rejected: 'bg-rose-50   text-rose-600   border border-rose-100',
    };

    return (
        <div className={`space-y-6 min-h-screen ${!hideHeader ? 'p-4 lg:p-8 bg-[#F8FAFC]' : ''}`}>

            {/* Header */}
            {!hideHeader && (
                <ModuleHeader
                    title="Student Leave Management"
                    subTitle="Academic Absence Requests & Verification"
                    icon={ClipboardCheck}
                    badge={`${pendingCount} Pending`}
                    toggleSidebar={toggleSidebar}
                >
                    <div className="flex items-center gap-2 lg:gap-3">
                        <button onClick={fetchLeaves} className="p-3 bg-white/5 border border-white/10 rounded-xl text-amber-400 hover:bg-white/10 transition-all active:rotate-180 duration-700 shrink-0">
                            <RefreshCw size={18} className="opacity-80" />
                        </button>
                    </div>
                </ModuleHeader>
            )}

            {/* Stats — clickable filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard label="Pending"  value={pendingCount}  icon={Clock}        color="bg-amber-500"   active={filterStatus === 'pending'}  onClick={() => setFilterStatus(filterStatus === 'pending'  ? 'all' : 'pending')}  />
                <StatCard label="Approved" value={approvedCount} icon={CalendarCheck} color="bg-emerald-500" active={filterStatus === 'approved'} onClick={() => setFilterStatus(filterStatus === 'approved' ? 'all' : 'approved')} />
                <StatCard label="Rejected" value={rejectedCount} icon={CalendarX}    color="bg-rose-500"    active={filterStatus === 'rejected'} onClick={() => setFilterStatus(filterStatus === 'rejected' ? 'all' : 'rejected')} />
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 lg:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 w-full max-w-sm">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="Search by name, ID or GR No..." value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400" />
                </div>
                
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    <div className="flex flex-wrap bg-slate-50 border border-slate-200 rounded-xl p-1 gap-1">
                        {['all', 'pending', 'approved', 'rejected'].map(s => (
                            <button key={s} onClick={() => setFilterStatus(s)}
                                className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                                    filterStatus === s ? 'bg-white text-[#001736] shadow-sm' : 'text-slate-400 hover:text-slate-600'
                                }`}>{s}</button>
                        ))}
                    </div>

                    <select 
                        value={filterGrade} 
                        onChange={e => setFilterGrade(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-wider outline-none focus:border-blue-400"
                    >
                        <option value="all">All Grades</option>
                        {[...Array(10)].map((_, i) => (
                            <option key={i+1} value={`${i+1}${i+1 === 1 ? 'st' : i+1 === 2 ? 'nd' : i+1 === 3 ? 'rd' : 'th'}`}>
                                Grade {i+1}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* DataTable */}
            <DataTable
                headers={[
                    { label: 'Student Details' },
                    { label: 'Leave Type' },
                    { label: 'Duration' },
                    { label: 'Days' },
                    { label: 'Applied' },
                    { label: 'Status' },
                    { label: 'Actions', className: 'text-center' },
                ]}
                columnCount={7}
                loading={loading}
                emptyMessage="No Student Leave Applications Detected"
                footer={
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
                            <span>Academic Registry: {filtered.length} Requests</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                            <span>Page {currentPage} of {totalPages || 1}</span>
                        </div>
                        
                        {totalPages > 1 && (
                            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-1 rounded-xl">
                                <button 
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-[#001736] disabled:opacity-30 transition-all"
                                >Prev</button>
                                {[...Array(totalPages)].map((_, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${
                                            currentPage === i + 1 ? 'bg-[#001736] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100'
                                        }`}
                                    >{i + 1}</button>
                                ))}
                                <button 
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-[#001736] disabled:opacity-30 transition-all"
                                >Next</button>
                            </div>
                        )}
                    </div>
                }
            >
                {paginatedData.map((leave) => (
                    <tr key={leave.id} className="hover:bg-slate-50/50 transition-colors group">
                        {/* Student */}
                        <td className="px-4 lg:px-8 py-4 border-r border-slate-100">
                            <div>
                                <p className="text-sm font-bold text-[#001736]">{leave.student_name}</p>
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">
                                    {leave.grade} - {leave.section} | GR: {leave.gr_no}
                                </p>
                            </div>
                        </td>
                        {/* Type */}
                        <td className="px-4 lg:px-8 py-4 border-r border-slate-100">
                            <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 whitespace-nowrap">
                                {leave.leave_type}
                            </span>
                        </td>
                        {/* Duration */}
                        <td className="px-4 lg:px-8 py-4 border-r border-slate-100">
                            <p className="text-xs font-bold text-slate-600">{new Date(leave.from_date).toLocaleDateString('en-IN')}</p>
                            <p className="text-[10px] text-slate-400">to {new Date(leave.to_date).toLocaleDateString('en-IN')}</p>
                        </td>
                        {/* Days */}
                        <td className="px-4 lg:px-8 py-4 border-r border-slate-100 text-center">
                            <span className="text-lg font-black text-[#001736]">{leave.days}</span>
                            <span className="text-[10px] text-slate-400 font-bold ml-1">days</span>
                        </td>
                        {/* Applied On */}
                        <td className="px-4 lg:px-8 py-4 border-r border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                {new Date(leave.created_at).toLocaleDateString('en-IN')}
                            </p>
                        </td>
                        {/* Status */}
                        <td className="px-4 lg:px-8 py-4 border-r border-slate-100">
                            <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full ${statusStyle[leave.status]}`}>
                                {leave.status}
                            </span>
                        </td>
                        {/* Actions */}
                        <td className="px-4 lg:px-8 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                                <button onClick={() => { setSelectedLeave(leave); setReviewRemarks(leave.review_remarks || ''); }}
                                    className="p-2.5 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl border border-slate-200 transition-all hover:shadow-md"
                                    title="View Details">
                                    <Eye size={16} />
                                </button>
                                {leave.status === 'pending' && (
                                    <>
                                        <button onClick={() => handleAction(leave.id, 'approved')}
                                            className="p-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-xl border border-emerald-100 transition-all hover:shadow-md"
                                            title="Quick Approve">
                                            <CheckCircle2 size={16} />
                                        </button>
                                        <button onClick={() => handleAction(leave.id, 'rejected')}
                                            className="p-2.5 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white rounded-xl border border-rose-100 transition-all hover:shadow-md"
                                            title="Quick Reject">
                                            <XCircle size={16} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </td>
                    </tr>
                ))}
            </DataTable>

            {/* ── View & Review Modal ── */}
            {selectedLeave && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-60 flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setSelectedLeave(null)}>
                    <div className="bg-white rounded-4xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-400" onClick={e => e.stopPropagation()}>
                        <div className="bg-[#001736] p-8 flex items-center justify-between text-white relative">
                             <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                                <ClipboardCheck size={100} />
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-xl font-black uppercase tracking-tight">Leave Audit</h3>
                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Institutional Academic Absence Review</p>
                            </div>
                            <button onClick={() => setSelectedLeave(null)} className="relative z-10 p-2.5 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/5 transition-all shadow-xl">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div className="flex items-center gap-4 pb-8 border-b border-slate-100">
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 border-2 border-dashed border-slate-200">
                                    <User size={32} />
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-[#001736] uppercase tracking-tight">{selectedLeave.student_name}</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        Grade {selectedLeave.grade}-{selectedLeave.section} • Roll: {selectedLeave.roll_number}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 text-left">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Category</p>
                                    <p className="text-sm font-black text-[#001736]">{selectedLeave.leave_type}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Absence Units</p>
                                    <p className="text-sm font-black text-[#001736]">{selectedLeave.days} Academic Days</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Start Date</p>
                                    <p className="text-sm font-black text-[#001736]">{new Date(selectedLeave.from_date).toLocaleDateString('en-IN')}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">End Date</p>
                                    <p className="text-sm font-black text-[#001736]">{new Date(selectedLeave.to_date).toLocaleDateString('en-IN')}</p>
                                </div>
                            </div>

                            <div className="space-y-2 p-6 bg-slate-50 rounded-3xl border border-slate-200 shadow-inner text-left">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Reason Statement</p>
                                <p className="text-xs text-[#001736] leading-relaxed italic font-medium">"{selectedLeave.reason || 'No specific reason provided.'}"</p>
                            </div>

                            <div className="space-y-3 text-left">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Review Remarks</label>
                                <textarea 
                                    value={reviewRemarks}
                                    onChange={e => setReviewRemarks(e.target.value)}
                                    placeholder="Add any internal remarks or justification..."
                                    className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-blue-400 resize-none"
                                    rows={3}
                                />
                            </div>

                            <div className="flex items-center gap-4 pt-4">
                                {selectedLeave.status === 'pending' ? (
                                    <>
                                        <button onClick={() => handleAction(selectedLeave.id, 'rejected')}
                                            className="flex-1 py-4 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-md">
                                            Reject
                                        </button>
                                        <button onClick={() => handleAction(selectedLeave.id, 'approved')}
                                            className="flex-2 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl">
                                            Approve Request
                                        </button>
                                    </>
                                ) : (
                                    <button onClick={() => setSelectedLeave(null)}
                                        className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">
                                        Close Review
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

function StatCard({ label, value, icon, color, active, onClick }) {
    const IconComponent = icon;
    return (
        <button onClick={onClick}
            className={`bg-white p-4 lg:p-6 rounded-2xl border transition-all text-left group hover:shadow-md ${
                active ? 'border-indigo-500 shadow-md ring-1 ring-indigo-500' : 'border-slate-200'
            }`}>
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <IconComponent className="w-5 h-5 text-white" />
                </div>
                <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                    <p className="text-2xl font-black text-[#001736]">{value}</p>
                </div>
            </div>
        </button>
    );
}

export default StudentLeaveManagement;
