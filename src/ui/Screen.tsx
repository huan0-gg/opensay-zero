import type { ReactNode } from 'react';

interface ScreenProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
  action?: ReactNode;
}

export function Screen({ eyebrow, title, subtitle, children, action }: ScreenProps) {
  return (
    <section className="screen stack">
      <header className="stack stack--sm">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <div className="row row--between">
          <h1 className="display" style={{ fontSize: 'clamp(26px, 5.5vw, 34px)' }}>
            {title}
          </h1>
          {action}
        </div>
        {subtitle ? <p className="lede">{subtitle}</p> : null}
      </header>
      {children}
    </section>
  );
}
