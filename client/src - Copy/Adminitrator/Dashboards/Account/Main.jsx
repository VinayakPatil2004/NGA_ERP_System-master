import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from '../../admcomponents/Sidebar';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutDashboard, ClipboardCheck, Calculator, FileText, ScrollText } from 'lucide-react';

// Module Imports
import Overview from './Modules/Overview';
import Fees from './Modules/Fees';
import Admission from './Modules/Admission';
import Reports from './Modules/Reports';
import AcademicFees from './Modules/AcademicFees';
import VewAdmissionApplication from '../../admpages/VewAdmissionApplication';

const Main = () => {
  const location = useLocation();
  const MotionDiv = motion.div;
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Accountant-specific navigation modules
  const accountantModules = [
    { label: 'Fin. Overview', path: '/dashboard/accountant', icon: LayoutDashboard, exact: true },
    { label: 'Adm. Tracking', path: '/dashboard/accountant/admissions', icon: ClipboardCheck },
    { label: 'Fee Management', path: '/dashboard/accountant/fees', icon: Calculator },
    { label: 'Academic Fees', path: '/dashboard/accountant/academic-fees', icon: ScrollText },
    { label: 'Fin. Reports', path: '/dashboard/accountant/reports', icon: ClipboardCheck },
  ];

  return (
    <div className="flex bg-[#F8FAFC] h-screen overflow-hidden">
      <Sidebar modules={accountantModules} roleTitle="ACCOUNTANT" isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="flex-1 h-full overflow-y-auto overflow-x-hidden relative">
         <AnimatePresence mode="wait">
           <MotionDiv
             key={location.pathname}
             initial={{ opacity: 0, y: 15 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -15 }}
             transition={{ duration: 0.3, ease: 'easeOut' }}
             className="h-full"
           >
             <Routes location={location}>
                <Route path="/" element={<Overview toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
                <Route path="/fees" element={<Fees toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
                <Route path="/admissions" element={<Admission toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
                <Route path="/admissions/view/:id" element={<VewAdmissionApplication toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
                <Route path="/academic-fees" element={<AcademicFees toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
                <Route path="/reports" element={<Reports toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
                <Route path="*" element={<Overview toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
             </Routes>
           </MotionDiv>
         </AnimatePresence>
      </main>
    </div>
  );
};

export default Main;
