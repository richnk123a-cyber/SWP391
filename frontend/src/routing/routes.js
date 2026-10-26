export const ROUTES = {
  home: { path: '/', title: 'Trang chủ', public: true },
  login: { path: '/login', title: 'Đăng nhập', public: true },
  'register-entry': { path: '/register', title: 'Thiết lập tài khoản', public: true },
  'candidate-onboarding': { path: '/candidate/onboarding', title: 'Thiết lập hồ sơ', public: true, role: 'CANDIDATE' },
  'employer-register': { path: '/employer/register', title: 'Xác minh doanh nghiệp', public: true, role: 'EMPLOYER' },
  'job-search': { path: '/jobs', title: 'Việc làm IT', public: true },
  'job-detail': { path: '/jobs/:id', title: 'Chi tiết việc làm', public: true },
  'candidate-dashboard': { path: '/candidate/dashboard', title: 'Tổng quan ứng viên', role: 'CANDIDATE' },
  'candidate-profile': { path: '/candidate/profile', title: 'Hồ sơ & CV', role: 'CANDIDATE' },
  'learning-roadmap': { path: '/candidate/learning', title: 'Lộ trình học tập', role: 'CANDIDATE' },
  'application-kanban': { path: '/candidate/applications', title: 'Đơn ứng tuyển', role: 'CANDIDATE' },
  'candidate-security': { path: '/candidate/settings', title: 'Cài đặt tài khoản', role: 'CANDIDATE' },
  'employer-dashboard': { path: '/employer/dashboard', title: 'Tổng quan tuyển dụng', role: 'EMPLOYER' },
  'job-management': { path: '/employer/jobs', title: 'Tin tuyển dụng', role: 'EMPLOYER' },
  'create-job': { path: '/employer/jobs/new', title: 'Đăng tin tuyển dụng', role: 'EMPLOYER' },
  'applicant-management': { path: '/employer/applicants', title: 'Quản lý ứng viên', role: 'EMPLOYER' },
  'recruitment-pipeline': { path: '/employer/pipeline', title: 'Quy trình tuyển dụng', role: 'EMPLOYER' },
  'company-profile': { path: '/employer/company', title: 'Hồ sơ công ty', role: 'EMPLOYER' },
  'employer-security': { path: '/employer/settings', title: 'Cài đặt tài khoản', role: 'EMPLOYER' },
  'admin-dashboard': { path: '/admin/dashboard', title: 'Tổng quan quản trị', role: 'ADMIN' },
  'admin-verifications': { path: '/admin/verifications', title: 'Xác minh doanh nghiệp', role: 'ADMIN' },
  'admin-job-moderation': { path: '/admin/jobs', title: 'Kiểm duyệt tuyển dụng', role: 'ADMIN' },
  'admin-reports': { path: '/admin/reports', title: 'Báo cáo vi phạm', role: 'ADMIN' },
  'admin-user-management': { path: '/admin/users', title: 'Quản lý người dùng', role: 'ADMIN' },
  'admin-skills': { path: '/admin/skills', title: 'Danh mục kỹ năng', role: 'ADMIN' },
  'admin-roadmaps': { path: '/admin/roadmaps', title: 'Quản lý lộ trình', role: 'ADMIN' },
  'admin-security': { path: '/admin/settings', title: 'Cài đặt tài khoản', role: 'ADMIN' },
  'oauth-callback': { path: '/oauth-success', title: 'Đang xác thực', public: true },
  'not-found': { path: '/404', title: 'Không tìm thấy trang', public: true },
};

const PAGE_ALIASES = { 'oauth-register': 'register-entry', 'user-management': 'admin-user-management' };
const PATH_ALIASES = {
  '/oauth-register': 'register-entry', '/register/candidate': 'candidate-onboarding',
  '/register/employer': 'employer-register', '/job-search': 'job-search',
  '/candidate/security': 'candidate-security', '/employer/security': 'employer-security', '/admin/security': 'admin-security',
};

export function normalizePage(page) {
  const normalized = PAGE_ALIASES[page] || page;
  return Object.hasOwn(ROUTES, normalized) ? normalized : 'not-found';
}

export function dashboardForRole(role) {
  return { CANDIDATE: 'candidate-dashboard', EMPLOYER: 'employer-dashboard', ADMIN: 'admin-dashboard' }[role] || 'home';
}

export function routeFromLocation(pathname, search = '') {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (PATH_ALIASES[path]) return { page: PATH_ALIASES[path] };
  if (path === '/' && new URLSearchParams(search).has('fromOauth')) return { page: 'register-entry' };
  const entry = Object.entries(ROUTES).find(([, route]) => route.path === path);
  if (entry) return { page: entry[0] };
  const job = path.match(/^\/jobs\/([^/]+)$/);
  if (job) {
    try { return { page: 'job-detail', jobId: decodeURIComponent(job[1]) }; }
    catch { return { page: 'not-found' }; }
  }
  return { page: 'not-found' };
}

export function pathForPage(page, jobId = 'job-1') {
  return ROUTES[normalizePage(page)].path.replace(':id', encodeURIComponent(String(jobId)));
}

export function canAccessPage(page, role) {
  const route = ROUTES[normalizePage(page)];
  return route.public ? !role || !route.role || route.role === role : route.role === role;
}
