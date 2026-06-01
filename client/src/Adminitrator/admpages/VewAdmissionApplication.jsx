import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowLeft, Users, FileText,
    MapPin, BookOpen, GraduationCap, CheckCircle,
    Clock, XCircle, Printer, Eye, Download,
    Check, Send, Info, User, Phone, Mail,
    Calendar, Landmark, Edit3, Menu
} from 'lucide-react';
import { toast } from 'react-toastify';
import { getApplicationById /*, updateApplicationDetails */ } from '../../services/applyAdmissionAPI';
import { ROOT_URL } from '../../services/API';

const VewAdmissionApplication = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('Pending');

    const [formData, setFormData] = useState({
        appNo: '',
        studentIdNo: "",
        studentName: "",
        grade: "",
        grNo: "",
        penNo: "",
        dob: "",
        pob: "",
        aadhar: "",
        religion: "",
        caste: "",
        subcaste: "",
        address: "",
        fatherName: "",
        fatherMobile: "",
        fatherEmail: "",
        fatherOccupation: "",
        motherName: "",
        motherMobile: "",
        motherOccupation: "",
        motherTongue: "",
        prevSchool: "",
        prevClass: "",
        prevBoard: "",
        prevYear: "",
        prevPercentage: "",
        academicYear: "",
        pincode: "",
        taluka: "",
        district: "",
        state: "",
        photo: "",
        documents: []
    });

    const fetchApplicationData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getApplicationById(id);
            const fullName = `${data.last_name || ''} ${data.first_name || ''} ${data.middle_name || ''}`.trim();
            const dobFormatted = data.dob ? new Date(data.dob).toLocaleDateString() : '---';
            const admDateFormatted = data.enrollment_date ? new Date(data.enrollment_date).toLocaleDateString() : (data.created_at ? new Date(data.created_at).toLocaleDateString() : '---');

            setFormData({
                appNo: data.application_no,
                studentIdNo: data.student_id_no || data.srNo,
                studentName: fullName,
                grade: data.grade || data.current_grade || data.class_admitted_to,
                grNo: data.gr_no,
                penNo: data.pen_no,
                dob: dobFormatted,
                pob: data.pob,
                aadhar: data.aadhar || data.aadhar_no,
                religion: data.religion,
                caste: data.caste,
                subcaste: data.subcaste,
                address: data.address || data.residential_address,
                fatherName: data.father_name,
                fatherMobile: data.father_mobile,
                fatherEmail: data.father_email,
                fatherOccupation: data.father_occupation,
                motherName: data.mother_name,
                motherMobile: data.mother_mobile,
                motherOccupation: data.mother_occupation,
                motherTongue: data.mother_tongue,
                prevSchool: data.prev_school,
                prevClass: data.prev_class,
                prevBoard: data.prev_board,
                prevYear: data.prev_year,
                prevPercentage: data.prev_percentage,
                date: admDateFormatted,
                academicYear: data.academic_year,
                pincode: data.pincode,
                taluka: data.taluka,
                district: data.district,
                state: data.state,
                photo: data.doc_passport_photo,
                documents: [
                    { id: 'passportPhoto', label: 'Passport Size Photo', status: data.doc_passport_photo ? 'Uploaded' : 'Missing', path: data.doc_passport_photo },
                    { id: 'birthCert', label: 'Birth Certificate', status: data.doc_birth_cert ? 'Uploaded' : 'Missing', path: data.doc_birth_cert },
                    { id: 'aadharCopy', label: 'Aadhar Card Copy', status: data.doc_aadhar_copy ? 'Uploaded' : 'Missing', path: data.doc_aadhar_copy },
                    { id: 'leavingCert', label: 'Leaving Certificate (LC)', status: data.doc_leaving_cert ? 'Uploaded' : 'Missing', path: data.doc_leaving_cert },
                    { id: 'casteCert', label: 'Caste Certificate', status: data.doc_caste_cert ? 'Uploaded' : 'Missing', path: data.doc_caste_cert },
                ]
            });
            setStatus(data.status);
        } catch (error) {
            console.error("Error fetching application details:", error);
            toast.error("Failed to load application details");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchApplicationData();
    }, [fetchApplicationData]);

    const currentDashboard = location.pathname.split('/')[2];
    const hasFullAccess = ['admin', 'accountant', 'principal'].includes(currentDashboard);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-black text-[#001736] uppercase tracking-widest animate-pulse">Loading Application Details...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-8 animate-in fade-in duration-500 ">
            {/* Top Navigation & Status */}
            <div className={`max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all duration-300`}>
                <div className="flex items-center gap-5">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3 bg-white rounded-2xl shadow-sm border-institutional text-slate-400 hover:text-[#001736] transition-all group"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black text-[#001736] tracking-tight">{formData.studentName}</h1>
                            <span
                                className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${status === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                        status === 'rejected' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                            status === 'verified' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                                'bg-amber-50 text-amber-600 border border-amber-100'
                                    }`}
                            >
                                {status === 'verified' ? 'In Review' : status}
                            </span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Application Registry: {formData.appNo}</p>
                    </div>
                </div>

                {hasFullAccess ? (
                    <div className="flex items-center gap-3 ">
                        {status === 'enrolled' ? (
                            <div className="px-8 py-3 bg-indigo-100 text-indigo-700 rounded-2xl text-xs font-black flex items-center gap-2 border border-indigo-200">
                                <Users className="w-4 h-4" /> Student Enrolled
                            </div>
                        ) : (
                            <div className="px-8 py-3 bg-emerald-100 text-emerald-700 rounded-2xl text-xs font-black flex items-center gap-2 border border-emerald-200">
                                <CheckCircle className="w-4 h-4" /> Application Registered
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">View Only Access</span>
                    </div>
                )}
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Side: Detailed Information */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Admission Details */}
                    <SectionBox title="Admission Details" icon={Landmark} color="text-amber-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <DataField label="Academic Year" value={formData.academicYear} />
                            <DataField label="Admission Date" value={formData.date} />
                            <DataField label="Class Admitted To" value={formData.grade} highlight />
                            <DataField label="Application ID" value={formData.appNo} />
                            <DataField label="Student ID No." value={formData.studentIdNo} />
                            <DataField label="GR Number" value={formData.grNo} />
                            <DataField label="PEN Number" value={formData.penNo} />
                        </div>
                    </SectionBox>

                    {/* Student Profile */}
                    <SectionBox title="Student Profile" icon={User} color="text-indigo-500">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <DataField label="Full Name" value={formData.studentName} />
                            <DataField label="Date of Birth" value={formData.dob} />
                            <DataField label="Place of Birth" value={formData.pob} />
                            <DataField label="Aadhar Number" value={formData.aadhar} />
                            <DataField label="Religion" value={formData.religion} />
                            <DataField label="Caste" value={formData.caste} />
                            <DataField label="Sub-caste" value={formData.subcaste} />
                            <DataField label="Mother Tongue" value={formData.motherTongue} />
                            <DataField label="Address" value={formData.address} fullWidth />
                            <DataField label="Taluka" value={formData.taluka} />
                            <DataField label="District" value={formData.district} />
                            <DataField label="State" value={formData.state} />
                            <DataField label="Pincode" value={formData.pincode} />
                        </div>
                    </SectionBox>

                    {/* Academic History */}
                    <SectionBox title="Academic Background" icon={GraduationCap} color="text-emerald-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <DataField label="Previous School" value={formData.prevSchool} />
                            <DataField label="Previous Class" value={formData.prevClass} />
                            <DataField label="Board" value={formData.prevBoard} />
                            <DataField label="Year of Passing" value={formData.prevYear} />
                            <DataField label="Percentage/Grade" value={formData.prevPercentage} />
                        </div>
                    </SectionBox>

                    {/* Uploaded Documents */}
                    <SectionBox title="Compliance Documents" icon={FileText} color="text-indigo-400">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {formData.documents.map((doc, idx) => (
                                <div key={idx} className="p-4 bg-white rounded-xl border-institutional flex items-center justify-between group hover:bg-slate-50 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-100">
                                            <FileText className="w-4 h-4 text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-[#001736]">{doc.label}</p>
                                            <span className={`text-[9px] font-black uppercase tracking-wider ${doc.status === 'Verified' ? 'text-emerald-500' : 'text-amber-500'}`}>{doc.status}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => doc.path && window.open(`${ROOT_URL}/${doc.path.replace(/\\/g, '/')}`, '_blank')}
                                            disabled={!doc.path}
                                            className={`p-2 bg-white rounded-lg border border-slate-100 ${doc.path ? 'text-slate-400 hover:text-indigo-600' : 'text-slate-200 cursor-not-allowed'} shadow-sm transition-colors`}
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <a
                                            href={`${ROOT_URL}/${doc.path?.replace(/\\/g, '/')}`}
                                            download
                                            target="_blank"
                                            rel="noreferrer"
                                            className={`p-2 bg-emerald-50 rounded-lg border border-emerald-100 ${doc.path ? 'text-emerald-600 hover:bg-emerald-100' : 'text-slate-200 pointer-events-none'} shadow-sm transition-colors`}
                                        >
                                            <Download className="w-4 h-4" />
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </SectionBox>
                </div>

                {/* Right Side: Photo and Parent Info */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-white  p-8 shadow-sm border-institutional flex flex-col items-center text-center animate-in zoom-in duration-500">
                        <div className="w-48 h-48 rounded-4xl overflow-hidden border-4 border-slate-50 shadow-2xl relative group bg-slate-100 flex items-center justify-center">
                            {formData.photo ? (
                                <img
                                    src={`${ROOT_URL}/${formData.photo.replace(/\\/g, '/').replace(/^uploads\//, 'uploads/')}`}
                                    className="w-full h-full object-cover"
                                    alt="Student"
                                    onError={(e) => {
                                        if (!e.target.src.includes('/uploads/uploads/')) {
                                            e.target.src = e.target.src.replace('/uploads/', '/');
                                        }
                                    }}
                                />
                            ) : (
                                <User className="w-24 h-24 text-slate-200" />
                            )}

                            <div className="absolute inset-0 bg-[#001736]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                    onClick={() => formData.photo && window.open(`${ROOT_URL}/${formData.photo.replace(/\\/g, '/')}`, '_blank')}
                                    className="p-3 bg-white rounded-2xl text-[#001736] font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300"
                                >
                                    <Eye className="w-4 h-4" /> Full View
                                </button>
                            </div>
                        </div>
                        <div className="mt-6 space-y-1">
                            <h4 className="text-sm font-black text-[#001736] uppercase tracking-wider">Passport Photograph</h4>
                            <p className={`text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 ${formData.photo ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {formData.photo ? <><CheckCircle className="w-3 h-3" /> Digital Copy Uploaded</> : "No Photo Uploaded"}
                            </p>
                        </div>
                    </div>

                    <SectionBox title="Parental Information" icon={Users} color="text-emerald-500">
                        <div className="space-y-8 text-left">
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#001736]/30 border-b border-slate-100 pb-2">Father's Details</h4>
                                <DataField label="Name" value={formData.fatherName} />
                                <DataField label="Phone" value={formData.fatherMobile} />
                                <DataField label="Occupation" value={formData.fatherOccupation} />
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#001736]/30 border-b border-slate-100 pb-2">Mother's Details</h4>
                                <DataField label="Name" value={formData.motherName} />
                                <DataField label="Phone" value={formData.motherMobile} />
                                <DataField label="Occupation" value={formData.motherOccupation} />
                            </div>
                        </div>
                    </SectionBox>
                </div>
            </div>
        </div>
    );
};

/* Helper Components */
const SectionBox = ({ title, icon, color, children }) => {
    const Icon = icon;
    return (
        <div className="bg-white  p-8 shadow-sm border-institutional">
            <h3 className="text-lg font-black text-[#001736] mb-8 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                </div>
                {title}
            </h3>
            {children}
        </div>
    );
};

const DataField = ({ label, value, icon, fullWidth, highlight }) => {
    const Icon = icon;

    return (
        <div className={fullWidth ? 'md:col-span-3' : ''}>
            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2 block">{label}</label>
            <div className={`p-2 rounded-xl border-institutional transition-all hover:bg-slate-100 flex items-center justify-between gap-3 ${highlight ? 'bg-indigo-50/50 text-indigo-600' : 'bg-white text-[#001736]'
                }`}>
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                    {Icon && <Icon className={`w-3.5 h-3.5 shrink-0 text-slate-300`} />}
                    <p className="text-sm font-bold truncate">{value || '---'}</p>
                </div>
            </div>
        </div>
    );
};

const AmountItem = ({ label, amount, color = "text-white", large }) => (
    <div className="flex justify-between items-center">
        <span className="text-[10px] uppercase text-white/40 font-black tracking-widest">{label}</span>
        <span className={`font-black ${large ? 'text-2xl' : 'text-sm'} ${color}`}>₹ {amount.toLocaleString()}</span>
    </div>
);

export default VewAdmissionApplication;
