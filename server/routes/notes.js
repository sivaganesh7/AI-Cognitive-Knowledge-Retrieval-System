const router = require('express').Router();
const auth = require('../middleware/auth');
const { validateNote } = require('../middleware/validate');
const db = require('../db/queries');
const aiService = require('../services/ai');
const mlService = require('../services/ml');

const AUTO_PROCESS_NOTES_WITH_AI = String(process.env.AUTO_PROCESS_NOTES_WITH_AI || 'false').toLowerCase() === 'true';

// ─── GET /api/notes — List notes with filtering ────────────────────────────
router.get('/', auth, async (req, res, next) => {
  try {
    const {
      search,
      type,
      tag,
      sort = 'newest',
      page = 1,
      limit = 20
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    const [notes, total] = await Promise.all([
      db.getNotes({ userId: req.dbUser.id, search, type, tag, sort, offset, limit: limitNum }),
      db.getNotesCount({ userId: req.dbUser.id, search, type, tag })
    ]);

    res.json({
      notes,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      hasMore: pageNum * limitNum < total
    });
  } catch (err) { next(err); }
});

// ─── POST /api/notes — Create note ────────────────────────────────────────
router.post('/', auth, validateNote, async (req, res, next) => {
  try {
    const { title, content, type, source_url, tags } = req.body;

    const wordCount = content.trim().split(/\s+/).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    const note = await db.createNote({
      userId: req.dbUser.id,
      title: title.trim(),
      content: content.trim(),
      type,
      source_url: source_url?.trim() || null,
      tags: Array.isArray(tags) ? tags : [],
      wordCount,
      readingTime
    });

    // Optional background AI processing. Disabled by default to avoid unnecessary API usage.
    if (AUTO_PROCESS_NOTES_WITH_AI) {
      processNoteWithAI(note.id, title, content).catch(err =>
        console.error('[AI Background]', err.message)
      );
    }

    res.status(201).json(note);
  } catch (err) { next(err); }
});

// ─── GET /api/notes/stats — User stats ────────────────────────────────────
router.get('/meta/stats', auth, async (req, res, next) => {
  try {
    const stats = await db.getUserStats(req.dbUser.id);
    res.json(stats);
  } catch (err) { next(err); }
});

// ─── GET /api/notes/:id — Get single note ─────────────────────────────────
router.get('/:id', auth, async (req, res, next) => {
  try {
    const note = await db.getNoteById(req.params.id, req.dbUser.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json(note);
  } catch (err) { next(err); }
});

// ─── PATCH /api/notes/:id — Update note ───────────────────────────────────
router.patch('/:id', auth, async (req, res, next) => {
  try {
    const note = await db.getNoteById(req.params.id, req.dbUser.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });

    const updated = await db.updateNote(req.params.id, req.dbUser.id, req.body);

    // Optional background AI re-processing. Disabled by default to avoid unnecessary API usage.
    if (AUTO_PROCESS_NOTES_WITH_AI && req.body.content && req.body.content.length > 50) {
      processNoteWithAI(note.id, req.body.title || note.title, req.body.content)
        .catch(err => console.error('[AI Background]', err.message));
    }

    res.json(updated);
  } catch (err) { next(err); }
});

// ─── DELETE /api/notes/:id — Delete note ──────────────────────────────────
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const note = await db.getNoteById(req.params.id, req.dbUser.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });

    await db.deleteNote(req.params.id, req.dbUser.id);
    res.json({ success: true, message: 'Note deleted' });
  } catch (err) { next(err); }
});

// ─── PATCH /api/notes/:id/toggle — Toggle boolean fields ──────────────────
router.patch('/:id/toggle', auth, async (req, res, next) => {
  try {
    const { field } = req.body;
    const allowed = ['is_pinned', 'is_favorite', 'is_public', 'todo_done'];

    if (!allowed.includes(field)) {
      return res.status(400).json({ error: 'Invalid toggle field' });
    }

    const note = await db.getNoteById(req.params.id, req.dbUser.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });

    const updated = await db.updateNote(req.params.id, req.dbUser.id, {
      [field]: !note[field]
    });
    res.json(updated);
  } catch (err) { next(err); }
});

// ─── POST /api/notes/:id/export — Export as Markdown ─────────────────────
router.get('/:id/export', auth, async (req, res, next) => {
  try {
    const note = await db.getNoteById(req.params.id, req.dbUser.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });

    const markdown = `# ${note.title}

**Type:** ${note.type}
**Created:** ${new Date(note.created_at).toLocaleDateString()}
**Tags:** ${note.tags?.join(', ') || 'none'}
${note.source_url ? `**Source:** ${note.source_url}` : ''}

---

${note.content}

${note.summary ? `---\n\n**AI Summary:** ${note.summary}` : ''}
`;

    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename="${note.title.replace(/[^a-z0-9]/gi, '-')}.md"`);
    res.send(markdown);
  } catch (err) { next(err); }
});

// ─── Background Helpers ────────────────────────────────────────────────────
async function processNoteWithAI(noteId, title, content) {
  const summaryPromise = aiService.summarize(title, content);
  const tagsPromise = mlService.autotag({ title, content, maxTags: 5 })
    .then((r) => Array.isArray(r.tags) ? r.tags : [])
    .catch(() => aiService.generateTags(title, content));

  const [summary, tags] = await Promise.all([summaryPromise, tagsPromise]);
  await db.updateNoteAI(noteId, summary, tags);
  console.log(`[AI] Processed note ${noteId}`);
}

module.exports = router;
