import React, { useState, useEffect } from 'react';
import { 
    ClipboardList, Search, Save, AlertCircle, 
    CheckSquare, Loader2, Download, Upload,
    CheckCircle2, XCircle, BookOpen, Star, FileUp
} from 'lucide-react';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import CoScholasticEntry from './CoScholasticEntry';
import PrePrimaryMarksEntry from './PrePrimaryMarksEntry';
import * as ExamAPI from '../../../../services/examAPI';
import * as ClassroomAPI from '../../../../services/classroomAPI';
import { useAcademicYear } from '../../../../context/AcademicYearContext';

const DEFAULT_SETTINGS = [
    { component_name: 'Unit Written', max_marks: 20 },
    { component_name: 'Class Test', max_marks: 10 },
    { component_name: 'Project', max_marks: 10 },
    { component_name: 'Oral', max_marks: 10 },
    { component_name: 'Note Book', max_marks: 10 },
    { component_name: 'Term Written', max_marks: 40 }
];


const MarksEntry = ({ toggleSidebar }) => {
    const { selectedYear: globalYear } = useAcademicYear();
    const [classrooms, setClassrooms] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [exams, setExams] = useState([]);
    const [settings, setSettings] = useState([]); // Component settings (max marks)
    const [gradingSystem, setGradingSystem] = useState([]);

    const [selection, setSelection] = useState({
        academicYearId: '',
        classroomId: '',
        subjectName: '',
        examId: '',
        studentId: ''
    });

    const [studentsData, setStudentsData] = useState([]);
    const [loading, setLoading] = useState(false);
    // eslint-disable-next-line no-unused-vars
    const [fetchingExams, setFetchingExams] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('scholastic'); // 'scholastic' | 'coscholastic'
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const STUDENTS_PER_PAGE = 15;

    // Load initial data
    useEffect(() => {
        const fetchInitial = async () => {
            try {
                const [classes] = await Promise.all([
                    ClassroomAPI.getClassrooms(globalYear?.id)
                ]);
                setClassrooms(classes);
            } catch {
                toast.error("Failed to load setup data");
            }
        };
        fetchInitial();
    }, [globalYear?.id]);

    // Sync context year to local selection
    useEffect(() => {
        if (globalYear) {
            setSelection(prev => ({ ...prev, academicYearId: globalYear.id }));
        }
    }, [globalYear]);

    // Load subjects for classroom
    useEffect(() => {
        if (selection.classroomId) {
            ClassroomAPI.getClassSubjects(selection.classroomId, globalYear?.id)
                .then(data => setSubjects(data))
                .catch(() => toast.error("Failed to load subjects"));
        }
    }, [selection.classroomId, globalYear?.id]);

    // Load exams for academic year
    useEffect(() => {
        if (selection.academicYearId) {
            setFetchingExams(true);
            ExamAPI.getAllExams(selection.academicYearId)
                .then(data => setExams(data))
                .catch(err => console.error("Exam Load Failed:", err))
                .finally(() => setFetchingExams(false));
        }
    }, [selection.academicYearId]);

    // Determine if Pre-Primary
    const isPrePrimary = classrooms.find(c => c.id == selection.classroomId)?.class_name?.toLowerCase()?.match(/(nursery|nursary|nurs|junior|senior|kg|jr|sr)/i);

    // Load students for classroom (specifically for Pre-Primary mode)
    const [ppStudents, setPpStudents] = useState([]);
    useEffect(() => {
        if (selection.classroomId && isPrePrimary) {
            ClassroomAPI.getStudentsByClassroom(selection.classroomId, globalYear?.id)
                .then(setPpStudents)
                .catch(() => toast.error("Failed to load students"));
        }
    }, [selection.classroomId, globalYear?.id, isPrePrimary]);

    // Fetch marks when all selections are made
    const handleFetchMarks = async () => {
        if (!selection.examId || !selection.classroomId || !selection.subjectName) {
            toast.warning("Please select Exam, Classroom and Subject");
            return;
        }

        setLoading(true);
        try {
            const [marksBatch, examSettings, grades] = await Promise.all([
                ExamAPI.getMarksBatch(selection.examId, selection.classroomId, selection.subjectName, globalYear?.id),
                ExamAPI.getExamSettings(selection.examId),
                ExamAPI.getGradingSystem()
            ]);

            setGradingSystem(grades);

            if (examSettings.length === 0) {
                toast.info("Using default weightage settings. Please ensure Admin has confirmed these.");
                setSettings(DEFAULT_SETTINGS);
            } else {
                setSettings(examSettings);
            }

            let sortedBatch = [...marksBatch].sort((a, b) => {
                const aRoll = parseInt(a.roll_number);
                const bRoll = parseInt(b.roll_number);
                if (!isNaN(aRoll) && !isNaN(bRoll)) return aRoll - bRoll;
                if (a.roll_number && !b.roll_number) return -1;
                if (!a.roll_number && b.roll_number) return 1;
                return (a.student_name || '').localeCompare(b.student_name || '');
            });

            let nextRoll = Math.max(0, ...sortedBatch.map(s => {
                const parsed = parseInt(s.roll_number);
                return isNaN(parsed) ? 0 : parsed;
            })) + 1;

            setStudentsData(sortedBatch.map(s => ({
                id: s.id,
                roll_number: s.roll_number || String(nextRoll++),
                student_name: s.student_name,
                unit_written: s.marks?.unit_written ?? '',
                class_test: s.marks?.class_test ?? '',
                project: s.marks?.project ?? '',
                oral: s.marks?.oral ?? '',
                notebook: s.marks?.notebook ?? '',
                term_written: s.marks?.term_written ?? '',
                remarks: s.marks?.remarks ?? '',
                is_draft: s.marks?.is_draft ?? 1
            })));
        } catch {
            toast.error("Failed to fetch student record");
        } finally {
            setLoading(false);
        }
    };

    const handleMarkChange = (index, field, value) => {
        // Validation: Prevent marks higher than max_marks
        if (field !== 'remarks') {
            const component = settings.find(c => getComponentKey(c.component_name) === field);
            if (component && parseFloat(value) > parseFloat(component.max_marks)) {
                toast.error(`Marks cannot exceed maximum (${component.max_marks})`);
                return;
            }
        }

        const updated = [...studentsData];
        updated[index][field] = value;
        setStudentsData(updated);
    };

    const handleSave = async (isFinal = false) => {
        setIsSaving(true);
        try {
            const marksData = studentsData.map(s => ({
                student_id: s.id,
                unit_written: s.unit_written,
                class_test: s.class_test,
                project: s.project,
                oral: s.oral,
                notebook: s.notebook,
                term_written: s.term_written,
                remarks: s.remarks,
                is_draft: isFinal ? 0 : 1
            }));

            await ExamAPI.saveMarks({
                exam_id: selection.examId,
                subject_name: selection.subjectName,
                marks_data: marksData
            });

            toast.success(isFinal ? "Marks submitted for approval" : "Progress saved as draft");
            if (isFinal) {
                handleFetchMarks(); // Refresh
            }
        } catch {
            toast.error("Failed to save marks");
        } finally {
            setIsSaving(false);
        }
    };

    const handleFillDummyMarks = () => {
        if (studentsData.length === 0) {
            toast.warning("No student records loaded to populate");
            return;
        }

        const updated = studentsData.map(student => {
            if (student.is_draft === 0) return student; // Skip finalized locked rows

            const newStudent = { ...student };
            settings.forEach(comp => {
                const field = getComponentKey(comp.component_name);
                if (field) {
                    const max = parseFloat(comp.max_marks || 0);
                    // Realistic marks: 60% to 100% of max
                    const min = Math.floor(max * 0.6);
                    const randomMark = min + Math.floor(Math.random() * (max - min + 1));
                    newStudent[field] = String(randomMark);
                }
            });
            newStudent.remarks = "Shows steady progress and keen interest.";
            return newStudent;
        });

        setStudentsData(updated);
        toast.success("Realistic dummy marks populated for all draft rows!");
    };

    const handleDownloadTemplate = () => {
        const headers = ['Roll No', 'Student Name', ...settings.map(s => s.component_name), 'Remarks'];
        const data = studentsData.map(s => [
            s.roll_number,
            s.student_name,
            ...settings.map(comp => s[getComponentKey(comp.component_name)] || ''),
            s.remarks
        ]);

        const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Marks Template");
        XLSX.writeFile(wb, `Marks_Template_${selection.classroomId}_${selection.subjectName}.xlsx`);
    };

    const handleImportExcel = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(ws);

            const newData = [...studentsData];
            data.forEach(row => {
                const rollNo = row['Roll No'];
                const studentIdx = newData.findIndex(s => s.roll_number == rollNo);
                
                if (studentIdx !== -1) {
                    settings.forEach((comp) => {
                        const field = getComponentKey(comp.component_name);
                        if (row[comp.component_name] !== undefined) {
                            newData[studentIdx][field] = row[comp.component_name];
                        }
                    });
                    if (row['Remarks'] !== undefined) {
                        newData[studentIdx].remarks = row['Remarks'];
                    }
                }
            });

            setStudentsData(newData);
            toast.success("Excel data imported successfully");
            e.target.value = '';
        };
        reader.readAsBinaryString(file);
    };

    const handleKeyDown = (e, row, col) => {
        let nextRow = row;
        let nextCol = col;
        const totalCols = settings.length; 
        
        const pageStart = (currentPage - 1) * STUDENTS_PER_PAGE;
        const pageEnd = Math.min(currentPage * STUDENTS_PER_PAGE, studentsData.length) - 1;

        if (e.key === 'ArrowUp') nextRow = Math.max(pageStart, row - 1);
        else if (e.key === 'ArrowDown') nextRow = Math.min(pageEnd, row + 1);
        else if (e.key === 'ArrowLeft') nextCol = Math.max(0, col - 1);
        else if (e.key === 'ArrowRight') nextCol = Math.min(totalCols, col + 1);
        else return;

        const nextInput = document.getElementById(`input-${nextRow}-${nextCol}`);
        if (nextInput) {
            e.preventDefault();
            nextInput.focus();
            if (nextInput.select) nextInput.select();
        }
    };

    const getComponentKey = (name) => {
        const n = name.toLowerCase();
        if (n.includes('unit')) return 'unit_written';
        if (n.includes('class')) return 'class_test';
        if (n.includes('project')) return 'project';
        if (n.includes('oral')) return 'oral';
        if (n.includes('note')) return 'notebook';
        if (n.includes('term')) return 'term_written';
        return null;
    };

    const calculateStudentStats = (student) => {
        const totalMax = settings.reduce((sum, comp) => sum + parseFloat(comp.max_marks || 0), 0);
        const totalObtained = settings.reduce((sum, comp) => {
            const field = getComponentKey(comp.component_name);
            return sum + parseFloat(student[field] || 0);
        }, 0);

        const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
        
        let grade = 'E';
        if (gradingSystem.length > 0) {
            const match = gradingSystem.find(g => percentage >= g.min_percent && percentage <= g.max_percent);
            if (match) grade = match.grade_name;
        } else {
            if (percentage >= 90) grade = 'A+';
            else if (percentage >= 80) grade = 'A';
            else if (percentage >= 70) grade = 'B+';
            else if (percentage >= 60) grade = 'B';
            else if (percentage >= 50) grade = 'C';
            else if (percentage >= 35) grade = 'D';
        }

        return { totalObtained, totalMax, grade };
    };

    const totalPages = Math.ceil(studentsData.length / STUDENTS_PER_PAGE);
    const paginatedStudents = studentsData.slice((currentPage - 1) * STUDENTS_PER_PAGE, currentPage * STUDENTS_PER_PAGE);

    return (
        <div className="p-4 lg:p-8 bg-[#F8FAFC] min-h-screen font-sans text-left pb-24 anim-fade-in">
            <ModuleHeader
                title="Academic Assessment"
                subTitle="Teacher-wise Marks Entry & Performance Reporting"
                icon={ClipboardList}
                badge={`STUDENTS: ${studentsData.length}`}
                toggleSidebar={toggleSidebar}
            />

            <div className="mt-8 flex items-center gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
                <button 
                    onClick={() => setActiveTab('scholastic')}
                    className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                        activeTab === 'scholastic' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                    <BookOpen size={14} /> Scholastic Areas
                </button>
                <button 
                    onClick={() => setActiveTab('coscholastic')}
                    className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                        activeTab === 'coscholastic' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                    <Star size={14} /> Co-Scholastic Areas
                </button>
            </div>

            {activeTab === 'scholastic' ? (
                <>
                    <div className="mt-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-wrap gap-4 items-end">
                        <div className="space-y-1.5 min-w-[200px]">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Classroom</label>
                            <select 
                                className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl font-bold text-primary text-[11px] outline-none"
                                value={selection.classroomId}
                                onChange={e => setSelection({...selection, classroomId: e.target.value})}
                            >
                                <option value="">Select Classroom</option>
                                {classrooms.map(c => <option key={c.id} value={c.id}>{c.class_name} ({c.section || 'General'})</option>)}
                            </select>
                        </div>

                        {!isPrePrimary && (
                            <>
                                <div className="space-y-1.5 min-w-[180px]">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Subject</label>
                                    <select 
                                        className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl font-bold text-primary text-[11px] outline-none"
                                        value={selection.subjectName}
                                        onChange={e => setSelection({...selection, subjectName: e.target.value})}
                                    >
                                        <option value="">Select Subject</option>
                                        {subjects.map((s, idx) => <option key={idx} value={s.subject_name}>{s.subject_name}</option>)}
                                    </select>
                                </div>
                            </>
                        )}

                        {isPrePrimary && (
                            <div className="space-y-1.5 min-w-[200px]">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Student</label>
                                <select 
                                    className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl font-bold text-primary text-[11px] outline-none"
                                    value={selection.studentId || ''}
                                    onChange={e => setSelection({...selection, studentId: e.target.value})}
                                >
                                    <option value="">Select Student</option>
                                    {ppStudents.map(s => <option key={s.student_id || s.id} value={s.student_id || s.id}>#{s.roll_number || '---'} {s.student_name}</option>)}
                                </select>
                            </div>
                        )}

                        <div className="space-y-1.5 min-w-[150px]">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{isPrePrimary ? 'Term' : 'Assessment Cycle'}</label>
                            <select 
                                className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl font-bold text-primary text-[11px] outline-none"
                                value={selection.examId || (isPrePrimary ? 'I Term' : '')}
                                onChange={e => setSelection({...selection, examId: e.target.value})}
                            >
                                <option value="">Select {isPrePrimary ? 'Term' : 'Exam'}</option>
                                {isPrePrimary ? (
                                    <>
                                        <option value="I Term">I Term</option>
                                        <option value="II Term">II Term</option>
                                    </>
                                ) : (
                                    exams.map(ex => <option key={ex.id} value={ex.id}>{ex.exam_name} ({ex.term})</option>)
                                )}
                            </select>
                        </div>

                        {!isPrePrimary && (
                            <button 
                               onClick={handleFetchMarks}
                               className="px-6 py-2.5 bg-[#001736] text-amber-400 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 shadow-lg"
                            >
                                <Search size={16} /> Load Batch
                            </button>
                        )}
                    </div>

                    {/* Marks Table */}
                    {isPrePrimary ? (
                        <div className="mt-8">
                            <PrePrimaryMarksEntry 
                                isEmbedded={true} 
                                externalSelection={{
                                    classroomId: selection.classroomId,
                                    studentId: selection.studentId,
                                    term: selection.examId || 'I Term'
                                }}
                            />
                        </div>
                    ) : studentsData.length > 0 && (
                        <div className="mt-8 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm anim-fade-in">
                            <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                                        <ClipboardList size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-primary uppercase">Marks Entry Matrix</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selection.subjectName} • {selection.classroomId}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={handleFillDummyMarks}
                                        className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 transition-all flex items-center gap-2 active:scale-95 shadow-sm"
                                        title="Auto-fill realistic mock marks for all students"
                                    >
                                        <Star size={14} className="fill-amber-400 text-amber-600" /> Fill Dummy Marks
                                    </button>
                                    <button 
                                        onClick={handleDownloadTemplate}
                                        className="px-3 py-1.5 bg-white border border-slate-200 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-all flex items-center gap-2"
                                        title="Download Excel Template"
                                    >
                                        <Download size={14} /> Template
                                    </button>
                                    <label 
                                        className="px-3 py-1.5 bg-white border border-slate-200 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-50 transition-all flex items-center gap-2 cursor-pointer"
                                        title="Import Excel"
                                    >
                                        <FileUp size={14} /> Import
                                        <input type="file" className="hidden" accept=".xlsx" onChange={handleImportExcel} />
                                    </label>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse border border-black">
                                    <thead>
                                        <tr className="bg-slate-50">
                                            <th className="px-4 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border border-black w-16">Roll</th>
                                            <th className="px-4 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border border-black">Student Name</th>
                                            {settings.map((comp, idx) => (
                                                <th key={idx} className="px-2 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest border border-black w-24">
                                                    {comp.component_name}<br />({comp.max_marks})
                                                </th>
                                            ))}
                                            <th className="px-2 py-4 text-center text-[10px] font-black text-indigo-600 uppercase tracking-widest border border-black bg-indigo-50/30 w-20">Total</th>
                                            <th className="px-2 py-4 text-center text-[10px] font-black text-emerald-600 uppercase tracking-widest border border-black bg-emerald-50/30 w-20">Grade</th>
                                            <th className="px-4 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border border-black">Teacher Remarks</th>

                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {paginatedStudents.map((student, idx) => {
                                            const sIdx = (currentPage - 1) * STUDENTS_PER_PAGE + idx;
                                            const { totalObtained, grade } = calculateStudentStats(student);
                                            return (
                                                <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-4 py-4 text-[11px] font-black text-slate-400 border border-black">#{student.roll_number || '---'}</td>
                                                    <td className="px-4 py-4 border border-black">
                                                        <span className="text-[12px] font-bold text-primary uppercase">{student.student_name}</span>
                                                    </td>
                                                    {settings.map((comp, cIdx) => {
                                                        const field = getComponentKey(comp.component_name);
                                                        return (
                                                            <td key={cIdx} className="px-2 py-3 border border-black">
                                                                <input 
                                                                    id={`input-${sIdx}-${cIdx}`}
                                                                    type="number"
                                                                    disabled={student.is_draft === 0}
                                                                    max={comp.max_marks}
                                                                    className={`w-full px-2 py-2 border rounded-lg font-bold text-center text-xs transition-all ${
                                                                        student.is_draft === 0 ? 'bg-slate-50 border-black text-black' : 
                                                                        'bg-white border-slate-200 text-primary focus:border-indigo-500 outline-none'
                                                                    }`}
                                                                    value={student[field] || ''}
                                                                    onChange={e => handleMarkChange(sIdx, field, e.target.value)}
                                                                    onKeyDown={e => handleKeyDown(e, sIdx, cIdx)}
                                                                />
                                                            </td>
                                                        );
                                                    })}
                                                    <td className="px-2 py-3 text-center border border-black bg-indigo-50/10">
                                                        <span className="text-[12px] font-black text-indigo-600">{totalObtained}</span>
                                                    </td>
                                                    <td className="px-2 py-3 text-center border border-black bg-emerald-50/10">
                                                        <span className={`px-2 py-1 rounded text-[11px] font-black uppercase ${
                                                            grade === 'F' || grade === 'E' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
                                                        }`}>
                                                            {grade}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 border border-black">
                                                        <input 
                                                            id={`input-${sIdx}-${settings.length}`}
                                                            type="text"
                                                            disabled={student.is_draft === 0}
                                                            className={`w-full px-4 py-2 border rounded-xl font-bold text-xs transition-all ${
                                                                student.is_draft === 0 ? 'bg-slate-50 border-black text-black' : 
                                                                'bg-white border-slate-200 text-primary focus:border-indigo-500 outline-none'
                                                            }`}
                                                            value={student.remarks}
                                                            onChange={e => handleMarkChange(sIdx, 'remarks', e.target.value)}
                                                            onKeyDown={e => handleKeyDown(e, sIdx, settings.length)}
                                                            placeholder="Enter comment..."
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    SHOWING {Math.min((currentPage - 1) * STUDENTS_PER_PAGE + 1, studentsData.length)} TO {Math.min(currentPage * STUDENTS_PER_PAGE, studentsData.length)} OF {studentsData.length} ENTRIES
                                </span>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                                        disabled={currentPage === 1}
                                        className="px-6 py-2.5 bg-white border border-slate-300 text-[#001736] rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-[#001736] hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                                    >
                                        PREV
                                    </button>
                                    <span className="text-[10px] font-black text-[#001736] uppercase px-4">PAGE {currentPage} OF {Math.max(1, totalPages)}</span>
                                    <button 
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                                        disabled={currentPage === totalPages || totalPages === 0}
                                        className="px-6 py-2.5 bg-white border border-slate-300 text-[#001736] rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-[#001736] hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                                    >
                                        NEXT
                                    </button>
                                </div>
                            </div>

                            <div className="p-8 bg-slate-50 border-t border-slate-200 flex flex-wrap justify-between items-center gap-6">
                                <div className="flex items-center gap-3">
                                     <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded bg-emerald-500" />
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Locked/Submitted</span>
                                     </div>
                                     <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded bg-amber-400" />
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Draft/Unlocked</span>
                                     </div>
                                </div>
                                <div className="flex items-center gap-4">
                                     <button 
                                        onClick={() => handleSave(false)}
                                        disabled={isSaving || studentsData.every(s => s.is_draft === 0)}
                                        className="px-8 py-3.5 bg-white border border-slate-200 text-primary rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-3 active:scale-95 shadow-sm disabled:opacity-50"
                                     >
                                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                        SAVE PROGRESS
                                     </button>
                                     <button 
                                        onClick={() => handleSave(true)}
                                        disabled={isSaving || studentsData.every(s => s.is_draft === 0)}
                                        className={`px-8 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-3 active:scale-95 shadow-xl ${
                                            studentsData.every(s => s.is_draft === 0) 
                                            ? 'bg-slate-200 text-slate-500 cursor-not-allowed' 
                                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
                                        }`}
                                     >
                                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : (studentsData.every(s => s.is_draft === 0) ? <CheckCircle2 size={16} /> : <CheckSquare size={16} />)}
                                        {studentsData.every(s => s.is_draft === 0) ? 'LOCKED / FINALIZED' : 'FINALIZE & SUBMIT'}
                                     </button>
                                 </div>
                            </div>
                        </div>
                    )}

                    {studentsData.length === 0 && !loading && !isPrePrimary && (
                        <div className="mt-12 text-center py-32 bg-white rounded-3xl border border-dashed border-slate-200">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                                <ClipboardList size={40} />
                            </div>
                            <p className="text-slate-400 font-bold text-sm tracking-wide uppercase">Select Assessment Parameters to Load Batch</p>
                            <p className="text-slate-300 text-[11px] mt-2 italic px-8">Ensure classrooms and subjects are assigned to you by the administrator.</p>
                        </div>
                    )}

                    {loading && (
                        <div className="mt-12 text-center py-32 bg-white rounded-3xl border border-slate-100">
                            <Loader2 size={40} className="mx-auto text-indigo-600 animate-spin mb-6" />
                            <p className="text-slate-400 font-bold text-sm uppercase tracking-[0.2em]">Synchronizing Registry Context...</p>
                        </div>
                    )}
                </>
            ) : (
                <CoScholasticEntry academicYearId={selection.academicYearId} />
            )}
        </div>
    );
};

export default MarksEntry;
