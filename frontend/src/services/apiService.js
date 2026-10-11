import axios from 'axios';

// ===== Base URL của Spring Boot Backend =====
const BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api`;

// ===== Tạo axios instance với config mặc định =====
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // Timeout 10 giây
});

// ===== Request Interceptor: Tự động gắn JWT Token vào mọi request =====
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('careerfit_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ===== Response Interceptor: Xử lý lỗi tập trung =====
api.interceptors.response.use(
  (response) => response.data, // Trả về trực tiếp data để dùng cho tiện
  (error) => {
    if (error.response?.status === 401) {
      // Token hết hạn hoặc không hợp lệ -> xóa và về trang login
      localStorage.removeItem('careerfit_token');
      localStorage.removeItem('careerfit_current_user');
      window.location.reload();
    }
    return Promise.reject(error.response?.data || error);
  }
);

// ============================================================
// AUTH APIs
// ============================================================
export const authApi = {
  login: (data) => api.post('/auth/login', data),

  registerCandidate: (data) => api.post('/auth/register/candidate', data),

  registerEmployer: (formData) => api.post('/auth/register/employer', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  getPasswordStatus: () => api.get('/auth/password-status'),

  changePassword: (data) => api.post('/auth/change-password', data),
};

// ============================================================
// JOB APIs
// ============================================================
export const jobApi = {
  // Public
  searchJobs: (params, signal) => api.get('/jobs', { params, signal }),
  getFilterOptions: () => api.get('/jobs/filter-options'),
  getJobById: (jobId) => api.get(`/jobs/${jobId}`),

  // Candidate
  applyJob: (jobId) => api.post(`/jobs/${jobId}/apply`),
  cancelApplication: (jobId) => api.delete(`/jobs/${jobId}/apply`),
  toggleSaveJob: (jobId) => api.post(`/jobs/${jobId}/save`),
  getMyApplications: () => api.get('/jobs/applications/my'),

  // Employer
  postJob: (data) => api.post('/jobs', data),
  updateJob: (jobId, data) => api.put(`/jobs/${jobId}`, data),
  getMyJobs: () => api.get('/jobs/my'),
  getApplicationsByJob: (jobId) => api.get(`/jobs/${jobId}/applications`),
  deleteJob: (jobId) => api.delete(`/jobs/${jobId}`),
};

// ============================================================
// CANDIDATE APIs
// ============================================================
export const candidateApi = {
  getMyProfile: () => api.get('/candidate/profile'),
  updateMyProfile: (data) => api.put('/candidate/profile', data),

  // UC04 - Tải lên / Cập nhật CV (SCRUM-69, SCRUM-35)
  uploadCv: (formData) => api.post('/candidate/cv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  // UC05 - Xóa CV (SCRUM-36)
  deleteCv: () => api.delete('/candidate/cv'),

  // Tải / Xem file CV trực tiếp từ máy chủ (kèm JWT Header)
  downloadCv: async () => {
    const token = localStorage.getItem('careerfit_token');
    const response = await fetch(`${BASE_URL}/candidate/cv/download`, {
      method: 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    if (!response.ok) {
      throw new Error(`Không thể tải tệp từ máy chủ (Mã lỗi ${response.status})`);
    }
    return await response.blob();
  },
  downloadCvUrl: `${BASE_URL}/candidate/cv/download`,
};

// ============================================================
// ADMIN APIs
// ============================================================
export const adminApi = {
  // Job Moderation
  getAllJobs: () => api.get('/admin/jobs'),
  getPendingJobs: () => api.get('/admin/jobs/pending'),
  approveJob: (jobId) => api.put(`/admin/jobs/${jobId}/approve`),
  rejectJob: (jobId, reason) => api.put(`/admin/jobs/${jobId}/reject`, { reason }),
  removeJob: (jobId) => api.delete(`/admin/jobs/${jobId}`),

  // Employer Verification Management
  getPendingVerifications: () => api.get('/admin/verifications'),
  getAllVerifications: () => api.get('/admin/verifications/all'),
  approveVerification: (companyId) => api.put(`/admin/verifications/${companyId}/approve`),
  rejectVerification: (companyId, reason) => api.put(`/admin/verifications/${companyId}/reject`, { reason }),

  // Skills Catalog (SCRUM-57, SCRUM-86, SCRUM-85)
  getAllSkills: () => api.get('/admin/skills'),
  createSkill: (data) => api.post('/admin/skills', data),
  updateSkill: (id, data) => api.put(`/admin/skills/${id}`, data),
  deleteSkill: (id) => api.delete(`/admin/skills/${id}`),

  // Roadmaps (SCRUM-58, SCRUM-89, SCRUM-88)
  getAllRoadmaps: () => api.get('/admin/roadmaps'),
  createRoadmap: (data) => api.post('/admin/roadmaps', data),
  updateRoadmap: (id, data) => api.put(`/admin/roadmaps/${id}`, data),
  deleteRoadmap: (id) => api.delete(`/admin/roadmaps/${id}`),
  addRoadmapTopic: (roadmapId, data) => api.post(`/admin/roadmaps/${roadmapId}/topics`, data),
  updateRoadmapTopic: (roadmapId, topicId, data) => api.put(`/admin/roadmaps/${roadmapId}/topics/${topicId}`, data),
  deleteRoadmapTopic: (roadmapId, topicId) => api.delete(`/admin/roadmaps/${roadmapId}/topics/${topicId}`),
  reorderRoadmapTopics: (roadmapId, topicIds) => api.put(`/admin/roadmaps/${roadmapId}/topics/reorder`, topicIds),
};

// ============================================================
// PUBLIC CATALOG APIs (SKILLS & ROADMAPS)
// ============================================================
export const catalogApi = {
  getSkills: () => api.get('/skills'),
  getRoadmaps: () => api.get('/roadmaps'),
  getRoadmapById: (id) => api.get(`/roadmaps/${id}`),
  getRoadmapBySkill: (skillName) => api.get(`/roadmaps/skill/${encodeURIComponent(skillName)}`),
};

// ============================================================
// EMPLOYER APIs
// ============================================================
export const employerApi = {
  getMyCompany: () => api.get('/employer/company'),
  updateMyCompany: (data) => api.put('/employer/company', data),
  uploadLogo: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/employer/company/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  // SCRUM-52: Xem chi tiết hồ sơ ứng viên
  getCandidateProfile: (candidateId) => api.get(`/employer/candidates/${candidateId}`),

  // SCRUM-52: Tải CV ứng viên thật từ server (kèm JWT Header)
  downloadCandidateCv: async (candidateId) => {
    const token = localStorage.getItem('careerfit_token');
    const response = await fetch(`${BASE_URL}/employer/candidates/${candidateId}/cv/download`, {
      method: 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    if (!response.ok) {
      throw new Error(`Không thể tải tệp từ máy chủ (Mã lỗi ${response.status})`);
    }
    return await response.blob();
  },
  getCandidateCvDownloadUrl: (candidateId) => `${BASE_URL}/employer/candidates/${candidateId}/cv/download`,

  // Endpoint dành cho employer đã có tài khoản (chuyển từ CANDIDATE → EMPLOYER trong DB)
  // nộp hồ sơ xác minh doanh nghiệp mà không cần tạo user mới
  submitVerification: (formData) => api.post('/employer/company/submit-verification', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

// ============================================================
// REPORT APIs
// ============================================================
export const reportApi = {
  create: (jobId, data) => api.post(`/jobs/${jobId}/reports`, data),
  getMine: (params) => api.get('/candidate/reports', { params }),
  getAdminList: (params) => api.get('/admin/reports', { params }),
  getAdminDetail: (reportId) => api.get(`/admin/reports/${reportId}`),
  updateStatus: (reportId, data) => api.patch(`/admin/reports/${reportId}/status`, data),
};
