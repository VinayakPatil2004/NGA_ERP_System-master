import React from 'react';
import { Users, Search, ChevronRight, User } from 'lucide-react';
import ModuleHeader from '../../../admcomponents/ModuleHeader';

const StudentDetails = ({ toggleSidebar, selectedYear, selectedYearName }) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <ModuleHeader
        title="Student Details"
        subTitle="Comprehensive Profile Intelligence"
        icon={Users}
        badge={selectedYearName || "Master Directory"}
        toggleSidebar={toggleSidebar}
      />
      
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8">
          <div className="flex flex-col md:flex-row items-center gap-6 pb-8 border-b border-slate-100">
              <div className="relative w-full md:w-96 group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#001736] transition-colors" />
                  <input type="text" placeholder="Search by Name or ID..." className="w-full pl-14 pr-8 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest outline-none shadow-sm focus:bg-white focus:border-[#001736]/30 transition-all" />
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="p-6 bg-white border border-slate-100 rounded-[24px] shadow-sm hover:shadow-xl transition-all duration-500 group cursor-pointer border-l-4 border-l-transparent hover:border-l-indigo-600">
                      <div className="flex items-center gap-5">
                          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors shadow-inner">
                              <User className="w-7 h-7" />
                          </div>
                          <div className="flex-1">
                              <h5 className="text-[14px] font-black text-[#001736] uppercase tracking-tighter">Student Profile {i}</h5>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Grade 12 - Science Wing</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-[#001736] group-hover:translate-x-1 transition-all" />
                      </div>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
};

export default StudentDetails;
