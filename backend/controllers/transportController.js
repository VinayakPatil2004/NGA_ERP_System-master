import db from '../config/db.js';

/**
 * Transport Management Controller
 * Handles Vehicles/Drivers and Student Route Assignments
 */

// ── Vehicle Management ──────────────────────────────────────────────────────

export const getVehicles = async (req, res) => {
    try {
        const query = `
            SELECT v.*, r.route_code, r.route_name as official_route_name,
                   (SELECT COUNT(*) FROM transport_assignments WHERE vehicle_id = v.id) as student_count,
                   (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', s.id, 'stop_name', s.stop_name, 'distance', s.distance)) 
                    FROM transport_stops s WHERE s.route_id = v.route_id) as stops
            FROM transport_vehicles v
            LEFT JOIN transport_routes r ON v.route_id = r.id
            ORDER BY v.id DESC
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) {
        console.error("Error fetching vehicles:", error);
        res.status(500).json({ error: "Failed to fetch vehicles" });
    }
};

export const addVehicle = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { vehicle_number, vehicle_type, driver_name, driver_phone, capacity, status, route_name, route_code, stops } = req.body;

        // 1. Create or Find Route
        let routeId = null;
        if (route_name) {
            const [existingRoute] = await connection.query(`SELECT id FROM transport_routes WHERE route_name = ?`, [route_name]);
            if (existingRoute.length > 0) {
                routeId = existingRoute[0].id;
            } else {
                const [rRes] = await connection.query(`INSERT INTO transport_routes (route_name, route_code) VALUES (?, ?)`, [route_name, route_code || null]);
                routeId = rRes.insertId;
            }

            // 2. Add Stops if provided
            if (stops && Array.isArray(stops)) {
                // Clear existing stops for this route to strictly map them if updating, but since it's a "master", we should just append missing or clear and insert. Let's clear and insert.
                await connection.query(`DELETE FROM transport_stops WHERE route_id = ?`, [routeId]);
                for (let i = 0; i < stops.length; i++) {
                    const st = stops[i];
                    if (st.stop_name) {
                        await connection.query(
                            `INSERT INTO transport_stops (route_id, stop_name, distance, sequence_order) VALUES (?, ?, ?, ?)`,
                            [routeId, st.stop_name, st.distance || 0, i + 1]
                        );
                    }
                }
            }
        }

        const [result] = await connection.query(
            `INSERT INTO transport_vehicles (vehicle_number, vehicle_type, driver_name, driver_phone, route_id, capacity, status, route_name) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [vehicle_number, vehicle_type || 'Bus', driver_name, driver_phone, routeId, capacity || 40, status || 'active', route_name]
        );

        await connection.commit();
        res.json({ message: "Vehicle and Route Master added successfully", id: result.insertId });
    } catch (error) {
        await connection.rollback();
        console.error("Error adding vehicle:", error);
        res.status(500).json({ error: "Failed to add vehicle. Ensure vehicle number is unique." });
    } finally {
        connection.release();
    }
};

export const updateVehicle = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { id } = req.params;
        const { vehicle_number, vehicle_type, driver_name, driver_phone, capacity, status, route_name, route_code, stops } = req.body;

        let routeId = null;
        if (route_name) {
            const [existingRoute] = await connection.query(`SELECT id FROM transport_routes WHERE route_name = ?`, [route_name]);
            if (existingRoute.length > 0) {
                routeId = existingRoute[0].id;
                // update route code if needed
                if (route_code) await connection.query(`UPDATE transport_routes SET route_code = ? WHERE id = ?`, [route_code, routeId]);
            } else {
                const [rRes] = await connection.query(`INSERT INTO transport_routes (route_name, route_code) VALUES (?, ?)`, [route_name, route_code || null]);
                routeId = rRes.insertId;
            }

            if (stops && Array.isArray(stops)) {
                await connection.query(`DELETE FROM transport_stops WHERE route_id = ?`, [routeId]);
                for (let i = 0; i < stops.length; i++) {
                    const st = stops[i];
                    if (st.stop_name) {
                        await connection.query(
                            `INSERT INTO transport_stops (route_id, stop_name, distance, sequence_order) VALUES (?, ?, ?, ?)`,
                            [routeId, st.stop_name, st.distance || 0, i + 1]
                        );
                    }
                }
            }
        }

        await connection.query(
            `UPDATE transport_vehicles SET 
                vehicle_number = ?, vehicle_type = ?, driver_name = ?, driver_phone = ?, 
                route_id = ?, capacity = ?, status = ?, route_name = ?
             WHERE id = ?`,
            [vehicle_number, vehicle_type || 'Bus', driver_name, driver_phone, routeId, capacity, status, route_name, id]
        );

        await connection.commit();
        res.json({ message: "Vehicle updated successfully" });
    } catch (error) {
        await connection.rollback();
        console.error("Error updating vehicle:", error);
        res.status(500).json({ error: "Failed to update vehicle" });
    } finally {
        connection.release();
    }
};

export const deleteVehicle = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query(`DELETE FROM transport_vehicles WHERE id = ?`, [id]);
        res.json({ message: "Vehicle and related assignments Deleted" });
    } catch (error) {
        console.error("Error deleting vehicle:", error);
        res.status(500).json({ error: "Failed to delete vehicle" });
    }
};


// ── Student Assignment Management ──────────────────────────────────────────

export const getAssignments = async (req, res) => {
    try {
        const { vehicle_id, academicYearId } = req.query;
        if (!vehicle_id) return res.status(400).json({ error: "Vehicle ID required" });

        let ayId = academicYearId;
        if (!ayId) {
            const [activeYear] = await db.query(`SELECT id FROM academic_years WHERE is_active = 1 LIMIT 1`);
            ayId = activeYear[0]?.id;
        }

        const query = `
            SELECT ta.*, s.first_name, s.last_name, s.student_id_no, s.gr_no, s.pen_no, se.grade
            FROM transport_assignments ta
            JOIN students s ON ta.student_id = s.id
            LEFT JOIN student_enrollments se ON s.id = se.student_id AND se.academic_year_id = ?
            WHERE ta.vehicle_id = ? AND ta.academic_year_id = ?
            ORDER BY s.last_name ASC
        `;
        const [rows] = await db.query(query, [ayId, vehicle_id, ayId]);
        res.json(rows);
    } catch (error) {
        console.error("Error fetching assignments:", error);
        res.status(500).json({ error: "Failed to fetch student assignments" });
    }
};

export const assignStudent = async (req, res) => {
    try {
        const { vehicle_id, student_id, pickup_point, academic_year_id } = req.body;

        let ayId = academic_year_id;
        if (!ayId) {
            const [activeYear] = await db.query(`SELECT id FROM academic_years WHERE is_active = 1 LIMIT 1`);
            ayId = activeYear[0]?.id;
        }

        // Check if student already assigned elsewhere in this academic year
        const [existing] = await db.query(`SELECT id FROM transport_assignments WHERE student_id = ? AND academic_year_id = ?`, [student_id, ayId]);
        if (existing.length > 0) {
            return res.status(400).json({ error: "Student is already assigned to another vehicle in this academic year" });
        }

        const [result] = await db.query(
            `INSERT INTO transport_assignments (vehicle_id, student_id, pickup_point, academic_year_id, status) 
             VALUES (?, ?, ?, ?, 'active')`,
            [vehicle_id, student_id, pickup_point, ayId]
        );
        res.json({ message: "Student assigned to vehicle", id: result.insertId });
    } catch (error) {
        console.error("Error assigning student:", error);
        res.status(500).json({ error: "Failed to assign student" });
    }
};

export const removeAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query(`DELETE FROM transport_assignments WHERE id = ?`, [id]);
        res.json({ message: "Student removed from vehicle route" });
    } catch (error) {
        console.error("Error removing assignment:", error);
        res.status(500).json({ error: "Failed to remove student assignment" });
    }
};

export const updateAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const { student_id, pickup_point } = req.body;

        if (student_id) {
            // First determine academic year of this assignment
            const [assignment] = await db.query(`SELECT academic_year_id FROM transport_assignments WHERE id = ?`, [id]);
            const ayId = assignment[0]?.academic_year_id;

            // Check if student already assigned elsewhere in this academic year
            const [existing] = await db.query(
                `SELECT id FROM transport_assignments WHERE student_id = ? AND academic_year_id = ? AND id != ?`,
                [student_id, ayId, id]
            );
            if (existing.length > 0) {
                return res.status(400).json({ error: "Student is already assigned to another vehicle in this academic year" });
            }

            await db.query(
                `UPDATE transport_assignments SET student_id = ?, pickup_point = ? WHERE id = ?`,
                [student_id, pickup_point, id]
            );
        } else {
            await db.query(
                `UPDATE transport_assignments SET pickup_point = ? WHERE id = ?`,
                [pickup_point, id]
            );
        }
        res.json({ message: "Student route assignment updated successfully" });
    } catch (error) {
        console.error("Error updating assignment:", error);
        res.status(500).json({ error: "Failed to update student assignment" });
    }
};
