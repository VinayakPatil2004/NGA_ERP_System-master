import React, { useEffect, useState, useCallback } from "react";
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  ShieldCheck,
  ClipboardCheck,
  ArrowRight,
  LayoutGrid,
  RefreshCw
} from "lucide-react";
import { toast } from "react-toastify";
import ModuleHeader from "../../../admcomponents/ModuleHeader";
import DataTable from "../../../admcomponents/DataTable";

// Service Layer Imports
import { 
  getClassrooms, 
  getStudentAttendance, 
  markStudentAttendance, 
  lockStudentAttendance
} from "../../../../services/attendanceAPI";
import { getTeacherProfile } from "../../../../services/teacherAPI";
import { useAcademicYear } from "../../../../context/AcademicYearContext";

/**
 * Attendance - Teacher Registry Management Console
 * Refined to the 'Simplified Premium' aesthetic with rounded-2xl and 1px borders.
 */
const Attendance = ({ toggleSidebar }) => {
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA')); // YYYY-MM-DD local
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAdmin, setIsAdmin] = useState(false);
  const { selectedYear: activeYear } = useAcademicYear();

  // Derived Permissions - Higher Security
  const currentClass = classrooms.find(c => (c.classroom_id || c.id) === selectedClassId);
  const isCurrentClassTeacher = currentClass?.is_class_teacher === 1 || currentClass?.is_class_teacher === true;
  const canEdit = isAdmin || isCurrentClassTeacher;

  // 1. Initial Context Fetch
  useEffect(() => {
    const init = async () => {
      if (!activeYear?.id) return;
      try {
        setLoading(true);
        const currentUser = JSON.parse(localStorage.getItem('user')) || {};
        const adminStatus = currentUser.role === 'admin' || currentUser.role === 'principal' || currentUser.role === 'HR';
        setIsAdmin(adminStatus);

        const [classRes] = await Promise.all([
          adminStatus ? getClassrooms(activeYear?.id) : getTeacherProfile(activeYear?.id)
        ]);

        const classes = adminStatus ? classRes : (classRes.classes || []);
        setClassrooms(classes);
        
        // Institutional Logic: Pick the class where they are 'Class Teacher' as default
        if (classes.length > 0) {
          const primaryClass = classes.find(c => c.is_class_teacher === 1 || c.is_class_teacher === true) || classes[0];
          setSelectedClassId(primaryClass.classroom_id || primaryClass.id);
        }
      } catch (err) {
        console.error("Context Error:", err);
        toast.error("Failed to synchronize academic context");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [activeYear?.id]);

  // 2. Fetch Students
  const fetchStudents = useCallback(async () => {
    if (!selectedClassId || !activeYear?.id) return;
    try {
      setLoading(true);
      const data = await getStudentAttendance({ 
        classroom_id: selectedClassId, 
        date: selectedDate,
        academic_year_id: activeYear?.id
      });
      setStudents(data);
    } catch (err) {
      console.error("Fetch Error:", err);
      toast.error("Unable to fetch student list");
    } finally {
      setLoading(false);
    }
  }, [selectedClassId, selectedDate, activeYear?.id]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // 3. Mark Status
  const markStatus = (studentId, status) => {
    if (!canEdit) {
      toast.error("Access Prohibited: Class In-Charge ONLY");
      return;
    }
    if (isLocked && !isAdmin) {
      toast.warning("Registry is sealed. Access Denied.");
      return;
    }
    setStudents(prev => prev.map(s => s.student_id === studentId ? { ...s, status } : s));
  };

  // 4. Finalize
  const handleFinalize = async () => {
    if (!canEdit) return toast.error("Unauthorized Operation");
    try {
      setSaving(true);
      const payload = {
        classroom_id: selectedClassId,
        date: selectedDate,
        academic_year_id: activeYear?.id,
        attendance_data: students.map(s => ({
          student_id: s.student_id,
          status: s.status === 'not marked' ? 'absent' : s.status,
          remarks: s.remarks || ''
        }))
      };

      await markStudentAttendance(payload);
      toast.success("Institutional records updated successfully");
      fetchStudents();
    } catch (err) {
      console.error("Finalize Error:", err);
      toast.error(err.response?.data?.error || "Operation failed");
    } finally {
      setSaving(false);
    }
  };

  // 5. Lock
  const handleLock = async () => {
    if (!canEdit) return toast.error("Unauthorized Operation");
    if (!isAdmin && isLocked) return toast.error("Registry is sealed. Manual override required.");
    if (!window.confirm("Are you sure you want to lock this register? You will NOT be able to edit it afterward!")) return;
    try {
      setSaving(true);
      await lockStudentAttendance({
        classroom_id: selectedClassId,
        date: selectedDate
      });
      toast.success("Attendance register securely locked");
      fetchStudents();
    } catch (err) {
      console.error("Lock Error:", err);
      toast.error(err.response?.data?.error || "Failed to lock the register");
    } finally {
      setSaving(false);
    }
  };

  const isLocked = students.length > 0 && students[0].is_locked === 1;

  const filteredStudents = students.filter(s => {
    const matchesStatus = statusFilter === 'all' ? true : s.status === statusFilter;
    return matchesStatus;
  });

  const stats = {
    total: students.length,
    present: students.filter(s => s.status === 'present').length,
    absent: students.filter(s => s.status === 'absent').length,
    late: students.filter(s => s.status === 'late').length
  };

  return (
    <div className="p-4 lg:p-8 bg-bg-base min-h-screen animate-in fade-in duration-500 font-sans text-left">

      {/* 1. Global Attendance Header */}
      <ModuleHeader
        title={isAdmin ? "Academic Presence Force" : "Attendance Desk"}
        subTitle="Institutional Occupancy Registry"
        icon={Users}
        toggleSidebar={toggleSidebar}
      >
        <div className="flex flex-nowrap items-center gap-4">
          <div className="flex items-center bg-white border border-white/10 px-5 py-3 rounded-2xl shadow-xl group/cls hover:border-amber-400/30 transition-all">
            <LayoutGrid className="w-4 h-4 text-emerald-400 mr-3 group-hover/cls:scale-110 transition-transform" />
            <select
              className=" text-black text-[11px] font-black uppercase tracking-widest outline-none cursor-pointer"
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
              }}
            >
              {classrooms.map(cls => (
                <option key={cls.classroom_id || cls.id} value={cls.classroom_id || cls.id} className="bg-white text-black ">
                  {cls.class_name} {(!isAdmin && (cls.is_class_teacher === 1 || cls.is_class_teacher === true)) ? '(CT)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center bg-white border border-white/10 px-6 py-3.5 rounded-2xl shadow-xl group/date hover:border-amber-400/30 transition-all">
            <Calendar className="w-4 h-4 text-amber-400 mr-4 group-hover/date:scale-110 transition-transform opacity-70" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-black text-[12px] font-black uppercase tracking-[0.2em] outline-none cursor-pointer placeholder:text-white/20"
            />
          </div>

          <button
            onClick={fetchStudents}
            className="p-3 bg-white border border-white/10 rounded-2xl text-amber-400 hover:text-amber-300 transition-all shadow-xl active:rotate-180 duration-700"
            title="Synchronize Matrix"
          >
            <RefreshCw size={20} className="opacity-80" />
          </button>
        </div>
      </ModuleHeader>

      {/* 2. Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 mt-6">
        <StatusMetric label="Total Student" value={stats.total} iconComponent={Users} color="indigo" active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} />
        <StatusMetric label="Present Today" value={stats.present} iconComponent={CheckCircle} color="emerald" active={statusFilter === 'present'} onClick={() => setStatusFilter('present')} />
        <StatusMetric label="Absent Today" value={stats.absent} iconComponent={XCircle} color="rose" active={statusFilter === 'absent'} onClick={() => setStatusFilter('absent')} />
        <StatusMetric label="Late Today" value={stats.late} iconComponent={Clock} color="amber" active={statusFilter === 'late'} onClick={() => setStatusFilter('late')} />
      </div>

      {/* 3. Registry Console */}
      <DataTable
        headers={[
          { label: "Roll No.", className: "w-[150px]" },
          { label: "Student Name" },
          { label: "Classroom", className: "w-[160px]" },
          { label: "Status", className: "text-center w-[380px]" }
        ]}
        columnCount={4}
        loading={loading}
        emptyMessage="Zero Data Points Detected"
        footer={
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 py-2">
            <div className="flex items-center gap-5">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${isLocked ? 'bg-rose-50 border-rose-200 text-rose-500' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-1">Security Integrity</p>
                <p className={`text-[12px] font-bold uppercase tracking-tight ${isLocked ? 'text-rose-500 shadow-sm' : 'text-emerald-600'}`}>
                  {isLocked ? 'Attendance Locked (Finalized)' : 'Open for Updates'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {(!isLocked || isAdmin) && canEdit && (
                <>
                   <button
                    onClick={handleFinalize}
                    disabled={saving || (students.length === 0)}
                    className="px-8 py-4 bg-primary text-white rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-xl hover:bg-black transition-all flex items-center gap-3 active:scale-95 disabled:opacity-40"
                  >
                    {saving ? 'Saving...' : 'Save Attendance'}
                    <ArrowRight className="w-4 h-4 opacity-40" />
                  </button>
                  {!isLocked && (
                    <button
                      onClick={handleLock}
                      disabled={saving || students.length === 0}
                      className="px-8 py-4 bg-white border border-rose-200 text-rose-500 rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-sm hover:bg-rose-500 hover:text-white transition-all active:scale-95 disabled:opacity-40"
                    >
                      Finalize & Lock
                    </button>
                  )}
                </>
              )}
              {isLocked && !isAdmin && (
                <div className="px-10 py-4 bg-slate-50 border border-slate-200 text-slate-400 rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-inner opacity-60">
                  Permanently Sealed Console
                </div>
              )}
            </div>
          </div>
        }
      >
        {filteredStudents.map((s) => (
          <tr key={s.student_id} className="hover:bg-slate-50/50 transition-colors group border-b border-black/10 last:border-b-0">
            <td className="px-8 py-6 border-r  border-b  border-black">
              <span className="text-[12px] font-bold text-primary bg-slate-50/50 px-4 py-2 rounded-lg border border-black shadow-sm whitespace-nowrap">
                {s.roll_number?.toString().padStart(3, "0") || "---"}
              </span>
            </td>
            <td className="px-8 py-6 border-r border-b border-black">
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-black text-sm border border-black shadow-sm transition-all duration-500 group-hover:scale-110 overflow-hidden ${s.status === 'present' ? 'bg-emerald-500' :
                  s.status === 'absent' ? 'bg-rose-500' :
                    s.status === 'late' ? 'bg-amber-400 text-[#001736]' : 'bg-slate-100 text-black'
                  }`}>
                  {s.student_photo ? (
                    <img 
                      src={s.student_photo.startsWith('data:') ? s.student_photo : s.student_photo} 
                      alt="" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    s.student_name.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <p className="text-[14px] font-bold text-primary tracking-tight uppercase leading-none">{s.student_name}</p>
                  <p className="text-[9px] font-bold text-black uppercase tracking-widest mt-2">ID: {s.student_id_no}</p>
                </div>
              </div>
            </td>
            <td className="px-8 py-6 border-r border-b border-black">
              <span className="px-4 py-3 bg-slate-50 text-primary text-[12px] font-bold rounded-lg border border-black shadow-sm uppercase">
                {s.class_name}
              </span>
            </td>
            <td className="px-8 py-6 border-b border-black">
              <div className="flex justify-center gap-3">
                {!canEdit ? (
                  <span className={`text-[11px] font-black uppercase tracking-widest px-8 py-3 rounded-xl border border-black shadow-sm flex items-center justify-center min-w-[140px]
                    ${s.status === 'present' ? 'bg-emerald-500 text-white' : 
                      s.status === 'absent' ? 'bg-rose-500 text-white' : 
                      s.status === 'late' ? 'bg-amber-400 text-[#001736]' : 'bg-slate-50 text-slate-400'}`}>
                    {s.status === 'present' ? 'Present' : s.status === 'absent' ? 'Absent' : s.status === 'late' ? 'Delayed' : 'Not Marked'}
                  </span>
                ) : (
                  <>
                    <AttendanceButton
                      label="Present"
                      active={s.status === 'present'}
                      isLocked={isLocked && !isAdmin}
                      color="bg-emerald-500"
                      hoverColor="hover:bg-emerald-50"
                      onClick={() => markStatus(s.student_id, 'present')}
                    />
                    <AttendanceButton
                      label="Absent"
                      active={s.status === 'absent'}
                      isLocked={isLocked && !isAdmin}
                      color="bg-rose-500"
                      hoverColor="hover:bg-rose-50"
                      onClick={() => markStatus(s.student_id, 'absent')}
                    />
                    <AttendanceButton
                      label="Delayed"
                      active={s.status === 'late'}
                      isLocked={isLocked && !isAdmin}
                      color="bg-amber-400 text-primary"
                      hoverColor="hover:bg-amber-50"
                      onClick={() => markStatus(s.student_id, 'late')}
                    />
                  </>
                )}
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
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
      className={`p-6 rounded-2xl border-l-4 transition-all duration-300 group hover:shadow-xl active:scale-[0.98] text-left flex items-center justify-between gap-5 shadow-sm overflow-hidden outline-none
      ${theme.border} ${theme.bg} ${active ? `ring-2 ${theme.ring}` : ''}`}
    >
      <div className="flex-1 overflow-hidden">
        <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1.5 opacity-60 truncate ${theme.text}`}>{label}</p>
        <h3 className={`text-4xl font-black tracking-tighter leading-none truncate ${theme.text}`}>{value || 0}</h3>
        {/* <p className={`text-[9px] font-bold uppercase tracking-widest mt-2 opacity-40 ${theme.text}`}>Personnel Enrolled</p> */}
      </div>
      <div className={`w-14 h-14 rounded-2xl ${theme.iconBg} flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform border border-white/20 shrink-0`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </button>
  );
};

const AttendanceButton = ({ label, active, isLocked, color, hoverColor, onClick }) => (
  <button
    disabled={isLocked}
    onClick={onClick}
    className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border shadow-sm ${isLocked ? (active ? `${color} text-white border-black/5` : 'bg-slate-50 text-slate-200 border-slate-100 shadow-none')
      : (active ? `${color} text-white border-black/10 scale-[1.02] shadow-md` : `bg-white text-primary border-slate-200 ${hoverColor} active:scale-95`)
      }`}
  >
    {label}
  </button>
);

export default Attendance;