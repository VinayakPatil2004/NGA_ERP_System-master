import React, { useState, useEffect, useCallback } from 'react';
import {
    Trophy, Plus, Save, Trash2, X,
    RefreshCw, AlertCircle, Info, Hash, Star
} from 'lucide-react';
import { toast } from 'react-toastify';
import ModuleHeader from '../../../../admcomponents/ModuleHeader';
import * as ExamAPI from '../../../../../services/examAPI';

const GradingManager = ({ toggleSidebar }) => {
    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchGrades = useCallback(async (showToast = false) => {
        try {
            setLoading(true);
            const data = await ExamAPI.getGradingSystem();
            setGrades(data);
            if (showToast === true) {
                toast.success("Grading system refreshed");
            }
        } catch {
            toast.error("Failed to load grading system");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchGrades();
    }, [fetchGrades]);

    const handleAddGrade = () => {
        setGrades([...grades, { grade_name: '', min_percent: 0, max_percent: 0, grade_points: 0, remark: '' }]);
    };

    const handleRemoveGrade = (index) => {
        const updated = grades.filter((_, i) => i !== index);
        setGrades(updated);
    };

    const handleGradeChange = (index, field, value) => {
        const updated = [...grades];
        updated[index][field] = value;
        setGrades(updated);
    };

    const handleSave = async () => {
        try {
            // Parse numeric strings to actual numbers to prevent DB strict mode errors
            const formattedGrades = grades.map(g => ({
                ...g,
                min_percent: Number(g.min_percent) || 0,
                max_percent: Number(g.max_percent) || 0,
                grade_points: Number(g.grade_points) || 0,
            }));

            await ExamAPI.saveGradingSystem({ grades: formattedGrades });
            toast.success("Institutional grading system updated");
            fetchGrades();
        } catch {
            toast.error("Failed to save grading system");
        }
    };

    return (
        <div className="p-4 lg:p-8 bg-[#F8FAFC] min-h-screen font-sans text-left pb-24 anim-fade-in">
            <ModuleHeader
                title="Grading System"
                subTitle="Configure Institutional Grade Ranges & Point Scales"
                icon={Star}
                badge={`GRADES: ${grades.length}`}
                toggleSidebar={toggleSidebar}
            >
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-3 bg-white text-black! text-[11px] font-bold rounded-md hover:bg-black hover:text-white transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save className="w-4 h-4" />
                        SAVE CONFIGURATION
                    </button>
                    <button
                        onClick={() => fetchGrades(true)}
                        disabled={loading}
                        className="p-3 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        <RefreshCw size={18} className={`text-[#001736] ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                    </button>
                </div>
            </ModuleHeader>

            <div className="mt-8 bg-white border border-slate-200 rounded-md overflow-hidden shadow-sm">
                <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-50 rounded-md flex items-center justify-center text-indigo-600">
                            <Trophy size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-primary uppercase">Grade Mapping Matrix</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Define percentage thresholds for academic grading</p>
                        </div>
                    </div>
                    <button
                        onClick={handleAddGrade}
                        className="px-4 py-2 bg-white border border-slate-200 text-indigo-600 rounded-md text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-50 hover:border-indigo-100 transition-all flex items-center gap-2"
                    >
                        <Plus size={14} /> Add Grade
                    </button>
                </div>

                <div className="p-6 overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] w-32">Grade Name</th>
                                <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Min %</th>
                                <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Max %</th>
                                <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Grade Points</th>
                                <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] w-32">Inst. Remark</th>
                                <th className="px-4 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] w-16">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {grades.map((grade, idx) => (
                                <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-4">
                                        <input
                                            type="text"
                                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md font-bold text-primary text-xs outline-none focus:border-indigo-500"
                                            value={grade.grade_name}
                                            onChange={e => handleGradeChange(idx, 'grade_name', e.target.value)}
                                            placeholder="A1"
                                        />
                                    </td>
                                    <td className="px-4 py-4 w-24">
                                        <input
                                            type="number"
                                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md font-bold text-primary text-xs outline-none focus:border-indigo-500 text-center [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                            value={grade.min_percent}
                                            onChange={e => handleGradeChange(idx, 'min_percent', e.target.value)}
                                        />
                                    </td>
                                    <td className="px-4 py-4 w-24">
                                        <input
                                            type="number"
                                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md font-bold text-primary text-xs outline-none focus:border-indigo-500 text-center [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                            value={grade.max_percent}
                                            onChange={e => handleGradeChange(idx, 'max_percent', e.target.value)}
                                        />
                                    </td>
                                    <td className="px-4 py-4 w-24">
                                        <input
                                            type="number" step="0.1"
                                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md font-bold text-primary text-xs outline-none focus:border-indigo-500 text-center [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                            value={grade.grade_points}
                                            onChange={e => handleGradeChange(idx, 'grade_points', e.target.value)}
                                        />
                                    </td>
                                    <td className="px-4 py-4">
                                        <input
                                            type="text"
                                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md font-bold text-primary text-xs outline-none focus:border-indigo-500"
                                            value={grade.remark}
                                            onChange={e => handleGradeChange(idx, 'remark', e.target.value)}
                                            placeholder="Excellent"
                                        />
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex justify-center">
                                            <button
                                                onClick={() => handleRemoveGrade(idx)}
                                                className="p-2 text-white hover:bg-rose-600 transition-colors bg-rose-500 rounded-md border border-rose-600 shadow-sm active:scale-95"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {grades.length === 0 && !loading && (
                        <div className="py-20 text-center">
                            <AlertCircle size={40} className="mx-auto text-slate-200 mb-4" />
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">No grading system initialized.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GradingManager;
