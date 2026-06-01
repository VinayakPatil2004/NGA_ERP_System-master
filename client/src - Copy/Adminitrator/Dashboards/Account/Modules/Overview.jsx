import React, { useState, useEffect } from 'react';
import WelcomeHeader from '../../../admcomponents/WelcomeHeader';
import { CreditCard, Users, TrendingUp, AlertCircle, Calendar, MessageSquare, ChevronRight, Eye, FileText, Clock, CheckCircle, ShieldCheck } from 'lucide-react';
import StudentProfile from '../../../admpages/StudentProfile';
// import { getAdmissionStats } from '../../../../services/applyAdmissionAPI';

/**
 * Accountant Overview - Strategic Financial & Registry Insight
 * Refined to the 'Simplified Premium' aesthetic with rounded-2xl and 1px borders.
 */
const Overview = () => {
    const [detailView, setDetailView] = useState(null); // 'pending' or null
    const [viewingStudent, setViewingStudent] = useState(null);
    const [stats, setStats] = useState({ total: 0, pending: 0, inReview: 0, approved: 0, paid: 0, enrolled: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // const data = await getAdmissionStats();
                setStats({ total: 0, pending: 0, inReview: 0, approved: 0, paid: 0, enrolled: 0 });
            } catch (error) {
                console.error("Error fetching admission stats:", error);
            }
        };
        fetchStats();
    }, []);

    const pendingStudents = [
        { id: 1, name: "Arjun Verma", grade: "10th A", due: "₹ 5,000", phone: "9876543210", srNo: "SR2026001", section: "A" },
        { id: 2, name: "Isha Patel", grade: "8th B", due: "₹ 12,000", phone: "9876543211", srNo: "SR2026002", section: "B" },
        { id: 3, name: "Karan Singh", grade: "5th C", due: "₹ 3,500", phone: "9876543212", srNo: "SR2026003", section: "C" },
    ];

    const enquiries = [
        { id: 101, name: "Sneha Gupta", gradeInterested: "9th", source: "Website", date: "Today, 10:45 AM" },
        { id: 102, name: "Rajesh Malhotra", gradeInterested: "1st", source: "Walk-in", date: "Yesterday" },
        { id: 103, name: "Anish Kumar", gradeInterested: "11th Science", source: "Social Media", date: "2 days ago" },
    ];

    const calendarEvents = [
        { date: "Mar 25", title: "Term 1 Exams Start", type: "academic" },
        { date: "Mar 28", title: "Admission Walk-in Day", type: "admission" },
        { date: "Apr 02", title: "Financial Year Closing", type: "finance" },
    ];

    if (viewingStudent) {
        return <StudentProfile student={viewingStudent} onBack={() => setViewingStudent(null)} />;
    }

    return (
        <div className='p-4 lg:p-8 space-y-8 min-h-screen bg-[#F8FAFC] font-sans text-left'>
            <WelcomeHeader roleTitle="ACCOUNTANT" />
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Total Applications" 
                    value={stats.total} 
                    trend="All submissions" 
                    icon={FileText} 
                    color="bg-indigo-600" 
                />
                <StatCard 
                    title="Pending Review" 
                    value={stats.pending} 
                    trend="New applications" 
                    icon={Clock} 
                    color="bg-amber-500" 
                />
                <StatCard 
                    title="Verification" 
                    value={stats.inReview} 
                    trend="Academic review" 
                    icon={Eye} 
                    color="bg-rose-500" 
                />
                <StatCard 
                    title="Finalized Access" 
                    value={(stats.approved || 0) + (stats.paid || 0) + (stats.enrolled || 0)} 
                    trend="Approved entries" 
                    icon={CheckCircle} 
                    color="bg-emerald-600" 
                />
            </div>

            {/* Conditional Detail: Pending Fees Students */}
            {detailView === 'pending' && (
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-rose-100 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold text-[#001736] flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-rose-500" />
                            Overdue Registry Reminders
                        </h3>
                        <button onClick={() => setDetailView(null)} className="text-[10px] font-bold text-rose-500 uppercase tracking-widest hover:bg-rose-50 px-4 py-2 rounded-xl transition-all border border-transparent hover:border-rose-100">Dismiss</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {pendingStudents.map(student => (
                            <div key={student.id} className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-rose-200 transition-all flex flex-col items-center text-center group">
                                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center font-bold text-rose-500 text-sm mb-4 border border-slate-100 group-hover:scale-110 transition-transform">
                                    {student.name.charAt(0)}
                                </div>
                                <h4 className="font-bold text-[#001736] mb-1">{student.name}</h4>
                                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-4">{student.grade}</p>
                                <div className="bg-white rounded-xl p-4 w-full border border-slate-100 shadow-sm">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 opacity-60">Pending Dues</p>
                                    <p className="text-lg font-bold text-[#001736] tracking-tighter">{student.due}</p>
                                </div>
                                <button 
                                    onClick={() => setViewingStudent(student)}
                                    className="mt-4 flex items-center gap-2 text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:gap-3 transition-all"
                                >
                                    Review Specification <Eye className="w-3.5 h-3.5 opacity-40" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* New Enquiries List */}
                <div className="lg:col-span-8 bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-[#001736] uppercase tracking-tight">Active Leads</h3>
                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest opacity-60">Latest recruitment insights generated</p>
                        </div>
                        <button className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:bg-indigo-50 px-4 py-2 rounded-xl border border-transparent hover:border-indigo-100 transition-all">Consolidate Records</button>
                    </div>
                    
                    <div className="space-y-3">
                        {enquiries.map(eq => (
                            <div key={eq.id} className="flex items-center justify-between p-5 bg-slate-50/50 rounded-xl hover:bg-white hover:shadow-md transition-all border border-slate-100 group">
                                <div className="flex items-center gap-5">
                                    <div className="w-10 h-10 bg-white border border-slate-200 text-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                        <MessageSquare className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-[#001736] text-[13px] uppercase tracking-tight">{eq.name}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 opacity-60">Candidate for {eq.gradeInterested} • Channel: {eq.source}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{eq.date}</span>
                                    <button className="p-2 border border-transparent hover:border-slate-200 rounded-lg text-slate-300 hover:text-[#001736] transition-all">
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Academic/Admission Calendar */}
                <div className="lg:col-span-4 bg-[#001736] rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden group border border-white/10">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:scale-150 transition-all duration-1000"></div>
                    
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                                <Calendar className="w-4 h-4 text-amber-400" />
                            </div>
                            <h3 className="text-lg font-bold tracking-tight uppercase text-white/80">Key Registry</h3>
                        </div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-white/30">MAR 2026</p>
                    </div>
                    
                    <div className="space-y-6 relative z-10">
                        {calendarEvents.map((event, idx) => (
                            <div key={idx} className="flex gap-5 group/item">
                                <div className="flex flex-col items-center">
                                    <div className={`w-2 h-2 rounded-full mt-1.5 shadow-sm border border-white/20 ${event.type === 'academic' ? 'bg-indigo-400' : event.type === 'admission' ? 'bg-amber-400' : 'bg-emerald-400'}`}></div>
                                    <div className="w-px flex-1 bg-white/5 my-1.5"></div>
                                </div>
                                <div className="pb-4">
                                    <p className="text-xs font-bold text-white group-hover/item:text-amber-400 transition-colors uppercase tracking-widest">{event.date}</p>
                                    <p className="text-[10px] font-medium text-white/40 mt-1 uppercase tracking-tight leading-relaxed">{event.title}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <button className="w-full mt-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all relative z-10 active:scale-[0.98]">
                        Full Timeline Specification
                    </button>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, trend, icon, color, onClick }) => {
    const Icon = icon;
    return (
        <div 
            onClick={onClick}
            className={`p-8 rounded-2xl shadow-sm border border-slate-200 transition-all bg-white relative overflow-hidden group ${onClick ? 'cursor-pointer hover:shadow-lg active:scale-[0.98]' : ''}`}
        >
            <div className="flex items-center justify-between mb-6">
                <div className={`p-4 rounded-xl border border-black/5 shadow-md flex items-center justify-center ${color} text-white group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest leading-none">Live Sync</span>
                </div>
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 leading-none opacity-60">{title}</p>
            <h4 className="text-3xl font-bold text-[#001736] tracking-tighter leading-none mb-1.5">{value?.toLocaleString() || 0}</h4>
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">{trend}</p>
            
            <div className={`absolute bottom-0 right-0 w-20 h-20 rounded-full bg-slate-50 filter blur-3xl -mr-10 -mb-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
        </div>
    );
};

export default Overview;
