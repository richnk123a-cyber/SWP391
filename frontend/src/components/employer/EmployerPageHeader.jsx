import React from 'react';
import './EmployerPages.css';

export function EmployerPageHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="employer-page-heading">
      <div className="employer-page-heading-copy">
        <p className="employer-page-eyebrow">{eyebrow}</p>
        <h1>{title}<span>.</span></h1>
        <p className="employer-page-description">{description}</p>
      </div>
      {actions && <div className="employer-page-heading-side">{actions}</div>}
    </header>
  );
}
