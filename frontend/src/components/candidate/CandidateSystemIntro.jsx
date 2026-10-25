import React, { useState, useEffect, useMemo } from 'react';

/**
 * CandidateSystemIntro — Two-second candidate sign-in intro
 * Automatically completes after two seconds; no skip action.
 * Features floating intelligence labels, neural nodes convergence, brand reveal, and smooth morph into dashboard.
 */
export function CandidateSystemIntro({ candidateName = 'Nguyễn Trọng Tiến', onFinish, jobCount = 4, marketFit = 72 }) {
  const [phase, setPhase] = useState(1);
  const [isClosing, setIsClosing] = useState(false);

  const particles = useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      x: (i * 19) % 100,
      y: (i * 29) % 100,
      size: (i % 3) + 1.5,
      delay: (i * 0.12) % 2.5,
      duration: 3 + (i % 4)
    }));
  }, []);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(2), 150);
    const t2 = setTimeout(() => setPhase(3), 550);
    const t3 = setTimeout(() => setPhase(4), 1100);
    const t4 = setTimeout(() => setIsClosing(true), 1700);
    const t5 = setTimeout(onFinish, 2000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#102b20] text-white select-none overflow-hidden motion-reduce:[&_*]:animate-none motion-reduce:[&_*]:transition-none transition-opacity duration-300 ease-out ${
        isClosing ? 'opacity-0 scale-[1.02] pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* 1. Ambient Digital Mesh & Grid */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: `linear-gradient(to right, var(--mint-primary) 1px, transparent 1px), linear-gradient(to bottom, var(--mint-primary) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '4.5s' }} />
        <div className="absolute -bottom-40 -right-40 w-[550px] h-[550px] bg-indigo-600/20 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '5.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-cyan-500/10 rounded-full blur-[120px]" />

        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full bg-cyan-400/40 animate-pulse"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`
            }}
          />
        ))}

        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent transform -translate-y-1/2" />
      </div>

      {/* 2. Floating Labels */}
      <div className="absolute inset-0 pointer-events-none max-w-4xl mx-auto flex items-center justify-center">
        <div
          className={`absolute top-16 left-8 sm:left-16 px-3.5 py-1.5 rounded-full bg-blue-950/70 border border-cyan-500/30 text-[11px] font-bold text-cyan-300 tracking-wider shadow-lg backdrop-blur-md transition-all duration-700 ${
            phase >= 2 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-90'
          } ${phase >= 4 ? 'opacity-30 scale-95' : ''}`}
        >
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 mr-2 animate-ping" />
          Skill Matching
        </div>

        <div
          className={`absolute top-16 right-8 sm:right-16 px-3.5 py-1.5 rounded-full bg-indigo-950/70 border border-indigo-500/30 text-[11px] font-bold text-indigo-300 tracking-wider shadow-lg backdrop-blur-md transition-all duration-700 delay-100 ${
            phase >= 2 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-90'
          } ${phase >= 4 ? 'opacity-30 scale-95' : ''}`}
        >
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400 mr-2 animate-pulse" />
          Career Intelligence
        </div>

        <div
          className={`absolute bottom-20 left-8 sm:left-16 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-blue-400/30 text-[11px] font-bold text-blue-300 tracking-wider shadow-lg backdrop-blur-md transition-all duration-700 delay-200 ${
            phase >= 2 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-90'
          } ${phase >= 4 ? 'opacity-30 scale-95' : ''}`}
        >
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 mr-2" />
          Market Fit Analysis
        </div>

        <div
          className={`absolute bottom-20 right-8 sm:right-16 px-3.5 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-400/30 text-[11px] font-bold text-cyan-300 tracking-wider shadow-lg backdrop-blur-md transition-all duration-700 delay-300 ${
            phase >= 2 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-90'
          } ${phase >= 4 ? 'opacity-30 scale-95' : ''}`}
        >
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-400 mr-2" />
          Learning Roadmap
        </div>
      </div>

      {/* 3. Central Stage */}
      <div className="relative z-10 max-w-2xl w-full mx-auto px-6 text-center space-y-6">
        
        {/* Converging Lines */}
        <div className="relative w-full max-w-sm mx-auto h-28 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 320 110">
            <defs>
              <linearGradient id="introLaserGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--mint-base)" stopOpacity="0.8" />
                <stop offset="50%" stopColor="var(--mint-mid)" stopOpacity="0.6" />
                <stop offset="100%" stopColor="var(--mint-base)" stopOpacity="0.9" />
              </linearGradient>
            </defs>

            <circle cx="160" cy="55" r="30" stroke="rgba(56, 189, 248, 0.3)" strokeWidth="1" strokeDasharray="3 3" fill="none" className="animate-spin" style={{ animationDuration: '14s' }} />
            <circle cx="160" cy="55" r="50" stroke="rgba(99, 102, 241, 0.2)" strokeWidth="1" fill="none" />

            <line x1="30" y1="20" x2="160" y2="55" stroke="url(#introLaserGrad)" strokeWidth="1.5" strokeDasharray="4 4" className="animate-pulse" />
            <line x1="290" y1="20" x2="160" y2="55" stroke="url(#introLaserGrad)" strokeWidth="1.5" strokeDasharray="4 4" />
            <line x1="30" y1="90" x2="160" y2="55" stroke="url(#introLaserGrad)" strokeWidth="1.5" strokeDasharray="4 4" />
            <line x1="290" y1="90" x2="160" y2="55" stroke="url(#introLaserGrad)" strokeWidth="1.5" strokeDasharray="4 4" className="animate-pulse" />
          </svg>

          <div
            className={`relative z-10 p-3 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white font-black text-xs shadow-2xl shadow-cyan-500/30 border border-white/30 flex items-center gap-2 transition-all duration-700 ${
              phase >= 3 ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-200 animate-ping" />
            <span className="tracking-wider uppercase font-extrabold text-[11px]">AI Engine Synced</span>
          </div>
        </div>

        {/* Brand Reveal */}
        <div
          className={`space-y-1.5 transition-all duration-700 transform ${
            phase >= 3 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
          }`}
        >
          <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-blue-200 drop-shadow-[0_0_25px_rgba(56,189,248,0.4)]">
            CareerFit
          </h2>
          <p className="text-xs sm:text-sm font-semibold tracking-widest text-cyan-300/90 uppercase">
            AI Career Companion for IT Talent
          </p>
        </div>

        {/* Candidate Insight */}
        <div
          className={`space-y-3 pt-2 transition-all duration-700 transform ${
            phase >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Chào mừng trở lại
            </p>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              {candidateName}
            </h1>
          </div>

          <div className="inline-flex flex-wrap items-center justify-center gap-3 pt-1">
            <div className="px-4 py-2 rounded-2xl bg-slate-900/85 border border-cyan-500/30 text-xs font-semibold text-slate-200 backdrop-blur-md shadow-lg flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>
                <strong className="text-cyan-300 font-extrabold">{jobCount} công việc phù hợp</strong> đang chờ bạn
              </span>
            </div>
            <div className="px-4 py-2 rounded-2xl bg-slate-900/85 border border-blue-500/30 text-xs font-semibold text-slate-200 backdrop-blur-md shadow-lg flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span>
                Market Fit hôm nay: <strong className="text-blue-300 font-extrabold">{marketFit}%</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="pt-4 w-52 mx-auto space-y-1.5">
          <div className="h-0.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 transition-all duration-3200 ease-out"
              style={{ width: phase >= 4 ? '100%' : '35%' }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
