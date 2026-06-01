import React, { useState } from 'react';
import {
    Calculator, BookOpen, Settings, UserPlus, Activity,
    Percent, BarChart3, TrendingDown, Users, CreditCard,
    ShieldCheck, ArrowLeft, LayoutGrid, ChevronRight
} from 'lucide-react';
import ModuleHeader from '../../../../admcomponents/ModuleHeader';
import { useAcademicYear } from '../../../../../context/AcademicYearContext';

// Sub-module Imports
import FeeStructureManager from './components/FeeStructureManager';
import StudentFeeAssignment from './components/StudentFeeAssignment';
import FinancialReports from './components/FinancialReports';
import ExpenseMonitoring from './components/ExpenseMonitoring';
import CAFinanceReport from './components/CAFinanceReport';

const FeesAndFinance = ({ toggleSidebar }) => {
    const { selectedYear: globalYear } = useAcademicYear();
    // Derive selectedYear (ID) from global context
    const selectedYear = globalYear?.id || '';
    const selectedYearName = globalYear?.year_name || '';

    const [activeModule, setActiveModule] = useState('dashboard');
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

    const modules = [
        { id: 'structure', title: 'Fee Structure', icon: BookOpen, color: 'indigo', desc: 'Define class-wise fees' },
        { id: 'StudentFeeManagement', title: 'Student Fee Management', icon: Calculator, color: 'emerald', desc: 'Sync & map student fees' },
        { id: 'reports', title: 'Finance Reports', icon: BarChart3, color: 'amber', desc: 'Audit & Compliance' },
        { id: 'expenses', title: 'Expenses', icon: TrendingDown, color: 'rose', desc: 'Spending authorization' },
        { id: 'ca_reports', title: 'CA Reports', icon: ShieldCheck, color: 'emerald', desc: 'Finance document entry' },
    ];


    const renderActiveModule = () => {
        switch (activeModule) {
            case 'structure': return <FeeStructureManager selectedYear={selectedYear} selectedYearName={selectedYearName} isMobileSearchOpen={isMobileSearchOpen} />;
            case 'StudentFeeManagement': return <StudentFeeAssignment toggleSidebar={toggleSidebar} isMobileSearchOpen={isMobileSearchOpen} setIsMobileSearchOpen={setIsMobileSearchOpen} />;
            case 'reports': return <FinancialReports toggleSidebar={toggleSidebar} isMobileSearchOpen={isMobileSearchOpen} setIsMobileSearchOpen={setIsMobileSearchOpen} />;
            case 'expenses': return <ExpenseMonitoring toggleSidebar={toggleSidebar} isMobileSearchOpen={isMobileSearchOpen} setIsMobileSearchOpen={setIsMobileSearchOpen} selectedYear={selectedYear} />;
            case 'ca_reports': return <CAFinanceReport isMobileSearchOpen={isMobileSearchOpen} setIsMobileSearchOpen={setIsMobileSearchOpen} selectedYear={selectedYear} />;
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
                showSearch={['structure', 'StudentFeeManagement', 'reports', 'ca_reports', 'expenses'].includes(activeModule)} // Only show search icon on active modules that support it
                onSearchToggle={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                hideDesktopSearch={['structure', 'StudentFeeManagement', 'reports', 'ca_reports', 'expenses'].includes(activeModule)} // Hide desktop header search if module has its own
            >
                <div className="flex items-center gap-4">
                    {activeModule !== 'dashboard' && (
                        <button
                            onClick={() => setActiveModule('dashboard')}
                            className="flex items-center gap-2 px-3 py-2 lg:px-6 lg:py-3 bg-white border border-slate-200 rounded-md lg:rounded-md text-black! font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-xl active:scale-95 group shrink-0"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-black!" />
                            <span className="hidden lg:inline text-[9px] font-black text-black! uppercase tracking-widest">Back to Hub</span>
                        </button>
                    )}
                 
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
            className={`p-6 lg:p-6 min-h-[100px] lg:min-h-[140px] rounded-xl border-l-4 transition-all duration-300 group hover:shadow-xl active:scale-[0.98] text-left flex flex-col items-start justify-between gap-4 shadow-sm overflow-hidden select-none
        ${theme.border} ${theme.bg} ${active ? `ring-2 ${theme.ring} shadow-md` : ''}`}
        >
            <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-xl ${theme.iconBg} flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform border border-white/20 shrink-0 mb-2`}>
                <Icon className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
            </div>
            <div className="flex-1 w-full overflow-hidden pointer-events-none">
                <p className={`text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] mb-1.5 opacity-60 ${theme.text} whitespace-normal leading-tight italic`}>{label}</p>
                <h3 className={`text-sm lg:text-xl font-black tracking-tighter leading-tight ${theme.text} uppercase wrap-break-word`}>{value || 0}</h3>
            </div>
        </button>
    );
};

const FinanceDashboard = ({ onSelect, modules }) => {
    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* 2. Module Navigation Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
