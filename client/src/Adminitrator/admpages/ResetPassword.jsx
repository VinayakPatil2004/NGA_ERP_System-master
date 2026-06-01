import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
    Lock, Eye, EyeOff, Loader2, CheckCircle2, ArrowRight 
} from 'lucide-react';
import { resetPassword } from '../../services/authAPI';
import { toast } from 'react-toastify';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.newPassword !== formData.confirmPassword) {
            return toast.error("Institutional passwords must match");
        }

        if (formData.newPassword.length < 6) {
            return toast.error("Password must be at least 6 characters");
        }

        setLoading(true);
        try {
            await resetPassword({ token, newPassword: formData.newPassword });
            setSuccess(true);
            toast.success("Institutional profile updated successfully");
        } catch (error) {
            toast.error(error.response?.data?.error || "Institutional reset failed");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-6 relative">
                <div className="w-full max-w-[450px] bg-white/5 backdrop-blur-2xl rounded-[2.5rem] border border-slate-300 p-12 text-center shadow-3xl">
                    <div className="w-20 h-20 bg-amber-400 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-amber-400/20">
                        <CheckCircle2 className="w-10 h-10 text-black" />
                    </div>
                    <h2 className="text-3xl font-black text-white mb-4 tracking-tight">Security <span className="text-amber-400">Updated</span></h2>
                    <p className="text-slate-400 text-sm leading-relaxed mb-10 font-bold uppercase tracking-wider">
                        Your institutional keys have been successfully recalibrated.
                    </p>
                    <button 
                        onClick={() => navigate('/administration')}
                        className="w-full bg-amber-400 text-black py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-amber-300 transition-all flex items-center justify-center gap-3"
                    >
                        Access Portal <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6 relative overflow-hidden">
            <div className="w-full max-w-[450px] relative z-10 transition-all duration-500">
                <div className="text-center mb-10 group">
                    <h1 className="text-4xl font-black text-white ml-2 tracking-tighter mb-2">UPDATE <span className="text-amber-400">ACCESS</span></h1>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Grace ERP Portal Security</p>
                </div>

                <div className="bg-white/5 backdrop-blur-2xl rounded-xl border border-slate-300 p-10 shadow-3xl">
                    <form onSubmit={handleSubmit} className="space-y-6 text-left">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-2 px-1">
                                <Lock className="w-3 h-3" /> New Access Key
                            </label>
                            <div className="relative">
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    required
                                    placeholder="••••••••••••"
                                    className="w-full bg-white/5 border border-slate-300 rounded-xl px-5 py-4 text-slate-900 text-sm outline-none focus:border-amber-400/50 focus:bg-white/10 transition-all font-bold tracking-[0.2em]"
                                    value={formData.newPassword}
                                    onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-amber-400 transition-colors">
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2 border-t border-white/5 pt-4">
                            <label className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-2 px-1">
                                <Lock className="w-3 h-3" /> Verify Access Key
                            </label>
                            <input 
                                type={showPassword ? "text" : "password"}
                                required
                                placeholder="••••••••••••"
                                className="w-full bg-white/5 border border-slate-300 rounded-xl px-5 py-4 text-slate-900 text-sm outline-none focus:border-amber-400/50 focus:bg-white/10 transition-all font-bold tracking-[0.2em]"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                            />
                        </div>

                        <div className="space-y-4 pt-4">
                            <button 
                                type="submit"
                                disabled={loading}
                                className="w-full bg-amber-400 text-black py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-amber-300 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Update"}
                            </button>
                            
                            <Link to="/administration" className="block text-center text-xs font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">
                                Cancel & Return
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
