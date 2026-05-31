# Life Experiences Webpage

A React + Vite personal website for documenting life experiences, current interests, recipes, health experiments, work learnings, and a resume-style snapshot.

## Local setup

Install Node.js first, then run:

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel, choose **Add New Project**.
3. Import the GitHub repo.
4. Vercel should detect Vite automatically.
5. Use these settings if needed:
   - Build command: `npm run build`
   - Output directory: `dist`
   - Install command: `npm install`

## Customize

- Update the content arrays in `src/App.jsx`.
- Replace `public/life-journal-hero.png` if you want a more personal hero image.
- Edit colors, spacing, and layout in `src/styles.css`.
