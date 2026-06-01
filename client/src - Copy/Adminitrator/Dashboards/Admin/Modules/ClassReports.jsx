import React, { useState, useEffect } from 'react';
import { 
    TrendingUp, TrendingDown, Users, Calendar, 
    ChevronLeft, Download, Filter, Star, AlertCircle,
    BarChart3, PieChart, User
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_BASE = 'http://localhost:5000/api';

const ClassReports = ({ classroom, onBack }) => {
    const [stats, setStats] = useState({
        attendance: 0,
        averagePerformance: 0,
        topStudents: [],
        weakStudents: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReportData = async () => {
            try {
                setLoading(true);
                // In a real scenario, these would be dedicated aggregate endpoints
                // For now, we simulate with existing data logic
                const [attendanceRes, recordsRes] = await Promise.all([
                    axios.get(`${API_BASE}/attendance/classroom/${classroom.id}`),
                    axios.get(`${API_BASE}/academic-records/classroom/${classroom.id}`)
                ]);

                // Calculate Attendance %
                const attendanceData = attendanceRes.data;
                const totalPossible = attendanceData.length;
                const totalPresent = attendanceData.filter(a => a.status === 'present').length;
                const attendancePercentage = totalPossible > 0 ? (totalPresent / totalPossible) * 100 : 0;

                // Process Academic Records for Top/Weak Students
                const records = recordsRes.data;
                const sorted = [...records].sort((a, b) => b.percentage - a.percentage);
                
                setStats({
                    attendance: attendancePercentage.toFixed(1),
                    averagePerformance: (records.reduce((acc, r) => acc + (r.percentage || 0), 0) / (records.length || 1)).toFixed(1),
                    topStudents: sorted.slice(0, 5),
                    weakStudents: sorted.filter(r => r.percentage < 40).slice(0, 5)
                });

            } catch (error) {
                console.error(error);
                toast.error("Failed to load report analytics");
            } finally {
                setLoading(false);
            }
        };

        if (classroom?.id) fetchReportData();
    }, [classroom]);

    if (loading) return (
        <div className="p-20 text-center">
            <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Generating Intelligence Reports...</p>
        </div>
    );

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-10">
                <button onClick={onBack} className="flex items-center gap-2 text-[#001736] font-black text-[10px] uppercase tracking-widest hover:translate-x-[-4px] transition-all">
                    <ChevronLeft className="w-4 h-4" /> Back to Class View
                </button>
                <div className="flex gap-3">
                    <button className="px-6 py-3 bg-white border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-all flex items-center gap-2 shadow-sm">
                        <Download className="w-4 h-4" /> Export PDF
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <ReportMetric label="Avg Attendance" value={`${stats.attendance}%`} icon={Calendar} color="bg-emerald-500" trend="+2.4%" />
                <ReportMetric label="Class Average" value={`${stats.averagePerformance}%`} icon={TrendingUp} color="bg-indigo-500" trend="+5.1%" />
                <ReportMetric label="Total Students" value={classroom.student_count} icon={Users} color="bg-amber-500" />
                <ReportMetric label="Performance Rank" value="#04/12" icon={Star} color="bg-rose-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Performers */}
                <div className="bg-white rounded-5xl shadow-xl overflow-hidden border border-slate-100 flex flex-col">
                    <div className="p-8 border-b border-slate-50 bg-emerald-50/30 flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-black text-[#001736] flex items-center gap-3">
                                <TrendingUp className="w-6 h-6 text-emerald-500" /> Top Performers
                            </h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Highest Academic Achievement</p>
                        </div>
                    </div>
                    <div className="p-8 flex-1">
                        <div className="space-y-4">
                            {stats.topStudents.length === 0 ? (
                                <p className="text-center py-10 text-slate-400 font-bold uppercase tracking-widest text-[10px]">No data available</p>
                            ) : stats.topStudents.map((s, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-3xl group hover:border-emerald-400 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center font-black text-[#001736] shadow-sm border border-slate-100">
                                            #{i+1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-[#001736]">{s.student_name}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{s.student_id_no}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-black text-emerald-600">{s.percentage}%</p>
                                        <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Mastery</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Performance Alerts / Weak Students */}
                <div className="bg-white rounded-5xl shadow-xl overflow-hidden border border-slate-100 flex flex-col">
                    <div className="p-8 border-b border-slate-50 bg-rose-50/30 flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-black text-[#001736] flex items-center gap-3">
                                <AlertCircle className="w-6 h-6 text-rose-500" /> Intervention Required
                            </h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Students Below Threshold (40%)</p>
                        </div>
                    </div>
                    <div className="p-8 flex-1">
                        <div className="space-y-4">
                            {stats.weakStudents.length === 0 ? (
                                <div className="text-center py-10">
                                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Check className="w-8 h-8" />
                                    </div>
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">All students meet baseline standards</p>
                                </div>
                            ) : stats.weakStudents.map((s, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-3xl group hover:border-rose-400 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-rose-500 shadow-sm border border-slate-100">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-[#001736]">{s.student_name}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{s.student_id_no}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-black text-rose-600">{s.percentage}%</p>
                                        <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Needs Review</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ReportMetric = ({ label, value, icon, color, trend }) => {
    const Icon = icon;
    return (
        <div className="bg-white p-8 rounded-4xl border border-slate-100 shadow-sm group hover:shadow-xl transition-all">
            <div className={`w-12 h-12 rounded-2xl ${color} text-white flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-all`}>
                <Icon className="w-6 h-6" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
            <div className="flex items-end justify-between mt-1">
                <p className="text-3xl font-black text-[#001736]">{value}</p>
                {trend && (
                    <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full mb-1">{trend}</span>
                )}
            </div>
        </div>
    );
};

export default ClassReports;
