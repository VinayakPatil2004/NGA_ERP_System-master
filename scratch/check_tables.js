import db from '../config/db.js';

async function check() {
    try {
        const [tables] = await db.query('SHOW TABLES');
        console.log(JSON.stringify(tables));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
check();
