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
    formation_id BIGINT UNSIGNED NOT NULL,

    registration_number VARCHAR(50) UNIQUE NOT NULL,

    parent_name VARCHAR(255) NULL,
    parent_phone VARCHAR(30) NULL,

    enrollment_date DATE,
    payment_status ENUM('paid', 'not_paid') DEFAULT 'not_paid',
    subscription_plan ENUM('1_month', '3_months', '1_year') DEFAULT NULL,
    next_payment_date DATE NULL,
    promo_code VARCHAR(50) NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_student_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_student_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_student_formation
        FOREIGN KEY (formation_id)
        REFERENCES formations(id)
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
    description TEXT NULL,

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
    price_monthly DECIMAL(10,2) DEFAULT NULL,
    price_3_months DECIMAL(10,2) DEFAULT NULL,
    price_1_year DECIMAL(10,2) DEFAULT NULL,
    type ENUM('formation', 'subscription') DEFAULT 'formation',
    subscription_period ENUM('1_month', '3_months', '1_year') DEFAULT NULL,
    status ENUM('open','closed') DEFAULT 'open',

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
    teacher_id BIGINT UNSIGNED NULL,
    classroom_id BIGINT UNSIGNED NULL,

    name VARCHAR(100) NOT NULL,
    start_date DATE NULL,
    end_date DATE NULL,
    max_students INT DEFAULT 30,
    capacity INT DEFAULT 30,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_group_formation
        FOREIGN KEY (formation_id)
        REFERENCES formations(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_group_teacher
        FOREIGN KEY (teacher_id)
        REFERENCES teachers(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_group_classroom
        FOREIGN KEY (classroom_id)
        REFERENCES classrooms(id)
        ON DELETE SET NULL
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

-- =====================================================
-- PROMO CODES
-- =====================================================

CREATE TABLE promo_codes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    formation_id BIGINT UNSIGNED NOT NULL,

    code VARCHAR(50) UNIQUE NOT NULL,
    discount_percent DECIMAL(5,2) NOT NULL CHECK (discount_percent >= 1 AND discount_percent <= 100),
    type ENUM('single_student', 'many_students') NOT NULL DEFAULT 'many_students',

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_promo_formation
        FOREIGN KEY (formation_id)
        REFERENCES formations(id)
        ON DELETE CASCADE
);- -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  
 - -   A T T E N D A N C E   S Y S T E M  
 - -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  
  
 - -   A d d   R F I D   c o l u m n s   t o   t e a c h e r s   a n d   s t u d e n t s  
 A L T E R   T A B L E   s t u d e n t s   A D D   C O L U M N   r f i d _ t a g   V A R C H A R ( 1 0 0 )   U N I Q U E   N U L L ;  
 A L T E R   T A B L E   t e a c h e r s   A D D   C O L U M N   r f i d _ t a g   V A R C H A R ( 1 0 0 )   U N I Q U E   N U L L ;  
  
 - -   C r e a t e   a t t e n d a n c e   t a b l e  
 C R E A T E   T A B L E   I F   N O T   E X I S T S   a t t e n d a n c e   (  
         i d   B I G I N T   U N S I G N E D   A U T O _ I N C R E M E N T   P R I M A R Y   K E Y ,  
          
         u s e r _ t y p e   E N U M ( ' s t u d e n t ' ,   ' t e a c h e r ' )   N O T   N U L L ,  
         u s e r _ i d   B I G I N T   U N S I G N E D   N O T   N U L L ,  
          
         - -   N u l l a b l e   f o r   t e a c h e r s   i f   t h e y   a r e   j u s t   l o g g i n g   i n t o   t h e   s c h o o l   w i t h o u t   a   s p e c i f i c   g r o u p  
         g r o u p _ i d   B I G I N T   U N S I G N E D   N U L L ,  
          
         d a t e   D A T E   N O T   N U L L ,  
         s t a t u s   E N U M ( ' p r e s e n t ' ,   ' a b s e n t ' )   D E F A U L T   ' p r e s e n t ' ,  
         s c a n _ t i m e   T I M E   N U L L ,  
         n o t e s   T E X T ,  
          
         c r e a t e d _ a t   T I M E S T A M P   D E F A U L T   C U R R E N T _ T I M E S T A M P ,  
         u p d a t e d _ a t   T I M E S T A M P   D E F A U L T   C U R R E N T _ T I M E S T A M P   O N   U P D A T E   C U R R E N T _ T I M E S T A M P ,  
          
         U N I Q U E ( u s e r _ t y p e ,   u s e r _ i d ,   g r o u p _ i d ,   d a t e ) ,  
          
         C O N S T R A I N T   f k _ a t t e n d a n c e _ g r o u p  
                 F O R E I G N   K E Y   ( g r o u p _ i d )  
                 R E F E R E N C E S   ` g r o u p s ` ( i d )  
                 O N   D E L E T E   C A S C A D E  
 ) ;  
 