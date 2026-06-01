import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TeacherLogin from './Adminitrator/Dashboards/Teacher/TeacherLogin';
import Login from './Adminitrator/admpages/Login';
import AcademicLogin from './pages/Login';
import ForgotPassword from './Adminitrator/admpages/ForgotPassword';
import ResetPassword from './Adminitrator/admpages/ResetPassword';
import Main from './Adminitrator/Dashboards/Admin/Main';
import AccountantMain from './Adminitrator/Dashboards/Account/Main';
import PrincipleMain from './Adminitrator/Dashboards/Principle/Main';
import TeacherMain from './Adminitrator/Dashboards/Teacher/Main';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LandingPage from './Adminitrator/admpages/LandingPage';
import StudentDashboard from './pages/StudentDashboard';
import ParentDashboard from './pages/ParentDashboard';

// Smart Route Guard for Institutional Roles
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (!user) return <Navigate to="/administration" replace />;
    if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
    return children;
};

// Administration Portal Entry Logic
const AdministrationEntry = () => {
    const { user, getDashboardPath } = useAuth();
    if (user) return <Navigate to={getDashboardPath(user.role)} replace />;
    return <Login />;
};

const AppContent = () => {
    return (
        <div className="min-h-screen flex flex-col">
            <main className="grow overflow-x-hidden">
                <Routes>
                    <Route path="/" element={<AcademicLogin />} />
                    
                    {/* Administrator Unified Dashboards (Protected) */}
                    <Route path="/dashboard/admin/*" element={<ProtectedRoute allowedRoles={['admin', 'HR']}><Main /></ProtectedRoute>} />
                    <Route path="/dashboard/accountant/*" element={<ProtectedRoute allowedRoles={['accountant']}><AccountantMain /></ProtectedRoute>} />
                    <Route path="/dashboard/principal/*" element={<ProtectedRoute allowedRoles={['principle']}><PrincipleMain /></ProtectedRoute>} />
                    <Route path="/dashboard/teacher/*" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherMain /></ProtectedRoute>} />
                    <Route path="/dashboard/student" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
                    <Route path="/dashboard/parent" element={<ProtectedRoute allowedRoles={['parent']}><ParentDashboard /></ProtectedRoute>} />
                    
                    {/* Authentication Portal Access */}
                    <Route path="/administration" element={<AdministrationEntry />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password/:token" element={<ResetPassword />} />
                    
                    {/* Fallback to Root */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
        </div>
    );
};

const App = () => {
    return (
        <AuthProvider>
            <Router>
                <AppContent />
                <ToastContainer position="top-right" autoClose={3000} theme="colored" />
            </Router>
        </AuthProvider>
    );
};

export default App;