/**
 * run: node run_wp_migration.js
 * Creates the 3 weekly_program* tables if they don't exist.
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
    multipleStatements: true,
  });

  console.log('Connected to DB. Running migration...');

  const sql = `
    CREATE TABLE IF NOT EXISTS weekly_programs (
      id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      school_id   BIGINT UNSIGNED NOT NULL,
      name        VARCHAR(255) NOT NULL,
      description TEXT NULL,
      status      ENUM('active','disabled') NOT NULL DEFAULT 'disabled',
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_wp_school
        FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS weekly_time_slots (
      id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      program_id  BIGINT UNSIGNED NOT NULL,
      label       VARCHAR(50) NOT NULL,
      start_time  TIME NOT NULL,
      end_time    TIME NOT NULL,
      sort_order  INT DEFAULT 0,
      CONSTRAINT fk_wts_program
        FOREIGN KEY (program_id) REFERENCES weekly_programs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS weekly_schedule_entries (
      id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      slot_id      BIGINT UNSIGNED NOT NULL,
      day_of_week  TINYINT NOT NULL,
      group_id     BIGINT UNSIGNED NOT NULL,
      subject_name VARCHAR(255) NOT NULL,
      color        VARCHAR(20) DEFAULT '#4f6eff',
      CONSTRAINT fk_wse_slot
        FOREIGN KEY (slot_id) REFERENCES weekly_time_slots(id) ON DELETE CASCADE,
      CONSTRAINT fk_wse_group
        FOREIGN KEY (group_id) REFERENCES \`groups\`(id) ON DELETE CASCADE
    );
  `;

  await connection.query(sql);
  console.log('✓ weekly_programs table created (or already exists)');
  console.log('✓ weekly_time_slots table created (or already exists)');
  console.log('✓ weekly_schedule_entries table created (or already exists)');

  await connection.end();
  console.log('Migration complete!');
}

run().catch(function(err) {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
