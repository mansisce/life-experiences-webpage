# Timer

Pomodoro-style background timer. Separate per device.

## Laptop (macOS)

```bash
cd timer/laptop
pip install -r requirements.txt
python timer.py
```

The app runs in your macOS menubar. Click the icon to Start / Pause / Stop.

**Cycle:** 🍅 25 min focus → alarm + notification → ☕ 5 min cooldown → repeat

**Logs:** `timer/logs/laptop_sessions.json`

## Coming later
- Android / WhatsApp bot control
- Configurable durations
- Neo4j session sync
