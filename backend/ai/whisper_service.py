import os
from groq import Groq

_client: Groq | None = None


def _get_client() -> Groq:
    global _client
    if _client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key or api_key == "your-groq-api-key":
            raise RuntimeError("GROQ_API_KEY is not configured")
        _client = Groq(api_key=api_key, timeout=60.0)
    return _client


def transcribe_audio(file_path: str, context_prompt: str = "") -> str:
    client = _get_client()
    filename = os.path.basename(file_path)
    with open(file_path, "rb") as f:
        audio_bytes = f.read()

    result = client.audio.transcriptions.create(
        file=(filename, audio_bytes),
        model="whisper-large-v3-turbo",
        response_format="verbose_json",
        language="en",
        prompt=context_prompt or "Conversation note.",
    )
    text = result.text.strip()

    # Reject known Whisper hallucinations on empty/silent audio
    _hallucinations = {
        "thank you", "thanks for watching", "bye", "you", "goodbye",
        "thank you for watching", "thanks", "see you", "see you next time",
        "i'm going to go", "you're welcome", "welcome", ".", "",
    }
    if text.lower().rstrip(".!?,") in _hallucinations:
        return ""

    return text
