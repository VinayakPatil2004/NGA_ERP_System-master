import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

import express from "express";
import cors from "cors";
import helmet from "helmet";
import logger from "./utils/logger.js";
import loggerMiddleware from "./middleware/loggerMiddleware.js";
import { swaggerSpec, swaggerUiOptions, swaggerUi } from "./swagger/swaggerConfig.js";
import admissionRouter from "./routes/admissionRoute.js";
import staffRouter from "./routes/staffRoute.js";
import academicYearRouter from "./routes/academicYearRoute.js";
import studentRouter from "./routes/studentRoute.js";
import classroomRouter from "./routes/classroomRoute.js";
import attendanceRouter from "./routes/attendanceRoute.js";
import academicRecordRouter from "./routes/academicRecordRoute.js";
import authRouter from "./routes/authRoute.js";
import teacherRouter from "./routes/teacherRoutes.js";
import roleRouter from "./routes/roleRoutes.js";
import adminProfileRouter from "./routes/adminProfileRoutes.js";
import financeRouter from "./routes/FeesAndFinanceRoutes.js";
import hrRouter from "./routes/hrRoutes.js";
import transportRouter from "./routes/transportRoutes.js";
import inventoryRouter from "./routes/inventoryRoutes.js";
import communicationRouter from "./routes/communicationRoutes.js";
import announcementRouter from "./routes/announcementRoutes.js";
import examRouter from "./routes/examRoutes.js";
import libraryRouter from "./routes/libraryRoutes.js";
import counsellorRouter from "./routes/counsellorRoute.js";
import timetableRouter from "./routes/timetableRoute.js";
import assignmentRouter from "./routes/assignmentRoute.js";
import parentRouter from "./routes/parentRoute.js";
import leavingCertificateRoutes from './routes/leavingCertificateRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';
import bulkImportRoutes from './routes/bulkImportRoutes.js';
import userRoutes from './routes/userRoutes.js';
import securityRouter from './routes/securityRoutes.js';
import syllabusRouter from './routes/syllabusRoutes.js';
import subjectRouter from "./routes/subjectRoutes.js";
import calendarRouter from "./routes/calendarRoute.js";


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "frame-src": ["'self'", "blob:", "data:"],
            "frame-ancestors": ["'self'", "http://localhost:*"],
            "img-src": ["'self'", "data:", "https:"],
            "script-src": ["'self'", "'unsafe-inline'"],
            "style-src": ["'self'", "'unsafe-inline'", "https:"],
        }
    },
    crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve uploaded files - using absolute path for reliability
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/uploads", express.static(path.join(__dirname, "uploads")));

// ─── Swagger API Documentation ───────────────────────────────────────────────
app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, swaggerUiOptions)
);
// Raw OpenAPI JSON spec (useful for external tools like Postman)
app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});
logger.success(`📚 Swagger UI available at → http://localhost:${process.env.PORT || 5000}/api-docs`);

app.use(loggerMiddleware);

// API Endpoints
app.use("/api/admission", admissionRouter);
app.use("/api/staff", staffRouter);
app.use("/api/academic-years", academicYearRouter);
app.use("/api/students", studentRouter);
app.use("/api/classrooms", classroomRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/academic-records", academicRecordRouter);
app.use("/api/teacher", teacherRouter);
app.use("/api/auth", authRouter);
app.use("/api/roles", roleRouter);
app.use("/api/admin/profile", adminProfileRouter);
app.use("/api/finance", financeRouter);
app.use("/api/hr", hrRouter);
app.use("/api/transport", transportRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/communication", communicationRouter);
app.use("/api/announcements", announcementRouter);
app.use("/api/exams", examRouter);
app.use("/api/library", libraryRouter);
app.use("/api/counsellor", counsellorRouter);
app.use("/api/timetable", timetableRouter);
app.use("/api/assignments", assignmentRouter);
app.use("/api/parents", parentRouter);
app.use('/api/lc', leavingCertificateRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/bulk-import', bulkImportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/security', securityRouter);
app.use('/api/syllabus', syllabusRouter);
app.use('/api/subjects', subjectRouter);
app.use('/api/calendar', calendarRouter);

// API is Running 
app.get("/", (req, res) => {
    res.send("API Is working ");    
});

// Server is running
app.use((req, res) => {
    logger.error(`404 Not Found: ${req.method} ${req.url}`);
    res.status(404).send("Route not found");
});

app.listen(PORT, () => {
    logger.success(`Server is running on port ${PORT}`);
});
