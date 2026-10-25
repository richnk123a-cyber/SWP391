# Điều hướng frontend

`routes.js` định nghĩa URL, tên tab và quyền truy cập cho từng trang. `usePageNavigation.js` giữ trang hiện tại theo URL, cập nhật History API khi chuyển trang và xử lý Back/Forward. Mỗi tab trình duyệt giữ URL riêng; `careerfit_active_page` trong localStorage không còn quyết định trang hiện tại.

Các URL chính:

- `/`: trang chủ; `/login`: đăng nhập; `/register`: hoàn tất đăng ký OAuth.
- `/jobs?keyword=React`: tìm việc; `/jobs/:id`: chi tiết một việc làm.
- `/candidate/dashboard`, `/candidate/profile`, `/candidate/applications`, `/candidate/learning`.
- `/employer/dashboard`, `/employer/jobs`, `/employer/jobs/new`, `/employer/applicants`, `/employer/pipeline`, `/employer/company`.
- `/admin/dashboard`, `/admin/users`, `/admin/jobs`, `/admin/verifications`, `/admin/reports`, `/admin/skills`, `/admin/roadmaps`.
- `/candidate/security`, `/employer/security`, `/admin/security`: bảo mật tài khoản.

`/oauth-success` chỉ nhận callback từ backend. AppContext tiêu thụ token một lần, xóa token khỏi URL và thay thế callback bằng URL dashboard theo vai trò. `/oauth-register` được hỗ trợ như alias của `/register`. Nếu callback không cung cấp phiên hợp lệ, người dùng quay lại `/login`.

`App.jsx` dùng React lazy/Suspense cho các trang và chỉ tải modal khi mở. Danh mục kỹ năng/lộ trình được tải khi trang cần dùng. Video hero tạm dừng khi tab ẩn hoặc cuộn ra ngoài vùng hiển thị.

Kiểm tra với `npm test` và `npm run build` trong thư mục `frontend`. Khi triển khai, máy chủ phục vụ frontend cần fallback các URL trang về `index.html`; Vite dev/preview đã hỗ trợ fallback này. Các API backend vẫn dùng đường dẫn riêng.
