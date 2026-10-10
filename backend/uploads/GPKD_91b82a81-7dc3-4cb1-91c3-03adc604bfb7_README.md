# CareerFit - Nền Tảng Tìm Việc Làm IT Dành Cho Sinh Viên/Fresher`
`
CareerFit là hệ thống hỗ trợ sinh viên IT và Fresher tìm kiếm cơ hội việc làm, xây dựng lộ trình phát triển kỹ năng, và kết nối với các doanh nghiệp công nghệ.`
`
## 🛠 Tech Stack`
`
*   **Frontend:** React 18, Vite, TailwindCSS, npm`
*   **Backend:** Java 17, Spring Boot 3, Spring Security, OAuth2 + JWT, Spring Data JPA, JavaMailSender, Maven`
*   **Database:** Microsoft SQL Server`
`
## 📋 Yêu cầu hệ thống (Prerequisites)`
`
**Bắt buộc:**`
*   **Git**`
*   **Java 17** (để chạy Backend)`
*   **Node.js 18+** (để chạy Frontend)`
*   (Tùy chọn) Docker Desktop (nếu bạn muốn chạy SQL Server cực nhanh không cần cài đặt rườm rà).`
*   Không bắt buộc phải cài đặt Maven (vì dự án đã tích hợp sẵn Maven Wrapper).`
`
---`
`
## 🚀 Hướng dẫn cài đặt và chạy dự án (Getting Started)`
`
### 1. Clone Project & Cấu hình Môi trường`
`
Mở Terminal (hoặc Command Prompt, PowerShell) và chạy:`
`
```bash`
git clone <repository-url>`
cd <repository>`
````
`
Tạo file biến môi trường từ template có sẵn:`
- Copy file `.env.example` và đổi tên thành `.env`. (Lưu ý: Giữ file `.env` ở thư mục gốc của project).`
- Chỉnh sửa file `.env` theo thông tin máy của bạn (nếu dùng Docker, bạn có thể giữ nguyên cấu hình mặc định).`
`
## Database Setup`
`
### Bước 1`
Cài:`
Microsoft SQL Server`
SQL Server Management Studio`
`
### Bước 2`
Mở SSMS bằng:`
Windows Authentication`
`
### Bước 3`
Chạy:`
``sql`
SELECT SUSER_SNAME();`
``
`
### Bước 4`
Chạy:`
careerfit_db.`sql`
để tạo database:`
careerfit_db`
`
### Bước 5`
Nếu account chưa có quyền, tạo login/user tương ứng.`
Ví dụ:`
``sql`
USE [master];`
GO`
`
CREATE LOGIN [YOUR_WINDOWS_ACCOUNT]`
FROM WINDOWS;`
GO`
`
USE [careerfit_db];`
GO`
`
CREATE USER [YOUR_WINDOWS_ACCOUNT]`
FOR LOGIN [YOUR_WINDOWS_ACCOUNT];`
GO`
`
ALTER ROLE db_owner`
ADD MEMBER [YOUR_WINDOWS_ACCOUNT];`
GO`
``
Trong đó:`
YOUR_WINDOWS_ACCOUNT`
được thay bằng kết quả:`
``sql`
SELECT SUSER_SNAME();`
``
`
### Bước 6`
Không cần nhập:`
SQL Server username`
SQL Server password`
Spring Boot sử dụng Windows account hiện tại.`
### 3. Chạy Backend (Spring Boot)`
`
```bash`
cd backend`
````
`
**Trên Windows:**`
```bash`
mvnw.cmd spring-boot:run`
````
`
**Trên macOS/Linux:**`
```bash`
./mvnw spring-boot:run`
````
`
Backend sẽ khởi động và chạy tại: `http://localhost:8080``
*(Để kiểm tra xem backend sống hay chưa, bạn có thể truy cập `http://localhost:8080/v3/api-docs`)*`
`
### 4. Chạy Frontend (React)`
`
Mở thêm một cửa sổ Terminal mới, đứng tại thư mục `frontend` của project (nơi có file `package.json`), chạy:`
`
```bash`
cd frontend`
npm ci`
npm run dev`
````
`
Frontend sẽ chạy tại: `http://localhost:5173`. Mở trình duyệt và trải nghiệm!`
`
---`
`
## 🔑 Tài khoản Đăng nhập Mẫu (Mock Data)`
`
Hệ thống đã được bơm sẵn các tài khoản sau (Mật khẩu chung cho tất cả là `123456`):`
`
*   **Ứng viên (Candidate):** `candidate@gmail.com``
*   **Doanh nghiệp đã duyệt (Employer Verified):** `employer@gmail.com``
*   **Doanh nghiệp chờ duyệt (Employer Pending):** `employer.pending@gmail.com``
*   **Quản trị viên (Admin):** Đăng nhập trực tiếp bằng Google OAuth với tài khoản `trongtien6571@gmail.com` (Đã vô hiệu hóa `admin@gmail.com`)`
`
> **Lưu ý:** Vì đây là project đồ án, mật khẩu của tài khoản LOCAL được lưu trữ dưới dạng **PLAINTEXT** trong cơ sở dữ liệu theo đúng yêu cầu nghiệp vụ ban đầu.`
`
---`
`
## ⚙️ Cấu hình Nâng cao (OAuth2)`
`
Để sử dụng được chức năng Đăng nhập qua Google/Microsoft, bạn cần đăng ký các dịch vụ bên thứ 3 và điền vào file `.env` của bạn:`
`
1. **Google OAuth2:**`
   * Truy cập **Google Cloud Console**, tạo một Project và xin cấp phép OAuth Client ID.`
   * Redirect URI khai báo trên Google: `http://localhost:8080/login/oauth2/code/google``
   * Điền vào `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET`.`
`
2. **Microsoft OAuth2:**`
   * Truy cập **Microsoft Entra ID (Azure AD)**, tạo một App Registration.`
   * Redirect URI khai báo trên Azure: `http://localhost:8080/login/oauth2/code/microsoft``
   * Điền vào `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, và `MICROSOFT_TENANT_ID`.`
`
*(Nếu chưa cấu hình những biến này, bạn vẫn có thể đăng nhập bằng các tài khoản mẫu có sẵn)*`
`
---`
`
## 🚑 Khắc phục lỗi thường gặp (Troubleshooting)`
`
*   **`npm is not recognized` / `vite is not recognized`:**`
    Bạn chưa cài đặt Node.js. Vui lòng tải Node.js LTS (18+). Sau khi cài xong, mở terminal mới và chạy `npm ci`.`
*   **`JAVA_HOME is not set`:**`
    Java 17+ chưa được cài hoặc chưa được khai báo vào biến môi trường PATH của Windows.`
*   **Cổng 8080 hoặc 5173 đã bị chiếm dụng (already in use):**`
    Hãy tắt bớt các ứng dụng đang chạy nền (như Tomcat, Oracle) hoặc các terminal đang chạy project cũ.`
*   **Lỗi `Invalid object name 'users'` khi Backend khởi động:**`
    Database chưa được khởi tạo. Bạn chỉ cần chạy file `Start_CareerFit.bat`, nó sẽ tự động tạo và nạp dữ liệu vào database.`
*   **Lỗi `CORS error` trên trình duyệt:**`
    Đảm bảo Frontend đang chạy đúng tại port `5173` và Backend chạy tại port `8080`.`
