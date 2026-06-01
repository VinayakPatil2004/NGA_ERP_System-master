import React, { useState, useEffect } from 'react';
import {
    Save, Loader2, ClipboardCheck,
    ChevronRight, Info
} from 'lucide-react';
import { toast } from 'react-toastify';
import * as ExamAPI from '../../../../services/examAPI';
import * as ClassroomAPI from '../../../../services/classroomAPI';
import * as StudentAPI from '../../../../services/studentAPI';
import { useAcademicYear } from '../../../../context/AcademicYearContext';

const CO_SCHOLASTIC_AREAS = [
    "Work Education",
    "Art Education",
    "Physical Education",
    "Scientific Skills",
    "Yoga / NCC"
];

const CoScholasticEntry = ({ academicYearId }) => {
    const { selectedYear: globalYear } = useAcademicYear();
    const [classrooms, setClassrooms] = useState([]);
    const [selection, setSelection] = useState({
        classroomId: '',
        areaName: CO_SCHOLASTIC_AREAS[0]
    });

    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const STUDENTS_PER_PAGE = 15;

    useEffect(() => {
        if (academicYearId) {
            ClassroomAPI.getClassrooms(academicYearId)
                .then(setClassrooms)
                .catch(() => toast.error("Failed to load classrooms"));
        }
    }, [academicYearId]);

    const fetchStudents = async () => {
        if (!selection.classroomId) return;
        setLoading(true);
        try {
            // Get students in classroom
            const studentsInClass = await StudentAPI.getAllStudents(globalYear?.year_name, '', selection.classroomId);

            // Get existing co-scholastic marks for the whole class
            const existingMarks = await ExamAPI.getCoScholastic(null, academicYearId);

            let sortedStudents = [...studentsInClass].sort((a, b) => {
                const aRoll = parseInt(a.roll_number);
                const bRoll = parseInt(b.roll_number);
                if (!isNaN(aRoll) && !isNaN(bRoll)) return aRoll - bRoll;
                if (a.roll_number && !b.roll_number) return -1;
                if (!a.roll_number && b.roll_number) return 1;
                return (a.student_name || '').localeCompare(b.student_name || '');
            });

            setStudents(sortedStudents.map(s => {
                const match = existingMarks.find(m => m.student_id === (s.student_id || s.id) && m.area_name === selection.areaName);
                return {
                    id: s.student_id || s.id,
                    student_id_no: s.student_id_no,
                    student_name: s.student_name,
                    roll_number: s.roll_number,
                    grade_term1: match ? (match.grade_term1 || '') : '',
                    grade_term2: match ? (match.grade_term2 || '') : '',
                    is_draft: match && match.is_draft !== undefined ? match.is_draft : 1
                };
            }));

        } catch (error) {
            console.error(error);
            toast.error("Failed to load student batch");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selection.classroomId && selection.areaName && academicYearId) {
            fetchStudents();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selection.classroomId, selection.areaName, academicYearId]);

    const handleGradeChange = (studentId, term, value) => {
        const val = value.toUpperCase();
        if (val !== '' && !['A', 'B', 'C'].includes(val)) return;

        setStudents(prev => prev.map(s =>
            s.id === studentId ? { ...s, [term]: val } : s
        ));
    };

    const handleKeyDown = (e, row, col) => {
        let nextRow = row;
        let nextCol = col;
        const totalCols = 1; // 0 for term1, 1 for term2
        
        const pageStart = (currentPage - 1) * STUDENTS_PER_PAGE;
        const pageEnd = Math.min(currentPage * STUDENTS_PER_PAGE, students.length) - 1;

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

    const handleSave = async (isDraft = true) => {
        setIsSaving(true);
        try {
            const marksData = students.map(s => ({
                student_id: s.id,
                academic_year_id: academicYearId,
                area_name: selection.areaName,
                grade_term1: s.grade_term1 || '',
                grade_term2: s.grade_term2 || ''
            }));

            await ExamAPI.saveCoScholastic({ marks: marksData, is_draft: isDraft });
            toast.success(isDraft ? "Progress saved successfully!" : "Batch finalized & submitted successfully!");
            
            if (!isDraft) {
                setStudents(prev => prev.map(s => ({ ...s, is_draft: 0 })));
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to save marks");
        } finally {
            setIsSaving(false);
        }
    };

    const totalPages = Math.ceil(students.length / STUDENTS_PER_PAGE);
    const paginatedStudents = students.slice((currentPage - 1) * STUDENTS_PER_PAGE, currentPage * STUDENTS_PER_PAGE);

    return (
        <div className="anim-fade-in">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-wrap gap-4 items-end mb-8">
                <div className="space-y-1.5 min-w-[200px]">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Target Classroom</label>
                    <select
                        className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl font-bold text-primary text-[11px] outline-none"
                        value={selection.classroomId}
                        onChange={e => setSelection({ ...selection, classroomId: e.target.value })}
                    >
                        <option value="">Select Classroom</option>
                        {classrooms.map(c => <option key={c.id || c.classroom_id} value={c.id || c.classroom_id}>{c.class_name}</option>)}
                    </select>
                </div>

                <div className="space-y-1.5 min-w-[200px]">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Assessment Area</label>
                    <select
                        className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl font-bold text-primary text-[11px] outline-none"
                        value={selection.areaName}
                        onChange={e => setSelection({ ...selection, areaName: e.target.value })}
                    >
                        {CO_SCHOLASTIC_AREAS.map(area => <option key={area} value={area}>{area}</option>)}
                    </select>
                </div>

                <div className="flex-1" />

                {students.length > 0 && (
                    <div className="flex gap-2">
                        <button 
                            onClick={() => handleSave(true)}
                            disabled={isSaving || students.every(s => s.is_draft === 0)}
                            className="px-6 py-2.5 bg-white border border-slate-300 text-[#001736] rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Progress
                        </button>
                        <button 
                            onClick={() => handleSave(false)}
                            disabled={isSaving || students.every(s => s.is_draft === 0)}
                            className="px-6 py-2.5 bg-[#001736] text-amber-400 rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <ClipboardCheck size={16} />} Lock & Submit
                        </button>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="py-20 text-center">
                    <Loader2 size={40} className="mx-auto text-indigo-600 animate-spin mb-4" />
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Loading assessment batch...</p>
                </div>
            ) : students.length > 0 ? (
                <div className="bg-white border border-black overflow-hidden shadow-sm">
                    <div className="p-4 bg-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <ClipboardCheck className="text-indigo-600" size={20} />
                            <h3 className="text-xs font-black text-primary uppercase tracking-wider">{selection.areaName} - Grading Registry</h3>
                        </div>
                        <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                            <Info size={14} className="text-amber-600" />
                            <span className="text-[10px] font-bold text-amber-700 uppercase">Use Grades: A, B, or C</span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-black">
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-t border-r border-black w-20">Roll</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-t border-r border-black">Student Name</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-black text-[#001736] uppercase tracking-widest border-t border-r border-black bg-indigo-50/30">Term 1 Grade</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-black text-[#001736] uppercase tracking-widest border-t border-black bg-emerald-50/30">Term 2 Grade</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedStudents.map((s, idx) => {
                                    const sIdx = (currentPage - 1) * STUDENTS_PER_PAGE + idx;
                                    return (
                                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 text-[11px] font-black text-slate-400 border-t border-r border-b border-black">#{s.roll_number || (sIdx + 1)}</td>
                                        <td className="px-6 py-4 border border-black">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                    {s.student_name.charAt(0)}
                                                </div>
                                                <span className="text-[12px] font-bold text-primary uppercase">{s.student_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 border border-black bg-indigo-50/5">
                                            <div className="flex justify-center">
                                                <input
                                                    id={`input-${sIdx}-0`}
                                                    type="text"
                                                    maxLength={1}
                                                    disabled={s.is_draft === 0}
                                                    className="w-16 h-12 text-center bg-white border border-black rounded-xl font-black text-lg text-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition-all uppercase disabled:opacity-50 disabled:bg-slate-100"
                                                    value={s.grade_term1}
                                                    onChange={e => handleGradeChange(s.id, 'grade_term1', e.target.value)}
                                                    onKeyDown={e => handleKeyDown(e, sIdx, 0)}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 border-l border-b border-black bg-emerald-50/5">
                                            <div className="flex justify-center">
                                                <input
                                                    id={`input-${sIdx}-1`}
                                                    type="text"
                                                    maxLength={1}
                                                    disabled={s.is_draft === 0}
                                                    className="w-16 h-12 text-center bg-white border border-black rounded-xl font-black text-lg text-emerald-600 focus:ring-4 focus:ring-emerald-100 outline-none transition-all uppercase disabled:opacity-50 disabled:bg-slate-100"
                                                    value={s.grade_term2}
                                                    onChange={e => handleGradeChange(s.id, 'grade_term2', e.target.value)}
                                                    onKeyDown={e => handleKeyDown(e, sIdx, 1)}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            SHOWING {Math.min((currentPage - 1) * STUDENTS_PER_PAGE + 1, students.length)} TO {Math.min(currentPage * STUDENTS_PER_PAGE, students.length)} OF {students.length} ENTRIES
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
                </div>
            ) : (
                <div className="py-32 text-center bg-white border border-dashed border-slate-200 rounded-3xl">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                        <ChevronRight size={40} />
                    </div>
                    <p className="text-slate-400 font-bold text-sm tracking-wide uppercase">Select Classroom and Area to Begin Grading</p>
                </div>
            )}
        </div>
    );
};

export default CoScholasticEntry;
