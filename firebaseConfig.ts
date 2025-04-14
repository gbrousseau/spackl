// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBHaxJP1XKDc7iuY7ZfJAcBb7Jkgw7rsVw",
    authDomain: "spacklapp.firebaseapp.com",
    projectId: "spacklapp",
    storageBucket: "spacklapp.firebasestorage.app",
    messagingSenderId: "954071843248",
    appId: "1:954071843248:web:9b98c0fea6faa4480c5675",
    measurementId: "G-6F24MS1RKX"
};

// Initialize Firebase
export const FIREBASE_APP = initializeApp(firebaseConfig);
// Initialize Auth with AsyncStorage persistence
export const FIREBASE_AUTH = initializeAuth(FIREBASE_APP, {
  // persistence is not supported directly, remove or replace with a compatible library
});
export const FIREBASE_STORAGE = getStorage(FIREBASE_APP);
export const FIREBASE_FIRESTORE = getFirestore(FIREBASE_APP);