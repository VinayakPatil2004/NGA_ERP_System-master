import API from './API';

/**
 * Institutional Communication API Service
 * Handles unified messaging, notice board (announcements), and read tracking.
 */

// ── Messaging Operations ───────────────────────────────────────────────────

export const sendMessage = async (messageData) => {
    // Expected: sender_id, sender_type, title, content, target_group, target_id, priority, attachment_url
    const response = await API.post('/communication/send', messageData);
    return response.data;
};

export const getInbox = async (userId, userType, academicYearId) => {
    const params = { id: userId, type: userType };
    if (academicYearId) params.academic_year_id = academicYearId;
    const response = await API.get('/communication/inbox', { params });
    return response.data;
};

export const getOutbox = async (senderId, senderType, academicYearId) => {
    const params = { senderId, senderType };
    if (academicYearId) params.academic_year_id = academicYearId;
    const response = await API.get('/communication/outbox', { params });
    return response.data;
};

export const markMessageAsRead = async (recipientEntryId) => {
    const response = await API.put(`/communication/mark-read/${recipientEntryId}`);
    return response.data;
};


// ── Notice Board (Announcements) ───────────────────────────────────────────

export const getAllAnnouncements = async (academicYearId) => {
    const params = academicYearId ? { academic_year_id: academicYearId } : {};
    const response = await API.get('/communication/announcements', { params });
    return response.data;
};

export const publishAnnouncement = async (announcementData) => {
    // Expected: title, description, start_date, end_date, target_audience
    // Supports FormData (when attachment is present) or plain JSON
    const isFormData = announcementData instanceof FormData;
    const response = await API.post('/communication/announcements', announcementData, isFormData ? {
        headers: { 'Content-Type': 'multipart/form-data' }
    } : undefined);
    return response.data;
};

export const updateAnnouncement = async (id, announcementData) => {
    const isFormData = announcementData instanceof FormData;
    const response = await API.put(`/communication/announcements/${id}`, announcementData, isFormData ? {
        headers: { 'Content-Type': 'multipart/form-data' }
    } : undefined);
    return response.data;
};

export const deleteAnnouncement = async (id) => {
    const response = await API.delete(`/communication/announcements/${id}`);
    return response.data;
};

// ── Email & SMS Broadcasts ─────────────────────────────────────────────────

export const sendEmailBroadcast = async (emailData) => {
    const response = await API.post('/communication/email', emailData);
    return response.data;
};

export const sendSMSBroadcast = async (smsData) => {
    const response = await API.post('/communication/sms', smsData);
    return response.data;
};

// ── Circulars (PDF/Documents) ──────────────────────────────────────────────

export const getCirculars = async (academicYearId, targetAudience) => {
    const params = {};
    if (academicYearId) params.academic_year_id = academicYearId;
    if (targetAudience) params.target_audience = targetAudience;
    const response = await API.get('/communication/circulars', { params });
    return response.data;
};

export const uploadCircular = async (formData) => {
    const response = await API.post('/communication/circulars', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const deleteCircular = async (id) => {
    const response = await API.delete(`/communication/circulars/${id}`);
    return response.data;
};

const communicationAPI = {
    sendMessage,
    getInbox,
    getOutbox,
    markMessageAsRead,
    getAllAnnouncements,
    publishAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    sendEmailBroadcast,
    sendSMSBroadcast,
    getCirculars,
    uploadCircular,
    deleteCircular
};

export default communicationAPI;
