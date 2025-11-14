const toast = document.getElementById('toast-notification');
const toastIcon = document.getElementById('toast-icon');
const toastMessage = document.getElementById('toast-message');
let toastTimeout;

// === FUNSI NOTIFIKASI ===
export function showNotification(message, type = 'success') {
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

// === HELPER JURNAL ===
export function getMoodIcon(mood) {
    switch (mood) {
        case 'Senang': return '<i class="bi bi-emoji-smile-fill"></i>';
        case 'Biasa': return '<i class="bi bi-emoji-neutral-fill"></i>';
        case 'Sedih': return '<i class="bi bi-emoji-frown-fill"></i>';
        case 'Marah': return '<i class="bi bi-emoji-angry-fill"></i>';
        default: return '<i class="bi bi-emoji-expressionless-fill"></i>';
    }
}

/**
 * Helper untuk mengubah objek Date menjadi string yang mudah dibaca.
 */
export function formatTanggal(dateObject) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return dateObject.toLocaleDateString('id-ID', options);
}