DEFAULT_TAGS: dict[str, list[tuple[str, str]]] = {
    "tutoring": [
        ("Homework", "#6366f1"),
        ("Struggled", "#ef4444"),
        ("Good At", "#22c55e"),
        ("Important", "#f59e0b"),
        ("Next Time", "#8b5cf6"),
    ],
    "coaching": [
        ("Goal", "#6366f1"),
        ("Progress", "#22c55e"),
        ("Blocker", "#ef4444"),
        ("Action Item", "#f59e0b"),
        ("Follow Up", "#8b5cf6"),
    ],
    "client_call": [
        ("Requirement", "#6366f1"),
        ("Decision", "#22c55e"),
        ("Question", "#f59e0b"),
        ("Deliverable", "#ef4444"),
        ("Deadline", "#8b5cf6"),
    ],
    "meeting": [
        ("Decision", "#6366f1"),
        ("Action Item", "#f59e0b"),
        ("FYI", "#22c55e"),
        ("Blocker", "#ef4444"),
        ("Follow Up", "#8b5cf6"),
    ],
    "interview": [
        ("Strength", "#22c55e"),
        ("Concern", "#ef4444"),
        ("Question", "#f59e0b"),
        ("Follow Up", "#8b5cf6"),
    ],
    "custom": [
        ("Important", "#6366f1"),
        ("Action Item", "#f59e0b"),
        ("Question", "#22c55e"),
        ("Follow Up", "#8b5cf6"),
    ],
}

SUMMARY_SECTIONS: dict[str, list[str]] = {
    "tutoring": ["Topics Covered", "Understood", "Struggled With", "Homework", "Next Session"],
    "coaching": ["Goals Discussed", "Progress", "Blockers", "Action Items", "Next Session"],
    "client_call": ["Requirements", "Decisions", "Open Questions", "Deliverables", "Timeline"],
    "meeting": ["Agenda Covered", "Decisions Made", "Action Items", "Owners", "Follow-ups"],
    "interview": ["Questions Asked", "Key Answers", "Strengths", "Concerns", "Next Steps"],
    "custom": ["Key Points", "Decisions", "Action Items", "Follow-ups"],
}

VALID_SESSION_TYPES = list(DEFAULT_TAGS.keys())
