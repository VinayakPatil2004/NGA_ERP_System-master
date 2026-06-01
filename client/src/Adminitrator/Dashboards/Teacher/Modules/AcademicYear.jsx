import React, { useState, useEffect, useCallback } from 'react';
import {
    Calendar, Plus, CheckCircle, AlertCircle,
    ArrowRight, Users, FileText, TrendingUp,
    ShieldCheck, Clock, X, Zap, RefreshCw,
    Edit2, Trash2, Power
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../../../context/AuthContext';
import * as AcademicYearAPI from '../../../../services/academicYearAPI';
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import DataTable from '../../../admcomponents/DataTable';
import Swal from 'sweetalert2';

/**
 * AcademicYearManager - Global Session Architecture & Promotion Protocol
 * Refined to the 'Simplified Premium' aesthetic with rounded-2xl and 1px borders.
 */
const AcademicYearManager = ({ toggleSidebar }) => {
    const { isAdmin, isPrincipal, isTeacher } = useAuth();
    const [years, setYears] = useState([]);
    const [loading, setLoading] = useState(true);
    // A teacher only views the sessions
    const hasAuthority = false;

    const [selectedYear, setSelectedYear] = useState("");

    const fetchYears = useCallback(async () => {
        try {
            setLoading(true);
            const data = await AcademicYearAPI.getAllAcademicYears();
            setYears(data || []);
            
            // Set active year as default selected
            const active = data?.find(y => y.is_active);
            if (active) setSelectedYear(active.id);
        } catch (error) {
            console.error("Fetch Years Error:", error);
            toast.error("Failed to load academic years");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchYears();
    }, [fetchYears]);



    const handleSetActive = async (id) => {
        try {
            await AcademicYearAPI.setActiveAcademicYear(id);
            toast.success("Global session context updated");
            fetchYears();
        } catch (error) {
            console.error("Set Active Error:", error);
            toast.error("Update failed");
        }
    };

    return (
        <div className="p-4 lg:p-8 bg-[#F8FAFC] min-h-screen font-sans text-left">

            {/* 1. Unified Module Header */}
            <ModuleHeader
                title="Academic Cycles"
                subTitle="Global Session Architecture & Promotion Protocol"
                icon={Calendar}
                badge={`CYCLES: ${years.length}`}
                toggleSidebar={toggleSidebar}
                showSearch={false}
                hideDesktopSearch={true}
            >
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <select 
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="appearance-none bg-white border border-slate-200 text-[#001736] text-[11px] font-black uppercase tracking-widest px-6 py-3 rounded-xl outline-none focus:border-[#FFB606] transition-all cursor-pointer min-w-[140px] shadow-sm hover:shadow-md pr-10"
                        >
                            <option value="" disabled>Select Year</option>
                            {years.map(y => (
                                <option key={y.id} value={y.id}>{y.year_name}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-[#FFB606] transition-colors">
                            <Calendar className="w-4 h-4" />
                        </div>
                    </div>
                </div>
            </ModuleHeader>

            <div className="space-y-8 mt-10">
                <div className="space-y-8">


                    {loading ? (
                        <div className="bg-white p-24 rounded-2xl text-center border border-slate-200 border-dashed">
                            <div className="w-10 h-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Accessing Archives...</p>
                        </div>
                    ) : (
                        <div className="bg-white border border-black shadow-sm overflow-hidden anim-fade-in">
                            <DataTable
                                headers={[
                                    { label: 'Sr.' },
                                    { label: 'Session' },
                                    { label: 'Start Date' },
                                    { label: 'End Date' },
                                    { label: 'Status' },
                                    { label: 'Administration' }
                                ]}
                                columnCount={6}
                                loading={loading}
                            >
                                {years.map((row, i) => (
                                    <tr key={row.id} className="border-b border-black/5 hover:bg-slate-50 transition-all">
                                        <td className="px-8 py-4 border-r-table border-b-table">
                                            <span className="text-[10px] font-bold ">{(i + 1).toString().padStart(2, '0')}</span>
                                        </td>
                                        <td className="px-8 py-4 border-r-table border-b-table">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[11px] font-black tracking-tight ${row.is_active ? 'text-indigo-600' : 'text-primary'}`}>{row.year_name}</span>

                                            </div>
                                        </td>
                                        <td className="px-8 py-4 text-[10px] font-medium  uppercase border-r-table border-b-table">
                                            {row.start_date ? new Date(row.start_date).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="px-8 py-4 text-[10px] font-medium  uppercase border-r-table border-b-table">
                                            {row.end_date ? new Date(row.end_date).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="px-8 py-4 border-r-table border-b-table">
                                            <span className={`px-3 py-1 rounded-full font-bold text-[8px] uppercase tracking-widest ${row.is_active ? 'bg-emerald-500 text-white' : 'bg-slate-100 '}`}>
                                                {row.is_active ? 'Active' : 'Archived'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-4 border-b-table">
                                            <div className="flex items-center gap-1.5">
                                                {!row.is_active && (
                                                    <button
                                                        onClick={() => handleSetActive(row.id)}
                                                        className="p-2 hover:bg-indigo-50 rounded-lg transition-all text-[#001736]"
                                                        title="Set Active"
                                                    >
                                                        <Power size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </DataTable>
                        </div>
                    )}
                </div>
            </div>


        </div>
    );
};

export default AcademicYearManager;
