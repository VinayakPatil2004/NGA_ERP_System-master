import logger from '../utils/logger.js';

/**
 * Middleware to enforce Institutional Finance Access Controls.
 * Rules:
 * - Admin & principal: Full CRUD (GET, POST, PUT, DELETE)
 * - Accountant: Read-only (GET)
 * - Others: Access Forbidden
 */
export const verifyFinanceAccess = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "Institutional authentication required." });
    }

    const { role } = req.user;
    const method = req.method;

    // Admin and principal have unrestricted access to Finance modules
    if (role === 'admin' || role === 'principal') {
        return next();
    }

    // Accountant is restricted to Read-only operations for audit and monitoring
    if (role === 'accountant') {
        if (method === 'GET') {
            return next();
        } else {
            logger.warn(`Unauthorized Finance Mutation Attempt: ${req.user.username} (Role: accountant) attempted ${method} ${req.url}`);
            return res.status(403).json({ 
                error: "READ_ONLY_ACCESS",
                message: "Accountants are restricted to viewing financial structures only. Modifications require administrator approval." 
            });
        }
    }

    // All other roles are denied access to the Finance & Fees backbone
    logger.error(`Unauthorized Finance Access Blocked: ${req.user.username} (Role: ${role}) attempted ${method} ${req.url}`);
    return res.status(403).json({ 
        message: "You do not have the required permissions to access institutional financial records." 
    });
};
