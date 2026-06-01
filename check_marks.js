import pool from './backend/config/db.js';

async function checkMarks() {
    try {
        const [marks] = await pool.query('SELECT * FROM exam_marks');
        console.log('Exam Marks Count:', marks.length);
        if (marks.length > 0) {
            console.log('Sample Mark:', marks[0]);
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkMarks();
