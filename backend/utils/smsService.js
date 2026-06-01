import dotenv from 'dotenv';
dotenv.config();

/**
 * Send an SMS broadcast (Simulated/Mock service for free tier)
 * In production, you would replace this with Fast2SMS, MSG91, or Twilio API calls.
 * @param {string|string[]} to - Recipient phone number or array of numbers
 * @param {string} message - SMS content
 * @returns {Promise<Object>}
 */
export const sendSMS = async (to, message) => {
    try {
        const numbers = Array.isArray(to) ? to : [to];
        
        // --- PROD IMPLEMENTATION EXAMPLE (e.g. Fast2SMS) ---
        // if (process.env.SMS_API_KEY) {
        //     const response = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
        //         route: 'q',
        //         message: message,
        //         language: 'english',
        //         flash: 0,
        //         numbers: numbers.join(',')
        //     }, {
        //         headers: { 'authorization': process.env.SMS_API_KEY }
        //     });
        //     return { success: true, response: response.data };
        // }

        // --- SIMULATED MOCK (Development / Free Tier) ---
        console.log(`\n================ SIMULATED SMS ================`);
        console.log(`TO: ${numbers.join(', ')}`);
        console.log(`MESSAGE: ${message}`);
        console.log(`=================================================\n`);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        return { success: true, message: "Simulated SMS sent successfully" };
    } catch (error) {
        console.error('Error sending SMS:', error);
        return { success: false, error: error.message };
    }
};
