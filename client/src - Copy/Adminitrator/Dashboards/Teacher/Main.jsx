import React, { useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../../admcomponents/Sidebar';
import PasswordReminder from '../../admcomponents/PasswordReminder';
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard,
  ClipboardList,
  CalendarCheck,
  FileText,
  User,
  Megaphone
} from 'lucide-react';

// Modules
import Overview from './Modules/Overview';
import Announcements from './Modules/Announcements';
import Assignments from './Modules/Assignments';
import Attendance from './Modules/Attendance';
import Timetable from './Modules/Timetable';
import ViewProfile from './Modules/ViewProfile';

const Main = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  //  AUTH PROTECTION
  useEffect(() => {
    const token = localStorage.getItem("grace_erp_token");

    if (!token) {
      navigate("/administration");
    }
  }, [navigate]);

  const teacherModules = [
    { label: 'Overview', path: '/dashboard/teacher', icon: LayoutDashboard, exact: true },
    { label: 'Announcements', path: '/dashboard/teacher/announcements', icon: Megaphone },
    { label: 'Assignments', path: '/dashboard/teacher/assignments', icon: ClipboardList },
    { label: 'Attendance', path: '/dashboard/teacher/attendance', icon: CalendarCheck },
    { label: 'Timetable', path: '/dashboard/teacher/timetable', icon: FileText },
    { label: 'Profile', path: '/dashboard/teacher/profile', icon: User },
  ];

  return (
    <div className="flex bg-[#F8FAFC] h-screen overflow-hidden">

      {/* Sidebar */}
      <Sidebar
        modules={teacherModules}
        roleTitle="TEACHER"
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <PasswordReminder />

      {/* Main Content */}
      <main className="flex-1 h-full overflow-y-auto relative">

        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >

            <Routes location={location}>

              {/* Dashboard */}
              <Route path="/" element={<Overview toggleSidebar={toggleSidebar} />} />

              {/* Modules */}
              <Route path="/announcements" element={<Announcements toggleSidebar={toggleSidebar} />} />
              <Route path="/assignments" element={<Assignments toggleSidebar={toggleSidebar} />} />
              <Route path="/attendance" element={<Attendance toggleSidebar={toggleSidebar} />} />
              <Route path="/timetable" element={<Timetable toggleSidebar={toggleSidebar} />} />
              <Route path="/profile" element={<ViewProfile toggleSidebar={toggleSidebar} />} />

              {/* Fallback */}
              <Route path="*" element={<Overview />} />

            </Routes>

          </motion.div>
        </AnimatePresence>

      </main>
    </div>
  );
};

export default Main;