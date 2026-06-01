import pool from "../config/db.js";
import logger from "../utils/logger.js";

/**
 * Get syllabus progress for a classroom and subject
 */
export const getSyllabusProgress = async (req, res) => {
    try {
        const { classroom_id } = req.params;
        const { subject_name, academic_year_id } = req.query;

        let query = `SELECT * FROM syllabus_progress WHERE classroom_id = ?`;
        const params = [classroom_id];

        if (subject_name) {
            query += ` AND subject_name = ?`;
            params.push(subject_name);
        }

        if (academic_year_id) {
            query += ` AND academic_year_id = ?`;
            params.push(academic_year_id);
        }

        query += ` ORDER BY created_at ASC`;

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        logger.error("Get Syllabus Progress Error:", error);
        res.status(500).json({ error: "Failed to fetch syllabus progress" });
    }
};

/**
 * Add a new topic to the syllabus
 */
export const addSyllabusTopic = async (req, res) => {
    try {
        const { classroom_id, academic_year_id, subject_name, topic_name } = req.body;
        const teacher_id = req.user.id;

        const [result] = await pool.query(
            `INSERT INTO syllabus_progress (classroom_id, teacher_id, academic_year_id, subject_name, topic_name)
             VALUES (?, ?, ?, ?, ?)`,
            [classroom_id, teacher_id, academic_year_id || null, subject_name, topic_name]
        );

        res.status(201).json({ message: "Topic added successfully", topic_id: result.insertId });
    } catch (error) {
        logger.error("Add Syllabus Topic Error:", error);
        res.status(500).json({ error: "Failed to add topic" });
    }
};

/**
 * Update topic status (mark as completed, set as today's topic, etc.)
 */
export const updateTopicStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, is_today_topic, completion_date } = req.body;

        let updateFields = [];
        let params = [];

        if (status !== undefined) {
            updateFields.push(`status = ?`);
            params.push(status);
            if (status === 'completed') {
                updateFields.push(`completion_date = ?`);
                params.push(completion_date || new Date().toISOString().split('T')[0]);
            } else {
                updateFields.push(`completion_date = NULL`);
            }
        }

        if (is_today_topic !== undefined) {
            updateFields.push(`is_today_topic = ?`);
            params.push(is_today_topic);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ error: "No fields to update" });
        }

        params.push(id);
        const query = `UPDATE syllabus_progress SET ${updateFields.join(', ')} WHERE id = ?`;

        await pool.query(query, params);
        res.json({ message: "Topic updated successfully" });
    } catch (error) {
        logger.error("Update Topic Status Error:", error);
        res.status(500).json({ error: "Failed to update topic" });
    }
};

/**
 * Get daily class report (topics covered today)
 */
export const getDailyClassReport = async (req, res) => {
    try {
        const { classroom_id } = req.params;
        const { date } = req.query;
        const targetDate = date || new Date().toISOString().split('T')[0];

        const [rows] = await pool.query(
            `SELECT * FROM syllabus_progress 
             WHERE classroom_id = ? AND (is_today_topic = 1 OR completion_date = ?)`,
            [classroom_id, targetDate]
        );

        res.json(rows);
    } catch (error) {
        logger.error("Get Daily Class Report Error:", error);
        res.status(500).json({ error: "Failed to fetch daily report" });
    }
};

/**
 * Get the master syllabus for a classroom
 */
export const getMasterSyllabus = async (req, res) => {
    try {
        const { classroom_id } = req.params;
        const [rows] = await pool.query(
            `SELECT * FROM syllabus_master WHERE classroom_id = ? ORDER BY created_at ASC`,
            [classroom_id]
        );
        res.json(rows);
    } catch (error) {
        logger.error("Get Master Syllabus Error:", error);
        res.status(500).json({ error: "Failed to fetch master syllabus" });
    }
};

/**
 * Add a new topic to the master syllabus
 */
export const addMasterSyllabusTopic = async (req, res) => {
    try {
        const { classroom_id, academic_year_id, subject_name, chapter_name, topic_name, planned_lectures } = req.body;
        const teacher_id = req.user.id;

        const [result] = await pool.query(
            `INSERT INTO syllabus_master (classroom_id, teacher_id, academic_year_id, subject_name, chapter_name, topic_name, planned_lectures)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [classroom_id, teacher_id, academic_year_id || null, subject_name, chapter_name, topic_name, planned_lectures || 1]
        );

        res.status(201).json({ message: "Master syllabus topic added", id: result.insertId });
    } catch (error) {
        logger.error("Add Master Syllabus Topic Error:", error);
        res.status(500).json({ error: "Failed to add master syllabus topic" });
    }
};

/**
 * Update a topic in the master syllabus
 */
export const updateMasterSyllabusTopic = async (req, res) => {
    try {
        const { id } = req.params;
        const { subject_name, chapter_name, topic_name, planned_lectures } = req.body;

        await pool.query(
            `UPDATE syllabus_master SET subject_name = ?, chapter_name = ?, topic_name = ?, planned_lectures = ?
             WHERE id = ?`,
            [subject_name, chapter_name, topic_name, planned_lectures, id]
        );

        res.json({ message: "Master syllabus topic updated successfully" });
    } catch (error) {
        logger.error("Update Master Syllabus Topic Error:", error);
        res.status(500).json({ error: "Failed to update master syllabus topic" });
    }
};

/**
 * Delete a topic from the master syllabus
 */
export const deleteMasterSyllabusTopic = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query(`DELETE FROM syllabus_master WHERE id = ?`, [id]);
        res.json({ message: "Master syllabus topic deleted successfully" });
    } catch (error) {
        logger.error("Delete Master Syllabus Topic Error:", error);
        res.status(500).json({ error: "Failed to delete master syllabus topic" });
    }
};

