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

            // Generate timeslots for exactly 14 days from now
            const targetDateStr = moment().add(14, 'days').format('YYYY-MM-DD');

            for (let doc of doctors) {
                await generateTimeslots(doc.doctor_id, targetDateStr, targetDateStr);
            }
            console.log('Daily timeslot generation job completed.');
        } catch (error) {
            console.error('Error in daily timeslot generation job:', error);
        }
    });
}

module.exports = {
    initCron
};
