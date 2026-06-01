import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getActiveYear, getAllAcademicYears } from '../services/academicYearAPI';
import { useAuth } from './AuthContext';

const AcademicYearContext = createContext();

export const AcademicYearProvider = ({ children }) => {
    const { user } = useAuth();
    const [selectedYear, setSelectedYear] = useState(null);
    const [allYears, setAllYears] = useState([]);
    const [loading, setLoading] = useState(true);

    const refreshYears = useCallback(async () => {
        const token = localStorage.getItem('slpaems_erp_token');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const [active, all] = await Promise.all([
                getActiveYear(),
                getAllAcademicYears()
            ]);
            setAllYears(all);
            
            // Check if we have a saved year in sessionStorage scoped to the user
            const key = user?.id ? `selectedAcademicYearId_${user.id}` : 'selectedAcademicYearId';
            const savedYearId = sessionStorage.getItem(key);
            if (savedYearId) {
                const found = all.find(y => y.id.toString() === savedYearId);
                if (found) {
                    setSelectedYear(found);
                } else {
                    setSelectedYear(active);
                }
            } else {
                setSelectedYear(active);
            }
        } catch (error) {
            console.error("Failed to fetch academic years:", error);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        refreshYears();
    }, [refreshYears, user]);

    const changeYear = (year) => {
        setSelectedYear(year);
        const key = user?.id ? `selectedAcademicYearId_${user.id}` : 'selectedAcademicYearId';
        if (year) {
            sessionStorage.setItem(key, year.id);
        } else {
            sessionStorage.removeItem(key);
        }
    };

    return (
        <AcademicYearContext.Provider value={{ selectedYear, allYears, changeYear, loading, refreshYears }}>
            {children}
        </AcademicYearContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAcademicYear = () => {
    const context = useContext(AcademicYearContext);
    if (!context) {
        throw new Error('useAcademicYear must be used within an AcademicYearProvider');
    }
    return context;
};
