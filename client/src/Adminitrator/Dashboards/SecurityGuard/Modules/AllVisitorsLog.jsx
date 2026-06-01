import React, { useState, useEffect } from 'react';
import API, { ROOT_URL } from '../../../../services/API';
import { useAcademicYear } from '../../../../context/AcademicYearContext';
import {
    Users,
    Search,
    Filter,
    Calendar,
    User,
    ShieldCheck,
    ChevronRight,
    MapPin,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import ModuleHeader from '../../../admcomponents/ModuleHeader';


const AllVisitorsLog = ({ toggleSidebar }) => {
    const [visitors, setVisitors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const { selectedYear } = useAcademicYear();

    const fetchAllVisitors = React.useCallback(async () => {
        if (!selectedYear) return;
        try {
            setLoading(true);
            // Use standardized API service
            const response = await API.get(`/security/visitors/all-institutional?academic_year_id=${selectedYear.id}`);
            setVisitors(response.data);
        } catch (error) {
            console.error("Error fetching institutional visitors:", error);
        } finally {
            setLoading(false);
        }
    }, [selectedYear]);

    useEffect(() => {
        fetchAllVisitors();
    }, [fetchAllVisitors]);

    const filteredVisitors = (Array.isArray(visitors) ? visitors : []).filter(v => {
        const matchesSearch =
            v.name?.toLowerCase().includes(search.toLowerCase()) ||
            v.staff_name?.toLowerCase().includes(search.toLowerCase()) ||
            v.phone?.includes(search);
        const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [search, statusFilter]);

    const totalPages = Math.ceil(filteredVisitors.length / itemsPerPage);
    const paginatedVisitors = filteredVisitors.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="p-4 lg:p-8 space-y-8 min-h-screen bg-[#F8FAFC]">
            {/* Institutional Header */}
            <ModuleHeader
                title="Global Visitor Registry"
                subTitle="Centralized monitoring of all institutional guest interactions and meeting approvals"
                icon={ShieldCheck}
                toggleSidebar={toggleSidebar}
            />

            {/* Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total Visits', value: visitors.length, color: 'bg-indigo-600', icon: Users },
                    { label: 'Approved', value: visitors.filter(v => v.status === 'approved').length, color: 'bg-emerald-500', icon: CheckCircle2 },
                    { label: 'Pending', value: visitors.filter(v => v.status === 'pending').length, color: 'bg-amber-500', icon: AlertCircle },
                    { label: 'Rejected', value: visitors.filter(v => v.status === 'rejected').length, color: 'bg-rose-500', icon: AlertCircle },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
                        <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center text-white shadow-lg`}>
                            <stat.icon size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                            <h3 className="text-2xl font-black text-[#001736]">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center gap-6">
                <div className="relative w-full lg:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search visitor, staff or phone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm font-bold focus:outline-none focus:border-indigo-400 transition-all uppercase tracking-wider"
                    />
                </div>
                <div className="flex items-center gap-3 overflow-x-auto w-full lg:w-auto">
                    {['all', 'pending', 'approved', 'rejected'].map(s => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border
                                ${statusFilter === s ? 'bg-[#001736] text-white border-[#001736]' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'}`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Visitors Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Visitor Detail</th>
                            <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Meeting With</th>
                            <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Purpose</th>
                            <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Schedule</th>
                            <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                            <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">Registry Synchronizing...</td></tr>
                        ) : filteredVisitors.length === 0 ? (
                            <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">No records found in institutional archive</td></tr>
                        ) : paginatedVisitors.map(v => (
                            <tr key={v.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 group-hover:scale-110 transition-transform">
                                            <img
                                                src={v.photo_url ? (v.photo_url.startsWith('data:') ? v.photo_url : v.photo_url) : 'https://ui-avatars.com/api/?name=' + v.name + '&background=F1F5F9&color=94A3B8'}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-[#001736] uppercase tracking-tight">{v.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 mt-0.5">{v.phone}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
                                            <User size={14} />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-[#001736] uppercase tracking-wide">{v.staff_name}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{v.staff_role || v.staff_designation || 'STAFF'}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-[11px] text-slate-500 font-medium italic max-w-[200px] truncate">"{v.purpose}"</p>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="space-y-1">
                                        <p className="text-[11px] font-bold text-[#001736] flex items-center gap-1.5 uppercase">
                                            <Calendar size={12} className="text-indigo-500" />
                                            {new Date(v.created_at).toLocaleDateString()}
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-400 ml-4.5">
                                            {new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border
                                        ${v.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                            v.status === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                        {v.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors">
                                        <ChevronRight size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Unified Table Pagination Footer */}
                <div className="px-8 py-4 bg-white border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#64748B]">
                        Showing <span className="text-[#001736]">{filteredVisitors.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0}</span> to <span className="text-[#001736]">{Math.min(currentPage * itemsPerPage, filteredVisitors.length)}</span> of <span className="text-[#001736]">{filteredVisitors.length}</span> Records
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 bg-white border border-slate-200 rounded text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            Prev
                        </button>
                        <div className="flex items-center gap-1 px-4">
                            <span className="text-[10px] font-black text-[#001736] uppercase">Page {currentPage} of {totalPages || 1}</span>
                        </div>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="px-4 py-2 bg-white border border-slate-200 rounded text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AllVisitorsLog;
