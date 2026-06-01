import logger from '../utils/logger.js';
import db from '../config/db.js';

/**
 * INSTITUTIONAL COUNSELLOR CONTROLLER
 * Optimized for high-performance data retrieval and student engagement tracking.
 */

// Helper: Generates a unique institutional enquiry form number.
const generateFormNo = async () => {
    const year = new Date().getFullYear();
    const [rows] = await db.query(
        "SELECT form_no FROM admission_enquiries WHERE form_no LIKE ? ORDER BY id DESC LIMIT 1",
        [`ENQ-${year}-%`]
    );
    
    let nextNum = 1;
    if (rows.length > 0) {
        const lastNo = rows[0].form_no;
        if (lastNo) {
            const parts = lastNo.split('-');
            const lastPart = parts[parts.length - 1];
            nextNum = parseInt(lastPart) + 1;
        }
    }
    
    return `ENQ-${year}-${nextNum.toString().padStart(4, '0')}`;
};

// Enquiry Management
export const createEnquiry = async (req, res) => {
    try {
        const { 
            fullName, placeOfBirth, dob, aadharNo, address, admissionStd, prevStd, 
            caste, prevSchool, siblingsCount, age, religion, category, busFacility, 
            busArea, fatherName, fatherContact, fatherQual, fatherProf, fatherIncome, 
            motherName, motherContact, motherQual, motherProf, motherIncome, 
            academicYearId, enquiryDate, reference 
        } = req.body;

        const formNo = await generateFormNo();

        const [result] = await db.query(`
            INSERT INTO admission_enquiries (
                form_no, full_name, place_of_birth, dob, aadhar_no, address, admission_std, prev_std, 
                caste, prev_school, siblings_count, age, religion, category, bus_facility, 
                bus_area, father_name, father_contact, father_qual, father_prof, father_income, 
                mother_name, mother_contact, mother_qual, mother_prof, mother_income, 
                academic_year_id, enquiry_date, reference, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        `, [
            formNo, fullName, placeOfBirth, dob || null, aadharNo, address, admissionStd, prevStd, 
            caste, prevSchool, siblingsCount || 0, age || null, religion, category, busFacility === 'Yes' ? 1 : 0, 
            busArea, fatherName, fatherContact, fatherQual, fatherProf, fatherIncome, 
            motherName, motherContact, motherQual, motherProf, motherIncome, 
            academicYearId, enquiryDate || new Date(), reference
        ]);

        const [newRow] = await db.query("SELECT form_no FROM admission_enquiries WHERE id = ?", [result.insertId]);

        res.status(201).json({ 
            message: "Enquiry created successfully", 
            id: result.insertId,
            formNo: newRow[0]?.form_no 
        });
    } catch (error) {
        logger.error("Create Enquiry Error:", error);
        res.status(500).json({ error: error.message });
    }
};

export const getAllEnquiries = async (req, res) => {
    try {
        const { academicYearId } = req.query;
        let query = "SELECT * FROM admission_enquiries WHERE (status IS NULL OR status != 'converted')";
        const params = [];

        if (academicYearId && academicYearId !== 'all') {
            query += " AND academic_year_id = ?";
            params.push(academicYearId);
        }
        
        query += " ORDER BY enquiry_date DESC";
        
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateEnquiry = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        
        // Map frontend fields to database columns
        const updates = {
            full_name: data.fullName,
            place_of_birth: data.placeOfBirth,
            dob: data.dob || null,
            aadhar_no: data.aadharNo,
            address: data.address,
            admission_std: data.admissionStd,
            prev_std: data.prevStd,
            caste: data.caste,
            prev_school: data.prevSchool,
            siblings_count: data.siblingsCount || 0,
            age: data.age || null,
            religion: data.religion,
            category: data.category,
            bus_facility: data.busFacility === 'Yes' ? 1 : 0,
            bus_area: data.busArea,
            father_name: data.fatherName,
            father_contact: data.fatherContact,
            father_qual: data.fatherQual,
            father_prof: data.fatherProf,
            father_income: data.fatherIncome,
            mother_name: data.motherName,
            mother_contact: data.motherContact,
            mother_qual: data.motherQual,
            mother_prof: data.motherProf,
            mother_income: data.motherIncome,
            academic_year_id: data.academicYearId,
            enquiry_date: data.enquiryDate,
            reference: data.reference
        };

        // Remove undefined fields
        Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

        await db.query("UPDATE admission_enquiries SET ? WHERE id = ?", [updates, id]);
        res.json({ message: "Enquiry updated" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Follow-up Management
export const createFollowup = async (req, res) => {
    try {
        const { enquiryId, followupDate, followupMethod, remarks, nextFollowupDate, status } = req.body;
        const counsellorId = req.user.id;

        await db.query(`
            INSERT INTO enquiry_followups (enquiry_id, followup_date, followup_method, status, remarks, next_followup_date, counsellor_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [enquiryId, followupDate || new Date(), followupMethod || 'call', status || 'Pending', remarks, nextFollowupDate, counsellorId]);

        await db.query(`UPDATE admission_enquiries SET status = 'in-progress' WHERE id = ?`, [enquiryId]);

        res.status(201).json({ message: "Follow-up recorded successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getFollowupsDue = async (req, res) => {
    try {
        const { academicYearId } = req.query;
        // Enriched query to get the latest followup status and remarks
        let query = `
            SELECT 
                ae.id as enquiry_id, ae.full_name, ae.form_no, ae.father_name, 
                ae.father_contact as mobile_no, ae.enquiry_date, ae.status,
                ef.status as followup_status, ef.remarks as last_remark
            FROM admission_enquiries ae
            LEFT JOIN (
                SELECT ef1.enquiry_id, ef1.status, ef1.remarks
                FROM enquiry_followups ef1
                INNER JOIN (
                    SELECT enquiry_id, MAX(id) as max_id
                    FROM enquiry_followups
                    GROUP BY enquiry_id
                ) ef2 ON ef1.id = ef2.max_id
            ) ef ON ae.id = ef.enquiry_id
            WHERE (ae.status != 'converted' OR ae.status IS NULL)
        `;
        const params = [];

        if (academicYearId && academicYearId !== 'all') {
            query += " AND ae.academic_year_id = ?";
            params.push(academicYearId);
        }

        query += " ORDER BY ae.enquiry_date DESC";
        
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getFollowupsByEnquiry = async (req, res) => {
    try {
        const { enquiryId } = req.params;
        const [rows] = await db.query(`SELECT * FROM enquiry_followups WHERE enquiry_id = ? ORDER BY followup_date DESC`, [enquiryId]);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Session Management
export const createSession = async (req, res) => {
    try {
        const { title, date, time, type, studentId, enquiryId, notes } = req.body;
        const counsellorId = req.user.id;

        const [result] = await db.query(`
            INSERT INTO counselling_sessions (title, session_date, session_time, session_type, student_id, enquiry_id, counsellor_id, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [title, date, time, type, studentId, enquiryId, counsellorId, notes]);

        res.status(201).json({ message: "Session scheduled", id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getAllSessions = async (req, res) => {
    try {
        const { academicYearId } = req.query;
        const counsellorId = req.user.id;
        let whereClause = " WHERE cs.counsellor_id = ?";
        const params = [counsellorId];

        if (academicYearId && academicYearId !== 'all') {
            whereClause += " AND (ae.academic_year_id = ? OR s.academic_year_id = ?)";
            params.push(academicYearId, academicYearId);
        }

        const [rows] = await db.query(`
            SELECT cs.*, ae.full_name as prospect_name, s.student_name 
            FROM counselling_sessions cs
            LEFT JOIN admission_enquiries ae ON cs.enquiry_id = ae.id
            LEFT JOIN students s ON cs.student_id = s.id
            ${whereClause}
            ORDER BY cs.session_date ASC, cs.session_time ASC
        `, params);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteEnquiry = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query("DELETE FROM admission_enquiries WHERE id = ?", [id]);
        res.json({ message: "Enquiry deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Statistics Retrieval
export const getCounselorStats = async (req, res) => {
    try {
        const { academicYearId } = req.query;
        let whereClause = "";
        const params = [];

        if (academicYearId && academicYearId !== 'all') {
            whereClause = " AND academic_year_id = ?";
            params.push(academicYearId);
        }

        // Broaden fetch for demo - show all if year filter returns 0
        const [enqRes] = await db.query(`SELECT COUNT(*) as count FROM admission_enquiries WHERE (status != 'converted' OR status IS NULL)${whereClause}`, params);
        const [stdRes] = await db.query(`SELECT COUNT(*) as count FROM students WHERE status = 'active'${whereClause}`, params);
        
        let totalEnquiries = enqRes[0].count;
        let totalAdmissions = stdRes[0].count;

        if (totalEnquiries === 0) {
            const [fallback] = await db.query(`SELECT COUNT(*) as count FROM admission_enquiries`);
            totalEnquiries = fallback[0].count;
        }

        const [followupRes] = await db.query(`
            SELECT COUNT(DISTINCT enquiry_id) as count 
            FROM enquiry_followups 
            WHERE next_followup_date <= CURDATE()
        `);

        const [sessionRes] = await db.query(`SELECT COUNT(*) as count FROM counselling_sessions`);

        res.status(200).json({
            totalEnquiries: totalEnquiries || 0,
            totalAdmissions: totalAdmissions || 0,
            followupsDue: followupRes[0].count || 0,
            sessionsToday: sessionRes[0].count || 0
        });
    } catch (error) {
        logger.error("Get Counselor Stats Error:", error);
        res.status(500).json({ error: "Failed to load reporting metrics" });
    }
};
