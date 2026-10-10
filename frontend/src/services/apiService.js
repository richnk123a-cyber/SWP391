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
  searchJobs: (params) => api.get('/jobs', { params }),
  getJobById: (jobId) => api.get(`/jobs/${jobId}`),

  // Candidate
  applyJob: (jobId) => api.post(`/jobs/${jobId}/apply`),
  toggleSaveJob: (jobId) => api.post(`/jobs/${jobId}/save`),
  getMyApplications: () => api.get('/jobs/applications/my'),

  // Employer
  postJob: (data) => api.post('/jobs', data),
  getMyJobs: () => api.get('/jobs/my'),
  getApplicationsByJob: (jobId) => api.get(`/jobs/${jobId}/applications`),
};

// ============================================================
// CANDIDATE APIs
// ============================================================
export const candidateApi = {
  getMyProfile: () => api.get('/candidate/profile'),
  updateMyProfile: (data) => api.put('/candidate/profile', data),
};

// ============================================================
// EMPLOYER APIs
// ============================================================
export const employerApi = {
  getMyCompany: () => api.get('/employer/company'),
  updateMyCompany: (data) => api.put('/employer/company', data),
};