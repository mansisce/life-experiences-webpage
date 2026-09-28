"""Pure business rules: streaks and reward unlocks. No database, no HTTP — just values in, values out.

Analogy: these are like pure reducer/selector functions in a React app; everything else
(routes, DB) is plumbing around them, and they are unit-tested directly.
"""

from collections.abc import Iterable
from dataclasses import dataclass
from datetime import date


@dataclass(frozen=True)
class Streak:
    current: int
    best: int


def period_index(day: date, frequency: str) -> int:
    """Map a date to a consecutive integer per period, so "next period" is always index + 1."""
    if frequency == "daily":
        return day.toordinal()
    if frequency == "weekly":
        # date(1, 1, 1) is a Monday, so this counts Monday-to-Sunday weeks.
        return (day.toordinal() - 1) // 7
    raise ValueError(f"no periods for frequency {frequency!r}")


def compute_streak(completion_days: Iterable[date], frequency: str, today: date) -> Streak:
    """Consecutive periods (days or weeks) with at least one completion.

    Several completions in the same period count once. The current streak survives until a
    whole period is missed: a daily task done yesterday but not yet today still has its streak.
    """
    days = list(completion_days)
    if frequency == "one_off":
        done = 1 if days else 0
        return Streak(current=done, best=done)

    periods = sorted({period_index(d, frequency) for d in days})
    if not periods:
        return Streak(current=0, best=0)

    best = run = 1
    for previous, current in zip(periods, periods[1:]):
        run = run + 1 if current == previous + 1 else 1
        best = max(best, run)

    still_alive = periods[-1] >= period_index(today, frequency) - 1
    return Streak(current=run if still_alive else 0, best=best)


@dataclass(frozen=True)
class Progress:
    current: int
    target: int

    @property
    def met(self) -> bool:
        return self.current >= self.target

    @property
    def percent(self) -> int:
        return min(100, round(100 * self.current / self.target)) if self.target else 100


def reward_progress(
    rule_type: str, threshold: int, status: str, total_completions: int, best_current_streak: int
) -> Progress:
    """Progress towards a reward across all its tagged tasks.

    - completions: total completions of every tagged task
    - streak: the best *current* streak among tagged tasks
    Once unlocked or claimed, a reward stays at 100% even if a streak later breaks.
    """
    value = total_completions if rule_type == "completions" else best_current_streak
    if status != "locked":
        value = max(value, threshold)
    return Progress(current=min(value, threshold), target=threshold)
