import logger from '../utils/logger.js';

/**
 * Middleware: Restricts access to student enrollment and registry management.
 * Authorized Roles: admin, principal, accountant as per institutional reform.
 */
export const verifyAdmissionAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "No active session found." });
  }

  const authorizedRoles = ['admin', 'principal', 'accountant'];
  
  if (!authorizedRoles.includes(req.user.role)) {
    logger.warn(`[SECURITY] Unauthorized admission access attempt by ${req.user.username} (Role: ${req.user.role})`);
    return res.status(403).json({ 
        message: "Institutional Registry access restricted. Required: Admin, Principal, or Accountant." 
    });
  }

  next();
};
