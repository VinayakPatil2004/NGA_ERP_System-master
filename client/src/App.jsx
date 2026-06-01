import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Adminitrator/admpages/Login';
import AcademicLogin from './pages/Login';
import ForgotPassword from './Adminitrator/admpages/ForgotPassword';
import ResetPassword from './Adminitrator/admpages/ResetPassword';
import Main from './Adminitrator/Dashboards/Admin/Main';
import AccountantMain from './Adminitrator/Dashboards/Account/Main';
import TeacherMain from './Adminitrator/Dashboards/Teacher/Main';
import LibraryMain from './Adminitrator/Dashboards/Library/Main';
import HRMain from './Adminitrator/Dashboards/HR/Main';
import CounselorMain from './Adminitrator/Dashboards/counseller_dashboard/Main';
import SecurityMain from './Adminitrator/Dashboards/SecurityGuard/Main';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import StudentDashboard from './pages/StudentDashboard';
import ParentDashboard from './pages/ParentDashboard';
import { ShieldOff, LogOut, Clock } from 'lucide-react';
import { AcademicYearProvider } from './context/AcademicYearContext';

// ── No Dashboard Fallback ─────────────────────────────────────────────────────
const NoDashboard = () => {
    const { user, logoutUser } = useAuth();
    return (
        <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-6">
            <div className="max-w-md w-full">
                {/* Card */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 text-center shadow-2xl">
                    {/* Icon */}
                    <div className="w-20 h-20 bg-amber-400/10 border-2 border-amber-400/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Clock className="w-10 h-10 text-amber-400" />
                    </div>

                    {/* Badge */}
                    <span className="inline-block px-3 py-1 bg-amber-400/10 border border-amber-400/30 rounded-full text-amber-400 text-[10px] font-black uppercase tracking-[0.25em] mb-4">
                        Coming Soon
                    </span>

                    {/* Heading */}
                    <h1 className="text-2xl font-black text-white tracking-tight mb-2">
                        Dashboard Not Available
                    </h1>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed mb-2">
                        The dashboard for the&nbsp;
                        <span className="text-amber-400 font-black uppercase">
                            {user?.role || 'assigned'}
                        </span>
                        &nbsp;role is currently under development.
                    </p>
                    <p className="text-slate-500 text-xs font-medium mb-8">
                        Please contact your system administrator for assistance.
                    </p>

                    {/* Info strip */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 mb-8 flex items-center gap-4 text-left">
                        <ShieldOff className="w-4 h-4 text-slate-500 shrink-0" />
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Logged in as</p>
                            <p className="text-xs font-bold text-white mt-0.5">
                                {user?.fullName || user?.username || 'Unknown User'}
                                <span className="ml-2 text-slate-500">·</span>
                                <span className="ml-2 text-amber-400 uppercase">{user?.role}</span>
                            </p>
                        </div>
                    </div>

                    {/* Logout button */}
                    <button
                        onClick={logoutUser}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-white/10 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-white hover:text-red-400 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-200"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>

                {/* Footer */}
                <p className="text-center text-slate-600 text-[10px] font-bold uppercase tracking-widest mt-6">
                    Grace ERP System · Institutional Portal
                </p>
            </div>
        </div>
    );
};

// Smart Route Guard for Institutional Roles
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (!user) {
        // Students and parents have their own login at '/'
        const studentFacingRoles = ['student', 'parent'];
        const isStudentFacingRoute = allowedRoles?.some(r => studentFacingRoles.includes(r.toLowerCase()));
        return <Navigate to={isStudentFacingRoute ? '/' : '/administration'} replace />;
    }
    if (allowedRoles) {
        const normalizedUserRole = user.role.toLowerCase();
        const isAllowed = allowedRoles.some(role => role.toLowerCase() === normalizedUserRole);
        if (!isAllowed) return <Navigate to="/" replace />;
    }
    return children;
};

// Administration Portal Entry Logic
const AdministrationEntry = () => {
    const { user, getDashboardPath } = useAuth();
    if (user) return <Navigate to={getDashboardPath(user.role)} replace />;
    return <Login />;
};

// Smart Catch-All — authenticated users go to their dashboard, others to login
const SmartFallback = () => {
    const { user, getDashboardPath } = useAuth();
    if (user) return <Navigate to={getDashboardPath(user.role)} replace />;
    return <Navigate to="/administration" replace />;
};

const AppContent = () => {
    return (
        <div className="min-h-screen flex flex-col">
            <main className="grow overflow-x-hidden">
                <Routes>
                    <Route path="/" element={<AcademicLogin />} />

                    {/* Administrator Unified Dashboards (Protected) */}
                    <Route path="/dashboard/admin/*" element={<ProtectedRoute allowedRoles={['admin']}><Main /></ProtectedRoute>} />
                    <Route path="/dashboard/principle/*" element={<ProtectedRoute allowedRoles={['principal']}><Main /></ProtectedRoute>} />
                    <Route path="/dashboard/hr/*" element={<ProtectedRoute allowedRoles={['hr']}><HRMain /></ProtectedRoute>} />
                    <Route path="/dashboard/accountant/*" element={<ProtectedRoute allowedRoles={['accountant']}><AccountantMain /></ProtectedRoute>} />
                    <Route path="/dashboard/teacher/*" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherMain /></ProtectedRoute>} />
                    <Route path="/dashboard/library/*" element={<ProtectedRoute allowedRoles={['librarian', 'admin']}><LibraryMain /></ProtectedRoute>} />
                    <Route path="/dashboard/counsellor/*" element={<ProtectedRoute allowedRoles={['counsellor']}><CounselorMain /></ProtectedRoute>} />
                    <Route path="/dashboard/security/*" element={<ProtectedRoute allowedRoles={['security_guard', 'security gaurd', 'admin']}><SecurityMain /></ProtectedRoute>} />
                    <Route path="/dashboard/student" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
                    <Route path="/dashboard/parent" element={<ProtectedRoute allowedRoles={['parent']}><ParentDashboard /></ProtectedRoute>} />

                    {/* Fallback for roles without a dedicated dashboard yet */}
                    <Route path="/dashboard/no-access" element={<ProtectedRoute><NoDashboard /></ProtectedRoute>} />

                    {/* Authentication Portal Access */}
                    <Route path="/administration" element={<AdministrationEntry />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password/:token" element={<ResetPassword />} />

                    {/* Smart Catch-All — send authenticated users to their dashboard, guests to login */}
                    <Route path="*" element={<SmartFallback />} />
                </Routes>
            </main>
        </div>
    );
};

const App = () => {
    return (
        <AuthProvider>
            <AcademicYearProvider>
                <Router>
                    <AppContent />
                    <ToastContainer position="top-right" autoClose={3000} theme="colored" />
                </Router>
            </AcademicYearProvider>
        </AuthProvider>
    );
};

export default App;