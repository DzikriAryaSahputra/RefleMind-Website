import { auth } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import {
    initHomePage,
    initMoodTracker,
    renderMoodChart,
    loadJurnalRefleksi,
    initRuangTenang
} from './features.js';


// === AUTH GUARD & MAIN APP LOGIC ===
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.body.style.display = 'block';
        runApp(user);
    } else {
        window.location.href = 'auth/login.html';
    }
});


// === FUNGSI UTAMA APLIKASI ===
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
        if (pageId === 'grafik') {
            try { renderMoodChart(user); } catch (e) { console.error("Gagal render grafik:", e); }
        } else if (pageId === 'jurnal') {
            try { loadJurnalRefleksi(user); } catch (e) { console.error("Gagal memuat jurnal:", e); }
        } else if (pageId === 'ruang-tenang') {
            try { initRuangTenang(user); } catch (e) { console.error("Gagal memuat Ruang Tenang:", e); }
        }
    }

    document.addEventListener('click', (e) => {
        const link = e.target.closest('#app-container a.nav-item');
        if (link && link.getAttribute('href') && link.getAttribute('href').startsWith('#')) {
            e.preventDefault();
            const pageId = link.getAttribute('href').substring(1);
            showPage(pageId);
        }
    });
    showPage('home');


    // === 2. INISIALISASI FITUR SAAT APLIKASI DIMUAT ===
    initHomePage();
    initMoodTracker(user);

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

}