const fs = require('fs/promises');
const path = require('path');
const mysql = require('mysql2/promise');

function splitSqlStatements(sql) {
  return sql
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean);
}

async function safeAlter(connection, sql) {
  try {
    await connection.query(sql);
  } catch (err) {
    // Ignore duplicate column / already exists errors
  }
}

async function bootstrapDatabase() {
  const databaseName = process.env.DB_NAME || 'school_system';

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: false,
  });

  try {
    const [existingTables] = await connection.query(
      `SELECT COUNT(*) AS table_count
       FROM information_schema.tables
       WHERE table_schema = ? AND table_name = 'users'`,
      [databaseName]
    );

    if (existingTables[0].table_count > 0) {
      // Migrate existing databases to include new columns/tables
      await connection.query(`USE \`${databaseName}\``);

      // users table additions
      await safeAlter(connection, `ALTER TABLE users ADD COLUMN gender ENUM('MALE','FEMALE') NULL AFTER role`);
      await safeAlter(connection, `ALTER TABLE users ADD COLUMN birth_date DATE NULL AFTER gender`);
      await safeAlter(connection, `ALTER TABLE users ADD COLUMN photo VARCHAR(255) NULL AFTER birth_date`);
      await safeAlter(connection, `ALTER TABLE users MODIFY COLUMN role ENUM('admin','super_admin','teacher','student') NOT NULL DEFAULT 'admin'`);
      await safeAlter(connection, `ALTER TABLE users ADD COLUMN blood_type ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NULL AFTER photo`);

      // schools table additions
      await safeAlter(connection, `ALTER TABLE schools ADD COLUMN logo VARCHAR(255) NULL AFTER code`);
      await safeAlter(connection, `ALTER TABLE schools ADD COLUMN admin_id BIGINT UNSIGNED NULL AFTER logo`);
      await safeAlter(connection, `ALTER TABLE schools ADD COLUMN contact_info_id BIGINT UNSIGNED NULL AFTER admin_id`);

      // school_users pivot table
      await safeAlter(connection, `CREATE TABLE IF NOT EXISTS school_users (
        school_id BIGINT UNSIGNED NOT NULL,
        user_id BIGINT UNSIGNED NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (school_id, user_id),
        CONSTRAINT fk_su_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
        CONSTRAINT fk_su_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`);

      // students table additions
      await safeAlter(connection, `ALTER TABLE students ADD COLUMN parent_name VARCHAR(255) NULL AFTER registration_number`);
      await safeAlter(connection, `ALTER TABLE students ADD COLUMN parent_phone VARCHAR(30) NULL AFTER parent_name`);
      // Make school_id nullable if it exists as NOT NULL
      await safeAlter(connection, `ALTER TABLE students MODIFY COLUMN school_id BIGINT UNSIGNED NULL`);
      await safeAlter(connection, `ALTER TABLE students ADD COLUMN school_id BIGINT UNSIGNED NULL AFTER user_id`);

      // teachers table additions
      await safeAlter(connection, `ALTER TABLE teachers ADD COLUMN speciality VARCHAR(255) NULL AFTER specialization`);
      await safeAlter(connection, `ALTER TABLE teachers ADD COLUMN diploma VARCHAR(255) NULL AFTER speciality`);
      // Make school_id nullable if it exists as NOT NULL
      await safeAlter(connection, `ALTER TABLE teachers MODIFY COLUMN school_id BIGINT UNSIGNED NULL`);
      await safeAlter(connection, `ALTER TABLE teachers ADD COLUMN school_id BIGINT UNSIGNED NULL AFTER user_id`);

      // formations table additions
      await safeAlter(connection, `ALTER TABLE formations ADD COLUMN image VARCHAR(255) NULL AFTER description`);
      await safeAlter(connection, `ALTER TABLE formations ADD COLUMN classroom_id BIGINT UNSIGNED NULL AFTER teacher_id`);
      await safeAlter(connection, `ALTER TABLE formations MODIFY COLUMN teacher_id BIGINT UNSIGNED NULL`);
      await safeAlter(connection, `ALTER TABLE formations ADD COLUMN price_monthly DECIMAL(10,2) NULL AFTER price`);
      await safeAlter(connection, `ALTER TABLE formations ADD COLUMN price_3_months DECIMAL(10,2) NULL AFTER price_monthly`);
      await safeAlter(connection, `ALTER TABLE formations ADD COLUMN price_1_year DECIMAL(10,2) NULL AFTER price_3_months`);
      await safeAlter(connection, `ALTER TABLE formations ADD COLUMN subscription_period ENUM('1_month','3_months','1_year') NULL AFTER type`);
      await safeAlter(connection, `ALTER TABLE formations ADD COLUMN status ENUM('open','closed') DEFAULT 'open' AFTER subscription_period`);
      await safeAlter(connection, `ALTER TABLE students ADD COLUMN next_payment_date DATE NULL AFTER subscription_plan`);
      await safeAlter(connection, `ALTER TABLE students ADD COLUMN promo_code VARCHAR(50) NULL AFTER next_payment_date`);
      await safeAlter(connection, `ALTER TABLE students ADD COLUMN discount_percent DECIMAL(5,2) DEFAULT 0 AFTER promo_code`);

      // classrooms table additions
      await safeAlter(connection, `ALTER TABLE classrooms ADD COLUMN description TEXT NULL AFTER capacity`);

      // groups table additions
      await safeAlter(connection, `ALTER TABLE \`groups\` ADD COLUMN teacher_id BIGINT UNSIGNED NULL AFTER formation_id`);
      await safeAlter(connection, `ALTER TABLE \`groups\` ADD COLUMN classroom_id BIGINT UNSIGNED NULL AFTER teacher_id`);
      await safeAlter(connection, `ALTER TABLE \`groups\` ADD COLUMN start_date DATE NULL AFTER name`);
      await safeAlter(connection, `ALTER TABLE \`groups\` ADD COLUMN end_date DATE NULL AFTER start_date`);
      await safeAlter(connection, `ALTER TABLE \`groups\` ADD COLUMN max_students INT DEFAULT 30 AFTER end_date`);
      await safeAlter(connection, `ALTER TABLE \`groups\` ADD CONSTRAINT fk_group_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL`);

      // payment_history table
      await safeAlter(connection, `CREATE TABLE IF NOT EXISTS payment_history (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        student_id BIGINT UNSIGNED NOT NULL,
        school_id BIGINT UNSIGNED NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        payment_date DATE NOT NULL,
        payment_method ENUM('cash','bank_transfer','card','other') DEFAULT 'cash',
        notes TEXT NULL,
        recorded_by_user_id BIGINT UNSIGNED NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_ph_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        CONSTRAINT fk_ph_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
      )`);

      // payment_history v2 columns
      await safeAlter(connection, `ALTER TABLE payment_history ADD COLUMN subscription_plan VARCHAR(20) NULL AFTER notes`);
      await safeAlter(connection, `ALTER TABLE payment_history ADD COLUMN promo_code_id BIGINT UNSIGNED NULL AFTER subscription_plan`);
      await safeAlter(connection, `ALTER TABLE payment_history ADD COLUMN discount_percent DECIMAL(5,2) DEFAULT 0 AFTER promo_code_id`);

      // contact_infos social media columns
      await safeAlter(connection, `ALTER TABLE contact_infos ADD COLUMN fb VARCHAR(255) NULL`);
      await safeAlter(connection, `ALTER TABLE contact_infos ADD COLUMN whatsapp VARCHAR(255) NULL`);
      await safeAlter(connection, `ALTER TABLE contact_infos ADD COLUMN linkedin VARCHAR(255) NULL`);
      await safeAlter(connection, `ALTER TABLE contact_infos ADD COLUMN youtube VARCHAR(255) NULL`);
      await safeAlter(connection, `ALTER TABLE contact_infos ADD COLUMN instagram VARCHAR(255) NULL`);

      console.log('Database migration completed.');
      return;
    }

    const schemaPath = path.resolve(__dirname, '../../../db.sql');
    try {
      const schemaSql = await fs.readFile(schemaPath, 'utf8');
      const statements = splitSqlStatements(schemaSql);
      
      for (const statement of statements) {
        await connection.query(statement);
      }
      console.log('Database initialized from schema.');
    } catch (err) {
      if (err.code === 'ENOENT') {
        console.warn('Warning: db.sql not found. Skipping database initialization from schema.');
      } else {
        throw err;
      }
    }
  } finally {
    await connection.end();
  }
}

module.exports = bootstrapDatabase;