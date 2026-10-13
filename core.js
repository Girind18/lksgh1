// ========== CORE.JS ==========

// 1. TANAM LINK DEPLOY DI SINI
// ⚠️ WAJIB GANTI dengan URL Web App dari Google Apps Script Anda
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwCJNxoKQQO2BRbwlAgd4XAK7STkM4WvcTICaHNjpJsG0qU5o9_NaSDb_tbTwDcSVlO/exec';

// 2. KONFIGURASI STORAGE
const WELCOMED_KEY = 'awb_gh1_welcomed_v1';
const DATA_KEY = 'awb_gh1_data_v1';
const LKS_STORAGE_KEY = 'awb_gh1_lks_v1';
const QUEUE_KEY = 'awb_gh1_queue_v1';

// 3. FUNGSI WELCOME CONNECT
async function welcomeConnect() {
  const btn = document.getElementById('welcome-btn');
  btn.disabled = true;
  btn.innerHTML = '⏳ Menyambungkan...';

  try {
    localStorage.setItem(WELCOMED_KEY, '1');
    await syncWithGoogleSheet(true);
    showApp();
    showToast('✅ Berhasil tersambung ke Google Sheets!', 'success');
  } catch (error) {
    console.error('Koneksi gagal:', error);
    showApp();
    showToast('⚠️ Mode Offline: Data disimpan lokal.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '🔗 Sambung &amp; Mulai';
  }
}

// 4. FUNGSI SINKRONISASI (GET — ambil data dari Sheet)
async function syncWithGoogleSheet(isInitial = false) {
  if (!navigator.onLine) throw new Error('Tidak ada koneksi internet');

  console.log('📡 GET dari:', SCRIPT_URL);

  const response = await fetch(SCRIPT_URL + '?t=' + Date.now(), {
    method: 'GET',
    redirect: 'follow'
  });

  console.log('📡 Status:', response.status);

  if (!response.ok) throw new Error('HTTP ' + response.status);

  const text = await response.text();
  console.log('📡 Response:', text.substring(0, 300));

  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error('Response bukan JSON: ' + text.substring(0, 200));
  }

  localStorage.setItem(DATA_KEY, JSON.stringify(data));
  return data;
}

// 5. FUNGSI KIRIM DATA LKS KE SHEET (POST — FIXED)
async function kirimLksKeSheet(payload) {
  if (!navigator.onLine) throw new Error('Tidak ada koneksi internet');

  console.log('📤 POST ke:', SCRIPT_URL);
  console.log('📦 Payload:', payload);

  const response = await fetch(SCRIPT_URL, {
    method: 'POST',
    mode: 'cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
    redirect: 'follow'
  });

  console.log('📥 Status:', response.status);

  if (!response.ok) {
    throw new Error('HTTP ' + response.status);
  }

  const text = await response.text();
  console.log('📥 Response body:', text);

  let result;
  try {
    result = JSON.parse(text);
  } catch (e) {
    throw new Error('Response bukan JSON: ' + text.substring(0, 200));
  }

  if (result.status !== 'success') {
    throw new Error(result.message || 'Server menolak data');
  }

  console.log('✅ Berhasil disimpan ke Sheet');
  return result;
}

// 6. FUNGSI QUEUE — simpan payload jika gagal kirim
function pushToQueue(payload) {
  const q = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  q.push(payload);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}

async function flushQueue() {
  const q = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  if (q.length === 0) return;

  console.log('🔄 Mengirim ' + q.length + ' data dari queue...');
  const remaining = [];

  for (const item of q) {
    try {
      await kirimLksKeSheet(item);
    } catch (err) {
      console.warn('Gagal kirim queue item:', err);
      remaining.push(item);
    }
  }

  localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  if (remaining.length === 0) {
    showToast('✅ Semua data queue berhasil tersinkron!', 'success');
  }
}

// 7. FUNGSI MENAMPILKAN APLIKASI
function showApp() {
  const welcomeScreen = document.getElementById('welcome-screen');
  const appHeader = document.getElementById('app-header');
  const appContainer = document.getElementById('app-container');

  welcomeScreen.style.opacity = '0';
  setTimeout(() => {
    welcomeScreen.classList.add('hide');
    appHeader.classList.remove('app-container-hidden');
    appContainer.classList.remove('app-container-hidden');
  }, 300);
}

// 8. FUNGSI TOAST
function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// 9. GENERATE ID UNIK
function generateId() {
  return String(Date.now()) + String(Math.floor(Math.random() * 1000)).padStart(3, '0');
}

// 10. TOGGLE INPUT KONDISIONAL ("Yang Lain")
function toggleConditionalInputs() {
  const panenLainnya = document.querySelector('input[name="glks-panen"][value="Yang lain:"]');
  const panenInput = document.getElementById('glks-panen-lainnya');
  if (panenLainnya && panenInput) {
    panenInput.style.display = panenLainnya.checked ? 'block' : 'none';
    if (!panenLainnya.checked) panenInput.value = '';
  }

  const kegUtamaLainnya = document.querySelector('input[name="glks-kegiatan-utama"][value="Yang lain:"]');
  const kegUtamaInput = document.getElementById('glks-kegiatan-utama-lainnya');
  if (kegUtamaLainnya && kegUtamaInput) {
    kegUtamaInput.style.display = kegUtamaLainnya.checked ? 'block' : 'none';
    if (!kegUtamaLainnya.checked) kegUtamaInput.value = '';
  }

  const kegLainnya = document.querySelector('input[name="glks-kegiatan-lainnya"][value="Yang lain:"]');
  const kegLainnyaInput = document.getElementById('glks-kegiatan-lainnya-text');
  if (kegLainnya && kegLainnyaInput) {
    kegLainnyaInput.style.display = kegLainnya.checked ? 'block' : 'none';
    if (!kegLainnya.checked) kegLainnyaInput.value = '';
  }
}

// 11. KUMPULKAN DATA FORM
function collectLksGH1Data() {
  const getCheckedValues = (name) => {
    return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`))
      .map(cb => cb.value)
      .filter(v => v !== 'Yang lain:')
      .join(', ');
  };

  const getRadioValue = (name) => {
    const el = document.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : '';
  };

  return {
    id: generateId(),
    timestamp: new Date().toISOString(),
    lokasi: 'GH 1',
    tanggal: document.getElementById('glks-tanggal').value,
    nama: document.getElementById('glks-nama').value,
    panenHariIni: getRadioValue('glks-panen'),
    panenLainnya: document.getElementById('glks-panen-lainnya').value,
    grading: getRadioValue('glks-grading'),
    jenisKegiatanUtama: getCheckedValues('glks-kegiatan-utama'),
    kegiatanUtamaLainnya: document.getElementById('glks-kegiatan-utama-lainnya').value,
    hasilKerjaUtama: document.getElementById('glks-hasil-utama').value,
    hasilKerjaLainnya: document.getElementById('glks-hasil-lainnya').value,
    sprayChemical: getCheckedValues('glks-spray'),
    perhitunganPopulasi: document.getElementById('glks-populasi').value,
    operasiSemut: getRadioValue('glks-semut'),
    sanitasiTransit: getRadioValue('glks-sanitasi-transit'),
    sanitasiGH: getRadioValue('glks-sanitasi-gh'),
    sensusTanaman: document.getElementById('glks-sensus').value,
    kegiatanLainnya: getCheckedValues('glks-kegiatan-lainnya'),
    kegiatanLainnyaText: document.getElementById('glks-kegiatan-lainnya-text').value,
    deskripsiKendala: document.getElementById('glks-kendala').value,
    temuanHPT: document.getElementById('glks-temuan').value
  };
}

// 12. SIMPAN DATA LKS GH 1
async function simpanDataLksGH1() {
  const data = collectLksGH1Data();

  if (!data.tanggal || !data.nama) {
    showToast('Tanggal dan Nama wajib diisi!', 'error');
    return;
  }

  // Simpan ke LocalStorage dulu (agar tidak hilang)
  let db = JSON.parse(localStorage.getItem(LKS_STORAGE_KEY) || '[]');
  db.push(data);
  localStorage.setItem(LKS_STORAGE_KEY, JSON.stringify(db));

  showToast('⏳ Menyimpan ke server...', 'success');

  try {
    await kirimLksKeSheet(data);
    showToast('✅ LKS GH 1 berhasil disimpan & disinkronkan!', 'success');
    resetFormLksGH1();
  } catch (error) {
    console.error('❌ Sync error:', error);
    // Simpan ke queue untuk dicoba ulang nanti
    pushToQueue(data);
    showToast('⚠️ Gagal sync: ' + error.message, 'error');
  }
}

// 13. RESET FORM
function resetFormLksGH1() {
  const form = document.getElementById('form-lks-gh1');
  if (form) form.reset();
  document.getElementById('glks-tanggal').value = new Date().toISOString().split('T')[0];
  toggleConditionalInputs();
}
