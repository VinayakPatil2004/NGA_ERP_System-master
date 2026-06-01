import React, { useState, useEffect } from 'react';
import {
    Users, Eye, Filter, RefreshCw, GraduationCap, Calendar, MapPin, Search
} from 'lucide-react';
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

    const filteredAlumni = alumni.filter(a => 
        a.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.gr_no?.includes(searchTerm)
    );

    if (viewingAlumni) {
        return (
            <StudentProfile 
                student={{ ...viewingAlumni, id: viewingAlumni.student_id, name: viewingAlumni.student_name, srNo: viewingAlumni.student_id_no || viewingAlumni.gr_no }} 
                onBack={() => setViewingAlumni(null)} 
            />
        );
    }

    return (
        <div className='p-4 md:p-8 bg-institutional-page min-h-screen font-sans'>
            <ModuleHeader
                title="Alumni Registry"
                subTitle="Graduated & Departed Students"
                icon={GraduationCap}
                badge="Master Archive"
                toggleSidebar={toggleSidebar}
                showSearch={true}
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                hideDesktopSearch={true}
            >
                <div className="flex items-center gap-2">
                     <button
                        onClick={fetchAlumni}
                        className="p-3 lg:p-4 btn-icon-institutional rounded-xl lg:rounded-2xl shadow-2xl active:rotate-180 duration-700 shrink-0"
                    >
                        <RefreshCw size={18} className="lg:w-[22px] lg:h-[22px] opacity-80" />
                    </button>
                    <div className="hidden lg:flex items-center gap-2 bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-sm">
                        <Calendar size={14} className="text-slate-400" />
                        <span className="text-[10px] font-black uppercase text-slate-500">Archival View</span>
                    </div>
                </div>
            </ModuleHeader>

            <DataTable
                headers={[
                    { label: "GR No / ID", className: "w-[120px]" },
                    { label: "Alumni Name", className: "min-w-[200px]" },
                    { label: "Final Grade", className: "w-[100px]" },
                    { label: "Leaving Date", className: "w-[150px]" },
                    { label: "Exit Reason" },
                    { label: "Actions", className: "text-center w-[80px]" }
                ]}
                columnCount={6}
                loading={loading}
                emptyMessage="No Alumni Records Found"
            >
                {filteredAlumni.map((a, idx) => (
                    <tr key={idx} className="hover-table-row transition-colors group">
                        <td className="px-8 py-6 border-b-table border-r-table font-mono text-[10px] font-bold">
                            {a.gr_no || a.student_id_no || `ID#${a.student_id}`}
                        </td>
                        <td className="px-8 py-6 border-b-table border-r-table">
                            <p className="text-[12px] font-bold text-table-cell uppercase tracking-tight">{a.student_name}</p>
                        </td>
                        <td className="px-8 py-6 border-b-table border-r-table text-center font-bold text-[11px]">
                            {a.final_grade}
                        </td>
                        <td className="px-8 py-6 border-b-table border-r-table text-[11px] font-medium text-slate-500">
                            {new Date(a.leaving_date).toLocaleDateString()}
                        </td>
                        <td className="px-8 py-6 border-b-table border-r-table">
                            <span className="text-[10px] font-bold text-slate-400 italic">"{a.exit_reason}"</span>
                        </td>
                        <td className="px-8 py-6 text-center border-b-table">
                            <button
                                onClick={() => setViewingAlumni(a)}
                                className="p-3 bg-white border-table text-table-cell rounded-xl hover:bg-gray-400 hover:text-white transition-all shadow-sm active:scale-95"
                                title="View Archival Profile"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                        </td>
                    </tr>
                ))}
            </DataTable>
        </div>
    );
};

export default Alumni;
