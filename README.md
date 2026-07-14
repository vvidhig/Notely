# Notely

**Record meetings. Get things done.**

Notely is an all-in-one productivity workspace: record meetings and sessions, let AI split the transcript by speaker and generate structured summaries, highlight the moments that matter, turn them into tasks, and track your work — all in one place.

## Features

- 🎙 **Meeting recording** — record short voice clips or full conversations, transcribed instantly (Groq Whisper)
- 🤖 **AI summaries** — every meeting ends with a structured summary: decisions, action items, next steps (LLaMA 3.3 70B via Groq)
- 🗣 **Speaker diarization** — AI identifies who said what in a recorded conversation
- ✨ **Highlights** — select text in any transcript to highlight it, review all highlights later, and convert them into tasks in one tap
- ✅ **Task tracking** — kanban board (To Do / In Progress / Done) with priorities, tags, due dates, and a finish checkbox on every card
- 🗓 **Schedule** — weekly calendar showing tasks due, sessions, and meetings
- 🏠 **Dashboard** — daily progress ring, upcoming tasks, recent sessions, focus streak

## Tech stack

| Layer    | Stack                                              |
|----------|----------------------------------------------------|
| Frontend | React 19 + TypeScript, Vite, Tailwind CSS v4       |
| Backend  | FastAPI (Python 3.11), SQLAlchemy, SQLite          |
| Auth     | JWT (python-jose) + bcrypt                         |
| AI       | Groq API — Whisper (transcription), LLaMA 3.3 70B  |

## Project structure

```
Notely/
├── render.yaml          # Render deploy config (backend web service)
├── backend/             # FastAPI app — entry point: main.py
│   ├── main.py
│   ├── auth/ sessions/ notes/ tasks/ highlights/ meetings/ ...
│   └── requirements.txt
└── frontend/            # React + Vite app
    └── src/
        ├── pages/       # Landing, Login, Home, Tasks, Sessions, Highlights, Schedule
        ├── components/  # Sidebar, TaskModal, CalendarWidget, ...
        └── hooks/       # useTasks, useHighlights, useTextHighlight, ...
```

## Running locally

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows (source venv/bin/activate on macOS/Linux)
pip install -r requirements.txt
uvicorn main:app --reload    # http://localhost:8000
```

Create `backend/.env`:

```env
JWT_SECRET=change-me
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=1440
GROQ_API_KEY=your-groq-api-key      # required for transcription + AI summaries
DATABASE_URL=sqlite:///./notely.db
CORS_ORIGINS=http://localhost:5173
```

### Frontend

```bash
cd frontend
npm install
npm run dev                  # http://localhost:5173
```

Optional `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
```

## Deploying to Render

The repo ships with a `render.yaml` blueprint for the backend. Render picks it up automatically when you create a new **Blueprint** from this repo.

**Backend (web service):**

| Setting        | Value                                          |
|----------------|------------------------------------------------|
| Root directory | `backend`                                      |
| Build command  | `pip install -r requirements.txt`              |
| **Start command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |

The start command is the important one: Render injects the port through the `$PORT` env var, and binding to `0.0.0.0` makes the service reachable from outside the container. Python is pinned to 3.11.9 via `backend/runtime.txt`.

Set these environment variables in the Render dashboard: `GROQ_API_KEY`, `CORS_ORIGINS` (your frontend URL), and let Render generate `JWT_SECRET`.

> **Note:** on the free plan there is no persistent disk, so the SQLite database resets on every deploy/restart. Attach a disk (paid) or point `DATABASE_URL` at a hosted Postgres to keep data.

**Frontend (static site):**

| Setting           | Value                        |
|-------------------|------------------------------|
| Root directory    | `frontend`                   |
| Build command     | `npm install && npm run build` |
| Publish directory | `dist`                       |

Set `VITE_API_URL` to your backend URL (e.g. `https://notely-backend.onrender.com`) in the static site's environment variables, and add a rewrite rule `/* → /index.html` so client-side routing works.

## License

MIT — free to use, yours to own.
