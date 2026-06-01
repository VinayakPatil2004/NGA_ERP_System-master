import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('grace_erp_user');
        return storedUser ? JSON.parse(storedUser) : null;
    });
    const [loading, setLoading] = useState(false);

    const loginUser = (userData, token) => {
        setUser(userData);
        localStorage.setItem('grace_erp_user', JSON.stringify(userData));
        localStorage.setItem('grace_erp_token', token);
    };

    const logoutUser = () => {
        setUser(null);
        localStorage.removeItem('grace_erp_user');
        localStorage.removeItem('grace_erp_token');
    };

    const isAdmin = () => user?.role === 'admin';
    const isTeacher = () => user?.role === 'teacher';
    const isAccountant = () => user?.role === 'accountant';
    const isPrincipal = () => user?.role === 'principle';

    const getDashboardPath = (role) => {
        switch (role) {
            case 'admin': return '/dashboard/admin';
            case 'teacher': return '/dashboard/teacher';
            case 'accountant': return '/dashboard/accountant';
            case 'principle': return '/dashboard/principal';
            case 'HR': return '/dashboard/admin';
            case 'student': return '/dashboard/student';
            case 'parent': return '/dashboard/parent';
            default: return '/';
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
