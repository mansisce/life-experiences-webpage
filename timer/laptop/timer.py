#!/usr/bin/env python3
"""
Pomodoro tray timer for macOS.
25 min focus → alarm → 5 min cooldown → repeat
"""

import json
import os
import subprocess
import threading
import time
from datetime import datetime
from pathlib import Path

import rumps

FOCUS_DURATION = 25 * 60   # seconds
COOLDOWN_DURATION = 5 * 60  # seconds

LOGS_DIR = Path(__file__).parent.parent / "logs"
LOG_FILE = LOGS_DIR / "laptop_sessions.json"

FOCUS_ICON = "🍅"
COOLDOWN_ICON = "☕"
IDLE_ICON = "⏸"


def play_sound():
    """Play macOS system alert sound."""
    subprocess.Popen(["afplay", "/System/Library/Sounds/Glass.aiff"])


def notify(title: str, message: str):
    """Send macOS system notification."""
    script = f'display notification "{message}" with title "{title}" sound name "Glass"'
    subprocess.Popen(["osascript", "-e", script])


def log_session(phase: str, duration_seconds: int):
    """Append a completed session to the JSON log."""
    LOGS_DIR.mkdir(parents=True, exist_ok=True)
    sessions = []
    if LOG_FILE.exists():
        try:
            with open(LOG_FILE) as f:
                sessions = json.load(f)
        except (json.JSONDecodeError, ValueError):
            sessions = []

    sessions.append({
        "device": "laptop",
        "phase": phase,
        "duration_seconds": duration_seconds,
        "completed_at": datetime.now().isoformat(),
    })

    with open(LOG_FILE, "w") as f:
        json.dump(sessions, f, indent=2)


class PomodoroApp(rumps.App):
    def __init__(self):
        super().__init__("Pomodoro", title=IDLE_ICON, quit_button=None)
        self.menu = [
            rumps.MenuItem("Start", callback=self.start),
            rumps.MenuItem("Pause / Resume", callback=self.toggle_pause),
            rumps.MenuItem("Stop", callback=self.stop),
            None,
            rumps.MenuItem("Quit", callback=self.quit_app),
        ]
        self._reset_state()

    # ── state ────────────────────────────────────────────────────────────────

    def _reset_state(self):
        self._phase = "idle"       # idle | focus | cooldown
        self._remaining = 0
        self._paused = False
        self._thread = None
        self._stop_event = threading.Event()
        self.title = IDLE_ICON

    # ── controls ─────────────────────────────────────────────────────────────

    def start(self, _=None):
        if self._phase != "idle":
            return
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._run_loop, daemon=True)
        self._thread.start()

    def toggle_pause(self, _=None):
        if self._phase == "idle":
            return
        self._paused = not self._paused

    def stop(self, _=None):
        self._stop_event.set()
        self._paused = False
        self._reset_state()

    def quit_app(self, _=None):
        self.stop()
        rumps.quit_application()

    # ── timer loop ───────────────────────────────────────────────────────────

    def _run_loop(self):
        while not self._stop_event.is_set():
            self._run_phase("focus", FOCUS_DURATION)
            if self._stop_event.is_set():
                break
            notify("Focus session done! 🍅", "Take a 5-minute break.")
            play_sound()
            log_session("focus", FOCUS_DURATION)

            self._run_phase("cooldown", COOLDOWN_DURATION)
            if self._stop_event.is_set():
                break
            notify("Break over! ☕", "Starting next focus session.")
            play_sound()
            log_session("cooldown", COOLDOWN_DURATION)

        self._reset_state()

    def _run_phase(self, phase: str, duration: int):
        self._phase = phase
        self._remaining = duration
        icon = FOCUS_ICON if phase == "focus" else COOLDOWN_ICON

        while self._remaining > 0 and not self._stop_event.is_set():
            if not self._paused:
                mins, secs = divmod(self._remaining, 60)
                self.title = f"{icon} {mins:02d}:{secs:02d}"
                self._remaining -= 1
            time.sleep(1)


if __name__ == "__main__":
    PomodoroApp().run()
