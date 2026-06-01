import { v4 as uuidv4 } from 'uuid';

/**
 * Gets the persistent device ID from localStorage or creates a new one.
 */
export const getOrCreateDeviceId = () => {
    let deviceId = localStorage.getItem('slpaems_device_id');
    if (!deviceId) {
        deviceId = uuidv4();
        localStorage.setItem('slpaems_device_id', deviceId);
    }
    return deviceId;
};
