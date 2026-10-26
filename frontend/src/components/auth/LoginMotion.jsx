import { useEffect, useState } from 'react';

function useEntrance(delay) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const timer = window.setTimeout(() => setVisible(true), motion.matches ? 0 : delay);
    const onMotionChange = () => { if (motion.matches) setVisible(true); };
    motion.addEventListener('change', onMotionChange);
    return () => {
      window.clearTimeout(timer);
      motion.removeEventListener('change', onMotionChange);
    };
  }, [delay]);

  return visible;
}

export function FadeIn({ children, delay = 0, duration = 1000, className = '' }) {
  const visible = useEntrance(delay);
  return (
    <div className={`login-fade ${className}`} style={{ opacity: visible ? 1 : 0, transitionDuration: `${duration}ms` }}>
      {children}
    </div>
  );
}

export function AnimatedHeading({ text, id, delay = 200, charDelay = 30 }) {
  const visible = useEntrance(delay);
  return (
    <h1 id={id} className="login-heading" aria-label={text.replaceAll('\n', ' ')}>
      {text.split('\n').map((line, lineIndex) => {
        let characterIndex = 0;
        return (
          <span className="login-heading-line" key={lineIndex} aria-hidden="true">
            {line.split(' ').map((word, wordIndex) => (
              <span className="login-heading-word" key={wordIndex}>
                {[...word, ...(wordIndex < line.split(' ').length - 1 ? ['\u00A0'] : [])].map((character) => {
                  const index = characterIndex++;
                  return (
                    <span key={index} className="login-heading-character" style={{
                      opacity: visible ? 1 : 0,
                      transform: visible ? 'translateX(0)' : 'translateX(-18px)',
                      transitionDelay: `${(lineIndex * line.length + index) * charDelay}ms`,
                    }}>{character}</span>
                  );
                })}
              </span>
            ))}
          </span>
        );
      })}
    </h1>
  );
}
