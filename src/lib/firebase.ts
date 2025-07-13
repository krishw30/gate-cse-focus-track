import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBItNqTL2tFmta_F3Y-WXe2o8vwwHUFHsg",
  authDomain: "revision-track.firebaseapp.com",
  projectId: "revision-track",
  storageBucket: "revision-track.firebasestorage.app",
  messagingSenderId: "168710569705",
  appId: "1:168710569705:web:5797d6e067394be35e3a78",
  measurementId: "G-YR1H8K241K"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);