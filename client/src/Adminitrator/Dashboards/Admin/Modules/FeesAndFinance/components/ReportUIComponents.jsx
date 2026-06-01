import React from 'react';
import { 
    Download, FileSpreadsheet, FilePieChart, Filter, Calendar, Users, 
    Hash, ArrowRight, ChevronLeft, Search, Share2, ChevronDown,
    ChevronRight, CornerDownRight, SlidersHorizontal, AlertCircle
} from 'lucide-react';

/**
 * High-fidelity Stat Box for Financial Dashboards
 */
export const StatBox = ({ label, value, icon: icon, color = "text-indigo-600", trend }) => {
    const Icon = icon;
    
    // Theme mapping for consistency with StatusMetric
    const themeMap = {
        "text-slate-900": { border: "border-slate-900", bg: "bg-slate-50/50", iconBg: "bg-slate-900", text: "text-slate-900" },
        "text-emerald-600": { border: "border-emerald-600", bg: "bg-emerald-50/50", iconBg: "bg-emerald-600", text: "text-emerald-900" },
        "text-rose-600": { border: "border-rose-600", bg: "bg-rose-50/50", iconBg: "bg-rose-600", text: "text-rose-900" },
        "text-indigo-600": { border: "border-indigo-600", bg: "bg-indigo-50/50", iconBg: "bg-indigo-600", text: "text-indigo-900" },
        "text-amber-600": { border: "border-amber-600", bg: "bg-amber-50/50", iconBg: "bg-amber-600", text: "text-amber-900" },
        "text-blue-600": { border: "border-blue-600", bg: "bg-blue-50/50", iconBg: "bg-blue-600", text: "text-blue-900" },
    };
    
    const theme = themeMap[color] || themeMap["text-indigo-600"];

    return (
        <div className={`p-4 lg:p-6 rounded-2xl border-l-4 transition-all duration-300 group hover:shadow-xl flex items-center justify-between gap-4 shadow-sm overflow-hidden ${theme.border} ${theme.bg}`}>
            <div className="flex-1 min-w-0 overflow-hidden pointer-events-none">
                <p className={`text-[8px] lg:text-[10px] font-black uppercase tracking-widest leading-none mb-1 opacity-60 ${theme.text} line-clamp-1`}>{label}</p>
                <div className="flex items-center gap-2">
                    <h4 className={`text-lg lg:text-2xl font-black ${theme.text} tracking-tighter uppercase leading-tight line-clamp-1`}>{value}</h4>
                    {trend && (
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${trend.positive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                            {trend.positive ? '+' : '-'}{trend.value}%
                        </span>
                    )}
                </div>
            </div>
            <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl ${theme.iconBg} flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform border border-white/20 shrink-0`}>
                <Icon className="w-4 h-4 text-white" />
            </div>
        </div>
    );
};

/**
 * Shell for Report Filters
 */
export const ReportFilterShell = ({ children, onExportExcel, onExportPDF }) => (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col lg:flex-row items-center justify-between gap-6 mb-8">
        <div className="flex flex-wrap items-center gap-4 flex-1">
            <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-400">
                <Filter className="w-4 h-4" />
            </div>
            {children}
        </div>
        <div className="flex items-center gap-3 w-full lg:w-auto">
            <button 
                onClick={onExportExcel}
                className="flex-1 lg:flex-none px-6 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
            >
                <FileSpreadsheet className="w-4 h-4" /> Excel
            </button>
            <button 
                onClick={onExportPDF}
                className="flex-1 lg:flex-none px-6 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50 transition-all flex items-center justify-center gap-2"
            >
                <FilePieChart className="w-4 h-4" /> PDF
            </button>
        </div>
    </div>
);

/**
 * Standardized Report Header with Selected Title & Mobile Search Toggle
 */
export const ReportHeader = ({ onBack, title }) => (
    <div className="flex items-center justify-between mb-6 lg:mb-8 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-4 lg:gap-6">
            {onBack && (
                <button onClick={onBack} className="p-2.5 lg:p-3 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-institutional-main hover:text-white transition-all text-slate-400 group flex items-center justify-center active:scale-95">
                    <ChevronLeft className="w-4 h-4 lg:w-5 lg:h-5" />
                </button>
            )}
            <div className="flex flex-col">
                <h2 className="text-lg lg:text-2xl font-black text-institutional-main uppercase tracking-tighter leading-none">{title}</h2>
                <span className="text-[8px] lg:text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1 lg:mt-1.5 opacity-60">Audit Intelligence</span>
            </div>
        </div>
    </div>
);

/**
 * Standardized Toolbar for Search & Export - Integrated Style
 * Updated for Mobile Visibility state from Header
 */
export const InstitutionalReportToolbar = ({ searchQuery, setSearchQuery, children, isOpen, onExportExcel, onExportPDF }) => (
    <div className="border-b border-slate-100 bg-slate-50/30">
        {/* Main Toolbar Line */}
        <div className={`p-3 lg:p-4 transition-all duration-300 ${!isOpen ? 'hidden lg:flex' : 'flex animate-in slide-in-from-top-2'}`}>
            <div className="flex flex-wrap items-center justify-between gap-4 w-full">
                <div className="flex flex-wrap items-center gap-3 lg:gap-4 flex-1">
                    {/* Search Bar */}
                    <div className="relative w-full lg:w-72 group border border-table rounded-sm overflow-hidden bg-white shadow-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-institutional-main/40 group-focus-within:text-institutional-main transition-colors" />
                        <input 
                            type="text"
                            placeholder="Search records..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-transparent text-institutional-main text-[11px] font-bold outline-none uppercase placeholder:text-slate-400 tracking-widest"
                        />
                    </div>
                    
                    {/* Additional Filters (Class, Term, etc.) */}
                    {children && (
                        <div className="flex items-center gap-2 flex-wrap">
                            {children}
                        </div>
                    )}
                </div>

                {/* Export/Import Actions */}
                <div className="flex items-center gap-2 w-full lg:w-auto justify-start lg:justify-end">
                    <div className="group relative">
                        <button className="flex items-center gap-2 px-4 lg:px-5 py-2 bg-white border border-table rounded text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95">
                            <Share2 className="w-3.5 h-3.5 text-indigo-600" /> <span>Export</span> <ChevronDown className="w-3 h-3 opacity-50" />
                        </button>
                        <div className="absolute left-0 lg:left-auto lg:right-0 top-full mt-1 w-44 bg-white border border-table shadow-2xl rounded-xl py-2 hidden group-hover:block z-100">
                            <button 
                                onClick={onExportExcel}
                                className="w-full text-left px-5 py-2 text-[10px] font-bold uppercase hover:bg-slate-50 flex items-center gap-2 text-slate-600"
                            >
                                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Excel
                            </button>
                            <button 
                                onClick={onExportPDF}
                                className="w-full text-left px-5 py-2 text-[10px] font-bold uppercase hover:bg-slate-50 flex items-center gap-2 text-slate-600"
                            >
                                <FilePieChart className="w-3.5 h-3.5 text-rose-600" /> PDF Report
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

/**
 * Standardized Pagination Component - Sync with StudentFeeAssignment
 */
export const TablePagination = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) => {
    return (
        <div className="p-4 bg-white border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Left: Entries Description */}
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Showing <span className="text-institutional-main">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-institutional-main">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of <span className="text-institutional-main">{totalItems}</span> entries
            </p>

            {/* Right: Controls */}
            <div className="flex items-center gap-1">
                <button 
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    className="px-4 py-2 bg-white border border-table rounded text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                    Prev
                </button>
                <div className="flex items-center px-4">
                    <span className="text-[10px] font-black text-institutional-main uppercase">Page {currentPage} of {totalPages || 1}</span>
                </div>
                <button 
                    disabled={currentPage === totalPages || totalPages === 0}
                    onClick={() => onPageChange(currentPage + 1)}
                    className="px-4 py-2 bg-white border border-table rounded text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                    Next
                </button>
            </div>
        </div>
    );
};

/**
 * Wrapper for Recharts visuals to maintain institutional styling
 */
export const SimpleChartWrapper = ({ title, children, subtitle }) => (
    <div className="bg-white p-8 rounded-xl border-table shadow-sm flex flex-col h-full">
        <div className="mb-8">
            <h4 className="text-xs font-black text-institutional-main uppercase tracking-widest mb-1">{title}</h4>
            {subtitle && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{subtitle}</p>}
        </div>
        <div className="flex-1 w-full min-h-[300px]">
            {children}
        </div>
    </div>
);

/**
 * CATEGORY CARD COMPONENT
 */
export const ReportCategory = ({ title, items, icon: icon, onSelect }) => {
    const Icon = icon;
    return (
        <div className="bg-white p-6 lg:p-8 rounded-xl border-table shadow-sm flex flex-col h-full group hover:shadow-xl transition-all">
            <div className="flex items-center gap-3 lg:gap-4 mb-6 lg:mb-8">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-institutional-main shadow-inner group-hover:bg-institutional-main group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5 lg:w-6 lg:h-6" />
                </div>
                <h4 className="text-sm lg:text-lg font-black text-institutional-main tracking-tight uppercase leading-none">{title}</h4>
            </div>
            <div className="flex-1 space-y-2 lg:space-y-3">
                {items.map((item, idx) => (
                    <button 
                        key={idx} 
                        onClick={() => onSelect(item)}
                        className="w-full flex items-center justify-between p-3 lg:p-4 bg-slate-50 border border-slate-100 rounded-xl group/item hover:bg-white hover:border-indigo-500/50 transition-all text-left"
                    >
                        <span className="text-[9px] lg:text-[11px] font-black text-slate-500 uppercase tracking-widest leading-tight group-hover/item:text-indigo-600">{item}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-200 group-hover/item:text-indigo-600 transition-all group-hover/item:translate-x-1" />
                    </button>
                ))}
            </div>
        </div>
    );
};

/**
 * PLACEHOLDER VIEW
 */
export const PlaceholderReport = ({ name, onBack }) => (
    <div className="p-10 lg:p-32 text-center bg-slate-50 border border-table border-dashed rounded-3xl space-y-6">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm ring-1 ring-slate-200">
            <FileSpreadsheet className="w-8 h-8 text-indigo-400" />
        </div>
        <div className="space-y-2">
            <h4 className="text-lg lg:text-xl font-black text-institutional-main uppercase tracking-tighter">{name} Prototype</h4>
            <p className="text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Module Shell Ready for Data Integration</p>
        </div>
        <button 
            onClick={onBack}
            className="px-6 lg:px-8 py-3 bg-white border border-table rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center gap-2 mx-auto active:scale-95"
        >
            <ChevronLeft className="w-4 h-4" /> Back to Categories
        </button>
    </div>
);
