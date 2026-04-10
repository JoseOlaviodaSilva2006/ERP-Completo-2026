// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCzmfzqrCndTM5hFFp0gPueI162hfRpHgM",
  authDomain: "erp-completo-493eb.firebaseapp.com",
  projectId: "erp-completo-493eb",
  storageBucket: "erp-completo-493eb.firebasestorage.app",
  messagingSenderId: "259683933861",
  appId: "1:259683933861:web:0161f124b7ef2137a0f74c",
  measurementId: "G-BX7D8TK0XS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics conditionally to avoid SSR issues in Next.js
let analytics;
if (typeof window !== 'undefined') {
  isSupported().then((yes) => yes ? (analytics = getAnalytics(app)) : null);
}

export { app, analytics };