import React, { useState, useEffect } from 'react';
import API, { ROOT_URL } from '../../../../services/API';
import { toRoman } from '../../../../utils/romanUtils';
import { Users, GraduationCap, Printer, Search, CreditCard, ChevronRight } from 'lucide-react';
import StudentIdCard from '../../../../components/StudentIdCard';
import { useAcademicYear } from '../../../../context/AcademicYearContext';
import { toast } from 'react-toastify';
import ModuleHeader from '../../../admcomponents/ModuleHeader';

const IdCardGenerator = ({ toggleSidebar }) => {
    const [classrooms, setClassrooms] = useState([]);
    const [selectedClassroom, setSelectedClassroom] = useState(null);
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const { selectedYear } = useAcademicYear();

    useEffect(() => {
        const fetchClassrooms = async () => {
            try {
                const res = await API.get('/classrooms', { params: { academic_year_id: selectedYear?.id } });
                setClassrooms(res.data || []);
            } catch (err) {
                console.error(err);
            }
        };
        if (selectedYear) fetchClassrooms();
    }, [selectedYear]);

    const handleClassroomSelect = async (classroom) => {
        setSelectedClassroom(classroom);
        setSelectedStudent(null);
        setLoading(true);
        try {
            const res = await API.get('/attendance/students', {
                params: {
                    classroom_id: classroom.id,
                    date: new Date().toISOString().split('T')[0],
                    academic_year_id: selectedYear?.id
                }
            });
            setStudents(res.data || []);
        } catch {
            toast.error("Failed to load students");
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = students.filter(s =>
        s.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.student_id_no?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-700">
            <ModuleHeader
                title="Identity Matrix"
                subTitle="Institutional Identity Generation System"
                icon={CreditCard}
                toggleSidebar={toggleSidebar}
            >
                <div className="relative group w-full md:w-auto hidden lg:block">
                    <select
                        className="relative w-full sm:w-64 px-6 py-3 bg-white border rounded-md border-black font-black uppercase text-[11px] tracking-widest outline-none transition-all cursor-pointer appearance-none"
                        onChange={(e) => {
                            const cls = classrooms.find(c => c.id === parseInt(e.target.value));
                            if (cls) handleClassroomSelect(cls);
                        }}
                        value={selectedClassroom?.id || ''}
                    >
                        <option value="">Select Classroom</option>
                        {classrooms.map(c => (
                            <option key={c.id} value={c.id}>{c.class_name} {c.section}</option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <ChevronRight className="rotate-90 text-black" size={18} />
                    </div>
                </div>
            </ModuleHeader>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Student List Column */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white border border-slate-300 rounded-md shadow-sm flex flex-col h-[700px] overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center gap-2">
                            <div className="relative group flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="SEARCH REGISTRY..."
                                    className="w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-md font-black uppercase text-[10px] tracking-widest outline-none focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="relative group w-24 sm:w-32 lg:hidden shrink-0">
                                <select
                                    className="relative w-full px-3 py-4 bg-white border rounded-md border-black font-black uppercase text-[10px] tracking-widest outline-none transition-all cursor-pointer appearance-none truncate"
                                    onChange={(e) => {
                                        const cls = classrooms.find(c => c.id === parseInt(e.target.value));
                                        if (cls) handleClassroomSelect(cls);
                                    }}
                                    value={selectedClassroom?.id || ''}
                                >
                                    <option value="">Class</option>
                                    {classrooms.map(c => (
                                        <option key={c.id} value={c.id}>{c.class_name} {c.section}</option>
                                    ))}
                                </select>
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <ChevronRight className="rotate-90 text-black" size={14} />
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2 bg-white">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-full gap-4 opacity-60">
                                    <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin"></div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Accessing Records...</p>
                                </div>
                            ) : filteredStudents.length > 0 ? (
                                filteredStudents.map((s) => (
                                    <button
                                        key={s.student_id}
                                        onClick={() => setSelectedStudent(s)}
                                        className={`w-full flex items-center justify-between p-4 rounded-md transition-all group relative overflow-hidden border ${selectedStudent?.student_id === s.student_id ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'}`}
                                    >
                                        <div className="text-left relative z-10">
                                            <p className={`text-[12px] font-black uppercase truncate max-w-[200px] ${selectedStudent?.student_id === s.student_id ? 'text-indigo-700' : 'text-[#001736]'}`}>{s.student_name}</p>
                                            <p className={`text-[9px] font-bold uppercase tracking-widest mt-1 flex items-center gap-2 ${selectedStudent?.student_id === s.student_id ? 'text-indigo-500' : 'text-slate-400'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${selectedStudent?.student_id === s.student_id ? 'bg-indigo-500' : 'bg-slate-300'}`}></span>
                                                ID: {s.student_id_no}
                                            </p>
                                        </div>
                                        <ChevronRight size={18} className={`transition-transform relative z-10 ${selectedStudent?.student_id === s.student_id ? 'text-indigo-500 translate-x-1' : 'text-slate-300 group-hover:translate-x-1 group-hover:text-slate-400'}`} />
                                    </button>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full gap-4 opacity-40">
                                    <Users size={40} className="text-slate-400" strokeWidth={1.5} />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-center text-slate-500">No matching<br />records found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ID Card Preview Column */}
                <div className="lg:col-span-8">
                    {selectedStudent ? (
                        <div className="space-y-6">
                            <div className="bg-white border border-slate-200 rounded-md p-6 flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-md text-indigo-500">
                                        <CreditCard size={24} strokeWidth={2} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-[#001736] uppercase tracking-tighter">Card Preview</h3>
                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Live visualization of Student ID Card</p>
                                    </div>
                                </div>
                            </div>

                            <StudentIdCard student={{
                                ...selectedStudent,
                                // Map attendance specific fields to general student fields expected by ID Card
                                student_name: selectedStudent.student_name,
                                student_id_no: selectedStudent.student_id_no,
                                class_name: selectedClassroom?.class_name || (selectedStudent.current_grade ? toRoman(selectedStudent.current_grade).toUpperCase() : '---'),
                                section: selectedClassroom?.section || selectedStudent.section || 'A',
                                dob: selectedStudent.dob || '---',
                                address: selectedStudent.address || 'Nashik, Maharashtra',
                                father_mobile: selectedStudent.father_mobile || '---',
                                student_photo: selectedStudent.student_photo
                                    ? (selectedStudent.student_photo.startsWith('/') ? selectedStudent.student_photo : `/${selectedStudent.student_photo}`).replace(/\\/g, '/')
                                    : null
                            }} />
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-200 rounded-3xl h-full min-h-[500px] flex flex-col items-center justify-center p-12 gap-6 opacity-60 shadow-sm">
                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                                <Printer size={40} strokeWidth={1.5} />
                            </div>
                            <div className="text-center">
                                <p className="text-xl font-black text-[#001736] uppercase tracking-tighter">No Student Selected</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 leading-relaxed">Select a student from the registry to<br />begin institutional card generation</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default IdCardGenerator;
