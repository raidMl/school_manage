-- =====================================================
-- DATABASE
-- =====================================================

CREATE DATABASE IF NOT EXISTS school_system
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE school_system;

-- =====================================================
-- SCHOOLS
-- =====================================================

CREATE TABLE schools (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    logo VARCHAR(255) NULL,

    admin_id BIGINT UNSIGNED NULL,
    contact_info_id BIGINT UNSIGNED NULL,

    website VARCHAR(255) NULL,
    social_links JSON NULL,

    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- USERS
-- =====================================================

CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,

    email VARCHAR(255) UNIQUE,
    phone VARCHAR(30),

    password VARCHAR(255) NOT NULL,

    role ENUM('admin','super_admin','teacher','student') NOT NULL DEFAULT 'admin',

    gender ENUM('MALE','FEMALE') NULL,
    birth_date DATE NULL,
    photo VARCHAR(255) NULL,

    website VARCHAR(255) NULL,
    social_links JSON NULL,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- SCHOOL-USER PIVOT (links users to schools)
-- =====================================================

CREATE TABLE school_users (
    school_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (school_id, user_id),

    CONSTRAINT fk_su_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_su_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- =====================================================
-- CONTACT INFORMATION
-- =====================================================

CREATE TABLE contact_infos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NULL,
    school_id BIGINT UNSIGNED NULL,

    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),

    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(30),

    fb VARCHAR(255) NULL,
    whatsapp VARCHAR(255) NULL,
    linkedin VARCHAR(255) NULL,
    youtube VARCHAR(255) NULL,
    instagram VARCHAR(255) NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_contact_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_contact_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE
);

-- =====================================================
-- TEACHERS
-- =====================================================

CREATE TABLE teachers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NOT NULL UNIQUE,
    school_id BIGINT UNSIGNED NULL,

    employee_number VARCHAR(50) UNIQUE NOT NULL,
    specialization VARCHAR(255),
    speciality VARCHAR(255),
    diploma VARCHAR(255),

    hire_date DATE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_teacher_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_teacher_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE
);

-- =====================================================
-- STUDENTS
-- =====================================================

CREATE TABLE students (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NOT NULL UNIQUE,
    school_id BIGINT UNSIGNED NULL,

    registration_number VARCHAR(50) UNIQUE NOT NULL,

    parent_name VARCHAR(255) NULL,
    parent_phone VARCHAR(30) NULL,

    enrollment_date DATE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_student_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_student_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
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

    CONSTRAINT fk_classroom_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE
);

-- =====================================================
-- FORMATIONS / COURSES
-- =====================================================

CREATE TABLE formations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    school_id BIGINT UNSIGNED NOT NULL,
    teacher_id BIGINT UNSIGNED NULL,
    classroom_id BIGINT UNSIGNED NULL,

    title VARCHAR(255) NOT NULL,
    description TEXT,

    image VARCHAR(255) NULL,

    duration_hours INT,
    price DECIMAL(10,2) DEFAULT 0,

    start_date DATE,
    end_date DATE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_formation_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_formation_teacher
        FOREIGN KEY (teacher_id)
        REFERENCES teachers(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_formation_classroom
        FOREIGN KEY (classroom_id)
        REFERENCES classrooms(id)
        ON DELETE SET NULL
);

-- =====================================================
-- GROUPS
-- =====================================================

CREATE TABLE `groups` (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    formation_id BIGINT UNSIGNED NOT NULL,

    name VARCHAR(100) NOT NULL,
    capacity INT DEFAULT 30,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_group_formation
        FOREIGN KEY (formation_id)
        REFERENCES formations(id)
        ON DELETE CASCADE
);

-- =====================================================
-- STUDENT GROUPS
-- =====================================================

CREATE TABLE student_groups (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    student_id BIGINT UNSIGNED NOT NULL,
    group_id BIGINT UNSIGNED NOT NULL,

    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(student_id, group_id),

    CONSTRAINT fk_student_group_student
        FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_student_group_group
        FOREIGN KEY (group_id)
        REFERENCES `groups`(id)
        ON DELETE CASCADE
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_users_role
ON users(role);

CREATE INDEX idx_students_registration
ON students(registration_number);

CREATE INDEX idx_teachers_employee
ON teachers(employee_number);

CREATE INDEX idx_formations_teacher
ON formations(teacher_id);

CREATE INDEX idx_groups_formation
ON `groups`(formation_id);

CREATE INDEX idx_classrooms_school
ON classrooms(school_id);