import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyBPLYuPbib2NUULTrZA5nE2H3A4zkpDffw",
  authDomain: "probabilitywebsite-c035b.firebaseapp.com",
  projectId: "probabilitywebsite-c035b",
  storageBucket: "probabilitywebsite-c035b.firebasestorage.app",
  messagingSenderId: "1046798969004",
  appId: "1:1046798969004:web:86b0ccbb8c849783a95709",
  measurementId: "G-Z0MTHDXJZE"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);

// Make Firestore accessible globally
window.db = db;
