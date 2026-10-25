import { useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, ChevronDown, MapPin, Search, Sparkles } from 'lucide-react';
import { HeroVideo } from '../common/HeroVideo';
import './CinematicHero.css';

export function CinematicHero({ onBegin, onSearch }) {
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');

  const submitSearch = (event) => {
    event.preventDefault();
    onSearch(keyword.trim(), location);
  };

  return (
    <section className="cinematic-hero relative min-h-screen w-full overflow-hidden" aria-labelledby="getting-started-heading">
      <HeroVideo />
      <div className="cinematic-hero-content relative z-10 flex flex-col items-center justify-center text-center px-6 pb-40" style={{ paddingTop: 'calc(8rem - 75px)' }}>
        <p className="cinematic-eyebrow animate-fade-rise">
          <Sparkles size={13} aria-hidden="true" /> Mỗi tài năng, một hành trình riêng <span aria-hidden="true">↗</span>
        </p>
        <h1 id="getting-started-heading" className="cinematic-title font-display animate-fade-rise">
          <span>Tìm việc IT theo</span><span className="cinematic-title-accent">đúng năng lực của bạn.</span>
        </h1>
        <p className="cinematic-description text-base sm:text-lg mt-8 leading-relaxed animate-fade-rise-delay">
          Kết nối kỹ năng thực tế với cơ hội xứng đáng.<br className="cinematic-desktop-break" /> Hiểu rõ thế mạnh, tìm đúng công việc và tự tin viết tiếp hành trình của bạn.
        </p>
        <div className="cinematic-actions animate-fade-rise-delay-2">
          <button type="button" onClick={onBegin} className="cinematic-button rounded-full px-14 py-5 text-base mt-12">
            Bắt đầu hành trình <ArrowUpRight size={18} aria-hidden="true" />
          </button>
          <a href="#careerfit-opportunities" className="cinematic-secondary">
            Khám phá cơ hội <ArrowRight size={15} aria-hidden="true" />
          </a>
        </div>
        <form className="cinematic-search animate-fade-rise-delay-2" onSubmit={submitSearch} aria-label="Tìm việc làm IT">
          <label className="cinematic-search-keyword">
            <Search size={18} aria-hidden="true" />
            <span className="sr-only">Vị trí hoặc kỹ năng</span>
            <input type="search" placeholder="Vị trí hoặc kỹ năng của bạn" value={keyword} onChange={event => setKeyword(event.target.value)} />
          </label>
          <label className="cinematic-search-location">
            <MapPin size={17} aria-hidden="true" />
            <span className="sr-only">Địa điểm làm việc</span>
            <select value={location} onChange={event => setLocation(event.target.value)}>
              <option value="">Toàn quốc</option>
              <option value="Hà Nội">Hà Nội</option>
              <option value="Hồ Chí Minh">TP. Hồ Chí Minh</option>
              <option value="Đà Nẵng">Đà Nẵng</option>
              <option value="Remote">Remote</option>
            </select>
            <ChevronDown size={14} aria-hidden="true" />
          </label>
          <button type="submit">Tìm việc <ArrowRight size={16} aria-hidden="true" /></button>
        </form>
        <p className="cinematic-search-note animate-fade-rise-delay-2">
          Hoặc <button type="button" onClick={onBegin}>kết nối hồ sơ của bạn</button> để tìm cơ hội phù hợp.
        </p>
      </div>
      <div className="cinematic-hero-bottom">
        <span>DÀNH CHO THẾ HỆ CÔNG NGHỆ TIẾP THEO</span>
        <a href="#careerfit-opportunities">Khám phá CareerFit <ArrowDown size={14} aria-hidden="true" /></a>
      </div>
    </section>
  );
}
