import { useEffect, useRef, useState } from 'react';
import './AppBackground.css';

const POSTER = '/background/careerfit-meadow-poster.jpg';

/** Shared presentation layer, independent of page data and navigation. */
export function AppBackground({ employer = false }) {
  const layerRef = useRef(null);
  const videoRef = useRef(null);
  const [videoAllowed, setVideoAllowed] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    const desktop = matchMedia('(min-width: 768px) and (hover: hover) and (pointer: fine)');
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const connection = navigator.connection;
    const update = () => setVideoAllowed(desktop.matches && !motion.matches && !connection?.saveData && !/^(slow-)?2g$/.test(connection?.effectiveType || ''));
    update();
    desktop.addEventListener('change', update);
    motion.addEventListener('change', update);
    connection?.addEventListener('change', update);
    return () => {
      desktop.removeEventListener('change', update);
      motion.removeEventListener('change', update);
      connection?.removeEventListener('change', update);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoAllowed || videoFailed) return;
    video.playbackRate = .7;
    const sync = () => {
      if (document.hidden) video.pause();
      else void video.play().catch(() => {});
    };
    video.addEventListener('loadedmetadata', sync);
    document.addEventListener('visibilitychange', sync);
    sync();
    return () => {
      document.removeEventListener('visibilitychange', sync);
      video.removeEventListener('loadedmetadata', sync);
      video.pause();
    };
  }, [videoAllowed, videoFailed]);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    const pointer = matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine)');
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0, x = 0, y = 0;
    const reset = () => {
      cancelAnimationFrame(frame); frame = 0;
      layer.style.setProperty('--landscape-x', '0px');
      layer.style.setProperty('--landscape-y', '0px');
      layer.dataset.hidden = String(document.hidden);
    };
    const move = (event) => {
      if (!pointer.matches || motion.matches || document.hidden) return;
      x = Math.max(-8, Math.min(8, (event.clientX / innerWidth - .5) * 16));
      y = Math.max(-6, Math.min(6, (event.clientY / innerHeight - .5) * 12));
      if (frame) return;
      frame = requestAnimationFrame(() => {
        layer.style.setProperty('--landscape-x', `${x.toFixed(2)}px`);
        layer.style.setProperty('--landscape-y', `${y.toFixed(2)}px`);
        frame = 0;
      });
    };
    reset();
    window.addEventListener('pointermove', move, { passive: true });
    document.documentElement.addEventListener('pointerleave', reset);
    document.addEventListener('visibilitychange', reset);
    pointer.addEventListener('change', reset);
    motion.addEventListener('change', reset);
    return () => {
      reset();
      window.removeEventListener('pointermove', move);
      document.documentElement.removeEventListener('pointerleave', reset);
      document.removeEventListener('visibilitychange', reset);
      pointer.removeEventListener('change', reset);
      motion.removeEventListener('change', reset);
    };
  }, []);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    const sync = () => {
      const value = String(window.scrollY > 8);
      if (layer.dataset.scrolled !== value) layer.dataset.scrolled = value;
    };
    sync();
    window.addEventListener('scroll', sync, { passive: true });
    return () => window.removeEventListener('scroll', sync);
  }, []);

  return <div ref={layerRef} className={`app-background${employer ? ' app-background--employer' : ''}`} data-still={!videoAllowed} aria-hidden="true">
    <div className="app-background-scene">
      <img className="app-background-poster" src={POSTER} alt="" decoding="async" fetchPriority="high" />
      {videoAllowed && !videoFailed && <video ref={videoRef} className="app-background-video" autoPlay muted loop playsInline preload="metadata" poster={POSTER} tabIndex={-1} onError={event => { if (event.currentTarget.error) setVideoFailed(true); }}>
        <source src="/background/careerfit-meadow.webm" type="video/webm" />
        <source src="/background/careerfit-meadow.mp4" type="video/mp4" onError={() => setVideoFailed(true)} />
      </video>}
    </div>
    <div className="app-background-overlay" />
    <div className="app-background-light" />
    <div className="app-background-mist">{[0, 1, 2].map(i => <svg key={i} viewBox="0 0 1200 260" preserveAspectRatio="none"><path d="M0 150 Q130 55 260 120 Q390 15 540 110 Q720 40 860 115 Q1030 50 1200 145 L1200 260H0Z" fill="white" /></svg>)}</div>
    <div className="app-background-pollen">{Array.from({ length: 8 }, (_, i) => <i key={i} style={{ left: `${8 + i * 12}%`, top: `${25 + (i * 17) % 62}%`, animationDelay: `${i * -3.1}s`, animationDuration: `${15 + i % 4 * 3}s` }} />)}</div>
  </div>;
}
