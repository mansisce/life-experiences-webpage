/**
 * Home MFE Bootstrap
 *
 * When shell calls import('home/App'), this bootstrap loads
 * Sets up React and mounts the Home app component
 *
 * Key point: Uses SHELL's React instance (singleton)
 * Not its own React bundled in MFE
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '../../shared/src/styles/globals.css';

console.log('[Home MFE] Bootstrap loading');
console.log('[Home MFE] React version:', React.version);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found in Home MFE');
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log('[Home MFE] Bootstrap complete, App mounted');

/**
 * IMPORTANT: How MFE React Works
 *
 * When shell loads this MFE:
 * 1. Shell already has React 19.2.0 loaded (eager: true)
 * 2. MFE's webpack config says: react: { singleton: true, eager: false }
 * 3. Webpack looks for existing React singleton
 * 4. Finds shell's React 19.2.0
 * 5. Reuses it for this MFE
 * 6. This code runs React 19.2.0 from shell, not MFE's own bundle
 *
 * Verification:
 * window.React === React  ✓ (same instance)
 * React.version === '19.2.0'  ✓ (shell's version)
 *
 * If versions mismatched (shell has React 18, MFE expects 19):
 * - Would use shell's React 18 anyway (singleton: true)
 * - But this code written for React 19
 * - Hooks break, white screen, unclear error
 * - This is why version matching is critical!
 */
