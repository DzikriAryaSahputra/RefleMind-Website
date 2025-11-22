import { auth, db } from './firebase-config.js';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Ambil elemen dari halaman
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

// --- ELEMEN TOAST ---
const toast = document.getElementById('toast-notification');
const toastIcon = document.getElementById('toast-icon');
const toastMessage = document.getElementById('toast-message');
let toastTimeout;

// --- FUNGSI NOTIFIKASI ---
function showNotification(message, type = 'error') {
    if (!toast) return;
    clearTimeout(toastTimeout);
    toast.classList.remove('success', 'error');
    toast.classList.add(type);
    if (type === 'success') {
        toastIcon.innerHTML = '<i class="bi bi-check-circle-fill"></i>';
    } else {
        toastIcon.innerHTML = '<i class="bi bi-exclamation-triangle-fill"></i>';
    }
    toastMessage.textContent = message;
    toast.classList.add('show');
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

// --- FUNGSI ERROR ---
function showAuthError(message) {
    if (message.includes("auth/invalid-login-credentials") || message.includes("auth/wrong-password") || message.includes("auth/user-not-found")) {
        message = "Email atau password salah.";
    } else if (message.includes("auth/email-already-in-use")) {
        message = "Email ini sudah terdaftar. Silakan login.";
    } else if (message.includes("auth/weak-password")) {
        message = "Password terlalu lemah (minimal 6 karakter).";
    }
    showNotification(message, 'error');
}

// 1. Logika Halaman Login
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                console.log("Login successful, redirecting...");
                showNotification('Login berhasil. Selamat datang!', 'success');
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 1500);
            })
            .catch((error) => {
                showAuthError(error.message);
            });
    });
}

// 2. Logika Halaman Register
if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const username = document.getElementById('register-username').value.trim();
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        if (username === '') {
            showAuthError("Username tidak boleh kosong.");
            return;
        }

        createUserWithEmailAndPassword(auth, email, password)
            .then(async (userCredential) => {
                const user = userCredential.user;
                await updateProfile(user, {
                    displayName: username
                });

                await setDoc(doc(db, "users_list", user.uid), {
                    username: username,
                    email: email,
                    role: 'user', // Default role
                    joinedAt: new Date().toISOString()
                });

                return user;
            })
            .then(() => {
                console.log("Register successful, data saved to DB.");
                showNotification('Akun berhasil dibuat. Selamat datang!', 'success');
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 1500);
            })
            .catch((error) => {
                showAuthError(error.message);
            });
    });
}