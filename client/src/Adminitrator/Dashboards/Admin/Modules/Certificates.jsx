import React, { useState, useEffect, useCallback } from 'react';
import { 
    FileCheck, Search, Filter, FileText, CheckCircle2, 
    Clock, AlertCircle, Eye, Download, Printer, 
    Check, X, MoreHorizontal, User, GraduationCap,
    ArrowRight, Sparkles, ShieldCheck, Star, Trash2, Edit2
} from 'lucide-react';
import { toast } from 'react-toastify';
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import DataTable from '../../../admcomponents/DataTable';
import API from '../../../../services/API';

const Certificates = ({ toggleSidebar }) => {
    // 1. Core State
    const [activeTab, setActiveTab] = useState('bonafide'); // 'bonafide' | 'leaving'
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedReq, setSelectedReq] = useState(null);
    const [editForm, setEditForm] = useState({
        student_id_no: '',
        gr_no: '',
        aadhar_no: '',
        progress: 'GOOD',
        conduct: 'GOOD',
        remarks: '---',
        fee_remarks: 'CLEAR',
        leaving_date: '',
        reason: '',
        cert_type: '',
        lc_no: '',
        prev_school: '',
        prev_class: ''
    });

    // Direct Generate State
    const [isDirectModalOpen, setIsDirectModalOpen] = useState(false);
    const [allStudents, setAllStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentSearchVal, setStudentSearchVal] = useState('');
    const [selectedClassFilter, setSelectedClassFilter] = useState('');
    const [isSearchingStudents, setIsSearchingStudents] = useState(false);
    const [directType, setDirectType] = useState('bonafide'); // 'bonafide' | 'leaving'
    const [directReason, setDirectReason] = useState('Personal / Official requirement');
    const [isGeneratingDirect, setIsGeneratingDirect] = useState(false);
    const [nextLcNo, setNextLcNo] = useState('');
    const [directLcForm, setDirectLcForm] = useState({
        student_id_no: '',
        gr_no: '',
        aadhar_no: '',
        progress: 'GOOD',
        conduct: 'GOOD',
        remarks: '---',
        fee_remarks: 'CLEAR',
        leaving_date: new Date().toISOString().split('T')[0],
        lc_no: '',
        prev_school: '',
        prev_class: ''
    });

    // Reset page to 1 when filters or active tab change to prevent out-of-bounds pagination bugs
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, searchQuery, statusFilter]);

    // Fetch active students lookup
    useEffect(() => {
        if (isDirectModalOpen) {
            const fetchStudents = async () => {
                try {
                    setIsSearchingStudents(true);
                    
                    // Fetch the currently active academic year first
                    let activeYearName = '';
                    try {
                        const activeYearRes = await API.get('/academic-years/active');
                        activeYearName = activeYearRes.data?.year_name;
                    } catch (err) {
                        console.error("Failed to load active academic year", err);
                    }

                    const res = await API.get('/students/all', {
                        params: activeYearName ? { academicYear: activeYearName } : {}
                    });
                    
                    // Client-side de-duplication: keep the enrollment with the active academic year, or fallback to the latest
                    const uniqueStudentsMap = new Map();
                    (res.data || []).forEach(student => {
                        const existing = uniqueStudentsMap.get(student.id);
                        if (!existing) {
                            uniqueStudentsMap.set(student.id, student);
                        } else {
                            // If we already have the active year enrollment, keep it
                            if (activeYearName && existing.year_name === activeYearName) {
                                return;
                            }
                            // If the new one is the active year, keep it
                            if (activeYearName && student.year_name === activeYearName) {
                                uniqueStudentsMap.set(student.id, student);
                                return;
                            }
                            // Otherwise fallback to latest year num
                            const getYearNum = (yName) => {
                                if (!yName) return 0;
                                const parts = yName.split('-');
                                const num = parseInt(parts[0]);
                                return isNaN(num) ? 0 : num;
                            };
                            if (getYearNum(student.year_name) > getYearNum(existing.year_name)) {
                                uniqueStudentsMap.set(student.id, student);
                            }
                        }
                    });

                    const uniqueStudents = Array.from(uniqueStudentsMap.values()).map(student => {
                        const sGrade = (student.grade || student.current_grade || 'N/A').trim().toUpperCase();
                        return {
                            ...student,
                            grade: sGrade,
                            current_grade: sGrade
                        };
                    });

                    setAllStudents(uniqueStudents);

                    // Fetch leaving certificates to calculate the next LC number
                    const certsRes = await API.get('/certificates', { params: { cert_type: 'leaving' } });
                    const leavingCerts = certsRes.data || [];
                    const maxLc = leavingCerts.reduce((max, r) => {
                        const num = parseInt(r.lc_no);
                        return !isNaN(num) ? Math.max(max, num) : max;
                    }, 0);
                    setNextLcNo(maxLc + 1);
                } catch (err) {
                    console.error("Failed to load students list", err);
                    toast.error("Failed to load active student list");
                } finally {
                    setIsSearchingStudents(false);
                }
            };
            fetchStudents();
        }
    }, [isDirectModalOpen]);

    const handleSelectStudent = async (student) => {
        setSelectedStudent(student);
        setStudentSearchVal('');
        setSelectedClassFilter('');
        
        // Initialize form with local list values
        setDirectLcForm({
            student_id_no: student.student_id_no || '',
            gr_no: student.gr_no || '',
            aadhar_no: student.aadhar_no || '',
            progress: 'GOOD',
            conduct: 'GOOD',
            remarks: '---',
            fee_remarks: 'CLEAR',
            leaving_date: new Date().toISOString().split('T')[0],
            lc_no: nextLcNo || '',
            prev_school: student.prev_school || '',
            prev_class: student.prev_class || ''
        });

        // Fetch full profile details from the database to guarantee Aadhar and other fields are filled
        try {
            const res = await API.get(`/students/${student.id}`);
            const fullStudent = res.data;
            if (fullStudent) {
                setDirectLcForm(prev => ({
                    ...prev,
                    student_id_no: fullStudent.student_id_no || prev.student_id_no || '',
                    gr_no: fullStudent.gr_no || prev.gr_no || '',
                    aadhar_no: fullStudent.aadhar_no || prev.aadhar_no || '',
                    prev_school: fullStudent.prev_school || prev.prev_school || '',
                    prev_class: fullStudent.prev_class || prev.prev_class || ''
                }));
            }
        } catch (err) {
            console.error("Failed to fetch full student details for auto-population", err);
        }
    };

    // Keep Direct Generate LC number in sync with calculated nextLcNo
    useEffect(() => {
        if (selectedStudent) {
            setDirectLcForm(prev => ({
                ...prev,
                student_id_no: selectedStudent.student_id_no || prev.student_id_no || '',
                gr_no: selectedStudent.gr_no || prev.gr_no || '',
                aadhar_no: selectedStudent.aadhar_no || prev.aadhar_no || '',
                lc_no: prev.lc_no || nextLcNo || ''
            }));
        }
    }, [nextLcNo, selectedStudent]);

    // Sequential auto-approval transaction pipeline for Direct Certificate Generation
    const handleDirectGenerate = async (e) => {
        e.preventDefault();
        if (!selectedStudent) {
            toast.warning("Please select a student first");
            return;
        }

        try {
            setIsGeneratingDirect(true);
            
            // 1. Post request (Insert record)
            toast.info("Initializing certificate registry record...");
            const reqPayload = {
                student_id: selectedStudent.id,
                reason: directType === 'bonafide' ? directReason : (directReason || 'LC Generation'),
                cert_type: directType
            };
            
            const reqRes = await API.post('/certificates/request', reqPayload);
            const requestId = reqRes.data.request_id;
            
            if (!requestId) {
                throw new Error("Failed to create certificate request ID");
            }

            // 2. Sequential approvals (Teacher -> Admin -> Principal)
            toast.info("Sequential auto-approval in progress (Stage 1: Teacher)...");
            await API.put(`/certificates/${requestId}/teacher-approve`);
            
            toast.info("Sequential auto-approval in progress (Stage 2: Admin)...");
            await API.put(`/certificates/${requestId}/admin-approve`);

            // For LC, apply specialized updates to registry metadata
            if (directType === 'leaving') {
                toast.info("Syncing customized leaving registry records...");
                await API.put(`/certificates/${requestId}/admin-update`, {
                    gr_no: directLcForm.gr_no,
                    aadhar_no: directLcForm.aadhar_no,
                    student_id_no: directLcForm.student_id_no,
                    progress: directLcForm.progress,
                    conduct: directLcForm.conduct,
                    remarks: directLcForm.remarks,
                    fee_remarks: directLcForm.fee_remarks,
                    leaving_date: directLcForm.leaving_date,
                    reason: directReason || 'HIGHER STUDIES',
                    cert_type: 'leaving',
                    lc_no: directLcForm.lc_no || requestId,
                    prev_school: directLcForm.prev_school,
                    prev_class: directLcForm.prev_class
                });
            }

            toast.info("Finalizing Principal endorsement signature...");
            await API.put(`/certificates/${requestId}/principal-approve`);

            // 3. Trigger immediate download
            toast.success("Credential generated successfully! Starting print download...");
            
            // Allow minor buffer time for backend consistency before download
            await new Promise(r => setTimeout(r, 600));
            await handleDownload(requestId);

            // Reset states and refresh main grid
            setIsDirectModalOpen(false);
            setSelectedStudent(null);
            loadRequests();
        } catch (error) {
            console.error("Direct Generate pipeline failure:", error);
            toast.error(error.response?.data?.error || "Sequential validation pipeline failed");
        } finally {
            setIsGeneratingDirect(false);
        }
    };

    // 2. Fetch Data
    const loadRequests = useCallback(async () => {
        try {
            setLoading(true);
            const response = await API.get('/certificates', {
                params: { cert_type: activeTab }
            });
            setRequests(response.data);
        } catch (error) {
            console.error("Fetch Error:", error);
            toast.error("Failed to load certificate requests");
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        loadRequests();
    }, [loadRequests]);

    // 3. Approval Actions
    const handleApprove = async (id, stage) => {
        try {
            let approveRoute = '';
            
            switch (stage) {
                case 'teacher': approveRoute = 'teacher-approve'; break;
                case 'admin': approveRoute = 'admin-approve'; break;
                case 'principal': approveRoute = 'principal-approve'; break;
                default: return;
            }

            await API.put(`/certificates/${id}/${approveRoute}`);
            toast.success(`Request approved at ${stage} level`);
            loadRequests();
        } catch (error) {
            toast.error(error.response?.data?.error || "Approval failed");
        }
    };

    const handleDownload = async (id) => {
        try {
            const response = await API.get(`/certificates/${id}/generate`, { responseType: 'blob' });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${activeTab}-certificate-${id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Download Error:", error);
            toast.error("Generation failed. Is it fully approved?");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this request?")) return;
        try {
            await API.delete(`/certificates/${id}`);
            toast.success("Request deleted successfully");
            loadRequests();
        } catch (_error) {
            toast.error("Deletion failed");
        }
    };

    const openEditModal = (req) => {
        setSelectedReq(req);
        setEditForm({
            student_id_no: req.student_id_no || '',
            gr_no: req.gr_no || '',
            aadhar_no: req.aadhar_no || '',
            progress: req.progress || 'GOOD',
            conduct: req.conduct || 'GOOD',
            remarks: req.remarks || '---',
            fee_remarks: req.fee_remarks || 'CLEAR',
            leaving_date: req.leaving_date ? req.leaving_date.split('T')[0] : new Date().toISOString().split('T')[0],
            reason: req.reason || '',
            cert_type: req.cert_type || '',
            lc_no: req.lc_no || req.id,
            prev_school: req.prev_school || '',
            prev_class: req.prev_class || ''
        });
        setIsEditModalOpen(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await API.put(`/certificates/${selectedReq.id}/admin-update`, editForm);
            toast.success("Record updated successfully");
            setIsEditModalOpen(false);
            loadRequests();
        } catch (error) {
            toast.error(error.response?.data?.error || "Update failed");
        }
    };

    // 4. Filtering Logic
    const filteredRequests = requests.filter(req => {
        const matchesSearch = (
            req.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            req.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            req.middle_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            req.father_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            req.student_id_no?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // 5. Pagination Logic
    const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
    const paginatedRequests = filteredRequests.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // 6. Render Helpers
    const getStatusConfig = (status) => {
        switch (status) {
            case 'pending_teacher': return { label: 'Teacher Verification', icon: Clock, color: 'text-warning bg-warning/10 border-warning/20' };
            case 'approved_teacher': return { label: 'Admin Approval', icon: ShieldCheck, color: 'text-info bg-info/10 border-info/20' };
            case 'approved_admin': return { label: 'Principal Approval', icon: Star, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' };
            case 'approved_principal': return { label: 'Ready to Print', icon: CheckCircle2, color: 'text-success bg-success/10 border-success/20' };
            default: return { label: status, icon: AlertCircle, color: 'text-slate-400 bg-slate-100 border-slate-200' };
        }
    };

    // Helpers for Direct generate selection
    const uniqueClasses = Array.from(new Set(allStudents.map(s => (s.grade || s.current_grade || '').trim().toUpperCase()).filter(Boolean))).sort();

    const filteredStudentsForDirect = allStudents.filter(student => {
        const sGrade = (student.grade || student.current_grade || '').trim().toUpperCase();
        const selClass = (selectedClassFilter || '').trim().toUpperCase();
        if (selClass && sGrade !== selClass) return false;

        if (studentSearchVal) {
            const sQuery = studentSearchVal.toLowerCase();
            return (
                student.first_name?.toLowerCase().includes(sQuery) ||
                student.last_name?.toLowerCase().includes(sQuery) ||
                student.middle_name?.toLowerCase().includes(sQuery) ||
                student.student_id_no?.toLowerCase().includes(sQuery) ||
                student.gr_no?.toLowerCase().includes(sQuery) ||
                sGrade.toLowerCase().includes(sQuery)
            );
        }
        return true;
    });

    return (
        <div className="p-4 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <ModuleHeader 
                title="Certificate Matrix" 
                subtitle="Credential Management & Verification"
                icon={FileCheck}
                toggleSidebar={toggleSidebar}
                showSearch={true}
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                onSearchToggle={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                hideDesktopSearch={true}
            >
                <div className="flex bg-white/40  rounded-md border border-white/30 backdrop-blur-md">
                    <button 
                        onClick={() => setActiveTab('bonafide')}
                        className={`px-4 lg:px-6 py-2 lg:py-3 rounded-md text-[9px] lg:text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'bonafide' ? 'bg-white text-primary shadow-xl scale-105' : 'text-white hover:bg-white/5'}`}
                    >
                        Bonafide
                    </button>
                    <button 
                        onClick={() => setActiveTab('leaving')}
                        className={`px-4 lg:px-6 py-2 lg:py-3 rounded-md text-[9px] lg:text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'leaving' ? 'bg-white text-primary shadow-xl scale-105' : 'text-white hover:bg-white/5'}`}
                    >
                        LC
                    </button>
                </div>
            </ModuleHeader>

            {/* Desktop Action Bar */}
            <div className={`flex flex-col lg:flex-row items-center justify-between gap-4 mb-6 ${!isMobileSearchOpen ? 'hidden lg:flex' : 'flex animate-in slide-in-from-top-2'}`}>
                <div className="flex flex-1 w-full relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-40 group-focus-within:opacity-100 transition-opacity" />
                    <input 
                        type="text" 
                        placeholder="Search by Name or Student ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-[12px] font-bold outline-none focus:ring-8 focus:ring-primary/5 transition-all shadow-sm"
                    />
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <button
                        onClick={() => setIsDirectModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-3 bg-black text-white rounded-md text-[10px] font-black uppercase tracking-widest hover:scale-[1.03] hover:shadow-xl hover:shadow-indigo-100 transition-all shadow-lg active:scale-95 whitespace-nowrap"
                    >
                        Direct Generate
                    </button>

                    <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
                        {['all', 'pending_teacher', 'approved_teacher', 'approved_admin', 'approved_principal'].map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-tighter transition-all whitespace-nowrap ${statusFilter === status ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                {status.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Matrix Table */}
            <div className="bg-white shadow-2xl border border-slate-100 overflow-hidden">
                <DataTable
                    headers={[
                        { label: "Request ID", className: "w-[100px] border border-black" },
                        { label: "Student Detail", className: "min-w-[250px] border border-black" },
                        { label: "Reason/Purpose", className: "min-w-[200px] border border-black" },
                        { label: "Timeline Status", className: "w-[200px] border border-black" },
                        { label: "Institutional Actions", className: "w-[250px] text-center border border-black" }
                    ]}
                    loading={loading}
                    columnCount={5}
                    footer={filteredRequests.length > 0 && (
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4  bg-slate-50/30">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#001736] opacity-60">
                                Showing <span className="font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold">{Math.min(currentPage * itemsPerPage, filteredRequests.length)}</span> of <span className="font-bold">{filteredRequests.length}</span> Records
                            </p>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 bg-white border border-black rounded text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    Prev
                                </button>
                                <div className="px-4 text-[10px] font-black text-[#001736] uppercase tracking-widest">
                                    Page {currentPage} of {totalPages || 1}
                                </div>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    className="px-4 py-2 bg-white border border-black rounded text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                >
                    {paginatedRequests.map((req) => {
                        const config = getStatusConfig(req.status);
                        const StatusIcon = config.icon;

                        return (
                            <tr key={req.id} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0">
                                <td className="p-4 border border-black">
                                    <span className="text-[12px] font-black text-slate-500 uppercase tracking-widest">#{req.id}</span>
                                </td>
                                <td className="p-4 border border-black">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary font-black text-xs border border-primary/10">
                                            {req.first_name?.[0]}{req.last_name?.[0]}
                                        </div>
                                        <div>
                                            <h4 className="text-[12px] font-black text-primary uppercase leading-tight tracking-tight">
                                                {req.last_name} {req.first_name} {req.middle_name || req.father_name || ''}
                                            </h4>
                                            <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">{req.student_id_no} • {req.current_grade}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 border border-black">
                                    <p className="text-[11px] font-bold text-slate-600 line-clamp-2 leading-relaxed italic">
                                        "{req.reason || 'Personal / Official requirement'}"
                                    </p>
                                </td>
                                <td className="p-4 border border-black">
                                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest ${config.color}`}>
                                        <StatusIcon className="w-3.5 h-3.5" />
                                        {config.label}
                                    </div>
                                </td>
                                <td className="p-4 text-center border border-black">
                                    <div className="flex items-center justify-center gap-2">
                                        {activeTab === 'leaving' && (
                                            <button 
                                                onClick={() => openEditModal(req)}
                                                className="p-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-all shadow-sm active:scale-90"
                                                title="Edit Details"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                        {req.status === 'pending_teacher' && (
                                            <button 
                                                onClick={() => handleApprove(req.id, 'teacher')}
                                                className="px-3 py-2 bg-warning text-white rounded-lg text-[9px] font-black uppercase flex items-center gap-1 transition-all shadow-sm active:scale-90"
                                            >
                                                <ClipboardCheck className="w-3.5 h-3.5" /> Approve
                                            </button>
                                        )}
                                        {req.status === 'approved_teacher' && (
                                            <button 
                                                onClick={() => handleApprove(req.id, 'admin')}
                                                className="px-3 py-2 bg-info text-white rounded-lg text-[9px] font-black uppercase flex items-center gap-1 transition-all shadow-sm active:scale-90"
                                            >
                                                <ShieldCheck className="w-3.5 h-3.5" /> Approve
                                            </button>
                                        )}
                                        {req.status === 'approved_admin' && (
                                            <button 
                                                onClick={() => handleApprove(req.id, 'principal')}
                                                className="px-3 py-2 bg-purple-500 text-white rounded-lg text-[9px] font-black uppercase flex items-center gap-1 transition-all shadow-sm active:scale-90"
                                            >
                                                <Star className="w-3.5 h-3.5" /> Approve
                                            </button>
                                        )}
                                        {req.status === 'approved_principal' && (
                                            <button 
                                                onClick={() => handleDownload(req.id)}
                                                className="flex items-center gap-2 px-4 py-2 bg-success text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-black transition-all active:scale-95"
                                            >
                                                <Download className="w-3.5 h-3.5" /> Print
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => handleDelete(req.id)}
                                            className="p-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-all shadow-sm active:scale-90"
                                            title="Delete Request"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </DataTable>

                {filteredRequests.length === 0 && !loading && (
                    <div className="py-24 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100 animate-pulse">
                            <FileText className="w-10 h-10 text-slate-200" />
                        </div>
                        <h3 className="text-lg font-black text-primary uppercase tracking-tighter">No Certificate Requests Found</h3>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 max-w-[250px]">Adjust your filters or search terms to find specific credentials</p>
                    </div>
                )}
            </div>

        
            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-9999 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-4xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-300 my-auto">
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-xl font-black text-primary uppercase tracking-tight">Edit LC Details</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Request ID: #{selectedReq?.id}</p>
                                </div>
                                <button onClick={() => setIsEditModalOpen(false)} className="p-3 bg-white! border! border-slate-300! rounded-md! hover:bg-rose-50 hover:text-rose-500 transition-all">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Student Profile Fields */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-primary/40 uppercase tracking-[0.2em] mb-4">Student Profile</h4>
                                    <div>
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Student ID No</label>
                                        <input 
                                            type="text" 
                                            value={editForm.student_id_no}
                                            onChange={(e) => setEditForm({...editForm, student_id_no: e.target.value})}
                                            className="w-full mt-1.5 px-5 py-4 bg-white! border! border-slate-300! rounded-md! text-[11px] font-bold outline-none focus:ring-4 focus:ring-primary/5 transition-all uppercase"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">General Reg (GR) No</label>
                                        <input 
                                            type="text" 
                                            value={editForm.gr_no}
                                            onChange={(e) => setEditForm({...editForm, gr_no: e.target.value})}
                                            className="w-full mt-1.5 px-5 py-4 bg-white! border! border-slate-300! rounded-md! text-[11px] font-bold outline-none focus:ring-4 focus:ring-primary/5 transition-all uppercase"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">UID (Aadhar No)</label>
                                        <input 
                                            type="text" 
                                            value={editForm.aadhar_no}
                                            onChange={(e) => setEditForm({...editForm, aadhar_no: e.target.value})}
                                            className="w-full mt-1.5 px-5 py-4 bg-white! border! border-slate-300! rounded-md! text-[11px] font-bold outline-none focus:ring-4 focus:ring-primary/5 transition-all uppercase"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">LC Number</label>
                                        <input 
                                            type="text" 
                                            value={editForm.lc_no}
                                            onChange={(e) => setEditForm({...editForm, lc_no: e.target.value})}
                                            className="w-full mt-1.5 px-5 py-4 bg-white! border! border-slate-300! rounded-md! text-[11px] font-bold outline-none focus:ring-4 focus:ring-primary/5 transition-all uppercase"
                                        />
                                    </div>
                                </div>

                                {/* LC Specific Fields */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-primary/40 uppercase tracking-[0.2em] mb-4">LC Record Details</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">10) Progress</label>
                                            <input 
                                                type="text" 
                                                value={editForm.progress}
                                                onChange={(e) => setEditForm({...editForm, progress: e.target.value})}
                                                className="w-full mt-1.5 px-5 py-4 bg-white! border! border-slate-300! rounded-md! text-[11px] font-bold outline-none focus:ring-4 focus:ring-primary/5 transition-all uppercase"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">11) Conduct</label>
                                            <input 
                                                type="text" 
                                                value={editForm.conduct}
                                                onChange={(e) => setEditForm({...editForm, conduct: e.target.value})}
                                                className="w-full mt-1.5 px-5 py-4 bg-white! border! border-slate-300! rounded-md! text-[11px] font-bold outline-none focus:ring-4 focus:ring-primary/5 transition-all uppercase"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">12) Leaving Date</label>
                                        <input 
                                            type="date" 
                                            value={editForm.leaving_date}
                                            onChange={(e) => setEditForm({...editForm, leaving_date: e.target.value})}
                                            className="w-full mt-1.5 px-5 py-4 bg-white! border! border-slate-300! rounded-md! text-[11px] font-bold outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">8) Last School Attended</label>
                                            <input 
                                                type="text" 
                                                value={editForm.prev_school}
                                                onChange={(e) => setEditForm({...editForm, prev_school: e.target.value})}
                                                className="w-full mt-1.5 px-5 py-4 bg-white! border! border-slate-300! rounded-md! text-[11px] font-bold outline-none focus:ring-4 focus:ring-primary/5 transition-all uppercase"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">8) Last Class</label>
                                            <input 
                                                type="text" 
                                                value={editForm.prev_class}
                                                onChange={(e) => setEditForm({...editForm, prev_class: e.target.value})}
                                                className="w-full mt-1.5 px-5 py-4 bg-white! border! border-slate-300! rounded-md! text-[11px] font-bold outline-none focus:ring-4 focus:ring-primary/5 transition-all uppercase"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">15) Remark</label>
                                        <input 
                                            type="text" 
                                            value={editForm.remarks}
                                            onChange={(e) => setEditForm({...editForm, remarks: e.target.value})}
                                            className="w-full mt-1.5 px-5 py-4 bg-white! border! border-slate-300! rounded-md! text-[11px] font-bold outline-none focus:ring-4 focus:ring-primary/5 transition-all uppercase"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">16) Fee Remark</label>
                                        <input 
                                            type="text" 
                                            value={editForm.fee_remarks}
                                            onChange={(e) => setEditForm({...editForm, fee_remarks: e.target.value})}
                                            className="w-full mt-1.5 px-5 py-4 bg-white! border! border-slate-300! rounded-md! text-[11px] font-bold outline-none focus:ring-4 focus:ring-primary/5 transition-all uppercase"
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-2 pt-4 flex gap-4">
                                    <button 
                                        type="submit"
                                        className="flex-1 py-4 bg-primary text-white rounded-md! text-[12px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95"
                                    >
                                        Save All Changes
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="px-8 py-4 bg-slate-100 text-slate-500 rounded-md! text-[12px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Direct Generate Modal */}
            {isDirectModalOpen && (
                <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-99999 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-300 my-auto">
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-linear-to-tr from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center text-white">
                                        <Sparkles className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-primary uppercase tracking-tight">Direct Certificate Generation</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Bypass Request Validation Queue</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => {
                                        setIsDirectModalOpen(false);
                                        setSelectedStudent(null);                                    }} 
                                    className="p-3 bg-white! border! border-slate-300! rounded-md! hover:bg-rose-50 hover:text-rose-500 transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Step 1: Student Lookup */}
                            {!selectedStudent ? (
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Search Student</label>
                                        <div className="relative">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                            <input
                                                value={studentSearchVal}
                                                onChange={e => setStudentSearchVal(e.target.value)}
                                                className="w-full pl-12 pr-5 py-4 bg-white! border! border-slate-300! rounded-md! text-sm font-bold outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                                placeholder="Name, Student ID, GR or PEN No..."
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Select Class</label>
                                            <select
                                                value={selectedClassFilter}
                                                onChange={e => {
                                                    setSelectedClassFilter(e.target.value);
                                                }}
                                                className="w-full px-5 py-4 bg-white! border! border-slate-300! rounded-md! text-sm font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer text-slate-700"
                                            >
                                                <option value="">All Classes</option>
                                                {uniqueClasses.map(c => (
                                                     <option key={c} value={c}>{c}</option>
                                                 ))}
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Select Student</label>
                                            <select
                                                value={selectedStudent?.id || ''}
                                                onChange={e => {
                                                    const sId = e.target.value;
                                                    const found = allStudents.find(s => s.id === parseInt(sId) || s.id === sId);
                                                    if (found) {
                                                        handleSelectStudent(found);
                                                    }
                                                }}
                                                className="w-full px-5 py-4 bg-white! border! border-slate-300! rounded-md! text-sm font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer text-slate-700"
                                            >
                                                <option value="">Select Student...</option>
                                                {filteredStudentsForDirect.map(s => (
                                                    <option key={s.id} value={s.id}>
                                                        {s.first_name} {s.last_name} ({s.student_id_no || 'No ID'}) - {s.grade || s.current_grade || 'No Class'}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
 
                                    <div className="max-h-[250px] overflow-y-auto border! border-slate-300! rounded-md! divide-y divide-slate-100 bg-white!">
                                        {isSearchingStudents ? (
                                            <div className="p-8 text-center text-slate-400 font-bold uppercase tracking-widest text-[9px] animate-pulse">Loading active student records...</div>
                                        ) : (
                                            filteredStudentsForDirect.slice(0, 80).map(student => (
                                                <div 
                                                    key={student.id} 
                                                    onClick={() => handleSelectStudent(student)}
                                                    className="p-4 hover:bg-slate-50 cursor-pointer flex justify-between items-center transition-colors group"
                                                >
                                                    <div>
                                                        <h4 className="text-[12px] font-bold text-slate-800 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">
                                                            {student.last_name} {student.first_name} {student.middle_name || ''}
                                                        </h4>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                            ID: {student.student_id_no} &bull; Class: {(student.grade || student.current_grade || '').trim() || 'N/A'}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-[9px] font-black bg-slate-50 border border-slate-200 group-hover:bg-indigo-50 group-hover:text-indigo-600 px-3 py-1.5 rounded-md! uppercase tracking-wider transition-all">GR No: {student.gr_no || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                        {filteredStudentsForDirect.length === 0 && !isSearchingStudents && (
                                            <div className="p-8 text-center text-slate-400 font-bold uppercase tracking-widest text-[9px]">No matching student found.</div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleDirectGenerate} className="space-y-6">
                                    {/* Student Card Summary */}
                                    <div className="bg-white border border-slate-300 rounded-md p-5 flex justify-between items-center shadow-sm">
                                        <div>
                                            <span className="text-[8px] font-black bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full uppercase tracking-widest">Active Selection</span>
                                            <h4 className="text-sm font-black text-primary uppercase mt-1">
                                                {selectedStudent.last_name} {selectedStudent.first_name} {selectedStudent.middle_name || ''}
                                            </h4>
                                            <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">
                                                ID: {selectedStudent.student_id_no} &bull; Class: {(selectedStudent.grade || selectedStudent.current_grade || '').trim() || 'N/A'}
                                            </p>
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => setSelectedStudent(null)}
                                            className="px-4 py-2 bg-white! hover:bg-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest rounded-md! border! border-slate-300! shadow-sm transition-all"
                                        >
                                            Change
                                        </button>
                                    </div>

                                    {/* Certificate Type Selector */}
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1 mb-2">Certificate Type</label>
                                        <div className="grid grid-cols-2 gap-4 bg-white! p-1.5 rounded-md! border! border-slate-300!">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setDirectType('bonafide');
                                                    setDirectReason('Personal / Official requirement');
                                                }}
                                                className={`py-3.5 rounded-md! text-[10px] font-black uppercase tracking-widest transition-all ${directType === 'bonafide' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 border border-transparent'}`}
                                            >
                                                Bonafide Certificate
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setDirectType('leaving');
                                                    setDirectReason('HIGHER STUDIES');
                                                }}
                                                className={`py-3.5 rounded-md! text-[10px] font-black uppercase tracking-widest transition-all ${directType === 'leaving' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 border border-transparent'}`}
                                            >
                                                Leaving Certificate (LC)
                                            </button>
                                        </div>
                                    </div>

                                    {/* Dynamic Form Content */}
                                    <div className="max-h-[350px] overflow-y-auto pr-2 space-y-4">
                                        {directType === 'bonafide' ? (
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Reason / Purpose</label>
                                                <input 
                                                    type="text" 
                                                    value={directReason}
                                                    onChange={(e) => setDirectReason(e.target.value)}
                                                    required
                                                    className="w-full mt-2 px-5 py-4 bg-white! border! border-slate-300! rounded-md! text-[12px] font-bold outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all"
                                                />
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <h4 className="text-[9px] font-black text-primary/40 uppercase tracking-[0.2em] mb-2">Populate School Leaving Metadata</h4>
                                                
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Student ID No</label>
                                                        <input 
                                                            type="text" 
                                                            value={directLcForm.student_id_no}
                                                            onChange={(e) => setDirectLcForm({...directLcForm, student_id_no: e.target.value})}
                                                            className="w-full mt-1.5 px-4 py-3.5 bg-white! border! border-slate-300! rounded-md! text-[11px] font-bold outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all uppercase"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">General Reg (GR) No</label>
                                                        <input 
                                                            type="text" 
                                                            value={directLcForm.gr_no}
                                                            onChange={(e) => setDirectLcForm({...directLcForm, gr_no: e.target.value})}
                                                            className="w-full mt-1.5 px-4 py-3.5 bg-white! border! border-slate-300! rounded-md! text-[11px] font-bold outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all uppercase"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">UID (Aadhar No)</label>
                                                        <input 
                                                            type="text" 
                                                            value={directLcForm.aadhar_no}
                                                            onChange={(e) => setDirectLcForm({...directLcForm, aadhar_no: e.target.value})}
                                                            className="w-full mt-1.5 px-4 py-3.5 bg-white! border! border-slate-300! rounded-md! text-[11px] font-bold outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all uppercase"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">LC Number</label>
                                                        <input 
                                                            type="text" 
                                                            value={directLcForm.lc_no}
                                                            onChange={(e) => setDirectLcForm({...directLcForm, lc_no: e.target.value})}
                                                            placeholder="Leave empty for auto-generated ID"
                                                            className="w-full mt-1.5 px-4 py-3.5 bg-white! border! border-slate-300! rounded-md! text-[11px] font-bold outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all uppercase"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Leaving Date</label>
                                                        <input 
                                                            type="date" 
                                                            value={directLcForm.leaving_date}
                                                            onChange={(e) => setDirectLcForm({...directLcForm, leaving_date: e.target.value})}
                                                            className="w-full mt-1.5 px-4 py-3.5 bg-white! border! border-slate-300! rounded-md! text-[11px] font-bold outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Leaving Reason</label>
                                                        <input 
                                                            type="text" 
                                                            value={directReason}
                                                            onChange={(e) => setDirectReason(e.target.value)}
                                                            placeholder="HIGHER STUDIES"
                                                            className="w-full mt-1.5 px-4 py-3.5 bg-white! border! border-slate-300! rounded-md! text-[11px] font-bold outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all uppercase"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">8) Last School Attended</label>
                                                        <input 
                                                            type="text" 
                                                            value={directLcForm.prev_school}
                                                            onChange={(e) => setDirectLcForm({...directLcForm, prev_school: e.target.value})}
                                                            className="w-full mt-1.5 px-4 py-3.5 bg-white! border! border-slate-300! rounded-md! text-[11px] font-bold outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all uppercase"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">8) Last Class</label>
                                                        <input 
                                                            type="text" 
                                                            value={directLcForm.prev_class}
                                                            onChange={(e) => setDirectLcForm({...directLcForm, prev_class: e.target.value})}
                                                            className="w-full mt-1.5 px-4 py-3.5 bg-white! border! border-slate-300! rounded-md! text-[11px] font-bold outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all uppercase"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">10) Progress</label>
                                                        <input 
                                                            type="text" 
                                                            value={directLcForm.progress}
                                                            onChange={(e) => setDirectLcForm({...directLcForm, progress: e.target.value})}
                                                            className="w-full mt-1.5 px-4 py-3.5 bg-white! border! border-slate-300! rounded-md! text-[11px] font-bold outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all uppercase"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">11) Conduct</label>
                                                        <input 
                                                            type="text" 
                                                            value={directLcForm.conduct}
                                                            onChange={(e) => setDirectLcForm({...directLcForm, conduct: e.target.value})}
                                                            className="w-full mt-1.5 px-4 py-3.5 bg-white! border! border-slate-300! rounded-md! text-[11px] font-bold outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all uppercase"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">15) Remark</label>
                                                        <input 
                                                            type="text" 
                                                            value={directLcForm.remarks}
                                                            onChange={(e) => setDirectLcForm({...directLcForm, remarks: e.target.value})}
                                                            className="w-full mt-1.5 px-4 py-3.5 bg-white! border! border-slate-300! rounded-md! text-[11px] font-bold outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all uppercase"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Fee Remark</label>
                                                        <input 
                                                            type="text" 
                                                            value={directLcForm.fee_remarks}
                                                            onChange={(e) => setDirectLcForm({...directLcForm, fee_remarks: e.target.value})}
                                                            className="w-full mt-1.5 px-4 py-3.5 bg-white! border! border-slate-300! rounded-md! text-[11px] font-bold outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all uppercase"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action buttons */}
                                    <div className="pt-4 flex gap-4">
                                        <button 
                                            type="submit"
                                            disabled={isGeneratingDirect}
                                            className="flex-1 py-4 bg-linear-to-r from-indigo-600 to-violet-600 text-white rounded-md! text-[12px] font-black uppercase tracking-widest shadow-xl shadow-indigo-200/50 hover:scale-[1.02] hover:shadow-2xl transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                                        >
                                            {isGeneratingDirect ? (
                                                <>
                                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                                    Bypassing Approvals...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="w-4 h-4" />
                                                    Generate & Print Instantly
                                                </>
                                            )}
                                        </button>
                                        <button 
                                            type="button"
                                            disabled={isGeneratingDirect}
                                            onClick={() => {
                                                setIsDirectModalOpen(false);
                                                setSelectedStudent(null);
                                            }}
                                            className="px-8 py-4 bg-slate-100 text-slate-500 rounded-md text-[12px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Simple icon replacement for ClipboardCheck if not available in current Lucide version
const ClipboardCheck = ({ className }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <path d="m9 14 2 2 4-4" />
    </svg>
);

export default Certificates;
