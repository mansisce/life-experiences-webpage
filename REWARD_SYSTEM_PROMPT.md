# Reward System Implementation Prompt (Next.js)

## Project Overview

Build a **Task + Reward Management System** as a standalone Next.js federated module that integrates with Mansilly's microfrontend architecture. Users can create tasks and rewards, then use LLM (Claude) to intelligently categorize tasks and assign rewards based on difficulty, scope, and task type.

**Location**: `/apps/reward-system` (separate Next.js app)
**Deployment**: reward-system.vercel.app (independent)
**Status**: MVP with CRUD + LLM categorization

---

## Entities & Data Model

### Task Entity
```javascript
{
  id: UUID,
  title: String,                    // "Finish React refactor"
  description: String,              // Optional details
  category: String,                 // "engineering", "personal", "health", etc.
  startDate: ISO DateTime,          // When task started
  endDate: ISO DateTime,            // When task ends/ended
  silent: Boolean,                  // Don't notify on completion
  isMilestone: Boolean,             // Important/significant task
  reward_id: UUID,                  // Assigned reward (after categorization)
  status: Enum,                     // "pending", "in-progress", "completed"
  createdAt: Timestamp,
  updatedAt: Timestamp,
}
```

### Reward Entity
```javascript
{
  id: UUID,
  title: String,                    // "Certificate of Achievement"
  description: String,              // Optional details
  category: String,                 // "achievement", "celebration", "learning", etc.
  awardDate: ISO DateTime,          // When reward was earned
  silent: Boolean,                  // Don't show notifications
  announce: Boolean,                // Show celebration/fanfare
  points: Integer,                  // Reward score/value
  createdAt: Timestamp,
  updatedAt: Timestamp,
}
```

### Reward History (Audit Trail)
```javascript
{
  id: UUID,
  taskId: UUID,
  rewardId: UUID,
  assignedAt: Timestamp,
  reason: String,                   // LLM explanation for assignment
}
```

---

## Database Setup

### Option 1: Supabase (Recommended)
- PostgreSQL backend
- Real-time updates
- Built-in auth (can use Mansilly's auth)

### Option 2: MongoDB + Mongoose
- Document-based (flexible schema)
- Simple setup

### Option 3: Prisma + SQLite (Local Dev)
- Simple for MVP
- Scale to PostgreSQL later

**For this MVP, use Supabase PostgreSQL or MongoDB.**

---

## API Routes (Next.js App Router)

### 1. Tasks CRUD

#### GET /api/tasks
List all tasks with optional filters.

**Query Params**:
- `status`: "pending" | "in-progress" | "completed"
- `category`: Filter by category
- `isMilestone`: Boolean

**Response**:
```json
{
  "tasks": [
    {
      "id": "uuid",
      "title": "Finish React refactor",
      "description": "...",
      "category": "engineering",
      "startDate": "2026-01-15T09:00:00Z",
      "endDate": "2026-01-20T17:00:00Z",
      "silent": false,
      "isMilestone": true,
      "reward_id": "uuid-reward",
      "status": "completed",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "total": 42
}
```

#### POST /api/tasks
Create a new task.

**Request Body**:
```json
{
  "title": "Finish React refactor",
  "description": "Convert existing code to microfrontends",
  "category": "engineering",
  "startDate": "2026-01-15T09:00:00Z",
  "endDate": "2026-01-20T17:00:00Z",
  "silent": false,
  "isMilestone": true
}
```

**Response**: Created task object with `id`.

#### GET /api/tasks/:id
Get single task by ID.

**Response**: Task object.

#### PUT /api/tasks/:id
Update task (all fields optional).

**Request Body**:
```json
{
  "status": "completed",
  "endDate": "2026-01-20T17:00:00Z"
}
```

**Response**: Updated task object.

#### DELETE /api/tasks/:id
Delete task.

**Response**: `{ "success": true }`

---

### 2. Rewards CRUD

#### GET /api/rewards
List all available rewards.

**Query Params**:
- `category`: Filter by category

**Response**:
```json
{
  "rewards": [
    {
      "id": "uuid",
      "title": "Certificate of Achievement",
      "description": "Milestone completed",
      "category": "achievement",
      "awardDate": "2026-01-20T17:00:00Z",
      "silent": false,
      "announce": true,
      "points": 100,
      "createdAt": "..."
    }
  ],
  "total": 15
}
```

#### POST /api/rewards
Create a new reward template.

**Request Body**:
```json
{
  "title": "Code Review Expert",
  "description": "Completed 50 code reviews",
  "category": "achievement",
  "silent": false,
  "announce": true,
  "points": 150
}
```

**Response**: Created reward object with `id`.

#### GET /api/rewards/:id
Get single reward.

#### PUT /api/rewards/:id
Update reward.

#### DELETE /api/rewards/:id
Delete reward template (cascade: unassign from tasks).

---

### 3. Categorization (LLM)

#### POST /api/categorize
Use Claude to categorize tasks and assign rewards.

**Request Body**:
```json
{
  "tasks": [
    {
      "id": "uuid",
      "title": "Finish React refactor",
      "description": "...",
      "category": "engineering",
      "startDate": "...",
      "endDate": "...",
      "isMilestone": true
    }
  ],
  "rewards": [
    {
      "id": "uuid",
      "title": "Certificate of Achievement",
      "category": "achievement",
      "points": 100
    }
  ]
}
```

**Response**:
```json
{
  "assignments": [
    {
      "taskId": "uuid",
      "rewardId": "uuid",
      "reason": "High-impact engineering milestone with 5+ day duration. 'Certificate of Achievement' (100 points) is appropriate for complexity and scope."
    }
  ],
  "processingTime": "1.2s"
}
```

**LLM Prompt Logic**:
```
Given tasks with titles, descriptions, categories, dates, and milestone status,
assign the most appropriate reward from available options based on:
1. Task difficulty (inferred from description)
2. Task duration (endDate - startDate)
3. Category (engineering gets different rewards than health)
4. Milestone status (milestones get higher-value rewards)
5. Reward value alignment (points should match task importance)

Return JSON: [{ taskId, rewardId, reason }]
```

---

### 4. Dashboard Summary

#### GET /api/dashboard
High-level summary of tasks and rewards.

**Response**:
```json
{
  "tasks": {
    "total": 42,
    "completed": 28,
    "in_progress": 10,
    "pending": 4
  },
  "rewards": {
    "total_earned": 2500,
    "total_available": 15,
    "recent": [
      {
        "id": "uuid",
        "title": "Certificate of Achievement",
        "earnedDate": "2026-01-20T17:00:00Z"
      }
    ]
  },
  "stats": {
    "completion_rate": 0.67,        // 28/42
    "avg_task_duration_days": 7.3,
    "most_common_category": "engineering"
  }
}
```

---

## UI Components

### Pages

#### `/app/page.jsx` — Dashboard
Main landing page for reward system.

**Features**:
- Task completion summary (pie chart)
- Recent rewards
- Quick "Add Task" button
- Quick "Add Reward" button
- Categorize button (run LLM)

#### `/app/tasks/page.jsx` — Task List
List all tasks with filters.

**Features**:
- Table/list of tasks
- Filter by status, category, milestone
- Edit/delete buttons
- Search
- "New Task" button

#### `/app/tasks/new/page.jsx` — New Task
Form to create task.

**Fields**:
- Title (required)
- Description
- Category (dropdown)
- Start Date/Time
- End Date/Time
- Silent (checkbox)
- Milestone (checkbox)

#### `/app/tasks/[id]/edit/page.jsx` — Edit Task
Edit existing task.

**Pre-fill** current values.
**Show** assigned reward (if any).

#### `/app/rewards/page.jsx` — Reward List
List all reward templates.

**Features**:
- Table of rewards
- Filter by category
- Points shown
- Edit/delete buttons
- "New Reward" button

#### `/app/rewards/new/page.jsx` — New Reward
Form to create reward template.

**Fields**:
- Title (required)
- Description
- Category (dropdown)
- Silent (checkbox)
- Announce (checkbox)
- Points (number)

#### `/app/rewards/[id]/edit/page.jsx` — Edit Reward
Edit reward template.

#### `/app/categorize/page.jsx` — Categorization
Manually run LLM categorization.

**Features**:
- Show uncategorized tasks
- Show available rewards
- "Run Categorization" button
- Display assignments with reasons
- Apply/reject individual assignments
- Confirm & save

---

## Components

### src/components/

#### TaskForm.jsx
```javascript
export default function TaskForm({ task, onSubmit }) {
  // Form for create/edit task
  // Fields: title, description, category, dates, silent, isMilestone
  return (
    <form onSubmit={onSubmit}>
      {/* fields */}
    </form>
  );
}
```

#### TaskCard.jsx
```javascript
export default function TaskCard({ task, onEdit, onDelete }) {
  // Display task with title, dates, category badge, milestone icon
  // Show assigned reward if exists
  return (
    <div className="task-card">
      {/* content */}
    </div>
  );
}
```

#### RewardForm.jsx
```javascript
export default function RewardForm({ reward, onSubmit }) {
  // Form for create/edit reward
  // Fields: title, description, category, silent, announce, points
  return (
    <form onSubmit={onSubmit}>
      {/* fields */}
    </form>
  );
}
```

#### RewardCard.jsx
```javascript
export default function RewardCard({ reward, onEdit, onDelete }) {
  // Display reward with title, points, category badge
  // Show how many tasks assigned
  return (
    <div className="reward-card">
      {/* content */}
    </div>
  );
}
```

#### DashboardStats.jsx
```javascript
export default function DashboardStats({ stats }) {
  // Show: tasks (pending/in-progress/completed), rewards earned, charts
  return (
    <div className="dashboard">
      {/* charts, stats */}
    </div>
  );
}
```

#### CategorizeButton.jsx
```javascript
export default function CategorizeButton() {
  // Button to trigger LLM categorization
  // Handle loading, success, error states
  return (
    <button onClick={handleCategorize}>
      Categorize Tasks → Assign Rewards (AI)
    </button>
  );
}
```

---

## Backend Implementation

### app/api/tasks/route.js

```javascript
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const category = searchParams.get('category');

  let query = supabase.from('tasks').select('*');
  
  if (status) query = query.eq('status', status);
  if (category) query = query.eq('category', category);

  const { data, error } = await query.order('createdAt', { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ tasks: data, total: data.length });
}

export async function POST(req) {
  const body = await req.json();
  const task = {
    id: uuidv4(),
    ...body,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const { data, error } = await supabase.from('tasks').insert([task]);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(task, { status: 201 });
}
```

### app/api/categorize/route.js

```javascript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function POST(req) {
  const { tasks, rewards } = await req.json();

  const prompt = `Given these tasks:\n${JSON.stringify(tasks, null, 2)}\n\nAnd these available rewards:\n${JSON.stringify(rewards, null, 2)}\n\nFor each task, assign the most appropriate reward based on:\n1. Task difficulty/description\n2. Task duration (endDate - startDate)\n3. Milestone status\n4. Category alignment\n\nReturn ONLY a valid JSON array: [{ "taskId": "uuid", "rewardId": "uuid", "reason": "explanation" }]\n\nReturn only the array, no other text.`;

  try {
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0].text;
    const assignments = JSON.parse(content);

    return Response.json({ assignments });
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

---

## Environment Variables

```env
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your-anon-key

# Claude API
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Next.js
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## Module Federation Export (next.config.js)

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
          './Tasks': './app/tasks/page.jsx',
          './Rewards': './app/rewards/page.jsx',
          './Categorize': './app/categorize/page.jsx',
          './Dashboard': './app/components/DashboardStats.jsx',
          './TaskForm': './app/components/TaskForm.jsx',
          './RewardForm': './app/components/RewardForm.jsx',
        },
        
        shared: ['react', 'react-dom', 'next'],
      })
    );

    return config;
  },
};
```

---

## Development Checklist

### Phase 1: Database & API
- [ ] Set up Supabase (or MongoDB)
- [ ] Create tables: tasks, rewards, rewardHistory
- [ ] Implement GET /api/tasks
- [ ] Implement POST /api/tasks
- [ ] Implement PUT /api/tasks/:id
- [ ] Implement DELETE /api/tasks/:id
- [ ] Repeat for /api/rewards
- [ ] Implement GET /api/dashboard

### Phase 2: LLM Integration
- [ ] Set up Anthropic API key
- [ ] Implement POST /api/categorize
- [ ] Test categorization with sample data
- [ ] Iterate prompt for better assignments

### Phase 3: UI
- [ ] Build TaskForm component
- [ ] Build TaskCard component
- [ ] Build Tasks page (list + create)
- [ ] Build task edit/delete UI
- [ ] Repeat for Rewards
- [ ] Build Dashboard page
- [ ] Build Categorization page with assignment review UI

### Phase 4: Module Federation
- [ ] Export components via remoteEntry.js
- [ ] Test federated loading in host app

### Phase 5: Polish
- [ ] Styling (Tailwind or custom CSS)
- [ ] Error handling (API errors, LLM errors)
- [ ] Loading states
- [ ] Responsive design

---

## Testing Strategy

### Unit Tests (Jest)
- Task CRUD functions
- Reward CRUD functions
- LLM prompt formatting
- Data validation

### Integration Tests
- API routes (test with real Supabase)
- End-to-end categorization flow
- Form submissions

### E2E Tests (Playwright)
- Create task → categorize → verify reward assigned
- Edit task → re-categorize
- Delete task → clean up reward assignments

---

## Deployment

### Staging
```bash
vercel deploy --prod
# Logs remoteEntry.js URL: https://reward-system-staging.vercel.app/remoteEntry.js
```

### Production
```bash
vercel deploy --prod --scope=mansilly
# Final URL: https://reward-system.vercel.app/remoteEntry.js
```

### Update Host App
After reward system is deployed, update host app's `vite.config.js`:
```javascript
remotes: {
  rewardSystem: 'https://reward-system.vercel.app/remoteEntry.js',
},
```

---

## Future Enhancements (P1+)

- **Analytics**: Visualize task trends, reward distribution
- **Notifications**: Alert on task completion (silent/non-silent)
- **Streaming**: Use Claude API streaming for real-time categorization feedback
- **Batch Operations**: Bulk create tasks, bulk categorize
- **Task Dependencies**: Link tasks (prereq/blocking)
- **Reward Levels**: Bronze/Silver/Gold reward tiers
- **Sharing**: Share tasks/rewards with other users
- **Integrations**: Import from Asana/Todoist/Linear
