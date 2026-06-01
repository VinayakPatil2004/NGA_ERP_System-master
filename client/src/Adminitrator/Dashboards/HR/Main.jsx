import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from '../../admcomponents/Sidebar';
import PasswordReminder from '../../admcomponents/PasswordReminder';
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  IndianRupee,
  CalendarOff,
  FileSpreadsheet,
  User,
  Settings2,
  Wallet,
  FileBarChart,
  Megaphone
} from 'lucide-react';

// Module Imports
import HROverview from './Modules/HROverview';
import StaffManagement from './Modules/StaffManagement';
import StaffAttendance from './Modules/StaffAttendance';
import StaffPayroll from './Modules/StaffPayroll';
import LeaveManagement from './Modules/LeaveManagement';
import StaffPayrollRecord from './Modules/StaffPayrollRecord';
import StaffSalarySetup from './Modules/StaffSalarySetup';
import LoanManagement from './Modules/LoanManagement';
import StaffReports from './Modules/StaffReports';
import AttendanceSettings from '../../admcomponents/AttendanceSettings';
import NoticeAnnouncement from './Modules/NoticeAnnouncement';

const Main = () => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // HR-specific navigation modules
  const hrModules = [
    { label: 'HR Dashboard', path: '/dashboard/hr', icon: LayoutDashboard, exact: true },
    { label: 'Staff Management', path: '/dashboard/hr/staff-management', icon: Users },
    { label: 'Staff Attendance', path: '/dashboard/hr/staff-attendance', icon: ClipboardCheck },
    { label: 'Attendance Settings', path: '/dashboard/hr/attendance-settings', icon: Settings2 },
    { label: 'Salary Setup', path: '/dashboard/hr/salary-setup', icon: Settings2 },
    { label: 'Staff Payroll', path: '/dashboard/hr/staff-payroll', icon: IndianRupee },
    { label: 'Loan & Advance', path: '/dashboard/hr/loan-management', icon: Wallet },
    { label: 'Leave Management', path: '/dashboard/hr/leave-management', icon: CalendarOff },
    { label: 'Payroll Records', path: '/dashboard/hr/payroll-records', icon: FileSpreadsheet },
    { label: 'Notices', path: '/dashboard/hr/notices', icon: Megaphone },
    { label: 'My Profile', path: '/dashboard/hr/staff-reports', icon: User },
  ];

  return (
    <div className="flex bg-[#F8FAFC] h-screen overflow-hidden">
      <Sidebar modules={hrModules} roleTitle="HR MANAGER" isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <PasswordReminder />
      <main className="flex-1 h-full overflow-y-auto overflow-x-hidden relative">
         {/* HR Dashboard Routing with Framer Motion for smooth page transitions */}
         <AnimatePresence mode="wait">
           <motion.div
             key={location.pathname}
             initial={{ opacity: 0, y: 15 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -15 }}
             transition={{ duration: 0.3, ease: 'easeOut' }}
             className="h-full"
           >
             <Routes location={location}>
                <Route path="/" element={<HROverview toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
                <Route path="/staff-management" element={<StaffManagement toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
                <Route path="/staff-attendance" element={<StaffAttendance toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
                <Route path="/attendance-settings" element={<AttendanceSettings toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
                <Route path="/salary-setup" element={<StaffSalarySetup toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
                <Route path="/staff-payroll" element={<StaffPayroll toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
                <Route path="/loan-management" element={<LoanManagement toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
                <Route path="/leave-management" element={<LeaveManagement toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
                <Route path="/payroll-records" element={<StaffPayrollRecord toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
                <Route path="/notices" element={<NoticeAnnouncement toggleSidebar={toggleSidebar} />} />
                <Route path="/staff-reports" element={<StaffReports toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
                <Route path="*" element={<HROverview toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
             </Routes>
           </motion.div>
         </AnimatePresence>
      </main>
    </div>
  );
};

export default Main;
