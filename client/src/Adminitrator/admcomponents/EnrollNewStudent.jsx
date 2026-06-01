import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
    User, UserPlus, Book, MapPin, Upload, ChevronRight, ChevronLeft, CheckCircle, 
    Info, Landmark, ScrollText, Users, Printer, CreditCard, Smartphone, 
    Banknote, X, Eye, Zap, Copy, ArrowRight
} from 'lucide-react';
import axios from 'axios';
import PrintLayout from '../../components/PrintLayout';
import FeeReceipt from '../../components/FeeReceipt';
import upiLogo from "../../assets/upi-logo.png";
import visaLogo from "../../assets/visa-logo.png";
import { ACADEMIC_YEARS } from "../../utils/constants";
import { directEnrollStudent } from "../../services/applyAdmissionAPI";

const EnrollNewStudent = ({ onClose }) => {
    const [step, setStep] = useState(1);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [enrollmentResult, setEnrollmentResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [allClassrooms, setAllClassrooms] = useState([]);
    
    const [formData, setFormData] = useState({
        studentName: '',
        grade: '',
        classroom_id: '',
        roll_number: '',
        residentialAddress: '',
        pincode: '',
        gender: '',
        dob: '',
        pob: '',
        aadhar: '',
        religion: '',
        caste: '',
        subcaste: '',
        fatherName: '',
        fatherMobile: '',
        fatherEmail: '',
        fatherOccupation: '',
        motherName: '',
        motherMobile: '',
        motherOccupation: '',
        motherTongue: '',
        taluka: '',
        district: '',
        state: 'Maharashtra',
        prevClass: '',
        prevSchoolName: '',
        prevBoard: '',
        prevYear: '',
        prevPercentage: '',
        signature: '',
        paidAmount: '',
        pendingAmount: '',
        paymentMethod: 'Cash',
        academicYear: '2026-27',
        isTransportRequired: false,
        transportRoute: '',
        transportFees: 0,
        date: new Date().toISOString().split('T')[0]
    });

    const [files, setFiles] = useState({
        passportPhoto: null,
        birthCert: null,
        leavingCert: null,
        casteCert: null,
        aadharCopy: null
    });

    const [previews, setPreviews] = useState({
        passportPhoto: null
    });

    // Fetch classrooms for assignment
    useEffect(() => {
        const fetchClassrooms = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/classrooms');
                setAllClassrooms(res.data);
            } catch (error) {
                console.error("Failed to load classrooms", error);
            }
        };
        fetchClassrooms();
    }, []);

    // Fee Structure Strategy
    const FEE_STRUCTURE = {
        'Nursery': { tuition: 18000, other: 900 },
        'Jr.Kg': { tuition: 18000, other: 900 },
        'Sr.Kg': { tuition: 18000, other: 900 },
        '1st': { tuition: 22425, other: 900 },
        '2nd': { tuition: 22425, other: 900 },
        '3rd': { tuition: 22425, other: 900 },
        '4th': { tuition: 22425, other: 900 },
        '5th': { tuition: 22425, other: 900 },
        '6th': { tuition: 23000, other: 900 },
        '7th': { tuition: 23000, other: 900 },
        '8th': { tuition: 23000, other: 900 },
        '9th': { tuition: 34100, other: 900 },
        '10th': { tuition: 34100, other: 900 },
    };

    const structure = FEE_STRUCTURE[formData.grade] || { tuition: 0, other: 900 };
    const schoolName = formData.prevSchoolName?.toLowerCase() || "";
    const isOldStudent = schoolName.includes("grace") || schoolName.includes("nga");
    const tuitionFee = (isOldStudent && (formData.grade === '9th' || formData.grade === '10th')) 
        ? 30100 
        : structure.tuition;

    const transportCost = formData.isTransportRequired ? Number(formData.transportFees) : 0;
    const derivedTotal = formData.grade ? tuitionFee + structure.other + transportCost : 0;
    const derivedPending = Math.max(0, derivedTotal - (Number(formData.paidAmount) || 0));

    const checkStepValidity = (s) => {
        if (s === 1) {
            return formData.studentName && formData.gender && formData.dob && 
                   formData.religion && formData.caste &&
                   formData.aadhar?.length === 12 &&
                   formData.fatherName && formData.fatherMobile?.length === 10 &&
                   formData.motherName;
        }
        if (s === 2) {
            return formData.residentialAddress && formData.pincode?.length === 6 && formData.prevSchoolName;
        }
        if (s === 3) return !!formData.grade;
        if (s === 6) return formData.paidAmount >= 0;
        return true;
    };

    const validateStep = (s) => {
        let newErrors = {};
        if (s === 1) {
            if (!formData.studentName) newErrors.studentName = "Required";
            if (!formData.gender) newErrors.gender = "Required";
            if (!formData.dob) newErrors.dob = "Required";
            if (!formData.religion) newErrors.religion = "Required";
            if (!formData.caste) newErrors.caste = "Required";
            if (!formData.aadhar || formData.aadhar.length !== 12) newErrors.aadhar = "Invalid Aadhar";
            if (!formData.fatherName) newErrors.fatherName = "Required";
            if (!formData.fatherMobile || formData.fatherMobile.length !== 10) newErrors.fatherMobile = "Invalid Number";
            if (!formData.motherName) newErrors.motherName = "Required";
        }
        if (s === 2) {
            if (!formData.residentialAddress) newErrors.residentialAddress = "Required";
            if (!formData.pincode || formData.pincode.length !== 6) newErrors.pincode = "Invalid Pincode";
            if (!formData.prevSchoolName) newErrors.prevSchoolName = "Required";
        }
        if (s === 3) {
            if (!formData.grade) newErrors.grade = "Required";
        }
        if (s === 6) {
            if (!formData.paidAmount || formData.paidAmount < 0) newErrors.paidAmount = "Invalid Amount";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        let { name, value } = e.target;
        const numericFields = ['aadhar', 'fatherMobile', 'motherMobile', 'paidAmount', 'pincode', 'transportFees'];
        if (numericFields.includes(name)) {
            value = value.replace(/\D/g, '');
            if (name === 'pincode' && value.length > 6) value = value.slice(0, 6);
            if (name === 'aadhar' && value.length > 12) value = value.slice(0, 12);
            if ((name === 'fatherMobile' || name === 'motherMobile') && value.length > 10) value = value.slice(0, 10);
        }
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleFileChange = (e, field) => {
        const file = e.target.files[0];
        if (file) {
            setFiles(prev => ({ ...prev, [field]: file }));
            if (field === 'passportPhoto') {
                const reader = new FileReader();
                reader.onloadend = () => setPreviews(prev => ({ ...prev, [field]: reader.result }));
                reader.readAsDataURL(file);
            }
        }
    };

    const handleSubmit = async (e) => {
        e?.preventDefault();
        if (step < 7) {
            if (validateStep(step)) setStep(s => s + 1);
        } else {
            try {
                setLoading(true);
                const submissionData = new FormData();
                
                // Text Fields
                Object.keys(formData).forEach(key => {
                    submissionData.set(key, formData[key]);
                });
                submissionData.set('totalAmount', derivedTotal);
                submissionData.set('pendingAmount', derivedPending);
                submissionData.set('isTransportRequired', formData.isTransportRequired);

                // Files
                Object.keys(files).forEach(key => {
                    if (files[key]) submissionData.append(key, files[key]);
                });

                const result = await directEnrollStudent(submissionData);
                
                setEnrollmentResult(result);
                setIsSubmitted(true);
                toast.success("Student Enrolled Successfully!");
                window.scrollTo(0, 0);
            } catch (err) {
                toast.error(err.response?.data?.error || "Enrollment failed");
            } finally {
                setLoading(false);
            }
        }
    };

    const renderPreviewContent = () => (
        <div className="space-y-8 text-left">
            <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                <div className="col-span-2 border-b-2 border-[#001736] pb-2 mb-4">
                    <h4 className="text-sm font-black uppercase tracking-widest text-[#001736]">Enrollment Details</h4>
                </div>
                <PreviewItem label="Academic Year" value={formData.academicYear} />
                <PreviewItem label="Class Level" value={formData.grade} highlight />
                <PreviewItem label="Assigned Classroom" value={allClassrooms.find(c => c.id == formData.classroom_id)?.section || 'Auto-Assignment'} />
                <PreviewItem label="Roll Number" value={formData.roll_number || 'To Be Assigned'} />
            </div>

            <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                <div className="col-span-2 border-b-2 border-[#001736] pb-2 mb-4">
                    <h4 className="text-sm font-black uppercase tracking-widest text-[#001736]">Payment Summary</h4>
                </div>
                <PreviewItem label="Total Fees" value={`₹ ${derivedTotal.toLocaleString()}`} />
                <PreviewItem label="Amount Collected" value={`₹ ${Number(formData.paidAmount).toLocaleString()}`} highlight />
                <PreviewItem label="Balance Due" value={`₹ ${derivedPending.toLocaleString()}`} />
                <PreviewItem label="Payment via" value={formData.paymentMethod} />
            </div>

            <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                <div className="col-span-2 border-b-2 border-[#001736] pb-2 mb-4">
                    <h4 className="text-sm font-black uppercase tracking-widest text-[#001736]">Personnel Identity</h4>
                </div>
                <PreviewItem label="Full Name of Student" value={formData.studentName} full />
                <PreviewItem label="Birth Date" value={formData.dob} />
                <PreviewItem label="Gender" value={formData.gender} />
                <PreviewItem label="Religion" value={formData.religion} />
                <PreviewItem label="Caste" value={formData.caste} />
                <PreviewItem label="Sub-caste" value={formData.subcaste} />
                <PreviewItem label="Aadhar Card ID" value={formData.aadhar} />
            </div>

            <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                <div className="col-span-2 border-b-2 border-[#001736] pb-2 mb-4">
                    <h4 className="text-sm font-black uppercase tracking-widest text-[#001736]">Family Specifications</h4>
                </div>
                <PreviewItem label="Father's Full Name" value={formData.fatherName} />
                <PreviewItem label="Father's Contact" value={formData.fatherMobile} />
                <PreviewItem label="Father's Email" value={formData.fatherEmail} />
                <PreviewItem label="Father's Occupation" value={formData.fatherOccupation} />
                <PreviewItem label="Mother's Full Name" value={formData.motherName} />
                <PreviewItem label="Mother's Contact" value={formData.motherMobile} />
                <PreviewItem label="Mother Tongue" value={formData.motherTongue} />
            </div>

            <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                <div className="col-span-2 border-b-2 border-[#001736] pb-2 mb-4">
                    <h4 className="text-sm font-black uppercase tracking-widest text-[#001736]">Demographics & Background</h4>
                </div>
                <PreviewItem label="Residential Address" value={formData.residentialAddress} full />
                <PreviewItem label="Location" value={`${formData.taluka}, ${formData.district}, ${formData.state} - ${formData.pincode}`} full />
                <PreviewItem label="Previous School" value={formData.prevSchoolName} full />
                <PreviewItem label="Academic History" value={`${formData.prevClass} (${formData.prevBoard}) - ${formData.prevYear}`} />
                <PreviewItem label="Performance" value={formData.prevPercentage} />
            </div>
        </div>
    );

    if (isSubmitted && enrollmentResult) {
        return (
            <div className="max-w-4xl mx-auto bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in duration-500">
                <div className="bg-[#001736] p-12 text-center text-white relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    <div className="w-24 h-24 bg-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl">
                        <CheckCircle className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-4xl font-black uppercase tracking-tight">Enrollment Finalized</h2>
                    <p className="text-white/40 font-bold uppercase tracking-[0.3em] text-[10px] mt-2">NGA Institutional Registry</p>
                </div>
                
                <div className="p-12 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="p-8 bg-slate-50 rounded-3xl border border-slate-300 space-y-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Registration ID</p>
                            <p className="text-3xl font-black text-indigo-600 font-mono tracking-wider">{enrollmentResult.studentId}</p>
                        </div>
                        <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 space-y-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Portal Username</p>
                            <p className="text-3xl font-black text-[#001736] font-mono tracking-wider">{enrollmentResult.credentials.parent_username}</p>
                        </div>
                    </div>

                    <div className="bg-[#001736] p-10 rounded-3xl text-center space-y-8 border border-white/10 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-amber-400"></div>
                        
                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Access Synchronization Key</p>
                            <div className="flex items-center justify-center gap-8">
                                <p className="text-5xl font-black text-amber-400 font-mono tracking-[0.2em]">{enrollmentResult.credentials.password}</p>
                                <button 
                                    onClick={() => {
                                        navigator.clipboard.writeText(`User: ${enrollmentResult.credentials.parent_username}\nPass: ${enrollmentResult.credentials.password}`);
                                        toast.info("Credentials Copied");
                                    }}
                                    className="p-4 bg-white/10 rounded-2xl text-white hover:bg-white hover:text-[#001736] transition-all"
                                >
                                    <Copy className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-white/5">
                            <div className="text-left p-6 bg-white/5 rounded-2xl border border-white/5">
                                <h5 className="text-amber-400 font-black text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div> Student Registry Access
                                </h5>
                                <p className="text-[11px] text-white/70 leading-relaxed">
                                    Login with <span className="text-white font-bold">Student ID</span> and the <span className="text-white font-bold">Access Key</span> shown above.
                                </p>
                            </div>
                            <div className="text-left p-6 bg-white/5 rounded-2xl border border-white/5">
                                <h5 className="text-emerald-400 font-black text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div> Parent Portal Access
                                </h5>
                                <p className="text-[11px] text-white/70 leading-relaxed">
                                    Login using <span className="text-white font-bold">Primary Mobile Number</span> via OTP verification.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button onClick={onClose} className="flex-1 py-5 bg-[#001736] text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-black transition-all">Close Entry</button>
                        <button 
                            onClick={() => {
                                setTimeout(() => window.print(), 100);
                            }} 
                            className="px-10 py-5 border-2 border-[#001736] text-[#001736] rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-3"
                        >
                            <Printer className="w-5 h-5" /> Print Details
                        </button>
                    </div>
                </div>

                <div className="hidden print:block p-8 bg-white">
                    <PrintLayout title="Enrollment Confirmation" studentPhoto={previews.passportPhoto}>
                        <div className="space-y-8 text-left">
                            <div className="p-6 bg-slate-50 border-2 border-[#001736] rounded-2xl">
                                <h3 className="text-lg font-black uppercase tracking-tight text-[#001736] border-b pb-2 mb-4">Credentials Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-slate-400">Student ID</p>
                                        <p className="text-xl font-black">{enrollmentResult.studentId}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-slate-400">Portal Username</p>
                                        <p className="text-xl font-black">{enrollmentResult.credentials.parent_username}</p>
                                    </div>
                                    <div className="col-span-2 pt-4">
                                        <p className="text-[10px] font-black uppercase text-slate-400">Temporary Password</p>
                                        <p className="text-2xl font-black text-[#001736]">{enrollmentResult.credentials.password}</p>
                                    </div>
                                </div>
                            </div>
                            {renderPreviewContent()}
                        </div>
                    </PrintLayout>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto animate-in fade-in duration-500 relative">
            <button
                onClick={onClose}
                className="absolute -top-4 -right-4 bg-white p-3 rounded-2xl shadow-xl border border-slate-200 text-slate-400 hover:text-rose-500 hover:scale-110 transition-all z-50"
            >
                <X className="w-6 h-6" />
            </button>

            <div className="bg-[#001736] p-10 rounded-t-[3rem] text-white flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 p-2">
                        <UserPlus className="w-full h-full text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black uppercase tracking-tight">Direct Enrollment</h2>
                        <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">Staff Managed Registration Protocol</p>
                    </div>
                </div>
                <div className="text-right hidden md:block">
                    <p className="text-[10px] font-black uppercase text-white/20 tracking-widest">Current Step</p>
                    <p className="text-3xl font-black text-amber-400">{step}/7</p>
                </div>
            </div>

            <div className="bg-white p-1 pb-10 shadow-2xl rounded-b-[3.5rem] border-x border-b border-slate-100">
                {/* Progress Hub */}
                <div className="px-12 py-8 flex justify-between items-center gap-2">
                    {[1, 2, 3, 4, 5, 6, 7].map(s => (
                        <button
                            key={s}
                            type="button"
                            disabled={s > step && !checkStepValidity(step)}
                            onClick={() => setStep(s)}
                            className={`flex-1 h-2 rounded-full transition-all ${step >= s ? 'bg-[#001736]' : 'bg-slate-100'}`}
                        />
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="px-6 md:px-20 py-10">
                    {step === 1 && (
                        <div className="space-y-10 animate-in slide-in-from-right duration-500 text-left">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 rounded-[2.5rem] p-10 border border-slate-300">
                                <FormField label="Full Name of Student" name="studentName" value={formData.studentName} onChange={handleInputChange} placeholder="As per Birth Certificate" required error={errors.studentName} fullWidth />
                                <FormField label="Gender" name="gender" type="select" value={formData.gender} onChange={handleInputChange} options={['male', 'female', 'other']} required error={errors.gender} />
                                <FormField label="Birth Date" name="dob" type="date" value={formData.dob} onChange={handleInputChange} required error={errors.dob} />
                                <FormField label="Identification Number (Aadhar)" name="aadhar" value={formData.aadhar} onChange={handleInputChange} placeholder="12-digit UID" required error={errors.aadhar} />
                                <FormField label="Place of Birth" name="pob" value={formData.pob} onChange={handleInputChange} placeholder="City or Village" />
                                <FormField label="Religion" name="religion" value={formData.religion} onChange={handleInputChange} placeholder="E.g. Hindu" required error={errors.religion} />
                                <FormField label="Caste Category" name="caste" type="select" value={formData.caste} onChange={handleInputChange} options={['SC', 'ST', 'VJ', 'NT', 'SBC', 'OBC', 'OPEN']} required error={errors.caste} />
                                <FormField label="Sub-caste" name="subcaste" value={formData.subcaste} onChange={handleInputChange} placeholder="E.g. Maratha" />
                            </div>

                            <SectionHeader title="2. Family Registry" sub="Parental & Guardian Information" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white border border-slate-300 p-10 rounded-[2.5rem] shadow-sm">
                                <div className="md:col-span-2 border-b border-slate-100 pb-2 mb-2">
                                    <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">Father's Specifications</h4>
                                </div>
                                <FormField label="Father's Full Name" name="fatherName" value={formData.fatherName} onChange={handleInputChange} placeholder="Full Name" required error={errors.fatherName} />
                                <FormField label="Father's Contact Number" name="fatherMobile" value={formData.fatherMobile} onChange={handleInputChange} placeholder="10-digit Mobile" required error={errors.fatherMobile} />
                                <FormField label="Father's Email ID" name="fatherEmail" value={formData.fatherEmail} onChange={handleInputChange} placeholder="Optional Email" />
                                <FormField label="Father's Occupation" name="fatherOccupation" value={formData.fatherOccupation} onChange={handleInputChange} placeholder="Business / Job" />
                                
                                <div className="md:col-span-2 border-b border-slate-100 pb-2 mb-2 mt-4">
                                    <h4 className="text-[10px] font-black uppercase text-rose-600 tracking-widest">Mother's Specifications</h4>
                                </div>
                                <FormField label="Mother's Full Name" name="motherName" value={formData.motherName} onChange={handleInputChange} placeholder="Full Name" required error={errors.motherName} />
                                <FormField label="Mother's Contact Number" name="motherMobile" value={formData.motherMobile} onChange={handleInputChange} placeholder="10-digit Mobile" />
                                <FormField label="Mother's Occupation" name="motherOccupation" value={formData.motherOccupation} onChange={handleInputChange} placeholder="Business / Job" />
                                <FormField label="Mother Tongue" name="motherTongue" value={formData.motherTongue} onChange={handleInputChange} placeholder="Primary Language" />
                            </div>

                            <div className="flex justify-between items-center pt-8 border-t border-slate-100">
                                <button type="button" onClick={onClose} className="text-sm font-bold text-rose-500 hover:text-rose-700 transition-colors px-6 py-4 rounded-xl hover:bg-rose-50">Cancel & Return to Dashboard</button>
                                <button type="button" onClick={() => validateStep(1) && setStep(2)} className="bg-[#001736] text-white px-12 py-5 rounded-2xl font-black shadow-xl flex items-center gap-3 hover:bg-black transition-all">Save & Continue <ChevronRight className="w-5 h-5" /></button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-10 animate-in slide-in-from-right duration-500 text-left">
                            <SectionHeader title="3. School Assignment" sub="Class & Academic Year" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-10 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                                <FormField 
                                    label="Select Admission Grade" 
                                    name="grade" 
                                    type="select" 
                                    value={formData.grade} 
                                    onChange={(e) => {
                                        handleInputChange(e);
                                        setFormData(prev => ({ ...prev, classroom_id: '' })); // Reset classroom on grade change
                                    }} 
                                    options={['Nursery', 'Jr.Kg', 'Sr.Kg', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th']} 
                                    required 
                                    error={errors.grade} 
                                />
                                <FormField 
                                    label="Academic Year" 
                                    name="academicYear" 
                                    type="select" 
                                    value={formData.academicYear} 
                                    onChange={handleInputChange} 
                                    options={ACADEMIC_YEARS} 
                                    required 
                                />
                                <FormField 
                                    label="Assigned Classroom" 
                                    name="classroom_id" 
                                    type="select" 
                                    value={formData.classroom_id} 
                                    onChange={handleInputChange} 
                                    options={allClassrooms.filter(c => c.class_name === formData.grade).map(c => ({ label: `${c.class_name} - ${c.section}`, value: c.id }))} 
                                    placeholder="Auto-Assignment (Default)"
                                />
                                <FormField label="Roll Number" name="roll_number" value={formData.roll_number} onChange={handleInputChange} placeholder="Manual Override (Optional)" />
                            </div>

                            <div className="flex justify-between pt-8">
                                <button type="button" onClick={() => setStep(2)} className="font-black text-slate-400">Back</button>
                                <button type="button" onClick={() => validateStep(3) && setStep(4)} className="bg-[#001736] text-white px-10 py-5 rounded-2xl font-black">Confirm & Next</button>
                            </div>
                        </div>
                    )}

                    {/* Step 2, 4, 5, 6, 7 follow the same structural logic as AdmissionForm.jsx */}
                    {/* Simplified for the sake of length, assuming user wants the *full* form logic as well */}
                    
                    {step === 5 && (
                        <div className="space-y-10 animate-in slide-in-from-right duration-500">
                            <SectionHeader title="5. Financial Protocol" sub="Calculated Fee Structure" />
                            <div className="bg-[#001736] rounded-[2.5rem] overflow-hidden shadow-2xl">
                                <div className="p-10 border-b border-white/10 flex justify-between items-center">
                                    <h4 className="text-2xl font-black text-white">Annual billing breakdown</h4>
                                    <span className="px-4 py-2 bg-amber-400 text-[#001736] rounded-xl font-black text-xs">{formData.grade || 'NO GRADE SELECTED'}</span>
                                </div>
                                <div className="p-10 bg-white space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex justify-between font-bold">
                                            <span className="text-slate-400 uppercase text-[10px]">Tuition Fees</span>
                                            <span className="text-[#001736]">₹ {tuitionFee}</span>
                                        </div>
                                        <div className="flex justify-between font-bold">
                                            <span className="text-slate-400 uppercase text-[10px]">Other Institutional Charges</span>
                                            <span className="text-[#001736]">₹ {structure.other}</span>
                                        </div>
                                        {formData.isTransportRequired && (
                                            <div className="flex justify-between font-bold text-blue-600">
                                                <span className="uppercase text-[10px]">Transport Protocol ({formData.transportRoute})</span>
                                                <span>₹ {formData.transportFees}</span>
                                            </div>
                                        )}
                                        <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                                            <span className="text-xl font-black text-[#001736] uppercase tracking-tighter">Total Package</span>
                                            <span className="text-3xl font-black text-emerald-600">₹ {derivedTotal}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-between pt-8 border-t border-slate-100">
                                <button type="button" onClick={() => setStep(4)} className="font-black text-slate-400 hover:text-[#001736] transition-colors">Go Back</button>
                                <button type="button" onClick={() => setStep(6)} className="bg-[#001736] text-white px-10 py-5 rounded-2xl font-black shadow-xl hover:bg-black transition-all">Go to Payment Details</button>
                            </div>
                        </div>
                    )}

                    {step === 6 && (
                        <div className="space-y-10 animate-in slide-in-from-right duration-500 text-left">
                            <SectionHeader title="6. Initial Payment" sub="Record First Transaction" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start mt-8">
                        {/* Left Column: Amount Details */}
                        <div className="p-10 bg-white border-2 border-slate-100 rounded-4xl shadow-sm space-y-8">
                            <h3 className="text-2xl font-black text-[#001736] text-left">Billing Details</h3>
                            <div className="space-y-6">
                                <FormField label="Amount Paid (INR) *" name="paidAmount" type="number" value={formData.paidAmount} onChange={handleInputChange} placeholder="Enter amount paid" required error={errors.paidAmount} />
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl flex justify-between items-center group transition-colors hover:bg-white text-left">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Payable</p>
                                            <p className="text-2xl font-black text-[#001736]">₹ {derivedTotal}</p>
                                        </div>
                                        <Landmark className="w-8 h-8 text-slate-200 group-hover:text-emerald-500 transition-colors" />
                                    </div>
                                    <div className={`p-6 border rounded-2xl flex justify-between items-center transition-all text-left ${derivedPending > 0 ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
                                        <div className="space-y-1">
                                            <p className={`text-[10px] font-black uppercase tracking-widest ${derivedPending > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>Pending Balance</p>
                                            <p className={`text-2xl font-black ${derivedPending > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>₹ {derivedPending}</p>
                                        </div>
                                        {derivedPending > 0 ? <Info className="w-8 h-8 text-rose-300" /> : <CheckCircle className="w-8 h-8 text-emerald-500" />}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Payment Options */}
                        <div className="space-y-8 text-left">
                            <div className="space-y-4">
                                {[
                                    { id: 'UPI', label: 'UPI Option', icon: upiLogo, type: 'img' },
                                    { id: 'Gateway', label: 'Online / Netbanking', icon: Landmark, type: 'icon' },
                                    { id: 'Card', label: 'Card Payment', icon: visaLogo, type: 'img' },
                                    { id: 'Cash', label: 'Cash Payment', icon: Banknote, type: 'icon' },
                                ].map(method => (
                                    <div
                                        key={method.id}
                                        onClick={() => setFormData(p => ({ ...p, paymentMethod: method.id }))}
                                        className={`flex items-center gap-6 px-5 py-3 border cursor-pointer transition-all duration-300 ${formData.paymentMethod === method.id ? 'bg-slate-50 border-[#001736] shadow-lg shadow-blue-50' : 'bg-white border-slate-200 hover:border-amber-400 rounded-2xl'}`}
                                    >
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${formData.paymentMethod === method.id ? 'border-[#001736] bg-[#001736]' : 'border-slate-300'}`}>
                                            {formData.paymentMethod === method.id && <div className="w-2 h-2 rounded-full bg-white animate-in zoom-in" />}
                                        </div>
                                        <p className="flex-1 font-black text-sm text-[#001736]">{method.label}</p>
                                        <div className="w-16 h-12 rounded-xl flex items-center justify-center shrink-0">
                                            {method.type === 'img' ? (
                                                <img src={method.icon} alt={method.id} className="w-full h-auto max-h-10 object-contain" />
                                            ) : (
                                                <method.icon className={`w-8 h-8 transition-colors ${formData.paymentMethod === method.id ? 'text-[#001736]' : 'text-slate-200'}`} />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                            <div className="flex justify-between pt-8 border-t border-slate-100">
                                <button type="button" onClick={() => setStep(5)} className="font-black text-slate-400 hover:text-[#001736] transition-colors">Go Back</button>
                                <button type="button" onClick={() => validateStep(6) && setStep(7)} className="bg-[#001736] text-white px-10 py-5 rounded-2xl font-black shadow-xl hover:bg-black transition-all">Review & Submit</button>
                            </div>
                        </div>
                    )}

                    {step === 7 && (
                        <div className="space-y-10 animate-in slide-in-from-right duration-500">
                            <SectionHeader title="7. Protocol Finalization" sub="Audit & Synchronization" />
                            <div className="border border-slate-100 rounded-[3rem] p-8 bg-white shadow-xl">
                                {renderPreviewContent()}
                            </div>
                            <div className="flex justify-between pt-8">
                                <button type="button" onClick={() => setStep(6)} className="font-black text-slate-400">Back</button>
                                <button 
                                    type="button"
                                    disabled={loading}
                                    onClick={handleSubmit} 
                                    className="bg-emerald-600 text-white px-16 py-6 rounded-2xl font-black text-xl shadow-2xl flex items-center gap-4 hover:scale-105 transition-all"
                                >
                                    {loading ? 'Processing Registry...' : 'Finalize Enrollment'} <Zap className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Logic for Steps 2 & 4 (Address/Docs) - similar to AdmissionForm */}
                    {step === 2 && (
                        <div className="space-y-10 animate-in slide-in-from-right duration-500 text-left">
                            <SectionHeader title="2. Demographics & Context" sub="Location & Academic History" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 p-10 rounded-[2.5rem] border border-slate-300">
                                <FormField label="Residential Address" name="residentialAddress" value={formData.residentialAddress} onChange={handleInputChange} placeholder="Street, Building, Flat" fullWidth required />
                                <FormField label="Pincode" name="pincode" value={formData.pincode} onChange={handleInputChange} placeholder="6 digits" required error={errors.pincode} />
                                <FormField label="Taluka" name="taluka" value={formData.taluka} onChange={handleInputChange} placeholder="Taluka" />
                                <FormField label="District" name="district" value={formData.district} onChange={handleInputChange} placeholder="District" />
                                <FormField label="State" name="state" value={formData.state} onChange={handleInputChange} placeholder="State" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white border border-slate-300 p-10 rounded-[2.5rem] shadow-sm">
                                <FormField label="Previous School Name" name="prevSchoolName" value={formData.prevSchoolName} onChange={handleInputChange} placeholder="Exited Institution" fullWidth required />
                                <FormField label="Last Class Attended" name="prevClass" value={formData.prevClass} onChange={handleInputChange} placeholder="Class Grade" />
                                <FormField label="Education Board" name="prevBoard" value={formData.prevBoard} onChange={handleInputChange} placeholder="CBSE / State / ICSE" />
                                <FormField label="Passing Year" name="prevYear" value={formData.prevYear} onChange={handleInputChange} placeholder="Year" />
                                <FormField label="Percentage / Grade" name="prevPercentage" value={formData.prevPercentage} onChange={handleInputChange} placeholder="Last Score" />
                            </div>

                            <SectionHeader title="3. Logistics & Services" sub="Transportation Protocol" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 border border-slate-300 p-10 rounded-[2.5rem]">
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-bold text-black ml-1">Transport Required? *</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['Yes', 'No'].map(opt => (
                                            <button
                                                key={opt}
                                                type="button"
                                                onClick={() => {
                                                    const isReq = opt === 'Yes';
                                                    setFormData(p => ({
                                                        ...p,
                                                        isTransportRequired: isReq,
                                                        transportFees: isReq ? p.transportFees || 13000 : 0,
                                                        transportRoute: isReq ? p.transportRoute || '0-5 km' : ''
                                                    }));
                                                }}
                                                className={`py-3 rounded-xl font-black border-2 transition-all text-xs h-[50px] ${formData.isTransportRequired === (opt === 'Yes') ? 'bg-[#001736] text-white border-[#001736]' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {formData.isTransportRequired && (
                                    <div className="flex flex-col gap-1 animate-in fade-in duration-300">
                                        <label className="text-xs font-bold text-black ml-1">Distance *</label>
                                        <select
                                            name="transportRoute"
                                            value={formData.transportRoute}
                                            onChange={(e) => {
                                                const route = e.target.value;
                                                let fees = 13000;
                                                if (route === '5-7 km') fees = 14000;
                                                if (route === 'Above 7 km') fees = 15000;
                                                setFormData(p => ({ ...p, transportRoute: route, transportFees: fees }));
                                            }}
                                            className="w-full px-6 py-3.5 bg-white border-2 border-slate-200 rounded-xl outline-none focus:border-black font-bold h-[50px]"
                                        >
                                            <option value="0-5 km">0-5 km (₹13,000)</option>
                                            <option value="5-7 km">5-7 km (₹14,000)</option>
                                            <option value="Above 7 km">Above 7 km (₹15,000)</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-between pt-8">
                                <button type="button" onClick={() => setStep(1)} className="font-black text-slate-400 hover:text-[#001736] transition-colors">Go Back</button>
                                <button type="button" onClick={() => setStep(3)} className="bg-[#001736] text-white px-10 py-5 rounded-2xl font-black shadow-xl hover:bg-black transition-all">Continue Enrollment</button>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-10 animate-in slide-in-from-right duration-500 text-left">
                            <SectionHeader title="4. Evidence Registry" sub="Document Digitization" />
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <DocUpload label="Passport Photo" field="passportPhoto" preview={previews.passportPhoto} onChange={handleFileChange} />
                                <DocUpload label="Birth Certificate" field="birthCert" file={files.birthCert} onChange={handleFileChange} />
                                <DocUpload label="Aadhar ID Copy" field="aadharCopy" file={files.aadharCopy} onChange={handleFileChange} />
                                <DocUpload label="Leaving Certificate" field="leavingCert" file={files.leavingCert} onChange={handleFileChange} />
                                <DocUpload label="Caste Certificate" field="casteCert" file={files.casteCert} onChange={handleFileChange} />
                            </div>
                            <div className="flex justify-between pt-8 border-t border-slate-100">
                                <button type="button" onClick={() => setStep(3)} className="font-black text-slate-400 hover:text-[#001736] transition-colors">Go Back</button>
                                <button type="button" onClick={() => setStep(5)} className="bg-[#001736] text-white px-10 py-5 rounded-2xl font-black shadow-xl hover:bg-black transition-all">Next: Fees & Payment</button>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

// Sub-components
const SectionHeader = ({ title, sub }) => (
    <div className="space-y-1">
        <h3 className="text-2xl font-bold text-[#001736] uppercase tracking-tight">{title}</h3>
        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.3em]">{sub}</p>
    </div>
);

const FormField = ({ label, name, type = "text", value, onChange, placeholder, required, options, fullWidth, error }) => (
    <div className={`flex flex-col gap-2 ${fullWidth ? 'md:col-span-2' : ''}`}>
        <label className="text-[11px] font-medium text-[#001736] uppercase tracking-widest flex items-center gap-2">
            {label} {required && <span className="text-red-500 font-bold">*</span>}
            {error && <span className="text-rose-500 normal-case font-bold">{error}</span>}
        </label>
        {type === 'select' ? (
            <select name={name} value={value} onChange={onChange} className="w-full px-6 py-4 bg-white border-2 border-slate-300 rounded-2xl outline-none focus:border-[#001736] font-bold text-sm shadow-sm transition-all appearance-none">
                <option value="">{placeholder || `Select ${label}`}</option>
                {options.map(opt => (
                    typeof opt === 'string' 
                    ? <option key={opt} value={opt}>{opt}</option>
                    : <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        ) : (
            <input 
                type={type} 
                name={name} 
                value={value} 
                onChange={onChange} 
                placeholder={placeholder} 
                className="w-full px-6 py-4 bg-white border-2 border-slate-300 rounded-2xl outline-none focus:border-[#001736] font-bold text-sm shadow-sm transition-all"
            />
        )}
    </div>
);

const DocUpload = ({ label, field, preview, file, onChange }) => (
    <div className="p-6 bg-slate-50 border-2 border-slate-300 rounded-4xl flex flex-col items-center gap-6 group hover:border-[#001736] transition-all">
        <p className="text-[9px] font-medium uppercase text-[#001736] tracking-[0.2em]">{label}</p>
        <div className="w-24 h-32 bg-white rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden shadow-inner group-hover:border-[#001736]/20">
            {preview ? <img src={preview} className="w-full h-full object-cover" /> : file ? <CheckCircle className="w-10 h-10 text-emerald-500" /> : <Upload className="w-8 h-8 text-slate-200" />}
        </div>
        <label className="w-full">
            <div className="bg-[#001736] text-white py-3 rounded-xl text-[10px] font-black uppercase text-center cursor-pointer hover:bg-black transition-all">Choose File</div>
            <input type="file" className="hidden" onChange={(e) => onChange(e, field)} />
        </label>
        {file && <p className="text-[8px] font-bold text-slate-400 truncate w-full text-center">{file.name}</p>}
    </div>
);

const PreviewItem = ({ label, value, full, highlight }) => (
    <div className={`${full ? 'col-span-2' : ''} space-y-1.5`}>
        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{label}</p>
        <p className={`text-base font-bold ${highlight ? 'text-indigo-600' : 'text-[#001736]'}`}>{value || '---'}</p>
    </div>
);

export default EnrollNewStudent;
