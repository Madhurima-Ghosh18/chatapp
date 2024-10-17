import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "abcd-7c4c8.firebaseapp.com",
  projectId: "abcd-7c4c8",
  storageBucket: "abcd-7c4c8.appspot.com",
  messagingSenderId: "1000557545198",
  appId: "1:1000557545198:web:ff8c78577c180b725ed5ff"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
