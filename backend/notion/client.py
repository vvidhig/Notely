import httpx
import re
from datetime import datetime

NOTION_API_BASE = "https://api.notion.com/v1"
NOTION_VERSION = "2022-06-28"
_BLOCK_LIMIT = 100  # Notion API limit per request


def _headers(token: str) -> dict:
    return {
        "Authorization": f"Bearer {token}",
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
    }


def list_databases(token: str) -> list[dict]:
    with httpx.Client() as client:
        resp = client.post(
            f"{NOTION_API_BASE}/search",
            headers=_headers(token),
            json={"filter": {"value": "database", "property": "object"}, "page_size": 50},
        )
        resp.raise_for_status()
    results = resp.json().get("results", [])
    databases = []
    for db in results:
        title = _extract_title(db.get("title", []))
        databases.append({"id": db["id"], "title": title or "Untitled", "url": db.get("url", "")})
    return databases


def list_pages(token: str, database_id: str) -> list[dict]:
    with httpx.Client() as client:
        resp = client.post(
            f"{NOTION_API_BASE}/databases/{database_id}/query",
            headers=_headers(token),
            json={"page_size": 50},
        )
        resp.raise_for_status()
    results = resp.json().get("results", [])
    pages = []
    for page in results:
        title = _get_page_title(page)
        pages.append({"id": page["id"], "title": title or "Untitled", "url": page.get("url", "")})
    return pages


def create_session_page(
    token: str,
    database_id: str,
    title: str,
    session_type: str,
    participants: str | None,
    started_at: datetime | None,
    duration_minutes: int | None,
    mode: str,
    summary: str | None,
    speaker_notes: list[dict] | None = None,
    key_evaluations: list[str] | None = None,
) -> dict:
    blocks = _build_page_blocks(
        session_type=session_type,
        participants=participants,
        started_at=started_at,
        duration_minutes=duration_minutes,
        mode=mode,
        summary=summary,
        speaker_notes=speaker_notes,
        key_evaluations=key_evaluations,
    )

    first_batch = blocks[:_BLOCK_LIMIT]
    overflow = blocks[_BLOCK_LIMIT:]

    with httpx.Client() as client:
        resp = client.post(
            f"{NOTION_API_BASE}/pages",
            headers=_headers(token),
            json={
                "parent": {"database_id": database_id},
                "properties": {
                    "title": {"title": [{"type": "text", "text": {"content": title}}]},
                },
                "children": first_batch,
            },
        )
        resp.raise_for_status()
        page_data = resp.json()
        page_id = page_data["id"]

        # Append remaining blocks in batches of 100
        while overflow:
            batch = overflow[:_BLOCK_LIMIT]
            overflow = overflow[_BLOCK_LIMIT:]
            append_resp = client.patch(
                f"{NOTION_API_BASE}/blocks/{page_id}/children",
                headers=_headers(token),
                json={"children": batch},
            )
            append_resp.raise_for_status()

    return {"id": page_id, "url": page_data.get("url", "")}


def _build_page_blocks(
    session_type: str,
    participants: str | None,
    started_at: datetime | None,
    duration_minutes: int | None,
    mode: str,
    summary: str | None,
    speaker_notes: list[dict] | None,
    key_evaluations: list[str] | None,
) -> list[dict]:
    blocks: list[dict] = []

    # ── Metadata callout ─────────────────────────────────────────────────────
    meta_lines = [f"📋 {session_type.replace('_', ' ').title()}"]
    if participants:
        meta_lines.append(f"👥 {participants}")
    if started_at:
        meta_lines.append(f"📅 {started_at.strftime('%B %d, %Y · %I:%M %p')}")
    if duration_minutes is not None:
        meta_lines.append(f"⏱️ {duration_minutes} min")
    blocks.append(_callout("\n".join(meta_lines), emoji="📝"))
    blocks.append(_divider())

    # ── Summary sections ──────────────────────────────────────────────────────
    if summary and summary.strip():
        blocks.extend(_markdown_to_blocks(summary))
        blocks.append(_divider())

    # ── Conversation transcript (conversation mode only) ──────────────────────
    if mode in ("conversation", "record_conversation") and speaker_notes:
        blocks.append(_heading(2, "Conversation Transcript"))
        for segment in speaker_notes:
            speaker = segment.get("speaker") or "Unknown"
            text = segment.get("text", "").strip()
            if text:
                blocks.append(_quote(f"{speaker}: {text}"))

    # ── Key evaluations callout ───────────────────────────────────────────────
    if key_evaluations:
        blocks.append(_divider())
        eval_text = "\n".join(f"• {e}" for e in key_evaluations)
        blocks.append(_callout(f"🔍 Key Evaluations\n{eval_text}", emoji="🤖"))

    return blocks


# ── Block constructors ────────────────────────────────────────────────────────

def _rich(text: str) -> list[dict]:
    # Truncate single text object to Notion's 2000-char limit
    return [{"type": "text", "text": {"content": text[:2000]}}]


def _heading(level: int, text: str) -> dict:
    key = f"heading_{level}"
    return {"object": "block", "type": key, key: {"rich_text": _rich(text)}}


def _bullet(text: str) -> dict:
    return {
        "object": "block",
        "type": "bulleted_list_item",
        "bulleted_list_item": {"rich_text": _rich(text)},
    }


def _paragraph(text: str) -> dict:
    return {"object": "block", "type": "paragraph", "paragraph": {"rich_text": _rich(text)}}


def _quote(text: str) -> dict:
    return {"object": "block", "type": "quote", "quote": {"rich_text": _rich(text)}}


def _callout(text: str, emoji: str = "💡") -> dict:
    return {
        "object": "block",
        "type": "callout",
        "callout": {
            "rich_text": _rich(text),
            "icon": {"type": "emoji", "emoji": emoji},
        },
    }


def _divider() -> dict:
    return {"object": "block", "type": "divider", "divider": {}}


def _markdown_to_blocks(markdown: str) -> list[dict]:
    blocks = []
    for line in markdown.splitlines():
        line = line.rstrip()
        if not line:
            continue
        if line.startswith("## "):
            blocks.append(_heading(2, line[3:]))
        elif line.startswith("# "):
            blocks.append(_heading(1, line[2:]))
        elif line.startswith("**") and line.endswith("**"):
            blocks.append(_heading(3, line[2:-2]))
        elif re.match(r"^\d+\.\s+\*\*(.+)\*\*$", line):
            text = re.sub(r"^\d+\.\s+\*\*(.+)\*\*$", r"\1", line)
            blocks.append(_heading(3, text))
        elif line.startswith("- ") or line.startswith("* "):
            blocks.append(_bullet(line[2:]))
        else:
            blocks.append(_paragraph(line))
    return blocks


# ── Internal helpers ──────────────────────────────────────────────────────────

def _extract_title(rich_text_list: list) -> str:
    return "".join(t.get("plain_text", "") for t in rich_text_list)


def _get_page_title(page: dict) -> str:
    for prop in page.get("properties", {}).values():
        if prop.get("type") == "title":
            return _extract_title(prop.get("title", []))
    return ""
