# AI Cognitive Knowledge Retrieval System — Complete Project Documentation

Version: 1.0.0  
Last Updated: March 16, 2026  
Stack: Next.js 14 · React 18 · Node.js · Express · MongoDB · Firebase Auth · Gemini AI

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Current Tech Stack](#2-current-tech-stack)
3. [System Architecture](#3-system-architecture)
4. [Data Model and Database](#4-data-model-and-database)
5. [Backend API (Express)](#5-backend-api-express)
6. [Frontend (Next.js App Router)](#6-frontend-nextjs-app-router)
7. [AI Integration](#7-ai-integration)
8. [Authentication and Authorization](#8-authentication-and-authorization)
9. [UI/UX Design System](#9-uiux-design-system)
10. [Feature Matrix (Implemented)](#10-feature-matrix-implemented)
11. [Folder Structure (Actual)](#11-folder-structure-actual)
12. [Environment Variables](#12-environment-variables)
13. [Local Development Guide](#13-local-development-guide)
14. [Deployment Guide](#14-deployment-guide)
15. [API Reference](#15-api-reference)
16. [Portability and Swap Points](#16-portability-and-swap-points)
17. [Known Gaps and Notes](#17-known-gaps-and-notes)

---

## 1. Project Overview

AI Cognitive Knowledge Retrieval System is an AI-powered personal knowledge management system for capturing, organizing, and querying personal notes.

It is designed for:
- Students (lecture/research capture)
- Developers (code patterns, debugging notes, architecture notes)
- Writers and researchers
- Professionals managing meeting and domain knowledge

Core promise:

> Your knowledge, organized by AI, accessible forever.

---

## 2. Current Tech Stack

### Frontend
- Next.js 14.2.5 (App Router)
- React 18.3.1
- Tailwind CSS 3.4.6
- Framer Motion 11.3.8
- Firebase Web SDK 10.12.3
- Lucide React
- React Hot Toast
- date-fns
- cmdk (dependency present; custom palette component also implemented)

### Backend
- Node.js + Express 4.18.x
- MongoDB Node Driver 7.1.0
- Firebase Admin SDK 12.3.1
- Google Generative AI SDK (@google/generative-ai 0.21.0)
- Helmet, CORS, Morgan, Compression
- express-rate-limit

### Database
- MongoDB (primary runtime datastore)
- Collections: users, notes, conversations
- Indexed for user-scope queries, tags, sort paths, and public notes

### AI
- Google Gemini via GEMINI_API_KEY
- Default model: gemini-2.0-flash (configurable with GEMINI_MODEL)
- AI queue/concurrency controls and retry behavior built in
- Local fallback responses when provider fails/quota is hit
- Python ML microservice (optional, recommended) for small local models:
  - Embeddings: all-MiniLM-L6-v2
  - Sentiment: DistilBERT SST-2
  - Auto-tagging: DistilBERT MNLI zero-shot

### Authentication
- Firebase Auth (frontend)
- Firebase Admin token verification (backend)
- Local auth bypass mode for development (AUTH_MODE=local)

---

## 3. System Architecture

```text
Browser (Next.js UI)
  |
  | HTTPS / REST (Bearer token)
  v
Express API Server (Node.js)
  |-- Auth middleware (Firebase Admin or local auth mode)
  |-- Notes, AI, User, Tags, Public routes
  |
  +--> MongoDB (users, notes, conversations)
  +--> Python ML Service (embeddings/sentiment/tags)
  +--> Gemini API (summaries, tags, Q&A, etc.)
```

Architecture principles currently implemented:
- Frontend and backend are separated by REST API boundaries.
- Backend is stateless (token-based auth per request).
- Data is user-isolated by user_id scoping at query level.
- AI logic is isolated in one service module for portability.

---

## 4. Data Model and Database

Runtime database: MongoDB.

### Main Collections

#### users
- firebase_uid (unique)
- email (unique)
- display_name
- photo_url
- username (unique sparse)
- bio
- is_public
- created_at, updated_at

#### notes
- user_id (string user identifier from users.id mapping)
- title, content
- type: note | link | insight | quote | todo
- source_url
- summary
- tags[]
- is_public, is_pinned, is_favorite, todo_done
- reading_time, word_count
- ai_processed
- created_at, updated_at

#### conversations
- user_id (unique)
- messages[] (role/content/timestamp)
- created_at, updated_at

### Indexes (created automatically)
- users: firebase_uid, email, username
- notes: user + created, user + updated, user + type, user + tags, public + created
- conversations: user unique index

### PostgreSQL schema note
A PostgreSQL schema file still exists at server/db/schema.sql, but the running backend now uses MongoDB collections via server/db/pool.js and server/db/queries.js.

---

## 5. Backend API (Express)

Server entry: server/index.js

### Middleware and hardening
- helmet with crossOriginOpenerPolicy same-origin-allow-popups
- cors with configurable FRONTEND_URL and credentials support
- compression for response payloads
- JSON body limit: 10mb
- morgan request logging
- global request/res timeout
- rate limits:
  - /api/* generic limiter
  - /api/ai/* stricter AI limiter

### Route groups
- /api/notes
- /api/ai
- /api/user
- /api/public
- /api/tags

### Error behavior
- standardized JSON error responses
- 404 route handler
- stack traces only in development

---

## 6. Frontend (Next.js App Router)

Frontend root: client/app

### Implemented pages
- / (landing page)
- /login
- /dashboard
- /notes/[id]
- /brain/[username] (public profile/brain page)
- /settings
- /docs

### Key frontend patterns
- Global providers in app/layout.js: ThemeProvider, AuthProvider
- API client with auth header injection and offline-safe error handling
- Keyboard shortcuts in dashboard:
  - Cmd/Ctrl+K command palette
  - Cmd/Ctrl+N new note
  - Cmd/Ctrl+/ AI chat toggle
- Debounced search (useDebounce hook)
- Animated UI and skeleton loaders

---

## 7. AI Integration

AI service module: server/services/ai.js

Python ML bridge: server/services/ml.js

### Implemented AI capabilities
1. Summarization
2. Auto-tagging
3. Conversational Q&A across user notes
4. Writing improvement
5. Related note connections
6. Daily digest generation
7. Flashcard generation
8. Insight extraction
9. Sentiment analysis
10. Topic clustering
11. Mind map generation
12. Semantic search (Python all-MiniLM embeddings)
13. Similar-note retrieval (Python cosine similarity)

### Python ML microservice endpoints
- POST /semantic-search
- POST /similar-notes
- POST /sentiment
- POST /autotag
- GET /health

### New backend AI endpoints
- POST /api/ai/semantic-search
- GET /api/ai/ml-health

Notes:
- Existing endpoints are backward compatible.
- If Python ML is down, backend falls back to existing Gemini/lexical behavior.

### Reliability controls
- concurrency-limited queue
- bounded queue size
- retry with backoff
- normalized provider error messages
- graceful fallback outputs for key flows

### Background auto-processing
- Optional on note create/update via AUTO_PROCESS_NOTES_WITH_AI
- Disabled by default to reduce automatic AI cost

---

## 8. Authentication and Authorization

### Frontend auth
- Firebase Auth initialization in client/lib/firebase.js
- Google popup login (with redirect fallback if popup blocked)
- Email signup and password reset are implemented
- Token retrieved from current user and attached to API calls

### Backend auth
- Firebase Admin verifies Bearer tokens in production mode
- Local developer mode:
  - AUTH_MODE=local
  - identity can come from env vars or request headers

### Access model
- Auth middleware sets req.user and req.dbUser
- All private note queries are scoped to req.dbUser.id
- Public routes require user.is_public and note.is_public checks

---

## 9. UI/UX Design System

Core style system in client/styles/globals.css:
- CSS variables for dark and light themes
- semantic surface/background/border/text tokens
- note type color tokens (note/link/insight/quote/todo)
- utility animation classes and keyframes

UI characteristics:
- glassmorphism-inspired panels
- animated transitions (Framer Motion)
- toasts for success/error feedback
- mobile-responsive layouts
- inline action affordances on note cards

---

## 10. Feature Matrix (Implemented)

### Notes and knowledge capture
- Create, read, update, delete notes
- Note types: note/link/insight/quote/todo
- Source URL support
- Tags (manual + AI generated)
- Pin, favorite, public toggle, todo_done toggle
- Markdown export endpoint for notes
- Word count and reading time

### Discovery and navigation
- Search by title/content/summary
- Filter by type and tag
- Sorting options (newest, oldest, updated, alpha, wordcount)
- Command palette + keyboard shortcuts
- Stats and tag metadata endpoints + dashboard cards

### AI features in API
- summarize, autotag, query, improve, connections, digest, flashcards
- insights, sentiment, cluster, mindmap
- conversation history load/clear

### Public sharing
- Public user brain route by username
- Public brain query endpoint
- Public note fetch endpoint

### Auth/profile
- Firebase auth integration
- Profile update (display_name, username, bio, is_public)
- User stats and tags retrieval

---

## 11. Folder Structure (Actual)

```text
AI Cognitive Knowledge Retrieval System/
├── .env.example
├── .gitignore
├── doc.md
├── client/
│   ├── .env.local.example
│   ├── app/
│   │   ├── page.js
│   │   ├── dashboard/page.js
│   │   ├── login/page.js
│   │   ├── notes/[id]/page.js
│   │   ├── brain/[username]/page.js
│   │   ├── docs/page.js
│   │   └── settings/page.js
│   ├── components/
│   ├── context/
│   ├── hooks/
│   ├── lib/
│   ├── styles/
│   └── package.json
├── ml_service/
│   ├── .env.example
│   └── app/
└── server/
  ├── .env.example
    ├── index.js
    ├── middleware/
    ├── routes/
    ├── services/
    ├── db/
    │   ├── pool.js
    │   ├── queries.js
    │   ├── init.js
    │   └── schema.sql
    └── package.json
```

---

## 12. Environment Variables

Use service-specific env files:
- Backend: `server/.env` (template: `server/.env.example`)
- Frontend: `client/.env.local` (template: `client/.env.local.example`)
- ML service: `ml_service/.env` (template: `ml_service/.env.example`)

### Required backend variables
- MONGODB_URI
- MONGODB_DB_NAME
- GEMINI_API_KEY
- GEMINI_MODEL
- FIREBASE_PROJECT_ID
- FIREBASE_CLIENT_EMAIL
- FIREBASE_PRIVATE_KEY
- PORT
- NODE_ENV
- FRONTEND_URL

### Optional backend controls
- AUTH_MODE
- DEV_LOCAL_UID, DEV_LOCAL_EMAIL, DEV_LOCAL_NAME
- API_RATE_LIMIT_MAX
- AI_RATE_LIMIT_MAX
- REQUEST_TIMEOUT_MS
- MONGO_MAX_POOL_SIZE
- MONGO_MIN_POOL_SIZE
- MONGO_MAX_CONNECTING
- MONGO_WAIT_QUEUE_TIMEOUT_MS
- AI_MAX_CONCURRENT
- AI_MAX_QUEUE
- AUTO_PROCESS_NOTES_WITH_AI

### Required frontend variables
- NEXT_PUBLIC_FIREBASE_API_KEY
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
- NEXT_PUBLIC_FIREBASE_PROJECT_ID
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- NEXT_PUBLIC_FIREBASE_APP_ID
- NEXT_PUBLIC_API_URL

### ML service variables (optional overrides)
- ML_EMBEDDING_MODEL
- ML_SENTIMENT_MODEL
- ML_ZERO_SHOT_MODEL
- ML_MAX_QUERY_CHARS
- ML_MAX_AUTOTAG_CHARS

---

## 13. Local Development Guide

### Start Python ML service (recommended)

From workspace root:

```bash
cd ml_service
python -m venv .venv
# Windows PowerShell
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8001
```

Then ensure `server/.env` has:

```env
ML_SERVICE_URL=http://127.0.0.1:8001
ML_REQUEST_TIMEOUT_MS=10000
```

### 1) Install dependencies
Backend:
```bash
cd server
npm install
```

Frontend:
```bash
cd client
npm install
```

### 2) Configure environment
- Copy server/.env.example to server/.env
- Copy client/.env.local.example to client/.env.local
- Optionally copy ml_service/.env.example to ml_service/.env
- Fill Firebase, MongoDB, and Gemini values
- For quick local iteration, set AUTH_MODE=local

### 3) Start backend
```bash
cd server
npm run dev
```

### 4) Start frontend
```bash
cd client
npm run dev
```

### 5) Open app
- Frontend: http://localhost:3000
- Backend health: http://localhost:4000/health

---

## 14. Deployment Guide

### Recommended topology
- Frontend: Vercel (root: client)
- Backend: Render/Railway/Fly (root: server)
- Database: MongoDB Atlas
- Auth: Firebase

### Deployment sequence
1. Create MongoDB Atlas cluster and database.
2. Deploy backend with all server env variables.
3. Verify backend /health endpoint.
4. Deploy frontend with NEXT_PUBLIC_* variables and NEXT_PUBLIC_API_URL.
5. Add production domains to Firebase Auth authorized domains.
6. Disable AUTH_MODE=local in production.

---

## 15. API Reference

### Notes
- GET /api/notes
- POST /api/notes
- GET /api/notes/meta/stats
- GET /api/notes/:id
- PATCH /api/notes/:id
- DELETE /api/notes/:id
- PATCH /api/notes/:id/toggle
- GET /api/notes/:id/export

### AI
- POST /api/ai/summarize
- POST /api/ai/autotag
- POST /api/ai/query
- POST /api/ai/improve
- POST /api/ai/connections
- GET /api/ai/digest
- POST /api/ai/flashcards
- POST /api/ai/insights
- POST /api/ai/sentiment
- POST /api/ai/cluster
- POST /api/ai/mindmap
- GET /api/ai/history
- DELETE /api/ai/history

### User
- GET /api/user/profile
- PATCH /api/user/profile
- GET /api/user/stats
- GET /api/user/tags

### Tags
- GET /api/tags

### Public
- GET /api/public/brain/query?username={username}&q={query}
- GET /api/public/brain/:username
- GET /api/public/note/:id

### Utility
- GET /health

---

## 16. Portability and Swap Points

### AI provider swap
- Replace server/services/ai.js implementation

### Database swap
- Replace server/db/pool.js and server/db/queries.js

### Auth swap
- Replace token verification in server/middleware/auth.js
- Update frontend auth wrapper in client/lib/firebase.js

### Why this is portable
- Route handlers call service/query modules, not providers directly.
- Provider-specific logic is already concentrated in thin modules.

---

## 17. Known Gaps and Notes

- client/app/docs/page.js still describes PostgreSQL, while runtime backend uses MongoDB.
- server/package.json includes mongodb 7.1.0; ensure production host supports this major version.
- Some AI endpoints exist on backend but are not yet fully surfaced in dashboard UI workflows.
- Public brain page includes a Sparkles icon usage without explicit import in that page file; verify build/lint behavior in strict CI.

---

Document owner: AI Cognitive Knowledge Retrieval System project

