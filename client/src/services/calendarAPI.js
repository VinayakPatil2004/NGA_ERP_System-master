import API from './API';

/**
 * Retrieve all calendar events
 */
export const getAllCalendarEvents = async () => {
    const response = await API.get('/calendar/all');
    return response.data;
};

/**
 * Record a new calendar event
 */
export const addCalendarEvent = async (eventData) => {
    const response = await API.post('/calendar/add', eventData);
    return response.data;
};

/**
 * Update an existing calendar event
 */
export const updateCalendarEvent = async (id, eventData) => {
    const response = await API.put(`/calendar/update/${id}`, eventData);
    return response.data;
};

/**
 * Delete a calendar event from the registry
 */
export const deleteCalendarEvent = async (id) => {
    const response = await API.delete(`/calendar/delete/${id}`);
    return response.data;
};
