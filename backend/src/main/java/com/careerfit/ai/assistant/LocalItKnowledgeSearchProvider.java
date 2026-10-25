package com.careerfit.ai.assistant;

import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Nhà cung cấp tra cứu kiến thức CNTT nội bộ (Mức 1 - Verified Knowledge Base).
 * Chứa các định nghĩa chuẩn xác, ví dụ thực tế và tài liệu đối chiếu cho các khái niệm CNTT cốt lõi.
 */
@Component
public class LocalItKnowledgeSearchProvider implements SearchProvider {

    public record KnowledgeEntry(
            String canonicalName,
            List<String> keywords,
            String title,
            String summary,
            String technicalDetails,
            String practicalExample,
            String careerRelevance,
            List<String> references
    ) {}

    private final List<KnowledgeEntry> entries = new ArrayList<>();

    public LocalItKnowledgeSearchProvider() {
        initCuratedKnowledgeBase();
    }

    private void initCuratedKnowledgeBase() {
        // 1. Tỉa cây / Tree Pruning
        entries.add(new KnowledgeEntry(
                "tree_pruning",
                List.of("tỉa cây", "tree pruning", "pruning", "cắt tỉa cây", "pruning trong decision tree", "tỉa nhánh"),
                "Tỉa cây (Tree Pruning) trong Cấu trúc dữ liệu, Giải thuật & Machine Learning",
                "Tỉa cây (Tree Pruning) trong CNTT là kỹ thuật loại bỏ các nhánh hoặc nút con không cần thiết hoặc kém hiệu quả trong cấu trúc dữ liệu dạng cây nhằm tối ưu hóa hiệu năng, giảm dung lượng bộ nhớ hoặc hạn chế hiện tượng quá khớp (overfitting).",
                "Trong Machine Learning (đặc biệt là Cây quyết định - Decision Tree), pruning gồm hai dạng chính: Pre-pruning (dừng mở rộng cây sớm dựa trên điều kiện dừng như độ sâu tối đa) và Post-pruning (cắt tỉa bớt nhánh sau khi cây đã học đầy đủ dựa trên chi phí - phức tạp Cost Complexity Pruning). Trong thuật toán tìm kiếm đối kháng (như Minimax trong cờ vua), Alpha-Beta Pruning giúp loại bỏ việc duyệt các nhánh không thể mang lại kết quả tốt hơn.",
                "Ví dụ: Khi xây dựng mô hình dự đoán khả năng ứng viên vượt qua vòng phỏng vấn dựa trên Decision Tree, nếu cây có quá nhiều nhánh rẽ chi tiết cho từng trường hợp ngoại lệ, mô hình sẽ bị overfitting. Kỹ thuật Cost Complexity Pruning sẽ tỉa bớt các lá ít mẫu để mô hình tổng quát hóa tốt hơn trên ứng viên mới.",
                "Rất quan trọng trong các câu hỏi phỏng vấn vị trí Data Scientist, AI/ML Engineer và giải bài toán thuật toán tối ưu hóa tìm kiếm.",
                List.of("Tài liệu Thuật toán Cấu trúc dữ liệu & Giáo trình Machine Learning (Hastie et al.)", "Scikit-Learn Documentation: Decision Tree Pruning")
        ));

        // 2. Cây AVL (AVL Tree)
        entries.add(new KnowledgeEntry(
                "avl_tree",
                List.of("cây avl", "avl tree", "cây nhị phân tự cân bằng", "cân bằng avl", "phép quay avl"),
                "Cây AVL (Adelson-Velsky and Landis Tree)",
                "Cây AVL là cây nhị phân tìm kiếm (Binary Search Tree - BST) tự cân bằng, trong đó độ chênh lệch chiều cao (Balance Factor) giữa hai cây con trái và phải của bất kỳ nút nào không được vượt quá 1 (chỉ nhận giá trị -1, 0, hoặc 1).",
                "Khi thực hiện thao tác chèn (insert) hoặc xóa (delete) làm mất tính cân bằng, cây AVL sẽ tự động thực hiện một trong bốn phép quay: Quay đơn (Left Rotation, Right Rotation) hoặc Quay kép (Left-Right Rotation, Right-Left Rotation). Nhờ đó, chiều cao cây luôn được duy trì ở mức O(log n), đảm bảo thời gian tìm kiếm, chèn và xóa đều đạt độ phức tạp O(log n) trong trường hợp xấu nhất.",
                "Ví dụ: Trong một hệ thống tra cứu mã số sinh viên theo thứ tự tăng dần, nếu dùng BST thông thường khi chèn dữ liệu đã sắp xếp, cây sẽ bị suy biến thành danh sách liên kết với thời gian tìm kiếm O(n). Cây AVL tự xoay để duy trì cây luôn cân bằng, giúp việc tra cứu luôn đạt tốc độ O(log n).",
                "Kiến thức cốt lõi trong môn Cấu trúc dữ liệu & Giải thuật, thường xuất hiện trong các bài kiểm tra đầu vào và phỏng vấn Fresher Software Engineer.",
                List.of("Giáo trình Cấu trúc dữ liệu và Giải thuật (CLRS - Introduction to Algorithms)", "GeeksforGeeks: AVL Tree Insertion & Rotation")
        ));

        // 3. Cây đỏ đen (Red-Black Tree)
        entries.add(new KnowledgeEntry(
                "red_black_tree",
                List.of("cây đỏ đen", "red black tree", "red-black tree", "rbtree"),
                "Cây Đỏ-Đen (Red-Black Tree)",
                "Cây Đỏ-Đen là một biến thể cây nhị phân tìm kiếm tự cân bằng, trong đó mỗi nút có một thuộc tính màu (Đỏ hoặc Đen). Cây tuân thủ 5 quy tắc chuẩn (nút gốc màu đen, lá null màu đen, nút đỏ không có con đỏ, mọi đường đi từ nút gốc đến lá có cùng số lượng nút đen).",
                "So với cây AVL, cây Đỏ-Đen ít nghiêm ngặt về độ cân bằng chiều cao hơn (chiều cao tối đa xấp xỉ 2*log(n+1)), do đó cần ít phép quay hơn trong thao tác chèn và xóa, phù hợp cho các cấu trúc dữ liệu có tần suất thêm/xóa cao.",
                "Ví dụ: Java sử dụng Red-Black Tree để triển khai cấu trúc dữ liệu java.util.TreeMap, java.util.TreeSet, và từ Java 8 cấu trúc HashMap chuyển từ LinkedList sang Red-Black Tree khi số phần tử trong 1 bucket vượt quá ngưỡng TREEIFY_THRESHOLD (8 phần tử).",
                "Câu hỏi kinh điển khi phỏng vấn vị trí Java Backend Developer (Intern/Fresher/Junior).",
                List.of("Oracle Java Documentation (HashMap & TreeMap Internal Architecture)", "CLRS: Red-Black Trees")
        ));

        // 4. Điện toán đám mây / Cloud Computing
        entries.add(new KnowledgeEntry(
                "cloud_computing",
                List.of("cloud computing", "điện toán đám mây", "đám mây", "cloud", "iaas", "paas", "saas"),
                "Điện toán đám mây (Cloud Computing)",
                "Điện toán đám mây (Cloud Computing) trong CNTT là mô hình cung cấp tài nguyên máy tính (máy chủ, lưu trữ, cơ sở dữ liệu, mạng, phần mềm) theo yêu cầu qua Internet với cơ chế trả phí theo mức sử dụng (pay-as-you-go).",
                "Bao gồm ba mô hình dịch vụ chính: IaaS (Infrastructure as a Service - AWS EC2, GCP Compute Engine), PaaS (Platform as a Service - Heroku, AWS Elastic Beanstalk), và SaaS (Software as a Service - Google Workspace, Microsoft 365). Triển khai theo Public Cloud, Private Cloud hoặc Hybrid Cloud.",
                "Ví dụ: Thay vì doanh nghiệp phải đầu tư hàng trăm triệu mua máy chủ vật lý đặt tại văn phòng và thuê người bảo trì, doanh nghiệp chỉ cần thuê máy chủ ảo trên AWS/GCP để chạy ứng dụng CareerFit trong vài phút và mở rộng linh hoạt khi lượng ứng viên tăng cao.",
                "Kỹ năng không thể thiếu đối với lập trình viên hiện đại, đặc biệt là vị trí Cloud Engineer, DevOps Engineer và Backend Developer.",
                List.of("NIST Special Publication 800-145: The NIST Definition of Cloud Computing", "AWS Architecture Center")
        ));

        // 5. Socket trong Mạng máy tính
        entries.add(new KnowledgeEntry(
                "network_socket",
                List.of("socket", "network socket", "socket mạng", "websocket", "tcp socket"),
                "Socket trong Lập trình và Mạng máy tính",
                "Trong CNTT, Socket là một điểm cuối (endpoint) trong liên kết truyền thông hai chiều giữa hai chương trình đang chạy trên mạng. Một socket được xác định duy nhất bởi sự kết hợp của Địa chỉ IP và Số cổng (Port).",
                "Socket hoạt động ở tầng Transport (TCP cho kết nối tin cậy có bắt tay 3 bước, UDP cho tốc độ nhanh không cần thiết lập phiên) hoặc tầng ứng dụng như WebSocket (cho truyền thông hai chiều thời gian thực giữa Web Browser và Server).",
                "Ví dụ: Tính năng Chatbot thời gian thực hoặc thông báo ứng tuyển trực tiếp trên hệ thống có thể sử dụng WebSocket để máy chủ đẩy tin nhắn mới đến ứng viên ngay lập tức mà ứng viên không cần bấm tải lại trang.",
                "Nền tảng của lập trình mạng, thường được hỏi kỹ ở các vị trí Backend Developer và Systems Engineer.",
                List.of("RFC 793 - Transmission Control Protocol", "MDN Web Docs: WebSockets API")
        ));

        // 6. Luồng / Concurrency (Thread)
        entries.add(new KnowledgeEntry(
                "thread_concurrency",
                List.of("luồng", "thread", "multithreading", "đa luồng", "concurrency"),
                "Luồng (Thread) và Đa luồng trong Lập trình",
                "Trong CNTT, Luồng (Thread) là đơn vị thực thi nhỏ nhất của tiến trình (Process) được bộ điều phối của hệ điều hành lên lịch thực hiện. Nhiều luồng trong cùng một tiến trình có thể chạy đồng thời và chia sẻ chung không gian bộ nhớ (Heap).",
                "Đa luồng (Multithreading) giúp ứng dụng tận dụng tối đa CPU đa nhân, nâng cao khả năng phản hồi của hệ thống. Tuy nhiên, nó đi kèm các thách thức như Race Condition, Deadlock và đòi hỏi cơ chế đồng bộ hóa (Synchronization, Lock, Semaphore, Atomic variables).",
                "Ví dụ: Khi người dùng nhấn nút 'AI Chuẩn hóa CV', backend Spring Boot có thể xử lý tác vụ này trên một luồng nền bất đồng bộ (Asynchronous thread) để tránh chặn luồng xử lý chính nhận request từ người dùng khác.",
                "Trọng tâm kiểm tra kiến thức chuyên sâu trong phỏng vấn Java Core, C++ và Backend Engineering.",
                List.of("Java Concurrency in Practice (Brian Goetz)", "Operating System Concepts (Silberschatz)")
        ));

        // 7. Con trỏ (Pointer)
        entries.add(new KnowledgeEntry(
                "pointer",
                List.of("con trỏ", "pointer", "pointers", "địa chỉ ô nhớ"),
                "Con trỏ (Pointer) trong Khoa học máy tính",
                "Trong lập trình (như C, C++), Con trỏ (Pointer) là một biến đặc biệt dùng để lưu trữ địa chỉ vùng nhớ của một biến khác thay vì lưu trữ giá trị trực tiếp.",
                "Con trỏ cho phép cấp phát bộ nhớ động (Dynamic memory allocation với malloc/new), truyền tham chiếu hiệu quả mà không cần sao chép dữ liệu lớn, và xây dựng các cấu trúc dữ liệu phức tạp như danh sách liên kết, cây và đồ thị. Các ngôn ngữ như Java sử dụng khái niệm 'Reference' (tham chiếu an toàn) thay cho con trỏ trực tiếp để tránh rủi ro rò rỉ bộ nhớ (Memory Leak) và lỗi Segment Fault.",
                "Ví dụ: Trong C, lệnh `int *ptr = &x;` lưu địa chỉ của biến x vào con trỏ ptr, cho phép truy xuất và sửa đổi giá trị của x thông qua phép toán giải tham chiếu `*ptr`.",
                "Khái niệm nền tảng trong môn Lập trình C/C++ và Kiến trúc máy tính.",
                List.of("The C Programming Language (Kernighan & Ritchie)", "CS50: Memory and Pointers")
        ));

        // 8. ACID và Database Indexing
        entries.add(new KnowledgeEntry(
                "database_acid_indexing",
                List.of("acid", "indexing", "chỉ mục", "b-tree index", "transaction", "giao dịch cơ sở dữ liệu"),
                "Giao dịch ACID và Cơ chế Indexing trong Cơ sở dữ liệu",
                "ACID là tập hợp 4 thuộc tính cốt lõi đảm bảo độ tin cậy của giao dịch CSDL: Atomicity (Nguyên tử), Consistency (Nhất quán), Isolation (Cô lập), Durability (Bền vững). Indexing là cấu trúc dữ liệu bổ trợ (thường dùng B-Tree hoặc Hash) giúp tăng tốc độ truy vấn dữ liệu từ O(n) xuống O(log n).",
                "ACID bảo vệ tính toàn vẹn dữ liệu khi có sự cố hệ thống. Indexing giúp tăng tốc câu lệnh SELECT nhưng làm chậm nhẹ các thao tác INSERT, UPDATE, DELETE do phải cập nhật lại cây chỉ mục.",
                "Ví dụ: Khi một ứng viên nộp đơn ứng tuyển, giao dịch gồm (1) Trừ số lượt ứng tuyển còn lại và (2) Thêm bản ghi đơn nộp vào bảng applications. ACID đảm bảo cả hai thao tác đều thành công; nếu một bước lỗi thì toàn bộ thao tác được Rollback về trạng thái cũ.",
                "Câu hỏi bắt buộc trong mọi buổi phỏng vấn Database, SQL và Backend Developer.",
                List.of("Database System Concepts (Silberschatz, Korth)", "PostgreSQL Documentation on Indexes & Transactions")
        ));

        // 9. Lộ trình Java Backend Developer
        entries.add(new KnowledgeEntry(
                "java_backend_roadmap",
                List.of("học java backend", "java backend", "lộ trình java", "trở thành java backend", "java fresher"),
                "Lộ trình học tập và phát triển nghề nghiệp Java Backend Developer",
                "Lộ trình toàn diện dành cho sinh viên IT / Fresher muốn trở thành Java Backend Developer từ con số 0.",
                "Gồm các giai đoạn: (1) Java Core & OOP vững chắc (Collection Framework, Concurrency, Stream API, Exception handling); (2) Cơ sở dữ liệu quan hệ (SQL, MySQL/PostgreSQL, thiết kế CSDL chuẩn hóa); (3) Spring Framework & Spring Boot (Spring Data JPA/Hibernate, Spring Security & JWT, Spring Web RESTful API); (4) Công cụ lập trình (Git/GitHub, Maven/Gradle, Docker cơ bản, Postman); (5) Xây dựng đồ án thực tế hoàn chỉnh và triển khai lên máy chủ.",
                "Ví dụ: Một dự án đồ án chuẩn để đưa vào CV ứng tuyển Java Intern là hệ thống E-commerce hoặc Tuyển dụng việc làm: có xác thực phân quyền JWT, quản lý đơn hàng/hồ sơ, kết nối CSDL PostgreSQL và có tài liệu Swagger API rõ ràng.",
                "Được biên soạn dựa trên tiêu chuẩn tuyển dụng thực tế của các doanh nghiệp đối tác CareerFit.",
                List.of("CareerFit Developer Roadmap 2026", "Spring Boot Official Documentation")
        ));
    }

    @Override
    public SearchResult search(String query, int maxResults) {
        if (query == null || query.isBlank()) {
            return SearchResult.builder()
                    .query("")
                    .level(KnowledgeLevel.LEVEL_3_INSUFFICIENT)
                    .verified(false)
                    .references(List.of())
                    .build();
        }

        String lower = query.toLowerCase(Locale.ROOT).trim();

        // 1. Tìm match chính xác theo canonical name hoặc từ khóa đặc trưng
        for (KnowledgeEntry entry : entries) {
            for (String kw : entry.keywords()) {
                if (lower.contains(kw)) {
                    String snippet = String.format("""
                            %s
                            
                            • Chi tiết kỹ thuật: %s
                            • Ví dụ ứng dụng: %s
                            • Liên hệ nghề nghiệp IT: %s
                            """,
                            entry.summary(),
                            entry.technicalDetails(),
                            entry.practicalExample(),
                            entry.careerRelevance());

                    return SearchResult.builder()
                            .query(query)
                            .level(KnowledgeLevel.LEVEL_1_VERIFIED_KB)
                            .source("CareerFit Verified IT Knowledge Base (Level 1)")
                            .title(entry.title())
                            .snippet(snippet.trim())
                            .verified(true)
                            .references(entry.references())
                            .build();
                }
            }
        }

        return SearchResult.builder()
                .query(query)
                .level(KnowledgeLevel.LEVEL_3_INSUFFICIENT)
                .verified(false)
                .references(List.of())
                .build();
    }
}
