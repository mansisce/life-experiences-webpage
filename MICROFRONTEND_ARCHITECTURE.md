# Mansilly Microfrontend Architecture with Module Federation

## Overview

Mansilly is transitioning to a **Module Federation** architecture where:
- **Host App** (React/Vite): Main dashboard, navigation, auth context
- **Federated Modules**: Independent apps/packages loaded at runtime
  - `@mansilly/reward-system` (Next.js) — Task + Reward CRUD + LLM categorization
  - `@mansilly/personal-os` (React) — Personal Operating System (5 tabs)
  - `@mansilly/professional` (React) — Professional resume + social links
  - Future: `@mansilly/learning-hub` (React) — React Lab, AI Learning pages

### Architecture Diagram
```
mansilly.vercel.app (Host App - React/Vite)
├── Shell/Layout (Header, Navigation, Footer)
├── Auth Context (SpaceContext, User Auth)
├── Router (handles #/reward, #/personal, #/professional)
│
├── [Remote Module 1] reward-system.vercel.app (Next.js)
│   ├── Task CRUD API
│   ├── Reward CRUD API
│   ├── LLM Categorization Service
│   └── UI: Task List, Reward Manager, Dashboard
│
├── [Remote Module 2] personal-os.mansilly.vercel.app (React)
│   ├── 5 Tabs: Ideas, Testing, Food, Little Human, Attention
│   └── Private Content (auth-gated)
│
└── [Remote Module 3] professional.mansilly.vercel.app (React)
    ├── Homepage (social links)
    └── Resume Page
```

---

## Module Federation Setup

### Host App (mansilly - React/Vite)

**Package**: `@mansilly/host`
**Framework**: React 19 + Vite
**Port**: 5173 (dev) | vercel.com (prod)

**Federation Config** (vite.config.js):
```javascript
import federation from '@originjs/vite-plugin-federation';

export default {
  plugins: [
    federation({
      name: 'host',
      remotes: {
        rewardSystem: 'https://reward-system.vercel.app/remoteEntry.js',
        personalOS: 'https://personal-os.mansilly.vercel.app/remoteEntry.js',
        professional: 'https://professional.mansilly.vercel.app/remoteEntry.js',
      },
      shared: ['react', 'react-dom'],
    })
  ]
};
```

**Host App Structure**:
```
src/
├── main.jsx                          # Entry
├── App.jsx                           # Router + Shell
├── contexts/
│   ├── SpaceContext.jsx              # Global space state
│   └── AuthContext.jsx               # Global auth state
├── components/
│   ├── Header.jsx                    # Nav + Space Toggle + Auth
│   └── Footer.jsx
├── layouts/
│   └── Shell.jsx                     # Main layout wrapper
├── pages/
│   ├── DashboardPage.jsx             # Home page
│   └── NotFoundPage.jsx              # 404
├── hooks/
│   ├── useRemoteModule.js            # Hook to load federated modules
│   └── useAuth.js
└── styles.css
```

**Module Loading Hook** (useRemoteModule):
```javascript
export const useRemoteModule = (moduleName) => {
  const [Module, setModule] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadModule = async () => {
      try {
        const container = document.createElement('div');
        container.id = `${moduleName}-container`;
        
        // Dynamic import federated module
        const moduleFactory = await import(`${moduleName}/App`);
        const Module = moduleFactory.default;
        setModule(Module);
      } catch (err) {
        setError(err);
        console.error(`Failed to load ${moduleName}:`, err);
      }
    };
    
    loadModule();
  }, [moduleName]);

  return { Module, error };
};
```

**Host App Router** (App.jsx):
```javascript
import { useRemoteModule } from './hooks/useRemoteModule';

function App() {
  const [space, setSpace] = useState('personal');
  const { Module: RewardSystem } = useRemoteModule('rewardSystem');
  const { Module: PersonalOS } = useRemoteModule('personalOS');
  const { Module: Professional } = useRemoteModule('professional');

  return (
    <SpaceContext.Provider value={{ space, setSpace, isAuthenticated }}>
      <Header space={space} onSpaceChange={setSpace} />
      
      {space === 'reward' && RewardSystem && <RewardSystem />}
      {space === 'personal' && PersonalOS && <PersonalOS />}
      {space === 'professional' && Professional && <Professional />}
      
      <Footer />
    </SpaceContext.Provider>
  );
}
```

---

## Module 1: Reward System (Next.js - Priority Build)

**Package**: `@mansilly/reward-system`
**Framework**: Next.js (App Router)
**Deployment**: reward-system.vercel.app (independent deployment)
**Purpose**: Task CRUD, Reward CRUD, LLM categorization, dashboard

### Database Schema

```sql
-- Tasks Table
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  startDate TIMESTAMP,
  endDate TIMESTAMP,
  silent BOOLEAN DEFAULT FALSE,      -- Don't show notifications
  isMilestone BOOLEAN DEFAULT FALSE,  -- Mark as important
  reward_id UUID REFERENCES rewards(id),
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP
);

-- Rewards Table
CREATE TABLE rewards (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  awardDate TIMESTAMP,
  silent BOOLEAN DEFAULT FALSE,      -- Don't show notifications
  announce BOOLEAN DEFAULT TRUE,      -- Show celebration
  points INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP
);

-- Reward History (audit trail)
CREATE TABLE rewardHistory (
  id UUID PRIMARY KEY,
  taskId UUID REFERENCES tasks(id),
  rewardId UUID REFERENCES rewards(id),
  assignedAt TIMESTAMP,
  reason TEXT                         -- LLM categorization reason
);
```

### API Routes (Next.js)

```
/api/tasks
  GET /                    # List all tasks
  POST /                   # Create task
  GET /:id                 # Get task
  PUT /:id                 # Update task
  DELETE /:id              # Delete task

/api/rewards
  GET /                    # List all rewards
  POST /                   # Create reward
  GET /:id                 # Get reward
  PUT /:id                 # Update reward
  DELETE /:id              # Delete reward

/api/categorize
  POST /                   # LLM categorize tasks + assign rewards
  # Input: { tasks: [Task], rewards: [Reward] }
  # Output: { assignments: [{ taskId, rewardId, reason }] }

/api/dashboard
  GET /                    # Dashboard summary (tasks, rewards, stats)
```

### Reward System UI Components

```
app/
├── page.jsx                           # Dashboard
├── tasks/
│   ├── page.jsx                       # Task list
│   ├── new/page.jsx                   # New task form
│   └── [id]/edit/page.jsx             # Edit task
├── rewards/
│   ├── page.jsx                       # Reward list
│   ├── new/page.jsx                   # New reward form
│   └── [id]/edit/page.jsx             # Edit reward
├── categorize/
│   └── page.jsx                       # Categorization UI (run LLM)
├── components/
│   ├── TaskForm.jsx
│   ├── TaskCard.jsx
│   ├── RewardForm.jsx
│   ├── RewardCard.jsx
│   ├── DashboardStats.jsx
│   └── CategorizeButton.jsx
└── lib/
    ├── api.js                         # API client
    └── llm.js                         # LLM service (Claude API)
```

### LLM Categorization Flow

```javascript
// lib/llm.js
import Anthropic from '@anthropic-ai/sdk';

export async function categorizeTasks(tasks, rewards) {
  const client = new Anthropic();
  
  const prompt = `
Given these tasks:
${JSON.stringify(tasks, null, 2)}

And these available rewards:
${JSON.stringify(rewards, null, 2)}

Categorize each task and assign the most appropriate reward based on:
1. Task difficulty/scope
2. Reward value/significance
3. Task duration
4. Milestone status

Return JSON array: [{ taskId, rewardId, reason }]
  `;

  const message = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  return JSON.parse(message.content[0].text);
}
```

### Federated Module Export (next.config.js)

```javascript
const { NextFederationPlugin } = require('@module-federation/nextjs-mf');

module.exports = {
  webpack(config, options) {
    config.plugins.push(
      new NextFederationPlugin({
        name: 'reward_system',
        filename: 'static/chunks/remoteEntry.js',
        
        exposes: {
          './App': './app/page.jsx',
          './TaskCRUD': './app/tasks/page.jsx',
          './RewardCRUD': './app/rewards/page.jsx',
          './Categorize': './app/categorize/page.jsx',
          './Dashboard': './app/components/DashboardStats.jsx',
        },
        
        shared: ['react', 'react-dom', 'next'],
      })
    );

    return config;
  },
};
```

---

## Module 2: Personal OS (React - Refactor Branch)

**Package**: `@mansilly/personal-os`
**Framework**: React 19 + Vite
**Deployment**: personal-os.mansilly.vercel.app (independent deployment)
**Purpose**: 5-tab Personal OS (Ideas, Testing, Food, Little Human, Attention)

### Vite Federation Config

```javascript
// vite.config.js
import federation from '@originjs/vite-plugin-federation';

export default {
  plugins: [
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
    })
  ]
};
```

### Structure (Same as original plan, but as independent module)

```
src/
├── App.jsx                           # Module entry point
├── pages/PersonalOS.jsx              # Main personal OS page
├── tabs/
│   ├── IdeasTab.jsx
│   ├── TestingTab.jsx
│   ├── FoodTab.jsx
│   ├── LittleHumanTab.jsx
│   └── AttentionTab.jsx
├── components/
│   └── PersonalTabs.jsx
└── data.js
```

---

## Module 3: Professional (React - Refactor Branch)

**Package**: `@mansilly/professional`
**Framework**: React 19 + Vite
**Deployment**: professional.mansilly.vercel.app (independent deployment)
**Purpose**: Professional homepage + resume

### Vite Federation Config

```javascript
export default {
  plugins: [
    federation({
      name: 'professional',
      filename: 'remoteEntry.js',
      exposes: {
        './App': './src/App.jsx',
        './ProfessionalHome': './src/pages/ProfessionalHome.jsx',
        './Resume': './src/pages/ProfessionalResume.jsx',
      },
      shared: ['react', 'react-dom'],
    })
  ]
};
```

---

## Parallel Development Strategy

### Branch 1: `feature/reward-system` (Next.js)
- Create new Next.js app in `/apps/reward-system`
- Build Task CRUD, Reward CRUD
- Implement LLM categorization
- Deploy independently
- **Timeline**: 2-3 weeks

### Branch 2: `feature/refactor-modules` (React)
- Refactor existing code into modules:
  - `/apps/personal-os` (extract Personal OS)
  - `/apps/professional` (extract Professional)
- Set up Vite federation
- Test module loading locally
- Deploy modules
- **Timeline**: 2-3 weeks

### Branch 3: `main` (Host App)
- Upgrade to Module Federation
- Add remote module loading
- Update Header/Navigation
- Test federated module imports
- **Timeline**: 1 week (after other branches ready)

### Merge Strategy
```
main (host app)
  ← reward-system branch (complete)
  ← refactor-modules branch (complete)
  ← integration tests & deploy
```

---

## Local Development Setup

### Run Host + All Modules Locally

```bash
# Terminal 1: Host App (React/Vite)
cd mansilly
npm run dev          # Port 5173

# Terminal 2: Reward System (Next.js)
cd apps/reward-system
npm run dev          # Port 3000

# Terminal 3: Personal OS (React)
cd apps/personal-os
npm run dev          # Port 5174

# Terminal 4: Professional (React)
cd apps/professional
npm run dev          # Port 5175
```

**vite.config.js remotes update for local dev**:
```javascript
remotes: {
  rewardSystem: 'http://localhost:3000/remoteEntry.js',
  personalOS: 'http://localhost:5174/remoteEntry.js',
  professional: 'http://localhost:5175/remoteEntry.js',
},
```

---

## Deployment Strategy

### Staging
1. Deploy each module to Vercel (separate projects)
2. Update host app remotes to staging URLs
3. Deploy host app
4. Test end-to-end

### Production
1. Tag stable releases for each module
2. Deploy modules to production Vercel projects
3. Update host app with production URLs
4. Deploy host app
5. Monitor module loads in browser

---

## Directory Structure (Monorepo)

```
mansilly/
├── apps/
│   ├── host/                          # Main React app (Vite)
│   │   ├── src/
│   │   ├── vite.config.js            # Federation config
│   │   └── package.json
│   │
│   ├── reward-system/                 # Next.js app
│   │   ├── app/
│   │   ├── next.config.js            # Federation config
│   │   └── package.json
│   │
│   ├── personal-os/                   # React module (Vite)
│   │   ├── src/
│   │   ├── vite.config.js            # Federation config
│   │   └── package.json
│   │
│   └── professional/                  # React module (Vite)
│       ├── src/
│       ├── vite.config.js            # Federation config
│       └── package.json
│
├── packages/                          # Shared code
│   ├── shared-ui/                     # Shared components
│   ├── shared-hooks/                  # Shared hooks
│   └── shared-types/                  # TypeScript types
│
├── package.json                       # Root (workspaces)
├── pnpm-workspace.yaml               # Or yarn workspaces
└── turbo.json                        # Turbo build orchestration (optional)
```

---

## Shared Packages (Optional - For Code Reuse)

**packages/shared-ui/src/components.js**:
```javascript
export { PageHero } from './PageHero';
export { SectionHeading } from './SectionHeading';
export { Header } from './Header';
export { ScrollButton } from './ScrollButton';
```

**Each module imports**:
```javascript
import { PageHero, SectionHeading } from '@mansilly/shared-ui';
```

---

## Next Steps

1. **Immediate**: Decide on monorepo tool (pnpm workspaces, Yarn, Lerna)
2. **Week 1**: Set up monorepo structure + reward system Next.js app
3. **Week 2-3**: Build reward system CRUD + LLM integration
4. **Week 2-3 (Parallel)**: Refactor existing code to React modules
5. **Week 4**: Integrate all modules + deploy

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Federated modules fail to load | Add error boundaries; fallback UI; local dev testing |
| Version conflicts (React, dependencies) | Lock shared versions in federation config; test compatibility |
| Network latency loading remotes | Cache remoteEntry.js; service workers; CDN |
| Auth context not shared | Pass auth via context provider in host; modules consume context |
| Data sharing between modules | Use centralized API; host app manages state; modules call APIs |

---

## Testing Strategy

- **Unit tests** in each module (Jest)
- **Integration tests** in host app (Vitest)
- **E2E tests** (Playwright) for full module federation flow
- **Module load tests** (verify remoteEntry.js loads correctly)
