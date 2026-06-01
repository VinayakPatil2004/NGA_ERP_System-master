import React, { useState, useEffect, useCallback } from 'react';
import {
    ClipboardCheck, Plus, Settings, Calendar,
    Trophy, ChevronRight, RefreshCw, X, Save,
    Trash2, AlertCircle, FileText, CheckCircle2, FileDown,
    Pencil, Eye, Search
} from 'lucide-react';
import { toast } from 'react-toastify';
import ModuleHeader from '../../../../admcomponents/ModuleHeader';
import DataTable from '../../../../admcomponents/DataTable';
import * as ExamAPI from '../../../../../services/examAPI';
import * as AcademicYearAPI from '../../../../../services/academicYearAPI';
import Swal from 'sweetalert2';
import ExamTimetableManager from './ExamTimetableManager';
import MarksRegistry from './MarksRegistry';
import bulkImportAPI from '../../../../../services/bulkImportAPI';
import { useAcademicYear } from '../../../../../context/AcademicYearContext';

const ExamManager = ({ toggleSidebar }) => {
    const { selectedYear: globalYear } = useAcademicYear();
    const [exams, setExams] = useState([]);
    const [academicYears, setAcademicYears] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showTimetableModal, setShowTimetableModal] = useState(false);
    const [currentExam, setCurrentExam] = useState(null);
    const [examComponents, setExamComponents] = useState([]);
    const [isImporting, setIsImporting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [activeView, setActiveView] = useState('exams'); // 'exams' | 'registry'
    const [searchQuery, setSearchQuery] = useState('');

    const [newExam, setNewExam] = useState({
        exam_name: '',
        academic_year_id: '',
        term: 'Term 1',
        start_date: '',
        end_date: ''
    });

    const fetchExams = useCallback(async (yearId) => {
        if (!yearId) return;
        try {
            setLoading(true);
            const examsData = await ExamAPI.getAllExams(yearId);
            setExams(examsData);
        } catch {
            toast.error("Failed to fetch exams for selected year");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const fetchYears = async () => {
            try {
                const years = await AcademicYearAPI.getAllAcademicYears();
                setAcademicYears(years);
            } catch {
                console.error("Failed to fetch academic years list");
            }
        };
        fetchYears();
    }, []);

    useEffect(() => {
        if (globalYear?.id) {
            fetchExams(globalYear.id);
        }
    }, [globalYear?.id, fetchExams]);

    const openAddModal = () => {
        setNewExam({
            exam_name: '',
            academic_year_id: globalYear?.id || '',
            term: 'Term 1',
            start_date: '',
            end_date: ''
        });
        setIsEditing(false);
        setShowAddModal(true);
    };

    const handleCreateExam = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await ExamAPI.updateExam(currentExam.id, newExam);
                toast.success("Exam updated successfully");
            } else {
                await ExamAPI.createExam(newExam);
                toast.success("Exam successfully initialized");
            }
            setShowAddModal(false);
            setIsEditing(false);
            setNewExam({ exam_name: '', academic_year_id: '', term: 'Term 1', start_date: '', end_date: '' });
            fetchExams(globalYear?.id);
        } catch {
            toast.error(isEditing ? "Failed to update exam" : "Failed to create exam");
        }
    };

    const handleDeleteExam = async (id) => {
        const result = await Swal.fire({
            title: 'Delete Exam?',
            text: "This will remove the exam and all associated data!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await ExamAPI.deleteExam(id);
                toast.success("Exam Deleted from matrix");
                fetchExams(globalYear?.id);
            } catch {
                toast.error("Failed to delete exam");
            }
        }
    };

    const openEditModal = (exam) => {
        setCurrentExam(exam);
        setNewExam({
            exam_name: exam.exam_name,
            academic_year_id: exam.academic_year_id,
            term: exam.term,
            start_date: exam.start_date.split('T')[0],
            end_date: exam.end_date.split('T')[0]
        });
        setIsEditing(true);
        setShowAddModal(true);
    };

    const handleImportMarks = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setIsImporting(true);
            toast.info("Institutional Logic: Synchronizing examination results...");
            const res = await bulkImportAPI.importExamMarks(file);
            toast.success(`Matrix Sync Complete: ${res.inserted} Marks entries cataloged.`);
            if (res.failed > 0) {
                toast.warning(`${res.failed} Records skipped. Check data integrity.`);
                console.warn("Import Errors:", res.errors);
            }
        } catch (err) {
            toast.error(err.response?.data?.error || "Import Sequence Failure");
        } finally {
            setIsImporting(false);
            e.target.value = null;
        }
    };

    const openTimetable = (exam) => {
        setCurrentExam(exam);
        setShowTimetableModal(true);
    };

    const openSettings = async (exam) => {
        setCurrentExam(exam);
        try {
            const settings = await ExamAPI.getExamSettings(exam.id);
            if (settings.length > 0) {
                setExamComponents(settings);
            } else {
                // Pre-load with default NGA components from images
                setExamComponents([
                    { component_name: 'Unit Written', max_marks: 20 },
                    { component_name: 'Class Test', max_marks: 10 },
                    { component_name: 'Project', max_marks: 10 },
                    { component_name: 'Oral', max_marks: 10 },
                    { component_name: 'Note Book', max_marks: 10 },
                    { component_name: 'Term Written', max_marks: 40 }
                ]);
            }
            setShowSettingsModal(true);
        } catch {
            toast.error("Failed to load exam settings");
        }
    };

    const handleAddComponent = () => {
        setExamComponents([...examComponents, { component_name: '', max_marks: 0 }]);
    };

    const handleRemoveComponent = (index) => {
        const updated = examComponents.filter((_, i) => i !== index);
        setExamComponents(updated);
    };

    const handleComponentChange = (index, field, value) => {
        const updated = [...examComponents];
        updated[index][field] = value;
        setExamComponents(updated);
    };

    const saveSettings = async () => {
        try {
            const total = examComponents.reduce((sum, c) => sum + parseFloat(c.max_marks || 0), 0);
            if (total !== 100) {
                toast.warning(`Total marks sum up to ${total}. Usually should be 100 for Term exams.`);
            }
            await ExamAPI.saveExamSettings({
                exam_id: currentExam.id,
                components: examComponents
            });
            toast.success("Exam weightage settings applied");
            setShowSettingsModal(false);
        } catch {
            toast.error("Failed to save settings");
        }
    };

    const filteredExams = exams.filter(exam =>
        exam.exam_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exam.term?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exam.year_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalMaxMarks = examComponents.reduce((sum, c) => sum + parseFloat(c.max_marks || 0), 0);
    return (
        <div className="p-4 lg:p-8 bg-[#F8FAFC] min-h-screen font-sans text-left pb-24 anim-fade-in">
            <ModuleHeader
                title={activeView === 'exams' ? "Exam Management" : "Marks Registry"}
                subTitle={activeView === 'exams' ? "Define Exams, Weightage & Institutional Grading" : "Centralized Result Monitoring & Report Card Generation"}
                icon={activeView === 'exams' ? ClipboardCheck : FileText}
                badge={activeView === 'exams' ? `ACTIVE EXAMS: ${exams.length}` : 'STUDENT REGISTRY'}
                toggleSidebar={toggleSidebar}
            />

            {/* Relocated Premium Tab buttons & Search Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mt-6 bg-white p-4 rounded-md border border-slate-200 shadow-sm">
                {/* Switchers and Actions */}
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => setActiveView('exams')}
                        className={`flex items-center gap-2 px-5 py-3 rounded-md font-bold text-[11px] uppercase tracking-widest transition-all border ${activeView === 'exams'
                                ? 'bg-[#001736] text-white border-[#001736]'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                    >
                        <ClipboardCheck size={14} />
                        Exam Cycles
                    </button>
                    <button
                        onClick={() => setActiveView('registry')}
                        className={`flex items-center gap-2 px-5 py-3 rounded-md font-bold text-[11px] uppercase tracking-widest transition-all border ${activeView === 'registry'
                                ? 'bg-[#001736] text-white border-[#001736]'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                    >
                        <FileText size={14} />
                        Marks Registry
                    </button>

                    {activeView === 'exams' && (
                        <>
                            <button
                                onClick={openAddModal}
                                className="flex items-center gap-2 px-5 py-3 bg-white text-[#001736] border border-slate-200 rounded-md font-bold text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                                title="New Exam"
                            >
                                <Plus className="w-4 h-4" />
                                <span>NEW EXAM</span>
                            </button>
                            <button
                                onClick={() => document.getElementById('marks-import-input').click()}
                                disabled={isImporting}
                                className="flex items-center gap-2 px-5 py-3 bg-white text-[#001736] border border-slate-200 rounded-md font-bold text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                                title="Import Marks"
                            >
                                {isImporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                                <span>{isImporting ? "SYNC..." : "IMPORT"}</span>
                            </button>
                        </>
                    )}
                </div>

                {/* Right: Search Bar */}
                <div className="relative group w-full lg:w-72">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#001736] transition-colors" />
                    <input
                        type="text"
                        placeholder={activeView === 'exams' ? "SEARCH EXAMS..." : "SEARCH STUDENTS..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-md text-[11px] font-bold text-[#001736] outline-none focus:ring-2 focus:ring-[#001736]/10 transition-all uppercase tracking-wider placeholder:text-slate-400 shadow-sm"
                    />
                </div>
            </div>

            <input
                type="file"
                id="marks-import-input"
                className="hidden"
                accept=".xlsx, .xls, .csv"
                onChange={handleImportMarks}
            />

            {activeView === 'exams' ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                        {filteredExams.map(exam => (
                            <div key={exam.id} className="bg-white border border-slate-200 rounded-md p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Trophy size={80} />
                                </div>

                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div className="flex-1 flex items-start gap-3">
                                        <div>
                                            <h3 className="text-lg font-black text-primary capitalize leading-none">{exam.exam_name}</h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{exam.term} • {exam.year_name}</p>
                                        </div>
                                        <div className="flex items-center gap-0.5 ml-2 -mt-1.5">
                                            <button
                                                className="p-1.5 text-[#001736] hover:text-indigo-600 transition-colors opacity-60 hover:opacity-100"
                                                title="Quick View"
                                            >
                                                <Eye size={14} />
                                            </button>
                                            <button
                                                onClick={() => openEditModal(exam)}
                                                className="p-1.5 text-[#001736] hover:text-amber-600 transition-colors opacity-60 hover:opacity-100"
                                                title="Edit Exam"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteExam(exam.id)}
                                                className="p-1.5 text-[#001736] hover:text-rose-600 transition-colors opacity-60 hover:opacity-100"
                                                title="Delete Exam"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-tighter shrink-0 ${exam.status === 'published' ? 'bg-emerald-100 text-emerald-600' :
                                        exam.status === 'ongoing' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                        {exam.status}
                                    </span>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                                        <Calendar size={14} className="text-indigo-500" />
                                        <span>{new Date(exam.start_date).toLocaleDateString()} - {new Date(exam.end_date).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pt-4 border-t border-slate-50">
                                    <button
                                        onClick={() => openSettings(exam)}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-50 text-slate-600 text-[10px] font-bold rounded-md hover:bg-slate-100 transition-all border border-slate-200"
                                    >
                                        <Settings size={14} />
                                        WEIGHTAGE
                                    </button>
                                    <button
                                        onClick={() => openTimetable(exam)}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#001736] text-white text-[10px] font-bold rounded-md hover:bg-black transition-all shadow-sm"
                                    >
                                        <FileText size={14} />
                                        TIMETABLE
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {exams.length === 0 && !loading && (
                        <div className="mt-12 text-center py-24 bg-white rounded-md border border-dashed border-slate-300">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                <AlertCircle size={32} />
                            </div>
                            <p className="text-slate-400 font-bold text-sm">No exams configured for this session yet.</p>
                        </div>
                    )}
                </>
            ) : (
                <MarksRegistry toggleSidebar={toggleSidebar} isEmbedded={true} searchQuery={searchQuery} />
            )}

            {/* ADD EXAM MODAL */}
            {showAddModal && (
                <div className="fixed inset-0 bg-primary/80 backdrop-blur-sm z-100 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-md shadow-2xl p-8 animate-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-primary uppercase">{isEditing ? "Modify Exam" : "Initialize Exam"}</h2>
                            <button onClick={() => { setShowAddModal(false); setIsEditing(false); }} className="p-2 hover:bg-slate-100 rounded-md transition-all"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleCreateExam} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Exam Name</label>
                                <input
                                    type="text" required
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-md font-bold text-primary outline-none focus:border-indigo-500 transition-all"
                                    placeholder="e.g. Mid-Term Assessment"
                                    value={newExam.exam_name}
                                    onChange={e => setNewExam({ ...newExam, exam_name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Term</label>
                                    <select
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-md font-bold text-primary outline-none focus:border-indigo-500 transition-all cursor-pointer"
                                        value={newExam.term}
                                        onChange={e => setNewExam({ ...newExam, term: e.target.value })}
                                    >
                                        <option value="Term 1">Term 1</option>
                                        <option value="Term 2">Term 2</option>
                                        <option value="Final">Final</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Academic Year</label>
                                    <select
                                        required
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-md font-bold text-primary outline-none focus:border-indigo-500 transition-all cursor-pointer"
                                        value={newExam.academic_year_id}
                                        onChange={e => setNewExam({ ...newExam, academic_year_id: e.target.value })}
                                    >
                                        <option value="">Select Year</option>
                                        {academicYears.map(y => <option key={y.id} value={y.id}>{y.year_name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Start Date</label>
                                    <input
                                        type="date" required
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-md font-bold text-primary outline-none focus:border-indigo-500 transition-all"
                                        value={newExam.start_date}
                                        onChange={e => setNewExam({ ...newExam, start_date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">End Date</label>
                                    <input
                                        type="date" required
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-md font-bold text-primary outline-none focus:border-indigo-500 transition-all"
                                        value={newExam.end_date}
                                        onChange={e => setNewExam({ ...newExam, end_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-[#001736] text-amber-400 py-4 rounded-md font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all active:scale-[0.98] mt-4">
                                {isEditing ? "Update Matrix" : "Initialize Cycle"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* WEIGHTAGE SETTINGS MODAL */}
            {showSettingsModal && (
                <div className="fixed inset-0 bg-primary/80 backdrop-blur-sm z-100 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-2xl rounded-md shadow-2xl p-8 animate-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl font-black text-primary uppercase leading-tight">Exam Weightage Matrix</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configuration for {currentExam?.exam_name}</p>
                            </div>
                            <button onClick={() => setShowSettingsModal(false)} className="p-2 hover:bg-slate-100 rounded-md transition-all"><X size={20} /></button>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="flex items-center justify-between px-6 py-3 bg-slate-50 rounded-md border border-slate-100">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Assessment Components</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total:</span>
                                    <span className={`px-3 py-1 rounded-lg font-bold text-xs ${totalMaxMarks === 100 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                        {totalMaxMarks} / 100
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {examComponents.map((comp, idx) => (
                                    <div key={idx} className="flex gap-3 items-center group">
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                placeholder="Component Name (e.g. Oral)"
                                                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-md font-bold text-primary text-xs outline-none focus:border-indigo-500 transition-all"
                                                value={comp.component_name}
                                                onChange={e => handleComponentChange(idx, 'component_name', e.target.value)}
                                            />
                                        </div>
                                        <div className="w-24">
                                            <input
                                                type="number"
                                                placeholder="Max"
                                                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-md font-bold text-primary text-xs outline-none focus:border-indigo-500 transition-all text-center"
                                                value={comp.max_marks}
                                                onChange={e => handleComponentChange(idx, 'max_marks', e.target.value)}
                                            />
                                        </div>
                                        <button
                                            onClick={() => handleRemoveComponent(idx)}
                                            className="p-3 text-slate-300 hover:text-rose-500 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={handleAddComponent}
                                className="w-full py-3 border border-dashed border-slate-300 rounded-md text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus size={14} /> Add Assessment Head
                            </button>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowSettingsModal(false)}
                                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-md font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                            >
                                DISCARD
                            </button>
                            <button
                                onClick={saveSettings}
                                className="flex-1 py-4 bg-[#001736] text-amber-400 rounded-md font-black text-xs uppercase tracking-widest hover:bg-black shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                                <Save size={16} /> COMMIT MATRIX
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TIMETABLE MODAL */}
            {showTimetableModal && (
                <ExamTimetableManager
                    exam={currentExam}
                    onClose={() => setShowTimetableModal(false)}
                />
            )}
        </div>
    );
};

export default ExamManager;
