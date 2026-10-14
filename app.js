// ========== APP.JS v2.5.0 ==========

let deferredPrompt = null;

// ========== INIT FUNCTION ==========
function initApp() {
  console.log('📱 App init...');

  // Set tanggal default
  const tglInput = document.getElementById('glks-tanggal');
  if (tglInput && !tglInput.value) {
    tglInput.value = new Date().toISOString().split('T')[0];
  }

  // Render kegiatan
  if (typeof initCore === 'function') {
    initCore();
  }

  // Cek state welcome
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
}

// ========== RUN ON DOM READY ==========
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// ========== SERVICE WORKER ==========
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .then(reg => {
      console.log('✅ SW terdaftar:', reg.scope);

      reg.update().catch(err => console.warn('SW update error:', err));

      if (reg.waiting) {
        reg.waiting.postMessage('SKIP_WAITING');
      }

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            newWorker.postMessage('SKIP_WAITING');
          }
        });
      });
    })
    .catch(err => console.error('❌ SW gagal:', err));

  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    console.log('🔄 Reload untuk update...');
    window.location.reload();
  });
}

// ========== ONLINE / OFFLINE ==========
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
  showInstallButton();
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  hideInstallButton();
  try { showToast('✅ Aplikasi terinstall!', 'success'); } catch (e) {}
});

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
    z-index: 9999;
  `;
  btn.onclick = installPWA;
  document.body.appendChild(btn);
}

function hideInstallButton() {
  const btn = document.getElementById('install-btn');
  if (btn) btn.remove();
}

async function installPWA() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted') {
    try { showToast('✅ Install sedang berjalan...', 'success'); } catch (e) {}
  }
  deferredPrompt = null;
  hideInstallButton();
}

// ========== iOS HINT ==========
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = window.navigator.standalone === true;
if (isIOS && !isStandalone) {
  setTimeout(() => {
    if (localStorage.getItem('awb_gh1_welcomed_v1') === '1') {
      showIOSInstallHint();
    }
  }, 5000);
}

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
      <h3 style="color: #2d5016; margin-bottom: 12px;">Install di iPhone</h3>
      <p style="color: #666; font-size: 0.9rem; line-height: 1.6; margin-bottom: 20px;">
        1. Ketuk ikon <b>Bagikan</b> 📤<br>
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

console.log('📱 App version: 2.5.0');
