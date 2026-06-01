import jwt from "jsonwebtoken";
import pool from "../config/db.js";

export const verifyToken = async (req, res, next) => {
  // --- PREFLIGHT BYPASS ---
  if (req.method === "OPTIONS") {
    return next();
  }

  const authHeader = req.headers.authorization;

  // ❌ No header
  if (!authHeader) {
    console.warn(`[SECURITY ALERT] No Authorization header for ${req.method} ${req.url}`);
    return res.status(401).json({
      message: "Access denied. No token provided."
    });
  }

  // ❌ Invalid format
  if (!authHeader.startsWith("Bearer ")) {
    console.warn(`[SECURITY ALERT] Invalid token format for ${req.method} ${req.url}`);
    return res.status(401).json({
      message: "Invalid token format. Expected 'Bearer <token>'."
    });
  }

  const token = authHeader.split(" ")[1];

  // ❌ Invalid token values
  if (!token || token === "null" || token === "undefined") {
    console.warn(`[SECURITY ALERT] Empty or invalid token for ${req.method} ${req.url}`);
    return res.status(401).json({
      message: "Invalid token provided."
    });
  }

  try {
    // 🔐 Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔥 FETCH USER FROM DB — Directed lookup using userType from token
    let user = null;
    let userRole = decoded.role; // Default from token

    if (decoded.userType === 'admin') {
      const [[admin]] = await pool.query(
        `SELECT a.id, r.role_name AS role, a.is_blocked AS blocked
         FROM admins a
         JOIN roles r ON a.role_id = r.id
         WHERE a.id = ?`,
        [decoded.id]
      );
      if (admin) user = admin;
    } else if (decoded.userType === 'staff') {
      const [[staff]] = await pool.query(
        `SELECT s.id, r.role_name AS role, s.status, s.is_blocked AS blocked
         FROM staff s
         JOIN roles r ON s.role_id = r.id
         WHERE s.id = ?`,
        [decoded.id]
      );
      if (staff) user = staff;
    } else if (decoded.userType === 'student') {
      const [[student]] = await pool.query(
        `SELECT id, 'student' AS role, status, 0 AS blocked
         FROM students
         WHERE id = ?`,
        [decoded.id]
      );
      if (student) user = student;
    } else if (decoded.userType === 'parent') {
      const [[parent]] = await pool.query(
        `SELECT p.id, r.role_name AS role, 0 AS blocked, p.student_id
         FROM parents p
         JOIN roles r ON p.role_id = r.id
         WHERE p.id = ?`,
        [decoded.id]
      );
      if (parent) user = parent;
    }

    // ❌ User not found (might happen if ID collision was guessed wrong before, or user deleted)
    if (!user) {
      console.warn(`[SECURITY ALERT] User not found for ${decoded.userType} ID ${decoded.id}`);
      return res.status(401).json({
        message: "User no longer exists or session is invalid."
      });
    }

    // ❌ Blocked / inactive check
    if (user.blocked || user.status === "inactive") {
      console.warn(`[SECURITY ALERT] Blocked/inactive user tried access: ${user.id}`);
      return res.status(403).json({
        message: "Account is inactive or suspended."
      });
    }

    let finalRole = user.role;

    // ✅ Attach trusted user (FROM DB, NOT TOKEN)
    req.user = { 
      ...user, 
      role: finalRole,
      userType: decoded.userType 
    };

    next();

  } catch (err) {
    console.error(
      `[SECURITY ALERT] Token Error: ${err.message} for ${req.method} ${req.url}`
    );

    // 🔥 Specific error handling
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token expired. Please login again."
      });
    }

    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "Invalid token."
      });
    }

    return res.status(401).json({
      message: "Authentication failed."
    });
  }
};