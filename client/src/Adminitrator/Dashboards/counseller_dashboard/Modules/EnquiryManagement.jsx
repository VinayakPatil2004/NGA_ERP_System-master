import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Plus, Search, Filter, FileSpreadsheet, Loader2, X, Edit2, Calendar } from 'lucide-react';
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import DataTable from '../../../admcomponents/DataTable';
import AdmissionInquiryForm from './components/AdmissionInquiryForm';
import InquiryPrintTemplate from './components/InquiryPrintTemplate';
import * as XLSX from 'xlsx';
import { getAllEnquiries } from '../../../../services/counsellorAPI';
import { useReactToPrint } from 'react-to-print';
import { toast } from 'react-toastify';
import { Eye, Printer } from 'lucide-react';

import { useAcademicYear } from '../../../../context/AcademicYearContext';

const EnquiryManagement = ({ toggleSidebar }) => {
  const { selectedYear } = useAcademicYear();
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [editEnquiryData, setEditEnquiryData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFilter, setDateFilter] = useState('');
  const recordsPerPage = 15;
  const printRef = React.useRef();

  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  const triggerPrint = (enq) => {
    setSelectedEnquiry(enq);
    setTimeout(() => handlePrint(), 500);
  };

  const fetchEnquiries = useCallback(async () => {
    if (!selectedYear) return;
    try {
      setLoading(true);
      const data = await getAllEnquiries(selectedYear.id);
      setEnquiries(data || []);
    } catch {
      console.error("Failed to fetch enquiries");
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchEnquiries();
  }, [fetchEnquiries]);

  const handleExportExcel = () => {
    if (enquiries.length === 0) {
        toast.warning("No data to export");
        return;
    }
    const worksheet = XLSX.utils.json_to_sheet(enquiries);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Enquiries");
    XLSX.writeFile(workbook, `Inquiry_Report_${selectedYear?.year_name || '2026'}.xlsx`);
  };

  const filteredEnquiries = enquiries.filter(enq => {
    const matchesSearch = 
        enq.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enq.form_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enq.father_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enq.father_contact?.includes(searchTerm);
    
    const matchesDate = !dateFilter || enq.enquiry_date?.split('T')[0] === dateFilter;
    
    return matchesSearch && matchesDate;
  });

  // Pagination Logic
  const totalRecords = filteredEnquiries.length;
  const totalPages = Math.ceil(totalRecords / recordsPerPage);
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredEnquiries.slice(indexOfFirstRecord, indexOfLastRecord);

  // Reset to page 1 when searching
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <ModuleHeader
        title="Enquiry Management"
        subTitle="Institutional Lead Tracking & Conversion"
        icon={MessageSquare}
        toggleSidebar={toggleSidebar}
      />

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Search by name, form no, or mobile..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-black rounded-lg text-xs font-bold uppercase tracking-widest outline-none focus:bg-white focus:ring-2 focus:ring-black/5 transition-all"
                />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:flex-none">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    <input 
                        type="date" 
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest text-[#001736] outline-none focus:ring-2 focus:ring-black/5"
                    />
                    {dateFilter && (
                        <button 
                            onClick={() => setDateFilter('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-rose-500"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>
                <button 
                  onClick={handleExportExcel}
                  className="flex-1 md:flex-none px-6 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 shadow-sm border-b-2 active:scale-95"
                >
                    <FileSpreadsheet className="w-3.5 h-3.5" /> Export
                </button>
                <button 
                    onClick={() => {
                        setEditEnquiryData(null);
                        setShowInquiryForm(true);
                    }}
                    className="flex-1 md:flex-none px-6 py-2 bg-[#001736] text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg hover:shadow-indigo-500/10 transition-all flex items-center justify-center gap-2 active:scale-95 text-nowrap"
                >
                    <Plus className="w-3.5 h-3.5" /> New Enquiry
                </button>
            </div>
        </div>

        <DataTable
            headers={[
                { label: "Enquiry ID", className: "w-[120px] border border-black bg-indigo-100" },
                { label: "Date", className: "w-[110px] border border-black bg-indigo-100" },
                { label: "Student Name", className: "border border-black bg-indigo-100" },
                { label: "Father Name", className: "border border-black bg-indigo-100" },
                { label: "Contact No.", className: "border border-black bg-indigo-100" },
                { label: "Grade Interested", className: "border border-black bg-indigo-100" },
                { label: "Status", className: "text-center border border-black bg-indigo-100" },
                { label: "Actions", className: "text-center border border-black bg-indigo-100" }
            ]}
            columnCount={8}
            footer={
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#64748B]">
                        Showing <span className="text-[#001736]">{totalRecords > 0 ? indexOfFirstRecord + 1 : 0}</span> to <span className="text-[#001736]">{Math.min(indexOfLastRecord, totalRecords)}</span> of <span className="text-[#001736]">{totalRecords}</span> Records
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 bg-white border border-slate-200 rounded text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            Prev
                        </button>
                        <div className="flex items-center gap-1 px-4">
                            <span className="text-[10px] font-black text-[#001736] uppercase">Page {currentPage} of {totalPages || 1}</span>
                        </div>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="px-4 py-2 bg-white border border-slate-200 rounded text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            Next
                        </button>
                    </div>
                </div>
            }
        >
            {loading ? (
                <tr>
                    <td colSpan={7} className="py-20 text-center border border-black">
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Polling Lead Registry...</p>
                        </div>
                    </td>
                </tr>
            ) : currentRecords.length === 0 ? (
                <tr>
                    <td colSpan={7} className="py-20 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest border border-black">No enquiries found for {selectedYear?.year_name}</td>
                </tr>
            ) : currentRecords.map((enq) => (
                <tr key={enq.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-2 py-4 border border-black font-bold text-slate-400 text-xs">{enq.form_no}</td>
                    <td className="px-2 py-4 border border-black font-bold text-slate-600 text-xs">
                        {new Date(enq.enquiry_date).toLocaleDateString()}
                    </td>
                    <td className="px-2 py-4 border border-black font-black text-[#001736] text-[13px] uppercase tracking-tight">{enq.full_name}</td>
                    <td className="px-2 py-4 border border-black font-bold text-slate-600 text-xs uppercase">{enq.father_name || 'N/A'}</td>
                    <td className="px-2 py-4 border border-black text-slate-600 font-bold text-xs">{enq.father_contact || enq.mother_contact || 'N/A'}</td>
                    <td className="px-2 py-4 border border-black font-black text-[#001736] text-xs">{enq.admission_std}</td>
                    <td className="px-2 py-4 border border-black text-center">
                        <span className={`px-3 py-1 rounded-lg font-black text-[9px] uppercase tracking-widest border ${
                            enq.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                            enq.status === 'in-progress' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                            enq.status === 'converted' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            'bg-slate-50 text-slate-600 border-slate-100'
                        }`}>
                            {enq.status}
                        </span>
                    </td>
                    <td className="px-6 py-4 border border-black text-center">
                        <div className="flex items-center justify-center gap-2">
                            <button 
                                onClick={() => {
                                    setEditEnquiryData(enq);
                                    setShowInquiryForm(true);
                                }}
                                className="p-2 bg-white border border-black text-amber-600 rounded-lg hover:bg-amber-50 transition-all shadow-sm"
                                title="Edit Enquiry"
                            >
                                <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                                onClick={() => setSelectedEnquiry(enq)}
                                className="p-2 bg-white border border-black text-[#001736] rounded-lg hover:bg-slate-50 transition-all shadow-sm"
                                title="View Details"
                            >
                                <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button 
                                onClick={() => triggerPrint(enq)}
                                className="p-2 bg-white border border-black text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all shadow-sm"
                                title="Print Form"
                            >
                                <Printer className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </td>
                </tr>
            ))}
        </DataTable>
      </div>

      {showInquiryForm && (
          <AdmissionInquiryForm 
            onClose={() => {
                setShowInquiryForm(false);
                setEditEnquiryData(null);
            }} 
            onRefresh={fetchEnquiries}
            selectedYear={selectedYear?.id}
            selectedYearName={selectedYear?.year_name}
            editData={editEnquiryData}
          />
      )}

      {/* Hidden Print Template */}
      <div className="hidden">
          <InquiryPrintTemplate ref={printRef} data={selectedEnquiry} yearName={selectedYear?.year_name} />
      </div>

      {/* Details Modal */}
      {selectedEnquiry && !showInquiryForm && (
          <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
              <div className="bg-white w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl border border-black">
                  <div className="px-8 py-6 flex justify-between items-center border-b border-slate-100 bg-slate-50/50">
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-[#001736] rounded-2xl flex items-center justify-center text-white shadow-lg">
                              <Eye className="w-6 h-6" />
                          </div>
                          <div>
                              <h2 className="text-xl font-black text-[#001736] uppercase tracking-tight">Enquiry Details</h2>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{selectedEnquiry.form_no} • {selectedEnquiry.full_name}</p>
                          </div>
                      </div>
                      <button onClick={() => setSelectedEnquiry(null)} className="p-2 hover:bg-rose-50 hover:text-rose-500 text-slate-400 rounded-xl transition-all">
                          <X className="w-6 h-6" />
                      </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-8 space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                          <DetailGroup title="Student Identification">
                              <DetailItem label="Full Name" value={selectedEnquiry.full_name} />
                              <DetailItem label="DOB / Place" value={`${selectedEnquiry.dob || 'N/A'} • ${selectedEnquiry.place_of_birth || 'N/A'}`} />
                              <DetailItem label="Aadhar No" value={selectedEnquiry.aadhar_no} />
                              <DetailItem label="Address" value={selectedEnquiry.address} />
                          </DetailGroup>

                          <DetailGroup title="Academic Request">
                              <DetailItem label="Admission For" value={selectedEnquiry.admission_std} />
                              <DetailItem label="Previous Stats" value={`${selectedEnquiry.prev_std || 'N/A'} • ${selectedEnquiry.prev_school || 'N/A'}`} />
                              <DetailItem label="Age" value={selectedEnquiry.age} />
                              <DetailItem label="Religion / Caste" value={`${selectedEnquiry.religion || 'N/A'} • ${selectedEnquiry.caste || 'N/A'}`} />
                          </DetailGroup>

                          <DetailGroup title="Parental Information">
                              <DetailItem label="Father" value={`${selectedEnquiry.father_name || 'N/A'} (${selectedEnquiry.father_contact || 'N/A'})`} />
                              <DetailItem label="Mother" value={`${selectedEnquiry.mother_name || 'N/A'} (${selectedEnquiry.mother_contact || 'N/A'})`} />
                              <DetailItem label="Category" value={selectedEnquiry.category} />
                              <DetailItem label="Bus Facility" value={selectedEnquiry.bus_facility ? `Yes (${selectedEnquiry.bus_area})` : 'No'} />
                          </DetailGroup>
                      </div>
                  </div>

                  <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/30 flex justify-end gap-4">
                      <button 
                        onClick={() => setSelectedEnquiry(null)}
                        className="px-6 py-2.5 text-slate-500 font-bold text-[10px] uppercase tracking-widest hover:text-black"
                      >
                          Close
                      </button>
                      <button 
                        onClick={() => triggerPrint(selectedEnquiry)}
                        className="px-8 py-2.5 bg-[#001736] text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl hover:scale-105 transition-all"
                      >
                          <Printer className="w-4 h-4" /> Print Form
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

const DetailGroup = ({ title, children }) => (
    <div className="space-y-4">
        <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest border-b border-slate-100 pb-2">{title}</h4>
        <div className="space-y-3">
            {children}
        </div>
    </div>
);

const DetailItem = ({ label, value }) => (
    <div>
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-xs font-bold text-[#001736] uppercase tracking-tight">{value || 'Not Specified'}</p>
    </div>
);

export default EnquiryManagement;
