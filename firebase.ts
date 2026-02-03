
import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";

// --- CONNECTION INSTRUCTIONS ---
// 1. Go to https://console.firebase.google.com/
// 2. Click on your project > Project Settings (Gear icon).
// 3. Scroll to "Your apps" section.
// 4. Copy the values from your firebaseConfig object and paste them below.

const firebaseConfig = {
  apiKey: "AIzaSyBywp28cfkVofl_O7xoSqT4JeSmXPGO3KI", 
  authDomain: "syllabus-tracker-9582a.firebaseapp.com",
  projectId: "syllabus-tracker-9582a",
  storageBucket: "syllabus-tracker-9582a.firebasestorage.app",
  messagingSenderId: "319425724278",
  appId: "1:319425724278:web:74efa162a89229ede08457"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore Database with long polling to ensure connection in all environments
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
