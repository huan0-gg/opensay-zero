import { createRoot } from 'react-dom/client';
import App from './app/App';
import { recordings } from './services/recordings';
import './styles/global.css';

const root = document.getElementById('root');
if (!root) throw new Error('missing #root');

if (new URLSearchParams(window.location.search).get('e2e') === '1') {
  try {
    window.localStorage.setItem('opensay.e2e', '1');
  } catch {
    // ignore
  }
}

createRoot(root).render(<App />);

void recordings.cleanup();
