import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { User, Book, MapPin, Upload, ChevronRight, ChevronLeft, CheckCircle, Info, Landmark, ScrollText, Users, Printer, X, Eye, Truck } from 'lucide-react';
import PrintLayout from './PrintLayout';
import { directEnrollStudent, updateApplicationDetails } from '../services/applyAdmissionAPI';
import { getActiveYear } from '../services/academicYearAPI';
import { ROOT_URL } from '../services/API';
import { ACADEMIC_YEARS } from '../utils/constants';

// Helper to format date for HTML input (YYYY-MM-DD)
const formatToInputDate = (dateString) => {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

const AdmissionForm = ({ onClose, editData }) => {
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [enrollmentResult, setEnrollmentResult] = useState(null);
  const [responseNo, setResponseNo] = useState('');
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    lastName: editData?.last_name || editData?.lastName || '',
    firstName: editData?.first_name || editData?.firstName || '',
    middleName: editData?.middle_name || editData?.middleName || '',
    grade: editData?.current_grade || editData?.grade || '',
    residentialAddress: editData?.residential_address || editData?.address || '',
    pincode: editData?.pincode || '',
    gender: editData?.gender || '',
    dob: formatToInputDate(editData?.dob) || '',
    pob: editData?.pob || '',
    aadhar: editData?.aadhar_no || editData?.aadhar || '',
    religion: editData?.religion || '',
    caste: editData?.caste || '',
    subcaste: editData?.subcaste || '',
    fatherName: editData?.father_name || editData?.fatherName || editData?.parent || '',
    fatherMobile: editData?.father_mobile || editData?.fatherMobile || editData?.phone || '',
    fatherEmail: editData?.father_email || editData?.fatherEmail || '',
    fatherOccupation: editData?.father_occupation || editData?.fatherOccupation || '',
    motherName: editData?.mother_name || editData?.motherName || '',
    motherMobile: editData?.mother_mobile || editData?.motherMobile || '',
    motherOccupation: editData?.mother_occupation || editData?.motherOccupation || '',
    motherTongue: editData?.mother_tongue || editData?.motherTongue || '',
    taluka: editData?.taluka || '',
    district: editData?.district || '',
    state: editData?.state || '',
    bloodGroup: editData?.blood_group || editData?.bloodGroup || '',
    medicalCondition: editData?.medical_condition || editData?.medicalCondition || '',
    allergies: editData?.allergies || '',
    enrollmentDate: formatToInputDate(editData?.enrollment_date || editData?.enrollmentDate) || new Date().toISOString().split('T')[0],
    admissionDate: formatToInputDate(editData?.admission_date || editData?.admissionDate || editData?.enrollment_date || editData?.enrollmentDate) || new Date().toISOString().split('T')[0],
    studentIdNo: editData?.student_id_no || editData?.srNo || '',
    grNo: editData?.gr_no || '',
    penNo: editData?.pen_no || '',
    age: editData?.age || '',
    prevClass: editData?.prev_class || editData?.prevClass || '',
    prevSchoolName: editData?.prev_school || editData?.prevSchoolName || '',
    prevBoard: editData?.prev_board || editData?.prevBoard || '',
    prevYear: editData?.prev_year || editData?.prevYear || '',
    prevPercentage: editData?.prev_percentage || editData?.prevPercentage || '',
    signature: '',
    academicYear: editData?.academic_year_id || '',
    requiresTransport: editData?.requires_transport === 1 || editData?.requiresTransport === true || false,
    transportRange: editData?.transport_range || editData?.transportRange || 'none',
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

  // 1. Fetch Active Academic Year
  useEffect(() => {
    const fetchActiveYear = async () => {
      try {
        const activeYear = await getActiveYear();
        if (activeYear && activeYear.year_name) {
          setFormData(prev => ({ ...prev, academicYear: activeYear.year_name }));
        }
      } catch (err) {
        console.warn("Error fetching active year:", err);
      }
    };
    fetchActiveYear();
  }, []);


  const validateStep = (s) => {
    let newErrors = {};
    if (s === 1) {
      const requiredFields = [
        'lastName', 'firstName', 'middleName', 'gender', 'dob', 'pob',
        'aadhar', 'religion', 'caste', 'subcaste', 'residentialAddress', 'pincode',
        'fatherName', 'fatherMobile', 'fatherOccupation', 'fatherEmail',
        'motherName', 'motherMobile', 'motherOccupation', 'motherTongue',
        'taluka', 'district', 'state', 'bloodGroup', 'medicalCondition', 'allergies'
      ];
      requiredFields.forEach(field => {
        if (!formData[field]) newErrors[field] = "Required";
      });
      if (formData.pincode && formData.pincode.length !== 6) newErrors.pincode = "Invalid Pincode";
      if (formData.aadhar && formData.aadhar.length !== 12) newErrors.aadhar = "Invalid Aadhar";
    }
    if (s === 2) { // Academic History
      // Institutional Logic: Academic History is now optional as per management request
      return true;
    }
    if (s === 3) { // Admission Details
      if (!formData.grade) newErrors.grade = "Required";
      if (!formData.academicYear) newErrors.academicYear = "Required";
      if (!formData.grNo) newErrors.grNo = "Required";
      if (!formData.penNo) newErrors.penNo = "Required";
    }
    if (s === 4) { // Documents
      const requiredDocs = ['passportPhoto', 'birthCert', 'leavingCert', 'casteCert', 'aadharCopy'];
      requiredDocs.forEach(doc => {
        // If it's an edit and the document already exists in the backend URLs, it's not required
        const docFieldMap = {
          passportPhoto: 'doc_passport_photo',
          birthCert: 'doc_birth_cert',
          leavingCert: 'doc_leaving_cert',
          casteCert: 'doc_caste_cert',
          aadharCopy: 'doc_aadhar_copy'
        };
        const existingDoc = editData?.[docFieldMap[doc]];
        if (!files[doc] && !existingDoc) {
          newErrors[doc] = "Required";
        }
      });
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast.warning("All fields are mandatory. Please complete the form.");
    }
    return Object.keys(newErrors).length === 0;
  };

  const calculateAge = (dobString) => {
    if (!dobString) return '';
    const today = new Date();
    const birthDate = new Date(dobString);
    if (isNaN(birthDate.getTime())) return '';
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? age : '';
  };

  const handleInputChange = (e) => {
    let { name, value } = e.target;

    // Numeric enforcement for specific fields
    const numericFields = ['aadhar', 'fatherMobile', 'motherMobile', 'paidAmount', 'pincode', 'grNo', 'penNo'];
    if (numericFields.includes(name)) {
      value = value.replace(/\D/g, '');
      // Length limits
      if (name === 'pincode' && value.length > 6) value = value.slice(0, 6);
      if (name === 'aadhar' && value.length > 12) value = value.slice(0, 12);
      if ((name === 'fatherMobile' || name === 'motherMobile') && value.length > 10) value = value.slice(0, 10);
    }

    // Name field enforcement (No numbers allowed)
    const nameFields = ['lastName', 'firstName', 'middleName', 'fatherName', 'motherName'];
    if (nameFields.includes(name)) {
      value = value.replace(/[0-9]/g, '');
    }

    if (name === 'dob') {
      const calculatedAge = calculateAge(value);
      setFormData(prev => ({
        ...prev,
        [name]: value,
        age: calculatedAge
      }));
    } else if (name === 'enrollmentDate') {
      // Institutional Logic: Admission Date usually synchronizes with Enrollment Date by default
      setFormData(prev => ({
        ...prev,
        enrollmentDate: value,
        admissionDate: value
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      const fileSizeKB = file.size / 1024;
      if (fileSizeKB < 50 || fileSizeKB > 300) {
        toast.error(`${field.replace(/([A-Z])/g, ' $1')} must be between 50KB and 300KB (Current: ${Math.round(fileSizeKB)}KB)`);
        e.target.value = '';
        return;
      }

      setFiles(prev => ({ ...prev, [field]: file }));
      if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
      if (field === 'passportPhoto') {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviews(prev => ({ ...prev, [field]: reader.result }));
          toast.success("Photo uploaded successfully!");
        };
        reader.readAsDataURL(file);
      } else {
        toast.success(`${field.replace(/([A-Z])/g, ' $1').toUpperCase()} uploaded!`);
      }
    }
  };

  const handleViewFile = (field) => {
    const file = files[field];
    if (file) {
      const url = URL.createObjectURL(file);
      window.open(url, '_blank');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(s => Math.min(s + 1, 5));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setStep(s => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStepClick = (target) => {
    if (target < step) {
      setStep(target);
      return;
    }

    // Prevent jumping ahead multiple steps
    if (target > step + 1) {
      toast.info("Please complete the current step first.");
      return;
    }

    if (validateStep(step)) {
      if (target <= 5) setStep(target);
    }
  };

  const renderPreviewContent = () => (
    <div className="space-y-4 print:space-y-2">
      {/* 1. Admission Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-12 break-inside-auto">
        <div className="col-span-2 border-b border-(--sidebar-bg) pb-1 mb-2">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-(--sidebar-bg) text-left whitespace-nowrap overflow-hidden text-ellipsis">Admission Details</h4>
        </div>
        {[
          { label: "Application Date", value: new Date().toLocaleDateString('en-GB') },
          { label: "Student ID", value: enrollmentResult?.student_id_no || enrollmentResult?.student_id || editData?.student_id_no || editData?.srNo || formData.studentIdNo || '---' },
          { label: "Academic Year", value: formData.academicYear },
          { label: "Class Admitted To", value: formData.grade, highlight: true },
          { label: "GR. No (General)", value: formData.grNo },
          { label: "PEN Number", value: formData.penNo },
        ].filter(Boolean).map(item => (
          <PreviewItem key={item.label} {...item} />
        ))}


      </div>

      {/* 3. Personal Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-12 break-inside-auto">
        <div className="col-span-2 border-b border-(--sidebar-bg) pb-1 mb-2">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-(--sidebar-bg) text-left whitespace-nowrap overflow-hidden text-ellipsis">Personal Details</h4>
        </div>
        {[
          { label: "Full Name", value: `${formData.lastName} ${formData.firstName} ${formData.middleName}`.trim(), full: true },
          { label: "Enrollment Date", value: formData.enrollmentDate },
          { label: "Gender", value: formData.gender },
          { label: "Date of Birth", value: formData.dob },
          { label: "Blood Group", value: formData.bloodGroup || 'Not Specified' },
          { label: "Medical Condition", value: formData.medicalCondition || 'None', full: true },
          { label: "Aadhar No.", value: formData.aadhar },
          { label: "Religion", value: formData.religion },
          { label: "Caste", value: formData.caste },
        ].filter(Boolean).map(item => (
          <PreviewItem key={item.label} {...item} />
        ))}
      </div>

      {/* 4. Parent Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-12 break-inside-auto px-0">
        <div className="col-span-2 border-b border-(--sidebar-bg) pb-1 mb-2">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-(--sidebar-bg) text-left whitespace-nowrap overflow-hidden text-ellipsis">Parent Details</h4>
        </div>
        {[
          { label: "Father's Name", value: formData.fatherName, full: true },
          { label: "Father's Phone", value: formData.fatherMobile },
          { label: "Father's Email", value: formData.fatherEmail },
          { label: "Father's Occupation", value: formData.fatherOccupation },
          { label: "Mother's Name", value: formData.motherName, full: true },
          { label: "Mother's Phone", value: formData.motherMobile },
          { label: "Mother's Occupation", value: formData.motherOccupation },
        ].map(item => (
          <PreviewItem key={item.label} {...item} />
        ))}
      </div>

      {/* 5. Address Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-12 break-inside-auto">
        <div className="col-span-2 border-b border-(--sidebar-bg) pb-1 mb-2">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-(--sidebar-bg) text-left whitespace-nowrap overflow-hidden text-ellipsis">Address Details</h4>
        </div>
        {[
          { label: "Home Address", value: formData.residentialAddress, full: true },
          { label: "Pincode", value: formData.pincode },
          { label: "Taluka", value: formData.taluka },
          { label: "District", value: formData.district },
          { label: "State", value: formData.state },
        ].map(item => (
          <PreviewItem key={item.label} {...item} />
        ))}
      </div>

      {/* 6. Academic History */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-12 break-inside-auto">
        <div className="col-span-2 border-b border-(--sidebar-bg) pb-1 mb-2">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-(--sidebar-bg) text-left whitespace-nowrap overflow-hidden text-ellipsis">Academic History</h4>
        </div>
        <PreviewItem label="Previous School" value={formData.prevSchoolName} full />
        <PreviewItem label="Previous Class" value={formData.prevClass} />
        <PreviewItem label="Board & Year" value={`${formData.prevBoard} - ${formData.prevYear}`} />
        <PreviewItem label="Percentage/Grade" value={formData.prevPercentage} />
      </div>

      {/* 7. Uploaded Documents */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-12 break-inside-auto mt-4">
        <div className="col-span-2 border-b border-slate-200 pb-1 mb-2">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-(--sidebar-bg) text-left whitespace-nowrap overflow-hidden text-ellipsis">Uploaded Documents</h4>
        </div>
        {Object.entries(files).map(([key, file]) => (
          file && <PreviewItem key={key} label={key.replace(/([A-Z])/g, ' $1').toUpperCase()} value={file.name} />
        ))}
      </div>

      {/* 8. Transport & Safety Features (Registry Status - follows Uploaded Docs) */}
      <div className="mt-6 border-2 border-[#FFB606]/30 rounded-2xl p-6 bg-slate-50/30 print:mt-4 print:border-none print:bg-transparent">
        <div className="flex items-center gap-3 mb-4 border-b border-[#FFB606] pb-2">
          <Truck className="w-5 h-5 text-[#001736]" />
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-[#001736] leading-none">Transport Service Registry</h4>
          </div>
        </div>

        {/* Enrollment Status - Positioned Above Range */}
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-100 shadow-sm print:shadow-none">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enrollment Status:</span>
            <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${formData.requiresTransport ? 'text-emerald-600 border-emerald-100 bg-emerald-50' : 'text-rose-600 border-rose-100 bg-rose-50'}`}>
              {formData.requiresTransport ? 'Service Opted' : 'Not Opted'}
            </span>
          </div>

          {formData.requiresTransport && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-3 rounded-xl border border-slate-100 shadow-sm print:shadow-none">
              <PreviewItem label="Operational Range" value={formData.transportRange} />
              <PreviewItem label="Emergency Contact" value={formData.fatherMobile} />
            </div>
          )}
        </div>
      </div>

      {/* 9. Institutional Bus Features (Annex Page: Feature Showcase & Signatures) */}
      <div style={{ breakBefore: 'page' }} className="mt-8 border-2 border-[#FFB606]/30 rounded-2xl p-8 bg-slate-50/30 print:mt-0 print:border-none print:bg-transparent">
        <div className="flex items-center gap-3 mb-8 border-b border-[#FFB606] pb-4">
          <Info className="w-6 h-6 text-[#001736]" />
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest text-[#001736] leading-none">Safety & Service Standards</h4>
            <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-tighter">Why Opt for Institutional Transport?</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 px-2 mb-12">
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            </div>
            <div className="space-y-1">
              <p className="text-[12px] font-black uppercase tracking-tight text-[#001736]">Real-Time GPS Tracking</p>
              <p className="text-[10px] font-bold text-slate-500 leading-relaxed">Live location monitoring through our secure parent portal for complete peace of mind.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            </div>
            <div className="space-y-1">
              <p className="text-[12px] font-black uppercase tracking-tight text-[#001736]">RTO Certified Safety</p>
              <p className="text-[10px] font-bold text-slate-500 leading-relaxed">Equipped with Fire Extinguishers & First-Aid standard kits as per government norms.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            </div>
            <div className="space-y-1">
              <p className="text-[12px] font-black uppercase tracking-tight text-[#001736]">Verified Attendants</p>
              <p className="text-[10px] font-bold text-slate-500 leading-relaxed">Professional female attendants on every route ensuring a safe environment for students.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            </div>
            <div className="space-y-1">
              <p className="text-[12px] font-black uppercase tracking-tight text-[#001736]">Point-to-Point Pickup</p>
              <p className="text-[10px] font-bold text-slate-500 leading-relaxed">Strategic route planning to minimize travel time and ensure maximum student comfort.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (step < 5) {
      nextStep();
    } else {
      try {
        toast.info(editData ? "Updating profile..." : "Submitting application...", { autoClose: 2000 });
        const submissionData = new FormData();

        Object.keys(formData).forEach(key => {
          submissionData.set(key, formData[key]);
        });

        Object.keys(files).forEach(key => {
          if (files[key]) {
            submissionData.append(key, files[key]);
          }
        });

        if (!editData) {
          const result = await directEnrollStudent(submissionData);
          if (result) {
            toast.success("Student Enrolled Successfully!");
            setResponseNo(result.application_no || result.student_id);
            setEnrollmentResult(result);
            setIsSubmitted(true);
          } else {
            toast.error("Enrollment failed. Please check your connection.");
          }
        } else {
          // Calling the refined update API
          await updateApplicationDetails(editData.id, formData);
          toast.success("Profile updated successfully!");
          setIsSubmitted(true);
        }
      } catch (err) {
        toast.error(err.response?.data?.error || "An error occurred during submission.");
        console.error("Form Submission Error:", err);
      }
    }
  };

  if (isSubmitted) {
    return (
      <>
        <div className="min-h-[60vh] max-w-2xl mx-auto flex flex-col items-center justify-center space-y-8 animate-in zoom-in duration-500 bg-white p-6 md:p-12 rounded-3xl md:rounded-[4rem] shadow-2xl border border-slate-50 relative overflow-hidden print:hidden">
          {/* Decorative elements */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50"></div>
          <div className="bg-emerald-100 p-6 rounded-full">
            <CheckCircle className="w-24 h-24 text-emerald-600" />
          </div>
          <h2 className="text-2xl md:text-4xl font-black text-(--sidebar-bg) w-full text-center">
            {editData ? 'Profile Updated!' : 'Application Submitted!'}
          </h2>
          <p className="text-slate-600 max-w-md font-medium text-center">
            {editData ? 'The student information has been successfully updated in the database.' : 'Your formal application and parent record have been received by New Grace Academy. Please visit the campus for final document verification.'}
          </p>
          <div style={{ backgroundColor: 'var(--sidebar-bg)' }} className="text-white p-8 rounded-3xl shadow-xl space-y-4 print:hidden w-full max-w-md text-center">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-50">{editData ? 'Institutional Profile Reference' : 'NGA Registry Reference'}</p>
              <p style={{ color: 'var(--text-accent)' }} className="text-lg md:text-3xl font-black wrap-break-word leading-tight">{editData ? `NGA/STU/${editData.student_id_no || editData.srNo}` : (responseNo || `NGA/ADM/${formData.academicYear.slice(-5)}/0001`)}</p>
            </div>

            {/* New: Login Credentials Branding Card - Only show on new enrollment */}
            {!editData && enrollmentResult?.credentials && (
              <div className="mt-6 bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4 animate-in slide-in-from-bottom duration-700 delay-300">
                <div className="flex items-center gap-3 border-b border-white/5 pb-2">
                  <Users className="w-4 h-4 text-(--text-accent)" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/70">Institutional Access Credentials</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div>
                    <p className="text-[8px] font-bold text-white/40 uppercase">Student Login</p>
                    <p className="text-sm font-black text-white">{enrollmentResult.credentials.student_login_id}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-bold text-white/40 uppercase">Parent Login</p>
                    <p className="text-sm font-black text-white">{enrollmentResult.credentials.parent_login_id}</p>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-white/5">
                    <p className="text-[8px] font-bold text-white/40 uppercase">Temporary Password</p>
                    <div className="flex items-center justify-between">
                      <p style={{ color: 'var(--text-accent)' }} className="text-lg md:text-xl font-black tracking-widest uppercase">{enrollmentResult.credentials.temporary_password}</p>
                      <span className="text-[8px] font-bold text-emerald-400 border border-emerald-400/30 px-2 py-1 rounded-md uppercase">Random Generated</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-4 print:hidden">
            <button onClick={onClose} className="bg-(--sidebar-bg) text-white px-10 py-4 rounded-2xl font-black shadow-xl hover:scale-105 transition-transform">Done</button>
            <button onClick={handlePrint} className="btn-add-institutional px-10 py-4 rounded-2xl shadow-xl flex items-center gap-2 hover:scale-105 transition-transform">
              <Printer className="w-5 h-5" /> Print Admission Form
            </button>
          </div>
        </div>

        {/* Success Window Print Matrix - Forced to background during UI view */}
        <div className="hidden print:block w-full bg-white">
          <PrintLayout
            title="Admission Form"
            studentPhoto={previews.passportPhoto}
            date={new Date().toLocaleDateString('en-GB')}
            formNo={responseNo || "PENDING SUBMISSION"}
          >
            {renderPreviewContent()}
          </PrintLayout>
        </div>
      </>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500 relative px-0 md:px-0">
      <button
        onClick={onClose}
        className="fixed top-2 right-2 md:absolute md:-top-4 md:-right-4 btn-close-institutional p-2 md:p-3 rounded-xl md:rounded-2xl shadow-2xl z-9999 print:hidden bg-white border border-slate-200 active:scale-95 transition-all"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="bg-card-institutional p-0 md:p-1 pb-6 md:pb-10 shadow-2xl rounded-none md:rounded-b-2xl print:shadow-none print:rounded-none print:pb-0">
        {/* Progress Bar */}
        <div className="px-4 md:px-12 py-6 md:py-8 flex justify-between items-center relative gap-4 print:hidden">
          <div className="absolute top-11 md:top-13 left-6 md:left-12 right-6 md:right-12 h-1 bg-slate-300 z-0"></div>
          {[1, 2, 3, 4, 5].map(s => (
            <div key={s} className="relative z-10 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => handleStepClick(s)}
                style={step === s ? { backgroundColor: 'var(--sidebar-bg)', color: 'white' } : step > s ? { backgroundColor: 'var(--btn-accent-bg)', color: 'var(--sidebar-bg)' } : { backgroundColor: 'white', borderColor: 'var(--text-main)', color: 'black' }}
                className={`w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-[10px] md:text-xs transition-all ${step === s ? 'scale-110 shadow-xl' : step > s ? '' : 'border hover:border-slate-300'}`}
              >
                {s}
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="px-3 md:px-20 py-6 md:py-10 print:p-0">
          {step === 1 && (
            <div className="space-y-4 animate-in slide-in-from-right duration-500">
              <div className="space-y-2 text-left">
                <h3 className="text-2xl font-black text-black">1. Applicant & Parent Details</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">General Information</p>
              </div>

              {/* Institutional Details Section (Edit Only) */}
              {editData && (
                <div className="space-y-4 bg-amber-50/30 p-8 rounded-4xl border border-amber-100/50">
                  <h4 className="text-sm font-black uppercase text-amber-900 tracking-widest border-b-2 border-amber-200 pb-2 w-fit">Institutional Records</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField label="Admission Date" name="admissionDate" type="date" value={formData.admissionDate} onChange={handleInputChange} required />
                    <FormField label="Student System ID" name="studentIdNo" value={formData.studentIdNo} onChange={handleInputChange} placeholder="System Generated if empty" readOnly={!!editData} />
                  </div>
                </div>
              )}

              {/* Student Information Section */}
              <div className="space-y-8 bg-slate-50/50 p-8 rounded-4xl border border-slate-100">
                <h4 style={{ borderBottomColor: 'var(--text-accent)' }} className="text-sm font-black uppercase text-black tracking-widest border-b-2 pb-2 w-fit">Student Information</h4>
                <div className="space-y-6">
                  <FormField label="Last Name" name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Surname" required error={errors.lastName} fullWidth />
                  <FormField label="First Name" name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="Student Name" required error={errors.firstName} fullWidth />
                  <FormField label="Father Name" name="middleName" value={formData.middleName} onChange={handleInputChange} placeholder="Middle Name" fullWidth />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="flex flex-col xl:flex-row xl:items-center gap-2 xl:gap-4">
                    <label className="text-xs font-bold text-black xl:w-44 shrink-0 select-none text-left">Gender *</label>
                    <div className="flex-1">
                      <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full px-4 py-3 input-institutional outline-none focus:border-(--text-accent) font-bold transition-all h-[48px] text-sm">
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  {!editData && <FormField label="Enrollment Date" name="enrollmentDate" type="date" value={formData.enrollmentDate} onChange={handleInputChange} required />}
                  <FormField label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleInputChange} required error={errors.dob} />
                  <FormField label="Calculated Age" name="age" type="number" value={formData.age} readOnly={true} placeholder="Years (Auto-calculated)" />
                  <FormField label="Place of Birth" name="pob" value={formData.pob} onChange={handleInputChange} placeholder="City/Village" />
                  <FormField label="Aadhar No." name="aadhar" value={formData.aadhar} onChange={handleInputChange} placeholder="12-digit number" required error={errors.aadhar} />
                  <FormField label="Religion" name="religion" value={formData.religion} onChange={handleInputChange} placeholder="E.g. Hindu" required error={errors.religion} />
                  <div className="flex flex-col xl:flex-row xl:items-center gap-2 xl:gap-4 relative pb-4">
                    <label className="text-xs font-bold text-black xl:w-44 shrink-0 select-none text-left">Caste *</label>
                    <div className="flex-1">
                      <select
                        name="caste"
                        value={formData.caste}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 input-institutional outline-none focus:border-(--text-accent) font-bold transition-all h-[48px] text-sm ${errors.caste ? 'border-red-500 bg-red-50' : ''}`}
                        style={errors.caste ? { borderColor: 'var(--danger)', backgroundColor: 'rgba(239, 68, 68, 0.05)' } : {}}
                      >
                        <option value="">Select Category</option>
                        {['SC', 'ST', 'VJ', 'NT', 'SBC', 'OBC', 'OPEN'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      {errors.caste && <p style={{ color: 'var(--danger)' }} className="text-[10px] font-black uppercase tracking-tight absolute bottom-0 left-0 xl:left-48">{errors.caste}</p>}
                    </div>
                  </div>
                  <FormField label="Sub-caste" name="subcaste" value={formData.subcaste} onChange={handleInputChange} placeholder="E.g. Maratha" required error={errors.subcaste} />
                  <FormField label="Address" name="residentialAddress" value={formData.residentialAddress} onChange={handleInputChange} placeholder="Street, Landmark" required rows={1} fullWidth />
                </div>

                {/* New Medical History Section */}
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.1)' }} className="mt-4 space-y-6 p-6 rounded-3xl border">


                  <h4 style={{ color: 'var(--danger)' }} className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    <Info className="w-4 h-4" /> Student Medical Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col xl:flex-row xl:items-center gap-2 xl:gap-4 relative pb-4">
                      <label className="text-xs font-bold text-black xl:w-44 shrink-0 select-none text-left">Blood Group *</label>
                      <div className="flex-1">
                        <select
                          name="bloodGroup"
                          value={formData.bloodGroup}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 input-institutional outline-none font-bold h-[48px] text-sm ${errors.bloodGroup ? 'border-red-500 bg-red-50' : ''}`}
                          style={errors.bloodGroup ? { borderColor: 'var(--danger)', backgroundColor: 'rgba(239, 68, 68, 0.05)' } : {}}
                        >
                          <option value="">Select Group</option>
                          {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                        </select>
                        {errors.bloodGroup && <p style={{ color: 'var(--danger)' }} className="text-[10px] font-black uppercase tracking-tight absolute bottom-0 left-0 xl:left-48">{errors.bloodGroup}</p>}
                      </div>

                    </div>
                    <FormField label="Allergies" name="allergies" value={formData.allergies} onChange={handleInputChange} placeholder="Any food or medicine allergies" required error={errors.allergies} />
                    <FormField label="Medical Condition" name="medicalCondition" value={formData.medicalCondition} onChange={handleInputChange} placeholder="Asthma, Diabetes, etc." required error={errors.medicalCondition} fullWidth />
                  </div>
                </div>
              </div>

              {/* Parent Information Section */}
              <div className="space-y-8 bg-white p-8 rounded-4xl border border-slate-100 shadow-sm">
                <h4 style={{ borderBottomColor: 'var(--text-accent)' }} className="text-sm font-black uppercase text-black tracking-widest border-b-2 pb-2 w-fit">Parent Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                  <FormField label="Father's Name" name="fatherName" value={formData.fatherName} onChange={handleInputChange} placeholder="Full Name" required error={errors.fatherName} />
                  <FormField label="Father's Phone" name="fatherMobile" value={formData.fatherMobile} onChange={handleInputChange} placeholder="10-digit mobile" required error={errors.fatherMobile} />
                  <FormField label="Father's Occupation" name="fatherOccupation" value={formData.fatherOccupation} onChange={handleInputChange} placeholder="E.g. Business/Service" required error={errors.fatherOccupation} />
                  <FormField label="Father's Email" name="fatherEmail" value={formData.fatherEmail} onChange={handleInputChange} placeholder="Email address" required error={errors.fatherEmail} />
                  <FormField label="Mother's Name" name="motherName" value={formData.motherName} onChange={handleInputChange} placeholder="Full Name" required error={errors.motherName} />
                  <FormField label="Mother's Phone" name="motherMobile" value={formData.motherMobile} onChange={handleInputChange} placeholder="10-digit mobile" required error={errors.motherMobile} />
                  <FormField label="Mother's Occupation" name="motherOccupation" value={formData.motherOccupation} onChange={handleInputChange} placeholder="E.g. Homemaker" required error={errors.motherOccupation} />
                  <FormField label="Mother Tongue" name="motherTongue" value={formData.motherTongue} onChange={handleInputChange} placeholder="E.g. Marathi" required error={errors.motherTongue} />
                  <FormField label="Taluka" name="taluka" value={formData.taluka} onChange={handleInputChange} placeholder="Your Taluka" required error={errors.taluka} />
                  <FormField label="District" name="district" value={formData.district} onChange={handleInputChange} placeholder="Your District" required error={errors.district} />
                  <FormField label="State" name="state" value={formData.state} onChange={handleInputChange} placeholder="Your State" required error={errors.state} />
                  <FormField label="Pincode" name="pincode" value={formData.pincode} onChange={handleInputChange} placeholder="6 digits" required error={errors.pincode} />
                </div>
              </div>

              <div className="flex justify-end pt-8">
                <button type="button" onClick={nextStep} className="btn-add-institutional w-full md:w-auto px-12 py-4 md:py-5 rounded-xl md:rounded-2xl shadow-xl flex items-center justify-center gap-3 hover:translate-x-1 transition-transform">
                  Academic Record <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-12 animate-in slide-in-from-right duration-500 text-left">
              <h3 className="text-2xl font-black text-institutional-main">2. Academic History</h3>
              <div className="p-8 bg-card-institutional rounded-[2.5rem] space-y-8">
                <p className="text-[10px] font-black uppercase text-institutional-muted tracking-widest italic">Last School Details</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField label="School Name" name="prevSchoolName" placeholder="Previous Institution" value={formData.prevSchoolName} onChange={handleInputChange} />
                  <FormField label="Class/Grade" name="prevClass" placeholder="E.g. 5th" value={formData.prevClass} onChange={handleInputChange} />
                  <FormField label="Board" name="prevBoard" placeholder="CBSE/State" value={formData.prevBoard} onChange={handleInputChange} />
                  <FormField label="Passing Year" name="prevYear" placeholder="2025" value={formData.prevYear} onChange={handleInputChange} />
                  <FormField label="Percentage" name="prevPercentage" placeholder="Grade/Marks" value={formData.prevPercentage} onChange={handleInputChange} />
                </div>
              </div>

              <div className="flex justify-between pt-8">
                <button type="button" onClick={prevStep} className="font-black text-institutional-muted px-8 flex items-center gap-2 hover:text-black transition-colors">
                  <ChevronLeft className="w-5 h-5" /> Back
                </button>
                <button type="button" onClick={nextStep} className="btn-add-institutional w-full md:w-auto px-10 py-4 md:py-5 rounded-xl md:rounded-2xl shadow-xl flex items-center justify-center gap-3">
                  Admission Details <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-12 animate-in slide-in-from-right duration-500 text-left">
              <h3 className="text-2xl font-black text-black">3. Admission Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* Class Admitted To - Using standard wrapper for alignment */}
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 relative pb-4">
                  <label className="text-xs font-bold text-black md:w-28 shrink-0 select-none text-left">Class Admitted To *</label>
                  <div className="flex-1 relative">
                    <select
                      name="grade"
                      value={formData.grade}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 input-institutional outline-none focus:border-(--text-accent) font-bold transition-all h-[48px] text-sm ${errors.grade ? 'border-red-500 bg-red-50' : ''}`}
                    >
                      <option value="">Select Class</option>
                      {['Nursery', 'Jr.Kg', 'Sr.Kg', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'].map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                    {errors.grade && <p style={{ color: 'var(--danger)' }} className="text-[10px] font-black uppercase tracking-tight absolute bottom-0 left-0 md:left-32">{errors.grade}</p>}
                  </div>
                </div>

                <FormField
                  label="Academic Year"
                  name="academicYear"
                  value={formData.academicYear}
                  readOnly={true}
                  required
                  placeholder="Active Year"
                />

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8 p-8 rounded-4xl bg-slate-50/50 border border-slate-100 shadow-sm">
                  <div className="col-span-2 border-b border-slate-200 pb-2">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Institutional Identifiers</h4>
                  </div>
                  <FormField 
                    label="GR. No (General)" 
                    name="grNo" 
                    value={formData.grNo} 
                    onChange={handleInputChange} 
                    placeholder="General Register Number" 
                    required
                    error={errors.grNo}
                  />
                  <FormField 
                    label="PEN ID Number" 
                    name="penNo" 
                    value={formData.penNo} 
                    onChange={handleInputChange} 
                    placeholder="Permanent Education Number" 
                    required
                    error={errors.penNo}
                  />
                </div>

                {/* Institutional Transport Opt-in Section */}
                <div className="md:col-span-2 p-8 rounded-xl border  space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200">
                        <Truck className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black txt-black uppercase tracking-tight">School Bus Service</h4>
                      </div>
                    </div>
                    <div className="flex border-institutional p-1  rounded-xl">
                      {[
                        { label: 'YES', value: true },
                        { label: 'NO', value: false }
                      ].map((opt) => (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, requiresTransport: opt.value }))}
                          className={`px-8 py-2.5 rounded-xl cursor-pointer text-[10px] font-black uppercase tracking-widest transition-all ${formData.requiresTransport === opt.value ? 'bg-[#FFB606] text-black shadow-md border border-black/20' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {formData.requiresTransport && (
                    <div className="animate-in slide-in-from-top-4 duration-500 pt-6 border-t border-slate-100">
                      <div className="flex flex-col md:flex-row md:items-center gap-6">
                        <label className="text-[10px] font-black md:w-48 shrink-0 uppercase tracking-[0.2em]">Select Distance Range *</label>
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {['0-5km', '5-7km', 'above 7km'].map(range => (
                            <button
                              key={range}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, transportRange: range }))}
                              className={`py-3.5 rounded-xl text-[10px] cursor-pointer font-black uppercase tracking-widest transition-all border ${formData.transportRange === range ? 'bg-[#FFB606] border-[#FFB606] text-black shadow-xl' : 'bg-white border-institutional text-institutional-muted hover:border-institutional'}`}
                            >
                              {range}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between pt-8">
                <button type="button" onClick={prevStep} className="font-black text-slate-400 px-8 flex items-center gap-2">
                  <ChevronLeft className="w-5 h-5" /> Back
                </button>
                <button type="button" onClick={nextStep} className="bg-black text-white w-full md:w-auto px-10 py-4 md:py-5 rounded-xl md:rounded-2xl font-black shadow-xl flex items-center justify-center gap-3">
                  Document Upload <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-12 animate-in slide-in-from-right duration-500 text-left">
              <div className="space-y-2">
                <h3 className="text-lg md:text-2xl font-black text-black whitespace-nowrap">4. Document Upload Registry</h3>
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis">Verified digital copies required for enrollment</p>
              </div>

              <div style={{ borderColor: 'rgba(0, 23, 54, 0.05)' }} className="bg-white border-2 p-3 md:p-8 rounded-3xl md:rounded-[3.5rem] shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 items-stretch">
                  {/* 1. Passport Photo Card */}
                  <div className="flex flex-col bg-slate-50/50 p-4 rounded-xl border border-slate-300 group hover:border-(--sidebar-bg) transition-all">
                    <div className="space-y-3 flex-1 flex flex-col items-center">
                      <div className="w-24 h-28 bg-white border-2 border-dashed border-slate-100 rounded-2xl flex items-center justify-center overflow-hidden shadow-sm relative">
                        {previews.passportPhoto ?
                          <img src={previews.passportPhoto} className="w-full h-full object-cover" /> :
                          <Upload style={{ color: 'var(--text-muted)' }} className="w-8 h-8 opacity-20" />
                        }
                      </div>
                      <div className="text-center space-y-1">
                        <h4 className="text-sm font-black text-black">Passport Photo *</h4>
                        <p className="text-[8px] font-bold text-slate-400 uppercase">Max Size: 256KB</p>
                      </div>
                    </div>
                    <label className="mt-4 w-full py-3 text-white rounded-xl text-[10px] font-black border text-center cursor-pointer hover:scale-[1.02] transition-all shadow-md">
                      {files.passportPhoto ? 'Change Photo' : editData?.doc_passport_photo ? 'Update Photo' : 'Choose Photo'}
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'passportPhoto')} />
                    </label>
                    {editData?.doc_passport_photo && !files.passportPhoto && (
                      <a href={`${ROOT_URL}/${editData.doc_passport_photo}`} target="_blank" rel="noreferrer" className="mt-2 text-[8px] font-black text-indigo-600 uppercase text-center underline">View Current</a>
                    )}
                  </div>

                  {/* 2. Supporting Certificates Grid */}
                  {[
                    { id: 'birthCert', label: 'Birth Certificate' },
                    { id: 'aadharCopy', label: 'Aadhar Card' },
                    { id: 'leavingCert', label: 'Leaving Certificate' },
                    { id: 'casteCert', label: 'Caste Certificate' },
                  ].map(doc => (
                    <div key={doc.id} className="flex flex-col p-6 rounded-xl border border-slate-300 hover:border-(--sidebar-bg) bg-white shadow-sm hover:shadow-lg transition-all group">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center justify-between">
                          <ScrollText style={{ color: 'var(--sidebar-bg)' }} className="w-5 h-5 opacity-40" />
                          <div style={files[doc.id] ? { backgroundColor: 'var(--success)' } : { backgroundColor: 'var(--text-muted)' }} className="w-2 h-2 rounded-full shadow-sm"></div>
                        </div>
                        <h4 className="text-[11px] md:text-sm font-black text-black leading-tight uppercase tracking-tight wrap-break-word">{doc.label} *</h4>

                        <div className="space-y-3">
                          <label className="flex flex-col gap-2 bg-slate-100/50 border border-slate-200 p-3 rounded-2xl cursor-pointer hover:border-(--sidebar-bg) transition-colors relative overflow-hidden">
                            <span className="text-[9px] font-black text-slate-400 uppercase truncate">
                              {files[doc.id] ? files[doc.id].name : editData?.[`doc_${doc.id.replace(/([A-Z])/g, '_$1').toLowerCase()}`] ? 'Existing File Preserved' : 'Choose File'}
                            </span>
                            <div style={{ backgroundColor: 'var(--success)' }} className="w-fit px-3 py-1.5 rounded-lg text-[8px] font-black text-white uppercase flex items-center gap-2 shadow-sm">
                              <Upload className="w-3 h-3" /> {files[doc.id] ? 'Replace' : 'Upload'}
                            </div>
                            <input type="file" className="hidden" accept=".jpg,.jpeg,.pdf" onChange={(e) => handleFileChange(e, doc.id)} />
                          </label>
                          <p style={{ color: 'var(--danger)' }} className="text-[8px] font-bold italic leading-tight opacity-70">
                            .jpg, .pdf (15KB - 256KB)
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleViewFile(doc.id)}
                        disabled={!files[doc.id]}
                        style={files[doc.id] ? { backgroundColor: 'var(--info)', color: 'white' } : { backgroundColor: '#f8fafc', color: '#cbd5e1' }}
                        className={`mt-4 w-full py-2 md:py-3 rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm whitespace-nowrap ${!files[doc.id] ? 'cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95'}`}
                      >
                        <Eye className="w-3 h-3" /> View Document
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-8">
                <button type="button" onClick={prevStep} className="font-black text-slate-400 px-8 flex items-center gap-2">
                  <ChevronLeft className="w-5 h-5" /> Back
                </button>
                <button type="button" onClick={nextStep} style={{ backgroundColor: 'var(--sidebar-bg)' }} className="text-white w-full md:w-auto px-6 md:px-10 py-3 md:py-5 rounded-xl md:rounded-2xl font-black text-xs md:text-base shadow-xl flex items-center justify-center gap-3">
                  Final Review <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}


          {step === 5 && (
            <div className="space-y-12 animate-in slide-in-from-right duration-500">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 print:hidden">
                <h3 className="text-lg md:text-2xl font-black text-(--sidebar-bg) whitespace-nowrap">5. Final Review</h3>
                <button type="button" onClick={() => handlePrint('form')} className="w-full md:w-auto bg-(--btn-accent-bg) text-(--sidebar-bg) px-6 py-3 rounded-xl font-black text-xs md:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-100">
                  <Printer className="w-4 h-4 md:w-5 md:h-5" /> Print Draft
                </button>
              </div>

              <div className="border border-slate-200 rounded-2xl md:rounded-[3rem] p-0 md:p-1 shadow-2xl overflow-x-auto bg-white print:border-none print:shadow-none print:p-0 print:overflow-visible">
                <PrintLayout
                  title="Admission Form"
                  studentPhoto={previews.passportPhoto}
                  date={new Date().toLocaleDateString('en-GB')}
                  formNo={responseNo || "PENDING SUBMISSION"}
                >
                  {renderPreviewContent()}
                </PrintLayout>
              </div>

              <div className="flex flex-col md:flex-row gap-4 justify-between pt-8 print:hidden">
                <button type="button" onClick={prevStep} className="font-black text-slate-400 px-8 py-3 md:py-0 flex items-center justify-center md:justify-start gap-2 border border-slate-100 md:border-none rounded-xl md:rounded-none">
                  <ChevronLeft className="w-5 h-5" /> Back
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: 'var(--danger)' }}
                  className="text-white w-full md:w-auto px-8 py-4 md:px-16 md:py-6 rounded-xl md:rounded-2xl font-black text-lg md:text-xl shadow-2xl shadow-red-200 hover:scale-105 transition-transform flex items-center justify-center gap-4"
                >
                  {editData ? 'Update Records' : 'Submit Application'} <CheckCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>

  );
};

const FormField = ({ label, name, type = "text", value, onChange, placeholder, required = false, rows = null, readOnly = false, error = null, fullWidth = false }) => (
  <div className={`flex flex-col gap-1 ${rows || fullWidth ? 'md:col-span-2' : ''} relative pb-4`}>
    <div className="flex flex-col xl:flex-row xl:items-center gap-2 xl:gap-4">
      <label className="text-xs font-bold text-black xl:w-44 shrink-0 select-none text-left">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex-1 relative group">
        {rows ? (
          <textarea
            required={required}
            name={name}
            rows={rows}
            value={value}
            onChange={onChange}
            readOnly={readOnly}
            placeholder={placeholder}
            className={`w-full px-6 py-4 input-institutional outline-none transition-all min-h-[56px] font-bold text-sm ${error ? 'border-red-500 bg-red-50' : 'focus:border-(--text-accent)'} ${readOnly ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
            style={error ? { borderColor: 'var(--danger)', backgroundColor: 'rgba(239, 68, 68, 0.05)' } : {}}
          />
        ) : (
          <input
            required={required}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            readOnly={readOnly}
            placeholder={placeholder}
            className={`w-full px-4 py-3 input-institutional outline-none transition-all font-bold text-sm h-[48px] ${error ? 'border-red-500 bg-red-50' : 'focus:border-(--text-accent)'} ${readOnly ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
            style={error ? { borderColor: 'var(--danger)', backgroundColor: 'rgba(239, 68, 68, 0.05)' } : {}}
          />
        )}
      </div>
    </div>
    {error && <p style={{ color: 'var(--danger)' }} className="text-[10px] font-black uppercase tracking-tight absolute bottom-0 left-0 md:left-32">{error}</p>}
  </div>
);

const PreviewItem = ({ label, value, full = false, highlight = false }) => (
  <div className={`${full ? 'col-span-2' : ''} border-b border-slate-50 pb-1`}>
    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
    <div style={highlight ? { backgroundColor: 'rgba(255, 182, 6, 0.1)', borderLeft: '4px solid var(--text-accent)' } : {}} className={`text-[12px] font-bold text-institutional-main leading-tight ${highlight ? 'px-3 py-1 rounded-sm' : ''}`}>
      {highlight && <span style={{ color: 'rgba(0, 23, 54, 0.4)' }} className="text-[7px] font-bold block mb-0.5">SELECTED GRADE:</span>}
      {value || '---'}
    </div>
  </div>
);

export default AdmissionForm;
