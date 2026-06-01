import React, { useState, useEffect, useMemo } from 'react';
import { Save, Search, RefreshCw, IndianRupee, TrendingDown, Settings2, TrendingUp, Upload } from 'lucide-react';
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import { toast } from 'react-toastify';
import { getSalaryStructures, updateSalaryStructure } from '../../../../services/hrAPI';
import bulkImportAPI from '../../../../services/bulkImportAPI';

const StaffSalarySetup = ({ toggleSidebar }) => {
    const [structures, setStructures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [saving, setSaving] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isUploading, setIsUploading] = useState(false);
    const itemsPerPage = 10;

    useEffect(() => { setCurrentPage(1); }, [searchTerm]);

    const fetchStructures = async () => {
        try {
            setLoading(true);
            const data = await getSalaryStructures();
            setStructures(data);
        } catch {
            toast.error('Failed to load salary structures');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchStructures(); }, []);

    const handleUpdateField = (staffId, field, value) => {
        setStructures(prev => prev.map(s =>
            s.staff_id === staffId ? { ...s, [field]: value } : s
        ));
    };

    const handleKeyDown = (e, rowIndex, colIndex) => {
        const fields = ['basic', 'hra', 'da', 'pf', 'pt', 'esic', 'other'];
        let targetRow = rowIndex;
        let targetCol = colIndex;

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            targetRow = rowIndex - 1;
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            targetRow = rowIndex + 1;
        } else if (e.key === 'ArrowLeft') {
            if (colIndex > 0) {
                targetCol = colIndex - 1;
            } else if (rowIndex > 0) {
                targetRow = rowIndex - 1;
                targetCol = fields.length - 1;
            }
        } else if (e.key === 'ArrowRight') {
            if (colIndex < fields.length - 1) {
                targetCol = colIndex + 1;
            } else if (rowIndex < paginatedStructures.length - 1) {
                targetRow = rowIndex + 1;
                targetCol = 0;
            }
        } else {
            return;
        }

        if (targetRow >= 0 && targetRow < paginatedStructures.length) {
            const targetStaff = paginatedStructures[targetRow];
            const targetId = `${fields[targetCol]}-${targetStaff.staff_id}`;
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
                e.preventDefault();
                targetEl.focus();
                try {
                    targetEl.select();
                } catch {
                    // ignore
                }
            }
        }
    };


    const handleSaveAll = async () => {
        if (!structures.length) return;
        try {
            setSaving('all');
            for (const s of structures) {
                await updateSalaryStructure(s);
            }
            toast.success('All structures saved successfully');
        } catch {
            toast.error('Failed to save all');
        } finally {
            setSaving(null);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            setIsUploading(true);
            toast.info('Uploading and processing file...');
            const res = await bulkImportAPI.importSalarySetup(file);
            toast.success(res.message || 'Bulk import successful');
            fetchStructures();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to import data');
        } finally {
            setIsUploading(false);
            e.target.value = null;
        }
    };

    const filtered = useMemo(() =>
        structures.filter(s =>
            s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
        ), [structures, searchTerm]);

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginatedStructures = useMemo(() =>
        filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
        [filtered, currentPage]);

    const inputBase = "w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs font-bold text-[#001736] outline-none focus:border-[#001736] transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";
    const iconInput = "flex items-center gap-1 bg-white border border-slate-300 rounded px-2 py-1.5 focus-within:border-[#001736] transition-all";

    return (
        <div className="p-4 lg:p-8 space-y-6 min-h-screen bg-[#F8FAFC]">
            <ModuleHeader hideAcademicYear={true}
                title="Salary Configuration"
                subTitle="Define Institutional Earnings & Statutory Deductions"
                icon={Settings2}
                toggleSidebar={toggleSidebar}
            >
                <button onClick={fetchStructures} className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
            </ModuleHeader>

            {/* Search + Save All — separate siblings */}
            <div className="flex items-center gap-3">
                <div className="flex-1 bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                    <Search className="w-5 h-5 text-slate-400 shrink-0" />
                    <input
                        type="text"
                        placeholder="Search by name or employee ID..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-[#001736] placeholder:text-slate-300"
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="text-xs text-slate-400 hover:text-[#001736] font-bold transition-colors shrink-0">
                            Clear
                        </button>
                    )}
                </div>
                <div className="flex gap-3 shrink-0">
                    <label className="inline-flex items-center gap-2 px-5 py-3 bg-white text-[#001736] rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 cursor-pointer transition-all shadow-sm">
                        {isUploading ? <RefreshCw size={13} className="animate-spin" /> : <Upload size={13} />}
                        Bulk Import
                        <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                    </label>
                    <button
                        onClick={handleSaveAll}
                        disabled={saving === 'all' || loading}
                        className="inline-flex items-center gap-2 px-5 py-3 bg-[#001736] text-white rounded-xl border border-transparent text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 active:scale-95 disabled:opacity-50 transition-all shadow-sm"
                    >
                        {saving === 'all' ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                        Save All
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-black  shadow-sm overflow-hidden">
                <div className="w-full overflow-x-auto">
                    <table className="w-full border-collapse text-[11px] min-w-[1000px]" style={{ tableLayout: 'fixed' }}>
                        <colgroup>
                            <col style={{ width: '20%' }} />
                            <col style={{ width: '10%' }} />
                            <col style={{ width: '8%' }} />
                            <col style={{ width: '8%' }} />
                            <col style={{ width: '8%' }} />
                            <col style={{ width: '8%' }} />
                            <col style={{ width: '8%' }} />
                            <col style={{ width: '8%' }} />
                            <col style={{ width: '8%' }} />
                            <col style={{ width: '10%' }} />
                        </colgroup>

                        <thead>
                            {/* Group row */}
                            <tr className="bg-[#91a0ec] text-black">
                                <th rowSpan={2} className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest border border-black align-middle">
                                    Staff Name
                                </th>
                                <th colSpan={4} className="px-3 py-3 text-center text-[11px] font-black uppercase tracking-widest border border-black">
                                    <span className="flex items-center justify-center gap-1.5">
                                        <TrendingUp size={12} /> Earnings
                                    </span>
                                </th>
                                <th colSpan={5} className="px-3 py-3 text-center text-[11px] font-black uppercase tracking-widest border border-black">
                                    <span className="flex items-center justify-center gap-1.5">
                                        <TrendingDown size={12} /> Deductions
                                    </span>
                                </th>
                            </tr>

                            {/* Sub-header row */}
                            <tr className="bg-[#a8b4f0] text-black text-[10px] font-black uppercase tracking-widest">
                                <th className="px-3 py-2 text-center border border-black">Basic</th>
                                <th className="px-3 py-2 text-center border border-black">HRA</th>
                                <th className="px-3 py-2 text-center border border-black">DA</th>
                                <th className="px-3 py-2 text-center border border-black bg-indigo-100">Gross</th>
                                <th className="px-3 py-2 text-center border border-black">PF</th>
                                <th className="px-3 py-2 text-center border border-black">PT</th>
                                <th className="px-3 py-2 text-center border border-black">ESIC</th>
                                <th className="px-3 py-2 text-center border border-black">Other</th>
                                <th className="px-3 py-2 text-center border border-black bg-red-100">Total Ded.</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        {Array.from({ length: 10 }).map((__, j) => (
                                            <td key={j} className="px-3 py-4 border border-black">
                                                <div className="h-4 bg-slate-100 rounded-full" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : paginatedStructures.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-6 py-16 text-center border border-black">
                                        <p className="text-sm font-bold text-slate-400">No salary structures found</p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedStructures.map((s, idx) => {
                                    const basic = parseFloat(s.basic_salary) || 0;
                                    const hra = parseFloat(s.hra) || 0;
                                    const da = parseFloat(s.da) || 0;
                                    const gross = basic + hra + da;
                                    const pf = parseFloat(s.pf) || 0;
                                    const pt = parseFloat(s.pt) || 0;
                                    const esic = parseFloat(s.esic) || 0;
                                    const other = parseFloat(s.other_deductions) || 0;
                                    const totalDed = pf + pt + esic + other;

                                    return (
                                        <tr key={s.staff_id} className={`transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'} hover:bg-slate-100/60`}>

                                            {/* Staff Name */}
                                            <td className="px-4 py-3 border border-black">
                                                <p className="text-sm font-black text-[#001736] leading-tight truncate">{s.full_name}</p>
                                                <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                                                    {s.employee_id}{s.designation ? ` · ${s.designation}` : ''}
                                                </p>
                                            </td>

                                            {/* Basic */}
                                            <td className="px-2 py-3 border border-black">
                                                <div className={iconInput}>
                                                    <IndianRupee size={10} className="text-slate-400 shrink-0" />
                                                    <input
                                                        id={`basic-${s.staff_id}`}
                                                        name={`basic-${s.staff_id}`}
                                                        type="number" min="0"
                                                        value={s.basic_salary ?? ''}
                                                        onChange={e => handleUpdateField(s.staff_id, 'basic_salary', e.target.value)}
                                                        onKeyDown={e => handleKeyDown(e, idx, 0)}
                                                        className="w-full bg-transparent border-none outline-none text-xs font-black text-[#001736] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    />
                                                </div>
                                            </td>

                                            {/* HRA */}
                                            <td className="px-2 py-3 border border-black">
                                                <input id={`hra-${s.staff_id}`} name={`hra-${s.staff_id}`}
                                                    type="number" min="0" value={s.hra ?? ''}
                                                    onChange={e => handleUpdateField(s.staff_id, 'hra', e.target.value)}
                                                    onKeyDown={e => handleKeyDown(e, idx, 1)}
                                                    className={inputBase} />
                                            </td>

                                            {/* DA */}
                                            <td className="px-2 py-3 border border-black">
                                                <input id={`da-${s.staff_id}`} name={`da-${s.staff_id}`}
                                                    type="number" min="0" value={s.da ?? ''}
                                                    onChange={e => handleUpdateField(s.staff_id, 'da', e.target.value)}
                                                    onKeyDown={e => handleKeyDown(e, idx, 2)}
                                                    className={inputBase} />
                                            </td>

                                            {/* Gross (read-only) */}
                                            <td className="px-2 py-3 border border-black bg-indigo-50/40 text-center">
                                                <p className="text-xs font-black text-indigo-700">₹{gross.toLocaleString('en-IN')}</p>
                                            </td>

                                            {/* PF */}
                                            <td className="px-2 py-3 border border-black">
                                                <input id={`pf-${s.staff_id}`} name={`pf-${s.staff_id}`}
                                                    type="number" min="0" value={s.pf ?? ''}
                                                    onChange={e => handleUpdateField(s.staff_id, 'pf', e.target.value)}
                                                    onKeyDown={e => handleKeyDown(e, idx, 3)}
                                                    className={inputBase} />
                                            </td>

                                            {/* PT */}
                                            <td className="px-2 py-3 border border-black">
                                                <input id={`pt-${s.staff_id}`} name={`pt-${s.staff_id}`}
                                                    type="number" min="0" value={s.pt ?? ''}
                                                    onChange={e => handleUpdateField(s.staff_id, 'pt', e.target.value)}
                                                    onKeyDown={e => handleKeyDown(e, idx, 4)}
                                                    className={inputBase} />
                                            </td>

                                            {/* ESIC */}
                                            <td className="px-2 py-3 border border-black">
                                                <input id={`esic-${s.staff_id}`} name={`esic-${s.staff_id}`}
                                                    type="number" min="0" value={s.esic ?? ''}
                                                    onChange={e => handleUpdateField(s.staff_id, 'esic', e.target.value)}
                                                    onKeyDown={e => handleKeyDown(e, idx, 5)}
                                                    className={inputBase} />
                                            </td>

                                            {/* Other Deductions */}
                                            <td className="px-2 py-3 border border-black">
                                                <input id={`other-${s.staff_id}`} name={`other-${s.staff_id}`}
                                                    type="number" min="0" value={s.other_deductions ?? ''}
                                                    onChange={e => handleUpdateField(s.staff_id, 'other_deductions', e.target.value)}
                                                    onKeyDown={e => handleKeyDown(e, idx, 6)}
                                                    className={inputBase} />
                                            </td>

                                            {/* Total Deduction (read-only) */}
                                            <td className="px-2 py-3 border border-black bg-red-50/40 text-center">
                                                <p className="text-xs font-black text-red-600">₹{totalDed.toLocaleString('en-IN')}</p>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="px-6 py-4 border-t border-black flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Registry: {filtered.length} Configured Structures
                    </span>
                    <div className="flex items-center gap-3">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-500 hover:bg-[#001736] hover:text-white disabled:opacity-30 transition-all"
                        >PREV</button>
                        <span className="text-xs font-black uppercase tracking-widest text-[#001736]">
                            PAGE {currentPage} OF {totalPages || 1}
                        </span>
                        <button
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-500 hover:bg-[#001736] hover:text-white disabled:opacity-30 transition-all"
                        >NEXT</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaffSalarySetup;
