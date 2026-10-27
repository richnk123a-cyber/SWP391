# SỔ TAY KỸ THUẬT VÀ KIẾN THỨC CÔNG NGHỆ THÔNG TIN

## 1. Cấu trúc dữ liệu và Giải thuật (DSA)
- **Thuật toán Tìm đường và Định tuyến (Pathfinding & Routing Algorithms):**
  - Kỹ năng tìm đường (Pathfinding) trong CNTT là tập hợp các giải thuật tìm đường đi ngắn nhất hoặc tối ưu nhất giữa các đỉnh trong đồ thị (Graph) hoặc lưới tọa độ (Grid).
  - Các thuật toán cốt lõi:
    - **A* (A-Star Algorithm):** Thuật toán tìm đường tối ưu kết hợp chi phí thực tế g(n) và hàm đánh giá Heuristic h(n) với công thức f(n) = g(n) + h(n). Được sử dụng rộng rãi trong Lập trình Game (NPC di chuyển tránh vật cản), Bản đồ số (Google Maps, GPS), Robot tự hành và Xe tự lái.
    - **Dijkstra:** Thuật toán tìm đường đi ngắn nhất từ một đỉnh nguồn đến mọi đỉnh trong đồ thị có trọng số không âm. Ứng dụng trọng tâm trong giao thức định tuyến mạng viễn thông (OSPF, IS-IS).
    - **BFS (Breadth-First Search):** Tìm đường ngắn nhất trên đồ thị không trọng số hoặc dạng mê cung lưới (Grid map).
    - **Bellman-Ford & Floyd-Warshall:** Tìm đường đi ngắn nhất khi đồ thị có trọng số âm hoặc cần tính toán khoảng cách giữa mọi cặp đỉnh.
  - Ứng dụng thực tế: Định tuyến gói tin trên Internet (IP Routing, BGP), Bản đồ chỉ đường dẫn đường vệ tinh, Trí tuệ nhân tạo Game AI, Robot hút bụi và Kho vận thông minh.
- **Tỉa cây (Tree Pruning):**
  - Kỹ thuật loại bỏ các nhánh hoặc nút con dư thừa trong cấu trúc dữ liệu dạng cây nhằm giảm độ phức tạp không gian, tăng tốc độ truy vấn và hạn chế hiện tượng quá khớp (overfitting) trong học máy (Machine Learning).
  - Trong cây quyết định (Decision Tree), có hai phương pháp: Pre-pruning (dừng mở rộng cây sớm) và Post-pruning (cắt tỉa sau khi đã xây dựng cây hoàn chỉnh bằng thuật toán Cost Complexity Pruning). Trong thuật toán tìm kiếm Minimax của trò chơi đối kháng, kỹ thuật Alpha-Beta Pruning giúp cắt bỏ các nhánh nhánh không mang lại kết quả tối ưu.
- **Cây AVL (Adelson-Velsky and Landis Tree):**
  - Cây nhị phân tìm kiếm (BST) tự cân bằng nghiêm ngặt. Hệ số cân bằng (Balance Factor = chiều cao cây con trái - chiều cao cây con phải) của mọi nút luôn thuộc {-1, 0, 1}.
  - Cân bằng lại thông qua 4 phép quay: Quay đơn (Left Rotation, Right Rotation) và Quay kép (Left-Right, Right-Left).
  - Đảm bảo độ phức tạp thời gian cho các thao tác tìm kiếm, chèn, xóa luôn đạt O(log n) trong trường hợp xấu nhất.
- **Cây Đỏ-Đen (Red-Black Tree):**
  - Cây nhị phân tìm kiếm tự cân bằng mềm dẻo hơn AVL, sử dụng thuộc tính màu (Đỏ/Đen) và 5 quy tắc chuẩn.
  - Chiều cao tối đa không vượt quá 2*log(n+1). Thao tác chèn/xóa tốn ít phép quay hơn AVL, rất thích hợp cho các tập dữ liệu có tần suất thay đổi cao.
  - Được ứng dụng thực tế trong `java.util.TreeMap`, `java.util.TreeSet` và cấu trúc thùng chứa bucket của `java.util.HashMap` trong Java từ phiên bản 8 khi vượt ngưỡng 8 phần tử.

## 2. Lập trình Java và Spring Boot Framework
- **Nguyên lý lập trình hướng đối tượng (OOP):**
  - Đóng gói (Encapsulation), Kế thừa (Inheritance), Đa hình (Polymorphism), Trừu tượng (Abstraction).
  - Bộ nguyên lý thiết kế SOLID: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion.
- **Quản lý luồng và Đa luồng (Multithreading & Concurrency):**
  - Luồng (Thread) là đơn vị thực thi nhỏ nhất của tiến trình, chia sẻ chung vùng nhớ Heap.
  - Các vấn đề thường gặp: Race Condition, Deadlock, Starvation.
  - Giải pháp đồng bộ: từ khóa `synchronized`, `ReentrantLock`, `AtomicInteger`, `ConcurrentHashMap`, ThreadPool qua `ExecutorService`.
- **Hệ sinh thái Spring Boot:**
  - Inversion of Control (IoC) và Dependency Injection (DI) quản lý vòng đời Bean.
  - Spring Data JPA: Trừu tượng hóa tầng truy cập dữ liệu, tự động sinh truy vấn và hỗ trợ ORM Hibernate.
  - Spring Security: Cơ chế lọc bảo mật SecurityFilterChain, xác thực Authentication và phân quyền Authorization dựa trên Role/Authority.

## 3. Cơ sở dữ liệu và Tối ưu hóa truy vấn (Database & SQL)
- **Thuộc tính ACID trong Giao dịch (Transaction):**
  - Atomicity (Nguyên tử): Mọi thao tác trong transaction hoặc cùng thành công hoặc cùng bị hủy bỏ (Rollback).
  - Consistency (Nhất quán): Dữ liệu chuyển từ trạng thái hợp lệ này sang trạng thái hợp lệ khác theo đúng ràng buộc.
  - Isolation (Cô lập): Các giao dịch chạy đồng thời không can thiệp lẫn nhau.
  - Durability (Bền vững): Dữ liệu sau khi Commit sẽ được lưu trữ vĩnh viễn ngay cả khi hệ thống gặp sự cố mất điện.
- **Cơ chế Indexing trong Database:**
  - Cấu trúc chỉ mục (chủ yếu là B-Tree hoặc B+Tree) giúp tăng tốc độ tìm kiếm câu lệnh SELECT từ O(n) xuống O(log n).
  - Lưu ý: Quá nhiều index sẽ làm chậm tốc độ ghi (INSERT, UPDATE, DELETE) vì phải cập nhật đồng thời bảng dữ liệu và cây chỉ mục.

## 4. Điện toán đám mây và Mạng máy tính (Cloud & Networking)
- **Điện toán đám mây (Cloud Computing):**
  - Cung cấp tài nguyên máy tính theo nhu cầu qua mạng Internet theo mô hình pay-as-you-go.
  - 3 mô hình dịch vụ: IaaS (Hạ tầng - AWS EC2), PaaS (Nền tảng - Heroku, AWS Elastic Beanstalk), SaaS (Phần mềm - Google Workspace).
- **Socket trong truyền thông mạng:**
  - Điểm cuối kết nối hai chiều giữa các ứng dụng trên mạng, xác định bằng cặp IP Address + Port Number.
  - Hoạt động ở tầng Transport qua giao thức TCP (tin cậy, bắt tay 3 bước) hoặc UDP (tốc độ cao, không kết nối); tầng Application qua giao thức WebSocket cho truyền thông thời gian thực.
