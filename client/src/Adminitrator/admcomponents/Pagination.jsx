import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const Pagination = ({ currentPage, totalPages, totalItems, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
      <p className="text-[10px] font-black text-[#1E293B] uppercase tracking-widest">
        Page {currentPage} of {totalPages} {totalItems !== undefined && `· ${totalItems} items`}
      </p>
      <div className="flex gap-2">
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="p-2 border border-[#1E293B] text-[#1E293B] disabled:opacity-30 hover:bg-[#1E293B] hover:text-white transition-all rounded"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-9 h-9 text-[11px] font-black border rounded transition-all ${
              currentPage === page
                ? 'bg-[#001736] text-white border-[#001736]'
                : 'border-[#1E293B] text-[#1E293B] hover:bg-[#1E293B] hover:text-white'
            }`}
          >
            {page}
          </button>
        ))}
        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="p-2 border border-[#1E293B] text-[#1E293B] disabled:opacity-30 hover:bg-[#1E293B] hover:text-white transition-all rounded"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
