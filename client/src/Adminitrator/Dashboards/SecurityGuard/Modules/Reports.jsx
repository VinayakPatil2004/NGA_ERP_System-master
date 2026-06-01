import React, { useState, useEffect } from 'react';
import API, { ROOT_URL } from '../../../../services/API';
import { useAcademicYear } from '../../../../context/AcademicYearContext';
import { 
    FileText, 
    Download, 
    Calendar, 
    Filter, 
    Search, 
    Printer,
    Users,
    Bus,
    UserPlus
} from 'lucide-react';
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import DataTable from '../../../admcomponents/DataTable';

const Reports = ({ toggleSidebar }) => {
    const [reportType, setReportType] = useState('visitor'); // visitor, gate, vehicle
    const [dateRange, setDateRange] = useState({
        from: new Date().toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
    });
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const { selectedYear } = useAcademicYear();

    const fetchReport = React.useCallback(async () => {
        if (!selectedYear) return;
        try {
            setLoading(true);
            let endpoint = '';
            if (reportType === 'visitor') endpoint = '/security/visitors';
            else if (reportType === 'gate') endpoint = '/security/entries';
            else if (reportType === 'vehicle') endpoint = '/security/vehicles';

            const response = await API.get(`${endpoint}?academic_year_id=${selectedYear.id}`);
            setLogs(response.data);
        } catch (error) {
            console.error("Error fetching report data:", error);
        } finally {
            setLoading(false);
        }
    }, [reportType, selectedYear]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, reportType, dateRange]);

    const handleExportPDF = () => {
        window.print();
    };

    const filteredLogs = logs.filter(log => {
        const term = search.toLowerCase();
        const name = (log.name || log.person_name || log.vehicle_no || log.driver_name || '').toLowerCase();
        return name.includes(term);
    });

    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
    const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const columns = [
        {
            key: 'record_detail',
            label: 'Record Detail',
            render: (log) => (
                <div>
                    <span className="text-sm font-bold text-[#001736] tracking-tight">
                        {reportType === 'visitor' ? log.name : 
                         reportType === 'gate' ? log.person_name : log.vehicle_no}
                    </span>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        {reportType === 'visitor' ? log.phone : 
                         reportType === 'gate' ? `Type: ${log.entry_type}` : `Driver: ${log.driver_name}`}
                    </p>
                </div>
            )
        },
        {
            key: 'category',
            label: 'Category',
            render: () => (
                <span className="px-4 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[9px] font-bold uppercase tracking-widest border border-indigo-100">
                    {reportType.toUpperCase()}
                </span>
            )
        },
        {
            key: 'date',
            label: 'Date',
            render: (log) => {
                const dateStr = log.created_at || log.visit_date || log.entry_time;
                return (
                    <div className="text-[10px] font-bold text-[#001736]">
                        {new Date(dateStr).toLocaleDateString()}
                    </div>
                );
            }
        },
        {
            key: 'time_in_out',
            label: 'In / Out',
            render: (log) => {
                const inTime = log.entry_time || log.in_time || log.created_at;
                const outTime = log.exit_time || log.out_time;
                return (
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                        In: {inTime ? new Date(inTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'} <br/>
                        Out: {outTime ? new Date(outTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </div>
                );
            }
        },
        {
            key: 'purpose',
            label: 'Purpose & Remarks',
            render: (log) => (
                <div>
                    <p className="text-xs font-medium text-[#001736] max-w-[200px] truncate" title={log.purpose}>
                        {log.purpose || 'Regular Access'}
                    </p>
                    {log.remarks && (
                        <p className="text-[10px] text-slate-400 font-medium italic mt-0.5 max-w-[200px] truncate" title={log.remarks}>
                            {log.remarks}
                        </p>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 min-h-screen bg-[#F8FAFC] font-sans text-left print:bg-white print:p-0 print:m-0 print:space-y-0">
            <div className="print:hidden">
                <ModuleHeader 
                    title="Security Logs & Reports" 
                    subTitle="Generate and export security audit trails" 
                    toggleSidebar={toggleSidebar} 
                >
                    <div className="flex items-center gap-3">
                        <button onClick={handleExportPDF} className="bg-white border border-slate-200 text-[#001736] px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl text-[9px] sm:text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm whitespace-nowrap">
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Export PDF</span>
                            <span className="sm:hidden">Export</span>
                        </button>
                        <button onClick={() => window.print()} className="bg-white text-[#001736] border border-slate-200 px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl text-[9px] sm:text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm active:scale-95 whitespace-nowrap">
                            <Printer className="w-4 h-4" />
                            <span className="hidden sm:inline">Print Report</span>
                            <span className="sm:hidden">Print</span>
                        </button>
                    </div>
                </ModuleHeader>
            </div>

            {/* Selection & Filters */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-6 print:hidden">
                <div className="flex flex-col xl:flex-row items-center justify-between gap-6">
                    <div className="flex flex-wrap sm:flex-nowrap items-center justify-center gap-2 sm:gap-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 w-full xl:w-auto">
                        <button 
                            onClick={() => setReportType('visitor')}
                            className={`px-4 sm:px-8 py-2.5 rounded-xl text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 flex-1 sm:flex-none
                                ${reportType === 'visitor' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <UserPlus className="w-3.5 h-3.5" />
                            Visitors
                        </button>
                        <button 
                            onClick={() => setReportType('gate')}
                            className={`px-4 sm:px-8 py-2.5 rounded-xl text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 flex-1 sm:flex-none
                                ${reportType === 'gate' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <Users className="w-3.5 h-3.5" />
                            Gate Entries
                        </button>
                        <button 
                            onClick={() => setReportType('vehicle')}
                            className={`px-4 sm:px-8 py-2.5 rounded-xl text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 flex-1 sm:flex-none
                                ${reportType === 'vehicle' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <Bus className="w-3.5 h-3.5" />
                            Vehicles
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
                        <div className="flex flex-wrap sm:flex-nowrap items-center justify-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm w-full sm:w-auto">
                            <Calendar className="w-4 h-4 text-slate-400 hidden sm:block" />
                            <input 
                                type="date" 
                                value={dateRange.from}
                                onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
                                className="text-xs font-bold text-[#001736] focus:outline-none flex-1 sm:flex-none text-center sm:text-left"
                            />
                            <span className="text-slate-300 font-bold hidden sm:block">TO</span>
                            <input 
                                type="date" 
                                value={dateRange.to}
                                onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
                                className="text-xs font-bold text-[#001736] focus:outline-none flex-1 sm:flex-none text-center sm:text-left"
                            />
                        </div>
                        <button 
                            onClick={fetchReport}
                            className="bg-indigo-50 text-indigo-600 px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-indigo-100 hover:bg-indigo-100 transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
                        >
                            <Filter className="w-4 h-4" />
                            Apply
                        </button>
                    </div>
                </div>
            </div>

            {/* Report Content */}
            <div className="bg-white border border-slate-200 shadow-sm overflow-hidden min-h-[500px] print:border-none print:shadow-none print:min-h-0 print:rounded-none">
                <div className="p-6 sm:p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100">
                            <FileText className="w-6 h-6 text-slate-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-[#001736] tracking-tight uppercase">Audit Trail Data</h3>
                            <p className="text-xs font-medium text-slate-400">Total Records Found: {logs.length}</p>
                        </div>
                    </div>
                    <div className="relative w-full max-w-xs group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Search in report..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-12 pr-4 text-xs font-medium focus:outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all"
                        />
                    </div>
                </div>

                <div className="print:block">
                    <DataTable 
                        headers={columns}
                        loading={loading}
                        emptyMessage="No data found for the selected criteria"
                        footer={
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#64748B]">
                                    Showing <span className="text-[#001736]">{filteredLogs.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0}</span> to <span className="text-[#001736]">{Math.min(currentPage * itemsPerPage, filteredLogs.length)}</span> of <span className="text-[#001736]">{filteredLogs.length}</span> Records
                                </p>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="px-4 py-2 bg-white border border-slate-200 rounded text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    >
                                        Prev
                                    </button>
                                    <div className="flex items-center gap-1 px-4">
                                        <span className="text-[10px] font-black text-[#001736] uppercase">Page {currentPage} of {totalPages || 1}</span>
                                    </div>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages || totalPages === 0}
                                        className="px-4 py-2 bg-white border border-slate-200 rounded text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        }
                    >
                        {paginatedLogs.map((log, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors border-b-table group">
                                {columns.map(col => (
                                    <td key={col.key} className={`px-4 sm:px-6 py-4 text-sm ${col.align === 'right' ? 'text-right' : 'text-left'} border-r-table`}>
                                        {col.render(log)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </DataTable>
                </div>
                
                {/* Print Only Full Table */}
                <div className="hidden print:block w-full">
                    <div className="mb-6 text-center">
                        <h2 className="text-xl font-bold text-slate-800 uppercase tracking-widest">{reportType} Audit Report</h2>
                        <p className="text-sm text-slate-500 font-medium mt-1">Generated on: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
                    </div>
                    <table className="w-full border-collapse border border-slate-200 text-left text-sm">
                        <thead>
                            <tr className="bg-slate-100">
                                {columns.map(col => (
                                    <th key={col.key} className="border border-slate-200 p-3 font-bold text-slate-700 uppercase text-[10px] tracking-widest">{col.label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.map((log, idx) => (
                                <tr key={idx}>
                                    {columns.map(col => (
                                        <td key={col.key} className="border border-slate-200 p-3 text-sm">
                                            {col.render(log)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Reports;
