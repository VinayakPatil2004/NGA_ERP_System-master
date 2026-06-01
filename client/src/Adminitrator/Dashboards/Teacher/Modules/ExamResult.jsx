import React, { useState, useEffect, useRef } from 'react';
import { ClipboardList, Printer, Search } from 'lucide-react';
import * as ClassroomAPI from '../../../../services/classroomAPI';
import * as StudentAPI from '../../../../services/studentAPI';
import * as ExamAPI from '../../../../services/examAPI';
import { useAcademicYear } from '../../../../context/AcademicYearContext';
import ModuleHeader from '../../../admcomponents/ModuleHeader';

// Import Templates
import PrePrimaryReport from './ExamResultTemplates/PrePrimaryReport';
import PrimaryReport1to2 from './ExamResultTemplates/PrimaryReport1to2';
import PrimaryReport3to5 from './ExamResultTemplates/PrimaryReport3to5';
import MiddleReport6to8 from './ExamResultTemplates/MiddleReport6to8';

const ExamResult = ({ toggleSidebar }) => {
    const { selectedYear: globalYear, allYears: academicYears } = useAcademicYear();
    const [classrooms, setClassrooms] = useState([]);
    const [students, setStudents] = useState([]);

    const selectedYear = globalYear?.id;
    const [selectedClassroom, setSelectedClassroom] = useState("");
    const [selectedStudent, setSelectedStudent] = useState("");

    const [performanceData, setPerformanceData] = useState([]);
    const [coScholasticData, setCoScholasticData] = useState([]);
    const [prePrimaryData, setPrePrimaryData] = useState([]);
    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Initial Fetch: Classrooms
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const classes = await ClassroomAPI.getClassrooms();
                setClassrooms(classes);
            } catch (error) {
                console.error("Error fetching initial data:", error);
            }
        };
        fetchInitialData();
    }, [selectedYear]);

    // Fetch students when classroom or year changes
    useEffect(() => {
        const fetchStudents = async () => {
            if (!selectedClassroom || !selectedYear) {
                setStudents([]);
                return;
            }
            try {
                const yearObj = academicYears.find(y => y.id === parseInt(selectedYear));
                const yearName = yearObj ? yearObj.year_name : "";
                const studentList = await StudentAPI.getAllStudents(yearName, '', selectedClassroom);
                setStudents(studentList);
            } catch (error) {
                console.error("Error fetching students:", error);
            }
        };
        fetchStudents();
    }, [selectedClassroom, selectedYear, academicYears]);

    // Fetch Performance Data when student changes
    useEffect(() => {
        const fetchPerformance = async () => {
            if (!selectedStudent || !selectedYear) {
                setPerformanceData([]);
                setCoScholasticData([]);
                setPrePrimaryData([]);
                setAttendanceData([]);
                return;
            }
            setLoading(true);
            try {
                const selectedClassroomData = classrooms.find(c => c.id === parseInt(selectedClassroom));
                const gradeName = selectedClassroomData?.class_name?.toLowerCase() || '';

                const isPrePrimary = ['nursery', 'jr.kg', 'sr.kg'].includes(gradeName);

                if (isPrePrimary) {
                    const preMarks = await ExamAPI.getPrePrimaryMarks(selectedStudent, null, selectedYear);
                    // getPrePrimaryMarks returns array if term is null
                    setPrePrimaryData(preMarks || []);
                    setPerformanceData([]);
                    setCoScholasticData([]);
                    setAttendanceData([]);
                } else {
                    const [perf, coSch, att] = await Promise.all([
                        ExamAPI.getStudentPerformance(selectedStudent, selectedYear),
                        ExamAPI.getCoScholastic(selectedStudent, selectedYear),
                        StudentAPI.getStudentAttendanceRecords(selectedStudent, selectedYear).catch(() => [])
                    ]);
                    setPerformanceData(perf || []);
                    setCoScholasticData(coSch || []);
                    setAttendanceData(att || []);
                    setPrePrimaryData([]);
                }
            } catch (error) {
                console.error("Error fetching performance:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPerformance();
    }, [selectedStudent, selectedYear, classrooms, selectedClassroom]);

    const printRef = useRef(null);

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

    const renderTemplate = () => {
        const selectedClassroomData = classrooms.find(c => c.id === parseInt(selectedClassroom));
        const gradeName = selectedClassroomData?.class_name?.toLowerCase() || '';
        const studentObj = students.find(s => s.id === parseInt(selectedStudent)) || {};

        if (['nursery', 'jr.kg', 'sr.kg'].includes(gradeName)) {
            return <PrePrimaryReport prePrimaryData={prePrimaryData} studentData={studentObj} />;
        }

        // Helper stats for 1-8 templates
        const term1Data = performanceData.filter(m => m.term === 'Term 1');
        const term2Data = performanceData.filter(m => m.term === 'Term 2');

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
        const overallGrade = performanceData.length > 0 ? performanceData[0].overall_grade : "N/A";
        const overallPercentage = performanceData.length > 0 ? performanceData[0].overall_percentage : "N/A";
        const totalMarks = performanceData.length > 0 ? performanceData[0].total_marks_obtained : "N/A";

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

        if (['1st', '2nd'].includes(gradeName)) {
            return <PrimaryReport1to2 studentData={studentObj} term1Data={term1Data} term2Data={term2Data} coScholasticData={coScholasticData} overallStats={overallStats} />;
        }

        if (['3rd', '4th', '5th'].includes(gradeName)) {
            return <PrimaryReport3to5 studentData={studentObj} term1Data={term1Data} term2Data={term2Data} coScholasticData={coScholasticData} overallStats={overallStats} />;
        }

        // Default for 6th-8th
        return <MiddleReport6to8 studentData={studentObj} term1Data={term1Data} term2Data={term2Data} coScholasticData={coScholasticData} overallStats={overallStats} />;
    };

    return (
        <div className="p-4 lg:p-8 bg-[#F8FAFC] min-h-screen font-sans text-left pb-16 print:p-0 print:bg-white print:min-h-0">
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

            {/* Standardized Institutional Header */}
            <div className="print:hidden">
                <ModuleHeader
                    title="Exam Results"
                    subTitle="Academic Performance Ledger & Grade Analytics"
                    icon={ClipboardList}
                    toggleSidebar={toggleSidebar}
                >
                    <button
                        onClick={handlePrint}
                        disabled={!selectedStudent}
                        className="flex items-center gap-2 px-6 py-3 bg-[#FFB606] text-[#001736] text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Printer className="w-4 h-4" />
                        Export Ledger
                    </button>
                </ModuleHeader>
            </div>

            {/* Selection Controls */}
            <div className="mt-8 flex flex-col lg:flex-row items-center justify-between bg-white border border-slate-200 p-6 rounded-2xl shadow-sm mb-8 gap-6 print:hidden anim-fade-in">
                <div className="flex flex-wrap items-center gap-6">
                    <div className="space-y-1.5 min-w-[200px]">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Classroom</label>
                        <select
                            value={selectedClassroom}
                            onChange={(e) => setSelectedClassroom(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-[#001736] text-[11px] font-bold px-4 py-3 rounded-xl outline-none focus:border-[#FFB606] transition-all cursor-pointer"
                        >
                            <option value="">Select Classroom</option>
                            {classrooms.map(c => (
                                <option key={c.id} value={c.id}>{c.class_name} ({c.section || 'N/A'})</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5 min-w-[250px]">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Student Record</label>
                        <select
                            value={selectedStudent}
                            onChange={(e) => setSelectedStudent(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-[#001736] text-[11px] font-bold px-4 py-3 rounded-xl outline-none focus:border-[#FFB606] transition-all cursor-pointer"
                        >
                            <option value="">Select Student</option>
                            {students.map(s => (
                                <option key={s.id} value={s.id}>{s.student_name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {!selectedStudent ? (
                <div className="bg-white border border-dashed border-slate-300 rounded-xl p-12 text-center print:hidden">
                    <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-slate-600 font-bold mb-1">No Student Selected</h3>
                    <p className="text-slate-400 text-sm">Please select an academic year, classroom, and student to view the result.</p>
                </div>
            ) : loading ? (
                <div className="bg-white border border-slate-300 rounded-xl p-12 text-center print:hidden">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#001736] mx-auto mb-4"></div>
                    <p className="text-slate-500 font-medium">Fetching performance data...</p>
                </div>
            ) : (
                <div ref={printRef} style={{ background: '#fff' }}>
                    {renderTemplate()}
                </div>
            )}
        </div>
    );
};

export default ExamResult;
