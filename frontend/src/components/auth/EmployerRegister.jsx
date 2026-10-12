import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { employerApi } from '../../services/apiService';
import { getPasswordError } from '../../utils/passwordValidation';
import './CandidateOnboarding.css';
import './EmployerRegister.css';
import { VerificationBadge } from '../common/Badge';
import {
  Building2,
  FileCheck,
  ArrowRight,
  UploadCloud,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Eye,
  EyeOff,
  FileText,
  Loader2
} from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || 'http://localhost:8080';

export function EmployerRegister() {
  const {
    currentUser,
    employerProfile,
    setEmployerProfile,
    setCompanies,
    setEmployerVerifications,
    setJobs,
    setActivePage,
    setCurrentRole,
    showToast
  } = useApp();

  const isEmployerUser = currentUser && currentUser.role === 'EMPLOYER';
  const [justRegisteredProfile, setJustRegisteredProfile] = useState(null);

  // If user just registered in this session, show that profile; if logged in as employer, show employerProfile; else null
  const activeProfile = justRegisteredProfile || (isEmployerUser ? employerProfile : null);

  const isVerified = activeProfile?.verificationStatus === 'Verified';
  const isPending = activeProfile?.verificationStatus === 'Pending';
  const isRejected = activeProfile?.verificationStatus === 'Rejected';

  // Toggle mode: start in status tab only if user just registered or is a logged-in employer with an active status
  const [activeTab, setActiveTab] = useState(isVerified || isPending || isRejected ? 'status' : 'register');

  // Registration Form State
  const [formData, setFormData] = useState({
    recruiterName: (isEmployerUser ? employerProfile?.recruiterName : '') || '',
    email: (isEmployerUser ? employerProfile?.email : '') || '',
    password: '',
    confirmPassword: '',
    phone: (isEmployerUser ? employerProfile?.phone : '') || '',
    companyName: (isEmployerUser ? employerProfile?.companyName : '') || '',
    taxId: (isEmployerUser ? employerProfile?.taxId : '') || '',
    companySize: '',
    industry: '',
    website: '',
    location: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [actualFile, setActualFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const [docFile, setDocFile] = useState(activeProfile?.businessLicenseDoc || null);
  const [docName, setDocName] = useState(activeProfile?.businessLicenseDoc || '');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Resubmit state
  const [resubmitDocName] = useState('GPKD_Updated_2026.pdf');
  const [resubmitUploaded, setResubmitUploaded] = useState(false);

  const [errors, setErrors] = useState({});
  const [passwordTouched, setPasswordTouched] = useState(false);
  const passwordError = (passwordTouched || formData.password) ? getPasswordError(formData.password) : '';
  const updateField = (name, value) => {
    setFormData(previous => ({ ...previous, [name]: value }));
    setErrors(previous => ({ ...previous, [name]: '' }));
  };
  const selectLicense = (file) => {
    if (!file) return;
    if (!/\.(pdf|png|jpe?g)$/i.test(file.name)) {
      setErrors(previous => ({ ...previous, license: 'Chọn tệp PDF, PNG hoặc JPG.' }));
      return;
    }
    if (!file.size || file.size > 10 * 1024 * 1024) {
      setErrors(previous => ({ ...previous, license: 'Tệp phải có nội dung và không quá 10 MB.' }));
      return;
    }
    setActualFile(file);
    setDocFile(file.name);
    setDocName(file.name);
    setErrors(previous => ({ ...previous, license: '' }));
  };
  const handleFileChange = event => {
    selectLicense(event.target.files?.[0]);
    event.target.value = '';
  };

  const handleNewRegistration = async (e) => {
    e.preventDefault();
    const cleanEmail = isEmployerUser ? (currentUser?.email || formData.email).trim() : formData.email.trim();
    const cleanPhone = formData.phone.replace(/\s+/g, '');
    const nextErrors = {};
    if (formData.recruiterName.trim().length < 2) nextErrors.recruiterName = 'Vui lòng nhập họ và tên (ít nhất 2 ký tự).';
    if (!isEmployerUser) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        nextErrors.email = 'Vui lòng nhập email hợp lệ.';
      }
      nextErrors.password = getPasswordError(formData.password);
      if (!formData.confirmPassword) nextErrors.confirmPassword = 'Vui lòng nhập lại mật khẩu.';
      else if (formData.password !== formData.confirmPassword) nextErrors.confirmPassword = 'Mật khẩu xác nhận không khớp.';
    }
    if (!/^(03|05|07|08|09)\d{8}$/.test(cleanPhone)) nextErrors.phone = 'Nhập 10 chữ số, bắt đầu bằng 03, 05, 07, 08 hoặc 09.';
    if (!formData.location.trim()) nextErrors.location = 'Vui lòng nhập tỉnh hoặc thành phố.';
    if (formData.companyName.trim().length < 2) nextErrors.companyName = 'Vui lòng nhập tên doanh nghiệp theo giấy phép.';
    if (!formData.taxId.trim()) nextErrors.taxId = 'Vui lòng nhập mã số thuế.';
    if (formData.website && !/^https?:\/\/[^\s.]+\.[^\s]+$/i.test(formData.website)) nextErrors.website = 'Nhập địa chỉ website bắt đầu bằng https:// hoặc http://.';
    if (!actualFile) nextErrors.license = 'Vui lòng đính kèm giấy phép kinh doanh.';
    if (!agreeTerms) nextErrors.terms = 'Vui lòng xác nhận cam kết trước khi đăng ký.';
    setErrors(nextErrors);
    if (!isEmployerUser) setPasswordTouched(true);
    const firstError = Object.keys(nextErrors).find(key => nextErrors[key]);
    if (firstError) {
      document.getElementById('employer-' + firstError)?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEmployerUser) {
        const formPayload = new FormData();
        formPayload.append('recruiterName', formData.recruiterName.trim());
        formPayload.append('companyName', formData.companyName.trim());
        formPayload.append('phone', cleanPhone);
        formPayload.append('taxId', formData.taxId.trim());
        formPayload.append('location', formData.location.trim());
        formPayload.append('industry', formData.industry.trim());
        formPayload.append('website', formData.website || '');
        formPayload.append('companySize', formData.companySize || '');
        if (actualFile) formPayload.append('licenseFile', actualFile);

        const result = await employerApi.submitVerification(formPayload);
        const backendCompany = result?.data || result;

        const updatedProfile = {
          id: backendCompany?.id || employerProfile?.id || `comp-${Date.now()}`,
          ownerUserId: currentUser?.id,
          recruiterName: formData.recruiterName.trim(),
          email: cleanEmail,
          companyName: formData.companyName.trim(),
          taxId: formData.taxId.trim(),
          companySize: formData.companySize,
          industry: formData.industry,
          website: formData.website,
          location: formData.location,
          businessLicenseDoc: backendCompany?.businessLicenseFile || docName,
          verificationStatus: 'Pending',
          rejectionReason: '',
          logo: backendCompany?.logo || employerProfile?.logo || '🏢',
          phone: cleanPhone,
        };

        setJustRegisteredProfile(updatedProfile);
        if (typeof setEmployerProfile === 'function') {
          try { setEmployerProfile(updatedProfile); } catch (err2) { console.warn(err2); }
        }
        if (typeof setCompanies === 'function') {
          try {
            setCompanies(prev => {
              const list = Array.isArray(prev) ? prev : [];
              const idx = list.findIndex(c => c.id === updatedProfile.id || c.ownerUserId === currentUser?.id || c.email?.toLowerCase() === cleanEmail.toLowerCase());
              if (idx >= 0) return list.map((c, i) => i === idx ? { ...c, ...updatedProfile } : c);
              return [updatedProfile, ...list];
            });
          } catch (err2) { console.warn(err2); }
        }
        if (typeof setEmployerVerifications === 'function') {
          try {
            setEmployerVerifications(prev => [
              {
                id: backendCompany?.id || `ver-${Date.now()}`,
                companyId: updatedProfile.id,
                companyName: formData.companyName.trim(),
                submittedDate: new Date().toLocaleDateString('vi-VN'),
                status: 'Pending',
                documentName: backendCompany?.businessLicenseFile || docName,
                website: formData.website,
                industry: formData.industry,
                location: formData.location,
                rejectReason: ''
              },
              ...(Array.isArray(prev) ? prev.filter(v => v.companyId !== updatedProfile.id) : [])
            ]);
          } catch (err2) { console.warn(err2); }
        }
        if (typeof setJobs === 'function' && formData.companyName.trim()) {
          try {
            setJobs(prev => {
              const list = Array.isArray(prev) ? prev : [];
              return list.map(j => {
                const isMyJob = (currentUser?.id && j.employerId === currentUser.id) ||
                                (employerProfile?.ownerUserId && j.employerId === employerProfile.ownerUserId) ||
                                (employerProfile?.id && j.employerId === employerProfile.id) ||
                                (employerProfile?.companyName && j.company === employerProfile.companyName);
                if (isMyJob) {
                  return { ...j, company: formData.companyName.trim(), employerId: currentUser?.id || j.employerId };
                }
                return j;
              });
            });
          } catch (err3) { console.warn(err3); }
        }
        setActiveTab('status');
        showToast('Hồ sơ xác minh đã được gửi tới Ban Quản trị xét duyệt!', 'success');
        return;
      }

      const formPayload = new FormData();
      formPayload.append('recruiterName', formData.recruiterName.trim());
      formPayload.append('companyName', formData.companyName.trim());
      formPayload.append('email', cleanEmail);
      formPayload.append('username', cleanEmail.split('@')[0].toLowerCase());
      formPayload.append('password', formData.password);
      formPayload.append('confirmPassword', formData.confirmPassword);
      formPayload.append('phone', cleanPhone);
      formPayload.append('taxId', formData.taxId.trim());
      formPayload.append('location', formData.location.trim());
      formPayload.append('industry', formData.industry.trim());
      formPayload.append('website', formData.website || '');
      formPayload.append('licenseFile', actualFile);

      const res = await fetch(`${BACKEND_URL}/api/auth/register/employer`, {
        method: 'POST',
        body: formPayload
      });

      let data = {};
      try { data = await res.json(); } catch (parseErr) { console.warn('Response JSON parse warning:', parseErr); }

      if (!res.ok) {
        let errorMsg = data.message || 'Đăng ký doanh nghiệp không thành công.';
        if (data.errors && typeof data.errors === 'object') {
          const detailList = Object.values(data.errors);
          if (detailList.length > 0) errorMsg = detailList.join(' | ');
          setErrors(data.errors);
        }
        showToast(errorMsg, 'danger');
        return;
      }

      const newCompId = `comp-${Date.now()}`;
      const updatedProfile = {
        id: newCompId,
        recruiterName: formData.recruiterName.trim(),
        email: cleanEmail,
        companyName: formData.companyName.trim(),
        taxId: formData.taxId.trim(),
        companySize: formData.companySize,
        industry: formData.industry,
        website: formData.website,
        location: formData.location,
        businessLicenseDoc: docName,
        verificationStatus: 'Pending',
        rejectionReason: '',
        logo: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&w=120&h=120&q=80',
        verified: false
      };

      setJustRegisteredProfile(updatedProfile);
      if (typeof setEmployerProfile === 'function') {
        try { setEmployerProfile(updatedProfile); } catch (e) { console.warn('setEmployerProfile error:', e); }
      }
      if (typeof setCurrentRole === 'function') {
        try { setCurrentRole('employer'); } catch (e) { console.warn('setCurrentRole error:', e); }
      }
      if (typeof setCompanies === 'function') {
        try {
          setCompanies(prev => {
            const list = Array.isArray(prev) ? prev : [];
            const exists = list.find(c => c.companyName.toLowerCase() === formData.companyName.trim().toLowerCase());
            if (exists) return list.map(c => c.id === exists.id ? { ...c, ...updatedProfile, verificationStatus: 'Pending' } : c);
            return [updatedProfile, ...list];
          });
        } catch (e) { console.warn('setCompanies error:', e); }
      }
      if (typeof setEmployerVerifications === 'function') {
        try {
          setEmployerVerifications(prev => [
            {
              id: `ver-${Date.now()}`,
              companyId: newCompId,
              companyName: formData.companyName.trim(),
              submittedDate: new Date().toLocaleDateString('vi-VN'),
              status: 'Pending',
              documentName: docName,
              website: formData.website,
              industry: formData.industry,
              location: formData.location,
              rejectReason: ''
            },
            ...(Array.isArray(prev) ? prev : [])
          ]);
        } catch (e) { console.warn('setEmployerVerifications error:', e); }
      }

      setActiveTab('status');
      showToast('Đăng ký tài khoản Doanh nghiệp thành công! Hồ sơ GPKD đã được gửi tới Ban Quản trị xét duyệt.', 'success');
    } catch (err) {
      console.error('Employer register error:', err);
      const isFetchError = err && (err.name === 'TypeError' || err.message?.includes('fetch') || err.message?.includes('NetworkError'));
      if (isFetchError) {
        showToast('Không thể kết nối đến máy chủ backend (Port 8080). Vui lòng thử lại sau giây lát.', 'danger');
      } else {
        showToast(err?.message || 'Có lỗi xảy ra trong quá trình đăng ký. Vui lòng thử lại!', 'danger');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResubmitVerification = (e) => {
    e.preventDefault();
    const targetComp = activeProfile || employerProfile;
    if (typeof setCompanies === 'function') {
      try {
        setCompanies(prev => {
          const list = Array.isArray(prev) ? prev : [];
          return list.map(c => (c.id === targetComp?.id || c.companyName === targetComp?.companyName ? { ...c, verificationStatus: 'Pending', rejectionReason: '' } : c));
        });
      } catch (err) {
        console.warn('setCompanies resubmit warning:', err);
      }
    }
    if (typeof setEmployerProfile === 'function') {
      try {
        setEmployerProfile(prev => ({ ...(prev || targetComp), verificationStatus: 'Pending', rejectionReason: '' }));
      } catch (err) {
        console.warn('setEmployerProfile resubmit warning:', err);
      }
    }
    if (justRegisteredProfile) {
      setJustRegisteredProfile(prev => ({ ...prev, verificationStatus: 'Pending', rejectionReason: '' }));
    }
    if (typeof setEmployerVerifications === 'function') {
      try {
        setEmployerVerifications(prev => [
          {
            id: `ver-${Date.now()}`,
            companyId: targetComp?.id || `comp-${Date.now()}`,
            companyName: targetComp?.companyName || 'Doanh nghiệp',
            submittedDate: new Date().toLocaleDateString('vi-VN'),
            status: 'Pending',
            documentName: resubmitDocName,
            website: targetComp?.website,
            industry: targetComp?.industry,
            location: targetComp?.location,
            rejectReason: ''
          },
          ...(Array.isArray(prev) ? prev : [])
        ]);
      } catch (err) {
        console.warn('setEmployerVerifications resubmit warning:', err);
      }
    }
    showToast('Đã gửi lại yêu cầu xác minh doanh nghiệp tới Ban Quản trị!', 'success');
  };

  const field = (name, label, placeholder, type = 'text', required = false) => <div className="form-group">
    <label className="form-label" htmlFor={'employer-' + name}>{label}{required && ' *'}</label>
    <input id={'employer-' + name} className="form-control" type={type} value={formData[name]} placeholder={placeholder} onChange={event => updateField(name, event.target.value)} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? 'employer-' + name + '-error' : undefined} />
    {errors[name] && <p id={'employer-' + name + '-error'} className="candidate-field-error" role="alert">{errors[name]}</p>}
  </div>;

  return (
    <div className={`candidate-onboarding employer-register ${isEmployerUser ? 'employer-verification-page' : ''}`}>
      <header className="candidate-intro"><p className="candidate-eyebrow">Dành cho doanh nghiệp</p><h1>{isEmployerUser ? 'Xác minh doanh nghiệp' : 'Đăng ký tài khoản Nhà tuyển dụng'}</h1><p>{isEmployerUser ? 'Quản lý thông tin pháp lý và trạng thái xác minh của doanh nghiệp.' : 'Tạo tài khoản để quản lý hồ sơ doanh nghiệp và tuyển dụng nhân sự công nghệ.'}</p></header>
      {activeProfile && <nav className="employer-tabs" aria-label="Hồ sơ doanh nghiệp"><button type="button" aria-current={activeTab === 'register' ? 'page' : undefined} onClick={() => setActiveTab('register')}>Thông tin đăng ký</button><button type="button" aria-current={activeTab === 'status' ? 'page' : undefined} onClick={() => setActiveTab('status')}>Trạng thái xác minh</button></nav>}
      {activeTab === 'register' && <form noValidate onSubmit={handleNewRegistration} className="candidate-form-card employer-form">
        <section>
          <h3>1. Thông tin người liên hệ / HR<span>* Trường bắt buộc</span></h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {field('recruiterName', 'Họ và tên', 'Ví dụ: Trần Thị Hà', 'text', true)}
            {isEmployerUser ? (
              <div className="form-group">
                <label className="form-label">Email tài khoản</label>
                <input className="form-control" type="email" value={currentUser?.email || formData.email} readOnly disabled style={{background:'#f8f9fa',cursor:'not-allowed',color:'#6c757d'}} />
                <p className="candidate-input-hint">Email liên kết với tài khoản hiện tại của bạn.</p>
              </div>
            ) : field('email', 'Email c\u00f4ng vi\u1ec7c', 'V\u00ed d\u1ee5: hr@congty.vn', 'email', true)}
            {!isEmployerUser && (<><div className="form-group"><label className="form-label" htmlFor="employer-password">Mật khẩu *</label><div className="relative"><input id="employer-password" className="form-control pr-10" type={showPassword ? 'text' : 'password'} autoComplete="new-password" maxLength={100} placeholder="Tối thiểu 8 ký tự" value={formData.password} onChange={event => updateField('password', event.target.value)} onBlur={() => setPasswordTouched(true)} aria-invalid={Boolean(passwordError)} aria-describedby="employer-password-help employer-password-error" /><button type="button" className="candidate-password-toggle" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setShowPassword(previous => !previous)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div><p id="employer-password-help" className="candidate-input-hint">Ít nhất 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt.</p><p id="employer-password-error" className={passwordError ? 'candidate-field-error' : 'candidate-password-valid'} aria-live="polite">{passwordError || (formData.password ? 'Mật khẩu đáp ứng yêu cầu.' : '')}</p></div>
            <div className="form-group"><label className="form-label" htmlFor="employer-confirmPassword">Xác nhận mật khẩu *</label><input id="employer-confirmPassword" className="form-control" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Nhập lại mật khẩu" value={formData.confirmPassword} onChange={event => updateField('confirmPassword', event.target.value)} aria-invalid={Boolean(errors.confirmPassword || (formData.confirmPassword && formData.password !== formData.confirmPassword))} />{(errors.confirmPassword || (formData.confirmPassword && formData.password !== formData.confirmPassword)) && <p className="candidate-field-error" role="alert">{errors.confirmPassword || 'Mật khẩu xác nhận không khớp.'}</p>}</div></>)}
            {field('phone', 'Số điện thoại', 'Ví dụ: 0908 678 910', 'tel', true)}
            {field('location', 'Tỉnh / Thành phố', 'Ví dụ: TP. Hồ Chí Minh', 'text', true)}
          </div>
        </section>
        <section>
          <h3>2. Thông tin pháp lý doanh nghiệp</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">{field('companyName', 'Tên công ty theo giấy phép kinh doanh', 'Ví dụ: Công ty TNHH Công nghệ ABC', 'text', true)}</div>
            {field('taxId', 'Mã số thuế', 'Ví dụ: 0312345678', 'text', true)}
            <div className="form-group"><label className="form-label" htmlFor="employer-companySize">Quy mô công ty</label><select id="employer-companySize" className="form-control" value={formData.companySize} onChange={event => updateField('companySize', event.target.value)}><option value="" disabled>Chọn quy mô công ty</option>{['1 - 20 nhân sự', '20 - 50 nhân sự', '50 - 200 nhân sự', '200 - 500 nhân sự', 'Trên 500 nhân sự'].map(value => <option key={value}>{value}</option>)}</select></div>
            {field('industry', 'Lĩnh vực hoạt động', 'Ví dụ: Công nghệ thông tin / Phần mềm')}
            {field('website', 'Website doanh nghiệp', 'Ví dụ: https://congty.vn', 'url')}
          </div>
        </section>
        <section>
          <h3>3. Giấy phép kinh doanh *</h3>
          <p className="candidate-section-description">Đính kèm bản scan rõ nội dung để xác minh thông tin doanh nghiệp.</p>
          <input ref={fileInputRef} id="employer-license" type="file" accept=".pdf,.png,.jpg,.jpeg" className="sr-only" aria-label="Giấy phép kinh doanh" onChange={handleFileChange} />
          <div className="candidate-dropzone" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); selectLicense(event.dataTransfer.files[0]); }}><FileText aria-hidden="true" /><h4>Kéo thả giấy phép kinh doanh vào đây</h4><p>PDF, PNG hoặc JPG · Tối đa 10 MB</p><button type="button" className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>Chọn từ thiết bị</button></div>
          {docFile && <div className="candidate-cv-file"><FileText aria-hidden="true" /><div><strong>{docName}</strong><p>{actualFile ? (actualFile.size / 1024 / 1024).toFixed(2) + ' MB · Sẵn sàng gửi xác minh' : 'Tài liệu đã đính kèm'}</p></div><button type="button" aria-label="Bỏ giấy phép đã chọn" onClick={() => { setActualFile(null); setDocFile(null); setDocName(''); }}><XCircle size={18} /></button></div>}
          {errors.license && <p className="candidate-field-error" role="alert">{errors.license}</p>}
        </section>
        <div className="employer-submit-row"><div className="candidate-terms"><label><input id="employer-terms" type="checkbox" checked={agreeTerms} onChange={event => { setAgreeTerms(event.target.checked); setErrors(previous => ({ ...previous, terms: '' })); }} />Tôi cam kết thông tin cung cấp là chính xác và đồng ý với điều khoản dịch vụ của CareerFit.</label>{errors.terms && <p className="candidate-field-error" role="alert">{errors.terms}</p>}</div><button type="submit" disabled={isSubmitting} className="btn btn-primary">{isSubmitting ? <><Loader2 size={18} className="animate-spin" /> Đang gửi hồ sơ...</> : <>{isEmployerUser ? 'Gửi hồ sơ xác minh' : 'Đăng ký tài khoản'} <ArrowRight size={16} /></>}</button></div>
      </form>}

      {/* TAB 2: STATUS & VERIFICATION DASHBOARD */}
      {activeTab === 'status' && (() => {
        const targetCompany = activeProfile || (isEmployerUser ? employerProfile : null) || employerProfile || {};
        return (
        <div className="space-y-6">
          {/* 1. IF VERIFIED: SHOW VERIFIED CARD */}
          {isVerified && (
            <div className="verification-result-card bg-white rounded-3xl border border-slate-200 p-8 shadow-sm text-center space-y-5">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200 shadow-inner">
                <CheckCircle2 size={36} />
              </div>

              <div className="max-w-md mx-auto space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <h3 className="text-xl font-black text-slate-900">{targetCompany.companyName}</h3>
                  <VerificationBadge status="Verified" />
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Doanh nghiệp của bạn đã được Ban Quản trị (Admin) kiểm duyệt Giấy phép kinh doanh hợp lệ và cấp đầy đủ quyền đăng tin tuyển dụng.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 max-w-lg mx-auto text-left text-xs space-y-2 text-slate-700">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-400">Trạng thái pháp lý:</span>
                  <strong className="text-emerald-700 font-bold">VERIFIED (Đã xác minh)</strong>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-400">Mã số thuế:</span>
                  <strong className="font-mono">{targetCompany.taxId || 'Chưa cập nhật'}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-400">Tài liệu đã duyệt:</span>
                  <strong className="text-blue-600">{targetCompany.businessLicenseFile || targetCompany.businessLicenseDoc || 'Chưa có tài liệu'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Người đại diện HR:</span>
                  <strong>{targetCompany.recruiterName} ({targetCompany.email})</strong>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setActivePage('company-profile')}
                  className="btn btn-secondary text-xs font-semibold"
                >
                  <Building2 size={15} /> Xem hồ sơ doanh nghiệp
                </button>
                <button
                  onClick={() => setActivePage('create-job')}
                  className="btn btn-primary text-xs font-bold bg-indigo-600 hover:bg-indigo-700"
                >
                  + Đăng tin tuyển dụng mới
                </button>
              </div>
            </div>
          )}

          {/* 2. IF PENDING: SHOW TIMELINE */}
          {isPending && (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="text-amber-600 shrink-0" size={24} />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">Trạng thái: Đang chờ kiểm duyệt (Pending)</h4>
                      <VerificationBadge status="Pending" />
                    </div>
                    <p className="text-xs text-amber-900 mt-0.5">
                      Hồ sơ Giấy phép kinh doanh của bạn đang được Ban Quản trị (Admin) đối soát với Cơ quan Thuế.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 max-w-lg mx-auto">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-center">Tiến trình xét duyệt</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-900">1. Đăng ký tài khoản Doanh nghiệp</p>
                      <p className="text-[11px] text-slate-500">Người đại diện: {targetCompany.recruiterName || 'Chưa chọn'} ({targetCompany.email})</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-900">2. Tải lên tài liệu GPKD</p>
                      <p className="text-[11px] text-slate-500">File: {targetCompany.businessLicenseFile || targetCompany.businessLicenseDoc || docName || 'GPKD_DoanhNghiep.pdf'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs animate-pulse">
                    <RefreshCw size={18} className="text-amber-600 shrink-0 animate-spin" />
                    <div>
                      <p className="font-bold text-amber-950">3. Admin kiểm duyệt tính hợp lệ</p>
                      <p className="text-[11px] text-amber-800">Dự kiến hoàn thành trong 1-2 giờ làm việc</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center pt-2">
                <button
                  onClick={() => setActivePage('employer-dashboard')}
                  className="btn btn-secondary text-xs font-semibold"
                >
                  Quay lại Dashboard Doanh nghiệp
                </button>
              </div>
            </div>
          )}

          {/* 3. IF REJECTED: SHOW REJECTION & RESUBMISSION */}
          {isRejected && (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-2 text-rose-900">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm flex items-center gap-2">
                    <XCircle size={18} className="text-rose-600" /> Xác minh Doanh nghiệp bị từ chối
                  </h4>
                  <VerificationBadge status="Rejected" />
                </div>
                <p className="text-xs leading-relaxed">
                  Lý do từ chối từ Ban Quản trị: <strong className="text-rose-950">{targetCompany.rejectionReason || 'Giấy phép kinh doanh mờ không rõ dấu đỏ hoặc mã số thuế chưa khớp.'}</strong>
                </p>
              </div>

              <form onSubmit={handleResubmitVerification} className="space-y-4 text-xs max-w-lg mx-auto bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <h4 className="font-bold text-slate-900 text-sm">Gửi lại Tài liệu Giấy phép Kinh doanh mới</h4>
                <p className="text-slate-500 text-[11px]">Vui lòng tải lên bản quét GPKD rõ nét có mộc đỏ hợp lệ.</p>

                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center space-y-2 bg-white">
                  <FileCheck size={36} className="mx-auto text-indigo-600" />
                  <p className="font-bold text-slate-800 text-xs">{resubmitDocName}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setResubmitUploaded(true);
                      showToast('Đã chọn bản GPKD mới!', 'success');
                    }}
                    className="btn btn-secondary btn-sm text-xs"
                  >
                    <UploadCloud size={14} /> {resubmitUploaded ? 'Đã chọn File mới' : 'Chọn bản GPKD bổ sung'}
                  </button>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    className="btn btn-primary text-xs font-bold w-full py-2.5 bg-indigo-600 hover:bg-indigo-700"
                  >
                    Gửi lại yêu cầu xác minh
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 4. IF NOT VERIFIED & NOT PENDING & NOT REJECTED */}
          {!isVerified && !isPending && !isRejected && (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm text-center space-y-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
                <Building2 size={24} />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Chưa có thông tin xác minh doanh nghiệp</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Bạn chưa hoàn thành biểu mẫu đăng ký doanh nghiệp. Vui lòng bấm vào tab "Biểu mẫu Đăng ký Doanh nghiệp" ở trên để gửi hồ sơ.
              </p>
              <button
                onClick={() => setActiveTab('register')}
                className="btn btn-secondary text-xs font-bold bg-indigo-600 text-white"
              >
                Đi tới Biểu mẫu Đăng ký
              </button>
            </div>
          )}
        </div>
        );
      })()}
    </div>
  );
}


