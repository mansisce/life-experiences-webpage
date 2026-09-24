# Refactor Existing Code to Federated Modules Prompt (React)

## Project Overview

Refactor the existing Mansilly React application into **independent federated modules** that can be:
1. Developed independently
2. Deployed separately
3. Loaded dynamically by the host app via Module Federation

This is a **parallel effort** to reward system development. Two modules will be created:
- `@mansilly/personal-os` — Personal Operating System (5 tabs)
- `@mansilly/professional` — Professional Resume + Social Links

**Monorepo Structure**:
```
mansilly/
├── apps/host/                        # Main React app (host)
├── apps/personal-os/                 # Personal OS module
├── apps/professional/                # Professional module
├── apps/reward-system/               # Reward system (Next.js)
└── packages/shared-ui/               # Optional: shared components
```

---

## Current State → Modular Architecture

### Current App Structure
```
src/
├── App.jsx                (router + layout)
├── pages/
│   ├── HomePage.jsx
│   ├── PersonalOS.jsx
│   ├── Professional.jsx
│   ├── ReactLabPage.jsx
│   └── AiLearningPage.jsx
├── components/
│   ├── Header.jsx
│   ├── PageHero.jsx
│   ├── SectionHeading.jsx
│   └── ScrollButton.jsx
├── data.js                (all content)
└── styles.css
```

### Modular Architecture (Target)
```
apps/host/
├── src/
│   ├── App.jsx            (host router + shell)
│   ├── contexts/          (shared auth, space context)
│   ├── components/        (Header, Footer, Shell)
│   └── pages/
│       └── DashboardPage.jsx

apps/personal-os/
├── src/
│   ├── App.jsx            (module entry)
│   ├── pages/PersonalOS.jsx
│   ├── tabs/              (5 tab components)
│   ├── components/
│   └── data.js

apps/professional/
├── src/
│   ├── App.jsx            (module entry)
│   ├── pages/
│   │   ├── ProfessionalHome.jsx
│   │   └── ProfessionalResume.jsx
│   ├── components/
│   └── data.js
```

---

## Phase 1: Set Up Monorepo Structure

### Create Monorepo

**Option A: pnpm workspaces** (Recommended)

1. Install pnpm globally:
   ```bash
   npm install -g pnpm
   ```

2. Create `pnpm-workspace.yaml` in root:
   ```yaml
   packages:
     - 'apps/*'
     - 'packages/*'
   ```

3. Create `package.json` in root:
   ```json
   {
     "name": "mansilly-monorepo",
     "private": true,
     "workspaces": ["apps/*", "packages/*"],
     "scripts": {
       "dev": "pnpm -r --parallel run dev",
       "build": "pnpm -r run build",
       "lint": "pnpm -r run lint"
     }
   }
   ```

**Option B: npm workspaces**

Create root `package.json`:
```json
{
  "workspaces": ["apps/*", "packages/*"]
}
```

### Directory Setup

```bash
# Create directories
mkdir -p apps/host apps/personal-os apps/professional apps/reward-system packages/shared-ui

# Move current code to host
mv src apps/host/
mv vite.config.js apps/host/
mv package.json apps/host/
```

---

## Phase 2: Set Up Host App (Main React/Vite)

**Location**: `/apps/host`

### vite.config.js (Module Federation)

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'host',
      remotes: {
        personalOS: 'http://localhost:5174/remoteEntry.js',
        professional: 'http://localhost:5175/remoteEntry.js',
        rewardSystem: 'http://localhost:3000/remoteEntry.js',
      },
      shared: ['react', 'react-dom'],
    }),
  ],
  build: {
    modulePreload: false,
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
  },
  server: {
    port: 5173,
  },
});
```

### Host App Structure

**src/App.jsx** — Router + Shell

```javascript
import { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { useRenderTracker } from './hooks/useRenderTracker';
import Header from './components/Header';
import Footer from './components/Footer';
import { SpaceContext } from './contexts/SpaceContext';

// Lazy load modules
const PersonalOSModule = lazy(() => import('personalOS/App'));
const ProfessionalModule = lazy(() => import('professional/App'));
const RewardSystemModule = lazy(() => import('rewardSystem/App'));

function getRoute() {
  const hash = window.location.hash.replace('#', '') || '/personal';
  return hash;
}

function App() {
  const [route, setRoute] = useState(getRoute());
  const [currentSpace, setCurrentSpace] = useState('personal');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Determine which module to load based on route
  const space = route.split('/')[1]; // Extract "personal", "professional", "reward"

  const handleToggleSpace = (newSpace) => {
    setCurrentSpace(newSpace);
    window.location.hash = `#/${newSpace}`;
  };

  const handleToggleAuth = () => {
    setIsAuthenticated(!isAuthenticated);
  };

  useEffect(() => {
    const onHashChange = () => setRoute(getRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return (
    <SpaceContext.Provider
      value={{
        currentSpace,
        setCurrentSpace: handleToggleSpace,
        isAuthenticated,
        setIsAuthenticated: handleToggleAuth,
      }}
    >
      <Header space={currentSpace} onSpaceChange={handleToggleSpace} />

      <main className="main-content">
        <Suspense fallback={<div>Loading module...</div>}>
          {space === 'personal' && <PersonalOSModule />}
          {space === 'professional' && <ProfessionalModule />}
          {space === 'reward' && <RewardSystemModule />}
          {!['personal', 'professional', 'reward'].includes(space) && (
            <div className="dashboard">Welcome to Mansilly</div>
          )}
        </Suspense>
      </main>

      <Footer />
    </SpaceContext.Provider>
  );
}

export default App;
```

**src/contexts/SpaceContext.jsx**

```javascript
import { createContext } from 'react';

export const SpaceContext = createContext({
  currentSpace: 'personal',
  setCurrentSpace: () => {},
  isAuthenticated: false,
  setIsAuthenticated: () => {},
});
```

**src/components/Header.jsx** (Updated)

```javascript
import { useContext } from 'react';
import { SpaceContext } from '../contexts/SpaceContext';
import './Header.css';

export default function Header({ space, onSpaceChange }) {
  const { isAuthenticated, setIsAuthenticated } = useContext(SpaceContext);

  return (
    <header className="header">
      <div className="header-left">
        <a href="#/personal" className="logo">Mansilly</a>
      </div>

      <nav className="nav">
        <button
          className={`nav-btn ${space === 'personal' ? 'active' : ''}`}
          onClick={() => onSpaceChange('personal')}
        >
          Personal OS
        </button>
        <button
          className={`nav-btn ${space === 'professional' ? 'active' : ''}`}
          onClick={() => onSpaceChange('professional')}
        >
          Professional
        </button>
        <button
          className={`nav-btn ${space === 'reward' ? 'active' : ''}`}
          onClick={() => onSpaceChange('reward')}
        >
          Rewards
        </button>
      </nav>

      <div className="header-right">
        <button
          className={`auth-btn ${isAuthenticated ? 'authenticated' : ''}`}
          onClick={() => setIsAuthenticated(!isAuthenticated)}
        >
          {isAuthenticated ? '🔐 Signed In' : '🔓 Sign In'}
        </button>
      </div>
    </header>
  );
}
```

**src/components/Footer.jsx**

```javascript
export default function Footer() {
  return (
    <footer className="footer">
      <p>Built as a living page for Mansi Gupta.</p>
      <a href="#/personal">Back home</a>
    </footer>
  );
}
```

**src/main.jsx** (No changes needed)

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

**package.json**

```json
{
  "name": "@mansilly/host",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@originjs/vite-plugin-federation": "^1.2.0",
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^5.0.0"
  }
}
```

---

## Phase 3: Create Personal OS Module

**Location**: `/apps/personal-os`

### vite.config.js (Federation Export)

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'personalOS',
      filename: 'remoteEntry.js',
      exposes: {
        './App': './src/App.jsx',
        './PersonalOS': './src/pages/PersonalOS.jsx',
        './IdeasTab': './src/tabs/IdeasTab.jsx',
        './TestingTab': './src/tabs/TestingTab.jsx',
        './FoodTab': './src/tabs/FoodTab.jsx',
        './LittleHumanTab': './src/tabs/LittleHumanTab.jsx',
        './AttentionTab': './src/tabs/AttentionTab.jsx',
      },
      shared: ['react', 'react-dom'],
    }),
  ],
  build: {
    modulePreload: false,
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
  },
  server: {
    port: 5174,
  },
});
```

### src/App.jsx (Module Entry Point)

```javascript
import { useContext } from 'react';
import { SpaceContext } from '../../../apps/host/src/contexts/SpaceContext';
import PersonalOS from './pages/PersonalOS';

export default function PersonalOSApp() {
  const { isAuthenticated } = useContext(SpaceContext);

  return (
    <div className="personal-os-module">
      <PersonalOS isAuthenticated={isAuthenticated} />
    </div>
  );
}
```

### Project Structure

```
apps/personal-os/
├── src/
│   ├── App.jsx                       # Module entry point
│   ├── main.jsx                      # Standalone dev entry
│   ├── pages/
│   │   └── PersonalOS.jsx            # Main page with tabs
│   ├── tabs/
│   │   ├── IdeasTab.jsx              # Ideas (WIP)
│   │   ├── TestingTab.jsx            # Testing/experiments
│   │   ├── FoodTab.jsx               # Food experiments
│   │   ├── LittleHumanTab.jsx        # Parenting insights
│   │   └── AttentionTab.jsx          # Current focus areas
│   ├── components/
│   │   ├── PersonalTabs.jsx          # Tab navigation
│   │   ├── PrivateContent.jsx        # Auth-gated wrapper
│   │   └── (reuse from host: PageHero, SectionHeading, etc.)
│   ├── data.js                       # Personal OS content
│   ├── styles.css
│   └── index.css
├── vite.config.js                    # Federation config
├── index.html
└── package.json
```

### src/pages/PersonalOS.jsx

```javascript
import { useState } from 'react';
import PersonalTabs from '../components/PersonalTabs';
import PageHero from '../../../apps/host/src/components/PageHero'; // Reuse from host
import { personalData } from '../data';

export default function PersonalOS({ isAuthenticated }) {
  const [activeTab, setActiveTab] = useState('ideas');

  return (
    <div className="personal-os-page">
      <PageHero
        title="Personal Operating System"
        copy="Your personal growth journey: ideas, experiments, food, parenting, and what has your attention."
        eyebrow="Personal Space"
      />

      <PersonalTabs activeTab={activeTab} onTabChange={setActiveTab}>
        {/* Tab content rendered here */}
      </PersonalTabs>
    </div>
  );
}
```

### src/components/PersonalTabs.jsx

```javascript
export default function PersonalTabs({ activeTab, onTabChange, children }) {
  const tabs = ['ideas', 'testing', 'food', 'little-human', 'attention'];

  return (
    <div className="personal-tabs">
      <div className="tab-buttons">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => onTabChange(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {/* Render active tab content */}
        {children}
      </div>
    </div>
  );
}
```

### src/data.js

**Move relevant data from main app**:

```javascript
export const personalData = {
  ideas: [
    ["Little human", "Most of my time goes into raising, observing, and gently shaping her thoughts and everyday world."],
    ["Food", "Trying nourishing recipes that are practical, flavorful, and easy to repeat."],
    // ... interests
  ],
  testing: [
    ["Movement", "Walks, mobility, light strength"],
    ["Nutrition", "Protein, fiber, hydration"],
    // ... health habits
  ],
  food: [
    ["High-protein breakfast bowl", "A weekday experiment for steady energy and simple prep."],
    // ... recipes
  ],
  littleHuman: {
    lessons: [
      // ... littleHumanLessons
    ],
    rhythms: [
      // ... littleHumanRhythms
    ],
    questions: [
      // ... littleHumanQuestions
    ],
  },
  attention: [
    // ... experiences/focus areas
  ],
  private: {
    draftIdeas: [],
    reflections: [],
  },
};
```

### package.json

```json
{
  "name": "@mansilly/personal-os",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@originjs/vite-plugin-federation": "^1.2.0",
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^5.0.0"
  }
}
```

---

## Phase 4: Create Professional Module

**Location**: `/apps/professional`

**Same structure as Personal OS**, but:

### src/App.jsx

```javascript
import Professional from './pages/Professional';

export default function ProfessionalApp() {
  return <Professional />;
}
```

### src/pages/Professional.jsx

```javascript
import { useState } from 'react';
import ProfessionalHome from './ProfessionalHome';
import ProfessionalResume from './ProfessionalResume';

export default function Professional() {
  const [page, setPage] = useState('home'); // 'home' | 'resume'

  return (
    <div className="professional-module">
      {page === 'home' && <ProfessionalHome onViewResume={() => setPage('resume')} />}
      {page === 'resume' && <ProfessionalResume onBack={() => setPage('home')} />}
    </div>
  );
}
```

### src/pages/ProfessionalHome.jsx

```javascript
import PageHero from '../../../apps/host/src/components/PageHero';
import { professionalData } from '../data';

export default function ProfessionalHome({ onViewResume }) {
  return (
    <div className="professional-home">
      <PageHero
        title="Professional Profile"
        copy="Frontend architect, React specialist, team leader"
        eyebrow="Professional"
      />

      <section className="social-links">
        <h2>Connect</h2>
        {professionalData.socials.map((social) => (
          <a key={social.name} href={social.url} target="_blank" rel="noopener noreferrer">
            {social.name}
          </a>
        ))}
      </section>

      <button onClick={onViewResume}>View Full Resume</button>
    </div>
  );
}
```

### src/pages/ProfessionalResume.jsx

**Refactor from current ResumePage.jsx** to work as module.

### src/data.js

```javascript
export const professionalData = {
  socials: [
    { name: 'LinkedIn', url: 'https://linkedin.com/in/mansisce', icon: 'linkedin' },
    { name: 'Twitter', url: 'https://twitter.com/mansisce', icon: 'twitter' },
  ],
  intro: 'Frontend architect with 15+ years of experience...',
  skills: resumeSkills,      // From original data.js
  experience: resumeExperience,
  education: resumeEducation,
};
```

### vite.config.js

```javascript
export default defineConfig({
  plugins: [
    federation({
      name: 'professional',
      filename: 'remoteEntry.js',
      exposes: {
        './App': './src/App.jsx',
        './ProfessionalHome': './src/pages/ProfessionalHome.jsx',
        './ProfessionalResume': './src/pages/ProfessionalResume.jsx',
      },
      shared: ['react', 'react-dom'],
    }),
  ],
  server: {
    port: 5175,
  },
});
```

---

## Phase 5: Shared Components (Optional)

**Location**: `/packages/shared-ui`

For reusable components across modules:

### src/components/index.js

```javascript
export { default as PageHero } from './PageHero';
export { default as SectionHeading } from './SectionHeading';
export { default as ScrollButton } from './ScrollButton';
export { default as Header } from './Header';
```

### package.json

```json
{
  "name": "@mansilly/shared-ui",
  "version": "1.0.0",
  "exports": {
    ".": "./src/components/index.js"
  }
}
```

### Import in modules

```javascript
import { PageHero, SectionHeading } from '@mansilly/shared-ui';
```

---

## Phase 6: Local Development & Testing

### Run All Apps Locally

```bash
# Terminal 1: Host app
cd apps/host
pnpm dev          # Port 5173

# Terminal 2: Personal OS
cd apps/personal-os
pnpm dev          # Port 5174

# Terminal 3: Professional
cd apps/professional
pnpm dev          # Port 5175

# Terminal 4: Reward System (if ready)
cd apps/reward-system
npm run dev       # Port 3000
```

### Update Federation Remotes for Local Dev

**apps/host/vite.config.js**:
```javascript
remotes: {
  personalOS: 'http://localhost:5174/remoteEntry.js',
  professional: 'http://localhost:5175/remoteEntry.js',
  rewardSystem: 'http://localhost:3000/remoteEntry.js',
},
```

### Test Federation Loading

1. Open http://localhost:5173
2. Toggle between "Personal OS", "Professional", "Rewards"
3. Verify modules load dynamically
4. Check browser console for errors
5. Verify auth state syncs across modules

---

## Phase 7: Deployment

### Build Each Module

```bash
pnpm -r build      # Builds all apps in parallel
```

### Deploy to Vercel

Each app deployed separately:

```bash
# Host app
cd apps/host
vercel deploy --prod

# Personal OS module
cd apps/personal-os
vercel deploy --prod

# Professional module
cd apps/professional
vercel deploy --prod

# Reward system
cd apps/reward-system
vercel deploy --prod
```

### Update Host App with Production URLs

**apps/host/vite.config.js**:
```javascript
remotes: {
  personalOS: 'https://personal-os-YOUR-ORG.vercel.app/remoteEntry.js',
  professional: 'https://professional-YOUR-ORG.vercel.app/remoteEntry.js',
  rewardSystem: 'https://reward-system-YOUR-ORG.vercel.app/remoteEntry.js',
},
```

---

## Migration Checklist

### Phase 1: Monorepo Setup
- [ ] Install pnpm
- [ ] Create pnpm-workspace.yaml
- [ ] Create root package.json
- [ ] Create directory structure
- [ ] Move current code to /apps/host

### Phase 2: Host App
- [ ] Update vite.config.js with federation
- [ ] Create SpaceContext
- [ ] Refactor App.jsx for module loading
- [ ] Update Header with space toggle
- [ ] Test module loading (use dummy components)

### Phase 3: Personal OS Module
- [ ] Create /apps/personal-os directory
- [ ] Set up vite.config.js (federation export)
- [ ] Create App.jsx (module entry)
- [ ] Create PersonalOS.jsx (main page)
- [ ] Create 5 tab components
- [ ] Migrate data.js
- [ ] Import reusable components from host

### Phase 4: Professional Module
- [ ] Create /apps/professional directory
- [ ] Set up vite.config.js
- [ ] Create App.jsx
- [ ] Create ProfessionalHome.jsx
- [ ] Refactor ProfessionalResume.jsx
- [ ] Migrate data.js

### Phase 5: Testing
- [ ] Run all apps locally
- [ ] Test space toggle
- [ ] Test module federation loading
- [ ] Test auth state syncing
- [ ] Test responsive design

### Phase 6: Deployment
- [ ] Deploy host app
- [ ] Deploy personal-os module
- [ ] Deploy professional module
- [ ] Update federation remotes in host
- [ ] Verify production federation loading

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Module fails to load | Check remoteEntry.js URL; verify CORS; check console errors |
| Style conflicts between modules | Use CSS modules or scoped styles (BEM naming) |
| React version mismatch | Lock React version in shared federation config |
| Context not accessible in module | Wrap module with context provider in host app |
| Module takes long to load | Lazy load modules; use code splitting; pre-load remoteEntry.js |
| Auth state not syncing | Pass auth via context; modules consume SpaceContext |

---

## Timeline Estimate

- **Week 1**: Monorepo + Host App setup + testing framework
- **Week 2**: Personal OS module extraction + testing
- **Week 2-3**: Professional module extraction + testing
- **Week 3**: Integration testing + deployment to staging
- **Week 4**: Production deployment + monitoring

**Parallel to above**: Reward system development (separate effort)
