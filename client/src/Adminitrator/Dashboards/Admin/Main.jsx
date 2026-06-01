import React from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from '../../admcomponents/Sidebar';
import PasswordReminder from '../../admcomponents/PasswordReminder';
import { useAuth } from '../../../context/AuthContext';

// Module Imports
import Overview from './Modules/Overview';
import Admission from './Modules/Admission';
import ClassRoom from './Modules/ClassRoom';
import Staff from './Modules/Staff';
import Student from './Modules/Student';
import AcademicYearManager from './Modules/AcademicYearManager';
import Attendance from './Modules/Attendance';
import AttendanceSettings from '../../admcomponents/AttendanceSettings';
import UserManagement from './Modules/UserManagement/UserManagement';
import AdminProfile from './Modules/AdminProfile';
import FeesAndFinance from './Modules/FeesAndFinance/FeesAndFinance';
import Alumni from './Modules/Alumni';
import Transport from './Modules/Transport';
import Inventory from './Modules/Inventory';
import Communication from './Modules/Communication';
import ExamManager from './Modules/ExamManagement/ExamManager';
import GradingManager from './Modules/ExamManagement/GradingManager';
import TimetableManager from './Modules/TimetableManager';
import LeaveManagement from '../HR/Modules/LeaveManagement';
import VewAdmissionApplication from '../../admpages/VewAdmissionApplication';
import AdminPayrollControl from './Modules/AdminPayrollControl';
import Certificates from './Modules/Certificates';
import StudentLeaveManagement from './Modules/StudentLeaveManagement';
import ClassReports from './Modules/ClassReports';
import IdCardGenerator from './Modules/IdCardGenerator';
import AllVisitorsLog from '../SecurityGuard/Modules/AllVisitorsLog';
import CalendarManager from './Modules/CalendarManager';

// Staff Payroll Module Imports
import StaffSalarySetup from '../HR/Modules/StaffSalarySetup';
import StaffPayroll from '../HR/Modules/StaffPayroll';
import LoanManagement from '../HR/Modules/LoanManagement';
import StaffPayrollRecord from '../HR/Modules/StaffPayrollRecord';

// Library Module Imports
import BookInventory from '../Library/Modules/BookInventory';
import IssueReturnBook from '../Library/Modules/IssueReturnBook';
import FineCalculation from '../Library/Modules/FineCalculation';
import NoticeAnnouncement from '../Library/Modules/NoticeAnnouncement';
import LibraryReport from '../Library/Modules/LibraryReport';
import LibraryOverview from '../Library/Modules/Overview';
import LibraryLocation from '../Library/Modules/Location';

// Counselling Module Imports (Cross-Integrated)
import EnquiryManagement from '../counseller_dashboard/Modules/EnquiryManagement';
import FollowUpDue from '../counseller_dashboard/Modules/FollowUpDue';

const Main = () => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const { user } = useAuth();

  const isPrincipalUser = user?.role?.toLowerCase() === 'principal';
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
            className="h-full pb-24"
          >
            <Routes location={location}>
              <Route path="/" element={<Overview toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
              <Route path="/students" element={<Student toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
              <Route path="/id-cards" element={<IdCardGenerator toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
              <Route path="/admissions" element={<Admission toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
              <Route path="/admissions/view/:id" element={<VewAdmissionApplication toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
              <Route path="/classrooms" element={<ClassRoom toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
              <Route path="/attendance" element={<Attendance toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
              <Route path="/attendance-settings" element={<AttendanceSettings toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
              <Route path="/payroll-control" element={isPrincipalUser ? <Navigate to="/dashboard/principle" replace /> : <AdminPayrollControl toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
              <Route path="/payroll/salary-setup" element={isPrincipalUser ? <Navigate to="/dashboard/principle" replace /> : <StaffSalarySetup toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
              <Route path="/payroll/staff-payroll" element={isPrincipalUser ? <Navigate to="/dashboard/principle" replace /> : <StaffPayroll toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
              <Route path="/payroll/loan-management" element={isPrincipalUser ? <Navigate to="/dashboard/principle" replace /> : <LoanManagement toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
              <Route path="/payroll/payroll-records" element={isPrincipalUser ? <Navigate to="/dashboard/principle" replace /> : <StaffPayrollRecord toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
              <Route path="/staff" element={<Staff toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
              <Route path="/academic-year" element={<AcademicYearManager toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
              <Route path="/users/:category?" element={<UserManagement toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
              <Route path="/fee-finance" element={<FeesAndFinance toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
              <Route path="/alumni" element={<Alumni toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
              <Route path="/transport" element={<Transport toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
              <Route path="/inventory" element={<Inventory toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
              <Route path="/communication" element={<Communication toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
              <Route path="/exams" element={<ExamManager toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
              <Route path="/grading" element={<GradingManager toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
              <Route path="/timetable" element={<TimetableManager toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
              <Route path="/leave-management" element={<LeaveManagement toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
              <Route path="/student-leaves" element={<StudentLeaveManagement toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
              <Route path="/certificates" element={<Certificates toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
              <Route path="/class-reports" element={<ClassReports toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
              <Route path="/visitors" element={<AllVisitorsLog toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
              <Route path="/calendar" element={<CalendarManager toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />

              {/* Library Management Routes */}
              <Route path="/library" element={<LibraryOverview toggleSidebar={toggleSidebar} />} />
              <Route path="/library/book-inventory" element={<BookInventory toggleSidebar={toggleSidebar} />} />
              <Route path="/library/issue-return" element={<IssueReturnBook toggleSidebar={toggleSidebar} />} />
              <Route path="/library/fines" element={<FineCalculation toggleSidebar={toggleSidebar} />} />
              <Route path="/library/location" element={<LibraryLocation toggleSidebar={toggleSidebar} />} />
              <Route path="/library/reports" element={<LibraryReport toggleSidebar={toggleSidebar} />} />
              <Route path="/library/notices" element={<NoticeAnnouncement toggleSidebar={toggleSidebar} />} />
              
              {/* Counselling Management Routes */}
              <Route path="/counselling/enquiry" element={<EnquiryManagement toggleSidebar={toggleSidebar} />} />
              <Route path="/counselling/follow-up" element={<FollowUpDue toggleSidebar={toggleSidebar} />} />

              <Route path="/profile" element={<AdminProfile toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Main;
