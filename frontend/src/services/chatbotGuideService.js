// ==========================================================================
// CareerFit AI Chatbot Guide Service
// State machine & Conversation Controller for Interactive Multi-step Guidance
// ==========================================================================

export const CHATBOT_MODES = {
  GENERAL: 'GENERAL_CHAT',
  CV_GUIDE: 'CV_GUIDE',
  JOB_POST_GUIDE: 'JOB_POST_GUIDE'
};

// --------------------------------------------------------------------------
// 1. Cấu hình các bước trong Luồng Tạo CV cho Ứng viên (CV_GUIDE)
// --------------------------------------------------------------------------
export const CV_GUIDE_STEPS = [
  {
    step: 1,
    field: 'targetRole',
    title: 'Vị trí ứng tuyển mục tiêu',
    prompt: `🎯 **Bước 1/7: Vị trí bạn muốn ứng tuyển**
Bạn đang hướng tới vị trí IT nào?
*(Ví dụ: Java Backend Intern, Frontend React Fresher, Data Analyst Intern, QA/Tester...)*`,
    quickOptions: ['Java Backend Intern', 'Frontend React Fresher', 'Fullstack Intern', 'QA / Tester Fresher', 'Data Analyst Intern'],
    isRequired: true,
    helpText: 'Chọn hoặc nhập vị trí bạn mong muốn để mình tối ưu từ khóa phù hợp với bộ lọc tuyển dụng.'
  },
  {
    step: 2,
    field: 'contactInfo',
    title: 'Thông tin cá nhân & Liên hệ',
    prompt: `👤 **Bước 2/7: Thông tin cá nhân & Liên hệ**
Vui lòng cho mình biết: **Họ và tên, Email, Số điện thoại, Địa chỉ/Tỉnh thành hiện tại** và Link GitHub/LinkedIn (nếu có).
*(Ví dụ: Nguyễn Văn A - 0987654321 - nguyenvana@gmail.com - Hà Nội - github.com/nguyenvana)*`,
    isRequired: true,
    helpText: 'Thông tin liên hệ rõ ràng giúp nhà tuyển dụng dễ dàng gửi lời mời phỏng vấn.'
  },
  {
    step: 3,
    field: 'education',
    title: 'Trình độ học vấn & Chuyên ngành',
    prompt: `🎓 **Bước 3/7: Học vấn & Chuyên ngành**
Bạn đang học hoặc đã tốt nghiệp trường nào, chuyên ngành gì và dự kiến tốt nghiệp năm nào? *(GPA nếu có, ví dụ > 3.0/4.0)*
*(Ví dụ: Đại học FPT - Chuyên ngành Kỹ thuật phần mềm - Dự kiến tốt nghiệp 2026 - GPA: 3.2/4.0)*`,
    isRequired: true,
    helpText: 'Với sinh viên IT, trường và chuyên ngành là thông tin quan trọng để nhà tuyển dụng xác định lộ trình thực tập.'
  },
  {
    step: 4,
    field: 'skills',
    title: 'Kỹ năng chuyên môn cốt lõi',
    prompt: `💻 **Bước 4/7: Kỹ năng chuyên môn**
Hãy liệt kê các kỹ năng kỹ thuật bạn đã học hoặc từng làm việc:
• **Ngôn ngữ:** Java, JavaScript, Python, C#...
• **Framework:** Spring Boot, React, Node.js, .NET...
• **Database & Tools:** SQL Server, MySQL, Git, Docker, Postman...
*(Ví dụ: Java Core, Spring Boot, MySQL, Git, RESTful API, OOP)*`,
    quickOptions: ['Java, Spring Boot, MySQL, Git', 'ReactJS, JavaScript, TailwindCSS, Git', 'C#, .NET Core, SQL Server, Git', 'HTML/CSS, JS, React, Node.js'],
    isRequired: true,
    helpText: 'Liệt kê các công nghệ bạn tự tin nhất và đã từng áp dụng vào đồ án thực tế.'
  },
  {
    step: 5,
    field: 'projects',
    title: 'Dự án học tập, đồ án hoặc bài tập lớn',
    prompt: `🚀 **Bước 5/7: Đồ án / Dự án cá nhân nổi bật**
Với sinh viên, **đồ án chính là điểm nhấn quan trọng nhất** thay thế kinh nghiệm làm việc!
Hãy nêu 1–2 dự án nổi bật:
• Tên dự án & Mục đích
• Công nghệ sử dụng
• Vai trò & Chức năng chính bạn đã làm
*(Ví dụ: Website Tuyển dụng IT (Nhóm 4 người - Spring Boot, React, SQL Server): Phụ trách thiết kế CSDL, viết 10 RESTful API xác thực JWT và tính năng nộp CV).*`,
    isRequired: true,
    helpText: 'Dự án thực tế chứng minh bạn có khả năng viết code và giải quyết bài toán cụ thể.'
  },
  {
    step: 6,
    field: 'experience',
    title: 'Kinh nghiệm làm việc / Thực tập',
    prompt: `💼 **Bước 6/7: Kinh nghiệm làm việc hoặc thực tập (nếu có)**
Bạn đã từng đi thực tập hoặc làm việc tại công ty, lab nghiên cứu nào chưa?
👉 **Nếu bạn là sinh viên chưa có kinh nghiệm:** Đừng lo lắng! Hãy nhấn nút **[⏭️ Bỏ qua]** bên dưới, các đồ án ở Bước 5 đã hoàn toàn đủ mạnh cho vị trí Intern/Fresher!`,
    isRequired: false,
    canSkip: true,
    helpText: 'Mục này là tùy chọn đối với sinh viên chưa từng đi làm.'
  },
  {
    step: 7,
    field: 'certifications',
    title: 'Chứng chỉ, Hoạt động & Thành tích',
    prompt: `🏆 **Bước 7/7: Chứng chỉ & Hoạt động ngoại khóa (nếu có)**
Bạn có chứng chỉ ngoại ngữ (TOEIC, IELTS), chứng chỉ công nghệ (AWS, Oracle...), cuộc thi Hackathon, hoặc tham gia CLB IT nào không?
👉 Nếu chưa có, bạn có thể nhấn **[⏭️ Bỏ qua]** để mình tổng hợp bản nháp CV hoàn chỉnh ngay lập tức!`,
    isRequired: false,
    canSkip: true,
    helpText: 'Chứng chỉ ngoại ngữ và hoạt động CLB thể hiện kỹ năng mềm và tinh thần chủ động.'
  }
];

// --------------------------------------------------------------------------
// 2. Cấu hình các bước trong Luồng Đăng tin cho Doanh nghiệp (JOB_POST_GUIDE)
// --------------------------------------------------------------------------
export const JOB_POST_GUIDE_STEPS = [
  {
    step: 1,
    field: 'title',
    title: 'Chức danh tuyển dụng',
    prompt: `📝 **Bước 1/10: Chức danh tuyển dụng**
Chức danh công việc bạn cần tuyển là gì?
*(Ví dụ: Lập trình viên Java Intern, ReactJS Frontend Fresher, Thực tập sinh QA/Tester...)*`,
    quickOptions: ['Thực tập sinh Java Backend', 'Fresher Frontend ReactJS', 'Thực tập sinh Lập trình .NET', 'Junior Backend Developer', 'Thực tập sinh QA / QC'],
    isRequired: true,
    helpText: 'Tên vị trí nên rõ ràng, kèm cấp bậc (Intern / Fresher / Junior) để thu hút đúng đối tượng sinh viên.'
  },
  {
    step: 2,
    field: 'category',
    title: 'Lĩnh vực chuyên môn',
    prompt: `🏷️ **Bước 2/10: Lĩnh vực chuyên môn (Category)**
Vị trí này thuộc lĩnh vực nào trong hệ thống CareerFit?`,
    quickOptions: ['Backend Developer', 'Frontend Developer', 'Fullstack Developer', 'Mobile Developer', 'QA/QC Tester', 'Data / AI'],
    isRequired: true,
    helpText: 'Lĩnh vực giúp phân loại vị trí vào danh mục tìm kiếm của ứng viên.'
  },
  {
    step: 3,
    field: 'quantityAndLevel',
    title: 'Số lượng tuyển & Cấp bậc',
    prompt: `👥 **Bước 3/10: Cấp bậc & Số lượng cần tuyển**
Bạn dự kiến tuyển bao nhiêu nhân sự cho vị trí này và yêu cầu cấp bậc gì?
*(Ví dụ: Tuyển 3 Thực tập sinh, hoặc Tuyển 2 Fresher mới tốt nghiệp)*`,
    quickOptions: ['Tuyển 2 Thực tập sinh (Internship)', 'Tuyển 3 Fresher mới tốt nghiệp', 'Tuyển 1 Junior (Dưới 1 năm KN)', 'Tuyển 5 Thực tập sinh'],
    isRequired: true,
    helpText: 'Thông tin số lượng giúp ứng viên biết mức độ cạnh tranh của đợt tuyển.'
  },
  {
    step: 4,
    field: 'jobTypeAndWorkMode',
    title: 'Loại hình & Hình thức làm việc',
    prompt: `⏰ **Bước 4/10: Loại hình & Hình thức làm việc**
Vui lòng chọn loại hình hợp đồng và cách thức làm việc:
• **Loại hình:** Internship / Full-time / Part-time / Contract
• **Hình thức:** On-site / Hybrid (Linh hoạt) / Remote (Từ xa)
*(Ví dụ: Internship (Hybrid) hoặc Full-time (On-site))*`,
    quickOptions: ['Internship (Hybrid)', 'Internship (On-site)', 'Full-time (On-site)', 'Full-time (Hybrid)', 'Part-time (Linh hoạt)'],
    isRequired: true,
    helpText: 'Sinh viên thường rất ưu tiên các công việc có hỗ trợ Hybrid hoặc thời gian linh hoạt.'
  },
  {
    step: 5,
    field: 'location',
    title: 'Địa điểm làm việc',
    prompt: `📍 **Bước 5/10: Địa điểm làm việc**
Văn phòng làm việc của công ty ở khu vực nào?
*(Ví dụ: Quận Cầu Giấy, Hà Nội hoặc TP. Thủ Đức, TP. Hồ Chí Minh)*`,
    quickOptions: ['Hà Nội (Khu vực Cầu Giấy)', 'TP. Hồ Chí Minh (Quận 1)', 'TP. Hồ Chí Minh (TP. Thủ Đức)', 'Đà Nẵng (Hải Châu)', 'Toàn quốc (Remote)'],
    isRequired: true,
    helpText: 'Địa điểm cụ thể giúp ứng viên cân nhắc khoảng cách di chuyển từ trường đại học.'
  },
  {
    step: 6,
    field: 'salary',
    title: 'Mức lương / Trợ cấp',
    prompt: `💰 **Bước 6/10: Mức lương / Phụ cấp thực tập**
Khoảng lương hoặc phụ cấp dự kiến dành cho vị trí này?
*(Ví dụ: 8 - 12 triệu VNĐ, hoặc Hỗ trợ thực tập 4 - 6 triệu VNĐ, hoặc Thỏa thuận theo năng lực)*`,
    quickOptions: ['5.000.000 - 8.000.000 VNĐ', '8.000.000 - 12.000.000 VNĐ', '10.000.000 - 15.000.000 VNĐ', 'Hỗ trợ thực tập 3 - 5 triệu VNĐ', 'Thỏa thuận theo năng lực'],
    isRequired: true,
    helpText: 'Các tin tuyển dụng công khai khoảng lương luôn nhận được lượng hồ sơ cao hơn 40%.'
  },
  {
    step: 7,
    field: 'skills',
    title: 'Kỹ năng bắt buộc & Ưu tiên (Tags)',
    prompt: `🎯 **Bước 7/10: Kỹ năng yêu cầu (Tags)**
Hệ thống CareerFit sẽ sử dụng các thẻ kỹ năng này để **tự động tính điểm Match Score** kết nối với ứng viên phù hợp!
• Kỹ năng bắt buộc (Required Skills): ...
• Kỹ năng ưu tiên (Preferred Skills): ...
*(Ví dụ: Bắt buộc: Java, SQL, Git. Ưu tiên: Spring Boot, Docker, REST API)*`,
    quickOptions: ['Bắt buộc: Java, SQL, Git. Ưu tiên: Spring Boot, Docker', 'Bắt buộc: ReactJS, JavaScript, HTML/CSS. Ưu tiên: Tailwind, TypeScript', 'Bắt buộc: C#, SQL Server, OOP. Ưu tiên: .NET Core, Web API'],
    isRequired: true,
    helpText: 'Chọn các kỹ năng chuẩn để thuật toán so khớp ứng viên hoạt động chính xác nhất.'
  },
  {
    step: 8,
    field: 'responsibilities',
    title: 'Mô tả công việc & Trách nhiệm chính',
    prompt: `📋 **Bước 8/10: Trách nhiệm công việc chính (JD)**
Các nhiệm vụ hàng ngày của bạn ứng viên là gì?
*(Ví dụ:
- Tham gia phát triển các tính năng module theo yêu cầu.
- Lập trình RESTful API và tối ưu hóa truy vấn CSDL.
- Viết Unit Test và phối hợp cùng Tech Lead trong quy trình Scrum).*`,
    isRequired: true,
    helpText: 'Mô tả rõ công việc giúp ứng viên tự đánh giá mức độ phù hợp trước khi nộp đơn.'
  },
  {
    step: 9,
    field: 'benefits',
    title: 'Quyền lợi & Chế độ đãi ngộ',
    prompt: `🎁 **Bước 9/10: Quyền lợi & Môi trường làm việc**
Những đãi ngộ hấp dẫn công ty dành cho ứng viên là gì?
*(Ví dụ:
- Được đào tạo 1-1 bởi Senior Developer giàu kinh nghiệm.
- Cơ hội đánh giá lên nhân viên chính thức sau 3 tháng.
- Hỗ trợ dấu mộc thực tập và báo cáo tốt nghiệp.
- Môi trường trẻ trung, trà chiều, teambuilding hàng quý).*`,
    isRequired: true,
    helpText: 'Cơ hội học hỏi và lộ trình lên chính thức là yếu tố số 1 thu hút sinh viên IT.'
  },
  {
    step: 10,
    field: 'deadline',
    title: 'Hạn chót nộp hồ sơ',
    prompt: `📅 **Bước 10/10: Hạn chót nhận hồ sơ**
Thời hạn cuối cùng để ứng viên gửi hồ sơ ứng tuyển là khi nào?
*(Ví dụ: 30/11/2026 hoặc 15/12/2026)*`,
    quickOptions: ['30/11/2026', '15/12/2026', '31/12/2026'],
    isRequired: true,
    helpText: 'Hạn nộp hồ sơ rõ ràng giúp doanh nghiệp chủ động sắp xếp các vòng phỏng vấn.'
  }
];

// --------------------------------------------------------------------------
// 3. Xử lý khởi tạo và điều hướng State Machine
// --------------------------------------------------------------------------

export function createInitialSession(role) {
  return {
    sessionId: `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    role: role || 'CANDIDATE',
    mode: CHATBOT_MODES.GENERAL,
    stepIndex: 0,
    collectedData: {},
    isComplete: false
  };
}

/**
 * Kiểm tra xem người dùng có kích hoạt luồng Hướng dẫn không (nhận diện tự nhiên)
 */
export function detectIntent(text, role) {
  if (!text) return null;
  const lower = text.toLowerCase().trim();

  // 1. Ý định tạo CV (Ứng viên)
  if (role === 'CANDIDATE') {
    if (
      lower.includes('tạo cv') ||
      lower.includes('làm cv') ||
      lower.includes('viết cv') ||
      lower.includes('chưa biết viết cv') ||
      lower.includes('chưa có hồ sơ') ||
      lower.includes('không biết viết cv') ||
      lower.includes('hồ sơ ứng tuyển') ||
      lower.includes('hướng dẫn cv') ||
      lower.includes('giúp tôi làm cv') ||
      lower.includes('tôi muốn tạo cv') ||
      lower.includes('tạo cv giúp mình')
    ) {
      return CHATBOT_MODES.CV_GUIDE;
    }
  }

  // 2. Ý định đăng tin tuyển dụng (Doanh nghiệp)
  if (role === 'EMPLOYER') {
    if (
      lower.includes('đăng tin') ||
      lower.includes('đăng tuyển') ||
      lower.includes('tạo tin') ||
      lower.includes('tạo jd') ||
      lower.includes('hướng dẫn tạo jd') ||
      lower.includes('tôi muốn đăng tin') ||
      lower.includes('tôi muốn đăng tuyển') ||
      lower.includes('viết tin tuyển dụng') ||
      lower.includes('tuyển thực tập sinh') ||
      lower.includes('đang cần java') ||
      lower.includes('đang cần tuyển') ||
      lower.includes('cần tuyển')
    ) {
      return CHATBOT_MODES.JOB_POST_GUIDE;
    }
  }

  return null;
}

/**
 * Tạo bản nháp CV tổng hợp cho Ứng viên (Markdown format trực quan)
 */
export function generateCvPreview(data) {
  return `📄 **BẢN NHÁP HỒ SƠ CV CỦA BẠN (XEM TRƯỚC)**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**HỌ VÀ TÊN:** ${data.contactInfo || 'Nguyễn Văn A'}
**VỊ TRÍ ỨNG TUYỂN:** ${data.targetRole || 'Lập trình viên IT'}

📌 **MỤC TIÊU NGHỀ NGHIỆP:**
Sinh viên nhiệt huyết, mong muốn ứng dụng kiến thức nền tảng vững chắc và tinh thần học hỏi nhanh để đóng góp vào các dự án thực tế của công ty ở vị trí **${data.targetRole || 'IT'}**, đồng thời phát triển chuyên sâu kỹ năng lập trình chuyên nghiệp.

🎓 **HỌC VẤN:**
• ${data.education || 'Đại học FPT - Chuyên ngành CNTT'}

💻 **KỸ NĂNG CHUYÊN MÔN:**
• ${data.skills || 'Java, Spring Boot, MySQL, Git'}

🚀 **DỰ ÁN TIÊU BIỂU:**
• ${data.projects || 'Dự án website quản lý - Xây dựng RESTful API và cơ sở dữ liệu'}

💼 **KINH NGHIỆM LÀM VIỆC:**
• ${data.experience || 'Chưa có kinh nghiệm chính thức (Tập trung phát triển đồ án thực hành & kỹ năng chuyên môn)'}

🏆 **CHỨNG CHỈ & HOẠT ĐỘNG:**
• ${data.certifications || 'Tham gia các hoạt động công nghệ và đồ án môn học'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ **Bạn có muốn chỉnh sửa mục nào không?**
Bạn có thể bấm **[📋 Sao chép CV]** hoặc bấm **[🚀 Đi tới trang Hồ sơ & CV]** để cập nhật hồ sơ và tải file CV của bạn lên hệ thống CareerFit nhé!`;
}

/**
 * Tạo bản nháp Tin tuyển dụng cho Doanh nghiệp (Job Draft Preview)
 */
export function generateJobDraftPreview(data) {
  return `📋 **BẢN NHÁP TIN TUYỂN DỤNG (XEM TRƯỚC)**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 **VỊ TRÍ:** ${data.title || 'Lập trình viên IT'}
• **Lĩnh vực:** ${data.category || 'Backend Developer'}
• **Cấp bậc & Số lượng:** ${data.quantityAndLevel || 'Tuyển 2 Thực tập sinh'}
• **Hình thức làm việc:** ${data.jobTypeAndWorkMode || 'Internship (On-site)'}
• **Địa điểm:** ${data.location || 'Hà Nội / TP.HCM'}
• **Mức lương:** ${data.salary || 'Thỏa thuận theo năng lực'}
• **Hạn nộp hồ sơ:** ${data.deadline || '30/11/2026'}

🎯 **KỸ NĂNG YÊU CẦU (MATCH SCORE TAGS):**
${data.skills || 'Java, SQL, Git, Spring Boot'}

📝 **MÔ TẢ CÔNG VIỆC:**
${data.responsibilities || '- Tham gia phát triển tính năng theo yêu cầu dự án.\n- Lập trình API và tối ưu hóa hệ thống.'}

🎁 **QUYỀN LỢI ĐÃI NGỘ:**
${data.benefits || '- Phụ cấp thực tập hấp dẫn.\n- Đào tạo chuyên môn 1-1.\n- Cơ hội lên nhân viên chính thức.'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ **Bản nháp tin tuyển dụng đã sẵn sàng!**
Bạn có thể bấm **[📋 Sao chép bản nháp]** hoặc bấm **[🚀 Đi tới trang Đăng tin]** để mở form đăng tin tuyển dụng chính thức trên CareerFit!`;
}
