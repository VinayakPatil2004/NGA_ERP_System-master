import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentProfile from '../Adminitrator/admpages/StudentProfile';
import NoticeBoard from '../Adminitrator/admcomponents/NoticeBoard';
import { useAuth } from '../context/AuthContext';
import * as ExamAPI from '../services/examAPI';
import * as AcademicYearAPI from '../services/academicYearAPI';
import { getStudentById, getStudentAttendanceRecords, getStudentFees, applyStudentLeave, getStudentLeaves } from '../services/studentAPI';
import { ROOT_URL } from '../services/API';
import logo from '../assets/nga-logo.png';
import { toast } from 'react-toastify';
import {
  LayoutDashboard, Calendar, ClipboardList, Award,
  BookOpen, TrendingUp, Bell, GraduationCap,
  Settings, LogOut, ChevronRight, ChevronLeft,
  ArrowRight, Download, Printer, Clock,
  AlertCircle, Search, Filter, Mail, User, FileCheck, Plus, X, CheckCircle2, Eye, FileText, Paperclip, Upload,
  Landmark, Banknote, MessageSquare, Trash2, Edit2, Menu, Lock
} from 'lucide-react';
import DataTable from "../Adminitrator/admcomponents/DataTable";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import InstitutionalTimetable from '../Adminitrator/admcomponents/InstitutionalTimetable';
import ExamTimetableManager from '../Adminitrator/Dashboards/Admin/Modules/ExamManagement/ExamTimetableManager';
import * as TimetableAPI from '../services/timetableAPI';
import * as assignmentAPI from '../services/assignmentAPI';
import { toRoman } from '../utils/romanUtils';
import certificateAPI from "../services/certificateAPI";
import libraryAPI from '../services/libraryAPI';
import API from '../services/API';
import { Library } from 'lucide-react';
import InstitutionalBonafide from '../Adminitrator/admcomponents/InstitutionalBonafide';
import StudentIdCard from '../components/StudentIdCard';

// Import Templates
import PrePrimaryReport from '../Adminitrator/Dashboards/Teacher/Modules/ExamResultTemplates/PrePrimaryReport';
import PrimaryReport1to2 from '../Adminitrator/Dashboards/Teacher/Modules/ExamResultTemplates/PrimaryReport1to2';
import PrimaryReport3to5 from '../Adminitrator/Dashboards/Teacher/Modules/ExamResultTemplates/PrimaryReport3to5';
import MiddleReport6to8 from '../Adminitrator/Dashboards/Teacher/Modules/ExamResultTemplates/MiddleReport6to8';

const PrePrimaryMatrixView = ({ marks }) => {
  const categories = [
    { name: 'Language - English', skills: ['english_reading', 'english_writing', 'english_phonics'] },
    { name: 'Mathematics', skills: ['maths_recognition', 'maths_counting', 'maths_writing'] },
    { name: 'Language - Hindi', skills: ['hindi_reading', 'hindi_writing', 'hindi_vocabulary'] },
    { name: 'Personality & Character', skills: ['social', 'etiquettes', 'hygiene', 'attention', 'creativity'] }
  ];

  const skillLabels = {
    english_reading: 'Reading', english_writing: 'Writing', english_phonics: 'Phonics',
    maths_recognition: 'Recognition', maths_counting: 'Counting', maths_writing: 'Writing',
    hindi_reading: 'Reading', hindi_writing: 'Writing', hindi_vocabulary: 'Vocabulary',
    social: 'Social Interaction', etiquettes: 'Etiquettes', hygiene: 'Personal Hygiene',
    attention: 'Attention', creativity: 'Creativity'
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((cat, idx) => (
          <div key={idx} className="bg-white border-2 border-green-500 rounded-3xl overflow-hidden shadow-sm">
            <div className="bg-green-600 p-3 px-6 flex items-center justify-between">
              <h4 className="text-white text-[10px] font-black uppercase tracking-widest">{cat.name}</h4>
              <div className="flex gap-8 text-white text-[9px] font-bold">
                <span>TERM 1</span>
                <span>TERM 2</span>
              </div>
            </div>
            <div className="divide-y divide-green-100">
              {cat.skills.map((skill, sIdx) => (
                <div key={sIdx} className="p-3 px-6 flex items-center justify-between hover:bg-green-50/50 transition-colors">
                  <span className="text-xs font-bold text-slate-600">{skillLabels[skill]}</span>
                  <div className="flex gap-12 text-sm font-black text-green-700">
                    <span className="w-8 text-center">{marks.t1?.[skill] || '-'}</span>
                    <span className="w-8 text-center">{marks.t2?.[skill] || '-'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* Attendance summary */}
      <div className="bg-green-50 p-6 rounded-3xl border-2 border-green-500 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white text-green-600 rounded-2xl shadow-sm border border-green-200">
            <Calendar size={24} />
          </div>
          <div>
            <h4 className="text-sm font-black text-green-800 uppercase tracking-widest leading-none">Attendance Summary</h4>
            <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mt-1">Institutional record verification</p>
          </div>
        </div>
        <div className="flex gap-12">
          <div className="text-center">
            <p className="text-[9px] font-bold text-green-600 uppercase tracking-widest">Term 1 Record</p>
            <p className="text-lg font-black text-green-800">{marks.t1?.attendance || '0'} <span className="text-green-300">/</span> {marks.t1?.total_days || '0'}</p>
          </div>
          <div className="text-center border-l border-green-200 pl-12">
            <p className="text-[9px] font-bold text-green-600 uppercase tracking-widest">Term 2 Record</p>
            <p className="text-lg font-black text-green-800">{marks.t2?.attendance || '0'} <span className="text-green-300">/</span> {marks.t2?.total_days || '0'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const StudentLeavesView = ({ user, selectedYear, academicYears = [], setSelectedYear }) => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    from_date: '',
    to_date: '',
    leave_type: 'Sick Leave',
    reason: ''
  });
  
  // Status Filter State
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchLeaves = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const data = await getStudentLeaves(user.id);
      setLeaves(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load leave records");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!leaveForm.from_date || !leaveForm.to_date || !leaveForm.leave_type || !leaveForm.reason.trim()) {
      toast.error("Please fill all required fields");
      return;
    }
    if (new Date(leaveForm.from_date) > new Date(leaveForm.to_date)) {
      toast.error("From Date cannot be after To Date");
      return;
    }

    try {
      setLeaveLoading(true);
      const start = new Date(leaveForm.from_date);
      const end = new Date(leaveForm.to_date);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      await applyStudentLeave(user.id, {
        student_id: user.id,
        academic_year_id: selectedYear,
        leave_type: leaveForm.leave_type,
        from_date: leaveForm.from_date,
        to_date: leaveForm.to_date,
        days: diffDays,
        reason: leaveForm.reason
      });
      toast.success("Leave application submitted successfully");
      setShowLeaveModal(false);
      setLeaveForm({ from_date: '', to_date: '', leave_type: 'Sick Leave', reason: '' });
      fetchLeaves();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to submit leave application");
    } finally {
      setLeaveLoading(false);
    }
  };

  const filteredLeaves = useMemo(() => {
    return leaves.filter(l => String(l.academic_year_id) === String(selectedYear));
  }, [leaves, selectedYear]);

  // Filter leaves based on selected status tab
  const finalLeaves = useMemo(() => {
    let list = filteredLeaves;
    if (statusFilter !== 'ALL') {
      list = list.filter(l => l.status.toUpperCase() === statusFilter);
    }
    return list;
  }, [filteredLeaves, statusFilter]);

  // Reset to page 1 on year change, list update, or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedYear, leaves, statusFilter]);

  // Dynamic counts for top cards based on active academic year
  const approvedLeaves = useMemo(() => {
    return filteredLeaves.filter(l => l.status === 'approved').reduce((acc, l) => acc + (l.days || 0), 0);
  }, [filteredLeaves]);

  const pendingLeaves = useMemo(() => {
    return filteredLeaves.filter(l => l.status === 'pending').length;
  }, [filteredLeaves]);

  const rejectedLeaves = useMemo(() => {
    return filteredLeaves.filter(l => l.status === 'rejected').length;
  }, [filteredLeaves]);

  const totalPages = Math.ceil(finalLeaves.length / itemsPerPage) || 1;

  const paginatedLeaves = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return finalLeaves.slice(startIndex, startIndex + itemsPerPage);
  }, [finalLeaves, currentPage]);

  const startIndex = finalLeaves.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, finalLeaves.length);

  const paginationFooter = (
    <div className="flex items-center justify-between border-t border-slate-200 pt-4">
      <div className="text-[10px] font-extrabold text-[#4F5B73] uppercase tracking-wider">
        SHOWING {startIndex} TO {endIndex} OF {finalLeaves.length} RECORDS
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-4 py-1.5 border border-gray-300 rounded text-[10px] font-black uppercase text-[#4F5B73] hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
        >
          PREV
        </button>
        <span className="text-[10px] font-black text-primary uppercase tracking-wider mx-2">
          PAGE {currentPage} OF {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-4 py-1.5 border border-gray-300 rounded text-[10px] font-black uppercase text-[#4F5B73] hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
        >
          NEXT
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-primary uppercase tracking-tight">Leave Application</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Manage and submit requests for absence</p>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          {academicYears.length > 0 && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-white border-2 border-primary text-primary font-black px-4 py-2.5 rounded-2xl text-xs outline-none shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
            >
              {academicYears.map(y => (
                <option key={y.id} value={y.id}>{y.year_name}</option>
              ))}
            </select>
          )}
          <button
            onClick={() => setShowLeaveModal(true)}
            className="px-6 py-3 bg-secondary text-primary rounded-2xl font-black text-xs shadow-lg shadow-secondary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> APPLY FOR LEAVE
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pending Requests */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="p-4 bg-amber-500 text-white rounded-xl shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending</p>
            <p className="text-2xl font-black text-primary mt-1">{pendingLeaves}</p>
          </div>
        </div>

        {/* Approved Days */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="p-4 bg-emerald-500 text-white rounded-xl shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Approved</p>
            <p className="text-2xl font-black text-primary mt-1">{approvedLeaves}</p>
          </div>
        </div>

        {/* Rejected Requests */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="p-4 bg-rose-500 text-white rounded-xl shrink-0">
            <X className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rejected</p>
            <p className="text-2xl font-black text-primary mt-1">{rejectedLeaves}</p>
          </div>
        </div>
      </div>

      {/* Leave Registry - Full Width DataTable */}
      <div className="bg-white p-4 sm:p-6 lg:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="font-black text-primary uppercase tracking-widest text-xs flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-500" /> Leave Application Registry
          </h3>
          {/* Status Filter Capsules */}
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200 w-fit shadow-inner">
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                  statusFilter === status
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <DataTable
          headers={[
            { label: "Leave Type", className: "min-w-[120px] text-left border border-black" },
            { label: "Duration", className: "min-w-[160px] text-left border border-black" },
            { label: "Days", className: "w-20 text-center border border-black" },
            { label: "Reason", className: "min-w-[200px] text-left border border-black" },
            { label: "Status", className: "w-28 text-center border border-black" }
          ]}
          columnCount={5}
          loading={loading}
          emptyMessage="No leave records found in your registry matching the selection."
          footer={paginationFooter}
        >
          {paginatedLeaves.length > 0 ? paginatedLeaves.map((leave, i) => (
            <tr key={i} className="hover:bg-bg-base/30 transition-colors group">
              <td className="p-4 border border-black text-left">
                <p className="text-[12px] font-black text-primary uppercase">{leave.leave_type}</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Applied: {new Date(leave.applied_at).toLocaleDateString()}</p>
              </td>
              <td className="p-4 border border-black text-left text-[11px] font-bold text-gray-500">
                <div className="flex items-center gap-2">
                  <span>{new Date(leave.from_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span className="text-slate-300">&rarr;</span>
                  <span>{new Date(leave.to_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </td>
              <td className="p-4 border border-black text-center text-[12px] font-black text-primary">
                {leave.days}
              </td>
              <td className="p-4 border border-black text-left">
                <p className="text-[11px] font-bold text-slate-650 leading-relaxed wrap-break-word max-w-[250px]">{leave.reason}</p>
                {leave.review_remarks && (
                  <p className="text-[9px] text-indigo-600 font-black mt-2 bg-indigo-50/50 p-1.5 rounded-lg border border-indigo-100/50">
                    Remarks: {leave.review_remarks}
                  </p>
                )}
              </td>
              <td className="p-4 border border-black text-center">
                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase flex items-center justify-center gap-1 w-full max-w-[100px] mx-auto border shadow-xs
                  ${leave.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                    leave.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      'bg-rose-50 text-rose-600 border-rose-100'
                  }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    leave.status === 'pending' ? 'bg-amber-500' :
                      leave.status === 'approved' ? 'bg-emerald-500' :
                        'bg-rose-500'
                  }`} />
                  {leave.status}
                </span>
              </td>
            </tr>
          )) : null}
        </DataTable>
      </div>

      {/* Leave Application Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 lg:p-12 animate-in fade-in zoom-in duration-300">
          <div className="absolute inset-0 bg-primary/60 backdrop-blur-sm" onClick={() => setShowLeaveModal(false)}></div>
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-bg-base/30">
              <div>
                <h3 className="text-2xl font-black text-primary uppercase tracking-tight">Apply Leave</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Submit request for institutional absence</p>
              </div>
              <button
                onClick={() => setShowLeaveModal(false)}
                className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all font-black text-primary"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-8 overflow-y-auto custom-scrollbar">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">From Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                      <input
                        type="date"
                        required
                        value={leaveForm.from_date}
                        onChange={(e) => setLeaveForm({ ...leaveForm, from_date: e.target.value })}
                        className="w-full p-4 pl-12 bg-bg-base border border-gray-200 rounded-2xl outline-none focus:border-secondary font-bold text-sm shadow-inner"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">To Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                      <input
                        type="date"
                        required
                        value={leaveForm.to_date}
                        onChange={(e) => setLeaveForm({ ...leaveForm, to_date: e.target.value })}
                        className="w-full p-4 pl-12 bg-bg-base border border-gray-200 rounded-2xl outline-none focus:border-secondary font-bold text-sm shadow-inner"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Leave Type</label>
                  <select
                    required
                    value={leaveForm.leave_type}
                    onChange={(e) => setLeaveForm({ ...leaveForm, leave_type: e.target.value })}
                    className="w-full p-4 bg-bg-base border border-gray-200 rounded-2xl outline-none focus:border-secondary font-bold text-sm shadow-inner appearance-none cursor-pointer"
                  >
                    <option value="Sick Leave">Medical/Sick Leave</option>
                    <option value="Casual Leave">Family Emergency/Event</option>
                    <option value="Medical Leave">Medical Leave</option>
                    <option value="Other">Personal Reasons</option>
                    <option value="Other">Religious Holiday</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Reason for Absence</label>
                  <textarea
                    rows="4"
                    required
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                    placeholder="Briefly describe the institutional reason..."
                    className="w-full p-6 bg-bg-base border border-gray-200 rounded-2xl outline-none focus:border-secondary font-medium text-sm shadow-inner"
                  ></textarea>
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowLeaveModal(false)}
                    className="flex-1 py-4 border border-gray-300 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-bg-base transition-all"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    disabled={leaveLoading}
                    className="flex-2 py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {leaveLoading ? "SUBMITTING..." : "SUBMIT REQUEST"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const menuItems = [
  { icon: LayoutDashboard, label: 'Overview' },
  { icon: Calendar, label: 'Timetable' },
  { icon: ClipboardList, label: 'Attendance' },
  { icon: MessageSquare, label: 'Leaves' },
  { icon: Award, label: 'Exam Results' },
  { icon: BookOpen, label: 'Assignments' },
  { icon: Library, label: 'Library' },
  { icon: Mail, label: 'Study Materials' },
  { icon: Bell, label: 'Notifications' },
  { icon: GraduationCap, label: 'Profile' },
  { icon: FileCheck, label: 'Certificates' },
  { icon: Landmark, label: 'Fees & Finance' },
  { icon: User, label: 'ID Card' },
];


const StudentDashboard = () => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/', { replace: true });
  };
  const [activeTab, setActiveTab] = useState('Overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [timetableType, setTimetableType] = useState('regular');
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [attendanceMonth, setAttendanceMonth] = useState(new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date()));
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [certReason, setCertReason] = useState('');
  const [certType, setCertType] = useState('bonafide');
  const [certLoading, setCertLoading] = useState(false);
  const [myCertRequests, setMyCertRequests] = useState([]);
  const [viewingAssignment, setViewingAssignment] = useState(null);
  const [submittingTask, setSubmittingTask] = useState(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submittingLoading, setSubmittingLoading] = useState(false);
  const [feeRecords, setFeeRecords] = useState(null);

  const [performanceData, setPerformanceData] = useState([]);
  const [coScholasticData, setCoScholasticData] = useState([]);
  const [prePrimaryMarks, setPrePrimaryMarks] = useState({ t1: {}, t2: {} });
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [studentProfile, setStudentProfile] = useState(null);
  const [timetableData, setTimetableData] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [libraryData, setLibraryData] = useState([]);
  const selectedYearName = useMemo(() => academicYears.find(y => String(y.id) === String(selectedYear))?.year_name || "Active Session", [academicYears, selectedYear]);
  const activeEnrollment = useMemo(() => {
    return studentProfile?.enrollments?.find(e => String(e.academic_year_id) === String(selectedYear))
      || studentProfile?.enrollments?.[0];
  }, [studentProfile, selectedYear]);
  const [ttSettings, setTtSettings] = useState({
    lecture_duration: 35,
    first_lecture_start: '08:15',
    recess_slots: [
      { label: 'Assembly', start: '08:05', end: '08:15', period: 'ASSEMBLY' },
      { label: 'Short Recess', start: '10:00', end: '10:10', period: 'SHORT_RECESS' },
      { label: 'Long Recess', start: '11:55', end: '12:15', period: 'LONG_RECESS' }
    ]
  });

  // --- Matrix Generation Logic ---
  const matrixLayout = useMemo(() => {
    const template = ['ASSEMBLY', 'I', 'II', 'III', 'SHORT_RECESS', 'IV', 'V', 'VI', 'LONG_RECESS', 'VII', 'VIII', 'IX'];
    const timings = {};
    let currentTime = ttSettings.first_lecture_start;

    template.forEach((p) => {
      const recess = ttSettings.recess_slots.find(r => r.period === p);
      if (recess) {
        timings[p] = { start: recess.start, end: recess.end };
        if (p !== 'ASSEMBLY') currentTime = recess.end;
      } else {
        const [h, m] = (currentTime || "08:15").split(':').map(Number);
        const start = currentTime;
        const duration = parseInt(ttSettings.lecture_duration) || 35;
        const endTimestamp = new Date(0, 0, 0, h, (m || 0) + duration);
        const endH = String(endTimestamp.getHours()).padStart(2, '0');
        const endM = String(endTimestamp.getMinutes()).padStart(2, '0');
        const end = `${endH}:${endM}`;
        timings[p] = { start, end };
        currentTime = end;
      }
    });
    return { template, timings };
  }, [ttSettings]);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [years, profile] = await Promise.all([
        AcademicYearAPI.getAllAcademicYears(),
        getStudentById(user.id)
      ]);
      setAcademicYears(years);
      setStudentProfile(profile);
      const active = years.find(y => y.is_active);
      if (active) setSelectedYear(active.id);
    } catch { toast.error("Failed to load dashboard data"); }
  }, [user]);

  const loadTimetableSettings = useCallback(async (yearId) => {
    try {
      const data = await TimetableAPI.getSettings(yearId);
      if (data) {
        setTtSettings(prev => ({
          ...prev,
          lecture_duration: data.lecture_duration || 35,
          first_lecture_start: data.first_lecture_start?.slice(0, 5) || '08:15',
          recess_slots: [
            { label: 'Assembly', start: data.school_start_time?.slice(0, 5) || '08:05', end: data.first_lecture_start?.slice(0, 5) || '08:15', period: 'ASSEMBLY' },
            { label: 'Short Recess', start: data.short_recess_start?.slice(0, 5) || '10:00', end: data.short_recess_end?.slice(0, 5) || '10:10', period: 'SHORT_RECESS' },
            { label: 'Long Recess', start: data.long_recess_start?.slice(0, 5) || '11:55', end: data.long_recess_end?.slice(0, 5) || '12:15', period: 'LONG_RECESS' }
          ]
        }));
      }
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    const init = async () => {
      await fetchData();
    };
    init();
  }, [fetchData]);

  const loadData = useCallback(async () => {
    if (selectedYear && activeEnrollment?.classroom_id) {
      try {
        const isPrePrimary = studentProfile?.current_grade?.toLowerCase().match(/(nursery|junior|senior|kg|jr|sr)/);
        const [perf, co, tt, assign, library, attend, ppT1, ppT2, allExams] = await Promise.all([
          ExamAPI.getStudentPerformance(user.id, selectedYear),
          ExamAPI.getCoScholastic(user.id, selectedYear),
          TimetableAPI.getClassTimetable(activeEnrollment.classroom_id, selectedYear),
          assignmentAPI.getClassroomAssignments(activeEnrollment.classroom_id),
          libraryAPI.getTransactions(),
          getStudentAttendanceRecords(user.id, selectedYear),
          isPrePrimary ? ExamAPI.getPrePrimaryMarks(user.id, 'I Term') : Promise.resolve(null),
          isPrePrimary ? ExamAPI.getPrePrimaryMarks(user.id, 'II Term') : Promise.resolve(null),
          ExamAPI.getAllExams(selectedYear)
        ]);
        setPerformanceData(perf);
        setExams(allExams || []);
        setCoScholasticData(co);
        setTimetableData(tt);
        setAssignments(assign || []);
        setAttendanceRecords(attend || []);
        if (isPrePrimary) {
          setPrePrimaryMarks({ t1: ppT1 || {}, t2: ppT2 || {} });
        }
        // 5. Library Transactions
        const studentIdNo = studentProfile.student_id_no;
        const myBooks = (library || []).filter(txn => String(txn.member_id) === String(studentIdNo));
        setLibraryData(myBooks);

        await loadTimetableSettings(selectedYear);
      } catch (err) {
        console.error("Dashboard data load error:", err);
      }
    }
  }, [selectedYear, user, studentProfile, loadTimetableSettings, activeEnrollment]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    if (!submittingTask) return;

    try {
      setSubmittingLoading(true);
      const formData = new FormData();
      formData.append('assignment_id', submittingTask.id);
      formData.append('submission_text', submissionText);
      if (submissionFile) {
        formData.append('file', submissionFile);
      }

      await assignmentAPI.submitAssignment(formData);
      toast.success("Assignment Submitted Successfully!");

      // Reset and close
      setSubmittingTask(null);
      setSubmissionText('');
      setSubmissionFile(null);
      loadData(); // Refresh to show "Submitted" status
    } catch {
      toast.error("Failed to submit assignment");
    } finally {
      setSubmittingLoading(false);
    }
  };

  const fetchMyCertRequests = useCallback(async () => {
    try {
      const data = await certificateAPI.getMyRequests();
      // Since getMyRequests without cert_type returns all, we just use it
      setMyCertRequests(data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  }, []);

  const fetchFees = useCallback(async () => {
    if (!studentProfile?.id || !selectedYear) return;
    try {
      const data = await getStudentFees(studentProfile.id, selectedYear);
      setFeeRecords(data);
    } catch (error) {
      console.error("Failed to fetch fees:", error);
    }
  }, [studentProfile, selectedYear]);

  const handlePrintReceipt = (fee) => {
    const WinPrint = window.open('', '', 'width=1000,height=800');

    const numberToWords = (num) => {
      const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
      const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
      if ((num = num.toString()).length > 9) return 'Overflow';
      let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
      if (!n) return '';
      let str = '';
      str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
      str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
      str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
      str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
      str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Only' : 'Only';
      return str;
    };

    const receiptStyle = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        @page { size: A4; margin: 1cm; }
        body { font-family: 'Inter', sans-serif; color: #000; margin: 0; padding: 0; line-height: 1.4; }
        .receipt-container { border: 1px solid #000; padding: 0; width: 100%; margin: 0 auto; position: relative; box-sizing: border-box; }
        
        .header { display: flex; align-items: center; padding: 15px; gap: 20px; border-bottom: 1px solid #000; }
        .logo { width: 80px; height: 80px; object-fit: contain; }
        .school-info { flex: 1; text-align: center; }
        .school-name { font-size: 28px; font-weight: 900; margin: 0; letter-spacing: -1px; }
        .school-address { font-size: 11px; font-weight: 700; margin: 5px 0; }
        
        .receipt-title { background: #f1f5f9; text-align: center; font-weight: 900; border-left: 1px solid #000; font-size: 14px; padding: 8px; border-bottom: 1px solid #000; text-transform: uppercase; letter-spacing: 2px; }
        
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid #000; }
        .info-col { padding: 10px 15px; font-size: 11px; display: flex; flex-direction: column; gap: 5px; }
        .info-row { display: flex; }
        .info-label { width: 100px; font-weight: 900; text-transform: uppercase; color: #475569; }
        .info-value { font-weight: 700; color: #000; }
        
        .fee-table { width: 100%; border-collapse: collapse; }
        .fee-table th { border-bottom: 1px solid #000; border-right: 1px solid #000; padding: 8px; font-size: 11px; font-weight: 900; text-transform: uppercase; text-align: left; background: #fff; }
        .fee-table td { border-bottom: 1px solid #000; border-right: 1px solid #000; border-left: 1px solid #000; padding: 10px 8px; font-size: 11px; font-weight: 700; }
        .fee-table th:last-child, .fee-table td:last-child { border-right: none; }
        .fee-table td:nth-child(3), .fee-table td:nth-child(4), .fee-table td:nth-child(5) { text-align: center; border-bottom: 1px solid #000; }
        
        .pay-mode-title { background: #f1f5f9;border-left: 1px solid #000; text-align: center; font-weight: 900; font-size: 11px; padding: 6px; border-bottom: 1px solid #000; text-transform: uppercase; }
        .pay-info { display: flex; justify-content: space-between; padding: 10px 15px; font-size: 11px; border-bottom: 1px solid #000; }
        
        .summary { padding: 10px 15px; border-bottom: 1px solid #000; }
        .summary-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px; }
        .summary-label { font-weight: 900; text-transform: uppercase; }
        .summary-value { font-weight: 900; }
        
        .in-words { padding: 10px 15px; font-size: 10px; font-weight: 700; border-bottom: 1px solid #000; }
        
        .note { font-size: 9px; font-weight: 700; color: #475569; padding: 20px 15px 10px; text-align: center; width: 100%; }
        
        .footer { padding: 30px 15px; display: flex; justify-content: space-between; align-items: flex-end; }
        .sig-box { text-align: center; width: 150px; }
        .sig-line { border-top: 1px solid #000; margin-bottom: 5px; }
        .sig-text { font-size: 10px; font-weight: 900; text-transform: uppercase; }
      </style>
    `;

    const termLabel = fee.fee_type ? fee.fee_type.toUpperCase() : 'ANNUAL FEE';
    const totalAmountDue = feeRecords?.bill_total || fee.total_payable || 0;
    const paidAmount = Number(fee.paid_amount || 0);
    const pendingBalance = feeRecords ? Math.max(0, feeRecords.bill_total - feeRecords.paid_total) : Math.max(0, totalAmountDue - paidAmount);

    WinPrint.document.write(`
      <html>
        <head>
          <title>Fee Receipt - ${studentProfile?.student_name || 'Student'}</title>
          ${receiptStyle}
        </head>
        <body>
          <div class="receipt-container">
            <div class="header">
              <img src="${logo}" class="logo" />
              <div class="school-info">
                <h1 class="school-name">NEW GRACE ACADEMY</h1>
                <p class="school-address">Ekta Nagar, Near Ankay Housing Society, Borgad, Mhasrul, Nashik-422 004. MH</p>
                <p class="school-address" style="margin-top: 0;"><strong>Contact:</strong> +91 91684 42244 | <strong>Website:</strong> www.newgraceacademy.in</p>
              </div>
            </div>
            
            <div class="receipt-title">FEE RECEIPT (${termLabel})</div>
            
            <div class="info-grid">
              <div class="info-col">
                <div class="info-row"><span class="info-label">Receipt No</span><span class="info-value">: ${fee.receipt_no || 'N/A'}</span></div>
                <div class="info-row"><span class="info-label">Adm No</span><span class="info-value">: ${studentProfile?.student_id_no || '---'}</span></div>
                <div class="info-row"><span class="info-label">Name</span><span class="info-value">: ${(studentProfile?.student_name || '---').toUpperCase()}</span></div>
                <div class="info-row"><span class="info-label">Installment</span><span class="info-value">: ${termLabel}</span></div>
              </div>
              <div class="info-col">
                <div class="info-row"><span class="info-label">Date</span><span class="info-value">: ${new Date(fee.payment_date).toLocaleDateString('en-GB')}</span></div>
                <div class="info-row"><span class="info-label">Session</span><span class="info-value">: ${selectedYearName}</span></div>
                <div class="info-row"><span class="info-label">Class</span><span class="info-value">: ${studentProfile?.current_grade || studentProfile?.grade || '---'}</span></div>
              </div>
            </div>
            
            <table class="fee-table">
              <thead>
                <tr>
                  <th style="width: 50px;">Sl.No</th>
                  <th>Description</th>
                  <th style="width: 100px;">Due</th>
                  <th style="width: 80px;">Con</th>
                  <th style="width: 100px;">Paid</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="text-align: center;">1</td>
                  <td>
                    <div>Tuition & Term Dues (2026-27)</div>
                    ${feeRecords?.transport_fee > 0 ? '<div>Other Fee & Transport Fee</div>' : '<div>Other Annual Fee</div>'}
                  </td>
                  <td>${totalAmountDue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td>0.00</td>
                  <td>${paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>
            
            <div class="pay-mode-title">PAY MODE INFORMATION</div>
            <div class="pay-info">
              <div><strong>Pay Mode:</strong> ${(fee.payment_method || 'CASH').toUpperCase()}</div>
              <div><strong>Date:</strong> ${new Date(fee.payment_date).toLocaleDateString('en-GB')}</div>
              <div><strong>Ref/Chq No:</strong> ${fee.cheque_no || fee.cheque_number || fee.transaction_id || '---'}</div>
              <div><strong>Bank:</strong> ${fee.bank_name || '---'}</div>
            </div>
            
            <div class="summary">
              <div class="summary-row">
                <span class="summary-label">Total Amount Paid</span>
                <span class="summary-value">₹ ${paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div class="summary-row" style="color: #e11d48;">
                <span class="summary-label">Pending Balance</span>
                <span class="summary-value">₹ ${pendingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
            
            <div class="in-words">
              TOTAL IN WORDS: ${numberToWords(Math.round(paidAmount)).toUpperCase()}
            </div>
            
            <div class="note">
              Note : System Generated Document. Valid Subject to Realization.
            </div>
            
            <div class="footer">
              <div class="sig-box">
                <div class="sig-line"></div>
                <div class="sig-text">Receiver Signature</div>
              </div>
              <div class="sig-box">
                <div class="sig-line"></div>
                <div class="sig-text">Principal Signature</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);

    WinPrint.document.close();
    WinPrint.focus();
    setTimeout(() => {
      WinPrint.print();
      WinPrint.close();
    }, 800);
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (activeTab === 'Certificates') fetchMyCertRequests();
    if (activeTab === 'Fees & Finance') fetchFees();
  }, [activeTab, loadData, fetchMyCertRequests, fetchFees]);

  const [editingCert, setEditingCert] = useState(null);

  const handleDeleteRequest = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this request?")) return;
    try {
      await API.delete(`/certificates/${id}`);
      toast.success("Request cancelled successfully");
      fetchMyCertRequests();
    } catch {
      toast.error("Failed to cancel request");
    }
  };

  const handleEditRequest = (req) => {
    setEditingCert(req);
    setCertType(req.cert_type);
    setCertReason(req.reason);
    setShowCertModal(true);
  };

  const handleRequestCert = async (e) => {
    e.preventDefault();
    try {
      setCertLoading(true);
      if (editingCert) {
        await API.put(`/certificates/${editingCert.id}`, {
          reason: certReason,
          cert_type: certType
        });
        toast.success("Request updated successfully");
      } else {
        await API.post('/certificates/request', {
          student_id: user.id,
          reason: certReason,
          cert_type: certType
        });
        toast.success(`${certType === 'bonafide' ? 'Bonafide' : 'LC'} request submitted successfully`);
      }
      setShowCertModal(false);
      setEditingCert(null);
      setCertReason('');
      fetchMyCertRequests();
    } catch (err) {
      toast.error(err.response?.data?.error || "Request failed");
    } finally {
      setCertLoading(false);
    }
  };

  const handleCertDownload = async (req) => {
    try {
      const response = await API.get(`/certificates/${req.id}/generate`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${req.cert_type}_Bonafide_${studentProfile.student_id_no}.pdf`);
      document.body.appendChild(link);
      link.click();
      toast.success("Document downloaded successfully");
      link.remove();
    } catch (err) {
      console.error("Download Error:", err);
      toast.error("Generation failed. Admin approval may be required.");
    }
  };

  const downloadReport = async (term) => {
    try {
      const blob = await ExamAPI.downloadReportCard(user.id, selectedYear, term);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ReportCard_Term${term}.pdf`;
      a.click();
    } catch (err) {
      console.error("Report Download Error:", err);
      toast.error("Failed to generate PDF");
    }
  };

  const generateTimetablePDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Header branding
      doc.setFillColor(0, 23, 54); // #001736 (Primary Navy)
      doc.rect(0, 0, 297, 35, 'F');

      doc.setTextColor(255, 182, 6); // #FFB606 (Gold/Secondary)
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("NEW GRACE ACADEMY", 15, 18);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("INSTITUTIONAL ACADEMIC TIMETABLE", 15, 27);
      
      const sessionText = selectedYearName;
      const gradeText = studentProfile?.current_grade ? `GRADE: ${toRoman(studentProfile.current_grade).toUpperCase()} (${activeEnrollment?.section || 'GENERAL'})` : 'GRADE LEDGER';
      doc.text(`${gradeText} | SESSION: ${sessionText}`, 282, 27, { align: 'right' });

      // Generate rows
      const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const periods = matrixLayout.template;
      
      const formatTimeRange = (timeStr) => {
        if (!timeStr) return "--:--";
        const parts = timeStr.split(':');
        if (parts.length < 2) return timeStr;
        let hours = parseInt(parts[0]);
        const minutes = parts[1];
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${hours}:${minutes} ${ampm}`;
      };

      const tableRows = periods.map((p) => {
        const recess = ttSettings.recess_slots.find(r => r.period === p);
        let timeLabel = "--:--";
        if (recess) {
          timeLabel = `${formatTimeRange(recess.start)} - ${formatTimeRange(recess.end)}`;
        } else {
          const timing = matrixLayout.timings[p];
          if (timing) {
            timeLabel = `${formatTimeRange(timing.start)} - ${formatTimeRange(timing.end)}`;
          }
        }

        const isFixedBreak = ['ASSEMBLY', 'SHORT_RECESS', 'LONG_RECESS', 'RECESS', 'BREAK'].includes(p.toUpperCase());
        if (isFixedBreak) {
          return [
            timeLabel,
            p.replace('_', ' '),
            { content: p.replace('_', ' '), colSpan: 6, styles: { halign: 'center', fontStyle: 'bold', fillColor: [240, 244, 248] } }
          ];
        }

        const row = [
          timeLabel,
          p
        ];

        dayOrder.forEach((day) => {
          const slot = timetableData.find(s => {
            const sPeriod = s.period_number?.toString().trim().toUpperCase();
            const pPeriod = p.toString().trim().toUpperCase();
            const sDay = s.day_of_week?.toString().trim().toLowerCase();
            const pDay = day.trim().toLowerCase();
            return sPeriod === pPeriod && sDay === pDay;
          });

          if (slot) {
            row.push(`${slot.subject_name}\n(${slot.teacher_name || 'Staff'})`);
          } else {
            row.push('-');
          }
        });

        return row;
      });

      autoTable(doc, {
        startY: 42,
        head: [['Time', 'Period', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']],
        body: tableRows,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 3,
          valign: 'middle',
          halign: 'center'
        },
        headStyles: {
          fillColor: [0, 23, 54],
          textColor: [255, 182, 6],
          fontStyle: 'bold',
          fontSize: 9
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250]
        }
      });

      // Save PDF
      doc.save(`Academic_Timetable_${studentProfile?.student_id_no || 'Grace'}.pdf`);
      toast.success("Timetable PDF downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate timetable PDF");
    }
  };

  const generateFullReportPDF = async () => {
    if (!studentProfile) {
      toast.error("Student profile not loaded");
      return;
    }

    // Redirect to specialized Pre-Primary Report if class matches
    const isPrePrimary = studentProfile.current_grade?.toLowerCase().match(/(nursery|junior|senior|kg|jr|sr)/);
    if (isPrePrimary) {
      return downloadReport("Full");
    }

    // Helper: Convert Image URL to Base64
    const getBase64FromUrl = (url) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = (err) => reject(err);
        img.src = url;
      });
    };

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let currentY = 15;

    // --- 0. Page Border ---
    doc.setDrawColor(0, 23, 54);
    doc.setLineWidth(0.5);
    doc.rect(5, 5, pageWidth - 10, pageHeight - 10);
    doc.setLineWidth(0.2);
    doc.rect(6.5, 6.5, pageWidth - 13, pageHeight - 13); // Double border effect

    const logoUrl = "/logo.png";

    // 1. Header (Logo on Left, Name Centered)
    try {
      const logoBase64 = await getBase64FromUrl(logoUrl);
      doc.addImage(logoBase64, 'PNG', 15, currentY, 24, 18);
    } catch (e) {
      console.error("Logo load failed", e);
    }

    doc.setTextColor(0, 23, 54); // Navy Blue
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("NEW GRACE ACADEMY", pageWidth / 2 + 10, currentY + 8, { align: 'center' });

    currentY += 15;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("Mumbra, Thane, Maharashtra - 400612", pageWidth / 2 + 10, currentY, { align: 'center' });

    currentY += 5;
    const yearName = academicYears.find(y => y.id == selectedYear)?.year_name || "2026-27";
    doc.text(`Academic Session: ${yearName}`, pageWidth / 2 + 10, currentY, { align: 'center' });

    // 2. Dark Blue Badge
    currentY += 10;
    doc.setFillColor(0, 23, 54);
    doc.roundedRect(pageWidth / 2 - 45, currentY, 90, 10, 2, 2, 'F');
    doc.setTextColor(255, 182, 6); // Amber text in badge
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("ACADEMIC PROGRESS REPORT", pageWidth / 2, currentY + 6.5, { align: 'center' });

    // Horizontal Line
    currentY += 18;
    doc.setDrawColor(0, 23, 54);
    doc.setLineWidth(0.8);
    doc.line(15, currentY, pageWidth - 15, currentY);

    // 3. Student Info Section (2 Column, 3 Row Grid)
    currentY += 15;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9.5);

    const infoFields = [
      { label: "STUDENT NAME:", value: studentProfile.student_name.toUpperCase() },
      { label: "CLASS & SEC:", value: (studentProfile.current_grade || 'N/A') + " - " + (activeEnrollment?.section || 'A') },
      { label: "GR NO:", value: studentProfile.gr_no || 'N/A' },
      { label: "ROLL NO:", value: activeEnrollment?.roll_number || '1' },
      { label: "MOTHER'S NAME:", value: studentProfile.mother_name || 'N/A' },
      { label: "FATHER'S NAME:", value: studentProfile.father_name || 'N/A' }
    ];

    const colWidth = (pageWidth - 30) / 2;
    infoFields.forEach((field, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const xPos = 15 + (col * colWidth);
      const yPos = currentY + (row * 10);

      doc.setFont("helvetica", "bold");
      doc.text(field.label, xPos, yPos);
      doc.setFont("helvetica", "bold");
      doc.text(field.value.toString(), xPos + 35, yPos);

      // Dotted line for each field
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.1);
      doc.setLineDash([0.5, 0.5]);
      doc.line(xPos, yPos + 2.5, xPos + colWidth - 5, yPos + 2.5);
      doc.setLineDash([]);
    });

    currentY += 30; // Move below the grid

    // --- Helper to draw Section Header ---
    const drawSectionHeader = (title, y) => {
      doc.setFillColor(241, 245, 249); // slate-100
      doc.rect(15, y, pageWidth - 30, 8, 'F');
      doc.setTextColor(0, 23, 54);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(title, 18, y + 5.5);
      return y + 8;
    };

    // 4. Scholastic Area - Term 1
    currentY += 8;
    currentY = drawSectionHeader("SCHOLASTIC AREA - TERM 1", currentY);

    const term1Data = performanceData.filter(m => m.term === 'Term 1');
    autoTable(doc, {
      startY: currentY,
      head: [['Sr.', 'Subject', 'Unit(10)', 'Enr/Oral(10)', 'NoteBk(10)', 'Term Written', 'Total/100', 'Grade']],
      body: term1Data.map((row, i) => [
        i + 1,
        row.subject_name.toUpperCase(),
        row.unit_written || '0',
        row.class_test || '0',
        row.notebook || '0',
        row.term_written || '0',
        row.total_obtained || '0',
        row.grade || '-'
      ]),
      styles: { fontSize: 8, cellPadding: 2.5, textColor: [0, 0, 0], font: "helvetica" },
      headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineWidth: 0.1, fontStyle: 'bold' },
      theme: 'grid',
      margin: { left: 15, right: 15 }
    });

    // 5. Scholastic Area - Term 2
    currentY = doc.lastAutoTable.finalY + 12;
    currentY = drawSectionHeader("SCHOLASTIC AREA - TERM 2", currentY);

    const term2Data = performanceData.filter(m => m.term === 'Term 2' || m.term === 'Final');
    autoTable(doc, {
      startY: currentY,
      head: [['Sr.', 'Subject', 'Unit(10)', 'Enr/Oral(10)', 'NoteBk(10)', 'Term Written', 'Total/100', 'Grade']],
      body: term2Data.map((row, i) => [
        i + 1,
        row.subject_name.toUpperCase(),
        row.unit_written || '0',
        row.class_test || '0',
        row.notebook || '0',
        row.term_written || '0',
        row.total_obtained || '0',
        row.grade || '-'
      ]),
      styles: { fontSize: 8, cellPadding: 2.5, textColor: [0, 0, 0], font: "helvetica" },
      headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineWidth: 0.1, fontStyle: 'bold' },
      theme: 'grid',
      margin: { left: 15, right: 15 }
    });

    // 6. Co-Scholastic Area
    currentY = doc.lastAutoTable.finalY + 12;
    autoTable(doc, {
      startY: currentY,
      head: [['Co-Scholastic Area', 'Term 1', 'Term 2']],
      body: coScholasticData.map(co => [
        co.area_name.toUpperCase(),
        co.grade_term1 || '-',
        co.grade_term2 || '-'
      ]),
      styles: { fontSize: 8, cellPadding: 3, textColor: [0, 0, 0], font: "helvetica" },
      headStyles: { fillColor: [241, 245, 249], textColor: [0, 23, 54], lineWidth: 0.1, fontStyle: 'bold' },
      theme: 'grid',
      margin: { left: 15 },
      tableWidth: 80
    });

    // 7. Summary Stats (Right side box)
    const summaryX = pageWidth - 95;
    const summaryY = currentY; // Align with Co-Scholastic

    const allMarks = [...term1Data, ...term2Data];
    const totalObt = allMarks.reduce((s, r) => s + parseFloat(r.total_obtained || 0), 0);
    const totalMax = allMarks.length * 100;
    const perc = totalMax > 0 ? (totalObt / totalMax) * 100 : 0;

    // Draw Result Box
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(0, 23, 54);
    doc.setLineWidth(0.5);
    doc.rect(summaryX, summaryY, 80, 35, 'FD');

    doc.setTextColor(0, 23, 54);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`OVERALL MARKS: ${totalObt.toFixed(0)} / ${totalMax}`, summaryX + 6, summaryY + 10);
    doc.text(`PERCENTAGE: ${perc.toFixed(2)}%`, summaryX + 6, summaryY + 19);
    doc.text(`GRADE: ${perc >= 91 ? 'A1' : perc >= 81 ? 'A2' : perc >= 71 ? 'B1' : perc >= 61 ? 'B2' : perc >= 51 ? 'C1' : 'C2'}`, summaryX + 6, summaryY + 28);

    // 8. Footer Section
    currentY = Math.max(doc.lastAutoTable.finalY, summaryY + 35) + 20;
    doc.setFontSize(11);
    doc.setTextColor(0, 23, 54);
    doc.setFont("helvetica", "bold");

    const GRADE_SEQUENCE = ['Nursery', 'Jr.Kg', 'Sr.Kg', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
    const curIdx = GRADE_SEQUENCE.indexOf(studentProfile.current_grade);
    const nextGrade = curIdx !== -1 && curIdx < GRADE_SEQUENCE.length - 1 ? GRADE_SEQUENCE[curIdx + 1] : 'ALUMNI';

    doc.text(`CONGRATULATIONS !!! PROMOTED TO CLASS: ${nextGrade.toUpperCase()}`, pageWidth / 2, currentY, { align: 'center' });

    currentY += 12;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text("NEW ACADEMIC SESSION BEGINS ON: ________________________", pageWidth / 2, currentY, { align: 'center' });

    currentY += 25;
    doc.setTextColor(0, 23, 54);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("CLASS TEACHER", 35, currentY, { align: 'center' });
    doc.text("PRINCIPAL", pageWidth - 35, currentY, { align: 'center' });

    doc.save(`${studentProfile.student_name.replace(/\s+/g, '_')}_Progress_Report.pdf`);
    toast.success("Corrected report card generated successfully");
  };

  const renderContent = () => {
    const stats = {
      present: attendanceRecords.filter(r => r.status === 'present').length,
      absent: attendanceRecords.filter(r => r.status === 'absent').length,
      late: attendanceRecords.filter(r => r.status === 'late').length,
      leave: attendanceRecords.filter(r => r.status === 'leave' || r.status === 'on leave').length,
      total: attendanceRecords.length
    };
    const attendancePercentage = stats.total > 0 ? ((stats.present + stats.late) / stats.total * 100).toFixed(1) : "0";

    const todayStr = new Date().toLocaleDateString('en-CA');

    switch (activeTab) {
      case 'Overview':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: "Attendance", value: `${attendancePercentage}%`, icon: ClipboardList, color: "text-blue-600", bg: "bg-blue-100" },
                {
                  label: "Today's Status",
                  value: (() => {
                    const todayRecord = attendanceRecords.find(r => {
                      try {
                        return new Date(r.date).toLocaleDateString('en-CA') === todayStr;
                      } catch { return false; }
                    });
                    return todayRecord ? todayRecord.status.charAt(0).toUpperCase() + todayRecord.status.slice(1) : "Not Marked";
                  })(),
                  icon: CheckCircle2,
                  color: "text-emerald-600",
                  bg: "bg-emerald-100"
                },
                { label: "Avg. Marks", value: "88%", icon: Award, color: "text-purple-600", bg: "bg-purple-100" },
                { label: "Rank", value: "#3", icon: TrendingUp, color: "text-green-600", bg: "bg-green-100" }
              ].map((stat, i) => (
                <div key={i} className="glass-card p-6 rounded-2xl shadow-sm border border-gray-300 flex items-center space-x-4">
                  <div className={`${stat.bg} p-3 rounded-xl`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                    <p className="text-xl font-bold text-primary">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="glass-card p-6 rounded-2xl shadow-sm border border-gray-300 overflow-hidden text-left">
              <NoticeBoard audience="student" compact={true} />
            </div>
          </div>
        );
      case 'Timetable':
        return (
          <div className="glass-card p-4 sm:p-6 lg:p-8 rounded-2xl shadow-sm border border-gray-300 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 print:hidden text-left">
              <div>
                <h2 className="text-2xl font-black text-primary uppercase tracking-tight">Institutional Academic Schedule</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">GRADE: {toRoman(studentProfile?.current_grade).toUpperCase()} &middot; REGISTRY: {activeEnrollment?.section || 'GENERAL'}</p>
                <div className="flex mt-6 p-1 bg-gray-100 rounded-xl w-fit border border-gray-200">
                  <button
                    onClick={() => setTimetableType('regular')}
                    className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${timetableType === 'regular' ? 'bg-white shadow text-primary font-black uppercase tracking-widest' : 'text-gray-500 hover:text-primary uppercase tracking-widest'}`}
                  >
                    Standard Matrix
                  </button>
                  <button
                    onClick={() => setTimetableType('exam')}
                    className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${timetableType === 'exam' ? 'bg-white shadow text-primary font-black uppercase tracking-widest' : 'text-gray-500 hover:text-primary uppercase tracking-widest'}`}
                  >
                    Examination Matrix
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={generateTimetablePDF}
                  className="flex items-center gap-2 px-6 py-3 bg-secondary text-white rounded-xl font-black uppercase tracking-widest text-xs hover:shadow-lg transition-all"
                >
                  <Download className="w-4 h-4" /> Download PDF Ledger
                </button>
              </div>
            </div>

            {timetableData.length > 0 || (matrixLayout.template.length > 0) ? (
              timetableType === 'regular' ? (
                <div className="mt-4">
                  <InstitutionalTimetable
                    data={timetableData}
                    forcedPeriods={matrixLayout.template}
                    periodTimings={matrixLayout.timings}
                    readOnly={true}
                  />
                </div>
              ) : (
                <div className="bg-white border-2 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300 w-full p-6">
                  <h3 className="text-xl font-black text-primary uppercase mb-6">Select an Exam to View Schedule</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {exams.length > 0 ? exams.map(exam => (
                      <div key={exam.id} className="p-6 border border-gray-200 rounded-xl hover:border-secondary hover:shadow-lg transition-all flex flex-col gap-4 cursor-pointer" onClick={() => setSelectedExam(exam)}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-black text-primary">{exam.exam_name}</h4>
                            <span className="text-[10px] font-bold uppercase text-gray-400">{exam.exam_type}</span>
                          </div>
                          <Calendar className="w-5 h-5 text-secondary" />
                        </div>
                        <div className="text-xs font-bold text-gray-500">
                          {new Date(exam.start_date).toLocaleDateString()} - {new Date(exam.end_date).toLocaleDateString()}
                        </div>
                        <button className="w-full py-2 bg-primary/5 text-primary font-black text-[10px] uppercase tracking-widest rounded-lg hover:bg-primary hover:text-white transition-all mt-auto">View Matrix</button>
                      </div>
                    )) : (
                      <div className="col-span-full text-center py-12 text-gray-400 font-bold uppercase tracking-widest text-xs">No exams scheduled for this academic year</div>
                    )}
                  </div>
                  {selectedExam && (
                    <ExamTimetableManager 
                      exam={selectedExam}
                      defaultClassroom={{ id: activeEnrollment?.classroom_id, class_name: activeEnrollment?.section ? `${studentProfile?.current_grade} - ${activeEnrollment.section}` : studentProfile?.current_grade }}
                      readOnly={true}
                      onClose={() => setSelectedExam(null)}
                    />
                  )}
                </div>
              )
            ) : (
              <div className="py-24 text-center">
                <Calendar size={48} className="mx-auto text-slate-100 mb-4" />
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Academic matrix not yet published</p>
              </div>
            )}
          </div>
        );

      case 'Attendance':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
            <div className="glass-card p-8 rounded-2xl shadow-sm border border-gray-300">
              <h2 className="text-2xl font-bold text-primary mb-6 text-center lg:text-left">Attendance Overview</h2>
              <div className="flex flex-col sm:flex-row items-center gap-8 mb-10">
                <div className="relative w-32 h-32 shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-100" />
                    <circle
                      cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent"
                      strokeDasharray={364.4}
                      strokeDashoffset={364.4 * (1 - (parseFloat(attendancePercentage) / 100))}
                      className="text-secondary transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-primary">{attendancePercentage}%</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Average</span>
                  </div>
                </div>
                <div className="space-y-3 w-full">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2 font-inter font-bold text-blue-900 text-sm"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Present</div>
                    <span className="font-black text-blue-700">{stats.present} Days</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-rose-50 rounded-xl border border-rose-100">
                    <div className="flex items-center gap-2 font-inter font-bold text-rose-900 text-sm"><div className="w-3 h-3 rounded-full bg-rose-500"></div> Absent</div>
                    <span className="font-black text-rose-600">{stats.absent} Days</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <div className="flex items-center gap-2 font-inter font-bold text-amber-900 text-sm"><div className="w-3 h-3 rounded-full bg-amber-500"></div> Late</div>
                    <span className="font-black text-amber-700">{stats.late} Days</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-bold text-primary">Attendance Progress</h3>
                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                  <div className="bg-secondary h-full rounded-full transition-all duration-1000" style={{ width: `${attendancePercentage}%` }}></div>
                </div>
              </div>
            </div>
            <div className="glass-card p-8 rounded-2xl shadow-sm border border-gray-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <h2 className="text-2xl font-bold text-primary leading-tight">Attendance Calendar</h2>
                <div className="flex gap-2">
                  <select
                    value={attendanceMonth}
                    onChange={(e) => setAttendanceMonth(e.target.value)}
                    className="p-2 bg-bg-base rounded-xl border border-gray-300 text-xs font-bold outline-none focus:border-secondary transition-all"
                  >
                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-bg-base p-6 rounded-2xl border border-gray-300/30">
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => <span key={idx} className="text-center font-bold text-gray-400 text-xs">{d}</span>)}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {(() => {
                    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                    const monthIdx = months.indexOf(attendanceMonth);
                    const year = new Date().getFullYear();
                    const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
                    const firstDay = new Date(year, monthIdx, 1).getDay();

                    const days = [];
                    for (let i = 0; i < firstDay; i++) {
                      days.push(<div key={`empty-${i}`} className="aspect-square"></div>);
                    }

                    for (let d = 1; d <= daysInMonth; d++) {
                      const dateStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                      const record = attendanceRecords.find(r => {
                        try {
                          return new Date(r.date).toLocaleDateString('en-CA') === dateStr;
                        } catch { return false; }
                      });

                      let bgColor = 'bg-white text-gray-700';
                      let shadowColor = 'shadow-xs';

                      if (record) {
                        if (record.status === 'present') {
                          bgColor = 'bg-emerald-500 text-white shadow-emerald-200';
                          shadowColor = 'shadow-lg';
                        } else if (record.status === 'absent') {
                          bgColor = 'bg-rose-500 text-white shadow-rose-200';
                          shadowColor = 'shadow-lg';
                        } else if (record.status === 'late') {
                          bgColor = 'bg-amber-500 text-white shadow-amber-200';
                          shadowColor = 'shadow-lg';
                        } else if (record.status === 'leave' || record.status === 'on leave') {
                          bgColor = 'bg-indigo-500 text-white shadow-indigo-200';
                          shadowColor = 'shadow-lg';
                        }
                      }

                      const isToday = new Date().toLocaleDateString('en-CA') === new Date(year, monthIdx, d).toLocaleDateString('en-CA');

                      days.push(
                        <div key={`day-${d}`} className={`aspect-square flex items-center justify-center rounded-lg text-sm font-bold ${shadowColor} hover:shadow-md transition-all cursor-pointer ${bgColor} ${isToday ? 'border-2 border-[#001736] scale-110' : ''}`}>
                          {d}
                        </div>
                      );
                    }
                    return days;
                  })()}
                </div>
                <div className="mt-8 flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-widest justify-center">
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> Present</div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div> Absent</div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div> Late</div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div> Leave</div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'Exam Results': {
        const term1Marks = performanceData.filter(m => m.term === 'Term 1');
        const term2Marks = performanceData.filter(m => m.term === 'Term 2' || m.term === 'Final');

        const getNextClass = (currentClass) => {
          if (!currentClass) return '—';
          const name = currentClass.toLowerCase();
          if (name.includes('nursery')) return 'Jr. KG';
          if (name.includes('junior') || name.includes('jr')) return 'Sr. KG';
          if (name.includes('senior') || name.includes('sr')) return '1st';
          if (name.includes('1st') || name.includes('1')) return '2nd';
          if (name.includes('2nd') || name.includes('2')) return '3rd';
          if (name.includes('3rd') || name.includes('3')) return '4th';
          if (name.includes('4th') || name.includes('4')) return '5th';
          if (name.includes('5th') || name.includes('5')) return '6th';
          if (name.includes('6th') || name.includes('6')) return '7th';
          if (name.includes('7th') || name.includes('7')) return '8th';
          if (name.includes('8th') || name.includes('8')) return '9th';
          return 'Next Level';
        };

        // Calculate Term-wise and Overall Attendance
        let t1Present = 0, t1Total = 0;
        let t2Present = 0, t2Total = 0;
        
        (attendanceRecords || []).forEach(row => {
            const date = new Date(row.date);
            const month = date.getMonth();
            const isPresent = ['present', 'late'].includes(row.status?.toLowerCase());
            // Term 1 is from June (5) to October (9)
            // Term 2 is November (10) to May (4)
            const isTerm1 = month >= 5 && month <= 9;
            if (isTerm1) {
                t1Total++;
                if (isPresent) t1Present++;
            } else {
                t2Total++;
                if (isPresent) t2Present++;
            }
        });

        const totalPresent = t1Present + t2Present;
        const totalDays = t1Total + t2Total;
        const overallPct = totalDays > 0 ? Math.round((totalPresent / totalDays) * 100) : null;
        
        const attendance = overallPct !== null ? `${overallPct}%` : '95%';
        const overallGrade = performanceData.length > 0 ? performanceData[0].overall_grade : "N/A";
        const overallPercentage = performanceData.length > 0 ? performanceData[0].overall_percentage : "N/A";
        const totalMarks = performanceData.length > 0 ? performanceData[0].total_marks_obtained : "N/A";
        
        const currentClassName = studentProfile?.current_grade || "";
        const nextClassName = getNextClass(currentClassName);

        const overallStats = {
            totalMarks,
            percentage: overallPercentage,
            grade: overallGrade,
            attendance,
            term1_attendance: t1Total > 0 ? `${t1Present}/${t1Total}` : '88/90',
            term2_attendance: t2Total > 0 ? `${t2Present}/${t2Total}` : '92/95',
            promotedClass: nextClassName,
            reopeningDate: '06/04/2026 at 08:00 am'
        };

        const templateStudentData = {
          ...studentProfile,
          class_name: studentProfile?.current_grade || '',
          section: activeEnrollment?.section || '',
          roll_number: activeEnrollment?.roll_number || '',
          student_name: studentProfile?.student_name || '',
          father_mobile: studentProfile?.father_mobile || '',
          mother_mobile: studentProfile?.mother_mobile || ''
        };

        const isPrePrimary = studentProfile?.current_grade?.toLowerCase().match(/(nursery|junior|senior|kg|jr|sr)/);

        const prePrimaryData = [
          { term: 'I Term', ...prePrimaryMarks.t1 },
          { term: 'II Term', ...prePrimaryMarks.t2 }
        ];

        const renderTemplate = () => {
          const gradeName = studentProfile?.current_grade?.toLowerCase() || '';

          if (isPrePrimary) {
            return <PrePrimaryReport prePrimaryData={prePrimaryData} studentData={templateStudentData} />;
          }

          if (['1st', '2nd'].includes(gradeName)) {
            return <PrimaryReport1to2 studentData={templateStudentData} term1Data={term1Marks} term2Data={term2Marks} coScholasticData={coScholasticData} overallStats={overallStats} />;
          }
          
          if (['3rd', '4th', '5th'].includes(gradeName)) {
            return <PrimaryReport3to5 studentData={templateStudentData} term1Data={term1Marks} term2Data={term2Marks} coScholasticData={coScholasticData} overallStats={overallStats} />;
          }

          // Default for 6th-8th
          return <MiddleReport6to8 studentData={templateStudentData} term1Data={term1Marks} term2Data={term2Marks} coScholasticData={coScholasticData} overallStats={overallStats} />;
        };

        return (
          <div className="animate-in fade-in duration-500">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 border-b border-slate-100 pb-6 no-print text-left gap-4">
              <div>
                <h2 className="text-xl font-black text-primary uppercase">Academic Transcripts</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Real-time Performance Metrics &amp; Institutional records</p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                <button
                  onClick={generateFullReportPDF}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#FFB606] text-primary font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md text-xs border-2 border-primary w-full sm:w-auto shrink-0"
                >
                  <Download className="w-4 h-4" /> DOWNLOAD FULL REPORT
                </button>
                <div className="flex items-center justify-between sm:justify-start gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200 shadow-inner">
                  <span className="font-bold text-[10px] text-slate-400 uppercase tracking-widest pl-2">Archive</span>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="bg-white border border-slate-300 text-primary font-black px-4 py-1.5 rounded-lg text-xs outline-none shadow-sm cursor-pointer"
                  >
                    {academicYears.map(y => <option key={y.id} value={y.id}>{y.year_name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="w-full overflow-x-auto">
              {(isPrePrimary ? (prePrimaryMarks.t1?.english_reading || prePrimaryMarks.t2?.english_reading) : (performanceData.length > 0)) ? (
                renderTemplate()
              ) : (
                <div className="py-32 text-center border border-dashed rounded-3xl border-slate-200">
                  <Award size={48} className="mx-auto text-slate-100 mb-4" />
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest leading-loose">
                    Institutional transcripts are not yet available<br />for the selected academic session.
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      }
      case 'Library':
        return (
          <div className="space-y-8 animate-in fade-in duration-500 text-left">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: "Currently Issued", value: libraryData.filter(b => b.status === 'Active' || b.status === 'Overdue').length, icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Overdue Books", value: libraryData.filter(b => b.status === 'Overdue').length, icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-50" },
                { label: "Total History", value: libraryData.length, icon: ClipboardList, color: "text-emerald-600", bg: "bg-emerald-50" }
              ].map((stat, i) => (
                <div key={i} className="glass-card p-6 rounded-2xl border border-gray-200 flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${stat.bg}`}><stat.icon className={`w-6 h-6 ${stat.color}`} /></div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
                    <p className="text-2xl font-black text-primary">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border border-gray-200 overflow-hidden shadow-sm">
              <DataTable
                headers={[
                  { label: "Sr. No.", className: "w-16 text-center" },
                  { label: "Book Details", className: "min-w-[200px]" },
                  { label: "Issue Date" },
                  { label: "Due Date" },
                  { label: "Status" }
                ]}
                columnCount={5}
                loading={false}
                emptyMessage="No library records detected in your registry."
              >
                {libraryData.length > 0 ? libraryData.map((txn, i) => (
                  <tr key={i} className="hover:bg-bg-base/30 transition-colors group">
                    <td className="p-4 border border-black text-center text-xs font-bold text-primary">
                      {i + 1}
                    </td>
                    <td className="p-4 border border-black text-left">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                           <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[12px] font-black text-primary uppercase">{txn.bookTitle}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">ISBN: {txn.isbn}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 border border-black text-[11px] font-bold text-gray-500">
                      {new Date(txn.issue_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="p-4 border border-black text-[11px] font-bold text-gray-500">
                      {new Date(txn.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="p-4 border border-black">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase flex items-center gap-1 w-fit border shadow-sm
                        ${txn.status === 'Active' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                          txn.status === 'Returned' || txn.status === 'Returned Late' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            'bg-rose-50 text-rose-600 border-rose-100'
                        }`}>
                        {txn.status === 'Active' ? <Clock className="w-3 h-3" /> :
                          txn.status === 'Returned' || txn.status === 'Returned Late' ? <CheckCircle2 className="w-3 h-3" /> :
                            <AlertCircle className="w-3 h-3" />}
                        {txn.status}
                      </span>
                    </td>
                  </tr>
                )) : null}
              </DataTable>
            </div>
          </div>
        );
      case 'Assignments':
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
              {assignments.filter(a => a.points !== 0).length > 0 ? assignments.filter(a => a.points !== 0).map((task, i) => (
                <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 hover:border-secondary hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
                  <div>
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <div className="flex-1">
                        <span className="text-[8px] font-black text-secondary uppercase tracking-[0.2em]">{task.subject_name || 'Assignment'}</span>
                        <h3 className="text-primary font-black text-sm leading-tight mt-0.5 group-hover:text-secondary transition-colors line-clamp-2">{task.title}</h3>
                      </div>
                      {task.file_url && (
                        <div className="p-1.5 bg-indigo-50 text-indigo-500 rounded-lg border border-indigo-100 shrink-0">
                          <Paperclip className="w-3 h-3" />
                        </div>
                      )}
                    </div>

                    <p className="text-[10px] font-medium text-slate-500 leading-relaxed line-clamp-2 mb-3">
                      {task.description}
                    </p>

                    <div className="flex items-center justify-between mb-3 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-amber-500" />
                        <span className="text-[10px] font-bold text-primary truncate max-w-[100px]">{task.teacher_name || 'Staff'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-rose-500">
                        <Clock className="w-3 h-3" />
                        <span className="text-[9px] font-black">{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>

                    {task.submission_id && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[8px] font-black uppercase tracking-widest border border-emerald-100 w-fit mb-2">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Submitted
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 mt-2 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => setViewingAssignment(task)}
                      className="flex-1 py-2 bg-slate-50 hover:bg-primary hover:text-white text-primary rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border border-slate-200 flex items-center justify-center gap-1"
                    >
                      <Eye className="w-3 h-3" /> View
                    </button>

                    {task.file_url && (
                      <a
                        href={task.file_url.startsWith('http') ? task.file_url : `${ROOT_URL}/${task.file_url.replace(/\\/g, '/')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 rounded-lg transition-all border border-indigo-100"
                        title="View Document"
                      >
                        <FileText className="w-3 h-3" />
                      </a>
                    )}

                    <button
                      onClick={() => {
                        setSubmittingTask(task);
                        setSubmissionText(task.submission_text || "");
                      }}
                      className="flex-[1.5] py-2 bg-primary text-white hover:bg-black rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95"
                    >
                      {task.submission_id ? "Update" : "Submit"}
                    </button>
                  </div>
                </div>
              )) : (
                <div className="col-span-full py-24 text-center">
                  <BookOpen size={48} className="mx-auto text-slate-100 mb-4" />
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">No assignments found for your class</p>
                </div>
              )}
            </div>

          </div>
        );
      case 'Study Materials':
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search chapters, topics..." className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-xl outline-none focus:border-secondary transition-all font-bold text-sm" />
              </div>
              <button className="px-5 py-3 bg-primary text-white rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-primary/90 transition-all">
                <Filter className="w-4 h-4" /> Filter
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {assignments.filter(a => a.points === 0).length > 0 ? assignments.filter(a => a.points === 0).map((file, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-secondary transition-all duration-300 overflow-hidden flex flex-col">
                  {/* Card Header */}
                  <div className="bg-linear-to-br from-indigo-50 to-blue-50 p-5 flex flex-col items-center border-b border-gray-100">
                    <div className="w-14 h-14 bg-white rounded-xl shadow-sm flex items-center justify-center mb-3 border border-indigo-100">
                      <BookOpen className="w-7 h-7 text-indigo-500" />
                    </div>
                    <h4 className="font-black text-primary text-sm leading-tight line-clamp-2 text-center">{file.title}</h4>
                  </div>
                  {/* Card Body */}
                  <div className="p-4 flex flex-col gap-3 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {file.subject_name || 'General'}
                      </span>
                      <span className="text-[9px] font-bold text-gray-400">{new Date(file.created_at).toLocaleDateString()}</span>
                    </div>
                    {file.description && (
                      <p className="text-[10px] text-gray-500 font-medium leading-relaxed line-clamp-2">{file.description}</p>
                    )}
                    {/* Buttons */}
                    <div className="flex gap-2 mt-auto pt-2 border-t border-gray-100">
                      <button
                        onClick={() => setViewingAssignment(file)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-50 hover:bg-primary hover:text-white text-primary border border-slate-200 text-[9px] font-black uppercase tracking-widest transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                      {file.file_url ? (
                        <a
                          href={file.file_url.startsWith('http') ? file.file_url : `${ROOT_URL}/${file.file_url.replace(/\\/g, '/')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 border border-indigo-100 text-[9px] font-black uppercase tracking-widest transition-all"
                        >
                          <Download className="w-3.5 h-3.5" /> PDF
                        </a>
                      ) : (
                        <span className="flex-1 flex items-center justify-center py-2 rounded-lg bg-gray-50 text-gray-300 border border-gray-100 text-[9px] font-black uppercase tracking-widest">
                          No File
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="col-span-full py-20 text-center">
                  <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-4 border border-gray-200">
                    <BookOpen className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-400 text-xs font-black uppercase tracking-widest">No study materials shared yet</p>
                </div>
              )}
            </div>
          </div>
        );
      case 'Certificates':
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-black text-primary uppercase tracking-tight">Institutional Certificates</h2>
              <button
                onClick={() => setShowCertModal(true)}
                className="px-6 py-3 bg-primary text-white rounded-2xl font-black text-xs shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> APPLY FOR CERTIFICATE
              </button>
            </div>

            <div className="border border-gray-200 overflow-hidden shadow-sm">
              <DataTable
                headers={[
                  { label: "Sr. No.", className: "w-16 text-center" },
                  { label: "Certificate Type" },
                  { label: "Application Date" },
                  { label: "Status" },
                  { label: "Actions", className: "text-center" }
                ]}
                columnCount={5}
                loading={certLoading}
                emptyMessage="No institutional certificates detected in your registry."
              >
                {myCertRequests.map((req, i) => (
                  <tr key={i} className="hover:bg-bg-base/30 transition-colors group">
                    <td className="p-4 border border-black text-center text-xs font-bold text-primary">
                      {i + 1}
                    </td>
                    <td className="p-4 border border-black">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-secondary/10 rounded-xl text-secondary">
                          <FileCheck className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-primary uppercase text-xs tracking-tight">{req.cert_type} Certificate</span>
                      </div>
                    </td>
                    <td className="p-4 border border-black text-xs font-bold text-gray-500">
                      {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="p-4 border border-black">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase flex items-center gap-1 w-fit border shadow-sm
                                    ${req.status === 'fully_approved' || req.status === 'approved_principal' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}
                                `}>
                        {req.status === 'fully_approved' || req.status === 'approved_principal' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {req.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 border border-black text-center">
                      {(req.status === 'fully_approved' || req.status === 'approved_principal') ? (
                        req.cert_type === 'bonafide' ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleCertDownload(req)}
                              className="p-2 bg-primary text-white rounded-xl cursor-pointer hover:bg-primary/90 transition-all shadow-md active:scale-95"
                              title="Download Document"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2 text-indigo-600">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-[9px] font-black uppercase tracking-widest italic">Collect from Office</span>
                          </div>
                        )
                      ) : req.status === 'pending_teacher' ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditRequest(req)}
                            className="p-2 bg-amber-500 text-white rounded-xl cursor-pointer hover:bg-amber-600 transition-all shadow-sm"
                            title="Edit Request"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRequest(req.id)}
                            className="p-2 bg-rose-500 text-white rounded-xl cursor-pointer hover:bg-rose-600 transition-all shadow-sm"
                            title="Cancel Request"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : req.status === 'grievance_raised' ? (
                        <div className="flex items-center justify-center gap-2 text-rose-500">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-[9px] font-black uppercase tracking-widest italic">Under Correction</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2 text-slate-400">
                          <Clock className="w-3 h-3" />
                          <span className="text-[9px] font-black uppercase tracking-widest italic">In Verification</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </DataTable>
            </div>

            {/* Modal */}
            {showCertModal && (
              <div className="fixed inset-0 z-100 flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
                <div className="absolute inset-0 bg-primary/60 backdrop-blur-sm" onClick={() => setShowCertModal(false)}></div>
                <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl relative overflow-hidden flex flex-col">
                  <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-bg-base/30">
                    <div>
                      <h3 className="text-2xl font-black text-primary uppercase">{editingCert ? 'Update' : 'Request'} Certificate</h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Institutional Audit Workflow Enabled</p>
                    </div>
                    <button onClick={() => setShowCertModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-all"><X className="w-6 h-6" /></button>
                  </div>
                  <form onSubmit={handleRequestCert} className="p-8 space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Certificate Category</label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setCertType('bonafide')}
                          className={`p-4 rounded-2xl border-2 transition-all font-bold text-sm ${certType === 'bonafide' ? 'bg-[#FFB606] border-primary text-primary shadow-lg shadow-amber-200' : 'border-gray-100 hover:border-gray-200 text-gray-400'}`}
                        >
                          Bonafide
                        </button>
                        <button
                          type="button"
                          onClick={() => setCertType('leaving')}
                          className={`p-4 rounded-2xl border-2 transition-all font-bold text-sm ${certType === 'leaving' ? 'bg-[#FFB606] border-primary text-primary shadow-lg shadow-amber-200' : 'border-gray-100 hover:border-gray-200 text-gray-400'}`}
                        >
                          Leaving (LC)
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Reason for Request</label>
                      <textarea
                        required
                        value={certReason}
                        onChange={(e) => setCertReason(e.target.value)}
                        placeholder="E.g. Bank Account, Higher Studies, etc."
                        className="w-full p-4 bg-bg-base border border-gray-200 rounded-2xl outline-none focus:border-secondary font-medium text-sm min-h-[120px]"
                      />
                    </div>
                    <button
                      disabled={certLoading}
                      className="w-full py-5 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-secondary transition-all disabled:opacity-50"
                    >
                      {certLoading ? 'Processing Request...' : (editingCert ? 'UPDATE REQUEST' : 'SUBMIT REQUEST')}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        );

      case 'Fees & Finance': {
        if (!feeRecords) {
          return (
            <div className="py-32 flex flex-col items-center justify-center bg-white/40 backdrop-blur-md rounded-3xl border border-white/20 shadow-xl text-left">
              <div className="p-4 bg-indigo-500/10 rounded-2xl mb-4">
                <Landmark className="w-10 h-10 text-indigo-600 animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Synchronizing Ledger...</h3>
              <p className="text-slate-500 text-sm">Please wait while we securely retrieve your institutional dues.</p>
            </div>
          );
        }

        const totalPayable = feeRecords.bill_total || 0;
        const totalPaid = feeRecords.paid_total || 0;
        const pendingAmount = totalPayable - totalPaid;
        const transportFee = feeRecords.transport_fee || 0;
        const discountFee = feeRecords.discount_amount || 0;
        const term1Fee = totalPayable / 2;
        const term2Fee = totalPayable / 2;

        return (
          <div className="space-y-8 animate-in fade-in duration-500 text-left">
            <div className="flex justify-between items-center gap-2 mb-4">
              <h2 className="text-[10px] xs:text-xs sm:text-2xl md:text-3xl font-black text-primary uppercase tracking-tight whitespace-nowrap">Institutional Fee Portal</h2>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-2 sm:px-6 sm:py-3 bg-white border border-gray-300 text-primary rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[8px] sm:text-[10px] hover:bg-gray-50 transition-all shadow-sm whitespace-nowrap"
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4" /> Download Statement
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {[
                { label: "Total Fee", value: totalPayable, color: "text-primary", bg: "bg-primary/5" },
                { label: "Discount", value: discountFee, color: "text-cyan-600", bg: "bg-cyan-50" },
                { label: "Transport", value: transportFee, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Term 1 (50%)", value: term1Fee, color: "text-purple-600", bg: "bg-purple-50" },
                { label: "Term 2 (50%)", value: term2Fee, color: "text-indigo-600", bg: "bg-indigo-50" },
                { label: "Total Paid", value: totalPaid, color: "text-emerald-600", bg: "bg-emerald-50" },
                { label: "Pending", value: pendingAmount, color: "text-rose-600", bg: "bg-rose-50" },
                { label: "Status", value: pendingAmount <= 0 ? "CLEARED" : "DUE", color: pendingAmount <= 0 ? "text-emerald-600" : "text-amber-600", bg: pendingAmount <= 0 ? "bg-emerald-50" : "bg-amber-50", isStatus: true }
              ].map((card, i) => (
                <div key={i} className={`p-4 rounded-2xl border border-gray-100 ${card.bg} flex flex-col justify-center items-center text-center shadow-sm hover:shadow-md transition-all`}>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{card.label}</p>
                  <p className={`text-sm font-black ${card.color}`}>{card.isStatus ? card.value : `Rs.${card.value.toLocaleString()}`}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-8">
              <div className="glass-card p-4 sm:p-8 rounded-3xl border border-gray-300">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black text-primary uppercase tracking-widest text-xs flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-secondary" /> Payment Ledger Entries
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toast.info('Online payment gateway will be active shortly.')}
                      className="px-4 py-2 bg-secondary text-black! rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:shadow-lg transition-all"
                    >
                      <Lock className="w-3 h-3" /> Pay Online
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto custom-scrollbar border-t border-gray-100">
                  <table className="w-full text-left border-collapse min-w-[750px] border border-black">
                    <thead>
                      <tr className="bg-slate-200/50 border border-black">
                        <th className="py-4 px-4 border border-black text-[10px] font-black text-[#001736] uppercase tracking-widest bg-slate-300">Date</th>
                        <th className="py-4 px-4 border border-black text-[10px] font-black text-[#001736] uppercase tracking-widest bg-slate-300">Method</th>
                        <th className="py-4 px-4 border border-black text-[10px] font-black text-[#001736] uppercase tracking-widest bg-slate-300">Ref/Chq</th>
                        <th className="py-4 px-4 border border-black text-[10px] font-black text-[#001736] uppercase tracking-widest bg-slate-300">Payer Name</th>
                        <th className="py-4 px-4 border border-black text-[10px] font-black text-[#001736] uppercase tracking-widest bg-slate-300">Receiver</th>
                        <th className="py-4 px-4 border border-black text-[10px] font-black text-[#001736] uppercase tracking-widest text-right bg-slate-300">Amount</th>
                        <th className="py-4 px-4 border border-black text-[10px] font-black text-[#001736] uppercase tracking-widest text-center bg-slate-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feeRecords.payments && feeRecords.payments.length > 0 ? feeRecords.payments.map((fee, i) => (
                        <tr key={i} className="border border-black hover:bg-bg-base/30 transition-colors bg-white">
                          <td className="py-4 px-4 border border-black text-xs font-bold text-[#001736]">{new Date(fee.payment_date).toLocaleDateString('en-GB')}</td>
                          <td className="py-4 px-4 border border-black text-xs font-black text-[#001736] uppercase">{fee.payment_method}</td>
                          <td className="py-4 px-4 border border-black text-xs font-bold text-[#001736]">{fee.cheque_no || 'N/A'}</td>
                          <td className="py-4 px-4 border border-black text-xs font-bold text-[#001736]">{fee.payer_name || 'Guardian Account'}</td>
                          <td className="py-4 px-4 border border-black text-xs font-bold text-[#001736] uppercase">Admin Desk</td>
                          <td className="py-4 px-4 border border-black text-sm font-black text-emerald-600 text-right">₹{parseFloat(fee.paid_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="py-3 px-4 border border-black text-center">
                            <div className="flex flex-col gap-1.5 justify-center">
                              <button onClick={() => handlePrintReceipt(fee)} className="w-full py-1.5 border border-black rounded text-[9px] font-black uppercase text-[#001736] hover:bg-slate-100 transition-all">Print Receipt</button>
                              <button onClick={() => { if(fee.attachment_url) { window.open(`${ROOT_URL}/uploads/${fee.attachment_url}`, '_blank'); } else { toast.info('No document attached to this transaction.'); } }} className="w-full py-1.5 border border-black rounded text-[9px] font-black uppercase text-[#001736] hover:bg-slate-100 transition-all">View Document</button>
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={7} className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs border border-black">No transaction history available</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );
      }

      case 'Notifications':
        return (
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-gray-300 animate-in fade-in duration-500 text-left">
            <NoticeBoard audience="student" />
          </div>
        );
      case 'Profile':
        return (
          <div className="animate-in fade-in duration-500 rounded-3xl overflow-hidden -mx-8 -my-4 sm:-mx-12 sm:-my-12">
            <StudentProfile
              student={{ id: user?.id }}
              hideHeader={true}
              onBack={() => setActiveTab('Overview')}
            />
          </div>
        );
      case 'Leaves':
        return (
          <StudentLeavesView
            studentProfile={studentProfile}
            user={user}
            selectedYear={selectedYear}
            academicYears={academicYears}
            setSelectedYear={setSelectedYear}
          />
        );
      case 'ID Card':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="flex justify-between items-center bg-white border-2 border-black p-6 rounded-none shadow-sm mb-8">
              <div>
                <h2 className="text-2xl font-black text-[#001736] uppercase tracking-tighter">Student Identity Card</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Official Institutional Registry Card</p>
              </div>
              <div className="p-3 bg-amber-400 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <User className="w-6 h-6 text-[#001736]" />
              </div>
            </div>
            <StudentIdCard student={studentProfile} />
          </div>
        );
      default:
        return <div>Module Under Construction</div>;
    }
  };

  return (
    <div className="flex bg-bg-base h-screen overflow-hidden">
      {/* Sidebar Overlay for Mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-55 lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`bg-primary text-white flex flex-col h-screen shadow-2xl fixed lg:relative transition-all duration-300 ease-in-out z-60 shrink-0
        ${isCollapsed ? 'w-24' : 'w-64'} 
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        rounded-r-2xl
        `}
      >
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex p-1.5 bg-[#FFB606] text-primary rounded-full shadow-lg border-2 border-primary hover:scale-110 transition-transform absolute -right-3.5 top-12 z-50 focus:outline-none"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4 font-bold" strokeWidth={3} /> : <ChevronLeft className="w-4 h-4 font-bold" strokeWidth={3} />}
        </button>

        <div className={`flex items-center pt-10 pb-8 z-10 relative transition-all duration-300 ${isCollapsed ? 'flex-col gap-4 px-4' : 'gap-4 px-8'}`}>
          <div className={`bg-white p-2 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${isCollapsed ? 'w-12 h-12' : 'w-14 h-14'}`}>
            <img
              src={logo}
              alt="NGA Logo"
              className="w-full h-full object-contain"
              loading="eager"
            />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col overflow-hidden text-left">
              <h1 className="text-[#FFB606]! font-black  lg:text-base leading-tight tracking-tight uppercase whitespace-normal">NEW GRACE ACADEMY</h1>
              <p className="text-[8px] font-bold text-gray-400 tracking-[0.2em] uppercase mt-1 truncate">STUDENT</p>
            </div>
          )}
        </div>

        <nav className="flex-1 py-4 flex flex-col gap-2 relative overflow-y-auto no-scrollbar">
          {menuItems.map((item, i) => {
            const isActive = activeTab === item.label;
            return (
              <div key={i} className="w-full">
                <button
                  onClick={() => { setActiveTab(item.label); setIsMobileMenuOpen(false); }}
                  className={`w-full relative flex items-center transition-all duration-300 group focus:outline-none ${isCollapsed ? 'mx-3 justify-center py-3 rounded-xl' : 'ml-6 px-6 py-3.5 rounded-l-full gap-4'} ${isActive ? 'bg-white/10 text-white shadow-inner' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                  {isActive && !isCollapsed && (
                    <div className="absolute inset-y-0 left-0 w-1 bg-[#FFB606] rounded-r-full" />
                  )}
                  <item.icon className="w-5 h-5 shrink-0 relative z-20 text-white" strokeWidth={isActive ? 2.5 : 2} />
                  {!isCollapsed && <span className="relative z-20 tracking-wide text-sm font-bold truncate text-left flex-1">{item.label}</span>}
                </button>
              </div>
            );
          })}
        </nav>

        <div className={`mt-auto mb-4 z-10 transition-all duration-300 ${isCollapsed ? 'px-4 pb-6' : 'p-8'}`}>
          <button
            onClick={handleLogout}
            className={`flex items-center justify-center text-rose-500 bg-black/10 hover:bg-rose-500 hover:text-white transition-all active:scale-[0.98] ${isCollapsed ? 'w-full py-4 rounded-xl' : 'gap-4 w-full px-6 py-5 rounded-xl uppercase tracking-widest text-[10px] font-black border border-white/5 shadow-inner'}`}
          >
            <LogOut className="w-4 h-4 shrink-0 opacity-60" strokeWidth={2.5} />
            {!isCollapsed && <span>Logout System</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 p-4 sm:p-6 lg:p-12 overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out h-full text-left relative`}>
        {/* Header (Hidden in full-screen modules like Profile) */}
        {activeTab !== 'Profile' && (
          <div className="mb-8 lg:mb-12 animate-in fade-in duration-700">
            {/* Mobile Header Bar */}
            <div className="flex lg:hidden justify-between items-center bg-white p-3 border-b border-gray-200 mb-6 text-left">
              <div className="flex items-center gap-3 overflow-hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="p-2 bg-bg-base hover:bg-slate-50 rounded-xl text-primary border border-gray-150 shrink-0 shadow-xs active:scale-95 transition-transform"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div className="overflow-hidden">
                  <h1 className="text-xs sm:text-sm font-black text-[#001736] tracking-tight leading-tight uppercase whitespace-normal">
                    Welcome, {studentProfile?.student_name || user?.username}!
                  </h1>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1.5">
                    STUDENT ID: {studentProfile?.student_id_no || `#${user?.id}`} &middot; {academicYears.find(y => y.id == selectedYear)?.year_name}
                  </p>
                </div>
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 shrink-0">Student</span>
            </div>

            {/* Desktop Header Block (Completely Unchanged) */}
            <div className="hidden lg:flex justify-between items-center">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-white rounded-3xl border-4 border-white shadow-xl overflow-hidden ring-1 ring-gray-100">
                  {studentProfile?.doc_passport_photo ? (
                    <img
                      src={`${ROOT_URL}/${studentProfile.doc_passport_photo.replace(/\\/g, '/')}`}
                      alt="student"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'Felix'}`} alt="avatar" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="text-left">
                  <h1 className="text-xl xl:text-2xl font-black text-[#001736] mb-1 tracking-tight whitespace-nowrap truncate max-w-[250px] md:max-w-[500px] lg:max-w-[600px] xl:max-w-[800px]">Welcome, {studentProfile?.student_name || user?.username}!</h1>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Student Registry &middot; ID: {studentProfile?.student_id_no || `#${user?.id}`} &middot; {academicYears.find(y => y.id == selectedYear)?.year_name}
                  </p>
                </div>
              </div>

              <div className="hidden xl:flex items-center gap-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex flex-col border-r border-gray-100 pr-8">
                  <span className="text-[10px] font-bold text-gray-400 uppercase mb-1">Classroom</span>
                  <span className="text-lg font-black text-[#001736]">{toRoman(studentProfile?.current_grade).toUpperCase()}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase mb-1">Status</span>
                  <span className="text-lg font-black text-emerald-600 uppercase">Active</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {renderContent()}

        {/* Assignment Detail Modal */}
        {viewingAssignment && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-200 animate-in zoom-in-95">
              {/* Modal Header */}
              <div className="px-8 py-6 bg-slate-50 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4 text-left">
                  <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-sm text-secondary">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-1">Assignment Info</p>
                    <h2 className="text-primary font-black text-xl leading-tight">{viewingAssignment.title}</h2>
                  </div>
                </div>
                <button onClick={() => setViewingAssignment(null)} className="p-2 hover:bg-rose-50 hover:text-rose-500 rounded-xl transition-all border border-transparent hover:border-rose-100">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-8 overflow-y-auto grow bg-white text-left">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8 bg-slate-50 p-4 rounded-2xl border border-gray-100">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Assigned By</p>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-secondary" />
                      <span className="text-xs font-bold text-primary">{viewingAssignment.teacher_name || 'Staff'}</span>
                    </div>
                  </div>
                  <div className="space-y-1 border-l border-gray-200 pl-4">
                    <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Deadline</p>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-rose-500" />
                      <span className="text-xs font-bold text-primary">
                        {(() => {
                          if (!viewingAssignment.due_date) return 'N/A';
                          const d = new Date(viewingAssignment.due_date);
                          return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString();
                        })()}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1 border-l border-gray-200 pl-4">
                    <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Subject</p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-secondary"></div>
                      <span className="text-xs font-bold text-primary">{viewingAssignment.subject_name}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Description</h4>
                  <div className="bg-white border border-gray-100 p-6 rounded-2xl text-sm text-primary leading-relaxed font-medium whitespace-pre-wrap">
                    {viewingAssignment.description}
                  </div>
                </div>

                {viewingAssignment.file_url && typeof viewingAssignment.file_url === 'string' && (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-500">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-primary truncate max-w-[250px]">
                          {viewingAssignment.file_url.split('/').pop()}
                        </h4>
                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Reference Document Attached</p>
                      </div>
                    </div>
                    <a
                      href={viewingAssignment.file_url.startsWith('http') ? viewingAssignment.file_url : `${ROOT_URL}/${viewingAssignment.file_url.replace(/\\/g, '/')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-2.5 bg-white hover:bg-indigo-600 hover:text-white text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border border-indigo-100 flex items-center gap-2"
                    >
                      <Download size={14} /> Download
                    </a>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-8 py-5 bg-slate-50 border-t border-gray-100 flex justify-end gap-3">
                <button onClick={() => setViewingAssignment(null)} className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-primary transition-all">Close</button>
                {activeTab === 'Assignments' && (
                  <button
                    onClick={() => {
                      setViewingAssignment(null);
                      setSubmittingTask(viewingAssignment);
                      setSubmissionText(viewingAssignment.submission_text || "");
                    }}
                    className="px-8 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                  >
                    {viewingAssignment.submission_id ? "Edit Submission" : "Submit Now"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Submission Modal */}
        {submittingTask && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
              <form onSubmit={handleSubmitAssignment}>
                <div className="px-8 py-6 bg-slate-50 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1">Submit Assignment</p>
                    <h3 className="text-primary font-black text-lg">{submittingTask.title}</h3>
                  </div>
                  <button type="button" onClick={() => setSubmittingTask(null)} className="p-2 hover:bg-slate-200 rounded-lg transition-all">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-8 space-y-6 text-left">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Write your response</label>
                    <textarea
                      value={submissionText}
                      onChange={(e) => setSubmissionText(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all min-h-[120px]"
                      placeholder="Enter any additional notes or response here..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Upload Work (Optional)</label>
                    <div className="relative group">
                      <input
                        type="file"
                        onChange={(e) => setSubmissionFile(e.target.files[0])}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 group-hover:border-secondary transition-all bg-slate-50/50">
                        <div className="p-3 bg-white rounded-xl shadow-sm text-slate-400 group-hover:text-secondary transition-all">
                          <Upload size={24} />
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-bold text-primary">
                            {submissionFile ? submissionFile.name : "Click or drag file to upload"}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-1">PDF, DOCX, JPG (Max 10MB)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-8 py-5 bg-slate-50 border-t border-gray-100 flex justify-end gap-3">
                  <button type="button" onClick={() => setSubmittingTask(null)} className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-500">Cancel</button>
                  <button
                    type="submit"
                    disabled={submittingLoading}
                    className="px-8 py-2.5 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-secondary/20 hover:scale-105 transition-all disabled:opacity-50"
                  >
                    {submittingLoading ? "Submitting..." : "Finish Submission"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;

