// ========== APP.JS ==========

let deferredPrompt = null;

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

    if (navigator.onLine) {
      syncWithGoogleSheet().catch(err => console.log('Auto-sync gagal:', err));
      setTimeout(() => flushQueue().catch(() => {}), 2000);
    }
    if (typeof startAutoSync === 'function') startAutoSync();
  } else {
    document.getElementById('welcome-screen').classList.remove('hide');
  }

  // ===== Service Worker dengan Auto-Update =====
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => {
        console.log('✅ SW terdaftar:', reg.scope);

        // Cek update setiap kali buka
        reg.update().catch(err => console.warn('SW update error:', err));

        // Kalau ada SW baru menunggu, aktifkan
        if (reg.waiting) {
          console.log('⚡ SW baru menunggu, aktifkan...');
          reg.waiting.postMessage('SKIP_WAITING');
        }

        // Listener untuk SW baru
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🔄 Update tersedia, reload...');
              newWorker.postMessage('SKIP_WAITING');
            }
          });
        });
      })
      .catch(err => console.error('❌ SW gagal:', err));

    // Reload halaman saat SW baru aktif
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      console.log('🔄 Controller berubah, reload halaman...');
      window.location.reload();
    });
  }

  // ===== Online/Offline =====
  window.addEventListener('online', () => {
    showToast('🌐 Kembali online, menyinkronkan...', 'success');
    syncWithGoogleSheet().catch(() => {});
    flushQueue().catch(() => {});
  });

  window.addEventListener('offline', () => {
    showToast('📴 Mode offline, data disimpan lokal', 'error');
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && navigator.onLine) {
      flushQueue().catch(() => {});
    }
  });

  // ===== Install Prompt =====
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('📱 Install prompt siap');
    showInstallButton();
  });

  window.addEventListener('appinstalled', () => {
    console.log('✅ PWA installed');
    deferredPrompt = null;
    hideInstallButton();
    showToast('✅ Aplikasi berhasil di-install!', 'success');
  });

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = window.navigator.standalone === true;
  if (isIOS && !isStandalone && isWelcomed === '1') {
    setTimeout(showIOSInstallHint, 3000);
  }

  // ===== Cek versi & tampilkan info =====
  const appVersion = 'v2.5.0';
  console.log('📱 App version:', appVersion);
});

// ========== INSTALL BUTTON ==========
function showInstallButton() {
  if (document.getElementById('install-btn')) return;
  const btn = document.createElement('button');
  btn.id = 'install-btn';
  btn.innerHTML = '⬇️ Install Aplikasi';
  btn.style.cssText = `
    position: fixed; bottom: 20px; right: 20px;
    background: linear-gradient(135deg, #2d5016 0%, #5a8f3a 100%);
    color: white; border: none; border-radius: 30px;
    padding: 12px 20px; font-size: 0.9rem; font-weight: 700;
    cursor: pointer; box-shadow: 0 4px 16px rgba(45,80,22,0.4);
    z-index: 9999; display: flex; align-items: center; gap: 6px;
  `;
  btn.onclick = installPWA;
  document.body.appendChild(btn);
}

function hideInstallButton() {
  const btn = document.getElementById('install-btn');
  if (btn) btn.remove();
}

async function installPWA() {
  if (!deferredPrompt) {
    showToast('Install tidak tersedia. Coba lewat menu browser.', 'error');
    return;
  }
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  console.log('User choice:', outcome);
  if (outcome === 'accepted') {
    showToast('✅ Aplikasi sedang di-install...', 'success');
  }
  deferredPrompt = null;
  hideInstallButton();
}

// ========== iOS HINT ==========
function showIOSInstallHint() {
  if (document.getElementById('ios-hint')) return;
  const overlay = document.createElement('div');
  overlay.id = 'ios-hint';
  overlay.style.cssText = `
    position: fixed; inset: 0; background: rgba(0,0,0,0.7);
    z-index: 10000; display: flex; align-items: flex-end;
    justify-content: center; padding: 20px;
  `;
  overlay.innerHTML = `
    <div style="background: white; border-radius: 20px; padding: 24px;
                max-width: 380px; width: 100%; text-align: center;">
      <div style="font-size: 48px; margin-bottom: 8px;">📱</div>
      <h3 style="color: #2d5016; margin-bottom: 12px; font-size: 1.2rem;">Install di iPhone</h3>
      <p style="color: #666; font-size: 0.9rem; line-height: 1.6; margin-bottom: 20px;">
        1. Ketuk ikon <b>Bagikan</b> 📤 di bawah Safari<br>
        2. Pilih <b>"Tambah ke Layar Utama"</b><br>
        3. Ketuk <b>"Tambah"</b>
      </p>
      <button onclick="document.getElementById('ios-hint').remove()" style="
        width: 100%; padding: 12px; background: #2d5016; color: white;
        border: none; border-radius: 10px; font-size: 1rem;
        font-weight: 700; cursor: pointer;">Mengerti</button>
    </div>
  `;
  document.body.appendChild(overlay);
}
