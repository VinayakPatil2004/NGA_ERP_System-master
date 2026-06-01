import React, { useState } from 'react';
import { FileSpreadsheet, Search, Download, Printer, IndianRupee, CheckCircle, TrendingDown, Calendar } from 'lucide-react';
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import DataTable from '../../../admcomponents/DataTable';

const StaffPayrollRecord = ({ toggleSidebar }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [month, setMonth] = useState('2024-10');

    const records = [
        { id: 'PR001', name: 'John Doe', empId: 'EMP001', month: 'October 2024', basic: 50000, deductions: 1000, net: 49000, status: 'Paid', date: '2024-11-01' },
        { id: 'PR002', name: 'Jane Smith', empId: 'EMP002', month: 'October 2024', basic: 45000, deductions: 0, net: 45000, status: 'Paid', date: '2024-11-01' },
        { id: 'PR003', name: 'Michael Johnson', empId: 'EMP003', month: 'October 2024', basic: 55000, deductions: 2500, net: 52500, status: 'Paid', date: '2024-11-01' },
        { id: 'PR004', name: 'Emily Davis', empId: 'EMP004', month: 'October 2024', basic: 38000, deductions: 500, net: 37500, status: 'Paid', date: '2024-11-01' },
        { id: 'PR005', name: 'Robert Brown', empId: 'EMP005', month: 'October 2024', basic: 42000, deductions: 800, net: 41200, status: 'Paid', date: '2024-11-01' },
    ];

    const filtered = records.filter(r =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.empId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPaid = filtered.reduce((sum, r) => sum + r.net, 0);
    const totalDeductions = filtered.reduce((sum, r) => sum + r.deductions, 0);

    return (
        <div className="p-4 lg:p-8 space-y-6 min-h-screen bg-[#F8FAFC]">
            <ModuleHeader
                title="Payroll Records"
                subTitle="Historical Salary Archives & Payslips"
                icon={FileSpreadsheet}
                badge={`${records.length} Records`}
                toggleSidebar={toggleSidebar}
            />

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Records" value={records.length} icon={FileSpreadsheet} color="bg-blue-600" />
                <StatCard label="Total Paid" value={`₹${(totalPaid / 1000).toFixed(1)}K`} icon={IndianRupee} color="bg-emerald-500" />
                <StatCard label="Total Deductions" value={`₹${totalDeductions.toLocaleString()}`} icon={TrendingDown} color="bg-rose-500" />
                <StatCard label="All Paid" value="100%" icon={CheckCircle} color="bg-indigo-500" />
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 lg:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="flex gap-3 w-full lg:w-auto flex-wrap">
                    {/* Month picker */}
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 py-3 px-4 rounded-xl">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <input
                            type="month"
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                            className="bg-transparent text-sm font-bold text-[#001736] outline-none"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-3 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all">
                        <Download className="w-4 h-4" /> Export Excel
                    </button>
                </div>
                <div className="relative w-full lg:max-w-sm">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name, ID or record no..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400"
                    />
                </div>
            </div>

            {/* DataTable */}
            <DataTable
                headers={[
                    { label: 'Record ID', className: 'hidden md:table-cell' },
                    { label: 'Employee' },
                    { label: 'Basic Salary', className: 'hidden lg:table-cell' },
                    { label: 'Deductions', className: 'hidden lg:table-cell' },
                    { label: 'Net Paid' },
                    { label: 'Pay Date' },
                    { label: 'Status' },
                    { label: 'Actions', className: 'text-center' },
                ]}
                columnCount={8}
                loading={false}
                emptyMessage="No Payroll Records Found"
                footer={
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400">
                        <span className="tracking-widest">Salary Archive: {month}</span>
                        <span className="tracking-[0.2em]">{filtered.length} Records — Total: ₹{totalPaid.toLocaleString()}</span>
                    </div>
                }
            >
                {filtered.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors group">
                        {/* Record ID */}
                        <td className="px-4 lg:px-8 py-5 border-r border-slate-100 hidden md:table-cell">
                            <span className="text-xs font-black text-indigo-500 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">{rec.id}</span>
                        </td>
                        {/* Employee */}
                        <td className="px-4 lg:px-8 py-5 border-r border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white font-black text-sm shadow-md shrink-0">
                                    {rec.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-[#001736]">{rec.name}</p>
                                    <p className="text-[10px] text-slate-400 font-medium">{rec.empId} · {rec.month}</p>
                                </div>
                            </div>
                        </td>
                        {/* Basic */}
                        <td className="px-4 lg:px-8 py-5 border-r border-slate-100 hidden lg:table-cell">
                            <p className="text-sm font-bold text-[#001736]">₹{rec.basic.toLocaleString()}</p>
                        </td>
                        {/* Deductions */}
                        <td className="px-4 lg:px-8 py-5 border-r border-slate-100 hidden lg:table-cell">
                            <p className="text-sm font-bold text-rose-500">₹{rec.deductions.toLocaleString()}</p>
                        </td>
                        {/* Net Paid */}
                        <td className="px-4 lg:px-8 py-5 border-r border-slate-100">
                            <p className="text-sm font-black text-emerald-600">₹{rec.net.toLocaleString()}</p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Net Salary</p>
                        </td>
                        {/* Date */}
                        <td className="px-4 lg:px-8 py-5 border-r border-slate-100">
                            <p className="text-sm font-medium text-slate-600">{new Date(rec.date).toLocaleDateString('en-IN')}</p>
                        </td>
                        {/* Status */}
                        <td className="px-4 lg:px-8 py-5 border-r border-slate-100">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-100">
                                <CheckCircle className="w-3 h-3" /> {rec.status}
                            </span>
                        </td>
                        {/* Actions */}
                        <td className="px-4 lg:px-8 py-5">
                            <div className="flex items-center justify-center gap-2">
                                <button className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-colors border border-blue-100" title="Download Payslip">
                                    <Download className="w-4 h-4" />
                                </button>
                                <button className="p-2 bg-slate-50 text-slate-600 hover:bg-[#001736] hover:text-white rounded-lg transition-colors border border-slate-200" title="Print Payslip">
                                    <Printer className="w-4 h-4" />
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
            </DataTable>
        </div>
    );
};

const StatCard = ({ label, value, color, icon: Icon }) => (
    <div className="bg-white p-4 lg:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 group hover:shadow-md transition-all">
        <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
            <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
            <p className="text-lg font-black text-[#001736]">{value}</p>
        </div>
    </div>
);

export default StaffPayrollRecord;
