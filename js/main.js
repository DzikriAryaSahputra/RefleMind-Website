import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

import {
    initHomePage,
    initMoodTracker,
    renderMoodChart,
    loadJurnalRefleksi,
    initRuangTenang,
    loadFavoritQuotes
} from './features.js';

// --- Import untuk membaca user role ---
import {
    doc,
    getDoc,
    collection,
    addDoc,
    setDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";


// === C. AUTH GUARD & MAIN APP LOGIC ===
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // 1. Pengguna Login
        console.log("User is logged in:", user.email);

        // 2. CEK ROLE PENGGUNA 
        try {
            const userDocRef = doc(db, "users_list", user.uid);
            const userSnap = await getDoc(userDocRef);

            if (userSnap.exists()) {
                const userData = userSnap.data();

                // JIKA ADMIN: Lempar ke halaman admin
                if (userData.role === 'admin') {
                    console.log("Admin terdeteksi. Mengalihkan ke dashboard...");
                    window.location.href = 'auth/admin.html';
                    return; // Stop eksekusi kode di bawah
                }
            }
        } catch (error) {
            console.error("Gagal memverifikasi role:", error);
        }

        // 3. JIKA BUKAN ADMIN: Tampilkan Aplikasi Utama
        document.body.style.display = 'block';
        runApp(user);

    } else {
        // 4. Pengguna Tidak Login
        console.log("User is not logged in, redirecting to login...");
        window.location.href = 'auth/login.html';
    }
});


// === D. FUNGSI UTAMA APLIKASI ===
function runApp(user) {

    // === 1. NAVIGASI Halaman (SPA) ===
    const pages = document.querySelectorAll('#app-container .page');
    const navItems = document.querySelectorAll('.nav-item');

    function showPage(pageId) {
        pages.forEach(page => page.classList.remove('active'));
        const targetPage = document.getElementById(`page-${pageId}`);
        if (targetPage) {
            targetPage.classList.add('active');
        } else {
            document.getElementById('page-home').classList.add('active');
            pageId = 'home';
        }

        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === `#${pageId}`) {
                item.classList.add('active');
            }
        });

        // Load data sesuai halaman
        if (pageId === 'grafik') {
            try { renderMoodChart(user); } catch (e) { console.error("Gagal render grafik:", e); }
        } else if (pageId === 'jurnal') {
            try { loadJurnalRefleksi(user); } catch (e) { console.error("Gagal memuat jurnal:", e); }
        } else if (pageId === 'ruang-tenang') {
            try { initRuangTenang(user); } catch (e) { console.error("Gagal memuat Ruang Tenang:", e); }
        } else if (pageId === 'favorit') {
            try { loadFavoritQuotes(user); } catch (e) { console.error("Gagal memuat favorit:", e); }
        }
    }

    document.addEventListener('click', (e) => {
        const link = e.target.closest('#app-container a[href^="#"]');
        if (link) {
            e.preventDefault();
            const pageId = link.getAttribute('href').substring(1);
            if (document.getElementById(`page-${pageId}`)) {
                showPage(pageId);
            }
        }
    });

    showPage('home');


    // === 2. INISIALISASI FITUR ===
    initHomePage();
    initMoodTracker(user);

    // Inisialisasi Halaman Profil
    const tombolLogout = document.getElementById('tombolLogout');
    const profilNama = document.getElementById('profil-nama');
    const profilEmail = document.getElementById('profil-email');
    const sapaanPengguna = document.getElementById('sapaanPengguna');

    const username = user.displayName || "Kamu";
    if (profilNama) profilNama.textContent = username;
    if (profilEmail) profilEmail.textContent = user.email;
    if (sapaanPengguna) { sapaanPengguna.textContent = `Hai ${username}, gimana perasaanmu hari ini?`; }

    if (tombolLogout) {
        tombolLogout.addEventListener('click', () => {
            signOut(auth).catch((error) => console.error("Logout error:", error));
        });
    }

    // === 3. LISTENER "LOVE" GLOBAL ===
    const appContainer = document.getElementById('app-container');
    if (appContainer) {
        appContainer.addEventListener('click', async (e) => {
            const loveBtn = e.target.closest('.btn-love');
            if (loveBtn) {
                const card = e.target.closest('.card-quote');
                const quoteId = card.getAttribute('data-quote-id');
                if (!quoteId) return;

                const quoteRef = doc(db, 'users', user.uid, 'loved_quotes', quoteId);
                const icon = loveBtn.querySelector('i');
                const isLoved = loveBtn.classList.toggle('loved');

                if (isLoved) {
                    icon.classList.remove('bi-heart');
                    icon.classList.add('bi-heart-fill');
                    try { await setDoc(quoteRef, { lovedAt: new Date() }); } catch (err) { /* err */ }
                } else {
                    icon.classList.remove('bi-heart-fill');
                    icon.classList.add('bi-heart');
                    try { await deleteDoc(quoteRef); } catch (err) { /* err */ }
                }
            }
        });
    }

}