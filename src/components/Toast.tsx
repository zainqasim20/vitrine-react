import { useApp } from '../lib/store';

export function Toast() {
  const { state } = useApp();
  if (!state.toast) return null;
  return (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        bottom: 96,
        transform: 'translateX(-50%)',
        zIndex: 60,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        height: 44,
        padding: '0 18px',
        borderRadius: 999,
        background: '#14141A',
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: 700,
        boxShadow: 'var(--shadow-lg)',
        animation: 'v-in 200ms ease-out',
        pointerEvents: 'none',
      }}
    >
      <i className="ph-fill ph-check-circle" style={{ fontSize: 18, color: 'var(--success)' }} />
      {state.toast}
    </div>
  );
}
