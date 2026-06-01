import React, { useState, useEffect, useCallback } from 'react';
import { 
    TrendingDown, IndianRupee, PieChart as PieIcon, Activity, Plus, Search, 
    Filter, AlertCircle, CheckCircle, Trash2, Edit3, X, Calendar, 
    CreditCard, User, Landmark, ShieldCheck, Download, FilterX, Camera, Eye,
    Printer, FileSpreadsheet, ChevronDown, FileText
} from 'lucide-react';
import { 
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import { ROOT_URL } from '../../../../../../services/API';
import API from '../../../../../../services/API';
import { 
    getExpenses, 
    getExpenseStats, 
    createExpense, 
    updateExpenseRecord, 
    deleteExpenseRecord 
} from '../../../../../../services/FeesAndFinance/expenseAPI';
import Swal from 'sweetalert2';
import DataTable from '../../../../../admcomponents/DataTable';
import * as XLSX from 'xlsx';

const CATEGORIES = [
    "Staff Salaries & Benefits",
    "Infrastructure & Maintenance",
    "Utilities",
    "Academic Expenses",
    "IT & Digital Infrastructure",
    "Transport Expenses",
    "Office & Administrative Expenses",
    "Security & Safety",
    "Housekeeping & Hygiene",
    "Marketing & Admissions",
    "Events & Activities",
    "Legal & Compliance",
    "Health & Welfare",
    "Miscellaneous Expenses"
];

const COLORS = [
    '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
    '#EC4899', '#06B6D4', '#6366F1', '#14B8A6', '#F97316',
    '#A855F7', '#D946EF', '#2DD4BF', '#F43F5E'
];

const ExpenseMonitoring = ({ selectedYear, isMobileSearchOpen }) => {
    const [expenses, setExpenses] = useState([]);
    const [stats, setStats] = useState({ monthlyTotal: 0, categoryBreakdown: [], statusBreakdown: [] });
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [viewingExpense, setViewingExpense] = useState(null);
    const [filterCategory, setFilterCategory] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterCategory]);

    const [formData, setFormData] = useState({
        category: CATEGORIES[0],
        subcategory: '',
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        vendor_name: '',
        description: '',
        status: 'pending',
        reference_no: '',
        payer_name: '',
        payee_name: '',
        attachment_url: '',
        attachment: null
    });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [expenseData, statsData] = await Promise.all([
                getExpenses(filterCategory, selectedYear),
                getExpenseStats(selectedYear)
            ]);

            setExpenses(expenseData);
            setStats(statsData);
        } catch (error) {
            console.error('Error fetching expenses:', error);
        } finally {
            setLoading(false);
        }
    }, [filterCategory, selectedYear]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ 
                ...prev, 
                attachment: file, 
                attachment_url: file.name 
            }));
        }
    };

    const resetForm = () => {
        setFormData({
            category: CATEGORIES[0],
            subcategory: '',
            amount: '',
            payment_date: new Date().toISOString().split('T')[0],
            payment_method: 'cash',
            vendor_name: '',
            description: '',
            status: 'pending',
            reference_no: '',
            payer_name: '',
            payee_name: '',
            attachment_url: '',
            attachment: null
        });
        setEditingExpense(null);
    };

    const handleExportCSV = () => {
        const worksheet = XLSX.utils.json_to_sheet(expenses);
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "Institutional_Expenses.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExport = () => {
        const worksheet = XLSX.utils.json_to_sheet(expenses);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");
        XLSX.writeFile(workbook, "Institutional_Expenses.xlsx");
    };

    const handleView = (expense) => {
        setViewingExpense(expense);
        setIsViewModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData, academic_year_id: selectedYear };
            
            if (editingExpense) {
                await updateExpenseRecord(editingExpense.id, payload);
                Swal.fire('Updated!', 'Expense record updated.', 'success');
            } else {
                await createExpense(payload);
                Swal.fire('Recorded!', 'Expense added to ledger.', 'success');
            }

            setIsModalOpen(false);
            resetForm();
            fetchData();
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Check your data and try again.';
            Swal.fire('Error', `Record failed: ${errorMsg}`, 'error');
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Delete record?',
            text: "This action cannot be undone.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            confirmButtonText: 'Delete'
        });

        if (result.isConfirmed) {
            try {
                await deleteExpenseRecord(id);
                fetchData();
                Swal.fire('Deleted!', 'Expense record deleted successfully.', 'success');
            } catch {
                Swal.fire('Error', 'Deletion failed.', 'error');
            }
        }
    };

    const handleEdit = (expense) => {
        setEditingExpense(expense);
        setFormData({
            category: expense.category,
            subcategory: expense.subcategory,
            amount: expense.amount,
            payment_date: expense.payment_date.split('T')[0],
            payment_method: expense.payment_method,
            vendor_name: expense.vendor_name,
            description: expense.description,
            status: expense.status,
            reference_no: expense.reference_no || '',
            payer_name: expense.payer_name || '',
            payee_name: expense.payee_name || '',
            attachment_url: expense.attachment_url || ''
        });
        setIsModalOpen(true);
    };

    const filteredExpenses = expenses.filter(exp => 
        exp.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.expense_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
    const paginatedExpenses = filteredExpenses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            
            {/* 📋 Data Table Section (Now at the top) */}
            <div className="bg-white border border-black/5 shadow-sm overflow-hidden">
                <div className={`p-4 lg:p-8 border-b border-slate-50 bg-slate-50/30 ${!isMobileSearchOpen ? 'hidden lg:block' : 'block animate-in slide-in-from-top-2 duration-300'}`}>
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex flex-col md:flex-row items-center gap-4 flex-1">
                            <div className="relative flex-1 w-full max-w-2xl overflow-hidden rounded-md">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search payments, vendors..."
                                    className="w-full pl-12 pr-6 py-4 bg-white border border-black rounded-md text-[12px] font-bold outline-none focus:ring-2 focus:ring-primary transition-all shadow-inner block"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            
                            {/* Summary Badge - Height Synced */}
                            <div className="hidden lg:flex lg:flex-col justify-center px-6 py-2 bg-rose-50 border border-black rounded-md shrink-0 h-[52px]">
                                <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest leading-none mb-1">Monthly Outflow</p>
                                <p className="text-[16px] font-black text-rose-600 tracking-tighter leading-none">₹ {parseFloat(stats.monthlyTotal || 0).toLocaleString()}</p>
                            </div>
                        </div>

                        {/* Responsive Controls Grid */}
                        <div className="grid grid-cols-2 lg:flex lg:items-center gap-3 w-full lg:w-auto">
                            <div className="group relative">
                                <button 
                                    className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-white border border-black rounded-md font-black text-[10px] lg:text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm h-[52px]"
                                >
                                    <Download className="w-4 h-4 text-emerald-600" /> Export <ChevronDown className="w-3 h-3 opacity-50" />
                                </button>
                                <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 shadow-2xl rounded-md py-2 hidden group-hover:block z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <button 
                                        onClick={handleExport}
                                        className="w-full text-left px-6 py-3 text-[10px] font-bold uppercase hover:bg-slate-50 flex items-center gap-3"
                                    >
                                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Excel
                                    </button>
                                    <button 
                                        onClick={handleExportCSV}
                                        className="w-full text-left px-6 py-3 text-[10px] font-bold uppercase hover:bg-slate-50 flex items-center gap-3"
                                    >
                                        <FileText className="w-4 h-4 text-blue-600" /> CSV
                                    </button>
                                    <button 
                                        onClick={() => window.print()}
                                        className="w-full text-left px-6 py-3 text-[10px] font-bold uppercase hover:bg-slate-50 border-t border-slate-100 mt-1 flex items-center gap-3"
                                    >
                                        <Printer className="w-4 h-4 text-slate-400" /> Print
                                    </button>
                                </div>
                            </div>

                            <button 
                                onClick={() => { resetForm(); setIsModalOpen(true); }}
                                className="flex items-center justify-center gap-2 px-4 py-4 bg-primary text-white rounded-md border border-black font-black text-[10px] lg:text-[11px] uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95 group h-[52px]"
                            >
                                <Plus className="w-4 h-4" /> Add Expense
                            </button>
                            
                            <div className="col-span-2 lg:col-span-1">
                                <select 
                                    className="w-full lg:w-[180px] bg-white border border-black rounded-md px-5 py-4 text-[10px] lg:text-[11px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary shadow-sm h-[52px]"
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                >
                                    <option value="All">All Categories</option>
                                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mobile-table-scroll">
                    <DataTable
                        loading={loading}
                        emptyMessage="No expense records found"
                        headers={[
                            { label: "ID", className: "w-[130px] whitespace-nowrap" },
                            { label: "Category & Description" },
                            { label: "Vendor Details" },
                            { label: "Date & Method" },
                            { label: "Amount" },
                            { label: "Status" },
                            { label: "Actions", className: "text-center " }
                        ]}
                        footer={
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 lg:p-2 bg-slate-50/10 border-t border-slate-100">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Showing <span className="text-primary">{filteredExpenses.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0}</span> to <span className="text-primary">{Math.min(currentPage * itemsPerPage, filteredExpenses.length)}</span> of <span className="text-primary">{filteredExpenses.length}</span> entries
                                </p>
                                <div className="flex w-full md:w-auto items-center justify-between md:justify-center gap-2 mt-4 md:mt-0">
                                    <button 
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="px-4 md:px-6 py-2 bg-white border border-slate-200 rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                                    >
                                        Prev
                                    </button>
                                    <div className="px-2 md:px-4">
                                        <span className="text-[10px] font-black text-primary uppercase whitespace-nowrap">Page {currentPage} of {totalPages || 1}</span>
                                    </div>
                                    <button 
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages || totalPages === 0}
                                        className="px-4 md:px-6 py-2 bg-white border border-slate-200 rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        }
                    >
                        {paginatedExpenses.map((exp) => (
                            <tr key={exp.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-4 py-3 border-r border-b border-black font-mono text-[11px] font-black text-slate-900 whitespace-nowrap">
                                    {exp.expense_id}
                                </td>
                                <td className="px-4 py-3 border-r border-b border-black">
                                    <div>
                                        <p className="text-[12px] font-black text-primary uppercase">{exp.category}</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{exp.subcategory || 'General Expense'}</p>
                                    </div>
                                </td>
                                <td className="px-4 py-3 border-r border-b border-black">
                                    <p className="text-[11px] font-bold text-slate-700 uppercase">{exp.vendor_name || 'N/A'}</p>
                                </td>
                                <td className="px-4 py-3 border-r border-b border-black text-[11px] font-bold text-slate-500">
                                    {new Date(exp.payment_date).toLocaleDateString()}
                                    {exp.status === 'paid' && (
                                        <span className="block text-[10px] text-slate-400 font-black uppercase tracking-tight">{exp.payment_method}</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 border-r border-b border-black">
                                    <span className="font-mono font-black text-[#001736] text-sm">₹{parseFloat(exp.amount).toLocaleString()}</span>
                                </td>
                                <td className="px-4 py-3 border-r border-b border-black">
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${exp.status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                        {exp.status}
                                    </span>
                                </td>
                                <td className="px-4 py-3 border-b border-black text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <button onClick={() => handleView(exp)} title="View Detail" className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-200 transition-all border border-black">
                                            <Eye size={14} />
                                        </button>
                                        <button onClick={() => handleEdit(exp)} title="Edit Record" className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-primary hover:text-white transition-all border border-black">
                                            <Edit3 size={14} />
                                        </button>
                                        <button onClick={() => handleDelete(exp.id)} title="Delete Record" className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all border border-black">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </DataTable>
                </div>
            </div>

            {/* 📉 Analytics Section (Moved to Bottom) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Category Weightage */}
                <div className="bg-white p-8 rounded-2xl border border-black/5 shadow-sm min-h-[400px]">
                    <h4 className="text-sm font-black text-primary uppercase tracking-widest mb-8 flex items-center gap-2">
                        <PieIcon className="w-4 h-4 text-indigo-500" /> 
                        Spending by Category
                    </h4>
                    <div className="h-[300px] w-full flex items-center justify-center">
                        {stats.categoryBreakdown && stats.categoryBreakdown.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={stats.categoryBreakdown}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="total"
                                        nameKey="category"
                                    >
                                        {stats.categoryBreakdown.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36}/>
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No data available for this year</p>
                        )}
                    </div>
                </div>

                {/* Status distribution */}
                <div className="bg-white p-8 rounded-2xl border border-black/5 shadow-sm">
                    <h4 className="text-sm font-black text-primary uppercase tracking-widest mb-8 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-500" />
                        Status Overview
                    </h4>
                    <div className="space-y-6 pt-4">
                        {stats.statusBreakdown.map((item, idx) => (
                            <div key={idx} className="space-y-2">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-slate-500">{item.status}</span>
                                    <span className="text-primary">{item.count} Transactions</span>
                                </div>
                                <div className="w-full h-2.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                    <div 
                                        className={`h-full transition-all duration-1000 ${item.status === 'paid' ? 'bg-emerald-500' : item.status === 'pending' ? 'bg-amber-400' : 'bg-rose-500'}`} 
                                        style={{ width: `${expenses.length > 0 ? (item.count / expenses.length) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 📝 Record Modal (Enhanced) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 lg:p-10 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-full animate-in slide-in-from-bottom-8 duration-500">
                        {/* Modal Header */}
                        <div className="bg-primary px-8 py-6 flex items-center justify-between text-white">
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight">{editingExpense ? 'Edit Expense Record' : 'Add New Expense Record'}</h3>
                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Official Institutional Entry</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-md transition-all border border-white/10">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 lg:p-10 space-y-6 scrollbar-thin scrollbar-thumb-slate-200">
                            
                            {/* Standard Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</label>
                                    <select 
                                        name="category"
                                        required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-3 text-[12px] font-bold outline-none focus:bg-white transition-all shadow-inner"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                    >
                                        {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        {formData.status === 'pending' ? 'Entry Date / Purchase Date' : 'Payment Date'}
                                    </label>
                                    <input 
                                        type="date" 
                                        name="payment_date"
                                        required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-3 text-[12px] font-bold outline-none focus:bg-white transition-all shadow-inner"
                                        value={formData.payment_date}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount (₹)</label>
                                    <input 
                                        type="number" 
                                        name="amount"
                                        required
                                        placeholder="0.00"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-3 text-lg font-black outline-none focus:bg-white transition-all shadow-inner"
                                        value={formData.amount}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                {formData.status === 'paid' && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Method</label>
                                        <select 
                                            name="payment_method"
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-3 text-[12px] font-bold outline-none focus:bg-white transition-all shadow-inner"
                                            value={formData.payment_method}
                                            onChange={handleInputChange}
                                        >
                                            <option value="cash">Ready Cash</option>
                                            <option value="bank_transfer">Bank Transfer</option>
                                            <option value="cheque">Cheque</option>
                                            <option value="upi">UPI Digital</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description / Subcategory</label>
                                <input 
                                    type="text" 
                                    name="subcategory"
                                    placeholder="Enter details..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-3 text-[12px] font-bold outline-none focus:bg-white shadow-inner"
                                    value={formData.subcategory}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paid To (Vendor)</label>
                                <input 
                                    type="text" 
                                    name="vendor_name"
                                    placeholder="Beneficiary Name..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-3 text-[12px] font-bold outline-none focus:bg-white shadow-inner"
                                    value={formData.vendor_name}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attachment / Proof of Purchase</label>
                                <div className="relative group">
                                    <input 
                                        type="file" 
                                        className="hidden"
                                        id="receipt-photo"
                                        onChange={handleFileChange}
                                    />
                                    <label htmlFor="receipt-photo" className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-md cursor-pointer hover:bg-slate-50 transition-all border-dashed">
                                        <Camera className="w-4 h-4 text-slate-400" />
                                        <span className="text-[11px] font-bold text-slate-500 uppercase">
                                            {formData.attachment ? formData.attachment.name : (formData.attachment_url || 'Upload Proof of Purchase')}
                                        </span>
                                    </label>
                                </div>
                            </div>

                            {/* 💳 Dynamic Payment Fields */}
                            {(formData.status === 'paid' && (formData.payment_method === 'cheque' || formData.payment_method === 'bank_transfer' || formData.payment_method === 'upi')) && (
                                <div className="p-6 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-6">
                                    <h4 className="text-[10px] font-black text-primary uppercase tracking-widest border-b border-slate-100 pb-2">
                                        Payment Verification Details
                                    </h4>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                {formData.payment_method === 'cheque' ? 'Cheque Number' : 'Transaction ID'}
                                            </label>
                                            <input 
                                                type="text" 
                                                name="reference_no"
                                                required
                                                placeholder={formData.payment_method === 'cheque' ? 'Enter Cheque No...' : 'Enter TXN ID...'}
                                                className="w-full bg-white border border-slate-200 rounded-md px-4 py-3 text-[12px] font-bold outline-none"
                                                value={formData.reference_no}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payer Name (From)</label>
                                            <input 
                                                type="text" 
                                                name="payer_name"
                                                required
                                                placeholder="Who is paying..."
                                                className="w-full bg-white border border-slate-200 rounded-md px-4 py-3 text-[12px] font-bold outline-none"
                                                value={formData.payer_name}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        {formData.payment_method === 'cheque' && (
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Receiver Name (To)</label>
                                                <input 
                                                    type="text" 
                                                    name="payee_name"
                                                    required
                                                    placeholder="Who is receiving..."
                                                    className="w-full bg-white border border-slate-200 rounded-md px-4 py-3 text-[12px] font-bold outline-none"
                                                    value={formData.payee_name}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Status Buttons */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Record Status</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['pending', 'paid'].map(s => (
                                        <button 
                                            key={s}
                                            type="button"
                                            onClick={() => setFormData(prev => ({...prev, status: s}))}
                                            className={`py-3 rounded-md text-[10px] font-black uppercase tracking-widest border transition-all ${
                                                formData.status === s ? 'bg-primary text-white border-primary shadow-md' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                                            }`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button className="w-full py-5 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-[0.98]">
                                {editingExpense ? 'Update Record' : 'Save Expense Record'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* 👁️ View Detail Modal */}
            {isViewModalOpen && viewingExpense && (
                <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 lg:p-10 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-full animate-in zoom-in-95 duration-300">
                        <div className="bg-slate-900 px-8 py-6 flex items-center justify-between text-white">
                            <div>
                                <h3 className="text-xl font-black text-white! uppercase tracking-tight">Expense Receipt</h3>
                                <p className="text-[10px] font-bold text-white uppercase tracking-widest mt-1">Ref: {viewingExpense.expense_id}</p>
                            </div>
                            <button onClick={() => setIsViewModalOpen(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-md transition-all">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin scrollbar-thumb-slate-200">
                            <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-3xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Amount</p>
                                <h2 className="text-4xl font-black text-primary tracking-tighter">₹ {parseFloat(viewingExpense.amount).toLocaleString()}</h2>
                                <div className={`mt-4 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${viewingExpense.status === 'paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                    {viewingExpense.status}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 px-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</p>
                                    <p className="text-[13px] font-bold text-slate-700">{viewingExpense.category}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subcategory</p>
                                    <p className="text-[13px] font-bold text-slate-700">{viewingExpense.subcategory || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Date</p>
                                    <p className="text-[13px] font-bold text-slate-700">{new Date(viewingExpense.payment_date).toLocaleDateString()}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Method</p>
                                    <p className="text-[13px] font-bold text-slate-700 uppercase">{viewingExpense.payment_method}</p>
                                </div>
                                <div className="space-y-1 col-span-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendor / Paid To</p>
                                    <p className="text-[13px] font-bold text-slate-700">{viewingExpense.vendor_name || 'Generic Purchase'}</p>
                                </div>
                            </div>

                            {/* Payment specific details */}
                            {(viewingExpense.reference_no || viewingExpense.payer_name) && (
                                <div className="p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-4">
                                    <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                                        <ShieldCheck size={14} /> Verification Details
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-bold text-indigo-400 uppercase">Ref No / TXN ID</p>
                                            <p className="text-[12px] font-black text-indigo-900">{viewingExpense.reference_no || 'N/A'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-bold text-indigo-400 uppercase">Payer Name</p>
                                            <p className="text-[12px] font-black text-indigo-900">{viewingExpense.payer_name || 'N/A'}</p>
                                        </div>
                                        {viewingExpense.payee_name && (
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-bold text-indigo-400 uppercase">Receiver Name</p>
                                                <p className="text-[12px] font-black text-indigo-900">{viewingExpense.payee_name}</p>
                                            </div>
                                        )}
                                        {viewingExpense.attachment_url && (
                                            <div className="space-y-1 col-span-2 mt-2">
                                                <p className="text-[9px] font-bold text-indigo-400 uppercase">Official Receipt / Photo</p>
                                                <div className="flex items-center justify-between p-4 bg-white border border-indigo-100 rounded-2xl group hover:border-primary transition-all shadow-sm">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-indigo-50 rounded-md flex items-center justify-center text-indigo-500">
                                                            <Camera size={16} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[11px] font-black text-slate-700 uppercase">{viewingExpense.attachment_url}</p>
                                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Receipt Captured</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <a 
                                                            href={`${ROOT_URL}/uploads/${viewingExpense.attachment_url}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-2.5 bg-slate-50 text-slate-400 rounded-lg hover:bg-primary hover:text-white transition-all flex items-center justify-center"
                                                        >
                                                            <Eye size={14} />
                                                        </a>
                                                        <a 
                                                            href={`${ROOT_URL}/uploads/${viewingExpense.attachment_url}`}
                                                            download={viewingExpense.attachment_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-2.5 bg-slate-50 text-slate-400 rounded-lg hover:bg-black hover:text-white transition-all flex items-center justify-center"
                                                            onClick={() => Swal.fire({
                                                                title: 'Downloading...',
                                                                text: `Preparing ${viewingExpense.attachment_url}`,
                                                                icon: 'info',
                                                                timer: 1500,
                                                                showConfirmButton: false
                                                            })}
                                                        >
                                                            <Download size={14} />
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {viewingExpense.description && (
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Additional Notes</p>
                                    <p className="text-[12px] text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-md italic border border-slate-100">"{viewingExpense.description}"</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExpenseMonitoring;
