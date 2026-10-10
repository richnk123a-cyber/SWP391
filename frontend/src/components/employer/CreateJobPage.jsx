import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { VerificationBadge, MatchBadge } from '../common/Badge';
import { Modal } from '../common/Modal';
import {
  PlusCircle,
  AlertTriangle,
  Plus,
  X,
  ArrowLeft,
  Eye,
  Save,
  Send,
  MapPin,
  Briefcase,
  DollarSign,
  Building2,
  CheckCircle2,
  Sparkles,
  HelpCircle
} from 'lucide-react';

export function CreateJobPage() {
  const { employerProfile, createJob, setActivePage, skillsCatalog } = useApp();

  const isVerified = employerProfile.verificationStatus === 'Verified';

  // Section 1: Basic Info
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Backend Developer');
  const [jobType, setJobType] = useState('Internship');
  const [location, setLocation] = useState(employerProfile.location || 'TP.HCM');
  const [workMode, setWorkMode] = useState('On-site'); // On-site, Hybrid, Remote

  // Section 2: Salary Range
  const [minSalary, setMinSalary] = useState('8');
  const [maxSalary, setMaxSalary] = useState('12');
  const [currency, setCurrency] = useState('VNĐ');

  // Section 3: Job Content
  const [description, setDescription] = useState('');
  const [responsibilities, setResponsibilities] = useState([
    'Phát triển các tính năng phần mềm theo yêu cầu dự án.',
    'Lập trình RESTful API và tối ưu cơ sở dữ liệu.'
  ]);
  const [newRespInput, setNewRespInput] = useState('');

  const [requirements, setRequirements] = useState([
    'Sinh viên CNTT năm cuối hoặc mới tốt nghiệp.',
    'Nắm vững kiến thức Lập trình hướng đối tượng OOP và SQL.'
  ]);
  const [newReqInput, setNewReqInput] = useState('');

  // Section 4: Skills Separation
  const [requiredSkills, setRequiredSkills] = useState(['Java', 'SQL', 'Git']);
  const [preferredSkills, setPreferredSkills] = useState(['Spring Boot', 'Docker']);
  const [newReqSkillInput, setNewReqSkillInput] = useState('');
  const [newPrefSkillInput, setNewPrefSkillInput] = useState('');

  const [deadline, setDeadline] = useState('30/10/2026');

  // Preview Modal
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const formattedSalary = `${minSalary}.000.000 - ${maxSalary}.000.000 ${currency}`;

  // Skill Tag Helpers
  const toggleRequiredSkill = (skillName) => {
    if (!isVerified) return;
    setRequiredSkills(prev =>
      prev.includes(skillName) ? prev.filter(s => s !== skillName) : [...prev, skillName]
    );
  };

  const togglePreferredSkill = (skillName) => {
    if (!isVerified) return;
    setPreferredSkills(prev =>
      prev.includes(skillName) ? prev.filter(s => s !== skillName) : [...prev, skillName]
    );
  };

  const handleAddCustomReqSkill = (e) => {
    e.preventDefault();
    if (!newReqSkillInput.trim() || !isVerified) return;
    if (!requiredSkills.includes(newReqSkillInput.trim())) {
      setRequiredSkills(prev => [...prev, newReqSkillInput.trim()]);
      setNewReqSkillInput('');
    }
  };

  const handleAddCustomPrefSkill = (e) => {
    e.preventDefault();
    if (!newPrefSkillInput.trim() || !isVerified) return;
    if (!preferredSkills.includes(newPrefSkillInput.trim())) {
      setPreferredSkills(prev => [...prev, newPrefSkillInput.trim()]);
      setNewPrefSkillInput('');
    }
  };

  // Submit Job with Moderation Status
  const handleSubmitJob = (moderationStatus = 'PENDING') => {
    if (!title.trim() || !isVerified) return;

    const jobData = {
      title,
      category,
      jobType: `${jobType} (${workMode})`,
      location,
      salary: formattedSalary,
      description: description || 'Mô tả công việc chi tiết từ Nhà tuyển dụng...',
      responsibilities,
      requirements,
      requiredSkills,
      preferredSkills,
      deadline,
      moderationStatus,
      publishStatus: 'ACTIVE'
    };

    const success = createJob(jobData);
    if (success) {
      setActivePage('job-management');
    }
  };

  return (
    <div className="employer-workspace employer-createjobpage mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActivePage('job-management')}
          className="btn btn-secondary text-xs font-semibold flex items-center gap-1"
        >
          <ArrowLeft size={14} /> Quay lại danh sách tin
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="btn btn-secondary text-xs font-semibold flex items-center gap-1.5"
          >
            <Eye size={15} /> Xem trước bài đăng
          </button>
          <button
            type="button"
            onClick={() => handleSubmitJob('PENDING')}
            disabled={!isVerified || !title.trim()}
            className="btn btn-primary text-xs font-bold shadow-sm flex items-center gap-1.5"
          >
            <Send size={15} /> Gửi duyệt tin
          </button>
        </div>
      </div>

      {/* Unverified Warning Banner */}
      {!isVerified && (
        <div className="card bg-amber-50 border-2 border-amber-300 p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-amber-600 shrink-0" size={24} />
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Chưa Xác Minh Doanh Nghiệp</h4>
              <p className="text-xs text-amber-900">
                Tài khoản chưa được Admin phê duyệt Giấy phép kinh doanh. Bạn chỉ có thể xem form mẫu, không thể gửi đăng tin công khai.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActivePage('employer-register')}
            className="btn btn-secondary text-xs border-amber-400 text-amber-900 bg-white"
          >
            Xác minh ngay
          </button>
        </div>
      )}

      {/* Main Form Body */}
      <form onSubmit={(e) => { e.preventDefault(); handleSubmitJob('PENDING'); }} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-8 text-xs">
        {/* SECTION 1: THÔNG TIN CƠ BẢN */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">1</span>
            Thông tin cơ bản vị trí tuyển dụng
          </h3>

          <div className="form-group">
            <label className="form-label font-bold text-slate-900">Tiêu đề tin tuyển dụng (Job Title) *</label>
            <input
              type="text"
              required
              disabled={!isVerified}
              className="form-control text-xs h-10 font-semibold"
              placeholder="Ví dụ: Java Backend Developer (Intern / Fresher)..."
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="form-group">
              <label className="form-label font-bold text-slate-900">Chuyên ngành *</label>
              <select
                disabled={!isVerified}
                className="form-control text-xs h-10"
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                <option value="Backend Developer">Backend Developer</option>
                <option value="Frontend Developer">Frontend Developer</option>
                <option value="Fullstack Developer">Fullstack Developer</option>
                <option value="QA / Testing">QA / Testing</option>
                <option value="Mobile Developer">Mobile Developer</option>
                <option value="Data Analyst">Data Analyst</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label font-bold text-slate-900">Hình thức công việc *</label>
              <select
                disabled={!isVerified}
                className="form-control text-xs h-10"
                value={jobType}
                onChange={e => setJobType(e.target.value)}
              >
                <option value="Internship">Internship (Thực tập)</option>
                <option value="Fresher">Fresher (Mới ra trường)</option>
                <option value="Full-time">Full-time (Toàn thời gian)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label font-bold text-slate-900">Chế độ làm việc (Work Mode) *</label>
              <select
                disabled={!isVerified}
                className="form-control text-xs h-10"
                value={workMode}
                onChange={e => setWorkMode(e.target.value)}
              >
                <option value="On-site">On-site (Tại văn phòng)</option>
                <option value="Hybrid">Hybrid (Linh hoạt)</option>
                <option value="Remote">Remote (Từ xa)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label font-bold text-slate-900">Địa điểm làm việc *</label>
              <input
                type="text"
                required
                disabled={!isVerified}
                className="form-control text-xs h-10"
                placeholder="Ví dụ: Quận 9, TP.HCM..."
                value={location}
                onChange={e => setLocation(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label font-bold text-slate-900">Hạn nộp hồ sơ *</label>
              <input
                type="text"
                required
                disabled={!isVerified}
                className="form-control text-xs h-10"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: MỨC LƯƠNG (SALARY RANGE) */}
        <div className="space-y-4 pt-2">
          <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">2</span>
            Khoảng mức lương (Salary Range)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="form-group">
              <label className="form-label font-bold text-slate-800">Lương tối thiểu (Triệu)</label>
              <input
                type="number"
                disabled={!isVerified}
                className="form-control text-xs h-10"
                value={minSalary}
                onChange={e => setMinSalary(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label font-bold text-slate-800">Lương tối đa (Triệu)</label>
              <input
                type="number"
                disabled={!isVerified}
                className="form-control text-xs h-10"
                value={maxSalary}
                onChange={e => setMaxSalary(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label font-bold text-slate-800">Đơn vị tiền tệ</label>
              <select
                disabled={!isVerified}
                className="form-control text-xs h-10"
                value={currency}
                onChange={e => setCurrency(e.target.value)}
              >
                <option value="VNĐ">VNĐ (Việt Nam Đồng)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>

            <div className="md:col-span-3 text-right">
              <span className="text-xs text-slate-500">Hiển thị trên bài đăng: </span>
              <strong className="text-sm font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200 ml-2">
                {formattedSalary}
              </strong>
            </div>
          </div>
        </div>

        {/* SECTION 3: NỘI DUNG TUYỂN DỤNG */}
        <div className="space-y-4 pt-2">
          <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">3</span>
            Mô tả & Yêu cầu công việc
          </h3>

          <div className="form-group">
            <label className="form-label font-bold text-slate-900">Mô tả tổng quan công việc *</label>
            <textarea
              rows={4}
              required
              disabled={!isVerified}
              className="form-control text-xs leading-relaxed"
              placeholder="Giới thiệu về dự án, môi trường làm việc và sứ mệnh vị trí..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label font-bold text-slate-900">Trách nhiệm công việc chính</label>
            <div className="space-y-2">
              {responsibilities.map((res, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-slate-400">•</span>
                  <input
                    type="text"
                    disabled={!isVerified}
                    className="form-control text-xs py-1.5 flex-1"
                    value={res}
                    onChange={e => {
                      const val = e.target.value;
                      setResponsibilities(prev => prev.map((r, i) => (i === idx ? val : r)));
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setResponsibilities(prev => prev.filter((_, i) => i !== idx))}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  disabled={!isVerified}
                  className="form-control text-xs py-1.5 flex-1"
                  placeholder="Thêm trách nhiệm mới..."
                  value={newRespInput}
                  onChange={e => setNewRespInput(e.target.value)}
                />
                <button
                  type="button"
                  disabled={!newRespInput.trim()}
                  onClick={() => {
                    if (newRespInput.trim()) {
                      setResponsibilities(prev => [...prev, newRespInput.trim()]);
                      setNewRespInput('');
                    }
                  }}
                  className="btn btn-secondary text-xs py-1 px-3"
                >
                  + Thêm
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: KỸ NĂNG BẮT BUỘC VS KỸ NĂNG ƯU TIÊN */}
        <div className="space-y-4 pt-2">
          <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">4</span>
            Kỹ năng so khớp (Skills for Match Score Algorithm)
          </h3>

          {/* REQUIRED SKILLS */}
          <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
            <div className="flex items-center justify-between">
              <label className="form-label font-bold text-blue-900 uppercase tracking-wider text-[11px]">
                Kỹ năng bắt buộc (Required Skills) *
              </label>
              <span className="text-[11px] text-blue-700">Dùng để tính Match Score chính</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {requiredSkills.map(sk => (
                <span key={sk} className="filter-chip bg-blue-600 text-white border-blue-600">
                  {sk}
                  <button type="button" onClick={() => toggleRequiredSkill(sk)}><X size={12} /></button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                disabled={!isVerified}
                className="form-control text-xs py-1.5 bg-white flex-1"
                placeholder="Nhập kỹ năng mới (ví dụ: Spring Boot, React...)..."
                value={newReqSkillInput}
                onChange={e => setNewReqSkillInput(e.target.value)}
              />
              <button
                type="button"
                onClick={handleAddCustomReqSkill}
                className="btn btn-primary text-xs py-1 px-3 font-bold"
              >
                + Thêm Tag
              </button>
            </div>
          </div>

          {/* PREFERRED SKILLS */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <label className="form-label font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Kỹ năng ưu tiên (Preferred Skills / Plus)
            </label>

            <div className="flex flex-wrap gap-2">
              {preferredSkills.map(sk => (
                <span key={sk} className="filter-chip bg-slate-700 text-white border-slate-700">
                  {sk}
                  <button type="button" onClick={() => togglePreferredSkill(sk)}><X size={12} /></button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                disabled={!isVerified}
                className="form-control text-xs py-1.5 bg-white flex-1"
                placeholder="Nhập kỹ năng cộng điểm (ví dụ: Docker, CI/CD...)..."
                value={newPrefSkillInput}
                onChange={e => setNewPrefSkillInput(e.target.value)}
              />
              <button
                type="button"
                onClick={handleAddCustomPrefSkill}
                className="btn btn-secondary text-xs py-1 px-3 font-bold"
              >
                + Thêm Plus
              </button>
            </div>
          </div>
        </div>

        {/* BOTTOM FORM ACTIONS */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setActivePage('job-management')}
            className="btn btn-secondary text-xs"
          >
            Hủy bỏ
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="btn btn-secondary text-xs font-semibold"
            >
              <Eye size={15} /> Xem trước bài đăng
            </button>
            <button
              type="submit"
              disabled={!isVerified || !title.trim()}
              className="btn btn-primary text-xs font-bold shadow-md px-5"
            >
              <Send size={15} /> Gửi duyệt tin tuyển dụng
            </button>
          </div>
        </div>
      </form>

      {/* JOB PREVIEW MODAL */}
      {isPreviewOpen && (
        <Modal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title="Xem trước giao diện Tin tuyển dụng (Candidate View)"
        >
          <div className="space-y-5 text-xs">
            <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-xl space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded border border-blue-400/30 uppercase">
                    {category} • {jobType}
                  </span>
                  <h3 className="text-xl font-extrabold mt-1">{title || 'Tiêu đề vị trí tuyển dụng'}</h3>
                  <p className="text-xs text-slate-300 mt-0.5">{employerProfile.companyName} ({employerProfile.verificationStatus})</p>
                </div>
                <span className="text-sm font-extrabold text-emerald-400 bg-emerald-950/50 px-3 py-1 rounded-lg border border-emerald-500/30">
                  {formattedSalary}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-slate-700">
              <h4 className="font-bold text-slate-900 text-sm">Mô tả công việc:</h4>
              <p className="p-3 bg-slate-50 border border-slate-200 rounded-xl leading-relaxed">
                {description || 'Chưa nhập mô tả...'}
              </p>
            </div>

            <div className="space-y-1 text-slate-700">
              <h4 className="font-bold text-slate-900 text-sm">Kỹ năng so khớp bắt buộc:</h4>
              <div className="flex flex-wrap gap-1.5">
                {requiredSkills.map(sk => (
                  <span key={sk} className="skill-chip skill-chip-blue">{sk}</span>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button onClick={() => setIsPreviewOpen(false)} className="btn btn-secondary text-xs">Đóng xem trước</button>
              <button
                type="button"
                onClick={() => {
                  setIsPreviewOpen(false);
                  handleSubmitJob('PENDING');
                }}
                disabled={!isVerified || !title.trim()}
                className="btn btn-primary text-xs font-bold"
              >
                Gửi duyệt tin ngay
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

