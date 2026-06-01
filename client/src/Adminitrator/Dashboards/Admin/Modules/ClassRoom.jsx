import React, { useState, useEffect, useCallback } from 'react';
import {
    Users, GraduationCap, ChevronLeft,
    Trash2, ShieldCheck, Plus, X,
    DoorOpen, BookOpen, BarChart3, Edit3, Clock, Zap, BarChart2,
    FileSpreadsheet, FilePieChart, ArrowRight, Eye, Search
} from 'lucide-react';
import { toast } from 'react-toastify';
import API from '../../../../services/API';
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import DataTable from '../../../admcomponents/DataTable';
import ClassReports from './ClassReports';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAcademicYear } from '../../../../context/AcademicYearContext';



/**
 * ClassRoom - Pedagogical Resource & Faculty Management
 * Refined to the 'Simplified Premium' aesthetic with rounded-2xl and 1px borders.
 */
const ClassRoom = ({ toggleSidebar }) => {
    const { selectedYear: globalYear } = useAcademicYear();
    // Derive the academicYear name from global context
    const academicYear = globalYear?.year_name || '';

    const [view, setView] = useState('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [classrooms, setClassrooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedClass, setSelectedClass] = useState(null);
    const [staffList, setStaffList] = useState([]);
    const [subjectList, setSubjectList] = useState([]);

    const [showClassModal, setShowClassModal] = useState(false);
    const [showSubjectModal, setShowSubjectModal] = useState(false);
    const [editingClass, setEditingClass] = useState(null);
    const [studentPage, setStudentPage] = useState(1);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const STUDENTS_PER_PAGE = 10;

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const academic_year_id = globalYear?.id;

            const [classesRes, staffRes, subjectsRes] = await Promise.all([
                API.get('/classrooms', { params: { academic_year_id } }),
                API.get('/staff/all'),
                API.get('/subjects')
            ]);
            setClassrooms(classesRes.data || []);
            setStaffList(staffRes.data || []);
            setSubjectList(subjectsRes.data || []);

        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch data");
        } finally {
            setLoading(false);
        }
    }, [globalYear?.id]);

    const handleViewDetails = useCallback(async (cls) => {
        try {
            const academic_year_id = globalYear?.id;

            const [studentsRes, subjectsRes] = await Promise.all([
                API.get(`/classrooms/${cls.id}/students`, { params: { academic_year_id } }),
                API.get(`/classrooms/${cls.id}/subjects`, { params: { academic_year_id } })
            ]);

            let studentsList = studentsRes.data || [];
            const needsSync = studentsList.some(s => !s.roll_number);

            if (needsSync && studentsList.length > 0) {
                try {
                    await API.post('/classrooms/roll-sync', {
                        classroom_id: cls.id,
                        academic_year_id
                    });
                    const refreshedStudents = await API.get(`/classrooms/${cls.id}/students`, { params: { academic_year_id } });
                    studentsList = refreshedStudents.data || [];
                } catch (syncErr) {
                    console.error("Silent roll sync failed:", syncErr);
                }
            }

            setSelectedClass({
                ...cls,
                students: studentsList.map(s => ({
                    ...s,
                    father_name: s.father_name || s.p_father_name,
                    father_mobile: s.father_mobile || s.p_father_mobile
                })),
                subjects: subjectsRes.data
            });
            setStudentPage(1);
            setView('details');
        } catch (err) {
            console.error(err);
            toast.error("Failed to load class details");
        }
    }, [globalYear?.id]);

    useEffect(() => {
        if (globalYear?.id) {
            fetchData();
        }
    }, [fetchData, globalYear?.id]);

    useEffect(() => {
        if (globalYear?.id && view === 'details' && selectedClass) {
            handleViewDetails(selectedClass);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [globalYear?.id, view, handleViewDetails]);

    const handleClassSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        data.capacity = parseInt(data.capacity);


        data.academic_year_id = globalYear?.id;

        data.grade_level = 0; // Default Logic

        try {
            if (editingClass) {
                await API.put(`/classrooms/${editingClass.id}`, data);
                toast.success("Classroom parameters updated");
            } else {
                await API.post('/classrooms', data);
                toast.success("New classroom established");
            }
            setShowClassModal(false);
            setEditingClass(null);
            fetchData();
        } catch {
            toast.error("Administrative update failed");
        }
    };



    const filteredClasses = classrooms.filter(c =>
        c.class_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.room_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredStudents = selectedClass?.students || [];

    const getAcademicDivision = (className) => {
        const prePrimary = ['Nursery', 'Jr.Kg', 'Sr.Kg'];
        const primary = ['1st', '2nd', '3rd', '4th', '5th'];
        const middle = ['6th', '7th', '8th'];
        const secondary = ['9th', '10th', '11th', '12th'];
        if (prePrimary.includes(className)) return { label: 'Pre-Primary Section', mobileLabel: 'Pre-Primary', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
        if (primary.includes(className)) return { label: 'Primary Section', mobileLabel: 'Primary', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
        if (middle.includes(className)) return { label: 'Middle Section', mobileLabel: 'Middle', color: 'bg-amber-50 text-amber-700 border-amber-200' };
        if (secondary.includes(className)) return { label: 'Secondary Section', mobileLabel: 'Secondary', color: 'bg-rose-50 text-rose-700 border-rose-200' };
        return { label: className, mobileLabel: className, color: 'bg-slate-50 text-slate-600 border-slate-200' };
    };

    const getClassAbbreviation = (name) => {
        if (!name) return '';
        const match = name.match(/^\d+/);
        return match ? match[0] : name.charAt(0);
    };

    const handleDeleteClass = async (id) => {
        if (!window.confirm("Delete classroom from institutional records?")) return;
        try {
            await API.delete(`/classrooms/${id}`);
            toast.success("Classroom deleted");
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.error || "Delete failed");
        }
    };

    const handleSubjectSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const names = formData.getAll('subject_name');
        const teachers = formData.getAll('teacher_id');
        const starts = formData.getAll('start_time');
        const ends = formData.getAll('end_time');

        const subjects = names.map((name, i) => ({
            subject_name: name,
            teacher_id: teachers[i] || null,
            start_time: starts[i] || null,
            end_time: ends[i] || null
        })).filter(s => s.subject_name.trim() !== '');

        try {
            await API.post('/classrooms/subjects', {
                classroom_id: selectedClass.id,
                academic_year_id: globalYear?.id,
                subjects
            });
            toast.success("Subject schedule synchronized");
            setShowSubjectModal(false);
            handleViewDetails(selectedClass);
        } catch {
            toast.error("Sync failed");
        }
    };

    const exportToExcel = (data, filename, sheetName = 'Data') => {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        XLSX.writeFile(wb, `${filename}.xlsx`);
    };

    const exportToPDF = (headers, data, filename, title) => {
        const doc = new jsPDF();
        doc.text(title, 14, 15);
        autoTable(doc, {
            head: [headers],
            body: data,
            startY: 20,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [0, 23, 54] }
        });
        doc.save(`${filename}.pdf`);
    };

    const handleExportListExcel = () => {
        const data = filteredClasses.map(cls => ({
            'Class Name': `${cls.class_name} ${cls.section || ''}`,
            'Academic Division': getAcademicDivision(cls.class_name).label,
            'Lead Mentor': cls.teacher_name || 'Unassigned',
            'Enrollment': `${cls.student_count || 0} / ${cls.capacity}`,
            'Room Number': cls.room_number || 'N/A'
        }));
        exportToExcel(data, `Classrooms_${academicYear}`);
    };

    const handleExportListPDF = () => {
        const headers = ["Class", "Division", "Mentor", "Enrollment", "Room"];
        const data = filteredClasses.map(cls => [
            `${cls.class_name} ${cls.section || ''}`,
            getAcademicDivision(cls.class_name).label,
            cls.teacher_name || 'Unassigned',
            `${cls.student_count || 0} / ${cls.capacity}`,
            cls.room_number || 'N/A'
        ]);
        exportToPDF(headers, data, `Classrooms_${academicYear}`, `Grace ERP: Classrooms Registry (${academicYear})`);
    };

    return (
        <div className="p-4 lg:p-8 bg-[#F8FAFC] min-h-screen font-sans">

            {view === 'list' && (
                <>
                    <ModuleHeader
                        title="Classrooms"
                        subTitle="Pedagogical Resource & Faculty Allocation"
                        icon={DoorOpen}
                        toggleSidebar={toggleSidebar}
                        showSearch={true}
                        searchValue={searchTerm}
                        onSearchChange={setSearchTerm}
                        onSearchToggle={() => setIsSearchOpen(!isSearchOpen)}
                        hideDesktopSearch={true}
                    >
                        <div className="flex items-center gap-2 lg:gap-3">
                            <button
                                onClick={() => { setEditingClass(null); setShowClassModal(true); }}
                                className="btn-add-institutional w-9 lg:w-auto h-9 lg:px-4 rounded-md font-black text-[10px] lg:text-[11px] uppercase tracking-widest shadow-xl transition-all flex items-center justify-center lg:gap-2 active:scale-95 shrink-0"
                            >
                                <Plus size={18} className="lg:w-4 lg:h-4" />
                                <span className="hidden lg:block text-black! font-black">Add Class</span>
                            </button>

                            <div className="hidden lg:flex bg-white border border-slate-200 rounded-md p-1 shadow-sm h-9 items-center">
                                <button onClick={handleExportListExcel} className="p-1 hover:bg-slate-50 rounded-md transition-all px-2" title="Export Excel"><FileSpreadsheet className="w-4 h-4 text-emerald-500" /></button>
                                <div className="w-px h-5 bg-slate-200 my-auto mx-1" />
                                <button onClick={handleExportListPDF} className="p-1 hover:bg-slate-50 rounded-md transition-all px-2" title="Export PDF"><FilePieChart className="w-4 h-4 text-rose-500" /></button>
                            </div>
                        </div>
                    </ModuleHeader>

                    {/* 2. Metrics Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-4 lg:mb-6 text-left">
                        <StatusMetric label="Total Hubs" value={classrooms.length} iconComponent={DoorOpen} color="amber" />
                        <StatusMetric label="Active Pupils" value={classrooms.reduce((acc, curr) => acc + (curr.student_count || 0), 0)} iconComponent={Users} color="indigo" />
                        <StatusMetric label="Avg Capacity" value={classrooms.length ? Math.round(classrooms.reduce((acc, curr) => acc + curr.capacity, 0) / classrooms.length) : 0} iconComponent={BarChart2} color="emerald" />
                        <StatusMetric label="Mentors Active" value={new Set(classrooms.map(c => c.class_teacher_id)).size} iconComponent={ShieldCheck} color="rose" />
                    </div>

                    {/* 3. Institutional Toolbar */}
                    <div className={`bg-white border-b border-black/5 rounded-xl overflow-hidden ${isSearchOpen ? 'mb-4' : 'mb-0 lg:mb-6'}`}>
                        <div className={`p-3 lg:p-4 bg-slate-50/30 ${isSearchOpen ? 'block' : 'hidden lg:block'} animate-in slide-in-from-top-2 duration-300`}>
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4 flex-1">
                                    <div className="relative w-full lg:w-72 group">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#001736] transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="Search Classrooms..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-black rounded-md text-[11px] font-medium text-[#001736] outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all uppercase tracking-wider placeholder:text-slate-300 shadow-sm font-sans"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 4. Standard Data Table */}
                    <div className="overflow-hidden bg-white shadow-sm border-t border-black/5">
                        <div className="w-full mobile-table-scroll">
                            <DataTable
                                headers={[
                                    { label: "Class & Room Index", className: "text-center border-r border-black bg-slate-100 font-black" },
                                    { label: "Academic Division", className: "text-center border-r border-black bg-slate-100 font-black" },
                                    { label: "Lead Mentor", className: "text-center border-r border-black bg-slate-100 font-black" },
                                    { label: "Enrollment Status", className: "text-center border-r border-black bg-slate-100 font-black" },
                                    { label: "Actions", className: "text-center bg-slate-100 font-black" }
                                ]}
                                columnCount={5}
                                loading={loading}
                                emptyMessage="No Classrooms Detected"
                                footer={
                                    <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50 text-[10px] font-black uppercase text-slate-400">
                                        <span className="tracking-widest">Registry Status: Synchronized</span>
                                        <span className="tracking-[0.2em]">{classrooms.length} Modular Units Detected</span>
                                    </div>
                                }
                            >
                                {filteredClasses.map((cls) => {
                                    const division = getAcademicDivision(cls.class_name);
                                    return (
                                        <tr key={cls.id} className="hover-table-row transition-colors group">
                                            {/* Class & Room */}
                                            <td className="px-6 py-4 border-b-table border-r-table">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-white border border-black text-[#001736] rounded-xl flex items-center justify-center font-black text-sm shadow-sm group-hover:bg-[#001736] group-hover:text-white transition-all">
                                                        {getClassAbbreviation(cls.class_name)}
                                                    </div>
                                                    <div>
                                                        <p className="text-[12px] font-black text-table-cell uppercase tracking-tight leading-none">
                                                            {cls.class_name} {cls.section ? `- ${cls.section}` : ''}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1.5 tracking-widest opacity-60">Room: {cls.room_number || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            {/* Academic Division */}
                                            <td className="px-4 py-4 border-b border-r border-black text-center text-institutional-main font-black">
                                                <span className={`px-3 py-1.5 text-[10px] font-black tracking-widest rounded-lg border border-black uppercase ${division.color}`}>
                                                    <span className="hidden sm:inline">{division.label}</span>
                                                    <span className="sm:hidden">{division.mobileLabel}</span>
                                                </span>
                                            </td>
                                            {/* Lead Mentor */}
                                            <td className="px-4 py-4 border-b border-r border-black text-center text-institutional-main font-black group-hover:text-[#001736]">
                                                <p className="text-[12px] font-bold uppercase leading-tight">{cls.teacher_name || 'Unassigned'}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest opacity-60">Lead Faculty</p>
                                            </td>
                                            {/* Enrollment */}
                                            <td className="px-4 py-4 border-b border-r border-black text-center text-institutional-main font-black">
                                                <p className="text-[14px] font-bold tracking-tighter">{cls.student_count || 0} / {cls.capacity}</p>
                                                <div className="w-20 h-1.5 bg-slate-100 rounded-full mx-auto mt-2 overflow-hidden border border-black">
                                                    <div className="h-full bg-[#001736]" style={{ width: `${Math.min(((cls.student_count || 0) / cls.capacity) * 100, 100)}%` }} />
                                                </div>
                                            </td>
                                            {/* Actions */}
                                            <td className="px-4 py-4 border-b border-black text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => handleViewDetails(cls)} className="p-2.5 bg-white border border-black text-table-cell rounded-xl cursor-pointer hover:bg-gray-400 hover:text-white transition-all shadow-sm active:scale-95" title="View Details">
                                                        <Eye className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={() => { setEditingClass(cls); setShowClassModal(true); }} className="p-2.5 bg-white border border-black text-table-cell rounded-xl cursor-pointer hover:bg-amber-400 hover:text-white transition-all shadow-sm active:scale-95" title="Edit Parameters">
                                                        <Edit3 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={() => handleDeleteClass(cls.id)} className="p-2.5 bg-white border border-black text-table-cell rounded-xl cursor-pointer hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-95" title="Delete">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </DataTable>
                        </div>
                    </div>
                </>
            )}

            {view === 'details' && selectedClass && (() => {
                const totalStudents = (filteredStudents || []).length;
                const totalPages = Math.ceil(totalStudents / STUDENTS_PER_PAGE);
                const paginatedStudents = (filteredStudents || [])
                    .sort((a, b) => (a.roll_number || 999) - (b.roll_number || 999))
                    .slice(
                        (studentPage - 1) * STUDENTS_PER_PAGE,
                        studentPage * STUDENTS_PER_PAGE
                    );

                const user = JSON.parse(localStorage.getItem('user') || '{}');
                const canManageRolls = ['admin', 'principal'].includes(user.role) || (user.role === 'teacher' && user.id === selectedClass.class_teacher_id);

                const handleSyncRollNumbers = async () => {
                    try {
                        await API.post('/classrooms/roll-sync', {
                            classroom_id: selectedClass.id,
                            academic_year_id: globalYear?.id
                        });
                        toast.success("Roll numbers synchronized alphabetically by surname");
                        handleViewDetails(selectedClass);
                    } catch {
                        toast.error("Synchronization failed");
                    }
                };

                const handleExportDetailsExcel = () => {
                    const studentData = (selectedClass.students || []).map((s, i) => ({
                        'Sr.': i + 1,
                        'Roll No': s.roll_number || '---',
                        'Identity': s.student_id_no || '---',
                        'Name': s.student_name,
                        'Father Name': s.father_name || '---',
                        'Contact': s.father_mobile || '---'
                    }));

                    const subjectData = (selectedClass.subjects || []).map((sub, i) => ({
                        'Sr.': i + 1,
                        'Subject': sub.subject_name,
                        'Faculty': sub.teacher_name || 'Unassigned',
                        'Schedule': `${sub.start_time} - ${sub.end_time}`
                    }));

                    const wb = XLSX.utils.book_new();
                    const wsStudents = XLSX.utils.json_to_sheet(studentData);
                    const wsSubjects = XLSX.utils.json_to_sheet(subjectData);
                    XLSX.utils.book_append_sheet(wb, wsStudents, "Student Registry");
                    XLSX.utils.book_append_sheet(wb, wsSubjects, "Curriculum Index");
                    XLSX.writeFile(wb, `Class_${selectedClass.class_name}_Registry.xlsx`);
                };

                const handleExportDetailsPDF = () => {
                    const doc = new jsPDF();
                    doc.setFontSize(16);
                    doc.text(`Grace ERP: ${selectedClass.class_name} Detail Report`, 14, 15);
                    doc.setFontSize(10);
                    doc.text(`Room: ${selectedClass.room_number || 'N/A'} | Mentor: ${selectedClass.teacher_name || 'Unassigned'}`, 14, 22);

                    // 1. Subjects Table
                    doc.setFontSize(12);
                    doc.text("Curriculum Index", 14, 32);
                    autoTable(doc, {
                        head: [["Sr.", "Subject", "Faculty", "Schedule"]],
                        body: (selectedClass.subjects || []).map((sub, i) => [i + 1, sub.subject_name, sub.teacher_name || 'Unassigned', `${sub.start_time} - ${sub.end_time}`]),
                        startY: 35,
                        theme: 'grid',
                        styles: { fontSize: 8 },
                        headStyles: { fillColor: [245, 158, 11] } // Amber for subjects
                    });

                    // 2. Students Table
                    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 35;
                    doc.setFontSize(12);
                    doc.text("Student Registry", 14, finalY + 15);
                    autoTable(doc, {
                        head: [["Sr.", "Roll", "Identity", "Pupil Name", "Father Name", "Contact"]],
                        body: (selectedClass.students || []).map((s, i) => [i + 1, s.roll_number || '---', s.student_id_no || '---', s.student_name, s.father_name || '---', s.father_mobile || '---']),
                        startY: finalY + 18,
                        theme: 'grid',
                        styles: { fontSize: 8 },
                        headStyles: { fillColor: [79, 70, 229] } // Indigo for students
                    });

                    doc.save(`Class_${selectedClass.class_name}_Report.pdf`);
                };

                const handleUpdateRoll = async (enrollment_id, currentRoll) => {
                    const newRoll = window.prompt("Enter new Roll Number:", currentRoll || "");
                    if (newRoll === null || newRoll === currentRoll?.toString()) return;

                    try {
                        await API.put(`/classrooms/roll-update/${enrollment_id}`, { roll_number: newRoll });
                        toast.success("Roll number updated");
                        handleViewDetails(selectedClass);
                    } catch {
                        toast.error("Update failed");
                    }
                };
                return (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">

                        {/* STANDARDIZED HEADER */}
                        <ModuleHeader
                            title={selectedClass.class_name}
                            subTitle={`RM: ${selectedClass.room_number || 'N/A'} • CAP: ${selectedClass.capacity}`}
                            toggleSidebar={toggleSidebar}
                            showSearch={true}
                            onSearchToggle={() => setIsSearchOpen(!isSearchOpen)}
                            hideDesktopSearch={true}
                            leftCustomContent={
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setView('list')} className="p-3 bg-white hover:bg-white/80 text-white rounded-xl transition-all border border-white/10 active:scale-95">
                                        <ChevronLeft size={20} />
                                    </button>
                                    <div className="w-12 h-12 bg-white text-[#001736] rounded-xl flex items-center justify-center font-black text-xl shadow-lg border-2 border-amber-400 shrink-0">
                                        {getClassAbbreviation(selectedClass.class_name)}
                                    </div>
                                </div>
                            }
                        />

                        {/* INSTITUTIONAL TOOLBAR - PERFECTLY ALIGNED ACTION MATRIX */}
                        <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-black/5">
                            <div className={`p-3 lg:p-4 border-b border-slate-100 bg-slate-50/30 ${!isSearchOpen ? 'hidden lg:block' : 'block animate-in slide-in-from-top-2 duration-300'}`}>
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6">

                                    {/* PRIMARY: SEARCH HUB */}
                                    <div className="w-full lg:w-72 relative group shrink-0">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-black transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="SEARCH REGISTRY..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-9 pr-4 py-3 bg-white border border-black rounded-xl text-[11px] font-black uppercase tracking-widest outline-none focus:border-black transition-all placeholder:text-slate-300 shadow-sm"
                                        />
                                    </div>

                                    {/* SECONDARY: STATUS & CONTROLS MATRIX */}
                                    <div className="flex flex-wrap items-center gap-2 lg:gap-3 flex-1 lg:justify-end">

                                        {/* Status: Mentor */}
                                        <div className="flex items-center gap-3 px-4 py-2 bg-white border border-black rounded-xl shadow-sm h-[46px]">
                                            <div className="w-6 h-6 rounded bg-amber-400 flex items-center justify-center shrink-0">
                                                <GraduationCap className="w-4 h-4 text-[#001736]" />
                                            </div>
                                            <div className="text-left hidden sm:block">
                                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Lead Mentor</p>
                                                <p className="text-[10px] font-black text-black uppercase truncate max-w-[100px]">{selectedClass.teacher_name || 'UNASSIGNED'}</p>
                                            </div>
                                            <span className="sm:hidden text-[10px] font-black text-black uppercase">{selectedClass.teacher_name?.split(' ')[0] || 'MENTOR'}</span>
                                        </div>

                                        {/* Status: Roll Capacity */}
                                        <div className="px-4 py-2 h-[46px] flex items-center bg-white border border-black rounded-xl shadow-sm">
                                            <span className="text-[10px] font-black text-black uppercase tracking-widest whitespace-nowrap">
                                                ROLL: {totalStudents} / {selectedClass.capacity}
                                            </span>
                                        </div>

                                        {/* Action: Mapping */}
                                        <button onClick={() => setShowSubjectModal(true)} className="px-5 py-2 h-[46px] bg-white border border-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-400 transition-all flex items-center gap-2 shadow-sm active:scale-95 text-black">
                                            <BookOpen className="w-4 h-4 text-indigo-500" /> <span className="hidden sm:inline">Mapping</span>
                                        </button>

                                        {/* Utils: Export */}
                                        <div className="flex items-center gap-1 bg-white border border-black p-1 rounded-xl shadow-sm h-[46px] shrink-0">
                                            <button onClick={handleExportDetailsExcel} className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-all" title="Export Excel"><FileSpreadsheet size={16} /></button>
                                            <button onClick={handleExportDetailsPDF} className="p-2 hover:bg-rose-50 text-rose-600 rounded-lg transition-all" title="Export PDF"><FilePieChart size={16} /></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Curriculum Index Matrix */}
                        <div className="overflow-hidden bg-white shadow-sm ">
                            <div className="px-6 py-4 bg-slate-50 flex items-center gap-3 ">
                                <BookOpen className="w-5 h-5 text-amber-500" />
                                <h3 className="text-[12px] font-black text-[#001736] uppercase tracking-widest">Curriculum Index &middot; {selectedClass.subjects?.length || 0} Subjects</h3>
                            </div>
                            <div className="w-full mobile-table-scroll">
                                <DataTable
                                    headers={[
                                        { label: "Sr.", className: "w-[45px] text-center font-black border-r border-black bg-slate-100" },
                                        { label: "Subject Designation", className: "w-[200px] font-black border-r border-black bg-slate-100" },
                                        { label: "Faculty Mentor", className: "w-[200px] font-black border-r border-black bg-slate-100" },
                                        { label: "Synchronization Schedule", className: "text-center font-black bg-slate-100" }
                                    ]}
                                    columnCount={4}
                                >
                                    {(selectedClass.subjects || []).length === 0 ? (
                                        <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-300 text-[11px] uppercase tracking-widest font-black">No Curriculum Matrix Defined</td></tr>
                                    ) : (selectedClass.subjects || []).map((sub, i) => (
                                        <tr key={i} className="hover-table-row transition-colors group text-[11px] font-bold text-table-cell uppercase">
                                            <td className="px-2 py-3 border-r  text-center bg-slate-50/30">{i + 1}</td>
                                            <td className="px-4 py-3 border-r  text-[#001736] font-black">{sub.subject_name}</td>
                                            <td className="px-4 py-3 border-r  text-slate-500">{sub.teacher_name || 'UNASSIGNED'}</td>
                                            <td className="px-4 py-3  text-center flex items-center justify-center gap-2">
                                                <Clock size={12} className="text-[#001736] opacity-40" /> {sub.start_time} - {sub.end_time}
                                            </td>
                                        </tr>
                                    ))}
                                </DataTable>
                            </div>
                        </div>

                        {/* Student Registry Matrix */}
                        <div className="rounded-none overflow-hidden bg-white shadow-sm ">
                            <div className="px-6 py-4 bg-slate-50 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200">
                                <div className="flex items-center gap-3">
                                    <Users className="w-5 h-5 text-indigo-500" />
                                    <h3 className="text-[12px] font-black text-[#001736] uppercase tracking-widest">Student Registry &middot; {totalStudents} Enrolled</h3>
                                </div>
                                {canManageRolls && (
                                    <button
                                        onClick={handleSyncRollNumbers}
                                        className="px-4 py-2 bg-[#001736] text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2"
                                    >
                                        <Zap size={14} className="text-amber-400" /> Auto-Sync Rolls
                                    </button>
                                )}
                            </div>
                            <div className="w-full mobile-table-scroll">
                                <DataTable
                                    headers={[
                                        { label: "Sr.", className: "w-[45px] text-center font-black border-r border-black bg-slate-100" },
                                        { label: "Roll", className: "w-[60px] text-center font-black border-r border-black bg-amber-50" },
                                        { label: "Identity", className: "w-[130px] text-center font-black border-r border-black bg-slate-100" },
                                        { label: "Pupil Name", className: "w-[240px] font-black border-r border-black bg-slate-100 text-left" },
                                        { label: "Father Name", className: "w-[220px] font-black border-r border-black bg-slate-100 text-left" },
                                        { label: "Contact Hub", className: `text-center font-black bg-slate-100 ${canManageRolls ? 'border-r border-black' : ''}` },
                                        ...(canManageRolls ? [{ label: "Actions", className: "w-[100px] text-center font-black bg-slate-100" }] : [])
                                    ]}
                                    loading={loading}
                                    footer={
                                        <div className="flex flex-col sm:flex-row items-center justify-between bg-slate-50/50 gap-4">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Displaying Page {studentPage} of {totalPages} &middot; Registry Synchronized</span>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => setStudentPage(p => Math.max(1, p - 1))} disabled={studentPage === 1}
                                                    className="px-6 py-2.5 bg-white border border-black text-[#001736] rounded-none text-[10px] font-black uppercase tracking-widest hover:bg-[#001736] hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm">
                                                    Prev
                                                </button>
                                                <button onClick={() => setStudentPage(p => Math.min(totalPages, p + 1))} disabled={studentPage === totalPages}
                                                    className="px-6 py-2.5 bg-white border border-black text-[#001736] rounded-none text-[10px] font-black uppercase tracking-widest hover:bg-[#001736] hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm">
                                                    Next
                                                </button>
                                            </div>
                                        </div>
                                    }
                                >
                                    {paginatedStudents.map((s, idx) => (
                                        <tr key={idx} className="hover-table-row transition-colors group text-[11px] font-bold text-table-cell uppercase">
                                            <td className="px-2 py-3 border-b border-r border-black text-center bg-slate-50/30">{((studentPage - 1) * STUDENTS_PER_PAGE) + idx + 1}</td>
                                            <td className="px-2 py-3 border-b border-r border-black text-center font-black text-amber-600 bg-amber-50/10">{s.roll_number || '---'}</td>
                                            <td className="px-4 py-3 border-b border-r border-black text-center font-mono font-black text-indigo-600 tracking-tighter">{s.student_id_no || '---'}</td>
                                            <td className="px-4 py-3 border-b border-r border-black text-[#001736] font-black text-left">{s.student_name}</td>
                                            <td className="px-4 py-3 border-b border-r border-black text-slate-500 text-left">{s.father_name || '---'}</td>
                                            <td className={`px-4 py-3 border-b ${canManageRolls ? 'border-r border-black' : ''} text-center font-black tracking-widest`}>{s.father_mobile || '---'}</td>
                                            {canManageRolls && (
                                                <td className="px-4 py-3 border-b border-black text-center">
                                                    <button
                                                        onClick={() => handleUpdateRoll(s.id, s.roll_number)}
                                                        className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-all border border-indigo-100 shadow-sm"
                                                        title="Change Roll Number"
                                                    >
                                                        <Edit3 size={14} />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </DataTable>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {view === 'reports' && selectedClass && (
                <ClassReports classroom={selectedClass} onBack={() => setView('details')} />
            )}

            {/* Modals Suite */}
            {showClassModal && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-[#001736]/90 backdrop-blur-md">
                    <div className="bg-white rounded-2xl border border-white/20 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-10 bg-[#001736] text-white flex justify-between items-center">
                            <div className="flex items-center gap-5">
                                <div className="bg-amber-400 p-3 rounded-xl">
                                    <DoorOpen className="w-6 h-6 text-[#001736]" />
                                </div>
                                <h2 className="text-3xl font-black text-white! uppercase tracking-tight">Set Registry</h2>
                            </div>
                            <button onClick={() => setShowClassModal(false)} className="bg-white/10 hover:bg-rose-500 p-3 rounded-xl transition-all border border-white/10">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-10 overflow-y-auto">
                            <form onSubmit={handleClassSubmit} className="space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                        <label className="text-[11px] uppercase font-bold text-slate-400 ml-2 tracking-[0.2em]">Class Level *</label>
                                        <select
                                            name="class_name"
                                            defaultValue={editingClass?.class_name}
                                            required
                                            className="w-full px-8 py-5 bg-white border border-slate-200 rounded-xl font-bold text-[#001736] uppercase outline-none focus:ring-8 focus:ring-amber-500/10 transition-all"
                                        >
                                            <option value="">SELECT LEVEL</option>
                                            {['Nursery', 'Jr.Kg', 'Sr.Kg', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'].map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[11px] uppercase font-bold text-slate-400 ml-2 tracking-[0.2em]">Section</label>
                                        <input name="section" defaultValue={editingClass?.section} placeholder="DIVISION (A/B/C)" className="w-full px-8 py-5 bg-white border border-slate-200 rounded-xl font-bold text-[#001736] uppercase outline-none focus:ring-8 focus:ring-amber-500/10 transition-all" />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[11px] uppercase font-bold text-slate-400 ml-2 tracking-[0.2em]">Room Index</label>
                                        <input name="room_number" defaultValue={editingClass?.room_number} required placeholder="RM_001" className="w-full px-8 py-5 bg-white border border-slate-200 rounded-xl font-bold text-[#001736] uppercase outline-none focus:ring-8 focus:ring-amber-500/10 transition-all" />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[11px] uppercase font-bold text-slate-400 ml-2 tracking-[0.2em]">Capacity</label>
                                        <input name="capacity" type="number" defaultValue={editingClass?.capacity || 40} required className="w-full px-8 py-5 bg-white border border-slate-200 rounded-xl font-bold text-[#001736] outline-none focus:ring-8 focus:ring-amber-500/10 transition-all" />
                                    </div>
                                    <div className="space-y-4 col-span-full">
                                        <label className="text-[11px] uppercase font-bold text-slate-400 ml-2 tracking-[0.2em]">Assigned Mentor</label>
                                        <select name="class_teacher_id" defaultValue={editingClass?.class_teacher_id} className="w-full px-8 py-5 bg-white border border-slate-200 rounded-xl font-bold text-[#001736] outline-none focus:ring-8 focus:ring-amber-500/10 transition-all uppercase">
                                            <option value="">Unassigned</option>
                                            {staffList.filter(s => s.staff_type === 'teaching').map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <button type="submit" className="w-full py-6 bg-[#001736] text-white rounded-xl font-bold text-[12px] uppercase tracking-[0.4em] flex items-center justify-center gap-3 shadow-xl hover:bg-black transition-all active:scale-[0.98]">
                                    Save Changes <ArrowRight className="w-5 h-5 opacity-40" />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {showSubjectModal && selectedClass && (
                <div className="fixed inset-0 z-110 flex items-center justify-center p-4 bg-[#001736]/90 backdrop-blur-md">
                    <div className="bg-white rounded-2xl border border-white/20 shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 bg-[#001736] text-white flex justify-between items-center">
                            <h2 className="text-3xl font-black text-white! uppercase tracking-tight flex items-center gap-4">
                                <BookOpen className="w-8 h-8 text-amber-400" /> Curriculum Sync
                            </h2>
                            <button onClick={() => setShowSubjectModal(false)} className="bg-white/10 hover:bg-rose-500 p-3 rounded-xl transition-all border border-white/10">
                                <X className="w-8 h-8" />
                            </button>
                        </div>                        <div className="p-10 overflow-y-auto">
                            <form onSubmit={handleSubjectSubmit} className="space-y-8">
                                <datalist id="institutional-subjects">
                                    {subjectList.map(s => (
                                        <option key={s.id} value={s.subject_name} />
                                    ))}
                                </datalist>
                                <div className="space-y-6">
                                    {(selectedClass.subjects?.length > 0 ? selectedClass.subjects : [{ subject_name: '', teacher_id: '', start_time: '', end_time: '' }]).map((sub, idx) => (
                                        <div key={idx} className="relative bg-white border border-black p-8 rounded-xl shadow-sm hover:border-slate-300 transition-all">
                                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
                                                <div className="lg:col-span-4 space-y-2 text-left">
                                                    <label className="text-[10px] uppercase font-bold ml-2 text-black tracking-widest">Subject Name</label>
                                                    <input
                                                        name="subject_name"
                                                        list="institutional-subjects"
                                                        defaultValue={sub.subject_name}
                                                        className="w-full px-6 py-4 bg-slate-50 border border-black rounded-xl font-bold text-[#001736] uppercase focus:bg-white focus:border-amber-400 outline-none transition-all placeholder:text-slate-200"
                                                        required
                                                        placeholder="Enter or select subject..."
                                                    />
                                                </div>
                                                <div className="lg:col-span-4 space-y-2 text-left">
                                                    <label className="text-[10px] uppercase font-bold ml-2 text-black tracking-widest">Faculty Mentor</label>
                                                    <select name="teacher_id" defaultValue={sub.teacher_id} className="w-full px-6 py-4 bg-slate-50 border border-black rounded-xl font-bold text-[#001736] focus:bg-white focus:border-amber-400 outline-none transition-all uppercase">
                                                        <option value="">Pool Teacher</option>
                                                        {staffList.filter(s => s.staff_type === 'teaching').map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                                                    </select>
                                                </div>
                                                <div className="lg:col-span-2 space-y-2 text-left">
                                                    <label className="text-[10px] uppercase font-bold ml-2 text-black tracking-widest">Start</label>
                                                    <input type="time" name="start_time" defaultValue={sub.start_time} className="w-full px-4 py-4 bg-slate-50 border border-black rounded-xl font-bold text-[#001736]" />
                                                </div>
                                                <div className="lg:col-span-2 space-y-2 text-left">
                                                    <label className="text-[10px] uppercase font-bold ml-2 text-black tracking-widest">End</label>
                                                    <input type="time" name="end_time" defaultValue={sub.end_time} className="w-full px-4 py-4 bg-slate-50 border border-black rounded-xl font-bold text-[#001736]" />
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newSubs = [...selectedClass.subjects];
                                                    newSubs.splice(idx, 1);
                                                    setSelectedClass({ ...selectedClass, subjects: newSubs });
                                                }}
                                                className="absolute -top-3 -right-3 bg-white border border-slate-200 p-2.5 rounded-full text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-md active:scale-90"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex flex-col md:flex-row gap-4 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedClass({ ...selectedClass, subjects: [...(selectedClass.subjects || []), { subject_name: '', teacher_id: '', start_time: '', end_time: '' }] })}
                                        className="flex-1 py-5 border border-dashed border-black text-black rounded-xl font-bold uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Plus className="w-5 h-5" /> Add Subject
                                    </button>
                                    <button type="submit" className="flex-1 bg-[#001736] text-white py-5 rounded-xl font-bold uppercase tracking-[0.3em] shadow-xl flex items-center justify-center gap-3 hover:bg-black transition-all active:scale-[0.98]">
                                        <Zap className="w-5 h-5 text-amber-400" /> Save
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

const StatusMetric = ({ label, value, iconComponent, color }) => {
    const Icon = iconComponent;
    const colorMap = {
        indigo: { border: 'border-indigo-600', bg: 'bg-indigo-50/50', iconBg: 'bg-indigo-600', text: 'text-indigo-900', ring: 'ring-indigo-500/10' },
        emerald: { border: 'border-emerald-600', bg: 'bg-emerald-50/50', iconBg: 'bg-emerald-600', text: 'text-emerald-900', ring: 'ring-emerald-500/10' },
        rose: { border: 'border-rose-600', bg: 'bg-rose-50/50', iconBg: 'bg-rose-600', text: 'text-rose-900', ring: 'ring-rose-500/10' },
        amber: { border: 'border-amber-600', bg: 'bg-amber-50/50', iconBg: 'bg-amber-600', text: 'text-amber-900', ring: 'ring-amber-500/10' },
    };

    const theme = colorMap[color] || colorMap.indigo;

    return (
        <div className={`p-4 lg:p-6 rounded-2xl border-l-4 transition-all duration-300 group hover:shadow-xl flex flex-col lg:flex-row lg:items-center justify-between shadow-sm overflow-hidden
        ${theme.border} ${theme.bg}`}>
            {/* Mobile Layout */}
            <div className="flex items-center justify-between w-full lg:hidden mb-2">
                <h3 className={`text-2xl font-black tracking-tighter leading-none ${theme.text}`}>{value || 0}</h3>
                <div className={`w-10 h-10 rounded-xl ${theme.iconBg} flex items-center justify-center shadow-lg border border-white/20 shrink-0`}>
                    <Icon className="w-4 h-4 text-white" />
                </div>
            </div>
            <p className={`lg:hidden text-[10px] font-black uppercase tracking-wider opacity-80 leading-snug ${theme.text}`}>{label}</p>

            {/* Desktop Layout */}
            <div className="hidden lg:block flex-1 overflow-hidden">
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1.5 opacity-60 truncate ${theme.text}`}>{label}</p>
                <h3 className={`text-4xl font-black tracking-tighter leading-none truncate ${theme.text}`}>{value || 0}</h3>
            </div>
            <div className={`hidden lg:flex w-14 h-14 rounded-2xl ${theme.iconBg} items-center justify-center shadow-lg group-hover:rotate-12 transition-transform border border-white/20 shrink-0`}>
                <Icon className="w-4 h-4 lg:w-6 lg:h-6 text-white" />
            </div>
        </div>
    );
};

const ActionButton = ({ icon, label, color, onClick }) => {
    const Icon = icon;
    return (
        <button onClick={onClick} className={`p-3 rounded-xl transition-all shadow-sm active:scale-95 ${color}`} title={label}>
            <Icon className="w-5 h-5" />
        </button>
    );
};

export default ClassRoom;
