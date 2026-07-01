const express = require("express");
const router = express.Router();
const userRegisterService = require("../services/userRegisterService");
const db = require("../../db");
const bcrypt = require('bcrypt');

router.post("/register", async (req, res) => {
    // Capture 'username' along with email and password
    const { username, email, password } = req.body;

    // Validate with COBOL
    const isValidationPassed = await userRegisterService.userRegister(username, email, password);
    if (!isValidationPassed) {
        return res.status(400).json({ message: "Registration failed", result: false });
    }

    try {
        await db.query('BEGIN');
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert into 'users' table
        const userRes = await db.query(
            'INSERT INTO users (email, password, role, status) VALUES ($1, $2, $3, $4) RETURNING user_id',
            [email, hashedPassword, 'patient', 'active']
        );
        const newUserId = userRes.rows[0].user_id;

        // Insert into 'patients' table using the 'username' from the request
        await db.query(
            'INSERT INTO patients (user_id, full_name) VALUES ($1, $2)',
            [newUserId, username]
        );

        await db.query('COMMIT');
        res.status(201).json({ message: "Registration successful!", result: true });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error("Database Error:", error);
        if (error.code === '23505') {
            return res.status(409).json({
                message: "This email is already registered.",
                result: false
            });
        }
        console.log(error.code);
        res.status(500).json({ message: "Error saving to database", result: false });
    }
});

module.exports = router;