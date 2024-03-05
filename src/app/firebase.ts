import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore,  } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDBjKAeN8Yg6JumcdbWN38Y51bmSxLQNQg",
    authDomain: "froymon-2b381.firebaseapp.com",
    databaseURL: "https://froymon-2b381-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "froymon-2b381",
    storageBucket: "froymon-2b381.appspot.com",
    messagingSenderId: "168869643793",
    appId: "1:168869643793:web:9b25c36f20aafc9ca9d3b0",
    measurementId: "G-E2DT26L42L"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore();
const auth = getAuth();

export { app, db, auth }