import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './lib/ThemeContext.tsx';
import { NotificationProvider } from './lib/NotificationContext.tsx';

// Prevent unhandled script and maps loading errors from interrupting local sandbox preview
if (typeof window !== 'undefined') {
  const ignorePatterns = [
    'maps.googleapis.com',
    'ApiNotActivatedMapError',
    'gm_authFailure',
    'Script error.'
  ];

  window.addEventListener('error', (event) => {
    const msg = event.message || '';
    const filename = event.filename || '';
    if (
      ignorePatterns.some(pattern => msg.includes(pattern) || filename.includes(pattern)) ||
      msg === 'Script error.'
    ) {
      console.warn("Caught cross-origin or script error gracefully:", msg, filename);
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    const reason = String(event.reason || '');
    if (ignorePatterns.some(pattern => reason.includes(pattern))) {
      console.warn("Caught unhandled promise rejection gracefully:", reason);
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </ThemeProvider>
  </StrictMode>,
);
