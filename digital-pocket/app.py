import os
import re
import requests
import streamlit as st
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import NoTranscriptFound, TranscriptsDisabled

NEBIUS_URL = "https://api.tokenfactory.nebius.com/v1/chat/completions"
MODEL = "meta-llama/Llama-3.3-70B-Instruct"
API_KEY = os.environ.get("NEBIUS_API_KEY", "") or st.secrets.get("NEBIUS_API_KEY", "")

st.set_page_config(page_title="Digital Pocket MVP", layout="wide")
st.title("🗂 Digital Pocket MVP")
st.caption("Paste YouTube links → real transcript → summary, tags, KG, importance. Then ask questions.")

if not API_KEY:
    st.error("NEBIUS_API_KEY environment variable is not set. Run: export NEBIUS_API_KEY=your_key")
    st.stop()

if "saved" not in st.session_state:
    st.session_state.saved = []


def nebius_chat(messages: list, max_tokens: int = 800) -> str:
    resp = requests.post(
        NEBIUS_URL,
        headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"},
        json={"model": MODEL, "messages": messages, "max_tokens": max_tokens},
        timeout=90,
    )
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"].strip()


def extract_youtube_id(url: str) -> str:
    m = re.search(r"(?:v=|youtu\.be/)([A-Za-z0-9_-]{11})", url)
    return m.group(1) if m else ""


def get_transcript(video_id: str) -> tuple[str, str]:
    """Returns (transcript_text, language_note)."""
    api = YouTubeTranscriptApi()
    try:
        # Try English first, then any available language
        try:
            snippet = api.fetch(video_id, languages=["en"])
            lang = "English"
        except NoTranscriptFound:
            listed = api.list(video_id)
            available = list(listed)
            if not available:
                return "", ""
            lang_code = available[0].language_code
            lang = available[0].language
            snippet = api.fetch(video_id, languages=[lang_code])

        entries = list(snippet)
        text = " ".join(e.text for e in entries)
        words = text.split()
        trimmed = " ".join(words[:4000]) + ("…" if len(words) > 4000 else "")
        return trimmed, lang
    except (NoTranscriptFound, TranscriptsDisabled):
        return "", ""
    except Exception:
        return "", ""


def analyze_link(url: str) -> dict:
    vid_id = extract_youtube_id(url)
    transcript, lang = get_transcript(vid_id) if vid_id else ("", "")

    if transcript:
        context = f"VIDEO TRANSCRIPT ({lang}):\n{transcript}"
        source_note = f"✅ Transcript fetched ({lang})"
        lang_note = f"The transcript is in {lang}. Summarize and respond in English regardless."
    else:
        context = f"VIDEO URL: {url}\n(No transcript available — infer from URL.)"
        source_note = "⚠️ No transcript — inferred from URL"
        lang_note = ""

    prompt = f"""{lang_note}
{context}

Analyze the above and respond in EXACTLY this format (no extra text):

SUMMARY: <2-3 sentence summary of what the video covers>
TAGS: <5-7 specific tags, comma-separated>
IMPORTANCE: <score 1-10>/10 — <one-line reason>
KG:
- <Entity 1> | <relationship> | <Entity 2>
- <Entity 2> | <relationship> | <Entity 3>
- <Entity 3> | <relationship> | <Entity 4>
(list 4-6 key entity-relationship triples from the content)"""

    content = nebius_chat([{"role": "user", "content": prompt}])

    summary = tags = importance = ""
    kg_lines = []
    in_kg = False

    for line in content.splitlines():
        line = line.strip()
        if line.startswith("SUMMARY:"):
            summary = line[len("SUMMARY:"):].strip()
            in_kg = False
        elif line.startswith("TAGS:"):
            tags = line[len("TAGS:"):].strip()
            in_kg = False
        elif line.startswith("IMPORTANCE:"):
            importance = line[len("IMPORTANCE:"):].strip()
            in_kg = False
        elif line.startswith("KG:"):
            in_kg = True
        elif in_kg and line.startswith("-"):
            kg_lines.append(line[1:].strip())

    return {
        "url": url,
        "vid_id": vid_id,
        "summary": summary or content,
        "tags": tags,
        "importance": importance,
        "kg": kg_lines,
        "source_note": source_note,
        "transcript_snippet": (transcript[:300] + "…") if transcript else "",
    }


# Sidebar
with st.sidebar:
    st.header("Settings")
    st.success("API key loaded from environment ✓")
    st.markdown("---")
    st.caption(f"Model: `{MODEL}`")
    st.markdown("---")
    if st.button("🗑 Clear all saved items"):
        st.session_state.saved = []
        st.rerun()

# Section 1: Input links
st.subheader("1. Add YouTube Links")
links_input = st.text_area(
    "Paste 2–3 YouTube URLs (one per line)",
    height=120,
    placeholder="https://youtube.com/watch?v=...\nhttps://youtu.be/...",
)

if st.button("🔍 Analyze Links", type="primary"):
    urls = [u.strip() for u in links_input.strip().splitlines() if u.strip()]
    if not urls:
        st.warning("Please paste at least one YouTube URL.")
    else:
        for url in urls:
            if any(item["url"] == url for item in st.session_state.saved):
                st.info(f"Already saved: {url}")
                continue
            with st.spinner(f"Fetching transcript & analyzing {url} …"):
                try:
                    result = analyze_link(url)
                    st.session_state.saved.append(result)
                    st.success(f"Saved: {url} ({result['source_note']})")
                except Exception as e:
                    st.error(f"Error analyzing {url}: {e}")

def tts_button(text: str, key: str, label: str = "🔊 Play"):
    """Inject a button that uses browser speechSynthesis to read text aloud."""
    safe = text.replace("`", "").replace('"', '\\"').replace("\n", " ")
    st.components.v1.html(f"""
    <button onclick="
        window.speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(\\"{safe}\\");
        u.rate = 0.95;
        window.speechSynthesis.speak(u);
    " style="
        background:#4CAF50;color:white;border:none;padding:6px 14px;
        border-radius:6px;cursor:pointer;font-size:14px;margin:2px;
    ">{label}</button>
    <button onclick="window.speechSynthesis.cancel();" style="
        background:#e53935;color:white;border:none;padding:6px 14px;
        border-radius:6px;cursor:pointer;font-size:14px;margin:2px;
    ">⏹ Stop</button>
    """, height=45)


# Section 2: Display saved results
if st.session_state.saved:
    st.markdown("---")
    st.subheader("2. Saved Videos")

    # Play All button — reads all summaries back-to-back
    all_text = " ... Next video. ... ".join(
        f"Video {i+1}. {item['summary']} Tags: {item['tags']}. Importance: {item['importance']}."
        for i, item in enumerate(st.session_state.saved)
    )
    tts_button(all_text, key="play_all", label="🔊 Play All Summaries")
    st.markdown("---")

    for i, item in enumerate(st.session_state.saved):
        with st.expander(f"📹 {item['url']}", expanded=True):
            col1, col2 = st.columns([3, 1])

            with col1:
                st.caption(item.get("source_note", ""))
                st.markdown(f"**Summary:** {item['summary']}")

                if item["tags"]:
                    tag_pills = " ".join(f"`{t.strip()}`" for t in item["tags"].split(","))
                    st.markdown(f"**Tags:** {tag_pills}")

                if item["importance"]:
                    st.markdown(f"**Importance:** ⭐ {item['importance']}")

                if item.get("kg"):
                    st.markdown("**Knowledge Graph (key relationships):**")
                    for triple in item["kg"]:
                        parts = [p.strip() for p in triple.split("|")]
                        if len(parts) == 3:
                            st.markdown(f"&nbsp;&nbsp;• **{parts[0]}** → *{parts[1]}* → **{parts[2]}**")
                        else:
                            st.markdown(f"&nbsp;&nbsp;• {triple}")

                speak_text = f"{item['summary']} Tags: {item['tags']}. Importance: {item['importance']}."
                tts_button(speak_text, key=f"tts_{i}", label="🔊 Play Summary")

                if item.get("transcript_snippet"):
                    with st.expander("📄 Transcript preview"):
                        st.caption(item["transcript_snippet"])

            with col2:
                if item.get("vid_id"):
                    st.image(
                        f"https://img.youtube.com/vi/{item['vid_id']}/mqdefault.jpg",
                        use_container_width=True,
                    )
                if st.button("Remove", key=f"remove_{i}"):
                    st.session_state.saved.pop(i)
                    st.rerun()

    # Section 3: Q&A
    st.markdown("---")
    st.subheader("3. Ask a Question Across All Videos")

    question = st.text_input(
        "Your question",
        placeholder="Who scored the most runs? What are the common themes? Which video should I watch first?",
    )

    if st.button("💬 Ask") and question:
        context_parts = []
        for j, item in enumerate(st.session_state.saved, 1):
            kg_text = "\n".join(f"  - {t}" for t in item.get("kg", []))
            context_parts.append(
                f"Video {j}: {item['url']}\n"
                f"Summary: {item['summary']}\n"
                f"Tags: {item['tags']}\n"
                f"Importance: {item['importance']}\n"
                f"Key relationships:\n{kg_text}"
            )
        context = "\n\n".join(context_parts)

        messages = [
            {"role": "system", "content": "You are a helpful assistant. Answer based only on the provided video summaries and knowledge graphs."},
            {"role": "user", "content": f"Here are the saved videos:\n\n{context}\n\nQuestion: {question}"},
        ]

        with st.spinner("Thinking …"):
            try:
                answer = nebius_chat(messages, max_tokens=600)
                st.markdown("**Answer:**")
                st.info(answer)
            except Exception as e:
                st.error(f"Error: {e}")
else:
    st.info("No videos saved yet. Paste some YouTube links above and click Analyze.")
