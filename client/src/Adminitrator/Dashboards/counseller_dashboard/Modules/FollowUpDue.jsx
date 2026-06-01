import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Phone, Search, RefreshCw, X, Send, MessageSquare, Trash2, ChevronDown, Eye, FileText } from 'lucide-react';
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import DataTable from '../../../admcomponents/DataTable';
import { getFollowupsDue, createFollowup, deleteEnquiry } from '../../../../services/counsellorAPI';
import { useAcademicYear } from '../../../../context/AcademicYearContext';
import { toast } from 'react-toastify';

const FollowUpDue = ({ toggleSidebar }) => {
  const { selectedYear } = useAcademicYear();
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 2;
  
  // Modal State
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [followupData, setFollowupData] = useState({
    status: 'Interested for Visit',
    remarks: '',
    next_followup_date: new Date(Date.now() + 86400000).toISOString().split('T')[0]
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const yearId = selectedYear?.id || 'all';
      const data = await getFollowupsDue(yearId);
      setEnquiries(data || []);
    } catch {
      toast.error("Failed to load enquiries");
    } finally {
      setLoading(false);
    }
  }, [localYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id) => {
    if (window.confirm("Delete this enquiry?")) {
        try {
            await deleteEnquiry(id);
            toast.success("Deleted");
            fetchData();
        } catch {
            toast.error("Failed to delete");
        }
    }
  };

  const handleMark = (enq) => {
    setSelectedEnquiry(enq);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        setSubmitting(true);
        await createFollowup({
            enquiryId: selectedEnquiry.enquiry_id,
            status: followupData.status,
            remarks: followupData.remarks,
            nextFollowupDate: followupData.next_followup_date,
            followupMethod: 'call'
        });
        toast.success("Remark Updated");
        setShowModal(false);
        setFollowupData({ status: 'Interested for Visit', remarks: '', next_followup_date: new Date(Date.now() + 86400000).toISOString().split('T')[0] });
        fetchData();
    } catch {
        toast.error("Failed to update");
    } finally {
        setSubmitting(false);
    }
  };

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedYear]);

  const filteredData = enquiries.filter(enq => 
    enq.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enq.form_no?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 text-left">
      <ModuleHeader
        title="Action Pipeline"
        subTitle="Manage Enquiries & Student Engagement"
        icon={Clock}
        toggleSidebar={toggleSidebar}
      />

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center shadow-inner">
                      <Clock className="w-6 h-6" />
                  </div>
                  <div>
                      <h4 className="text-xl font-black text-[#001736] tracking-tighter uppercase">Due for Action</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Institutional Communication Pipeline</p>
                  </div>
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="relative flex-1 md:w-72">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Quick Search..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-widest outline-none focus:bg-white focus:border-rose-300 transition-all shadow-sm" 
                      />
                  </div>
                  <button onClick={fetchData} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 hover:text-rose-600 transition-all">
                    <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                  </button>
              </div>
          </div>

          <DataTable
            headers={[
                { label: "ID" },
                { label: "STUDENT NAME" },
                { label: "FATHER NAME" },
                { label: "MOBILE" },
                { label: "DATE" },
                { label: "STATUS" },
                { label: "ACTIONS", className: "text-center" }
            ]}
            columnCount={7}
            loading={loading}
            footer={
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#64748B]">
                        Showing <span className="text-[#001736]">{filteredData.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0}</span> to <span className="text-[#001736]">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> of <span className="text-[#001736]">{filteredData.length}</span> Records
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 bg-white border border-slate-200 rounded text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            Prev
                        </button>
                        <div className="flex items-center gap-1 px-4">
                            <span className="text-[10px] font-black text-[#001736] uppercase">Page {currentPage} of {totalPages || 1}</span>
                        </div>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="px-4 py-2 bg-white border border-slate-200 rounded text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            Next
                        </button>
                    </div>
                </div>
            }
          >
              {paginatedData.map((enq) => (
                <tr key={enq.enquiry_id} className="hover:bg-slate-50 transition-colors group text-left">
                    <td className="px-6 py-5 border border-black font-mono text-[10px] font-black text-slate-400">{enq.form_no}</td>
                    <td className="px-6 py-5 border border-black text-[13px] font-black text-[#001736] uppercase tracking-tight">{enq.full_name}</td>
                    <td className="px-6 py-5 border border-black text-xs font-bold text-slate-500 uppercase">{enq.father_name || 'N/A'}</td>
                    <td className="px-6 py-5 border border-black text-xs font-bold text-slate-500">{enq.mobile_no || 'N/A'}</td>
                    <td className="px-6 py-5 border border-black text-[11px] font-bold text-slate-400 uppercase">{new Date(enq.enquiry_date).toLocaleDateString()}</td>
                    <td className="px-6 py-5 border border-black">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                            enq.followup_status === 'Interested for Visit' ? 'bg-emerald-100 text-emerald-700' :
                            enq.followup_status === 'Busy' ? 'bg-amber-100 text-amber-700' :
                            enq.followup_status === 'Call Not Received' ? 'bg-rose-100 text-rose-700' :
                            'bg-slate-100 text-slate-500'
                        }`}>
                            {enq.followup_status || 'New Inquiry'}
                        </span>
                    </td>
                    <td className="px-6 py-5 border border-black text-center">
                        <div className="flex items-center justify-center gap-2">
                            <button 
                                onClick={() => handleMark(enq)}
                                className="p-2 bg-[#001736] text-white rounded-lg hover:bg-rose-600 transition-all active:scale-95 shadow-md"
                                title="Mark Remark"
                            >
                                <MessageSquare size={14} />
                            </button>
                            <button 
                                onClick={() => {
                                    setSelectedEnquiry(enq);
                                    setShowViewModal(true);
                                }}
                                className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all"
                                title="View Remark"
                            >
                                <Eye size={14} />
                            </button>
                            <button 
                                onClick={() => handleDelete(enq.enquiry_id)}
                                className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                title="Delete"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </td>
                </tr>
              ))}
              {filteredData.length === 0 && !loading && (
                  <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">No enquiries found</td>
                  </tr>
              )}
          </DataTable>
      </div>

      {/* Mark Remark Modal */}
      {showModal && (
          <div className="fixed inset-0 bg-[#001736]/80 backdrop-blur-sm z-9999 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                  <div className="p-8 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-rose-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                              <MessageSquare className="w-6 h-6" />
                          </div>
                          <div>
                              <h4 className="text-xl font-black text-[#001736] uppercase tracking-tighter">Engagement Remark</h4>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedEnquiry?.full_name}</p>
                          </div>
                      </div>
                      <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-all">
                          <X className="w-6 h-6 text-slate-400" />
                      </button>
                  </div>

                  <form onSubmit={handleSubmit} className="p-8 space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Follow-up Status</label>
                              <div className="relative">
                                  <select 
                                    value={followupData.status}
                                    onChange={(e) => setFollowupData({...followupData, status: e.target.value})}
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase tracking-tight focus:ring-2 focus:ring-rose-500 outline-none appearance-none cursor-pointer pr-12"
                                  >
                                      <option value="Call Not Received">Call Not Received</option>
                                      <option value="Busy">Busy</option>
                                      <option value="Interested for Visit">Interested for Visit</option>
                                  </select>
                                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                              </div>
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Next Date</label>
                              <input 
                                type="date" 
                                required
                                value={followupData.next_followup_date}
                                onChange={(e) => setFollowupData({...followupData, next_followup_date: e.target.value})}
                                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase tracking-tight focus:ring-2 focus:ring-rose-500 outline-none"
                              />
                          </div>
                      </div>

                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Counsellor Remark</label>
                          <textarea 
                            required
                            value={followupData.remarks}
                            onChange={(e) => setFollowupData({...followupData, remarks: e.target.value})}
                            rows={4}
                            placeholder="ENTER REMARKS HERE..."
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase tracking-tight focus:ring-2 focus:ring-rose-500 outline-none resize-none"
                          />
                      </div>

                      <button 
                        disabled={submitting}
                        className="w-full py-5 bg-[#001736] text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-rose-600 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                      >
                          <Send className="w-5 h-5" /> {submitting ? "SAVING..." : "SUBMIT REMARK"}
                      </button>
                  </form>
              </div>
          </div>
      )}

      {/* View Remark Modal */}
      {showViewModal && (
          <div className="fixed inset-0 bg-[#001736]/80 backdrop-blur-sm z-9999 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                  <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg">
                              <FileText className="w-5 h-5" />
                          </div>
                          <div>
                              <h4 className="text-lg font-black text-[#001736] uppercase tracking-tighter">Remark History</h4>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedEnquiry?.full_name}</p>
                          </div>
                      </div>
                      <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-all">
                          <X className="w-5 h-5 text-slate-400" />
                      </button>
                  </div>

                  <div className="p-8 space-y-6">
                      <div className="space-y-4">
                          <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Status</span>
                              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                    selectedEnquiry?.followup_status === 'Interested for Visit' ? 'bg-emerald-100 text-emerald-700' :
                                    selectedEnquiry?.followup_status === 'Busy' ? 'bg-amber-100 text-amber-700' :
                                    selectedEnquiry?.followup_status === 'Call Not Received' ? 'bg-rose-100 text-rose-700' :
                                    'bg-slate-100 text-slate-500'
                                }`}>
                                    {selectedEnquiry?.followup_status || 'New Inquiry'}
                                </span>
                          </div>
                          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 min-h-[120px]">
                              <p className="text-xs font-bold text-slate-600 uppercase leading-relaxed">
                                  {selectedEnquiry?.last_remark || 'No remarks recorded yet.'}
                              </p>
                          </div>
                      </div>

                      <button 
                        onClick={() => setShowViewModal(false)}
                        className="w-full py-4 bg-[#001736] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-rose-600 transition-all active:scale-95"
                      >
                          Close View
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default FollowUpDue;
