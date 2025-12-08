
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
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

// Initialize Firestore Database
export const db = getFirestore(app);
