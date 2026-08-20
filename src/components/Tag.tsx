import type { CSSProperties, ReactNode } from 'react';

type Tone = 'ai-draft' | 'ai-suggested' | 'ai-generated' | 'success' | 'neutral' | 'sample' | 'low-confidence';

const toneStyle: Record<Tone, CSSProperties> = {
  'ai-draft': { background: 'var(--coral-gradient)', color: '#FFFFFF' },
  'ai-suggested': { background: 'var(--coral-gradient)', color: '#FFFFFF' },
  'ai-generated': { background: 'var(--violet-gradient)', color: '#FFFFFF' },
  success: { background: 'var(--success-bg)', color: 'var(--success)' },
  neutral: { background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)' },
  sample: { background: 'rgba(255,255,255,0.92)', color: 'var(--text-2)', border: '1px solid var(--border)' },
  'low-confidence': { background: 'var(--violet-light)', color: 'var(--on-violet-light)' },
};

export function Tag({ tone = 'neutral', icon, children }: { tone?: Tone; icon?: string; children: ReactNode }) {
  return (
    <span
      style={{
        height: 24,
        padding: '0 10px',
        borderRadius: 999,
        fontFamily: "'Geist Mono', monospace",
        fontSize: 11.5,
        fontWeight: 500,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        ...toneStyle[tone],
      }}
    >
      {icon && <i className={icon} style={{ fontSize: 12 }} />}
      {children}
    </span>
  );
}
