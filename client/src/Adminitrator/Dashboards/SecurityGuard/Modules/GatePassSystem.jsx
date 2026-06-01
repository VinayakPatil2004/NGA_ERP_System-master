import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAcademicYear } from '../../../../context/AcademicYearContext';
import { 
    Ticket, 
    CheckCircle, 
    XCircle, 
    Clock, 
    Search, 
    User,
    ScanLine,
    ShieldCheck,
    AlertCircle,
    Calendar,
    LogOut
} from 'lucide-react';
import { Html5QrcodeScanner } from "html5-qrcode";
import ModuleHeader from '../../../admcomponents/ModuleHeader';

const GatePassSystem = ({ toggleSidebar }) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const [passes, setPasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const { selectedYear } = useAcademicYear();
    const [verificationQR, setVerificationQR] = useState('');
    const [verifiedPass, setVerifiedPass] = useState(null);
    const [showScanner, setShowScanner] = useState(false);

    const fetchPasses = React.useCallback(async () => {
        if (!selectedYear) return;
        try {
            setLoading(true);
            const token = localStorage.getItem('slpaems_erp_token');
            const response = await axios.get(`${API_URL}/api/security/entries?type=pass&academic_year_id=${selectedYear.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (Array.isArray(response.data)) {
                setPasses(response.data);
            } else {
                setPasses([]);
            }
        } catch (error) {
            console.error("Error fetching passes:", error);
        } finally {
            setLoading(false);
        }
    }, [API_URL, selectedYear]);

    useEffect(() => {
        fetchPasses();
    }, [fetchPasses]);

    const handleAutoVerify = React.useCallback(async (qr) => {
        try {
            const token = localStorage.getItem('slpaems_erp_token');
            const response = await axios.get(`${API_URL}/api/security/passes/verify?qr_code=${qr}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setVerifiedPass(response.data);
            toast.success("Gate pass verified successfully");
        } catch (error) {
            setVerifiedPass(null);
            toast.error(error.response?.data?.error || "Invalid gate pass");
        }
    }, [API_URL]);

    useEffect(() => {
        let scanner = null;
        if (showScanner) {
            scanner = new Html5QrcodeScanner("reader", { 
                fps: 10, 
                qrbox: { width: 250, height: 250 } 
            }, false);

            scanner.render((decodedText) => {
                setVerificationQR(decodedText);
                handleAutoVerify(decodedText);
                scanner.clear();
                setShowScanner(false);
            }, () => {
                // console.warn(error);
            });
        }

        return () => {
            if (scanner) {
                scanner.clear().catch(err => console.error("Scanner cleanup error:", err));
            }
        };
    }, [showScanner, handleAutoVerify]);



    const handleVerifyPass = async (e) => {
        if (e) e.preventDefault();
        handleAutoVerify(verificationQR);
    };

    const handleLogEntryFromPass = async () => {
        try {
            const token = localStorage.getItem('slpaems_erp_token');
            await axios.post(`${API_URL}/api/security/entries`, {
                entry_type: verifiedPass.pass_type,
                person_id: verifiedPass.person_id,
                gate_pass_id: verifiedPass.id,
                remarks: `Entry via Gate Pass: ${verifiedPass.reason}`,
                academic_year_id: selectedYear?.id
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Entry logged successfully via Gate Pass");
            setVerifiedPass(null);
            setVerificationQR('');
        } catch (err) {
            console.error(err);
            toast.error("Failed to log entry");
        }
    };

    const handleStatusUpdate = async (passId, status) => {
        try {
            const token = localStorage.getItem('slpaems_erp_token');
            const userData = JSON.parse(localStorage.getItem('slpaems_erp_user'));
            await axios.put(`${API_URL}/api/security/passes/${passId}/approve`, {
                status,
                approved_by: userData.id
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`Pass ${status} successfully`);
            fetchPasses();
        } catch (err) {
            console.error(err);
            toast.error("Failed to update pass status");
        }
    };

    return (
        <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 min-h-screen bg-[#F8FAFC] font-sans text-left">
            <ModuleHeader 
                title="Gate Pass System" 
                subTitle="Verify and approve exit permissions" 
                toggleSidebar={toggleSidebar} 
            >
                <div className="flex items-center gap-4">
                    <div className="bg-amber-50 border border-amber-100 px-4 py-2 sm:px-6 sm:py-3 rounded-xl flex items-center gap-3">
                        <AlertCircle className="w-4 h-4 text-amber-600 hidden sm:block" />
                        <div>
                            <p className="text-[9px] sm:text-[10px] font-bold text-amber-600 uppercase tracking-widest whitespace-nowrap">Awaiting Approval</p>
                            <p className="text-xs sm:text-sm font-bold text-amber-700">{passes.filter(p => p.approval_status === 'pending').length} Requests</p>
                        </div>
                    </div>
                </div>
            </ModuleHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                {/* QR Verification Section */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                                    <ScanLine className="w-6 h-6 text-indigo-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-[#001736] tracking-tight uppercase">Verify Pass</h3>
                                    <p className="text-xs font-medium text-slate-400">Scan or enter QR code</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowScanner(!showScanner)}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${showScanner ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                            >
                                <ScanLine className="w-5 h-5" />
                            </button>
                        </div>

                        {showScanner && (
                            <div className="mb-6 rounded-2xl overflow-hidden border-2 border-dashed border-indigo-200 p-2 bg-slate-50">
                                <div id="reader" className="w-full"></div>
                                <p className="text-[10px] text-center text-slate-400 font-bold uppercase mt-2">Align QR Code inside the frame</p>
                            </div>
                        )}

                        <form onSubmit={handleVerifyPass} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">QR Code Data</label>
                                <div className="relative group">
                                    <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                    <input 
                                        type="text" 
                                        value={verificationQR}
                                        onChange={(e) => setVerificationQR(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-sm font-bold text-[#001736] focus:outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all placeholder:text-slate-300"
                                        placeholder="Scan or enter ID"
                                    />
                                </div>
                            </div>
                            <button 
                                type="submit"
                                className="w-full bg-[#001736] text-white py-4 rounded-xl text-xs font-bold uppercase tracking-[0.2em] shadow-lg shadow-blue-900/10 hover:bg-[#002b64] transition-all active:scale-[0.98]"
                            >
                                Verify & Show Details
                            </button>
                        </form>

                        {verifiedPass && (
                            <div className="mt-8 p-6 rounded-2xl bg-emerald-50 border border-emerald-100 animate-in fade-in slide-in-from-top-4">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                                        <ShieldCheck className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Pass Verified</p>
                                        <p className="text-sm font-bold text-[#001736]">{verifiedPass.person_name}</p>
                                    </div>
                                </div>
                                <div className="space-y-3 pt-4 border-t border-emerald-200/50">
                                    <div className="flex justify-between text-[10px] font-bold">
                                        <span className="text-emerald-600/60 uppercase">Type</span>
                                        <span className="text-[#001736] uppercase">{verifiedPass.pass_type}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-bold">
                                        <span className="text-emerald-600/60 uppercase">Reason</span>
                                        <span className="text-[#001736] truncate ml-4">{verifiedPass.reason}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-bold">
                                        <span className="text-emerald-600/60 uppercase">Valid Until</span>
                                        <span className="text-[#001736]">{new Date(verifiedPass.valid_until).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleLogEntryFromPass}
                                    className="w-full mt-6 bg-emerald-600 text-white py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-md shadow-emerald-900/10"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Confirm & Log Entry
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Requests List Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-[#001736] tracking-tight uppercase">Recent Pass Requests</h3>
                                <p className="text-xs font-medium text-slate-400">Manage institutional exit permissions</p>
                            </div>
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                <input 
                                    type="text" 
                                    placeholder="Search requests..." 
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-12 pr-4 text-xs font-medium focus:outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all"
                                />
                            </div>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {loading ? (
                                <div className="p-12 text-center text-slate-400 italic">Loading requests...</div>
                            ) : passes.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                        <Ticket className="w-8 h-8 text-slate-200" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-400">No recent pass requests found</p>
                                </div>
                            ) : (Array.isArray(passes) ? passes : []).filter(p => 
                                p.person_name?.toLowerCase().includes(search.toLowerCase())
                            ).map(pass => (
                                <div key={pass.id} className="p-8 hover:bg-slate-50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                                            <User className="w-6 h-6 text-slate-300" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h4 className="text-base font-bold text-[#001736] tracking-tight">{pass.person_name}</h4>
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border
                                                    ${pass.pass_type === 'student' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                                    {pass.pass_type}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 font-medium mt-1">{pass.reason}</p>
                                            <div className="flex items-center gap-4 mt-3">
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {new Date(pass.created_at).toLocaleDateString()}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {new Date(pass.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {pass.approval_status === 'pending' ? (
                                            <>
                                                <button 
                                                    onClick={() => handleStatusUpdate(pass.id, 'approved')}
                                                    className="bg-emerald-50 text-emerald-600 px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-emerald-100 hover:bg-emerald-100 transition-all flex items-center gap-2"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    Approve
                                                </button>
                                                <button 
                                                    onClick={() => handleStatusUpdate(pass.id, 'rejected')}
                                                    className="bg-rose-50 text-rose-600 px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-rose-100 hover:bg-rose-100 transition-all flex items-center gap-2"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                    Reject
                                                </button>
                                            </>
                                        ) : (
                                            <span className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border flex items-center gap-2
                                                ${pass.approval_status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                                {pass.approval_status === 'approved' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                                {pass.approval_status}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GatePassSystem;
