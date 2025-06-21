import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCqDlIxPDp-QU6mzthkWnmzM6rZ8rnJdiI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dev1-b3973.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dev1-b3973",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "dev1-b3973.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "658150387877",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:658150387877:web:ac90e7b1597a45258f5d4c",
  measurementId: "G-7W2BNH8MQ7"
};

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;