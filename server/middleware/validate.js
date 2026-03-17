/**
 * Input validation middleware
 */

exports.validateNote = (req, res, next) => {
  const { title, content, type } = req.body;

  if (!title?.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }
  if (title.trim().length > 300) {
    return res.status(400).json({ error: 'Title must be under 300 characters' });
  }
  if (!content?.trim()) {
    return res.status(400).json({ error: 'Content is required' });
  }
  if (!type) {
    return res.status(400).json({ error: 'Note type is required' });
  }
  if (!['note', 'link', 'insight', 'quote', 'todo'].includes(type)) {
    return res.status(400).json({ error: 'Type must be one of: note, link, insight, quote, todo' });
  }
  if (req.body.source_url && !isValidUrl(req.body.source_url)) {
    return res.status(400).json({ error: 'Invalid source URL' });
  }

  next();
};

exports.validateQuery = (req, res, next) => {
  const { question } = req.body;
  if (!question?.trim()) {
    return res.status(400).json({ error: 'Question is required' });
  }
  if (question.trim().length > 1000) {
    return res.status(400).json({ error: 'Question is too long (max 1000 chars)' });
  }
  next();
};

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}
