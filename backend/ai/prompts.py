SUGGESTION_PROMPT = """You are a helpful assistant during a live {session_type} session between {participants}.

Notes taken so far:
{notes_with_tags}

Provide 1-2 brief, actionable suggestions relevant to this type of session. Keep each to 1-2 sentences. Be specific to the content, not generic."""

MANUAL_SUGGESTION_PROMPT = """You are a helpful assistant during a live {session_type} session between {participants}.

All notes from this session:
{notes_with_tags}

The user is specifically asking for a suggestion. Provide 1-2 actionable, specific suggestions based on everything so far. Keep each to 1-2 sentences."""

NEXT_SESSION_PLAN_PROMPT = """You are organizing session notes from a {session_type} session between {participants}.

Notes (each with source type and optional tag):
{notes_with_tags_and_sources}

Create a structured next session plan. For {session_type} sessions, focus on:
{summary_focus}

Include 3-5 specific, actionable items for the next session.
Return as a numbered list. Be specific and practical."""

CONVERSATION_ANALYSIS_PROMPT = """You are analyzing a transcribed conversation.

Session context:
- Type: {session_type}
- Participants: {participant_names}

The transcript has no speaker labels. Identify who said what based on conversational context, roles, and flow. Use the participant names as speaker labels. If uncertain about a segment, use "Unclear".

Transcript:
{raw_transcript}

Return a JSON object with this EXACT structure (no markdown, no backticks, just raw JSON):
{{
  "conversation": [
    {{"speaker": "participant_name", "text": "what they said"}},
    ...
  ],
  "summary": {summary_schema},
  "key_evaluations": [
    "observation 1",
    "observation 2"
  ]
}}

For {session_type}, use this summary schema:
{summary_schema_description}

Each field in summary should be an array of strings.
Return ONLY valid JSON. No markdown, no backticks, no preamble."""

SUMMARY_FOCUS = {
    "tutoring": "topics covered, what the student understood vs struggled with, homework, and what to cover next",
    "coaching": "goals discussed, progress made, blockers encountered, and action items",
    "client_call": "requirements gathered, decisions made, open questions, and deliverables",
    "meeting": "agenda covered, decisions made, action items and owners, and follow-ups",
    "interview": "questions asked, key answers, candidate strengths and concerns, and next steps",
    "custom": "key points discussed, decisions made, action items, and follow-ups",
}

DIARIZATION_PROMPT = """You are analyzing a raw transcript from a {session_type} session between {participants}.

The transcript has no speaker labels. Go through it sentence by sentence and assign each sentence or natural turn to a speaker.

Use ONLY these participant names as speaker labels: {participant_list}
Use "Unclear" for segments that are genuinely ambiguous.

Infer speakers from:
- Conversational role (who is guiding vs responding, who asks vs answers)
- Topic ownership (who explains, who learns)
- Linguistic patterns (questions vs statements, formal vs casual)
- Turn-taking flow (speakers generally alternate)

Raw transcript:
{transcript}

Return ONLY a valid JSON array — no markdown, no backticks, no explanation:
[
  {{"speaker": "Name", "text": "what they said"}},
  ...
]"""

SEGMENT_ANALYSIS_PROMPT = """You are analyzing a labeled conversation from a {session_type} session between {participants}.

Conversation:
{labeled_conversation}

Generate a structured analysis. Return ONLY valid JSON — no markdown, no backticks:
{{
  "summary": {summary_schema},
  "key_evaluations": ["observation 1", "observation 2", "observation 3"]
}}

For this {session_type} session, focus on: {summary_focus}
Each summary field must be an array of strings. Include 2-4 key_evaluations that are specific and actionable.
Return ONLY valid JSON."""

CHUNK_CHAT_SYSTEM = """You are a helpful assistant with full context of a {session_type} conversation between {participants}.

Conversation transcript:
{conversation}

Answer questions about what was discussed, who said what, what was decided, and what should happen next. Be specific — reference what was actually said. Keep answers to 2-4 sentences unless more detail is clearly needed."""

SUMMARY_SCHEMAS = {
    "tutoring": '{"topics_covered": [], "understood": [], "struggled_with": [], "homework": [], "next_session": []}',
    "coaching": '{"goals_discussed": [], "progress": [], "blockers": [], "action_items": [], "next_session": []}',
    "client_call": '{"requirements": [], "decisions": [], "open_questions": [], "deliverables": [], "timeline": []}',
    "meeting": '{"agenda_covered": [], "decisions_made": [], "action_items": [], "owners": [], "follow_ups": []}',
    "interview": '{"questions_asked": [], "key_answers": [], "strengths": [], "concerns": [], "next_steps": []}',
    "custom": '{"key_points": [], "decisions": [], "action_items": [], "follow_ups": []}',
}
