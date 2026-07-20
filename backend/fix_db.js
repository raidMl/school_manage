const { pool } = require('./src/config/db');

async function fix() {
    const connection = await pool.getConnection();
    try {
        console.log("Fixing attendance_validations...");
        
        // Add a non-unique index on group_id to satisfy the foreign key
        try {
            await connection.query('ALTER TABLE attendance_validations ADD INDEX idx_val_group_id (group_id)');
        } catch(e) {} // ignore if exists

        // Drop the unique constraint (likely named group_id)
        try {
            await connection.query('ALTER TABLE attendance_validations DROP INDEX group_id');
        } catch(e) {} 
        
        try {
            await connection.query('ALTER TABLE attendance_validations DROP INDEX date');
        } catch(e) {} 

        // Add subject_name column
        try {
            const [cols] = await connection.query("SHOW COLUMNS FROM attendance_validations LIKE 'subject_name'");
            if (cols.length === 0) {
                await connection.query("ALTER TABLE attendance_validations ADD COLUMN subject_name VARCHAR(255) NOT NULL DEFAULT ''");
            }
        } catch(e) { console.error(e) }

        // Add the new unique constraint
        try {
            await connection.query('ALTER TABLE attendance_validations ADD UNIQUE INDEX idx_val_unique (group_id, date, subject_name)');
            console.log("attendance_validations updated.");
        } catch(e) { console.log("Unique idx maybe already exists", e.message) }

    } catch (e) {
        console.error(e);
    } finally {
        connection.release();
        process.exit();
    }
}
fix();
