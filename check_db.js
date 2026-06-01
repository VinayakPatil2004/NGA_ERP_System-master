import pool from './backend/config/db.js';

async function checkExams() {
    try {
        const [exams] = await pool.query('SELECT * FROM exams');
        console.log('Exams:', exams);

        const [settings] = await pool.query('SELECT * FROM exam_settings');
        console.log('Exam Settings:', settings);
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkExams();
