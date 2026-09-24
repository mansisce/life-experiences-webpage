/**
 * Shell Bootstrap
 *
 * This file is loaded ASYNCHRONOUSLY by main.jsx
 * Giving Webpack Module Federation runtime time to initialize
 * before App tries to lazy-load MFEs
 *
 * Why separate from App.jsx?
 * If App.jsx tries to import('home/App') immediately,
 * Webpack MF runtime isn't ready yet → 404 error
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '../styles/globals.css';

/**
 * Find root element
 * Safety check: ensures DOM ready before React mounts
 */
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error(
    'Root element #root not found in DOM. ' +
    'Check index.html has <div id="root"></div>'
  );
}

/**
 * Mount React app to root
 * This happens AFTER MF runtime initialized (due to async bootstrap)
 */
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

/**
 * At this point:
 * - Webpack MF runtime is ready
 * - React 19.2.0 loaded in window.React
 * - Shell container window.shell initialized
 * - App component can safely call import('home/App'), import('resume/App'), etc
 * - MFEs will fetch their remoteEntry.js when needed
 */
