# CareerFit — Nền phong cảnh và kính mờ bên trong

## Phạm vi và file

| File | Thay đổi |
| --- | --- |
| `src/components/common/AppBackground.tsx` | Nền cố định dùng chung; lựa chọn video/poster theo thiết bị và sở thích; tốc độ 0.7x, dừng khi tab ẩn, parallax tối đa 8px ngang/6px dọc; sắc xanh trời cho doanh nghiệp |
| `src/components/common/AppBackground.css` | Gradient trắng–mint, blur nền 3px, ba lớp sương SVG, tám hạt phấn; chế độ ảnh tĩnh và giảm chuyển động |
| `src/styles/workspace-glass.css` | Token màu và kính dùng chung; header/sidebar/modal/card, form/bảng đậm hơn, hover, stagger 60ms, shimmer một lần, trạng thái ứng tuyển và đường lộ trình |
| `src/App.jsx` | Gắn nền phía ngoài phần layout có CSS zoom; thêm class trình bày cho khu vực bên trong |
| `src/main.jsx` | Nạp stylesheet kính sau các stylesheet cũ |
| `src/components/common/ToastContainer.jsx` | Thêm class trình bày để giữ toast xanh đậm, chữ trắng |
| `public/background/` | Ba file dẫn xuất từ chính video đồng cỏ đang dùng ở trang chủ/đăng nhập |
| `../.gitignore` | Bỏ qua công cụ chuyển mã và video nguồn trong `.tools/` |

Không sửa nội dung trang, cấu trúc form/card, đường dẫn, phân quyền, API hay xử lý nghiệp vụ. Trang chủ/đăng nhập giữ cách trình bày hiện có. CSS mới chỉ áp dụng trong `.landscape-workspace`.

## Asset và hiệu năng

Nguồn là video CloudFront đã dùng trong `HeroVideo.tsx`; không tạo phong cảnh mới. Poster được trích ở giây thứ 2. Video đã bỏ audio và giảm xuống **1280×712, 18fps**, khoảng 14 giây. Hai định dạng là lựa chọn thay thế, trình duyệt tải định dạng hỗ trợ đầu tiên.

| Asset | Dung lượng |
| --- | ---: |
| `careerfit-meadow.webm` | 976.394 byte |
| `careerfit-meadow.mp4` | 930.152 byte |
| `careerfit-meadow-poster.jpg` | 150.604 byte |

Video chỉ được gắn sau khi xác định màn hình từ 768px, có chuột/con trỏ chính xác, không bật giảm chuyển động, không Save-Data và không dùng mạng 2G. Mobile, thiết bị cảm ứng và Save-Data chỉ dùng poster; sương/hạt phấn cũng dừng. `preload="metadata"`, autoplay/muted/loop/playsInline và poster đều có trên thẻ video.

Parallax dùng một requestAnimationFrame cho mỗi lượt cập nhật, không cập nhật React state theo con trỏ. Blur và bóng không được animate liên tục; chuyển động nền dùng transform/opacity. Video và các lớp khí quyển dừng khi tab ẩn. Trình duyệt không hỗ trợ backdrop-filter dùng nền trắng 95%.

## Màu và khả năng đọc

Giữ palette yêu cầu: primary `#2D6A4F`, primary-dark `#1B4332`, accent `#52B788`, accent-light `#74C69D`, mint `#F1FAF4/#D8F3DC/#B7E4C7`, cùng sun/peach/sky cho các icon nhỏ. Bốn icon thống kê dùng các ô tròn pastel; diện tích thẻ vẫn trắng.

Màu chữ phụ `#5C7A6B` đạt 4,72:1 trên trắng đặc nhưng chỉ khoảng 4,11:1 trên một nền kính nhạt đại diện. Vì vậy nhãn nhỏ trên kính dùng sắc cùng họ đậm hơn `#496858`: khoảng 5,38:1 trên `#EDF0EE` và 5,22:1 trên mint `#D8F3DC`. Chữ chính `#1B4332` trên mint đạt 9,38:1; chữ trắng trên nút `#2D6A4F` đạt 6,39:1. Form dài/bảng dùng trắng 92%; input có nền riêng. Đây là kiểm tra các cặp màu mới, không phải chứng nhận accessibility toàn hệ thống.

## Kiểm tra và giới hạn

- Build TypeScript/Vite và bộ kiểm thử frontend hiện có.
- Trang việc làm kiểm tra trực tiếp trên ứng dụng: video WebM chạy 0.7x, kính blur 14px/saturate 140%, nền layout trong suốt.
- Dashboard, đơn ứng tuyển, lộ trình, hồ sơ và doanh nghiệp kiểm tra bằng component thật dựng với dữ liệu mẫu, không tạo phiên đăng nhập hoặc gọi API nghiệp vụ.
- Mobile kiểm tra không có thẻ video, chỉ có poster; không tràn ngang. Hồ sơ kiểm tra nền form trắng 92% và upload viền nét đứt `#74C69D`; doanh nghiệp kiểm tra overlay trời xanh 12%.
- Chưa kiểm thử thao tác nghiệp vụ trong phiên đăng nhập từng vai trò. Save-Data/reduced-motion và fallback trình duyệt cũ đã được xử lý trong code/CSS, nhưng công cụ trình duyệt hiện tại không hỗ trợ mô phỏng các chế độ đó để kiểm tra runtime đầy đủ.
- Các màn preview riêng qua `?design=...` và trang công khai không thuộc lớp kính bên trong. Logo nhà cung cấp, ảnh/logo công ty, màu trạng thái lỗi/cảnh báo giữ ý nghĩa và màu riêng.
