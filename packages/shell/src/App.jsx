/**
 * Shell App Component
 *
 * Responsibilities:
 * 1. Route based on URL hash
 * 2. Lazy load MFE components
 * 3. Display error boundary
 * 4. Show loading state while MFE fetches
 */

import React, { Suspense, lazy } from 'react';
import Header from './components/Header';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

/**
 * LAZY LOAD MFEs
 *
 * Format: lazy(() => import('name/export'))
 * - 'home' = remotes key from webpack.config.js
 * - '/App' = exposes key from MFE's webpack.config.js
 * - 'home/App' = name/App path
 *
 * Lazy loading means:
 * - Shell initially doesn't load these
 * - When user navigates to page, component fetches from MFE
 * - remoteEntry.js fetched, shared deps resolved, component loaded
 * - Component mounts with Suspense wrapper
 */

const HomePage = lazy(() => {
  console.log('[Shell] Loading Home MFE...');
  const start = performance.now();

  return import('home/App')
    .then(module => {
      const duration = performance.now() - start;
      console.log(`[Shell] Home MFE loaded in ${duration.toFixed(0)}ms`);

      // Optional: Send telemetry
      // trackMfeLoad('home', duration, true);

      return module;
    })
    .catch(error => {
      const duration = performance.now() - start;
      console.error(`[Shell] Failed to load Home MFE (${duration.toFixed(0)}ms):`, error);

      // Optional: Send error telemetry
      // trackMfeLoad('home', duration, false, error);

      // Re-throw to trigger error boundary
      throw error;
    });
});

const LittleHumanPage = lazy(() => {
  console.log('[Shell] Loading LittleHuman MFE...');
  return import('littleHuman/App')
    .then(module => {
      console.log('[Shell] LittleHuman MFE loaded');
      return module;
    })
    .catch(error => {
      console.error('[Shell] Failed to load LittleHuman MFE:', error);
      throw error;
    });
});

const ResumePage = lazy(() => {
  console.log('[Shell] Loading Resume MFE...');
  return import('resume/App')
    .then(module => {
      console.log('[Shell] Resume MFE loaded');
      return module;
    })
    .catch(error => {
      console.error('[Shell] Failed to load Resume MFE:', error);
      throw error;
    });
});

const ReactLabPage = lazy(() => {
  console.log('[Shell] Loading ReactLab MFE...');
  return import('reactLab/App')
    .then(module => {
      console.log('[Shell] ReactLab MFE loaded');
      return module;
    })
    .catch(error => {
      console.error('[Shell] Failed to load ReactLab MFE:', error);
      throw error;
    });
});

const AiLearningPage = lazy(() => {
  console.log('[Shell] Loading AiLearning MFE...');
  return import('aiLearning/App')
    .then(module => {
      console.log('[Shell] AiLearning MFE loaded');
      return module;
    })
    .catch(error => {
      console.error('[Shell] Failed to load AiLearning MFE:', error);
      throw error;
    });
});

/**
 * Loading Fallback Component
 * Shown while MFE is fetching from server
 */
function LoadingFallback() {
  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Loading page...</p>
    </div>
  );
}

/**
 * Main App Component
 */
export default function App() {
  const [page, setPage] = React.useState(() => {
    // Initialize from URL hash
    // Extract page name from #/home or #/resume
    const hash = window.location.hash.slice(2); // Remove #/
    return hash || 'home';
  });

  // Listen for hash changes (browser back/forward, manual nav)
  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(2);
      setPage(hash || 'home');
      // Scroll to top when route changes
      window.scrollTo(0, 0);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Get the component for current page
  const PageComponent = {
    '': HomePage,
    home: HomePage,
    'little-human': LittleHumanPage,
    resume: ResumePage,
    react: ReactLabPage,
    ai: AiLearningPage,
  }[page] || HomePage;

  // Navigate handler
  const handleNavigate = (newPage) => {
    setPage(newPage);
    window.location.hash = `#/${newPage}`;
  };

  return (
    <div className="app">
      <Header currentPage={page} onNavigate={handleNavigate} />

      <main className="app-main">
        {/* Error boundary wraps MFE components */}
        {/* If MFE throws, error boundary catches and displays fallback */}
        <ErrorBoundary>
          {/* Suspense wraps lazy components */}
          {/* While MFE fetching, shows LoadingFallback */}
          <Suspense fallback={<LoadingFallback />}>
            <PageComponent />
          </Suspense>
        </ErrorBoundary>
      </main>

      <footer className="app-footer">
        <p>&copy; 2025 Mansi Gupta | Built with Microfrontends</p>
      </footer>
    </div>
  );
}

/**
 * HOW THIS WORKS IN PRACTICE:
 *
 * User navigates to /resume:
 * 1. handleNavigate('resume') called
 * 2. setPage('resume')
 * 3. PageComponent = ResumePage (lazy component)
 * 4. React renders: <Suspense><PageComponent /></Suspense>
 * 5. React tries to render ResumePage
 * 6. lazy() still loading → Shows LoadingFallback
 * 7. Webpack runtime starts fetching:
 *    - http://localhost:3003/remoteEntry.js
 *    - Parses: { exposes: { './App': './app.xyz.js' } }
 *    - http://localhost:3003/app.xyz.js
 *    - Loads Resume App component
 * 8. lazy() resolves
 * 9. React renders actual ResumePage component
 * 10. LoadingFallback unmounts, ResumePage shows
 *
 * If error occurs (MFE server down, version mismatch):
 * 1. lazy() rejects with error
 * 2. Suspense doesn't catch errors (it catches promises)
 * 3. Error bubbles up to ErrorBoundary
 * 4. ErrorBoundary catches, displays error fallback
 * 5. User sees: "Failed to load page" message with retry button
 *
 * If both error boundary AND lazy component fail:
 * 1. App component crashes
 * 2. React.StrictMode logs error to console
 * 3. Browser shows "Uncaught Error" screen
 * 4. (In production, should have top-level error handler)
 */
