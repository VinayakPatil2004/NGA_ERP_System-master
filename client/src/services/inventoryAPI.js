import API from './API';

/**
 * Inventory Management API Service
 * Handles institutional item cataloging, vendor registry, and stock movements.
 */

const toFormData = (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
            formData.append(key, data[key]);
        }
    });
    return formData;
};

// ── Item Catalog ───────────────────────────────────────────────────────────

export const getAllInventoryItems = async () => {
    const response = await API.get('/inventory/items');
    return response.data;
};

export const registerItem = async (itemData) => {
    const response = await API.post('/inventory/items', toFormData(itemData), {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const updateItem = async (id, itemData) => {
    const response = await API.put(`/inventory/items/${id}`, toFormData(itemData), {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const deleteItem = async (id) => {
    const response = await API.delete(`/inventory/items/${id}`);
    return response.data;
};


// ── Supplier Registry ───────────────────────────────────────────────────────

export const getAllSuppliers = async () => {
    const response = await API.get('/inventory/suppliers');
    return response.data;
};

export const registerSupplier = async (supplierData) => {
    const response = await API.post('/inventory/suppliers', toFormData(supplierData), {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const updateSupplier = async (id, data) => {
    const response = await API.put(`/inventory/suppliers/${id}`, toFormData(data), {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const deleteSupplier = async (id) => {
    const response = await API.delete(`/inventory/suppliers/${id}`);
    return response.data;
};


// ── Stock Movement Transactions ─────────────────────────────────────────────

export const getInventoryTransactions = async () => {
    const response = await API.get('/inventory/transactions');
    return response.data;
};

export const recordStockMovement = async (transactionData) => {
    const response = await API.post('/inventory/transactions', toFormData(transactionData), {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const updateStockMovement = async (id, data) => {
    const response = await API.put(`/inventory/transactions/${id}`, toFormData(data), {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const deleteStockMovement = async (id) => {
    const response = await API.delete(`/inventory/transactions/${id}`);
    return response.data;
};


// ── Institutional Insights ──────────────────────────────────────────────────

export const getInventoryStats = async () => {
    const response = await API.get('/inventory/stats');
    return response.data;
};

const inventoryAPI = {
    getAllInventoryItems,
    registerItem,
    getAllSuppliers,
    registerSupplier,
    getInventoryTransactions,
    recordStockMovement,
    getInventoryStats,
    updateItem,
    deleteItem,
    updateSupplier,
    deleteSupplier,
    updateStockMovement,
    deleteStockMovement
};

export default inventoryAPI;
