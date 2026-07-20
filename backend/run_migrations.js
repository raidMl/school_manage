const fs = require('fs');
const path = require('path');
const { pool } = require('./src/config/db');

async function run() {
    try {
        const file1 = fs.readFileSync(path.join(__dirname, 'alter_attendance.sql'), 'utf8');
        const file2 = fs.readFileSync(path.join(__dirname, 'alter_attendance_validations.sql'), 'utf8');
        const file3 = fs.readFileSync(path.join(__dirname, 'alter_attendance_pending.sql'), 'utf8');

        console.log('Running alter_attendance.sql...');
        const statements1 = file1.split(';').map(s => s.trim()).filter(s => s.length > 0);
        for (let s of statements1) {
            await pool.query(s);
        }

        console.log('Running alter_attendance_validations.sql...');
        const statements2 = file2.split(';').map(s => s.trim()).filter(s => s.length > 0);
        for (let s of statements2) {
            await pool.query(s);
        }

        console.log('Running alter_attendance_pending.sql...');
        const statements3 = file3.split(';').map(s => s.trim()).filter(s => s.length > 0);
        for (let s of statements3) {
            await pool.query(s);
        }

        console.log('All migrations applied successfully!');
    } catch (err) {
        console.error('Error applying migrations:', err);
    } finally {
        process.exit(0);
    }
}

run();
