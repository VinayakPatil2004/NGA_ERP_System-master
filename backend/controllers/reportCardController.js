import pool from '../config/db.js';
import ejs from 'ejs';
import puppeteer from 'puppeteer-core';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const findExecutable = () => {
    const paths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
    ];
    for (const p of paths) {
        if (path.existsSync && path.existsSync(p)) return p;
        // Since we are in node, let's use fs.existsSync
    }
    return null;
};

import fs from 'fs';

export const generateReportCard = async (req, res) => {
    try {
        const { student_id, academic_year_id, term, classroom_id } = req.query;

        // 0. Load Logo as Base64 for PDF reliability
        let logoBase64 = '';
        try {
            const logoPath = path.join(__dirname, '../../client/src/assets/nga-logo.png');
            const logoData = fs.readFileSync(logoPath);
            logoBase64 = `data:image/png;base64,${logoData.toString('base64')}`;
        } catch (e) {
            console.error("Logo load failed:", e);
        }

        // 1. Fetch Student & Parent Data
        let studentQuery = `
            SELECT s.*, p.father_name, p.mother_name, c.class_name, se.roll_number, ay.year_name 
            FROM students s 
            JOIN student_enrollments se ON s.id = se.student_id 
            LEFT JOIN parents p ON s.id = p.student_id
            JOIN classrooms c ON se.classroom_id = c.id 
            JOIN academic_years ay ON se.academic_year_id = ay.id 
            WHERE s.id = ? AND se.academic_year_id = ?
        `;
        const studentParams = [student_id, academic_year_id];

        if (classroom_id) {
            studentQuery += ` AND se.classroom_id = ?`;
            studentParams.push(classroom_id);
        }

        const [studentRows] = await pool.query(studentQuery, studentParams);
        const student = studentRows[0];
        if (!student) {
            console.error(`[ReportCard] No enrollment found for Student ID: ${student_id} in Academic Year: ${academic_year_id}`);
            return res.status(404).json({ error: "Student enrollment not found for this academic year." });
        }

        console.log(`[ReportCard] Student: ${student.first_name} ${student.last_name}, Class: ${student.class_name}, Year: ${student.year_name}`);

        // 2. Fetch Marks
        const isPrePrimary = student.class_name?.toLowerCase().match(/(nursery|junior|senior|kg|jr|sr)/i);
        console.log(`[ReportCard] Is Pre-Primary: ${!!isPrePrimary} (Matched against: ${student.class_name})`);

        let marks = [];
        let prePrimaryData = null;

        if (isPrePrimary) {
            console.log(`[ReportCard] Fetching Pre-Primary marks for student ${student_id}`);
            const [ppRows] = await pool.query(
                'SELECT * FROM pre_primary_marks WHERE student_id = ? AND academic_year_id = ?',
                [student_id, academic_year_id]
            );
            
            // Transform rows to match template (T1 and T2 columns)
            if (ppRows.length > 0) {
                prePrimaryData = {};
                ppRows.forEach(row => {
                    // Match 'Term 1' or 'I Term'
                    const isT1 = row.term === 'I Term' || row.term === 'Term 1' || row.term === 'ppT1';
                    const suffix = isT1 ? '_t1' : '_t2';
                    Object.keys(row).forEach(key => {
                        if (!['id', 'student_id', 'academic_year_id', 'term', 'created_at', 'updated_at'].includes(key)) {
                            prePrimaryData[`${key}${suffix}`] = row[key];
                        }
                    });
                });
            }
        } else {
            console.log(`[ReportCard] Generating Scholastic report for Student: ${student_id}, Grade: ${student.class_name}`);
            const [marksRows] = await pool.query(
                `SELECT em.*, e.exam_name, e.term
                 FROM exam_marks em
                 JOIN exams e ON em.exam_id = e.id
                 WHERE em.student_id = ? AND e.academic_year_id = ? AND e.term = ?`,
                [student_id, academic_year_id, term]
            );
            marks = marksRows;
        }

        // 3. Fetch Co-Scholastic
        const [coScholastic] = await pool.query(
            'SELECT * FROM co_scholastic_marks WHERE student_id = ? AND academic_year_id = ?',
            [student_id, academic_year_id]
        );

        // 4. Calculate Overall (Simple aggregation for the demo)
        const overall = {
            total: marks.reduce((sum, m) => sum + parseFloat(m.total_obtained || 0), 0),
            max: marks.reduce((sum, m) => sum + parseFloat(m.total_max || 100), 0),
            percentage: 0,
            grade: 'A',
            promotion_class: 'VIII',
            attendance: '95%'
        };
        overall.percentage = overall.max > 0 ? (overall.total / overall.max) * 100 : 0;

        // 5. Render EJS to HTML
        const templateFile = isPrePrimary ? 'pre_primary_report_card.ejs' : 'report_card.ejs';
        const templatePath = path.join(__dirname, `../templates/${templateFile}`);
        
        const html = await ejs.renderFile(templatePath, {
            student: {
                name: `${student.last_name} ${student.first_name} ${student.middle_name || ''}`.trim().toUpperCase(),
                gr_no: student.gr_no || student.student_id_no,
                mother_name: student.mother_name || 'N/A',
                father_name: student.father_name || 'N/A'
            },
            classroom: { name: student.class_name },
            enrollment: { roll_number: student.roll_number },
            academicYear: student.year_name,
            term: term,
            marks: isPrePrimary ? (prePrimaryData || {}) : marks,
            coScholastic: coScholastic,
            overall: overall,
            logo: logoBase64
        });

        // 6. Convert to PDF
        const executablePath = [
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
        ].find(p => fs.existsSync(p));

        if (!executablePath) {
            return res.status(500).json({ error: "Chrome/Edge not found for PDF generation" });
        }

        const browser = await puppeteer.launch({
            executablePath,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
        });

        await browser.close();

        // 7. Send Result
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=ReportCard_${student.last_name}.pdf`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error("PDF GEN ERROR:", error);
        res.status(500).json({ error: error.message });
    }
};
