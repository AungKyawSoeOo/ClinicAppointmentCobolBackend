const express = require('express');
const router = express.Router();
const db = require('../../db');
const moment = require('moment');
const { generateTimeslots } = require('../services/timeslotService');

// Create a new doctor and generate initial timeslots
router.post('/doctors', async (req, res) => {
    try {
        const {
            clinic_id,
            doctor_name,
            doctor_license_no,
            specialization,
            experience,
            phone,
            consultation_duration,
            working_days,
            start_time,
            end_time
        } = req.body;

        const result = await db.query(
            `INSERT INTO doctors (clinic_id, doctor_name, doctor_license_no, specialization, experience, phone, consultation_duration, working_days, start_time, end_time) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING doctor_id`,
            [clinic_id, doctor_name, doctor_license_no, specialization, experience, phone, consultation_duration, working_days, start_time, end_time]
        );

        const newDoctorId = result.rows[0].doctor_id;

        // Generate timeslots for the next 14 days immediately
        const startDateStr = moment().format('YYYY-MM-DD');
        const endDateStr = moment().add(14, 'days').format('YYYY-MM-DD');

        // This runs asynchronously in the background
        generateTimeslots(newDoctorId, startDateStr, endDateStr);

        res.status(201).json({ result: true, message: 'Doctor created successfully', data: { doctor_id: newDoctorId } });
    } catch (error) {
        console.error('Error creating doctor:', error);
        res.status(500).json({ result: false, message: 'Internal server error' });
    }
});

// Fetch doctors and their future slots
router.get('/clinics/:clinicId/doctors', async (req, res) => {
    try {
        const { clinicId } = req.params;

        const doctorsRes = await db.query(`
            SELECT * FROM doctors WHERE clinic_id = $1
        `, [clinicId]);

        const doctors = doctorsRes.rows;

        // Enhance with next 14 days timeslots
        for (let doc of doctors) {
            const slotsRes = await db.query(`
                SELECT * FROM time_slots
                WHERE doctor_id = $1
                AND slot_date >= CURRENT_DATE
                AND slot_date <= CURRENT_DATE + INTERVAL '14 days'
                ORDER BY slot_date ASC, slot_start ASC
            `, [doc.doctor_id]);

            doc.time_slots = slotsRes.rows;

        }
        res.status(200).json({ result: true, data: doctors });
    } catch (error) {
        console.error('Error fetching doctors:', error);
        res.status(500).json({ result: false, message: 'Internal server error' });
    }
});

// Fetch a single doctor with their timeslots for the next 14 days
router.get('/doctors/:doctorId/timeslots', async (req, res) => {
    try {
        const { doctorId } = req.params;

        const doctorRes = await db.query('SELECT * FROM doctors WHERE doctor_id = $1', [doctorId]);
        if (doctorRes.rows.length === 0) {
            return res.status(404).json({ result: false, message: 'Doctor not found' });
        }

        const doctor = doctorRes.rows[0];

        const slotsRes = await db.query(`
            SELECT * FROM time_slots 
            WHERE doctor_id = $1 
            AND slot_date >= CURRENT_DATE
            AND slot_date <= CURRENT_DATE + INTERVAL '14 days'
            ORDER BY slot_date ASC, slot_start ASC
        `, [doctorId]);

        doctor.time_slots = slotsRes.rows;

        res.status(200).json({ result: true, data: doctor });
    } catch (error) {
        console.error('Error fetching doctor timeslots:', error);
        res.status(500).json({ result: false, message: 'Internal server error' });
    }
});

module.exports = router;
