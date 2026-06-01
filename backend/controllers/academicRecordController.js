import pool from '../config/db.js';

export const getAcademicRecordsByClassroom = async (req, res) => {
    try {
        const { classroom_id } = req.params;
        let { academic_year_id } = req.query;

        if (!academic_year_id || academic_year_id === 'undefined') {
            const [[classroom]] = await pool.query("SELECT academic_year_id FROM classrooms WHERE id = ?", [classroom_id]);
            academic_year_id = classroom?.academic_year_id;
            
            if (!academic_year_id) {
                const [[activeYear]] = await pool.query("SELECT id FROM academic_years WHERE is_active = 1 LIMIT 1");
                academic_year_id = activeYear?.id;
            }
        }

        const query = `
            SELECT ar.*, CONCAT(s.last_name, ', ', s.first_name, ' ', s.middle_name) as student_name, s.student_id_no
            FROM academic_records ar
            JOIN student_enrollments se ON ar.student_id = se.student_id
            JOIN students s ON ar.student_id = s.id
            WHERE se.classroom_id = ? AND se.academic_year_id = ?
        `;
        const [rows] = await pool.query(query, [classroom_id, academic_year_id]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

export const getAcademicRecordByStudent = async (req, res) => {
    try {
        const { student_id } = req.params;
        
        // Fetch academic history from enrollments and join with aggregated data
        // Uses same COALESCE fee logic as studentFeeController for consistency
        const query = `
            SELECT 
                se.id as enrollment_id,
                se.academic_year_id,
                se.roll_number,
                se.grade,
                se.status as enrollment_status,
                ay.year_name,
                ar.obtained_marks,
                ar.total_marks,
                ar.percentage,
                ar.result,
                (SELECT COUNT(*) 
                 FROM student_attendance 
                 WHERE student_id = se.student_id 
                 AND status = 'present'
                 AND classroom_id = se.classroom_id) as present_days,
                (SELECT COUNT(*) 
                 FROM student_attendance 
                 WHERE student_id = se.student_id 
                 AND classroom_id = se.classroom_id) as total_days,
                (SELECT status FROM payments 
                 WHERE student_id = se.student_id 
                 AND academic_year_id = se.academic_year_id
                 ORDER BY payment_date DESC LIMIT 1) as latest_payment_status,

                -- ── Total Paid per year (matches studentFeeController) ──
                COALESCE((SELECT SUM(paid_amount) FROM payments 
                 WHERE student_id = se.student_id
                 AND academic_year_id = se.academic_year_id), 0) as total_paid,

                -- ── Total Discount per year ──
                COALESCE((SELECT SUM(discount_amount) FROM payments 
                 WHERE student_id = se.student_id
                 AND academic_year_id = se.academic_year_id), 0) as total_discount,

                -- ── Transport Fee (same COALESCE logic as ledger) ──
                COALESCE(
                    (SELECT total_payable FROM payments 
                     WHERE student_id = se.student_id 
                     AND academic_year_id = se.academic_year_id 
                     AND LOWER(fee_type) LIKE '%transport%' LIMIT 1),
                    CASE 
                        WHEN se.requires_transport = 1 THEN 
                            CASE 
                                WHEN se.transport_range = '0-5km' THEN COALESCE(tf.transport_0_5km, 0)
                                WHEN se.transport_range = '5-7km' THEN COALESCE(tf.transport_5_7km, 0)
                                ELSE COALESCE(tf.transport_above_7km, 0)
                            END
                        ELSE 0
                    END
                ) AS transport_fee,

                -- ── Annual Fee (from fee_structure or recorded payment) ──
                COALESCE(
                    (SELECT total_payable FROM payments 
                     WHERE student_id = se.student_id 
                     AND academic_year_id = se.academic_year_id 
                     AND LOWER(fee_type) = 'annual fee' LIMIT 1),
                    COALESCE(fs.admission_fee,0) + COALESCE(fs.tuition_fee,0) + COALESCE(fs.term_fee,0) + COALESCE(fs.computer_fee,0) + COALESCE(fs.other_fee,0)
                ) AS annual_fee,

                -- ── Total Fee Payable (consolidated, exact same as ledger query) ──
                COALESCE(
                    (SELECT total_payable FROM payments 
                     WHERE student_id = se.student_id 
                     AND academic_year_id = se.academic_year_id 
                     AND LOWER(fee_type) = 'institutional fee' LIMIT 1),
                    (
                        COALESCE(
                            (SELECT total_payable FROM payments 
                             WHERE student_id = se.student_id 
                             AND academic_year_id = se.academic_year_id 
                             AND LOWER(fee_type) LIKE '%transport%' LIMIT 1),
                            CASE 
                                WHEN se.requires_transport = 1 THEN 
                                    CASE 
                                        WHEN se.transport_range = '0-5km' THEN COALESCE(tf.transport_0_5km, 0)
                                        WHEN se.transport_range = '5-7km' THEN COALESCE(tf.transport_5_7km, 0)
                                        ELSE COALESCE(tf.transport_above_7km, 0)
                                    END
                                ELSE 0
                            END
                        ) +
                        COALESCE(
                            (SELECT total_payable FROM payments 
                             WHERE student_id = se.student_id 
                             AND academic_year_id = se.academic_year_id 
                             AND LOWER(fee_type) = 'annual fee' LIMIT 1),
                            COALESCE(fs.admission_fee,0) + COALESCE(fs.tuition_fee,0) + COALESCE(fs.term_fee,0) + COALESCE(fs.computer_fee,0) + COALESCE(fs.other_fee,0)
                        )
                    )
                ) AS total_fee

            FROM student_enrollments se
            JOIN students s ON se.student_id = s.id
            JOIN academic_years ay ON se.academic_year_id = ay.id
            LEFT JOIN academic_records ar ON se.student_id = ar.student_id AND ay.year_name = ar.academic_year
            LEFT JOIN fee_structure fs ON fs.academic_year_id = se.academic_year_id AND fs.grade = se.grade
                AND fs.student_type = IF(s.academic_year_id = se.academic_year_id, 'new', 'old')
            LEFT JOIN transport_fees tf ON tf.academic_year_id = se.academic_year_id
            WHERE se.student_id = ?
            ORDER BY ay.id DESC
        `;
        
        const [rows] = await pool.query(query, [student_id]);
        
        // Compute pending_fee and attendance value on the backend
        const formattedRows = rows.map(row => {
            const annual_fee     = Number(row.annual_fee)     || 0;
            const transport_fee  = Number(row.transport_fee)  || 0;
            const total_discount = Number(row.total_discount) || 0;
            const total_paid     = Number(row.total_paid)     || 0;

            // Compute total fee dynamically matching StudentFeeAssignment.jsx
            const total_fee      = Math.max(0, annual_fee - total_discount) + transport_fee;
            const net_fee        = total_fee;
            const pending_fee    = Math.max(0, total_fee - total_paid);

            return {
                ...row,
                total_fee,
                total_paid,
                total_discount,
                net_fee,
                pending_fee,
                transport_fee,
                annual_fee,
                attendance_value: row.total_days > 0 ? (row.present_days / row.total_days) * 100 : 0,
                fee_status_label: net_fee > 0 && pending_fee <= 0 ? 'fully paid' :
                                  total_paid > 0 ? 'partial' : 'unpaid'
            };
        });

        res.json(formattedRows);
    } catch (error) {
        console.error("Historical Report Fetch Error:", error);
        res.status(500).json({ error: error.message });
    }
};
