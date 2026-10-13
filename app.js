// ========== APP.JS ==========

document.addEventListener('DOMContentLoaded', () => {
  // Set tanggal hari ini secara default
  const tglInput = document.getElementById('glks-tanggal');
  if (tglInput) {
    tglInput.value = new Date().toISOString().split('T')[0];
  }

  // Cek apakah user sudah pernah welcome sebelumnya
  const isWelcomed = localStorage.getItem('awb_gh1_welcomed_v1');

  if (isWelcomed === '1') {
    // Langsung tampilkan aplikasi
    document.getElementById('welcome-screen').classList.add('hide');
    document.getElementById('app-header').classList.remove('app-container-hidden');
    document.getElementById('app-container').classList.remove('app-container-hidden');

    // Sync di background
    if (navigator.onLine) {
      syncWithGoogleSheet().catch(err => console.log('Auto-sync gagal:', err));
    }
  } else {
    document.getElementById('welcome-screen').classList.remove('hide');
  }

  // Registrasi Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker terdaftar:', reg.scope))
      .catch(err => console.error('Service Worker gagal:', err));
  }

  // Listener Online/Offline
  window.addEventListener('online', () => {
    showToast('Kembali online, menyinkronkan...', 'success');
    syncWithGoogleSheet().catch(() => {});
  });
  window.addEventListener('offline', () => {
    showToast('Mode offline, data disimpan lokal', 'error');
  });
});
