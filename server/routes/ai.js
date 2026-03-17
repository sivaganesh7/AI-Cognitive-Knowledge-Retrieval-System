const router = require('express').Router();
const auth = require('../middleware/auth');
const { validateQuery } = require('../middleware/validate');
const aiService = require('../services/ai');
const mlService = require('../services/ml');
const db = require('../db/queries');

function toMlNote(note) {
  return {
    id: note.id,
    title: note.title || '',
    content: note.content || '',
    summary: note.summary || '',
    tags: Array.isArray(note.tags) ? note.tags : [],
    type: note.type || 'note',
  };
}

function lexicalFallbackSearch(query, notes, topK = 8) {
  const terms = String(query || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2);

  const scored = notes.map((note) => {
    const title = String(note.title || '').toLowerCase();
    const summary = String(note.summary || '').toLowerCase();
    const content = String(note.content || '').toLowerCase();
    const tags = Array.isArray(note.tags) ? note.tags.join(' ').toLowerCase() : '';

    let score = 0;
    for (const term of terms) {
      if (title.includes(term)) score += 4;
      if (tags.includes(term)) score += 3;
      if (summary.includes(term)) score += 2;
      if (content.includes(term)) score += 1;
    }

    return {
      id: note.id,
      score,
      title: note.title,
      summary: note.summary,
      tags: note.tags,
      type: note.type,
    };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

// ─── POST /api/ai/summarize ────────────────────────────────────────────────
router.post('/summarize', auth, async (req, res, next) => {
  try {
    const { noteId, title, content } = req.body;
    if (!content) return res.status(400).json({ error: 'Content required' });

    const summary = await aiService.summarize(title || 'Note', content);

    if (noteId) {
      await db.updateNoteSummary(noteId, req.dbUser.id, summary);
    }

    res.json({ summary });
  } catch (err) { next(err); }
});

// ─── POST /api/ai/autotag ──────────────────────────────────────────────────
router.post('/autotag', auth, async (req, res, next) => {
  try {
    const { noteId, title, content } = req.body;
    if (!content) return res.status(400).json({ error: 'Content required' });

    let tags = [];
    try {
      const ml = await mlService.autotag({
        title: title || 'Note',
        content,
        maxTags: 5,
      });
      tags = Array.isArray(ml.tags) ? ml.tags : [];
    } catch {
      tags = await aiService.generateTags(title || 'Note', content);
    }

    if (noteId) {
      await db.updateNoteTags(noteId, req.dbUser.id, tags);
    }

    res.json({ tags });
  } catch (err) { next(err); }
});

// ─── POST /api/ai/query — Conversational Q&A ──────────────────────────────
router.post('/query', auth, validateQuery, async (req, res, next) => {
  try {
    const { question, conversationHistory = [] } = req.body;

    const notes = await db.getAllNotesForUser(req.dbUser.id);

    let contextNotes = notes;
    try {
      const semantic = await mlService.semanticSearch({
        query: question,
        notes: notes.map(toMlNote),
        topK: 12,
      });
      const ids = new Set((semantic.matches || []).map((m) => m.id));
      const selected = notes.filter((n) => ids.has(n.id));
      if (selected.length > 0) {
        contextNotes = selected;
      }
    } catch {
      // Keep full note set when ML service is unavailable.
    }

    const [answer] = await Promise.all([
      aiService.queryBrain(question, contextNotes, conversationHistory),
    ]);

    // Save conversation history in background
    db.saveConversationMessage(req.dbUser.id, question, answer)
      .catch(err => console.error('[Conversation Save]', err.message));

    res.json({ answer, notesSearched: contextNotes.length });
  } catch (err) { next(err); }
});

// ─── POST /api/ai/improve — Improve writing ────────────────────────────────
router.post('/improve', auth, async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Content required' });

    const improved = await aiService.improveWriting(content);
    res.json({ improved });
  } catch (err) { next(err); }
});

// ─── POST /api/ai/connections — Find related notes ────────────────────────
router.post('/connections', auth, async (req, res, next) => {
  try {
    const { noteId } = req.body;
    if (!noteId) return res.status(400).json({ error: 'noteId required' });

    const [note, allNotes] = await Promise.all([
      db.getNoteById(noteId, req.dbUser.id),
      db.getAllNotesForUser(req.dbUser.id)
    ]);

    if (!note) return res.status(404).json({ error: 'Note not found' });

    let related = [];
    try {
      const ml = await mlService.similarNotes({
        noteId,
        notes: allNotes.map(toMlNote),
        topK: 3,
      });
      const relatedIds = new Set((ml.related || []).map((r) => r.id));
      related = allNotes.filter((n) => relatedIds.has(n.id));
    } catch {
      related = await aiService.findConnections(note, allNotes);
    }

    res.json({ related });
  } catch (err) { next(err); }
});

// ─── POST /api/ai/semantic-search — Embedding search ─────────────────────
router.post('/semantic-search', auth, async (req, res, next) => {
  try {
    const { query, topK = 8 } = req.body;
    if (!query?.trim()) return res.status(400).json({ error: 'Query required' });

    const notes = await db.getAllNotesForUser(req.dbUser.id);
    const safeTopK = Math.min(20, Math.max(1, Number(topK) || 8));

    try {
      const ml = await mlService.semanticSearch({
        query: query.trim(),
        notes: notes.map(toMlNote),
        topK: safeTopK,
      });

      res.json({ matches: ml.matches || [] });
    } catch {
      const matches = lexicalFallbackSearch(query, notes, safeTopK);
      res.json({ matches, fallback: 'lexical' });
    }
  } catch (err) { next(err); }
});

// ─── GET /api/ai/digest — Daily knowledge digest ─────────────────────────
router.get('/digest', auth, async (req, res, next) => {
  try {
    const notes = await db.getRandomNotes(req.dbUser.id, 3);
    const digest = await aiService.generateDigest(notes);
    res.json({ digest, notes });
  } catch (err) { next(err); }
});

// ─── POST /api/ai/flashcards — Generate flashcards ───────────────────────
router.post('/flashcards', auth, async (req, res, next) => {
  try {
    const { noteId } = req.body;
    if (!noteId) return res.status(400).json({ error: 'noteId required' });

    const note = await db.getNoteById(noteId, req.dbUser.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });

    const flashcards = await aiService.generateFlashcards(note);
    res.json({ flashcards });
  } catch (err) { next(err); }
});

// ─── POST /api/ai/insights — Extract key insights ────────────────────────
router.post('/insights', auth, async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Content required' });

    const insights = await aiService.extractInsights(content);
    res.json({ insights });
  } catch (err) { next(err); }
});

// ─── POST /api/ai/sentiment — Sentiment analysis ─────────────────────────
router.post('/sentiment', auth, async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Content required' });

    let result;
    try {
      result = await mlService.sentiment(content);
    } catch {
      result = await aiService.analyzeSentiment(content);
    }

    res.json(result);
  } catch (err) { next(err); }
});

// ─── GET /api/ai/ml-health — Python ML service health ────────────────────
router.get('/ml-health', auth, async (req, res, next) => {
  try {
    const info = await mlService.health();
    res.json(info);
  } catch (err) {
    res.status(503).json({ status: 'down', error: err.message });
  }
});

// ─── POST /api/ai/cluster — Topic clustering ─────────────────────────────
router.post('/cluster', auth, async (req, res, next) => {
  try {
    const notes = await db.getAllNotesForUser(req.dbUser.id);
    const clusters = await aiService.clusterTopics(notes);
    res.json({ clusters, notes });
  } catch (err) { next(err); }
});

// ─── POST /api/ai/mindmap — Mind map generation ──────────────────────────
router.post('/mindmap', auth, async (req, res, next) => {
  try {
    const { noteId } = req.body;
    if (!noteId) return res.status(400).json({ error: 'noteId required' });

    const note = await db.getNoteById(noteId, req.dbUser.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });

    const mindmap = await aiService.generateMindMap(note);
    res.json({ mindmap });
  } catch (err) { next(err); }
});

// ─── GET /api/ai/history — Conversation history ──────────────────────────
router.get('/history', auth, async (req, res, next) => {
  try {
    const messages = await db.getConversationHistory(req.dbUser.id);
    res.json({ messages });
  } catch (err) { next(err); }
});

// ─── DELETE /api/ai/history — Clear conversation ─────────────────────────
router.delete('/history', auth, async (req, res, next) => {
  try {
    await db.clearConversation(req.dbUser.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
