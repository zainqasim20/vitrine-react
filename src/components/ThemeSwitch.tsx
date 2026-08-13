import { useApp } from '../lib/store';
import type { ThemeMode } from '../lib/types';

const OPTIONS: { key: ThemeMode; icon: string; label: string }[] = [
  { key: 'light', icon: 'ph ph-sun', label: 'Light theme' },
  { key: 'dark', icon: 'ph ph-moon', label: 'Dark theme' },
  { key: 'system', icon: 'ph ph-circle-half', label: 'Match system' },
];

export function ThemeSwitch({ size = 28 }: { size?: number }) {
  const { state, actions } = useApp();
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        padding: 3,
        border: '1px solid var(--border)',
        borderRadius: 999,
      }}
    >
      {OPTIONS.map((o) => {
        const on = state.theme === o.key;
        return (
          <button
            key={o.key}
            type="button"
            title={o.label}
            onClick={() => actions.setTheme(o.key)}
            style={{
              width: size,
              height: size,
              border: 0,
              borderRadius: 999,
              background: on ? 'var(--surface)' : 'transparent',
              color: on ? 'var(--text)' : 'var(--text-3)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <i className={o.icon} style={{ fontSize: size <= 28 ? 13 : 14 }} />
          </button>
        );
      })}
    </div>
  );
}
