-- ============================================================================
-- SQL SERVER SCRIPT FOR CAREERFIT - SWP391 PROJECT (CHUẨN HÓA THỨ TỰ CỘT)
-- Database Name: careerfit_db
-- ============================================================================

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

USE [master];
GO

IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'careerfit_db')
BEGIN
    CREATE DATABASE [careerfit_db];
    PRINT 'Database careerfit_db created successfully.';
END
GO

USE [careerfit_db];
GO

-- XÓA BẢNG THEO THỨ TỰ TỪ CON LÊN CHA (TRÁNH LỖI FOREIGN KEY)
IF OBJECT_ID('dbo.candidate_skill', 'U') IS NOT NULL DROP TABLE dbo.candidate_skill;
IF OBJECT_ID('dbo.job_skill', 'U') IS NOT NULL DROP TABLE dbo.job_skill;
IF OBJECT_ID('dbo.applications', 'U') IS NOT NULL DROP TABLE dbo.applications;
IF OBJECT_ID('dbo.saved_jobs', 'U') IS NOT NULL DROP TABLE dbo.saved_jobs;
IF OBJECT_ID('dbo.reports', 'U') IS NOT NULL DROP TABLE dbo.reports;
IF OBJECT_ID('dbo.reported_jobs', 'U') IS NOT NULL DROP TABLE dbo.reported_jobs;
IF OBJECT_ID('dbo.notifications', 'U') IS NOT NULL DROP TABLE dbo.notifications;
IF OBJECT_ID('dbo.ai_analysis_cache', 'U') IS NOT NULL DROP TABLE dbo.ai_analysis_cache;
IF OBJECT_ID('dbo.roadmap_topics', 'U') IS NOT NULL DROP TABLE dbo.roadmap_topics;
IF OBJECT_ID('dbo.roadmaps', 'U') IS NOT NULL DROP TABLE dbo.roadmaps;
IF OBJECT_ID('dbo.jobs', 'U') IS NOT NULL DROP TABLE dbo.jobs;
IF OBJECT_ID('dbo.employer_verifications', 'U') IS NOT NULL DROP TABLE dbo.employer_verifications;
IF OBJECT_ID('dbo.companies', 'U') IS NOT NULL DROP TABLE dbo.companies;
IF OBJECT_ID('dbo.candidate_profiles', 'U') IS NOT NULL DROP TABLE dbo.candidate_profiles;
IF OBJECT_ID('dbo.verification_tokens', 'U') IS NOT NULL DROP TABLE dbo.verification_tokens;
IF OBJECT_ID('dbo.skills', 'U') IS NOT NULL DROP TABLE dbo.skills;
IF OBJECT_ID('dbo.users', 'U') IS NOT NULL DROP TABLE dbo.users;
GO

-- 1. BẢNG USERS (Cột id nằm đầu tiên)
CREATE TABLE dbo.users (
    id NVARCHAR(50) PRIMARY KEY,
    email NVARCHAR(100) NOT NULL,
    username NVARCHAR(50) NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,
    role NVARCHAR(20) NOT NULL, -- 'CANDIDATE', 'EMPLOYER', 'ADMIN'
    status NVARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    auth_provider NVARCHAR(50) NOT NULL DEFAULT 'GOOGLE',
    provider_id NVARCHAR(100),
    avatar_url NVARCHAR(MAX),
    has_custom_password BIT NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT UQ_users_email_provider UNIQUE (email, auth_provider)
);
GO

-- 2. BẢNG HỒ SƠ ỨNG VIÊN
CREATE TABLE dbo.candidate_profiles (
    id NVARCHAR(50) PRIMARY KEY,
    user_id NVARCHAR(50) FOREIGN KEY REFERENCES dbo.users(id) ON DELETE CASCADE,
    full_name NVARCHAR(100) NOT NULL,
    phone NVARCHAR(20),
    location NVARCHAR(100),
    university NVARCHAR(150),
    major NVARCHAR(100),
    graduation_year NVARCHAR(10),
    desired_role NVARCHAR(100),
    expected_salary NVARCHAR(50),
    cv_file_name NVARCHAR(255),
    extracted_cv_text NVARCHAR(MAX)
);
GO

-- 3. BẢNG DOANH NGHIỆP
CREATE TABLE dbo.companies (
    id NVARCHAR(50) PRIMARY KEY,
    owner_user_id NVARCHAR(50) FOREIGN KEY REFERENCES dbo.users(id) ON DELETE CASCADE,
    company_name NVARCHAR(150) NOT NULL,
    recruiter_name NVARCHAR(100) NOT NULL,
    email NVARCHAR(100) NOT NULL,
    phone NVARCHAR(20),
    website NVARCHAR(150),
    industry NVARCHAR(100),
    size NVARCHAR(50),
    location NVARCHAR(100),
    logo NVARCHAR(50) DEFAULT N'🏢',
    verification_status NVARCHAR(20) DEFAULT 'Pending', -- 'Pending', 'Verified', 'Rejected'
    business_license_file NVARCHAR(255),
    rejection_reason NVARCHAR(MAX)
);
GO

-- 4. BẢNG KỸ NĂNG (SKILLS)
CREATE TABLE dbo.skills (
    id NVARCHAR(50) PRIMARY KEY,
    name NVARCHAR(50) NOT NULL UNIQUE,
    category NVARCHAR(50) NOT NULL,
    is_active BIT DEFAULT 1
);
GO

-- 5. BẢNG TRUNG GIAN KỸ NĂNG ỨNG VIÊN (Many-to-Many)
CREATE TABLE dbo.candidate_skill (
    candidate_id NVARCHAR(50) FOREIGN KEY REFERENCES dbo.candidate_profiles(id) ON DELETE CASCADE,
    skill_id NVARCHAR(50) FOREIGN KEY REFERENCES dbo.skills(id) ON DELETE CASCADE,
    PRIMARY KEY (candidate_id, skill_id)
);
GO

-- 6. BẢNG TIN TUYỂN DỤNG (JOBS)
CREATE TABLE dbo.jobs (
    id NVARCHAR(50) PRIMARY KEY,
    employer_id NVARCHAR(50),
    title NVARCHAR(150) NOT NULL,
    category NVARCHAR(50) NOT NULL,
    job_type NVARCHAR(50) NOT NULL,
    location NVARCHAR(100) NOT NULL,
    salary NVARCHAR(50) NOT NULL,
    posted_date DATETIME DEFAULT GETDATE(),
    deadline NVARCHAR(50),
    description NVARCHAR(MAX),
    responsibilities NVARCHAR(MAX),
    requirements NVARCHAR(MAX),
    benefits NVARCHAR(MAX),
    is_visible BIT NOT NULL DEFAULT 1,
    verification_status NVARCHAR(20) DEFAULT 'Verified'
);
GO

-- 7. BẢNG TRUNG GIAN KỸ NĂNG CỦA JOB (Many-to-Many)
CREATE TABLE dbo.job_skill (
    job_id NVARCHAR(50) FOREIGN KEY REFERENCES dbo.jobs(id) ON DELETE CASCADE,
    skill_id NVARCHAR(50) FOREIGN KEY REFERENCES dbo.skills(id) ON DELETE CASCADE,
    PRIMARY KEY (job_id, skill_id)
);
GO

-- 8. BẢNG ĐƠN ỨNG TUYỂN
CREATE TABLE dbo.applications (
    id NVARCHAR(50) PRIMARY KEY,
    job_id NVARCHAR(50) FOREIGN KEY REFERENCES dbo.jobs(id),
    candidate_id NVARCHAR(50) FOREIGN KEY REFERENCES dbo.candidate_profiles(id),
    applied_date NVARCHAR(20),
    last_update NVARCHAR(20),
    status NVARCHAR(20) DEFAULT N'Đã nộp',
    interview_date NVARCHAR(50),
    interview_time NVARCHAR(50),
    meeting_link NVARCHAR(255),
    interview_note NVARCHAR(MAX)
);
GO

-- 9. BẢNG LỘ TRÌNH HỌC TẬP (ROADMAPS)
CREATE TABLE dbo.roadmaps (
    id NVARCHAR(50) PRIMARY KEY,
    skill_name NVARCHAR(50) NOT NULL,
    target_role NVARCHAR(100) NOT NULL,
    description NVARCHAR(MAX)
);
GO

-- 10. BẢNG BƯỚC HỌC TẬP (ROADMAP TOPICS)
CREATE TABLE dbo.roadmap_topics (
    id NVARCHAR(50) PRIMARY KEY,
    roadmap_id NVARCHAR(50) FOREIGN KEY REFERENCES dbo.roadmaps(id) ON DELETE CASCADE,
    title NVARCHAR(255) NOT NULL,
    completed BIT DEFAULT 0,
    estimated_time NVARCHAR(50),
    resource_name NVARCHAR(100),
    url NVARCHAR(255)
);
GO

-- 11. BẢNG BÁO CÁO VI PHẠM (REPORTS)
CREATE TABLE dbo.reports (
    id NVARCHAR(50) PRIMARY KEY,
    job_id NVARCHAR(50) FOREIGN KEY REFERENCES dbo.jobs(id),
    reporter_id NVARCHAR(50) FOREIGN KEY REFERENCES dbo.users(id),
    reason NVARCHAR(255) NOT NULL,
    status NVARCHAR(20) DEFAULT 'PENDING',
    admin_note NVARCHAR(MAX),
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- 12. BẢNG THÔNG BÁO (NOTIFICATIONS)
CREATE TABLE dbo.notifications (
    id NVARCHAR(50) PRIMARY KEY,
    user_id NVARCHAR(50) FOREIGN KEY REFERENCES dbo.users(id) ON DELETE CASCADE,
    application_id NVARCHAR(50),
    content NVARCHAR(MAX) NOT NULL,
    is_read BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- 13. BẢNG CACHE AI (AI ANALYSIS CACHE)
CREATE TABLE dbo.ai_analysis_cache (
    id NVARCHAR(50) PRIMARY KEY,
    candidate_id NVARCHAR(50) FOREIGN KEY REFERENCES dbo.candidate_profiles(id),
    job_id NVARCHAR(50) FOREIGN KEY REFERENCES dbo.jobs(id),
    match_percentage INT,
    matched_skills_json NVARCHAR(MAX),
    missing_skills_json NVARCHAR(MAX),
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- ============================================================================
-- DỮ LIỆU MẪU (SEED DATA)
-- ============================================================================

-- Seed Users (Hỗ trợ đăng nhập Google & Microsoft OAuth)
INSERT INTO dbo.users (id, email, username, password_hash, role, status, auth_provider, has_custom_password) VALUES
('user-admin-1', 'trongtien6571@gmail.com', 'trongtien_admin', 'OAUTH_USER', 'ADMIN', 'ACTIVE', 'GOOGLE', 0),
('user-emp-1', 'employer@gmail.com', 'employer', 'OAUTH_USER', 'EMPLOYER', 'ACTIVE', 'GOOGLE', 0),
('user-emp-2', 'employer.pending@gmail.com', 'employer_pending', 'OAUTH_USER', 'EMPLOYER', 'PENDING', 'GOOGLE', 0),
('user-cand-1', 'candidate@gmail.com', 'candidate', 'OAUTH_USER', 'CANDIDATE', 'ACTIVE', 'GOOGLE', 0),
('user-cand-2', 'tien@gmail.com', 'tien', 'OAUTH_USER', 'CANDIDATE', 'ACTIVE', 'GOOGLE', 0);

-- Seed Candidate Profile
INSERT INTO dbo.candidate_profiles (id, user_id, full_name, phone, location, university, major, graduation_year, desired_role, expected_salary, cv_file_name, extracted_cv_text) VALUES
('cand-1', 'user-cand-1', N'Nguyễn Văn A', '0987 654 321', N'Thành phố Hồ Chí Minh', N'Đại học FPT Đà Nẵng', N'Khoa học Máy tính', '2025', 'Java Backend Developer', '8.000.000 - 12.000.000 VNĐ', 'Nguyen_Van_A_CV_2026.pdf', N'Kỹ năng: Java, Spring Boot, SQL Server, Git, OOP. Kinh nghiệm làm đồ án môn học Web với Spring Boot.');

-- Seed Companies
INSERT INTO dbo.companies (id, owner_user_id, company_name, recruiter_name, email, phone, website, industry, size, location, logo, verification_status, business_license_file) VALUES
('company-1', 'user-emp-1', 'FPT Software', N'Trần Thị B (HR)', 'employer@gmail.com', '0901234567', 'https://fpt-software.com', N'Phần mềm & IT Outsourcing', N'1000+ nhân viên', N'Quận 9, TP.HCM', N'🏢', 'Verified', 'GPKD_FPT_Software.pdf'),
('company-2', 'user-emp-2', 'Fintech StartUp Asia (Pending)', N'Hoàng Đức D (HR)', 'employer.pending@gmail.com', '0909888999', 'https://fintechasia.io', N'Công nghệ Tài chính', N'50-100 nhân viên', N'Quận 1, TP.HCM', N'💼', 'Pending', 'GPKD_FintechAsia.pdf');

-- Seed Skills
INSERT INTO dbo.skills (id, name, category, is_active) VALUES
('sk-1', 'Java', 'Backend', 1),
('sk-2', 'Spring Boot', 'Backend', 1),
('sk-3', 'SQL', 'Database', 1),
('sk-4', 'Git', 'Tools', 1),
('sk-5', 'OOP', 'Fundamentals', 1),
('sk-6', 'JavaScript', 'Frontend', 1),
('sk-7', 'React', 'Frontend', 1),
('sk-8', 'TypeScript', 'Frontend', 1),
('sk-9', 'HTML/CSS', 'Frontend', 1),
('sk-10', 'Docker', 'DevOps', 1);

-- Seed Candidate Skills
INSERT INTO dbo.candidate_skill (candidate_id, skill_id) VALUES
('cand-1', 'sk-1'),
('cand-1', 'sk-2'),
('cand-1', 'sk-3'),
('cand-1', 'sk-4'),
('cand-1', 'sk-5');

-- Seed Jobs
INSERT INTO dbo.jobs (id, employer_id, title, category, job_type, location, salary, posted_date, deadline, description, responsibilities, requirements, benefits, is_visible, verification_status) VALUES
('job-1', 'user-emp-1', 'Java Backend Intern / Fresher', 'Backend Developer', 'Internship', N'Quận 9, TP.HCM (On-site)', '7.000.000 - 10.000.000 VNĐ', GETDATE(), '30/04/2026', N'Tham gia phát triển hệ thống microservices Spring Boot.', N'Lập trình API, viết unit test.', N'Nắm vững Java Core, OOP, SQL.', N'Phụ cấp ăn trưa, cơ hội lên chính thức.', 1, 'Verified'),
('job-2', 'user-emp-1', 'Frontend React Developer (Fresher)', 'Frontend Developer', 'Full-time', N'Quận 7, TP.HCM', '9.000.000 - 13.000.000 VNĐ', GETDATE(), '05/05/2026', N'Phát triển giao diện web với ReactJS.', N'Cắt ghép giao diện theo Figma, gọi REST API.', N'Thành thạo JavaScript, React, HTML/CSS.', N'Lương tháng 13, bảo hiểm đầy đủ.', 1, 'Verified');

-- Seed Job Skills
INSERT INTO dbo.job_skill (job_id, skill_id) VALUES
('job-1', 'sk-1'),
('job-1', 'sk-2'),
('job-1', 'sk-3'),
('job-2', 'sk-6'),
('job-2', 'sk-7'),
('job-2', 'sk-9');

-- Seed Roadmaps
INSERT INTO dbo.roadmaps (id, skill_name, target_role, description) VALUES
('rd-1', 'Spring Boot', 'Java Backend Developer', N'Lộ trình học Spring Boot chuẩn hóa giúp sinh viên hoàn thiện kỹ năng Backend.');

INSERT INTO dbo.roadmap_topics (id, roadmap_id, title, completed, estimated_time, resource_name, url) VALUES
('tp-1', 'rd-1', N'1. Java Core & Collections Framework', 1, N'5 giờ', 'Baeldung - Java Core', 'https://www.baeldung.com/'),
('tp-2', 'rd-1', N'2. OOP & Design Patterns', 1, N'6 giờ', 'Refactoring Guru', 'https://refactoring.guru/'),
('tp-3', 'rd-1', N'3. Spring Boot REST API & JPA', 0, N'8 giờ', 'Spring Official Guide', 'https://spring.io/guides');

PRINT 'CareerFit Database created and seeded successfully!';
GO