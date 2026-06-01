import React, { useState, useEffect } from 'react';
import { 
    ShieldCheck, IndianRupee, TrendingUp, Users, 
    CheckCircle2, AlertCircle, Calendar, Filter, 
    Download, PieChart, Activity
} from 'lucide-react';
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import DataTable from '../../../admcomponents/DataTable';
import { toast } from 'react-toastify';
import { getPayrollRegistry, updatePayrollStatus } from '../../../../services/hrAPI';

const AdminStatCard = ({ label, value, icon, color }) => {
    const IconComponent = icon;
    return (
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center text-white shadow-xl`}>
                <IconComponent size={24} />
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                <p className="text-xl font-black text-[#001736] tracking-tighter">{value}</p>
            </div>
        </div>
    );
};

/**
 * AdminPayrollControl - Master control for administrator oversight.
 * Simplified Premium with deep navy and emerald accents.
 */
const AdminPayrollControl = ({ toggleSidebar }) => {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [payroll, setPayroll] = useState([]);
    const [loading, setLoading] = useState(true);

    const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const fetchPayroll = React.useCallback(async () => {
        try {
            setLoading(true);
            const res = await getPayrollRegistry(month, year);
            setPayroll(res.data || []);
        } catch {
            toast.error('Oversight Sync Failure');
        } finally {
            setLoading(false);
        }
    }, [month, year]);

    useEffect(() => { fetchPayroll(); }, [fetchPayroll]);

    const handleApprove = async (id) => {
        try {
            // In a real system, there might be an 'approved' status.
            // For now, Admin marks it as 'processed' if pending, or just reviews.
            // Let's assume Admin 'Verifies' by marking it processed if it was pending.
            await updatePayrollStatus(id, 'processed');
            toast.success('Record Verified ✓');
            fetchPayroll();
        } catch {
            toast.error('Verification Error');
        }
    };

    const stats = {
        totalPayout: payroll.reduce((s, p) => s + parseFloat(p.net_salary || 0), 0),
        processed: payroll.filter(p => p.status !== 'pending').length,
        pending: payroll.filter(p => p.status === 'pending').length,
        paid: payroll.filter(p => p.status === 'paid').length
    };

    return (
        <div className="p-4 lg:p-8 space-y-6 min-h-screen bg-[#F8FAFC]">
            <ModuleHeader 
                title="Payroll Master Control" 
                subTitle="Administrative Oversight & Financial Verification"
                icon={ShieldCheck}
                toggleSidebar={toggleSidebar}
            />

            {/* Top Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <AdminStatCard label="Monthly Commitment" value={`₹${(stats.totalPayout/1000).toFixed(1)}K`} icon={IndianRupee} color="bg-[#001736]" />
                <AdminStatCard label="Verification Rate" value={`${payroll.length ? Math.round((stats.processed/payroll.length)*100) : 0}%`} icon={Activity} color="bg-indigo-600" />
                <AdminStatCard label="Disbursed" value={stats.paid} icon={CheckCircle2} color="bg-emerald-500" />
                <AdminStatCard label="Pending Review" value={stats.pending} icon={AlertCircle} color="bg-rose-500" />
            </div>

            {/* Filter Section */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
                        <Calendar size={16} className="text-slate-400" />
                        <select value={month} onChange={e => setMonth(+e.target.value)} className="bg-transparent text-xs font-black text-[#001736] outline-none">
                            {MONTHS.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                        </select>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
                        <select value={year} onChange={e => setYear(+e.target.value)} className="bg-transparent text-xs font-black text-[#001736] outline-none">
                            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">
                    <Download size={14} /> Export Report
                </button>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <DataTable
                    headers={[
                        { label: 'Personnel Identity' },
                        { label: 'Gross (Est.)' },
                        { label: 'Deductions' },
                        { label: 'Net Disbursable' },
                        { label: 'Current Status' },
                        { label: 'Master Action', className: 'text-center' }
                    ]}
                    loading={loading}
                    columnCount={6}
                >
                    {payroll.map(p => (
                        <tr key={p.staff_id} className="hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors">
                            <td className="px-6 py-4">
                                <p className="text-sm font-bold text-[#001736]">{p.full_name}</p>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest">{p.employee_id} · {p.designation}</p>
                            </td>
                            <td className="px-6 py-4 text-xs font-bold text-slate-600">₹{(parseFloat(p.net_salary) + parseFloat(p.deductions)).toLocaleString()}</td>
                            <td className="px-6 py-4 text-xs font-bold text-rose-500">₹{parseFloat(p.deductions).toLocaleString()}</td>
                            <td className="px-6 py-4 text-sm font-black text-emerald-600">₹{parseFloat(p.net_salary).toLocaleString()}</td>
                            <td className="px-6 py-4">
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                                    p.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    p.status === 'processed' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                    'bg-rose-50 text-rose-500 border-rose-100'
                                }`}>
                                    {p.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                                {p.status === 'pending' ? (
                                    <button onClick={() => handleApprove(p.payroll_id)} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-md">
                                        Verify
                                    </button>
                                ) : (
                                    <div className="flex items-center justify-center text-slate-300">
                                        <ShieldCheck size={18} />
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                </DataTable>
            </div>
        </div>
    );
};


export default AdminPayrollControl;
