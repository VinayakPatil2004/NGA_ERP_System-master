import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from '../../admcomponents/Sidebar';
import PasswordReminder from '../../admcomponents/PasswordReminder';

// Module Imports
import Overview from './Modules/Overview';
import Admission from './Modules/Admission';
import ClassRoom from './Modules/ClassRoom';
import Staff from './Modules/Staff';
import Student from './Modules/Student';
import AcademicYearManager from './Modules/AcademicYearManager';
import Attendance from './Modules/Attendance';
import UserManagement from './Modules/UserManagement/UserManagement';
import AdminProfile from './Modules/AdminProfile';
import FeesAndFinance from './Modules/FeesAndFinance/FeesAndFinance';
import Alumni from './Modules/Alumni';
import VewAdmissionApplication from '../../admpages/VewAdmissionApplication';

const Main = () => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex bg-[#F8FAFC] h-screen overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <PasswordReminder />
      <main className="flex-1 h-full overflow-y-auto overflow-x-hidden relative">
         {/* Main Dashboard Routing wrapped with Framer Motion for smooth page transitions */}
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
                <Route path="/" element={<Overview toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
                <Route path="/students" element={<Student toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
                <Route path="/admissions" element={<Admission toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
                <Route path="/admissions/view/:id" element={<VewAdmissionApplication toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
                <Route path="/classrooms" element={<ClassRoom toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
                <Route path="/attendance" element={<Attendance toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
                <Route path="/staff" element={<Staff toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
                <Route path="/academic-year" element={<AcademicYearManager toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
                <Route path="/users/:category?" element={<UserManagement toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
                <Route path="/fee-finance" element={<FeesAndFinance toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
                <Route path="/alumni" element={<Alumni toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
                <Route path="/profile" element={<AdminProfile toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
                {/* Catch-all or default view for unmatched admin routes */}
                {/* <Route path="*" element={<Overview toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} /> */}
             </Routes>
           </motion.div>
         </AnimatePresence>
      </main>
    </div>
  );
};

export default Main;
