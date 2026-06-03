import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import pool from '../../backend/config/db.js';
import { AttendanceAdapter, FeeAdapter, ExamAdapter } from '../services/adapters.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = 5050;

app.use(cors());
app.use(express.json());

// Initialize Gemini client if API Key exists, otherwise fail gracefully to mock mode
let ai = null;
if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    console.log("⚡ Chatbot Lab: Google Gemini Integration Active!");
} else {
    console.log("⚠️ Chatbot Lab: GEMINI_API_KEY not found in .env. Falling back to high-fidelity mock data mode.");
}

// In-Memory Chat Session Context (Simulating Session Context Memory)
const chatSessions = {};

/**
 * 🔍 Intent Detection Helper
 */
const detectIntent = (message) => {
    const msg = message.toLowerCase();
    if (msg.includes('attendance') || msg.includes('absent') || msg.includes('present')) {
        return 'ATTENDANCE_QUERY';
    }
    if (msg.includes('exam') || msg.includes('test') || msg.includes('schedule')) {
        return 'EXAM_QUERY';
    }
    if (msg.includes('fee') || msg.includes('payment') || msg.includes('pending') || msg.includes('due')) {
        return 'FEE_QUERY';
    }
    return 'GENERAL_CHAT';
};

/**
 * 📦 High-Fidelity Mock ERP Data for Safe Prototyping
 */
const mockERPData = {
    attendance: "Rahul has maintained an excellent attendance rate of 98% this term (marked absent only 1 day).",
    exams: "Upcoming exam 'Semester Examination' starts on 15 June 2026.",
    fees: "Pending Tuition Dues: Rs. 10,000 (Due Date: 10 June 2026)."
};

/**
 * 💬 Conversational Chat Endpoint
 */
app.post('/api/chatbot/chat', async (req, res) => {
    try {
        const { message, sessionId = 'default-session', role = 'parent', username = '7840954075' } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        // Initialize session context memory if empty
        if (!chatSessions[sessionId]) {
            chatSessions[sessionId] = [];
        }

        // 1. Intent Detection
        const intent = detectIntent(message);
        console.log(`[CHATBOT LAB] Session: ${sessionId} | Intent: ${intent} | Role: ${role} | Username: ${username}`);

        // Save user message to context memory
        chatSessions[sessionId].push({ role: 'user', content: message });

        // 2. Fetch Live ERP Metrics from Database
        let erpFacts = { ...mockERPData };
        let isLiveDB = false;

        if (role === 'parent') {
            try {
                // Find parent and student_id
                const [parents] = await pool.query(
                    "SELECT id, student_id, father_name FROM parents WHERE username = ? OR father_mobile = ?",
                    [username, username]
                );

                if (parents.length > 0) {
                    const studentId = parents[0].student_id;
                    const fatherName = parents[0].father_name;
                    
                    // Fetch student details
                    const [students] = await pool.query("SELECT first_name, last_name FROM students WHERE id = ?", [studentId]);
                    const studentName = students.length > 0 ? `${students[0].first_name} ${students[0].last_name}` : "your child";

                    // Fetch active academic year
                    const [academicYears] = await pool.query("SELECT id FROM academic_years WHERE is_active = 1 LIMIT 1");
                    const ayId = academicYears.length > 0 ? academicYears[0].id : 1;

                    // Query read-only adapters
                    const attendanceData = await AttendanceAdapter.getSummaryByStudent(studentId, ayId);
                    const feeData = await FeeAdapter.getPendingFees(studentId, ayId);
                    const examData = await ExamAdapter.getUpcoming(ayId);

                    // Build facts!
                    erpFacts.attendance = `${studentName} has maintained an attendance rate of ${attendanceData.rate}% (${attendanceData.present} present, ${attendanceData.absent} absent, ${attendanceData.late} late).`;
                    erpFacts.fees = feeData.totalPending > 0 
                        ? `Outstanding Pending Fees: Rs. ${feeData.totalPending.toLocaleString()}. Details: ${feeData.list.map(f => `${f.fee_type} (Rs. ${f.total_amount - f.paid_amount} due ${new Date(f.due_date).toLocaleDateString()})`).join(', ')}.`
                        : `All fees are fully paid! Outstanding balance is Rs. 0.`;
                    erpFacts.exams = examData.length > 0
                        ? `Upcoming Scheduled Exams: ${examData.map(e => `'${e.exam_name}' (${e.term} term) starting on ${new Date(e.start_date).toLocaleDateString()}`).join(', ')}.`
                        : `No upcoming exams are currently scheduled.`;

                    isLiveDB = true;
                    console.log(`[CHATBOT LAB] Successfully loaded live DB metrics for Student: ${studentName}`);
                }
            } catch (dbError) {
                console.warn("⚠️ Chatbot DB Adapter failed, falling back to mock metrics:", dbError.message);
            }
        }

        let reply = "";

        // 3. Gemini Integration (if API Key is configured)
        if (ai) {
            try {
                const contextSummary = chatSessions[sessionId].map(c => `${c.role}: ${c.content}`).join('\n');
                const systemPrompt = `You are a helpful school administrative assistant for Grace ERP parent portal.
                The logged-in user is a ${role}. 
                Current date: 2026-06-02.
                
                Based on the detected intent "${intent}", here is the secure database facts you can share:
                - Attendance details: ${erpFacts.attendance}
                - Exams details: ${erpFacts.exams}
                - Fees details: ${erpFacts.fees}
                
                Draft a polite, concise, and helpful response. Answer only using the secure facts above. Keep context of previous turns:
                ${contextSummary}`;

                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: systemPrompt,
                });

                reply = response.text;
            } catch (geminiError) {
                console.warn("⚠️ Chatbot Gemini API failed, falling back to mock metrics:", geminiError.message);
                if (intent === 'ATTENDANCE_QUERY') {
                    reply = `Hello! 📢 ${erpFacts.attendance} Everything looks great!`;
                } else if (intent === 'EXAM_QUERY') {
                    reply = `Hello! 📅 ${erpFacts.exams} We recommend starting preparation early.`;
                } else if (intent === 'FEE_QUERY') {
                    reply = `Hello! 💰 ${erpFacts.fees} You can view details in your fee ledger.`;
                } else {
                    reply = `Hello! I am your Grace ERP Assistant. I can help you check child attendance, upcoming exams, or pending fees. Ask me something like "How is my child's attendance?"`;
                }
            }
        } else {
            // High-fidelity fallback mock responses matching intents using dynamic DB facts
            if (intent === 'ATTENDANCE_QUERY') {
                reply = `Hello! 📢 ${erpFacts.attendance} Everything looks great!`;
            } else if (intent === 'EXAM_QUERY') {
                reply = `Hello! 📅 ${erpFacts.exams} We recommend starting preparation early.`;
            } else if (intent === 'FEE_QUERY') {
                reply = `Hello! 💰 ${erpFacts.fees} You can view details in your fee ledger.`;
            } else {
                reply = `Hello! I am your Grace ERP Assistant. I can help you check child attendance, upcoming exams, or pending fees. Ask me something like "How is my child's attendance?"`;
            }
        }

        // Save chatbot reply to context memory
        chatSessions[sessionId].push({ role: 'assistant', content: reply });

        // Keep memory window restricted to last 10 exchanges for performance
        if (chatSessions[sessionId].length > 10) {
            chatSessions[sessionId].shift();
        }

        res.json({
            reply,
            intent,
            sessionId,
            history: chatSessions[sessionId]
        });

    } catch (error) {
        console.error("Chatbot Lab Server Error:", error);
        res.status(500).json({ error: "Cognitive Chatbot Service temporarily unavailable." });
    }
});

// Server check
app.get('/', (req, res) => {
    res.send("Chatbot Lab Backend running smoothly on port 5050.");
});

app.listen(PORT, () => {
    console.log(`🤖 Chatbot Lab Backend listening on http://localhost:${PORT}`);
});
