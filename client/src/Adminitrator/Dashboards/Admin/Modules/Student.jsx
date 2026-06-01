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
    promoteStudents,
    archiveStudent,
    getAcademicYearsList,
    importStudents,
    bulkUploadStudentDocuments
} from '../../../../services/studentAPI';
import { getClassrooms } from '../../../../services/classroomAPI';
import { toast } from 'react-toastify';
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import DataTable from '../../../admcomponents/DataTable';
import { useAcademicYear } from '../../../../context/AcademicYearContext';
import * as XLSX from 'xlsx';

/**
 * Student - Institutional Student Database
 * Refined to the 'Simplified Premium' aesthetic with rounded-2xl and 1px borders.
 */
const Student = ({ toggleSidebar }) => {
    const { selectedYear: globalYear, allYears: globalAllYears } = useAcademicYear();
    const [isAdmissionOpen, setIsAdmissionOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewingStudent, setViewingStudent] = useState(null);
    const [editingStudent, setEditingStudent] = useState(null);
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
    const [classroomsList, setClassroomsList] = useState([]);

    // Derive selectedYear from global context
    const selectedYear = globalYear?.year_name || '';

    // Pagination & Mobile UI State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [showImportDropdown, setShowImportDropdown] = useState(false);
    const [importAccept, setImportAccept] = useState('.xlsx, .xls, .csv, .pdf');

    /**
     * Bootstraps the module by loading the list of academic years.
     * Uses global context year; also loads classrooms for current year.
     */
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const response = await getAcademicYearsList();
                setAcademicYearsList(response);
            } catch (error) {
                console.error("Framework Error [InitialData]:", error);
            }
        };
        loadInitialData();
    }, []);

    // Keep academicYearsList in sync with global context years too
    useEffect(() => {
        if (globalAllYears?.length > 0) {
            setAcademicYearsList(globalAllYears);
        }
    }, [globalAllYears]);

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

    // Update classrooms whenever global year changes
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
            const errMsg = error.response?.data?.error || "Promotion Sequence Terminated: Critical Synchronization Failure";
            toast.error(errMsg);
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

        // Ensure we only show active students (hide Promoted/Alumni/Graduated/Left/etc)
        const status = (student.status || '').toLowerCase().trim();
        const isExitStatus = ['promoted', 'alumni', 'graduated', 'left', 'dropped', 'inactive', 'suspended', 'withdrawn', 'transferred'].includes(status);

        return matchesSearch && !isExitStatus;
    });

    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
    const paginatedStudents = filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedGrade]);

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

    const handleImportFile = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setIsImporting(true);
            toast.info("Institutional Logic: Reading records for validation...");

            // Client-side Duplicate Pre-validation using XLSX
            const fileData = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (evt) => resolve(evt.target.result);
                reader.onerror = (err) => reject(err);
                reader.readAsArrayBuffer(file);
            });

            const wb = XLSX.read(fileData, { type: 'array' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const sheetData = XLSX.utils.sheet_to_json(ws);

            if (sheetData && sheetData.length > 0) {
                const grNoMap = new Map();
                const aadharNoMap = new Map();
                const internalDuplicates = [];
                const localDuplicates = [];

                sheetData.forEach((row, index) => {
                    const rowNum = index + 2; // 1-indexed row number, header is row 1
                    
                    // Match any case/formatting variations of gr_no/grNo/gr number
                    const grNoKey = Object.keys(row).find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === 'grno');
                    const aadharNoKey = Object.keys(row).find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === 'aadharno');

                    const grNo = grNoKey && row[grNoKey] ? String(row[grNoKey]).trim() : null;
                    const aadharNo = aadharNoKey && row[aadharNoKey] ? String(row[aadharNoKey]).trim() : null;

                    if (grNo) {
                        if (grNoMap.has(grNo)) {
                            internalDuplicates.push(`Row ${rowNum} & Row ${grNoMap.get(grNo)} share duplicate GR No '${grNo}'`);
                        } else {
                            grNoMap.set(grNo, rowNum);
                        }

                        // Check duplicate against existing students loaded in registry
                        const matchingLocal = students.find(s => s.gr_no && String(s.gr_no).trim() === grNo);
                        if (matchingLocal) {
                            localDuplicates.push(`Row ${rowNum} GR No '${grNo}' matches registered student '${matchingLocal.name}'`);
                        }
                    }

                    if (aadharNo) {
                        if (aadharNoMap.has(aadharNo)) {
                            internalDuplicates.push(`Row ${rowNum} & Row ${aadharNoMap.get(aadharNo)} share duplicate Aadhar No '${aadharNo}'`);
                        } else {
                            aadharNoMap.set(aadharNo, rowNum);
                        }
                    }
                });

                if (internalDuplicates.length > 0) {
                    toast.error(
                        <div>
                            <span className="font-bold block text-sm mb-1">Spreadsheet Duplicate Error</span>
                            <span className="block text-xs mb-2">Please clean duplicate records in your file:</span>
                            <ul className="list-disc pl-4 text-[10px] space-y-1">
                                {internalDuplicates.slice(0, 5).map((dup, i) => <li key={i}>{dup}</li>)}
                                {internalDuplicates.length > 5 && <li className="font-bold">... and {internalDuplicates.length - 5} more</li>}
                            </ul>
                        </div>,
                        { autoClose: 10000 }
                    );
                    setIsImporting(false);
                    setShowImportDropdown(false);
                    e.target.value = null;
                    return;
                }

                if (localDuplicates.length > 0) {
                    toast.warning(
                        <div>
                            <span className="font-bold block text-sm mb-1">Registry Conflict Alert</span>
                            <span className="block text-xs mb-2">The following GR Numbers already exist in system:</span>
                            <ul className="list-disc pl-4 text-[10px] space-y-1">
                                {localDuplicates.slice(0, 5).map((dup, i) => <li key={i}>{dup}</li>)}
                                {localDuplicates.length > 5 && <li className="font-bold">... and {localDuplicates.length - 5} more</li>}
                            </ul>
                        </div>,
                        { autoClose: 10000 }
                    );
                }
            }

            toast.info("Institutional Logic: Synchronizing master registry...");
            const resData = await importStudents(file);

            if (resData && resData.failed > 0) {
                // Find all duplicate entry errors from backend response
                const duplicates = resData.errors.filter(err => 
                    err.error.includes("Duplicate entry") || 
                    err.error.includes("Duplicate Entry") ||
                    err.error.includes("ER_DUP_ENTRY")
                );

                if (duplicates.length > 0) {
                    const rowList = duplicates.map(err => `Row ${err.row}`).join(', ');
                    toast.warning(`Master Registry Sync: Duplicates skipped at ${rowList}`, {
                        autoClose: 10000
                    });
                }

                // Show a clean summary error toast for failed/skipped rows
                toast.error(`Sync Alert: ${resData.failed} records skipped or failed to import.`);
            } else {
                toast.success("Master Registry Synchronized successfully.");
            }
            fetchStudents();
        } catch (error) {
            console.error("Import Error:", error);
            const errMsg = error.response?.data?.error || "Synchronization Failure: Master records could not be reconciled.";
            toast.error(errMsg);
        } finally {
            setIsImporting(false);
            setShowImportDropdown(false);
            e.target.value = null; // Clear input
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

            if (summary.failedCount > 0) {
                console.warn("Failed Documents:", response.results.failed);
            }

            fetchStudents();
        } catch (error) {
            console.error("Bulk Doc Upload Error:", error);
            toast.error("Terminal Error: Bulk document transmission failed.");
        } finally {
            setIsImporting(false);
            setShowImportDropdown(false);
            e.target.value = null; // Clear input
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

            {/* 1. Global Student Header */}
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
                    <select
                        value={selectedGrade}
                        onChange={(e) => setSelectedGrade(e.target.value)}
                        className="hidden lg:block bg-white border cursor-pointer border-slate-200 text-[10px] font-bold px-2 py-2 lg:px-4 rounded-md shadow-sm outline-none focus:border-indigo-400 transition-all max-w-[100px] lg:max-w-none"
                    >
                        <option value="">Grade</option>
                        {classroomsList.map(c => (
                            <option key={c.id} value={c.class_name}>{c.class_name}</option>
                        ))}
                    </select>

                    <button
                        onClick={openPromotionWizard}
                        className="hidden cursor-pointer lg:flex items-center gap-3 px-6 py-2 btn-add-institutional text-white rounded-md font-black text-[11px] uppercase tracking-widest shadow-2xl hover:bg-emerald-600 transition-all active:scale-95 whitespace-nowrap"
                    >
                        <UserCheck size={16} />
                        <span>PROMOTE ALL</span>
                        {selectedStudents.length > 0 ? ` (${selectedStudents.length})` : ''}
                    </button>
                </div>
            </ModuleHeader>

            {/* 2. Registry Action Bar (Mobile Variant) */}
            <div className={`flex flex-col lg:flex-row items-center gap-4 py-3 rounded-2xl mb-2 ${!isMobileSearchOpen ? 'hidden lg:flex' : 'flex animate-in slide-in-from-top-2 duration-300'}`}>
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
                        className="w-full pl-11 pr-4 py-3 border border-black rounded-md text-primary text-[10px] font-black uppercase tracking-widest outline-none shadow-sm transition-all bg-white"
                    />
                </div>

                <div className="flex flex-col lg:flex-row items-center gap-2 relative w-full lg:w-auto">
                    <input
                        type="file"
                        id="student-import-input"
                        className="hidden"
                        accept={importAccept}
                        onChange={handleImportFile}
                    />
                    <input
                        type="file"
                        id="bulk-doc-upload"
                        className="hidden"
                        multiple
                        accept=".jpg, .jpeg, .pdf"
                        onChange={handleBulkDocUpload}
                    />

                    <div className="grid grid-cols-2 gap-2 w-full lg:hidden">
                        <select
                            value={selectedGrade}
                            onChange={(e) => setSelectedGrade(e.target.value)}
                            className="bg-white border cursor-pointer border-slate-200 text-[10px] font-bold px-4 py-3 rounded-md shadow-sm outline-none focus:border-indigo-400 transition-all w-full"
                        >
                            <option value="">Grade</option>
                            {classroomsList.map(c => (
                                <option key={c.id} value={c.class_name}>{c.class_name}</option>
                            ))}
                        </select>

                        <button
                            onClick={openPromotionWizard}
                            className="flex justify-center items-center gap-2 px-3 py-3 btn-add-institutional text-white rounded-md font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-emerald-600 transition-all active:scale-95 whitespace-nowrap"
                        >
                            <UserCheck size={14} />
                            PROMOTE {selectedStudents.length > 0 ? `(${selectedStudents.length})` : ''}
                        </button>
                    </div>

                    <div className="relative group w-full lg:w-auto">
                        <button
                            onClick={() => setShowImportDropdown(!showImportDropdown)}
                            disabled={isImporting}
                            className="flex w-full justify-center lg:w-auto items-center gap-3 px-6 py-3 bg-white border border-black rounded-md text-primary text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95 whitespace-nowrap"
                            title="Import Student Records"
                        >
                            {isImporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                            {isImporting ? "Importing..." : "Import"}
                            <ChevronDown className={`w-3 h-3 transition-transform ${showImportDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {showImportDropdown && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-black rounded-md shadow-2xl z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                <button
                                    onClick={() => triggerImport('.xlsx, .xls')}
                                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 text-[10px] font-bold text-primary uppercase tracking-widest transition-colors"
                                >
                                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                                    Excel (.xlsx)
                                </button>
                                <button
                                    onClick={() => triggerImport('.csv')}
                                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 text-[10px] font-bold text-primary uppercase tracking-widest transition-colors"
                                >
                                    <FileText className="w-4 h-4 text-blue-600" />
                                    CSV (.csv)
                                </button>
                                <button
                                    onClick={() => triggerImport('.pdf')}
                                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 text-[10px] font-bold text-primary uppercase tracking-widest transition-colors"
                                >
                                    <FileText className="w-4 h-4 text-rose-600" />
                                    PDF (.pdf)
                                </button>
                                <div className="h-px bg-slate-100 my-1"></div>
                                <button
                                    onClick={() => document.getElementById('bulk-doc-upload').click()}
                                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 text-[10px] font-bold text-primary uppercase tracking-widest transition-colors"
                                >
                                    <FilePieChart className="w-4 h-4 text-indigo-600" />
                                    Bulk Documents
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>



            {/* 2. Content Switching: DataTable OR AdmissionForm */}
            {!(isAdmissionOpen || editingStudent) ? (
                <DataTable
                    headers={[
                        { label: "Enrollment ID", className: "w-[100px] border-r border-black" },
                        { label: "Student Name", className: "min-w-[200px] border-r border-black" },
                        { label: "Class", className: "w-[100px] border-r border-black" },
                        { label: "Status", className: "w-[80px] border-r border-black" },
                        { label: "Parent Details", className: "border-r border-black" },
                        {
                            label: (
                                <div className="flex flex-col lg:flex-row items-center gap-1.5 justify-center">
                                    <span className="text-[9px]">Promote</span>
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-black pointer-events-auto"
                                        checked={filteredStudents.length > 0 && selectedStudents.length === filteredStudents.length}
                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                    />
                                </div>
                            ),
                            className: "text-center w-[60px] border-r border-black"
                        },
                        { label: "Actions", className: "text-center min-w-[120px]" }
                    ]}
                    columnCount={7}
                    loading={loading}
                    emptyMessage="No Student Records Synced"
                    footer={
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-institutional-muted">
                                Showing <span className="text-institutional-main">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="text-institutional-main">{Math.min(currentPage * itemsPerPage, filteredStudents.length)}</span> of <span className="text-institutional-main">{filteredStudents.length}</span> entries
                            </p>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 bg-white border border-table rounded text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    Prev
                                </button>
                                <div className="flex items-center gap-1 px-4">
                                    <span className="text-[10px] font-black text-institutional-main uppercase">Page {currentPage} of {totalPages || 1}</span>
                                </div>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    className="px-4 py-2 bg-white border border-table rounded text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    }
                >
                    {paginatedStudents.map((student, idx) => (
                        <tr key={idx} className="hover-table-row transition-colors group">
                            <td className="px-4 py-4 border-b border-r border-black">
                                <span className="text-[10px] font-black text-table-cell bg-white px-3 py-1.5 rounded-lg border border-black shadow-sm whitespace-nowrap">
                                    {student.srNo}
                                </span>
                            </td>
                            <td className="px-4 py-2 border-b border-r border-black">
                                <p className="text-[12px] font-bold text-table-cell uppercase tracking-tight">{student.name}</p>
                            </td>
                            <td className="px-4 py-2 border-b border-r border-black text-center">
                                <span className="px-4 py-2 bg-white text-table-cell text-[11px] font-bold rounded-lg border border-black uppercase tracking-widest whitespace-nowrap">
                                    {student.grade}
                                </span>
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
                            <td className="px-6 py-4 border-b border-r border-black text-center">
                                <input
                                    type="checkbox"
                                    checked={selectedStudents.includes(student.id)}
                                    onChange={() => toggleStudentSelection(student.id)}
                                    className="w-5 h-5 rounded-md border-black/20 text-primary focus:ring-primary cursor-pointer accent-black"
                                />
                            </td>
                            <td className="px-6 py-4 text-right border-b border-black">
                                <div className="flex items-center justify-end gap-3">
                                    <button
                                        onClick={() => setViewingStudent(student)}
                                        className="p-2.5 bg-white border border-black text-table-cell rounded-md cursor-pointer hover:bg-gray-400 hover:text-white transition-all shadow-sm active:scale-95"
                                        title="View Profile"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleEditClick(student)}
                                        className="p-2.5 bg-white border border-black text-table-cell rounded-md cursor-pointer hover:bg-amber-400 hover:text-white transition-all shadow-sm active:scale-95"
                                        title="Edit Profile"
                                    >
                                        <SquarePen className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteStudent(student.id)}
                                        className="p-2.5 bg-white border border-black text-table-cell rounded-md cursor-pointer hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-95"
                                        title="Delete Record"
                                    >
                                        <Trash2 className="w-4 h-4" />
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
                                <h2 className="text-3xl font-bold text-[#001736] uppercase tracking-tight leading-none">STUDENT <span className="text-amber-500">PROMOTION</span></h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4 italic">Sequential Transition: From {promotionData.fromYearName}</p>
                            </div>
                            <button onClick={() => setShowPromoteModal(false)} className="p-3 bg-slate-100 rounded-md text-black hover:text-rose-500 transition-all border border-slate-100">
                                <X className="w-8 h-8" />
                            </button>
                        </div>

                        <div className="space-y-5 text-left">
                            <div className="bg-[#001736] p-8 rounded-md text-white shadow-xl shadow-[#001736]/10 text-left">
                                <label className="block text-[10px] font-bold uppercase text-amber-400! mb-4 tracking-widest ml-1">Destination Academic Cycle</label>
                                <select
                                    value={promotionData.toYearId || ''}
                                    onChange={(e) => setPromotionData(prev => ({ ...prev, toYearId: e.target.value }))}
                                    className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-md font-bold text-white focus:border-amber-400 outline-none transition-all cursor-pointer uppercase text-[12px] tracking-widest"
                                >
                                    <option value="" className="bg-[#001736]">Identify Target Year</option>
                                    {academicYearsList.filter(y => y.id !== promotionData.fromYearId).map(y => (
                                        <option key={y.id} value={y.id} className="bg-[#001736]">{y.year_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-8">
                                <div className="p-8 bg-black/5 rounded-md border border-black/10 flex flex-col gap-4">
                                    <h5 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Institutional Sequence Overview</h5>
                                    <p className="text-[11px] font-medium text-slate-500 leading-relaxed uppercase tracking-tight">
                                        You are promoting <span className="text-primary font-bold">{selectedStudents.length} selected students</span> to the <span className="text-primary font-bold">{academicYearsList.find(y => y.id == promotionData.toYearId)?.year_name || '...'}</span> session.
                                        <br /><br />
                                        <span className="text-amber-600 font-bold italic">Note: All 10th Grade students in this selection will be automatically archived as Alumni. standard grade-to-grade progression will be applied to others.</span>
                                    </p>
                                </div>
                            </div>

                            {/* Warning Indicator */}
                            <div className="bg-rose-50 p-6 rounded-md border border-rose-100 flex gap-5 items-start">
                                <AlertCircle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5 opacity-60" />
                                <p className="text-[10px] font-bold text-rose-500 leading-relaxed uppercase tracking-widest opacity-80">
                                    PROMOTION PROTOCOL WARNING: THIS ACTION WILL UPDATE SELECTED STUDENT RECORDS GLOBALLY. VERIFY THE DESTINATION YEAR BEFORE PROCEEDING.
                                </p>
                            </div>

                            <button
                                onClick={handlePromoteSelected}
                                disabled={!promotionData.toYearId || loading}
                                className="w-full bg-[#001736] text-white py-6 rounded-md font-bold text-[12px] uppercase tracking-[0.4em] shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-4 disabled:opacity-50 mt-4 active:scale-[0.98]"
                            >
                                {loading ? "SYNCHRONIZING RECORDS..." : "EXECUTE PROMOTION"} <Zap className="w-5 h-5 text-amber-400  shrink-0" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Student;
