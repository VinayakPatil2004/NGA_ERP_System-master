import React, { useState, useEffect, useCallback } from 'react';
import {
    Search, Users, ClipboardCheck, Clock, Eye, Calendar, TrendingUp, Phone, FileText,
    Trash2, CheckCircle, Menu, FileSpreadsheet, FilePieChart, UserPlus, RefreshCw, Download,
    Plus, Copy, Check, ChevronRight, X, ArrowRight, Zap, Filter, ChevronLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import DataTable from '../../../admcomponents/DataTable';
import AdmissionForm from '../../../../components/AdmissionForm';
import {
    getAllApplications,
    // getAdmissionStats,
    deleteApplication,
    // updateApplicationStatus,
    // enrollApplication
} from '../../../../services/applyAdmissionAPI';

const Admission = ({ toggleSidebar }) => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
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
    const itemsPerPage = 20;
    /*
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [enrollmentResult, setEnrollmentResult] = useState(null);
    const [allClassrooms, setAllClassrooms] = useState([]);
    */

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const yrRes = await fetch('http://localhost:5000/api/academic-years/all').then(res => res.json());
                /*
                const [yrRes, clsRes] = await Promise.all([
                    fetch('http://localhost:5000/api/academic-years/all').then(res => res.json()),
                    fetch('http://localhost:5000/api/classrooms').then(res => res.json())
                ]);

                setAcademicYearsList(yrRes);
                setAllClassrooms(clsRes);
                */

                const activeYear = yrRes.find(y => y.is_active);
                if (activeYear) {
                    setSelectedYear(activeYear.year_name);
                } else if (yrRes.length > 0) {
                    setSelectedYear(yrRes[0].year_name);
                }
            } catch (error) {
                console.error("Error loading initial data:", error);
            }
        };
        loadInitialData();
    }, []);

    const fetchAdmissionData = useCallback(async () => {
        if (!selectedYear) return;
        try {
            setLoading(true);
            const [appsData] = await Promise.all([
                getAllApplications(selectedYear),
                // getAdmissionStats(selectedYear)
            ]);
            setAdmissions(appsData || []);
            // setStats(statsData || { total: 0, pending: 0, inReview: 0, approved: 0, paid: 0, enrolled: 0 });
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
    const handleExport = (type) => {
        if (admissions.length === 0) {
            toast.warning("No data to export");
            return;
        }

        if (type === 'excel') {
            const exportData = filteredAdmissions.map(({ application_no, student_name, grade, father_mobile, status }) => ({
                "Enrollment ID": application_no,
                "Student Name": student_name,
                "Class": grade,
                "Contact No": father_mobile,
                "Status": status
            }));
            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Enrollments");
            XLSX.writeFile(wb, `Enrollments_Report_${new Date().toLocaleDateString()}.xlsx`);
            toast.success("Excel exported successfully");
        } else if (type === 'pdf') {
            const doc = new jsPDF();
            doc.text("Student Enrollment Report", 14, 15);
            const filtered = filteredAdmissions;
            const tableColumn = ["ID", "Name", "Class", "Contact", "Status"];
            const tableRows = filtered.map(app => [
                app.application_no,
                app.student_name,
                app.grade,
                app.father_mobile,
                app.status.toUpperCase()
            ]);
            doc.autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: 20,
                theme: 'grid',
                headStyles: { fillColor: '#000000', textColor: [255, 255, 255] }
            });
            doc.save(`Enrollments_Report_${new Date().toLocaleDateString()}.pdf`);
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
                subTitle="Grace ERP Institutional Registry"
                icon={UserPlus}
                badge={selectedYear || "AY 2026-27"}
                toggleSidebar={toggleSidebar}
                showSearch={true}
                onSearchToggle={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                hideDesktopSearch={true}
            >
                <div className="flex items-center gap-2 lg:gap-3">
                    <button
                        onClick={fetchAdmissionData}
                        className="p-3 bg-white/5 border border-white/10 lg:border-institutional rounded-xl hover:bg-black hover:text-white transition-all active:rotate-180 duration-700 text-white lg:text-primary"
                        title="Sync Registry"
                    >
                        <RefreshCw size={18} />
                    </button>
                    <div className="hidden lg:flex flex-col">
                        <p className="text-[10px] uppercase text-white opacity-50 tracking-[0.2em] mb-1 leading-none">Institutional Registry</p>
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-none">
                            Total : <span className="text-white ml-1">{admissions.length}</span>
                        </h3>
                    </div>
                </div>
            </ModuleHeader>

            {!showDirectEnrollModal ? (
                <div className="mt-2 animate-in fade-in duration-700 overflow-x-hidden">
                    {/* 2. Registry Action Bar (Responsive Variant) */}
                    <div className={`${isMobileSearchOpen ? 'flex' : 'hidden lg:flex'} flex-col lg:flex-row items-center justify-between gap-4 p-4 lg:p-6 rounded-2xl mb-4 bg-white lg:bg-transparent border border-black/5 lg:border-none shadow-xl lg:shadow-none animate-in slide-in-from-top-2 duration-300`}>
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
                                className="w-full pl-11 pr-4 py-4 border border-slate-200 rounded-xl text-primary text-[10px] font-black uppercase tracking-widest outline-none shadow-sm transition-all bg-white hover:bg-slate-50"
                            />
                        </div>

                        <div className="grid grid-cols-2 lg:flex items-center gap-3 w-full lg:w-auto">
                            <button
                                onClick={() => setShowDirectEnrollModal(true)}
                                className="col-span-2 lg:col-span-1 px-8 py-4 bg-primary text-white border border-primary rounded-xl font-black text-[10px] lg:text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-black"
                            >
                                <Plus size={18} />
                                Add Student
                            </button>

                            <div className="relative">
                                <button
                                    onClick={() => setShowFilterMenu(!showFilterMenu)}
                                    className={`w-full p-4 border border-slate-200 rounded-xl transition-all flex items-center justify-center gap-2 group shadow-sm ${showFilterMenu ? 'bg-primary text-white' : 'bg-white text-primary hover:bg-primary hover:text-white'}`}
                                >
                                    <Filter className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Filter</span>
                                </button>

                                {showFilterMenu && (
                                    <div className="absolute top-full right-0 mt-3 w-80 bg-white border border-institutional rounded-2xl shadow-xl p-6 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
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

                            <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-xl shadow-sm">
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
                            { label: "Date", className: "w-[100px]" },
                            { label: "ID", className: "w-[110px]" },
                            { label: "Student Name", className: "min-w-[250px]" },
                            { label: "Parent Entity" },
                            { label: "Contact", className: "w-[140px]" },
                            { label: "Grade", className: "w-[100px]" },
                            { label: "Action", className: "text-center min-w-[180px]" }
                        ]}
                        columnCount={7}
                        loading={loading}
                        emptyMessage="No Registry Entries Detected"
                        footer={
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <p className="text-[10px] font-black uppercase tracking-widest txt-black opacity-60">
                                        Showing {paginatedAdmissions.length} of {filteredAdmissions.length} Identities
                                    </p>
                                    <div className="h-4 w-px bg-black opacity-20 invisible md:visible"></div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-black animate-pulse" />
                                        <span className="text-[10px] font-bold txt-black uppercase tracking-tight">Institutional Database Linked</span>
                                    </div>
                                </div>

                                {totalPages > 1 && (
                                    <div className="flex items-center gap-2 bg-white border-table p-1 rounded-xl shadow-sm">
                                        <button
                                            disabled={currentPage === 1}
                                            onClick={() => setCurrentPage(prev => prev - 1)}
                                            className="p-2 hover:bg-black hover:text-white disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-black rounded-lg transition-all txt-black"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                        <div className="flex items-center gap-1 px-4">
                                            <span className="text-[11px] font-black txt-black">{currentPage}</span>
                                            <span className="text-[10px] font-bold txt-black opacity-50">/</span>
                                            <span className="text-[11px] font-black txt-black opacity-50">{totalPages}</span>
                                        </div>
                                        <button
                                            disabled={currentPage === totalPages}
                                            onClick={() => setCurrentPage(prev => prev + 1)}
                                            className="p-2 hover:bg-black hover:text-white disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-black rounded-lg transition-all txt-black"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        }
                    >
                        {paginatedAdmissions.map((app) => (

                            <tr key={app.id} className="hover-table-row transition-colors group">
                                <td className="px-8 py-6 border-b-table border-r-table">
                                    <p className="text-[9px] text-table-cell font-bold uppercase opacity-60">{new Date(app.created_at).toLocaleDateString()}</p>
                                </td>
                                <td className="px-8 py-6 border-b-table border-r-table">
                                    <span className="text-[10px] font-black text-table-cell bg-white px-3 py-1.5 rounded-lg border-table shadow-sm whitespace-nowrap">
                                        {app.application_no.split('/').pop()}
                                    </span>
                                </td>
                                <td className="px-8 py-6 border-b-table border-r-table">
                                    <div
                                        className="cursor-pointer group/name"
                                        onClick={() => navigate(`view/${app.id}`)}
                                    >
                                        <p className="text-[12px] font-bold text-table-cell uppercase tracking-tight">{app.student_name}</p>

                                    </div>
                                </td>
                                <td className="px-8 py-6 border-b-table border-r-table">
                                    <span className="text-[12px] font-bold text-table-cell uppercase tracking-tight">{app.father_name}</span>
                                </td>
                                <td className="px-8 py-6 border-b-table border-r-table">
                                    <span className="text-[12px] font-bold font-mono text-table-cell tracking-tight opacity-80">{app.father_mobile}</span>
                                </td>
                                <td className="px-8 py-6 border-b-table border-r-table">
                                    <span className="px-4 py-2 bg-white text-table-cell text-[11px] font-bold rounded-lg border-table uppercase tracking-widest">
                                        {app.grade}
                                    </span>
                                </td>
                                <td className="px-8 py-6 text-right border-b-table">
                                    <div className="flex items-center justify-end gap-3">
                                        <button
                                            onClick={() => navigate(`view/${app.id}`)}
                                            className="p-3 bg-white border-table text-table-cell rounded-xl cursor-pointer hover:bg-gray-400 hover:text-white transition-all shadow-sm active:scale-95"
                                            title="View Details"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(app.id)}
                                            className="p-3 bg-white border-table text-table-cell rounded-xl cursor-pointer hover:bg-gray-400 hover:text-white transition-all shadow-sm active:scale-95"
                                            title="Delete Entry"
                                        >
                                            <Trash2 className="w-4 h-4" />
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
