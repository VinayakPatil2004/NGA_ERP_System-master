import pool from './db.js';
import bcrypt from 'bcrypt';

const queries = [
    `CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        role_name VARCHAR(50) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role_id INT,
        email VARCHAR(100) UNIQUE,
        full_name VARCHAR(255),
        reset_token VARCHAR(255),
        reset_token_expires DATETIME,
        is_blocked TINYINT(1) DEFAULT 0,
        password_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        device_id VARCHAR(255),
        device_bound_at DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
    )`,

    `CREATE TABLE IF NOT EXISTS students (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        student_id_no VARCHAR(50) UNIQUE, -- e.g., NGASTUD000001
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        middle_name VARCHAR(255),
        dob DATE NOT NULL,
        pob VARCHAR(255),
        aadhar_no VARCHAR(12) UNIQUE NOT NULL,
        religion VARCHAR(50),
        caste VARCHAR(50),
        subcaste VARCHAR(50),
        mother_tongue VARCHAR(50),
        residential_address TEXT,
        pincode VARCHAR(10),
        taluka VARCHAR(50),
        district VARCHAR(50),
        state VARCHAR(50),
        academic_year_id INT, -- Refers to academic_years table
        current_grade VARCHAR(20),
        gender ENUM('male', 'female', 'other'),
        status ENUM('active', 'inactive', 'alumni') DEFAULT 'active',
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS parents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        user_id INT,
        father_name VARCHAR(255),
        father_mobile VARCHAR(15),
        father_email VARCHAR(100),
        father_occupation VARCHAR(100),
        mother_name VARCHAR(255),
        mother_mobile VARCHAR(15),
        mother_occupation VARCHAR(100),
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS admission_applications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        application_no VARCHAR(30) UNIQUE, -- Auto-generated
        
        -- Student Info
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        middle_name VARCHAR(100),
        gender ENUM('male', 'female', 'other'),
        grade VARCHAR(20),
        dob DATE,
        pob VARCHAR(100),
        aadhar VARCHAR(12),
        religion VARCHAR(50),
        caste VARCHAR(20),
        subcaste VARCHAR(50),
        address TEXT,
        pincode VARCHAR(10),

        -- Parent Info
        father_name VARCHAR(100),
        father_mobile VARCHAR(10),
        father_email VARCHAR(100),
        father_occupation VARCHAR(100),
        mother_name VARCHAR(100),
        mother_mobile VARCHAR(10),
        mother_occupation VARCHAR(100),
        mother_tongue VARCHAR(50),

        -- Location
        taluka VARCHAR(50),
        district VARCHAR(50),
        state VARCHAR(50),

        -- Academic
        prev_school VARCHAR(150),
        prev_class VARCHAR(20),
        prev_board VARCHAR(50),
        prev_year VARCHAR(10),
        prev_percentage VARCHAR(10),

        -- Payment
        paid_amount DECIMAL(10,2),
        total_amount DECIMAL(10,2),
        pending_amount DECIMAL(10,2),
        payment_method VARCHAR(20),

        -- Document Columns (As requested earlier)
        doc_passport_photo VARCHAR(255),
        doc_birth_cert VARCHAR(255),
        doc_leaving_cert VARCHAR(255),
        doc_caste_cert VARCHAR(255),
        doc_aadhar_copy VARCHAR(255),
        academic_year_id INT, -- Refers to academic_years table
        is_transport_required BOOLEAN DEFAULT FALSE,
        transport_route VARCHAR(255),
        transport_fees DECIMAL(10,2) DEFAULT 0,
        internal_notes TEXT,
        status ENUM('pending','verified','approved','paid','enrolled','rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        admission_id INT,
        total_payable DECIMAL(10, 2),
        paid_amount DECIMAL(10, 2),
        pending_amount DECIMAL(10, 2),
        amount DECIMAL(10, 2),
        fee_type VARCHAR(50),
        payment_method VARCHAR(50), 
        payment_date DATE,
        status ENUM('paid', 'pending', 'failed') DEFAULT 'paid',
        transaction_id VARCHAR(100) UNIQUE,
        receipt_no VARCHAR(100) UNIQUE,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS staff (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT UNIQUE,
        employee_id VARCHAR(50) UNIQUE,
        full_name VARCHAR(255) NOT NULL,
        staff_type ENUM('teaching', 'non-teaching') NOT NULL,
        role_id INT,
        designation VARCHAR(100),
        department VARCHAR(100),
        qualification VARCHAR(255),
        experience VARCHAR(100),
        dob DATE,
        gender ENUM('male', 'female', 'other'),
        mobile VARCHAR(15),
        email VARCHAR(100),
        address TEXT,
        joining_date DATE,
        salary DECIMAL(10, 2),
        subjects TEXT, -- Comma separated subjects for teachers
        
        -- Documents
        doc_photo VARCHAR(255),
        doc_aadhar VARCHAR(255),
        doc_qual_certs VARCHAR(255),
        doc_exp_letter VARCHAR(255),
        
        device_id VARCHAR(255),
        device_bound_at DATETIME,
        
        status ENUM('active', 'inactive') DEFAULT 'active',
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS classrooms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        class_name VARCHAR(50) NOT NULL,
        section VARCHAR(10),
        grade_level INT,
        capacity INT DEFAULT 40,
        room_number VARCHAR(50),
        class_code VARCHAR(50),
        floor VARCHAR(50),
        description TEXT,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS classroom_mentorship (
        id INT AUTO_INCREMENT PRIMARY KEY,
        classroom_id INT NOT NULL,
        academic_year_id INT NOT NULL,
        teacher_id INT,
        FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE,
        FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
        FOREIGN KEY (teacher_id) REFERENCES staff(id) ON DELETE SET NULL,
        UNIQUE KEY unique_mentorship (classroom_id, academic_year_id)
    )`,

    `CREATE TABLE IF NOT EXISTS class_subjects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        classroom_id INT NOT NULL,
        academic_year_id INT NOT NULL,
        subject_name VARCHAR(100) NOT NULL,
        teacher_id INT,
        start_time TIME,
        end_time TIME,
        FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE,
        FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
        FOREIGN KEY (teacher_id) REFERENCES staff(id) ON DELETE SET NULL
    )`,

    `CREATE TABLE IF NOT EXISTS class_assignments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        staff_id INT NOT NULL,
        grade VARCHAR(20) NOT NULL,
        subjects TEXT,
        academic_year VARCHAR(20) NOT NULL,
        FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
        UNIQUE KEY unique_assignment (grade, academic_year)
    )`,

    `CREATE TABLE IF NOT EXISTS academic_years (
        id INT AUTO_INCREMENT PRIMARY KEY,
        year_name VARCHAR(20) UNIQUE NOT NULL, -- e.g. 2025-26
        is_active TINYINT(1) DEFAULT 0,
        is_locked TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS student_enrollments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        classroom_id INT,
        roll_number VARCHAR(20),
        grade VARCHAR(20) NOT NULL,
        academic_year_id INT NOT NULL,
        status ENUM('active', 'promoted', 'failed', 'dropped') DEFAULT 'active',
        requires_transport TINYINT(1) DEFAULT 0,
        transport_range VARCHAR(50) DEFAULT NULL,
        pickup_point VARCHAR(255) DEFAULT NULL,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE SET NULL,
        FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
        UNIQUE KEY unique_enrollment (student_id, academic_year_id)
    )`,

    `CREATE TABLE IF NOT EXISTS academic_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        academic_year_id INT NOT NULL,
        grade VARCHAR(20) NOT NULL,
        marks_obtained DECIMAL(10, 2),
        total_marks DECIMAL(10, 2),
        percentage DECIMAL(5, 2),
        result ENUM('pass', 'fail', 'promoted'),
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS student_attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        classroom_id INT NOT NULL,
        marked_by INT, -- Link to staff/admin who marked it
        status ENUM('present', 'absent', 'late', 'half-day') DEFAULT 'present',
        remarks TEXT,
        date DATE NOT NULL,
        is_locked TINYINT(1) DEFAULT 0,
        academic_year_id INT,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE,
        UNIQUE KEY unique_attendance (student_id, date)
    )`,

    `CREATE TABLE IF NOT EXISTS staff_attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        staff_id INT NOT NULL,
        status ENUM('present', 'absent', 'late', 'half-day') DEFAULT 'present',
        remarks TEXT,
        date DATE NOT NULL,
        check_in_time VARCHAR(10),
        check_out_time VARCHAR(10),
        working_hours DECIMAL(5, 2),
        is_locked TINYINT(1) DEFAULT 0,
        FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
        UNIQUE KEY unique_staff_attendance (staff_id, date)
    )`,

    `CREATE TABLE IF NOT EXISTS exams (
        id INT AUTO_INCREMENT PRIMARY KEY,
        exam_name VARCHAR(100) NOT NULL,
        academic_year_id INT NOT NULL,
        term VARCHAR(50), -- e.g. Term 1, Mid-term, Final
        status ENUM('scheduled', 'ongoing', 'completed', 'cancelled') DEFAULT 'scheduled',
        FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS exam_results (
        id INT AUTO_INCREMENT PRIMARY KEY,
        exam_id INT NOT NULL,
        student_id INT NOT NULL,
        subject_name VARCHAR(100) NOT NULL,
        marks_obtained DECIMAL(10, 2),
        total_marks DECIMAL(10, 2),
        grade VARCHAR(10),
        remarks TEXT,
        FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS fee_structure (
        id INT AUTO_INCREMENT PRIMARY KEY,
        academic_year_id INT NOT NULL,
        grade VARCHAR(20) NOT NULL,
        fee_type VARCHAR(100) NOT NULL, -- Admission, Tuition, Transport, Exam, etc.
        amount DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS student_fees (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        academic_year_id INT NOT NULL,
        fee_type VARCHAR(100) NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        paid_amount DECIMAL(10, 2) DEFAULT 0,
        due_date DATE,
        status ENUM('pending', 'partially_paid', 'paid', 'overdue') DEFAULT 'pending',
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS alumni (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT,
        student_name VARCHAR(255) NOT NULL,
        gender VARCHAR(20),
        dob DATE,
        father_name VARCHAR(255),
        mother_name VARCHAR(255),
        leaving_date DATE,
        exit_reason TEXT,
        final_grade VARCHAR(50),
        final_academic_year VARCHAR(50),
        gr_no VARCHAR(100),
        pen_no VARCHAR(100),
        admitted_grade VARCHAR(50),
        admission_date DATE,
        last_address TEXT,
        last_mobile VARCHAR(20),
        doc_leaving_cert VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS certificate_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        reason TEXT,
        status ENUM('pending_teacher', 'approved_teacher', 'approved_admin', 'approved_principal') DEFAULT 'pending_teacher',
        teacher_approved_by INT,
        admin_approved_by INT,
        principal_approved_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS leaving_certificate_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        reason TEXT,
        status ENUM('pending_teacher', 'approved_teacher', 'approved_admin', 'approved_principal') DEFAULT 'pending_teacher',
        teacher_approved_by INT,
        admin_approved_by INT,
        principal_approved_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS communications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sender_id INT,
        sender_type VARCHAR(50),
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        attachment_url VARCHAR(255),
        priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
        category VARCHAR(50) DEFAULT 'message',
        target_group ENUM('individual', 'staff', 'student', 'parent', 'class', 'all') NOT NULL,
        target_id VARCHAR(50),
        academic_year_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE SET NULL
    )`,

    `CREATE TABLE IF NOT EXISTS communication_recipients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        communication_id INT NOT NULL,
        recipient_id INT NOT NULL,
        recipient_type VARCHAR(50) NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        read_at TIMESTAMP NULL,
        FOREIGN KEY (communication_id) REFERENCES communications(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS announcements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        target_audience VARCHAR(50) DEFAULT 'all',
        sender_id INT,
        sender_type VARCHAR(50) DEFAULT 'admin',
        sender_name VARCHAR(100),
        academic_year_id INT,
        teacher_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE SET NULL,
        FOREIGN KEY (teacher_id) REFERENCES staff(id) ON DELETE SET NULL
    )`,

    `CREATE TABLE IF NOT EXISTS circulars (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        file_url VARCHAR(255) NOT NULL,
        target_audience VARCHAR(50) DEFAULT 'all',
        uploaded_by INT,
        academic_year_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE SET NULL
    )`,

    `CREATE TABLE IF NOT EXISTS communication_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        communication_id INT,
        channel ENUM('email', 'sms') NOT NULL,
        recipient_email VARCHAR(100),
        recipient_mobile VARCHAR(20),
        status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
        error_message TEXT,
        sent_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (communication_id) REFERENCES communications(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS notices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        target_role ENUM('all', 'teacher', 'admin', 'staff') DEFAULT 'all',
        academic_year_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE SET NULL
    )`,

    `CREATE TABLE IF NOT EXISTS assignments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        teacher_id INT NOT NULL,
        classroom_id INT NOT NULL,
        academic_year_id INT,
        subject_name VARCHAR(100),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        due_date DATETIME,
        points INT DEFAULT 100,
        file_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (teacher_id) REFERENCES staff(id) ON DELETE CASCADE,
        FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE,
        FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE SET NULL
    )`,

    `CREATE TABLE IF NOT EXISTS submissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        assignment_id INT NOT NULL,
        student_id INT NOT NULL,
        submission_text TEXT,
        file_url VARCHAR(255),
        academic_year_id INT,
        status ENUM('pending', 'submitted', 'graded', 'overdue') DEFAULT 'submitted',
        grade VARCHAR(20),
        feedback TEXT,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE SET NULL
    )`,

    `CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        punch_in_start TIME,
        punch_in_end TIME,
        punch_out_start TIME,
        punch_out_end TIME,
        office_latitude DECIMAL(10, 8),
        office_longitude DECIMAL(11, 8),
        office_radius INT DEFAULT 100,
        allowed_ip VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS attendances (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        user_type ENUM('staff', 'teacher', 'admin') NOT NULL,
        device_type VARCHAR(50),
        date DATE NOT NULL,
        punch_in_time DATETIME,
        punch_out_time DATETIME,
        punch_in_lat DECIMAL(10, 8),
        punch_in_lng DECIMAL(11, 8),
        punch_out_lat DECIMAL(10, 8),
        punch_out_lng DECIMAL(11, 8),
        punch_in_method ENUM('wifi', 'gps'),
        punch_out_method ENUM('wifi', 'gps'),
        lunch_start_time DATETIME,
        lunch_end_time DATETIME,
        tea_start_time DATETIME,
        tea_end_time DATETIME,
        is_late BOOLEAN DEFAULT FALSE,
        late_minutes INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_date (user_id, user_type, date)
    )`,

    `CREATE TABLE IF NOT EXISTS subjects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        subject_name VARCHAR(100) UNIQUE NOT NULL,
        category VARCHAR(50) DEFAULT 'Scholastic',
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS calendar_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        academic_year_id INT,
        event_type ENUM('academic', 'activity', 'holiday') NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        event_date DATE NOT NULL,
        subject VARCHAR(100),
        remarks VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE SET NULL
    )`
];

const initDB = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Starting Database Initialization (Integrated User Schema)...');
        
        for (const query of queries) {
            await connection.query(query);
        }

        // Seed Academic Years if empty
        const [years] = await connection.query('SELECT COUNT(*) as count FROM academic_years');
        if (years[0].count === 0) {
            console.log('Seeding academic years...');
            const seedYears = [
                ['2024-25', 0],
                ['2025-26', 0],
                ['2026-27', 1] // Set 2026-27 as active by default
            ];
            for (const [name, active] of seedYears) {
                await connection.query('INSERT INTO academic_years (year_name, is_active) VALUES (?, ?)', [name, active]);
            }
        }

        // Seed Default Roles if empty
        const [rolesCount] = await connection.query('SELECT COUNT(*) as count FROM roles');
        if (rolesCount[0].count === 0) {
            console.log('Seeding default roles...');
            const defaultRoles = ['admin', 'principal', 'teacher', 'student', 'parent', 'librarian', 'accountant', 'HR'];
            for (const role of defaultRoles) {
                await connection.query('INSERT IGNORE INTO roles (role_name) VALUES (?)', [role]);
            }
        }

        // Seed Default Admin if empty
        const [admin] = await connection.query(`
            SELECT COUNT(*) as count FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE r.role_name = 'admin'
        `);
        
        if (admin[0].count === 0) {
            console.log('Seeding default admin...');
            const [roleData] = await connection.query("SELECT id FROM roles WHERE role_name = 'admin'");
            const adminRoleId = roleData[0]?.id;

            if (adminRoleId) {
                const hashedPassword = await bcrypt.hash('admin123', 10);
                await connection.query(
                    `INSERT INTO users (username, password, role_id, email, full_name) VALUES (?, ?, ?, ?, ?)`,
                    ['admin', hashedPassword, adminRoleId, 'admin@graceerp.com', 'Grace ERP Administrator']
                );
                console.log('Default administrator created: admin / admin123');
            }
        }

        // Seed Subjects if empty
        const [subjectsCount] = await connection.query('SELECT COUNT(*) as count FROM subjects');
        if (subjectsCount[0].count >= 0) { // Changed to >= 0 to allow refreshing the list
            console.log('Seeding institutional subjects...');
            // Clear existing to ensure only these are shown
            await connection.query('DELETE FROM subjects');
            
            const institutionalSubjects = [
                "ENGLISH", "HINDI", "MARATHI", "MATHEMATICS", "SCIENCE", "SOCIAL STUDIES", 
                "COMPUTER APPLICATION", "WORK EDUCATION", "ART EDUCATION", "PHYSICAL EDUCATION", 
                "SCIENTIFIC SKILLS", "YOGA / NCC", "DRAWING", "COLORING", "RHYMES", "PHONICS", 
                "ART & CRAFT", "SPORTS", "MUSIC", "DANCE", "PERSONALITY CHARACTER",
                "English Language and Literature (184)", "English Communicative (101)", 
                "Hindi (Course A/B)", "Sanskrit", "Tamil", "French", "German", 
                "Mathematics Standard (041)", "Mathematics Basic (241)", "Science (086)", 
                "Social Science (087)", "Computer Applications (165)", "Information Technology (402)", 
                "Artificial Intelligence (417)", "Home Science (064)", "NCC (076)", "Painting (049)"
            ];
            for (const sub of institutionalSubjects) {
                await connection.query('INSERT IGNORE INTO subjects (subject_name) VALUES (?)', [sub]);
            }
        }
        
        console.log('All tables created/verified successfully.');

        // 🔥 MIGRATION BLOCK: Fix missing academic_year_id in existing announcements/notices
        console.log('Running schema compliance checks...');
        const migrationQueries = [
            "IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='announcements' AND COLUMN_NAME='academic_year_id') THEN ALTER TABLE announcements ADD COLUMN academic_year_id INT; END IF;",
            "IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='notices' AND COLUMN_NAME='academic_year_id') THEN ALTER TABLE notices ADD COLUMN academic_year_id INT; END IF;"
        ];
        
        // Note: Simple way to add column if missing without complex procedurals for now
        try {
            await connection.query("ALTER TABLE announcements ADD COLUMN IF NOT EXISTS academic_year_id INT");
            await connection.query("ALTER TABLE notices ADD COLUMN IF NOT EXISTS academic_year_id INT");
            await connection.query("ALTER TABLE announcements ADD COLUMN IF NOT EXISTS teacher_id INT");
            await connection.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS device_id VARCHAR(255)");
            await connection.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS device_bound_at DATETIME");
            await connection.query("ALTER TABLE staff ADD COLUMN IF NOT EXISTS device_id VARCHAR(255)");
            await connection.query("ALTER TABLE staff ADD COLUMN IF NOT EXISTS device_bound_at DATETIME");
            
            // Transport session-aware migration for student_enrollments
            await connection.query("ALTER TABLE student_enrollments ADD COLUMN IF NOT EXISTS requires_transport TINYINT(1) DEFAULT 0");
            await connection.query("ALTER TABLE student_enrollments ADD COLUMN IF NOT EXISTS transport_range VARCHAR(50) DEFAULT NULL");
            await connection.query("ALTER TABLE student_enrollments ADD COLUMN IF NOT EXISTS pickup_point VARCHAR(255) DEFAULT NULL");
            
            // Backfill existing records from students to student_enrollments
            await connection.query(`
                UPDATE student_enrollments se
                JOIN students s ON se.student_id = s.id
                SET se.requires_transport = COALESCE(s.requires_transport, 0),
                    se.transport_range = s.transport_range
                WHERE se.requires_transport IS NULL OR (se.requires_transport = 0 AND se.transport_range IS NULL)
            `);
        } catch (mErr) {
            // Silently handle if IF NOT EXISTS isn't supported by MariaDB older versions, though mysql2/mariadb usually do
            // console.warn("Migration warning (safe to ignore if columns already exist):", mErr.message);
        }

        connection.release();
        process.exit(0);
    } catch (error) {
        console.error('Error initializing database:', error.message);
        process.exit(1);
    }
};

initDB();
