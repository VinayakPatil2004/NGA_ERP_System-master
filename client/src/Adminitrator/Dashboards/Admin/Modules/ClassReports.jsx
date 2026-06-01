import React, { useState, useEffect, useCallback } from 'react';
import { useAcademicYear } from '../../../../context/AcademicYearContext';
import {
    TrendingUp, Users, Calendar,
    ChevronLeft, Star, AlertCircle,
    BookOpen, ClipboardCheck, Loader2,
    ArrowRight, User, CheckCircle2, Pencil, Trash2,
    Check
} from 'lucide-react';
import { toast } from 'react-toastify';
import API from '../../../../services/API';
import syllabusAPI from '../../../../services/syllabusAPI';
import * as classroomAPI from '../../../../services/classroomAPI';
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import DataTable from '../../../admcomponents/DataTable';

/**
 * Admin Class Reports - High Precision Syllabus Audit
 * Re-engineered to provide deep visibility into teacher progress and syllabus completion.
 */
const AdminClassReports = ({ toggleSidebar }) => {
    const { selectedYear: activeYear } = useAcademicYear();
    const [classrooms, setClassrooms] = useState([]);
    const [selectedClassroom, setSelectedClassroom] = useState(null);
    const [selectedTeacherId, setSelectedTeacherId] = useState('all');
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [syllabusPage, setSyllabusPage] = useState(1);

    // Syllabus Definition State
    const [editingTopicId, setEditingTopicId] = useState(null);
    const [newMasterTopic, setNewMasterTopic] = useState({
        subject_name: '',
        chapter_name: '',
        topic_name: '',
        planned_lectures: 1
    });

    // Data States
    const [stats, setStats] = useState({
        attendance: 0,
        averagePerformance: 0,
        topStudents: [],
        weakStudents: []
    });
    const [syllabusLogs, setSyllabusLogs] = useState([]);
    const [masterSyllabus, setMasterSyllabus] = useState([]);
    const [classroomSubjects, setClassroomSubjects] = useState([]);
    const [teachersInClass, setTeachersInClass] = useState([]);

    // 1. Initial Load: Fetch all classrooms
    useEffect(() => {
        const fetchAllClassrooms = async () => {
            if (!activeYear?.id) return;
            try {
                setLoading(true);
                const res = await API.get(`/classrooms?academic_year_id=${activeYear.id}`);
                setClassrooms(res.data || []);
            } catch (err) {
                console.error("Failed to fetch classrooms:", err);
                toast.error("Critical Registry Access Error");
            } finally {
                setLoading(false);
            }
        };
        fetchAllClassrooms();
    }, [activeYear?.id]);

    // 2. Fetch Detail Data when a classroom is selected
    const fetchClassroomData = useCallback(async () => {
        const classId = selectedClassroom?.id || selectedClassroom?.classroom_id;
        const yearId = activeYear?.id;
        if (!classId || !yearId) return;

        try {
            const [attendanceRes, recordsRes, subjectsRes, syllabusRes, masterRes, staffRes] = await Promise.all([
                API.get(`/attendance/classroom/${classId}?academic_year_id=${yearId}`),
                API.get(`/academic-records/classroom/${classId}?academic_year_id=${yearId}`),
                classroomAPI.getClassSubjects(classId, yearId),
                syllabusAPI.getSyllabusProgress(classId),
                syllabusAPI.getMasterSyllabus(classId),
                API.get('/staff/all')
            ]);

            const records = (recordsRes.data || []).filter(r => {
                const status = (r.status || '').toLowerCase().trim();
                return !['promoted', 'alumni', 'graduated', 'left', 'dropped', 'inactive'].includes(status);
            });

            const attendanceData = attendanceRes.data || [];
            const totalPresent = attendanceData.filter(a => a.status === 'present').length;
            const attendancePercentage = attendanceData.length > 0 ? (totalPresent / attendanceData.length) * 100 : 0;
            const sorted = [...records].sort((a, b) => b.percentage - a.percentage);

            setStats({
                attendance: attendancePercentage.toFixed(1),
                averagePerformance: records.length > 0
                    ? (records.reduce((acc, r) => acc + (r.percentage || 0), 0) / records.length).toFixed(1)
                    : "0.0",
                topStudents: sorted.slice(0, 5),
                weakStudents: sorted.filter(r => r.percentage < 40).slice(0, 5)
            });

            setClassroomSubjects(subjectsRes || []);
            setSyllabusLogs(syllabusRes || []);
            setMasterSyllabus(masterRes || []);

            const allTeachers = (staffRes?.data || [])
                .filter(s => s.role_name?.toLowerCase() === 'teacher')
                .map(t => ({ id: t.id, name: t.full_name }));
            setTeachersInClass(allTeachers);

        } catch (err) {
            console.error("Failed to fetch classroom data:", err);
        }
    }, [selectedClassroom, activeYear?.id]);

    useEffect(() => {
        fetchClassroomData();
    }, [fetchClassroomData]);

    const getCompletionRate = (teacherId = 'all') => {
        let list = masterSyllabus;
        const isCT = selectedClassroom && String(selectedClassroom.class_teacher_id) === String(teacherId);
        if (teacherId !== 'all' && !isCT) {
            const teacherSubjects = classroomSubjects.filter(s => String(s.teacher_id) === String(teacherId)).map(s => s.subject_name);
            list = masterSyllabus.filter(m => teacherSubjects.includes(m.subject_name));
        }
        if (list.length === 0) return 0;

        const completedCount = list.reduce((acc, topic) => {
            const done = syllabusLogs.filter(log => log.subject_name === topic.subject_name && log.topic_name === topic.topic_name).length;
            return done >= topic.planned_lectures ? acc + 1 : acc;
        }, 0);

        return ((completedCount / list.length) * 100).toFixed(0);
    };

    // --- SYLLABUS DEFINITION LOGIC ---
    const handleAddMasterTopic = async (e) => {
        e.preventDefault();
        const classId = selectedClassroom?.id || selectedClassroom?.classroom_id;
        if (!classId) return;

        try {
            if (editingTopicId) {
                await syllabusAPI.updateMasterSyllabusTopic(editingTopicId, newMasterTopic);
                toast.success("Topic Updated Successfully");
            } else {
                await syllabusAPI.addMasterSyllabusTopic({ ...newMasterTopic, classroom_id: classId, academic_year_id: activeYear.id });
                toast.success("New Master Topic Logged");
            }
            setNewMasterTopic({ subject_name: '', chapter_name: '', topic_name: '', planned_lectures: 1 });
            setEditingTopicId(null);
            fetchClassroomData();
        } catch (err) {
            console.error(err);
            toast.error("Registry Sync Failed");
        }
    };

    const handleDeleteTopic = async (id) => {
        if (!window.confirm("Are you sure you want to delete this master topic?")) return;
        try {
            await syllabusAPI.deleteMasterSyllabusTopic(id);
            toast.success("Topic Deleted");
            fetchClassroomData();
        } catch (err) {
            console.error(err);
            toast.error("Deletion Blocked");
        }
    };

    const handleEditTopic = (topic) => {
        setNewMasterTopic({
            subject_name: topic.subject_name,
            chapter_name: topic.chapter_name,
            topic_name: topic.topic_name,
            planned_lectures: topic.planned_lectures || 1
        });
        setEditingTopicId(topic.id);
        window.scrollTo({ top: 100, behavior: 'smooth' });
    };

    if (loading && classrooms.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
                <Loader2 className="w-12 h-12 text-[#021431] animate-spin" />
                <p className="text-[12px] font-black text-[#021431] uppercase tracking-[0.3em]">Accessing Matrix...</p>
            </div>
        );
    }

    // --- GRID VIEW ---
    if (!selectedClassroom) {
        return (
            <div className="p-4 lg:p-8 space-y-8 animate-in fade-in duration-500 text-left">
                <ModuleHeader
                    title="Report Center"
                    subTitle="Clarifying Institutional Registry Matrix"
                    icon={ClipboardCheck}
                    toggleSidebar={toggleSidebar}
                />

                <div className="px-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {classrooms.map((cls) => (
                        <div
                            key={cls.id || cls.classroom_id}
                            className="bg-white rounded-4xl p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all group relative cursor-pointer border border-slate-50"
                            onClick={() => setSelectedClassroom(cls)}
                        >
                            <div className="absolute top-7 right-7">
                                <div className="px-3 py-1 bg-[#fff7ed] text-[#ea580c] rounded-lg text-[8px] font-black uppercase tracking-widest">
                                    {cls.teacher_name || cls.class_teacher || 'UNASSIGNED'}
                                </div>
                            </div>
                            <div className="w-11 h-11 rounded-md bg-[#eef2ff] flex items-center justify-center text-lg font-black text-[#4f46e5] mb-6">
                                {cls.class_name.charAt(0)}
                            </div>
                            <h3 className="text-[24px] font-black text-[#021431] uppercase tracking-tighter leading-none mb-1.5">
                                {cls.class_name}
                            </h3>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-10">
                                Section {cls.section || 'A'} / Room {cls.room_number || 'TBA'}
                            </p>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Users size={14} strokeWidth={2.5} />
                                    <span className="text-[11px] font-black uppercase tracking-widest">{cls.student_count || 0} Enrolled</span>
                                </div>
                                <div className="w-9 h-9 bg-[#eff6ff] text-[#1d4ed8] rounded-full flex items-center justify-center group-hover:bg-[#021431] group-hover:text-white transition-all shadow-sm">
                                    <ArrowRight size={16} strokeWidth={2.5} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const isClassTeacher = selectedClassroom && String(selectedClassroom.class_teacher_id) === String(selectedTeacherId);

    // --- DETAIL VIEW ---
    return (
        <div className="p-4 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8 text-left">
            <ModuleHeader
                title="Intelligence Matrix"
                subTitle={`${selectedClassroom.class_name} Precision Audit Registry`}
                icon={ClipboardCheck}
                toggleSidebar={toggleSidebar}
                leftCustomContent={
                    <button onClick={() => setSelectedClassroom(null)} className="p-2 lg:p-3 bg-white hover:bg-white/20 text-black! rounded-md transition-all border border-white/10 active:scale-90">
                        <ChevronLeft size={20} />
                    </button>
                }
            >
                <div className="flex gap-2 w-full justify-end">
                    <div className="relative group w-28 sm:w-auto shrink-0">
                        <select
                            value={selectedTeacherId}
                            onChange={(e) => setSelectedTeacherId(e.target.value)}
                            className="w-full px-3 sm:px-6 py-2.5 sm:py-3.5 bg-white text-black rounded-md font-black text-[9px] sm:text-[10px] uppercase tracking-widest border border-white/20 outline-none transition-all appearance-none cursor-pointer pr-7 sm:pr-10 truncate"
                        >
                            <option value="all" className="text-black bg-white">All Staff</option>
                            {teachersInClass.map(t => (
                                <option key={t.id} value={t.id} className="text-slate-800">{t.name}</option>
                            ))}
                        </select>
                        <User className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-3 sm:w-4 h-3 sm:h-4 text-black pointer-events-none" />
                    </div>
                </div>
            </ModuleHeader>

            <div className="flex flex-wrap lg:flex-nowrap items-center gap-1 bg-slate-100 p-1.5 rounded-md w-full lg:w-fit border border-slate-200 shadow-inner">
                {['overview', 'syllabus_tracker', 'completion_report'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 lg:flex-none text-center px-2 lg:px-6 py-2.5 lg:py-3 rounded-md text-[9px] lg:text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-[#021431] shadow-sm ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        {tab.replace('_', ' ')}
                    </button>
                ))}
            </div>

            {activeTab === 'overview' && (
                <div className="space-y-8">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                        <StatCard label="Avg Attendance" value={`${stats.attendance}%`} icon={Calendar} color="bg-emerald-500" />
                        <StatCard label="Class Average" value={`${stats.averagePerformance}%`} icon={TrendingUp} color="bg-[#021431]" />
                        <StatCard label="Completion Rate" value={`${getCompletionRate(selectedTeacherId)}%`} icon={BookOpen} color="bg-indigo-600" />
                        <StatCard label="Students" value={selectedClassroom.student_count || 0} icon={Users} color="bg-amber-500" />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Cards removed as requested */}
                    </div>
                </div>
            )}

            {activeTab === 'syllabus_tracker' && (
                <div className="space-y-8">
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 mb-8 shadow-sm">
                        <h3 className="text-[11px] font-black text-indigo-600 uppercase tracking-widest mb-4">Master Syllabus Definition</h3>
                        <form onSubmit={handleAddMasterTopic} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                            <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Subject</label><select className="w-full p-3 bg-white border border-slate-200 rounded-md text-[11px] font-bold uppercase outline-none focus:border-indigo-400" value={newMasterTopic.subject_name} onChange={(e) => setNewMasterTopic({ ...newMasterTopic, subject_name: e.target.value })} required><option value="">Select Subject</option>{classroomSubjects.map(sub => (<option key={sub.id} value={sub.subject_name}>{sub.subject_name}</option>))}</select></div>
                            <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Chapter</label><input type="text" placeholder="e.g. Unit 1" className="w-full p-3 bg-white border border-slate-200 rounded-md text-[11px] font-bold uppercase" value={newMasterTopic.chapter_name} onChange={(e) => setNewMasterTopic({ ...newMasterTopic, chapter_name: e.target.value })} required /></div>
                            <div className="md:col-span-2"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Topic</label><input type="text" placeholder="e.g. Basics" className="w-full p-3 bg-white border border-slate-200 rounded-md text-[11px] font-bold uppercase" value={newMasterTopic.topic_name} onChange={(e) => setNewMasterTopic({ ...newMasterTopic, topic_name: e.target.value })} required /></div>
                            <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Lectures</label><input type="number" className="w-full p-3 bg-white border border-slate-200 rounded-md text-[11px] font-bold uppercase" value={newMasterTopic.planned_lectures} onChange={(e) => setNewMasterTopic({ ...newMasterTopic, planned_lectures: parseInt(e.target.value) })} required /></div>
                            <div className="md:col-span-5 flex justify-end"><button type="submit" className={`px-10 py-3 ${editingTopicId ? 'bg-amber-500' : 'bg-indigo-600'} text-white rounded-md text-[10px] font-black uppercase active:scale-95 transition-all`}>{editingTopicId ? 'Update Topic' : 'Add Master Topic'}</button></div>
                        </form>
                    </div>

                    <div className="bg-white shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center"><h2 className="text-xl font-black text-[#021431] uppercase tracking-tighter">Syllabus Audit</h2><div className="text-right"><p className="text-4xl font-black text-indigo-600">{getCompletionRate(selectedTeacherId)}%</p><p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mt-1">Completion</p></div></div>
                        <DataTable
                            columnCount={7}
                            headers={[
                                { label: 'Subject', className: 'bg-indigo-300 text-black font-black border-r-table' },
                                { label: 'Chapter', className: 'bg-indigo-300 text-black font-black border-r-table' },
                                { label: 'Topic', className: 'bg-indigo-300 text-black font-black border-r-table' },
                                { label: 'Planned', className: 'bg-indigo-300 text-black font-black border-r-table text-center' },
                                { label: 'Done', className: 'bg-indigo-300 text-black font-black border-r-table text-center' },
                                { label: 'Status', className: 'bg-indigo-300 text-black font-black border-r-table text-center' },
                                { label: 'Action', className: 'bg-indigo-300 text-black font-black text-center' }
                            ]}
                            footer={
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Displaying Page {syllabusPage} of {Math.max(1, Math.ceil(
                                            masterSyllabus.filter(m => selectedTeacherId === 'all' || isClassTeacher || classroomSubjects.find(s => s.subject_name === m.subject_name && String(s.teacher_id) === String(selectedTeacherId))).length / 10
                                        ))}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setSyllabusPage(p => Math.max(1, p - 1))}
                                            disabled={syllabusPage === 1}
                                            className="px-5 py-2 bg-slate-100 border border-slate-200 text-[#001736] rounded-md text-[10px] font-black uppercase hover:bg-[#001736] hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                        >Prev</button>
                                        <button
                                            onClick={() => setSyllabusPage(p => {
                                                const total = masterSyllabus.filter(m => selectedTeacherId === 'all' || isClassTeacher || classroomSubjects.find(s => s.subject_name === m.subject_name && String(s.teacher_id) === String(selectedTeacherId))).length;
                                                return Math.min(Math.ceil(total / 10), p + 1);
                                            })}
                                            disabled={syllabusPage >= Math.ceil(masterSyllabus.filter(m => selectedTeacherId === 'all' || isClassTeacher || classroomSubjects.find(s => s.subject_name === m.subject_name && String(s.teacher_id) === String(selectedTeacherId))).length / 10)}
                                            className="px-5 py-2 bg-slate-100 border border-slate-200 text-[#001736] rounded-md text-[10px] font-black uppercase hover:bg-[#001736] hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                        >Next</button>
                                    </div>
                                </div>
                            }
                        >
                            {masterSyllabus
                                .filter(m => selectedTeacherId === 'all' || isClassTeacher || classroomSubjects.find(s => s.subject_name === m.subject_name && String(s.teacher_id) === String(selectedTeacherId)))
                                .slice((syllabusPage - 1) * 10, syllabusPage * 10)
                                .map(topic => {
                                    const lecturesCompleted = syllabusLogs.filter(log => log.subject_name === topic.subject_name && log.topic_name === topic.topic_name).length;
                                    const isDone = lecturesCompleted >= topic.planned_lectures;
                                    return (
                                        <tr key={topic.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4 border-b-table border-r-table text-center">
                                                <span className="text-[11px] font-bold text-black uppercase tracking-widest">{topic.subject_name}</span>
                                            </td>
                                            <td className="p-4 border-b-table border-r-table text-center">
                                                <span className="text-[11px] font-bold text-black uppercase tracking-widest">{topic.chapter_name}</span>
                                            </td>
                                            <td className="p-4 border-b-table border-r-table text-center">
                                                <span className="text-[11px] font-black text-black uppercase">{topic.topic_name}</span>
                                            </td>
                                            <td className="p-4 border-b-table border-r-table text-center">
                                                <span className="text-[11px] font-bold text-amber-600">{topic.planned_lectures}</span>
                                            </td>
                                            <td className="p-4 border-b-table border-r-table text-center">
                                                <span className="text-[11px] font-bold text-emerald-600">{lecturesCompleted}</span>
                                            </td>
                                            <td className="p-4 border-b-table border-r-table text-center">
                                                {isDone
                                                    ? <span className="bg-emerald-500 text-white px-3 py-1.5 rounded-full flex items-center gap-1 text-[9px] font-black uppercase mx-auto w-fit"><Check size={11} /> Done</span>
                                                    : <span className="bg-slate-100 text-slate-500 px-3 py-1.5 rounded-full text-[9px] font-black uppercase mx-auto w-fit border border-slate-200">Pending</span>
                                                }
                                            </td>
                                            <td className="p-4 border-b-table text-center">
                                                <div className="flex gap-2 justify-center">
                                                    <button onClick={() => handleEditTopic(topic)} className="text-indigo-500 hover:text-indigo-700 transition-colors"><Pencil size={15} /></button>
                                                    <button onClick={() => handleDeleteTopic(topic.id)} className="text-rose-500 hover:text-rose-700 transition-colors"><Trash2 size={15} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                        </DataTable>
                    </div>
                </div>
            )}

            {activeTab === 'completion_report' && (
                <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden p-8">
                    <h3 className="text-xl font-black text-[#021431] uppercase tracking-tighter mb-8">Institutional Completion Matrix</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {classroomSubjects.filter(s => selectedTeacherId === 'all' || isClassTeacher || String(s.teacher_id) === String(selectedTeacherId)).map(sub => {
                            const subTopics = masterSyllabus.filter(m => m.subject_name === sub.subject_name);
                            const completedCount = subTopics.reduce((acc, topic) => {
                                const done = syllabusLogs.filter(log => log.subject_name === topic.subject_name && log.topic_name === topic.topic_name).length;
                                return done >= topic.planned_lectures ? acc + 1 : acc;
                            }, 0);
                            const percent = subTopics.length > 0 ? ((completedCount / subTopics.length) * 100).toFixed(0) : 0;
                            return (
                                <div key={sub.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 shadow-sm">
                                    <div className="flex justify-between mb-4"><h4 className="text-[14px] font-black text-[#021431] uppercase">{sub.subject_name}</h4>{percent == 100 && <CheckCircle2 className="text-emerald-500 w-6 h-6" />}</div>
                                    <div className="flex justify-between items-end"><div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Mentor</p><p className="text-[12px] font-black text-indigo-600 uppercase mt-1">{sub.teacher_name}</p></div><p className="text-3xl font-black text-[#021431]">{percent}%</p></div>
                                    <div className="mt-6 bg-white h-3 rounded-full overflow-hidden border border-slate-100 shadow-inner"><div className="bg-indigo-600 h-full transition-all duration-1000" style={{ width: `${percent}%` }}></div></div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-4 text-center tracking-widest">{completedCount} of {subTopics.length} Topics Mastered</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ label, value, icon: IconComponent, color }) => {
    const Icon = IconComponent;
    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group text-left">
            <div className={`w-12 h-12 rounded-md ${color} text-white flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                <Icon size={24} />
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
            <p className="text-3xl font-black text-[#021431] tracking-tighter">{value}</p>
        </div>
    );
};


export default AdminClassReports;
