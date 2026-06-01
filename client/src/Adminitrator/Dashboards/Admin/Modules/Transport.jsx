import React, { useState, useEffect, useCallback } from 'react';
import {
    Bus, Users, Phone, MapPin, Plus, Search,
    MoreVertical, Edit, Trash2, X, CheckCircle,
    ChevronRight, ArrowLeft, RefreshCw, ShieldAlert,
    UserPlus, UserMinus, Info
} from 'lucide-react';
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import DataTable from '../../../admcomponents/DataTable';
import { toast } from 'react-toastify';
import transportAPI from '../../../../services/transportAPI';
import { getAllStudents } from '../../../../services/studentAPI';
import { getAllStaff } from '../../../../services/staffAPI';
import bulkImportAPI from '../../../../services/bulkImportAPI';
import { FileDown } from 'lucide-react';
import { useAcademicYear } from '../../../../context/AcademicYearContext';

/**
 * Transport Management Module
 * Handles Institutional Vehicle Registry & Student Assignment logic.
 */
const Transport = ({ toggleSidebar }) => {
    const { selectedYear: globalYear } = useAcademicYear();
    const [view, setView] = useState('grid'); // 'grid' | 'assignments'
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showVehicleModal, setShowVehicleModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [assignmentLoading, setAssignmentLoading] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Custom Confirmation Modal States
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [confirmMessage, setConfirmMessage] = useState('');

    const triggerConfirm = (message, action) => {
        setConfirmMessage(message);
        setConfirmAction(() => action);
        setShowConfirmModal(true);
    };

    // Form States
    const [vehicleForm, setVehicleForm] = useState({
        vehicle_number: '',
        vehicle_type: 'Bus',
        driver_name: '',
        driver_phone: '',
        route_name: '',
        route_code: '',
        capacity: 40,
        status: 'active',
        stops: []
    });

    const [assignForm, setAssignForm] = useState({
        student_id: '',
        pickup_point: ''
    });

    const [allStudents, setAllStudents] = useState([]);
    const [studentSearch, setStudentSearch] = useState('');
    const [drivers, setDrivers] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [editingAssignment, setEditingAssignment] = useState(null);
    const [assignmentSearchTerm, setAssignmentSearchTerm] = useState('');

    // ── Data Fetching ──────────────────────────────────────────────────────

    const fetchVehicles = useCallback(async () => {
        try {
            setLoading(true);
            const data = await transportAPI.getAllVehicles();
            const parsedData = (data || []).map(v => {
                let parsedStops = [];
                if (typeof v.stops === 'string') {
                    try { parsedStops = JSON.parse(v.stops); } catch (err) { console.warn("Could not parse stops", err); }
                } else if (Array.isArray(v.stops)) {
                    parsedStops = v.stops;
                }
                return {
                    ...v,
                    stops: parsedStops.filter(s => s && s.id)
                };
            });
            setVehicles(parsedData);
        } catch {
            toast.error("Failed to load transport vehicles");
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchAssignments = useCallback(async (vId) => {
        try {
            setAssignmentLoading(true);
            const ayId = globalYear?.id;
            const data = await transportAPI.getVehicleAssignments(vId, ayId);
            setAssignments(data || []);
        } catch {
            toast.error("Failed to load assignments");
        } finally {
            setAssignmentLoading(false);
        }
    }, [globalYear?.id]);

    const fetchStudentsForAssignment = useCallback(async () => {
        try {
            const yearName = globalYear?.year_name;
            if (!yearName) return;
            const data = await getAllStudents(yearName);
            setAllStudents(data || []);
        } catch (err) {
            console.error("Student fetch failed", err);
        }
    }, [globalYear?.year_name]);

    const fetchDrivers = useCallback(async () => {
        try {
            const data = await getAllStaff({ role: 'Bus Driver' });
            setDrivers(data || []);
        } catch (err) {
            console.error("Failed to fetch drivers", err);
        }
    }, []);

    useEffect(() => {
        fetchVehicles();
        fetchStudentsForAssignment();
        fetchDrivers();
    }, [fetchVehicles, fetchStudentsForAssignment, fetchDrivers]);

    // ── Vehicle Actions ────────────────────────────────────────────────────

    const handleOpenAssign = (vehicle) => {
        setSelectedVehicle(vehicle);
        setCurrentPage(1);
        fetchAssignments(vehicle.id);
        setView('assignments');
    };

    const handleVehicleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (vehicleForm.id) {
                await transportAPI.updateVehicle(vehicleForm.id, vehicleForm);
                toast.success("Vehicle updated ✓");
            } else {
                await transportAPI.addVehicle(vehicleForm);
                toast.success("New vehicle added ✓");
            }
            setShowVehicleModal(false);
            setVehicleForm({ vehicle_number: '', vehicle_type: 'Bus', driver_name: '', driver_phone: '', route_name: '', route_code: '', stops: [], capacity: 40, status: 'active' });
            fetchVehicles();
        } catch (err) {
            toast.error(err.response?.data?.error || "Operation failed");
        }
    };

    const handleDeleteVehicle = (id) => {
        triggerConfirm("Permanently remove this vehicle and its assignments?", async () => {
            try {
                await transportAPI.deleteVehicle(id);
                toast.success("Vehicle Deleted ✓");
                fetchVehicles();
            } catch { toast.error("Delete failed"); }
        });
    };

    // ── Assignment Actions ────────────────────────────────────────────────

    const handleCloseAssignModal = () => {
        setShowAssignModal(false);
        setAssignForm({ student_id: '', pickup_point: '' });
        setEditingAssignment(null);
        setStudentSearch('');
        setSelectedClass('');
    };

    const handleEditAssignmentClick = (row) => {
        setEditingAssignment(row);
        setAssignForm({
            student_id: row.student_id,
            pickup_point: row.pickup_point || ''
        });
        setSelectedClass(row.grade || '');
        setShowAssignModal(true);
    };

    const handleAssignStudent = async (e) => {
        e.preventDefault();
        if (!assignForm.student_id) return toast.warning("Selection required");

        try {
            if (editingAssignment) {
                await transportAPI.updateStudentAssignment(editingAssignment.id, {
                    student_id: assignForm.student_id,
                    pickup_point: assignForm.pickup_point
                });
                toast.success("Assignment updated ✓");
            } else {
                await transportAPI.assignStudentToVehicle({
                    vehicle_id: selectedVehicle.id,
                    student_id: assignForm.student_id,
                    pickup_point: assignForm.pickup_point,
                    academic_year_id: globalYear?.id
                });
                toast.success("Student assigned ✓");
            }
            handleCloseAssignModal();
            fetchAssignments(selectedVehicle.id);
            fetchVehicles(); // refresh counts
        } catch (err) {
            toast.error(err.response?.data?.error || "Operation failed");
        }
    };

    const handleRemoveStudent = (id) => {
        triggerConfirm("Remove student from this vehicle route?", async () => {
            try {
                await transportAPI.removeStudentFromVehicle(id);
                toast.success("Assignment removed");
                fetchAssignments(selectedVehicle.id);
                fetchVehicles();
            } catch { toast.error("Removal failed"); }
        });
    };

    const handleImportVehicles = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setIsImporting(true);
            toast.info("Importing Vehicles/Routes...");
            const res = await bulkImportAPI.importVehicles(file);
            toast.success(`Vehicles imported successfully. ${res.inserted} processed.`);
            if (res.failed > 0) toast.warning(`${res.failed} records failed.`);
            fetchVehicles();
        } catch (err) {
            toast.error(err.response?.data?.error || "Import failed");
        } finally {
            setIsImporting(false);
            e.target.value = null;
            setShowImportMenu(false);
        }
    };

    const handleImportAssignments = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setIsImporting(true);
            toast.info("Importing Student Transport Assignments...");
            const res = await bulkImportAPI.importTransportAssignments(file, globalYear?.id);
            toast.success(`Assignments synced! ${res.inserted} processed.`);
            if (res.failed > 0) toast.warning(`${res.failed} records failed.`);
            if (selectedVehicle) fetchAssignments(selectedVehicle.id);
            fetchVehicles();
        } catch (err) {
            toast.error(err.response?.data?.error || "Import failed");
        } finally {
            setIsImporting(false);
            e.target.value = null;
            setShowImportMenu(false);
        }
    };

    const [showImportMenu, setShowImportMenu] = useState(false);

    // ── Filtering ─────────────────────────────────────────────────────────

    const availableStudents = allStudents.filter(s => {
        if (s.status !== 'active') return false;

        const sGrade = (s.grade || s.current_grade || '').trim();
        const selClass = (selectedClass || '').trim();
        if (selClass && sGrade.toLowerCase() !== selClass.toLowerCase()) return false;

        if (studentSearch) {
            const query = studentSearch.toLowerCase();
            const fullName = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
            const studentId = (s.student_id_no || '').toLowerCase();
            const pen = (s.pen_no || '').toLowerCase();
            const gr = (s.gr_no || '').toLowerCase();

            return fullName.includes(query) || studentId.includes(query) || pen.includes(query) || gr.includes(query);
        }
        return true;
    });

    // ── Pagination Calculation ────────────────────────────────────────────
    const filteredAssignments = assignments.filter(row => {
        if (!assignmentSearchTerm) return true;
        const query = assignmentSearchTerm.toLowerCase();
        const fullName = `${row.first_name || ''} ${row.last_name || ''}`.toLowerCase();
        const studentId = (row.student_id_no || '').toLowerCase();
        const grade = (row.grade || '').toLowerCase();
        const pickup = (row.pickup_point || '').toLowerCase();

        return fullName.includes(query) || studentId.includes(query) || grade.includes(query) || pickup.includes(query);
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [assignmentSearchTerm]);

    const totalPages = Math.ceil(filteredAssignments.length / itemsPerPage);
    const paginatedAssignments = filteredAssignments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        const total = Math.ceil(filteredAssignments.length / itemsPerPage);
        if (currentPage > total && total > 0) {
            setCurrentPage(total);
        }
    }, [filteredAssignments.length, currentPage]);

    // ── Main Layout ───────────────────────────────────────────────────────

    return (
        <div className="p-4 lg:p-8 space-y-6 min-h-screen bg-[#F8FAFC]">

            <ModuleHeader
                title={view === 'grid' ? "Transport Management" : `Vehicle Registry: ${selectedVehicle?.vehicle_number}`}
                subTitle={view === 'grid' ? "Vehicles, Drivers & Route Assignments" : `${selectedVehicle?.driver_name} · ${selectedVehicle?.route_name}`}
                icon={Bus}
                toggleSidebar={toggleSidebar}
                hideAcademicYear={true}
            >
                <div className="flex items-center gap-2 lg:gap-3">
                    {view === 'assignments' && (
                        <button
                            onClick={() => setView('grid')}
                            className="w-9 h-9 md:w-auto md:p-3 bg-white border border-slate-200 text-[#001736] rounded-md md:rounded-md hover:bg-slate-50 transition-all flex items-center justify-center shadow-xl md:shadow-none shrink-0"
                        >
                            <ArrowLeft size={16} className="md:w-[18px] md:h-[18px]" />
                        </button>
                    )}
                    <button
                        onClick={fetchVehicles}
                        className="w-9 h-9 md:w-auto md:p-3 cursor-pointer bg-white border border-slate-200 text-amber-500 rounded-md md:rounded-md hover:bg-slate-50 transition-all flex items-center justify-center shadow-xl md:shadow-none active:rotate-180 duration-700 shrink-0"
                    >
                        <RefreshCw size={16} className="md:w-[18px] md:h-[18px]" />
                    </button>
                    <div className="relative">
                        <button
                            onClick={() => setShowImportMenu(!showImportMenu)}
                            disabled={isImporting}
                            className="w-9 h-9 md:w-auto md:px-6 md:py-3.5 bg-white border border-slate-200 rounded-md md:rounded-md text-[#001736] text-[10px] lg:text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-xl md:shadow-none active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0"
                        >
                            {isImporting ? <RefreshCw className="w-4 h-4 animate-spin text-[#001736]" /> : <FileDown className="w-4 h-4 text-[#001736]" />}
                            <span className="hidden md:inline">{isImporting ? "Processing..." : "Import"}</span>
                        </button>
                        {showImportMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                <button
                                    onClick={() => document.getElementById('transport-vehicle-import').click()}
                                    className="w-full px-4 py-3 text-left text-xs font-bold text-[#001736] hover:bg-slate-50 transition-colors uppercase tracking-wider border-b border-slate-100"
                                >
                                    Import Bus Master
                                </button>
                                <button
                                    onClick={() => document.getElementById('transport-assign-import').click()}
                                    className="w-full px-4 py-3 text-left text-xs font-bold text-[#001736] hover:bg-slate-50 transition-colors uppercase tracking-wider"
                                >
                                    Import Assignments
                                </button>
                            </div>
                        )}
                    </div>

                    <input
                        type="file"
                        id="transport-vehicle-import"
                        className="hidden"
                        accept=".xlsx, .xls, .csv"
                        onChange={handleImportVehicles}
                    />
                    <input
                        type="file"
                        id="transport-assign-import"
                        className="hidden"
                        accept=".xlsx, .xls, .csv"
                        onChange={handleImportAssignments}
                    />
                    <button
                        onClick={() => { setVehicleForm({ vehicle_number: '', vehicle_type: 'Bus', driver_name: '', driver_phone: '', route_name: '', route_code: '', stops: [], capacity: 40, status: 'active' }); setShowVehicleModal(true); }}
                        className="w-9 h-9 md:w-auto md:px-6 md:py-3.5 bg-white text-black border-0 rounded-md md:rounded-md font-black text-[10px] lg:text-[11px] uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer shrink-0"
                    >
                        <Plus size={16} className="md:w-[18px] md:h-[18px]" />
                        <span className="hidden md:inline">Add Vehicle</span>
                    </button>
                </div>
            </ModuleHeader>

            {view === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {loading ? (
                        [1, 2, 3].map(i => <div key={i} className="h-64 bg-white rounded-3xl animate-pulse border border-slate-200" />)
                    ) : vehicles.length > 0 ? (
                        vehicles.map(v => (
                            <VehicleCard
                                key={v.id}
                                vehicle={v}
                                onAssign={() => handleOpenAssign(v)}
                                onEdit={() => { setVehicleForm(v); setShowVehicleModal(true); }}
                                onDelete={() => handleDeleteVehicle(v.id)}
                            />
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center space-y-4">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                                <Bus size={40} />
                            </div>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No Vehicles Registered</p>
                            <button onClick={() => setShowVehicleModal(true)} className="text-blue-500 font-bold text-sm hover:underline">Register Fleet Now</button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-1">
                            <div className="bg-white px-4 lg:px-6 py-3 lg:py-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 shrink-0">
                                <Users size={18} className="text-blue-500 lg:w-5 lg:h-5" />
                                <div>
                                    <p className="text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Efficiency</p>
                                    <h4 className="text-lg lg:text-xl font-black text-[#001736] leading-none">{selectedVehicle?.student_count} / {selectedVehicle?.capacity}</h4>
                                </div>
                            </div>

                            {/* Reactive Search Bar */}
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    value={assignmentSearchTerm}
                                    onChange={e => setAssignmentSearchTerm(e.target.value)}
                                    placeholder="Search assigned student..."
                                    className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-[#001736] placeholder-slate-400 focus:border-slate-400 outline-none shadow-sm transition-all"
                                />
                                {assignmentSearchTerm && (
                                    <button
                                        onClick={() => setAssignmentSearchTerm('')}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={() => { setEditingAssignment(null); setAssignForm({ student_id: '', pickup_point: '' }); setStudentSearch(''); setSelectedClass(''); setShowAssignModal(true); }}
                            className="bg-[#001736] text-white px-6 py-4 rounded-2xl font-black text-[10px] lg:text-[11px] uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 active:scale-95 shrink-0"
                        >
                            <UserPlus size={18} /> <span>Assign Student</span>
                        </button>
                    </div>

                    <DataTable
                        tableClassName="min-w-[800px]"
                        headers={[
                            { label: 'Student Identity', className: 'border-r border-black text-center' },
                            { label: 'ID No', className: 'border-r border-black' },
                            { label: 'Grade', className: 'border-r border-black' },
                            { label: 'Pickup Point', className: 'border-r border-black' },
                            { label: 'Status', className: 'border-r border-black' },
                            { label: 'Action', className: 'text-center' }
                        ]}
                        columnCount={6}
                        loading={assignmentLoading}
                        emptyMessage="No Students Assigned to this Route"
                        footer={
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-institutional-muted">
                                    Showing <span className="text-[#001736]">{filteredAssignments.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0}</span> to <span className="text-[#001736]">{Math.min(currentPage * itemsPerPage, filteredAssignments.length)}</span> of <span className="text-[#001736]">{filteredAssignments.length}</span> entries
                                </p>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="px-4 py-2 bg-white border border-table rounded text-[9px] font-black uppercase tracking-widest hover:bg-[#001736] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    >
                                        Prev
                                    </button>
                                    <div className="flex items-center gap-1 px-4">
                                        <span className="text-[10px] font-black text-[#001736] uppercase">Page {currentPage} of {totalPages || 1}</span>
                                    </div>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages || totalPages === 0}
                                        className="px-4 py-2 bg-white border border-table rounded text-[9px] font-black uppercase tracking-widest hover:bg-[#001736] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        }
                    >
                        {paginatedAssignments.map(row => (
                            <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-8 py-5 border-b border-r border-black">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-black text-sm uppercase">
                                            {row.first_name?.[0]}{row.last_name?.[0]}
                                        </div>
                                        <p className="text-sm font-bold text-[#001736] uppercase">{row.last_name} {row.first_name} {row.father_name}</p>
                                    </div>
                                </td>
                                <td className="px-8 py-5 border-b border-r border-black">
                                    <span className="text-xs font-bold font-mono text-slate-400">{row.student_id_no}</span>
                                </td>
                                <td className="px-8 py-5 border-b border-r border-black">
                                    <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg uppercase">{row.grade}</span>
                                </td>
                                <td className="px-8 py-5 border-b border-r border-black italic text-slate-500 text-xs">
                                    {row.pickup_point || 'Not specified'}
                                </td>
                                <td className="px-8 py-5 border-b border-r border-black">
                                    <span className="flex items-center gap-1.5 text-[9px] font-black uppercase text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full w-fit">
                                        <CheckCircle size={10} /> {row.status}
                                    </span>
                                </td>
                                <td className="px-8 py-5 border-b border-black text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => handleEditAssignmentClick(row)}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                            title="Edit Assignment"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleRemoveStudent(row.id)}
                                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                            title="Delete Assignment"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </DataTable>
                </div>
            )}

            {/* ── Vehicle Modal ── */}
            {showVehicleModal && (
                <div className="fixed inset-0 bg-[#001736]/80 backdrop-blur-md z-100 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-2xl font-black text-[#001736] tracking-tight">{vehicleForm.id ? 'Edit Vehicle' : 'Add Vehicle'}</h3>
                                <button onClick={() => setShowVehicleModal(false)} className="p-2 hover:bg-slate-100 rounded-xl"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleVehicleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Bus Number</label>
                                        <input required value={vehicleForm.vehicle_number} onChange={e => setVehicleForm({ ...vehicleForm, vehicle_number: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:border-blue-500 outline-none" placeholder="e.g. MH-12-AB-1234" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Vehicle Type</label>
                                        <select value={vehicleForm.vehicle_type} onChange={e => setVehicleForm({ ...vehicleForm, vehicle_type: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:border-blue-500 outline-none cursor-pointer">
                                            <option value="Bus">Bus</option>
                                            <option value="Van">Van</option>
                                            <option value="Mini-Bus">Mini-Bus</option>
                                            <option value="Car">Car</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Driver Name</label>
                                        <select
                                            required
                                            value={vehicleForm.driver_name}
                                            onChange={e => {
                                                const selectedName = e.target.value;
                                                const selectedDriver = drivers.find(d => d.full_name === selectedName);
                                                setVehicleForm({
                                                    ...vehicleForm,
                                                    driver_name: selectedName,
                                                    driver_phone: selectedDriver?.mobile || vehicleForm.driver_phone || ''
                                                });
                                            }}
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:border-blue-500 outline-none cursor-pointer"
                                        >
                                            <option value="">Select Driver...</option>
                                            {drivers.map(d => (
                                                <option key={d.id} value={d.full_name}>
                                                    {d.full_name}
                                                </option>
                                            ))}
                                            {vehicleForm.driver_name && !drivers.some(d => d.full_name === vehicleForm.driver_name) && (
                                                <option value={vehicleForm.driver_name}>{vehicleForm.driver_name}</option>
                                            )}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Driver Phone</label>
                                        <input value={vehicleForm.driver_phone} onChange={e => setVehicleForm({ ...vehicleForm, driver_phone: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:border-blue-500 outline-none" placeholder="Mobile No" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Route Name</label>
                                        <input value={vehicleForm.route_name} onChange={e => setVehicleForm({ ...vehicleForm, route_name: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:border-blue-500 outline-none" placeholder="e.g. Route A" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Route Code</label>
                                        <input value={vehicleForm.route_code || ''} onChange={e => setVehicleForm({ ...vehicleForm, route_code: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:border-blue-500 outline-none" placeholder="e.g. RT-A" />
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Route Stops</label>
                                        <button
                                            type="button"
                                            onClick={() => setVehicleForm(f => ({ ...f, stops: [...(f.stops || []), { stop_name: '', distance: '' }] }))}
                                            className="text-[10px] font-black text-blue-500 hover:text-blue-700 flex items-center gap-1 uppercase"
                                        >
                                            <Plus size={12} /> Add Stop
                                        </button>
                                    </div>
                                    <div className="space-y-3 max-h-40 overflow-y-auto px-1 pb-1">
                                        {(!Array.isArray(vehicleForm.stops) || vehicleForm.stops.length === 0) ? (
                                            <div className="text-xs text-slate-400 italic text-center py-2 bg-slate-50 rounded-xl">No stops added yet</div>
                                        ) : (
                                            vehicleForm.stops.map((stop, idx) => (
                                                <div key={idx} className="flex items-center gap-3">
                                                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-[10px] font-black flex items-center justify-center shrink-0">{idx + 1}</div>
                                                    <input
                                                        required
                                                        value={stop.stop_name}
                                                        onChange={e => {
                                                            const newStops = [...vehicleForm.stops];
                                                            newStops[idx].stop_name = e.target.value;
                                                            setVehicleForm({ ...vehicleForm, stops: newStops });
                                                        }}
                                                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:border-blue-500 outline-none"
                                                        placeholder="Stop Name"
                                                    />
                                                    <input
                                                        type="number"
                                                        value={stop.distance}
                                                        onChange={e => {
                                                            const newStops = [...vehicleForm.stops];
                                                            newStops[idx].distance = e.target.value;
                                                            setVehicleForm({ ...vehicleForm, stops: newStops });
                                                        }}
                                                        className="w-24 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:border-blue-500 outline-none"
                                                        placeholder="Dist (km)"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newStops = vehicleForm.stops.filter((_, i) => i !== idx);
                                                            setVehicleForm({ ...vehicleForm, stops: newStops });
                                                        }}
                                                        className="p-2 text-slate-400 hover:text-rose-500"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                                <button type="submit" className="w-full py-5 bg-[#001736] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 active:scale-95 transition-all">Save Changes</button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Assignment Modal ── */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-[#001736]/80 backdrop-blur-md z-100 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-2xl font-black text-[#001736] tracking-tight">
                                    {editingAssignment ? 'Edit Student Assignment' : 'Assign Student'}
                                </h3>
                                <button onClick={handleCloseAssignModal} className="p-2 hover:bg-slate-100 rounded-xl"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleAssignStudent} className="space-y-4">

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Search Student</label>
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                        <input
                                            value={studentSearch}
                                            onChange={e => setStudentSearch(e.target.value)}
                                            className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none"
                                            placeholder="Name, Student ID, GR or PEN No..."
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Select Class</label>
                                        <select
                                            value={selectedClass}
                                            onChange={e => {
                                                setSelectedClass(e.target.value);
                                                setAssignForm(prev => ({ ...prev, student_id: '' }));
                                            }}
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:border-blue-500 outline-none cursor-pointer text-slate-700"
                                        >
                                            <option value="">All Classes</option>
                                            {Array.from(new Set(allStudents.map(s => (s.grade || s.current_grade || '').trim()).filter(Boolean))).sort().map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Select Student</label>
                                        <select
                                            value={assignForm.student_id}
                                            onChange={e => setAssignForm({ ...assignForm, student_id: e.target.value })}
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:border-blue-500 outline-none cursor-pointer text-slate-700"
                                        >
                                            <option value="">Select Student...</option>
                                            {editingAssignment && !availableStudents.some(s => s.id === editingAssignment.student_id) && (
                                                <option value={editingAssignment.student_id}>
                                                    {editingAssignment.last_name} {editingAssignment.first_name} {editingAssignment.father_name} ({editingAssignment.student_id_no || 'No ID'})
                                                </option>
                                            )}
                                            {availableStudents.map(s => (
                                                <option key={s.id} value={s.id}>
                                                    {s.last_name} {s.first_name} {s.father_name} ({s.student_id_no || 'No ID'})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {(() => {
                                    const selectedStudentInfo = allStudents.find(s => s.id === parseInt(assignForm.student_id) || s.id === assignForm.student_id) || editingAssignment;
                                    if (!selectedStudentInfo) return null;
                                    return (
                                        <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex flex-col gap-2 animate-in fade-in duration-300">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-sm uppercase shrink-0">
                                                    {selectedStudentInfo.first_name?.[0]}{selectedStudentInfo.last_name?.[0]}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-[#001736] uppercase leading-none mb-1">{selectedStudentInfo.last_name} {selectedStudentInfo.first_name} {selectedStudentInfo.father_name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">{selectedStudentInfo.grade || selectedStudentInfo.current_grade}</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-blue-100 text-[10px] font-bold text-slate-500 uppercase">
                                                <div>
                                                    <span className="block text-[8px] text-slate-400 tracking-wider">Student ID</span>
                                                    <span className="font-mono text-[#001736]">{selectedStudentInfo.student_id_no || '—'}</span>
                                                </div>
                                                <div>
                                                    <span className="block text-[8px] text-slate-400 tracking-wider">GR Number</span>
                                                    <span className="font-mono text-[#001736]">{selectedStudentInfo.gr_no || '—'}</span>
                                                </div>
                                                <div>
                                                    <span className="block text-[8px] text-slate-400 tracking-wider">PEN Number</span>
                                                    <span className="font-mono text-[#001736]">{selectedStudentInfo.pen_no || '—'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Pickup Point</label>
                                    <select
                                        value={assignForm.pickup_point}
                                        onChange={e => setAssignForm({ ...assignForm, pickup_point: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:border-blue-500 outline-none cursor-pointer"
                                    >
                                        <option value="">-- Select Stop --</option>
                                        {selectedVehicle?.stops?.map((stop, i) => (
                                            <option key={stop.id || i} value={stop.stop_name}>{stop.stop_name}</option>
                                        ))}
                                        {assignForm.pickup_point && !selectedVehicle?.stops?.some(s => s.stop_name === assignForm.pickup_point) && (
                                            <option value={assignForm.pickup_point}>{assignForm.pickup_point} (Legacy)</option>
                                        )}
                                    </select>
                                </div>
                                <button type="submit" className="w-full py-5 bg-amber-400 text-[#001736] rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-white active:scale-95 transition-all">
                                    {editingAssignment ? "Update Assignment" : "Assign To Bus"}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Custom Premium Confirmation Modal ── */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-[#001736]/80 backdrop-blur-md z-110 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 text-center space-y-6">
                            {/* Icon */}
                            <div className="w-16 h-16 bg-rose-50 border-2 border-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                                <ShieldAlert size={28} />
                            </div>

                            {/* Heading / Message */}
                            <div className="space-y-2">
                                <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">Confirm Delete Operation</h4>
                                <p className="text-[12px] text-slate-500 font-bold uppercase tracking-wide leading-relaxed">
                                    {confirmMessage}
                                </p>
                            </div>

                            {/* Info Warnings */}
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-bold text-slate-500 uppercase tracking-wider text-left flex items-start gap-3">
                                <Info size={16} className="text-[#001736] shrink-0 mt-0.5" />
                                <span>This operation is highly sensitive and cannot be undone once committed to the registry.</span>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-4 pt-2">
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    className="flex-1 py-4 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        setShowConfirmModal(false);
                                        if (confirmAction) await confirmAction();
                                    }}
                                    className="flex-1 py-4 bg-rose-600 text-white hover:bg-rose-700 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-500/20 transition-all active:scale-95"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

const VehicleCard = ({ vehicle, onAssign, onEdit, onDelete }) => (
    <div className="bg-white rounded-4xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col relative">
        {/* Status Indicator */}
        <div className={`absolute top-6 right-6 w-2.5 h-2.5 rounded-full ${vehicle.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'} shadow-[0_0_10px_rgba(0,0,0,0.1)]`} />

        <div className="p-8 pb-4">
            <div className="flex items-start justify-between">
                <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-amber-400 shadow-xl group-hover:scale-110 transition-transform duration-500">
                    <Bus size={28} />
                </div>
                <div className="flex items-center gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={onEdit} className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all"><Edit size={16} /></button>
                    <button onClick={onDelete} className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all"><Trash2 size={16} /></button>
                </div>
            </div>

            <div className="mt-6">
                <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 border border-slate-200">
                        {vehicle.vehicle_type || 'Bus'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100">
                        {vehicle.route_code || 'No Code'}
                    </span>
                </div>
                <h4 className="text-xl font-black text-[#001736] tracking-tight leading-none mb-1 uppercase">{vehicle.vehicle_number}</h4>
                <div className="flex items-center justify-between mt-2">
                    <p className="text-[10px] font-black uppercase text-black tracking-[0.2em]">{vehicle.official_route_name || vehicle.route_name || 'No Route Assigned'}</p>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{vehicle.stops?.length || 0} Stops</span>
                </div>
            </div>
        </div>

        <div className="px-8 py-4 grid grid-cols-2 gap-4 border-t border-b border-slate-50 italic">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                    <Users size={14} />
                </div>
                <div>
                    <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest leading-none">Students</p>
                    <p className="text-xs font-bold text-[#001736]">{vehicle.student_count} / {vehicle.capacity}</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                    <Phone size={14} />
                </div>
                <div>
                    <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest leading-none">Driver</p>
                    <p className="text-xs font-bold text-[#001736] truncate">{vehicle.driver_name}</p>
                </div>
            </div>
        </div>

        <div className="p-6 mt-auto">
            <button
                onClick={onAssign}
                className="w-full py-4 bg-[#F8FAFC] border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest text-[#001736] hover:bg-[#001736] hover:text-white hover:border-[#001736] transition-all flex items-center justify-center gap-2 group/btn"
            >
                View Assigned Students <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
            </button>
        </div>
    </div>
);

export default Transport;
