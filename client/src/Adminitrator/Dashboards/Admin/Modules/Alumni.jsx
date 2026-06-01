import React, { useState, useEffect } from 'react';
import {
    Users, Eye, Filter, RefreshCw, GraduationCap, Calendar, MapPin, Search, Menu, ChevronDown
} from 'lucide-react';
import { useAcademicYear } from '../../../../context/AcademicYearContext';
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import DataTable from '../../../admcomponents/DataTable';
import StudentProfile from '../../../admpages/StudentProfile';
import { toast } from 'react-toastify';
import { getAlumniRecords } from '../../../../services/studentAPI';

/**
 * Alumni Module - Registry for archived students who have left or graduated.
 * Provides a read-only historical perspective of student records.
 */
const Alumni = ({ toggleSidebar }) => {
    const [alumni, setAlumni] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewingAlumni, setViewingAlumni] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isSearchOpen, setIsSearchOpen] = useState(true);
    const [selectedYear, setSelectedYear] = useState('all');
    const { allYears } = useAcademicYear();
    const itemsPerPage = 15;

    /**
     * Synchronizes the local state with the archived alumni matrix from the server.
     */
    const fetchAlumni = async () => {
        try {
            setLoading(true);
            const data = await getAlumniRecords();
            setAlumni(data);
        } catch {
            toast.error("Archive Synchronization Failed");
        } finally {
            setLoading(false);
        }
    };

    /**
     * Loads the alumni registry on mount.
     */
    useEffect(() => {
        fetchAlumni();
    }, []);

    const filteredAlumni = alumni.filter(a => {
        const term = searchTerm.toLowerCase();
        const matchesSearch = 
            (a.student_name && a.student_name.toLowerCase().includes(term)) ||
            (a.gr_no && String(a.gr_no).toLowerCase().includes(term)) ||
            (a.student_id && String(a.student_id).toLowerCase().includes(term)) ||
            (a.pen_no && String(a.pen_no).toLowerCase().includes(term));
            
        const matchesYear = selectedYear === 'all' || a.final_academic_year === selectedYear;

        return matchesSearch && matchesYear;
    });

    const totalPages = Math.ceil(filteredAlumni.length / itemsPerPage);
    const paginatedAlumni = filteredAlumni.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    if (viewingAlumni) {
        return (
            <StudentProfile
                student={{ ...viewingAlumni, id: viewingAlumni.student_id, name: viewingAlumni.student_name, srNo: viewingAlumni.student_id_no || viewingAlumni.gr_no }}
                onBack={() => setViewingAlumni(null)}
            />
        );
    }

    return (
        <div className='p-2 lg:p-8 bg-institutional-page min-h-screen font-sans'>
            <ModuleHeader
                title="Alumni Registry"
                subTitle="Graduated & Departed Students"
                badge="Institutional Archive"
                toggleSidebar={toggleSidebar}
                showSearch={true}
                searchValue={searchTerm}
                onSearchChange={(val) => {
                    setSearchTerm(val);
                    setCurrentPage(1);
                }}
                onSearchToggle={() => setIsSearchOpen(!isSearchOpen)}
                hideDesktopSearch={true}
                hideAcademicYear={true}
            >
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchAlumni}
                        className="w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center bg-white border border-white rounded-md text-[#001736] hover:bg-white/80 transition-all shadow-xl active:rotate-180 duration-700 shrink-0"
                        title="Synchronize Data"
                    >
                        <RefreshCw size={18} className="lg:w-[22px] lg:h-[22px]" />
                    </button>
                </div>
            </ModuleHeader>

            {/* Registry Search Bar and Filter */}
            <div className={`flex flex-col md:flex-row items-center gap-4 py-4 rounded-md mb-4 ${!isSearchOpen ? 'hidden' : 'flex animate-in slide-in-from-top-2 duration-300'}`}>
                <div className="flex flex-1 w-full relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-40" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        placeholder="Search Alumni by Name, GR No, Student ID, PEN No..."
                        className="w-full pl-11 pr-4 py-4 border border-black rounded-md text-primary text-[10px] font-black uppercase tracking-widest outline-none shadow-sm transition-all bg-white"
                    />
                </div>
                <div className="w-full md:w-auto min-w-[200px] relative">
                    <select
                        value={selectedYear}
                        onChange={(e) => {
                            setSelectedYear(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full py-4 px-4 pr-10 border border-black rounded-md text-primary text-[10px] font-black uppercase tracking-widest outline-none shadow-sm transition-all bg-white appearance-none cursor-pointer"
                    >
                        <option value="all">All Academic Years</option>
                        {allYears?.map(year => (
                            <option key={year.id} value={year.year_name}>{year.year_name}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" />
                </div>
            </div>

            <DataTable
                headers={[
                    { label: "Sr. No", className: "w-[60px] border-r border-black text-center bg-slate-100" },
                    { label: "Year", className: "w-[100px] border-r border-black bg-slate-100 text-center" },
                    { label: "Alumni Name", className: "min-w-[180px] border-r border-black bg-slate-100" },
                    { label: "Adm. Grade", className: "hidden md:table-cell w-[110px] border-r border-black bg-slate-100 text-center" },
                    { label: "Adm. Date", className: "hidden lg:table-cell w-[120px] border-r border-black bg-slate-100 text-center" },
                    { label: "Final Grade", className: "w-[90px] border-r border-black bg-slate-100 text-center" },
                    { label: "Leaving Date", className: "w-[120px] border-r border-black bg-slate-100 text-center" },
                    { label: "Exit Reason", className: "hidden md:table-cell border-r border-black bg-slate-100" },
                    { label: "Actions", className: "text-center w-[80px] bg-slate-100" }
                ]}
                columnCount={9}
                loading={loading}
                emptyMessage="No Alumni Records Found"
                footer={
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#001736] opacity-60">
                            Showing <span className="font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold">{Math.min(currentPage * itemsPerPage, filteredAlumni.length)}</span> of <span className="font-bold">{filteredAlumni.length}</span> Records
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 bg-white border border-black rounded text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                Prev
                            </button>
                            <div className="px-4 text-[10px] font-black text-[#001736] uppercase">Page {currentPage} of {totalPages || 1}</div>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="px-4 py-2 bg-white border border-black rounded text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                }
            >
                {paginatedAlumni.map((a, idx) => (
                    <tr key={idx} className="hover-table-row transition-colors group">
                        <td className="px-4 py-3 border-b border-r border-black text-center font-black text-[10px] bg-slate-50/30">
                            {(currentPage - 1) * itemsPerPage + idx + 1}
                        </td>
                        <td className="px-4 py-3 border-b border-r border-black text-center">
                            <p className="text-[10px] font-black text-[#001736] leading-none">{a.final_academic_year || '---'}</p>
                        </td>
                        <td className="px-5 py-3 border-b border-r border-black">
                            <p className="text-[11px] font-black text-[#001736] uppercase tracking-tight">{a.student_name}</p>
                        </td>
                        <td className="hidden md:table-cell px-4 py-3 border-b border-r border-black text-center">
                            <span className="px-2 py-0.5 bg-slate-50 text-[#001736] text-[9px] font-black rounded border border-black uppercase tracking-widest">
                                {a.admitted_grade || '---'}
                            </span>
                        </td>
                        <td className="hidden lg:table-cell px-4 py-3 border-b border-r border-black text-center text-[9px] font-black text-slate-600">
                            {a.admission_date ? new Date(a.admission_date).toLocaleDateString('en-GB') : '---'}
                        </td>
                        <td className="px-4 py-3 border-b border-r border-black text-center">
                            <span className="px-2 py-0.5 bg-white text-[#001736] text-[9px] font-black rounded border border-black uppercase tracking-widest">
                                {a.final_grade}
                            </span>
                        </td>
                        <td className="px-4 py-3 border-b border-r border-black text-center text-[9px] font-black text-rose-600">
                            {a.leaving_date ? new Date(a.leaving_date).toLocaleDateString('en-GB') : '---'}
                        </td>
                        <td className="hidden md:table-cell px-5 py-3 border-b border-r border-black">
                            <span className="text-[9px] font-black text-slate-500 italic uppercase leading-none block line-clamp-2">
                                {a.exit_reason || 'N/A'}
                            </span>
                        </td>
                        <td className="px-4 py-3 text-center border-b border-black">
                            <button
                                onClick={() => setViewingAlumni(a)}
                                className="p-2 bg-white border border-black text-[#001736] rounded-md hover:bg-[#001736] hover:text-white transition-all shadow-sm active:scale-95"
                                title="View Archival Profile"
                            >
                                <Eye className="w-3.5 h-3.5" />
                            </button>
                        </td>
                    </tr>
                ))}
            </DataTable>
        </div>
    );
};

export default Alumni;
