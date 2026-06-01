import React, { useState, useEffect, useCallback } from 'react';
import {
    ClipboardCheck, Search, CheckCircle, XCircle, Clock,
    Calendar as CalendarIcon, UserCheck, UserX, Users,
    RefreshCw, Save, Filter, Lock
} from 'lucide-react';
import axios from 'axios';
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import DataTable from '../../../admcomponents/DataTable';
import { toast } from 'react-toastify';

const API = 'http://localhost:5000/api/attendance';

const getAuthHeaders = () => {
    const token = localStorage.getItem('grace_erp_token');
    return { Authorization: `Bearer ${token}` };
};

const StaffAttendance = ({ toggleSidebar }) => {
    const [staffList, setStaffList] = useState([]);   // raw data from API (staff + attendance)
    const [localMap, setLocalMap] = useState({});      // { staff_id: { status, remarks, check_in_time } }
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    // ── Fetch staff + attendance for selected date ─────────────────────────
    const fetchAttendance = useCallback(async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API}/staff`, {
                params: { date: selectedDate },
                headers: getAuthHeaders(),
            });
            const data = res.data || [];
            setStaffList(data);

            // Build local editable map from API data
            const map = {};
            data.forEach(s => {
                map[s.staff_id] = {
                    status: s.status === 'not marked' ? '' : s.status,
                    remarks: s.remarks || '',
                    check_in_time: s.check_in_time || '',
                    check_out_time: s.check_out_time || '',
                    is_locked: s.is_locked === 1,
                };
            });
            setLocalMap(map);
        } catch (err) {
            console.error('Error fetching staff attendance:', err);
            toast.error('Failed to load attendance data');
        } finally {
            setLoading(false);
        }
    }, [selectedDate]);

    useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

    // ── Update a single field in local map ─────────────────────────────────
    const updateLocal = (staffId, field, value) => {
        setLocalMap(prev => ({
            ...prev,
            [staffId]: { ...prev[staffId], [field]: value },
        }));
    };

    // ── Quick mark status ──────────────────────────────────────────────────
    const markStatus = (staffId, status) => {
        updateLocal(staffId, 'status', status);
        // Auto-fill check_in_time for present/late if empty
        if ((status === 'present' || status === 'late') && !localMap[staffId]?.check_in_time) {
            const now = new Date().toTimeString().slice(0, 5);
            updateLocal(staffId, 'check_in_time', now);
        }
    };

    // ── Mark all present ───────────────────────────────────────────────────
    const markAllPresent = () => {
        const now = new Date().toTimeString().slice(0, 5);
        setLocalMap(prev => {
            const updated = { ...prev };
            staffList.forEach(s => {
                if (!updated[s.staff_id]?.is_locked) {
                    updated[s.staff_id] = {
                        ...updated[s.staff_id],
                        status: 'present',
                        check_in_time: updated[s.staff_id]?.check_in_time || now,
                    };
                }
            });
            return updated;
        });
        toast.info('All staff marked as Present');
    };

    // ── Save to server ─────────────────────────────────────────────────────
    const handleSave = async () => {
        const attendance_data = staffList
            .filter(s => localMap[s.staff_id]?.status)
            .map(s => ({
                staff_id: s.staff_id,
                status: localMap[s.staff_id].status,
                remarks: localMap[s.staff_id].remarks || '',
                check_in_time: localMap[s.staff_id].check_in_time || null,
                check_out_time: localMap[s.staff_id].check_out_time || null,
                working_hours: null,
            }));

        if (!attendance_data.length) {
            toast.warning('Please mark attendance for at least one staff member');
            return;
        }

        try {
            setSaving(true);
            await axios.post(`${API}/staff`, {
                date: selectedDate,
                attendance_data,
            }, { headers: getAuthHeaders() });
            toast.success('Attendance saved successfully!');
            fetchAttendance(); // refresh from DB
        } catch (err) {
            console.error('Error saving attendance:', err);
            toast.error(err?.response?.data?.error || 'Failed to save attendance');
        } finally {
            setSaving(false);
        }
    };

    // ── Filtering ──────────────────────────────────────────────────────────
    const filtered = staffList.filter(s => {
        const effectiveStatus = localMap[s.staff_id]?.status || s.status;
        const matchSearch =
            s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            String(s.staff_id).includes(searchQuery);
        const matchType = filterType === 'all' || s.staff_type === filterType;
        const matchStatus = filterStatus === 'all' || effectiveStatus === filterStatus;
        return matchSearch && matchType && matchStatus;
    });

    // ── Stats (computed from localMap) ─────────────────────────────────────
    const stats = {
        total: staffList.length,
        present: staffList.filter(s => localMap[s.staff_id]?.status === 'present').length,
        late: staffList.filter(s => localMap[s.staff_id]?.status === 'late').length,
        absent: staffList.filter(s => localMap[s.staff_id]?.status === 'absent').length,
        onLeave: staffList.filter(s => localMap[s.staff_id]?.status === 'leave').length,
        notMarked: staffList.filter(s => !localMap[s.staff_id]?.status).length,
    };

    const statusBadge = {
        present: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
        late:    'bg-amber-50 text-amber-600 border border-amber-100',
        absent:  'bg-rose-50 text-rose-600 border border-rose-100',
        leave:   'bg-purple-50 text-purple-600 border border-purple-100',
        '':      'bg-slate-100 text-slate-400 border border-slate-200',
    };

    return (
        <div className="p-4 lg:p-8 space-y-6 min-h-screen bg-[#F8FAFC]">

            {/* ── Header ── */}
            <ModuleHeader
                title="Staff Attendance"
                subTitle="Daily Attendance Tracking & Logs"
                icon={ClipboardCheck}
                badge={selectedDate}
                toggleSidebar={toggleSidebar}
            >
                <div className="flex items-center gap-2 lg:gap-3">
                    <button
                        onClick={fetchAttendance}
                        className="p-3 bg-white/5 border border-white/10 rounded-xl text-amber-400 hover:bg-white/10 transition-all active:rotate-180 duration-700 shrink-0"
                        title="Refresh"
                    >
                        <RefreshCw size={18} className="opacity-80" />
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 bg-[#FFF8E1] text-[#001736] px-4 py-3 lg:px-6 lg:py-3.5 rounded-xl lg:rounded-2xl font-black text-[10px] lg:text-[11px] uppercase tracking-widest shadow-2xl hover:bg-white transition-all active:scale-95 border border-white/20 whitespace-nowrap disabled:opacity-60"
                    >
                        <Save size={16} />
                        <span className="hidden lg:inline">{saving ? 'Saving...' : 'Save Attendance'}</span>
                        <span className="lg:hidden">Save</span>
                    </button>
                </div>
            </ModuleHeader>

            {/* ── Stats ── */}
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
                <StatCard label="Total" value={stats.total} color="bg-blue-600" icon={Users} active={filterStatus === 'all'} onClick={() => setFilterStatus('all')} />
                <StatCard label="Present" value={stats.present} color="bg-emerald-500" icon={UserCheck} active={filterStatus === 'present'} onClick={() => setFilterStatus('present')} />
                <StatCard label="Late" value={stats.late} color="bg-amber-500" icon={Clock} active={filterStatus === 'late'} onClick={() => setFilterStatus('late')} />
                <StatCard label="Absent" value={stats.absent} color="bg-rose-500" icon={UserX} active={filterStatus === 'absent'} onClick={() => setFilterStatus('absent')} />
                <StatCard label="On Leave" value={stats.onLeave} color="bg-purple-500" icon={CalendarIcon} active={filterStatus === 'leave'} onClick={() => setFilterStatus('leave')} />
                <StatCard label="Pending" value={stats.notMarked} color="bg-slate-400" icon={ClipboardCheck} active={filterStatus === ''} onClick={() => setFilterStatus('')} />
            </div>

            {/* ── Filter Bar ── */}
            <div className="bg-white p-4 lg:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name or ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400"
                        />
                    </div>
                    {/* Date Picker */}
                    <div className="flex bg-slate-50 border border-slate-200 py-3 px-4 rounded-xl items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-slate-400" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent text-sm font-bold text-[#001736] outline-none"
                        />
                    </div>
                    {/* Type Filter */}
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-slate-400" />
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="bg-slate-50 border border-slate-200 py-3 px-4 rounded-xl text-[11px] font-bold uppercase tracking-widest text-[#001736] outline-none cursor-pointer hover:bg-slate-100 transition-all"
                        >
                            <option value="all">All Types</option>
                            <option value="teaching">Teaching</option>
                            <option value="non-teaching">Non-Teaching</option>
                        </select>
                    </div>
                </div>
                {/* Mark All */}
                <button
                    onClick={markAllPresent}
                    className="flex items-center gap-2 px-5 py-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-black uppercase tracking-widest border border-emerald-100 hover:bg-emerald-500 hover:text-white transition-all whitespace-nowrap"
                >
                    <CheckCircle className="w-4 h-4" /> Mark All Present
                </button>
            </div>

            {/* ── DataTable ── */}
            <DataTable
                headers={[
                    { label: 'Staff Member' },
                    { label: 'Dept / Type', className: 'hidden md:table-cell' },
                    { label: 'Check In', className: 'hidden lg:table-cell' },
                    { label: 'Check Out', className: 'hidden xl:table-cell' },
                    { label: 'Mark Status' },
                    { label: 'Remarks', className: 'hidden lg:table-cell' },
                    { label: 'Status' },
                ]}
                columnCount={7}
                loading={loading}
                emptyMessage="No Staff Records Found — Add Staff First"
                footer={
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400">
                        <span className="tracking-widest">Attendance Registry: {selectedDate}</span>
                        <span className="tracking-[0.2em]">
                            {stats.present + stats.late} Present · {stats.absent} Absent · {stats.notMarked} Pending
                        </span>
                    </div>
                }
            >
                {filtered.map((staff) => {
                    const local = localMap[staff.staff_id] || {};
                    const isLocked = local.is_locked;
                    const currentStatus = local.status || '';

                    return (
                        <tr key={staff.staff_id} className={`hover:bg-slate-50/50 transition-colors group ${isLocked ? 'opacity-60' : ''}`}>

                            {/* Staff Name */}
                            <td className="px-4 lg:px-8 py-4 border-r border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md shrink-0">
                                        {staff.full_name?.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-[#001736] leading-tight">{staff.full_name}</p>
                                        <p className="text-[10px] text-slate-400 font-bold">{staff.designation || '—'}</p>
                                    </div>
                                    {isLocked && <Lock className="w-3.5 h-3.5 text-slate-300 ml-1" />}
                                </div>
                            </td>

                            {/* Dept / Type */}
                            <td className="px-4 lg:px-8 py-4 border-r border-slate-100 hidden md:table-cell">
                                <p className="text-xs font-bold text-slate-600 uppercase">{staff.department || '—'}</p>
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mt-1 inline-block ${
                                    staff.staff_type === 'teaching' ? 'bg-indigo-50 text-indigo-500' : 'bg-amber-50 text-amber-600'
                                }`}>
                                    {staff.staff_type}
                                </span>
                            </td>

                            {/* Check In time */}
                            <td className="px-4 lg:px-8 py-4 border-r border-slate-100 hidden lg:table-cell">
                                <input
                                    type="time"
                                    value={local.check_in_time || ''}
                                    onChange={(e) => updateLocal(staff.staff_id, 'check_in_time', e.target.value)}
                                    disabled={isLocked}
                                    className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-[#001736] outline-none focus:border-blue-400 disabled:opacity-40 w-[100px]"
                                />
                            </td>

                            {/* Check Out time */}
                            <td className="px-4 lg:px-8 py-4 border-r border-slate-100 hidden xl:table-cell">
                                <input
                                    type="time"
                                    value={local.check_out_time || ''}
                                    onChange={(e) => updateLocal(staff.staff_id, 'check_out_time', e.target.value)}
                                    disabled={isLocked}
                                    className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-[#001736] outline-none focus:border-blue-400 disabled:opacity-40 w-[100px]"
                                />
                            </td>

                            {/* Mark Status Buttons */}
                            <td className="px-4 lg:px-8 py-4 border-r border-slate-100">
                                {isLocked ? (
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                        <Lock className="w-3 h-3" /> Locked
                                    </span>
                                ) : (
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => markStatus(staff.staff_id, 'present')}
                                            title="Present"
                                            className={`p-2 rounded-lg transition-all ${currentStatus === 'present' ? 'bg-emerald-500 text-white shadow-md' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white'}`}
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => markStatus(staff.staff_id, 'late')}
                                            title="Late"
                                            className={`p-2 rounded-lg transition-all ${currentStatus === 'late' ? 'bg-amber-500 text-white shadow-md' : 'bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white'}`}
                                        >
                                            <Clock className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => markStatus(staff.staff_id, 'absent')}
                                            title="Absent"
                                            className={`p-2 rounded-lg transition-all ${currentStatus === 'absent' ? 'bg-rose-500 text-white shadow-md' : 'bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white'}`}
                                        >
                                            <XCircle className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => markStatus(staff.staff_id, 'leave')}
                                            title="Leave"
                                            className={`px-2 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${currentStatus === 'leave' ? 'bg-purple-500 text-white shadow-md' : 'bg-purple-50 text-purple-600 hover:bg-purple-500 hover:text-white'}`}
                                        >
                                            LV
                                        </button>
                                    </div>
                                )}
                            </td>

                            {/* Remarks */}
                            <td className="px-4 lg:px-8 py-4 border-r border-slate-100 hidden lg:table-cell">
                                <input
                                    type="text"
                                    value={local.remarks || ''}
                                    onChange={(e) => updateLocal(staff.staff_id, 'remarks', e.target.value)}
                                    disabled={isLocked}
                                    placeholder="Remarks..."
                                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-[#001736] outline-none focus:border-blue-400 disabled:opacity-40 w-full max-w-[160px]"
                                />
                            </td>

                            {/* Current Status Badge */}
                            <td className="px-4 lg:px-8 py-4">
                                <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full ${statusBadge[currentStatus] || statusBadge['']}`}>
                                    {currentStatus || 'Not Marked'}
                                </span>
                            </td>
                        </tr>
                    );
                })}
            </DataTable>
        </div>
    );
};

/** Compact Stat Card */
const StatCard = ({ label, value, color, icon: Icon, active, onClick }) => (
    <button
        onClick={onClick}
        className={`bg-white p-3 lg:p-5 rounded-2xl border transition-all text-left group hover:shadow-md ${
            active ? 'border-indigo-500 shadow-md ring-1 ring-indigo-500' : 'border-slate-200'
        }`}
    >
        <div className="flex items-center gap-2 lg:gap-3">
            <div className={`w-8 h-8 lg:w-10 lg:h-10 ${color} rounded-xl flex items-center justify-center shadow group-hover:scale-110 transition-transform shrink-0`}>
                <Icon className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
            </div>
            <div>
                <p className="text-[8px] lg:text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">{label}</p>
                <p className="text-xl lg:text-2xl font-black text-[#001736] leading-tight">{value}</p>
            </div>
        </div>
    </button>
);

export default StaffAttendance;
