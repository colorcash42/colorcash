// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// IMPORTANT: Replace this with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDA5awB3hajm6tJ4BiUjl_xVWOGqIM_p7c",
  authDomain: "trivium-clash.firebaseapp.com",
  projectId: "trivium-clash",
  storageBucket: "trivium-clash.firebasestorage.app",
  messagingSenderId: "23472719869",
  appId: "1:23472719869:web:900e5bb9e4426eacc3fb94",
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export const db = getFirestore(app);
