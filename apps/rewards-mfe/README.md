# Rewards MFE

React microfrontend (Module Federation remote). It exposes `rewardsMfe/RewardsApp`, which the host site mounts on `#/rewards`.

```bash
npm install
npm run serve:remote   # build + preview on :5180 → http://localhost:5180/assets/remoteEntry.js (what the host loads)
npm run dev            # standalone on :5181 for UI work (no host needed)
```

`@originjs/vite-plugin-federation` only emits `remoteEntry.js` from a build, so the federated version is always built. The host can run in `vite dev`.

**Contract.** `<RewardsApp apiBaseUrl? token? basePath="/rewards" />`. All props are optional; defaults come from this app's own build env (`VITE_BFF_URL`, `VITE_BFF_TOKEN`, see `.env.example`). The host only knows the remote's name and `basePath`. It knows nothing about the BFF.

**Principles.**
- **Only talks to the BFF** through `src/api.js`.
- **Owns its routes** under `basePath`, so deep links and the back button work.
- **Brings its own styles**, scoped under `.rw-app` and injected at mount.
- **Shares one React** with the host.
- **Handles failures on screen:** every screen has loading, error and empty states. If the remote itself can't load, the host shows a fallback card.

| Route | Screen |
|---|---|
| `#/rewards` | Tiles |
| `#/rewards/c/:categoryId` | Sub-tiles (add / rename / delete) |
| `#/rewards/a/:areaId` | Area: add task, filter, reprioritise, quick-complete |
| `#/rewards/t/:taskId` | Task: streak, log completion (now/backfill), activity log, tag rewards, settings |
| `#/rewards/my-rewards` | Rewards: create, tag tasks, progress, claim |
