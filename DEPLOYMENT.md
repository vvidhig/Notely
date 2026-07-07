# DEPLOYMENT.md — Deploying Notely

## Backend — Render (Free Tier)

### Step 1: Prepare

Ensure your backend has:
- `requirements.txt` with all dependencies
- A `Procfile` or Render will auto-detect FastAPI

Create a `render.yaml` in backend root:
```yaml
services:
  - type: web
    name: notely-backend
    runtime: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: JWT_SECRET
        sync: false
      - key: GROQ_API_KEY
        sync: false
      - key: NOTION_CLIENT_ID
        sync: false
      - key: NOTION_CLIENT_SECRET
        sync: false
      - key: NOTION_REDIRECT_URI
        sync: false
```

### Step 2: Deploy

1. Push backend code to GitHub
2. Go to render.com → New → Web Service
3. Connect your GitHub repo
4. Select the backend directory
5. Add all environment variables
6. Deploy

### Step 3: Note on Faster-Whisper

Render free tier has limited memory. If Faster-Whisper causes memory issues:
- Use the `tiny` or `base` model instead of `small`
- Or switch to Groq's Whisper API (free, cloud-based) as a fallback

---

## Frontend — Vercel (Free Tier)

### Step 1: Prepare

Update `frontend/.env.production`:
```
VITE_API_URL=https://your-notely-backend.onrender.com
```

### Step 2: Deploy

1. Push frontend code to GitHub
2. Go to vercel.com → New Project
3. Import your GitHub repo
4. Set root directory to `frontend`
5. Framework preset: Vite
6. Add environment variable: `VITE_API_URL`
7. Deploy

---

## Post-Deployment Checklist

- [ ] Update Notion OAuth redirect URI to production backend URL
- [ ] Update CORS_ORIGINS in backend to production frontend URL
- [ ] Test full flow: register → connect Notion → start session → voice note → summarize → sync
- [ ] Check Render logs for any memory issues with Whisper
