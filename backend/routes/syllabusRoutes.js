import express from "express";
import { 
    getSyllabusProgress, 
    addSyllabusTopic, 
    updateTopicStatus, 
    getDailyClassReport,
    getMasterSyllabus,
    addMasterSyllabusTopic,
    updateMasterSyllabusTopic,
    deleteMasterSyllabusTopic
} from "../controllers/syllabusController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// All syllabus routes require authentication
router.use(verifyToken);

router.get("/classroom/:classroom_id", getSyllabusProgress);
router.post("/", addSyllabusTopic);
router.put("/:id", updateTopicStatus);
router.get("/daily/:classroom_id", getDailyClassReport);

// Master Syllabus Routes
router.get("/master/:classroom_id", getMasterSyllabus);
router.post("/master", addMasterSyllabusTopic);
router.put("/master/:id", updateMasterSyllabusTopic);
router.delete("/master/:id", deleteMasterSyllabusTopic);

export default router;
