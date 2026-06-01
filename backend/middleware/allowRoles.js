export const allowRoles = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      let userRole = req.user.role?.toLowerCase();
      const userType = req.user.userType?.toLowerCase();

      if (!userRole) {
        return res.status(403).json({
          message: "Access denied. Role not found."
        });
      }



      // Normalize security guard role spellings and space/underscore variations
      if (userRole === 'security guard' || userRole === 'security gaurd' || userRole === 'security_gaurd') {
        userRole = 'security_guard';
      }

      const lowerAllowedRoles = allowedRoles.map(r => {
        const lr = r.toLowerCase();
        if (lr === 'security guard' || lr === 'security gaurd' || lr === 'security_gaurd') return 'security_guard';
        return lr;
      });

      const isPrincipal = userRole === 'principal';
      
      // Strict rule: No payroll controller access for the principal
      const isPayrollRoute = req.originalUrl?.toLowerCase().includes('/payroll') || req.originalUrl?.toLowerCase().includes('/salary');
      
      // Principal is allowed admin access everywhere except payroll
      const hasAdminAccess = lowerAllowedRoles.includes('admin');
      const isPrincipalAuthorized = isPrincipal && !isPayrollRoute && hasAdminAccess;

      if (!lowerAllowedRoles.includes(userRole) && !isPrincipalAuthorized) {
        return res.status(403).json({
          message: `Access denied for role: ${userRole}`
        });
      }

      next();
    } catch (err) {
      console.error("RBAC Error:", err.message);
      return res.status(500).json({
        message: "Authorization error"
      });
    }
  };
};