import React, { useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ArrowRight, Award, BookOpen, Check, ChevronDown, Clock3, ExternalLink, GraduationCap, ListChecks, Search, Target } from 'lucide-react';
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
  return <div className="learning-page">
    <header className="learning-hero">
      <div className="learning-hero-copy"><span className="learning-eyebrow">LEARNING ROADMAP</span><h1>Học từng bước.<br /><span>Tiến gần mục tiêu.</span></h1><p>{roadmap?.targetRole || 'Lộ trình học tập của bạn'}</p><div className="learning-hero-tags"><span><BookOpen size={14} />{roadmap?.skill || 'Phát triển kỹ năng'}</span><span><GraduationCap size={15} />{topics.length} bài học</span></div></div>
      <div className="learning-hero-progress"><div className="learning-progress-ring" style={{ '--progress': `${progress}%` }}><strong>{progress}<small>%</small></strong></div><div><span>TIẾN ĐỘ CỦA BẠN</span><h2>{completed} / {topics.length} bài hoàn thành</h2><p>{next ? 'Mỗi bài học là một bước tiến nhỏ.' : topics.length ? 'Bạn đã đi hết lộ trình này.' : 'Bắt đầu khi lộ trình được bổ sung.'}</p><div role="progressbar" aria-label="Tiến độ lộ trình" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} className="learning-progress-track"><i style={{ width: `${progress}%` }} /></div></div></div>
    </header>
    <div className="learning-layout"><main className="learning-curriculum"><div className="learning-section-header"><div><span className="learning-kicker">KẾ HOẠCH PHÁT TRIỂN KỸ NĂNG</span><h2>Lộ trình của bạn</h2><p>Theo dõi những gì đã học, chọn bước tiếp theo.</p></div>{roadmaps.length > 1 ? <select aria-label="Chọn lộ trình" value={roadmap.id} onChange={event => { setSelectedId(event.target.value); setFilter('all'); setQuery(''); }}>{roadmaps.map(item => <option value={item.id} key={item.id}>{item.skill || item.targetRole}</option>)}</select> : <span className="learning-track-label">{roadmap?.skill || 'Tự học'}</span>}</div>
    <div className="learning-tools"><div className="learning-tabs" aria-label="Lọc bài học">{[{key:'all',label:'Tất cả',count:topics.length},{key:'pending',label:'Chưa hoàn thành',count:topics.length-completed},{key:'completed',label:'Đã hoàn thành',count:completed}].map(tab => <button key={tab.key} aria-pressed={filter === tab.key} onClick={() => setFilter(tab.key)}>{tab.label}<span>{tab.count}</span></button>)}</div><label className="learning-search"><Search size={16}/><input aria-label="Tìm bài học" value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm bài học…" /></label></div>
    <div className="learning-lessons">{visible.map(topic => { const index = topics.indexOf(topic); const active = topic.id === next?.id; return <article tabIndex={-1} ref={element => { if (element) lessonRefs.current.set(topic.id, element); else lessonRefs.current.delete(topic.id); }} key={topic.id} className={`learning-lesson ${topic.completed ? 'is-complete' : active ? 'is-next' : ''}`}><div className="learning-step">{topic.completed ? <Check size={16} /> : String(index+1).padStart(2,'0')}</div><div className="learning-lesson-content"><div className="learning-lesson-meta"><span>{topic.milestone || `Bài ${String(index+1).padStart(2,'0')}`}</span>{active && <span className="learning-next-label">Tiếp theo</span>}{topic.completed && <span className="learning-completed-label">Đã hoàn thành</span>}</div><h3>{topic.title.replace(/^\d+\.\s*/, '')}</h3><p className="learning-time"><Clock3 size={13} />{topicTime(topic)}<span>·</span>{topic.resource || 'Tài liệu đang được bổ sung'}</p>{topic.description && <p className="learning-topic-description">{topic.description}</p>}<div className="learning-lesson-actions">{resourceUrl(topic.url) && <a href={resourceUrl(topic.url)} target="_blank" rel="noopener noreferrer">Mở tài liệu <ExternalLink size={13}/></a>}<button aria-pressed={!!topic.completed} aria-label={`${topic.completed ? 'Bỏ hoàn thành' : 'Đánh dấu hoàn thành'}: ${topic.title}`} onClick={() => toggle(topic)}><Check size={14}/>{topic.completed ? 'Đã học xong' : 'Đánh dấu xong'}</button></div></div></article>; })}
    {!visible.length && <div className="learning-empty"><BookOpen size={28}/><h3>{!topics.length ? 'Lộ trình đang được chuẩn bị' : 'Chưa có bài học phù hợp'}</h3><p>{!topics.length ? 'Bài học sẽ xuất hiện khi lộ trình được bổ sung.' : 'Thử từ khóa khác hoặc xem lại toàn bộ lộ trình.'}</p>{topics.length > 0 && <button onClick={() => { setFilter('all'); setQuery(''); }}>Xem tất cả bài học <ArrowRight size={14}/></button>}</div>}
    </div>{topics.length > 0 && progress === 100 && <div className="learning-celebration"><Award size={30}/><div><h3>Bạn đã hoàn thành lộ trình!</h3><p>Thử áp dụng kiến thức vào một dự án và cập nhật hồ sơ của bạn.</p></div><button onClick={() => setActivePage('job-search')}>Tìm việc làm <ArrowRight size={14}/></button></div>}
    <footer className="learning-curriculum-footer"><ListChecks size={15}/><span>Tiến độ được lưu khi bạn đánh dấu bài học. Bạn có thể bỏ đánh dấu để học lại.</span></footer></main>
    <aside className="learning-aside"><section className="learning-next-card"><span className="learning-kicker">{next ? 'TIẾP TỤC TỪ ĐÂY' : 'BƯỚC TIẾP THEO'}</span><div className="learning-next-icon">{next ? <BookOpen size={23}/> : <Award size={23}/>}</div><h2>{next ? next.title.replace(/^\d+\.\s*/, '') : topics.length ? 'Đưa kiến thức vào thực tế' : 'Chuẩn bị mục tiêu học tập'}</h2><p>{next ? 'Bài chưa hoàn thành đầu tiên trong lộ trình. Bạn có thể học theo thứ tự hoặc chọn bài phù hợp với mình.' : 'Cập nhật kỹ năng trong hồ sơ và khám phá những vị trí phù hợp với mục tiêu của bạn.'}</p>{next && <div className="learning-next-duration"><Clock3 size={15}/><span>{topicTime(next)}<small>Thời lượng tự học dự kiến</small></span></div>}<button className="learning-primary" onClick={next ? continueLearning : () => setActivePage('candidate-onboarding')}>{next ? 'Tiếp tục học' : 'Cập nhật hồ sơ'}<ArrowRight size={16}/></button></section>
    <section className="learning-overview"><div className="learning-card-heading"><Target size={18}/><h3>Mục tiêu học tập</h3></div><p>{roadmap?.targetRole || 'Phát triển kỹ năng chuyên môn'}</p><div><span>Bài còn lại</span><strong>{topics.length-completed} bài</strong></div><div><span>Thời gian còn lại</span><strong>{totalRemainingHours === null ? 'Chưa đủ dữ liệu' : `${totalRemainingHours} giờ`}</strong></div><small>Ước tính từ thời lượng từng bài, chưa bao gồm thời gian ôn tập.</small></section>
    <section className="learning-guide"><button aria-expanded={showGuide} onClick={() => setShowGuide(!showGuide)}><span>Gợi ý cách học hiệu quả</span><ChevronDown size={17} className={showGuide ? 'is-open' : ''}/></button><div aria-hidden={!showGuide} className={`learning-guide-collapse ${showGuide ? 'is-open' : ''}`}><div><ol><li>Đọc tài liệu, ghi lại ý chính của bài.</li><li>Thử áp dụng bằng một ví dụ hoặc dự án nhỏ.</li><li>Tự giải thích lại kiến thức trước khi đánh dấu xong.</li></ol><p>Đánh dấu hoàn thành ghi nhận tiến độ tự học; không tự động xác nhận kỹ năng trong CV.</p></div></div></section>
    <section className="learning-note"><GraduationCap size={20}/><h3>Học theo nhịp của bạn</h3><p>{roadmap?.description || 'Chia việc học thành những phiên nhỏ, dành thời gian thực hành và quay lại ôn những bài quan trọng.'}</p></section></aside></div>
  </div>;
}

