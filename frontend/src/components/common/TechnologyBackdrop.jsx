import React, { useEffect, useId, useRef } from 'react';
import './TechnologyBackdrop.css';

/** Motion is opt-in: only the candidate dashboard uses the live circuit treatment. */
export function TechnologyBackdrop({ animated = false }) {
  const id = useId();
  const svgRef = useRef(null);
  useEffect(() => {
    if (!animated || !svgRef.current) return;
    const svg = svgRef.current;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = true;
    const sync = () => { svg.dataset.motion = visible && !document.hidden && !preference.matches ? 'running' : 'paused'; };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    observer.observe(svg);
    preference.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    sync();
    return () => {
      observer.disconnect();
      preference.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [animated]);
  return <svg ref={svgRef} className={`technology-backdrop${animated ? ' technology-backdrop--animated' : ''}`} data-motion="running" viewBox="0 0 480 320" fill="none" aria-hidden="true" focusable="false">
    <defs>
      <pattern id={`${id}-grid`} width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="currentColor" opacity=".22" /></pattern>
      <radialGradient id={`${id}-glow`}><stop stopColor="#abf9c8" stopOpacity=".42" /><stop offset="1" stopColor="#abf9c8" stopOpacity="0" /></radialGradient>
    </defs>
    <rect width="480" height="320" fill={`url(#${id}-grid)`} />
    <ellipse cx="240" cy="160" rx="210" ry="145" fill={`url(#${id}-glow)`} />
    {animated && <>
      <g className="technology-orbit" stroke="currentColor" strokeWidth=".7" opacity=".22">
        <ellipse cx="240" cy="160" rx="218" ry="135" transform="rotate(-12 240 160)" />
        <ellipse cx="240" cy="160" rx="202" ry="147" transform="rotate(12 240 160)" strokeDasharray="2 9" />
      </g>
      <g className="technology-satellites" fill="currentColor"><circle cx="36" cy="160" r="3.5" /><circle cx="444" cy="160" r="2.5" /></g>
      <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="technology-signals">
        <path className="technology-signal" d="M24 72h48l52 52v72l-52 52H24" />
        <path className="technology-signal technology-signal--second" d="M456 248h-48l-52-52v-72l52-52h48" />
        <path className="technology-signal technology-signal--third" d="M192 0v72h96V0M192 320v-72h96v72" />
      </g>
    </>}
    <g stroke="currentColor" strokeWidth="1" opacity=".23" strokeLinejoin="round">
      <rect x="124" y="72" width="232" height="176" rx="28" />
      <rect x="148" y="96" width="184" height="128" rx="18" strokeDasharray="4 7" />
      <path d="M24 72h48l52 52M0 160h124M24 248h48l52-52M456 72h-48l-52 52M480 160H356M456 248h-48l-52-52M192 0v72M240 20v52M288 0v72M192 320v-72M240 300v-52M288 320v-72" />
    </g>
    <g fill="currentColor" opacity=".42">{[[24,72],[24,248],[456,72],[456,248],[192,24],[288,296],[76,160],[404,160]].map(([cx,cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3" />)}</g>
  </svg>;
}
