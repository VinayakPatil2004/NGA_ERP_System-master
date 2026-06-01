import React, { useState, useEffect, useCallback } from 'react';
import { useAcademicYear } from '../../../../context/AcademicYearContext';
import {
    TrendingUp, TrendingDown, Users, Calendar,
    ChevronLeft, Download, Filter, Star, AlertCircle,
    BarChart3, PieChart, User, Search, X, 
    BookOpen, CheckSquare, Square, Plus, Loader2, LayoutDashboard, Pencil, Trash2, Clock
} from 'lucide-react';
import { toast } from 'react-toastify';
import API from '../../../../services/API';
import syllabusAPI from '../../../../services/syllabusAPI';
import * as teacherAPI from '../../../../services/teacherAPI';
import * as classroomAPI from '../../../../services/classroomAPI';
import ModuleHeader from '../../../admcomponents/ModuleHeader';

import DataTable from '../../../admcomponents/DataTable';

const ClassReports = ({ classroom: propClassroom, onBack: propOnBack, toggleSidebar }) => {
    const { selectedYear: activeYear } = useAcademicYear();
    const [classrooms, setClassrooms] = useState([]);
    const [selectedClassroom, setSelectedClassroom] = useState(propClassroom || null);
    const [activeTab, setActiveTab] = useState('daily_log');
    const [syllabus, setSyllabus] = useState([]);
    const [masterSyllabus, setMasterSyllabus] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingTopicId, setEditingTopicId] = useState(null);
    const [classroomSubjects, setClassroomSubjects] = useState([]);
    const [syllabusPage, setSyllabusPage] = useState(1);

    const currentUser = JSON.parse(localStorage.getItem('slpaems_erp_user') || localStorage.getItem('user') || '{}');
    const isAdmin = currentUser.role === 'admin' || currentUser.role === 'principal' || currentUser.role === 'HR' || currentUser.role_name === 'admin';
    const visibleSubjects = classroomSubjects.filter(sub => isAdmin || String(sub.teacher_id) === String(currentUser.id));

    // DEBUG: Log counts
    const filteredCount = classroomSubjects.filter(sub => isAdmin || sub.teacher_id == currentUser.id || selectedClassroom?.is_class_teacher == 1 || selectedClassroom?.is_class_teacher === true).length;
    console.log("ClassReports Debug:", { 
        currentUser, 
        isAdmin, 
        totalSubjects: classroomSubjects.length,
        filteredSubjects: filteredCount,
        selectedClassId: selectedClassroom?.id || selectedClassroom?.classroom_id,
        isCT: selectedClassroom?.is_class_teacher 
    });






    // Master Syllabus Form State
    const [newMasterTopic, setNewMasterTopic] = useState({
        subject_name: '',
        chapter_name: '',
        topic_name: '',
        planned_lectures: 1
    });

    // Fetch master syllabus
    const fetchMasterSyllabus = useCallback(async (classId) => {
        try {
            const data = await syllabusAPI.getMasterSyllabus(classId);
            setMasterSyllabus(data || []);
        } catch(error) {
            console.error("Failed to fetch master syllabus", error);
        }
    }, []);
    
    // Daily Log Form State
    const [dailyLog, setDailyLog] = useState({
        date: new Date().toISOString().split('T')[0],
        subject: '',
        chapter: '',
        lectureNo: '',
        topicCovered: '',
        teachingMethod: '',
        homeworkGiven: '',
        remarks: ''
    });

    // 1. Fetch classrooms if none provided (standalone mode)
    useEffect(() => {
        const fetchClassrooms = async () => {
            if (propClassroom || !activeYear?.id) return;
            try {
                setLoading(true);
                const currentUser = JSON.parse(localStorage.getItem('slpaems_erp_user') || localStorage.getItem('user') || '{}');
                const adminStatus = currentUser.role === 'admin' || currentUser.role === 'principal' || currentUser.role === 'HR';
                
                const [response] = await Promise.all([
                    adminStatus 
                        ? API.get(`/classrooms?academic_year_id=${activeYear.id}`)
                        : teacherAPI.getTeacherProfile(activeYear.id)
                ]);


                const classes = adminStatus ? response.data : (response.classes || []);
                setClassrooms(classes);

                if (classes.length > 0) {
                    const defaultClass = classes.find(c => c.is_class_teacher) || classes[0];
                    setSelectedClassroom(defaultClass);
                }
            } catch (error) {
                console.error("Failed to fetch classrooms:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchClassrooms();
    }, [propClassroom, activeYear?.id]);

    const fetchSyllabus = useCallback(async (classId) => {
        try {
            const data = await syllabusAPI.getSyllabusProgress(classId);
            setSyllabus(data || []);
        } catch (error) {
            console.error("Syllabus fetch error:", error);
        }
    }, []);

    useEffect(() => {
        const classId = selectedClassroom?.id || selectedClassroom?.classroom_id;
        const yearId = activeYear?.id;

        if (classId && yearId) {
            fetchSyllabus(classId);
            fetchMasterSyllabus(classId);

            // Fetch classroom-specific subjects
            const fetchClassroomSubs = async () => {
                try {
                    const data = await classroomAPI.getClassSubjects(classId, yearId);
                    console.log("Fetched Classroom Subjects:", data);
                    setClassroomSubjects(data || []);


                } catch (error) {

                    console.error("Failed to fetch classroom subjects", error);
                }
            };
            fetchClassroomSubs();
        }
    }, [selectedClassroom, fetchSyllabus, fetchMasterSyllabus, activeYear?.id]);



    const handleDailyLogSubmit = async (e) => {
        e.preventDefault();
        try {
            const classId = selectedClassroom?.id || selectedClassroom?.classroom_id;
            if (!classId) return toast.error("Please select a classroom first.");

            await syllabusAPI.addSyllabusTopic({
                classroom_id: classId,
                academic_year_id: activeYear?.id,
                subject_name: dailyLog.subject,
                topic_name: dailyLog.topicCovered
            });

            toast.success("Daily teaching log recorded successfully.");
            setDailyLog({...dailyLog, chapter: '', topicCovered: '', lectureNo: '', homeworkGiven: '', remarks: ''});
            fetchSyllabus(classId);
        } catch(error) {
            console.error(error);
            toast.error("Failed to submit daily log");
        }
    };

    const handleAddMasterTopic = async (e) => {
        e.preventDefault();
        try {
            const classId = selectedClassroom?.id || selectedClassroom?.classroom_id;
            if (!classId) return toast.error("Please select a classroom first.");

            if (editingTopicId) {
                await syllabusAPI.updateMasterSyllabusTopic(editingTopicId, {
                    subject_name: newMasterTopic.subject_name,
                    chapter_name: newMasterTopic.chapter_name,
                    topic_name: newMasterTopic.topic_name,
                    planned_lectures: newMasterTopic.planned_lectures
                });
                toast.success("Syllabus topic updated.");
                setEditingTopicId(null);
            } else {
                await syllabusAPI.addMasterSyllabusTopic({
                    classroom_id: classId,
                    academic_year_id: activeYear?.id,
                    subject_name: newMasterTopic.subject_name,
                    chapter_name: newMasterTopic.chapter_name,
                    topic_name: newMasterTopic.topic_name,
                    planned_lectures: newMasterTopic.planned_lectures
                });
                toast.success("Topic added to master syllabus.");
            }

            setNewMasterTopic({ ...newMasterTopic, topic_name: '', planned_lectures: 1 });
            fetchMasterSyllabus(classId);
        } catch(error) {
            toast.error("Failed to process syllabus topic.");
            console.error(error);
        }
    };

    const handleEditTopic = (topic) => {
        setEditingTopicId(topic.id);
        setNewMasterTopic({
            subject_name: topic.subject_name,
            chapter_name: topic.chapter_name,
            topic_name: topic.topic_name,
            planned_lectures: topic.planned_lectures
        });
        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteTopic = async (topicId) => {
        if (!window.confirm("Are you sure you want to delete this topic from the syllabus?")) return;
        try {
            await syllabusAPI.deleteMasterSyllabusTopic(topicId);
            toast.success("Syllabus topic deleted.");
            const classId = selectedClassroom?.id || selectedClassroom?.classroom_id;
            fetchMasterSyllabus(classId);
        } catch(error) {
            toast.error("Failed to delete topic.");
            console.error(error);
        }
    };

    if (!selectedClassroom && !loading) return (
        <div className="p-4 lg:p-8 space-y-8 max-w-[1600px] mx-auto">
            <div className="p-20 text-center space-y-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                    <BarChart3 size={40} />
                </div>
                <h2 className="text-xl font-black text-[#001736] uppercase tracking-tighter">No Classroom Selected</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-xs mx-auto">Please select a classroom context to proceed.</p>
            </div>
        </div>
    );

    // Completion metrics based on Master Syllabus & Daily Logs
    const totalTopics = masterSyllabus.length;
    const completedTopics = masterSyllabus.filter(topic => {
        const lecturesCompleted = syllabus.filter(log => log.subject_name === topic.subject_name && log.topic_name === topic.topic_name).length;
        return lecturesCompleted >= topic.planned_lectures;
    }).length;
    const pendingTopics = Math.max(0, totalTopics - completedTopics);
    const completionPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
    const availableChapters = Array.from(new Set(masterSyllabus.filter(t => t.subject_name === dailyLog.subject).map(t => t.chapter_name)));
    const availableTopics = masterSyllabus.filter(t => t.subject_name === dailyLog.subject && t.chapter_name === dailyLog.chapter).map(t => t.topic_name);

    return (
        <div className="p-4 lg:p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* UNIFIED INSTITUTIONAL HEADER */}
            <ModuleHeader
                title="Classroom Reports"
                subTitle={`${selectedClassroom?.class_name || 'Classroom'} Operations`}
                icon={BookOpen}
                toggleSidebar={toggleSidebar}
                leftCustomContent={
                    propOnBack && (
                        <button onClick={propOnBack} className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/10 active:scale-90">
                            <ChevronLeft size={20} />
                        </button>
                    )
                }
            >
            </ModuleHeader>

            {/* TAB NAVIGATION */}
            <div className="flex items-center gap-4 border-b-2 border-slate-100 pb-1">
                <button 
                    onClick={() => setActiveTab('daily_log')}
                    className={`pb-4 px-2 text-[11px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'daily_log' ? 'text-[#001736]' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Daily Teaching Log
                    {activeTab === 'daily_log' && <div className="absolute bottom-0 left-0 w-full h-1 bg-amber-400 rounded-t-full"></div>}
                </button>
                <button 
                    onClick={() => setActiveTab('syllabus')}
                    className={`pb-4 px-2 text-[11px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'syllabus' ? 'text-[#001736]' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Syllabus Tracker
                    {activeTab === 'syllabus' && <div className="absolute bottom-0 left-0 w-full h-1 bg-amber-400 rounded-t-full"></div>}
                </button>
                <button 
                    onClick={() => setActiveTab('completion_report')}
                    className={`pb-4 px-2 text-[11px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'completion_report' ? 'text-[#001736]' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Completion Report
                    {activeTab === 'completion_report' && <div className="absolute bottom-0 left-0 w-full h-1 bg-amber-400 rounded-t-full"></div>}
                </button>
            </div>

            {/* CONTENT AREA */}
            <div className="mt-8">
                {activeTab === 'daily_log' && (
                    <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm animate-in slide-in-from-bottom-4">
                        <div className="flex items-center gap-4 mb-8 pb-4 border-b border-slate-100">
                            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-amber-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-[#001736] uppercase tracking-tighter">Daily Teaching Entry</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Log today's instructional activities</p>
                            </div>
                        </div>

                        <form onSubmit={handleDailyLogSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Date</label>
                                    <input 
                                        type="date" 
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold uppercase outline-none focus:bg-white focus:border-amber-400 transition-all"
                                        value={dailyLog.date}
                                        onChange={(e) => setDailyLog({...dailyLog, date: e.target.value})}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Class</label>
                                    {!propClassroom ? (
                                        <div className="relative">
                                            <select 
                                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold uppercase outline-none focus:bg-white focus:border-amber-400 transition-all cursor-pointer"
                                                value={selectedClassroom?.id || selectedClassroom?.classroom_id || ''}
                                                onChange={(e) => {
                                                    const cls = classrooms.find(c => (c.id || c.classroom_id) == e.target.value);
                                                    setSelectedClassroom(cls);
                                                }}
                                            >
                                                {classrooms.map(cls => (
                                                    <option key={cls.id || cls.classroom_id} value={cls.id || cls.classroom_id} className="text-[#001736]">
                                                        {cls.class_name} {(cls.is_class_teacher === 1 || cls.is_class_teacher === true) ? '(CT)' : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ) : (
                                        <div className="w-full p-4 bg-slate-100 border border-slate-200 rounded-xl text-[11px] font-bold uppercase text-slate-500">
                                            {selectedClassroom?.class_name || 'N/A'}
                                            <p className="text-[9px] font-bold text-amber-600 mt-1 uppercase tracking-widest">
                                                CT: {selectedClassroom?.teacher_name || selectedClassroom?.class_teacher || 'N/A'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Subject</label>
                                    <select 
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold uppercase outline-none focus:bg-white focus:border-amber-400 transition-all cursor-pointer"
                                        value={dailyLog.subject}
                                        onChange={(e) => setDailyLog({...dailyLog, subject: e.target.value})}
                                        required
                                    >
                                        <option value="">Select Subject</option>
                                        {visibleSubjects.length > 0 ? (
                                            visibleSubjects.map(sub => (
                                                <option key={sub.id} value={sub.subject_name}>{sub.subject_name}</option>
                                            ))
                                        ) : (
                                            <option disabled>No subjects assigned to you in this class</option>
                                        )}
                                    </select>
                                    <p className="text-[9px] text-slate-400 mt-1">
                                        Total Subjects: {visibleSubjects.length}
                                    </p>







                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Chapter</label>
                                    <select 
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold uppercase outline-none focus:bg-white focus:border-amber-400 transition-all cursor-pointer"
                                        value={dailyLog.chapter}
                                        onChange={(e) => setDailyLog({...dailyLog, chapter: e.target.value, topicCovered: ''})}
                                        required
                                        disabled={!dailyLog.subject}
                                    >
                                        <option value="">Select Chapter</option>
                                        {availableChapters.map(chap => (
                                            <option key={chap} value={chap}>{chap}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Topic Covered Today</label>
                                    <select 
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold uppercase outline-none focus:bg-white focus:border-amber-400 transition-all cursor-pointer"
                                        value={dailyLog.topicCovered}
                                        onChange={(e) => setDailyLog({...dailyLog, topicCovered: e.target.value})}
                                        required
                                        disabled={!dailyLog.chapter}
                                    >
                                        <option value="">Select Topic</option>
                                        {availableTopics.map(topic => (
                                            <option key={topic} value={topic}>{topic}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Lecture No.</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Lec 4"
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold uppercase outline-none focus:bg-white focus:border-amber-400 transition-all"
                                        value={dailyLog.lectureNo}
                                        onChange={(e) => setDailyLog({...dailyLog, lectureNo: e.target.value})}
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Teaching Method (Optional)</label>
                                    <select 
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold uppercase outline-none focus:bg-white focus:border-amber-400 transition-all"
                                        value={dailyLog.teachingMethod}
                                        onChange={(e) => setDailyLog({...dailyLog, teachingMethod: e.target.value})}
                                    >
                                        <option value="">Select Method</option>
                                        <option value="Lecture">Lecture</option>
                                        <option value="Interactive">Interactive Discussion</option>
                                        <option value="Practical">Practical / Lab</option>
                                        <option value="Presentation">Presentation</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Homework Given</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Exercise 1.1 Q1-5"
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold uppercase outline-none focus:bg-white focus:border-amber-400 transition-all"
                                        value={dailyLog.homeworkGiven}
                                        onChange={(e) => setDailyLog({...dailyLog, homeworkGiven: e.target.value})}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Remarks</label>
                                    <textarea 
                                        rows="3"
                                        placeholder="Any additional notes about the class..."
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold uppercase outline-none focus:bg-white focus:border-amber-400 transition-all resize-none"
                                        value={dailyLog.remarks}
                                        onChange={(e) => setDailyLog({...dailyLog, remarks: e.target.value})}
                                    ></textarea>
                                </div>
                            </div>
                            
                            <div className="flex justify-end pt-6 border-t border-slate-100">
                                <button 
                                    type="submit"
                                    className="px-6 py-3 bg-[#001736] text-white rounded-xl text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-[#001736]/20"
                                >
                                    <CheckSquare size={16} /> Submit Daily Log
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {activeTab === 'syllabus' && (
                    <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm animate-in slide-in-from-bottom-4">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6 mb-8 pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                                    <BookOpen className="w-6 h-6 text-indigo-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-[#001736] uppercase tracking-tighter">Syllabus Master Definition</h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">One-Time Institutional Curriculum Setup</p>
                                </div>
                            </div>
                            <div className="min-w-[240px]">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Class Context</label>
                                {!propClassroom ? (
                                    <div className="relative">
                                        <select 
                                            className="w-full p-3 bg-white border border-slate-200 rounded-xl text-[11px] font-bold uppercase outline-none focus:border-indigo-400 transition-all cursor-pointer"
                                            value={selectedClassroom?.id || selectedClassroom?.classroom_id || ''}
                                            onChange={(e) => {
                                                const cls = classrooms.find(c => (c.id || c.classroom_id) == e.target.value);
                                                setSelectedClassroom(cls);
                                            }}
                                        >
                                            {classrooms.map(cls => (
                                                <option key={cls.id || cls.classroom_id} value={cls.id || cls.classroom_id} className="text-[#001736]">
                                                    {cls.class_name} {(cls.is_class_teacher === 1 || cls.is_class_teacher === true) ? '(CT)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <div className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold uppercase text-slate-500">
                                        {selectedClassroom?.class_name || 'N/A'} {(selectedClassroom?.is_class_teacher === 1 || selectedClassroom?.is_class_teacher === true) ? '(CT)' : ''}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* MASTER SYLLABUS DEFINITION FORM */}
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-10">
                            <h3 className="text-[11px] font-black text-indigo-600 uppercase tracking-widest mb-4">Add New Master Topic</h3>
                            <form onSubmit={handleAddMasterTopic} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Subject</label>
                                    <select 
                                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-[11px] font-bold uppercase outline-none focus:border-indigo-400 transition-all cursor-pointer"
                                        value={newMasterTopic.subject_name}
                                        onChange={(e) => setNewMasterTopic({...newMasterTopic, subject_name: e.target.value})}
                                        required
                                    >
                                        <option value="">Select Subject</option>
                                        {visibleSubjects.length > 0 ? (
                                            visibleSubjects.map(sub => (
                                                <option key={sub.id} value={sub.subject_name}>{sub.subject_name}</option>
                                            ))
                                        ) : (
                                            <option disabled>No subjects assigned to you in this class</option>
                                        )}
                                    </select>




                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Chapter</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Algebra"
                                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-[11px] font-bold uppercase outline-none focus:border-indigo-400 transition-all"
                                        value={newMasterTopic.chapter_name}
                                        onChange={(e) => setNewMasterTopic({...newMasterTopic, chapter_name: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Topic</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Linear Equations"
                                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-[11px] font-bold uppercase outline-none focus:border-indigo-400 transition-all"
                                        value={newMasterTopic.topic_name}
                                        onChange={(e) => setNewMasterTopic({...newMasterTopic, topic_name: e.target.value})}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Planned Lectures</label>
                                    <input 
                                        type="number" 
                                        min="1"
                                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-[11px] font-bold uppercase outline-none focus:border-indigo-400 transition-all"
                                        value={newMasterTopic.planned_lectures}
                                        onChange={(e) => setNewMasterTopic({...newMasterTopic, planned_lectures: parseInt(e.target.value)})}
                                        required
                                    />
                                </div>
                                <div className="md:col-span-5 flex justify-end mt-2">
                                    <button 
                                        type="submit"
                                        className={`px-6 py-3 ${editingTopicId ? 'bg-amber-500' : 'bg-indigo-600'} text-white rounded-xl text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20`}
                                    >
                                        {editingTopicId ? '✓ Update Topic' : '+ Add Master Topic'}
                                    </button>
                                    {editingTopicId && (
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                setEditingTopicId(null);
                                                setNewMasterTopic({ subject_name: '', chapter_name: '', topic_name: '', planned_lectures: 1 });
                                            }}
                                            className="px-6 py-3 bg-slate-200 text-slate-600 rounded-xl text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all ml-2"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>

                        <div className="mb-6 flex items-center justify-between">
                            <h3 className="text-sm font-black text-[#001736] uppercase tracking-tighter">Defined Syllabus</h3>
                        </div>

                        {masterSyllabus.length === 0 ? (
                            <div className="text-center py-20 bg-slate-50 border border-dashed border-slate-300 rounded-xl">
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">No Master Syllabus Data Found</p>
                            </div>
                        ) : (
                            <div className="w-full shadow-sm">
                            <DataTable 
                                headers={[
                                    { label: 'Subject', className: 'font-black bg-indigo-300 text-black border-r-table' },
                                    { label: 'Chapter', className: 'font-black bg-indigo-300 text-black border-r-table' },
                                    { label: 'Topic', className: 'font-black bg-indigo-300 text-black border-r-table' },
                                    { label: 'Planned', className: 'text-center font-black bg-indigo-300 text-black border-r-table' },
                                    { label: 'Done', className: 'text-center font-black bg-indigo-300 text-black border-r-table' },
                                    { label: 'Status', className: 'text-center font-black bg-indigo-300 text-black border-r-table' },
                                    { label: 'Action', className: 'text-center font-black bg-indigo-300 text-black' }
                                ]}
                                columnCount={7}
                                footer={
                                    <div className="flex flex-col sm:flex-row items-center justify-between bg-white gap-4">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 py-2">Displaying Page {syllabusPage} of {Math.max(1, Math.ceil(masterSyllabus.length / 10))}</span>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setSyllabusPage(p => Math.max(1, p - 1))} disabled={syllabusPage === 1}
                                                className="px-6 py-2.5 bg-slate-100 text-[#001736] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#001736] hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-slate-200">
                                                Prev
                                            </button>
                                            <button onClick={() => setSyllabusPage(p => Math.min(Math.ceil(masterSyllabus.length / 10), p + 1))} disabled={syllabusPage === Math.ceil(masterSyllabus.length / 10) || masterSyllabus.length === 0}
                                                className="px-6 py-2.5 bg-slate-100 text-[#001736] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#001736] hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-slate-200">
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                }
                            >
                                {masterSyllabus.slice((syllabusPage - 1) * 10, syllabusPage * 10).map(topic => {
                                    const lecturesCompleted = syllabus.filter(log => log.subject_name === topic.subject_name && log.topic_name === topic.topic_name).length;
                                    const isDone = lecturesCompleted >= topic.planned_lectures;
                                    
                                    return (
                                        <tr key={topic.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4 border-b-table border-r-table bg-white text-center">
                                                <span className="text-[11px] font-bold text-black uppercase tracking-widest">
                                                    {topic.subject_name}
                                                </span>
                                            </td>
                                            <td className="p-4 border-b-table border-r-table bg-white text-center">
                                                <span className="text-[11px] font-bold text-black uppercase tracking-widest">
                                                    {topic.chapter_name}
                                                </span>
                                            </td>
                                            <td className="p-4 border-b-table border-r-table bg-white text-center">
                                                <p className="text-[11px] font-black text-black uppercase tracking-tight">
                                                    {topic.topic_name}
                                                </p>
                                            </td>
                                            <td className="p-4 text-center border-b-table border-r-table bg-white">
                                                <span className="text-[11px] font-bold text-amber-600 uppercase tracking-widest">
                                                    {topic.planned_lectures}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center border-b-table border-r-table bg-white">
                                                <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest">
                                                    {lecturesCompleted}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center border-b-table border-r-table bg-white">
                                                {isDone ? (
                                                    <span className="text-[10px] font-black text-white uppercase tracking-widest bg-emerald-500 px-3 py-1.5 rounded-full flex items-center justify-center gap-1 w-fit mx-auto shadow-sm">
                                                        <CheckSquare size={12} /> Done
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-full flex items-center justify-center gap-1 w-fit mx-auto border border-slate-200">
                                                        <Clock size={12} className="opacity-50" /> Pending
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-center border-b-table bg-white">
                                                {(isAdmin || classroomSubjects.some(s => s.subject_name === topic.subject_name && String(s.teacher_id) === String(currentUser.id))) ? (
                                                    <div className="flex items-center justify-center gap-3">
                                                        <button 
                                                            onClick={() => handleEditTopic(topic)}
                                                            className="text-indigo-500 hover:text-indigo-700 transition-colors"
                                                            title="Edit Topic"
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteTopic(topic.id)}
                                                            className="text-rose-500 hover:text-rose-700 transition-colors"
                                                            title="Delete Topic"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Read Only</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </DataTable>
                            </div>
                        )}


                    </div>
                )}

                {activeTab === 'completion_report' && (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4">
                        <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6 mb-8 pb-4 border-b border-slate-100">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                                        <PieChart className="w-6 h-6 text-emerald-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-[#001736] uppercase tracking-tighter">Completion Analysis</h2>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Auto-generated progress matrix</p>
                                    </div>
                                </div>
                                <div className="min-w-[240px]">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Class Context</label>
                                    {!propClassroom ? (
                                        <div className="relative">
                                            <select 
                                                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-[11px] font-bold uppercase outline-none focus:border-emerald-400 transition-all cursor-pointer"
                                                value={selectedClassroom?.id || selectedClassroom?.classroom_id || ''}
                                                onChange={(e) => {
                                                    const cls = classrooms.find(c => (c.id || c.classroom_id) == e.target.value);
                                                    setSelectedClassroom(cls);
                                                }}
                                            >
                                                {classrooms.map(cls => (
                                                    <option key={cls.id || cls.classroom_id} value={cls.id || cls.classroom_id} className="text-[#001736]">
                                                        {cls.class_name} {(cls.is_class_teacher === 1 || cls.is_class_teacher === true) ? '(CT)' : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ) : (
                                        <div className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold uppercase text-slate-500">
                                            {selectedClassroom?.class_name || 'N/A'} {(selectedClassroom?.is_class_teacher === 1 || selectedClassroom?.is_class_teacher === true) ? '(CT)' : ''}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-8 border border-slate-100 rounded-2xl bg-amber-50 text-[#001736] relative overflow-hidden">
                                    <div className="relative z-10 text-center">
                                        <p className="text-[10px] font-black uppercase tracking-widest mb-2 text-amber-600">Total Progress</p>
                                        <h3 className="text-5xl font-black tracking-tighter">{completionPercentage}%</h3>
                                    </div>
                                </div>
                                <div className="p-8 border border-slate-100 rounded-2xl bg-slate-50 text-[#001736] text-center">
                                    <p className="text-[10px] font-black uppercase tracking-widest mb-2 text-slate-500">Delivered Topics</p>
                                    <h3 className="text-5xl font-black tracking-tighter text-emerald-600">{completedTopics}</h3>
                                </div>
                                <div className="p-8 border border-slate-100 rounded-2xl bg-slate-50 text-[#001736] text-center">
                                    <p className="text-[10px] font-black uppercase tracking-widest mb-2 text-slate-500">Pending Topics</p>
                                    <h3 className="text-5xl font-black tracking-tighter text-rose-500">{pendingTopics}</h3>
                                </div>
                            </div>

                            <div className="mt-12 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-[12px] font-black text-[#001736] uppercase tracking-widest">Progress Bar</h3>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{completedTopics} of {totalTopics} completed</span>
                                </div>
                                <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-amber-400 transition-all duration-1000 rounded-full"
                                        style={{ width: `${completionPercentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClassReports;
