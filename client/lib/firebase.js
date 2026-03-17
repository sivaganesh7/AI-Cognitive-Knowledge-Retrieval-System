import { getApps, initializeApp } from 'firebase/app';
import {
    GithubAuthProvider,
    GoogleAuthProvider,
    createUserWithEmailAndPassword,
    onAuthStateChanged as firebaseOnAuthStateChanged,
    getAuth,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signInWithPopup,
    signInWithRedirect,
    signOut,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const requiredKeys = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.appId,
];

const hasFirebaseConfig = requiredKeys.every((value) => {
  if (!value || typeof value !== 'string') return false;
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 && !normalized.startsWith('your_');
});

let app = null;
let auth = null;

if (hasFirebaseConfig) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
  } catch (err) {
    console.error('[Firebase] Failed to initialize auth:', err.message);
  }
} else {
  console.warn('[Firebase] NEXT_PUBLIC_FIREBASE_* values are missing or placeholders. Auth features are disabled until configured.');
}

export { auth };

const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

googleProvider.setCustomParameters({ prompt: 'select_account' });

function ensureAuthConfigured() {
  if (!auth) {
    const err = new Error('Firebase auth is not configured. Set valid NEXT_PUBLIC_FIREBASE_* values in your env file.');
    err.code = 'auth/configuration-not-found';
    throw err;
  }
}

export const signInWithGoogle = () => {
  ensureAuthConfigured();
  return signInWithPopup(auth, googleProvider).catch((err) => {
    // Some browsers/extensions block popups; redirect keeps Google login working.
    if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/cancelled-popup-request') {
      return signInWithRedirect(auth, googleProvider);
    }
    throw err;
  });
};

export const signInWithGitHub = () => {
  ensureAuthConfigured();
  return signInWithPopup(auth, githubProvider);
};

export const signInWithEmail = (email, password) => {
  ensureAuthConfigured();
  return signInWithEmailAndPassword(auth, email, password);
};

export const signUpWithEmail = (email, password) => {
  ensureAuthConfigured();
  return createUserWithEmailAndPassword(auth, email, password);
};

export const logOut = () => {
  ensureAuthConfigured();
  return signOut(auth);
};

export const resetPassword = (email) => {
  ensureAuthConfigured();
  return sendPasswordResetEmail(auth, email);
};

export const onAuthStateChanged = (authInstance, callback) => {
  if (!authInstance) {
    callback(null);
    return () => {};
  }
  return firebaseOnAuthStateChanged(authInstance, callback);
};
