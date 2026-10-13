import React, { useRef, useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { mergeMasterRoadmap, sanitizeRoadmapTopics } from '../../utils/matching';
import {
  ArrowRight,
  Award,
  BookOpen,
  Check,
  ChevronDown,
  Clock3,
  ExternalLink,
  GraduationCap,
  ListChecks,
  Search,
  Target,
  Compass,
  Layers,
  Sparkles,
  Briefcase,
  Globe,
  Database
} from 'lucide-react';
import './LearningRoadmapPage.css';

function resourceUrl(value) {
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : null; } catch { return null; }
}
function topicTime(topic) {
  return topic.estimatedTime || (Number(topic.estimatedHours) > 0 ? `${topic.estimatedHours} giờ` : 'Chưa có thời lượng');
}
function formatRoadmapSkillLabel(skillText) {
  if (!skillText) return 'Chọn lộ trình';
  const parts = skillText.split(/[•&,]/).map(s => s.trim()).filter(Boolean);
  if (parts.length > 3) {
    return `${parts.slice(0, 2).join(' • ')} + ${parts.length - 2} kỹ năng khác`;
  }
  return skillText;
}

export function LearningRoadmapPage() {
  const {
    roadmaps = [],
    personalRoadmaps = [],
    activeRoadmapType = 'ALL',
    setActiveRoadmapType,
    activePersonalJobId,
    setActivePersonalJobId,
    toggleRoadmapTopic,
    setActivePage
  } = useApp();

  const [selectedId, setSelectedId] = useState('');
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');

  // 1. Tạo hoặc cập nhật Roadmap Tổng Thể (Master Roadmap) từ các roadmap cá nhân đã tạo
  const masterRoadmap = useMemo(() => {
    if (personalRoadmaps && personalRoadmaps.length > 0) {
      return mergeMasterRoadmap(personalRoadmaps);
    }
    // Fallback: nếu chưa tạo roadmap cá nhân nào thì dùng roadmap mặc định từ hệ thống
    return roadmaps[0] || null;
  }, [personalRoadmaps, roadmaps]);

  // 2. Xác định Roadmap hiện tại đang được hiển thị theo chế độ
  const currentViewMode = activeRoadmapType || 'ALL'; // 'ALL' = Tổng thể, 'PERSONAL' = Cá nhân

  const allRoadmapsCatalog = useMemo(() => {
    return [
      ...(masterRoadmap ? [masterRoadmap] : []),
      ...personalRoadmaps,
      ...roadmaps
    ];
  }, [masterRoadmap, personalRoadmaps, roadmaps]);

  const roadmap = useMemo(() => {
    // Nếu người dùng đã chủ động bấm chọn 1 roadmap cụ thể từ Modal "Đổi lộ trình"
    if (selectedId) {
      if (selectedId === 'master-roadmap-candidate') {
        return masterRoadmap || roadmaps[0];
      }
      const foundPersonal = personalRoadmaps.find(p => String(p.id) === String(selectedId) || String(p.jobId) === String(selectedId));
      if (foundPersonal) return foundPersonal;
      const foundMain = roadmaps.find(item => String(item.id) === String(selectedId));
      if (foundMain) return foundMain;
    }

    if (currentViewMode === 'PERSONAL') {
      if (activePersonalJobId) {
        const found = personalRoadmaps.find(p => String(p.jobId) === String(activePersonalJobId) || String(p.id) === String(activePersonalJobId));
        if (found) return found;
      }
      return personalRoadmaps[0] || masterRoadmap || roadmaps[0];
    }

    // Chế độ 'ALL' (Roadmap Tổng thể)
    return masterRoadmap || roadmaps[0];
  }, [currentViewMode, activePersonalJobId, selectedId, personalRoadmaps, masterRoadmap, roadmaps]);

  const topics = useMemo(() => {
    return sanitizeRoadmapTopics(roadmap?.topics || []);
  }, [roadmap?.topics]);
  const completed = topics.filter(topic => topic.completed).length;
  const progress = topics.length ? Math.round(completed / topics.length * 100) : 0;
  const next = topics.find(topic => !topic.completed);
  const visible = topics.filter(topic => (filter === 'all' || (filter === 'completed' ? topic.completed : !topic.completed)) && `${topic.title} ${topic.resource || ''}`.toLocaleLowerCase('vi').includes(query.trim().toLocaleLowerCase('vi')));
  const remaining = topics.filter(topic => !topic.completed);
  const knownHours = remaining.map(topic => Number(topic.estimatedHours) > 0 ? Number(topic.estimatedHours) : (/^\s*\d+(?:[.,]\d+)?\s*(?:giờ|hours?|h)\s*$/i.test(topic.estimatedTime || '') ? parseFloat(topic.estimatedTime.replace(',', '.')) : null));
  const totalRemainingHours = knownHours.every(hours => hours !== null) ? knownHours.reduce((sum, hours) => sum + hours, 0) : null;
  const toggle = topic => toggleRoadmapTopic(roadmap.id, topic.id);
  const lessonRefs = useRef(new Map());

  const continueLearning = () => {
    setFilter('all'); setQuery('');
    requestAnimationFrame(() => {
      const lesson = lessonRefs.current.get(next?.id);
      lesson?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
      lesson?.focus({ preventScroll: true });
    });
  };

  // Tổng hợp toàn bộ lộ trình có thể chuyển đổi: Master Roadmap + Các lộ trình cá nhân đã phân tích + Các lộ trình mẫu từ CSDL
  const availableRoadmapsList = useMemo(() => {
    const list = [];
    if (masterRoadmap) {
      list.push({ ...masterRoadmap, categoryType: 'MASTER' });
    }
    personalRoadmaps.forEach(p => {
      list.push({ ...p, categoryType: 'PERSONAL' });
    });
    roadmaps.forEach(r => {
      // Tránh trùng lặp nếu đã có trong list
      if (!list.some(x => x.id === r.id)) {
        list.push({ ...r, categoryType: 'STANDARD' });
      }
    });
    return list;
  }, [masterRoadmap, personalRoadmaps, roadmaps]);

  const filteredCatalogRoadmaps = availableRoadmapsList.filter(rm => {
    const q = catalogSearch.toLowerCase().trim();
    if (!q) return true;
    const matchSkill = (rm.skill || rm.skillName || '').toLowerCase().includes(q);
    const matchRole = (rm.targetRole || rm.jobTitle || '').toLowerCase().includes(q);
    const matchCompany = (rm.company || '').toLowerCase().includes(q);
    const matchDesc = (rm.description || '').toLowerCase().includes(q);
    return matchSkill || matchRole || matchCompany || matchDesc;
  });

  return (
    <div className="learning-page">
      {/* ROADMAP TYPE SELECTOR TABS (ẢNH 1: ROADMAP CÁ NHÂN vs ẢNH 2: ROADMAP TỔNG THỂ) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (setActiveRoadmapType) setActiveRoadmapType('ALL');
              setSelectedId('');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              currentViewMode === 'ALL'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Layers size={14} />
            <span>Lộ trình Tổng thể (Master Roadmap)</span>
            {personalRoadmaps.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                currentViewMode === 'ALL' ? 'bg-blue-700 text-blue-100' : 'bg-slate-200 text-slate-700'
              }`}>
                Tổng hợp {personalRoadmaps.length} vị trí
              </span>
            )}
          </button>

          <button
            onClick={() => {
              if (setActiveRoadmapType) setActiveRoadmapType('PERSONAL');
              if (personalRoadmaps.length > 0 && !activePersonalJobId) {
                if (setActivePersonalJobId) setActivePersonalJobId(personalRoadmaps[0].jobId);
              }
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              currentViewMode === 'PERSONAL'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Sparkles size={14} />
            <span>Lộ trình Cá nhân hóa ({personalRoadmaps.length})</span>
          </button>
        </div>

        {/* Dropdown chọn nhanh job cá nhân nếu ở chế độ PERSONAL */}
        {currentViewMode === 'PERSONAL' && personalRoadmaps.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-bold hidden sm:inline">Vị trí:</span>
            <select
              value={activePersonalJobId || (personalRoadmaps[0] ? personalRoadmaps[0].jobId : '')}
              onChange={(e) => {
                if (setActivePersonalJobId) setActivePersonalJobId(e.target.value);
                setSelectedId('');
              }}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-blue-500 cursor-pointer"
            >
              {personalRoadmaps.map(p => (
                <option key={p.id} value={p.jobId || p.id}>
                  {p.jobTitle || p.targetRole} ({p.company || 'Doanh nghiệp'})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <header className="learning-hero">
        <div className="learning-hero-copy">
          <span className="learning-eyebrow flex items-center gap-1.5 w-fit">
            <Sparkles size={13} className="text-blue-300" />
            {currentViewMode === 'PERSONAL' ? 'ROADMAP CÁ NHÂN HÓA THEO CÔNG VIỆC' : 'LEARNING ROADMAP TỔNG THỂ'}
          </span>
          <h1>{currentViewMode === 'PERSONAL' ? 'Lộ trình cá nhân.' : 'Học từng bước.'}<br /><span>Tiến gần mục tiêu tuyển dụng.</span></h1>
          <p>{roadmap?.targetRole || 'Lộ trình học tập của bạn'}</p>
          <div className="learning-hero-tags flex-wrap">
            <span><BookOpen size={14} />{roadmap?.skill || 'Phát triển kỹ năng'}</span>
            <span><GraduationCap size={15} />{topics.length} bài học</span>
            {roadmap?.company && (
              <span><Briefcase size={14} />{roadmap.company}</span>
            )}
            <button
              type="button"
              onClick={() => setIsCatalogModalOpen(true)}
              className="text-xs font-semibold px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-blue-100 border border-white/20 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Khám phá và đổi lộ trình học tập"
            >
              <Compass size={13} className="text-blue-300" /> Đổi lộ trình
            </button>
          </div>
        </div>
        <div className="learning-hero-progress">
          <div className="learning-progress-ring" style={{ '--progress': `${progress}%` }}>
            <strong>{progress}<small>%</small></strong>
          </div>
          <div>
            <span>TIẾN ĐỘ CỦA BẠN</span>
            <h2>{completed} / {topics.length} bài hoàn thành</h2>
            <p>{next ? 'Mỗi bài học là một bước tiến nhỏ.' : topics.length ? 'Bạn đã đi hết lộ trình này.' : 'Bắt đầu khi lộ trình được bổ sung.'}</p>
            <div role="progressbar" aria-label="Tiến độ lộ trình" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} className="learning-progress-track">
              <i style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </header>

      <div className="learning-layout">
        <main className="learning-curriculum">
          <div className="learning-section-header flex flex-wrap items-center justify-between gap-4">
            <div className="shrink-0 min-w-[200px]">
              <span className="learning-kicker">KẾ HOẠCH PHÁT TRIỂN KỸ NĂNG</span>
              <h2>Lộ trình của bạn</h2>
              <p>Theo dõi những gì đã học, chọn bước tiếp theo.</p>
            </div>
            <div className="flex items-center gap-2 min-w-0 max-w-full sm:max-w-[60%]">
              <button
                type="button"
                onClick={() => setIsCatalogModalOpen(true)}
                className="btn btn-secondary text-xs font-semibold h-9 px-3.5 rounded-lg border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/70 text-indigo-700 shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all max-w-full"
                title="Nhấn để xem và chọn lộ trình khác"
              >
                <Compass size={14} className="text-indigo-600 shrink-0" />
                <span className="truncate max-w-[200px] sm:max-w-[260px] md:max-w-[320px]">
                  {formatRoadmapSkillLabel(roadmap?.skill)}
                </span>
                {availableRoadmapsList.length > 1 && (
                  <span className="text-[10px] bg-indigo-200/80 text-indigo-800 px-1.5 py-0.5 rounded-md font-bold shrink-0">
                    Đổi ({availableRoadmapsList.length})
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="learning-tools">
            <div className="learning-tabs" aria-label="Lọc bài học">
              {[
                { key: 'all', label: 'Tất cả', count: topics.length },
                { key: 'pending', label: 'Chưa hoàn thành', count: topics.length - completed },
                { key: 'completed', label: 'Đã hoàn thành', count: completed }
              ].map(tab => (
                <button
                  key={tab.key}
                  aria-pressed={filter === tab.key}
                  onClick={() => setFilter(tab.key)}
                >
                  {tab.label}<span>{tab.count}</span>
                </button>
              ))}
            </div>
            <label className="learning-search">
              <Search size={16} />
              <input
                aria-label="Tìm bài học"
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Tìm bài học…"
              />
            </label>
          </div>

          <div className="learning-lessons">
            {visible.map(topic => {
              const index = topics.indexOf(topic);
              const active = topic.id === next?.id;
              return (
                <article
                  tabIndex={-1}
                  ref={element => {
                    if (element) lessonRefs.current.set(topic.id, element);
                    else lessonRefs.current.delete(topic.id);
                  }}
                  key={topic.id}
                  className={`learning-lesson ${topic.completed ? 'is-complete' : active ? 'is-next' : ''}`}
                >
                  <div className="learning-step">
                    {topic.completed ? <Check size={16} /> : String(index + 1).padStart(2, '0')}
                  </div>
                  <div className="learning-lesson-content">
                    <div className="learning-lesson-meta">
                      <span>{topic.milestone || `Bài ${String(index + 1).padStart(2, '0')}`}</span>
                      {topic.skillName && (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded-md text-[11px] border border-slate-200">
                          {topic.skillName}
                        </span>
                      )}
                      {topic.sourceType === 'DATABASE' || (topic.resource && topic.resource.includes('[CSDL]')) ? (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 font-bold rounded-md text-[10px] border border-emerald-200 flex items-center gap-1">
                          <Database size={10} /> Nguồn CSDL chuẩn hóa
                        </span>
                      ) : topic.sourceType === 'INTERNET_AI_SEARCH' || topic.sourceType === 'INTERNET_AI_VERIFIED' || (topic.resource && topic.resource.includes('[Web')) ? (
                        <span className="px-2 py-0.5 bg-sky-50 text-sky-800 font-bold rounded-md text-[10px] border border-sky-200 flex items-center gap-1">
                          <Globe size={10} /> AI xác thực Internet
                        </span>
                      ) : null}
                      {active && <span className="learning-next-label">Tiếp theo</span>}
                      {topic.completed && <span className="learning-completed-label">Đã hoàn thành</span>}
                    </div>
                    <h3>{topic.title.replace(/^\d+\.\s*/, '')}</h3>
                    <p className="learning-time">
                      <Clock3 size={13} />{topicTime(topic)}<span>·</span>{topic.resource || 'Tài liệu đang được bổ sung'}
                    </p>
                    {topic.description && (
                      <p className="learning-topic-description">{topic.description}</p>
                    )}
                    {topic.itDomainRole && (
                      <div className="mt-2 text-[11px] bg-sky-50/90 text-sky-950 border border-sky-200/80 rounded-md px-3 py-1.5 flex items-start gap-2 shadow-xs">
                        <Sparkles size={13} className="text-sky-600 mt-0.5 shrink-0" />
                        <div>
                          <span className="font-semibold text-sky-900">Phân tích chuyên ngành IT: </span>
                          <span className="text-slate-700">{topic.itDomainRole}</span>
                          {topic.aiConfidence && <span className="ml-1.5 font-bold text-sky-700">({topic.aiConfidence}% tin cậy)</span>}
                        </div>
                      </div>
                    )}
                    <div className="learning-lesson-actions">
                      {resourceUrl(topic.url) && (
                        <a href={resourceUrl(topic.url)} target="_blank" rel="noopener noreferrer">
                          Mở tài liệu <ExternalLink size={13} />
                        </a>
                      )}
                      <button
                        aria-pressed={!!topic.completed}
                        aria-label={`${topic.completed ? 'Bỏ hoàn thành' : 'Đánh dấu hoàn thành'}: ${topic.title}`}
                        onClick={() => toggle(topic)}
                      >
                        <Check size={14} />{topic.completed ? 'Đã học xong' : 'Đánh dấu xong'}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}

            {!visible.length && (
              <div className="learning-empty">
                <BookOpen size={28} />
                <h3>{!topics.length ? 'Lộ trình đang được chuẩn bị' : 'Chưa có bài học phù hợp'}</h3>
                <p>{!topics.length ? 'Bài học sẽ xuất hiện khi lộ trình được bổ sung.' : 'Thử từ khóa khác hoặc xem lại toàn bộ lộ trình.'}</p>
                {topics.length > 0 && (
                  <button onClick={() => { setFilter('all'); setQuery(''); }}>
                    Xem tất cả bài học <ArrowRight size={14} />
                  </button>
                )}
              </div>
            )}
          </div>

          {topics.length > 0 && progress === 100 && (
            <div className="learning-celebration">
              <Award size={30} />
              <div>
                <h3>Bạn đã hoàn thành lộ trình!</h3>
                <p>Thử áp dụng kiến thức vào một dự án và cập nhật hồ sơ của bạn.</p>
              </div>
              <button onClick={() => setActivePage('job-search')}>
                Tìm việc làm <ArrowRight size={14} />
              </button>
            </div>
          )}

          <footer className="learning-curriculum-footer">
            <ListChecks size={15} />
            <span>Tiến độ được lưu khi bạn đánh dấu bài học. Bạn có thể bỏ đánh dấu để học lại.</span>
          </footer>
        </main>

        <aside className="learning-aside">
          <section className="learning-next-card">
            <span className="learning-kicker">{next ? 'TIẾP TỤC TỪ ĐÂY' : 'BƯỚC TIẾP THEO'}</span>
            <div className="learning-next-icon">{next ? <BookOpen size={23} /> : <Award size={23} />}</div>
            <h2>{next ? next.title.replace(/^\d+\.\s*/, '') : topics.length ? 'Đưa kiến thức vào thực tế' : 'Chuẩn bị mục tiêu học tập'}</h2>
            <p>{next ? 'Bài chưa hoàn thành đầu tiên trong lộ trình. Bạn có thể học theo thứ tự hoặc chọn bài phù hợp với mình.' : 'Cập nhật kỹ năng trong hồ sơ và khám phá những vị trí phù hợp với mục tiêu của bạn.'}</p>
            {next && (
              <div className="learning-next-duration">
                <Clock3 size={15} /><span>{topicTime(next)}<small>Thời lượng tự học dự kiến</small></span>
              </div>
            )}
            <button className="learning-primary" onClick={next ? continueLearning : () => setActivePage('candidate-onboarding')}>
              {next ? 'Tiếp tục học' : 'Cập nhật hồ sơ'}<ArrowRight size={16} />
            </button>
          </section>

          <section className="learning-overview">
            <div className="learning-card-heading">
              <Target size={18} />
              <h3>Mục tiêu học tập</h3>
            </div>
            <p>{roadmap?.targetRole || 'Phát triển kỹ năng chuyên môn'}</p>
            <div>
              <span>Bài còn lại</span>
              <strong>{topics.length - completed} bài</strong>
            </div>
            <div>
              <span>Thời gian còn lại</span>
              <strong>{totalRemainingHours === null ? 'Chưa đủ dữ liệu' : `${totalRemainingHours} giờ`}</strong>
            </div>
            <small>Ước tính từ thời lượng từng bài, chưa bao gồm thời gian ôn tập.</small>
          </section>

          <section className="learning-guide">
            <button aria-expanded={showGuide} onClick={() => setShowGuide(!showGuide)}>
              <span>Gợi ý cách học hiệu quả</span>
              <ChevronDown size={17} className={showGuide ? 'is-open' : ''} />
            </button>
            <div aria-hidden={!showGuide} className={`learning-guide-collapse ${showGuide ? 'is-open' : ''}`}>
              <div>
                <ol>
                  <li>Đọc tài liệu, ghi lại ý chính của bài.</li>
                  <li>Thử áp dụng bằng một ví dụ hoặc dự án nhỏ.</li>
                  <li>Tự giải thích lại kiến thức trước khi đánh dấu xong.</li>
                </ol>
                <p>Đánh dấu hoàn thành ghi nhận tiến độ tự học; không tự động xác nhận kỹ năng trong CV.</p>
              </div>
            </div>
          </section>

          <section className="learning-note">
            <GraduationCap size={20} />
            <h3>Học theo nhịp của bạn</h3>
            <p>{roadmap?.description || 'Chia việc học thành những phiên nhỏ, dành thời gian thực hành và quay lại ôn những bài quan trọng.'}</p>
          </section>
        </aside>
      </div>

      {/* ROADMAP EXPLORER MODAL (OPTION 2) */}
      <Modal
        isOpen={isCatalogModalOpen}
        onClose={() => { setIsCatalogModalOpen(false); setCatalogSearch(''); }}
        title={`Khám phá & Chọn Lộ trình Học tập (${availableRoadmapsList.length})`}
      >
        <div className="space-y-4 text-xs">
          {/* Search box */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-blue-500 transition-all"
              placeholder="Tìm theo kỹ năng (Java, Spring Boot...) hoặc vị trí mục tiêu..."
              value={catalogSearch}
              onChange={e => setCatalogSearch(e.target.value)}
              autoFocus
            />
          </div>

          {/* Grid of Roadmap Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[55vh] overflow-y-auto pr-1">
            {filteredCatalogRoadmaps.map(item => {
              const itemTopics = item.topics || [];
              const itemCompleted = itemTopics.filter(t => t.completed).length;
              const itemProgress = itemTopics.length ? Math.round((itemCompleted / itemTopics.length) * 100) : 0;
              const isCurrent = item.id === roadmap?.id;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedId(item.id);
                    if (item.categoryType === 'PERSONAL' || item.isPersonal) {
                      if (setActiveRoadmapType) setActiveRoadmapType('PERSONAL');
                      if (setActivePersonalJobId && item.jobId) setActivePersonalJobId(item.jobId);
                    } else if (item.categoryType === 'MASTER' || item.id === 'master-roadmap-candidate') {
                      if (setActiveRoadmapType) setActiveRoadmapType('ALL');
                    }
                    setIsCatalogModalOpen(false);
                    setCatalogSearch('');
                    setFilter('all');
                    setQuery('');
                  }}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                    isCurrent
                      ? 'bg-blue-50/70 border-blue-400 shadow-xs ring-2 ring-blue-500/20'
                      : 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-xs hover:bg-slate-50/60'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-[11px] px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60 flex items-center gap-1">
                          <BookOpen size={11} /> {item.skill || item.skillName || 'Kỹ năng'}
                        </span>
                        {item.categoryType === 'PERSONAL' && (
                          <span className="font-bold text-[10px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                            <Sparkles size={10} /> Theo vị trí tuyển dụng
                          </span>
                        )}
                        {item.categoryType === 'MASTER' && (
                          <span className="font-bold text-[10px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                            <Layers size={10} /> Lộ trình Tổng thể
                          </span>
                        )}
                      </div>
                      {isCurrent ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check size={11} /> Đang chọn
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-medium">
                          {itemTopics.length} bài học
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm leading-snug">
                      {item.targetRole}
                    </h4>

                    {item.description && (
                      <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="pt-2.5 border-t border-slate-100 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Tiến độ</span>
                      <span className="font-bold text-slate-700">{itemProgress}% ({itemCompleted}/{itemTopics.length} bài)</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-300"
                        style={{ width: `${itemProgress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredCatalogRoadmaps.length === 0 && (
            <div className="text-center py-8 text-slate-500 space-y-1.5">
              <BookOpen size={30} className="mx-auto text-slate-300" />
              <p className="font-semibold text-xs text-slate-700">Không tìm thấy lộ trình phù hợp</p>
              <p className="text-[11px] text-slate-500">Thử tìm kiếm với từ khóa khác như "Java", "Backend"...</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

