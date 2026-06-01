import React, { useState, useEffect, useCallback } from 'react';
import {
    Save, Loader2, Printer, Star, Music, Smile, User, Calendar, Trophy, Palette
} from 'lucide-react';
import { toast } from 'react-toastify';
import * as ClassroomAPI from '../../../../services/classroomAPI';
import * as ExamAPI from '../../../../services/examAPI';
import { useAcademicYear } from '../../../../context/AcademicYearContext';

const GradeInput = React.memo(({ field, marks, handleInputChange, handleKeyDown, termKey, placeholder = "-" }) => (
    <input
        type="text"
        name={`${field}_${termKey}`}
        className="w-full bg-transparent text-center font-bold text-black outline-none border-b border-transparent focus:border-indigo-400 py-1 transition-all"
        value={marks[field] || ''}
        onChange={(e) => handleInputChange(field, e.target.value.toUpperCase(), termKey)}
        onKeyDown={(e) => handleKeyDown(e, field, termKey)}
        placeholder={placeholder}
        autoComplete="off"
    />
));

const PrePrimaryMarksEntry = ({
    isEmbedded = false,
    externalSelection = null
}) => {
    const { selectedYear: globalYear } = useAcademicYear();
    const [classrooms, setClassrooms] = useState([]);
    const [students, setStudents] = useState([]);
    const [marks, setMarks] = useState({ t1: {}, t2: {} });
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selection, setSelection] = useState({
        classroomId: '',
        studentId: '',
        term: 'I Term'
    });

    // Helper to determine next class
    const getNextClass = (currentClass) => {
        if (!currentClass) return '---';
        const name = currentClass.toLowerCase();
        if (name.includes('nursery')) return 'Jr. KG';
        if (name.includes('junior') || name.includes('jr')) return 'Sr. KG';
        if (name.includes('senior') || name.includes('sr')) return 'I st';
        if (name.includes('1st') || name.includes('i ')) return 'II nd';
        return 'Next Level';
    };

    // Sync from external selection
    useEffect(() => {
        if (externalSelection) {
            setSelection(prev => ({
                ...prev,
                classroomId: externalSelection.classroomId || prev.classroomId,
                studentId: externalSelection.studentId || prev.studentId,
                term: externalSelection.term || prev.term
            }));
        }
    }, [externalSelection]);

    useEffect(() => {
        if (!isEmbedded && globalYear?.id) {
            ClassroomAPI.getClassrooms(globalYear.id).then(classes => {
                const ppClasses = classes.filter(c =>
                    c.class_name.toLowerCase().match(/(nursery|nursary|nurs|junior|senior|kg|jr|sr)/i)
                );
                setClassrooms(ppClasses);
            });
        }
    }, [isEmbedded, globalYear?.id]);

    useEffect(() => {
        if (selection.classroomId) {
            ClassroomAPI.getStudentsByClassroom(selection.classroomId, globalYear?.id)
                .then(setStudents)
                .catch(() => toast.error("Failed to load students"));
        }
    }, [selection.classroomId, globalYear?.id]);

    useEffect(() => {
        if (selection.studentId && globalYear?.id) {
            const fetchMarks = async () => {
                setIsLoading(true);
                try {
                    const t1Data = await ExamAPI.getPrePrimaryMarks(selection.studentId, 'I Term', globalYear.id);
                    const t2Data = await ExamAPI.getPrePrimaryMarks(selection.studentId, 'II Term', globalYear.id);
                    setMarks({
                        t1: t1Data || {},
                        t2: t2Data || {}
                    });
                } catch {
                    setMarks({ t1: {}, t2: {} });
                } finally {
                    setIsLoading(false);
                }
            };
            fetchMarks();
        }
    }, [selection.studentId, globalYear?.id]);

    const handleInputChange = useCallback((field, value, termKey) => {
        setMarks(prev => ({
            ...prev,
            [termKey]: { ...prev[termKey], [field]: value }
        }));
    }, []);

    const handleKeyDown = useCallback((e, field, termKey) => {
        const rowKeys = [
            'english_reading', 'english_writing', 'english_phonics',
            'maths_recognition', 'maths_counting', 'maths_writing',
            'hindi_reading', 'hindi_writing', 'hindi_vocabulary',
            'art_drawing', 'art_coloring', 'art_activities',
            'gk', 'sports', 'music', 'dance',
            'social', 'etiquettes', 'hygiene', 'attention', 'creativity',
            'attendance', 'total_days'
        ];

        let nextField = null;
        let nextTerm = termKey;
        const currentIndex = rowKeys.indexOf(field);

        if (e.key === 'ArrowDown' || e.key === 'Enter') {
            nextField = rowKeys[currentIndex + 1];
        } else if (e.key === 'ArrowUp') {
            nextField = rowKeys[currentIndex - 1];
        } else if (e.key === 'ArrowRight') {
            if (termKey === 't1') nextTerm = 't2';
            nextField = field;
        } else if (e.key === 'ArrowLeft') {
            if (termKey === 't2') nextTerm = 't1';
            nextField = field;
        }

        if (nextField) {
            e.preventDefault();
            const selector = `input[name="${nextField}_${nextTerm}"]`;
            const nextInput = document.querySelector(selector);
            if (nextInput) {
                nextInput.focus();
                if (nextInput.select) nextInput.select();
            }
        }
    }, []);

    const handleSave = async () => {
        if (!selection.studentId || !globalYear?.id) return toast.warning("Please select a student");
        setIsSaving(true);
        try {
            await Promise.all([
                ExamAPI.savePrePrimaryMarks({
                    studentId: selection.studentId,
                    term: 'I Term',
                    academicYearId: globalYear.id,
                    marks: marks.t1
                }),
                ExamAPI.savePrePrimaryMarks({
                    studentId: selection.studentId,
                    term: 'II Term',
                    academicYearId: globalYear.id,
                    marks: marks.t2
                })
            ]);
            toast.success("Progress saved successfully");
        } catch {
            toast.error("Failed to save progress");
        } finally {
            setIsSaving(false);
        }
    };

    const studentInfo = students.find(s => (s.student_id || s.id) == selection.studentId);
    const currentClassName = classrooms.find(c => c.id == selection.classroomId)?.class_name || "";
    const nextClassName = getNextClass(currentClassName);

    // Using the User's preferred color for highlights but keeping borders black
    const THEME_COLOR = "#b1930c";

    return (
        <div className={`${isEmbedded ? 'p-0' : 'p-4 md:p-8'} anim-fade-in bg-slate-50 min-h-screen text-left`}>
            <div className="max-w-[1300px] mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-primary flex items-center gap-3 uppercase">
                            <Star className="text-amber-400" fill="currentColor" /> Pre-Primary Matrix
                        </h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Institutional Assessment Dashboard</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button onClick={handleSave} disabled={isSaving || isLoading || !selection.studentId} className="flex items-center gap-2 px-8 py-3 bg-[#b1930c] text-white rounded-2xl hover:bg-slate-800 transition-all font-black text-xs shadow-lg">
                            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                            SAVE ALL DATA
                        </button>
                    </div>
                </div>

                {!isEmbedded && (
                    <div className="bg-white border border-black rounded-3xl p-6 shadow-sm mb-8 flex flex-wrap gap-6 items-end">
                        <div className="flex-1 min-w-[200px] space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Classroom</label>
                            <select className="w-full bg-slate-50 border border-black px-4 py-3 rounded-xl font-bold text-primary text-xs outline-none" value={selection.classroomId} onChange={e => setSelection({ ...selection, classroomId: e.target.value, studentId: '' })}>
                                <option value="">Select Class</option>
                                {classrooms.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                            </select>
                        </div>
                        <div className="flex-1 min-w-[200px] space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</label>
                            <select className="w-full bg-slate-50 border border-black px-4 py-3 rounded-xl font-bold text-primary text-xs outline-none" value={selection.studentId} onChange={e => setSelection({ ...selection, studentId: e.target.value })}>
                                <option value="">Select Student</option>
                                {students.map(s => <option key={s.student_id || s.id} value={s.student_id || s.id}>#{s.roll_number || '---'} {s.student_name || `${s.first_name} ${s.last_name}`}</option>)}
                            </select>
                        </div>
                    </div>
                )}

                {selection.studentId ? (
                    <div className="space-y-12">
                        {/* FIRST PAGE: ACADEMICS */}
                        <div className="bg-white border border-black rounded-3xl p-8 shadow-2xl anim-scale-in">
                            <div className="flex items-center justify-between mb-8 pb-6 border-b border-black">
                                <div className="flex items-center gap-6">
                                    <div className={`w-14 h-14 bg-[#b1930c] rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg`}>
                                        {studentInfo?.roll_number || '---'}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-black uppercase tracking-tight">{studentInfo?.student_name || `${studentInfo?.first_name} ${studentInfo?.last_name}`}</h3>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Academic Year: {globalYear?.year_name || '---'}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className={`px-4 py-1.5 bg-slate-100 text-black border border-black rounded-full text-[10px] font-black uppercase tracking-widest`}>Page 1: Scholastic Achievements</span>
                                </div>
                            </div>

                            <div className="border border-black rounded-2xl overflow-hidden shadow-sm">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-[#b1930c] text-white text-[10px] font-black uppercase">
                                            <th className="p-3 border-r border-black">What I've Achieved (Sub. & Skill)</th>
                                            <th className="p-3 text-center w-24 border-r border-black">Term I</th>
                                            <th className="p-3 text-center w-24">Term II</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[
                                            { cat: 'ENGLISH', skills: [{ l: 'Reading', f: 'english_reading' }, { l: 'Writing', f: 'english_writing' }, { l: 'Phonics', f: 'english_phonics' }] },
                                            { cat: 'MATHS', skills: [{ l: 'No. Recognition', f: 'maths_recognition' }, { l: 'No. Counting', f: 'maths_counting' }, { l: 'Writing', f: 'maths_writing' }] },
                                            { cat: 'HINDI', skills: [{ l: 'Reading', f: 'hindi_reading' }, { l: 'Writing', f: 'hindi_writing' }, { l: 'Vocabulary', f: 'hindi_vocabulary' }] },
                                            { cat: 'ART & CRAFT', skills: [{ l: 'Drawing', f: 'art_drawing' }, { l: 'Coloring', f: 'art_coloring' }, { l: 'Activities', f: 'art_activities' }] },
                                            { cat: 'G.K.', skills: [{ l: 'General Knowledge', f: 'gk' }] }
                                        ].map((group, gIdx) => (
                                            <React.Fragment key={gIdx}>
                                                <tr className="bg-slate-50 border-b border-black">
                                                    <td colSpan="3" className={`p-2 pl-4 font-black text-black border-r border-black text-[10px] uppercase tracking-wider`}>{group.cat}</td>
                                                </tr>
                                                {group.skills.map((s, sIdx) => (
                                                    <tr key={sIdx} className="border-b border-black last:border-b-0">
                                                        <td className="p-2.5 pl-8 text-[11px] font-bold text-slate-600 border-r border-black">{s.l}</td>
                                                        <td className="p-2.5 border-r border-black"><GradeInput marks={marks.t1} handleInputChange={handleInputChange} handleKeyDown={handleKeyDown} termKey="t1" field={s.f} /></td>
                                                        <td className="p-2.5"><GradeInput marks={marks.t2} handleInputChange={handleInputChange} handleKeyDown={handleKeyDown} termKey="t2" field={s.f} /></td>
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* SECOND PAGE: CO-CURRICULAR & FOOTER */}
                        <div className="bg-white border border-black rounded-3xl p-8 shadow-2xl anim-fade-in relative overflow-hidden">
                            <div className="flex items-center justify-between mb-8 pb-6 border-b border-black">
                                <div>
                                    <h3 className="text-xl font-black text-black uppercase tracking-tight">Cocurricular & Character</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Page 2: Holistic Growth</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                                <div className="space-y-8">
                                    <div className="border border-black rounded-2xl overflow-hidden shadow-sm">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-[#b1930c] text-white text-[10px] font-black uppercase">
                                                    <th className="p-3 border-r border-black">What Else I Am Trained For</th>
                                                    <th className="p-3 text-center w-24 border-r border-black">Term I</th>
                                                    <th className="p-3 text-center w-24">Term II</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {['sports', 'music', 'dance'].map((f, idx) => (
                                                    <tr key={idx} className="border-b border-black last:border-0">
                                                        <td className="p-3 pl-8 text-[11px] font-bold text-black uppercase border-r border-black">{f}</td>
                                                        <td className="p-3 border-r border-black"><GradeInput marks={marks.t1} handleInputChange={handleInputChange} handleKeyDown={handleKeyDown} termKey="t1" field={f} /></td>
                                                        <td className="p-3"><GradeInput marks={marks.t2} handleInputChange={handleInputChange} handleKeyDown={handleKeyDown} termKey="t2" field={f} /></td>
                                                    </tr>
                                                ))}
                                                <tr className="bg-slate-50 border-t border-black">
                                                    <td className="p-3 pl-4 font-black text-black text-[10px] uppercase border-r border-black">Attendance Record</td>
                                                    <td className="p-3 border-r border-black">
                                                        <div className="flex items-center gap-1 justify-center">
                                                            <input type="number" className="w-12 bg-white border border-black rounded p-1.5 text-center font-black text-xs" value={marks.t1.attendance || ''} onChange={e => handleInputChange('attendance', e.target.value, 't1')} />
                                                            <span className="text-black font-bold">/</span>
                                                            <input type="number" className="w-12 bg-white border border-black rounded p-1.5 text-center font-black text-xs" value={marks.t1.total_days || ''} onChange={e => handleInputChange('total_days', e.target.value, 't1')} />
                                                        </div>
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="flex items-center gap-1 justify-center">
                                                            <input type="number" className="w-12 bg-white border border-black rounded p-1.5 text-center font-black text-xs" value={marks.t2.attendance || ''} onChange={e => handleInputChange('attendance', e.target.value, 't2')} />
                                                            <span className="text-black font-bold">/</span>
                                                            <input type="number" className="w-12 bg-white border border-black rounded p-1.5 text-center font-black text-xs" value={marks.t2.total_days || ''} onChange={e => handleInputChange('total_days', e.target.value, 't2')} />
                                                        </div>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="border border-black rounded-2xl overflow-hidden shadow-sm">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-[#b1930c] text-white text-[10px] font-black uppercase">
                                                    <th className="p-3 border-r border-black">Personality Character</th>
                                                    <th className="p-3 text-center w-24 border-r border-black">Term I</th>
                                                    <th className="p-3 text-center w-24">Term II</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {[
                                                    { l: 'Social Interaction', f: 'social' },
                                                    { l: 'Etiquettes', f: 'etiquettes' },
                                                    { l: 'Personal Hygiene', f: 'hygiene' },
                                                    { l: 'Attention', f: 'attention' },
                                                    { l: 'Creativity', f: 'creativity' }
                                                ].map((item, idx) => (
                                                    <tr key={idx} className="border-b border-black last:border-0">
                                                        <td className="p-3 pl-8 text-[11px] font-bold text-black uppercase border-r border-black">{item.l}</td>
                                                        <td className="p-3 border-r border-black"><GradeInput marks={marks.t1} handleInputChange={handleInputChange} handleKeyDown={handleKeyDown} termKey="t1" field={item.f} /></td>
                                                        <td className="p-3"><GradeInput marks={marks.t2} handleInputChange={handleInputChange} handleKeyDown={handleKeyDown} termKey="t2" field={item.f} /></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Institutional Footer (Preventing Overlap) */}
                            <div className="mt-16 border-t border-black pt-10">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
                                    {['Class teacher\'s signature', 'Supervisor\'s signature', 'Principal\'s signature', 'Parents\'s signature'].map((title, i) => (
                                        <div key={i} className="text-center group">
                                            <div className="h-px bg-[#b1930c] w-full mb-3" />
                                            <p className="text-[9px] font-black text-black uppercase tracking-tighter">{title}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex flex-col md:flex-row justify-between items-center gap-10">
                                    <div className="space-y-4 text-center md:text-left">
                                        <p className="text-red-600 font-black text-sm italic tracking-tight underline decoration-dotted">"I am ready to climb the next step"</p>
                                        <div className="flex items-center gap-3">
                                            <p className="text-[11px] font-black text-black uppercase tracking-widest">Passed & Promoted to Std:</p>
                                            <span className="px-6 py-1 bg-slate-100 border border-black font-black text-black text-sm rounded-lg">
                                                {nextClassName}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="bg-red-50 border border-black p-6 rounded-3xl w-full md:w-auto shadow-sm">
                                        <label className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-3 block text-center">
                                            <Calendar size={12} className="inline mr-2" /> School Reopening Schedule
                                        </label>
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold text-red-700 uppercase w-20">Date:</span>
                                                <input
                                                    type="text"
                                                    className="bg-white border border-black rounded-lg px-3 py-1.5 text-xs font-black text-black outline-none focus:border-indigo-500 w-32"
                                                    placeholder="DD/MM/YYYY"
                                                    value={marks.t2.reopening_date || '06/04/2026'}
                                                    onChange={e => handleInputChange('reopening_date', e.target.value, 't2')}
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold text-red-700 uppercase w-20">Time:</span>
                                                <input
                                                    type="text"
                                                    className="bg-white border border-black rounded-lg px-3 py-1.5 text-xs font-black text-black outline-none focus:border-indigo-500 w-32"
                                                    placeholder="8:00 am"
                                                    value={marks.t2.reopening_time || '8:00 am'}
                                                    onChange={e => handleInputChange('reopening_time', e.target.value, 't2')}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white border-4 border-dashed border-slate-200 rounded-[3rem] p-32 text-center shadow-inner">
                        <div className="w-24 h-24 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
                            <User size={50} />
                        </div>
                        <h3 className="text-xl font-black text-primary uppercase tracking-tight">Select Student File</h3>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-4">Waiting for assessment context...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PrePrimaryMarksEntry;
