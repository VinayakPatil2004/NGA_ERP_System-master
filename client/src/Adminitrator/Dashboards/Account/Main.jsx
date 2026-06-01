import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from '../../admcomponents/Sidebar';
import PasswordReminder from '../../admcomponents/PasswordReminder';
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Calculator,
  User,
  Settings,
  BookOpen,
  BarChart3,
  TrendingDown,
  ShieldCheck,
  Activity,
  CalendarCheck,
  Bell
} from 'lucide-react';

// API & Services
import { getAcademicYearsList } from '../../../services/classroomAPI';

import FeesAndFinance from './Modules/FeesAndFinance';
import AccountantProfile from './Modules/components/AccountantProfile';
import Announcements from '../Teacher/Modules/Announcements';
import Overview from './Modules/Overview';

const Main = () => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  // Sync Academic Years for all children
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const years = await getAcademicYearsList();
        setAcademicYears(years);
        const active = years.find(y => y.is_active) || years[0];
        if (active) setSelectedYear(active.id);
      } catch (error) {
        console.error("Accountant Dashboard Year Sync Failed:", error);
      }
    };
    fetchYears();
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const selectedYearName = academicYears.find(y => y.id == selectedYear)?.year_name || selectedYear;

  const sharedProps = {
    toggleSidebar,
    selectedYear,
    selectedYearName,
    academicYears,
    setSelectedYear,
    isMobileSearchOpen,
    setIsMobileSearchOpen
  };

  const accountantModules = [
    { label: 'Overview', path: '/dashboard/accountant', icon: LayoutDashboard, exact: true },
    { label: 'Fee Structure', path: '/dashboard/accountant/fee-structure', icon: BookOpen },
    { label: 'Student Fees', path: '/dashboard/accountant/student-fees', icon: Calculator },
     { label: 'Expense Monitoring', path: '/dashboard/accountant/expenses', icon: TrendingDown },
    { label: 'Financial Reports', path: '/dashboard/accountant/reports', icon: BarChart3 },
   
    { label: 'Communication', path: '/dashboard/accountant/communication', icon: Bell },
    { label: 'My Profile', path: '/dashboard/accountant/profile', icon: User },
  ];

  return (
    <div className="flex bg-[#F8FAFC] h-screen overflow-hidden">
      <Sidebar 
        modules={accountantModules} 
        roleTitle="ACCOUNTANT" 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      <PasswordReminder />
      <main className="flex-1 h-full overflow-y-auto no-scrollbar overflow-x-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="h-full px-4 lg:px-8 py-6 min-h-full pb-32"
          >
            <Routes location={location}>
              <Route path="/" element={<Overview {...sharedProps} />} />
              <Route path="/fee-structure" element={<FeesAndFinance {...sharedProps} initialModule="structure" />} />
              <Route path="/student-fees" element={<FeesAndFinance {...sharedProps} initialModule="StudentFeeManagement" />} />
              <Route path="/reports" element={<FeesAndFinance {...sharedProps} initialModule="reports" />} />
              <Route path="/expenses" element={<FeesAndFinance {...sharedProps} initialModule="expenses" />} />
              <Route path="/profile" element={<AccountantProfile {...sharedProps} />} />
              <Route path="/communication" element={<Announcements toggleSidebar={toggleSidebar} />} />
              
              {/* Fallback */}
              <Route path="*" element={<FeesAndFinance {...sharedProps} />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Main;
