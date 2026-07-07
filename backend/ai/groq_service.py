import os
import json
import re
from groq import Groq
from ai.prompts import (
    SUGGESTION_PROMPT,
    MANUAL_SUGGESTION_PROMPT,
    NEXT_SESSION_PLAN_PROMPT,
    DIARIZATION_PROMPT,
    SEGMENT_ANALYSIS_PROMPT,
    CHUNK_CHAT_SYSTEM,
    SUMMARY_FOCUS,
    SUMMARY_SCHEMAS,
)

_client: Groq | None = None
MODEL = "llama-3.3-70b-versatile"


def _get_client() -> Groq:
    global _client
    if _client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key or api_key == "your-groq-api-key":
            raise RuntimeError("GROQ_API_KEY is not configured")
        _client = Groq(api_key=api_key, timeout=30.0)
    return _client


def get_suggestions(session_id: int, db, manual: bool = False) -> str:
    """Fetch session + notes from DB, then call Groq for suggestions."""
    from database.models import Note, Session as SessionModel

    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise ValueError(f"Session {session_id} not found")

    session_type = session.session_type or "custom"
    participants = session.participants or "participants"

    notes = (
        db.query(Note)
        .filter(Note.session_id == session_id, Note.source != "ai_suggestion")
        .order_by(Note.timestamp.asc())
        .all()
    )
    notes_with_tags = "\n".join(
        f"[{n.source}]{' [' + n.tag + ']' if n.tag else ''} {n.content}"
        for n in notes
    )

    prompt_template = MANUAL_SUGGESTION_PROMPT if manual else SUGGESTION_PROMPT
    prompt = prompt_template.format(
        session_type=session_type,
        participants=participants,
        notes_with_tags=notes_with_tags,
    )

    client = _get_client()
    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        max_tokens=300,
    )
    return response.choices[0].message.content


def generate_next_session_plan(
    notes_text: str,
    session_type: str = "custom",
    participants: str = "participants",
) -> str:
    focus = SUMMARY_FOCUS.get(session_type, SUMMARY_FOCUS["custom"])
    prompt = NEXT_SESSION_PLAN_PROMPT.format(
        session_type=session_type,
        participants=participants,
        notes_with_tags_and_sources=notes_text,
        summary_focus=focus,
    )
    client = _get_client()
    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=600,
    )
    return response.choices[0].message.content


def _extract_json(text: str, expected_type: type):
    """Try to parse JSON from raw text, then from a code fence, then from the first bracket-delimited block."""
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    fence = re.search(r'```(?:json)?\s*([\s\S]+?)\s*```', text)
    if fence:
        return json.loads(fence.group(1))
    # Grab first array or object depending on expected type
    pattern = r'\[[\s\S]+\]' if expected_type is list else r'\{[\s\S]+\}'
    block = re.search(pattern, text)
    if block:
        return json.loads(block.group(0))
    raise ValueError(f"Could not parse JSON from response: {text[:300]}")


def analyze_conversation(
    transcript: str,
    session_type: str,
    participant_names: list[str],
) -> dict:
    """Two-call pipeline: diarize (low temp) then analyze (medium temp)."""
    client = _get_client()
    participants_str = ", ".join(participant_names) if participant_names else "participants"

    # ── Call 1: Speaker diarization ──
    diarize_prompt = DIARIZATION_PROMPT.format(
        session_type=session_type,
        participants=participants_str,
        participant_list=participants_str,
        transcript=transcript,
    )
    diarize_resp = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": diarize_prompt}],
        temperature=0.1,
        max_tokens=2000,
    )
    segments = _extract_json(diarize_resp.choices[0].message.content, list)
    if not isinstance(segments, list):
        raise ValueError("Diarization did not return a list")

    # ── Call 2: Summary + evaluations (using labeled segments) ──
    labeled_conversation = "\n".join(
        f"{seg.get('speaker', 'Unknown')}: {seg.get('text', '')}"
        for seg in segments
    )
    summary_schema = SUMMARY_SCHEMAS.get(session_type, SUMMARY_SCHEMAS["custom"])
    focus = SUMMARY_FOCUS.get(session_type, SUMMARY_FOCUS["custom"])

    analysis_prompt = SEGMENT_ANALYSIS_PROMPT.format(
        session_type=session_type,
        participants=participants_str,
        labeled_conversation=labeled_conversation,
        summary_schema=summary_schema,
        summary_focus=focus,
    )
    analysis_resp = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": analysis_prompt}],
        temperature=0.3,
        max_tokens=1500,
    )
    analysis = _extract_json(analysis_resp.choices[0].message.content, dict)

    return {
        "conversation": segments,
        "summary": analysis.get("summary", {}),
        "key_evaluations": analysis.get("key_evaluations", []),
    }


def reformat_text(text: str) -> str:
    """Clean up transcribed speech — fix grammar, remove fillers, fix punctuation."""
    client = _get_client()
    response = client.chat.completions.create(
        model=MODEL,
        messages=[{
            "role": "user",
            "content": (
                "Clean up and lightly format this transcribed speech. "
                "Fix obvious grammar errors, remove filler words (um, uh, like), "
                "fix punctuation, and make it read naturally. "
                "Do NOT change the meaning or add any new content. "
                "Return only the cleaned text, nothing else.\n\n"
                f"{text}"
            ),
        }],
        temperature=0.3,
        max_tokens=500,
    )
    return response.choices[0].message.content.strip()


def chat_about_chunk(
    conversation_text: str,
    session_type: str,
    participants: str,
    question: str,
    history: list[dict],
) -> str:
    system_prompt = CHUNK_CHAT_SYSTEM.format(
        session_type=session_type,
        participants=participants,
        conversation=conversation_text,
    )
    messages = [{"role": "system", "content": system_prompt}]
    for h in history:
        role = h.get("role", "user")
        if role in ("user", "assistant"):
            messages.append({"role": role, "content": h.get("content", "")})
    messages.append({"role": "user", "content": question})

    client = _get_client()
    response = client.chat.completions.create(
        model=MODEL,
        messages=messages,
        temperature=0.5,
        max_tokens=500,
    )
    return response.choices[0].message.content
