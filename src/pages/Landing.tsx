import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { ThemeSwitch } from '../components/ThemeSwitch';
import { TemplateThumb } from '../components/TemplateThumb';
import { HOW_STEPS, TEMPLATE_TEASERS } from '../lib/data';

const WORDS = ['portfolio', 'case study', 'showcase page'];

// Real three-step demo, ported from the live site's LANDING_FRAMES/
// landingFrameMock() -- replaces the fake, unwired before/after slider that
// used to sit here with the actual 01 Upload / 02 Draft / 03 Refine steps,
// hover-to-preview.
const LANDING_FRAMES = [
  { key: 'upload', label: '01 Upload', icon: 'ph ph-cloud-arrow-up' },
  { key: 'draft', label: '02 Draft', icon: 'ph-fill ph-sparkle' },
  { key: 'refine', label: '03 Refine', icon: 'ph ph-cursor' },
] as const;

function useTypewriter() {
  const [text, setText] = useState('');
  useEffect(() => {
    let wi = 0;
    let ci = 0;
    let phase: 'typing' | 'pause' | 'deleting' = 'typing';
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      const word = WORDS[wi];
      let delay = 70;
      if (phase === 'typing') {
        ci++;
        setText(word.slice(0, ci));
        if (ci >= word.length) {
          phase = 'pause';
          delay = 1200;
        } else {
          delay = 70;
        }
      } else if (phase === 'pause') {
        phase = 'deleting';
        delay = 40;
      } else {
        ci--;
        setText(word.slice(0, ci));
        if (ci <= 0) {
          phase = 'typing';
          wi = (wi + 1) % WORDS.length;
          delay = 300;
        } else {
          delay = 40;
        }
      }
      timer = setTimeout(tick, delay);
    };
    timer = setTimeout(tick, 70);
    return () => clearTimeout(timer);
  }, []);
  return text;
}

export function Landing() {
  const navigate = useNavigate();
  const typeText = useTypewriter();
  const [landingDemo, setLandingDemo] = useState(0);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', color: 'var(--text)' }}>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
          flexWrap: 'wrap',
          padding: '16px 40px',
          background: 'rgba(var(--bg-rgb), 0.86)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <Logo height={28} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <Link to="/showcase" style={{ color: 'var(--text-2)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500, fontSize: 15, textDecoration: 'none' }}>
              Showcase
            </Link>
            <Link to="/templates" style={{ color: 'var(--text-2)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500, fontSize: 15, textDecoration: 'none' }}>
              Templates
            </Link>
            <Link to="/settings" style={{ color: 'var(--text-2)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500, fontSize: 15, textDecoration: 'none' }}>
              Log in
            </Link>
          </nav>
          <ThemeSwitch />
          <button
            type="button"
            onClick={() => navigate('/create')}
            style={{ height: 44, padding: '0 20px', border: 0, borderRadius: 10, background: 'var(--violet-gradient)', color: '#FFFFFF', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
          >
            Get started
          </button>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        <section style={{ padding: '96px 40px 88px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ maxWidth: 900, margin: '0 auto 56px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, textAlign: 'center' }}>
            <span
              style={{
                height: 28,
                padding: '0 12px',
                border: '1px solid var(--border)',
                borderRadius: 999,
                fontFamily: "'Geist Mono', monospace",
                fontSize: 11.5,
                fontWeight: 500,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: 'var(--text-2)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ width: 5, height: 5, borderRadius: 999, background: 'var(--success)' }} />
              For product designers
            </span>
            <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, fontSize: 40, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
              One screen becomes a{' '}
              <span style={{ background: 'linear-gradient(135deg, #6038EE 0%, #2B8FF5 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                {typeText}
              </span>
              <span
                style={{
                  display: 'inline-block',
                  width: 3,
                  height: '0.9em',
                  background: '#6038EE',
                  marginLeft: 2,
                  verticalAlign: '-0.1em',
                  animation: 'v-blink 1s step-end infinite',
                }}
              />
            </h1>
            <p style={{ fontSize: 19, lineHeight: 1.5, color: 'var(--text-2)', maxWidth: '52ch' }}>
              Drop the screens from something you shipped — Vitrine drafts it, designs it, and gets it ready to share.
            </p>
          </div>

          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 40, alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {LANDING_FRAMES.map((f, i) => {
                const on = landingDemo === i;
                return (
                  <div key={f.key}>
                    <div
                      onMouseEnter={() => setLandingDemo(i)}
                      style={{
                        border: `1.5px solid ${on ? 'var(--violet)' : 'var(--border)'}`,
                        borderRadius: 14,
                        padding: 16,
                        background: on ? 'var(--violet-light)' : 'var(--surface)',
                        cursor: 'default',
                        transition: 'border-color 160ms ease-out, background 160ms ease-out',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11.5, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: on ? 'var(--violet-deep)' : 'var(--text-3)' }}>{f.label}</span>
                        <i className={f.icon} style={{ fontSize: 16, color: on ? 'var(--violet-deep)' : 'var(--text-3)' }} />
                      </div>
                      <LandingFrameMock stepKey={f.key} />
                    </div>
                    {i < LANDING_FRAMES.length - 1 && <span style={{ display: 'block', width: 1, height: 16, background: 'var(--border)', margin: '0 auto' }} />}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => navigate('/create')}
              style={{
                minHeight: 220,
                padding: 28,
                border: '1.5px dashed var(--violet)',
                borderRadius: 16,
                background: 'var(--violet-light)',
                cursor: 'pointer',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                justifyContent: 'center',
                gap: 18,
                height: '100%',
              }}
            >
              <span style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--violet-gradient)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'center' }}>
                <i className="ph ph-cloud-arrow-up" style={{ fontSize: 26, color: '#FFFFFF' }} />
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 17, color: 'var(--text)' }}>Drop your screens here to start</span>
                <span style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--text-2)', textAlign: 'center' }}>PNG, JPG or MP4 · a draft in about a minute · no account needed</span>
              </span>
            </button>
          </div>
        </section>

        <section style={{ padding: '88px 40px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11.5, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-3)' }}>How it works</span>
            <h2 style={{ margin: '12px 0 48px', fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, fontSize: 32, lineHeight: 1.1, letterSpacing: '-0.02em', maxWidth: '22ch' }}>
              Three steps, and you can stop at any of them.
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 0 }}>
              {HOW_STEPS.map((h, i) => (
                <div key={h.num} style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingRight: 40, borderRight: i < 2 ? '1px solid var(--border)' : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ height: 32, padding: '0 12px', borderRadius: 999, background: 'var(--violet-light)', color: 'var(--violet-deep)', fontFamily: "'Geist Mono', monospace", fontSize: 11.5, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center' }}>
                      {h.num}
                    </span>
                    <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  </div>
                  <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 20, lineHeight: 1.3 }}>{h.title}</h3>
                  <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text-2)', maxWidth: '34ch' }}>{h.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ padding: '88px 40px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap', marginBottom: 40 }}>
              <div>
                <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11.5, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Templates</span>
                <h2 style={{ margin: '12px 0 0', fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, fontSize: 32, lineHeight: 1.1, letterSpacing: '-0.02em', maxWidth: '22ch' }}>
                  Presentation styles, not categories.
                </h2>
              </div>
              <Link to="/templates" style={{ color: 'var(--blue)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15, display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
                Browse all templates
                <i className="ph ph-arrow-right" style={{ fontSize: 16 }} />
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 20 }}>
              {TEMPLATE_TEASERS.map((t) => (
                <div key={t.name} style={{ border: '1px solid var(--border)', borderRadius: 16, background: 'var(--surface)', overflow: 'hidden' }}>
                  <div style={{ aspectRatio: '4 / 3', background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: 20 }}>
                    <TemplateThumb kind={t.kind} />
                  </div>
                  <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 700 }}>{t.name}</span>
                    <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11.5, letterSpacing: '0.04em', color: 'var(--text-3)' }}>{t.meta}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ padding: '88px 40px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', border: '1.5px dashed var(--border)', borderRadius: 16, padding: '56px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
            <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11.5, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Reserved — customer proof</span>
            <p style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--text-2)', maxWidth: '52ch' }}>Testimonials and team logos go here once real ones exist. Nothing invented in the meantime.</p>
          </div>
        </section>

        <footer style={{ padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Logo height={22} />
            <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11.5, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-3)' }}>© 2026</span>
          </div>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 24, fontSize: 15, fontWeight: 500 }}>
            <Link to="/templates" style={{ color: 'var(--text-2)' }}>Templates</Link>
            <a href="#" style={{ color: 'var(--text-2)' }}>Changelog</a>
            <a href="#" style={{ color: 'var(--text-2)' }}>Privacy</a>
            <a href="#" style={{ color: 'var(--text-2)' }}>Contact</a>
          </nav>
        </footer>
      </main>
    </div>
  );
}

// Real per-step mock visuals, ported from the live site's landingFrameMock().
function LandingFrameMock({ stepKey }: { stepKey: (typeof LANDING_FRAMES)[number]['key'] }) {
  if (stepKey === 'upload') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, height: 72 }}>
        <span style={{ border: '1px dashed var(--border)', borderRadius: 6, background: 'var(--surface-2)' }} />
        <span style={{ border: '1px dashed var(--border)', borderRadius: 6, background: 'var(--surface-2)' }} />
        <span style={{ border: '1px dashed var(--border)', borderRadius: 6, background: 'var(--surface-2)' }} />
        <span style={{ border: '1.5px dashed var(--violet)', borderRadius: 6, background: 'var(--violet-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="ph ph-plus" style={{ fontSize: 16, color: 'var(--violet)' }} />
        </span>
      </div>
    );
  }
  if (stepKey === 'draft') {
    return (
      <div style={{ display: 'flex', gap: 10, height: 72, alignItems: 'center' }}>
        <span style={{ flex: 'none', width: 40, height: 40, borderRadius: 6, background: 'var(--surface-3)' }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
          <span style={{ height: 16, width: 62, borderRadius: 999, background: 'var(--coral-gradient)' }} />
          <span style={{ height: 6, borderRadius: 2, background: 'var(--border)' }} />
          <span style={{ height: 6, width: '70%', borderRadius: 2, background: 'var(--border)' }} />
        </div>
      </div>
    );
  }
  return (
    <div style={{ position: 'relative', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: '70%', height: '80%', border: '1.5px solid var(--violet)', borderRadius: 6 }}>
        {['nw', 'ne', 'sw', 'se'].map((corner) => (
          <span
            key={corner}
            style={{
              position: 'absolute',
              width: 6,
              height: 6,
              border: '1.5px solid var(--violet)',
              borderRadius: 1.5,
              background: 'var(--surface)',
              top: corner.includes('n') ? -3 : undefined,
              bottom: corner.includes('s') ? -3 : undefined,
              left: corner.includes('w') ? -3 : undefined,
              right: corner.includes('e') ? -3 : undefined,
            }}
          />
        ))}
      </div>
      <span style={{ position: 'absolute', right: 0, bottom: 0, height: 20, padding: '0 8px', borderRadius: 999, background: 'var(--violet-gradient)', color: '#FFFFFF', fontFamily: "'Geist Mono', monospace", fontSize: 10, fontWeight: 500, letterSpacing: '0.03em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
        <i className="ph-fill ph-play-circle" style={{ fontSize: 10 }} />
        Motion
      </span>
    </div>
  );
}

