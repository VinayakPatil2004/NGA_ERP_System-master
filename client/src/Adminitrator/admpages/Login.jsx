import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
    ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowRight, 
    Info, Loader2 
} from 'lucide-react';
import { toast } from 'react-toastify';
import { login } from '../../services/authAPI';
import { useAuth } from '../../context/AuthContext';
import ngaLogo from '../../assets/nga-logo.png';

const Login = () => {
    const navigate = useNavigate();
    const { loginUser, getDashboardPath } = useAuth();
    
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        rememberMe: false
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            const response = await login(formData);
            // The login function in authAPI.js already returns response.data
            loginUser(response.user, response.token);
            
            toast.success(`Welcome back, ${response.user.fullName || response.user.username}`);
            
            // Intelligent Redirection based on role
            const redirectPath = getDashboardPath(response.user.role);
            navigate(redirectPath, { replace: true });
            
        } catch (error) {
            console.error("Login attempt failed:", error);
            
            let errorMessage = "Institutional authentication failed";
            
            if (!error.response) {
                errorMessage = "Network error: Unable to reach institutional server.";
            } else if (error.response.data && (error.response.data.error === "PASSWORD_EXPIRED" || error.response.data.message?.includes("expired"))) {
                // --- 32-DAY SECURITY ENFORCEMENT ALERT ---
                // Trap specifically 'PASSWORD_EXPIRED' signals to show an actionable recovery toast.
                toast.error(
                    <div>
                        <p className="font-bold mb-1">Security Credentials Expired</p>
                        <p className="text-xs mb-3">Your password is over 32 days old and must be reset.</p>
                        {/* Direct link into the password recovery flow */}
                        <Link to="/forgot-password" size="sm" className="bg-white text-rose-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-rose-100 hover:bg-rose-50 transition-colors">
                            Reset Password Now
                        </Link>
                    </div>,
                    { autoClose: 10000 }
                );
                return;
            } else if (error.response.data && error.response.data.error) {
                errorMessage = error.response.data.error;
            } else if (error.response.status === 404) {
                errorMessage = "Login service endpoint not found.";
            } else if (error.response.status === 500) {
                errorMessage = "Internal institutional server error.";
            }
            
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
            <div className="w-full max-w-[440px]">
                {/* Header Section */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-sm border border-slate-200 mb-6 mx-auto">
                        <img src={ngaLogo} alt="NGA Logo" className="w-14 h-14 object-contain" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">NEW GRACE ACADEMY</h1>
                    <p className="text-slate-500 text-sm font-medium">Institutional Administration Portal</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-3xl border border-slate-300 p-8 shadow-xl shadow-slate-200/50">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Username Input */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600 px-1">
                                Personnel ID or Email
                            </label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <input 
                                    type="text"
                                    required
                                    autoComplete="username"
                                    placeholder="e.g. youremail@gmail.com"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-slate-900 text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all font-medium"
                                    value={formData.username}
                                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-xs font-semibold text-slate-600">
                                    Access Credentials
                                </label>
                                <Link to="/forgot-password" size="sm" className="text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors">
                                    <Lock className="w-4 h-4" />
                                </div>
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    required
                                    autoComplete="current-password"
                                    placeholder="••••••••••••"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-12 py-3.5 text-slate-900 text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all font-medium"
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me */}
                        <div className="flex items-center gap-2.5 px-1 py-1">
                            <input 
                                id="remember-me"
                                type="checkbox" 
                                className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500 cursor-pointer"
                                checked={formData.rememberMe}
                                onChange={(e) => setFormData({...formData, rememberMe: e.target.checked})}
                            />
                            <label htmlFor="remember-me" className="text-xs font-medium text-slate-500 cursor-pointer select-none">
                                Keep session active for 30 days
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-slate-900/10 hover:bg-slate-800 hover:-translate-y-px active:translate-y-px transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin text-white/50" />
                            ) : (
                                <>Verify Identity <ArrowRight className="w-4 h-4" /></>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer Assistance */}
                <div className="mt-8 flex items-center justify-center gap-2 py-4">
                    <Info className="w-4 h-4 text-slate-400" />
                    <p className="text-xs font-medium text-slate-500">
                        Assistance Required? <a href="#" className="text-slate-900 font-bold hover:underline decoration-amber-500 decoration-2 underline-offset-4">Contact System Support</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
