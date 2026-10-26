# CareerFit — Mint pastel

## Rà soát frontend

Ứng dụng có 29 tuyến trong `src/routing/routes.js`, gồm các trang công khai và ba không gian ứng viên, doanh nghiệp, quản trị. Giao diện dùng cả Tailwind lẫn CSS riêng cho từng nhóm trang. Hai lớp CSS dùng chung trước đây tiếp tục cần cho bố cục, nhưng màu của chúng đã được chuyển sang token mint để không còn áp các bảng màu xanh dương/xám cũ.

| Nhóm | Phạm vi áp dụng |
| --- | --- |
| Công khai | Trang chủ, đăng nhập, chọn vai trò, onboarding, đăng ký doanh nghiệp, tìm việc, chi tiết việc làm |
| Ứng viên | Dashboard, hồ sơ/CV, phân tích AI, lộ trình học, đơn ứng tuyển, cài đặt |
| Doanh nghiệp | Dashboard, tin tuyển dụng, trình tạo tin, ứng viên, pipeline, hồ sơ công ty, lịch phỏng vấn, cài đặt |
| Quản trị | Dashboard, xác minh, kiểm duyệt, báo cáo, người dùng, kỹ năng, lộ trình, cài đặt |
| Dùng chung | Header, sidebar, form, nút, bảng, badge, modal, thông báo, trạng thái rỗng |

## Bảng màu

| Token | Màu | Vai trò |
| --- | --- | --- |
| `--mint-base` | `#ABF9C8` | Màu lấy từ ảnh tham chiếu; điểm nhấn và vùng trang trí nhỏ |
| `--mint-canvas` | `#F3F8EF` | Nền ứng dụng |
| `--mint-soft` | `#EAF5E7` | Nền phụ, trường nhập |
| `--mint-border` | `#CFE0CA` | Viền thẻ, form, đường phân cách |
| `--mint-primary` | `#2D664C` | Nút chính, liên kết, trạng thái focus |
| `--mint-primary-hover` | `#214F3A` | Hover của nút chính |
| `--mint-ink` | `#28352B` | Tiêu đề và chữ trên nền pastel |
| `--mint-muted` | `#5B6C5B` | Mô tả, nhãn phụ |

Nền chính xanh trắng #F3F8EF, sidebar xanh pastel #EAF5E7, chữ trung tính. Hero chuyển từ xanh pastel #CCF3D3 sang #EDF8E7 để hòa với cảnh quan xanh ở trang đăng nhập. Thẻ nội dung giữ nền trắng. Lỗi và thao tác xóa vẫn dùng đỏ; cảnh báo và trạng thái cần chú ý giữ vàng/amber. Logo Google/Microsoft, màu do người dùng chọn trong công cụ cắt logo và nội dung video giữ màu riêng.

## Cấu trúc CSS

- `src/styles/theme.css`: bảng màu gốc, các thang màu Tailwind và animation.
- `src/styles/mint-theme.css`: các biến ngữ nghĩa dùng chung, trạng thái sidebar, hero pastel và giao diện công khai. Các selector có phạm vi để không thay màu cảnh báo hay logo bên thứ ba.
- CSS của từng trang: giữ bố cục và responsive, dùng `var(--mint-...)` cho màu thương hiệu.
- `src/styles/workspace-scale.css`: giữ mức hiển thị 110% từ 1280px; điện thoại giữ 100%.
- Sidebar tô nền trực tiếp trên nút đang chọn, tránh sai tọa độ khi dùng CSS zoom.
- `src/components/common/TechnologyBackdrop.jsx`: họa tiết mạch công nghệ đặt giữa vùng minh họa. Dashboard ứng viên dùng luồng dữ liệu và quỹ đạo chuyển động nhẹ; tự dừng khi ra khỏi màn hình, ẩn tab hoặc bật giảm chuyển động. Trang tìm việc giữ cụm thẻ nổi CareerFit trước đây. Các banner không có nút tạm dừng.

Font Inter, logic video chuyển tiếp, điều hướng, API và luồng đăng nhập được giữ nguyên. Chế độ tối của phần nội dung trang chủ vẫn dùng token riêng.

## Kiểm tra

Các cặp màu chính được kiểm tra tương phản: chữ trắng/nút xanh 6.74:1; chữ đậm/nền ứng dụng 11.92:1; mô tả/nền hero 4.63:1. Các cặp này đáp ứng ngưỡng WCAG AA cho chữ thường; đây không phải kiểm định accessibility toàn bộ ứng dụng.

Kiểm tra trực quan dashboard, đơn ứng tuyển và lộ trình học bằng component thật với dữ liệu mẫu trên desktop và điện thoại. Bản kiểm tra tĩnh không gọi API hay tạo phiên đăng nhập. Các trang công khai được kiểm tra trực tiếp; chưa kiểm tra tương tác bằng phiên đăng nhập của từng vai trò.

## Lớp phong cảnh/kính bên trong

`src/styles/workspace-glass.css` là lớp trình bày mới nhất, được nạp sau theme mint và chỉ áp dụng trong `.landscape-workspace`. Xem `WORKSPACE_GLASS.md` để biết palette, asset, kiểm tra và giới hạn hiện tại.
