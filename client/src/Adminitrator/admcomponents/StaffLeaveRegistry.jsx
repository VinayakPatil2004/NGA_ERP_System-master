import React, { useState, useEffect, useCallback } from 'react';
import { 
    Clock, CalendarCheck, CalendarX, Plus, RefreshCw, Eye, Trash2, ShieldCheck, FileText
} from 'lucide-react';
import ModuleHeader from './ModuleHeader';
import DataTable from './DataTable';
import ApplyLeaveModal from './ApplyLeaveModal';
import { toast } from 'react-toastify';
import hrAPI from '../../services/hrAPI';

const StaffLeaveRegistry = ({ toggleSidebar, roleTitle = "STAFF", hideHeader = false }) => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState(null);

    // Dynamic User Detection based on multiple possible localStorage keys
    const user = JSON.parse(localStorage.getItem('slpaems_erp_user') || localStorage.getItem('user'));
    const staffId = user?.id;
    const applicantType = user?.userType || user?.role || 'staff';

    const fetchLeaves = useCallback(async () => {
        if (!staffId) return;
        try {
            setLoading(true);
            const data = await hrAPI.getLeaveApplications({ 
                staff_id: staffId,
                applicant_type: applicantType
            });
            setLeaves(data || []);
        } catch (err) {
            toast.error('Failed to load leave records');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [staffId, applicantType]);

    useEffect(() => {
        fetchLeaves();
    }, [fetchLeaves]);

    const handleCancel = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this leave request?')) return;
        try {
            await hrAPI.deleteLeaveApplication(id);
            toast.success('Leave request cancelled');
            fetchLeaves();
        } catch (err) {
            toast.error(err?.response?.data?.error || 'Cancellation failed');
        }
    };

    const statusStyle = {
        pending:  'bg-amber-50  text-amber-600  border border-amber-100',
        approved: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
        rejected: 'bg-rose-50   text-rose-600   border border-rose-100',
    };

    const stats = [
        { label: 'Pending', value: leaves.filter(l => l.status === 'pending').length, color: 'text-amber-500', icon: Clock },
        { label: 'Approved', value: leaves.filter(l => l.status === 'approved').length, color: 'text-emerald-500', icon: CalendarCheck },
        { label: 'Rejected', value: leaves.filter(l => l.status === 'rejected').length, color: 'text-rose-500', icon: CalendarX }
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {!hideHeader && (
                <ModuleHeader
                    title="My Leave Registry"
                    subTitle={`${roleTitle} Leave Registry & History`}
                    icon={CalendarCheck}
                    badge={`${stats[0].value} Pending Requests`}
                    toggleSidebar={toggleSidebar}
                >
                    <div className="flex items-center gap-3">
                        <button onClick={fetchLeaves} className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-[#001736] transition-all active:rotate-180 duration-700 shadow-sm cursor-pointer">
                            <RefreshCw size={18} />
                        </button>
                        <button
                            onClick={() => setShowApplyModal(true)}
                            className="flex items-center gap-2 bg-white text-black px-6 h-12 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-slate-300 transition-all active:scale-95 cursor-pointer"
                        >
                            <Plus size={18} />
                            <span>Apply for Leave</span>
                        </button>
                    </div>
                </ModuleHeader>
            )}

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-6 group hover:shadow-md transition-all">
                        <div className={`w-14 h-14 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:scale-105 transition-transform`}>
                            <stat.icon className={`w-7 h-7 ${stat.color}`} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <h3 className="text-3xl font-black text-[#001736]">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Registry Table */}
            <DataTable
                headers={[
                    { label: 'Leave Type' },
                    { label: 'Duration' },
                    { label: 'Units' },
                    { label: 'Applied On' },
                    { label: 'Status' },
                    { label: 'Actions', className: 'text-center' },
                ]}
                columnCount={6}
                loading={loading}
                emptyMessage="No leave history recorded yet."
                className="border border-black"
            >
                {leaves.map((leave) => (
                    <tr key={leave.id} className="hover:bg-slate-50/50 transition-colors border-b border-black">
                        <td className="px-6 py-4 border-r border-black">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-100 transition-all">
                                    <FileText size={18} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 whitespace-nowrap">
                                    {leave.leave_type}
                                </span>
                            </div>
                        </td>
                        <td className="px-6 py-4 border-r border-black">
                            <p className="text-xs font-bold text-slate-600 tracking-tight">{new Date(leave.from_date).toLocaleDateString('en-IN')}</p>
                            <p className="text-[10px] text-slate-400">to {new Date(leave.to_date).toLocaleDateString('en-IN')}</p>
                        </td>
                        <td className="px-6 py-4 border-r border-black text-center">
                            <span className="text-lg font-black text-[#001736]">{leave.days}</span>
                            <span className="text-[10px] text-slate-400 font-bold ml-1">days</span>
                        </td>
                        <td className="px-6 py-4 border-r border-black">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                {new Date(leave.applied_at).toLocaleDateString('en-IN')}
                            </p>
                        </td>
                        <td className="px-6 py-4 border-r border-black">
                            <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full ${statusStyle[leave.status]}`}>
                                {leave.status}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-center border-r border-black">
                            <div className="flex items-center justify-center gap-2">
                                <button onClick={() => setSelectedLeave(leave)}
                                    className="p-2.5 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl border border-slate-200 transition-all hover:shadow-md cursor-pointer"
                                    title="View Details">
                                    <Eye size={16} />
                                </button>
                                {leave.status === 'pending' && (
                                    <button onClick={() => handleCancel(leave.id)}
                                        className="p-2.5 bg-rose-50 text-rose-300 hover:text-rose-600 rounded-xl border border-rose-100 transition-all cursor-pointer"
                                        title="Cancel Request">
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </td>
                    </tr>
                ))}
            </DataTable>

            {/* Apply Leave Modal */}
            {showApplyModal && (
                <ApplyLeaveModal 
                    staffId={staffId}
                    applicantType={applicantType}
                    onClose={() => setShowApplyModal(false)}
                    onSuccess={fetchLeaves}
                />
            )}

            {/* View Details Modal */}
            {selectedLeave && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setSelectedLeave(null)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                        <div className="bg-slate-50 p-8 border-b border-black flex items-center gap-6">
                            <div className="w-20 h-20 bg-[#001736] rounded-2xl border border-black overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                                <ShieldCheck size={32} className="text-white/20" />
                            </div>
                            <div>
                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${statusStyle[selectedLeave.status]}`}>
                                    {selectedLeave.status}
                                </span>
                                <h3 className="text-2xl font-black text-[#001736] uppercase tracking-tight mt-2 leading-none">LEAVE DETAILS</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Institutional Absence Matrix</p>
                            </div>
                        </div>
                        <div className="p-10 space-y-8">
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Category</p>
                                    <p className="text-sm font-black text-[#001736]">{selectedLeave.leave_type}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Duration</p>
                                    <p className="text-sm font-black text-[#001736]">{selectedLeave.days} Days</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">From</p>
                                    <p className="text-sm font-black text-[#001736]">{new Date(selectedLeave.from_date).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">To</p>
                                    <p className="text-sm font-black text-[#001736]">{new Date(selectedLeave.to_date).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 italic">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Stated Reason</p>
                                <p className="text-xs text-[#001736] font-medium leading-relaxed">"{selectedLeave.reason}"</p>
                            </div>
                            {selectedLeave.review_remarks && (
                                <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100 italic">
                                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">Authority Feedback</p>
                                    <p className="text-xs text-indigo-700 font-medium leading-relaxed">"{selectedLeave.review_remarks}"</p>
                                </div>
                            )}
                            <button 
                                onClick={() => setSelectedLeave(null)}
                                className="w-full py-4 bg-[#001736] text-white rounded-xl font-black text-[10px] uppercase tracking-widest"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffLeaveRegistry;
