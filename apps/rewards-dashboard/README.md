# Rewards insights (Streamlit)

Analytics client of the Rewards BFF. It reads `GET /dashboard/summary`, which returns flat snake_case tables built for pandas, and never touches the database.

```bash
cd apps/rewards-dashboard
uv sync
uv run streamlit run app.py      # http://localhost:8501 (BFF expected at http://127.0.0.1:8000)
```

Environment: `BFF_URL` (default `http://127.0.0.1:8000`) and `BFF_TOKEN` (default `demo-token`).
Use `127.0.0.1`, not `localhost`: on Windows, Python waits about 2 s per request for IPv6 before falling back.

| Shows | Source field |
|---|---|
| KPI row: completions, active tasks, streaks, unlocked rewards, AI acceptance | `totals`, `suggestions` |
| Completions by tile / by area / per day | `completions_by_category`, `completions_by_area`, `completions_by_day` |
| Active streaks, reward progress (+ Claim) | `streaks`, `rewards` |
| AI suggestion decisions (fills in once photo → AI ships) | `suggestions` |

Streamlit concepts shown here:
- **Rerun model:** the script re-runs top to bottom on every click. The sidebar shows the rerun count.
- **`st.session_state`:** the window and tile filters survive reruns.
- **`st.cache_data(ttl=30)`:** the BFF response is cached for each `days` value.
- **Cache clearing after a write:** *Claim* calls the BFF, clears the cache and reruns, so the page shows fresh numbers.
