
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBUrvFylqDFhTp056OZYhVUjWZRl78_sW8",
  authDomain: "dquotes-01.firebaseapp.com",
  projectId: "dquotes-01",
  storageBucket: "dquotes-01.firebasestorage.app",
  messagingSenderId: "853628938463",
  appId: "1:853628938463:web:130b6344e71b2b726e616a",
  measurementId: "G-CGL5XTL9PH"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
