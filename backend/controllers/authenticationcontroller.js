import db from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import logger from '../utils/logger.js';

// ======================= LOGIN =======================
export const login = async (req, res) => {
    try {
        let { username, password, rememberMe, role: roleHint } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                error: "Username and password are required"
            });
        }

        username = username.trim();
        password = password.trim();

        let user = null;
        let userType = '';

        // Helper function for checking tables
        const checkAdmins = async () => {
            const [rows] = await db.query(
                "SELECT a.*, r.role_name FROM admins a JOIN roles r ON a.role_id = r.id WHERE a.username = ? OR a.email = ?",
                [username, username]
            );
            if (rows.length > 0) { user = rows[0]; userType = 'admin'; return true; }
            return false;
        };

        const checkStaff = async () => {
            const [rows] = await db.query(
                "SELECT s.*, r.role_name FROM staff s JOIN roles r ON s.role_id = r.id WHERE s.username = ? OR s.email = ?",
                [username, username]
            );
            if (rows.length > 0) { user = rows[0]; userType = 'staff'; return true; }
            return false;
        };

        const checkStudents = async () => {
            const [rows] = await db.query(
                "SELECT *, 'student' as role_name FROM students WHERE username = ? OR student_id_no = ?",
                [username, username]
            );
            if (rows.length > 0) { user = rows[0]; userType = 'student'; return true; }
            return false;
        };

        const checkParents = async () => {
            const [rows] = await db.query(
                "SELECT p.*, r.role_name FROM parents p JOIN roles r ON p.role_id = r.id WHERE p.username = ? OR p.father_email = ? OR p.father_mobile = ? OR p.mother_mobile = ? OR p.email = ?",
                [username, username, username, username, username]
            );
            if (rows.length > 0) { user = rows[0]; userType = 'parent'; return true; }
            return false;
        };

        // 🔍 Execute Search with Priority
        let found = false;
        if (roleHint === 'student') {
            found = await checkStudents();
        } else if (roleHint === 'parent') {
            found = await checkParents();
        }

        if (!found) {
            // Default or Admin/Staff login, or fallback: search sequentially
            if (!await checkAdmins()) {
                if (!await checkStaff()) {
                    if (!await checkStudents()) {
                        await checkParents();
                    }
                }
            }
        }

        // ❌ No user found
        if (!user) {
            logger.warn(`Login failed: No identity found for - ${username}`);
            return res.status(401).json({
                error: "Invalid institutional credentials"
            });
        }

        // 🔒 Password Expiry Check
        if (user.password_changed_at) {
            const lastChanged = new Date(user.password_changed_at);
            const now = new Date();
            const diffDays = Math.ceil(Math.abs(now - lastChanged) / (1000 * 60 * 60 * 24));

            if (diffDays >= 60) {
                await db.query(
                    `UPDATE ${userType === 'staff' ? 'staff' : userType + 's'} 
                     SET is_blocked = 1, block_reason = 'password_expired' 
                     WHERE id = ?`,
                    [user.id]
                );

                return res.status(403).json({
                    error: "PASSWORD_EXPIRED",
                    message: "Your credentials have expired. Please reset your password."
                });
            }
        }

        // 🔒 Blocked User Check
        if (user.is_blocked) {
            const message =
                user.block_reason === 'password_expired'
                    ? "Your security credentials have expired."
                    : "Your account has been suspended.";

            return res.status(403).json({
                error: user.block_reason === 'password_expired'
                    ? "PASSWORD_EXPIRED"
                    : "ACCOUNT_BLOCKED",
                message
            });
        }

        // 🔐 Verify Password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            logger.warn(`Failed login attempt for ${username} - Password mismatch`);
            return res.status(401).json({
                error: "Invalid institutional credentials"
            });
        }

        // 🔥 SECURE JWT (NOW HAS ROLE & TYPE)
        const expiresIn = rememberMe ? '30d' : '24h';

        const token = jwt.sign(
            { 
                id: user.id, 
                role: user.role_name,
                userType: userType,
                studentId: userType === 'parent' ? user.student_id : (userType === 'student' ? user.id : null)
            }, 
            process.env.JWT_SECRET,
            { expiresIn }
        );

        logger.success(`Institutional Login: ${user.username} as ${userType}`);

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role_name, 
                userType: userType,
                studentId: userType === 'parent' ? user.student_id : (userType === 'student' ? user.id : null),
                fullName:
                    user.full_name ||
                    user.student_name ||
                    user.father_name ||
                    user.first_name
            }
        });

    } catch (error) {
        logger.error("Authentication Controller Error:", error);
        res.status(500).json({
            error: "Institutional service temporarily unavailable."
        });
    }
};

// ======================= FORGOT PASSWORD =======================
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }

        let user = null;
        let userType = '';

        const tables = ['admins', 'staff', 'students', 'parents'];

        for (const t of tables) {
            const emailField = t === 'parents' ? 'father_email' : 'email';

            const [rows] = await db.query(
                `SELECT id FROM ${t} WHERE ${emailField} = ?`,
                [email]
            );

            if (rows.length > 0) {
                user = rows[0];
                userType = t;
                break;
            }
        }

        if (!user) {
            // Anti-enumeration: Return success even if email not found
            return res.json({
                message: "If this email exists in our system, recovery instructions have been sent."
            });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 3600000); // 1 hour

        await db.query(
            `UPDATE ${userType} 
             SET reset_token = ?, reset_token_expires = ? 
             WHERE id = ?`,
            [resetToken, expiry, user.id]
        );

        // 🛠️ Development Mode Convenience: Log the recovery link to the server console
        const resetLink = `http://localhost:5173/reset-password/${resetToken}`;
        logger.info(`[DEVELOPMENT MODE] Simulated recovery link for ${email}:\n👉 ${resetLink}\n`);

        res.json({
            message: "If this email exists in our system, recovery instructions have been sent."
        });

    } catch (error) {
        logger.error("Forgot Password Error:", error);
        res.status(500).json({
            error: "Failed to initiate recovery process."
        });
    }
};

// ======================= RESET PASSWORD =======================
export const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        // 🔒 Strong validation
        if (!token || !newPassword || newPassword.length < 6) {
            return res.status(400).json({
                error: "Password must be at least 6 characters long"
            });
        }

        // 🔥 Optional strong password rule
        if (!/(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
            return res.status(400).json({
                error: "Password must contain at least one uppercase letter and one number"
            });
        }

        let user = null;
        let userType = '';

        const tables = ['admins', 'staff', 'students', 'parents'];

        for (const t of tables) {
            const [rows] = await db.query(
                `SELECT id, password, is_blocked, block_reason 
                 FROM ${t} 
                 WHERE reset_token = ? AND reset_token_expires > NOW()`,
                [token]
            );

            if (rows.length > 0) {
                user = rows[0];
                userType = t;
                break;
            }
        }

        if (!user) {
            return res.status(400).json({
                error: "Invalid or expired recovery token"
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const shouldUnblock =
            user.is_blocked === 1 && user.block_reason === 'password_expired';

        await db.query(
            `UPDATE ${userType} 
             SET password = ?, 
                 password_changed_at = CURRENT_TIMESTAMP,
                 is_blocked = ?, 
                 block_reason = ?, 
                 reset_token = NULL, 
                 reset_token_expires = NULL 
             WHERE id = ?`,
            [
                hashedPassword,
                shouldUnblock ? 0 : user.is_blocked,
                shouldUnblock ? null : user.block_reason,
                user.id
            ]
        );

        res.json({
            message: "Password updated successfully. You can now log in."
        });

    } catch (error) {
        logger.error("Reset Password Error:", error);
        res.status(500).json({
            error: "Failed to reset password"
        });
    }
};