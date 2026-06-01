import React, { useState, useEffect, useCallback } from "react";
import { Megaphone, PlusCircle, RefreshCw, Send, X, Upload } from "lucide-react";
import ModuleHeader from "../../../admcomponents/ModuleHeader";
import { NoticeCard, NoticeDetailModal } from "../../../admcomponents/NoticeCard";
import Pagination from "../../../admcomponents/Pagination";
import communicationAPI from "../../../../services/communicationAPI";
import { getClassrooms } from "../../../../services/classroomAPI";
import { toast } from "react-toastify";
import { useAcademicYear } from "../../../../context/AcademicYearContext";

const NoticeAnnouncement = ({ toggleSidebar }) => {
  const { selectedYear: globalYear } = useAcademicYear();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingItem, setViewingItem] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [classList, setClassList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Dynamic Local Time & Date Helpers
  const getLocalTimeStr = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  const getLocalDateStr = (offsetDays = 0) => {
    const d = new Date();
    if (offsetDays) d.setDate(d.getDate() + offsetDays);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [noticeForm, setNoticeForm] = useState({
    title: '',
    category: 'General',
    description: '',
    priority: 'Medium',
    audience: [],
    start_date: getLocalDateStr(),
    end_date: getLocalDateStr(7),
    publish_time: getLocalTimeStr(),
    auto_publish: false,
    attachment: null
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await communicationAPI.getAllAnnouncements(globalYear?.id);
      setList(data || []);
    } catch {
      toast.error("Failed to fetch announcements");
    } finally {
      setLoading(false);
    }
  }, [globalYear?.id]);

  useEffect(() => {
    fetchData();
    if (showAddModal && globalYear?.id) {
      getClassrooms(globalYear.id).then(data => setClassList(data || [])).catch(err => console.error(err));
    }
  }, [fetchData, globalYear?.id, showAddModal]);

  const toggleAudience = (aud) => {
    setNoticeForm(prev => {
      const exists = prev.audience.includes(aud);
      return {
        ...prev,
        audience: exists ? prev.audience.filter(a => a !== aud) : [...prev.audience, aud]
      };
    });
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!noticeForm.title.trim() || !noticeForm.description.trim()) {
      return toast.warning("Please fill in the title and description.");
    }
    if (noticeForm.audience.length === 0) {
      return toast.warning("Please select at least one target audience.");
    }

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) return;

      const formData = new FormData();
      formData.append('title', noticeForm.title);
      formData.append('category', noticeForm.category);
      formData.append('description', noticeForm.description);
      formData.append('priority', noticeForm.priority);
      formData.append('audience', JSON.stringify(noticeForm.audience));
      formData.append('publish_date', noticeForm.start_date);
      formData.append('expiry_date', noticeForm.end_date);
      formData.append('publish_time', noticeForm.publish_time);
      formData.append('auto_publish', noticeForm.auto_publish ? 1 : 0);
      formData.append('sender_id', user.id);
      formData.append('sender_type', 'staff');
      formData.append('sender_name', user.full_name || 'Staff Member');
      if (globalYear?.id) formData.append('academic_year_id', globalYear.id);
      if (noticeForm.attachment) formData.append('attachment', noticeForm.attachment);

      await communicationAPI.publishAnnouncement(formData);
      toast.success("Notice published to board ✓");
      setShowAddModal(false);
      setNoticeForm({
        title: '',
        category: 'General',
        description: '',
        priority: 'Medium',
        audience: [],
        start_date: getLocalDateStr(),
        end_date: getLocalDateStr(7),
        publish_time: getLocalTimeStr(),
        auto_publish: false,
        attachment: null
      });
      fetchData();
    } catch {
      toast.error("Failed to publish announcement");
    }
  };

  return (
    <div className="p-4 lg:p-8 bg-[#F8FAFC] min-h-screen animate-in fade-in duration-500 font-sans text-left text-black">
      <ModuleHeader
        title="Notice Board"
        subTitle="Broadcast Counseling Updates & Announcements"
        icon={Megaphone}
        toggleSidebar={toggleSidebar}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className={`p-3 bg-white border cursor-pointer border-slate-200 rounded-2xl text-amber-500 hover:bg-slate-50 transition-all ${loading ? 'animate-spin' : ''}`}
            title="Refresh Board"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-add-institutional cursor-pointer px-6 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg hover:bg-[#001736]/90 transition-all flex items-center gap-2 active:scale-95"
          >
            <PlusCircle size={18} /> Share Notice
          </button>
        </div>
      </ModuleHeader>

      <div className="max-w-6xl mx-auto space-y-8 mt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Active Institutional Broadcasts</h3>
            <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
              {list.length} Records Found
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3].map(i => <div key={i} className="h-64 bg-white rounded-3xl border border-slate-200 shadow-sm" />)}
            </div>
          ) : list.length === 0 ? (
            <div className="bg-white/50 border-2 border-dashed border-slate-200 rounded-[3rem] p-24 text-center flex flex-col items-center gap-4 group">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 group-hover:scale-110 transition-transform">
                <Megaphone size={40} />
              </div>
              <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em]">No Active Broadcasts Found</p>
            </div>
          ) : (
            (() => {
              const totalPages = Math.ceil(list.length / itemsPerPage);
              const paginatedList = list.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

              return (
                <div className="space-y-12">
                  {Object.entries(
                    paginatedList.reduce((groups, item) => {
                      const date = new Date(item.created_at);
                      const month = date.toLocaleString('default', { month: 'long', year: 'numeric' });
                      if (!groups[month]) groups[month] = [];
                      groups[month].push(item);
                      return groups;
                    }, {})
                  )
                  .sort((a, b) => new Date(b[1][0].created_at) - new Date(a[1][0].created_at))
                  .map(([month, items]) => (
                    <div key={month} className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="h-[2px] grow bg-slate-200"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 bg-slate-50 px-4 py-1 rounded-full border border-slate-200">{month}</span>
                        <div className="h-[2px] grow bg-slate-200"></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {items.map((a) => (
                          <NoticeCard
                            key={a.id}
                            msg={{ ...a, is_announcement: true, content: a.description }}
                            onView={(msg) => setViewingItem(msg)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                  <Pagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={list.length}
                    onPageChange={setCurrentPage}
                  />
                </div>
              );
            })()
          )}
        </div>
      </div>

      {/* ── Share Notice Modal (Same as Admin Communication) ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#001736]/80 backdrop-blur-md z-120 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">

            {/* Header */}
            <div className="p-8 border-b border-slate-100 bg-slate-50 shrink-0">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-black text-[#001736] tracking-tight uppercase">Notice Share</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Publish an institutional notice</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-all"><X size={20} className="text-slate-500" /></button>
              </div>
            </div>

            {/* Form Body */}
            <div className="p-8 overflow-y-auto custom-scrollbar">
              <form onSubmit={handlePost} className="space-y-8 animate-in fade-in duration-500">

                {/* 1. Basic Information */}
                <div className="space-y-6">
                  <h4 className="text-sm font-black uppercase text-indigo-600 tracking-widest flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> Basic Information</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Notice Title <span className="text-rose-500">*</span></label>
                      <input required value={noticeForm.title} onChange={e => setNoticeForm({...noticeForm, title: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all" placeholder="Enter notice title" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Notice Category <span className="text-rose-500">*</span></label>
                      <select required value={noticeForm.category} onChange={e => setNoticeForm({...noticeForm, category: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none cursor-pointer focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all">
                        <option>General</option>
                        <option>Academic</option>
                        <option>Examination</option>
                        <option>Sports</option>
                        <option>Holiday</option>
                        <option>Transport</option>
                        <option>Fee/Finance</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Priority Level <span className="text-rose-500">*</span></label>
                      <select required value={noticeForm.priority} onChange={e => setNoticeForm({...noticeForm, priority: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none cursor-pointer focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all">
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                        <option>Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Notice Description <span className="text-rose-500">*</span></label>
                    <textarea required rows={4} value={noticeForm.description} onChange={e => setNoticeForm({...noticeForm, description: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none resize-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all" placeholder="Enter full notice description..." />
                  </div>
                </div>

                {/* 2. Audience Selection */}
                <div className="space-y-6 pt-6 border-t border-slate-100">
                  <h4 className="text-sm font-black uppercase text-amber-500 tracking-widest flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-400"></div> Audience Selection <span className="text-rose-500">*</span></h4>

                  <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl flex flex-wrap gap-3">
                    {['All Students', 'All Parents', 'All Staff'].map(aud => (
                      <button
                        type="button"
                        key={aud}
                        onClick={() => toggleAudience(aud)}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${
                          noticeForm.audience.includes(aud)
                          ? 'bg-amber-400 border-amber-500 text-[#001736] shadow-md shadow-amber-500/20'
                          : 'bg-white border-slate-300 text-slate-500 hover:border-amber-400 hover:text-amber-600'
                        }`}
                      >
                        {aud}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Select Specific Class</label>
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value && !noticeForm.audience.includes(e.target.value)) {
                          toggleAudience(e.target.value);
                        }
                      }}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none cursor-pointer focus:border-indigo-400 transition-all"
                    >
                      <option value="">-- Add a Class to Audience --</option>
                      <option value="All Classes">All Classes</option>
                      {classList.map(c => {
                        const classVal = `Class ${c.class_name}${c.section ? ' ' + c.section : ''}`;
                        return (
                          <option key={c.id} value={classVal}>{c.class_name} {c.section ? `(${c.section})` : ''}</option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {/* 3. Schedule Information */}
                <div className="space-y-6 pt-6 border-t border-slate-100">
                  <h4 className="text-sm font-black uppercase text-emerald-600 tracking-widest flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Schedule Information</h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Publish Date</label>
                      <input type="date" required value={noticeForm.start_date} onChange={e => setNoticeForm({...noticeForm, start_date: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-400 transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Publish Time</label>
                      <input type="time" required value={noticeForm.publish_time} onChange={e => setNoticeForm({...noticeForm, publish_time: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-400 transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Expiry Date</label>
                      <input type="date" required value={noticeForm.end_date} onChange={e => setNoticeForm({...noticeForm, end_date: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-400 transition-all" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 w-max cursor-pointer" onClick={() => setNoticeForm({...noticeForm, auto_publish: !noticeForm.auto_publish})}>
                    <div className={`w-12 h-6 rounded-full relative transition-colors ${noticeForm.auto_publish ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${noticeForm.auto_publish ? 'translate-x-7' : 'translate-x-1'}`}></div>
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500">Auto Publish on Date</span>
                  </div>
                </div>

                {/* 4. Attachment Section */}
                <div className="space-y-6 pt-6 border-t border-slate-100">
                  <h4 className="text-sm font-black uppercase text-blue-500 tracking-widest flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Attachments</h4>

                  <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 bg-slate-50 flex flex-col items-center justify-center text-center hover:bg-slate-100 hover:border-blue-400 transition-all cursor-pointer relative group">
                    <input type="file" accept=".pdf,.doc,.docx,.jpg,.png" onChange={e => setNoticeForm({...noticeForm, attachment: e.target.files[0]})} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-blue-500 shadow-sm mb-4 group-hover:scale-110 transition-transform">
                      <Upload size={24} />
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-600">
                      {noticeForm.attachment ? noticeForm.attachment.name : 'Click or drag file to upload'}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 mt-2">Supported: PDF, DOC/DOCX, JPG/PNG (Max 5MB)</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-200 transition-all">Cancel</button>
                  <button type="submit" className="px-8 py-4 bg-amber-400 text-[#001736] rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-amber-300 active:scale-95 transition-all flex items-center gap-2">
                    <Send size={16} /> Publish Notice
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Notice Detail Modal */}
      {viewingItem && <NoticeDetailModal msg={viewingItem} onClose={() => setViewingItem(null)} />}
    </div>
  );
};

export default NoticeAnnouncement;
