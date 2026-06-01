import db from '../config/db.js';
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

// ✅ Student Request Bonafide Certificate
export const requestCertificate = async (req, res) => {
    try {
        const { student_id, reason, cert_type = 'bonafide' } = req.body;

        if (!student_id) {
            return res.status(400).json({ error: "student_id is required" });
        }

        const [student] = await db.query(`SELECT id FROM students WHERE id = ?`, [student_id]);
        if (!student.length) {
            return res.status(404).json({ error: "Student not found" });
        }

        const [result] = await db.query(`
            INSERT INTO certificate_requests (student_id, cert_type, reason)
            VALUES (?, ?, ?)
        `, [student_id, cert_type, reason || null]);

        res.status(201).json({
            message: "Certificate request submitted",
            request_id: result.insertId
        });
    } catch (err) {
        console.error("❌ REQUEST ERROR:", err);
        res.status(500).json({ error: err.message });
    }
};

// ✅ Get All Certificate Requests
export const getAllCertificateRequests = async (req, res) => {
    try {
        const { cert_type } = req.query;
        let query = `
            SELECT 
                cr.*, 
                s.first_name, 
                s.last_name, 
                s.middle_name,
                s.current_grade,
                s.student_id_no,
                s.gr_no,
                s.aadhar_no,
                s.prev_school,
                s.prev_class,
                p.father_name
            FROM certificate_requests cr
            JOIN students s ON s.id = cr.student_id
            LEFT JOIN parents p ON p.student_id = s.id
        `;
        let params = [];

        if (cert_type && cert_type !== 'all') {
            query += ` WHERE cr.cert_type = ?`;
            params.push(cert_type);
        }

        query += ` ORDER BY cr.created_at DESC`;

        const [requests] = await db.query(query, params);
        res.json(requests);
    } catch (_err) {
        res.status(500).json({ error: _err.message });
    }
};

// ✅ Get My Requests (For Students/Parents)
export const getMyCertificateRequests = async (req, res) => {
    try {
        const { student_id, cert_type } = req.query;
        const userId = req.user.id;

        let query = `
            SELECT cr.*, s.first_name, s.last_name, s.middle_name, s.student_id_no, p.father_name
            FROM certificate_requests cr
            JOIN students s ON s.id = cr.student_id
            LEFT JOIN parents p ON p.student_id = s.id
            WHERE 1=1
        `;
        let params = [];

        if (req.user.role === 'student') {
            query += ` AND s.id = ?`;
            params.push(userId);
        } else if (req.user.role === 'parent' && student_id) {
            query += ` AND cr.student_id = ?`;
            params.push(student_id);
        } else {
            return res.status(403).json({ error: "Unauthorized or missing student_id" });
        }

        if (cert_type && cert_type !== 'all') {
            query += ` AND cr.cert_type = ?`;
            params.push(cert_type);
        }

        const [requests] = await db.query(query, params);
        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ✅ Teacher Approval
export const teacherApproveCertificate = async (req, res) => {
    try {
        const { id } = req.params;
        const [request] = await db.query(`SELECT * FROM certificate_requests WHERE id = ?`, [id]);
        if (!request.length) return res.status(404).json({ error: "Request not found" });

        const cert = request[0];
        if (cert.status !== 'pending_teacher') {
            return res.status(400).json({ error: `Cannot approve. Current status: ${cert.status}` });
        }

        await db.query(`
            UPDATE certificate_requests
            SET status = 'approved_teacher', teacher_approved_by = ?
            WHERE id = ?
        `, [req.user.id, id]);

        res.json({ message: "Approved by teacher" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ✅ Admin Approval
export const adminApproveCertificate = async (req, res) => {
    try {
        const { id } = req.params;
        const [request] = await db.query(`SELECT * FROM certificate_requests WHERE id = ?`, [id]);
        if (!request.length) return res.status(404).json({ error: "Request not found" });

        const cert = request[0];
        if (cert.status !== 'approved_teacher') {
            return res.status(400).json({ error: `Cannot approve. Current status: ${cert.status}` });
        }

        await db.query(`
            UPDATE certificate_requests
            SET status = 'approved_admin', admin_approved_by = ?
            WHERE id = ?
        `, [req.user.id, id]);

        res.json({ message: "Approved by admin" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ✅ Principal Final Approval
export const principalApproveCertificate = async (req, res) => {
    try {
        const { id } = req.params;
        const [request] = await db.query(`SELECT * FROM certificate_requests WHERE id = ?`, [id]);
        if (!request.length) return res.status(404).json({ error: "Request not found" });

        const cert = request[0];
        if (cert.status !== 'approved_admin') {
            return res.status(400).json({ error: `Cannot approve. Current status: ${cert.status}` });
        }

        await db.query(`
            UPDATE certificate_requests
            SET status = 'approved_principal', principal_approved_by = ?
            WHERE id = ?
        `, [req.user.id, id]);

        res.json({ message: "Final approval by principal completed" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ✅ Student/Parent Submit Grievance
export const submitCertificateGrievance = async (req, res) => {
    try {
        const { id } = req.params;
        const { grievance } = req.body;
        if (!grievance) return res.status(400).json({ error: "Grievance description is required" });

        await db.query(`
            UPDATE certificate_requests
            SET status = 'grievance_raised',
                reason = CONCAT(IFNULL(reason, ''), ' | GRIEVANCE: ', ?)
            WHERE id = ?
        `, [grievance, id]);

        res.json({ message: "Grievance submitted." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ✅ Professional Bonafide & LC Certificate
export const generateBonafideCertificate = async (req, res) => {
    try {
        const { id } = req.params;

        const [data] = await db.query(`
            SELECT 
                cr.*, 
                s.first_name, s.last_name, s.middle_name,
                s.current_grade, s.student_id_no, s.dob, s.pob, s.gr_no,
                s.doc_passport_photo, s.aadhar_no, s.mother_tongue,
                s.religion, s.caste, s.subcaste, s.taluka, s.district, s.state,
                s.admission_date, s.prev_school, s.prev_class,
                p.father_name, p.mother_name
            FROM certificate_requests cr
            JOIN students s ON s.id = cr.student_id
            LEFT JOIN parents p ON p.student_id = s.id
            WHERE cr.id = ?
            GROUP BY cr.id
        `, [id]);

        if (!data.length) return res.status(404).json({ error: "Request not found" });

        const cert = data[0];
        if (cert.status !== 'approved_principal') {
            return res.status(400).json({ error: "Certificate not fully approved" });
        }

        const isLC = cert.cert_type === 'leaving';
        const dobDate = cert.dob ? new Date(cert.dob) : null;
        const dob = dobDate ? dobDate.toLocaleDateString('en-GB') : 'N/A';

        const doc = new PDFDocument({ 
            size: isLC ? 'A4' : 'A5', 
            layout: isLC ? 'portrait' : 'landscape', 
            margin: 30 
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${cert.cert_type}-${cert.student_id_no}.pdf`);
        doc.pipe(res);

        if (isLC) {
            generateLCTemplate(doc, cert);
        } else {
            generateBonafideTemplate(doc, cert, dob);
        }

        doc.end();
    } catch (err) {
        console.error("❌ PDF ERROR:", err);
        res.status(500).json({ error: err.message });
    }
};

// ✅ Delete Request
export const deleteCertificateRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const [request] = await db.query(`SELECT student_id FROM certificate_requests WHERE id = ?`, [id]);
        if (!request.length) return res.status(404).json({ error: "Request not found" });

        if (req.user.role === 'student' && request[0].student_id !== userId) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        await db.query(`DELETE FROM certificate_requests WHERE id = ?`, [id]);
        res.json({ message: "Request deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ✅ Update Request
export const updateCertificateRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason, cert_type } = req.body;
        const userId = req.user.id;

        const [request] = await db.query(`SELECT student_id, status FROM certificate_requests WHERE id = ?`, [id]);
        if (!request.length) return res.status(404).json({ error: "Request not found" });

        if (req.user.role === 'student' && request[0].student_id !== userId) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        if (request[0].status !== 'pending_teacher') {
            return res.status(400).json({ error: "Cannot update approved/rejected request" });
        }

        await db.query(`
            UPDATE certificate_requests 
            SET reason = ?, cert_type = ? 
            WHERE id = ?
        `, [reason, cert_type, id]);

        res.json({ message: "Request updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ✅ Admin Specialized Update (For LC Details)
export const adminUpdateCertificate = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { id } = req.params;
        const { 
            gr_no, aadhar_no, student_id_no, 
            progress, conduct, remarks, fee_remarks,
            reason, cert_type, lc_no,
            prev_school, prev_class
        } = req.body;

        const [request] = await connection.query(`SELECT student_id FROM certificate_requests WHERE id = ?`, [id]);
        if (!request.length) return res.status(404).json({ error: "Request not found" });
        const studentId = request[0].student_id;

        // 1. Update Student Table
        await connection.query(`
            UPDATE students 
            SET gr_no = ?, aadhar_no = ?, student_id_no = ?, prev_school = ?, prev_class = ?
            WHERE id = ?
        `, [gr_no, aadhar_no, student_id_no, prev_school || '', prev_class || '', studentId]);

        // 2. Update Request Table
        await connection.query(`
            UPDATE certificate_requests 
            SET progress = ?, conduct = ?, remarks = ?, fee_remarks = ?, reason = ?, cert_type = ?, lc_no = ?
            WHERE id = ?
        `, [progress, conduct, remarks, fee_remarks, reason, cert_type, lc_no, id]);

        await connection.commit();
        res.json({ message: "Certificate and Student record updated successfully" });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
};

// ==========================================
// 📄 BONAFIDE TEMPLATE
// ==========================================
function generateBonafideTemplate(doc, cert, dob) {
    doc.lineWidth(1.5).rect(15, 15, doc.page.width - 30, doc.page.height - 30).stroke();
    const logoPath = 'h:\\InnovativeSolutions\\GraceERPSystem\\client\\src\\assets\\nga-logo.png';
    const centerX = doc.page.width / 2;
    
    if (fs.existsSync(logoPath)) doc.image(logoPath, 35, 25, { width: 70 });
    
    const textStartX = 115;
    const textWidth = doc.page.width - 230;

    doc.fillColor('black');
    doc.fontSize(22).font('Helvetica-Bold').text('NEW GRACE ACADEMY', textStartX, 30, { align: 'center', width: textWidth });
    doc.fontSize(8).font('Helvetica').text('Ekta Nagar, Near Ankay Housing Society, Borgad, Mhasrul, Nashik-422 004.', textStartX, 58, { align: 'center', width: textWidth });
    doc.fontSize(8).font('Helvetica-Bold').text('Contact: +91 91684 42244 | Website: www.newgraceacademy.in', textStartX, 70, { align: 'center', width: textWidth });

    const photoX = 490; const photoY = 20; const photoW = 65; const photoH = 80;
    doc.rect(photoX, photoY, photoW, photoH).stroke();
    if (cert.doc_passport_photo && fs.existsSync(path.join(process.cwd(), cert.doc_passport_photo))) {
        doc.image(path.join(process.cwd(), cert.doc_passport_photo), photoX + 2, photoY + 2, { width: photoW - 4, height: photoH - 4 });
    }

    doc.fontSize(22).font('Helvetica-Bold').text('Bonafide/Domicile Certificate', 0, 135, { align: 'center' });
    doc.fontSize(9).font('Helvetica-Bold').text(`Sr. No.:`, 50, 170);
    doc.fillColor('red').fontSize(14).text(`${cert.id.toString().padStart(4, '0')}`, 85, 170);
    doc.fillColor('black').fontSize(9).text(`Gr. No.:`, 450, 170);
    doc.rect(490, 165, 65, 18).stroke();
    doc.text(`${cert.gr_no || '---'}`, 495, 170);

    const studentName = `${cert.last_name || ''} ${cert.first_name || ''} ${cert.middle_name || cert.father_name || ''}`.trim().toUpperCase();
    const fatherName = `${cert.last_name || ''} ${cert.father_name || cert.middle_name || ''}`.trim().toUpperCase();
    
    doc.font('Times-Roman').fontSize(13);
    doc.text('This is to certify that ', 50, 215, { continued: true })
       .font('Times-BoldItalic').text(studentName, { continued: true })
       .font('Times-Roman').text(' son/daughter of ', { continued: true })
       .font('Times-BoldItalic').text(fatherName);

    doc.moveDown(1.5);
    doc.font('Times-Roman').text('residing at ', { continued: true })
       .font('Times-Bold').text((cert.residential_address || 'NASHIK').toUpperCase(), { continued: true })
       .font('Times-Roman').text(' is bonafide student of our school.');

    doc.moveDown(1.5);
    doc.text('He/She is/was very obedient, sincere and hardworking. He/She bears a good moral character, ', { continued: true });
    doc.text('his/her date of birth is ', { continued: true })
       .font('Times-Bold').text(dob, { continued: true })
       .font('Times-Roman').text(' and place of birth is ', { continued: true })
       .font('Times-Bold').text((cert.pob || 'NASHIK').toUpperCase());

    doc.font('Helvetica-Bold').fontSize(10);
    doc.text(`Place: NASHIK`, 50, 365);
    doc.text(`Principal's Signature`, 420, 365, { align: 'center' });
}

// ==========================================
// 📄 LEAVING CERTIFICATE TEMPLATE
// ==========================================
function generateLCTemplate(doc, cert) {
    doc.lineWidth(1.5).rect(15, 15, doc.page.width - 30, doc.page.height - 30).strokeColor('#8B0000').stroke();
    doc.strokeColor('black');
    const logoPath = 'h:\\InnovativeSolutions\\GraceERPSystem\\client\\src\\assets\\nga-logo.png';

    if (fs.existsSync(logoPath)) doc.image(logoPath, 30, 25, { width: 85 });
    doc.fillColor('#8B0000').fontSize(22).font('Helvetica-Bold').text('NEW GRACE ACADEMY', 100, 30, { align: 'center', width: doc.page.width - 200 });
    doc.fontSize(10).text('ENGLISH MEDIUM SCHOOL & JUNIOR COLLAGE (Sci.& Com.)', 100, 55, { align: 'center', width: doc.page.width - 200 });
    doc.fillColor('black').fontSize(8).font('Helvetica').text('Ekta Nagar, Near Ankay Housing Society, Borgad, Mhasrul, Nashik. Mo.: +91 9168442244', 100, 70, { align: 'center', width: doc.page.width - 200 });

    doc.lineWidth(0.5).moveTo(15, 90).lineTo(doc.page.width - 15, 90).stroke();
    doc.fontSize(9).font('Helvetica-Bold').text(`UDISE No. :- 27201600220`, 30, 100);
    doc.text(`INDEX NO.: S1317193`, 450, 100);
    doc.text(`Gen. Reg. No.:`, 440, 120);
    doc.rect(515, 115, 60, 15).stroke(); doc.text(`${cert.gr_no || '---'}`, 520, 120);
    doc.fillColor('#8B0000').fontSize(12).text(`L.C. No.:`, 250, 120); doc.fontSize(16).text(`${cert.lc_no || cert.id}`, 310, 118);
    doc.fillColor('#8B0000').fontSize(18).font('Helvetica-Bold').text('SCHOOL LEAVING CERTIFICATE', 0, 150, { align: 'center' });
    doc.fillColor('black');

    let currentY = 190;
    const addRow = (label, value, isGrid = false, boxCount = 20) => {
        doc.fontSize(10).font('Helvetica-Bold').text(label, 30, currentY);
        if (isGrid) drawGridBoxes(doc, 180, currentY - 3, value, boxCount);
        else {
            doc.font('Helvetica').text(`: ${value || '---'}`, 180, currentY);
            doc.lineWidth(0.5).moveTo(187, currentY + 10).lineTo(doc.page.width - 30, currentY + 10).dash(2, { space: 2 }).stroke().undash();
        }
        currentY += 25;
    };

    const studentName = `${cert.last_name || ''} ${cert.first_name || ''} ${cert.middle_name || cert.father_name || ''}`.trim().toUpperCase();
    addRow("1) Name of Pupil", studentName);
    currentY += 5; addRow("   Student ID", cert.student_id_no, true, 25); addRow("   Student UID", cert.aadhar_no, true, 25);
    currentY += 10; addRow("2) Caste & Sub Caste", `${cert.caste || '---'} / ${cert.subcaste || '---'}`);
    
    doc.fontSize(10).font('Helvetica-Bold').text("3) Nationality :", 30, currentY); doc.font('Helvetica').text("INDIAN", 105, currentY);
    doc.font('Helvetica-Bold').text("4) Mother-tongue :", 200, currentY); doc.font('Helvetica').text(`${cert.mother_tongue || '---'}`, 295, currentY);
    doc.font('Helvetica-Bold').text("5) Mother's Name :", 400, currentY); doc.font('Helvetica').text(`${cert.mother_name || '---'}`, 495, currentY);
    currentY += 25;

    addRow("6) Place of Birth City/Village", `${cert.pob || 'NASHIK'}`);
    doc.font('Helvetica-Bold').text("Taluka :", 300, currentY - 25); doc.font('Helvetica').text(`${cert.taluka || '---'}`, 345, currentY - 25);
    doc.font('Helvetica-Bold').text("Dist.:", 100, currentY); doc.font('Helvetica').text(`${cert.district || '---'}`, 130, currentY);
    doc.font('Helvetica-Bold').text("State :", 250, currentY); doc.font('Helvetica').text(`${cert.state || '---'}`, 290, currentY);
    doc.font('Helvetica-Bold').text("Country : INDIA", 450, currentY); currentY += 25;

    addRow("7) Date of Birth (In Figures)", cert.dob ? new Date(cert.dob).toLocaleDateString('en-GB') : '---');
    addRow("   (Words)", dateToWords(cert.dob));
    addRow("8) Last School Attended & Class", `${cert.prev_school || '---'} / ${cert.prev_class || '---'}`);
    
    // Field 9: Fixed overlapping by ensuring labels are clearly separated
    doc.fontSize(10).font('Helvetica-Bold').text("9) Date of Admission in this School :", 30, currentY);
    doc.font('Helvetica').text(cert.admission_date ? new Date(cert.admission_date).toLocaleDateString('en-GB') : '---', 210, currentY);
    doc.font('Helvetica-Bold').text("Class :", 440, currentY); 
    doc.font('Helvetica').text(`${cert.current_grade || '---'}`, 480, currentY);
    doc.lineWidth(0.5).moveTo(187, currentY + 10).lineTo(doc.page.width - 30, currentY + 10).dash(2, { space: 2 }).stroke().undash();
    currentY += 25;

    addRow("10) Progress", cert.progress || "GOOD");
    doc.font('Helvetica-Bold').text("11) Conduct in School :", 350, currentY - 25); doc.font('Helvetica').text(cert.conduct || "GOOD", 465, currentY - 25);
    addRow("12) Date of Leaving School", cert.leaving_date ? new Date(cert.leaving_date).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'));
    addRow("13) Standard in which Studying", `${cert.current_grade || '---'}`);
    addRow("14) Reason of Leaving School", cert.reason || "HIGHER STUDIES");
    addRow("15) Remark", cert.remarks || "---"); addRow("16) Fee Remark", cert.fee_remarks || "CLEAR");

    currentY += 20; doc.font('Helvetica-Bold').text("Certified that the above information is in accordance with the school register.", 0, currentY, { align: 'center' });
    currentY += 60; doc.text(`Date : ${new Date().toLocaleDateString('en-GB')}`, 30, currentY);
    doc.text("Class Teacher", doc.page.width / 2 - 40, currentY); doc.text("Head Master", doc.page.width - 120, currentY);
}

function drawGridBoxes(doc, x, y, value, boxCount, boxSize = 14) {
    const chars = (value || "").toString().replace(/ /g, "").split("");
    for (let i = 0; i < boxCount; i++) {
        const curX = x + (i * boxSize); doc.lineWidth(0.5).rect(curX, y, boxSize, boxSize).stroke();
        if (chars[i]) doc.font('Helvetica-Bold').fontSize(9).text(chars[i], curX, y + 2, { width: boxSize, align: 'center' });
    }
}

function dateToWords(dateString) {
    if (!dateString) return '---';
    const d = new Date(dateString); const day = d.getDate();
    const month = d.toLocaleString('en-US', { month: 'long' }); const year = d.getFullYear();
    const dayWords = ["", "First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth", "Ninth", "Tenth", "Eleventh", "Twelfth", "Thirteenth", "Fourteenth", "Fifteenth", "Sixteenth", "Seventeenth", "Eighteenth", "Nineteenth", "Twentieth", "Twenty-First", "Twenty-Second", "Twenty-Third", "Twenty-Fourth", "Twenty-Fifth", "Twenty-Sixth", "Twenty-Seventh", "Twenty-Eighth", "Twenty-Ninth", "Thirtieth", "Thirty-First"];
    const yearToWords = (y) => {
        const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
        const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
        const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
        if (y >= 2000 && y < 2100) {
            const rest = y % 100; let restWord = "";
            if (rest === 0) restWord = ""; else if (rest < 10) restWord = units[rest];
            else if (rest < 20) restWord = teens[rest - 10]; else restWord = tens[Math.floor(rest / 10)] + (rest % 10 !== 0 ? " " + units[rest % 10] : "");
            return "Two Thousand" + (restWord ? " " + restWord : "");
        } return y.toString();
    };
    return `${dayWords[day]} ${month} ${yearToWords(year)}`.toUpperCase();
}