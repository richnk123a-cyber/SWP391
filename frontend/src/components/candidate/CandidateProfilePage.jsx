import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { useApp } from '../../context/AppContext';
import { candidateApi } from '../../services/apiService';
import { ArrowRight, BriefcaseBusiness, Camera, Check, Download, ExternalLink, Eye, FileText, GraduationCap, MapPin, Plus, Save, Search, Sparkles, Trash2, Upload, UserRound, X } from 'lucide-react';
import { DeleteAccountModal } from '../common/DeleteAccountModal';
import { CvTemplateModal } from './CvTemplateModal';
import './CandidateProfilePage.css';
import { getCandidateAvatar, readCandidateAvatar } from '../../utils/candidateAvatar';

const CATEGORIZED_SKILLS = {
  Backend: ['Java', 'Spring Boot', 'C#', '.NET', 'Python', 'Node.js', 'REST API', 'Microservices'],
  Frontend: ['React', 'JavaScript', 'TypeScript', 'HTML/CSS', 'TailwindCSS', 'Vue.js'],
  Database: ['SQL', 'SQL Server', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis'],
  'DevOps & Tools': ['Git', 'Docker', 'Linux', 'CI/CD', 'AWS', 'Kubernetes'],
  'Testing & Core': ['OOP', 'Selenium', 'Unit Testing', 'Data Structures', 'Algorithms', 'Jira']
};
function profileForm(profile, user) {
  return { name: profile?.name || user?.fullName || user?.username || '', email: profile?.email || user?.email || '', phone: profile?.phone || user?.phone || '', location: profile?.location || '', university: profile?.university || '', major: profile?.major || '', graduationYear: profile?.graduationYear || '', desiredRole: profile?.preferences?.desiredRole || '', expectedSalary: profile?.preferences?.expectedSalary || '', githubUrl: profile?.githubUrl || '', portfolioUrl: profile?.portfolioUrl || '', bio: profile?.bio || '' };
}
export function CandidateProfilePage() {
  const { currentUser, candidateProfile, setCandidateProfile, updateCandidateAvatar, uploadCandidateCV, deleteCandidateCV, setIsAIModalOpen, showToast } = useApp();
  const [form, setForm] = useState(() => profileForm(candidateProfile, currentUser));
  const [skills, setSkills] = useState(() => candidateProfile?.skills || []);
  const [avatar, setAvatar] = useState(() => getCandidateAvatar(candidateProfile, currentUser));
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [dirty, setDirty] = useState(false);
  const dirtyRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [dragOver, setDragOver] = useState(false);
  const [cvPreview, setCvPreview] = useState('');
  const [uploadingCv, setUploadingCv] = useState(false);
  const [downloadingCv, setDownloadingCv] = useState(false);
  const [isCvModalOpen, setIsCvModalOpen] = useState(false);
  const [aiCvTemplateData, setAiCvTemplateData] = useState(null);
  const [isPreviewCvOpen, setIsPreviewCvOpen] = useState(false);
  const [previewCvUrl, setPreviewCvUrl] = useState('');
  const [loadingPreviewCv, setLoadingPreviewCv] = useState(false);
  const fileRef = useRef(null);
  const avatarRef = useRef(null);
  const formRef = useRef(null);
  // Lắng nghe sự kiện mở CV Template từ CareerFit AI Chatbot (Chỉ mở khi người dùng chủ động yêu cầu từ chatbot)
  useEffect(() => {
    const handleOpenAiCv = (e) => {
      const data = e.detail;
      if (data) {
        setAiCvTemplateData(data);
        setIsCvModalOpen(true);
      }
      try {
        localStorage.removeItem('careerfit_cv_template_autofill');
        sessionStorage.removeItem('careerfit_cv_template_autofill');
      } catch (err) {}
    };

    // Kiểm tra xem có yêu cầu mở CV mới từ chatbot hay không (Chỉ mở nếu có cờ _autoOpenRequested và trong vòng 8 giây gần nhất)
    try {
      const stored = localStorage.getItem('careerfit_cv_template_autofill');
      if (stored) {
        const parsed = JSON.parse(stored);
        localStorage.removeItem('careerfit_cv_template_autofill');
        sessionStorage.removeItem('careerfit_cv_template_autofill');
        if (parsed && parsed._autoOpenRequested && (Date.now() - (parsed._timestamp || 0) < 8000)) {
          setAiCvTemplateData(parsed);
          setIsCvModalOpen(true);
        }
      }
    } catch (err) {
      console.warn('Lỗi đọc draft cv template autofill:', err);
      try {
        localStorage.removeItem('careerfit_cv_template_autofill');
        sessionStorage.removeItem('careerfit_cv_template_autofill');
      } catch (e) {}
    }

    window.addEventListener('careerfit_open_cv_template', handleOpenAiCv);
    return () => window.removeEventListener('careerfit_open_cv_template', handleOpenAiCv);
  }, []);

  useEffect(() => {
    let isMounted = true;
    candidateApi.getMyProfile()
      .then(res => {
        const data = res?.data || (res?.id ? res : null);
        if (data && isMounted) {
          const skillsArray = (data.skillList && data.skillList.length > 0)
            ? data.skillList
            : (typeof data.skills === 'string' && data.skills ? data.skills.split(',').map(s => s.trim()).filter(Boolean) : []);
          
          setForm(prev => ({
            ...prev,
            name: data.fullName || prev.name,
            email: data.email || prev.email,
            phone: data.phone || prev.phone,
            location: data.location || prev.location,
            university: data.university || prev.university,
            major: data.major || prev.major,
            graduationYear: data.graduationYear || prev.graduationYear,
            desiredRole: data.desiredRole || prev.desiredRole,
            expectedSalary: data.expectedSalary || prev.expectedSalary,
            bio: data.bio || prev.bio,
            githubUrl: data.githubUrl || prev.githubUrl,
            portfolioUrl: data.portfolioUrl || prev.portfolioUrl,
          }));

          if (skillsArray.length > 0) {
            setSkills(skillsArray);
          }

          setCandidateProfile(prev => ({
            ...prev,
            ...data,
            name: data.fullName || prev.name,
            avatarUrl: data.avatarUrl || prev.avatarUrl || '',
            skills: skillsArray.length > 0 ? skillsArray : prev.skills,
            hasCV: !!data.hasCv,
            cvFileName: data.cvFileName || prev.cvFileName,
            extractedCvText: data.extractedCvText || prev.extractedCvText,
          }));
        }
      })
      .catch(err => {
        console.warn('Không thể tải profile từ backend, dùng cache cục bộ:', err);
      });
    return () => { isMounted = false; };
  }, [setCandidateProfile]);

  useEffect(() => {
    if (dirtyRef.current) return;
    setForm(profileForm(candidateProfile, currentUser));
    setSkills(candidateProfile?.skills || []);
    setAvatar(getCandidateAvatar(candidateProfile, currentUser));
  }, [candidateProfile, currentUser]);
  useEffect(() => () => { if (cvPreview) URL.revokeObjectURL(cvPreview); }, [cvPreview]);
  const markDirty = () => { dirtyRef.current = true; setDirty(true); setSaveMessage(''); };
  const updateField = (key, value) => { markDirty(); setForm(prev => ({ ...prev, [key]: value })); };
  const changeSkill = (skill, remove = false) => {
    markDirty();
    setSkills(prev => {
      const nextSkills = remove
        ? prev.filter(item => item.toLowerCase() !== skill.toLowerCase())
        : prev.some(item => item.toLowerCase() === skill.toLowerCase())
          ? prev
          : [...prev, skill];
      setCandidateProfile(cp => ({ ...cp, skills: nextSkills }));
      return nextSkills;
    });
  };
  const uploadCV = async file => {
    if (!file) return;
    const isPdf = /\.pdf$/i.test(file.name) || (file.type && file.type === 'application/pdf');
    const isDocx = /\.docx$/i.test(file.name) || (file.type && file.type.includes('wordprocessingml'));
    if (!isPdf && !isDocx) {
      showToast('Vui lòng chọn tệp định dạng PDF hoặc DOCX.', 'danger');
      return;
    }
    if (!file.size || file.size > 10 * 1024 * 1024) {
      showToast('Dung lượng tệp phải lớn hơn 0 và không quá 10 MB.', 'danger');
      return;
    }
    setUploadingCv(true);
    try {
      await uploadCandidateCV(file);
      setCandidateProfile(prev => ({ ...prev, cvFileSize: file.size }));
    } catch {
      showToast('Tải lên CV thất bại. Vui lòng thử lại.', 'danger');
    } finally {
      setUploadingCv(false);
    }
  };

  const handleSaveCvFromTemplate = async (savedData) => {
    try {
      const updatedProf = {
        ...candidateProfile,
        hasCV: true,
        cvFileName: savedData.cvFileName,
        extractedCvText: savedData.extractedCvText,
        cvUploadDate: new Date().toLocaleDateString('vi-VN'),
        skills: savedData.skills && savedData.skills.length > 0 ? savedData.skills : (candidateProfile?.skills || [])
      };
      setCandidateProfile(updatedProf);

      if (savedData.formUpdates) {
        setForm(prev => ({
          ...prev,
          ...savedData.formUpdates
        }));
      }
      if (savedData.skills && savedData.skills.length > 0) {
        setSkills(savedData.skills);
      }

      try {
        await candidateApi.updateMyProfile({
          fullName: savedData.formUpdates?.name || form.name,
          phone: savedData.formUpdates?.phone || form.phone,
          location: savedData.formUpdates?.location || form.location,
          university: savedData.formUpdates?.university || form.university,
          major: savedData.formUpdates?.major || form.major,
          graduationYear: savedData.formUpdates?.graduationYear || form.graduationYear,
          desiredRole: savedData.formUpdates?.desiredRole || form.desiredRole,
          bio: savedData.formUpdates?.bio || form.bio,
          cvFileName: savedData.cvFileName,
          extractedCvText: savedData.extractedCvText,
          skills: Array.isArray(savedData.skills || skills) ? (savedData.skills || skills).join(', ') : String(savedData.skills || skills),
          skillList: Array.isArray(savedData.skills || skills) ? (savedData.skills || skills) : []
        });
      } catch (err) {
        console.warn('Backend profile sync note:', err);
      }

      showToast(`Đã lưu CV "${savedData.cvFileName}" vào hồ sơ và sẵn sàng cho AI Matching!`, 'success');
    } catch (e) {
      showToast('Có lỗi xảy ra khi lưu CV vào hồ sơ.', 'danger');
    }
  };

  const handleDownloadCv = async () => {
    setDownloadingCv(true);
    try {
      const blob = await candidateApi.downloadCv();
      const isDocx = candidateProfile?.cvFileName?.toLowerCase().endsWith('.docx');
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = candidateProfile?.cvFileName || (isDocx ? 'CV.docx' : 'CV.pdf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 2000);
      showToast('Đã tải tệp CV từ máy chủ về máy thành công!', 'success');
    } catch (err) {
      showToast(err.message || 'Không thể tải file CV từ máy chủ.', 'danger');
    } finally {
      setDownloadingCv(false);
    }
  };

  // Xem CV hiện tại (Mở trực tiếp trên web bằng viewer / iframe)
  const handleViewCurrentCv = async () => {
    if (loadingPreviewCv) return;
    setLoadingPreviewCv(true);
    try {
      const blob = await candidateApi.downloadCv();
      const isDocx = candidateProfile?.cvFileName?.toLowerCase().endsWith('.docx');
      if (isDocx) {
        setPreviewCvUrl(null);
        setIsPreviewCvOpen(true);
      } else {
        const url = window.URL.createObjectURL(blob);
        setPreviewCvUrl(url);
        setIsPreviewCvOpen(true);
      }
    } catch (err) {
      showToast(err?.message || 'Không thể tải xem trước CV từ máy chủ.', 'danger');
    } finally {
      setLoadingPreviewCv(false);
    }
  };

  const handleClosePreviewCv = () => {
    setIsPreviewCvOpen(false);
    if (previewCvUrl) {
      window.URL.revokeObjectURL(previewCvUrl);
      setPreviewCvUrl('');
    }
  };
  const changeAvatar = async event => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file || uploadingAvatar) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) { showToast('Chọn ảnh JPG, PNG hoặc WebP không quá 2 MB.', 'danger'); return; }
    setUploadingAvatar(true);
    try {
      const nextAvatar = await readCandidateAvatar(file);
      setAvatar(nextAvatar);
      await updateCandidateAvatar(nextAvatar);
    } catch { showToast('Chưa đọc được ảnh. Vui lòng chọn lại tệp.', 'danger'); }
    finally { setUploadingAvatar(false); }
  };
  const save = async event => {
    event.preventDefault(); if (saving) return;
    if (![form.name, form.email, form.phone, form.desiredRole].every(value => value.trim())) { 
      showToast('Vui lòng điền đầy đủ các thông tin bắt buộc (Họ tên, Email, Số điện thoại, Vị trí mục tiêu).', 'warning'); 
      return; 
    }
    setSaving(true);
    const updated = { 
      ...candidateProfile, 
      ...form, 
      name: form.name.trim(), 
      email: form.email.trim(), 
      avatarUrl: avatar, 
      skills, 
      preferences: { 
        ...candidateProfile?.preferences, 
        desiredRole: form.desiredRole.trim(), 
        expectedSalary: form.expectedSalary 
      }, 
      userId: currentUser?.id 
    };
    let message;
    try {
      localStorage.setItem(`careerfit_cand_profile_${currentUser?.id}`, JSON.stringify(updated));
      setCandidateProfile(updated);
      dirtyRef.current = false; setDirty(false);
      try {
        await candidateApi.updateMyProfile({ 
          fullName: updated.name, 
          phone: form.phone, 
          location: form.location, 
          university: form.university, 
          major: form.major, 
          graduationYear: form.graduationYear, 
          desiredRole: updated.preferences.desiredRole, 
          expectedSalary: form.expectedSalary,
          bio: form.bio,
          githubUrl: form.githubUrl,
          portfolioUrl: form.portfolioUrl,
          skills: skills.join(', '),
          skillList: skills
        });
        message = 'Đã lưu hồ sơ thành công vào cơ sở dữ liệu hệ thống!';
      } catch (apiErr) { 
        message = 'Đã lưu trên thiết bị. Lỗi đồng bộ máy chủ: ' + (apiErr?.message || 'Không xác định'); 
      }
      setSaveMessage(message); showToast(message, 'success');
    } catch { 
      showToast('Chưa lưu được hồ sơ. Vui lòng thử lại.', 'danger'); 
    }
    finally { setSaving(false); }
  };
  const checklist = [
    { label: 'Thông tin liên hệ', done: !!(form.name.trim() && form.email.trim() && form.phone.trim()) },
    { label: 'Học vấn', done: !!(form.university.trim() && form.major.trim()) },
    { label: 'Mục tiêu nghề nghiệp', done: !!form.desiredRole.trim() },
    { label: 'Giới thiệu bản thân', done: !!form.bio.trim() },
    { label: 'Kỹ năng chuyên môn', done: skills.length > 0 },
    { label: 'CV đính kèm', done: !!(candidateProfile?.hasCv ?? candidateProfile?.hasCV) }
  ];
  const completion = Math.round(checklist.filter(item => item.done).length / checklist.length * 100);
  const categories = Object.entries(CATEGORIZED_SKILLS).filter(([name]) => category === 'all' || category === name).map(([name, items]) => [name, items.filter(skill => skill.toLowerCase().includes(search.trim().toLowerCase()))]).filter(([, items]) => items.length);
  const field = (key, label, options = {}) => <label className={`profile-field ${options.wide ? 'is-wide' : ''}`}><span>{label}{options.required && <em> *</em>}</span>{options.textarea ? <textarea rows={4} value={form[key]} onChange={event => updateField(key, event.target.value)} placeholder={options.placeholder} /> : <input type={options.type || 'text'} value={form[key]} onChange={event => updateField(key, event.target.value)} required={options.required} placeholder={options.placeholder} autoComplete={options.autoComplete} />}</label>;
  return <div className="profile-page">
    <header className="profile-hero"><div className="profile-hero-person"><div className="profile-avatar">{avatar ? <img src={avatar} alt="Ảnh đại diện" /> : <span>{form.name.trim().charAt(0).toUpperCase() || <UserRound size={32}/>}</span>}<button type="button" disabled={uploadingAvatar} aria-label="Thay ảnh đại diện" aria-busy={uploadingAvatar} title={uploadingAvatar ? 'Đang cập nhật ảnh…' : 'Đổi ảnh đại diện'} onClick={() => avatarRef.current.click()}><Camera size={15}/></button><input ref={avatarRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={changeAvatar}/></div><div className="profile-hero-copy"><span className="profile-eyebrow">HỒ SƠ NGHỀ NGHIỆP</span><h1>{form.name || 'Hồ sơ của bạn'}</h1><p>{form.desiredRole || 'Thêm vị trí mục tiêu'}<span>·</span>{form.email || 'Thêm email liên hệ'}</p><div>{form.university && <span><GraduationCap size={14}/>{form.university}</span>}{form.location && <span><MapPin size={14}/>{form.location}</span>}</div></div></div><div className="profile-hero-summary"><span>HỒ SƠ HOÀN THIỆN <strong>{completion}%</strong></span><div className="profile-progress" role="progressbar" aria-label="Mức hoàn thiện hồ sơ" aria-valuemin={0} aria-valuemax={100} aria-valuenow={completion}><i style={{width:`${completion}%`}}/></div><small>{skills.length} kỹ năng · {candidateProfile?.hasCV ? 'Đã có CV' : 'Chưa đính kèm CV'}</small><button type="submit" form="candidate-profile-form" disabled={saving || uploadingAvatar} className="profile-primary"><Save size={15}/>{saving ? 'Đang lưu…' : 'Lưu hồ sơ'}</button></div></header>
    <form id="candidate-profile-form" ref={formRef} onSubmit={save} className="profile-form"><div className="profile-layout"><div className="profile-main">
    <section className="profile-card"><div className="profile-section-heading"><span className="profile-section-icon"><UserRound size={18}/></span><div><h2>Thông tin cá nhân</h2><p>Thông tin để nhà tuyển dụng liên hệ với bạn.</p></div><span className="profile-section-number">01</span></div><div className="profile-fields">{field('name','Họ và tên',{required:true,autoComplete:'name'})}{field('email','Email liên hệ',{required:true,type:'email',autoComplete:'email'})}{field('phone','Số điện thoại',{required:true,type:'tel',autoComplete:'tel'})}{field('location','Khu vực sinh sống',{placeholder:'Ví dụ: Đà Nẵng'})}{field('bio','Giới thiệu bản thân',{textarea:true,wide:true,placeholder:'Giới thiệu ngắn về kinh nghiệm, thế mạnh và mục tiêu của bạn.'})}</div></section>
    <section className="profile-card"><div className="profile-section-heading"><span className="profile-section-icon is-violet"><GraduationCap size={19}/></span><div><h2>Học vấn & định hướng</h2><p>Cho nhà tuyển dụng thấy nền tảng và mục tiêu của bạn.</p></div><span className="profile-section-number">02</span></div><div className="profile-fields">{field('university','Trường Đại học / Cao đẳng')}{field('major','Chuyên ngành')}{field('graduationYear','Năm tốt nghiệp dự kiến',{placeholder:'Ví dụ: 2026'})}{field('desiredRole','Vị trí mục tiêu',{required:true,placeholder:'Ví dụ: Backend Developer'})}{field('expectedSalary','Mức lương kỳ vọng',{placeholder:'Ví dụ: 8 – 12 triệu VNĐ'})}{field('githubUrl','GitHub',{type:'url',placeholder:'https://github.com/username'})}{field('portfolioUrl','Website / Portfolio',{type:'url',placeholder:'https://your-portfolio.com',wide:true})}</div></section>
    <section className="profile-card profile-skills"><div className="profile-section-heading"><span className="profile-section-icon is-green"><BriefcaseBusiness size={18}/></span><div><h2>Kỹ năng chuyên môn <b>{skills.length}</b></h2><p>Chọn những kỹ năng bạn có thể sử dụng và trình bày khi phỏng vấn.</p></div><span className="profile-section-number">03</span></div><div className="profile-selected-skills"><span>KỸ NĂNG CỦA BẠN</span><div>{skills.map(skill => <span key={skill}><Check size={12}/>{skill}<button type="button" aria-label={`Xóa kỹ năng ${skill}`} onClick={() => changeSkill(skill,true)}><X size={12}/></button></span>)}{!skills.length && <p>Chưa có kỹ năng. Chọn từ danh mục bên dưới để bắt đầu.</p>}</div></div><div className="profile-skills-tools"><label><Search size={15}/><input aria-label="Tìm kỹ năng" value={search} onChange={event => setSearch(event.target.value)} placeholder="Tìm kỹ năng…"/></label><select aria-label="Nhóm kỹ năng" value={category} onChange={event => setCategory(event.target.value)}><option value="all">Tất cả nhóm kỹ năng</option>{Object.keys(CATEGORIZED_SKILLS).map(name => <option key={name}>{name}</option>)}</select></div><div className="profile-skill-categories">{categories.map(([name,items]) => <div key={name}><h3>{name}</h3><div>{items.map(skill => { const added = skills.some(item => item.toLowerCase() === skill.toLowerCase()); return <button type="button" key={skill} disabled={added} onClick={() => changeSkill(skill)}>{added ? <Check size={12}/> : <Plus size={12}/>}{skill}</button>; })}</div></div>)}{!categories.length && <p className="profile-skill-empty">Không có kỹ năng phù hợp. Thử từ khóa hoặc nhóm khác.</p>}</div></section>
    <section className="profile-danger-zone" aria-labelledby="profile-danger-heading">
      <div className="profile-danger-heading">
        <span className="profile-danger-icon" aria-hidden="true">
          <Trash2 size={18} />
        </span>
        <div>
          <h2 id="profile-danger-heading">Quản lý & Xóa tài khoản</h2>
          <p>Nếu bạn tạo nhầm loại tài khoản hoặc muốn xóa hoàn toàn tài khoản khỏi hệ thống.</p>
        </div>
      </div>
      <div className="profile-danger-body">
        <p>
          Hành động này sẽ xóa vĩnh viễn tài khoản của bạn, hồ sơ và các đơn ứng tuyển khỏi cơ sở dữ liệu. Email sẽ được giải phóng để bạn có thể đăng ký lại tài khoản mới nếu cần.
        </p>
        <button
          type="button"
          onClick={() => setIsDeleteModalOpen(true)}
          className="profile-danger-button"
        >
          <Trash2 size={15} /> Xóa tài khoản này
        </button>
      </div>
    </section>
    </div><aside className="profile-aside"><section className="profile-cv-card"><div className="profile-aside-heading"><FileText size={18}/><h2>CV của bạn</h2>{candidateProfile?.hasCV && <span><Check size={12}/>Đã có CV</span>}</div>{uploadingCv ? (<div className="p-6 text-center border-2 border-dashed border-blue-400 bg-blue-50/50 rounded-2xl space-y-2"><div className="animate-spin inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mb-1"></div><p className="font-bold text-xs text-blue-900">Đang tải lên & trích xuất nội dung CV...</p><small className="text-[10px] text-slate-500">Đang xử lý phân tích văn bản qua Apache PDFBox / POI</small></div>) : candidateProfile?.hasCV ? (<div className="profile-cv-file">
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
    <span
      className="profile-pdf-icon"
      style={{ cursor: 'pointer' }}
      onClick={handleViewCurrentCv}
      title="Nhấn để xem CV hiện tại"
    >
      {candidateProfile.cvFileName?.toLowerCase().endsWith('.docx') ? 'DOCX' : 'PDF'}
    </span>
    <div style={{ flex: 1, minWidth: 0 }}>
      <h3
        style={{ cursor: 'pointer', margin: 0, fontSize: '15px', fontWeight: '600' }}
        onClick={handleViewCurrentCv}
        title="Nhấn để xem CV hiện tại"
      >
        {candidateProfile.cvFileName || 'CV đính kèm'}
      </h3>
      <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
        {candidateProfile.cvUploadDate || 'Đã cập nhật'}
        {candidateProfile.cvFileSize ? ` · ${(candidateProfile.cvFileSize/1024/1024).toFixed(2)} MB` : ''}
      </p>
    </div>
  </div>
  {candidateProfile.extractedCvText && (
    <span className="inline-block text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-semibold my-1">
      ✓ Đã trích xuất {candidateProfile.extractedCvText.length} ký tự cho AI Matching
    </span>
  )}
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px', width: '100%' }}>
    <button
      type="button"
      onClick={handleViewCurrentCv}
      disabled={loadingPreviewCv}
      style={{
        width: '100%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '7px',
        fontSize: '13px',
        fontWeight: '600',
        color: '#ffffff',
        background: '#15803d',
        border: '1px solid #166534',
        borderRadius: '8px',
        padding: '9px 12px',
        cursor: loadingPreviewCv ? 'default' : 'pointer',
        boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
      }}
      title="Xem trực tiếp tệp CV hiện tại của bạn"
    >
      <Eye size={15}/> <span>{loadingPreviewCv ? 'Đang tải xem trước…' : 'Xem CV hiện tại'}</span>
    </button>
    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
      <button
        type="button"
        onClick={handleDownloadCv}
        disabled={downloadingCv}
        style={{
          flex: 1,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          fontSize: '12px',
          fontWeight: '600',
          color: '#1d4ed8',
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          padding: '8px 6px',
          cursor: downloadingCv ? 'default' : 'pointer',
          whiteSpace: 'nowrap'
        }}
        title="Tải tệp CV về thiết bị"
      >
        <Download size={13}/> {downloadingCv ? 'Đang tải…' : 'Tải CV về máy'}
      </button>
      <button
        type="button"
        onClick={() => setIsCvModalOpen(true)}
        style={{
          flex: 1,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          fontSize: '12px',
          fontWeight: '600',
          color: '#334155',
          background: '#f8fafc',
          border: '1px solid #cbd5e1',
          borderRadius: '8px',
          padding: '8px 6px',
          cursor: 'pointer',
          whiteSpace: 'nowrap'
        }}
        title="Tạo thêm bản CV theo mẫu chuẩn CareerFit"
      >
        <FileText size={13}/> Tạo CV mẫu
      </button>
    </div>
    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
      <button
        type="button"
        onClick={() => fileRef.current.click()}
        style={{ flex: 1, padding: '7px 8px', fontSize: '12px', color: '#475569', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '7px' }}
      >
        Đổi tệp
      </button>
      <button
        type="button"
        aria-label="Xóa CV"
        onClick={async () => {
          setUploadingCv(true);
          try {
            await deleteCandidateCV();
            setCandidateProfile(prev => ({...prev, cvFileSize: 0}));
          } finally {
            setUploadingCv(false);
          }
        }}
        style={{ padding: '7px 10px', color: '#dc2626', background: '#fff', border: '1px solid #fecaca', borderRadius: '7px' }}
        title="Xóa tệp CV này"
      >
        <Trash2 size={14}/>
      </button>
    </div>
  </div>
</div>) : (<div style={{display:'flex',flexDirection:'column',gap:'10px'}}><button type="button" className={`profile-dropzone ${dragOver ? 'is-dragging' : ''}`} onClick={() => fileRef.current.click()} onDragOver={event => {event.preventDefault();setDragOver(true);}} onDragLeave={() => setDragOver(false)} onDrop={event => {event.preventDefault();setDragOver(false);uploadCV(event.dataTransfer.files?.[0]);}}><span><Upload size={23}/></span><strong>Thêm CV để sẵn sàng ứng tuyển</strong><p>Kéo thả tệp vào đây hoặc chọn từ thiết bị</p><small>PDF hoặc DOCX · tối đa 5 MB</small></button><button type="button" onClick={() => setIsCvModalOpen(true)} style={{display:'inline-flex',alignItems:'center',justifyContent:'center',gap:'6px',fontSize:'12px',fontWeight:'600',color:'#15803d',background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:'8px',padding:'9px 12px',cursor:'pointer',width:'100%'}}><FileText size={14}/> Tạo CV từ hồ sơ</button></div>)}<input ref={fileRef} type="file" accept="application/pdf,.pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" hidden onChange={event => { uploadCV(event.target.files?.[0]); event.target.value=''; }}/><p className="profile-cv-note">Hỗ trợ PDF & DOCX. Nội dung được trích xuất tự động phục vụ AI Deep Matching.</p></section>
    <section className="profile-checklist"><span className="profile-kicker">TỪNG CHÚT MỘT</span><h2>Hoàn thiện hồ sơ</h2><p>Thông tin đầy đủ giúp nhà tuyển dụng hiểu rõ hơn về bạn.</p><div>{checklist.map(item => <div key={item.label}><span>{item.label}</span>{item.done ? <Check size={15}/> : <small>Bổ sung</small>}</div>)}</div></section>
    <section className="profile-ai-card"><Sparkles size={21}/><span className="profile-kicker">CAREERFIT AI</span><h2>Một góc nhìn khác<br/>cho CV của bạn.</h2><p>Xem phân tích và gợi ý để điều chỉnh CV theo mục tiêu nghề nghiệp.</p><button type="button" onClick={() => setIsAIModalOpen(true)}>Phân tích CV <ArrowRight size={15}/></button></section></aside></div>
    <div className="profile-savebar"><div><span className={`profile-save-dot ${dirty ? 'is-dirty' : ''}`}/><p role="status">{saveMessage || (dirty ? 'Bạn có thay đổi chưa lưu.' : 'Thông tin hồ sơ của bạn.')}<small>Kỹ năng và ảnh đại diện được lưu cùng hồ sơ.</small></p></div><button className="profile-primary" type="submit" disabled={saving || uploadingAvatar}><Save size={15}/>{saving ? 'Đang lưu…' : 'Lưu thay đổi'}</button></div></form>
    <CvTemplateModal
      isOpen={isCvModalOpen}
      onClose={() => {
        setIsCvModalOpen(false);
        setAiCvTemplateData(null);
        try {
          localStorage.removeItem('careerfit_cv_template_autofill');
          sessionStorage.removeItem('careerfit_cv_template_autofill');
        } catch (e) {}
      }}
      onReplaceCV={() => { setIsCvModalOpen(false); setAiCvTemplateData(null); fileRef.current?.click(); }}
      onSaveToProfile={handleSaveCvFromTemplate}
      profileData={aiCvTemplateData || { name: form.name, phone: form.phone, email: form.email, location: form.location, university: form.university, major: form.major, graduationYear: form.graduationYear, desiredRole: form.desiredRole, bio: form.bio, skills, avatarUrl: avatar }}
    />
    <DeleteAccountModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} />

    {/* Modal Xem CV Hiện Tại (Pixel-Perfect Viewer cho PDF & DOCX) */}
    {isPreviewCvOpen && ReactDOM.createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-200">
        <div
          className="bg-white rounded-2xl w-full max-w-5xl h-[92vh] max-h-[92vh] shadow-2xl border border-slate-200 overflow-hidden flex flex-col transform transition-all animate-in zoom-in-95 duration-200"
          role="dialog"
          aria-modal="true"
        >
          {/* Modal Header */}
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                    {candidateProfile?.cvFileName || 'CV của bạn'}
                  </h3>
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                    {candidateProfile?.cvFileSize ? `${(candidateProfile.cvFileSize/1024/1024).toFixed(2)} MB` : 'Bản hiện tại'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Tệp CV đã tải lên hồ sơ CareerFit · Sẵn sàng ứng tuyển & AI Deep Matching
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {previewCvUrl && (
                <button
                  type="button"
                  onClick={() => window.open(previewCvUrl, '_blank')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Mở trong tab trình duyệt mới"
                >
                  <ExternalLink size={14} />
                  <span className="hidden sm:inline">Mở tab mới</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleDownloadCv}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                title="Tải CV về máy"
              >
                <Download size={14} />
                <span className="hidden sm:inline">Tải về</span>
              </button>

              <button
                type="button"
                onClick={handleClosePreviewCv}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer ml-1"
                title="Đóng (Esc)"
              >
                <X size={19} />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="flex-1 min-h-0 bg-slate-100 p-2 sm:p-4 overflow-hidden">
            {previewCvUrl ? (
              <iframe
                src={previewCvUrl}
                className="w-full h-full rounded-xl border border-slate-300 bg-white shadow-sm"
                title="Xem trước CV hiện tại"
              />
            ) : (
              <div className="w-full h-full bg-white rounded-xl border border-slate-300 p-6 overflow-y-auto">
                <div className="max-w-3xl mx-auto">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
                    <div>
                      <h4 className="font-bold text-slate-800 text-base">
                        Nội dung văn bản trích xuất từ tệp Word (.docx)
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Định dạng .docx được hệ thống tự động bóc tách để phục vụ thuật toán AI Matching
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadCv}
                      className="px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 rounded-lg hover:bg-emerald-200"
                    >
                      Tải file gốc .docx
                    </button>
                  </div>
                  <div className="prose prose-sm max-w-none text-slate-800 whitespace-pre-wrap font-sans leading-relaxed">
                    {candidateProfile?.extractedCvText || 'Chưa có nội dung văn bản trích xuất.'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>,
      document.body
    )}
  </div>;
}
