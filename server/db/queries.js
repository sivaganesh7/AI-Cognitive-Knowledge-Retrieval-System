const { ObjectId } = require('mongodb');
const { getCollections } = require('./pool');

function mapDoc(doc) {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return { id: _id.toString(), ...rest };
}

function toObjectId(id) {
  if (!ObjectId.isValid(id)) return null;
  return new ObjectId(id);
}

function escapeRegex(input) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function updatedDoc(result) {
  if (!result) return null;
  return result.value || result;
}

// Users
exports.upsertUser = async ({ firebase_uid, email, display_name, photo_url }) => {
  const { users } = getCollections();
  const now = new Date();

  const set = {
    email,
    updated_at: now,
  };

  if (display_name != null) set.display_name = display_name;
  if (photo_url != null) set.photo_url = photo_url;

  const result = await users.findOneAndUpdate(
    { firebase_uid },
    {
      $set: set,
      $setOnInsert: {
        firebase_uid,
        username: null,
        bio: null,
        is_public: false,
        created_at: now,
      },
    },
    { upsert: true, returnDocument: 'after' }
  );

  return mapDoc(updatedDoc(result));
};

exports.getUserByFirebaseUid = async (firebase_uid) => {
  const { users } = getCollections();
  return mapDoc(await users.findOne({ firebase_uid }));
};

exports.getUserByUsername = async (username) => {
  const { users } = getCollections();
  return mapDoc(await users.findOne({ username }));
};

exports.updateUser = async (id, fields) => {
  const { users } = getCollections();
  const userId = toObjectId(id);
  if (!userId) return null;

  const allowed = ['display_name', 'bio', 'username', 'is_public', 'photo_url'];
  const set = {};

  for (const [key, val] of Object.entries(fields || {})) {
    if (allowed.includes(key) && val !== undefined) {
      set[key] = val;
    }
  }

  if (Object.keys(set).length === 0) return null;
  set.updated_at = new Date();

  const result = await users.findOneAndUpdate(
    { _id: userId },
    { $set: set },
    { returnDocument: 'after' }
  );

  return mapDoc(updatedDoc(result));
};

exports.getUserStats = async (userId) => {
  const { notes } = getCollections();

  const [result] = await notes.aggregate([
    { $match: { user_id: userId } },
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              total_notes: { $sum: 1 },
              total_words: { $sum: { $ifNull: ['$word_count', 0] } },
              notes_count: { $sum: { $cond: [{ $eq: ['$type', 'note'] }, 1, 0] } },
              links_count: { $sum: { $cond: [{ $eq: ['$type', 'link'] }, 1, 0] } },
              insights_count: { $sum: { $cond: [{ $eq: ['$type', 'insight'] }, 1, 0] } },
              quotes_count: { $sum: { $cond: [{ $eq: ['$type', 'quote'] }, 1, 0] } },
              todos_count: { $sum: { $cond: [{ $eq: ['$type', 'todo'] }, 1, 0] } },
              favorites_count: { $sum: { $cond: [{ $eq: ['$is_favorite', true] }, 1, 0] } },
              ai_processed_count: { $sum: { $cond: [{ $eq: ['$ai_processed', true] }, 1, 0] } },
            },
          },
        ],
        tags: [
          { $unwind: { path: '$tags', preserveNullAndEmptyArrays: false } },
          { $group: { _id: '$tags' } },
          { $count: 'total_tags' },
        ],
      },
    },
  ]).toArray();

  const totals = result?.totals?.[0] || {};
  const totalTags = result?.tags?.[0]?.total_tags || 0;

  return {
    total_notes: totals.total_notes || 0,
    total_words: totals.total_words || 0,
    total_tags: totalTags,
    notes_count: totals.notes_count || 0,
    links_count: totals.links_count || 0,
    insights_count: totals.insights_count || 0,
    quotes_count: totals.quotes_count || 0,
    todos_count: totals.todos_count || 0,
    favorites_count: totals.favorites_count || 0,
    ai_processed_count: totals.ai_processed_count || 0,
  };
};

// Notes
exports.getNotes = async ({ userId, search, type, tag, sort, offset, limit }) => {
  const { notes, users } = getCollections();

  const query = { user_id: userId };
  if (search?.trim()) {
    const regex = new RegExp(escapeRegex(search.trim()), 'i');
    query.$or = [{ title: regex }, { content: regex }, { summary: regex }];
  }
  if (type && type !== 'all') query.type = type;
  if (tag) query.tags = tag;

  const orderMap = {
    newest: { created_at: -1 },
    oldest: { created_at: 1 },
    updated: { updated_at: -1 },
    alpha: { title: 1 },
    wordcount: { word_count: -1 },
  };

  const noteDocs = await notes
    .find(query)
    .sort({ is_pinned: -1, ...(orderMap[sort] || orderMap.newest) })
    .skip(offset)
    .limit(limit)
    .toArray();

  const author = await users.findOne({ _id: toObjectId(userId) });
  const authorName = author?.display_name || null;
  const authorPhoto = author?.photo_url || null;

  return noteDocs.map((doc) => ({
    ...mapDoc(doc),
    author_name: authorName,
    author_photo: authorPhoto,
  }));
};

exports.getNotesCount = async ({ userId, search, type, tag }) => {
  const { notes } = getCollections();

  const query = { user_id: userId };
  if (search?.trim()) {
    const regex = new RegExp(escapeRegex(search.trim()), 'i');
    query.$or = [{ title: regex }, { content: regex }, { summary: regex }];
  }
  if (type && type !== 'all') query.type = type;
  if (tag) query.tags = tag;

  return notes.countDocuments(query);
};

exports.getNoteById = async (id, userId) => {
  const { notes, users } = getCollections();
  const noteId = toObjectId(id);
  if (!noteId) return null;

  const note = await notes.findOne({ _id: noteId, user_id: userId });
  if (!note) return null;

  const author = await users.findOne({ _id: toObjectId(userId) });

  return {
    ...mapDoc(note),
    author_name: author?.display_name || null,
    author_photo: author?.photo_url || null,
    author_username: author?.username || null,
  };
};

exports.getPublicNoteById = async (id) => {
  const { notes, users } = getCollections();
  const noteId = toObjectId(id);
  if (!noteId) return null;

  const note = await notes.findOne({ _id: noteId, is_public: true });
  if (!note) return null;

  const author = await users.findOne({ _id: toObjectId(note.user_id) });

  return {
    ...mapDoc(note),
    author_name: author?.display_name || null,
    author_photo: author?.photo_url || null,
  };
};

exports.createNote = async ({ userId, title, content, type, source_url, tags, wordCount, readingTime }) => {
  const { notes } = getCollections();
  const now = new Date();

  const doc = {
    user_id: userId,
    title,
    content,
    type,
    source_url: source_url || null,
    summary: null,
    tags: Array.isArray(tags) ? tags : [],
    is_public: false,
    is_pinned: false,
    is_favorite: false,
    todo_done: false,
    reading_time: readingTime,
    word_count: wordCount,
    ai_processed: false,
    created_at: now,
    updated_at: now,
  };

  const result = await notes.insertOne(doc);
  return mapDoc({ ...doc, _id: result.insertedId });
};

exports.updateNote = async (id, userId, fields) => {
  const { notes } = getCollections();
  const noteId = toObjectId(id);
  if (!noteId) return null;

  const allowed = [
    'title',
    'content',
    'type',
    'source_url',
    'tags',
    'summary',
    'is_public',
    'is_pinned',
    'is_favorite',
    'todo_done',
  ];

  const set = {};
  for (const [key, val] of Object.entries(fields || {})) {
    if (allowed.includes(key) && val !== undefined) {
      set[key] = val;
    }
  }

  if (typeof fields?.content === 'string') {
    const wordCount = fields.content.trim().split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);
    set.word_count = wordCount;
    set.reading_time = readingTime;
  }

  if (Object.keys(set).length === 0) return null;
  set.updated_at = new Date();

  const result = await notes.findOneAndUpdate(
    { _id: noteId, user_id: userId },
    { $set: set },
    { returnDocument: 'after' }
  );

  return mapDoc(updatedDoc(result));
};

exports.updateNoteAI = async (id, summary, tags) => {
  const { notes } = getCollections();
  const noteId = toObjectId(id);
  if (!noteId) return;

  await notes.updateOne(
    { _id: noteId },
    {
      $set: {
        summary,
        tags: Array.isArray(tags) ? tags : [],
        ai_processed: true,
        updated_at: new Date(),
      },
    }
  );
};

exports.updateNoteSummary = async (id, userId, summary) => {
  const { notes } = getCollections();
  const noteId = toObjectId(id);
  if (!noteId) return null;

  const result = await notes.findOneAndUpdate(
    { _id: noteId, user_id: userId },
    { $set: { summary, updated_at: new Date() } },
    { returnDocument: 'after' }
  );

  return mapDoc(updatedDoc(result));
};

exports.updateNoteTags = async (id, userId, tags) => {
  const { notes } = getCollections();
  const noteId = toObjectId(id);
  if (!noteId) return null;

  const result = await notes.findOneAndUpdate(
    { _id: noteId, user_id: userId },
    { $set: { tags: Array.isArray(tags) ? tags : [], updated_at: new Date() } },
    { returnDocument: 'after' }
  );

  return mapDoc(updatedDoc(result));
};

exports.deleteNote = async (id, userId) => {
  const { notes } = getCollections();
  const noteId = toObjectId(id);
  if (!noteId) return;
  await notes.deleteOne({ _id: noteId, user_id: userId });
};

exports.getAllNotesForUser = async (userId) => {
  const { notes } = getCollections();
  const rows = await notes
    .find({ user_id: userId })
    .sort({ created_at: -1 })
    .limit(50)
    .project({ title: 1, content: 1, summary: 1, tags: 1, type: 1, created_at: 1 })
    .toArray();

  return rows.map(mapDoc);
};

exports.getRandomNotes = async (userId, count = 3) => {
  const { notes } = getCollections();
  const sample = await notes.aggregate([
    { $match: { user_id: userId } },
    { $sample: { size: count } },
  ]).toArray();

  return sample.map(mapDoc);
};

exports.getPublicNotesByUser = async (userId, limit = 20) => {
  const { notes } = getCollections();
  const rows = await notes
    .find({ user_id: userId, is_public: true })
    .sort({ created_at: -1 })
    .limit(limit)
    .toArray();

  return rows.map(mapDoc);
};

// Tags
exports.getUserTags = async (userId) => {
  const { notes } = getCollections();

  return notes.aggregate([
    { $match: { user_id: userId } },
    { $unwind: { path: '$tags', preserveNullAndEmptyArrays: false } },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $project: { _id: 0, name: '$_id', count: 1 } },
    { $sort: { count: -1, name: 1 } },
  ]).toArray();
};

// Conversations
exports.saveConversationMessage = async (userId, question, answer) => {
  const { conversations } = getCollections();
  const now = new Date();

  const newMessages = [
    { role: 'user', content: question, timestamp: now },
    { role: 'assistant', content: answer, timestamp: now },
  ];

  await conversations.updateOne(
    { user_id: userId },
    {
      $set: { updated_at: now },
      $setOnInsert: { created_at: now },
      $push: { messages: { $each: newMessages, $slice: -50 } },
    },
    { upsert: true }
  );
};

exports.getConversationHistory = async (userId) => {
  const { conversations } = getCollections();
  const convo = await conversations.findOne(
    { user_id: userId },
    { projection: { messages: 1 } }
  );
  return convo?.messages || [];
};

exports.clearConversation = async (userId) => {
  const { conversations } = getCollections();
  await conversations.deleteOne({ user_id: userId });
};
