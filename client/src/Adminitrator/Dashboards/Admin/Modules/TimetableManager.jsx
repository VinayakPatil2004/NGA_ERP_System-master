import React, { useState, useEffect, useCallback } from 'react';
import {
    Calendar, Clock, Settings, Plus, Save, Trash2,
    ChevronRight, ChevronLeft, Filter, AlertCircle, CheckCircle2,
    Users, BookOpen, CalendarDays, Download, UserCheck, Zap, X
} from 'lucide-react';
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import InstitutionalTimetable from '../../../admcomponents/InstitutionalTimetable';
import * as academicYearAPI from '../../../../services/academicYearAPI';
import * as classroomAPI from '../../../../services/classroomAPI';
import * as staffAPI from '../../../../services/staffAPI';
import * as timetableAPI from '../../../../services/timetableAPI';
import { toRoman } from '../../../../utils/romanUtils';
import { toast } from 'react-hot-toast';

const TimetableManager = ({ toggleSidebar }) => {
    // --- State ---
    const [view, setView] = useState('grid');
    const [viewContext, setViewContext] = useState('classroom'); // 'classroom' or 'staff'
    const [years, setYears] = useState([]);
    const [activeYearId, setActiveYearId] = useState("");
    const [classrooms, setClassrooms] = useState([]);
    const [selectedClass, setSelectedClass] = useState(null);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [timetableData, setTimetableData] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [classSubjects, setClassSubjects] = useState([]);
    const [settings, setSettings] = useState({
        school_start_time: '08:05',
        school_end_time: '14:00',
        lecture_duration: 35,
        first_lecture_start: '08:15',
        recess_slots: [
            { label: 'Assembly', start: '08:05', end: '08:15', period: 'ASSEMBLY' },
            { label: 'Short Recess', start: '10:00', end: '10:10', period: 'SHORT_RECESS' },
            { label: 'Long Recess', start: '11:55', end: '12:15', period: 'LONG_RECESS' }
        ]
    });

    // --- Modal State ---
    const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
    const [activeSlot, setActiveSlot] = useState(null);

    // --- Matrix Generation Logic ---
    const matrixLayout = React.useMemo(() => {
        const template = ['ASSEMBLY', 'I', 'II', 'III', 'SHORT_RECESS', 'IV', 'V', 'VI', 'LONG_RECESS', 'VII', 'VIII', 'IX'];
        const timings = {};
        let currentTime = settings.first_lecture_start;

        template.forEach((p) => {
            const recess = settings.recess_slots.find(r => r.period === p);
            if (recess) {
                timings[p] = { start: recess.start, end: recess.end };
                if (p !== 'ASSEMBLY') currentTime = recess.end;
            } else {
                const [h, m] = (currentTime || "08:15").split(':').map(Number);
                const start = currentTime;
                const duration = parseInt(settings.lecture_duration) || 35;
                const endTimestamp = new Date(0, 0, 0, h, (m || 0) + duration);
                const endH = String(endTimestamp.getHours()).padStart(2, '0');
                const endM = String(endTimestamp.getMinutes()).padStart(2, '0');
                const end = `${endH}:${endM}`;
                timings[p] = { start, end };
                currentTime = end;
            }
        });
        return { template, timings };
    }, [settings]);

    const handlePrint = () => window.print();

    // --- Data Fetching ---
    const fetchClassrooms = useCallback(async (yearId) => {
        try {
            const data = await classroomAPI.getClassrooms(yearId);
            setClassrooms(data || []);
        } catch (error) {
            console.error("Failed to fetch classrooms", error);
        }
    }, []);

    const fetchTimetableSettings = useCallback(async (yearId) => {
        try {
            const data = await timetableAPI.getSettings(yearId);
            if (data && data.school_start_time) {
                setSettings(prev => ({
                    ...prev,
                    school_start_time: data.school_start_time.slice(0, 5),
                    school_end_time: data.school_end_time.slice(0, 5),
                    first_lecture_start: data.first_lecture_start?.slice(0, 5) || prev.first_lecture_start,
                    lecture_duration: data.lecture_duration || prev.lecture_duration,
                    recess_slots: [
                        { label: 'Assembly', start: data.school_start_time.slice(0, 5), end: data.first_lecture_start?.slice(0, 5) || '08:15', period: 'ASSEMBLY' },
                        { label: 'Short Recess', start: data.short_recess_start?.slice(0, 5) || '10:00', end: data.short_recess_end?.slice(0, 5) || '10:10', period: 'SHORT_RECESS' },
                        { label: 'Long Recess', start: data.long_recess_start?.slice(0, 5) || '11:55', end: data.long_recess_end?.slice(0, 5) || '12:15', period: 'LONG_RECESS' }
                    ]
                }));
            }
        } catch (err) {
            console.error(err);
        }
    }, []);

    const fetchClassData = useCallback(async () => {
        if (!selectedClass || !activeYearId) return;
        try {
            const [ttData, subjects] = await Promise.all([
                timetableAPI.getClassTimetable(selectedClass.id, activeYearId),
                classroomAPI.getClassSubjects(selectedClass.id, activeYearId)
            ]);
            setTimetableData(ttData || []);
            setClassSubjects(subjects || []);
        } catch {
            toast.error("Failed to load class registry");
        }
    }, [selectedClass, activeYearId]);

    const fetchStaffData = useCallback(async () => {
        if (!selectedStaff || !activeYearId) return;
        try {
            const ttData = await timetableAPI.getTeacherTimetable(selectedStaff.id, activeYearId);
            const processedData = (ttData || []).map(slot => ({
                ...slot,
                subject_name: toRoman(slot.subject_name)
            }));
            setTimetableData(processedData);
        } catch {
            toast.error("Failed to load staff registry");
        }
    }, [selectedStaff, activeYearId]);

    const fetchInitialData = useCallback(async () => {
        try {
            const [yearsData, staffData] = await Promise.all([
                academicYearAPI.getAllAcademicYears(),
                staffAPI.getAllStaff()
            ]);

            setYears(yearsData || []);
            const active = yearsData?.find(y => y.is_active);
            if (active) {
                setActiveYearId(active.id);
                fetchClassrooms(active.id);
                fetchTimetableSettings(active.id);
            }

            setTeachers(staffData?.filter(s => s.staff_type === 'teaching') || []);
        } catch {
            toast.error("Initialization failed");
        }
    }, [fetchClassrooms, fetchTimetableSettings]);

    useEffect(() => {
        const init = async () => {
            await fetchInitialData();
        };
        init();
    }, [fetchInitialData]);

    useEffect(() => {
        const loadContext = async () => {
            if (viewContext === 'classroom' && selectedClass && activeYearId) {
                await fetchClassData();
            } else if (viewContext === 'staff' && selectedStaff && activeYearId) {
                await fetchStaffData();
            }
        };
        loadContext();
    }, [viewContext, selectedClass, selectedStaff, activeYearId, fetchClassData, fetchStaffData]);

    // --- Handlers ---
    const handleSlotClick = (day, period, existingSlot) => {
        if (viewContext === 'staff') return; // Read-only for staff view in Admin

        const timeInfo = matrixLayout.timings[period] || {};
        setActiveSlot({
            day,
            period,
            ...existingSlot,
            start_time: existingSlot?.start_time?.slice(0, 5) || timeInfo.start,
            end_time: existingSlot?.end_time?.slice(0, 5) || timeInfo.end
        });
        setIsSlotModalOpen(true);
    };

    const handleSaveSettings = async () => {
        try {
            await timetableAPI.saveSettings({
                academic_year_id: activeYearId,
                school_start_time: settings.school_start_time,
                school_end_time: settings.school_end_time,
                first_lecture_start: settings.first_lecture_start,
                lecture_duration: settings.lecture_duration,
                short_recess_start: settings.recess_slots.find(r => r.period === 'SHORT_RECESS')?.start,
                short_recess_end: settings.recess_slots.find(r => r.period === 'SHORT_RECESS')?.end,
                long_recess_start: settings.recess_slots.find(r => r.period === 'LONG_RECESS')?.start,
                long_recess_end: settings.recess_slots.find(r => r.period === 'LONG_RECESS')?.end
            });
            toast.success("Institutional settings synchronized");
            setView('grid');
        } catch {
            toast.error("Failed to sync settings");
        }
    };

    const handleSaveSlot = async (formData) => {
        try {
            const payload = {
                ...formData,
                classroom_id: selectedClass.id,
                academic_year_id: activeYearId,
                start_time: formData.start_time || "00:00:00",
                end_time: formData.end_time || "00:00:00"
            };

            await timetableAPI.saveTimetableSlot(payload);
            toast.success("Schedule synchronized");
            setIsSlotModalOpen(false);
            fetchClassData();
        } catch (err) {
            const msg = err.response?.data?.error || "Save failed";
            toast.error(msg);
        }
    };

    const handleDeleteSlot = async (id) => {
        if (window.confirm("Remove this assignment?")) {
            try {
                await timetableAPI.deleteTimetableSlot(id);
                toast.success("Assignment removed");
                fetchClassData();
            } catch (err) {
                toast.error("Deletion failed");
                console.error(err);
            }
        }
    };

    const handleAutoGenerate = async () => {
        if (!selectedClass || !activeYearId) return;
        if (!window.confirm("Synchronize institutional matrix automatically? (Existing assignments will be overwritten)")) return;

        const loadingToast = toast.loading("Recalibrating academic slots...");
        try {
            await timetableAPI.autoGenerate(selectedClass.id, activeYearId);
            toast.success("Institutional Matrix Synchronized", { id: loadingToast });
            fetchClassData();
        } catch (err) {
            toast.error(err.response?.data?.error || "Matrix Synchronization Failed", { id: loadingToast });
        }
    };

    return (
        <div className="p-4 lg:p-8 bg-[#F8FAFC] min-h-screen font-sans text-left pb-24">
            <div className="print:hidden">
                <ModuleHeader
                    title="Institutional Timetable Manager"
                    subTitle="Matrix 2.0: Conflict-Aware Academic Scheduling"
                    icon={Calendar}
                    toggleSidebar={toggleSidebar}
                >
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setView(view === 'grid' ? 'settings' : 'grid')}
                            className="px-6 py-3 rounded-md bg-white border border-black text-[#001736] text-[11px] font-black uppercase tracking-widest shadow-sm hover:shadow-md transition-all flex items-center gap-2"
                        >
                            {view === 'grid' ? <Settings size={14} /> : <BookOpen size={14} />}
                            {view === 'grid' ? 'Global Settings' : 'Return to Grid'}
                        </button>
                        <div className="relative group hidden sm:block">
                            <select
                                value={activeYearId}
                                onChange={(e) => setActiveYearId(e.target.value)}
                                className="appearance-none rounded-md bg-white border border-black text-[#001736] text-[11px] font-black uppercase tracking-widest px-8 py-3 outline-none focus:ring-1 focus:ring-black min-w-[160px] shadow-sm"
                            >
                                {years.map(y => <option key={y.id} value={y.id}>{y.year_name}</option>)}
                            </select>
                            <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-black transition-colors" />
                        </div>
                    </div>
                </ModuleHeader>
            </div>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar: Context Switcher & Registry Selection */}
                <div className="lg:col-span-1 space-y-4 print:hidden">
                    <div className="bg-slate-100/80 backdrop-blur-md p-1.5 rounded-md flex gap-1 border border-slate-200/50 shadow-sm">
                        <button
                            onClick={() => { setViewContext('classroom'); setTimetableData([]); }}
                            className={`flex-1 py-3 text-[11px] font-extrabold uppercase tracking-wider transition-all flex flex-col items-center gap-1.5 rounded-md ${viewContext === 'classroom' ? 'bg-white text-[#001736] shadow-sm scale-[1.02]' : 'bg-transparent text-slate-500 hover:text-[#001736] font-semibold hover:bg-white/40'}`}
                        >
                            <Users size={18} /> CLASSES
                        </button>
                        <button
                            onClick={() => { setViewContext('staff'); setTimetableData([]); }}
                            className={`flex-1 py-3 text-[11px] font-extrabold uppercase tracking-wider transition-all flex flex-col items-center gap-1.5 rounded-md ${viewContext === 'staff' ? 'bg-white text-[#001736] shadow-sm scale-[1.02]' : 'bg-transparent text-slate-500 hover:text-[#001736] font-semibold hover:bg-white/40'}`}
                        >
                            <UserCheck size={18} /> FACULTY
                        </button>
                    </div>

                    <div className="bg-white rounded-md border border-slate-100 p-6 shadow-sm space-y-6">
                        <div className="space-y-4">
                            <h3 className="text-[12px] font-extrabold text-slate-800 uppercase tracking-widest flex items-center justify-between border-b border-slate-100 pb-4">
                                {viewContext === 'classroom' ? 'CLASSES SELECTION' : 'FACULTY REGISTRY'}
                                {viewContext === 'classroom' ? (
                                    <span className="p-2 bg-indigo-50 text-indigo-600 rounded-md"><Users size={16} /></span>
                                ) : (
                                    <span className="p-2 bg-emerald-50 text-emerald-600 rounded-md"><UserCheck size={16} /></span>
                                )}
                            </h3>
                            <div className="relative group">
                                <select
                                    className="w-full appearance-none bg-slate-50/50 border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-[#001736] text-[13px] font-semibold px-4 py-3.5 rounded-md outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer transition-all shadow-inner"
                                    value={viewContext === 'classroom' ? (selectedClass?.id || "") : (selectedStaff?.id || "")}
                                    onChange={(e) => {
                                        const id = parseInt(e.target.value);
                                        if (viewContext === 'classroom') {
                                            setSelectedClass(classrooms.find(c => c.id === id));
                                        } else {
                                            setSelectedStaff(teachers.find(t => t.id === id));
                                        }
                                    }}
                                >
                                    <option value="">{viewContext === 'classroom' ? 'Select Target Class...' : 'Select Teacher...'}</option>
                                    {viewContext === 'classroom' ?
                                        classrooms.map(cls => <option key={cls.id} value={cls.id}>{toRoman(cls.class_name)} {cls.section && cls.section !== 'General' ? `(${cls.section})` : ''}</option>) :
                                        teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)
                                    }
                                </select>
                                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none group-hover:text-slate-600 transition-colors" />
                            </div>
                        </div>

                        {(selectedClass || selectedStaff) && (
                            <div className="space-y-4">
                                <button
                                    onClick={handlePrint}
                                    className="w-full px-1 py-3.5 bg-linear-to-r from-emerald-500 to-teal-600 text-white text-[12px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 rounded-md hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                                >
                                    <Download size={16} /> DOWNLOAD PDF
                                </button>

                                {viewContext === 'classroom' && (
                                    <button
                                        onClick={handleAutoGenerate}
                                        className="w-full px-1 py-3.5 bg-linear-to-r from-indigo-500 to-violet-600 text-white text-[12px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 rounded-md hover:from-indigo-600 hover:to-violet-700 transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                                    >
                                        <Zap size={16} /> AUTO-GENERATE TIMETABLE
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {(selectedClass || selectedStaff) && (
                        <div className="bg-white rounded-md border border-slate-100 p-6 shadow-sm space-y-6">
                            <h3 className="text-[12px] font-extrabold text-slate-800 uppercase tracking-widest flex items-center justify-between">
                                INSTITUTIONAL RULES
                                <span className="p-2 bg-amber-50 text-amber-500 rounded-md"><AlertCircle size={16} /></span>
                            </h3>
                            <div className="space-y-4">
                                <div className="p-4 bg-linear-to-br from-indigo-50/60 to-purple-50/30 border border-indigo-100/60 rounded-md">
                                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1.5">LECTURE DURATION</p>
                                    <p className="text-[13px] font-extrabold text-slate-700 flex items-center gap-1.5">
                                        <Clock size={14} className="text-indigo-400" />
                                        {settings.lecture_duration} Mins / Period
                                    </p>
                                </div>
                                <div className="p-4 bg-linear-to-br from-emerald-50/60 to-teal-50/30 border border-emerald-100/60 rounded-md">
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1.5">FIRST BELL</p>
                                    <p className="text-[13px] font-extrabold text-slate-700 flex items-center gap-1.5">
                                        <CalendarDays size={14} className="text-emerald-400" />
                                        {settings.first_lecture_start} AM
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Content: Timetable Matrix or Settings */}
                <div className="lg:col-span-3">
                    {view === 'settings' ? (
                        <div className="bg-white rounded-md border border-black p-8 animate-in fade-in duration-500 print:hidden">
                            <div className="flex items-center justify-between border-b border-black pb-4 mb-8">
                                <h3 className="text-[16px] font-black text-[#001736] uppercase tracking-widest flex items-center gap-2">
                                    <Settings className="w-5 h-5 text-[#FFB606]" />
                                    Timetable Configuration Dashboard
                                </h3>
                                <button
                                    onClick={() => setView('grid')}
                                    className="p-2 hover:bg-slate-50 border border-transparent hover:border-black rounded-none transition-all"
                                    title="Close Settings"
                                >
                                    <X className="w-5 h-5 text-[#001736]" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-8">
                                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Clock size={14} /> School Working Hours & Durations
                                    </h4>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2 col-span-2 md:col-span-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">First Lecture Start</label>
                                            <input
                                                type="time"
                                                value={settings.first_lecture_start}
                                                onChange={(e) => setSettings({ ...settings, first_lecture_start: e.target.value })}
                                                className="w-full rounded-md px-4 py-3 border border-black text-[13px] font-bold outline-none focus:bg-slate-50"
                                            />
                                        </div>
                                        <div className="space-y-2 col-span-2 md:col-span-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Lecture Duration (Min)</label>
                                            <input
                                                type="number"
                                                value={settings.lecture_duration || ""}
                                                onChange={(e) => setSettings({ ...settings, lecture_duration: e.target.value === "" ? "" : parseInt(e.target.value) })}
                                                className="w-full rounded-md px-4 py-3 border border-black text-[13px] font-bold outline-none focus:bg-slate-50"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Assembly Start</label>
                                            <input
                                                type="time"
                                                value={settings.school_start_time}
                                                onChange={(e) => setSettings({ ...settings, school_start_time: e.target.value })}
                                                className="w-full rounded-md px-4 py-3 border border-black text-[13px] font-bold outline-none focus:bg-slate-50"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Dismissal Time</label>
                                            <input
                                                type="time"
                                                value={settings.school_end_time}
                                                onChange={(e) => setSettings({ ...settings, school_end_time: e.target.value })}
                                                className="w-full rounded-md px-4 py-3 border border-black text-[13px] font-bold outline-none focus:bg-slate-50"
                                            />
                                        </div>
                                    </div>

                                </div>

                                <div className="space-y-8">
                                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Calendar size={14} /> Institutional Break Intervals
                                    </h4>
                                    <div className="space-y-6">
                                        {settings.recess_slots.map((slot, idx) => (
                                            <div key={idx} className="p-4 border border-slate-100 bg-slate-50/50">
                                                <p className="text-[10px] font-black text-[#001736] uppercase tracking-widest mb-3">{slot.label}</p>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <input
                                                        type="time"
                                                        value={slot.start}
                                                        onChange={(e) => {
                                                            const newSlots = [...settings.recess_slots];
                                                            newSlots[idx].start = e.target.value;
                                                            setSettings({ ...settings, recess_slots: newSlots });
                                                        }}
                                                        className="px-3 rounded-md py-2 border border-black text-[11px] font-bold outline-none focus:bg-white"
                                                    />
                                                    <input
                                                        type="time"
                                                        value={slot.end}
                                                        onChange={(e) => {
                                                            const newSlots = [...settings.recess_slots];
                                                            newSlots[idx].end = e.target.value;
                                                            setSettings({ ...settings, recess_slots: newSlots });
                                                        }}
                                                        className="px-3 rounded-md py-2 border border-black text-[11px] font-bold outline-none focus:bg-white"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-12 pt-8 border-t border-black flex justify-end gap-3">
                                <button
                                    onClick={() => setView('grid')}
                                    className="px-6 py-4 rounded-md bg-white border border-black text-[#001736] text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                                    type="button"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveSettings}
                                    className="px-10 py-4 bg-[#001736] rounded-md text-[#FFB606] text-[11px] font-black uppercase tracking-widest hover:shadow-2xl transition-all flex items-center gap-3"
                                >
                                    <Save size={16} /> Update Settings
                                </button>
                            </div>
                        </div>
                    ) : (
                        (selectedClass || selectedStaff) ? (
                            <div className="space-y-6">
                                <div className="bg-white rounded-md border border-slate-100 px-6 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm print:hidden">
                                    <div>
                                        <h2 className="text-lg font-extrabold text-[#001736] flex items-center gap-2">
                                            {viewContext === 'classroom' ? <BookOpen className="w-5 h-5 text-indigo-500" /> : <UserCheck className="w-5 h-5 text-emerald-500" />}
                                            {viewContext === 'classroom' ? (selectedClass?.class_name ? toRoman(selectedClass.class_name).toUpperCase() : 'N/A') : (selectedStaff?.full_name?.toUpperCase() || 'N/A')} TIMETABLE MATRIX
                                        </h2>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                            {viewContext === 'classroom' ? (
                                                <>Room: {selectedClass?.room_number || 'R101'} &middot; Section: {selectedClass?.section || 'General'}</>
                                            ) : (
                                                <>Faculty Assignment View</>
                                            )}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Audit Synchronized</span>
                                    </div>
                                </div>

                                <InstitutionalTimetable
                                    data={timetableData}
                                    forcedPeriods={matrixLayout.template}
                                    periodTimings={matrixLayout.timings}
                                    readOnly={viewContext === 'staff'}
                                    onSlotClick={handleSlotClick}
                                    printTitle={`${viewContext === 'classroom' ? (selectedClass?.class_name ? toRoman(selectedClass.class_name).toUpperCase() : 'N/A') : (selectedStaff?.full_name?.toUpperCase() || 'N/A')} TIMETABLE MATRIX`}
                                    printSubTitle={`Academic Year: ${years.find(y => y.id == activeYearId)?.year_name || 'N/A'} ${viewContext === 'classroom' ? `| Section: ${selectedClass?.section || 'General'}` : ''}`}
                                />

                                <div className="hidden print:block text-[8px] font-black text-slate-300 uppercase tracking-[0.5em] text-center mt-12">
                                    Grace Integrated ERP &middot; Institutional Academic Ledger
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-md border border-slate-100 shadow-sm h-[450px] flex flex-col items-center justify-center text-slate-400 p-8">
                                <Calendar size={56} className="mb-4 text-indigo-500/20 animate-pulse" />
                                <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest text-center max-w-sm">Select a {viewContext === 'classroom' ? 'classroom' : 'faculty member'} to begin matrix synchronization</p>
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* Assignment Modal */}
            {isSlotModalOpen && (
                <SlotAssignmentModal
                    slot={activeSlot}
                    subjects={classSubjects}
                    teachers={teachers}
                    onClose={() => setIsSlotModalOpen(false)}
                    onSave={handleSaveSlot}
                    onDelete={handleDeleteSlot}
                />
            )}
        </div>
    );
};

const SlotAssignmentModal = ({ slot, subjects, teachers, onClose, onSave, onDelete }) => {
    const [formData, setFormData] = useState({
        day_of_week: slot.day,
        period_number: slot.period,
        subject_name: slot.subject_name || '',
        teacher_id: slot.teacher_id || '',
        is_break: slot.is_break || 0,
        break_label: slot.break_label || '',
        start_time: slot.start_time || '',
        end_time: slot.end_time || ''
    });

    const handleSubjectChange = (e) => {
        const subjectName = e.target.value;
        const assignment = subjects.find(s => s.subject_name === subjectName);
        setFormData(prev => ({
            ...prev,
            subject_name: subjectName,
            teacher_id: assignment?.teacher_id || ''
        }));
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100 flex items-center justify-center p-4 print:hidden">
            <div className="bg-white border border-black w-full max-w-md overflow-hidden shadow-2xl">
                <div className="bg-[#001736] p-4 flex items-center justify-between border-b border-black">
                    <h3 className="text-white text-[12px] font-black uppercase tracking-widest flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#FFB606]" />
                        Assign Period: {slot.period} - {slot.day.toUpperCase()}
                    </h3>
                    <button onClick={onClose} className="text-white opacity-60 hover:opacity-100">&times;</button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex gap-4">
                        <div className="flex-1 space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sync Start</label>
                            <input
                                type="time"
                                value={formData.start_time}
                                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                className="w-full px-4 py-3 border border-slate-200 text-[13px] font-bold focus:border-black outline-none"
                            />
                        </div>
                        <div className="flex-1 space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sync End</label>
                            <input
                                type="time"
                                value={formData.end_time}
                                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                className="w-full px-4 py-3 border border-slate-200 text-[13px] font-bold focus:border-black outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="flex items-center gap-2 cursor-pointer group p-3 bg-slate-50 border border-slate-200">
                            <input
                                type="checkbox"
                                checked={formData.is_break === 1}
                                onChange={(e) => setFormData({ ...formData, is_break: e.target.checked ? 1 : 0 })}
                                className="w-4 h-4 border-black rounded-none"
                            />
                            <span className="text-[11px] font-black text-[#001736] uppercase tracking-widest group-hover:text-amber-600 transition-colors">Mark as Break</span>
                        </label>

                        {!formData.is_break ? (
                            <>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Subject Matrix</label>
                                    <select
                                        value={formData.subject_name}
                                        onChange={handleSubjectChange}
                                        className="w-full px-4 py-3 border border-slate-200 text-[13px] font-bold focus:border-black outline-none"
                                    >
                                        <option value="">Select Subject</option>
                                        {subjects.map(sub => (
                                            <option key={sub.id} value={sub.subject_name}>{sub.subject_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Faculty Assignment</label>
                                    <select
                                        value={formData.teacher_id}
                                        onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                                        className="w-full px-4 py-3 border border-slate-200 text-[13px] font-bold focus:border-black outline-none"
                                    >
                                        <option value="">Select Teacher</option>
                                        {teachers.map(t => (
                                            <option key={t.id} value={t.id}>{t.full_name}</option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Break Description</label>
                                <input
                                    type="text"
                                    placeholder="e.g. LUNCH BREAK"
                                    value={formData.break_label}
                                    onChange={(e) => setFormData({ ...formData, break_label: e.target.value.toUpperCase() })}
                                    className="w-full px-4 py-3 border border-slate-200 text-[13px] font-bold focus:border-black outline-none"
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                        {slot.id && (
                            <button
                                onClick={() => onDelete(slot.id)}
                                className="p-3 border border-red-200 text-red-500 hover:bg-red-50 transition-all rounded-none"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                        <button
                            onClick={() => onSave(formData)}
                            className="flex-1 bg-[#001736] text-[#FFB606] text-[11px] font-black uppercase tracking-widest py-4 hover:shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                            <Save size={16} /> Update Matrix Slot
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimetableManager;

