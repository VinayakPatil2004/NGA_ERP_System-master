import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Clock, ArrowLeft, Download, FileSpreadsheet, TrendingUp, Calendar, User
} from 'lucide-react';
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import { toast } from 'react-toastify';
import { getStaffAttendanceHistory } from '../../../../services/attendanceAPI';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// ── Clock & Duration Calculation Helpers ─────────────────────────────────────
const calculateDailyHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;
    const [inH, inM] = checkIn.split(':').map(Number);
    const [outH, outM] = checkOut.split(':').map(Number);
    
    const inTotalMinutes = inH * 60 + inM;
    const outTotalMinutes = outH * 60 + outM;
    
    if (outTotalMinutes <= inTotalMinutes) return 0;
    return (outTotalMinutes - inTotalMinutes) / 60;
};

const formatDuration = (hoursNum) => {
    if (!hoursNum || hoursNum <= 0) return '—';
    const totalMinutes = Math.round(hoursNum * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours === 0) return `${minutes} mins`;
    if (minutes === 0) return `${hours} hrs`;
    return `${hours} hrs ${minutes} mins`;
};

const formatTotalDuration = (hoursNum) => {
    if (!hoursNum || hoursNum <= 0) return '0 hrs';
    const totalMinutes = Math.round(hoursNum * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (minutes === 0) return `${hours} hrs`;
    return `${hours} hrs ${minutes} mins`;
};

const StaffAttendanceReport = ({ staff, onClose, toggleSidebar }) => {
    const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
    const [reportYear, setReportYear] = useState(new Date().getFullYear());
    const [reportHistory, setReportHistory] = useState([]);
    const [reportLoading, setReportLoading] = useState(false);

    // ── History fetch routine ──
    const fetchStaffHistory = useCallback(async (staffId) => {
        try {
            setReportLoading(true);
            const data = await getStaffAttendanceHistory({ staff_id: staffId });
            setReportHistory(data || []);
        } catch (err) {
            console.error('Error fetching staff attendance history:', err);
            toast.error('Failed to load attendance history');
        } finally {
            setReportLoading(false);
        }
    }, []);

    useEffect(() => {
        if (staff?.staff_id) {
            fetchStaffHistory(staff.staff_id);
        }
    }, [staff, fetchStaffHistory]);

    // ── Chronological Report Day & Stats Generators ──
    const reportLedgerDays = useMemo(() => {
        if (!staff) return [];
        const daysInMonth = new Date(reportYear, reportMonth, 0).getDate();
        const days = [];
        
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${reportYear}-${String(reportMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dateObj = new Date(reportYear, reportMonth - 1, d);
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
            const isSunday = dayName === 'Sun';

            const record = reportHistory.find(r => {
                if (!r.date) return false;
                const rDate = r.date.split('T')[0];
                return rDate === dateStr;
            });

            let effectiveStatus = 'pending';
            if (record) {
                effectiveStatus = record.status === 'not marked' ? 'pending' : (record.status || 'pending');
            } else if (isSunday) {
                effectiveStatus = 'weekend';
            }

            const dailyHours = record ? calculateDailyHours(record.check_in_time, record.check_out_time) : 0;
            const hoursStr = formatDuration(dailyHours);
            const formattedDate = `${String(d).padStart(2, '0')} ${dateObj.toLocaleDateString('en-US', { month: 'short' })} ${reportYear}`;

            days.push({
                dateStr,
                dayName,
                isSunday,
                record,
                effectiveStatus,
                dailyHours,
                hoursStr,
                formattedDate,
            });
        }
        return days;
    }, [staff, reportMonth, reportYear, reportHistory]);

    const reportStats = useMemo(() => {
        const stats = {
            present: 0,
            late: 0,
            absent: 0,
            leave: 0,
            totalHours: 0,
            activeWorkedDays: 0,
            score: 0,
            formattedTotalHours: '0 hrs',
            formattedAvgHours: '0 hrs',
        };

        reportLedgerDays.forEach(day => {
            if (day.effectiveStatus === 'present') stats.present++;
            else if (day.effectiveStatus === 'late') stats.late++;
            else if (day.effectiveStatus === 'absent') stats.absent++;
            else if (day.effectiveStatus === 'leave') stats.leave++;

            if (day.dailyHours > 0) {
                stats.totalHours += day.dailyHours;
                stats.activeWorkedDays++;
            }
        });

        const markedDays = stats.present + stats.late + stats.absent + stats.leave;
        stats.score = markedDays > 0 ? Math.round(((stats.present + stats.late) / markedDays) * 100) : 0;
        stats.formattedTotalHours = formatTotalDuration(stats.totalHours);
        
        const avgHours = stats.activeWorkedDays > 0 ? stats.totalHours / stats.activeWorkedDays : 0;
        stats.formattedAvgHours = formatDuration(avgHours);

        return stats;
    }, [reportLedgerDays]);

    // ── Excel Export handler ──
    const handleExportExcel = () => {
        if (!staff) return;

        const monthName = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][reportMonth - 1];
        
        // Prepare excel metadata & rows
        const titleRow = ["NGA ERP SYSTEM - STAFF ATTENDANCE HISTORY REPORT"];
        const emptyRow = [];
        
        const profileRows = [
            ["Staff Member:", staff.full_name],
            ["Employee ID:", staff.employee_id || staff.staff_id],
            ["Designation/Role:", staff.role_name || staff.staff_type || 'Staff'],
            ["Report Period:", `${monthName} ${reportYear}`],
        ];

        const summaryHeader = ["SUMMARY METRICS"];
        const summaryRows = [
            ["Attendance Score", `${reportStats.score}%`],
            ["Total Hours Worked", reportStats.formattedTotalHours],
            ["Average Daily Shift", reportStats.formattedAvgHours],
            ["Present Days", reportStats.present],
            ["Late Days", reportStats.late],
            ["Absent Days", reportStats.absent],
            ["Leave Days", reportStats.leave]
        ];

        const ledgerHeader = ["DAILY ATTENDANCE LEDGER SHEET"];
        const ledgerColumns = ["Sr.", "Date", "Day", "Status", "Check-In", "Check-Out", "Working Hours", "Remarks"];
        
        const ledgerRows = reportLedgerDays.map((day, idx) => {
            const statusLabel = day.effectiveStatus === 'weekend' 
                ? 'Weekend' 
                : day.effectiveStatus === 'pending' 
                ? 'Not Marked' 
                : day.effectiveStatus.toUpperCase();

            return [
                idx + 1,
                day.formattedDate,
                day.dayName,
                statusLabel,
                day.record?.check_in_time ? day.record.check_in_time.slice(0, 5) : '—',
                day.record?.check_out_time ? day.record.check_out_time.slice(0, 5) : '—',
                day.hoursStr,
                day.record?.remarks || (day.isSunday ? 'Sunday Recess' : '')
            ];
        });

        // Assemble all rows
        const allData = [
            titleRow,
            emptyRow,
            ...profileRows,
            emptyRow,
            summaryHeader,
            ...summaryRows,
            emptyRow,
            ledgerHeader,
            ledgerColumns,
            ...ledgerRows
        ];

        // Create sheet
        const worksheet = XLSX.utils.aoa_to_sheet(allData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Report");

        // Save
        const filename = `Attendance_Report_${staff.full_name.replace(/\s+/g, '_')}_${monthName}_${reportYear}.xlsx`;
        XLSX.writeFile(workbook, filename);
        toast.success("Excel report exported successfully!");
    };

    // ── PDF Export handler ──
    const handleExportPDF = () => {
        if (!staff) return;

        const monthName = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][reportMonth - 1];
        const doc = new jsPDF();
        
        const primaryColor = [0, 23, 54]; // #001736
        const secondaryColor = [100, 116, 139]; // Slate 500

        // ── Title (Placed at top to remove the school name banner) ──
        doc.setTextColor(...primaryColor);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("MONTHLY ATTENDANCE REPORT", 105, 12, { align: 'center' });
        
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text(`${monthName.toUpperCase()} ${reportYear}`, 105, 18, { align: 'center' });
        
        doc.setDrawColor(220, 220, 220);
        doc.line(10, 22, 200, 22);

        // ── Profile Information (Shifted up and aligned to margins) ──
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(9);
        
        // Left Column
        doc.setFont("helvetica", "bold"); doc.text("Staff Member:", 10, 28);
        doc.setFont("helvetica", "normal"); doc.text(staff.full_name, 45, 28);
        
        doc.setFont("helvetica", "bold"); doc.text("Employee ID:", 10, 33);
        doc.setFont("helvetica", "normal"); doc.text(staff.employee_id || `ID: ${staff.staff_id}`, 45, 33);
        
        doc.setFont("helvetica", "bold"); doc.text("Designation / Role:", 10, 38);
        doc.setFont("helvetica", "normal"); doc.text(staff.role_name || staff.staff_type || 'Staff', 45, 38);

        // Right Column
        doc.setFont("helvetica", "bold"); doc.text("Attendance Score:", 120, 28);
        doc.setFont("helvetica", "normal"); doc.text(`${reportStats.score}%`, 160, 28);
        
        doc.setFont("helvetica", "bold"); doc.text("Total Hours Worked:", 120, 33);
        doc.setFont("helvetica", "normal"); doc.text(reportStats.formattedTotalHours, 160, 33);
        
        doc.setFont("helvetica", "bold"); doc.text("Average Daily Shift:", 120, 38);
        doc.setFont("helvetica", "normal"); doc.text(reportStats.formattedAvgHours, 160, 38);

        // Distribution stats
        doc.setFont("helvetica", "bold"); doc.text("Summary Stats:", 10, 44);
        doc.setFont("helvetica", "normal"); doc.text(
            `Present: ${reportStats.present}  |  Late: ${reportStats.late}  |  Absent: ${reportStats.absent}  |  Leave: ${reportStats.leave}`,
            45, 44
        );

        doc.line(10, 48, 200, 48);

        // ── Daily Ledger Table (Optimized row-height, widths, and padding to fit all on one page) ──
        const tableBody = reportLedgerDays.map((day, idx) => {
            const statusLabel = day.effectiveStatus === 'weekend' 
                ? 'Weekend' 
                : day.effectiveStatus === 'pending' 
                ? 'Not Marked' 
                : day.effectiveStatus.toUpperCase();

            return [
                idx + 1,
                day.formattedDate,
                day.dayName,
                statusLabel,
                day.record?.check_in_time ? day.record.check_in_time.slice(0, 5) : '—',
                day.record?.check_out_time ? day.record.check_out_time.slice(0, 5) : '—',
                day.hoursStr,
                day.record?.remarks || (day.isSunday ? 'Sunday Recess' : '—')
            ];
        });

        autoTable(doc, {
            startY: 51,
            head: [['Sr.', 'Date', 'Day', 'Status', 'Check-In', 'Check-Out', 'Working Hours', 'Remarks']],
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: primaryColor, fontSize: 8, halign: 'center', cellPadding: 1.5 },
            bodyStyles: { fontSize: 7, textColor: [60, 60, 60], cellPadding: 1.2 },
            columnStyles: { 
                0: { halign: 'center', cellWidth: 8 },
                1: { cellWidth: 25 },
                2: { halign: 'center', cellWidth: 12 },
                3: { halign: 'center', cellWidth: 22 },
                4: { halign: 'center', cellWidth: 20 },
                5: { halign: 'center', cellWidth: 22 },
                6: { halign: 'center', cellWidth: 25 },
                7: { cellWidth: 56 }
            },
            margin: { left: 10, right: 10, top: 8, bottom: 8 },
            didParseCell: (data) => {
                if (data.row.section === 'body') {
                    const statusVal = data.row.cells[3].text[0];
                    if (statusVal === 'PRESENT') {
                        data.row.cells[3].styles.textColor = [16, 124, 65]; // Emerald
                    } else if (statusVal === 'LATE') {
                        data.row.cells[3].styles.textColor = [217, 119, 6]; // Amber
                    } else if (statusVal === 'ABSENT') {
                        data.row.cells[3].styles.textColor = [220, 38, 38]; // Rose
                    } else if (statusVal === 'LEAVE') {
                        data.row.cells[3].styles.textColor = [147, 51, 234]; // Purple
                    } else if (statusVal === 'Weekend') {
                        data.row.cells[3].styles.textColor = [100, 116, 139]; // Slate
                        data.row.cells[2].styles.textColor = [220, 38, 38]; // Sunday red
                    }
                }
            }
        });

        // ── Footer ──
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            const pageHeight = doc.internal.pageSize.height;
            doc.setDrawColor(220, 220, 220);
            doc.line(10, pageHeight - 16, 200, pageHeight - 16);
            
            doc.setTextColor(...secondaryColor);
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.text("Computer-generated report from Grace ERP Systems", 10, pageHeight - 10);
            doc.text(`Page ${i} of ${pageCount}`, 200, pageHeight - 10, { align: 'right' });
        }

        const pdfFilename = `Attendance_Report_${staff.full_name.replace(/\s+/g, '_')}_${monthName}_${reportYear}.pdf`;
        doc.save(pdfFilename);
        toast.success("PDF report exported successfully!");
    };

    return (
        <div className="p-4 lg:p-8 space-y-6 min-h-screen bg-[#F8FAFC]">
            {/* Header using ModuleHeader with all text/btns white */}
            <ModuleHeader hideAcademicYear={true}
                title={<span className="text-sm sm:text-base lg:text-xl xl:text-2xl font-black tracking-tight block truncate">Staff Attendance Report</span>}
                subTitle={<span className="text-[7px] sm:text-[8px] md:text-[9px] lg:text-[10px] font-black tracking-[0.2em] text-white/40 uppercase leading-none block truncate">Monthly Attendance History Ledger</span>}
                toggleSidebar={toggleSidebar}
                leftCustomContent={
                    <button
                        onClick={onClose}
                        className="h-9 w-9 sm:h-10 sm:w-10 bg-white hover:bg-white/90 border border-slate-200 rounded-xl text-[#001736] transition-all hover:-translate-x-1 active:scale-95 flex items-center justify-center shrink-0 cursor-pointer shadow-md"
                        title="Back to Register"
                    >
                        <ArrowLeft size={16} className="text-[#001736] sm:w-5 sm:h-5" />
                    </button>
                }
            >
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5 shrink-0">
                    {/* Month Selector */}
                    <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2 sm:px-3 h-9 sm:h-10 shadow-md">
                        <select
                            value={reportMonth}
                            onChange={(e) => setReportMonth(Number(e.target.value))}
                            className="bg-transparent text-[11px] sm:text-xs font-bold text-[#001736] border-none outline-none cursor-pointer [color-scheme:light]"
                        >
                            {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, idx) => (
                                <option key={idx} value={idx + 1} className="bg-white text-[#001736] font-bold">{m}</option>
                            ))}
                        </select>
                    </div>

                    {/* Year Selector */}
                    <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2 sm:px-3 h-9 sm:h-10 shadow-md">
                        <select
                            value={reportYear}
                            onChange={(e) => setReportYear(Number(e.target.value))}
                            className="bg-transparent text-[11px] sm:text-xs font-bold text-[#001736] border-none outline-none cursor-pointer [color-scheme:light]"
                        >
                            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                                <option key={y} value={y} className="bg-white text-[#001736] font-bold">{y}</option>
                            ))}
                        </select>
                    </div>
                    
                    {/* Excel Export */}
                    <button
                        onClick={handleExportExcel}
                        className="flex items-center justify-center gap-1.5 px-2.5 sm:px-4 h-9 sm:h-10 w-9 sm:w-auto bg-white hover:bg-white/90 text-[#001736] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border border-slate-200 whitespace-nowrap cursor-pointer shadow-md shrink-0"
                        title="Export Excel"
                    >
                        <FileSpreadsheet size={14} className="text-[#001736] sm:w-[15px] sm:h-[15px]" />
                        <span className="hidden sm:inline">Excel</span>
                    </button>

                    {/* PDF Export */}
                    <button
                        onClick={handleExportPDF}
                        className="flex items-center justify-center gap-1.5 px-2.5 sm:px-4 h-9 sm:h-10 w-9 sm:w-auto bg-white hover:bg-white/90 text-[#001736] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border border-slate-200 whitespace-nowrap cursor-pointer shadow-md shrink-0"
                        title="Export PDF"
                    >
                        <Download size={14} className="text-[#001736] sm:w-[15px] sm:h-[15px]" />
                        <span className="hidden sm:inline">PDF</span>
                    </button>
                </div>
            </ModuleHeader>

            {/* Staff Details Section in Main Page (Not in Header) */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center md:items-start justify-between gap-4 sm:gap-6">
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-50 border border-indigo-100 rounded-2xl sm:rounded-3xl flex items-center justify-center text-2xl sm:text-3xl font-black text-indigo-600 shadow-inner shrink-0">
                        {staff.full_name?.charAt(0)}
                    </div>
                    <div className="space-y-1.5">
                        <span className="inline-block text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] bg-indigo-50 text-indigo-600 border border-indigo-100 px-3 py-1 rounded-full">
                            Active Staff Member
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black text-[#001736] tracking-tight">{staff.full_name}</h2>
                        <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Role / Designation: <span className="text-[#001736] font-black">{staff.role_name || staff.staff_type || 'Staff'}</span>
                        </p>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 w-full md:w-auto border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-8">
                    <div>
                        <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-wider">Employee ID</p>
                        <p className="text-xs sm:text-sm font-black text-[#001736] mt-0.5">{staff.employee_id || `ID: ${staff.staff_id}`}</p>
                    </div>
                    <div>
                        <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-wider">Department</p>
                        <p className="text-xs sm:text-sm font-black text-[#001736] mt-0.5">{staff.department || 'General'}</p>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                        <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-wider">Report Period</p>
                        <p className="text-xs sm:text-sm font-black text-indigo-600 mt-0.5">
                            {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][reportMonth - 1]} {reportYear}
                        </p>
                    </div>
                </div>
            </div>

            {/* Report Statistics Cards */}
            {reportLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-white p-6 rounded-2xl h-28 border border-slate-200" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Attendance Score Circular Meter */}
                    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-2">
                        <div className="min-w-0">
                            <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-wider">Attendance Score</p>
                            <p className="text-xl sm:text-2xl font-black text-[#001736] mt-1">{reportStats.score}%</p>
                            <p className="text-[9px] sm:text-[10px] text-slate-400 mt-1 font-bold truncate">Of marked calendar days</p>
                        </div>
                        <div className="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                <path
                                    className="text-slate-100"
                                    strokeWidth="3.5"
                                    stroke="currentColor"
                                    fill="none"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                                <path
                                    className="text-indigo-600 transition-all duration-500 ease-out"
                                    strokeDasharray={`${reportStats.score}, 100`}
                                    strokeWidth="3.5"
                                    strokeLinecap="round"
                                    stroke="currentColor"
                                    fill="none"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-[10px] font-black text-indigo-700">{reportStats.score}%</span>
                            </div>
                        </div>
                    </div>

                    {/* Total Hours Worked Card */}
                    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                            <Clock size={20} className="sm:w-[22px] sm:h-[22px]" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-wider">Total Worked Hours</p>
                            <p className="text-lg sm:text-xl font-black text-[#001736] mt-1 truncate">{reportStats.formattedTotalHours}</p>
                            <p className="text-[9px] sm:text-[10px] text-slate-400 mt-1 font-bold truncate">Accumulated over the month</p>
                        </div>
                    </div>

                    {/* Average Shift Hours Card */}
                    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                            <TrendingUp size={20} className="sm:w-[22px] sm:h-[22px]" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-wider">Average Daily Shift</p>
                            <p className="text-lg sm:text-xl font-black text-[#001736] mt-1 truncate">{reportStats.formattedAvgHours}</p>
                            <p className="text-[9px] sm:text-[10px] text-slate-400 mt-1 font-bold truncate">On active days worked</p>
                        </div>
                    </div>

                    {/* Attendance Status Distribution Grid */}
                    <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-2 gap-2">
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-1.5 text-center">
                            <p className="text-[8px] font-black text-emerald-600 uppercase tracking-wider">Present</p>
                            <p className="text-sm sm:text-base lg:text-lg font-black text-emerald-700">{reportStats.present}</p>
                        </div>
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-1.5 text-center">
                            <p className="text-[8px] font-black text-amber-600 uppercase tracking-wider">Late</p>
                            <p className="text-sm sm:text-base lg:text-lg font-black text-amber-700">{reportStats.late}</p>
                        </div>
                        <div className="bg-rose-50 border border-rose-100 rounded-xl p-1.5 text-center">
                            <p className="text-[8px] font-black text-rose-600 uppercase tracking-wider">Absent</p>
                            <p className="text-sm sm:text-base lg:text-lg font-black text-rose-700">{reportStats.absent}</p>
                        </div>
                        <div className="bg-purple-50 border border-purple-100 rounded-xl p-1.5 text-center">
                            <p className="text-[8px] font-black text-purple-600 uppercase tracking-wider">Leave</p>
                            <p className="text-sm sm:text-base lg:text-lg font-black text-purple-700">{reportStats.leave}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Ledger Sheet Table */}
            <div className="bg-white shadow-sm rounded-none overflow-hidden border border-slate-200">
                <div className="w-full overflow-x-auto text-table">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                <th className="px-4 py-3.5 text-center w-[60px]">Sr.</th>
                                <th className="px-4 py-3.5 text-left w-[120px]">Date</th>
                                <th className="px-4 py-3.5 text-left w-[100px]">Day</th>
                                <th className="px-4 py-3.5 text-center w-[120px]">Status</th>
                                <th className="px-4 py-3.5 text-center w-[100px]">Check-In</th>
                                <th className="px-4 py-3.5 text-center w-[100px]">Check-Out</th>
                                <th className="px-4 py-3.5 text-center w-[130px]">Working Hours</th>
                                <th className="px-4 py-3.5 text-left">Remarks / Log Source</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        {Array.from({ length: 8 }).map((__, j) => (
                                            <td key={j} className="px-4 py-4 border-b border-slate-100">
                                                <div className="h-4 bg-slate-100 rounded" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : reportLedgerDays.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-bold">
                                        No calendar days found for the selected month.
                                    </td>
                                </tr>
                            ) : (
                                reportLedgerDays.map((day, idx) => {
                                    const statusBadgeStyles = {
                                        present: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
                                        late:    'bg-amber-50 text-amber-600 border border-amber-100',
                                        absent:  'bg-rose-50 text-rose-600 border border-rose-100',
                                        leave:   'bg-purple-50 text-purple-600 border border-purple-100',
                                        weekend: 'bg-slate-100 text-slate-400 border border-slate-200',
                                        pending: 'bg-slate-50 text-slate-400 border border-slate-100',
                                    };

                                    return (
                                        <tr
                                            key={day.dateStr}
                                            className={`hover:bg-slate-50/50 transition-colors border-b border-slate-100 text-[10px] lg:text-[11px] font-bold text-table-cell uppercase ${
                                                day.isSunday ? 'bg-slate-50/50' : ''
                                            }`}
                                        >
                                            <td className="px-4 py-3 border-r border-slate-100 text-center w-[60px] text-slate-400">
                                                {idx + 1}
                                            </td>

                                            <td className="px-4 py-3 border-r border-slate-100 w-[120px] font-bold text-slate-700">
                                                {day.formattedDate}
                                            </td>

                                            <td className={`px-4 py-3 border-r border-slate-100 w-[100px] font-black ${day.isSunday ? 'text-rose-500' : 'text-slate-500'}`}>
                                                {day.dayName}
                                            </td>

                                            <td className="px-4 py-3 border-r border-slate-100 text-center w-[120px]">
                                                <span className={`text-[8px] font-black uppercase tracking-[0.15em] px-2 py-1 rounded-full ${statusBadgeStyles[day.effectiveStatus] || statusBadgeStyles.pending}`}>
                                                    {day.effectiveStatus === 'weekend' ? 'Weekend' : day.effectiveStatus === 'pending' ? 'Not Marked' : day.effectiveStatus}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3 border-r border-slate-100 text-center w-[100px] text-slate-600">
                                                {day.record?.check_in_time ? (
                                                    <span className="flex items-center justify-center gap-1">
                                                        <Clock size={11} className="text-slate-400" />
                                                        {day.record.check_in_time.slice(0, 5)}
                                                    </span>
                                                ) : '—'}
                                            </td>

                                            <td className="px-4 py-3 border-r border-slate-100 text-center w-[100px] text-slate-600">
                                                {day.record?.check_out_time ? (
                                                    <span className="flex items-center justify-center gap-1">
                                                        <Clock size={11} className="text-slate-400" />
                                                        {day.record.check_out_time.slice(0, 5)}
                                                    </span>
                                                ) : '—'}
                                            </td>

                                            <td className="px-4 py-3 border-r border-slate-100 text-center w-[130px] font-black text-indigo-600">
                                                {day.hoursStr}
                                            </td>

                                            <td className="px-4 py-3 text-slate-500 truncate max-w-[250px] normal-case">
                                                {day.record?.remarks ? (
                                                    <span>{day.record.remarks}</span>
                                                ) : day.isSunday ? (
                                                    <span className="text-slate-300 font-bold uppercase text-[9px] tracking-widest">Sunday Recess</span>
                                                ) : (
                                                    <span className="text-slate-300 font-medium">No recorded logs</span>
                                                )}
                                                {day.record?.self_punch_in && (
                                                    <span className="ml-2 inline-flex items-center text-[7px] font-black tracking-widest uppercase bg-indigo-50 text-indigo-600 border border-indigo-100 px-1 py-0.5 rounded">
                                                        Punch Log ({day.record.punch_in_method || 'Mobile'})
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StaffAttendanceReport;
