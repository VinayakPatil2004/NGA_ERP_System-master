import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, Printer, Download, CalendarDays, BookOpen, User } from 'lucide-react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import InstitutionalTimetable from '../../../admcomponents/InstitutionalTimetable';
import ExamTimetableManager from '../../Admin/Modules/ExamManagement/ExamTimetableManager';
import { useAcademicYear } from '../../../../context/AcademicYearContext';
import * as timetableAPI from '../../../../services/timetableAPI';
import * as ExamAPI from '../../../../services/examAPI';
import { useAuth } from '../../../../context/AuthContext';
import { toRoman } from '../../../../utils/romanUtils';
import { toast } from 'react-hot-toast';

const Timetable = ({ toggleSidebar }) => {
    const { user } = useAuth();
    const { selectedYear: globalYear } = useAcademicYear();
    const selectedYear = globalYear?.id;
    const [timetableData, setTimetableData] = useState([]);
    const [timetableType, setTimetableType] = useState('regular');
    const [exams, setExams] = useState([]);
    const [selectedExam, setSelectedExam] = useState(null);
    const [settings, setSettings] = useState({
        lecture_duration: 35,
        first_lecture_start: '08:15',
        recess_slots: [
            { label: 'Assembly', start: '08:05', end: '08:15', period: 'ASSEMBLY' },
            { label: 'Short Recess', start: '10:00', end: '10:10', period: 'SHORT_RECESS' },
            { label: 'Long Recess', start: '11:55', end: '12:15', period: 'LONG_RECESS' }
        ]
    });

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

    const fetchTimetableSettings = useCallback(async (yearId) => {
        try {
            const data = await timetableAPI.getSettings(yearId);
            if (data && data.school_start_time) {
                setSettings(prev => ({
                    ...prev,
                }));
            }
        } catch (err) {
            console.error(err);
        }
    }, []);

    const fetchTeacherTimetable = useCallback(async () => {
        if (!user?.id || !selectedYear) return;
        try {
            const data = await timetableAPI.getTeacherTimetable(user.id, selectedYear);
            const processedData = data?.map(slot => ({
                ...slot,
                subject_name: slot.subject_name.includes(' ') ? 
                    `${toRoman(slot.subject_name.split(' ')[0])} ${slot.subject_name.split(' ').slice(1).join(' ')}` : 
                    slot.subject_name
            }));
            setTimetableData(processedData || []);
        } catch {
            toast.error("Failed to load your schedule");
        }
    }, [user, selectedYear]);

    useEffect(() => {
        const loadData = async () => {
            if (selectedYear) {
                await fetchTimetableSettings(selectedYear);
                const allExams = await ExamAPI.getAllExams(selectedYear);
                setExams(allExams || []);
                if (user?.id) {
                    await fetchTeacherTimetable();
                }
            }
        };
        loadData();
    }, [selectedYear, user?.id, fetchTimetableSettings, fetchTeacherTimetable]);

    return (
        <div className="p-4 lg:p-8 bg-[#F8FAFC] min-h-screen font-sans text-left pb-24">
            <div className="print:hidden">
                <ModuleHeader
                    title="Faculty Timetable Matrix"
                    subTitle="Identity-Synchronized Workload Ledger"
                    icon={Calendar}
                    toggleSidebar={toggleSidebar}
                />
            </div>

            <Motion.div className="mt-8 max-w-7xl mx-auto">
                <div className="bg-white border border-black p-4 mb-6 flex items-center justify-between print:mb-8">
                    <div>
                        <h2 className="text-sm font-black text-[#001736] uppercase tracking-widest flex items-center gap-2">
                            <Clock className="w-4 h-4 text-[#FFB606] print:hidden" />
                            FACULTY: {user?.full_name?.toUpperCase() || "STAFF MEMBER"}
                        </h2>
                        <p className="hidden print:block text-[10px] font-bold text-slate-400 uppercase mt-1">
                             Academic Session: {globalYear?.year_name || "N/A"}
                        </p>
                    </div>
                        <button 
                            onClick={handlePrint}
                            className="px-6 py-2 bg-[#001736] text-[#FFB606] text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:shadow-lg transition-all"
                        >
                            <Download size={14} /> Download PDF Ledger
                        </button>
                    </div>

                <div className="flex mb-6 p-1 bg-gray-100 rounded-xl w-fit border border-gray-200">
                    <button
                        onClick={() => setTimetableType('regular')}
                        className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${timetableType === 'regular' ? 'bg-white shadow text-primary font-black uppercase tracking-widest' : 'text-gray-500 hover:text-primary uppercase tracking-widest'}`}
                    >
                        Standard Matrix
                    </button>
                    <button
                        onClick={() => setTimetableType('exam')}
                        className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${timetableType === 'exam' ? 'bg-white shadow text-primary font-black uppercase tracking-widest' : 'text-gray-500 hover:text-primary uppercase tracking-widest'}`}
                    >
                        Examination Matrix
                    </button>
                </div>

                {timetableType === 'regular' ? (
                    <InstitutionalTimetable 
                        data={timetableData} 
                        forcedPeriods={matrixLayout.template}
                        periodTimings={matrixLayout.timings}
                        readOnly={true} 
                    />
                ) : (
                    <div className="bg-white border border-black p-6 flex flex-col items-center">
                        <div className="w-full">
                            <h3 className="text-xl font-black text-primary uppercase mb-6">Select an Exam to Manage Schedule</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {exams.length > 0 ? exams.map(exam => (
                                    <div key={exam.id} className="p-6 border border-gray-200 hover:border-secondary hover:shadow-lg transition-all flex flex-col gap-4 cursor-pointer" onClick={() => setSelectedExam(exam)}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-black text-primary">{exam.exam_name}</h4>
                                                <span className="text-[10px] font-bold uppercase text-gray-400">{exam.exam_type}</span>
                                            </div>
                                            <Calendar className="w-5 h-5 text-secondary" />
                                        </div>
                                        <div className="text-xs font-bold text-gray-500">
                                            {new Date(exam.start_date).toLocaleDateString()} - {new Date(exam.end_date).toLocaleDateString()}
                                        </div>
                                        <button className="w-full py-2 bg-[#001736] text-[#FFB606] font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all mt-auto">Manage Timetable</button>
                                    </div>
                                )) : (
                                    <div className="col-span-full text-center py-12 text-gray-400 font-bold uppercase tracking-widest text-xs">No exams scheduled for this academic year</div>
                                )}
                            </div>
                        </div>
                        {selectedExam && (
                            <ExamTimetableManager 
                                exam={selectedExam}
                                readOnly={false}
                                onClose={() => setSelectedExam(null)}
                            />
                        )}
                    </div>
                )}
                
                <div className="hidden print:block text-[8px] font-black text-slate-300 uppercase tracking-[0.5em] text-center mt-12">
                    Grace Integrated ERP &middot; Institutional Faculty Ledger
                </div>
            </Motion.div>
            
            <div className="mt-8 flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest px-4 print:hidden">
                <p>NGA ERP SYSTEM - AUDIT SYNCHRONIZED</p>
                <p>Generation Date: {new Date().toLocaleDateString()}</p>
            </div>
        </div>
    );
};

export default Timetable;