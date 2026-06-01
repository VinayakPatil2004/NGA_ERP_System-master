import pool from './backend/config/db.js';

async function seedDummyMarks() {
    console.log("🚀 Starting Institutional Database Dummy Marks Seeder...");
    try {
        // 1. Fetch academic parameters
        console.log("🔍 Retrieving Institutional configuration details...");
        const [exams] = await pool.query('SELECT * FROM exams');
        const [classrooms] = await pool.query("SELECT * FROM classrooms WHERE status = 'active'");
        const [enrollments] = await pool.query("SELECT se.*, s.first_name, s.last_name FROM student_enrollments se JOIN students s ON se.student_id = s.id");
        const [classSubjects] = await pool.query("SELECT * FROM class_subjects");
        const [gradingRanges] = await pool.query("SELECT * FROM grading_ranges ORDER BY min_percent DESC");

        console.log(`📊 Parameters cataloged:`);
        console.log(`   - Exams: ${exams.length}`);
        console.log(`   - Classrooms: ${classrooms.length}`);
        console.log(`   - Student Enrollments: ${enrollments.length}`);
        console.log(`   - Class Subject Assignments: ${classSubjects.length}`);
        console.log(`   - Grading ranges: ${gradingRanges.length}`);

        if (enrollments.length === 0) {
            console.log("❌ No students enrolled in the institution database. Aborting.");
            process.exit(0);
        }

        // Helper to calculate grade from percentage
        const getGrade = (percentage) => {
            if (gradingRanges.length > 0) {
                const match = gradingRanges.find(g => percentage >= parseFloat(g.min_percent) && percentage <= parseFloat(g.max_percent));
                if (match) return match.grade_name;
            }
            if (percentage >= 90) return 'A1';
            if (percentage >= 80) return 'A2';
            if (percentage >= 70) return 'B1';
            if (percentage >= 60) return 'B2';
            if (percentage >= 50) return 'C1';
            if (percentage >= 45) return 'C2';
            if (percentage >= 35) return 'D';
            return 'E';
        };

        let regularMarksInserted = 0;
        let prePrimaryMarksInserted = 0;

        // Loop over each enrollment
        for (let i = 0; i < enrollments.length; i++) {
            const student = enrollments[i];
            const classroom = classrooms.find(c => c.id === student.classroom_id);
            if (!classroom) continue;

            const className = classroom.class_name.toLowerCase();
            const isPPClass = className.match(/(nursery|junior|senior|kg|jr|sr)/i);

            if (isPPClass) {
                // Seeding Pre-Primary Marks for I Term and II Term
                const ppFields = [
                    'english_reading', 'english_writing', 'english_phonics',
                    'maths_recognition', 'maths_counting', 'maths_writing',
                    'hindi_reading', 'hindi_writing', 'hindi_vocabulary',
                    'art_drawing', 'art_coloring', 'art_activities',
                    'gk', 'sports', 'music', 'dance',
                    'social', 'etiquettes', 'hygiene', 'attention', 'creativity'
                ];
                
                const grades = ['A+', 'A', 'B+', 'B', 'C'];
                const terms = ['I Term', 'II Term'];

                for (const term of terms) {
                    const marksObj = {};
                    ppFields.forEach(field => {
                        // Generate a random high-achieving grade for realism
                        const rand = Math.floor(Math.random() * 100);
                        let gradeIndex = 0; // A+ (Default)
                        if (rand > 85) gradeIndex = 4; // C
                        else if (rand > 70) gradeIndex = 3; // B
                        else if (rand > 50) gradeIndex = 2; // B+
                        else if (rand > 25) gradeIndex = 1; // A
                        
                        marksObj[field] = grades[gradeIndex];
                    });

                    // Attendance fields
                    marksObj.attendance = Math.floor(82 + Math.random() * 13); // 82 to 94 days present
                    marksObj.total_days = 95;
                    marksObj.reopening_date = '06/04/2026';
                    marksObj.reopening_time = '8:00 am';

                    const fieldsList = ['student_id', 'academic_year_id', 'term', ...ppFields, 'attendance', 'total_days', 'reopening_date', 'reopening_time'];
                    const placeholderPlaceholders = fieldsList.map(() => '?').join(', ');
                    const duplicateUpdateList = fieldsList.slice(3).map(f => `${f} = VALUES(${f})`).join(', ');

                    const values = [
                        student.student_id,
                        student.academic_year_id || 3,
                        term,
                        ...ppFields.map(f => marksObj[f]),
                        marksObj.attendance,
                        marksObj.total_days,
                        marksObj.reopening_date,
                        marksObj.reopening_time
                    ];

                    const query = `
                        INSERT INTO pre_primary_marks (${fieldsList.join(', ')})
                        VALUES (${placeholderPlaceholders})
                        ON DUPLICATE KEY UPDATE ${duplicateUpdateList}
                    `;
                    
                    await pool.query(query, values);
                    prePrimaryMarksInserted++;
                }

            } else {
                // Seeding Regular Marks
                // 1. Get subjects for this classroom
                const subjects = classSubjects.filter(cs => cs.classroom_id === student.classroom_id);
                if (subjects.length === 0) continue;

                // 2. Get exams for this student's academic year
                const yearId = student.academic_year_id || 3;
                const yearExams = exams.filter(e => e.academic_year_id === yearId);
                if (yearExams.length === 0) continue;

                for (const exam of yearExams) {
                    // Fetch configured total max marks for the exam components, otherwise default to 100
                    const [settings] = await pool.query('SELECT SUM(max_marks) as total_max FROM exam_settings WHERE exam_id = ?', [exam.id]);
                    const total_max = settings[0]?.total_max ? parseFloat(settings[0].total_max) : 100.00;

                    for (const subject of subjects) {
                        // Generate realistic marks
                        const unit_written = 12 + Math.floor(Math.random() * 8); // 12 to 19 (Max 20)
                        const class_test = 6 + Math.floor(Math.random() * 4); // 6 to 9 (Max 10)
                        const project = 7 + Math.floor(Math.random() * 3); // 7 to 9 (Max 10)
                        const oral = 7 + Math.floor(Math.random() * 3); // 7 to 9 (Max 10)
                        const notebook = 7 + Math.floor(Math.random() * 3); // 7 to 9 (Max 10)
                        const term_written = 24 + Math.floor(Math.random() * 15); // 24 to 38 (Max 40)

                        const total_obtained = unit_written + class_test + project + oral + notebook + term_written;
                        const percentage = (total_obtained / total_max) * 100;
                        const grade = getGrade(percentage);
                        const remarks = percentage >= 80 ? "Outstanding scholastic ability!" : percentage >= 60 ? "Good work, keep improving." : "Needs more attention.";

                        const query = `
                            INSERT INTO exam_marks 
                            (exam_id, student_id, subject_name, unit_written, class_test, project, oral, notebook, term_written, total_obtained, total_max, percentage, grade, remarks, is_draft, academic_year_id)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
                            ON DUPLICATE KEY UPDATE 
                            unit_written=VALUES(unit_written), class_test=VALUES(class_test), project=VALUES(project), 
                            oral=VALUES(oral), notebook=VALUES(notebook), term_written=VALUES(term_written),
                            total_obtained=VALUES(total_obtained), total_max=VALUES(total_max), 
                            percentage=VALUES(percentage), grade=VALUES(grade), remarks=VALUES(remarks), is_draft=VALUES(is_draft),
                            academic_year_id=VALUES(academic_year_id)
                        `;

                        await pool.query(query, [
                            exam.id,
                            student.student_id,
                            subject.subject_name.toUpperCase(),
                            unit_written,
                            class_test,
                            project,
                            oral,
                            notebook,
                            term_written,
                            total_obtained,
                            total_max,
                            percentage,
                            grade,
                            remarks,
                            yearId
                        ]);
                        regularMarksInserted++;
                    }
                }
            }
        }

        console.log(`✅ Success! Database seeding completed.`);
        console.log(`   - Regular Subject Exam Marks Created: ${regularMarksInserted}`);
        console.log(`   - Pre-Primary Term Marks Created: ${prePrimaryMarksInserted}`);
        process.exit(0);
    } catch (err) {
        console.error("❌ Database seeding encountered an error:", err);
        process.exit(1);
    }
}

seedDummyMarks();
