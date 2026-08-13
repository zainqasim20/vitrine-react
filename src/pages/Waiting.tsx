import { useEffect, useState } from 'react';
import { useApp } from '../lib/store';

const STEPS = ['Uploading your screens', 'Analyzing the design', 'Drafting your portfolio'];

export function Waiting() {
  const { actions } = useApp();
  const [waitStep, setWaitStep] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const advance = (step: number, delay: number) => {
      const t = setTimeout(() => {
        if (step >= 2) {
          actions.finishWaiting();
          return;
        }
        setWaitStep(step + 1);
        advance(step + 1, 1100);
      }, delay);
      timers.push(t);
    };
    advance(0, 1100);
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 32px' }}>
      <div style={{ maxWidth: 480, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, textAlign: 'center' }}>
        <span
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: 'var(--violet-gradient)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'v-pulse-badge 1.6s ease-in-out infinite',
          }}
        >
          <i className="ph-fill ph-sparkle" style={{ fontSize: 28, color: '#FFFFFF' }} />
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, fontSize: 28, letterSpacing: '-0.02em' }}>Designing your portfolio</h1>
          <p style={{ fontSize: 15, color: 'var(--text-2)' }}>This usually takes under a minute.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', textAlign: 'left' }}>
          {STEPS.map((label, i) => {
            const done = waitStep > i;
            const active = waitStep === i;
            const fg = waitStep >= i ? 'var(--violet-deep)' : 'var(--text-3)';
            const icon = done ? 'ph-fill ph-check-circle' : active ? 'ph ph-circle-notch' : 'ph ph-circle-dashed';
            return (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', border: '1px solid var(--border)', borderRadius: 12, background: 'var(--surface)' }}>
                <i className={icon} style={{ fontSize: 18, color: fg }} />
                <span style={{ fontSize: 14, fontWeight: 500, color: fg }}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
