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
      await safeAlter(connection, `ALTER TABLE teachers ADD COLUMN national_id VARCHAR(50) NULL AFTER diploma`);
      await safeAlter(connection, `ALTER TABLE teachers ADD COLUMN social_security_number VARCHAR(50) NULL AFTER national_id`);
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
      await safeAlter(connection, `ALTER TABLE formations ADD COLUMN niveau VARCHAR(100) DEFAULT 'begin' AFTER type`);
      await safeAlter(connection, `ALTER TABLE formations MODIFY COLUMN niveau VARCHAR(100) DEFAULT 'begin'`);
      await safeAlter(connection, `ALTER TABLE formations ADD COLUMN places INT DEFAULT 0 AFTER niveau`);
      await safeAlter(connection, `ALTER TABLE formations ADD COLUMN status ENUM('open','closed') DEFAULT 'open' AFTER subscription_period`);
      await safeAlter(connection, `ALTER TABLE students ADD COLUMN next_payment_date DATE NULL AFTER subscription_plan`);
      await safeAlter(connection, `ALTER TABLE students ADD COLUMN promo_code VARCHAR(50) NULL AFTER next_payment_date`);
      await safeAlter(connection, `ALTER TABLE students ADD COLUMN discount_percent DECIMAL(5,2) DEFAULT 0 AFTER promo_code`);

      // students extended fields v2
      await safeAlter(connection, `ALTER TABLE students ADD COLUMN parent_id_number VARCHAR(50) NULL AFTER parent_name`);
      await safeAlter(connection, `ALTER TABLE students ADD COLUMN parent_phone2 VARCHAR(30) NULL AFTER parent_phone`);
      await safeAlter(connection, `ALTER TABLE students ADD COLUMN phone1_has_whatsapp TINYINT(1) DEFAULT 0 AFTER parent_phone`);
      await safeAlter(connection, `ALTER TABLE students ADD COLUMN phone1_has_viber TINYINT(1) DEFAULT 0 AFTER phone1_has_whatsapp`);
      await safeAlter(connection, `ALTER TABLE students ADD COLUMN phone1_has_telegram TINYINT(1) DEFAULT 0 AFTER phone1_has_viber`);
      await safeAlter(connection, `ALTER TABLE students ADD COLUMN phone2_has_whatsapp TINYINT(1) DEFAULT 0 AFTER parent_phone2`);
      await safeAlter(connection, `ALTER TABLE students ADD COLUMN phone2_has_viber TINYINT(1) DEFAULT 0 AFTER phone2_has_whatsapp`);
      await safeAlter(connection, `ALTER TABLE students ADD COLUMN phone2_has_telegram TINYINT(1) DEFAULT 0 AFTER phone2_has_viber`);
      await safeAlter(connection, `ALTER TABLE students ADD COLUMN guardian_name VARCHAR(255) NULL AFTER parent_phone2`);
      await safeAlter(connection, `ALTER TABLE students ADD COLUMN guardian_relationship VARCHAR(100) NULL AFTER guardian_name`);
      await safeAlter(connection, `ALTER TABLE students ADD COLUMN guardian_id_number VARCHAR(50) NULL AFTER guardian_relationship`);
      await safeAlter(connection, `ALTER TABLE students ADD COLUMN health_notes TEXT NULL AFTER guardian_id_number`);
      await safeAlter(connection, `ALTER TABLE students ADD COLUMN parents_status ENUM('together','divorced','father_deceased','mother_deceased','both_deceased','other') NULL AFTER health_notes`);

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

      // schools extended fields
      await safeAlter(connection, `ALTER TABLE schools ADD COLUMN logo2 VARCHAR(255) NULL AFTER logo`);
      await safeAlter(connection, `ALTER TABLE schools ADD COLUMN type VARCHAR(100) NULL`);
      await safeAlter(connection, `ALTER TABLE schools ADD COLUMN phone_landline VARCHAR(30) NULL`);
      await safeAlter(connection, `ALTER TABLE schools ADD COLUMN phone_1 VARCHAR(30) NULL`);
      await safeAlter(connection, `ALTER TABLE schools ADD COLUMN phone_2 VARCHAR(30) NULL`);
      await safeAlter(connection, `ALTER TABLE schools ADD COLUMN email VARCHAR(191) NULL`);
      await safeAlter(connection, `ALTER TABLE schools ADD COLUMN fax VARCHAR(30) NULL`);
      await safeAlter(connection, `ALTER TABLE schools ADD COLUMN state VARCHAR(100) NULL`);
      await safeAlter(connection, `ALTER TABLE schools ADD COLUMN district VARCHAR(100) NULL`);
      await safeAlter(connection, `ALTER TABLE schools ADD COLUMN municipality VARCHAR(100) NULL`);
      await safeAlter(connection, `ALTER TABLE schools ADD COLUMN postal_code VARCHAR(20) NULL`);
      await safeAlter(connection, `ALTER TABLE schools ADD COLUMN po_box VARCHAR(20) NULL`);
      await safeAlter(connection, `ALTER TABLE schools ADD COLUMN address TEXT NULL`);

      // teachers payment / RFID fields
      await safeAlter(connection, `ALTER TABLE teachers ADD COLUMN monthly_salary DECIMAL(10,2) NULL`);
      await safeAlter(connection, `ALTER TABLE teachers ADD COLUMN ccp_rib VARCHAR(100) NULL`);
      await safeAlter(connection, `ALTER TABLE teachers ADD COLUMN preferred_pay_method ENUM('cash','ccp') DEFAULT 'cash'`);
      await safeAlter(connection, `ALTER TABLE teachers ADD COLUMN rfid_tag VARCHAR(100) NULL`);

      // students RFID field
      await safeAlter(connection, `ALTER TABLE students ADD COLUMN rfid_tag VARCHAR(100) NULL`);

      // attendance columns
      await safeAlter(connection, `ALTER TABLE attendance ADD COLUMN subject_name VARCHAR(255) NOT NULL DEFAULT '' AFTER group_id`);
      await safeAlter(connection, `ALTER TABLE attendance ADD COLUMN scan_time TIME NULL`);

      // attendance_validations table + columns
      await safeAlter(connection, `CREATE TABLE IF NOT EXISTS attendance_validations (
        id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        group_id     BIGINT UNSIGNED NOT NULL,
        date         DATE            NOT NULL,
        subject_name VARCHAR(255)    NOT NULL DEFAULT '',
        validated_by BIGINT UNSIGNED NULL,
        created_at   TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY idx_val_unique (group_id, date, subject_name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
      await safeAlter(connection, `ALTER TABLE attendance_validations ADD COLUMN subject_name VARCHAR(255) NOT NULL DEFAULT ''`);
      await safeAlter(connection, `ALTER TABLE attendance_validations ADD COLUMN validated_by BIGINT UNSIGNED NULL`);

      // weekly program tables
      await safeAlter(connection, `CREATE TABLE IF NOT EXISTS weekly_programs (
        id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        school_id   BIGINT UNSIGNED NOT NULL,
        name        VARCHAR(255)    NOT NULL,
        description TEXT            NULL,
        status      ENUM('active','disabled') NOT NULL DEFAULT 'disabled',
        created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_wp_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
      await safeAlter(connection, `CREATE TABLE IF NOT EXISTS weekly_time_slots (
        id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        program_id  BIGINT UNSIGNED NOT NULL,
        label       VARCHAR(50)     NOT NULL,
        start_time  TIME            NOT NULL,
        end_time    TIME            NOT NULL,
        sort_order  INT             NOT NULL DEFAULT 0,
        CONSTRAINT fk_wts_program FOREIGN KEY (program_id) REFERENCES weekly_programs(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
      await safeAlter(connection, `CREATE TABLE IF NOT EXISTS weekly_schedule_entries (
        id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        slot_id      BIGINT UNSIGNED NOT NULL,
        day_of_week  TINYINT         NOT NULL,
        group_id     BIGINT UNSIGNED NOT NULL,
        subject_name VARCHAR(255)    NOT NULL,
        color        VARCHAR(20)     NOT NULL DEFAULT '#4f6eff',
        classroom_id BIGINT UNSIGNED NULL,
        CONSTRAINT fk_wse_slot  FOREIGN KEY (slot_id)  REFERENCES weekly_time_slots(id) ON DELETE CASCADE,
        CONSTRAINT fk_wse_group FOREIGN KEY (group_id) REFERENCES \`groups\`(id)         ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
      await safeAlter(connection, `ALTER TABLE weekly_schedule_entries ADD COLUMN classroom_id BIGINT UNSIGNED NULL`);

      // treasury_transactions table
      await safeAlter(connection, `CREATE TABLE IF NOT EXISTS treasury_transactions (
        id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        school_id        BIGINT UNSIGNED NOT NULL,
        type             ENUM('income','expense') NOT NULL,
        category         VARCHAR(100)    NULL,
        amount           DECIMAL(10,2)   NOT NULL,
        transaction_date DATE            NOT NULL,
        notes            TEXT            NULL,
        person_name      VARCHAR(255)    NULL,
        recorded_by      BIGINT UNSIGNED NULL,
        created_at       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

      // teacher_payments table
      await safeAlter(connection, `CREATE TABLE IF NOT EXISTS teacher_payments (
        id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        school_id       INT UNSIGNED NOT NULL,
        teacher_id      INT UNSIGNED NOT NULL,
        amount          DECIMAL(10,2) NOT NULL,
        pay_month       TINYINT       NOT NULL,
        pay_year        YEAR          NOT NULL,
        payment_date    DATE          NOT NULL,
        method          ENUM('cash','ccp') DEFAULT 'cash',
        notes           TEXT          NULL,
        treasury_tx_id  INT UNSIGNED  NULL,
        recorded_by     INT UNSIGNED  NULL,
        created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_teacher_month (teacher_id, pay_month, pay_year)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

      // notifications table
      await safeAlter(connection, `CREATE TABLE IF NOT EXISTS notifications (
        id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id    BIGINT UNSIGNED NOT NULL,
        message    TEXT            NOT NULL,
        is_read    TINYINT(1)      NOT NULL DEFAULT 0,
        created_at TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

      // promo_codes table
      await safeAlter(connection, `CREATE TABLE IF NOT EXISTS promo_codes (
        id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        formation_id     BIGINT UNSIGNED NOT NULL,
        code             VARCHAR(50)     NOT NULL,
        discount_percent DECIMAL(5,2)    NOT NULL,
        type             ENUM('many_students','one_student') NOT NULL DEFAULT 'many_students',
        is_active        TINYINT(1)      NOT NULL DEFAULT 1,
        created_at       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
        updated_at       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_promo_code (code)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

      // landing_inquiries table
      await safeAlter(connection, `CREATE TABLE IF NOT EXISTS landing_inquiries (
        id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        school_id       BIGINT UNSIGNED NULL,
        name            VARCHAR(255)    NOT NULL,
        phone           VARCHAR(30)     NULL,
        formation_title VARCHAR(255)    NULL,
        message         TEXT            NULL,
        status          ENUM('new','contacted','enrolled','cancelled') NOT NULL DEFAULT 'new',
        created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
        updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

      // quran_memorization table
      await safeAlter(connection, `CREATE TABLE IF NOT EXISTS quran_memorization (
        id            INT UNSIGNED    NOT NULL AUTO_INCREMENT PRIMARY KEY,
        school_id     INT             NOT NULL,
        student_id    INT             NOT NULL,
        group_id      INT             NULL,
        formation_id  BIGINT UNSIGNED NULL,
        cycle         VARCHAR(100)    NULL,
        session_date  DATE            NOT NULL,
        amount        VARCHAR(255)    NOT NULL,
        level         VARCHAR(100)    NULL,
        notes         TEXT            NULL,
        created_at    TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_qm_school  (school_id),
        INDEX idx_qm_student (student_id),
        INDEX idx_qm_date    (session_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
      await safeAlter(connection, `ALTER TABLE quran_memorization ADD COLUMN cycle VARCHAR(100) NULL`);
      await safeAlter(connection, `ALTER TABLE quran_memorization ADD COLUMN formation_id BIGINT UNSIGNED NULL`);
      await safeAlter(connection, `ALTER TABLE quran_memorization ADD COLUMN level VARCHAR(100) NULL`);

      // payment_history v2 columns
      await safeAlter(connection, `ALTER TABLE payment_history ADD COLUMN subscription_plan VARCHAR(20) NULL`);
      await safeAlter(connection, `ALTER TABLE payment_history ADD COLUMN promo_code_id BIGINT UNSIGNED NULL`);
      await safeAlter(connection, `ALTER TABLE payment_history ADD COLUMN discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0`);

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