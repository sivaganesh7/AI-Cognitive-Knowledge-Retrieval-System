import { auth } from './firebase';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const REQUEST_TIMEOUT_MS = 15000;

function joinUrl(path) {
  return `${BASE_URL.replace(/\/$/, '')}${path}`;
}

async function getAuthHeaders() {
  const token = await auth?.currentUser?.getIdToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

async function handleResponse(res) {
  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await res.json()
    : { error: await res.text() };

  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

async function safeFetch(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      cache: 'no-store',
      ...options,
      signal: controller.signal,
    });
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new Error('Request timed out. Please retry.');
    }
    throw new Error('Backend is offline. Start server on http://localhost:4000 and try again.');
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  async get(path) {
    const res = await safeFetch(joinUrl(path), {
      headers: await getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async post(path, data) {
    const res = await safeFetch(joinUrl(path), {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async patch(path, data) {
    const res = await safeFetch(joinUrl(path), {
      method: 'PATCH',
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async delete(path) {
    const res = await safeFetch(joinUrl(path), {
      method: 'DELETE',
      headers: await getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // For file downloads
  async download(path) {
    const token = await auth?.currentUser?.getIdToken();
    const res = await safeFetch(joinUrl(path), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Download failed');
    return res;
  },
};
