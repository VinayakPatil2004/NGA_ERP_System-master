import React, { useState, useEffect, useCallback } from 'react';
import { 
    X, Save, Calendar, Clock, MapPin, 
    BookOpen, Search, ChevronRight, AlertCircle,
    CheckCircle2
} from 'lucide-react';
import { toast } from 'react-toastify';
import * as ExamAPI from '../../../../../services/examAPI';
import * as ClassroomAPI from '../../../../../services/classroomAPI';

const ExamTimetableManager = ({ exam, onClose, readOnly = false, defaultClassroom = null }) => {
    const [classrooms, setClassrooms] = useState([]);
    const [selectedClassroom, setSelectedClassroom] = useState(null);
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    const handleClassroomSelect = useCallback(async (classroom) => {
        setLoading(true);
        setSelectedClassroom(classroom);
        try {
            // 1. Fetch existing timetable for this exam and classroom
            const existing = await ExamAPI.getExamTimetable(exam.id, classroom.id);
            
            if (readOnly) {
                // For read-only mode, just show existing scheduled exams
                setSchedule(existing.map(e => ({
                    subject_id: e.subject_id,
                    subject_name: e.subject_name,
                    exam_date: e.exam_date.split('T')[0],
                    start_time: e.start_time,
                    end_time: e.end_time,
                    room_number: e.room_number
                })));
            } else {
                // 2. Fetch Subjects for this classroom for editing mode
                const classSubjects = await ClassroomAPI.getClassSubjects(classroom.id);
                
                // 3. Merge or Initialize
                const initialSchedule = classSubjects.map(subject => {
                    const existingEntry = existing.find(e => e.subject_name === subject.subject_name);
                    return {
                        subject_id: subject.id,
                        subject_name: subject.subject_name,
                        exam_date: existingEntry ? existingEntry.exam_date.split('T')[0] : '',
                        start_time: existingEntry ? existingEntry.start_time : '',
                        end_time: existingEntry ? existingEntry.end_time : '',
                        room_number: existingEntry ? existingEntry.room_number : classroom.room_number || ''
                    };
                });
                setSchedule(initialSchedule);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load schedule details");
        } finally {
            setLoading(false);
        }
    }, [exam.id, readOnly]);

    useEffect(() => {
        if (defaultClassroom) {
            setClassrooms([defaultClassroom]);
            handleClassroomSelect(defaultClassroom);
            setInitialLoading(false);
            return;
        }
        const fetchClassrooms = async () => {
            try {
                const data = await ClassroomAPI.getClassrooms(exam.academic_year_id);
                setClassrooms(data);
            } catch {
                toast.error("Failed to load classrooms");
            } finally {
                setInitialLoading(false);
            }
        };
        fetchClassrooms();
    }, [exam.academic_year_id, defaultClassroom, handleClassroomSelect]);

    const handleScheduleChange = (idx, field, value) => {
        const updated = [...schedule];
        updated[idx][field] = value;
        setSchedule(updated);
    };

    const handleSave = async () => {
        try {
            // Validation
            const incomplete = schedule.some(s => !s.exam_date || !s.start_time || !s.end_time);
            if (incomplete) {
                toast.warning("Please fill in all date and time slots");
                return;
            }

            await ExamAPI.saveExamTimetable({
                exam_id: exam.id,
                classroom_id: selectedClassroom.id,
                schedule: schedule
            });
            toast.success(`Timetable updated for ${selectedClassroom.class_name}`);
            onClose();
        } catch {
            toast.error("Failed to save timetable");
        }
    };

    if (initialLoading) return null;

    return (
        <div className="fixed inset-0 bg-primary/80 backdrop-blur-sm z-110 flex items-center justify-center p-0 lg:p-4">
            <div className="bg-white w-full h-full lg:h-[85vh] lg:max-w-6xl lg:rounded-md shadow-2xl overflow-hidden animate-in zoom-in duration-200 flex flex-col lg:flex-row">
                
                {/* Sidebar: Classroom Selection */}
                {!defaultClassroom && (
                    <div className={`w-full lg:w-1/3 border-r border-slate-100 flex flex-col bg-slate-50/50 ${selectedClassroom ? 'hidden lg:flex' : 'flex'}`}>
                    <div className="p-6 border-b border-slate-100 bg-white flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-black text-primary uppercase leading-tight">Exam Schedule</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Select Classroom to begin</p>
                        </div>
                        <button onClick={onClose} className="lg:hidden p-2 hover:bg-slate-100 rounded-md transition-all">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {classrooms.map(cls => (
                            <button
                                key={cls.id}
                                onClick={() => handleClassroomSelect(cls)}
                                className={`w-full flex items-center justify-between p-4 rounded-md transition-all group
                                    ${selectedClassroom?.id === cls.id 
                                        ? 'bg-[#001736] text-white! shadow-lg scale-[1.02]' 
                                        : 'bg-white border border-slate-200 text-slate-700! hover:border-indigo-300'}
                                `}
                            >
                                <div className="text-left">
                                    <h4 className={`font-black text-sm uppercase ${selectedClassroom?.id === cls.id ? 'text-white!' : 'text-slate-800!'}`}>
                                        {cls.class_name}
                                    </h4>
                                    <p className={`text-[9px] font-bold uppercase tracking-widest ${selectedClassroom?.id === cls.id ? 'text-slate-300!' : 'text-slate-500!'}`}>
                                        Capacity: {cls.capacity}
                                    </p>
                                </div>
                                <ChevronRight size={18} className={selectedClassroom?.id === cls.id ? 'text-amber-400' : 'text-slate-300 transition-transform group-hover:translate-x-1'} />
                            </button>
                        ))}
                    </div>
                    </div>
                )}

                {/* Main Content: Timetable Editor */}
                <div className={`flex-1 flex flex-col bg-white ${!selectedClassroom ? 'hidden lg:flex' : 'flex'}`}>
                    <div className="p-4 lg:p-6 border-b border-slate-100 flex items-center gap-4">
                        <button 
                            onClick={() => setSelectedClassroom(null)}
                            className="lg:hidden p-2 bg-slate-100 rounded-md text-slate-600"
                        >
                            <Search size={18} />
                        </button>
                        <div className="flex-1">
                            {selectedClassroom ? (
                                <>
                                    <h3 className="text-sm lg:text-lg font-black text-primary uppercase truncate">{readOnly ? 'Exam Schedule:' : 'Scheduling:'} {selectedClassroom.class_name}</h3>
                                    <p className="text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{exam.exam_name}</p>
                                </>
                            ) : (
                                <h3 className="text-lg font-black text-slate-300 uppercase">Select a classroom</h3>
                            )}
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-md transition-all">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 lg:p-6">
                        {!selectedClassroom ? (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                                <Search size={64} className="text-slate-200 mb-4" />
                                <p className="font-bold text-slate-400">Please choose a class from the left sidebar <br className="hidden lg:block"/> to set their exam dates.</p>
                            </div>
                        ) : loading ? (
                            <div className="h-full flex items-center justify-center">
                                <AlertCircle className="animate-spin text-indigo-500" />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {schedule.length === 0 ? (
                                    <p className="text-center py-10 text-slate-400 font-bold">No subjects mapped to this classroom.</p>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-2 bg-slate-50 rounded-md">
                                            <div className="col-span-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject</div>
                                            <div className="col-span-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Exam Date</div>
                                            <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Start</div>
                                            <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">End</div>
                                            <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Room</div>
                                        </div>
                                        {schedule.map((row, idx) => (
                                            <div key={idx} className="flex flex-col lg:grid lg:grid-cols-12 gap-3 lg:gap-4 lg:items-center p-4 bg-white border border-slate-100 rounded-md hover:border-indigo-100 hover:bg-indigo-50/10 transition-all">
                                                <div className="lg:col-span-3 flex items-center gap-2">
                                                    <BookOpen size={16} className="text-indigo-500 shrink-0" />
                                                    <span className="font-black text-primary text-xs uppercase">{row.subject_name}</span>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 lg:contents gap-3">
                                                    <div className="lg:col-span-3 space-y-1">
                                                        <label className="lg:hidden text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Date</label>
                                                        <input 
                                                            type="date"
                                                            value={row.exam_date}
                                                            onChange={e => handleScheduleChange(idx, 'exam_date', e.target.value)}
                                                            readOnly={readOnly}
                                                            className={`w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-[11px] font-bold outline-none focus:border-indigo-500 ${readOnly ? 'opacity-80 bg-transparent border-transparent' : ''}`}
                                                        />
                                                    </div>
                                                    <div className="lg:col-span-2 space-y-1">
                                                        <label className="lg:hidden text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Start</label>
                                                        <input 
                                                            type="time"
                                                            value={row.start_time}
                                                            onChange={e => handleScheduleChange(idx, 'start_time', e.target.value)}
                                                            readOnly={readOnly}
                                                            className={`w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-[11px] font-bold outline-none focus:border-indigo-500 ${readOnly ? 'opacity-80 bg-transparent border-transparent' : ''}`}
                                                        />
                                                    </div>
                                                    <div className="lg:col-span-2 space-y-1">
                                                        <label className="lg:hidden text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">End</label>
                                                        <input 
                                                            type="time"
                                                            value={row.end_time}
                                                            onChange={e => handleScheduleChange(idx, 'end_time', e.target.value)}
                                                            readOnly={readOnly}
                                                            className={`w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-[11px] font-bold outline-none focus:border-indigo-500 ${readOnly ? 'opacity-80 bg-transparent border-transparent' : ''}`}
                                                        />
                                                    </div>
                                                    <div className="lg:col-span-2 space-y-1">
                                                        <label className="lg:hidden text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Room</label>
                                                        <input 
                                                            type="text"
                                                            placeholder="Room"
                                                            value={row.room_number}
                                                            onChange={e => handleScheduleChange(idx, 'room_number', e.target.value)}
                                                            readOnly={readOnly}
                                                            className={`w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-[11px] font-bold outline-none focus:border-indigo-500 lg:text-center ${readOnly ? 'opacity-80 bg-transparent border-transparent' : ''}`}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="p-4 lg:p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-3">
                        <button 
                            onClick={onClose}
                            className={`${readOnly ? 'w-full px-8' : 'hidden sm:block px-8'} py-3.5 bg-white border border-slate-200 text-slate-500 rounded-md font-black text-xs uppercase tracking-widest hover:bg-white transition-all shadow-sm`}
                        >
                            {readOnly ? 'Close View' : 'Discard'}
                        </button>
                        {!readOnly && (
                            <button 
                                onClick={handleSave}
                                disabled={!selectedClassroom || schedule.length === 0}
                                className="flex-1 py-4 bg-[#001736] text-amber-400 rounded-md font-black text-xs uppercase tracking-[0.2em] hover:bg-black shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                            >
                                <Save size={18} /> Sync Schedule
                            </button>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ExamTimetableManager;
