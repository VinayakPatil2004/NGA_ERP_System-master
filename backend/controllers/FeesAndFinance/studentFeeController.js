import db from '../../config/db.js';
import logger from '../../utils/logger.js';

/**
 * =========================================================
 *  GET STUDENT FEE LEDGER
 * =========================================================
 */
export const getStudentFeeLedgerData = async (activeYearId, grade = null, status = null) => {
    let query = `
    SELECT 
        s.id, 
        s.student_name, 
        s.student_id_no,
        s.gr_no,
        MAX(p.father_name) as father_name,
        MAX(p.father_mobile) as father_mobile,
        MAX(se.grade) as grade,
        IF(MAX(s.academic_year_id) = MAX(se.academic_year_id), 'new', 'old') AS student_type,
        COALESCE(SUM(pmt.discount_amount), 0) AS total_discount,

        -- 1. Transport Fee Target
        COALESCE(
            MAX(CASE WHEN LOWER(pmt.fee_type) LIKE '%transport%' THEN pmt.total_payable END),
            CASE 
                WHEN se.requires_transport = 1 THEN 
                    CASE 
                        WHEN se.transport_range = '0-5km' THEN MAX(tf.transport_0_5km)
                        WHEN se.transport_range = '5-7km' THEN MAX(tf.transport_5_7km)
                        ELSE MAX(tf.transport_above_7km)
                    END
                ELSE 0
            END
        ) AS transport_fee,

        -- 2. Annual Fee Target (Exclude consolidated Institutional Fee from here to prevent double counting)
        COALESCE(
            MAX(CASE WHEN LOWER(pmt.fee_type) = 'annual fee' THEN pmt.total_payable END),
            MAX(COALESCE(fs.admission_fee,0) + COALESCE(fs.tuition_fee,0) + COALESCE(fs.term_fee,0) + COALESCE(fs.computer_fee,0) + COALESCE(fs.other_fee,0))
        ) AS annual_fee,

        -- 3. Total Paid Amount
        COALESCE(SUM(pmt.paid_amount), 0) AS total_paid,

        -- 4. Total Payable (Consolidated)
        COALESCE(
            MAX(CASE WHEN LOWER(pmt.fee_type) = 'institutional fee' THEN pmt.total_payable END),
            (
                COALESCE(
                    MAX(CASE WHEN LOWER(pmt.fee_type) LIKE '%transport%' THEN pmt.total_payable END),
                    CASE 
                        WHEN se.requires_transport = 1 THEN 
                            CASE 
                                WHEN se.transport_range = '0-5km' THEN MAX(tf.transport_0_5km)
                                WHEN se.transport_range = '5-7km' THEN MAX(tf.transport_5_7km)
                                ELSE MAX(tf.transport_above_7km)
                            END
                        ELSE 0
                    END
                ) + 
                COALESCE(
                    MAX(CASE WHEN LOWER(pmt.fee_type) = 'annual fee' THEN pmt.total_payable END),
                    MAX(COALESCE(fs.admission_fee,0) + COALESCE(fs.tuition_fee,0) + COALESCE(fs.term_fee,0) + COALESCE(fs.computer_fee,0) + COALESCE(fs.other_fee,0))
                )
            )
        ) AS total_payable

    FROM students s

    JOIN student_enrollments se 
        ON s.id = se.student_id 

    JOIN academic_years ay 
        ON se.academic_year_id = ay.id 
        AND ay.id = ?

    LEFT JOIN parents p 
        ON s.id = p.student_id  

    LEFT JOIN payments pmt 
        ON s.id = pmt.student_id 
        AND pmt.academic_year_id = ay.id

    LEFT JOIN fee_structure fs
        ON fs.academic_year_id = ay.id
        AND fs.grade = se.grade
        AND fs.student_type = IF(s.academic_year_id = ay.id, 'new', 'old')

    LEFT JOIN transport_fees tf
        ON tf.academic_year_id = ay.id
    `;

    const params = [activeYearId];

    if (grade) {
        query += " WHERE se.grade = ?";
        params.push(grade);
    }

    query += " GROUP BY s.id, s.student_name, s.student_id_no, s.gr_no";

    if (status === 'paid') {
        query = `SELECT * FROM (${query}) AS sub WHERE total_paid >= total_payable AND total_payable > 0`;
    } else if (status === 'pending') {
        query = `SELECT * FROM (${query}) AS sub WHERE total_paid < total_payable`;
    }

    const [rows] = await db.query(query, params);

    return rows.map(r => {
        const annual = Number(r.annual_fee) || 0;
        const transport = Number(r.transport_fee) || 0;
        const discount = Number(r.total_discount) || 0;
        const total = (Number(r.total_payable) || 0) - discount;
        const paid = Number(r.total_paid) || 0;
        
        return {
            id: r.id,
            name: r.student_name,
            studentIdNo: r.student_id_no,
            fatherName: r.father_name || '-',
            contact: r.father_mobile,
            grade: r.grade,
            studentType: r.student_type || 'old',
            annual_fee: annual,
            transport_fee: transport,
            discount_amount: discount,
            totalPayable: total,
            totalPaid: paid,
            status: paid >= total && total > 0 ? 'paid' : 'pending'
        };
    });
};

export const getStudentFeeLedger = async (req, res) => {
    try {
        const { academicYearId, grade, status } = req.query;

        let activeYearId = academicYearId;

        if (!activeYearId) {
            const [year] = await db.query(`
                SELECT id FROM academic_years WHERE is_active = 1 LIMIT 1
            `);
            if (!year.length) {
                return res.status(400).json({
                    error: "No active academic year found"
                });
            }
            activeYearId = year[0].id;
        }

        const ledger = await getStudentFeeLedgerData(activeYearId, grade, status);
        res.json(ledger);

    } catch (error) {
        logger.error("Ledger Error:", error);
        res.status(500).json({ error: "Ledger fetch failed." });
    }
};


/**
 * =========================================================
 * ðŸ’³ RECORD PAYMENT (AUTO DISTRIBUTION)
 * =========================================================
 */
export const recordPayment = async (req, res) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const {
            student_id,
            academic_year_id,
            amount,
            payment_method,
            details,
            remark,
            total_payable,
            transport_amount,
            class: studentClass,
            fee,
            paid,
            balance,
            term,
            discount_amount
        } = req.body;
        const today = new Date().toISOString().split('T')[0];

        // Parse details if it's a string (from FormData)
        let parsedDetails = details;
        if (typeof details === 'string') {
            try {
                parsedDetails = JSON.parse(details);
            } catch (e) {
                parsedDetails = {};
            }
        }

        const attachment_url = req.file ? req.file.filename : null;

        // 1. Remove the auto-generated "debt placeholder" row if it exists.
        // This ensures the student's history only shows actual payment installments.
        await connection.query(`
            DELETE FROM payments 
            WHERE student_id = ? AND academic_year_id = ? 
              AND status = 'pending' 
              AND remarks LIKE 'Auto:%' 
              AND (paid_amount IS NULL OR paid_amount = 0)
        `, [student_id, academic_year_id]);

        // 1.5 Duplicate Check (Institutional Integrity)
        const transaction_id = req.body.transaction_number || parsedDetails?.transactionId || null;
        const cheque_no = req.body.cheque_number || parsedDetails?.chequeNo || null;

        if (transaction_id || cheque_no) {
            const [duplicate] = await connection.query(`
                SELECT id FROM payments 
                WHERE (transaction_id = ? AND transaction_id IS NOT NULL AND transaction_id != '') 
                   OR (cheque_no = ? AND cheque_no IS NOT NULL AND cheque_no != '')
                LIMIT 1
            `, [transaction_id, cheque_no]);

            if (duplicate.length > 0) {
                await connection.rollback();
                return res.status(400).json({ error: "Duplicate transaction detected (Transaction ID or Cheque No already exists)" });
            }
        }

        // 2. Extract consolidated fields
        const cheque_date = req.body.cheque_date || parsedDetails?.date || null;
        const bank_name = req.body.bank_name || parsedDetails?.bankName || null;
        const payer_name = req.body.payer_name || parsedDetails?.payerName || null;
        const payer_mobile = req.body.mobile_number || parsedDetails?.mobileNo || null;
        const receiver_name = req.body.receiver_name || parsedDetails?.receiverName || 'Admin Desk';

        // ðŸš€ AUTO-GENERATE RECEIPT NUMBER
        const receipt_no = `NGA/FEE/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;

        // 3. Insert ONE consolidated row
        await connection.query(`
            INSERT INTO payments (
                student_id, academic_year_id, total_payable, paid_amount, pending_amount,
                payment_method, payment_date, transaction_id, bank_name, payer_name,
                payer_mobile, remarks, attachment_url, term_no, status, fee_type,
                cheque_no, cheque_date, receipt_no, discount_amount
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            student_id,
            academic_year_id,
            total_payable || 0,
            amount || 0,
            balance || 0,
            payment_method || 'cash',
            today,
            transaction_id,
            bank_name,
            payer_name,
            payer_mobile,
            remark,
            attachment_url,
            term === 'Term 2' ? 2 : 1,
            Number(balance) <= 0 ? 'paid' : 'pending',
            'Institutional Fee',
            cheque_no,
            cheque_date,
            receipt_no,
            discount_amount || 0
        ]);

        await connection.commit();
        res.json({ message: "Consolidated payment recorded successfully", receipt_no });
    } catch (error) {
        await connection.rollback();
        console.error("Error recording consolidated payment:", error);
        res.status(500).json({ error: "Institutional storage failed" });
    } finally {
        connection.release();
    }
};

export const updateStudentPayment = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { id } = req.params;
        const {
            amount,
            payment_method,
            details,
            remark,
            total_payable,
            balance,
            term
        } = req.body;

        let parsedDetails = details;
        if (typeof details === 'string') {
            try { parsedDetails = JSON.parse(details); } catch (e) { parsedDetails = {}; }
        }

        const transaction_id = req.body.transaction_number || parsedDetails?.transactionId || null;
        const cheque_no = req.body.cheque_number || parsedDetails?.chequeNo || null;
        const cheque_date = req.body.cheque_date || parsedDetails?.date || null;
        const bank_name = req.body.bank_name || parsedDetails?.bankName || null;
        const payer_name = req.body.payer_name || parsedDetails?.payerName || null;
        const payer_mobile = req.body.mobile_number || parsedDetails?.mobileNo || null;

        let updateQuery = `
            UPDATE payments SET 
                paid_amount = ?,
                pending_amount = ?,
                payment_method = ?,
                transaction_id = ?,
                bank_name = ?,
                payer_name = ?,
                payer_mobile = ?,
                remarks = ?,
                term_no = ?,
                status = ?,
                cheque_no = ?,
                cheque_date = ?
        `;

        let queryParams = [
            amount || 0,
            balance || 0,
            payment_method || 'cash',
            transaction_id,
            bank_name,
            payer_name,
            payer_mobile,
            remark,
            term === 'Term 2' ? 2 : 1,
            Number(balance) <= 0 ? 'paid' : 'pending',
            cheque_no,
            cheque_date
        ];

        // Only update attachment if a new file is uploaded
        if (req.file) {
            updateQuery += `, attachment_url = ?`;
            queryParams.push(req.file.filename);
        }

        updateQuery += ` WHERE id = ?`;
        queryParams.push(id);

        await connection.query(updateQuery, queryParams);

        await connection.commit();
        res.json({ message: "Payment updated successfully" });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ error: "Update failed" });
    } finally {
        connection.release();
    }
};

/**
 * =========================================================
 * ðŸ’³ FORM PAYMENT ENTRY (MODAL)
 * =========================================================
 */
export const createStudentPaymentEntry = async (req, res) => {
    try {
        const {
            payment_id,
            amount,
            payment_method,
            payment_date
        } = req.body;

        if (!payment_id || !amount) {
            return res.status(400).json({
                message: "payment_id and amount are required"
            });
        }

        // 1. Get existing payment row
        const [rows] = await db.query(
            `SELECT * FROM payments WHERE id = ?`,
            [payment_id]
        );

        if (!rows.length) {
            return res.status(404).json({
                message: "Payment record not found"
            });
        }

        const payment = rows[0];

        const currentPaid = Number(payment.paid_amount) || 0;
        const totalPayable = Number(payment.total_payable) || 0;
        const currentPending = Number(payment.pending_amount) || 0;
        const payAmount = Number(amount) || 0;

        //  BLOCK OVERPAYMENT
        if (payAmount > currentPending) {
            return res.status(400).json({
                message: "Amount exceeds pending fee"
            });
        }

        // âœ… SAFE CALCULATION (FIXED)
        const newPaid = parseFloat((currentPaid + payAmount).toFixed(2));
        const newPendingRaw = parseFloat((totalPayable - newPaid).toFixed(2));

        // ðŸš¨ FIX NEGATIVE EDGE CASE
        const newPending = newPendingRaw < 0 ? 0 : newPendingRaw;

        // âœ… STATUS LOGIC
        let status = "pending";
        if (newPending === 0) status = "paid";
        else if (newPaid > 0) status = "partial";

        // 3. Update ONLY this row
        await db.query(`
            UPDATE payments
            SET 
                paid_amount = ?,
                pending_amount = ?,
                status = ?,
                payment_method = ?,
                payment_date = ?
            WHERE id = ?
        `, [
            newPaid,
            newPending,
            status,
            payment_method || "cash",
            payment_date || new Date(),
            payment_id
        ]);

        return res.json({
            message: "Payment recorded successfully",
            data: {
                paid_amount: newPaid,
                pending_amount: newPending,
                status
            }
        });

    } catch (error) {
        console.error("Payment Entry Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const syncInstitutionalFees = async (req, res) => {
    try {
        const { academic_year_id } = req.body;

        if (!academic_year_id) {
            return res.status(400).json({
                error: "academic_year_id is required"
            });
        }

        console.log("ðŸ”„ Sync started for AY:", academic_year_id);

        // 0. CLEANUP: Remove existing AUTO-GENERATED PENDING entries to prevent duplicates
        await db.query(`
            DELETE FROM payments 
            WHERE academic_year_id = ? 
            AND status = 'pending' 
            AND remarks LIKE 'Auto:%'
        `, [academic_year_id]);

        // 1. Get all active students
        const [students] = await db.query(`
    SELECT 
        s.id,
        se.grade,
        se.requires_transport,
        se.transport_range,
        s.academic_year_id
    FROM students s
    JOIN student_enrollments se 
        ON s.id = se.student_id
    WHERE se.academic_year_id = ?
`, [academic_year_id]);

        if (!students.length) {
            return res.json({
                message: "No students found",
                entries_created: 0
            });
        }

        // 2. Get fee structure for this year
        const [feeStructure] = await db.query(`
            SELECT * FROM fee_structure WHERE academic_year_id = ?
        `, [academic_year_id]);

        // 3. Get transport fees
        const [transportFees] = await db.query(`
            SELECT * FROM transport_fees
            WHERE academic_year_id = ?
        `, [academic_year_id]);

        const transport = transportFees[0];

        let entries = [];

        for (let student of students) {
            const studentType = Number(student.academic_year_id) === Number(academic_year_id) ? 'new' : 'old';

            const studentFeeRow = feeStructure.find(f =>
                String(f.grade).replace(/\D/g, '') === String(student.grade).replace(/\D/g, '') &&
                f.student_type === studentType
            );

            if (!studentFeeRow) continue;

            // Calculate total annual fee from structure
            const annualTotal =
                Number(studentFeeRow.admission_fee || 0) +
                Number(studentFeeRow.tuition_fee || 0) +
                Number(studentFeeRow.term_fee || 0) +
                Number(studentFeeRow.computer_fee || 0) +
                Number(studentFeeRow.other_fee || 0);

            // Calculate transport if applicable
            let transportAmount = 0;
            if (student.requires_transport && transport) {
                if (student.transport_range === '0-5km') transportAmount = transport.transport_0_5km;
                else if (student.transport_range === '5-7km') transportAmount = transport.transport_5_7km;
                else transportAmount = transport.transport_above_7km;
            }

            const grandTotal = annualTotal + transportAmount;

            if (grandTotal > 0) {
                entries.push([
                    student.id,
                    'Institutional Fee', // Consolidated fee type
                    grandTotal,
                    0,
                    grandTotal,
                    'pending',
                    new Date(),
                    `Auto: Combined Fee Structure`,
                    1, // Default to Term 1 for the whole year record
                    academic_year_id
                ]);
            }
        }

        if (!entries.length) {
            return res.json({
                message: "No entries generated",
                entries_created: 0
            });
        }


        await db.query(`
            INSERT INTO payments (
                student_id,
                fee_type,
                total_payable,
                paid_amount,
                pending_amount,
                status,
                payment_date,
                remarks,
                term_no,
                academic_year_id
            ) VALUES ?
        `, [entries]);

        console.log("âœ… Sync completed:", entries.length);

        res.json({
            message: "Sync completed",
            entries_created: entries.length
        });

    } catch (error) {
        console.error("âŒ Sync Error FULL:", error);
        res.status(500).json({
            error: "Sync failed"
        });
    }
};

export const getStudentPaymentDetails = async (req, res) => {
    try {
        const { student_id } = req.query;

        if (!student_id) {
            return res.status(400).json({
                message: "student_id is required"
            });
        }

        const [rows] = await db.query(`
            SELECT 
                id,
                fee_type,
                term_no,
                paid_amount,
                pending_amount,
                payment_method,
                payment_date,
                transaction_id,
                cheque_no,
                payer_name,
                bank_name,
                attachment_url,
                remarks
            FROM payments
            WHERE student_id = ?
              AND (paid_amount > 0 OR pending_amount > 0)
            ORDER BY payment_date DESC, term_no ASC
        `, [student_id]);

        res.json(rows);

    } catch (error) {
        console.error("âŒ Payment Details Error:", error);
        res.status(500).json({
            message: "Failed to fetch payment details"
        });
    }
};

export const getStudentDueReport = async (req, res) => {
    try {
        const { className, academicYearId } = req.query;

        let activeYearId = academicYearId;

        if (!activeYearId) {
            const [year] = await db.query(`
                SELECT id FROM academic_years WHERE is_active = 1 LIMIT 1
            `);
            if (!year.length) {
                return res.status(400).json({
                    error: "No active academic year found"
                });
            }
            activeYearId = year[0].id;
        }

        let query = `
        SELECT 
            s.id, 
            s.student_name AS name, 
            MAX(p.father_name) as father,
            MAX(p.father_mobile) as contact,
            MAX(se.grade) as class,
            COALESCE(SUM(pmt.discount_amount), 0) AS discount_amount,

            -- 1. Transport Fee Target
            COALESCE(
                MAX(CASE WHEN LOWER(pmt.fee_type) LIKE '%transport%' THEN pmt.total_payable END),
                CASE 
                    WHEN se.requires_transport = 1 THEN 
                        CASE 
                            WHEN se.transport_range = '0-5km' THEN MAX(tf.transport_0_5km)
                            WHEN se.transport_range = '5-7km' THEN MAX(tf.transport_5_7km)
                            ELSE MAX(tf.transport_above_7km)
                        END
                    ELSE 0
                END
            ) AS transport,

            -- 2. Annual Fee Target (Exclude consolidated Institutional Fee from here to prevent double counting)
            COALESCE(
                MAX(CASE WHEN LOWER(pmt.fee_type) = 'annual fee' THEN pmt.total_payable END),
                MAX(COALESCE(fs.admission_fee,0) + COALESCE(fs.tuition_fee,0) + COALESCE(fs.term_fee,0) + COALESCE(fs.computer_fee,0) + COALESCE(fs.other_fee,0))
            ) AS fee,

            -- 3. Total Paid Amount
            COALESCE(SUM(pmt.paid_amount), 0) AS paid,

            -- 4. Total Payable (Consolidated)
            COALESCE(
                MAX(CASE WHEN LOWER(pmt.fee_type) = 'institutional fee' THEN pmt.total_payable END),
                (
                    COALESCE(
                        MAX(CASE WHEN LOWER(pmt.fee_type) LIKE '%transport%' THEN pmt.total_payable END),
                        CASE 
                            WHEN se.requires_transport = 1 THEN 
                                CASE 
                                    WHEN se.transport_range = '0-5km' THEN MAX(tf.transport_0_5km)
                                    WHEN se.transport_range = '5-7km' THEN MAX(tf.transport_5_7km)
                                    ELSE MAX(tf.transport_above_7km)
                                END
                            ELSE 0
                        END
                    ) + 
                    COALESCE(
                        MAX(CASE WHEN LOWER(pmt.fee_type) = 'annual fee' THEN pmt.total_payable END),
                        MAX(COALESCE(fs.admission_fee,0) + COALESCE(fs.tuition_fee,0) + COALESCE(fs.term_fee,0) + COALESCE(fs.computer_fee,0) + COALESCE(fs.other_fee,0))
                    )
                )
            ) AS total_annual_fee

        FROM students s

        JOIN student_enrollments se 
            ON s.id = se.student_id 

        JOIN academic_years ay 
            ON se.academic_year_id = ay.id 
            AND ay.id = ?

        LEFT JOIN parents p 
            ON s.id = p.student_id  

        LEFT JOIN payments pmt 
            ON s.id = pmt.student_id 
            AND pmt.academic_year_id = ay.id

        LEFT JOIN fee_structure fs
            ON fs.academic_year_id = ay.id
            AND fs.grade = se.grade

        LEFT JOIN transport_fees tf
            ON tf.academic_year_id = ay.id
        `;

        const params = [activeYearId];

        if (className && className !== 'ALL CLASSES') {
            query += " WHERE se.grade = ?";
            params.push(className);
        }

        query += " GROUP BY s.id, s.student_name";

        // ONLY get pending dues (total_paid < total_payable)
        query = `SELECT * FROM (${query}) AS sub WHERE paid < total_annual_fee`;

        const [rows] = await db.query(query, params);

        let totalFees = 0;
        let totalPending = 0;
        let totalTransport = 0;

        const result = rows.map(r => {
            const fee = Number(r.fee) || 0;
            const transport = Number(r.transport) || 0;
            const discount = Number(r.discount_amount) || 0;
            const paid = Number(r.paid) || 0;
            const total = Number(r.total_annual_fee) || 0;
            const balance = total - paid;
            
            totalFees += total;
            totalPending += balance;
            totalTransport += transport;

            return {
                id: r.id,
                name: r.name,
                father: r.father || '-',
                contact: r.contact,
                class: r.class,
                fee: fee,
                discount_amount: discount,
                transport: transport,
                total_annual_fee: total,
                paid: paid,
                balance: balance
            };
        });
        
        const totalStudents = result.length;

        res.json({
            summary: {
                totalStudents,
                totalFees: Number(totalFees.toFixed(2)),
                totalPending: Number(totalPending.toFixed(2)),
                totalTransport: Number(totalTransport.toFixed(2))
            },
            data: result
        });

    } catch (error) {
        console.error("❌ Due Report Error:", error);
        res.status(500).json({
            message: "Error generating due report"
        });
    }
};

export const getDateWiseCollectionReport = async (req, res) => {
    try {
        const { from_date, to_date, academicYearId } = req.query;

        // =============================
        // 1. GET PAYMENTS WITH STUDENT DATA
        // =============================
        let query = `
            SELECT 
                p.id,
                p.student_id,
                p.paid_amount,
                p.payment_method,
                p.payment_date,
                s.student_name,
                s.current_grade,
                COALESCE(p.discount_amount, 0) AS discount_amount
            FROM payments p
            JOIN students s ON s.id = p.student_id
            LEFT JOIN student_enrollments se 
                ON se.student_id = p.student_id 
                AND se.academic_year_id = p.academic_year_id
            WHERE p.paid_amount > 0
        `;

        const params = [];

        // Academic Year filter
        if (academicYearId) {
            query += ` AND p.academic_year_id = ?`;
            params.push(academicYearId);
        }

        // Date filter
        if (from_date && to_date) {
            query += ` AND DATE(p.payment_date) BETWEEN ? AND ?`;
            params.push(from_date, to_date);
        }

        // Latest first
        query += ` ORDER BY p.payment_date DESC`;

        const [rows] = await db.query(query, params);

        // =============================
        // 2. CALCULATE SUMMARY
        // =============================
        let cash = 0;
        let upi = 0;
        let online = 0;
        let cheque = 0;

        rows.forEach(r => {
            const amount = Number(r.paid_amount || 0);

            switch ((r.payment_method || '').toLowerCase()) {
                case 'cash':
                    cash += amount;
                    break;
                case 'upi':
                    upi += amount;
                    break;
                case 'online':
                    online += amount;
                    break;
                case 'cheque':
                    cheque += amount;
                    break;
            }
        });

        // =============================
        // 3. FORMAT TABLE DATA
        // =============================
        const data = rows.map((r, index) => ({
            sr_no: index + 1,
            date: r.payment_date,
            student_name: r.student_name,
            class: r.current_grade,
            payment_mode: r.payment_method,
            discount_amount: Number(r.discount_amount || 0),
            credit: Number(r.paid_amount)
        }));

        // =============================
        // 4. RESPONSE
        // =============================
        res.json({
            summary: {
                cash: Number(cash.toFixed(2)),
                upi: Number(upi.toFixed(2)),
                online: Number(online.toFixed(2)),
                cheque: Number(cheque.toFixed(2))
            },
            data
        });

    } catch (error) {
        console.error(" Date-wise Report Error:", error);
        res.status(500).json({
            message: "Error generating collection report"
        });
    }
};
