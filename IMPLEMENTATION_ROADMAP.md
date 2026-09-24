# Mansilly Implementation Roadmap: Microfrontends + Reward System

## 📋 Overview

You're transitioning from a single React app to a **modular microfrontend architecture** with:
- **Host App** (React/Vite) — Main dashboard, navigation, context
- **Reward System** (Next.js) — Task + Reward CRUD + LLM categorization
- **Personal OS** (React) — 5-tab Personal Operating System
- **Professional** (React) — Professional resume + social links
- **Module Federation** (Webpack) — Runtime module loading

**Two parallel tracks**:
1. ✅ **Reward System** (new feature, Next.js)
2. ✅ **Existing Code Refactor** (to federated modules, React)

---

## 📚 Documents Created

### 1. **MICROFRONTEND_ARCHITECTURE.md**
High-level architecture design for the entire system.

**Read this to understand**:
- Overall system architecture
- Module Federation setup
- Monorepo structure
- Local dev setup
- Deployment strategy
- Parallel development workflow

### 2. **REWARD_SYSTEM_PROMPT.md**
Complete implementation guide for the Next.js reward system.

**Use this to build**:
- Task CRUD API (GET, POST, PUT, DELETE)
- Reward CRUD API
- LLM categorization with Claude
- UI components (forms, cards, dashboard)
- Database schema (Supabase/MongoDB)
- Module Federation export

### 3. **REFACTOR_TO_MODULES_PROMPT.md**
Step-by-step guide to convert existing code to modules.

**Use this to refactor**:
- Set up monorepo (pnpm workspaces)
- Create host app with federation
- Extract Personal OS to module
- Extract Professional to module
- Test federation locally
- Deploy to Vercel

---

## 🚀 Getting Started

### Step 0: Choose Your Starting Point

**Option A: Build Reward System First** (Recommended)
- Start reward system development immediately
- Refactor existing code in parallel
- Merge when both complete

**Option B: Refactor First, Then Add Rewards**
- Set up monorepo + modules first
- Deploy modular architecture to production
- Build reward system as new module

**Recommendation**: **Option A** — You get both features faster with parallel work.

---

### Step 1: Quick Setup (Day 1)

```bash
# Install pnpm globally (for monorepo)
npm install -g pnpm

# Create monorepo structure
mkdir -p apps/host apps/personal-os apps/professional apps/reward-system packages/shared-ui

# Move current code to host
cp -r src apps/host/
cp vite.config.js apps/host/
cp package.json apps/host/

# Update root package.json with workspaces
# See REFACTOR_TO_MODULES_PROMPT.md for example
```

### Step 2: Start Development (Day 2-7)

#### **Track A: Reward System (Next.js)**
```bash
cd apps/reward-system

# Create Next.js app
npx create-next-app@latest . --typescript

# Follow REWARD_SYSTEM_PROMPT.md:
# 1. Set up database (Supabase or MongoDB)
# 2. Implement Task CRUD APIs
# 3. Implement Reward CRUD APIs
# 4. Implement LLM categorization
# 5. Build UI components
# 6. Export via Module Federation
```

#### **Track B: Module Refactor (React)**
```bash
cd apps/host

# Follow REFACTOR_TO_MODULES_PROMPT.md Phase 2:
# 1. Update vite.config.js with federation
# 2. Create SpaceContext
# 3. Update App.jsx for module loading
# 4. Update Header with space toggle

# Then extract Personal OS & Professional modules
```

### Step 3: Local Testing (Week 2)

Run all apps in parallel:
```bash
# Terminal 1: Host (5173)
cd apps/host && pnpm dev

# Terminal 2: Personal OS (5174)
cd apps/personal-os && pnpm dev

# Terminal 3: Professional (5175)
cd apps/professional && pnpm dev

# Terminal 4: Reward System (3000)
cd apps/reward-system && npm run dev

# Open http://localhost:5173 and test module loading
```

### Step 4: Deploy (Week 3-4)

Each app deployed independently:
```bash
# Deploy each to Vercel
cd apps/host && vercel deploy --prod
cd apps/personal-os && vercel deploy --prod
cd apps/professional && vercel deploy --prod
cd apps/reward-system && vercel deploy --prod

# Update host app remotes with production URLs
```

---

## 📊 Work Breakdown

### Phase A: Reward System (Next.js)

| Phase | Task | Time | Status |
|-------|------|------|--------|
| 1 | Create Next.js app + set up database | 1 day | ⏳ TODO |
| 2 | Task CRUD API | 2 days | ⏳ TODO |
| 3 | Reward CRUD API | 2 days | ⏳ TODO |
| 4 | LLM categorization API | 2 days | ⏳ TODO |
| 5 | UI components (forms, lists, dashboard) | 3 days | ⏳ TODO |
| 6 | Module Federation export + local testing | 1 day | ⏳ TODO |
| 7 | Deploy to Vercel + verify federation | 1 day | ⏳ TODO |
| **Total** | | **12 days** | |

### Phase B: Module Refactor (React)

| Phase | Task | Time | Status |
|-------|------|------|--------|
| 1 | Monorepo setup (pnpm, workspaces) | 1 day | ⏳ TODO |
| 2 | Host app federation config | 1 day | ⏳ TODO |
| 3 | Extract Personal OS to module | 2 days | ⏳ TODO |
| 4 | Extract Professional to module | 2 days | ⏳ TODO |
| 5 | Local federation testing | 1 day | ⏳ TODO |
| 6 | Deploy modules to Vercel | 1 day | ⏳ TODO |
| 7 | Update host with production URLs | 0.5 days | ⏳ TODO |
| **Total** | | **8.5 days** | |

### Phase C: Integration & Production

| Task | Time | Status |
|------|------|--------|
| E2E testing (all modules loaded) | 1 day | ⏳ TODO |
| Performance monitoring | 0.5 days | ⏳ TODO |
| Documentation | 0.5 days | ⏳ TODO |
| **Total** | **2 days** | |

**Total Duration**: ~4 weeks (parallel tracks)

---

## 🎯 Success Criteria

### Reward System MVP ✅
- [ ] Task creation, read, update, delete working
- [ ] Reward creation, read, update, delete working
- [ ] LLM categorization assigns tasks to rewards
- [ ] Dashboard shows task/reward summary
- [ ] All routes export via remoteEntry.js
- [ ] Loads successfully in host app

### Module Refactor ✅
- [ ] Monorepo created with pnpm workspaces
- [ ] Host app loads personal-os module dynamically
- [ ] Host app loads professional module dynamically
- [ ] Space toggle in header switches modules
- [ ] Auth state synced across modules
- [ ] All deployed to Vercel independently
- [ ] Production federation loading works

### Integration ✅
- [ ] Host app loads all 3 modules (Personal OS, Professional, Reward System)
- [ ] Space toggle works across all modules
- [ ] Auth context shared correctly
- [ ] No console errors
- [ ] Responsive on mobile/tablet/desktop

---

## 📁 Final Directory Structure

```
mansilly/
├── apps/
│   ├── host/                          # React/Vite host app
│   │   ├── src/
│   │   │   ├── App.jsx
│   │   │   ├── contexts/SpaceContext.jsx
│   │   │   ├── components/
│   │   │   │   ├── Header.jsx
│   │   │   │   └── Footer.jsx
│   │   │   └── styles.css
│   │   ├── vite.config.js             # Federation config
│   │   └── package.json
│   │
│   ├── personal-os/                   # React/Vite module
│   │   ├── src/
│   │   │   ├── App.jsx
│   │   │   ├── pages/PersonalOS.jsx
│   │   │   ├── tabs/
│   │   │   │   ├── IdeasTab.jsx
│   │   │   │   ├── TestingTab.jsx
│   │   │   │   ├── FoodTab.jsx
│   │   │   │   ├── LittleHumanTab.jsx
│   │   │   │   └── AttentionTab.jsx
│   │   │   ├── data.js
│   │   │   └── styles.css
│   │   ├── vite.config.js
│   │   └── package.json
│   │
│   ├── professional/                  # React/Vite module
│   │   ├── src/
│   │   │   ├── App.jsx
│   │   │   ├── pages/
│   │   │   │   ├── ProfessionalHome.jsx
│   │   │   │   └── ProfessionalResume.jsx
│   │   │   ├── data.js
│   │   │   └── styles.css
│   │   ├── vite.config.js
│   │   └── package.json
│   │
│   └── reward-system/                 # Next.js module
│       ├── app/
│       │   ├── page.jsx               # Dashboard
│       │   ├── tasks/
│       │   │   ├── page.jsx           # Task list
│       │   │   ├── new/page.jsx
│       │   │   └── [id]/edit/page.jsx
│       │   ├── rewards/
│       │   │   ├── page.jsx           # Reward list
│       │   │   ├── new/page.jsx
│       │   │   └── [id]/edit/page.jsx
│       │   ├── categorize/page.jsx
│       │   ├── api/
│       │   │   ├── tasks/route.js
│       │   │   ├── rewards/route.js
│       │   │   ├── categorize/route.js
│       │   │   └── dashboard/route.js
│       │   └── components/
│       │       ├── TaskForm.jsx
│       │       ├── TaskCard.jsx
│       │       ├── RewardForm.jsx
│       │       ├── RewardCard.jsx
│       │       ├── DashboardStats.jsx
│       │       └── CategorizeButton.jsx
│       ├── next.config.js
│       └── package.json
│
├── packages/
│   └── shared-ui/
│       ├── src/components/
│       │   ├── PageHero.jsx
│       │   ├── SectionHeading.jsx
│       │   ├── ScrollButton.jsx
│       │   └── index.js
│       └── package.json
│
├── pnpm-workspace.yaml
├── package.json                       # Root (workspaces)
├── MICROFRONTEND_ARCHITECTURE.md      # Architecture reference
├── REWARD_SYSTEM_PROMPT.md            # Reward system guide
└── REFACTOR_TO_MODULES_PROMPT.md      # Module refactor guide
```

---

## 🔗 Quick Navigation

### For Building the Reward System
→ **Open**: `REWARD_SYSTEM_PROMPT.md`
- Task/Reward entities
- API routes
- UI components
- Database setup
- LLM integration
- Module Federation export

### For Refactoring to Modules
→ **Open**: `REFACTOR_TO_MODULES_PROMPT.md`
- Monorepo setup
- Host app configuration
- Personal OS extraction
- Professional extraction
- Local testing
- Deployment

### For Architecture Understanding
→ **Open**: `MICROFRONTEND_ARCHITECTURE.md`
- System overview
- Module Federation setup
- Directory structure
- Parallel development strategy
- Deployment strategy
- Risk mitigation

---

## 💡 Key Decisions Made

1. **Module Federation (Webpack)** — Runtime module loading at vercel.com (not separate deployments)
2. **Parallel Development** — Reward system + refactor both in progress
3. **Standalone Apps** — Each module deployed to separate Vercel project
4. **Monorepo (pnpm)** — Unified workspace for all apps + shared packages
5. **Next.js for Reward System** — Needed for API routes, LLM integration
6. **React for Personal OS & Professional** — Leverage existing code, lighter weight

---

## ⚠️ Important Notes

### Before You Start
1. **Read MICROFRONTEND_ARCHITECTURE.md first** for the big picture
2. Choose which track to start with (Reward System or Refactor)
3. Set up pnpm (monorepo tool)
4. Plan your Vercel projects (3-4 separate projects for modules)

### During Development
1. Run all apps locally for federation testing
2. Test module loading in browser DevTools
3. Check for CORS issues with remote entry.js
4. Lock React version in shared federation config

### Before Production
1. Test all modules load from production URLs
2. Verify auth state syncs correctly
3. Test on real devices (mobile, tablet)
4. Monitor module load performance in lighthouse

---

## 🆘 Need Help?

If stuck, check:
1. **Module won't load?** → Check vite.config.js federation config
2. **Auth not syncing?** → Verify SpaceContext wraps modules in host
3. **Style conflicts?** → Use CSS modules or BEM naming
4. **API errors in reward system?** → Check Supabase/MongoDB connection

---

## 🎉 Next Step

1. Choose your starting track: **Reward System** or **Module Refactor**
2. Read the corresponding prompt file
3. Begin Phase 1
4. Let me know when you're ready to code!

**Ready to start?** Reply with which track you want to begin with, and I'll help you set up the first phase.
