import React from 'react';
import WelcomeHeader from '../../../admcomponents/WelcomeHeader';
import { IndianRupee, Users, Shield, BookOpen } from 'lucide-react';

/**
 * Principle Overview - Strategic Institutional Insights
 * Refined to the 'Simplified Premium' aesthetic with rounded-2xl and 1px borders.
 */
const Overview = () => {
    return (
        <div className="p-4 lg:p-8 space-y-8 min-h-screen bg-[#F8FAFC] font-sans text-left">

            {/* Top Welcome Header Component */}
            <WelcomeHeader roleTitle="PRINCIPAL" />

            {/* Overview Dashboard Filter Bar */}
            <div className="bg-white rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm border border-slate-200">
                <h2 className="text-xl font-bold text-[#001736] tracking-tight uppercase">Strategic Overview</h2>
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <select className="bg-slate-50 border border-slate-200 text-[#001736] px-6 py-2.5 rounded-xl text-[11px] font-bold focus:outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 appearance-none cursor-pointer pr-12 hover:bg-white transition-all uppercase tracking-widest">
                            <option>Academic Year: 2026-27</option>
                            <option>Academic Year: 2025-26</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                            <Shield size={14} />
                        </div>
                    </div>
                </div>
            </div>

            {/* 4 Metric Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Card 1: Revenue */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 relative flex items-center gap-6 overflow-hidden group hover:shadow-lg transition-all duration-300">
                    <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform border border-emerald-100 shadow-sm">
                        <IndianRupee className="w-6 h-6 text-emerald-600" strokeWidth={2} />
                    </div>
                    <div className="flex flex-col text-left w-full min-w-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 truncate">Institutional Revenue</span>
                        <span className="text-3xl font-bold text-[#001736] leading-none mb-1.5 truncate tracking-tighter">₹ 0.00</span>
                        <span className="text-[9px] font-bold text-emerald-600 truncate uppercase tracking-widest opacity-60">Current Session</span>
                    </div>
                </div>

                {/* Card 2: Students */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 relative flex items-center gap-6 overflow-hidden group hover:shadow-lg transition-all duration-300">
                    <div className="w-14 h-14 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform border border-amber-100 shadow-sm">
                        <Users className="w-6 h-6 text-amber-600" strokeWidth={2} />
                    </div>
                    <div className="flex flex-col text-left w-full min-w-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 truncate">Pupil Registry</span>
                        <span className="text-3xl font-bold text-[#001736] leading-none mb-1.5 truncate tracking-tighter">0</span>
                        <span className="text-[9px] font-bold text-amber-600 truncate uppercase tracking-widest opacity-60">Active Learners</span>
                    </div>
                </div>

                {/* Card 3: Staff */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 relative flex items-center gap-6 overflow-hidden group hover:shadow-lg transition-all duration-300">
                    <div className="w-14 h-14 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform border border-slate-100 shadow-sm">
                        <Shield className="w-6 h-6 text-[#001736]" strokeWidth={2} />
                    </div>
                    <div className="flex flex-col text-left w-full min-w-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 truncate">Personnel Force</span>
                        <span className="text-3xl font-bold text-[#001736] leading-none mb-1.5 truncate tracking-tighter">0</span>
                        <span className="text-[9px] font-bold text-slate-400 truncate uppercase tracking-widest opacity-60">Faculty & Admin</span>
                    </div>
                </div>

                {/* Card 4: Classrooms */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 relative flex items-center gap-6 overflow-hidden group hover:shadow-lg transition-all duration-300">
                    <div className="w-14 h-14 rounded-xl bg-rose-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform border border-rose-100 shadow-sm">
                        <BookOpen className="w-6 h-6 text-rose-500" strokeWidth={2} />
                    </div>
                    <div className="flex flex-col text-left w-full min-w-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 truncate">Academic Rooms</span>
                        <span className="text-3xl font-bold text-[#001736] leading-none mb-1.5 truncate tracking-tighter">0</span>
                        <span className="text-[9px] font-bold text-rose-500 truncate uppercase tracking-widest opacity-60">Active Learning Centers</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Overview;
