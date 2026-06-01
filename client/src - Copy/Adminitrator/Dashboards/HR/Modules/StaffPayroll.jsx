import React, { useState, useEffect, useCallback } from 'react';
import {
    IndianRupee, FileText, CheckCircle, Calculator, Search,
    Clock, Users, Wallet, RefreshCw, TrendingDown, Calendar, Save
} from 'lucide-react';
import axios from 'axios';
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import DataTable from '../../../admcomponents/DataTable';
import { toast } from 'react-toastify';

const API = 'http://localhost:5000/api/hr';

const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('grace_erp_token')}`,
});

const MONTHS = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const StaffPayroll = ({ toggleSidebar }) => {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear]   = useState(now.getFullYear());
    const [payrollList, setPayrollList] = useState([]);
    const [localEdits, setLocalEdits]   = useState({});
    const [loading, setLoading]         = useState(true);
    const [saving, setSaving]           = useState(null); // staff_id | 'all'
    const [searchQuery, setSearchQuery] = useState('');
    const [dirtyRows, setDirtyRows]     = useState(new Set()); // track unsaved changes

    // ── Fetch ────────────────────────────────────────────────────────────
    const fetchPayroll = useCallback(async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API}/payroll`, {
                params: { month, year },
                headers: getAuthHeaders(),
            });
            const data = res.data?.data || [];
            setPayrollList(data);

            // Init local edits from server data
            const edits = {};
            data.forEach(p => {
                edits[p.staff_id] = {
                    basic_salary: parseFloat(p.basic_salary) || parseFloat(p.base_salary) || 0,
                    present_days: p.present_days ?? 0,
                    total_days:   p.total_days   ?? 30,
                    deductions:   parseFloat(p.deductions) || 0,
                    remarks:      p.remarks || '',
                };
            });
            setLocalEdits(edits);
            setDirtyRows(new Set()); // clear dirty state after refresh
        } catch (err) {
            toast.error('Failed to load payroll data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [month, year]);

    useEffect(() => { fetchPayroll(); }, [fetchPayroll]);

    // ── Update local field ────────────────────────────────────────────────
    const updateEdit = (staffId, field, value) => {
        setLocalEdits(prev => ({
            ...prev,
            [staffId]: { ...prev[staffId], [field]: value },
        }));
        setDirtyRows(prev => new Set(prev).add(staffId));
    };

    // ── Net salary calc ───────────────────────────────────────────────────
    const calcNet = (staffId) => {
        const e = localEdits[staffId] || {};
        const basic  = parseFloat(e.basic_salary) || 0;
        const days   = parseFloat(e.total_days)   || 30;
        const pres   = parseFloat(e.present_days) || 0;
        const ded    = parseFloat(e.deductions)   || 0;
        return Math.max(0, (basic / days) * pres - ded);
    };

    // ── Save (Process/Update) one row ─────────────────────────────────────
    const handleSaveRow = async (staffId, currentStatus) => {
        const e = localEdits[staffId];
        if (!e) return;
        try {
            setSaving(staffId);
            await axios.post(`${API}/payroll/process`, {
                month, year,
                payroll_data: [{
                    staff_id:     staffId,
                    basic_salary: e.basic_salary,
                    present_days: e.present_days,
                    total_days:   e.total_days,
                    deductions:   e.deductions,
                    remarks:      e.remarks,
                }],
            }, { headers: getAuthHeaders() });
            toast.success(currentStatus === 'pending' ? 'Payroll processed ✓' : 'Payroll updated ✓');
            setDirtyRows(prev => { const s = new Set(prev); s.delete(staffId); return s; });
            fetchPayroll();
        } catch (err) {
            toast.error(err?.response?.data?.error || 'Failed to save');
        } finally {
            setSaving(null);
        }
    };

    // ── Save ALL (including already processed — re-upsert) ────────────────
    const handleSaveAll = async () => {
        if (!payrollList.length) { toast.info('No payroll data'); return; }
        const payroll_data = payrollList.map(p => {
            const e = localEdits[p.staff_id] || {};
            return {
                staff_id:     p.staff_id,
                basic_salary: e.basic_salary || 0,
                present_days: e.present_days ?? 0,
                total_days:   e.total_days   ?? 30,
                deductions:   e.deductions   || 0,
                remarks:      e.remarks      || '',
            };
        });
        try {
            setSaving('all');
            await axios.post(`${API}/payroll/process`, { month, year, payroll_data }, { headers: getAuthHeaders() });
            toast.success(`All ${payroll_data.length} payrolls saved ✓`);
            fetchPayroll();
        } catch (err) {
            toast.error(err?.response?.data?.error || 'Failed to save');
        } finally {
            setSaving(null);
        }
    };

    // ── Mark as Paid ──────────────────────────────────────────────────────
    const handleMarkPaid = async (payrollId) => {
        if (!payrollId) { toast.warning('Process this payroll first before marking as paid'); return; }
        try {
            await axios.put(`${API}/payroll/${payrollId}/status`, { status: 'paid' }, { headers: getAuthHeaders() });
            toast.success('Marked as Paid ✓');
            fetchPayroll();
        } catch (err) {
            toast.error('Failed to update status');
        }
    };

    // ── Filter ────────────────────────────────────────────────────────────
    const filtered = payrollList.filter(p =>
        p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.employee_id?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // ── Stats ─────────────────────────────────────────────────────────────
    const totalNet  = payrollList.reduce((s, p) => s + calcNet(p.staff_id), 0);
    const pending   = payrollList.filter(p => p.status === 'pending').length;
    const processed = payrollList.filter(p => p.status === 'processed').length;
    const paid      = payrollList.filter(p => p.status === 'paid').length;

    const statusBadge = {
        pending:   'bg-amber-50  text-amber-600  border border-amber-100',
        processed: 'bg-blue-50   text-blue-600   border border-blue-100',
        paid:      'bg-emerald-50 text-emerald-600 border border-emerald-100',
    };

    const unsavedCount = dirtyRows.size;

    return (
        <div className="p-4 lg:p-8 space-y-6 min-h-screen bg-[#F8FAFC]">

            {/* ── Header ── */}
            <ModuleHeader
                title="Staff Payroll"
                subTitle={`Monthly Salary Processing — ${MONTHS[month]} ${year}`}
                icon={IndianRupee}
                badge={`${MONTHS[month]} ${year}`}
                toggleSidebar={toggleSidebar}
            >
                <div className="flex items-center gap-2 lg:gap-3">
                    <button onClick={fetchPayroll}
                        className="p-3 bg-white/5 border border-white/10 rounded-xl text-amber-400 hover:bg-white/10 transition-all active:rotate-180 duration-700 shrink-0"
                        title="Refresh">
                        <RefreshCw size={18} className="opacity-80" />
                    </button>

                    {/* Save All */}
                    <button onClick={handleSaveAll} disabled={saving === 'all'}
                        className="flex items-center gap-2 bg-white/10 border border-white/20 text-white px-4 py-3 rounded-xl lg:rounded-2xl font-black text-[10px] lg:text-[11px] uppercase tracking-widest hover:bg-white/20 transition-all active:scale-95 whitespace-nowrap disabled:opacity-60">
                        <Save size={16} />
                        <span className="hidden lg:inline">
                            {saving === 'all' ? 'Saving...' : `Save All${unsavedCount > 0 ? ` (${unsavedCount} changed)` : ''}`}
                        </span>
                    </button>

                    {/* Process All Pending */}
                    <button onClick={handleSaveAll} disabled={saving === 'all' || pending === 0}
                        className="flex items-center gap-2 bg-[#FFF8E1] text-[#001736] px-4 py-3 lg:px-5 lg:py-3.5 rounded-xl lg:rounded-2xl font-black text-[10px] lg:text-[11px] uppercase tracking-widest shadow-2xl hover:bg-white transition-all active:scale-95 border border-white/20 whitespace-nowrap disabled:opacity-60">
                        <Calculator size={16} />
                        <span className="hidden lg:inline">Process All Pending</span>
                    </button>
                </div>
            </ModuleHeader>

            {/* Unsaved changes banner */}
            {unsavedCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3 flex items-center justify-between">
                    <p className="text-[11px] font-black text-amber-700 uppercase tracking-widest">
                        ⚠ {unsavedCount} row{unsavedCount > 1 ? 's' : ''} with unsaved changes
                    </p>
                    <button onClick={handleSaveAll} disabled={saving === 'all'}
                        className="px-4 py-2 bg-amber-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all">
                        Save All Now
                    </button>
                </div>
            )}

            {/* ── Stats ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Staff" value={payrollList.length} icon={Users}        color="bg-blue-600"    />
                <StatCard label="Pending"      value={pending}           icon={Clock}        color="bg-amber-500"   />
                <StatCard label="Processed"    value={processed + paid}  icon={CheckCircle}  color="bg-indigo-500"  />
                <StatCard label="Total Payout" value={`₹${(totalNet/1000).toFixed(1)}K`} icon={Wallet} color="bg-emerald-500" />
            </div>

            {/* ── Filter Bar ── */}
            <div className="bg-white p-4 lg:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="Search employee..." value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400" />
                </div>
                {/* Month */}
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <select value={month} onChange={e => setMonth(+e.target.value)}
                        className="bg-transparent text-sm font-bold text-[#001736] outline-none cursor-pointer">
                        {MONTHS.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                    </select>
                </div>
                {/* Year */}
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                    <select value={year} onChange={e => setYear(+e.target.value)}
                        className="bg-transparent text-sm font-bold text-[#001736] outline-none cursor-pointer">
                        {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            {/* ── DataTable ── */}
            <DataTable
                headers={[
                    { label: 'Employee' },
                    { label: 'Basic Salary (₹)' },
                    { label: 'Present Days' },
                    { label: 'Deductions (₹)' },
                    { label: 'Net Payable' },
                    { label: 'Remarks', className: 'hidden lg:table-cell' },
                    { label: 'Status' },
                    { label: 'Action', className: 'text-center' },
                ]}
                columnCount={8}
                loading={loading}
                emptyMessage="No Active Staff Found — Onboard Staff First"
                footer={
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400">
                        <span className="tracking-widest">Payroll Matrix — {MONTHS[month]} {year}</span>
                        <span className="tracking-[0.2em]">
                            {pending} Pending · {processed} Processed · {paid} Paid
                        </span>
                    </div>
                }
            >
                {filtered.map((item) => {
                    const e   = localEdits[item.staff_id] || {};
                    const net = calcNet(item.staff_id);
                    const isDirty = dirtyRows.has(item.staff_id);

                    return (
                        <tr key={item.staff_id}
                            className={`hover:bg-slate-50/50 transition-colors group ${isDirty ? 'bg-amber-50/30' : ''}`}>

                            {/* Employee */}
                            <td className="px-4 lg:px-8 py-4 border-r border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-black text-sm shadow-md shrink-0">
                                        {item.full_name?.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-[#001736]">{item.full_name}</p>
                                        <p className="text-[10px] text-slate-400">{item.employee_id} · {item.designation || '—'}</p>
                                    </div>
                                    {isDirty && <div className="w-2 h-2 rounded-full bg-amber-400 ml-1 shrink-0" title="Unsaved changes" />}
                                </div>
                            </td>

                            {/* Basic Salary — always editable */}
                            <td className="px-4 lg:px-8 py-4 border-r border-slate-100">
                                <div className="flex items-center gap-1">
                                    <span className="text-slate-400 text-sm font-bold">₹</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={e.basic_salary ?? ''}
                                        onChange={ev => updateEdit(item.staff_id, 'basic_salary', parseFloat(ev.target.value) || 0)}
                                        className="w-[110px] bg-white border border-slate-200 rounded-lg px-2 py-2 text-sm font-bold text-[#001736] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 transition-all"
                                    />
                                </div>
                            </td>

                            {/* Present Days — always editable */}
                            <td className="px-4 lg:px-8 py-4 border-r border-slate-100">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min="0"
                                        max={e.total_days || 30}
                                        value={e.present_days ?? ''}
                                        onChange={ev => updateEdit(item.staff_id, 'present_days', parseInt(ev.target.value) || 0)}
                                        className="w-[56px] bg-white border border-slate-200 rounded-lg px-2 py-2 text-sm font-black text-emerald-600 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 transition-all text-center"
                                    />
                                    <input
                                        type="number"
                                        min="1"
                                        max="31"
                                        value={e.total_days ?? 30}
                                        onChange={ev => updateEdit(item.staff_id, 'total_days', parseInt(ev.target.value) || 30)}
                                        className="w-[56px] bg-white border border-slate-200 rounded-lg px-2 py-2 text-sm font-bold text-slate-500 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 transition-all text-center"
                                        title="Total working days"
                                    />
                                </div>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">Present / Total</p>
                            </td>

                            {/* Deductions — always editable */}
                            <td className="px-4 lg:px-8 py-4 border-r border-slate-100">
                                <div className="flex items-center gap-1">
                                    <TrendingDown className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                    <input
                                        type="number"
                                        min="0"
                                        value={e.deductions ?? ''}
                                        onChange={ev => updateEdit(item.staff_id, 'deductions', parseFloat(ev.target.value) || 0)}
                                        className="w-[90px] bg-white border border-slate-200 rounded-lg px-2 py-2 text-sm font-bold text-rose-500 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 transition-all"
                                    />
                                </div>
                            </td>

                            {/* Net Payable — live calculated */}
                            <td className="px-4 lg:px-8 py-4 border-r border-slate-100">
                                <p className="text-base font-black text-emerald-600">
                                    ₹{net.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                </p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Calculated</p>
                            </td>

                            {/* Remarks — always editable */}
                            <td className="px-4 lg:px-8 py-4 border-r border-slate-100 hidden lg:table-cell">
                                <input
                                    type="text"
                                    value={e.remarks || ''}
                                    onChange={ev => updateEdit(item.staff_id, 'remarks', ev.target.value)}
                                    placeholder="Remarks..."
                                    className="w-full max-w-[140px] bg-white border border-slate-200 rounded-lg px-2 py-2 text-xs text-[#001736] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 transition-all"
                                />
                            </td>

                            {/* Status Badge */}
                            <td className="px-4 lg:px-8 py-4 border-r border-slate-100">
                                <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full ${statusBadge[item.status] || statusBadge.pending}`}>
                                    {item.status}
                                </span>
                            </td>

                            {/* Actions */}
                            <td className="px-4 lg:px-8 py-4 text-center">
                                <div className="flex items-center justify-center gap-2 flex-wrap">
                                    {/* Process / Update button — always visible */}
                                    <button
                                        onClick={() => handleSaveRow(item.staff_id, item.status)}
                                        disabled={saving === item.staff_id}
                                        className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border whitespace-nowrap disabled:opacity-50 ${
                                            item.status === 'pending'
                                                ? 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border-blue-100'
                                                : 'bg-amber-50 text-amber-700 hover:bg-amber-500 hover:text-white border-amber-100'
                                        }`}
                                    >
                                        {saving === item.staff_id
                                            ? '...'
                                            : item.status === 'pending' ? 'Process' : 'Update'}
                                    </button>

                                    {/* Mark Paid — only for processed */}
                                    {item.status === 'processed' && (
                                        <button
                                            onClick={() => handleMarkPaid(item.payroll_id)}
                                            className="px-3 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border border-emerald-100 whitespace-nowrap"
                                        >
                                            Mark Paid
                                        </button>
                                    )}

                                    {/* View Payslip icon — for paid */}
                                    {item.status === 'paid' && (
                                        <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="View Payslip">
                                            <FileText className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    );
                })}
            </DataTable>
        </div>
    );
};

const StatCard = ({ label, value, color, icon: Icon }) => (
    <div className="bg-white p-4 lg:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 group hover:shadow-md transition-all">
        <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
            <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
            <p className="text-xl font-black text-[#001736]">{value}</p>
        </div>
    </div>
);

export default StaffPayroll;
