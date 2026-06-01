import React, { useState, useEffect, useCallback } from 'react';
import {
    CalendarOff, CheckCircle2, XCircle, Search, Clock,
    CalendarCheck, CalendarX, Plus, X, RefreshCw, Filter, Eye, Trash2, User
} from 'lucide-react';
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import DataTable from '../../../admcomponents/DataTable';
import { toast } from 'react-toastify';
import hrAPI from '../../../../services/hrAPI';
import { getAllStaff } from '../../../../services/staffAPI';

const LEAVE_TYPES = [
    'Sick Leave', 'Casual Leave', 'Earned Leave',
    'Maternity Leave', 'Paternity Leave', 'Emergency Leave', 'Other'
];

const LeaveManagement = ({ toggleSidebar }) => {
    const [leaveList, setLeaveList] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [applyForm, setApplyForm] = useState({
        staff_id: '', leave_type: 'Casual Leave',
        from_date: '', to_date: '', days: 1, reason: ''
    });
    const [applying, setApplying] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // ── Fetch all leaves ──────────────────────────────────────────────────
    const fetchLeaves = useCallback(async () => {
        try {
            setLoading(true);
            const params = filterStatus !== 'all' ? { status: filterStatus } : {};
            const data = await hrAPI.getLeaveApplications(params);
            setLeaveList(data || []);
        } catch (err) {
            toast.error('Failed to load leave data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [filterStatus]);

    // ── Fetch active staff for apply modal ────────────────────────────────
    const fetchStaff = useCallback(async () => {
        try {
            const data = await getAllStaff();
            setStaffList((data || []).filter(s => s.status === 'active'));
        } catch { /* non-critical */ }
    }, []);

    useEffect(() => { fetchLeaves(); }, [fetchLeaves]);
    useEffect(() => { fetchStaff(); }, [fetchStaff]);

    // ── Approve / Reject ──────────────────────────────────────────────────
    const handleAction = async (id, status) => {
        try {
            await hrAPI.reviewLeaveApplication(id, { status });
            toast.success(`Leave ${status}`);
            fetchLeaves();
        } catch (err) {
            toast.error(err?.response?.data?.error || 'Action failed');
        }
    };

    // ── Delete pending leave ──────────────────────────────────────────────
    const handleDelete = async (id) => {
        if (!window.confirm('Delete this leave request?')) return;
        try {
            await hrAPI.deleteLeaveApplication(id);
            toast.success('Leave request deleted');
            fetchLeaves();
        } catch (err) {
            toast.error(err?.response?.data?.error || 'Failed to delete');
        }
    };

    // ── Auto-calculate days ───────────────────────────────────────────────
    const calcDays = (from, to) => {
        if (!from || !to) return 1;
        const diff = (new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24);
        return Math.max(1, Math.round(diff) + 1);
    };

    // ── Apply leave ───────────────────────────────────────────────────────
    const handleApply = async () => {
        if (!applyForm.staff_id || !applyForm.from_date || !applyForm.to_date) {
            toast.warning('Please fill all required fields');
            return;
        }
        try {
            setApplying(true);
            await hrAPI.applyForLeave(applyForm);
            toast.success('Leave applied successfully');
            setShowApplyModal(false);
            setApplyForm({ staff_id: '', leave_type: 'Casual Leave', from_date: '', to_date: '', days: 1, reason: '' });
            fetchLeaves();
        } catch (err) {
            toast.error(err?.response?.data?.error || 'Failed to apply leave');
        } finally {
            setApplying(false);
        }
    };

    // ── Filtering ─────────────────────────────────────────────────────────
    const filtered = leaveList.filter(l =>
        l.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.employee_id?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const pendingCount  = leaveList.filter(l => l.status === 'pending').length;
    const approvedCount = leaveList.filter(l => l.status === 'approved').length;
    const rejectedCount = leaveList.filter(l => l.status === 'rejected').length;

    // Reset pagination on filter change
    useEffect(() => { setCurrentPage(1); }, [searchQuery, filterStatus]);

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const statusStyle = {
        pending:  'bg-amber-50  text-amber-600  border border-amber-100',
        approved: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
        rejected: 'bg-rose-50   text-rose-600   border border-rose-100',
    };

    return (
        <div className="p-4 lg:p-8 space-y-6 min-h-screen bg-[#F8FAFC]">

            {/* Header */}
            <ModuleHeader hideAcademicYear={true}
                title="Leave Management"
                subTitle="Staff Leave Requests & Approvals"
                icon={CalendarOff}
                badge={`${pendingCount} Pending`}
                toggleSidebar={toggleSidebar}
            >
                <div className="flex items-center gap-2 lg:gap-3">
                    <button onClick={fetchLeaves} className="p-3 cursor-pointer bg-white border border-white/10 rounded-xl text-amber-400 hover:bg-white/80 transition-all active:rotate-180 duration-700 shrink-0">
                        <RefreshCw size={18} className="opacity-80" />
                    </button>
                    <button
                        onClick={() => setShowApplyModal(true)}
                        className="flex cursor-pointer items-center gap-2 bg-[#FFF8E1] text-[#001736] px-4 py-3 lg:px-5 lg:py-3.5 rounded-xl lg:rounded-2xl font-black text-[10px] lg:text-[11px] uppercase tracking-widest shadow-2xl hover:bg-white transition-all active:scale-95 border border-white/20 whitespace-nowrap"
                    >
                        <Plus size={16} />
                        <span className="hidden lg:inline">Apply Leave</span>
                    </button>
                </div>
            </ModuleHeader>

            {/* Stats — clickable filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard label="Pending"  value={pendingCount}  icon={Clock}        color="bg-amber-500"   active={filterStatus === 'pending'}  onClick={() => setFilterStatus(filterStatus === 'pending'  ? 'all' : 'pending')}  />
                <StatCard label="Approved" value={approvedCount} icon={CalendarCheck} color="bg-emerald-500" active={filterStatus === 'approved'} onClick={() => setFilterStatus(filterStatus === 'approved' ? 'all' : 'approved')} />
                <StatCard label="Rejected" value={rejectedCount} icon={CalendarX}    color="bg-rose-500"    active={filterStatus === 'rejected'} onClick={() => setFilterStatus(filterStatus === 'rejected' ? 'all' : 'rejected')} />
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 lg:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative flex-1 w-full max-w-sm">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="Search by name or ID..." value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400" />
                </div>
                {/* Status tab buttons */}
                <div className="flex bg-slate-50 border border-slate-200 rounded-xl p-1 gap-1">
                    {['all', 'pending', 'approved', 'rejected'].map(s => (
                        <button key={s} onClick={() => setFilterStatus(s)}
                            className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                                filterStatus === s ? 'bg-white text-[#001736] shadow-sm' : 'text-slate-400 hover:text-slate-600'
                            }`}>{s}</button>
                    ))}
                </div>
            </div>

            {/* DataTable */}
            <DataTable
                headers={[
                    { label: 'Employee' },
                    { label: 'Type' },
                    { label: 'Duration' },
                    { label: 'Days' },
                    { label: 'Applied' },
                    { label: 'Status' },
                    { label: 'Actions', className: 'text-center' },
                ]}
                columnCount={7}
                loading={loading}
                emptyMessage="No Leave Requests Found"
                footer={
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
                            <span>Registry: {filtered.length} Requests</span>
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
                    <tr key={leave.id} className="hover:bg-slate-50/50 transition-colors group border-b border-black">
                        {/* Employee */}
                        <td className="px-3 lg:px-4 py-4 border-r border-black">
                            <div className="flex items-center gap-3">
                                {leave.photo && (
                                    <img src={`http://localhost:5000${leave.photo}`} alt="" className="w-8 h-8 rounded-lg object-cover border border-slate-200" />
                                )}
                                <div>
                                    <p className="text-sm font-bold text-[#001736] tracking-tight">{leave.full_name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold">{leave.employee_id}</p>
                                </div>
                            </div>
                        </td>
                        {/* Type */}
                        <td className="px-3 lg:px-4 py-4 border-r border-black">
                            <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 whitespace-nowrap">
                                {leave.leave_type}
                            </span>
                        </td>
                        {/* Duration */}
                        <td className="px-3 lg:px-4 py-4 border-r border-black">
                            <p className="text-xs font-bold text-slate-600">{new Date(leave.from_date).toLocaleDateString('en-IN')}</p>
                            <p className="text-[10px] text-slate-400">to {new Date(leave.to_date).toLocaleDateString('en-IN')}</p>
                        </td>
                        {/* Days */}
                        <td className="px-3 lg:px-4 py-4 border-r border-black text-center">
                            <span className="text-lg font-black text-[#001736]">{leave.days}</span>
                            <span className="text-[10px] text-slate-400 font-bold ml-1">days</span>
                        </td>
                        {/* Applied On */}
                        <td className="px-3 lg:px-4 py-4 border-r border-black">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                {new Date(leave.applied_at).toLocaleDateString('en-IN')}
                            </p>
                        </td>
                        {/* Status */}
                        <td className="px-3 lg:px-4 py-4 border-r border-black">
                            <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full ${statusStyle[leave.status]}`}>
                                {leave.status}
                            </span>
                        </td>
                        {/* Actions */}
                        <td className="px-3 lg:px-4 py-4 text-center border-r border-black">
                            <div className="flex items-center justify-center gap-2">
                                <button onClick={() => setSelectedLeave(leave)}
                                    className="p-2.5 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl border border-slate-200 transition-all hover:shadow-md"
                                    title="View Details">
                                    <Eye size={16} />
                                </button>
                                <button onClick={() => handleAction(leave.id, 'approved')}
                                    disabled={leave.status !== 'pending'}
                                    className={`p-2.5 rounded-xl border transition-all ${leave.status === 'pending' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-500 hover:text-white hover:shadow-md' : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'}`}
                                    title="Approve">
                                    <CheckCircle2 size={16} />
                                </button>
                                <button onClick={() => handleAction(leave.id, 'rejected')}
                                    disabled={leave.status !== 'pending'}
                                    className={`p-2.5 rounded-xl border transition-all ${leave.status === 'pending' ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-500 hover:text-white hover:shadow-md' : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'}`}
                                    title="Reject">
                                    <XCircle size={16} />
                                </button>
                                <button onClick={() => handleDelete(leave.id)}
                                    disabled={leave.status !== 'pending'}
                                    className={`p-2.5 rounded-xl border transition-all ${leave.status === 'pending' ? 'bg-slate-50 text-slate-400 border-slate-100 hover:text-rose-500' : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'}`}
                                    title="Delete">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
            </DataTable>

            {/* ── Apply Leave Modal ── */}
            {showApplyModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowApplyModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-[95%] sm:w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] box-border" onClick={e => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="bg-[#001736] p-6 rounded-t-2xl flex items-center justify-between shrink-0">
                            <div>
                                <h3 className="text-lg font-black text-white! uppercase tracking-tight">Apply Leave</h3>
                                <p className="text-[10px] text-white/60! font-bold uppercase tracking-widest mt-1">New Leave Request</p>
                            </div>
                            <button onClick={() => setShowApplyModal(false)} className="p-2 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4 overflow-y-auto">
                            {/* Staff */}
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Staff Member *</label>
                                <select value={applyForm.staff_id} onChange={e => setApplyForm(p => ({ ...p, staff_id: e.target.value }))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-[#001736] outline-none focus:border-blue-400">
                                    <option value="">Select Staff...</option>
                                    {staffList.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.employee_id})</option>)}
                                </select>
                            </div>
                            {/* Leave Type */}
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Leave Type *</label>
                                <select value={applyForm.leave_type} onChange={e => setApplyForm(p => ({ ...p, leave_type: e.target.value }))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-[#001736] outline-none focus:border-blue-400">
                                    {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">From Date *</label>
                                    <input type="date" value={applyForm.from_date}
                                        onChange={e => {
                                            const from = e.target.value;
                                            setApplyForm(p => ({ ...p, from_date: from, days: calcDays(from, p.to_date) }));
                                        }}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-[#001736] outline-none focus:border-blue-400" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">To Date *</label>
                                    <input type="date" value={applyForm.to_date}
                                        onChange={e => {
                                            const to = e.target.value;
                                            setApplyForm(p => ({ ...p, to_date: to, days: calcDays(p.from_date, to) }));
                                        }}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-[#001736] outline-none focus:border-blue-400" />
                                </div>
                            </div>
                            {/* Days (auto) */}
                            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Days</span>
                                <span className="text-2xl font-black text-[#001736]">{applyForm.days}</span>
                            </div>
                            {/* Reason */}
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Reason</label>
                                <textarea value={applyForm.reason} onChange={e => setApplyForm(p => ({ ...p, reason: e.target.value }))}
                                    rows={3} placeholder="Reason for leave..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-[#001736] outline-none focus:border-blue-400 resize-none" />
                            </div>
                            {/* Submit */}
                            <button onClick={handleApply} disabled={applying}
                                className="w-full bg-[#001736] text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-[#002a5c] transition-all disabled:opacity-60">
                                {applying ? 'Applying...' : 'Submit Leave Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── View Details Modal ── */}
            {selectedLeave && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setSelectedLeave(null)}>
                    <div className="bg-white rounded-4xl shadow-2xl w-[95%] sm:w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh] box-border animate-in zoom-in-95 duration-400" onClick={e => e.stopPropagation()}>
                        <div className="bg-[#001736] p-8 flex items-center justify-between text-white relative">
                             <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                                <Eye size={100} />
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-xl font-black text-white! uppercase tracking-tight">Application Review</h3>
                                <p className="text-[10px] font-bold text-white uppercase tracking-widest mt-1">Personnel Leave Record Details</p>
                            </div>
                            <button onClick={() => setSelectedLeave(null)} className="relative z-10 p-2.5 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/5 transition-all shadow-xl">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
                            <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 border-2 border-dashed border-slate-200 overflow-hidden shrink-0">
                                    {selectedLeave.photo ? (
                                        <img src={`http://localhost:5000${selectedLeave.photo}`} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={24} />
                                    )}
                                </div>
                                <div>
                                    <h4 className="text-xl font-black text-[#001736] uppercase tracking-tight leading-none mb-1.5">{selectedLeave.full_name?.split('').join(' ')}</h4>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{selectedLeave.employee_id} • {selectedLeave.designation}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Leave Type</p>
                                    <p className="text-xs font-black text-[#001736]">{selectedLeave.leave_type}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Duration Units</p>
                                    <p className="text-xs font-black text-[#001736]">{selectedLeave.days} Days</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">From Date</p>
                                    <p className="text-xs font-black text-[#001736]">{new Date(selectedLeave.from_date).toLocaleDateString('en-IN')}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">To Date</p>
                                    <p className="text-xs font-black text-[#001736]">{new Date(selectedLeave.to_date).toLocaleDateString('en-IN')}</p>
                                </div>
                            </div>

                            <div className="space-y-2 p-6 bg-slate-50 rounded-3xl border border-slate-200 shadow-inner">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Reason for Absence</p>
                                <p className="text-xs text-[#001736] leading-relaxed italic font-medium">"{selectedLeave.reason || 'No specific reason provided.'}"</p>
                            </div>

                            {selectedLeave.status !== 'pending' && (
                                <div className="space-y-4 pt-6 border-t border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                                            <CheckCircle2 size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Processed By</p>
                                            <p className="text-[11px] font-bold text-[#001736]">{selectedLeave.reviewed_by_name || 'Administrator'}</p>
                                        </div>
                                    </div>
                                    {selectedLeave.review_remarks && (
                                        <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 italic text-[11px] text-indigo-600 font-medium">
                                            Review Remarks: "{selectedLeave.review_remarks}"
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-4">
                                <span className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusStyle[selectedLeave.status]}`}>
                                    {selectedLeave.status}
                                </span>
                                <button onClick={() => setSelectedLeave(null)}
                                    className="px-8 py-3.5 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">
                                    Close Registry
                                </button>
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
                <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform shrink-0`}>
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

export default LeaveManagement;
