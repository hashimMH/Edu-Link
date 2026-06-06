import { Platform } from 'react-native';
import { storage } from './storage';

/**
 * Firebase Auth Service — handles Google (Android) and Apple (iOS) sign-in.
 * Uses the modular @react-native-firebase v22 API.
 *
 * Prerequisites:
 * - @react-native-firebase/app and @react-native-firebase/auth installed
 * - @react-native-google-signin/google-signin installed
 * - google-services.json (Android) and GoogleService-Info.plist (iOS) in place
 * - Firebase project with Google and Apple Sign-In enabled
 */

// Modular imports — v22+ API
import {
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
  getIdToken,
} from '@react-native-firebase/auth';

import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Configure Google Sign-In once at module load
GoogleSignin.configure({
  webClientId: '746674100825-j0ffel9drjhj58uskn2v6kh6anslnnh5.apps.googleusercontent.com',
  offlineAccess: false,
});

/**
 * Update the Google Web Client ID at runtime if needed.
 */
export function configureGoogleSignIn(webClientId: string) {
  GoogleSignin.configure({ webClientId, offlineAccess: false });
}

/**
 * Sign in with Google (Android) — modular API
 */
export async function signInWithGoogle() {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    // Sign out first so the account picker always appears
    try { await GoogleSignin.signOut(); } catch (_) {}

    const signInResult = await GoogleSignin.signIn();

    // Get the Google ID token
    let idToken = signInResult.data?.idToken;
    if (!idToken) {
      const tokens = await GoogleSignin.getTokens();
      idToken = tokens.idToken;
    }

    if (!idToken) throw new Error('Could not get ID token from Google');

    // Build Firebase credential and sign in — modular API
    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(getAuth(), credential);

    // Get Firebase ID token for our backend
    const firebaseIdToken = await getIdToken(userCredential.user);

    return authenticateWithBackend(firebaseIdToken);
  } catch (err: any) {
    if (err.code === 'DEVELOPER_ERROR') {
      throw new Error('Google Sign-In not configured. Check google-services.json and webClientId.');
    }
    if (err.code === 'SIGN_IN_CANCELLED' || err.code === 'CANCELED') {
      throw { code: 'CANCELLED', message: 'Sign in cancelled' };
    }
    throw err;
  }
}

/**
 * Sign in with Apple (iOS) — modular API
 */
export async function signInWithApple() {
  try {
    const { OAuthProvider, signInWithProvider } = require('@react-native-firebase/auth');
    const appleAuthProvider = new OAuthProvider('apple.com');
    const userCredential = await signInWithProvider(getAuth(), appleAuthProvider);
    const firebaseIdToken = await getIdToken(userCredential.user);
    return authenticateWithBackend(firebaseIdToken);
  } catch (err: any) {
    if (err.code === 'auth/operation-not-allowed') {
      throw new Error('Apple Sign-In not enabled in Firebase console');
    }
    if (err.code === 'CANCELED' || err.message?.includes('cancelled')) {
      throw { code: 'CANCELLED', message: 'Sign in cancelled' };
    }
    throw err;
  }
}

/**
 * Send Firebase ID token to our backend for verification and account creation.
 */
async function authenticateWithBackend(idToken: string) {
  const res = await fetch(`${getApiHost()}/api/auth/firebase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });

  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Authentication failed');
  // Store our JWT and user data
  await storage.setToken(data.data.token);
  if (data.data.refreshToken) await storage.setRefreshToken(data.data.refreshToken);
  await storage.setUser(data.data.user);

  return data.data;
}

function getApiHost() {
  return Platform.OS === 'android' ? 'http://10.0.2.2:3003' : 'http://localhost:3003';
}
