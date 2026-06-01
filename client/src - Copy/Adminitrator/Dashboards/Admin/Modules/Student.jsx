import React, { useState, useEffect, useCallback } from 'react';
import {
    Search, Users, Eye, SquarePen, Trash2, UserPlus, Filter,
    FileSpreadsheet, FileDown, Menu, CheckCircle, Smartphone, Mail,
    ArrowRight, UserCheck, RefreshCw, Plus, Zap, X, AlertCircle
} from 'lucide-react';
import AdmissionForm from '../../../../components/AdmissionForm';
import StudentProfile from '../../../admpages/StudentProfile';
import {
    getAllStudents,
    deleteStudent,
    getStudentById,
    promoteStudents,
    archiveStudent,
    getAcademicYearsList
} from '../../../../services/studentAPI';
import { toast } from 'react-toastify';
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import DataTable from '../../../admcomponents/DataTable';

/**
 * Student - Institutional Student Database
 * Refined to the 'Simplified Premium' aesthetic with rounded-2xl and 1px borders.
 */
const Student = ({ toggleSidebar }) => {
    const [isAdmissionOpen, setIsAdmissionOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewingStudent, setViewingStudent] = useState(null);
    const [editingStudent, setEditingStudent] = useState(null);
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedGrade, setSelectedGrade] = useState('');
    const [academicYearsList, setAcademicYearsList] = useState([]);
    const [students, setStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showPromoteModal, setShowPromoteModal] = useState(false);
    const [promotionData, setPromotionData] = useState({
        fromYearId: null,
        fromYearName: '',
        toYearId: null
    });

    /**
     * Bootstraps the module by loading the list of academic years.
     * Selects the 'active' year by default to drive the student matrix.
     */
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const response = await getAcademicYearsList();
                setAcademicYearsList(response);
                const activeYear = response.find(y => y.is_active);
                if (activeYear) {
                    setSelectedYear(activeYear.year_name);
                } else if (response.length > 0) {
                    setSelectedYear(response[0].year_name);
                }
            } catch (error) {
                console.error("Framework Error [InitialData]:", error);
            }
        };
        loadInitialData();
    }, []);

    /**
     * Refreshes the student registry from the server based on the active selection.
     * Maps raw database fields to standardized UI keys used by the DataTable.
     */

    const fetchStudents = useCallback(async () => {
        if (!selectedYear) return;
        try {
            setLoading(true);
            const data = await getAllStudents(selectedYear, selectedGrade);
            const mappedData = data.map(s => {
                const lastName = s.last_name || '';
                const firstName = s.first_name || '';
                const middleName = s.middle_name || '';
                // Format: Last Name First Name Middle Name (Father Name)
                const fullName = `${lastName} ${firstName} ${middleName}`.replace(/\s+/g, ' ').trim();

                return {
                    id: s.id,
                    srNo: s.student_id_no || s.id.toString(),
                    rollNo: s.roll_number || '---',
                    name: s.student_name || fullName || "---",
                    grade: s.grade || s.current_grade,
                    status: s.status || 'active',
                    parent: s.father_name || "---",
                    phone: s.father_mobile || "---",
                    email: s.father_email,
                    dob: s.dob,
                    // Raw data for AdmissionForm pre-fill
                    gr_no: s.gr_no,
                    pen_no: s.pen_no,
                    admission_date: s.admission_date,
                    age: s.age
                };
            });
            setStudents(mappedData);
        } catch {
            toast.error("Failed to load students");
        } finally {
            setLoading(false);
        }
    }, [selectedYear, selectedGrade]);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    const handleDeleteStudent = async (id) => {
        if (!window.confirm("CRITICAL: Permanently Delete this student record from registry?")) return;
        try {
            await deleteStudent(id);
            toast.success("Student record Deleted");
            fetchStudents();
        } catch {
            toast.error("Failed to update student records");
        }
    };

    /**
     * Transitions an active student into the archival 'Alumni' registry.
     * @param {Object} student - The student profile to archive
     */
    const handleArchiveStudent = async (student) => {
        const reason = prompt("Enter Archival Reason (e.g. Completed 10th, Left School):");
        if (!reason) return;

        const leavingDate = prompt("Enter Leaving Date (YYYY-MM-DD):", new Date().toISOString().split('T')[0]);
        if (!leavingDate) return;

        try {
            await archiveStudent(student.id, leavingDate, reason);
            toast.success("Institutional Record moved to Alumni Archive");
            setViewingStudent(null);
            fetchStudents(); // Refresh registry to reflect left status
        } catch {
            toast.error("Archival Transaction Failed");
        }
    };

    const openPromotionWizard = () => {
        if (selectedStudents.length === 0) {
            toast.warning("Registry: No students selected for promotion matrix");
            return;
        }

        const currentYear = academicYearsList.find(y => y.year_name === selectedYear);
        if (!currentYear) return;

        // Auto-detect next year logic
        const currentIndex = academicYearsList.findIndex(y => y.id === currentYear.id);
        const nextYear = academicYearsList[currentIndex - 1] || null; // List is DESC by year_name

        setPromotionData({
            fromYearId: currentYear.id,
            fromYearName: currentYear.year_name,
            toYearId: nextYear ? nextYear.id : null
        });
        setShowPromoteModal(true);
    };

    const handlePromoteSelected = async () => {
        if (!promotionData.toYearId) {
            toast.error("Institutional Logic: Destination year not specified");
            return;
        }

        try {
            setLoading(true);
            toast.info("Institutional Logic: Processing transition sequence...");
            await promoteStudents(selectedStudents, promotionData.toYearId);
            toast.success("Matrix Updated: Selected students transitioned successfully.");
            setSelectedStudents([]);
            setShowPromoteModal(false);
            fetchStudents();
        } catch (error) {
            console.error("Promotion Error:", error);
            toast.error("Promotion Sequence Terminated: Critical Synchronization Failure");
        } finally {
            setLoading(false);
        }
    };

    const toggleStudentSelection = (id) => {
        setSelectedStudents(prev =>
            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
        );
    };

    /**
     * Toggles the selection state for the entire filtered registry.
     * Useful for bulk actions like promoting an entire class.
     */
    const handleSelectAll = (checked) => {
        if (checked) {
            const allIds = filteredStudents.map(s => s.id);
            setSelectedStudents(allIds);
        } else {
            setSelectedStudents([]);
        }
    };

    const filteredStudents = students.filter(student => {
        const matchesSearch = student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.srNo?.includes(searchTerm);
        return matchesSearch;
    });

    /**
     * Prepares institutional records for editing by fetching the full student master profile.
     * @param {Object} studentToEdit - The shallow student object from the list
     */
    const handleEditClick = async (studentToEdit) => {
        try {
            const fullStudentData = await getStudentById(studentToEdit.id);
            setEditingStudent(fullStudentData);
        } catch {
            toast.error("Terminal Error: Full Profile Data unreachable");
        }
    };

    if (viewingStudent) {
        return (
            <StudentProfile
                student={viewingStudent}
                onBack={() => setViewingStudent(null)}
                onEdit={(student) => {
                    setEditingStudent(student);
                    setViewingStudent(null);
                }}
                onArchive={() => handleArchiveStudent(viewingStudent)}
            />
        );
    }

    return (
        <div className='p-4 md:p-8 bg-institutional-page min-h-screen font-sans'>

            {/* 1. Global Student Header */}
            <ModuleHeader
                title={isAdmissionOpen || editingStudent ? (editingStudent ? "Edit Profile" : "New Enrollment") : "Student Desk"}
                subTitle="Grace ERP Institutional Registry"
                icon={Users}
                toggleSidebar={toggleSidebar}
                showSearch={true}
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                hideDesktopSearch={true}
            >
                <div className="flex items-center gap-2 h-full">
                    {/* Add Student Plus Icon - Header (Mobile Only) */}
                    <button
                        onClick={() => setIsAdmissionOpen(true)}
                        className="lg:hidden p-3 bg-white/10 border border-white/20 rounded-xl text-amber-400 hover:bg-white/20 transition-all shadow-xl active:scale-90"
                        title="New Enrollment"
                    >
                        <Plus className="w-5 h-5" />
                    </button>

                    <select
                        value={selectedGrade}
                        onChange={(e) => setSelectedGrade(e.target.value)}
                        className="bg-white border border-slate-200 text-[10px] font-bold px-3 py-2 lg:px-4 lg:py-3 rounded-xl shadow-sm outline-none focus:border-indigo-400 transition-all max-w-[100px] lg:max-w-none"
                    >
                        <option value="">Grade</option>
                        {['Nursery', 'Jr.Kg', 'Sr.Kg', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'].map(g => (
                            <option key={g} value={g}>{g}</option>
                        ))}
                    </select>

                    <button
                        onClick={openPromotionWizard}
                        className="hidden lg:flex items-center gap-3 px-6 py-3.5 btn-add-institutional text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl hover:bg-emerald-600 transition-all active:scale-95 whitespace-nowrap"
                    >
                        <UserCheck size={18} />
                        PROMOTE ALL {selectedStudents.length > 0 ? `(${selectedStudents.length})` : ''}
                    </button>
                </div>
            </ModuleHeader>



            {/* 2. Content Switching: DataTable OR AdmissionForm */}
            {!(isAdmissionOpen || editingStudent) ? (
                <DataTable
                    headers={[
                        { label: "Enrollment ID", className: "w-[100px]" },
                        { label: "Student Name", className: "min-w-[200px]" },
                        { label: "Class", className: "w-[100px]" },
                        { label: "Status", className: "w-[80px]" },
                        { label: "Parent Details" },
                        {
                            label: (
                                <div className="flex flex-col lg:flex-row    items-center gap-1.5">
                                    <span className="text-[9px] ">Promote All</span>
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-slate-300 pointer-events-auto"
                                        checked={filteredStudents.length > 0 && selectedStudents.length === filteredStudents.length}
                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                    />
                                </div>
                            ),
                            className: "text-center w-[40px]"
                        },
                        { label: "Actions", className: "text-center min-w-[120px]" }
                    ]}
                    columnCount={7}
                    loading={loading}
                    emptyMessage="No Student Records Synced"
                    footer={
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase text-institutional-muted">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-black animate-pulse" />
                                <span>Active Year : {selectedYear}</span>
                            </div>
                            <span className="tracking-widest">{filteredStudents.length} Profiles Resolved</span>
                        </div>
                    }
                >
                    {filteredStudents.map((student, idx) => (
                        <tr key={idx} className="hover-table-row transition-colors group">
                            <td className="px-4 py-4 border-b-table border-r-table">
                                <span className="text-[10px] font-black text-table-cell bg-white px-3 py-1.5 rounded-lg  shadow-sm whitespace-nowrap">
                                    {student.srNo}
                                </span>
                            </td>
                            <td className="px-4 py-2 border-b-table border-r-table">
                                <p className="text-[12px] font-bold text-table-cell uppercase tracking-tight">{student.name}</p>
                            </td>
                            <td className="px-4 py-2 border-b-table border-r-table text-center">
                                <span className="px-4 py-2 bg-white text-table-cell text-[11px] font-bold rounded-lg border-table uppercase tracking-widest whitespace-nowrap">
                                    {student.grade}
                                </span>
                            </td>
                            <td className="px-4 py-2 border-b-table border-r-table text-center">
                                <span className={`px-4 py-2 text-[10px] font-black rounded-lg uppercase tracking-widest ${student.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                    {student.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 border-b-table border-r-table">
                                <p className="text-[12px] font-bold text-table-cell uppercase leading-tight">{student.parent}</p>
                                <p className="text-[10px] font-bold text-slate-400 font-mono mt-1">{student.phone}</p>
                            </td>
                            <td className="px-6 py-4 border-b-table border-r-table text-center">
                                <input
                                    type="checkbox"
                                    checked={selectedStudents.includes(student.id)}
                                    onChange={() => toggleStudentSelection(student.id)}
                                    className="w-5 h-5 rounded-md border-slate-300 text-(--sidebar-bg) focus:ring-(--sidebar-bg) cursor-pointer"
                                />
                            </td>
                            <td className="px-6 py-4 text-right border-b-table">
                                <div className="flex items-center justify-end gap-3">
                                    <button
                                        onClick={() => setViewingStudent(student)}
                                        className="p-2 bg-white border-table text-table-cell rounded-xl cursor-pointer hover:bg-gray-400 hover:text-white transition-all shadow-sm active:scale-95"
                                        title="View Profile"
                                    >
                                        <Eye className="w-3 h-3" />
                                    </button>
                                    <button
                                        onClick={() => handleEditClick(student)}
                                        className="p-2 bg-white border-table text-table-cell rounded-xl cursor-pointer hover:bg-gray-400 hover:text-white transition-all shadow-sm active:scale-95"
                                        title="Edit Profile"
                                    >
                                        <SquarePen className="w-3 h-3" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteStudent(student.id)}
                                        className="p-2 bg-white border-table text-table-cell rounded-xl cursor-pointer hover:bg-gray-400 hover:text-white transition-all shadow-sm active:scale-95"
                                        title="Delete Record"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </DataTable>
            ) : (
                <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <AdmissionForm
                        editData={editingStudent}
                        onClose={() => {
                            setIsAdmissionOpen(false);
                            setEditingStudent(null);
                            fetchStudents();
                        }}
                    />
                </div>
            )}

            {/* PROMOTION WIZARD MODAL */}
            {showPromoteModal && (
                <div className="fixed inset-0 bg-[#001736]/90 backdrop-blur-md z-120 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-white/20 p-10 animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center mb-10 border-b border-slate-100 pb-10">
                            <div>
                                <h2 className="text-3xl font-bold text-[#001736] uppercase tracking-tight leading-none">STUDENT <br /><span className="text-amber-500">PROMOTION</span></h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4 italic">Sequential Transition: From {promotionData.fromYearName}</p>
                            </div>
                            <button onClick={() => setShowPromoteModal(false)} className="p-3 bg-slate-50 rounded-xl text-slate-300 hover:text-rose-500 transition-all border border-slate-100">
                                <X className="w-8 h-8" />
                            </button>
                        </div>

                        <div className="space-y-10 text-left">
                            <div className="bg-[#001736] p-8 rounded-xl text-white shadow-xl shadow-[#001736]/10 text-left">
                                <label className="block text-[10px] font-bold uppercase text-amber-400 mb-4 tracking-widest ml-1">Destination Academic Cycle</label>
                                <select
                                    value={promotionData.toYearId || ''}
                                    onChange={(e) => setPromotionData(prev => ({ ...prev, toYearId: e.target.value }))}
                                    className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-xl font-bold text-white focus:border-amber-400 outline-none transition-all cursor-pointer uppercase text-[12px] tracking-widest"
                                >
                                    <option value="" className="bg-[#001736]">Identify Target Year</option>
                                    {academicYearsList.filter(y => y.id !== promotionData.fromYearId).map(y => (
                                        <option key={y.id} value={y.id} className="bg-[#001736]">{y.year_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-8">
                                <div className="p-8 bg-black/5 rounded-xl border border-black/10 flex flex-col gap-4">
                                    <h5 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Institutional Sequence Overview</h5>
                                    <p className="text-[11px] font-medium text-slate-500 leading-relaxed uppercase tracking-tight">
                                        You are promoting <span className="text-primary font-bold">{selectedStudents.length} selected students</span> to the <span className="text-primary font-bold">{academicYearsList.find(y => y.id == promotionData.toYearId)?.year_name || '...'}</span> session.
                                        <br /><br />
                                        <span className="text-amber-600 font-bold italic">Note: All 10th Grade students in this selection will be automatically archived as Alumni. standard grade-to-grade progression will be applied to others.</span>
                                    </p>
                                </div>
                            </div>

                            {/* Warning Indicator */}
                            <div className="bg-rose-50 p-6 rounded-xl border border-rose-100 flex gap-5 items-start">
                                <AlertCircle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5 opacity-60" />
                                <p className="text-[10px] font-bold text-rose-500 leading-relaxed uppercase tracking-widest opacity-80">
                                    PROMOTION PROTOCOL WARNING: THIS ACTION WILL UPDATE SELECTED STUDENT RECORDS GLOBALLY. VERIFY THE DESTINATION YEAR BEFORE PROCEEDING.
                                </p>
                            </div>

                            <button
                                onClick={handlePromoteSelected}
                                disabled={!promotionData.toYearId || loading}
                                className="w-full bg-[#001736] text-white py-6 rounded-xl font-bold text-[12px] uppercase tracking-[0.4em] shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-4 disabled:opacity-50 mt-4 active:scale-[0.98]"
                            >
                                {loading ? "SYNCHRONIZING RECORDS..." : "EXECUTE TRANSITION"} <Zap className="w-5 h-5 text-amber-400 opacity-40 shrink-0" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Student;
