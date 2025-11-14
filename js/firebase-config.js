import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAV4wB1IFreIgDJQqdFslLyIdl8jNpPZt8",
    authDomain: "self-care-a3fd0.firebaseapp.com",
    projectId: "self-care-a3fd0",
    storageBucket: "self-care-a3fd0.firebasestorage.app",
    messagingSenderId: "39819080808",
    appId: "1:39819080808:web:dc7431bfd5e9292f4ef7dd"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);