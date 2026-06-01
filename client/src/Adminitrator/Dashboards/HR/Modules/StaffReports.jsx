import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { getStaffProfile } from '../../../../services/staffAPI';
import ViewStafProfile from '../../../admpages/ViewStafProfile';
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import { User } from 'lucide-react';
import { toast } from 'react-toastify';

const StaffReports = ({ toggleSidebar }) => {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user?.id) return;
            try {
                setLoading(true);
                const data = await getStaffProfile(user.id);
                setProfile(data);
            } catch (error) {
                console.error("Error fetching profile:", error);
                toast.error("Failed to load your profile");
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [user]);

    if (loading) {
        return (
            <div className="p-4 lg:p-8 space-y-6 min-h-screen bg-[#F8FAFC]">
                <ModuleHeader hideAcademicYear={true} title="My Profile" subTitle="Personal Information & Records" icon={User} toggleSidebar={toggleSidebar} />
                <div className="animate-pulse bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                    <div className="h-32 bg-slate-100 rounded-xl mb-8"></div>
                    <div className="space-y-4">
                        <div className="h-8 bg-slate-100 rounded-lg w-1/3"></div>
                        <div className="h-8 bg-slate-100 rounded-lg w-1/2"></div>
                        <div className="h-8 bg-slate-100 rounded-lg w-1/4"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="p-4 lg:p-8 space-y-6 min-h-screen bg-[#F8FAFC]">
                <ModuleHeader hideAcademicYear={true} title="My Profile" subTitle="Personal Information & Records" icon={User} toggleSidebar={toggleSidebar} />
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
                    <p className="text-slate-500 font-bold">Could not load profile data.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-8 space-y-6 min-h-screen bg-[#F8FAFC]">
            <ViewStafProfile
                staff={profile}
                isSelfProfile={true}
                onClose={() => {}} // No close action needed here, but prop required to avoid crash if called
                onEdit={() => toast.info("Please contact Admin to update your profile")}
                toggleSidebar={toggleSidebar}
            />
        </div>
    );
};

export default StaffReports;
