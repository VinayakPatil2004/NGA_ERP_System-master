import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
    RefreshCw, Edit3, Fingerprint, Eye, Search, Users, Calendar,
    ShieldCheck, X, Zap, CheckCircle2, XCircle, Clock, ChevronDown, ListFilter, Smartphone, Monitor
} from 'lucide-react';
import { toast } from 'react-toastify';
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import DataTable from '../../../admcomponents/DataTable';
import {
    getStudentAttendance,
    getStaffAttendance,
    getAttendanceStats,
    updateAttendanceRecord,
    getClassrooms,

    getStudentAttendanceHistory,
    getStaffAttendanceHistory,
    markStaffAttendance
} from '../../../../services/attendanceAPI';
import { useAcademicYear } from '../../../../context/AcademicYearContext';
import StaffAttendanceReport from '../../HR/Modules/StaffAttendanceReport';

/**
 * Attendance - Institutional Occupancy & Verification Matrix
 * Refined to the 'Simplified Premium' aesthetic with rounded-2xl and 1px borders.
 */
const Attendance = ({ toggleSidebar }) => {
    const { selectedYear: activeYear } = useAcademicYear();
    const location = useLocation();
    // Detect if current dashboard is admin or principal — only they can edit in/out times
    const currentDashboard = location.pathname.split('/')[2];
    const canEditTime = ['admin', 'principal'].includes(currentDashboard);
    const [activeType, setActiveType] = useState('staff');

    // Data State
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [classrooms, setClassrooms] = useState([]);
    const [records, setRecords] = useState([]);

    // Filter State
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedClass, setSelectedClass] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    // Pagination & Mobile UI State
    const [currentPage, setCurrentPage] = useState(1);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const itemsPerPage = 15;

    // Modal & History State
    const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [historyData, setHistoryData] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [adjustmentData, setAdjustmentData] = useState({ status: '', remarks: '', check_in_time: '', check_out_time: '' });
    const [historyMonth, setHistoryMonth] = useState(new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date()));
    const [saving, setSaving] = useState(false);

    // Detailed Report State
    const [selectedStaffForReport, setSelectedStaffForReport] = useState(null);
    const [showDetailedReport, setShowDetailedReport] = useState(false);

    // 1. Mark Status (Admin Override / Direct Entry)
    const markStatus = (id, status) => {
        setRecords(prev => prev.map(rec => {
            const isMatch = activeType === 'student' ? rec.student_id === id : rec.staff_id === id;
            if (isMatch) return { ...rec, status };
            return rec;
        }));
    };

    const handleStaffFinalize = async () => {
        try {
            setSaving(true);
            const staffRecords = records.filter(r => r.staff_id);
            const payload = {
                date: selectedDate,
                attendance_data: staffRecords.map(s => ({
                    staff_id: s.staff_id,
                    status: s.status === 'not marked' ? 'absent' : s.status,
                    remarks: s.remarks || '',
                    check_in_time: s.check_in_time || null,
                    check_out_time: s.check_out_time || null,
                    working_hours: s.working_hours || null
                }))
            };

            await markStaffAttendance(payload);
            toast.success("Staff attendance registry updated");
            fetchData();
        } catch (err) {
            console.error("Staff Finalize Error:", err);
            toast.error("Failed to sync staff records");
        } finally {
            setSaving(false);
        }
    };

    // 2. Fetch Data
    const fetchData = useCallback(async () => {
        if (!activeYear?.id) return;
        setLoading(true);
        try {
            const [statsData, classroomData] = await Promise.all([
                getAttendanceStats({ date: selectedDate, academic_year_id: activeYear?.id }),
                getClassrooms(activeYear?.id)
            ]);
            setStats(statsData);
            setClassrooms(classroomData || []);

            if (activeType === 'student') {
                const studentData = await getStudentAttendance({
                    date: selectedDate,
                    classroom_id: selectedClass || null,
                    academic_year_id: activeYear?.id
                });
                setRecords(studentData || []);
            } else if (activeType === 'staff') {
                const staffData = await getStaffAttendance({ date: selectedDate, academic_year_id: activeYear?.id });
                setRecords(staffData || []);
            } else {
                setRecords([]);
            }
        } catch (error) {
            console.error("Data Fetch Error:", error);
            toast.error("Failed to sync matrix data");
        } finally {
            setLoading(false);
        }
    }, [selectedDate, selectedClass, activeType, activeYear?.id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Reset filters and date when academic year changes
    useEffect(() => {
        setSelectedClass('');
        setCurrentPage(1);
        // Auto-set date to the first day of the selected academic year
        if (activeYear?.year_name) {
            const startYearNum = parseInt(activeYear.year_name.split('-')[0]);
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            const currentYear = today.getFullYear();
            // If the selected year's start year matches today's year, use today's date
            if (startYearNum === currentYear || (startYearNum === currentYear - 1 && today.getMonth() < 5)) {
                setSelectedDate(todayStr);
            } else {
                // Set to June 1st of the academic year's start
                setSelectedDate(`${startYearNum}-06-01`);
            }
        }
    }, [activeYear?.id, activeYear?.year_name]);

    const fetchHistory = async (record) => {
        try {
            setHistoryLoading(true);
            setSelectedRecord(record);
            setShowHistoryModal(true);
            const data = activeType === 'student'
                ? await getStudentAttendanceHistory({ student_id: record.student_id, academic_year_id: activeYear?.id })
                : await getStaffAttendanceHistory({ staff_id: record.staff_id });
            setHistoryData(data || []);
        } catch (err) {
            console.error("History Fetch Error:", err);
            toast.error("Failed to load presence history");
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleAdjustmentSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await updateAttendanceRecord({
                id: selectedRecord.attendance_id || selectedRecord.student_id || selectedRecord.staff_id,
                type: activeType,
                status: adjustmentData.status,
                remarks: adjustmentData.remarks,
                check_in_time: adjustmentData.check_in_time || null,
                check_out_time: adjustmentData.check_out_time || null,
                date: selectedDate,
                academic_year_id: activeYear?.id,
                student_id: selectedRecord.student_id,
                staff_id: selectedRecord.staff_id,
                classroom_id: selectedRecord.classroom_id || selectedClass
            });

            // Institutional Logic: Update local matrix state immediately for reactive UI
            setRecords(prev => prev.map(rec => {
                const isMatch = activeType === 'student'
                    ? rec.student_id === selectedRecord.student_id
                    : rec.staff_id === selectedRecord.staff_id;

                if (isMatch) {
                    return {
                        ...rec,
                        status: response.status || adjustmentData.status,
                        remarks: response.remarks || adjustmentData.remarks,
                        check_in_time: adjustmentData.check_in_time || rec.check_in_time,
                        check_out_time: adjustmentData.check_out_time || rec.check_out_time,
                    };
                }
                return rec;
            }));

            toast.success("Attendance adjusted successfully");
            setShowAdjustmentModal(false);
            // fetchData(); // Optional: Keep sync but local state is already fresh
        } catch (err) {
            console.error("Adjustment Error:", err);
            toast.error("Failed to sync matrix adjustment");
        }
    };

    const filteredRecords = records.filter(r => {
        if (activeType === 'staff' && r.role_name?.toLowerCase() === 'admin') return false;

        const name = (r.student_name || r.full_name || '').toLowerCase();
        const id = (r.roll_number?.toString() || r.staff_id?.toString() || '').toLowerCase();
        const query = searchQuery.toLowerCase();
        return name.includes(query) || id.includes(query);
    });

    // Final de-duplicated and paginated list
    const finalRecords = [...new Map(filteredRecords.map(item => [item.student_id || item.staff_id, item])).values()];
    const totalPages = Math.ceil(finalRecords.length / itemsPerPage);
    const paginatedRecords = finalRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedClass, activeType]);

    if (showDetailedReport && selectedStaffForReport) {
        return (
            <StaffAttendanceReport
                staff={selectedStaffForReport}
                onClose={() => {
                    setShowDetailedReport(false);
                    setSelectedStaffForReport(null);
                }}
                toggleSidebar={toggleSidebar}
            />
        );
    }

    return (
        <div className="p-2 lg:p-8 bg-institutional-page min-h-screen font-sans text-left">

            {/* 1. Unified Module Header */}
            <ModuleHeader
                title="Attendance Desk"
                subTitle={`Institutional Matrix - ${activeYear?.year_name || 'Loading...'}`}
                badge="Academic Tracking"
                toggleSidebar={toggleSidebar}
                showSearch={true}
                hideDesktopSearch={true}
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                onSearchToggle={() => setIsSearchOpen(!isSearchOpen)}
            >
                <div className="flex items-center gap-1.5 lg:gap-4">
                    {/* Registry Date - Dark Institutional Style */}
                    <div className="hidden lg:flex items-center bg-white border border-white/10 px-2 lg:px-3 rounded-md shadow-xl group/date hover:border-amber-400/50 transition-all max-w-[130px] lg:max-w-none h-9">
                        <Calendar className="w-3.5 h-3.5 text-amber-400 mr-1.5 lg:mr-3 group-hover/date:scale-110 transition-transform shrink-0" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent text-black text-[9px] lg:text-[12px] font-black uppercase tracking-tight lg:tracking-[0.2em] outline-none cursor-pointer placeholder:text-white/20 w-full"
                        />
                    </div>

                    <button
                        onClick={fetchData}
                        className="w-9 h-9 flex items-center justify-center bg-white border border-white/10 rounded-md text-amber-400 hover:bg-white/10 hover:text-amber-300 transition-all shadow-xl active:rotate-180 duration-700 shrink-0"
                        title="Synchronize Global Registry"
                    >
                        <RefreshCw size={14} className="opacity-80" />
                    </button>

                </div>
            </ModuleHeader>

            {/* Presence Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-8 text-left">
                {activeType === 'student' ? (
                    <>
                        <StatusMetric label="Total Students" value={stats?.today?.students?.total} iconComponent={Users} color="indigo" />
                        <StatusMetric label="Present today" value={stats?.today?.students?.breakdown?.find(b => b.status === 'present')?.count} iconComponent={CheckCircle2} color="emerald" />
                        <StatusMetric label="Absent today" value={stats?.today?.students?.breakdown?.find(b => b.status === 'absent')?.count} iconComponent={XCircle} color="rose" />
                        <StatusMetric label="Late Students" value={stats?.today?.students?.breakdown?.find(b => b.status === 'late')?.count} iconComponent={Clock} color="amber" />
                    </>
                ) : (
                    <>
                        <StatusMetric label="Total Staff" value={stats?.today?.staff?.total} iconComponent={ShieldCheck} color="indigo" />
                        <StatusMetric label="Present Staff" value={stats?.today?.staff?.breakdown?.find(b => b.status === 'present')?.count} iconComponent={CheckCircle2} color="emerald" />
                        <StatusMetric label="Absent Staff" value={stats?.today?.staff?.breakdown?.find(b => b.status === 'absent')?.count} iconComponent={XCircle} color="rose" />
                        <StatusMetric label="Late Entry" value={stats?.today?.staff?.breakdown?.find(b => b.status === 'late')?.count} iconComponent={Clock} color="amber" />
                    </>
                )}
            </div>

            {/* 3. Monitoring Workspace Toolbar (Matching StudentFeeAssignment) */}
            <div className={`bg-white mb-3 border-b border-black/5`}>
                <div className={`p-3 lg:p-4 bg-slate-50/30 ${isSearchOpen ? 'block' : 'hidden lg:block'} animate-in slide-in-from-top-2 duration-300`}>
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* LEFT: Search & Toggle */}
                        <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4 flex-1">
                            <div className="flex items-center gap-2 w-full lg:w-auto">
                                <div className="relative flex-1 lg:w-72 group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#001736] transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Search by Identity..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-3 h-9 bg-white border border-black rounded-md text-[10px] lg:text-[11px] font-medium text-[#001736] outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all uppercase tracking-wider placeholder:text-slate-300 shadow-sm"
                                    />
                                </div>

                                <div className="flex lg:hidden items-center bg-white border border-black px-2 rounded-md shadow-sm group/date transition-all h-9 shrink-0">
                                    <Calendar className="w-3.5 h-3.5 text-amber-400 mr-1.5 shrink-0" />
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="bg-transparent text-black text-[9px] font-black uppercase tracking-tight outline-none cursor-pointer w-[90px] sm:w-[110px]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 w-full lg:w-auto">
                                <div className="flex bg-white p-1 rounded-md border border-black shadow-sm shrink-0 h-9">
                                    <button
                                        className={`flex-1 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all h-full ${activeType === 'student' ? 'bg-[#001736] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                                        onClick={() => { setActiveType('student'); setRecords([]); }}
                                    >
                                        Student
                                    </button>
                                    <button
                                        className={`flex-1 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all h-full ${activeType === 'staff' ? 'bg-[#001736] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                                        onClick={() => { setActiveType('staff'); setRecords([]); }}
                                    >
                                        Staff
                                    </button>
                                </div>
                                {activeType === 'staff' && (
                                    <button
                                        onClick={handleStaffFinalize}
                                        disabled={saving || records.length === 0}
                                        className="h-9 px-3 lg:px-4 bg-[#001736]  border border-emerald-600 rounded-md text-white hover:bg-emerald-600 transition-all shadow-xl active:scale-95 shrink-0 flex items-center justify-center gap-1.5 lg:gap-2"
                                    >
                                        <Zap size={14} className="shrink-0" />
                                        <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest whitespace-nowrap">{saving ? 'Saving...' : 'Save Changes'}</span>
                                    </button>
                                )}

                                {activeType === 'student' && (
                                    <div className="relative group h-full">
                                        <select
                                            value={selectedClass}
                                            onChange={(e) => setSelectedClass(e.target.value)}
                                            className="pl-4 pr-10 py-2.5 bg-white border border-black rounded-md text-[10px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer hover:bg-slate-50 transition-all shadow-sm w-full h-full"
                                        >
                                            <option value="">All Classrooms</option>
                                            {classrooms.map(c => (
                                                <option key={c.id} value={c.id}>{c.class_name} - {c.section}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#001736] pointer-events-none group-hover:scale-110 transition-transform" />
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            <DataTable
                headers={[
                    { label: "Sr.", className: "w-[50px] text-center border-r border-black" },
                    { label: activeType === 'student' ? "Student Name" : "Staff Name", className: "border-r border-black" },
                    ...(activeType === 'student' ? [{ label: "Parent Details", className: "border-r border-black" }] : []),
                    ...(activeType === 'student' && !selectedClass ? [{ label: "Class", className: "w-[120px] border-r border-black" }] : []),
                    { label: activeType === 'student' ? "Roll ID" : "Role", className: "w-[100px] border-r border-black" },
                    ...(activeType === 'staff' ? [
                        { label: "Check-In/Out", className: "w-[120px] border-r border-black" },
                        { label: "Mobile Punch", className: "w-[120px] border-r border-black" }
                    ] : []),
                    { label: "Remarks", className: "w-[150px] border-r border-black text-center" },
                    { label: "Status", className: activeType === 'staff' ? "text-center w-[200px] border-r border-black" : "w-[120px] border-r border-black" },
                    { label: "Actions", className: "text-center w-[120px]" }
                ]}
                columnCount={activeType === 'staff' ? 9 : (activeType === 'student' ? (selectedClass ? 7 : 8) : 5)}
                loading={loading}
                emptyMessage="No Attendance Records Synced"
                footer={
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-t border-black/5 bg-slate-50/30">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#001736] opacity-60">
                            Showing <span className="font-bold">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-bold">{Math.min(currentPage * itemsPerPage, finalRecords.length)}</span> of <span className="font-bold">{finalRecords.length}</span> Records
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 bg-white border border-black rounded text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"
                            >
                                Prev
                            </button>
                            <div className="px-5 text-[10px] font-black text-[#001736] uppercase">Page {currentPage} of {totalPages || 1}</div>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="px-4 py-2 bg-white border border-black rounded text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                }
            >
                {paginatedRecords.map((record, idx) => (
                    <tr key={record.attendance_id || record.student_id || record.staff_id} className={`transition-colors group ${
                        record.status === 'present' ? 'bg-emerald-50/60 hover:bg-emerald-50' :
                        record.status === 'absent' ? 'bg-rose-50/60 hover:bg-rose-50' :
                        record.status === 'late' ? 'bg-amber-50/60 hover:bg-amber-50' :
                        record.status === 'half-day' ? 'bg-blue-50/60 hover:bg-blue-50' :
                        'hover:bg-slate-50/50'
                    }`}>
                        <td className="px-1 py-4 border-b border-r border-black text-center text-[11px] font-black">
                            {((currentPage - 1) * itemsPerPage) + idx + 1}
                        </td>
                        <td className="px-6 py-4 border-b border-r border-black">
                            <span className="text-[12px] font-medium text-black uppercase tracking-tight">
                                {record.student_name || record.full_name}
                            </span>
                        </td>
                        {activeType === 'student' && (
                            <td className="px-6 py-4 border-b border-r border-black">
                                <p className="text-[11px] font-bold text-[#001736] uppercase tracking-tight">{record.father_name || '---'}</p>
                                <p className="text-[12px] font-black text-indigo-600 font-mono mt-0.5">{record.father_mobile || '---'}</p>
                            </td>
                        )}
                        {activeType === 'student' && !selectedClass && (
                            <td className="px-6 py-4 border-b border-r border-black text-center">
                                <span className="text-[12px] font-medium text-indigo-600 bg-indigo-50 px-3 py-2 rounded border border-indigo-100 uppercase tracking-tighter">
                                    {record.class_name} {record.section}
                                </span>
                            </td>
                        )}
                        <td className="px-6 py-4 border-b border-r border-black text-center">
                            <span className="text-[12px] font-medium text-black uppercase">
                                {activeType === 'student' ? record.roll_number : (record.role_name || record.staff_type || 'Staff')}
                            </span>
                        </td>
                        {activeType === 'staff' && (
                            <td className="px-6 py-4 border-b border-r border-black">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                                        <Clock className="w-3 h-3 text-emerald-500" /> {record.check_in_time || '--:--'}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                                        <Clock className="w-3 h-3 text-rose-500" /> {record.check_out_time || '--:--'}
                                    </div>
                                </div>
                            </td>
                        )}
                        {activeType === 'staff' && (
                            <td className="px-6 py-4 border-b border-r border-black text-center">
                                <div className="flex flex-col items-center gap-2">
                                    {record.self_punch_in ? (
                                        <div className="flex flex-col items-center">
                                            <div className="flex items-center gap-1.5 text-emerald-600">
                                                {record.device_type === 'laptop' ? <Monitor className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
                                                <span className="text-[11px] font-black">IN: {new Date(record.self_punch_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Via {record.punch_in_method} ({record.device_type})</span>
                                        </div>
                                    ) : (
                                        <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">No IN</span>
                                    )}

                                    {record.self_punch_out ? (
                                        <div className="flex flex-col items-center border-t border-slate-100 pt-2 w-full">
                                            <div className="flex items-center gap-1.5 text-rose-600">
                                                {record.device_type === 'laptop' ? <Monitor className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
                                                <span className="text-[11px] font-black">OUT: {new Date(record.self_punch_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Via {record.punch_out_method} ({record.device_type})</span>
                                        </div>
                                    ) : record.self_punch_in ? (
                                        <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest border-t border-slate-100 pt-2 w-full text-center">Still In</span>
                                    ) : null}
                                </div>
                            </td>
                        )}
                        <td className="px-4 py-4 border-b border-r border-black text-center">
                            {activeType === 'staff' ? (
                                <input
                                    type="text"
                                    value={record.remarks || ''}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setRecords(prev => prev.map(r => r.staff_id === record.staff_id ? { ...r, remarks: val } : r));
                                    }}
                                    placeholder="..."
                                    className="w-full bg-transparent text-[11px] font-bold text-[#001736] outline-none border-none placeholder:text-slate-300 text-center uppercase"
                                />
                            ) : (
                                <span className="text-[11px] text-slate-400 italic truncate block max-w-[140px]">{record.remarks || '---'}</span>
                            )}
                        </td>
                        <td className="px-6 py-4 border-b border-r border-black text-center">
                            {activeType === 'staff' ? (
                                <div className="flex justify-center gap-2">
                                    <button
                                        onClick={() => markStatus(record.staff_id, 'present')}
                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${record.status === 'present' ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white text-slate-400 border-slate-200 hover:border-emerald-500'}`}
                                    >
                                        P
                                    </button>
                                    <button
                                        onClick={() => markStatus(record.staff_id, 'absent')}
                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${record.status === 'absent' ? 'bg-rose-500 text-white border-rose-600' : 'bg-white text-slate-400 border-slate-200 hover:border-rose-500'}`}
                                    >
                                        A
                                    </button>
                                    <button
                                        onClick={() => markStatus(record.staff_id, 'late')}
                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${record.status === 'late' ? 'bg-amber-400 text-white border-amber-500' : 'bg-white text-slate-400 border-slate-200 hover:border-amber-400'}`}
                                    >
                                        L
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-1.5">
                                    <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${record.status === 'present' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                        record.status === 'late' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                            record.status === 'absent' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                record.status === 'leave' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                                    'bg-slate-100 text-slate-400 border-slate-200'
                                        }`}>
                                        {record.status || 'Pending'}
                                    </span>
                                    {record.status && activeType === 'staff' && (
                                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded shadow-sm ${record.self_punch_in ? 'bg-indigo-600 text-white' : 'bg-slate-500 text-white'}`}>
                                            {record.self_punch_in ? 'Mobile App' : 'ERP Dashboard'}
                                        </span>
                                    )}
                                </div>
                            )}
                        </td>

                        <td className="px-6 py-4 border-b border-black text-center">
                            <div className="flex items-center justify-center gap-2">
                                <button
                                    onClick={() => {
                                        if (activeType === 'staff') {
                                            setSelectedStaffForReport(record);
                                            setShowDetailedReport(true);
                                        } else {
                                            fetchHistory(record);
                                        }
                                    }}
                                    className="p-2 bg-white border border-black text-indigo-600 rounded-lg hover:bg-slate-50 transition-all shadow-sm"
                                    title="View History"
                                >
                                    <Eye className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => { setSelectedRecord(record); setAdjustmentData({ status: record.status, remarks: record.remarks || '', check_in_time: record.check_in_time || '', check_out_time: record.check_out_time || '' }); setShowAdjustmentModal(false); setShowAdjustmentModal(true); }}
                                    className="p-2 bg-white border border-black text-[#001736] rounded-lg hover:bg-slate-50 transition-all shadow-sm"
                                    title="Adjust Mark"
                                >
                                    <Edit3 className="w-4 h-4" />
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
            </DataTable>

            {/* Presence History Modal — Calendar View */}
            {showHistoryModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-200 flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
                    <div className="bg-white rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[95vh]">
                        {/* Header */}
                        <div className="bg-[#001736] p-6 md:p-8 flex items-center justify-between text-white shrink-0">
                            <div>
                                <h1 className="text-xl font-black uppercase text-white! tracking-tighter mb-1">Presence History</h1>
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] ">{selectedRecord?.student_name || selectedRecord?.full_name}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <select
                                    value={historyMonth}
                                    onChange={(e) => setHistoryMonth(e.target.value)}
                                    className="bg-white border border-white text-black text-[10px] font-black uppercase rounded-lg px-3 py-2 outline-none cursor-pointer"
                                >
                                    {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => (
                                        <option key={m} value={m} className="bg-[#001736] text-white">{m}</option>
                                    ))}
                                </select>
                                <button onClick={() => setShowHistoryModal(false)} className="p-2 bg-white hover:bg-white/50 text-black rounded-full transition-all">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {historyLoading ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-4">
                                <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing History Ledger...</p>
                            </div>
                        ) : (
                            <div className="overflow-y-auto custom-scrollbar flex-1">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                                    {/* LEFT — Attendance Overview */}
                                    {(() => {
                                        const presentCount = historyData.filter(r => r.status === 'present').length;
                                        const absentCount = historyData.filter(r => r.status === 'absent').length;
                                        const lateCount = historyData.filter(r => r.status === 'late').length;
                                        const totalCount = historyData.length;
                                        const pct = totalCount > 0 ? ((presentCount + lateCount) / totalCount * 100).toFixed(1) : '0';
                                        const circumference = 364.4;
                                        const offset = circumference * (1 - parseFloat(pct) / 100);
                                        return (
                                            <div className="p-8 border-b lg:border-b-0 lg:border-r border-slate-100">
                                                <h2 className="text-lg font-black text-[#001736] mb-6">Attendance Overview</h2>
                                                <div className="flex flex-col sm:flex-row items-center gap-8 mb-8">
                                                    <div className="relative w-28 h-28 shrink-0">
                                                        <svg className="w-full h-full transform -rotate-90">
                                                            <circle cx="56" cy="56" r="50" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-gray-100" />
                                                            <circle cx="56" cy="56" r="50" stroke="currentColor" strokeWidth="10" fill="transparent"
                                                                strokeDasharray={circumference}
                                                                strokeDashoffset={offset}
                                                                className="text-emerald-500 transition-all duration-1000"
                                                            />
                                                        </svg>
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                            <span className="text-xl font-black text-[#001736]">{pct}%</span>
                                                            <span className="text-[9px] text-slate-400 font-bold uppercase">Average</span>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2 w-full">
                                                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100">
                                                            <div className="flex items-center gap-2 font-bold text-blue-900 text-sm"><div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>Present</div>
                                                            <span className="font-black text-blue-700">{presentCount} Days</span>
                                                        </div>
                                                        <div className="flex items-center justify-between p-3 bg-rose-50 rounded-xl border border-rose-100">
                                                            <div className="flex items-center gap-2 font-bold text-rose-900 text-sm"><div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>Absent</div>
                                                            <span className="font-black text-rose-600">{absentCount} Days</span>
                                                        </div>
                                                        <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100">
                                                            <div className="flex items-center gap-2 font-bold text-amber-900 text-sm"><div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>Late</div>
                                                            <span className="font-black text-amber-700">{lateCount} Days</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <h3 className="font-black text-[#001736] text-[11px] uppercase tracking-widest">Attendance Progress</h3>
                                                    <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                                                        <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%` }}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* RIGHT — Attendance Calendar */}
                                    <div className="p-8">
                                        <h2 className="text-lg font-black text-[#001736] mb-6">Attendance Calendar</h2>
                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                            <div className="grid grid-cols-7 gap-1.5 mb-3">
                                                {['S','M','T','W','T','F','S'].map((d,i) => <span key={i} className="text-center font-black text-slate-400 text-[10px]">{d}</span>)}
                                            </div>
                                            <div className="grid grid-cols-7 gap-1.5">
                                                {(() => {
                                                    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
                                                    const monthIdx = months.indexOf(historyMonth);
                                                    const year = new Date().getFullYear();
                                                    const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
                                                    const firstDay = new Date(year, monthIdx, 1).getDay();
                                                    const days = [];
                                                    for (let i = 0; i < firstDay; i++) days.push(<div key={`e${i}`} className="aspect-square" />);
                                                    for (let d = 1; d <= daysInMonth; d++) {
                                                        const dateStr = `${year}-${String(monthIdx+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                                                        const rec = historyData.find(r => { try { return new Date(r.date).toLocaleDateString('en-CA') === dateStr; } catch { return false; } });
                                                        let cls = 'bg-white text-gray-700 shadow-xs';
                                                        if (rec) {
                                                            if (rec.status === 'present') cls = 'bg-emerald-500 text-white shadow-lg shadow-emerald-200';
                                                            else if (rec.status === 'absent') cls = 'bg-rose-500 text-white shadow-lg shadow-rose-200';
                                                            else if (rec.status === 'late') cls = 'bg-amber-500 text-white shadow-lg shadow-amber-200';
                                                            else if (rec.status === 'leave' || rec.status === 'on leave') cls = 'bg-indigo-500 text-white shadow-lg shadow-indigo-200';
                                                        }
                                                        const isToday = new Date().toLocaleDateString('en-CA') === new Date(year, monthIdx, d).toLocaleDateString('en-CA');
                                                        days.push(<div key={`d${d}`} className={`aspect-square flex items-center justify-center rounded-lg text-[11px] font-bold hover:scale-110 transition-all cursor-default ${cls} ${isToday ? 'ring-2 ring-[#001736] scale-110' : ''}`}>{d}</div>);
                                                    }
                                                    return days;
                                                })()}
                                            </div>
                                            <div className="mt-5 flex flex-wrap gap-3 text-[9px] font-bold uppercase tracking-widest justify-center">
                                                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>Present</div>
                                                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>Absent</div>
                                                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>Late</div>
                                                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>Leave</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Matrix Override Modal */}
            {showAdjustmentModal && selectedRecord && (
                <div className="fixed inset-0 bg-[#001736]/90 backdrop-blur-md z-100 flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-white/20 max-h-[95vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="bg-[#001736] p-6 md:p-10 text-white relative text-left shrink-0">
                            <h3 className="text-3xl font-black uppercase text-white! tracking-tight leading-none italic">Edit <span className="text-amber-400">Attendance</span></h3>
                            <p className="text-white text-[10px] font-bold uppercase tracking-[0.3em] mt-4 italic truncate">Target: {selectedRecord.student_name || selectedRecord.full_name}</p>
                            <button onClick={() => setShowAdjustmentModal(false)} className="absolute top-6 md:top-10 right-6 md:right-10 p-3 bg-white/10 hover:bg-rose-500 rounded-xl transition-all border border-white/10">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body (Scrollable) */}
                        <div className="overflow-y-auto custom-scrollbar">
                            <form onSubmit={handleAdjustmentSubmit} className="p-6 md:p-10 space-y-8 text-left">
                                <div className="space-y-4">
                                    <label className="text-[11px] font-bold text-black uppercase tracking-widest ml-2">Presence Validation</label>
                                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                                        {['present', 'absent', 'late', 'half-day'].map((status) => (
                                            <button
                                                key={status}
                                                type="button"
                                                onClick={() => setAdjustmentData({ ...adjustmentData, status })}
                                                className={` mt-2 py-2 md:py-3 rounded-xl font-bold text-[11px] uppercase tracking-widest border border-black transition-all active:scale-95 ${adjustmentData.status === status
                                                    ? 'bg-[#001736] border-[#001736] text-white shadow-xl'
                                                    : 'bg-white border-black text-black hover:border-[#001736] hover:text-[#001736]'
                                                    }`}
                                            >
                                                {status}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Check-In / Check-Out Time — Admin & Principal Only, Staff Records Only */}
                                {canEditTime && activeType === 'staff' && (
                                    <div className="space-y-4 bg-amber-50/60 border border-amber-200 rounded-xl p-5">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Clock className="w-4 h-4 text-amber-500" />
                                            <label className="text-[11px] font-black text-amber-700 uppercase tracking-widest">Override In / Out Time</label>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Check-In Time</label>
                                                <div className="flex items-center gap-2 bg-white border border-black rounded-lg px-3 py-2.5">
                                                    <Clock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                                    <input
                                                        type="time"
                                                        value={adjustmentData.check_in_time}
                                                        onChange={(e) => setAdjustmentData({ ...adjustmentData, check_in_time: e.target.value })}
                                                        className="w-full bg-transparent text-[12px] font-black text-[#001736] outline-none cursor-pointer"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Check-Out Time</label>
                                                <div className="flex items-center gap-2 bg-white border border-black rounded-lg px-3 py-2.5">
                                                    <Clock className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                                    <input
                                                        type="time"
                                                        value={adjustmentData.check_out_time}
                                                        onChange={(e) => setAdjustmentData({ ...adjustmentData, check_out_time: e.target.value })}
                                                        className="w-full bg-transparent text-[12px] font-black text-[#001736] outline-none cursor-pointer"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-[9px] font-bold text-amber-600 uppercase tracking-wider">⚠ Admin Override — Time will be saved to the attendance registry</p>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <label className="text-[11px] font-bold text-black uppercase tracking-widest ml-2">Audit Documentation</label>
                                    <textarea
                                        value={adjustmentData.remarks}
                                        onChange={(e) => setAdjustmentData({ ...adjustmentData, remarks: e.target.value })}
                                        className="w-full bg-slate-50 border border-black rounded-xl p-5 md:p-6 text-[12px] font-bold text-[#001736] outline-none focus:bg-white focus:border-indigo-400 transition-all min-h-[120px] md:min-h-[100px] uppercase placeholder:text-gray-400"
                                        placeholder="ENTER ADMINISTRATIVE REMARKS..."
                                    />
                                </div>

                                <button type="submit" className="w-full py-3 md:py-4 bg-[#001736] text-white rounded-xl font-bold text-[12px] uppercase tracking-[0.4em] shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-4 active:scale-[0.98] group">
                                    Save Changes <Zap className="w-4 h-4 text-amber-400 opacity-40 group-hover:scale-125 transition-transform" />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatusMetric = ({ label, value, iconComponent, color, active, onClick }) => {
    const Icon = iconComponent;

    const colorMap = {
        indigo: { border: 'border-indigo-600', bg: 'bg-indigo-50/50', iconBg: 'bg-indigo-600', text: 'text-indigo-900', ring: 'ring-indigo-500/10' },
        emerald: { border: 'border-emerald-600', bg: 'bg-emerald-50/50', iconBg: 'bg-emerald-600', text: 'text-emerald-900', ring: 'ring-emerald-500/10' },
        rose: { border: 'border-rose-600', bg: 'bg-rose-50/50', iconBg: 'bg-rose-600', text: 'text-rose-900', ring: 'ring-rose-500/10' },
        amber: { border: 'border-amber-600', bg: 'bg-amber-50/50', iconBg: 'bg-amber-600', text: 'text-amber-900', ring: 'ring-amber-500/10' },
    };

    const theme = colorMap[color] || colorMap.indigo;

    return (
        <div
            onClick={onClick}
            role={onClick ? "button" : "presentation"}
            tabIndex={onClick ? 0 : -1}
            className={`p-4 lg:p-6 rounded-2xl border-l-4 transition-all duration-300 group hover:shadow-xl ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''} text-left flex items-center justify-between gap-3 lg:gap-5 shadow-sm overflow-hidden
        ${theme.border} ${theme.bg} ${active ? `ring-2 ${theme.ring}` : ''}`}
        >
            <div className="flex-1 min-w-0">
                <p className={`text-[8px] lg:text-[10px] font-black uppercase tracking-[0.2em] mb-1 lg:mb-1.5 opacity-60 truncate ${theme.text}`}>{label}</p>
                <h3 className={`text-xl lg:text-4xl font-black tracking-tighter leading-none truncate ${theme.text}`}>{value || 0}</h3>
            </div>
            <div className={`w-10 h-10 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl ${theme.iconBg} flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform border border-white/20 shrink-0`}>
                <Icon className="w-4 h-4 lg:w-6 lg:h-6 text-white" />
            </div>
        </div>
    );
};

export default Attendance;
