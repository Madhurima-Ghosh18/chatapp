import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "reactchatapp-fd223.firebaseapp.com",
  projectId: "reactchatapp-fd223",
  storageBucket: "reactchatapp-fd223.appspot.com",
  messagingSenderId: "15367951091",
  appId: "1:15367951091:web:c0cc820f1286ed171c9d86",
  signInFlow: 'popup',
};



// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth=getAuth()
export const db=getFirestore()
export const storage=getStorage()