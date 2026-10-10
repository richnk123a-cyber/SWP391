import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';

/**
 * Premium Sliding Segmented Control Component (Apple / Modern SaaS Style)
 * Automatically glides active pill horizontally with smooth spring motion
 * Uses exact DOM measurement (offsetLeft & offsetWidth) for pixel-perfect pill wrapping
 */
export function SegmentedControl({
  tabs = [],
  activeTab,
  onChange,
  className = '',
  activeColorClass = 'bg-blue-600 shadow-xs'
}) {
  const activeIndex = tabs.findIndex(t => t.id === activeTab);
  const activeTabObj = tabs[activeIndex];

  const containerRef = useRef(null);
  const tabRefs = useRef([]);

  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0, opacity: 0 });

  const updatePillPosition = () => {
    if (activeIndex !== -1 && tabRefs.current[activeIndex]) {
      const activeEl = tabRefs.current[activeIndex];
      if (activeEl) {
        setPillStyle({
          left: activeEl.offsetLeft,
          width: activeEl.offsetWidth,
          opacity: 1
        });
      }
    }
  };

  useLayoutEffect(() => {
    updatePillPosition();
  }, [activeIndex, tabs]);

  useEffect(() => {
    window.addEventListener('resize', updatePillPosition);
    // Double check after fonts/layout render
    const timer = setTimeout(updatePillPosition, 50);
    return () => {
      window.removeEventListener('resize', updatePillPosition);
      clearTimeout(timer);
    };
  }, [activeIndex, tabs]);

  const currentPillColor = activeTabObj?.activeColor || activeColorClass;

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 shadow-2xs max-w-full overflow-x-auto ${className}`}
    >
      {/* Horizontal Dynamic Sliding Background Pill */}
      <div
        className={`absolute top-1 bottom-1 left-0 rounded-lg transition-all duration-300 ease-[cubic-bezier(0.34,1.25,0.64,1)] z-0 ${currentPillColor}`}
        style={{
          transform: `translateX(${pillStyle.left}px)`,
          width: `${pillStyle.width}px`,
          opacity: pillStyle.opacity
        }}
      />

      {tabs.map((tab, idx) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            ref={el => (tabRefs.current[idx] = el)}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`relative z-10 px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors duration-200 select-none whitespace-nowrap shrink-0 ${
              isActive
                ? 'text-white font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {Icon && (
              <Icon
                size={15}
                className={`shrink-0 transition-colors ${
                  isActive ? 'text-white' : 'text-slate-400'
                }`}
              />
            )}
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count !== null && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black transition-colors ${
                  isActive
                    ? 'bg-white/25 text-white'
                    : 'bg-slate-200/80 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
