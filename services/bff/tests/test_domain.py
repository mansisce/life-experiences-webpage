from datetime import date, timedelta

import pytest

from app.domain import Streak, compute_streak, reward_progress

TODAY = date(2026, 9, 28)  # Monday


def days_ago(*offsets: int) -> list[date]:
    return [TODAY - timedelta(days=n) for n in offsets]


@pytest.mark.parametrize(
    ("completions", "expected"),
    [
        ([], Streak(0, 0)),
        (days_ago(0), Streak(1, 1)),
        (days_ago(0, 0, 0), Streak(1, 1)),  # same day counts once
        (days_ago(0, 1, 2), Streak(3, 3)),
        (days_ago(1, 2), Streak(2, 2)),  # not done today yet: streak still alive
        (days_ago(2, 3), Streak(0, 2)),  # missed yesterday: broken, best remembered
        (days_ago(0, 1, 5, 6, 7), Streak(2, 3)),
    ],
)
def test_daily_streak(completions, expected):
    assert compute_streak(completions, "daily", TODAY) == expected


@pytest.mark.parametrize(
    ("completions", "expected"),
    [
        (days_ago(0), Streak(1, 1)),
        (days_ago(0, 1), Streak(2, 2)),  # Mon + previous Sun are different weeks
        (days_ago(1, 2, 3), Streak(1, 1)),  # Sun/Sat/Fri are all last week
        (days_ago(7, 14), Streak(2, 2)),  # last week + the one before, this week not done yet
        (days_ago(14, 21), Streak(0, 2)),  # skipped last week
    ],
)
def test_weekly_streak(completions, expected):
    assert compute_streak(completions, "weekly", TODAY) == expected


def test_one_off_streak_is_done_or_not():
    assert compute_streak([], "one_off", TODAY) == Streak(0, 0)
    assert compute_streak(days_ago(3), "one_off", TODAY) == Streak(1, 1)


def test_completions_rule_progress():
    progress = reward_progress("completions", 3, "locked", total_completions=2, best_current_streak=9)
    assert (progress.current, progress.target, progress.percent, progress.met) == (2, 3, 67, False)
    assert reward_progress("completions", 3, "locked", 5, 0).current == 3  # capped at target


def test_streak_rule_progress():
    assert reward_progress("streak", 5, "locked", total_completions=99, best_current_streak=2).current == 2
    assert reward_progress("streak", 5, "locked", 0, 5).met


def test_unlocked_reward_stays_complete_after_streak_breaks():
    assert reward_progress("streak", 5, "unlocked", 0, 0).percent == 100
    assert reward_progress("streak", 5, "claimed", 0, 0).met
