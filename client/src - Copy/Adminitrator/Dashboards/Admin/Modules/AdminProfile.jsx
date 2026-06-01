import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Lock, Shield, Save, Key, Eye, EyeOff, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import { toast } from 'react-toastify';
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import { getAdminProfile, updateAdminProfile, changeAdminPassword } from '../../../../services/adminProfileAPI';

/**
 * AdminProfile - Executive Identity & Security Protocol
 * Refined to the 'Simplified Premium' aesthetic with rounded-2xl and 1px borders.
 */
const AdminProfile = ({ toggleSidebar }) => {
    const [profile, setProfile] = useState({
        first_name: '', last_name: '', email: '', mobile_number: '', address: ''
    });
    const [passwordData, setPasswordData] = useState({
        current_password: '', new_password: '', confirm_password: ''
    });
    const [loading, setLoading] = useState(true);
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [passwordAgeWarning, setPasswordAgeWarning] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const data = await getAdminProfile();
            setProfile(data || {});
        } catch (error) {
            console.error("Fetch Profile Error:", error);
            toast.error("Failed to load profile");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (profile.password_changed_at) {
            const lastChanged = new Date(profile.password_changed_at);
            const now = new Date();
            const diffDays = Math.ceil((now - lastChanged) / (1000 * 60 * 60 * 24));
            if (diffDays >= 30) {
                setPasswordAgeWarning(true);
            }
        }
    }, [profile.password_changed_at]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            await updateAdminProfile(profile);
            toast.success("Executive identity updated");
        } catch (error) {
            console.error("Profile Update Error:", error);
            toast.error("Process failed");
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordData.new_password !== passwordData.confirm_password) {
            return toast.error("Credential mismatch");
        }
        try {
            await changeAdminPassword(passwordData);
            toast.success("Security credentials synchronized");
            setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
            setPasswordAgeWarning(false);
        } catch (err) {
            toast.error(err.response?.data?.error || "Credential update failed");
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-10 h-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Scanning Identity Profile...</p>
        </div>
    );

    return (
        <div className="p-4 lg:p-8 bg-[#F8FAFC] min-h-screen font-sans text-left">

            {/* 1. Unified Module Header */}
            <ModuleHeader
                title="Profile Console"
                subTitle="Executive Identity & Security Protocol"
                icon={ShieldCheck}
                badge="AUTH LEVEL 5"
                toggleSidebar={toggleSidebar}
                showSearch={false}
            />

            <div className="max-w-7xl mx-auto mt-10 space-y-8">
                {passwordAgeWarning && (
                    <div className="bg-amber-50 border border-amber-200 p-8 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex items-center gap-6">
                            <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-sm">
                                <AlertTriangle className="text-amber-500 w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">Security Recommendation Protocol</p>
                                <p className="text-slate-500 font-medium uppercase tracking-tight text-[11px] leading-relaxed">
                                    Operational policy requires periodic credential updates. It has been over 30 days since your last security synchronization.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Personal Information (Simplified Premium) */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group">
                        <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="bg-[#001736] p-3 rounded-xl text-amber-400 shadow-md">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-bold text-[#001736] uppercase tracking-tight">Executive Identity</h2>
                            </div>
                        </div>
                        <form onSubmit={handleProfileUpdate} className="p-10 space-y-8">
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">First Name</label>
                                    <div className="relative group">
                                        <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                        <input
                                            type="text"
                                            className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-[#001736] focus:bg-white focus:border-indigo-400 focus:ring-8 focus:ring-indigo-500/5 transition-all outline-none uppercase placeholder:text-slate-300"
                                            value={profile.first_name || ''}
                                            onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Last Name</label>
                                    <div className="relative group">
                                        <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                        <input
                                            type="text"
                                            className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-[#001736] focus:bg-white focus:border-indigo-400 focus:ring-8 focus:ring-indigo-500/5 transition-all outline-none uppercase placeholder:text-slate-300"
                                            value={profile.last_name || ''}
                                            onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Identity</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                        <input
                                            type="email"
                                            className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-[#001736] focus:bg-white focus:border-indigo-400 focus:ring-8 focus:ring-indigo-500/5 transition-all outline-none lowercase placeholder:text-slate-300"
                                            value={profile.email || ''}
                                            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Mobile Contact</label>
                                    <div className="relative group">
                                        <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                        <input
                                            type="text"
                                            className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-[#001736] focus:bg-white focus:border-indigo-400 focus:ring-8 focus:ring-indigo-500/5 transition-all outline-none font-mono placeholder:text-slate-300"
                                            value={profile.mobile_number || ''}
                                            onChange={(e) => setProfile({ ...profile, mobile_number: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Institutional Address</label>
                                <div className="relative group">
                                    <MapPin className="absolute top-5 left-5 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                    <textarea
                                        rows="3"
                                        className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-[#001736] focus:bg-white focus:border-indigo-400 focus:ring-8 focus:ring-indigo-500/5 transition-all outline-none resize-none uppercase placeholder:text-slate-300"
                                        value={profile.address || ''}
                                        onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    className="px-10 py-5 bg-[#001736] text-white rounded-xl font-bold text-[11px] uppercase tracking-widest flex items-center gap-3 hover:bg-black transition-all shadow-xl active:scale-[0.98]"
                                >
                                    <Save className="w-5 h-5 opacity-40" /> COMMIT PROFILE CORE
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Security Credential Section */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-fit">
                        <div className="p-8 border-b border-slate-100 bg-slate-50 flex items-center gap-4">
                            <div className="bg-amber-400 p-2.5 rounded-xl border border-black/5 shadow-md">
                                <Lock className="text-[#001736] w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold text-[#001736] uppercase tracking-tight">Security</h2>
                        </div>
                        <form onSubmit={handlePasswordChange} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Current Protocol</label>
                                <div className="relative group">
                                    <input
                                        type={showPasswords.current ? "text" : "password"}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-[#001736] focus:bg-white focus:border-indigo-400 focus:ring-8 focus:ring-indigo-500/5 outline-none transition-all pr-14"
                                        value={passwordData.current_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                                        className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#001736] transition-all"
                                    >
                                        {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">New Protocol</label>
                                <div className="relative group">
                                    <input
                                        type={showPasswords.new ? "text" : "password"}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-[#001736] focus:bg-white focus:border-indigo-400 focus:ring-8 focus:ring-indigo-500/5 outline-none transition-all pr-14"
                                        value={passwordData.new_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                                        className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#001736] transition-all"
                                    >
                                        {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Verify Protocol</label>
                                <div className="relative group">
                                    <input
                                        type={showPasswords.confirm ? "text" : "password"}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-[#001736] focus:bg-white focus:border-indigo-400 focus:ring-8 focus:ring-indigo-500/5 outline-none transition-all pr-14"
                                        value={passwordData.confirm_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                                        className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#001736] transition-all"
                                    >
                                        {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full flex items-center justify-center gap-3 py-5 bg-amber-400 text-[#001736] rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-amber-500 transition-all shadow-xl active:scale-[0.98] border border-black/5"
                            >
                                <Key className="w-4 h-4 opacity-40" /> SYNC PROTOCOL <Zap className="w-3.5 h-3.5 opacity-40" />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminProfile;
