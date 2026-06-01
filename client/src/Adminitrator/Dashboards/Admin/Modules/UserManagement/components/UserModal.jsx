import React, { useState, useEffect } from 'react';
import { X, User, Mail, Lock, Shield, Loader2 } from 'lucide-react';

const UserModal = ({ isOpen, onClose, onSubmit, roles, userToEdit }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
    role_id: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userToEdit) {
      setFormData({
        username: userToEdit.username || '',
        email: userToEdit.email || '',
        full_name: userToEdit.full_name || '',
        password: '', // Don't pre-fill password for security
        role_id: userToEdit.role_id || ''
      });
    } else {
      setFormData({
        username: '',
        email: '',
        full_name: '',
        password: '',
        role_id: ''
      });
    }
  }, [userToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      console.error('Modal Submit Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-[#001736]/90 backdrop-blur-md p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-white/20 overflow-hidden transform transition-all scale-100">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#001736] flex items-center justify-center text-amber-400 shadow-lg">
              <User size={20} />
            </div>
            <h3 className="text-xl font-bold text-[#001736] uppercase tracking-tight">
              {userToEdit ? 'Edit Identity' : 'Create Identity'}
            </h3>
          </div>
          <button onClick={onClose} className="p-2.5 text-slate-300 hover:text-rose-500 rounded-xl hover:bg-slate-50 transition-all">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2 text-left">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Personnel Name</label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors">
                <User size={18} />
              </span>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Ex. John Doe"
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[#001736] font-bold placeholder:text-slate-300 focus:outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 focus:bg-white transition-all uppercase"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="johndoe123"
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[#001736] font-bold placeholder:text-slate-300 focus:outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 focus:bg-white transition-all uppercase"
                required
              />
            </div>
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Access Role</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors">
                  <Shield size={18} />
                </span>
                <select
                  name="role_id"
                  value={formData.role_id}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[#001736] font-bold focus:outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 focus:bg-white transition-all appearance-none cursor-pointer uppercase"
                  required
                >
                  <option value="" disabled>SELECT ROLE</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.role_name.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-left">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Institutional Email</label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors">
                <Mail size={18} />
              </span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[#001736] font-bold placeholder:text-slate-300 focus:outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 focus:bg-white transition-all uppercase"
                required
              />
            </div>
          </div>

          <div className="space-y-2 text-left">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              {userToEdit ? 'Security Hash (Leave blank to keep same)' : 'Security Hash'}
            </label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors">
                <Lock size={18} />
              </span>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[#001736] font-bold placeholder:text-slate-300 focus:outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 focus:bg-white transition-all"
                required={!userToEdit}
              />
            </div>
          </div>

          <div className="pt-6 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 bg-white border border-slate-200 text-slate-400 font-bold rounded-xl hover:bg-slate-50 transition-all uppercase tracking-widest text-[11px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-4 bg-[#001736] text-white font-bold rounded-xl hover:bg-black active:scale-[0.98] transition-all shadow-xl disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-widest text-[11px]"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : (userToEdit ? 'Commit Changes' : 'Execute Creation')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;
