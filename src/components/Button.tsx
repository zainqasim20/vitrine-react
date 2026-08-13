import { type ButtonHTMLAttributes, type CSSProperties, forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type Size = 'md' | 'sm';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: string;
  fullWidth?: boolean;
}

const base: CSSProperties = {
  border: 0,
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontWeight: 700,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  transition: 'filter 180ms ease-out, border-color 180ms ease-out, background 180ms ease-out, color 180ms ease-out',
  whiteSpace: 'nowrap',
};

function variantStyle(variant: Variant, size: Size): CSSProperties {
  const h = size === 'sm' ? 36 : 48;
  const pad = size === 'sm' ? '0 16px' : '0 24px';
  const radius = size === 'sm' ? 8 : 10;
  const fontSize = size === 'sm' ? 14 : 15;

  switch (variant) {
    case 'primary':
      return { height: h, padding: pad, borderRadius: radius, background: 'var(--violet-gradient)', color: '#FFFFFF', fontSize, minWidth: size === 'md' ? 120 : undefined };
    case 'secondary':
      return { height: h, padding: pad, borderRadius: radius, background: 'transparent', color: 'var(--text)', fontSize, border: '1.5px solid var(--border)' };
    case 'destructive':
      return { height: h, padding: pad, borderRadius: radius, background: 'transparent', color: 'var(--error)', fontSize, border: '1.5px solid var(--error)' };
    case 'ghost':
    default:
      return { height: 40, padding: '0 12px', borderRadius: 8, background: 'transparent', color: 'var(--text-2)', fontSize: 14, fontWeight: 500 };
  }
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', icon, fullWidth, className, style, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={`btn btn-${variant}`}
      style={{ ...base, ...variantStyle(variant, size), width: fullWidth ? '100%' : undefined, ...style }}
      {...rest}
    >
      {icon && <i className={icon} style={{ fontSize: size === 'sm' ? 15 : 17 }} />}
      {children}
    </button>
  );
});

export function IconButton({
  icon,
  title,
  size = 40,
  active,
  ...rest
}: { icon: string; title?: string; size?: number; active?: boolean } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      title={title}
      className="icon-btn"
      style={{
        width: size,
        height: size,
        border: active ? '1.5px solid var(--violet)' : '1px solid var(--border)',
        borderRadius: 10,
        background: active ? 'var(--violet-light)' : 'transparent',
        color: active ? 'var(--violet-deep)' : 'var(--text-2)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'border-color 180ms ease-out, background 180ms ease-out',
      }}
      {...rest}
    >
      <i className={icon} style={{ fontSize: size <= 34 ? 16 : 20 }} />
    </button>
  );
}
