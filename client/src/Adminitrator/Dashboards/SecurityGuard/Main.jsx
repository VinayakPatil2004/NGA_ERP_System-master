import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import * as Framer from 'framer-motion';
import Sidebar from '../../admcomponents/Sidebar';
import PasswordReminder from '../../admcomponents/PasswordReminder';

// Module Imports
import Overview from './Modules/Overview';
import GateEntry from './Modules/GateEntry';
import VisitorManagement from './Modules/VisitorManagement';
import GatePassSystem from './Modules/GatePassSystem';
import VehicleTracking from './Modules/VehicleTracking';
import Reports from './Modules/Reports';
import ViewStafProfile from '../../admpages/ViewStafProfile';
import SecurityProfile from './Modules/SecurityProfile';

import { 
    LayoutDashboard, 
    UserPlus, 
    DoorOpen, 
    Ticket, 
    Bus, 
    FileText,
    User
} from 'lucide-react';

const SECURITY_NAV_MODULES = [
    { label: 'Overview', path: '/dashboard/security', icon: LayoutDashboard, exact: true },
    { label: 'Gate Entry', path: '/dashboard/security/gate-entry', icon: DoorOpen },
    { label: 'Visitor Management', path: '/dashboard/security/visitors', icon: UserPlus },
    { label: 'Gate Pass System', path: '/dashboard/security/gate-passes', icon: Ticket },
    { label: 'Vehicle Tracking', path: '/dashboard/security/vehicles', icon: Bus },
    { label: 'Reports & Logs', path: '/dashboard/security/reports', icon: FileText },
    { label: 'My Profile', path: '/dashboard/security/profile', icon: User },
];

const Main = () => {
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className="flex bg-[#F8FAFC] h-screen overflow-hidden text-left">
            <Sidebar 
                modules={SECURITY_NAV_MODULES} 
                roleTitle="SECURITY GUARD" 
                isOpen={isSidebarOpen} 
                onClose={() => setIsSidebarOpen(false)} 
            />
            <PasswordReminder />
            <main className="flex-1 h-full overflow-y-auto overflow-x-hidden relative">
                <Framer.AnimatePresence mode="wait">
                    <Framer.motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="h-full"
                    >
                        <Routes location={location}>
                            <Route path="/" element={<Overview toggleSidebar={toggleSidebar} />} />
                            <Route path="/gate-entry" element={<GateEntry toggleSidebar={toggleSidebar} />} />
                            <Route path="/visitors" element={<VisitorManagement toggleSidebar={toggleSidebar} />} />
                            <Route path="/gate-passes" element={<GatePassSystem toggleSidebar={toggleSidebar} />} />
                            <Route path="/vehicles" element={<VehicleTracking toggleSidebar={toggleSidebar} />} />
                            <Route path="/reports" element={<Reports toggleSidebar={toggleSidebar} />} />
                            <Route path="/profile" element={<SecurityProfile toggleSidebar={toggleSidebar} />} />
                            <Route path="/staff-profile/:id" element={<ViewStafProfile toggleSidebar={toggleSidebar} />} />
                        </Routes>
                    </Framer.motion.div>
                </Framer.AnimatePresence>
            </main>
        </div>
    );
};

export default Main;
