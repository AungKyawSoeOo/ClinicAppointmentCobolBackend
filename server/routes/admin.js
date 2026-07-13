const express = require("express");
const router = express.Router();
const db = require("../../db");

// Get all clinics
router.get("/clinics", async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                u.user_id, 
                c.clinic_name, 
                c.clinic_license_no, 
                c.license_photo, 
                c.address, 
                ct.city_name, 
                t.township_name, 
                u.created_at as registered_date, 
                u.status
            FROM users u
            JOIN clinics c ON u.user_id = c.user_id
            LEFT JOIN cities ct ON c.city_id = ct.city_id
            LEFT JOIN townships t ON c.township_id = t.township_id
            ORDER BY u.created_at DESC
        `);

        // Format the output
        const clinics = result.rows.map(row => {
            const locationParts = [];
            if (row.address) locationParts.push(row.address);
            // if (row.township_name) locationParts.push(row.township_name);
            // if (row.city_name) locationParts.push(row.city_name);

            return {
                id: row.user_id,
                name: row.clinic_name,
                liscense_number: row.clinic_license_no,
                license_photo: row.license_photo,
                location: locationParts.length > 0 ? locationParts.join(", ") : "N/A",
                city: row.city_name || "N/A",
                township: row.township_name || "N/A",
                registeredDate: row.registered_date ? new Date(row.registered_date).toISOString().split('T')[0] : "N/A",
                status: row.status // 'pending', 'active', 'inactive'
            };
        });

        res.status(200).json({ result: true, data: clinics });
    } catch (error) {
        console.error("Fetch clinics error:", error);
        res.status(500).json({ result: false, message: "Internal server error" });
    }
});

// Update clinic status
router.put("/clinics/:userId/status", async (req, res) => {
    const { userId } = req.params;
    const { status } = req.body; // 'active' or 'inactive'

    if (!status || !['active', 'inactive'].includes(status.toLowerCase())) {
        return res.status(400).json({ result: false, message: "Invalid status" });
    }

    try {
        const check = await db.query("SELECT * FROM users WHERE user_id = $1 AND role = 'clinic'", [userId]);
        if (check.rows.length === 0) {
            return res.status(404).json({ result: false, message: "Clinic not found" });
        }

        await db.query("UPDATE users SET status = $1 WHERE user_id = $2", [status.toLowerCase(), userId]);

        res.status(200).json({ result: true, message: `Clinic status updated to ${status}` });
    } catch (error) {
        console.error("Update clinic status error:", error);
        res.status(500).json({ result: false, message: "Internal server error" });
    }
});

module.exports = router;
