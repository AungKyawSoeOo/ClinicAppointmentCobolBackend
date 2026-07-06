const express = require("express");
const router = express.Router();
const db = require("../../db");

// Get all cities
router.get("/cities", async (req, res) => {
    try {
        const result = await db.query("SELECT city_id AS id, city_name AS name, city_code AS code, status FROM cities ORDER BY city_id ASC");
        res.status(200).json({ result: true, data: result.rows });
    } catch (error) {
        console.error("Fetch cities error:", error);
        res.status(500).json({ result: false, message: "Internal server error" });
    }
});

// Add new city
router.post("/cities", async (req, res) => {
    const { name, code } = req.body;
    if (!name || !code) {
        return res.status(400).json({ result: false, message: "Name and code are required" });
    }
    try {

        const existingCity = await db.query("SELECT * FROM cities WHERE city_code = $1", [code.toUpperCase()]);
        if (existingCity.rows.length > 0) {
            return res.status(400).json({ result: false, message: "City with this code already exists" });
        }

        const result = await db.query(
            "INSERT INTO cities (city_name, city_code, status) VALUES ($1, $2, 'Active') RETURNING city_id AS id, city_name AS name, city_code AS code, status",
            [name, code.toUpperCase()]
        );
        res.status(201).json({ result: true, message: "City added successfully", data: result.rows[0] });
    } catch (error) {
        console.error("Add city error:", error);
        res.status(500).json({ result: false, message: "Internal server error" });
    }
});

// Toggle city status
router.put("/cities/:id/status", async (req, res) => {
    const { id } = req.params;
    try {
        const check = await db.query("SELECT status FROM cities WHERE city_id = $1", [id]);
        if (check.rows.length === 0) {
            return res.status(404).json({ result: false, message: "City not found" });
        }
        const newStatus = check.rows[0].status === "Active" ? "Inactive" : "Active";
        // Start a transaction
        await db.query("BEGIN");

        // 1. Update the city status
        await db.query("UPDATE cities SET status = $1 WHERE city_id = $2", [newStatus, id]);

        // 2. ALSO update all linked townships to match the new city status
        await db.query("UPDATE townships SET status = $1 WHERE city_id = $2", [newStatus, id]);

        await db.query("COMMIT");

        res.status(200).json({
            result: true,
            message: `City and its townships updated to ${newStatus}`,
            status: newStatus
        });
    } catch (error) {
        console.error("Toggle city status error:", error);
        res.status(500).json({ result: false, message: "Internal server error" });
    }
});

// Get all townships
router.get("/townships", async (req, res) => {
    try {
        const result = await db.query(`
            SELECT t.township_id AS id, t.township_name AS name, t.township_code AS code, t.status, 
                   t.city_id AS "cityId", c.city_name AS "cityName"
            FROM townships t
            JOIN cities c ON t.city_id = c.city_id
            ORDER BY t.township_id ASC
        `);
        res.status(200).json({ result: true, data: result.rows });
    } catch (error) {
        console.error("Fetch townships error:", error);
        res.status(500).json({ result: false, message: "Internal server error" });
    }
});

// Add new township
router.post("/townships", async (req, res) => {
    const { name, code, cityId } = req.body;
    if (!name || !code || !cityId) {
        return res.status(400).json({ result: false, message: "Name, code, and cityId are required" });
    }
    try {
        // Verify city exists
        const cityCheck = await db.query("SELECT city_name FROM cities WHERE city_id = $1", [cityId]);
        if (cityCheck.rows.length === 0) {
            return res.status(400).json({ result: false, message: "Selected city does not exist" });
        }

        const duplicateCheck = await db.query(
            "SELECT township_id FROM townships WHERE township_code = $1",
            [code.toUpperCase()]
        );

        if (duplicateCheck.rows.length > 0) {
            return res.status(400).json({ result: false, message: "A township with this code already exists" });
        }
        const result = await db.query(
            "INSERT INTO townships (township_name, township_code, city_id, status) VALUES ($1, $2, $3, 'Active') RETURNING township_id AS id, township_name AS name, township_code AS code, city_id AS \"cityId\", status",
            [name, code.toUpperCase(), cityId]
        );
        const newTownship = {
            ...result.rows[0],
            cityName: cityCheck.rows[0].city_name
        };
        res.status(201).json({ result: true, message: "Township added successfully", data: newTownship });
    } catch (error) {
        console.error("Add township error:", error);
        res.status(500).json({ result: false, message: "Internal server error" });
    }
});

// Toggle township status
router.put("/townships/:id/status", async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Fetch township status AND the status of its parent city
        const check = await db.query(`
            SELECT t.status, c.status as city_status
            FROM townships t
            JOIN cities c ON t.city_id = c.city_id
            WHERE t.township_id = $1`, [id]);

        if (check.rows.length === 0) {
            return res.status(404).json({ result: false, message: "Township not found" });
        }

        const { status, city_status } = check.rows[0];
        const newStatus = status === "Active" ? "Inactive" : "Active";

        // 2. Prevent activation if the parent city is inactive
        if (newStatus === "Active" && city_status === "Inactive") {
            return res.status(400).json({
                result: false,
                message: "Cannot activate township: city is currently inactive."
            });
        }

        // 3. Update status
        await db.query("UPDATE townships SET status = $1 WHERE township_id = $2", [newStatus, id]);

        res.status(200).json({
            result: true,
            message: `Township status updated to ${newStatus}`,
            status: newStatus
        });
    } catch (error) {
        console.error("Toggle township status error:", error);
        res.status(500).json({ result: false, message: "Internal server error" });
    }
});

module.exports = router;
