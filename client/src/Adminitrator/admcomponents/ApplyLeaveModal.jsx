import React, { useState } from 'react';
import { X, Calendar, RefreshCw, Send, CalendarCheck } from 'lucide-react';
import { toast } from 'react-toastify';
import hrAPI from '../../services/hrAPI';

const LEAVE_TYPES = [
    'Sick Leave', 'Casual Leave', 'Earned Leave',
    'Maternity Leave', 'Paternity Leave', 'Emergency Leave', 'Other'
];

/**
 * Reusable Apply Leave Modal
 * @param {Function} onClose - Function to close the modal
 * @param {Function} onSuccess - Function to call after successful submission
 * @param {String|Number} staffId - The ID of the staff applying for leave
 * @param {String} applicantType - The type of applicant (e.g., 'staff', 'teacher')
 */
const ApplyLeaveModal = ({ onClose, onSuccess, staffId, applicantType = 'staff' }) => {
    const [applying, setApplying] = useState(false);
    const [form, setForm] = useState({
        staff_id: staffId,
        leave_type: 'Casual Leave',
        from_date: '',
        to_date: '',
        days: 1,
        reason: '',
        applicant_type: applicantType
    });

    const calcDays = (from, to) => {
        if (!from || !to) return 1;
        const start = new Date(from);
        const end = new Date(to);
        const diff = (end - start) / (1000 * 60 * 60 * 24);
        return Math.max(1, Math.round(diff) + 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.from_date || !form.to_date || !form.reason) {
            toast.warning('Please provide dates and a reason for your absence.');
            return;
        }

        try {
            setApplying(true);
            await hrAPI.applyForLeave(form);
            toast.success('Leave application submitted successfully');
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            toast.error(err?.response?.data?.error || 'Failed to submit request');
        } finally {
            setApplying(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="bg-[#001736] p-6 text-white flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-black text-white! uppercase tracking-tight">Apply for Absence</h3>
                        <p className="text-[10px] text-white uppercase font-bold tracking-widest mt-1">Institutional Leave Intelligence</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-all">
                        <X size={20} />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-5">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Leave Type */}
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Leave Category *</label>
                            <select 
                                required
                                value={form.leave_type} 
                                onChange={e => setForm(p => ({ ...p, leave_type: e.target.value }))}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-sm font-bold text-[#001736] outline-none focus:border-indigo-400 transition-all shadow-sm"
                            >
                                {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>

                        {/* Date Range */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Starting From *</label>
                                <input 
                                    type="date" 
                                    required
                                    value={form.from_date}
                                    onChange={e => {
                                        const from = e.target.value;
                                        setForm(p => ({ ...p, from_date: from, days: calcDays(from, p.to_date) }));
                                    }}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-sm font-bold text-[#001736] outline-none focus:border-indigo-400 transition-all shadow-sm" 
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Ending On *</label>
                                <input 
                                    type="date" 
                                    required
                                    value={form.to_date}
                                    onChange={e => {
                                        const to = e.target.value;
                                        setForm(p => ({ ...p, to_date: to, days: calcDays(p.from_date, to) }));
                                    }}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-sm font-bold text-[#001736] outline-none focus:border-indigo-400 transition-all shadow-sm" 
                                />
                            </div>
                        </div>

                        {/* Duration Display */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 flex items-center justify-between shadow-inner">
                            <div className="flex items-center gap-3 text-slate-400">
                                <CalendarCheck size={18} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Total Calculation</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-[#001736]">{form.days}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Days</span>
                            </div>
                        </div>

                        {/* Reason */}
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Reason for Absence *</label>
                            <textarea 
                                required
                                value={form.reason} 
                                onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
                                rows={3} 
                                placeholder="Provide institutional reason for leave..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-sm text-[#001736] font-medium outline-none focus:border-indigo-400 transition-all resize-none shadow-sm" 
                            />
                        </div>

                        {/* Submit Button */}
                        <button 
                            type="submit"
                            disabled={applying}
                            className="w-full bg-[#001736] text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-[#002a5c] transition-all disabled:opacity-60 shadow-lg flex items-center justify-center gap-3 active:scale-[0.98]"
                        >
                            {applying ? (
                                <>
                                    <RefreshCw size={18} className="animate-spin" />
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <>
                                    <Send size={16} />
                                    <span>Dispatch Request</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ApplyLeaveModal;
