const { pool } = require('./src/config/db');
const fs = require('fs');

async function migrate() {
    try {
        const sql = fs.readFileSync('alter_db.sql', 'utf8');
        const statements = sql.split(';').filter(stmt => stmt.trim() !== '');
        
        for (let stmt of statements) {
            console.log('Executing:', stmt);
            await pool.query(stmt);
        }
        console.log('Migration completed successfully.');
    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        process.exit();
    }
}

migrate();
