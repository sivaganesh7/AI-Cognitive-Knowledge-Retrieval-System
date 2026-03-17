# 🎨 AI Cognitive Knowledge Retrieval System Frontend

> Next.js 14 + React 18 client application for the AI Cognitive Knowledge Retrieval System knowledge management system

**Status:** Production-Ready  
**Framework:** Next.js 14.2.5 (App Router)  
**Styling:** Tailwind CSS + Framer Motion  
**Auth:** Firebase Web SDK  

---

## 📋 Table of Contents

1. [📁 Project Structure](#-project-structure)
2. [🎯 Core Components](#-core-components)
3. [🔄 State Management](#-state-management)
4. [🎨 Design System](#-design-system)
5. [🔐 Authentication Flow](#-authentication-flow)
6. [⚡ API Integration](#-api-integration)
7. [📱 Responsive Design](#-responsive-design)
8. [🚀 Performance Optimizations](#-performance-optimizations)
9. [🛠️ Development Guide](#️-development-guide)
10. [🔧 Build & Deployment](#-build--deployment)

---

## 📁 Project Structure

```
client/
│
├── README.md (this file)
├── .env.local.example          # Firebase credentials template
├── package.json                # Dependencies
├── next.config.js              # Next.js config
├── jsconfig.json               # Path aliases
├── tailwind.config.js          # Tailwind config
├── postcss.config.js           # PostCSS plugins
│
├── app/                        # Next.js App Router
│   ├── layout.js              # Root layout with providers
│   ├── page.js                # Landing page (/)
│   ├── login/
│   │   └── page.js            # Login & signup (/login)
│   ├── dashboard/
│   │   └── page.js            # Main dashboard (/dashboard)
│   ├── notes/[id]/
│   │   └── page.js            # Note detail view (/notes/{id})
│   ├── brain/[username]/
│   │   └── page.js            # Public user brain (/brain/{username})
│   ├── settings/
│   │   └── page.js            # User settings (/settings)
│   └── docs/
│       └── page.js            # Documentation (/docs)
│
├── components/                # Reusable React components
│   ├── AIChat.jsx             # AI conversation widget
│   ├── CommandPalette.jsx     # Cmd+K command menu
│   ├── DailyDigest.jsx        # Daily recap card
│   ├── FilterBar.jsx          # Type/tag filters
│   ├── NoteCard.jsx           # Note preview card
│   ├── NoteForm.jsx           # Create/edit form
│   ├── SearchBar.jsx          # Search input with debounce
│   ├── SkeletonCard.jsx       # Loading placeholder
│   ├── StatsBar.jsx           # Dashboard stats
│   │── ThemeToggle.jsx        # Dark/light theme switch
│   └── Layout.jsx             # Common page wrapper
│
├── context/                   # React Context for state
│   ├── AuthContext.js         # Auth user state
│   └── ThemeContext.js        # Theme (dark/light)
│
├── hooks/                     # Custom React hooks
│   ├── useDebounce.js         # Debounced state hook
│   ├── useAuth.js             # Auth state access
│   └── useTheme.js            # Theme state access
│
├── lib/                       # Utilities & libraries
│   ├── api.js                 # API client with auth
│   └── firebase.js            # Firebase initialization
│
├── styles/                    # Global CSS
│   └── globals.css            # Theme vars, animations
│
└── public/                    # Static assets
    └── Videos/                # Embedded video files
```

---

## 🎯 Core Components

### **Layout (app/layout.js)**
Root container with global providers:

```javascript
// Wraps entire app with:
// • ThemeProvider (dark/light mode)
// • AuthProvider (user session)
// • NextRouter (client-side routing)

<html>
  <body>
    <ThemeProvider>
      <AuthProvider>
        <RootLayout>
          {children}
        </RootLayout>
      </AuthProvider>
    </ThemeProvider>
  </body>
</html>
```

**Provides:** Theme toggle, auth state, global styles

---

### **Dashboard (app/dashboard/page.js)**
Main interface with note management.

**Features:**
- Note list with type icons, tags, and date
- Search bar with debounced backend query
- Filter bar (type, tag, date range)
- Sort options (newest, oldest, relevance, word count)
- Floating action button (+ new note)
- Command palette (Cmd+K)
- AI chat sidebar
- Daily digest card
- Stats bar (total notes, avg reading time, frequent tags)

**State Management:**
```javascript
const [notes, setNotes] = useState([]);
const [filteredNotes, setFilteredNotes] = useState([]);
const [filter, setFilter] = useState({type: null, tags: [], dateFrom: null});
const [sort, setSort] = useState('newest');
const [searchQuery, setSearchQuery] = useState('');
```

**User Interactions:**
1. Debounced search → Backend `/api/notes?q={query}`
2. Filter change → Re-filter local notes
3. Click note → Navigate to `/notes/{id}`
4. Delete note → `DELETE /api/notes/{id}`
5. Toggle pin/favorite → `PATCH /api/notes/{id}/toggle`

---

### **Note Form (components/NoteForm.jsx)**
Create/edit note with AI assistance.

**Features:**
- Rich text input (title + content)
- Note type selector (note/link/insight/quote/todo)
- Optional source URL
- AI quick actions:
  - 🤖 Summarize
  - 🏷️ Auto-tag
  - ✨ Improve writing
  - 🎯 Extract keywords
- Submit and cancel buttons

**Data Flow:**
```
User fills form & clicks "Save"
    ↓
Frontend validation (not empty, reasonable length)
    ↓
POST /api/notes {title, content, type, source_url}
    ↓
Backend creates document
    ↓
Backend optionally queues AI processing
    ↓
Response includes note with tags, summary, sentiment
    ↓
Frontend displays success toast
    ↓
Redirect to /notes/{noteId} or list
```

---

### **Search Bar (components/SearchBar.jsx)**
Semantic search input with debounce.

**Features:**
- Instant feedback (local filtering)
- Debounced backend query (300ms delay)
- Keyboard shortcut: Cmd/Ctrl+F
- Show recent searches
- Clear button
- Search suggestions

**Algorithm:**
```
User types: "authentication bugs" ─┐
                                    v (wait 300ms)
                                 If no more input:
                                    v
                      POST /api/notes?q=authentication%20bugs
                                    v
                      ML Service: semantic search
                                    v
                      Backend: TF-IDF fallback
                                    v
                      Returns top-10 results
                                    v
                   Frontend displays results
```

---

### **Filter Bar (components/FilterBar.jsx)**
Type and tag filtering.

**Filters:**
- Note type: note, link, insight, quote, todo
- Tags: multi-select from user's existing tags
- Date range: pick from/to dates
- Status: pinned, favorite, todo (done/pending)

**Logic:**
```javascript
const filtered = notes.filter(note => {
  const typeMatch = !filter.type || note.type === filter.type;
  const tagMatch = filter.tags.length === 0 || 
                   filter.tags.some(t => note.tags?.includes(t));
  const dateMatch = (!filter.dateFrom || note.created_at >= filter.dateFrom) &&
                    (!filter.dateTo || note.created_at <= filter.dateTo);
  const statusMatch = !filter.status || 
                      (filter.status === 'pinned' && note.is_pinned) ||
                      (filter.status === 'favorite' && note.is_favorite) ||
                      (filter.status === 'todo-done' && note.todo_done);
  
  return typeMatch && tagMatch && dateMatch && statusMatch;
});
```

---

### **AI Chat (components/AIChat.jsx)**
Conversational interface for Q&A.

**Features:**
- Message list with avatar, name, timestamp
- Input field with send button
- Streaming support (real-time text arrival)
- Source citations (links to related notes)
- Copy response button
- Clear history button

**Message Flow:**
```
User: "How do I prevent SQL injection?"
    ↓
POST /api/ai/query {question: "...", notes: [recent notes]}
    ↓
Backend prepares:
  • System prompt: "You are a knowledge assistant..."
  • User input + all note content
    ↓
Gemini processes and streams response
    ↓
Frontend receives chunks and updates UI in real-time
    ↓
Save to MongoDB conversations collection
    ↓
Display in chat history
```

---

### **Note Card (components/NoteCard.jsx)**
Preview card for note list.

**Displays:**
- Type icon (📝 note, 🔗 link, 💡 insight, etc.)
- Title (with link)
- Snippet preview (first 100 chars)
- Tags with colors
- Date (created_at)
- Reading time
- Sentiment emoji (😊 positive, 😐 neutral, 😕 negative)
- Pinned/favorite indicators

**Animations:**
- Hover: scale slightly + shadow increase
- Click: navigate to detail view
- Swipe (mobile): quick actions (delete, favorite)

---

### **Command Palette (components/CommandPalette.jsx)**
Keyboard shortcut menu (Cmd+K).

**Commands:**
- `n` — Create new note
- `s` — Focus search
- `t` — Toggle theme
- `?` — Show help
- `/public` — View public brain
- `/digest` — Show daily digest
- `/settings` — Go to settings

**Example:**
```
User presses Ctrl+K
    ↓
Palette appears
    ↓
User types "n" → Jumps to new note form
    ↓
User types "auth" → Searches notes matching "auth"
```

---

## 🔄 State Management

### **Auth Context (context/AuthContext.js)**

```javascript
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Firebase onAuthStateChanged listener
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch db user from backend
        const dbUser = await fetch(`/api/user/profile`, {
          headers: { Authorization: `Bearer ${firebaseUser.accessToken}` }
        }).then(r => r.json());
        
        setUser(firebaseUser);
        setDbUser(dbUser);
      } else {
        setUser(null);
        setDbUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email, password) => { /* ... */ };
  const signUp = async (email, password, displayName) => { /* ... */ };
  const signOut = async () => {
    await auth.signOut();
    setUser(null);
    setDbUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, dbUser, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
```

**Usage:**
```javascript
const { user, dbUser, signOut } = useAuth();

if (!user) return <Navigate to="/login" />;
```

---

### **Theme Context (context/ThemeContext.js)**

```javascript
const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(
    typeof window !== 'undefined' ? 
      localStorage.getItem('theme') === 'dark' : 
      false
  );

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme: () => setIsDark(!isDark) }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

---

## 🎨 Design System

### **Color Palette (globals.css)**

```css
/* Light Mode */
:root {
  --surface: #ffffff;
  --background: #f8f9fa;
  --border: #e0e0e0;
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --accent: #3b82f6;
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
}

/* Dark Mode */
:root.dark {
  --surface: #1e1e1e;
  --background: #0f0f0f;
  --border: #333333;
  --text-primary: #ffffff;
  --text-secondary: #999999;
  --accent: #60a5fa;
  --success: #34d399;
  --warning: #fbbf24;
  --error: #f87171;
}
```

### **Note Type Colors**

```css
.note-type-note { color: #3b82f6; }    /* Blue */
.note-type-link { color: #8b5cf6; }    /* Purple */
.note-type-insight { color: #f59e0b; } /* Amber */
.note-type-quote { color: #10b981; }   /* Green */
.note-type-todo { color: #ef4444; }    /* Red */
```

### **Typography**

```css
/* Headings */
h1 { font-size: 2rem; font-weight: 700; line-height: 1.2; }
h2 { font-size: 1.5rem; font-weight: 600; line-height: 1.3; }
h3 { font-size: 1.25rem; font-weight: 600; line-height: 1.4; }

/* Body */
body { font-size: 1rem; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; }

/* Code */
code { font-family: 'Monaco', 'Courier New', monospace; font-size: 0.875rem; }
```

### **Animations (Framer Motion)**

```javascript
// Fade in
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
/>

// Slide from left
<motion.div
  initial={{ x: -20, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  transition={{ duration: 0.4 }}
/>

// Scale on hover
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
/>
```

---

## 🔐 Authentication Flow

### **Login Page (app/login/page.js)**

```
User lands on /login
    ↓
Two options:
  1. Sign in with Google (OAuth popup)
  2. Email/password signup
    ↓
Option 1: Google OAuth
  • Click "Sign in with Google"
  • Firebase SDK opens OAuth popup or redirect
  • User approves access to Google account
  • Firebase SDK returns idToken
  ↓
Option 2: Email & Password
  • Enter email and password
  • Click "Sign up"
  • Firebase SDK calls createUserWithEmailAndPassword()
  • Email verification sent (or skipped in dev)
  • Firebase returns idToken
    ↓
Frontend stores idToken in Firebase SDK (automatic)
    ↓
AuthContext detects user via onAuthStateChanged
    ↓
Fetch user profile from backend: GET /api/user/profile
    ↓
AuthContext updates with dbUser
    ↓
Redirect to /dashboard
```

### **Protected Routes**

Every page that requires auth:

```javascript
// In page.js:
import { useAuth } from '@/context/AuthContext';

export default function DashboardPage() {
  const { user, loading } = useAuth();

  if (loading) return <SkeletonCard />;
  if (!user) return <Navigate to="/login" />;

  return <Dashboard user={user} />;
}
```

---

## ⚡ API Integration

### **API Client (lib/api.js)**

```javascript
// Timeout configuration
const REQUEST_TIMEOUT_MS = 15000;

// Helper to add Bearer token
export async function apiCall(endpoint, options = {}) {
  const user = await getAuth().currentUser.getIdToken();
  
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${user}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      cache: 'no-store',
      signal: controller.signal,
    });
    
    if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout (15s)');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

// Convenience methods
export async function getNotes(query, filter) {
  return apiCall(`/api/notes?q=${query}&type=${filter.type}`);
}

export async function createNote(noteData) {
  return apiCall('/api/notes', {
    method: 'POST',
    body: JSON.stringify(noteData),
  });
}

export async function queryAI(question) {
  return apiCall('/api/ai/query', {
    method: 'POST',
    body: JSON.stringify({ question }),
  });
}
```

### **Common API Calls**

```javascript
// Notes
const notes = await getNotes('search term', {type: 'note'});
const newNote = await createNote({title, content, type});
const updated = await updateNote(noteId, {title, content});
await deleteNote(noteId);

// AI
const summary = await queryAI('/api/ai/summarize', {content});
const tags = await queryAI('/api/ai/autotag', {content});
const answer = await queryAI('/api/ai/query', {question});

// User
const profile = await getProfile();
const stats = await getStats();
```

---

## 📱 Responsive Design

### **Mobile-First Breakpoints**

```css
/* Mobile (< 640px) */
.dashboard { grid-template-columns: 1fr; }

/* Tablet (≥ 768px) */
@media (min-width: 768px) {
  .dashboard { grid-template-columns: 1fr 1fr; }
  .sidebar { display: block; }
}

/* Desktop (≥ 1024px) */
@media (min-width: 1024px) {
  .dashboard { grid-template-columns: 200px 1fr 300px; }
  .sidebar { min-width: 300px; }
}
```

### **Touch Optimizations**

```javascript
// Larger tap targets on mobile
const buttonSize = isMobile ? 'h-12 w-12' : 'h-10 w-10';

// Disable hover effects on touch devices
const isTouch = window.matchMedia('(hover: none)').matches;

// Swipe gestures for mobile note actions
<SwipeableNoteCard
  onSwipeLeft={() => deleteNote(id)}
  onSwipeRight={() => toggleFavorite(id)}
/>
```

---

## 🚀 Performance Optimizations

### **Code Splitting**
- Each page is automatically code-split by Next.js
- Components lazy-loaded with `dynamic()`

```javascript
const AIChat = dynamic(() => import('@/components/AIChat'), {
  loading: () => <SkeletonCard />,
  ssr: false,
});
```

### **Image Optimization**
- Use Next.js `<Image>` component
- Automatic responsive sizing and lazy loading

```javascript
import Image from 'next/image';

<Image
  src="/thumbnail.jpg"
  alt="Note"
  width={300}
  height={200}
  quality={75}
  placeholder="blur"
/>
```

### **Debounced Search**
- Search query debounced 300ms before backend call
- Prevents excessive API requests

```javascript
const debouncedSearch = useDebounce(searchQuery, 300);

useEffect(() => {
  if (debouncedSearch) {
    fetchNotes(debouncedSearch);
  }
}, [debouncedSearch]);
```

### **Request Timeout**
- All API requests timeout after 15 seconds
- Shows error toast to user

```javascript
const REQUEST_TIMEOUT_MS = 15000;

const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

try {
  const response = await fetch(url, { signal: controller.signal });
} finally {
  clearTimeout(timeout);
}
```

### **Bundle Analysis**
```bash
npm run build
# Inspect: .next/static/ and build output sizes
```

---

## 🛠️ Development Guide

### **Prerequisites**
- Node.js 18+
- npm or yarn
- Firebase project

### **Installation**

```bash
cd client
npm install
```

### **Configuration**

```bash
# Copy template
cp .env.local.example .env.local

# Fill in Firebase credentials:
# NEXT_PUBLIC_FIREBASE_API_KEY=...
# NEXT_PUBLIC_API_URL=http://localhost:4000
```

### **Development Server**

```bash
npm run dev
# Frontend: http://localhost:3000
```

### **Linting & Formatting**

```bash
npm run lint
npm run format
```

### **Testing** (if configured)

```bash
npm test
```

---

## 🔧 Build & Deployment

### **Local Build**

```bash
npm run build
npm start
# Runs on http://localhost:3000
```

### **Production Build**

Typical deployment to Vercel:

```bash
# Push to GitHub
git push origin main

# Vercel auto-deploys from GitHub
# Configure environment variables in Vercel dashboard:
#   NEXT_PUBLIC_FIREBASE_API_KEY
#   NEXT_PUBLIC_API_URL (production backend URL)
```

### **Environment Variables for Production**

Set in Vercel dashboard:
```
NEXT_PUBLIC_FIREBASE_* = [production Firebase config]
NEXT_PUBLIC_API_URL = https://api.yourdomain.com
```

### **Performance Metrics**

Monitor with Vercel Analytics:
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)

---

## 📚 Additional Resources

- **Main README:** See [`../README.md`](../README.md)
- **Backend Details:** See [`../server/README.md`](../server/README.md)
- **ML Service Details:** See [`../ml_service/README.md`](../ml_service/README.md)

---

**Made with ⚛️ + 🎨 for delightful UX**

