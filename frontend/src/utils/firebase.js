import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyKeyForGoogleAuth2026",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "sql-llm-d6854.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "sql-llm-d6854",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "sql-llm-d6854.appspot.com",
  messagingSenderId: "939574633330",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:939574633330:web:d6854"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

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
