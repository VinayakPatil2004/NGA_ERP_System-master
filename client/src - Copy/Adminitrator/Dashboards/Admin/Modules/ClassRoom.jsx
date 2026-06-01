import React, { useState, useEffect, useCallback } from 'react';
import {
    Users, GraduationCap, ChevronLeft,
    Trash2, ShieldCheck, Plus, X,
    DoorOpen, BookOpen, BarChart3, Edit3, Clock, Zap, BarChart2,
    FileSpreadsheet, FilePieChart, ArrowRight
} from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import DataTable from '../../../admcomponents/DataTable';
import ClassReports from './ClassReports';

const API_BASE = 'http://localhost:5000/api';

/**
 * ClassRoom - Pedagogical Resource & Faculty Management
 * Refined to the 'Simplified Premium' aesthetic with rounded-2xl and 1px borders.
 */
const ClassRoom = ({ toggleSidebar }) => {
    const [view, setView] = useState('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [classrooms, setClassrooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedClass, setSelectedClass] = useState(null);
    const [academicYear, setAcademicYear] = useState('');
    const [availableYears, setAvailableYears] = useState([]);
    const [staffList, setStaffList] = useState([]);

    const [showClassModal, setShowClassModal] = useState(false);
    const [showSubjectModal, setShowSubjectModal] = useState(false);
    const [editingClass, setEditingClass] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const activeYear = availableYears.find(y => y.year_name === academicYear);
            const academic_year_id = activeYear?.id;

            const [classesRes, staffRes] = await Promise.all([
                axios.get(`${API_BASE}/classrooms`, { params: { academic_year_id } }),
                axios.get(`${API_BASE}/staff/all`)
            ]);
            setClassrooms(classesRes.data || []);
            setStaffList(staffRes.data || []);
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch data");
        } finally {
            setLoading(false);
        }
    }, [academicYear, availableYears]);

    const fetchAcademicYears = async () => {
        try {
            const res = await axios.get(`${API_BASE}/academic-years/all`);
            setAvailableYears(res.data);
            const active = res.data.find(y => y.is_active);
            if (active) setAcademicYear(active.year_name);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchAcademicYears();
    }, []);

    useEffect(() => {
        if (availableYears.length > 0) {
            fetchData();
        }
    }, [fetchData, availableYears.length]);

    const handleClassSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        data.capacity = parseInt(data.capacity);
        data.grade_level = 0; // Default Logic

        try {
            if (editingClass) {
                await axios.put(`${API_BASE}/classrooms/${editingClass.id}`, data);
                toast.success("Classroom parameters updated");
            } else {
                await axios.post(`${API_BASE}/classrooms`, data);
                toast.success("New classroom established");
            }
            setShowClassModal(false);
            setEditingClass(null);
            fetchData();
        } catch {
            toast.error("Administrative update failed");
        }
    };

    const handleViewDetails = async (cls) => {
        try {
            const activeYear = availableYears.find(y => y.year_name === academicYear);
            const academic_year_id = activeYear?.id;

            const [studentsRes, subjectsRes] = await Promise.all([
                axios.get(`${API_BASE}/classrooms/${cls.id}/students`, { params: { academic_year_id } }),
                axios.get(`${API_BASE}/classrooms/${cls.id}/subjects`)
            ]);
            setSelectedClass({ ...cls, students: studentsRes.data, subjects: subjectsRes.data });
            setView('details');
        } catch (err) {
            console.error(err);
            toast.error("Failed to load class details");
        }
    };

    const filteredClasses = classrooms.filter(c =>
        c.class_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.room_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDeleteClass = async (id) => {
        if (!window.confirm("Delete classroom from institutional records?")) return;
        try {
            await axios.delete(`${API_BASE}/classrooms/${id}`);
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
            await axios.post(`${API_BASE}/classrooms/subjects`, {
                classroom_id: selectedClass.id,
                subjects
            });
            toast.success("Subject schedule synchronized");
            setShowSubjectModal(false);
            handleViewDetails(selectedClass);
        } catch {
            toast.error("Sync failed");
        }
    };

    return (
        <div className="p-4 lg:p-8 bg-[#F8FAFC] min-h-screen font-sans">

            {view === 'list' && (
                <>
                    {/* 1. Standard Module Header */}
                    <ModuleHeader
                        title="Classrooms"
                        subTitle="Pedagogical Resource & Faculty Allocation"
                        icon={DoorOpen}
                        toggleSidebar={toggleSidebar}
                        showSearch={true}
                        searchValue={searchTerm}
                        onSearchChange={setSearchTerm}
                        hideDesktopSearch={true}
                    >
                        <div className="flex items-center gap-2 lg:gap-3">
                            <select
                                className="hidden lg:block bg-white border border-slate-200 text-[#001736] text-[12px] font-bold uppercase tracking-widest px-4 py-3 rounded-xl outline-none focus:ring-4 focus:ring-amber-500/10 transition-all shadow-sm cursor-pointer"
                                value={academicYear}
                                onChange={(e) => setAcademicYear(e.target.value)}
                            >
                                {availableYears.map(year => <option key={year.id} value={year.year_name}>{year.year_name}</option>)}
                            </select>

                            <button
                                onClick={() => { setEditingClass(null); setShowClassModal(true); }}
                                className="bg-[#001736] text-white px-4 py-3 lg:px-6 lg:py-4 rounded-xl font-bold text-[10px] lg:text-[11px] uppercase tracking-widest shadow-xl hover:bg-black transition-all flex items-center gap-2 lg:gap-3 active:scale-95"
                            >
                                <Plus size={18} className="lg:w-4 lg:h-4" />
                                <span className="hidden lg:inline">Add Class</span>
                                <span className="lg:hidden">Add</span>
                            </button>

                            <div className="hidden lg:flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                                <button className="p-2 hover:bg-slate-50 rounded-lg transition-all px-3"><FileSpreadsheet className="w-4 h-4 text-emerald-500" /></button>
                                <div className="w-px h-5 bg-slate-200 my-auto mx-1" />
                                <button className="p-2 hover:bg-slate-50 rounded-lg transition-all px-3"><FilePieChart className="w-4 h-4 text-rose-500" /></button>
                            </div>
                        </div>
                    </ModuleHeader>

                    {/* 2. Metrics Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-10">
                        <StatusMetric label="Total Hubs" value={classrooms.length} icon={DoorOpen} color="bg-amber-500" />
                        <StatusMetric label="Active Pupils" value={classrooms.reduce((acc, curr) => acc + (curr.student_count || 0), 0)} icon={Users} color="bg-indigo-600" />
                        <StatusMetric label="Avg Capacity" value={classrooms.length ? Math.round(classrooms.reduce((acc, curr) => acc + curr.capacity, 0) / classrooms.length) : 0} icon={BarChart2} color="bg-emerald-600" />
                        <StatusMetric label="Mentors Active" value={new Set(classrooms.map(c => c.class_teacher_id)).size} icon={ShieldCheck} color="bg-rose-500" />
                    </div>

                    {/* 3. Standard Data Table */}
                    <DataTable
                        headers={[
                            { label: "Class & Room Index" },
                            { label: "Academic Division", className: "w-[150px]" },
                            { label: "Lead Mentor" },
                            { label: "Enrollment Status", className: "text-center w-[180px]" },
                            { label: "Actions", className: "text-right w-[180px]" }
                        ]}
                        columnCount={5}
                        loading={loading}
                        emptyMessage="No Classrooms Detected"
                        footer={
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400">
                                <span className="tracking-widest">Registry Status: Synchronized</span>
                                <span className="tracking-[0.2em]">{classrooms.length} Modular Units Detected</span>
                            </div>
                        }
                    >
                        {filteredClasses.map((cls) => (
                            <tr key={cls.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-8 py-6 border-r border-slate-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-50 border border-slate-200 text-[#001736] rounded-xl flex items-center justify-center font-bold text-sm shadow-sm group-hover:bg-[#001736] group-hover:text-white transition-all">
                                            {cls.class_name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-[14px] font-bold text-[#001736] uppercase tracking-tight leading-none truncate">
                                                {cls.class_name} {cls.section ? `- ${cls.section}` : ''}
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1.5 tracking-widest opacity-60">RM Index: {cls.room_number || 'N/A'}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6 border-r border-slate-100">
                                    <span className="px-4 py-2 bg-slate-50 text-[#001736] font-bold text-[10px] tracking-widest rounded-lg border border-slate-200 uppercase">
                                        {cls.stream || (cls.grade_level > 10 ? 'Senior' : 'Primary')}
                                    </span>
                                </td>
                                <td className="px-8 py-6 border-r border-slate-100">
                                    <p className="text-[14px] text-[#001736] font-bold uppercase leading-tight">{cls.teacher_name || 'Unassigned'}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1.5 tracking-widest opacity-60">Lead Faculty</p>
                                </td>
                                <td className="px-8 py-6 border-r border-slate-100 text-center">
                                    <div className="space-y-2">
                                        <p className="text-[16px] font-bold text-[#001736] tracking-tighter">{cls.student_count || 0} / {cls.capacity}</p>
                                        <div className="w-24 h-1.5 bg-slate-100 rounded-full mx-auto overflow-hidden">
                                            <div className="h-full bg-emerald-500" style={{ width: `${Math.min(((cls.student_count || 0) / cls.capacity) * 100, 100)}%` }} />
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="flex items-center justify-end gap-3">
                                        <ActionButton icon={BookOpen} label="Curriculum" color="bg-white border border-slate-200 text-[#001736] hover:bg-[#001736] hover:text-white" onClick={() => handleViewDetails(cls)} />
                                        <ActionButton icon={Edit3} label="Parameters" color="bg-white border border-slate-200 text-amber-600 hover:bg-amber-50" onClick={() => { setEditingClass(cls); setShowClassModal(true); }} />
                                        <ActionButton icon={Trash2} label="Delete" color="bg-white border border-slate-200 text-rose-500 hover:bg-rose-500 hover:text-white" onClick={() => handleDeleteClass(cls.id)} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </DataTable>
                </>
            )}

            {view === 'details' && selectedClass && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <button onClick={() => setView('list')} className="mb-8 flex items-center gap-3 text-[#001736] font-bold text-[11px] uppercase tracking-[0.3em] hover:translate-x-[-8px] transition-all opacity-60">
                        <ChevronLeft className="w-5 h-5" /> Terminate Detail View
                    </button>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
                        <div className="p-12 border-b border-slate-100 bg-[#F8FAFC]/50 flex flex-col md:flex-row justify-between items-center gap-8">
                            <div className="flex items-center gap-8">
                                <div className="w-20 h-20 bg-[#001736] text-amber-400 rounded-xl flex items-center justify-center font-bold text-3xl shadow-lg">
                                    {selectedClass.class_name.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-5xl font-black text-[#001736] tracking-tighter uppercase">{selectedClass.class_name} {selectedClass.section || ''}</h2>
                                    <p className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.4em] mt-2">Resource Allocation Matrix Active</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setView('reports')} className="px-8 py-4 bg-white border border-slate-200 rounded-xl font-bold text-[11px] uppercase tracking-widest text-[#001736] hover:bg-slate-50 transition-all flex items-center gap-3 active:scale-95 shadow-sm">
                                    <BarChart3 className="w-5 h-5" /> Analytic Reports
                                </button>
                                <button onClick={() => setShowSubjectModal(true)} className="px-8 py-4 bg-amber-400 text-[#001736] rounded-xl font-bold text-[11px] uppercase tracking-[0.2em] shadow-lg transition-all hover:bg-amber-500 active:scale-95">
                                    Subject Mapping
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 divide-x divide-slate-100">
                            <div className="lg:col-span-2 p-12">
                                <h3 className="text-xl font-bold text-[#001736] mb-10 uppercase tracking-tight flex items-center gap-4">
                                    <Users className="w-7 h-7 text-indigo-600 opacity-20" /> Student Registry
                                </h3>
                                <div className="overflow-hidden border border-slate-200 rounded-2xl shadow-sm">
                                    <table className="w-full text-left">
                                        <thead className="bg-[#F8FAFC] border-b border-slate-200">
                                            <tr>
                                                <th className="px-8 py-5 text-[11px] font-bold text-[#001736] uppercase tracking-widest">Roll Identifier</th>
                                                <th className="px-8 py-5 text-[11px] font-bold text-[#001736] uppercase tracking-widest">Identity Name</th>
                                                <th className="px-8 py-5 text-[11px] font-bold text-[#001736] uppercase tracking-widest">SR No.</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 font-bold">
                                            {selectedClass.students?.length === 0 ? (
                                                <tr><td colSpan="3" className="px-8 py-16 text-center text-slate-300 uppercase tracking-[0.2em]">Zero Records Detected</td></tr>
                                            ) : selectedClass.students?.map(s => (
                                                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-8 py-5 text-indigo-600 text-[14px]">#{s.roll_number?.toString().padStart(3, '0') || '---'}</td>
                                                    <td className="px-8 py-5">
                                                        <p className="text-[14px] text-[#001736] uppercase">{s.student_name}</p>
                                                        <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 opacity-60">{s.gender}</p>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <span className="px-4 py-1.5 bg-slate-50 text-slate-500 rounded-lg text-[11px] font-mono tracking-widest border border-slate-200">{s.student_id_no}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="p-12 space-y-12 bg-[#F8FAFC]/30">
                                <div>
                                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-8">Pedagogical Lead</h4>
                                    <div className="p-8 bg-white border border-slate-200 rounded-2xl flex items-center gap-6 shadow-sm hover:shadow-md transition-all">
                                        <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-[#001736] shadow-sm">
                                            <GraduationCap className="w-8 h-8 opacity-20" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1.5 opacity-60">Institutional Mentor</p>
                                            <p className="text-xl font-bold text-[#001736] uppercase tracking-tight leading-none">{selectedClass.teacher_name || 'Unassigned'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em]">Curriculum Index</h4>
                                    <div className="space-y-4">
                                        {selectedClass.subjects?.map(sub => (
                                            <div key={sub.id} className="p-6 bg-white border border-slate-200 rounded-xl flex justify-between items-center group hover:bg-slate-50 transition-colors shadow-sm">
                                                <div>
                                                    <p className="text-[14px] font-bold text-[#001736] uppercase tracking-tight">{sub.subject_name}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-60">{sub.teacher_name || 'PENDING'}</p>
                                                    {sub.start_time && (
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <Clock className="w-3 h-3 text-indigo-300" />
                                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                                                                {sub.start_time} - {sub.end_time}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                                <BookOpen className="w-5 h-5 text-slate-200 opacity-20 group-hover:text-amber-500 group-hover:opacity-100 transition-all" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                                <h2 className="text-3xl font-black uppercase tracking-tight">Set Registry</h2>
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
                                    COMMIT CONFIGURATION <ArrowRight className="w-5 h-5 opacity-40" />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {showSubjectModal && selectedClass && (
                <div className="fixed inset-0 z-110 flex items-center justify-center p-4 bg-[#001736]/90 backdrop-blur-md">
                    <div className="bg-white rounded-2xl border border-white/20 shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-10 bg-[#001736] text-white flex justify-between items-center">
                            <h2 className="text-3xl font-black uppercase tracking-tight flex items-center gap-4">
                                <BookOpen className="w-8 h-8 text-amber-400" /> Curriculum Sync
                            </h2>
                            <button onClick={() => setShowSubjectModal(false)} className="bg-white/10 hover:bg-rose-500 p-3 rounded-xl transition-all border border-white/10">
                                <X className="w-8 h-8" />
                            </button>
                        </div>
                        <div className="p-10 overflow-y-auto">
                            <form onSubmit={handleSubjectSubmit} className="space-y-8">
                                <div className="space-y-6">
                                    {(selectedClass.subjects?.length > 0 ? selectedClass.subjects : [{ subject_name: '', teacher_id: '', start_time: '', end_time: '' }]).map((sub, idx) => (
                                        <div key={idx} className="relative bg-white border border-slate-100 p-8 rounded-xl shadow-sm hover:border-slate-300 transition-all">
                                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
                                                <div className="lg:col-span-4 space-y-2 text-left">
                                                    <label className="text-[10px] uppercase font-bold ml-2 text-slate-300 tracking-widest">Subject Name</label>
                                                    <input name="subject_name" defaultValue={sub.subject_name} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-[#001736] uppercase focus:bg-white focus:border-amber-400 outline-none transition-all" required />
                                                </div>
                                                <div className="lg:col-span-4 space-y-2 text-left">
                                                    <label className="text-[10px] uppercase font-bold ml-2 text-slate-300 tracking-widest">Faculty Mentor</label>
                                                    <select name="teacher_id" defaultValue={sub.teacher_id} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-[#001736] focus:bg-white focus:border-amber-400 outline-none transition-all uppercase">
                                                        <option value="">Pool Teacher</option>
                                                        {staffList.filter(s => s.staff_type === 'teaching').map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                                                    </select>
                                                </div>
                                                <div className="lg:col-span-2 space-y-2 text-left">
                                                    <label className="text-[10px] uppercase font-bold ml-2 text-slate-300 tracking-widest">Start</label>
                                                    <input type="time" name="start_time" defaultValue={sub.start_time} className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-[#001736]" />
                                                </div>
                                                <div className="lg:col-span-2 space-y-2 text-left">
                                                    <label className="text-[10px] uppercase font-bold ml-2 text-slate-300 tracking-widest">End</label>
                                                    <input type="time" name="end_time" defaultValue={sub.end_time} className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-[#001736]" />
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
                                        className="flex-1 py-5 border border-dashed border-slate-300 text-slate-400 rounded-xl font-bold uppercase tracking-widest hover:border-[#001736] hover:text-[#001736] transition-all flex items-center justify-center gap-2"
                                    >
                                        <Plus className="w-5 h-5" /> Append Curriculum Matrix
                                    </button>
                                    <button type="submit" className="flex-1 bg-[#001736] text-white py-5 rounded-xl font-bold uppercase tracking-[0.3em] shadow-xl flex items-center justify-center gap-3 hover:bg-black transition-all active:scale-[0.98]">
                                        <Zap className="w-5 h-5 text-amber-400" /> Commit Synchronization
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

const StatusMetric = ({ label, value, icon, color }) => {
    const Icon = icon;
    return (
        <div className="bg-white p-4 lg:p-8 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3 lg:gap-6 group hover:shadow-lg hover:border-slate-200 transition-all">
            <div className={`w-10 h-10 lg:w-14 lg:h-14 rounded-xl bg-linear-to-br ${color} shadow-lg flex items-center justify-center transition-transform group-hover:scale-110 border border-white/10 shrink-0`}>
                <Icon size={18} className="lg:w-7 lg:h-7 text-white" />
            </div>
            <div>
                <p className="text-[8px] lg:text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 lg:mb-1.5">{label}</p>
                <h3 className="text-xl lg:text-3xl font-bold text-[#001736] tracking-tight leading-none">{value}</h3>
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
