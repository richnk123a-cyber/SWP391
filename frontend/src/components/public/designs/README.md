# Các bản giao diện React

Ba bản thiết kế HTML đã được chuyển sang JavaScript React (.jsx) và CSS riêng:

- `CareerFitLanding.jsx` + `CareerFitLanding.css`: bản landing page ban đầu.
- `CareerFitHome.jsx` + `CareerFitHome.css`: bản trang chủ tối giản.
- `CareerFitJobs.jsx` + `CareerFitJobs.css`: bản thiết kế danh sách việc làm.
- `useDesignInteractions.js`: xử lý tương tác, điều hướng và dọn dẹp sự kiện khi component unmount.

Chạy `npm run dev` trong thư mục `frontend`, sau đó mở địa chỉ Vite với
`/?design=landing`, `/?design=home` hoặc `/?design=jobs` khi chưa đăng nhập.
Các liên kết tìm việc, đăng nhập và đăng ký chuyển vào màn hình React hiện có.

Các bản thiết kế giữ dữ liệu mẫu để xem giao diện; bộ lọc trong bản `jobs`
chỉ minh họa thao tác. Trang có dữ liệu và bộ lọc hoạt động là
`../HomePage.jsx` và `../../candidate/JobSearchPage.jsx` đang được App sử dụng.

CSS được giới hạn bằng `@scope` cho từng bản thiết kế. `frontend/index.html`
là entry point bắt buộc của Vite: nạp `src/main.jsx` để render ứng dụng React.
