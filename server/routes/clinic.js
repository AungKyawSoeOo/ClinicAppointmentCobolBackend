const express = require("express");
const router = express.Router();
const db = require("../../db");

router.get("/clinics", async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                u.user_id, 
                c.clinic_id,
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
            WHERE u.status = 'active'
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
                clinic_id: row.clinic_id,
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

router.get("/clinics/:id", async (req, res) => {
    const clinicId = req.params.id;

    try {
        const result = await db.query(`
            SELECT 
                c.clinic_id,
                c.clinic_name,
                c.clinic_license_no,
                c.license_photo,
                c.address,
                ct.city_name,
                t.township_name,
                u.created_at as registered_date,
                u.status
            FROM clinics c
            JOIN users u ON c.user_id = u.user_id
            LEFT JOIN cities ct ON c.city_id = ct.city_id
            LEFT JOIN townships t ON c.township_id = t.township_id
            WHERE c.clinic_id = $1
        `, [clinicId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                result: false,
                message: "Clinic not found"
            });
        }

        const row = result.rows[0];

        const clinic = {
            clinic_id: row.clinic_id,
            name: row.clinic_name,
            license_number: row.clinic_license_no,
            license_photo: row.license_photo,
            address: row.address || "N/A",
            city: row.city_name || "N/A",
            township: row.township_name || "N/A",
            registeredDate: row.registered_date
                ? new Date(row.registered_date).toISOString().split('T')[0]
                : "N/A",
            status: row.status
        };

        res.status(200).json({
            result: true,
            data: clinic
        });

    } catch (error) {
        console.error("Fetch clinic error:", error);

        res.status(500).json({
            result: false,
            message: "Internal server error"
        });
    }
});

module.exports = router;
