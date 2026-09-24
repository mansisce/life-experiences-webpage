/**
 * Home MFE Main Entry Point
 *
 * Same pattern as shell: async import of bootstrap
 * Ensures Webpack MF runtime initialized before App loads
 *
 * When shell calls import('home/App'):
 * 1. Webpack loads this MFE's chunks
 * 2. main.jsx executes
 * 3. main.jsx asyncly loads bootstrap.jsx
 * 4. bootstrap.jsx mounts App component
 * 5. App renders using shell's React instance
 */

import('./bootstrap.jsx').catch(err => {
  console.error('[Home MFE] Failed to bootstrap:', err);
  document.getElementById('root').innerHTML =
    '<h1>Failed to load Home MFE</h1><p>' +
    err.message +
    '</p>';
});
