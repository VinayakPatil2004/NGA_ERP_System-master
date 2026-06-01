import React from 'react';
import { Pencil, Trash2, Shield, Mail, Calendar, UserX, UserCheck, User, ShieldCheck } from 'lucide-react';
import DataTable from '../../../../../admcomponents/DataTable';

const UserTable = ({ users, onEdit, onDelete, onToggleBlock }) => {
  return (
    <DataTable
      headers={[
        { label: "Institutional Identity" },
        { label: "Security Role", className: "w-[150px]" },
        { label: "Access Status", className: "w-[130px]" },
        { label: "Provisioning Date", className: "w-[180px]" },
        { label: "Console Actions", className: "text-right w-[180px]" }
      ]}
      columnCount={5}
      loading={false}
      emptyMessage="Zero System Identities Found"
    >
      {users.map((user) => (
        <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
          <td className="px-8 py-6 border-r border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-[#001736] shadow-sm group-hover:bg-[#001736] group-hover:text-white transition-all">
                <User size={24} />
              </div>
              <div>
                <p className="text-[14px] font-bold text-[#001736] uppercase tracking-tight leading-none">
                  {user.full_name || user.username}
                </p>
                <div className="flex items-center gap-2 mt-1.5 text-slate-300">
                  <Mail size={12} />
                  <span className="text-[10px] font-bold uppercase tracking-widest truncate max-w-[180px] text-slate-400">
                    {user.email || 'NO EMAIL REGISTERED'}
                  </span>
                </div>
              </div>
            </div>
          </td>
          <td className="px-8 py-6 border-r border-slate-100">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-[#001736] font-bold text-[10px] tracking-widest rounded-lg border border-slate-200 shadow-sm uppercase">
              <ShieldCheck size={14} className="text-indigo-400" />
              {user.role_name}
            </div>
          </td>
          <td className="px-8 py-6 border-r border-slate-100">
            <div className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-2 border border-black/5 ${user.is_blocked
              ? 'bg-rose-500 text-white shadow-sm'
              : 'bg-emerald-500 text-white shadow-sm'
              }`}>
              {user.is_blocked ? 'ACCESS BLOCKED' : 'ACTIVE ACCESS'}
            </div>
          </td>
          <td className="px-8 py-6 border-r border-slate-100">
            <div className="flex items-center gap-3 text-slate-400">
              <Calendar size={14} className="opacity-40" />
              <span className="text-[11px] font-bold font-mono tracking-tighter">
                {new Date(user.created_at).toLocaleDateString()}
              </span>
            </div>
          </td>
          <td className="px-8 py-6 text-right">
            <div className="flex justify-end gap-3">
              <button
                onClick={() => onToggleBlock(user)}
                className={`p-3 rounded-xl border border-slate-200 transition-all shadow-sm active:scale-95 ${user.is_blocked
                  ? 'bg-white text-emerald-600 hover:bg-emerald-50'
                  : 'bg-white text-amber-600 hover:bg-amber-50'
                  }`}
                title={user.is_blocked ? "Restore Access" : "Terminate Session"}
              >
                {user.is_blocked ? <UserCheck size={18} /> : <UserX size={18} />}
              </button>
              <button
                onClick={() => onEdit(user)}
                className="p-3 bg-white border border-slate-200 text-[#001736] rounded-xl hover:bg-indigo-50 transition-all shadow-sm active:scale-95"
                title="Edit Identity"
              >
                <Pencil size={18} />
              </button>
              <button
                onClick={() => onDelete(user.id)}
                className="p-3 bg-white border border-slate-200 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-95"
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
