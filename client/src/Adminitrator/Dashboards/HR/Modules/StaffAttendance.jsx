import React, { useState, useEffect, useCallback, useReducer, useMemo } from 'react';
import {
    ClipboardCheck, Search, CheckCircle, XCircle, Clock,
    Calendar as CalendarIcon, UserCheck, UserX, Users,
    RefreshCw, Save, Filter, Lock, Smartphone, Monitor,
    Eye
} from 'lucide-react';
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import DataTable from '../../../admcomponents/DataTable';
import { toast } from 'react-toastify';
import { getStaffAttendance, markStaffAttendance, lockStaffAttendance } from '../../../../services/attendanceAPI';
import StaffAttendanceReport from './StaffAttendanceReport';



// ── Optimized State Reducer ────────────────────────────────────────────────
const attendanceReducer = (state, action) => {
    switch (action.type) {
        case 'INIT':
            return action.payload;
        case 'UPDATE_FIELD':
            return {
                ...state,
                [action.staffId]: {
                    ...state[action.staffId],
                    [action.field]: action.value
                }
            };
        case 'MARK_STATUS': {
            const current = state[action.staffId] || {};
            const now = new Date().toTimeString().slice(0, 5);
            return {
                ...state,
                [action.staffId]: {
                    ...current,
                    status: action.status,
                    check_in_time: (action.status === 'present' || action.status === 'late') && !current.check_in_time ? now : current.check_in_time
                }
            };
        }
        case 'MARK_ALL_PRESENT': {
            const now = new Date().toTimeString().slice(0, 5);
            const newState = { ...state };
            action.staffIds.forEach(id => {
                if (!newState[id]?.is_locked) {
                    newState[id] = {
                        ...newState[id],
                        status: 'present',
                        check_in_time: newState[id]?.check_in_time || now
                    };
                }
            });
            return newState;
        }
        default:
            return state;
    }
};

// ── Memoized Row Component ──────────────────────────────────────────────────
const StaffRow = React.memo(({ staff, local, onUpdateField, onMarkStatus, onViewReport, index }) => {
    const isLocked = local?.is_locked;
    const currentStatus = local?.status || '';

    const statusBadge = {
        present: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
        late:    'bg-amber-50 text-amber-600 border border-amber-100',
        absent:  'bg-rose-50 text-rose-600 border border-rose-100',
        leave:   'bg-purple-50 text-purple-600 border border-purple-100',
        '':      'bg-slate-100 text-slate-400 border border-slate-200',
    };

    return (
        <tr className={`hover:bg-slate-50/50 transition-colors group ${isLocked ? 'opacity-60' : ''} text-[10px] lg:text-[11px] font-bold text-table-cell uppercase`}>
            {/* Sr. */}
            <td className="px-1 py-2 border-b-table border-r-table text-center w-[40px]">
                {index + 1}
            </td>

            {/* Staff Name & ID */}
            <td className="px-1.5 py-2 border-b-table border-r-table text-institutional-main font-black truncate max-w-[160px]">
                <div className="flex flex-col">
                    <span className="truncate">{staff.full_name}</span>
                    <span className="text-[9px] text-slate-400 font-black">{staff.employee_id || `ID: ${staff.staff_id}`}</span>
                </div>
            </td>

            {/* Role */}
            <td className="px-1.5 py-2 border-b-table border-r-table text-center w-[100px]">
                <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-500`}>
                    {staff.role_name || staff.staff_type || 'Staff'}
                </span>
            </td>

            {/* Check In time */}
            <td className="px-1 py-2 border-b-table border-r-table text-center w-[90px]">
                <input
                    type="time"
                    value={local?.check_in_time || ''}
                    onChange={(e) => onUpdateField(staff.staff_id, 'check_in_time', e.target.value)}
                    disabled={isLocked}
                    className="bg-transparent border-none rounded p-0 text-[10px] font-black text-[#001736] outline-none text-center w-full"
                />
            </td>

            {/* Check Out time */}
            <td className="px-1 py-2 border-b-table border-r-table text-center w-[90px]">
                <input
                    type="time"
                    value={local?.check_out_time || ''}
                    onChange={(e) => onUpdateField(staff.staff_id, 'check_out_time', e.target.value)}
                    disabled={isLocked}
                    className="bg-transparent border-none rounded p-0 text-[10px] font-black text-[#001736] outline-none text-center w-full"
                />
            </td>

            <td className="px-1.5 py-2 border-b-table border-r-table text-center w-[120px]">
                <div className="flex flex-col items-center gap-1">
                    {staff.self_punch_in ? (
                        <div className="flex flex-col items-center">
                            <div className="flex items-center gap-1 text-emerald-600">
                                {staff.device_type === 'laptop' ? <Monitor className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
                                <span className="text-[10px] font-black">IN: {new Date(staff.self_punch_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <span className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter">Via {staff.punch_in_method} ({staff.device_type})</span>
                        </div>
                    ) : (
                        <span className="text-[8px] text-slate-300 font-bold uppercase">No IN</span>
                    )}

                    {staff.self_punch_out ? (
                        <div className="flex flex-col items-center border-t border-slate-100 pt-1 w-full">
                            <div className="flex items-center gap-1 text-rose-600">
                                {staff.device_type === 'laptop' ? <Monitor className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
                                <span className="text-[10px] font-black">OUT: {new Date(staff.self_punch_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <span className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter">Via {staff.punch_out_method} ({staff.device_type})</span>
                        </div>
                    ) : staff.self_punch_in ? (
                        <span className="text-[8px] text-amber-500 font-bold uppercase border-t border-slate-100 pt-1 w-full text-center">Still In</span>
                    ) : null}
                </div>
            </td>

            {/* Mark Status Buttons */}
            <td className="px-1 py-2 border-b-table border-r-table w-[140px]">
                {isLocked ? (
                    <div className="flex items-center justify-center gap-1 opacity-40">
                        <Lock className="w-3 h-3" />
                    </div>
                ) : (
                    <div className="flex items-center justify-center gap-1">
                        <button
                            onClick={() => onMarkStatus(staff.staff_id, 'present')}
                            className={`p-1.5 rounded transition-all border ${currentStatus === 'present' ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm' : 'bg-white text-emerald-600 border-slate-200 hover:border-emerald-500'}`}
                        >
                            <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => onMarkStatus(staff.staff_id, 'late')}
                            className={`p-1.5 rounded transition-all border ${currentStatus === 'late' ? 'bg-amber-500 text-white border-amber-600 shadow-sm' : 'bg-white text-amber-600 border-slate-200 hover:border-amber-500'}`}
                        >
                            <Clock className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => onMarkStatus(staff.staff_id, 'absent')}
                            className={`p-1.5 rounded transition-all border ${currentStatus === 'absent' ? 'bg-rose-500 text-white border-rose-600 shadow-sm' : 'bg-white text-rose-600 border-slate-200 hover:border-rose-500'}`}
                        >
                            <XCircle className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => onMarkStatus(staff.staff_id, 'leave')}
                            className={`p-1.5 rounded text-[8px] font-black uppercase tracking-tighter transition-all border ${currentStatus === 'leave' ? 'bg-purple-500 text-white border-purple-600 shadow-sm' : 'bg-white text-purple-600 border-slate-200 hover:border-purple-500'}`}
                        >
                            LV
                        </button>
                    </div>
                )}
            </td>

            {/* Remarks */}
            <td className="px-1 py-2 border-b-table border-r-table w-[150px]">
                <input
                    type="text"
                    value={local?.remarks || ''}
                    onChange={(e) => onUpdateField(staff.staff_id, 'remarks', e.target.value)}
                    disabled={isLocked}
                    placeholder="..."
                    className="bg-transparent border-none text-[10px] font-bold text-[#001736] outline-none w-full placeholder:text-slate-300 px-1"
                />
            </td>

            {/* Current Status Badge */}
            <td className="px-1 py-2 border-b-table text-center w-[120px]">
                <div className="flex flex-col items-center gap-1.5">
                    <span className={`text-[8px] font-black uppercase tracking-[0.15em] px-2 py-1 rounded-full border ${statusBadge[currentStatus] || statusBadge['']}`}>
                        {currentStatus || 'Pending'}
                    </span>
                    {currentStatus && (
                        <span className={`text-[7px] font-bold uppercase px-1.5 py-0.5 rounded ${staff.self_punch_in ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>
                            {staff.self_punch_in ? 'Mobile Punch' : 'Manual Entry'}
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={() => onViewReport(staff)}
                        title="View Attendance Report"
                        className="flex items-center gap-1 text-[8px] font-black text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 px-2 py-1 rounded border border-indigo-200 transition-all uppercase tracking-widest cursor-pointer shadow-sm animate-pulse-subtle"
                    >
                        <Eye className="w-3 h-3" /> View
                    </button>
                </div>
            </td>
        </tr>
    );
});

const StaffAttendance = ({ toggleSidebar }) => {
    const [staffList, setStaffList] = useState([]);
    const [localMap, dispatch] = useReducer(attendanceReducer, {});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // ── Full-Page Report & Export State Management ──────────────────────────────
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'report'
    const [selectedStaffForReport, setSelectedStaffForReport] = useState(null);

    const handleViewReport = useCallback((staff) => {
        setSelectedStaffForReport(staff);
        setViewMode('report');
    }, []);

    // ── Fetch staff + attendance ───────────────────────────────────────────
    const fetchAttendance = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getStaffAttendance({ date: selectedDate });
            
            // De-duplicate and filter out admins at the source
            const uniqueStaffMap = new Map();
            (data || []).forEach(item => {
                if (item.role_name?.toLowerCase() !== 'admin') {
                    if (!uniqueStaffMap.has(item.staff_id)) {
                        uniqueStaffMap.set(item.staff_id, item);
                    }
                }
            });
            const uniqueStaff = Array.from(uniqueStaffMap.values());
            setStaffList(uniqueStaff);

            const initialMap = {};
            uniqueStaff.forEach(s => {
                initialMap[s.staff_id] = {
                    status: s.status === 'not marked' ? '' : s.status,
                    remarks: s.remarks || '',
                    check_in_time: s.check_in_time || '',
                    check_out_time: s.check_out_time || '',
                    is_locked: s.is_locked === 1,
                };
            });
            dispatch({ type: 'INIT', payload: initialMap });
        } catch (err) {
            console.error('Error fetching staff attendance:', err);
            toast.error('Failed to load attendance data');
        } finally {
            setLoading(false);
        }
    }, [selectedDate]);

    useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

    // Reset pagination on filter or date change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterType, filterStatus, selectedDate]);

    // ── Optimized Handlers ──────────────────────────────────────────────────
    const handleUpdateField = useCallback((staffId, field, value) => {
        dispatch({ type: 'UPDATE_FIELD', staffId, field, value });
    }, []);

    const handleMarkStatus = useCallback((staffId, status) => {
        dispatch({ type: 'MARK_STATUS', staffId, status });
    }, []);

    const handleMarkAllPresent = () => {
        const unlockIds = staffList.filter(s => !localMap[s.staff_id]?.is_locked).map(s => s.staff_id);
        dispatch({ type: 'MARK_ALL_PRESENT', staffIds: unlockIds });
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
            await markStaffAttendance({
                date: selectedDate,
                attendance_data,
            });
            toast.success('Attendance saved successfully!');
            fetchAttendance();
        } catch (err) {
            console.error('Error saving attendance:', err);
            toast.error(err?.response?.data?.error || 'Failed to save attendance');
        } finally {
            setSaving(false);
        }
    };

    // ── Optimized Filtering ─────────────────────────────────────────────────
    const filtered = useMemo(() => {
        return staffList.filter(s => {
            const local = localMap[s.staff_id] || {};
            const effectiveStatus = local.status || '';
            const matchSearch =
                s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                String(s.staff_id).includes(searchQuery);
            const matchType = filterType === 'all' || s.staff_type === filterType;
            const matchStatus = filterStatus === 'all' || (filterStatus === '' ? effectiveStatus === '' : effectiveStatus === filterStatus);
            return matchSearch && matchType && matchStatus;
        });
    }, [staffList, localMap, searchQuery, filterType, filterStatus]);

    // ── Stats ───────────────────────────────────────────────────────────────
    const stats = useMemo(() => {
        const counts = { total: staffList.length, present: 0, late: 0, absent: 0, leave: 0, pending: 0 };
        staffList.forEach(s => {
            const status = localMap[s.staff_id]?.status || '';
            if (status === 'present') counts.present++;
            else if (status === 'late') counts.late++;
            else if (status === 'absent') counts.absent++;
            else if (status === 'leave') counts.leave++;
            else counts.pending++;
        });
        return counts;
    }, [staffList, localMap]);

    const isLocked = useMemo(() => staffList.some(s => localMap[s.staff_id]?.is_locked), [staffList, localMap]);

    // ── Pagination Calculation ──────────────────────────────────────────────
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginatedData = useMemo(() => {
        return filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }, [filtered, currentPage]);

    if (viewMode === 'report' && selectedStaffForReport) {
        return (
            <StaffAttendanceReport
                staff={selectedStaffForReport}
                onClose={() => setViewMode('list')}
                toggleSidebar={toggleSidebar}
            />
        );
    }

    return (
        <div className="p-4 lg:p-8 space-y-6 min-h-screen bg-[#F8FAFC]">

            {/* ── Header ── */}
            <ModuleHeader hideAcademicYear={true}
                title="Staff Attendance"
                subTitle="Daily Attendance Tracking & Logs"
                icon={ClipboardCheck}
                badge={selectedDate}
                toggleSidebar={toggleSidebar}
            >
                <div className="flex flex-wrap items-center gap-2 lg:gap-3 shrink-0">
                    <button
                        onClick={fetchAttendance}
                        className="p-3 bg-white! border! border-slate-200! rounded-xl text-[#001736]! hover:bg-slate-50 transition-all active:rotate-180 duration-700 shrink-0 shadow-md cursor-pointer flex items-center justify-center"
                        title="Refresh"
                    >
                        <RefreshCw size={18} className="text-[#001736]!" />
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || isLocked}
                        className="flex items-center gap-2 bg-white! text-[#001736]! px-4 py-3 lg:px-6 lg:py-3.5 rounded-xl lg:rounded-2xl font-black text-[10px] lg:text-[11px] uppercase tracking-widest shadow-2xl hover:bg-slate-50 transition-all active:scale-95 border! border-slate-200! whitespace-nowrap disabled:opacity-60"
                    >
                        <Save size={16} className="text-[#001736]!" />
                        <span className="hidden lg:inline text-[#001736]!">{saving ? 'Saving...' : 'Save Attendance'}</span>
                        <span className="lg:hidden text-[#001736]!">Save</span>
                    </button>
                    <button
                        onClick={async () => {
                            if (!window.confirm("Are you sure you want to lock the attendance register? This will prevent further changes.")) return;
                            try {
                                setSaving(true);
                                await lockStaffAttendance({ date: selectedDate });
                                toast.success("Attendance register locked successfully");
                                fetchAttendance();
                            } catch (err) {
                                console.log(err);
                                toast.error("Failed to lock register");
                            } finally {
                                setSaving(false);
                            }
                        }}
                        disabled={saving || stats.pending > 0 || isLocked}
                        className="flex items-center gap-2 bg-rose-600 text-white px-4 py-3 lg:px-6 lg:py-3.5 rounded-xl lg:rounded-2xl font-black text-[10px] lg:text-[11px] uppercase tracking-widest shadow-2xl hover:bg-rose-700 transition-all active:scale-95 border border-rose-500 whitespace-nowrap disabled:opacity-60"
                        title={stats.pending > 0 ? "Mark all staff before locking" : "Lock Register"}
                    >
                        <Lock size={16} />
                        <span className="hidden lg:inline">Lock Register</span>
                        <span className="lg:hidden">Lock</span>
                    </button>
                </div>
            </ModuleHeader>

            {/* ── Stats ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <StatCard label="Total" value={stats.total} color="bg-blue-600" icon={Users} active={filterStatus === 'all'} onClick={() => setFilterStatus('all')} />
                <StatCard label="Present" value={stats.present} color="bg-emerald-500" icon={UserCheck} active={filterStatus === 'present'} onClick={() => setFilterStatus('present')} />
                <StatCard label="Late" value={stats.late} color="bg-amber-500" icon={Clock} active={filterStatus === 'late'} onClick={() => setFilterStatus('late')} />
                <StatCard label="Absent" value={stats.absent} color="bg-rose-500" icon={UserX} active={filterStatus === 'absent'} onClick={() => setFilterStatus('absent')} />
                <StatCard label="On Leave" value={stats.leave} color="bg-purple-500" icon={CalendarIcon} active={filterStatus === 'leave'} onClick={() => setFilterStatus('leave')} />
                <StatCard label="Pending" value={stats.pending} color="bg-slate-400" icon={ClipboardCheck} active={filterStatus === ''} onClick={() => setFilterStatus('')} />
            </div>

            {/* ── Filter Bar ── */}
            <div className="bg-white p-4 lg:p-5 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-2 lg:flex lg:flex-row gap-3 items-start lg:items-center justify-between">
                <div className="relative col-span-2 lg:flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 font-bold"
                    />
                </div>
                <div className="flex bg-slate-50 border border-slate-200 py-3 px-4 rounded-xl items-center gap-2 justify-between col-span-1 lg:col-span-auto w-full lg:w-auto">
                    <CalendarIcon className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="bg-transparent text-sm font-bold text-[#001736] outline-none w-full cursor-pointer"
                    />
                </div>
                <div className="flex bg-slate-50 border border-slate-200 py-3 px-4 rounded-xl items-center gap-2 justify-between col-span-1 lg:col-span-auto w-full lg:w-auto">
                    <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="bg-transparent text-[11px] font-bold uppercase tracking-widest text-[#001736] outline-none cursor-pointer w-full"
                    >
                        <option value="all">All Types</option>
                        <option value="teaching">Teaching</option>
                        <option value="non-teaching">Non-Teaching</option>
                    </select>
                </div>
                <button
                    onClick={handleMarkAllPresent}
                    className="flex items-center justify-center gap-2 px-5 py-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-black uppercase tracking-widest border border-emerald-100 hover:bg-emerald-500 hover:text-white transition-all whitespace-nowrap col-span-2 lg:col-span-auto w-full lg:w-auto cursor-pointer shadow-sm active:scale-95"
                >
                    <CheckCircle className="w-4 h-4" /> Mark All Present
                </button>
            </div>

            {/* ── DataTable Container ── */}
            <div className="bg-white shadow-sm rounded-none overflow-hidden border border-slate-200">
                <div className="w-full mobile-table-scroll">
                    <DataTable
                        headers={[
                            { label: 'Sr.', className: 'w-[40px] text-center' },
                            { label: 'Staff Member', className: 'w-[160px]' },
                            { label: 'Role', className: 'text-center w-[100px]' },
                            { label: 'Check In', className: 'text-center w-[90px]' },
                            { label: 'Check Out', className: 'text-center w-[90px]' },
                            { label: 'Mobile Punch', className: 'text-center w-[120px]' },
                            { label: 'Mark Status', className: 'text-center w-[140px]' },
                            { label: 'Remarks', className: 'w-[150px]' },
                            { label: 'Status', className: 'text-center w-[100px]' },
                        ]}
                        columnCount={9}
                        loading={loading}
                        emptyMessage="No Staff Records Found — Add Staff First"
                        footer={
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex-wrap">
                                    <span>Registry: {filtered.length} Staff</span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                    <span>
                                        {stats.present + stats.late} Present · {stats.absent} Absent · {stats.pending} Pending
                                    </span>
                                </div>
                                
                                <div className="flex items-center gap-4">
                                    <button 
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-400 hover:text-[#001736] hover:border-slate-400 disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:border-slate-300 transition-all cursor-pointer"
                                    >PREV</button>
                                    <span className="text-xs font-black uppercase tracking-widest text-[#001736]">
                                        PAGE {currentPage} OF {totalPages || 1}
                                    </span>
                                    <button 
                                        disabled={currentPage === totalPages || totalPages === 0}
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-400 hover:text-[#001736] hover:border-slate-400 disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:border-slate-300 transition-all cursor-pointer"
                                    >NEXT</button>
                                </div>
                            </div>
                        }
                    >
                        {paginatedData.map((staff, idx) => (
                            <StaffRow
                                key={staff.staff_id}
                                index={((currentPage - 1) * itemsPerPage) + idx}
                                staff={staff}
                                local={localMap[staff.staff_id]}
                                onUpdateField={handleUpdateField}
                                onMarkStatus={handleMarkStatus}
                                onViewReport={handleViewReport}
                            />
                        ))}
                    </DataTable>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ label, value, color, icon: IconComponent, active, onClick }) => (
    <button
        onClick={onClick}
        className={`bg-white p-3 lg:p-5 rounded-2xl border transition-all text-left group hover:shadow-md ${
            active ? 'border-indigo-500 shadow-md ring-1 ring-indigo-500' : 'border-slate-200'
        }`}
    >
        <div className="flex items-center gap-2 lg:gap-3">
            <div className={`w-8 h-8 lg:w-10 lg:h-10 ${color} rounded-xl flex items-center justify-center shadow group-hover:scale-110 transition-transform shrink-0`}>
                {IconComponent && <IconComponent className="w-4 h-4 lg:w-5 lg:h-5 text-white" />}
            </div>
            <div>
                <p className="text-[8px] lg:text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">{label}</p>
                <p className="text-xl lg:text-2xl font-black text-[#001736] leading-tight">{value}</p>
            </div>
        </div>
    </button>
);

export default StaffAttendance;
