import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
    FileSpreadsheet, FilePieChart, Calendar, ArrowRight, TrendingUp, IndianRupee,
    User, Users, Hash, Smartphone, Banknote, Landmark, CreditCard,
    ListFilter, ClipboardList, Wallet, ChevronDown, Filter as FilterIcon,
    Loader2
} from 'lucide-react';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell
} from 'recharts';
import { StatBox, ReportFilterShell, ReportHeader, SimpleChartWrapper, PlaceholderReport, InstitutionalReportToolbar, TablePagination } from './ReportUIComponents';
import DataTable from '../../../../../admcomponents/DataTable';
import API from '../../../../../../services/API';
import { toast } from 'react-toastify';
import { getClassrooms, getAcademicYearsList } from '../../../../../../services/classroomAPI';
import { getFeeStructures } from '../../../../../../services/FeesAndFinance/feeStructureAPI';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAcademicYear } from '../../../../../../context/AcademicYearContext';

// --- UTILS ---
const formatCurrency = (val) => new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
}).format(val || 0);

// --- MOCK DATA (Retained for Charts if needed, but primary reports use API) ---
const MOCK_COLLECTIONS = [];
for (let i = 1; i <= 55; i++) {
    const modes = ['Cash', 'UPI', 'Online', 'Cheque'];
    const names = ['Aarav', 'Isha', 'Rohan', 'Sanya', 'Kabir', 'Ananya', 'Dev', 'Meera', 'Arjun', 'Priya'];
    const sours = ['Sharma', 'Patel', 'Gupta', 'Malhotra', 'Singh', 'Verma', 'Shah', 'Nair', 'Das', 'Reddy'];
    MOCK_COLLECTIONS.push({
        date: `2026-04-${String(10 + (i % 20)).padStart(2, '0')}`,
        amount: 5000 + (Math.floor(Math.random() * 40) * 1000),
        mode: modes[i % 4],
        student: `${names[i % 10]} ${sours[(i + 3) % 10]}`,
        class: `${['I', 'II', 'V', 'VIII', 'X'][(i % 5)]}-A`
    });
}

const MOCK_DUE_DATA = [];
for (let i = 1; i <= 55; i++) {
    MOCK_DUE_DATA.push({
        id: `GR2026${String(i).padStart(3, '0')}`,
        class: `${['I', 'II', 'V', 'VIII', 'X'][(i % 5)]}-A`,
        name: `Student ${i}`,
        father: `Father ${i}`,
        contact: `98765${String(i).padStart(5, '0')}`,
        annual: 65000,
        t1: i % 3 === 0 ? 0 : 5000,
        t2: i % 2 === 0 ? 12500 : 0,
        transport: i % 4 === 0 ? 2500 : 0
    });
}

const MOCK_PAYMENT_MIX = [
    { name: 'Cash', value: 40, color: '#0f172a' },
    { name: 'UPI', value: 35, color: '#4f46e5' },
    { name: 'Online', value: 20, color: '#10b981' },
    { name: 'Cheque', value: 5, color: '#f59e0b' },
];

const MOCK_CLASS_SUMMARY = [
    { grade: 'Class I', expected: 500000, collected: 420000 },
    { grade: 'Class II', expected: 450000, collected: 400000 },
    { grade: 'Class III', expected: 480000, collected: 320000 },
    { grade: 'Class IV', expected: 420000, collected: 410000 },
    { grade: 'Class V', expected: 550000, collected: 480000 },
];

const FinancialReports = ({ isMobileSearchOpen, setIsMobileSearchOpen }) => {
    const [currentReport, setCurrentReport] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const handleSelectReport = (name) => {
        setSearchQuery('');
        setIsMobileSearchOpen(false);
        setCurrentReport(name);
    };
    const goBack = () => {
        setSearchQuery('');
        setIsMobileSearchOpen(false);
        setCurrentReport(null);
    };

    if (currentReport) {
        return (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 pb-10">
                <ReportHeader
                    onBack={goBack}
                    title={currentReport}
                />

                {currentReport === 'Student Fee Ledger' ? (
                    <StudentFeeLedger searchQuery={searchQuery} setSearchQuery={setSearchQuery} isMobileSearchOpen={isMobileSearchOpen} />
                ) : currentReport === 'Student Due Report' ? (
                    <StudentDueReport searchQuery={searchQuery} setSearchQuery={setSearchQuery} isMobileSearchOpen={isMobileSearchOpen} />
                ) : currentReport === 'Daily Collection Report' ? (
                    <CollectionReport mode="daily" searchQuery={searchQuery} setSearchQuery={setSearchQuery} isMobileSearchOpen={isMobileSearchOpen} />
                ) : currentReport === 'Date-wise Collection Report' ? (
                    <CollectionReport mode="range" searchQuery={searchQuery} setSearchQuery={setSearchQuery} isMobileSearchOpen={isMobileSearchOpen} />
                ) : currentReport === 'Payment Mode Distribution' ? (
                    <PaymentModeCharts />
                ) : (
                    <PlaceholderReport name={currentReport} onBack={goBack} />
                )}
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 pb-20 pt-4">
                <ReportActionCard
                    title="Student Fee Ledger"
                    icon={User}
                    description="Full history of one student."
                    onClick={() => handleSelectReport('Student Fee Ledger')}
                    color="text-indigo-600"
                />
                <ReportActionCard
                    title="Student Due Report"
                    icon={ListFilter}
                    description="List students with pending fees."
                    onClick={() => handleSelectReport('Student Due Report')}
                    color="text-rose-600"
                />
                <ReportActionCard
                    title="Daily Collection"
                    icon={ClipboardList}
                    description="Total fees collected today."
                    onClick={() => handleSelectReport('Daily Collection Report')}
                    color="text-emerald-600"
                />
                <ReportActionCard
                    title="Date-wise Collection"
                    icon={Calendar}
                    description="Summary between two dates."
                    onClick={() => handleSelectReport('Date-wise Collection Report')}
                    color="text-blue-600"
                />
                {/* <ReportActionCard 
                    title="Payment Mix"
                    icon={Wallet}
                    description="Revenue channels visual."
                    onClick={() => handleSelectReport('Payment Mode Distribution')}
                    color="text-amber-600"
                /> */}
                {/* <ReportActionCard 
                    title="Class Analysis"
                    icon={TrendingUp}
                    description="Expected vs collected efficiency."
                    onClick={() => handleSelectReport('Class-wise Collection Analysis')}
                    color="text-slate-900"
                /> */}
                {/* <ReportActionCard 
                    title="Fee Structure"
                    icon={Hash}
                    description="Detailed breakdowns."
                    onClick={() => handleSelectReport('Fee Structure Report')}
                    color="text-slate-400"
                /> */}
                {/* <ReportActionCard 
                    title="Pending Summary"
                    icon={IndianRupee}
                    description="Outstanding total amount."
                    onClick={() => handleSelectReport('Pending Fees Summary')}
                    color="text-rose-500"
                /> */}
            </div>
        </div>
    );
};

// --- HELPER COMPONENT: INDIVIDUAL CARD ---
const ReportActionCard = ({ title, icon: icon, description, onClick, color }) => {
    const Icon = icon;

    // Consistent theme mapping for institutional aesthetics
    const themeMap = {
        "text-indigo-600": { border: "border-indigo-600", bg: "bg-indigo-50/50", iconBg: "bg-indigo-600", text: "text-indigo-900" },
        "text-rose-600": { border: "border-rose-600", bg: "bg-rose-50/50", iconBg: "bg-rose-600", text: "text-rose-900" },
        "text-emerald-600": { border: "border-emerald-600", bg: "bg-emerald-50/50", iconBg: "bg-emerald-600", text: "text-emerald-900" },
        "text-blue-600": { border: "border-blue-600", bg: "bg-blue-50/50", iconBg: "bg-blue-600", text: "text-blue-900" },
        "text-amber-600": { border: "border-amber-600", bg: "bg-amber-50/50", iconBg: "bg-amber-600", text: "text-amber-900" },
        "text-slate-900": { border: "border-slate-900", bg: "bg-slate-50/50", iconBg: "bg-slate-900", text: "text-slate-900" },
        "text-slate-400": { border: "border-slate-400", bg: "bg-slate-50/50", iconBg: "bg-slate-400", text: "text-slate-900" },
        "text-rose-500": { border: "border-rose-500", bg: "bg-rose-50/50", iconBg: "bg-rose-500", text: "text-rose-900" },
    };

    const theme = themeMap[color] || themeMap["text-indigo-600"];

    return (
        <button
            onClick={onClick}
            className={`p-6 lg:p-4 min-h-[100px] lg:min-h-[125px] rounded-2xl border-l-4 transition-all duration-300 group hover:shadow-xl active:scale-[0.98] text-left flex items-center justify-between gap-4 shadow-sm overflow-hidden ${theme.border} ${theme.bg}`}
        >
            <div className="flex-1 overflow-hidden pointer-events-none">
                <h4 className={`text-[11px] lg:text-sm font-black tracking-tight leading-tight uppercase font-outfit mb-1 ${theme.text} whitespace-normal wrap-break-word`}>{title}</h4>
                <p className="text-[8px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed whitespace-normal wrap-break-word">{description}</p>
            </div>
            <div className={`w-10 h-10 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl ${theme.iconBg} flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform border border-white/20 shrink-0`}>
                <Icon className="w-4 h-4 lg:w-6 lg:h-6 text-white" />
            </div>
        </button>
    );
};

// --- DETAILED REPORT VIEWS ---

const StudentFeeLedger = ({ searchQuery, setSearchQuery, isMobileSearchOpen }) => {
    const { selectedYear } = useAcademicYear();
    const activeYearId = selectedYear?.id;

    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);

    const [feeStructures, setFeeStructures] = useState([]);
    const [filters, setFilters] = useState({ status: '' });
    const perPage = 15;

    const fetchInitialData = useCallback(async () => {
        if (!activeYearId) return;
        try {
            const structures = await getFeeStructures(activeYearId);
            setFeeStructures(structures);
        } catch {
            // Silently fail or use default
        }
    }, [activeYearId]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    const fetchLedger = useCallback(async () => {
        if (!activeYearId) return;
        try {
            setLoading(true);
            const response = await API.get('/finance/student-fee-ledger', {
                params: {
                    status: '',
                    academicYearId: activeYearId
                }
            });
            setData(response.data || []);
        } catch {
            toast.error("Failed to fetch ledger data");
        } finally {
            setLoading(false);
        }
    }, [activeYearId]);

    useEffect(() => {
        fetchLedger();
    }, [fetchLedger]);

    const filteredRows = useMemo(() => {
        return data.filter(r => {
            const matchesSearch = r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                 r.studentIdNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                 r.grade?.toLowerCase().includes(searchQuery.toLowerCase());

            if (!matchesSearch) return false;

            if (!filters.status) return true;

            const structure = feeStructures.find(f => String(f.grade).replace(/\D/g, '') === String(r.grade).replace(/\D/g, ''));
            const annual = structure ? (
                Number(structure.admission_fee || 0) +
                Number(structure.tuition_fee || 0) +
                Number(structure.term_fee || 0) +
                Number(structure.computer_fee || 0) +
                Number(structure.other_fee || 0)
            ) : (r.annual_fee ?? 0);

            const discount = r.discount_amount ?? 0;
            const transport = r.transport_fee ?? 0;
            const paid = r.totalPaid ?? 0;
            const total = Math.max(0, annual - discount) + transport;
            const balance = total - paid;

            if (filters.status === 'paid') return balance <= 0;
            if (filters.status === 'pending') return balance > 0;

            return true;
        });
    }, [data, searchQuery, filters.status, feeStructures]);

    const paginatedRows = useMemo(() => {
        return filteredRows.slice((page - 1) * perPage, page * perPage);
    }, [filteredRows, page]);

    const totals = useMemo(() => {
        return filteredRows.reduce((acc, curr) => {
            const structure = feeStructures.find(f => String(f.grade).replace(/\D/g, '') === String(curr.grade).replace(/\D/g, ''));
            const annual = structure ? (
                Number(structure.admission_fee || 0) +
                Number(structure.tuition_fee || 0) +
                Number(structure.term_fee || 0) +
                Number(structure.computer_fee || 0) +
                Number(structure.other_fee || 0)
            ) : (curr.annual_fee ?? 0);

            const discount = curr.discount_amount ?? 0;
            const transport = curr.transport_fee ?? 0;
            const total = Math.max(0, annual - discount) + transport;
            const paid = curr.totalPaid ?? 0;
            const due = total - paid;

            return {
                payable: acc.payable + total,
                paid: acc.paid + paid,
                due: acc.due + due
            };
        }, { payable: 0, paid: 0, due: 0 });
    }, [filteredRows, feeStructures]);

    const handleExportExcel = () => {
        if (!filteredRows.length) return toast.info("No data to export");
        const exportData = filteredRows.map(r => {
            const structure = feeStructures.find(f => String(f.grade).replace(/\D/g, '') === String(r.grade).replace(/\D/g, ''));
            const annual = structure ? (
                Number(structure.admission_fee || 0) +
                Number(structure.tuition_fee || 0) +
                Number(structure.term_fee || 0) +
                Number(structure.computer_fee || 0) +
                Number(structure.other_fee || 0)
            ) : (r.annual_fee ?? 0);
            const discount = r.discount_amount ?? 0;
            const transport = r.transport_fee ?? 0;
            const total = Math.max(0, annual - discount) + transport;
            const paid = r.totalPaid ?? 0;
            return {
                "ID No": r.studentIdNo,
                "Student Name": r.name,
                "Class": r.grade,
                "Annual Fee": annual,
                "Discount": discount,
                "Transport": transport,
                "Total Payable": total,
                "Total Paid": paid,
                "Status": (paid >= total && total > 0 ? 'paid' : 'pending').toUpperCase()
            };
        });
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Student Fee Ledger");
        XLSX.writeFile(wb, `Fee_Ledger_${new Date().toLocaleDateString()}.xlsx`);
    };

    const handleExportPDF = () => {
        if (!filteredRows.length) return toast.info("No data to export");
        const doc = new jsPDF('l', 'pt');
        const tableColumn = ["ID No", "Student Name", "Class", "Annual Fee", "Discount", "Transport", "Total Payable", "Total Paid", "Status"];
        const tableRows = filteredRows.map(r => {
            const structure = feeStructures.find(f => String(f.grade).replace(/\D/g, '') === String(r.grade).replace(/\D/g, ''));
            const annual = structure ? (
                Number(structure.admission_fee || 0) +
                Number(structure.tuition_fee || 0) +
                Number(structure.term_fee || 0) +
                Number(structure.computer_fee || 0) +
                Number(structure.other_fee || 0)
            ) : (r.annual_fee ?? 0);
            const discount = r.discount_amount ?? 0;
            const transport = r.transport_fee ?? 0;
            const total = Math.max(0, annual - discount) + transport;
            const paid = r.totalPaid ?? 0;
            return [
                r.studentIdNo,
                r.name,
                r.grade,
                annual,
                discount,
                transport,
                total,
                paid,
                (paid >= total && total > 0 ? 'paid' : 'pending').toUpperCase()
            ];
        });
        autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 });
        doc.text("Student Fee Ledger", 40, 15);
        doc.save(`Fee_Ledger_${new Date().toLocaleDateString()}.pdf`);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-6">
                <StatBox label="Total Payable" value={formatCurrency(totals.payable)} icon={IndianRupee} color="text-slate-900" />
                <StatBox label="Total Paid" value={formatCurrency(totals.paid)} icon={TrendingUp} color="text-emerald-600" />
                <StatBox label="Total Due" value={formatCurrency(totals.due)} icon={FilePieChart} color="text-rose-600" />
            </div>

            <div className="bg-white shadow-sm rounded-none border-t border-slate-100">
                <InstitutionalReportToolbar
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    isOpen={isMobileSearchOpen}
                    onExportExcel={handleExportExcel}
                    onExportPDF={handleExportPDF}
                >
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Academic year select removed for cleaner UI */}
                        <select
                            className="px-3 py-2.5 bg-white border border-table rounded text-[9px] font-black uppercase tracking-widest outline-none"
                            value={filters.status}
                            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        >
                            <option value="">ALL STATUS</option>
                            <option value="paid">PAID</option>
                            <option value="pending">PENDING</option>
                        </select>
                    </div>
                </InstitutionalReportToolbar>
                <DataTable
                    headers={[
                        { label: "ID No" },
                        { label: "Student Name" },
                        { label: "Class" },
                        { label: "Annual Fee" },
                        { label: "Discount" },
                        { label: "Transport" },
                        { label: "Total Payable" },
                        { label: "Total Paid" },
                        { label: "Status" }
                    ]}
                    columnCount={9}
                    emptyMessage={loading ? "Loading ledger data..." : "No ledger records found"}
                    footer={
                        <TablePagination
                            currentPage={page}
                            totalPages={Math.ceil(filteredRows.length / perPage)}
                            onPageChange={setPage}
                            totalItems={filteredRows.length}
                            itemsPerPage={perPage}
                        />
                    }
                >
                    {loading ? (
                        <tr>
                            <td colSpan={9} className="py-20 text-center">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
                                <p className="mt-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fetching institutional data...</p>
                            </td>
                        </tr>
                    ) : paginatedRows.map((c, i) => {
                        const structure = feeStructures.find(f => String(f.grade).replace(/\D/g, '') === String(c.grade).replace(/\D/g, ''));
                        const annual = structure ? (
                            Number(structure.admission_fee || 0) +
                            Number(structure.tuition_fee || 0) +
                            Number(structure.term_fee || 0) +
                            Number(structure.computer_fee || 0) +
                            Number(structure.other_fee || 0)
                        ) : (c.annual_fee ?? 0);

                        const discount = c.discount_amount ?? 0;
                        const transport = c.transport_fee ?? 0;
                        const paid = c.totalPaid ?? 0;
                        const total = Math.max(0, annual - discount) + transport;
                        const status = paid >= total && total > 0 ? 'paid' : 'pending';

                        return (
                            <tr key={i} className="hover-table-row transition-colors border-b-table text-[11px] font-bold text-table-cell uppercase">
                                <td className="px-5 py-4 border-r-table font-black text-institutional-main">{c.studentIdNo}</td>
                                <td className="px-5 py-4 border-r-table font-black">{c.name}</td>
                                <td className="px-5 py-4 border-r-table">{c.grade}</td>
                                <td className="px-5 py-4 border-r-table">₹{annual?.toLocaleString()}</td>
                                <td className="px-5 py-4 border-r-table text-black font-black">₹{discount?.toLocaleString()}</td>
                                <td className="px-5 py-4 border-r-table">₹{transport?.toLocaleString()}</td>
                                <td className="px-5 py-4 border-r-table font-black">₹{total?.toLocaleString()}</td>
                                <td className="px-5 py-4 border-r-table text-emerald-600 font-black">₹{paid?.toLocaleString()}</td>
                                <td className="px-5 py-4">
                                    <span className={`px-2 py-1 rounded text-[9px] font-black ${status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                        {status}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </DataTable>
            </div>
        </div>
    );
};

const StudentDueReport = ({ searchQuery, setSearchQuery, isMobileSearchOpen }) => {
    const { selectedYear } = useAcademicYear();
    const activeYearId = selectedYear?.id;

    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState({ summary: {}, data: [] });
    const [classrooms, setClassrooms] = useState([]);

    const [filters, setFilters] = useState({ className: '' });
    const perPage = 15;

    // Fetch Initial Data
    useEffect(() => {
        const bootstrap = async () => {
            try {
                const classList = await getClassrooms();
                setClassrooms(classList || []);
            } catch {
                toast.error("Failed to load filter metadata");
            }
        };
        bootstrap();
    }, []);

    const fetchDueReport = useCallback(async () => {
        if (!activeYearId) return;
        try {
            setLoading(true);
            const response = await API.get('/finance/student-due-report', {
                params: {
                    className: filters.className !== 'ALL CLASSES' ? filters.className : '',
                    academicYearId: activeYearId
                }
            });
            setReportData(response.data || { summary: {}, data: [] });
        } catch {
            toast.error("Failed to fetch due report");
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchDueReport();
    }, [fetchDueReport]);

    const filteredRows = useMemo(() => {
        return (reportData.data || []).filter(r =>
            r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.class?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [reportData.data, searchQuery]);

    const paginatedRows = useMemo(() => {
        return filteredRows.slice((page - 1) * perPage, page * perPage);
    }, [filteredRows, page]);

    const handleExportExcel = () => {
        if (!filteredRows.length) return toast.info("No data to export");
        const exportData = filteredRows.map((r, i) => ({
            "Sr.No": i + 1,
            "Class": r.class,
            "Name": r.name,
            "Contact": r.contact,
            "Fee": r.fee,
            "Discount": r.discount_amount || 0,
            "Transport": r.transport,
            "Total Annual Fee": r.total_annual_fee,
            "Paid": r.paid,
            "Balance": r.balance
        }));
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Student Due Report");
        XLSX.writeFile(wb, `Student_Due_Report_${new Date().toLocaleDateString()}.xlsx`);
    };

    const handleExportPDF = () => {
        if (!filteredRows.length) return toast.info("No data to export");
        const doc = new jsPDF('l', 'pt');
        const tableColumn = ["Sr.No", "Class", "Name", "Contact", "Fee", "Discount", "Transport", "Total", "Paid", "Balance"];
        const tableRows = filteredRows.map((r, i) => [
            i + 1, r.class, r.name, r.contact, r.fee, r.discount_amount || 0, r.transport, r.total_annual_fee, r.paid, r.balance
        ]);
        autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 });
        doc.text("Student Due Report", 40, 15);
        doc.save(`Student_Due_Report_${new Date().toLocaleDateString()}.pdf`);
    };

    const summary = reportData.summary || {};

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
                <StatBox label="Total Students" value={summary.totalStudents || 0} icon={Users} color="text-slate-900" />
                <StatBox label="Total Fees" value={formatCurrency(summary.totalFees)} icon={TrendingUp} color="text-indigo-600" />
                <StatBox label="Total Pending" value={formatCurrency(summary.totalPending)} icon={IndianRupee} color="text-rose-600" />
                <StatBox label="Total Transport" value={formatCurrency(summary.totalTransport)} icon={FilePieChart} color="text-amber-600" />
            </div>

            <div className="bg-white shadow-sm rounded-none border-t border-slate-100">
                <InstitutionalReportToolbar
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    isOpen={isMobileSearchOpen}
                    onExportExcel={handleExportExcel}
                    onExportPDF={handleExportPDF}
                >
                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            className="px-3 py-2.5 bg-white border border-table rounded text-[9px] font-black uppercase tracking-widest outline-none"
                            value={filters.className}
                            onChange={(e) => setFilters(prev => ({ ...prev, className: e.target.value }))}
                        >
                            <option value="">ALL CLASSES</option>
                            {classrooms.map(c => (
                                <option key={c.id} value={c.class_name}>{c.class_name}</option>
                            ))}
                        </select>
                        {/* Academic year select removed for cleaner UI */}
                    </div>
                </InstitutionalReportToolbar>

                <div className="w-full mobile-table-scroll border-t border-slate-100">
                    <DataTable
                        headers={[
                            { label: "Sr.no", className: "w-[35px] text-center" },
                            { label: "Class", className: "text-center" },
                            { label: "Name" },
                            { label: "Contact" },
                            { label: "Fee" },
                            { label: "Discount" },
                            { label: "Transport" },
                            { label: "Total Anual Fee" },
                            { label: "Paid" },
                            { label: "Balance" }
                        ]}
                        columnCount={10}
                        emptyMessage={loading ? "Loading due records..." : "No due records found"}
                        footer={
                            <TablePagination
                                currentPage={page}
                                totalPages={Math.ceil(filteredRows.length / perPage)}
                                onPageChange={setPage}
                                totalItems={filteredRows.length}
                                itemsPerPage={perPage}
                            />
                        }
                    >
                        {loading ? (
                            <tr>
                                <td colSpan={10} className="py-20 text-center">
                                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
                                </td>
                            </tr>
                        ) : paginatedRows.map((r, i) => (
                            <tr key={i} className="hover-table-row transition-colors border-b-table text-[10px] font-bold text-table-cell uppercase whitespace-nowrap">
                                <td className="px-4 py-3 border-r-table text-center">{((page - 1) * perPage) + i + 1}</td>
                                <td className="px-4 py-3 border-r-table font-black text-institutional-main text-center">{r.class}</td>
                                <td className="px-4 py-3 border-r-table font-black text-institutional-main">{r.name}</td>
                                <td className="px-4 py-3 border-r-table">{r.contact}</td>
                                <td className="px-4 py-3 border-r-table font-black">₹{(r.fee || 0).toLocaleString()}</td>
                                <td className="px-4 py-3 border-r-table text-black font-black">₹{(r.discount_amount || 0).toLocaleString()}</td>
                                <td className="px-4 py-3 border-r-table">₹{(r.transport || 0).toLocaleString()}</td>
                                <td className="px-4 py-3 border-r-table font-black text-institutional-main">₹{(r.total_annual_fee || 0).toLocaleString()}</td>
                                <td className="px-4 py-3 border-r-table text-emerald-600">₹{(r.paid || 0).toLocaleString()}</td>
                                <td className="px-4 py-3 bg-slate-50/50 text-rose-600 font-black">₹{(r.balance || 0).toLocaleString()}</td>
                            </tr>
                        ))}
                    </DataTable>
                </div>
            </div>
        </div>
    );
};

const CollectionReport = ({ mode, searchQuery, setSearchQuery, isMobileSearchOpen }) => {
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const perPage = 15;
    const today = new Date().toISOString().split('T')[0];
    const [fromDate, setFromDate] = useState(mode === 'daily' ? today : today);
    const [toDate, setToDate] = useState(today);
    const [reportData, setReportData] = useState({ summary: {}, data: [] });
    const [years, setYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState('');

    useEffect(() => {
        const fetchYears = async () => {
            try {
                const list = await getAcademicYearsList();
                setYears(list || []);
                const active = list?.find(y => y.is_active) || list?.[0];
                if (active) setSelectedYear(active.id);
            } catch {
                // Silently ignore
            }
        };
        fetchYears();
    }, []);

    const fetchCollection = useCallback(async () => {
        try {
            setLoading(true);
            const response = await API.get('/finance/date-wise-collection-report', {
                params: {
                    from_date: fromDate,
                    to_date: mode === 'daily' ? fromDate : toDate,
                    academicYearId: selectedYear
                }
            });
            setReportData(response.data || { summary: {}, data: [] });
        } catch {
            toast.error("Failed to fetch collection report");
        } finally {
            setLoading(false);
        }
    }, [fromDate, toDate, mode, selectedYear]);

    useEffect(() => {
        fetchCollection();
    }, [fetchCollection]);

    const filteredRows = useMemo(() => {
        return (reportData.data || []).filter(r =>
            r.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.class?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.payment_mode?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [reportData.data, searchQuery]);

    const paginatedRows = useMemo(() => {
        return filteredRows.slice((page - 1) * perPage, page * perPage);
    }, [filteredRows, page]);

    const summary = reportData.summary || {};

    const handleExportExcel = () => {
        if (!filteredRows.length) return toast.info("No data to export");
        const exportData = filteredRows.map((r, i) => ({
            "Sr.No": i + 1,
            "Date": r.date ? new Date(r.date).toLocaleDateString('en-GB') : '-',
            "Student Name": r.student_name,
            "Class": r.class,
            "Payment Mode": r.payment_mode,
            "Discount": r.discount_amount || 0,
            "Credit": r.credit
        }));
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Collection Report");
        XLSX.writeFile(wb, `Collection_Report_${new Date().toLocaleDateString()}.xlsx`);
    };

    const handleExportPDF = () => {
        if (!filteredRows.length) return toast.info("No data to export");
        const doc = new jsPDF('p', 'pt');
        const tableColumn = ["Sr.No", "Date", "Student Name", "Class", "Mode", "Discount", "Credit"];
        const tableRows = filteredRows.map((r, i) => [
            i + 1, r.date ? new Date(r.date).toLocaleDateString('en-GB') : '-', r.student_name, r.class, r.payment_mode, r.discount_amount || 0, r.credit
        ]);
        autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 });
        doc.text("Collection Report", 40, 15);
        doc.save(`Collection_Report_${new Date().toLocaleDateString()}.pdf`);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
                <StatBox label="Cash" value={formatCurrency(summary.cash)} icon={Banknote} color="text-slate-900" />
                <StatBox label="UPI" value={formatCurrency(summary.upi)} icon={Smartphone} color="text-indigo-600" />
                <StatBox label="Online" value={formatCurrency(summary.online)} icon={Landmark} color="text-emerald-600" />
                <StatBox label="Cheque" value={formatCurrency(summary.cheque)} icon={CreditCard} color="text-amber-600" />
            </div>

            <div className="bg-white shadow-sm rounded-none border-t border-slate-100">
                <InstitutionalReportToolbar
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    isOpen={isMobileSearchOpen}
                    onExportExcel={handleExportExcel}
                    onExportPDF={handleExportPDF}
                >
                    <div className="flex flex-wrap items-center gap-2">
                        {mode === 'daily' ? (
                            <input
                                type="date"
                                className="px-3 py-2 bg-white border border-table rounded text-[9px] font-black uppercase outline-none"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                            />
                        ) : (
                            <div className="flex items-center gap-2 bg-white border border-table rounded px-2">
                                <span className="text-[10px] font-black uppercase text-institutional-main leading-none">From</span>
                                <input
                                    type="date"
                                    className="py-2 bg-transparent text-[9px] font-black uppercase outline-none"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                />
                                <span className="text-[10px] font-black uppercase text-institutional-main border-l border-slate-100 pl-2 leading-none">To</span>
                                <input
                                    type="date"
                                    className="py-2 bg-transparent text-[9px] font-black uppercase outline-none"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                />
                            </div>
                        )}
                        <select
                            className="px-3 py-2.5 bg-white border border-table rounded text-[9px] font-black uppercase tracking-widest outline-none"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                        >
                            <option value="">ALL YEARS</option>
                            {years.map(y => (
                                <option key={y.id} value={y.id}>{y.year_name}</option>
                            ))}
                        </select>
                    </div>
                </InstitutionalReportToolbar>
                <DataTable
                    headers={[
                        { label: "Sr.no", className: "w-[35px] text-center" },
                        { label: "Date", className: "w-[110px] text-center" },
                        { label: "Student Name" },
                        { label: "Class" },
                        { label: "Payment Mode" },
                        { label: "Discount" },
                        { label: "Credit" }
                    ]}
                    columnCount={7}
                    emptyMessage={loading ? "Loading collection records..." : "No collection records found"}
                    footer={
                        <TablePagination
                            currentPage={page}
                            totalPages={Math.ceil(filteredRows.length / perPage)}
                            onPageChange={setPage}
                            totalItems={filteredRows.length}
                            itemsPerPage={perPage}
                        />
                    }
                >
                    {loading ? (
                        <tr>
                            <td colSpan={7} className="py-20 text-center">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
                            </td>
                        </tr>
                    ) : paginatedRows.map((c, i) => (
                        <tr key={i} className="hover-table-row transition-colors border-b-table text-[11px] font-bold text-table-cell uppercase">
                            <td className="px-5 py-4 border-r-table text-center">{((page - 1) * perPage) + i + 1}</td>
                            <td className="px-5 py-4 border-r-table text-center text-institutional-main font-black tracking-tighter">{new Date(c.date).toLocaleDateString('en-GB')}</td>
                            <td className="px-5 py-4 border-r-table text-institutional-main font-black uppercase tracking-tighter">{c.student_name}</td>
                            <td className="px-5 py-4 border-r-table uppercase">{c.class}</td>
                            <td className="px-5 py-4 border-r-table uppercase">{c.payment_mode}</td>
                            <td className="px-5 py-4 border-r-table text-black font-black">₹{(c.discount_amount || 0).toLocaleString()}</td>
                            <td className="px-5 py-4 text-institutional-main font-black tracking-tighter">₹{(c.credit || 0).toLocaleString()}</td>
                        </tr>
                    ))}
                </DataTable>
            </div>
        </div>
    );
};

const PaymentModeCharts = () => (
    <div className="space-y-6 lg:space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <SimpleChartWrapper title="Revenue Distribution" subtitle="Daily Breakdown">
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie data={MOCK_PAYMENT_MIX} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                            {MOCK_PAYMENT_MIX.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} tick={{ fontSize: 10 }} />
                    </PieChart>
                </ResponsiveContainer>
            </SimpleChartWrapper>
            <SimpleChartWrapper title="Collection Comparison" subtitle="Expected vs Actual">
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={MOCK_CLASS_SUMMARY}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="grade" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700 }} />
                        <Tooltip cursor={{ fill: '#f8fafc' }} />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        <Bar dataKey="expected" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="Target" />
                        <Bar dataKey="collected" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Collected" />
                    </BarChart>
                </ResponsiveContainer>
            </SimpleChartWrapper>
        </div>
    </div>
);

export default FinancialReports;
