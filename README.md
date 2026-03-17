# AI Cognitive Knowledge Retrieval System

**Version:** 1.0.0  
**Last Updated:** March 17, 2026  
**Status:** Production-Ready  
**Stack:** Next.js 14 · React 18 · Node.js · Express · MongoDB · Firebase Auth · Google Gemini AI

> Your knowledge, organized by AI, accessible forever.

---

## 📋 Table of Contents

1. [🎯 Project Overview](#-project-overview)
2. [🏗️ System Architecture](#️-system-architecture)
3. [🤖 AI Algorithms & Models](#-ai-algorithms--models)
4. [📦 Tech Stack](#-tech-stack)
5. [🗄️ Database Design](#-database-design)
6. [🔐 Authentication & Security](#-authentication--security)
7. [✨ Features](#-features)
8. [📁 Project Structure](#-project-structure)
9. [⚙️ Environment Variables](#️-environment-variables)
10. [🚀 Getting Started](#-getting-started)
11. [📖 API Reference](#-api-reference)
12. [🔄 Workflows & Data Flow](#-workflows--data-flow)
13. [🧩 Module Reference](#-module-reference)
14. [📝 License & Support](#-license--support)

---

## 🎯 Project Overview

**AI Cognitive Knowledge Retrieval System** is an intelligent personal knowledge management system designed to capture, organize, and retrieve your knowledge through AI-powered capabilities.

### Use Cases
- **Students** — Lecture notes, research capture, study materials organization
- **Developers** — Code patterns, debugging notes, architecture decisions, technical debt tracking
- **Writers & Researchers** — Literature organization, quote management, topic clustering
- **Professionals** — Meeting notes, insights, decision logs, team knowledge base

### Key Promises
✅ **Smart Capture** — Create notes effortlessly with AI auto-tagging  
✅ **Intelligent Organization** — Automatic categorization and semantic clustering  
✅ **Powerful Discovery** — Search across semantics, not just keywords  
✅ **Conversational Interface** — Ask questions across your entire knowledge base  
✅ **Shareable Brain** — Publish your brain publicly and connect with others  
✅ **Privacy First** — Your data is yours; opt-in public sharing only  

---

## 🏗️ System Architecture

### **High-Level Architecture Diagram**

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                             │
│  (Next.js 14 + React 18 + Firebase Auth)                       │
│                                                                  │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐       │
│  │Dashboard │  Notes   │  Search  │ AI Chat  │ Settings │       │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘       │
│          |                                                       │
│          v  HTTPS REST API (Bearer Token Auth)                  │
└─────────────────────────────────────────────────────────────────┘
                              |
                              | HTTP/JSON
                              v
┌─────────────────────────────────────────────────────────────────┐
│                    Backend API Layer                             │
│              (Node.js + Express 4.18)                           │
│                                                                  │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐       │
│  │  Notes   │   AI     │  Search  │  Public  │   User   │       │
│  │ Endpoint │ Endpoint │ Endpoint │ Endpoint │ Endpoint │       │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘       │
│          |                              |                       │
│          v                              v                       │
│  ┌──────────────────────┐      ┌─────────────────────┐         │
│  │   Auth Middleware    │      │ Request Validation  │         │
│  │ (Firebase Admin SDK) │      │ & Rate Limiting     │         │
│  └──────────────────────┘      └─────────────────────┘         │
│          |                                                       │
└─────────────────────────────────────────────────────────────────┘
          |
          +──────────────────┬──────────────────┬──────────┐
          |                  |                  |          |
          v                  v                  v          v
    ┌──────────┐      ┌─────────────┐   ┌───────────┐  ┌────────┐
    │ MongoDB  │      │  Gemini AI  │   │ Python ML │  │Firebase│
    │ Database │      │ API (Cloud) │   │ Service   │  │  Auth  │
    └──────────┘      └─────────────┘   └───────────┘  └────────┘
     (Primary Data)   (LLM Features)  (Local ML Tasks) (Auth)
```

### **Data Flow Architecture**

```
User Input (Note)
    |
    v
┌─────────────────────┐
│ Frontend Validation │ (Length, type, content checks)
└─────────────────────┘
    |
    v
Backend API receives POST /api/notes
    |
    +─────────────────────────────────┐
    |                                 |
    v                                 v
┌──────────────────────┐      ┌─────────────────────┐
│  Store in MongoDB    │      │ Optional: AI Process│
│  - user_id scope     │      │ (if AUTO_PROCESS=on)│
│  - index by tags     │      │                     │
└──────────────────────┘      │ Triggers:           │
    |                         │ • Summarization     │
    |                         │ • Auto-tagging      │
    |                         │ • Sentiment analysis│
    |                         │ • Embedding gen     │
    |                         │ • Similarity scores │
    |                         └─────────────────────┘
    |                                 |
    |                                 v
    |                         ┌──────────────────────┐
    |                         │  AI Queue Processor  │
    |                         │  (Concurrency Ctrl)  │
    |                         └──────────────────────┘
    |                                 |
    |        ┌────────────────────────┼────────────────────├─────────┐
    |        |                        |                    |         |
    |        v                        v                    v         v
    |   ┌─────────────┐         ┌──────────────┐    ┌───────────┐ ┌─────────┐
    |   │ Gemini API  │         │ Python ML    │    │  Gemini   │ │Fallback │
    |   │ • Summarize │         │  Service     │    │ • Q&A     │ │ Lexical │
    |   │ • Sentiment │         │ • Embeddings │    │ • Insights│ │ Algos   │
    |   │ • Insights  │         │ • Sentiment  │    │ • Tagging │ │         │
    |   └─────────────┘         │ • Zero-shot  │    └───────────┘ └─────────┘
    |                           └──────────────┘
    |                                 |
    v                                 v
┌──────────────────────────────────────────────────┐
│      Update MongoDB with AI Results               │
│      - tags, summary, sentiment scores           │
│      - embeddings, relations, cache              │
└──────────────────────────────────────────────────┘
    |
    v
Frontend displays updated note with AI artifacts
```

---

## 🤖 AI Algorithms & Models

This system employs a **multi-layer AI strategy** combining cloud-based LLMs with local efficient models:

### **Layer 1: Cloud LLM (Google Gemini 2.0-flash)**

**Model:** `gemini-2.0-flash`  
**Provider:** Google Generative AI (generative-ai SDK v0.21.0)  
**Use Cases:**
- High-quality text summarization
- Conversational Q&A across notes
- Content improvement and rewriting
- Complex insight extraction
- Flashcard generation
- Mind map generation
- Relationship discovery between notes

**How it Works:**
1. User input is sent to Gemini via `POST /api/ai/{endpoint}`
2. Prompt engineering tailors the response:
   ```
   System: "You are a knowledge assistant. Provide concise, accurate summaries."
   User: "Summarize: {note_content}"
   ```
3. Stream response or collect full output
4. Cache result in MongoDB under note's `ai_metadata`
5. On failure, fallback to local regex-based summaries

**Cost Optimization:**
- Concurrency-limited queue (default: 1 concurrent request)
- Bounded queue size (prevents memory overflow)
- Exponential backoff retry (cool off on 429 quota errors)
- Optional: Disable auto-processing with `AUTO_PROCESS_NOTES_WITH_AI=false`

**Reliability:**
- Graceful degradation if API key is missing
- Fallback text generation with local algorithms
- User-friendly error messages

---

### **Layer 2: Local Efficient Models (Python FastAPI Microservice)**

Optional but recommended. Runs on port 8001. Models use Hugging Face Transformers + scikit-learn.

#### **Model 1: Embeddings (Sentence-Transformers)**
**Model:** `sentence-transformers/all-MiniLM-L6-v2`  
**Dimensions:** 384-dimensional vectors  
**Latency:** ~50-200ms per embedding  
**Use Cases:**
- Semantic search across notes
- Similar note retrieval
- Clustering notes by topic
- Relationship scoring

**Algorithm Flow:**
```
Note Content
    |
    v
Tokenize & encode with BERT
    |
    v
Generate 384-dim embedding vector
    |
    v
Store in MongoDB or cache
    |
    v
On search: Compare user query embedding vs all note embeddings
           using cosine similarity (scale: -1 to 1, higher = more similar)
```

**Fallback:** When Transformers unavailable, uses TF-IDF + sparse vectors

---

#### **Model 2: Sentiment Analysis (DistilBERT)**
**Model:** `distilbert-base-uncased-finetuned-sst-2-english`  
**Task:** Binary classification (positive/negative)  
**Latency:** ~30-100ms per analysis  
**Use Cases:**
- Classify note sentiment (e.g., mood/tone)
- Aggregate sentiment trends over time
- Highlight emotional content

**Algorithm Flow:**
```
Note Content
    |
    v
Tokenize with DistilBERT tokenizer
    |
    v
Pass through DistilBERT-base (6 layers)
    |
    v
[CLS] token logits → softmax → probability scores
    |
    v
Output: {label: "POSITIVE" or "NEGATIVE", score: 0-1}
```

**Fallback:** Lexicon-based sentiment (word-list scoring)

---

#### **Model 3: Zero-Shot Classification (DistilBERT MNLI)**
**Model:** `typeform/distilbert-base-uncased-mnli`  
**Task:** Multi-label zero-shot classification  
**Latency:** ~100-300ms per classification  
**Use Cases:**
- Auto-tag notes without predefined label set
- Classify note into dynamic categories
- Assign multiple tags from inference

**Algorithm Flow:**
```
Note Content + Candidate Labels (e.g., ["bug", "feature", "docs", ...])
    |
    v
Create hypothesis sentences:
  "This text is about {label}." for each candidate
    |
    v
DistilBERT MNLI encodes premise (note) vs each hypothesis
    |
    v
Output entailment probabilities for each label
    |
    v
Filter by confidence threshold (e.g., > 0.5) and rank
    |
    v
Return top-N tags with scores
```

**Fallback:** Keyword overlap + TF-IDF term matching

---

### **Layer 3: Custom Local Algorithms**

#### **3.1 Semantic Search with Fallback**
**Primary:** Cosine similarity on embedding vectors  
**Fallback:** TF-IDF ranking

```python
# Primary flow (when Transformers available)
user_query_embedding = embedding_model(user_query)  # 384-dim vector
note_embeddings = [...]  # Pre-computed from all notes

similarities = [cosine_similarity(query_embed, note_embed) 
                for note_embed in note_embeddings]

ranked_notes = sorted(zip(notes, similarities), 
                      key=lambda x: x[1], 
                      reverse=True)[:top_k]

# Fallback flow (when embeddings unavailable)
query_tokens = tokenize_and_stem(user_query)
note_tokens = [tokenize_and_stem(note) for note in notes]

tfidf_scores = calculate_tfidf(query_tokens, note_tokens)
ranked_notes = sorted(zip(notes, tfidf_scores), 
                      key=lambda x: x[1], 
                      reverse=True)[:top_k]
```

**Complexity:** O(n · 384) for full search (linear scan), ~10-50ms for 1000 notes

---

#### **3.2 Similar Note Retrieval**
**Strategy:** Embedding-based clustering + nearest-neighbor search

```
For each note:
  1. Generate embedding (if not cached)
  2. Compute cosine distances to all other notes
  3. Return top-5 similar notes (score > 0.3)
  4. Cache similarity matrix (optional, if memory allows)

Visualization: Notes form implicit clusters in 384-dim space
```

---

#### **3.3 Auto-Tagging Strategy**
**Approach:** Hybrid (Gemini + MNLI + keyword fallback)

```
User creates note: "Fixed critical SQL injection vulnerability in auth.js"

Step 1: Gemini quick tag request
  └─> "security, bug, backend"

Step 2: Validate with MNLI zero-shot classification
  Candidates: [security, bug, backend, performance, frontend, ...]
  └─> Scores: {security: 0.92, bug: 0.85, backend: 0.78, ...}
  └─> Filter by 0.5 threshold

Step 3: Merge and deduplicate
  Final tags: ["security", "bug", "backend"]

Step 4: Store in MongoDB
  note.tags = ["security", "bug", "backend"]
  note.tag_scores = {security: 0.92, bug: 0.85, ...}
```

---

#### **3.4 Topic Clustering (K-Means on Embeddings)**

```
Algorithm: Spherical K-Means on 384-dim embeddings

Input: 100 notes with embeddings
  |
  v
Standardize embeddings (unit norm)
  |
  v
Initialize K clusters (default K=5, auto or user-specified)
  |
  v
Iteratively:
  1. Assign each note to nearest cluster center
  2. Recompute cluster centers as mean of members
  3. Repeat until convergence (< 0.01 distance change)
  |
  v
Output: 5 clusters with representative notes + cluster labels

Label each cluster:
  - Take top-3 most similar notes in cluster
  - Extract common keywords or ask Gemini for name
```

---

#### **3.5 Daily Digest Generation**

```
Algorithm: Recency-weighted summarization

Input: Notes created/updated in last 24h (filter: user_id, timestamp)
  |
  v
Rank by:
  1. Recency weight: newer notes score higher
  2. Importance: pinned/favorite notes score higher
  3. Engagement: notes with tags/sentiment changes score higher
  |
  v
Select top-5 notes for digest (adaptive based on volume)
  |
  v
For each note:
  1. Generate short summary via Gemini (or cached summary)
  2. Include sentiment emoji + color code
  3. Link to full note
  |
  v
Compile HTML digest with:
  - Header: "Your Daily Digest — {date}"
  - Note cards with summaries
  - Tag cloud of trending topics
  - Bottom link to dashboard
```

---

### **Layer 4: Fallback & Resilience Strategy**

When any AI layer fails:

| Feature | Primary | Fallback |
|---------|---------|----------|
| Summarization | Gemini | Regex extractive (first 3 sentences) |
| Auto-tagging | Gemini + MNLI | Keyword extraction + TF-IDF |
| Sentiment | DistilBERT | Lexicon-based (word lists) |
| Semantic search | Embeddings + cosine | TF-IDF ranking |
| Similar notes | Embedding similarity | Keyword overlap |
| Clustering | K-Means embeddings | Keyword-based pseudo-clustering |
| Q&A | Gemini | Vector search + snippet concatenation |

---

## 📦 Tech Stack

### **Frontend**
| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Framework | Next.js | 14.2.5 | Full-stack React framework with App Router |
| UI State | React | 18.3.1 | Component library and hooks |
| Styling | Tailwind CSS | 3.4.6 | Utility-first CSS framework |
| Animations | Framer Motion | 11.3.8 | React animation library |
| Auth | Firebase Web SDK | 10.12.3 | Frontend authentication |
| Icons | Lucide React | — | SVG icon library |
| Notifications | React Hot Toast | — | Toast notifications |
| Utils | date-fns | — | Date manipulation |
| Commands | cmdk (custom) | — | Command palette |

### **Backend**
| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Runtime | Node.js | 18+ | JavaScript runtime |
| Framework | Express | 4.18.x | Minimalist web framework |
| Database Driver | MongoDB Node Driver | 7.1.0 | MongoDB connectivity |
| Auth | Firebase Admin SDK | 12.3.1 | Backend token verification |
| LLM | Google Generative AI | 0.21.0 | Gemini API client |
| Rate Limiting | express-rate-limit | — | API throttling |
| Security | Helmet | — | HTTP headers hardening |
| CORS | CORS middleware | — | Cross-origin requests |
| Compression | Compression | — | Response optimization |
| Logging | Morgan | — | HTTP request logging |

### **Database**
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Primary Store | MongoDB 7.1 | Main data persistence |
| Collections | users, notes, conversations | User-scoped data |
| Indexes | Multi-field | Optimized query paths |

### **ML Microservice (Optional)**
| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Framework | FastAPI | — | Python async web framework |
| Server | Uvicorn | — | ASGI server |
| ML | Transformers | 4.45+ | Hugging Face model hub |
| Embeddings | sentence-transformers | — | Dense vector embeddings |
| Utils | scikit-learn | 1.5+ | ML utilities (cosine similarity) |
| Config | python-dotenv | 1.0.1 | Environment loading |
| Array | NumPy | 2.1+ | Numerical operations |

---

## 🗄️ Database Design

### **Collections & Schema**

#### **users**
```javascript
{
  _id: ObjectId,
  firebase_uid: String (unique),
  email: String (unique),
  display_name: String,
  photo_url: String,
  username: String (unique, sparse),
  bio: String,
  is_public: Boolean,
  created_at: Date,
  updated_at: Date
}
```

#### **notes**
```javascript
{
  _id: ObjectId,
  user_id: String,  // Reference to users._id
  title: String,
  content: String,
  type: String (enum: note | link | insight | quote | todo),
  source_url: String,
  
  // AI-generated metadata
  summary: String,
  tags: [String],
  tag_scores: {String: Number},  // confidence scores
  sentiment: {label: String, score: Number},
  embeddings_384: [Number],  // 384-dimensional vector
  
  // Computed metadata
  reading_time: Number,  // minutes
  word_count: Number,
  
  // Status flags
  is_public: Boolean,
  is_pinned: Boolean,
  is_favorite: Boolean,
  todo_done: Boolean,
  ai_processed: Boolean,
  
  created_at: Date,
  updated_at: Date
}
```

#### **conversations**
```javascript
{
  _id: ObjectId,
  user_id: String (unique),
  messages: [
    {
      role: String (user | assistant),
      content: String,
      timestamp: Date
    }
  ],
  created_at: Date,
  updated_at: Date
}
```

### **Indexes**
- `users`: firebase_uid (unique), email (unique), username (unique sparse)
- `notes`: (user_id, created_at), (user_id, type), (user_id, tags), (is_public, created_at)
- `conversations`: (user_id) unique

---

## 🔐 Authentication & Security

### **Frontend Auth (Firebase Web SDK)**
1. User clicks "Sign in with Google" or "Sign up with Email"
2. Firebase SDK handles OAuth popup or email verification
3. On success, Firebase provides `idToken`
4. Token stored in browser (secure, httpOnly if possible)
5. Token attached to all API requests as `Authorization: Bearer {idToken}`

### **Backend Auth (Firebase Admin SDK)**
1. Endpoint receives request with Bearer token
2. Auth middleware calls `admin.auth().verifyIdToken(token)`
3. If valid, `req.user` is populated with Firebase claims
4. All data queries filtered by `user_id` from claims

### **Local Development Mode**
```javascript
// server/.env
AUTH_MODE=local
DEV_LOCAL_UID=user123
DEV_LOCAL_EMAIL=dev@example.com
DEV_LOCAL_NAME=Developer
```

### **Security Hardening**
- ✅ Helmet for HTTP headers (CSP, HSTS, etc.)
- ✅ CORS with explicit origin whitelist
- ✅ Rate limiting on `/api` (general) and `/api/ai/*` (stricter)
- ✅ Request timeout enforcement (default 30s)
- ✅ MongoDB query parameter binding (no SQL injection)
- ✅ Input validation middleware
- ✅ JSON body size limit (10MB)
- ✅ Environment variables isolated per service
- ✅ .env files gitignored; templates provided

---

## ✨ Features

### **Core Note Management**
- ✅ Create, read, update, delete notes (CRUD)
- ✅ Note types: note, link, insight, quote, todo
- ✅ Markdown content support
- ✅ Source URL tracking
- ✅ Pin, favorite, public toggle
- ✅ Todo status tracking (done/pending)
- ✅ Reading time & word count auto-calculation

### **AI-Powered Discovery**
- ✅ Semantic search (embeddings + cosine similarity)
- ✅ Full-text search on title/content/tags
- ✅ Filter by type, tag, date range
- ✅ Sort by recency, relevance, word count, alpha
- ✅ Related note suggestions (similarity-based)

### **AI Capabilities**
- ✅ Auto-summarization (Gemini)
- ✅ Auto-tagging (Gemini + MNLI zero-shot)
- ✅ Sentiment analysis (DistilBERT)
- ✅ Conversational Q&A across notes (Gemini)
- ✅ Daily digest generation
- ✅ Flashcard generation
- ✅ Insight extraction
- ✅ Topic clustering (K-Means)
- ✅ Mind map generation
- ✅ Writing improvement suggestions

### **Sharing & Collaboration**
- ✅ Public user brain by username (`/brain/{username}`)
- ✅ Shareable note links
- ✅ Public note browsing (read-only)
- ✅ Stats visibility on public profile

### **User Experience**
- ✅ Dashboard with note list, stats, and filters
- ✅ Command palette (Cmd/Ctrl+K)
- ✅ Keyboard shortcuts (Cmd/Ctrl+N for new)
- ✅ Dark/light theme toggle
- ✅ Responsive mobile design
- ✅ Animated UI with Framer Motion
- ✅ Skeleton loaders for async states
- ✅ Toast notifications for feedback

---

## 📁 Project Structure

```
AI Cognitive Knowledge Retrieval System/
│
├── README.md                    # This file
├── doc.md                       # Detailed technical documentation
│
├── .env                         # Pointer file (DO NOT USE)
├── .env.example                 # Pointer file
├── .gitignore                   # Security rules
│
├── client/                      # Next.js Frontend
│   ├── README.md               # Frontend-specific docs
│   ├── .env.local.example      # Frontend env template
│   ├── package.json            # Frontend dependencies
│   ├── next.config.js          # Next.js config
│   ├── tailwind.config.js      # Tailwind config
│   ├── jsconfig.json           # JS config
│   │
│   ├── app/                    # Next.js App Router
│   │   ├── layout.js           # Root layout with providers
│   │   ├── page.js             # Landing page
│   │   ├── login/page.js       # Auth page
│   │   ├── dashboard/page.js   # Main dashboard
│   │   ├── notes/[id]/page.js  # Note detail view
│   │   ├── brain/[username]/page.js  # Public brain view
│   │   ├── settings/page.js    # User settings
│   │   └── docs/page.js        # Documentation page
│   │
│   ├── components/             # React components
│   │   ├── AIChat.jsx
│   │   ├── CommandPalette.jsx
│   │   ├── DailyDigest.jsx
│   │   ├── FilterBar.jsx
│   │   ├── NoteCard.jsx
│   │   ├── NoteForm.jsx
│   │   ├── SearchBar.jsx
│   │   ├── SkeletonCard.jsx
│   │   ├── StatsBar.jsx
│   │   └── ThemeToggle.jsx
│   │
│   ├── context/                # React context
│   │   ├── AuthContext.js
│   │   └── ThemeContext.js
│   │
│   ├── hooks/                  # Custom hooks
│   │   └── useDebounce.js
│   │
│   ├── lib/                    # Utilities
│   │   ├── api.js             # API client with auth
│   │   └── firebase.js        # Firebase init
│   │
│   ├── styles/                 # Global styles
│   │   └── globals.css
│   │
│   └── public/                 # Static assets
│       └── Videos/
│
├── server/                      # Express Backend
│   ├── README.md               # Backend-specific docs
│   ├── .env.example            # Backend env template
│   ├── package.json            # Backend dependencies
│   ├── index.js                # Express entry point
│   │
│   ├── middleware/             # Express middleware
│   │   ├── auth.js            # Firebase token verification
│   │   └── validate.js        # Input validation
│   │
│   ├── routes/                 # API route handlers
│   │   ├── notes.js
│   │   ├── ai.js
│   │   ├── user.js
│   │   ├── tags.js
│   │   └── public.js
│   │
│   ├── services/               # Business logic
│   │   ├── ai.js              # Gemini integration
│   │   └── ml.js              # Python ML bridge
│   │
│   └── db/                     # Database layer
│       ├── pool.js            # MongoDB connection
│       ├── queries.js         # Query builders
│       ├── init.js            # Schema init
│       └── schema.sql         # (Legacy, see queries.js)
│
└── ml_service/                  # Python FastAPI Microservice
    ├── README.md               # ML service docs
    ├── .env.example            # ML env template
    ├── requirements.txt        # Python dependencies
    │
    └── app/                    # FastAPI app
        ├── main.py            # Entry point
        ├── core/
        │   └── config.py      # ML model config
        ├── api/
        │   └── routes/
        │       ├── embeddings.py
        │       ├── sentiment.py
        │       ├── autotag.py
        │       └── health.py
        └── services/
            ├── retrieval_service.py   # Semantic search
            ├── sentiment_service.py   # Sentiment
            ├── autotag_service.py     # Zero-shot tags
            └── model_registry.py      # Lazy loading
```

---

## ⚙️ Environment Variables

Use **service-specific env files** for security:

### **Backend (server/.env)**
Template: `server/.env.example`

**Required:**
```env
# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net
MONGODB_DB_NAME=second_brain

# Gemini AI
GEMINI_API_KEY=AIzaSy...
GEMINI_MODEL=gemini-2.0-flash

# Firebase Admin
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@....iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Server
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**Optional:**
```env
# Auth mode
AUTH_MODE=production  # or 'local' for dev
DEV_LOCAL_UID=dev-user-123
DEV_LOCAL_EMAIL=dev@example.com
DEV_LOCAL_NAME=Developer

# ML Service bridge
ML_SERVICE_URL=http://127.0.0.1:8001
ML_REQUEST_TIMEOUT_MS=10000

# Rate limiting
API_RATE_LIMIT_MAX=100  # requests per 15 min
AI_RATE_LIMIT_MAX=20

# Timing
REQUEST_TIMEOUT_MS=30000  # global timeout
AI_MAX_CONCURRENT=1       # Gemini queue limit
AI_MAX_QUEUE=50
AUTO_PROCESS_NOTES_WITH_AI=false  # disable auto-processing

# MongoDB tuning
MONGO_MAX_POOL_SIZE=10
MONGO_MIN_POOL_SIZE=2
MONGO_MAX_CONNECTING=5
MONGO_WAIT_QUEUE_TIMEOUT_MS=10000
```

### **Frontend (client/.env.local)**
Template: `client/.env.local.example`

**Required:**
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef...

NEXT_PUBLIC_API_URL=http://localhost:4000
```

### **ML Service (ml_service/.env)** [Optional]
Template: `ml_service/.env.example`

```env
# Model selection (optional overrides)
ML_EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
ML_SENTIMENT_MODEL=distilbert-base-uncased-finetuned-sst-2-english
ML_ZERO_SHOT_MODEL=typeform/distilbert-base-uncased-mnli

# Limits
ML_MAX_QUERY_CHARS=1200
ML_MAX_AUTOTAG_CHARS=2500
```

---

## 🚀 Getting Started

### **1. Prerequisites**
- Node.js 18+ and npm
- MongoDB Atlas cluster or local MongoDB
- Google Generative AI API key (Gemini)
- Firebase project with Auth enabled
- Python 3.9+ (optional, for ML service)

### **2. Setup Backend**

```bash
cd server
npm install

# Copy template and fill in real values
cp .env.example .env
# Edit .env with your MongoDB, Gemini, and Firebase credentials

# Start development server
npm run dev
# Backend runs on http://localhost:4000
```

### **3. Setup Frontend**

```bash
cd client
npm install

# Copy template and fill in Firebase credentials
cp .env.local.example .env.local
# Edit .env.local with your Firebase config

# Start development server
npm run dev
# Frontend runs on http://localhost:3000
```

### **4. (Optional) Setup ML Service**

```bash
cd ml_service
python -m venv .venv

# Windows PowerShell
.venv\Scripts\Activate.ps1

# Or Linux/macOS
source .venv/bin/activate

pip install -r requirements.txt

# Copy template
cp .env.example .env

# Start ML service
uvicorn app.main:app --host 127.0.0.1 --port 8001
# ML service runs on http://127.0.0.1:8001
```

Update `server/.env`:
```env
ML_SERVICE_URL=http://127.0.0.1:8001
ML_REQUEST_TIMEOUT_MS=10000
```

### **5. Verify Everything**

✅ Backend health: `curl http://localhost:4000/health`  
✅ Frontend loads: Open http://localhost:3000  
✅ ML health (optional): `curl http://127.0.0.1:8001/health`  
✅ Sign in with test account (Firebase or local dev mode)  
✅ Create a test note  
✅ Test AI capabilities (summarize, search, etc.)  

---

## 📖 API Reference

### **Notes Endpoints**
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/notes` | List all user notes with filters |
| POST | `/api/notes` | Create new note |
| GET | `/api/notes/meta/stats` | Get note statistics |
| GET | `/api/notes/:id` | Get single note |
| PATCH | `/api/notes/:id` | Update note |
| DELETE | `/api/notes/:id` | Delete note |
| PATCH | `/api/notes/:id/toggle` | Toggle flags (pin, favorite, etc.) |
| GET | `/api/notes/:id/export` | Export note as markdown |

### **AI Endpoints**
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/ai/summarize` | Generate summary |
| POST | `/api/ai/autotag` | Auto-generate tags |
| POST | `/api/ai/query` | Q&A across notes |
| POST | `/api/ai/improve` | Improve writing |
| POST | `/api/ai/connections` | Find related notes |
| GET | `/api/ai/digest` | Generate daily digest |
| POST | `/api/ai/flashcards` | Create flashcards |
| POST | `/api/ai/insights` | Extract insights |
| POST | `/api/ai/sentiment` | Analyze sentiment |
| POST | `/api/ai/cluster` | Cluster notes by topic |
| POST | `/api/ai/mindmap` | Generate mind map |
| GET | `/api/ai/history` | Get conversation history |
| DELETE | `/api/ai/history` | Clear history |
| GET | `/api/ai/ml-health` | Check ML service status |

### **User Endpoints**
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/user/profile` | Get user profile |
| PATCH | `/api/user/profile` | Update profile |
| GET | `/api/user/stats` | Get user statistics |
| GET | `/api/user/tags` | Get all user tags |

### **Public Endpoints**
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/public/brain/:username` | Get public brain (requires is_public=true) |
| GET | `/api/public/brain/query` | Query public brain with search |
| GET | `/api/public/note/:id` | Get public note (requires is_public=true) |

### **Utility Endpoints**
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Backend health check |

---

## 🔄 Workflows & Data Flow

### **Workflow 1: Create Note with Auto-Processing**

```
User clicks "New Note" button
    |
    v
❶ Input: Title, content, type
    |
    v
❷ Frontend validation (length, type)
    |
    v
❸ POST /api/notes {title, content, type, source_url}
    |
    v
❹ Backend creates MongoDB document
    |
    v
❺ If AUTO_PROCESS_NOTES_WITH_AI=true:
    |
    +──► AI Queue ──► Trigger:
    |                 • Gemini summarize
    |                 • DistilBERT sentiment
    |                 • Embeddings generation
    |                 • MNLI zero-shot tagging
    |                 • Gemini insights
    |
    v
❻ Update note with AI results (tags, summary, sentiment)
    |
    v
❼ Frontend receives updated note
    |
    v
❽ Display with AI metadata
```

---

### **Workflow 2: Semantic Search**

```
User types in search box: "authentication bugs"
    |
    v
❶ Debounce: wait 300ms
    |
    v
❷ Frontend calls GET /api/notes?q=authentication%20bugs
    |
    v
❸ Backend receives query
    |
    ├──► Primary: Query ML service
    |    POST /semantic-search {text: "authentication bugs"}
    |    ❶ ML service converts query to embedding
    |    ❷ Queries all user note embeddings (cosine similarity)
    |    ❸ Returns top-10 notes with scores
    |
    └──► Fallback: TF-IDF if ML unavailable
         ❶ Tokenize query
         ❷ Compute TF-IDF scores vs all notes
         ❸ Return top-10 by score
    |
    v
❹ Backend ranks results + filters by type/tag
    |
    v
❺ Frontend displays search results with:
    • Title highlight
    • Snippet preview
    • Relevance score
    • Tags
    • Note type icon
```

---

### **Workflow 3: Conversational Q&A**

```
User types in AI Chat: "What debugging patterns did I capture last week?"
    |
    v
❶ Frontend collects last 50 notes (scoped to user_id)
    |
    v
❷ POST /api/ai/query {question, notes: [...full content...]}
    |
    v
❸ Backend submits to Gemini with system prompt:
    "You are a knowledge assistant. Answer based on provided notes.
     If not found in notes, say 'Not found in your knowledge base.'"
    |
    v
❹ Gemini processes:
    ❶ Ranks notes by relevance to question
    ❷ Extracts relevant excerpts
    ❸ Synthesizes answer with citations
    |
    v
❺ Backend streams response back to frontend
    |
    v
❻ Frontend displays answer with:
    • Streamed text
    • Source note links
    • Follow-up suggestions
    |
    v
❼ Save conversation to MongoDB conversations collection
```

---

### **Workflow 4: Topic Clustering**

```
User clicks "Cluster by Topic" in dashboard
    |
    v
❶ Fetch all user's notes (with embeddings)
    |
    v
❷ If embeddings missing:
    → Generate embeddings via ML service
    → Cache in MongoDB
    |
    v
❸ Run K-Means clustering:
    ❶ Init K cluster centers (k=5 or user-specified)
    ❷ Iteratively assign notes and recompute centers
    ❸ Converge when centers move < 0.01
    |
    v
❹ Label each cluster:
    → Extract top-3 notes per cluster
    → Ask Gemini: "Name this cluster in 2-3 words"
    → Or compute most common keywords
    |
    v
❺ Visualize in frontend:
    [Cluster 1: "Backend Architecture"]
      • Note A (similarity: 0.92)
      • Note B (similarity: 0.87)
      • Note C (similarity: 0.80)
    
    [Cluster 2: "Security & Auth"]
      • ...
    |
    v
❻ User can click cluster to filter dashboard by that group
```

---

## 🧩 Module Reference

### **Frontend Modules**

**lib/api.js** — API client with auto-auth injection
- `safeFetch()` — Request with timeout (15s)
- `getNotes()` — Fetch notes list
- `createNote()` — Create note via POST
- `updateNote()` — Patch note
- `deleteNote()` — Delete note
- `queryAI()` — Call AI endpoint

**context/AuthContext.js** — Global auth state
- `useAuth()` hook to access user and sign-in/out
- Firebase token refresh logic

**hooks/useDebounce.js** — Debounced search
- Delays search query by 300ms
- Cancels previous if new input arrives

**components/** — Reusable UI components
- `AIChat.jsx` — Chat interface for Q&A
- `CommandPalette.jsx` — Cmd+K command menu
- `NoteForm.jsx` — Create/edit form with AI buttons
- `FilterBar.jsx` — Type/tag filtering
- `SearchBar.jsx` — Search with debounce

---

### **Backend Modules**

**server/services/ai.js** — Gemini integration
- `summarize()` — Generate summary
- `autotag()` — Extract tags
- `queryNotes()` — Q&A across notes
- `withRetry()` — Retry logic with backoff
- Concurrency queue management

**server/services/ml.js** — Python ML bridge
- `semanticSearch()` — Call /semantic-search endpoint
- `sentimentAnalysis()` — Call /sentiment endpoint
- `autoTagZeroShot()` — Call /autotag endpoint
- Fallback logic when ML service down

**server/db/queries.js** — MongoDB queries
- `findNotesByUser()` — User-scoped queries
- `upsertNote()` — Create or update
- `deleteNote()` — Delete with user check
- `.createIndex()` calls for performance

---

### **ML Service Modules**

**app/services/retrieval_service.py** — Embeddings & similarity
- `generate_embedding()` — BERT embedding generation
- `semantic_search()` — Query embeddings vs note embeddings
- `similar_notes()` — Find k-NN similar notes
- Fallback TF-IDF if Transformers unavailable

**app/services/sentiment_service.py** — Sentiment analysis
- `analyze_sentiment()` — Binary classification
- Fallback lexicon-based scoring

**app/services/autotag_service.py** — Zero-shot classification
- `autotag()` — Run MNLI zero-shot with candidate labels
- Fallback keyword-overlap matching

---

## 📝 License & Support

This project is provided as-is for personal knowledge management.

### **Further Documentation**

- **Frontend Details:** See [`client/README.md`](client/README.md)
- **Backend Details:** See [`server/README.md`](server/README.md)
- **ML Service Details:** See [`ml_service/README.md`](ml_service/README.md)
- **Full Technical Specs:** See [`doc.md`](doc.md)

### **Support & Issues**

For bugs, feature requests, or questions:
1. Check existing documentation
2. Review code comments in relevant module
3. Check GitHub issues (if applicable)
4. For ML service, verify Python dependencies and model downloads

---

**Made with 🧠 for knowledge makers everywhere.**

