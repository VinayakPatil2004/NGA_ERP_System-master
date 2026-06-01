import React, { useState, useEffect, useCallback } from 'react';
import {
    Users, GraduationCap, Briefcase, UserX, Search, RefreshCw,
    Trash2, Eye, ShieldCheck, UserCheck, Plus, X, Download,
    FileSpreadsheet, ShieldAlert, Phone, Mail, FilePieChart,
    FileDown, ChevronDown, Truck, Edit3
} from 'lucide-react';
import { toast } from 'react-toastify';
import API from '../../../../services/API';
import { ROOT_URL } from '../../../../services/API';
import * as XLSX from 'xlsx';
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import DataTable from '../../../admcomponents/DataTable';
import {
    getAllStaff,
    getStaffStats,
    updateStaffStatus,
    getStaffProfile,
    deleteStaff,
    importStaff,
    bulkUploadStaffDocuments
} from '../../../../services/staffAPI';
import ViewStafProfile from '../../../admpages/ViewStafProfile';
import StafOnboardingForm from '../../../admpages/StafOnboardingForm';
import { useAcademicYear } from '../../../../context/AcademicYearContext';

/**
 * Staff - Institutional Personnel Management
 * Refined to the 'Simplified Premium' aesthetic with rounded-md and 1px borders.
 */
const ROLE_MAP = {
    'teacher': 'Teacher',
    'principal': 'Principal',
    'driver': 'Bus Driver',
    'aunty': 'Aunty/ Support Staff',
    'librarian': 'Librarian',
    'accountant': 'Accountant',
    'hr': 'HR Manager',
    'canteen': 'Canteen Supervisor'
};

const Staff = ({ toggleSidebar }) => {
    const { selectedYear: globalYear } = useAcademicYear();
    const academicYear = globalYear?.year_name || '';

    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const [view, setView] = useState('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [staffList, setStaffList] = useState([]);
    const [stats, setStats] = useState({ total: 0, teaching: 0, nonTeaching: 0, deactive: 0 });
    const [loading, setLoading] = useState(true);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [isImportingStaff, setIsImportingStaff] = useState(false);
    const [isUploadingDocs, setIsUploadingDocs] = useState(false);
    const [isAddDropdownOpen, setIsAddDropdownOpen] = useState(false);
    const [selectedAddRole, setSelectedAddRole] = useState('teacher');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 15;

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [list, statsData] = await Promise.all([
                getAllStaff({}),
                getStaffStats()
            ]);
            setStaffList(list || []);
            setStats(statsData || { total: 0, teaching: 0, nonTeaching: 0, deactive: 0 });
        } catch {
            toast.error("Failed to fetch staff records");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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

    const handleEditStaff = async (staff) => {
        try {
            const profile = await getStaffProfile(staff.id);
            setSelectedStaff(profile);
            setView('onboard');
        } catch {
            toast.error("Failed to load staff details for editing");
        }
    };

    const handleImportStaff = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        const ext = file.name.split('.').pop().toLowerCase();
        if (type === 'excel' && !['xlsx', 'xls'].includes(ext)) {
            toast.error("Please upload a valid Excel file (.xlsx or .xls)");
            return;
        }
        if (type === 'csv' && ext !== 'csv') {
            toast.error("Please upload a valid CSV file (.csv)");
            return;
        }

        try {
            setIsImportingStaff(true);
            const res = await importStaff(file);
            if (res.failed > 0) {
                toast.warning(`Imported ${res.inserted}. Failed ${res.failed}. Check console for duplicates.`, { duration: 5000 });
                console.warn("Import Errors:", res.errors);
            } else {
                toast.success(res.message || "Staff records imported successfully!");
            }
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to import staff");
        } finally {
            setIsImportingStaff(false);
            e.target.value = '';
        }
    };

    const handleBatchDocUpload = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        try {
            setIsUploadingDocs(true);
            console.log("Starting batch upload for", files.length, "files");
            const res = await bulkUploadStaffDocuments(files);
            console.log("Upload response:", res);
            toast.success(`${res.summary.successCount} Documents processed successfully!`);
            if (res.summary.failedCount > 0) {
                toast.warning(`${res.summary.failedCount} files failed. Check naming format.`);
            }
            fetchData();
        } catch (err) {
            console.error("Batch upload error:", err);
            toast.error(err.response?.data?.error || "Batch upload failed");
        } finally {
            setIsUploadingDocs(false);
            e.target.value = '';
        }
    };

    const filteredStaff = staffList.filter(s => {
        const matchesSearch = s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || s.employee_id?.toLowerCase().includes(searchTerm.toLowerCase());
        const roleName = s.role_name?.toLowerCase();

        // Group definitions matching backend
        const isAdminRole = ['principal', 'hr', 'accountant', 'librarian', 'counsellor', 'admin'].includes(roleName);
        const isSupportRole = ['aunty', 'canteen', 'security gaurd', 'bus driver'].includes(roleName);
        const isTeacherRole = roleName === 'teacher';

        const matchesType =
            statusFilter === 'all' ? true :
                statusFilter === 'teaching' ? isTeacherRole :
                    statusFilter === 'administrative' ? isAdminRole :
                        statusFilter === 'support' ? isSupportRole :
                            statusFilter === 'inactive' ? s.status === 'inactive' : true;

        return matchesSearch && matchesType;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredStaff.length / recordsPerPage);
    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    const currentRecords = filteredStaff.slice(indexOfFirstRecord, indexOfLastRecord);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    const isCounsellor = window.location.pathname.includes('/counsellor');

    return (
        <div className={`${isCounsellor ? 'p-0 bg-transparent min-h-0' : 'p-4 lg:p-8 bg-[#F8FAFC] min-h-screen'} font-sans`}>

            {view === 'list' && (
                <>
                    {/* 1. Global Personnel Header */}
                    <ModuleHeader
                        title="Staff Desk"
                        subTitle="Grace ERP Institutional Registry"
                        icon={Users}
                        toggleSidebar={toggleSidebar}
                        showSearch={true}
                        searchValue={searchTerm}
                        onSearchChange={setSearchTerm}
                        onSearchToggle={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                        hideDesktopSearch={true}
                        hideAcademicYear={true}
                    >
                        <div className="flex items-center gap-2 lg:gap-4">

                            <button
                                onClick={fetchData}
                                className="w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center bg-white border border-white rounded-md text-black hover:bg-white/30 transition-all active:rotate-180 duration-700 shrink-0 shadow-sm"
                                title="Synchronize Personnel Matrix"
                            >
                                <RefreshCw size={18} />
                            </button>


                            <div className="relative">
                                <button
                                    onClick={() => setIsAddDropdownOpen(!isAddDropdownOpen)}
                                    className="btn-add-institutional px-4 lg:px-6 h-10 lg:h-12 rounded-md font-black text-[10px] lg:text-[11px] uppercase tracking-widest shadow-2xl hover:bg-white/20 transition-all flex items-center gap-2 active:scale-95 border border-white/20 whitespace-nowrap"
                                >
                                    <Plus size={18} />
                                    <strong className="hidden lg:inline">ADD STAFF</strong>
                                    <ChevronDown size={14} className={`transition-transform duration-300 ${isAddDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isAddDropdownOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-md shadow-2xl z-100 animate-in fade-in slide-in-from-top-2 text-slate-900">
                                        <button
                                            onClick={() => { setSelectedAddRole('teacher'); setView('onboard'); setIsAddDropdownOpen(false); }}
                                            className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors border-b border-slate-100"
                                        >
                                            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600"><Users size={16} /></div>
                                            <div className="text-left flex flex-col">
                                                <span className="text-[11px] font-black uppercase tracking-widest text-slate-900! block leading-tight">Administration / Teachers</span>
                                                <span className="text-[9px] font-bold text-slate-500! block mt-0.5 uppercase">Teaching & Management</span>
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => { setSelectedAddRole('aunty'); setView('onboard'); setIsAddDropdownOpen(false); }}
                                            className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors border-b border-slate-100"
                                        >
                                            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600"><Briefcase size={16} /></div>
                                            <div className="text-left flex flex-col">
                                                <span className="text-[11px] font-black uppercase tracking-widest text-slate-900! block leading-tight">Support Staff</span>
                                                <span className="text-[9px] font-bold text-slate-500! block mt-0.5 uppercase">Non-Teaching Support</span>
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => { setSelectedAddRole('driver'); setView('onboard'); setIsAddDropdownOpen(false); }}
                                            className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors"
                                        >
                                            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600"><Truck size={16} /></div>
                                            <div className="text-left flex flex-col">
                                                <span className="text-[11px] font-black uppercase tracking-widest text-slate-900! block leading-tight">Bus Driver</span>
                                                <span className="text-[9px] font-bold text-slate-500! block mt-0.5 uppercase">Logistics & Transport</span>
                                            </div>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </ModuleHeader>



                    {/* 2. Metrics Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6 mb-10">
                        <StatusMetric label="Total Personnel" value={stats.total} iconComponent={Users} color="indigo" active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} />
                        <StatusMetric label="Teaching Faculty" value={stats.teaching} iconComponent={GraduationCap} color="emerald" active={statusFilter === 'teaching'} onClick={() => setStatusFilter('teaching')} />
                        <StatusMetric label="Administrative" value={stats.administration} iconComponent={ShieldCheck} color="blue" active={statusFilter === 'administrative'} onClick={() => setStatusFilter('administrative')} />
                        <StatusMetric label="Support Staff" value={stats.supportStaff} iconComponent={Briefcase} color="amber" active={statusFilter === 'support'} onClick={() => setStatusFilter('support')} />
                        <StatusMetric label="Inactive" value={stats.inactive} iconComponent={UserX} color="rose" active={statusFilter === 'inactive'} onClick={() => setStatusFilter('inactive')} />
                    </div>

                    {/* Registry Action Bar (Mobile Responsive Search/Filter) */}
                    <div className={`flex flex-col lg:flex-row items-center justify-between gap-4 py-4 rounded-md mb-4 w-full ${!isMobileSearchOpen ? 'hidden lg:flex' : 'flex animate-in slide-in-from-top-2 duration-300'}`}>
                        <div className="flex flex-1 max-w-md w-full relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-40 group-focus-within:opacity-100 transition-opacity" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search Registry..."
                                className="w-full pl-11 pr-4 py-4 border border-black rounded-md text-primary text-[10px] font-black uppercase tracking-widest outline-none shadow-sm transition-all bg-white hover:bg-slate-50"
                            />
                        </div>

                        <div className="relative group border rounded-md w-full lg:w-auto">
                            <button
                                disabled={isImportingStaff}
                                className="w-full lg:w-auto px-4 h-12 bg-white border border-white rounded-md text-black hover:bg-white/30 font-black text-[10px] lg:text-[11px] uppercase tracking-widest shadow-2xl transition-all flex items-center justify-center gap-2 active:scale-95 whitespace-nowrap disabled:opacity-50"
                            >
                                {isImportingStaff ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileDown size={18} />}
                                <span className="hidden lg:inline">{isImportingStaff ? "IMPORTING..." : "IMPORT"}</span>
                                <ChevronDown size={14} />
                            </button>

                            {!isImportingStaff && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white border  rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                                    <label className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-100">
                                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Excel</span>
                                        <input type="file" accept=".xlsx, .xls" className="hidden" onChange={(e) => handleImportStaff(e, 'excel')} />
                                    </label>
                                    <label className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50 cursor-pointer transition-colors">
                                        <FilePieChart className="w-4 h-4 text-blue-600" />
                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">CSV</span>
                                        <input type="file" accept=".csv" className="hidden" onChange={(e) => handleImportStaff(e, 'csv')} />
                                    </label>
                                </div>
                            )}
                        </div>
                        {/* Batch Doc Upload */}
                        <div className="relative group border rounded-md w-full lg:w-auto">
                            <label className={`w-full lg:w-auto px-4 h-12 bg-white border border-white rounded-md text-black hover:bg-white/30 font-black text-[10px] lg:text-[11px] uppercase tracking-widest shadow-2xl transition-all flex items-center justify-center gap-2 active:scale-95 whitespace-nowrap ${isUploadingDocs ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                                {isUploadingDocs ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus size={18} />}
                                <span className="hidden lg:inline">{isUploadingDocs ? "UPLOADING..." : "BATCH DOC UPLOAD"}</span>
                                {!isUploadingDocs && <input type="file" multiple className="hidden" onChange={handleBatchDocUpload} />}
                            </label>
                        </div>
                    </div>

                    {/* 3. Standard Data Table */}
                    <DataTable
                        headers={[
                            { label: "Staff Name", className: "border-r border-black" },
                            { label: "Role/Type", className: "border-r border-black" },
                            { label: "Professional Profile", className: "border-r border-black" },
                            { label: "Contact", className: "w-[160px] border-r border-black text-center" },
                            { label: "Status", className: "w-[100px] border-r border-black text-center" },
                            { label: "Actions", className: "text-center w-[140px]" }
                        ]}
                        columnCount={6}
                        loading={loading}
                        emptyMessage="No Personnel Detected"
                        footer={
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full px-4">
                                <div className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
                                    Registry: {filteredStaff.length} Staff
                                </div>

                                <div className="flex items-center gap-4">
                                    <button
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-400 hover:text-[#001736] hover:border-slate-400 disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:border-slate-300 transition-all cursor-pointer"
                                    >PREV</button>
                                    <span className="text-xs font-black uppercase tracking-widest text-[#001736]">
                                        PAGE {currentPage} OF {totalPages || 1}
                                    </span>
                                    <button
                                        disabled={currentPage === totalPages || totalPages === 0}
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-400 hover:text-[#001736] hover:border-slate-400 disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:border-slate-300 transition-all cursor-pointer"
                                    >NEXT</button>
                                </div>
                            </div>
                        }
                    >
                        {currentRecords.map((staff) => (
                            <tr key={staff.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-5 py-3 border-b border-r border-black">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-slate-50 border border-black rounded-lg overflow-hidden shadow-sm shrink-0">
                                            {staff.doc_photo ? (
                                                <img src={`${ROOT_URL}/${staff.doc_photo}`} className="w-full h-full object-cover" alt="" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-black">
                                                    <Users className="w-5 h-5" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-[14px] font-bold text-[#001736] uppercase leading-tight tracking-tight truncate">{staff.full_name}</p>
                                            <p className="text-[10px] font-bold text-black uppercase tracking-widest mt-1.5 opacity-60">ID: {staff.employee_id}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-5 py-3 border-b border-r border-black">
                                    <p className="text-[12px] text-[#001736] font-bold uppercase leading-tight">
                                        {ROLE_MAP[staff.role_name?.toLowerCase()] || staff.designation || staff.role_name}
                                    </p>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">
                                        {['principal', 'teacher'].includes(staff.role_name?.toLowerCase()) ? 'Teaching' : 'Non-Teaching'} DIVISION
                                    </p>
                                </td>
                                <td className="px-5 py-3 border-b border-r border-black">
                                    <p className="text-[12px] text-[#001736] font-bold uppercase leading-tight">{staff.qualification}</p>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">{staff.experience} Years TENURE</p>
                                </td>
                                <td className="px-5 py-3 border-b border-r border-black">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-3.5 h-3.5 text-emerald-600" />
                                            <span className="text-[12px] font-bold font-mono text-black">{staff.mobile}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-3.5 h-3.5 text-black" />
                                            <span className="text-[12px] font-bold truncate max-w-[140px] uppercase text-black tracking-tight">{staff.email}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-3 py-3 border-b border-r border-black text-center">
                                    <div className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5 border border-black/5 ${staff.status === 'active' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-rose-500 text-white shadow-sm'}`}>
                                        {staff.status === 'active' ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                                        {staff.status}
                                    </div>
                                </td>
                                <td className="px-3 py-3 text-right border-b border-black">
                                    <div className="flex items-center justify-center gap-1.5">
                                        <button onClick={() => handleViewProfile(staff.id)} className="p-1.5 bg-white border border-black text-[#001736] rounded-lg hover:bg-slate-100 transition-all shadow-sm" title="View Profile">
                                            <Eye className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => handleEditStaff(staff)} className="p-1.5 bg-white border border-black text-amber-600 rounded-lg hover:bg-amber-50 transition-all shadow-sm" title="Edit Staff">
                                            <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => handleToggleStatus(staff.id, staff.status)} className={`p-1.5 rounded-lg border border-black transition-all ${staff.status === 'active' ? 'bg-white text-rose-500 hover:bg-rose-50' : 'bg-white text-emerald-600 hover:bg-emerald-50'}`} title="Toggle Access Status">
                                            {staff.status === 'active' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                                        </button>
                                        <button onClick={() => handleDeleteStaff(staff.id)} className="p-1.5 bg-white border border-black text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all shadow-sm" title="Delete Record">
                                            <Trash2 className="w-3.5 h-3.5" />
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
                    defaultRole={selectedAddRole}
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

    const colorMap = {
        indigo: { border: 'border-indigo-600', bg: 'bg-indigo-50/50', iconBg: 'bg-indigo-600', text: 'text-indigo-900', ring: 'ring-indigo-500/10' },
        emerald: { border: 'border-emerald-600', bg: 'bg-emerald-50/50', iconBg: 'bg-emerald-600', text: 'text-emerald-900', ring: 'ring-emerald-500/10' },
        rose: { border: 'border-rose-600', bg: 'bg-rose-50/50', iconBg: 'bg-rose-600', text: 'text-rose-900', ring: 'ring-rose-500/10' },
        amber: { border: 'border-amber-600', bg: 'bg-amber-50/50', iconBg: 'bg-amber-600', text: 'text-amber-900', ring: 'ring-amber-500/10' },
        blue: { border: 'border-blue-600', bg: 'bg-blue-50/50', iconBg: 'bg-blue-600', text: 'text-blue-900', ring: 'ring-blue-500/10' },
    };

    const theme = colorMap[color] || colorMap.indigo;

    return (
        <button
            onClick={onClick}
            className={`p-4 lg:p-4 min-h-[100px] lg:min-h-[125px] rounded-md border-l-4 transition-all duration-300 group hover:shadow-xl active:scale-[0.98] text-left flex items-center justify-between gap-2 lg:gap-4 shadow-sm
        ${theme.border} ${theme.bg} ${active ? `ring-2 ${theme.ring} shadow-md` : ''}`}
        >
            <div className="flex-1 min-w-0 no-scrollbar overflow-y-auto">
                <p className={`text-[8px] lg:text-[10px] font-black uppercase tracking-wider lg:tracking-[0.2em] mb-1.5 opacity-60 ${theme.text} whitespace-normal leading-tight italic wrap-break-word no-scrollbar`}>{label}</p>
                <h3 className={`text-xl lg:text-3xl font-black tracking-tighter leading-tight ${theme.text} uppercase`}>{value || 0}</h3>
            </div>
            <div className={`w-10 h-10 lg:w-14 lg:h-14 rounded-md lg:rounded-md ${theme.iconBg} flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform border border-white/20 shrink-0`}>
                <Icon className="w-4 h-4 lg:w-6 lg:h-6 text-white" />
            </div>
        </button>
    );
};

export default Staff;
