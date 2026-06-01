import API from './API';

/**
 * Transport Management API Service
 * Handles vehicle registry and student route assignments.
 */

// ── Vehicle Operations ──────────────────────────────────────────────────────

export const getAllVehicles = async () => {
    const response = await API.get('/transport/vehicles');
    return response.data;
};

export const addVehicle = async (vehicleData) => {
    const response = await API.post('/transport/vehicles', vehicleData);
    return response.data;
};

export const updateVehicle = async (id, vehicleData) => {
    const response = await API.put(`/transport/vehicles/${id}`, vehicleData);
    return response.data;
};

export const deleteVehicle = async (id) => {
    const response = await API.delete(`/transport/vehicles/${id}`);
    return response.data;
};


// ── Student Assignment Operations ───────────────────────────────────────────

export const getVehicleAssignments = async (vehicleId, academicYearId) => {
    const response = await API.get('/transport/assignments', {
        params: { vehicle_id: vehicleId, academicYearId }
    });
    return response.data;
};

export const assignStudentToVehicle = async (assignmentData) => {
    const response = await API.post('/transport/assignments', assignmentData);
    return response.data;
};

export const removeStudentFromVehicle = async (assignmentId) => {
    const response = await API.delete(`/transport/assignments/${assignmentId}`);
    return response.data;
};

export const updateStudentAssignment = async (assignmentId, assignmentData) => {
    const response = await API.put(`/transport/assignments/${assignmentId}`, assignmentData);
    return response.data;
};

const transportAPI = {
    getAllVehicles,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    getVehicleAssignments,
    assignStudentToVehicle,
    removeStudentFromVehicle,
    updateStudentAssignment
};

export default transportAPI;
