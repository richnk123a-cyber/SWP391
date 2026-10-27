# TÀI LIỆU TOÀN DIỆN HỆ THỐNG CAREERFIT (SWP3911)

## 1. Giới thiệu nền tảng CareerFit
CareerFit là nền tảng kết nối việc làm và phát triển sự nghiệp chuyên sâu dành cho sinh viên ngành Công nghệ thông tin (CNTT), Fresher và các Doanh nghiệp tuyển dụng công nghệ tại Việt Nam. Hệ thống hướng tới mục tiêu thu hẹp khoảng cách giữa đào tạo đại học và yêu cầu tuyển dụng thực tế thông qua các công nghệ đánh giá kỹ năng, thuật toán so khớp độ phù hợp (Match Score) và Trợ lý AI thông minh hỗ trợ tối ưu hóa hồ sơ và mô tả công việc.

## 2. Các vai trò người dùng trong hệ thống
Hệ thống CareerFit phân quyền chặt chẽ theo 3 nhóm vai trò chính:
- **Ứng viên (CANDIDATE):**
  - Quản lý hồ sơ năng lực cá nhân: Họ tên, trường đại học, chuyên ngành, năm tốt nghiệp, kỹ năng kỹ thuật, kỹ năng mềm, đồ án thực tế và tải lên file CV gốc (PDF/DOCX).
  - Tự động phân tích CV bằng AI: AI bóc tách thông tin từ tệp tải lên, gợi ý chỉnh sửa ngữ pháp và chuẩn hóa dữ liệu theo chuẩn ATS.
  - Tính điểm phù hợp Match Score: Hệ thống tự động so khớp kỹ năng trong CV của ứng viên với yêu cầu của từng tin tuyển dụng.
  - Quản lý quá trình ứng tuyển qua bảng Kanban: Theo dõi trạng thái đơn nộp qua 5 bước trực quan: Đã nộp (APPLIED), Đang xem xét (REVIEWING), Phỏng vấn (INTERVIEW), Trúng tuyển (ACCEPTED), Từ chối (REJECTED).
  - Tham gia phỏng vấn trực tuyến: Nhận lịch hẹn và đường dẫn phòng họp Google Meet trực tiếp từ nhà tuyển dụng.
  - Lộ trình kỹ năng (Roadmap): Xem lộ trình học tập, theo dõi tiến độ hoàn thành các chủ đề kỹ năng công nghệ.

- **Nhà tuyển dụng (EMPLOYER):**
  - Quản lý hồ sơ công ty: Tên doanh nghiệp, website, địa chỉ, quy mô nhân sự, giấy phép kinh doanh (GPKD) để gửi Admin phê duyệt.
  - Đăng tin tuyển dụng (Job Posting): Điền tiêu đề, danh mục ngành nghề, hình thức làm việc (Full-time, Internship, Part-time, Remote, Hybrid), mức lương, hạn nộp hồ sơ, tách bạch kỹ năng bắt buộc (Required Skills) và kỹ năng ưu tiên (Preferred Skills).
  - AI Polish JD: Hỗ trợ doanh nghiệp tối ưu hóa bản mô tả công việc, thu hút ứng viên sinh viên và fresher.
  - Quản lý Pipeline ứng viên: Xem danh sách ứng viên đã nộp đơn, lọc theo điểm Match Score, tải CV gốc của ứng viên. Kéo thả trạng thái ứng viên trên Kanban. Khi chuyển trạng thái sang "Phỏng vấn", hệ thống yêu cầu nhập thời gian và link Google Meet để tự động gửi thông báo cho ứng viên.

- **Quản trị viên (ADMIN):**
  - Phê duyệt hồ sơ doanh nghiệp (Verified / Pending / Rejected).
  - Kiểm duyệt các tin tuyển dụng mới trước khi hiển thị công khai trên hệ thống.
  - Quản lý danh mục kỹ năng (Skill Catalog) chuẩn hóa.
  - Theo dõi báo cáo vi phạm và thống kê tổng quan hệ thống.

## 3. Thuật toán tính điểm Match Score
- Match Score là điểm số phần trăm (0 - 100%) thể hiện mức độ tương thích giữa hồ sơ ứng viên và tin tuyển dụng.
- Cơ chế tính điểm:
  - Trọng số cao nhất dành cho các Kỹ năng bắt buộc (Required Skills): Đạt tối đa 70% tổng điểm.
  - Trọng số bổ sung dành cho Kỹ năng ưu tiên (Preferred Skills): Đạt tối đa 20% tổng điểm.
  - Sự phù hợp về vị trí ứng tuyển mục tiêu (Desired Role) và chuyên ngành: Đạt tối đa 10% tổng điểm.
- Hệ thống chuẩn hóa tên kỹ năng trước khi so khớp (ví dụ: "ReactJS", "React.js", "React" đều được quy về một kỹ năng chuẩn).

## 4. Quy trình tạo và chuẩn hóa CV 7 bước
Quy trình chuẩn giúp sinh viên CNTT tạo CV chuyên nghiệp theo tiêu chuẩn ATS (Applicant Tracking System):
1. Bước 1: Vị trí mục tiêu rõ ràng (Target Role - ví dụ: Java Backend Fresher, Frontend React Developer).
2. Bước 2: Thông tin liên hệ chuẩn xác (Họ tên, Email chuyên nghiệp, Số điện thoại, Địa chỉ/Tỉnh thành, Link GitHub/LinkedIn).
3. Bước 3: Học vấn và GPA (Trường đại học, Chuyên ngành, Năm tốt nghiệp dự kiến).
4. Bước 4: Kỹ năng kỹ thuật cốt lõi (Phân nhóm rõ ràng: Ngôn ngữ lập trình, Framework, Database, Tools).
5. Bước 5: Đồ án môn học và dự án cá nhân nổi bật (Tên đồ án, công nghệ sử dụng, vai trò đảm nhiệm, kết quả đo lường được, đính kèm link demo/GitHub).
6. Bước 6: Kỹ năng mềm và hoạt động ngoại khóa (Giao tiếp, làm việc nhóm Agile/Scrum, giải quyết vấn đề).
7. Bước 7: Ngoại ngữ & Chứng chỉ chuyên môn (IELTS, TOEIC, chứng chỉ AWS, Microsoft, Coursera).

## 5. Kiến trúc bảo mật và Công nghệ nền tảng
- Backend: Java 17, Spring Boot 3.3.4, Spring Security, Spring Data JPA.
- Cơ sở dữ liệu: Microsoft SQL Server, tích hợp Hibernate ddl-auto update.
- Xác thực: JSON Web Token (JWT) mã hóa HS256 với thời hạn 24 giờ; tích hợp đăng nhập mạng xã hội OAuth2 qua Google và Microsoft Azure AD.
- AI & LLM Engine: Mô hình bậc thang đa AI (Groq Llama 3.3 70B, Google Gemma 4 31B, NVIDIA Nemotron 3 Super).
- Bộ phân tích tài liệu: Apache PDFBox (trích xuất file PDF) và Apache POI OOXML (trích xuất file DOCX).
