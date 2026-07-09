
const express = require('express');
const router = express.Router();
const pool = require('../../db');


router.get('/:userId/bookings', async (req, res) => {
    const { userId } = req.params;

    try {
        const patientResult = await pool.query('SELECT patient_id FROM patients WHERE user_id = $1', [userId]);
        if (patientResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Patient profile not found' });
        }
        const patientId = patientResult.rows[0].patient_id;

        const bookingsQuery = `
            SELECT 
                a.appointment_id AS id,
                c.clinic_name AS "clinicName",
                d.doctor_name AS "doctorName",
                TO_CHAR(ts.slot_date, 'Mon DD, YYYY') AS date,
                CONCAT(TO_CHAR(ts.slot_start, 'HH24:MI'), ' - ', TO_CHAR(ts.slot_end, 'HH24:MI')) AS time,
                CASE 
                    WHEN a.status = 'booked' THEN 'Upcoming'
                    WHEN a.status = 'completed' THEN 'Completed'
                    WHEN a.status = 'cancelled' THEN 'Cancelled'
                    ELSE 'Upcoming'
                END AS status
            FROM appointments a
            JOIN time_slots ts ON a.slot_id = ts.slot_id
            JOIN doctors d ON ts.doctor_id = d.doctor_id
            JOIN clinics c ON d.clinic_id = c.clinic_id
            WHERE a.patient_id = $1
            ORDER BY ts.slot_date DESC, ts.slot_start DESC;
        `;

        const result = await pool.query(bookingsQuery, [patientId]);
        res.status(200).json({ success: true, data: result.rows });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});




router.put('/cancel/:appointmentId', async (req, res) => {
    const { appointmentId } = req.params;

    try {
        // ၁။ အဆိုပါ appointment ရှိမရှိနဲ့ လက်ရှိ status ကို စစ်မယ်
        const appointmentCheck = await pool.query(
            'SELECT slot_id, status FROM appointments WHERE appointment_id = $1', 
            [appointmentId]
        );

        if (appointmentCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        const { slot_id, status } = appointmentCheck.rows[0];

        if (status === 'cancelled') {
            return res.status(400).json({ success: false, message: 'Appointment is already cancelled' });
        }

        // ၂။ appointments table မှာ status ကို 'cancelled' လို့ ပြောင်းမယ်
        await pool.query(
            "UPDATE appointments SET status = 'cancelled' WHERE appointment_id = $1",
            [appointmentId]
        );

        // ၃။ အရေးကြီးဆုံးအချက် - အဲဒီ ရက်ချိန်းဖျက်လိုက်တဲ့ အချိန်ပိုင်း (Slot) ကို တခြားလူ ပြန်ယူလို့ရအောင် is_booked = false ပြန်ပြောင်းပေးမယ်
        await pool.query(
            'UPDATE time_slots SET is_booked = false WHERE slot_id = $1',
            [slot_id]
        );

        res.status(200).json({
            success: true,
            message: 'Appointment cancelled successfully'
        });

    } catch (error) {
        console.error('Error cancelling appointment:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;