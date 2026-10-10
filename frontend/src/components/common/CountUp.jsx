import React, { useState, useEffect } from 'react';

/**
 * CountUp — Lightweight requestAnimationFrame number counter with cubic ease-out
 */
export function CountUp({ end = 0, duration = 1000, suffix = '', prefix = '', decimals = 0 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setCount(end);
      return;
    }

    let startTime = null;
    let frameId;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Cubic ease out
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = decimals > 0 
        ? parseFloat((easeOut * end).toFixed(decimals))
        : Math.round(easeOut * end);

      setCount(current);

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      }
    };

    frameId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frameId);
  }, [end, duration, decimals]);

  return <span>{prefix}{count.toLocaleString('vi-VN')}{suffix}</span>;
}
