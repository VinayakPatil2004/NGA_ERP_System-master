import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    getStudentById,
    getStudentAcademicRecords,
    getStudentAttendanceRecords,
    getStudentExams,
    getAcademicYearsList,
    getActiveAcademicYear,
    updateStudent,
    archiveStudent,
    addStudentFee,
    getStudentFees
} from '../../services/studentAPI';
import * as XLSX from 'xlsx';
// import jsPDF from 'jspdf';
// import autoTable from 'jspdf-autotable';
import { ROOT_URL } from '../../services/API';
import ModuleHeader from '../admcomponents/ModuleHeader';
import DataTable from '../admcomponents/DataTable';
import {
    ArrowLeft, User, Phone, Mail, Calendar, Hash,
    FileText, Download, Edit3, Trash2, CreditCard,
    Search, Users, Briefcase, GraduationCap,
    Award, ShieldCheck, Heart, BookMarked, MapPin,
    Eye, CheckCircle2, XCircle, AlertCircle, Clock,
    ChevronLeft, ChevronRight, Plus, Printer, ExternalLink,
    Truck
} from 'lucide-react';
import { toast } from 'react-toastify';
import { getFeeStructures, getTransportFees } from '../../services/FeesAndFinance/feeStructureAPI';
import { getStudentPerformance, getCoScholastic, getPrePrimaryMarks } from '../../services/examAPI';

// Import Templates
import PrePrimaryReport from '../Dashboards/Teacher/Modules/ExamResultTemplates/PrePrimaryReport';
import PrimaryReport1to2 from '../Dashboards/Teacher/Modules/ExamResultTemplates/PrimaryReport1to2';
import PrimaryReport3to5 from '../Dashboards/Teacher/Modules/ExamResultTemplates/PrimaryReport3to5';
import MiddleReport6to8 from '../Dashboards/Teacher/Modules/ExamResultTemplates/MiddleReport6to8';

const formatCurrency = (val) => (val ?? 0).toLocaleString("en-IN");

const StudentProfile = ({ student, onBack }) => {
    const { user } = useAuth();
    const isInstitutionalRole = ['admin', 'HR', 'principal', 'teacher', 'counsellor'].includes(user?.role);

    const calculateAge = (dob) => {
        if (!dob) return '---';
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const [activeTab, setActiveTab] = useState('profile');
    const [fullData, setFullData] = useState(null);
    const [academicHistory, setAcademicHistory] = useState([]);
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [exams, setExams] = useState([]);
    const [performanceData, setPerformanceData] = useState([]);
    const [coScholasticData, setCoScholasticData] = useState([]);
    const [prePrimaryData, setPrePrimaryData] = useState([]);
    const [feeSummary, setFeeSummary] = useState(null);
    const [academicYears, setAcademicYears] = useState([]);
    const [selectedYearId, setSelectedYearId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [printTarget, setPrintTarget] = useState(null);



    // Fee Modal State
    const [showFeeModal, setShowFeeModal] = useState(false);
    const [newFee, setNewFee] = useState({
        fee_type: '',
        total_amount: '',
        paid_amount: '',
        status: 'partial',
        remarks: ''
    });

    // Edit Profile State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({});

    useEffect(() => {
        if (fullData) {
            setEditForm({
                first_name: fullData.first_name || '',
                last_name: fullData.last_name || '',
                middle_name: fullData.middle_name || '',
                dob: fullData.dob ? new Date(fullData.dob).toISOString().split('T')[0] : '',
                gender: fullData.gender || 'male',
                blood_group: fullData.blood_group || '',
                medical_condition: fullData.medical_condition || '',
                allergies: fullData.allergies || '',
                enrollment_date: fullData.enrollment_date ? new Date(fullData.enrollment_date).toISOString().split('T')[0] : '',
                residential_address: fullData.residential_address || '',
                taluka: fullData.taluka || '',
                district: fullData.district || '',
                state: fullData.state || '',
                pincode: fullData.pincode || '',
                aadhar_no: fullData.aadhar_no || '',
                mother_tongue: fullData.mother_tongue || '',
                pob: fullData.pob || '',
                religion: fullData.religion || '',
                caste: fullData.caste || '',
                subcaste: fullData.subcaste || '',
                current_grade: fullData.current_grade || '',
                status: fullData.status || 'active',
                gr_no: fullData.gr_no || '',
                pen_no: fullData.pen_no || '',
                father_name: fullData.father_name || '',
                father_mobile: fullData.father_mobile || '',
                father_email: fullData.father_email || '',
                father_occupation: fullData.father_occupation || '',
                mother_name: fullData.mother_name || '',
                mother_mobile: fullData.mother_mobile || '',
                mother_occupation: fullData.mother_occupation || '',
                requires_transport: fullData.requires_transport || false,
                transport_range: fullData.transport_range || 'none'
            });
        }
    }, [fullData]);

    const handleUpdateProfile = async (e) => {
        if (e) e.preventDefault();
        try {
            // Institutional Metadata Validation
            if (editForm.pen_no && editForm.pen_no.length !== 10) {
                toast.error("PEN Identification No must be 10 digits long");
                return;
            }
            if (editForm.gr_no && isNaN(editForm.gr_no)) {
                toast.error("GR No must be a numeric value");
                return;
            }

            await updateStudent(student.id, editForm);
            toast.success("Academic records updated successfully");
            setShowEditModal(false);
            // Refresh details
            const updated = await getStudentById(student.id);
            setFullData(updated);
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error("Failed to update student records");
        }
    };

    /**
     * Executes the archival sequence, transitioning the student to the Alumni registry.
     * Triggers a state update on the parent container to refresh the registry.
     */
    const handleArchiveLocal = async () => {
        const reason = prompt("Institutional Exit Reason (e.g. Completed 10th, Left School):");
        if (!reason) return;

        const leavingDate = prompt("Institutional Leaving Date (YYYY-MM-DD):", new Date().toISOString().split('T')[0]);
        if (!leavingDate) return;

        try {
            await archiveStudent(student.id, leavingDate, reason);
            toast.success("Academic Profile transitioned to Alumni Archive");
            onBack();
        } catch {
            toast.error("Archival Sequence Failed: Endpoint unreachable");
        }
    };

    /**
     * Initial data load sequence. Synchronizes basic profile, academic years,
     * and historical records for the selected student.
     */
    useEffect(() => {
        const fetchInitialData = async () => {
            if (!student?.id) return;
            setLoading(true);
            try {
                const [details, years, activeYear] = await Promise.all([
                    getStudentById(student.id),
                    getAcademicYearsList(),
                    getActiveAcademicYear()
                ]);

                setFullData(details);
                setAcademicYears(years);

                const records = await getStudentAcademicRecords(student.id);
                setAcademicHistory(records);

                // Default to active year if the student is enrolled in it, 
                // otherwise use the student's latest enrollment year
                const studentEnrollments = records.map(r => r.academic_year_id);
                const defaultYear = studentEnrollments.includes(activeYear?.id) 
                    ? activeYear?.id 
                    : (studentEnrollments[0] || activeYear?.id || years[0]?.id);
                
                setSelectedYearId(defaultYear);

            } catch (error) {
                console.error("Error fetching initial profile data:", error);
                toast.error("Failed to load student profile");
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [student?.id]);

    // Sync Attendance, Exams, and Performance/Co-scholastic data
    useEffect(() => {
        const fetchYearlyData = async () => {
            if (!student?.id || !selectedYearId) return;
            try {
                // Determine grade name from academic history or student profile
                const activeEnrollment = academicHistory.find(r => String(r.academic_year_id) === String(selectedYearId));
                const gradeName = (activeEnrollment?.grade || student?.current_grade || '').toLowerCase();
                const isPrePrimary = ['nursery', 'jr.kg', 'sr.kg'].includes(gradeName);

                if (isPrePrimary) {
                    const [resAttn, resExm, preMarks] = await Promise.all([
                        getStudentAttendanceRecords(student.id, selectedYearId),
                        getStudentExams(student.id, selectedYearId),
                        getPrePrimaryMarks(student.id, null, selectedYearId).catch(() => [])
                    ]);
                    setAttendanceRecords(resAttn);
                    setExams(resExm);
                    setPrePrimaryData(preMarks || []);
                    setPerformanceData([]);
                    setCoScholasticData([]);
                } else {
                    const [resAttn, resExm, perf, coSch] = await Promise.all([
                        getStudentAttendanceRecords(student.id, selectedYearId),
                        getStudentExams(student.id, selectedYearId),
                        getStudentPerformance(student.id, selectedYearId).catch(() => []),
                        getCoScholastic(student.id, selectedYearId).catch(() => [])
                    ]);
                    setAttendanceRecords(resAttn);
                    setExams(resExm);
                    setPerformanceData(perf || []);
                    setCoScholasticData(coSch || []);
                    setPrePrimaryData([]);
                }
            } catch (error) {
                console.error("Error fetching yearly data:", error);
            }
        };
        fetchYearlyData();
    }, [student?.id, student?.current_grade, selectedYearId, academicHistory]);

    // Update Financial Standing card whenever selectedYearId or academicHistory changes
    useEffect(() => {
        if (!academicHistory.length || !selectedYearId) return;
        // Match the selected year record from history (which uses same fee query as Fee Management)
        const yearRecord = academicHistory.find(
            r => String(r.academic_year_id) === String(selectedYearId)
        );
        if (yearRecord) {
            setFeeSummary({
                total_fee:    yearRecord.total_fee    || 0,
                total_paid:   yearRecord.total_paid   || 0,
                pending_fee:  yearRecord.pending_fee  || 0,
                academic_fee: yearRecord.annual_fee   || 0,
                transport_fee: yearRecord.transport_fee || 0,
                total_discount: yearRecord.total_discount || 0,
            });
        } else {
            setFeeSummary(null);
        }
    }, [selectedYearId, academicHistory]);

    const handleAddFee = async (e) => {
        e.preventDefault();
        try {
            await addStudentFee(student.id, {
                ...newFee,
                academic_year_id: selectedYearId,
                payment_date: new Date().toISOString().split('T')[0]
            });
            toast.success("Fee record added successfully");
            setShowFeeModal(false);
            // Refresh fees
            const [payHistory, structures, transportCosts] = await Promise.all([
                getStudentFees(student.id, selectedYearId),
                getFeeStructures(selectedYearId),
                getTransportFees(selectedYearId)
            ]);

            // Recalculate summary
            const activeEnrollment = fullData?.enrollments?.find(e => e.academic_year_id === selectedYearId);
            const studentGrade = activeEnrollment?.grade || fullData?.grade;
            const structure = structures.find(f => String(f.grade).replace(/\D/g, '') === String(studentGrade).replace(/\D/g, ''));
            const requiresTransport = activeEnrollment ? (activeEnrollment.requires_transport === 1 || activeEnrollment.requires_transport === true) : (fullData?.requires_transport === 1 || fullData?.requires_transport === true);
            const transportRange = activeEnrollment ? activeEnrollment.transport_range : fullData?.transport_range;

            const customAcademic = payHistory.find(p => p.fee_type && p.fee_type.toLowerCase().includes('annual'))?.total_payable;
            const annual_fee = customAcademic ? Number(customAcademic) : (
                structure ? (Number(structure.admission_fee || 0) + Number(structure.tuition_fee || 0) + Number(structure.term_fee || 0) + Number(structure.computer_fee || 0) + Number(structure.other_fee || 0)) : 0
            );
            const customTransport = payHistory.find(p => p.fee_type && p.fee_type.toLowerCase().includes('transport'))?.total_payable;
            let transport_fee = 0;
            if (customTransport) transport_fee = Number(customTransport);
            else if (requiresTransport && transportCosts.length > 0) {
                const range = transportRange;
                const tf = transportCosts[0];
                if (range === '0-5km') transport_fee = Number(tf.transport_0_5km || 0);
                else if (range === '5-7km') transport_fee = Number(tf.transport_5_7km || 0);
                else transport_fee = Number(tf.transport_above_7km || 0);
            }
            const total_fee = annual_fee + transport_fee;
            const total_paid = payHistory.reduce((acc, p) => acc + (Number(p.paid_amount) || 0), 0);
            setFeeSummary({
                total_fee,
                total_paid,
                pending_fee: total_fee - total_paid,
                academic_fee: annual_fee,
                transport_fee
            });
        } catch {
            toast.error("Failed to add fee record");
        }
    };

    const printReportRef = React.useRef(null);

    const getNextClass = (currentClass) => {
        if (!currentClass) return '—';
        const name = currentClass.toLowerCase();
        if (name.includes('nursery')) return 'Jr. KG';
        if (name.includes('junior') || name.includes('jr')) return 'Sr. KG';
        if (name.includes('senior') || name.includes('sr')) return '1st';
        if (name.includes('1st') || name.includes('1')) return '2nd';
        if (name.includes('2nd') || name.includes('2')) return '3rd';
        if (name.includes('3rd') || name.includes('3')) return '4th';
        if (name.includes('4th') || name.includes('4')) return '5th';
        if (name.includes('5th') || name.includes('5')) return '6th';
        if (name.includes('6th') || name.includes('6')) return '7th';
        if (name.includes('7th') || name.includes('7')) return '8th';
        if (name.includes('8th') || name.includes('8')) return '9th';
        return 'Next Level';
    };

    const renderReportTemplate = (
        targetYearId = selectedYearId,
        targetAttn = attendanceRecords,
        targetPerf = performanceData,
        targetCoSch = coScholasticData,
        targetPrePrimary = prePrimaryData
    ) => {
        const activeEnrollment = academicHistory.find(r => String(r.academic_year_id) === String(targetYearId));
        const gradeName = (activeEnrollment?.grade || student?.current_grade || '').toLowerCase();
        const studentObj = { 
            ...data, 
            student_name: `${data.last_name || ''} ${data.first_name || ''} ${data.middle_name || ''}`.trim(),
            class_name: activeEnrollment?.grade || student?.current_grade || ''
        };

        if (['nursery', 'jr.kg', 'sr.kg'].includes(gradeName)) {
            return <PrePrimaryReport prePrimaryData={targetPrePrimary} studentData={studentObj} />;
        }

        // Helper stats for 1-8 templates
        const term1Data = targetPerf.filter(m => m.term === 'Term 1' || m.term === 'I Term');
        const term2Data = targetPerf.filter(m => m.term === 'Term 2' || m.term === 'II Term');

        // Calculate Term-wise and Overall Attendance
        let t1Present = 0, t1Total = 0;
        let t2Present = 0, t2Total = 0;

        (targetAttn || []).forEach(row => {
            const date = new Date(row.date);
            const month = date.getMonth();
            const isPresent = ['present', 'late'].includes(row.status?.toLowerCase());
            const isTerm1 = month >= 5 && month <= 9;
            if (isTerm1) {
                t1Total++;
                if (isPresent) t1Present++;
            } else {
                t2Total++;
                if (isPresent) t2Present++;
            }
        });

        const totalPresent = t1Present + t2Present;
        const totalDays = t1Total + t2Total;
        const overallPct = totalDays > 0 ? Math.round((totalPresent / totalDays) * 100) : null;

        const attendance = overallPct !== null ? `${overallPct}%` : '95%';
        const overallGrade = targetPerf.length > 0 ? targetPerf[0].overall_grade : "N/A";
        const overallPercentage = targetPerf.length > 0 ? targetPerf[0].overall_percentage : "N/A";
        const totalMarks = targetPerf.length > 0 ? targetPerf[0].total_marks_obtained : "N/A";

        const currentClassName = activeEnrollment?.grade || data?.current_grade || "";
        const nextClassName = getNextClass(currentClassName);

        const overallStats = {
            totalMarks,
            percentage: overallPercentage,
            grade: overallGrade,
            attendance,
            term1_attendance: t1Total > 0 ? `${t1Present}/${t1Total}` : '88/90',
            term2_attendance: t2Total > 0 ? `${t2Present}/${t2Total}` : '92/95',
            promotedClass: nextClassName,
            reopeningDate: '06/04/2026 at 08:00 am'
        };

        if (['1st', '2nd'].includes(gradeName)) {
            return <PrimaryReport1to2 studentData={studentObj} term1Data={term1Data} term2Data={term2Data} coScholasticData={targetCoSch} overallStats={overallStats} />;
        }

        if (['3rd', '4th', '5th'].includes(gradeName)) {
            return <PrimaryReport3to5 studentData={studentObj} term1Data={term1Data} term2Data={term2Data} coScholasticData={targetCoSch} overallStats={overallStats} />;
        }

        // Default for 6th-8th
        return <MiddleReport6to8 studentData={studentObj} term1Data={term1Data} term2Data={term2Data} coScholasticData={targetCoSch} overallStats={overallStats} />;
    };

    const handlePrintReportCard = (actionType = 'download', printWindow = null) => {
        console.log("[ReportCard] handlePrintReportCard started. actionType:", actionType, "hasPrintWindow:", !!printWindow);
        const content = printReportRef.current;
        if (!content) {
            console.error("[ReportCard] printReportRef.current is null!");
            return;
        }

        console.log("[ReportCard] content innerHTML length:", content.innerHTML.length);

        // Copy all global styles, Tailwind CSS links, and internal styles
        const parentStyles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
            .map(node => node.outerHTML)
            .join('\n');

        const base = window.location.origin;
        const htmlContent = content.innerHTML.replace(/src="\/([^"]+)"/g, `src="${base}/$1"`);

        const targetWindow = printWindow || window.open('', '_blank', 'width=900,height=1200');
        if (!targetWindow) {
            console.error("[ReportCard] printWindow could not be opened/found!");
            return;
        }

        console.log("[ReportCard] writing content to printWindow...");
        targetWindow.document.open();
        targetWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Report Card</title>
                ${parentStyles}
                <style>
                    html, body {
                        background: #ffffff !important;
                        color: #000000 !important;
                        color-scheme: light !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        margin: 0;
                        padding: 0;
                    }
                    * { color-scheme: light !important; box-sizing: border-box; }
                    img { max-width: 100%; }

                    @media print {
                        @page {
                            size: A4 portrait;
                            margin: 2mm 5mm 2mm 5mm !important;
                        }
                        html, body {
                            margin: 0 !important;
                            padding: 0 !important;
                            width: 210mm !important;
                            height: 297mm !important;
                            overflow: hidden !important;
                        }
                        /* Scale down card wrapper so it fits perfectly on exactly 1 page and fills it fully */
                        .bg-white.print\\:m-0 {
                            zoom: 93% !important;
                            margin: 0 auto !important;
                            padding: 14px 20px !important;
                            border: none !important;
                            box-shadow: none !important;
                            width: 100% !important;
                            max-width: 100% !important;
                            height: 297mm !important;
                            min-height: 297mm !important;
                        }
                        /* Increase row heights in tables thodi for more premium look */
                        table th, table td {
                            padding-top: 6.5px !important;
                            padding-bottom: 6.5px !important;
                        }
                        /* Spacing between Term 1 and Term 2 sections */
                        .mb-5, .my-5, .mt-5 {
                            margin-bottom: 22px !important;
                            margin-top: 10px !important;
                        }
                        .mb-4, .my-4, .mt-4 {
                            margin-bottom: 12px !important;
                            margin-top: 8px !important;
                        }
                        table {
                            margin-bottom: 12px !important;
                        }
                        tr, td, th {
                            page-break-inside: avoid !important;
                        }
                    }
                </style>
            </head>
            <body style="background:#ffffff !important; color:#000 !important; color-scheme:light !important;">
                ${htmlContent}
            </body>
            </html>
        `);
        targetWindow.document.close();
        targetWindow.focus();
        console.log("[ReportCard] targetWindow document closed and focused.");

        if (actionType === 'download') {
            console.log("[ReportCard] scheduling targetWindow.print() in 800ms...");
            setTimeout(() => {
                targetWindow.print();
                targetWindow.close();
                console.log("[ReportCard] targetWindow printed and closed.");
            }, 800);
        }
    };

    const handleReportCardAction = async (targetYearId, actionType) => {
        console.log("[ReportCardAction] handleReportCardAction triggered. targetYearId:", targetYearId, "actionType:", actionType);
        if (!student?.id || !targetYearId) {
            console.error("[ReportCardAction] student.id or targetYearId is missing! student.id:", student?.id, "targetYearId:", targetYearId);
            return;
        }

        // 1. Open the popup window synchronously to prevent browser popup blockers
        console.log("[ReportCardAction] Opening printWindow synchronously...");
        const printWindow = window.open('', '_blank', 'width=900,height=1200');
        if (!printWindow) {
            console.error("[ReportCardAction] popup blocked by browser!");
            toast.error("Popup blocked! Please allow popups for this site to view the report card.");
            return;
        }

        // Show premium loading state in the popup
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Loading Report Card...</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                        margin: 0;
                        background: #F8FAFC;
                        color: #001736;
                    }
                    .spinner {
                        width: 48px;
                        height: 48px;
                        border: 4px solid #cbd5e1;
                        border-top: 4px solid #001736;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin-bottom: 24px;
                    }
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    .text {
                        font-weight: 900;
                        text-transform: uppercase;
                        letter-spacing: 0.15em;
                        font-size: 11px;
                        text-align: center;
                    }
                </style>
            </head>
            <body>
                <div class="spinner"></div>
                <div class="text">Synchronizing Academic Registry...</div>
            </body>
            </html>
        `);

        const toastId = toast.loading(`Preparing academic report card...`);
        try {
            console.log("[ReportCardAction] Finding active enrollment in academicHistory...");
            const activeEnrollment = academicHistory.find(r => String(r.academic_year_id || r.year_id) === String(targetYearId));
            console.log("[ReportCardAction] activeEnrollment:", activeEnrollment);
            const gradeName = (activeEnrollment?.grade || student?.current_grade || '').toLowerCase();
            const isPrePrimary = ['nursery', 'jr.kg', 'sr.kg'].includes(gradeName);
            console.log("[ReportCardAction] gradeName:", gradeName, "isPrePrimary:", isPrePrimary);

            let fetchedAttn = [];
            let fetchedPerf = [];
            let fetchedCoSch = [];
            let fetchedPrePrimary = [];

            if (isPrePrimary) {
                console.log("[ReportCardAction] Fetching Pre-Primary data...");
                const [resAttn, preMarks] = await Promise.all([
                    getStudentAttendanceRecords(student.id, targetYearId).catch((err) => { console.warn("Attendance fetch failed:", err.message); return []; }),
                    getPrePrimaryMarks(student.id, null, targetYearId).catch((err) => { console.warn("PrePrimaryMarks fetch failed:", err.message); return []; })
                ]);
                fetchedAttn = resAttn || [];
                fetchedPrePrimary = preMarks || [];
            } else {
                console.log("[ReportCardAction] Fetching Primary/Middle School data...");
                const [resAttn, perf, coSch] = await Promise.all([
                    getStudentAttendanceRecords(student.id, targetYearId).catch((err) => { console.warn("Attendance fetch failed:", err.message); return []; }),
                    getStudentPerformance(student.id, targetYearId).catch((err) => { console.warn("Performance fetch failed:", err.message); return []; }),
                    getCoScholastic(student.id, targetYearId).catch((err) => { console.warn("CoScholastic fetch failed:", err.message); return []; })
                ]);
                fetchedAttn = resAttn || [];
                fetchedPerf = perf || [];
                fetchedCoSch = coSch || [];
            }

            console.log("[ReportCardAction] Setting printTarget state...");
            setPrintTarget({
                yearId: targetYearId,
                attendanceRecords: fetchedAttn,
                performanceData: fetchedPerf,
                coScholasticData: fetchedCoSch,
                prePrimaryData: fetchedPrePrimary
            });

            console.log("[ReportCardAction] Scheduling handlePrintReportCard in 300ms...");
            setTimeout(() => {
                handlePrintReportCard(actionType, printWindow);
                toast.update(toastId, {
                    render: "Report card loaded successfully!",
                    type: "success",
                    isLoading: false,
                    autoClose: 3000
                });
            }, 300);

        } catch (error) {
            console.error("[ReportCardAction] Error loading report card data:", error);
            toast.update(toastId, {
                render: "Failed to fetch report card records.",
                type: "error",
                isLoading: false,
                autoClose: 3000
            });
            if (printWindow) {
                printWindow.document.body.innerHTML = `
                    <div style="font-family: sans-serif; text-align: center; padding: 40px; color: #ef4444;">
                        <h3 style="margin-bottom: 10px;">Failed to Load Report Card</h3>
                        <p style="color: #64748b; font-size: 14px;">An error occurred while synchronizing records. Please check dev console.</p>
                    </div>
                `;
            }
        }
    };

    // const exportToExcel = () => {
    //     const wb = XLSX.utils.book_new();
    //     // Profile Data
    //     const profileWS = XLSX.utils.json_to_sheet([{
    //         "Legal Name": `${data.last_name} ${data.first_name} ${data.middle_name}`.trim(),
    //         "System ID": data.student_id_no,
    //         "Current Grade": data.current_grade,
    //         "Status": data.status,
    //         "Enrollment Date": data.enrollment_date ? new Date(data.enrollment_date).toLocaleDateString() : '---',
    //         "Gender": data.gender,
    //         "DOB": new Date(data.dob).toLocaleDateString(),
    //         "Blood Group": data.blood_group || '---',
    //         "Father Name": data.father_name,
    //         "Father Mobile": data.father_mobile,
    //         "Mother Name": data.mother_name
    //     }]);
    //     XLSX.utils.book_append_sheet(wb, profileWS, "Basic Profile");

    //     // Academic History
    //     const historyWS = XLSX.utils.json_to_sheet(academicHistory.map(rec => ({
    //         "Academic Session": rec.year_name,
    //         "Grade Level": rec.grade,
    //         "Attendance Intensity": (rec.attendance_value || 0).toFixed(1) + '%',
    //         "Financial Clearance": rec.fee_status_label?.toUpperCase(),
    //         "Academic Standing": rec.result?.toUpperCase() || 'N/A'
    //     })));
    //     XLSX.utils.book_append_sheet(wb, historyWS, "Promotion History");

    //     XLSX.writeFile(wb, `${data.student_name.replace(/\s+/g, '_')}_Academic_Portfolio.xlsx`);
    //     toast.success("Excel ledger exported successfully");
    // };

    // const exportToPDF = () => {
    //     const doc = new jsPDF();

    //     // Branding Header
    //     doc.setFillColor(0, 23, 54); // #001736
    //     doc.rect(0, 0, 210, 40, 'F');

    //     doc.setTextColor(255, 255, 255);
    //     doc.setFontSize(22);
    //     doc.setFont("helvetica", "bold");
    //     doc.text("STUDENT ACADEMIC PORTFOLIO", 14, 25);

    //     doc.setFontSize(10);
    //     doc.setFont("helvetica", "normal");
    //     doc.text(`ID: ${data.student_id_no} | PRINTED ON: ${new Date().toLocaleString()}`, 14, 32);

    //     // Student Brief
    //     doc.setTextColor(0, 0, 0);
    //     doc.setFontSize(14);
    //     const fullNameStr = `${data.last_name} ${data.first_name} ${data.middle_name}`.trim().toUpperCase();
    //     doc.text(fullNameStr, 14, 55);

    //     doc.setFontSize(10);
    //     doc.text(`Grade: ${data.current_grade} | Gender: ${data.gender} | DOB: ${new Date(data.dob).toLocaleDateString()}`, 14, 62);
    //     doc.text(`Enrollment: ${data.enrollment_date ? new Date(data.enrollment_date).toLocaleDateString() : 'N/A'} | Blood Group: ${data.blood_group || '---'}`, 14, 68);
    //     doc.text(`Father: ${data.father_name} (${data.father_mobile})`, 14, 74);

    //     // History Table
    //     autoTable(doc, {
    //         startY: 80,
    //         head: [['SESSION', 'GRADE', 'ATTENDANCE', 'FEE STATUS', 'RESULT']],
    //         body: academicHistory.map(rec => [
    //             rec.year_name,
    //             rec.grade,
    //             (rec.attendance_value || 0).toFixed(1) + '%',
    //             rec.fee_status_label?.toUpperCase(),
    //             rec.result?.toUpperCase() || 'PROMOTED'
    //         ]),
    //         styles: { fontSize: 9, cellPadding: 5 },
    //         headStyles: { fillColor: [0, 23, 54], textColor: [255, 182, 6] }, // Navy & Amber
    //         alternateRowStyles: { fillColor: [248, 250, 252] }
    //     });

    //     doc.save(`${data.student_name.replace(/\s+/g, '_')}_Official_PDF.pdf`);
    //     toast.success("Official PDF report generated");
    // };


    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-(--bg-app)">
                <div className="flex flex-col items-center gap-4">
                    <div style={{ borderColor: 'var(--sidebar-bg)', borderTopColor: 'var(--text-accent)' }} className="w-12 h-12 border-4 rounded-full animate-spin"></div>
                    <p style={{ color: 'var(--sidebar-bg)' }} className="font-black uppercase tracking-widest text-xs">Synchronizing Records...</p>
                </div>
            </div>
        );
    }

    const data = { ...student, ...fullData };

    const activeEnrollment = academicHistory.find(
        r => String(r.academic_year_id || r.year_id) === String(selectedYearId)
    );

    const tabs = [
        { id: 'profile', label: 'Basic Profile', icon: User },
        { id: 'academic', label: 'Academic History', icon: GraduationCap },
        { id: 'exams', label: 'Exam Results', icon: Award },
        { id: 'documents', label: 'Document Vault', icon: ShieldCheck }
    ];



    return (
        <div style={{ backgroundColor: 'var(--bg-app)' }} className="min-h-screen p-6 font-medium text-slate-900 pb-20">
            {/* Integrated Institutional Header */}
            <ModuleHeader
                title={`${data.last_name || ''} ${data.first_name || ''}`}
                subTitle={
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-[9px] font-black uppercase text-white tracking-widest px-2.5 py-1 rounded-lg border border-white/20">ID: {data.student_id_no}</span>
                        <span className="text-[9px] font-black uppercase tracking-widest bg-[#FFB606] px-2.5 py-1 rounded-lg border border-amber-500 italic">Class {data.current_grade}</span>
                        <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[9px] font-semibold uppercase tracking-widest text-emerald-400">{data.status}</span>
                        </div>
                    </div>
                }
                leftCustomContent={
                    <div className="flex items-center gap-2 lg:gap-6">
                        <button onClick={onBack} className="p-2 lg:p-3 bg-white hover:bg-[#FFB606] hover:text-[#001736] rounded-xl transition-all border border-white/10 group">
                            <ArrowLeft className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </button>
                        <div className="hidden lg:block w-16 h-16 bg-white/10 rounded-xl border border-white/20 p-1 overflow-hidden shadow-inner shrink-0 group-hover:border-[#FFB606] transition-all">
                            {data.doc_passport_photo ? (
                                <img
                                    src={`${ROOT_URL}/${data.doc_passport_photo.replace(/\\/g, '/')}`}
                                    className="w-full h-full object-cover rounded-lg"
                                    alt="Profile"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-white/10">
                                    <User className="w-6 h-6 text-[#FFB606]" />
                                </div>
                            )}
                        </div>
                    </div>
                }
                toggleSidebar={() => { }} // Controlled by parent
                customYearSelector={true}
                selectedYearId={selectedYearId}
                allYears={academicYears}
                onYearChange={(year) => setSelectedYearId(year?.id)}
            >
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-2xl border border-white/10">
                        {data.status === 'active' && isInstitutionalRole && (
                            <button onClick={handleArchiveLocal} className="p-3 bg-amber-500 text-[#001736] rounded-xl hover:bg-amber-600 transition-all" title="Archive to Alumni">
                                <GraduationCap className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </ModuleHeader>

            {/* Navigation Navigation */}
            <div className="max-w-7xl mx-auto flex gap-1 mb-8 bg-white p-1 rounded-xl shadow-sm sticky top-0 z-20 overflow-x-auto no-scrollbar">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-3 text-[12px] font-black rounded-lg transition-all whitespace-nowrap ${activeTab === tab.id
                            ? 'text-white shadow-md'
                            : 'text-black hover:bg-slate-50'
                            }`}
                        style={activeTab === tab.id ? { backgroundColor: 'var(--sidebar-bg)' } : {}}
                    >
                        <tab.icon className={`w-3.5 h-3.5 ${activeTab === tab.id ? 'text-(--text-accent)' : ''}`} />
                        {tab.label.toUpperCase()}
                    </button>
                ))}
            </div>

            {/* NEW: Institutional Summary Bar (Requested by Management) */}
            <div className="max-w-7xl mx-auto mb-8">
                <div style={{ borderColor: 'var(--border-layout)' }} className="grid grid-cols-2 md:grid-cols-6 gap-0 bg-white rounded-2xl border-2 shadow-sm overflow-hidden divide-x-2 divide-slate-100">
                    <div className="p-4 flex flex-col items-center justify-center text-center group hover:bg-slate-50 transition-all">
                        <p className="text-[10px] font-black text-black uppercase tracking-widest mb-1">Admission Date</p>
                        <p style={{ color: 'var(--sidebar-bg)' }} className="text-xs font-black uppercase">{data.enrollment_date ? new Date(data.enrollment_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '---'}</p>
                    </div>
                    <div className="p-4 flex flex-col items-center justify-center text-center group hover:bg-slate-50 transition-all">
                        <p className="text-[10px] font-black text-black uppercase tracking-widest mb-1">Student System ID</p>
                        <p style={{ color: 'var(--sidebar-bg)' }} className="text-xs font-black uppercase">{data.student_id_no || '---'}</p>
                    </div>
                    <div className="p-4 flex flex-col items-center justify-center text-center group hover:bg-slate-50 transition-all">
                        <p className="text-[10px] font-black text-black uppercase tracking-widest mb-1">GR. No (General)</p>
                        <p style={{ color: 'var(--sidebar-bg)' }} className="text-sm font-black italic">{data.gr_no || 'NOT ASSIGNED'}</p>
                    </div>
                    <div className="p-4 flex flex-col items-center justify-center text-center group hover:bg-slate-50 transition-all">
                        <p className="text-[10px] font-black text-black uppercase tracking-widest mb-1">PEN ID Number</p>
                        <p style={{ color: 'var(--sidebar-bg)' }} className="text-sm font-black italic">{data.pen_no || 'NOT ASSIGNED'}</p>
                    </div>
                    <div className="p-4 flex flex-col items-center justify-center text-center group hover:bg-slate-50 transition-all">
                        <p className="text-[10px] font-black text-black uppercase tracking-widest mb-1">UID (Aadhar NO)</p>
                        <div className="flex items-center gap-2">
                            <p style={{ color: 'var(--sidebar-bg)' }} className="text-sm font-black uppercase tracking-tighter">{data.aadhar_no || data.aadhar || '---'}</p>
                            <ShieldCheck className="w-3 h-3 text-emerald-500" />
                        </div>
                    </div>
                    <div className="p-4 flex flex-col items-center justify-center text-center group hover:bg-slate-50 transition-all col-span-2 md:col-span-1 border-t-2 md:border-t-0">
                        <p className="text-[10px] font-black text-black uppercase tracking-widest mb-1">Calculated Age</p>
                        <p style={{ color: 'var(--sidebar-bg)' }} className="text-sm font-black">{calculateAge(data.dob)} Years</p>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto">
                {/* 1. BASIC PROFILE - COMPREHENSIVE VIEW */}
                {activeTab === 'profile' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        {/* Upper Grill: Personal & Family */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Personal Core Identity */}
                            <div className="bg-white rounded-xl border border-institutional shadow-sm overflow-hidden flex flex-col">
                                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                    <h3 className="text-sm font-black text-[#001736] uppercase tracking-widest flex items-center gap-3">
                                        <div className="p-1.5 bg-indigo-500 rounded-lg"><User className="w-3.5 h-3.5 text-white" /></div>
                                        Student Details
                                    </h3>
                                    <span className="text-[9px] font-bold bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full uppercase italic">Verified</span>
                                </div>
                                <div className="p-8 grow">
                                    {/* Mobile/Desktop Profile Image Section */}
                                    <div className="flex flex-col md:flex-row items-center gap-8 mb-10 pb-8 border-b border-slate-100">
                                        <div className="w-32 h-32 md:w-40 md:h-40 bg-slate-50 rounded-2xl border-2 border-slate-200 p-1.5 shadow-inner overflow-hidden shrink-0 group">
                                            {data.doc_passport_photo ? (
                                                <img
                                                    src={`${ROOT_URL}/${data.doc_passport_photo.replace(/\\/g, '/')}`}
                                                    className="w-full h-full object-cover rounded-xl group-hover:scale-110 transition-transform duration-500"
                                                    alt="Student Profile"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-slate-100 rounded-xl">
                                                    <User className="w-12 h-12 text-slate-300" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-center md:items-start text-center md:text-left">
                                            <h2 className="text-2xl font-black text-[#001736] uppercase tracking-tight leading-none mb-2">
                                                {data.first_name} {data.middle_name} {data.last_name}
                                            </h2>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Master Institutional Record</p>
                                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                                                <span className="px-3 py-1.5 bg-institutional-main text-white text-[9px] font-black rounded-lg uppercase tracking-widest italic">GR NO: {data.gr_no || '---'}</span>
                                                <span className="px-3 py-1.5 bg-amber-400 text-institutional-main text-[9px] font-black rounded-lg uppercase tracking-widest italic">ROLL NO: {activeEnrollment?.roll_number || data.roll_number || '---'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                        <DataField label="Last Name (Surname)" value={data.last_name} icon={User} />
                                        <DataField label="First Name" value={data.first_name} icon={User} />
                                        <DataField label="Father Name (Middle)" value={data.middle_name} icon={Users} />
                                        {/* <DataField label="Student ID No" value={data.student_id_no} icon={Hash} /> */}

                                        <DataField label="Date of Birth" value={data.dob ? new Date(data.dob).toLocaleDateString('en-GB') : '---'} icon={Calendar} />
                                        {/* <DataField label="Enrollment Date" value={data.enrollment_date ? new Date(data.enrollment_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : '---'} icon={Clock} /> */}

                                        <DataField label="Gender" value={data.gender} icon={User} isCaps />
                                        <DataField label="Place of Birth" value={data.pob} icon={MapPin} />

                                        <div className="md:col-span-2 grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                            <DataField label="Religion" value={data.religion} icon={BookMarked} />
                                            <DataField label="Caste" value={data.caste} icon={ShieldCheck} />
                                            <DataField label="Sub-Caste" value={data.subcaste || 'Gen'} icon={ShieldCheck} />
                                        </div>

                                        <DataField label="Blood Group" value={data.blood_group || 'Not Specified'} icon={Heart} />
                                        <DataField label="Medical Condition" value={data.medical_condition || 'None Declared'} icon={AlertCircle} />
                                        <DataField label="Aadhar Identity" value={data.aadhar_no || data.aadhar} icon={ShieldCheck} />
                                        <DataField label="Mother Tongue" value={data.mother_tongue} icon={Users} />
                                    </div>
                                </div>
                            </div>

                            {/* Column 2: Institutional Requirements & Parental Matrix Staked */}
                            <div className="space-y-4 flex flex-col">
                                {/* Compact Logistics Card */}
                                <div className="bg-white rounded-xl border border-institutional shadow-sm overflow-hidden">
                                    <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                        <h3 className="text-[12px] font-black text-[#001736] uppercase tracking-[0.2em] flex items-center gap-2">
                                            <Truck className="w-3.5 h-3.5 text-amber-500" />
                                            School Bus Required ?
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[12px] font-black px-6 py-3 rounded-md uppercase border ${data.requires_transport ? 'text-institutional-main' : 'text-institutional-main'}`}>
                                                {data.requires_transport ? 'YES' : 'NO'}
                                            </span>
                                        </div>
                                    </div>
                                    {Number(data.requires_transport) === 1 && (
                                        <div className="px-6 py-3 bg-white flex items-center justify-between">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-institutional-main">Active Distance Range</p>
                                            <p className="text-[13px] font-black text-amber-600 uppercase italic">{data.transport_range || 'Standard'}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Parental Matrix */}
                                <div className="bg-white rounded-xl border border-institutional shadow-sm overflow-hidden flex flex-col">
                                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                        <h3 className="text-sm font-black text-[#001736] uppercase tracking-widest flex items-center gap-3">
                                            <div className="p-1.5 bg-rose-500 rounded-lg"><Users className="w-3.5 h-3.5 text-white" /></div>
                                            Parental Details
                                        </h3>
                                        <span className="text-[9px] font-semibold bg-slate-100 text-slate-500 px-3 py-1 rounded-full uppercase">Authorized</span>
                                    </div>
                                    <div className="p-6 grow text-left">
                                        <div className="grid grid-cols-1 gap-8">
                                            {/* Father Information */}
                                            <div className="space-y-4">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-[#001736] ml-1">FATHER'S RECORD</p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                                    <DataField label="Full Name" value={data.father_name} icon={User} />
                                                    <DataField label="Mobile / Primary" value={data.father_mobile} icon={Phone} />
                                                    <DataField label="Occupation" value={data.father_occupation} icon={Briefcase} />
                                                    <DataField label="Official Email" value={data.father_email} icon={Mail} />
                                                </div>
                                            </div>
                                            <hr className="border-slate-100" />
                                            {/* Mother Information */}
                                            <div className="space-y-4">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-[#001736] ml-1">MOTHER'S RECORD</p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                                    <DataField label="Full Name" value={data.mother_name} icon={User} />
                                                    <DataField label="Mobile / Secondary" value={data.mother_mobile} icon={Phone} />
                                                    <DataField label="Occupation" value={data.mother_occupation} icon={Briefcase} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Lower Grill: Address & Prev Education */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Residential Information */}
                            <div className="bg-white rounded-xl border border-institutional shadow-sm overflow-hidden flex flex-col">
                                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                    <h3 className="text-[11px] font-semibold text-[#001736] uppercase tracking-widest flex items-center gap-3">
                                        <div className="p-1.5 bg-emerald-500 rounded-lg"><MapPin className="w-3.5 h-3.5 text-white" /></div>
                                        Residential Address
                                    </h3>
                                </div>
                                <div className="p-6 grow">
                                    <div className="grid grid-cols-1 gap-4">
                                        <DataField label="Housing Address" value={data.residential_address || data.address} fullWidth icon={MapPin} />
                                        <div className="grid grid-cols-2 gap-4">
                                            <DataField label="Pincode" value={data.pincode} icon={MapPin} />
                                            <DataField label="Taluka/Block" value={data.taluka} icon={MapPin} />
                                            <DataField label="District/City" value={data.district} icon={MapPin} />
                                            <DataField label="State / Region" value={data.state} icon={MapPin} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Previous Academic Ledger */}
                            <div className="lg:col-span-2 bg-white rounded-xl border border-institutional shadow-sm overflow-hidden flex flex-col">
                                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                    <h3 className="text-[11px] font-semibold text-[#001736] uppercase tracking-widest flex items-center gap-3">
                                        <div className="p-1.5 bg-amber-500 rounded-lg"><GraduationCap className="w-3.5 h-3.5 text-white" /></div>
                                        Pre-Admission History
                                    </h3>
                                </div>
                                <div className="p-6 grow">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                        <div className="md:col-span-2">
                                            <DataField label="Last Institution Attended" value={data.prev_school} icon={ShieldCheck} fullWidth />
                                        </div>
                                        <DataField label="Grade Level" value={data.prev_class} icon={GraduationCap} />
                                        <DataField label="Education Board" value={data.prev_board} icon={GraduationCap} />
                                        <DataField label="Year of Departure" value={data.prev_year} icon={Calendar} />
                                        <DataField label="Aggregate Efficiency" value={`${data.prev_percentage}%`} icon={Award} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. ACADEMIC RECORDS - MERGED VIEW */}
                {activeTab === 'academic' && (
                    <div className="space-y-10 animate-in slide-in-from-bottom duration-500">
                        {/* Current Session Dashboard Hub */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {/* 1. ATTENDANCE ANALYTICS */}
                            <div className="bg-white rounded-xl border border-institutional shadow-sm p-8 flex flex-col justify-between group hover:border-emerald-500 transition-all">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100"><CheckCircle2 className="w-6 h-6" /></div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-emerald-600">{attendanceRecords.length > 0 ? ((attendanceRecords.filter(a => a.status === 'present').length / attendanceRecords.length) * 100).toFixed(1) + '%' : '0%'}</p>
                                        <p className="text-[9px] font-semibold text-slate-300 uppercase tracking-widest mt-1 italic">Annual Persistence</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-[11px] font-black text-[#001736] uppercase tracking-widest">Attendance Engagement</h4>
                                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-institutional">
                                        <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${(attendanceRecords.filter(a => a.status === 'present').length / (attendanceRecords.length || 1)) * 100}%` }}></div>
                                    </div>
                                    <div className="flex justify-between text-[9px] font-black uppercase text-slate-400">
                                        <span>{attendanceRecords.filter(a => a.status === 'present').length} Present</span>
                                        <span>Session Total: {attendanceRecords.length}</span>
                                    </div>
                                </div>
                            </div>

                            {/* 2. ACADEMIC EFFICIENCY (EXAMS) */}
                            <div className="bg-white rounded-xl border border-institutional shadow-sm p-8 flex flex-col justify-between group hover:border-indigo-500 transition-all">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100"><Award className="w-6 h-6" /></div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-indigo-600">
                                            {exams.length > 0 ? (exams.reduce((acc, ex) => acc + (Number(ex.obtained_marks) / Number(ex.total_marks)), 0) / exams.length * 100).toFixed(1) + '%' : 'N/A'}
                                        </p>
                                        <p className="text-[9px] font-semibold text-black uppercase tracking-widest mt-1 italic">Batch Efficiency</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-[11px] font-semibold text-[#001736] uppercase tracking-widest">Assessment Aggregate</h4>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-institutional">
                                        <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${exams.length > 0 ? (exams.reduce((acc, ex) => acc + (Number(ex.obtained_marks) / Number(ex.total_marks)), 0) / exams.length * 100) : 0}%` }}></div>
                                    </div>
                                    <div className="flex justify-between text-[9px] font-semibold uppercase text-slate-400">
                                        <span>{exams.length} Reports Logged</span>
                                        <span className="text-indigo-600">Excellent</span>
                                    </div>
                                </div>
                            </div>

                            {/* 3. FINANCIAL STANDING */}
                            <div className="bg-[#001736] rounded-xl border border-black shadow-lg p-8 flex flex-col justify-between text-white! relative overflow-hidden group hover:shadow-xl transition-all">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-amber-400/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>
                                <div className="flex items-center justify-between mb-6 relative z-10">
                                    <div className="p-3 bg-amber-400 text-[#001736] rounded-xl border border-black"><CreditCard className="w-6 h-6" /></div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-semibold uppercase tracking-widest mb-1">Total Fee</p>
                                        <h3 className="text-sm font-bold text-white! italic">₹{formatCurrency(feeSummary?.total_fee)}</h3>
                                    </div>
                                </div>
                                <div className="space-y-4 relative z-10">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[9px] font-semibold uppercase tracking-widest  mb-1">Pending Fee</p>
                                            <h3 className="text-xl font-bold text-white! tracking-tight">₹{formatCurrency(feeSummary?.pending_fee)}</h3>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-semibold uppercase tracking-widest  mb-1">Paid Fee</p>
                                            <h3 className="text-sm font-bold text-white! italic">₹{formatCurrency(feeSummary?.total_paid)}</h3>
                                        </div>
                                    </div>
                                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden border border-white/5">
                                        <div className="h-full bg-amber-400 transition-all duration-1000" style={{ width: `${((feeSummary?.total_paid || 0) / (feeSummary?.total_fee || 1)) * 100}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Historical Record Table */}
                        <div className="bg-white  shadow-sm overflow-hidden animate-in zoom-in-95 duration-500">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                <h3 className="text-[11px] font-semibold text-[#001736] uppercase tracking-widest flex items-center gap-4">
                                    <GraduationCap className="w-5 h-5 text-indigo-500" /> Promotion History Ledger
                                </h3>
                                <button className="flex items-center gap-2 px-4 py-2 bg-[#001736] text-white text-[9px] font-semibold uppercase tracking-widest rounded-lg hover:bg-black transition-all">
                                    <Printer className="w-3.5 h-3.5" /> Export Transcript
                                </button>
                            </div>
                            <div className="p-0">
                                <DataTable
                                    headers={[
                                        { label: 'Academic Year' },
                                        { label: 'Class Grade', className: 'text-center' },
                                        { label: 'Performance (%)', className: 'text-center' },
                                        { label: 'Attendance Intensity', className: 'text-center' },
                                        { label: 'Paid Fee', className: 'text-center' },
                                        { label: 'Pending Fee', className: 'text-center' },
                                        { label: 'Status', className: 'text-center' }
                                    ]}
                                    columnCount={7}
                                    emptyMessage="No Historical Data Found"
                                >
                                    {academicHistory.map((rec, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors group text-sm">
                                            <td className="px-2 py-4 border-r border-b font-semibold text-[#001736]">Batch {rec.year_name}</td>
                                            <td className="px-2 py-4 border-r border-b text-center">
                                                <span className="bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-lg border border-indigo-100 uppercase text-[9px] font-semibold tracking-widest">{rec.grade}</span>
                                            </td>
                                            <td className="px-2 py-4 border-r border-b border-black text-center font-semibold text-indigo-600">
                                                {rec.performance_average ? rec.performance_average.toFixed(1) : (rec.attendance_value || 0).toFixed(1)}%
                                            </td>
                                            <td className="px-2 py-4 border-r border-b text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="font-semibold text-[#001736]">{rec.attendance_value ? rec.attendance_value.toFixed(1) + '%' : 'N/A'}</span>
                                                    <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-emerald-500" style={{ width: `${rec.attendance_value || 0}%` }}></div>
                                                    </div>
                                                </div>
                                            </td>
                                            {/* Paid Fee – matches Fee Management ledger */}
                                            <td className="px-2 py-4 border-r border-b text-center">
                                                <div className="flex flex-col items-center gap-0.5">
                                                    <span className="font-bold text-emerald-600">₹{(rec.total_paid || 0).toLocaleString('en-IN')}</span>
                                                    {rec.total_fee > 0 && (
                                                        <span className="text-[8px] text-slate-400 uppercase tracking-widest">of ₹{(rec.total_fee || 0).toLocaleString('en-IN')}</span>
                                                    )}
                                                </div>
                                            </td>
                                            {/* Pending Fee – matches Fee Management Balance column */}
                                            <td className="px-2 py-4 border-r border-b text-center">
                                                <span className={`font-bold ${ rec.pending_fee <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    ₹{(rec.pending_fee || 0).toLocaleString('en-IN')}
                                                </span>
                                            </td>
                                            <td className="px-2 py-4 border-r border-b border-black text-center">
                                                <div className={`px-4 py-1.5 rounded-lg border text-[9px] font-semibold uppercase tracking-widest inline-block ${
                                                    rec.enrollment_status === 'active'
                                                        ? 'bg-blue-50 text-blue-600 border-blue-100'
                                                        : rec.result === 'pass'
                                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                            : 'bg-amber-50 text-amber-600 border-amber-100'
                                                    }`}>
                                                    {rec.enrollment_status === 'active' ? 'ACTIVE' : (rec.result || 'PROMOTED')}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </DataTable>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. EXAM RESULTS */}
                {activeTab === 'exams' && (
                    <div className="bg-white rounded-3xl border border-institutional shadow-sm overflow-hidden animate-in fade-in duration-500">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <h3 className="text-[11px] font-semibold text-[#001736] uppercase tracking-widest flex items-center gap-4">
                                <Award className="w-4 h-4 text-amber-500" /> Examination Ledger
                            </h3>
                        </div>
                        <div className="p-0">
                            <DataTable
                                headers={[
                                    { label: 'Academic Year', className: 'text-center' },
                                    { label: 'Grade', className: 'text-center' },
                                    { label: 'Action', className: 'text-center' }
                                ]}
                                columnCount={3}
                                emptyMessage="No Exam Records Found"
                            >
                                {academicHistory.map((rec, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors text-sm">
                                        <td className="px-6 py-4 font-black text-slate-700 border-b-table border-r-table text-center">
                                            Batch {rec.year_name}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-indigo-700 border-b-table border-r-table text-center">
                                            <span className="bg-indigo-50 px-3 py-1 rounded-md border border-indigo-100 font-black text-[10px]">{rec.grade}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center border-b-table border-r-table">
                                            <div className="flex items-center justify-center gap-3">
                                                <button
                                                    onClick={() => handleReportCardAction(rec.academic_year_id || rec.year_id, 'view')}
                                                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-[#001736] hover:text-white text-[10px] font-black uppercase tracking-widest rounded-lg border border-indigo-100 transition-all shadow-sm active:scale-95"
                                                >
                                                    <Eye className="w-3.5 h-3.5" /> View
                                                </button>
                                                <button
                                                    onClick={() => handleReportCardAction(rec.academic_year_id || rec.year_id, 'download')}
                                                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-100 transition-all shadow-sm active:scale-95"
                                                >
                                                    <Download className="w-3.5 h-3.5" /> Download
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </DataTable>
                        </div>
                    </div>
                )}



                {/* 6. DOCUMENT VAULT */}
                {activeTab === 'documents' && (
                    <div className="bg-white rounded-xl border border-institutional shadow-md p-8 lg:p-8 animate-in zoom-in-95 duration-500">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12 border-b border-slate-100 pb-8">
                            <div>
                                <h3 className="text-xl font-bold text-[#001736] uppercase tracking-wider flex items-center gap-4">
                                    <ShieldCheck className="w-6 h-6 text-indigo-500" /> Student Documents
                                </h3>
                                <p className="text-[10px] font-semibold text-slate-400 mt-1.5 uppercase tracking-widest italic">Secure document storage for student records</p>
                            </div>
                            {/* <button
                                onClick={exportToPDF}
                                className="flex items-center gap-3 px-6 py-3 bg-[#001736] text-[#FFB606] text-xs font-semibold uppercase tracking-widest rounded-xl border border-black hover:bg-black transition-all shadow-md group"
                            >
                                <Download className="w-4 h-4 group-hover:animate-bounce" /> GENERATE REPORT
                            </button> */}
                        </div>

                        <div className="overflow-hidden border border-institutional rounded-xl bg-slate-50/50">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-[#001736] text-[#FFB606]">
                                        <th className="px-8 py-4 text-[11px] font-semibold uppercase tracking-wider">Asset Description</th>
                                        <th className="px-8 py-4 text-[11px] font-semibold uppercase tracking-wider text-center">Status</th>
                                        <th className="px-8 py-4 text-[11px] font-semibold uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {[
                                        { name: "Passport Photo", path: data.doc_passport_photo, icon: User },
                                        { name: "Birth Certificate", path: data.doc_birth_cert, icon: FileText },
                                        { name: "Leaving Certificate", path: data.doc_leaving_cert, icon: Award },
                                        { name: "Caste Certificate", path: data.doc_caste_cert, icon: ShieldCheck },
                                        { name: "Aadhar Card Copy", path: data.doc_aadhar_copy, icon: Hash }
                                    ].map((doc, i) => (
                                        <tr key={i} className="hover:bg-slate-50 transition-colors text-sm">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-3 rounded-lg border border-institutional shadow-xs ${doc.path ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-300'}`}>
                                                        <doc.icon className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-700 uppercase tracking-tight text-[13px]">{doc.name}</p>
                                                        <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">SECURE DIGITAL ASSET</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                {doc.path ? (
                                                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-md border border-emerald-100 text-[10px] font-semibold uppercase tracking-wider">
                                                        <CheckCircle2 className="w-3 h-3" /> Synchronized
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 text-rose-400 rounded-md border border-rose-100 text-[10px] font-semibold uppercase tracking-wider opacity-60">
                                                        <AlertCircle className="w-3 h-3" /> Missing
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {doc.path ? (
                                                        <>
                                                            <a
                                                                href={`${ROOT_URL}/${doc.path.replace(/\\/g, '/')}`}
                                                                target="_blank"
                                                                className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100 hover:bg-[#001736] hover:text-white transition-all shadow-xs"
                                                                title="View"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </a>
                                                            <a
                                                                href={`${ROOT_URL}/${doc.path.replace(/\\/g, '/')}`}
                                                                download
                                                                className="p-2 bg-amber-50 text-amber-600 rounded-lg border border-amber-100 hover:bg-amber-400 hover:text-[#001736] transition-all shadow-xs"
                                                                title="Download"
                                                            >
                                                                <Download className="w-4 h-4" />
                                                            </a>
                                                        </>
                                                    ) : (
                                                        <button disabled className="p-2 bg-slate-50 text-slate-200 rounded-lg border border-slate-100 cursor-not-allowed">
                                                            <Clock className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            {showFeeModal && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-6 backdrop-blur-sm bg-black/30 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-xl border border-institutional shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-slate-100 bg-[#001736] text-white flex items-center justify-between">
                            <h3 className="text-lg font-semibold uppercase tracking-wider flex items-center gap-3">
                                <CreditCard className="w-5 h-5 text-amber-400" /> Fee Transaction
                            </h3>
                            <button onClick={() => setShowFeeModal(false)} className="p-2 bg-white/10 hover:bg-rose-500 rounded-lg transition-all">
                                <Plus className="w-5 h-5 rotate-45" />
                            </button>
                        </div>
                        <form onSubmit={handleAddFee} className="p-6 space-y-6 text-left">
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 ml-0.5">Category</label>
                                    <select
                                        required
                                        className="w-full px-4 py-3 bg-slate-50 border border-institutional rounded-lg font-semibold text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                                        value={newFee.fee_type}
                                        onChange={(e) => setNewFee({ ...newFee, fee_type: e.target.value })}
                                    >
                                        <option value="">Select Fee Type</option>
                                        <option value="Tuition Fee">Tuition Fee</option>
                                        <option value="Admission Fee">Admission Fee</option>
                                        <option value="Examination Fee">Examination Fee</option>
                                        <option value="Transport Fee">Transport Fee</option>
                                        <option value="Misc Fee">Misc Fee</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 ml-0.5">Due (₹)</label>
                                        <input
                                            type="number" required
                                            className="w-full px-4 py-3 bg-slate-50 border border-institutional rounded-lg font-semibold text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                                            value={newFee.total_amount}
                                            onChange={(e) => setNewFee({ ...newFee, total_amount: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 ml-0.5">Paid (₹)</label>
                                        <input
                                            type="number" required
                                            className="w-full px-4 py-3 bg-slate-50 border border-institutional rounded-lg font-semibold text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                                            value={newFee.paid_amount}
                                            onChange={(e) => setNewFee({ ...newFee, paid_amount: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 ml-0.5">Status</label>
                                        <select
                                            required
                                            className="w-full px-4 py-3 bg-slate-50 border border-institutional rounded-lg font-semibold text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                                            value={newFee.status}
                                            onChange={(e) => setNewFee({ ...newFee, status: e.target.value })}
                                        >
                                            <option value="partial">Partial</option>
                                            <option value="paid">Paid</option>
                                            <option value="unpaid">Unpaid</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 ml-0.5">Notes</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 bg-slate-50 border border-institutional rounded-lg font-semibold text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                                            placeholder="Remarks"
                                            value={newFee.remarks}
                                            onChange={(e) => setNewFee({ ...newFee, remarks: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-[#001736] text-white py-4 rounded-lg font-bold text-sm hover:bg-black transition-all flex items-center justify-center gap-3">
                                <CreditCard className="w-4 h-4 text-amber-400" /> CONFIRM RECORD
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT PROFILE MODAL */}
            {showEditModal && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-6 backdrop-blur-sm bg-black/40 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl border border-institutional shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-100 bg-[#001736] text-white flex items-center justify-between shrink-0">
                            <div>
                                <h3 className="text-xl font-bold uppercase tracking-widest flex items-center gap-4">
                                    <Edit3 className="w-6 h-6 text-amber-400" /> Modify Academic Portfolio
                                </h3>
                            </div>
                            <button onClick={() => setShowEditModal(false)} className="p-3 bg-white/10 hover:bg-rose-500 rounded-2xl transition-all border border-white/10 group">
                                <Plus className="w-6 h-6 rotate-45 group-hover:scale-110" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateProfile} className="p-10 overflow-y-auto space-y-10 custom-scrollbar text-left">
                            {/* Section 1: Core Identity */}
                            <div className="space-y-6">
                                <p style={{ color: 'var(--sidebar-bg)', borderColor: 'var(--sidebar-bg)' }} className="text-sm font-black uppercase tracking-[0.2em] border-l-4 pl-4">I. Student Details</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <ModalField label="Last Name" value={editForm.last_name} onChange={(v) => setEditForm({ ...editForm, last_name: v })} />
                                    <ModalField label="First Name" value={editForm.first_name} onChange={(v) => setEditForm({ ...editForm, first_name: v })} />
                                    <ModalField label="Middle Name" value={editForm.middle_name} onChange={(v) => setEditForm({ ...editForm, middle_name: v })} />

                                    <ModalField label="Date of Birth" type="date" value={editForm.dob} onChange={(v) => setEditForm({ ...editForm, dob: v })} />
                                    <div className="space-y-1 items-start flex flex-col">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-black ml-1">Gender</label>
                                        <select style={{ borderColor: 'var(--border-layout)' }} className="w-full px-4 py-4 bg-slate-50 border-2 rounded-xl font-bold text-sm outline-none focus:border-(--text-accent) transition-all" value={editForm.gender} onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}>
                                            <option value="male">MALE</option>
                                            <option value="female">FEMALE</option>
                                            <option value="other">OTHER</option>
                                        </select>
                                    </div>
                                    <ModalField label="UID (Aadhar No)" value={editForm.aadhar_no} onChange={(v) => { const val = v.replace(/\D/g, '').slice(0, 12); setEditForm({ ...editForm, aadhar_no: val }) }} disabled={!isInstitutionalRole} />
                                    <ModalField label="General Register (GR) No" value={editForm.gr_no} onChange={(v) => { const val = v.replace(/\D/g, '').slice(0, 10); setEditForm({ ...editForm, gr_no: val }) }} disabled={!isInstitutionalRole} />
                                    <ModalField label="PEN Identification No" value={editForm.pen_no} onChange={(v) => { const val = v.replace(/\D/g, '').slice(0, 10); setEditForm({ ...editForm, pen_no: val }) }} disabled={!isInstitutionalRole} />

                                    <ModalField label="Place of Birth" value={editForm.pob} onChange={(v) => setEditForm({ ...editForm, pob: v })} />
                                    <ModalField label="Mother Tongue" value={editForm.mother_tongue} onChange={(v) => setEditForm({ ...editForm, mother_tongue: v })} />
                                    <ModalField label="Blood Group" value={editForm.blood_group} onChange={(v) => setEditForm({ ...editForm, blood_group: v })} />
                                </div>
                            </div>

                            {/* Section 2: Residential Info */}
                            <div className="space-y-6">
                                <p style={{ color: 'var(--sidebar-bg)', borderColor: 'var(--sidebar-bg)' }} className="text-[10px] font-black uppercase tracking-[0.2em] border-l-4 pl-4">II. Housing & Location</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="md:col-span-2">
                                        <ModalField label="Residential Address" value={editForm.residential_address} onChange={(v) => setEditForm({ ...editForm, residential_address: v })} />
                                    </div>
                                    <ModalField label="Pincode" value={editForm.pincode} onChange={(v) => setEditForm({ ...editForm, pincode: v })} />
                                    <ModalField label="Taluka/Block" value={editForm.taluka} onChange={(v) => setEditForm({ ...editForm, taluka: v })} />
                                    <ModalField label="District/City" value={editForm.district} onChange={(v) => setEditForm({ ...editForm, district: v })} />
                                    <ModalField label="State / Region" value={editForm.state} onChange={(v) => setEditForm({ ...editForm, state: v })} />
                                </div>
                            </div>

                            {/* Section 3: Logistics Requirement Card (Consistent Mini) */}
                            <div className="space-y-4">
                                <div className="p-4 bg-white rounded-2xl border border-institutional flex items-center justify-between shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 bg-amber-500 rounded-lg text-white">
                                            <Truck className="w-4 h-4" />
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">School Bus Service Required?</p>
                                    </div>
                                    <div className={`px-8 py-2 rounded-xl text-xs font-black border-2 transition-all ${editForm.requires_transport ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white border-slate-100 text-slate-300'}`}>
                                        {editForm.requires_transport ? 'YES' : 'NO'}
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Guardian Matrix */}
                            <div className="space-y-6">
                                <p style={{ color: 'var(--sidebar-bg)', borderColor: 'var(--sidebar-bg)' }} className="text-sm font-black uppercase tracking-[0.2em] border-l-4 pl-4">III. Primary Guardian Records</p>
                                <div style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-layout)' }} className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 rounded-3xl border">
                                    <div className="space-y-4">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">FATHER'S DATA</p>
                                        <ModalField label="Name" value={editForm.father_name} onChange={(v) => setEditForm({ ...editForm, father_name: v })} />
                                        <ModalField label="Mobile" value={editForm.father_mobile} onChange={(v) => setEditForm({ ...editForm, father_mobile: v })} />
                                        <ModalField label="Email" value={editForm.father_email} onChange={(v) => setEditForm({ ...editForm, father_email: v })} />
                                        <ModalField label="Occupation" value={editForm.father_occupation} onChange={(v) => setEditForm({ ...editForm, father_occupation: v })} />
                                    </div>
                                    <div className="space-y-4">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">MOTHER'S DATA</p>
                                        <ModalField label="Name" value={editForm.mother_name} onChange={(v) => setEditForm({ ...editForm, mother_name: v })} />
                                        <ModalField label="Mobile" value={editForm.mother_mobile} onChange={(v) => setEditForm({ ...editForm, mother_mobile: v })} />
                                        <ModalField label="Occupation" value={editForm.mother_occupation} onChange={(v) => setEditForm({ ...editForm, mother_occupation: v })} />
                                    </div>
                                </div>
                            </div>

                            {/* Section 4: Academic Standing */}
                            <div className="space-y-6 pb-10">
                                <p style={{ color: 'var(--sidebar-bg)', borderColor: 'var(--sidebar-bg)' }} className="text-sm font-black uppercase tracking-[0.2em] border-l-4 pl-4">IV. Academic Standing</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <ModalField label="Current Grade" value={editForm.current_grade} onChange={(v) => setEditForm({ ...editForm, current_grade: v })} />
                                    <div className="space-y-1 items-start flex flex-col">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-black ml-1">Status</label>
                                        <select style={{ borderColor: 'var(--border-layout)' }} className="w-full px-4 py-4 bg-white border-2 rounded-xl font-bold text-sm outline-none focus:border-(--text-accent) transition-all" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                                            <option value="active">ACTIVE</option>
                                            <option value="inactive">INACTIVE/SUSPENDED</option>
                                            <option value="alumni">ALUMNI / GRADUATED</option>
                                        </select>
                                    </div>
                                    <ModalField label="Religion" value={editForm.religion} onChange={(v) => setEditForm({ ...editForm, religion: v })} />
                                    <ModalField label="Caste" value={editForm.caste} onChange={(v) => setEditForm({ ...editForm, caste: v })} />
                                    <ModalField label="Sub-Caste" value={editForm.subcaste} onChange={(v) => setEditForm({ ...editForm, subcaste: v })} />
                                </div>
                            </div>

                            {/* Section 5: Transport Logistics */}
                            <div className="space-y-6 pb-10">
                                <p style={{ color: 'var(--sidebar-bg)', borderColor: 'var(--sidebar-bg)' }} className="text-sm font-black uppercase tracking-[0.2em] border-l-4 pl-4">V. School Bus Service</p>
                                <div className="p-8 rounded-xl border space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center border border-institutional">
                                                <Truck className="w-5 h-5 text-slate-600" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black txt-black uppercase tracking-tight">School Bus Service</h4>
                                            </div>
                                        </div>
                                        <div className="flex border-institutional p-1 rounded-2xl bg-slate-50">
                                            {[
                                                { label: 'YES', value: true },
                                                { label: 'NO', value: false }
                                            ].map((opt) => (
                                                <button
                                                    key={opt.label}
                                                    type="button"
                                                    onClick={() => setEditForm(prev => ({ ...prev, requires_transport: opt.value }))}
                                                    className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${editForm.requires_transport === opt.value ? 'bg-[#FFB606] text-black shadow-md border border-black/20' : 'text-slate-400 hover:text-slate-600'}`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {editForm.requires_transport && (
                                        <div className="animate-in slide-in-from-top-4 duration-500 pt-6 border-t border-institutional">
                                            <div className="flex flex-col md:flex-row md:items-center gap-6">
                                                <label className="text-[10px] font-black text-slate-400 md:w-48 shrink-0 uppercase tracking-[0.2em]">Select Distance Range *</label>
                                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                    {['0-5km', '5-7km', 'above 7km'].map(range => (
                                                        <button
                                                            key={range}
                                                            type="button"
                                                            onClick={() => setEditForm(prev => ({ ...prev, transport_range: range }))}
                                                            className={`py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${editForm.transport_range === range ? 'bg-slate-900 border-slate-900 text-white shadow-xl' : 'bg-white border-institutional text-slate-400 hover:border-slate-400'}`}
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
                        </form>

                        <div style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-layout)' }} className="p-8 border-t flex items-center justify-end gap-4 shrink-0">
                            <button onClick={() => setShowEditModal(false)} className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-all">DISCARD CHANGES</button>
                            <button onClick={handleUpdateProfile} style={{ backgroundColor: 'var(--sidebar-bg)' }} className="px-10 py-4 text-white rounded-xl shadow-lg shadow-indigo-500/20 text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-3">
                                <CheckCircle2 className="w-4 h-4 text-(--text-accent)" /> Update Profile
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Hidden container for printing Report Cards */}
            <div style={{ display: 'none' }}>
                <div ref={printReportRef}>
                    {printTarget ? renderReportTemplate(
                        printTarget.yearId,
                        printTarget.attendanceRecords,
                        printTarget.performanceData,
                        printTarget.coScholasticData,
                        printTarget.prePrimaryData
                    ) : renderReportTemplate()}
                </div>
            </div>
        </div>
    );
};

/* Pro Helper Components */
const DataField = ({ label, value, fullWidth, icon: IconComponent, isCaps }) => {
    const Icon = IconComponent;
    return (
        <div className={`space-y-2 ${fullWidth ? 'w-full' : ''} group`}>
            <div className="flex items-center gap-3 pl-1">
                <Icon className="w-3.5 h-3.5 text-[#001736] group-hover:text-(--text-accent) transition-colors" />
                <p className="text-[11px] font-black text-black uppercase tracking-widest">{label}</p>
            </div>
            <div style={{ borderColor: 'var(--border-layout)' }} className="bg-white px-5 py-4 rounded-xl border-2 group-hover:border-(--sidebar-bg) transition-all shadow-xs min-h-[50px] flex items-center">
                <span className={`text-sm font-semibold text-(--sidebar-bg) leading-relaxed break-all ${isCaps ? 'uppercase tracking-wide' : ''}`}>{value || '---'}</span>
            </div>
        </div>
    );
};

const StatCard = ({ label, value, icon, color, unit }) => {
    const Icon = icon;
    const iconColors = {
        indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
        emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
        amber: 'text-amber-600 bg-amber-50 border-amber-100',
        rose: 'text-rose-600 bg-rose-50 border-rose-100'
    };
    const style = iconColors[color] || iconColors.indigo;

    return (
        <div className="p-8 rounded-xl border border-institutional flex items-center justify-between shadow-xs bg-white overflow-hidden relative group hover:shadow-md transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 transition-transform"></div>
            <div className="relative z-10">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
                <h3 className="text-2xl font-bold text-slate-800 tracking-tight flex items-baseline gap-2">
                    {value}
                    <span className="text-[10px] text-slate-300 uppercase italic font-semibold tracking-wider">{unit}</span>
                </h3>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-xs ${style} relative z-10 transition-transform`}>
                <Icon className="w-6 h-6" />
            </div>
        </div>
    );
};

const ModalField = ({ label, value, onChange, type = "text", disabled = false }) => (
    <div className="space-y-1.5 grow items-start flex flex-col">
        <label className="text-[10px] font-black uppercase tracking-widest text-black ml-1">{label}</label>
        <input
            type={type}
            style={{ borderColor: 'var(--border-layout)' }}
            className={`w-full px-4 py-4 bg-white border-2 rounded-xl font-semibold text-sm outline-none focus:border-(--text-accent) transition-all placeholder:text-slate-300 ${disabled ? 'bg-slate-50 cursor-not-allowed opacity-60' : ''}`}
            value={value || ''}
            onChange={(e) => !disabled && onChange(e.target.value)}
            disabled={disabled}
            placeholder={`Enter ${label}...`}
        />
    </div>
);

export default StudentProfile;
