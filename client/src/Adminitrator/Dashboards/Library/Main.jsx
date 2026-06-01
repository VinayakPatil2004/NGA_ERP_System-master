import React, { useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../../admcomponents/Sidebar';
import PasswordReminder from '../../admcomponents/PasswordReminder';
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  ArrowLeftRight,
  Calculator,
  BarChart3,
  Megaphone,
  ShieldCheck,
  MapPin,
  User
} from 'lucide-react';
import StaffLeaveRegistry from '../../admcomponents/StaffLeaveRegistry';

// Modules
import Overview from './Modules/Overview';
import BookInventory from './Modules/BookInventory';
import IssueReturnBook from './Modules/IssueReturnBook';
import FineCalculation from './Modules/FineCalculation';
import LibraryReport from './Modules/LibraryReport';
import NoticeAnnouncement from './Modules/NoticeAnnouncement';
import Location from './Modules/Location';
import LibraryProfile from './Modules/LibraryProfile';

const Main = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // AUTH PROTECTION — run once on mount only
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/administration", { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const libraryModules = [
    { label: 'Overview', path: '/dashboard/library', icon: LayoutDashboard, exact: true },
    { label: 'Book Inventory', path: '/dashboard/library/book-inventory', icon: BookOpen },
    { label: 'Issue & Return', path: '/dashboard/library/issue-return', icon: ArrowLeftRight },
    { label: 'Location', path: '/dashboard/library/location', icon: MapPin },
    { label: 'Library Reports', path: '/dashboard/library/reports', icon: BarChart3 },
    { label: 'Notices', path: '/dashboard/library/notices', icon: Megaphone },
    { label: 'My Profile', path: '/dashboard/library/profile', icon: User },
  ];

  return (
    <div className="flex bg-[#F8FAFC] h-screen overflow-hidden">

      {/* Sidebar */}
      <Sidebar
        modules={libraryModules}
        roleTitle="LIBRARIAN"
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <PasswordReminder />

      {/* Main Content */}
      <main className="flex-1 h-full overflow-y-auto overflow-x-auto relative">

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
              <Route path="/book-inventory" element={<BookInventory toggleSidebar={toggleSidebar} />} />
              <Route path="/issue-return" element={<IssueReturnBook toggleSidebar={toggleSidebar} />} />
              <Route path="/fine-calculation" element={<FineCalculation toggleSidebar={toggleSidebar} />} />
              <Route path="/location" element={<Location toggleSidebar={toggleSidebar} />} />
              <Route path="/reports" element={<LibraryReport toggleSidebar={toggleSidebar} />} />
              <Route path="/notices" element={<NoticeAnnouncement toggleSidebar={toggleSidebar} />} />
              <Route path="/profile" element={<LibraryProfile toggleSidebar={toggleSidebar} />} />

              {/* Fallback */}
              <Route path="*" element={<Overview toggleSidebar={toggleSidebar} />} />

            </Routes>

          </motion.div>
        </AnimatePresence>

      </main>
    </div>
  );
};

export default Main;
