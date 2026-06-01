import React, { useState, useEffect, useCallback } from 'react';
import {
    Search, Users, Eye, SquarePen, Trash2, UserPlus, Filter,
    FileSpreadsheet, FileDown, Menu, CheckCircle, Smartphone, Mail,
    ArrowRight, UserCheck, RefreshCw, Plus, Zap, X, AlertCircle,
    ChevronDown, FileText, FilePieChart, Upload
} from 'lucide-react';
import AdmissionForm from '../../../../components/AdmissionForm';
import StudentProfile from '../../../admpages/StudentProfile';
import {
    getAllStudents,
    deleteStudent,
    getStudentById,
    archiveStudent,
    importStudents,
    bulkUploadStudentDocuments
} from '../../../../services/studentAPI';
import { getClassrooms } from '../../../../services/classroomAPI';
import { toast } from 'react-toastify';
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import DataTable from '../../../admcomponents/DataTable';
import { useAcademicYear } from '../../../../context/AcademicYearContext';

/**
 * Student - Institutional Student Database (Counsellor Variant)
 * Refined to the 'Simplified Premium' aesthetic. Promotion features removed for counsellors.
 */
const Student = ({ toggleSidebar }) => {
    const { selectedYear: globalYear } = useAcademicYear();
    // Derive selectedYear from global context
    const selectedYear = globalYear?.year_name || '';

    const [isAdmissionOpen, setIsAdmissionOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewingStudent, setViewingStudent] = useState(null);
    const [editingStudent, setEditingStudent] = useState(null);
    const [selectedGrade, setSelectedGrade] = useState('');

    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [classroomsList, setClassroomsList] = useState([]);

    // Pagination & Mobile UI State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [showImportDropdown, setShowImportDropdown] = useState(false);
    const [importAccept, setImportAccept] = useState('.xlsx, .xls, .csv, .pdf');


    // Update classrooms when global year changes
    useEffect(() => {
        const updateClassrooms = async () => {
            if (globalYear?.id) {
                try {
                    const classrooms = await getClassrooms(globalYear.id);
                    setClassroomsList(classrooms);
                } catch (error) {
                    console.error("Framework Error [UpdateClassrooms]:", error);
                }
            }
        };
        updateClassrooms();
    }, [globalYear]);

    const fetchStudents = useCallback(async () => {
        if (!selectedYear) return;
        try {
            setLoading(true);
            const data = await getAllStudents(selectedYear, selectedGrade);
            const mappedData = data.map(s => {
                const lastName = s.last_name || '';
                const firstName = s.first_name || '';
                const middleName = s.middle_name || '';
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

    const handleArchiveStudent = async (student) => {
        const reason = prompt("Enter Archival Reason (e.g. Completed 10th, Left School):");
        if (!reason) return;

        const leavingDate = prompt("Enter Leaving Date (YYYY-MM-DD):", new Date().toISOString().split('T')[0]);
        if (!leavingDate) return;

        try {
            await archiveStudent(student.id, leavingDate, reason);
            toast.success("Institutional Record moved to Alumni Archive");
            setViewingStudent(null);
            fetchStudents();
        } catch {
            toast.error("Archival Transaction Failed");
        }
    };

    const filteredStudents = students.filter(student => {
        const matchesSearch = student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.srNo?.includes(searchTerm);

        const status = (student.status || '').toLowerCase().trim();
        const isExitStatus = ['promoted', 'alumni', 'graduated', 'left', 'dropped', 'inactive', 'suspended', 'withdrawn', 'transferred'].includes(status);

        return matchesSearch && !isExitStatus;
    });

    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
    const paginatedStudents = filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedGrade]);

    const handleEditClick = async (studentToEdit) => {
        try {
            const fullStudentData = await getStudentById(studentToEdit.id);
            setEditingStudent(fullStudentData);
        } catch {
            toast.error("Terminal Error: Full Profile Data unreachable");
        }
    };

    const handleImportFile = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setIsImporting(true);
            toast.info("Institutional Logic: Synchronizing master registry...");
            await importStudents(file);
            toast.success("Master Registry Synchronized successfully.");
            fetchStudents();
        } catch (error) {
            console.error("Import Error:", error);
            toast.error("Synchronization Failure: Master records could not be reconciled.");
        } finally {
            setIsImporting(false);
            setShowImportDropdown(false);
            e.target.value = null;
        }
    };

    const handleBulkDocUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        try {
            setIsImporting(true);
            toast.info(`Institutional Logic: Uploading ${files.length} documents...`);
            const response = await bulkUploadStudentDocuments(files);
            const { summary } = response;
            toast.success(`Upload Complete: ${summary.successCount} synced, ${summary.failedCount} skipped.`);
            fetchStudents();
        } catch (error) {
            console.error("Bulk Doc Upload Error:", error);
            toast.error("Terminal Error: Bulk document transmission failed.");
        } finally {
            setIsImporting(false);
            setShowImportDropdown(false);
            e.target.value = null;
        }
    };

    const triggerImport = (acceptType) => {
        setImportAccept(acceptType);
        setTimeout(() => {
            document.getElementById('student-import-input').click();
        }, 0);
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
            <ModuleHeader
                title={isAdmissionOpen || editingStudent ? (editingStudent ? "Edit Profile" : "New Enrollment") : "Student Desk"}
                subTitle="Grace ERP Institutional Registry"
                badge={selectedYear || "---"}
                toggleSidebar={toggleSidebar}
                showSearch={true}
                hideDesktopSearch={true}
                searchValue={searchTerm}
                onSearchChange={(val) => {
                    setSearchTerm(val);
                    setCurrentPage(1);
                }}
                onSearchToggle={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            >
                <div className="flex items-center gap-2 h-full">
                    <button
                        onClick={() => setIsAdmissionOpen(true)}
                        className="lg:hidden p-2 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-black hover:text-white transition-all shadow-xl active:scale-95"
                        title="New Enrollment"
                    >
                        <Plus size={18} />
                    </button>

                    <select
                        value={selectedGrade}
                        onChange={(e) => setSelectedGrade(e.target.value)}
                        className="bg-white border cursor-pointer border-slate-200 text-[10px] font-bold px-2 py-2 lg:px-4 lg:py-3 rounded-xl shadow-sm outline-none focus:border-indigo-400 transition-all max-w-[100px] lg:max-w-none"
                    >
                        <option value="">Grade</option>
                        {classroomsList.map(c => (
                            <option key={c.id} value={c.class_name}>{c.class_name}</option>
                        ))}
                    </select>
                </div>
            </ModuleHeader>

            <div className={`flex flex-col lg:flex-row items-center gap-4 py-6 rounded-2xl mb-4 ${!isMobileSearchOpen ? 'hidden lg:flex' : 'flex animate-in slide-in-from-top-2 duration-300'}`}>
                <div className="flex flex-1 w-full relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-40" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        placeholder="Search Registry..."
                        className="w-full pl-11 pr-4 py-4 border border-black rounded-xl text-primary text-[10px] font-black uppercase tracking-widest outline-none shadow-sm transition-all bg-white"
                    />
                </div>

                <div className="flex items-center gap-2 relative">
                    <input type="file" id="student-import-input" className="hidden" accept={importAccept} onChange={handleImportFile} />
                    <input type="file" id="bulk-doc-upload" className="hidden" multiple accept=".jpg, .jpeg, .pdf" onChange={handleBulkDocUpload} />

                    <div className="relative group">
                        <button
                            onClick={() => setShowImportDropdown(!showImportDropdown)}
                            disabled={isImporting}
                            className="flex items-center gap-3 px-6 py-4 bg-white border border-black rounded-xl text-primary text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95 whitespace-nowrap"
                        >
                            {isImporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                            {isImporting ? "Importing..." : "Import"}
                            <ChevronDown className={`w-3 h-3 transition-transform ${showImportDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {showImportDropdown && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-black rounded-xl shadow-2xl z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                <button onClick={() => triggerImport('.xlsx, .xls')} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 text-[10px] font-bold text-primary uppercase tracking-widest transition-colors">
                                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Excel (.xlsx)
                                </button>
                                <button onClick={() => triggerImport('.csv')} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 text-[10px] font-bold text-primary uppercase tracking-widest transition-colors">
                                    <FileText className="w-4 h-4 text-blue-600" /> CSV (.csv)
                                </button>
                                <button onClick={() => triggerImport('.pdf')} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 text-[10px] font-bold text-primary uppercase tracking-widest transition-colors">
                                    <FileText className="w-4 h-4 text-rose-600" /> PDF (.pdf)
                                </button>
                                <div className="h-px bg-slate-100 my-1"></div>
                                <button onClick={() => document.getElementById('bulk-doc-upload').click()} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 text-[10px] font-bold text-primary uppercase tracking-widest transition-colors">
                                    <FilePieChart className="w-4 h-4 text-indigo-600" /> Bulk Documents
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {!(isAdmissionOpen || editingStudent) ? (
                <DataTable
                    headers={[
                        { label: "Enrollment ID", className: "w-[100px] border-r border-black" },
                        { label: "Student Name", className: "min-w-[200px] border-r border-black" },
                        { label: "Class", className: "w-[100px] border-r border-black" },
                        { label: "Status", className: "w-[80px] border-r border-black" },
                        { label: "Parent Details", className: "border-r border-black" },
                        { label: "Actions", className: "text-center min-w-[120px]" }
                    ]}
                    columnCount={6}
                    loading={loading}
                    emptyMessage="No Student Records Synced"
                    footer={
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-institutional-muted">
                                Showing <span className="text-institutional-main">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="text-institutional-main">{Math.min(currentPage * itemsPerPage, filteredStudents.length)}</span> of <span className="text-institutional-main">{filteredStudents.length}</span> entries
                            </p>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 bg-white border border-table rounded text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">Prev</button>
                                <div className="flex items-center gap-1 px-4">
                                    <span className="text-[10px] font-black text-institutional-main uppercase">Page {currentPage} of {totalPages || 1}</span>
                                </div>
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="px-4 py-2 bg-white border border-table rounded text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">Next</button>
                            </div>
                        </div>
                    }
                >
                    {paginatedStudents.map((student, idx) => (
                        <tr key={idx} className="hover-table-row transition-colors group">
                            <td className="px-4 py-4 border-b border-r border-black">
                                <span className="text-[10px] font-black text-table-cell bg-white px-3 py-1.5 rounded-lg border border-black shadow-sm whitespace-nowrap">{student.srNo}</span>
                            </td>
                            <td className="px-4 py-2 border-b border-r border-black">
                                <p className="text-[12px] font-bold text-table-cell uppercase tracking-tight">{student.name}</p>
                            </td>
                            <td className="px-4 py-2 border-b border-r border-black text-center">
                                <span className="px-4 py-2 bg-white text-table-cell text-[11px] font-bold rounded-lg border border-black uppercase tracking-widest whitespace-nowrap">{student.grade}</span>
                            </td>
                            <td className="px-4 py-2 border-b border-r border-black text-center">
                                <span className={`px-4 py-2 text-[10px] font-black rounded-lg uppercase tracking-widest border border-black/5 ${student.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                    {student.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 border-b border-r border-black">
                                <p className="text-[12px] font-bold text-table-cell uppercase leading-tight">{student.parent}</p>
                                <p className="text-[12px] font-bold text-black font-mono mt-1 tracking-tighter">{student.phone}</p>
                            </td>
                            <td className="px-6 py-4 text-right border-b border-black">
                                <div className="flex items-center justify-end gap-3">
                                    <button onClick={() => setViewingStudent(student)} className="p-2.5 bg-white border border-black text-table-cell rounded-xl hover:bg-gray-400 hover:text-white transition-all shadow-sm active:scale-95" title="View Profile"><Eye className="w-4 h-4" /></button>
                                    <button onClick={() => handleEditClick(student)} className="p-2.5 bg-white border border-black text-table-cell rounded-xl hover:bg-amber-400 hover:text-white transition-all shadow-sm active:scale-95" title="Edit Profile"><SquarePen className="w-4 h-4" /></button>
                                    <button onClick={() => handleDeleteStudent(student.id)} className="p-2.5 bg-white border border-black text-table-cell rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-95" title="Delete Record"><Trash2 className="w-4 h-4" /></button>
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
        </div>
    );
};

export default Student;
