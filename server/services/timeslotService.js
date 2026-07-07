const db = require('../../db');
const moment = require('moment');

async function generateTimeslots(doctorId, startDateStr, endDateStr) {
    try {
        const docRes = await db.query('SELECT * FROM doctors WHERE doctor_id = $1', [doctorId]);
        if (docRes.rows.length === 0) return;
        const doc = docRes.rows[0];

        const { working_days, start_time, end_time, consultation_duration } = doc;

        let current = moment(startDateStr);
        const end = moment(endDateStr);

        const newSlots = [];

        while (current.isSameOrBefore(end)) {
            const dayOfWeek = current.isoWeekday(); // 1=Mon, 7=Sun
            if (working_days.includes(dayOfWeek) || working_days.includes(dayOfWeek.toString())) {
                let slotStart = moment(current.format('YYYY-MM-DD') + ' ' + start_time, 'YYYY-MM-DD HH:mm:ss');
                const shiftEnd = moment(current.format('YYYY-MM-DD') + ' ' + end_time, 'YYYY-MM-DD HH:mm:ss');

                while (slotStart.clone().add(consultation_duration, 'minutes').isSameOrBefore(shiftEnd)) {
                    let slotEnd = slotStart.clone().add(consultation_duration, 'minutes');

                    newSlots.push([
                        doctorId,
                        current.format('YYYY-MM-DD'),
                        slotStart.format('HH:mm:ss'),
                        slotEnd.format('HH:mm:ss'),
                        false
                    ]);

                    slotStart = slotEnd;
                }
            }
            current.add(1, 'days');
        }

        if (newSlots.length > 0) {
            const values = [];
            let queryStr = 'INSERT INTO time_slots (doctor_id, slot_date, slot_start, slot_end, is_booked) VALUES ';

            let i = 1;
            newSlots.forEach((slot, idx) => {
                queryStr += `($${i++}, $${i++}, $${i++}, $${i++}, $${i++})`;
                if (idx < newSlots.length - 1) queryStr += ', ';
                values.push(...slot);
            });

            await db.query(queryStr, values);
        }
        console.log(`Generated ${newSlots.length} timeslots for doctor ${doctorId} from ${startDateStr} to ${endDateStr}`);
    } catch (err) {
        console.error('Error generating timeslots:', err);
    }
}

module.exports = {
    generateTimeslots
};
