import pool from '../backend/config/db.js';

async function diagnose() {
    console.log("🔍 [Chatbot Lab] Scanning existing database credentials...");
    try {
        // Query parents
        const [parents] = await pool.query("SELECT id, username, father_name, email FROM parents LIMIT 5");
        console.log("\n👪 [PARENTS] (First 5 records):");
        if (parents.length === 0) {
            console.log("No parent records found.");
        } else {
            parents.forEach(p => {
                console.log(`- Username: "${p.username}" | Father Name: "${p.father_name}" | Email: "${p.email}"`);
            });
        }

        // Query admins/users
        const [users] = await pool.query("SELECT id, email, username FROM users LIMIT 5");
        console.log("\n🛡️ [ADMINS/USERS] (First 5 records):");
        if (users.length === 0) {
            console.log("No user records found.");
        } else {
            users.forEach(u => {
                console.log(`- Username: "${u.username}" | Email: "${u.email}"`);
            });
        }

        process.exit(0);
    } catch (err) {
        console.error("❌ Diagnostic error:", err.message);
        process.exit(1);
    }
}

diagnose();
