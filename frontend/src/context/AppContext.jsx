import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  INITIAL_USERS_DB,
  INITIAL_CANDIDATE,
  INITIAL_COMPANIES,
  INITIAL_JOBS,
  INITIAL_APPLICATIONS,
  INITIAL_ROADMAPS,
  INITIAL_EMPLOYER_VERIFICATIONS,
  INITIAL_REPORTED_JOBS,
  INITIAL_SKILLS_CATALOG,
  INITIAL_NOTIFICATIONS
} from '../data/mockData';
import { authApi, adminApi, candidateApi, employerApi, jobApi } from '../services/apiService';


const AppContext = createContext();

export function AppProvider({ children }) {
  // Helper for safe JSON parsing from localStorage
  const safeGetLocalStorage = (key, fallback) => {
    try {
      const saved = localStorage.getItem(key);
      if (!saved || saved === 'undefined' || saved === 'null') return fallback;
      let parsed = JSON.parse(saved);
      // Clean up string quotes if it's double-encoded string
      if (typeof parsed === 'string') {
        parsed = parsed.replace(/^"+|"+$/g, '').trim();
      }
      return parsed !== undefined && parsed !== null ? parsed : fallback;
    } catch {
      return fallback;
    }
  };

  // Database Users Table State (Persisted in localStorage)
  const [usersDB, setUsersDB] = useState(() => {
    const raw = safeGetLocalStorage('careerfit_users_db', INITIAL_USERS_DB);
    const filtered = (Array.isArray(raw) ? raw : INITIAL_USERS_DB).filter(
      u => u.email?.toLowerCase() !== 'admin@gmail.com' && u.username?.toLowerCase() !== 'admin'
    );
    const hasAdmin = filtered.some(u => u.email?.toLowerCase() === 'trongtien6571@gmail.com');
    if (!hasAdmin) {
      filtered.unshift({
        id: 'user-admin-1',
        email: 'trongtien6571@gmail.com',
        username: 'trongtien_admin',
        fullName: 'Trọng Tiến (Admin)',
        role: 'ADMIN',
        status: 'ACTIVE',
        createdAt: '2026-09-01'
      });
    }
    return filtered;
  });

  // Current Logged-in User Session (Persisted in localStorage)
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = safeGetLocalStorage('careerfit_current_user', null);
    if (saved && (saved.email?.toLowerCase() === 'admin@gmail.com' || saved.username?.toLowerCase() === 'admin')) {
      return null;
    }
    return saved;
  });

  // Visitors start on the public jobs homepage; signed-in users keep their last view.
  const [activePage, setActivePage] = useState(() => currentUser
    ? safeGetLocalStorage('careerfit_active_page', 'home')
    : 'home');

  // Sync URL pathname & search parameters with activePage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const search = window.location.search;
      if (path.includes('/candidate/dashboard')) {
        setActivePage('candidate-dashboard');
      } else if (path.includes('/employer/dashboard')) {
        setActivePage('employer-dashboard');
      } else if (path.includes('/admin/dashboard')) {
        setActivePage('admin-dashboard');
      } else if (path.includes('/register') || search.includes('fromOauth=true')) {
        setActivePage('register-entry');
      } else if (path.includes('/login')) {
        setActivePage('login');
      }
    }
  }, []);

  // Check Spring Boot session authentication state
  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';
    fetch(`${backendUrl}/api/auth/me`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data && data.authenticated && data.user) {
          setCurrentUser(data.user);
          if (data.user.role === 'CANDIDATE') setActivePage('candidate-dashboard');
          else if (data.user.role === 'EMPLOYER') setActivePage('employer-dashboard');
          else if (data.user.role === 'ADMIN') setActivePage('admin-dashboard');
        }
      })
      .catch(() => {});
  }, []);

  // Core Business Data States (Persisted in localStorage)
  const [candidateProfile, setCandidateProfile] = useState(() => safeGetLocalStorage('careerfit_candidate_profile', INITIAL_CANDIDATE));
  const [companies, setCompanies] = useState(() => safeGetLocalStorage('careerfit_companies', INITIAL_COMPANIES));
  const [jobs, setJobs] = useState(() => safeGetLocalStorage('careerfit_jobs', INITIAL_JOBS));

  const [selectedJobId, setSelectedJobId] = useState('job-1');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  const [applications, setApplications] = useState(() => safeGetLocalStorage('careerfit_applications', INITIAL_APPLICATIONS));
  const [roadmaps, setRoadmaps] = useState(() => safeGetLocalStorage('careerfit_roadmaps', INITIAL_ROADMAPS));
  const [employerVerifications, setEmployerVerifications] = useState(() => safeGetLocalStorage('careerfit_employer_verifications', INITIAL_EMPLOYER_VERIFICATIONS));
  const [reportedJobs, setReportedJobs] = useState(() => safeGetLocalStorage('careerfit_reported_jobs', INITIAL_REPORTED_JOBS));
  const [skillsCatalog, setSkillsCatalog] = useState(() => safeGetLocalStorage('careerfit_skills_catalog', INITIAL_SKILLS_CATALOG));
  const [notifications, setNotifications] = useState(() => safeGetLocalStorage('careerfit_notifications', INITIAL_NOTIFICATIONS));
  const [savedJobIds, setSavedJobIds] = useState(() => safeGetLocalStorage('careerfit_saved_jobs', ['job-1', 'job-3']));

  useEffect(() => {
    localStorage.setItem('careerfit_saved_jobs', JSON.stringify(savedJobIds));
  }, [savedJobIds]);

  useEffect(() => {
    localStorage.setItem('careerfit_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = (notif) => {
    const newNotif = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      unread: true,
      time: 'Vừa xong',
      ...notif
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markAllNotificationsAsRead = () => {
    if (!currentUser) return;
    const queryEmail = currentUser.email.toLowerCase();
    setNotifications(prev => prev.map(n => {
      if ((n.recipientEmail && n.recipientEmail.toLowerCase() === queryEmail) || n.recipientId === currentUser.id) {
        return { ...n, unread: false };
      }
      return n;
    }));
  };

  const toggleSaveJob = (jobId) => {
    setSavedJobIds(prev => {
      const isSaved = prev.includes(jobId);
      const targetJob = jobs.find(j => j.id === jobId);
      const jobTitle = targetJob ? targetJob.title : 'tin tuyển dụng';

      if (isSaved) {
        showToast(`Đã bỏ lưu ${jobTitle} khỏi danh sách tin đã lưu.`, 'info');
        return prev.filter(id => id !== jobId);
      } else {
        showToast(`Đã lưu ${jobTitle} vào danh sách việc làm đã lưu thành công!`, 'success');
        return [...prev, jobId];
      }
    });
  };

  // UI Modals, Shell States & Toasts
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('careerfit_sidebar_collapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const [toasts, setToasts] = useState([]);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [interviewModalAppId, setInterviewModalAppId] = useState(null);
  const [viewingCVModalCandidate, setViewingCVModalCandidate] = useState(null);

  useEffect(() => {
    localStorage.setItem('careerfit_sidebar_collapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);
  const toggleMobileDrawer = () => setIsMobileDrawerOpen(prev => !prev);

  // Auto-Save States to localStorage
  useEffect(() => {
    localStorage.setItem('careerfit_users_db', JSON.stringify(usersDB));
  }, [usersDB]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('careerfit_current_user', JSON.stringify(currentUser));
      if (currentUser.role === 'CANDIDATE') {
        const userKey = `careerfit_cand_profile_${currentUser.id}`;
        const savedUserProf = safeGetLocalStorage(userKey, null);
        if (savedUserProf) {
          setCandidateProfile(savedUserProf);
        } else if (currentUser.id === 'user-cand-1') {
          setCandidateProfile(INITIAL_CANDIDATE);
        } else {
          // Fresh profile for new candidate accounts (no inherited seed CV)
          const newProf = {
            id: `cand-${currentUser.id}`,
            userId: currentUser.id,
            name: currentUser.fullName || currentUser.username || currentUser.email?.split('@')[0] || 'Ứng viên',
            email: currentUser.email,
            phone: currentUser.phone || '',
            location: 'Thành phố Hồ Chí Minh',
            university: 'Đại học FPT',
            major: 'Công nghệ thông tin',
            graduationYear: '2026',
            skills: [],
            hasCV: false,
            cvFileName: '',
            cvUploadDate: '',
            extractedCvText: '',
            preferences: {
              desiredRole: 'Fresher Developer',
              location: 'TP.HCM',
              jobType: 'Full-time',
              expectedSalary: '8.000.000 - 12.000.000 VNĐ'
            }
          };
          setCandidateProfile(newProf);
          localStorage.setItem(userKey, JSON.stringify(newProf));
        }
      }
    } else {
      localStorage.removeItem('careerfit_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('careerfit_active_page', JSON.stringify(activePage));
  }, [activePage]);

  useEffect(() => {
    if (currentUser && currentUser.role === 'CANDIDATE' && candidateProfile) {
      const userKey = `careerfit_cand_profile_${currentUser.id}`;
      localStorage.setItem(userKey, JSON.stringify(candidateProfile));
    }
    localStorage.setItem('careerfit_candidate_profile', JSON.stringify(candidateProfile));
  }, [candidateProfile, currentUser]);

  useEffect(() => {
    localStorage.setItem('careerfit_companies', JSON.stringify(companies));
  }, [companies]);

  useEffect(() => {
    localStorage.setItem('careerfit_jobs', JSON.stringify(jobs));
  }, [jobs]);

  useEffect(() => {
    localStorage.setItem('careerfit_applications', JSON.stringify(applications));
  }, [applications]);

  useEffect(() => {
    localStorage.setItem('careerfit_roadmaps', JSON.stringify(roadmaps));
  }, [roadmaps]);

  useEffect(() => {
    localStorage.setItem('careerfit_employer_verifications', JSON.stringify(employerVerifications));
  }, [employerVerifications]);

  useEffect(() => {
    localStorage.setItem('careerfit_reported_jobs', JSON.stringify(reportedJobs));
  }, [reportedJobs]);

  useEffect(() => {
    localStorage.setItem('careerfit_skills_catalog', JSON.stringify(skillsCatalog));
  }, [skillsCatalog]);


  // Extract OAuth2 token or register-token from URL (after Google/Microsoft redirect)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const registerToken = params.get('registerToken');
    const errorMsg = params.get('error');

    if (errorMsg) {
      showToast(decodeURIComponent(errorMsg), 'danger');
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (registerToken) {
      localStorage.setItem('careerfit_register_token', registerToken);
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Check if user logging in via Google OAuth is the designated Admin
      try {
        const base64Url = registerToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const payload = JSON.parse(jsonPayload);
        const email = (payload.sub || payload.email || '').toLowerCase();
        if (email === 'trongtien6571@gmail.com') {
          const adminUser = {
            id: 'user-admin-1',
            email: 'trongtien6571@gmail.com',
            username: 'trongtien_admin',
            name: payload.name || 'Trọng Tiến (Admin)',
            fullName: 'Trọng Tiến (Admin)',
            role: 'ADMIN',
            status: 'ACTIVE'
          };
          localStorage.setItem('careerfit_current_user', JSON.stringify(adminUser));
          localStorage.removeItem('careerfit_register_token');
          setCurrentUser(adminUser);
          showToast('Đăng nhập thành công với quyền Quản trị viên (Admin)!', 'success');
          setActivePage('admin-dashboard');
          return;
        }
      } catch (e) {
        console.error('Error checking registerToken for admin:', e);
      }

      setActivePage('oauth-register');
      return;
    }

    if (token) {
      try {
        localStorage.setItem('careerfit_token', token);
        let payload = null;
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          payload = JSON.parse(jsonPayload);
        } catch {
          try {
            payload = JSON.parse(atob(token.split('.')[1]));
          } catch {}
        }

        if (payload) {
          const resolvedEmail = payload.email || (payload.sub && payload.sub.includes('@') ? payload.sub : '');
          const isSystemAdmin = resolvedEmail.toLowerCase() === 'trongtien6571@gmail.com';
          const resolvedUsername = isSystemAdmin ? 'trongtien_admin' : (payload.username || payload.name || (resolvedEmail ? resolvedEmail.split('@')[0] : 'Ứng viên'));
          const resolvedProvider = payload.authProvider || (resolvedEmail.toLowerCase().endsWith('@gmail.com') ? 'GOOGLE' : resolvedEmail.toLowerCase().endsWith('@outlook.com') ? 'MICROSOFT' : 'LOCAL');
          const user = {
            id: isSystemAdmin ? 'user-admin-1' : (payload.userId || payload.sub),
            email: resolvedEmail,
            username: resolvedUsername,
            name: isSystemAdmin ? 'Trọng Tiến (Admin)' : resolvedUsername,
            fullName: isSystemAdmin ? 'Trọng Tiến (Admin)' : (payload.name || resolvedUsername),
            role: isSystemAdmin ? 'ADMIN' : (payload.role || 'CANDIDATE'),
            status: 'ACTIVE',
            authProvider: resolvedProvider,
            hasCustomPassword: payload.hasCustomPassword === true
          };
          localStorage.setItem('careerfit_current_user', JSON.stringify(user));
          setCurrentUser(user);
          window.history.replaceState({}, document.title, window.location.pathname);
          if (isSystemAdmin) {
            showToast('Đăng nhập thành công với quyền Quản trị viên (Admin)!', 'success');
          }
          setActivePage(
            user.role === 'EMPLOYER' ? 'employer-dashboard' :
            user.role === 'ADMIN' ? 'admin-dashboard' :
            'candidate-dashboard'
          );
        }
      } catch (e) {
        console.error('Error processing OAuth token:', e);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toast Dispatcher Helper
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };


  // Sync mock profile with real auth data
  useEffect(() => {
    if (currentUser && currentUser.role === 'CANDIDATE') {
      const userKey = `careerfit_cand_profile_${currentUser.id}`;
      // Fetch full profile from backend
      candidateApi.getMyProfile()
        .then(res => {
            const realData = (res && res.data) ? res.data : res;
            if (realData && (realData.fullName || realData.email || realData.id)) {
                setCandidateProfile(prev => {
                    const updatedProf = {
                        id: realData.id || `cand-${currentUser.id}`,
                        userId: currentUser.id,
                        name: realData.fullName || currentUser.fullName || currentUser.username || currentUser.name || (currentUser.email ? currentUser.email.split('@')[0] : 'Ứng viên'),
                        email: realData.email || currentUser.email || '',
                        phone: realData.phone || '',
                        location: realData.location || 'Thành phố Hồ Chí Minh',
                        university: realData.university || '',
                        major: realData.major || '',
                        graduationYear: realData.graduationYear || '',
                        skills: realData.skills ? realData.skills.split(',').map(s => s.trim()).filter(Boolean) : (prev?.skills || []),
                        hasCV: realData.hasCv ?? (prev?.hasCV || false),
                        cvFileName: realData.cvFileName || (prev?.cvFileName || ''),
                        cvUploadDate: prev?.cvUploadDate || '',
                        preferences: {
                            ...(prev?.preferences || {}),
                            desiredRole: realData.desiredRole || prev?.preferences?.desiredRole || 'Fresher Developer'
                        }
                    };
                    localStorage.setItem(userKey, JSON.stringify(updatedProf));
                    return updatedProf;
                });
            }
        })
        .catch(err => console.error('Failed to fetch candidate profile:', err));
    }
  }, [currentUser]);

  // REAL AUTHENTICATION LOGIC WITH AUTOMATIC SEED FALLBACK & FLEXIBLE PASSWORDS
  const login = (emailOrUsername, password, provider = 'AUTO') => {
    if (!emailOrUsername) {
      return { success: false, message: 'Vui lòng nhập Email hoặc Tên đăng nhập.' };
    }

    const query = emailOrUsername.trim().toLowerCase();
    const cleanPass = (password || '').trim();
    const prov = (provider || 'AUTO').toUpperCase();

    // Block disabled legacy admin and force Google OAuth for designated admin
    if (query === 'admin@gmail.com' || query === 'admin') {
      return {
        success: false,
        message: 'Tài khoản admin@gmail.com đã bị vô hiệu hóa. Quyền Quản trị viên chỉ cho phép đăng nhập qua Google OAuth bằng tài khoản trongtien6571@gmail.com.'
      };
    }

    if (query === 'trongtien6571@gmail.com' || query === 'trongtien_admin') {
      return {
        success: false,
        message: 'Tài khoản Quản trị viên (trongtien6571@gmail.com) chỉ được phép đăng nhập thông qua Google OAuth. Vui lòng bấm nút "Tiếp tục đăng nhập bằng Google".'
      };
    }

    // 1. Explicit Provider Mode
    let user = null;
    const allUsers = [...usersDB, ...INITIAL_USERS_DB];
    const candidateList = allUsers.filter(u => 
      u.email?.toLowerCase() === query || 
      u.username?.toLowerCase() === query || 
      u.id === query
    );

    if (candidateList.length === 0) {
      return { success: false, message: 'Tài khoản không tồn tại. Vui lòng kiểm tra lại email hoặc đăng ký mới.' };
    }

    const checkPass = (u) => {
      if (!cleanPass) return false;
      return u.passwordHash === cleanPass || 
             (u.passwordHash == null && cleanPass === '123456') ||
             cleanPass === '123456' || 
             cleanPass === 'Admin@123';
    };

    if (prov === 'ADMIN') {
      const adminUsers = candidateList.filter(u => u.role === 'ADMIN');
      if (adminUsers.length === 0) {
        return { success: false, message: 'Không tìm thấy tài khoản Quản trị viên tương ứng.' };
      }
      user = adminUsers.find(checkPass);
      if (!user) {
        return { success: false, message: 'Tài khoản hoặc mật khẩu Quản trị viên không chính xác.' };
      }
    } else if (prov === 'GOOGLE' || prov === 'GMAIL') {
      const googleUsers = candidateList.filter(u => (u.authProvider || '').toUpperCase() === 'GOOGLE');
      if (googleUsers.length === 0) {
        return { success: false, message: 'Không tìm thấy tài khoản Google với thông tin này.' };
      }
      user = googleUsers.find(checkPass);
      if (!user) {
        return { success: false, message: 'Tài khoản hoặc mật khẩu Google không chính xác.' };
      }
    } else if (prov === 'MICROSOFT' || prov === 'OUTLOOK') {
      const msUsers = candidateList.filter(u => (u.authProvider || '').toUpperCase() === 'MICROSOFT');
      if (msUsers.length === 0) {
        return { success: false, message: 'Không tìm thấy tài khoản Microsoft (Outlook) với thông tin này.' };
      }
      user = msUsers.find(checkPass);
      if (!user) {
        return { success: false, message: 'Tài khoản hoặc mật khẩu Microsoft (Outlook) không chính xác.' };
      }
    } else if (prov === 'LOCAL' || prov === 'PASSWORD') {
      const localUsers = candidateList.filter(u => !u.authProvider || u.authProvider.toUpperCase() === 'LOCAL');
      if (localUsers.length === 0) {
        return { success: false, message: 'Không tìm thấy tài khoản mật khẩu hệ thống với thông tin này.' };
      }
      user = localUsers.find(checkPass);
      if (!user) {
        return { success: false, message: 'Tài khoản hoặc mật khẩu không chính xác.' };
      }
    } else {
      // 2. AUTO Mode: Check all accounts matching email and test password
      const matchingUsers = candidateList.filter(checkPass);

      if (matchingUsers.length === 0) {
        return { success: false, message: 'Tài khoản hoặc mật khẩu không chính xác.' };
      } else if (matchingUsers.length === 1) {
        user = matchingUsers[0];
      } else {
        return {
          success: false,
          message: "Vui lòng lựa chọn loại email khi tạo tài khoản gmail hoặc outlook để đăng nhập"
        };
      }
    }

    if (user.status === 'LOCKED') {
      return { success: false, message: 'Tài khoản của bạn đã bị khóa do vi phạm điều khoản hệ thống.' };
    }

    setCurrentUser(user);
    showToast(`Đăng nhập thành công với tài khoản ${user.username}!`, 'success');

    // Role-based navigation redirect
    if (user.role === 'CANDIDATE') {
      setActivePage('candidate-dashboard');
    } else if (user.role === 'EMPLOYER') {
      setActivePage('employer-dashboard');
    } else if (user.role === 'ADMIN') {
      setActivePage('admin-dashboard');
    }

    return { success: true, user };
  };

  const logout = () => {
    setCurrentUser(null);
    setActivePage('home');
    showToast('Đã đăng xuất khỏi hệ thống.', 'info');
  };

  const resetPassword = (email) => {
    if (!email || !email.includes('@')) {
      showToast('Vui lòng nhập định dạng email hợp lệ!', 'warning');
      return false;
    }
    showToast(`Đã gửi liên kết đặt lại mật khẩu đến ${email.trim()}! Vui lòng kiểm tra hộp thư.`, 'success');
    return true;
  };

  const registerCandidate = (dataOrName, emailParam, passwordParam) => {
    let fullName, email, password, phone, targetRole, location, level;
    if (typeof dataOrName === 'object' && dataOrName !== null) {
      ({ fullName, email, password, phone, targetRole, location, level } = dataOrName);
    } else {
      fullName = dataOrName;
      email = emailParam;
      password = passwordParam;
    }

    const cleanEmail = (email || '').trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      showToast('Vui lòng nhập định dạng email hợp lệ!', 'warning');
      return { success: false, message: 'Vui lòng nhập định dạng email hợp lệ!' };
    }

    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';
    fetch(`${backendUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        email: cleanEmail,
        password: password || '123456',
        fullName: fullName || cleanEmail.split('@')[0],
        role: 'CANDIDATE',
        username: cleanEmail.split('@')[0]
      })
    }).catch(err => console.error("Backend register error:", err));

    let newUser;
    const existing = usersDB.find(u => u.email.toLowerCase() === cleanEmail.toLowerCase());
    if (existing) {
      newUser = { ...existing, role: 'CANDIDATE', passwordHash: password || existing.passwordHash };
      setUsersDB(prev => prev.map(u => u.email.toLowerCase() === cleanEmail.toLowerCase() ? newUser : u));
    } else {
      newUser = {
        id: `user-cand-${Date.now()}`,
        email: cleanEmail,
        username: cleanEmail.split('@')[0],
        passwordHash: password || '123456',
        role: 'CANDIDATE',
        status: 'ACTIVE',
        phone: phone || '',
        createdAt: new Date().toISOString().split('T')[0]
      };
      setUsersDB(prev => [...prev, newUser]);
    }

    setCurrentUser(newUser);
    const newCandProf = {
      id: `cand-${newUser.id}`,
      userId: newUser.id,
      name: fullName || cleanEmail.split('@')[0],
      email: cleanEmail,
      phone: phone || '',
      location: location || 'Thành phố Hồ Chí Minh',
      university: 'Đại học FPT',
      major: 'Công nghệ thông tin',
      graduationYear: '2026',
      skills: [],
      hasCV: false,
      cvFileName: '',
      cvUploadDate: '',
      extractedCvText: '',
      preferences: {
        desiredRole: targetRole || 'Software Engineer',
        location: 'TP.HCM',
        jobType: level || 'Full-time Fresher',
        expectedSalary: '8.000.000 - 12.000.000 VNĐ'
      }
    };
    setCandidateProfile(newCandProf);
    const userKey = `careerfit_cand_profile_${cleanEmail.toLowerCase()}`;
    localStorage.setItem(userKey, JSON.stringify(newCandProf));

    showToast('Tạo tài khoản Ứng viên CareerFit thành công! Vui lòng tải lên CV để bắt đầu ứng tuyển.', 'success');
    setActivePage('candidate-dashboard');
    return { success: true, user: newUser };
  };

  const registerEmployer = (dataOrName, companyNameParam, emailParam, passwordParam, docNameParam) => {
    let recruiterName, companyName, email, password, phone, website, industry, location, taxId, docName;
    if (typeof dataOrName === 'object' && dataOrName !== null) {
      ({
        recruiterName,
        companyName,
        email,
        password,
        phone,
        website,
        industry,
        location,
        taxId,
        docName
      } = dataOrName);
    } else {
      recruiterName = dataOrName;
      companyName = companyNameParam;
      email = emailParam;
      password = passwordParam;
      docName = docNameParam;
    }

    const cleanEmail = (email || '').trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      showToast('Vui lòng nhập email công việc hợp lệ!', 'warning');
      return { success: false, message: 'Vui lòng nhập email công việc hợp lệ!' };
    }

    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';
    fetch(`${backendUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        email: cleanEmail,
        password: password || '123456',
        fullName: recruiterName || companyName || cleanEmail.split('@')[0],
        role: 'EMPLOYER',
        username: cleanEmail.split('@')[0]
      })
    }).catch(err => console.error("Backend register error:", err));

    let newUser;
    const existing = usersDB.find(u => u.email.toLowerCase() === cleanEmail.toLowerCase());
    if (existing) {
      newUser = { ...existing, role: 'EMPLOYER', passwordHash: password || existing.passwordHash };
      setUsersDB(prev => prev.map(u => u.email.toLowerCase() === cleanEmail.toLowerCase() ? newUser : u));
    } else {
      newUser = {
        id: `user-emp-${Date.now()}`,
        email: cleanEmail,
        username: cleanEmail.split('@')[0],
        passwordHash: password || '123456',
        role: 'EMPLOYER',
        status: 'ACTIVE',
        phone: phone || '',
        createdAt: new Date().toISOString().split('T')[0]
      };
      setUsersDB(prev => [...prev, newUser]);
    }

    const newCompany = {
      id: `company-${Date.now()}`,
      ownerUserId: newUser.id,
      companyName: companyName || 'Doanh nghiệp IT mới',
      recruiterName: recruiterName || 'HR Recruiter',
      email: cleanEmail,
      phone: phone || '0909123456',
      website: website || `https://${(companyName || 'company').toLowerCase().replace(/\s+/g, '')}.com`,
      industry: industry || 'Công nghệ Thông tin',
      size: '50-200 nhân viên',
      location: location || 'TP. Hồ Chí Minh',
      taxId: taxId || '0312345678',
      logo: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&w=120&h=120&q=80',
      verificationStatus: 'Pending',
      rejectionReason: ''
    };

    const newVerification = {
      id: `ver-${Date.now()}`,
      companyId: newCompany.id,
      companyName: newCompany.companyName,
      submittedDate: new Date().toLocaleDateString('vi-VN'),
      status: 'Pending',
      documentName: docName || 'GPKD_DoanhNghiep.pdf',
      website: newCompany.website,
      industry: newCompany.industry,
      location: newCompany.location,
      rejectReason: ''
    };

    setCompanies(prev => [...prev, newCompany]);

    setEmployerVerifications(prev => [newVerification, ...prev]);
    setCurrentUser(newUser);

    showToast('Tạo tài khoản Doanh nghiệp thành công! Trạng thái xác minh: Pending.', 'success');
    setActivePage('employer-dashboard');
    return { success: true, user: newUser };
  };

  const registerGoogle = (role = 'CANDIDATE') => {
    const isEmployer = role.toString().toUpperCase() === 'EMPLOYER';
    const email = isEmployer ? 'employer.google@careerfit.com' : 'candidate.google@careerfit.com';
    const existing = usersDB.find(u => u.email.toLowerCase() === email);

    if (existing) {
      setCurrentUser(existing);
      showToast(`Đăng nhập Google thành công với vai trò ${existing.role}!`, 'success');
      setActivePage(isEmployer ? 'employer-dashboard' : 'candidate-dashboard');
      return { success: true, user: existing };
    }

    if (isEmployer) {
      return registerEmployer({
        recruiterName: 'Google Recruiter',
        companyName: 'CareerFit Partner Company',
        email: email,
        password: 'google_oauth_pass',
        phone: '0909999888',
        website: 'https://careerfit.com',
        industry: 'Software / Technology',
        location: 'TP. Hồ Chí Minh',
        taxId: '0309998887'
      });
    } else {
      return registerCandidate({
        fullName: 'Google User',
        email: email,
        password: 'google_oauth_pass',
        phone: '0988888999',
        targetRole: 'Fullstack Software Engineer',
        location: 'TP. Hồ Chí Minh',
        level: 'Fresher'
      });
    }
  };

  // Current Active Role State (candidate / employer / admin)
  const [currentRole, setCurrentRole] = useState(() => (currentUser?.role || 'CANDIDATE').toLowerCase());

  useEffect(() => {
    if (currentUser?.role) {
      setCurrentRole(currentUser.role.toLowerCase());
    }
  }, [currentUser]);

  // Employer Profile Custom Override & State
  const [customEmployerProfile, setCustomEmployerProfile] = useState(null);

  // Helper to resolve currently logged in employer's company record
  const currentEmployerCompany = customEmployerProfile || (currentUser && currentUser.role === 'EMPLOYER'
    ? (companies.find(c => c.ownerUserId === currentUser.id) ||
       companies.find(c => c.email && c.email.toLowerCase() === currentUser.email.toLowerCase()) ||
       (currentUser.email && currentUser.email.toLowerCase().includes('vonguyenkhanh') ? (companies.find(c => c.id === 'comp-55122454' || c.companyName === 'VNK Technology Solutions') || INITIAL_COMPANIES.find(c => c.id === 'comp-55122454')) : null) ||
       (currentUser.email && currentUser.email.toLowerCase().includes('pending') ? INITIAL_COMPANIES[1] : null) ||
       {
         id: `comp-${currentUser.id || 'emp'}`,
         ownerUserId: currentUser.id,
         companyName: currentUser.fullName || currentUser.username || 'Doanh nghiệp mới',
         recruiterName: currentUser.fullName || currentUser.username || '',
         email: currentUser.email || '',
         phone: currentUser.phone || '',
         website: '',
         industry: '',
         size: '',
         location: '',
         taxId: '',
         logo: '🏢',
         verificationStatus: 'Pending',
         description: ''
       })
    : (companies[0] || INITIAL_COMPANIES[0]));

  // Automatically sync employer company profile from backend SQL Server & migrate local cache
  useEffect(() => {
    if (currentUser?.role === 'EMPLOYER') {
      // 1. Fetch real company from backend
      employerApi.getMyCompany()
        .then(res => {
          const comp = res?.data || res;
          if (comp && (comp.companyName || comp.id)) {
            setCustomEmployerProfile(comp);
            setCompanies(cList => {
              const list = Array.isArray(cList) ? cList : [];
              const exists = list.some(c => (comp.id && c.id === comp.id) || (comp.ownerUserId && c.ownerUserId === comp.ownerUserId) || (comp.companyName && c.companyName === comp.companyName));
              if (exists) {
                return list.map(c => ((comp.id && c.id === comp.id) || (comp.ownerUserId && c.ownerUserId === comp.ownerUserId) || (comp.companyName && c.companyName === comp.companyName)) ? { ...c, ...comp } : c);
              }
              return [comp, ...list];
            });
          }
        })
        .catch(err => {
          console.warn('Backend getMyCompany not reachable or session not loaded:', err);
        });

      // 2. Fetch real jobs from backend
      jobApi.getMyJobs()
        .then(res => {
          const bJobs = res?.data || res;
          if (Array.isArray(bJobs) && bJobs.length > 0) {
            setJobs(prev => {
              const list = Array.isArray(prev) ? [...prev] : [];
              bJobs.forEach(bj => {
                const idx = list.findIndex(j => j.id === bj.id);
                // Ánh xạ verificationStatus từ backend sang moderationStatus cho frontend
                const getModerationStatus = (vs) => {
                  if (vs === 'Verified') return 'APPROVED';
                  if (vs === 'Rejected') return 'REJECTED';
                  return 'PENDING';
                };
                const mapped = {
                  id: bj.id,
                  title: bj.title,
                  company: bj.companyName || currentEmployerCompany?.companyName || (currentUser?.fullName || currentUser?.username || 'Doanh nghiệp'),
                  employerId: bj.employerId || currentUser.id,
                  category: bj.category,
                  jobType: bj.jobType,
                  location: bj.location,
                  salary: bj.salary,
                  description: bj.description,
                  responsibilities: Array.isArray(bj.responsibilities) ? bj.responsibilities : [bj.responsibilities || ''],
                  requirements: Array.isArray(bj.requirements) ? bj.requirements : [bj.requirements || ''],
                  deadline: bj.deadline,
                  verificationStatus: bj.verificationStatus || 'Pending',
                  verifiedStatus: bj.verificationStatus || 'Pending',
                  moderationStatus: getModerationStatus(bj.verificationStatus),
                  rejectionReason: bj.rejectionReason || '',
                  isVerified: bj.verificationStatus === 'Verified'
                };
                if (idx >= 0) list[idx] = { ...list[idx], ...mapped };
                else list.unshift(mapped);
              });
              return list;
            });
          }
        })
        .catch(err => console.warn('Backend getMyJobs sync note:', err));

      // 3. One-time auto-migration for vonguyenkhanh2911@gmail.com / user-cand-55122454
      if (currentUser.email === 'vonguyenkhanh2911@gmail.com' || currentUser.id === 'user-cand-55122454') {
        const vnkComp = INITIAL_COMPANIES.find(c => c.id === 'comp-55122454');
        if (vnkComp) {
          setCompanies(prev => {
            const list = Array.isArray(prev) ? [...prev] : [];
            const idx = list.findIndex(c => c.id === 'comp-55122454' || c.ownerUserId === 'user-cand-55122454' || c.email === 'vonguyenkhanh2911@gmail.com');
            if (idx >= 0) {
              list[idx] = { ...list[idx], ...vnkComp, logo: list[idx].logo || vnkComp.logo };
            } else {
              list.unshift(vnkComp);
            }
            return list;
          });
        }

        // Ensure VNK real jobs exist in state
        setJobs(prev => {
          const list = Array.isArray(prev) ? [...prev] : [];
          const vnkJobs = INITIAL_JOBS.filter(j => j.id === 'job-vnk-1' || j.id === 'job-vnk-2' || j.employerId === 'user-cand-55122454');
          vnkJobs.forEach(vj => {
            if (!list.some(j => j.id === vj.id)) {
              list.unshift(vj);
            }
          });
          return list;
        });

        // Ensure VNK real applications exist in state
        setApplications(prev => {
          const list = Array.isArray(prev) ? [...prev] : [];
          const vnkApps = INITIAL_APPLICATIONS.filter(a => a.id.startsWith('app-vnk-'));
          vnkApps.forEach(va => {
            if (!list.some(a => a.id === va.id)) {
              list.unshift(va);
            }
          });
          return list;
        });
      }
    }

    // Tải tất cả tin tuyển dụng từ backend khi ADMIN đăng nhập (để hiển thị trang kiểm duyệt)
    if (currentUser?.role === 'ADMIN') {
      adminApi.getAllJobs()
        .then(res => {
          const bJobs = res?.data || res;
          if (Array.isArray(bJobs) && bJobs.length > 0) {
            setJobs(prev => {
              const list = Array.isArray(prev) ? [...prev] : [];
              bJobs.forEach(bj => {
                const idx = list.findIndex(j => j.id === bj.id);
                const getModerationStatus = (vs) => {
                  if (vs === 'Verified') return 'APPROVED';
                  if (vs === 'Rejected') return 'REJECTED';
                  return 'PENDING';
                };
                const mapped = {
                  id: bj.id,
                  title: bj.title,
                  company: bj.companyName || '',
                  employerId: bj.employerId,
                  category: bj.category,
                  jobType: bj.jobType,
                  location: bj.location,
                  salary: bj.salary,
                  description: bj.description,
                  responsibilities: Array.isArray(bj.responsibilities) ? bj.responsibilities : [bj.responsibilities || ''],
                  requirements: Array.isArray(bj.requirements) ? bj.requirements : [bj.requirements || ''],
                  deadline: bj.deadline,
                  verificationStatus: bj.verificationStatus || 'Pending',
                  verifiedStatus: bj.verificationStatus || 'Pending',
                  moderationStatus: getModerationStatus(bj.verificationStatus),
                  rejectionReason: bj.rejectionReason || '',
                  isVerified: bj.verificationStatus === 'Verified'
                };
                if (idx >= 0) list[idx] = { ...list[idx], ...mapped };
                else list.unshift(mapped);
              });
              return list;
            });
          }
        })
        .catch(err => console.warn('Admin getAllJobs sync note:', err));
    }
  }, [currentUser]);

  // Sync employer verifications from backend (for Admin to see newly submitted verifications)
  useEffect(() => {
    if (currentUser?.role === 'ADMIN') {
      adminApi.getAllVerifications()
        .then(res => {
          const backendVerifications = res?.data || res;
          if (Array.isArray(backendVerifications) && backendVerifications.length > 0) {
            setEmployerVerifications(prev => {
              const localList = Array.isArray(prev) ? prev : [];
              // Merge: add backend verifications not yet in local list
              const merged = [...localList];
              backendVerifications.forEach(bv => {
                const exists = merged.some(lv =>
                  lv.companyId === bv.id ||
                  lv.id === bv.id ||
                  (bv.email && lv.email && lv.email.toLowerCase() === bv.email.toLowerCase())
                );
                if (!exists) {
                  merged.unshift({
                    id: bv.id || `ver-${Date.now()}-${Math.random().toString(36).substr(2,4)}`,
                    companyId: bv.id,
                    companyName: bv.companyName || '',
                    recruiterName: bv.recruiterName || '',
                    email: bv.email || '',
                    phone: bv.phone || '',
                    taxId: bv.taxId || '',
                    location: bv.location || '',
                    industry: bv.industry || '',
                    website: bv.website || '',
                    submittedDate: new Date().toLocaleDateString('vi-VN'),
                    status: bv.verificationStatus || 'Pending',
                    documentName: bv.businessLicenseFile || '',
                    rejectReason: bv.rejectionReason || ''
                  });
                } else {
                  // Update status from backend (source of truth)
                  const idx = merged.findIndex(lv =>
                    lv.companyId === bv.id ||
                    lv.id === bv.id ||
                    (bv.email && lv.email && lv.email.toLowerCase() === bv.email.toLowerCase())
                  );
                  if (idx >= 0) {
                    merged[idx] = {
                      ...merged[idx],
                      companyId: bv.id || merged[idx].companyId,
                      companyName: bv.companyName || merged[idx].companyName,
                      status: bv.verificationStatus || merged[idx].status,
                      recruiterName: bv.recruiterName || merged[idx].recruiterName,
                      email: bv.email || merged[idx].email,
                      phone: bv.phone || merged[idx].phone,
                      taxId: bv.taxId || merged[idx].taxId,
                      location: bv.location || merged[idx].location,
                      industry: bv.industry || merged[idx].industry,
                      website: bv.website || merged[idx].website,
                      documentName: bv.businessLicenseFile || merged[idx].documentName,
                      rejectReason: bv.rejectionReason || merged[idx].rejectReason
                    };
                  }
                }
              });
              return merged;
            });
          }
        })
        .catch(err => console.warn('Admin getPendingVerifications sync note:', err));
    }
  }, [currentUser]);


  const employerProfile = currentEmployerCompany;

  const setEmployerProfile = (profileOrFn) => {
    setCustomEmployerProfile(prev => {
      const current = prev || currentEmployerCompany;
      const next = typeof profileOrFn === 'function' ? profileOrFn(current) : profileOrFn;
      if (next) {
        setCompanies(cList => {
          const list = Array.isArray(cList) ? cList : [];
          const exists = list.some(c => (next.id && c.id === next.id) || (next.companyName && c.companyName === next.companyName));
          if (exists) {
            return list.map(c => ((next.id && c.id === next.id) || (next.companyName && c.companyName === next.companyName)) ? { ...c, ...next } : c);
          }
          return [next, ...list];
        });
      }
      return next;
    });
  };

  // State Mutators
  const updateCandidateSkills = (newSkills) => {
    setCandidateProfile(prev => ({ ...prev, skills: newSkills }));
    showToast('Đã cập nhật danh sách kỹ năng cá nhân!', 'success');
  };

  const uploadCandidateCV = async (fileOrName) => {
    let finalName = 'CV_Ung_Vien.pdf';
    let extractedText = '';

    if (fileOrName instanceof File) {
      finalName = fileOrName.name;
      try {
        const formData = new FormData();
        formData.append('file', fileOrName);
        const res = await candidateApi.uploadCv(formData);
        if (res && res.data) {
          finalName = res.data.cvFileName || finalName;
          extractedText = res.data.extractedCvText || '';
        }
      } catch (err) {
        console.warn('Backend CV upload sync failed, fallback to local state:', err);
      }
    } else if (typeof fileOrName === 'string' && fileOrName) {
      finalName = fileOrName;
    }

    const updatedProf = {
      ...candidateProfile,
      hasCV: true,
      cvFileName: finalName,
      extractedCvText: extractedText || candidateProfile?.extractedCvText || '',
      cvUploadDate: new Date().toLocaleDateString('vi-VN')
    };
    setCandidateProfile(updatedProf);
    if (currentUser && currentUser.id) {
      const userKey = `careerfit_cand_profile_${currentUser.id}`;
      localStorage.setItem(userKey, JSON.stringify(updatedProf));
    }
    showToast(`Đã tải lên và cập nhật CV "${finalName}" thành công! Bây giờ bạn có thể ứng tuyển.`, 'success');
    return updatedProf;
  };

  const deleteCandidateCV = async () => {
    try {
      await candidateApi.deleteCv();
    } catch (err) {
      console.warn('Backend CV delete failed, falling back to local state:', err);
    }

    const updatedProf = {
      ...candidateProfile,
      hasCV: false,
      cvFileName: '',
      extractedCvText: '',
      cvUploadDate: '',
      cvFileSize: 0
    };
    setCandidateProfile(updatedProf);
    if (currentUser && currentUser.id) {
      const userKey = `careerfit_cand_profile_${currentUser.id}`;
      localStorage.setItem(userKey, JSON.stringify(updatedProf));
    }
    showToast('Đã xóa CV thành công!', 'info');
    return updatedProf;
  };

  const toggleRoadmapTopic = (roadmapId, topicId) => {
    setRoadmaps(prev =>
      prev.map(rm => {
        if (rm.id === roadmapId) {
          return {
            ...rm,
            topics: rm.topics.map(tp =>
              tp.id === topicId ? { ...tp, completed: !tp.completed } : tp
            )
          };
        }
        return rm;
      })
    );
    showToast('Đã cập nhật tiến độ học tập trên Roadmap!', 'success');
  };

  const applyForJob = (jobId) => {
    if (!currentUser) {
      showToast('Vui lòng đăng nhập tài khoản Ứng viên để nộp đơn!', 'warning');
      setActivePage('login');
      return false;
    }
    if (currentUser.role !== 'CANDIDATE') {
      showToast('Chỉ tài khoản Ứng viên mới có thể nộp đơn ứng tuyển!', 'danger');
      return false;
    }
    if (!candidateProfile || !candidateProfile.hasCV || !candidateProfile.cvFileName) {
      showToast('⚠️ Vui lòng tải lên file CV (PDF/DOCX) trong Hồ sơ & CV trước khi nộp đơn ứng tuyển!', 'warning');
      setActivePage('candidate-onboarding');
      return false;
    }

    const existing = applications.find(a =>
      a.jobId === jobId &&
      (a.candidateEmail === candidateProfile.email ||
       a.candidateId === candidateProfile.id ||
       a.candidateId === currentUser.id)
    );
    if (existing) {
      showToast('Bạn đã nộp đơn ứng tuyển cho công việc này rồi!', 'info');
      return false;
    }

    const newApp = {
      id: `app-${Date.now()}`,
      jobId,
      candidateId: candidateProfile.id || currentUser.id,
      candidateName: candidateProfile.name || currentUser.fullName || currentUser.username,
      candidateEmail: candidateProfile.email || currentUser.email,
      candidateUniversity: candidateProfile.university || 'Đại học FPT',
      appliedDate: new Date().toLocaleDateString('vi-VN'),
      lastUpdate: new Date().toLocaleDateString('vi-VN'),
      status: 'Đã nộp'
    };

    setApplications(prev => [newApp, ...prev]);

    // Gọi API backend để lưu vào DB (fire-and-forget, không block UI)
    const token = localStorage.getItem('careerfit_token');
    if (token) {
      jobApi.applyJob(jobId)
        .then(res => {
          // Nếu backend trả về ID thực, cập nhật lại ID trong state
          const realApp = res?.data || res;
          if (realApp && realApp.id && realApp.id !== newApp.id) {
            setApplications(prev => prev.map(a =>
              a.id === newApp.id ? { ...a, id: realApp.id, backendSynced: true } : a
            ));
          }
        })
        .catch(err => {
          // Đã nộp rồi từ lần trước (backend báo duplicate) thì bỏ qua
          console.warn('applyJob backend sync note:', err);
        });
    }

    // Gửi thông báo cho nhà tuyển dụng
    const targetJob = jobs.find(j => j.id === jobId);
    if (targetJob) {
      const empEmail = targetJob.employerEmail || (targetJob.company === 'FPT Software' ? 'employer@gmail.com' : '');
      addNotification({
        recipientEmail: empEmail || 'employer@gmail.com',
        recipientId: targetJob.employerId || 'user-emp-1',
        type: 'NEW_APPLICATION',
        title: 'Ứng viên mới nộp đơn ứng tuyển',
        message: `${candidateProfile.name || currentUser.fullName || 'Ứng viên'} vừa nộp CV cho vị trí "${targetJob.title}".`,
        page: 'applicant-management'
      });
    }

    showToast('Ứng tuyển thành công! Nhà tuyển dụng đã nhận hồ sơ của bạn.', 'success');
    return true;
  };

  // Hủy đơn ứng tuyển (Candidate)
  const cancelApplication = (jobId) => {
    if (!currentUser || currentUser.role !== 'CANDIDATE') {
      showToast('Không có quyền thực hiện thao tác này!', 'danger');
      return false;
    }

    // Tìm đơn ứng tuyển cần hủy trong local state
    const existingApp = applications.find(a =>
      a.jobId === jobId &&
      (a.candidateEmail === candidateProfile?.email ||
       a.candidateId === candidateProfile?.id ||
       a.candidateId === currentUser.id)
    );

    if (!existingApp) {
      showToast('Không tìm thấy đơn ứng tuyển để hủy.', 'warning');
      return false;
    }

    // Xóa khỏi local state ngay lập tức — NTD cũng không còn thấy ứng viên này
    setApplications(prev => prev.filter(a => a.id !== existingApp.id));
    showToast('Đã hủy đơn ứng tuyển thành công.', 'info');

    // Gọi API backend để xóa khỏi DB (fire-and-forget)
    const token = localStorage.getItem('careerfit_token');
    if (token) {
      jobApi.cancelApplication(jobId)
        .catch(err => {
          // Nếu backend báo "không tìm thấy" (đơn chỉ ở local state) thì bỏ qua, không rollback
          // Nếu lỗi khác thì log ra console để debug
          const status = err?.status || err?.response?.status;
          const errMsg = err?.message || '';
          if (status !== 400 && !errMsg.includes('chưa nộp')) {
            console.warn('cancelApplication backend sync note:', err);
          }
        });
    }

    return true;
  };

  const updateApplicationStatus = (appId, newStatus, interviewDetails = null) => {
    const targetApp = applications.find(a => a.id === appId);

    setApplications(prev =>
      prev.map(app => {
        if (app.id === appId) {
          return {
            ...app,
            status: newStatus,
            lastUpdate: new Date().toLocaleDateString('vi-VN'),
            interviewDetails: interviewDetails || app.interviewDetails
          };
        }
        return app;
      })
    );

    if (targetApp) {
      const targetJob = jobs.find(j => j.id === targetApp.jobId);
      const compName = targetJob ? targetJob.company : 'Nhà tuyển dụng';
      const msg = newStatus === 'Phỏng vấn' && interviewDetails
        ? `chúc mừng! ${compName} mời bạn tham gia phỏng vấn lúc ${interviewDetails.time || ''} ngày ${interviewDetails.date || ''}. Link Meet: ${interviewDetails.meetingLink || 'N/A'}. Ghi chú: ${interviewDetails.note || ''}`
        : `${compName} đã cập nhật trạng thái ứng tuyển của bạn sang "${newStatus}".`;

      addNotification({
        recipientEmail: targetApp.candidateEmail,
        recipientId: targetApp.candidateId,
        type: 'APPLICATION_STATUS_CHANGED',
        title: `Cập nhật hồ sơ: ${newStatus}`,
        message: msg,
        page: 'application-kanban'
      });
    }

    showToast(`Đã chuyển trạng thái ứng tuyển sang "${newStatus}"`, 'success');
  };

  const createJob = async (newJobData) => {
    if (!currentEmployerCompany || currentEmployerCompany.verificationStatus !== 'Verified') {
      showToast('Tài khoản chưa được xác minh! Không thể đăng tin tuyển dụng.', 'danger');
      return false;
    }

    const tempId = `job-${Date.now()}`;
    const requestedModerationStatus = newJobData.moderationStatus || 'PENDING';
    const isApprovedImmediately = requestedModerationStatus === 'APPROVED';

    const created = {
      id: tempId,
      ...newJobData,
      company: currentEmployerCompany.companyName,
      employerId: currentUser?.id || currentEmployerCompany?.ownerUserId,
      isVerified: isApprovedImmediately,
      verifiedStatus: isApprovedImmediately ? 'Verified' : 'Pending',
      moderationStatus: requestedModerationStatus,
      logo: currentEmployerCompany.logo || '🏢',
      postedDate: 'Hôm nay'
    };

    setJobs(prev => [created, ...prev]);

    // Async sync to backend
    try {
      const res = await jobApi.postJob({
        title: newJobData.title,
        category: newJobData.category,
        jobType: newJobData.jobType,
        location: newJobData.location,
        salary: newJobData.salary || `${newJobData.minSalary || 10}.000.000 - ${newJobData.maxSalary || 15}.000.000 VNĐ`,
        description: newJobData.description,
        responsibilities: Array.isArray(newJobData.responsibilities) ? newJobData.responsibilities.join('\n') : (newJobData.responsibilities || ''),
        requirements: Array.isArray(newJobData.requirements) ? newJobData.requirements.join('\n') : (newJobData.requirements || ''),
        deadline: newJobData.deadline
      });

      const backendJob = res?.data || res;
      if (backendJob && backendJob.id) {
        setJobs(prev => prev.map(j => (j.id === tempId ? { ...j, id: backendJob.id } : j)));
      }
    } catch (err) {
      console.warn('Backend postJob sync note:', err);
    }

    if (requestedModerationStatus === 'PENDING') {
      showToast('Đã gửi tin tuyển dụng! Tin đang chờ Admin kiểm duyệt trước khi hiển thị công khai.', 'success');
    } else {
      showToast('Đăng tin tuyển dụng mới thành công!', 'success');
    }
    return true;
  };

  // Cập nhật / Chỉnh sửa tin tuyển dụng
  const updateJob = async (jobId, updatedData) => {
    // Điều kiện 1: Kiểm tra xem tin đã có người nộp hồ sơ ứng tuyển hay chưa
    const jobApps = applications.filter(a => a.jobId === jobId);
    if (jobApps.length > 0) {
      showToast('Tin tuyển dụng này đã có người ứng tuyển nên không được phép chỉnh sửa!', 'warning');
      return false;
    }

    // Lưu lại job cũ để rollback nếu gọi backend thất bại
    const oldJob = jobs.find(j => j.id === jobId);

    // Optimistic update: khi sửa tin thì LUÔN LUÔN gửi lại cho Admin để xác nhận (chuyển về PENDING)
    setJobs(prev => prev.map(j => {
      if (j.id === jobId) {
        return {
          ...j,
          ...updatedData,
          moderationStatus: 'PENDING',
          verificationStatus: 'Pending',
          verifiedStatus: 'Pending',
          rejectionReason: '',
          lastUpdate: new Date().toLocaleDateString('vi-VN')
        };
      }
      return j;
    }));

    try {
      const token = localStorage.getItem('careerfit_token');
      if (token) {
        await jobApi.updateJob(jobId, {
          title: updatedData.title,
          category: updatedData.category,
          jobType: updatedData.jobType,
          location: updatedData.location,
          salary: updatedData.salary,
          description: updatedData.description,
          responsibilities: Array.isArray(updatedData.responsibilities) ? updatedData.responsibilities.join('\n') : (updatedData.responsibilities || ''),
          requirements: Array.isArray(updatedData.requirements) ? updatedData.requirements.join('\n') : (updatedData.requirements || ''),
          deadline: updatedData.deadline
        });
      }
      showToast('Đã lưu chỉnh sửa! Tin đã được chuyển sang trạng thái "Chờ kiểm duyệt" để Admin phê duyệt lại.', 'success');
      return true;
    } catch (err) {
      console.warn('Backend updateJob sync note:', err);
      const errMsg = err?.message || err?.response?.data?.message;
      if (errMsg && errMsg.includes('đã có người')) {
        // Rollback lại state nếu Backend từ chối do có ứng viên
        if (oldJob) setJobs(prev => prev.map(j => (j.id === jobId ? oldJob : j)));
        showToast(errMsg, 'danger');
        return false;
      }
      showToast('Đã lưu chỉnh sửa! Tin đã được gửi lại cho Admin để xác nhận.', 'success');
      return true;
    }
  };


  const reportJob = (jobId, reason, description) => {
    const job = jobs.find(j => j.id === jobId);
    const newReport = {
      id: `rep-${Date.now()}`,
      jobId,
      jobTitle: job ? job.title : 'Tin tuyển dụng',
      company: job ? job.company : 'Doanh nghiệp',
      reporterName: candidateProfile.name,
      reason,
      description,
      date: new Date().toLocaleDateString('vi-VN'),
      status: 'Pending'
    };
    setReportedJobs(prev => [newReport, ...prev]);
    showToast('Đã gửi báo cáo tin tuyển dụng đáng ngờ tới Ban quản trị.', 'success');
  };

  // ADMIN USER MANAGEMENT
  const toggleLockUser = (userId, lockReason = '') => {
    let newStatus = 'ACTIVE';
    setUsersDB(prev =>
      prev.map(user => {
        if (user.id === userId) {
          newStatus = user.status === 'LOCKED' ? 'ACTIVE' : 'LOCKED';
          return {
            ...user,
            status: newStatus,
            lockReason: newStatus === 'LOCKED' ? lockReason : ''
          };
        }
        return user;
      })
    );

    if (newStatus === 'LOCKED') {
      showToast('Đã khóa tài khoản người dùng thành công!', 'warning');
    } else {
      showToast('Đã mở khóa tài khoản người dùng thành công!', 'success');
    }
  };

  // JOB MODERATION
  const handleApproveJobModeration = (jobId) => {
    // Cập nhật UI ngay lập tức (optimistic update)
    setJobs(prev =>
      prev.map(j =>
        j.id === jobId
          ? {
              ...j,
              isVerified: true,
              verifiedStatus: 'Verified',
              verificationStatus: 'Verified',
              moderationStatus: 'APPROVED',
              rejectionReason: '',
              moderatedAt: new Date().toLocaleDateString('vi-VN'),
              moderatedBy: currentUser ? currentUser.email : 'trongtien6571@gmail.com'
            }
          : j
      )
    );
    // Gọi API backend để lưu vào DB
    adminApi.approveJob(jobId)
      .then(() => {
        showToast('Đã phê duyệt tin tuyển dụng thành công. Bài đăng đã hiển thị công khai!', 'success');
      })
      .catch(err => {
        console.error('Lỗi khi phê duyệt tin tuyển dụng:', err);
        // Rollback UI nếu API thất bại
        setJobs(prev =>
          prev.map(j =>
            j.id === jobId
              ? { ...j, isVerified: false, verifiedStatus: 'Pending', verificationStatus: 'Pending', moderationStatus: 'PENDING' }
              : j
          )
        );
        showToast('Phê duyệt tin thất bại. Vui lòng thử lại.', 'danger');
      });
  };

  const handleRejectJobModeration = (jobId, reason) => {
    // Cập nhật UI ngay lập tức (optimistic update)
    setJobs(prev =>
      prev.map(j =>
        j.id === jobId
          ? {
              ...j,
              moderationStatus: 'REJECTED',
              verificationStatus: 'Rejected',
              rejectionReason: reason,
              moderatedAt: new Date().toLocaleDateString('vi-VN'),
              moderatedBy: currentUser ? currentUser.email : 'trongtien6571@gmail.com'
            }
          : j
      )
    );
    // Gọi API backend để lưu vào DB
    adminApi.rejectJob(jobId, reason)
      .then(() => {
        showToast('Đã từ chối tin tuyển dụng có lưu lý do.', 'info');
      })
      .catch(err => {
        console.error('Lỗi khi từ chối tin tuyển dụng:', err);
        // Rollback UI nếu API thất bại
        setJobs(prev =>
          prev.map(j =>
            j.id === jobId
              ? { ...j, moderationStatus: 'PENDING', verificationStatus: 'Pending', rejectionReason: '' }
              : j
          )
        );
        showToast('Từ chối tin thất bại. Vui lòng thử lại.', 'danger');
      });
  };

  // XÓA TIN TUYỂN DỤNG CỦA DOANH NGHIỆP (với điều kiện ứng viên)
  const deleteEmployerJob = async (jobId) => {
    // 1. Kiểm tra danh sách ứng viên của công việc
    const jobApps = applications.filter(a => a.jobId === jobId);

    // Kiểm tra xem có ứng viên nào đang ở trạng thái 'Đã xem' hoặc 'Phỏng vấn' hay không
    const hasReviewedCandidate = jobApps.some(a => {
      const st = (a.status || '').toLowerCase().trim();
      return st.includes('đã xem') || st.includes('phỏng vấn') || st.includes('interview') || st.includes('viewed');
    });

    if (hasReviewedCandidate) {
      showToast('Không thể xóa tin tuyển dụng này vì đang có ứng viên trong trạng thái "Đã xem" hoặc "Phỏng vấn"!', 'warning');
      return false;
    }

    // Lưu lại job cũ để rollback nếu API lỗi
    const oldJob = jobs.find(j => j.id === jobId);

    // Optimistic update: xóa khỏi state
    setJobs(prev => prev.filter(j => j.id !== jobId));
    // Xóa các application liên quan đến job đó ở local
    setApplications(prev => prev.filter(a => a.jobId !== jobId));

    try {
      const token = localStorage.getItem('careerfit_token');
      if (token) {
        if (currentUser?.role === 'ADMIN') {
          await adminApi.removeJob(jobId);
        } else {
          await jobApi.deleteJob(jobId);
        }
      }
      showToast('Đã xóa tin tuyển dụng thành công!', 'success');
      return true;
    } catch (err) {
      console.warn('Lỗi khi gọi API xóa tin tuyển dụng:', err);
      const errMsg = err?.message || err?.response?.data?.message;
      if (errMsg && (errMsg.includes('Đã xem') || errMsg.includes('Phỏng vấn'))) {
        // Rollback lại state nếu backend từ chối do vi phạm điều kiện
        if (oldJob) setJobs(prev => [oldJob, ...prev]);
        showToast(errMsg, 'danger');
        return false;
      }
      // Nếu là lỗi khác (như job mock chỉ tồn tại local), giữ việc xóa trên giao diện thành công
      showToast('Đã xóa tin tuyển dụng thành công!', 'success');
      return true;
    }
  };

  const handleRemoveApprovedJob = (jobId) => {
    deleteEmployerJob(jobId);
  };


  // EMPLOYER VERIFICATION
  const handleApproveVerification = (verifyId) => {
    const verify = employerVerifications.find(v => v.id === verifyId);
    setEmployerVerifications(prev =>
      prev.map(v => (v.id === verifyId ? { ...v, status: 'Verified' } : v))
    );
    if (verify) {
      setCompanies(prev =>
        prev.map(c =>
          c.id === verify.companyId || c.companyName === verify.companyName
            ? { ...c, verificationStatus: 'Verified', rejectionReason: '' }
            : c
        )
      );
      // Giữ đồng bộ tên công ty trên tất cả các tin tuyển dụng của công ty này
      if (verify.companyName) {
        setJobs(prev =>
          prev.map(j =>
            (j.employerId === verify.companyId || (verify.companyName && j.company === verify.companyName))
              ? { ...j, company: verify.companyName }
              : j
          )
        );
      }
      // Persist to backend DB
      const backendId = verify.companyId || verify.id;
      if (backendId) {
        adminApi.approveVerification(backendId)
          .catch(err => console.warn('Backend approveVerification note:', err));
      }
    }
    showToast('Đã phê duyệt xác minh doanh nghiệp thành công!', 'success');
  };

  const handleRejectVerification = (verifyId, reason) => {
    const verify = employerVerifications.find(v => v.id === verifyId);
    setEmployerVerifications(prev =>
      prev.map(v => (v.id === verifyId ? { ...v, status: 'Rejected', rejectReason: reason } : v))
    );
    if (verify) {
      setCompanies(prev =>
        prev.map(c =>
          c.id === verify.companyId || c.companyName === verify.companyName
            ? { ...c, verificationStatus: 'Rejected', rejectionReason: reason }
            : c
        )
      );
      // Persist to backend DB
      const backendId = verify.companyId || verify.id;
      if (backendId) {
        adminApi.rejectVerification(backendId, reason)
          .catch(err => console.warn('Backend rejectVerification note:', err));
      }
    }
    showToast('Đã từ chối xác minh doanh nghiệp có lưu lý do bắt buộc.', 'info');
  };


  // SUSPICIOUS REPORT HANDLING
  const handleDismissReport = (reportId) => {
    setReportedJobs(prev =>
      prev.map(r => (r.id === reportId ? { ...r, status: 'Dismissed' } : r))
    );
    showToast('Đã bác bỏ báo cáo vi phạm.', 'info');
  };

  const handleResolveReport = (reportId, action = 'resolve_only') => {
    const report = reportedJobs.find(r => r.id === reportId);
    setReportedJobs(prev =>
      prev.map(r => (r.id === reportId ? { ...r, status: 'Resolved' } : r))
    );

    if (action === 'remove_job' && report) {
      setJobs(prev => prev.filter(j => j.id !== report.jobId));
      showToast('Đã gỡ bỏ tin tuyển dụng vi phạm khỏi hệ thống.', 'danger');
    } else if (action === 'lock_employer' && report) {
      const targetJob = jobs.find(j => j.id === report.jobId);
      if (targetJob) {
        setJobs(prev => prev.filter(j => j.id !== report.jobId));
        setUsersDB(prev =>
          prev.map(u => (u.id === targetJob.employerId ? { ...u, status: 'LOCKED', lockReason: 'Khóa tài khoản do vi phạm nghiêm trọng từ Báo cáo tin giả mạo' } : u))
        );
      }
      showToast('Đã gỡ tin và khóa tài khoản doanh nghiệp vi phạm!', 'danger');
    } else {
      showToast('Đã đánh dấu xử lý xong báo cáo.', 'success');
    }
  };

  // SKILL CATALOG CRUD
  const addSkillToCatalog = (name, category, description = '') => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    const exists = skillsCatalog.some(s => s.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      showToast(`Kỹ năng "${trimmed}" đã tồn tại trong danh mục!`, 'warning');
      return false;
    }

    const newSkill = {
      id: `sk-${Date.now()}`,
      name: trimmed,
      category: category || 'Backend',
      description
    };
    setSkillsCatalog(prev => [...prev, newSkill]);
    showToast(`Đã thêm kỹ năng mới "${trimmed}" vào hệ thống.`, 'success');
    return true;
  };

  const updateSkillCatalog = (skillId, updatedData) => {
    setSkillsCatalog(prev =>
      prev.map(s => (s.id === skillId ? { ...s, ...updatedData } : s))
    );
    showToast('Đã cập nhật kỹ năng thành công!', 'success');
  };

  const removeSkillFromCatalog = (skillId) => {
    setSkillsCatalog(prev => prev.filter(s => s.id !== skillId));
    showToast('Đã xóa kỹ năng khỏi hệ thống.', 'info');
  };

  // ROADMAP CRUD & TOPICS
  const createRoadmap = ({ skill, targetRole, description }) => {
    const newRoadmap = {
      id: `rd-${Date.now()}`,
      skill,
      targetRole,
      description,
      topics: []
    };
    setRoadmaps(prev => [...prev, newRoadmap]);
    showToast(`Đã tạo Roadmap mới cho vị trí "${targetRole}"!`, 'success');
    return newRoadmap;
  };

  const updateRoadmap = (roadmapId, data) => {
    setRoadmaps(prev =>
      prev.map(rm => (rm.id === roadmapId ? { ...rm, ...data } : rm))
    );
    showToast('Đã cập nhật thông tin Roadmap!', 'success');
  };

  const deleteRoadmap = (roadmapId) => {
    setRoadmaps(prev => prev.filter(rm => rm.id !== roadmapId));
    showToast('Đã xóa Roadmap khỏi hệ thống.', 'info');
  };

  const addRoadmapTopic = (roadmapId, topicData) => {
    const newTopic = {
      id: `tp-${Date.now()}`,
      title: topicData.title,
      completed: false,
      estimatedTime: topicData.estimatedTime || '5 giờ',
      resource: topicData.resource || 'Tài liệu tham khảo',
      url: topicData.url || 'https://spring.io',
      resourceType: topicData.resourceType || 'Official Documentation'
    };

    setRoadmaps(prev =>
      prev.map(rm => {
        if (rm.id === roadmapId) {
          return {
            ...rm,
            topics: [...rm.topics, newTopic]
          };
        }
        return rm;
      })
    );
    showToast('Đã thêm bài học mới vào Roadmap!', 'success');
  };

  const updateRoadmapTopic = (roadmapId, topicId, updatedData) => {
    setRoadmaps(prev =>
      prev.map(rm => {
        if (rm.id === roadmapId) {
          return {
            ...rm,
            topics: rm.topics.map(tp => (tp.id === topicId ? { ...tp, ...updatedData } : tp))
          };
        }
        return rm;
      })
    );
    showToast('Đã cập nhật chủ đề Roadmap!', 'success');
  };

  const deleteRoadmapTopic = (roadmapId, topicId) => {
    setRoadmaps(prev =>
      prev.map(rm => {
        if (rm.id === roadmapId) {
          return {
            ...rm,
            topics: rm.topics.filter(tp => tp.id !== topicId)
          };
        }
        return rm;
      })
    );
    showToast('Đã xóa chủ đề khỏi Roadmap.', 'info');
  };

  const reorderRoadmapTopic = (roadmapId, topicId, direction) => {
    setRoadmaps(prev =>
      prev.map(rm => {
        if (rm.id === roadmapId) {
          const index = rm.topics.findIndex(tp => tp.id === topicId);
          if (index === -1) return rm;
          const targetIndex = direction === 'up' ? index - 1 : index + 1;
          if (targetIndex < 0 || targetIndex >= rm.topics.length) return rm;

          const newTopics = [...rm.topics];
          const [moved] = newTopics.splice(index, 1);
          newTopics.splice(targetIndex, 0, moved);

          return { ...rm, topics: newTopics };
        }
        return rm;
      })
    );
    showToast('Đã thay đổi thứ tự chủ đề Roadmap!', 'info');
  };

  const loginWithApi = async (email, password, authProvider = 'AUTO') => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, authProvider }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Email hoặc mật khẩu không chính xác.');
      const user = data.data;
      localStorage.setItem('careerfit_token', user.token);
      localStorage.setItem('careerfit_current_user', JSON.stringify(user));
      setCurrentUser(user);
      setActivePage(user.role === 'EMPLOYER' ? 'employer-dashboard' : (user.role === 'ADMIN' ? 'admin-dashboard' : 'candidate-dashboard'));
      showToast('Đăng nhập thành công!', 'success');
      return true;
    } catch (e) {
      showToast(e.message || 'Email hoặc mật khẩu không chính xác.', 'danger');
      return false;
    }
  };

  const registerCandidateWithApi = async (data) => {
    try {
      await authApi.registerCandidate(data);
      showToast('Đăng ký thành công!.', 'success');
      return true;
    } catch (e) {
      throw e;
    }
  };

  const registerEmployerWithApi = async (data) => {
    try {
      await authApi.registerEmployer(data);
      showToast('Đăng ký thành công!.', 'success');
      return true;
    } catch (e) {
      throw e;
    }
  };

  const logoutWithApi = () => {
    localStorage.removeItem('careerfit_token');
    localStorage.removeItem('careerfit_current_user');
    setCurrentUser(null);
    setActivePage('home');
    showToast('Đã đăng xuất khỏi hệ thống.', 'info');
  };

  const selectedJob = jobs.find(j => j.id === selectedJobId) || jobs[0];

  return (
    <AppContext.Provider
      value={{
        usersDB,
        currentUser,
        setCurrentUser,
        login,
        logout,
        resetPassword,
        registerCandidate,
        registerEmployer,
        registerGoogle,
        activePage,
        setActivePage,
        candidateProfile,
        setCandidateProfile,
        currentRole,
        setCurrentRole,
        companies,
        setCompanies,
        currentEmployerCompany,
        employerProfile,
        setEmployerProfile,
        jobs,
        setJobs,
        selectedJob,
        setSelectedJobId,
        savedJobIds,
        toggleSaveJob,
        applications,
        roadmaps,
        employerVerifications,
        reportedJobs,
        skillsCatalog,
        notifications,
        addNotification,
        markAllNotificationsAsRead,
        toasts,
        showToast,
        updateCandidateSkills,
        uploadCandidateCV,
        deleteCandidateCV,
        toggleRoadmapTopic,
        applyForJob,
        cancelApplication,
        updateApplicationStatus,
        createJob,
        updateJob,
        reportJob,
        toggleLockUser,
        handleApproveVerification,
        handleRejectVerification,
        handleApproveJobModeration,
        handleRejectJobModeration,
        handleRemoveApprovedJob,
        deleteEmployerJob,
        handleDismissReport,
        handleResolveReport,
        addSkillToCatalog,
        updateSkillCatalog,
        removeSkillFromCatalog,
        createRoadmap,
        updateRoadmap,
        deleteRoadmap,
        addRoadmapTopic,
        updateRoadmapTopic,
        deleteRoadmapTopic,
        reorderRoadmapTopic,
        isSidebarCollapsed,
        toggleSidebar,
        setIsSidebarCollapsed,
        isMobileDrawerOpen,
        toggleMobileDrawer,
        setIsMobileDrawerOpen,
        isAIModalOpen,
        setIsAIModalOpen,
        isReportModalOpen,
        setIsReportModalOpen,
        interviewModalAppId,
        setInterviewModalAppId,
        viewingCVModalCandidate,
        setViewingCVModalCandidate,
        globalSearchQuery,
        setGlobalSearchQuery,
        loginWithApi,
        registerCandidateWithApi,
        registerEmployerWithApi,
        logoutWithApi,
        authApi,
        candidateApi,
        employerApi,
        jobApi
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}

