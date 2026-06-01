import React, { useState, useEffect } from 'react';
import {
    User, Briefcase, GraduationCap,
    Upload, CheckCircle, ChevronRight, ChevronLeft,
    Info, Landmark, ShieldCheck, FileText, Camera, Plus, Loader2,
    Trash2, CreditCard, Mail, Phone, MapPin, Truck, FileBadge, FileCheck, Eye
} from "lucide-react";
import { toast } from 'react-toastify';
import { ROOT_URL } from '../../services/API';
import { onboardStaff, updateStaff } from '../../services/staffAPI';
import { getAllRoles } from '../../services/roleAPI';

// Staff-irrelevant roles to exclude from the dropdown
const EXCLUDED_ROLES = ['student', 'parent', 'admin'];

const StafOnboardingForm = ({ onClose, onRefresh, academicYear, isEdit, initialData, defaultRole }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [roles, setRoles] = useState([]);
    const [rolesLoading, setRolesLoading] = useState(true);
    const [rolesError, setRolesError] = useState(false);
    const [successData, setSuccessData] = useState(null);

    const [formData, setFormData] = useState({
        universalNumber: '',
        fullName: '',
        gender: 'Male',
        dob: '',
        mobile: '',
        emergencyContact: '',
        alternateMobile: '',
        email: '',
        aadharNo: '',
        panNo: '',
        address: '',
        qualification: '',
        specialization: '',
        experience: '',
        previousSchools: [{ schoolName: '', fromDate: '', toDate: '' }],
        joiningDate: new Date().toISOString().split('T')[0],
        employmentType: 'Full-time',
        salary: '',
        role: defaultRole || 'teacher',
        staffType: 'teaching',
        grade: '',
        subjects: '',
        bankName: '',
        accountNo: '',
        ifscCode: '',
        academicYear: academicYear || '2026-27'
    });

    const [files, setFiles] = useState({
        photo: null,
        aadhar: null,
        pan: null,
        addressProof: null,
        bankPassbook: null,
        qualCerts: null,
        expLetter: null,
        resume: null,
        drivingLicense: null,
        rcBook: null,
        insurance: null,
        fitnessCert: null,
        medicalCert: null
    });

    // ── Fetch roles from DB ──────────────────────────────────────────────────
    useEffect(() => {
        const fetchRoles = async () => {
            try {
                setRolesLoading(true);
                setRolesError(false);
                const data = await getAllRoles();

                // 1. Initial cleaning (exclude students/parents/admins)
                const cleaned = (data || []).filter(
                    r => !EXCLUDED_ROLES.includes(r.role_name.toLowerCase())
                );

                // 2. Category-based filtering
                let filtered = cleaned;
                const dRole = (defaultRole || 'teacher').toLowerCase();

                if (dRole === 'teacher') {
                    // Teaching & Academic Administration
                    const academic = ['teacher', 'principal', 'librarian', 'accountant', 'hr', 'counsellor'];
                    filtered = cleaned.filter(r => academic.includes(r.role_name.toLowerCase()));
                } else if (dRole === 'aunty') {
                    // Support Staff Group
                    const support = ['aunty', 'canteen', 'security gaurd'];
                    filtered = cleaned.filter(r => support.includes(r.role_name.toLowerCase()));
                } else if (dRole === 'driver') {
                    // Driver Group
                    const driver = ['bus driver'];
                    filtered = cleaned.filter(r => driver.includes(r.role_name.toLowerCase()));
                }

                setRoles(filtered);

                // Set initial form role to the first filtered option if available
                if (filtered.length > 0) {
                    const currentRole = (formData.role || '').toLowerCase();
                    const isValid = filtered.some(r => r.role_name.toLowerCase() === currentRole);
                    
                    if (!isValid) {
                        setFormData(prev => ({ ...prev, role: filtered[0].role_name }));
                    }
                }
            } catch {
                setRolesError(true);
                toast.error('Could not load roles from server');
            } finally {
                setRolesLoading(false);
            }
        };
        fetchRoles();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [defaultRole]);

    // ── Pre-fill form in edit mode ───────────────────────────────────────────
    useEffect(() => {
        if (isEdit && initialData) {
            const assignment = initialData.assignments?.[0] || {};
            let prevSchools = [{ schoolName: '', fromDate: '', toDate: '' }];
            try {
                if (initialData.previous_schools) {
                    prevSchools = JSON.parse(initialData.previous_schools);
                } else if (initialData.previous_school) {
                    prevSchools = [{ schoolName: initialData.previous_school, fromDate: '', toDate: '' }];
                }
            } catch (e) {
                console.error("Failed to parse previous schools", e);
            }

            setFormData({
                universalNumber: initialData.universal_number || '',
                fullName: initialData.full_name || '',
                gender: initialData.gender ? initialData.gender.charAt(0).toUpperCase() + initialData.gender.slice(1) : 'Male',
                dob: initialData.dob ? initialData.dob.split('T')[0] : '',
                mobile: initialData.mobile || '',
                emergencyContact: initialData.emergency_contact || '',
                alternateMobile: initialData.alternate_mobile || '',
                email: initialData.email || '',
                aadharNo: initialData.aadhar_no || '',
                panNo: initialData.pan_no || '',
                address: initialData.address || '',
                qualification: initialData.qualification || '',
                specialization: initialData.specialization || '',
                experience: initialData.experience || '',
                previousSchools: prevSchools,
                joiningDate: initialData.joining_date ? initialData.joining_date.split('T')[0] : new Date().toISOString().split('T')[0],
                employmentType: initialData.employment_type || 'Full-time',
                salary: initialData.salary || '',
                role: initialData.role_name || initialData.role || 'teacher',
                staffType: initialData.staff_type || 'teaching',
                grade: assignment.grade || '',
                subjects: assignment.subjects || '',
                bankName: initialData.bank_name || '',
                accountNo: initialData.account_no || '',
                ifscCode: initialData.ifsc_code || '',
                academicYear: initialData.academicYear || academicYear || '2026-27'
            });
        }
    }, [isEdit, initialData, academicYear]);

    const validateField = (name, value) => {
        let error = '';
        switch (name) {
            case 'fullName':
                if (!value) error = 'Full Name is required';
                else if (value.length < 3) error = 'Name must be at least 3 characters';
                break;
            case 'mobile':
                if (!value) error = 'Mobile Number is required';
                else if (!/^\d{10}$/.test(value)) error = 'Must be exactly 10 digits';
                break;
            case 'emergencyContact':
                if (value && !/^\d{10}$/.test(value)) error = 'Must be exactly 10 digits';
                break;
            case 'aadharNo':
                if (value && !/^\d{12}$/.test(value)) error = 'Must be exactly 12 digits';
                break;
            case 'panNo':
                if (value && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value)) error = 'Invalid PAN format (ABCDE1234F)';
                break;
            case 'email':
                if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Invalid email address';
                break;
            case 'dob':
                if (!value) error = 'Date of Birth is required';
                break;
            case 'qualification':
                if (['driver', 'support staff', 'aunty'].includes(formData.role.toLowerCase())) return '';
                if (!value) error = 'Qualification is required';
                break;
            case 'joiningDate':
                if (!value) error = 'Joining Date is required';
                break;
            default:
                break;
        }
        return error;
    };

    const handleInputChange = (e) => {
        let { name, value } = e.target;

        if (['fullName', 'specialization', 'bankName', 'qualification'].includes(name)) {
            value = value.replace(/[^a-zA-Z\s]/g, '');
        } else if (['mobile', 'alternateMobile', 'emergencyContact', 'accountNo', 'aadharNo'].includes(name)) {
            value = value.replace(/\D/g, '');
        }

        setFormData(prev => {
            const next = { ...prev, [name]: value };
            if (name === 'role') {
                const r = value.toLowerCase();
                next.staffType = (['teacher', 'principal', 'headmaster'].includes(r)) ? 'teaching' : 'non-teaching';
            }
            return next;
        });

        const error = validateField(name, value);
        setErrors(prev => ({ ...prev, [name]: error }));
    };

    const handleFileChange = (e, field) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 300 * 1024) { 
                toast.error("File size should be less than 300KB");
                return;
            }
            setFiles(prev => ({ ...prev, [field]: file }));
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleSchoolChange = (index, field, value) => {
        const newSchools = [...formData.previousSchools];
        newSchools[index][field] = value;
        setFormData(prev => ({ ...prev, previousSchools: newSchools }));
    };

    const addSchool = () => {
        setFormData(prev => ({
            ...prev,
            previousSchools: [...prev.previousSchools, { schoolName: '', fromDate: '', toDate: '' }]
        }));
    };

    const removeSchool = (index) => {
        if (formData.previousSchools.length === 1) return;
        const newSchools = [...formData.previousSchools];
        newSchools.splice(index, 1);
        setFormData(prev => ({ ...prev, previousSchools: newSchools }));
    };

    const nextStep = () => {
        let stepErrors = {};
        if (step === 1) {
            const required = ['fullName', 'gender', 'dob', 'mobile', 'role', 'aadharNo', 'panNo', 'address'];
            required.forEach(f => {
                const err = validateField(f, formData[f]);
                if (err) stepErrors[f] = err;
                else if (!formData[f]) stepErrors[f] = 'Required';
            });
        }
        if (step === 2) {
            const isEducationRequired = !['driver', 'support staff', 'aunty'].includes(formData.role.toLowerCase());
            if (isEducationRequired) {
                if (!formData.qualification) stepErrors.qualification = 'Required';
            }
            if (!formData.joiningDate) stepErrors.joiningDate = 'Required';
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
        setLoading(true);
        // Final validation before submission
        const finalRequired = ['bankName', 'accountNo', 'ifscCode'];
        let finalErrors = {};
        finalRequired.forEach(f => {
            if (!formData[f]) finalErrors[f] = 'Required';
        });

        if (Object.keys(finalErrors).length > 0) {
            setErrors(prev => ({ ...prev, ...finalErrors }));
            setStep(4); // Jump back to finalize step if errors found
            toast.warning("Please fill in bank details to complete onboarding");
            setLoading(false);
            return;
        }

        try {
            const submission = new FormData();
            Object.keys(formData).forEach(key => {
                if (key === 'previousSchools') {
                    submission.append(key, JSON.stringify(formData[key]));
                } else {
                    submission.append(key, formData[key]);
                }
            });
            Object.keys(files).forEach(key => {
                if (files[key]) submission.append(key, files[key]);
            });

            if (isEdit) {
                await updateStaff(initialData.id, submission);
                toast.success("Staff details updated successfully");
                if (onRefresh) onRefresh();
                onClose();
            } else {
                const result = await onboardStaff(submission);
                setSuccessData({
                    uid: result.credentials.username,
                    password: result.credentials.password,
                    employeeId: result.employeeId
                });
                if (onRefresh) onRefresh();
            }
        } catch (error) {
            toast.error(error.response?.data?.error || "Operation failed");
        } finally {
            setLoading(false);
        }
    };

    const isDriver = formData.role.toLowerCase().includes('driver');

    return (
        <div className="bg-white border-2 border-slate-200 w-full h-full flex flex-col overflow-hidden rounded-none z-50">
            {/* Navigation */}
            <div className="px-6 md:px-10 py-4 md:py-6 flex justify-between items-center border-b-2 border-slate-200 bg-slate-50/50">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2.5 md:p-3 bg-white border-2 border-slate-200 text-black rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 font-black text-[9px] md:text-[10px] uppercase tracking-widest shadow-sm">
                        <ChevronLeft className="w-3.5 h-3.5 md:w-4 md:h-4" /> Go Back
                    </button>
                    <div className="h-8 w-px bg-slate-300 mx-2 hidden md:block"></div>
                    <div>
                        <h2 className="text-sm md:text-xl font-black text-black uppercase tracking-tight">Staff {isEdit ? 'Update' : 'Onboarding'}</h2>
                        <p className="text-slate-500 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em]">Step {step} of 4 • {formData.role} Division</p>
                    </div>
                </div>
            </div>

            {/* Stepper */}
            <div className="bg-white px-6 md:px-12 py-4 md:py-5 border-b border-slate-200 flex justify-between overflow-x-auto scrollbar-hide">
                {[1, 2, 3, 4].map(s => (
                    <div key={s} className="flex items-center gap-2 md:gap-3 shrink-0">
                        <div className={`w-8 h-8 md:w-9 md:h-9 border-2 font-black text-[10px] md:text-xs flex items-center justify-center transition-all ${step >= s ? 'bg-black border-black text-white shadow-lg' : 'bg-white border-slate-200 text-slate-300'}`}>
                            {step > s ? <CheckCircle className="w-5 h-5" /> : s}
                        </div>
                        <p className={`text-[10px] font-black uppercase tracking-widest hidden md:block ${step === s ? 'text-black' : 'text-slate-400'}`}>
                            {s === 1 ? 'Personal' : s === 2 ? 'Professional' : s === 3 ? 'Documents' : 'Finalize'}
                        </p>
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 md:p-12 scrollbar-hide">
                {step === 1 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                        <SectionHeader icon={User} title="Primary Identity" sub="Role Selection & Personal Details" />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-8 rounded-4xl border border-slate-200">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Assigned Role *</label>
                                {rolesLoading ? (
                                    <div className="p-3.5 bg-white border rounded-2xl flex items-center gap-2 text-xs font-bold text-slate-400"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading...</div>
                                ) : rolesError ? (
                                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-600 text-[10px] font-bold text-center">Failed to load roles</div>
                                ) : (
                                    <select name="role" value={formData.role} onChange={handleInputChange} className="w-full bg-white border border-slate-400 px-5 py-3.5 rounded-2xl text-xs font-bold outline-none focus:border-amber-500 transition-all capitalize">
                                        {roles.map(r => <option key={r.id} value={r.role_name}>{r.role_name}</option>)}
                                    </select>
                                )}
                            </div>
                            <InputField label="National Code" name="universalNumber" value={formData.universalNumber} onChange={handleInputChange} placeholder="INST-1002" />
                            <InputField label="Full Name" name="fullName" value={formData.fullName} onChange={handleInputChange} required placeholder="Rahul Sharma" error={errors.fullName} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Gender *</label>
                                <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-400 px-5 py-3.5 rounded-2xl text-xs font-bold outline-none focus:border-amber-500 transition-all">
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <InputField label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleInputChange} required error={errors.dob} />
                            <InputField label="Mobile Number" name="mobile" value={formData.mobile} onChange={handleInputChange} required placeholder="9876543210" error={errors.mobile} maxLength={10} />
                            <InputField label="Emergency Contact" name="emergencyContact" value={formData.emergencyContact} onChange={handleInputChange} placeholder="Family/Friend Number" error={errors.emergencyContact} maxLength={10} />
                            <InputField label="Alternate Mobile" name="alternateMobile" value={formData.alternateMobile} onChange={handleInputChange} placeholder="Another Contact Number" error={errors.alternateMobile} maxLength={10} />
                            <InputField label="Email Address" name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="rahul@example.com" error={errors.email} />
                            <InputField label="Aadhar Number" name="aadharNo" value={formData.aadharNo} onChange={handleInputChange} placeholder="12-digit UID" error={errors.aadharNo} maxLength={12} />
                            <InputField label="PAN Number" name="panNo" value={formData.panNo} onChange={handleInputChange} placeholder="ABCDE1234F" error={errors.panNo} maxLength={10} />
                            <div className="md:col-span-2 lg:col-span-3">
                                <InputField label="Residential Address" name="address" value={formData.address} onChange={handleInputChange} isTextarea placeholder="Full home address" error={errors.address} />
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                        <SectionHeader icon={GraduationCap} title="Professional Profile" sub="Experience & Career Background" />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <InputField label="Qualification" name="qualification" value={formData.qualification} onChange={handleInputChange} required={!['driver', 'support staff', 'aunty', 'bus driver'].includes(formData.role.toLowerCase())} placeholder="e.g. B.Ed, M.Sc" error={errors.qualification} />
                            {!['driver', 'support staff', 'aunty', 'bus driver'].includes(formData.role.toLowerCase()) && (
                                <InputField label="Specialization" name="specialization" value={formData.specialization} onChange={handleInputChange} placeholder="e.g. Mathematics" />
                            )}
                            <InputField label="Experience (Years)" name="experience" type="number" value={formData.experience} onChange={handleInputChange} />
                        </div>

                        {/* Multi-School History */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b pb-4">
                                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                    <Briefcase className="w-4 h-4 text-indigo-500" /> Career History (Previous Schools)
                                </h4>
                                <button type="button" onClick={addSchool} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-indigo-100 transition-all">
                                    <Plus className="w-3 h-3" /> Add More
                                </button>
                            </div>

                            <div className="space-y-4">
                                {formData.previousSchools.map((school, idx) => (
                                    <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                        <div className="md:col-span-6">
                                            <InputField label="School Name" name={`school_${idx}`} value={school.schoolName} onChange={(e) => handleSchoolChange(idx, 'schoolName', e.target.value)} placeholder="Name of institution" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <InputField label="From" type="date" name={`from_${idx}`} value={school.fromDate} onChange={(e) => handleSchoolChange(idx, 'fromDate', e.target.value)} />
                                        </div>
                                        <div className="md:col-span-2">
                                            <InputField label="To" type="date" name={`to_${idx}`} value={school.toDate} onChange={(e) => handleSchoolChange(idx, 'toDate', e.target.value)} />
                                        </div>
                                        <div className="md:col-span-2 pb-2 flex justify-end">
                                            <button type="button" onClick={() => removeSchool(idx)} className="p-3 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t">
                            <InputField label="Joining Date" name="joiningDate" type="date" value={formData.joiningDate} onChange={handleInputChange} required />
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Employment Type</label>
                                <select name="employmentType" value={formData.employmentType} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-400 px-5 py-3.5 rounded-2xl text-xs font-bold outline-none">
                                    <option value="Full-time">Full-time</option>
                                    <option value="Part-time">Part-time</option>
                                </select>
                            </div>
                            <InputField label="Monthly Salary" name="salary" type="number" value={formData.salary} onChange={handleInputChange} />
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                        <SectionHeader icon={Upload} title="Documentation Vault" sub="Verification Proofs & Certifications" />

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <FilePicker label="Passport Photo *" icon={Camera} file={files.photo} onChange={(e) => handleFileChange(e, 'photo')} existingPath={initialData?.doc_photo} />
                            <FilePicker label="Aadhar Card *" icon={ShieldCheck} file={files.aadhar} onChange={(e) => handleFileChange(e, 'aadhar')} existingPath={initialData?.doc_aadhar} />
                            <FilePicker label="PAN Card" icon={CreditCard} file={files.pan} onChange={(e) => handleFileChange(e, 'pan')} existingPath={initialData?.doc_pan} />
                            <FilePicker label="Address Proof (Light Bil)" icon={MapPin} file={files.addressProof} onChange={(e) => handleFileChange(e, 'addressProof')} existingPath={initialData?.doc_address_proof} />
                            <FilePicker label="Bank Passbook/Check *" icon={Landmark} file={files.bankPassbook} onChange={(e) => handleFileChange(e, 'bankPassbook')} existingPath={initialData?.doc_bank_passbook} />

                            {!['driver', 'support staff', 'aunty', 'bus driver'].includes(formData.role.toLowerCase()) && (
                                <>
                                    <FilePicker label="Qual. Certificates" icon={GraduationCap} file={files.qualCerts} onChange={(e) => handleFileChange(e, 'qualCerts')} existingPath={initialData?.doc_qual_certs} />
                                    <FilePicker label="Experience Letter" icon={FileText} file={files.expLetter} onChange={(e) => handleFileChange(e, 'expLetter')} existingPath={initialData?.doc_exp_letter} />
                                    <FilePicker label="Resume / CV" icon={FileText} file={files.resume} onChange={(e) => handleFileChange(e, 'resume')} existingPath={initialData?.doc_resume} />
                                </>
                            )}

                            {isDriver && (
                                <>
                                    <FilePicker label="Driving License *" icon={Truck} file={files.drivingLicense} onChange={(e) => handleFileChange(e, 'drivingLicense')} existingPath={initialData?.doc_driving_license} />
                                    <FilePicker label="Physical Fitness Cert" icon={FileCheck} file={files.fitnessCert} onChange={(e) => handleFileChange(e, 'fitnessCert')} existingPath={initialData?.doc_fitness_cert} />
                                    <FilePicker label="Medical Certificate" icon={FileText} file={files.medicalCert} onChange={(e) => handleFileChange(e, 'medicalCert')} existingPath={initialData?.doc_medical_cert} />
                                </>
                            )}
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                        <SectionHeader icon={Landmark} title="Financial Details" sub="Bank Disbursement Information" />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <InputField label="Bank Name" name="bankName" value={formData.bankName} onChange={handleInputChange} placeholder="e.g. HDFC Bank" />
                            <InputField label="Account Number" name="accountNo" value={formData.accountNo} onChange={handleInputChange} placeholder="1234xxxx9012" />
                            <InputField label="IFSC Code" name="ifscCode" value={formData.ifscCode} onChange={handleInputChange} placeholder="HDFC0001234" />
                        </div>
                        <div className="p-6 md:p-10 bg-[#001736] rounded-3xl md:rounded-4xl text-white flex flex-col md:flex-row items-start md:items-center justify-between shadow-2xl gap-6">
                            <div className="space-y-4">
                                <h4 className="text-sm font-black text-white! flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-emerald-400" /> Account Verification
                                </h4>
                                <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mt-2 leading-relaxed">
                                    Credentials will be auto-generated upon submission.<br />
                                    Login Username: <span className="text-white">{formData.email || formData.mobile || 'pending...'}</span>
                                </p>
                            </div>
                            <div className="md:text-right w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-white/10">
                                <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white/30">Registry Status</p>
                                <p className="text-xs font-black text-emerald-400 uppercase mt-1">PENDING ACTIVATION</p>
                            </div>
                        </div>
                    </div>
                )}
            </form>

            {/* Footer */}
            <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-center shrink-0">
                <div className="flex items-center justify-between w-full md:w-auto gap-4">
                    {step > 1 ? (
                        <button onClick={prevStep} className="flex-1 md:flex-none px-6 md:px-8 py-3.5 md:py-4 bg-white border-2 border-slate-200 text-black rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all">
                            <ChevronLeft className="w-4 h-4" /> Previous
                        </button>
                    ) : <div />}
                    
                    <button onClick={onClose} className="md:hidden px-6 py-3.5 text-slate-400 hover:text-rose-500 font-bold text-[10px] uppercase tracking-widest border border-slate-200 rounded-2xl bg-white">Cancel</button>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <button onClick={onClose} className="hidden md:block px-6 py-4 text-slate-400 hover:text-rose-500 font-bold text-xs uppercase tracking-widest transition-colors">Cancel</button>
                    {step < 4 ? (
                        <button onClick={nextStep} className="flex-1 md:flex-none px-10 py-4 bg-[#001736] text-white rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl hover:bg-indigo-600 active:scale-95 transition-all">
                            Next Stage <ChevronRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button onClick={handleSubmit} disabled={loading} className="flex-1 md:flex-none px-12 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isEdit ? 'Update' : 'Complete')} <CheckCircle className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
            {/* Success Modal */}
            {successData && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-8 text-center space-y-6 animate-in zoom-in-95">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                            <CheckCircle className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Staff Onboarded!</h2>
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-3 text-left">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Login Credentials</p>
                            <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">User ID</span>
                                <span className="font-mono font-bold text-indigo-600">{successData.uid}</span>
                            </div>
                            <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Password</span>
                                <span className="font-mono font-bold text-rose-500">{successData.password}</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
                            <button type="button" onClick={() => { toast.success("Details sent to Email!"); }} className="w-full py-3.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-md active:scale-95">
                                <Mail className="w-4 h-4" /> Send Details to Email
                            </button>
                            <button type="button" onClick={() => { toast.success("Details sent to SMS!"); }} className="w-full py-3.5 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-amber-600 transition-all shadow-md active:scale-95">
                                <Phone className="w-4 h-4" /> Send Details to SMS
                            </button>
                            <button type="button" onClick={onClose} className="w-full py-3 mt-2 text-slate-400 hover:text-slate-600 font-bold text-[10px] uppercase tracking-widest transition-colors">
                                Close & Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const SectionHeader = ({ title, sub, ...props }) => {
    const Icon = props.icon;
    return (
        <div className="flex items-center gap-4 border-b border-slate-200 pb-4 md:pb-6">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-50 rounded-xl md:rounded-2xl flex items-center justify-center text-indigo-700 shadow-sm">
                {Icon && <Icon className="w-5 h-5 md:w-6 md:h-6" />}
            </div>
            <div>
                <h3 className="text-xs md:text-sm font-black text-black uppercase tracking-wider">{title}</h3>
                <p className="text-[8px] md:text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest">{sub}</p>
            </div>
        </div>
    );
};

const InputField = ({ label, name, type = "text", value, onChange, placeholder, required, isTextarea, error, maxLength }) => (
    <div className="space-y-2">
        <label className={`text-[10px] font-black uppercase tracking-widest ${error ? 'text-rose-500' : 'text-slate-400'} ml-1`}>{label} {required && '*'}</label>
        {isTextarea ? (
            <textarea name={name} value={value} onChange={onChange} placeholder={placeholder} rows={3} className={`w-full bg-slate-50 border ${error ? 'border-rose-500' : 'border-slate-400'} px-5 py-3.5 rounded-2xl text-xs font-bold outline-none focus:bg-white transition-all resize-none`} maxLength={maxLength} />
        ) : (
            <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} className={`w-full bg-slate-50 border ${error ? 'border-rose-500' : 'border-slate-400'} px-5 py-3.5 rounded-2xl text-xs font-bold outline-none focus:bg-white transition-all`} maxLength={maxLength} />
        )}
        {error && <p className="text-[9px] font-bold text-rose-500 ml-1 uppercase">{error}</p>}
    </div>
);

const FilePicker = ({ label, file, onChange, error, existingPath, ...props }) => {
    const Icon = props.icon;
    const handleView = () => {
        const url = file ? URL.createObjectURL(file) : `${ROOT_URL}/${existingPath}`;
        window.open(url, '_blank');
    };

    return (
        <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{label}</label>
            <div className={`flex items-center gap-3 p-2 bg-white border rounded-2xl transition-all ${error ? 'border-rose-300' : 'border-slate-300'}`}>
                {/* Custom Choose File Button */}
                <div className="relative shrink-0">
                    <button type="button" className="px-4 py-2 bg-[#001736] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-600 transition-all shadow-md active:scale-95">
                        Choose
                    </button>
                    <input type="file" onChange={onChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                </div>

                {/* File Status / Name */}
                <div className="flex-1 min-w-0 flex items-center gap-2">
                    {Icon && <Icon className={`w-3.5 h-3.5 shrink-0 ${file || existingPath ? 'text-indigo-500' : 'text-slate-300'}`} />}
                    <p className={`text-[11px] font-bold truncate uppercase tracking-tight ${file || existingPath ? 'text-slate-800' : 'text-slate-400'}`}>
                        {file ? file.name : (existingPath ? 'Document Stored' : 'No file chosen')}
                    </p>
                </div>

                {/* View Action */}
                {(file || existingPath) && (
                    <button 
                        type="button"
                        onClick={handleView}
                        className="w-8 h-8 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm shrink-0 border border-indigo-100"
                        title="View Document"
                    >
                        <Eye size={14} />
                    </button>
                )}
                
                {/* Info */}
                {!file && !existingPath && (
                    <span className="text-[8px] font-black text-slate-300 uppercase mr-2 tracking-tighter whitespace-nowrap">MAX 300KB</span>
                )}
            </div>
            {error && <p className="text-[9px] font-bold text-rose-500 ml-1 uppercase">{error}</p>}
        </div>
    );
};

export default StafOnboardingForm;
