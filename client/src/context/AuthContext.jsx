import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

    //  use consistent key "user"
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('slpaems_erp_user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    const [loading, setLoading] = useState(false);

    //  LOGIN FUNCTION 
    const loginUser = (userData, token) => {
        // console.log("LOGIN TOKEN:", token);

        // Ensure new login starts with admin-set active year
        if (userData?.id) {
            sessionStorage.removeItem(`selectedAcademicYearId_${userData.id}`);
            localStorage.removeItem(`selectedAcademicYearId_${userData.id}`);
        }
        sessionStorage.removeItem('selectedAcademicYearId');
        localStorage.removeItem('selectedAcademicYearId');

        if (!token || token === "null" || token === "undefined") {
            console.error("Invalid token received!");
            return;
        }

        //  STANDARDIZED KEYS
        localStorage.setItem('slpaems_erp_user', JSON.stringify(userData));
        localStorage.setItem('slpaems_erp_token', token);

        setUser(userData);
    };

    // LOGOUT FUNCTION 
    const logoutUser = () => {
        if (user?.id) {
            sessionStorage.removeItem(`selectedAcademicYearId_${user.id}`);
            localStorage.removeItem(`selectedAcademicYearId_${user.id}`);
        }
        sessionStorage.removeItem('selectedAcademicYearId');
        localStorage.removeItem('selectedAcademicYearId');
        setUser(null);

        localStorage.removeItem('slpaems_erp_user');
        localStorage.removeItem('slpaems_erp_token');
    };

    //  ROLE HELPERS
    const isAdmin = () => user?.role === 'admin';
    const isTeacher = () => user?.role === 'teacher';
    const isAccountant = () => user?.role === 'accountant';
    const isPrincipal = () => user?.role?.toLowerCase() === 'principal';

    //  DASHBOARD ROUTING
    const getDashboardPath = (role) => {
        const normalizedRole = role?.toLowerCase();
        switch (normalizedRole) {
            case 'admin': return '/dashboard/admin';
            case 'teacher': return '/dashboard/teacher';
            case 'accountant': return '/dashboard/accountant';

            case 'principal': return '/dashboard/principle';
            case 'librarian': return '/dashboard/library';
            case 'hr': return '/dashboard/hr';

            case 'student': return '/dashboard/student';
            case 'parent': return '/dashboard/parent';
            case 'counsellor': return '/dashboard/counsellor';
            case 'security_guard':
            case 'security gaurd': return '/dashboard/security';
            default: return '/dashboard/no-access';
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            setLoading,
            loginUser,
            logoutUser,
            isAdmin,
            isTeacher,
            isAccountant,
            isPrincipal,
            getDashboardPath
        }}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};