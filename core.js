// ========== CORE.JS ==========

// 1. TANAM LINK DEPLOY DI SINI
// Ganti URL di bawah ini dengan URL Web App dari Google Apps Script Anda
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbYOUR_SCRIPT_ID_HERE/exec';

// 2. KONFIGURASI STORAGE
const WELCOMED_KEY = 'awb_gh1_welcomed_v1';
const DATA_KEY = 'awb_gh1_data_v1';
const LKS_STORAGE_KEY = 'awb_gh1_lks_v1';

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

// 4. FUNGSI SINKRONISASI KE GOOGLE SHEETS
async function syncWithGoogleSheet(isInitial = false) {
  if (!navigator.onLine) throw new Error('Tidak ada koneksi internet');

  const response = await fetch(SCRIPT_URL, {
    method: 'GET',
    headers: { 'Accept': 'application/json' }
  });

  if (!response.ok) throw new Error('Response server tidak OK');

  const data = await response.json();
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
  console.log('Data berhasil disinkronkan:', data);
  return data;
}

// 5. FUNGSI MENGIRIM DATA LKS KE GOOGLE SHEETS
async function kirimLksKeSheet(payload) {
  if (!navigator.onLine) throw new Error('Offline');
  const response = await fetch(SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payload)
  });
  return true;
}

// 6. FUNGSI MENAMPILKAN APLIKASI
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

// 7. FUNGSI TOAST NOTIFIKASI
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

// 8. GENERATE ID UNIK
function generateId() {
  return String(Date.now()) + String(Math.floor(Math.random() * 1000)).padStart(3, '0');
}

// 9. LOGIKA KONDISIONAL (Toggle Input "Yang Lain")
function toggleConditionalInputs() {
  // Panen Lainnya
  const panenLainnya = document.querySelector('input[name="glks-panen"][value="Yang lain:"]');
  const panenInput = document.getElementById('glks-panen-lainnya');
  if (panenLainnya && panenInput) {
    panenInput.style.display = panenLainnya.checked ? 'block' : 'none';
    if (!panenLainnya.checked) panenInput.value = '';
  }

  // Kegiatan Utama Lainnya
  const kegUtamaLainnya = document.querySelector('input[name="glks-kegiatan-utama"][value="Yang lain:"]');
  const kegUtamaInput = document.getElementById('glks-kegiatan-utama-lainnya');
  if (kegUtamaLainnya && kegUtamaInput) {
    kegUtamaInput.style.display = kegUtamaLainnya.checked ? 'block' : 'none';
    if (!kegUtamaLainnya.checked) kegUtamaInput.value = '';
  }

  // Kegiatan Lainnya (Bagian 13)
  const kegLainnya = document.querySelector('input[name="glks-kegiatan-lainnya"][value="Yang lain:"]');
  const kegLainnyaInput = document.getElementById('glks-kegiatan-lainnya-text');
  if (kegLainnya && kegLainnyaInput) {
    kegLainnyaInput.style.display = kegLainnya.checked ? 'block' : 'none';
    if (!kegLainnya.checked) kegLainnyaInput.value = '';
  }
}

// 10. KUMPULKAN DATA FORM
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

// 11. SIMPAN DATA LKS GH 1
async function simpanDataLksGH1() {
  const data = collectLksGH1Data();

  if (!data.tanggal || !data.nama) {
    showToast('Tanggal dan Nama wajib diisi!', 'error');
    return;
  }

  // Simpan ke LocalStorage
  let db = JSON.parse(localStorage.getItem(LKS_STORAGE_KEY) || '[]');
  db.push(data);
  localStorage.setItem(LKS_STORAGE_KEY, JSON.stringify(db));

  showToast('⏳ Menyimpan ke server...', 'success');

  // Kirim ke Google Sheets
  try {
    await kirimLksKeSheet(data);
    showToast('✅ LKS GH 1 berhasil disimpan & disinkronkan!', 'success');
    resetFormLksGH1();
  } catch (error) {
    console.error('Sync error:', error);
    showToast('⚠️ Tersimpan lokal. Gagal sync ke server.', 'error');
  }
}

// 12. RESET FORM
function resetFormLksGH1() {
  const form = document.getElementById('form-lks-gh1');
  if (form) form.reset();
  document.getElementById('glks-tanggal').value = new Date().toISOString().split('T')[0];
  toggleConditionalInputs();
}
