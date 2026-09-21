import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// import { getAnalytics } from "firebase/analytics";

const env = import.meta.env ?? {};

// Production remains the safe default. A local Vite mode can override each
// public Firebase web setting without changing the production project.
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyC81zYctRKw6JLgR2PIvuS6-yBoUNDCAlk",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "deutsch-hub-ea48a.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "deutsch-hub-ea48a",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "deutsch-hub-ea48a.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "200926145448",
  appId: env.VITE_FIREBASE_APP_ID || "1:200926145448:web:60b0f5a24227e6d48b0b9d",
  ...(env.VITE_FIREBASE_MEASUREMENT_ID ? { measurementId: env.VITE_FIREBASE_MEASUREMENT_ID } : { measurementId: "G-9XEZ5P0913" })
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// const analytics = getAnalytics(app);
