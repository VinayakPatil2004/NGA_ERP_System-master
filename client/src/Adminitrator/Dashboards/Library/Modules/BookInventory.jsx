import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  BookOpen,
  Search,
  FileSpreadsheet,
  FileDown,
  FileText,
  RefreshCw,
  PlusCircle,
  Edit3,
  Trash2,
  X,
  Filter,
  ChevronDown,
  ChevronUp,
  BookMarked,
  Hash,
  User,
  Tag,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  Eye,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import ModuleHeader from "../../../admcomponents/ModuleHeader";
import libraryAPI from "../../../../services/libraryAPI";
import { toast } from "react-toastify";
import DataTable from "../../../admcomponents/DataTable";

/**
 * BookInventory – Full Book Catalog & CRUD Module
 */

const CATEGORIES = ["All", "Science", "Mathematics", "Literature", "History", "Technology", "Arts", "Comics", "Reference", "Biography"];
const STATUS_OPTIONS = ["Available", "Issued", "Reserved", "Lost", "Damaged"];

const emptyBook = {
  title: "",
  author: "",
  isbn: "",
  genre: "Science",
  publisher: "",
  year: new Date().getFullYear(),
  copies: 1,
  available: 1,
  shelf: "",
  rack_number: "",
  status: "Available",
};

const BookInventory = ({ toggleSidebar }) => {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sortField, setSortField] = useState("title");
  const [sortDir, setSortDir] = useState("asc");
  const [showModal, setShowModal] = useState(false);
  const [editBook, setEditBook] = useState(null);
  const [form, setForm] = useState(emptyBook);
  const [viewBook, setViewBook] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [isImporting, setIsImporting] = useState(false);
  const itemsPerPage = 10;

  const fetchBooks = useCallback(async () => {
    try {
      const data = await libraryAPI.getAllBooks();
      setBooks(data || []);
    } catch {
      toast.error("Failed to load book catalog");
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      await fetchBooks();
    };
    load();
  }, [fetchBooks]);

  // Filtered + Sorted
  const filteredBooks = useMemo(() => {
    let result = books.filter((b) => {
      const matchSearch =
        (b.title || "").toLowerCase().includes(search.toLowerCase()) ||
        (b.author || "").toLowerCase().includes(search.toLowerCase()) ||
        (b.isbn || "").includes(search);
      const matchCategory = categoryFilter === "All" || b.genre === categoryFilter;
      return matchSearch && matchCategory;
    });

    result.sort((a, b) => {
      const aVal = a[sortField] || "";
      const bVal = b[sortField] || "";
      if (typeof aVal === "string") {
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });

    return result;
  }, [books, search, categoryFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage);
  const paginatedBooks = filteredBooks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ field }) =>
    sortField === field ? (
      sortDir === "asc" ? (
        <ChevronUp className="w-3 h-3" />
      ) : (
        <ChevronDown className="w-3 h-3" />
      )
    ) : null;

  const openAddModal = () => {
    setEditBook(null);
    setForm(emptyBook);
    setShowModal(true);
  };

  const openEditModal = (book) => {
    setEditBook(book);
    setForm({ ...emptyBook, ...book });
    setShowModal(true);
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    // Validation
    if (!form.title.trim()) {
      toast.error("Book Title is required");
      return;
    }
    if (!form.author.trim()) {
      toast.error("Author name is required");
      return;
    }
    if (!form.isbn.trim()) {
        toast.error("ISBN number is required");
        return;
    }
    if (form.copies < 1) {
      toast.error("Total copies must be at least 1");
      return;
    }

    try {
      setIsSaving(true);
      const payload = { ...form };
      
      if (editBook) {
        await libraryAPI.updateBook(editBook.id, payload);
        toast.success(`Book updated: ${form.title}`);
      } else {
        await libraryAPI.addBook(payload);
        toast.success(`Book added to inventory: ${form.title}`);
      }
      fetchBooks();
      setShowModal(false);
      setForm(emptyBook);
      setEditBook(null);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save book record");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await libraryAPI.deleteBook(id);
      toast.success("Book removed from library");
      fetchBooks();
      setDeleteConfirm(null);
    } catch {
      toast.error("Failed to delete book");
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
      const res = await libraryAPI.importBooks(file);
      toast.success(res.message || "Books imported successfully!");
      fetchBooks();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to import books");
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const statusBadge = (status) => {
    const styles = {
      Available: "bg-emerald-50 text-emerald-600 border-emerald-200",
      Issued: "bg-amber-50 text-amber-600 border-amber-200",
      Reserved: "bg-indigo-50 text-indigo-600 border-indigo-200",
      Lost: "bg-rose-50 text-rose-600 border-rose-200",
      Damaged: "bg-slate-100 text-slate-600 border-slate-200",
    };
    return (
      <span className={`text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-lg border ${styles[status] || styles.Available}`}>
        {status}
      </span>
    );
  };

  // Stats
  const totalCopies = books.reduce((a, b) => a + (parseInt(b.copies) || 0), 0);
  const totalAvailable = books.reduce((a, b) => a + (parseInt(b.available) || 0), 0);
  const totalIssued = totalCopies - totalAvailable;

  return (
    <div className="p-4 lg:p-8 space-y-8 w-full max-w-full overflow-x-hidden bg-[#F8FAFC] min-h-screen text-left">
      <ModuleHeader
        title="Book Inventory"
        subTitle="Catalog Management & Stock Registry"
        icon={BookOpen}
        toggleSidebar={toggleSidebar}
        badge="LIBRARY"
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Titles", value: books.length, icon: BookOpen, color: "bg-indigo-600" },
          { label: "Total Copies", value: totalCopies.toLocaleString(), icon: Layers, color: "bg-violet-500" },
          { label: "Available", value: totalAvailable.toLocaleString(), icon: CheckCircle2, color: "bg-emerald-500" },
          { label: "Issued Out", value: totalIssued.toLocaleString(), icon: BookMarked, color: "bg-amber-500" },
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
            placeholder="Search by title, author, or ISBN..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-bold text-[#001736] uppercase tracking-wide outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
          />
        </div>

        <div className="relative group">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="appearance-none pl-11 pr-8 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-[#001736] uppercase tracking-widest outline-none focus:border-amber-400 transition-all cursor-pointer"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
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
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
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
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#001736] text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-[#002050] transition-all shadow-lg hover:shadow-xl active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            Add Book
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="mb-6">
        <div className="px-4 py-3 text-center">
          <h3 className="text-[13px] font-black text-[#1E293B] uppercase tracking-[0.2em]">BOOK INVENTORY LOG</h3>
        </div>
        <DataTable
          headers={[
            { key: "srno", label: "SR.NO" },
            { key: "title", label: "Title" },
            { key: "author", label: "Author" },
            { key: "isbn", label: "ISBN" },
            { key: "genre", label: "Category" },
            { key: "copies", label: "Total" },
            { key: "available", label: "Stock" },
            { key: "rack_number", label: "Rack Number" },
            { key: "status", label: "Status" },
            { key: "actions", label: "Actions" }
          ].map((col) => ({
            label: col.key === 'srno' || col.key === 'actions' ? col.label : (
              <div
                className="flex items-center justify-center gap-1 cursor-pointer"
                onClick={() => handleSort(col.key)}
              >
                {col.label}
                <SortIcon field={col.key} />
              </div>
            ),
            className: `!bg-[#CED8E4] !text-[#1E293B] !border-r !border-[#1E293B] !px-4 !py-4 hover:bg-[#C1CDDB] transition-colors${col.key === 'srno' ? ' text-center w-12' : ''}`
          }))}
          columnCount={10}
          emptyMessage="No books found in inventory"
          footer={
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#001736] opacity-60">
                Showing <span className="font-bold">{filteredBooks.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold">{Math.min(currentPage * itemsPerPage, filteredBooks.length)}</span> of <span className="font-bold">{filteredBooks.length}</span> Records
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
          {paginatedBooks.map((book, idx) => (
            <tr
              key={book.id}
              className="hover:bg-slate-50 transition-colors group border-b border-[#1E293B] last:border-b-0 text-center"
            >
              <td className="px-2 py-4 border-r border-[#1E293B] text-[11px] font-black text-slate-400 text-center">
                {(currentPage - 1) * itemsPerPage + idx + 1}
              </td>
              <td className="px-2 py-4 border-r border-[#1E293B] text-left">
                <p className="font-black text-[#1E293B] text-[12px] group-hover:text-blue-600 transition-colors">
                  {book.title}
                </p>
              </td>
              <td className="px-2 py-4 border-r border-[#1E293B] text-[11px] font-bold text-[#1E293B]">{book.author}</td>
              <td className="px-2 py-4 border-r border-[#1E293B] text-[10px] text-slate-500 font-bold uppercase">{book.isbn}</td>
              <td className="px-2 py-4 border-r border-[#1E293B] text-[10px] font-bold text-[#1E293B] uppercase tracking-wider">{book.genre}</td>
              <td className="px-2 py-4 border-r border-[#1E293B] text-[12px] font-black text-[#1E293B]">{book.copies}</td>
              <td className="px-2 py-4 border-r border-[#1E293B] text-[12px] font-black text-emerald-600">{book.available}</td>
              <td className="px-2 py-4 border-r border-[#1E293B] text-[10px] font-bold text-[#1E293B] uppercase">{book.rack_number || "—"}</td>
              <td className="px-2 py-4 border-r border-[#1E293B]">
                <div className="flex flex-col items-center justify-center">
                  {statusBadge(book.status)}
                </div>
              </td>
              <td className="px-2 py-4">
                <div className="flex items-center justify-center gap-2">
                  <button onClick={() => setViewBook(book)} className="p-1.5 border border-[#1E293B] text-[#1E293B] hover:bg-[#1E293B] hover:text-white transition-all" title="View">
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => openEditModal(book)} className="p-1.5 border border-[#1E293B] text-[#1E293B] hover:bg-[#1E293B] hover:text-white transition-all" title="Edit">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeleteConfirm(book.id)} className="p-1.5 border border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white transition-all" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      </div>

      {/* ═══════════ ADD / EDIT MODAL ═══════════ */}
      {showModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 bg-[#001736] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <BookOpen className="w-5 h-5 text-[#FFB606]" />
                </div>
                <h2 className="text-white! font-black text-lg uppercase tracking-wider">
                  {editBook ? "Edit Book Record" : "Add New Book"}
                </h2>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 bg-white/10 hover:bg-rose-500 text-white rounded-xl transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto grow bg-slate-50 space-y-5">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Book Title *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-[#001736] outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all" placeholder="Enter book title..." />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Author *</label>
                  <input type="text" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-[#001736] outline-none focus:border-amber-400 transition-all" placeholder="Author name..." />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">ISBN Number *</label>
                  <input type="text" value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-[#001736] outline-none focus:border-amber-400 transition-all" placeholder="978-..." />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Book Category *</label>
                  <select value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-[#001736] outline-none cursor-pointer">
                    {CATEGORIES.filter((c) => c !== "All").map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Publisher</label>
                  <input type="text" value={form.publisher} onChange={(e) => setForm({ ...form, publisher: e.target.value })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-[#001736] outline-none focus:border-amber-400 transition-all" placeholder="Publisher name..." />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Year</label>
                  <input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) || 0 })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-[#001736] outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Total Copies</label>
                  <input type="number" min={1} value={form.copies} onChange={(e) => setForm({ ...form, copies: parseInt(e.target.value) || 1, available: parseInt(e.target.value) || 1 })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-[#001736] outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Available</label>
                  <input type="number" min={0} value={form.available} onChange={(e) => setForm({ ...form, available: parseInt(e.target.value) || 0 })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-[#001736] outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Shelf</label>
                  <input type="text" value={form.shelf} onChange={(e) => setForm({ ...form, shelf: e.target.value })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-[#001736] outline-none" placeholder="e.g. A-1" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Rack Number</label>
                <input type="text" value={form.rack_number || ""} onChange={(e) => setForm({ ...form, rack_number: e.target.value })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-[#001736] outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all" placeholder="e.g. R-01" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-[#001736] outline-none cursor-pointer">
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`w-full py-4 ${isSaving ? 'bg-slate-400' : 'bg-[#001736]'} text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-[#002050] transition-all shadow-lg active:scale-[0.98] disabled:cursor-not-allowed`}
              >
                {isSaving ? "Processing..." : (editBook ? "Update Record" : "Add to Library")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ VIEW MODAL ═══════════ */}
      {viewBook && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 bg-[#001736] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg"><Eye className="w-5 h-5 text-[#FFB606]" /></div>
                <h2 className="text-white! font-black text-lg uppercase tracking-wider">Book Details</h2>
              </div>
              <button onClick={() => setViewBook(null)} className="p-2 bg-white/10 hover:bg-rose-500 text-white rounded-xl transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 space-y-4 bg-slate-50 overflow-y-auto grow">
              {[
                { label: "Title", value: viewBook.title, icon: BookOpen },
                { label: "Author", value: viewBook.author, icon: User },
                { label: "ISBN", value: viewBook.isbn, icon: Hash },
                { label: "Category", value: viewBook.genre, icon: Tag },
                { label: "Publisher", value: viewBook.publisher, icon: Layers },
                { label: "Year", value: viewBook.year, icon: Calendar },
                { label: "Stock (Total / Available)", value: `${viewBook.copies} / ${viewBook.available}`, icon: BookMarked },
                { label: "Shelf Location", value: viewBook.shelf || "Not Assigned", icon: Layers },
                { label: "Rack Number", value: viewBook.rack_number || "Not Assigned", icon: Hash },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
                  <item.icon className="w-4 h-4 text-amber-500 shrink-0" />
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</p>
                    <p className="text-[13px] font-bold text-[#001736]">{item.value}</p>
                  </div>
                </div>
              ))}
              <div className="pt-2 text-center">{statusBadge(viewBook.status)}</div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ DELETE CONFIRM ═══════════ */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-8 py-6 bg-rose-600 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-white" />
                <h2 className="text-white font-black text-lg uppercase tracking-wider">Confirm Delete</h2>
              </div>
            </div>
            <div className="p-8 space-y-6 text-center">
              <p className="text-slate-600 font-medium">Permanently remove this book from the catalog? This action cannot be undone.</p>
              <div className="flex items-center gap-4">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 border border-slate-200 rounded-xl text-[11px] font-black text-slate-600 uppercase tracking-widest hover:bg-slate-50 transition-all">
                  Cancel
                </button>
                <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-3 bg-rose-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg">
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookInventory;
