import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Create a transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'your.email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your_app_password'
    }
});

/**
 * Send an email broadcast
 * @param {string|string[]} to - Recipient email or array of emails
 * @param {string} subject - Email subject
 * @param {string} text - Email body (plain text)
 * @param {string} html - Email body (HTML)
 * @returns {Promise<Object>}
 */
export const sendEmail = async (to, subject, text, html = '') => {
    try {
        const mailOptions = {
            from: `"Grace ERP" <${process.env.EMAIL_USER || 'your.email@gmail.com'}>`,
            to: Array.isArray(to) ? to.join(', ') : to,
            subject: subject,
            text: text,
            html: html || text // Fallback to text if html is not provided
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Message sent: %s', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error: error.message };
    }
};
