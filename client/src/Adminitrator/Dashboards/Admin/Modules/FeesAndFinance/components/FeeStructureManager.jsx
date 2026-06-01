import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Plus, Save, Trash2, Truck, GraduationCap, Calculator, ArrowLeft,
    Download, ShieldCheck, Edit3, Eye, Zap, Search, Filter, ChevronRight,
    CheckCircle2, AlertCircle, Loader2, TrendingUp, BookOpen, ChevronDown, X, FileText
} from 'lucide-react';
import { toast } from 'react-toastify';
import DataTable from '../../../../../admcomponents/DataTable';
import { getFeeStructures, saveFeeStructure, deleteFeeEntry, getTransportFees, saveTransportFees } from '../../../../../../services/FeesAndFinance/feeStructureAPI';
import { getClassrooms } from '../../../../../../services/classroomAPI';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2';

const getGradeWeight = (gradeName) => {
    if (!gradeName) return 999;
    const cleanName = gradeName.toLowerCase().trim();
    if (cleanName.includes('nursery')) return 1;
    if (cleanName.includes('jr.kg') || cleanName.includes('junior')) return 2;
    if (cleanName.includes('sr.kg') || cleanName.includes('senior')) return 3;
    const match = cleanName.match(/^(\d+)/);
    if (match) {
        return 10 + parseInt(match[1]);
    }
    return 999;
};

/**
 * FeeStructureManager - Revamped for High-Efficiency Institutional Management.
 * Features: Multi-View Workflow, Combined Fee Analytics, PDF Reporting, Decoupled Transport Mgmt.
 */
const FeeStructureManager = ({ selectedYear, selectedYearName, isMobileSearchOpen }) => {
    // 1. Framework State
    const [viewMode, setViewMode] = useState('registry'); // 'registry', 'classForm', 'transportForm'
    const [classrooms, setClassrooms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // 2. Data State
    const [globalTransport, setGlobalTransport] = useState({
        "0-5km": 0,
        "5-7km": 0,
        "above 7km": 0
    });
    const [registry, setRegistry] = useState([]);
    const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
    const [selectedStudentTypeFilter, setSelectedStudentTypeFilter] = useState('new'); // 'new' or 'old'
    const [viewData, setViewData] = useState(null); // For Eye-icon view modal


    // 3. Form State
    const [editingGrade, setEditingGrade] = useState({
        gradeName: '',
        studentType: 'new',
        heads: {
            admission: 0,
            tuition: 0,
            term: 0,
            computer: 0,
            other: 0
        },
        transport: {
            "0-5km": 0,
            "5-7km": 0,
            "above 7km": 0
        }
    });

    // 4. Initial Sync (Classes only)
    useEffect(() => {
        const bootstrap = async () => {
            try {
                setLoading(true);
                const classes = await getClassrooms();
                const uniqueGrades = [...new Set(classes.map(c => c.class_name))];
                uniqueGrades.sort((a, b) => getGradeWeight(a) - getGradeWeight(b));
                setClassrooms(uniqueGrades);
            } catch {
                toast.error("Registry Sync Failed");
            } finally {
                setLoading(false);
            }
        };
        bootstrap();
    }, []);

    const syncRegistry = useCallback(async () => {
        if (!selectedYear) return;
        try {
            setLoading(true);
            const [data, transport] = await Promise.all([
                getFeeStructures(selectedYear),
                getTransportFees(selectedYear)
            ]);

            // Sync Transport (Dedicated record)
            if (transport) {
                setGlobalTransport({
                    "0-5km": transport.transport_0_5km,
                    "5-7km": transport.transport_5_7km,
                    "above 7km": transport.transport_above_7km
                });
            }

            // Sync Classes
            const mappedRegistry = data.map(row => ({
                id: row.id,
                grade: row.grade,
                studentType: row.student_type,
                heads: {
                    admission: parseFloat(row.admission_fee || 0),
                    tuition: parseFloat(row.tuition_fee || 0),
                    term: parseFloat(row.term_fee || 0),
                    computer: parseFloat(row.computer_fee || 0),
                    other: parseFloat(row.other_fee || 0)
                },
                totalYearly: parseFloat(row.admission_fee || 0) +
                    parseFloat(row.tuition_fee || 0) +
                    parseFloat(row.term_fee || 0) +
                    parseFloat(row.computer_fee || 0) +
                    parseFloat(row.other_fee || 0)
            }));

            // Sort sequentially from Nursery to 10th
            mappedRegistry.sort((a, b) => getGradeWeight(a.grade) - getGradeWeight(b.grade));

            setRegistry(mappedRegistry);
        } catch {
            toast.error("Registry Refresh Failed");
        } finally {
            setLoading(false);
        }
    }, [selectedYear]);

    useEffect(() => { syncRegistry(); }, [syncRegistry]);

    // 5. Logical Helpers
    const calculateTotal = (heads) => Object.values(heads).reduce((a, b) => a + parseFloat(b || 0), 0);

    const handleSaveClassStructure = async () => {
        if (!editingGrade.gradeName) return toast.warning("Grade selection required");
        try {
            setSaving(true);

            await saveFeeStructure({
                academic_year_id: selectedYear,
                grade: editingGrade.gradeName,
                student_type: editingGrade.studentType,
                admission_fee: editingGrade.heads.admission,
                tuition_fee: editingGrade.heads.tuition,
                term_fee: editingGrade.heads.term,
                computer_fee: editingGrade.heads.computer,
                other_fee: editingGrade.heads.other,
                // Transport for specific classes usually follows global, but we send 0 here
                transport_0_5km: 0,
                transport_5_7km: 0,
                transport_above_7km: 0
            });
            toast.success("Standard Structure Finalized");
            setViewMode('registry');
            syncRegistry();
        } catch {
            toast.error("Storage Matrix Failed");
        } finally {
            setSaving(false);
        }
    };

    const handleSaveTransport = async () => {
        try {
            setSaving(true);
            await saveTransportFees({
                academic_year_id: selectedYear,
                transport_0_5km: globalTransport["0-5km"],
                transport_5_7km: globalTransport["5-7km"],
                transport_above_7km: globalTransport["above 7km"]
            });
            toast.success("Global Transport Matrix Updated");
            setViewMode('registry');
            syncRegistry();
        } catch {
            toast.error("Transport Sync Error");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteRecord = async (id) => {
        const result = await Swal.fire({
            title: 'Delete Fee Structure',
            text: "Are you sure you want to permanently remove this fee structure? This cannot be undone.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#001736',
            cancelButtonColor: '#ef4444',
            confirmButtonText: 'Yes, Delete It',
            cancelButtonText: 'Cancel',
            background: '#ffffff',
            customClass: {
                title: 'text-[14px] font-bold uppercase tracking-widest text-[#001736]',
                content: 'text-[12px] uppercase text-slate-500',
                confirmButton: 'text-[10px] font-black uppercase tracking-widest px-8 py-4 rounded-md shadow-lg',
                cancelButton: 'text-[10px] font-black uppercase tracking-widest px-8 py-4 rounded-md'
            }
        });

        if (result.isConfirmed) {
            try {
                setSaving(true);
                await deleteFeeEntry(id);
                toast.success("Institutional Record Deleted");
                syncRegistry();
            } catch {
                toast.error("Deletion Protocol Failed");
            } finally {
                setSaving(false);
            }
        }
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        const schoolName = "NEW GRACE ACADEMY";
        const academicYear = `Academic Year: ${selectedYearName}`;

        doc.setFontSize(22);
        doc.text(schoolName, 105, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.text("Official Fee Structure Details", 105, 30, { align: 'center' });
        doc.text(academicYear, 105, 37, { align: 'center' });

        const tableBody = registry.map(row => [
            `${row.grade} (${row.studentType})`,
            `Rs. ${row.heads.admission.toLocaleString()}`,
            `Rs. ${row.heads.tuition.toLocaleString()}`,
            `Rs. ${(row.heads.term + row.heads.computer + row.heads.other).toLocaleString()}`,
            `Rs. ${row.totalYearly.toLocaleString()}`
        ]);

        autoTable(doc, {
            startY: 45,
            head: [['Grade/Category', 'Admission', 'Tuition', 'Other Fees', 'Total Annual']],
            body: tableBody,
            theme: 'striped',
            headStyles: { fillColor: [0, 23, 54] },
            styles: { fontSize: 9 }
        });

        // Transport Section
        const finalY = (doc).lastAutoTable.finalY + 15;
        doc.setFontSize(14);
        doc.text("Transport Rate Matrix", 14, finalY);
        doc.setFontSize(10);

        const transportBody = [
            ['0 - 5 km', `Rs. ${globalTransport["0-5km"].toLocaleString()}`],
            ['5 - 7 km', `Rs. ${globalTransport["5-7km"].toLocaleString()}`],
            ['Above 7 km', `Rs. ${globalTransport["above 7km"].toLocaleString()}`]
        ];

        autoTable(doc, {
            startY: finalY + 5,
            head: [['Distance Range', 'Annual Rate']],
            body: transportBody,
            theme: 'plain',
            headStyles: { fillColor: [255, 182, 6] },
            styles: { fontSize: 10 }
        });

        doc.save(`Fee_Structure_${selectedYearName}.pdf`);
    };

    const filteredRegistry = useMemo(() => {
        return registry
            .filter(r => (selectedClassFilter === 'ALL' || r.grade === selectedClassFilter))
            .filter(r => (selectedStudentTypeFilter === 'ALL' || r.studentType === selectedStudentTypeFilter));
    }, [registry, selectedClassFilter, selectedStudentTypeFilter]);


    if (loading && registry.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
                <Loader2 className="w-12 h-12 text-[#001736] animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Institutional Sync...</p>
            </div>
        );
    }

    return (
        <div className="p-0 md:p-0 space-y-12 animate-in fade-in duration-500 min-h-screen font-sans">

            {/* 1. Dashboard-Grade Transport Metrics */}
            {viewMode === 'registry' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { range: "0-5km", label: "0 TO 5 KM RANGE", color: "indigo", desc: "Short Distance Rate" },
                        { range: "5-7km", label: "5 TO 7 KM RANGE", color: "emerald", desc: "Mid Distance Rate" },
                        { range: "above 7km", label: "ABOVE 7 KM RANGE", color: "amber", desc: "Long Distance Rate" }
                    ].map(card => {
                        const colorMap = {
                            indigo: { border: 'border-indigo-600', bg: 'bg-indigo-50/50', iconBg: 'bg-indigo-600', text: 'text-indigo-900' },
                            emerald: { border: 'border-emerald-600', bg: 'bg-emerald-50/50', iconBg: 'bg-emerald-600', text: 'text-emerald-900' },
                            amber: { border: 'border-amber-600', bg: 'bg-amber-50/50', iconBg: 'bg-amber-600', text: 'text-amber-900' },
                        };
                        const theme = colorMap[card.color];
                        return (
                            <div key={card.range} className={`p-6 rounded-md border-l-4 transition-all duration-300 group hover:shadow-xl flex items-center justify-between gap-5 shadow-sm ${theme.border} ${theme.bg}`}>
                                <div className="flex-1">
                                    <p className={`text-[8px] font-black uppercase tracking-[0.2em] mb-1 opacity-60 ${theme.text}`}>{card.label}</p>
                                    <h3 className={`text-2xl font-black tracking-tight leading-tight ${theme.text} uppercase`}>₹{(globalTransport[card.range] || 0).toLocaleString()}</h3>
                                    <p className="text-[7px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{card.desc}</p>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <div className={`w-12 h-12 rounded-md ${theme.iconBg} flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform border border-white/20 shrink-0`}>
                                        <Truck className="w-5 h-5 text-white" />
                                    </div>
                                    <button onClick={() => setViewMode('transportForm')} className="p-2 opacity-100  transition-opacity bg-white/80 rounded-lg hover:bg-white text-slate-400 hover:text-[#001736] border border-black/5 flex items-center justify-center cursor-pointer">
                                        <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {viewMode === 'registry' ? (
                <>
                    {/* 2. Registry Action Bar */}
                    <div className={`${isMobileSearchOpen ? 'flex' : 'hidden lg:flex'} flex-wrap items-center gap-3 w-full justify-start animate-in slide-in-from-top-2 duration-300 p-4 lg:p-0 bg-white lg:bg-transparent rounded-3xl lg:rounded-none shadow-2xl lg:shadow-none`}>
                        <div className="flex items-center gap-3 bg-white px-5 rounded-md border border-institutional shadow-sm focus-within:ring-4 focus-within:ring-[#001736]/5 h-[46px] w-full md:w-auto shrink-0">
                            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                            <select
                                value={selectedClassFilter}
                                onChange={(e) => setSelectedClassFilter(e.target.value)}
                                className="h-full bg-transparent text-[10px] font-black text-[#001736] uppercase tracking-widest outline-none pr-6 cursor-pointer w-full"
                            >
                                <option value="ALL">All Classes</option>
                                {classrooms.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="p-1 rounded-md bg-white flex border border-institutional shadow-sm h-[46px] items-center shrink-0 w-full md:w-auto">
                            {['new', 'old'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setSelectedStudentTypeFilter(type)}
                                    className={`px-5 h-[38px] rounded-md text-[9px] font-black uppercase transition-all cursor-pointer flex-1 md:flex-initial text-center ${selectedStudentTypeFilter === type ? 'bg-[#001736] text-white shadow-md' : 'text-slate-400 hover:text-[#001736]'}`}
                                >
                                    {type} Students
                                </button>
                            ))}
                        </div>
                        <button 
                            onClick={handleExportPDF} 
                            className="h-[46px] px-6 rounded-md border border-institutional text-[#001736] hover:bg-slate-50 transition-all flex items-center justify-center gap-2 cursor-pointer bg-white shadow-sm font-black w-[calc(50%-6px)] md:w-auto shrink-0"
                        >
                            <Download className="w-4 h-4 shrink-0 text-[#001736]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#001736]">Export</span>
                        </button>
                        <button 
                            onClick={() => setViewMode('transportForm')} 
                            className="h-[46px] px-6 rounded-md border border-institutional transition-all flex items-center justify-center gap-2 cursor-pointer bg-white text-[#001736] hover:bg-slate-50 shadow-sm font-black w-[calc(50%-6px)] md:w-auto shrink-0"
                        >
                            <Truck className="w-4 h-4 shrink-0 text-[#001736]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#001736]">Rates</span>
                        </button>
                        <button
                            onClick={() => {
                                setEditingGrade({
                                    gradeName: classrooms[0] || '', studentType: 'new',
                                    heads: { admission: 0, tuition: 0, term: 0, computer: 0, other: 0 },
                                    transport: { "0-5km": 0, "5-7km": 0, "above 7km": 0 }
                                });
                                setViewMode('classForm');
                            }}
                            className="h-[46px] px-6 rounded-md border border-institutional text-[#001736] hover:bg-slate-50 transition-all flex items-center justify-center gap-2 cursor-pointer bg-white shadow-sm font-black w-full md:w-auto shrink-0"
                        >
                            <Plus className="w-4 h-4 shrink-0 text-[#001736]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#001736]">Create New</span>
                        </button>
                    </div>                    {/* 3. DataTable Index */}
                    <DataTable
                        headers={[
                            { label: "Standard / Category", className: "py-6" },
                            { label: "Admission", className: "text-center" },
                            { label: "Tuition", className: "text-center" },
                            { label: "Other Fee", className: "text-center" },
                            { label: "Annual Total", className: "text-center" },
                            { label: "Actions", className: "text-center" }
                        ]}
                        columnCount={6}
                        loading={loading}
                    >
                        {filteredRegistry.map((row, idx) => (
                            <tr key={idx} className="hover-table-row transition-colors group">
                                <td className="px-6 py-4 border-b-table border-r-table">
                                    <div className="flex items-center gap-5 text-left">
                                        <div className="w-10 h-10 bg-white border-table rounded-md flex items-center justify-center text-sm font-black text-[#001736] shadow-sm">{row.grade.charAt(0)}</div>
                                        <div>
                                            <p className="text-[12px] font-bold text-table-cell uppercase tracking-tight">
                                                {row.grade}
                                                <span className={`ml-2 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${row.studentType === 'new' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                                                    {row.studentType}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </td>

                                <td className="px-4 py-4 border-b-table border-r-table text-center font-bold text-table-cell text-[12px]">₹{(row.heads.admission || 0).toLocaleString()}</td>
                                <td className="px-4 py-4 border-b-table border-r-table text-center font-bold text-table-cell text-[12px]">₹{(row.heads.tuition || 0).toLocaleString()}</td>
                                <td className="px-4 py-4 border-b-table border-r-table text-center font-bold text-table-cell text-[12px]">₹{(row.heads.term + row.heads.computer + row.heads.other).toLocaleString()}</td>
                                <td className="px-4 py-4 border-b-table border-r-table text-center font-black text-table-cell text-[14px]">₹{row.totalYearly.toLocaleString()}</td>
                                <td className="px-6 py-4 text-center border-b-table">
                                    <div className="flex justify-center gap-3">
                                        <button onClick={() => setViewData(row)} className="p-2.5 bg-white border-table text-table-cell rounded-md cursor-pointer hover:bg-gray-400 hover:text-white transition-all shadow-sm active:scale-95" title="View Details"><Eye className="w-3.5 h-3.5" /></button>
                                        <button onClick={() => {
                                            setEditingGrade({ gradeName: row.grade, studentType: row.studentType, heads: row.heads, transport: row.transport });
                                            setViewMode('classForm');
                                        }} className="p-2.5 bg-white border-table text-table-cell rounded-md cursor-pointer hover:bg-gray-400 hover:text-white transition-all shadow-sm active:scale-95" title="Edit Structure"><Edit3 className="w-3.5 h-3.5" /></button>
                                        <button onClick={() => handleDeleteRecord(row.id)} className="p-2.5 bg-white border-table text-table-cell rounded-md cursor-pointer hover:bg-gray-400 hover:text-white transition-all shadow-sm active:scale-95" title="Delete Record"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </DataTable>
                </>
            ) : viewMode === 'classForm' ? (
                <div className="animate-in slide-in-from-bottom-8 duration-700 bg-white rounded-md border border-institutional shadow-3xl p-10 lg:p-14 space-y-12">
                    {/* Class Fee Form Header */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 border-b border-slate-100 pb-10">
                        <div className="flex items-center gap-8 text-left">
                            <button onClick={() => setViewMode('registry')} className="p-4 rounded-md border border-institutional text-slate-400 hover:bg-[#001736] hover:text-white transition-all cursor-pointer">
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                            <div>
                                <h2 className="text-3xl font-black text-[#001736] uppercase tracking-tighter">Grade Matrix</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Define standard academic fees</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full sm:w-auto">
                            <div className="p-1.5 rounded-md flex border border-institutional w-full sm:w-auto justify-center">
                                {['new', 'old'].map(type => (
                                    <button
                                        key={type} onClick={() => setEditingGrade(prev => ({ ...prev, studentType: type }))}
                                        className={`px-6 sm:px-8 py-3 rounded-md text-[9px] sm:text-[10px] font-black uppercase transition-all ${editingGrade.studentType === type ? 'bg-amber-400 text-white shadow-lg shadow-amber-100' : 'text-slate-400'} cursor-pointer flex-1 sm:flex-none`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>

                            <div className="relative group w-full sm:w-auto">
                                <select
                                    value={editingGrade.gradeName}
                                    onChange={(e) => setEditingGrade(prev => ({ ...prev, gradeName: e.target.value }))}
                                    className="w-full border border-institutional px-6 sm:px-8 py-4 rounded-md font-bold text-[10px] sm:text-[11px] uppercase outline-none shadow-sm sm:min-w-48 appearance-none bg-white cursor-pointer"
                                >
                                    <option value="">Select Grade</option>
                                    {classrooms.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-focus-within:text-[#001736]" />
                            </div>
                        </div>
                    </div>

                    {/* Summary Boxes */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {[
                            { label: "Annual Total", val: calculateTotal(editingGrade.heads), color: 'emerald' },
                            { label: "Term 1 Split", val: calculateTotal(editingGrade.heads) / 2, color: 'indigo' },
                            { label: "Term 2 Split", val: calculateTotal(editingGrade.heads) / 2, color: 'amber' }
                        ].map(box => (
                            <div key={box.label} className="bg-slate-50 p-4 sm:p-6 rounded-md border border-institutional text-center space-y-1 sm:space-y-2 shadow-sm">
                                <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">{box.label}</p>
                                <h4 className={`text-xl sm:text-3xl font-black text-${box.color}-600 tracking-tighter`}>₹{box.val.toLocaleString()}</h4>
                            </div>
                        ))}
                    </div>

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 px-4 text-left">
                        {[
                            { id: 'admission', label: 'Admission Fee' },
                            { id: 'tuition', label: 'Tuition Fee' },
                            { id: 'term', label: 'Term Fee' },
                            { id: 'computer', label: 'Computer Fee' },
                            { id: 'other', label: 'Other Fee' }
                        ].map(field => (
                            <div key={field.id} className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{field.label}</label>
                                <div className="flex items-center gap-4 bg-white border-institutional border p-4 rounded-md focus-within:ring-4 focus-within:ring-[#001736]/5 transition-all">
                                    <span className="text-slate-300 font-bold text-lg">₹</span>
                                    <input
                                        type="number" value={editingGrade.heads[field.id]}
                                        onChange={(e) => setEditingGrade(prev => ({ ...prev, heads: { ...prev.heads, [field.id]: e.target.value } }))}
                                        className="w-full bg-transparent font-bold text-[#001736] outline-none text-base" placeholder="0"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col items-center pt-10">
                        <button
                            onClick={handleSaveClassStructure} disabled={saving}
                            className="w-full md:w-auto md:min-w-[400px] py-6 bg-[#001736] text-white rounded-md text-[12px] font-black uppercase tracking-[0.5em] shadow-2xl hover:bg-black transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                            {saving ? 'Synchronizing...' : 'Save Structure'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="animate-in slide-in-from-bottom-8 duration-700 bg-white rounded-md border border-institutional shadow-3xl p-10 lg:p-14 space-y-12">
                    {/* Transport Form Header */}
                    <div className="flex items-center gap-8 text-left border-b border-slate-100 pb-10">
                        <button onClick={() => setViewMode('registry')} className="p-4 rounded-md border border-institutional text-slate-400 hover:bg-[#001736] hover:text-white! transition-all cursor-pointer">
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div>
                            <h2 className="text-2xl font-black text-[#001736] uppercase tracking-tighter">Transport Fees</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global distance-based Annual pricing</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-left">
                        {[
                            { id: "0-5km", label: "Short Range Annual (0-5 km)" },
                            { id: "5-7km", label: "Mid Range Annual (5-7 km)" },
                            { id: "above 7km", label: "Long Range Annual (Above 7 km)" }
                        ].map(range => (
                            <div key={range.id} className="space-y-4">
                                <label className="text-[11px] font-black text-black uppercase tracking-widest ml-1">{range.label}</label>
                                <div className="mt-3 flex items-center gap-4 bg-slate-50 border border-institutional p-3 rounded-md focus-within:bg-white focus-within:ring-8 focus-within:ring-[#001736]/5 transition-all">
                                    <span className="text-slate-300 font-black text-2xl">₹</span>
                                    <input
                                        type="number" value={globalTransport[range.id]}
                                        onChange={(e) => setGlobalTransport(prev => ({ ...prev, [range.id]: e.target.value }))}
                                        className="w-full bg-transparent font-black text-[#001736] outline-none text-2xl" placeholder="0"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col items-center pt-10">
                        <button
                            onClick={handleSaveTransport} disabled={saving}
                            className="w-full md:w-auto md:min-w-[400px] py-6 bg-[#001736] text-white  rounded-md text-[12px] font-black uppercase tracking-[0.5em] shadow-2xl hover:bg-[#001736] transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                            {saving ? 'Updating Rates...' : 'Update Transport Rates'}
                        </button>
                    </div>
                </div>
            )}

            {/* Granular Detail Modal (Eye Icon) */}
            {viewData && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-100 flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl w-full max-w-2xl shadow-4xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="bg-[#001736] p-8 flex items-center justify-between text-white">
                            <div>
                                <h3 className="text-2xl font-black text-white! uppercase tracking-tight">{viewData.grade} Class Fee Details</h3>
                                <p className="text-[10px] uppercase font-bold tracking-widest ">Term-wise distribution breakdown</p>
                            </div>
                            <button onClick={() => setViewData(null)} className="p-3 hover:bg-white/10 rounded-md transition-all cursor-pointer">
                                <X className="w-6 h-6 text-white!" />
                            </button>
                        </div>
                        <div className="p-10 space-y-8">
                            <div className="grid grid-cols-3 gap-8 text-left">
                                <div className="space-y-4 p-6 bg-slate-50 rounded-md border border-institutional">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Annual Fee</p>
                                    <h4 className="text-3xl font-black text-[#001736]">₹{(viewData.totalYearly).toLocaleString()}</h4>
                                </div>
                                <div className="space-y-4 p-6 bg-slate-50 rounded-md border border-institutional">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Term 1 (50%)</p>
                                    <h4 className="text-3xl font-black text-[#001736]">₹{(viewData.totalYearly / 2).toLocaleString()}</h4>
                                </div>
                                <div className="space-y-4 p-6 bg-slate-50 rounded-md border border-institutional">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Term 2 (50%)</p>
                                    <h4 className="text-3xl font-black text-[#001736]">₹{(viewData.totalYearly / 2).toLocaleString()}</h4>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-[10px] font-black uppercase text-[#001736] tracking-widest border-b pb-4 px-2">Heads Breakdown</p>
                                {Object.entries(viewData.heads).map(([head, val]) => (
                                    <div key={head} className="flex items-center justify-between px-4 py-2 hover:bg-slate-50 rounded-lg group transition-all">
                                        <span className="text-[11px] font-bold text-slate-500 uppercase group-hover:text-[#001736]">{head} Fee</span>
                                        <span className="text-sm font-black text-[#001736]">₹{val.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeeStructureManager;
