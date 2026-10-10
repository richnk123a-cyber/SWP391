-- ============================================================================
-- CAREERFIT SEED DATA (AN TOÀN - TỰ ĐỘNG BỎ QUA NẾU ĐÃ TỒN TẠI BẢN GHI)
-- ============================================================================

-- 1. Seed Users
IF NOT EXISTS (SELECT 1 FROM dbo.users WHERE id = 'user-admin-1')
    INSERT INTO dbo.users (id, email, username, password_hash, role, status, has_custom_password)
    VALUES ('user-admin-1', 'trongtien6571@gmail.com', 'trongtien_admin', '123456', 'ADMIN', 'ACTIVE', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.users WHERE id = 'user-emp-1')
    INSERT INTO dbo.users (id, email, username, password_hash, role, status, has_custom_password)
    VALUES ('user-emp-1', 'employer@gmail.com', 'employer', '123456', 'EMPLOYER', 'ACTIVE', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.users WHERE id = 'user-emp-2')
    INSERT INTO dbo.users (id, email, username, password_hash, role, status, has_custom_password)
    VALUES ('user-emp-2', 'employer.pending@gmail.com', 'employer_pending', '123456', 'EMPLOYER', 'ACTIVE', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.users WHERE id = 'user-cand-1')
    INSERT INTO dbo.users (id, email, username, password_hash, role, status, has_custom_password)
    VALUES ('user-cand-1', 'candidate@gmail.com', 'candidate', '123456', 'CANDIDATE', 'ACTIVE', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.users WHERE id = 'user-cand-2')
    INSERT INTO dbo.users (id, email, username, password_hash, role, status, has_custom_password)
    VALUES ('user-cand-2', 'tien@gmail.com', 'tien', '123456', 'CANDIDATE', 'ACTIVE', 1);

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
    VALUES ('comp-55122454', 'user-cand-55122454', 'FPT Software', N'Võ Nguyên Khánh (HR)', 'vonguyenkhanh2911@gmail.com', '028 3730 8888', 'https://fpt-software.com', N'Phần mềm & IT Outsourcing', N'1000+ nhân viên', N'Quận 9, TP.HCM', N'🏢', 'Verified');

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