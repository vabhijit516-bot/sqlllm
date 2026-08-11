import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCW5xOrNVYtMuxUqO2obZHMi1FFtKx6AAw",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "sql-llm-d6854.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "sql-llm-d6854",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "sql-llm-d6854.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "104768588274",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:104768588274:web:00d31404f875e88998836b",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-F2B3XVZ34G"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export let analytics = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}

googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const signInWithFirebaseGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const idToken = await user.getIdToken();
    return {
      success: true,
      user: {
        user_id: user.uid,
        email: user.email,
        name: user.displayName || user.email.split('@')[0],
        picture: user.photoURL
      },
      idToken: idToken
    };
  } catch (error) {
    console.error("Firebase Google Auth popup error:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const signOutFirebase = async () => {
  try {
    await signOut(auth);
  } catch (e) {
    console.error("Firebase SignOut error:", e);
  }
};

export default app;
