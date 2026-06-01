import React, { useState } from 'react';
import {
    User, Mail, Phone, MapPin, Briefcase, GraduationCap,
    Calendar, Upload, CheckCircle, X, ChevronRight, ChevronLeft,
    Info, Landmark, ShieldCheck, FileText, Camera, Plus
} from "lucide-react";
import { toast } from 'react-toastify';
import { onboardStaff, updateStaff } from '../../services/staffAPI';
import { useEffect } from 'react';

const StafOnboardingForm = ({ onClose, onRefresh, academicYear, isEdit, initialData }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({
        fullName: '',
        gender: 'Male',
        dob: '',
        mobile: '',
        alternateMobile: '',
        email: '',
        address: '',
        qualification: '',
        specialization: '',
        experience: '',
        previousSchool: '',
        joiningDate: new Date().toISOString().split('T')[0],
        employmentType: 'Full-time',
        salary: '',
        role: 'teacher',
        staffType: 'teaching',
        grade: '',
        subjects: '',
        bankName: '',
        accountNo: '',
        ifscCode: '',
        status: 'active',
        remarks: '',
        academicYear: academicYear || '2026-27'
    });

    useEffect(() => {
        if (isEdit && initialData) {
            const assignment = initialData.assignments?.[0] || {};
            setFormData({
                fullName: initialData.full_name || '',
                gender: initialData.gender ? initialData.gender.charAt(0).toUpperCase() + initialData.gender.slice(1) : 'Male',
                dob: initialData.dob ? initialData.dob.split('T')[0] : '',
                mobile: initialData.mobile || '',
                alternateMobile: initialData.alternate_mobile || '',
                email: initialData.email || '',
                address: initialData.address || '',
                qualification: initialData.qualification || '',
                specialization: initialData.specialization || '',
                experience: initialData.experience || '',
                previousSchool: initialData.previous_school || '',
                joiningDate: initialData.joining_date ? initialData.joining_date.split('T')[0] : new Date().toISOString().split('T')[0],
                employmentType: initialData.employment_type || 'Full-time',
                salary: initialData.salary || '',
                role: initialData.role || 'teacher',
                staffType: initialData.staff_type || 'teaching',
                grade: assignment.grade || '',
                subjects: assignment.subjects || '',
                bankName: initialData.bank_name || '',
                accountNo: initialData.account_no || '',
                ifscCode: initialData.ifsc_code || '',
                status: initialData.status || 'active',
                remarks: initialData.remarks || '',
                academicYear: initialData.academicYear || academicYear || '2026-27'
            });
        }
    }, [isEdit, initialData, academicYear]);

    const [files, setFiles] = useState({
        photo: null,
        aadhar: null,
        qualCerts: null,
        expLetter: null,
        resume: null
    });

    const validateField = (name, value) => {
        let error = '';
        switch (name) {
            case 'fullName':
                if (value.length < 3) error = 'Name must be at least 3 characters';
                break;
            case 'mobile':
                if (!/^\d{10}$/.test(value)) error = 'Enter a valid 10-digit mobile number';
                break;
            case 'alternateMobile':
                if (value && !/^\d{10}$/.test(value)) error = 'Enter a valid 10-digit mobile number';
                break;
            case 'email':
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Enter a valid email address';
                break;
            case 'dob':
                if (value) {
                    const birthDate = new Date(value);
                    const today = new Date();
                    let age = today.getFullYear() - birthDate.getFullYear();
                    const m = today.getMonth() - birthDate.getMonth();
                    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
                    if (age < 18) error = 'Staff must be at least 18 years old';
                }
                break;
            case 'experience':
                if (value && value < 0) error = 'Experience cannot be negative';
                break;
            case 'salary':
                if (value && value < 0) error = 'Salary cannot be negative';
                break;
            case 'accountNo':
                if (value && (value.length < 9 || isNaN(value))) error = 'Enter a valid account number (min 9 digits)';
                break;
            case 'ifscCode':
                if (value && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(value)) error = 'Invalid IFSC format (e.g. HDFC0001234)';
                break;
            default:
                break;
        }
        return error;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const next = { ...prev, [name]: value };
            if (name === 'role') {
                next.staffType = (value === 'teacher') ? 'teaching' : 'non-teaching';
            }
            return next;
        });

        const error = validateField(name, value);
        setErrors(prev => ({ ...prev, [name]: error }));
    };

    const handleFileChange = (e, field) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                toast.error("File size should be less than 10MB");
                return;
            }
            setFiles(prev => ({ ...prev, [field]: file }));
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const nextStep = () => {
        let stepErrors = {};
        if (step === 1) {
            const required = ['fullName', 'gender', 'dob', 'mobile', 'email', 'address'];
            required.forEach(f => {
                if (!formData[f]) stepErrors[f] = 'This field is required';
                const err = validateField(f, formData[f]);
                if (err) stepErrors[f] = err;
            });
        }
        if (step === 2) {
            const required = ['qualification', 'experience', 'joiningDate', 'employmentType'];
            required.forEach(f => {
                if (!formData[f]) stepErrors[f] = 'This field is required';
                const err = validateField(f, formData[f]);
                if (err) stepErrors[f] = err;
            });
        }
        if (step === 3 && !isEdit) {
            if (!files.photo) stepErrors.photo = 'Profile photo is required';
            if (!files.aadhar) stepErrors.aadhar = 'Aadhar card is required';
            if (!files.qualCerts) stepErrors.qualCerts = 'Certificates are required';
        }

        if (Object.keys(stepErrors).length > 0) {
            setErrors(prev => ({ ...prev, ...stepErrors }));
            toast.warning("Please correct the errors before proceeding");
            return;
        }

        setStep(s => s + 1);
    };

    const prevStep = () => setStep(s => s - 1);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Final Validation
        let finalErrors = {};
        const required = ['fullName', 'mobile', 'email', 'qualification', 'experience', 'joiningDate'];
        required.forEach(f => {
            if (!formData[f]) finalErrors[f] = 'Required';
            const err = validateField(f, formData[f]);
            if (err) finalErrors[f] = err;
        });

        if (!isEdit && (!files.photo || !files.aadhar || !files.qualCerts)) {
            finalErrors.photo = !files.photo ? 'Required' : '';
            finalErrors.aadhar = !files.aadhar ? 'Required' : '';
            finalErrors.qualCerts = !files.qualCerts ? 'Required' : '';
        }

        if (Object.values(finalErrors).some(e => e)) {
            setErrors(prev => ({ ...prev, ...finalErrors }));
            toast.warning("Please fix all validation errors");
            return;
        }

        setLoading(true);
        try {
            const submission = new FormData();
            Object.keys(formData).forEach(key => submission.append(key, formData[key]));
            Object.keys(files).forEach(key => {
                if (files[key]) submission.append(key, files[key]);
            });

            if (isEdit) {
                await updateStaff(initialData.id, submission);
                toast.success("Staff details updated successfully");
            } else {
                const result = await onboardStaff(submission);
                toast.success(`Staff Onboarded! Password: ${result.credentials.password}`, {
                    autoClose: 15000,
                    position: "top-center"
                });
            }
            if (onRefresh) onRefresh();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.error || (isEdit ? "Update failed" : "Onboarding failed"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white shadow-none border-2 border-slate-200 w-full h-full flex flex-col overflow-hidden rounded-none z-50">
            {/* Navigation & Title */}
            <div className="px-10 py-6 flex justify-between items-center border-b-2 border-slate-200 bg-slate-50/50">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-3 bg-white border-2 border-slate-200 text-black rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest shadow-sm">
                        <ChevronLeft className="w-4 h-4" /> Go Back
                    </button>
                    <div className="h-8 w-px bg-slate-300 mx-2"></div>
                    <div>
                        <h2 className="text-xl font-black text-black uppercase tracking-tight">Staff {isEdit ? 'Update' : 'Onboarding'}</h2>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Step {step} of 4 • Registration Registry</p>
                    </div>
                </div>
                <div className="w-12 h-12 bg-amber-400 flex items-center justify-center shadow-lg shadow-amber-400/20 rounded-xl">
                    <Plus className="w-6 h-6 text-black" strokeWidth={3} />
                </div>
            </div>

            {/* Stepper Indicator */}
            <div className="bg-white px-12 py-5 border-b border-slate-200 flex justify-between shrink-0">
                {[1, 2, 3, 4].map(s => (
                    <div key={s} className="flex items-center gap-3">
                        <div className={`w-9 h-9 border-2 font-black text-xs flex items-center justify-center transition-all ${step >= s ? 'bg-black border-black text-white shadow-lg' : 'bg-white border-slate-200 text-slate-300'}`}>
                            {step > s ? <CheckCircle className="w-5 h-5" /> : s}
                        </div>
                        <p className={`text-[10px] font-black uppercase tracking-widest hidden md:block ${step === s ? 'text-black' : 'text-slate-400'}`}>
                            {s === 1 ? 'Personal' : s === 2 ? 'Professional' : s === 3 ? 'Documents' : 'Finalize'}
                        </p>
                    </div>
                ))}
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-12 scrollbar-hide">
                {step === 1 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                        <SectionHeader icon={User} title="Personal Details" sub="Mandatory Identification Information" />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <InputField label="Full Name" name="fullName" value={formData.fullName} onChange={handleInputChange} required placeholder="Rahul Sharma" error={errors.fullName} />
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Gender *</label>
                                <select name="gender" value={formData.gender} onChange={handleInputChange} className={`w-full bg-slate-50 border-2 ${errors.gender ? 'border-rose-500' : 'border-slate-100'} px-5 py-3.5 rounded-2xl text-xs font-bold outline-none focus:border-indigo-500 transition-all`}>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                                {errors.gender && <p className="text-[9px] font-bold text-rose-500 ml-1 uppercase">{errors.gender}</p>}
                            </div>
                            <InputField label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleInputChange} required error={errors.dob} />
                            <InputField label="Mobile Number" name="mobile" value={formData.mobile} onChange={handleInputChange} required placeholder="9876543210" error={errors.mobile} />
                            <InputField label="Alternate Mobile" name="alternateMobile" value={formData.alternateMobile} onChange={handleInputChange} placeholder="Optional" error={errors.alternateMobile} />
                            <InputField label="Email Address" name="email" type="email" value={formData.email} onChange={handleInputChange} required placeholder="rahul@gmail.com" error={errors.email} />
                            <div className="md:col-span-2 lg:col-span-3">
                                <InputField label="Residential Address" name="address" value={formData.address} onChange={handleInputChange} required isTextarea placeholder="Full home address" error={errors.address} />
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                        <SectionHeader icon={GraduationCap} title="Professional Profile" sub="Experience & Career Background" />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <InputField label="Qualification" name="qualification" value={formData.qualification} onChange={handleInputChange} required placeholder="e.g. B.Ed, M.Sc" error={errors.qualification} />
                            <InputField label="Specialization" name="specialization" value={formData.specialization} onChange={handleInputChange} placeholder="e.g. Mathematics" error={errors.specialization} />
                            <InputField label="Experience (Years)" name="experience" type="number" value={formData.experience} onChange={handleInputChange} required error={errors.experience} />
                            <InputField label="Previous School" name="previousSchool" value={formData.previousSchool} onChange={handleInputChange} error={errors.previousSchool} />
                            <InputField label="Joining Date" name="joiningDate" type="date" value={formData.joiningDate} onChange={handleInputChange} required error={errors.joiningDate} />
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Employment Type *</label>
                                <select name="employmentType" value={formData.employmentType} onChange={handleInputChange} className="w-full bg-slate-50 border-2 border-slate-100 px-5 py-3.5 rounded-2xl text-xs font-bold outline-none focus:border-indigo-500 transition-all">
                                    <option value="Full-time">Full-time</option>
                                    <option value="Part-time">Part-time</option>
                                </select>
                            </div>
                            <InputField label="Monthly Salary (Optional)" name="salary" type="number" value={formData.salary} onChange={handleInputChange} error={errors.salary} />
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Role *</label>
                                <select name="role" value={formData.role} onChange={handleInputChange} className="w-full bg-slate-50 border-2 border-slate-100 px-5 py-3.5 rounded-2xl text-xs font-bold outline-none focus:border-indigo-500 transition-all">
                                    <option value="teacher">Teacher</option>
                                    <option value="principle">Principle</option>
                                    <option value="accountant">Accountant</option>
                                    <option value="HR">HR</option>
                                </select>
                            </div>
                        </div>

                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                        <SectionHeader icon={Upload} title="Documents Upload" sub="Verification Proofs & Certifications" />
                        <div className="p-6 bg-amber-50 rounded-4xl border border-amber-100/50 flex gap-4 text-amber-700">
                            <Info className="w-5 h-5 shrink-0" />
                            <p className="text-[10px] font-bold leading-relaxed uppercase tracking-wider">Please ensure documents are clear and readable. Allowed: JPG, PNG, PDF (Max 10MB each).</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FilePicker label="Profile Photo *" icon={Camera} file={files.photo} onChange={(e) => handleFileChange(e, 'photo')} error={errors.photo} />
                            <FilePicker label="Aadhar Card *" icon={ShieldCheck} file={files.aadhar} onChange={(e) => handleFileChange(e, 'aadhar')} error={errors.aadhar} />
                            <FilePicker label="Qualification Certificates *" icon={GraduationCap} file={files.qualCerts} onChange={(e) => handleFileChange(e, 'qualCerts')} error={errors.qualCerts} />
                            <FilePicker label="Experience Letter" icon={Briefcase} file={files.expLetter} onChange={(e) => handleFileChange(e, 'expLetter')} error={errors.expLetter} />
                            <FilePicker label="Resume / CV" icon={FileText} file={files.resume} onChange={(e) => handleFileChange(e, 'resume')} error={errors.resume} />
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                        <SectionHeader icon={Landmark} title="Finalize Registration" sub="Bank Details & Account Status" />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <InputField label="Bank Name" name="bankName" value={formData.bankName} onChange={handleInputChange} placeholder="e.g. HDFC Bank" error={errors.bankName} />
                            <InputField label="Account Number" name="accountNo" value={formData.accountNo} onChange={handleInputChange} placeholder="1234xxxx9012" error={errors.accountNo} />
                            <InputField label="IFSC Code" name="ifscCode" value={formData.ifscCode} onChange={handleInputChange} placeholder="HDFC0001234" error={errors.ifscCode} />
                        </div>
                        <div className="space-y-6 pt-6 border-t border-slate-200">
                            <div className="flex items-center gap-4">
                                <div className="space-y-2 shrink-0 w-48">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Account Status *</label>
                                    <select name="status" value={formData.status} onChange={handleInputChange} className="w-full bg-slate-50 border-2 border-slate-300 px-5 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest text-emerald-600 outline-none focus:border-indigo-500 transition-all">
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <InputField label="Remarks / Internal Notes" name="remarks" value={formData.remarks} onChange={handleInputChange} isTextarea placeholder="Any additional notes..." />
                                </div>
                            </div>

                            {/* <div className="p-8 bg-[#001736] rounded-4xl text-white flex items-center justify-between shadow-xl shadow-slate-200">
                                <div>
                                    <h4 className="text-sm font-black flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-emerald-400" /> Auto-Generated Login
                                    </h4>
                                    <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider mt-1">Username will be set to: {formData.email || formData.mobile || '---'}</p>
                                </div>
                                <div className="bg-white/10 px-6 py-3 rounded-2xl border border-white/5">
                                    <p className="text-[8px] font-black uppercase tracking-[0.3em] text-white/30">Secure Password</p>
                                    <p className="text-xs font-black tracking-widest mt-0.5">GENERATED ON SUBMIT</p>
                                </div>
                            </div> */}
                        </div>
                    </div>
                )}
            </form>

            {/* Footer Actions */}
            <div className="p-8 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
                {step > 1 ? (
                    <button onClick={prevStep} className="px-8 py-4 bg-white border-2 border-slate-200 text-black rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-sm hover:bg-slate-50 transition-all">
                        <ChevronLeft className="w-4 h-4" /> Previous
                    </button>
                ) : (
                    <div />
                )}

                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="px-6 py-4 text-slate-400 hover:text-rose-500 font-bold text-xs uppercase tracking-widest transition-colors">
                        Cancel
                    </button>
                    {step < 4 ? (
                        <button onClick={nextStep} className="px-10 py-4 bg-[#001736] text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-slate-300 hover:scale-105 active:scale-95 transition-all">
                            Next Stage <ChevronRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="px-12 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-emerald-200 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : (
                                <>
                                    {isEdit ? 'Update Staff Details' : 'Complete Onboarding'} <CheckCircle className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// Internal Components
const SectionHeader = (props) => {
    const { icon: SectionIcon, title, sub } = props;
    return (
        <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-700">
                <SectionIcon className="w-5 h-5" />
            </div>
            <div>
                <h3 className="text-sm font-black text-black uppercase tracking-wider">{title}</h3>
                <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest">{sub}</p>
            </div>
        </div>
    );
};

const InputField = ({ label, name, type = "text", value, onChange, placeholder, required = false, isTextarea = false, error }) => (
    <div className="space-y-2">
        <label className={`text-[10px] font-black uppercase tracking-widest ${error ? 'text-rose-500' : 'text-slate-400'} ml-1`}>
            {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {isTextarea ? (
            <textarea
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                rows={3}
                className={`w-full bg-slate-50 border-2 ${error ? 'border-rose-500 bg-rose-50/10' : 'border-slate-200'} px-5 py-3.5 rounded-2xl text-xs font-bold text-black outline-none focus:border-amber-400 focus:bg-white transition-all placeholder:text-slate-400 resize-none`}
            />
        ) : (
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={`w-full bg-slate-50 border-2 ${error ? 'border-rose-500 bg-rose-50/10' : 'border-slate-200'} px-5 py-3.5 rounded-2xl text-xs font-bold text-black outline-none focus:border-amber-400 focus:bg-white transition-all placeholder:text-slate-400`}
            />
        )}
        {error && <p className="text-[9px] font-bold text-rose-500 ml-1 uppercase transition-all animate-in fade-in slide-in-from-top-1">{error}</p>}
    </div>
);

const FilePicker = (props) => {
    const { label, icon: FileIcon, file, onChange, error } = props;
    return (
        <div className="space-y-2">
            <label className={`text-[10px] font-black uppercase tracking-widest ${error ? 'text-rose-500' : 'text-slate-400'} ml-1`}>{label}</label>
            <div className="relative group overflow-hidden">
                <input type="file" onChange={onChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                <div className={`w-full px-6 py-5 rounded-3xl border-2 border-dashed transition-all flex items-center justify-between ${error ? 'bg-rose-50 border-rose-300' : (file ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-200 group-hover:border-indigo-400 group-hover:bg-slate-100')}`}>
                    <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${error ? 'bg-rose-100 text-rose-500' : (file ? 'bg-indigo-200 text-indigo-600' : 'bg-white text-slate-300')}`}>
                            <FileIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <p className={`text-[10px] font-black uppercase tracking-widest ${error ? 'text-rose-500' : (file ? 'text-indigo-600' : 'text-slate-400')}`}>
                                {file ? file.name.slice(0, 20) + '...' : (error ? 'UPLOAD REQUIRED' : 'Choose File')}
                            </p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{file ? (file.size / 1024 / 1024).toFixed(2) + ' MB' : 'Max 10MB'}</p>
                        </div>
                    </div>
                    {file ? <CheckCircle className="w-5 h-5 text-indigo-500" /> : <Upload className={`w-5 h-5 ${error ? 'text-rose-400' : 'text-slate-300'}`} />}
                </div>
            </div>
            {error && <p className="text-[9px] font-bold text-rose-500 ml-1 uppercase">{error}</p>}
        </div>
    );
};

export default StafOnboardingForm;
