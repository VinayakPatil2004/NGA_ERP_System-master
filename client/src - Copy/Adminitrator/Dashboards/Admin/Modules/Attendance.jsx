import React, { useState, useEffect, useCallback } from 'react';
import {
    Calendar, Users, Search,
    RefreshCw, Edit3, Fingerprint,
    ShieldCheck, X, Zap, CheckCircle2, XCircle, Clock
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
    getActiveYear
} from '../../../../services/attendanceAPI';

/**
 * Attendance - Institutional Occupancy & Verification Matrix
 * Refined to the 'Simplified Premium' aesthetic with rounded-2xl and 1px borders.
 */
const Attendance = ({ toggleSidebar }) => {
    const [activeType, setActiveType] = useState('student');

    // Data State
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [classrooms, setClassrooms] = useState([]);
    const [records, setRecords] = useState([]);
    const [activeYear, setActiveYear] = useState(null);

    // Filter State
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedClass, setSelectedClass] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    // Modal State
    const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [adjustmentData, setAdjustmentData] = useState({ status: '', remarks: '' });

    // 2. Fetch Data
    const fetchData = useCallback(async () => {
        const token = localStorage.getItem('grace_erp_token');
        if (!token) return;

        setLoading(true);
        try {
            const [statsData, classroomData, currentYear] = await Promise.all([
                getAttendanceStats(selectedDate),
                getClassrooms(),
                getActiveYear()
            ]);
            setStats(statsData);
            setClassrooms(classroomData || []);
            setActiveYear(currentYear);

            if (activeType === 'student') {
                const studentData = await getStudentAttendance({
                    date: selectedDate,
                    classroom_id: selectedClass || null
                });
                setRecords(studentData || []);
            } else if (activeType === 'staff') {
                const staffData = await getStaffAttendance({ date: selectedDate });
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
    }, [selectedDate, selectedClass, activeType]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAdjustmentSubmit = async (e) => {
        e.preventDefault();
        try {
            await updateAttendanceRecord({
                id: selectedRecord.attendance_id || selectedRecord.student_id || selectedRecord.staff_id,
                type: activeType,
                status: adjustmentData.status,
                remarks: adjustmentData.remarks,
                date: selectedDate,
                academic_year_id: activeYear?.id
            });
            toast.success("Attendance adjusted successfully");
            setShowAdjustmentModal(false);
            fetchData();
        } catch (error) {
            console.error("Adjustment Error:", error);
            toast.error("Failed to sync matrix adjustment");
        }
    };

    const filteredRecords = records.filter(r => {
        const name = (r.student_name || r.full_name || '').toLowerCase();
        const id = (r.roll_number?.toString() || r.staff_id?.toString() || '').toLowerCase();
        const query = searchQuery.toLowerCase();
        return name.includes(query) || id.includes(query);
    });

    return (
        <div className="p-4 lg:p-8 bg-[#F8FAFC] min-h-screen font-sans text-left">

            {/* 1. Unified Module Header */}
            <ModuleHeader
                title="Attendance Desk"
                subTitle="Grace ERP Academic Registry"
                icon={Fingerprint}
                toggleSidebar={toggleSidebar}
                showSearch={true}
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                hideDesktopSearch={true}
            >
                <div className="flex items-center gap-1.5 lg:gap-4">
                    {/* Registry Date - Dark Institutional Style */}
                    <div className="flex items-center bg-white/5 border border-white/10 px-2 py-2 lg:px-4 lg:py-3 rounded-xl shadow-xl group/date hover:border-amber-400/50 transition-all max-w-[130px] lg:max-w-none">
                        <Calendar className="w-3.5 h-3.5 text-amber-400 mr-2 lg:mr-4 group-hover/date:scale-110 transition-transform" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent text-white text-[9px] lg:text-[12px] font-black uppercase tracking-tight lg:tracking-[0.2em] outline-none cursor-pointer placeholder:text-white/20 w-full"
                        />
                    </div>

                    <button
                        onClick={fetchData}
                        className="p-2.5 lg:p-3 bg-white/5 border border-white/10 rounded-xl text-amber-400 hover:bg-white/10 hover:text-amber-300 transition-all shadow-xl active:rotate-180 duration-700 shrink-0"
                        title="Synchronize Global Registry"
                    >
                        <RefreshCw size={16} className="lg:w-[22px] lg:h-[22px] opacity-80" />
                    </button>
                </div>
            </ModuleHeader>

            {/* 2. Presence Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10 text-left">
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

            {/* 3. Monitoring Workspace */}
            <div className="space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
                    <div className="flex items-center gap-4">
                        <div className="flex bg-white/5 border border-black rounded-2xl p-1.5 shadow-2xl backdrop-blur-md">
                            <button
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeType === 'student'
                                    ? 'bg-green-400 text-[#001736] shadow-xl scale-105'
                                    : 'text-black hover:text-gray-500 hover:bg-white/5 font-bold'}`}
                                onClick={() => {
                                    if (activeType !== 'student') {
                                        setActiveType('student');
                                        setRecords([]);
                                    }
                                }}
                            >
                                Student
                            </button>
                            <button
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeType === 'staff'
                                    ? 'bg-green-400 text-[#001736] shadow-xl scale-105'
                                    : 'text-black hover:text-gray-500 hover:bg-white/5 font-bold'}`}
                                onClick={() => {
                                    if (activeType !== 'staff') {
                                        setActiveType('staff');
                                        setRecords([]);
                                    }
                                }}
                            >
                                Staff
                            </button>
                        </div>
                        {activeType === 'student' && (
                            <div className="relative">
                                <select
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                    className="pl-6 pr-10 py-3.5 bg-white border border-black rounded-xl font-bold text-[11px] uppercase tracking-widest outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all cursor-pointer shadow-sm min-w-[240px] appearance-none text-[#001736]"
                                >
                                    <option value="">All Students</option>
                                    {classrooms.map(c => (
                                        <option key={c.id} value={c.id}>{c.class_name} - {c.section}</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                                    <Edit3 size={14} />
                                </div>
                            </div>
                        )}

                        {/* 2. Registration Search Bar */}


                        <div className="px-6 py-3.5 bg-white border border-black rounded-xl text-[10px] font-bold text-slate-400 uppercase tracking-widest shadow-sm">
                            Identities Tracked: {filteredRecords.length}
                        </div>
                    </div>
                </div>

                <DataTable
                    headers={[
                        { label: activeType === 'student' ? "Student Name" : "Staff Name" },
                        ...(activeType === 'student' && !selectedClass ? [{ label: "Class/Section", className: "w-[180px]" }] : []),
                        { label: activeType === 'student' ? "Roll ID" : "Allocation", className: "w-[150px]" },
                        ...(activeType === 'student' ? [{ label: "Marked By", className: "w-[150px]" }] : []),
                        ...(activeType === 'staff' ? [
                            { label: "Check-In", className: "w-[120px]" },
                            { label: "Check-Out", className: "w-[120px]" }
                        ] : []),
                        { label: "Status", className: "w-[150px]" },
                        { label: "Override", className: "text-center w-[120px]" }
                    ]}
                    columnCount={activeType === 'staff' ? 7 : (activeType === 'student' && !selectedClass ? 7 : 6)}
                    loading={loading}
                    emptyMessage="No Presence Records Detected"
                >
                    {filteredRecords.map((record) => (
                        <tr key={record.attendance_id || record.student_id || record.staff_id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-8 py-2 border-r border-black">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 text-[#001736] flex items-center justify-center font-bold shadow-sm uppercase text-[12px] group-hover:bg-[#001736] group-hover:text-white transition-all">
                                        {(record.student_name || record.full_name)?.charAt(0)}
                                    </div>
                                    <span className="text-[14px] font-bold text-[#001736] uppercase tracking-tight truncate max-w-[200px]">
                                        {record.student_name || record.full_name}
                                    </span>
                                </div>
                            </td>
                            {activeType === 'student' && !selectedClass && (
                                <td className="px-8 py-2 border-r border-black italic">
                                    <span className="text-[11px] font-black text-[#001736] uppercase tracking-tighter opacity-100">
                                        {record.class_name} <span className="text-indigo-500">{record.section}</span>
                                    </span>
                                </td>
                            )}
                            <td className="px-8 py-2 border-r border-black">
                                <span className="text-[12px] font-bold text-black tracking-widest uppercase">
                                    {activeType === 'student' ? (record.roll_number || '---') : (record.department || 'UNCATEGORIZED')}
                                </span>
                            </td>
                            {activeType === 'staff' && (
                                <>
                                    <td className="px-8 py-2 border-r border-slate-100 font-mono text-[10px] font-bold text-[#001736]">{record.check_in_time || '--:--'}</td>
                                    <td className="px-8 py-2 border-r border-slate-100 font-mono text-[10px] font-bold text-[#001736]">{record.check_out_time || '--:--'}</td>
                                </>
                            )}
                            {activeType === 'student' && (
                                <td className="px-8 py-2 border-rborder-black">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                        <span className="text-[11px] font-bold text-black uppercase tracking-widest truncate max-w-[120px]">
                                            {record.teacher_name || 'Unassigned'}
                                        </span>
                                    </div>
                                </td>
                            )}
                            <td className="px-8 py-2 border-r border-black text-left">
                                <div className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-2 border border-black/5 ${record.status === 'present' ? 'bg-emerald-500 text-white shadow-sm' :
                                    record.status === 'absent' ? 'bg-rose-500 text-white shadow-sm' :
                                        record.status === 'half-day' ? 'bg-indigo-500 text-white shadow-sm' :
                                            'bg-amber-400 text-[#001736] shadow-sm'
                                    }`}>
                                    {record.status}
                                </div>
                            </td>

                            <td className="px-8 py-2 border-black text-center">
                                <button
                                    onClick={() => { setSelectedRecord(record); setAdjustmentData({ status: record.status, remarks: record.remarks || '' }); setShowAdjustmentModal(true); }}
                                    className="p-2 bg-white borderborder-black text-[#001736] rounded-xl hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                                >
                                    <Edit3 className="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </DataTable>
            </div>

            {/* Matrix Override Modal */}
            {showAdjustmentModal && selectedRecord && (
                <div className="fixed inset-0 bg-[#001736]/90 backdrop-blur-md z-100 flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-white/20 max-h-[95vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="bg-[#001736] p-6 md:p-10 text-white relative text-left shrink-0">
                            <h3 className="text-3xl font-black uppercase tracking-tight leading-none italic">Edit <span className="text-amber-400">Attendance</span></h3>
                            <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em] mt-4 italic truncate">Target: {selectedRecord.student_name || selectedRecord.full_name}</p>
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

const StatusMetric = (props) => {
    const { label, value, iconComponent: Icon, color, active, onClick } = props;

    const colorMap = {
        indigo: { border: 'border-indigo-600', bg: 'bg-indigo-50/50', iconBg: 'bg-indigo-600', text: 'text-indigo-900', ring: 'ring-indigo-500/10' },
        emerald: { border: 'border-emerald-600', bg: 'bg-emerald-50/50', iconBg: 'bg-emerald-600', text: 'text-emerald-900', ring: 'ring-emerald-500/10' },
        rose: { border: 'border-rose-600', bg: 'bg-rose-50/50', iconBg: 'bg-rose-600', text: 'text-rose-900', ring: 'ring-rose-500/10' },
        amber: { border: 'border-amber-600', bg: 'bg-amber-50/50', iconBg: 'bg-amber-600', text: 'text-amber-900', ring: 'ring-amber-500/10' },
    };

    const theme = colorMap[color] || colorMap.indigo;

    return (
        <button
            onClick={onClick}
            className={`p-4 lg:p-6 rounded-2xl border-l-4 transition-all duration-300 group hover:shadow-xl active:scale-[0.98] text-left flex items-center justify-between gap-3 lg:gap-5 shadow-sm
        ${theme.border} ${theme.bg} ${active ? `ring-2 ${theme.ring}` : ''}`}
        >
            <div className="flex-1">
                <p className={`text-[8px] lg:text-[10px] font-black uppercase tracking-[0.2em] mb-1 lg:mb-1.5 opacity-60 ${theme.text}`}>{label}</p>
                <h3 className={`text-xl lg:text-4xl font-black tracking-tighter leading-none ${theme.text}`}>{value || 0}</h3>
            </div>
            <div className={`w-10 h-10 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl ${theme.iconBg} flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform border border-white/20 shrink-0`}>
                <Icon className="w-4 h-4 lg:w-6 lg:h-6 text-white" />
            </div>
        </button>
    );
};

export default Attendance;
