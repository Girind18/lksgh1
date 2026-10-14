// ========== APP.JS v3.0.0 ==========

let deferredPrompt = null;

// ========== INIT ==========
function initApp() {
  console.log('📱 App init...');

  const tgl = document.getElementById('glks-tanggal');
  if (tgl && !tgl.value) tgl.value = new Date().toISOString().split('T')[0];

  if (typeof initCore === 'function') initCore();

  const isWelcomed = localStorage.getItem('awb_gh1_welcomed_v1');
  console.log('📊 isWelcomed:', isWelcomed);

  if (isWelcomed === '1') {
    showApp();
    if (navigator.onLine) {
      try { syncWithGoogleSheet().catch(() => {}); } catch (e) {}
      setTimeout(() => { try { flushQueue().catch(() => {}); } catch (e) {} }, 2000);
    }
    if (typeof startAutoSync === 'function') startAutoSync();
  } else {
    showWelcome();
  }

  // Cek installable
  checkInstallable();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// ========== SERVICE WORKER ==========
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => {
        console.log('✅ SW terdaftar:', reg.scope);
        reg.update().catch(() => {});
        if (reg.waiting) reg.waiting.postMessage('SKIP_WAITING');
        reg.addEventListener('updatefound', () => {
          const nw = reg.installing;
          if (!nw) return;
          nw.addEventListener('statechange', () => {
            if (nw.state === 'installed' && navigator.serviceWorker.controller) {
              nw.postMessage('SKIP_WAITING');
            }
          });
        });
      })
      .catch(err => console.error('❌ SW gagal:', err));

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  });
}

// ========== ONLINE/OFFLINE ==========
window.addEventListener('online', () => {
  try { showToast('🌐 Online, sync...', 'success'); } catch (e) {}
  try { syncWithGoogleSheet().catch(() => {}); } catch (e) {}
  try { flushQueue().catch(() => {}); } catch (e) {}
});
window.addEventListener('offline', () => {
  try { showToast('📴 Offline', 'error'); } catch (e) {}
});
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && navigator.onLine) {
    try { flushQueue().catch(() => {}); } catch (e) {}
  }
});

// ========== INSTALL PROMPT ==========
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log('📱 Install prompt siap');
  showInstallButtons();
});

window.addEventListener('appinstalled', () => {
  console.log('✅ PWA installed');
  deferredPrompt = null;
  hideInstallButtons();
  try { showToast('✅ Aplikasi terinstall!', 'success'); } catch (e) {}
});

function checkInstallable() {
  // Kalau sudah standalone, sembunyikan tombol install
  if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
    hideInstallButtons();
    return;
  }
  // Kalau iOS, tampilkan hint
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (isIOS) {
    // Tombol install untuk iOS trigger manual hint
    setTimeout(() => showIOSHintButton(), 2000);
  }
}

function showInstallButtons() {
  // Header button
  const hdrBtn = document.getElementById('hdr-install-btn');
  if (hdrBtn) hdrBtn.classList.remove('hide');

  // Bottom banner
  if (document.getElementById('install-banner')) return;
  if (window.matchMedia('(display-mode: standalone)').matches) return;

  const banner = document.createElement('div');
  banner.id = 'install-banner';
  banner.innerHTML = `
    <div class="ib-text">📱 Install aplikasi untuk akses cepat</div>
    <button class="ib-btn" onclick="installPWA()">Install</button>
    <button class="ib-close" onclick="this.parentElement.remove()">✕</button>
  `;
  document.body.appendChild(banner);
}

function hideInstallButtons() {
  const hdrBtn = document.getElementById('hdr-install-btn');
  if (hdrBtn) hdrBtn.classList.add('hide');
  const banner = document.getElementById('install-banner');
  if (banner) banner.remove();
}

async function installPWA() {
  if (!deferredPrompt) {
    // iOS atau sudah pernah install
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isIOS) {
      showIOSHint();
    } else {
      showToast('Buka menu browser (⋮) → "Install app"', 'success');
    }
    return;
  }
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  console.log('User choice:', outcome);
  if (outcome === 'accepted') {
    try { showToast('✅ Install sedang berjalan...', 'success'); } catch (e) {}
  }
  deferredPrompt = null;
  hideInstallButtons();
}

// ========== iOS HINT ==========
function showIOSHintButton() {
  if (document.getElementById('install-banner')) return;
  const banner = document.createElement('div');
  banner.id = 'install-banner';
  banner.innerHTML = `
    <div class="ib-text">📱 Tambah ke Layar Utama iPhone</div>
    <button class="ib-btn" onclick="showIOSHint()">Cara</button>
    <button class="ib-close" onclick="this.parentElement.remove()">✕</button>
  `;
  document.body.appendChild(banner);
}

function showIOSHint() {
  if (document.getElementById('ios-hint')) return;
  const ov = document.createElement('div');
  ov.id = 'ios-hint';
  ov.innerHTML = `
    <div class="ih-card">
      <div style="font-size: 48px; margin-bottom: 8px;">📱</div>
      <h3>Install di iPhone</h3>
      <p>
        1. Ketuk ikon <b>Bagikan</b> 📤 di bawah Safari<br>
        2. Pilih <b>"Tambah ke Layar Utama"</b><br>
        3. Ketuk <b>"Tambah"</b>
      </p>
      <button onclick="document.getElementById('ios-hint').remove()">Mengerti</button>
    </div>
  `;
  document.body.appendChild(ov);
}

// ========== CHECK INSTALLABLE ==========
// Beberapa browser butuh waktu sebelum trigger beforeinstallprompt
setTimeout(() => {
  if (!deferredPrompt) {
    // Cek apakah manifest valid & SW terdaftar
    fetch('./manifest.json').then(r => r.json()).then(m => {
      console.log('📋 Manifest:', m.name, '| Icons:', m.icons.length);
    }).catch(e => console.warn('Manifest tidak bisa di-load:', e));
  }
}, 3000);

console.log('📱 App version: 3.0.0');
