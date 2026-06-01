import React, { useState } from 'react';
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
  ChevronDown
} from 'lucide-react';

// Default modules targeting the Administrator layout if none provided.
const DEFAULT_NAV_MODULES = [
  { label: 'Academic Year', path: '/dashboard/admin/academic-year', icon: Calendar },
  { label: 'Overview', path: '/dashboard/admin', icon: LayoutDashboard, exact: true },
  { label: 'Students', path: '/dashboard/admin/students', icon: Users },
  { label: 'Enrollment', path: '/dashboard/admin/admissions', icon: FileText },
  { label: 'Attendance', path: '/dashboard/admin/attendance', icon: ClipboardCheck },
  { label: 'Classrooms', path: '/dashboard/admin/classrooms', icon: GraduationCap },
  { label: 'Fee & Finance', path: '/dashboard/admin/fee-finance', icon: Calculator },
  { label: 'Staff', path: '/dashboard/admin/staff', icon: GraduationCap },
  { label: 'Alumni', path: '/dashboard/admin/alumni', icon: GraduationCap },
  
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
  const { logoutUser } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => {
    logoutUser();
    navigate('/administration', { replace: true });
  };

  const navModules = modules || DEFAULT_NAV_MODULES;

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
              src="https://newgraceacademy.in/assets/front/img/logo/nga-logo.png"
              alt="NGA Logo"
              className="w-full h-full object-contain"
              loading="eager"
            />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col overflow-hidden">
              <h1 className="text-accent font-bold text-xl leading-none tracking-wider uppercase truncate">NEW GRACE</h1>
              <p className="text-[8px] font-bold sidebar-text-muted tracking-[0.2em] uppercase mt-1 truncate">ACADEMY &bull; {roleTitle}</p>
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
                      className={`relative flex items-center transition-all duration-300 group
                        ${isCollapsed ? 'mx-3 justify-center py-3 rounded-xl' : 'ml-6 px-6 py-3.5 rounded-l-full gap-4'}
                        ${isChildActive
                          ? `bg-bg-base ${isCollapsed ? 'text-primary' : 'text-primary'}`
                          : isDropdownOpen ? 'sidebar-text-white bg-white/5' : 'sidebar-text-muted hover:sidebar-text-white hover:bg-white/5'}
                      `}
                    >
                      {/* Seamless Inverse Border Radius Cutouts for Active Parent */}
                      {isChildActive && !isCollapsed && (
                        <>
                          <div className="absolute top-[-20px] right-0 w-5 h-5 bg-bg-base pointer-events-none z-10" aria-hidden="true">
                            <div className="w-full h-full bg-primary rounded-br-2xl" />
                          </div>
                          <div className="absolute bottom-[-20px] right-0 w-5 h-5 bg-bg-base pointer-events-none z-10" aria-hidden="true">
                            <div className="w-full h-full bg-primary rounded-tr-2xl" />
                          </div>
                        </>
                      )}

                      <item.icon className="w-5 h-5 shrink-0 relative z-20" strokeWidth={isChildActive || isDropdownOpen ? 2.5 : 2} />
                      {!isCollapsed && (
                        <>
                          <button
                            onClick={() => toggleDropdown(item.label)}
                            className="relative z-20 tracking-wide text-sm font-bold truncate flex-1 text-left focus:outline-none"
                          >
                            {item.label}
                          </button>
                          <ChevronDown
                            onClick={() => toggleDropdown(item.label)}
                            className={`w-4 h-4 transition-transform duration-300 cursor-pointer ${isDropdownOpen ? 'rotate-180' : ''}`}
                            strokeWidth={3}
                          />
                        </>
                      )}
                    </div>

                    {/* Sub Items */}
                    {!isCollapsed && (
                      <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out bg-black/20
                          ${isDropdownOpen ? 'max-h-64 py-2' : 'max-h-0'}
                        `}
                      >
                        {item.subItems.map((sub) => (
                          <NavLink
                            key={sub.label}
                            to={sub.path}
                            className={({ isActive }) =>
                              `flex items-center gap-4 ml-12 px-6 py-2.5 rounded-l-full transition-all duration-300 group
                               ${isActive ? 'text-accent font-bold' : 'sidebar-text-muted hover:sidebar-text-white'}
                              `
                            }
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-current opacity-40" />
                            <span className="text-xs tracking-wider uppercase font-bold">{sub.label}</span>
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
                      `relative flex items-center transition-all duration-300 group
                     ${isCollapsed ? 'mx-3 justify-center py-3 rounded-xl' : 'ml-6 px-6 py-3.5 rounded-l-full gap-4'}
                     ${isActive
                        ? `bg-bg-base ${isCollapsed ? 'text-primary shadow-inner' : 'text-primary'}`
                        : 'sidebar-text-muted hover:sidebar-text-white hover:bg-white/5'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && !isCollapsed && (
                          <>
                            <div className="absolute top-[-20px] right-0 w-5 h-5 bg-bg-base pointer-events-none z-10" aria-hidden="true">
                              <div className="w-full h-full bg-primary rounded-br-2xl" />
                            </div>
                            <div className="absolute bottom-[-20px] right-0 w-5 h-5 bg-bg-base pointer-events-none z-10" aria-hidden="true">
                              <div className="w-full h-full bg-primary rounded-tr-2xl" />
                            </div>
                          </>
                        )}
                        <item.icon className="w-5 h-5 shrink-0 relative z-20" strokeWidth={isActive ? 2.5 : 2} />
                        {!isCollapsed && <span className="relative z-20 tracking-wide text-sm font-bold truncate">{item.label}</span>}
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
            className={`flex items-center justify-center text-rose-500 bg-black/10 hover:bg-black/30 transition-all active:scale-[0.98]
          ${isCollapsed ? 'w-full py-4 rounded-xl' : 'gap-4 w-full px-6 py-5 rounded-xl uppercase tracking-widest text-[10px] font-bold border border-white/5 shadow-inner'}`}
          >
            <LogOut className="w-4 h-4 shrink-0 opacity-60" strokeWidth={2.5} />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;