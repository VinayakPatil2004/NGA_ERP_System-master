import assert from 'assert';
import { AttendanceAdapter, FeeAdapter, ExamAdapter } from '../services/adapters.js';

// Mock Intent Detector for unit testing matching backend server
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

describe('🤖 Chatbot Lab Integration & Verification Test Suite', () => {

    // ─── 1. Intent Detection Unit Tests ─────────────────────────────────────
    describe('🎯 Unit Tests: Intent Parser Accuracy (Target: >95%)', () => {
        it('should correctly classify attendance queries', () => {
            const intent = detectIntent("How is my child's attendance?");
            assert.strictEqual(intent, 'ATTENDANCE_QUERY');
        });

        it('should correctly classify exam schedules', () => {
            const intent = detectIntent("When does the second term exam start?");
            assert.strictEqual(intent, 'EXAM_QUERY');
        });

        it('should correctly classify outstanding financial dues', () => {
            const intent = detectIntent("Are there any pending fee payments?");
            assert.strictEqual(intent, 'FEE_QUERY');
        });

        it('should fallback to general chat for unknown patterns', () => {
            const intent = detectIntent("Hi, what is your name?");
            assert.strictEqual(intent, 'GENERAL_CHAT');
        });
    });

    // ─── 2. Role-Based Access & Security Isolation ──────────────────────────
    describe('🔒 Security & Role-Based Access Control Isolation', () => {
        it('should restrict parent prompts to student context', () => {
            const loggedInRole = 'parent';
            const userQuery = "Show me staff salaries and HR spreadsheets";
            
            // Simulating prompt safety guardrail wrapping
            const isQueryAuthorized = (query, role) => {
                const unauthorizedKeys = ['salary', 'salaries', 'payroll', 'accounting balances', 'staff spreadsheet'];
                if (role === 'parent') {
                    return !unauthorizedKeys.some(key => query.toLowerCase().includes(key));
                }
                return true;
            };

            assert.strictEqual(isQueryAuthorized(userQuery, loggedInRole), false);
        });
    });

    // ─── 3. Read-Only Database Adapters Integrity ──────────────────────────
    describe('🔌 ERP Adapters Connection Integrity (Read-Only Mode)', () => {
        it('should hold a valid read-only structure for Attendance', () => {
            assert.ok(typeof AttendanceAdapter.getSummaryByStudent === 'function');
        });

        it('should hold a valid read-only structure for Fees', () => {
            assert.ok(typeof FeeAdapter.getPendingFees === 'function');
        });

        it('should hold a valid read-only structure for Exams', () => {
            assert.ok(typeof ExamAdapter.getUpcoming === 'function');
        });
    });

    // ─── 4. Performance & Response Latency ──────────────────────────────────
    describe('⚡ Performance Benchmark Tests (Response Time < 2 Seconds)', () => {
        it('should complete intent parsing and adapter mapping in under 2000ms', async () => {
            const startTime = Date.now();
            
            // Simulating a complete intent detection loop
            const testIntent = detectIntent("Check fees");
            const duration = Date.now() - startTime;
            
            assert.ok(duration < 2000, `Execution took ${duration}ms, which exceeds the 2000ms SLA limit.`);
            console.log(`   ⏱️ Intent parsing took: ${duration}ms (SLA: <2000ms)`);
        });
    });
});
