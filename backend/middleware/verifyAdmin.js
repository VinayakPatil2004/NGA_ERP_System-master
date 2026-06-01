import logger from '../utils/logger.js';

export const verifyAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "No authentication user found." });
  }

  const userRole = req.user.role?.toLowerCase();
  const isPrincipal = userRole === 'principal';
  const isPayrollRoute = req.originalUrl?.toLowerCase().includes('/payroll') || req.originalUrl?.toLowerCase().includes('/salary');

  if (userRole !== 'admin' && !(isPrincipal && !isPayrollRoute)) {
    logger.warn(`Unauthorized access attempt by user: ${req.user.username} (Role: ${req.user.role})`);
    return res.status(403).json({ message: "Administrator access required." });
  }

  next();
};
