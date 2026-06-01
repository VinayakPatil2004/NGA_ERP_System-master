import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from '../../admcomponents/Sidebar';
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutDashboard, FileText, Users, GraduationCap, ClipboardCheck } from 'lucide-react';

// Module Imports
import Overview from './Modules/Overview';
import Admission from './Modules/Admission';
import Student from '../Admin/Modules/Student';
import Staff from '../Admin/Modules/Staff';
import Attendance from '../Admin/Modules/Attendance';
import VewAdmissionApplication from '../../admpages/VewAdmissionApplication';

const Main = () => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Principle-specific navigation modules
  const principleModules = [
    { label: 'Overview', path: '/dashboard/principle', icon: LayoutDashboard, exact: true },
    { label: 'Admissions', path: '/dashboard/principle/admissions', icon: FileText },
    { label: 'Students', path: '/dashboard/principle/students', icon: Users },
    { label: 'Academic Staff', path: '/dashboard/principle/teachers', icon: GraduationCap },
    { label: 'Attendance', path: '/dashboard/principle/attendance', icon: ClipboardCheck },
  ];

  return (
    <div className="flex bg-[#F8FAFC] h-screen overflow-hidden">
      <Sidebar modules={principleModules} roleTitle="PRINCIPAL" isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="flex-1 h-full overflow-y-auto relative">
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
                <Route path="/admissions" element={<Admission toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
                <Route path="/admissions/view/:id" element={<VewAdmissionApplication toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
                <Route path="/students" element={<Student toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
                <Route path="/teachers" element={<Staff toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
                <Route path="/attendance" element={<Attendance />} />
                <Route path="*" element={<Overview toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
             </Routes>
           </motion.div>
         </AnimatePresence>
      </main>
    </div>
  );
};

export default Main;
