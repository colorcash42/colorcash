// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDA5awB3hajm6tJ4BiUjl_xVWOGqIM_p7c",
  authDomain: "trivium-clash.firebaseapp.com",
  projectId: "trivium-clash",
  storageBucket: "trivium-clash.firebasestorage.app",
  messagingSenderId: "23472719869",
  appId: "1:23472719869:web:900e5bb9e4426eacc3fb94"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const auth = getAuth(app);
