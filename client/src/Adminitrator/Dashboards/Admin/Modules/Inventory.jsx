import React, { useState, useEffect, useCallback } from 'react';
import {
    Package, ArrowUpRight, ArrowDownLeft, AlertTriangle,
    Plus, Search, Filter, RefreshCw, Truck, LayoutDashboard,
    ClipboardList, Store, User, Hash, DollarSign, Calendar,
    History, MoreVertical, Edit, Trash2, X, FileDown, Eye
} from 'lucide-react';
import ModuleHeader from '../../../admcomponents/ModuleHeader';
import DataTable from '../../../admcomponents/DataTable';
import { toast } from 'react-toastify';
import inventoryAPI from '../../../../services/inventoryAPI';
import bulkImportAPI from '../../../../services/bulkImportAPI';
import { ROOT_URL } from '../../../../services/API';

/**
 * Inventory Management Module
 * Comprehensive Stock In/Out and Item Registry Tracking.
 */
const Inventory = ({ toggleSidebar }) => {
    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'items' | 'movements' | 'suppliers'
    const [items, setItems] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isImporting, setIsImporting] = useState(false);

    // Modals
    const [showItemModal, setShowItemModal] = useState(false);
    const [showMovementModal, setShowMovementModal] = useState(false); // Stock IN/OUT
    const [showSupplierModal, setShowSupplierModal] = useState(false);
    const [movementType, setMovementType] = useState('IN');
    const [editingItem, setEditingItem] = useState(null);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [viewData, setViewData] = useState(null);
    const [viewType, setViewType] = useState(null); // 'item' | 'movement' | 'supplier'
    const [showViewModal, setShowViewModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfig, setDeleteConfig] = useState({ id: null, type: '', message: '' });

    // Forms
    const [itemForm, setItemForm] = useState({ name: '', category: '', unit: 'Nos', location: '', room_number: '', opening_stock: 0, minimum_stock: 5, document: null });
    const [movementForm, setMovementForm] = useState({ item_id: '', supplier_id: '', quantity: '', unit_price: '', transaction_type: 'IN', issued_to: '', transaction_date: new Date().toISOString().split('T')[0], remarks: '', document: null });
    const [supplierForm, setSupplierForm] = useState({ name: '', contact_person: '', phone: '', email: '', address: '', identity_proof: null });
    const [searchTerm, setSearchTerm] = useState('');
    const [itemPage, setItemPage] = useState(1);
    const [movementPage, setMovementPage] = useState(1);
    const itemsPerPage = 15;

    const filteredItems = items.filter(i =>
        i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.room_number || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredTransactions = transactions.filter(t =>
        t.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.supplier_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.issued_to || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ── Data Fetching ──────────────────────────────────────────────────────

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [itemData, supplierData, transData] = await Promise.all([
                inventoryAPI.getAllInventoryItems(),
                inventoryAPI.getAllSuppliers(),
                inventoryAPI.getInventoryTransactions(),
            ]);
            setItems(itemData || []);
            setSuppliers(supplierData || []);
            setTransactions(transData || []);
        } catch {
            toast.error("Failed to sync inventory data");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // ── Handlers ─────────────────────────────────────────────────────────────

    const handleAddItem = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await inventoryAPI.updateItem(editingItem.id, itemForm);
                toast.success("Item updated ✓");
            } else {
                await inventoryAPI.registerItem(itemForm);
                toast.success("Item cataloged ✓");
            }
            setShowItemModal(false);
            setEditingItem(null);
            setItemForm({ name: '', category: '', unit: 'Nos', location: '', room_number: '', opening_stock: 0, minimum_stock: 5 });
            fetchData();
        } catch { toast.error("Operation failed"); }
    };

    const handleDeleteItem = (id) => {
        setDeleteConfig({
            id,
            type: 'item',
            message: "Permanently remove this item from catalog? This action cannot be undone."
        });
        setShowDeleteModal(true);
    };

    const handleSupplierSubmit = async (e) => {
        if (e) e.preventDefault();

        // Validations
        const mobileRegex = /^[0-9]{10}$/;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!supplierForm.name.trim()) {
            toast.error("Vendor Name is required");
            return;
        }
        if (!mobileRegex.test(supplierForm.phone)) {
            toast.error("Enter a valid 10-digit mobile number");
            return;
        }
        if (supplierForm.email && !emailRegex.test(supplierForm.email)) {
            toast.error("Enter a valid email address");
            return;
        }
        if (supplierForm.identity_proof && supplierForm.identity_proof.size > 300 * 1024) {
            toast.error("File size must be less than 300 KB");
            return;
        }

        try {
            if (editingSupplier) {
                await inventoryAPI.updateSupplier(editingSupplier.id, supplierForm);
                toast.success("Vendor updated ✓");
            } else {
                await inventoryAPI.registerSupplier(supplierForm);
                toast.success("Vendor registered ✓");
            }
            setShowSupplierModal(false);
            setEditingSupplier(null);
            setSupplierForm({ name: '', contact_person: '', phone: '', email: '', address: '', identity_proof: null });
            fetchData();
        } catch { toast.error("Operation failed"); }
    };

    const handleDeleteSupplier = (id) => {
        setDeleteConfig({
            id,
            type: 'supplier',
            message: "Remove this vendor from registry? All associated data will be archived."
        });
        setShowDeleteModal(true);
    };

    const handleDeleteTransaction = (id) => {
        setDeleteConfig({
            id,
            type: 'transaction',
            message: "Delete this movement record? Stock levels will be reversed automatically."
        });
        setShowDeleteModal(true);
    };

    const executeDelete = async () => {
        try {
            const { id, type } = deleteConfig;
            if (type === 'item') await inventoryAPI.deleteItem(id);
            else if (type === 'supplier') await inventoryAPI.deleteSupplier(id);
            else if (type === 'transaction') await inventoryAPI.deleteStockMovement(id);

            toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} removed successfully ✓`);
            fetchData();
            setShowDeleteModal(false);
        } catch (err) {
            toast.error(err.response?.data?.error || "Operation failed");
        }
    };

    const handleRecordMovement = async (e) => {
        if (e) e.preventDefault();

        if (!movementForm.item_id) {
            toast.error("Please select an item");
            return;
        }
        if (!movementForm.quantity || parseFloat(movementForm.quantity) <= 0) {
            toast.error("Enter a valid quantity");
            return;
        }

        try {
            const payload = { ...movementForm, transaction_type: movementType };
            if (editingTransaction) {
                await inventoryAPI.updateStockMovement(editingTransaction.id, payload);
                toast.success("Transaction updated ✓");
            } else {
                await inventoryAPI.recordStockMovement(payload);
                toast.success(`Stock ${movementType === 'IN' ? 'Purchased' : 'Issued'} Successfully ✓`);
            }
            setShowMovementModal(false);
            setEditingTransaction(null);
            setMovementForm({ item_id: '', supplier_id: '', quantity: '', unit_price: '', transaction_type: 'IN', issued_to: '', transaction_date: new Date().toISOString().split('T')[0], remarks: '', document: null });
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.error || "Transaction failed");
        }
    };

    const handleEditTransaction = (transaction) => {
        setEditingTransaction(transaction);
        setMovementType(transaction.transaction_type);
        setMovementForm({
            item_id: transaction.item_id,
            supplier_id: transaction.supplier_id || '',
            quantity: transaction.quantity,
            unit_price: transaction.unit_price,
            transaction_type: transaction.transaction_type,
            issued_to: transaction.issued_to || '',
            transaction_date: new Date(transaction.transaction_date).toISOString().split('T')[0],
            remarks: transaction.remarks || '',
            document: null
        });
        setShowMovementModal(true);
    };

    const handleViewDetails = (data, type) => {
        setViewData(data);
        setViewType(type);
        setShowViewModal(true);
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setIsImporting(true);
            toast.info("Processing inventory import...");
            const res = await bulkImportAPI.importInventory(file);
            toast.success(`${res.inserted} Items cataloged successfully!`);
            if (res.failed > 0) {
                toast.warning(`${res.failed} Records failed. Check console.`);
                console.warn("Import Errors:", res.errors);
            }
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.error || "Import failed");
        } finally {
            setIsImporting(false);
            e.target.value = null;
        }
    };

    const handleSupplierImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setIsImporting(true);
            toast.info("Processing vendor import...");
            const res = await bulkImportAPI.importSuppliers(file);
            toast.success(`${res.inserted} Vendors registered successfully!`);
            if (res.failed > 0) {
                toast.warning(`${res.failed} Records failed. Check console.`);
                console.warn("Import Errors:", res.errors);
            }
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.error || "Import failed");
        } finally {
            setIsImporting(false);
            e.target.value = null;
        }
    };


    return (
        <div className="p-4 lg:p-8 space-y-8 min-h-screen bg-[#F8FAFC]">

            <ModuleHeader
                title="Inventory Management"
                subTitle="Stock Registry, Procurement & Issuance Logs"
                icon={Package}
                toggleSidebar={toggleSidebar}
                hideAcademicYear={true}
            >
                <div className="flex items-center gap-2 lg:gap-3">
                    <button onClick={fetchData} className="p-2.5 lg:p-3 bg-white border border-white/10 rounded-md lg:rounded-md text-amber-400 hover:bg-white/80 transition-all active:rotate-180 duration-700">
                        <RefreshCw size={16} className="lg:w-[18px] lg:h-[18px]" />
                    </button>
                    <div className="h-8 lg:h-10 w-px bg-white/10 mx-0.5 lg:mx-1 hidden sm:block" />
                    <button
                        onClick={() => { setMovementType('IN'); setShowMovementModal(true); }}
                        className="bg-emerald-500 text-white px-3 lg:px-6 py-2.5 lg:py-3.5 rounded-md lg:rounded-md font-black text-[10px] lg:text-[11px] uppercase tracking-widest shadow-xl hover:bg-emerald-600 transition-all flex items-center gap-2 active:scale-95 border border-white/10"
                    >
                        <ArrowUpRight size={16} className="lg:w-[18px] lg:h-[18px]" />
                        <span className="hidden sm:inline">Stock In</span>
                    </button>
                    <button
                        onClick={() => { setMovementType('OUT'); setShowMovementModal(true); }}
                        className="bg-rose-500 text-white px-3 lg:px-6 py-2.5 lg:py-3.5 rounded-md lg:rounded-md font-black text-[10px] lg:text-[11px] uppercase tracking-widest shadow-xl hover:bg-rose-600 transition-all flex items-center gap-2 active:scale-95 border border-white/10"
                    >
                        <ArrowDownLeft size={16} className="lg:w-[18px] lg:h-[18px]" />
                        <span className="hidden sm:inline">Stock Out</span>
                    </button>
                </div>
            </ModuleHeader>

            {/* ── Tabs Navigation ── */}
            <div className="flex items-center gap-2 bg-white p-2 rounded-md border border-slate-200 overflow-x-auto custom-scrollbar no-scrollbar">
                {[
                    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                    { id: 'items', label: 'Items Catalog', icon: ClipboardList },
                    { id: 'movements', label: 'Movement Logs', icon: History },
                    { id: 'suppliers', label: 'Suppliers', icon: Truck },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-3 rounded-md flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-[#001736] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                    >
                        <tab.icon size={16} /> {tab.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
                    {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-200 rounded-md" />)}
                </div>
            ) : (
                <>
                    {/* ── Dashboard Rendering ── */}
                    {activeTab === 'dashboard' && (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StatCard label="Total Cataloged Items" value={items.length} color="bg-blue-600" icon={Package} />
                                <StatCard label="Low Stock Items" value={items.filter(i => i.current_stock <= i.minimum_stock).length} color="bg-rose-500" icon={AlertTriangle} alert={items.some(i => i.current_stock <= i.minimum_stock)} />
                                <StatCard label="Total Items Issued" value={transactions.filter(t => t.transaction_type === 'OUT').reduce((acc, t) => acc + (parseFloat(t.quantity) || 0), 0)} color="bg-indigo-500" icon={ArrowDownLeft} />
                                <StatCard label="Total Active Vendors" value={suppliers.length} color="bg-emerald-600" icon={Truck} />
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                {/* Low Stock Items Table */}
                                <div className="bg-white rounded-md border border-slate-200 overflow-hidden shadow-sm">
                                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                        <h4 className="text-sm font-black text-[#001736] uppercase tracking-widest">Low Stock Alerts</h4>
                                        <AlertTriangle className="text-rose-500" size={20} />
                                    </div>
                                    <div className="p-0">
                                        {items.filter(i => i.current_stock <= i.minimum_stock).length > 0 ? (
                                            <table className="w-full">
                                                <thead className="bg-[#F8FAFC]">
                                                    <tr>
                                                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Item</th>
                                                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Available</th>
                                                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Minimum</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {items.filter(i => i.current_stock <= i.minimum_stock).slice(0, 5).map(item => (
                                                        <tr key={item.id}>
                                                            <td className="px-6 py-4 text-sm font-bold text-[#001736]">{item.name}</td>
                                                            <td className="px-6 py-4 text-sm font-black text-rose-600 italic">{item.current_stock} {item.unit}</td>
                                                            <td className="px-6 py-4 text-sm font-bold text-slate-400">{item.minimum_stock}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <div className="p-12 text-center text-slate-400 italic font-bold text-xs uppercase tracking-widest">All stock levels optimized ✓</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Items Catalog Rendering ── */}
                    {activeTab === 'items' && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                                <h3 className="text-lg font-black text-[#001736] uppercase tracking-widest">Catalog Registry</h3>
                                <div className="flex items-center gap-2 lg:gap-3">
                                    <div className="relative group flex-1 sm:min-w-[200px]">
                                        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => { setSearchTerm(e.target.value); setItemPage(1); setMovementPage(1); }}
                                            placeholder="Search items..."
                                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-md text-[10px] sm:text-xs font-bold outline-none focus:border-blue-500 transition-all shadow-sm"
                                        />
                                    </div>
                                    <button
                                        onClick={() => document.getElementById('inventory-import-input').click()}
                                        disabled={isImporting}
                                        className="flex items-center justify-center gap-2 px-3 lg:px-6 py-2.5 lg:py-3 bg-white border border-black rounded-md text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                                    >
                                        {isImporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                                        <span className="hidden lg:inline">{isImporting ? "Processing..." : "Import"}</span>
                                    </button>
                                    <input
                                        type="file"
                                        id="inventory-import-input"
                                        className="hidden"
                                        accept=".xlsx, .xls, .csv"
                                        onChange={handleImport}
                                    />
                                    <button onClick={() => setShowItemModal(true)} className="bg-blue-600 text-white px-3 lg:px-5 py-2.5 lg:py-3 rounded-md font-bold text-[10px] lg:text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
                                        <Plus size={16} /> <span className="hidden sm:inline">New Item</span>
                                    </button>
                                </div>
                            </div>
                            <DataTable
                                headers={[{ label: 'Item Identity' }, { label: 'Category' }, { label: 'Unit' }, { label: 'Room/Loc' }, { label: 'Stock Level' }, { label: 'Minimum' }, { label: 'Status' }, { label: 'Action', className: 'text-center' }]}
                                columnCount={8} loading={loading}
                                footer={
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full px-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[#001736] opacity-60">
                                            Showing <span className="font-bold">{(itemPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold">{Math.min(itemPage * itemsPerPage, filteredItems.length)}</span> of <span className="font-bold">{filteredItems.length}</span> Records
                                        </p>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => setItemPage(p => Math.max(1, p - 1))} disabled={itemPage === 1} className="px-4 py-2 bg-white border border-black rounded text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 transition-all">Prev</button>
                                            <div className="px-4 text-[10px] font-black text-[#001736] uppercase">Page {itemPage} of {Math.ceil(filteredItems.length / itemsPerPage) || 1}</div>
                                            <button onClick={() => setItemPage(p => Math.min(Math.ceil(filteredItems.length / itemsPerPage), p + 1))} disabled={itemPage === Math.ceil(filteredItems.length / itemsPerPage) || Math.ceil(filteredItems.length / itemsPerPage) === 0} className="px-4 py-2 bg-white border border-black rounded text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 transition-all">Next</button>
                                        </div>
                                    </div>
                                }
                            >
                                {filteredItems.slice((itemPage - 1) * itemsPerPage, itemPage * itemsPerPage).map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50 transition-colors border-b border-black">
                                        <td className="px-8 py-5 border-r border-black">
                                            <p className="text-sm font-black text-[#001736] uppercase tracking-tight">{item.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{item.location || 'Unknown Location'}</p>
                                        </td>
                                        <td className="px-8 py-5 border-r border-black italic text-slate-500 text-sm">{item.category}</td>
                                        <td className="px-8 py-5 border-r border-black text-xs font-bold text-slate-400 uppercase">{item.unit}</td>
                                        <td className="px-8 py-5 border-r border-black">
                                            <p className="text-[11px] font-black text-[#001736] uppercase">{item.room_number || '—'}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.location || 'N/A'}</p>
                                        </td>
                                        <td className="px-8 py-5 border-r border-black">
                                            <span className={`text-sm font-black ${item.current_stock <= item.minimum_stock ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                {item.current_stock}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 border-r border-black text-xs font-bold text-slate-400 italic">{item.minimum_stock}</td>
                                        <td className="px-8 py-5 border-r border-black">
                                            <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full border border-emerald-100">{item.status}</span>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => handleViewDetails(item, 'item')} className="p-2 text-slate-400 hover:text-emerald-600 transition-all" title="View Details"><Eye size={16} /></button>
                                                <button onClick={() => { setEditingItem(item); setItemForm(item); setShowItemModal(true); }} className="p-2 text-slate-400 hover:text-blue-600 transition-all"><Edit size={16} /></button>
                                                <button onClick={() => handleDeleteItem(item.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-all"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </DataTable>
                        </div>
                    )}

                    {/* ── Movement Logs Rendering ── */}
                    {activeTab === 'movements' && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <DataTable
                                headers={[{ label: 'Date' }, { label: 'Item Name' }, { label: 'Type' }, { label: 'Qty' }, { label: 'Source/Recipient' }, { label: 'Total Price' }, { label: 'Action', className: 'text-right' }]}
                                columnCount={7} loading={loading}
                                footer={
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full px-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[#001736] opacity-60">
                                            Showing <span className="font-bold">{(movementPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold">{Math.min(movementPage * itemsPerPage, filteredTransactions.length)}</span> of <span className="font-bold">{filteredTransactions.length}</span> Records
                                        </p>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => setMovementPage(p => Math.max(1, p - 1))} disabled={movementPage === 1} className="px-4 py-2 bg-white border border-black rounded text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 transition-all">Prev</button>
                                            <div className="px-4 text-[10px] font-black text-[#001736] uppercase">Page {movementPage} of {Math.ceil(filteredTransactions.length / itemsPerPage) || 1}</div>
                                            <button onClick={() => setMovementPage(p => Math.min(Math.ceil(filteredTransactions.length / itemsPerPage), p + 1))} disabled={movementPage === Math.ceil(filteredTransactions.length / itemsPerPage) || Math.ceil(filteredTransactions.length / itemsPerPage) === 0} className="px-4 py-2 bg-white border border-black rounded text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 transition-all">Next</button>
                                        </div>
                                    </div>
                                }
                            >
                                {filteredTransactions.slice((movementPage - 1) * itemsPerPage, movementPage * itemsPerPage).map(t => (
                                    <tr key={t.id} className="hover:bg-slate-50 transition-colors border-b border-black">
                                        <td className="px-8 py-5 border-r border-black text-[11px] font-black text-slate-400 uppercase">
                                            {new Date(t.transaction_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-8 py-5 border-r border-black text-sm font-black text-[#001736] uppercase">{t.item_name}</td>
                                        <td className="px-8 py-5 border-r border-black">
                                            <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-1 w-fit border ${t.transaction_type === 'IN' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                                {t.transaction_type === 'IN' ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />} {t.transaction_type}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 border-r border-black font-mono text-sm font-bold text-[#001736]">{t.quantity}</td>
                                        <td className="px-8 py-5 border-r border-black text-xs text-slate-600 font-bold italic uppercase">{t.transaction_type === 'IN' ? t.supplier_name : t.issued_to}</td>
                                        <td className="px-8 py-5 border-r border-black text-sm font-black text-blue-600">₹{parseFloat(t.total_price || 0).toLocaleString()}</td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => handleViewDetails(t, 'movement')} className="p-2 text-black hover:text-emerald-600 transition-all" title="View Details"><Eye size={16} /></button>
                                                <button onClick={() => handleEditTransaction(t)} className="p-2 text-black hover:text-blue-600 transition-all"><Edit size={16} /></button>
                                                <button onClick={() => handleDeleteTransaction(t.id)} className="p-2 text-black hover:text-rose-600 transition-all"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </DataTable>
                        </div>
                    )}

                    {/* ── Suppliers Rendering ── */}
                    {activeTab === 'suppliers' && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                                <h3 className="text-lg font-black text-[#001736] uppercase tracking-widest text-center lg:text-left">Institutional Vendor Registry</h3>
                                <div className="flex flex-col lg:flex-row items-center gap-3 w-full lg:w-auto">
                                    <button
                                        onClick={() => document.getElementById('supplier-import-input').click()}
                                        disabled={isImporting}
                                        className="w-full lg:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-slate-200 rounded-md text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                                    >
                                        {isImporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                                        {isImporting ? "Processing..." : "Import Suppliers"}
                                    </button>
                                    <input
                                        type="file"
                                        id="supplier-import-input"
                                        className="hidden"
                                        accept=".xlsx, .xls, .csv"
                                        onChange={handleSupplierImport}
                                    />
                                    <button onClick={() => { setEditingSupplier(null); setSupplierForm({ name: '', contact_person: '', phone: '', email: '', address: '' }); setShowSupplierModal(true); }} className="w-full lg:w-auto bg-indigo-600 text-white px-5 py-3 rounded-md font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all">
                                        <Truck size={16} /> Add Supplier
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {suppliers.map(s => (
                                    <div key={s.id} className="bg-white p-6 rounded-md border border-slate-300 space-y-4 hover:shadow-lg transition-all border-l-4 border-l-indigo-500">
                                        <div className="flex justify-between items-start">
                                            <div className="w-12 h-12 bg-indigo-50 rounded-md flex items-center justify-center text-indigo-600">
                                                <Store size={20} />
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => handleViewDetails(s, 'supplier')} className="p-2 text-black hover:text-emerald-600 transition-all" title="View Profile"><Eye size={16} /></button>
                                                <button onClick={() => { setEditingSupplier(s); setSupplierForm(s); setShowSupplierModal(true); }} className="p-2 text-black hover:text-blue-600 transition-all"><Edit size={16} /></button>
                                                <button onClick={() => handleDeleteSupplier(s.id)} className="p-2 text-black hover:text-rose-600 transition-all"><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="font-black text-[#001736] uppercase tracking-tight">{s.name}</h4>
                                            <p className="text-xs font-bold text-slate-400 mt-1">{s.contact_person || 'No Contact Person'}</p>
                                        </div>
                                        <div className="space-y-2 pt-2 border-t border-slate-50">
                                            <p className="text-[11px] font-bold text-black flex items-center gap-2"><User className="text-black" size={14} /> {s.phone || 'N/A'}</p>
                                            <p className="text-[11px] font-bold text-black flex items-center gap-2"><ArrowUpRight className="text-black" size={14} /> {s.email || 'N/A'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ── Modals Layer ── */}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-sm rounded-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-8 py-6 bg-rose-600 flex items-center gap-4 text-white">
                            <div className="p-2 bg-white/20 rounded-full">
                                <AlertTriangle size={24} />
                            </div>
                            <h2 className="font-black text-lg uppercase tracking-wider">Confirm Delete</h2>
                        </div>
                        <div className="p-8 space-y-8">
                            <p className="text-sm font-bold text-slate-600 leading-relaxed text-center px-2">
                                {deleteConfig.message}
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="py-4 bg-white border border-slate-200 text-slate-400 rounded-md font-black text-[10px] lg:text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={executeDelete}
                                    className="py-4 bg-rose-600 text-white rounded-md font-black text-[10px] lg:text-xs uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-200"
                                >
                                    Confirm Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Item Modal */}
            {showItemModal && (
                <div className="fixed inset-0 bg-[#001736]/80 backdrop-blur-md z-100 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="px-8 py-6 bg-[#001736] flex items-center justify-between text-white!">
                            <h3 className="text-xl font-black tracking-tight uppercase text-white!">{editingItem ? 'Update Item' : 'New Item'}</h3>
                            <button onClick={() => { setShowItemModal(false); setEditingItem(null); setItemForm({ name: '', category: '', unit: 'Nos', location: '', room_number: '', opening_stock: 0, minimum_stock: 5 }); }} className="p-2 hover:bg-white/10 rounded-md text-white!"><X size={20} /></button>
                        </div>
                        <div className="p-8 space-y-4 max-h-[70vh] overflow-y-auto">
                            <form onSubmit={handleAddItem} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Item Title</label>
                                    <input required value={itemForm.name} onChange={e => setItemForm({ ...itemForm, name: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border border-black rounded-md text-sm font-bold outline-none focus:border-blue-500" placeholder="e.g. A4 Paper" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Category</label>
                                        <input value={itemForm.category} onChange={e => setItemForm({ ...itemForm, category: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border border-black rounded-md text-sm font-bold outline-none focus:border-blue-500" placeholder="Lab, Robotics" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Unit</label>
                                        <select value={itemForm.unit} onChange={e => setItemForm({ ...itemForm, unit: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border border-black rounded-md text-sm font-bold outline-none">
                                            <option>Nos</option><option>Kg</option><option>Pkt</option><option>Box</option><option>Ltr</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Room No</label>
                                        <input value={itemForm.room_number} onChange={e => setItemForm({ ...itemForm, room_number: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border border-black rounded-md text-sm font-bold outline-none focus:border-blue-500" placeholder="101" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Location</label>
                                        <input value={itemForm.location} onChange={e => setItemForm({ ...itemForm, location: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border border-black rounded-md text-sm font-bold outline-none focus:border-blue-500" placeholder="Rack 2" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Opening Stock</label>
                                        <input type="number" value={itemForm.opening_stock} onChange={e => setItemForm({ ...itemForm, opening_stock: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border border-black rounded-md text-sm font-bold outline-none focus:border-blue-500" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Min. Alert</label>
                                        <input type="number" value={itemForm.minimum_stock} onChange={e => setItemForm({ ...itemForm, minimum_stock: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border border-black rounded-md text-sm font-bold outline-none text-rose-500 focus:border-blue-500" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Product Image/Doc (Max 300KB)</label>
                                    <input
                                        type="file"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file && file.size > 300 * 1024) {
                                                toast.error("File exceeds 300KB");
                                                e.target.value = null;
                                                return;
                                            }
                                            setItemForm({ ...itemForm, document: file });
                                        }}
                                        className="w-full px-5 py-4 bg-slate-50 border border-black rounded-md text-[10px] font-bold outline-none focus:border-blue-500"
                                    />
                                </div>
                                <button type="submit" className="w-full py-5 bg-[#001736] text-white rounded-md font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-blue-900 active:scale-95 transition-all">{editingItem ? 'Update Asset' : 'Register Asset'}</button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Movement Modal (IN/OUT) */}
            {showMovementModal && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-xl rounded-md shadow-2xl overflow-hidden">
                        <div className="px-8 py-6 bg-[#001736] flex items-center justify-between text-white!">
                            <h2 className="font-black text-lg uppercase tracking-wider text-white!">Record Stock {movementType}</h2>
                            <button onClick={() => setShowMovementModal(false)} className="p-2 bg-white/10 hover:bg-white/20 text-white! rounded-md transition-all"><X size={20} /></button>
                        </div>
                        <div className="p-8 space-y-4 max-h-[75vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Select Item</label>
                                    <select
                                        value={movementForm.item_id}
                                        onChange={(e) => setMovementForm({ ...movementForm, item_id: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-black rounded-md text-xs font-bold outline-none focus:border-blue-500 transition-all"
                                    >
                                        <option value="">Choose item...</option>
                                        {items.map(i => <option key={i.id} value={i.id}>{i.name} (Stock: {i.current_stock})</option>)}
                                    </select>
                                </div>
                                {movementType === 'IN' ? (
                                    <div className="col-span-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Supplier</label>
                                        <select
                                            value={movementForm.supplier_id}
                                            onChange={(e) => setMovementForm({ ...movementForm, supplier_id: e.target.value })}
                                            className="w-full px-5 py-3.5 bg-slate-50 border border-black rounded-md text-xs font-bold outline-none focus:border-blue-500 transition-all"
                                        >
                                            <option value="">Select Vendor...</option>
                                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                ) : (
                                    <div className="col-span-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Issued To</label>
                                        <input
                                            type="text"
                                            value={movementForm.issued_to}
                                            onChange={(e) => setMovementForm({ ...movementForm, issued_to: e.target.value })}
                                            className="w-full px-5 py-3.5 bg-slate-50 border border-black rounded-md text-xs font-bold outline-none focus:border-blue-500 transition-all"
                                            placeholder="Department or Person Name"
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Quantity</label>
                                    <input
                                        type="number"
                                        value={movementForm.quantity}
                                        onChange={(e) => setMovementForm({ ...movementForm, quantity: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-black rounded-md text-xs font-bold outline-none focus:border-blue-500 transition-all"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Unit Price</label>
                                    <input
                                        type="number"
                                        value={movementForm.unit_price}
                                        onChange={(e) => setMovementForm({ ...movementForm, unit_price: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-black rounded-md text-xs font-bold outline-none focus:border-blue-500 transition-all"
                                        placeholder="₹ 0.00"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Support Document (Max 300KB)</label>
                                    <div className="relative flex items-center">
                                        <input
                                            type="file"
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file && file.size > 300 * 1024) {
                                                    toast.error("File size exceeds 300KB");
                                                    e.target.value = null;
                                                    return;
                                                }
                                                setMovementForm({ ...movementForm, document: file });
                                            }}
                                            className="w-full px-5 py-2.5 bg-slate-50 border border-black rounded-md text-[11px] font-bold outline-none file:mr-10 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-[#001736] file:text-white hover:file:bg-blue-900 transition-all cursor-pointer"
                                        />
                                        <div className="absolute left-[115px] h-6 w-px bg-black/20" />
                                    </div>
                                </div>
                            </div>
                            <button onClick={handleRecordMovement} className="w-full py-4 bg-[#001736] text-white rounded-md font-black text-xs uppercase tracking-widest shadow-xl active:scale-[0.98] transition-all">
                                Confirm Stock {movementType}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Supplier Modal */}
            {showSupplierModal && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-xl rounded-md shadow-2xl overflow-hidden">
                        <div className="px-8 py-4 bg-[#001736] flex items-center justify-between text-white!">
                            <h2 className="text-white! font-black text-lg uppercase tracking-wider">{editingSupplier ? 'Modify Vendor' : 'Onboard New Vendor'}</h2>
                            <button onClick={() => setShowSupplierModal(false)} className="p-2 bg-white/10 hover:bg-white/20 text-white! rounded-md transition-all"><X size={20} /></button>
                        </div>
                        <div className="p-8 space-y-4 max-h-[75vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Vendor / Company Name *</label>
                                    <input
                                        type="text"
                                        value={supplierForm.name}
                                        onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-black rounded-md text-xs font-bold outline-none focus:border-blue-500 transition-all"
                                        placeholder="Enter official vendor name"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Contact Person</label>
                                    <input
                                        type="text"
                                        value={supplierForm.contact_person}
                                        onChange={(e) => setSupplierForm({ ...supplierForm, contact_person: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-black rounded-md text-xs font-bold outline-none focus:border-blue-500 transition-all"
                                        placeholder="Full Name"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Mobile Number *</label>
                                    <input
                                        type="tel"
                                        value={supplierForm.phone}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                            setSupplierForm({ ...supplierForm, phone: value });
                                        }}
                                        maxLength={10}
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-black rounded-md text-xs font-bold outline-none focus:border-blue-500 transition-all"
                                        placeholder="10-digit mobile number"
                                        required
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Email Address</label>
                                    <input
                                        type="email"
                                        value={supplierForm.email}
                                        onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-black rounded-md text-xs font-bold outline-none focus:border-blue-500 transition-all"
                                        placeholder="vendor@example.com"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Business Address</label>
                                    <textarea
                                        value={supplierForm.address}
                                        onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-black rounded-md text-xs font-bold outline-none focus:border-blue-500 transition-all h-24"
                                        placeholder="Full office/warehouse address"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Identity Proof (License/GST/ID - Max 300KB)</label>
                                    <div className="relative flex items-center">
                                        <input
                                            type="file"
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file && file.size > 300 * 1024) {
                                                    toast.error("File size exceeds 300KB");
                                                    e.target.value = null;
                                                    return;
                                                }
                                                setSupplierForm({ ...supplierForm, identity_proof: file });
                                            }}
                                            className="w-full px-5 py-2.5 bg-slate-50 border border-black rounded-md text-[11px] font-bold outline-none file:mr-10 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-[#001736] file:text-white hover:file:bg-blue-900 transition-all cursor-pointer"
                                        />
                                        <div className="absolute left-[115px] h-6 w-px bg-black/20" />
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={handleSupplierSubmit}
                                className="w-full py-4 bg-[#001736] text-white rounded-md font-black text-xs uppercase tracking-widest shadow-xl active:scale-[0.98] transition-all"
                            >
                                {editingSupplier ? 'Update Vendor Details' : 'Onboard Vendor'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showViewModal && viewData && (
                <div className="fixed inset-0 z-110 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
                    <div className="bg-white w-full max-w-2xl rounded-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="px-10 py-8 bg-[#001736] flex items-center justify-between text-white!">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/10 rounded-md">
                                    {viewType === 'item' ? <Package size={24} /> : viewType === 'movement' ? <History size={24} /> : <Store size={24} />}
                                </div>
                                <div>
                                    <h2 className="font-black text-xl uppercase tracking-tighter text-white!">
                                        {viewType === 'item' ? 'Item Specifications' : viewType === 'movement' ? 'Transaction Receipt' : 'Vendor Profile'}
                                    </h2>
                                    <p className="text-[10px] font-bold text-white/60 uppercase tracking-[0.3em]">Institutional Records Office</p>
                                </div>
                            </div>
                            <button onClick={() => setShowViewModal(false)} className="p-3 bg-white/10 hover:bg-white/20 text-white! rounded-md transition-all"><X size={20} /></button>
                        </div>

                        <div className="p-10 max-h-[75vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-8">
                                {viewType === 'item' && (
                                    <>
                                        <DetailItem label="Full Name" value={viewData.name} />
                                        <DetailItem label="Category" value={viewData.category} />
                                        <DetailItem label="Current Stock" value={`${viewData.current_stock} ${viewData.unit}`} highlight />
                                        <DetailItem label="Min. Threshold" value={viewData.minimum_stock} />
                                        <DetailItem label="Storage Location" value={`${viewData.location} (Room ${viewData.room_number})`} />
                                        <DetailItem label="Identity ID" value={`INV-${viewData.id?.toString().padStart(5, '0')}`} />
                                    </>
                                )}
                                {viewType === 'movement' && (
                                    <>
                                        <DetailItem label="Item Name" value={viewData.item_name} />
                                        <DetailItem label="Activity Type" value={viewData.transaction_type === 'IN' ? 'Stock Receipt' : 'Stock Issuance'} color={viewData.transaction_type === 'IN' ? 'text-emerald-600' : 'text-rose-600'} />
                                        <DetailItem label="Quantity" value={viewData.quantity} highlight />
                                        <DetailItem label="Date" value={new Date(viewData.transaction_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })} />
                                        <DetailItem label="Source/Recipient" value={viewData.transaction_type === 'IN' ? viewData.supplier_name : viewData.issued_to} />
                                        <DetailItem label="Financial Impact" value={`₹${parseFloat(viewData.total_price || 0).toLocaleString()}`} color="text-blue-600" />
                                        <div className="col-span-2 p-5 bg-slate-50 rounded-md border border-dashed border-slate-300">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Administrative Remarks</p>
                                            <p className="text-xs font-bold text-slate-600 leading-relaxed italic">"{viewData.remarks || 'No formal remarks recorded for this transaction.'}"</p>
                                        </div>
                                    </>
                                )}
                                {viewType === 'supplier' && (
                                    <>
                                        <DetailItem label="Official Name" value={viewData.name} />
                                        <DetailItem label="Contact Executive" value={viewData.contact_person} />
                                        <DetailItem label="Mobile Number" value={viewData.phone} highlight />
                                        <DetailItem label="Email" value={viewData.email} />
                                        <div className="col-span-2">
                                            <DetailItem label="Registered Address" value={viewData.address} />
                                        </div>
                                    </>
                                )}

                                {/* Document Section */}
                                <div className="col-span-2 pt-6 border-t border-slate-100 mt-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Attached Document / Proof</h4>
                                    {viewData.document || viewData.identity_proof ? (
                                        <div className="flex items-center justify-between p-6 bg-blue-50/50 rounded-md border border-blue-100">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white rounded-md flex items-center justify-center text-blue-600 shadow-sm">
                                                    <FileDown size={20} />
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="text-xs font-black text-[#001736] uppercase tracking-tight truncate max-w-[200px]">
                                                        {(viewData.document || viewData.identity_proof).split('\\').pop().split('/').pop()}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Institutional Resource File</p>
                                                </div>
                                            </div>
                                            <a
                                                href={`${ROOT_URL}/${viewData.document || viewData.identity_proof}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="px-6 py-3 bg-white text-blue-600 border border-blue-200 rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center gap-2"
                                            >
                                                <Eye size={14} /> View / Download
                                            </a>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-12 bg-slate-50/50 rounded-md border border-dashed border-slate-200">
                                            <AlertTriangle size={32} className="text-slate-300 mb-3" />
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Digital Proof Attached</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ label, value, color, alert, icon }) => {
    const IconComponent = icon;
    return (
        <div className={`bg-white p-6 rounded-md border ${alert ? 'border-rose-200 bg-rose-50/20' : 'border-slate-200'} shadow-sm flex items-center justify-between group hover:shadow-md transition-all`}>
            <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{label}</p>
                <h3 className={`text-3xl font-black ${alert ? 'text-rose-600' : 'text-[#001736]'}`}>{value || 0}</h3>
            </div>
            <div className={`w-14 h-14 ${color} rounded-md flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                <IconComponent size={24} />
            </div>
        </div>
    );
};

const DetailItem = ({ label, value, highlight, color }) => (
    <div className="space-y-1.5">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">{label}</p>
        <p className={`text-sm font-black ${color || (highlight ? 'text-blue-600' : 'text-[#001736]')} tracking-tight uppercase`}>{value || '—'}</p>
    </div>
);

export default Inventory;
