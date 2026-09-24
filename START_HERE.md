# 🚀 Mansilly Microfrontend - START HERE

## ✅ Setup Complete!

Your monorepo is fully scaffolded with:
- ✅ **Host App** (React/Vite) - Port 5173
- ✅ **Personal OS** (React module) - Port 5174  
- ✅ **Professional** (React module) - Port 5175
- ✅ **Reward System** (Next.js) - Port 3000

---

## 🎯 Quick Start (Choose Your Next Step)

### Option 1: Install Dependencies & Run All

```bash
# Install pnpm globally (if not already installed)
npm install -g pnpm

# Install all dependencies
pnpm install

# Run all apps in parallel
pnpm dev
```

This will start:
- http://localhost:5173 — Host app (main entry point)
- http://localhost:5174 — Personal OS module
- http://localhost:5175 — Professional module
- http://localhost:3000 — Reward system

### Option 2: Run Individual Apps (4 Terminal Windows)

**Terminal 1 - Host App:**
```bash
cd apps/host
pnpm install
pnpm dev
```

**Terminal 2 - Personal OS Module:**
```bash
cd apps/personal-os
pnpm install
pnpm dev
```

**Terminal 3 - Professional Module:**
```bash
cd apps/professional
pnpm install
pnpm dev
```

**Terminal 4 - Reward System (Next.js):**
```bash
cd apps/reward-system
npm install
npm run dev
```

---

## 🌐 Access Points

1. **Main Host App**: http://localhost:5173
   - Click "Personal OS", "Professional", "Rewards" buttons in header
   - Modules load dynamically via Module Federation
   - Toggle auth with "Sign In" button

2. **Reward System Dashboard**: http://localhost:3000
   - Create tasks, rewards
   - Use AI categorization (requires ANTHROPIC_API_KEY)
   - Task/Reward CRUD operations

---

## ⚙️ Configuration

### Add Your Anthropic API Key

**For LLM categorization to work**, set your API key:

1. Open `apps/reward-system/.env.local`
2. Replace `your-api-key-here` with your actual Anthropic key:
   ```
   ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### Database (Optional for MVP)

MVP uses in-memory storage. For persistence, add:
- **Supabase**: Update `.env.local` with Supabase credentials
- **MongoDB**: Update `.env.local` with MongoDB URI

---

## 📁 Project Structure

```
mansilly/
├── apps/
│   ├── host/                    → Main React app (Port 5173)
│   ├── personal-os/             → Personal OS module (Port 5174)
│   ├── professional/            → Professional module (Port 5175)
│   └── reward-system/           → Next.js reward system (Port 3000)
├── packages/
│   └── shared-ui/               → Shared components (optional)
├── pnpm-workspace.yaml          → Monorepo config
└── START_HERE.md               → This file
```

---

## 🔗 Module Federation

When you open http://localhost:5173:

1. **Host app** runs at port 5173
2. **Clicks** "Personal OS" → Host app loads `personalOS/App` from port 5174 via Module Federation
3. **Clicks** "Professional" → Host app loads `professional/App` from port 5175
4. **Clicks** "Rewards" → Host app loads `rewardSystem/App` from port 3000

All modules are loaded at runtime — no need to rebuild the host app when modules change!

---

## 🧪 Test Module Loading

**In browser console** (open DevTools, go to Network tab):

1. Go to http://localhost:5173
2. Click "Rewards" button
3. Watch the Network tab → look for `remoteEntry.js` loaded from port 3000
4. The Reward System page should load

If it fails, check:
- ✅ All 4 apps are running (check each localhost:PORT)
- ✅ CORS is not blocked
- ✅ Browser console for errors

---

## 🎬 Next: Customize Your Modules

### Track A: Build Reward System
→ Follow `REWARD_SYSTEM_PROMPT.md`

**Current Status**: MVP complete with:
- ✅ Task CRUD (create, list, edit, delete)
- ✅ Reward CRUD
- ✅ LLM categorization API (needs real database)
- ✅ UI pages

**Next**: Connect real database (Supabase/MongoDB) for persistence

### Track B: Build Personal OS
→ Follow `REFACTOR_TO_MODULES_PROMPT.md`

**Current Status**: Skeleton ready

**Next**: Move content from existing pages into tabs:
- Ideas (from interests)
- Testing (from health habits)
- Food (from recipes)
- Little Human (from LittleHumanPage)
- Attention (from experiences)

---

## 🛠️ Useful Commands

```bash
# Run all apps
pnpm dev

# Run specific app
pnpm host            # Host app only
pnpm personal-os     # Personal OS only
pnpm professional    # Professional only
pnpm reward-system   # Reward system only

# Build all
pnpm build

# Clean install
rm -r node_modules
pnpm install
```

---

## 🐛 Troubleshooting

### Apps won't start?
```bash
# Clear all node_modules and reinstall
rm -r node_modules apps/*/node_modules
pnpm install
pnpm dev
```

### Module federation not loading?
1. Check that all 4 servers are running (`netstat -ano | findstr :3000`)
2. Check browser console for errors
3. Verify `remoteEntry.js` is being fetched (Network tab)
4. Check vite.config.js has correct remotes URLs

### Port already in use?
Change port in vite.config.js:
```javascript
server: {
  port: 5176, // Changed from 5174
}
```

---

## 📚 Documentation

- **MICROFRONTEND_ARCHITECTURE.md** — System design & decisions
- **REWARD_SYSTEM_PROMPT.md** — Reward system development guide
- **REFACTOR_TO_MODULES_PROMPT.md** — Module refactor guide
- **IMPLEMENTATION_ROADMAP.md** — Overall roadmap

---

## ✨ You're Ready!

Run `pnpm dev` and start building. Happy coding! 🎉
