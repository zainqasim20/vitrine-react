import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// Self-hosted fonts and icon font — bundled at build time, no external CDN
// dependency at runtime (unpkg/Google Fonts/Fontshare are all skipped).
import '@fontsource/bricolage-grotesque/400.css';
import '@fontsource/bricolage-grotesque/600.css';
import '@fontsource/bricolage-grotesque/700.css';
import '@fontsource/geist-mono/400.css';
import '@fontsource/geist-mono/500.css';
import '@fontsource/geist-mono/600.css';
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/700.css';
import '@phosphor-icons/web/regular/style.css';
import '@phosphor-icons/web/fill/style.css';

import './styles/global.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
