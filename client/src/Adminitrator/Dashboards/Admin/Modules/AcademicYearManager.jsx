import React, { useState, useEffect, useCallback } from 'react';
import {
    Calendar, Plus, CheckCircle, AlertCircle,
    ArrowRight, Users, FileText, TrendingUp,
    ShieldCheck, Clock, X, Zap, RefreshCw,
    Edit2, Trash2, Power
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../../../context/AuthContext';
import { useAcademicYear } from '../../../../context/AcademicYearContext';
import * as AcademicYearAPI from '../../../../services/academicYearAPI';
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import DataTable from '../../../admcomponents/DataTable';
import Swal from 'sweetalert2';

/**
 * AcademicYearManager - Global Session Architecture & Promotion Protocol
 * Refined to the 'Simplified Premium' aesthetic with rounded-md and 1px borders.
 */
const AcademicYearManager = ({ toggleSidebar }) => {
    const { isAdmin, isPrincipal, isTeacher } = useAuth();
    const { changeYear, refreshYears } = useAcademicYear();
    const [years, setYears] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingYear, setEditingYear] = useState(null);
    const [newYear, setNewYear] = useState({
        name: '',
        startDate: '',
        endDate: ''
    });

    // Authority Check
    const hasAuthority = isAdmin() || isPrincipal() || isTeacher();

    const fetchYears = useCallback(async () => {
        try {
            setLoading(true);
            const data = await AcademicYearAPI.getAllAcademicYears();
            setYears(data || []);
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

    const handleAddYear = async (e) => {
        e.preventDefault();
        try {
            await AcademicYearAPI.addAcademicYear({
                yearName: newYear.name,
                startDate: newYear.startDate,
                endDate: newYear.endDate
            });
            toast.success("Academic session established successfully");
            setNewYear({ name: '', startDate: '', endDate: '' });
            setShowAddModal(false);
            fetchYears();
        } catch (error) {
            console.error("Add Year Error:", error);
            toast.error(error.response?.data?.message || "Process failed");
        }
    };

    const handleUpdateYear = async (e) => {
        e.preventDefault();
        try {
            await AcademicYearAPI.updateAcademicYear(editingYear.id, {
                yearName: editingYear.year_name,
                startDate: editingYear.start_date?.split('T')[0],
                endDate: editingYear.end_date?.split('T')[0]
            });
            toast.success("Academic session updated");
            setShowEditModal(false);
            fetchYears();
        } catch (error) {
            console.error(error);
            toast.error("Update failed");
        }
    };

    const handleDeleteYear = async (id) => {
        const result = await Swal.fire({
            title: 'Institutional Deletion',
            text: "Purging this session is irreversible. Continue?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#001736',
            cancelButtonColor: '#ef4444',
            confirmButtonText: 'Delete SESSION',
            background: '#ffffff',
            customClass: {
                title: 'text-[14px] font-bold uppercase tracking-widest text-primary',
                content: 'text-[12px] uppercase text-slate-500',
                confirmButton: 'text-[10px] font-black uppercase tracking-widest px-8 py-4 rounded-md shadow-lg',
                cancelButton: 'text-[10px] font-black uppercase tracking-widest px-8 py-4 rounded-md'
            }
        });

        if (result.isConfirmed) {
            try {
                await AcademicYearAPI.deleteAcademicYear(id);
                toast.success("Session Deleted from registry");
                fetchYears();
            } catch (error) {
                toast.error(error.response?.data?.error || "Delete failed");
            }
        }
    };

    const handleSetActive = async (id) => {
        try {
            await AcademicYearAPI.setActiveAcademicYear(id);
            toast.success("Global session context updated");
            
            // Find the updated year object in current local state
            const targetYear = years.find(y => y.id === id);
            if (targetYear) {
                // Instantly update the selected global academic year in the state & sessionStorage
                changeYear(targetYear);
            }
            
            // Re-fetch local table data
            await fetchYears();
            
            // Sync global context lists & active year
            if (refreshYears) {
                await refreshYears();
            }
        } catch (error) {
            console.error("Set Active Error:", error);
            toast.error("Update failed");
        }
    };

    const [showPromoteModal, setShowPromoteModal] = useState(false);
    const [promotionData, setPromotionData] = useState({
        fromYearId: null,
        fromYearName: '',
        toYearId: null
    });

    const handlePromoteStudents = async () => {
        try {
            setLoading(true);
            await AcademicYearAPI.promoteStudents(promotionData);
            toast.success("Global promotion synchronized successfully");
            setShowPromoteModal(false);
            fetchYears();
        } catch (error) {
            console.error("Promotion Error:", error);
            toast.error(error.response?.data?.error || "Cycle synchronization failed");
        } finally {
            setLoading(false);
        }
    };

    const openPromotionWizard = (year) => {
        const currentIndex = years.findIndex(y => y.id === year.id);
        const nextYear = currentIndex > 0 ? years[currentIndex - 1] : null;

        setPromotionData(prev => ({
            ...prev,
            fromYearId: year.id,
            fromYearName: year.year_name,
            toYearId: nextYear ? nextYear.id : null
        }));
        setShowPromoteModal(true);
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
                <div className="flex items-center gap-2 lg:gap-3">
                    {hasAuthority && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="btn-add-institutional px-4 py-2 rounded-md font-bold text-[10px] lg:text-[11px] uppercase tracking-widest shadow-xl transition-all flex items-center gap-2 lg:gap-3 active:scale-95"
                        >
                            <Plus size={18} className="lg:w-5 lg:h-5" />
                            <strong className="hidden md:inline">NEW SESSION</strong>
                        </button>
                    )}
                    <button
                        onClick={fetchYears}
                        className="p-2 btn-add-institutional border border-white/10 rounded-md  text-[#001736] hover:bg-white/10 lg:hover:bg-slate-50 transition-all shadow-sm active:rotate-180 duration-500 shrink-0"
                    >
                        <RefreshCw size={18} className="lg:w-5 lg:h-5" />
                    </button>
                </div>
            </ModuleHeader>

            <div className="space-y-8 mt-10">
                <div className="space-y-8">


                    {loading ? (
                        <div className="bg-white p-24 rounded-md text-center border border-slate-200 border-dashed">
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
                                    { label: 'Administration' },
                                    { label: 'Cycle Migration' }
                                ]}
                                columnCount={7}
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
                                        <td className="px-8 py-4 border-r-table border-b-table">
                                            <div className="flex items-center gap-1.5">
                                                {!row.is_active && isAdmin() && (
                                                    <button
                                                        onClick={() => handleSetActive(row.id)}
                                                        className="p-2 hover:bg-indigo-50 rounded-lg transition-all"
                                                        title="Set Active"
                                                    >
                                                        <Power size={14} />
                                                    </button>
                                                )}
                                                {hasAuthority && (
                                                    <>
                                                        <button
                                                            onClick={() => { setEditingYear(row); setShowEditModal(true); }}
                                                            className="p-2 hover:bg-slate-100  hover:text-primary rounded-lg transition-all"
                                                            title="Edit Configuration"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteYear(row.id)}
                                                            className="p-2 hover:bg-rose-50  hover:text-rose-500 rounded-lg transition-all"
                                                            title="Delete Session"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-4 border-b-table">
                                            {hasAuthority && (
                                                <button
                                                    onClick={() => openPromotionWizard(row)}
                                                    className="px-4 py-2 border text-black rounded-md font-bold text-[8px] uppercase tracking-widest flex items-center gap-2 hover:bg-black hover:text-white transition-all shadow-md group"
                                                >
                                                    <Zap size={10} className="group-hover:animate-pulse" /> Promote
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </DataTable>
                        </div>
                    )}
                </div>
            </div>

            {/* NEW CYCLE MODAL */}
            {showAddModal && (
                <div className="fixed inset-0 bg-[#001736]/90 backdrop-blur-md z-120 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-md shadow-2xl border border-white/20 p-10 overflow-hidden relative animate-in zoom-in duration-300">
                        <div className="flex justify-between items-center mb-10">
                            <h2 className="text-2xl font-bold text-[#001736] uppercase tracking-tight leading-none">NEW <span className="text-amber-400">Accadmic Year</span></h2>
                            <button onClick={() => setShowAddModal(false)} className="p-2.5 hover:text-rose-500 hover:bg-slate-50 rounded-md border border-transparent hover:border-slate-100 transition-all">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleAddYear} className="space-y-6 text-left">
                            <div className="space-y-2">
                                <label className="text-[9px] font-bold uppercase ml-1 tracking-widest">Year Identification</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="E.G. 2026-27"
                                    value={newYear.name}
                                    onChange={(e) => setNewYear({ ...newYear, name: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-slate-100 border rounded-md font-bold text-primary outline-none focus:bg-white focus:border-primary transition-all uppercase text-xs"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-bold uppercase ml-1 tracking-widest">Start Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={newYear.startDate}
                                        onChange={(e) => setNewYear({ ...newYear, startDate: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-100 border rounded-md font-bold text-primary outline-none focus:bg-white focus:border-primary transition-all text-[10px]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-bold uppercase ml-1 tracking-widest">End Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={newYear.endDate}
                                        onChange={(e) => setNewYear({ ...newYear, endDate: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-100 border rounded-md font-bold text-primary outline-none focus:bg-white focus:border-primary transition-all text-[10px]"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-primary text-white py-4 rounded-md font-bold text-[10px] uppercase tracking-widest shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                            >
                                <Plus className="w-4 h-4 opacity-40" /> Add Year
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* PROMOTION WIZARD MODAL */}
            {showPromoteModal && (
                <div className="fixed inset-0 bg-[#001736]/90 backdrop-blur-md z-120 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-3xl rounded-md shadow-2xl border border-white/20 p-10 animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center mb-10 border-b border-slate-100 pb-10">
                            <div>
                                <h2 className="text-3xl font-bold text-[#001736] uppercase tracking-tight leading-none">PROMOTION <span className="text-amber-500">ARCHITECTURE</span></h2>
                                {/* <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4 italic">Transition Payload: From {promotionData.fromYearName}</p> */}
                            </div>
                            <button onClick={() => setShowPromoteModal(false)} className="p-3 bg-slate-50 rounded-md text-slate-300 hover:text-rose-500 transition-all border border-slate-100">
                                <X className="w-8 h-8" />
                            </button>
                        </div>

                        <div className="space-y-10 text-left">
                            <div className="bg-[#001736] p-8 rounded-md text-white shadow-xl shadow-[#001736]/10 text-left">
                                <label className="block text-[10px] font-bold uppercase text-amber-400! mb-4 tracking-widest ml-1">Destination Registry Context</label>
                                <select
                                    value={promotionData.toYearId || ''}
                                    onChange={(e) => setPromotionData(prev => ({ ...prev, toYearId: e.target.value }))}
                                    className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-md font-bold text-white focus:border-amber-400 outline-none transition-all cursor-pointer uppercase text-[12px] tracking-widest"
                                >
                                    <option value="" className="bg-[#001736]">Identify Target Year</option>
                                    {years.filter(y => y.id !== promotionData.fromYearId).map(y => (
                                        <option key={y.id} value={y.id} className="bg-[#001736]">{y.year_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-8">
                                <div className="p-8 bg-black/5 rounded-md border border-black/10 flex flex-col gap-4">
                                    <h5 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Automated Institutional Sequence</h5>
                                    <p className="text-[11px] font-medium text-slate-500 leading-relaxed uppercase tracking-tight">
                                        Executing this protocol will promote students from <span className="text-primary font-bold">{promotionData.fromYearName}</span> to <span className="text-primary font-bold">{years.find(y => y.id == promotionData.toYearId)?.year_name || '...'}</span> following the 1st-10th grade institutional lifecycle.
                                        <br /><br />
                                        <span className="text-amber-600 font-bold">10th Grade students will be automatically archived to the Alumni registry.</span>
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={handlePromoteStudents}
                                disabled={!promotionData.toYearId || loading}
                                className="w-full bg-[#001736] text-white py-6 rounded-md font-bold text-[12px] uppercase tracking-[0.4em] shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-4 disabled:opacity-50 mt-4 active:scale-[0.98]"
                            >
                                {loading ? "SYNCHRONIZING MATRIX..." : "EXECUTE GLOBAL PROMOTION OF STUDENT"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* EDIT CYCLE MODAL */}
            {showEditModal && editingYear && (
                <div className="fixed inset-0 bg-[#001736]/90 backdrop-blur-md z-120 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-md shadow-2xl border border-white/20 p-10 overflow-hidden relative animate-in zoom-in duration-300">
                        <div className="flex justify-between items-center mb-10">
                            <h2 className="text-2xl font-bold text-[#001736] uppercase tracking-tight leading-none">EDIT <br /><span className="text-amber-500">CYCLE</span></h2>
                            <button onClick={() => setShowEditModal(false)} className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-slate-50 rounded-md border border-transparent hover:border-slate-100 transition-all">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateYear} className="space-y-6 text-left">
                            <div className="space-y-2">
                                <label className="text-[9px] font-bold uppercase text-slate-400 ml-1 tracking-widest">Year Identification</label>
                                <input
                                    type="text"
                                    required
                                    value={editingYear.year_name}
                                    onChange={(e) => setEditingYear({ ...editingYear, year_name: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-slate-100 border border-slate-200 rounded-md font-bold text-primary outline-none focus:bg-white focus:border-primary transition-all uppercase text-xs"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-bold uppercase text-slate-400 ml-1 tracking-widest">Start Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={editingYear.start_date?.split('T')[0]}
                                        onChange={(e) => setEditingYear({ ...editingYear, start_date: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-md font-bold text-primary outline-none focus:bg-white focus:border-primary transition-all text-[10px]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-bold uppercase text-slate-400 ml-1 tracking-widest">End Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={editingYear.end_date?.split('T')[0]}
                                        onChange={(e) => setEditingYear({ ...editingYear, end_date: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-md font-bold text-primary outline-none focus:bg-white focus:border-primary transition-all text-[10px]"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-primary text-white py-4 rounded-md font-bold text-[10px] uppercase tracking-widest shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                            >
                                <RefreshCw className="w-4 h-4 opacity-40 shrink-0" /> Commit Changes
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AcademicYearManager;
