import React, { useState, useEffect, useCallback } from 'react';
import { 
    Search, Plus, FileText, X, Download, Eye, Edit3, Trash2, 
    FilterX, Share2, ChevronDown, CheckCircle, AlertCircle, Loader2,
    Printer, FileSpreadsheet, Camera, Calendar, ShieldCheck
} from 'lucide-react';
import DataTable from '../../../../../admcomponents/DataTable';
import { 
    getCAReports, 
    createCAReport, 
    updateCAReport, 
    deleteCAReport 
} from '../../../../../../services/FeesAndFinance/caFinanceAPI';
import { ROOT_URL } from '../../../../../../services/API';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

const CAFinanceReport = ({ isMobileSearchOpen, selectedYear }) => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [editingReport, setEditingReport] = useState(null);
    const [viewingReport, setViewingReport] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const [formData, setFormData] = useState({
        document_date: new Date().toISOString().split('T')[0],
        document_name: '',
        document_number: '',
        category: 'Audit',
        description: '',
        status: 'pending',
        attachment_url: '',
        attachment: null
    });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getCAReports(searchQuery, selectedYear);
            setReports(data);
        } catch (error) {
            console.error('Error fetching CA reports:', error);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, selectedYear]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setFormData({
            document_date: new Date().toISOString().split('T')[0],
            document_name: '',
            document_number: '',
            category: 'Audit',
            description: '',
            status: 'pending',
            attachment_url: '',
            attachment: null
        });
        setEditingReport(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const payload = { ...formData, academic_year_id: selectedYear };
            if (editingReport) {
                await updateCAReport(editingReport.id, payload);
                Swal.fire('Updated!', 'CA Document updated.', 'success');
            } else {
                await createCAReport(payload);
                Swal.fire('Recorded!', 'CA Document added.', 'success');
            }

            setIsModalOpen(false);
            resetForm();
            fetchData();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Transaction failed. Please check inputs.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleView = (report) => {
        setViewingReport(report);
        setIsViewModalOpen(true);
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Delete document?',
            text: "This action cannot be undone.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            confirmButtonText: 'Delete'
        });

        if (result.isConfirmed) {
            try {
                await deleteCAReport(id);
                fetchData();
                Swal.fire('Deleted!', 'CA Document deleted successfully.', 'success');
            } catch (error) {
                Swal.fire('Error', error.response?.data?.message || 'Deletion failed.', 'error');
            }
        }
    };

    const handleEdit = (report) => {
        setEditingReport(report);
        setFormData({
            document_date: report.document_date.split('T')[0],
            document_name: report.document_name,
            document_number: report.document_number,
            category: report.category || 'Audit',
            description: report.description || '',
            status: report.status || 'pending',
            attachment_url: report.attachment_url || '',
            attachment: null
        });
        setIsModalOpen(true);
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

    const handleExportCSV = () => {
        const worksheet = XLSX.utils.json_to_sheet(reports);
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "CA_Finance_Reports.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExport = () => {
        const worksheet = XLSX.utils.json_to_sheet(reports);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "CA_Reports");
        XLSX.writeFile(workbook, "CA_Finance_Reports.xlsx");
    };

    return (
        <div className="space-y-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* 📋 Data Table Section */}
            <div className="bg-white shadow-sm rounded-none border border-black/5 overflow-hidden">
                
                {/* TOOLBAR */}
                <div className={`p-4 border-b border-slate-100 bg-slate-50/10 ${!isMobileSearchOpen ? 'hidden lg:block' : 'block animate-in slide-in-from-top-2 duration-300'}`}>
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        
                        {/* SEARCH */}
                        <div className="relative flex-1 max-w-md w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                            <input 
                                type="text" 
                                placeholder="Search documents, IDs..."
                                className="w-full pl-12 pr-6 py-3 bg-white border border-slate-300 rounded-md text-[11px] font-black uppercase tracking-widest outline-none transition-all shadow-inner"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* ACTIONS - Responsive Grid */}
                        <div className="grid grid-cols-2 lg:flex lg:items-center gap-2 w-full lg:w-auto">
                            <button 
                                onClick={() => { resetForm(); setIsModalOpen(true); }}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-md font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95 h-[48px]"
                            >
                                <Plus className="w-3.5 h-3.5" /> Add Entry
                            </button>

                            <div className="group relative">
                                <button 
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-md font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm h-[48px]"
                                >
                                    <Download className="w-3.5 h-3.5 text-emerald-600" /> Export <ChevronDown className="w-3 h-3 opacity-50" />
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
                        </div>
                    </div>
                </div>

                <div className="mobile-table-scroll">
                    <DataTable
                        loading={loading}
                        emptyMessage="No CA doc registries found"
                        headers={[
                            { label: "Sr.No", className: "w-[80px] text-center border-b-table border-r-table" },
                            { label: "Date", className: "border-b-table border-r-table" },
                            { label: "Document Name", className: "border-b-table border-r-table" },
                            { label: "Document Number", className: "border-b-table border-r-table" },
                            { label: "Internal ID", className: "font-mono border-b-table border-r-table" },
                            { label: "Actions", className: "text-center w-[120px] border-b-table" }
                        ]}
                        footer={
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 lg:p-2 bg-slate-50/10 border-t border-slate-100">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Showing <span className="text-primary">{reports.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0}</span> to <span className="text-primary">{Math.min(currentPage * itemsPerPage, reports.length)}</span> of <span className="text-primary">{reports.length}</span> entries
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
                                        <span className="text-[10px] font-black text-primary uppercase whitespace-nowrap">Page {currentPage} of {Math.ceil(reports.length / itemsPerPage) || 1}</span>
                                    </div>
                                    <button 
                                        onClick={() => setCurrentPage(p => Math.min(Math.ceil(reports.length / itemsPerPage), p + 1))}
                                        disabled={currentPage === Math.ceil(reports.length / itemsPerPage) || Math.ceil(reports.length / itemsPerPage) === 0}
                                        className="px-4 md:px-6 py-2 bg-white border border-slate-200 rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        }
                    >
                        {reports.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((report, idx) => (
                            <tr key={report.id} className="hover:bg-slate-50 transition-colors group text-[11px] font-bold text-slate-600 uppercase border-b-table">
                                <td className="px-4 py-3 border-r-table text-center font-black text-slate-400">
                                    {((currentPage - 1) * itemsPerPage) + idx + 1}
                                </td>
                                <td className="px-4 py-3 border-r-table">
                                    {new Date(report.document_date).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3 border-r-table font-black text-primary">
                                    {report.document_name}
                                </td>
                                <td className="px-4 py-3 border-r-table font-black">
                                    {report.document_number}
                                </td>
                                <td className="px-8 py-5 border-r-table font-mono text-[10px] text-slate-400">
                                    {report.report_id}
                                </td>
                                <td className="px-8 py-5 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <button 
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleView(report);
                                            }} 
                                            className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-slate-200 transition-all cursor-pointer relative z-40"
                                            title="View Details"
                                        >
                                            <Eye size={12} />
                                        </button>
                                        <button onClick={() => handleEdit(report)} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-primary hover:text-white transition-all">
                                            <Edit3 size={12} />
                                        </button>
                                        <button onClick={() => handleDelete(report.id)} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </DataTable>
                </div>
            </div>

            {/* 📝 Entry Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-full animate-in slide-in-from-bottom-8 duration-500">
                        {/* Header */}
                        <div className="bg-primary px-8 py-6 flex items-center justify-between text-white border-b border-white/10">
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight">{editingReport ? 'Edit CA Document' : 'New CA Finance Entry'}</h3>
                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Official Institutional Audit Trail</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-md transition-all border border-white/10">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-6 scrollbar-thin scrollbar-thumb-slate-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Document Date</label>
                                    <input 
                                        type="date" 
                                        name="document_date"
                                        required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-3 text-[12px] font-bold outline-none focus:bg-white transition-all shadow-inner"
                                        value={formData.document_date}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Document Number</label>
                                    <input 
                                        type="text" 
                                        name="document_number"
                                        required
                                        placeholder="Enter Ref No..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-3 text-[12px] font-bold outline-none focus:bg-white transition-all shadow-inner"
                                        value={formData.document_number}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Document Name / Title</label>
                                <input 
                                    type="text" 
                                    name="document_name"
                                    required
                                    placeholder="e.g. FY 2025-26 Audit Internal Report"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-3 text-[12px] font-bold outline-none focus:bg-white shadow-inner"
                                    value={formData.document_name}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                                    <select 
                                        name="category"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-3 text-[12px] font-bold outline-none focus:bg-white shadow-inner"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                    >
                                        <option value="Audit">Audit Report</option>
                                        <option value="Tax">Tax Compliance</option>
                                        <option value="Compliance">Regulatory Compliance</option>
                                        <option value="Internal">Internal Review</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                                    <select 
                                        name="status"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-3 text-[12px] font-bold outline-none focus:bg-white shadow-inner"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                    >
                                        <option value="pending">Pending Review</option>
                                        <option value="verified">Verified & Signed</option>
                                        <option value="archived">Archived</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description / Notes</label>
                                <textarea 
                                    name="description"
                                    rows="3"
                                    placeholder="Write document description..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-3 text-[12px] font-bold outline-none focus:bg-white shadow-inner resize-none"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Upload Document / Reference</label>
                                <div className="relative group">
                                    <input 
                                        type="file" 
                                        className="hidden"
                                        id="ca-doc-upload"
                                        onChange={handleFileChange}
                                    />
                                    <label htmlFor="ca-doc-upload" className="w-full flex items-center justify-center gap-3 px-4 py-5 bg-slate-50 border border-slate-200 border-dashed rounded-2xl cursor-pointer hover:bg-slate-100 transition-all">
                                        <Camera className="w-5 h-5 text-slate-400" />
                                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                                            {formData.attachment ? formData.attachment.name : (formData.attachment_url || 'Upload Official Document')}
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <button 
                                type="submit"
                                disabled={submitting}
                                className="w-full py-5 bg-primary text-white rounded-2xl font-black text-[12px] uppercase tracking-[0.3em] hover:bg-black transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5 text-emerald-400" />}
                                {editingReport ? 'Sync & Update Document' : 'Finalize & Record Entry'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* 👁️ View Detail Modal */}
            {isViewModalOpen && viewingReport && (
                <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-full animate-in zoom-in-95 duration-300">
                        <div className="bg-slate-900 px-8 py-6 flex items-center justify-between text-white">
                            <div>
                                <h3 className="text-xl font-black text-white! uppercase tracking-tight">CA Document Detail</h3>
                                <p className="text-[10px] font-bold text-white uppercase tracking-widest mt-1">Ref ID: {viewingReport.report_id}</p>
                            </div>
                            <button onClick={() => setIsViewModalOpen(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-md transition-all">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-thin scrollbar-thumb-slate-200">
                            <div className="flex flex-col items-center justify-center p-10 bg-slate-50 rounded-3xl border border-slate-100 relative overflow-hidden">
                                <FileText className="absolute -right-4 -bottom-4 w-32 h-32 text-slate-100 -rotate-12 outline-none" />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 relative z-10">Document Status</p>
                                <div className={`px-6 py-2 rounded-full text-[12px] font-black uppercase tracking-widest relative z-10 ${viewingReport.status === 'verified' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                    {viewingReport.status}
                                </div>
                                <h2 className="text-2xl font-black text-primary mt-6 tracking-tight relative z-10 uppercase text-center">{viewingReport.document_name}</h2>
                            </div>

                            <div className="grid grid-cols-2 gap-8 px-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Calendar size={12}/> Document Date</p>
                                    <p className="text-[13px] font-bold text-slate-700">
                                        {viewingReport.document_date ? new Date(viewingReport.document_date).toLocaleDateString() : 'N/A'}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><ShieldCheck size={12}/> Reference Number</p>
                                    <p className="text-[13px] font-bold text-slate-700">{viewingReport.document_number || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</p>
                                    <p className="text-[13px] font-bold text-slate-700">{viewingReport.category || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Internal Hash ID</p>
                                    <p className="text-[13px] font-mono text-slate-500">{viewingReport.report_id || 'N/A'}</p>
                                </div>
                            </div>

                            {viewingReport.description && (
                                <div className="px-4 space-y-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description & Notes</p>
                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 italic text-slate-600 text-[12px] leading-relaxed">
                                        "{viewingReport.description}"
                                    </div>
                                </div>
                            )}

                            <div className="px-4 pt-4 border-t border-slate-100">
                                <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-4">Official Attachment</p>
                                {viewingReport.attachment_url ? (
                                    <div className="flex items-center justify-between p-4 bg-white border-2 border-slate-50 rounded-2xl group hover:border-primary transition-all shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-primary/5 rounded-md flex items-center justify-center text-primary">
                                                <Camera size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black text-slate-700 uppercase">{viewingReport.attachment_url}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ready for verification</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <a 
                                                href={`${ROOT_URL}/uploads/${viewingReport.attachment_url}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-3 bg-slate-50 text-slate-400 rounded-md hover:bg-primary hover:text-white transition-all shadow-sm flex items-center justify-center"
                                            >
                                                <Eye size={16} />
                                            </a>
                                            <a 
                                                href={`${ROOT_URL}/uploads/${viewingReport.attachment_url}`}
                                                download={viewingReport.attachment_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-3 bg-slate-50 text-slate-400 rounded-md hover:bg-black hover:text-white transition-all shadow-sm flex items-center justify-center"
                                                onClick={() => {
                                                    Swal.fire({
                                                        title: 'Downloading...',
                                                        text: `Preparing ${viewingReport.attachment_url}`,
                                                        icon: 'info',
                                                        timer: 1500,
                                                        showConfirmButton: false
                                                    });
                                                }}
                                            >
                                                <Download size={16} />
                                            </a>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No document attached to this entry</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CAFinanceReport;
