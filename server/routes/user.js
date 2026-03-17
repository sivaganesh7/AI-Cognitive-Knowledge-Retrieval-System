const router = require('express').Router();
const auth = require('../middleware/auth');
const db = require('../db/queries');

// ─── GET /api/user/profile ─────────────────────────────────────────────────
router.get('/profile', auth, async (req, res, next) => {
  try {
    const [user, stats] = await Promise.all([
      db.getUserByFirebaseUid(req.user.firebase_uid),
      db.getUserStats(req.dbUser.id)
    ]);
    res.json({ user, stats });
  } catch (err) { next(err); }
});

// ─── PATCH /api/user/profile — Update bio, username, etc. ─────────────────
router.patch('/profile', auth, async (req, res, next) => {
  try {
    const { display_name, bio, username, is_public } = req.body;

    // Validate username if provided
    if (username) {
      if (!/^[a-z0-9_-]{3,30}$/.test(username)) {
        return res.status(400).json({
          error: 'Username must be 3-30 chars, lowercase letters, numbers, _ or -'
        });
      }
      // Check uniqueness
      const existing = await db.getUserByUsername(username);
      if (existing && existing.id !== req.dbUser.id) {
        return res.status(409).json({ error: 'Username already taken' });
      }
    }

    const updated = await db.updateUser(req.dbUser.id, {
      display_name, bio, username, is_public
    });

    res.json(updated);
  } catch (err) { next(err); }
});

// ─── GET /api/user/stats ────────────────────────────────────────────────────
router.get('/stats', auth, async (req, res, next) => {
  try {
    const stats = await db.getUserStats(req.dbUser.id);
    res.json(stats);
  } catch (err) { next(err); }
});

// ─── GET /api/user/tags — All user tags with counts ───────────────────────
router.get('/tags', auth, async (req, res, next) => {
  try {
    const tags = await db.getUserTags(req.dbUser.id);
    res.json({ tags });
  } catch (err) { next(err); }
});

module.exports = router;
