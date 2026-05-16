import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, orderBy, query, limit } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAzeyLUNuYemrfkMJjbnQbJ8k7uMHH1UNw",
    authDomain: "musfiqur-jahin.firebaseapp.com",
    projectId: "musfiqur-jahin",
    storageBucket: "musfiqur-jahin.firebasestorage.app",
    messagingSenderId: "871180068306",
    appId: "1:871180068306:web:890196b2aa9c52213f940b",
    measurementId: "G-W2QPK6WKZZ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function getTopScore() {
    const snap = await getDoc(doc(db, "space-shooter", "top score"));
    return snap.exists() ? snap.data() : null;
}

async function saveTopScore(name, score) {
    await setDoc(doc(db, "space-shooter", "top score"), { name, score, ts: Date.now() });
    await setDoc(doc(collection(db, "space-shooter", "top scorer", "entries")), { name, score, ts: Date.now() });
}

// Expose to main game script
window._fb = { getTopScore, saveTopScore };