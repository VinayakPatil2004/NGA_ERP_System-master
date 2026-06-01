import React, { useState } from 'react';
import ngaLogo from '../../assets/nga-logo.png';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LogOut,
  LayoutDashboard,
  Users,
  FileText,
  ClipboardCheck,
  GraduationCap,
  Calculator,
  User,
  ChevronLeft,
  ChevronRight,
  Calendar,
  ShieldCheck,
  ChevronDown,
  Bus,
  Package,
  Send,
  Star,
  BookOpen,
  Clock,
  FileCheck,
  CreditCard
} from 'lucide-react';

// Default modules targeting the Administrator layout if none provided.
const DEFAULT_NAV_MODULES = [
  { label: 'Academic Year', path: '/dashboard/admin/academic-year', icon: Calendar },
  { label: 'Calendar Manager', path: '/dashboard/admin/calendar', icon: Calendar },
  { label: 'Overview', path: '/dashboard/admin', icon: LayoutDashboard, exact: true },
  { label: 'Students', path: '/dashboard/admin/students', icon: Users },
  { label: 'ID Card Generator', path: '/dashboard/admin/id-cards', icon: CreditCard },
  { label: 'Enrollment', path: '/dashboard/admin/admissions', icon: FileText },
  {
    label: 'Attendance',
    path: '/dashboard/admin/attendance',
    icon: ClipboardCheck,
    subItems: [
      { label: 'Attendance Ledger', path: '/dashboard/admin/attendance' },
      { label: 'Attendance Settings', path: '/dashboard/admin/attendance-settings' },
    ]
  },
  {
    label: 'Classrooms',
    path: '/dashboard/admin/classrooms',
    icon: GraduationCap,
    subItems: [
      { label: 'Classrooms', path: '/dashboard/admin/classrooms' },
      { label: 'Class Reports', path: '/dashboard/admin/class-reports' },
    ]
  },
  { label: 'Fee & Finance', path: '/dashboard/admin/fee-finance', icon: Calculator },
  {
    label: 'Payroll Control',
    path: '/dashboard/admin/payroll-control',
    icon: ShieldCheck,
    subItems: [
      { label: 'Salary Setup', path: '/dashboard/admin/payroll/salary-setup' },
      { label: 'Generate Payroll', path: '/dashboard/admin/payroll/staff-payroll' },
      { label: 'Loan & Advance', path: '/dashboard/admin/payroll/loan-management' },
      { label: 'Payroll Records', path: '/dashboard/admin/payroll/payroll-records' },
    ]
  },
  { label: 'Staff', path: '/dashboard/admin/staff', icon: GraduationCap },
  { label: 'Alumni', path: '/dashboard/admin/alumni', icon: GraduationCap },
  { label: 'Transport', path: '/dashboard/admin/transport', icon: Bus },
  { label: 'Inventory', path: '/dashboard/admin/inventory', icon: Package },
  { label: 'Communication', path: '/dashboard/admin/communication', icon: Send },
  { label: 'Exam Management', path: '/dashboard/admin/exams', icon: ClipboardCheck },
  { label: 'Grading System', path: '/dashboard/admin/grading', icon: Star },
  {
    label: 'Counselling Management',
    path: '/dashboard/admin/counselling/enquiry',
    icon: Users,
    subItems: [
      { label: 'Enquiry Registry', path: '/dashboard/admin/counselling/enquiry' },
      { label: 'Follow-up Matrix', path: '/dashboard/admin/counselling/follow-up' },
    ]
  },
  { label: 'Timetable', path: '/dashboard/admin/timetable', icon: Clock },
  {
    label: 'Leave Management',
    path: '/dashboard/admin/leave-management',
    icon: ClipboardCheck,
    subItems: [
      { label: 'Staff Leaves', path: '/dashboard/admin/leave-management' },
      { label: 'Student Leaves', path: '/dashboard/admin/student-leaves' },
    ]
  },
  { label: 'Certificates', path: '/dashboard/admin/certificates', icon: FileCheck },
  { label: 'Visitor Log', path: '/dashboard/admin/visitors', icon: Users },
  {
    label: 'Library',
    path: '/dashboard/admin/library',
    icon: BookOpen,
    subItems: [
      { label: 'Books Inventory', path: '/dashboard/admin/library/book-inventory' },
      { label: 'Issue & Return', path: '/dashboard/admin/library/issue-return' },
      { label: 'Book Location', path: '/dashboard/admin/library/location' },
      { label: 'Library Reports', path: '/dashboard/admin/library/reports' },
      { label: 'Library Notices', path: '/dashboard/admin/library/notices' },
    ]
  },

  {
    label: 'User Management',
    path: '/dashboard/admin/users',
    icon: ShieldCheck,
    subItems: [
      { label: 'Staff', path: '/dashboard/admin/users/staff' },
      { label: 'Parents', path: '/dashboard/admin/users/parent' },
      { label: 'Students', path: '/dashboard/admin/users/student' },
    ]
  },
  { label: 'Profile', path: '/dashboard/admin/profile', icon: User },
];

/**
 * Sidebar - Strategic Navigation Identity Review
 * Refined to the 'Simplified Premium' aesthetic with rounded-2xl and 1px borders.
 */
const Sidebar = ({ modules, roleTitle = "ADMINISTRATOR", isOpen = true, onClose }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const { logoutUser, user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => {
    logoutUser();
    navigate('/administration', { replace: true });
  };

  const isPrincipalUser = user?.role?.toLowerCase() === 'principal';
  const displayRoleTitle = isPrincipalUser ? "PRINCIPAL" : roleTitle;

  let baseNavModules = modules || DEFAULT_NAV_MODULES;
  const basePath = isPrincipalUser ? '/dashboard/principle' : '/dashboard/admin';

  let navModules = baseNavModules.map(module => {
    const newModule = { ...module };
    if (newModule.path) {
      newModule.path = newModule.path.replace('/dashboard/admin', basePath);
    }
    if (newModule.subItems) {
      newModule.subItems = newModule.subItems.map(sub => ({
        ...sub,
        path: sub.path.replace('/dashboard/admin', basePath)
      }));
    }
    return newModule;
  });

  if (isPrincipalUser) {
    navModules = navModules.filter(item => item.label !== 'Payroll Control');
  }

  const toggleDropdown = (label) => {
    if (isCollapsed) setIsCollapsed(false);
    setOpenDropdown(openDropdown === label ? null : label);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-primary/60 backdrop-blur-sm z-45"
          onClick={onClose}
        />
      )}

      <aside
        className={`bg-primary text-white flex flex-col h-screen shadow-2xl fixed lg:relative transition-all duration-300 ease-in-out z-50 shrink-0
      ${isOpen ? (isCollapsed ? 'w-24' : 'w-64') : 'w-0 -translate-x-full overflow-hidden lg:translate-x-0 lg:w-0'}
      rounded-r-2xl
      `}
      >
        {/* Collapse Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex p-1.5 bg-[#FFB606] text-primary rounded-full shadow-lg border-2 border-primary hover:scale-110 transition-transform absolute -right-3.5 top-12 z-50 focus:outline-none"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4 font-bold" strokeWidth={3} /> : <ChevronLeft className="w-4 h-4 font-bold" strokeWidth={3} />}
        </button>

        {/* Header / Logo Component */}
        <div className={`flex items-center pt-10 pb-8 z-10 relative transition-all duration-300 ${isCollapsed ? 'flex-col gap-4 px-4' : 'gap-4 px-8'}`}>
          <div className={`bg-white p-2 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${isCollapsed ? 'w-12 h-12' : 'w-14 h-14'}`}>
            <img
              src={ngaLogo}
              alt="NGA Logo"
              className="w-full h-full object-contain"
              loading="eager"
            />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col overflow-hidden">
              <h1 className="text-accent font-black text-base lg:text-lg leading-tight tracking-tight uppercase whitespace-normal branding-text">NEW GRACE ACADEMY</h1>
              <p className="text-[8px] font-bold sidebar-text-muted tracking-[0.2em] uppercase mt-1 truncate"> {displayRoleTitle}</p>
            </div>
          )}
        </div>

        {/* Mobile-only Academic Year Selector */}
        <div className="px-6 pb-4 lg:hidden">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between group hover:bg-white/10 transition-all">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-amber-500" />
              <span className="text-[10px] font-black sidebar-text-muted uppercase tracking-widest">AY 2026-27</span>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>

        {/* Navigation Links Area */}
        {/* Scrollable area without visible scrollbar */}
        <nav className={`flex-1 py-4 flex flex-col gap-2 relative sidebar-nav-container`}>
          {navModules.map((item) => {
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isChildActive = hasSubItems && item.subItems.some(sub => pathname === sub.path);
            const isDropdownOpen = openDropdown === item.label || isChildActive;

            return (
              <div key={item.label} className="w-full">
                {hasSubItems ? (
                  <>
                    <div
                      className={`relative flex items-center transition-all duration-300 group cursor-pointer
                        ${isCollapsed ? 'mx-3 justify-center py-3 rounded-xl' : 'ml-6 px-6 py-3.5 rounded-l-full gap-4'}
                        ${(isDropdownOpen || isChildActive) ? 'text-white bg-white/5' : 'text-white/60 hover:text-white hover:bg-white/5'}
                      `}
                      onClick={() => toggleDropdown(item.label)}
                    >
                      <item.icon
                        className={`w-5 h-5 shrink-0 relative z-20 text-white`}
                        strokeWidth={isChildActive || isDropdownOpen ? 2.5 : 2}
                      />
                      {!isCollapsed && (
                        <>
                          <button
                            className={`relative z-20 tracking-wide text-sm font-bold truncate flex-1 text-left focus:outline-none text-white`}
                          >
                            {item.label}
                          </button>
                          <ChevronDown
                            className={`w-4 h-4 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''} text-white`}
                            strokeWidth={3}
                          />
                        </>
                      )}
                    </div>

                    {/* Sub Items */}
                    {!isCollapsed && (
                      <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out
                          ${isDropdownOpen ? 'max-h-64 py-2' : 'max-h-0'}
                        `}
                      >
                        {item.subItems.map((sub) => (
                          <NavLink
                            key={sub.label}
                            to={sub.path}
                            className={({ isActive }) =>
                              `flex items-center gap-4 ml-12 px-6 py-2.5 rounded-l-full transition-all duration-300 group relative
                                 ${isActive ? 'bg-white text-active-sidebar' : 'text-white/60 hover:text-white'}
                                `
                            }
                          >
                            {({ isActive }) => (
                              <>
                                {isActive && (
                                  <>
                                    <div className="absolute top-[-20px] right-0 w-5 h-5 bg-white pointer-events-none z-10" aria-hidden="true">
                                      <div className="w-full h-full bg-primary rounded-br-2xl" />
                                    </div>
                                    <div className="absolute bottom-[-20px] right-0 w-5 h-5 bg-white pointer-events-none z-10" aria-hidden="true">
                                      <div className="w-full h-full bg-primary rounded-tr-2xl" />
                                    </div>
                                  </>
                                )}
                                <div className={`w-1.5 h-1.5 rounded-full bg-current ${isActive ? 'opacity-100' : 'opacity-40'}`} />
                                <span
                                  className={`text-xs tracking-wider uppercase font-bold ${isActive ? 'text-black!' : 'text-inherit'}`}
                                >
                                  {sub.label}
                                </span>
                              </>
                            )}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <NavLink
                    to={item.path}
                    end={item.exact}
                    title={isCollapsed ? item.label : ""}
                    className={({ isActive }) =>
                      `relative flex items-center transition-all duration-300 group focus:outline-none
                     ${isCollapsed ? 'mx-3 justify-center py-3 rounded-xl' : 'ml-6 px-6 py-3.5 rounded-l-full gap-4'}
                     ${isActive
                        ? `bg-white text-active-sidebar`
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && !isCollapsed && (
                          <>
                            <div className="absolute top-[-20px] right-0 w-5 h-5 bg-white pointer-events-none z-10" aria-hidden="true">
                              <div className="w-full h-full bg-primary rounded-br-2xl" />
                            </div>
                            <div className="absolute bottom-[-20px] right-0 w-5 h-5 bg-white pointer-events-none z-10" aria-hidden="true">
                              <div className="w-full h-full bg-primary rounded-tr-2xl" />
                            </div>
                          </>
                        )}
                        <item.icon
                          className={`w-5 h-5 shrink-0 relative z-20 ${isActive ? 'text-black!' : 'text-white'}`}
                          strokeWidth={isActive ? 2.5 : 2}
                        />
                        {!isCollapsed && <span className={`relative z-20 tracking-wide text-sm font-bold truncate ${isActive ? 'text-black!' : 'text-inherit'}`}>{item.label}</span>}
                      </>
                    )}
                  </NavLink>
                )}
              </div>
            );
          })}
        </nav>

        {/* Sign Out Button Box */}
        <div className={`mt-auto mb-4 z-10 transition-all duration-300 ${isCollapsed ? 'px-4 pb-6' : 'p-8'}`}>
          <button
            onClick={handleLogout}
            title={isCollapsed ? "Sign Out" : ""}
            className={`flex items-center justify-center text-black! bg-white hover:bg-white/90 transition-all active:scale-[0.98]
          ${isCollapsed ? 'w-full py-4 rounded-xl' : 'gap-4 w-full px-6 py-5 rounded-xl uppercase tracking-widest text-[10px] font-bold border border-white/5 shadow-inner'}`}
          >
            <LogOut className="w-4 h-4 shrink-0 text-black!" strokeWidth={2.5} />
            {!isCollapsed && <span className="text-black!">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;