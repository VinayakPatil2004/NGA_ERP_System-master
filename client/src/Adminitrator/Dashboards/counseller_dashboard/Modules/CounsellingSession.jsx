import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Plus, Clock, Video, User, RefreshCw, X, Send, Search } from 'lucide-react';
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import DataTable from '../../../admcomponents/DataTable';
import { getAllSessions, scheduleSession, getAllEnquiries } from '../../../../services/counsellorAPI';
import { useAcademicYear } from '../../../../context/AcademicYearContext';
import { toast } from 'react-toastify';

const CounsellingSession = ({ toggleSidebar }) => {
  const { selectedYear } = useAcademicYear();
  const [sessions, setSessions] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 2;

  // New Session State
  const [newSession, setNewSession] = useState({
    title: '',
    date: '',
    time: '',
    type: 'prospect',
    enquiryId: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchSessions = useCallback(async () => {
    if (!selectedYear) return;
    try {
      setLoading(true);
      const data = await getAllSessions(selectedYear.id);
      setSessions(data || []);
    } catch (error) {
      console.error("Fetch Sessions Error:", error);
      toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  const fetchEnquiries = useCallback(async () => {
    if (!selectedYear) return;
    try {
        const data = await getAllEnquiries(selectedYear.id);
        setEnquiries(data || []);
    } catch (error) {
        console.error("Fetch Enquiries Error:", error);
    }
  }, [selectedYear]);


  useEffect(() => {
    fetchSessions();
    fetchEnquiries();
  }, [fetchSessions, fetchEnquiries]);

  const handleSchedule = async (e) => {
    e.preventDefault();
    const isStaffTraining = newSession.type === 'staff_training';
    if (!newSession.title || !newSession.date || !newSession.time || (!isStaffTraining && !newSession.enquiryId)) {
        toast.warning("Please fill all required fields");
        return;
    }

    try {
        setSubmitting(true);
        await scheduleSession({
            ...newSession,
            enquiryId: isStaffTraining ? null : newSession.enquiryId,
            date: newSession.date,
            time: newSession.time
        });
        toast.success("Session scheduled successfully");
        setShowModal(false);
        setNewSession({ title: '', date: '', time: '', type: 'prospect', enquiryId: '', notes: '' });
        fetchSessions();
    } catch {
        toast.error("Failed to schedule session");
    } finally {
        setSubmitting(false);
    }
  };

  // Reset pagination on filter or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, selectedYear]);

  // Filtered Sessions logic
  const filteredSessions = sessions.filter((row) => {
    const titleMatch = row.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const participantName = row.session_type === 'staff_training'
      ? 'staff members'
      : (row.prospect_name || row.student_name || '');
    const participantMatch = participantName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSearch = titleMatch || participantMatch;

    const matchesType =
      typeFilter === 'all' ||
      (typeFilter === 'staff_training' && row.session_type === 'staff_training') ||
      (typeFilter === 'guidance' && row.session_type !== 'staff_training');

    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);
  const paginatedSessions = filteredSessions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <ModuleHeader
        title="Session Management"
        subTitle="Schedule & Conduct Academic Guidance"
        icon={Calendar}
        toggleSidebar={toggleSidebar}
      />

      <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-4 sm:p-8 space-y-6 sm:space-y-8 mt-4 sm:mt-8">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between border-b border-slate-100 pb-6">
              <h4 className="text-xl font-black text-[#001736] tracking-tighter uppercase">Upcoming Agenda</h4>
              <div className="flex gap-4 self-end sm:self-auto">
                <button 
                    onClick={fetchSessions}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 transition-all"
                >
                    <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                </button>
                <button 
                    onClick={() => setShowModal(true)}
                    className="px-6 py-3 bg-[#001736] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 active:scale-95 transition-all"
                >
                    <Plus className="w-4 h-4" /> Schedule Session
                </button>
              </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="relative flex-1 max-w-none sm:max-w-xs">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                      type="text"
                      placeholder="SEARCH SESSIONS..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#001736] outline-none transition-all placeholder:text-slate-400"
                  />
              </div>

              <div className="relative w-full sm:w-56">
                  <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#001736]  outline-none cursor-pointer appearance-none pr-10"
                  >
                      <option value="all">ALL SESSION TYPES</option>
                      <option value="guidance">COUNSELLING / GUIDANCE</option>
                      <option value="staff_training">STAFF TRAINING</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-3.5 h-3.5 text-[#001736]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                      </svg>
                  </div>
              </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
               <DataTable
                  headers={[
                      { label: 'Sr.' },
                      { label: 'Session Title' },
                      { label: 'Session Type' },
                      { label: 'Date & Time' },
                      { label: 'Participant / Target' },
                      { label: 'Actions' }
                  ]}
                  columnCount={6}
                  loading={loading}
                  emptyMessage={searchTerm || typeFilter !== 'all' ? "No sessions match your search criteria" : "No Records Found"}
                  footer={
                      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-[#64748B]">
                              Showing <span className="text-[#001736]">{filteredSessions.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0}</span> to <span className="text-[#001736]">{Math.min(currentPage * itemsPerPage, filteredSessions.length)}</span> of <span className="text-[#001736]">{filteredSessions.length}</span> Records
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
                  {paginatedSessions.map((row, i) => (
                      <tr key={row.id} className="border-b border-black/5 hover:bg-slate-50 transition-all">
                          <td className="px-8 py-4 border-r-table border-b-table text-left">
                              <span className="text-[10px] font-bold">
                                  {((currentPage - 1) * itemsPerPage + i + 1).toString().padStart(2, '0')}
                              </span>
                          </td>
                          <td className="px-8 py-4 border-r-table border-b-table text-left">
                              <span className="text-[11px] font-black tracking-tight text-primary uppercase">{row.title}</span>
                          </td>
                          <td className="px-8 py-4 border-r-table border-b-table text-left">
                              <span className={`px-3 py-1 rounded-full font-bold text-[8px] uppercase tracking-widest ${row.session_type === 'staff_training' ? 'bg-amber-100 text-amber-800 border border-amber-200/50' : 'bg-indigo-100 text-indigo-800 border border-indigo-200/50'}`}>
                                  {row.session_type === 'staff_training' ? 'Staff Training' : 'Guidance'}
                              </span>
                          </td>
                          <td className="px-8 py-4 border-r-table border-b-table text-left">
                              <div className="space-y-1">
                                  <div className="text-[10px] font-bold text-primary">{new Date(row.session_date).toLocaleDateString()}</div>
                                  <div className="text-[9px] font-black text-slate-400 tracking-widest uppercase">{row.session_time}</div>
                              </div>
                          </td>
                          <td className="px-8 py-4 border-r-table border-b-table text-left">
                              <span className="text-[10px] font-bold uppercase">{row.session_type === 'staff_training' ? 'STAFF MEMBERS' : (row.prospect_name || row.student_name || "N/A")}</span>
                          </td>
                          <td className="px-8 py-4 border-b-table text-left">
                              <button 
                                  onClick={() => {
                                      toast.info(`Starting Session: ${row.title}`);
                                      window.open('https://meet.google.com/new', '_blank');
                                  }}
                                  className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                  title="Start Google Meet"
                              >
                                  <Video className="w-4 h-4" />
                              </button>
                          </td>
                      </tr>
                  ))}
              </DataTable>
          </div>
      </div>

      {/* Schedule Session Modal */}
      {showModal && (
          <div className="fixed inset-0 bg-[#001736]/80 backdrop-blur-sm z-9999 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                  <div className="p-6 sm:p-8 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center">
                              <Calendar className="w-6 h-6" />
                          </div>
                          <div>
                              <h4 className="text-xl font-black text-[#001736] uppercase tracking-tighter">Schedule Session</h4>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Counseling Appointment Portal</p>
                          </div>
                      </div>
                      <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-all">
                          <X className="w-6 h-6 text-slate-400" />
                      </button>
                  </div>

                  <form onSubmit={handleSchedule} className="p-6 sm:p-8 space-y-4 sm:space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Session Title</label>
                          <input 
                            type="text" 
                            required
                            value={newSession.title}
                            onChange={(e) => setNewSession({...newSession, title: e.target.value})}
                            placeholder="E.G., CAREER GUIDANCE, ADMISSION COUNSELLING..."
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase tracking-tight focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                          />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Session Date</label>
                              <input 
                                type="date" 
                                required
                                value={newSession.date}
                                onChange={(e) => setNewSession({...newSession, date: e.target.value})}
                                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase tracking-tight focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                              />
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Session Time</label>
                              <input 
                                type="time" 
                                required
                                value={newSession.time}
                                onChange={(e) => setNewSession({...newSession, time: e.target.value})}
                                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase tracking-tight focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                              />
                          </div>
                      </div>

                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Session Type</label>
                          <select 
                            required
                            value={newSession.type}
                            onChange={(e) => setNewSession({...newSession, type: e.target.value})}
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase tracking-tight focus:ring-2 focus:ring-indigo-500 transition-all outline-none appearance-none cursor-pointer"
                          >
                              <option value="prospect">PROSPECT / STUDENT GUIDANCE</option>
                              <option value="staff_training">STAFF TRAINING SESSION</option>
                          </select>
                      </div>

                      {newSession.type !== 'staff_training' && (
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Prospect (Enquiry)</label>
                              <select 
                                required
                                value={newSession.enquiryId}
                                onChange={(e) => setNewSession({...newSession, enquiryId: e.target.value})}
                                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase tracking-tight focus:ring-2 focus:ring-indigo-500 transition-all outline-none appearance-none cursor-pointer"
                              >
                                  <option value="">SELECT PROSPECT...</option>
                                  {enquiries.map((enq) => (
                                      <option key={enq.id} value={enq.id}>{enq.full_name} ({enq.form_no})</option>
                                  ))}
                              </select>
                          </div>
                      )}

                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Internal Notes</label>
                          <textarea 
                            value={newSession.notes}
                            onChange={(e) => setNewSession({...newSession, notes: e.target.value})}
                            rows={3}
                            placeholder="CONFIDENTIAL SESSION NOTES..."
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase tracking-tight focus:ring-2 focus:ring-indigo-500 transition-all outline-none resize-none"
                          />
                      </div>

                      <button 
                        disabled={submitting}
                        className="w-full py-5 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-2xl hover:shadow-indigo-500/20 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 mt-4"
                      >
                          <Send className="w-5 h-5" /> {submitting ? "SCHEDULING..." : "CONFIRM APPOINTMENT"}
                      </button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default CounsellingSession;
