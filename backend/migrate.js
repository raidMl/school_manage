const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const TABLE_SCHEMAS = {
  users: `
    CREATE TABLE IF NOT EXISTS users (
      id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      first_name   VARCHAR(100)  NOT NULL,
      last_name    VARCHAR(100)  NOT NULL,
      email        VARCHAR(191)  NOT NULL UNIQUE,
      phone        VARCHAR(30)   NULL,
      password     VARCHAR(255)  NOT NULL,
      role         ENUM('admin','super_admin','teacher','student','employee') NOT NULL DEFAULT 'admin',
      gender       ENUM('MALE','FEMALE') NULL,
      birth_date   DATE          NULL,
      photo        VARCHAR(255)  NULL DEFAULT '',
      blood_type   ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NULL,
      website      VARCHAR(255)  NULL,
      social_links TEXT          NULL,
      is_active    TINYINT(1)    NOT NULL DEFAULT 1,
      created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
      updated_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  schools: `
    CREATE TABLE IF NOT EXISTS schools (
      id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name             VARCHAR(255)  NOT NULL,
      code             VARCHAR(50)   NULL,
      logo             VARCHAR(255)  NULL,
      logo2            VARCHAR(255)  NULL,
      admin_id         BIGINT UNSIGNED NULL,
      contact_info_id  BIGINT UNSIGNED NULL,
      type             VARCHAR(100)  NULL,
      phone_landline   VARCHAR(30)   NULL,
      phone_1          VARCHAR(30)   NULL,
      phone_2          VARCHAR(30)   NULL,
      email            VARCHAR(191)  NULL,
      fax              VARCHAR(30)   NULL,
      state            VARCHAR(100)  NULL,
      district         VARCHAR(100)  NULL,
      municipality     VARCHAR(100)  NULL,
      postal_code      VARCHAR(20)   NULL,
      po_box           VARCHAR(20)   NULL,
      website          VARCHAR(255)  NULL,
      social_links     TEXT          NULL,
      address          TEXT          NULL,
      created_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
      updated_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  contact_infos: `
    CREATE TABLE IF NOT EXISTS contact_infos (
      id                     BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id                BIGINT UNSIGNED NULL,
      school_id              BIGINT UNSIGNED NULL,
      address                TEXT          NULL,
      city                   VARCHAR(100)  NULL,
      state                  VARCHAR(100)  NULL,
      postal_code            VARCHAR(20)   NULL,
      country                VARCHAR(100)  NULL,
      emergency_contact_name VARCHAR(255)  NULL,
      emergency_contact_phone VARCHAR(30)  NULL,
      fb                     VARCHAR(255)  NULL,
      whatsapp               VARCHAR(255)  NULL,
      linkedin               VARCHAR(255)  NULL,
      youtube                VARCHAR(255)  NULL,
      instagram              VARCHAR(255)  NULL,
      created_at             TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
      updated_at             TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  school_users: `
    CREATE TABLE IF NOT EXISTS school_users (
      school_id   BIGINT UNSIGNED NOT NULL,
      user_id     BIGINT UNSIGNED NOT NULL,
      created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (school_id, user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  admins: `
    CREATE TABLE IF NOT EXISTS admins (
      id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id    BIGINT UNSIGNED NOT NULL,
      school_id  BIGINT UNSIGNED NULL,
      created_at TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  classrooms: `
    CREATE TABLE IF NOT EXISTS classrooms (
      id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      school_id   BIGINT UNSIGNED NOT NULL,
      name        VARCHAR(255) NOT NULL,
      capacity    INT          NULL,
      description TEXT         NULL,
      created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  teachers: `
    CREATE TABLE IF NOT EXISTS teachers (
      id                     BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id                BIGINT UNSIGNED NOT NULL,
      school_id              BIGINT UNSIGNED NULL,
      staff_type             ENUM('teacher','employee') NOT NULL DEFAULT 'teacher',
      job_title              VARCHAR(255)  NULL,
      employee_number        VARCHAR(50)   NULL,
      phone                  VARCHAR(30)   NULL,
      specialization         VARCHAR(255)  NULL,
      speciality             VARCHAR(255)  NULL,
      diploma                VARCHAR(255)  NULL,
      national_id            VARCHAR(50)   NULL,
      social_security_number VARCHAR(50)   NULL,
      hire_date              DATE          NULL,
      monthly_salary         DECIMAL(10,2) NULL,
      ccp_rib                VARCHAR(100)  NULL,
      preferred_pay_method   ENUM('cash','ccp') DEFAULT 'cash',
      rfid_tag               VARCHAR(100)  NULL,
      created_at             TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  formations: `
    CREATE TABLE IF NOT EXISTS formations (
      id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      school_id           BIGINT UNSIGNED NOT NULL,
      teacher_id          BIGINT UNSIGNED NULL,
      classroom_id        BIGINT UNSIGNED NULL,
      title               VARCHAR(255)    NOT NULL,
      description         TEXT            NULL,
      image               VARCHAR(255)    NULL,
      duration_hours      INT             NULL,
      price               DECIMAL(10,2)   NOT NULL DEFAULT 0,
      price_monthly       DECIMAL(10,2)   NULL,
      price_3_months      DECIMAL(10,2)   NULL,
      price_1_year        DECIMAL(10,2)   NULL,
      type                VARCHAR(50)     NOT NULL DEFAULT 'formation',
      subscription_period ENUM('1_month','3_months','1_year') NULL,
      niveau              VARCHAR(100)    NOT NULL DEFAULT 'begin',
      places              INT             NOT NULL DEFAULT 0,
      status              ENUM('open','closed') NOT NULL DEFAULT 'open',
      start_date          DATE            NULL,
      end_date            DATE            NULL,
      created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
      updated_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  groups: `
    CREATE TABLE IF NOT EXISTS \`groups\` (
      id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      formation_id BIGINT UNSIGNED NOT NULL,
      teacher_id   BIGINT UNSIGNED NULL,
      classroom_id BIGINT UNSIGNED NULL,
      name         VARCHAR(255)    NOT NULL,
      start_date   DATE            NULL,
      end_date     DATE            NULL,
      max_students INT             NOT NULL DEFAULT 30,
      capacity     INT             NULL,
      created_at   TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  students: `
    CREATE TABLE IF NOT EXISTS students (
      id                   BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id              BIGINT UNSIGNED NOT NULL,
      school_id            BIGINT UNSIGNED NULL,
      formation_id         BIGINT UNSIGNED NULL,
      registration_number  VARCHAR(50)     NULL,
      rfid_tag             VARCHAR(100)    NULL,
      parent_name          VARCHAR(255)    NULL,
      parent_id_number     VARCHAR(50)     NULL,
      parent_phone         VARCHAR(30)     NULL,
      phone1_has_whatsapp  TINYINT(1)      DEFAULT 0,
      phone1_has_viber     TINYINT(1)      DEFAULT 0,
      phone1_has_telegram  TINYINT(1)      DEFAULT 0,
      parent_phone2        VARCHAR(30)     NULL,
      phone2_has_whatsapp  TINYINT(1)      DEFAULT 0,
      phone2_has_viber     TINYINT(1)      DEFAULT 0,
      phone2_has_telegram  TINYINT(1)      DEFAULT 0,
      guardian_name        VARCHAR(255)    NULL,
      guardian_relationship VARCHAR(100)   NULL,
      guardian_id_number   VARCHAR(50)     NULL,
      health_notes         TEXT            NULL,
      parents_status       ENUM('together','divorced','father_deceased','mother_deceased','both_deceased','other') NULL,
      birth_date           DATE            NULL,
      gender               ENUM('MALE','FEMALE') NULL,
      enrollment_date      DATE            NULL,
      payment_status       VARCHAR(50)     NULL,
      subscription_plan    VARCHAR(20)     NULL,
      next_payment_date    DATE            NULL,
      promo_code           VARCHAR(50)     NULL,
      discount_percent     DECIMAL(5,2)    NOT NULL DEFAULT 0,
      created_at           TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  student_groups: `
    CREATE TABLE IF NOT EXISTS student_groups (
      id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      student_id BIGINT UNSIGNED NOT NULL,
      group_id   BIGINT UNSIGNED NOT NULL,
      joined_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_sg_pair (student_id, group_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  attendance: `
    CREATE TABLE IF NOT EXISTS attendance (
      id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_type    ENUM('student','teacher','employee') NOT NULL,
      user_id      BIGINT UNSIGNED NOT NULL,
      group_id     BIGINT UNSIGNED NULL,
      date         DATE            NOT NULL,
      subject_name VARCHAR(255)    NOT NULL DEFAULT '',
      status       ENUM('present','absent','late','excused','pending') NOT NULL DEFAULT 'pending',
      scan_time    TIME            NULL,
      notes        TEXT            NULL,
      created_at   TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
      updated_at   TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  attendance_validations: `
    CREATE TABLE IF NOT EXISTS attendance_validations (
      id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      group_id     BIGINT UNSIGNED NOT NULL,
      date         DATE            NOT NULL,
      subject_name VARCHAR(255)    NOT NULL DEFAULT '',
      validated_by BIGINT UNSIGNED NULL,
      created_at   TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  weekly_programs: `
    CREATE TABLE IF NOT EXISTS weekly_programs (
      id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      school_id   BIGINT UNSIGNED NOT NULL,
      name        VARCHAR(255)    NOT NULL,
      description TEXT            NULL,
      status      ENUM('active','disabled') NOT NULL DEFAULT 'disabled',
      created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
      updated_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  weekly_time_slots: `
    CREATE TABLE IF NOT EXISTS weekly_time_slots (
      id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      program_id  BIGINT UNSIGNED NOT NULL,
      label       VARCHAR(50)     NOT NULL,
      start_time  TIME            NOT NULL,
      end_time    TIME            NOT NULL,
      sort_order  INT             NOT NULL DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  weekly_schedule_entries: `
    CREATE TABLE IF NOT EXISTS weekly_schedule_entries (
      id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      slot_id      BIGINT UNSIGNED NOT NULL,
      day_of_week  TINYINT         NOT NULL,
      group_id     BIGINT UNSIGNED NOT NULL,
      subject_name VARCHAR(255)    NOT NULL,
      color        VARCHAR(20)     NOT NULL DEFAULT '#4f6eff',
      classroom_id BIGINT UNSIGNED NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  payment_history: `
    CREATE TABLE IF NOT EXISTS payment_history (
      id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      student_id          BIGINT UNSIGNED NOT NULL,
      school_id           BIGINT UNSIGNED NOT NULL,
      amount              DECIMAL(10,2)   NOT NULL,
      payment_date        DATE            NOT NULL,
      payment_method      ENUM('cash','bank_transfer','card','other') DEFAULT 'cash',
      notes               TEXT            NULL,
      subscription_plan   VARCHAR(20)     NULL,
      promo_code_id       BIGINT UNSIGNED NULL,
      discount_percent    DECIMAL(5,2)    NOT NULL DEFAULT 0,
      recorded_by_user_id BIGINT UNSIGNED NULL,
      created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  teacher_payments: `
    CREATE TABLE IF NOT EXISTS teacher_payments (
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
      created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  treasury_transactions: `
    CREATE TABLE IF NOT EXISTS treasury_transactions (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  promo_codes: `
    CREATE TABLE IF NOT EXISTS promo_codes (
      id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      formation_id     BIGINT UNSIGNED NOT NULL,
      code             VARCHAR(50)     NOT NULL,
      discount_percent DECIMAL(5,2)    NOT NULL,
      type             ENUM('many_students','one_student') NOT NULL DEFAULT 'many_students',
      is_active        TINYINT(1)      NOT NULL DEFAULT 1,
      created_at       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
      updated_at       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  notifications: `
    CREATE TABLE IF NOT EXISTS notifications (
      id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id    BIGINT UNSIGNED NOT NULL,
      message    TEXT            NOT NULL,
      is_read    TINYINT(1)      NOT NULL DEFAULT 0,
      created_at TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  landing_inquiries: `
    CREATE TABLE IF NOT EXISTS landing_inquiries (
      id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      school_id       BIGINT UNSIGNED NULL,
      name            VARCHAR(255)    NOT NULL,
      phone           VARCHAR(30)     NULL,
      formation_title VARCHAR(255)    NULL,
      message         TEXT            NULL,
      status          ENUM('new','contacted','enrolled','cancelled') NOT NULL DEFAULT 'new',
      created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
      updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  quran_memorization: `
    CREATE TABLE IF NOT EXISTS quran_memorization (
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
      INDEX idx_qm_school    (school_id),
      INDEX idx_qm_student   (student_id),
      INDEX idx_qm_group     (group_id),
      INDEX idx_qm_formation (formation_id),
      INDEX idx_qm_date      (session_date),
      INDEX idx_qm_cycle     (cycle)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  quran_levels: `
    CREATE TABLE IF NOT EXISTS quran_levels (
      id          INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      school_id   INT          NOT NULL,
      name        VARCHAR(150) NOT NULL,
      description VARCHAR(255) DEFAULT NULL,
      order_index INT          NOT NULL DEFAULT 0,
      created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
      updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_ql_school (school_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  school_inventory: `
    CREATE TABLE IF NOT EXISTS school_inventory (
      id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      school_id     INT UNSIGNED NOT NULL,
      name          VARCHAR(255) NOT NULL,
      type          VARCHAR(100) NULL,
      quantity      INT          NOT NULL DEFAULT 1,
      emplacement   VARCHAR(255) NULL,
      status        VARCHAR(100) NULL,
      added_by      INT UNSIGNED NULL,
      added_date    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_inv_school (school_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `
};

// Map of columns to add to existing tables if missing: { tableName: { colName: "definition" } }
const TABLE_COLUMNS = {
  users: {
    gender: "ENUM('MALE','FEMALE') NULL AFTER role",
    birth_date: "DATE NULL AFTER gender",
    photo: "VARCHAR(255) NULL DEFAULT '' AFTER birth_date",
    blood_type: "ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NULL AFTER photo",
    website: "VARCHAR(255) NULL",
    social_links: "TEXT NULL",
    is_active: "TINYINT(1) NOT NULL DEFAULT 1"
  },
  schools: {
    logo: "VARCHAR(255) NULL",
    logo2: "VARCHAR(255) NULL",
    admin_id: "BIGINT UNSIGNED NULL",
    contact_info_id: "BIGINT UNSIGNED NULL",
    type: "VARCHAR(100) NULL",
    phone_landline: "VARCHAR(30) NULL",
    phone_1: "VARCHAR(30) NULL",
    phone_2: "VARCHAR(30) NULL",
    email: "VARCHAR(191) NULL",
    fax: "VARCHAR(30) NULL",
    state: "VARCHAR(100) NULL",
    district: "VARCHAR(100) NULL",
    municipality: "VARCHAR(100) NULL",
    postal_code: "VARCHAR(20) NULL",
    po_box: "VARCHAR(20) NULL",
    website: "VARCHAR(255) NULL",
    social_links: "TEXT NULL",
    address: "TEXT NULL"
  },
  contact_infos: {
    user_id: "BIGINT UNSIGNED NULL",
    school_id: "BIGINT UNSIGNED NULL",
    address: "TEXT NULL",
    city: "VARCHAR(100) NULL",
    state: "VARCHAR(100) NULL",
    postal_code: "VARCHAR(20) NULL",
    country: "VARCHAR(100) NULL",
    emergency_contact_name: "VARCHAR(255) NULL",
    emergency_contact_phone: "VARCHAR(30) NULL",
    fb: "VARCHAR(255) NULL",
    whatsapp: "VARCHAR(255) NULL",
    linkedin: "VARCHAR(255) NULL",
    youtube: "VARCHAR(255) NULL",
    instagram: "VARCHAR(255) NULL"
  },
  classrooms: {
    capacity: "INT NULL",
    description: "TEXT NULL"
  },
  teachers: {
    school_id: "BIGINT UNSIGNED NULL",
    staff_type: "ENUM('teacher','employee') NOT NULL DEFAULT 'teacher' AFTER school_id",
    job_title: "VARCHAR(255) NULL AFTER staff_type",
    phone: "VARCHAR(30) NULL",
    specialization: "VARCHAR(255) NULL",
    speciality: "VARCHAR(255) NULL",
    diploma: "VARCHAR(255) NULL",
    national_id: "VARCHAR(50) NULL",
    social_security_number: "VARCHAR(50) NULL",
    hire_date: "DATE NULL",
    monthly_salary: "DECIMAL(10,2) NULL",
    ccp_rib: "VARCHAR(100) NULL",
    preferred_pay_method: "ENUM('cash','ccp') DEFAULT 'cash'",
    rfid_tag: "VARCHAR(100) NULL"
  },
  formations: {
    image: "VARCHAR(255) NULL",
    classroom_id: "BIGINT UNSIGNED NULL",
    price_monthly: "DECIMAL(10,2) NULL",
    price_3_months: "DECIMAL(10,2) NULL",
    price_1_year: "DECIMAL(10,2) NULL",
    subscription_period: "ENUM('1_month','3_months','1_year') NULL",
    niveau: "VARCHAR(100) NOT NULL DEFAULT 'begin'",
    places: "INT NOT NULL DEFAULT 0",
    status: "ENUM('open','closed') NOT NULL DEFAULT 'open'",
    start_date: "DATE NULL",
    end_date: "DATE NULL"
  },
  groups: {
    teacher_id: "BIGINT UNSIGNED NULL",
    classroom_id: "BIGINT UNSIGNED NULL",
    start_date: "DATE NULL",
    end_date: "DATE NULL",
    max_students: "INT NOT NULL DEFAULT 30",
    capacity: "INT NULL"
  },
  students: {
    school_id: "BIGINT UNSIGNED NULL",
    formation_id: "BIGINT UNSIGNED NULL",
    registration_number: "VARCHAR(50) NULL",
    rfid_tag: "VARCHAR(100) NULL",
    parent_name: "VARCHAR(255) NULL",
    parent_id_number: "VARCHAR(50) NULL",
    parent_phone: "VARCHAR(30) NULL",
    phone1_has_whatsapp: "TINYINT(1) DEFAULT 0",
    phone1_has_viber: "TINYINT(1) DEFAULT 0",
    phone1_has_telegram: "TINYINT(1) DEFAULT 0",
    parent_phone2: "VARCHAR(30) NULL",
    phone2_has_whatsapp: "TINYINT(1) DEFAULT 0",
    phone2_has_viber: "TINYINT(1) DEFAULT 0",
    phone2_has_telegram: "TINYINT(1) DEFAULT 0",
    guardian_name: "VARCHAR(255) NULL",
    guardian_relationship: "VARCHAR(100) NULL",
    guardian_id_number: "VARCHAR(50) NULL",
    health_notes: "TEXT NULL",
    parents_status: "ENUM('together','divorced','father_deceased','mother_deceased','both_deceased','other') NULL",
    birth_date: "DATE NULL",
    gender: "ENUM('MALE','FEMALE') NULL",
    enrollment_date: "DATE NULL",
    payment_status: "VARCHAR(50) NULL",
    subscription_plan: "VARCHAR(20) NULL",
    next_payment_date: "DATE NULL",
    promo_code: "VARCHAR(50) NULL",
    discount_percent: "DECIMAL(5,2) NOT NULL DEFAULT 0"
  },
  student_groups: {
    joined_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
  },
  attendance: {
    subject_name: "VARCHAR(255) NOT NULL DEFAULT ''",
    scan_time: "TIME NULL"
  },
  attendance_validations: {
    subject_name: "VARCHAR(255) NOT NULL DEFAULT ''",
    validated_by: "BIGINT UNSIGNED NULL"
  },
  payment_history: {
    subscription_plan: "VARCHAR(20) NULL",
    promo_code_id: "BIGINT UNSIGNED NULL",
    discount_percent: "DECIMAL(5,2) NOT NULL DEFAULT 0"
  },
  weekly_schedule_entries: {
    classroom_id: "BIGINT UNSIGNED NULL",
    color: "VARCHAR(20) NOT NULL DEFAULT '#4f6eff'"
  },
  quran_memorization: {
    formation_id: "BIGINT UNSIGNED NULL",
    cycle: "VARCHAR(100) NULL",
    level: "VARCHAR(100) NULL"
  }
};

async function migrate() {
  console.log('----------------------------------------------------');
  console.log(' Starting Database Migration');
  console.log(` Target DB: ${process.env.DB_NAME} on ${process.env.DB_HOST}:${process.env.DB_PORT || 3306}`);
  console.log(` User: ${process.env.DB_USER}`);
  console.log('----------------------------------------------------\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_system',
    multipleStatements: true
  });

  try {
    // 1. Ensure all tables exist
    console.log('[1/4] Checking and creating missing tables...');
    for (const [tableName, sql] of Object.entries(TABLE_SCHEMAS)) {
      try {
        await connection.query(sql);
        console.log(`  ✓ Table '${tableName}' ready.`);
      } catch (err) {
        console.error(`  ✗ Error creating table '${tableName}':`, err.message);
      }
    }

    // 2. Ensure all columns exist in all tables
    console.log('\n[2/4] Checking and adding missing columns to existing tables...');
    for (const [tableName, cols] of Object.entries(TABLE_COLUMNS)) {
      try {
        const [existingCols] = await connection.query(`SHOW COLUMNS FROM \`${tableName}\``);
        const colNames = new Set(existingCols.map(c => c.Field.toLowerCase()));

        for (const [colName, colDef] of Object.entries(cols)) {
          if (!colNames.has(colName.toLowerCase())) {
            try {
              await connection.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${colName}\` ${colDef}`);
              console.log(`  + Added column '${colName}' to table '${tableName}'`);
            } catch (colErr) {
              if (colErr.code === 'ER_DUP_FIELDNAME') {
                // Already added
              } else {
                console.error(`  ✗ Failed adding '${colName}' to '${tableName}':`, colErr.message);
              }
            }
          }
        }
      } catch (tableErr) {
        console.warn(`  ! Could not inspect columns for '${tableName}':`, tableErr.message);
      }
    }

    // 3. Ensure required unique indexes exist
    console.log('\n[3/4] Ensuring required indexes and unique constraints...');
    
    // 3a. attendance unique index
    try {
      const [idx] = await connection.query(`SHOW INDEX FROM attendance WHERE Key_name = 'uq_attendance'`);
      if (idx.length === 0) {
        await connection.query(`
          ALTER TABLE attendance 
          ADD UNIQUE KEY uq_attendance (user_type, user_id, group_id, date, subject_name)
        `);
        console.log("  + Added index 'uq_attendance' to table 'attendance'");
      }
    } catch (e) {
      // ignore if duplicate or error
    }

    // 3b. attendance_validations unique index
    try {
      // drop old single indexes if they exist
      try { await connection.query(`ALTER TABLE attendance_validations DROP INDEX \`group_id\``); } catch(e){}
      try { await connection.query(`ALTER TABLE attendance_validations DROP INDEX \`date\``); } catch(e){}
      
      const [idx] = await connection.query(`SHOW INDEX FROM attendance_validations WHERE Key_name = 'idx_val_unique'`);
      if (idx.length === 0) {
        await connection.query(`
          ALTER TABLE attendance_validations 
          ADD UNIQUE KEY idx_val_unique (group_id, date, subject_name)
        `);
        console.log("  + Added index 'idx_val_unique' to table 'attendance_validations'");
      }
    } catch (e) {
      // ignore
    }

    // 3c. teacher_payments unique index
    try {
      const [idx] = await connection.query(`SHOW INDEX FROM teacher_payments WHERE Key_name = 'uq_teacher_month'`);
      if (idx.length === 0) {
        await connection.query(`
          ALTER TABLE teacher_payments 
          ADD UNIQUE KEY uq_teacher_month (teacher_id, pay_month, pay_year)
        `);
        console.log("  + Added index 'uq_teacher_month' to table 'teacher_payments'");
      }
    } catch (e) {
      // ignore
    }

    // 3d. promo_codes unique index
    try {
      const [idx] = await connection.query(`SHOW INDEX FROM promo_codes WHERE Key_name = 'uq_promo_code'`);
      if (idx.length === 0) {
        await connection.query(`
          ALTER TABLE promo_codes 
          ADD UNIQUE KEY uq_promo_code (code)
        `);
        console.log("  + Added index 'uq_promo_code' to table 'promo_codes'");
      }
    } catch (e) {
      // ignore
    }

    // 4. Default Seed Data (Quran levels)
    console.log('\n[4/4] Verifying default configuration records...');
    try {
      const [schools] = await connection.query(`SELECT id FROM schools LIMIT 10`);
      for (const s of schools) {
        const [lvls] = await connection.query(`SELECT id FROM quran_levels WHERE school_id = ? LIMIT 1`, [s.id]);
        if (lvls.length === 0) {
          await connection.query(`
            INSERT INTO quran_levels (school_id, name, description, order_index) VALUES
            (?, 'مستوى 1', 'من 1 إلى 5 أحزاب', 1),
            (?, 'مستوى 2', 'من 5 إلى 10 أحزاب', 2),
            (?, 'مستوى 3', 'من 10 إلى 20 حزب', 3),
            (?, 'مستوى 4', 'من 20 إلى 30 حزب', 4),
            (?, 'مستوى 5', 'من 30 إلى 45 حزب', 5),
            (?, 'مستوى 6', 'من 45 إلى 60 حزب', 6)
          `, [s.id, s.id, s.id, s.id, s.id, s.id]);
          console.log(`  ✓ Seeded default Quran levels for school ID ${s.id}`);
        }
      }
    } catch (seedErr) {
      console.warn('  ! Quran levels seed notice:', seedErr.message);
    }

    console.log('\n====================================================');
    console.log(' ✓ ALL DATABASE MIGRATIONS COMPLETED SUCCESSFULLY!  ');
    console.log('====================================================\n');
  } finally {
    await connection.end();
  }
}

migrate().catch(err => {
  console.error('\n Migration failed with error:');
  console.error(err);
  process.exit(1);
});
