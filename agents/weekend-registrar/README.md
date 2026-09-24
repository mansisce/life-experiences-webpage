# Weekend Registrar Agent

Finds free kids/family events on Urbanaut this weekend that align with your child's school pedagogy, then auto-fills and submits the registration.

## Setup

```bash
cd agents/weekend-registrar
npm install
npx playwright install chromium
```

Set your API key:
```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

Edit `profile.json` with your details:
- `parent.name`, `parent.email`, `parent.phone`
- `child.name`, `child.age`
- `child.school` — one of: `montessori`, `cfl`, `valley`, `creative`
- `location.pincode` — your Bangalore pincode

## Run

```bash
# Find + register best free event (headless)
node index.js

# See the browser window while it runs
node index.js --headed

# Find only, don't submit anything
node index.js --dry-run

# Override pincode
node index.js --pincode 560029 --headed
```

## How it works

1. **Scrapes** Urbanaut's Bangalore family event pages
2. **Claude picks** the highest-scoring free event based on your school's pedagogy pillars and your child's age
3. **Navigates** to the event page in Playwright
4. **Claude reads** the registration form fields
5. **Auto-fills** name, email, phone, child details
6. **Asks you to confirm** before submitting
7. **Submits** and saves the registration to `profile.json`

## Pincode coverage

560001 · 560008 · 560011 · 560016 · 560017 · 560029 · 560034 · 560037 · 560043 · 560068 · 560076 · 560078 · 560102 · 560103
