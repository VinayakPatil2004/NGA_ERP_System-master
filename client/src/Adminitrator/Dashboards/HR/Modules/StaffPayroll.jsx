import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    IndianRupee, FileText, CheckCircle, Calculator, Search,
    Clock, Users, Wallet, RefreshCw, TrendingDown, Calendar, Save,
    Download, Eye, CreditCard, X, Upload
} from 'lucide-react';
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import DataTable from '../../../admcomponents/DataTable';
import { toast } from 'react-toastify';
import { getPayrollRegistry, processPayroll, updatePayrollStatus } from '../../../../services/hrAPI';
import bulkImportAPI from '../../../../services/bulkImportAPI';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ngaLogo from '../../../../assets/nga-logo.png';
import StaffAttendanceReport from './StaffAttendanceReport';

const getLocalDateString = (dateInput = new Date()) => {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return typeof dateInput === 'string' ? dateInput.split('T')[0] : '';
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};

const formatPaymentDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = monthNames[parseInt(month, 10) - 1] || month;
    return `${day} - ${monthName} - ${year}`;
};

const MONTHS = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const StaffPayroll = ({ toggleSidebar }) => {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [payrollList, setPayrollList] = useState([]);
    const [localEdits, setLocalEdits] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(null); // staff_id | 'all'
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dirtyRows, setDirtyRows] = useState(new Set());
    const [showModal, setShowModal] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const [viewingReportStaff, setViewingReportStaff] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, month, year, statusFilter]);

    const fetchPayroll = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getPayrollRegistry(month, year);
            const rawData = res?.data || [];
            const data = rawData.map(p => ({
                ...p,
                status: p.status === 'processed' ? 'pending' : (p.status || 'pending')
            }));
            setPayrollList(data);

            const edits = {};
            data.forEach(p => {
                edits[p.staff_id] = {
                    basic_salary: parseFloat(p.basic_salary) || 0,
                    hra: parseFloat(p.hra) || 0,
                    da: parseFloat(p.da) || 0,
                    bonus: parseFloat(p.bonus) || 0,
                    pf: parseFloat(p.pf) || 0,
                    pt: parseFloat(p.pt) || 0,
                    esic: parseFloat(p.esic) || 0,
                    loan_deduction: parseFloat(p.loan_deduction) || 0,
                    present_days: parseFloat(p.present_days) || 0,
                    half_days: parseFloat(p.half_days) || 0,
                    total_days: parseFloat(p.total_days) || 30,
                    deductions: parseFloat(p.deductions) || 0,
                    remarks: p.remarks || '',
                    status: p.status || 'pending',
                    payment_date: p.payment_date ? getLocalDateString(p.payment_date) : '',
                };
            });
            setLocalEdits(edits);
            setDirtyRows(new Set());
        } catch (err) {
            console.error(err);
            toast.error('Failed to load payroll data');
        } finally {
            setLoading(false);
        }
    }, [month, year]);

    useEffect(() => { fetchPayroll(); }, [fetchPayroll]);

    const updateEdit = (staffId, field, value) => {
        setLocalEdits(prev => ({
            ...prev,
            [staffId]: { ...prev[staffId], [field]: value },
        }));
        setDirtyRows(prev => new Set(prev).add(staffId));
    };

    // Net = [(gross / total_days) * (present + half * 0.5)] - totalDeductions
    const calcNet = (staffId) => {
        const e = localEdits[staffId] || {};
        const basic = parseFloat(e.basic_salary) || 0;
        const hra = parseFloat(e.hra) || 0;
        const da = parseFloat(e.da) || 0;
        const bonus = parseFloat(e.bonus) || 0;
        const days = parseFloat(e.total_days) || 30;
        const pres = parseFloat(e.present_days) || 0;
        const half = parseFloat(e.half_days) || 0;
        const pf = parseFloat(e.pf) || 0;
        const pt = parseFloat(e.pt) || 0;
        const esic = parseFloat(e.esic) || 0;
        const loan = parseFloat(e.loan_deduction) || 0;
        const ded = parseFloat(e.deductions) || 0;
        const gross = basic + hra + da;
        const calculatedSalary = (gross / days) * (pres + half * 0.5);
        const totalDeductions = pf + pt + esic + ded;
        return Math.round(Math.max(0, calculatedSalary - (totalDeductions + loan) + bonus));
    };

    const handleSaveRow = async (staffId, currentStatus) => {
        const e = localEdits[staffId];
        if (!e) return;
        try {
            setSaving(staffId);
            await processPayroll({
                month, year,
                payroll_data: [{
                    staff_id: staffId,
                    basic_salary: e.basic_salary,
                    hra: e.hra,
                    da: e.da,
                    bonus: e.bonus,
                    pf: e.pf,
                    pt: e.pt,
                    esic: e.esic,
                    loan_deduction: e.loan_deduction,
                    present_days: e.present_days,
                    half_days: e.half_days,
                    total_days: e.total_days,
                    deductions: e.deductions,
                    remarks: e.remarks,
                    payment_date: e.payment_date || null,
                    status: e.status || 'pending',
                }],
            });
            toast.success(currentStatus === 'pending' ? 'Payroll processed ✓' : 'Payroll updated ✓');
            setDirtyRows(prev => { const s = new Set(prev); s.delete(staffId); return s; });
            fetchPayroll();
        } catch (err) {
            toast.error(err?.response?.data?.error || 'Failed to save');
        } finally {
            setSaving(null);
        }
    };

    const handleSaveAll = async () => {
        if (!payrollList.length) { toast.info('No payroll data'); return; }
        const payroll_data = payrollList.map(p => {
            const e = localEdits[p.staff_id] || {};
            return {
                staff_id: p.staff_id,
                basic_salary: e.basic_salary || 0,
                hra: e.hra || 0,
                da: e.da || 0,
                bonus: e.bonus || 0,
                pf: e.pf || 0,
                pt: e.pt || 0,
                esic: e.esic || 0,
                loan_deduction: e.loan_deduction || 0,
                present_days: e.present_days ?? 0,
                half_days: e.half_days ?? 0,
                total_days: e.total_days ?? 30,
                deductions: e.deductions || 0,
                remarks: e.remarks || '',
                status: e.status || 'pending',
                payment_date: e.payment_date || null,
            };
        });
        try {
            setSaving('all');
            await processPayroll({ month, year, payroll_data });
            toast.success('Records saved successfully ✓');
            fetchPayroll();
        } catch (err) {
            toast.error(err?.response?.data?.error || 'Failed to save');
        } finally {
            setSaving(null);
        }
    };

    const handleStatusChange = async (payrollId, newStatus, staffId) => {
        if (!payrollId) {
            // No payroll record yet — status is tracked locally only until Save All
            return;
        }
        try {
            await updatePayrollStatus(payrollId, newStatus);
            // Don't call fetchPayroll() — it would reset all statuses to 'pending'
            // The badge already updated via updateEdit() before this call
        } catch (err) {
            console.error(err);
            toast.error('Failed to update status');
            // Revert local status on failure
            if (staffId) updateEdit(staffId, 'status', 'pending');
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            setIsUploading(true);
            toast.info('Uploading and processing file...');
            const res = await bulkImportAPI.importStaffPayroll(file);
            toast.success(res.message || 'Bulk import successful');
            fetchPayroll();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to import data');
        } finally {
            setIsUploading(false);
            e.target.value = null;
        }
    };

    const generatePDF = async (item) => {
        const e = localEdits[item.staff_id] || {};
        const net = calcNet(item.staff_id);
        const doc = new jsPDF();

        const primaryColor = [0, 23, 54]; // #001736
        const secondaryColor = [100, 116, 139]; // Slate 500
        const staffDesignation = item.designation || item.staff_type || 'Staff';

        // ── Custom Header Box (Without border) ──
        // Border removed as per request

        // Draw left NGA logo
        const loadLogo = () => new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = ngaLogo;
        });

        const logoImg = await loadLogo();
        if (logoImg) {
            doc.addImage(logoImg, 'PNG', 20, 12, 30, 20);
        } else {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(18);
            doc.setTextColor(24, 76, 120); doc.text("NGA", 23, 25);
        }

        // Draw centered header titles
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text("NEW GRACE ACADEMY", 105, 19, { align: 'center' });

        doc.setFontSize(7.5);
        doc.text("Ekta Nagar, Near Ankay Housing Society, Borgad, Mhasrul, Nashik-422 004, MH", 105, 25, { align: 'center' });
        doc.text("Contact: +91 91684 42244 | Website: www.newgraceacademy.in", 105, 31, { align: 'center' });

        // ── Title ──
        doc.setTextColor(...primaryColor);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("SALARY PAYSLIP", 105, 52, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(`${MONTHS[month].toUpperCase()} ${year}`, 105, 59, { align: 'center' });

        doc.setDrawColor(220, 220, 220);
        doc.line(20, 64, 190, 64);

        // ── Employee & Company Info ──
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(9);

        // Left Column
        doc.setFont("helvetica", "bold"); doc.text("Employee Name:", 20, 76);
        doc.setFont("helvetica", "normal"); doc.text(item.full_name, 55, 76);

        doc.setFont("helvetica", "bold"); doc.text("Employee ID:", 20, 83);
        doc.setFont("helvetica", "normal"); doc.text(item.employee_id, 55, 83);

        doc.setFont("helvetica", "bold"); doc.text("Designation:", 20, 90);
        doc.setFont("helvetica", "normal"); doc.text(staffDesignation, 55, 90);

        // Right Column
        doc.setFont("helvetica", "bold"); doc.text("Month/Year:", 130, 76);
        doc.setFont("helvetica", "normal"); doc.text(`${MONTHS[month]} ${year}`, 160, 76);

        doc.setFont("helvetica", "bold"); doc.text("Present Days:", 130, 83);
        doc.setFont("helvetica", "normal"); doc.text(`${e.present_days} / ${e.total_days}`, 160, 83);

        doc.setFont("helvetica", "bold"); doc.text("Status:", 130, 90);
        doc.setFont("helvetica", "normal"); doc.text(item.status.toUpperCase(), 160, 90);

        doc.setFont("helvetica", "bold"); doc.text("Payment Date:", 130, 97);
        doc.setFont("helvetica", "normal"); doc.text(e.payment_date ? formatPaymentDate(e.payment_date) : '—', 160, 97);

        // ── Earnings & Deductions Table ──
        const basic = parseFloat(e.basic_salary) || 0;
        const hra = parseFloat(e.hra) || 0;
        const da = parseFloat(e.da) || 0;
        const bonus = parseFloat(e.bonus) || 0;
        const pf = parseFloat(e.pf) || 0;
        const tax = parseFloat(e.pt) || 0;
        const esic = parseFloat(e.esic) || 0;
        const loan = parseFloat(e.loan_deduction) || 0;
        const ded = parseFloat(e.deductions) || 0;

        const totalEarnings = basic + hra + da + bonus;
        const totalDeductions = pf + tax + loan + ded + esic;

        autoTable(doc, {
            startY: 104,
            head: [['Earnings Description', 'Amount (INR)', 'Deductions Description', 'Amount (INR)']],
            body: [
                ['Basic Salary', basic.toLocaleString('en-IN'), 'Provident Fund (PF)', pf.toLocaleString('en-IN')],
                ['HRA', hra.toLocaleString('en-IN'), 'Professional Tax (PT)', tax.toLocaleString('en-IN')],
                ['DA', da.toLocaleString('en-IN'), 'ESIC', esic.toLocaleString('en-IN')],
                ['Performance Bonus', bonus.toLocaleString('en-IN'), 'Advance', loan.toLocaleString('en-IN')],
                ['', '', 'Other', ded.toLocaleString('en-IN')],
                [
                    { content: 'Total Earnings', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
                    { content: totalEarnings.toLocaleString('en-IN'), styles: { fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [217, 119, 6] } },
                    { content: 'Total Deductions', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
                    { content: totalDeductions.toLocaleString('en-IN'), styles: { fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [220, 38, 38] } }
                ],
                [
                    { content: 'NET PAYABLE AMOUNT:', colSpan: 3, styles: { fontStyle: 'bold', fontSize: 10, textColor: primaryColor, halign: 'left', fillColor: [226, 232, 240] } },
                    { content: `INR ${net.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, styles: { fontStyle: 'bold', fontSize: 11, textColor: [5, 150, 105], halign: 'right', fillColor: [226, 232, 240] } }
                ]
            ],
            theme: 'grid',
            styles: {
                lineWidth: 0.1,
                lineColor: [0, 0, 0],
                textColor: [60, 60, 60]
            },
            headStyles: {
                fillColor: primaryColor,
                fontSize: 9,
                halign: 'center',
                lineWidth: 0.1,
                lineColor: [0, 0, 0],
                textColor: [255, 255, 255]
            },
            bodyStyles: { fontSize: 8.5, textColor: [60, 60, 60] },
            columnStyles: {
                1: { halign: 'right' },
                3: { halign: 'right' }
            },
            margin: { left: 20, right: 20 }
        });

        // ── Footer & Signatures ──
        const pageHeight = doc.internal.pageSize.height;
        let sigY = doc.lastAutoTable.finalY + 40;
        if (sigY > pageHeight - 40) sigY = pageHeight - 40; // Ensure it doesn't push off-page

        doc.setDrawColor(150, 150, 150);
        doc.setLineWidth(0.2);

        // Left signature line
        doc.line(20, sigY, 75, sigY);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(...primaryColor);
        doc.text("Authorized Stamp & Sign", 47.5, sigY + 5, { align: 'center' });

        // Right signature line
        doc.line(135, sigY, 190, sigY);
        doc.text("Employee Signature", 162.5, sigY + 5, { align: 'center' });

        // Footer lines
        doc.setTextColor(...secondaryColor);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");


        doc.save(`Payslip_${item.employee_id}_${MONTHS[month]}_${year}.pdf`);
    };

    const filtered = useMemo(() => {
        return payrollList.filter(p => {
            const matchesSearch = p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.employee_id?.toLowerCase().includes(searchQuery.toLowerCase());
            if (!matchesSearch) return false;

            if (statusFilter === 'all') return true;

            const currentStatus = localEdits[p.staff_id]?.status || p.status || 'pending';
            return currentStatus.toLowerCase() === statusFilter.toLowerCase();
        });
    }, [payrollList, searchQuery, statusFilter, localEdits]);

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginatedData = useMemo(() => {
        return filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }, [filtered, currentPage]);

    const totalNet = payrollList.reduce((s, p) => s + calcNet(p.staff_id), 0);
    const pending = payrollList.filter(p => p.status === 'pending').length;

    const paid = payrollList.filter(p => p.status === 'paid').length;

    const statusBadge = {
        pending: 'bg-amber-50  text-amber-600  border border-amber-100',
        processed: 'bg-blue-50   text-blue-600   border border-blue-100',
        paid: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
        hold: 'bg-red-50    text-red-600    border border-red-100',
    };

    const unsavedCount = dirtyRows.size;

    if (viewingReportStaff) {
        return (
            <StaffAttendanceReport
                staff={viewingReportStaff}
                onClose={() => setViewingReportStaff(null)}
                toggleSidebar={toggleSidebar}
            />
        );
    }

    return (
        <div className="p-4 lg:p-8 space-y-6 min-h-screen bg-[#F8FAFC]">

            <ModuleHeader hideAcademicYear={true}
                title="Staff Payroll"
                subTitle={`Monthly Salary Processing — ${MONTHS[month]} ${year}`}
                icon={IndianRupee}
                badge={`${MONTHS[month]} ${year}`}
                toggleSidebar={toggleSidebar}
                showSearch={true}
                onSearchToggle={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                hideDesktopSearch={true}
            >
                <div className="flex items-center gap-2 lg:gap-3">
                    <button onClick={fetchPayroll}
                        className="p-2 bg-white border border-slate-300 rounded-md text-slate-400 hover:text-indigo-600 transition-all shadow-sm shrink-0"
                        title="Refresh">
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </ModuleHeader>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard label="Total Staff" value={payrollList.length} icon={Users} color="bg-indigo-600" />
                <StatCard label="Pending Approval" value={pending} icon={Clock} color="bg-amber-500" />
                <StatCard label="Paid" value={paid} icon={CheckCircle} color="bg-teal-500" />
                <StatCard label="Total Payout" value={`₹${(totalNet / 1000).toFixed(1)}K`} icon={Wallet} color="bg-emerald-500" />
            </div>

            {/* Filter Bar */}
            <div className={`bg-white p-3 border border-slate-300 rounded-md flex-col lg:flex-row gap-3 items-center shadow-sm ${!isMobileSearchOpen ? 'hidden lg:flex' : 'flex animate-in slide-in-from-top-2 duration-300'}`}>
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="Search employee..." value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-md text-sm font-bold text-[#001736] outline-none" />
                </div>
                <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 w-full lg:w-auto shrink-0 justify-between lg:justify-end">
                    {/* Status Filter */}
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-md px-3 py-2.5 shadow-sm">
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                            className="bg-transparent text-sm font-bold text-[#001736] outline-none cursor-pointer">
                            <option value="all">All Status</option>
                            <option value="paid">Paid</option>
                            <option value="pending">Pending</option>
                            <option value="hold">Hold</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-md px-3 py-2.5 shadow-sm">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <select value={month} onChange={e => setMonth(+e.target.value)}
                            className="bg-transparent text-sm font-bold text-[#001736] outline-none cursor-pointer">
                            {MONTHS.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-md px-3 py-2.5 shadow-sm">
                        <select value={year} onChange={e => setYear(+e.target.value)}
                            className="bg-transparent text-sm font-bold text-[#001736] outline-none cursor-pointer">
                            {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    {/* Bulk Import */}
                    <label className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-300 text-[#001736] rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 cursor-pointer transition-all shrink-0 shadow-sm">
                        {isUploading ? <RefreshCw size={13} className="animate-spin" /> : <Upload size={13} />}
                        Import
                        <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                    </label>
                    {/* Save All */}
                    <button onClick={handleSaveAll} disabled={saving === 'all'}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-[#001736] text-white border border-transparent rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 active:scale-95 disabled:opacity-50 transition-all shrink-0 shadow-sm cursor-pointer">
                        {saving === 'all' ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                        {saving === 'all' ? 'Saving...' : `Save All${unsavedCount > 0 ? ` (${unsavedCount})` : ''}`}
                    </button>
                    {/* Mark All Paid */}
                    <button onClick={() => {
                        const todayStr = getLocalDateString();
                        if (window.confirm('Mark all staff as Paid and set payment date to today?')) {
                            setLocalEdits(prev => {
                                const updated = { ...prev };
                                Object.keys(updated).forEach(id => {
                                    updated[id] = { ...updated[id], status: 'paid', payment_date: updated[id].payment_date || todayStr };
                                });
                                return updated;
                            });
                            setDirtyRows(prev => new Set([...prev, ...payrollList.map(p => p.staff_id)]));
                        }
                    }} disabled={saving === 'all'}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-md text-[10px] font-black uppercase tracking-widest text-emerald-700 hover:bg-emerald-100 active:scale-95 disabled:opacity-50 transition-all shrink-0 shadow-sm cursor-pointer">
                        <CheckCircle size={13} />
                        Mark All Paid
                    </button>
                </div>
            </div>

            {/* Payroll Table */}
            <div className="bg-white border border-black  shadow-sm overflow-hidden">
                <div className="w-full overflow-x-auto">
                    <table className="w-full border-collapse text-[11px]" style={{ tableLayout: 'auto' }}>
                        <thead>
                            <tr className="bg-[#91a0ec] text-black leading-tight">
                                <th rowSpan={2} className="px-2 py-2 text-left text-[11px] font-black uppercase tracking-widest border border-black align-middle">Staff Name</th>
                                <th colSpan={4} className="px-2 py-2 text-center text-[11px] font-black uppercase tracking-widest border border-black">Attendance</th>
                                <th rowSpan={2} className="px-2 py-2 text-center text-[11px] font-black uppercase tracking-widest border border-black align-middle">Gross Salary</th>
                                <th rowSpan={2} className="px-2 py-2 text-center text-[11px] font-black uppercase tracking-widest border border-black align-middle">Calculated Salary</th>
                                <th rowSpan={2} className="px-2 py-2 text-center text-[11px] font-black uppercase tracking-widest border border-black align-middle">Total Deduction</th>
                                <th rowSpan={2} className="px-2 py-2 text-center text-[11px] font-black uppercase tracking-widest border border-black align-middle">Advance</th>
                                <th rowSpan={2} className="px-2 py-2 text-center text-[11px] font-black uppercase tracking-widest border border-black align-middle">Net Payable in A/c</th>
                                <th rowSpan={2} className="px-2 py-2 text-center text-[11px] font-black uppercase tracking-widest border border-black align-middle">Status</th>
                                <th rowSpan={2} className="px-2 py-2 text-center text-[11px] font-black uppercase tracking-widest border border-black align-middle">Action</th>
                            </tr>
                            <tr className="bg-[#a8b4f0] text-black text-[10px] font-black uppercase tracking-widest leading-tight">
                                <th className="px-1 py-1 text-center border border-black">Total</th>
                                <th className="px-1 py-1 text-center border border-black">Present</th>
                                <th className="px-1 py-1 text-center border border-black">Half Day</th>
                                <th className="px-1 py-1 text-center border border-black">Absent</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        {Array.from({ length: 11 }).map((__, j) => (
                                            <td key={j} className="px-3 py-4 border border-black">
                                                <div className="h-4 bg-slate-100 rounded-full" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-6 py-16 text-center border border-black">
                                        <p className="text-sm font-bold text-slate-400">No Active Staff Found</p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((item, idx) => {
                                    const e = localEdits[item.staff_id] || {};
                                    const net = calcNet(item.staff_id);
                                    const isDirty = dirtyRows.has(item.staff_id);
                                    const basic = parseFloat(e.basic_salary) || 0;
                                    const hra = parseFloat(e.hra) || 0;
                                    const da = parseFloat(e.da) || 0;
                                    const gross = basic + hra + da;
                                    const pf = parseFloat(e.pf) || 0;
                                    const pt = parseFloat(e.pt) || 0;
                                    const esic = parseFloat(e.esic) || 0;
                                    const loan = parseFloat(e.loan_deduction) || 0;
                                    const ded = parseFloat(e.deductions) || 0;
                                    const totalDed = pf + pt + esic + ded; // Exclude advance
                                    const totalDays = parseFloat(e.total_days) || 30;
                                    const presentDays = parseFloat(e.present_days) || 0;
                                    const halfDays = parseFloat(e.half_days) || 0;
                                    const absentDays = Math.max(0, totalDays - presentDays - halfDays);

                                    const calculatedSalary = (gross / totalDays) * (presentDays + halfDays * 0.5);

                                    return (
                                        <tr key={`${item.staff_id}-${idx}`} className={`transition-colors border-b border-black ${isDirty ? 'bg-amber-50/30' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'} hover:bg-slate-100/60`}>
                                            {/* Staff Name */}
                                            <td className="px-3 py-3 border border-black">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-black text-xs border border-slate-300 shrink-0">
                                                        {item.full_name?.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-black text-[#001736] truncate">{item.full_name}</p>
                                                        <p className="text-[10px] text-slate-400 uppercase tracking-tight truncate">{item.employee_id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            {/* Attendance */}
                                            <td className="px-2 py-3 border border-black text-center">
                                                <span className="text-xs font-black text-slate-700">{totalDays}</span>
                                            </td>
                                            <td className="px-2 py-3 border border-black text-center">
                                                <span className="text-xs font-black text-emerald-600">{presentDays}</span>
                                            </td>
                                            <td className="px-2 py-3 border border-black text-center">
                                                <span className="text-xs font-black text-amber-500">{halfDays}</span>
                                            </td>
                                            <td className="px-2 py-3 border border-black text-center">
                                                <span className="text-xs font-black text-red-500">{absentDays}</span>
                                            </td>
                                            {/* Gross Salary */}
                                            <td className="px-2 py-3 border border-black text-center">
                                                <p className="text-xs font-black text-indigo-700">₹{gross.toLocaleString('en-IN')}</p>
                                            </td>
                                            {/* Calculated Salary */}
                                            <td className="px-2 py-3 border border-black text-center bg-indigo-50/30">
                                                <p className="text-xs font-black text-blue-700">₹{Math.round(calculatedSalary).toLocaleString('en-IN')}</p>
                                            </td>
                                            {/* Total Deduction */}
                                            <td className="px-2 py-3 border border-black text-center">
                                                <p className="text-xs font-black text-red-600">₹{totalDed.toLocaleString('en-IN')}</p>
                                            </td>
                                            {/* Advance Deduction Column */}
                                            <td className="px-2 py-3 border border-black text-center">
                                                <p className="text-xs font-black text-orange-600">₹{loan.toLocaleString('en-IN')}</p>
                                            </td>
                                            {/* Net Payable */}
                                            <td className="px-2 py-3 border border-black text-center">
                                                <p className="text-xs font-black text-emerald-600">₹{net.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                                            </td>
                                            {/* Status — mirrors dropdown selection */}
                                            <td className="px-2 py-3 border border-black text-center">
                                                <div className="flex flex-col items-center justify-center gap-1">
                                                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full ${statusBadge[e.status] || statusBadge.pending}`}>
                                                        {e.status || 'pending'}
                                                    </span>
                                                    {e.payment_date && (
                                                        <span className="text-[8px] text-slate-500 font-bold uppercase tracking-tight">Paid: {formatPaymentDate(e.payment_date)}</span>
                                                    )}
                                                </div>
                                            </td>
                                            {/* Action */}
                                            <td className="px-2 py-3 border border-black">
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-1">
                                                        {/* View */}
                                                        <button
                                                            onClick={() => { setSelectedStaff(item); setShowModal(true); }}
                                                            title="View & Edit"
                                                            className="p-1.5 bg-indigo-50 border border-slate-300 rounded-md text-indigo-600 hover:bg-[#001736] hover:text-white transition-all cursor-pointer shadow-sm shrink-0"
                                                        >
                                                            <Eye size={14} />
                                                        </button>
                                                        {/* Date Picker Button */}
                                                        <div className="relative shrink-0">
                                                            <input
                                                                type="date"
                                                                value={e.payment_date || ''}
                                                                onChange={(ev) => updateEdit(item.staff_id, 'payment_date', ev.target.value)}
                                                                className="absolute opacity-0 inset-0 w-full h-full cursor-pointer z-10"
                                                                title="Set Payment Date"
                                                            />
                                                            <button
                                                                type="button"
                                                                title="Set Payment Date"
                                                                className="p-1.5 bg-slate-50 border border-slate-300 rounded-md text-slate-500 hover:bg-[#001736] hover:text-white transition-all cursor-pointer shadow-sm flex items-center justify-center"
                                                            >
                                                                <Calendar size={14} />
                                                            </button>
                                                        </div>
                                                        {/* Status Dropdown */}
                                                        <select
                                                            id={`status-${item.staff_id}`}
                                                            name={`status-${item.staff_id}`}
                                                            value={e.status || 'pending'}
                                                            onChange={async (ev) => {
                                                                const newStatus = ev.target.value;
                                                                updateEdit(item.staff_id, 'status', newStatus);
                                                                if (newStatus === 'paid' && !e.payment_date) {
                                                                    const todayStr = getLocalDateString();
                                                                    updateEdit(item.staff_id, 'payment_date', todayStr);
                                                                } else if (newStatus === 'pending' || newStatus === 'hold') {
                                                                    updateEdit(item.staff_id, 'payment_date', null);
                                                                }
                                                                await handleStatusChange(item.payroll_id, newStatus, item.staff_id);
                                                            }}
                                                            className="flex-1 border border-slate-300 rounded-md text-[10px] font-black uppercase px-1 py-1.5 bg-white text-[#001736] outline-none cursor-pointer shadow-sm"
                                                        >
                                                            <option value="pending">Pending</option>
                                                            <option value="paid">Paid</option>
                                                            <option value="hold">Hold</option>
                                                        </select>
                                                        {/* Download */}
                                                        <button
                                                            onClick={() => generatePDF(item)}
                                                            disabled={item.status === 'pending'}
                                                            title="Download Salary Slip"
                                                            className="p-1.5 bg-slate-50 border border-slate-300 rounded-md text-slate-500 hover:bg-[#001736] hover:text-white transition-all disabled:opacity-30 cursor-pointer shadow-sm shrink-0"
                                                        >
                                                            <Download size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Pagination */}
                <div className="px-6 py-4 border-t border-black flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Registry: {filtered.length} Staff
                    </span>
                    <div className="flex items-center gap-3">
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className="px-4 py-2 bg-white border border-slate-300 rounded-md text-xs font-black text-slate-500 hover:bg-[#001736] hover:text-white disabled:opacity-30 transition-all cursor-pointer shadow-sm">PREV</button>
                        <span className="text-xs font-black uppercase tracking-widest text-[#001736]">PAGE {currentPage} OF {totalPages || 1}</span>
                        <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            className="px-4 py-2 bg-white border border-slate-300 rounded-md text-xs font-black text-slate-500 hover:bg-[#001736] hover:text-white disabled:opacity-30 transition-all cursor-pointer shadow-sm">NEXT</button>
                    </div>
                </div>
            </div>
            {/* Payroll Detail Modal */}
            {showModal && selectedStaff && (
                <PayrollDetailModal
                    staff={selectedStaff}
                    edits={localEdits[selectedStaff.staff_id] || {}}
                    onClose={() => setShowModal(false)}
                    updateEdit={updateEdit}
                    calcNet={() => calcNet(selectedStaff.staff_id)}
                    onSave={() => {
                        handleSaveRow(selectedStaff.staff_id, selectedStaff.status);
                        setShowModal(false);
                    }}
                    saving={saving === selectedStaff.staff_id}
                    onViewLedger={() => {
                        setViewingReportStaff(selectedStaff);
                        setShowModal(false);
                    }}
                />
            )}
        </div>
    );
};

const PayrollDetailModal = ({ staff, edits, onClose, updateEdit, calcNet, onSave, saving, onViewLedger }) => {
    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-[95%] sm:w-full max-w-lg rounded-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                {/* Modal Header */}
                <div className="bg-[#001736] p-6 sm:p-8 text-white relative shrink-0">
                    <button onClick={onClose} className="absolute right-6 top-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white/60 hover:text-white">
                        <X size={20} />
                    </button>
                    <div className="flex items-center gap-4">
                        <div>
                            <h2 className="text-xl font-black text-white! tracking-tight">{staff.full_name}</h2>
                            <p className="text-white text-sm font-bold uppercase tracking-widest">{staff.employee_id} · {staff.designation || staff.staff_type || 'Staff'}</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
                    {/* Attendance Quick Info */}
                    <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-4 border border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-md bg-indigo-100 flex items-center justify-center text-indigo-600">
                                <Clock size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase">Monthly Attendance</p>
                                <p className="text-sm font-bold text-slate-700">{edits.present_days} / {edits.total_days} Days Present</p>
                            </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1.5">
                            <button
                                type="button"
                                onClick={onViewLedger}
                                className="text-[9px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-[#001736] hover:text-white transition-all px-2.5 py-1.5 rounded-md uppercase tracking-wider cursor-pointer shadow-sm"
                            >
                                View Log Ledger
                            </button>
                        </div>
                    </div>

                    {/* Salary Components Grid */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Earnings</h3>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Basic Salary</label>
                                <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-md px-4 py-2.5 focus-within:border-indigo-400 transition-all">
                                    <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
                                    <input
                                        type="number"
                                        value={edits.basic_salary}
                                        onChange={(e) => updateEdit(staff.staff_id, 'basic_salary', parseFloat(e.target.value) || 0)}
                                        className="bg-transparent w-full text-sm font-black text-slate-700 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">HRA</label>
                                <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-md px-4 py-2.5 focus-within:border-indigo-400 transition-all">
                                    <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
                                    <input
                                        type="number"
                                        value={edits.hra}
                                        onChange={(e) => updateEdit(staff.staff_id, 'hra', parseFloat(e.target.value) || 0)}
                                        className="bg-transparent w-full text-sm font-black text-slate-700 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">DA</label>
                                <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-md px-4 py-2.5 focus-within:border-indigo-400 transition-all">
                                    <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
                                    <input
                                        type="number"
                                        value={edits.da}
                                        onChange={(e) => updateEdit(staff.staff_id, 'da', parseFloat(e.target.value) || 0)}
                                        className="bg-transparent w-full text-sm font-black text-slate-700 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Performance Bonus</label>
                                <div className="flex items-center gap-2 bg-emerald-50/50 border border-emerald-100 rounded-md px-4 py-2.5 focus-within:border-emerald-400 transition-all">
                                    <IndianRupee className="w-3.5 h-3.5 text-emerald-500" />
                                    <input
                                        type="number"
                                        value={edits.bonus}
                                        onChange={(e) => updateEdit(staff.staff_id, 'bonus', parseFloat(e.target.value) || 0)}
                                        className="bg-transparent w-full text-sm font-black text-emerald-700 outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Deductions</h3>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">PF (Provident Fund)</label>
                                <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-md px-4 py-2.5 focus-within:border-indigo-400 transition-all">
                                    <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
                                    <input
                                        type="number"
                                        value={edits.pf}
                                        onChange={(e) => updateEdit(staff.staff_id, 'pf', parseFloat(e.target.value) || 0)}
                                        className="bg-transparent w-full text-sm font-black text-slate-700 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">ESIC</label>
                                <div className="flex items-center gap-2 bg-rose-50/50 border border-rose-100 rounded-md px-4 py-2.5 focus-within:border-rose-400 transition-all">
                                    <IndianRupee className="w-3.5 h-3.5 text-rose-500" />
                                    <input
                                        type="number"
                                        value={edits.esic}
                                        onChange={(e) => updateEdit(staff.staff_id, 'esic', parseFloat(e.target.value) || 0)}
                                        className="bg-transparent w-full text-sm font-black text-rose-700 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Prof. Tax (PT)</label>
                                <div className="flex items-center gap-2 bg-rose-50/50 border border-rose-100 rounded-md px-4 py-2.5 focus-within:border-rose-400 transition-all">
                                    <IndianRupee className="w-3.5 h-3.5 text-rose-500" />
                                    <input
                                        type="number"
                                        value={edits.pt}
                                        onChange={(e) => updateEdit(staff.staff_id, 'pt', parseFloat(e.target.value) || 0)}
                                        className="bg-transparent w-full text-sm font-black text-rose-700 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Loan Recovery</label>
                                <div className="flex items-center gap-2 bg-rose-50/50 border border-rose-100 rounded-md px-4 py-2.5 focus-within:border-rose-400 transition-all">
                                    <IndianRupee className="w-3.5 h-3.5 text-rose-500" />
                                    <input
                                        type="number"
                                        value={edits.loan_deduction}
                                        onChange={(e) => updateEdit(staff.staff_id, 'loan_deduction', parseFloat(e.target.value) || 0)}
                                        className="bg-transparent w-full text-sm font-black text-rose-700 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Misc Deductions</label>
                                <div className="flex items-center gap-2 bg-rose-50/50 border border-rose-100 rounded-md px-4 py-2.5 focus-within:border-rose-400 transition-all">
                                    <IndianRupee className="w-3.5 h-3.5 text-rose-500" />
                                    <input
                                        type="number"
                                        value={edits.deductions}
                                        onChange={(e) => updateEdit(staff.staff_id, 'deductions', parseFloat(e.target.value) || 0)}
                                        className="bg-transparent w-full text-sm font-black text-rose-700 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Date and Remarks Row */}
                    <div className="grid grid-cols-2 gap-6 bg-slate-50/50 p-4 rounded-[20px] border border-slate-100">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Payment Date</label>
                            <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-md px-4 py-2.5 focus-within:border-indigo-400 transition-all shadow-sm">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <input
                                    type="date"
                                    value={edits.payment_date || ''}
                                    onChange={(e) => updateEdit(staff.staff_id, 'payment_date', e.target.value)}
                                    className="bg-transparent w-full text-sm font-black text-slate-700 outline-none scheme-light"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Remarks / Note</label>
                            <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-md px-4 py-2.5 focus-within:border-indigo-400 transition-all shadow-sm">
                                <FileText className="w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={edits.remarks || ''}
                                    onChange={(e) => updateEdit(staff.staff_id, 'remarks', e.target.value)}
                                    placeholder="Optional note..."
                                    className="bg-transparent w-full text-sm font-bold text-slate-700 outline-none placeholder:text-slate-300 placeholder:font-medium"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Net Payable Summary */}
                    <div className="bg-slate-50 rounded-[24px] p-6 flex items-center justify-between border border-slate-100">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Net Payable</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Calculated based on attendance</p>
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-black text-[#001736]">₹{calcNet().toLocaleString('en-IN')}</p>
                        </div>
                    </div>

                    {/* Modal Actions */}
                    <div className="flex gap-3">
                        <button onClick={onClose} className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all">
                            Cancel
                        </button>
                        <button
                            onClick={onSave}
                            disabled={saving}
                            className="flex-2 px-6 py-4 bg-[#001736] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save Payroll Data
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = (props) => {
    const Icon = props.icon;
    return (
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-300 shadow-sm flex items-center gap-3 sm:gap-4 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className={`w-9 h-9 sm:w-12 sm:h-12 ${props.color} rounded-md sm:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform shrink-0`}>
                {Icon && <Icon className="w-4 h-4 sm:w-6 sm:h-6 text-white" />}
            </div>
            <div className="min-w-0">
                <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{props.label}</p>
                <p className="text-base sm:text-xl font-black text-[#001736] truncate">{props.value}</p>
            </div>
        </div>
    );
};

export default StaffPayroll;
