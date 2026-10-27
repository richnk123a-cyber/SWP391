// ==========================================================================
// CareerFit AI Chatbot Initial Messages & Suggestion Chips
// Strictly role-based for Candidates & Employers (Không dùng icon emoji)
// ==========================================================================

// Khi mở chatbot, chỉ hiển thị đúng MỘT lời chào hiện tại
export const CANDIDATE_INITIAL_MESSAGES = [
  {
    id: 'msg-welcome-candidate',
    sender: 'bot',
    time: '10:24',
    content: `Chào bạn!
Mình là CareerFit AI, trợ lý đồng hành sự nghiệp của bạn. Mình có thể hỗ trợ bạn về việc làm, CV, phỏng vấn, kỹ năng nghề nghiệp và hướng dẫn sử dụng CareerFit.

Bạn cần mình giúp gì hôm nay?`
  }
];

export const EMPLOYER_INITIAL_MESSAGES = [
  {
    id: 'msg-welcome-employer',
    sender: 'bot',
    time: '09:00',
    content: `Chào Quý doanh nghiệp!
Mình là CareerFit AI, trợ lý hỗ trợ tuyển dụng. Mình có thể giúp gì cho quy trình tuyển dụng và tìm kiếm nhân tài của công ty hôm nay?`
  }
];

// Nút gợi ý theo vai trò chuẩn xác theo Master Prompt (văn bản chữ thuần túy)
export const CANDIDATE_SUGGESTION_CHIPS = [
  {
    id: 'suggest-create-cv',
    label: 'Tôi muốn tạo CV',
    prompt: 'Tôi muốn tạo CV'
  },
  {
    id: 'suggest-analyze-cv',
    label: 'Phân tích CV của tôi',
    prompt: 'Phân tích CV của tôi'
  },
  {
    id: 'suggest-find-job',
    label: 'Tìm việc phù hợp',
    prompt: 'Tìm việc phù hợp'
  },
  {
    id: 'suggest-no-exp',
    label: 'Tôi chưa có kinh nghiệm',
    prompt: 'Tôi chưa có kinh nghiệm'
  },
  {
    id: 'suggest-interview',
    label: 'Hướng dẫn phỏng vấn',
    prompt: 'Hướng dẫn phỏng vấn'
  },
  {
    id: 'suggest-career-roadmap',
    label: 'Gợi ý lộ trình nghề nghiệp',
    prompt: 'Gợi ý lộ trình nghề nghiệp'
  }
];

export const EMPLOYER_SUGGESTION_CHIPS = [
  {
    id: 'suggest-post-job',
    label: 'Tôi muốn đăng tin tuyển dụng',
    prompt: 'Tôi muốn đăng tin tuyển dụng'
  },
  {
    id: 'suggest-improve-job',
    label: 'Cải thiện tin tuyển dụng hiện tại',
    prompt: 'Cải thiện tin tuyển dụng hiện tại'
  },
  {
    id: 'suggest-write-jd',
    label: 'Viết mô tả công việc',
    prompt: 'Viết mô tả công việc'
  },
  {
    id: 'suggest-manage-applicants',
    label: 'Hướng dẫn quản lý ứng viên',
    prompt: 'Hướng dẫn quản lý ứng viên'
  },
  {
    id: 'suggest-find-candidates',
    label: 'Tôi muốn tìm ứng viên phù hợp',
    prompt: 'Tôi muốn tìm ứng viên phù hợp'
  },
  {
    id: 'suggest-check-job-info',
    label: 'Kiểm tra thông tin còn thiếu trong tin tuyển dụng',
    prompt: 'Kiểm tra thông tin còn thiếu trong tin tuyển dụng'
  }
];

// Dữ liệu phản hồi Mock có kiểm soát cho các câu hỏi thường gặp
export const GENERAL_MOCK_RESPONSES = {
  // Ứng viên
  find_job: `HƯỚNG DẪN TÌM VIỆC LÀM IT PHÙ HỢP TRÊN CAREERFIT:
1. Dựa trên Match Score: Hệ thống tự động so sánh các thẻ Kỹ năng trong hồ sơ của bạn với yêu cầu tin tuyển dụng để xếp hạng độ phù hợp (%).
2. Sử dụng bộ lọc thông minh: Bạn có thể lọc việc làm theo:
   - Cấp bậc: Thực tập sinh (Internship), Fresher, Junior
   - Hình thức: On-site, Hybrid (linh hoạt), Remote (từ xa)
   - Khu vực: Hà Nội, TP.HCM, Đà Nẵng
3. Phân tích CV chuyên sâu bằng AI: Khi mở một tin tuyển dụng cụ thể, hãy bấm nút "Phân tích CV chuyên sâu" để xem chi tiết kỹ năng bạn còn thiếu và lộ trình bổ sung.
Bạn có thể vào mục "Khám phá việc làm" trên menu điều hướng bên trái để bắt đầu.`,

  no_experience: `LỜI KHUYÊN CHO SINH VIÊN CHƯA CÓ KINH NGHIỆM ĐI LÀM:
Đừng quá lo lắng. Hầu hết các nhà tuyển dụng khi tuyển vị trí Intern / Fresher đều không đòi hỏi kinh nghiệm làm việc thực tế, mà họ tìm kiếm 4 yếu tố:
1. Đồ án môn học & Dự án cá nhân: Đây là bằng chứng quan trọng nhất. Hãy mô tả rõ các bài tập lớn, đồ án tốt nghiệp, công nghệ đã dùng và đính kèm link GitHub.
2. Kiến thức nền tảng vững vàng: Nắm chắc Lập trình hướng đối tượng (OOP), Cấu trúc dữ liệu & Giải thuật, và truy vấn SQL cơ bản.
3. Thái độ cầu tiến & Ham học hỏi: Thể hiện tinh thần trách nhiệm, chủ động tìm tòi giải quyết vấn đề khi gặp lỗi.
4. Kỹ năng mềm: Khả năng giao tiếp, làm việc nhóm và đọc hiểu tài liệu tiếng Anh.

Bạn có thể nhấn nút "Tôi muốn tạo CV" để bắt đầu hoàn thiện một bản CV đồ án chuẩn ATS.`,

  interview_practice: `MẸO PHỎNG VẤN IT VÀ PHƯƠNG PHÁP TRẢ LỜI STAR:
1. Chuẩn bị trước buổi phỏng vấn:
   - Xem lại toàn bộ mã nguồn các đồ án bạn đã đưa vào CV.
   - Nắm chắc kiến thức cốt lõi: OOP, cơ chế framework (Spring Boot / React lifecycle), tối ưu câu lệnh SQL.
2. Phương pháp STAR khi trả lời câu hỏi dự án:
   - S (Situation): Bối cảnh đồ án hoặc bài toán đặt ra.
   - T (Task): Nhiệm vụ cụ thể của bạn trong nhóm.
   - A (Action): Bạn đã áp dụng công nghệ gì và giải quyết ra sao.
   - R (Result): Kết quả đạt được (hệ thống chạy ổn định, điểm số cao, bài học rút ra).
3. Phỏng vấn trực tuyến (Google Meet):
   - Kiểm tra camera, mic và đường truyền mạng trước 10 phút.
   - Chuẩn bị sẵn một vài câu hỏi để hỏi lại nhà tuyển dụng về văn hóa nhóm và cơ hội được đào tạo.`,

  // Doanh nghiệp
  write_jd: `BÍ QUYẾT VIẾT MÔ TẢ CÔNG VIỆC (JD) THU HÚT SINH VIÊN IT:
1. Tiêu đề rõ ràng: Ghi rõ cấp bậc (Ví dụ: Thực tập sinh Java Backend, Fresher ReactJS...) thay vì chung chung.
2. Trách nhiệm thực tế: Nêu 3–5 nhiệm vụ chính mà bạn thực tập sẽ tham gia, tránh dùng từ ngữ đao to búa lớn.
3. Yêu cầu phù hợp cấp bậc:
   - Tránh yêu cầu 1–2 năm kinh nghiệm cho vị trí Intern/Fresher.
   - Tập trung vào tư duy lập trình, kỹ năng nền tảng (OOP, Git, SQL) và tinh thần học hỏi.
4. Quyền lợi nổi bật:
   - Nhấn mạnh việc có Mentor hướng dẫn 1-1.
   - Hỗ trợ dấu mộc thực tập / báo cáo tốt nghiệp.
   - Mức phụ cấp minh bạch và cơ hội lên nhân viên chính thức sau kỳ thực tập.

Bạn có thể nhấn nút "Tôi muốn đăng tin" để bắt đầu soạn thảo tin tuyển dụng chuẩn từng bước.`,

  find_candidates: `HƯỚNG DẪN TÌM KIẾM ỨNG VIÊN PHÙ HỢP TRÊN CAREERFIT:
1. Xem danh sách ứng tuyển: Truy cập mục "Ứng viên" hoặc "Tin tuyển dụng" để xem hồ sơ đã nộp vào từng vị trí.
2. Hệ thống Match Score: CareerFit tự động tính điểm phù hợp giữa kỹ năng ứng viên và yêu cầu tin đăng giúp bạn ưu tiên duyệt các hồ sơ tiềm năng nhất.
3. Đọc hồ sơ & Tải CV: Bạn có thể xem trực tiếp thông tin trường, chuyên ngành, GPA và tải file CV định dạng PDF/DOCX gốc của ứng viên về máy tính.`,

  manage_applications: `QUẢN LÝ QUY TRÌNH ỨNG TUYỂN (KANBAN PIPELINE):
1. Bảng Kanban trực quan: Hồ sơ ứng viên được phân loại qua 5 cột trạng thái:
   Đã nộp -> Đang duyệt -> Phỏng vấn -> Trúng tuyển hoặc Từ chối.
2. Lên lịch phỏng vấn Google Meet:
   - Khi chuyển trạng thái ứng viên sang "Phỏng vấn", hệ thống sẽ mở form để bạn nhập ngày giờ, ghi chú và đường link phòng họp Google Meet.
   - Hệ thống tự động gửi thông báo nội bộ đến ứng viên kèm đường link phỏng vấn.`
};
