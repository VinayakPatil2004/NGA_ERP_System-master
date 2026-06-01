import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { UserPlus, Search, Filter, RefreshCw, ShieldCheck, Plus, X, ArrowRight, ShieldAlert } from 'lucide-react';
import UserTable from './components/UserTable';
import UserModal from './components/UserModal';
import ModuleHeader from '../../../../admcomponents/ModuleHeader';
import { getAllUsers, createUser, updateUser, deleteUser, toggleBlockUser } from '../../../../../services/userAPI';
import { getAllRoles, createRole } from '../../../../../services/roleAPI';
import { toast } from 'react-toastify';

const UserManagement = ({ toggleSidebar }) => {
    const { category } = useParams();
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [userTypeFilter, setUserTypeFilter] = useState(category || 'student');
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');
    const [userToEdit, setUserToEdit] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersData, rolesData] = await Promise.all([getAllUsers(), getAllRoles()]);
            setUsers(usersData);
            setRoles(rolesData);
            setFilteredUsers(usersData);
        } catch {
            toast.error('Failed to load user data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (category) {
            setUserTypeFilter(category);
            setRoleFilter('all');
        } else {
            setUserTypeFilter('all');
        }
    }, [category]);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        let result = users.filter(u => u.role_name !== 'admin');

        if (searchTerm) {
            result = result.filter(u =>
                (u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (u.username?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (u.email?.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }
        if (roleFilter !== 'all') {
            result = result.filter(u => u.role_name === roleFilter);
        }

        if (userTypeFilter !== 'all') {
            if (userTypeFilter === 'staff') {
                result = result.filter(u => u.role_name === 'teacher' || u.role_name === 'staff');
            } else if (userTypeFilter === 'student') {
                result = result.filter(u => u.role_name === 'student');
            } else if (userTypeFilter === 'parent') {
                result = result.filter(u => u.role_name === 'parent');
            }
        }
        setFilteredUsers(result);
    }, [searchTerm, roleFilter, userTypeFilter, users]);

    const handleAddUser = (userData) => {
        return createUser(userData)
            .then(() => {
                toast.success('User created successfully');
                fetchData();
            })
            .catch(err => {
                toast.error(err.response?.data?.error || 'Failed to create user');
                throw err;
            });
    };

    const handleEditUser = (userData) => {
        return updateUser(userToEdit.id, userData)
            .then(() => {
                toast.success('User updated successfully');
                fetchData();
            })
            .catch(err => {
                toast.error(err.response?.data?.error || 'Failed to update user');
                throw err;
            });
    };

    const handleDeleteUser = async (id) => {
        if (window.confirm('Delete this identity from institutional database?')) {
            try {
                await deleteUser(id);
                toast.success('User identity Deleted');
                fetchData();
            } catch {
                toast.error('Delete operation failed');
            }
        }
    };

    const handleToggleBlock = async (user) => {
        const action = user.is_blocked ? 'unblock' : 'block';
        if (window.confirm(`Permanently ${action} institutional access for ${user.username || 'this identity'}?`)) {
            try {
                await toggleBlockUser(user.id, !user.is_blocked);
                toast.success(`Access ${action}ed`);
                fetchData();
            } catch {
                toast.error(`Access control modification failed`);
            }
        }
    };

    const handleAddRole = async (e) => {
        e.preventDefault();
        if (!newRoleName.trim()) return;
        try {
            await createRole(newRoleName);
            toast.success('Security role established');
            setNewRoleName('');
            setIsRoleModalOpen(false);
            fetchData();
        } catch {
            toast.error('Role establishment failed');
        }
    };
    return (
        <div className="p-4 lg:p-8 bg-[#F8FAFC] min-h-screen font-sans">
            <ModuleHeader
                title="Personnel Matrix"
                subTitle="Grace ERP Access & Policy Hub"
                icon={ShieldCheck}
                toggleSidebar={toggleSidebar}
                showSearch={true}
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                hideDesktopSearch={true}
            >
                <div className="flex items-center gap-2 lg:gap-3">
                    <button
                        onClick={fetchData}
                        className="p-3 bg-white/5 border border-white/10 rounded-xl text-amber-400 hover:bg-white/10 transition-all shadow-xl active:rotate-180 duration-700"
                        title="Synchronize Identity Base"
                    >
                        <RefreshCw size={18} />
                    </button>

                    {/* Mobile Only Add Button */}
                    <button
                        onClick={() => { setUserToEdit(null); setIsModalOpen(true); }}
                        className="lg:hidden p-3 bg-white/10 border border-white/20 rounded-xl text-amber-400 hover:bg-white/20 transition-all shadow-xl"
                    >
                        <Plus size={18} />
                    </button>
                </div>
            </ModuleHeader>

            {/* 1.5 Responsive Action Toolbar */}
            <div className="grid grid-cols-2 lg:flex items-center gap-3 mb-6 animate-in slide-in-from-top-2 duration-300">
                <button
                    onClick={() => { setUserToEdit(null); setIsModalOpen(true); }}
                    className="hidden lg:flex bg-[#001736] text-white px-6 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl hover:bg-black transition-all items-center gap-3 active:scale-95 border border-white/10 whitespace-nowrap"
                >
                    <UserPlus size={18} />
                    <span>ADD USER</span>
                </button>

                <button
                    onClick={() => { setUserToEdit(null); setIsModalOpen(true); }}
                    className="lg:hidden bg-[#001736] text-white px-4 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95"
                >
                    <UserPlus size={16} />
                    <span>ADD USER</span>
                </button>

                <button
                    onClick={() => setIsRoleModalOpen(true)}
                    className="bg-white border border-slate-200 text-[#001736] px-4 py-3.5 lg:px-6 lg:py-3.5 rounded-xl lg:rounded-2xl font-black text-[10px] lg:text-[11px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                    <Plus size={16} className="lg:w-4 lg:h-4 text-emerald-500" />
                    <span>NEW ROLE</span>
                </button>
            </div>


            {/* 2. Main Identity Registry Table */}
            {loading ? (
                <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-slate-200 border-dashed gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Scanning Identity Grid...</p>
                </div>
            ) : (
                <UserTable
                    users={filteredUsers}
                    onEdit={(u) => { setUserToEdit(u); setIsModalOpen(true); }}
                    onDelete={handleDeleteUser}
                    onToggleBlock={handleToggleBlock}
                />
            )}

            {/* 3. Role Specification Modal */}
            {isRoleModalOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center bg-[#001736]/90 backdrop-blur-md p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-white/20 overflow-hidden p-8 animate-in fade-in zoom-in duration-300">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-2xl font-black text-[#001736] uppercase tracking-tight">Access Role</h3>
                            <button onClick={() => setIsRoleModalOpen(false)} className="text-slate-300 hover:text-rose-500 transition-colors">
                                <X size={28} />
                            </button>
                        </div>
                        <form onSubmit={handleAddRole} className="space-y-8 text-left">
                            <div className="space-y-3">
                                <label className="text-[12px] uppercase font-bold text-slate-400 ml-2 tracking-widest">Protocol Identifier</label>
                                <input
                                    type="text"
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-[#001736] outline-none focus:bg-white focus:border-amber-400 transition-all uppercase"
                                    placeholder="e.g. SUPERVISOR"
                                    value={newRoleName}
                                    onChange={(e) => setNewRoleName(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full py-5 bg-[#001736] text-white font-bold text-[12px] rounded-xl hover:bg-black uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                            >
                                COMMIT ROLE PROTOCOL <ArrowRight size={18} className="opacity-40" />
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <UserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                roles={roles}
                userToEdit={userToEdit}
                onSubmit={userToEdit ? handleEditUser : handleAddUser}
            />
        </div>
    );
};

export default UserManagement;
