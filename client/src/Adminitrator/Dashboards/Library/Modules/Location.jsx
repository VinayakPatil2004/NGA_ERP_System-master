import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  MapPin,
  Search,
  RefreshCw,
  Eye,
  X,
  BookOpen,
  Hash,
  Layers,
  ArrowLeft,
  ArrowRight,
  Filter,
  ChevronDown,
  User,
  Tag,
  Calendar,
  BookMarked,
  Edit3,
} from "lucide-react";
import ModuleHeader from "../../../admcomponents/ModuleHeader";
import DataTable from "../../../admcomponents/DataTable";
import libraryAPI from "../../../../services/libraryAPI";
import { useAcademicYear } from "../../../../context/AcademicYearContext";
import { toast } from "react-toastify";

/**
 * Location Module – Displays physical shelf & rack placement of all books
 */
const Location = ({ toggleSidebar }) => {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [shelfFilter, setShelfFilter] = useState("All");
  const [viewBook, setViewBook] = useState(null);
  const [editBook, setEditBook] = useState(null);
  const [editForm, setEditForm] = useState({ rack_number: "", shelf: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { selectedYear } = useAcademicYear();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleEditClick = (book) => {
    setEditBook(book);
    setEditForm({
      rack_number: book.rack_number || "",
      shelf: book.shelf || "",
    });
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!editBook) return;
    try {
      setIsSaving(true);
      const updatedBookData = {
        title: editBook.title,
        author: editBook.author,
        isbn: editBook.isbn,
        genre: editBook.genre,
        publisher: editBook.publisher,
        year: editBook.year,
        copies: editBook.copies,
        status: editBook.status,
        rack_number: editForm.rack_number,
        shelf: editForm.shelf,
      };
      await libraryAPI.updateBook(editBook.id, updatedBookData);
      toast.success("Book location updated successfully");
      setEditBook(null);
      fetchBooks();
    } catch {
      toast.error("Failed to update book location");
    } finally {
      setIsSaving(false);
    }
  };

  const fetchBooks = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await libraryAPI.getAllBooks(selectedYear?.id);
      setBooks(data || []);
    } catch {
      toast.error("Failed to load book locations");
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // Unique shelves for filter dropdown
  const shelves = useMemo(() => {
    const s = [...new Set(books.map((b) => b.shelf).filter(Boolean))].sort();
    return ["All", ...s];
  }, [books]);

  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      const matchSearch =
        (b.title || "").toLowerCase().includes(search.toLowerCase()) ||
        (b.isbn || "").includes(search) ||
        (b.rack_number || "").toLowerCase().includes(search.toLowerCase()) ||
        (b.shelf || "").toLowerCase().includes(search.toLowerCase());
      const matchShelf = shelfFilter === "All" || b.shelf === shelfFilter;
      return matchSearch && matchShelf;
    });
  }, [books, search, shelfFilter]);

  // Reset to page 1 whenever filters change (NOT inside useMemo!)
  useEffect(() => {
    setCurrentPage(1);
  }, [search, shelfFilter]);

  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage);
  const paginatedBooks = filteredBooks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Stats
  const totalShelves = [...new Set(books.map((b) => b.shelf).filter(Boolean))].length;
  const totalRacks = [...new Set(books.map((b) => b.rack_number).filter(Boolean))].length;
  const assignedBooks = books.filter((b) => b.shelf || b.rack_number).length;

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

  // Plain JSX variable — always visible pagination
  const paginationFooter = (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-[#001736] opacity-60">
        Showing <span className="font-bold">{filteredBooks.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold">{Math.min(currentPage * itemsPerPage, filteredBooks.length)}</span> of <span className="font-bold">{filteredBooks.length}</span> Records
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-white border border-black rounded text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          Prev
        </button>
        <div className="px-4 text-[10px] font-black text-[#001736] uppercase tracking-widest">
          Page {currentPage} of {totalPages || 1}
        </div>
        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages || totalPages === 0}
          className="px-4 py-2 bg-white border border-black rounded text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          Next
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-4 lg:p-8 space-y-8 w-full max-w-full overflow-x-hidden bg-[#F8FAFC] min-h-screen text-left">
      <ModuleHeader
        title="Book Location"
        subTitle="Physical Shelf & Rack Registry"
        icon={MapPin}
        toggleSidebar={toggleSidebar}
        badge="LIBRARY"
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Books", value: books.length, icon: BookOpen, color: "bg-indigo-600" },
          { label: "Total Shelves", value: totalShelves, icon: Layers, color: "bg-violet-500" },
          { label: "Total Racks", value: totalRacks, icon: MapPin, color: "bg-amber-500" },
          { label: "Located Books", value: assignedBooks, icon: BookMarked, color: "bg-emerald-500" },
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
            placeholder="Search by title, ISBN, shelf, or rack..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-bold text-[#001736] uppercase tracking-wide outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={shelfFilter}
            onChange={(e) => setShelfFilter(e.target.value)}
            className="appearance-none pl-11 pr-8 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-[#001736] uppercase tracking-widest outline-none focus:border-amber-400 transition-all cursor-pointer"
          >
            {shelves.map((s) => (
              <option key={s} value={s}>{s === "All" ? "All Shelves" : `Shelf: ${s}`}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        <button
          onClick={fetchBooks}
          disabled={isLoading}
          className="flex items-center gap-2 px-5 py-3 bg-white border border-[#001736] text-[#001736] rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="mb-6">
      

        <DataTable
          headers={[
            { label: "#", className: "!bg-[#CED8E4] !text-[#1E293B] !border-r !border-[#1E293B] !px-4 !py-4 text-center w-12" },
            { label: "Book Name", className: "!bg-[#CED8E4] !text-[#1E293B] !border-r !border-[#1E293B] !px-4 !py-4" },
            { label: "ISBN", className: "!bg-[#CED8E4] !text-[#1E293B] !border-r !border-[#1E293B] !px-4 !py-4" },
            { label: "Rack Number", className: "!bg-[#CED8E4] !text-[#1E293B] !border-r !border-[#1E293B] !px-4 !py-4 text-center" },
            { label: "Shelf", className: "!bg-[#CED8E4] !text-[#1E293B] !border-r !border-[#1E293B] !px-4 !py-4 text-center" },
            { label: "Status", className: "!bg-[#CED8E4] !text-[#1E293B] !border-r !border-[#1E293B] !px-4 !py-4 text-center" },
            { label: "Actions", className: "!bg-[#CED8E4] !text-[#1E293B] !px-4 !py-4 text-center" },
          ]}
          columnCount={7}
          loading={isLoading}
          emptyMessage="No books found in location registry"
          footer={paginationFooter}
        >
          {paginatedBooks.map((book, idx) => (
            <tr
              key={book.id}
              className="hover:bg-slate-50 transition-colors group border-b border-[#1E293B] last:border-b-0"
            >
              <td className="px-4 py-4 border-r border-[#1E293B] text-center text-[11px] font-black text-slate-400">
                {(currentPage - 1) * itemsPerPage + idx + 1}
              </td>
              <td className="px-4 py-4 border-r border-[#1E293B]">
                <p className="font-black text-[#1E293B] text-[12px] group-hover:text-indigo-600 transition-colors">
                  {book.title}
                </p>
                <p className="text-[10px] font-medium text-slate-400 mt-0.5">{book.author}</p>
              </td>
              <td className="px-4 py-4 border-r border-[#1E293B] text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                {book.isbn || "—"}
              </td>
              <td className="px-4 py-4 border-r border-[#1E293B] text-center">
                {book.rack_number ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-[10px] font-black text-amber-700 uppercase tracking-wider">
                    <MapPin className="w-3 h-3" />
                    {book.rack_number}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-300 font-bold">—</span>
                )}
              </td>
              <td className="px-4 py-4 border-r border-[#1E293B] text-center">
                {book.shelf ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-lg text-[10px] font-black text-indigo-700 uppercase tracking-wider">
                    <Layers className="w-3 h-3" />
                    {book.shelf}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-300 font-bold">—</span>
                )}
              </td>
              <td className="px-4 py-4 border-r border-[#1E293B] text-center">
                {statusBadge(book.status)}
              </td>
              <td className="px-4 py-4 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <button
                    onClick={() => setViewBook(book)}
                    className="p-2 border border-[#1E293B] text-[#1E293B] hover:bg-[#1E293B] hover:text-white transition-all rounded-lg"
                    title="View Details"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleEditClick(book)}
                    className="p-2 border border-[#1D4ED8] text-[#1D4ED8] hover:bg-[#1D4ED8] hover:text-white transition-all rounded-lg"
                    title="Edit Location"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      </div>

      {/* ═══════════ VIEW MODAL ═══════════ */}
      {viewBook && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 bg-[#001736] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg">
                  <MapPin className="w-5 h-5 text-[#FFB606]" />
                </div>
                <h2 className="text-white font-black text-lg uppercase tracking-wider">
                  Book Location Details
                </h2>
              </div>
              <button
                onClick={() => setViewBook(null)}
                className="p-2 bg-white/10 hover:bg-rose-500 text-white rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-3 bg-slate-50 overflow-y-auto grow">
              {/* Location highlight */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-indigo-600 p-4 rounded-xl text-center">
                  <Layers className="w-5 h-5 text-white/70 mx-auto mb-1" />
                  <p className="text-[9px] font-bold text-indigo-200 uppercase tracking-widest">Shelf</p>
                  <p className="text-xl font-black text-white">{viewBook.shelf || "N/A"}</p>
                </div>
                <div className="bg-amber-500 p-4 rounded-xl text-center">
                  <MapPin className="w-5 h-5 text-white/70 mx-auto mb-1" />
                  <p className="text-[9px] font-bold text-amber-100 uppercase tracking-widest">Rack No.</p>
                  <p className="text-xl font-black text-white">{viewBook.rack_number || "N/A"}</p>
                </div>
              </div>

              {[
                { label: "Book Title", value: viewBook.title, icon: BookOpen },
                { label: "Author", value: viewBook.author, icon: User },
                { label: "ISBN", value: viewBook.isbn || "Not Available", icon: Hash },
                { label: "Category", value: viewBook.genre, icon: Tag },
                { label: "Publisher", value: viewBook.publisher || "—", icon: Layers },
                { label: "Year", value: viewBook.year, icon: Calendar },
                { label: "Stock (Total / Available)", value: `${viewBook.copies} / ${viewBook.available}`, icon: BookMarked },
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

      {/* ═══════════ EDIT MODAL ═══════════ */}
      {editBook && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 bg-[#001736] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg">
                  <Edit3 className="w-5 h-5 text-[#FFB606]" />
                </div>
                <h2 className="text-white! font-black text-lg uppercase tracking-wider">
                  Update Location
                </h2>
              </div>
              <button
                onClick={() => setEditBook(null)}
                className="p-2 bg-white/10 hover:bg-rose-500 text-white rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveChanges} className="p-8 space-y-6 bg-slate-50 flex-1 overflow-y-auto">
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Book Title</p>
                <h4 className="text-sm font-bold text-[#001736] mt-1 leading-tight">{editBook.title}</h4>
                <p className="text-[10px] text-slate-500 mt-1 font-medium">{editBook.author}</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Rack Number
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={editForm.rack_number}
                      onChange={(e) => setEditForm(prev => ({ ...prev, rack_number: e.target.value }))}
                      placeholder="e.g. Rack A, Row 3"
                      className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-[#001736] outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Shelf
                  </label>
                  <div className="relative">
                    <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={editForm.shelf}
                      onChange={(e) => setEditForm(prev => ({ ...prev, shelf: e.target.value }))}
                      placeholder="e.g. Shelf 1, Section B"
                      className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-[#001736] outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all uppercase"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditBook(null)}
                  className="flex-1 px-5 py-3.5 bg-white border border-slate-300 text-slate-500 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-5 py-3.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Location;
