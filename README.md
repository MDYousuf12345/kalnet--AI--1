# KALNET AI-1 LLM Sales Agents

Groq-powered implementation of the KALNET AI-1 Sales Agents guide. The original guide uses Gemini 1.5 Flash; this project keeps the same agent architecture, workflows, structured JSON outputs, FastAPI routes, and internal tool UI while replacing Gemini completely with Groq.

## Architecture

- `agents/base.py` initializes the shared Groq LLM once and exports response, prompt, and JSON helpers.
- `agents/lead_research_agent.py` fetches AI-2 lead data, scrapes institution websites with Requests and BeautifulSoup, and returns structured lead intelligence.
- `agents/proposal_generator.py` turns a plain project description into a KALNET proposal JSON object.
- `agents/email_personaliser.py` generates short personalized outreach emails and supports batch processing.
- `prompts/*.txt` contains all agent prompts.
- `api/routes.py` exposes FastAPI routes.
- `backend/main.py` is the FastAPI app entrypoint.
- `frontend/` contains the Next.js internal tool.

## Setup

Create `.env` from `.env.example` and set:

```env
GROQ_API_KEY=your_groq_key
GROQ_MODEL=llama-3.3-70b-versatile
AI2_API_BASE=https://kalnet-dashboard-api-3.onrender.com
```

Install backend dependencies:

```powershell
python -m venv venv
venv\Scripts\pip install -r requirements.txt
```

Run the backend:

```powershell
venv\Scripts\python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

Run the frontend:

```powershell
cd frontend
npm install
npm run dev -- --port 3000
```

Open:

- API health: `http://127.0.0.1:8000/health`
- Swagger UI: `http://127.0.0.1:8000/docs`
- Internal tool: `http://127.0.0.1:3000`

## API Routes

- `POST /agent/research`
- `POST /agent/proposal`
- `POST /agent/email`
- `POST /agent/batch-email`
- `GET /agent/leads`
