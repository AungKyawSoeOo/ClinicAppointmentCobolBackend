const express = require('express');
const router = express.Router();
const pool = require('../../db'); 

router.post('/book', async (req, res) => {

    const { patient_id: incomingUserId, slot_id, booking_type, status } = req.body;

    try {
        if (!incomingUserId || !slot_id) {
            return res.status(400).json({ success: false, message: 'User ID and Slot ID are required' });
        }


        const patientResult = await pool.query(
            'SELECT patient_id FROM patients WHERE user_id = $1', 
            [incomingUserId]
        );


        if (patientResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Patient profile not found for this user' });
        }


        const realPatientId = patientResult.rows[0].patient_id;


        
        const slotCheck = await pool.query('SELECT is_booked FROM time_slots WHERE slot_id = $1', [slot_id]);
        if (slotCheck.rows.length === 0 || slotCheck.rows[0].is_booked) {
            return res.status(400).json({ success: false, message: 'Slot is already booked or invalid' });
        }

       
        const bookingNo = Math.floor(100000 + Math.random() * 900000); 

       
        const insertQuery = `
            INSERT INTO appointments (patient_id, slot_id, booking_no, booking_type, status)
            VALUES ($1, $2, $3, $4, $5) RETURNING *;
        `;
        const newAppointment = await pool.query(insertQuery, [
            realPatientId, 
            slot_id, 
            bookingNo, 
            booking_type || 'online', 
            status || 'booked'
        ]);

        
        await pool.query('UPDATE time_slots SET is_booked = true WHERE slot_id = $1', [slot_id]);

        res.status(201).json({ success: true, message: 'Successfully booked!', data: newAppointment.rows[0] });

    } catch (error) {
        console.error('Booking Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;