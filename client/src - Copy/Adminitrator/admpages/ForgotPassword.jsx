import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Mail, ArrowLeft, Loader2, CheckCircle2, Info
} from 'lucide-react';
import { forgotPassword } from '../../services/authAPI';
import { toast } from 'react-toastify';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await forgotPassword(email);
            setSubmitted(true);
            toast.success("Recovery instructions logged to system console");
        } catch (error) {
            toast.error(error.response?.data?.error || "Institutional recovery failed");
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-white! flex items-center justify-center p-6 relative">
                {/* Decorative background blobs */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-50/50 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-50/40 rounded-full blur-3xl" />
                </div>

                <div className="w-full max-w-[450px] relative z-10 bg-white border border-slate-200/80 p-12 text-center rounded-[2.5rem] shadow-2xl">
                    <div className="w-20 h-20 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h2 className="text-3xl font-black text-[#001736] mb-4 tracking-tight">Access <span className="text-emerald-500">Restored</span></h2>
                    <p className="text-black! text-sm leading-relaxed mb-10 font-bold">
                        Institutional recovery instructions have been dispatched to your registered portal email address.
                    </p>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl mb-8 flex items-start gap-3 text-left">
                        <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                            DEVELOPMENT MODE: Please check the backend server console for the simulated recovery link.
                        </p>
                    </div>
                    <Link to="/administration" className="inline-flex items-center gap-2 text-xs font-black text-indigo-600 uppercase tracking-widest hover:text-[#001736] transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Return to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white! flex items-center justify-center p-6 relative">
            {/* Decorative background blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-50/50 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-50/40 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-[450px] relative z-10 transition-all duration-500">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-black text-[#001736] tracking-tighter mb-2">ACCESS <span className="text-indigo-600">RECOVERY</span></h1>
                    <p className="text-black! text-[10px] font-black uppercase tracking-[0.3em] opacity-60">New Grace Academy - Portal Security</p>
                </div>

                <div className="bg-white border border-slate-200/80 p-10 rounded-[2.5rem] shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 px-1">
                                <Mail className="w-3 h-3" /> Registered Personnel Email
                            </label>
                            <input
                                type="email"
                                required
                                placeholder="name@graceerp.com"
                                className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-5 py-4 text-[#001736] text-sm outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-400 font-bold shadow-inner"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <p className="text-[9px] font-bold text-slate-400 px-1 mt-2 uppercase tracking-wider">
                                Enter the email associated with your institutional profile.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#001736] hover:bg-black text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98]"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Initiate Recovery"}
                            </button>

                            <Link to="/administration" className="block text-center text-xs font-black text-slate-500 uppercase tracking-widest hover:text-[#001736] transition-colors">
                                Cancel & Return
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
