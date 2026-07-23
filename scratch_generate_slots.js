const db = require('./db');
const moment = require('moment');
const { generateTimeslots } = require('./server/services/timeslotService');

async function run() {
    try {
        console.log('Generating missing timeslots for all doctors for the next 14 days...');
        const doctorsRes = await db.query('SELECT doctor_id, doctor_name FROM doctors');
        const doctors = doctorsRes.rows;

        const startDateStr = moment().format('YYYY-MM-DD');
        const endDateStr = moment().add(14, 'days').format('YYYY-MM-DD');

        console.log(`Date range: ${startDateStr} to ${endDateStr}`);

        for (let doc of doctors) {
            console.log(`Processing doctor: ${doc.doctor_name} (ID: ${doc.doctor_id})`);
            await generateTimeslots(doc.doctor_id, startDateStr, endDateStr);
        }
        console.log('Finished generating timeslots!');
    } catch (err) {
        console.error('Error running slot generation:', err);
    } finally {
        process.exit(0);
    }
}

run();
