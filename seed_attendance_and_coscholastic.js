import pool from './backend/config/db.js';

async function seedAttendanceAndCoScholastic() {
    console.log("🚀 Starting Institutional Attendance & Co-Scholastic Database Seeder...");
    try {
        // 1. Fetch configurations
        console.log("🔍 Fetching configurations and roster details...");
        const [enrollments] = await pool.query("SELECT se.* FROM student_enrollments se JOIN students s ON se.student_id = s.id");
        const [staffMembers] = await pool.query("SELECT * FROM staff WHERE status = 'active'");
        
        console.log(`📊 Parameters cataloged:`);
        console.log(`   - Enrolled Students: ${enrollments.length}`);
        console.log(`   - Active Staff Members: ${staffMembers.length}`);

        if (enrollments.length === 0) {
            console.log("❌ No students enrolled in database. Aborting.");
            process.exit(0);
        }

        // --- PART 1: SEED CO-SCHOLASTIC GRADES ---
        console.log("🌟 Seeding Co-Scholastic Grades for all enrolled students...");
        const coScholasticAreas = [
            "Work Education",
            "Art Education",
            "Physical Education",
            "Scientific Skills",
            "Yoga / NCC",
            "Work Education (Skill-based)",
            "Art Education (Visual/Performing)",
            "Health and Physical Education",
            "Discipline"
        ];

        let coScholasticInserted = 0;
        const coScholasticValues = [];

        enrollments.forEach(student => {
            const yearId = student.academic_year_id || 3;
            coScholasticAreas.forEach(area => {
                // Generate realistic grades: A (65%), B (25%), C (10%)
                const r1 = Math.random() * 100;
                const g1 = r1 > 90 ? 'C' : r1 > 65 ? 'B' : 'A';
                
                const r2 = Math.random() * 100;
                const g2 = r2 > 90 ? 'C' : r2 > 65 ? 'B' : 'A';

                coScholasticValues.push([
                    student.student_id,
                    yearId,
                    area,
                    g1,
                    g2,
                    1 // is_draft = 1
                ]);
            });
        });

        if (coScholasticValues.length > 0) {
            // Bulk insert co-scholastic marks in chunks of 500
            const chunkSize = 500;
            for (let i = 0; i < coScholasticValues.length; i += chunkSize) {
                const chunk = coScholasticValues.slice(i, i + chunkSize);
                await pool.query(
                    `INSERT INTO co_scholastic_marks (student_id, academic_year_id, area_name, grade_term1, grade_term2, is_draft)
                     VALUES ?
                     ON DUPLICATE KEY UPDATE 
                     grade_term1 = VALUES(grade_term1), grade_term2 = VALUES(grade_term2), is_draft = VALUES(is_draft)`,
                    [chunk]
                );
                coScholasticInserted += chunk.length;
            }
        }
        console.log(`✅ Co-Scholastic Grades successfully seeded: ${coScholasticInserted} records`);

        // --- PART 2: SEED STUDENT ATTENDANCE LOGS ---
        console.log("📅 Generating Student Daily Attendance Logs...");
        
        // Helper to generate business days (Mon-Fri) in a date range
        const getBusinessDays = (startDateStr, endDateStr) => {
            const dates = [];
            let current = new Date(startDateStr);
            const end = new Date(endDateStr);
            while (current <= end) {
                const day = current.getDay();
                if (day !== 0 && day !== 6) { // Mon-Fri
                    dates.push(current.toISOString().split('T')[0]);
                }
                current.setDate(current.getDate() + 1);
            }
            return dates;
        };

        // Term 1 (June 15, 2025 to Oct 15, 2025) and Term 2 (Nov 5, 2025 to April 15, 2026)
        // Let's sample 30 business days per term to keep DB execution fast and clean
        const term1DaysAll = getBusinessDays('2025-06-15', '2025-10-15');
        const term2DaysAll = getBusinessDays('2025-11-05', '2026-04-15');

        // Sample 30 days from each list to give a realistic aggregate count (e.g. 28/30 present)
        const sampleDays = (arr, count) => {
            const shuffled = [...arr].sort(() => 0.5 - Math.random());
            return shuffled.slice(0, count).sort();
        };

        const t1Sample = sampleDays(term1DaysAll, 30);
        const t2Sample = sampleDays(term2DaysAll, 35);
        const allAttendanceDays = [...t1Sample, ...t2Sample];

        console.log(`   - Generated ${allAttendanceDays.length} total school business days for student logs.`);

        let studentAttendanceInserted = 0;
        const studentAttValues = [];

        enrollments.forEach(student => {
            const yearId = student.academic_year_id || 3;
            allAttendanceDays.forEach(dateStr => {
                // ~93% present, ~7% absent
                const status = Math.random() > 0.07 ? 'present' : 'absent';
                studentAttValues.push([
                    student.student_id,
                    student.classroom_id,
                    1, // marked_by admin/system
                    status,
                    dateStr,
                    yearId,
                    status === 'absent' ? 'Family emergency' : 'Regular day'
                ]);
            });
        });

        if (studentAttValues.length > 0) {
            const chunkSize = 1000;
            for (let i = 0; i < studentAttValues.length; i += chunkSize) {
                const chunk = studentAttValues.slice(i, i + chunkSize);
                await pool.query(
                    `INSERT INTO student_attendance (student_id, classroom_id, marked_by, status, date, academic_year_id, remarks)
                     VALUES ?
                     ON DUPLICATE KEY UPDATE 
                     status = VALUES(status), remarks = VALUES(remarks), marked_by = VALUES(marked_by)`,
                    [chunk]
                );
                studentAttendanceInserted += chunk.length;
            }
        }
        console.log(`✅ Student Attendance logs successfully seeded: ${studentAttendanceInserted} records`);

        // --- PART 3: SEED STAFF ATTENDANCE LOGS ---
        console.log("💼 Generating Staff Daily Attendance Logs...");
        
        // Get last 30 business days up to today (May 27, 2026)
        const staffDates = getBusinessDays('2026-04-10', '2026-05-26').slice(-30);
        
        let staffAttendanceInserted = 0;
        const staffAttValues = [];

        staffMembers.forEach(staff => {
            const yearId = 3; // Academic year id
            staffDates.forEach(dateStr => {
                const rand = Math.random() * 100;
                let status = 'present';
                let checkIn = '08:00:00';
                let checkOut = '16:30:00';
                let hours = '8.5';
                let remarks = 'Punch OK';

                if (rand > 96) {
                    status = 'absent';
                    checkIn = null;
                    checkOut = null;
                    hours = '0';
                    remarks = 'On Leave';
                } else if (rand > 90) {
                    status = 'late';
                    checkIn = '08:45:00';
                    hours = '7.75';
                    remarks = 'Late Arrival';
                }

                staffAttValues.push([
                    staff.id,
                    status,
                    dateStr,
                    remarks,
                    checkIn,
                    checkOut,
                    hours
                ]);
            });
        });

        if (staffAttValues.length > 0) {
            const chunkSize = 500;
            for (let i = 0; i < staffAttValues.length; i += chunkSize) {
                const chunk = staffAttValues.slice(i, i + chunkSize);
                await pool.query(
                    `INSERT INTO staff_attendance (staff_id, status, date, remarks, check_in_time, check_out_time, working_hours)
                     VALUES ?
                     ON DUPLICATE KEY UPDATE 
                     status = VALUES(status), remarks = VALUES(remarks), 
                     check_in_time = VALUES(check_in_time), check_out_time = VALUES(check_out_time), working_hours = VALUES(working_hours)`,
                    [chunk]
                );
                staffAttendanceInserted += chunk.length;
            }
        }
        console.log(`✅ Staff Attendance logs successfully seeded: ${staffAttendanceInserted} records`);

        console.log("🎉 Seeding completed successfully with absolute data integration!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Database seeding encountered an error:", err);
        process.exit(1);
    }
}

seedAttendanceAndCoScholastic();
