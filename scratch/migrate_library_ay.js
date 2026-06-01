import db from '../backend/config/db.js';

async function migrate() {
    try {
        console.log("Starting migration...");
        
        // Add academic_year_id to library_issues
        await db.query(`
            ALTER TABLE library_issues 
            ADD COLUMN IF NOT EXISTS academic_year_id INT,
            ADD CONSTRAINT fk_library_issues_ay FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE SET NULL
        `);
        console.log("Added academic_year_id to library_issues");

        // Add academic_year_id to library_fines
        await db.query(`
            ALTER TABLE library_fines 
            ADD COLUMN IF NOT EXISTS academic_year_id INT,
            ADD CONSTRAINT fk_library_fines_ay FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE SET NULL
        `);
        console.log("Added academic_year_id to library_fines");

        // Populate existing records with the active academic year if possible
        const [activeYear] = await db.query('SELECT id FROM academic_years WHERE is_active = 1 LIMIT 1');
        if (activeYear.length > 0) {
            const yearId = activeYear[0].id;
            await db.query('UPDATE library_issues SET academic_year_id = ? WHERE academic_year_id IS NULL', [yearId]);
            await db.query('UPDATE library_fines SET academic_year_id = ? WHERE academic_year_id IS NULL', [yearId]);
            console.log(`Populated existing records with active year ID: ${yearId}`);
        }

        console.log("Migration completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

migrate();
