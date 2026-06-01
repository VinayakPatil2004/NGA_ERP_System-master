import express from "express";

import {
  getTeacherProfile,
  postAnnouncement,
  getAnnouncements,
  getNotices,
  createAssignment,
  getAssignments
} from "../controllers/teacherController.js";

import { verifyToken } from "../middleware/verifyToken.js";
import { allowRoles } from "../middleware/allowRoles.js";

const router = express.Router();

// ================= PUBLIC ROUTE =================
// (Login moved to auth routes)

// ================= PROTECTED ROUTES =================

//  Only STAFF (teachers)
router.get(
  "/profile",
  verifyToken,
  allowRoles("teacher", "admin", "principal"),
  getTeacherProfile
);

router.post(
  "/announcements",
  verifyToken,
  allowRoles("teacher", "admin", "principal"),
  postAnnouncement
);

router.get(
  "/announcements",
  verifyToken,
  allowRoles("teacher", "admin", "principal"),
  getAnnouncements
);

router.get(
  "/notices",
  verifyToken,
  allowRoles("teacher", "admin", "principal"),
  getNotices
);

router.post(
  "/assignments",
  verifyToken,
  allowRoles("teacher", "admin", "principal"),
  createAssignment
);

router.get(
  "/assignments",
  verifyToken,
  allowRoles("teacher", "admin", "principal"),
  getAssignments
);

export default router;