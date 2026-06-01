import React, { useState, useEffect, useMemo } from "react";
import {
  Book,
  Search,
  Filter,
  Library as LibraryIcon,
  ChevronDown,
  Info,
  CheckCircle2,
  XCircle,
  Clock,
  CalendarDays,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import ModuleHeader from "../../../admcomponents/ModuleHeader";
import DataTable from "../../../admcomponents/DataTable";
import libraryAPI from "../../../../services/libraryAPI";
import * as staffAPI from "../../../../services/staffAPI";
import { useAuth } from "../../../../context/AuthContext";
import { toast } from "react-hot-toast";

const TeacherLibrary = ({ toggleSidebar }) => {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchBooks = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      
      const profile = await staffAPI.getStaffProfile(user.id);
      if (!profile || !profile.employee_id) {
          setBooks([]);
          return;
      }
      const myEmployeeId = profile.employee_id;

      const [allBooks, allTransactions] = await Promise.all([
          libraryAPI.getAllBooks(),
          libraryAPI.getTransactions()
      ]);

      const myTransactions = allTransactions.filter(t => t.member_id === myEmployeeId);

      const myBooks = myTransactions.map(t => {
          const bookDetails = allBooks.find(b => b.id === t.book_id) || {};
          return {
              ...bookDetails,
              transaction_id: t.id,
              issue_date: t.issue_date,
              due_date: t.due_date,
              return_date: t.return_date,
              transaction_status: t.status,
              title: bookDetails.title || t.bookTitle,
              isbn: bookDetails.isbn || t.isbn,
          };
      });

      setBooks(myBooks);
    } catch {
      toast.error("Failed to load library data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter]);

  const categories = useMemo(() => {
    return ["All", ...new Set(books.map((b) => b.genre))].filter(Boolean);
  }, [books]);

  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      const matchSearch =
        (b.title || "").toLowerCase().includes(search.toLowerCase()) ||
        (b.isbn || "").toLowerCase().includes(search.toLowerCase()) ||
        (b.author || "").toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === "All" || b.genre === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [books, search, categoryFilter]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage);
  const paginatedBooks = filteredBooks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const statusBadge = (status) => {
    if (status === "Returned") {
      return (
        <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100">
          <CheckCircle2 className="w-3 h-3" /> Returned
        </span>
      );
    }
    if (status === "Active") {
      return (
        <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-100">
          <Clock className="w-3 h-3" /> Active
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-rose-100">
        <XCircle className="w-3 h-3" /> {status}
      </span>
    );
  };

  const paginationFooter = (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
        Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredBooks.length)} of {filteredBooks.length} records
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 disabled:opacity-50 hover:bg-slate-100 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-[12px] font-black text-[#001736] px-3">
          Page {currentPage} of {totalPages || 1}
        </span>
        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages || totalPages === 0}
          className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 disabled:opacity-50 hover:bg-slate-100 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-[1600px] mx-auto bg-[#F8FAFC] min-h-screen text-left">
      <ModuleHeader
        title="My Issued Books"
        subTitle="Your Personal Library Records"
        icon={LibraryIcon}
        toggleSidebar={toggleSidebar}
        badge="TEACHER"
      />

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { label: "Total Books Borrowed", value: books.length, icon: Book, color: "text-blue-600", bg: "bg-blue-100" },
          { label: "Currently Active", value: books.filter(b => b.transaction_status === "Active" || b.transaction_status === "Overdue").length, icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
          { label: "Books Returned", value: books.filter(b => b.transaction_status === "Returned" || b.transaction_status === "Returned Late").length, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-100" }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-xl ${stat.bg}`}><stat.icon className={`w-6 h-6 ${stat.color}`} /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-black text-[#001736]">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your books by title, author, or ISBN..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-bold text-[#001736] outline-none focus:border-blue-400 transition-all"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="appearance-none pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-[#001736] uppercase tracking-widest outline-none cursor-pointer"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Books Table */}
      <DataTable
        headers={[
          { label: "Book Info" },
          { label: "Category" },
          { label: "Issued On" },
          { label: "Due Date" },
          { label: "Status" }
        ]}
        columnCount={5}
        loading={loading}
        emptyMessage="You have not issued any books yet."
        footer={filteredBooks.length > 0 ? paginationFooter : null}
      >
        {paginatedBooks.map((book) => (
          <tr key={book.transaction_id} className="hover:bg-slate-50/50 transition-colors group">
            <td className="px-6 py-5 border-b border-r border-black/10">
              <div className="flex flex-col">
                <span className="text-[13px] font-black text-[#001736] group-hover:text-blue-600 transition-colors">{book.title || "Unknown Book"}</span>
                <span className="text-[10px] text-slate-400 font-bold mt-1">By {book.author || "Unknown"} | ISBN: {book.isbn || "N/A"}</span>
              </div>
            </td>
            <td className="px-6 py-5 border-b border-r border-black/10">
              <span className="text-[10px] font-bold text-[#001736] bg-slate-100 px-3 py-1 rounded-full uppercase tracking-wider">
                {book.genre || "N/A"}
              </span>
            </td>
            <td className="px-6 py-5 border-b border-r border-black/10">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 rounded-lg"><CalendarDays className="w-3.5 h-3.5 text-blue-600" /></div>
                <span className="text-[11px] font-black text-[#001736]">
                  {book.issue_date ? new Date(book.issue_date).toLocaleDateString() : "N/A"}
                </span>
              </div>
            </td>
            <td className="px-6 py-5 border-b border-r border-black/10">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-rose-50 rounded-lg"><Clock className="w-3.5 h-3.5 text-rose-600" /></div>
                <span className={`text-[11px] font-black ${new Date(book.due_date) < new Date() && book.transaction_status === 'Active' ? 'text-rose-600' : 'text-[#001736]'}`}>
                  {book.due_date ? new Date(book.due_date).toLocaleDateString() : "N/A"}
                </span>
              </div>
            </td>
            <td className="px-6 py-5 border-b border-black/10">
              {statusBadge(book.transaction_status)}
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
};

export default TeacherLibrary;
