import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Search, ChevronDown } from 'lucide-react';

export function HomePage() {
  const { setActivePage, jobs, setSelectedJobId, setGlobalSearchQuery } = useApp();
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchLocation, setSearchLocation] = useState('');

  // 4 Featured Jobs matching the design spec
  const featuredJobs = [
    {
      id: 'job-1',
      title: 'Backend Developer (Golang / Java)',
      badge: 'Fresher / Junior',
      badgeColor: 'bg-blue-50 text-blue-600 border-blue-200',
      company: 'FPT Software',
      location: 'Hà Nội (Cầu Giấy)',
      salary: '12 - 18 triệu VNĐ',
      tags: ['Golang', 'PostgreSQL', 'Docker'],
      postedTime: '2h trước',
      category: 'Backend'
    },
    {
      id: 'job-2',
      title: 'Frontend Engineer (React / Next.js)',
      badge: 'Junior',
      badgeColor: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      company: 'VNG Corporation',
      location: 'TP. Hồ Chí Minh (Q7)',
      salary: '15 - 22 triệu VNĐ',
      tags: ['React', 'TypeScript', 'TailwindCSS'],
      postedTime: 'Hôm qua',
      category: 'Frontend'
    },
    {
      id: 'job-3',
      title: 'QA / Automation Engineer',
      badge: 'Fresher / Junior',
      badgeColor: 'bg-sky-50 text-sky-600 border-sky-200',
      company: 'CMC Global',
      location: 'Đà Nẵng & Remote',
      salary: '10 - 16 triệu VNĐ',
      tags: ['Selenium', 'Python', 'Postman'],
      postedTime: '2 ngày trước',
      category: 'QA'
    },
    {
      id: 'job-4',
      title: 'Node.js API Engineer',
      badge: 'Junior',
      badgeColor: 'bg-purple-50 text-purple-600 border-purple-200',
      company: 'KMS Technology',
      location: 'TP. Hồ Chí Minh',
      salary: '14 - 20 triệu VNĐ',
      tags: ['Node.js', 'NestJS', 'MongoDB'],
      postedTime: '3 ngày trước',
      category: 'Backend'
    }
  ];

  const filteredJobs = featuredJobs.filter((job) => {
    if (activeCategory === 'Tất cả') return true;
    return job.category === activeCategory;
  });

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    setGlobalSearchQuery(searchKeyword);
    setActivePage('job-search');
  };

  const handleJobClick = (jobItem) => {
    // If job exists in DB, use its id; otherwise fallback to first job
    const matched = jobs?.find(j => j.title.toLowerCase().includes(jobItem.category.toLowerCase())) || jobs?.[0];
    if (matched) {
      setSelectedJobId(matched.id);
    }
    setActivePage('job-detail');
  };

  return (
    <div className="bg-white min-h-screen flex flex-col font-sans">
      {/* ============================================================
          HERO SECTION (Centered, Clean, Minimal)
      ============================================================ */}
      <section className="pt-16 pb-14 px-4 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200/90 text-slate-600 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
            <span>Hệ thống đối chiếu kỹ năng thực tế</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.18]">
            Tìm việc IT theo đúng năng lực<br className="hidden sm:inline" /> của bạn
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Đối chiếu kỹ năng với yêu cầu tuyển dụng thực tế, biết rõ tỷ lệ đáp ứng trước khi nộp CV.
          </p>

          {/* Unified Search Bar */}
          <div className="pt-3 max-w-2xl mx-auto">
            <form
              onSubmit={handleSearchSubmit}
              className="bg-white border border-slate-200 rounded-xl shadow-xs p-1.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
            >
              <div className="flex-1 flex items-center pl-3 gap-2">
                <Search size={18} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="Vị trí hoặc kỹ năng: Java, React, Golang, QA..."
                  className="w-full py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none bg-transparent"
                />
              </div>

              <div className="hidden sm:block w-px h-6 bg-slate-200 shrink-0"></div>

              <div className="relative shrink-0 flex items-center">
                <select
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 text-sm text-slate-700 bg-transparent outline-none cursor-pointer font-medium w-full sm:w-auto"
                >
                  <option value="">Toàn quốc</option>
                  <option value="hn">Hà Nội</option>
                  <option value="hcm">TP. Hồ Chí Minh</option>
                  <option value="dn">Đà Nẵng</option>
                  <option value="remote">Remote</option>
                </select>
                <ChevronDown size={14} className="text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shrink-0 shadow-xs cursor-pointer"
              >
                Tìm việc
              </button>
            </form>

            <p className="text-xs text-slate-500 text-center mt-3">
              Hoặc:{' '}
              <button
                type="button"
                onClick={() => setActivePage('login')}
                className="text-blue-600 hover:underline font-medium cursor-pointer"
              >
                Tải CV lên để nhận báo cáo phân tích phù hợp
              </button>
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 pt-2">
            <button type="button" onClick={() => setActivePage('login')} className="min-w-[210px] px-9 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold rounded-xl transition-colors shadow-xs">Bắt đầu ngay →</button>
          </div>
        </div>
      </section>

      {/* ============================================================
          VALUE PROPOSITIONS (3-column feature summary)
      ============================================================ */}
      <section className="border-t border-b border-slate-200/80 py-10 bg-white">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-slate-900 text-base mb-1.5">1,000+ Việc làm IT</h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Cập nhật liên tục từ các team công nghệ, không tin ảo, không spam.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base mb-1.5">Xác minh doanh nghiệp</h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              100% công ty được thẩm định thông tin pháp lý và văn hóa kỹ thuật trước khi đăng bài.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base mb-1.5">Minh bạch JD & Lương</h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Công khai dải lương, công nghệ cốt lõi và lộ trình phỏng vấn chuẩn hóa.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================
          VIỆC LÀM MỚI NHẤT (Latest technical jobs)
      ============================================================ */}
      <section className="py-12 px-4 max-w-5xl mx-auto w-full flex-1">
        {/* Header with Title and Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">Việc làm mới nhất</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Vị trí kỹ thuật được tuyển trực tiếp từ nhà phát triển
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-lg border border-slate-200/60 self-start sm:self-auto">
            {['Tất cả', 'Backend', 'Frontend', 'QA'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveCategory(tab)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  activeCategory === tab
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Job Card List Container */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs divide-y divide-slate-100">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="font-bold text-slate-900 text-base">{job.title}</h3>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${job.badgeColor}`}>
                    {job.badge}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500">
                  <span>{job.company}</span>
                  <span className="mx-1.5 text-slate-300">•</span>
                  <span>{job.location}</span>
                  <span className="mx-1.5 text-slate-300">•</span>
                  <span className="font-semibold text-slate-700">{job.salary}</span>
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {job.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60 font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center sm:flex-col sm:items-end justify-between gap-2 shrink-0">
                <span className="text-xs text-slate-400">{job.postedTime}</span>
                <button
                  type="button"
                  onClick={() => handleJobClick(job)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 rounded-md transition-colors shadow-2xs cursor-pointer"
                >
                  Xem chi tiết
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Centered Bottom CTA Button */}
        <div className="text-center mt-7">
          <button
            type="button"
            onClick={() => setActivePage('job-search')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs sm:text-sm font-semibold rounded-md border border-slate-200 transition-colors shadow-2xs cursor-pointer"
          >
            <span>Xem tất cả 1,000+ vị trí đang tuyển</span>
            <span>&rarr;</span>
          </button>
        </div>
      </section>

      {/* ============================================================
          MINIMAL FOOTER
      ============================================================ */}
      <footer className="border-t border-slate-200 py-8 bg-white mt-auto">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2 font-medium">
            <span className="font-bold text-slate-900">CareerFit</span>
            <span className="text-slate-300">/</span>
            <span>Hệ thống tuyển dụng IT minh bạch</span>
          </div>

          <div className="flex items-center gap-5 sm:gap-6 flex-wrap justify-center">
            <button type="button" onClick={() => {}} className="hover:text-slate-900 transition-colors cursor-pointer">
              Quy định bảo mật
            </button>
            <button type="button" onClick={() => {}} className="hover:text-slate-900 transition-colors cursor-pointer">
              Điều khoản sử dụng
            </button>
            <span>Dành cho nhà tuyển dụng</span>
          </div>

          <div className="text-slate-400">
            &copy; 2025 CareerFit
          </div>
        </div>
      </footer>
    </div>
  );
}





