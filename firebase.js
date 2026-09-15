import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBWgO9pUz6hXKyuF7xwjFzD81M8YP_NmAE",
  authDomain: "unnati-2ed3e.firebaseapp.com",
  projectId: "unnati-2ed3e",
  storageBucket: "unnati-2ed3e.firebasestorage.app",
  messagingSenderId: "19212811536",
  appId: "1:19212811536:web:dea2ab4f3fe6e329e33995"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);