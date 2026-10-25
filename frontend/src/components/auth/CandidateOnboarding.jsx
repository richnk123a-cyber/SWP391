import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, Trash2, Plus, ArrowRight, ArrowLeft, Eye, EyeOff, FileUp, Loader2 } from 'lucide-react';
import { getPasswordError } from '../../utils/passwordValidation';
import './CandidateOnboarding.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || 'http://localhost:8080';
const STEPS = ['Thông tin cơ bản', 'Kỹ năng', 'Hồ sơ CV', 'Mong muốn công việc'];

function Field({ name, label, value, onChange, error, placeholder, type = 'text', autoComplete, required = false, children }) {
  return <div className="form-group">
    <label className="form-label" htmlFor={'candidate-' + name}>{label}{required && ' *'}</label>
    {children || <input id={'candidate-' + name} className="form-control" type={type} value={value} onChange={event => onChange(name, event.target.value)} placeholder={placeholder} autoComplete={autoComplete} aria-invalid={Boolean(error)} aria-describedby={error ? 'candidate-' + name + '-error' : undefined} />}
    {error && <p id={'candidate-' + name + '-error'} className="candidate-field-error" role="alert">{error}</p>}
  </div>;
}

export function CandidateOnboarding() {
  const { setCandidateProfile, skillsCatalog, setActivePage, showToast, setCurrentUser } = useApp();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '', location: '', university: '', major: '', graduationYear: '', skills: [], desiredRole: '', prefLocation: '', jobType: '', expectedSalary: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [errors, setErrors] = useState({});
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [cvFile, setCvFile] = useState(null);
  const [cvError, setCvError] = useState('');
  const fileInputRef = useRef(null);
  const passwordError = (passwordTouched || formData.password) ? getPasswordError(formData.password) : '';
  const updateField = (name, value) => {
    setFormData(previous => ({ ...previous, [name]: value }));
    setErrors(previous => ({ ...previous, [name]: '' }));
  };
  const toggleSkill = name => setFormData(previous => ({ ...previous, skills: previous.skills.includes(name) ? previous.skills.filter(skill => skill !== name) : [...previous.skills, name] }));
  const handleAddCustomSkill = event => {
    event.preventDefault();
    const name = customSkillInput.trim();
    if (name && !formData.skills.some(skill => skill.toLowerCase() === name.toLowerCase())) setFormData(previous => ({ ...previous, skills: [...previous.skills, name] }));
    setCustomSkillInput('');
  };
  const selectCV = file => {
    if (!file) return;
    if (!/\.(pdf|docx)$/i.test(file.name)) return setCvError('Vui lòng chọn tệp PDF hoặc DOCX.');
    if (!file.size || file.size > 10 * 1024 * 1024) return setCvError('Tệp phải có nội dung và dung lượng không quá 10 MB.');
    setCvFile(file);
    setCvError('');
  };
  const validateStep1 = () => {
    const nextErrors = {};
    if (formData.name.trim().length < 2) nextErrors.name = 'Vui lòng nhập họ và tên (ít nhất 2 ký tự).';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) nextErrors.email = 'Vui lòng nhập địa chỉ email hợp lệ.';
    nextErrors.password = getPasswordError(formData.password);
    if (!formData.confirmPassword) nextErrors.confirmPassword = 'Vui lòng nhập lại mật khẩu.';
    else if (formData.password !== formData.confirmPassword) nextErrors.confirmPassword = 'Mật khẩu xác nhận không khớp.';
    if (!/^(03|05|07|08|09)\d{8}$/.test(formData.phone.replace(/\s+/g, ''))) nextErrors.phone = 'Nhập 10 chữ số, bắt đầu bằng 03, 05, 07, 08 hoặc 09.';
    if (!formData.location.trim()) nextErrors.location = 'Vui lòng nhập tỉnh hoặc thành phố.';
    if (!agreeTerms) nextErrors.terms = 'Vui lòng đồng ý với điều khoản trước khi tiếp tục.';
    setPasswordTouched(true);
    setErrors(nextErrors);
    const firstError = Object.keys(nextErrors).find(key => nextErrors[key]);
    if (firstError) {
      document.getElementById('candidate-' + firstError)?.focus();
      return false;
    }
    return true;
  };
  const handleNextStep = () => {
    if (step === 1 && !validateStep1()) return;
    setStep(previous => previous + 1);
  };
  const mapLevel = (jobType) => {
    if (!jobType) return 'FRESHER';
    const lower = jobType.toLowerCase();
    if (lower.includes('intern')) return 'INTERN';
    if (lower.includes('junior')) return 'JUNIOR';
    if (lower.includes('middle') || lower.includes('mid')) return 'MIDDLE';
    if (lower.includes('senior')) return 'SENIOR';
    return 'FRESHER';
  };

  const handleSaveAndFinish = async () => {
    if (!validateStep1()) {
      setStep(1);
      return;
    }

    if (!formData.desiredRole.trim()) {
      setErrors({ desiredRole: 'Vui lòng nhập vị trí mong muốn.' });
      document.getElementById('candidate-desiredRole')?.focus();
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/register/candidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.name.trim(),
          email: formData.email.trim(),
          username: formData.email.trim().split('@')[0].toLowerCase(),
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          phone: formData.phone.replace(/\s+/g, ''),
          location: formData.location.trim() || 'TP. Hồ Chí Minh',
          targetRole: formData.desiredRole.trim() || 'Software Engineer',
          level: mapLevel(formData.jobType)
        })
      });

      const data = await res.json();

      if (!res.ok) {
        let errorMsg = data.message || 'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.';
        if (data.errors && typeof data.errors === 'object') {
          const detailList = Object.values(data.errors);
          if (detailList.length > 0) {
            errorMsg = detailList.join(' | ');
          }
        }
        showToast(errorMsg, 'danger');
        setStep(1);
        return;
      }

      const authData = data.data;
      if (authData?.token) {
        localStorage.setItem('careerfit_token', authData.token);
      }
      localStorage.setItem('careerfit_current_user', JSON.stringify(authData));
      if (setCurrentUser) {
        setCurrentUser(authData);
      }

      setCandidateProfile(prev => ({
        ...prev,
        hasCV: false,
        cvFileName: '',
        cvUploadDate: '',
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.replace(/\s+/g, ''),
        location: formData.location.trim(),
        university: formData.university,
        major: formData.major,
        graduationYear: formData.graduationYear,
        skills: formData.skills,
        preferences: {
          desiredRole: formData.desiredRole,
          location: formData.prefLocation,
          jobType: formData.jobType,
          expectedSalary: formData.expectedSalary
        }
      }));

      showToast('Đăng ký tài khoản Ứng viên CareerFit thành công!', 'success');
      setActivePage('candidate-dashboard');
    } catch (err) {
      console.error('Candidate register error:', err);
      showToast('Không thể kết nối đến máy chủ backend (Port 8080).', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };


  const field = (name, label, placeholder, options = {}) => <Field name={name} label={label} placeholder={placeholder} value={formData[name]} onChange={updateField} error={errors[name]} {...options} />;
  return (
    <div className="candidate-onboarding">
      <header className="candidate-intro"><p className="candidate-eyebrow">Đăng ký ứng viên</p><h1>Tạo hồ sơ nghề nghiệp của bạn</h1><p>Giới thiệu bản thân, chọn kỹ năng và tìm cơ hội phù hợp.</p></header>
      <ol className="candidate-steps" aria-label="Tiến trình đăng ký">
        {STEPS.map((label, index) => <li key={label} className={step === index + 1 ? 'is-current' : step > index + 1 ? 'is-complete' : ''} aria-current={step === index + 1 ? 'step' : undefined}><span className="candidate-step-number">{step > index + 1 ? <CheckCircle2 aria-hidden="true" /> : index + 1}</span><span>{label}</span></li>)}
      </ol>
      <section className="candidate-form-card" aria-label={STEPS[step - 1]}>
        {step === 1 && <div>
          <h3>Thông tin tài khoản<span>* Thông tin bắt buộc</span></h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {field('name', 'Họ và tên', 'Ví dụ: Nguyễn Văn A', { required: true, autoComplete: 'name' })}
            {field('email', 'Email liên hệ', 'Ví dụ: nguyenvana@gmail.com', { required: true, type: 'email', autoComplete: 'email' })}
            <div className="form-group">
              <label className="form-label" htmlFor="candidate-password">Mật khẩu *</label>
              <div className="relative"><input id="candidate-password" className="form-control pr-10" type={showPassword ? 'text' : 'password'} autoComplete="new-password" maxLength={100} placeholder="Tối thiểu 8 ký tự" value={formData.password} onChange={event => updateField('password', event.target.value)} onBlur={() => setPasswordTouched(true)} aria-invalid={Boolean(passwordError)} aria-describedby="candidate-password-help candidate-password-error" /><button type="button" className="candidate-password-toggle" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setShowPassword(previous => !previous)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
              <p id="candidate-password-help" className="candidate-input-hint">Ít nhất 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt.</p>
              <p id="candidate-password-error" className={passwordError ? 'candidate-field-error' : 'candidate-password-valid'} aria-live="polite">{passwordError || (formData.password ? 'Mật khẩu đáp ứng yêu cầu.' : '')}</p>
            </div>
            {field('confirmPassword', 'Xác nhận mật khẩu', 'Nhập lại mật khẩu', { required: true, type: showPassword ? 'text' : 'password', autoComplete: 'new-password', error: errors.confirmPassword || (formData.confirmPassword && formData.confirmPassword !== formData.password ? 'Mật khẩu xác nhận không khớp.' : '') })}
            {field('phone', 'Số điện thoại', 'Ví dụ: 0912 345 678', { required: true, type: 'tel', autoComplete: 'tel' })}
            {field('location', 'Tỉnh / Thành phố', 'Ví dụ: TP. Hồ Chí Minh', { required: true })}
            {field('university', 'Trường Đại học / Cao đẳng', 'Ví dụ: Đại học FPT')}
            {field('major', 'Chuyên ngành', 'Ví dụ: Kỹ thuật phần mềm')}
          </div>
          <div className="candidate-terms"><label><input id="candidate-terms" type="checkbox" checked={agreeTerms} onChange={event => { setAgreeTerms(event.target.checked); setErrors(previous => ({ ...previous, terms: '' })); }} />Tôi đồng ý với Điều khoản sử dụng và Chính sách bảo mật của CareerFit.</label>{errors.terms && <p className="candidate-field-error" role="alert">{errors.terms}</p>}</div>
        </div>}
        {step === 2 && <div>
          <h3>Kỹ năng của bạn<span>Có thể bổ sung sau</span></h3>
          <p className="candidate-section-description">Chọn những kỹ năng bạn đã học hoặc sử dụng trong dự án.</p>
          <div className="candidate-selected-skills"><div className="candidate-skill-heading"><strong>Đã chọn ({formData.skills.length})</strong>{formData.skills.length > 0 && <button type="button" onClick={() => updateField('skills', [])}>Xóa tất cả</button>}</div><div className="flex flex-wrap gap-2">{formData.skills.length === 0 && <p className="candidate-empty-skills">Chưa chọn kỹ năng. Nhấn vào gợi ý bên dưới để thêm.</p>}{formData.skills.map(skill => <span key={skill} className="skill-tag selected">{skill}<button type="button" aria-label={'Bỏ kỹ năng ' + skill} onClick={() => toggleSkill(skill)}>×</button></span>)}</div></div>
          <p className="candidate-input-hint">Kỹ năng phổ biến</p>
          <div className="flex flex-wrap gap-2 mt-3">{skillsCatalog.map(skill => <button key={skill.id} type="button" aria-pressed={formData.skills.includes(skill.name)} className={'skill-tag selectable ' + (formData.skills.includes(skill.name) ? 'selected' : '')} onClick={() => toggleSkill(skill.name)}>{formData.skills.includes(skill.name) ? '✓' : '+'} {skill.name}</button>)}</div>
          <form onSubmit={handleAddCustomSkill} className="flex gap-2 mt-6"><input className="form-control" aria-label="Kỹ năng khác" placeholder="Ví dụ: Vue.js, Redis, Microservices" value={customSkillInput} onChange={event => setCustomSkillInput(event.target.value)} /><button type="submit" className="btn btn-secondary"><Plus size={16} /> Thêm</button></form>
        </div>}
        {step === 3 && <div>
          <h3>Hồ sơ CV<span>Không bắt buộc</span></h3>
          <p className="candidate-section-description">Chuẩn bị CV để giới thiệu kinh nghiệm và dự án của bạn.</p>
          <div className="candidate-dropzone" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); selectCV(event.dataTransfer.files[0]); }}><FileUp aria-hidden="true" /><h4>Kéo thả CV vào đây</h4><p>PDF hoặc DOCX · Tối đa 5 MB</p><input ref={fileInputRef} type="file" accept=".pdf,.docx" aria-label="Chọn tệp CV" className="sr-only" onChange={event => { selectCV(event.target.files[0]); event.target.value = ''; }} /><button type="button" className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>Chọn từ máy tính</button></div>
          {cvError && <p className="candidate-field-error" role="alert">{cvError}</p>}
          {cvFile && <div className="candidate-cv-file"><FileUp aria-hidden="true" /><div><strong>{cvFile.name}</strong><p>{(cvFile.size / 1024 / 1024).toFixed(2)} MB · Đã chọn trên thiết bị</p></div><button type="button" aria-label="Bỏ tệp CV đã chọn" onClick={() => setCvFile(null)}><Trash2 size={18} /></button></div>}
          <p className="candidate-input-hint">Tệp đang được chọn trên thiết bị. Hãy tải CV lên hồ sơ sau khi tạo tài khoản.</p>
        </div>}
        {step === 4 && <div>
          <h3>Mong muốn công việc</h3>
          <p className="candidate-section-description">Cho chúng tôi biết cơ hội bạn đang tìm kiếm. Bạn có thể thay đổi sau.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6">
            {field('desiredRole', 'Vị trí mong muốn', 'Ví dụ: Frontend Developer', { required: true })}
            {field('prefLocation', 'Địa điểm làm việc', 'Ví dụ: Hà Nội hoặc Remote')}
            <Field name="jobType" label="Hình thức việc làm"><select id="candidate-jobType" className="form-control" value={formData.jobType} onChange={event => updateField('jobType', event.target.value)}><option value="" disabled>Chọn hình thức việc làm</option><option>Internship / Thử việc</option><option>Full-time Fresher</option><option>Part-time</option></select></Field>
            {field('expectedSalary', 'Mức lương mong muốn', 'Ví dụ: 12 – 16 triệu VNĐ / tháng')}
          </div>
        </div>}
        <div className="candidate-navigation">
          {step > 1 ? <button type="button" disabled={isSubmitting} onClick={() => setStep(previous => previous - 1)} className="btn btn-secondary"><ArrowLeft size={16} /> Quay lại</button> : <span className="candidate-step-note">Bước 1 / 4</span>}
          {step < 4 ? <button type="button" onClick={handleNextStep} className="btn btn-primary">Tiếp theo <ArrowRight size={16} /></button> : <button type="button" onClick={handleSaveAndFinish} disabled={isSubmitting} className="btn btn-primary">{isSubmitting ? <><Loader2 size={18} className="animate-spin" /> Đang tạo tài khoản...</> : <>Tạo tài khoản <ArrowRight size={16} /></>}</button>}
        </div>
      </section>
      <p className="candidate-bottom-note">Bạn có thể cập nhật kỹ năng và mong muốn công việc sau khi đăng ký.</p>
    </div>
  );
}
