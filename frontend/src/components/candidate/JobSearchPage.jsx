import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { calculateSkillMatch } from '../../utils/matching';
import { useJobSearch } from '../../hooks/useJobSearch';
import { jobApi } from '../../services/apiService';
import { isImageLogo, getCompanyLogoUrl } from '../../utils/logoUtils';
import './JobSearchPage.css';
import {
  Search,
  MapPin,
  ChevronDown,
  ChevronLeft, ChevronRight, RefreshCw,
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

const EMPTY_SKILLS = [];
const isVerifiedJob = (job) => job.isVerified || ['Verified', 'VERIFIED'].includes(job.verifiedStatus || job.verificationStatus);

function readUrlState() {
  const params = new URLSearchParams(window.location.search);
  const page = Number.parseInt(params.get('page') || '0', 10);
  const toMillions = (value) => value && Number.isFinite(Number(value))
    ? String(Number(value) / 1_000_000)
    : '';
  return {
    keyword: params.get('keyword') || '',
    location: params.get('location') || '',
    category: params.get('category') || '',
    jobType: params.get('jobType') || '',
    minSalary: toMillions(params.get('minSalary')),
    maxSalary: toMillions(params.get('maxSalary')),
    sort: params.get('sort') || 'newest',
    page: Number.isInteger(page) && page >= 0 ? page : 0
  };
}

function toSalaryAmount(value) {
  if (value === '' || value == null) return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.round(number * 1_000_000) : null;
}

export function JobSearchPage() {
  const {
    candidateProfile,
    companies = [],
    jobs: appJobs = [],
    setSelectedJobId,
    setSelectedJobOverride,
    setActivePage,
    savedJobIds = [],
    toggleSaveJob,
    globalSearchQuery,
    setGlobalSearchQuery,
    showToast
  } = useApp();

  const initialUrlState = useRef(readUrlState()).current;

  // Search & Autocomplete
  const [searchQuery, setSearchQuery] = useState(initialUrlState.keyword);
  const lastGlobalSearch = useRef(globalSearchQuery);
  const [searchLocation, setSearchLocation] = useState(initialUrlState.location);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState(initialUrlState.category);
  const [selectedJobType, setSelectedJobType] = useState(initialUrlState.jobType);
  const [minSalary, setMinSalary] = useState(initialUrlState.minSalary);
  const [maxSalary, setMaxSalary] = useState(initialUrlState.maxSalary);
  const [sortBy, setSortBy] = useState(initialUrlState.sort);
  const [page, setPage] = useState(initialUrlState.page);
  const [filterOptions, setFilterOptions] = useState({ categories: [], jobTypes: [], locations: [] });
  const [expandedWhyMatchJobId, setExpandedWhyMatchJobId] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const resultsRef = useRef(null);

  const apiMinSalary = toSalaryAmount(minSalary);
  const apiMaxSalary = toSalaryAmount(maxSalary);
  const {
    jobs,
    isLoading,
    error,
    totalPages,
    totalElements,
    retry
  } = useJobSearch({
    keyword: searchQuery,
    location: searchLocation || null,
    category: selectedCategory || null,
    jobType: selectedJobType || null,
    minSalary: apiMinSalary,
    maxSalary: apiMaxSalary,
    sort: sortBy === 'match-desc' ? 'newest' : sortBy,
    page,
    size: 10
  });

  useEffect(() => {
    setGlobalSearchQuery(initialUrlState.keyword);
  }, [initialUrlState.keyword, setGlobalSearchQuery]);

  useEffect(() => {
    if (lastGlobalSearch.current === globalSearchQuery) return;
    lastGlobalSearch.current = globalSearchQuery;
    if (globalSearchQuery === searchQuery) return;
    setSearchQuery(globalSearchQuery || '');
    setPage(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalSearchQuery]);

  useEffect(() => {
    let active = true;
    jobApi.getFilterOptions()
      .then(response => {
        if (active && response?.data) setFilterOptions(response.data);
      })
      .catch(() => {
        if (active) setFilterOptions({ categories: [], jobTypes: [], locations: [] });
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (window.location.pathname !== '/jobs') return;
    const params = new URLSearchParams();
    const setIfPresent = (name, value) => { if (value !== '' && value != null) params.set(name, value); };
    setIfPresent('keyword', searchQuery.trim());
    setIfPresent('location', searchLocation);
    setIfPresent('category', selectedCategory);
    setIfPresent('jobType', selectedJobType);
    setIfPresent('minSalary', apiMinSalary);
    setIfPresent('maxSalary', apiMaxSalary);
    if (sortBy !== 'newest') params.set('sort', sortBy);
    if (page > 0) params.set('page', String(page));
    const queryString = params.toString();
    window.history.replaceState({ ...window.history.state }, '', `${window.location.pathname}${queryString ? `?${queryString}` : ''}${window.location.hash}`);
  }, [searchQuery, searchLocation, selectedCategory, selectedJobType, apiMinSalary, apiMaxSalary, sortBy, page]);

  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname !== '/jobs') return;
      const state = readUrlState();
      setSearchQuery(state.keyword);
      setGlobalSearchQuery(state.keyword);
      setSearchLocation(state.location);
      setSelectedCategory(state.category);
      setSelectedJobType(state.jobType);
      setMinSalary(state.minSalary);
      setMaxSalary(state.maxSalary);
      setSortBy(state.sort);
      setPage(state.page);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [setGlobalSearchQuery]);

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

  const updateFilter = (setter, value) => {
    window.history.pushState({ ...window.history.state }, '', window.location.href);
    setter(value);
    setPage(0);
  };

  const handleResetFilters = () => {
    window.history.pushState({ ...window.history.state }, '', window.location.href);
    setSearchQuery('');
    setSearchLocation('');
    setSelectedCategory('');
    setSelectedJobType('');
    setMinSalary('');
    setMaxSalary('');
    setSortBy('newest');
    setPage(0);
    setGlobalSearchQuery('');
    showToast('Đã đặt lại toàn bộ bộ lọc tìm kiếm.', 'info');
  };

  const displayedJobs = useMemo(() => {
    // 1. Merge jobs from search API with local appJobs state
    const mergedList = jobs.map(job => {
      const localJob = appJobs.find(j => j.id === job.id);
      if (localJob) {
        // If localJob is still PENDING or REJECTED, candidate must NOT see it yet
        if (localJob.moderationStatus === 'PENDING' || localJob.verificationStatus === 'Pending') return null;
        if (localJob.moderationStatus === 'REJECTED' || localJob.verificationStatus === 'Rejected') return null;

        // If approved, merge all latest edits (title, description, skills, responsibilities, requirements)
        return {
          ...job,
          ...localJob,
          title: localJob.title || job.title,
          description: localJob.description || job.description,
          requiredSkills: (localJob.requiredSkills && localJob.requiredSkills.length > 0)
            ? localJob.requiredSkills
            : (job.requiredSkills || []),
          preferredSkills: (localJob.preferredSkills && localJob.preferredSkills.length > 0)
            ? localJob.preferredSkills
            : (job.preferredSkills || []),
          responsibilities: (localJob.responsibilities && (Array.isArray(localJob.responsibilities) ? localJob.responsibilities.length > 0 : Boolean(localJob.responsibilities)))
            ? localJob.responsibilities
            : (job.responsibilities || []),
          requirements: (localJob.requirements && (Array.isArray(localJob.requirements) ? localJob.requirements.length > 0 : Boolean(localJob.requirements)))
            ? localJob.requirements
            : (job.requirements || [])
        };
      }
      return job;
    }).filter(Boolean);

    // 2. Only include locally approved jobs if they match the active search filter criteria
    appJobs.forEach(aj => {
      if ((aj.moderationStatus === 'APPROVED' || aj.verificationStatus === 'Verified') &&
          !mergedList.some(mj => mj.id === aj.id)) {
        if (searchQuery && !((aj.title || '') + ' ' + (aj.company || '') + ' ' + (aj.description || '')).toLowerCase().includes(searchQuery.toLowerCase())) {
          return;
        }
        if (searchLocation && !((aj.location || '')).toLowerCase().includes(searchLocation.toLowerCase())) {
          return;
        }
        if (selectedCategory && (aj.category || '').toLowerCase() !== selectedCategory.toLowerCase()) {
          return;
        }
        if (selectedJobType && !(aj.jobType || '').toLowerCase().includes(selectedJobType.toLowerCase())) {
          return;
        }
        mergedList.push(aj);
      }
    });

    const result = mergedList.map(job => {
      const match = calculateSkillMatch(candidateSkills, job.requiredSkills || [], candidateProfile?.extractedCvText);
      return {
        ...job,
        match
      };
    });

    if (sortBy === 'match-desc') {
      result.sort((a, b) => b.match.percentage - a.match.percentage);
    }

    return result;
  }, [jobs, appJobs, candidateSkills, sortBy, candidateProfile?.extractedCvText]);

  const activeFilterCount = (searchLocation ? 1 : 0) + (selectedCategory ? 1 : 0) +
    (selectedJobType ? 1 : 0) + (minSalary !== '' ? 1 : 0) + (maxSalary !== '' ? 1 : 0);

  const topMatchJob = displayedJobs.reduce((best, job) => !best || job.match.percentage > best.match.percentage ? job : best, null);
  const approvedCount = totalElements;

  const openJob = (job) => {
    const localJob = appJobs.find(j => j.id === job.id);
    const finalJob = localJob ? { ...job, ...localJob } : job;
    if (setSelectedJobOverride) {
      setSelectedJobOverride(finalJob);
    }
    setSelectedJobId(job.id);
    setActivePage('job-detail');
  };

  const submitSearch = (event) => {
    event.preventDefault();
    window.history.pushState({ ...window.history.state }, '', window.location.href);
    setPage(0);
    setShowSuggestions(false);
    setGlobalSearchQuery(searchQuery.trim());
    resultsRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  };

  const filterChips = [
    ...(searchLocation ? [{ label: searchLocation, clear: () => updateFilter(setSearchLocation, '') }] : []),
    ...(selectedCategory ? [{ label: selectedCategory, clear: () => updateFilter(setSelectedCategory, '') }] : []),
    ...(selectedJobType ? [{ label: selectedJobType, clear: () => updateFilter(setSelectedJobType, '') }] : []),
    ...(minSalary !== '' ? [{ label: `Từ ${minSalary} triệu`, clear: () => updateFilter(setMinSalary, '') }] : []),
    ...(maxSalary !== '' ? [{ label: `Đến ${maxSalary} triệu`, clear: () => updateFilter(setMaxSalary, '') }] : []),
  ];

  const changePage = (nextPage) => {
    const safePage = Math.max(0, Math.min(nextPage, Math.max(totalPages - 1, 0)));
    if (safePage === page) return;
    window.history.pushState({ ...window.history.state }, '', window.location.href);
    setPage(safePage);
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="job-discovery">
      <header className="discovery-page-heading">
        <div><span>CƠ HỘI NGHỀ NGHIỆP</span><h1>Khám phá việc làm</h1></div>
        <p><BriefcaseBusiness size={15} />{approvedCount} vị trí đang hiển thị</p>
      </header>

      <section className="discovery-hero" aria-label="Tìm kiếm việc làm IT">
        <div className="discovery-hero-copy">
          <span className="discovery-kicker"><span /> AI SKILL-BASED JOB SEARCH</span>
          <h2>Việc làm IT & cơ hội thực tập.<br /><span>Tìm bước tiến phù hợp với bạn.</span></h2>
          <p>Khám phá cơ hội từ các doanh nghiệp công nghệ và đối chiếu yêu cầu với kỹ năng của bạn.</p>
        </div>
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
          <div className="discovery-keyword" ref={searchInputRef}>
            <Search size={18} />
            <input
              type="search"
              aria-label="Chức danh, mô tả hoặc kỹ năng"
              placeholder="Vị trí, mô tả hoặc kỹ năng: Java, React, SQL…"
              value={searchQuery}
              onChange={event => { setSearchQuery(event.target.value); setGlobalSearchQuery(event.target.value); setPage(0); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={event => { if (event.key === 'Escape') setShowSuggestions(false); }}
            />
            {searchQuery && (
              <button type="button" className="discovery-search-clear" aria-label="Xóa từ khóa" onClick={() => { updateFilter(setSearchQuery, ''); setGlobalSearchQuery(''); setShowSuggestions(false); }}>
                <X size={15} />
              </button>
            )}
            {showSuggestions && SUGGESTIONS_LIST.some(item => !searchQuery || item.toLowerCase().includes(searchQuery.toLowerCase())) && (
              <div className="discovery-suggestions">
                <p>Gợi ý tìm kiếm</p>
                {SUGGESTIONS_LIST.filter(item => !searchQuery || item.toLowerCase().includes(searchQuery.toLowerCase())).map(item => (
                  <button type="button" key={item} onClick={() => { updateFilter(setSearchQuery, item); setGlobalSearchQuery(item); setShowSuggestions(false); }}>
                    <Search size={13} />{item}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="discovery-location">
            <MapPin size={16} />
            <input
              list="job-location-options"
              aria-label="Địa điểm làm việc"
              placeholder="Địa điểm"
              value={searchLocation}
              onChange={event => { setSearchLocation(event.target.value); setPage(0); }}
            />
            <datalist id="job-location-options">
              {filterOptions.locations.map(location => <option key={location} value={location} />)}
            </datalist>
          </div>
          <button className="discovery-search-submit" type="submit">Tìm việc làm <ArrowRight size={16} /></button>
        </form>
        <div className="discovery-popular">
          <span>Khám phá nhanh:</span>
          {['Java', 'React', 'QA', 'Python'].map(skill => (
            <button key={skill} type="button" onClick={() => { updateFilter(setSearchQuery, skill); setGlobalSearchQuery(skill); setShowSuggestions(false); }}>
              {skill}<ArrowUpRight size={11} />
            </button>
          ))}
        </div>
      </section>

      {topMatchJob && !isLoading && !error && (
        <section className="discovery-highlight" aria-label="Công việc nổi bật">
          <span className="highlight-icon"><BriefcaseBusiness size={22} strokeWidth={1.5} /></span>
          <div>
            <span className="highlight-label">{candidateSkills.length && topMatchJob.match.percentage > 0 ? 'PHÙ HỢP NHẤT VỚI KỸ NĂNG' : 'MỘT CƠ HỘI ĐỂ KHÁM PHÁ'}</span>
            <h2>{topMatchJob.title}</h2>
            <p>{topMatchJob.company}{candidateSkills.length > 0 && <> <span>·</span> {topMatchJob.match.percentage}% khớp kỹ năng</>}</p>
          </div>
          <button onClick={() => openJob(topMatchJob)}>Xem vị trí <ArrowUpRight size={16} /></button>
        </section>
      )}

      <div className="discovery-layout">
        <aside className={`discovery-filters ${filtersOpen ? 'filters-open' : ''}`} aria-label="Bộ lọc việc làm">
          <div className="discovery-filter-heading">
            <h2><SlidersHorizontal size={17} />Bộ lọc {activeFilterCount > 0 && <span>{activeFilterCount}</span>}</h2>
            <button className="filter-reset" onClick={handleResetFilters}>Đặt lại</button>
            <button className="filter-mobile-toggle" onClick={() => setFiltersOpen(!filtersOpen)} aria-expanded={filtersOpen} aria-controls="discovery-filter-content" aria-label={filtersOpen ? 'Thu gọn bộ lọc' : 'Mở bộ lọc'}>
              <ChevronDown size={17} />
            </button>
          </div>
          <div className="discovery-filter-content" id="discovery-filter-content">
            <div className="filter-field">
              <label htmlFor="discovery-category">Chuyên môn / Ngành nghề</label>
              <select id="discovery-category" value={selectedCategory} onChange={event => updateFilter(setSelectedCategory, event.target.value)}>
                <option value="">Tất cả chuyên môn</option>
                {filterOptions.categories.map(category => <option key={category} value={category}>{category}</option>)}
              </select>
            </div>
            <div className="filter-field">
              <label htmlFor="discovery-job-type">Hình thức làm việc</label>
              <select id="discovery-job-type" value={selectedJobType} onChange={event => updateFilter(setSelectedJobType, event.target.value)}>
                <option value="">Tất cả hình thức</option>
                {filterOptions.jobTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <fieldset className="filter-salary">
              <legend>Mức lương (triệu VNĐ/tháng)</legend>
              <div>
                <label htmlFor="discovery-min-salary">
                  Tối thiểu
                  <input
                    id="discovery-min-salary"
                    type="number"
                    min="0"
                    step="0.5"
                    inputMode="decimal"
                    placeholder="Ví dụ: 8"
                    value={minSalary}
                    onChange={event => { setMinSalary(event.target.value); setPage(0); }}
                  />
                </label>
                <label htmlFor="discovery-max-salary">
                  Tối đa
                  <input
                    id="discovery-max-salary"
                    type="number"
                    min="0"
                    step="0.5"
                    inputMode="decimal"
                    placeholder="Ví dụ: 20"
                    value={maxSalary}
                    onChange={event => { setMaxSalary(event.target.value); setPage(0); }}
                  />
                </label>
              </div>
              {apiMinSalary != null && apiMaxSalary != null && apiMinSalary > apiMaxSalary && (
                <p role="alert">Lương tối thiểu không được lớn hơn lương tối đa.</p>
              )}
            </fieldset>
          </div>
        </aside>

        <section className="discovery-results" ref={resultsRef} aria-label="Kết quả tìm việc">
          <div className="discovery-results-heading">
            <div>
              <h2>Kết quả tìm kiếm <span aria-live="polite">{totalElements}</span></h2>
              <p>{searchQuery ? `Dành cho từ khóa “${searchQuery.trim()}”` : 'Tìm công việc tiếp theo của bạn.'}</p>
            </div>
            <div className="discovery-sort">
              <label htmlFor="discovery-sort">Sắp xếp</label>
              <select id="discovery-sort" value={sortBy} onChange={event => updateFilter(setSortBy, event.target.value)}>
                <option value="match-desc">Khớp kỹ năng cao nhất</option>
                <option value="salary-high">Lương cao nhất</option>
                <option value="newest">Tin mới nhất</option>
              </select>
            </div>
          </div>

          {filterChips.length > 0 && (
            <div className="discovery-active-filters">
              {filterChips.map(chip => (
                <button key={chip.label} onClick={chip.clear} aria-label={`Bỏ lọc ${chip.label}`}>
                  {chip.label}<X size={12} />
                </button>
              ))}
              <button className="clear-all" onClick={handleResetFilters}>Xóa tất cả</button>
            </div>
          )}

          {!candidateSkills.length && (
            <div className="discovery-profile-hint">
              <CircleHelp size={16} />
              <p>Thêm kỹ năng vào hồ sơ để xem mức độ phù hợp của từng công việc.</p>
              <button onClick={() => setActivePage('candidate-onboarding')}>Cập nhật <ArrowUpRight size={13} /></button>
            </div>
          )}

          {isLoading ? (
            <div className="discovery-job-list" aria-label="Đang tải việc làm">
              {Array.from({ length: 4 }, (_, index) => (
                <div className="discovery-job-skeleton" key={index}>
                  <span />
                  <div><i /><i /><i /></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="discovery-empty discovery-error">
              <RefreshCw size={28} strokeWidth={1.5} />
              <h3>Không thể tải danh sách việc làm</h3>
              <p>{error}</p>
              <button onClick={retry}>Thử tải lại <RefreshCw size={15} /></button>
            </div>
          ) : displayedJobs.length === 0 ? (
            <div className="discovery-empty">
              <Search size={28} strokeWidth={1.5} />
              <h3>Chưa tìm thấy vị trí phù hợp</h3>
              <p>Thử từ khóa khác hoặc giảm bớt tiêu chí lọc.</p>
              <button onClick={handleResetFilters}>Đặt lại bộ lọc <ArrowRight size={15} /></button>
            </div>
          ) : (
            <div className="discovery-job-list">
              {displayedJobs.map((job, index) => {
                const saved = savedJobIds.includes(job.id);
                const expanded = expandedWhyMatchJobId === job.id;
                const jobLogo = job.logo || companies.find(c => (c.id && c.id === job.employerId) || (c.companyName && c.companyName === job.company))?.logo;
                const hasImg = isImageLogo(jobLogo);

                return (
                  <article key={job.id} className="discovery-job-card">
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
                        <button className="discovery-job-title" onClick={() => openJob(job)}>{job.title}</button>
                        <p className="discovery-company-name">
                          {job.company}
                          {isVerifiedJob(job) && <ShieldCheck size={13} aria-label="Doanh nghiệp đã xác minh" />}
                        </p>
                      </div>
                      <button
                        className={`discovery-bookmark ${saved ? 'saved' : ''}`}
                        aria-pressed={saved}
                        aria-label={saved ? `Bỏ lưu ${job.title}` : `Lưu ${job.title}`}
                        onClick={() => toggleSaveJob(job.id)}
                      >
                        <Bookmark size={18} strokeWidth={1.6} fill={saved ? 'currentColor' : 'none'} />
                      </button>
                    </div>

                    <div className="discovery-job-facts">
                      <span><MapPin size={13} />{job.location || 'Chưa cập nhật địa điểm'}</span>
                      {job.jobType && <span><BriefcaseBusiness size={13} />{job.jobType}</span>}
                      <strong>{job.salary || 'Lương thỏa thuận'}</strong>
                    </div>

                    <div className="discovery-job-skills">
                      {(job.requiredSkills || []).map(skill => (
                        <span key={skill} className={candidateSkills.some(item => item.toLowerCase() === skill.toLowerCase()) ? 'matched' : ''}>
                          {candidateSkills.some(item => item.toLowerCase() === skill.toLowerCase()) && <Check size={10} />}
                          {skill}
                        </span>
                      ))}
                    </div>

                    <div className="discovery-job-footer">
                      <button
                        className={`discovery-match-toggle ${candidateSkills.length ? 'has-profile' : ''}`}
                        aria-expanded={expanded}
                        aria-controls={`discovery-match-${job.id}`}
                        onClick={() => setExpandedWhyMatchJobId(expanded ? null : job.id)}
                      >
                        {candidateSkills.length ? (
                          <><span className="discovery-match-dot" /><strong>{job.match.percentage}%</strong> khớp kỹ năng</>
                        ) : (
                          <><CircleHelp size={13} />Đối chiếu kỹ năng</>
                        )}
                        <ChevronDown size={13} className={expanded ? 'is-expanded' : ''} />
                      </button>
                      <div className="discovery-job-actions">
                        {job.postedDate && <span>{job.postedDate}</span>}
                        <button onClick={() => openJob(job)}>Xem chi tiết <ArrowUpRight size={14} /></button>
                      </div>
                    </div>

                    <div
                      className={`discovery-match-details ${expanded ? 'is-open' : ''}`}
                      id={`discovery-match-${job.id}`}
                      aria-hidden={!expanded}
                      inert={!expanded ? '' : undefined}
                    >
                      <div>
                        <div className="match-details-content">
                          <p>Đối chiếu kỹ năng với yêu cầu tuyển dụng</p>
                          <div>
                            <section>
                              <h4><Check size={13} />Kỹ năng đã khớp</h4>
                              <p>{job.match.matchedSkills.join(', ') || 'Chưa có kỹ năng khớp'}</p>
                            </section>
                            <section>
                              <h4>Kỹ năng cần bổ sung</h4>
                              <p>{job.match.missingSkills.join(', ') || 'Đã đáp ứng các kỹ năng yêu cầu'}</p>
                            </section>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {!isLoading && !error && totalPages > 1 && (
            <nav className="discovery-pagination" aria-label="Phân trang kết quả">
              <button type="button" onClick={() => changePage(page - 1)} disabled={page === 0}>
                <ChevronLeft size={16} />Trang trước
              </button>
              <span>Trang <strong>{page + 1}</strong> / {totalPages}</span>
              <button type="button" onClick={() => changePage(page + 1)} disabled={page >= totalPages - 1}>
                Trang sau<ChevronRight size={16} />
              </button>
            </nav>
          )}

          <div className="discovery-results-note">
            <ShieldCheck size={13} />
            <span>Kiểm tra yêu cầu và thông tin doanh nghiệp trước khi gửi hồ sơ.</span>
          </div>
        </section>
      </div>
    </div>
  );
}


