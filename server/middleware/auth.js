const admin = require('firebase-admin');
const db = require('../db/queries');

// Initialize Firebase Admin lazily so server can boot even if env is missing.
let firebaseInitError = null;

function isLocalAuthMode() {
  return (process.env.AUTH_MODE || '').toLowerCase() === 'local';
}

function firstHeaderValue(value) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function getLocalIdentity(req) {
  const headerUid = firstHeaderValue(req.headers['x-dev-user-id']);
  const headerEmail = firstHeaderValue(req.headers['x-dev-user-email']);
  const headerName = firstHeaderValue(req.headers['x-dev-user-name']);

  return {
    uid: (headerUid || process.env.DEV_LOCAL_UID || 'local-dev-user').toString(),
    email: (headerEmail || process.env.DEV_LOCAL_EMAIL || 'local-dev@example.com').toString(),
    displayName: (headerName || process.env.DEV_LOCAL_NAME || 'Local Developer').toString(),
  };
}

function ensureFirebaseAdminInitialized() {
  if (admin.apps.length) return true;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    firebaseInitError = 'Firebase Admin env vars are missing (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).';
    return false;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    firebaseInitError = null;
    return true;
  } catch (err) {
    firebaseInitError = err.message;
    return false;
  }
}

module.exports = async function authMiddleware(req, res, next) {
  if (isLocalAuthMode()) {
    try {
      const identity = getLocalIdentity(req);
      const dbUser = await db.upsertUser({
        firebase_uid: identity.uid,
        email: identity.email,
        display_name: identity.displayName,
        photo_url: null,
      });

      req.user = {
        firebase_uid: identity.uid,
        email: identity.email,
        is_local: true,
      };
      req.dbUser = dbUser;
      return next();
    } catch (err) {
      console.error('[AUTH][LOCAL]', err.message);
      return res.status(500).json({ error: 'Local auth setup failed' });
    }
  }

  if (!ensureFirebaseAdminInitialized()) {
    return res.status(500).json({
      error: 'Server auth is not configured correctly.',
      details: process.env.NODE_ENV === 'development' ? firebaseInitError : undefined,
    });
  }

  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = await admin.auth().verifyIdToken(token);

    // Upsert user in MongoDB
    const dbUser = await db.upsertUser({
      firebase_uid: decoded.uid,
      email: decoded.email,
      display_name: decoded.name || decoded.email?.split('@')[0],
      photo_url: decoded.picture,
    });

    req.user = { firebase_uid: decoded.uid, email: decoded.email };
    req.dbUser = dbUser;
    next();
  } catch (err) {
    console.error('[AUTH]', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
