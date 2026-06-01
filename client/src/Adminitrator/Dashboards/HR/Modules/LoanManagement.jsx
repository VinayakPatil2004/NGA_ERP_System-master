import React, { useState, useEffect, useMemo } from 'react';
import { 
    Wallet, Plus, Search, RefreshCw, Landmark, 
    ArrowUpRight, AlertCircle, CheckCircle2, XCircle, Upload
} from 'lucide-react';
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import DataTable from '../../../admcomponents/DataTable';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { getLoans, createLoan, updateLoan, deleteLoan } from '../../../../services/hrAPI';
import { getAllStaff } from '../../../../services/staffAPI';
import bulkImportAPI from '../../../../services/bulkImportAPI';

/**
 * LoanManagement - Tracking institutional personnel advances & EMI cycles.
 * Simplified Premium aesthetic.
 */
const LoanManagement = ({ toggleSidebar }) => {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showGrantModal, setShowGrantModal] = useState(false);
    const [formData, setFormData] = useState({ staff_id: '', total_amount: '', reason: '' });
    const [staffList, setStaffList] = useState([]);
    const [staffSearchQuery, setStaffSearchQuery] = useState('');
    const [filterMonth, setFilterMonth] = useState('');
    const [showStaffDropdown, setShowStaffDropdown] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [editLoanId, setEditLoanId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isUploading, setIsUploading] = useState(false);
    const itemsPerPage = 10;

    const fetchLoans = async () => {
        try {
            setLoading(true);
            const [data, staffData] = await Promise.all([
                getLoans(),
                getAllStaff()
            ]);
            setLoans(data);
            setStaffList(staffData || []);
        } catch (error) {
            console.error(error);
            toast.error('Failed to sync registry');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLoans(); }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterMonth]);

    const handleGrantLoan = async (e) => {
        e.preventDefault();
        try {
            const dataToSubmit = { ...formData, emi_amount: formData.total_amount };
            if (editLoanId) {
                await updateLoan(editLoanId, dataToSubmit);
                Swal.fire({ title: 'Success!', text: 'Advance updated successfully.', icon: 'success', confirmButtonColor: '#4f46e5' });
            } else {
                await createLoan(dataToSubmit);
                Swal.fire({ title: 'Success!', text: 'Financial advance granted successfully.', icon: 'success', confirmButtonColor: '#4f46e5' });
            }
            setShowGrantModal(false);
            setFormData({ staff_id: '', total_amount: '', reason: '' });
            setStaffSearchQuery('');
            setSelectedStaff(null);
            setEditLoanId(null);
            fetchLoans();
        } catch (error) {
            console.error(error);
            Swal.fire({ title: 'Error!', text: 'Transaction Failed', icon: 'error', confirmButtonColor: '#4f46e5' });
        }
    };

    const handleEditClick = (loan) => {
        setFormData({
            staff_id: loan.staff_id,
            total_amount: loan.total_amount,
            reason: loan.reason || ''
        });
        const staff = staffList.find(s => s.id === loan.staff_id);
        if (staff) {
            setSelectedStaff(staff);
            setStaffSearchQuery(staff.full_name);
        }
        setEditLoanId(loan.id);
        setShowGrantModal(true);
    };

    const handleDeleteClick = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You want to completely delete this advance?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await deleteLoan(id);
                Swal.fire({ title: 'Deleted!', text: 'Advance deleted successfully.', icon: 'success', confirmButtonColor: '#4f46e5' });
                fetchLoans();
            } catch (error) {
                console.error(error);
                Swal.fire({ title: 'Error!', text: 'Failed to delete advance', icon: 'error', confirmButtonColor: '#4f46e5' });
            }
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            setIsUploading(true);
            toast.info('Uploading and processing file...');
            const res = await bulkImportAPI.importLoanAdvance(file);
            toast.success(res.message || 'Bulk import successful');
            fetchLoans();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to import data');
        } finally {
            setIsUploading(false);
            e.target.value = null;
        }
    };

    const filtered = useMemo(() => {
        return loans.filter(l => {
            const matchesSearch = l.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  l.employee_id?.toLowerCase().includes(searchTerm.toLowerCase());
            if (!matchesSearch) return false;

            if (filterMonth) {
                const loanMonth = new Date(l.created_at).toISOString().slice(0, 7);
                if (loanMonth !== filterMonth) return false;
            }

            return true;
        });
    }, [loans, searchTerm, filterMonth]);

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginatedLoans = useMemo(() => {
        return filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }, [filtered, currentPage]);

    return (
        <div className="p-4 lg:p-8 space-y-6 min-h-screen bg-[#F8FAFC]">
            <ModuleHeader hideAcademicYear={true} 
                title="Loan Management" 
                subTitle="Registry of Personnel Advances & EMI Cycles"
                icon={Landmark}
                toggleSidebar={toggleSidebar}
            >
                <div className="flex items-center gap-2 lg:gap-3">
                    <button onClick={fetchLoans} className="p-2.5 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-all shadow-sm text-[#001736]" title="Refresh">
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <label className="flex bg-white text-black! px-3 lg:px-6 py-2.5 rounded-md font-bold text-[10px] lg:text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors items-center gap-2 cursor-pointer border border-slate-300 shadow-sm shrink-0">
                        {isUploading ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />} 
                        <span className="hidden sm:inline text-black!">Import</span>
                        <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                    </label>
                    <button 
                        onClick={() => {
                            setFormData({ staff_id: '', total_amount: '', reason: '' });
                            setStaffSearchQuery('');
                            setSelectedStaff(null);
                            setEditLoanId(null);
                            setShowGrantModal(true);
                        }}
                        className="flex bg-white text-[#001736] px-3 lg:px-6 py-2.5 rounded-md font-bold text-[10px] lg:text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors items-center gap-2 border border-slate-300 shadow-sm shrink-0"
                    >
                        <Plus size={14} /> <span className="hidden sm:inline">Grant Advance</span>
                    </button>
                </div>
            </ModuleHeader>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard 
                    label="Outstanding Principal" 
                    value={`₹${loans.reduce((s, l) => s + (l.status === 'active' ? parseFloat(l.balance_amount) : 0), 0).toLocaleString()}`} 
                    color="text-amber-600"
                    bg="bg-amber-50"
                />
                <MetricCard 
                    label="Active Recoveries" 
                    value={loans.filter(l => l.status === 'active').length} 
                    color="text-indigo-600"
                    bg="bg-indigo-50"
                />
                <MetricCard 
                    label="Registry Total" 
                    value={loans.length} 
                    color="text-slate-600"
                    bg="bg-slate-50"
                />
            </div>

            <div className="bg-white border border-slate-300 shadow-sm overflow-hidden mt-8 ">
                <div className="px-6 py-4 mb-2 border-b border-slate-300 flex items-center gap-3">
                    <Search className="w-4 h-4 text-slate-400 shrink-0" />
                    <input 
                        type="text" 
                        placeholder="Search borrowers..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="bg-transparent border-none outline-none text-xs font-bold text-[#001736] w-full"
                    />
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg shrink-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">Granted In:</span>
                        <input 
                            type={filterMonth ? "month" : "text"}
                            placeholder="All Time"
                            onFocus={(e) => e.target.type = 'month'}
                            onBlur={(e) => { if (!filterMonth) e.target.type = 'text'; }}
                            value={filterMonth}
                            onChange={e => setFilterMonth(e.target.value)}
                            className="bg-transparent text-xs font-bold text-[#001736] outline-none cursor-pointer w-28"
                            title="Filter by grant month"
                        />
                        {filterMonth && (
                            <button onClick={() => setFilterMonth('')} className="text-slate-400 hover:text-rose-500 transition-colors" title="Clear Filter">
                                <XCircle size={14} />
                            </button>
                        )}
                    </div>
                    <button 
                        onClick={() => {
                            setFormData({ staff_id: '', total_amount: '', reason: '' });
                            setStaffSearchQuery('');
                            setSelectedStaff(null);
                            setEditLoanId(null);
                            setShowGrantModal(true);
                        }}
                        className="lg:hidden flex items-center justify-center w-9 h-9 bg-[#001736] text-white rounded-md font-bold shadow-sm transition-colors shrink-0"
                    >
                        <Plus size={18} />
                    </button>
                </div>
                <DataTable
                    headers={[
                        { label: 'Staff Member' },
                        { label: 'Advance Amount' },
                        { label: 'Balance' },
                        { label: 'Reason' },
                        { label: 'Status' },
                        { label: 'Action' }
                    ]}
                    loading={loading}
                    columnCount={6}
                    footer={
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex-wrap">
                                <span>Registry: {filtered.length} Advances</span>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                <button 
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    className="px-4 py-2 bg-white border border-slate-300 rounded-md text-xs font-bold text-slate-400 hover:text-[#001736] hover:border-slate-400 disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:border-slate-300 transition-all cursor-pointer"
                                >PREV</button>
                                <span className="text-xs font-black uppercase tracking-widest text-[#001736]">
                                    PAGE {currentPage} OF {totalPages || 1}
                                </span>
                                <button 
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    className="px-4 py-2 bg-white border border-slate-300 rounded-md text-xs font-bold text-slate-400 hover:text-[#001736] hover:border-slate-400 disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:border-slate-300 transition-all cursor-pointer"
                                >NEXT</button>
                            </div>
                        </div>
                    }
                >
                    {paginatedLoans.map(l => (
                        <tr key={l.id} className="hover:bg-slate-50/50 transition-colors border-b border-black last:border-0">
                            <td className="px-6 py-4 border border-black">
                                <p className="text-sm font-bold text-[#001736]">{l.full_name}</p>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest">{l.employee_id}</p>
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-600 border border-black">₹{parseFloat(l.total_amount).toLocaleString()}</td>
                            <td className="px-6 py-4 border border-black">
                                <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-[11px] font-black border border-amber-100">
                                    ₹{parseFloat(l.balance_amount).toLocaleString()}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-500 italic max-w-xs truncate border border-black">{l.reason || '—'}</td>
                            <td className="px-6 py-4 uppercase border border-black">
                                <div className="flex items-center gap-1.5">
                                    {l.status === 'active' ? (
                                        <div className="flex items-center gap-1 text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                                            <ArrowUpRight size={14} /> Active
                                        </div>
                                    ) : l.status === 'paid' || l.status === 'completed' ? (
                                        <div className="flex items-center gap-1 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                                            <CheckCircle2 size={14} /> Paid
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <XCircle size={14} /> Closed
                                        </div>
                                    )}
                                </div>
                            </td>
                            <td className="px-6 py-4 border border-black text-center">
                                <div className="flex items-center justify-center gap-2">
                                    <button 
                                        onClick={() => handleEditClick(l)}
                                        className="text-indigo-500 hover:text-indigo-700 transition-colors" 
                                        title="Edit"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteClick(l.id)}
                                        className="text-red-500 hover:text-red-700 transition-colors" 
                                        title="Delete"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </DataTable>
            </div>

            {/* Grant Modal */}
            {showGrantModal && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in duration-300">
                        <div className="p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center">
                                    <Landmark className="text-indigo-600" size={20} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-[#001736] uppercase tracking-tight">{editLoanId ? 'Update Advance' : 'Grant Advance'}</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{editLoanId ? 'Modify Record' : 'Establish Recovery Protocol'}</p>
                                </div>
                            </div>

                            <form onSubmit={handleGrantLoan} className="space-y-4">
                                <div className="relative">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] block mb-2 px-1">Search & Select Employee</label>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            value={staffSearchQuery}
                                            onChange={e => {
                                                setStaffSearchQuery(e.target.value);
                                                setShowStaffDropdown(true);
                                                if (selectedStaff) {
                                                    setSelectedStaff(null);
                                                    setFormData({ ...formData, staff_id: '' });
                                                }
                                            }}
                                            onFocus={() => setShowStaffDropdown(true)}
                                            onBlur={() => setTimeout(() => setShowStaffDropdown(false), 200)}
                                            className={`w-full bg-slate-50 border border-slate-300 rounded-xl px-5 py-3 text-sm font-bold text-[#001736] focus:ring-8 focus:ring-indigo-500/5 transition-all outline-none ${editLoanId ? 'opacity-60 cursor-not-allowed' : ''}`}
                                            placeholder="Type Name, ID or National Code..."
                                            required={!formData.staff_id}
                                            disabled={!!editLoanId}
                                        />
                                        {showStaffDropdown && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-300 shadow-xl rounded-xl max-h-48 overflow-y-auto z-50 p-2">
                                                {staffList.filter(s => 
                                                    (s.full_name || '').toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
                                                    (s.employee_id || '').toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
                                                    (s.aadhar_no || '').toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
                                                    (s.pan_no || '').toLowerCase().includes(staffSearchQuery.toLowerCase())
                                                ).map(staff => (
                                                    <div 
                                                        key={staff.id} 
                                                        className="px-4 py-3 hover:bg-slate-50 cursor-pointer rounded-xl transition-colors border-b border-slate-50 last:border-0"
                                                        onClick={() => {
                                                            setSelectedStaff(staff);
                                                            setFormData({ ...formData, staff_id: staff.id });
                                                            setStaffSearchQuery(staff.full_name);
                                                            setShowStaffDropdown(false);
                                                        }}
                                                    >
                                                        <p className="text-sm font-bold text-[#001736]">{staff.full_name}</p>
                                                        <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                                                            {staff.employee_id} {staff.aadhar_no ? `• ${staff.aadhar_no}` : ''}
                                                        </p>
                                                    </div>
                                                ))}
                                                {staffList.filter(s => 
                                                    (s.full_name || '').toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
                                                    (s.employee_id || '').toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
                                                    (s.aadhar_no || '').toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
                                                    (s.pan_no || '').toLowerCase().includes(staffSearchQuery.toLowerCase())
                                                ).length === 0 && (
                                                    <div className="px-4 py-3 text-sm text-slate-400 italic text-center">No staff found matching criteria.</div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Confirmation Box */}
                                    {selectedStaff && (
                                        <div className="mt-4 p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-center justify-between animate-in zoom-in duration-300">
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-1">Confirmed Personnel</p>
                                                <p className="text-sm font-bold text-indigo-900">{selectedStaff.full_name}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-slate-600">{selectedStaff.employee_id}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                                                    National Code: {selectedStaff.aadhar_no || selectedStaff.pan_no || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] block mb-2 px-1">Advance Amount</label>
                                    <input 
                                        type="number" 
                                        required
                                        value={formData.total_amount}
                                        onChange={e => setFormData({...formData, total_amount: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-5 py-3 text-sm font-bold text-[#001736] focus:ring-8 focus:ring-indigo-500/5 transition-all outline-none"
                                        placeholder="Total Amount"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] block mb-2 px-1">Reason</label>
                                    <textarea 
                                        rows="3"
                                        value={formData.reason}
                                        onChange={e => setFormData({...formData, reason: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-5 py-3 text-sm font-bold text-[#001736] focus:ring-8 focus:ring-indigo-500/5 transition-all outline-none resize-none"
                                        placeholder="Purpose of advance..."
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            setShowGrantModal(false);
                                            setFormData({ staff_id: '', total_amount: '', reason: '' });
                                            setStaffSearchQuery('');
                                            setSelectedStaff(null);
                                            setEditLoanId(null);
                                        }}
                                        className="py-4 px-8 bg-slate-100 text-slate-600 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-colors outline-none"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all outline-none"
                                    >
                                        {editLoanId ? 'Update Advance' : 'Grant Advance'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const MetricCard = ({ label, value, color, bg }) => (
    <div className={`p-6 rounded-3xl border border-slate-100 shadow-sm ${bg} flex flex-col gap-1`}>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{label}</p>
        <h4 className={`text-2xl font-black ${color} tracking-tighter`}>{value}</h4>
    </div>
);

export default LoanManagement;
