# 🔧 AI Cognitive Knowledge Retrieval System Backend

> Node.js + Express API server for AI Cognitive Knowledge Retrieval System knowledge management system

**Status:** Production-Ready  
**Runtime:** Node.js 18+  
**Framework:** Express 4.18.x  
**Database:** MongoDB 7.1  
**AI Provider:** Google Gemini 2.0-flash  

---

## 📋 Table of Contents

1. [📁 Project Structure](#-project-structure)
2. [🚀 Core Architecture](#-core-architecture)
3. [🛣️ Route Handlers](#️-route-handlers)
4. [🧠 Service Layer](#-service-layer)
5. [🗄️ Database Layer](#-database-layer)
6. [🤖 AI Integration](#-ai-integration)
7. [🔐 Authentication & Security](#-authentication--security)
8. [⚙️ Middleware & Utilities](#️-middleware--utilities)
9. [📊 Request/Response Patterns](#-requestresponse-patterns)
10. [🛡️ Error Handling](#️-error-handling)
11. [📈 Monitoring & Debugging](#-monitoring--debugging)
12. [🛠️ Development Guide](#️-development-guide)
13. [🚀 Deployment](#-deployment)

---

## 📁 Project Structure

```
server/
│
├── README.md (this file)
├── .env.example                # Environment template
├── package.json                # Dependencies
├── index.js                    # Express entry point
│
├── middleware/                 # Express middleware
│   ├── auth.js                # Firebase token verification
│   └── validate.js            # Input validation & sanitization
│
├── routes/                     # API route handlers
│   ├── notes.js               # /api/notes endpoints
│   ├── ai.js                  # /api/ai endpoints
│   ├── user.js                # /api/user endpoints
│   ├── tags.js                # /api/tags endpoints
│   └── public.js              # /api/public endpoints
│
├── services/                   # Business logic
│   ├── ai.js                  # Gemini integration + queue
│   └── ml.js                  # Python ML bridge
│
└── db/                         # Database access
    ├── pool.js                # MongoDB connection
    ├── queries.js             # Query builders & helpers
    ├── init.js                # Schema initialization
    └── schema.sql             # (Legacy reference)
```

---

## 🚀 Core Architecture

### **Request Flow Diagram**

```
HTTP Request (Client)
    ↓
Express Server (http://localhost:4000)
    ↓
Helmet Security Headers (CORS, CSP, etc.)
    ↓
Request logging (Morgan)
    ↓
JSON body parser (limit: 10MB)
    ↓
Rate limiting (generic + AI-specific)
    ↓
Route mapping (/api/*)
    ↓
Auth Middleware (Firebase Admin)
    ├─ Success: req.user + req.dbUser set
    └─ Failure: return 401 Unauthorized
    ↓
Route handler (controller)
    ├─ Request validation
    ├─ Database queries
    ├─ AI service calls (optional)
    ├─ Data transformation
    └─ Response building
    ↓
Compression (gzip if size > 1KB)
    ↓
HTTP Response (JSON or error)
    ↓
[Back to Client]
```

### **Server Startup (index.js)**

```javascript
// Load environment
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Initialize Express
const app = express();

// Security & middleware
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined'));

// Rate limiting
app.use('/api/', createRateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use('/api/ai/', createRateLimiter({ windowMs: 15 * 60 * 1000, max: 20 }));

// Auth middleware
app.use('/api/', authMiddleware);

// Routes
app.use('/api/notes', noteRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/user', userRoutes);
app.use('/api/tags', tagsRoutes);
app.use('/api/public', publicRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    mongodb: db.isConnected(),
    timestamp: new Date().toISOString(),
  });
});

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
```

---

## 🛣️ Route Handlers

### **Notes Routes (routes/notes.js)**

```javascript
// GET /api/notes
// List all notes for authenticated user with filters
// Query params: q, type, tags, sortBy, limit, skip
// Response: { notes: [...], total: number }

router.get('/', auth, async (req, res) => {
  const { q, type, tags, sortBy = 'newest', limit = 20, skip = 0 } = req.query;
  
  const query = { user_id: req.dbUser.id };
  
  // Search by title, content, summary
  if (q) {
    query.$or = [
      { title: new RegExp(q, 'i') },
      { content: new RegExp(q, 'i') },
      { summary: new RegExp(q, 'i') },
    ];
  }
  
  // Filter by type
  if (type) query.type = type;
  
  // Filter by tags
  if (tags) query.tags = { $in: tags.split(',') };
  
  // Execute query
  const notes = await db.collection('notes')
    .find(query)
    .sort({ [sortMap[sortBy]]: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(skip))
    .toArray();
  
  const total = await db.collection('notes').countDocuments(query);
  
  res.json({ notes, total });
});

// POST /api/notes
// Create new note
// Body: { title, content, type, source_url }
// Response: { _id, user_id, ...note }

router.post('/', auth, validate.noteCreate, async (req, res) => {
  const { title, content, type, source_url } = req.body;
  
  // Calculate metadata
  const wordCount = content.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200); // avg 200 wpm
  
  const note = {
    user_id: req.dbUser.id,
    title,
    content,
    type,
    source_url,
    summary: '',
    tags: [],
    sentiment: null,
    reading_time: readingTime,
    word_count: wordCount,
    is_public: false,
    is_pinned: false,
    is_favorite: false,
    todo_done: type !== 'todo' ? null : false,
    ai_processed: false,
    created_at: new Date(),
    updated_at: new Date(),
  };
  
  // Save to database
  const result = await db.collection('notes').insertOne(note);
  
  // Queue AI processing if enabled
  if (process.env.AUTO_PROCESS_NOTES_WITH_AI === 'true') {
    aiQueue.push({
      type: 'process_note',
      noteId: result.insertedId,
      userId: req.dbUser.id,
      content,
    });
  }
  
  res.status(201).json({ ...note, _id: result.insertedId });
});

// GET /api/notes/:id
// Get single note (only if user owns it)
router.get('/:id', auth, async (req, res) => {
  const note = await db.collection('notes').findOne({
    _id: new ObjectId(req.params.id),
    user_id: req.dbUser.id, // Ownership check
  });
  
  if (!note) return res.status(404).json({ error: 'Note not found' });
  res.json(note);
});

// PATCH /api/notes/:id
// Update note
router.patch('/:id', auth, async (req, res) => {
  const updates = {};
  const allowed = ['title', 'content', 'type', 'source_url', 'summary', 'tags'];
  
  allowed.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });
  
  updates.updated_at = new Date();
  
  const result = await db.collection('notes').findOneAndUpdate(
    { _id: new ObjectId(req.params.id), user_id: req.dbUser.id },
    { $set: updates },
    { returnDocument: 'after' }
  );
  
  if (!result.value) return res.status(404).json({ error: 'Note not found' });
  res.json(result.value);
});

// DELETE /api/notes/:id
router.delete('/:id', auth, async (req, res) => {
  const result = await db.collection('notes').deleteOne({
    _id: new ObjectId(req.params.id),
    user_id: req.dbUser.id,
  });
  
  if (result.deletedCount === 0) {
    return res.status(404).json({ error: 'Note not found' });
  }
  
  res.json({ message: 'Note deleted' });
});

// PATCH /api/notes/:id/toggle
// Toggle flags (pin, favorite, todo_done, is_public)
router.patch('/:id/toggle', auth, async (req, res) => {
  const { field } = req.body;
  const allowed = ['is_pinned', 'is_favorite', 'todo_done', 'is_public'];
  
  if (!allowed.includes(field)) {
    return res.status(400).json({ error: 'Invalid field' });
  }
  
  // Fetch current value
  const note = await db.collection('notes').findOne(
    { _id: new ObjectId(req.params.id), user_id: req.dbUser.id }
  );
  
  if (!note) return res.status(404).json({ error: 'Note not found' });
  
  // Toggle and update
  const newValue = !note[field];
  const result = await db.collection('notes').findOneAndUpdate(
    { _id: new ObjectId(req.params.id), user_id: req.dbUser.id },
    { $set: { [field]: newValue, updated_at: new Date() } },
    { returnDocument: 'after' }
  );
  
  res.json(result.value);
});

// GET /api/notes/:id/export
// Export note as markdown
router.get('/:id/export', auth, async (req, res) => {
  const note = await db.collection('notes').findOne({
    _id: new ObjectId(req.params.id),
    user_id: req.dbUser.id,
  });
  
  if (!note) return res.status(404).json({ error: 'Note not found' });
  
  const markdown = `# ${note.title}

**Type:** ${note.type}  
**Created:** ${note.created_at}  
**Reading Time:** ${note.reading_time} min  
**Tags:** ${note.tags.join(', ')}

---

${note.content}

---

**Summary:** ${note.summary || 'N/A'}
`;
  
  res.setHeader('Content-Type', 'text/markdown');
  res.setHeader('Content-Disposition', `attachment; filename="${note.title}.md"`);
  res.send(markdown);
});
```

---

### **AI Routes (routes/ai.js)**

```javascript
// POST /api/ai/summarize
// Generate AI summary of note content
router.post('/summarize', auth, async (req, res) => {
  const { content, length = 'medium' } = req.body;
  
  try {
    const summary = await aiService.summarize(content, length);
    res.json({ summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/autotag
// Generate tags for note using Gemini + MNLI
router.post('/autotag', auth, async (req, res) => {
  const { content, candidates } = req.body;
  
  try {
    // Step 1: Quick Gemini suggestions
    const geminiTags = await aiService.autotag(content);
    
    // Step 2: Validate with MNLI zero-shot
    const mlTags = await mlService.autotag(content, [
      ...geminiTags,
      ...(candidates || []),
    ]);
    
    // Step 3: Merge and deduplicate
    const mergedTags = [...new Set([...geminiTags, ...mlTags])];
    
    res.json({ tags: mergedTags });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/query
// Ask question across user's notes (Gemini-powered)
router.post('/query', auth, async (req, res) => {
  const { question } = req.body;
  
  try {
    // Fetch user's recent notes
    const notes = await db.collection('notes')
      .find({ user_id: req.dbUser.id })
      .limit(50)
      .toArray();
    
    const noteContent = notes
      .map(n => `# ${n.title}\n${n.content}`)
      .join('\n\n');
    
    // Stream response from Gemini
    const stream = await aiService.queryWithStream(question, noteContent);
    
    res.setHeader('Content-Type', 'application/json');
    
    for await (const chunk of stream) {
      res.write(JSON.stringify({ chunk }));
    }
    
    // Save to conversation history
    await db.collection('conversations').updateOne(
      { user_id: req.dbUser.id },
      {
        $push: {
          messages: [
            { role: 'user', content: question, timestamp: new Date() },
            { role: 'assistant', content: stream.full, timestamp: new Date() },
          ],
        },
      },
      { upsert: true }
    );
    
    res.end();
  } catch (error) {
    res.json({ error: error.message });
  }
});

// GET /api/ai/digest
// Generate daily digest of recent notes
router.get('/digest', auth, async (req, res) => {
  try {
    const digest = await aiService.generateDigest(req.dbUser.id);
    res.json(digest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Other AI endpoints...
// /api/ai/improve - writing improvement
// /api/ai/connections - related notes
// /api/ai/sentiment - sentiment analysis
// /api/ai/cluster - topic clustering
// /api/ai/mindmap - mind map generation
// /api/ai/flashcards - flashcard generation
// /api/ai/insights - insight extraction
```

---

## 🧠 Service Layer

### **AI Service (services/ai.js)**

Core Gemini integration with concurrency control.

```javascript
const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

// Initialize conditionally
let model = null;
if (GEMINI_API_KEY.trim()) {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
}

// Concurrency queue (default: 1 concurrent request)
const MAX_CONCURRENT = parseInt(process.env.AI_MAX_CONCURRENT || '1');
const MAX_QUEUE = parseInt(process.env.AI_MAX_QUEUE || '50');

let concurrent = 0;
const queue = [];

async function withRetry(fn, retries = 3) {
  // Guard: check if API key is available
  if (!model || !GEMINI_API_KEY.trim()) {
    throw new Error('Gemini API key not configured');
  }
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Wait for concurrency slot
      while (concurrent >= MAX_CONCURRENT) {
        await new Promise(resolve => queue.push(resolve));
      }
      
      concurrent++;
      
      // Execute function
      const result = await fn();
      
      // Release slot and process queue
      concurrent--;
      const resolve = queue.shift();
      if (resolve) resolve();
      
      return result;
    } catch (error) {
      if (error.status === 429 && attempt < retries - 1) {
        // Quota exceeded: exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(r => setTimeout(r, delay));
      } else {
        throw error;
      }
    }
  }
}

// Summarization
async function summarize(content, length = 'medium') {
  return withRetry(async () => {
    const prompt = `Summarize the following text in ${length} length (2-3 sentences for short, 4-5 for medium, 6-8 for long):

${content}

Summary:`;
    
    const result = await model.generateContent(prompt);
    return result.response.text();
  });
}

// Auto-tagging
async function autotag(content) {
  return withRetry(async () => {
    const prompt = `Extract 3-5 concise tags from this content. Return as comma-separated list:

${content}

Tags:`;
    
    const result = await model.generateContent(prompt);
    return result.response.text().split(',').map(t => t.trim());
  });
}

// Conversational Q&A
async function query(question, noteContent) {
  return withRetry(async () => {
    const prompt = `You are a knowledge assistant. Use the provided notes to answer the question.
If the answer is not in the notes, say "Not found in your knowledge base."

Notes:
${noteContent}

Question: ${question}

Answer:`;
    
    const result = await model.generateContent(prompt);
    return result.response.text();
  });
}

// Streaming response
async function queryWithStream(question, noteContent) {
  return withRetry(async () => {
    const prompt = `You are a knowledge assistant...`;
    
    const result = await model.generateContentStream(prompt);
    
    let fullText = '';
    const stream = {
      async *[Symbol.asyncIterator]() {
        for await (const chunk of result.stream) {
          const text = chunk.text();
          fullText += text;
          yield text;
        }
      },
      full: fullText,
    };
    
    return stream;
  });
}

module.exports = {
  summarize,
  autotag,
  query,
  queryWithStream,
  // ... other AI functions
};
```

### **ML Bridge (services/ml.js)**

Integration with Python ML microservice.

```javascript
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8001';
const ML_REQUEST_TIMEOUT_MS = parseInt(process.env.ML_REQUEST_TIMEOUT_MS || '10000');

// Wrapper for ML service calls with timeout
async function callMLService(endpoint, data) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ML_REQUEST_TIMEOUT_MS);
    
    const response = await fetch(`${ML_SERVICE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: controller.signal,
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) throw new Error(`ML service error: ${response.status}`);
    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn(`ML service timeout (${ML_REQUEST_TIMEOUT_MS}ms)`);
      return null; // Fallback to Gemini
    }
    throw error;
  }
}

// Semantic search via embeddings
async function semanticSearch(query, notes) {
  try {
    const ml_results = await callMLService('/semantic-search', {
      query,
      documents: notes.map(n => ({ id: n._id, text: n.content })),
    });
    
    if (!ml_results) {
      // Fallback: TF-IDF via Gemini
      return fallbackTFIDFSearch(query, notes);
    }
    
    return ml_results.results;
  } catch (error) {
    console.error('ML semantic search failed:', error);
    return fallbackTFIDFSearch(query, notes);
  }
}

// Sentiment analysis
async function analyzeSentiment(content) {
  try {
    const result = await callMLService('/sentiment', { text: content });
    
    if (!result) {
      // Fallback: lexicon-based
      return fallbackLexiconSentiment(content);
    }
    
    return result;
  } catch (error) {
    console.error('ML sentiment failed:', error);
    return fallbackLexiconSentiment(content);
  }
}

// Zero-shot classification
async function zeroShotTag(content, candidates) {
  try {
    const result = await callMLService('/autotag', {
      text: content,
      labels: candidates,
    });
    
    if (!result) {
      // Fallback: keyword matching
      return fallbackKeywordTag(content, candidates);
    }
    
    return result.tags;
  } catch (error) {
    console.error('ML zero-shot failed:', error);
    return fallbackKeywordTag(content, candidates);
  }
}

// Fallback functions
function fallbackTFIDFSearch(query, notes) {
  // Simple TF-IDF scoring
  const queryTerms = query.toLowerCase().split(/\s+/);
  const scored = notes.map(note => {
    const noteTerms = note.content.toLowerCase().split(/\s+/);
    const score = queryTerms.reduce((sum, term) => {
      return sum + (noteTerms.includes(term) ? 1 : 0);
    }, 0);
    return { ...note, score };
  });
  return scored.sort((a, b) => b.score - a.score).slice(0, 5);
}

function fallbackLexiconSentiment(content) {
  const positive = /great|awesome|love|excellent|happy/i;
  const negative = /bad|hate|terrible|awful|sad/i;
  
  const posMatch = content.match(positive);
  const negMatch = content.match(negative);
  
  if (posMatch && !negMatch) {
    return { label: 'POSITIVE', score: 0.8 };
  } else if (negMatch && !posMatch) {
    return { label: 'NEGATIVE', score: 0.8 };
  } else {
    return { label: 'NEUTRAL', score: 0.5 };
  }
}

function fallbackKeywordTag(content, candidates) {
  const terms = content.toLowerCase().split(/\s+/);
  return candidates.filter(c => {
    return c.split(/\s+/).some(word => terms.includes(word));
  });
}

module.exports = {
  semanticSearch,
  analyzeSentiment,
  zeroShotTag,
};
```

---

## 🗄️ Database Layer

### **MongoDB Connection (db/pool.js)**

```javascript
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'second_brain';

let client = null;
let db = null;

async function connect() {
  if (client) return db;
  
  const options = {
    maxPoolSize: parseInt(process.env.MONGO_MAX_POOL_SIZE || '10'),
    minPoolSize: parseInt(process.env.MONGO_MIN_POOL_SIZE || '2'),
    maxConnecting: parseInt(process.env.MONGO_MAX_CONNECTING || '5'),
    waitQueueTimeoutMS: parseInt(process.env.MONGO_WAIT_QUEUE_TIMEOUT_MS || '10000'),
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };
  
  try {
    client = new MongoClient(MONGODB_URI, options);
    await client.connect();
    
    db = client.db(MONGODB_DB_NAME);
    
    // Create indexes
    await initIndexes();
    
    console.log(`✅ Connected to MongoDB: ${MONGODB_DB_NAME}`);
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

async function initIndexes() {
  // Users
  await db.collection('users').createIndex({ firebase_uid: 1 }, { unique: true });
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('users').createIndex({ username: 1 }, { unique: true, sparse: true });
  
  // Notes
  await db.collection('notes').createIndex({ user_id: 1, created_at: -1 });
  await db.collection('notes').createIndex({ user_id: 1, type: 1 });
  await db.collection('notes').createIndex({ user_id: 1, tags: 1 });
  await db.collection('notes').createIndex({ is_public: 1, created_at: -1 });
  await db.collection('notes').createIndex({ title: 'text', content: 'text', summary: 'text' });
  
  // Conversations
  await db.collection('conversations').createIndex({ user_id: 1 }, { unique: true });
}

async function disconnect() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('Disconnected from MongoDB');
  }
}

module.exports = {
  connect,
  getDb: () => db,
  disconnect,
  isConnected: () => !!client && client.topology.isConnected(),
};
```

### **Query Builders (db/queries.js)**

```javascript
const { ObjectId } = require('mongodb');

// Find notes by user
async function findNotesByUser(userId, query = {}, options = {}) {
  const { limit = 20, skip = 0, sort = { created_at: -1 } } = options;
  
  return db
    .collection('notes')
    .find({ user_id: userId, ...query })
    .sort(sort)
    .limit(limit)
    .skip(skip)
    .toArray();
}

// Count notes by user and optional query
async function countNotesByUser(userId, query = {}) {
  return db.collection('notes').countDocuments({ user_id: userId, ...query });
}

// Get single note with ownership check
async function getNoteById(noteId, userId) {
  return db.collection('notes').findOne({
    _id: new ObjectId(noteId),
    user_id: userId,
  });
}

// Create or update note
async function upsertNote(noteId, userId, updates) {
  return db.collection('notes').findOneAndUpdate(
    { _id: new ObjectId(noteId), user_id: userId },
    { $set: { ...updates, updated_at: new Date() } },
    { returnDocument: 'after' }
  );
}

// Get user profile
async function getUserProfile(userId) {
  return db.collection('users').findOne({ _id: new ObjectId(userId) });
}

// Get or create user from Firebase UID
async function upsertUserFromFirebase(firebaseUID, email, displayName) {
  const result = await db.collection('users').findOneAndUpdate(
    { firebase_uid: firebaseUID },
    {
      $setOnInsert: {
        firebase_uid: firebaseUID,
        email,
        display_name: displayName,
        created_at: new Date(),
      },
      $set: { updated_at: new Date() },
    },
    { upsert: true, returnDocument: 'after' }
  );
  
  return result.value;
}

// Get user's tags with counts
async function getUserTags(userId) {
  const result = await db
    .collection('notes')
    .aggregate([
      { $match: { user_id: userId } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ])
    .toArray();
  
  return result.map(r => ({ tag: r._id, count: r.count }));
}

module.exports = {
  findNotesByUser,
  countNotesByUser,
  getNoteById,
  upsertNote,
  getUserProfile,
  upsertUserFromFirebase,
  getUserTags,
};
```

---

## 🔐 Authentication & Security

### **Auth Middleware (middleware/auth.js)**

```javascript
const admin = require('firebase-admin');

async function authMiddleware(req, res, next) {
  // Development bypass
  if (process.env.AUTH_MODE === 'local') {
    req.user = {
      uid: process.env.DEV_LOCAL_UID || 'dev-user-123',
      email: process.env.DEV_LOCAL_EMAIL || 'dev@example.com',
    };
    
    req.dbUser = {
      id: req.user.uid,
      email: req.user.email,
      display_name: process.env.DEV_LOCAL_NAME || 'Developer',
    };
    
    return next();
  }
  
  // Production: verify Firebase token
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  
  const token = authHeader.substring(7);
  
  try {
    // Verify with Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    req.user = decodedToken;
    
    // Fetch or create user in database
    const dbUser = await db.collection('users').findOne({ firebase_uid: decodedToken.uid });
    
    if (!dbUser) {
      // Create user on first login
      const newUser = {
        firebase_uid: decodedToken.uid,
        email: decodedToken.email,
        display_name: decodedToken.name || decodedToken.email.split('@')[0],
        photo_url: decodedToken.picture,
        created_at: new Date(),
        updated_at: new Date(),
      };
      
      const result = await db.collection('users').insertOne(newUser);
      req.dbUser = { ...newUser, id: result.insertedId };
    } else {
      req.dbUser = { ...dbUser, id: dbUser._id };
    }
    
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = authMiddleware;
```

---

## ⚙️ Middleware & Utilities

### **Input Validation (middleware/validate.js)**

```javascript
function noteCreate(req, res, next) {
  const { title, content, type } = req.body;
  
  // Check required
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content required' });
  }
  
  // Check length
  if (title.length > 500 || content.length > 50000) {
    return res.status(400).json({ error: 'Content exceeds limits' });
  }
  
  // Validate type
  const validTypes = ['note', 'link', 'insight', 'quote', 'todo'];
  if (type && !validTypes.includes(type)) {
    return res.status(400).json({ error: 'Invalid note type' });
  }
  
  next();
}

module.exports = { noteCreate };
```

### **Rate Limiting**

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.API_RATE_LIMIT_MAX || 100,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.AI_RATE_LIMIT_MAX || 20,
  message: 'AI request limit exceeded',
  skip: (req) => process.env.AUTH_MODE === 'local',
});

module.exports = { limiter, aiLimiter };
```

---

## 📊 Request/Response Patterns

### **Success Response**
```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "notes": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "user_id": "user123",
      "title": "Authentication Best Practices",
      "content": "...",
      "type": "insight",
      "tags": ["security", "backend"],
      "summary": "Key practices for secure auth implementation",
      "sentiment": { "label": "NEUTRAL", "score": 0.5 },
      "created_at": "2026-03-17T10:30:00Z",
      "updated_at": "2026-03-17T10:30:00Z"
    }
  ],
  "total": 42
}
```

### **Error Response**
```json
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "Invalid request parameters",
  "details": {
    "field": "content",
    "message": "Content exceeds 50000 character limit"
  }
}
```

---

## 🛡️ Error Handling

### **Global Error Handler**

```javascript
app.use((error, req, res, next) => {
  console.error('Error:', error);
  
  // Known error types
  if (error.status === 401) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (error.status === 404) {
    return res.status(404).json({ error: 'Not found' });
  }
  
  if (error.status === 429) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  
  // Gemini API errors
  if (error.message.includes('INVALID_ARGUMENT')) {
    return res.status(400).json({ error: 'Invalid input for AI processing' });
  }
  
  // MongoDB errors
  if (error.name === 'MongoError') {
    return res.status(500).json({ error: 'Database error' });
  }
  
  // Default
  const statusCode = error.status || 500;
  const isDev = process.env.NODE_ENV === 'development';
  
  res.status(statusCode).json({
    error: isDev ? error.message : 'Internal server error',
    ...(isDev && { stack: error.stack }),
  });
});
```

---

## 📈 Monitoring & Debugging

### **Health Check Endpoint**

```
GET /health

Response:
{
  "status": "ok",
  "uptime": 3600,
  "mongodb": true,
  "timestamp": "2026-03-17T12:34:56Z"
}
```

### **Logging with Morgan**

```javascript
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));

// Example log:
// POST /api/notes 201 245 - 15.234 ms
```

### **Debugging**

```bash
# Enable verbose logging
DEBUG=* npm run dev

# Check database connection
curl http://localhost:4000/health

# Test API endpoint
curl -H "Authorization: Bearer <token>" http://localhost:4000/api/notes

# Monitor requests
npm run logs
```

---

## 🛠️ Development Guide

### **Installation**

```bash
cd server
npm install
```

### **Configuration**

```bash
cp .env.example .env
# Edit .env with:
# MONGODB_URI=...
# GEMINI_API_KEY=...
# FIREBASE_*=...
# PORT=4000
```

### **Start Development Server**

```bash
npm run dev
# Server: http://localhost:4000
```

### **Testing**

```bash
# Unit tests (if configured)
npm test

# Integration tests
npm run test:integration

# Load testing
npm run test:load
```

---

## 🚀 Deployment

### **Environment Setup**

Set these variables in production:
- `NODE_ENV=production`
- `MONGODB_URI=` (production MongoDB)
- `GEMINI_API_KEY=` (production key)
- `FIREBASE_*=` (production Firebase)
- `FRONTEND_URL=` (production frontend domain)
- `AUTH_MODE=production` (disable local auth)
- `PORT=4000` (or platform-assigned port)

### **Recommended Platforms**
- **Render** — Easy Node.js deployment with auto-scaling
- **Railway** — Simple git push deployment
- **Fly.io** — Global deployment with regions
- **AWS Lambda** — Serverless (requires Serverless Framework)

### **Database Backup**

```bash
# Backup MongoDB Atlas cluster
mongodump --uri "mongodb+srv://user:pass@cluster.mongodb.net/dbname"

# Restore
mongorestore --uri "mongodb+srv://user:pass@cluster.mongodb.net/dbname"
```

---

## 📚 Additional Resources

- **Main README:** See [`../README.md`](../README.md)
- **Frontend Details:** See [`../client/README.md`](../client/README.md)
- **ML Service Details:** See [`../ml_service/README.md`](../ml_service/README.md)

---

**Made with 🔧 for reliable APIs**

