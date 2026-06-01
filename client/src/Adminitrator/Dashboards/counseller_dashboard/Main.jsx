import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useAcademicYear } from '../../../context/AcademicYearContext';
import Sidebar from '../../admcomponents/Sidebar';
import PasswordReminder from '../../admcomponents/PasswordReminder';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import {
  LayoutDashboard,
  MessageSquare,
  UserPlus,
  Clock,
  Users,
  GraduationCap,
  Calendar,
  BarChart3,
  Megaphone,
  User
} from 'lucide-react';

// Modules
import Overview from './Modules/Overview';
import EnquiryManagement from './Modules/EnquiryManagement';
import Admission from './Modules/Admission';
import Student from './Modules/Student';
import Staff from '../Admin/Modules/Staff';
import FollowUpDue from './Modules/FollowUpDue';
import CounsellingSession from './Modules/CounsellingSession';
import CounsellingReports from './Modules/CounsellingReports';
import NoticeAnnouncement from './Modules/NoticeAnnouncement';
import CounsellorProfile from './Modules/CounsellorProfile';
import CounsellorLeave from './Modules/CounsellorLeave';

const Main = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { selectedYear } = useAcademicYear();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // AUTH PROTECTION — run once on mount only
  useEffect(() => {
    const token = localStorage.getItem("slpaems_erp_token");
    if (!token) {
      navigate("/administration", { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // SYNC ACADEMIC YEAR (Handled by AcademicYearContext globally)
  
  const selectedYearId = selectedYear?.id || '';
  const selectedYearName = selectedYear?.year_name || '';

  const counselorModules = [
    { label: 'Overview', path: '/dashboard/counsellor', icon: LayoutDashboard, exact: true },
    { label: 'Enquiry Mgmt', path: '/dashboard/counsellor/enquiry', icon: MessageSquare },
    { label: 'Admission Desk', path: '/dashboard/counsellor/admission', icon: UserPlus },
    { label: 'Follow-ups', path: '/dashboard/counsellor/follow-up', icon: Clock },
    { label: 'Student Desk', path: '/dashboard/counsellor/students', icon: Users },
    { label: 'Staff Registry', path: '/dashboard/counsellor/staff', icon: GraduationCap },
    { label: 'Sessions', path: '/dashboard/counsellor/sessions', icon: Calendar },
    { label: 'Apply Leave', path: '/dashboard/counsellor/leave', icon: Clock },
    { label: 'Reports', path: '/dashboard/counsellor/reports', icon: BarChart3 },
    { label: 'Notices', path: '/dashboard/counsellor/notices', icon: Megaphone },
    { label: 'My Profile', path: '/dashboard/counsellor/profile', icon: User },
  ];

  return (
    <div className="flex bg-[#F8FAFC] h-screen overflow-hidden">
        <style>
            {`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}
        </style>

      {/* Sidebar */}
      <Sidebar
        modules={counselorModules}
        roleTitle="COUNSELOR"
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <PasswordReminder />

      {/* Main Content */}
      <main className="flex-1 h-full overflow-y-auto no-scrollbar relative bg-[#F8FAFC]">
        <AnimatePresence mode="wait">
          <Motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="h-full p-4 lg:p-8"
          >
            <Routes location={location}>
              <Route path="/" element={<Overview toggleSidebar={toggleSidebar} />} />
              <Route path="/enquiry" element={<EnquiryManagement toggleSidebar={toggleSidebar} />} />
              <Route path="/admission" element={<Admission toggleSidebar={toggleSidebar} />} />
              <Route path="/follow-up" element={<FollowUpDue toggleSidebar={toggleSidebar} />} />
              <Route path="/students" element={<Student toggleSidebar={toggleSidebar} />} />
              <Route path="/staff" element={<Staff toggleSidebar={toggleSidebar} />} />
              <Route path="/sessions" element={<CounsellingSession toggleSidebar={toggleSidebar} />} />
              <Route path="/leave" element={<CounsellorLeave toggleSidebar={toggleSidebar} />} />
              <Route path="/reports" element={<CounsellingReports toggleSidebar={toggleSidebar} />} />
              <Route path="/notices" element={<NoticeAnnouncement toggleSidebar={toggleSidebar} selectedYear={selectedYearId} selectedYearName={selectedYearName} />} />
              <Route path="/profile" element={<CounsellorProfile toggleSidebar={toggleSidebar} />} />

              {/* Fallback */}
              <Route path="*" element={<Overview toggleSidebar={toggleSidebar} />} />
            </Routes>
          </Motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Main;
