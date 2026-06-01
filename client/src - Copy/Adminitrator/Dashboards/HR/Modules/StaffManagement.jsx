import React, { useState, useEffect, useCallback } from 'react';
import {
    Users, Plus, Search, Filter, Eye, Trash2,
    ChevronLeft, ChevronRight, ShieldCheck, ShieldAlert,
    RefreshCw, Calendar, GraduationCap, Briefcase, Phone
} from 'lucide-react';
import axios from 'axios';
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import DataTable from '../../../admcomponents/DataTable';
import { toast } from 'react-toastify';
import StafOnboardingForm from '../../../admpages/StafOnboardingForm';
import ViewStafProfile from '../../../admpages/ViewStafProfile';

/**
 * StaffManagement - Complete Staff CRUD Module for HR
 * Uses shared DataTable component for consistent institutional styling.
 */
const StaffManagement = ({ toggleSidebar }) => {
    const [view, setView] = useState('list'); // 'list' | 'onboard' | 'profile'
    const [staffList, setStaffList] = useState([]);
    const [filteredStaff, setFilteredStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [academicYear, setAcademicYear] = useState('');
    const [availableYears, setAvailableYears] = useState([]);
    const itemsPerPage = 10;

    // ── Fetch available academic years ──────────────────────────────────────
    const fetchDropdownYears = useCallback(async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/academic-years/all');
            setAvailableYears(response.data);
            const active = response.data.find(y => y.is_active);
            if (active && !academicYear) setAcademicYear(active.year_name);
        } catch {
            console.error('Failed to fetch academic years');
        }
    }, [academicYear]);

    // ── Fetch all staff ─────────────────────────────────────────────────────
    const fetchStaff = useCallback(async () => {
        try {
            setLoading(true);
            const params = academicYear ? { academic_year: academicYear } : {};
            const res = await axios.get('http://localhost:5000/api/staff/all', { params });
            setStaffList(res.data || []);
        } catch {
            toast.error('Failed to fetch staff data');
        } finally {
            setLoading(false);
        }
    }, [academicYear]);

    useEffect(() => { fetchDropdownYears(); }, [fetchDropdownYears]);
    useEffect(() => { if (academicYear) fetchStaff(); }, [fetchStaff, academicYear]);

    // ── Client-side filtering ───────────────────────────────────────────────
    useEffect(() => {
        let result = [...staffList];
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(s =>
                s.full_name?.toLowerCase().includes(q) ||
                s.employee_id?.toLowerCase().includes(q) ||
                s.email?.toLowerCase().includes(q) ||
                s.mobile?.includes(q)
            );
        }
        if (filterType !== 'all') result = result.filter(s => s.staff_type === filterType);
        if (filterStatus !== 'all') result = result.filter(s => s.status === filterStatus);
        setFilteredStaff(result);
        setCurrentPage(1);
    }, [staffList, searchQuery, filterType, filterStatus]);

    // ── Actions ─────────────────────────────────────────────────────────────
    const handleStatusToggle = async (id, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        try {
            await axios.put(`http://localhost:5000/api/staff/status/${id}`, { status: newStatus });
            toast.success(`Staff marked as ${newStatus}`);
            fetchStaff();
        } catch {
            toast.error('Failed to update status');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('CRITICAL: Permanently Delete this staff record?')) return;
        try {
            await axios.delete(`http://localhost:5000/api/staff/${id}`);
            toast.success('Staff record Deleted');
            fetchStaff();
        } catch {
            toast.error('Failed to delete staff');
        }
    };

    const handleViewProfile = async (staffItem) => {
        try {
            const res = await axios.get(`http://localhost:5000/api/staff/${staffItem.id}`);
            setSelectedStaff(res.data || staffItem);
        } catch {
            setSelectedStaff(staffItem);
        }
        setView('profile');
    };

    // ── Pagination ──────────────────────────────────────────────────────────
    const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);
    const paginatedStaff = filteredStaff.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const stats = {
        total: staffList.length,
        active: staffList.filter(s => s.status === 'active').length,
        teaching: staffList.filter(s => s.staff_type === 'teaching').length,
        nonTeaching: staffList.filter(s => s.staff_type === 'non-teaching').length,
    };

    // ── Sub-views ───────────────────────────────────────────────────────────
    if (view === 'onboard') {
        return (
            <StafOnboardingForm
                academicYear={academicYear}
                onClose={() => { setView('list'); setSelectedStaff(null); }}
                onRefresh={fetchStaff}
                isEdit={!!selectedStaff}
                initialData={selectedStaff}
            />
        );
    }

    if (view === 'profile' && selectedStaff) {
        return (
            <ViewStafProfile
                staff={selectedStaff}
                onClose={() => { setView('list'); setSelectedStaff(null); }}
                onEdit={() => setView('onboard')}
                toggleSidebar={toggleSidebar}
            />
        );
    }

    // ── Main List View ──────────────────────────────────────────────────────
    return (
        <div className="p-4 lg:p-8 space-y-6 min-h-screen bg-[#F8FAFC]">

            {/* Header */}
            <ModuleHeader
                title="Staff Management"
                subTitle="Personnel Directory & Operations"
                icon={Users}
                toggleSidebar={toggleSidebar}
                showSearch={false}
            >
                <div className="flex items-center gap-2 lg:gap-3">
                    {/* Academic Year */}
                    {availableYears.length > 0 && (
                        <div className="hidden lg:flex items-center bg-white/5 border border-white/10 px-4 py-3 rounded-2xl hover:border-amber-400/30 transition-all group/yr">
                            <Calendar className="w-4 h-4 text-amber-400 mr-3 group-hover/yr:scale-110 transition-transform" />
                            <select
                                className="bg-transparent text-white text-[11px] font-black uppercase tracking-widest outline-none cursor-pointer"
                                value={academicYear}
                                onChange={(e) => setAcademicYear(e.target.value)}
                            >
                                {availableYears.map(y => (
                                    <option key={y.id} value={y.year_name} className="bg-[#001736] text-white">{y.year_name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    {/* Refresh */}
                    <button onClick={fetchStaff} className="p-3 bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl text-amber-400 hover:bg-white/10 transition-all shadow-2xl active:rotate-180 duration-700 shrink-0" title="Refresh">
                        <RefreshCw size={18} className="opacity-80" />
                    </button>
                    {/* ADD PERSONNEL */}
                    <button
                        onClick={() => { setSelectedStaff(null); setView('onboard'); }}
                        id="btn-add-personnel"
                        className="bg-[#FFF8E1] text-[#001736] px-4 py-3 lg:px-6 lg:py-3.5 rounded-xl lg:rounded-2xl font-black text-[10px] lg:text-[11px] uppercase tracking-widest shadow-2xl hover:bg-white transition-all flex items-center gap-2 active:scale-95 border border-white/20 whitespace-nowrap"
                    >
                        <Plus size={18} />
                        <span className="hidden lg:inline">ADD PERSONNEL</span>
                        <span className="lg:hidden">ADD</span>
                    </button>
                </div>
            </ModuleHeader>

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MiniStat label="Total Staff" value={stats.total} color="bg-blue-600" icon={Users}
                    active={filterStatus === 'all' && filterType === 'all'}
                    onClick={() => { setFilterStatus('all'); setFilterType('all'); }} />
                <MiniStat label="Active" value={stats.active} color="bg-emerald-500" icon={ShieldCheck}
                    active={filterStatus === 'active'}
                    onClick={() => { setFilterStatus('active'); setFilterType('all'); }} />
                <MiniStat label="Teaching" value={stats.teaching} color="bg-indigo-500" icon={GraduationCap}
                    active={filterType === 'teaching'}
                    onClick={() => { setFilterType('teaching'); setFilterStatus('all'); }} />
                <MiniStat label="Non-Teaching" value={stats.nonTeaching} color="bg-amber-500" icon={Briefcase}
                    active={filterType === 'non-teaching'}
                    onClick={() => { setFilterType('non-teaching'); setFilterStatus('all'); }} />
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 lg:p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name, ID, email, mobile..."
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-[#001736] outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-slate-400" />
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="bg-slate-50 border border-slate-200 py-3 px-4 rounded-xl text-[11px] font-bold uppercase tracking-widest text-[#001736] outline-none cursor-pointer hover:bg-slate-100 transition-all"
                        >
                            <option value="all">All Types</option>
                            <option value="teaching">Teaching</option>
                            <option value="non-teaching">Non-Teaching</option>
                        </select>
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-slate-50 border border-slate-200 py-3 px-4 rounded-xl text-[11px] font-bold uppercase tracking-widest text-[#001736] outline-none cursor-pointer hover:bg-slate-100 transition-all"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
            </div>

            {/* DataTable */}
            <DataTable
                headers={[
                    { label: 'Personnel Identity' },
                    { label: 'Emp ID', className: 'hidden md:table-cell' },
                    { label: 'Type / Role' },
                    { label: 'Contact', className: 'hidden lg:table-cell' },
                    { label: 'Salary', className: 'hidden xl:table-cell' },
                    { label: 'Status', className: 'w-[130px]' },
                    { label: 'Actions', className: 'text-right w-[160px]' },
                ]}
                columnCount={7}
                loading={loading}
                emptyMessage="No Personnel Detected"
                footer={
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">HR Personnel Matrix</span>
                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-2">
                                    {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredStaff.length)} of {filteredStaff.length}
                                </span>
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 transition-all">
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button key={page} onClick={() => setCurrentPage(page)}
                                        className={`w-7 h-7 rounded-lg text-[11px] font-bold transition-all ${currentPage === page ? 'bg-[#001736] text-white shadow' : 'hover:bg-slate-100 text-slate-500'}`}>
                                        {page}
                                    </button>
                                ))}
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 transition-all">
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}
                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em]">{filteredStaff.length} Records</span>
                    </div>
                }
            >
                {paginatedStaff.map((staff) => (
                    <tr key={staff.id} className="hover:bg-slate-50/50 transition-colors group">
                        {/* Identity */}
                        <td className="px-4 lg:px-8 py-5 border-r border-slate-100">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm shrink-0">
                                    {staff.doc_photo
                                        ? <img src={`http://localhost:5000/${staff.doc_photo}`} className="w-full h-full object-cover" alt="" />
                                        : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-sm">{staff.full_name?.charAt(0)}</div>
                                    }
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-[13px] font-bold text-[#001736] uppercase leading-tight tracking-tight truncate">{staff.full_name}</p>
                                    <p className="text-[10px] font-bold text-slate-400 mt-0.5 truncate">{staff.email}</p>
                                </div>
                            </div>
                        </td>
                        {/* Emp ID */}
                        <td className="px-4 lg:px-8 py-5 border-r border-slate-100 hidden md:table-cell">
                            <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                                {staff.employee_id}
                            </span>
                        </td>
                        {/* Type */}
                        <td className="px-4 lg:px-8 py-5 border-r border-slate-100">
                            <p className="text-[12px] font-bold text-[#001736] uppercase">{staff.designation || '—'}</p>
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mt-1 inline-block ${staff.staff_type === 'teaching' ? 'bg-indigo-50 text-indigo-500' : 'bg-amber-50 text-amber-600'
                                }`}>
                                {staff.staff_type}
                            </span>
                        </td>
                        {/* Contact */}
                        <td className="px-4 lg:px-8 py-5 border-r border-slate-100 hidden lg:table-cell">
                            <div className="flex items-center gap-2">
                                <Phone className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-[11px] font-bold font-mono text-slate-500">{staff.mobile}</span>
                            </div>
                        </td>
                        {/* Salary */}
                        <td className="px-4 lg:px-8 py-5 border-r border-slate-100 hidden xl:table-cell">
                            <p className="text-sm font-black text-emerald-600">₹{parseFloat(staff.salary || 0).toLocaleString()}</p>
                        </td>
                        {/* Status */}
                        <td className="px-4 lg:px-8 py-5 border-r border-slate-100">
                            <button
                                onClick={() => handleStatusToggle(staff.id, staff.status)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all hover:scale-105 ${staff.status === 'active'
                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100'
                                        : 'bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100'
                                    }`}
                            >
                                {staff.status === 'active' ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                                {staff.status}
                            </button>
                        </td>
                        {/* Actions */}
                        <td className="px-4 lg:px-8 py-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                                <button onClick={() => handleViewProfile(staff)} className="p-2 rounded-xl hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-all border border-slate-100" title="View Profile">
                                    <Eye className="w-4 h-4" />
                                </button>
                                <button onClick={() => { setSelectedStaff(staff); setView('onboard'); }} className="p-2 rounded-xl hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-all border border-slate-100" title="Edit">
                                    ✏️
                                </button>
                                <button onClick={() => handleDelete(staff.id)} className="p-2 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all border border-slate-100" title="Delete">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
            </DataTable>
        </div>
    );
};

/** Mini Stat Card */
const MiniStat = ({ label, value, color, icon: Icon, active, onClick }) => (
    <button
        onClick={onClick}
        className={`bg-white p-4 lg:p-6 rounded-2xl border transition-all text-left group hover:shadow-md ${active ? 'border-indigo-500 shadow-md ring-1 ring-indigo-500' : 'border-slate-200'
            }`}
    >
        <div className="flex items-center gap-4">
            <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5 text-white" />
            </div>
        </div>
        <div className="mt-3">
            <p className="text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <h3 className="text-2xl lg:text-3xl font-bold text-[#001736] tracking-tight leading-none">{value || 0}</h3>
        </div>
    </button>
);

export default StaffManagement;
