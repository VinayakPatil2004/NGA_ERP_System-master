import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAcademicYear } from '../../../../context/AcademicYearContext';
import { 
    UserPlus, 
    Camera, 
    Search, 
    Clock, 
    User, 
    Phone, 
    FileText,
    BadgeCheck,
    XCircle,
    Timer,
    ChevronDown,
    Edit,
    Trash2
} from 'lucide-react';
import ModuleHeader from '../../../admcomponents/ModuleHeader';

const VisitorManagement = ({ toggleSidebar }) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const [visitors, setVisitors] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const { selectedYear } = useAcademicYear();
    const [editId, setEditId] = useState(null);
    const [selectedVisitor, setSelectedVisitor] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Form State
    const [newVisitor, setNewVisitor] = useState({
        name: '',
        phone: '',
        purpose: '',
        staff_id: '',
        photo_url: ''
    });

    // Camera Refs
    const videoRef = useRef(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);

    const fetchVisitors = React.useCallback(async () => {
        if (!selectedYear) return;
        try {
            setLoading(true);
            const token = localStorage.getItem('slpaems_erp_token');
            const response = await axios.get(`${API_URL}/api/security/visitors?academic_year_id=${selectedYear.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setVisitors(response.data);
        } catch (error) {
            console.error("Error fetching visitors:", error);
        } finally {
            setLoading(false);
        }
    }, [API_URL, selectedYear]);

    const fetchStaff = React.useCallback(async () => {
        try {
            const token = localStorage.getItem('slpaems_erp_token');
            const response = await axios.get(`${API_URL}/api/staff/all`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStaffList(response.data);
        } catch (error) {
            console.error("Error fetching staff:", error);
        }
    }, [API_URL]);

    useEffect(() => {
        fetchVisitors();
        fetchStaff();
    }, [fetchVisitors, fetchStaff]);

    const handleStartCamera = async () => {
        setIsCameraOpen(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (error) {
            console.error(error);
            toast.error("Could not access camera");
        }
    };

    const handleCapture = () => {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
        const photo = canvas.toDataURL('image/jpeg');
        setNewVisitor({ ...newVisitor, photo_url: photo });
        
        // Stop stream
        const stream = videoRef.current.srcObject;
        stream.getTracks().forEach(track => track.stop());
        setIsCameraOpen(false);
    };

    const handleRegisterVisitor = async (e) => {
        e.preventDefault();
        if (!newVisitor.staff_id) {
            return toast.warning("Please select a staff member to meet");
        }
        if (!newVisitor.photo_url) {
            return toast.warning("Please capture a visitor photo first");
        }
        try {
            const token = localStorage.getItem('slpaems_erp_token');
            const payload = { ...newVisitor, academic_year_id: selectedYear?.id };
            if (editId) {
                await axios.put(`${API_URL}/api/security/visitors/${editId}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success("Visitor details updated");
            } else {
                await axios.post(`${API_URL}/api/security/visitors`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success("Visitor registered. Waiting for staff approval.");
            }
            setShowRegisterModal(false);
            setEditId(null);
            setNewVisitor({ name: '', phone: '', purpose: '', staff_id: '', photo_url: '' });
            fetchVisitors();
        } catch (err) {
            console.error(err);
            toast.error("Failed to register visitor");
        }
    };

    const handleDeleteVisitor = async (id) => {
        if (!window.confirm("Are you sure you want to delete this visitor record?")) return;
        try {
            const token = localStorage.getItem('slpaems_erp_token');
            await axios.delete(`${API_URL}/api/security/visitors/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Visitor record deleted");
            fetchVisitors();
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete visitor record");
        }
    };

    const handleEditClick = (v) => {
        setNewVisitor({
            name: v.name,
            phone: v.phone,
            purpose: v.purpose,
            staff_id: v.staff_id || '',
            photo_url: v.photo_url || ''
        });
        setEditId(v.id);
        setShowRegisterModal(true);
    };

    const filteredVisitors = (Array.isArray(visitors) ? visitors : []).filter(v => 
        v.name?.toLowerCase().includes(search.toLowerCase()) || 
        v.phone?.includes(search)
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    const paginatedVisitors = filteredVisitors.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 min-h-screen bg-[#F8FAFC] font-sans text-left">
            <ModuleHeader 
                title="Visitor Management System" 
                subTitle="Register and track institution visitors" 
                toggleSidebar={toggleSidebar} 
            >
                <button 
                    onClick={() => {
                        setEditId(null);
                        setNewVisitor({ name: '', phone: '', purpose: '', staff_id: '', photo_url: '' });
                        setShowRegisterModal(true);
                    }}
                    className="bg-white text-[#001736] px-4 py-2 sm:px-8 sm:py-3 rounded-xl text-[10px] sm:text-[11px] font-bold hover:bg-slate-50 transition-all flex items-center gap-3 shadow-lg active:scale-95 uppercase tracking-widest whitespace-nowrap"
                >
                    <UserPlus className="w-4 h-4" />
                    <span className="hidden sm:inline">Register New Visitor</span>
                    <span className="sm:hidden">New</span>
                </button>
            </ModuleHeader>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Total Visits', value: visitors.length, icon: User, color: 'indigo' },
                    { label: 'Pending Approval', value: visitors.filter(v => v.status === 'pending').length, icon: Timer, color: 'amber' },
                    { label: 'Approved Today', value: visitors.filter(v => v.status === 'approved').length, icon: BadgeCheck, color: 'emerald' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
                        <div className={`w-12 h-12 rounded-xl bg-${stat.color}-50 flex items-center justify-center`}>
                            <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                            <p className="text-2xl font-bold text-[#001736]">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Search visitors by name or phone..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all placeholder:text-slate-400"
                    />
                </div>
            </div>

            {/* Visitors Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {loading ? (
                    <div className="col-span-full py-12 text-center text-slate-400 italic">Loading visitors...</div>
                ) : paginatedVisitors.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-slate-400 italic">No visitors found</div>
                ) : paginatedVisitors.map(v => (
                    <div key={v.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
                        <div className="h-32 relative overflow-hidden bg-slate-100 shrink-0">
                            <img 
                                src={v.photo_url ? (v.photo_url.startsWith('data:') ? v.photo_url : v.photo_url) : 'https://ui-avatars.com/api/?name=' + v.name + '&background=F1F5F9&color=94A3B8'} 
                                alt={v.name} 
                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                            <div className={`absolute top-2 right-2 px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest border backdrop-blur-md shadow-sm
                                ${v.status === 'approved' ? 'bg-emerald-500/90 text-white border-emerald-400' : 
                                  v.status === 'rejected' ? 'bg-rose-500/90 text-white border-rose-400' : 
                                  'bg-amber-500/90 text-white border-amber-400'}`}>
                                {v.status}
                            </div>
                        </div>
                        <div className="p-3 space-y-2 flex-1 flex flex-col">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="text-sm font-bold text-[#001736] tracking-tight line-clamp-1">{v.name}</h4>
                                    <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 mt-0.5">
                                        <Phone className="w-2.5 h-2.5" />
                                        {v.phone}
                                    </div>
                                </div>
                                <div className="flex items-center gap-0.5 shrink-0">
                                    <button onClick={() => handleEditClick(v)} className="p-1 bg-slate-50 text-indigo-600 rounded hover:bg-indigo-50 transition-colors">
                                        <Edit className="w-3 h-3" />
                                    </button>
                                    <button onClick={() => handleDeleteVisitor(v.id)} className="p-1 bg-slate-50 text-rose-600 rounded hover:bg-rose-50 transition-colors">
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1 pt-2 border-t border-slate-100 flex-1">
                                <div className="flex justify-between items-center">
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Meeting With</span>
                                    <span className="text-[8px] font-bold text-indigo-600 uppercase line-clamp-1 max-w-[60%] text-right">{v.staff_name || 'Staff Not Assigned'}</span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Purpose</span>
                                    <p className="text-[10px] text-slate-600 line-clamp-2 leading-relaxed">{v.purpose}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                <div className="flex items-center gap-1 text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                    <Clock className="w-2.5 h-2.5" />
                                    {new Date(v.created_at).toLocaleDateString()}
                                </div>
                                <button 
                                    onClick={() => {
                                        setSelectedVisitor(v);
                                        setShowDetailsModal(true);
                                    }}
                                    className="text-[8px] font-bold text-indigo-600 uppercase tracking-widest hover:underline"
                                >
                                    Details
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination Controls */}
            {filteredVisitors.length > itemsPerPage && (
                <div className="bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#001736] opacity-60">
                        Showing <span className="font-bold">{filteredVisitors.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold">{Math.min(currentPage * itemsPerPage, filteredVisitors.length)}</span> of <span className="font-bold">{filteredVisitors.length}</span> Visitors
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                        >
                            Prev
                        </button>
                        <div className="px-4 text-[10px] font-black text-[#001736] uppercase tracking-widest">
                            Page {currentPage} of {Math.ceil(filteredVisitors.length / itemsPerPage) || 1}
                        </div>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredVisitors.length / itemsPerPage), p + 1))}
                            disabled={currentPage === Math.ceil(filteredVisitors.length / itemsPerPage) || Math.ceil(filteredVisitors.length / itemsPerPage) === 0}
                            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Register Modal */}
            {showRegisterModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-100 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-white/20 animate-in fade-in zoom-in duration-300 overflow-hidden">
                        <div className="flex flex-col md:flex-row max-h-[90vh]">
                            {/* Left Side: Photo Capture */}
                            <div className="md:w-1/2 bg-slate-50 p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100">
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Visitor Photo</h3>
                                <div className="w-full aspect-square rounded-2xl bg-white border-2 border-dashed border-slate-200 overflow-hidden relative group">
                                    {isCameraOpen ? (
                                        <video ref={videoRef} autoPlay className="w-full h-full object-cover" />
                                    ) : newVisitor.photo_url ? (
                                        <img src={newVisitor.photo_url} alt="Capture" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                                            <Camera className="w-12 h-12 mb-2" />
                                            <p className="text-xs font-bold uppercase tracking-widest">No photo captured</p>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-6 w-full gap-3 flex flex-col">
                                    {isCameraOpen ? (
                                        <button 
                                            onClick={handleCapture}
                                            className="w-full bg-emerald-600 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-emerald-700"
                                        >
                                            <Camera className="w-4 h-4" />
                                            Capture Photo
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={handleStartCamera}
                                            className="w-full bg-[#001736] text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#002b64]"
                                        >
                                            <Camera className="w-4 h-4" />
                                            {newVisitor.photo_url ? 'Retake Photo' : 'Start Camera'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Right Side: Form */}
                            <div className="md:w-1/2 p-8 overflow-y-auto">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-xl font-bold text-[#001736] tracking-tight uppercase">{editId ? 'Edit Visitor' : 'Registration'}</h3>
                                        <p className="text-xs font-medium text-slate-400">Enter visitor information</p>
                                    </div>
                                    <button onClick={() => setShowRegisterModal(false)} className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">×</button>
                                </div>

                                <form onSubmit={handleRegisterVisitor} className="space-y-5">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                            <input 
                                                type="text" required
                                                value={newVisitor.name}
                                                onChange={(e) => setNewVisitor({...newVisitor, name: e.target.value})}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm font-bold text-[#001736] focus:outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all placeholder:text-slate-300"
                                                placeholder="Visitor Name"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                                        <div className="relative group">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                            <input 
                                                type="tel" required
                                                pattern="\d{10}"
                                                maxLength="10"
                                                title="Please enter exactly 10 digits"
                                                value={newVisitor.phone}
                                                onChange={(e) => setNewVisitor({...newVisitor, phone: e.target.value.replace(/\D/g, '').slice(0,10)})}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm font-bold text-[#001736] focus:outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all placeholder:text-slate-300"
                                                placeholder="10-digit Mobile Number"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Meeting With (Staff)</label>
                                        <div className="relative group">
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors z-10" />
                                            <select 
                                                required
                                                value={newVisitor.staff_id}
                                                onChange={(e) => setNewVisitor({...newVisitor, staff_id: e.target.value})}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-5 text-sm font-bold text-[#001736] appearance-none focus:outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all"
                                            >
                                                <option value="">Select Staff Member</option>
                                                {staffList.map(s => (
                                                    <option key={s.id} value={s.id}>{s.full_name} ({s.department || 'Staff'})</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Purpose of Visit</label>
                                        <div className="relative group">
                                            <FileText className="absolute left-4 top-3.5 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                            <textarea 
                                                required
                                                value={newVisitor.purpose}
                                                onChange={(e) => setNewVisitor({...newVisitor, purpose: e.target.value})}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm font-medium text-[#001736] focus:outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all placeholder:text-slate-300 min-h-[100px]"
                                                placeholder="Why are they visiting?"
                                            />
                                        </div>
                                    </div>

                                    <button 
                                        type="submit"
                                        className="w-full bg-[#001736] text-white py-4 rounded-2xl text-xs font-bold uppercase tracking-[0.2em] shadow-lg shadow-blue-900/10 hover:bg-[#002b64] transition-all active:scale-[0.98] mt-4"
                                    >
                                        {editId ? 'Update Registration' : 'Submit for Approval'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* View Details Modal */}
            {showDetailsModal && selectedVisitor && (
                <div className="fixed inset-0 bg-[#001736]/80 backdrop-blur-sm z-100 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                            <h4 className="text-lg font-black text-[#001736] uppercase tracking-tighter">Visitor Details</h4>
                            <button onClick={() => setShowDetailsModal(false)} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors">×</button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-24 h-24 rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50">
                                    <img 
                                        src={selectedVisitor.photo_url ? (selectedVisitor.photo_url.startsWith('data:') ? selectedVisitor.photo_url : selectedVisitor.photo_url) : 'https://ui-avatars.com/api/?name=' + selectedVisitor.name + '&background=F1F5F9&color=94A3B8'} 
                                        alt={selectedVisitor.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-lg font-black text-[#001736] uppercase tracking-tight">{selectedVisitor.name}</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{selectedVisitor.phone}</p>
                                </div>
                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border
                                    ${selectedVisitor.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                      selectedVisitor.status === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                                      'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                    {selectedVisitor.status}
                                </span>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-slate-100">
                                <div className="flex justify-between items-center text-left">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Meeting With</span>
                                    <span className="text-xs font-bold text-[#001736] uppercase">{selectedVisitor.staff_name || 'Staff Not Assigned'}</span>
                                </div>
                                <div className="flex justify-between items-center text-left">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Visit Date</span>
                                    <span className="text-xs font-bold text-[#001736]">{new Date(selectedVisitor.created_at || selectedVisitor.visit_date).toLocaleDateString()}</span>
                                </div>
                                <div className="space-y-2 text-left">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Purpose of Visit</span>
                                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                        <p className="text-xs text-slate-600 leading-relaxed italic">"{selectedVisitor.purpose}"</p>
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={() => setShowDetailsModal(false)}
                                className="w-full py-4 bg-[#001736] text-white rounded-2xl text-xs font-bold uppercase tracking-[0.2em] shadow-lg hover:bg-[#002b64] transition-all active:scale-[0.98]"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VisitorManagement;
