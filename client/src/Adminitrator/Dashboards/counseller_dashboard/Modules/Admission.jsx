import React, { useState, useEffect, useCallback } from 'react';
import {
    Search, Clock, Eye, Calendar, Phone, FileText,
    Trash2, Menu, FileSpreadsheet, FilePieChart, UserPlus, RefreshCw, Download,
    Plus, Copy, Check, ChevronRight, X, ArrowRight, Zap, Filter, ChevronLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import DataTable from '../../../admcomponents/DataTable';
import AdmissionForm from '../../../../components/AdmissionForm';
import API from '../../../../services/API';
import ngaLogo from '../../../../assets/nga-logo.png';
import {
    getAllApplications,
    deleteApplication,
    // updateApplicationStatus,
    // enrollApplication
} from '../../../../services/applyAdmissionAPI';
import { useAcademicYear } from '../../../../context/AcademicYearContext';

const Admission = ({ toggleSidebar }) => {
    const navigate = useNavigate();
    const { selectedYear: globalYear } = useAcademicYear();
    // Derive selectedYear from global context
    const selectedYear = globalYear?.year_name || '';

    const [searchTerm, setSearchTerm] = useState('');
    /*
    const [academicYearsList, setAcademicYearsList] = useState([]);
    */
    const [admissions, setAdmissions] = useState([]);

    const [loading, setLoading] = useState(true);
    const [showEnrollModal, setShowEnrollModal] = useState(false);

    // Filtering & Pagination State
    const [filterGrade, setFilterGrade] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;
    /*
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [enrollmentResult, setEnrollmentResult] = useState(null);
    const [allClassrooms, setAllClassrooms] = useState([]);
    */

    const fetchAdmissionData = useCallback(async () => {
        if (!selectedYear) return;
        try {
            setLoading(true);
            const appsData = await getAllApplications(selectedYear);
            setAdmissions(appsData || []);
        } catch (error) {
            console.error("Error fetching admission data:", error);
            toast.error("Failed to load admission data");
        } finally {
            setLoading(false);
        }
    }, [selectedYear]);

    useEffect(() => {
        fetchAdmissionData();
    }, [fetchAdmissionData]);

    // Status management is deprecated in favor of direct enrollment
    /*
    const handleStatusChange = async (id, newStatus) => {
        try {
            if (newStatus === 'enrolled') {
                const app = admissions.find(a => a.id === id);
                setSelectedApplication(app);
                setShowEnrollModal(true);
                return;
            } else {
                await updateApplicationStatus(id, newStatus);
                toast.success(`Status updated to ${newStatus}`);
            }
            fetchAdmissionData();
        } catch (error) {
            console.error("Status Update Error:", error);
            toast.error(error.response?.data?.error || "Failed to update status");
        }
    };
    */

    /*
    const handleEnrollSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        try {
            const res = await enrollApplication(selectedApplication.id, data);
            setEnrollmentResult(res);
            toast.success("Student Enrolled Successfully!");
            fetchAdmissionData();
        } catch (error) {
            toast.error(error.response?.data?.error || "Enrollment failed");
        }
    };
    */
    /*
    const handleEnrollSubmit = () => {
        toast.info("Manual enrollment transition deprecated. Use 'NEW REGISTRY'.");
    };
    */

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this application?")) {
            try {
                await deleteApplication(id);
                toast.success("Application deleted");
                fetchAdmissionData();
            } catch {
                toast.error("Failed to delete application");
            }
        }
    };
    const handleExport = async (type) => {
        if (admissions.length === 0) {
            toast.warning("No data to export");
            return;
        }

        const tableColumn = ["Sr. No", "Date", "ID", "Student Name", "Parent Entity", "Contact", "Grade"];
        const tableRows = filteredAdmissions.map((app, index) => [
            index + 1,
            new Date(app.created_at).toLocaleDateString('en-GB'),
            app.application_no.split('/').pop(),
            app.student_name,
            app.father_name,
            app.father_mobile,
            app.grade
        ]);

        if (type === 'excel') {
            const exportData = filteredAdmissions.map((app, index) => ({
                "Sr. No": index + 1,
                "Date": new Date(app.created_at).toLocaleDateString('en-GB'),
                "ID": app.application_no.split('/').pop(),
                "Student Name": app.student_name,
                "Parent Entity": app.father_name,
                "Contact": app.father_mobile,
                "Grade": app.grade
            }));
            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Enrollments");
            XLSX.writeFile(wb, `NGA_Enrollments_${new Date().toLocaleDateString('en-GB')}.xlsx`);
            toast.success("Excel exported successfully");
        } else if (type === 'pdf') {
            const doc = new jsPDF();
            const institutionalNavy = [0, 23, 54]; // #001736

            // 1. School Branding Header
            try {
                // Use the imported local logo
                doc.addImage(ngaLogo, 'PNG', 14, 10, 22, 22);
            } catch (e) {
                console.warn("Local logo could not be loaded for PDF:", e);
            }

            doc.setTextColor(institutionalNavy[0], institutionalNavy[1], institutionalNavy[2]);
            doc.setFontSize(22);
            doc.setFont("helvetica", "bold");
            doc.text("NEW GRACE ACADEMY", 40, 18);

            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(100, 116, 139); // slate-500
            doc.text("Ekta Nagar, Near Ankay Housing Society, Borgad, Mhasrul, Nashik-422 004.", 40, 25);
            doc.text("Contact: +91 91684 42244 | Website: www.newgraceacademy.in", 40, 30);

            // 2. Horizontal Separator
            doc.setDrawColor(institutionalNavy[0], institutionalNavy[1], institutionalNavy[2]);
            doc.setLineWidth(0.5);
            doc.line(14, 36, 196, 36);

            // 3. Report Metadata
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(institutionalNavy[0], institutionalNavy[1], institutionalNavy[2]);
            doc.text(`ENROLLMENT REGISTRY REPORT`, 14, 45);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.text(`Generated On: ${new Date().toLocaleDateString('en-GB')}`, 145, 45);

            // 4. Data Table
            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 50,
                theme: 'grid',
                headStyles: {
                    fillColor: institutionalNavy,
                    textColor: [255, 255, 255],
                    fontSize: 9,
                    fontStyle: 'bold',
                    halign: 'center'
                },
                styles: {
                    fontSize: 8,
                    cellPadding: 3
                },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 15 },
                    6: { halign: 'center', cellWidth: 20 }
                }
            });

            doc.save(`NGA_Registry_${new Date().toLocaleDateString('en-GB')}.pdf`);
            toast.success("PDF exported successfully");
        }
    };

    const filteredAdmissions = admissions.filter(a => {
        const matchesSearch = !searchTerm ||
            a.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.application_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.father_name?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesGrade = filterGrade ? a.grade === filterGrade : true;
        const matchesDate = filterDate ? new Date(a.created_at).toISOString().split('T')[0] === filterDate : true;
        return matchesSearch && matchesGrade && matchesDate;
    });

    const totalPages = Math.ceil(filteredAdmissions.length / itemsPerPage);
    const paginatedAdmissions = filteredAdmissions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const [showDirectEnrollModal, setShowDirectEnrollModal] = useState(false);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

    return (
        <div className="p-4 md:p-8 bg-institutional-page min-h-screen font-sans overflow-x-hidden">

            {/* 1. Global Admissions Header */}
            <ModuleHeader
                title="Student Enrollment"
                subTitle="NGA - New Grace Academy"
                icon={UserPlus}
                badge={selectedYear || "AY 2026-27"}
                toggleSidebar={toggleSidebar}
                showSearch={true}
                hideDesktopSearch={true}
                searchValue={searchTerm}
                onSearchChange={(val) => {
                    setSearchTerm(val);
                    setCurrentPage(1);
                }}
                onSearchToggle={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            >
                {/* <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-4 mt-8">
                <StatusMetric label="Total Admission" value={stats.total} iconComponent={Users} color="indigo" />
                <StatusMetric label="Active Pupils" value={stats.enrolled} iconComponent={ClipboardCheck} color="emerald" />
                <StatusMetric label="Conversion" value={stats.total > 0 ? `${Math.round((stats.enrolled / stats.total) * 100)}%` : '0%'} iconComponent={TrendingUp} color="amber" />
                <StatusMetric label="Registry Status" value="Online" iconComponent={CheckCircle} color="rose" />
            </div> */}
                <div className="flex items-center gap-2 lg:gap-3">
                    {/* Add Student Plus Icon - Header (Mobile Only) */}
                    <button
                        onClick={() => setShowDirectEnrollModal(true)}
                        className="lg:hidden p-3 bg-white/10 border border-white/20 rounded-xl text-amber-400 hover:bg-black hover:text-white transition-all shadow-xl active:scale-95 shrink-0"
                        title="New Enrollment"
                    >
                        <Plus size={18} />
                    </button>

                    <button
                        onClick={fetchAdmissionData}
                        className="p-3 bg-white border border-white/10 rounded-xl hover:bg-gray-300 cursor-pointer hover:text-gray-900 transition-all active:rotate-180 duration-700 text-black"
                        title="Sync Registry"
                    >
                        <RefreshCw size={18} />
                    </button>
                    <div className="hidden lg:flex flex-col">
                        <p className="text-[10px] uppercase text-white  tracking-[0.2em] mb-1 leading-none">Institutional Registry</p>
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-none">
                            Total : <span className="text-white ml-1">{admissions.length}</span>
                        </h3>
                    </div>
                </div>
            </ModuleHeader>


            {!showDirectEnrollModal ? (
                <div className="mt-2 animate-in fade-in duration-700 overflow-x-hidden">
                    {/* 2. Registry Action Bar (Responsive Variant) */}
                    <div className={`flex flex-col lg:flex-row items-center justify-between gap-4 py-6 rounded-2xl mb-4 ${!isMobileSearchOpen ? 'hidden lg:flex' : 'flex animate-in slide-in-from-top-2 duration-300'}`}>
                        <div className="flex flex-1 max-w-md w-full relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-40 group-focus-within:opacity-100 transition-opacity" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                placeholder="Search Registry..."
                                className="w-full pl-11 pr-4 py-4 border border-black rounded-xl text-primary text-[10px] font-black uppercase tracking-widest outline-none shadow-sm transition-all bg-white hover:bg-slate-50"
                            />
                        </div>

                        <div className="grid grid-cols-2 lg:flex items-center gap-3 w-full lg:w-auto">
                            <button
                                onClick={() => setShowDirectEnrollModal(true)}
                                className="hidden cursor-pointer lg:flex px-8 py-4 bg-primary btn-add-institutional rounded-xl font-black text-[10px] lg:text-[11px] uppercase tracking-widest items-center justify-center gap-3 active:scale-95 transition-all"
                            >
                                <Plus size={18} />
                                Add Student
                            </button>

                            <div className="relative">
                                <button
                                    onClick={() => setShowFilterMenu(!showFilterMenu)}
                                    className={`w-full cursor-pointer p-4 rounded-xl transition-all flex items-center justify-center gap-2 group shadow-sm ${showFilterMenu ? 'bg-primary text-white' : 'bg-white btn-add-institutional'}`}
                                >
                                    <Filter className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Filter</span>
                                </button>

                                {showFilterMenu && (
                                    <div className="fixed lg:absolute top-24 lg:top-full left-4 right-4 lg:left-auto lg:right-0 mt-3 lg:w-80 bg-white border border-institutional rounded-2xl shadow-2xl p-6 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between pb-3">
                                                <h4 className="text-[11px] font-black uppercase tracking-widest text-primary">Registry Filters</h4>
                                                <button className="text-primary hover:opacity-50 transition-opacity" onClick={() => setShowFilterMenu(false)}><X size={14} /></button>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-primary opacity-60 uppercase tracking-widest mb-3 block">Classroom Grade</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'].map(g => (
                                                        <button
                                                            key={g}
                                                            onClick={() => {
                                                                setFilterGrade(filterGrade === g ? '' : g);
                                                                setCurrentPage(1);
                                                            }}
                                                            className={`px-3 py-2 rounded-lg text-[9px] font-bold uppercase transition-all border border-institutional ${filterGrade === g ? 'bg-black text-white' : 'bg-white text-primary hover:bg-black hover:text-white'}`}
                                                        >
                                                            {g}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-primary opacity-60 uppercase tracking-widest mb-3 block">Enrollment Date</label>
                                                <input
                                                    type="date"
                                                    value={filterDate}
                                                    onChange={(e) => {
                                                        setFilterDate(e.target.value);
                                                        setCurrentPage(1);
                                                    }}
                                                    className="w-full p-4 bg-white border border-institutional rounded-xl text-[10px] font-bold uppercase outline-none transition-all text-primary hover:bg-slate-50"
                                                />
                                            </div>
                                            <div className="pt-2">
                                                <button
                                                    onClick={() => { setFilterGrade(''); setFilterDate(''); setCurrentPage(1); }}
                                                    className="w-full py-3 bg-white text-primary border border-institutional rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-sm"
                                                >
                                                    Remove Active Filter
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2 bg-white border p-1.5 rounded-xl shadow-sm">
                                <button
                                    onClick={() => handleExport('excel')}
                                    className="p-2 cursor-pointer hover:bg-emerald-50 text-emerald-600 rounded-lg transition-all"
                                    title="Export Excel"
                                >
                                    <FileSpreadsheet className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => handleExport('pdf')}
                                    className="p-2 cursor-pointer hover:bg-rose-50 text-rose-600 rounded-lg transition-all"
                                    title="Export PDF"
                                >
                                    <FilePieChart className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <DataTable
                        headers={[
                            { label: "Sr. No", className: "w-[50px] border-r border-black text-center" },
                            { label: "Date", className: "w-[90px] border-r border-black" },
                            { label: "ID", className: "w-[100px] border-r border-black" },
                            { label: "Student Name", className: "min-w-[200px] border-r border-black" },
                            { label: "Parent Entity", className: "border-r border-black" },
                            { label: "Contact", className: "w-[120px] border-r border-black" },
                            { label: "Grade", className: "w-[80px] border-r border-black" },
                            { label: "Action", className: "text-center min-w-[150px]" }
                        ]}
                        columnCount={8}
                        loading={loading}
                        emptyMessage="No Registry Entries Detected"
                        footer={
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-institutional-muted">
                                    Showing <span className="text-institutional-main">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="text-institutional-main">{Math.min(currentPage * itemsPerPage, filteredAdmissions.length)}</span> of <span className="text-institutional-main">{filteredAdmissions.length}</span> Identities
                                </p>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="px-4 py-2 bg-white border border-table rounded text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    >
                                        Prev
                                    </button>
                                    <div className="flex items-center gap-1 px-4">
                                        <span className="text-[10px] font-black text-institutional-main uppercase">Page {currentPage} of {totalPages || 1}</span>
                                    </div>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages || totalPages === 0}
                                        className="px-4 py-2 bg-white border border-table rounded text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        }
                    >
                        {paginatedAdmissions.map((app, index) => (

                            <tr key={app.id} className="hover-table-row transition-colors group">
                                <td className="px-4 py-4 border-b border-r border-black text-center">
                                    <p className="text-[10px] text-table-cell font-black">{(currentPage - 1) * itemsPerPage + index + 1}</p>
                                </td>
                                <td className="px-4 py-4 border-b border-r border-black">
                                    <p className="text-[9px] text-table-cell font-bold uppercase">{new Date(app.created_at).toLocaleDateString()}</p>
                                </td>
                                <td className="px-4 py-4 border-b border-r border-black">
                                    <span className="text-[10px] font-black text-table-cell bg-white px-2 py-1 rounded-lg border border-black shadow-sm whitespace-nowrap">
                                        {app.application_no.split('/').pop()}
                                    </span>
                                </td>
                                <td className="px-4 py-4 border-b border-r border-black">
                                    <div
                                        className="cursor-pointer group/name"
                                        onClick={() => navigate(`view/${app.id}`)}
                                    >
                                        <p className="text-[11px] font-bold text-table-cell uppercase tracking-tight">{app.student_name}</p>
                                    </div>
                                </td>
                                <td className="px-4 py-4 border-b border-r border-black">
                                    <span className="text-[11px] font-bold text-table-cell uppercase tracking-tight">{app.father_name}</span>
                                </td>
                                <td className="px-4 py-4 border-b border-r border-black">
                                    <span className="text-[11px] font-bold font-mono text-table-cell tracking-tight opacity-80">{app.father_mobile}</span>
                                </td>
                                <td className="px-4 py-4 border-b border-r border-black">
                                    <span className="px-3 py-1.5 bg-white text-table-cell text-[10px] font-bold rounded-lg border border-black uppercase tracking-widest">
                                        {app.grade}
                                    </span>
                                </td>
                                <td className="px-4 py-4 text-center border-b border-black">
                                    <div className="flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => navigate(`view/${app.id}`)}
                                            className="p-2 bg-white border border-black text-table-cell rounded-xl cursor-pointer hover:bg-gray-400 hover:text-white transition-all shadow-sm active:scale-95"
                                            title="View Details"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(app.id)}
                                            className="p-2 bg-white border border-black text-table-cell rounded-xl cursor-pointer hover:bg-gray-400 hover:text-white transition-all shadow-sm active:scale-95"
                                            title="Delete Entry"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </DataTable>
                </div>
            ) : (
                <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <AdmissionForm onClose={() => {
                        setShowDirectEnrollModal(false);
                        fetchAdmissionData();
                    }} />
                </div>
            )}


            {/* Enrollment Result Modal (Deprecated in favor of direct NEW REGISTRY) */}
            {showEnrollModal && (
                <div className="fixed inset-0 bg-[#001736]/90 backdrop-blur-md z-110 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl w-full max-w-2xl border border-white/20 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-12 text-center">
                            <h3 className="text-2xl font-black text-black uppercase">Feature Deprecated</h3>
                            <p className="text-slate-500 mt-4">Legacy application enrollment is disabled. Please use the "NEW REGISTRY" button for direct student enrollment.</p>
                            <button onClick={() => setShowEnrollModal(false)} className="mt-8 px-8 py-3 bg-black text-white rounded-xl font-bold uppercase text-xs">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Admission;
