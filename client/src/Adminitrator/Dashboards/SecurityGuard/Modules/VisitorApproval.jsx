import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAcademicYear } from '../../../../context/AcademicYearContext';
import { 
    User, 
    CheckCircle, 
    XCircle, 
    Clock, 
    UserCheck,
    MessageSquare
} from 'lucide-react';

const VisitorApproval = () => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const [pendingVisitors, setPendingVisitors] = useState([]);
    const [loading, setLoading] = useState(true);
    const { selectedYear } = useAcademicYear();

    const fetchPendingVisitors = React.useCallback(async () => {
        if (!selectedYear) return;
        try {
            setLoading(true);
            const token = localStorage.getItem('slpaems_erp_token');
            const response = await axios.get(`${API_URL}/api/security/visitors/pending?academic_year_id=${selectedYear.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPendingVisitors(response.data);
        } catch (error) {
            console.error("Error fetching pending visitors:", error);
        } finally {
            setLoading(false);
        }
    }, [API_URL, selectedYear]);

    useEffect(() => {
        fetchPendingVisitors();
    }, [fetchPendingVisitors]);

    const handleApproval = async (visitorId, status) => {
        try {
            const token = localStorage.getItem('slpaems_erp_token');
            await axios.put(`${API_URL}/api/security/visitors/${visitorId}/approve`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`Visitor ${status} successfully`);
            fetchPendingVisitors();
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    if (pendingVisitors.length === 0 && !loading) return null;

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-amber-50/30">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                        <UserCheck className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-[#001736] uppercase tracking-tight">Visitor Approvals</h3>
                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">You have {pendingVisitors.length} pending requests</p>
                    </div>
                </div>
            </div>

            <div className="divide-y divide-slate-100">
                {loading ? (
                    <div className="p-8 text-center text-slate-400 italic text-xs">Loading requests...</div>
                ) : pendingVisitors.map(visitor => (
                    <div key={visitor.id} className="p-6 flex items-center justify-between gap-6 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 border border-slate-200">
                                <img 
                                    src={visitor.photo_url ? (visitor.photo_url.startsWith('data:') ? visitor.photo_url : `${API_URL}${visitor.photo_url}`) : 'https://via.placeholder.com/100'} 
                                    alt="" 
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-[#001736]">{visitor.name}</h4>
                                <div className="flex items-center gap-3 mt-1">
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                                        <MessageSquare className="w-3 h-3" />
                                        {visitor.purpose}
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                                        <Clock className="w-3 h-3" />
                                        {new Date(visitor.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => handleApproval(visitor.id, 'approved')}
                                className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 transition-all"
                                title="Approve Entry"
                            >
                                <CheckCircle className="w-5 h-5" />
                            </button>
                            <button 
                                onClick={() => handleApproval(visitor.id, 'rejected')}
                                className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 transition-all"
                                title="Reject Entry"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VisitorApproval;
