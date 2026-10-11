import React, { useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
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
  Layers
} from 'lucide-react';
import './LearningRoadmapPage.css';

function resourceUrl(value) {
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : null; } catch { return null; }
}
function topicTime(topic) {
  return topic.estimatedTime || (Number(topic.estimatedHours) > 0 ? `${topic.estimatedHours} giờ` : 'Chưa có thời lượng');
}

export function LearningRoadmapPage() {
  const { roadmaps = [], toggleRoadmapTopic, setActivePage } = useApp();
  const [selectedId, setSelectedId] = useState('');
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');

  const lessonRefs = useRef(new Map());
  const roadmap = roadmaps.find(item => item.id === selectedId) || roadmaps[0];
  const topics = roadmap?.topics || [];
  const completed = topics.filter(topic => topic.completed).length;
  const progress = topics.length ? Math.round(completed / topics.length * 100) : 0;
  const next = topics.find(topic => !topic.completed);
  const visible = topics.filter(topic => (filter === 'all' || (filter === 'completed' ? topic.completed : !topic.completed)) && `${topic.title} ${topic.resource || ''}`.toLocaleLowerCase('vi').includes(query.trim().toLocaleLowerCase('vi')));
  const remaining = topics.filter(topic => !topic.completed);
  const knownHours = remaining.map(topic => Number(topic.estimatedHours) > 0 ? Number(topic.estimatedHours) : (/^\s*\d+(?:[.,]\d+)?\s*(?:giờ|hours?|h)\s*$/i.test(topic.estimatedTime || '') ? parseFloat(topic.estimatedTime.replace(',', '.')) : null));
  const totalRemainingHours = knownHours.every(hours => hours !== null) ? knownHours.reduce((sum, hours) => sum + hours, 0) : null;
  const toggle = topic => toggleRoadmapTopic(roadmap.id, topic.id);
  const continueLearning = () => {
    setFilter('all'); setQuery('');
    requestAnimationFrame(() => {
      const lesson = lessonRefs.current.get(next?.id);
      lesson?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
      lesson?.focus({ preventScroll: true });
    });
  };

  const filteredCatalogRoadmaps = roadmaps.filter(rm => {
    const q = catalogSearch.toLowerCase().trim();
    if (!q) return true;
    const matchSkill = (rm.skill || rm.skillName || '').toLowerCase().includes(q);
    const matchRole = (rm.targetRole || '').toLowerCase().includes(q);
    const matchDesc = (rm.description || '').toLowerCase().includes(q);
    return matchSkill || matchRole || matchDesc;
  });

  return (
    <div className="learning-page">
      <header className="learning-hero">
        <div className="learning-hero-copy">
          <span className="learning-eyebrow">LEARNING ROADMAP</span>
          <h1>Học từng bước.<br /><span>Tiến gần mục tiêu.</span></h1>
          <p>{roadmap?.targetRole || 'Lộ trình học tập của bạn'}</p>
          <div className="learning-hero-tags flex-wrap">
            <span><BookOpen size={14} />{roadmap?.skill || 'Phát triển kỹ năng'}</span>
            <span><GraduationCap size={15} />{topics.length} bài học</span>
            {roadmaps.length > 1 && (
              <button
                type="button"
                onClick={() => setIsCatalogModalOpen(true)}
                className="text-xs font-semibold px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-blue-100 border border-white/20 flex items-center gap-1.5 transition-all cursor-pointer"
                title="Khám phá và đổi lộ trình học tập"
              >
                <Compass size={13} className="text-blue-300" /> Đổi lộ trình ({roadmaps.length})
              </button>
            )}
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
          <div className="learning-section-header">
            <div>
              <span className="learning-kicker">KẾ HOẠCH PHÁT TRIỂN KỸ NĂNG</span>
              <h2>Lộ trình của bạn</h2>
              <p>Theo dõi những gì đã học, chọn bước tiếp theo.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCatalogModalOpen(true)}
                className="btn btn-secondary text-xs font-semibold h-9 px-3.5 rounded-lg border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/70 text-indigo-700 shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
                title="Nhấn để xem và chọn lộ trình khác"
              >
                <Compass size={14} className="text-indigo-600" />
                <span>{roadmap?.skill || 'Chọn lộ trình'}</span>
                {roadmaps.length > 1 && (
                  <span className="text-[10px] bg-indigo-200/80 text-indigo-800 px-1.5 py-0.5 rounded-md font-bold">
                    Đổi ({roadmaps.length})
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
        title={`Khám phá & Chọn Lộ trình Học tập (${roadmaps.length})`}
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
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-[11px] px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60 flex items-center gap-1">
                        <BookOpen size={11} /> {item.skill || item.skillName || 'Kỹ năng'}
                      </span>
                      {isCurrent ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check size={11} /> Đang học
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

