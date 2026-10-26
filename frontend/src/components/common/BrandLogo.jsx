import React from 'react';
import './BrandLogo.css';

export function BrandLogo({ className = '', tone = 'sage' }) {
  return (
    <span className={`careerfit-logo ${tone === 'sage' ? 'careerfit-logo--sage' : ''} ${className}`}>
      <img
        src="/brand/careerfit-logo-v4-bright.png"
        alt="CareerFit"
        width="2172"
        height="724"
        draggable="false"
      />
    </span>
  );
}
