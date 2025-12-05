import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
// Global error overlay for uncaught errors
function showErrorOverlay(message) {
  let overlay = document.getElementById('global-error-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'global-error-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.right = '0';
    overlay.style.bottom = '0';
    overlay.style.background = 'rgba(255,240,240,0.95)';
    overlay.style.zIndex = '9999';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.padding = '20px';
    const inner = document.createElement('div');
    inner.style.background = 'white';
    inner.style.padding = '24px';
    inner.style.borderRadius = '8px';
    inner.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
    inner.id = 'global-error-inner';
    overlay.appendChild(inner);
    document.body.appendChild(overlay);
  }
  const inner = document.getElementById('global-error-inner');
  if (inner) inner.innerHTML = `<h2 style="color:#c53030;margin:0 0 12px">Error</h2><div style="color:#2d3748">${String(message)}</div>`;
}

window.addEventListener('error', (e) => {
  console.error('Uncaught error:', e.error || e.message);
  showErrorOverlay(e.error?.message || e.message || 'Unknown error');
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled rejection:', e.reason);
  showErrorOverlay(e.reason?.message || JSON.stringify(e.reason) || 'Unhandled promise rejection');
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
