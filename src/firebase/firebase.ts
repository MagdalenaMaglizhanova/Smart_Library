// src/firebase/firebase.ts
import { initializeApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import { getAuth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import type { Analytics } from "firebase/analytics";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
apiKey: "AIzaSyCR06B3I0fqvnOk4pfZtJAUyXmnk-nKvh8",
  authDomain: "smart-library-8b4e5.firebaseapp.com",
  projectId: "smart-library-8b4e5",
  storageBucket: "smart-library-8b4e5.firebasestorage.app",
  messagingSenderId: "1090859078138",
  appId: "1:1090859078138:web:1e8ee064cec3d1ebf0d443",
  measurementId: "G-RR7SPDDXQG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase Authentication
export const auth: Auth = getAuth(app);

// Firestore Database
export const db: Firestore = getFirestore(app);

// Initialize Firebase Analytics (по избор)
export const analytics: Analytics = getAnalytics(app);