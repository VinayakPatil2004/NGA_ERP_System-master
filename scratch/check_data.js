import db from '../backend/config/db.js';

async function check() {
    try {
        const [cols] = await db.query('DESCRIBE staff');
        console.log('STAFF_COLS_START');
        console.log(JSON.stringify(cols));
        console.log('STAFF_COLS_END');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

check();
