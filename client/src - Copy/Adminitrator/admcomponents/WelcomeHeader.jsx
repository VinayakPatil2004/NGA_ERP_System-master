import React from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const WelcomeHeader = () => {
   const { user } = useAuth();

   // Helper to get initials for the avatar fallback
   const getInitials = (name) => {
      if (!name) return "GU";
      return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
   };

   return (
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
         <div className="flex items-center gap-6">
            {/* Avatar / Character Icon */}
            <div className="w-20 h-20 rounded-3xl bg-white shadow-sm border border-slate-100 overflow-hidden shrink-0 flex items-end justify-center">
               <div className="w-16 h-16 bg-amber-100 rounded-t-full relative border-4 border-white shadow-inner flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-[#8D5B4C] absolute -top-4"></div>
                  <div className="w-12 h-6 bg-sky-400 absolute bottom-0 rounded-t-xl"></div>
               </div>
            </div>

            <div className="space-y-2">
               <h1 className="text-4xl font-black tracking-tight text-[#001736]">
                  Welcome, <span className="text-[#EF4444]">{user?.full_name?.split(' ')[0] || "Guest"}!</span>
               </h1>
               <div className="flex items-center gap-4">
                  <span className="bg-white border border-slate-200 text-[#001736] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                     {user?.role || "Administrator"}
                  </span>
                  <div className="flex items-center gap-2">
                     <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                     <span className="text-xs font-bold text-slate-500 tracking-wide">Online now</span>
                  </div>
               </div>
            </div>
         </div>

         <div className="flex items-center gap-4">
            <button className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-500 hover:text-[#001736] hover:shadow-md transition-all">
               <Bell className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-4 bg-white p-2 pr-6 rounded-3xl shadow-sm border border-slate-100">
               <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-[#001736] text-xs">
                  {getInitials(user?.full_name)}
               </div>
               <div className="flex flex-col">
                  <span className="text-sm font-black text-[#001736]">{user?.full_name || "Guest User"}</span>
                  <span className="text-[9px] font-black tracking-widest text-[#EF4444] uppercase">
                     {user?.role || "Admin"} ID: {user?.id || "00000"}
                  </span>
               </div>
            </div>
         </div>
      </div>
   );
};

export default WelcomeHeader;
