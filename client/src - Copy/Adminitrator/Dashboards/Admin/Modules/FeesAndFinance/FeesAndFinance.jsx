import React, { useState, useEffect } from 'react';
import {
    Calculator, BookOpen, Settings, UserPlus, Activity,
    Percent, BarChart3, TrendingDown, Users, CreditCard,
    ShieldCheck, ArrowLeft, LayoutGrid, ChevronRight
} from 'lucide-react';
import ModuleHeader from '../../../../admcomponents/ModuleHeader';

// API & Services
import { getAcademicYearsList } from '../../../../../services/classroomAPI';

// Sub-module Imports
import FeeStructureManager from './components/FeeStructureManager';
import StudentFeeAssignment from './components/StudentFeeAssignment';
import FinancialReports from './components/FinancialReports';
import ExpenseMonitoring from './components/ExpenseMonitoring';

const FeesAndFinance = ({ toggleSidebar }) => {
    const [activeModule, setActiveModule] = useState('dashboard');
    const [academicYears, setAcademicYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState('');
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

    // Bootstrap Academic Years
    useEffect(() => {
        const fetchYears = async () => {
            try {
                const years = await getAcademicYearsList();
                setAcademicYears(years);
                const active = years.find(y => y.is_active) || years[0];
                if (active) setSelectedYear(active.id);
            } catch (error) {
                console.error("Year Sync Failed:", error);
            }
        };
        fetchYears();
    }, []);

    const modules = [
        { id: 'structure', title: 'Fee Structure', icon: BookOpen, color: 'indigo', desc: 'Define class-wise fees' },
        { id: 'StudentFeeManagement', title: 'Student Fee Management', icon: Calculator, color: 'emerald', desc: 'Sync & map student fees' },
        { id: 'reports', title: 'CA Finance Reports', icon: BarChart3, color: 'amber', desc: 'Audit & Compliance' },
        { id: 'expenses', title: 'Expenses', icon: TrendingDown, color: 'rose', desc: 'Spending authorization' },
    ];

    const selectedYearName = academicYears.find(y => y.id == selectedYear)?.year_name || selectedYear;

    const renderActiveModule = () => {
        switch (activeModule) {
            case 'structure': return <FeeStructureManager selectedYear={selectedYear} selectedYearName={selectedYearName} isMobileSearchOpen={isMobileSearchOpen} />;
            case 'StudentFeeManagement': return <StudentFeeAssignment toggleSidebar={toggleSidebar} />;
            case 'reports': return <FinancialReports toggleSidebar={toggleSidebar} />;
            case 'expenses': return <ExpenseMonitoring toggleSidebar={toggleSidebar} />;
            default: return <FinanceDashboard onSelect={setActiveModule} modules={modules} />;
        }
    };

    const activeModuleData = modules.find(m => m.id === activeModule);

    return (
        <div className="p-4 lg:p-8 space-y-8 min-h-screen bg-[#F8FAFC]">

            <ModuleHeader
                title={activeModule === 'dashboard' ? "Financial Hub" : activeModuleData?.title}
                subTitle={activeModule === 'dashboard' ? "Institutional Economic Monitoring" : "Administrative Control Panel"}
                icon={activeModule === 'dashboard' ? Calculator : activeModuleData?.icon}
                badge={`AY ${selectedYearName}`}
                toggleSidebar={toggleSidebar}
                showSearch={activeModule === 'structure'} // Only show search icon on active modules that support it
                onSearchToggle={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                hideDesktopSearch={activeModule === 'structure'} // Hide desktop header search if module has its own
            >
                <div className="flex items-center gap-4">
                    {activeModule !== 'dashboard' && (
                        <button
                            onClick={() => setActiveModule('dashboard')}
                            className="flex items-center gap-2 px-3 py-3 lg:px-6 lg:py-4 bg-white/10 border border-white/20 rounded-xl lg:rounded-2xl text-white font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-[#001736] transition-all shadow-xl active:scale-95 group shrink-0"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            <span className="hidden lg:inline text-[9px] font-black uppercase tracking-widest">Back to Hub</span>
                        </button>
                    )}
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="hidden lg:block bg-white border border-slate-200 text-[#001736] px-5 py-4 rounded-2xl text-[12px] font-bold shadow-sm focus:ring-8 focus:ring-[#001736]/5 outline-none uppercase tracking-widest cursor-pointer hover:bg-slate-50 transition-all"
                    >
                        {academicYears.map(year => (
                            <option key={year.id} value={year.id}>AY {year.year_name}</option>
                        ))}
                    </select>
                </div>
            </ModuleHeader>

            {renderActiveModule()}
        </div>
    );
};

const StatusMetric = (props) => {
    const { label, value, iconComponent: Icon, color, active, onClick } = props;

    const colorMap = {
        indigo: { border: 'border-indigo-600', bg: 'bg-indigo-50/50', iconBg: 'bg-indigo-600', text: 'text-indigo-900', ring: 'ring-indigo-500/10' },
        emerald: { border: 'border-emerald-600', bg: 'bg-emerald-50/50', iconBg: 'bg-emerald-600', text: 'text-emerald-900', ring: 'ring-emerald-500/10' },
        rose: { border: 'border-rose-600', bg: 'bg-rose-50/50', iconBg: 'bg-rose-600', text: 'text-rose-900', ring: 'ring-rose-500/10' },
        amber: { border: 'border-amber-600', bg: 'bg-amber-50/50', iconBg: 'bg-amber-600', text: 'text-amber-900', ring: 'ring-amber-500/10' },
    };

    const theme = colorMap[color] || colorMap.indigo;

    return (
        <button
            onClick={onClick}
            className={`p-6 rounded-2xl border-l-4 transition-all duration-300 group hover:shadow-xl active:scale-[0.98] text-left flex items-center justify-between gap-5 shadow-sm
        ${theme.border} ${theme.bg} ${active ? `ring-2 ${theme.ring}` : ''}`}
        >
            <div className="flex-1">
                <p className={`text-[8px] font-black uppercase tracking-[0.2em] mb-1 opacity-60 ${theme.text}`}>{label}</p>
                <h3 className={`text-xl font-black tracking-tight leading-tight ${theme.text} uppercase`}>{value}</h3>
            </div>
            <div className={`w-12 h-12 rounded-xl ${theme.iconBg} flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform border border-white/20 shrink-0`}>
                <Icon className="w-4 h-4 text-white" />
            </div>
        </button>
    );
};

const FinanceDashboard = ({ onSelect, modules }) => {
    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* 2. Module Navigation Grid */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {modules.map((module) => (
                    <StatusMetric
                        key={module.id}
                        label={module.desc}
                        value={module.title}
                        iconComponent={module.icon}
                        color={module.color}
                        onClick={() => onSelect(module.id)}
                    />
                ))}
            </div>
        </div>
    );
};

export default FeesAndFinance;
