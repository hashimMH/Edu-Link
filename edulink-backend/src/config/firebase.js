// Firebase Admin SDK configuration
// Requires FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_PROJECT_ID in .env
const admin = require('firebase-admin');
const path = require('path');

let firebaseApp = null;

function getFirebaseAdmin() {
  if (firebaseApp) return firebaseApp;

  // Try service account JSON file first
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    // Resolve relative to project root (two dirs up from src/config/)
    const keyPath = path.resolve(__dirname, '../../', process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    const serviceAccount = require(keyPath);
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
    console.log('[Firebase] Initialized with service account:', keyPath);
    return firebaseApp;
  }

  // Fallback: use application default credentials (works in GCP)
  if (process.env.FIREBASE_PROJECT_ID) {
    firebaseApp = admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
    console.log('[Firebase] Initialized with project ID:', process.env.FIREBASE_PROJECT_ID);
    return firebaseApp;
  }

  console.warn('[Firebase] Not configured — set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_PROJECT_ID in .env');
  return null;
}

/**
 * Verify a Firebase ID token and return the decoded user info.
 * Returns null if Firebase is not configured or verification fails.
 */
async function verifyFirebaseToken(idToken) {
  const app = getFirebaseAdmin();
  if (!app) return null;

  try {
    const decoded = await app.auth().verifyIdToken(idToken);
    return {
      uid: decoded.uid,
      email: decoded.email || '',
      name: decoded.name || '',
      picture: decoded.picture || '',
      provider: decoded.firebase?.sign_in_provider || 'unknown',
    };
  } catch (err) {
    console.error('[Firebase] Token verification failed:', err.message);
    return null;
  }
}

module.exports = { getFirebaseAdmin, verifyFirebaseToken };
