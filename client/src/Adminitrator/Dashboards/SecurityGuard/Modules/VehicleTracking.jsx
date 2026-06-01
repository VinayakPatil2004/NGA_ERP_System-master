import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAcademicYear } from '../../../../context/AcademicYearContext';
import { 
    Bus, 
    Car, 
    Search, 
    Clock, 
    LogOut,
    Truck,
    Plus,
    History,
    Edit,
    Trash2
} from 'lucide-react';
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import DataTable from '../../../admcomponents/DataTable';

const VehicleTracking = ({ toggleSidebar }) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const [logs, setLogs] = useState([]);
    const [, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({
        vehicle_no: '',
        vehicle_type: 'private',
        driver_name: '',
        purpose: ''
    });
     const [editId, setEditId] = useState(null);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const { selectedYear } = useAcademicYear();

    const fetchLogs = React.useCallback(async () => {
        if (!selectedYear) return;
        try {
            setLoading(true);
            const token = localStorage.getItem('slpaems_erp_token');
            const response = await axios.get(`${API_URL}/api/security/vehicles?academic_year_id=${selectedYear.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (Array.isArray(response.data)) {
                setLogs(response.data);
            } else {
                setLogs([]);
            }
        } catch (error) {
            console.error("Error fetching vehicle logs:", error);
        } finally {
            setLoading(false);
        }
    }, [API_URL, selectedYear]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleAddLog = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('slpaems_erp_token');
            const payload = { ...formData, academic_year_id: selectedYear?.id };
            if (editId) {
                await axios.put(`${API_URL}/api/security/vehicles/${editId}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success("Vehicle entry updated");
            } else {
                await axios.post(`${API_URL}/api/security/vehicles`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success("Vehicle entry logged");
            }
            setShowAddModal(false);
            setEditId(null);
            setFormData({ vehicle_no: '', vehicle_type: 'private', driver_name: '', purpose: '' });
            fetchLogs();
        } catch (err) {
            console.error(err);
            toast.error("Failed to save vehicle entry");
        }
    };

    const handleDeleteLog = async (id) => {
        if (!window.confirm("Are you sure you want to delete this log?")) return;
        try {
            const token = localStorage.getItem('slpaems_erp_token');
            await axios.delete(`${API_URL}/api/security/vehicles/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Vehicle log deleted successfully");
            fetchLogs();
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete log");
        }
    };

    const handleEditClick = (log) => {
        setFormData({
            vehicle_no: log.vehicle_no,
            vehicle_type: log.vehicle_type,
            driver_name: log.driver_name || '',
            purpose: log.purpose || ''
        });
        setEditId(log.id);
        setShowAddModal(true);
    };

    const handleLogExit = async (logId) => {
        try {
            const token = localStorage.getItem('slpaems_erp_token');
            await axios.put(`${API_URL}/api/security/vehicles/${logId}/exit`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Vehicle exit recorded");
            fetchLogs();
        } catch (err) {
            console.error(err);
            toast.error("Failed to record exit");
        }
    };

    const filteredLogs = (Array.isArray(logs) ? logs : []).filter(log => {
        return log.vehicle_no.toLowerCase().includes(search.toLowerCase());
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
    const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const columns = [
        {
            key: 'vehicle_no',
            label: 'Vehicle No',
            render: (log) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200">
                        {log.vehicle_type === 'school_bus' ? <Bus className="w-5 h-5 text-blue-600" /> : <Car className="w-5 h-5 text-emerald-600" />}
                    </div>
                    <span className="text-sm font-black text-[#001736] tracking-tighter uppercase">{log.vehicle_no}</span>
                </div>
            )
        },
        {
            key: 'type',
            label: 'Type',
            render: (log) => (
                <span className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border
                    ${log.vehicle_type === 'school_bus' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                    {log.vehicle_type.replace('_', ' ')}
                </span>
            )
        },
        {
            key: 'driver',
            label: 'Driver',
            render: (log) => <span className="text-xs font-bold text-slate-600">{log.driver_name || 'N/A'}</span>
        },
        {
            key: 'entry_exit',
            label: 'Entry / Exit',
            render: (log) => (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-[#001736]">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        IN: {new Date(log.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {log.exit_time && (
                        <div className="flex items-center gap-2 text-[10px] font-bold text-rose-500">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            OUT: {new Date(log.exit_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    )}
                </div>
            )
        },
        {
            key: 'status',
            label: 'Status',
            render: (log) => (
                log.exit_time ? (
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        Departed
                    </span>
                ) : (
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2 italic">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        On Premises
                    </span>
                )
            )
        },
        {
            key: 'action',
            label: 'Action',
            align: 'right',
            render: (log) => (
                <div className="flex items-center justify-end gap-2">
                    {!log.exit_time && (
                        <button 
                            onClick={() => handleLogExit(log.id)}
                            className="bg-emerald-50 text-emerald-600 p-2 rounded-lg text-xs hover:bg-emerald-100 hover:shadow-sm transition-all"
                            title="Record Exit"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    )}
                    <button 
                        onClick={() => handleEditClick(log)}
                        className="bg-indigo-50 text-indigo-600 p-2 rounded-lg text-xs hover:bg-indigo-100 transition-all"
                        title="Edit Entry"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => handleDeleteLog(log.id)}
                        className="bg-rose-50 text-rose-600 p-2 rounded-lg text-xs hover:bg-rose-100 transition-all"
                        title="Delete Entry"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 min-h-screen bg-[#F8FAFC] font-sans text-left">
            <ModuleHeader 
                title="Vehicle Tracking System" 
                subTitle="Monitor institutional fleet and private vehicles" 
                toggleSidebar={toggleSidebar} 
            >
                <button 
                    onClick={() => {
                        setEditId(null);
                        setFormData({ vehicle_no: '', vehicle_type: 'private', driver_name: '', purpose: '' });
                        setShowAddModal(true);
                    }}
                    className="bg-white text-[#001736] px-4 py-2 sm:px-8 sm:py-3 rounded-xl text-[10px] sm:text-[11px] font-bold hover:bg-slate-50 transition-all flex items-center gap-3 shadow-lg active:scale-95 uppercase tracking-widest whitespace-nowrap"
                >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Record Vehicle Entry</span>
                    <span className="sm:hidden">New Entry</span>
                </button>
            </ModuleHeader>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                        <History className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Logs</p>
                        <p className="text-2xl font-bold text-[#001736]">{logs.length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
                        <Bus className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Fleet</p>
                        <p className="text-2xl font-bold text-[#001736]">
                            {(Array.isArray(logs) ? logs : []).filter(l => l.vehicle_type === 'school_bus' && !l.exit_time).length}
                        </p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                        <Car className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Private Inside</p>
                        <p className="text-2xl font-bold text-[#001736]">
                            {(Array.isArray(logs) ? logs : []).filter(l => l.vehicle_type === 'private' && !l.exit_time).length}
                        </p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100">
                        <Truck className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Deliveries</p>
                        <p className="text-2xl font-bold text-[#001736]">
                            {(Array.isArray(logs) ? logs : []).filter(l => l.purpose.toLowerCase().includes('delivery') && !l.exit_time).length}
                        </p>
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4 sm:gap-6 mb-6">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Search by number plate..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 sm:py-3.5 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all placeholder:text-slate-400"
                    />
                </div>
                <button 
                    onClick={fetchLogs}
                    className="w-full md:w-auto p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-[#001736] hover:border-slate-300 transition-all active:rotate-180 duration-500 flex justify-center ml-auto"
                    title="Refresh Data"
                >
                    <Clock className="w-5 h-5" />
                </button>
            </div>

            <DataTable 
                headers={columns}
                emptyMessage="No vehicle activity logged today"
                footer={
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#64748B]">
                            Showing <span className="text-[#001736]">{filteredLogs.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0}</span> to <span className="text-[#001736]">{Math.min(currentPage * itemsPerPage, filteredLogs.length)}</span> of <span className="text-[#001736]">{filteredLogs.length}</span> Records
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
                }
            >
                {paginatedLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors border-b-table group">
                        {columns.map(col => (
                            <td key={col.key} className={`px-4 sm:px-6 py-4 text-sm ${col.align === 'right' ? 'text-right' : 'text-left'} border-r-table`}>
                                {col.render(log)}
                            </td>
                        ))}
                    </tr>
                ))}
            </DataTable>

            {/* Add Vehicle Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-100 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-white/20 animate-in fade-in zoom-in duration-300">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-[#001736] tracking-tight uppercase">{editId ? 'Edit Vehicle Entry' : 'Vehicle Entry'}</h3>
                                <p className="text-xs font-medium text-slate-400 mt-1">Traffic monitoring protocol</p>
                            </div>
                            <button onClick={() => setShowAddModal(false)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">×</button>
                        </div>
                        
                        <form onSubmit={handleAddLog} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Vehicle Type</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['school_bus', 'private'].map(type => (
                                        <button 
                                            key={type}
                                            type="button"
                                            onClick={() => setFormData({...formData, vehicle_type: type})}
                                            className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all
                                                ${formData.vehicle_type === type 
                                                    ? 'bg-[#001736] text-white border-[#001736] shadow-lg' 
                                                    : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-300'}`}
                                        >
                                            {type.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2 text-left">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Vehicle Number</label>
                                <input 
                                    type="text" 
                                    required
                                    value={formData.vehicle_no}
                                    onChange={(e) => setFormData({...formData, vehicle_no: e.target.value})}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-5 text-sm font-black text-[#001736] focus:outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all placeholder:text-slate-300 uppercase"
                                    placeholder="MH 12 AB 1234"
                                />
                            </div>

                            <div className="space-y-2 text-left">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Driver Name</label>
                                <input 
                                    type="text" 
                                    value={formData.driver_name}
                                    onChange={(e) => setFormData({...formData, driver_name: e.target.value})}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-5 text-sm font-bold text-[#001736] focus:outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all placeholder:text-slate-300"
                                    placeholder="Enter Driver's Name"
                                />
                            </div>

                            <div className="space-y-2 text-left">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Purpose / Remarks</label>
                                <input 
                                    type="text" 
                                    value={formData.purpose}
                                    onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-5 text-sm font-medium text-[#001736] focus:outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all placeholder:text-slate-300"
                                    placeholder="e.g. Student Pickup, Delivery"
                                />
                            </div>

                            <button 
                                type="submit"
                                className="w-full bg-[#001736] text-white py-4 rounded-xl text-xs font-bold uppercase tracking-[0.2em] shadow-lg shadow-blue-900/10 hover:bg-[#002b64] transition-all active:scale-[0.98] mt-4"
                            >
                                {editId ? 'Update Vehicle Entry' : 'Confirm Vehicle Entry'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VehicleTracking;
