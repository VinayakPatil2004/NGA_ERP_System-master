import React, { useState, useEffect } from 'react';
import API, { ROOT_URL } from '../../../../services/API';
import { toast } from 'react-toastify';
import { useAcademicYear } from '../../../../context/AcademicYearContext';
import { 
    DoorOpen, 
    ScanLine, 
    Search, 
    Filter, 
    Clock, 
    LogOut,
    UserCircle,
    BadgeCheck,
    Edit,
    Trash2,
    Camera
} from 'lucide-react';
import { Html5QrcodeScanner } from "html5-qrcode";
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import DataTable from '../../../admcomponents/DataTable';

const GateEntry = ({ toggleSidebar }) => {
    const [entries, setEntries] = useState([]);
    const [, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const { selectedYear } = useAcademicYear();
    const [filterType, setFilterType] = useState('all');
    const [showScanner, setShowScanner] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // New Entry Form State
    const [showEntryModal, setShowEntryModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [newEntry, setNewEntry] = useState({
        entry_type: 'student',
        person_id: '',
        remarks: '',
        photo_url: ''
    });

    const [classrooms, setClassrooms] = useState([]);
    const [students, setStudents] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');

    const fetchEntries = React.useCallback(async () => {
        if (!selectedYear) return;
        try {
            setLoading(true);
            const response = await API.get(`/security/entries?academic_year_id=${selectedYear.id}`);
            if (Array.isArray(response.data)) {
                setEntries(response.data);
            } else {
                setEntries([]);
            }
        } catch (error) {
            console.error("Error fetching entries:", error);
        } finally {
            setLoading(false);
        }
    }, [selectedYear]);

    useEffect(() => {
        fetchEntries();
    }, [fetchEntries]);

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const [clsRes, stuRes, stfRes] = await Promise.all([
                    API.get(`/classrooms`).catch(() => ({data: []})),
                    API.get(`/students/all`).catch(() => ({data: []})),
                    API.get(`/staff/all`).catch(() => ({data: []}))
                ]);
                
                setClassrooms(clsRes.data || []);
                setStudents(stuRes.data || []);
                setStaffList(stfRes.data || []);
            } catch (err) {
                console.error("Error fetching options:", err);
            }
        };
        fetchOptions();
    }, []);

    useEffect(() => {
        let scanner = null;
        if (showScanner) {
            scanner = new Html5QrcodeScanner("reader-entry", { 
                fps: 10, 
                qrbox: { width: 250, height: 250 } 
            }, false);

            scanner.render((decodedText) => {
                let parsedId = decodedText;
                try {
                    const data = JSON.parse(decodedText);
                    parsedId = data.id || data.student_id || data.staff_id || data.student_id_no || data.employee_id || parsedId;
                } catch (e) {
                    console.warn("QR code is not JSON:", e.message);
                    if (parsedId.includes('/')) {
                        parsedId = parsedId.split('/').pop();
                    }
                }
                
                setEditId(null);
                setNewEntry(prev => ({ ...prev, person_id: parsedId }));
                setShowEntryModal(true);
                scanner.clear();
                setShowScanner(false);
                toast.info(`ID Scanned: ${parsedId}`);
            }, () => {
                // console.warn("Scan error");
            });
        }

        return () => {
            if (scanner) {
                scanner.clear().catch(err => console.error("Scanner cleanup error:", err));
            }
        };
    }, [showScanner]);

    const handleLogExit = async (entryId) => {
        try {
            await API.put(`/security/entries/${entryId}/exit`);
            toast.success("Exit recorded successfully");
            fetchEntries();
        } catch (err) {
            console.error(err);
            toast.error("Failed to record exit");
        }
    };

    const handleAddEntry = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...newEntry, academic_year_id: selectedYear?.id };
            if (editId) {
                await API.put(`/security/entries/${editId}`, payload);
                toast.success("Entry updated successfully");
            } else {
                await API.post(`/security/entries`, payload);
                toast.success("Entry logged successfully");
            }
            setShowEntryModal(false);
            setEditId(null);
            setNewEntry({ entry_type: 'student', person_id: '', remarks: '', photo_url: '' });
            setSelectedClass('');
            fetchEntries();
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to save entry");
        }
    };

    const handleEditClick = (entry) => {
        setNewEntry({
            entry_type: entry.entry_type || 'student',
            person_id: entry.person_id || '',
            remarks: entry.remarks || '',
            photo_url: entry.photo_url || ''
        });
        setEditId(entry.id);
        setShowEntryModal(true);
    };

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewEntry({ ...newEntry, photo_url: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDeleteEntry = async (id) => {
        if (!window.confirm("Are you sure you want to delete this entry?")) return;
        try {
            await API.delete(`/security/entries/${id}`);
            toast.success("Entry deleted successfully");
            fetchEntries();
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete entry");
        }
    };

    const filteredEntries = (Array.isArray(entries) ? entries : []).filter(entry => {
        const entryPersonName = (entry.person_name || '').toLowerCase();
        const entryPersonId = (entry.person_id || '').toString().toLowerCase();
        const searchTerm = search.toLowerCase();

        const matchesSearch = entryPersonName.includes(searchTerm) || entryPersonId.includes(searchTerm);
        const matchesType = filterType === 'all' || entry.entry_type === filterType;
        
        return matchesSearch && matchesType;
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [search, filterType]);

    const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);
    const paginatedEntries = filteredEntries.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const columns = [
        {
            key: 'personnel',
            label: 'Personnel',
            render: (entry) => (
                <div className="flex items-center gap-4">
                    {entry.photo_url && (
                        <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-slate-200">
                            <img src={`${ROOT_URL}${entry.photo_url}`} alt="Entry" className="w-full h-full object-cover" onError={(e) => { e.target.src = entry.photo_url.startsWith('data:') ? entry.photo_url : 'https://ui-avatars.com/api/?name=' + entry.person_name }} />
                        </div>
                    )}
                    {!entry.photo_url && (
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                            <UserCircle className="w-6 h-6 text-slate-400" />
                        </div>
                    )}
                    <div>
                        <p className="text-sm font-bold text-[#001736] tracking-tight">{entry.person_name || 'Unknown'}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">ID: {entry.person_id}</p>
                    </div>
                </div>
            )
        },
        {
            key: 'category',
            label: 'Category',
            render: (entry) => (
                <span className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border
                    ${entry.entry_type === 'student' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 
                      entry.entry_type === 'staff' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                      'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                    {entry.entry_type}
                </span>
            )
        },
        {
            key: 'entry_time',
            label: 'Entry Time',
            render: (entry) => (
                <div className="flex items-center gap-2 text-slate-600 font-medium text-xs">
                    <Clock className="w-3.5 h-3.5 text-slate-300" />
                    {new Date(entry.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    <span className="text-slate-300 mx-1">|</span>
                    {new Date(entry.entry_time).toLocaleDateString()}
                </div>
            )
        },
        {
            key: 'exit_time',
            label: 'Exit Time',
            render: (entry) => (
                entry.exit_time ? (
                    <div className="flex items-center gap-2 text-slate-600 font-medium text-xs">
                        <Clock className="w-3.5 h-3.5 text-slate-300" />
                        {new Date(entry.exit_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                ) : (
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1.5 italic">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Still Inside
                    </span>
                )
            )
        },
        {
            key: 'status',
            label: 'Status',
            render: (entry) => (
                entry.exit_time ? (
                    <span className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                        <BadgeCheck className="w-4 h-4" />
                        Completed
                    </span>
                ) : (
                    <span className="flex items-center gap-2 text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                        <div className="w-3 h-3 rounded-full bg-blue-600" />
                        Active
                    </span>
                )
            )
        },
        {
            key: 'action',
            label: 'Action',
            align: 'right',
            render: (entry) => (
                <div className="flex items-center justify-end gap-2">
                    {!entry.exit_time && (
                        <button 
                            onClick={() => handleLogExit(entry.id)}
                            className="bg-emerald-50 text-emerald-600 p-2 rounded-lg text-xs hover:bg-emerald-100 hover:shadow-sm transition-all"
                            title="Log Exit"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    )}
                    <button 
                        onClick={() => handleEditClick(entry)}
                        className="bg-indigo-50 text-indigo-600 p-2 rounded-lg text-xs hover:bg-indigo-100 transition-all"
                        title="Edit Entry"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => handleDeleteEntry(entry.id)}
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
                title="Gate Entry Management" 
                subTitle="Real-time entry & exit tracking" 
                toggleSidebar={toggleSidebar} 
            >
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => {
                            setEditId(null);
                            setNewEntry({ entry_type: 'student', person_id: '', remarks: '' });
                            setShowEntryModal(true);
                        }}
                        className="bg-white text-[#001736] px-4 py-2 sm:px-8 sm:py-3 rounded-xl text-[10px] sm:text-[11px] font-bold hover:bg-slate-50 transition-all flex items-center gap-3 shadow-lg active:scale-95 uppercase tracking-widest whitespace-nowrap"
                    >
                        <DoorOpen className="w-4 h-4" />
                        <span className="hidden sm:inline">Record New Entry</span>
                        <span className="sm:hidden">New Entry</span>
                    </button>
                    <button 
                        onClick={() => setShowScanner(!showScanner)}
                        className={`px-4 py-2 sm:px-8 sm:py-3 rounded-xl text-[10px] sm:text-[11px] font-bold transition-all flex items-center gap-3 shadow-sm active:scale-95 uppercase tracking-widest whitespace-nowrap border
                            ${showScanner ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-white text-[#001736] border-slate-200 hover:bg-slate-50'}`}
                    >
                        <ScanLine className="w-4 h-4" />
                        <span className="hidden sm:inline">{showScanner ? 'Close Scanner' : 'Scan QR'}</span>
                        <span className="sm:hidden">{showScanner ? 'Close' : 'Scan'}</span>
                    </button>
                </div>
            </ModuleHeader>

            {showScanner && (
                <div className="bg-white rounded-2xl p-8 border-2 border-dashed border-indigo-200 flex flex-col items-center animate-in fade-in slide-in-from-top-4">
                    <div id="reader-entry" className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"></div>
                    <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Scan Student or Staff ID Card</p>
                </div>
            )}

            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4 sm:gap-6">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Search by name or ID..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 sm:py-3.5 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all placeholder:text-slate-400"
                    />
                </div>
                
                <div className="flex-1 w-full flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                    <Filter className="w-4 h-4 text-slate-400 mr-2 shrink-0 hidden sm:block" />
                    {['all', 'student', 'staff', 'visitor'].map(type => (
                        <button 
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap
                                ${filterType === type 
                                    ? 'bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm shadow-indigo-100' 
                                    : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100'}`}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                <button 
                    onClick={fetchEntries}
                    className="w-full md:w-auto p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-[#001736] hover:border-slate-300 transition-all active:rotate-180 duration-500 flex justify-center"
                    title="Refresh Data"
                >
                    <Clock className="w-5 h-5" />
                </button>
            </div>

            {/* Entries Table */}
            <DataTable 
                headers={columns}
                emptyMessage="No entries found"
                footer={
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#64748B]">
                            Showing <span className="text-[#001736]">{filteredEntries.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0}</span> to <span className="text-[#001736]">{Math.min(currentPage * itemsPerPage, filteredEntries.length)}</span> of <span className="text-[#001736]">{filteredEntries.length}</span> Records
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
                {paginatedEntries.map(entry => (
                    <tr key={entry.id} className="hover:bg-slate-50 transition-colors border-b-table group">
                        {columns.map(col => (
                            <td key={col.key} className={`px-4 sm:px-6 py-4 text-sm ${col.align === 'right' ? 'text-right' : 'text-left'} border-r-table`}>
                                {col.render(entry)}
                            </td>
                        ))}
                    </tr>
                ))}
            </DataTable>

            {/* Entry Modal */}
            {showEntryModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-white/20 animate-in fade-in zoom-in duration-300 max-h-[90vh] flex flex-col">
                        <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
                            <div>
                                <h3 className="text-lg sm:text-xl font-bold text-[#001736] tracking-tight uppercase">{editId ? 'Edit Entry' : 'Record Entry'}</h3>
                                <p className="text-[10px] sm:text-xs font-medium text-slate-400 mt-1">{editId ? 'Update entry details' : 'Manual entry registration'}</p>
                            </div>
                            <button onClick={() => setShowEntryModal(false)} className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">×</button>
                        </div>
                        
                        <form onSubmit={handleAddEntry} className="p-6 sm:p-8 space-y-5 sm:space-y-6 overflow-y-auto custom-scrollbar flex-1">
                            <div className="space-y-2 text-left">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Personnel Type</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['student', 'staff'].map(type => (
                                        <button 
                                            key={type}
                                            type="button"
                                            onClick={() => {
                                                setNewEntry({...newEntry, entry_type: type, person_id: ''});
                                                setSelectedClass('');
                                            }}
                                            className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all
                                                ${newEntry.entry_type === type 
                                                    ? 'bg-[#001736] text-white border-[#001736] shadow-lg shadow-blue-900/10' 
                                                    : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-300'}`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2 text-left">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Personnel ID</label>
                                
                                {newEntry.entry_type === 'student' && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <select
                                            value={selectedClass}
                                            onChange={(e) => {
                                                setSelectedClass(e.target.value);
                                                setNewEntry({...newEntry, person_id: ''});
                                            }}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-5 text-sm font-bold text-[#001736] focus:outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all appearance-none"
                                        >
                                            <option value="">Select Class</option>
                                            {classrooms.map(c => (
                                                <option key={c.id} value={c.id}>{c.class_name} - {c.section}</option>
                                            ))}
                                        </select>
                                        
                                        <select
                                            value={newEntry.person_id}
                                            onChange={(e) => setNewEntry({...newEntry, person_id: e.target.value})}
                                            disabled={!selectedClass}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-5 text-sm font-bold text-[#001736] focus:outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all appearance-none disabled:opacity-50"
                                        >
                                            <option value="">Select Student</option>
                                            {students.filter(s => s.classroom_id == selectedClass).map(s => (
                                                <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.student_id_no})</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {newEntry.entry_type === 'staff' && (
                                    <select
                                        value={newEntry.person_id}
                                        onChange={(e) => setNewEntry({...newEntry, person_id: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-5 text-sm font-bold text-[#001736] focus:outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all appearance-none"
                                    >
                                        <option value="">Select Staff</option>
                                        {staffList.map(s => (
                                            <option key={s.id} value={s.id}>{s.full_name} ({s.employee_id})</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div className="space-y-2 text-left">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Photo (Optional)</label>
                                <div className="flex items-center gap-4">
                                    {newEntry.photo_url ? (
                                        <div className="relative w-16 h-16 rounded-xl overflow-hidden shadow-sm border border-slate-200">
                                            <img src={newEntry.photo_url} alt="Preview" className="w-full h-full object-cover" />
                                            <button 
                                                type="button" 
                                                onClick={() => setNewEntry({...newEntry, photo_url: ''})} 
                                                className="absolute top-0 right-0 bg-rose-500 text-white p-1 rounded-bl-lg hover:bg-rose-600 transition-colors"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="flex items-center justify-center w-16 h-16 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 hover:border-indigo-300 transition-all">
                                            <Camera className="w-5 h-5 text-slate-400" />
                                            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />
                                        </label>
                                    )}
                                    <span className="text-[10px] text-slate-400 font-medium">Capture or upload photo</span>
                                </div>
                            </div>

                            <div className="space-y-2 text-left">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Remarks (Optional)</label>
                                <textarea 
                                    value={newEntry.remarks}
                                    onChange={(e) => setNewEntry({...newEntry, remarks: e.target.value})}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-5 text-sm font-medium text-[#001736] focus:outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all placeholder:text-slate-300 min-h-[100px]"
                                    placeholder="Any notes..."
                                />
                            </div>

                            <button 
                                type="submit"
                                className="w-full bg-[#001736] text-white py-4 rounded-xl text-xs font-bold uppercase tracking-[0.2em] shadow-lg shadow-blue-900/10 hover:bg-[#002b64] transition-all active:scale-[0.98] mt-4"
                            >
                                {editId ? 'Update Entry' : 'Confirm Entry'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GateEntry;
