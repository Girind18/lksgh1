// ========== APP.JS ==========

document.addEventListener('DOMContentLoaded', () => {
  const tglInput = document.getElementById('glks-tanggal');
  if (tglInput && !tglInput.value) {
    tglInput.value = new Date().toISOString().split('T')[0];
  }

  const isWelcomed = localStorage.getItem('awb_gh1_welcomed_v1');

  if (isWelcomed === '1') {
    document.getElementById('welcome-screen').classList.add('hide');
    document.getElementById('app-header').classList.remove('app-container-hidden');
    document.getElementById('app-container').classList.remove('app-container-hidden');

    // Auto-sync pertama kali
    if (navigator.onLine) {
      syncWithGoogleSheet().catch(err => console.log('Auto-sync gagal:', err));
      setTimeout(() => flushQueue().catch(() => {}), 2000);
    }
    startAutoSync();
  } else {
    document.getElementById('welcome-screen').classList.remove('hide');
  }

  // Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('✅ SW terdaftar:', reg.scope))
      .catch(err => console.error('❌ SW gagal:', err));
  }

  // ====== LISTENER ONLINE/OFFLINE ======
  window.addEventListener('online', () => {
    showToast('🌐 Kembali online, menyinkronkan...', 'success');
    syncWithGoogleSheet().catch(() => {});
    flushQueue().catch(() => {});
  });

  window.addEventListener('offline', () => {
    showToast('📴 Mode offline, data disimpan lokal', 'error');
  });

  // ====== AUTO-SYNC SAAT TAB AKTIF KEMBALI ======
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && navigator.onLine) {
      console.log('👁️ Tab aktif kembali, cek queue...');
      flushQueue().catch(() => {});
    }
  });

  // ====== SYNC SEBELUM TAB DITUTUP ======
  window.addEventListener('beforeunload', () => {
    // Coba flush queue terakhir kali
    if (navigator.onLine) {
      const q = getQueue();
      if (q.length > 0) {
        navigator.sendBeacon(SCRIPT_URL, JSON.stringify(q[0]));
      }
    }
  });
});
