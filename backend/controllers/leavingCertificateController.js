import db from '../config/db.js';

// ✅ Student requests Leaving Certificate
export const requestLC = async (req, res) => {
    try {
        const { student_id, reason } = req.body;

        // =========================
        // VALIDATION
        // =========================
        if (!student_id) {
            return res.status(400).json({
                error: "student_id is required"
            });
        }

        // =========================
        // CHECK STUDENT EXISTS
        // =========================
        const [student] = await db.query(
            `SELECT id FROM students WHERE id = ?`,
            [student_id]
        );

        if (!student.length) {
            return res.status(404).json({
                error: "Student not found"
            });
        }

        // =========================
        // INSERT REQUEST
        // =========================
        const [result] = await db.query(`
            INSERT INTO leaving_certificate_requests (student_id, reason, status)
            VALUES (?, ?, 'pending_teacher')
        `, [student_id, reason || null]);

        res.status(201).json({
            message: "LC request submitted and sent for teacher verification",
            request_id: result.insertId
        });

    } catch (err) {
        console.error("❌ LC REQUEST ERROR:", err);
        res.status(500).json({ error: err.message });
    }
};

// ✅ Get All LC Requests
export const getAllLCRequests = async (req, res) => {
    try {
        const [requests] = await db.query(`
            SELECT 
                lc.*, 
                s.first_name, 
                s.last_name, 
                s.middle_name,
                s.current_grade,
                s.student_id_no,
                p.father_name
            FROM leaving_certificate_requests lc
            JOIN students s ON s.id = lc.student_id
            LEFT JOIN parents p ON p.student_id = s.id
            ORDER BY lc.created_at DESC
        `);
        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ✅ Get My LC Requests
export const getMyLCRequests = async (req, res) => {
    try {
        const { student_id } = req.query;
        const userId = req.user.id;

        let query = `
            SELECT lc.*, s.first_name, s.last_name, s.middle_name, s.student_id_no, p.father_name
            FROM leaving_certificate_requests lc
            JOIN students s ON s.id = lc.student_id
            LEFT JOIN parents p ON p.student_id = s.id
        `;
        let params = [];

        if (req.user.role === 'student') {
            query += ` WHERE s.id = ?`;
            params.push(userId);
        } else if (req.user.role === 'parent' && student_id) {
            query += ` WHERE lc.student_id = ?`;
            params.push(student_id);
        } else {
            return res.status(403).json({ error: "Unauthorized or missing student_id" });
        }

        const [requests] = await db.query(query, params);
        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ✅ Teacher Approval for LC
export const teacherApproveLC = async (req, res) => {
    try {
        const { id } = req.params;

        const [request] = await db.query(`SELECT status FROM leaving_certificate_requests WHERE id = ?`, [id]);
        if (!request.length) return res.status(404).json({ error: "Request not found" });

        if (request[0].status !== 'pending_teacher') {
            return res.status(400).json({ error: `Cannot approve. Current status: ${request[0].status}` });
        }

        await db.query(`
            UPDATE leaving_certificate_requests
            SET status = 'approved_teacher', teacher_approved_by = ?
            WHERE id = ?
        `, [req.user.id, id]);

        res.json({ message: "Verified by teacher" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ✅ Principal Approval for LC
export const adminApproveLC = async (req, res) => {
    try {
        const { id } = req.params;

        const [request] = await db.query(`SELECT status FROM leaving_certificate_requests WHERE id = ?`, [id]);
        if (!request.length) return res.status(404).json({ error: "Request not found" });

        if (request[0].status !== 'approved_teacher') {
            return res.status(400).json({ error: `Cannot approve. Current status: ${request[0].status}` });
        }

        await db.query(`
            UPDATE leaving_certificate_requests
            SET status = 'approved_admin', admin_approved_by = ?
            WHERE id = ?
        `, [req.user.id, id]);

        res.json({ message: "Approved by admin" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
// ✅ Principal Approval for LC
export const principalApproveLC = async (req, res) => {
    try {
        const { id } = req.params;

        const [request] = await db.query(`SELECT status FROM leaving_certificate_requests WHERE id = ?`, [id]);
        if (!request.length) return res.status(404).json({ error: "Request not found" });

        if (request[0].status !== 'approved_admin') {
            return res.status(400).json({ error: `Cannot approve. Current status: ${request[0].status}` });
        }

        await db.query(`
            UPDATE leaving_certificate_requests
            SET status = 'approved_principal', principal_approved_by = ?
            WHERE id = ?
        `, [req.user.id, id]);

        res.json({ message: "Final approval by principal completed" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

import PDFDocument from 'pdfkit';

// ✅ Generate Leaving Certificate
export const generateLC = async (req, res) => {
    try {
        const { id } = req.params;

        const [data] = await db.query(`
            SELECT lc.*, s.*
            FROM leaving_certificate_requests lc
            JOIN students s ON s.id = lc.student_id
            WHERE lc.id = ?
        `, [id]);

        if (!data.length) {
            return res.status(404).json({ error: "Request not found" });
        }

        const s = data[0];

        if (s.status !== 'approved_principal') {
            return res.status(400).json({
                error: "LC not fully approved by Principal"
            });
        }

        const doc = new PDFDocument({ size: 'A4', margin: 40 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=LC-${s.student_id_no}.pdf`
        );

        doc.pipe(res);

        // =========================
        // BORDER
        // =========================
        doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke();

        // =========================
        // HEADER
        // =========================
        doc.fontSize(16).font('Helvetica-Bold')
            .text('NEW GRACE ACADEMY', { align: 'center' });

        doc.fontSize(10)
            .text('English Medium School & Jr. College', { align: 'center' });

        doc.moveDown(1);

        // =========================
        // TOP INFO
        // =========================
        doc.fontSize(9);
        doc.text(`UDISE No: 27201600220`, 40);
        doc.text(`LC No: ${id}`, 250, doc.y - 12);
        doc.text(`Student ID: ${s.student_id_no}`, 400, doc.y - 12);

        doc.moveDown(1);

        // =========================
        // TITLE
        // =========================
        doc.fontSize(14).font('Helvetica-Bold')
            .text('SCHOOL LEAVING CERTIFICATE', { align: 'center' });

        doc.moveDown(1.5);

        // =========================
        // HELPER FUNCTION
        // =========================
        const field = (label, value) => {
            doc.fontSize(10).font('Helvetica')
                .text(`${label} : ${value || '__________'}`);
            doc.moveDown(0.6);
        };

        // =========================
        // FIELDS (MATCHING FORM)
        // =========================
        field('1) Name of Pupil', `${s.first_name} ${s.last_name}`);
        field('2) Caste & Sub Caste', `${s.caste || '-'}`);
        field('3) Nationality', 'Indian');
        field('4) Mother Tongue', s.mother_tongue);
        field('5) Mother Name', s.mother_name);

        field('6) Place of Birth', s.pob);
        field('   Taluka', s.taluka);
        field('   District', s.district);

        field('7) Date of Birth', new Date(s.dob).toLocaleDateString('en-GB'));

        field('8) Last School Attended', '-');
        field('9) Date of Admission', s.enrollment_date);

        field('10) Progress', 'Good');
        field('11) Conduct', 'Good');

        field('12) Date of Leaving', new Date().toLocaleDateString('en-GB'));

        field('13) Class Studying', s.current_grade);

        field('14) Reason of Leaving', s.reason || 'As requested');

        field('15) Remarks', '-');
        field('16) Fee Remark', '-');

        doc.moveDown(2);

        // =========================
        // FOOTER
        // =========================
        doc.text(
            'Certified that the above information is in accordance with the school register.',
            { align: 'center' }
        );

        doc.moveDown(2);

        doc.text('Date: ___________', 40);
        doc.text('Class Teacher', 200);
        doc.text('Head Master / Principal', 380);

        doc.end();

    } catch (err) {
        console.error("❌ LC PDF ERROR:", err);
        res.status(500).json({ error: err.message });
    }
};