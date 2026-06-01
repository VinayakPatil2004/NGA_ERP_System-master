import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
    FileText, Search, Save, Loader2,
    Printer, Trash2, BookOpen,
    CheckCircle2, XCircle, Pencil,
    User, Eye, GraduationCap, Download
} from 'lucide-react';
import { toast } from 'react-toastify';
import ModuleHeader from '../../../../admcomponents/ModuleHeader';
import * as ExamAPI from '../../../../../services/examAPI';
import * as ClassroomAPI from '../../../../../services/classroomAPI';
import * as StudentAPI from '../../../../../services/studentAPI';
import { useAcademicYear } from '../../../../../context/AcademicYearContext';
import Swal from 'sweetalert2';
import PrePrimaryMarksEntry from '../../../Teacher/Modules/PrePrimaryMarksEntry';

// Import Templates
import PrePrimaryReport from '../../../Teacher/Modules/ExamResultTemplates/PrePrimaryReport';
import PrimaryReport1to2 from '../../../Teacher/Modules/ExamResultTemplates/PrimaryReport1to2';
import PrimaryReport3to5 from '../../../Teacher/Modules/ExamResultTemplates/PrimaryReport3to5';
import MiddleReport6to8 from '../../../Teacher/Modules/ExamResultTemplates/MiddleReport6to8';

const DEFAULT_SETTINGS = [
    { component_name: 'Unit Written', max_marks: 20 },
    { component_name: 'Class Test', max_marks: 10 },
    { component_name: 'Project', max_marks: 10 },
    { component_name: 'Oral', max_marks: 10 },
    { component_name: 'Note Book', max_marks: 10 },
    { component_name: 'Term Written', max_marks: 40 }
];

const MarksRegistry = ({ toggleSidebar, isEmbedded = false, searchQuery = '' }) => {
    const { selectedYear: globalYear } = useAcademicYear();
    const [classrooms, setClassrooms] = useState([]);
    const [students, setStudents] = useState([]);
    const [exams, setExams] = useState([]);
    const [selection, setSelection] = useState({
        classroomId: '',
        studentId: '',
        examId: '',
        term: 'Term 1' // 'Term 1' | 'Term 2' | 'Both'
    });
    const [performance, setPerformance] = useState([]);
    const [coScholasticData, setCoScholasticData] = useState([]);
    const [attendanceData, setAttendanceData] = useState([]);
    const [prePrimaryData, setPrePrimaryData] = useState([]);
    const [activeViewTab, setActiveViewTab] = useState('grid');
    const printRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        if (globalYear?.id) {
            ClassroomAPI.getClassrooms(globalYear.id).then(setClassrooms);
            ExamAPI.getAllExams(globalYear.id).then(setExams);
        }
    }, [globalYear?.id]);

    useEffect(() => {
        if (selection.classroomId) {
            StudentAPI.getAllStudents(globalYear?.year_name, '', selection.classroomId)
                .then(setStudents)
                .catch(() => toast.error("Failed to load students"));
        }
    }, [selection.classroomId, globalYear?.year_name]);

    useEffect(() => {
        setPerformance([]);
        setCoScholasticData([]);
        setAttendanceData([]);
        setPrePrimaryData([]);
        setActiveViewTab('grid');
    }, [selection.classroomId, selection.studentId, selection.term]);


    const handleFetchPerformance = async () => {
        if (!selection.studentId || !globalYear?.id) {
            toast.warning("Please select a student");
            return;
        }

        setLoading(true);
        try {
            const selectedClassroomData = classrooms.find(c => c.id === parseInt(selection.classroomId) || c.classroom_id === parseInt(selection.classroomId));
            const gradeName = selectedClassroomData?.class_name?.toLowerCase() || '';
            const isPrePrimaryClass = gradeName.match(/(nursery|junior|senior|kg|jr|sr)/);

            if (isPrePrimaryClass) {
                const preMarks = await ExamAPI.getPrePrimaryMarks(selection.studentId, null, globalYear.id);
                setPrePrimaryData(preMarks || []);
                setPerformance([]);
                setCoScholasticData([]);
                setAttendanceData([]);
            } else {
                const [perf, coSch, att] = await Promise.all([
                    ExamAPI.getStudentPerformance(selection.studentId, globalYear.id),
                    ExamAPI.getCoScholastic(selection.studentId, globalYear.id),
                    StudentAPI.getStudentAttendanceRecords(selection.studentId, globalYear.id).catch(() => [])
                ]);
                setPerformance((perf || []).map(p => ({
                    ...p,
                    is_editing: false,
                    edit_data: { ...p }
                })));
                setCoScholasticData(coSch || []);
                setAttendanceData(att || []);
                setPrePrimaryData([]);
            }
        } catch {
            toast.error("Failed to load performance data");
        } finally {
            setLoading(false);
        }
    };

    const handleEditToggle = (index) => {
        const updated = [...performance];
        updated[index].is_editing = !updated[index].is_editing;
        setPerformance(updated);
    };

    const handleEditChange = (index, field, value) => {
        const updated = [...performance];
        updated[index].edit_data[field] = value;
        setPerformance(updated);
    };

    const handleSaveUpdate = async (index) => {
        const record = performance[index];
        const data = record.edit_data;

        setIsSaving(true);
        try {
            await ExamAPI.saveMarks({
                exam_id: data.exam_id,
                subject_name: data.subject_name,
                marks_data: [{
                    student_id: data.student_id,
                    unit_written: data.unit_written,
                    class_test: data.class_test,
                    project: data.project,
                    oral: data.oral,
                    notebook: data.notebook,
                    term_written: data.term_written,
                    remarks: data.remarks,
                    is_draft: 0
                }]
            });
            toast.success("Assessment record updated");
            handleFetchPerformance();
        } catch {
            toast.error("Failed to update record");
        } finally {
            setIsSaving(false);
        }
    };

    const handleKeyDown = (e, row, col) => {
        let nextRow = row;
        let nextCol = col;
        const totalRows = filteredPerformance.length;
        const totalCols = 6; // Fixed 6 components in the current matrix

        if (e.key === 'ArrowUp') nextRow = Math.max(0, row - 1);
        else if (e.key === 'ArrowDown') nextRow = Math.min(totalRows - 1, row + 1);
        else if (e.key === 'ArrowLeft') nextCol = Math.max(0, col - 1);
        else if (e.key === 'ArrowRight') nextCol = Math.min(totalCols - 1, col + 1);
        else return;

        const nextInput = document.getElementById(`audit-input-${nextRow}-${nextCol}`);
        if (nextInput) {
            e.preventDefault();
            nextInput.focus();
            if (nextInput.select) nextInput.select();
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Delete Mark Record?',
            text: "This action will permanently remove this subject's assessment from the registry.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await ExamAPI.deleteMark(id);
                toast.success("Record Deleted");
                handleFetchPerformance();
            } catch {
                toast.error("Deletion failed");
            }
        }
    };

    const handleDownloadReport = async () => {
        const content = printRef.current;
        if (!content) return;

        setIsDownloading(true);
        try {
            // Render to high-quality canvas (scale 2 for retina/HD print crispness)
            const canvas = await html2canvas(content, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');

            // Standard A4 document format
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const imgWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, '', 'FAST');
            heightLeft -= pageHeight;

            // Handle multi-page (like Pre-Primary pages)
            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, '', 'FAST');
                heightLeft -= pageHeight;
            }

            const term = selection.term === 'Both' ? 'Term 2' : selection.term;
            pdf.save(`ReportCard_${selection.studentId || 'Student'}_${term}.pdf`);
            toast.success("Report Card PDF downloaded successfully!");
        } catch (error) {
            console.error("PDF generation failed:", error);
            toast.error("Failed to generate PDF download");
        } finally {
            setIsDownloading(false);
        }
    };

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

    const handlePrint = () => {
        const content = printRef.current;
        if (!content) return;

        // Copy all global styles, Tailwind CSS links, and internal styles from the main app document
        const parentStyles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
            .map(node => node.outerHTML)
            .join('\n');

        // Convert relative image paths to absolute so they load in the new window
        const base = window.location.origin;
        const htmlContent = content.innerHTML.replace(/src="\/([^"]+)"/g, `src="${base}/$1"`);

        const printWindow = window.open('', '_blank', 'width=900,height=1200');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Report Card</title>
                ${parentStyles}
                <style>
                    html, body {
                        background: #ffffff !important;
                        color: #000000 !important;
                        color-scheme: light !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        margin: 0;
                        padding: 0;
                    }
                    * { color-scheme: light !important; box-sizing: border-box; }
                    img { max-width: 100%; }
                </style>
            </head>
            <body style="background:#ffffff !important; color:#000 !important; color-scheme:light !important;">
                ${htmlContent}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 800);
    };

    const renderTemplate = () => {
        const selectedClassroomData = classrooms.find(c => c.id == selection.classroomId || c.classroom_id == selection.classroomId);
        const gradeName = selectedClassroomData?.class_name?.toLowerCase() || '';
        const studentObj = students.find(s => (s.student_id || s.id) == selection.studentId) || {};

        const isPrePrimaryClass = gradeName.match(/(nursery|junior|senior|kg|jr|sr)/);
        if (isPrePrimaryClass) {
            const ppData = [
                { term: 'I Term', ...prePrimaryData.find(d => d.term === 'Term 1' || d.term === 'I Term') },
                { term: 'II Term', ...prePrimaryData.find(d => d.term === 'Term 2' || d.term === 'II Term') }
            ];
            const ppStudentData = {
                ...studentObj,
                class_name: selectedClassroomData?.class_name || '',
                section: selectedClassroomData?.section || ''
            };
            return <PrePrimaryReport prePrimaryData={ppData} studentData={ppStudentData} />;
        }

        // Helper stats for 1-8 templates
        const term1Data = performance.filter(m => m.term === 'Term 1');
        const term2Data = performance.filter(m => m.term === 'Term 2' || m.term === 'Final');

        // Calculate Term-wise and Overall Attendance
        let t1Present = 0, t1Total = 0;
        let t2Present = 0, t2Total = 0;

        (attendanceData || []).forEach(row => {
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
        const overallGrade = performance.length > 0 ? performance[0].overall_grade : "N/A";
        const overallPercentage = performance.length > 0 ? performance[0].overall_percentage : "N/A";
        const totalMarks = performance.length > 0 ? performance[0].total_marks_obtained : "N/A";

        const currentClassName = selectedClassroomData?.class_name || "";
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
            ...studentObj,
            class_name: selectedClassroomData?.class_name || '',
            section: selectedClassroomData?.section || 'A',
            roll_number: studentObj?.roll_number || '1',
            student_name: studentObj?.student_name || '',
            father_mobile: studentObj?.father_mobile || '',
            mother_mobile: studentObj?.mother_mobile || ''
        };

        if (['1st', '2nd'].includes(gradeName)) {
            return <PrimaryReport1to2 studentData={templateStudentData} term1Data={term1Data} term2Data={term2Data} coScholasticData={coScholasticData} overallStats={overallStats} />;
        }

        if (['3rd', '4th', '5th'].includes(gradeName)) {
            return <PrimaryReport3to5 studentData={templateStudentData} term1Data={term1Data} term2Data={term2Data} coScholasticData={coScholasticData} overallStats={overallStats} />;
        }

        // Default for 6th-8th
        return <MiddleReport6to8 studentData={templateStudentData} term1Data={term1Data} term2Data={term2Data} coScholasticData={coScholasticData} overallStats={overallStats} />;
    };

    const filteredPerformance = performance.filter(p => {
        if (selection.examId && p.exam_id != selection.examId) return false;
        if (selection.term !== 'Both' && p.term !== selection.term) return false;
        return true;
    });

    const filteredStudents = students.filter(s =>
        s.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.roll_number?.toString().toLowerCase().includes(searchQuery.toLowerCase())
    );

    const term1Performance = filteredPerformance.filter(p => p.term === 'Term 1');
    const term2Performance = filteredPerformance.filter(p => p.term === 'Term 2' || p.term === 'Final');

    const isPrePrimary = classrooms.find(c => c.id == selection.classroomId)?.class_name?.toLowerCase().match(/(nursery|junior|senior|kg|jr|sr)/);


    return (
        <div className={`${isEmbedded ? 'p-0' : 'p-4 lg:p-8'} bg-[#F8FAFC] min-h-screen font-sans text-left pb-24 anim-fade-in`}>
            <style>{`
                @media print {
                    @page { size: A4 portrait; margin: 0; }
                    html, body, #root, [data-reactroot] {
                        background: #ffffff !important;
                        color-scheme: light !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                }
            `}</style>
            {!isEmbedded && (
                <ModuleHeader
                    title="Marks Registry"
                    subTitle="Student-wise Detailed Assessment Audit"
                    icon={FileText}
                    badge="ADMIN AUDIT"
                    toggleSidebar={toggleSidebar}
                />
            )}

            <div className="mt-8 bg-white border border-slate-200 rounded-md p-6 shadow-sm flex flex-nowrap gap-3 items-end w-full overflow-x-auto pb-2">
                <div className="space-y-1.5 flex-1 min-w-[140px]">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Classroom</label>
                    <select
                        className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-md font-bold text-primary text-[11px] outline-none"
                        value={selection.classroomId}
                        onChange={e => setSelection({ ...selection, classroomId: e.target.value })}
                    >
                        <option value="">Select Classroom</option>
                        {classrooms.map(c => <option key={c.id || c.classroom_id} value={c.id || c.classroom_id}>{c.class_name}</option>)}
                    </select>
                </div>

                <div className="space-y-1.5 flex-1 min-w-[160px]">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Student</label>
                    <select
                        className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-md font-bold text-primary text-[11px] outline-none"
                        value={selection.studentId}
                        onChange={e => setSelection({ ...selection, studentId: e.target.value })}
                    >
                        <option value="">Select Student</option>
                        {filteredStudents.map(s => <option key={s.student_id || s.id} value={s.student_id || s.id}>#{s.roll_number || '---'} {s.student_name}</option>)}
                    </select>
                </div>

                {!isPrePrimary && (
                    <div className="space-y-1.5 flex-1 min-w-[140px]">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Exam (Filter)</label>
                        <select
                            className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-md font-bold text-primary text-[11px] outline-none"
                            value={selection.examId}
                            onChange={e => setSelection({ ...selection, examId: e.target.value })}
                        >
                            <option value="">All Exams</option>
                            {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.exam_name} ({ex.term})</option>)}
                        </select>
                    </div>
                )}

                <div className="space-y-1.5 flex-1 min-w-[120px]">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Term</label>
                    <select
                        className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-md font-bold text-primary text-[11px] outline-none"
                        value={selection.term}
                        onChange={e => setSelection({ ...selection, term: e.target.value })}
                    >
                        <option value="Term 1">Term 1</option>
                        <option value="Term 2">Term 2</option>
                        {!isPrePrimary && <option value="Both">Both Terms</option>}
                    </select>
                </div>

                <button
                    onClick={handleFetchPerformance}
                    className="px-6 py-2.5 bg-white text-black border border-slate-200 rounded-md font-bold text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm min-w-[140px] shrink-0 justify-center h-[38px]"
                >
                    <Search size={14} /> Fetch Details
                </button>
            </div>

            {loading ? (
                <div className="mt-12 py-32 text-center">
                    <Loader2 size={40} className="mx-auto text-indigo-600 animate-spin mb-4" />
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Retrieving Student Matrix...</p>
                </div>
            ) : isPrePrimary ? (
                <div className="mt-8 space-y-8">
                    {selection.studentId && (
                        <div className="flex justify-center mb-8">
                            <div className="bg-slate-100 p-1.5 rounded-md flex gap-2 border border-slate-200">
                                <button
                                    onClick={() => setActiveViewTab('grid')}
                                    className={`px-6 py-2.5 rounded-md font-bold text-[11px] uppercase tracking-widest transition-all flex items-center gap-2 ${activeViewTab === 'grid'
                                            ? 'bg-[#001736] text-amber-400 shadow-md'
                                            : 'text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    <FileText size={14} /> Assessment Registry Grid
                                </button>
                                <button
                                    onClick={() => setActiveViewTab('preview')}
                                    className={`px-6 py-2.5 rounded-md font-bold text-[11px] uppercase tracking-widest transition-all flex items-center gap-2 ${activeViewTab === 'preview'
                                            ? 'bg-[#001736] text-amber-400 shadow-md'
                                            : 'text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    <Eye size={14} /> Report Card Live Preview
                                </button>
                            </div>
                        </div>
                    )}

                    {activeViewTab === 'preview' && selection.studentId ? (
                        <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden anim-fade-in p-6">
                            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                                <h3 className="text-sm font-black text-[#001736] uppercase">Report Card Live Preview</h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleDownloadReport}
                                        disabled={isDownloading}
                                        className="px-5 py-2.5 bg-white text-black border border-slate-200 rounded-md font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                                    >
                                        {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                                        Download PDF
                                    </button>
                                    <button
                                        onClick={handlePrint}
                                        className="px-5 py-2.5 bg-white text-black border border-slate-200 rounded-md font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
                                    >
                                        <Printer size={14} /> Print Report Card
                                    </button>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-6 rounded-md flex justify-center overflow-x-auto">
                                <div
                                    ref={printRef}
                                    className="bg-white p-8 rounded-md shadow-md border border-slate-200"
                                    style={{ width: '100%', maxWidth: '850px', minHeight: '1100px' }}
                                >
                                    {renderTemplate()}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <PrePrimaryMarksEntry
                            isEmbedded={true}
                            externalSelection={{
                                classroomId: selection.classroomId,
                                studentId: selection.studentId,
                                term: selection.term === 'Term 2' ? 'II Term' : 'I Term'
                            }}
                        />
                    )}
                </div>
            ) : filteredPerformance.length > 0 ? (
                <div className="mt-8 space-y-8">
                    <div className="flex justify-center mb-8">
                        <div className="bg-slate-100 p-1.5 rounded-md flex gap-2 border border-slate-200">
                            <button
                                onClick={() => setActiveViewTab('grid')}
                                className={`px-6 py-2.5 rounded-md font-bold text-[11px] uppercase tracking-widest transition-all flex items-center gap-2 ${activeViewTab === 'grid'
                                        ? 'bg-[#001736] text-amber-400 shadow-md'
                                        : 'text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                <FileText size={14} /> Assessment Registry Grid
                            </button>
                            <button
                                onClick={() => setActiveViewTab('preview')}
                                className={`px-6 py-2.5 rounded-md font-bold text-[11px] uppercase tracking-widest transition-all flex items-center gap-2 ${activeViewTab === 'preview'
                                        ? 'bg-[#001736] text-amber-400 shadow-md'
                                        : 'text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                <Eye size={14} /> Report Card Live Preview
                            </button>
                        </div>
                    </div>

                    {activeViewTab === 'preview' ? (
                        <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden anim-fade-in p-6">
                            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                                <h3 className="text-sm font-black text-[#001736] uppercase">Report Card Live Preview</h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleDownloadReport}
                                        disabled={isDownloading}
                                        className="px-5 py-2.5 bg-white text-black border border-slate-200 rounded-md font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                                    >
                                        {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                                        Download PDF
                                    </button>
                                    <button
                                        onClick={handlePrint}
                                        className="px-5 py-2.5 bg-white text-black border border-slate-200 rounded-md font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
                                    >
                                        <Printer size={14} /> Print Report Card
                                    </button>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-6 rounded-md flex justify-center overflow-x-auto">
                                <div
                                    ref={printRef}
                                    className="bg-white p-8 rounded-md shadow-md border border-slate-200"
                                    style={{ width: '100%', maxWidth: '850px', minHeight: '1100px' }}
                                >
                                    {renderTemplate()}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="bg-white overflow-hidden shadow-sm anim-fade-in">
                                <div className="p-6 bg-slate-50 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-md">
                                            <BookOpen size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-primary uppercase">Subject Performance Audit</h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                {students.find(s => (s.student_id || s.id) == selection.studentId)?.student_name} • {selection.term}
                                            </p>
                                        </div>
                                    </div>

                                </div>

                                <div className="p-6 space-y-12">
                                    {term1Performance.length > 0 && (
                                        <div className="space-y-4">
                                            <div className="bg-[#001736] text-amber-400 font-black text-[11px] uppercase tracking-widest px-6 py-3.5  shadow-sm flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
                                                Term 1 Assessment Records
                                            </div>
                                            <div className="overflow-x-auto border border-[#001736]/20 shadow-sm bg-white">
                                                <table className="w-full border-collapse">
                                                    <thead>
                                                        <tr className="bg-slate-50">
                                                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border border-black">Subject</th>
                                                            <th className="px-2 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest border border-black w-20">Unit (20)</th>
                                                            <th className="px-2 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest border border-black w-20">Test (10)</th>
                                                            <th className="px-2 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest border border-black w-20">Proj (10)</th>
                                                            <th className="px-2 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest border border-black w-20">Oral (10)</th>
                                                            <th className="px-2 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest border border-black w-20">Note (10)</th>
                                                            <th className="px-2 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest border border-black w-20">Term (40)</th>
                                                            <th className="px-2 py-4 text-center text-[10px] font-black text-indigo-600 uppercase tracking-widest border border-black bg-indigo-50/20 w-16">Total</th>
                                                            <th className="px-4 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest border border-black w-32">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {term1Performance.map((p) => {
                                                            const originalIdx = performance.findIndex(orig => orig.id === p.id);
                                                            return (
                                                                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                                                    <td className="px-6 py-4 border border-black">
                                                                        <div className="flex flex-col">
                                                                            <span className="text-[12px] font-bold text-primary uppercase">{p.subject_name}</span>
                                                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{p.exam_name}</span>
                                                                        </div>
                                                                    </td>
                                                                    {['unit_written', 'class_test', 'project', 'oral', 'notebook', 'term_written'].map((field, fIdx) => (
                                                                        <td key={field} className="px-2 py-3 border border-black text-center">
                                                                            {p.is_editing ? (
                                                                                <input
                                                                                    id={`audit-input-${originalIdx}-${fIdx}`}
                                                                                    type="number"
                                                                                    className="w-full bg-white border border-indigo-200 rounded p-1 text-center font-bold text-xs text-indigo-600 focus:border-indigo-500 outline-none"
                                                                                    value={p.edit_data[field] ?? ''}
                                                                                    onChange={e => handleEditChange(originalIdx, field, e.target.value)}
                                                                                    onKeyDown={e => handleKeyDown(e, originalIdx, fIdx)}
                                                                                />
                                                                            ) : (
                                                                                <span className="text-[11px] font-bold text-slate-600">{p[field] ?? '--'}</span>
                                                                            )}
                                                                        </td>
                                                                    ))}
                                                                    <td className="px-2 py-3 text-center border border-black bg-indigo-50/10 font-black text-indigo-600 text-xs">
                                                                        {p.total_obtained}
                                                                    </td>
                                                                    <td className="px-4 py-4 border border-black">
                                                                        <div className="flex items-center justify-center gap-2">
                                                                            {p.is_editing ? (
                                                                                <button
                                                                                    onClick={() => handleSaveUpdate(originalIdx)}
                                                                                    disabled={isSaving}
                                                                                    className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                                                                    title="Save Changes"
                                                                                >
                                                                                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                                                                </button>
                                                                            ) : (
                                                                                <button
                                                                                    onClick={() => handleEditToggle(originalIdx)}
                                                                                    className="p-2 bg-slate-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                                                                    title="Edit Record"
                                                                                >
                                                                                    <Pencil size={14} />
                                                                                </button>
                                                                            )}
                                                                            <button
                                                                                onClick={() => handleDelete(p.id)}
                                                                                className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                                                                                title="Delete Record"
                                                                            >
                                                                                <Trash2 size={14} />
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {term2Performance.length > 0 && (
                                        <div className="space-y-4">
                                            <div className="bg-[#001736] text-amber-400 font-black text-[11px] uppercase tracking-widest px-6 py-3.5  shadow-sm flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
                                                Term 2 Assessment Records
                                            </div>
                                            <div className="overflow-x-auto border border-[#001736]/20  shadow-sm bg-white">
                                                <table className="w-full border-collapse">
                                                    <thead>
                                                        <tr className="bg-slate-50">
                                                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border border-black">Subject</th>
                                                            <th className="px-2 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest border border-black w-20">Unit (20)</th>
                                                            <th className="px-2 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest border border-black w-20">Test (10)</th>
                                                            <th className="px-2 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest border border-black w-20">Proj (10)</th>
                                                            <th className="px-2 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest border border-black w-20">Oral (10)</th>
                                                            <th className="px-2 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest border border-black w-20">Note (10)</th>
                                                            <th className="px-2 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest border border-black w-20">Term (40)</th>
                                                            <th className="px-2 py-4 text-center text-[10px] font-black text-indigo-600 uppercase tracking-widest border border-black bg-indigo-50/20 w-16">Total</th>
                                                            <th className="px-4 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest border border-black w-32">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {term2Performance.map((p) => {
                                                            const originalIdx = performance.findIndex(orig => orig.id === p.id);
                                                            return (
                                                                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                                                    <td className="px-6 py-4 border border-black">
                                                                        <div className="flex flex-col">
                                                                            <span className="text-[12px] font-bold text-primary uppercase">{p.subject_name}</span>
                                                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{p.exam_name}</span>
                                                                        </div>
                                                                    </td>
                                                                    {['unit_written', 'class_test', 'project', 'oral', 'notebook', 'term_written'].map((field, fIdx) => (
                                                                        <td key={field} className="px-2 py-3 border border-black text-center">
                                                                            {p.is_editing ? (
                                                                                <input
                                                                                    id={`audit-input-${originalIdx}-${fIdx}`}
                                                                                    type="number"
                                                                                    className="w-full bg-white border border-indigo-200 rounded p-1 text-center font-bold text-xs text-indigo-600 focus:border-indigo-500 outline-none"
                                                                                    value={p.edit_data[field] ?? ''}
                                                                                    onChange={e => handleEditChange(originalIdx, field, e.target.value)}
                                                                                    onKeyDown={e => handleKeyDown(e, originalIdx, fIdx)}
                                                                                />
                                                                            ) : (
                                                                                <span className="text-[11px] font-bold text-slate-600">{p[field] ?? '--'}</span>
                                                                            )}
                                                                        </td>
                                                                    ))}
                                                                    <td className="px-2 py-3 text-center border border-black bg-indigo-50/10 font-black text-indigo-600 text-xs">
                                                                        {p.total_obtained}
                                                                    </td>
                                                                    <td className="px-4 py-4 border border-black">
                                                                        <div className="flex items-center justify-center gap-2">
                                                                            {p.is_editing ? (
                                                                                <button
                                                                                    onClick={() => handleSaveUpdate(originalIdx)}
                                                                                    disabled={isSaving}
                                                                                    className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                                                                    title="Save Changes"
                                                                                >
                                                                                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                                                                </button>
                                                                            ) : (
                                                                                <button
                                                                                    onClick={() => handleEditToggle(originalIdx)}
                                                                                    className="p-2 bg-slate-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                                                                    title="Edit Record"
                                                                                >
                                                                                    <Pencil size={14} />
                                                                                </button>
                                                                            )}
                                                                            <button
                                                                                onClick={() => handleDelete(p.id)}
                                                                                className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                                                                                title="Delete Record"
                                                                            >
                                                                                <Trash2 size={14} />
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-[#001736] rounded-md p-8 text-white">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-white/10 rounded-lg">
                                        <GraduationCap className="text-amber-400" size={20} />
                                    </div>
                                    <h4 className="text-xs font-black uppercase tracking-widest text-white!">Scholastic Finalization Summary</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div>
                                        <p className="text-[10px] font-bold text-white uppercase tracking-widest mb-1">Subjects Cataloged</p>
                                        <p className="text-2xl font-black text-white">{filteredPerformance.length}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-white uppercase tracking-widest mb-1">Avg Percentage</p>
                                        <p className="text-2xl font-black text-white">
                                            {(filteredPerformance.reduce((acc, curr) => acc + parseFloat(curr.percentage || 0), 0) / (filteredPerformance.length || 1)).toFixed(2)}%
                                        </p>
                                    </div>
                                    <div className="flex items-end justify-end">
                                        <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
                                            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Registry Synchronized</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            ) : (
                <div className="mt-12 text-center py-48 bg-white rounded-md border border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                        <User size={40} />
                    </div>
                    <p className="text-slate-400 font-bold text-sm tracking-wide uppercase">Select Classroom & Student to audit academic profile</p>
                </div>
            )}
        </div>
    );
};

export default MarksRegistry;
