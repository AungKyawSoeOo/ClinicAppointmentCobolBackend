const cron = require('node-cron');
const db = require('../db');
const moment = require('moment');
const { generateTimeslots } = require('./services/timeslotService');

function initCron() {
    // Run every day at midnight
    cron.schedule('0 0 * * *', async () => {
        console.log('Running daily timeslot generation job...');
        try {
            // Get all active doctors (generate slots for all doctors)
            const doctorsRes = await db.query('SELECT doctor_id FROM doctors');
            const doctors = doctorsRes.rows;

            // Generate timeslots for the next 14 days range
            const startDateStr = moment().format('YYYY-MM-DD');
            const endDateStr = moment().add(14, 'days').format('YYYY-MM-DD');

            for (let doc of doctors) {
                await generateTimeslots(doc.doctor_id, startDateStr, endDateStr);
            }
            console.log('Daily timeslot generation job completed.');
        } catch (error) {
            console.error('Error in daily timeslot generation job:', error);
        }
    });

    cron.schedule('*/15 * * * *', async () => { // *15 means every 15 minutes

        try {
            const currentDateStr = moment().format('YYYY-MM-DD');
            const currentTimeStr = moment().format('HH:mm:ss');
            const autoCompleteQuery = `
                UPDATE appointments
                SET status = 'completed'
                WHERE appointment_id IN (
                    SELECT a.appointment_id
                    FROM appointments a
                    JOIN time_slots ts ON a.slot_id = ts.slot_id
                    WHERE a.status = 'booked'
                    AND (
                        ts.slot_date < $1
                        OR (ts.slot_date = $1 AND ts.slot_end < $2)
                    )
                )
                RETURNING appointment_id;
            `;

            const result = await db.query(autoCompleteQuery, [currentDateStr, currentTimeStr]);

            if (result.rows.length > 0) {
                console.log(`Auto-completed ${result.rows.length} past appointments successfully.`);
            } else {
                console.log('No past appointments to auto-complete at this time.');
            }

        } catch (error) {
            console.error('Error in auto-complete appointments job:', error);
        }
    });
}

module.exports = {
    initCron
};
