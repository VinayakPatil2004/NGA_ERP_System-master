import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Search, CheckCircle, AlertCircle,
    Loader2, Eye, Plus, FileText, X, Download, Upload,
    Printer, FileSpreadsheet, ChevronDown, ListFilter, Share2, Landmark, Edit2
} from 'lucide-react';
import { toast } from 'react-toastify';
import DataTable from '../../../../../admcomponents/DataTable';
import { getStudentFeeLedger, recordStudentPayment } from '../../../../../../services/FeesAndFinance/studentFeeAPI';
import bulkImportAPI from '../../../../../../services/bulkImportAPI';
import { getFeeStructures } from '../../../../../../services/FeesAndFinance/feeStructureAPI';
import * as XLSX from 'xlsx';
import StudentFeeEntry from '../../../../../admpages/StudentFeeEntry';
import API, { ROOT_URL } from '../../../../../../services/API';
import ngaLogo from '../../../../../../assets/nga-logo.png';
import StudentFeeDetailsModal from './StudentFeeDetailsModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAcademicYear } from '../../../../../../context/AcademicYearContext';

// ADD THIS HELPER BELOW IMPORTS
const formatCurrency = (val) => (val ?? 0).toLocaleString("en-IN");

const StudentFeeAssignment = ({ isMobileSearchOpen }) => {
    const { selectedYear: globalYear } = useAcademicYear();
    // Derive selectedYear (ID) from global context
    const selectedYear = globalYear?.id || '';

    // 1. Core State
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGrade, setSelectedGrade] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'paid', 'pending'
    const [studentTypeFilter, setStudentTypeFilter] = useState('all'); // 'all', 'new', 'old'
    const [payingStudent, setPayingStudent] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Pagination & Mobile UI State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;
    const [showEntryForm, setShowEntryForm] = useState(false);
    const [selectedForEntry, setSelectedForEntry] = useState(null);
    const [viewingStudent, setViewingStudent] = useState(null);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [feeStructures, setFeeStructures] = useState([]);
    const [editingPayment, setEditingPayment] = useState(null);
    const fileInputRef = useRef(null);

    // 2. Load fee structures when year changes
    useEffect(() => {
        const loadFeeStructures = async () => {
            if (!selectedYear) return;
            try {
                const structures = await getFeeStructures(selectedYear);
                setFeeStructures(structures);
            } catch {
                toast.error("Fee structure sync failed.");
            }
        };
        loadFeeStructures();
    }, [selectedYear]);

    // 3. Fetch Student Ledger Summary
    const loadRegistry = useCallback(async () => {
        if (!selectedYear) return;
        try {
            setLoading(true);
            const ledger = await getStudentFeeLedger(selectedYear, selectedGrade, '');
            setStudents(ledger);
        } catch (error) {
            console.log(error);
            toast.error("Failed to load student ledger matrix.");
        } finally {
            setLoading(false);
        }
    }, [selectedYear, selectedGrade]);

    useEffect(() => {
        loadRegistry();
    }, [loadRegistry]);

    const handleExportExcel = () => {
        const data = filteredStudents.map((s, idx) => {
            const structure = feeStructures.find(f => String(f.grade).replace(/\D/g, '') === String(s.grade).replace(/\D/g, '') && f.student_type === s.studentType);
            const annual = structure ? (
                Number(structure.admission_fee || 0) +
                Number(structure.tuition_fee || 0) +
                Number(structure.term_fee || 0) +
                Number(structure.computer_fee || 0) +
                Number(structure.other_fee || 0)
            ) : (s.annual_fee ?? 0);
            const discount = s.discount_amount ?? 0;
            const transport = s.transport_fee ?? 0;
            const paid = s.totalPaid ?? 0;
            const total = Math.max(0, annual - discount) + transport;
            const balance = total - paid;

            return {
                "SR.": idx + 1,
                "GR NUMBER": s.gr_no || s.studentIdNo,
                "STUDENT NAME": s.name,
                "MOBILE": s.contact,
                "CLASS": s.grade,
                "ACADEMIC FEE": annual,
                "DISCOUNT": discount,
                "TRANSPORT": transport,
                "GRAND TOTAL": total,
                "PAID AMOUNT": paid,
                "BALANCE": balance
            };
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Student_Ledger");
        XLSX.writeFile(wb, `Institutional_Ledger_${new Date().getFullYear()}.xlsx`);
    };

    const handleExportPDF = () => {
        try {
            const doc = new jsPDF('l', 'mm', 'a4');
            const tableData = filteredStudents.map((s, idx) => {
                const structure = feeStructures.find(f => String(f.grade).replace(/\D/g, '') === String(s.grade).replace(/\D/g, '') && f.student_type === s.studentType);
                const annual = structure ? (
                    Number(structure.admission_fee || 0) +
                    Number(structure.tuition_fee || 0) +
                    Number(structure.term_fee || 0) +
                    Number(structure.computer_fee || 0) +
                    Number(structure.other_fee || 0)
                ) : (s.annual_fee ?? 0);
                const discount = s.discount_amount ?? 0;
                const transport = s.transport_fee ?? 0;
                const paid = s.totalPaid ?? 0;
                const total = Math.max(0, annual - discount) + transport;
                const balance = total - paid;

                return [
                    idx + 1,
                    s.name,
                    s.grade,
                    annual.toLocaleString(),
                    discount.toLocaleString(),
                    transport.toLocaleString(),
                    total.toLocaleString(),
                    paid.toLocaleString(),
                    balance.toLocaleString()
                ];
            });

            doc.setFontSize(14);
            doc.text('Institutional Fee Ledger Report', 14, 15);
            doc.setFontSize(10);
            doc.text(`Academic Year: 2026-27 | Date: ${new Date().toLocaleDateString()}`, 14, 22);

            autoTable(doc, {
                startY: 30,
                head: [['SR.', 'STUDENT NAME', 'CLASS', 'FEE', 'DISCOUNT', 'TRANSPORT', 'TOTAL', 'PAID', 'BALANCE']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [0, 23, 54], fontSize: 8 },
                styles: { fontSize: 8, font: 'helvetica' }
            });

            doc.save(`Student_Ledger_${new Date().getTime()}.pdf`);
            toast.success("PDF Ledger exported successfully.");
        } catch (err) {
            console.error("PDF Export Error:", err);
            toast.error("Institutional PDF generation failed. Check console for details.");
        }
    };

    const handleExportCSV = () => {
        const headers = ["SR.", "GR NUMBER", "STUDENT NAME", "MOBILE", "CLASS", "ACADEMIC FEE", "DISCOUNT", "TRANSPORT", "GRAND TOTAL", "PAID AMOUNT", "BALANCE"];
        const data = filteredStudents.map((s, idx) => {
            const structure = feeStructures.find(f => String(f.grade).replace(/\D/g, '') === String(s.grade).replace(/\D/g, '') && f.student_type === s.studentType);
            const annual = structure ? (
                Number(structure.admission_fee || 0) +
                Number(structure.tuition_fee || 0) +
                Number(structure.term_fee || 0) +
                Number(structure.computer_fee || 0) +
                Number(structure.other_fee || 0)
            ) : (s.annual_fee ?? 0);
            const discount = s.discount_amount ?? 0;
            const transport = s.transport_fee ?? 0;
            const paid = s.totalPaid ?? 0;
            const total = Math.max(0, annual - discount) + transport;
            const balance = total - paid;

            return [idx + 1, s.gr_no || s.studentIdNo, s.name, s.contact, s.grade, annual, discount, transport, total, paid, balance].join(',');
        });
        
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(',') + "\n" + data.join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Student_Ledger_${new Date().getTime()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredStudents = students.filter(s => {
        // 1. Search Logic
        const matchesSearch = (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                             (s.studentIdNo || '').toLowerCase().includes(searchQuery.toLowerCase());
        
        if (!matchesSearch) return false;

        // 1.5 Student Type Filter
        if (studentTypeFilter !== 'all') {
            if (s.studentType !== studentTypeFilter) return false;
        }

        // 2. Status Filtering (Client-side for absolute accuracy)
        if (statusFilter === 'all') return true;

        const structure = feeStructures.find(f => String(f.grade).replace(/\D/g, '') === String(s.grade).replace(/\D/g, '') && f.student_type === s.studentType);
        const annual = structure ? (
            Number(structure.admission_fee || 0) +
            Number(structure.tuition_fee || 0) +
            Number(structure.term_fee || 0) +
            Number(structure.computer_fee || 0) +
            Number(structure.other_fee || 0)
        ) : (s.annual_fee ?? 0);

        const transport = s.transport_fee ?? 0;
        const discount = s.discount_amount ?? 0;
        const paid = s.totalPaid ?? 0;
        const total = Math.max(0, annual - discount) + transport;
        const balance = total - paid;

        if (statusFilter === 'paid') return balance <= 0;
        if (statusFilter === 'pending') return balance > 0;

        return true;
    });

    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
    const paginatedStudents = filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedGrade, statusFilter, studentTypeFilter]);

    const handleRecordPayment = async () => {
        if (!payingStudent || !paymentAmount) return;
        try {
            setSubmitting(true);
            await recordStudentPayment({
                student_id: payingStudent.id,
                academic_year_id: selectedYear,
                amount: paymentAmount,
                payment_method: 'cash'
            });
            toast.success("Payment synchronized with ledger.");
            setPayingStudent(null);
            setPaymentAmount('');
            loadRegistry();
        } catch (error) {
            console.log(error);
            toast.error("Payment transaction failed.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDownloadReceipt = (student) => {
        const WinPrint = window.open('', '', 'width=1000,height=800');

        const numberToWords = (num) => {
            const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
            const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
            if ((num = num.toString()).length > 9) return 'Overflow';
            let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
            if (!n) return '';
            let str = '';
            str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
            str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
            str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
            str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
            str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Only' : 'Only';
            return str;
        };

        const receiptStyle = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
                @page { size: A4; margin: 1cm; }
                body { font-family: 'Inter', sans-serif; color: #000; margin: 0; padding: 0; line-height: 1.4; }
                .receipt-container { border: 1px solid #000; padding: 0; width: 100%; margin: 0 auto; position: relative; box-sizing: border-box; }
                
                .header { display: flex; align-items: center; padding: 15px; gap: 20px; border-bottom: 1px solid #000; }
                .logo { width: 80px; height: 80px; object-fit: contain; }
                .school-info { flex: 1; text-align: center; }
                .school-name { font-size: 28px; font-weight: 900; margin: 0; letter-spacing: -1px; }
                .school-address { font-size: 11px; font-weight: 700; margin: 5px 0; }
                
                .receipt-title { background: #f1f5f9; text-align: center; font-weight: 900; font-size: 14px; padding: 8px; border-bottom: 1px solid #000; text-transform: uppercase; letter-spacing: 2px; border-top: 1px solid #000; border-left: 1px solid #000; }
                
                .info-grid { display: grid; grid-template-columns: 1fr 1fr;  }
                .info-col { padding: 10px 15px; font-size: 11px; display: flex; flex-direction: column; gap: 5px; }
                .info-row { display: flex; }
                .info-label { width: 100px; font-weight: 900; text-transform: uppercase; color: #475569; }
                .info-value { font-weight: 700; color: #000; }
                
                .fee-table { width: 100%; border-collapse: collapse; }
                .fee-table th { border-bottom: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; padding: 8px; font-size: 11px; font-weight: 900; text-transform: uppercase; text-align: left; background: #fff; }
                .fee-table td { border-bottom: 1px solid #000; border-right: 1px solid #000; border-left: 1px solid #000; padding: 10px 8px; font-size: 11px; font-weight: 700; }
                .fee-table th:last-child, .fee-table td:last-child { border-right: none; }
                .fee-table td:nth-child(3), .fee-table td:nth-child(4), .fee-table td:nth-child(5) { text-align: center; }
                
                .pay-mode-title { background: #f1f5f9;border-left: 1px solid #000; text-align: center; font-weight: 900; font-size: 11px; padding: 6px; border-bottom: 1px solid #000; text-transform: uppercase; }
                .pay-info { display: flex; justify-content: space-between; padding: 10px 15px; font-size: 11px; border-bottom: 1px solid #000; }
                
                .summary { padding: 10px 15px; border-bottom: 1px solid #000; }
                .summary-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px; }
                .summary-label { font-weight: 900; text-transform: uppercase; }
                .summary-value { font-weight: 900; }
                
                .in-words { padding: 10px 15px; font-size: 10px; font-weight: 700; border-bottom: 1px solid #000; }
                
                .note { font-size: 9px; font-weight: 700; color: #475569; padding: 20px 15px 10px; text-align: center; width: 100%; }
                
                .footer { padding: 30px 15px; display: flex; justify-content: space-between; align-items: flex-end; }
                .sig-box { text-align: center; width: 150px; }
                .sig-line { border-top: 1px solid #000; margin-bottom: 5px; }
                .sig-text { font-size: 10px; font-weight: 900; text-transform: uppercase; }
            </style>
        `;

        const structure = feeStructures.find(f => String(f.grade).replace(/\D/g, '') === String(student.grade).replace(/\D/g, '') && f.student_type === student.studentType);
        const officialAnnual = structure ? (
            Number(structure.admission_fee || 0) +
            Number(structure.tuition_fee || 0) +
            Number(structure.term_fee || 0) +
            Number(structure.computer_fee || 0) +
            Number(structure.other_fee || 0)
        ) : (student.annual_fee ?? 0);

        const totalPayable = Number(officialAnnual) + Number(student.transport_fee || 0);
        const pendingBalance = totalPayable - Number(student.totalPaid || 0);
        const receiptNo = `NGA/LDR/${new Date().getFullYear()}/${student.id.toString().padStart(4, '0')}`;

        WinPrint.document.write(`
            <html>
                <head>
                    <title>Fee Receipt - ${student.name || 'Student'}</title>
                    ${receiptStyle}
                </head>
                <body>
                    <div class="receipt-container">
                        <div class="header">
                            <img src="${ngaLogo}" class="logo" />
                            <div class="school-info">
                                <h1 class="school-name">NEW GRACE ACADEMY</h1>
                                <p class="school-address">Ekta Nagar, Near Ankay Housing Society, Borgad, Mhasrul, Nashik-422 004. MH</p>
                                <p class="school-address" style="margin-top: 0;"><strong>Contact:</strong> +91 91684 42244 | <strong>Website:</strong> www.newgraceacademy.in</p>
                            </div>
                        </div>
                        
                        <div class="receipt-title">FEE RECEIPT (LEDGER SUMMARY)</div>
                        
                        <div class="info-grid">
                            <div class="info-col">
                                <div class="info-row"><span class="info-label">Receipt No</span><span class="info-value">: ${receiptNo}</span></div>
                                <div class="info-row"><span class="info-label">Adm No</span><span class="info-value">: ${student.studentIdNo || '---'}</span></div>
                                <div class="info-row"><span class="info-label">Name</span><span class="info-value">: ${(student.name || '---').toUpperCase()}</span></div>
                                <div class="info-row"><span class="info-label">Class</span><span class="info-value">: ${student.grade || '---'}</span></div>
                            </div>
                            <div class="info-col">
                                <div class="info-row"><span class="info-label">Date</span><span class="info-value">: ${new Date().toLocaleDateString('en-GB')}</span></div>
                                <div class="info-row"><span class="info-label">Session</span><span class="info-value">: 2026-27</span></div>
                                <div class="info-row"><span class="info-label">Status</span><span class="info-value">: ${(student.paymentStatus || 'ACTIVE').toUpperCase()}</span></div>
                            </div>
                        </div>
                        
                        <table class="fee-table">
                            <thead>
                                <tr>
                                    <th style="width: 50px;">Sl.No</th>
                                    <th>Description</th>
                                    <th style="width: 100px;">Due</th>
                                    <th style="width: 80px;">Con</th>
                                    <th style="width: 100px;">Paid</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style="text-align: center;">1</td>
                                    <td>
                                        <div>Tuition Fee (2026-27)</div>
                                        ${student.transport_fee > 0 ? '<div>Other Fee & Transport Fee</div>' : '<div>Other Annual Fee</div>'}
                                    </td>
                                    <td>${formatCurrency(totalPayable)}</td>
                                    <td>0.00</td>
                                    <td>${formatCurrency(student.totalPaid || 0)}</td>
                                </tr>
                            </tbody>
                        </table>
                        
                        <div class="pay-mode-title">FINANCIAL SUMMARY</div>
                        
                        <div class="summary">
                            <div class="summary-row">
                                <span class="summary-label">Total Amount Paid</span>
                                <span class="summary-value">₹ ${formatCurrency(student.totalPaid || 0)}</span>
                            </div>
                            <div class="summary-row" style="color: #e11d48;">
                                <span class="summary-label">Total Pending Balance</span>
                                <span class="summary-value">₹ ${formatCurrency(pendingBalance)}</span>
                            </div>
                        </div>
                        
                        <div class="in-words">
                            TOTAL IN WORDS: ${numberToWords(Math.round(student.totalPaid || 0)).toUpperCase()}
                        </div>
                        
                        <div class="note">
                            Note : System Generated Document. Valid Subject to Realization.
                        </div>
                        
                        <div class="footer">
                            <div class="sig-box">
                                <div class="sig-line"></div>
                                <div class="sig-text">Receiver Signature</div>
                            </div>
                            <div class="sig-box">
                                <div class="sig-line"></div>
                                <div class="sig-text">Principal Signature</div>
                            </div>
                        </div>
                    </div>
                </body>
            </html>
        `);

        WinPrint.document.close();
        WinPrint.focus();
        setTimeout(() => {
            WinPrint.print();
            WinPrint.close();
        }, 800);
    };

    const handleViewStudent = async (student) => {
        try {
            setViewingStudent(student);
            const response = await API.get('/finance/student-payment-details', { params: { student_id: student.id } });

            // Filter out zero-amount rows and group by unique identifier
            const rawData = (response.data || []).filter(p => Number(p.paid_amount) > 0);

            const grouped = rawData.reduce((acc, curr) => {
                const key = curr.transaction_id || curr.cheque_no || `${curr.payment_date}_${curr.payment_method}_${curr.remarks}`;
                if (!acc[key]) {
                    acc[key] = {
                        ...curr,
                        payer_name: curr.payer_name || student.name, // Use student name as default payer
                        receiver_name: curr.receiver_name || 'Admin Desk' // Institutional default
                    };
                } else {
                    acc[key].paid_amount = Number(acc[key].paid_amount) + Number(curr.paid_amount);
                    acc[key].fee_type = `${acc[key].fee_type}, ${curr.fee_type}`;
                }
                return acc;
            }, {});

            setPaymentHistory(Object.values(grouped));
        } catch {
            toast.error("Ledger retrieval failed.");
        }
    };

    const handleViewDetails = async (student) => {
        try {
            setLoading(true);
            await handleViewStudent(student);
        } catch {
            toast.error("Failed to load payment details.");
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            toast.info("Uploading file...");
            const res = await bulkImportAPI.importFees(file);
            toast.success(`Import successful! Added: ${res.inserted}, Failed: ${res.failed}`);
            loadRegistry();
        } catch (error) {
            console.error(error);
            toast.error("Error during import.");
        } finally {
            // Reset input value to allow selecting the same file again
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <div className="space-y-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* INTEGRATED TABLE CONTAINER */}
            <div className="bg-white shadow-sm rounded-none overflow-hidden">

                {/* CONDENSED TOOLBAR */}
                <div className="p-3 lg:p-4 border-b border-slate-100 bg-slate-50/30">
                    <div className={`flex-wrap items-center justify-between gap-4 ${!isMobileSearchOpen ? 'hidden lg:flex' : 'flex animate-in slide-in-from-top-2 duration-300'}`}>
                        {/* LEFT SECTION: SEARCH & FILTERS */}
                        <div className="flex flex-wrap items-center gap-2 lg:gap-3 flex-1 min-w-full lg:min-w-[300px]">
                            <div className="relative w-full lg:w-64 group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-institutional-main/40 group-focus-within:text-institutional-main transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search student..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-white border border-table rounded text-institutional-main text-[11px] font-bold outline-none focus:border-institutional-main transition-all uppercase placeholder:text-slate-300 tracking-widest shadow-sm"
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                                <div className="flex bg-white p-0.5 rounded border border-table shadow-sm shrink-0">
                                    {['all', 'pending', 'paid'].map(status => (
                                        <button
                                            key={status}
                                            onClick={() => setStatusFilter(status)}
                                            className={`px-2 py-1.5 lg:px-3 rounded text-[9px] font-black uppercase tracking-widest transition-all ${statusFilter === status ? 'bg-[#001736] text-white' : 'text-institutional-muted hover:bg-slate-50'}`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>

                                <div className="relative group flex-1 lg:flex-none">
                                    <select
                                        value={selectedGrade}
                                        onChange={(e) => setSelectedGrade(e.target.value)}
                                        className="pl-3 pr-9 py-2 bg-white border border-table rounded text-[9px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer hover:border-institutional-main transition-all shadow-sm w-full lg:w-32"
                                    >
                                        <option value="">All Grades</option>
                                        {['Nursery', 'JR.KG', 'SR.KG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'].map(grade => (
                                            <option key={grade} value={grade}>{grade}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-institutional-main pointer-events-none group-hover:scale-110 transition-transform" />
                                </div>

                                <div className="relative group flex-1 lg:flex-none">
                                    <select
                                        value={studentTypeFilter}
                                        onChange={(e) => setStudentTypeFilter(e.target.value)}
                                        className="pl-3 pr-9 py-2 bg-white border border-table rounded text-[9px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer hover:border-institutional-main transition-all shadow-sm w-full lg:w-32"
                                    >
                                        <option value="all">All Types</option>
                                        <option value="new">New Student</option>
                                        <option value="old">Old Student</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-institutional-main pointer-events-none group-hover:scale-110 transition-transform" />
                                </div>
                            </div>
                        </div>

                        {/* RIGHT SECTION: ACTIONS */}
                        <div className="flex items-center gap-2 w-full lg:w-auto justify-start lg:justify-end">
                            <div className="group relative">
                                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-table rounded text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
                                    <Share2 className="w-3.5 h-3.5 text-info" /> Export <ChevronDown className="w-3 h-3 opacity-50" />
                                </button>
                                <div className="absolute right-0 top-full w-44 bg-white border border-black shadow-2xl rounded py-2 hidden group-hover:block z-50">
                                    <button onClick={handleExportExcel} className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase hover:bg-slate-50">Excel</button>
                                    <button onClick={handleExportCSV} className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase hover:bg-slate-50">CSV</button>
                                    <button onClick={handleExportPDF} className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase hover:bg-slate-50">PDF Report</button>
                                    <button onClick={() => window.print()} className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase hover:bg-slate-50 border-t border-slate-100 mt-1">Print View</button>
                                </div>
                            </div>

                            <div className="group relative">
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleFileUpload} 
                                    accept=".csv, .xlsx" 
                                    className="hidden" 
                                />
                                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-table rounded text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
                                    <Upload className="w-3.5 h-3.5 text-warning" /> Import <ChevronDown className="w-3 h-3 opacity-50" />
                                </button>
                                <div className="absolute right-0 top-full w-44 bg-white border border-table shadow-2xl rounded py-2 hidden group-hover:block z-50">
                                    <button onClick={() => fileInputRef.current?.click()} className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase hover:bg-slate-50">Upload Excel</button>
                                    <button onClick={() => fileInputRef.current?.click()} className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase hover:bg-slate-50">Upload CSV</button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                <div className="w-full overflow-x-auto custom-scrollbar border-t border-slate-100">
                    <DataTable
                        headers={[
                            { label: "Sr.", className: "w-[35px] text-center" },
                            { label: "Name", className: "w-[190px]" },
                            { label: "Mobile", className: "w-[80px]" },
                            { label: "Class", className: "text-center w-[40px]" },
                            { label: "Fee", className: "text-center w-[65px]" },
                            { label: "Discount", className: "w-[70px] text-center" },
                            { label: "Transport", className: "text-center w-[65px]" },
                            { label: "Total", className: "text-center w-16 font-black text-black" },
                            { label: "Paid", className: "text-center w-16 font-bold text-black" },
                            { label: "Balance", className: "text-center w-16 font-bold text-black" },
                            { label: "Actions", className: "text-center w-[100px] print:hidden" }
                        ]}
                        columnCount={11}
                        loading={loading}
                        footer={
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-institutional-muted">
                                    Showing <span className="text-institutional-main">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="text-institutional-main">{Math.min(currentPage * itemsPerPage, filteredStudents.length)}</span> of <span className="text-institutional-main">{filteredStudents.length}</span> entries
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
                        {paginatedStudents.map((s, idx) => {
                            const structure = feeStructures.find(f => String(f.grade).replace(/\D/g, '') === String(s.grade).replace(/\D/g, '') && f.student_type === s.studentType);
                            const annual = structure ? (
                                Number(structure.admission_fee || 0) +
                                Number(structure.tuition_fee || 0) +
                                Number(structure.term_fee || 0) +
                                Number(structure.computer_fee || 0) +
                                Number(structure.other_fee || 0)
                            ) : (s.annual_fee ?? 0);

                            const discount = s.discount_amount ?? 0;
                            const transport = s.transport_fee ?? 0;
                            const paid = s.totalPaid ?? 0;
                            const total = Math.max(0, annual - discount) + transport;
                            const balance = total - paid;

                            return (
                                <tr key={idx} className="hover-table-row transition-colors group text-[10px] lg:text-[11px] font-bold text-table-cell uppercase">
                                    <td className="px-1 py-2 border-b-table border-r-table text-center text-black">
                                        {((currentPage - 1) * itemsPerPage) + idx + 1}
                                    </td>

                                    <td className="px-1.5 py-2 border-b-table border-r-table text-black font-black truncate max-w-[190px]">
                                        <div className="flex items-center gap-2">
                                            <span>{s.name}</span>
                                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest leading-none ${s.studentType === 'new' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                                                {s.studentType}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="px-1.5 py-2 border-b-table border-r-table text-black">
                                        {(s.contact || '---').substring(0, 10)}
                                    </td>

                                    <td className="px-1 py-2 border-b-table border-r-table text-center text-black font-black tracking-tighter">
                                        {s.grade}
                                    </td>

                                    <td className="px-1 py-2 border-b-table border-r-table text-center font-black">
                                        ₹{formatCurrency(annual)}
                                    </td>

                                    <td className="px-1.5 py-2 border-b-table border-r-table text-center font-black text-black truncate max-w-[70px]">
                                        ₹{formatCurrency(discount)}
                                    </td>

                                    <td className="px-1 py-2 border-b-table border-r-table text-center font-black">
                                        ₹{formatCurrency(transport)}
                                    </td>

                                    <td className="px-1 py-2 border-b-table border-r-table text-center font-black text-institutional-main tracking-tighter">
                                        ₹{formatCurrency(total)}
                                    </td>

                                    <td className="px-1 py-2 border-b-table border-r-table text-center font-black text-black">
                                        ₹{formatCurrency(paid)}
                                    </td>

                                    <td className="px-1 py-2 border-b-table border-r-table text-center font-black text-black">
                                        ₹{formatCurrency(balance)}
                                    </td>

                                    <td className="px-1 py-2 border-b-table text-center print:hidden">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => {
                                                    const structure = feeStructures.find(f => String(f.grade).replace(/\D/g, '') === String(s.grade).replace(/\D/g, '') && f.student_type === s.studentType);
                                                    const officialAnnual = structure ? (
                                                        Number(structure.admission_fee || 0) +
                                                        Number(structure.tuition_fee || 0) +
                                                        Number(structure.term_fee || 0) +
                                                        Number(structure.computer_fee || 0) +
                                                        Number(structure.other_fee || 0)
                                                    ) : (s.annual_fee ?? 0);

                                                    setSelectedForEntry({
                                                        ...s,
                                                        annual_fee: officialAnnual
                                                    });
                                                    setShowEntryForm(true);
                                                }}
                                                className="p-1 transition-all text-info hover:bg-slate-50 border border-table rounded cursor-pointer"
                                                title="Pay"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>

                                            <button
                                                onClick={() => handleDownloadReceipt(s)}
                                                className="p-1 transition-all text-warning hover:bg-slate-50 border border-table rounded cursor-pointer"
                                                title="Receipt"
                                            >
                                                <FileText className="w-3 h-3" />
                                            </button>

                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const res = await API.get('/finance/student-payment-details', { params: { student_id: s.id } });
                                                        if (res.data && res.data.length > 0) {
                                                            const latest = res.data[0];
                                                            setEditingPayment(latest);
                                                            setSelectedForEntry(s);
                                                            setShowEntryForm(true);
                                                        } else {
                                                            toast.info("No existing payments found to edit.");
                                                        }
                                                    } catch {
                                                        toast.error("Failed to fetch payment details.");
                                                    }
                                                }}
                                                className="p-1 hover:bg-slate-100 border rounded text-blue-500 transition-colors"
                                                title="Edit Latest Payment"
                                            >
                                                <Edit2 className="w-3 h-3" />
                                            </button>

                                            <button
                                                onClick={() => handleViewDetails(s)}
                                                className="p-1 transition-all text-institutional-main hover:bg-slate-50 border border-table rounded cursor-pointer"
                                                title="View"
                                            >
                                                <Eye className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredStudents.length === 0 && !loading && (
                            <tr>
                                <td colSpan={10} className="py-20 text-center border-b-table">
                                    <div className="flex flex-col items-center gap-4">
                                        <AlertCircle className="w-10 h-10 text-slate-200" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Registry search returned no matches</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </DataTable>
                </div>
            </div>

            {/* PAYMENT MODAL */}
            {payingStudent && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-200 flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-4xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="form-header-institutional p-10 flex items-center justify-between text-white border-b border-white/10">
                            <div>
                                <h1 className="text-3xl font-black uppercase tracking-tighter mb-1">Process Payment</h1>
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Provisioning Student Ledger Summary</p>
                            </div>
                            <button onClick={() => setPayingStudent(null)} className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-10 space-y-8">
                            <div className="bg-slate-50 p-6 rounded-2xl border border-table">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-institutional-muted">Student Name</span>
                                    <span className="text-lg font-black text-institutional-main uppercase">{payingStudent.name}</span>
                                </div>
                                <div className="h-px bg-slate-200 mb-4"></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[9px] font-black uppercase text-slate-400">Class / Grade</p>
                                        <p className="text-[11px] font-black text-institutional-main">{payingStudent.grade}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase text-slate-400">Father Name</p>
                                        <p className="text-[11px] font-black text-institutional-main truncate">{payingStudent.fatherName || '---'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-institutional-main uppercase tracking-widest ml-1">Payment Amount (INR)</label>
                                <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-table focus-within:bg-white focus-within:ring-8 focus-within:ring-institutional-main/5 transition-all">
                                    <span className="text-3xl font-black text-slate-300 ml-4">₹</span>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                        className="w-full bg-transparent text-3xl font-black text-institutional-main outline-none"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleRecordPayment}
                                disabled={submitting || !paymentAmount}
                                className="w-full py-6 bg-institutional-main text-white rounded-2xl font-black text-[12px] uppercase tracking-[0.4em] shadow-2xl hover:bg-black transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5 text-success" />}
                                Sync Transaction
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* VIEW DETAILS MODAL */}
            <StudentFeeDetailsModal
                viewingStudent={viewingStudent}
                onClose={() => setViewingStudent(null)}
                feeStructures={feeStructures}
                paymentHistory={paymentHistory}
            />

            {/* FULL ENTRY MODAL */}
            {showEntryForm && (
                <StudentFeeEntry
                    initialStudent={selectedForEntry}
                    initialPayment={editingPayment}
                    selectedYear={selectedYear}
                    onClose={() => {
                        setShowEntryForm(false);
                        setSelectedForEntry(null);
                        setEditingPayment(null);
                        loadRegistry(); // Refresh data after payment
                    }}
                />
            )}
        </div>
    );
};

export default StudentFeeAssignment;
