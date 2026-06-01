import pool from '../backend/config/db.js';

async function check() {
    try {
        const [rows] = await pool.query('SELECT p.id as parent_id, p.student_id, s.first_name, s.last_name FROM parents p JOIN students s ON p.student_id = s.id LIMIT 5');
        console.log(JSON.stringify(rows));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

check();
