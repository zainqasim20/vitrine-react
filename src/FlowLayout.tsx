import { Outlet } from 'react-router-dom';
import { FlowHeader } from './components/FlowHeader';

export function FlowLayout() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', color: 'var(--text)' }}>
      <FlowHeader />
      <Outlet />
    </div>
  );
}
