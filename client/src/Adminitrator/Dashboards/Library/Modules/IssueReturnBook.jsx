import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  ArrowLeftRight,
  Search,
  BookOpen,
  UserCheck,
  ArrowRight,
  ArrowLeft,
  X,
  Calendar,
  Hash,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Filter,
  ChevronDown,
  Undo2,
  BookMarked,
  FileSpreadsheet,
  FileDown,
  FileText,
  RefreshCw,
  Eye,
} from "lucide-react";
import ModuleHeader from "../../../admcomponents/ModuleHeader";
import libraryAPI from "../../../../services/libraryAPI";
import { getAllStudents, getActiveAcademicYear } from "../../../../services/studentAPI";
import { getAllStaff } from "../../../../services/staffAPI";
import { useAcademicYear } from "../../../../context/AcademicYearContext";
import { toast } from "react-toastify";
import DataTable from "../../../admcomponents/DataTable";

/**
 * IssueReturnBook – Issue / Return Book Module
 */

const GRADES = ["Nursery", "Jr.Kg", "Sr.Kg", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"];

const IssueReturnBook = ({ toggleSidebar }) => {
  const [transactions, setTransactions] = useState([]);
  const [availableBooks, setAvailableBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnTarget, setReturnTarget] = useState(null);

  const [activeAcademicYear, setActiveAcademicYear] = useState(null);
  const [allStudents, setAllStudents] = useState([]);
  const [filteredBooksByCategory, setFilteredBooksByCategory] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [issueForm, setIssueForm] = useState({
    book_id: "", member_id: "", member_name: "", member_class: "", due_date: "",
  });
  const [memberType, setMemberType] = useState("student"); // student or staff
  const [allStaff, setAllStaff] = useState([]);

  const { selectedYear } = useAcademicYear();
  const [currentPage, setCurrentPage] = useState(1);
  const [isImporting, setIsImporting] = useState(false);
  const itemsPerPage = 10;

  const fetchData = useCallback(async () => {
    try {
      const [txns, books, activeYear] = await Promise.all([
        libraryAPI.getTransactions(selectedYear?.id),
        libraryAPI.getAllBooks(selectedYear?.id),
        getActiveAcademicYear()
      ]);
      
      setTransactions(txns || []);
      const avBooks = (books || []).filter(b => b.available > 0);
      setAvailableBooks(avBooks);
      
      // Extract unique categories
      const uniqueCategories = [...new Set((books || []).map(b => b.genre))].filter(Boolean);
      setCategories(uniqueCategories);
 
      if (activeYear) {
        setActiveAcademicYear(activeYear);
      }
    } catch {
      toast.error("Failed to load records");
    }
  }, [selectedYear]);

  useEffect(() => {
    const init = async () => {
      await fetchData();
    };
    init();
  }, [fetchData]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchSearch =
        (t.bookTitle || "").toLowerCase().includes(search.toLowerCase()) ||
        (t.member_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (t.member_id || "").toLowerCase().includes(search.toLowerCase());
      // Exact match — avoid "Returned".includes("Returned") matching "Returned Late"
      const matchType = typeFilter === "All" || t.status === typeFilter;
      return matchSearch && matchType;
    });
  }, [transactions, search, typeFilter]);

  // Reset to page 1 on search/filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleIssue = async () => {
    if (!issueForm.book_id || !issueForm.member_name.trim()) {
      toast.error("Please select a book and member");
      return;
    }
    try {
      const today = new Date().toISOString().split("T")[0];
      await libraryAPI.issueBook({
        ...issueForm,
        issue_date: today,
        due_date: issueForm.due_date || new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
        academic_year_id: selectedYear?.id
      });
      toast.success("Book issued successfully");
      fetchData();
      setIssueForm({ book_id: "", member_id: "", member_name: "", member_class: "", due_date: "" });
      setShowIssueModal(false);
    } catch {
      toast.error("Issuance failed");
    }
  };

  const handleReturn = async (id) => {
    try {
      const res = await libraryAPI.returnBook(id);
      toast.success(res.status === 'Returned Late' ? "Book returned (Late - Fine generated)" : "Book returned successfully");
      fetchData();
      setShowReturnModal(false);
      setReturnTarget(null);
    } catch {
      toast.error("Return operation failed");
    }
  };

  const handleImport = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    if (type === 'excel' && !['xlsx', 'xls'].includes(ext)) {
      toast.error("Please upload a valid Excel file (.xlsx or .xls)");
      return;
    }
    if (type === 'csv' && ext !== 'csv') {
      toast.error("Please upload a valid CSV file (.csv)");
      return;
    }

    try {
      setIsImporting(true);
      const res = await libraryAPI.importTransactions(file);
      if (res.inserted > 0) {
        toast.success(`Import successful: ${res.inserted} records added ✓`);
      }
      if (res.failed > 0) {
        toast.warning(`${res.failed} records failed. Check your data.`);
      }
      if (res.inserted === 0 && res.failed === 0) {
        toast.info("No data found in file");
      }
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to import transactions");
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const openIssueModal = () => {
    setIssueForm({ book_id: "", member_id: "", member_name: "", member_class: "", due_date: "" });
    setSelectedCategory("");
    setSelectedClass("");
    setFilteredBooksByCategory([]);
    setAllStudents([]);
    setMemberType("student");
    setAllStaff([]);
    setShowIssueModal(true);
  };

  const handleGradeChange = async (grade) => {
    setSelectedClass(grade);
    setIssueForm(prev => ({ ...prev, member_class: grade, member_name: "", member_id: "" }));
    
    const yearName = selectedYear?.year_name || activeAcademicYear?.name;
    if (yearName) {
      try {
        const stus = await getAllStudents(yearName, grade);
        setAllStudents(stus || []);
      } catch {
        toast.error("Failed to fetch students for this grade");
      }
    }
  };

  const handleStudentChange = (studentId) => {
    const student = allStudents.find(s => String(s.id) === String(studentId));
    if (student) {
      setIssueForm(prev => ({ 
        ...prev, 
        member_name: `${student.last_name || ''} ${student.first_name || ''} ${student.middle_name || ''}`.replace(/\s+/g, ' ').trim(), 
        member_id: student.student_id_no 
      }));
    }
  };

  const handleMemberTypeChange = async (type) => {
    setMemberType(type);
    setIssueForm(prev => ({ ...prev, member_id: "", member_name: "", member_class: "" }));
    setSelectedClass("");
    setAllStudents([]);
    if (type === "staff") {
      try {
        const staff = await getAllStaff();
        setAllStaff(staff || []);
      } catch (err) {
        console.error("Failed to fetch staff:", err);
        toast.error("Failed to load staff list");
      }
    }
  };

  const handleStaffChange = (staffId) => {
    const staffMember = allStaff.find(s => String(s.id) === String(staffId));
    if (staffMember) {
      setIssueForm(prev => ({ 
        ...prev, 
        member_name: staffMember.full_name, 
        member_id: staffMember.employee_id || `ST-${staffMember.id}`,
        member_class: "Staff"
      }));
    }
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setIssueForm(prev => ({ ...prev, book_id: "" }));
    const filtered = availableBooks.filter(b => b.genre === category);
    setFilteredBooksByCategory(filtered);
  };

  const handleBookChange = (bookId) => {
    setIssueForm(prev => ({ ...prev, book_id: bookId }));
  };

  const selectedBook = useMemo(() => {
    return availableBooks.find(b => String(b.id) === String(issueForm.book_id));
  }, [availableBooks, issueForm.book_id]);

  const openReturnModal = (txn) => {
    setReturnTarget(txn);
    setShowReturnModal(true);
  };

  const statusBadge = (status) => {
    const styles = {
      Active: "bg-emerald-50 text-emerald-600 border-emerald-200",
      Overdue: "bg-rose-50 text-rose-600 border-rose-200",
      Returned: "bg-slate-100 text-slate-600 border-slate-200",
      "Returned Late": "bg-amber-50 text-amber-600 border-amber-200",
    };
    return (
      <span className={`text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-lg border ${styles[status] || styles.Active}`}>
        {status}
      </span>
    );
  };

  // Stats
  const activeCount = transactions.filter((t) => t.status === "Active").length;
  const overdueCount = transactions.filter((t) => t.status === "Overdue" || (t.status === 'Active' && new Date() > new Date(t.due_date))).length;
  const returnedCount = transactions.filter((t) => t.status === "Returned" || t.status === "Returned Late").length;

  return (
    <div className="p-4 lg:p-8 space-y-8 w-full max-w-full overflow-x-hidden bg-[#F8FAFC] min-h-screen text-left">
      <ModuleHeader
        title="Issue & Return"
        subTitle="Book Transaction Management"
        icon={ArrowLeftRight}
        toggleSidebar={toggleSidebar}
        badge="LIBRARY"
      >
        <button
          onClick={openIssueModal}
          className="bg-[#001736] text-white px-6 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl hover:bg-slate-800 transition-all flex items-center gap-2 active:scale-95"
        >
          <ArrowRight size={18} /> Issue Book
        </button>
      </ModuleHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Transactions", value: transactions.length, icon: ArrowLeftRight, color: "bg-indigo-600" },
          { label: "Currently Issued", value: activeCount, icon: BookMarked, color: "bg-emerald-500" },
          { label: "Overdue", value: overdueCount, icon: AlertTriangle, color: "bg-rose-500" },
          { label: "Returned", value: returnedCount, icon: CheckCircle2, color: "bg-slate-500" },
        ].map((s, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 group hover:shadow-md transition-all">
            <div className={`w-11 h-11 rounded-xl ${s.color} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}>
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
              <h4 className="text-2xl font-black text-[#001736]">{s.value}</h4>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by book, member, or ID..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-bold text-[#001736] uppercase tracking-wide outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="appearance-none pl-11 pr-8 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-[#001736] uppercase tracking-widest outline-none focus:border-amber-400 transition-all cursor-pointer"
          >
            <option value="All">All Types</option>
            <option value="Active">Active (Issued)</option>
            <option value="Overdue">Overdue</option>
            <option value="Returned">Returned</option>
            <option value="Returned Late">Returned Late</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <button
              disabled={isImporting}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-[#001736] text-[#001736] rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95 whitespace-nowrap disabled:opacity-50"
            >
              {isImporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
              {isImporting ? "Importing..." : "Import"}
              <ChevronDown className="w-3 h-3 ml-1" />
            </button>

            {/* Import Dropdown */}
            {!isImporting && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden text-left">
                <label className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-100">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Import Excel</span>
                  <input type="file" accept=".xlsx, .xls" className="hidden" onChange={(e) => handleImport(e, 'excel')} />
                </label>
                <label className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-100">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Import CSV</span>
                  <input type="file" accept=".csv" className="hidden" onChange={(e) => handleImport(e, 'csv')} />
                </label>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowIssueModal(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg hover:shadow-xl active:scale-95"
          >
            <ArrowRight className="w-4 h-4" />
            Issue Book
          </button>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="mb-6">
        <div className="px-4 py-3 text-center">
          <h3 className="text-[13px] font-black text-[#1E293B] uppercase tracking-[0.2em]">ISSUE &amp; RETURN LOG</h3>
        </div>
        <DataTable
          headers={[
            { label: "Book Title" },
            { label: "Member Name" },
            { label: "Member ID" },
            { label: "Class" },
            { label: "Issue Date" },
            { label: "Due Date" },
            { label: "Return Date" },
            { label: "Status" },
            { label: "Action" }
          ].map(h => ({
            label: h.label,
            className: `!bg-[#CED8E4] !text-[#1E293B] !border-r !border-[#1E293B] !px-4 !py-4 hover:bg-[#C1CDDB] transition-colors`
          }))}
          columnCount={9}
          emptyMessage="No transactions found"
          footer={
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#001736] opacity-60">
                Showing <span className="font-bold">{filteredTransactions.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold">{Math.min(currentPage * itemsPerPage, filteredTransactions.length)}</span> of <span className="font-bold">{filteredTransactions.length}</span> Records
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
          }
        >
          {paginatedTransactions.map((txn) => (
            <tr key={txn.id} className="hover:bg-slate-50 transition-colors group border-b border-[#1E293B] last:border-b-0 text-center">
              <td className="px-2 py-4 border-r border-[#1E293B] text-left">
                <div className="flex flex-col">
                  <p className="font-black text-[#1E293B] text-[12px] group-hover:text-blue-600 transition-colors">{txn.bookTitle}</p>
                  <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase">{txn.isbn}</p>
                </div>
              </td>
              <td className="px-2 py-4 border-r border-[#1E293B] text-left text-[12px] font-black text-[#1E293B] uppercase">
                {txn.s_last ? `${txn.s_last} ${txn.s_first} ${txn.s_middle || ''}`.replace(/\s+/g, ' ').trim() : txn.member_name}
              </td>
              <td className="px-2 py-4 border-r border-[#1E293B] text-[11px] text-slate-500 font-bold uppercase">{txn.member_id}</td>
              <td className="px-2 py-4 border-r border-[#1E293B] text-[11px] font-bold text-[#1E293B] uppercase">{txn.member_class}</td>
              <td className="px-2 py-4 border-r border-[#1E293B] text-[11px] text-[#1E293B] font-bold">{new Date(txn.issue_date).toLocaleDateString()}</td>
              <td className="px-2 py-4 border-r border-[#1E293B] text-[11px] text-[#1E293B] font-bold">{new Date(txn.due_date).toLocaleDateString()}</td>
              <td className="px-2 py-4 border-r border-[#1E293B] text-[11px] text-[#1E293B] font-bold">{txn.return_date ? new Date(txn.return_date).toLocaleDateString() : "—"}</td>
              <td className="px-2 py-4 border-r border-[#1E293B]">
                <div className="flex flex-col items-center justify-center">
                  {statusBadge(txn.status)}
                </div>
              </td>
              <td className="px-2 py-4">
                <div className="flex items-center justify-center gap-2">
                  {(txn.status === "Active" || txn.status === "Overdue") && (
                    <button
                      onClick={() => openReturnModal(txn)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#001736] border border-[#001736] text-white rounded text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all"
                      title="Return this book"
                    >
                      <Undo2 className="w-3 h-3" />
                      Return
                    </button>
                  )}
                  {(txn.status === "Returned" || txn.status === "Returned Late") && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-400 rounded text-[10px] font-black uppercase tracking-widest">
                      <CheckCircle2 className="w-3 h-3" />
                      Done
                    </span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      </div>

      {/* ═══════════ ISSUE MODAL ═══════════ */}
      {showIssueModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 bg-emerald-700 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg"><ArrowRight className="w-5 h-5 text-white" /></div>
                <h2 className="text-white font-black text-lg uppercase tracking-wider">Issue Book</h2>
              </div>
              <button onClick={() => setShowIssueModal(false)} className="p-2 bg-white/10 hover:bg-rose-500 text-white rounded-xl transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto grow bg-slate-50 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Book Category *</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-[#001736] outline-none focus:border-emerald-400 transition-all cursor-pointer"
                  >
                    <option value="">Choose Category...</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Select Book *</label>
                  <select
                    value={issueForm.book_id}
                    onChange={(e) => handleBookChange(e.target.value)}
                    disabled={!selectedCategory}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-[#001736] outline-none focus:border-emerald-400 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <option value="">Select a book...</option>
                    {filteredBooksByCategory.map(book => (
                      <option key={book.id} value={book.id}>
                        {book.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedBook && (
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Book Details</p>
                      <p className="text-sm font-black text-[#001736]">{selectedBook.title}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">ISBN Number</p>
                      <p className="text-sm font-mono font-bold text-[#001736]">{selectedBook.isbn}</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Member Type *</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => handleMemberTypeChange("student")}
                    className={`flex-1 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all ${memberType === "student" ? "bg-[#001736] text-white border-[#001736]" : "bg-white text-slate-600 border-slate-200"}`}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMemberTypeChange("staff")}
                    className={`flex-1 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all ${memberType === "staff" ? "bg-[#001736] text-white border-[#001736]" : "bg-white text-slate-600 border-slate-200"}`}
                  >
                    Staff
                  </button>
                </div>
              </div>

              {memberType === "student" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Select Grade *</label>
                    <select
                      value={selectedClass}
                      onChange={(e) => handleGradeChange(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-[#001736] outline-none focus:border-emerald-400 transition-all cursor-pointer"
                    >
                      <option value="">Choose Grade...</option>
                      {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Select Student *</label>
                    <select
                      value={allStudents.find(s => s.student_id_no === issueForm.member_id)?.id || ""}
                      onChange={(e) => handleStudentChange(e.target.value)}
                      disabled={!selectedClass}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-[#001736] outline-none focus:border-emerald-400 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <option value="">{allStudents.length > 0 ? "Choose Student..." : "No students found"}</option>
                      {allStudents.map(s => <option key={s.id} value={s.id}>{`${s.last_name || ''} ${s.first_name || ''} ${s.middle_name || ''}`.replace(/\s+/g, ' ').trim()} ({s.student_id_no})</option>)}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Select Staff Member *</label>
                    <select
                      value={allStaff.find(s => (s.employee_id || `ST-${s.id}`) === issueForm.member_id)?.id || ""}
                      onChange={(e) => handleStaffChange(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-[#001736] outline-none focus:border-emerald-400 transition-all cursor-pointer"
                    >
                      <option value="">Choose Staff Member...</option>
                      {allStaff.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.full_name} ({s.employee_id || `ST-${s.id}`}) - {s.designation || 'Staff'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Student ID (Auto)</label>
                  <input type="text" readOnly value={issueForm.member_id} className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-[13px] font-bold text-[#001736] outline-none" placeholder="Auto-filled" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Due Date</label>
                  <input type="date" value={issueForm.due_date} onChange={(e) => setIssueForm({ ...issueForm, due_date: e.target.value })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-[#001736] outline-none focus:border-emerald-400 transition-all" />
                </div>
              </div>

              <button
                onClick={handleIssue}
                className="w-full py-4 bg-emerald-700 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
              >
                Confirm Issue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ RETURN CONFIRM MODAL ═══════════ */}
      {showReturnModal && returnTarget && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden">
            <div className="px-8 py-6 bg-[#001736] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg"><Undo2 className="w-5 h-5 text-[#FFB606]" /></div>
                <h2 className="text-white! font-black text-lg uppercase tracking-wider">Confirm Return</h2>
              </div>
              <button onClick={() => { setShowReturnModal(false); setReturnTarget(null); }} className="p-2 bg-white/10 hover:bg-rose-500 text-white rounded-xl transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 space-y-4 bg-slate-50">
              <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-indigo-500" />
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Book</p>
                    <p className="font-bold text-[#001736] text-[14px]">{returnTarget.bookTitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Member</p>
                    <p className="font-bold text-[#001736] text-[14px]">{returnTarget.member_name} ({returnTarget.member_id})</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-emerald-500" />
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Due Date</p>
                    <p className="font-bold text-[#001736] text-[14px]">{new Date(returnTarget.due_date).toLocaleDateString()}</p>
                  </div>
                </div>
                {new Date() > new Date(returnTarget.due_date) && (
                  <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 px-4 py-2 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">
                      Overdue by {Math.ceil((new Date() - new Date(returnTarget.due_date)) / 86400000)} days
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 pt-2">
                <button onClick={() => { setShowReturnModal(false); setReturnTarget(null); }} className="flex-1 py-3 border border-slate-200 rounded-xl text-[11px] font-black text-slate-600 uppercase tracking-widest hover:bg-slate-50 transition-all">
                  Cancel
                </button>
                <button onClick={() => handleReturn(returnTarget.id)} className="flex-1 py-3 bg-[#001736] text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg">
                  Confirm Return
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueReturnBook;
