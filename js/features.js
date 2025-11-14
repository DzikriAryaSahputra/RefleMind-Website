import { db } from './firebase-config.js';
import {
    collection,
    addDoc,
    query,
    orderBy,
    limit,
    getDocs,
    doc,
    setDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

import { ALL_QUOTES, HOME_QUOTES } from './data.js';
import { showNotification, getMoodIcon, formatTanggal } from './ui.js';

/**
 * Menginisialisasi fitur Afirmasi Harian di Halaman Home.
 */
export function initHomePage() {
    const quoteText = document.getElementById('quote-text');
    if (quoteText) {
        const randomIndex = Math.floor(Math.random() * HOME_QUOTES.length);
        quoteText.textContent = HOME_QUOTES[randomIndex];
    }
}

export function initMoodTracker(user) {
    const simpanButton = document.getElementById('simpanMood');
    const refleksiInput = document.getElementById('refleksi');
    const moodBoxes = document.querySelectorAll('.mood-box');
    let selectedMood = null;
    moodBoxes.forEach(box => {
        box.addEventListener('click', () => {
            moodBoxes.forEach(b => b.classList.remove('selected'));
            box.classList.add('selected');
            selectedMood = box.getAttribute('data-mood');
        });
    });
    if (simpanButton) {
        simpanButton.addEventListener('click', async () => {
            const refleksiText = refleksiInput.value;
            const timestamp = new Date();
            const dateString = timestamp.toISOString().split('T')[0];
            if (!selectedMood) {
                showNotification('Silakan pilih mood kamu hari ini.', 'error');
                return;
            }
            simpanButton.textContent = "Menyimpan...";
            simpanButton.disabled = true;
            try {
                const userMoodsCol = collection(db, 'users', user.uid, 'moods');
                await addDoc(userMoodsCol, {
                    date: dateString,
                    createdAt: timestamp,
                    mood: selectedMood,
                    reflection: refleksiText
                });
                showNotification('Bagus banget, kamu udah kasih waktu buat dirimu! ❤️', 'success');
                moodBoxes.forEach(b => b.classList.remove('selected'));
                refleksiInput.value = '';
                selectedMood = null;
            } catch (error) {
                console.error("Error saving document: ", error);
                showNotification('Gagal menyimpan. Coba lagi.', 'error');
            } finally {
                simpanButton.textContent = "Simpan Mood Hari Ini";
                simpanButton.disabled = false;
            }
        });
    }
}

let myMoodChart = null;
export async function renderMoodChart(user) {
    const ctxElement = document.getElementById('moodChart');
    if (!ctxElement) return;
    const ctx = ctxElement.getContext('2d');

    try {
        const userMoodsCol = collection(db, 'users', user.uid, 'moods');
        const q = query(userMoodsCol, orderBy('createdAt', 'desc'), limit(7));
        const querySnapshot = await getDocs(q);
        const moodData = [];
        querySnapshot.forEach((doc) => moodData.push(doc.data()));
        moodData.reverse();
        const labels = moodData.map(item => item.date.split('-').slice(1).reverse().join('/'));
        const moodScores = moodData.map(item => {
            switch (item.mood) {
                case 'Senang': return 4;
                case 'Biasa': return 3;
                case 'Sedih': return 2;
                case 'Marah': return 1;
                default: return 0;
            }
        });
        if (myMoodChart) myMoodChart.destroy();
        if (typeof Chart === 'undefined') {
            console.error("Chart.js diblokir atau gagal dimuat.");
            return;
        }
        myMoodChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Skor Mood',
                    data: moodScores,
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    borderWidth: 3,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 5,
                        ticks: {
                            stepSize: 1,
                            callback: function (value) {
                                if (value === 1) return 'Marah';
                                if (value === 2) return 'Sedih';
                                if (value === 3) return 'Biasa';
                                if (value === 4) return 'Senang';
                                return '';
                            }
                        }
                    }
                },
                plugins: { legend: { display: false } }
            }
        });
    } catch (error) {
        console.log("Gagal memuat grafik:", error);
    }
}

export async function loadJurnalRefleksi(user) {
    const container = document.getElementById('jurnal-list-container');
    if (!container) return;
    container.innerHTML = '<p class="text-center text-muted">Memuat jurnal...</p>';

    try {
        const jurnalCol = collection(db, 'users', user.uid, 'moods');
        const q = query(jurnalCol, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            container.innerHTML = '<p class="text-center text-muted">Belum ada jurnal yang tersimpan. Mulai tulis di halaman Home!</p>';
            return;
        }
        container.innerHTML = '';
        querySnapshot.forEach(doc => {
            const data = doc.data();
            const entryHtml = `
                <div class="card journal-entry-card mb-3">
                    <div class="card-body">
                        <h5 class="card-title journal-title">
                            <span class="journal-mood-icon ${data.mood.toLowerCase()}">
                                ${getMoodIcon(data.mood)}
                            </span>
                            ${formatTanggal(data.createdAt.toDate())}
                        </h5>
                        <p class="card-text">
                            ${data.reflection || '<em>Tidak ada refleksi tertulis.</em>'}
                        </p>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', entryHtml);
        });
    } catch (e) {
        console.error("Gagal memuat jurnal:", e);
        container.innerHTML = '<p class="text-center text-danger">Gagal memuat jurnal. Coba lagi nanti.</p>';
    }
}

export function initRuangTenang(user) {
    const pageRuangTenang = document.getElementById('page-ruang-tenang');
    if (!pageRuangTenang) return;
    loadDailyQuotes();
    pageRuangTenang.addEventListener('click', async (e) => {
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
                try {
                    await setDoc(quoteRef, { lovedAt: new Date() });
                } catch (err) {
                    console.error("Gagal menyimpan love:", err);
                    loveBtn.classList.remove('loved');
                    icon.classList.add('bi-heart');
                    icon.classList.remove('bi-heart-fill');
                }
            } else {
                icon.classList.remove('bi-heart-fill');
                icon.classList.add('bi-heart');
                try {
                    await deleteDoc(quoteRef);
                } catch (err) {
                    console.error("Gagal menghapus love:", err);
                    loveBtn.classList.add('loved');
                    icon.classList.add('bi-heart-fill');
                    icon.classList.remove('bi-heart');
                }
            }
        }
    });
    loadLovedQuotes(user);
}

// --- Helper untuk Ruang Tenang ---

function getRandomQuotes(count) {
    const shuffled = [...ALL_QUOTES].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}
function displayDailyQuotes(quotes) {
    const container = document.getElementById('ruang-tenang-container');
    if (!container) return;
    container.innerHTML = '';
    quotes.forEach(quote => {
        const quoteHtml = `
            <div class="card card-quote mb-3" data-quote-id="${quote.id}">
                <div class="card-body">
                    <button class="btn btn-love"><i class="bi bi-heart"></i></button>
                    <h5 class="card-title">${quote.title}</h5>
                    <blockquote class="blockquote mb-0">
                        <p>${quote.text}</p>
                        ${quote.emoji ? `<footer>${quote.emoji}</footer>` : ''}
                    </blockquote>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', quoteHtml);
    });
}

async function loadDailyQuotes() {
    const today = new Date().toISOString().split('T')[0];
    const savedDate = localStorage.getItem('dailyQuotesDate');
    let quotes;
    if (savedDate === today) {
        console.log("Memuat kutipan hari ini dari cache.");
        quotes = JSON.parse(localStorage.getItem('dailyQuotes'));
    } else {
        console.log("Membuat kutipan baru untuk hari ini.");
        quotes = getRandomQuotes(4);
        localStorage.setItem('dailyQuotes', JSON.stringify(quotes));
        localStorage.setItem('dailyQuotesDate', today);
    }
    displayDailyQuotes(quotes);
}

async function loadLovedQuotes(user) {
    try {
        const lovedQuotesCol = collection(db, 'users', user.uid, 'loved_quotes');
        const querySnapshot = await getDocs(lovedQuotesCol);
        const lovedIds = new Set();
        querySnapshot.forEach((doc) => lovedIds.add(doc.id));
        const allQuoteCards = document.querySelectorAll('#page-ruang-tenang .card-quote');
        allQuoteCards.forEach(card => {
            const quoteId = card.getAttribute('data-quote-id');
            const loveBtn = card.querySelector('.btn-love');
            if (!loveBtn) return;
            const icon = loveBtn.querySelector('i');
            if (lovedIds.has(quoteId)) {
                loveBtn.classList.add('loved');
                icon.classList.remove('bi-heart');
                icon.classList.add('bi-heart-fill');
            } else {
                loveBtn.classList.remove('loved');
                icon.classList.remove('bi-heart-fill');
                icon.classList.add('bi-heart');
            }
        });
    } catch (e) {
        console.error("Gagal memuat 'loved quotes':", e);
    }
}