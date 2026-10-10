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
};