const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8001';
const ML_REQUEST_TIMEOUT_MS = Number(process.env.ML_REQUEST_TIMEOUT_MS || 10000);

function withTimeout(ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timer),
  };
}

async function postJson(path, payload) {
  const timeout = withTimeout(ML_REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${ML_SERVICE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: timeout.signal,
    });

    const contentType = res.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
      ? await res.json()
      : { error: await res.text() };

    if (!res.ok) {
      throw new Error(data.error || `ML service HTTP ${res.status}`);
    }

    return data;
  } finally {
    timeout.clear();
  }
}

exports.semanticSearch = async ({ query, notes, topK = 5 }) => {
  return postJson('/semantic-search', {
    query,
    notes,
    top_k: topK,
  });
};

exports.similarNotes = async ({ noteId, notes, topK = 3 }) => {
  return postJson('/similar-notes', {
    note_id: noteId,
    notes,
    top_k: topK,
  });
};

exports.sentiment = async (content) => {
  return postJson('/sentiment', { content });
};

exports.autotag = async ({ title, content, candidateLabels, maxTags = 5 }) => {
  return postJson('/autotag', {
    title,
    content,
    candidate_labels: Array.isArray(candidateLabels) ? candidateLabels : [],
    max_tags: maxTags,
  });
};

exports.health = async () => {
  const timeout = withTimeout(ML_REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${ML_SERVICE_URL}/health`, { signal: timeout.signal });
    if (!res.ok) throw new Error(`ML service HTTP ${res.status}`);
    return await res.json();
  } finally {
    timeout.clear();
  }
};
