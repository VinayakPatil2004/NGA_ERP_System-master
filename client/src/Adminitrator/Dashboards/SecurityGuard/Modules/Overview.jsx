import React, { useState, useEffect } from 'react';
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import { UserPlus, DoorOpen, Ticket, Bus, Users, ShieldAlert, Clock, Shield, Megaphone, MapPin, CheckCircle } from 'lucide-react';
import AttendancePanel from '../../../admcomponents/AttendancePanel';
import NoticeBoard from '../../../admcomponents/NoticeBoard';
import axios from 'axios';
import { useAcademicYear } from '../../../../context/AcademicYearContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Overview = ({ toggleSidebar }) => {
    const [stats, setStats] = useState({
        visitorsToday: 0,
        activeEntries: 0,
        pendingPasses: 0,
        vehiclesIn: 0
    });
    const [loading, setLoading] = useState(true);
    const { selectedYear } = useAcademicYear();

    useEffect(() => {
        const fetchStats = async () => {
            if (!selectedYear) return;
            try {
                setLoading(true);
                const token = localStorage.getItem('slpaems_erp_token');
                const response = await axios.get(`${API_URL}/api/security/overview?academic_year_id=${selectedYear.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStats(response.data);
            } catch (error) {
                console.error("Error fetching security stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [selectedYear]);

    const metricCards = [
        {
            title: "Visitors Today",
            value: stats.visitorsToday,
            icon: UserPlus,
            color: "bg-blue-50",
            textColor: "text-blue-600",
            borderColor: "border-blue-100",
            subText: "Outside Visits"
        },
        {
            title: "Active Entries",
            value: stats.activeEntries,
            icon: DoorOpen,
            color: "bg-emerald-50",
            textColor: "text-emerald-600",
            borderColor: "border-emerald-100",
            subText: "People Currently Inside"
        },
        {
            title: "Pending Passes",
            value: stats.pendingPasses,
            icon: Ticket,
            color: "bg-amber-50",
            textColor: "text-amber-600",
            borderColor: "border-amber-100",
            subText: "Awaiting Approval"
        },
        {
            title: "Vehicles Inside",
            value: stats.vehiclesIn,
            icon: Bus,
            color: "bg-rose-50",
            textColor: "text-rose-600",
            borderColor: "border-rose-100",
            subText: "Fleet & Private"
        }
    ];

    return (
        <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 min-h-screen bg-[#F8FAFC] font-sans text-left">
            <ModuleHeader 
                title="Security Desk"
                subTitle="Security Command Center"
                icon={Shield}
                toggleSidebar={toggleSidebar}
            />

            {/* Quick Actions / Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {metricCards.map((card, idx) => (
                    <div key={idx} className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 relative flex items-center gap-6 overflow-hidden group hover:shadow-lg transition-all duration-300">
                        <div className={`w-14 h-14 rounded-xl ${card.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform border ${card.borderColor} shadow-sm`}>
                            <card.icon className={`w-6 h-6 ${card.textColor}`} strokeWidth={2} />
                        </div>
                        <div className="flex flex-col text-left w-full min-w-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 truncate">{card.title}</span>
                            <span className="text-3xl font-bold text-[#001736] leading-none mb-1.5 truncate tracking-tighter">
                                {loading ? '...' : card.value}
                            </span>
                            <span className={`text-[9px] font-bold ${card.textColor} truncate uppercase tracking-widest opacity-60`}>{card.subText}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="space-y-6">
                {/* Attendance Panel Component */}
                <AttendancePanel />

                {/* Short Notices */}
                <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-[#001736] tracking-tight">Short Notices</h3>
                            <p className="text-xs font-medium text-slate-400 mt-1">Important updates for security personnel</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                            <Megaphone className="w-5 h-5 text-amber-500" />
                        </div>
                    </div>

                    <NoticeBoard audience="staff" gridClass="grid-cols-1 md:grid-cols-2" limit={4} compact={true} />
                </div>
            </div>
        </div>
    );
};

export default Overview;
