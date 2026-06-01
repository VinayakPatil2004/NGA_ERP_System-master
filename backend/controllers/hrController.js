import db from '../config/db.js';

// ─────────────────────────────────────────────────────────────────────────────
//  STAFF PAYROLL CONTROLLERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/hr/payroll?month=&year=
 * Returns all active staff with their payroll record for given month/year.
 * Auto-fills basic_salary from staff.salary if no record exists.
 */
export const getPayroll = async (req, res) => {
    try {
        const now = new Date();
        const month = parseInt(req.query.month || now.getMonth() + 1);
        const year  = parseInt(req.query.year  || now.getFullYear());

        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay   = new Date(year, month, 0).getDate();
        const endDate   = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        const [rows] = await db.query(`
            SELECT
                s.id          AS staff_id,
                s.full_name,
                s.employee_id,
                s.aadhar_no   AS national_code,
                s.designation,
                s.department,
                s.staff_type,
                COALESCE(ss.basic_salary, s.salary, 0) AS base_salary,

                -- HRA (Read-only on payroll screen, falls back to structure if unpaid and 0)
                CASE 
                    WHEN p.status = 'paid' THEN COALESCE(p.hra, ss.hra, 0)
                    ELSE COALESCE(NULLIF(p.hra, 0), ss.hra, 0)
                END AS hra,

                -- DA (Read-only on payroll screen, falls back to structure if unpaid and 0)
                CASE 
                    WHEN p.status = 'paid' THEN COALESCE(p.da, ss.da, 0)
                    ELSE COALESCE(NULLIF(p.da, 0), ss.da, 0)
                END AS da,

                COALESCE(p.bonus, ss.bonus, 0)        AS bonus,

                -- PF (Read-only on payroll screen, falls back to structure if unpaid and 0)
                CASE 
                    WHEN p.status = 'paid' THEN COALESCE(p.pf, ss.pf, 0)
                    ELSE COALESCE(NULLIF(p.pf, 0), ss.pf, 0)
                END AS pf,

                -- PT (Editable on payroll screen, falls back to structure if unpaid and 0)
                CASE 
                    WHEN p.status = 'paid' THEN COALESCE(p.pt, ss.pt, 0)
                    ELSE COALESCE(NULLIF(p.pt, 0), ss.pt, 0)
                END AS pt,

                -- ESIC (Read-only on payroll screen, falls back to structure if unpaid and 0)
                CASE 
                    WHEN p.status = 'paid' THEN COALESCE(p.esic, ss.esic, 0)
                    ELSE COALESCE(NULLIF(p.esic, 0), ss.esic, 0)
                END AS esic,

                -- Loan deduction: From payroll if processed, else fetch active loan balance
                CASE 
                    WHEN p.status IN ('processed', 'paid') THEN COALESCE(p.loan_deduction, 0)
                    ELSE COALESCE((SELECT SUM(balance_amount) FROM staff_loans WHERE staff_id = s.id AND (status = 'active' OR status IS NULL) AND balance_amount > 0), 0)
                END AS loan_deduction,

                -- Deductions (Editable on payroll screen, falls back to structure if unpaid and 0)
                CASE 
                    WHEN p.status = 'paid' THEN COALESCE(p.deductions, ss.other_deductions, 0)
                    ELSE COALESCE(NULLIF(p.deductions, 0), ss.other_deductions, 0)
                END AS deductions,

                -- Actual calendar days in the selected month
                DAY(LAST_DAY(?))                  AS auto_total_days,

                -- Present days from attendance (manual + mobile)
                COALESCE(att.present_count, 0)    AS auto_present_days,

                -- Half days from manual attendance
                COALESCE(att.half_count, 0)       AS auto_half_days,

                COALESCE(p.id,          NULL)     AS payroll_id,
                CASE 
                    WHEN p.status = 'paid' THEN COALESCE(p.basic_salary, ss.basic_salary, s.salary, 0)
                    ELSE COALESCE(NULLIF(p.basic_salary, 0), ss.basic_salary, s.salary, 0)
                END AS basic_salary,
                COALESCE(p.present_days, NULL)    AS present_days,
                COALESCE(p.total_days,  NULL)     AS total_days,
                COALESCE(p.half_days,   NULL)     AS half_days,
                COALESCE(p.net_salary,  0)        AS net_salary,
                COALESCE(p.status,      'pending') AS status,
                p.payment_date,
                p.remarks,
                p.processed_at
            FROM staff s
            LEFT JOIN (
                SELECT
                    u.staff_id,
                    SUM(CASE WHEN u.att_status IN ('present','late') THEN 1 ELSE 0 END) AS present_count,
                    SUM(CASE WHEN u.att_status = 'half-day' THEN 1 ELSE 0 END)          AS half_count
                FROM (
                    SELECT staff_id, att_status
                    FROM (
                        SELECT 
                            staff_id, date, att_status,
                            ROW_NUMBER() OVER (PARTITION BY staff_id, date ORDER BY priority ASC) as rn
                        FROM (
                            SELECT sa.staff_id, DATE(sa.date) AS date, sa.status AS att_status, 1 AS priority
                            FROM staff_attendance sa
                            WHERE DATE(sa.date) BETWEEN ? AND ?
                            UNION ALL
                            SELECT a.user_id AS staff_id, DATE(a.date) AS date, 'present' AS att_status, 2 AS priority
                            FROM attendances a
                            WHERE a.user_type = 'staff' AND a.punch_in_time IS NOT NULL AND DATE(a.date) BETWEEN ? AND ?
                        ) all_att
                    ) unique_att
                    WHERE rn = 1
                ) AS u
                GROUP BY u.staff_id
            ) AS att ON s.id = att.staff_id
            LEFT JOIN staff_salary_structures ss ON s.id = ss.staff_id
            LEFT JOIN staff_payroll p
                ON s.id = p.staff_id AND p.month = ? AND p.year = ?
            WHERE s.status = 'active'
            ORDER BY s.full_name ASC
        `, [startDate, startDate, endDate, startDate, endDate, month, year]);

        // Fallback to live attendance unless the payroll status is 'paid'
        const finalData = rows.map(r => {
            const isPaid = r.status === 'paid';
            const present_days = parseFloat((isPaid && r.present_days !== null) ? r.present_days : r.auto_present_days) || 0;
            const half_days    = parseFloat((isPaid && r.half_days !== null) ? r.half_days : r.auto_half_days) || 0;
            const total_days   = parseFloat((isPaid && r.total_days !== null) ? r.total_days : r.auto_total_days) || 30;
            
            // Calculate dynamic net salary if not paid
            let net_salary = parseFloat(r.net_salary) || 0;
            if (!isPaid) {
                const basic = parseFloat(r.basic_salary) || 0;
                const hra = parseFloat(r.hra) || 0;
                const da = parseFloat(r.da) || 0;
                const gross = basic + hra + da;
                const bonus = parseFloat(r.bonus) || 0;
                const pf = parseFloat(r.pf) || 0;
                const pt = parseFloat(r.pt) || 0;
                const esic = parseFloat(r.esic) || 0;
                const loan = parseFloat(r.loan_deduction) || 0;
                const deds = parseFloat(r.deductions) || 0;
                const totalDeds = pf + pt + esic + loan + deds;
                
                const earnedGross = (gross / (total_days || 30)) * (present_days + half_days * 0.5) + bonus;
                net_salary = Math.round(Math.max(0, earnedGross - totalDeds));
            } else {
                net_salary = Math.round(net_salary);
            }

            return {
                ...r,
                present_days,
                half_days,
                total_days,
                net_salary,
                payment_date: r.payment_date ? (r.payment_date instanceof Date ? (r.payment_date.getFullYear() + '-' + String(r.payment_date.getMonth() + 1).padStart(2, '0') + '-' + String(r.payment_date.getDate()).padStart(2, '0')) : r.payment_date) : null,
            };
        });

        res.json({ month, year, data: finalData });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * POST /api/hr/payroll/process
 * Body: { month, year, payroll_data: [{staff_id, basic_salary, present_days, total_days, deductions, remarks}] }
 * Upserts payroll records and marks status = 'processed'.
 */
export const processPayroll = async (req, res) => {
    try {
        const { month, year, payroll_data } = req.body;
        if (!month || !year || !payroll_data?.length) {
            return res.status(400).json({ error: 'month, year and payroll_data are required' });
        }

        const processedBy = req.user?.id || null;
        const now = new Date();

        for (const rec of payroll_data) {
            const gross     = (parseFloat(rec.basic_salary)||0) + (parseFloat(rec.hra)||0) + (parseFloat(rec.da)||0);
            const totalDays = parseFloat(rec.total_days) || 30;
            const present   = parseFloat(rec.present_days) || 0;
            const half      = parseFloat(rec.half_days) || 0;
            const earnedGross = (gross / totalDays) * (present + half * 0.5) + (parseFloat(rec.bonus)||0);
            const totalDed  = (parseFloat(rec.pf)||0) + (parseFloat(rec.pt)||0) + (parseFloat(rec.esic)||0) + (parseFloat(rec.deductions)||0) + (parseFloat(rec.loan_deduction)||0);
            const net = Math.round(Math.max(0, earnedGross - totalDed));

            await db.query(`
                INSERT INTO staff_payroll
                    (staff_id, month, year, basic_salary, hra, da, bonus, present_days, half_days, total_days, deductions, pf, pt, esic, loan_deduction, net_salary, status, payment_date, remarks, processed_by, processed_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    basic_salary   = VALUES(basic_salary),
                    hra            = VALUES(hra),
                    da             = VALUES(da),
                    bonus          = VALUES(bonus),
                    present_days   = VALUES(present_days),
                    half_days      = VALUES(half_days),
                    total_days     = VALUES(total_days),
                    deductions     = VALUES(deductions),
                    pf             = VALUES(pf),
                    pt             = VALUES(pt),
                    esic           = VALUES(esic),
                    loan_deduction = VALUES(loan_deduction),
                    net_salary     = VALUES(net_salary),
                    status         = VALUES(status),
                    payment_date   = VALUES(payment_date),
                    remarks        = VALUES(remarks),
                    processed_by   = VALUES(processed_by),
                    processed_at   = VALUES(processed_at)
            `, [
                rec.staff_id, month, year, rec.basic_salary, rec.hra||0, rec.da||0, rec.bonus||0,
                rec.present_days, rec.half_days||0, rec.total_days, rec.deductions||0,
                rec.pf||0, rec.pt||0, rec.esic||0, rec.loan_deduction||0,
                net, rec.status || 'pending', rec.payment_date || null, rec.remarks||null, processedBy, now
            ]);

            // If marked as paid, automatically deduct the advance from their active loan
            if (rec.status === 'paid' && parseFloat(rec.loan_deduction) > 0) {
                await db.query(`
                    UPDATE staff_loans 
                    SET balance_amount = GREATEST(0, balance_amount - ?), 
                        status = CASE WHEN balance_amount - ? <= 0 THEN 'paid' ELSE 'active' END
                    WHERE staff_id = ? AND status = 'active'
                `, [rec.loan_deduction, rec.loan_deduction, rec.staff_id]);
            }
        }

        res.json({ message: 'Payroll processed successfully', count: payroll_data.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * PUT /api/hr/payroll/:id/status
 * Body: { status: 'paid' }  — mark a payroll record as paid
 */
export const updatePayrollStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const allowed = ['pending', 'processed', 'paid', 'hold'];
        if (!allowed.includes(status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }
        await db.query(`UPDATE staff_payroll SET status = ? WHERE id = ?`, [status, id]);
        res.json({ message: 'Payroll status updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * GET /api/hr/payroll/my-records
 * Returns all processed payroll records for the logged-in staff member.
 */
export const getStaffPayroll = async (req, res) => {
    try {
        const staff_id = req.user.id;
        const [rows] = await db.query(`
            SELECT * FROM staff_payroll 
            WHERE staff_id = ? AND status IN ('processed', 'paid')
            ORDER BY year DESC, month DESC
        `, [staff_id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};



// ─────────────────────────────────────────────────────────────────────────────
//  LEAVE MANAGEMENT CONTROLLERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/hr/leaves?status=&staff_id=
 * Returns leave applications with staff details.
 */
export const getLeaves = async (req, res) => {
    try {
        const { status, staff_id, applicant_type } = req.query;

        // 🛡️ Access Control: Check if the authenticated user has an HR/Admin/Principal role
        const userRole = req.user?.role?.toLowerCase();
        const userId = req.user?.id;
        const isHR = ['admin', 'principal', 'hr'].includes(userRole);

        // If NOT an HR role, the user is strictly restricted to viewing only their own leaves.
        if (!isHR) {
            if (!staff_id || parseInt(staff_id) !== parseInt(userId)) {
                return res.status(403).json({ error: "Access denied. You can only view your own leave records." });
            }
        }

        let query = `
            SELECT
                l.*,
                COALESCE(s.full_name, CONCAT(a.first_name, ' ', a.last_name)) AS full_name,
                s.doc_photo AS photo,
                COALESCE(s.employee_id, 'ADMIN') AS employee_id,
                COALESCE(s.designation, 'Institutional Admin') AS designation,
                COALESCE(s.department, 'Administration') AS department,
                COALESCE(s.staff_type, 'administrative') AS staff_type,
                reviewer.full_name AS reviewed_by_name
            FROM staff_leaves l
            LEFT JOIN staff s          ON l.staff_id    = s.id AND l.applicant_type != 'admin'
            LEFT JOIN admins a         ON l.staff_id    = a.id AND l.applicant_type = 'admin'
            LEFT JOIN staff reviewer ON l.reviewed_by = reviewer.id
            WHERE 1=1
        `;
        const params = [];
        if (status && status !== 'all') { query += ` AND l.status = ?`; params.push(status); }
        if (staff_id)                   { query += ` AND l.staff_id = ?`; params.push(staff_id); }
        if (applicant_type) {
            if (applicant_type !== 'admin') {
                // Allow staff-like roles to see their specific type OR legacy 'staff' records
                query += ` AND l.applicant_type IN (?, 'staff')`;
                params.push(applicant_type);
            } else {
                query += ` AND l.applicant_type = ?`;
                params.push(applicant_type);
            }
        }
        query += ` ORDER BY l.applied_at DESC`;

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * POST /api/hr/leaves
 * Body: { staff_id, leave_type, from_date, to_date, days, reason }
 * Apply a leave request.
 */
export const applyLeave = async (req, res) => {
    try {
        const { staff_id, applicant_type, leave_type, from_date, to_date, days, reason } = req.body;
        if (!staff_id || !from_date || !to_date) {
            return res.status(400).json({ error: 'staff_id, from_date and to_date are required' });
        }

        const type = applicant_type || 'staff';

        // Verify applicant exists
        const table = type === 'admin' ? 'admins' : 'staff';
        const [rows] = await db.query(`SELECT id FROM ${table} WHERE id = ?`, [staff_id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: `${type} account not found.` });
        }

        const [result] = await db.query(`
            INSERT INTO staff_leaves (staff_id, applicant_type, leave_type, from_date, to_date, days, reason, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
        `, [staff_id, type, leave_type || 'Casual Leave', from_date, to_date, days || 1, reason || '']);

        res.status(201).json({ message: 'Leave applied successfully', id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * PUT /api/hr/leaves/:id/action
 * Body: { status: 'approved'|'rejected', review_remarks }
 * HR approves or rejects a leave.
 */
export const reviewLeave = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, review_remarks } = req.body;
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Status must be approved or rejected' });
        }
        
        const reviewedBy = req.user?.id || null;
        const reviewerType = req.user?.userType || 'staff';

        // 🛡️ Prevent Self-Approval
        const [leave] = await db.query('SELECT staff_id, applicant_type FROM staff_leaves WHERE id = ?', [id]);
        if (leave.length > 0) {
            if (leave[0].staff_id === reviewedBy && leave[0].applicant_type === reviewerType) {
                return res.status(403).json({ error: 'Self-Approval Restricted: You cannot review your own leave application.' });
            }
        }

        await db.query(`
            UPDATE staff_leaves
            SET status = ?, review_remarks = ?, reviewed_by = ?, reviewed_at = NOW()
            WHERE id = ?
        `, [status, review_remarks || '', reviewedBy, id]);

        res.json({ message: `Leave ${status} successfully` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * DELETE /api/hr/leaves/:id
 * Cancel/delete a pending leave application.
 */
export const deleteLeave = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query(`DELETE FROM staff_leaves WHERE id = ? AND status = 'pending'`, [id]);
        if (result.affectedRows === 0) {
            return res.status(400).json({ error: 'Only pending leaves can be deleted' });
        }
        res.json({ message: 'Leave request deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * GET /api/hr/leaves/stats
 * Returns leave counts grouped by status and type.
 */
export const getLeaveStats = async (req, res) => {
    try {
        const [statusStats] = await db.query(`
            SELECT status, COUNT(*) as count FROM staff_leaves GROUP BY status
        `);
        const [typeStats] = await db.query(`
            SELECT leave_type, COUNT(*) as count FROM staff_leaves GROUP BY leave_type
        `);
        res.json({ byStatus: statusStats, byType: typeStats });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ── 📊 SALARY STRUCTURES ───────────────────────────────────────────────────

export const getSalaryStructures = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT s.id as staff_id, s.full_name, s.employee_id, s.designation, s.department,
                   COALESCE(ss.basic_salary, s.salary, 0) AS basic_salary,
                   COALESCE(ss.hra, 0)              AS hra,
                   COALESCE(ss.da, 0)               AS da,
                   COALESCE(ss.bonus, 0)            AS bonus,
                   COALESCE(ss.pf, 0)               AS pf,
                   COALESCE(ss.pt, 0)               AS pt,
                   COALESCE(ss.esic, 0)             AS esic,
                   COALESCE(ss.other_deductions, 0) AS other_deductions
            FROM staff s
            LEFT JOIN staff_salary_structures ss ON s.id = ss.staff_id
            WHERE s.status = 'active'
            ORDER BY s.full_name ASC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateSalaryStructure = async (req, res) => {
    try {
        const { staff_id, basic_salary, hra, da, bonus, pf, pt, esic, other_deductions } = req.body;
        await db.query(`
            INSERT INTO staff_salary_structures (staff_id, basic_salary, hra, da, bonus, pf, pt, esic, other_deductions)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                basic_salary      = VALUES(basic_salary),
                hra               = VALUES(hra),
                da                = VALUES(da),
                bonus             = VALUES(bonus),
                pf                = VALUES(pf),
                pt                = VALUES(pt),
                esic              = VALUES(esic),
                other_deductions  = VALUES(other_deductions)
        `, [staff_id, basic_salary, hra, da, bonus, pf, pt ?? 0, esic ?? 0, other_deductions]);
        res.json({ message: 'Salary structure updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ── 🏦 LOAN & ADVANCE MANAGEMENT ───────────────────────────────────────────

export const getLoans = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT sl.*, s.full_name, s.employee_id
            FROM staff_loans sl
            JOIN staff s ON sl.staff_id = s.id
            ORDER BY sl.created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const createLoan = async (req, res) => {
    try {
        const { staff_id, total_amount, emi_amount, reason } = req.body;
        await db.query(`
            INSERT INTO staff_loans (staff_id, total_amount, emi_amount, balance_amount, reason, status)
            VALUES (?, ?, ?, ?, ?, 'active')
        `, [staff_id, total_amount, emi_amount, total_amount, reason]);
        res.json({ message: 'Loan entry created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateLoan = async (req, res) => {
    try {
        const { id } = req.params;
        const { total_amount, reason } = req.body;
        await db.query(`
            UPDATE staff_loans 
            SET total_amount = ?, balance_amount = ?, reason = ?
            WHERE id = ?
        `, [total_amount, total_amount, reason, id]);
        res.json({ message: 'Loan entry updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteLoan = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query(`DELETE FROM staff_loans WHERE id = ?`, [id]);
        res.json({ message: 'Loan entry deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * GET /api/hr/profile/:id
 * Returns full profile details for a staff member.
 */
export const getProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query(`SELECT * FROM staff WHERE id = ?`, [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Staff profile not found' });
        }
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
