import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { ThemeSwitch } from '../components/ThemeSwitch';
import { HOW_STEPS, TEMPLATE_TEASERS } from '../lib/data';

const WORDS = ['portfolio', 'case study', 'showcase page'];

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
  const [heroSlide, setHeroSlide] = useState(50);
  const trackRef = useRef<HTMLDivElement>(null);

  const onSliderDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const track = trackRef.current;
    if (!track) return;
    const update = (clientX: number) => {
      const r = track.getBoundingClientRect();
      const pct = Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100));
      setHeroSlide(pct);
    };
    update(e.clientX);
    const mv = (ev: PointerEvent) => update(ev.clientX);
    const up = () => {
      window.removeEventListener('pointermove', mv);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', mv);
    window.addEventListener('pointerup', up);
  };

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
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div
                ref={trackRef}
                onPointerDown={onSliderDown}
                style={{
                  position: 'relative',
                  aspectRatio: '16 / 10.5',
                  border: '1px solid var(--border)',
                  borderRadius: 16,
                  overflow: 'hidden',
                  cursor: 'ew-resize',
                  userSelect: 'none',
                  touchAction: 'none',
                }}
              >
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #F9F7FF 0%, #F3EFFE 100%)', padding: 20, display: 'flex', flexDirection: 'column', gap: '10%' }}>
                  <span style={{ height: '26%', borderRadius: 8, background: 'var(--violet-gradient)', display: 'flex', alignItems: 'center', padding: '0 10%' }}>
                    <span style={{ height: 8, width: '42%', background: 'rgba(255,255,255,0.85)', borderRadius: 2 }} />
                  </span>
                  <span style={{ flex: 1, border: '1px solid #E3D9FA', borderRadius: 8, background: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: '9%', padding: '12%', justifyContent: 'center' }}>
                    <span style={{ height: 9, width: '64%', background: '#14141A', borderRadius: 2 }} />
                    <span style={{ height: 5, background: '#E7E7EA', borderRadius: 2 }} />
                    <span style={{ height: 5, width: '86%', background: '#E7E7EA', borderRadius: 2 }} />
                  </span>
                </div>

                <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', clipPath: `inset(0 ${100 - heroSlide}% 0 0)`, background: 'var(--surface)' }}>
                  <div style={{ position: 'absolute', inset: 0, padding: 20, display: 'flex', flexDirection: 'column', gap: '10%' }}>
                    <span style={{ height: '16%', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface-2)' }} />
                    <span style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface-2)', display: 'flex', flexDirection: 'column', gap: '10%', padding: '12%', justifyContent: 'center' }}>
                      <span style={{ height: 8, width: '54%', background: 'var(--text-3)', borderRadius: 2 }} />
                      <span style={{ height: 5, background: 'var(--border)', borderRadius: 2 }} />
                      <span style={{ height: 5, width: '78%', background: 'var(--border)', borderRadius: 2 }} />
                      <span style={{ height: 18, width: 72, borderRadius: 6, background: 'var(--border)', marginTop: 6 }} />
                    </span>
                  </div>
                </div>

                <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${heroSlide}%`, width: 0, pointerEvents: 'none' }}>
                  <span style={{ position: 'absolute', top: 0, bottom: 0, left: -1, width: 2, background: '#FFFFFF', boxShadow: '0 0 0 1px rgba(20,20,26,0.15)' }} />
                  <span
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: 0,
                      transform: 'translate(-50%, -50%)',
                      width: 34,
                      height: 34,
                      borderRadius: 999,
                      background: '#FFFFFF',
                      boxShadow: '0 6px 16px rgba(20,20,26,0.22)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <i className="ph ph-arrows-left-right" style={{ fontSize: 16, color: '#14141A' }} />
                  </span>
                </div>

                <span style={{ position: 'absolute', left: 12, top: 12, height: 24, padding: '0 10px', borderRadius: 999, background: 'rgba(var(--bg-rgb), 0.9)', border: '1px solid var(--border)', color: 'var(--text-2)', fontFamily: "'Geist Mono', monospace", fontSize: 11, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center' }}>
                  Before
                </span>
                <span style={{ position: 'absolute', right: 12, top: 12, height: 24, padding: '0 10px', borderRadius: 999, background: 'rgba(var(--bg-rgb), 0.9)', border: '1px solid var(--border)', color: 'var(--violet)', fontFamily: "'Geist Mono', monospace", fontSize: 11, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <i className="ph-fill ph-sparkle" style={{ fontSize: 11 }} />
                  After
                </span>
              </div>
              <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11.5, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-3)', marginTop: 12, alignSelf: 'center' }}>
                Drag to compare — one screen in, a written page out
              </span>
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
                  <div style={{ aspectRatio: '4 / 3', background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: 20, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridAutoRows: '1fr', gap: 8 }}>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <span key={i} style={{ background: i === 4 ? '#14141A' : 'var(--surface-3)' }} />
                    ))}
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
