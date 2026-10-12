import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import './CandidateOnboarding.css';
import './OAuthRegister.css';
import {
  User, Building2, CheckCircle2, FileText, X, ArrowRight, Loader2
} from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || 'http://localhost:8080';

const LEVELS = [
  { value: 'INTERN', label: 'Intern (Thực tập sinh)' },
  { value: 'FRESHER', label: 'Fresher (Dưới 1 năm)' },
  { value: 'JUNIOR', label: 'Junior (1-3 năm)' },
  { value: 'MIDDLE', label: 'Middle (3-5 năm)' },
  { value: 'SENIOR', label: 'Senior (Trên 5 năm)' },
];

const CITIES = [
  'TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ',
  'Hải Phòng', 'Bình Dương', 'Đồng Nai', 'Khác'
];

const InputField = ({ label, name, type = 'text', placeholder, required = true, value, onChange, error }) => (
  <div className="form-group">
    <label className="form-label" htmlFor={'oauth-' + name}>{label}{required && ' *'}</label>
    <input id={'oauth-' + name} className="form-control" type={type} name={name} value={value || ''} onChange={onChange} placeholder={placeholder} aria-invalid={Boolean(error)} aria-describedby={error ? 'oauth-' + name + '-error' : undefined} />
    {error && <p id={'oauth-' + name + '-error'} className="candidate-field-error" role="alert">{error}</p>}
  </div>
);

export function OAuthRegister() {
  const { setActivePage, setCurrentUser, showToast, setCandidateProfile, setEmployerVerifications } = useApp();

  const [tempToken, setTempToken] = useState(null);
  const [prefillEmail, setPrefillEmail] = useState('');
  const [authProvider, setAuthProvider] = useState('GOOGLE'); // Default to Google
  const [roleMode, setRoleMode] = useState('candidate'); // 'candidate' | 'employer'
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    targetRole: '',
    level: '',
    location: '',
    companyName: '',
    industry: '',
    website: '',
    taxId: ''
  });
  const [licenseFile, setLicenseFile] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('careerfit_register_token');
    
    if (token) {

        try {
        // Xử lý giải mã Base64 sang tiếng Việt (UTF-8) chuẩn
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const payload = JSON.parse(jsonPayload);
        const email = (payload.sub || payload.email || '').toLowerCase();

        // If this is the designated system administrator, auto-complete and direct to admin-dashboard
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
        
        if (!email || (payload.exp && payload.exp * 1000 <= Date.now())) return;
        setTempToken(token);
        setPrefillEmail(email);
        if (payload.provider) setAuthProvider(payload.provider.toUpperCase());
        
        setFormData(previous => ({ ...previous, email }));
      } catch {
        console.error("Invalid token format");
      }
    }
  }, [setActivePage, setCurrentUser, showToast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors = {};

    // --- Họ và tên ---
    const name = formData.fullName.trim();
    if (!name) {
      newErrors.fullName = 'Họ và tên không được để trống.';
    } else if (name.length < 2) {
      newErrors.fullName = 'Họ và tên phải có ít nhất 2 ký tự.';
    } else if (!/^[\p{L}\s]+$/u.test(name)) {
      newErrors.fullName = 'Họ và tên chỉ được chứa chữ cái và khoảng trắng.';
    } else if (name.split(/\s+/).filter(Boolean).length < 2) {
      newErrors.fullName = 'Vui lòng nhập đầy đủ họ và tên (ít nhất 2 từ).';
    }

    // --- Số điện thoại ---
    const rawPhone = formData.phone.replace(/\s/g, '');
    if (!rawPhone) {
      newErrors.phone = 'Số điện thoại không được để trống.';
    } else if (!/^\d+$/.test(rawPhone)) {
      newErrors.phone = 'Số điện thoại chỉ được chứa chữ số.';
    } else if (rawPhone.length !== 10) {
      newErrors.phone = `Số điện thoại phải đủ 10 chữ số (hiện tại: ${rawPhone.length} số).`;
    } else if (!/^(03|05|07|08|09)/.test(rawPhone)) {
      newErrors.phone = 'Số điện thoại phải bắt đầu bằng 03, 05, 07, 08 hoặc 09.';
    }

    if (!formData.location) newErrors.location = 'Vui lòng chọn tỉnh hoặc thành phố.';

    if (roleMode === 'candidate') {
      // --- Vị trí mục tiêu ---
      if (!formData.targetRole.trim()) {
        newErrors.targetRole = 'Vui lòng nhập vị trí mục tiêu.';
      } else if (formData.targetRole.trim().length < 2) {
        newErrors.targetRole = 'Vị trí mục tiêu phải có ít nhất 2 ký tự.';
      }

      if (!formData.level) newErrors.level = 'Vui lòng chọn trình độ hiện tại.';
    } else {

      // --- Tên công ty ---
      if (!formData.companyName.trim()) {
        newErrors.companyName = 'Tên công ty không được để trống.';
      } else if (formData.companyName.trim().length < 2) {
        newErrors.companyName = 'Tên công ty phải có ít nhất 2 ký tự.';
      }

      // --- Lĩnh vực ---
      if (!formData.industry.trim()) newErrors.industry = 'Vui lòng nhập lĩnh vực hoạt động.';

      // --- Website (nếu có thì phải đúng định dạng) ---
      if (formData.website.trim() && !/^https?:\/\/.+\..+/.test(formData.website.trim())) {
        newErrors.website = 'Website phải bắt đầu bằng http:// hoặc https://.';
      }

      // --- Mã số thuế (nếu có thì phải đủ 10 hoặc 13 số) ---
      if (!/^\d{10}(\d{3})?$/.test(formData.taxId.trim())) {
        newErrors.taxId = 'Mã số thuế phải có 10 hoặc 13 chữ số.';
      }

      // --- Giấy phép kinh doanh ---
      if (!licenseFile) newErrors.licenseFile = 'Vui lòng tải lên Giấy phép kinh doanh.';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      document.getElementById('oauth-' + Object.keys(validationErrors)[0])?.focus();
      return;
    }

    const resolvedLocation = formData.location.trim();
    const resolvedLevel = formData.level.trim();

    if (!tempToken) { showToast('Phiên xác thực đã hết hạn. Vui lòng đăng nhập lại.', 'warning'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('tempToken', tempToken);
      fd.append('email', prefillEmail);
      fd.append('role', roleMode.toUpperCase());
      fd.append('fullName', formData.fullName.trim());
      fd.append('phone', formData.phone.replace(/\s/g, ''));
      fd.append('location', resolvedLocation);
      if (roleMode === 'candidate') {
        fd.append('targetRole', formData.targetRole.trim());
        fd.append('level', resolvedLevel);
      } else {
        for (const name of ['companyName', 'industry', 'website', 'taxId']) fd.append(name, formData[name].trim());
        if (licenseFile) fd.append('licenseFile', licenseFile);
      }
      const res = await fetch(BACKEND_URL + '/api/auth/oauth/complete-registration', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        throw new Error(data.message || 'Không thể hoàn tất đăng ký. Vui lòng kiểm tra lại thông tin.');
      }
      const authData = data.data;
      localStorage.removeItem('careerfit_register_token');
      localStorage.setItem('careerfit_token', authData.token);
      localStorage.setItem('careerfit_current_user', JSON.stringify(authData));
      // Xóa thông báo cũ để tài khoản mới bắt đầu sạch
      localStorage.removeItem('careerfit_notifications');
      setCurrentUser(authData);
      if (roleMode === 'candidate') {
        setCandidateProfile(previous => ({ ...previous, name: formData.fullName.trim(), email: authData.email || prefillEmail, phone: formData.phone.replace(/\s/g, ''), location: resolvedLocation, skills: [], hasCV: false, cvFileName: '', cvUploadDate: '', preferences: { desiredRole: formData.targetRole.trim(), location: resolvedLocation, jobType: '', expectedSalary: '' } }));
      } else if (typeof setEmployerVerifications === 'function') {
        const newVerification = {
          id: `ver-${Date.now()}`,
          companyId: authData.userId || `comp-${Date.now()}`,
          companyName: formData.companyName.trim(),
          representative: formData.fullName.trim(),
          email: authData.email || prefillEmail,
          phone: formData.phone.replace(/\s/g, ''),
          submittedDate: new Date().toLocaleDateString('vi-VN'),
          status: 'Pending',
          documentName: licenseFile?.name || 'Giay_Phep_Kinh_Doanh_Mau.pdf',
          website: formData.website || '',
          industry: formData.industry || '',
          location: resolvedLocation || '',
          taxId: formData.taxId || '0312345678',
          rejectReason: ''
        };
        setEmployerVerifications(prev => [newVerification, ...(Array.isArray(prev) ? prev : [])]);
      }
      setActivePage(roleMode === 'employer' ? 'employer-dashboard' : 'candidate-dashboard');
      showToast('Tạo tài khoản thành công. Chào mừng bạn đến với CareerFit!', 'success');
    } catch (error) {
      showToast(error.message, 'danger');
    } finally {
      setLoading(false);
    }
  };
  const handleGoogleLogin = () => { window.location.href = BACKEND_URL + '/oauth2/authorization/google'; };
  const handleMicrosoftLogin = () => { window.location.href = BACKEND_URL + '/oauth2/authorization/microsoft'; };
  const selectLicense = file => {
    if (!file) return;
    if (!/\.(pdf|png|jpe?g)$/i.test(file.name) || !file.size || file.size > 10 * 1024 * 1024) {
      setErrors(previous => ({ ...previous, licenseFile: 'Chọn tệp PDF, PNG hoặc JPG có nội dung, tối đa 10 MB.' }));
      return;
    }
    setLicenseFile(file);
    setErrors(previous => ({ ...previous, licenseFile: '' }));
  };
  const field = (name, label, placeholder, options = {}) => <InputField name={name} label={label} placeholder={placeholder} value={formData[name]} onChange={handleChange} error={errors[name]} {...options} />;
  const providerButtons = <div className="oauth-provider-actions"><button type="button" onClick={handleGoogleLogin}>Tiếp tục với Google</button><button type="button" onClick={handleMicrosoftLogin}>Tiếp tục với Microsoft</button></div>;

  if (!tempToken) return <div className="candidate-onboarding oauth-onboarding"><header className="candidate-intro"><p className="candidate-eyebrow">Đăng ký qua tài khoản liên kết</p><h1>Kết nối tài khoản của bạn</h1><p>Đăng nhập Google hoặc Microsoft để xác thực email và tạo hồ sơ.</p></header><section className="candidate-form-card oauth-connect-card">{providerButtons}<p className="candidate-section-description">Nếu đã có tài khoản, bạn sẽ được đưa đến trang làm việc. Nếu chưa có, hãy bổ sung thông tin để hoàn tất đăng ký.</p><button type="button" className="oauth-text-button" onClick={() => setActivePage('login')}>Quay lại đăng nhập</button></section></div>;

  return (
    <div className="candidate-onboarding oauth-onboarding">
      <header className="candidate-intro"><p className="candidate-eyebrow">Thiết lập tài khoản</p><h1>Hoàn tất hồ sơ của bạn</h1><p>Email đã được liên kết. Bổ sung thông tin để bắt đầu sử dụng CareerFit.</p></header>
      <form noValidate className="candidate-form-card oauth-form" onSubmit={handleSubmit}>
        <fieldset className="oauth-role-switch" disabled={loading}><legend className="sr-only">Loại tài khoản</legend><button type="button" aria-pressed={roleMode === 'candidate'} onClick={() => { setRoleMode('candidate'); setErrors({}); }}><User aria-hidden="true" /> Ứng viên</button><button type="button" aria-pressed={roleMode === 'employer'} onClick={() => { setRoleMode('employer'); setErrors({}); }}><Building2 aria-hidden="true" /> Doanh nghiệp</button></fieldset>
        <div className="oauth-linked-account"><div className="oauth-account-line"><CheckCircle2 aria-hidden="true" /><div><p>Tài khoản đang liên kết · {authProvider === 'MICROSOFT' ? 'Microsoft' : 'Google'}</p><strong>{prefillEmail}</strong></div></div><div className="oauth-account-switch"><span>Dùng tài khoản khác?</span><button type="button" disabled={loading} onClick={handleGoogleLogin}>Google</button><button type="button" disabled={loading} onClick={handleMicrosoftLogin}>Microsoft</button></div>{errors.email && <p className="candidate-field-error" role="alert">{errors.email}</p>}</div>
        <section>
          <h3>{roleMode === 'candidate' ? 'Thông tin ứng viên' : 'Người liên hệ / HR'}<span>* Trường bắt buộc</span></h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {field('fullName', roleMode === 'employer' ? 'Họ tên người liên hệ' : 'Họ và tên', 'Ví dụ: Nguyễn Văn A')}
            {field('phone', 'Số điện thoại', 'Ví dụ: 0912 345 678', { type: 'tel' })}
            {roleMode === 'candidate' && <>
              {field('targetRole', 'Vị trí mong muốn', 'Ví dụ: Frontend Developer')}
              <div className="form-group"><label htmlFor="oauth-level" className="form-label">Trình độ hiện tại *</label><select id="oauth-level" name="level" className="form-control" value={formData.level} onChange={handleChange} aria-invalid={Boolean(errors.level)}><option value="" disabled>Chọn trình độ</option>{LEVELS.map(level => <option key={level.value} value={level.value}>{level.label}</option>)}</select>{errors.level && <p className="candidate-field-error" role="alert">{errors.level}</p>}</div>
            </>}
            <div className="form-group sm:col-span-2"><label htmlFor="oauth-location" className="form-label">{roleMode === 'employer' ? 'Tỉnh / Thành phố đặt trụ sở' : 'Tỉnh / Thành phố sinh sống'} *</label><select id="oauth-location" name="location" className="form-control" value={formData.location} onChange={handleChange} aria-invalid={Boolean(errors.location)}><option value="" disabled>Chọn tỉnh / thành phố</option>{CITIES.map(city => <option key={city}>{city}</option>)}</select>{errors.location && <p className="candidate-field-error" role="alert">{errors.location}</p>}</div>
          </div>
        </section>
        {roleMode === 'employer' && <>
          <section><h3>Thông tin doanh nghiệp</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-5"><div className="sm:col-span-2">{field('companyName', 'Tên công ty theo giấy phép', 'Ví dụ: Công ty TNHH Công nghệ ABC')}</div>{field('industry', 'Lĩnh vực hoạt động', 'Ví dụ: Công nghệ thông tin')}{field('website', 'Website doanh nghiệp', 'Ví dụ: https://congty.vn', { type: 'url', required: false })}{field('taxId', 'Mã số thuế', 'Ví dụ: 0312345678')}</div></section>
          <section><h3>Giấy phép kinh doanh *</h3><p className="candidate-section-description">Đính kèm tài liệu để xác minh thông tin doanh nghiệp.</p><input ref={fileInputRef} id="oauth-licenseFile" type="file" accept=".pdf,.png,.jpg,.jpeg" aria-label="Giấy phép kinh doanh" className="sr-only" onChange={event => { selectLicense(event.target.files[0]); event.target.value = ''; }} /><div className="candidate-dropzone" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); selectLicense(event.dataTransfer.files[0]); }}><FileText aria-hidden="true" /><h4>Kéo thả giấy phép kinh doanh vào đây</h4><p>PDF, PNG hoặc JPG · Tối đa 10 MB</p><button type="button" className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>Chọn từ thiết bị</button></div>{licenseFile && <div className="candidate-cv-file"><FileText aria-hidden="true" /><div><strong>{licenseFile.name}</strong><p>{(licenseFile.size / 1024 / 1024).toFixed(2)} MB · Sẵn sàng gửi xác minh</p></div><button type="button" aria-label="Bỏ giấy phép đã chọn" onClick={() => setLicenseFile(null)}><X size={18} /></button></div>}{errors.licenseFile && <p className="candidate-field-error" role="alert">{errors.licenseFile}</p>}</section>
        </>}
        <div className="candidate-navigation"><span className="candidate-step-note">{roleMode === 'employer' ? 'Hồ sơ sẽ được gửi để xác minh.' : 'Bạn có thể cập nhật hồ sơ sau.'}</span><button type="submit" disabled={loading} className="btn btn-primary">{loading ? <><Loader2 size={18} className="animate-spin" /> Đang tạo tài khoản...</> : <>Hoàn tất đăng ký <ArrowRight size={16} /></>}</button></div>
      </form>
    </div>
  );
}
