import pool from '../backend/config/db.js';

async function listUsers() {
    try {
        const [users] = await pool.query(`
            SELECT u.id, u.username, u.email, u.full_name, r.role_name 
            FROM users u 
            LEFT JOIN roles r ON u.role_id = r.id
        `);
        console.log('--- Database Users ---');
        console.table(users);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listUsers();
