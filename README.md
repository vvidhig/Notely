# Notely

> Real-time voice notes and conversation analysis for tutors, coaches, freelancers, and anyone whose conversations matter.

## What It Does

Notely has two modes:

**Quick Notes** — Tap to record 5–15 second voice clips or type notes during a live session. AI drops in contextual suggestions every 3 notes. End the session to get a structured summary synced to Notion.

**Record Conversation** — Record a full 2–5 minute conversation chunk. AI transcribes it, identifies who said what, splits it into speaker-labelled bubbles, and generates a structured summary and key evaluations.

## Features

- **Voice-to-Text** — Short voice clips (Quick Notes) or full conversation recordings, transcribed via Groq Whisper API
- **AI Suggestions** — Context-aware suggestions during Quick Notes (auto every 3 notes + manual sparkle button), powered by LLaMA 3.3 70B on Groq
- **Speaker Diarization** — LLM-based speaker identification from conversation text; no audio fingerprinting needed
- **6 Session Types** — Tutoring, Coaching, Client Call, Meeting, Interview, Custom — tags, summaries, and AI prompts adapt to each type
- **Notion Sync** — OAuth2 connection; one click syncs a rich formatted page (metadata callout, transcript, evaluation callout) to any database
- **Session History** — Browse, resume, or review summaries of all past sessions

## Tech Stack

| Layer | Stack |
|---|---|
| Frontend | React 19, TypeScript, Tailwind CSS v4, Vite 8, React Router v7 |
| Backend | FastAPI, SQLAlchemy + SQLite, python-jose, passlib |
| AI / Voice | Groq API — `whisper-large-v3-turbo` (STT) + `llama-3.3-70b-versatile` (LLM) |
| Notion | Official Notion REST API, OAuth2 |
| Deploy | Vercel (frontend) + Render (backend) |

## Local Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- [Groq API key](https://console.groq.com) (free)
- Notion integration (optional — see below)

### Backend

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Fill in your GROQ_API_KEY in .env

uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### First Run

1. Register an account
2. Click **New Session** — pick a type, enter participants, choose a mode
3. **Quick Notes:** tap the mic or type notes; use ✨ to get AI suggestions
4. **Conversation:** tap the big record button, speak naturally, tap again to process
5. Click **End Session** → review the summary → **Sync to Notion** (if connected)

## Notion Setup

1. Go to [notion.so/my-integrations](https://notion.so/my-integrations) → New integration
2. Copy the Client ID and Client Secret into `backend/.env`
3. Add `http://localhost:8000/api/notion/callback` as a redirect URI
4. In Notely's dashboard, click **Connect Notion** and authorize

## Deployment

### Backend → Render

1. Push to GitHub
2. Render → New Web Service → select your repo, root dir `backend`
3. The `render.yaml` handles build/start commands automatically
4. Set env vars: `GROQ_API_KEY`, `NOTION_CLIENT_ID`, `NOTION_CLIENT_SECRET`, `NOTION_REDIRECT_URI` (production URL), `CORS_ORIGINS` (production frontend URL), `JWT_SECRET`

### Frontend → Vercel

1. Vercel → New Project → import repo, root dir `frontend`
2. Set env var: `VITE_API_URL=https://your-app.onrender.com`
3. `vercel.json` handles SPA routing automatically

After deploy:
- Update `NOTION_REDIRECT_URI` to `https://your-backend.onrender.com/api/notion/callback`
- Update `CORS_ORIGINS` to your Vercel frontend URL

## Session Types & Adaptive Behavior

| Type | Default Tags | Summary Sections |
|---|---|---|
| Tutoring | Homework, Struggled, Good At, Important, Next Time | Topics Covered, Understood, Struggled With, Homework, Next Session |
| Coaching | Goal, Progress, Blocker, Action Item, Follow Up | Goals Discussed, Progress, Blockers, Action Items, Next Session |
| Client Call | Requirement, Decision, Question, Deliverable, Deadline | Requirements, Decisions, Open Questions, Deliverables, Timeline |
| Meeting | Decision, Action Item, FYI, Blocker, Follow Up | Agenda Covered, Decisions Made, Action Items, Owners, Follow-ups |
| Interview | Strength, Concern, Question, Follow Up | Questions Asked, Key Answers, Strengths, Concerns, Next Steps |
| Custom | Important, Action Item, Question, Follow Up | Key Points, Decisions, Action Items, Follow-ups |

---

Built by Vidhi Gupta · MIT License
