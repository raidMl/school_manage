const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function migrate() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  try {
    try {
      await conn.query(`ALTER TABLE teachers ADD COLUMN monthly_salary DECIMAL(10,2) DEFAULT NULL`);
      console.log('Added monthly_salary column');
    } catch(e) { if (e.code !== 'ER_DUP_FIELDNAME') throw e; console.log('monthly_salary already exists'); }

    try {
      await conn.query(`ALTER TABLE teachers ADD COLUMN ccp_rib VARCHAR(100) DEFAULT NULL`);
      console.log('Added ccp_rib column');
    } catch(e) { if (e.code !== 'ER_DUP_FIELDNAME') throw e; console.log('ccp_rib already exists'); }

    try {
      await conn.query(`ALTER TABLE teachers ADD COLUMN preferred_pay_method ENUM('cash','ccp') DEFAULT 'cash'`);
      console.log('Added preferred_pay_method column');
    } catch(e) { if (e.code !== 'ER_DUP_FIELDNAME') throw e; console.log('preferred_pay_method already exists'); }

    await conn.query(`
      CREATE TABLE IF NOT EXISTS teacher_payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        teacher_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        pay_month TINYINT NOT NULL,
        pay_year YEAR NOT NULL,
        payment_date DATE NOT NULL,
        method ENUM('cash','ccp') DEFAULT 'cash',
        notes TEXT,
        treasury_tx_id INT DEFAULT NULL,
        recorded_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_teacher_month (teacher_id, pay_month, pay_year)
      )
    `);
    console.log('teacher_payments table ready');
    console.log('Migration complete!');
  } finally {
    await conn.end();
  }
}

migrate().catch(e => { console.error('Migration failed:', e.message); process.exit(1); });
