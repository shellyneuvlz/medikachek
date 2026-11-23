import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

let authInstance: any = null;
let googleProviderInstance: any = null;

try {
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  authInstance = getAuth(app);
  googleProviderInstance = new GoogleAuthProvider();
} catch (e) {
  console.warn('Firebase init warning:', e);
}

export const auth = authInstance;
export const googleAuthProvider = googleProviderInstance;
