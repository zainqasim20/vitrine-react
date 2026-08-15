import { useApp } from '../lib/store';
import { relativeTime } from '../lib/store';
import { DashEmpty } from '../components/DashLayout';

export function Projects() {
  const { state, actions } = useApp();
  const projects = state.projects
    .filter((p) => !p.deletedAt)
    .slice()
    .sort((a, b) => b.editedAt - a.editedAt);

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, fontSize: 28 }}>My Projects</h1>
          <span style={{ fontSize: 14, color: 'var(--text-2)' }}>
            {projects.length} case {projects.length === 1 ? 'study' : 'studies'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => actions.openNewProject()}
          style={{ height: 42, padding: '0 18px', border: 0, borderRadius: 10, background: 'var(--violet-gradient)', color: '#FFFFFF', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          <i className="ph ph-plus" style={{ fontSize: 16 }} />
          New project
        </button>
      </div>

      {!projects.length ? (
        <DashEmpty
          icon="ph ph-folder-open"
          title="You haven't started a case study yet"
          body="Drop the screens from something you shipped and write the first pass. Your real progress is saved here automatically."
          action={
            <button
              type="button"
              onClick={() => actions.openNewProject()}
              style={{ height: 42, padding: '0 20px', border: 0, borderRadius: 10, background: 'var(--violet-gradient)', color: '#FFFFFF', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
            >
              Start a case study
            </button>
          }
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
          {projects.map((p) => (
            <div
              key={p.id}
              onClick={() => actions.openProject(p.id)}
              style={{ border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', background: 'var(--surface)' }}
            >
              <div style={{ position: 'relative', aspectRatio: '16 / 10', background: 'var(--surface-2)' }}>
                {p.cover ? (
                  <img src={p.cover} alt={p.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>
                    <i className="ph ph-image" style={{ fontSize: 26 }} />
                  </span>
                )}
                <span
                  style={{
                    position: 'absolute',
                    left: 10,
                    top: 10,
                    height: 24,
                    padding: '0 10px',
                    borderRadius: 999,
                    display: 'inline-flex',
                    alignItems: 'center',
                    fontFamily: "'Geist Mono', monospace",
                    fontSize: 11,
                    fontWeight: 500,
                    letterSpacing: '0.03em',
                    background: p.status === 'Published' ? 'var(--success-bg)' : 'var(--surface-3)',
                    color: p.status === 'Published' ? 'var(--success)' : 'var(--text-2)',
                  }}
                >
                  {p.status}
                </span>
                <button
                  type="button"
                  title="Move to Trash"
                  onClick={(e) => {
                    e.stopPropagation();
                    actions.trashProject(p.id);
                  }}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: 10,
                    width: 28,
                    height: 28,
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    background: 'var(--surface)',
                    color: 'var(--text)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <i className="ph ph-trash" style={{ fontSize: 14 }} />
                </button>
              </div>
              <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 15, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</span>
                <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
                  Edited {relativeTime(p.editedAt)} · {p.sectionCount} {p.sectionCount === 1 ? 'section' : 'sections'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
