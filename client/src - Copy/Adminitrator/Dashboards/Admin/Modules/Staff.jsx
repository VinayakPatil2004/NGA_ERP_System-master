import React, { useState, useEffect, useCallback } from 'react';
import {
    Users, GraduationCap, Briefcase, UserX, Search, RefreshCw,
    Calendar, Trash2, Eye, ShieldCheck, UserCheck, Plus, X, Download,
    FileSpreadsheet, ShieldAlert, Phone, Mail, FilePieChart
} from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';
import * as XLSX from 'xlsx';
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import DataTable from '../../../admcomponents/DataTable';
import {
    getAllStaff,
    getStaffStats,
    updateStaffStatus,
    getStaffProfile,
    deleteStaff
} from '../../../../services/staffAPI';
import ViewStafProfile from '../../../admpages/ViewStafProfile';
import StafOnboardingForm from '../../../admpages/StafOnboardingForm';

/**
 * Staff - Institutional Personnel Management
 * Refined to the 'Simplified Premium' aesthetic with rounded-2xl and 1px borders.
 */
const Staff = ({ toggleSidebar }) => {
    const [view, setView] = useState('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [staffList, setStaffList] = useState([]);
    const [stats, setStats] = useState({ total: 0, teaching: 0, nonTeaching: 0, deactive: 0 });
    const [loading, setLoading] = useState(true);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [academicYear, setAcademicYear] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [availableYears, setAvailableYears] = useState([]);

    const fetchDropdownYears = useCallback(async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/academic-years/all');
            setAvailableYears(response.data);
            const active = response.data.find(y => y.is_active);
            if (active && !academicYear) {
                setAcademicYear(active.year_name);
            }
        } catch {
            console.error("Failed to fetch academic years");
        }
    }, [academicYear]);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [list, statsData] = await Promise.all([
                getAllStaff({ academicYear }),
                getStaffStats(academicYear)
            ]);
            setStaffList(list || []);
            setStats(statsData || { total: 0, teaching: 0, nonTeaching: 0, deactive: 0 });
        } catch {
            toast.error("Failed to fetch staff records");
        } finally {
            setLoading(false);
        }
    }, [academicYear]);

    useEffect(() => {
        fetchDropdownYears();
    }, [fetchDropdownYears]);

    useEffect(() => {
        if (academicYear) fetchData();
    }, [fetchData, academicYear]);

    const handleViewProfile = async (id) => {
        try {
            const profile = await getStaffProfile(id);
            setSelectedStaff(profile);
            setView('profile');
        } catch {
            toast.error("Failed to load profile");
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        try {
            await updateStaffStatus(id, newStatus);
            toast.success(`Staff ${newStatus === 'active' ? 'Activated' : 'Deactivated'}`);
            fetchData();
        } catch {
            toast.error("Status update failed");
        }
    };

    const handleDeleteStaff = async (id) => {
        if (!window.confirm("CRITICAL: Permanently Delete this staff record?")) return;
        try {
            await deleteStaff(id);
            toast.success("Staff record Deleted");
            fetchData();
        } catch {
            toast.error("Could not Delete staff record");
        }
    };

    const filteredStaff = staffList.filter(s => {
        const matchesSearch = s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || s.employee_id?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = statusFilter === 'all' ? true :
            statusFilter === 'teaching' ? s.staff_type === 'teaching' :
                statusFilter === 'non-teaching' ? s.staff_type === 'non-teaching' :
                    statusFilter === 'inactive' ? s.status === 'inactive' : true;
        return matchesSearch && matchesType;
    });

    return (
        <div className="p-4 lg:p-8 bg-[#F8FAFC] min-h-screen font-sans">

            {view === 'list' && (
                <>
                    {/* 1. Global Personnel Header */}
                    <ModuleHeader
                        title="Personnel Desk"
                        subTitle="Grace ERP Institutional Registry"
                        icon={Users}
                        toggleSidebar={toggleSidebar}
                        showSearch={true}
                        searchValue={searchTerm}
                        onSearchChange={setSearchTerm}
                        hideDesktopSearch={true}
                    >
                        <div className="flex items-center gap-2 lg:gap-4">
                            {/* Academic Year Selector - Refined */}
                            <div className="hidden lg:flex items-center bg-white/5 border border-white/10 px-4 py-3 rounded-2xl shadow-xl hover:border-amber-400/30 transition-all group/yr">
                                <Calendar className="w-4 h-4 text-amber-400 mr-3 group-hover/yr:scale-110 transition-transform" />
                                <select
                                    className="bg-transparent text-white text-[11px] font-black uppercase tracking-widest outline-none cursor-pointer"
                                    value={academicYear}
                                    onChange={(e) => setAcademicYear(e.target.value)}
                                >
                                    {availableYears.map(y => (
                                        <option key={y.id} value={y.year_name} className="bg-[#001736] text-white underline">{y.year_name}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={fetchData}
                                className="p-3 lg:p-3.5 bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl text-amber-400 hover:bg-white/10 hover:text-amber-300 transition-all shadow-2xl active:rotate-180 duration-700 shrink-0"
                                title="Synchronize Personnel Matrix"
                            >
                                <RefreshCw size={18} className="lg:w-[20px] lg:h-[20px] opacity-80" />
                            </button>

                            <button
                                onClick={() => { setSelectedStaff(null); setView('onboard'); }}
                                className="bg-[#FFF8E1] text-[#001736] px-4 py-3 lg:px-6 lg:py-3.5 rounded-xl lg:rounded-2xl font-black text-[10px] lg:text-[11px] uppercase tracking-widest shadow-2xl hover:bg-white transition-all flex items-center gap-2 active:scale-95 border border-white/20 whitespace-nowrap"
                            >
                                <Plus size={18} className="lg:w-4 lg:h-4" />
                                <span className="hidden lg:inline">ADD PERSONNEL</span>
                                <span className="lg:hidden">ADD</span>
                            </button>
                        </div>
                    </ModuleHeader>


                    {/* 2. Metrics Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-10">
                        <StatusMetric label="Total Personnel" value={stats.total} iconComponent={Users} color="bg-indigo-600" active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} />
                        <StatusMetric label="Teaching Faculty" value={stats.teaching} iconComponent={GraduationCap} color="bg-emerald-600" active={statusFilter === 'teaching'} onClick={() => setStatusFilter('teaching')} />
                        <StatusMetric label="Support Staff" value={stats.nonTeaching} iconComponent={Briefcase} color="bg-amber-500" active={statusFilter === 'non-teaching'} onClick={() => setStatusFilter('non-teaching')} />
                        <StatusMetric label="Inactive Records" value={stats.deactive} iconComponent={UserX} color="bg-rose-500" active={statusFilter === 'inactive'} onClick={() => setStatusFilter('inactive')} />
                    </div>

                    {/* 3. Standard Data Table */}
                    <DataTable
                        headers={[
                            { label: "Personnel Identity" },
                            { label: "Role/Type" },
                            { label: "Professional Profile" },
                            { label: "Communication", className: "w-[180px]" },
                            { label: "Status", className: "w-[130px]" },
                            { label: "Actions", className: "text-right w-[180px]" }
                        ]}
                        columnCount={6}
                        loading={loading}
                        emptyMessage="No Personnel Detected"
                        footer={
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400">
                                <span className="tracking-widest">Global Personnel Matrix: Synchronized</span>
                                <span className="tracking-[0.2em]">{filteredStaff.length} Resulting Profiles Detected</span>
                            </div>
                        }
                    >
                        {filteredStaff.map((staff) => (
                            <tr key={staff.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-8 py-6 border-r border-slate-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm shrink-0">
                                            {staff.doc_photo ? (
                                                <img src={`http://localhost:5000/${staff.doc_photo}`} className="w-full h-full object-cover" alt="" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                    <Users className="w-5 h-5" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-[14px] font-bold text-[#001736] uppercase leading-tight tracking-tight truncate">{staff.full_name}</p>
                                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-1.5 opacity-60">ID: {staff.employee_id}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6 border-r border-slate-100">
                                    <p className="text-[12px] text-[#001736] font-bold uppercase leading-tight">{staff.designation}</p>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">{staff.staff_type} DIVISION</p>
                                </td>
                                <td className="px-8 py-6 border-r border-slate-100">
                                    <p className="text-[12px] text-[#001736] font-bold uppercase leading-tight">{staff.qualification}</p>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">{staff.experience} Years TENURE</p>
                                </td>
                                <td className="px-8 py-6 border-r border-slate-100">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-3.5 h-3.5 text-emerald-600" />
                                            <span className="text-[11px] font-bold font-mono text-slate-500">{staff.mobile}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-3.5 h-3.5 text-slate-300" />
                                            <span className="text-[10px] font-bold truncate max-w-[140px] uppercase text-slate-400 tracking-tight">{staff.email}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6 border-r border-slate-100">
                                    <div className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-2 border border-black/5 ${staff.status === 'active' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-rose-500 text-white shadow-sm'}`}>
                                        {staff.status === 'active' ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                                        {staff.status}
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="flex items-center justify-end gap-3">
                                        <button onClick={() => handleViewProfile(staff.id)} className="p-3 bg-white border border-slate-200 text-[#001736] rounded-xl hover:bg-indigo-50 transition-all shadow-sm" title="View Profile">
                                            <Eye className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleToggleStatus(staff.id, staff.status)} className={`p-3 rounded-xl border border-slate-200 transition-all ${staff.status === 'active' ? 'bg-white text-rose-500 hover:bg-rose-50' : 'bg-white text-emerald-600 hover:bg-emerald-50'}`} title="Toggle Access Status">
                                            {staff.status === 'active' ? <UserX className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                                        </button>
                                        <button onClick={() => handleDeleteStaff(staff.id)} className="p-3 bg-white border border-slate-200 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm" title="Delete Record">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </DataTable>
                </>
            )}

            {view === 'onboard' && (
                <StafOnboardingForm
                    academicYear={academicYear}
                    onClose={() => { setView('list'); setSelectedStaff(null); }}
                    onRefresh={fetchData}
                    isEdit={!!selectedStaff}
                    initialData={selectedStaff}
                />
            )}

            {view === 'profile' && selectedStaff && (
                <ViewStafProfile
                    staff={selectedStaff}
                    onClose={() => setView('list')}
                    onEdit={() => setView('onboard')}
                    toggleSidebar={toggleSidebar}
                />
            )}
        </div>
    );
};

const StatusMetric = (props) => {
    const { label, value, iconComponent: Icon, color, active, onClick } = props;
    return (
        <button
            onClick={onClick}
            className={`p-4 lg:p-6 rounded-2xl border transition-all text-left group ${active ? 'bg-white border-indigo-600 shadow-md ring-1 ring-indigo-600' : 'bg-white border-slate-200 hover:border-slate-300'}`}
        >
            <div className="flex items-center gap-4">
                <div className={`p-2 lg:p-3 rounded-lg lg:rounded-xl ${color} text-white shadow-sm group-hover:scale-110 transition-transform`}>
                    <Icon size={18} className="lg:w-5 lg:h-5" />
                </div>
            </div>
            <div className="mt-2 lg:mt-4">
                <p className="text-[8px] lg:text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 lg:mb-1.5">{label}</p>
                <h3 className="text-xl lg:text-3xl font-bold text-[#001736] tracking-tight leading-none">{value || 0}</h3>
            </div>
        </button>
    );
}

export default Staff;
