# SETUP.md — Local Development Setup

## Prerequisites

- Python 3.11+
- Node.js 18+
- npm or yarn
- A Groq API key (free at console.groq.com)
- A Notion integration (see NOTION_SETUP.md)

---

## Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Copy env template and fill in your keys
cp .env.example .env

# Run the server
uvicorn main:app --reload --port 8000
```

### Backend Dependencies (requirements.txt)
```
fastapi==0.111.0
uvicorn==0.30.1
sqlalchemy==2.0.30
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.9
pydantic==2.7.1
httpx==0.27.0
faster-whisper==1.0.2
groq==0.8.0
python-dotenv==1.0.1
```

---

## Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy env template
cp .env.example .env

# Run dev server
npm run dev
```

Frontend runs at http://localhost:5173
Backend runs at http://localhost:8000

---

## First Run Checklist

1. Backend is running on port 8000
2. Frontend is running on port 5173
3. Register a new account via the UI
4. Connect your Notion workspace via OAuth
5. Start your first session
