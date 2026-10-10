# CAREERFIT (SWP391) — BÁO CÁO KIỂM THỬ VÀ KIỂM TOÁN HỆ THỐNG (SYSTEM AUDIT REPORT)

> **Dự án:** CareerFit — Nền tảng tuyển dụng chuyên biệt dành cho sinh viên & fresher IT
> **Môn học:** SWP391 — Software Development Project (FPT University)
> **Phiên bản:** 2.0 (Khớp hoàn toàn SRS Master v2.0)
> **Ngày cập nhật:** 2026-09-17

---

## 1. DÁNH SÁCH 28 USE CASE ĐÃ HOÀN THÀNH (IMPLEMENTED USE CASES)

Toàn bộ **28 Use Cases Bắt buộc (Must-have)** được mô tả trong tài liệu SRS Master đã được rà soát, kiểm thử và tích hợp hoàn chỉnh:

### Candidate (Ứng viên)
- **UC01 Register Candidate Account**: Đăng ký tài khoản Candidate (kiểm tra định dạng email, mã hóa mật khẩu, kiểm tra trùng lặp).
- **UC02 Login / Logout**: Đăng nhập/Đăng xuất hệ thống cho tất cả vai trò, điều hướng tự động về Dashboard tương ứng.
- **UC03 Update Candidate Profile & Skill Tags**: Cập nhật hồ sơ cá nhân và danh sách kỹ năng dạng Tag (`candidate_skill`).
- **UC04 Upload / Update CV**: Tải lên/cập nhật CV (định dạng PDF/DOCX), tự động trích xuất văn bản vào `extracted_cv_text`.
- **UC05 Delete CV**: Xóa file CV và đặt giá trị `extracted_cv_text` về null.
- **UC06 View Recommended Job List ranked by skill Match Score**: Hiển thị danh sách việc làm xếp hạng theo % Match Score dựa trên kỹ năng tag (`candidate_skill` và `job_skill`), không gọi LLM API.
- **UC07 Search Jobs by Keyword**: Tìm kiếm tin tuyển dụng theo từ khóa tiêu đề, công ty, địa điểm, kỹ năng.
- **UC08 Filter Jobs by category / location / salary / type**: Bộ lọc đa tiêu chí (chuyên môn, địa điểm, mức lương, hình thức làm việc, Match Score).
- **UC09 View Job Posting Details**: Xem chi tiết tin tuyển dụng bao gồm thông tin công ty, yêu cầu, quyền lợi, kỹ năng bắt buộc và banner giải thích AI.
- **UC10 AI Deep CV-JD Analysis for one selected job**: Phân tích sâu CV-JD dùng LLM (Primary Gemini + Fallback chain), hiển thị % phù hợp, kỹ năng thiếu và Roadmap học tập, hỗ trợ cache 24h (`ai_analysis_cache`).
- **UC11 Apply to Job Posting**: Ứng tuyển việc làm với CV đã upload.
- **UC12 Track Application Status in Kanban grouped list**: Theo dõi trạng thái ứng tuyển dạng danh sách nhóm cột Read-only (Đã nộp, Đã xem, Phỏng vấn, Offer, Từ chối).
- **UC13 Report Suspicious Job Posting**: Báo cáo tin tuyển dụng nghi ngờ lừa đảo/giả mạo.

### Employer (Nhà tuyển dụng)
- **UC14 Register Employer Account with business license upload**: Đăng ký doanh nghiệp kèm tải lên Giấy phép kinh doanh (`business_license_file`), trạng thái ban đầu `UNVERIFIED`.
- **UC15 Employer Login / Logout**: Đăng nhập/Đăng xuất tài khoản nhà tuyển dụng.
- **UC16 Update Company Profile**: Cập nhật thông tin công ty (logo, website, mô tả, quy mô, địa chỉ).
- **UC17 Post Job Listing**: Đăng tin tuyển dụng mới (chỉ VERIFIED Employer mới có quyền đăng tin; tin mới sẽ thuộc trạng thái chờ Admin duyệt).
- **UC18 Edit Job Listing**: Chỉnh sửa thông tin tin tuyển dụng.
- **UC19 Close / Delete Job Listing**: Đóng hoặc xóa tin tuyển dụng.
- **UC20 View Applicant List for a Job Posting**: Xem danh sách ứng viên đã nộp đơn cho từng tin tuyển dụng.
- **UC21 View Candidate Profile / CV**: Xem hồ sơ chi tiết và file CV của ứng viên.
- **UC22 Update Application Status per Candidate**: Cập nhật trạng thái hồ sơ ứng viên (gửi thông báo In-app tự động; khi chuyển sang "Phỏng vấn", yêu cầu nhập ghi chú/thời gian/link Google Meet).

### Admin (Quản trị viên)
- **UC23 Approve / Reject New Job Posting**: Kiểm duyệt tin tuyển dụng mới (Chấp nhận hoặc Từ chối kèm lý do).
- **UC24 Handle Reported Suspicious Job Posting**: Xử lý báo cáo vi phạm tin tuyển dụng (khi xác nhận lừa đảo, chuyển trạng thái `RESOLVED_REMOVED` và tự động ẩn tin `jobs.is_visible = false`).
- **UC25 Lock / Unlock User Account**: Khóa/mở khóa tài khoản người dùng (tài khoản bị khóa không thể đăng nhập).
- **UC26 Add / Edit / Delete Skill Catalog**: Quản lý danh mục kỹ năng chuẩn (xóa mềm bằng flag `is_active`).
- **UC27 Add / Edit / Delete Learning Roadmap for a Skill**: Quản lý Lộ trình học tập kỹ năng (`roadmaps` & `roadmap_topics`).
- **UC28 Approve / Reject Employer Verification**: Duyệt/Từ chối xác minh doanh nghiệp (yêu cầu lý do khi Từ chối).

---

## 2. CÁC PHÂN HỆ ĐÃ ĐƯỢC BỔ SUNG & BẢO TRÌ (FIXED USE CASES & COMPONENTS)

1. **Sửa lỗi menu điều hướng bên trái (Sidebar Missing Fix)**:
   - Loại bỏ các đường dẫn riêng như `/candidate-onboarding` khỏi danh sách `isPublicPage` trong `App.jsx`, đảm bảo menu điều hướng thống nhất luôn xuất hiện khi Candidate truy cập "Hồ sơ & CV".
2. **Khôi phục trang Kanban Quản lý Quy trình Tuyển dụng (Employer Kanban Fix)**:
   - Thêm khai báo `useMemo` bị thiếu trong `RecruitmentPipeline.jsx`, hỗ trợ lọc ứng viên theo từng job và kéo-thả HTML5 mượt mà.
3. **Loại bỏ các nút Đăng nhập thử nghiệm (Removal of Demo Logins)**:
   - Gỡ bỏ thẻ kết nối CSDL ảo và các nút đăng nhập 1-click khỏi `LoginPage.jsx` để chuyển sang quy trình đăng nhập/đăng ký chuẩn.
4. **Chuẩn hóa luồng OAuth Google**:
   - Tự động kiểm tra email Google đã tồn tại trong CSDL. Nếu người dùng mới đăng nhập Google lần đầu, điều hướng qua trang chọn Role (`CANDIDATE` hoặc `EMPLOYER`) trước khi khởi tạo tài khoản.

---

## 3. CÁC TÍNH NĂNG ĐÃ LOẠI BỎ KHỎI SCOPE (REMOVED REDUNDANT FEATURES)

Để đảm bảo phạm vi dự án SWP391 tập trung 100% vào matching việc làm IT cho fresher và đạt tính ổn định cao nhất, các tính năng ngoài scope đã được loại bỏ hoàn toàn:
- ❌ **Loại bỏ Gói Premium / Thanh toán VIP**: Sản phẩm miễn phí 100%, xóa toàn bộ giao diện bảng giá và nhãn VIP.
- ❌ **Loại bỏ Vai trò Freelancer / Career Switcher**: Hệ thống chỉ giữ đúng 3 vai trò: `CANDIDATE`, `EMPLOYER`, `ADMIN`.
- ❌ **Loại bỏ Drag-and-Drop trên Candidate Kanban**: Giao diện Kanban của Candidate (`ApplicationKanban.jsx`) là dạng danh sách nhóm đọc (Read-only status view), ứng viên không tự ý đổi trạng thái ứng tuyển.
- ❌ **Loại bỏ Bảng `saved_jobs` & `employer_verifications` thừa**: Trạng thái xác minh doanh nghiệp được lưu trực tiếp tại `companies.verification_status`.
- ❌ **Loại bỏ Email SMTP & Realtime Push Notifications**: Thay thế bằng hệ thống In-app Notifications lưu trực tiếp tại bảng `notifications`.

---

## 4. BẢNG DỮ LIỆU ĐÃ CHUẨN HÓA (UPDATED DATABASE SCHEMA)

CSDL được thiết kế lại chuẩn hóa hoàn toàn tại `database/devcareer_db.sql` và `database/careerfit_db.sql`:

1. `users`: Quản lý tài khoản (id, email, username, password_hash, role, status, oauth_provider, extracted_cv_text, cv_file_path).
2. `candidate_profiles`: Thông tin cá nhân ứng viên (university, major, graduation_year, desired_role, expected_salary).
3. `companies`: Thông tin doanh nghiệp (verification_status, rejection_reason, business_license_file).
4. `skills`: Danh mục kỹ năng chuẩn (name, category, is_active).
5. `candidate_skill`: Bảng trung gian gắn tag kỹ năng ứng viên.
6. `jobs`: Tin tuyển dụng (company_id, employer_id, verification_status, moderation_status, is_visible).
7. `job_skill`: Bảng trung gian kỹ năng yêu cầu/ưu tiên của tin tuyển dụng.
8. `applications`: Đơn ứng tuyển (status, interview_date, interview_time, meeting_link, interview_note).
9. `roadmaps`: Lộ trình học tập theo kỹ năng (skill_id UNIQUE, estimated_weeks).
10. `roadmap_topics`: Chủ đề/bước trong lộ trình học tập.
11. `reports`: Báo cáo vi phạm tin tuyển dụng (job_id, reporter_id UNIQUE, status, admin_note).
12. `notifications`: Thông báo In-app hệ thống (recipient_id, title, body, is_read, related_application_id).
13. `ai_analysis_cache`: Cache kết quả AI phan tích CV-JD trong 24 giờ (candidate_id, job_id UNIQUE, match_percentage, matched_skill_ids, missing_skill_ids).

---

## 5. TÀI KHOẢN MẪU ĐỂ KIỂM THỬ (TEST ACCOUNTS)

Tất cả tài khoản mẫu đã được nạp sẵn vào CSDL seeddata:

| Vai trò | Email | Mật khẩu | Trạng thái | Ghi chú |
|---|---|---|---|---|
| **Candidate** | `candidate@gmail.com` | `Candidate@123` | `ACTIVE` | Tài khoản Seed: Đã có sẵn CV mẫu `Nguyen_Van_A_CV_2026.pdf` & 6 tag kỹ năng |
| **Employer (Verified)** | `employer@gmail.com` | `Employer@123` | `ACTIVE` | Doanh nghiệp Seed **VERIFIED** (FPT Software) -> Đã có sẵn 2 tin tuyển dụng mẫu |
| **Employer (Pending)** | `employer.pending@gmail.com` | `Employer@123` | `ACTIVE` | Doanh nghiệp Seed **UNVERIFIED** -> Bị chặn đăng tin |
| **Admin** | `trongtien6571@gmail.com` | *Google OAuth Only* | `ACTIVE` | Quản trị viên hệ thống (Đăng nhập độc quyền qua Google OAuth) |

> 📌 **QUY TẮC CẮT PHÂN VÙNG DỮ LIỆU CÁ NHÂN HÓA & THÔNG BÁO THỰC (DATA & NOTIFICATION ISOLATION):**
> 1. **5 tài khoản Seed ban đầu**: Giữ nguyên dữ liệu mẫu đầy đủ để hỗ trợ chấm điểm / demo nhanh use cases.
> 2. **TẤT CẢ các tài khoản đăng ký mới sau đó (Candidate / Employer / Google Login)**: Chạy 100% theo DỮ LIỆU THỰC. Ban đầu hoàn toàn trống (`hasCV = false`, `0 đơn ứng tuyển`, `0 tin tuyển dụng`, `0 thông báo`).
> 3. **Hệ thống Thông báo (In-App Notifications)**: Đã loại bỏ hoàn toàn thông báo giả cứng. Thông báo chỉ phát sinh tự động dựa trên hành động thực tế giữa các vai trò (Ứng tuyển, Cập nhật trạng thái phỏng vấn/link Google Meet, Duyệt tin, Xác minh).

---

## 6. HƯỚNG DẪN VẬN HÀNH (HOW TO RUN)

### Khởi động Frontend:
```bash
npm run dev
# Đã kiểm tra build production thành công: npm run build (0 error)
```
Ứng dụng frontend chạy tại: `http://localhost:5173`

### Khởi động Backend (Spring Boot):
```cmd
run-backend.bat
# Hoặc chạy lệnh java:
"C:\Program Files\Java\jdk-22\bin\java.exe" -jar "backend\target\careerfit-backend-1.0.0-SNAPSHOT.jar"
```
Backend API service chạy tại: `http://localhost:8080`

---

## 7. HƯỚNG DẪN KIỂM THỬ LUỒNG NGHIỆP VỤ (TESTING FLOWS)

### 1. Luồng Candidate:
1. Đăng nhập với `candidate@gmail.com` / `Candidate@123`.
2. Vào **Việc làm IT**: Kiểm tra thứ hạng tin tuyển dụng theo % Match Score tag kỹ năng.
3. Nhấp vào tin **"Fresher Java Backend Developer"**:
   - Nhấp nút **Phân tích CV bằng AI**: Kiểm tra AI CV-JD Analysis (gọi LLM / cache), hiển thị kỹ năng có, kỹ năng thiếu và Roadmap tương ứng.
   - Nhấp nút **Ứng tuyển ngay**.
4. Vào **Quản lý ứng tuyển**: Xem trạng thái ứng tuyển dạng cột Read-only Kanban.
5. Nhấp nút **Báo cáo tin lừa đảo** ở chi tiết job để gửi báo cáo tới Admin.

### 2. Luồng Employer:
1. Đăng nhập với `employer.pending@gmail.com` / `Employer@123`:
   - Thử vào **Đăng tin mới**: Hệ thống báo lỗi/chặn do trạng thái doanh nghiệp là `UNVERIFIED`.
2. Đăng nhập với `employer@gmail.com` / `Employer@123`:
   - Vào **Đăng tin mới**: Tạo tin tuyển dụng mới thành công.
   - Vào **Quản lý ứng viên**: Chọn đơn ứng tuyển, nhấp đổi trạng thái sang **Phỏng vấn**.
   - Nhập thời gian phỏng vấn, link Google Meet và ghi chú -> Hệ thống tạo thông báo gửi tới Candidate.

### 3. Luồng Admin:
1. Đăng nhập bằng Google OAuth với tài khoản `trongtien6571@gmail.com`.
2. Vào **Xác minh doanh nghiệp**: Duyệt công ty `Startup Tech Co.` hoặc từ chối kèm lý do.
3. Vào **Kiểm duyệt tin**: Duyệt tin tuyển dụng mới đăng từ Employer.
4. Vào **Báo cáo vi phạm**: Xem báo cáo từ Candidate, chọn `Xác nhận lừa đảo` kèm ghi chú `admin_note` -> Tin tuyển dụng tự động ẩn khỏi danh sách (`is_visible = false`).
5. Vào **Quản lý người dùng**: Thử Khóa/Mở khóa tài khoản Candidate/Employer.

---

## 8. GIỚI HẠN CÒN LẠI (REMAINING LIMITATIONS)

1. **LLM API Quota Free Tier**: Lần phân tích AI CV-JD đầu tiên có thể tốn 2-4 giây tùy vào phản hồi của Google Gemini API. Các lần phân tích sau cho cùng 1 job được phục vụ tức thì nhờ bộ nhớ đệm `ai_analysis_cache`.
2. **Xác thực Google OAuth trong môi trường Local**: Cần cấu hình `VITE_GOOGLE_CLIENT_ID` trong file `.env` nếu kiểm thử đăng nhập Google thật. Trên môi trường thử nghiệm local, hệ thống có sẵn cơ chế giả lập đăng ký Google mượt mà.

---
*Báo cáo được khởi tạo tự động bởi Antigravity AI Coding Assistant.*
