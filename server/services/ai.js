const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

let model = null;
if (GEMINI_API_KEY.trim()) {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
}

const AI_MAX_CONCURRENT = Number(process.env.AI_MAX_CONCURRENT || 8);
const AI_MAX_QUEUE = Number(process.env.AI_MAX_QUEUE || 100);
let activeAiJobs = 0;
const aiQueue = [];

function runNextAiJob() {
  if (activeAiJobs >= AI_MAX_CONCURRENT || aiQueue.length === 0) return;
  const next = aiQueue.shift();
  if (!next) return;
  activeAiJobs += 1;
  next();
}

function withAiConcurrency(task) {
  return new Promise((resolve, reject) => {
    const execute = async () => {
      try {
        resolve(await task());
      } catch (err) {
        reject(err);
      } finally {
        activeAiJobs -= 1;
        runNextAiJob();
      }
    };

    if (activeAiJobs < AI_MAX_CONCURRENT) {
      activeAiJobs += 1;
      execute();
      return;
    }

    if (aiQueue.length >= AI_MAX_QUEUE) {
      reject(new Error('AI server is busy. Please retry in a moment.'));
      return;
    }

    aiQueue.push(execute);
  });
}

function normalizeAiError(err) {
  const msg = String(err?.message || 'Unknown AI error');

  if (msg.includes('429') || msg.toLowerCase().includes('quota')) {
    return new Error('Gemini quota exceeded or billing not enabled. Update GEMINI_API_KEY project quota/billing and retry.');
  }

  if (msg.includes('404') && msg.toLowerCase().includes('model')) {
    return new Error(`Gemini model "${GEMINI_MODEL}" is unavailable for this API key. Set GEMINI_MODEL to a supported model.`);
  }

  if (msg.includes('401') || msg.includes('403')) {
    return new Error('Gemini API key is invalid or unauthorized for this project. Check GEMINI_API_KEY.');
  }

  return err;
}

function summarizeFallback(title, content) {
  const trimmed = String(content || '').trim();
  if (!trimmed) return `Summary unavailable for "${title}" because content is empty.`;
  const sentence = trimmed.split(/(?<=[.!?])\s+/)[0] || trimmed.slice(0, 180);
  return `${sentence.slice(0, 240)}${sentence.length > 240 ? '...' : ''} (AI fallback mode)`;
}

function improveFallback(content) {
  return String(content || '').trim();
}

function digestFallback(notes) {
  if (!Array.isArray(notes) || notes.length === 0) return 'Add more notes to generate a daily digest.';
  const sample = notes.slice(0, 3).map((n) => n.title).filter(Boolean);
  return `Today you reviewed ${notes.length} notes. Focus areas: ${sample.join(', ')}. (AI fallback mode)`;
}

function queryFallback(question, notes, history = [], providerReason = '') {
  const lastUserTurns = (history || [])
    .filter((m) => m && m.role === 'user' && typeof m.content === 'string')
    .slice(-2)
    .map((m) => m.content.trim())
    .filter(Boolean);

  const cleanQuestion = [
    ...lastUserTurns,
    String(question || '').trim(),
  ].filter(Boolean).join(' ');
  const normalized = cleanQuestion.toLowerCase();
  const terms = normalized
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2);

  const STOP_WORDS = new Set([
    'what', 'when', 'where', 'which', 'about', 'with', 'your', 'from', 'have', 'this', 'that', 'into', 'them', 'they', 'their', 'there',
    'could', 'would', 'should', 'please', 'show', 'tell', 'give', 'most', 'recent', 'notes', 'note', 'summary', 'summarize', 'find', 'based'
  ]);
  const keywords = terms.filter((t) => !STOP_WORDS.has(t));

  const ranked = (notes || []).map((n) => {
    const title = String(n.title || '');
    const body = String(n.summary || n.content || '');
    const tags = Array.isArray(n.tags) ? n.tags.join(' ') : '';
    const type = String(n.type || '');
    const haystack = `${title} ${body} ${tags} ${type}`.toLowerCase();

    let score = 0;
    for (const kw of keywords) {
      if (!kw) continue;
      if (title.toLowerCase().includes(kw)) score += 4;
      if (tags.toLowerCase().includes(kw)) score += 3;
      if (type.toLowerCase().includes(kw)) score += 2;
      if (haystack.includes(kw)) score += 1;
    }

    if (keywords.length === 0 && cleanQuestion) {
      const bodyPreview = body.toLowerCase().slice(0, 400);
      if (bodyPreview.includes(normalized.slice(0, 18))) score += 2;
    }

    return { note: n, score };
  })
    .filter((item) => item.score > 0 || keywords.length === 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (ranked.length === 0) {
    return 'I could not find relevant details in your current notes for that question. Try adding a note with related keywords, then ask again.';
  }

  const top = ranked[0].note;
  const topSnippet = String(top.summary || top.content || '').replace(/\s+/g, ' ').trim().slice(0, 260);
  const supporting = ranked.slice(1).map((item) => {
    const n = item.note;
    const snippet = String(n.summary || n.content || '').replace(/\s+/g, ' ').trim().slice(0, 120);
    return `- ${n.title || 'Untitled'}: ${snippet}${snippet.length >= 120 ? '...' : ''}`;
  });

  const answerLines = [
    `Based on your notes, the best match is "${top.title || 'Untitled'}".`
  ];

  if (topSnippet) {
    answerLines.push(`Key detail: ${topSnippet}${topSnippet.length >= 260 ? '...' : ''}`);
  }

  if (supporting.length > 0) {
    answerLines.push('Related notes:');
    answerLines.push(...supporting);
  }

  let reasonLine = 'This response was generated from local note matching.';
  const reason = String(providerReason || '').toLowerCase();
  if (reason.includes('quota') || reason.includes('429')) {
    reasonLine += ' Gemini quota is currently exhausted or not enabled for this project.';
  } else if (reason.includes('model') && reason.includes('unavailable')) {
    reasonLine += ` The configured Gemini model (${GEMINI_MODEL}) is not available for this key.`;
  } else if (reason.includes('api key') || reason.includes('unauthorized') || reason.includes('401') || reason.includes('403')) {
    reasonLine += ' The Gemini API key is invalid or lacks required access.';
  }

  answerLines.push(reasonLine);
  return answerLines.join('\n');
}

/**
 * Retry logic for AI calls
 */
async function withRetry(fn, retries = 2) {
  if (!model) {
    throw new Error('Gemini API key is missing. Set GEMINI_API_KEY in server/.env.');
  }

  return withAiConcurrency(async () => {
    for (let i = 0; i <= retries; i++) {
      try {
        return await fn();
      } catch (err) {
        const normalized = normalizeAiError(err);
        if (i === retries) throw normalized;
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      }
    }
  });
}

// ─── 1. SUMMARIZATION ────────────────────────────────────────────────────────
exports.summarize = async (title, content) => {
  return withRetry(async () => {
    const prompt = `Summarize the following knowledge item in exactly 2-3 sentences.
Be concise, insightful, and capture the key takeaway. No preamble or meta-commentary.

Title: ${title}
Content: ${content.slice(0, 3000)}`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  }).catch(() => summarizeFallback(title, content));
};

// ─── 2. AUTO-TAGGING ──────────────────────────────────────────────────────────
exports.generateTags = async (title, content) => {
  return withRetry(async () => {
    const prompt = `Analyze this note and return 3-5 relevant, specific tags.
Return ONLY a JSON array of lowercase strings. No explanation. No markdown code blocks.
Example: ["react", "hooks", "state-management"]

Title: ${title}
Content: ${content.slice(0, 1000)}`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim()
      .replace(/```json\n?|```\n?/g, '')
      .trim();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 5).map(t => t.toLowerCase().trim()) : [];
  }).catch(() => []);
};

// ─── 3. CONVERSATIONAL Q&A ────────────────────────────────────────────────────
exports.queryBrain = async (question, notes, history = []) => {
  return withRetry(async () => {
    const context = notes.slice(0, 20).map((n, i) =>
      `[Note ${i + 1}] Title: "${n.title}"
Type: ${n.type}
Tags: ${n.tags?.join(', ') || 'none'}
Content: ${n.summary || n.content.slice(0, 300)}`
    ).join('\n\n---\n\n');

    const historyText = history.slice(-6).map(m =>
      `${m.role === 'user' ? 'You' : 'Assistant'}: ${m.content}`
    ).join('\n');

    const prompt = `You are a personal knowledge assistant. Answer the question using ONLY the notes provided below.
If the answer isn't in the notes, say "I couldn't find that in your notes, but here's what I know..."
Reference specific notes by their number when relevant (e.g., "According to Note 3...").
Be conversational, helpful, and insightful.

${historyText ? `Previous conversation:\n${historyText}\n\n` : ''}Knowledge Base:
${context || 'No notes available yet.'}

Question: ${question}`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  }).catch((err) => queryFallback(question, notes, history, err?.message || ''));
};

// ─── 4. WRITING IMPROVEMENT ───────────────────────────────────────────────────
exports.improveWriting = async (content) => {
  return withRetry(async () => {
    const prompt = `Improve the clarity, structure, and conciseness of this note.
Keep the same meaning. Fix grammar and spelling. Improve readability.
Return ONLY the improved text, no explanation or preamble.

${content}`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  }).catch(() => improveFallback(content));
};

// ─── 5. FIND CONNECTIONS ──────────────────────────────────────────────────────
exports.findConnections = async (currentNote, allNotes) => {
  return withRetry(async () => {
    const otherNotes = allNotes.filter(n => n.id !== currentNote.id).slice(0, 30);
    if (otherNotes.length === 0) return [];

    const notesList = otherNotes.map((n, i) =>
      `[${i}] "${n.title}": ${n.summary || n.content.slice(0, 100)}`
    ).join('\n');

    const prompt = `Given this note:
Title: ${currentNote.title}
Content: ${currentNote.content.slice(0, 500)}

Find the 3 most conceptually related notes from the list below.
Look for thematic connections, shared concepts, or complementary ideas.
Return ONLY a JSON array of the indices (numbers). Example: [2, 7, 12]

${notesList}`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim().replace(/```json\n?|```\n?/g, '');
    const indices = JSON.parse(raw);
    return indices
      .filter(i => typeof i === 'number' && i >= 0 && i < otherNotes.length)
      .slice(0, 3)
      .map(i => otherNotes[i])
      .filter(Boolean);
  }).catch(() => []);
};

// ─── 6. DAILY DIGEST ──────────────────────────────────────────────────────────
exports.generateDigest = async (notes) => {
  return withRetry(async () => {
    if (notes.length === 0) return 'Add more notes to get your daily digest!';

    const notesSummary = notes.map(n =>
      `• "${n.title}": ${n.summary || n.content.slice(0, 150)}`
    ).join('\n');

    const prompt = `Create an engaging, personalized daily knowledge digest from these notes.
Write 2-3 sentences that connect the ideas meaningfully and offer a fresh perspective.
Be insightful, motivating, and conversational. No bullet points.

${notesSummary}`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  }).catch(() => digestFallback(notes));
};

// ─── 7. FLASHCARD GENERATION ──────────────────────────────────────────────────
exports.generateFlashcards = async (note) => {
  return withRetry(async () => {
    const prompt = `Create 5 high-quality study flashcards from this note.
Make questions specific and answers concise.
Return ONLY a JSON array with objects having "front" (question) and "back" (answer) keys.
No markdown. No explanation.

Title: ${note.title}
Content: ${note.content}

Format: [{"front": "Question?", "back": "Answer"}]`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim().replace(/```json\n?|```\n?/g, '');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
  }).catch(() => []);
};

// ─── 8. KEY INSIGHTS EXTRACTION ───────────────────────────────────────────────
exports.extractInsights = async (content) => {
  return withRetry(async () => {
    const prompt = `Extract the 3 most important, actionable insights from this text.
Each insight should be a complete sentence.
Return ONLY a JSON array of strings.

${content}`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim().replace(/```json\n?|```\n?/g, '');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 3) : [];
  }).catch(() => []);
};

// ─── 9. SENTIMENT ANALYSIS ────────────────────────────────────────────────────
exports.analyzeSentiment = async (content) => {
  return withRetry(async () => {
    const prompt = `Analyze the tone and sentiment of this note.
Return ONLY a JSON object with no extra text:
{"sentiment": "positive|neutral|negative", "confidence": 0.0-1.0, "emotions": ["curious", "excited", etc.], "tone": "one word description"}

${content.slice(0, 500)}`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim().replace(/```json\n?|```\n?/g, '');
    return JSON.parse(raw);
  }).catch(() => ({ sentiment: 'neutral', confidence: 0.5, emotions: [], tone: 'neutral' }));
};

// ─── 10. TOPIC CLUSTERING ─────────────────────────────────────────────────────
exports.clusterTopics = async (notes) => {
  return withRetry(async () => {
    if (notes.length < 3) return {};

    const titles = notes.map((n, i) => `[${i}] ${n.title}`).join('\n');

    const prompt = `Group these notes into 3-5 meaningful topic clusters.
Return ONLY a JSON object where keys are cluster names and values are arrays of note indices.
Example: {"Machine Learning": [0, 3, 7], "Productivity": [1, 4]}

${titles}`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim().replace(/```json\n?|```\n?/g, '');
    return JSON.parse(raw);
  }).catch(() => ({}));
};

// ─── 11. MIND MAP ─────────────────────────────────────────────────────────────
exports.generateMindMap = async (note) => {
  return withRetry(async () => {
    const prompt = `Create a mind map structure for this note.
Return ONLY a JSON object with "center" (main topic) and "branches" (array of {topic, subtopics[]}).

Title: ${note.title}
Content: ${note.content.slice(0, 1000)}`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim().replace(/```json\n?|```\n?/g, '');
    return JSON.parse(raw);
  }).catch(() => ({ center: note.title, branches: [] }));
};
