# 🤖 ML Service (Python FastAPI Microservice)

> Standalone Python microservice for efficient local machine learning tasks in AI Cognitive Knowledge Retrieval System

**Status:** Optional (but recommended)  
**Runtime:** Python 3.9+  
**Framework:** FastAPI + Uvicorn  
**Models:** Hugging Face Transformers (BERT variants)  

This microservice provides lightweight, locally-deployable ML capabilities that enhance the main application without relying solely on cloud APIs. It handles:
- **Semantic search** — Understanding meaning, not just keywords
- **Similar-note retrieval** — Finding related notes by semantic similarity
- **Sentiment analysis** — Detecting emotional tone and mood of content
- **Zero-shot classification** — Auto-tagging with dynamic labels using transfer learning

---

## 📋 Table of Contents

1. [🎯 Overview & Architecture](#-overview--architecture)
2. [🤖 AI Models & Algorithms](#-ai-models--algorithms)
3. [📁 Project Structure](#-project-structure)
4. [🚀 Installation & Setup](#-installation--setup)
5. [📡 API Endpoints](#-api-endpoints)
6. [🔧 Configuration](#-configuration)
7. [🔄 Model Fallback Strategy](#-model-fallback-strategy)
8. [📊 Performance & Latency](#-performance--latency)
9. [🧪 Testing & Debugging](#-testing--debugging)
10. [🚀 Deployment](#-deployment)

---

## 🎯 Overview & Architecture

### **System Context Diagram**

```
AI Cognitive Knowledge Retrieval System Main Application (Node.js + Express)
    |
    | HTTP POST /semantic-search, /sentiment, /autotag
    | (JSON: {text, query, labels, ...})
    |
    v
PM ML Service (Python FastAPI, port 8001)
    |
    +── Model Registry (lazy loading, warmup)
    |
    +── BERT Tokenizer → Token IDs
    |
    +── Hugging Face Transformers Models:
    |   ├── all-MiniLM-L6-v2 (embedding)
    |   ├── DistilBERT SST-2 (sentiment)
    |   └── DistilBERT MNLI (zero-shot)
    |
    +── scikit-learn (cosine similarity, K-Means)
    |
    +── NumPy (vector operations)
    |
    v
Response: {results, scores, labels, ...}
    |
    v
[Back to Express, stored in MongoDB]
```

### **Why ML Microservice?**

✅ **Local Execution** — No external API calls for basic ML tasks  
✅ **Cost Savings** — Run heavy lifting locally, only use Gemini for complex synthesis  
✅ **Speed** — Avoid network latency for embeddings and sentiment  
✅ **Privacy** — All data stays within your infrastructure  
✅ **Resilience** — Works offline; fallback when ML service unavailable  
✅ **Customizable** — Swap models in `.env` without code changes  

---

## 🤖 AI Models & Algorithms

### **Model 1: Semantic Embeddings (all-MiniLM-L6-v2)**

**Task:** Convert text into dense vector representations  
**Model Size:** ~33MB (minimal)  
**Dimensions:** 384-dimensional vectors  
**Latency:** 50-200ms per embedding  
**Architecture:** BERT-based encoder with 6 transformer layers

#### How It Works:

```
Input: "Authentication bypass vulnerability in login form"
    ↓
Tokenize: ["authentication", "bypass", "vulnerability", ...]
    ↓
WordPiece encoding: [2054, 4509, 14697, ...]  (token IDs)
    ↓
BERT Embedding Layer: [batch_size, seq_len, embedding_dim]
    ↓
6 Transformer Layers:
  Layer 1: Self-attention + feed-forward
  Layer 2: Self-attention + feed-forward
  ...
  Layer 6: Self-attention + feed-forward
    ↓
[CLS] Token (special beginning token)
    ↓
Dense Projection: 768 → 384 dimensions
    ↓
Output: [0.12, -0.45, 0.67, ..., -0.23]  (384 values)
```

#### Use Cases:

**a) Semantic Search**
```
User query: "How do I fix XSS attacks?"

Step 1: Embed query → [q_embedding] (384 dims)
Step 2: Embed all notes → [[n1], [n2], ..., [n_k]] 
Step 3: Compute cosine similarity:
  score(query, note_i) = dot(q, n_i) / (||q|| * ||n_i||)
  Range: -1 to 1 (higher = more similar)
Step 4: Rank notes by score
Step 5: Return top-10

Example Scores:
  • Note "XSS prevention techniques" → 0.89 ✅ (very similar)
  • Note "SQL injection tutorial" → 0.34 (somewhat related)
  • Note "Office meeting notes" → 0.12 (not related)
```

**b) Similar-Note Retrieval**
```
User clicks "Show Related Notes" on security note

Step 1: Get embedding of current note
Step 2: Compute similarity to all 100 notes
Step 3: Filter by threshold (e.g., > 0.4)
Step 4: Sort by score

Output:
  [
    {id: "note2", title: "OWASP Top 10", score: 0.87},
    {id: "note5", title: "Authentication guide", score: 0.76},
    {id: "note8", title: "API security", score: 0.65}
  ]
```

**c) Clustering & Topic Discovery**
```
Apply K-Means clustering on all note embeddings:

Step 1: Generate embeddings for all notes (384 dims each)
Step 2: Normalize vectors (unit L2 norm)
Step 3: K-Means with k=5:
  - Initialize 5 random cluster centers
  - Assign notes to nearest center
  - Recompute centers as mean of cluster
  - Repeat until convergence
Step 4: Visualize clusters

Result:
  Cluster 1: [Backend, API, Database, Performance] (8 notes)
  Cluster 2: [Security, Auth, Encryption, Privacy] (6 notes)
  Cluster 3: [Frontend, UI, CSS, React] (5 notes)
  ...
```

---

### **Model 2: Sentiment Analysis (DistilBERT SST-2)**

**Task:** Classify emotional tone (positive, negative, neutral)  
**Model Size:** ~270MB  
**Task:** Binary classification (extended to 3-way with threshold)  
**Latency:** 30-100ms per analysis  
**Training Data:** Stanford Sentiment Treebank v2 (movie reviews)

#### How It Works:

```
Input: "Fixed critical security vulnerability. Feeling great!"
    ↓
Tokenize: ["fixed", "critical", "##security", "vulnerability", ...]
    ↓
DISTILBERT (6 layers, 66M params):
[CLS] token → Transformer layers → Contextualized embeddings
    ↓
Classification Head:
  Linear(768 → 2)  [for POSITIVE / NEGATIVE logits]
    ↓
Softmax: Convert logits to probabilities
  P(POSITIVE) = exp(logit_pos) / (exp(logit_pos) + exp(logit_neg))
  P(NEGATIVE) = 1 - P(POSITIVE)
    ↓
Output:
  {
    "label": "POSITIVE",
    "score": 0.92  // confidence
  }
```

#### Interpretation:

- **Score > 0.7** → Strong sentiment (positive or negative)
- **0.4 - 0.7** → Moderate sentiment
- **< 0.4** → Weak sentiment (near neutral)

#### Example Outputs:

```
"This is amazing!" → {label: "POSITIVE", score: 0.98}
"Not bad." → {label: "POSITIVE", score: 0.52}
"Just okay." → {label: "NEGATIVE", score: 0.51}  (near neutral)
"Terrible!" → {label: "NEGATIVE", score: 0.94}
```

#### Use Cases in AI Cognitive Knowledge Retrieval System:

1. **Mood Tracking** — Tag notes with emotional tone
2. **Content Filtering** — Highlight positive/negative notes in dashboard
3. **Emotional Arc** — Track mood changes over time in notes
4. **Dashboard Insight** — "You wrote mostly positive notes this week"

---

### **Model 3: Zero-Shot Classification (DistilBERT MNLI)**

**Task:** Classify text into any labels without fine-tuning  
**Model Size:** ~260MB  
**Task:** Natural Language Inference (entailment/contradiction/neutral)  
**Latency:** 100-300ms per classification (depends on label count)  
**Training Data:** Multi-Genre Natural Language Inference corpus

#### How It Works:

The trick: **Convert classification into entailment**

```
Text: "I need to fix a critical database query that's causing performance issues"

Candidate Labels:
  ["backend", "frontend", "performance", "emergency", "database", ...]

For each label, create a hypothesis:
  1. "This text is about backend" → Compute entailment
  2. "This text is about frontend" → Compute entailment
  3. "This text is about performance" → Compute entailment
  4. ...

For each (text, hypothesis) pair:
  Tokenize: [text, </s></s>, "This text is about", label]
    ↓
  DistilBERT MNLI (6 layers):
    Input encoding with position embeddings
    ↓
    6 Transformer layers with self-attention
    ↓
    [CLS] token logits
    ↓
  Classification Head (3 classes):
    ENTAILMENT (0) — Label applies to text
    NEUTRAL (1) — Unsure
    CONTRADICTION (2) — Label doesn't apply
    ↓
  Softmax → Probability distribution
    ↓
  Extract P(ENTAILMENT) for each label

Results (sorted by entailment score):
  1. "database" → 0.94 ✅ explicitly mentioned
  2. "performance" → 0.89 ✅ explicitly mentioned
  3. "backend" → 0.76 ✅ related to database
  4. "frontend" → 0.15 ❌ not related
  5. "design" → 0.08 ❌ not related

Final tags (filter by 0.5 threshold):
  ["database", "performance", "backend"]
```

#### Why This Works:

MNLI trained to understand **logical entailment** — what logically follows from a premise. By framing labels as hypotheses, the model learns which labels make sense.

#### Use Cases:

1. **Auto-Tagging** — Tag notes without predefined label lists
2. **Dynamic Categories** — Classify by ANY set of labels
3. **Multi-Label** — One note can match multiple labels
4. **Transfer Learning** — Leverages understanding from language inference

---

### **Custom Algorithms**

#### **Algorithm A: Cosine Similarity Search**

Used when embeddings are available.

```python
def cosine_similarity(vec_a, vec_b):
    """
    Compute cosine similarity between two vectors
    Formula: cos(θ) = (A · B) / (||A|| * ||B||)
    """
    dot_product = numpy.dot(vec_a, vec_b)
    norm_a = numpy.linalg.norm(vec_a)
    norm_b = numpy.linalg.norm(vec_b)
    
    if norm_a == 0 or norm_b == 0:
        return 0.0
    
    return dot_product / (norm_a * norm_b)  # Range: -1 to 1

# Search across 1000 notes:
query_embedding = embed(user_query)  # 384 dims

scores = []
for note in all_notes:
    note_embedding = note.embedding  # pre-computed, cached
    score = cosine_similarity(query_embedding, note_embedding)
    if score > threshold:  # e.g., 0.3
        scores.append((note, score))

results = sorted(scores, key=lambda x: x[1], reverse=True)[:10]
# Complexity: O(n · d) where n=1000 notes, d=384 dims
# Time: ~10-50ms for typical corpus
```

---

#### **Algorithm B: TF-IDF Ranked Search (Fallback)**

Used when embeddings unavailable.

```python
def tfidf_search(query, documents):
    """
    TF-IDF: Term Frequency × Inverse Document Frequency
    
    TF(term) = (count of term in doc) / (total terms in doc)
    IDF(term) = log(total docs / docs containing term)
    TF-IDF = TF × IDF
    """
    
    # Tokenize and stem
    query_tokens = tokenize_and_stem(query)
    
    # Compute IDF for each term
    idf = {}
    for term in set(query_tokens):
        docs_with_term = sum(1 for doc in documents if term in doc)
        idf[term] = log(len(documents) / (docs_with_term + 1))
    
    # Score each document
    scores = []
    for doc in documents:
        doc_tokens = tokenize_and_stem(doc.content)
        score = 0.0
        
        for term in query_tokens:
            if term in doc_tokens:
                # Count term frequency
                tf = doc_tokens.count(term) / len(doc_tokens)
                score += tf * idf.get(term, 0)
        
        if score > 0:
            scores.append((doc, score))
    
    return sorted(scores, key=lambda x: x[1], reverse=True)[:10]

# Time: O(n × m) where n=docs, m=avg tokens
# Typical: ~50-200ms for 1000 docs
```

---

#### **Algorithm C: Lexicon-Based Sentiment (Fallback)**

Used when DistilBERT unavailable.

```python
POSITIVE_WORDS = {
    'good', 'great', 'amazing', 'excellent', 'love', 'fantastic',
    'beautiful', 'perfect', 'wonderful', 'awesome', 'happy', 'glad',
    'pleased', 'delighted', 'brilliant', 'superb', 'outstanding'
}

NEGATIVE_WORDS = {
    'bad', 'terrible', 'awful', 'horrible', 'hate', 'poor',
    'ugly', 'worst', 'broken', 'annoying', 'sad', 'upset',
    'disappointed', 'disgusting', 'pathetic', 'dreadful'
}

def lexicon_sentiment(text):
    words = text.lower().split()
    
    pos_count = sum(1 for w in words if w in POSITIVE_WORDS)
    neg_count = sum(1 for w in words if w in NEGATIVE_WORDS)
    total = pos_count + neg_count
    
    if total == 0:
        return {"label": "NEUTRAL", "score": 0.5}
    
    pos_ratio = pos_count / total
    
    if pos_ratio > 0.6:
        return {"label": "POSITIVE", "score": 0.7 + pos_ratio * 0.1}
    elif pos_ratio < 0.4:
        return {"label": "NEGATIVE", "score": 0.7 + (1 - pos_ratio) * 0.1}
    else:
        return {"label": "NEUTRAL", "score": 0.5}

# Time: O(n) where n=tokens in document
# Very fast, ~1ms per document
```

---

## 📁 Project Structure

```
ml_service/
│
├── README.md (this file)
├── requirements.txt            # Python dependencies
├── .env.example                # Configuration template
│
├── app/
│   ├── __init__.py
│   ├── main.py                # FastAPI app & routes
│   │
│   ├── core/
│   │   └── config.py          # Model names, limits
│   │
│   ├── api/
│   │   └── routes/
│   │       ├── embeddings.py  # /semantic-search
│   │       ├── sentiment.py   # /sentiment
│   │       ├── autotag.py     # /autotag
│   │       └── health.py      # /health
│   │
│   └── services/
│       ├── retrieval_service.py   # Embedding & similarity
│       ├── sentiment_service.py   # Sentiment analysis
│       ├── autotag_service.py     # Zero-shot classification
│       └── model_registry.py      # Lazy loading & warmup
```

---

## 🚀 Installation & Setup

### **Prerequisites**

- Python 3.9+
- Virtual environment (venv, conda, etc.)
- ~2GB disk space (for model downloads)

### **Install**

```bash
cd ml_service

# Create virtual environment
python -m venv .venv

# Activate
# Windows cmd:
.venv\Scripts\activate.bat
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Install accelerated versions
pip install torch sentence-transformers

# Verify installation
python -c "from transformers import AutoModel; print('✅ Transformers installed')"
```

### **Configuration**

```bash
# Copy template
cp .env.example .env

# Edit .env (optional, defaults are sensible)
# ML_EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
# ML_SENTIMENT_MODEL=distilbert-base-uncased-finetuned-sst-2-english
# ML_ZERO_SHOT_MODEL=typeform/distilbert-base-uncased-mnli
```

### **Start Service**

```bash
# Activate venv first
source .venv/bin/activate  # or .venv\Scripts\activate

# Run Uvicorn server
uvicorn app.main:app --host 127.0.0.1 --port 8001

# Output:
# Uvicorn running on http://127.0.0.1:8001
# Press CTRL+C to quit
```

### **Update Backend Configuration**

In `server/.env`:
```env
ML_SERVICE_URL=http://127.0.0.1:8001
ML_REQUEST_TIMEOUT_MS=10000
```

---

## 📡 API Endpoints

### **POST /semantic-search**
Semantic search across documents using embeddings.

**Request:**
```json
{
  "query": "How do I fix authentication issues?",
  "documents": [
    {"id": "note1", "text": "Login page redirects to signup incorrectly"},
    {"id": "note2", "text": "Database performance tuning tips"},
    {"id": "note3", "text": "OAuth implementation guide"}
  ],
  "top_k": 5
}
```

**Response:**
```json
{
  "results": [
    {
      "id": "note3",
      "score": 0.89,
      "text": "OAuth implementation guide"
    },
    {
      "id": "note1",
      "score": 0.76,
      "text": "Login page redirects to signup incorrectly"
    }
  ]
}
```

---

### **POST /sentiment**
Analyze emotional tone of text.

**Request:**
```json
{
  "text": "Fixed critical security vulnerability. Feeling proud!"
}
```

**Response:**
```json
{
  "label": "POSITIVE",
  "score": 0.94,
  "confidence": 0.94
}
```

---

### **POST /autotag**
Classify text into candidate labels using zero-shot learning.

**Request:**
```json
{
  "text": "Implemented JWT token refresh mechanism in auth service",
  "labels": [
    "backend", "frontend", "security", "database",
    "performance", "documentation", "ui/ux"
  ],
  "threshold": 0.5
}
```

**Response:**
```json
{
  "tags": [
    {
      "label": "backend",
      "score": 0.94
    },
    {
      "label": "security",
      "score": 0.87
    }
  ],
  "filtered_tags": ["backend", "security"]
}
```

---

### **GET /health**
Service health check.

**Response:**
```json
{
  "status": "healthy",
  "models": {
    "embedding": "loaded",
    "sentiment": "loaded",
    "zero_shot": "loaded"
  },
  "uptime": 3600
}
```

---

## 🔧 Configuration

### **Model Selection (.env)**

```env
# Embedding model (sentence-transformers)
ML_EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
# Options:
# - all-MiniLM-L6-v2 (384 dims, fast)
# - all-mpnet-base-v2 (768 dims, slower, better quality)

# Sentiment model (Hugging Face)
ML_SENTIMENT_MODEL=distilbert-base-uncased-finetuned-sst-2-english
# Options:
# - distilbert-base-uncased-finetuned-sst-2-english (small, fast)
# - roberta-large-mnli (larger, better quality)

# Zero-shot classification model
ML_ZERO_SHOT_MODEL=typeform/distilbert-base-uncased-mnli
# Options:
# - typeform/distilbert-base-uncased-mnli (small, fast)
# - facebook/bart-large-mnli (larger, better quality)

# Limits
ML_MAX_QUERY_CHARS=1200
ML_MAX_AUTOTAG_CHARS=2500
```

---

## 🔄 Model Fallback Strategy

When the ML service is unavailable or errors occur:

```
User request: semantic-search
    ↓
Try: Call ML Service with 10s timeout
    ✓ Success → Return results directly
    ✗ Timeout (10s) → Fallback
    ✗ Error (model not loaded) → Fallback
    ✗ Network error → Fallback
    |
    v
Fallback 1: TF-IDF search (if corpus small, < 10k docs)
    Results: Ranked by keyword overlap, ~50-200ms
    ✓ Success → Cache result
    ✗ Slow/error → Fallback 2
    |
    v
Fallback 2: Keyword exact match
    Results: Documents containing all query terms
    ✓ Success → Return limited results
    ✗ No matches → Return empty
```

---

## 📊 Performance & Latency

### **Expected Latencies**

| Task | With Transformers | With Fallback | Notes |
|------|------------------|---------------|-------|
| Embed 1 note | 50-100ms | 1-2ms (TF-IDF) | Embeddings cached after first compute |
| Search 1000 notes | 50-100ms (embed query) + 10-20ms (similarity) = **60-120ms** | 50-200ms (TF-IDF) | Linear scan across corpus |
| Sentiment 1 note | 30-100ms | 1-5ms (lexicon) | Usually < 50ms |
| Auto-tag (10 labels) | 100-300ms | 10-20ms (keyword) | Slower with more labels |
| Batch embed (100 notes) | 500-1000ms | N/A | Parallelized |

### **Memory Usage**

| Component | Size |
|-----------|------|
| all-MiniLM embeddings | 33MB (model) + ~400MB (in memory) |
| DistilBERT sentiment | 270MB (model) + ~600MB (in memory) |
| DistilBERT MNLI | 260MB (model) + ~600MB (in memory) |
| All 3 models loaded | ~1.6GB RAM |
| Embedding cache (1000 notes) | ~350KB |

### **Optimization Tips**

✔️ Cache embeddings in MongoDB (avoid recomputation)  
✔️ Batch requests when possible  
✔️ Use smaller models for speed, larger for quality  
✔️ Implement request timeouts (10-15s)  
✔️ Monitor memory usage, set worker limits  

---

## 🧪 Testing & Debugging

### **Quick Test**

```bash
# While service running, in another terminal:

# Health check
curl http://127.0.0.1:8001/health

# Test semantic search
curl -X POST http://127.0.0.1:8001/semantic-search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "security vulnerability",
    "documents": [
      {"id": "1", "text": "SQL injection attack prevention"},
      {"id": "2", "text": "office meeting notes"}
    ]
  }'
  
# Expected: SQL injection note scores higher
```

### **Enable Logging**

```bash
# Windows
set DEBUG=*
uvicorn app.main:app

# Linux/macOS
DEBUG=* uvicorn app.main:app
```

### **Profile Performance**

```python
# In app/main.py:
import time

@app.post("/semantic-search")
async def semantic_search(req):
    start = time.time()
    
    # ... processing ...
    
    elapsed = time.time() - start
    print(f"Semantic search took {elapsed*1000:.1f}ms")
```

---

## 🚀 Deployment

### **Docker Deployment**

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
```

```bash
docker build -t second-brain-ml .
docker run -p 8001:8001 second-brain-ml
```

### **Production Environment**

```env
# .env.production
DEBUG=false
ML_EMBEDDING_MODEL=all-mpnet-base-v2  # higher quality
WORKERS=4  # parallel Uvicorn workers
```

### **Monitoring**

- Health endpoint: `/health` every 30s
- Log model load times and errors
- Monitor RAM usage (should stay < 2GB)
- Set request timeouts (10s default)

---

## 📚 Integration with Node Backend

The backend (`server/services/ml.js`) automatically:

1. ✓ Calls ML service endpoints with timeout
2. ✓ Caches results to avoid duplicate work
3. ✓ Falls back gracefully if ML service unavailable
4. ✓ Stores embeddings for future queries

**No additional configuration needed** after setting:
```env
ML_SERVICE_URL=http://127.0.0.1:8001
ML_REQUEST_TIMEOUT_MS=10000
```

---

## 📚 Additional Resources

- **Main README:** See [`../README.md`](../README.md)
- **Frontend Details:** See [`../client/README.md`](../client/README.md)
- **Backend Details:** See [`../server/README.md`](../server/README.md)
- **Model Hub:** https://huggingface.co/models
- **Sentence Transformers:** https://www.sbert.net/

---

**Made with 🤖 for intelligent understanding**


