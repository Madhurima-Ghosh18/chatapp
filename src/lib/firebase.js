import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "reactchat-c76c9.firebaseapp.com",
  projectId: "reactchat-c76c9",
  storageBucket: "reactchat-c76c9.firebasestorage.app",
  messagingSenderId: "634292378204",
  appId: "1:634292378204:web:34cbe71a16120178bca499"

};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);



export default app;
