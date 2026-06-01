import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Edit2, 
    Send, Inbox, Mail, Megaphone, Plus, Search, Eye, 
    Filter, RefreshCw, Trash2, CheckCircle, Clock, 
    AlertCircle, Paperclip, ChevronRight, X, User,
    Users, GraduationCap, ShieldCheck, MailOpen,
    MessageSquare, Smartphone, FileText
} from 'lucide-react';
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import DataTable from '../../../admcomponents/DataTable';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import communicationAPI from '../../../../services/communicationAPI';
import { getClassrooms } from '../../../../services/classroomAPI';
import { useAuth } from '../../../../context/AuthContext';
import { useAcademicYear } from '../../../../context/AcademicYearContext';

/**
 * Institutional Communication Module
 * Central Hub for Messaging & Notice Board Management.
 */

// ── Shared Components ───────────────────────────────────────────────────────
import { NoticeCard, NoticeDetailModal } from '../../../admcomponents/NoticeCard';
import Pagination from '../../../admcomponents/Pagination';

const Communication = ({ toggleSidebar }) => {
    const { user } = useAuth();
    const { selectedYear: activeYear } = useAcademicYear();
    const [activeTab, setActiveTab] = useState('outbox'); // 'inbox' | 'outbox' | 'announcements' | 'broadcast' | 'circulars'
    const [messages, setMessages] = useState([]);
    
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    
    const [loading, setLoading] = useState(true);
    const [classList, setClassList] = useState([]);
    
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [showCompose, setShowCompose] = useState(false);
    const [editingNoticeId, setEditingNoticeId] = useState(null);
    
    const [showCircularModal, setShowCircularModal] = useState(false);

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
        notice_number: `NOT-${Math.floor(1000 + Math.random() * 9000)}`,
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

    const [broadcastForm, setBroadcastForm] = useState({
        channel: 'email', // email or sms
        target_group: 'all',
        subject: '', // for email
        message: '',
        target_id: ''
    });

    const [circularForm, setCircularForm] = useState({
        title: '',
        description: '',
        target_audience: 'all',
        file: null
    });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const allAnnouncements = await communicationAPI.getAllAnnouncements(activeYear?.id);
            
            if (activeTab === 'inbox') {
                const msgs = await communicationAPI.getInbox(user.id, user.userType || 'admin', activeYear?.id);
                const staffAnnouncements = allAnnouncements.filter(a => a.sender_type === 'staff').map(a => ({
                    ...a,
                    _uid: `notice_${a.id}`,
                    is_announcement: true,
                    content: a.description
                }));
                const inboxMsgs = (msgs || []).map(m => ({ ...m, _uid: `msg_${m.id}` }));
                setMessages([...inboxMsgs, ...staffAnnouncements].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
            } else if (activeTab === 'outbox') {
                const msgs = await communicationAPI.getOutbox(user.id, user.userType || 'admin', activeYear?.id);
                const adminAnnouncements = allAnnouncements.filter(a => a.sender_type === 'admin').map(a => ({
                    ...a,
                    _uid: `notice_${a.id}`,
                    is_announcement: true,
                    content: a.description
                }));
                const outboxMsgs = (msgs || []).map(m => ({ ...m, _uid: `msg_${m.id}` }));
                setMessages([...outboxMsgs, ...adminAnnouncements].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
            }
        } catch {
            toast.error("Failed to sync communication data");
        } finally {
            setLoading(false);
        }
    }, [activeTab, user, activeYear?.id]);

    useEffect(() => { 
        fetchData(); 
        if (showCompose) {
            if (activeYear?.id) {
                getClassrooms(activeYear.id).then(data => setClassList(data || [])).catch(err => console.error(err));
            }
        }
    }, [fetchData, activeYear?.id, showCompose]);

    // ── Handlers ─────────────────────────────────────────────────────────────

    const handlePublishNotice = async (e) => {
        e.preventDefault();
        if (noticeForm.audience.length === 0) {
            return toast.warning("Please select at least one target audience.");
        }
        try {
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
            formData.append('sender_type', user.userType || 'admin');
            formData.append('sender_name', user.full_name || 'Administrator');
            if (activeYear?.id) formData.append('academic_year_id', activeYear.id);
            if (noticeForm.attachment) formData.append('attachment', noticeForm.attachment);

            if (editingNoticeId) {
                await communicationAPI.updateAnnouncement(editingNoticeId, formData);
                toast.success("Notice updated successfully ✓");
            } else {
                await communicationAPI.publishAnnouncement(formData);
                toast.success("Notice published to board ✓");
            }
            setShowCompose(false);
            setEditingNoticeId(null);
            setNoticeForm({
                title: '',
                notice_number: `NOT-${Math.floor(1000 + Math.random() * 9000)}`,
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
        } catch { toast.error(editingNoticeId ? "Failed to update notice" : "Failed to publish notice"); }
    };

    const toggleAudience = (aud) => {
        setNoticeForm(prev => {
            const exists = prev.audience.includes(aud);
            return {
                ...prev,
                audience: exists ? prev.audience.filter(a => a !== aud) : [...prev.audience, aud]
            };
        });
    };

    const handleSendBroadcast = async (e) => {
        e.preventDefault();
        try {
            const target_emails = ['test@example.com'];
            const target_numbers = ['9999999999'];
            
            if (broadcastForm.channel === 'email') {
                await communicationAPI.sendEmailBroadcast({
                    target_emails,
                    subject: broadcastForm.subject,
                    message: broadcastForm.message,
                    sender_id: user.id,
                    sender_type: user.userType || 'admin'
                });
                toast.success("Email broadcast sent successfully ✓");
            } else {
                await communicationAPI.sendSMSBroadcast({
                    target_numbers,
                    message: broadcastForm.message,
                    sender_id: user.id,
                    sender_type: user.userType || 'admin'
                });
                toast.success("SMS broadcast sent successfully ✓");
            }
            
            setBroadcastForm({ channel: 'email', target_group: 'all', subject: '', message: '', target_id: '' });
            fetchData();
        } catch {
            toast.error("Failed to send broadcast");
        }
    };

    const handleUploadCircular = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('title', circularForm.title);
            formData.append('description', circularForm.description);
            formData.append('target_audience', circularForm.target_audience);
            if (activeYear?.id) formData.append('academic_year_id', activeYear.id);
            if (user?.id) formData.append('uploaded_by', user.id);
            if (circularForm.file) formData.append('document', circularForm.file);
 
            await communicationAPI.uploadCircular(formData);
            toast.success("Circular uploaded successfully ✓");
            setShowCircularModal(false);
            setCircularForm({ title: '', description: '', target_audience: 'all', file: null });
            fetchData();
        } catch {
            toast.error("Failed to upload circular");
        }
    };

    const handleMarkAsRead = async (msg) => {
        if (msg.is_read) return;
        try {
            await communicationAPI.markMessageAsRead(msg.recipient_entry_id);
            fetchData();
        } catch (err) { console.error("Mark read failed", err); }
    };

    // ── UI Components ───────────────────────────────────────────────────────

    return (
        <div className="p-4 lg:p-8 space-y-6 min-h-screen bg-[#F8FAFC]">
            
            <ModuleHeader 
                title="Institutional Communication"
                subTitle="Unified Intelligence Hub for Messaging & Notices"
                icon={Send}
                toggleSidebar={toggleSidebar}
            >
                <div className="flex items-center gap-3">
                    <button onClick={fetchData} className="p-2 bg-white border border-white/10 rounded-md text-white hover:bg-white/10 transition-all active:rotate-180 duration-700">
                        <RefreshCw size={18} />
                    </button>
                    <button 
                        onClick={() => { setEditingNoticeId(null); setShowCompose(true); }}
                        className="bg-amber-400 text-[#001736] px-4 py-2.5 rounded-md font-black text-[11px] uppercase tracking-widest shadow-2xl hover:bg-white transition-all flex items-center gap-2 active:scale-95"
                    >
                        <Plus size={18} /> Compose
                    </button>
                </div>
            </ModuleHeader>

            {/* ── Tabs Navigation ── */}
            <div className="flex items-center gap-2 bg-white p-2 rounded-md border border-slate-200 overflow-x-auto no-scrollbar">
                {[
                    { id: 'inbox', label: 'Inbox', icon: Inbox },
                    { id: 'outbox', label: 'Outbox', icon: Mail },
                    { id: 'broadcast', label: 'Email / SMS', icon: Smartphone },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); setCurrentPage(1); }}
                        className={`px-6 py-3 rounded-md flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-[#001736] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                    >
                        <tab.icon size={16} /> {tab.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="space-y-4 animate-pulse">
                    {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white rounded-3xl border border-slate-200" />)}
                </div>
            ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Inbox / Outbox Listing */}
                    {(activeTab === 'inbox' || activeTab === 'outbox') && (
                        <div className="space-y-12">
                            {messages.length > 0 ? (
                                (() => {
                                    const totalPages = Math.ceil(messages.length / itemsPerPage);
                                    const paginatedMessages = messages.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
                                    
                                    return (
                                        <div className="space-y-6">
                                            {Object.entries(
                                                paginatedMessages.reduce((groups, msg) => {
                                                    const date = new Date(msg.created_at);
                                                    const month = date.toLocaleString('default', { month: 'long', year: 'numeric' });
                                                    if (!groups[month]) groups[month] = [];
                                                    groups[month].push(msg);
                                                    return groups;
                                                }, {})
                                            )
                                            .sort((a, b) => new Map(messages.map(m => [m.id, new Date(m.created_at)])).get(b[1][0].id) - new Map(messages.map(m => [m.id, new Date(m.created_at)])).get(a[1][0].id))
                                            .map(([month, items]) => (
                                                <div key={month} className="space-y-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-[2px] grow bg-slate-200"></div>
                                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 bg-slate-50 px-4 py-1 rounded-full border border-slate-200">{month}</span>
                                                        <div className="h-[2px] grow bg-slate-200"></div>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                        {items.map(msg => msg.is_announcement ? (
                                                            <NoticeCard 
                                                                key={msg._uid || `notice_${msg.id}`}
                                                                msg={msg}
                                                                onView={(m) => setSelectedMessage(m)}
                                                                showActions={true}
                                                                onEdit={() => {
                                                                    setEditingNoticeId(msg.id);
                                                                    let parsedAudience = [];
                                                                    try {
                                                                        parsedAudience = typeof msg.audience === 'string' ? JSON.parse(msg.audience) : msg.audience;
                                                                    } catch {
                                                                        parsedAudience = [];
                                                                    }
                                                                    setNoticeForm({
                                                                        title: msg.title,
                                                                        notice_number: msg.notice_number,
                                                                        category: msg.category || 'General',
                                                                        description: msg.description,
                                                                        priority: msg.priority || 'Medium',
                                                                        audience: parsedAudience || [],
                                                                        start_date: msg.publish_date ? new Date(msg.publish_date).toISOString().split('T')[0] : getLocalDateStr(),
                                                                        end_date: msg.expiry_date ? new Date(msg.expiry_date).toISOString().split('T')[0] : getLocalDateStr(7),
                                                                        publish_time: msg.publish_time || getLocalTimeStr(),
                                                                        auto_publish: !!msg.auto_publish,
                                                                        attachment: null
                                                                    });
                                                                    setShowCompose(true);
                                                                }}
                                                                onDelete={(m) => {
                                                                    Swal.fire({
                                                                        title: 'Delete Notice?',
                                                                        text: "This notice will be permanently removed.",
                                                                        icon: 'warning',
                                                                        showCancelButton: true,
                                                                        confirmButtonColor: '#001736',
                                                                        cancelButtonColor: '#f43f5e',
                                                                        confirmButtonText: 'Yes, delete it!'
                                                                    }).then((result) => {
                                                                        if (result.isConfirmed) {
                                                                            communicationAPI.deleteAnnouncement(m.id).then(() => {
                                                                                fetchData();
                                                                                Swal.fire('Deleted!', 'Notice has been removed.', 'success');
                                                                            }).catch(() => toast.error("Failed to delete notice"));
                                                                        }
                                                                    });
                                                                }}
                                                            />
                                                        ) : (
                                                            <div 
                                                                key={msg._uid || `msg_${msg.id}`}
                                                                onClick={() => { setSelectedMessage(msg); handleMarkAsRead(msg); }}
                                                                className={`bg-white p-6 rounded-3xl border ${
                                                                    activeTab === 'inbox' && !msg.is_read
                                                                        ? 'border-amber-400 bg-amber-50/10'
                                                                        : 'border-slate-200'
                                                                } shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between group gap-4 md:col-span-full`}
                                                            >
                                                                <div className="flex items-center gap-6">
                                                                    <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${
                                                                        activeTab === 'inbox' && !msg.is_read
                                                                            ? 'bg-amber-400 text-white shadow-lg shadow-amber-400/20'
                                                                             : 'bg-slate-100 text-slate-400'
                                                                    }`}>
                                                                        {activeTab === 'inbox' && !msg.is_read ? <Mail size={20} /> : <MailOpen size={20} />}
                                                                    </div>
                                                                    <div>
                                                                        <div className="flex items-center gap-2">
                                                                            <h4 className={`text-sm tracking-tight ${activeTab === 'inbox' && !msg.is_read ? 'font-black text-[#001736]' : 'font-bold text-slate-600'}`}>
                                                                                {msg.title}
                                                                            </h4>
                                                                            {msg.priority === 'high' && <span className="bg-rose-50 text-rose-500 text-[8px] font-black uppercase px-2 py-0.5 rounded-lg border border-rose-100">Urgent</span>}
                                                                        </div>
                                                                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">{msg.content}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-6 text-right ml-18 md:ml-0">
                                                                    <div className="hidden md:block">
                                                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-300">Recipient</p>
                                                                        <p className="text-xs font-black uppercase text-[#001736]">{msg.target_group === 'all' ? 'All Roles' : msg.target_group || msg.target_audience}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-300">Time</p>
                                                                        <p className="text-xs font-black uppercase text-[#001736]">{new Date(msg.created_at).toLocaleDateString()}</p>
                                                                    </div>
                                                                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-[#001736] group-hover:text-amber-400 transition-colors">
                                                                        <ChevronRight size={16} />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                            <Pagination
                                                currentPage={currentPage}
                                                totalPages={totalPages}
                                                totalItems={messages.length}
                                                onPageChange={setCurrentPage}
                                            />
                                        </div>
                                    );
                                })()
                            ) : (
                                <div className="py-20 text-center space-y-4">
                                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                                        <Inbox size={40} />
                                    </div>
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No records found</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Broadcast (Email/SMS) View */}
                    {activeTab === 'broadcast' && (
                        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                            <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-black text-[#001736] tracking-tight uppercase">Mass Communication</h3>
                                    <p className="text-xs text-slate-400 font-bold tracking-widest uppercase mt-1">Email & SMS Broadcast System</p>
                                </div>
                            </div>
                            <div className="p-8">
                                <form onSubmit={handleSendBroadcast} className="max-w-3xl space-y-8">
                                    <div className="grid grid-cols-2 gap-4">
                                        <button type="button" onClick={() => setBroadcastForm({...broadcastForm, channel: 'email'})} className={`p-6 rounded-md border-2 flex flex-col items-center justify-center gap-3 transition-all ${broadcastForm.channel === 'email' ? 'border-indigo-500 bg-indigo-50/30 text-indigo-700' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-300'}`}>
                                            <Mail size={32} />
                                            <span className="font-black text-[11px] uppercase tracking-widest">Send Email</span>
                                        </button>
                                        <button type="button" onClick={() => setBroadcastForm({...broadcastForm, channel: 'sms'})} className={`p-6 rounded-md border-2 flex flex-col items-center justify-center gap-3 transition-all ${broadcastForm.channel === 'sms' ? 'border-emerald-500 bg-emerald-50/30 text-emerald-700' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-300'}`}>
                                            <Smartphone size={32} />
                                            <span className="font-black text-[11px] uppercase tracking-widest">Send SMS</span>
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Target Group</label>
                                        <select value={broadcastForm.target_group} onChange={(e) => setBroadcastForm({...broadcastForm, target_group: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-md text-sm font-bold outline-none cursor-pointer">
                                            <option value="all">All Users (Students, Parents, Staff)</option>
                                            <option value="parents">All Parents</option>
                                            <option value="staff">All Staff</option>
                                            <option value="students">All Students</option>
                                        </select>
                                    </div>

                                    {broadcastForm.channel === 'email' && (
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Email Subject</label>
                                            <input required value={broadcastForm.subject} onChange={(e) => setBroadcastForm({...broadcastForm, subject: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-md text-sm font-bold outline-none" placeholder="Enter subject line..." />
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">{broadcastForm.channel === 'email' ? 'Email Body' : 'SMS Message'}</label>
                                        <textarea required rows={broadcastForm.channel === 'email' ? 8 : 4} value={broadcastForm.message} onChange={(e) => setBroadcastForm({...broadcastForm, message: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-md text-sm font-bold outline-none resize-none" placeholder={`Type your ${broadcastForm.channel.toUpperCase()} message here...`} />
                                        {broadcastForm.channel === 'sms' && <p className="text-[10px] text-slate-400 text-right font-bold">{broadcastForm.message.length} / 160 characters</p>}
                                    </div>

                                    <button type="submit" className={`w-full py-5 rounded-md font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:-translate-y-1 active:translate-y-0 transition-all text-white ${broadcastForm.channel === 'email' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'}`}>
                                        Initiate {broadcastForm.channel.toUpperCase()} Broadcast
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Modals Layer ── */}

            {/* Unified Compose Modal (Notice Share Only) */}
            {showCompose && (
                <div className="fixed inset-0 bg-[#001736]/80 backdrop-blur-md z-120 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
                        
                        {/* Header & Title */}
                        <div className="p-8 border-b border-slate-100 bg-slate-50 shrink-0">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-2xl font-black text-[#001736] tracking-tight uppercase">{editingNoticeId ? 'Update Notice' : 'Notice Share'}</h3>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{editingNoticeId ? 'Update existing institutional notice' : 'Publish an institutional notice'}</p>
                                </div>
                                <button onClick={() => { setShowCompose(false); setEditingNoticeId(null); }} className="p-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-all"><X size={20} className="text-slate-500" /></button>
                            </div>
                        </div>

                        {/* Form Body */}
                        <div className="p-8 overflow-y-auto custom-scrollbar">
                            <form onSubmit={handlePublishNotice} className="space-y-8 animate-in fade-in duration-500">
                                
                                {/* 1. Basic Information */}
                                <div className="space-y-6">
                                    <h4 className="text-sm font-black uppercase text-indigo-600 tracking-widest flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> Basic Information</h4>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Notice Title <span className="text-rose-500">*</span></label>
                                            <input required value={noticeForm.title} onChange={e => setNoticeForm({...noticeForm, title: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all" placeholder="Enter notice title" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Notice Number <span className="text-rose-500">*</span></label>
                                            <input disabled value={noticeForm.notice_number || 'Auto-generated'} className="w-full px-5 py-4 bg-slate-100 border border-slate-200 rounded-xl text-sm font-black text-slate-500 outline-none cursor-not-allowed placeholder:text-slate-400" placeholder="e.g. 0001" />
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
                                    <button type="button" onClick={() => { setShowCompose(false); setEditingNoticeId(null); }} className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-200 transition-all">Cancel</button>
                                    <button type="submit" className="px-8 py-4 bg-amber-400 text-[#001736] rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-amber-300 active:scale-95 transition-all">{editingNoticeId ? 'Update Notice' : 'Publish Notice'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Circular Upload Modal */}
            {showCircularModal && (
                <div className="fixed inset-0 bg-[#001736]/80 backdrop-blur-md z-100 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-2xl font-black text-[#001736] tracking-tight uppercase">Upload Circular</h3>
                                <button onClick={() => setShowCircularModal(false)} className="p-2 hover:bg-slate-100 rounded-md"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleUploadCircular} className="space-y-4">
                                <div className="space-y-1.5 font-bold uppercase tracking-widest text-[9px] text-slate-400">
                                    <label className="px-1">Document Title</label>
                                    <input required value={circularForm.title} onChange={e => setCircularForm({...circularForm, title: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-md text-sm font-bold outline-none" placeholder="e.g. Exam Timetable" />
                                </div>
                                <div className="space-y-1.5 font-bold uppercase tracking-widest text-[9px] text-slate-400">
                                    <label className="px-1">Description</label>
                                    <textarea rows={3} value={circularForm.description} onChange={e => setCircularForm({...circularForm, description: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-md text-sm font-bold outline-none resize-none" placeholder="Optional brief description..." />
                                </div>
                                <div className="space-y-1.5 font-bold uppercase tracking-widest text-[9px] text-slate-400">
                                    <label className="px-1">Target Audience</label>
                                    <select value={circularForm.target_audience} onChange={e => setCircularForm({...circularForm, target_audience: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-md text-sm font-bold outline-none cursor-pointer">
                                        <option value="all">All Institutional Roles</option>
                                        <option value="staff">Staff Members Only</option>
                                        <option value="student">Students Only</option>
                                        <option value="parent">Parents Only</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5 font-bold uppercase tracking-widest text-[9px] text-slate-400">
                                    <label className="px-1">PDF Document</label>
                                    <input required type="file" accept="application/pdf" onChange={e => setCircularForm({...circularForm, file: e.target.files[0]})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-md text-sm font-bold outline-none file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-black file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                                </div>
                                <button type="submit" className="w-full py-5 bg-blue-500 text-white rounded-md font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-blue-600 active:scale-95 transition-all mt-4">Upload to Circulars</button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Notice / Message Details Modal */}
            {selectedMessage && <NoticeDetailModal msg={selectedMessage} onClose={() => setSelectedMessage(null)} />}
        </div>
    );
};

export default Communication;

