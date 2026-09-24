/**
 * Shell Main Entry Point
 *
 * This is what webpack loads first (specified in webpack.config.js entry)
 * Its job is to asynchronously load bootstrap.jsx
 * Giving Webpack Module Federation runtime time to initialize
 *
 * Timeline:
 * 1. Browser loads index.html
 * 2. index.html loads <script src="main.abc123.js"></script>
 * 3. main.js executes (this file)
 * 4. Immediately returns (async import)
 * 5. Webpack MF runtime initializes (20-50ms)
 * 6. bootstrap.jsx loads and executes
 * 7. App component renders, can now safely import MFEs
 */

// Async import of bootstrap
// This returns immediately, doesn't block
// Webpack's module federation runtime initializes while this loads
import('./bootstrap.jsx').catch(err => {
  console.error('Failed to load shell bootstrap:', err);
  // Fallback error display
  document.getElementById('root').innerHTML =
    '<h1>Failed to load application</h1><p>' +
    err.message +
    '</p>';
});

/**
 * Why not use: import App from './bootstrap.jsx'?
 *
 * Because synchronous import:
 *   import App from './bootstrap.jsx'
 *   ^ This blocks, App starts immediately
 *   ^ Webpack MF runtime not initialized yet
 *   ^ import('home/App') fails
 *
 * Async import('./bootstrap.jsx'):
 *   ^ This returns immediately (microtask)
 *   ^ Webpack MF runtime gets time to initialize
 *   ^ bootstrap.jsx loads after MF runtime ready
 *   ^ import('home/App') works ✓
 */
