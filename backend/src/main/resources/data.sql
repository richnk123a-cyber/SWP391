-- ============================================================================
-- CAREERFIT SEED DATA (AN TOÀN - TỰ ĐỘNG BỎ QUA NẾU ĐÃ TỒN TẠI BẢN GHI)
-- ============================================================================

-- 1. Seed Users (Hỗ trợ đăng nhập Google & Microsoft OAuth)
IF NOT EXISTS (SELECT 1 FROM dbo.users WHERE id = 'user-admin-1')
    INSERT INTO dbo.users (id, email, username, password_hash, role, status, auth_provider, has_custom_password)
    VALUES ('user-admin-1', 'trongtien6571@gmail.com', 'trongtien_admin', 'OAUTH_USER', 'ADMIN', 'ACTIVE', 'GOOGLE', 0);

IF NOT EXISTS (SELECT 1 FROM dbo.users WHERE id = 'user-emp-1')
    INSERT INTO dbo.users (id, email, username, password_hash, role, status, auth_provider, has_custom_password)
    VALUES ('user-emp-1', 'employer@gmail.com', 'employer', 'OAUTH_USER', 'EMPLOYER', 'ACTIVE', 'GOOGLE', 0);

IF NOT EXISTS (SELECT 1 FROM dbo.users WHERE id = 'user-emp-2')
    INSERT INTO dbo.users (id, email, username, password_hash, role, status, auth_provider, has_custom_password)
    VALUES ('user-emp-2', 'employer.pending@gmail.com', 'employer_pending', 'OAUTH_USER', 'EMPLOYER', 'PENDING', 'GOOGLE', 0);

IF NOT EXISTS (SELECT 1 FROM dbo.users WHERE id = 'user-cand-1')
    INSERT INTO dbo.users (id, email, username, password_hash, role, status, auth_provider, has_custom_password)
    VALUES ('user-cand-1', 'candidate@gmail.com', 'candidate', 'OAUTH_USER', 'CANDIDATE', 'ACTIVE', 'GOOGLE', 0);

IF NOT EXISTS (SELECT 1 FROM dbo.users WHERE id = 'user-cand-2')
    INSERT INTO dbo.users (id, email, username, password_hash, role, status, auth_provider, has_custom_password)
    VALUES ('user-cand-2', 'tien@gmail.com', 'tien', 'OAUTH_USER', 'CANDIDATE', 'ACTIVE', 'GOOGLE', 0);

-- 2. Seed Candidate Profile
IF NOT EXISTS (SELECT 1 FROM dbo.candidate_profiles WHERE id = 'cand-1')
    INSERT INTO dbo.candidate_profiles (id, user_id, full_name, phone, location, university, major, graduation_year, desired_role, expected_salary, cv_file_name, extracted_cv_text)
    VALUES ('cand-1', 'user-cand-1', N'Nguyễn Văn A', '0987 654 321', N'Thành phố Hồ Chí Minh', N'Đại học FPT Đà Nẵng', N'Khoa học Máy tính', '2025', 'Java Backend Developer', '8.000.000 - 12.000.000 VNĐ', 'Nguyen_Van_A_CV_2026.pdf', N'Kỹ năng: Java, Spring Boot, SQL Server, Git, OOP. Kinh nghiệm làm đồ án môn học Web với Spring Boot.');

-- 3. Seed Companies
IF NOT EXISTS (SELECT 1 FROM dbo.companies WHERE id = 'company-1')
    INSERT INTO dbo.companies (id, owner_user_id, company_name, recruiter_name, email, phone, website, industry, size, location, logo, verification_status, business_license_file)
    VALUES ('company-1', 'user-emp-1', 'FPT Software', N'Trần Thị B (HR)', 'employer@gmail.com', '0901234567', 'https://fpt-software.com', N'Phần mềm & IT Outsourcing', N'1000+ nhân viên', N'Quận 9, TP.HCM', N'🏢', 'Verified', 'GPKD_FPT_Software.pdf');

IF NOT EXISTS (SELECT 1 FROM dbo.companies WHERE id = 'company-2')
    INSERT INTO dbo.companies (id, owner_user_id, company_name, recruiter_name, email, phone, website, industry, size, location, logo, verification_status, business_license_file)
    VALUES ('company-2', 'user-emp-2', 'Fintech StartUp Asia (Pending)', N'Hoàng Đức D (HR)', 'employer.pending@gmail.com', '0909888999', 'https://fintechasia.io', N'Công nghệ Tài chính', N'50-100 nhân viên', N'Quận 1, TP.HCM', N'💼', 'Pending', 'GPKD_FintechAsia.pdf');

IF NOT EXISTS (SELECT 1 FROM dbo.companies WHERE owner_user_id = 'user-cand-55122454')
    INSERT INTO dbo.companies (id, owner_user_id, company_name, recruiter_name, email, phone, website, industry, size, location, logo, verification_status)
    VALUES ('comp-55122454', 'user-cand-55122454', N'VNK Technology Solutions', N'Võ Nguyên Khánh (HR)', 'vonguyenkhanh2911@gmail.com', '0976 543 345', 'https://vnk-tech.com', N'Phát triển Phần mềm & Giải pháp IT', N'50-150 nhân viên', N'Quận 1, TP. Hồ Chí Minh', N'🏢', 'Verified');

-- 4. Seed Skills
IF NOT EXISTS (SELECT 1 FROM dbo.skills WHERE id = 'sk-1')
    INSERT INTO dbo.skills (id, name, category, is_active) VALUES ('sk-1', 'Java', 'Backend', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.skills WHERE id = 'sk-2')
    INSERT INTO dbo.skills (id, name, category, is_active) VALUES ('sk-2', 'Spring Boot', 'Backend', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.skills WHERE id = 'sk-3')
    INSERT INTO dbo.skills (id, name, category, is_active) VALUES ('sk-3', 'SQL', 'Database', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.skills WHERE id = 'sk-4')
    INSERT INTO dbo.skills (id, name, category, is_active) VALUES ('sk-4', 'Git', 'Tools', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.skills WHERE id = 'sk-5')
    INSERT INTO dbo.skills (id, name, category, is_active) VALUES ('sk-5', 'OOP', 'Fundamentals', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.skills WHERE id = 'sk-6')
    INSERT INTO dbo.skills (id, name, category, is_active) VALUES ('sk-6', 'JavaScript', 'Frontend', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.skills WHERE id = 'sk-7')
    INSERT INTO dbo.skills (id, name, category, is_active) VALUES ('sk-7', 'React', 'Frontend', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.skills WHERE id = 'sk-8')
    INSERT INTO dbo.skills (id, name, category, is_active) VALUES ('sk-8', 'TypeScript', 'Frontend', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.skills WHERE id = 'sk-9')
    INSERT INTO dbo.skills (id, name, category, is_active) VALUES ('sk-9', 'HTML/CSS', 'Frontend', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.skills WHERE id = 'sk-10')
    INSERT INTO dbo.skills (id, name, category, is_active) VALUES ('sk-10', 'Docker', 'DevOps', 1);

-- 5. Seed Candidate Skills
IF NOT EXISTS (SELECT 1 FROM dbo.candidate_skill WHERE candidate_id = 'cand-1' AND skill_id = 'sk-1')
    INSERT INTO dbo.candidate_skill (candidate_id, skill_id) VALUES ('cand-1', 'sk-1');
IF NOT EXISTS (SELECT 1 FROM dbo.candidate_skill WHERE candidate_id = 'cand-1' AND skill_id = 'sk-2')
    INSERT INTO dbo.candidate_skill (candidate_id, skill_id) VALUES ('cand-1', 'sk-2');
IF NOT EXISTS (SELECT 1 FROM dbo.candidate_skill WHERE candidate_id = 'cand-1' AND skill_id = 'sk-3')
    INSERT INTO dbo.candidate_skill (candidate_id, skill_id) VALUES ('cand-1', 'sk-3');
IF NOT EXISTS (SELECT 1 FROM dbo.candidate_skill WHERE candidate_id = 'cand-1' AND skill_id = 'sk-4')
    INSERT INTO dbo.candidate_skill (candidate_id, skill_id) VALUES ('cand-1', 'sk-4');
IF NOT EXISTS (SELECT 1 FROM dbo.candidate_skill WHERE candidate_id = 'cand-1' AND skill_id = 'sk-5')
    INSERT INTO dbo.candidate_skill (candidate_id, skill_id) VALUES ('cand-1', 'sk-5');

-- 6. Seed Jobs
IF NOT EXISTS (SELECT 1 FROM dbo.jobs WHERE id = 'job-1')
    INSERT INTO dbo.jobs (id, employer_id, title, category, job_type, location, salary, posted_date, deadline, description, responsibilities, requirements, benefits, is_visible, verification_status)
    VALUES ('job-1', 'user-emp-1', 'Java Backend Intern / Fresher', 'Backend Developer', 'Internship', N'Quận 9, TP.HCM (On-site)', '7.000.000 - 10.000.000 VNĐ', GETDATE(), '30/04/2026', N'Tham gia phát triển hệ thống microservices Spring Boot.', N'Lập trình API, viết unit test.', N'Nắm vững Java Core, OOP, SQL.', N'Phụ cấp ăn trưa, cơ hội lên chính thức.', 1, 'Verified');

IF NOT EXISTS (SELECT 1 FROM dbo.jobs WHERE id = 'job-2')
    INSERT INTO dbo.jobs (id, employer_id, title, category, job_type, location, salary, posted_date, deadline, description, responsibilities, requirements, benefits, is_visible, verification_status)
    VALUES ('job-2', 'user-emp-1', 'Frontend React Developer (Fresher)', 'Frontend Developer', 'Full-time', N'Quận 7, TP.HCM', '9.000.000 - 13.000.000 VNĐ', GETDATE(), '05/05/2026', N'Phát triển giao diện web với ReactJS.', N'Cắt ghép giao diện theo Figma, gọi REST API.', N'Thành thạo JavaScript, React, HTML/CSS.', N'Lương tháng 13, bảo hiểm đầy đủ.', 1, 'Verified');

IF NOT EXISTS (SELECT 1 FROM dbo.jobs WHERE id = 'job-vnk-1')
    INSERT INTO dbo.jobs (id, employer_id, title, category, job_type, location, salary, posted_date, deadline, description, responsibilities, requirements, benefits, is_visible, verification_status)
    VALUES ('job-vnk-1', 'user-cand-55122454', N'Fullstack Web Developer (React & Node.js)', N'Frontend Developer', N'Full-time', N'Quận 1, TP.HCM', '10.000.000 - 15.000.000 VNĐ', GETDATE(), '30/11/2026', N'Phát triển các ứng dụng Web doanh nghiệp cho khách hàng VNK Technology Solutions.', N'Xây dựng UI responsive bằng ReactJS, tích hợp REST API, tối ưu hiệu năng trang web.', N'Có nền tảng vững vàng về React, JavaScript/TypeScript, HTML5/CSS3, Git.', N'Lương tháng 13, BHXH đầy đủ, thưởng dự án, lộ trình thăng tiến rõ ràng.', 1, 'Verified');

IF NOT EXISTS (SELECT 1 FROM dbo.jobs WHERE id = 'job-vnk-2')
    INSERT INTO dbo.jobs (id, employer_id, title, category, job_type, location, salary, posted_date, deadline, description, responsibilities, requirements, benefits, is_visible, verification_status)
    VALUES ('job-vnk-2', 'user-cand-55122454', N'Java Spring Boot Backend Engineer', N'Backend Developer', N'Full-time', N'Quận 1, TP.HCM', '11.000.000 - 16.000.000 VNĐ', GETDATE(), '15/12/2026', N'Tham gia thiết kế và xây dựng các dịch vụ backend hiệu năng cao trên nền Spring Boot.', N'Thiết kế CSDL SQL Server/PostgreSQL, viết API bảo mật, unit test, tối ưu truy vấn.', N'Nắm vững Java Core, Spring Boot, JPA/Hibernate, SQL, RESTful API design.', N'Phụ cấp ăn trưa, bảo hiểm sức khỏe cao cấp, máy tính làm việc cấu hình mạnh.', 1, 'Verified');

-- Seed Applications
IF NOT EXISTS (SELECT 1 FROM dbo.applications WHERE id = 'app-vnk-1')
    INSERT INTO dbo.applications (id, job_id, candidate_id, status, applied_date, last_update, interview_time, meeting_link, interview_note)
    VALUES ('app-vnk-1', 'job-vnk-2', 'user-cand-1', N'Phỏng vấn', GETDATE(), GETDATE(), N'14:30 - 15:30, Thứ 5 15/10/2026', 'https://meet.google.com/vnk-hr-interview', N'Phỏng vấn kỹ thuật trực tuyến: Java Core, Spring Boot và OOP kiến trúc dự án.');

IF NOT EXISTS (SELECT 1 FROM dbo.applications WHERE id = 'app-vnk-2')
    INSERT INTO dbo.applications (id, job_id, candidate_id, status, applied_date, last_update)
    VALUES ('app-vnk-2', 'job-vnk-1', 'user-cand-2', N'Đã xem', GETDATE(), GETDATE());

IF NOT EXISTS (SELECT 1 FROM dbo.applications WHERE id = 'app-vnk-3')
    INSERT INTO dbo.applications (id, job_id, candidate_id, status, applied_date, last_update)
    VALUES ('app-vnk-3', 'job-vnk-1', 'user-cand-35569be3', N'Đã nộp', GETDATE(), GETDATE());

IF NOT EXISTS (SELECT 1 FROM dbo.applications WHERE id = 'app-vnk-4')
    INSERT INTO dbo.applications (id, job_id, candidate_id, status, applied_date, last_update)
    VALUES ('app-vnk-4', 'job-vnk-2', 'user-cand-35da1bdf', N'Offer', GETDATE(), GETDATE());

-- Backfill dữ liệu lương chuẩn hóa cho các bản ghi cũ theo định dạng hiện tại:
UPDATE dbo.jobs
SET salary_min = TRY_CONVERT(BIGINT,
        REPLACE(LTRIM(RTRIM(LEFT(salary, CHARINDEX('-', salary) - 1))), '.', '')),
    salary_max = TRY_CONVERT(BIGINT,
        REPLACE(LTRIM(RTRIM(
            REPLACE(REPLACE(
                SUBSTRING(salary, CHARINDEX('-', salary) + 1, LEN(salary)),
                N'VNĐ', ''), 'USD', '')
        )), '.', '')),
    salary_currency = CASE
        WHEN UPPER(salary) LIKE '%USD%' THEN 'USD'
        ELSE N'VNĐ'
    END
WHERE (salary_min IS NULL OR salary_max IS NULL OR salary_currency IS NULL)
  AND CHARINDEX('-', salary) > 0;

-- 7. Seed Job Skills
IF NOT EXISTS (SELECT 1 FROM dbo.job_skill WHERE job_id = 'job-1' AND skill_id = 'sk-1')
    INSERT INTO dbo.job_skill (job_id, skill_id) VALUES ('job-1', 'sk-1');
IF NOT EXISTS (SELECT 1 FROM dbo.job_skill WHERE job_id = 'job-1' AND skill_id = 'sk-2')
    INSERT INTO dbo.job_skill (job_id, skill_id) VALUES ('job-1', 'sk-2');
IF NOT EXISTS (SELECT 1 FROM dbo.job_skill WHERE job_id = 'job-1' AND skill_id = 'sk-3')
    INSERT INTO dbo.job_skill (job_id, skill_id) VALUES ('job-1', 'sk-3');
IF NOT EXISTS (SELECT 1 FROM dbo.job_skill WHERE job_id = 'job-2' AND skill_id = 'sk-6')
    INSERT INTO dbo.job_skill (job_id, skill_id) VALUES ('job-2', 'sk-6');
IF NOT EXISTS (SELECT 1 FROM dbo.job_skill WHERE job_id = 'job-2' AND skill_id = 'sk-7')
    INSERT INTO dbo.job_skill (job_id, skill_id) VALUES ('job-2', 'sk-7');
IF NOT EXISTS (SELECT 1 FROM dbo.job_skill WHERE job_id = 'job-2' AND skill_id = 'sk-9')
    INSERT INTO dbo.job_skill (job_id, skill_id) VALUES ('job-2', 'sk-9');

-- 8. Seed Roadmaps
IF NOT EXISTS (SELECT 1 FROM dbo.roadmaps WHERE id = 'rd-1')
    INSERT INTO dbo.roadmaps (id, skill_name, target_role, description)
    VALUES ('rd-1', 'Spring Boot', 'Java Backend Developer', N'Lộ trình học Spring Boot chuẩn hóa giúp sinh viên hoàn thiện kỹ năng Backend.');

IF NOT EXISTS (SELECT 1 FROM dbo.roadmap_topics WHERE id = 'tp-1')
    INSERT INTO dbo.roadmap_topics (id, roadmap_id, title, completed, estimated_time, resource_name, url)
    VALUES ('tp-1', 'rd-1', N'1. Java Core & Collections Framework', 1, N'5 giờ', 'Baeldung - Java Core', 'https://www.baeldung.com/');

IF NOT EXISTS (SELECT 1 FROM dbo.roadmap_topics WHERE id = 'tp-2')
    INSERT INTO dbo.roadmap_topics (id, roadmap_id, title, completed, estimated_time, resource_name, url)
    VALUES ('tp-2', 'rd-1', N'2. OOP & Design Patterns', 1, N'6 giờ', 'Refactoring Guru', 'https://refactoring.guru/');

IF NOT EXISTS (SELECT 1 FROM dbo.roadmap_topics WHERE id = 'tp-3')
    INSERT INTO dbo.roadmap_topics (id, roadmap_id, title, completed, estimated_time, resource_name, url)
    VALUES ('tp-3', 'rd-1', N'3. Spring Boot REST API & JPA', 0, N'8 giờ', 'Spring Official Guide', 'https://spring.io/guides');

-- 9. Seed / Create Table AI Learned Knowledge
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'ai_learned_knowledge')
BEGIN
    CREATE TABLE dbo.ai_learned_knowledge (
        id VARCHAR(64) PRIMARY KEY,
        query_hash VARCHAR(64) NOT NULL UNIQUE,
        original_query NVARCHAR(1000),
        normalized_query NVARCHAR(1000),
        topic NVARCHAR(100),
        title NVARCHAR(255),
        summary_content NVARCHAR(MAX) NOT NULL,
        source_url NVARCHAR(1000),
        confidence_score FLOAT,
        access_count INT DEFAULT 1,
        learned_at DATETIME2,
        expires_at DATETIME2,
        last_accessed_at DATETIME2
    );
    CREATE INDEX idx_learned_query_hash ON dbo.ai_learned_knowledge(query_hash);
    CREATE INDEX idx_learned_topic ON dbo.ai_learned_knowledge(topic);
    CREATE INDEX idx_learned_expires_at ON dbo.ai_learned_knowledge(expires_at);
END;