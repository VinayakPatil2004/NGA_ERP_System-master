import pool from '../config/db.js';

/**
 * Get Timetable Settings
 */
export const getSettings = async (req, res) => {
    try {
        const { academic_year_id } = req.query;
        if (!academic_year_id) return res.status(400).json({ error: "Academic Year ID required" });

        const [rows] = await pool.query(
            "SELECT * FROM timetable_settings WHERE academic_year_id = ?",
            [academic_year_id]
        );
        res.json(rows[0] || {
            school_start_time: '08:05:00',
            school_end_time: '14:00:00',
            first_lecture_start: '08:15:00',
            lecture_duration: 35,
            short_recess_start: '10:00:00',
            short_recess_end: '10:10:00',
            long_recess_start: '11:55:00',
            long_recess_end: '12:15:00'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Update Timetable Settings
 */
export const updateSettings = async (req, res) => {
    try {
        const { 
            academic_year_id, school_start_time, school_end_time, 
            first_lecture_start, lecture_duration,
            short_recess_start, short_recess_end, 
            long_recess_start, long_recess_end 
        } = req.body;
        
        await pool.query(
            `INSERT INTO timetable_settings (
                academic_year_id, school_start_time, school_end_time, 
                first_lecture_start, lecture_duration,
                short_recess_start, short_recess_end, 
                long_recess_start, long_recess_end
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
             school_start_time = VALUES(school_start_time),
             school_end_time = VALUES(school_end_time),
             first_lecture_start = VALUES(first_lecture_start),
             lecture_duration = VALUES(lecture_duration),
             short_recess_start = VALUES(short_recess_start),
             short_recess_end = VALUES(short_recess_end),
             long_recess_start = VALUES(long_recess_start),
             long_recess_end = VALUES(long_recess_end)`,
            [
                academic_year_id, school_start_time, school_end_time, 
                first_lecture_start, lecture_duration,
                short_recess_start, short_recess_end, 
                long_recess_start, long_recess_end
            ]
        );
        res.json({ message: "Institutional timings synchronized" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get Subject Rules
 */
export const getSubjectRules = async (req, res) => {
    try {
        const { classroom_id, academic_year_id } = req.query;
        const [rows] = await pool.query(
            "SELECT * FROM timetable_subject_rules WHERE classroom_id = ? AND academic_year_id = ?",
            [classroom_id, academic_year_id]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Upsert Subject Rule
 */
export const upsertSubjectRule = async (req, res) => {
    try {
        const { classroom_id, subject_name, max_periods_per_day, max_periods_per_week, academic_year_id } = req.body;
        await pool.query(
            `INSERT INTO timetable_subject_rules (classroom_id, subject_name, max_periods_per_day, max_periods_per_week, academic_year_id)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
             max_periods_per_day = VALUES(max_periods_per_day),
             max_periods_per_week = VALUES(max_periods_per_week)`,
            [classroom_id, subject_name, max_periods_per_day, max_periods_per_week, academic_year_id]
        );
        res.json({ message: "Repetition constraints updated" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Create Timetable Slot
 */
export const saveTimetableSlot = async (req, res) => {
    try {
        const { 
            classroom_id, teacher_id, subject_name, day_of_week, 
            period_number, start_time, end_time, academic_year_id,
            is_break, break_label
        } = req.body;

        // 1. Conflict Detection: Teacher Busy
        if (!is_break && teacher_id) {
            const [teacherConflicts] = await pool.query(
                `SELECT ct.*, c.class_name 
                 FROM class_timetable ct
                 JOIN classrooms c ON ct.classroom_id = c.id
                 WHERE ct.teacher_id = ? AND ct.day_of_week = ? AND ct.period_number = ? AND ct.academic_year_id = ? AND ct.classroom_id != ?`,
                [teacher_id, day_of_week, period_number, academic_year_id, classroom_id]
            );

            if (teacherConflicts.length > 0) {
                return res.status(409).json({ 
                    error: `Faculty conflict identified. This teacher is already assigned to ${teacherConflicts[0].class_name} during this period.`
                });
            }
        }

        // 2. Rule Enforcement: Subject Daily/Weekly Limits
        if (!is_break) {
            const [[rule]] = await pool.query(
                "SELECT * FROM timetable_subject_rules WHERE classroom_id = ? AND subject_name = ? AND academic_year_id = ?",
                [classroom_id, subject_name, academic_year_id]
            );

            if (rule) {
                // Check Daily Limit
                const [[{ dailyCount }]] = await pool.query(
                    "SELECT COUNT(*) as dailyCount FROM class_timetable WHERE classroom_id = ? AND subject_name = ? AND day_of_week = ? AND academic_year_id = ?",
                    [classroom_id, subject_name, day_of_week, academic_year_id]
                );

                if (dailyCount >= rule.max_periods_per_day) {
                    return res.status(403).json({ error: `Daily limit exceeded. Maximum ${rule.max_periods_per_day} periods for ${subject_name} allowed.` });
                }

                // Check Weekly Limit
                const [[{ weeklyCount }]] = await pool.query(
                    "SELECT COUNT(*) as weeklyCount FROM class_timetable WHERE classroom_id = ? AND subject_name = ? AND academic_year_id = ?",
                    [classroom_id, subject_name, academic_year_id]
                );

                if (weeklyCount >= rule.max_periods_per_week) {
                    return res.status(403).json({ error: `Weekly limit exceeded. Maximum ${rule.max_periods_per_week} periods for ${subject_name} per week allowed.` });
                }
            }
        }

        // 3. Save Assignment
        await pool.query(
            `INSERT INTO class_timetable 
             (classroom_id, teacher_id, subject_name, day_of_week, period_number, start_time, end_time, academic_year_id, is_break, break_label)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
             teacher_id = VALUES(teacher_id),
             subject_name = VALUES(subject_name),
             start_time = VALUES(start_time),
             end_time = VALUES(end_time),
             is_break = VALUES(is_break),
             break_label = VALUES(break_label)`,
            [classroom_id, teacher_id, subject_name, day_of_week, period_number, start_time, end_time, academic_year_id, is_break, break_label]
        );

        res.status(201).json({ message: "Timetable slot synchronized successfully" });
    } catch (error) {
        console.error("Save Timetable Error:", error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get Timetable for Classroom
 */
export const getClassTimetable = async (req, res) => {
    try {
        const { classroom_id } = req.params;
        const { academic_year_id } = req.query;
        
        if (!classroom_id || !academic_year_id) {
            return res.status(400).json({ error: "Classroom ID and Academic Year ID are required" });
        }

        console.log(`[GET TIMETABLE] Classroom: ${classroom_id}, Year: ${academic_year_id}`);
        const [rows] = await pool.query(
            `SELECT ct.*, s.full_name as teacher_name 
             FROM class_timetable ct
             LEFT JOIN staff s ON ct.teacher_id = s.id
             WHERE ct.classroom_id = ? AND ct.academic_year_id = ?
             ORDER BY ct.start_time ASC`,
            [classroom_id, academic_year_id]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get Timetable for Teacher
 */
export const getTeacherTimetable = async (req, res) => {
    try {
        const { teacher_id } = req.params;
        const { academic_year_id } = req.query;
        
        const [rows] = await pool.query(
            `SELECT ct.*, c.class_name, c.section
             FROM class_timetable ct
             JOIN classrooms c ON ct.classroom_id = c.id
             WHERE ct.teacher_id = ? AND ct.academic_year_id = ?
             ORDER BY ct.start_time ASC`,
            [teacher_id, academic_year_id]
        );

        // Map subject_name to include class_name for teacher view
        const results = rows.map(r => ({
            ...r,
            subject_name: `${r.class_name} ${r.subject_name}`
        }));

        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Delete Timetable Slot
 */
export const deleteTimetableSlot = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query("DELETE FROM class_timetable WHERE id = ?", [id]);
        res.json({ message: "Assignment removed from registry" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Auto-Generate Timetable for Classroom
 */
export const autoGenerateTimetable = async (req, res) => {
    try {
        const { classroom_id, academic_year_id } = req.body;
        if (!classroom_id || !academic_year_id) return res.status(400).json({ error: "Classroom and Year ID required" });

        // 1. Get Timetable Settings
        const [settingsRows] = await pool.query(
            "SELECT * FROM timetable_settings WHERE academic_year_id = ?",
            [academic_year_id]
        );
        const settings = settingsRows[0];
        if (!settings) return res.status(400).json({ error: "Global timetable settings not found. Please configure them in Timetable Manager first." });

        // 2. Get Class Subjects
        const [subjects] = await pool.query(
            "SELECT subject_name, teacher_id FROM class_subjects WHERE classroom_id = ? AND academic_year_id = ?",
            [classroom_id, academic_year_id]
        );

        if (subjects.length === 0) {
            return res.status(400).json({ error: "No subjects defined for this hub. Please assign subjects in Classroom module first." });
        }

        // 3. Define Periods and Recess Slots
        const periods = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        const recessSlots = [
            { period: 'SHORT_RECESS', start: settings.short_recess_start, end: settings.short_recess_end, label: 'SHORT RECESS' },
            { period: 'LONG_RECESS', start: settings.long_recess_start, end: settings.long_recess_end, label: 'LONG RECESS' }
        ];

        // 4. Calculate Period Timings
        const periodTimings = {};
        let currentTime = settings.school_start_time; // Start after assembly usually, or at school start
        // Actually, let's follow TimetableManager.jsx logic: ASSEMBLY -> I -> II -> III -> SHORT_RECESS -> IV -> V -> VI -> LONG_RECESS -> VII -> VIII -> IX
        
        const template = ['ASSEMBLY', 'I', 'II', 'III', 'SHORT_RECESS', 'IV', 'V', 'VI', 'LONG_RECESS', 'VII', 'VIII', 'IX'];
        let walkTime = settings.school_start_time;
        const firstLecture = settings.first_lecture_start || '08:15:00';
        const lectureDuration = parseInt(settings.lecture_duration) || 35;
        
        template.forEach(p => {
            const recess = recessSlots.find(r => r.period === p);
            if (recess) {
                periodTimings[p] = { start: recess.start, end: recess.end, is_break: 1, label: recess.label };
                walkTime = recess.end;
            } else if (p === 'ASSEMBLY') {
                periodTimings[p] = { start: settings.school_start_time, end: firstLecture, is_break: 1, label: 'ASSEMBLY' };
                walkTime = firstLecture;
            } else {
                const start = walkTime;
                const [h, m] = start.split(':').map(Number);
                const endTimestamp = new Date(0, 0, 0, h, m + lectureDuration);
                const end = `${String(endTimestamp.getHours()).padStart(2, '0')}:${String(endTimestamp.getMinutes()).padStart(2, '0')}:00`;
                periodTimings[p] = { start, end, is_break: 0 };
                walkTime = end;
            }
        });

        // 5. Clear existing slots
        await pool.query("DELETE FROM class_timetable WHERE classroom_id = ? AND academic_year_id = ?", [classroom_id, academic_year_id]);

        // 6. Generate and Insert (Greedy Conflict-Aware)
        const inserts = [];
        let subjectIndex = 0;

        for (const day of days) {
            for (const period of template) {
                const timing = periodTimings[period];
                if (timing.is_break) {
                    inserts.push([classroom_id, null, null, day, period, timing.start, timing.end, academic_year_id, 1, timing.label]);
                } else {
                    // Try to find a subject whose teacher is free
                    let assigned = false;
                    let attempts = 0;
                    
                    while (attempts < subjects.length) {
                        const sub = subjects[(subjectIndex + attempts) % subjects.length];
                        
                        // Check for global conflict
                        const [conflicts] = await pool.query(
                            `SELECT id FROM class_timetable 
                             WHERE teacher_id = ? AND day_of_week = ? AND period_number = ? AND academic_year_id = ? AND classroom_id != ?`,
                            [sub.teacher_id, day, period, academic_year_id, classroom_id]
                        );

                        if (conflicts.length === 0) {
                            inserts.push([classroom_id, sub.teacher_id, sub.subject_name, day, period, timing.start, timing.end, academic_year_id, 0, null]);
                            subjectIndex = (subjectIndex + attempts + 1) % subjects.length;
                            assigned = true;
                            break;
                        }
                        attempts++;
                    }

                    // Fallback: If everyone is busy, take the next one in rotation anyway (better than empty)
                    if (!assigned) {
                        const sub = subjects[subjectIndex % subjects.length];
                        inserts.push([classroom_id, sub.teacher_id, sub.subject_name, day, period, timing.start, timing.end, academic_year_id, 0, null]);
                        subjectIndex++;
                    }
                }
            }
            // Rotate start subject for next day to ensure variety
            subjectIndex = (subjectIndex + 2) % subjects.length;
        }

        await pool.query(
            `INSERT INTO class_timetable (classroom_id, teacher_id, subject_name, day_of_week, period_number, start_time, end_time, academic_year_id, is_break, break_label)
             VALUES ?`,
            [inserts]
        );

        // 7. Optional: Update class_subjects with times for the first day's occurrence?
        // Actually, let's just sync the first day's timings to class_subjects for the UI
        for (const sub of subjects) {
            const [[match]] = await pool.query(
                "SELECT start_time, end_time FROM class_timetable WHERE classroom_id = ? AND academic_year_id = ? AND subject_name = ? LIMIT 1",
                [classroom_id, academic_year_id, sub.subject_name]
            );
            if (match) {
                await pool.query(
                    "UPDATE class_subjects SET start_time = ?, end_time = ? WHERE classroom_id = ? AND academic_year_id = ? AND subject_name = ?",
                    [match.start_time, match.end_time, classroom_id, academic_year_id, sub.subject_name]
                );
            }
        }

        res.json({ message: "Institutional Matrix Synchronized Automatically with Global Timings" });
    } catch (error) {
        console.error("Auto Generate Error:", error);
        res.status(500).json({ error: "Matrix Generation Failed: " + error.message });
    }
};
