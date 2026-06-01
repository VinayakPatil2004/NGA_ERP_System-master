import React, { useState, useMemo, useEffect } from "react";
import {
  Megaphone,
  PlusCircle,
  Search,
  X,
  Filter,
  ChevronDown,
  Clock,
  Send,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import ModuleHeader from "../../../admcomponents/ModuleHeader";
import { NoticeCard, NoticeDetailModal } from "../../../admcomponents/NoticeCard";
import Pagination from "../../../admcomponents/Pagination";
import libraryAPI from "../../../../services/libraryAPI";
import communicationAPI from "../../../../services/communicationAPI";
import { toast } from "react-hot-toast";

/**
 * NoticeAnnouncement – Library Notifications & Notices Module
 */

const NOTIFICATION_TYPES = ["General", "Maintenance", "New Arrival", "Event", "Holiday", "Institutional"];

const NoticeAnnouncement = ({ toggleSidebar }) => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [viewNotice, setViewNotice] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [form, setForm] = useState({
    title: "",
    content: "",
    type: "General",
    date: new Date().toISOString().split("T")[0]
  });

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const [libNotices, globalAnnouncements] = await Promise.all([
        libraryAPI.getNotices(),
        communicationAPI.getAllAnnouncements()
      ]);
      
      const formattedLib = (libNotices || []).map(n => ({ ...n, source: 'Library' }));
      const formattedGlobal = (globalAnnouncements || []).map(a => ({
        id: `ann-${a.id}`,
        title: a.title,
        content: a.description,
        description: a.description,
        type: 'Institutional',
        date: a.start_date || a.created_at,
        created_at: a.created_at,
        source: 'Global',
        attachment_url: a.attachment_url,
        audience: a.audience,
        target_audience: a.target_audience,
        priority: a.priority,
        category: a.category,
        notice_number: a.notice_number,
        sender_name: a.sender_name,
        publish_date: a.publish_date,
        publish_time: a.publish_time,
        expiry_date: a.expiry_date
      }));

      setNotices([...formattedLib, ...formattedGlobal].sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at)));
    } catch {
      toast.error("Failed to load communications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const filteredNotices = useMemo(() => {
    return notices.filter((n) => {
      const titleMatch = (n.title || "").toLowerCase().includes(search.toLowerCase());
      const contentMatch = (n.content || "").toLowerCase().includes(search.toLowerCase());
      const typeMatch = typeFilter === "All" || n.type === typeFilter;
      return (titleMatch || contentMatch) && typeMatch;
    });
  }, [notices, search, typeFilter]);

  const totalPages = Math.ceil(filteredNotices.length / itemsPerPage);
  const paginatedNotices = filteredNotices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Please fill all required fields");
      return;
    }
    try {
      await libraryAPI.addNotice(form);
      toast.success("Notice published!");
      fetchNotices();
      setShowModal(false);
      setForm({ title: "", content: "", type: "General", date: new Date().toISOString().split("T")[0] });
    } catch {
      toast.error("Failed to publish notice");
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-[1600px] mx-auto bg-[#F8FAFC] min-h-screen">
      <ModuleHeader
        title="Notices"
        subTitle="Library Communications Hub"
        icon={Megaphone}
        toggleSidebar={toggleSidebar}
        badge="LIBRARY"
      />

      {/* Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notices..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-bold text-[#001736] uppercase tracking-wide outline-none focus:border-amber-400 transition-all"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="appearance-none pl-11 pr-8 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-[#001736] uppercase tracking-widest outline-none cursor-pointer"
          >
            <option value="All">All Types</option>
            {NOTIFICATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          Create Notice
        </button>
      </div>

      {/* Notices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map(i => <div key={i} className="h-64 bg-white rounded-3xl border border-slate-200" />)}
          </div>
        ) : paginatedNotices.length > 0 ? (
          paginatedNotices.map((notice) => (
            <NoticeCard
              key={notice.id}
              msg={{ ...notice, created_at: notice.created_at || notice.date }}
              onView={(msg) => setViewNotice(msg)}
            />
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
            <Megaphone className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">No notices found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredNotices.length}
        onPageChange={setCurrentPage}
      />

      {/* CREATE MODAL (Library-specific) */}
      {showModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-8 py-6 bg-indigo-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Send className="w-5 h-5 text-white" />
                <h2 className="text-white font-black text-lg uppercase tracking-wider">Publish Notice</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="text-white hover:text-rose-400 transition-colors"><X /></button>
            </div>
            <div className="p-8 space-y-5 bg-slate-50">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Notice Title *</label>
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-3 border rounded-xl font-bold" placeholder="Subject..." />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Content *</label>
                <textarea rows={5} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} className="w-full px-4 py-3 border rounded-xl font-medium" placeholder="Message body..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Type</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full px-4 py-3 border rounded-xl font-bold">
                    {NOTIFICATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Publish Date</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full px-4 py-3 border rounded-xl font-bold" />
                </div>
              </div>
              <button
                onClick={handleSave}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg active:scale-95"
              >
                Publish Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODAL - Shared NoticeDetailModal */}
      {viewNotice && <NoticeDetailModal msg={viewNotice} onClose={() => setViewNotice(null)} />}
    </div>
  );
};

export default NoticeAnnouncement;
