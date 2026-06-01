import React, { useState, useEffect, useCallback } from "react";
import { 
    FileCheck, Clock, CheckCircle, 
    XCircle, RefreshCw, User, 
    Search, Filter, ChevronRight,
    Award, FileText, AlertCircle
} from "lucide-react";
import ModuleHeader from "../../../admcomponents/ModuleHeader";
import certificateAPI from "../../../../services/certificateAPI";
import { toast } from "react-toastify";

const CertificateApproval = ({ toggleSidebar }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bonafide'); // bonafide or leaving
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await certificateAPI.getAllRequests({ cert_type: activeTab });
      setRequests(data || []);
      setCurrentPage(1); // Reset to first page on data refresh or tab change
    } catch (err) {
      console.error(err);
      toast.error("Failed to sync certificate requests");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (id) => {
    try {
      await certificateAPI.teacherApprove(id);
      toast.success("Request approved and forwarded ✓");
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Approval failed");
    }
  };

  const statusStyle = {
    pending_teacher:  'bg-amber-50  text-amber-600  border border-amber-100',
    approved_teacher: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
    approved_admin:   'bg-blue-50 text-blue-600 border border-blue-100',
    approved_principal: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    rejected:         'bg-rose-50   text-rose-600   border border-rose-100',
  };

  const filteredRequests = requests.filter(req => {
    const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
    const matchesSearch = 
      req.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      req.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      req.middle_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      req.father_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      req.student_id_no?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const stats = [
    { label: 'Total Requests', value: requests.length, icon: FileText, color: 'bg-indigo-500' },
    { label: 'Pending Review', value: requests.filter(l => l.status === 'pending_teacher').length, icon: Clock, color: 'bg-amber-500' },
    { label: 'Approved by Me', value: requests.filter(l => l.status !== 'pending_teacher').length, icon: CheckCircle, color: 'bg-emerald-500' }
  ];

  return (
    <div className="p-4 lg:p-8 bg-[#F8FAFC] min-h-screen animate-in fade-in duration-500 font-sans text-left">
      <ModuleHeader
        title="Certificate Approvals"
        subTitle="Student Document Verification & Authorization"
        icon={Award}
        toggleSidebar={toggleSidebar}
      >
          <div className="flex items-center gap-3">
              <button 
                  onClick={fetchData} 
                  className={`p-3 bg-white border border-slate-200 rounded-2xl text-indigo-500 hover:bg-slate-50 transition-all ${loading ? 'animate-spin' : ''}`}
              >
                  <RefreshCw size={18} />
              </button>
          </div>
      </ModuleHeader>

      <div className="max-w-7xl mx-auto mt-8 space-y-8">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-8 rounded-4xl border border-slate-200 shadow-sm flex items-center gap-6 group hover:shadow-md transition-all">
                        <div className={`w-16 h-16 ${stat.color} text-white rounded-3xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                            <stat.icon size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{stat.label}</p>
                            <p className="text-3xl font-black text-[#001736] mt-1">{stat.value}</p>
                        </div>
                    </div>
                ))}
          </div>

          {/* Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex bg-slate-100 p-1.5 rounded-xl w-fit">
                    {['bonafide', 'leaving'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                activeTab === tab ? 'bg-white text-[#001736] shadow-md' : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            {tab} Certificate
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4 flex-1 md:justify-end">
                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search students..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-black rounded-xl text-sm font-bold text-[#001736] outline-none focus:border-indigo-400 transition-all shadow-sm"
                        />
                    </div>
                    <select 
                        value={filterStatus}
                        onChange={(e) => {
                            setFilterStatus(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="px-6 py-3 bg-slate-50 border border-black rounded-xl text-[10px] font-black uppercase tracking-widest text-[#001736] outline-none cursor-pointer focus:border-indigo-400 transition-all shadow-sm"
                    >
                        <option value="all">All Status</option>
                        <option value="pending_teacher">Pending Review</option>
                        <option value="approved_teacher">Approved by Me</option>
                        <option value="approved_admin">Admin Approved</option>
                        <option value="approved_principal">Fully Finalized</option>
                    </select>
                </div>
          </div>

          {/* Records List */}
          <div className="bg-white shadow-sm overflow-hidden">
                <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#001736] rounded-xl flex items-center justify-center text-white shadow-lg">
                            <FileCheck size={20} />
                        </div>
                        <h3 className="text-sm font-black text-[#001736] uppercase tracking-widest">{activeTab} Request Queue</h3>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                            {filteredRequests.length} Total Records
                        </span>
                    </div>
                </div>

                {loading ? (
                    <div className="p-20 space-y-6 animate-pulse">
                        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-50 rounded-3xl border border-slate-100" />)}
                    </div>
                ) : currentItems.length === 0 ? (
                    <div className="p-32 text-center flex flex-col items-center gap-6">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 border-2 border-dashed border-slate-200">
                            < Award size={48} />
                        </div>
                        <div className="space-y-2">
                            <p className="text-slate-500 font-black uppercase tracking-widest text-sm">Queue Clear</p>
                            <p className="text-slate-400 text-xs font-medium">No certificate requests matching your filters.</p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#91a0ec] text-black">
                                    <th className="px-4 py-4 border border-black text-[10px] font-black uppercase tracking-widest text-center">Sr. No.</th>
                                    <th className="px-6 py-4 border border-black text-[10px] font-black uppercase tracking-widest">Student Name</th>
                                    <th className="px-6 py-4 border border-black text-[10px] font-black uppercase tracking-widest">Reason / Details</th>
                                    <th className="px-6 py-4 border border-black text-[10px] font-black uppercase tracking-widest">Applied On</th>
                                    <th className="px-6 py-4 border border-black text-[10px] font-black uppercase tracking-widest text-center">Status</th>
                                    <th className="px-6 py-4 border border-black text-[10px] font-black uppercase tracking-widest text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {currentItems.map((req, index) => (
                                    <tr key={req.id} className="hover:bg-slate-50/30 transition-all group">
                                        <td className="px-4 py-4 border border-black text-center text-xs font-bold text-[#001736]">
                                            {indexOfFirstItem + index + 1}
                                        </td>
                                        <td className="px-6 py-4 border border-black">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-100 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                                    <User size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-[#001736] uppercase tracking-tight whitespace-nowrap">
                                                        {req.last_name} {req.first_name} {req.middle_name || req.father_name || ''}
                                                    </p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ID: {req.student_id_no} • {req.current_grade}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 border border-black">
                                            <div className="max-w-xs">
                                                <p className="text-xs text-[#001736] font-medium leading-relaxed truncate" title={req.reason}>
                                                    {req.reason || 'General Certificate Request'}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 border border-black text-center">
                                            <p className="text-[11px] font-black text-[#001736]">{new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Submission Date</p>
                                        </td>
                                        <td className="px-6 py-4 border border-black text-center whitespace-nowrap">
                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm inline-block ${statusStyle[req.status] || 'bg-slate-50 text-slate-400'}`}>
                                                {req.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 border border-black text-right">
                                            {req.status === 'pending_teacher' ? (
                                                <button 
                                                    onClick={() => handleApprove(req.id)}
                                                    className="bg-[#001736] text-white px-5 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-emerald-500 transition-all flex items-center gap-2 ml-auto active:scale-95"
                                                >
                                                    <CheckCircle size={14} /> Approve Request
                                                </button>
                                            ) : (
                                                <div className="flex items-center justify-end gap-2 text-emerald-500 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 w-fit ml-auto">
                                                    <CheckCircle size={14} />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">Forwarded</span>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        
                        {/* Pagination Controls */}
                        <div className="px-10 py-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredRequests.length)} of {filteredRequests.length} Entries
                            </p>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => paginate(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-all"
                                >
                                    <ChevronRight size={16} className="rotate-180" />
                                </button>
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => paginate(i + 1)}
                                        className={`w-8 h-8 rounded-lg text-[10px] font-black uppercase transition-all ${
                                            currentPage === i + 1 
                                            ? 'bg-[#001736] text-white shadow-lg' 
                                            : 'bg-white border border-slate-200 text-slate-400 hover:bg-slate-50'
                                        }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button 
                                    onClick={() => paginate(currentPage + 1)}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-all"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
          </div>
      </div>
    </div>
  );
};

export default CertificateApproval;
