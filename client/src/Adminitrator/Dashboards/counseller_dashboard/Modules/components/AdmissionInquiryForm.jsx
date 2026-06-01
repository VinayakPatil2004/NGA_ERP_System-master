import React, { useState } from 'react';
import { 
    X, 
    User, 
    BookOpen, 
    Users, 
    MapPin, 
    Phone, 
    Briefcase, 
    GraduationCap, 
    CheckCircle, 
    ChevronRight, 
    ChevronLeft,
    Plus,
    Calendar,
    Info,
    Bus,
    Loader2,
    Edit2
} from 'lucide-react';
import { toast } from 'react-toastify';
import { createEnquiry, updateEnquiry } from '../../../../../services/counsellorAPI';

const AdmissionInquiryForm = ({ onClose, onRefresh, selectedYear, selectedYearName, editData }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        formNo: 'AUTO',
        reference: '',
        date: new Date().toISOString().split('T')[0],
        fullName: '',
        placeOfBirth: '',
        dob: '',
        aadharNo: '',
        address: '',
        admissionStd: '',
        prevStd: '',
        caste: '',
        prevSchool: '',
        siblingsCount: '',
        age: '',
        religion: '',
        category: 'OPEN',
        busFacility: 'No',
        busArea: '',
        fatherName: '',
        fatherContact: '',
        fatherQual: '',
        fatherProf: '',
        fatherIncome: '',
        motherName: '',
        motherContact: '',
        motherQual: '',
        motherProf: '',
        motherIncome: '',
        academicYearId: selectedYear
    });

    // Initialize Edit Data if provided
    React.useEffect(() => {
        if (editData) {
            setFormData({
                id: editData.id,
                formNo: editData.form_no || 'AUTO',
                reference: editData.reference || '',
                date: editData.enquiry_date ? editData.enquiry_date.split('T')[0] : new Date().toISOString().split('T')[0],
                fullName: editData.full_name || '',
                placeOfBirth: editData.place_of_birth || '',
                dob: editData.dob || '',
                aadharNo: editData.aadhar_no || '',
                address: editData.address || '',
                admissionStd: editData.admission_std || '',
                prevStd: editData.prev_std || '',
                caste: editData.caste || '',
                prevSchool: editData.prev_school || '',
                siblingsCount: editData.siblings_count || '',
                age: editData.age || '',
                religion: editData.religion || '',
                category: editData.category || 'OPEN',
                busFacility: editData.bus_facility ? 'Yes' : 'No',
                busArea: editData.bus_area || '',
                fatherName: editData.father_name || '',
                fatherContact: editData.father_contact || '',
                fatherQual: editData.father_qual || '',
                fatherProf: editData.father_prof || '',
                fatherIncome: editData.father_income || '',
                motherName: editData.mother_name || '',
                motherContact: editData.mother_contact || '',
                motherQual: editData.mother_qual || '',
                motherProf: editData.mother_prof || '',
                academicYearId: editData.academic_year_id || selectedYear
            });
        }
    }, [editData, selectedYear]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateStep = () => {
        if (step === 1) {
            if (!formData.fullName) {
                toast.warning("Student name is required");
                return false;
            }
            if (formData.aadharNo && formData.aadharNo.length !== 12) {
                toast.warning("Aadhar Number must be exactly 12 digits");
                return false;
            }
        }
        if (step === 3) {
            if (formData.fatherContact && formData.fatherContact.length !== 10) {
                toast.warning("Father's contact must be exactly 10 digits");
                return false;
            }
            if (formData.motherContact && formData.motherContact.length !== 10) {
                toast.warning("Mother's contact must be exactly 10 digits");
                return false;
            }
        }
        return true;
    };

    const nextStep = () => {
        if (validateStep()) {
            setStep(s => s + 1);
        }
    };

    const prevStep = () => setStep(s => s - 1);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...formData,
                enquiryDate: formData.date
            };
            
            if (editData) {
                await updateEnquiry(editData.id, payload);
                toast.success(`Enquiry Updated!`);
            } else {
                const result = await createEnquiry(payload);
                toast.success(`Enquiry Registered! Form No: ${result.formNo}`);
            }
            if (onRefresh) onRefresh();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.error || "Submission failed");
        } finally {
            setLoading(false);
        }
    };

    const categories = ['SC', 'ST', 'VJ', 'NT', 'SBC', 'OBC', 'OPEN'];
    const classList = ['Nursery', 'JR.KG', 'SR.KG', '1ST', '2ND', '3RD', '4TH', '5TH', '6TH', '7TH', '8TH', '9TH', '10TH', '11TH', '12TH'];

    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-5xl h-[90vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
                {/* Header */}
                <div className="px-8 py-6 flex justify-between items-center border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#001736] rounded-2xl flex items-center justify-center text-white shadow-lg">
                            {editData ? <Edit2 className="w-6 h-6" strokeWidth={3} /> : <Plus className="w-6 h-6" strokeWidth={3} />}
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-[#001736] uppercase tracking-tight">{editData ? 'Edit Inquiry' : 'Admission Inquiry'}</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Form No: {formData.formNo} • {selectedYearName}</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-rose-50 hover:text-rose-500 text-slate-400 rounded-xl transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Step Indicator */}
                <div className="px-8 py-4 border-b border-slate-100 flex justify-between bg-white shrink-0">
                    {[1, 2, 3, 4].map(s => (
                        <div key={s} className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center transition-all ${step >= s ? 'bg-amber-400 text-[#001736] shadow-md' : 'bg-slate-50 text-black'}`}>
                                {step > s ? <CheckCircle className="w-4 h-4" /> : s}
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest hidden md:block ${step === s ? 'text-black' : 'text-black'}`}>
                                {s === 1 ? 'Student Info' : s === 2 ? 'Academic' : s === 3 ? 'Parent Info' : 'Review'}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 scrollbar-hide">
                    {step === 1 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <SectionHeader icon={User} title="Student Basic Info" sub="Pupil Identification & Birth Details" />
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <InputField label="Full Name" name="fullName" value={formData.fullName} onChange={handleInputChange} placeholder="As per documents" required />
                                <InputField label="Place of Birth" name="placeOfBirth" value={formData.placeOfBirth} onChange={handleInputChange} placeholder="City/Town" />
                                <InputField label="DOB" name="dob" type="date" value={formData.dob} onChange={handleInputChange} required />
                                <InputField label="Aadhar No." name="aadharNo" value={formData.aadharNo} onChange={handleInputChange} placeholder="12 Digit Number" />
                                <InputField label="Date" name="date" type="date" value={formData.date} onChange={handleInputChange} />
                                <InputField label="Reference" name="reference" value={formData.reference} onChange={handleInputChange} placeholder="e.g. Newspaper, Friend" />
                                <div className="md:col-span-2 lg:col-span-3">
                                    <InputField label="Full Address" name="address" value={formData.address} onChange={handleInputChange} isTextarea placeholder="Residential address" />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <SectionHeader icon={BookOpen} title="Academic Information" sub="Previous Schooling & Interests" />
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Admission For Std <span className="text-rose-500">*</span></label>
                                    <select 
                                        name="admissionStd" 
                                        value={formData.admissionStd} 
                                        onChange={handleInputChange}
                                        className="w-full bg-slate-50 border border-black px-5 py-3 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-black/5 transition-all"
                                        required
                                    >
                                        <option value="">Select Class</option>
                                        {classList.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Previous Std</label>
                                    <select 
                                        name="prevStd" 
                                        value={formData.prevStd} 
                                        onChange={handleInputChange}
                                        className="w-full bg-slate-50 border border-black px-5 py-3 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-black/5 transition-all"
                                    >
                                        <option value="">Select Class</option>
                                        {classList.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                                    </select>
                                </div>
                                <InputField label="Previous School" name="prevSchool" value={formData.prevSchool} onChange={handleInputChange} placeholder="School Name" />
                                <InputField label="Age" name="age" type="number" value={formData.age} onChange={handleInputChange} />
                                <InputField label="No. of Siblings" name="siblingsCount" type="number" value={formData.siblingsCount} onChange={handleInputChange} />
                            </div>

                            <SectionHeader icon={MapPin} title="Background & Category" sub="Demographic Identification" />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <InputField label="Religion" name="religion" value={formData.religion} onChange={handleInputChange} />
                                <InputField label="Caste" name="caste" value={formData.caste} onChange={handleInputChange} />
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Category</label>
                                    <select 
                                        name="category" 
                                        value={formData.category} 
                                        onChange={handleInputChange}
                                        className="w-full bg-slate-50 border border-black px-5 py-3 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-black/5 transition-all"
                                    >
                                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                            </div>

                            <SectionHeader icon={Bus} title="Facilities" sub="Transport & Other Services" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Bus facility required?</label>
                                    <select 
                                        name="busFacility" 
                                        value={formData.busFacility} 
                                        onChange={handleInputChange}
                                        className="w-full bg-slate-50 border border-black px-5 py-3 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-black/5 transition-all"
                                    >
                                        <option value="No">No</option>
                                        <option value="Yes">Yes</option>
                                    </select>
                                </div>
                                {formData.busFacility === 'Yes' && (
                                    <InputField label="Mention Area" name="busArea" value={formData.busArea} onChange={handleInputChange} placeholder="Pickup locality" />
                                )}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <SectionHeader icon={Users} title="Parent Details" sub="Guardian Information & Contact" />
                            
                            {/* Father's Info */}
                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200">
                                <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                                    Father's Details
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <InputField label="Name" name="fatherName" value={formData.fatherName} onChange={handleInputChange} />
                                    <InputField label="Contact No." name="fatherContact" value={formData.fatherContact} onChange={handleInputChange} />
                                    <InputField label="Qualification" name="fatherQual" value={formData.fatherQual} onChange={handleInputChange} />
                                    <InputField label="Profession" name="fatherProf" value={formData.fatherProf} onChange={handleInputChange} />
                                    <InputField label="Annual Income" name="fatherIncome" value={formData.fatherIncome} onChange={handleInputChange} />
                                </div>
                            </div>

                            {/* Mother's Info */}
                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200">
                                <h4 className="text-[10px] font-black uppercase text-rose-600 tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                                    Mother's Details
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <InputField label="Name" name="motherName" value={formData.motherName} onChange={handleInputChange} />
                                    <InputField label="Contact No." name="motherContact" value={formData.motherContact} onChange={handleInputChange} />
                                    <InputField label="Qualification" name="motherQual" value={formData.motherQual} onChange={handleInputChange} />
                                    <InputField label="Profession" name="motherProf" value={formData.motherProf} onChange={handleInputChange} />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <SectionHeader icon={CheckCircle} title="Final Review" sub="Confirm Information Accuracy" />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <ReviewItem label="Full Name" value={formData.fullName} />
                                <ReviewItem label="Admission For" value={formData.admissionStd} />
                                <ReviewItem label="Previous School" value={formData.prevSchool} />
                                <ReviewItem label="Previous Std" value={formData.prevStd} />
                                <ReviewItem label="Date of Birth" value={formData.dob} />
                                <ReviewItem label="Aadhar No" value={formData.aadharNo} />
                                <ReviewItem label="Father Name" value={formData.fatherName} />
                                <ReviewItem label="Father Contact" value={formData.fatherContact} />
                                <ReviewItem label="Father Income" value={formData.fatherIncome} />
                                <ReviewItem label="Mother Name" value={formData.motherName} />
                                <ReviewItem label="Mother Contact" value={formData.motherContact} />
                                <ReviewItem label="Address" value={formData.address} />
                                <ReviewItem label="Category" value={formData.category} />
                                <ReviewItem label="Religion / Caste" value={`${formData.religion} / ${formData.caste}`} />
                                <ReviewItem label="Bus Facility" value={formData.busFacility === 'Yes' ? `Yes (${formData.busArea})` : 'No'} />
                                <ReviewItem label="Reference" value={formData.reference} />
                            </div>
                        </div>
                    )}
                </form>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/30 flex justify-between items-center">
                    {step > 1 ? (
                        <button onClick={prevStep} className="px-6 py-3 bg-white border border-slate-200 text-[#001736] rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all">
                            <ChevronLeft className="w-4 h-4" /> Go Back
                        </button>
                    ) : <div />}

                    <div className="flex items-center gap-4">
                        <button onClick={onClose} className="px-6 py-3 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-rose-500">
                            Cancel
                        </button>
                        {step < 4 ? (
                            <button onClick={nextStep} className="px-10 py-3 bg-[#001736] text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all">
                                Next Stage <ChevronRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button 
                                onClick={handleSubmit} 
                                disabled={loading}
                                className="px-12 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : editData ? 'Update Inquiry' : 'Submit Inquiry'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const SectionHeader = ({ icon: Icon, title, sub }) => (
    <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-[#001736]">
            {Icon && <Icon className="w-5 h-5" />}
        </div>
        <div>
            <h3 className="text-[12px] font-black text-[#001736] uppercase tracking-wider">{title}</h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{sub}</p>
        </div>
    </div>
);

const InputField = ({ label, name, type = "text", value, onChange, placeholder, required = false, isTextarea = false }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
            {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {isTextarea ? (
            <textarea 
                name={name} 
                value={value} 
                onChange={onChange} 
                placeholder={placeholder}
                rows={3}
                className="w-full bg-slate-50 border border-black px-5 py-3 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-black/5 transition-all placeholder:text-slate-300 resize-none"
            />
        ) : (
            <input 
                type={type} 
                name={name} 
                value={value} 
                onChange={onChange} 
                placeholder={placeholder}
                onInput={(e) => {
                    if (name === 'fatherContact' || name === 'motherContact') {
                        e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                    }
                    if (name === 'aadharNo') {
                        e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 12);
                    }
                    if (name === 'fatherIncome') {
                        e.target.value = e.target.value.replace(/[^0-9]/g, '');
                    }
                }}
                className="w-full bg-slate-50 border border-black px-5 py-3 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-black/5 transition-all placeholder:text-slate-300"
            />
        )}
    </div>
);

const ReviewItem = ({ label, value }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{label}</label>
        <div className="w-full bg-slate-50 border border-black px-5 py-3 rounded-xl text-xs font-bold text-black uppercase tracking-tight">
            {value || 'Not Provided'}
        </div>
    </div>
);

export default AdmissionInquiryForm;
