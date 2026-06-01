import React from 'react';
import { Menu, Calendar } from 'lucide-react';
import { useAcademicYear } from '../../context/AcademicYearContext';


/**
 * ModuleHeader - 'Attendance Desk' Dark Institutional Standard
 */
const ModuleHeader = ({
    title,
    subTitle,
    // badge,
    toggleSidebar,
    showSearch = false,
    onSearchChange = () => { },
    searchValue = "",
    onSearchToggle, // New callback for external toggles
    hideDesktopSearch = false, // New prop to remove header search on desktop
    hideAcademicYear = false, // New prop to hide academic year dropdown completely
    leftCustomContent, // New slot for prepending elements (Back button/Photo)
    customYearSelector = false, // Prop to enable local year selection
    selectedYearId: propSelectedYearId, // Local year ID
    allYears: propAllYears, // Local years list
    onYearChange, // Local year change callback
    children
}) => {
    const [localIsSearchOpen, setLocalIsSearchOpen] = React.useState(false);
    const { selectedYear: globalYear, allYears: globalAllYears, changeYear: globalChangeYear } = useAcademicYear();


    // Use props if customYearSelector is enabled, otherwise use global context
    const currentYearId = customYearSelector ? propSelectedYearId : globalYear?.id;
    const yearsList = customYearSelector ? propAllYears : globalAllYears;
    const handleYearChange = customYearSelector ? onYearChange : globalChangeYear;


    const handleSearchClick = () => {
        if (onSearchToggle) {
            onSearchToggle(); // If an external toggle is provided, use it
        } else {
            setLocalIsSearchOpen(!localIsSearchOpen);
        }
    };

    return (
        <div className={`bg-primary mb-4 px-4 lg:px-8 py-4 lg:py-4 rounded-md shadow-2xl transition-all duration-700 hover:shadow-primary/30 sticky top-0 md:static z-40 h-[70px] lg:h-auto flex items-center`}>
            {/* Background Accent / Glassmorphism Detail */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000"></div>

            <div className="flex flex-col w-full relative z-10">
                <div className="flex flex-row items-center justify-between gap-4 lg:gap-10">

                    {/* Left section: Identity & Branding */}
                    <div className="flex flex-1 py-1 items-center gap-4 lg:gap-8 min-w-0">
                        {/* Hamburger Menu (Mobile Only) */}
                        <button
                            onClick={toggleSidebar}
                            className="md:hidden! w-9 h-9 flex items-center justify-center bg-white text-[#001736] rounded-md transition-all shadow-xl active:scale-95 shrink-0"
                            aria-label="Toggle Sidebar"
                        >
                            <Menu className="w-5 h-5 lg:w-6 lg:h-6" />
                        </button>

                        <div className="flex flex-row items-center gap-4 lg:gap-8 min-w-0">
                            {/* Custom Left Content Slot (New) */}
                            {leftCustomContent && (
                                <div className="flex items-center gap-4 shrink-0">
                                    {leftCustomContent}
                                </div>
                            )}

                            {/* Title & Branding (Completely hidden on mobile < 1024px for space) */}
                            <div className="space-y-1 min-w-0 hidden lg:block shrink">
                                <h1 className="text-lg lg:text-3xl font-black text-white tracking-tighter uppercase leading-none drop-shadow-sm truncate">
                                    {title}
                                </h1>
                                <div className="flex items-center gap-2 mt-1 lg:mt-2">
                                    {typeof subTitle === 'string' ? (
                                        <p className="text-[8px] lg:text-[10px] font-black tracking-[0.2em] text-white/40 uppercase leading-none truncate">
                                            {subTitle}
                                        </p>
                                    ) : (
                                        subTitle
                                    )}
                                </div>
                            </div>

                            {/* Institutional Badge (AY identifier) - REPLACED WITH SELECTOR */}
                            {!hideAcademicYear && (
                                <div className="flex items-center shrink-0">
                                    <div className="relative group">
                                        <div className="flex items-center gap-1.5 lg:gap-2 bg-white border border-white/10 rounded-md px-2 lg:px-4 h-9 lg:h-auto lg:py-2 transition-all cursor-pointer">
                                            <Calendar className="w-3.5 h-3.5 text-[#FFB606] shrink-0" />
                                            <select
                                                value={currentYearId || ""}
                                                onChange={(e) => {
                                                    const year = yearsList?.find(y => y.id.toString() === e.target.value);
                                                    if (handleYearChange) handleYearChange(year);
                                                }}
                                                className="bg-transparent text-black text-[9px] lg:text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer appearance-none pr-3 w-28 lg:w-40 truncate"
                                            >
                                                {yearsList?.map(year => (
                                                    <option key={year.id} value={year.id} className="bg-white text-black uppercase font-bold p-3 rounded-md">
                                                        AY {year.year_name} {year.is_active ? '(ACTIVE)' : ''}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute right-2 lg:right-3 pointer-events-none">
                                                <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right section: System Controls */}
                    <div className="flex items-center gap-2 lg:gap-6 lg:justify-end shrink-0">
                        {showSearch && (
                            <div className="flex items-center">
                                {/* Search Toggle Button (Mobile Only) */}
                                <button
                                    onClick={handleSearchClick}
                                    className={`md:hidden flex items-center justify-center w-9 h-9 bg-white rounded-md shadow-xl active:scale-95 shrink-0 ${localIsSearchOpen ? 'text-indigo-600 border-indigo-100' : 'text-[#001736] border-transparent'} transition-all`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </button>

                                {/* Desktop Search Bar (Hidden if hideDesktopSearch is enabled) */}
                                {(!hideDesktopSearch) && (
                                    <div className="hidden lg:flex search-bar-institutional relative group">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        <input
                                            type="text"
                                            value={searchValue}
                                            onChange={(e) => onSearchChange(e.target.value)}
                                            placeholder="Quick Search..."
                                            className="pl-11 pr-4 py-3 bg-transparent border-none text-primary text-xs font-bold uppercase tracking-widest outline-none w-48 xl:w-64"
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                        {children}
                    </div>
                </div>

                {/* Mobile Expanded Search Bar - Only if no external toggle is used */}
                {showSearch && localIsSearchOpen && !onSearchToggle && (
                    <div className="lg:hidden absolute top-[70px] left-0 w-full p-4 bg-primary border-t border-white/5 animate-in slide-in-from-top-4 duration-300 z-30 shadow-2xl text-left">
                        <div className="relative group search-bar-institutional">
                            <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                autoFocus
                                type="text"
                                value={searchValue}
                                onChange={(e) => onSearchChange(e.target.value)}
                                placeholder="Type to search..."
                                className="w-full pl-11 pr-4 py-4 bg-transparent border-none text-primary text-[10px] font-bold uppercase tracking-widest outline-none"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ModuleHeader;
