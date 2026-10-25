import { useEffect, useRef, useState } from 'react';
import './HeroVideo.css';

const VIDEO_URL = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_083109_283f3553-e28f-428b-a723-d639c617eb2b.mp4';
const FADE_SECONDS = 0.5;

/** Manual looping keeps both ends of the film soft against the white canvas. */
export function HeroVideo({ className = '' }) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container || failed) return;

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let restartTimer;
    let inViewport = true;
    let restarting = false;
    let disposed = false;
    const canPlay = () => !disposed && !motion.matches && !document.hidden && inViewport;
    const stopFrame = () => { window.cancelAnimationFrame(frame); frame = 0; };

    const updateOpacity = () => {
      if (disposed) return;
      const { currentTime, duration } = video;
      if (!restarting && Number.isFinite(duration) && duration > 0) {
        video.style.opacity = String(Math.max(0, Math.min(1, currentTime / FADE_SECONDS, (duration - currentTime) / FADE_SECONDS)));
      }
      if (!video.paused && canPlay()) frame = window.requestAnimationFrame(updateOpacity);
      else frame = 0;
    };

    const syncPlayback = () => {
      if (!canPlay()) {
        video.pause();
        stopFrame();
        // Show a still frame for visitors who prefer reduced motion.
        if (motion.matches && !restarting) video.style.opacity = '1';
      } else if (!restarting) {
        void video.play().catch(() => {});
      }
    };
    const onPlaying = () => { if (!frame) frame = window.requestAnimationFrame(updateOpacity); };
    const onPause = stopFrame;
    const onEnded = () => {
      stopFrame();
      video.style.opacity = '0';
      restarting = true;
      restartTimer = window.setTimeout(() => {
        if (disposed) return;
        video.currentTime = 0;
        restarting = false;
        syncPlayback();
      }, 100);
    };
    const observer = new IntersectionObserver(([entry]) => {
      inViewport = entry.isIntersecting;
      syncPlayback();
    });

    observer.observe(container);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnded);
    video.addEventListener('loadeddata', syncPlayback);
    motion.addEventListener('change', syncPlayback);
    document.addEventListener('visibilitychange', syncPlayback);
    syncPlayback();

    return () => {
      disposed = true;
      stopFrame();
      window.clearTimeout(restartTimer);
      observer.disconnect();
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('loadeddata', syncPlayback);
      motion.removeEventListener('change', syncPlayback);
      document.removeEventListener('visibilitychange', syncPlayback);
      video.pause();
    };
  }, [failed]);

  return (
    <div ref={containerRef} className={`cinematic-background ${className}`}>
      <div className="cinematic-background-fallback" aria-hidden="true" />
      {!failed && (
        <video
          ref={videoRef}
          className="hero-video"
          src={VIDEO_URL}
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          tabIndex={-1}
          style={{ opacity: 0 }}
          onError={() => setFailed(true)}
        />
      )}
      <div className="cinematic-background-gradient absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" aria-hidden="true" />
    </div>
  );
}
