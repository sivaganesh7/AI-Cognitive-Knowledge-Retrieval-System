const router = require('express').Router();
const auth = require('../middleware/auth');
const db = require('../db/queries');

// ─── GET /api/tags — List tags for user ───────────────────────────────────
router.get('/', auth, async (req, res, next) => {
  try {
    const tags = await db.getUserTags(req.dbUser.id);
    res.json({ tags });
  } catch (err) { next(err); }
});

module.exports = router;
