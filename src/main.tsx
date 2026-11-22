import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './ui/App';
import './index.css';
import { setupPwa } from './ui/pwa';

setupPwa();

const root = document.getElementById('root');
if (!root) throw new Error('#root não encontrado');
// página de desenvolvimento dos avatares (fora do build de produção)
if (import.meta.env.DEV && location.pathname === '/dev/avatars') {
  void import('./ui/dev/DevAvatars').then(({ default: DevAvatars }) =>
    createRoot(root).render(
      <StrictMode>
        <DevAvatars />
      </StrictMode>,
    ),
  );
} else {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
