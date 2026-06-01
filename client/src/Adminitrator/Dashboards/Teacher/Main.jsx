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
  Megaphone,
  Award,
  Library,
  FileCheck,
  BarChart3,
  Users
} from 'lucide-react';

// Modules
import Overview from './Modules/Overview';
import Announcements from './Modules/Announcements';
import Assignments from './Modules/Assignments';
import Attendance from './Modules/Attendance';
import Timetable from './Modules/Timetable';
import AcademicYear from './Modules/AcademicYear';
import ViewProfile from './Modules/ViewProfile';
import ExamAndMarks from './Modules/ExamAndMarks';
import ExamResult from './Modules/ExamResult';
import LeaveApplication from './Modules/LeaveApplication';
import SalarySlips from './Modules/SalarySlips';
import LibraryModule from './Modules/Library';
import CertificateApproval from './Modules/CertificateApproval';
import ClassReports from './Modules/ClassReports';
import StaffVisitorsLog from '../SecurityGuard/Modules/StaffVisitorsLog';
import StudentLeaveManagement from '../Admin/Modules/StudentLeaveManagement';



const Main = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  //  AUTH PROTECTION — run once on mount only
  useEffect(() => {
    const token = localStorage.getItem("slpaems_erp_token");
    if (!token) {
      navigate("/administration", { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const teacherModules = [
    { label: 'Overview', path: '/dashboard/teacher', icon: LayoutDashboard, exact: true },
    { label: 'Notices', path: '/dashboard/teacher/announcements', icon: Megaphone },
    { label: 'Assignments', path: '/dashboard/teacher/assignments', icon: ClipboardList },
    { label: 'Attendance', path: '/dashboard/teacher/attendance', icon: CalendarCheck },
    { label: 'Timetable', path: '/dashboard/teacher/timetable', icon: FileText },
    { label: 'Exams & Marks', path: '/dashboard/teacher/exam-marks', icon: ClipboardList },
    { label: 'Apply Leave', path: '/dashboard/teacher/leave', icon: CalendarCheck },
    { label: 'Student Leaves', path: '/dashboard/teacher/student-leaves', icon: ClipboardList },
    { label: 'Salary Slips', path: '/dashboard/teacher/salary', icon: FileText },
    { label: 'Library', path: '/dashboard/teacher/library', icon: Library },
    { label: 'View Result', path: '/dashboard/teacher/view-result', icon: Award },
    { label: 'Certificates', path: '/dashboard/teacher/certificates', icon: FileCheck },
    { label: 'My Visitors', path: '/dashboard/teacher/visitors', icon: Users },
    { label: 'Class Reports', path: '/dashboard/teacher/class-reports', icon: BarChart3 },
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

                <Route path="/announcements" element={<Announcements toggleSidebar={toggleSidebar} />} />
                <Route path="/assignments" element={<Assignments toggleSidebar={toggleSidebar} />} />
                <Route path="/attendance" element={<Attendance toggleSidebar={toggleSidebar} />} />
                <Route path="/timetable" element={<Timetable toggleSidebar={toggleSidebar} />} />
                <Route path="/exam-marks" element={<ExamAndMarks toggleSidebar={toggleSidebar} />} />
                <Route path="/view-result" element={<ExamResult toggleSidebar={toggleSidebar} />} />
                <Route path="/leave" element={<LeaveApplication toggleSidebar={toggleSidebar} />} />
                <Route path="/student-leaves" element={<StudentLeaveManagement toggleSidebar={toggleSidebar} />} />
                <Route path="/salary" element={<SalarySlips toggleSidebar={toggleSidebar} />} />
                <Route path="/library" element={<LibraryModule toggleSidebar={toggleSidebar} />} />
                <Route path="/certificates" element={<CertificateApproval toggleSidebar={toggleSidebar} />} />
                <Route path="/class-reports" element={<ClassReports toggleSidebar={toggleSidebar} />} />
                <Route path="/visitors" element={<StaffVisitorsLog />} />
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