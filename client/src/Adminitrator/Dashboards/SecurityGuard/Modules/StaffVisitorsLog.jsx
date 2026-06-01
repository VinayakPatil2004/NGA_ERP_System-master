import React, { useState, useEffect } from 'react';
import API, { ROOT_URL } from '../../../../services/API';
import { toast } from 'react-toastify';
import { useAcademicYear } from '../../../../context/AcademicYearContext';
import { 
    Users, 
    Search, 
    Filter, 
    Clock, 
    User, 
    Phone, 
    CheckCircle, 
    XCircle,
    Timer,
    MessageSquare,
    Eye
} from 'lucide-react';

const StaffVisitorsLog = () => {
    const [visitors, setVisitors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const { selectedYear } = useAcademicYear();

    const fetchMyVisitors = React.useCallback(async () => {
        if (!selectedYear) return;
        try {
            setLoading(true);
            const response = await API.get(`/security/visitors/all-my?academic_year_id=${selectedYear.id}`);
            setVisitors(response.data);
        } catch (error) {
            console.error("Error fetching visitors:", error);
        } finally {
            setLoading(false);
        }
    }, [selectedYear]);

    useEffect(() => {
        fetchMyVisitors();
    }, [fetchMyVisitors]);

    const handleApproval = async (visitorId, status) => {
        try {
            await API.put(`/security/visitors/${visitorId}/approve`, { status });
            toast.success(`Visitor ${status} successfully`);
            fetchMyVisitors();
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const filteredVisitors = (Array.isArray(visitors) ? visitors : []).filter(v => {
        const matchesSearch = v.name?.toLowerCase().includes(search.toLowerCase()) || v.phone?.includes(search);
        const matchesFilter = filter === 'all' || v.status === filter;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="p-4 lg:p-8 space-y-8 min-h-screen bg-[#F8FAFC] font-sans text-left">
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-bold text-[#001736] tracking-tight uppercase">My Visitors Log</h2>
                    <p className="text-sm font-medium text-slate-400 mt-1 uppercase tracking-widest">Manage people meeting you</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-amber-50 border border-amber-100 px-6 py-3 rounded-xl flex items-center gap-3">
                        <Timer className="w-4 h-4 text-amber-600" />
                        <div>
                            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Pending</p>
                            <p className="text-sm font-bold text-amber-700">{visitors.filter(v => v.status === 'pending').length}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-6">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Search by name or phone..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all placeholder:text-slate-400"
                    />
                </div>
                
                <div className="flex-1 flex items-center gap-3 overflow-x-auto pb-2 md:pb-0">
                    <Filter className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                    {['all', 'pending', 'approved', 'rejected'].map(type => (
                        <button 
                            key={type}
                            onClick={() => setFilter(type)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap
                                ${filter === type 
                                    ? 'bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm shadow-indigo-100' 
                                    : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100'}`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-12 text-center text-slate-400 italic">Loading visitors...</div>
                ) : filteredVisitors.length === 0 ? (
                    <div className="col-span-full py-12 text-center">
                         <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4 border border-slate-100">
                            <Users className="w-8 h-8 text-slate-200" />
                        </div>
                        <p className="text-sm font-medium text-slate-400">No visitors found</p>
                    </div>
                ) : filteredVisitors.map(v => (
                    <div key={v.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-lg transition-all group">
                        <div className="aspect-video relative overflow-hidden bg-slate-100">
                            <img 
                                alt={v.name} 
                                src={v.photo_url ? (v.photo_url.startsWith('data:') ? v.photo_url : v.photo_url) : 'https://ui-avatars.com/api/?name=' + v.name + '&background=F1F5F9&color=94A3B8'} 
                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                            <div className={`absolute top-4 right-4 px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border backdrop-blur-md shadow-sm
                                ${v.status === 'approved' ? 'bg-emerald-500/90 text-white border-emerald-400' : 
                                  v.status === 'rejected' ? 'bg-rose-500/90 text-white border-rose-400' : 
                                  'bg-amber-500/90 text-white border-amber-400'}`}>
                                {v.status}
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="text-lg font-bold text-[#001736] tracking-tight">{v.name}</h4>
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mt-1">
                                        <Phone className="w-3 h-3" />
                                        {v.phone}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time</p>
                                    <p className="text-xs font-bold text-[#001736]">{new Date(v.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    Purpose
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed italic">"{v.purpose}"</p>
                            </div>

                            {v.status === 'pending' ? (
                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <button 
                                        onClick={() => handleApproval(v.id, 'approved')}
                                        className="flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md shadow-emerald-900/10"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        Approve
                                    </button>
                                    <button 
                                        onClick={() => handleApproval(v.id, 'rejected')}
                                        className="flex items-center justify-center gap-2 bg-white text-rose-600 border border-rose-100 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-rose-50 transition-all"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        Reject
                                    </button>
                                </div>
                            ) : (
                                <button className="w-full bg-slate-50 text-slate-400 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 cursor-default border border-slate-100">
                                    <Eye className="w-4 h-4" />
                                    View Details
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StaffVisitorsLog;
