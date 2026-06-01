import React, { useState } from 'react';
import { ROOT_URL } from '../../services/API';
import {
    ChevronLeft, Mail, Phone, MapPin, Briefcase,
    FileText, User, CreditCard,
    Building2, Fingerprint, FileCheck, Landmark,
    Eye as EyeIcon, X, CheckCircle2, XCircle,
    BookOpen, Award, Clock, Star, BadgeCheck, Calendar,
    GraduationCap, Truck
} from 'lucide-react';

const ViewStafProfile = ({ staff, onClose, isSelfProfile = false }) => {
    const [activeTab, setActiveTab] = useState('personal');

    if (!staff) return null;

    const isActive = (staff.status || '').toLowerCase() === 'active';
    const isTeaching = (staff.staff_type || '').toLowerCase() === 'teaching';

    // Parse previous schools safely
    let schoolHistory = [];
    const raw = staff.previous_schools;
    if (typeof raw === 'string' && raw.trim()) {
        if (raw.trim().startsWith('[') || raw.trim().startsWith('{')) {
            try { schoolHistory = JSON.parse(raw); } catch { schoolHistory = [{ schoolName: raw }]; }
        } else { schoolHistory = [{ schoolName: raw }]; }
    } else if (Array.isArray(raw)) { schoolHistory = raw; }

    // Academic year: from assignment or direct field
    const academicYear = staff.academic_year
        || staff.assignments?.[0]?.academic_year
        || null;

    const tabs = [
        { id: 'personal',  label: 'Personal',  icon: User },
        { id: 'career',    label: 'Career',     icon: Briefcase },
        { id: 'financial', label: 'Financial',  icon: Building2 },
        { id: 'documents', label: 'Documents',  icon: FileText },
    ];

    return (
        <div className="bg-[#f5f6fa] rounded-xl overflow-hidden border border-slate-200 shadow-sm animate-in fade-in duration-300">

            {/* ══ HERO BANNER ══ */}
            <div className="relative bg-slate-600 flex ">
                {/* Decorative blobs */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
                    <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-amber-400/5 rounded-full blur-2xl" />
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
                        backgroundSize: '28px 28px'
                    }} />
                </div>

                {/* Back button */}
                {!isSelfProfile && (
                    <div className="relative z-10 flex items-center justify-between px-5 sm:px-8 pt-4">
                        <button
                            onClick={onClose}
                            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-white/20 text-black rounded-xl border border-white/15 text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Back
                        </button>
                        <div /> {/* spacer */}
                    </div>
                )}

                {/* Identity strip */}
                <div className="relative z-10 px-5 sm:px-8 pt-5 pb-5">
                    {/* Name row */}
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h1 className="text-xl sm:text-2xl font-black text-white! tracking-tight leading-none">
                            {staff.full_name}
                        </h1>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                            isActive
                                ? 'bg-emerald-400/20 text-emerald-300 ring-1 ring-emerald-400/30'
                                : 'bg-rose-400/20 text-rose-300 ring-1 ring-rose-400/30'
                        }`}>
                            {isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {staff.status || 'Active'}
                        </span>
                    </div>

                    {/* Meta chips */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                        {(staff.role_name || staff.designation) && (
                            <span className="flex items-center gap-1.5 text-amber-400 text-[10px] font-black uppercase tracking-widest">
                                <Briefcase className="w-3 h-3" />
                                {staff.role_name || staff.designation}
                            </span>
                        )}
                        {staff.employee_id && (
                            <span className="flex items-center gap-1.5 text-white text-[10px] font-bold uppercase tracking-widest">
                                <BadgeCheck className="w-3 h-3" />
                                {staff.employee_id}
                            </span>
                        )}
                        {staff.joining_date && (
                            <span className="flex items-center gap-1.5 text-white text-[10px] font-bold uppercase tracking-widest">
                                <Calendar className="w-3 h-3" />
                                Joined {new Date(staff.joining_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* ══ TAB BAR ══ */}
            <div className="flex items-center gap-0 bg-white border-b border-slate-200 px-4 sm:px-6 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 sm:px-6 py-3.5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap border-b-2 transition-all ${
                            activeTab === tab.id
                                ? 'border-[#001736] text-[#001736]'
                                : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
                        }`}
                    >
                        <tab.icon className="w-3.5 h-3.5" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ══ TAB CONTENT ══ */}
            <div className="p-5 sm:p-8">

                {/* ── PERSONAL ── */}
                {activeTab === 'personal' && (
                    <div className="space-y-5 animate-in fade-in duration-300">
                        {/* Quick contact strip */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <QuickStat icon={Phone}  value={staff.mobile || '—'} label="Mobile"  color="bg-indigo-500" />
                            <QuickStat icon={Mail}   value={staff.email  || '—'} label="Email"   color="bg-amber-500" />
                            <QuickStat icon={MapPin} value={staff.address || '—'} label="Address" color="bg-emerald-500" truncate />
                        </div>

                        <Section title="Identity Details" icon={User}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {/* Passport photo inside personal tab */}
                                {staff.doc_photo && (
                                    <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <img
                                            src={`${ROOT_URL}/${staff.doc_photo}`}
                                            alt={staff.full_name}
                                            className="w-20 h-20 rounded-xl object-cover border-2 border-slate-200 shadow-sm shrink-0"
                                        />
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Passport Photo</p>
                                            <p className="text-sm font-black text-[#001736] uppercase">{staff.full_name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{staff.role_name || staff.designation}</p>
                                        </div>
                                    </div>
                                )}
                                <Field label="Full Name"        value={staff.full_name} icon={User} />
                                <Field label="Gender"           value={staff.gender} icon={User} />
                                <Field label="Date of Birth"    value={staff.dob ? new Date(staff.dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : null} icon={Calendar} />
                                <Field label="Universal Number" value={staff.universal_number} icon={Fingerprint} />
                                <Field label="Aadhar Number"    value={staff.aadhar_no} icon={FileCheck} />
                                <Field label="PAN Number"       value={staff.pan_no} icon={CreditCard} />
                                <Field label="Mobile"           value={staff.mobile} icon={Phone} />
                                <Field label="Alternate Mobile" value={staff.alternate_mobile || staff.alternateMobile || staff.alternate_contact || staff.emergency_contact} icon={Phone} />
                                <Field label="Email"            value={staff.email} icon={Mail} />
                            </div>
                            <div className="mt-3">
                                <Field label="Residential Address" value={staff.address} icon={MapPin} multiline />
                            </div>
                        </Section>
                    </div>
                )}

                {/* ── CAREER ── */}
                {activeTab === 'career' && (
                    <div className="space-y-5 animate-in fade-in duration-300">
                        <Section title="Professional Details" icon={Briefcase}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                <Field label="Employment Type" value={staff.employment_type} icon={Briefcase} />
                                <Field label="Qualification"   value={staff.qualification} icon={GraduationCap} />
                                {staff.specialization && (
                                    <Field label="Specialization" value={staff.specialization} icon={BookOpen} />
                                )}
                                <Field label="Experience"      value={staff.experience ? `${staff.experience} Years` : null} icon={Clock} />
                                <Field label="Joining Date"    value={staff.joining_date ? new Date(staff.joining_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : null} icon={Calendar} />
                                {isTeaching && academicYear && (
                                    <Field label="Academic Year" value={academicYear} icon={Award} />
                                )}
                            </div>
                        </Section>

                        {/* Previous school history */}
                        <Section title="Previous School History" icon={Landmark}>
                            {schoolHistory.length > 0 && (schoolHistory[0]?.schoolName || schoolHistory[0]?.school) ? (
                                <div className="space-y-2">
                                    {schoolHistory.map((item, idx) => (
                                        <div key={idx} className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/20 transition-all">
                                            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm shrink-0">
                                                <Landmark className="w-4 h-4 text-indigo-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-[#001736] uppercase tracking-tight">{item.schoolName || item.school}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                                                    {item.fromDate ? new Date(item.fromDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—'}
                                                    {' → '}
                                                    {item.toDate ? new Date(item.toDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Present'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState text="No previous history recorded" />
                            )}
                        </Section>

                        {/* Class assignments — only for teaching staff */}
                        {isTeaching && (
                            <Section title="Class Assignments" icon={Star}>
                                {staff.assignments?.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {staff.assignments.map((as, i) => (
                                            <div key={i} className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl hover:border-indigo-300 transition-all">
                                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{as.grade}</p>
                                                <p className="text-xs font-bold text-slate-700 mt-1 uppercase tracking-tight">{as.subjects}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState text="No active assignments" />
                                )}
                            </Section>
                        )}
                    </div>
                )}

                {/* ── FINANCIAL ── */}
                {activeTab === 'financial' && (
                    <div className="space-y-5 animate-in fade-in duration-300">
                        <div className="relative overflow-hidden rounded-2xl p-6 text-black shadow-xl">
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl" />
                                <div className="absolute inset-0" style={{
                                    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
                                    backgroundSize: '24px 24px'
                                }} />
                            </div>
                            <div className="relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-black mb-3">Monthly Gross Salary</p>
                                <p className="text-4xl font-black tracking-tight">₹ {Number(staff.salary || 0).toLocaleString('en-IN')}</p>
                                <div className="mt-4 flex items-center gap-2">
                                    <div className="h-1.5 w-20 bg-amber-400 rounded-full" />
                                    <p className="text-[9px] font-bold text-black uppercase tracking-widest">Per Month • Gross CTC</p>
                                </div>
                            </div>
                        </div>

                        <Section title="Banking Information" icon={Building2}>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <Field label="Bank Name"      value={staff.bank_name} icon={Building2} />
                                <Field label="Account Number" value={staff.account_no} icon={CreditCard} />
                                <Field label="IFSC Code"      value={staff.ifsc_code} icon={FileText} />
                            </div>
                        </Section>
                    </div>
                )}

                {/* ── DOCUMENTS ── */}
                {activeTab === 'documents' && (
                    <div className="space-y-5 animate-in fade-in duration-300">
                        <Section title="Uploaded Credentials" icon={FileText}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <DocCard label="Profile Photo"       path={staff.doc_photo}         icon={User} />
                                <DocCard label="Aadhar Card"         path={staff.doc_aadhar}        icon={Fingerprint} />
                                <DocCard label="PAN Card"            path={staff.doc_pan}           icon={CreditCard} />
                                <DocCard label="Address Proof"       path={staff.doc_address_proof} icon={MapPin} />
                                <DocCard label="Bank Passbook"       path={staff.doc_bank_passbook} icon={Building2} />
                                <DocCard label="Qualification Certs" path={staff.doc_qual_certs}    icon={GraduationCap} />
                                <DocCard label="Experience Letter"   path={staff.doc_exp_letter}    icon={Award} />
                                <DocCard label="Resume / CV"         path={staff.doc_resume}        icon={FileText} />
                            </div>
                        </Section>

                        {(staff.role_name?.toLowerCase().includes('driver') || staff.doc_driving_license) && (
                            <Section title="Vehicle Documents" icon={Truck}>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <DocCard label="Driving License"     path={staff.doc_driving_license} icon={Truck} />
                                    <DocCard label="Physical Fitness"    path={staff.doc_fitness_cert}    icon={FileCheck} />
                                    <DocCard label="Medical Certificate" path={staff.doc_medical_cert}    icon={FileText} />
                                </div>
                            </Section>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};

/* ═══════════ HELPERS ═══════════ */

const QuickStat = ({ icon, label, value, color, truncate }) => (
    <div className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center text-white shrink-0 shadow-md`}>
            {React.createElement(icon, { className: "w-4 h-4" })}
        </div>
        <div className="min-w-0">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
            <p className={`text-[11px] font-bold text-[#001736] uppercase mt-0.5 ${truncate ? 'truncate' : ''}`}>{value}</p>
        </div>
    </div>
);

const Section = ({ title, icon, children }) => (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100 bg-slate-50/60">
            <div className="w-7 h-7 rounded-lg bg-[#001736] flex items-center justify-center shrink-0">
                {React.createElement(icon, { className: "w-3.5 h-3.5 text-white" })}
            </div>
            <h3 className="text-[10px] font-black text-[#001736] uppercase tracking-widest">{title}</h3>
        </div>
        <div className="p-5">{children}</div>
    </div>
);

const Field = ({ label, value, icon, multiline = false }) => (
    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/20 transition-all group">
        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-indigo-500 group-hover:border-indigo-200 transition-all shrink-0 shadow-sm mt-0.5">
            {React.createElement(icon, { className: "w-3.5 h-3.5" })}
        </div>
        <div className="min-w-0 flex-1">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
            <p className={`text-[12px] font-bold text-[#001736] uppercase leading-snug ${multiline ? 'whitespace-pre-wrap wrap-break-word' : 'truncate'}`}>
                {value || <span className="text-slate-300 font-medium normal-case text-[11px]">Not provided</span>}
            </p>
        </div>
    </div>
);

const DocCard = ({ label, path, icon = FileText }) => (
    <div className={`flex items-center justify-between gap-3 p-4 rounded-xl border transition-all ${
        path
            ? 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5'
            : 'bg-slate-50 border-dashed border-slate-200 opacity-50'
    }`}>
        <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                path ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-100 text-slate-400'
            }`}>
                {React.createElement(icon, { className: "w-4 h-4" })}
            </div>
            <div>
                <p className="text-[10px] font-black text-[#001736] uppercase tracking-tight">{label}</p>
                <p className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${path ? 'text-emerald-500' : 'text-slate-300'}`}>
                    {path ? 'Uploaded' : 'Not uploaded'}
                </p>
            </div>
        </div>
        {path ? (
            <a
                href={`${ROOT_URL}/${path}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#001736] hover:bg-indigo-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-md shrink-0"
            >
                <EyeIcon className="w-3 h-3" /> View
            </a>
        ) : (
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                <X className="w-3.5 h-3.5 text-slate-300" />
            </div>
        )}
    </div>
);

const EmptyState = ({ text }) => (
    <div className="py-10 text-center">
        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{text}</p>
    </div>
);

export default ViewStafProfile;
