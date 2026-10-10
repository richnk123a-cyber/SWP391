import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { calculateSkillMatch } from '../../utils/matching';
import { getCompanyLogoUrl, isImageLogo } from '../../utils/logoUtils';
import './JobSearchPage.css';
import {
  Search,
  MapPin,
  ChevronDown,
  Bookmark, ArrowRight, ArrowUpRight, SlidersHorizontal, Check, ShieldCheck, X, BriefcaseBusiness, CircleHelp
} from 'lucide-react';

const SUGGESTIONS_LIST = [
  'Java Backend Intern',
  'Java Developer Fresher',
  'Spring Boot Developer',
  'React Frontend Engineer',
  'QA Automation Tester',
  'Data Analyst SQL',
  'Python Fullstack',
  '.NET Core Developer',
  'DevOps & Cloud Engineer'
];

const SKILL_OPTIONS = [
  'Java', 'Spring Boot', 'React', 'JavaScript', 'SQL', 'Docker', 'Git', '.NET', 'Python', 'TypeScript', 'TailwindCSS', 'Selenium'
];

const CATEGORIES = [
  'All',
  'Backend Developer',
  'Frontend Developer',
  'Fullstack Developer',
  'QA / Testing',
  'Mobile Developer',
  'DevOps / Cloud'
];

const JOB_TYPES = [
  'All',
  'Internship',
  'Full-time',
  'Part-time',
  'Hybrid'
];

const SALARY_RANGES = [
  { label: 'Tất cả mức lương', value: 'All' },
  { label: 'Dưới 8 triệu VNĐ', value: 'under-8m' },
  { label: '8 - 12 triệu VNĐ', value: '8m-12m' },
  { label: '12 - 20 triệu VNĐ', value: '12m-20m' },
  { label: 'Trên 20 triệu VNĐ', value: 'over-20m' }
];

const EMPTY_SKILLS = [];
const isVerifiedJob = (job) => job.isVerified || ['Verified', 'VERIFIED'].includes(job.verifiedStatus || job.verificationStatus);

export function extractMaxSalary(salaryStr) {
  if (!salaryStr) return 0;
  const str = salaryStr.toString();
  const matches = str.match(/\d{1,3}(?:\.\d{3})+|\d+/g);
  if (matches && matches.length > 0) {
    const nums = matches.map(m => parseInt(m.replace(/\./g, ''), 10) || 0);
    return Math.max(...nums);
  }
  return 0;
}

export function JobSearchPage() {
  const {
    jobs = [],
    companies = [],
    candidateProfile,
    setSelectedJobId,
    setActivePage,
    savedJobIds = [],
    toggleSaveJob,
    globalSearchQuery,
    setGlobalSearchQuery,
    showToast
  } = useApp();

  // Search & Autocomplete
  const [searchQuery, setSearchQuery] = useState(globalSearchQuery || '');
  const [searchLocation, setSearchLocation] = useState('All');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedJobType, setSelectedJobType] = useState('All');
  const [selectedSalary, setSelectedSalary] = useState('All');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [minMatchScore, setMinMatchScore] = useState(0);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [sortBy, setSortBy] = useState('match-desc');
  const [expandedWhyMatchJobId, setExpandedWhyMatchJobId] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const resultsRef = useRef(null);

  useEffect(() => { setSearchQuery(globalSearchQuery || ''); }, [globalSearchQuery]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchInputRef.current && !searchInputRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const candidateSkills = candidateProfile?.skills || EMPTY_SKILLS;

  const toggleSkillFilter = (skill) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSearchLocation('All');
    setSelectedCategory('All');
    setSelectedJobType('All');
    setSelectedSalary('All');
    setVerifiedOnly(false);
    setMinMatchScore(0);
    setSelectedSkills([]);
    setSortBy('match-desc');
    setGlobalSearchQuery('');
    showToast('Đã đặt lại toàn bộ bộ lọc tìm kiếm.', 'info');
  };

  const filteredJobs = useMemo(() => {
    let result = jobs.filter(job => !job.moderationStatus || job.moderationStatus === 'APPROVED').map(job => {
      const match = calculateSkillMatch(candidateSkills, job.requiredSkills || []);
      return {
        ...job,
        match
      };
    });

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter(job =>
        (job.title || '').toLowerCase().includes(query) ||
        (job.company || '').toLowerCase().includes(query) ||
        (job.description || '').toLowerCase().includes(query) ||
        (job.requiredSkills || []).some(s => s.toLowerCase().includes(query))
      );
    }

    if (searchLocation !== 'All') {
      result = result.filter(job =>
        (job.location || '').toLowerCase().includes(searchLocation.toLowerCase()) ||
        (searchLocation === 'Hồ Chí Minh' && /tp\.?\s*hcm/i.test(job.location || ''))
      );
    }

    if (selectedCategory !== 'All') {
      result = result.filter(job =>
        (job.category || job.title || '').toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }

    if (selectedJobType !== 'All') {
      result = result.filter(job =>
        (job.jobType || '').toLowerCase().includes(selectedJobType.toLowerCase())
      );
    }

    if (selectedSalary !== 'All') {
      result = result.filter(job => {
        const val = extractMaxSalary(job.salary);
        if (selectedSalary === 'under-8m') return val > 0 && val <= 8000000;
        if (selectedSalary === '8m-12m') return val >= 8000000 && val <= 12000000;
        if (selectedSalary === '12m-20m') return val >= 12000000 && val <= 20000000;
        if (selectedSalary === 'over-20m') return val > 20000000;
        return true;
      });
    }

    if (verifiedOnly) {
      result = result.filter(isVerifiedJob);
    }

    if (minMatchScore > 0) {
      result = result.filter(job => job.match.percentage >= minMatchScore);
    }

    if (selectedSkills.length > 0) {
      result = result.filter(job =>
        selectedSkills.every(sk =>
          (job.requiredSkills || []).some(req => req.toLowerCase() === sk.toLowerCase())
        )
      );
    }

    if (sortBy === 'match-desc') {
      result.sort((a, b) => b.match.percentage - a.match.percentage);
    } else if (sortBy === 'salary-high') {
      result.sort((a, b) => extractMaxSalary(b.salary) - extractMaxSalary(a.salary));
    } else if (sortBy === 'newest') {
      result.sort((a, b) => (b.id || '').localeCompare(a.id || ''));
    }

    return result;
  }, [jobs, candidateSkills, searchQuery, searchLocation, selectedCategory, selectedJobType, selectedSalary, verifiedOnly, minMatchScore, selectedSkills, sortBy]);

  const activeFilterCount = (searchLocation !== 'All' ? 1 : 0) + (selectedCategory !== 'All' ? 1 : 0) +
    (selectedJobType !== 'All' ? 1 : 0) +
    (selectedSalary !== 'All' ? 1 : 0) +
    (verifiedOnly ? 1 : 0) +
    (minMatchScore > 0 ? 1 : 0) +
    selectedSkills.length;

  const topMatchJob = filteredJobs.reduce((best, job) => !best || job.match.percentage > best.match.percentage ? job : best, null);
  const approvedCount = jobs.filter(job => !job.moderationStatus || job.moderationStatus === 'APPROVED').length;
  const openJob = (id) => { setSelectedJobId(id); setActivePage('job-detail'); };
  const submitSearch = (event) => {
    event.preventDefault();
    setShowSuggestions(false);
    setGlobalSearchQuery(searchQuery);
    resultsRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  };
  const filterChips = [
    ...(searchLocation !== 'All' ? [{ label: searchLocation, clear: () => setSearchLocation('All') }] : []),
    ...(selectedCategory !== 'All' ? [{ label: selectedCategory, clear: () => setSelectedCategory('All') }] : []),
    ...(selectedJobType !== 'All' ? [{ label: selectedJobType, clear: () => setSelectedJobType('All') }] : []),
    ...(selectedSalary !== 'All' ? [{ label: SALARY_RANGES.find(item => item.value === selectedSalary)?.label, clear: () => setSelectedSalary('All') }] : []),
    ...(verifiedOnly ? [{ label: 'Đã xác minh', clear: () => setVerifiedOnly(false) }] : []),
    ...(minMatchScore > 0 ? [{ label: `Khớp từ ${minMatchScore}%`, clear: () => setMinMatchScore(0) }] : []),
    ...selectedSkills.map(skill => ({ label: skill, clear: () => toggleSkillFilter(skill) })),
  ];

  return (
    <div className="job-discovery">
      <header className="discovery-page-heading"><div><span>CƠ HỘI NGHỀ NGHIỆP</span><h1>Khám phá việc làm</h1></div><p><BriefcaseBusiness size={15} />{approvedCount} vị trí đang hiển thị</p></header>
      <section className="discovery-hero" aria-label="Tìm kiếm việc làm IT">
        <div className="discovery-hero-copy"><span className="discovery-kicker"><span /> AI SKILL-BASED JOB SEARCH</span><h2>Việc làm IT & cơ hội thực tập.<br /><span>Tìm bước tiến phù hợp với bạn.</span></h2><p>Khám phá cơ hội từ các doanh nghiệp công nghệ và đối chiếu yêu cầu với kỹ năng của bạn.</p></div>
        <div className="discovery-orbit-scene" aria-hidden="true">
          <div className="discovery-orbit-glow" />
          <div className="discovery-orbit-system">
            <div className="discovery-orbit-ring ring-one" /><div className="discovery-orbit-ring ring-two" />
            <div className="discovery-orbit-core"><BriefcaseBusiness size={34} strokeWidth={1.5} /><strong>CareerFit</strong><span>YOUR NEXT CHAPTER</span></div>
            <div className="discovery-float-card float-code"><span>&lt;/&gt;</span><div><strong>Development</strong><small>Java · React · Python</small></div></div>
            <div className="discovery-float-card float-career"><BriefcaseBusiness size={22} /><div><strong>Cơ hội mới</strong><small>Kết nối năng lực của bạn</small></div></div>
            <i className="discovery-orbit-spark spark-one" /><i className="discovery-orbit-spark spark-two" />
          </div>
        </div>
        <form className="discovery-search" onSubmit={submitSearch} role="search">
          <div className="discovery-keyword" ref={searchInputRef}><Search size={18} /><input type="search" aria-label="Chức danh, công ty hoặc kỹ năng" placeholder="Vị trí, công ty hoặc kỹ năng: Java, React, SQL…" value={searchQuery} onChange={event => { setSearchQuery(event.target.value); setShowSuggestions(true); }} onFocus={() => setShowSuggestions(true)} onKeyDown={event => { if (event.key === 'Escape') setShowSuggestions(false); }} />
            {showSuggestions && SUGGESTIONS_LIST.some(item => !searchQuery || item.toLowerCase().includes(searchQuery.toLowerCase())) && <div className="discovery-suggestions"><p>Gợi ý tìm kiếm</p>{SUGGESTIONS_LIST.filter(item => !searchQuery || item.toLowerCase().includes(searchQuery.toLowerCase())).map(item => <button type="button" key={item} onClick={() => { setSearchQuery(item); setShowSuggestions(false); }}><Search size={13} />{item}</button>)}</div>}
          </div>
          <div className="discovery-location"><MapPin size={16} /><select aria-label="Địa điểm làm việc" value={searchLocation} onChange={event => setSearchLocation(event.target.value)}><option value="All">Tất cả địa điểm</option><option value="Hà Nội">Hà Nội</option><option value="Hồ Chí Minh">TP. Hồ Chí Minh</option><option value="Đà Nẵng">Đà Nẵng</option><option value="Remote">Remote</option></select><ChevronDown size={13} /></div>
          <button className="discovery-search-submit" type="submit">Tìm việc làm <ArrowRight size={16} /></button>
        </form>
        <div className="discovery-popular"><span>Khám phá nhanh:</span>{['Java', 'React', 'QA', 'Python'].map(skill => <button key={skill} type="button" onClick={() => { setSearchQuery(skill); setShowSuggestions(false); }}>{skill}<ArrowUpRight size={11} /></button>)}</div>
      </section>

      {topMatchJob && <section className="discovery-highlight" aria-label="Công việc nổi bật"><span className="highlight-icon"><BriefcaseBusiness size={22} strokeWidth={1.5} /></span><div><span className="highlight-label">{candidateSkills.length && topMatchJob.match.percentage > 0 ? 'PHÙ HỢP NHẤT VỚI KỸ NĂNG' : 'MỘT CƠ HỘI ĐỂ KHÁM PHÁ'}</span><h2>{topMatchJob.title}</h2><p>{topMatchJob.company}{candidateSkills.length > 0 && <> <span>·</span> {topMatchJob.match.percentage}% khớp kỹ năng</>}</p></div><button onClick={() => openJob(topMatchJob.id)}>Xem vị trí <ArrowUpRight size={16} /></button></section>}

      <div className="discovery-layout">
        <aside className={`discovery-filters ${filtersOpen ? 'filters-open' : ''}`} aria-label="Bộ lọc việc làm">
          <div className="discovery-filter-heading"><h2><SlidersHorizontal size={17} />Bộ lọc {activeFilterCount > 0 && <span>{activeFilterCount}</span>}</h2><button className="filter-reset" onClick={handleResetFilters}>Đặt lại</button><button className="filter-mobile-toggle" onClick={() => setFiltersOpen(!filtersOpen)} aria-expanded={filtersOpen} aria-controls="discovery-filter-content" aria-label={filtersOpen ? 'Thu gọn bộ lọc' : 'Mở bộ lọc'}><ChevronDown size={17} /></button></div>
          <div className="discovery-filter-content" id="discovery-filter-content">
            <fieldset className="filter-match"><legend>Độ khớp kỹ năng</legend><p>Dựa trên kỹ năng trong hồ sơ của bạn.</p><div className="filter-score-options">{[0, 60, 80].map(score => <button key={score} type="button" aria-pressed={minMatchScore === score} className={minMatchScore === score ? 'selected' : ''} onClick={() => setMinMatchScore(score)}>{score === 0 ? 'Tất cả' : `Từ ${score}%`}</button>)}</div></fieldset>
            <div className="filter-field"><label htmlFor="discovery-category">Chuyên môn</label><select id="discovery-category" value={selectedCategory} onChange={event => setSelectedCategory(event.target.value)}>{CATEGORIES.map(category => <option key={category} value={category}>{category === 'All' ? 'Tất cả chuyên môn' : category}</option>)}</select></div>
            <fieldset className="filter-types"><legend>Hình thức làm việc</legend>{JOB_TYPES.map(type => <label key={type}><input type="radio" name="discovery-job-type" value={type} checked={selectedJobType === type} onChange={() => setSelectedJobType(type)} /><span>{type === 'All' ? 'Tất cả hình thức' : type}</span></label>)}</fieldset>
            <div className="filter-field"><label htmlFor="discovery-salary">Mức lương</label><select id="discovery-salary" value={selectedSalary} onChange={event => setSelectedSalary(event.target.value)}>{SALARY_RANGES.map(range => <option key={range.value} value={range.value}>{range.label}</option>)}</select></div>
            <fieldset className="filter-skills"><legend>Kỹ năng yêu cầu</legend><div>{SKILL_OPTIONS.map(skill => <button key={skill} type="button" className={selectedSkills.includes(skill) ? 'selected' : ''} aria-pressed={selectedSkills.includes(skill)} onClick={() => toggleSkillFilter(skill)}>{selectedSkills.includes(skill) && <Check size={11} />}{skill}</button>)}</div></fieldset>
            <label className="filter-verified"><span><ShieldCheck size={16} />Doanh nghiệp đã xác minh</span><input type="checkbox" checked={verifiedOnly} onChange={event => setVerifiedOnly(event.target.checked)} /></label>
          </div>
        </aside>

        <section className="discovery-results" ref={resultsRef} aria-label="Kết quả tìm việc">
          <div className="discovery-results-heading"><div><h2>Kết quả tìm kiếm <span aria-live="polite">{filteredJobs.length}</span></h2><p>{searchQuery ? `Dành cho từ khóa “${searchQuery}”` : 'Tìm công việc tiếp theo của bạn.'}</p></div><div className="discovery-sort"><label htmlFor="discovery-sort">Sắp xếp</label><select id="discovery-sort" value={sortBy} onChange={event => setSortBy(event.target.value)}><option value="match-desc">Khớp kỹ năng cao nhất</option><option value="salary-high">Lương cao nhất</option><option value="newest">Tin mới nhất</option></select></div></div>
          {filterChips.length > 0 && <div className="discovery-active-filters">{filterChips.map(chip => <button key={chip.label} onClick={chip.clear} aria-label={`Bỏ lọc ${chip.label}`}>{chip.label}<X size={12} /></button>)}<button className="clear-all" onClick={handleResetFilters}>Xóa tất cả</button></div>}
          {!candidateSkills.length && <div className="discovery-profile-hint"><CircleHelp size={16} /><p>Thêm kỹ năng vào hồ sơ để xem mức độ phù hợp của từng công việc.</p><button onClick={() => setActivePage('candidate-onboarding')}>Cập nhật <ArrowUpRight size={13} /></button></div>}
          {filteredJobs.length === 0 ? <div className="discovery-empty"><Search size={28} strokeWidth={1.5} /><h3>Chưa tìm thấy vị trí phù hợp</h3><p>Thử từ khóa khác hoặc giảm bớt tiêu chí lọc.</p><button onClick={handleResetFilters}>Đặt lại bộ lọc <ArrowRight size={15} /></button></div> : <div className="discovery-job-list">{filteredJobs.map((job, index) => {
            const saved = savedJobIds.includes(job.id);
            const expanded = expandedWhyMatchJobId === job.id;
            return <article key={job.id} className="discovery-job-card">
              {(() => {
                const jobLogo = job.logo || companies.find(c => (c.id && c.id === job.employerId) || (c.companyName && c.companyName === job.company))?.logo;
                const hasImg = isImageLogo(jobLogo);
                return (
                  <div className="discovery-job-top">
                    {hasImg ? (
                      <span className="discovery-company-logo" aria-hidden="true">
                        <img
                          src={getCompanyLogoUrl(jobLogo)}
                          alt=""
                          className="w-full h-full object-contain"
                          style={{ background: 'transparent' }}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      </span>
                    ) : (
                      <span className={`discovery-company-mark mark-${index % 4}`} aria-hidden="true">
                        {(job.company || 'IT').charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div className="discovery-job-info">
                      <button className="discovery-job-title" onClick={() => openJob(job.id)}>{job.title}</button>
                      <p className="discovery-company-name">{job.company}{isVerifiedJob(job) && <ShieldCheck size={13} aria-label="Doanh nghiệp đã xác minh" />}</p>
                    </div>
                    <button className={`discovery-bookmark ${saved ? 'saved' : ''}`} aria-pressed={saved} aria-label={saved ? `Bỏ lưu ${job.title}` : `Lưu ${job.title}`} onClick={() => toggleSaveJob(job.id)}>
                      <Bookmark size={18} strokeWidth={1.6} fill={saved ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                );
              })()}
              <div className="discovery-job-facts"><span><MapPin size={13} />{job.location || 'Chưa cập nhật địa điểm'}</span>{job.jobType && <span><BriefcaseBusiness size={13} />{job.jobType}</span>}<strong>{job.salary || 'Lương thỏa thuận'}</strong></div>
              <div className="discovery-job-skills">{(job.requiredSkills || []).map(skill => <span key={skill} className={candidateSkills.some(item => item.toLowerCase() === skill.toLowerCase()) ? 'matched' : ''}>{candidateSkills.some(item => item.toLowerCase() === skill.toLowerCase()) && <Check size={10} />}{skill}</span>)}</div>
              <div className="discovery-job-footer"><button className={`discovery-match-toggle ${candidateSkills.length ? 'has-profile' : ''}`} aria-expanded={expanded} aria-controls={`discovery-match-${job.id}`} onClick={() => setExpandedWhyMatchJobId(expanded ? null : job.id)}>{candidateSkills.length ? <><span className="discovery-match-dot" /><strong>{job.match.percentage}%</strong> khớp kỹ năng</> : <><CircleHelp size={13} />Đối chiếu kỹ năng</>}<ChevronDown size={13} className={expanded ? 'is-expanded' : ''} /></button><div className="discovery-job-actions">{job.postedDate && <span>{job.postedDate}</span>}<button onClick={() => openJob(job.id)}>Xem chi tiết <ArrowUpRight size={14} /></button></div></div>
              <div className={`discovery-match-details ${expanded ? 'is-open' : ''}`} id={`discovery-match-${job.id}`} aria-hidden={!expanded} inert={!expanded}><div><div className="match-details-content"><p>Đối chiếu kỹ năng với yêu cầu tuyển dụng</p><div><section><h4><Check size={13} />Kỹ năng đã khớp</h4><p>{job.match.matchedSkills.join(', ') || 'Chưa có kỹ năng khớp'}</p></section><section><h4>Kỹ năng cần bổ sung</h4><p>{job.match.missingSkills.join(', ') || 'Đã đáp ứng các kỹ năng yêu cầu'}</p></section></div></div></div></div>
            </article>;
          })}</div>}
          <div className="discovery-results-note"><ShieldCheck size={13} /><span>Kiểm tra yêu cầu và thông tin doanh nghiệp trước khi gửi hồ sơ.</span></div>
        </section>
      </div>
    </div>
  );
}


