import pool from '../backend/config/db.js';
import bcrypt from 'bcrypt';

async function createHRUser() {
    try {
        const [roles] = await pool.query("SELECT id, role_name FROM roles");
        console.log('Roles:', roles);
        
        let hrRole = roles.find(r => r.role_name.toLowerCase() === 'hr');
        if (!hrRole) {
            console.log('HR role not found, inserting it...');
            await pool.query("INSERT INTO roles (role_name) VALUES ('HR')");
            const [newRoles] = await pool.query("SELECT id, role_name FROM roles");
            hrRole = newRoles.find(r => r.role_name.toLowerCase() === 'hr');
        }
        
        console.log('HR Role ID:', hrRole.id);
        
        const [existing] = await pool.query("SELECT * FROM users WHERE username = 'hr'");
        if (existing.length === 0) {
            console.log('Creating HR user...');
            const hash = await bcrypt.hash('admin123', 10);
            await pool.query(
                "INSERT INTO users (username, password, role_id, email, full_name) VALUES (?, ?, ?, ?, ?)",
                ['hr', hash, hrRole.id, 'hr@graceerp.com', 'Grace HR Manager']
            );
            console.log('HR User created successfully: hr / admin123');
        } else {
            console.log('HR user already exists.');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

createHRUser();
