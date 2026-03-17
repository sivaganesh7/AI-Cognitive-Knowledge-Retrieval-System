const router = require('express').Router();
const db = require('../db/queries');
const aiService = require('../services/ai');

// ─── GET /api/public/brain/query — Query a public brain ───────────────────
router.get('/brain/query', async (req, res, next) => {
  try {
    const { username, q } = req.query;
    if (!username || !q) {
      return res.status(400).json({ error: 'username and q (query) required' });
    }

    const user = await db.getUserByUsername(username);
    if (!user || !user.is_public) {
      return res.status(404).json({ error: 'Public brain not found' });
    }

    const notes = await db.getPublicNotesByUser(user.id);
    const answer = await aiService.queryBrain(q, notes);

    res.json({ answer, brain: user.display_name });
  } catch (err) { next(err); }
});

// ─── GET /api/public/brain/:username — Public brain profile ───────────────
router.get('/brain/:username', async (req, res, next) => {
  try {
    const user = await db.getUserByUsername(req.params.username);
    if (!user || !user.is_public) {
      return res.status(404).json({ error: 'Public brain not found' });
    }

    const notes = await db.getPublicNotesByUser(user.id);

    res.json({
      user: {
        id: user.id,
        display_name: user.display_name,
        username: user.username,
        bio: user.bio,
        photo_url: user.photo_url,
        created_at: user.created_at,
      },
      notes,
      total: notes.length
    });
  } catch (err) { next(err); }
});

// ─── GET /api/public/note/:id — Get single public note ────────────────────
router.get('/note/:id', async (req, res, next) => {
  try {
    const note = await db.getPublicNoteById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found or not public' });
    res.json(note);
  } catch (err) { next(err); }
});

module.exports = router;
