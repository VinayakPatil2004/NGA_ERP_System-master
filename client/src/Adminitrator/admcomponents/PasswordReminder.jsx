import React, { useEffect, useState } from 'react';
import { ShieldAlert, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * PasswordReminder - Strategic Security Hygiene Notification
 * Refined to the 'Simplified Premium' aesthetic with rounded-2xl and 1px borders.
 */
const PasswordReminder = () => {
    const navigate = useNavigate();
    const { logoutUser } = useAuth();

    // Initialize state directly from localStorage/sessionStorage to avoid cascading renders in useEffect
    const [daysAgo] = useState(() => {
        // Read user data from localStorage to calculate password age
        const user = JSON.parse(localStorage.getItem('user')) || {};
        if (!user.passwordChangedAt) return 0;
        
        const lastChanged = new Date(user.passwordChangedAt);
        const now = new Date();
        // Calculate the difference in full days
        return Math.ceil(Math.abs(now - lastChanged) / (1000 * 60 * 60 * 24));
    });

    const [show, setShow] = useState(() => {
        // Check if the user has already dismissed the 30-day reminder in this browser session
        const isDismissed = sessionStorage.getItem('password_reminder_dismissed');
        // Only show the non-intrusive advisory if the password age is between 30 and 31 days
        return daysAgo >= 30 && daysAgo < 32 && !isDismissed;
    });

    useEffect(() => {
        // --- CRITICAL SECURITY ENFORCEMENT ---
        // If the password age reaches or exceeds the hard limit of 32 days, 
        // the session is instantly terminated and the user is redirected to login.
        if (daysAgo >= 32) {
            logoutUser();
            window.location.href = '/administration?reason=expired';
        }
    }, [daysAgo, logoutUser]);

    const handleDismiss = () => {
        setShow(false);
        sessionStorage.setItem('password_reminder_dismissed', 'true');
    };

    const handleAction = () => {
        const user = JSON.parse(localStorage.getItem('user')) || {};
        if (user.role === 'admin' || user.role === 'principal' || user.role === 'HR') {
            navigate('/dashboard/admin/profile');
        } else {
            navigate('/dashboard/teacher/profile');
        }
        setShow(false);
    };

    if (!show) return null;

    return (
        <div className="fixed bottom-6 right-6 z-1000 max-w-sm animate-in slide-in-from-right-10 fade-in duration-500 font-sans text-left">
            <div className="bg-[#001736] text-white p-7 rounded-2xl shadow-2xl border border-white/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-3xl group-hover:scale-150 transition-all duration-1000"></div>
                
                <button 
                    onClick={handleDismiss}
                    className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-all text-white/40 hover:text-white"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="flex items-start gap-4 p-1">
                    <div className="w-12 h-12 bg-amber-400 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-amber-400/20 group-hover:scale-110 transition-transform">
                        <ShieldAlert className="w-6 h-6 text-[#001736] opacity-80" />
                    </div>
                    
                    <div className="flex-1">
                        <h4 className="text-[11px] font-bold uppercase tracking-widest text-amber-400 mb-1 opacity-80 whitespace-nowrap">Security Protocol Advisory</h4>
                        <p className="text-[14px] font-bold text-white/90 leading-tight tracking-tight">
                            It has been <span className="text-amber-400 underline underline-offset-4 decoration-2">{daysAgo} days</span> since your last credential synchronization.
                        </p>
                        <p className="text-[9px] text-white/30 mt-3 uppercase tracking-widest font-bold">
                            Registry hygiene ensures institutional integrity.
                        </p>
                        
                        <button 
                            onClick={handleAction}
                            className="mt-6 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] bg-white/5 hover:bg-white/10 px-5 py-3.5 rounded-xl transition-all border border-white/5 hover:border-white/20 active:scale-95"
                        >
                            Update Credentials <ArrowRight className="w-3.5 h-3.5 opacity-40" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PasswordReminder;
