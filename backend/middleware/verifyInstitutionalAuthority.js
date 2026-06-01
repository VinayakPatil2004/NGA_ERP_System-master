import logger from '../utils/logger.js';

export const verifyInstitutionalAuthority = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "No authentication user found." });
  }

  const allowedRoles = ['admin', 'principal', 'teacher'];
  
  if (!allowedRoles.includes(req.user.role)) {
    logger.warn(`Unauthorized access attempt by user: ${req.user.username} (Role: ${req.user.role}) on Institutional Registry`);
    return res.status(403).json({ 
      message: "Access Denied: High-level institutional authority (Admin/principal/Teacher) required." 
    });
  }

  next();
};
