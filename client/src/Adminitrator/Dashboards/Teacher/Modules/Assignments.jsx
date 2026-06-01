import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Share2, CheckCircle, Clock, Eye, User, Calendar, X, FileText, UploadCloud, PlusCircle, Paperclip, CalendarDays, Loader2, Bookmark, Users, ExternalLink, Download } from 'lucide-react';
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import { useAcademicYear } from '../../../../context/AcademicYearContext';
import * as teacherAPI from '../../../../services/teacherAPI';
import * as assignmentAPI from '../../../../services/assignmentAPI';
import * as classroomAPI from '../../../../services/classroomAPI';
import API, { ROOT_URL } from '../../../../services/API';
import { toast } from 'react-toastify';

const Assignments = ({ toggleSidebar }) => {
    const [viewingItem, setViewingItem] = useState(null);
    const [viewingSubmissions, setViewingSubmissions] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isStudyMaterialMode, setIsStudyMaterialMode] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [loading, setLoading] = useState(false);
    const { selectedYear: globalYear } = useAcademicYear();

    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState("");
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState("");
    const [list, setList] = useState([]);

    // Create Modal State
    const [newTitle, setNewTitle] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [newDeadline, setNewDeadline] = useState("");
    const [newPoints, setNewPoints] = useState(100);
    const [newFile, setNewFile] = useState(null);

    const [filterType, setFilterType] = useState('assignment');

    const openCreateMode = (studyMaterial = false) => {
        setIsStudyMaterialMode(studyMaterial);
        setEditingItem(null);
        setNewTitle("");
        setNewDesc("");
        setNewDeadline("");
        setNewPoints(studyMaterial ? 0 : 100);
        setNewFile(null);
        setIsCreating(true);
    };

    const openEditMode = (item) => {
        setIsStudyMaterialMode(item.points === 0);
        setEditingItem(item);
        setSelectedClass(item.classroom_id || "");
        setSelectedSubject(item.subject_name || "");
        setNewTitle(item.title || "");
        setNewDesc(item.description || "");
        setNewDeadline(item.due_date ? item.due_date.split('T')[0] : "");
        setNewPoints(item.points || 0);
        setNewFile(null);
        setIsCreating(true);
    };

    const handleDeleteAssignment = async (id) => {
        if (!window.confirm("Are you sure you want to delete this completely?")) return;
        try {
            await assignmentAPI.deleteAssignment(id);
            toast.success("Deleted successfully");
            fetchData();
        } catch {
            toast.error("Failed to delete");
        }
    };

    const fetchData = useCallback(async () => {
        if (!globalYear?.id) return;
        try {
            setLoading(true);
            const data = await assignmentAPI.getTeacherAssignments(globalYear?.id);
            setList(data || []);
        } catch {
            toast.error("Failed to load assignments");
        } finally {
            setLoading(false);
        }
    }, [globalYear?.id]);

    const handleDeleteSubmission = async (id) => {
        if (!window.confirm("Are you sure you want to delete this submission?")) return;
        try {
            await API.delete(`/api/assignments/submissions/${id}`);
            toast.success("Submission deleted");
            // Refresh
            const targetId = viewingSubmissions?.id || viewingItem?.id;
            const data = await assignmentAPI.getAssignmentSubmissions(targetId);
            setSubmissions(data || []);
        } catch {
            toast.error("Failed to delete submission");
        }
    };

    const handleShareRemark = async (sub) => {
        const remark = prompt("Enter remark / feedback:", sub.feedback || "");
        if (remark === null) return;
        try {
            await assignmentAPI.gradeSubmission(sub.id, { grade: sub.grade || 0, feedback: remark });
            toast.success("Remark shared successfully");
            // Refresh
            const targetId = viewingSubmissions?.id || viewingItem?.id;
            const data = await assignmentAPI.getAssignmentSubmissions(targetId);
            setSubmissions(data || []);
        } catch {
            toast.error("Failed to share remark");
        }
    };

    useEffect(() => {
        const init = async () => {
            if (!globalYear?.id) return;
            try {
                const [profileData] = await Promise.all([
                    teacherAPI.getTeacherProfile(globalYear?.id)
                ]);

                setClasses(profileData?.classes || []);
            } catch {
                toast.error("Initialization failed");
            }
        };
        init();
    }, [globalYear?.id]);

    useEffect(() => {
        const fetchSubmissions = async () => {
            if (!viewingItem && !viewingSubmissions) {
                setSubmissions([]);
                return;
            }
            const targetId = viewingItem?.id || viewingSubmissions?.id;
            try {
                setLoadingSubmissions(true);
                const data = await assignmentAPI.getAssignmentSubmissions(targetId);
                setSubmissions(data || []);
            } catch (err) {
                console.error("Error fetching submissions:", err);
            } finally {
                setLoadingSubmissions(false);
            }
        };
        fetchSubmissions();
    }, [viewingItem, viewingSubmissions]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (selectedClass) {
            classroomAPI.getClassSubjects(selectedClass).then(data => {
                setSubjects(data || []);
            });
        } else {
            setSubjects([]);
        }
    }, [selectedClass]);

    const handleCreateNew = async () => {
        if (!newTitle.trim() || !newDesc.trim() || !selectedClass || !selectedSubject) {
            toast.warning("Please fill all required institutional fields");
            return;
        }

        try {
            const formData = new FormData();
            formData.append('classroom_id', selectedClass);
            formData.append('academic_year_id', globalYear?.id || "");
            formData.append('subject_name', selectedSubject);
            formData.append('title', newTitle);
            formData.append('description', newDesc);
            if (!isStudyMaterialMode) {
                formData.append('due_date', newDeadline);
                formData.append('points', newPoints);
            } else {
                formData.append('points', 0);
            }
            if (newFile) {
                formData.append('file', newFile);
            }

            if (editingItem) {
                await assignmentAPI.updateAssignment(editingItem.id, formData);
                toast.success("Updated Successfully");
            } else {
                await assignmentAPI.createAssignment(formData);
                toast.success("Published Successfully");
            }

            // Reset and Close
            setIsCreating(false);
            setEditingItem(null);
            fetchData();
        } catch {
            toast.error("Failed to save");
        }
    };

    return (
        <div className="p-4 lg:p-8 bg-bg-base min-h-screen animate-in fade-in duration-500 font-sans text-left relative">
            {loading && (
                <div className="absolute top-8 right-8 animate-spin">
                    <Loader2 className="w-5 h-5 text-indigo-500" />
                </div>
            )}
            <ModuleHeader
                title="Assignments"
                subTitle="Academic Tasks & Coursework Management"
                icon={BookOpen}
                toggleSidebar={toggleSidebar}
            >
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => openCreateMode(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-600 text-[11px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-sm active:scale-95 border border-indigo-200 group"
                    >
                        <Bookmark className="w-4 h-4 group-hover:-rotate-12 transition-transform" />
                        Share Study Material
                    </button>
                    <button
                        onClick={() => openCreateMode(false)}
                        className="flex items-center gap-2 px-6 py-3 btn-add-institutional text-[11px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-lg active:scale-95 border border-amber-400 group"
                    >
                        <Share2 className="w-4 h-4 group-hover:-rotate-12 transition-transform" />
                        Share Assignment
                    </button>
                </div>
            </ModuleHeader>

            <div className="max-w-7xl mx-auto mt-6 space-y-6">

                {/* Header Stats / Filters */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2 border-b border-black/5 pb-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <button onClick={() => setFilterType('assignment')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterType === 'assignment' ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Assignments</button>
                        <button onClick={() => setFilterType('study_material')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterType === 'study_material' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Study Materials</button>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            className="px-4 py-1.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-500/20 transition-all"
                        >
                            <CheckCircle className="w-3.5 h-3.5" /> {list.reduce((acc, curr) => acc + (curr.total_submissions || 0), 0)} Total Submissions
                        </button>
                        <span className="px-4 py-1.5 bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            <BookOpen className="w-3.5 h-3.5" /> {list.length} Assignments
                        </span>
                    </div>
                </div>

                {/* Grouped Assignments Grid */}
                {(() => {
                    const filteredList = list.filter(a => filterType === 'study_material' ? a.points === 0 : a.points > 0);
                    if (filteredList.length === 0) {
                        return (
                            <div className="bg-white/50 border border-slate-100 rounded-3xl p-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest italic shadow-sm">
                                {`No ${filterType.replace('_', ' ')}s Found`}
                            </div>
                        );
                    }
                    return (
                        <div className="space-y-10">
                            {Object.entries(
                                filteredList.reduce((groups, assignment) => {
                                const date = new Date(assignment.created_at);
                                const month = date.toLocaleString('default', { month: 'long', year: 'numeric' });
                                if (!groups[month]) groups[month] = [];
                                groups[month].push(assignment);
                                return groups;
                            }, {})
                        )
                        .sort((a, b) => new Date(b[1][0].created_at) - new Date(a[1][0].created_at)) // Sort months descending
                        .map(([month, items]) => (
                            <div key={month} className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-[2px] grow bg-slate-200"></div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 bg-slate-50 px-4 py-1 rounded-full border border-slate-200">{month}</span>
                                    <div className="h-[2px] grow bg-slate-200"></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {items.map((a) => (
                                        <div key={a.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-400 hover:border-[#FFB606] hover:shadow-lg transition-all duration-300 flex flex-col justify-between group h-full">
                                            <div>
                                                <div className="flex justify-between items-start mb-4 gap-4">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            {a.points === 0 && (
                                                                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-600 border border-emerald-200 shrink-0">
                                                                    Study Material
                                                                </span>
                                                            )}
                                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border bg-indigo-50 text-indigo-500 border-indigo-200 shrink-0`}>
                                                                {a.subject_name || 'General'}
                                                            </span>
                                                        </div>
                                                        <h4 className="text-[#001736] font-black text-[15px] leading-tight line-clamp-2">{a.title}</h4>
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <button 
                                                            onClick={() => openEditMode(a)}
                                                            className="text-xs text-slate-400 hover:text-indigo-500 transition-colors"
                                                            title="Edit"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteAssignment(a.id)}
                                                            className="text-xs text-slate-400 hover:text-rose-500 transition-colors"
                                                            title="Delete"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>

                                                <p className="text-sm font-medium text-slate-500 leading-relaxed line-clamp-2 mb-6">
                                                    {a.description}
                                                </p>

                                                <div className="space-y-2 mb-6">
                                                    <div className="flex items-center gap-2 text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100">
                                                        <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                                                            <Bookmark className="w-3.5 h-3.5 text-amber-600" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Class & Section</span>
                                                            <span className="text-[11px] font-bold text-[#001736] tracking-wide">{a.class_name} {a.section}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-slate-500 px-2 pt-2">
                                                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#001736]">
                                                            Assigned: {new Date(a.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    {a.points !== 0 && (
                                                        <div className="flex items-center gap-2 text-slate-500 px-2 relative">
                                                            <Clock className={`w-3.5 h-3.5 text-slate-400`} />
                                                            <span className={`text-[10px] font-black uppercase tracking-widest text-slate-500`}>
                                                                Due: {a.due_date ? new Date(a.due_date).toLocaleDateString() : 'N/A'}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-4 border-t border-slate-50 gap-4">
                                                {a.points !== 0 ? (
                                                    <button 
                                                        onClick={() => setViewingSubmissions(a)}
                                                        className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2 hover:underline"
                                                    >
                                                        <Users className="w-4 h-4" /> {a.total_submissions || 0} Submissions
                                                    </button>
                                                ) : <div />}
                                                <div className="flex gap-2 w-full sm:w-auto">
                                                    <button
                                                        onClick={() => setViewingItem(a)}
                                                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 hover:bg-[#001736] hover:text-white text-[#001736] border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" /> View
                                                    </button>
                                                    {a.file_url && (
                                                        <a
                                                            href={a.file_url.startsWith('http') ? a.file_url : `${ROOT_URL}/${a.file_url.replace(/\\/g, '/')}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                                                        >
                                                            <FileText className="w-3.5 h-3.5" /> Doc
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    );
                })()}
            </div>

            {/* Modal View for Assignment Details */}
            {viewingItem && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 border border-slate-200">
                        {/* Modal Header */}
                        <div className="px-8 py-6 bg-white border-b border-black/5 flex items-center justify-between shrink-0 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl shadow-inner">
                                    <BookOpen className="w-6 h-6 text-amber-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-1">Assignment Info</p>
                                    <h2 className="text-[#001736] font-black text-xl leading-tight pr-4">{viewingItem.title}</h2>
                                </div>
                            </div>
                            <button
                                onClick={() => setViewingItem(null)}
                                className="p-2.5 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 hover:text-rose-500 text-slate-400 rounded-xl transition-all relative z-10"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8 overflow-y-auto grow bg-slate-50 relative">

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="flex flex-col gap-1 p-2">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Given By</span>
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-amber-500" />
                                        <span className="text-xs font-bold text-[#001736]">{viewingItem.author}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1 p-2 border-l border-slate-100">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Assigned</span>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-indigo-500" />
                                        <span className="text-xs font-bold text-[#001736]">
                                            {new Date(viewingItem.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1 p-2 border-l border-slate-100">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-rose-400">Deadline</span>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-rose-500" />
                                        <span className="text-xs font-bold text-[#001736]">
                                            {viewingItem.due_date ? new Date(viewingItem.due_date).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
                                <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Assignment Details</h4>
                                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                                        {viewingItem.subject_name} • {viewingItem.points} Points
                                    </span>
                                </div>
                                <div className="prose prose-sm max-w-none text-[#001736] whitespace-pre-wrap leading-relaxed font-semibold">
                                    {viewingItem.description}
                                </div>
                            </div>

                            {viewingItem.file_url && (
                                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between shadow-sm mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-white rounded-xl shadow-sm">
                                            <FileText className="w-6 h-6 text-indigo-500" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-[#001736] truncate max-w-[200px]">
                                                {viewingItem.file_url.split('/').pop()}
                                            </h4>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Reference Document</span>
                                        </div>
                                    </div>
                                    <a 
                                        href={viewingItem.file_url.startsWith('http') ? viewingItem.file_url : `${ROOT_URL}/${viewingItem.file_url.replace(/\\/g, '/')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-2 bg-white hover:bg-indigo-500 hover:text-white text-indigo-600 rounded-lg text-xs font-black uppercase tracking-widest shadow-sm transition-all border border-indigo-100 flex items-center gap-2"
                                    >
                                        <Download size={14} /> View / Download
                                    </a>
                                </div>
                            )}

                            {/* Submissions Section */}
                            <div className="mt-10 border-t border-slate-100 pt-8">
                                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
                                    <Users className="w-4 h-4 text-indigo-500" /> Student Submissions Ledger
                                </h4>
                                
                                <div className="space-y-4">
                                    {loadingSubmissions ? (
                                        <div className="text-center py-10 text-slate-300 font-black uppercase tracking-widest text-[10px] animate-pulse">Syncing Submission Records...</div>
                                    ) : submissions.length > 0 ? (
                                        submissions.map((sub, idx) => (
                                            <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-indigo-200 transition-all">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 font-black">
                                                            {sub.student_name?.[0] || 'S'}
                                                        </div>
                                                        <div>
                                                            <div className="font-black text-sm text-[#001736]">{sub.student_name}</div>
                                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                                Submitted: {new Date(sub.submitted_at).toLocaleString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {sub.grade !== null ? (
                                                            <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-green-100">Graded: {sub.grade}</span>
                                                        ) : (
                                                            <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-100">Pending Review</span>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                {sub.submission_text && (
                                                    <div className="bg-slate-50 rounded-xl p-4 text-xs font-semibold text-[#001736] mb-3 leading-relaxed">
                                                        {sub.submission_text}
                                                    </div>
                                                )}

                                                {sub.file_url && (
                                                    <a 
                                                        href={sub.file_url.startsWith('http') ? sub.file_url : `${ROOT_URL}/${sub.file_url.replace(/\\/g, '/')}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl hover:bg-indigo-50 transition-colors group"
                                                    >
                                                        <Paperclip className="w-4 h-4 text-indigo-400 group-hover:text-indigo-600" />
                                                        <span className="text-[10px] font-black text-slate-500 group-hover:text-[#001736] uppercase tracking-widest">View Attachment</span>
                                                        <ExternalLink className="w-3 h-3 ml-auto text-slate-300 group-hover:text-indigo-500" />
                                                    </a>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">No submissions received yet for this task</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer (Actions) */}
                        <div className="px-8 py-5 bg-white border-t border-slate-200 flex justify-end gap-4 shrink-0">
                            <button
                                onClick={() => setViewingItem(null)}
                                className="px-6 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all"
                            >
                                Close
                            </button>
                            <button
                                className="px-8 py-3 bg-[#001736] hover:bg-black text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2 transition-all active:scale-95"
                            >
                                <BookOpen className="w-4 h-4 text-[#FFB606]" /> Remind Class
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Creation Modal */}
            {isCreating && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 border border-slate-200">
                        {/* Creation Header */}
                        <div className="px-8 py-6 bg-[#001736] flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg">
                                    <PlusCircle className="w-5 h-5 text-[#FFB606]" />
                                </div>
                                <h2 className="text-white! font-black text-lg uppercase tracking-wider">Create New Assignment</h2>
                            </div>
                            <button
                                onClick={() => setIsCreating(false)}
                                className="p-2 bg-white/10 hover:bg-rose-500 text-white rounded-xl transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Creation Form */}
                        <div className="p-8 overflow-y-auto grow bg-slate-50 space-y-6">

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block ml-1">Target Class</label>
                                    <select
                                        value={selectedClass}
                                        onChange={(e) => setSelectedClass(e.target.value)}
                                        className="w-full border border-slate-200 px-4 py-3 rounded-xl outline-none focus:border-[#FFB606] bg-white text-sm font-bold"
                                    >
                                        <option value="">Select Class</option>
                                        {classes.map(c => (
                                            <option key={c.classroom_id} value={c.classroom_id}>{c.class_name} {c.section}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block ml-1">Subject</label>
                                    <select
                                        value={selectedSubject}
                                        onChange={(e) => setSelectedSubject(e.target.value)}
                                        className="w-full border border-slate-200 px-4 py-3 rounded-xl outline-none focus:border-[#FFB606] bg-white text-sm font-bold disabled:opacity-50"
                                        disabled={!selectedClass}
                                    >
                                        <option value="">Select Subject</option>
                                        {subjects.map((s, idx) => (
                                            <option key={idx} value={s.subject_name}>{s.subject_name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block ml-1">{isStudyMaterialMode ? 'Material Title' : 'Assignment Title'}</label>
                                    <input
                                        type="text"
                                        value={newTitle}
                                        onChange={(e) => setNewTitle(e.target.value)}
                                        className="w-full border border-slate-200 px-4 py-3 rounded-xl outline-none focus:border-[#FFB606] focus:ring-4 focus:ring-[#FFB606]/10 transition-all text-sm font-bold bg-white placeholder:text-slate-300"
                                        placeholder="e.g. Science Project: Ecosystem"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block ml-1">Full Instructions / Details</label>
                                    <textarea
                                        value={newDesc}
                                        onChange={(e) => setNewDesc(e.target.value)}
                                        className="w-full border border-slate-200 p-4 rounded-xl min-h-[120px] outline-none focus:border-[#FFB606] focus:ring-4 focus:ring-[#FFB606]/10 transition-all text-sm font-medium resize-none bg-white placeholder:text-slate-300"
                                        placeholder="Provide step-by-step instructions or material description..."
                                    />
                                </div>

                                {!isStudyMaterialMode && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block ml-1">Deadline (Due Date)</label>
                                            <input
                                                type="date"
                                                value={newDeadline}
                                                onChange={(e) => setNewDeadline(e.target.value)}
                                                className="w-full border border-slate-200 px-4 py-3 rounded-xl outline-none focus:border-[#FFB606] focus:ring-4 focus:ring-[#FFB606]/10 transition-all text-sm font-bold bg-white text-[#001736]"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block ml-1">Total Points</label>
                                            <input
                                                type="number"
                                                value={newPoints}
                                                onChange={(e) => setNewPoints(e.target.value)}
                                                className="w-full border border-slate-200 px-4 py-3 rounded-xl outline-none focus:border-[#FFB606] focus:ring-4 focus:ring-[#FFB606]/10 transition-all text-sm font-bold bg-white text-[#001736]"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block ml-1">Attached PDF File</label>
                                    <div className="border-2 border-dashed border-slate-200 bg-white rounded-2xl p-6 flex flex-col items-center justify-center hover:bg-slate-50 transition-colors group relative overflow-hidden">
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            onChange={(e) => setNewFile(e.target.files[0])}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />

                                        {newFile ? (
                                            <div className="flex flex-col items-center gap-2 text-center pointer-events-none">
                                                <div className="p-4 bg-emerald-50 rounded-full mb-2 border border-emerald-100">
                                                    <FileText className="w-8 h-8 text-emerald-500" />
                                                </div>
                                                <span className="text-sm font-bold text-[#001736]">{newFile.name}</span>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Document Ready</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-center pointer-events-none">
                                                <div className="p-4 bg-slate-50 rounded-full mb-2 group-hover:bg-amber-50 group-hover:scale-110 transition-all border border-slate-100">
                                                    <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-amber-500" />
                                                </div>
                                                <span className="text-sm font-bold text-[#001736]">Upload Reference PDF</span>
                                                <span className="text-xs font-semibold text-slate-400">Click to browse or drag and drop</span>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-300 mt-2">Maximum file size: 10MB</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Creation Footer */}
                        <div className="px-8 py-5 bg-white border-t border-slate-200 flex justify-end gap-3 shrink-0 relative z-20">
                            <button
                                onClick={() => setIsCreating(false)}
                                className="px-6 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateNew}
                                disabled={!newTitle.trim() || !newDesc.trim()}
                                className="px-8 py-3 bg-[#001736] hover:bg-black text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                            >
                                <Share2 className="w-4 h-4 text-[#FFB606]" /> Post Assignment
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Submissions Table Modal */}
            {viewingSubmissions && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 border border-slate-200">
                        {/* Modal Header */}
                        <div className="px-8 py-6 bg-[#001736] flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg">
                                    <Users className="w-5 h-5 text-[#FFB606]" />
                                </div>
                                <div>
                                    <h2 className="text-white! font-black text-lg uppercase tracking-wider">Submission Records</h2>
                                    <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">{viewingSubmissions.title}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setViewingSubmissions(null)}
                                className="p-2 bg-white/10 hover:bg-rose-500 text-white rounded-xl transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body (Table) */}
                        <div className="p-0 overflow-y-auto grow bg-white">
                            {loadingSubmissions ? (
                                <div className="p-20 text-center text-slate-300 font-black uppercase tracking-widest text-xs animate-pulse">Loading Institutional Records...</div>
                            ) : (
                                    <div className="overflow-x-auto border-2 border-slate-200 m-4 rounded-xl">
                                        <table className="w-full text-left border-collapse border border-black">
                                            <thead>
                                                <tr className="bg-slate-50">
                                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 border border-slate-300">Sr No</th>
                                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 border border-slate-300">Student Name</th>
                                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 border border-slate-300">Parent Name</th>
                                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 border border-slate-300">Description</th>
                                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 border border-slate-300">Attachment</th>
                                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center border border-slate-300">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {submissions.length > 0 ? submissions.map((sub, idx) => (
                                                    <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-6 py-4 text-xs font-bold text-slate-500 border border-slate-300">{idx + 1}</td>
                                                        <td className="px-6 py-4 border border-slate-300">
                                                            <div className="text-xs font-black text-[#001736]">{sub.student_name}</div>
                                                            <div className="text-[9px] text-slate-400 font-bold uppercase">{sub.student_id_no}</div>
                                                        </td>
                                                        <td className="px-6 py-4 text-xs font-bold text-slate-600 border border-slate-300">{sub.parent_name || "N/A"}</td>
                                                        <td className="px-6 py-4 border border-slate-300">
                                                            <div className="text-xs text-slate-500 line-clamp-1 max-w-[200px]" title={sub.submission_text}>
                                                                {sub.submission_text || "No text description"}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 border border-slate-300">
                                                            {sub.file_url ? (
                                                                <a 
                                                                    href={sub.file_url.startsWith('http') ? sub.file_url : `${ROOT_URL}/${sub.file_url.replace(/\\/g, '/')}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-2 text-[10px] font-black text-indigo-500 hover:underline"
                                                                >
                                                                    <Paperclip className="w-3 h-3" /> VIEW DOC
                                                                </a>
                                                            ) : (
                                                                <span className="text-[10px] font-bold text-slate-300 uppercase italic">No File</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 border border-slate-300">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <button 
                                                                    onClick={() => handleShareRemark(sub)}
                                                                    className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                                                    title="Share Remark"
                                                                >
                                                                    <Share2 className="w-4 h-4" />
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleDeleteSubmission(sub.id)}
                                                                    className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                                                                    title="Delete Submission"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan="6" className="px-6 py-12 text-center text-slate-300 text-xs font-bold uppercase italic border border-slate-200">No submissions found for this classroom</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setViewingSubmissions(null)}
                                className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all shadow-sm"
                            >
                                Close Records
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Assignments;