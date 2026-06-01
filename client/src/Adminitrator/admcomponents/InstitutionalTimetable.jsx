import React from 'react';
import { Clock, CalendarDays, User, BookOpen, Plus } from 'lucide-react';

/**
 * InstitutionalTimetable - A high-fidelity grid component for displaying weekly schedules.
 * Synchronized for Admin, Teacher, and Student Ledger Standards.
 */
const InstitutionalTimetable = ({
    data = [],
    onSlotClick = () => { },
    readOnly = true,
    dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    forcedPeriods = null,
    periodTimings = null,
    printTitle = "TIME TABLE",
    printSubTitle = ""
}) => {

    const periods = forcedPeriods || Array.from(new Set(data.map(slot => slot.period_number))).sort((a, b) => {
        const romanMap = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10 };
        const aVal = romanMap[a?.toString()?.toUpperCase()] || parseInt(a);
        const bVal = romanMap[b?.toString()?.toUpperCase()] || parseInt(b);
        return aVal - bVal;
    });

    const getRowTime = (p) => {
        if (periodTimings && periodTimings[p]) return periodTimings[p];
        const slot = data.find(s => s.period_number?.toString() === p?.toString());
        if (slot) return { start: slot.start_time, end: slot.end_time };
        return { start: null, end: null };
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return "--:--";
        const parts = timeStr.split(':');
        if (parts.length < 2) return timeStr;

        let hours = parseInt(parts[0]);
        const minutes = parts[1];
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${hours}:${minutes} ${ampm}`;
    };

    return (
        <div className="bg-white border border-black shadow-sm overflow-hidden LedgerMatrix">
            <style>
                {`
                @media print {
                    @page { 
                        size: landscape; 
                        margin: 0.5cm; 
                    }
                    
                    /* Reset body print base */
                    html, body {
                        background-color: white !important;
                        background: white !important;
                        color: black !important;
                    }
                    
                    /* Bulletproof visibility toggle: hide everything on body, show only timetable */
                    body * {
                        visibility: hidden !important;
                    }
                    
                    .LedgerMatrix, .LedgerMatrix * {
                        visibility: visible !important;
                    }
                    
                    /* Position LedgerMatrix layout for printing */
                    .LedgerMatrix { 
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        border: 2px solid black !important;
                        background-color: white !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    
                    .LedgerMatrix table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                        background-color: white !important;
                    }
                    
                    .LedgerMatrix th { 
                        background-color: #D1D5DB !important; 
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        border: 1px solid black !important; 
                        color: black !important; 
                        font-weight: 900 !important;
                        padding: 6px 4px !important;
                    }
                    
                    .LedgerMatrix td { 
                        border: 1px solid black !important; 
                        color: black !important; 
                        background-color: white !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        padding: 6px 4px !important;
                    }
                    
                    /* Highlight break rows correctly */
                    .BreakRow, .BreakRow td { 
                        background-color: #64748b !important; 
                        color: white !important; 
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    
                    .print-header { 
                        display: block !important; 
                        background-color: white !important;
                        border-bottom: 2px solid black !important;
                        margin-bottom: 12px !important;
                        padding: 10px 0 !important;
                    }
                    
                    .print-header h1 {
                        color: black !important;
                        background-color: white !important;
                    }
                    
                    .print-header span, .print-header div {
                        color: black !important;
                        background-color: white !important;
                    }
                }
                .print-header { display: none; }
                `}
            </style>

            {/* High-Fidelity Print Only Header (Matches provided Ledger photos) */}
            <div className="print-header p-4 border-b-2 border-black mb-1">
                <h1 className="text-center text-3xl font-black uppercase tracking-[0.3em] text-[#001736] mb-4">{printTitle}</h1>
                <div className="flex justify-between items-center px-2">
                    <span className="text-sm font-black uppercase tracking-widest">{printSubTitle}</span>
                    <div className="text-right">
                        
                        <span className="text-[10px] font-black text-slate-400 block uppercase tracking-tighter decoration-slate-200">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-[#D1D5DB] border-b border-black">
                            <th className="px-3 py-2 border-r border-black text-[10px] font-black text-center w-28 uppercase tracking-widest text-[#001736]">Time</th>
                            <th className="px-3 py-2 border-r border-black text-[10px] font-black text-center w-16 uppercase tracking-widest text-[#001736]">Periods</th>
                            {dayOrder.map(day => (
                                <th key={day} className="px-3 py-2 border-r border-black text-[10px] font-black text-center uppercase tracking-widest text-[#001736]">
                                    {day.slice(0, 3)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {periods.length === 0 ? (
                            <tr>
                                <td colSpan={dayOrder.length + 2} className="px-8 py-12 text-center text-slate-400 font-bold italic">
                                    No schedule assignments registered.
                                </td>
                            </tr>
                        ) : (
                            periods.map((p) => {
                                const timeRange = getRowTime(p);
                                const isFixedBreak = ['ASSEMBLY', 'SHORT_RECESS', 'LONG_RECESS', 'RECESS', 'BREAK'].includes(p.toString().toUpperCase());
                                const isDataBreak = data.some(s => s.period_number?.toString() === p?.toString() && s.is_break);
                                const isGlobalBreak = isFixedBreak || isDataBreak;

                                const breakLabel = isFixedBreak ? p.toString().replace('_', ' ') :
                                    (data.find(s => s.period_number?.toString() === p?.toString() && s.is_break)?.break_label || "RECESS");

                                if (isGlobalBreak) {
                                    return (
                                        <tr key={p} className="BreakRow bg-[#64748b] text-white">
                                            <td className="px-3 py-2 border-r border-b border-black text-[9px] font-black text-center font-mono">
                                                {formatTime(timeRange?.start)} to {formatTime(timeRange?.end)}
                                            </td>
                                            <td colSpan={dayOrder.length + 1} className="px-3 py-2 border-b border-black text-center text-[11px] font-black uppercase tracking-[0.4em]">
                                                {breakLabel}
                                            </td>
                                        </tr>
                                    );
                                }

                                return (
                                    <tr key={p} className="bg-white hover:bg-slate-50 transition-all select-none">
                                        <td className="px-3 py-3 border-r border-b border-black text-[9px] font-black text-center font-mono text-[#001736]">
                                            {formatTime(timeRange?.start)} to {formatTime(timeRange?.end)}
                                        </td>
                                        <td className="px-3 py-3 border-r border-b border-black text-[11px] font-black text-center bg-slate-50/50 text-[#001736]">
                                            {p}
                                        </td>
                                        {dayOrder.map(day => {
                                            const slot = data.find(s => {
                                                const sPeriod = s.period_number?.toString().trim().toUpperCase();
                                                const pPeriod = p?.toString().trim().toUpperCase();
                                                const sDay = s.day_of_week?.toString().trim().toLowerCase();
                                                const pDay = day?.toString().trim().toLowerCase();
                                                return sPeriod === pPeriod && sDay === pDay;
                                            });
                                            return (
                                                <td
                                                    key={day}
                                                    className={`px-3 py-3 border-r border-b border-black text-center align-middle transition-colors ${!readOnly ? 'cursor-pointer hover:bg-slate-100' : ''}`}
                                                    onClick={() => !readOnly && onSlotClick(day, p, slot)}
                                                >
                                                    {slot ? (
                                                        <div className="flex flex-col items-center justify-center min-h-[40px]">
                                                            <span className="text-[10px] font-black text-[#001736] uppercase tracking-tighter leading-tight mb-1">{slot.subject_name}</span>
                                                            {slot.teacher_name && (
                                                                <span className="text-[9px] font-bold text-slate-500 leading-none flex items-center gap-1">
                                                                    <User className="w-2 h-2 opacity-50" /> {slot.teacher_name}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        !readOnly ? (
                                                            <div className="group/plus flex items-center justify-center min-h-[40px]">
                                                                <Plus className="w-4 h-4 text-slate-200 group-hover/plus:text-black transition-colors" />
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-200 font-bold">-</span>
                                                        )
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <div className="p-2 bg-slate-50 flex justify-between items-center text-[8px] font-black text-slate-400 uppercase tracking-widest border-t border-black print:hidden">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> SUBJECT MATRIX</span>
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> FACULTY ASSIGNMENT</span>
                </div>
                <span>AUDIT READY Ledger Matrix &middot; {new Date().toLocaleDateString('en-GB')}</span>
            </div>
        </div>
    );
};

export default InstitutionalTimetable;

