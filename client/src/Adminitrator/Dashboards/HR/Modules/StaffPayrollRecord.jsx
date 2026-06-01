import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FileSpreadsheet, Search, Download, Printer, IndianRupee, CheckCircle, TrendingDown, Calendar, FileText, Upload, RefreshCw } from 'lucide-react';
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import DataTable from '../../../admcomponents/DataTable';
import hrAPI from '../../../../services/hrAPI';
import { ROOT_URL } from '../../../../services/API';
import bulkImportAPI from '../../../../services/bulkImportAPI';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ngaLogo from '../../../../assets/nga-logo.png';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';

const StaffPayrollRecord = ({ toggleSidebar }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
    const [currentPage, setCurrentPage] = useState(1);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const itemsPerPage = 10;
    
    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const fetchPayroll = useCallback(async () => {
        try {
            setLoading(true);
            const [selectedYear, selectedMonth] = month.split('-');
            const data = await hrAPI.getPayrollRegistry(parseInt(selectedMonth), parseInt(selectedYear));
            setRecords(data.data || []);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load payroll records');
        } finally {
            setLoading(false);
        }
    }, [month]);

    useEffect(() => {
        fetchPayroll();
    }, [fetchPayroll]);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            setIsUploading(true);
            toast.info('Uploading and processing file...');
            const res = await bulkImportAPI.importPayrollRecord(file);
            toast.success(res.message || 'Bulk import successful');
            fetchPayroll();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to import data');
        } finally {
            setIsUploading(false);
            e.target.value = null;
        }
    };

    const filtered = useMemo(() => {
        return records.filter(r => {
            const matchesSearch = r.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.employee_id?.toLowerCase().includes(searchQuery.toLowerCase());
            if (!matchesSearch) return false;

            if (statusFilter === 'all') return true;

            const currentStatus = r.status || 'pending';
            return currentStatus.toLowerCase() === statusFilter.toLowerCase();
        });
    }, [records, searchQuery, statusFilter]);

    // Reset to page 1 whenever filters change (derived, no setState-in-effect)
    const activePage = useMemo(() => {
        const maxPage = Math.ceil(filtered.length / itemsPerPage) || 1;
        return Math.min(currentPage, maxPage);
    }, [filtered.length, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginatedRecords = useMemo(() => {
        return filtered.slice((activePage - 1) * itemsPerPage, activePage * itemsPerPage);
    }, [filtered, activePage, itemsPerPage]);

    const totalPaid = Math.round(filtered.reduce((sum, r) => sum + (parseFloat(r.net_salary) || 0), 0));
    const totalDeductions = Math.round(filtered.reduce((sum, r) => sum + (parseFloat(r.deductions) || 0) + (parseFloat(r.pf) || 0) + (parseFloat(r.pt) || 0) + (parseFloat(r.esic) || 0) + (parseFloat(r.loan_deduction) || 0), 0));

    const generatePDF = async (item, action = 'download') => {
        const [selectedYear, selectedMonth] = month.split('-');
        const monthIndex = parseInt(selectedMonth) - 1;
        const basic = parseFloat(item.basic_salary) || 0;
        const hra = parseFloat(item.hra) || 0;
        const da = parseFloat(item.da) || 0;
        const bonus = parseFloat(item.bonus) || 0;
        const pf = parseFloat(item.pf) || 0;
        const tax = parseFloat(item.pt) || 0;
        const esic = parseFloat(item.esic) || 0;
        const loan = parseFloat(item.loan_deduction) || 0;
        const ded = parseFloat(item.deductions) || 0;
        const net = Math.round(parseFloat(item.net_salary) || 0);

        const totalEarnings = basic + hra + da + bonus;
        const totalDeductions = pf + tax + loan + ded + esic;
        
        const doc = new jsPDF();
        const primaryColor = [0, 23, 54];
        const staffDesignation = item.designation || item.staff_type || 'Staff';

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

        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text("NEW GRACE ACADEMY", 105, 19, { align: 'center' });

        doc.setFontSize(7.5);
        doc.text("Ekta Nagar, Near Ankay Housing Society, Borgad, Mhasrul, Nashik-422 004, MH", 105, 25, { align: 'center' });
        doc.text("Contact: +91 91684 42244 | Website: www.newgraceacademy.in", 105, 31, { align: 'center' });

        doc.setTextColor(...primaryColor);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("SALARY PAYSLIP", 105, 52, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(`${MONTHS[monthIndex].toUpperCase()} ${selectedYear}`, 105, 59, { align: 'center' });

        doc.setDrawColor(220, 220, 220);
        doc.line(20, 64, 190, 64);

        doc.setTextColor(50, 50, 50);
        doc.setFontSize(9);

        doc.setFont("helvetica", "bold"); doc.text("Employee Name:", 20, 76);
        doc.setFont("helvetica", "normal"); doc.text(item.full_name || 'N/A', 55, 76);

        doc.setFont("helvetica", "bold"); doc.text("Employee ID:", 20, 83);
        doc.setFont("helvetica", "normal"); doc.text(item.employee_id || 'N/A', 55, 83);

        doc.setFont("helvetica", "bold"); doc.text("Designation:", 20, 90);
        doc.setFont("helvetica", "normal"); doc.text(staffDesignation, 55, 90);

        doc.setFont("helvetica", "bold"); doc.text("Month/Year:", 130, 76);
        doc.setFont("helvetica", "normal"); doc.text(`${MONTHS[monthIndex]} ${selectedYear}`, 160, 76);

        doc.setFont("helvetica", "bold"); doc.text("Present Days:", 130, 83);
        doc.setFont("helvetica", "normal"); doc.text(`${item.present_days || 0} / ${item.total_days || 0}`, 160, 83);

        doc.setFont("helvetica", "bold"); doc.text("Status:", 130, 90);
        doc.setFont("helvetica", "normal"); doc.text((item.status || 'PENDING').toUpperCase(), 160, 90);

        doc.setFont("helvetica", "bold"); doc.text("Payment Date:", 130, 97);
        doc.setFont("helvetica", "normal"); doc.text(item.payment_date ? new Date(item.payment_date).toLocaleDateString('en-IN') : '—', 160, 97);

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

        const pageHeight = doc.internal.pageSize.height;
        let sigY = doc.lastAutoTable.finalY + 40;
        if (sigY > pageHeight - 40) sigY = pageHeight - 40;

        doc.setDrawColor(150, 150, 150);
        doc.setLineWidth(0.2);

        doc.line(20, sigY, 75, sigY);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(...primaryColor);
        doc.text("Authorized Stamp & Sign", 47.5, sigY + 5, { align: 'center' });

        doc.line(135, sigY, 190, sigY);
        doc.text("Employee Signature", 162.5, sigY + 5, { align: 'center' });

        if (action === 'print') {
            doc.autoPrint();
            window.open(doc.output('bloburl'), '_blank');
        } else {
            doc.save(`Payslip_${item.employee_id}_${MONTHS[monthIndex]}_${selectedYear}.pdf`);
        }
    };

    const handleExportExcel = () => {
        if (!filtered || filtered.length === 0) {
            toast.info("No records to export");
            return;
        }

        const dataToExport = filtered.map(rec => {
            const basic = parseFloat(rec.basic_salary) || 0;
            const hra = parseFloat(rec.hra) || 0;
            const da = parseFloat(rec.da) || 0;
            const gross = basic + hra + da;
            const bonus = parseFloat(rec.bonus) || 0;
            const pf = parseFloat(rec.pf) || 0;
            const pt = parseFloat(rec.pt) || 0;
            const esic = parseFloat(rec.esic) || 0;
            const loan = parseFloat(rec.loan_deduction) || 0;
            const deds = parseFloat(rec.deductions) || 0;
            const totalDeductions = pf + pt + esic + loan + deds;
            const net = Math.round(parseFloat(rec.net_salary) || 0);

            return {
                'Employee ID': rec.employee_id || 'N/A',
                'Staff Name': rec.full_name || 'N/A',
                'National Code': rec.national_code || 'N/A',
                'Basic Salary (INR)': basic,
                'Gross Salary (INR)': gross,
                'HRA (INR)': hra,
                'DA (INR)': da,
                'Performance Bonus (INR)': bonus,
                'PF Deduction (INR)': pf,
                'PT Deduction (INR)': pt,
                'ESIC Deduction (INR)': esic,
                'Advance/Loan Deduction (INR)': loan,
                'Other Deductions (INR)': deds,
                'Total Deductions (INR)': totalDeductions,
                'Net Salary (INR)': net,
                'Status': (rec.status || 'PENDING').toUpperCase(),
                'Payment Date': rec.payment_date ? new Date(rec.payment_date).toLocaleDateString('en-IN') : '—'
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);

        const max_widths = {};
        dataToExport.forEach(row => {
            Object.keys(row).forEach(key => {
                const val = row[key];
                const length = val ? val.toString().length : 0;
                max_widths[key] = Math.max(max_widths[key] || key.length, length);
            });
        });
        const cols = Object.keys(max_widths).map(key => ({ wch: max_widths[key] + 3 }));
        worksheet['!cols'] = cols;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Payroll Records');

        const [year, mNum] = month.split('-');
        const monthIndex = parseInt(mNum) - 1;
        const monthName = MONTHS[monthIndex] || 'Record';
        const filename = `Payroll_Records_${monthName}_${year}.xlsx`;

        XLSX.writeFile(workbook, filename);
        toast.success("Excel exported successfully!");
    };

    const handleExportPDF = async () => {
        if (!filtered || filtered.length === 0) {
            toast.info("No records to export");
            return;
        }

        const [selectedYear, selectedMonth] = month.split('-');
        const monthIndex = parseInt(selectedMonth) - 1;
        const monthName = MONTHS[monthIndex] || 'Record';

        const doc = new jsPDF('landscape');
        const primaryColor = [0, 23, 54];

        const loadLogo = () => new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = ngaLogo;
        });

        const logoImg = await loadLogo();
        if (logoImg) {
            doc.addImage(logoImg, 'PNG', 14, 10, 24, 16);
        }

        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text("NEW GRACE ACADEMY", 150, 16, { align: 'center' });

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text("Ekta Nagar, Near Ankay Housing Society, Borgad, Mhasrul, Nashik-422 004, MH", 150, 21, { align: 'center' });
        doc.text(`PAYROLL REGISTRY REPORT - ${monthName.toUpperCase()} ${selectedYear}`, 150, 27, { align: 'center' });

        doc.line(14, 32, 283, 32);

        const tableColumn = [
            'Emp ID',
            'Employee Name',
            'Basic Salary',
            'Gross Salary',
            'Deductions',
            'Net Salary',
            'Pay Date',
            'Status'
        ];

        const tableRows = filtered.map(rec => {
            const basic = parseFloat(rec.basic_salary) || 0;
            const hra = parseFloat(rec.hra) || 0;
            const da = parseFloat(rec.da) || 0;
            const gross = basic + hra + da;
            const pf = parseFloat(rec.pf) || 0;
            const pt = parseFloat(rec.pt) || 0;
            const esic = parseFloat(rec.esic) || 0;
            const loan = parseFloat(rec.loan_deduction) || 0;
            const deds = parseFloat(rec.deductions) || 0;
            const totalDeds = pf + pt + esic + loan + deds;
            const net = Math.round(parseFloat(rec.net_salary) || 0);

            return [
                rec.employee_id || 'N/A',
                rec.full_name || 'N/A',
                `INR ${basic.toLocaleString('en-IN')}`,
                `INR ${gross.toLocaleString('en-IN')}`,
                `INR ${totalDeds.toLocaleString('en-IN')}`,
                `INR ${net.toLocaleString('en-IN')}`,
                rec.payment_date ? new Date(rec.payment_date).toLocaleDateString('en-IN') : '—',
                (rec.status || 'PENDING').toUpperCase()
            ];
        });

        autoTable(doc, {
            startY: 36,
            head: [tableColumn],
            body: tableRows,
            theme: 'grid',
            styles: {
                fontSize: 8.5,
                cellPadding: 3
            },
            headStyles: {
                fillColor: primaryColor,
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252]
            },
            margin: { left: 14, right: 14 }
        });

        doc.save(`Payroll_Report_${monthName}_${selectedYear}.pdf`);
        toast.success("PDF exported successfully!");
    };

    return (
        <div className="p-4 lg:p-8 space-y-6 min-h-screen bg-[#F8FAFC]">
            <ModuleHeader hideAcademicYear={true}
                title="Payroll Records"
                subTitle="Historical Salary Archives & Payslips"
                icon={FileSpreadsheet}
                badge={`${records.length} Records`}
                toggleSidebar={toggleSidebar}
            />

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Records" value={records.length} icon={FileSpreadsheet} color="bg-blue-600" />
                <StatCard label="Total Paid" value={`₹${(totalPaid / 1000).toFixed(1)}K`} icon={IndianRupee} color="bg-emerald-500" />
                <StatCard label="Total Deductions" value={`₹${totalDeductions.toLocaleString()}`} icon={TrendingDown} color="bg-rose-500" />
                <StatCard label="All Paid" value="100%" icon={CheckCircle} color="bg-indigo-500" />
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 lg:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="flex gap-3 w-full lg:w-auto flex-wrap lg:flex-nowrap items-center">
                    {/* Month picker */}
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 py-3 px-4 rounded-xl">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <input
                            type="month"
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                            className="bg-transparent text-sm font-bold text-[#001736] outline-none"
                        />
                    </div>
                    {/* Status Filter */}
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 py-3 px-4 rounded-xl">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-transparent text-sm font-bold text-[#001736] outline-none cursor-pointer"
                        >
                            <option value="all">All Status</option>
                            <option value="paid">Paid</option>
                            <option value="pending">Pending</option>
                            <option value="hold">Hold</option>
                        </select>
                    </div>
                    {/* Export Dropdown */}
                    <div className="relative">
                        <button 
                            onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                            className="flex items-center gap-2 px-4 py-3 bg-slate-50 border border-slate-200 text-[#001736] rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all cursor-pointer shadow-sm select-none"
                        >
                            <Download className="w-4 h-4 text-indigo-600" /> Export
                            <span className="text-[9px] text-slate-400">▼</span>
                        </button>
                        {exportDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setExportDropdownOpen(false)} />
                                <div className="absolute left-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-20 py-2 animate-in fade-in slide-in-from-top-2 duration-150">
                                    <button 
                                        onClick={() => { handleExportExcel(); setExportDropdownOpen(false); }}
                                        className="flex items-center gap-2 w-full px-4 py-2.5 hover:bg-slate-50 text-left text-xs font-bold text-slate-700 transition-colors"
                                    >
                                        <Download className="w-4 h-4 text-emerald-600" /> Export Excel
                                    </button>
                                    <button 
                                        onClick={() => { handleExportPDF(); setExportDropdownOpen(false); }}
                                        className="flex items-center gap-2 w-full px-4 py-2.5 hover:bg-slate-50 text-left text-xs font-bold text-[#001736] transition-colors"
                                    >
                                        <FileText className="w-4 h-4 text-red-600" /> Export PDF
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                    {/* Bulk Import */}
                    <label className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 text-[#001736] rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all cursor-pointer shadow-sm select-none shrink-0">
                        {isUploading ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} className="text-emerald-600" />} 
                        Import
                        <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                    </label>
                </div>
                <div className="relative w-full lg:max-w-sm">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name, ID or national code..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400"
                    />
                </div>
            </div>

            {/* DataTable */}
            <DataTable
                headers={[
                    { label: 'National Code/ ID', className: 'border border-black w-[110px] lg:w-[130px]' },
                    { label: 'Employee', className: 'border border-black' },
                    { label: 'Basic Salary', className: 'border border-black' },
                    { label: 'Gross Salary', className: 'border border-black' },
                    { label: 'Deductions', className: 'border border-black' },
                    { label: 'Net Salary', className: 'border border-black font-black text-emerald-600' },
                    { label: 'Pay Date', className: 'border border-black' },
                    { label: 'Status', className: 'border border-black' },
                    { label: 'Actions', className: 'text-center border border-black' },
                ]}
                columnCount={9}
                loading={loading}
                emptyMessage="No Payroll Records Found"
                footer={
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex-wrap">
                            <span className="tracking-widest">Salary Archive: {month}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                            <span className="tracking-[0.2em]">{filtered.length} Records · Total: ₹{totalPaid.toLocaleString()}</span>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <button 
                                disabled={activePage === 1}
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-400 hover:text-[#001736] hover:border-slate-400 disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:border-slate-300 transition-all cursor-pointer"
                            >PREV</button>
                            <span className="text-xs font-black uppercase tracking-widest text-[#001736]">
                                PAGE {activePage} OF {totalPages || 1}
                            </span>
                            <button 
                                disabled={activePage === totalPages || totalPages === 0}
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-400 hover:text-[#001736] hover:border-slate-400 disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:border-slate-300 transition-all cursor-pointer"
                            >NEXT</button>
                        </div>
                    </div>
                }
            >
                {paginatedRecords.map((rec, idx) => {
                    const basic = parseFloat(rec.basic_salary) || 0;
                    const hra = parseFloat(rec.hra) || 0;
                    const da = parseFloat(rec.da) || 0;
                    const gross = basic + hra + da;
                    const totalDeds = (parseFloat(rec.deductions) || 0) + (parseFloat(rec.pf) || 0) + (parseFloat(rec.pt) || 0) + (parseFloat(rec.esic) || 0) + (parseFloat(rec.loan_deduction) || 0);
                    return (
                    <tr key={`${rec.staff_id}-${idx}`} className="hover:bg-slate-50/50 transition-colors group">
                        {/* Record ID */}
                        <td className="px-2 py-3 border border-black">
                            <span className="text-[11px] font-black text-black bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">{rec.national_code || rec.employee_id}</span>
                        </td>
                        {/* Employee */}
                        <td className="px-2 py-3 border border-black">
                            <div className="flex items-center gap-2">
                                {rec.photo && (
                                    <img src={`${ROOT_URL}/${rec.photo.replace(/^\//, '')}`} alt="" className="w-8 h-8 rounded-lg object-cover shadow-md shrink-0" />
                                )}
                                <div>
                                    <p className="text-xs font-bold text-[#001736]">{rec.full_name}</p>
                                    <p className="text-[9px] text-slate-400 font-medium">{rec.employee_id}</p>
                                </div>
                            </div>
                        </td>
                        {/* Basic */}
                        <td className="px-2 py-3 border border-black">
                            <p className="text-xs font-bold text-[#001736]">₹{basic.toLocaleString()}</p>
                        </td>
                        {/* Gross */}
                        <td className="px-2 py-3 border border-black">
                            <p className="text-xs font-bold text-[#001736]">₹{gross.toLocaleString()}</p>
                        </td>
                        {/* Deductions */}
                        <td className="px-2 py-3 border border-black">
                            <p className="text-xs font-bold text-rose-500">₹{totalDeds.toLocaleString()}</p>
                        </td>
                        {/* Net Paid */}
                        <td className="px-2 py-3 border border-black">
                            <p className="text-xs font-black text-emerald-600">₹{(Math.round(parseFloat(rec.net_salary) || 0)).toLocaleString()}</p>
                        </td>
                        {/* Date */}
                        <td className="px-2 py-3 border border-black">
                            <p className="text-xs font-medium text-slate-600">{rec.payment_date ? new Date(rec.payment_date).toLocaleDateString('en-IN') : '—'}</p>
                        </td>
                        {/* Status */}
                        <td className="px-2 py-3 border border-black">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${rec.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                <CheckCircle className="w-2.5 h-2.5" /> {rec.status || 'PENDING'}
                            </span>
                        </td>
                        {/* Actions */}
                        <td className="px-2 py-3 border border-black">
                            <div className="flex items-center justify-center gap-1">
                                <button onClick={() => generatePDF(rec, 'download')} className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-colors border border-blue-100" title="Download Payslip">
                                    <Download className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => generatePDF(rec, 'print')} className="p-1.5 bg-slate-50 text-slate-600 hover:bg-[#001736] hover:text-white rounded-lg transition-colors border border-slate-200" title="Print Payslip">
                                    <Printer className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </td>
                    </tr>
                )})}
            </DataTable>
        </div>
    );
};

const StatCard = ({ label, value, color, icon }) => {
    const IconComp = icon;
    return (
        <div className="bg-white p-4 lg:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 group hover:shadow-md transition-all">
            <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                <IconComp className="w-5 h-5 text-white" />
            </div>
            <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                <p className="text-lg font-black text-[#001736]">{value}</p>
            </div>
        </div>
    );
};

export default StaffPayrollRecord;
