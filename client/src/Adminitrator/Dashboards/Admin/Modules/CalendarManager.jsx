import React, { useState, useEffect, useCallback } from 'react';
import {
    Calendar as CalendarIcon, Plus, RefreshCw, Edit2, Trash2, X, Printer,
    ChevronLeft, ChevronRight, Eye, Table, Layout, AlertCircle, FileText, CheckCircle, Check,
    Download
} from 'lucide-react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { useAuth } from '../../../../context/AuthContext';
import { useAcademicYear } from '../../../../context/AcademicYearContext';
import * as CalendarAPI from '../../../../services/calendarAPI';
import * as AcademicYearAPI from '../../../../services/academicYearAPI';
import * as XLSX from 'xlsx';
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import DataTable from '../../../admcomponents/DataTable';

const MONTHS_LIST = [
    { name: 'January', val: 0 },
    { name: 'February', val: 1 },
    { name: 'March', val: 2 },
    { name: 'April', val: 3 },
    { name: 'May', val: 4 },
    { name: 'June', val: 5 },
    { name: 'July', val: 6 },
    { name: 'August', val: 7 },
    { name: 'September', val: 8 },
    { name: 'October', val: 9 },
    { name: 'November', val: 10 },
    { name: 'December', val: 11 }
];

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const formatDateString = (dateStr) => {
    if (!dateStr) return '';
    const cleanDateStr = dateStr.split('T')[0];
    const parts = cleanDateStr.split('-');
    if (parts.length < 3) return dateStr;
    const y = parts[0];
    const m = parseInt(parts[1], 10);
    const d = parts[2];
    const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return `${d} ${monthNames[m - 1]} ${y}`;
};

const getMonthNameFromDateString = (dateStr) => {
    if (!dateStr) return '';
    const cleanDateStr = dateStr.split('T')[0];
    const parts = cleanDateStr.split('-');
    if (parts.length < 2) return '';
    const m = parseInt(parts[1], 10);
    const fullMonths = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return fullMonths[m - 1] || '';
};

const normalizeDateStr = (dateInput) => {
    if (!dateInput) return '';
    let dateStr = '';
    if (typeof dateInput === 'string') {
        dateStr = dateInput.split('T')[0];
    } else if (dateInput instanceof Date) {
        const y = dateInput.getFullYear();
        const m = String(dateInput.getMonth() + 1).padStart(2, '0');
        const d = String(dateInput.getDate()).padStart(2, '0');
        dateStr = `${y}-${m}-${d}`;
    }
    if (dateStr && dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        }
    }
    return dateStr;
};


const CalendarManager = ({ toggleSidebar }) => {
    const { isAdmin, isPrincipal } = useAuth();
    const { selectedYear: globalYear, changeYear } = useAcademicYear();
    const hasWritePermission = isAdmin() || isPrincipal();

    const [events, setEvents] = useState([]);
    const [academicYears, setAcademicYears] = useState([]);
    const [selectedYearId, setSelectedYearId] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('grid'); // 'grid' or 'spreadsheet'
    const [isPrintMode, setIsPrintMode] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Interactive Legend Filters (toggled by clicking the legend indicators)
    const [activeFilters, setActiveFilters] = useState(['academic']);

    // Current displayed month & year in grid view
    const [currentMonth, setCurrentMonth] = useState(5); // June default
    const [currentYear, setCurrentYear] = useState(2025); // 2025 default

    // Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);

    // Form inputs
    const [formData, setFormData] = useState({
        academic_year_id: '',
        event_type: 'academic',
        title: '',
        description: '',
        event_date: '',
        subject: '',
        remarks: ''
    });

    // Fetch Academic Years and Events
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const yearsData = await AcademicYearAPI.getAllAcademicYears();
            setAcademicYears(yearsData || []);

            // Set active year or default to latest
            const activeYear = (yearsData || []).find(y => y.is_active);
            if (activeYear) {
                setSelectedYearId(String(activeYear.id));
            } else if (yearsData && yearsData.length > 0) {
                setSelectedYearId(String(yearsData[0].id));
            }

            const eventsData = await CalendarAPI.getAllCalendarEvents();
            setEvents(eventsData || []);
        } catch (error) {
            console.error("Fetch Data Error:", error);
            toast.error("Failed to fetch calendar information");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Keep local selectedYearId in sync with the global header academic year filter
    useEffect(() => {
        if (globalYear?.id) {
            setSelectedYearId(String(globalYear.id));
        }
    }, [globalYear?.id]);

    // Automatically sync the Grid view year with the selected year filter session range
    useEffect(() => {
        if (selectedYearId && academicYears.length > 0) {
            const selectedYear = academicYears.find(y => String(y.id) === String(selectedYearId));
            if (selectedYear && selectedYear.year_name) {
                const parts = selectedYear.year_name.split('-');
                const startYear = parseInt(parts[0]);
                if (!isNaN(startYear)) {
                    // 2025-26 academic year spans June 2025 to May 2026.
                    // If currentMonth is June-Dec (>=5), it falls in startYear.
                    // If currentMonth is Jan-May (<5), it falls in startYear + 1.
                    setCurrentYear(currentMonth >= 5 ? startYear : startYear + 1);
                }
            }
        }
    }, [selectedYearId, academicYears, currentMonth]);

    const handleToggleFilter = (type) => {
        setActiveFilters([type]);
        setCurrentPage(1);
    };

    // Auto-discover the matching academic year ID based on date selected
    const findMatchingYearId = (dateStr) => {
        if (!dateStr || academicYears.length === 0) return selectedYearId;
        const parts = dateStr.split('T')[0].split('-');
        if (parts.length < 3) return selectedYearId;
        const yearNum = parseInt(parts[0], 10);
        const monthNum = parseInt(parts[1], 10) - 1; // 0-indexed month
        // Academic year spans June (month index 5) to May next year.
        const sessionStartYear = monthNum >= 5 ? yearNum : yearNum - 1;
        const match = academicYears.find(y => y.year_name.startsWith(String(sessionStartYear)));
        return match ? String(match.id) : String(selectedYearId);
    };

    const handleOpenAddModal = (dateStr = '', defaultType = 'academic') => {
        const targetDate = dateStr || `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
        const matchingYearId = findMatchingYearId(targetDate);

        setFormData({
            academic_year_id: matchingYearId || selectedYearId,
            event_type: defaultType,
            title: '',
            description: '',
            event_date: targetDate,
            subject: '',
            remarks: ''
        });
        setShowAddModal(true);
    };

    const handleAddEvent = async (e) => {
        e.preventDefault();
        try {
            await CalendarAPI.addCalendarEvent(formData);
            toast.success("Calendar event registered successfully");
            setShowAddModal(false);
            const eventsData = await CalendarAPI.getAllCalendarEvents();
            setEvents(eventsData || []);
        } catch (error) {
            console.error("Add Event Error:", error);
            toast.error(error.response?.data?.error || "Process failed");
        }
    };

    const handleOpenEditModal = (event) => {
        setEditingEvent(event);
        setFormData({
            academic_year_id: event.academic_year_id ? String(event.academic_year_id) : '',
            event_type: event.event_type,
            title: event.title,
            description: event.description || '',
            event_date: event.event_date ? event.event_date.split('T')[0] : '',
            subject: event.subject || '',
            remarks: event.remarks || ''
        });
        setShowEditModal(true);
    };

    const handleUpdateEvent = async (e) => {
        e.preventDefault();
        try {
            await CalendarAPI.updateCalendarEvent(editingEvent.id, formData);
            toast.success("Calendar event updated successfully");
            setShowEditModal(false);
            const eventsData = await CalendarAPI.getAllCalendarEvents();
            setEvents(eventsData || []);
        } catch (error) {
            console.error("Update Event Error:", error);
            toast.error(error.response?.data?.error || "Process failed");
        }
    };

    const handleDeleteEvent = async (id) => {
        const result = await Swal.fire({
            title: 'Delete Event',
            text: "Are you sure you want to permanently delete this calendar event?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#001736',
            cancelButtonColor: '#ef4444',
            confirmButtonText: 'DELETE EVENT'
        });

        if (result.isConfirmed) {
            try {
                await CalendarAPI.deleteCalendarEvent(id);
                toast.success("Event removed from registry");
                const eventsData = await CalendarAPI.getAllCalendarEvents();
                setEvents(eventsData || []);
            } catch (error) {
                console.error("Delete Event Error:", error);
                toast.error(error.response?.data?.error || "Delete failed");
            }
        }
    };

    // Calendar Generation Logic (Monday - Sunday Grid)
    const getCalendarDays = () => {
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const firstDayIdx = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday, 1 is Mon, 6 is Sat

        // Map standard JS day indices to Monday start indices (0 = Mon, ..., 6 = Sun)
        const monStartIdx = firstDayIdx === 0 ? 6 : firstDayIdx - 1;

        const calendarDays = [];

        // Insert empty buffer spaces before first day
        for (let i = 0; i < monStartIdx; i++) {
            calendarDays.push({ isEmpty: true, key: `empty-${i}` });
        }

        // Insert actual month days
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            calendarDays.push({
                isEmpty: false,
                day,
                dateStr,
                key: dateStr
            });
        }

        // Fill remaining spaces in row (total grid slots multiple of 7, maximum 6 rows * 7 = 42)
        const totalSlots = Math.ceil(calendarDays.length / 7) * 7;
        const fillSlots = totalSlots - calendarDays.length;
        for (let i = 0; i < fillSlots; i++) {
            calendarDays.push({ isEmpty: true, key: `fill-${i}` });
        }

        return calendarDays;
    };

    // Navigation for calendar month
    const handlePrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(prev => prev - 1);
        } else {
            setCurrentMonth(prev => prev - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(prev => prev + 1);
        } else {
            setCurrentMonth(prev => prev + 1);
        }
    };

    // Group spreadsheet items by month and filter by active filters
    const getSpreadsheetEvents = () => {
        return events.filter(e => {
            if (selectedYearId && String(e.academic_year_id) !== String(selectedYearId)) return false;
            return activeFilters.includes(e.event_type);
        });
    };

    const exportToExcel = () => {
        const list = getSpreadsheetEvents();
        const dataToExport = list.map((row, i) => ({
            "Sr. No.": (i + 1).toString().padStart(2, '0'),
            "Month": getMonthNameFromDateString(row.event_date),
            "Subject": row.subject || 'GENERAL',
            "Date": formatDateString(row.event_date),
            "Activity Description": row.title,
            "Remarks/Details": row.remarks || row.description || 'N/A'
        }));
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Calendar Events");
        XLSX.writeFile(workbook, `Calendar_Events_${globalYear?.year_name || 'All'}.xlsx`);
    };

    // Handle Printing
    const handlePrint = () => {
        window.print();
    };

    if (isPrintMode) {
        const activeYear = academicYears.find(y => String(y.id) === String(selectedYearId));

        if (activeTab === 'spreadsheet') {
            return (
                <div className="print-wrapper bg-white text-black p-8 min-h-screen text-left relative font-sans leading-normal">
                    {/* Print Control Header */}
                    <div className="no-print flex justify-between items-center bg-slate-100 p-4 rounded-md border border-slate-300 mb-8">
                        <div className="flex items-center gap-3">
                            <Printer className="text-[#001736] w-6 h-6" />
                            <span className="text-sm font-bold uppercase tracking-widest text-[#001736]">Spreadsheet Print View</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handlePrint}
                                className="bg-[#001736] text-white px-6 py-2.5 rounded-md font-bold text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2"
                            >
                                <Printer size={14} /> Send to Printer
                            </button>
                            <button
                                onClick={() => setIsPrintMode(false)}
                                className="bg-white border border-slate-300 text-slate-700 px-6 py-2.5 rounded-md font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                            >
                                Close Preview
                            </button>
                        </div>
                    </div>

                    {/* Printable Document Core */}
                    <div id="print-area" className="w-full max-w-[850px] mx-auto p-4 bg-white">
                        <div className="text-center mb-8 border-b-2 border-black pb-4">
                            <h1 className="text-3xl font-bold uppercase tracking-tight text-black">NEW GRACE ACADEMY</h1>
                            <h2 className="text-2xl font-bold uppercase tracking-wide text-black mt-1">
                                ANNUAL EVENT REGISTRY LOG
                            </h2>
                            <h3 className="text-xl font-bold text-slate-800 mt-2">{activeYear ? activeYear.year_name : '2025-2026'}</h3>
                        </div>

                        <table className="w-full border-collapse border border-black text-xs">
                            <thead>
                                <tr className="bg-slate-100">
                                    <th className="border border-black px-4 py-3 font-black text-center text-sm w-16">SR. NO.</th>
                                    <th className="border border-black px-4 py-3 font-black text-left text-sm w-32">MONTH</th>
                                    <th className="border border-black px-4 py-3 font-black text-left text-sm w-40">DATE</th>
                                    <th className="border border-black px-4 py-3 font-black text-left text-sm">DESCRIPTION</th>
                                </tr>
                            </thead>
                            <tbody>
                                {spreadsheetEvents.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="border border-black px-6 py-12 text-center text-slate-400 font-bold uppercase tracking-widest">
                                            No events discovered in this selected configuration.
                                        </td>
                                    </tr>
                                ) : (
                                    spreadsheetEvents.map((row, i) => {
                                        const monthStr = getMonthNameFromDateString(row.event_date);
                                        const dateDisplayStr = formatDateString(row.event_date);
                                        return (
                                            <tr key={row.id} className="h-10">
                                                <td className="border border-black px-4 py-2 text-center font-bold text-slate-700 bg-slate-50/10">
                                                    {(i + 1).toString().padStart(2, '0')}
                                                </td>
                                                <td className="border border-black px-4 py-2 uppercase font-black tracking-wider text-slate-700">
                                                    {monthStr}
                                                </td>
                                                <td className="border border-black px-4 py-2 text-slate-600 font-black">
                                                    {dateDisplayStr}
                                                </td>
                                                <td className="border border-black px-4 py-2 text-sm tracking-tight font-bold text-black">
                                                    {row.title}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>

                        {/* Signatures Footer Section */}
                        <div className="mt-14 flex justify-between items-end px-6 pt-10">
                            <div className="text-center flex flex-col items-center">
                                <div className="w-40 border-b border-black mb-2 relative h-10"></div>
                                <span className="text-[10px] font-black uppercase text-black">President</span>
                                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-1">Gauri Samajik Kalyankari Sanstha's</span>
                            </div>

                            <div className="text-center flex flex-col items-center">
                                <div className="w-40 border-b border-black mb-2 relative h-10"></div>
                                <span className="text-[10px] font-black uppercase text-black">Principal</span>
                                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-1">NEW GRACE ACADEMY</span>
                            </div>
                        </div>
                    </div>

                    {/* Print styles */}
                    <style>{`
                        @media print {
                            .no-print, aside, sidebar, nav, header, footer, .Toastify, button {
                                display: none !important;
                            }
                            body * {
                                visibility: hidden !important;
                            }
                            #print-area, #print-area * {
                                visibility: visible !important;
                            }
                            #print-area {
                                position: absolute !important;
                                left: 0 !important;
                                top: 0 !important;
                                width: 100% !important;
                                max-width: 100% !important;
                                margin: 0 !important;
                                padding: 0 !important;
                                border: none !important;
                                background-color: white !important;
                                color: black !important;
                                display: block !important;
                            }
                            html, body, #root, #root > div, main, main > div, .print-wrapper {
                                height: auto !important;
                                min-height: 0 !important;
                                overflow: visible !important;
                                position: static !important;
                            }
                            #print-area table {
                                border-collapse: collapse !important;
                                border: 2px solid black !important;
                                width: 100% !important;
                            }
                            #print-area th, #print-area td {
                                border: 2px solid black !important;
                                border-color: black !important;
                            }
                            @page {
                                size: A4 portrait;
                                margin: 10mm 15mm 10mm 15mm;
                            }
                        }
                    `}</style>
                </div>
            );
        }

        // Determine the start year of the academic year
        let startYear = currentYear;
        if (activeYear && activeYear.year_name) {
            const parts = activeYear.year_name.split('-');
            const parsed = parseInt(parts[0], 10);
            if (!isNaN(parsed)) {
                startYear = parsed;
            }
        }

        // Academic year spans June (month index 5) to May (month index 4) next year
        const academicMonths = [
            { name: 'June', val: 5, year: startYear },
            { name: 'July', val: 6, year: startYear },
            { name: 'August', val: 7, year: startYear },
            { name: 'September', val: 8, year: startYear },
            { name: 'October', val: 9, year: startYear },
            { name: 'November', val: 10, year: startYear },
            { name: 'December', val: 11, year: startYear },
            { name: 'January', val: 0, year: startYear + 1 },
            { name: 'February', val: 1, year: startYear + 1 },
            { name: 'March', val: 2, year: startYear + 1 },
            { name: 'April', val: 3, year: startYear + 1 },
            { name: 'May', val: 4, year: startYear + 1 }
        ];

        // Helper to get events for a specific month and year
        const getEventsForMonth = (mVal, mYear) => {
            return events.filter(e => {
                if (!e.event_date) return false;
                if (selectedYearId && String(e.academic_year_id) !== String(selectedYearId)) return false;
                if (!activeFilters.includes(e.event_type)) return false;

                const norm = normalizeDateStr(e.event_date);
                const parts = norm.split('-');
                if (parts.length === 3) {
                    const evYear = parseInt(parts[0], 10);
                    const evMonth = parseInt(parts[1], 10) - 1; // 0-indexed
                    return evMonth === mVal && evYear === mYear;
                }
                return false;
            });
        };

        // Filter academic months to those with events matching criteria
        let monthsToPrint = academicMonths.filter(m => getEventsForMonth(m.val, m.year).length > 0);

        // Fallback to current month if no events in any month
        if (monthsToPrint.length === 0) {
            monthsToPrint = [
                { name: MONTHS_LIST[currentMonth].name, val: currentMonth, year: currentYear }
            ];
        }

        // Helper to get days grid for a specific month & year
        const getDaysForMonthAndYear = (mVal, mYear) => {
            const daysInMonth = new Date(mYear, mVal + 1, 0).getDate();
            const firstDayIdx = new Date(mYear, mVal, 1).getDay(); // 0 = Sunday, 1 = Mon
            const monStartIdx = firstDayIdx === 0 ? 6 : firstDayIdx - 1;

            const calendarDays = [];

            for (let i = 0; i < monStartIdx; i++) {
                calendarDays.push({ isEmpty: true, key: `empty-${i}` });
            }

            for (let day = 1; day <= daysInMonth; day++) {
                const dateStr = `${mYear}-${String(mVal + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                calendarDays.push({
                    isEmpty: false,
                    day,
                    dateStr,
                    key: dateStr
                });
            }

            const totalSlots = Math.ceil(calendarDays.length / 7) * 7;
            const fillSlots = totalSlots - calendarDays.length;
            for (let i = 0; i < fillSlots; i++) {
                calendarDays.push({ isEmpty: true, key: `fill-${i}` });
            }
            return calendarDays;
        };

        return (
            <div className="print-wrapper bg-white text-black p-8 min-h-screen text-left relative font-sans leading-normal">
                {/* Print Control Header */}
                <div className="no-print flex justify-between items-center bg-slate-100 p-4 rounded-md border border-slate-300 mb-8">
                    <div className="flex items-center gap-3">
                        <Printer className="text-[#001736] w-6 h-6" />
                        <span className="text-sm font-bold uppercase tracking-widest text-[#001736]">Document Print View</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handlePrint}
                            className="bg-[#001736] text-white px-6 py-2.5 rounded-md font-bold text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2"
                        >
                            <Printer size={14} /> Send to Printer
                        </button>
                        <button
                            onClick={() => setIsPrintMode(false)}
                            className="bg-white border border-slate-300 text-slate-700 px-6 py-2.5 rounded-md font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                        >
                            Close Preview
                        </button>
                    </div>
                </div>

                {/* Printable Document Core */}
                <div id="print-area" className="w-full flex flex-col gap-8 bg-white">
                    {monthsToPrint.map((month, idx) => {
                        const days = getDaysForMonthAndYear(month.val, month.year);
                        const isLast = idx === monthsToPrint.length - 1;

                        return (
                            <div
                                key={`${month.year}-${month.val}`}
                                className={`max-w-[850px] w-full mx-auto p-4 border border-black bg-white print-month-container ${!isLast ? 'print-page-break' : ''} mb-8`}
                            >
                                {/* Header Title */}
                                <div className="text-center mb-8 border-b border-black pb-4">
                                    <h1 className="text-3xl font-bold uppercase tracking-tight text-black">NEW GRACE ACADEMY ANNUAL</h1>
                                    <h2 className="text-2xl font-bold uppercase tracking-wide text-black mt-1">
                                        {activeFilters.includes('holiday') ? 'HOLIDAY CALENDAR' :
                                            activeFilters.includes('activity') ? 'ACTIVITY CALENDAR' :
                                                'ACADEMIC CALENDAR'}
                                    </h2>
                                    <h3 className="text-xl font-bold text-slate-800 mt-2">{activeYear ? activeYear.year_name : '2025-2026'}</h3>
                                </div>

                                {/* Current Month Name */}
                                <div className="text-center mb-4">
                                    <h4 className="text-2xl font-bold uppercase tracking-widest border-b border-black/10 inline-block px-10 pb-2">
                                        {month.name} {month.year}
                                    </h4>
                                </div>

                                {/* Standard Mon-Sun Grid Table */}
                                <table className="w-full border-collapse border border-black text-xs">
                                    <thead>
                                        <tr>
                                            {WEEK_DAYS.map(day => (
                                                <th key={day} className="border border-black py-3 bg-slate-50 font-black text-center text-sm w-[14.28%]">
                                                    {day}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Array.from({ length: days.length / 7 }).map((_, rowIndex) => (
                                            <tr key={rowIndex} className="h-28">
                                                {days.slice(rowIndex * 7, (rowIndex + 1) * 7).map(cell => {
                                                    if (cell.isEmpty) {
                                                        return <td key={cell.key} className="border border-black bg-slate-50/50"></td>;
                                                    }

                                                    // Fetch events for this specific cell date
                                                    const cellEvents = events.filter(e => {
                                                        if (!e.event_date) return false;
                                                        return normalizeDateStr(e.event_date) === normalizeDateStr(cell.dateStr) && activeFilters.includes(e.event_type);
                                                    });

                                                    return (
                                                        <td key={cell.key} className="border border-black p-2 align-top relative font-medium group">
                                                            <span className="text-sm font-black absolute top-1.5 left-2">{cell.day}</span>
                                                            <div className="mt-6 space-y-1.5 text-[9px] leading-tight">
                                                                {cellEvents.map(ev => {
                                                                    const colorClass = ev.event_type === 'holiday' ? 'font-bold text-rose-600' :
                                                                        ev.event_type === 'activity' ? 'text-amber-700' : 'text-indigo-800 font-bold';
                                                                    return (
                                                                        <div key={ev.id} className={`${colorClass} tracking-tight wrap-break-word whitespace-normal text-left`}>
                                                                            • {ev.title}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Signatures Footer Section */}
                                <div className="mt-14 flex justify-between items-end px-6 pt-10">
                                    <div className="text-center flex flex-col items-center">
                                        <div className="w-40 border-b border-black mb-2 relative h-10">
                                        </div>
                                        <span className="text-[10px] font-black uppercase text-black">President</span>
                                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-1">Gauri Samajik Kalyankari Sanstha's</span>
                                    </div>

                                    <div className="text-center flex flex-col items-center">
                                        <div className="w-40 border-b border-black mb-2 relative h-10">
                                        </div>
                                        <span className="text-[10px] font-black uppercase text-black">Principal</span>
                                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-1">NEW GRACE ACADEMY</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Print media specific styles */}
                <style>{`
                    @media print {
                        /* 1. Hide all non-printable UI panels */
                        .no-print,
                        aside,
                        sidebar,
                        nav,
                        header,
                        footer,
                        .Toastify,
                        button {
                            display: none !important;
                        }

                        /* 2. Hide everything else from view visually */
                        body * {
                            visibility: hidden !important;
                        }

                        /* 3. Explicitly show the print area and its complete internal hierarchy */
                        #print-area,
                        #print-area * {
                            visibility: visible !important;
                        }

                        /* 4. Position the print area absolutely at the top left of the printed document */
                        #print-area {
                            position: absolute !important;
                            left: 0 !important;
                            top: 0 !important;
                            width: 100% !important;
                            max-width: 100% !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            border: none !important;
                            background-color: white !important;
                            color: black !important;
                            display: block !important;
                        }

                        /* 5. Reset heights & overflows strictly on macro-level ancestors to prevent viewport clipping */
                        html,
                        body,
                        #root,
                        #root > div,
                        main,
                        main > div,
                        .print-wrapper,
                        .h-screen,
                        .h-full,
                        .overflow-hidden,
                        .overflow-y-auto,
                        .overflow-x-hidden {
                            height: auto !important;
                            min-height: 0 !important;
                            max-height: none !important;
                            overflow: visible !important;
                            position: static !important;
                            box-shadow: none !important;
                            transform: none !important;
                            animation: none !important;
                        }

                        html,
                        body {
                            background-color: white !important;
                            background: white !important;
                            color: black !important;
                        }

                        /* 6. Month layout print page break styling */
                        .print-month-container {
                            border: none !important; /* Eliminate outer div border in print to prevent double border! */
                            padding: 0 !important;
                            margin: 0 auto !important;
                            box-sizing: border-box !important;
                            page-break-inside: avoid !important;
                            height: 92vh !important; /* Force month + signatures to stay on exactly one A4 page without blank page */
                            max-height: 92vh !important;
                        }

                        .print-page-break {
                            page-break-after: always !important;
                            break-after: page !important;
                            margin-bottom: 0 !important;
                            background-color: white !important;
                            background: white !important;
                        }

                        /* Make print grid row height compact so it never overflows to next page */
                        #print-area table tbody tr {
                            height: 5rem !important;
                        }

                        /* Crisp, solid single black borders */
                        #print-area table {
                            border-collapse: collapse !important;
                            border: 1px solid black !important;
                            width: 100% !important;
                            margin-bottom: 1rem !important;
                        }

                        #print-area th, #print-area td {
                            border: 1px solid black !important;
                            border-color: black !important;
                        }

                        /* 7. Force calendar contents inside print-area to have white backgrounds and sharp black text */
                        #print-area,
                        #print-area div,
                        #print-area table,
                        #print-area span,
                        #print-area h1,
                        #print-area h2,
                        #print-area h3,
                        #print-area h4,
                        #print-area h5,
                        #print-area h6 {
                            background-color: white !important;
                            background: white !important;
                            color: black !important;
                            border-color: black !important;
                            box-shadow: none !important;
                            text-shadow: none !important;
                        }

                        /* 8. Preserve high-contrast colors for specific categories inside print area */
                        #print-area .text-rose-600,
                        #print-area .text-rose-700 {
                            color: #dc2626 !important;
                        }
                        #print-area .text-amber-700,
                        #print-area .text-amber-800 {
                            color: #b45309 !important;
                        }
                        #print-area .text-indigo-800,
                        #print-area .text-indigo-700 {
                            color: #3730a3 !important;
                        }

                        /* 9. Setup margin and layout settings */
                        @page {
                            size: A4 portrait;
                            margin: 10mm 15mm 10mm 15mm;
                        }
                    }
                `}</style>
            </div>
        );
    }

    const calendarDays = getCalendarDays();
    const spreadsheetEvents = getSpreadsheetEvents();
    const totalPages = Math.ceil(spreadsheetEvents.length / itemsPerPage);
    const paginatedEvents = spreadsheetEvents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="p-4 lg:p-8 bg-[#F8FAFC] min-h-screen font-sans text-left">
            {/* Unified Module Header */}
            <ModuleHeader
                title="Calendar Manager"
                subTitle="Academic Calendars, Activity Matrices & Holidays Configuration"
                icon={CalendarIcon}
                badge={`EVENTS: ${events.length}`}
                toggleSidebar={toggleSidebar}
                showSearch={false}
                hideDesktopSearch={true}
            >
                <div className="flex items-center gap-2">
                    {hasWritePermission && (
                        <button
                            onClick={() => handleOpenAddModal()}
                            className="bg-[#001736] hover:bg-black text-white px-4 py-3 lg:px-6 lg:py-3.5 rounded-md font-bold text-[10px] uppercase tracking-widest shadow-xl transition-all flex items-center gap-2 active:scale-95 shrink-0"
                        >
                            <Plus size={16} />
                            <span className="hidden sm:inline">NEW EVENT</span>
                        </button>
                    )}
                    <button
                        onClick={fetchData}
                        className="p-3 border border-slate-300 rounded-md text-[#001736] hover:bg-slate-50 bg-white transition-all shadow-sm active:rotate-180 duration-500 shrink-0"
                        title="Reload Archives"
                    >
                        <RefreshCw size={16} />
                    </button>
                    <button
                        onClick={() => setIsPrintMode(true)}
                        className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 p-3 rounded-md transition-all shadow-sm flex items-center gap-2 shrink-0"
                        title="Open Printable View"
                    >
                        <Printer size={16} />
                    </button>
                </div>
            </ModuleHeader>

            {/* Filters bar: High Responsive Styling */}
            <div className="mt-8 flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-6 bg-white border border-slate-300 p-6 rounded-xl shadow-sm">
                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-4">
                    {/* View Switcher Tabs */}
                    <div className="flex border border-slate-300 bg-slate-50 rounded-md p-1 shrink-0">
                        <button
                            onClick={() => setActiveTab('grid')}
                            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-bold text-[10px] uppercase tracking-widest transition-all ${activeTab === 'grid' ? 'bg-[#001736] text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            <Layout size={12} /> Monthly Grid
                        </button>
                        <button
                            onClick={() => setActiveTab('spreadsheet')}
                            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-bold text-[10px] uppercase tracking-widest transition-all ${activeTab === 'spreadsheet' ? 'bg-[#001736] text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            <Table size={12} /> Spreadsheet
                        </button>
                    </div>

                    {/* Academic Year Filter */}
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 px-4 py-1 rounded-md">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 shrink-0">YEAR:</span>
                        <select
                            value={selectedYearId ? String(selectedYearId) : ""}
                            onChange={(e) => {
                                const newId = e.target.value;
                                setSelectedYearId(newId);
                                setCurrentPage(1);
                                const foundYear = academicYears.find(y => String(y.id) === String(newId));
                                if (foundYear && changeYear) {
                                    changeYear(foundYear);
                                }
                            }}
                            className="bg-transparent font-bold text-[11px] text-[#001736] outline-none cursor-pointer uppercase tracking-wider py-1.5"
                        >
                            <option value="" className="text-[#001736]">All Academic Years</option>
                            {academicYears.map(y => (
                                <option key={y.id} value={String(y.id)} className="text-[#001736]">
                                    {y.year_name} {y.is_active ? '(ACTIVE)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Calendar Legend Indicators - Interactive Filter Checks */}
                <div className="flex flex-wrap items-center gap-3 text-[9px] font-black uppercase tracking-widest text-slate-500 bg-slate-50 border border-slate-300 p-3 rounded-md select-none">
                    <span className="text-slate-400 mr-1 text-[8px]">Filters:</span>
                    <button
                        onClick={() => handleToggleFilter('academic')}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border transition-all ${activeFilters.includes('academic') ? 'bg-indigo-50 border-indigo-300 text-indigo-800 font-black' : 'bg-white border-slate-200 text-slate-400'}`}
                    >
                        <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${activeFilters.includes('academic') ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-300'}`}>
                            {activeFilters.includes('academic') && <Check size={10} strokeWidth={4} />}
                        </div>
                        Academic
                    </button>
                    <button
                        onClick={() => handleToggleFilter('activity')}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border transition-all ${activeFilters.includes('activity') ? 'bg-amber-50 border-amber-300 text-amber-800 font-black' : 'bg-white border-slate-200 text-slate-400'}`}
                    >
                        <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${activeFilters.includes('activity') ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white border-slate-300'}`}>
                            {activeFilters.includes('activity') && <Check size={10} strokeWidth={4} />}
                        </div>
                        Activities
                    </button>
                    <button
                        onClick={() => handleToggleFilter('holiday')}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border transition-all ${activeFilters.includes('holiday') ? 'bg-rose-50 border-rose-300 text-rose-800 font-black' : 'bg-white border-slate-200 text-slate-400'}`}
                    >
                        <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${activeFilters.includes('holiday') ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white border-slate-300'}`}>
                            {activeFilters.includes('holiday') && <Check size={10} strokeWidth={4} />}
                        </div>
                        Holidays
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="bg-white p-24 rounded-xl text-center border border-slate-300 border-dashed mt-8">
                    <div className="w-10 h-10 border-4 border-[#001736]/20 border-t-[#001736] rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Loading Registry Matrix...</p>
                </div>
            ) : activeTab === 'grid' ? (
                /* === TAB 1: CALENDAR MONTHLY GRID === */
                <div className="mt-8 bg-white border border-slate-300 rounded-xl shadow-sm overflow-hidden animate-in fade-in duration-300">
                    {/* Calendar Month Navigator */}
                    <div className="flex justify-between items-center p-6 border-b border-slate-300 bg-slate-50/50">
                        <button
                            onClick={handlePrevMonth}
                            className="p-2.5 border border-slate-300 rounded-md hover:bg-slate-100 bg-white transition-all shadow-sm"
                            title="Previous Month"
                        >
                            <ChevronLeft size={16} className="text-slate-600" />
                        </button>
                        <h3 className="text-sm font-black uppercase tracking-widest text-[#001736] flex items-center gap-3">
                            <CalendarIcon className="text-amber-500 w-4 h-4" />
                            {MONTHS_LIST[currentMonth].name} {currentYear}
                        </h3>
                        <button
                            onClick={handleNextMonth}
                            className="p-2.5 border border-slate-300 rounded-md hover:bg-slate-100 bg-white transition-all shadow-sm"
                            title="Next Month"
                        >
                            <ChevronRight size={16} className="text-slate-600" />
                        </button>
                    </div>

                    {/* Calendar Grid Container */}
                    <div className="p-6 overflow-x-auto">
                        <div className="min-w-[800px] border border-slate-300 rounded-xl p-4 bg-slate-50/20">
                            {/* Grid Headers */}
                            <div className="grid grid-cols-7 gap-3 mb-3 text-center border-b border-slate-300 pb-3">
                                {WEEK_DAYS.map(day => (
                                    <div key={day} className="text-[10px] font-black uppercase tracking-widest text-slate-500 py-1">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Grid Days Cells */}
                            <div className="grid grid-cols-7 gap-3">
                                {calendarDays.map((cell) => {
                                    if (cell.isEmpty) {
                                        return (
                                            <div
                                                key={cell.key}
                                                className="bg-slate-100/50 border border-slate-300 border-dashed rounded-md h-36"
                                            />
                                        );
                                    }

                                    // Filter events matching cell date using the interactive legend states
                                    const cellEvents = events.filter(e => {
                                        if (!e.event_date) return false;
                                        return normalizeDateStr(e.event_date) === normalizeDateStr(cell.dateStr) && activeFilters.includes(e.event_type);
                                    });

                                    // Check if this date has a holiday
                                    const isHolidayCell = cellEvents.some(e => e.event_type === 'holiday');

                                    return (
                                        <div
                                            key={cell.key}
                                            className={`border border-slate-400 rounded-xl h-36 p-3 flex flex-col justify-between text-left group transition-all relative ${isHolidayCell ? 'bg-rose-50/30' : 'bg-white'
                                                } ${hasWritePermission
                                                    ? 'hover:border-indigo-500 hover:shadow-lg cursor-pointer'
                                                    : ''
                                                }`}
                                            onClick={() => {
                                                if (hasWritePermission) handleOpenAddModal(cell.dateStr);
                                            }}
                                            title={hasWritePermission ? `Click to add event to ${cell.dateStr}` : ""}
                                        >
                                            <span className={`text-[11px] font-black ${isHolidayCell ? 'text-rose-500' : 'text-slate-400'} group-hover:text-[#001736]`}>
                                                {cell.day}
                                            </span>

                                            {/* Micro Cards for Events inside cell */}
                                            <div className="flex-1 mt-2 overflow-y-auto space-y-1.5 scrollbar-thin">
                                                {cellEvents.map(ev => {
                                                    const styleMap = {
                                                        academic: 'bg-indigo-50 border-indigo-200 text-indigo-700',
                                                        activity: 'bg-amber-50 border-amber-200 text-amber-700',
                                                        holiday: 'bg-rose-50 border-rose-200 text-rose-700 font-bold'
                                                    };
                                                    const appliedStyle = styleMap[ev.event_type] || styleMap.academic;

                                                    return (
                                                        <div
                                                            key={ev.id}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (hasWritePermission) handleOpenEditModal(ev);
                                                            }}
                                                            className={`text-[9px] font-black uppercase tracking-tight px-2 py-1 border rounded-md transition-all hover:scale-[1.02] active:scale-95 flex flex-col justify-start items-start gap-1 ${appliedStyle}`}
                                                            title={`Click to edit: ${ev.title}`}
                                                        >
                                                            <span className="wrap-break-word whitespace-normal text-left block w-full">{ev.title}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* === TAB 2: EXCEL SPREADSHEET TABLE LOG === */
                <div className="mt-8 bg-white border border-slate-400 rounded-xl shadow-md overflow-hidden animate-in fade-in duration-300">
                    <div className="p-6 border-b border-slate-400 flex justify-between items-center bg-slate-50/50">
                        <h3 className="text-xs font-black hidden lg:flex uppercase tracking-widest text-[#001736] items-center gap-2">
                            <FileText className="text-[#FFB606]" size={16} /> Registry Log Data Grouped By Month
                        </h3>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={exportToExcel}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-md font-bold text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 active:scale-95 shadow-md border border-emerald-700"
                            >
                                <Download size={14} /> Export Excel
                            </button>
                            {hasWritePermission && (
                                <button
                                    onClick={() => handleOpenAddModal('', 'activity')}
                                    className="bg-[#001736] hover:bg-black text-white px-5 py-3 rounded-md font-bold text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 active:scale-95 shadow-md border border-slate-700"
                                >
                                    <Plus size={14} /> Add Activity
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto p-4">
                        <DataTable
                            headers={[
                                { label: 'SR.', className: 'w-16 text-center border-r border-black' },
                                { label: 'MONTH', className: 'w-32 border-r border-black' },
                                { label: 'SUBJECT', className: 'w-36 border-r border-black' },
                                { label: 'DATE', className: 'w-40 border-r border-black' },
                                { label: 'ACTIVITY DESCRIPTION', className: 'border-r border-black' },
                                { label: 'REMARKS/DETAILS', className: 'border-r border-black' },
                                ...(hasWritePermission ? [{ label: 'ACTIONS', className: 'text-center w-28' }] : [])
                            ]}
                            columnCount={hasWritePermission ? 7 : 6}
                            loading={loading}
                            emptyMessage="No events discovered in this selected configuration."
                            tableClassName="min-w-[900px] border border-black border-collapse text-xs"
                            footer={
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-institutional-muted">
                                        Showing <span className="text-institutional-main">{spreadsheetEvents.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="text-institutional-main">{Math.min(currentPage * itemsPerPage, spreadsheetEvents.length)}</span> of <span className="text-institutional-main">{spreadsheetEvents.length}</span> Entries
                                    </p>
                                    <div className="flex items-center gap-1 select-none">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="px-4 py-2 bg-white border border-table rounded text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                        >
                                            Prev
                                        </button>
                                        <div className="flex items-center gap-1 px-4">
                                            <span className="text-[10px] font-black text-institutional-main uppercase">
                                                Page {currentPage} of {totalPages || 1}
                                            </span>
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
                            {paginatedEvents.map((row, i) => {
                                const monthStr = getMonthNameFromDateString(row.event_date);
                                const dateDisplayStr = formatDateString(row.event_date);

                                const typeStyle = row.event_type === 'holiday' ? 'text-rose-600 font-bold' :
                                    row.event_type === 'activity' ? 'text-amber-700' : 'text-indigo-800 font-bold';

                                return (
                                    <tr
                                        key={row.id}
                                        className="border-b border-black hover:bg-slate-50/60 transition-all font-medium"
                                    >
                                        <td className="px-6 py-3.5 border-r border-black text-center font-bold text-slate-500 bg-slate-50/30">
                                            {((currentPage - 1) * itemsPerPage + i + 1).toString().padStart(2, '0')}
                                        </td>
                                        <td className="px-6 py-3.5 border-r border-black uppercase font-black tracking-wider text-slate-700">
                                            {monthStr}
                                        </td>
                                        <td className="px-6 py-3.5 border-r border-black uppercase font-black text-slate-600">
                                            {row.subject || 'GENERAL'}
                                        </td>
                                        <td className="px-6 py-3.5 border-r border-black text-slate-600 font-black">
                                            {dateDisplayStr}
                                        </td>
                                        <td className={`px-6 py-3.5 border-r border-black text-sm tracking-tight ${typeStyle}`}>
                                            {row.title}
                                        </td>
                                        <td className="px-6 py-3.5 border-r border-black text-slate-500 font-bold">
                                            {row.remarks || row.description || 'N/A'}
                                        </td>
                                        {hasWritePermission && (
                                            <td className="px-6 py-3.5 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        onClick={() => handleOpenEditModal(row)}
                                                        className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-[#001736] rounded border border-slate-300 hover:border-slate-400 transition-all shadow-sm"
                                                        title="Edit Log"
                                                    >
                                                        <Edit2 size={12} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteEvent(row.id)}
                                                        className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded border border-slate-200 hover:border-rose-300 transition-all shadow-sm"
                                                        title="Delete Log"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </DataTable>
                    </div>
                </div>
            )}

            {/* === ADD NEW EVENT MODAL: HIGH RESPONSIVE === */}
            {showAddModal && (
                <div className="fixed inset-0 bg-[#001736]/90 backdrop-blur-md z-120 flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-xl shadow-2xl border border-white/20 p-6 sm:p-10 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-8 sm:zoom-in duration-300 text-left">
                        <div className="flex justify-between items-center mb-8 border-b border-slate-200 pb-4">
                            <div>
                                <h2 className="text-lg font-black text-[#001736] uppercase tracking-tight flex items-center gap-2">
                                    <Plus className="text-amber-500" size={18} /> RECORD <span className="text-indigo-600">CALENDAR EVENT</span>
                                </h2>
                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mt-1.5">
                                    Date: {new Date(formData.event_date.replace(/-/g, '/')).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="p-2.5 hover:text-rose-500 hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded-md transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleAddEvent} className="space-y-5">
                            {/* Academic Year Selection */}
                            <div className="space-y-2">
                                <label className="text-[9px] font-bold uppercase ml-1 tracking-widest text-slate-400">Academic Year Context</label>
                                <select
                                    required
                                    value={formData.academic_year_id ? String(formData.academic_year_id) : ""}
                                    onChange={(e) => setFormData({ ...formData, academic_year_id: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-md font-bold text-[#001736] outline-none focus:bg-white focus:border-[#001736] transition-all uppercase text-xs"
                                >
                                    <option value="">Select Session</option>
                                    {academicYears.map(y => (
                                        <option key={y.id} value={String(y.id)}>{y.year_name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Row: Date & Event Type */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-bold uppercase ml-1 tracking-widest text-slate-400">Event Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.event_date}
                                        onChange={(e) => {
                                            const newDate = e.target.value;
                                            const matchingYearId = findMatchingYearId(newDate);
                                            setFormData({
                                                ...formData,
                                                event_date: newDate,
                                                academic_year_id: matchingYearId || formData.academic_year_id
                                            });
                                        }}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-md font-bold text-[#001736] outline-none focus:bg-white focus:border-[#001736] transition-all text-xs"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-bold uppercase ml-1 tracking-widest text-slate-400">Calendar Category</label>
                                    <select
                                        value={formData.event_type}
                                        onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-md font-bold text-[#001736] outline-none focus:bg-white focus:border-[#001736] transition-all text-xs uppercase"
                                    >
                                        <option value="academic">Academic Calendar</option>
                                        <option value="activity">Activities Calendar</option>
                                        <option value="holiday">Holidays Calendar</option>
                                    </select>
                                </div>
                            </div>

                            {/* Title / Description */}
                            <div className="space-y-2">
                                <label className="text-[9px] font-bold uppercase ml-1 tracking-widest text-slate-400">Event Title / Description</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="E.G. School Reopens for Students"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-300 rounded-md font-bold text-[#001736] outline-none focus:bg-white focus:border-[#001736] transition-all text-xs"
                                />
                            </div>

                            {/* Row: Subject & Remarks */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-bold uppercase ml-1 tracking-widest text-slate-400">Subject (E.G. ENGLISH/SST)</label>
                                    <input
                                        type="text"
                                        placeholder="Optional"
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value.toUpperCase() })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-md font-bold text-[#001736] outline-none focus:bg-white focus:border-[#001736] transition-all text-xs uppercase"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-bold uppercase ml-1 tracking-widest text-slate-400">Remarks / Event Details</label>
                                    <input
                                        type="text"
                                        placeholder="E.G. Unit test 1 / Activity"
                                        value={formData.remarks}
                                        onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-md font-bold text-[#001736] outline-none focus:bg-white focus:border-[#001736] transition-all text-xs"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-[#001736] hover:bg-black text-white py-4 rounded-md font-bold text-[10px] uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] mt-3"
                            >
                                <CheckCircle size={16} /> RECORD CALENDAR EVENT
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* === EDIT EVENT MODAL: HIGH RESPONSIVE === */}
            {showEditModal && (
                <div className="fixed inset-0 bg-[#001736]/90 backdrop-blur-md z-120 flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-xl shadow-2xl border border-white/20 p-6 sm:p-10 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-8 sm:zoom-in duration-300 text-left">
                        <div className="flex justify-between items-center mb-8 border-b border-slate-200 pb-4">
                            <div>
                                <h2 className="text-lg font-black text-[#001736] uppercase tracking-tight flex items-center gap-2">
                                    <Edit2 className="text-amber-500" size={18} /> EDIT <span className="text-indigo-600">CALENDAR EVENT</span>
                                </h2>
                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mt-1.5">
                                    Date: {new Date(formData.event_date.replace(/-/g, '/')).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="p-2.5 hover:text-rose-500 hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded-md transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateEvent} className="space-y-5">
                            {/* Academic Year Selection */}
                            <div className="space-y-2">
                                <label className="text-[9px] font-bold uppercase ml-1 tracking-widest text-slate-400">Academic Year Context</label>
                                <select
                                    required
                                    value={formData.academic_year_id ? String(formData.academic_year_id) : ""}
                                    onChange={(e) => setFormData({ ...formData, academic_year_id: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-md font-bold text-[#001736] outline-none focus:bg-white focus:border-[#001736] transition-all uppercase text-xs"
                                >
                                    <option value="">Select Session</option>
                                    {academicYears.map(y => (
                                        <option key={y.id} value={String(y.id)}>{y.year_name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Row: Date & Event Type */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-bold uppercase ml-1 tracking-widest text-slate-400">Event Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.event_date}
                                        onChange={(e) => {
                                            const newDate = e.target.value;
                                            const matchingYearId = findMatchingYearId(newDate);
                                            setFormData({
                                                ...formData,
                                                event_date: newDate,
                                                academic_year_id: matchingYearId || formData.academic_year_id
                                            });
                                        }}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-md font-bold text-[#001736] outline-none focus:bg-white focus:border-[#001736] transition-all text-xs"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-bold uppercase ml-1 tracking-widest text-slate-400">Calendar Category</label>
                                    <select
                                        value={formData.event_type}
                                        onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-md font-bold text-[#001736] outline-none focus:bg-white focus:border-[#001736] transition-all text-xs uppercase"
                                    >
                                        <option value="academic">Academic Calendar</option>
                                        <option value="activity">Activities Calendar</option>
                                        <option value="holiday">Holidays Calendar</option>
                                    </select>
                                </div>
                            </div>

                            {/* Title / Description */}
                            <div className="space-y-2">
                                <label className="text-[9px] font-bold uppercase ml-1 tracking-widest text-slate-400">Event Title / Description</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="E.G. School Reopens for Students"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-300 rounded-md font-bold text-[#001736] outline-none focus:bg-white focus:border-[#001736] transition-all text-xs"
                                />
                            </div>

                            {/* Row: Subject & Remarks */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-bold uppercase ml-1 tracking-widest text-slate-400">Subject (E.G. ENGLISH/SST)</label>
                                    <input
                                        type="text"
                                        placeholder="Optional"
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value.toUpperCase() })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-md font-bold text-[#001736] outline-none focus:bg-white focus:border-[#001736] transition-all text-xs uppercase"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-bold uppercase ml-1 tracking-widest text-slate-400">Remarks / Event Details</label>
                                    <input
                                        type="text"
                                        placeholder="E.G. Unit test 1 / Activity"
                                        value={formData.remarks}
                                        onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-md font-bold text-[#001736] outline-none focus:bg-white focus:border-[#001736] transition-all text-xs"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 pt-3">
                                <button
                                    type="submit"
                                    className="flex-1 bg-[#001736] hover:bg-black text-white py-4 rounded-md font-bold text-[10px] uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                                >
                                    <RefreshCw size={14} /> SAVE CHANGES
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDeleteEvent(editingEvent.id)}
                                    className="bg-rose-50 border border-rose-200 text-rose-600 py-4 px-6 rounded-md font-bold text-[10px] uppercase tracking-widest hover:bg-rose-100 hover:text-rose-700 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                                >
                                    <Trash2 size={14} /> Delete
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarManager;
