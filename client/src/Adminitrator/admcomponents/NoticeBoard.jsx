import React, { useEffect, useState, useCallback } from 'react';
import communicationAPI from '../../services/communicationAPI';
import { Megaphone, Calendar, ChevronRight, Bell, Info, User as UserIcon } from 'lucide-react';
import { useAcademicYear } from '../../context/AcademicYearContext';
import { NoticeCard, NoticeDetailModal } from './NoticeCard';
import Pagination from './Pagination';

/**
 * NoticeBoard - Targeted Institutional Announcement Component
 * Displays notices based on the intended audience (staff, student, parent, all).
 */
const NoticeBoard = ({ audience = 'all', compact = false, gridClass = "grid-cols-1 md:grid-cols-2 xl:grid-cols-3", limit = null }) => {
    const { selectedYear } = useAcademicYear();
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewingNotice, setViewingNotice] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchNotices = useCallback(async () => {
        try {
            setLoading(true);
            const data = await communicationAPI.getAllAnnouncements(selectedYear?.id);
            
            // Filter by audience logic
            const filtered = data.filter(n => {
                const aud = n.audience || n.target_audience;
                if (!aud) return false;
                
                let targets = [];
                try {
                    targets = typeof aud === 'string' && aud.startsWith('[') 
                        ? JSON.parse(aud).map(t => t.trim().toLowerCase()) 
                        : aud.split(',').map(t => t.trim().toLowerCase());
                } catch {
                    targets = String(aud).split(',').map(t => t.trim().toLowerCase());
                }
                
                const staffRoles = ['staff', 'teacher', 'hr', 'library', 'account', 'administrator', 'counsellor', 'accountant'];
                const isAudienceStaff = staffRoles.includes(audience.toLowerCase());

                return (
                    targets.includes('all') ||
                    targets.some(t => t.includes('all')) ||
                    targets.includes(audience.toLowerCase()) ||
                    ((audience === 'student' || audience === 'parent') && (targets.some(t => t.includes('parent') || t.includes('student')))) ||
                    (isAudienceStaff && targets.some(t => staffRoles.includes(t)))
                );
            });
            
            // Sort descending by date
            const sorted = filtered.sort((a, b) => new Date(b.created_at || b.start_date) - new Date(a.created_at || a.start_date));
            
            if (limit) {
                setNotices(sorted.slice(0, limit));
            } else {
                setNotices(sorted);
            }
        } catch (err) {
            console.error("Notice Board Error:", err);
        } finally {
            setLoading(false);
        }
    }, [audience, selectedYear?.id, limit]);

    useEffect(() => {
        fetchNotices();
    }, [fetchNotices]);

    if (loading) {
        return (
            <div className="flex flex-col gap-4 animate-pulse p-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-slate-100 rounded-2xl w-full"></div>
                ))}
            </div>
        );
    }

    if (notices.length === 0) {
        return (
            <div className="p-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-3xl">
                <Info className="w-8 h-8 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Registry Zero: No Active Notices</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {!compact && (
                <div className="flex items-center justify-between mb-6 px-2">
                    <h3 className="text-xl font-black text-[#001736] flex items-center gap-3 uppercase tracking-tighter">
                        <Megaphone className="text-rose-500 w-6 h-6" />
                        Institutional Notice Board
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{notices.length} Active Records</span>
                </div>
            )}

            <div className={`grid gap-6 ${gridClass}`}>
                {(() => {
                    let displayNotices = notices;
                    if (!limit) {
                        displayNotices = notices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
                    }
                    return displayNotices.map((notice) => (
                        <NoticeCard
                            key={notice.id}
                            msg={{ ...notice, is_announcement: true, content: notice.description }}
                            onView={(msg) => setViewingNotice(msg)}
                        />
                    ));
                })()}
            </div>

            {!limit && notices.length > itemsPerPage && (
                <div className="mt-8">
                    <Pagination 
                        currentPage={currentPage}
                        totalPages={Math.ceil(notices.length / itemsPerPage)}
                        totalItems={notices.length}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}

            {/* Notice Detail Modal */}
            {viewingNotice && <NoticeDetailModal msg={viewingNotice} onClose={() => setViewingNotice(null)} />}
        </div>
    );
};

export default NoticeBoard;
