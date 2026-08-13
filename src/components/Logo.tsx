import { Link } from 'react-router-dom';

export function Logo({ height = 24, to = '/' }: { height?: number; to?: string }) {
  const img = (
    <>
      <img data-logo="light" src="/assets/vitrine-logo.svg" alt="Vitrine — home" style={{ height, width: 'auto', display: 'block' }} />
      <img data-logo="dark" src="/assets/vitrine-logo-dark.svg" alt="Vitrine — home" style={{ height, width: 'auto', display: 'block' }} />
    </>
  );

  return (
    <Link to={to} title="Vitrine — home" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
      {img}
    </Link>
  );
}
