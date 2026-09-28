"""Rewards insights: a Streamlit dashboard that reads only from the Rewards BFF.

Run from apps/rewards-dashboard:   uv run streamlit run app.py   ->  http://localhost:8501

Streamlit in React terms:
- Rerun model: every interaction re-executes this whole file top to bottom, like a component's
  render function running again. There's no event-handler wiring; widgets just return values.
- st.session_state: state that survives reruns, like useState. Widgets with `key=` store their
  value there automatically.
- st.cache_data(ttl=...): memoises a function's result across reruns and users, like a
  React Query cache with a staleTime. `.clear()` is the equivalent of invalidateQueries.
"""

import os
from datetime import date, datetime, timedelta

import altair as alt
import pandas as pd
import streamlit as st

from bff_client import BffClient, BffError

st.set_page_config(page_title="Rewards insights", page_icon="🏆", layout="wide")

# 127.0.0.1 rather than localhost: on Windows, Python tries IPv6 (::1) first and waits ~2 s
# per request before falling back to where uvicorn is listening.
BFF_URL = os.environ.get("BFF_URL", "http://127.0.0.1:8000")
client = BffClient(BFF_URL, os.environ.get("BFF_TOKEN", "demo-token"))

CACHE_TTL_SECONDS = 30
WINDOWS = {"Last 7 days": 7, "Last 30 days": 30, "Last 90 days": 90, "All time": None}

# Reference data-viz palette (validated): slot 1 for single-series bars, slots 1-3 for the
# three suggestion decisions, which are colour-blind safe as a set.
SERIES_1 = "#2a78d6"
DECISION_COLORS = {"Relevant": "#2a78d6", "Not relevant": "#eb6834", "Ignored": "#1baf7a"}


@st.cache_data(ttl=CACHE_TTL_SECONDS, show_spinner="Loading from the BFF…")
def load_summary(days: int | None) -> dict:
    """Cached per `days` value for 30 s, so filter changes and reruns don't hammer the BFF."""
    summary = client.summary(days)
    summary["_fetched_at"] = datetime.now().strftime("%H:%M:%S")
    return summary


# ── Session state: survives reruns ────────────────────────────────────────────
st.session_state.setdefault("reruns", 0)
st.session_state.reruns += 1


# ── Sidebar: filters (stored in session_state via `key=`) ─────────────────────
with st.sidebar:
    st.header("Filters")
    st.radio("Completions window", list(WINDOWS), index=1, key="window")
    category_slot = st.empty()  # filled once we know the categories from the BFF
    st.divider()
    if st.button("↻ Refresh now", width="stretch"):
        load_summary.clear()  # drop cached BFF responses, then this rerun fetches fresh data
    st.caption(f"Data source: `{BFF_URL}/dashboard/summary` · cache TTL {CACHE_TTL_SECONDS}s")
    with st.expander("How this dashboard works"):
        st.markdown(
            f"- **Rerun model:** this script has run **{st.session_state.reruns}×** this session. "
            "Every click re-executes it top to bottom.\n"
            "- **session_state:** your window and tile filters survive those reruns.\n"
            "- **cache_data:** BFF responses are reused for 30 s; *Refresh* or claiming a reward clears the cache.\n"
            "- **BFF:** this page gets flat, snake_case tables; the React app gets screen-shaped camelCase "
            "objects from the same service."
        )


# ── Load data ─────────────────────────────────────────────────────────────────
days = WINDOWS[st.session_state.window]
try:
    summary = load_summary(days)
except BffError as error:
    st.title("🏆 Rewards insights")
    st.error(str(error))
    if st.button("Try again"):
        load_summary.clear()
        st.rerun()
    st.stop()

categories = pd.DataFrame(summary["completions_by_category"])
category_names = {"All tiles": None} | dict(zip(categories["category_name"], categories["category_id"]))
with category_slot:
    st.selectbox("Tile", list(category_names), key="category")
category_id = category_names.get(st.session_state.category)


# ── Header & KPIs ─────────────────────────────────────────────────────────────
st.title("🏆 Rewards insights")
st.caption(f"{st.session_state.window} · fetched from the BFF at {summary['_fetched_at']}")

totals = summary["totals"]
suggestions = summary["suggestions"]
kpis = st.columns(5)
kpis[0].metric("Completions", totals["completions"])
kpis[1].metric("Active tasks", totals["active_tasks"])
kpis[2].metric("Active streaks", totals["active_streaks"])
kpis[3].metric("Unlocked", totals["rewards_unlocked"] + totals["rewards_claimed"], help="Unlocked or already claimed")
rate = suggestions["acceptance_rate"]
kpis[4].metric("AI accepted", f"{rate:.0%}" if rate is not None else "—", help="Relevant ÷ decided AI suggestions")


def bar_chart(df: pd.DataFrame, label_col: str, label_title: str) -> alt.Chart:
    """Horizontal single-series bars, largest first, with a hover tooltip."""
    return (
        alt.Chart(df)
        .mark_bar(color=SERIES_1, cornerRadiusEnd=4)
        .encode(
            x=alt.X("completions:Q", title="Completions", axis=alt.Axis(tickMinStep=1)),
            y=alt.Y(
                f"{label_col}:N",
                sort="-x",
                title=None,
                scale=alt.Scale(paddingInner=0.3),
                axis=alt.Axis(labelLimit=220, labelOverlap=False),
            ),
            tooltip=[alt.Tooltip(f"{label_col}:N", title=label_title), alt.Tooltip("completions:Q", title="Completions")],
        )
        .properties(height=alt.Step(36))  # a fixed row height per bar, so the chart grows with the data
    )


# ── Completions ───────────────────────────────────────────────────────────────
left, right = st.columns(2)
with left:
    st.subheader("Completions by tile")
    if categories["completions"].sum() == 0:
        st.info("No completions in this window yet.")
    else:
        st.altair_chart(bar_chart(categories, "category_name", "Tile"), width="stretch")

with right:
    areas = pd.DataFrame(summary["completions_by_area"])
    if category_id:
        areas = areas[areas["category_id"] == category_id]
    areas = areas[areas["completions"] > 0]
    st.subheader(f"Completions by area · {st.session_state.category}")
    if areas.empty:
        st.info("No completions for these filters.")
    else:
        st.altair_chart(bar_chart(areas, "area_name", "Area"), width="stretch")

st.subheader("Completions per day")
per_day = pd.DataFrame(summary["completions_by_day"], columns=["date", "completions"])
if per_day.empty:
    st.info("No completions in this window yet.")
else:
    # Fill empty days so gaps show as gaps, not as neighbouring bars.
    per_day["date"] = pd.to_datetime(per_day["date"])
    start = date.today() - timedelta(days=days - 1) if days else per_day["date"].min().date()
    full_range = pd.date_range(start, date.today(), freq="D")
    per_day = per_day.set_index("date").reindex(full_range, fill_value=0).rename_axis("date").reset_index()
    # One labelled column per day (ordinal), so each label sits under its own bar.
    per_day["day"] = per_day["date"].dt.strftime("%d %b")
    st.altair_chart(
        alt.Chart(per_day)
        .mark_bar(color=SERIES_1, cornerRadiusEnd=4)
        .encode(
            x=alt.X(
                "day:O",
                sort=alt.EncodingSortField("date"),
                title=None,
                scale=alt.Scale(paddingInner=0.3),
                axis=alt.Axis(labelAngle=0, labelOverlap="greedy"),
            ),
            y=alt.Y("completions:Q", title="Completions", axis=alt.Axis(tickMinStep=1)),
            tooltip=[alt.Tooltip("date:T", title="Day", format="%a %d %b"), alt.Tooltip("completions:Q", title="Completions")],
        )
        .properties(height=220),
        width="stretch",
    )


# ── Streaks & rewards ─────────────────────────────────────────────────────────
left, right = st.columns(2)
with left:
    st.subheader("Active streaks")
    streaks = pd.DataFrame(summary["streaks"])
    if category_id and not streaks.empty:
        streaks = streaks[streaks["category_id"] == category_id]
    if streaks.empty:
        st.info("No active streaks. Complete a daily or weekly task to start one.")
    else:
        st.dataframe(
            streaks[["task_title", "area_name", "frequency", "current_streak", "best_streak"]],
            hide_index=True,
            width="stretch",
            column_config={
                "task_title": "Task",
                "area_name": "Area",
                "frequency": "Every",
                "current_streak": st.column_config.NumberColumn("Current 🔥"),
                "best_streak": st.column_config.NumberColumn("Best"),
            },
        )

with right:
    st.subheader("Reward progress")
    rewards = pd.DataFrame(summary["rewards"])
    if rewards.empty:
        st.info("No rewards yet. Create one in the Rewards app.")
    else:
        st.dataframe(
            rewards[["title", "status", "rule_type", "current", "target", "percent"]],
            hide_index=True,
            width="stretch",
            column_config={
                "title": "Reward",
                "status": "Status",
                "rule_type": "Rule",
                "current": "Progress",
                "target": "Target",
                "percent": st.column_config.ProgressColumn("Done", min_value=0, max_value=100, format="%d%%"),
            },
        )
        # A write action through the BFF, followed by cache invalidation so the next rerun is fresh.
        for reward in rewards[rewards["status"] == "unlocked"].itertuples():
            if st.button(f"Claim “{reward.title}” 🎁", key=f"claim-{reward.reward_id}"):
                try:
                    client.claim_reward(reward.reward_id)
                except BffError as error:
                    st.error(str(error))
                else:
                    load_summary.clear()
                    st.toast(f"Claimed {reward.title}", icon="🎁")
                    st.rerun()


# ── AI suggestion acceptance ──────────────────────────────────────────────────
st.subheader("AI suggestion decisions")
decisions = pd.DataFrame(
    {
        "decision": ["Relevant", "Not relevant", "Ignored"],
        "count": [suggestions["relevant"], suggestions["not_relevant"], suggestions["ignore"]],
    }
)
if decisions["count"].sum() == 0:
    st.info(
        "No AI suggestions decided yet. Photo → AI task suggestions arrive post-MVP; "
        "this panel fills in automatically from the same BFF summary."
    )
else:
    st.altair_chart(
        alt.Chart(decisions)
        .mark_bar(height={"band": 0.6}, stroke="white", strokeWidth=2)
        .encode(
            x=alt.X("sum(count):Q", stack="normalize", title="Share of decided suggestions", axis=alt.Axis(format="%")),
            color=alt.Color(
                "decision:N",
                title=None,
                scale=alt.Scale(domain=list(DECISION_COLORS), range=list(DECISION_COLORS.values())),
                legend=alt.Legend(orient="top"),
            ),
            order=alt.Order("decision_order:Q"),
            tooltip=[alt.Tooltip("decision:N", title="Decision"), alt.Tooltip("count:Q", title="Suggestions")],
        )
        .transform_calculate(decision_order="indexof(['Relevant', 'Not relevant', 'Ignored'], datum.decision)")
        .properties(height=70),
        width="stretch",
    )
    st.dataframe(decisions, hide_index=True)
