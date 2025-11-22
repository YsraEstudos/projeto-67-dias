// src/services/firebase.ts
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAxHWP_VnRb_zYu9Ghe7xvJySPw3GLcBJs",
    authDomain: "projeto67days.firebaseapp.com",
    projectId: "projeto67days",
    storageBucket: "projeto67days.firebasestorage.app",
    messagingSenderId: "728415811130",
    appId: "1:728415811130:web:fb1088985da1aff06de703",
    measurementId: "G-E778VLEG7K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);
