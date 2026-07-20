/**
 * run: node run_wp_migration_v2.js
 * Adds classroom_id column to weekly_schedule_entries (if not already present).
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
  const connection = await mysql.createConnection({
    host:     process.env.DB_HOST     || '127.0.0.1',
    port:     parseInt(process.env.DB_PORT || '3306'),
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'school_system',
  });

  console.log('Connected to DB. Running v2 migration...');

  // Check if column already exists
  const [cols] = await connection.execute(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'weekly_schedule_entries' AND COLUMN_NAME = 'classroom_id'`,
    [process.env.DB_NAME || 'school_system']
  );

  if (cols.length === 0) {
    await connection.execute(
      `ALTER TABLE weekly_schedule_entries
       ADD COLUMN classroom_id BIGINT UNSIGNED NULL,
       ADD CONSTRAINT fk_wse_classroom
         FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE SET NULL`
    );
    console.log('✓ classroom_id column added to weekly_schedule_entries');
  } else {
    console.log('✓ classroom_id column already exists — skipping');
  }

  await connection.end();
  console.log('Migration v2 complete!');
}

run().catch(function(err) {
  console.error('Migration v2 failed:', err.message);
  process.exit(1);
});
