import React from 'react';
import {
    ChevronLeft, Mail, Phone, MapPin, Briefcase,
    ShieldCheck, GraduationCap, Calendar, Printer,
    FileText, User, Menu, Edit3, Trash2, X
} from 'lucide-react';

const ViewStafProfile = ({ staff, onClose, onEdit }) => {
    if (!staff) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="bg-white rounded-[2.5rem] shadow-none border-2 border-slate-200 overflow-hidden animate-in zoom-in-95 duration-500">
            {/* Header / Hero Section */}
            <div className="relative h-50 bg-[#001736] overflow-hidden print:hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/20 rounded-full -mr-48 -mt-48 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/20 rounded-full -ml-48 -mb-48 blur-3xl"></div>
                </div>

                <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-20">
                    <div className="flex items-center gap-4">

                        <button
                            onClick={onClose}
                            className="p-3 bg-white/10 backdrop-blur-md text-white rounded-2xl border border-white/20 hover:bg-white/20 transition-all flex items-center gap-2 shadow-xl"
                        >
                            <ChevronLeft className="w-5 h-5" />
                            <span className="text-[10px] font-black uppercase tracking-widest mr-2">Back</span>
                        </button>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handlePrint}
                            className="p-3 bg-white/10 backdrop-blur-md text-white rounded-2xl border border-white/20 hover:bg-white/20 transition-all shadow-xl"
                            title="Print Profile"
                        >
                            <Printer className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => onEdit(staff)}
                            className="px-6 py-3 bg-amber-400 text-[#001736] rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-amber-300 transition-all flex items-center gap-2"
                        >
                            <Edit3 className="w-4 h-4" /> Edit Profile
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="px-12 pb-12 -mt-24 relative z-10">
                <div className="flex flex-col md:flex-row gap-10 items-end mb-12">
                    <div className="w-48 h-48 bg-white p-2 rounded-[2.5rem] shadow-2xl ring-8 ring-white/50 relative group">
                        {staff.doc_photo ? (
                            <img
                                src={`http://localhost:5000/${staff.doc_photo}`}
                                className="w-full h-full object-cover rounded-[2.2rem]"
                                alt={staff.full_name}
                            />
                        ) : (
                            <div className="w-full h-full bg-slate-100 rounded-[2.2rem] flex items-center justify-center text-slate-300">
                                <User className="w-20 h-20" />
                            </div>
                        )}
                        <div className="absolute inset-2 bg-black/40 rounded-[2.2rem] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <FileText className="text-white w-8 h-8" />
                        </div>
                    </div>

                    <div className="flex-1 pb-4">
                        <div className="flex items-center gap-4 mb-2">
                            <h2 className="text-4xl font-black text-black tracking-tight">{staff.full_name}</h2>
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 ${staff.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                                {staff.status}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-6 items-center">
                            <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-widest text-[11px]">
                                <Briefcase className="w-4 h-4 text-amber-500" /> {staff.designation}
                            </div>
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                            <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-widest text-[11px]">
                                <ShieldCheck className="w-4 h-4 text-indigo-500" /> ID: {staff.employee_id}
                            </div>
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                            <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-widest text-[11px]">
                                <MapPin className="w-4 h-4 text-rose-500" /> {staff.address || 'N/A'}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Left Column - Main Details */}
                    <div className="lg:col-span-2 space-y-10">
                        {/* Information Grid */}
                        <div className="bg-slate-50/50 p-10 rounded-[3rem] border-2 border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                            <DetailItem label="Professional Qualification" value={staff.qualification} icon={GraduationCap} />
                            <DetailItem label="Total Experience" value={`${staff.experience} Years`} icon={Briefcase} />
                            <DetailItem label="Date of Joining" value={staff.joining_date} icon={Calendar} />
                            <DetailItem label="Date of Birth" value={staff.dob} icon={Calendar} />
                            <DetailItem label="Contact Number" value={staff.mobile} icon={Phone} />
                            <DetailItem label="Official Email" value={staff.email} icon={Mail} />
                        </div>

                        {/* Academic Assignments */}
                        <div className="bg-white p-10 rounded-[3.5rem] border-2 border-slate-200 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
                            <h4 className="text-lg font-black text-black mb-8 flex items-center gap-3">
                                <FileText className="w-6 h-6 text-indigo-600" /> Academic Responsibilities
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {staff.assignments && staff.assignments.length > 0 ? staff.assignments.map((as, i) => (
                                    <div key={i} className="p-6 bg-indigo-50/50 border border-indigo-200 rounded-3xl hover:bg-white transition-colors">
                                        <p className="text-[10px] font-black text-indigo-600 uppercase mb-2">Class Teacher</p>
                                        <h5 className="text-lg font-black text-black mb-1">{as.grade}</h5>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Subjects: {as.subjects}</p>
                                    </div>
                                )) : (
                                    <div className="col-span-2 p-8 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-300">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">No academic assignments recorded</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Secondary Actions & Documents */}
                    <div className="space-y-10">
                        {/* Salary Summary Card */}
                        <div className="bg-[#001736] p-10 rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl">
                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400 mb-6">Financial Summary</p>
                            <div className="space-y-6">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-white/40 mb-1 tracking-widest">Monthly Basic Salary</p>
                                    <p className="text-4xl font-black">₹ {Number(staff.salary || 0).toLocaleString()}</p>
                                </div>
                                <button className="w-full py-4 bg-white/10 hover:bg-white/20 text-[10px] font-black uppercase tracking-widest rounded-2xl border border-white/5 transition-all text-indigo-200">
                                    Generate Pay History
                                </button>
                            </div>
                        </div>

                        {/* Document Management */}
                        <div className="bg-white p-10 rounded-[3.5rem] border-2 border-slate-200 shadow-sm">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-8 underline decoration-amber-400 decoration-4 underline-offset-8">Uploaded Credentials</h4>
                            <div className="space-y-4">
                                <DocRow label="Aadhar Card Copy" path={staff.doc_aadhar} />
                                <DocRow label="Educational Certs" path={staff.doc_qual_certs} />
                                <DocRow label="Experience Proof" path={staff.doc_exp_letter} />
                            </div>
                        </div>

                        {/* Destructive Actions */}
                        <div className="p-2">
                            <button className="w-full py-5 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 border border-rose-100 group">
                                <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" /> Remove from Staff
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DetailItem = ({ label, value, icon: Icon }) => (
    <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-black shadow-sm border-2 border-slate-200 shrink-0">
            {Icon && <Icon className="w-5 h-5" />}
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-sm font-black text-black leading-tight">{value || '---'}</p>
        </div>
    </div>
);

const DocRow = ({ label, path }) => (
    <div className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${path ? 'bg-indigo-50/50 border-indigo-100' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
        <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${path ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'}`}>
                <FileText className="w-4 h-4" />
            </div>
            <p className="text-[11px] font-black text-black tracking-tight uppercase">{label}</p>
        </div>
        {path ? (
            <a
                href={`http://localhost:5000/${path}`}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 flex items-center justify-center bg-white rounded-lg text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100"
            >
                <Eye className="w-4 h-4" />
            </a>
        ) : (
            <X className="w-4 h-4 text-slate-300 mr-2" />
        )}
    </div>
);

const Eye = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z" /><circle cx="12" cy="12" r="3" /></svg>
);

export default ViewStafProfile;
