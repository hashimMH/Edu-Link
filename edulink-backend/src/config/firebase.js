// Firebase Admin SDK configuration
// Supports: FIREBASE_SERVICE_ACCOUNT_PATH, FIREBASE_CREDENTIALS_JSON, FIREBASE_PROJECT_ID
const admin = require('firebase-admin');
const path = require('path');

let firebaseApp = null;

function getFirebaseAdmin() {
  if (firebaseApp) return firebaseApp;

  try {
    // 1. Service account JSON file
    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const keyPath = path.resolve(__dirname, '../../', process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      const serviceAccount = require(keyPath);
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
      console.log('[Firebase] Initialized with service account file');
      return firebaseApp;
    }

    // 2. Credentials from env var (raw JSON or base64) — works on any platform
    if (process.env.FIREBASE_CREDENTIALS_JSON) {
      let creds = process.env.FIREBASE_CREDENTIALS_JSON;
      // Try base64 decode first, fall back to raw JSON
      const cleaned = creds.replace(/\\n/g, '\n').trim();
      try {
        const decoded = Buffer.from(cleaned, 'base64').toString('utf-8');
        if (decoded.startsWith('{')) creds = decoded;
      } catch (_) {}
      if (!creds.startsWith('{')) throw new Error('Invalid credentials format');
      const serviceAccount = JSON.parse(creds);
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
      console.log('[Firebase] Initialized with credentials from env');
      return firebaseApp;
    }

    // 3. Application default credentials (GCP only)
    if (process.env.FIREBASE_PROJECT_ID) {
      firebaseApp = admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID });
      console.log('[Firebase] Initialized with project ID (ADC):', process.env.FIREBASE_PROJECT_ID);
      return firebaseApp;
    }
  } catch (err) {
    console.error('[Firebase] Init failed:', err.message);
  }

  console.warn('[Firebase] Not configured — Google Sign-In disabled');
  return null;
}

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
