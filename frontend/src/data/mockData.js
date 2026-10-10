/**
 * Database Seed Records & Database Connection Config for CareerFit
 */

export const DB_CONFIG = {
  driver: 'PostgreSQL / SQL',
  host: 'localhost',
  port: 5432,
  database: 'careerfit_db',
  username: 'tien',
  password: '123456',
  connectionString: 'postgresql://tien:123456@localhost:5432/careerfit_db'
};

export const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    recipientEmail: 'candidate@gmail.com',
    recipientId: 'user-cand-1',
    type: 'APPLICATION_STATUS_CHANGED',
    title: 'Nhà tuyển dụng đã cập nhật hồ sơ',
    message: 'FPT Software đã tiếp nhận hồ sơ ứng tuyển vị trí Fresher Java Backend Developer của bạn.',
    time: '10 phút trước',
    unread: true,
    page: 'application-kanban'
  },
  {
    id: 'notif-2',
    recipientEmail: 'employer@gmail.com',
    recipientId: 'user-emp-1',
    type: 'NEW_APPLICATION',
    title: 'Ứng viên mới ứng tuyển',
    message: 'Nguyễn Văn A đã nộp CV cho vị trí Java Backend Intern / Fresher.',
    time: '5 phút trước',
    unread: true,
    page: 'applicant-management'
  },
  {
    id: 'notif-3',
    recipientEmail: 'trongtien6571@gmail.com',
    recipientId: 'user-admin-1',
    type: 'SYSTEM_AUDIT',
    title: 'Hệ thống CareerFit sẵn sàng',
    message: 'Chào mừng Admin Trọng Tiến! Đã mở cổng kiểm duyệt tin và xác minh doanh nghiệp.',
    time: '15 phút trước',
    unread: false,
    page: 'admin-dashboard'
  }
];

export const INITIAL_USERS_DB = [
  {
    id: 'user-admin-1',
    email: 'trongtien6571@gmail.com',
    username: 'trongtien_admin',
    fullName: 'Trọng Tiến (Admin)',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: '2026-09-01'
  },
  {
    id: 'user-emp-1',
    email: 'employer@gmail.com',
    username: 'employer',
    passwordHash: '123456',
    role: 'EMPLOYER',
    status: 'ACTIVE',
    createdAt: '2026-09-01'
  },
  {
    id: 'user-emp-2',
    email: 'employer.pending@gmail.com',
    username: 'employer_pending',
    passwordHash: '123456',
    role: 'EMPLOYER',
    status: 'ACTIVE',
    createdAt: '2026-09-14'
  },
  {
    id: 'user-cand-1',
    email: 'candidate@gmail.com',
    username: 'candidate',
    passwordHash: '123456',
    role: 'CANDIDATE',
    status: 'ACTIVE',
    createdAt: '2026-09-01'
  },
  {
    id: 'user-cand-2',
    email: 'tien@gmail.com',
    username: 'tien',
    passwordHash: '123456',
    role: 'CANDIDATE',
    status: 'ACTIVE',
    createdAt: '2026-09-15'
  }
];

export const INITIAL_CANDIDATE = {
  id: 'cand-1',
  userId: 'user-cand-1',
  name: 'Nguyễn Văn A',
  avatarUrl: null,
  email: 'candidate@gmail.com',
  phone: '0987 654 321',
  location: 'Thành phố Hồ Chí Minh',
  university: 'Đại học FPT Đà Nẵng',
  major: 'Khoa học Máy tính',
  graduationYear: '2025',
  skills: ['Java', 'SQL', 'Git', 'OOP', 'JavaScript', 'HTML/CSS'],
  hasCV: true,
  cvFileName: 'Nguyen_Van_A_CV_2026.pdf',
  cvUploadDate: '10/09/2026',
  preferences: {
    desiredRole: 'Java Backend Developer',
    location: 'TP.HCM / Đà Nẵng',
    jobType: 'Internship / Full-time',
    expectedSalary: '8.000.000 - 12.000.000 VNĐ'
  }
};

export const INITIAL_COMPANIES = [
  {
    id: 'company-1',
    ownerUserId: 'user-emp-1',
    companyName: 'FPT Software',
    recruiterName: 'Trần Thị B (HR)',
    representative: 'Trần Thị B',
    taxId: '0312345678',
    email: 'employer@gmail.com',
    website: 'https://fpt-software.com',
    industry: 'Phần mềm & IT Outsourcing',
    size: '1000+ nhân viên',
    location: 'Quận 9, TP.HCM',
    verificationStatus: 'Verified',
    businessLicenseDoc: 'GiayPhepKinhDoanh_FPT_2026.pdf',
    rejectionReason: ''
  },
  {
    id: 'company-2',
    ownerUserId: 'user-emp-2',
    companyName: 'Fintech StartUp Asia (Pending)',
    recruiterName: 'Hoàng Đức D (HR)',
    representative: 'Hoàng Đức D',
    taxId: '0388990011',
    email: 'employer.pending@gmail.com',
    website: 'https://fintechasia.io',
    industry: 'Công nghệ Tài chính',
    size: '50-100 nhân viên',
    location: 'Quận 1, TP.HCM',
    verificationStatus: 'Pending',
    businessLicenseDoc: 'GPKD_FintechAsia_2026.pdf',
    rejectionReason: ''
  }
];

export const INITIAL_SKILLS_CATALOG = [
  { id: 'sk-1', name: 'Java', category: 'Backend' },
  { id: 'sk-2', name: 'Spring Boot', category: 'Backend' },
  { id: 'sk-3', name: 'SQL', category: 'Database' },
  { id: 'sk-4', name: 'Git', category: 'Tools' },
  { id: 'sk-5', name: 'OOP', category: 'Fundamentals' },
  { id: 'sk-6', name: 'JavaScript', category: 'Frontend' },
  { id: 'sk-7', name: 'React', category: 'Frontend' },
  { id: 'sk-8', name: 'TypeScript', category: 'Frontend' },
  { id: 'sk-9', name: 'HTML/CSS', category: 'Frontend' },
  { id: 'sk-10', name: 'C#', category: 'Backend' },
  { id: 'sk-11', name: '.NET', category: 'Backend' },
  { id: 'sk-12', name: 'Docker', category: 'DevOps' },
  { id: 'sk-13', name: 'Linux', category: 'DevOps' },
  { id: 'sk-14', name: 'CI/CD', category: 'DevOps' },
  { id: 'sk-15', name: 'Selenium', category: 'Testing' },
  { id: 'sk-16', name: 'REST API', category: 'Backend' }
];

export const INITIAL_JOBS = [
  {
    id: 'job-1',
    title: 'QA / Automation Tester Intern',
    company: 'Software Excellence Ltd.',
    employerId: 'emp-3',
    isVerified: true,
    verifiedStatus: 'Verified',
    moderationStatus: 'APPROVED',
    rejectionReason: '',
    location: 'Cầu Giấy, Hà Nội (Hybrid)',
    jobType: 'Internship',
    category: 'QA / Testing',
    salary: '6.000.000 - 9.000.000 VNĐ',
    postedDate: '2 ngày trước',
    description: 'Tham gia xây dựng kịch bản kiểm thử tự động cho dự án Fintech. Được đào tạo viết test script tự động bằng Java và Selenium.',
    responsibilities: [
      'Viết test case, thực hiện manual test và log bug trên Jira.',
      'Hỗ trợ triển khai các kịch bản test tự động đơn giản.',
      'Kiểm thử API với Postman và JUnit 5.'
    ],
    requirements: [
      'Sinh viên IT năm cuối hoặc mới tốt nghiệp.',
      'Tư duy logic tốt, cẩn thận và tỉ mỉ.',
      'Nắm vững căn bản về Java/OOP và truy vấn dữ liệu SQL.'
    ],
    requiredSkills: ['SQL', 'Java', 'Git', 'Selenium'],
    preferredSkills: ['Postman', 'Jira'],
    deadline: '15/04/2026'
  },
  {
    id: 'job-2',
    title: 'Java Backend Intern / Fresher',
    company: 'FPT Software',
    employerId: 'user-emp-1',
    isVerified: true,
    verifiedStatus: 'Verified',
    moderationStatus: 'APPROVED',
    rejectionReason: '',
    location: 'Quận 9, TP.HCM (On-site)',
    jobType: 'Internship',
    category: 'Backend Developer',
    salary: '7.000.000 - 10.000.000 VNĐ',
    postedDate: '1 ngày trước',
    description: 'Tham gia phát triển hệ thống microservices Spring Boot cho khách hàng ngân hàng quốc tế. Được dẫn dắt trực tiếp bởi Senior Tech Lead.',
    responsibilities: [
      'Lập trình các mô-đun Spring Boot RESTful Web Services.',
      'Viết SQL queries, tối ưu hóa cơ sở dữ liệu MySQL và PostgreSQL.',
      'Viết Unit Test và làm việc theo mô hình Agile/Scrum.'
    ],
    requirements: [
      'Sinh viên năm cuối hoặc mới tốt nghiệp chuyên ngành CNTT.',
      'Nắm vững kiến thức Lập trình hướng đối tượng (OOP), Cấu trúc dữ liệu & Giải thuật.',
      'Hiểu biết cơ bản về Java Core và cơ sở dữ liệu quan hệ SQL.'
    ],
    requiredSkills: ['Java', 'SQL', 'Git', 'Spring Boot'],
    preferredSkills: ['Docker', 'Microservices'],
    deadline: '30/04/2026'
  },
  {
    id: 'job-3',
    title: 'Frontend React Developer (Fresher)',
    company: 'Emikaro IT Solutions',
    employerId: 'emp-2',
    isVerified: true,
    verifiedStatus: 'Verified',
    moderationStatus: 'APPROVED',
    rejectionReason: '',
    location: 'Quận 7, TP.HCM',
    jobType: 'Full-time',
    category: 'Frontend Developer',
    salary: '9.000.000 - 13.000.000 VNĐ',
    postedDate: 'Hôm nay',
    description: 'Phát triển giao diện web mượt mà, phản hồi nhanh cho hàng triệu người dùng ứng dụng giải trí số.',
    responsibilities: [
      'Xây dựng các component ReactJS tái sử dụng theo thiết kế Figma.',
      'Tối ưu hóa hiệu năng render trang web và trải nghiệm UI/UX.',
      'Tích hợp RESTful API với bộ phận Backend.'
    ],
    requirements: [
      'Thành thạo JavaScript (ES6+), HTML5, CSS3.',
      'Cơ bản về React (Hooks, Context, JSX).',
      'Sử dụng tốt Git cho quản lý mã nguồn.'
    ],
    requiredSkills: ['JavaScript', 'React', 'HTML/CSS', 'Git'],
    preferredSkills: ['TailwindCSS', 'TypeScript'],
    deadline: '05/05/2026'
  },
  {
    id: 'job-4',
    title: 'C# / .NET Developer Fresher',
    company: 'TechSolutions Vietnam',
    employerId: 'emp-4',
    isVerified: true,
    verifiedStatus: 'Verified',
    moderationStatus: 'APPROVED',
    rejectionReason: '',
    location: 'Hải Châu, Đà Nẵng',
    jobType: 'Full-time',
    category: 'Backend Developer',
    salary: '9.000.000 - 13.000.000 VNĐ',
    postedDate: '1 tuần trước',
    description: 'Phát triển các ứng dụng quản lý doanh nghiệp ERP trên nền tảng .NET Core và Microsoft SQL Server.',
    responsibilities: [
      'Lập trình Web API sử dụng ASP.NET Core.',
      'Viết Stored Procedures và tối ưu hóa database SQL Server.'
    ],
    requirements: [
      'Đã làm đồ án hoặc bài tập lớn sử dụng C# .NET.',
      'Nắm vững lập trình Hướng đối tượng OOP.'
    ],
    requiredSkills: ['C#', '.NET', 'SQL', 'Git', 'OOP'],
    preferredSkills: ['Entity Framework', 'Azure'],
    deadline: '25/04/2026'
  },
  {
    id: 'job-pending-1',
    title: 'Golang / Microservices Backend Intern (Chờ kiểm duyệt)',
    company: 'FPT Software',
    employerId: 'user-emp-1',
    isVerified: true,
    verifiedStatus: 'Verified',
    moderationStatus: 'PENDING',
    rejectionReason: '',
    location: 'Cầu Giấy, Hà Nội',
    jobType: 'Internship',
    category: 'Backend Developer',
    salary: '8.000.000 - 11.000.000 VNĐ',
    postedDate: 'Hôm nay',
    description: 'Tham gia xây dựng hệ thống xử lý giao dịch cao tải bằng Golang và gRPC.',
    responsibilities: [
      'Viết API Golang mượt mà và tối ưu hóa bộ nhớ.',
      'Tích hợp RabbitMQ và Redis Caching.'
    ],
    requirements: [
      'Đã có nền tảng C/C++ hoặc Java, muốn theo đuổi Golang.',
      'Hiểu về Concurrency & Goroutines.'
    ],
    requiredSkills: ['Java', 'Git', 'SQL', 'REST API'],
    preferredSkills: ['Docker', 'Linux'],
    deadline: '20/05/2026'
  },
  {
    id: 'job-5',
    title: 'Senior Java / Microservices Solution Architect',
    company: 'FPT Software',
    employerId: 'user-emp-1',
    isVerified: true,
    verifiedStatus: 'Verified',
    moderationStatus: 'APPROVED',
    rejectionReason: '',
    location: 'Quận 9, TP.HCM',
    jobType: 'Full-time',
    category: 'Backend Developer',
    salary: '35.000.000 - 50.000.000 VNĐ',
    postedDate: 'Hôm nay',
    description: 'Chịu trách nhiệm thiết kế kiến trúc Microservices cao tải cho tập đoàn tài chính đa quốc gia. Lương offer hấp dẫn lên tới 50 triệu.',
    responsibilities: [
      'Thiết kế kiến trúc hệ thống Microservices, Kafka, Redis, Spring Cloud.',
      'Dẫn dắt đội ngũ 15+ lập trình viên Backend.'
    ],
    requirements: [
      '5+ năm kinh nghiệm Java / Spring Boot / Distributed Systems.',
      'Thành thạo Docker, Kubernetes, CI/CD, Cloud Architecture.'
    ],
    requiredSkills: ['Java', 'Spring Boot', 'Docker', 'SQL', 'Git'],
    preferredSkills: ['Kafka', 'Kubernetes', 'Redis'],
    deadline: '30/05/2026'
  },
  {
    id: 'job-6',
    title: 'AI / Data Engineer Lead',
    company: 'Fintech StartUp Asia',
    employerId: 'user-emp-2',
    isVerified: true,
    verifiedStatus: 'Verified',
    moderationStatus: 'APPROVED',
    rejectionReason: '',
    location: 'Quận 1, TP.HCM',
    jobType: 'Full-time',
    category: 'Data Analyst',
    salary: '25.000.000 - 38.000.000 VNĐ',
    postedDate: 'Hôm nay',
    description: 'Phát triển mô hình AI Matching và xử lý dữ liệu lớn cho các thuật toán gợi ý việc làm tự động.',
    responsibilities: [
      'Xây dựng pipeline dữ liệu BigData bằng Python, Spark và SQL.',
      'Tích hợp các mô hình Machine Learning vào sản phẩm thực tế.'
    ],
    requirements: [
      '3+ năm kinh nghiệm Data Engineering / AI System.',
      'Thành thạo Python, SQL, REST API, Git.'
    ],
    requiredSkills: ['Python', 'SQL', 'REST API', 'Git'],
    preferredSkills: ['Spark', 'TensorFlow', 'Docker'],
    deadline: '28/05/2026'
  }
];

export const INITIAL_APPLICATIONS = [
  {
    id: 'app-1',
    jobId: 'job-2',
    candidateId: 'cand-1',
    candidateName: 'Nguyễn Văn A',
    candidateEmail: 'candidate@gmail.com',
    candidateUniversity: 'Đại học FPT',
    candidateSkills: ['Java', 'Spring Boot', 'SQL', 'Git', 'OOP'],
    appliedDate: '12/09/2026',
    lastUpdate: '14/09/2026',
    status: 'Phỏng vấn',
    interviewDetails: {
      date: 'Thứ Năm, 27/03/2026',
      time: '14:00 - 15:00',
      meetingLink: 'https://meet.google.com/fpt-java-interview-2026',
      type: 'Online (Google Meet)',
      note: 'Vui lòng chuẩn bị bài test thuật toán Java 30 phút và chia sẻ màn hình làm đồ án tốt nghiệp.'
    }
  },
  {
    id: 'app-2',
    jobId: 'job-2',
    candidateId: 'cand-2',
    candidateName: 'Trần Minh Khang',
    candidateEmail: 'khang.tran@gmail.com',
    candidateUniversity: 'ĐH Bách Khoa TP.HCM',
    candidateSkills: ['Java', 'Spring Boot', 'MySQL', 'Docker', 'REST API'],
    appliedDate: '10/09/2026',
    lastUpdate: '15/09/2026',
    status: 'Offer',
    offerDetails: {
      salary: '11.500.000 VNĐ/tháng',
      startDate: '01/10/2026',
      note: 'Thư mời nhận việc chính thức vị trí Junior Java Developer tại FPT Software.'
    }
  },
  {
    id: 'app-3',
    jobId: 'job-2',
    candidateId: 'cand-3',
    candidateName: 'Lê Hoàng Nam',
    candidateEmail: 'nam.le@gmail.com',
    candidateUniversity: 'ĐH Quốc Gia TP.HCM',
    candidateSkills: ['Java', 'SQL', 'JavaScript', 'Git'],
    appliedDate: '13/09/2026',
    lastUpdate: '14/09/2026',
    status: 'Đã xem'
  },
  {
    id: 'app-4',
    jobId: 'job-2',
    candidateId: 'cand-4',
    candidateName: 'Phạm Gia Huy',
    candidateEmail: 'huy.pham@gmail.com',
    candidateUniversity: 'ĐH Sư Phạm Kỹ Thuật',
    candidateSkills: ['Java', 'Spring Boot', 'PostgreSQL', 'Git'],
    appliedDate: '14/09/2026',
    lastUpdate: '14/09/2026',
    status: 'Đã nộp'
  },
  {
    id: 'app-5',
    jobId: 'job-2',
    candidateId: 'cand-5',
    candidateName: 'Đỗ Thu Trang',
    candidateEmail: 'trang.do@gmail.com',
    candidateUniversity: 'ĐH Công Nghệ Hà Nội',
    candidateSkills: ['Java', 'HTML/CSS', 'SQL'],
    appliedDate: '08/09/2026',
    lastUpdate: '11/09/2026',
    status: 'Offer'
  }
];

export const INITIAL_ROADMAPS = [
  {
    id: 'rd-1',
    skill: 'Spring Boot',
    targetRole: 'Java Backend Developer',
    description: 'Lộ trình học Spring Boot chuẩn hóa do Admin quản lý giúp sinh viên hoàn thiện kỹ năng Backend còn thiếu.',
    topics: [
      {
        id: 'tp-1',
        title: '1. Java Core & Collections Framework',
        completed: true,
        estimatedTime: '5 giờ',
        resource: 'Baeldung - Java Core',
        url: 'https://www.baeldung.com/'
      },
      {
        id: 'tp-2',
        title: '2. OOP & Design Patterns',
        completed: true,
        estimatedTime: '6 giờ',
        resource: 'Refactoring Guru',
        url: 'https://refactoring.guru/'
      },
      {
        id: 'tp-3',
        title: '3. Dependency Injection (DI) & Spring Core',
        completed: false,
        estimatedTime: '8 giờ',
        resource: 'Spring Official Guide',
        url: 'https://spring.io/guides'
      },
      {
        id: 'tp-4',
        title: '4. Building RESTful APIs with Spring MVC',
        completed: false,
        estimatedTime: '10 giờ',
        resource: 'Spring REST API Masterclass',
        url: 'https://spring.io/guides/tutorials/rest/'
      },
      {
        id: 'tp-5',
        title: '5. Spring Data JPA & Hibernate Repository',
        completed: false,
        estimatedTime: '12 giờ',
        resource: 'Baeldung - Spring Data JPA',
        url: 'https://www.baeldung.com/the-persistence-layer-with-spring-data-jpa'
      }
    ]
  }
];

export const INITIAL_EMPLOYER_VERIFICATIONS = [
  {
    id: 'ver-1',
    companyId: 'company-2',
    companyName: 'Fintech StartUp Asia',
    submittedDate: '14/09/2026',
    status: 'Pending',
    documentName: 'GiayPhepKinhDoanh_FintechAsia_2026.pdf',
    website: 'https://fintechasia.io',
    industry: 'Công nghệ Tài chính',
    location: 'Quận 1, TP.HCM',
    rejectReason: ''
  },
  {
    id: 'ver-2',
    companyId: 'company-3',
    companyName: 'AI Vietnam Solutions',
    submittedDate: '13/09/2026',
    status: 'Pending',
    documentName: 'GPKD_AIVietnam_Signed.pdf',
    website: 'https://aivietnam.tech',
    industry: 'Trí tuệ nhân tạo',
    location: 'Thủ Đức, TP.HCM',
    rejectReason: ''
  }
];

export const INITIAL_REPORTED_JOBS = [
  {
    id: 'rep-1',
    jobId: 'job-999',
    jobTitle: 'Việc Làm Thu Nhập High Tech Từ Xa - Không Cần Kinh Nghiệm',
    company: 'Unverified Scam Trading',
    reporterName: 'Nguyễn Văn A',
    reason: 'Nội dung có dấu hiệu lừa đảo, yêu cầu nộp 500k phí tài liệu',
    description: 'Sau khi liên hệ HR trên Zalo, họ yêu cầu nộp 500.000 VNĐ để được làm bài test tuyển dụng.',
    date: '14/09/2026',
    status: 'Pending'
  }
];
