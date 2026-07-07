import json
import os
import tempfile
import time

from typing import Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session as DbSession

from auth.utils import get_current_user
from conversation.schemas import ConversationResult
from database.connection import get_db
from database.models import Note
from database.models import Session as SessionModel
from notes.schemas import NoteResponse

router = APIRouter(prefix="/api/conversation", tags=["conversation"])


@router.post("/process", response_model=ConversationResult)
async def process_conversation(
    session_id: int = Form(...),
    audio: UploadFile = File(...),
    audio_duration_seconds: Optional[float] = Form(default=None),
    current_user=Depends(get_current_user),
    db: DbSession = Depends(get_db),
):
    # Validate session belongs to user and is active
    session = db.query(SessionModel).filter(
        SessionModel.id == session_id,
        SessionModel.user_id == current_user.id,
        SessionModel.status == "active",
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Save audio to temp file
    suffix = os.path.splitext(audio.filename or "audio.webm")[1] or ".webm"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await audio.read())
        tmp_path = tmp.name

    start_time = time.time()
    saved_notes = []

    try:
        # Get participant names before transcription so we can use them as context
        participants = session.participants or "Participant 1, Participant 2"
        participant_list = [p.strip() for p in participants.split(",")]
        session_type = session.session_type or "custom"

        from ai.whisper_service import transcribe_audio
        context_prompt = f"{session_type.replace('_', ' ').title()} conversation between {participants}."
        transcript = transcribe_audio(tmp_path, context_prompt=context_prompt)
        if not transcript.strip():
            raise HTTPException(status_code=422, detail="Could not transcribe audio")

        # Analyze with Groq — speaker diarization + structured summary
        from ai.groq_service import analyze_conversation
        analysis = analyze_conversation(transcript, session_type, participant_list)

        duration_seconds = time.time() - start_time

        # Save speaker segments as individual notes
        speaker_count = 0
        for segment in analysis.get("conversation", []):
            note = Note(
                session_id=session_id,
                content=segment.get("text", ""),
                source="conversation_speaker",
                speaker=segment.get("speaker"),
                tag=None,
            )
            db.add(note)
            db.flush()
            saved_notes.append(note)
            speaker_count += 1

        # Save structured summary as a JSON string note
        summary_data = analysis.get("summary", {})
        if summary_data:
            note = Note(
                session_id=session_id,
                content=json.dumps(summary_data),
                source="conversation_summary",
                speaker=None,
                tag=None,
            )
            db.add(note)
            db.flush()
            saved_notes.append(note)

        # Save key evaluations as a JSON string note
        evals = analysis.get("key_evaluations", [])
        if evals:
            note = Note(
                session_id=session_id,
                content=json.dumps(evals),
                source="conversation_evaluation",
                speaker=None,
                tag=None,
            )
            db.add(note)
            db.flush()
            saved_notes.append(note)

        # Update note_count and accumulate actual recording time
        session.note_count = (session.note_count or 0) + speaker_count
        session.duration_seconds = (session.duration_seconds or 0) + int(audio_duration_seconds or 0)

        db.commit()
        for n in saved_notes:
            db.refresh(n)

        note_responses = [
            NoteResponse(
                id=n.id,
                session_id=n.session_id,
                content=n.content,
                source=n.source,
                tag=n.tag,
                speaker=n.speaker,
                timestamp=n.timestamp,
            )
            for n in saved_notes
        ]

        return ConversationResult(
            notes=note_responses,
            duration_seconds=duration_seconds,
            raw_transcript=transcript,
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Conversation processing failed: {str(e)}")
    finally:
        os.unlink(tmp_path)
