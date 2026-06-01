import React, { useState, useEffect, useCallback } from 'react';
import {
    CalendarOff, CheckCircle2, XCircle, Search, Clock,
    CalendarCheck, CalendarX, Plus, X, RefreshCw, Filter
} from 'lucide-react';
import axios from 'axios';
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import DataTable from '../../../admcomponents/DataTable';
import { toast } from 'react-toastify';

const API = 'http://localhost:5000/api/hr';

const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('grace_erp_token')}`,
});

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

    // ── Fetch all leaves ──────────────────────────────────────────────────
    const fetchLeaves = useCallback(async () => {
        try {
            setLoading(true);
            const params = filterStatus !== 'all' ? { status: filterStatus } : {};
            const res = await axios.get(`${API}/leaves`, {
                params,
                headers: getAuthHeaders(),
            });
            setLeaveList(res.data || []);
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
            const res = await axios.get('http://localhost:5000/api/staff/all');
            setStaffList((res.data || []).filter(s => s.status === 'active'));
        } catch { /* non-critical */ }
    }, []);

    useEffect(() => { fetchLeaves(); }, [fetchLeaves]);
    useEffect(() => { fetchStaff(); }, [fetchStaff]);

    // ── Approve / Reject ──────────────────────────────────────────────────
    const handleAction = async (id, status) => {
        try {
            await axios.put(`${API}/leaves/${id}/action`, { status }, { headers: getAuthHeaders() });
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
            await axios.delete(`${API}/leaves/${id}`, { headers: getAuthHeaders() });
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
            await axios.post(`${API}/leaves`, applyForm, { headers: getAuthHeaders() });
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

    const statusStyle = {
        pending:  'bg-amber-50  text-amber-600  border border-amber-100',
        approved: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
        rejected: 'bg-rose-50   text-rose-600   border border-rose-100',
    };

    return (
        <div className="p-4 lg:p-8 space-y-6 min-h-screen bg-[#F8FAFC]">

            {/* Header */}
            <ModuleHeader
                title="Leave Management"
                subTitle="Staff Leave Requests & Approvals"
                icon={CalendarOff}
                badge={`${pendingCount} Pending`}
                toggleSidebar={toggleSidebar}
            >
                <div className="flex items-center gap-2 lg:gap-3">
                    <button onClick={fetchLeaves} className="p-3 bg-white/5 border border-white/10 rounded-xl text-amber-400 hover:bg-white/10 transition-all active:rotate-180 duration-700 shrink-0">
                        <RefreshCw size={18} className="opacity-80" />
                    </button>
                    <button
                        onClick={() => setShowApplyModal(true)}
                        className="flex items-center gap-2 bg-[#FFF8E1] text-[#001736] px-4 py-3 lg:px-5 lg:py-3.5 rounded-xl lg:rounded-2xl font-black text-[10px] lg:text-[11px] uppercase tracking-widest shadow-2xl hover:bg-white transition-all active:scale-95 border border-white/20 whitespace-nowrap"
                    >
                        <Plus size={16} />
                        <span className="hidden lg:inline">Apply Leave</span>
                    </button>
                </div>
            </ModuleHeader>

            {/* Stats — clickable filters */}
            <div className="grid grid-cols-3 gap-4">
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
                    { label: 'Leave Type' },
                    { label: 'Duration', className: 'hidden md:table-cell' },
                    { label: 'Days' },
                    { label: 'Reason', className: 'hidden lg:table-cell' },
                    { label: 'Applied On', className: 'hidden xl:table-cell' },
                    { label: 'Status' },
                    { label: 'Actions', className: 'text-center' },
                ]}
                columnCount={8}
                loading={loading}
                emptyMessage="No Leave Requests Found"
                footer={
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400">
                        <span className="tracking-widest">Leave Request Registry</span>
                        <span className="tracking-[0.2em]">{filtered.length} Requests</span>
                    </div>
                }
            >
                {filtered.map((leave) => (
                    <tr key={leave.id} className="hover:bg-slate-50/50 transition-colors group">
                        {/* Employee */}
                        <td className="px-4 lg:px-8 py-4 border-r border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center text-white font-black text-sm shadow-md shrink-0">
                                    {leave.full_name?.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-[#001736]">{leave.full_name}</p>
                                    <p className="text-[10px] text-slate-400">{leave.employee_id}</p>
                                </div>
                            </div>
                        </td>
                        {/* Type */}
                        <td className="px-4 lg:px-8 py-4 border-r border-slate-100">
                            <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                                {leave.leave_type}
                            </span>
                        </td>
                        {/* Duration */}
                        <td className="px-4 lg:px-8 py-4 border-r border-slate-100 hidden md:table-cell">
                            <p className="text-xs font-bold text-slate-600">{new Date(leave.from_date).toLocaleDateString('en-IN')}</p>
                            <p className="text-[10px] text-slate-400">to {new Date(leave.to_date).toLocaleDateString('en-IN')}</p>
                        </td>
                        {/* Days */}
                        <td className="px-4 lg:px-8 py-4 border-r border-slate-100">
                            <span className="text-lg font-black text-[#001736]">{leave.days}</span>
                            <span className="text-[10px] text-slate-400 font-bold ml-1">days</span>
                        </td>
                        {/* Reason */}
                        <td className="px-4 lg:px-8 py-4 border-r border-slate-100 hidden lg:table-cell">
                            <p className="text-xs text-slate-500 italic max-w-[160px] truncate">"{leave.reason || '—'}"</p>
                        </td>
                        {/* Applied On */}
                        <td className="px-4 lg:px-8 py-4 border-r border-slate-100 hidden xl:table-cell">
                            <p className="text-xs font-medium text-slate-500">
                                {new Date(leave.applied_at).toLocaleDateString('en-IN')}
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
                            {leave.status === 'pending' ? (
                                <div className="flex items-center justify-center gap-2">
                                    <button onClick={() => handleAction(leave.id, 'approved')}
                                        className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border border-emerald-100">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                                    </button>
                                    <button onClick={() => handleAction(leave.id, 'rejected')}
                                        className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border border-rose-100">
                                        <XCircle className="w-3.5 h-3.5" /> Reject
                                    </button>
                                    <button onClick={() => handleDelete(leave.id)}
                                        className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-all" title="Delete">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center">
                                    {leave.reviewed_by_name && (
                                        <p className="text-[10px] text-slate-400 font-bold">By: {leave.reviewed_by_name}</p>
                                    )}
                                    {leave.review_remarks && (
                                        <p className="text-[10px] text-slate-400 italic mt-0.5">"{leave.review_remarks}"</p>
                                    )}
                                </div>
                            )}
                        </td>
                    </tr>
                ))}
            </DataTable>

            {/* ── Apply Leave Modal ── */}
            {showApplyModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowApplyModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="bg-[#001736] p-6 rounded-t-2xl flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-black text-white uppercase tracking-tight">Apply Leave</h3>
                                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">New Leave Request</p>
                            </div>
                            <button onClick={() => setShowApplyModal(false)} className="p-2 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
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
        </div>
    );
};

const StatCard = ({ label, value, icon: Icon, color, active, onClick }) => (
    <button onClick={onClick}
        className={`bg-white p-4 lg:p-6 rounded-2xl border transition-all text-left group hover:shadow-md ${
            active ? 'border-indigo-500 shadow-md ring-1 ring-indigo-500' : 'border-slate-200'
        }`}>
        <div className="flex items-center gap-4">
            <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                <p className="text-2xl font-black text-[#001736]">{value}</p>
            </div>
        </div>
    </button>
);

export default LeaveManagement;
