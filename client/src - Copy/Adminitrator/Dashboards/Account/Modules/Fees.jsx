import React, { useState } from 'react';
import { Search, CreditCard, Printer, History, Users, Eye, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import StudentProfile from '../../../admpages/StudentProfile';
import ModuleHeader from '../../../admcomponents/ModuleHeader';

/**
 * Fees Management - Strategic Financial Control & Registry Synchronization
 * Refined to the 'Simplified Premium' aesthetic with rounded-2xl and 1px borders.
 */
const Fees = ({ toggleSidebar }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [viewingStudent, setViewingStudent] = useState(null);

    // Initial dummy data for demonstration
    const studentsData = [
        { srNo: "1", name: "Rahul Sharma", grade: "10th", totalFees: "30000", paid: "15000", pending: "15000", lastPayment: "2026-03-20", phone: "9876543210", parent: "Amit Sharma" },
        { srNo: "2", name: "Zoya Sayed", grade: "Nursery", totalFees: "18000", paid: "18000", pending: "0", lastPayment: "2026-03-15", phone: "9876543222", parent: "Ayan Sayed" },
        { srNo: "3", name: "Aman Gupta", grade: "12th", totalFees: "35000", paid: "10000", pending: "25000", lastPayment: "2026-02-10", phone: "9876543244", parent: "Rajesh Gupta" },
    ];

    const filteredStudents = studentsData.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.srNo.includes(searchTerm)
    );

    if (viewingStudent) {
        return (
            <StudentProfile
                student={viewingStudent}
                onBack={() => setViewingStudent(null)}
            />
        );
    }

    return (
        <div className="p-4 lg:p-8 space-y-8 min-h-screen bg-[#F8FAFC] font-sans text-left">

            {/* 1. Standardized Module Header */}
            <ModuleHeader
                title="Fee Management"
                subTitle="Strategic Revenue Control & Collection Protocol"
                icon={ShieldCheck}
                badge="ACCOUNTS CORE"
                toggleSidebar={toggleSidebar}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                searchPlaceholder="Search Student ID or Identity..."
            />

            {/* 2. Students Fee Registry */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h2 className="text-[11px] font-bold text-[#001736] uppercase tracking-widest opacity-60">Revenue Tracking Console</h2>
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-400 uppercase tracking-widest shadow-sm">
                            Identities Tracked: {filteredStudents.length}
                        </span>
                    </div>
                </div>

                <div className="p-8">
                    <div className="grid grid-cols-12 gap-4 pb-5 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <div className="col-span-1">ID</div>
                        <div className="col-span-3">PERSONNEL IDENTITY</div>
                        <div className="col-span-2 text-center">TOTAL DUES</div>
                        <div className="col-span-2 text-center text-emerald-600">COMMITTED</div>
                        <div className="col-span-2 text-center text-rose-500">PENDING</div>
                        <div className="col-span-2 text-right">PROTOCOLS</div>
                    </div>

                    <div className="space-y-3">
                        {filteredStudents.map((student, idx) => (
                            <div key={idx} className="grid grid-cols-12 gap-4 items-center bg-slate-50/50 py-5 px-7 rounded-xl group hover:bg-white hover:shadow-md transition-all border border-slate-100">
                                <div className="col-span-1">
                                    <span className="text-[11px] font-bold text-indigo-500 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 shadow-sm whitespace-nowrap">
                                        {student.srNo}
                                    </span>
                                </div>
                                <div className="col-span-3">
                                    <p className="font-bold text-[#001736] text-[14px] uppercase tracking-tight leading-none">{student.name}</p>
                                    <p className="text-[9px] font-bold text-slate-300 uppercase mt-2 tracking-widest">{student.grade}</p>
                                </div>
                                <div className="col-span-2 text-center font-bold text-[#001736] tracking-tighter text-base">₹ {student.totalFees}</div>
                                <div className="col-span-2 text-center font-bold text-emerald-600 tracking-tighter text-base">₹ {student.paid}</div>
                                <div className="col-span-2 text-center font-bold text-rose-500 tracking-tighter text-base">₹ {student.pending}</div>
                                <div className="col-span-2 flex items-center justify-end gap-3">
                                    <button
                                        onClick={() => setViewingStudent(student)}
                                        className="p-2.5 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all border border-transparent hover:border-indigo-100"
                                        title="View Specifications"
                                    >
                                        <Eye className="w-5 h-5 opacity-60" />
                                    </button>
                                    <button className="p-2.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all border border-transparent hover:border-emerald-100" title="Synchronize Payment">
                                        <CreditCard className="w-5 h-5 opacity-60" />
                                    </button>
                                    <button className="p-2.5 text-slate-400 hover:bg-slate-50 rounded-lg transition-all border border-transparent hover:border-slate-200" title="Generate Receipt">
                                        <Printer className="w-5 h-5 opacity-40" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Lower Section: Recent Collection Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-[#001736] rounded-2xl p-8 text-white relative overflow-hidden shadow-2xl group border border-white/10">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:scale-150 transition-all duration-1000"></div>

                    <div className="flex items-center gap-4 mb-8 relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                            <History className="w-5 h-5 text-amber-400" />
                        </div>
                        <h3 className="text-lg font-bold tracking-tight uppercase text-white/80">Recent Collections</h3>
                    </div>

                    <div className="space-y-4 relative z-10">
                        <CollectionSmallRow name="Rahul Sharma" amount="₹ 15,000" method="Cash" />
                        <CollectionSmallRow name="Zoya Sayed" amount="₹ 8,500" method="UPI" />
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 group">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100 group-hover:scale-110 transition-transform">
                            <Users className="w-5 h-5 text-indigo-500" />
                        </div>
                        <h3 className="text-lg font-bold tracking-tight uppercase text-[#001736]">Outstanding Reminders</h3>
                    </div>

                    <div className="space-y-3">
                        <ReminderRow name="Aman Gupta" days="12 Days Overdue" amount="₹ 25,000" />
                        <ReminderRow name="Karan Mehra" days="5 Days Overdue" amount="₹ 12,000" />
                    </div>
                </div>
            </div>
        </div>
    );
};

const CollectionSmallRow = ({ name, amount, method }) => (
    <div className="flex items-center justify-between p-5 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all group/item">
        <div className="flex items-center gap-4">
            <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center text-[10px] font-bold text-white tracking-widest border border-white/10 group-hover/item:border-amber-400/50 transition-all">{name.charAt(0)}</div>
            <p className="text-[13px] font-bold text-white/80 uppercase tracking-tight">{name}</p>
        </div>
        <div className="text-right">
            <p className="text-base font-bold text-amber-400 tracking-tighter">{amount}</p>
            <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mt-1">{method}</p>
        </div>
    </div>
);

const ReminderRow = ({ name, days, amount }) => (
    <div className="flex items-center justify-between p-5 bg-rose-50/50 rounded-xl border border-rose-100 hover:bg-rose-50 transition-all group/item">
        <div className="flex items-center gap-4">
            <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center text-[10px] font-bold text-rose-500 border border-rose-100 group-hover/item:scale-110 transition-transform">{name.charAt(0)}</div>
            <div>
                <p className="text-[13px] font-bold text-[#001736] uppercase tracking-tight leading-none">{name}</p>
                <p className="text-[9px] font-bold text-rose-500 uppercase tracking-widest mt-2">{days}</p>
            </div>
        </div>
        <p className="text-base font-bold text-rose-600 tracking-tighter">{amount}</p>
    </div>
);

export default Fees;
