import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
//import { getStorage } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  // authDomain: "chat-87bd5.firebaseapp.com",
  // projectId: "chat-87bd5",
  // storageBucket: "chat-87bd5.firebasestorage.app",
  // messagingSenderId: "734516495401",
  // appId: "1:734516495401:web:313917d9b519ba1e654838"
  authDomain: "reactchat-c76c9.firebaseapp.com",
  projectId: "reactchat-c76c9",
  storageBucket: "reactchat-c76c9.firebasestorage.app",
  messagingSenderId: "634292378204",
  appId: "1:634292378204:web:34cbe71a16120178bca499"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
//export const storage = getStorage(app);

export default app;