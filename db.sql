-- =====================================================
-- SCHOOL MANAGEMENT SYSTEM
-- =====================================================

CREATE DATABASE IF NOT EXISTS school_management
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE school_management;

-- =====================================================
-- USERS
-- =====================================================

CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,

    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,

    role ENUM(
        'super_admin',
        'admin',
        'teacher',
        'student'
    ) NOT NULL,

    gender ENUM('male','female') NULL,
    birth_date DATE NULL,
    photo VARCHAR(255) NULL,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- CONTACT INFORMATION
-- =====================================================

CREATE TABLE contact_infos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    phone_1 VARCHAR(30),
    phone_2 VARCHAR(30),
    fixed_phone VARCHAR(30),

    emergency_phone VARCHAR(30),

    email VARCHAR(255),

    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),

    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- USER CONTACT INFO
-- =====================================================

CREATE TABLE user_contact_infos (
    user_id BIGINT UNSIGNED PRIMARY KEY,
    contact_info_id BIGINT UNSIGNED NOT NULL,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (contact_info_id)
        REFERENCES contact_infos(id)
        ON DELETE CASCADE
);

-- =====================================================
-- SCHOOLS
-- =====================================================

CREATE TABLE schools (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(255) NOT NULL,
    logo VARCHAR(255) NULL,

    admin_id BIGINT UNSIGNED NOT NULL,

    contact_info_id BIGINT UNSIGNED NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (admin_id)
        REFERENCES users(id),

    FOREIGN KEY (contact_info_id)
        REFERENCES contact_infos(id)
);

-- =====================================================
-- TEACHERS
-- =====================================================

CREATE TABLE teachers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NOT NULL UNIQUE,

    employee_number VARCHAR(50) UNIQUE,

    speciality VARCHAR(255),
    diploma VARCHAR(255),

    hire_date DATE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- =====================================================
-- STUDENTS
-- =====================================================

CREATE TABLE students (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NOT NULL UNIQUE,

    registration_number VARCHAR(50) UNIQUE NOT NULL,

    parent_name VARCHAR(255),
    parent_phone VARCHAR(30),

    enrollment_date DATE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- =====================================================
-- CLASSROOMS
-- =====================================================

CREATE TABLE classrooms (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    school_id BIGINT UNSIGNED NOT NULL,

    name VARCHAR(100) NOT NULL,
    capacity INT DEFAULT 30,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE
);

-- =====================================================
-- FORMATIONS
-- =====================================================

CREATE TABLE formations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    school_id BIGINT UNSIGNED NOT NULL,

    title VARCHAR(255) NOT NULL,
    description TEXT,

    teacher_id BIGINT UNSIGNED NOT NULL,
    classroom_id BIGINT UNSIGNED NOT NULL,

    start_date DATE,
    end_date DATE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE,

    FOREIGN KEY (teacher_id)
        REFERENCES teachers(id),

    FOREIGN KEY (classroom_id)
        REFERENCES classrooms(id)
);

-- =====================================================
-- GROUPS
-- =====================================================

CREATE TABLE groups (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    formation_id BIGINT UNSIGNED NOT NULL,

    name VARCHAR(100) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (formation_id)
        REFERENCES formations(id)
        ON DELETE CASCADE
);

-- =====================================================
-- STUDENT GROUPS
-- =====================================================

CREATE TABLE student_groups (
    student_id BIGINT UNSIGNED NOT NULL,
    group_id BIGINT UNSIGNED NOT NULL,

    PRIMARY KEY(student_id, group_id),

    FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE CASCADE,

    FOREIGN KEY (group_id)
        REFERENCES groups(id)
        ON DELETE CASCADE
);

-- =====================================================
-- SCHOOL USERS
-- =====================================================

CREATE TABLE school_users (
    school_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,

    PRIMARY KEY(school_id, user_id),

    FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_users_role ON users(role);

CREATE INDEX idx_students_registration
ON students(registration_number);

CREATE INDEX idx_teachers_employee
ON teachers(employee_number);

CREATE INDEX idx_formations_teacher
ON formations(teacher_id);

CREATE INDEX idx_groups_formation
ON groups(formation_id);

CREATE INDEX idx_classrooms_school
ON classrooms(school_id);