import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyC81zYctRKw6JLgR2PIvuS6-yBoUNDCAlk",
  authDomain: "deutsch-hub-ea48a.firebaseapp.com",
  projectId: "deutsch-hub-ea48a",
  storageBucket: "deutsch-hub-ea48a.firebasestorage.app",
  messagingSenderId: "200926145448",
  appId: "1:200926145448:web:60b0f5a24227e6d48b0b9d",
  measurementId: "G-9XEZ5P0913"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// const analytics = getAnalytics(app);
