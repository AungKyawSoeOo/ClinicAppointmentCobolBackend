const express = require("express");
const router = express.Router();
const userRegisterService = require("../services/userRegisterService");
const clinicRegisterService = require("../services/clinicRegisterService");
const userLoginService = require("../services/loginService");
const db = require("../../db");
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');

// Setup multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '..', '..', 'uploads/'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

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

router.post("/register-clinic", upload.single('licensePhoto'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "License photo is required", result: false });
    }

    const { username, email, password, liscensenum, phonenum, address, city_id, township_id } = req.body;
    const licensePhotoName = req.file.filename;

    // Validate with COBOL
    const isValidationPassed = await clinicRegisterService.clinicRegister(username, email, password, liscensenum, phonenum);
    if (!isValidationPassed) {
        return res.status(400).json({ message: "Registration failed", result: false });
    }

    try {
        await db.query('BEGIN');
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert into 'users' table
        const userRes = await db.query(
            'INSERT INTO users (email, password, role, status) VALUES ($1, $2, $3, $4) RETURNING user_id',
            [email, hashedPassword, 'clinic', 'pending']
        );
        const newUserId = userRes.rows[0].user_id;

        // Insert into 'clinics' table
        await db.query(
            'INSERT INTO clinics (user_id, clinic_name, clinic_license_no, phone, license_photo, address, city_id, township_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [newUserId, username, liscensenum, phonenum, licensePhotoName, address, city_id || null, township_id || null]
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
        res.status(500).json({ message: "Error saving to database", result: false });
    }
});

router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    // Validate with COBOL
    const isValidationPassed = await userLoginService.userLogin(email, password);
    if (!isValidationPassed) {
        return res.status(400).json({ message: "Login failed", result: false });
    }
    try {
        // Check if user exists and join patients to get the full name
        const userRes = await db.query(
            `SELECT u.user_id, u.email, u.password, u.role, u.status, p.full_name, c.clinic_name, c.clinic_id
             FROM users u 
             LEFT JOIN patients p ON u.user_id = p.user_id 
             LEFT JOIN clinics c ON u.user_id = c.user_id
             WHERE u.email = $1`,
            [email]
        );

        if (userRes.rows.length === 0) {
            return res.status(401).json({ message: "Invalid email or password", result: false });
        }

        const user = userRes.rows[0];

        // Determine the display name based on role
        let displayName = 'User';
        if (user.role === 'admin') {
            displayName = user.full_name || 'Administrator';
        } else if (user.role === 'patient') {
            displayName = user.full_name || 'Patient';
        } else if (user.role === 'clinic') {
            displayName = user.clinic_name || 'Clinic';
        }

        if (!user.status || user.status.toLowerCase() !== 'active') {
            return res.status(403).json({
                message: "Your account is not active. Please contact administrator.",
                result: false
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password", result: false });
        }

        // Login successful
        res.status(200).json({
            message: "Login successful",
            result: true,
            userId: user.user_id,
            clinicId: user.clinic_id || null,
            role: user.role,
            userName: displayName,
            status: user.status
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Internal server error", result: false });
    }
});

// Fetch Profile
router.get("/profile/:userId", async (req, res) => {
    const { userId } = req.params;

    try {
        const profileRes = await db.query(
            `SELECT u.user_id, u.email, u.status, u.created_at, p.patient_id, p.full_name, p.phone, p.gender, p.dob, p.profile_image 
             FROM users u 
             LEFT JOIN patients p ON u.user_id = p.user_id 
             WHERE u.user_id = $1`,
            [userId]
        );

        if (profileRes.rows.length === 0) {
            return res.status(404).json({ message: "User not found", result: false });
        }

        res.status(200).json({
            result: true,
            data: profileRes.rows[0]
        });
    } catch (error) {
        console.error("Fetch Profile Error:", error);
        res.status(500).json({ message: "Internal server error", result: false });
    }
});

// Update Profile
router.put("/profile/:userId", async (req, res) => {
    const { userId } = req.params;
    const { full_name, phone, gender, dob } = req.body;

    if (dob) {
        const dobDate = new Date(dob);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (dobDate > today) {
            return res.status(400).json({ message: "Date of birth cannot be in the future", result: false });
        }
    }

    try {
        await db.query('BEGIN');

        // Check if patient record exists for this user_id
        const patientCheck = await db.query('SELECT * FROM patients WHERE user_id = $1', [userId]);

        if (patientCheck.rows.length === 0) {
            // Create if it doesn't exist
            await db.query(
                'INSERT INTO patients (user_id, full_name, phone, gender, dob) VALUES ($1, $2, $3, $4, $5)',
                [userId, full_name, phone, gender, dob]
            );
        } else {
            // Update
            await db.query(
                `UPDATE patients 
                 SET full_name = $1, phone = $2, gender = $3, dob = $4 
                 WHERE user_id = $5`,
                [full_name, phone, gender, dob, userId]
            );
        }

        await db.query('COMMIT');
        res.status(200).json({ message: "Profile updated successfully!", result: true });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error("Update Profile Error:", error);
        res.status(500).json({ message: "Error updating profile", result: false });
    }
});

module.exports = router;