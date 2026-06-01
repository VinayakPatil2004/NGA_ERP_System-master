import React, { useState, useEffect } from 'react';
import { getStaffProfile } from '../../../../services/staffAPI';
import ViewStafProfile from '../../../admpages/ViewStafProfile';
import { toast } from 'react-toastify';
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import { ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SecurityProfile = ({ toggleSidebar }) => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // Get user from local storage
                const userDataStr = localStorage.getItem('slpaems_erp_user');
                const userData = userDataStr ? JSON.parse(userDataStr) : null;
                
                if (!userData || !userData.id) {
                    toast.error("User Identity Not Found");
                    setLoading(false);
                    return;
                }

                // Security Guard is a staff member, fetch from staff records
                const data = await getStaffProfile(userData.id);
                setProfile(data);
            } catch (error) {
                console.error("Fetch Profile Error:", error);
                toast.error("Failed to load staff profile. Verify your HR registration.");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-10 h-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Scanning Identity Profile...</p>
        </div>
    );

    return (
        <div className="p-4 sm:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans text-left">
            <ModuleHeader
                title="Security Guard Profile"
                subTitle="Official Staff Identity Record"
                icon={ShieldCheck}
                toggleSidebar={toggleSidebar}
                showSearch={false}
            />
            
            <div className="mt-8">
                {profile ? (
                    <ViewStafProfile 
                        staff={profile} 
                        onClose={() => navigate(-1)} 
                        onEdit={() => toast.info("Profile updates are managed by the HR Department.")} 
                        hideControls={true}
                    />
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-200">
                        <p className="text-slate-400 font-bold uppercase tracking-widest">No Staff Record Found</p>
                        <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-widest">Contact HR to synchronize your employee profile.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SecurityProfile;
