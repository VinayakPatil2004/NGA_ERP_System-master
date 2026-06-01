import React, { useState, useEffect, useCallback } from 'react';
import {
    Search, Users, Clock, Eye, Calendar, Phone, FileText,
    Trash2, CheckCircle, FileSpreadsheet, FilePieChart, UserPlus, RefreshCcw,
    ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { ACADEMIC_YEARS } from '../../../../utils/constants';
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import {
    getAllApplications,
    // getAdmissionStats,
    deleteApplication,
    // updateApplicationStatus
} from '../../../../services/applyAdmissionAPI';

/**
 * Principle Admission - Strategic Registry Review
 * Refined to the 'Simplified Premium' aesthetic with rounded-2xl and 1px borders.
 */
const Admission = ({ toggleSidebar }) => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedYear, setSelectedYear] = useState('2026-27');
    const [admissions, setAdmissions] = useState([]);
    /*
    const [stats, setStats] = useState({ total: 0, pending: 0, inReview: 0, approved: 0, paid: 0, enrolled: 0 });
    */
    const [loading, setLoading] = useState(true);
    /*
    const [statusFilter, setStatusFilter] = useState('all');
    */

    const fetchAdmissionData = useCallback(async () => {
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
    }, [fetchAdmissionData, selectedYear]);

    /*
    const handleStatusChange = async (id, newStatus) => {
        try {
            await updateApplicationStatus(id, newStatus);
            toast.success(`Status updated to ${newStatus}`);
            fetchAdmissionData();
        } catch (error) {
            console.error("Status Update Error:", error);
            toast.error("Failed to update status");
        }
    };
    */

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this application?")) {
            try {
                await deleteApplication(id);
                toast.success("Application deleted");
                fetchAdmissionData();
            } catch (error) {
                console.error("Delete Error:", error);
                toast.error("Failed to delete application");
            }
        }
    };

    const handleExport = (type) => {
        if (!admissions || admissions.length === 0) {
            toast.warning("No data to export");
            return;
        }

        const filteredData = admissions.filter(a => {
            const matchesSearch = (a.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) || a.application_no?.includes(searchTerm));
            // const matchesStatus = statusFilter === 'all' ? true : a.status === statusFilter;
            return matchesSearch; // && matchesStatus;
        });

        if (type === 'excel') {
            const exportData = filteredData.map(({ application_no, student_name, grade, father_mobile, status }) => ({
                "Application No": application_no,
                "Applicant Name": student_name,
                "Class": grade,
                "Contact No": father_mobile,
                "Status": status
            }));
            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Admissions");
            XLSX.writeFile(wb, `Admissions_Report_${new Date().toLocaleDateString()}.xlsx`);
            toast.success("Excel exported successfully");
        } else if (type === 'pdf') {
            const doc = new jsPDF();
            doc.text("Admission Applications Report", 14, 15);
            const tableColumn = ["App No", "Applicant Name", "Class", "Contact No", "Status"];
            const tableRows = filteredData.map(app => [
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
                headStyles: { fillStyle: '#001736', textColor: [255, 255, 255] }
            });
            doc.save(`Admissions_Report_${new Date().toLocaleDateString()}.pdf`);
            toast.success("PDF exported successfully");
        }
    };

    const filteredAdmissions = admissions.filter(a => {
        const matchesSearch = (a.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) || a.application_no?.includes(searchTerm));
        // const matchesStatus = statusFilter === 'all' ? true : a.status === statusFilter;
        return matchesSearch; // && matchesStatus;
    });

    return (
        <div className="p-4 lg:p-8 bg-[#F8FAFC] min-h-screen font-sans text-left">

            {/* 1. Unified Module Header */}
            <ModuleHeader
                title="Admission Review"
                subTitle="Academic Registry Insight & Strategic Enrollment"
                icon={ShieldCheck}
                badge={`AY ${selectedYear}`}
                toggleSidebar={toggleSidebar}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                searchPlaceholder="Search identities..."
            >
                <div className="flex flex-wrap items-center gap-3">
                    <select
                        className="bg-white border border-slate-200 text-[#001736] text-[11px] font-bold uppercase tracking-widest px-5 py-3 rounded-xl outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all cursor-pointer shadow-sm"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                    >
                        {ACADEMIC_YEARS.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>

                    <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
                        <button
                            onClick={() => handleExport('excel')}
                            className="p-2 hover:bg-slate-50 rounded-lg text-[#001736] transition-colors flex items-center gap-2 px-3"
                            title="Export Excel"
                        >
                            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Excel</span>
                        </button>
                        <div className="w-px h-4 bg-slate-100" />
                        <button
                            onClick={() => handleExport('pdf')}
                            className="p-2 hover:bg-slate-50 rounded-lg text-[#001736] transition-colors flex items-center gap-2 px-3"
                            title="Export PDF"
                        >
                            <FilePieChart className="w-4 h-4 text-rose-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">PDF</span>
                        </button>
                    </div>

                    <button
                        onClick={fetchAdmissionData}
                        className="p-3 bg-white border border-slate-200 rounded-xl text-[#001736] hover:bg-slate-50 transition-all shadow-sm active:rotate-180 duration-500"
                    >
                        <RefreshCcw size={20} />
                    </button>
                </div>
            </ModuleHeader>

            {/* 2. Metrics Grid (Deprecated: Direct Enrollment Only) */}
            {/*
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                ... 
            </div>
            */}
            <div className="mb-10 p-6 bg-indigo-50 border border-indigo-100 rounded-2xl">
                <h3 className="text-sm font-black text-indigo-700 uppercase tracking-widest">Institutional Enrollment Registry</h3>
                <p className="text-[10px] text-indigo-600/60 font-bold uppercase mt-1">Strategic oversight for the {selectedYear} academic cycle.</p>
            </div>

            {/* 3. Application Registry */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h2 className="text-[11px] font-bold text-[#001736] uppercase tracking-widest opacity-60">Strategic Registry Console</h2>
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-400 uppercase tracking-widest shadow-sm">
                            Identities Tracked: {filteredAdmissions.length}
                        </span>
                    </div>
                </div>

                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left table-fixed min-w-[1000px]">
                        <thead>
                            <tr className="bg-white border-b border-slate-100">
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[180px]">Application ID</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Personnel Identity</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[160px]">Contact No.</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[100px]">Class</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[140px]">Access Status</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center w-[160px]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="6" className="px-8 py-6 h-16 bg-slate-50/20"></td>
                                    </tr>
                                ))
                            ) : filteredAdmissions.length > 0 ? (
                                filteredAdmissions.map((app) => (
                                    <tr key={app.id} className="hover:bg-slate-50/30 transition-colors group">
                                        <td className="px-8 py-6 border-r border-slate-50">
                                            <span className="text-[11px] font-bold text-indigo-500 bg-indigo-50/50 px-3 py-1.5 rounded-lg border border-indigo-100 shadow-sm whitespace-nowrap">
                                                {app.application_no}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 border-r border-slate-50">
                                            <div
                                                className="cursor-pointer"
                                                onClick={() => navigate(`view/${app.id}`)}
                                            >
                                                <p className="text-[14px] font-bold text-[#001736] group-hover:text-indigo-600 transition-colors uppercase tracking-tight leading-none">{app.student_name}</p>
                                                <p className="text-[9px] text-slate-300 font-bold uppercase mt-2 tracking-widest">{new Date(app.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 border-r border-slate-50">
                                            <div className="flex items-center gap-3 text-slate-400">
                                                <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                                                    <Phone className="w-3.5 h-3.5 opacity-40 text-[#001736]" />
                                                </div>
                                                <span className="text-[11px] font-bold font-mono tracking-tighter text-[#001736]">{app.father_mobile}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 border-r border-slate-50">
                                            <span className="px-3 py-1.5 bg-slate-50 text-[#001736] text-[10px] font-bold rounded-lg border border-slate-100 shadow-sm uppercase">
                                                {app.grade}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 border-r border-slate-50">
                                            <div className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5 border border-black/5 shadow-sm ${app.status === 'approved' ? 'bg-emerald-500 text-white' :
                                                app.status === 'pending' ? 'bg-amber-400 text-[#001736]' :
                                                    app.status === 'verified' ? 'bg-indigo-500 text-white' :
                                                        'bg-slate-400 text-white'
                                                }`}>
                                                {app.status === 'verified' ? 'In Review' : app.status}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center justify-center gap-3">
                                                {/* Status Change Capability Deprecated */}
                                                {/*
                                                {app.status === 'approved' && (
                                                    <button
                                                        onClick={() => handleStatusChange(app.id, 'enrolled')}
                                                        className="p-3 bg-white border border-slate-200 text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all shadow-sm active:scale-95"
                                                        title="Enroll Identity"
                                                    >
                                                        <UserPlus className="w-5 h-5" />
                                                    </button>
                                                )}
                                                */}
                                                <button
                                                    onClick={() => navigate(`view/${app.id}`)}
                                                    className="p-3 bg-white border border-slate-200 text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all shadow-sm active:scale-95"
                                                    title="View Specifications"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(app.id)}
                                                    className="p-3 bg-white border border-slate-200 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-95"
                                                    title="Delete Entry"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                                                <FileText className="w-10 h-10 text-slate-200 opacity-40" />
                                            </div>
                                            <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">No Applications Matching Your View</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const StatusMetric = ({ label, value, icon, color, active, onClick }) => {
    const Icon = icon;
    return (
        <button
            onClick={onClick}
            className={`relative overflow-hidden bg-white p-7 rounded-2xl border transition-all duration-300 group hover:shadow-lg active:scale-[0.98] text-left
            ${active ? `border-indigo-500 ring-8 ring-indigo-500/5` : 'border-slate-100 hover:border-slate-200'}`}
        >
            <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-linear-to-br ${color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform border border-white/10`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
                {active && <div className="w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_12px_rgba(99,102,241,0.5)]" />}
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{label}</p>
                <h3 className="text-3xl font-bold text-[#001736] tracking-tighter leading-none">{value?.toLocaleString() || 0}</h3>
            </div>
        </button>
    );
};

export default Admission;
