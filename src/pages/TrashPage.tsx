import { useApp, relativeTime } from '../lib/store';
import { DashEmpty } from '../components/DashLayout';

export function TrashPage() {
  const { state, actions } = useApp();
  const trashed = state.projects
    .filter((p) => p.deletedAt)
    .slice()
    .sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));

  return (
    <>
      <h1 style={{ margin: '0 0 6px', fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, fontSize: 28 }}>Trash</h1>
      <p style={{ margin: '0 0 28px', fontSize: 14, color: 'var(--text-2)' }}>Deleted case studies stay here until you restore or remove them for good.</p>

      {!trashed.length ? (
        <DashEmpty icon="ph ph-trash" title="Trash is empty" body="Nothing you've deleted is sitting here right now." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {trashed.map((p) => (
            <div
              key={p.id}
              style={{ display: 'flex', alignItems: 'center', gap: 14, border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}
            >
              <div style={{ flex: 'none', width: 64, height: 44, borderRadius: 8, overflow: 'hidden', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {p.cover ? (
                  <img src={p.cover} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <i className="ph ph-image" style={{ fontSize: 18, color: 'var(--text-3)' }} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</span>
                <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
                  Deleted {relativeTime(p.deletedAt)} · {p.sectionCount} {p.sectionCount === 1 ? 'section' : 'sections'}
                </span>
              </div>
              <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => actions.restoreProject(p.id)}
                  style={{ height: 34, padding: '0 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <i className="ph ph-arrow-counter-clockwise" style={{ fontSize: 14 }} />
                  Restore
                </button>
                <button
                  type="button"
                  title="Delete forever"
                  onClick={() => actions.deleteProjectForever(p.id)}
                  style={{ width: 34, height: 34, border: 0, borderRadius: 8, background: 'transparent', color: 'var(--text-2)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <i className="ph ph-x" style={{ fontSize: 16 }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
