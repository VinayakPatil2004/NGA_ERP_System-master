import React from 'react';
import { Pencil, Trash2, Shield, Mail, Calendar, UserX, UserCheck, User, ShieldCheck } from 'lucide-react';
import DataTable from '../../../../../admcomponents/DataTable';

const UserTable = ({ users, onEdit, onDelete, onToggleBlock, pagination }) => {
  return (
    <DataTable
      headers={[
        { label: "User Details", className: "border-r border-black" },
        { label: "Role", className: "w-[150px] border-r border-black text-center" },
        { label: "Status", className: "w-[130px] border-r border-black text-center" },
        { label: "Joined Date", className: "w-[180px] border-r border-black text-center" },
        { label: "Actions", className: "text-center w-[180px]" }
      ]}
      columnCount={5}
      loading={false}
      emptyMessage="Zero System Identities Found"
      footer={pagination && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#001736] opacity-60">
            Showing <span className="font-bold">{(pagination.currentPage - 1) * pagination.itemsPerPage + 1}</span> to <span className="font-bold">{Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}</span> of <span className="font-bold">{pagination.totalItems}</span> Records
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => pagination.onPageChange(Math.max(1, pagination.currentPage - 1))}
              disabled={pagination.currentPage === 1}
              className="px-4 py-2 bg-white border border-black rounded text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Prev
            </button>
            <div className="px-4 text-[10px] font-black text-[#001736] uppercase tracking-widest">
              Page {pagination.currentPage} of {pagination.totalPages || 1}
            </div>
            <button
              onClick={() => pagination.onPageChange(Math.min(pagination.totalPages, pagination.currentPage + 1))}
              disabled={pagination.currentPage === pagination.totalPages || pagination.totalPages === 0}
              className="px-4 py-2 bg-white border border-black rounded text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}
    >
      {users.map((user) => (
        <tr key={`${user.type}-${user.id}`} className="hover:bg-slate-50/50 transition-colors group">
          <td className="px-8 py-6 border-b border-r border-black">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-50 border border-black rounded-xl flex items-center justify-center text-[#001736] shadow-sm group-hover:bg-[#001736] group-hover:text-white transition-all">
                <User size={24} />
              </div>
              <div>
                <p className="text-[14px] font-black text-[#001736] uppercase tracking-tight leading-none">
                  {user.full_name || user.username}
                </p>
                <div className="flex items-center gap-2 mt-1.5 text-slate-300">
                  <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[180px] text-slate-400">
                    {user.role_name === 'parent'
                      ? (user.mobile || 'NO MOBILE')
                      : (user.role_name === 'student'
                        ? (user.student_id_no || 'NO ID')
                        : (user.email || 'INTERNAL'))}
                  </span>
                </div>
              </div>
            </div>
          </td>
          <td className="px-8 py-6 border-b border-r border-black">
            <div className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-[#001736] font-black text-[10px] tracking-widest rounded-lg border border-black shadow-sm uppercase mx-auto w-fit">
              <ShieldCheck size={14} className="text-indigo-400" />
              {user.role_name}
            </div>
          </td>
          <td className="px-8 py-6 border-b border-r border-black text-center">
            <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2 border border-black ${user.is_blocked
              ? 'bg-rose-500 text-white shadow-sm'
              : 'bg-emerald-500 text-white shadow-sm'
              }`}>
              {user.is_blocked ? 'TERMINATED' : 'ACTIVE ACCESS'}
            </div>
          </td>
          <td className="px-8 py-6 border-b border-r border-black text-center">
            <div className="flex items-center justify-center gap-3 text-slate-400 font-bold">
              <Calendar size={14} className="opacity-40 text-black" />
              <span className="text-[11px] font-black font-mono tracking-tighter text-black">
                {user.created_at ? new Date(user.created_at).toLocaleDateString('en-GB') : '---'}
              </span>
            </div>
          </td>
          <td className="px-8 py-6 text-center border-b border-black">
            <div className="flex justify-center gap-3">
              <button
                onClick={() => onToggleBlock(user)}
                className={`p-3 rounded-xl border border-black transition-all shadow-sm active:scale-95 ${user.is_blocked
                  ? 'bg-white text-emerald-600 hover:bg-emerald-50'
                  : 'bg-white text-amber-600 hover:bg-amber-50'
                  }`}
                title={user.is_blocked ? "Restore Access" : "Terminate Session"}
              >
                {user.is_blocked ? <UserCheck size={18} /> : <UserX size={18} />}
              </button>
              <button
                onClick={() => onEdit(user)}
                className="p-3 bg-white border border-black text-[#001736] rounded-xl hover:bg-indigo-50 transition-all shadow-sm active:scale-95"
                title="Edit Identity"
              >
                <Pencil size={18} />
              </button>
              <button
                onClick={() => onDelete(user)}
                className="p-3 bg-white border border-black text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-95"
                title="Delete Identity"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </td>
        </tr>
      ))}
    </DataTable>
  );
};

export default UserTable;
