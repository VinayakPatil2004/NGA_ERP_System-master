import React from 'react';
import {
    Megaphone, Eye, Paperclip, X, FileText, User,
    Users, CheckCircle, Clock, AlertCircle
} from 'lucide-react';
import { ROOT_URL } from '../../services/API';

/**
 * Shared Notice Card Component
 * Used across Admin, Teacher, Library, Counsellor dashboards.
 * Props:
 *   - msg: notice object
 *   - onView: callback when View is clicked
 *   - showActions: boolean (default false) — shows edit/delete if true
 *   - onEdit: callback for edit
 *   - onDelete: callback for delete
 */
export const NoticeCard = ({ msg, onView, showActions = false, onEdit, onDelete }) => {
    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between overflow-hidden relative min-h-[220px]">
            {msg.priority === 'high' && <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500"></div>}
            <div className="p-6 pb-0 space-y-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                            <Megaphone size={18} />
                        </div>
                        <div>
                            <span className="bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase px-2.5 py-1 rounded-lg tracking-widest">Notice</span>
                        </div>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full">{new Date(msg.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                    <h4 className="text-lg font-black text-[#001736] tracking-tight leading-tight line-clamp-2">{msg.title}</h4>
                    <p className="text-sm text-slate-500 mt-2 line-clamp-3 font-medium leading-relaxed">{msg.description || msg.content}</p>
                    {msg.attachment_url && (
                        <div className="mt-3 flex items-center gap-1.5 text-blue-500">
                            <Paperclip size={13} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Document Attached</span>
                        </div>
                    )}
                </div>
            </div>
            <div className="p-6 pt-4 mt-4 border-t border-slate-50 flex items-center justify-between bg-slate-50/50">
                <div className="flex flex-col">
                    <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Target</span>
                    <span className="text-[10px] font-bold text-slate-600">
                        {(() => {
                            try {
                                const a = msg.audience ? (typeof msg.audience === 'string' ? JSON.parse(msg.audience) : msg.audience) : null;
                                if (Array.isArray(a) && a.length > 0) return a.join(' · ');
                            } catch {
                                // ignore parse error
                            }
                            return msg.target_group || msg.target_audience || 'ALL';
                        })()}
                    </span>
                </div>
                <div className="flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); onView && onView(msg); }} className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider"><Eye size={14} /> View</button>
                    {showActions && onEdit && (
                        <button onClick={(e) => { e.stopPropagation(); onEdit(msg); }} className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                        </button>
                    )}
                    {showActions && onDelete && (
                        <button onClick={(e) => { e.stopPropagation(); onDelete(msg); }} className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

/**
 * Shared Notice Detail Modal
 * Full view with document preview (PDF/Image).
 */
export const NoticeDetailModal = ({ msg, onClose }) => {
    if (!msg) return null;

    const raw = msg.attachment_url || '';
    const hasDoc = Boolean(raw);
    const docUrl = !hasDoc ? ''
        : raw.startsWith('http') ? raw
        : raw.startsWith('/') ? `${ROOT_URL}${raw}`
        : `${ROOT_URL}/uploads/${raw}`;
    const isPDF = hasDoc && raw.toLowerCase().endsWith('.pdf');
    const isImage = hasDoc && /\.(jpg|jpeg|png|gif|webp)$/i.test(raw);
    const fileName = hasDoc ? raw.split('/').pop() : '';

    let audienceText = '';
    if (msg.audience) {
        try {
            const a = typeof msg.audience === 'string' ? JSON.parse(msg.audience) : msg.audience;
            audienceText = Array.isArray(a) ? a.join(' · ') : String(a);
        } catch { audienceText = String(msg.audience); }
    }

    return (
        <div className="fixed inset-0 bg-[#001736]/80 backdrop-blur-md z-120 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[92vh] flex flex-col">

                {/* Top bar */}
                <div className="px-8 pt-8 pb-4 flex items-center justify-between shrink-0 border-b border-slate-100">
                    <div>
                        <h3 className="text-lg font-black text-[#001736] tracking-tight">Notice Details</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">View full notice information</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all">
                        <X size={18} className="text-slate-500" />
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="overflow-y-auto custom-scrollbar">
                    <div className="p-8 space-y-6">

                        {/* Basic Info */}
                        <div className="space-y-3">
                            <div className="text-[10px] font-black uppercase text-indigo-500 tracking-widest flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block" /> Basic Information
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Notice Title</label>
                                    <div className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-[#001736]">{msg.title || '—'}</div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Notice Number</label>
                                    <div className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-indigo-600">{msg.notice_number ? `#${msg.notice_number}` : '—'}</div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Category</label>
                                    <div className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700">{msg.category || '—'}</div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Priority</label>
                                    <div className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                                        <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                            msg.priority === 'Urgent' ? 'bg-rose-100 text-rose-600' :
                                            msg.priority === 'High' ? 'bg-orange-100 text-orange-600' :
                                            msg.priority === 'Medium' ? 'bg-amber-100 text-amber-600' :
                                            'bg-slate-100 text-slate-500'
                                        }`}>{msg.priority || 'Normal'}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Created By</label>
                                    <div className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <User size={13} className="text-slate-400" /> {msg.sender_name || '—'}
                                    </div>
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Description</label>
                                    <div className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 leading-7 whitespace-pre-wrap min-h-[80px]">
                                        {msg.description || msg.content || '—'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Audience & Schedule */}
                        <div className="space-y-3 pt-2 border-t border-slate-100">
                            <div className="text-[10px] font-black uppercase text-amber-500 tracking-widest flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" /> Audience &amp; Schedule
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {(audienceText || msg.target_audience) && (
                                    <div className="col-span-2 space-y-1">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Share To (Audience)</label>
                                        <div className="w-full px-5 py-3.5 bg-amber-50 border border-amber-100 rounded-xl text-sm font-bold text-slate-700 flex items-start gap-2">
                                            <Users size={13} className="text-amber-500 mt-0.5 shrink-0" />
                                            <span>{audienceText || msg.target_audience || 'All'}</span>
                                        </div>
                                    </div>
                                )}
                                {msg.publish_date && (
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Publish Date</label>
                                        <div className="w-full px-5 py-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-sm font-bold text-emerald-700 flex items-center gap-2">
                                            <CheckCircle size={13} className="text-emerald-500" /> {new Date(msg.publish_date).toLocaleDateString()}
                                        </div>
                                    </div>
                                )}
                                {msg.publish_time && (
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Publish Time</label>
                                        <div className="w-full px-5 py-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-sm font-bold text-emerald-700 flex items-center gap-2">
                                            <Clock size={13} className="text-emerald-500" /> {msg.publish_time}
                                        </div>
                                    </div>
                                )}
                                {msg.expiry_date && (
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Expiry Date</label>
                                        <div className="w-full px-5 py-3.5 bg-rose-50 border border-rose-100 rounded-xl text-sm font-bold text-rose-600 flex items-center gap-2">
                                            <AlertCircle size={13} className="text-rose-400" /> {new Date(msg.expiry_date).toLocaleDateString()}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Uploaded Document */}
                        {hasDoc && (
                            <div className="space-y-3 pt-2 border-t border-slate-100">
                                <div className="text-[10px] font-black uppercase text-blue-500 tracking-widest flex items-center gap-1.5">
                                    <Paperclip size={11} /> Uploaded Document
                                </div>
                                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                                    <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isPDF ? 'bg-rose-50 text-rose-500' : isImage ? 'bg-purple-50 text-purple-500' : 'bg-blue-50 text-blue-500'}`}>
                                                <FileText size={14} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-black text-slate-700 uppercase">{isPDF ? 'PDF Document' : isImage ? 'Image File' : 'Document'}</p>
                                                <p className="text-[9px] text-slate-400 font-bold truncate">{fileName}</p>
                                            </div>
                                        </div>
                                        <a href={docUrl} target="_blank" rel="noreferrer"
                                            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95 shrink-0">
                                            <Eye size={12} /> Open
                                        </a>
                                    </div>
                                    {isPDF && <iframe src={docUrl} className="w-full h-72 bg-slate-100" title="PDF Preview" />}
                                    {isImage && <img src={docUrl} alt="Attachment" className="w-full max-h-64 object-contain bg-slate-50 p-4" />}
                                    {!isPDF && !isImage && (
                                        <div className="p-6 text-center text-slate-400 text-xs font-bold">
                                            Preview not available — click <span className="text-blue-500">Open</span> to view the file.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <p className="text-[10px] text-slate-300 font-bold text-right">Created: {new Date(msg.created_at).toLocaleString()}</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 shrink-0 flex items-center justify-between gap-3">
                    <div>
                        {hasDoc && (
                            <a href={docUrl} target="_blank" rel="noreferrer"
                                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-500/20">
                                <FileText size={14} /> View Document
                            </a>
                        )}
                    </div>
                    <button onClick={onClose} className="px-8 py-3 bg-[#001736] text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all active:scale-95">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NoticeCard;
