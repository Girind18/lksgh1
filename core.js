// ========== CORE.JS v3.0.0 ==========

// ⚠️ GANTI dengan URL Web App Apps Script Anda
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwIyQ6mUJOGR8Y51GVwXbZAhI_aiXFvol5y5iAiRQ3jjBuRadvLXjDlQJC1PZ0iiL3C/exec';

const APP_VERSION = '3.0.0';
const WELCOMED_KEY = 'awb_gh1_welcomed_v1';
const DATA_KEY = 'awb_gh1_data_v1';
const LKS_STORAGE_KEY = 'awb_gh1_lks_v1';
const DRAFT_KEY = 'awb_gh1_draft_v1';
const QUEUE_KEY = 'awb_gh1_queue_v1';
const SYNC_INTERVAL = 30000;

let syncTimer = null;
let isSyncing = false;
let lastSyncTime = null;
let draftTimer = null;
let kendalaPhotoData = null;
let kendalaPhotoName = null;

const KEGIATAN_UTAMA = [
  'GENERAL PRUNING',
  'PRUNING DAUN',
  'PRUNING TUNAS AIR, CUPAT DAN SULUR',
  'PRUNING BUNGA DAN BUAH'
];

const KEGIATAN_LAINNYA = [
  { key: 'SPRAYING CHEMICAL (PESTISIDA)', sub: 'spray_bay' },
  { key: 'SPRAYING FOLIAR', sub: 'spray_bay' },
  { key: 'PENGOCOORAN', sub: 'pengocoran' },
  { key: 'PERHITUNGAN POPULASI', sub: 'text' },
  { key: 'OPERASI SEMUT', sub: 'radio_selesai' },
  { key: 'SANITASI RUANG TRANSIT DAN STERIL', sub: 'radio_selesai' },
  { key: 'SANITASI GH', sub: 'radio_bay' },
  { key: 'SENSUS TANAMAN TERKENA HPT', sub: 'sensus' }
];

const ROW_OPTIONS = [];
for (let i = 0.5; i <= 9; i += 0.5) {
  ROW_OPTIONS.push({ value: String(i), label: String(i).replace('.', ',') + ' row' });
}

// ========== RENDER ==========
function renderKegiatanUtama() {
  const c = document.getElementById('glks-kegiatan-utama-container');
  if (!c) return;
  c.innerHTML = KEGIATAN_UTAMA.map((nama, i) => {
    const sid = 'ku-' + i;
    return `
      <div class="activity-block" id="block-${sid}">
        <label class="activity-head">
          <input type="checkbox" id="${sid}" data-kegiatan-utama="${nama}" onchange="toggleActivityBlock('${sid}')">
          ${nama}
        </label>
        <div class="activity-sub" id="sub-${sid}">
          <label>Jumlah ROW</label>
          <select data-row-utama="${nama}">
            <option value="">Pilih jumlah row...</option>
            ${ROW_OPTIONS.map(o => `<option value="${o.value}">${o.label}</option>`).join('')}
          </select>
        </div>
      </div>`;
  }).join('') + `
    <div class="activity-block" id="block-ku-lain">
      <label class="activity-head">
        <input type="checkbox" id="ku-lain" onchange="toggleActivityBlock('ku-lain')">
        Yang lain:
      </label>
      <div class="activity-sub" id="sub-ku-lain">
        <label>Nama Kegiatan</label>
        <input type="text" id="glks-kegiatan-utama-lainnya" placeholder="Sebutkan...">
        <label>Jumlah ROW</label>
        <select data-row-utama="__LAINNYA__">
          <option value="">Pilih jumlah row...</option>
          ${ROW_OPTIONS.map(o => `<option value="${o.value}">${o.label}</option>`).join('')}
        </select>
      </div>
    </div>`;
}

function renderKegiatanLainnya() {
  const c = document.getElementById('glks-kegiatan-lainnya-container');
  if (!c) return;
  let html = KEGIATAN_LAINNYA.map((item, i) => {
    const sid = 'kl-' + i;
    let sub = '';
    if (item.sub === 'spray_bay') {
      sub = `
        <label>Cakupan BAY</label>
        <div class="radio-group" style="margin-top:0.25rem">
          <label><input type="radio" name="radio-${sid}" value="BAY 1 - 5"> BAY 1 - 5</label>
          <label><input type="radio" name="radio-${sid}" value="BAY 6 - 10"> BAY 6 - 10</label>
        </div>
        <div class="spray-sub">
          <div class="spray-title">🧪 Detail Spray</div>
          <label>Bahan Aktif</label>
          <input type="text" data-spray-bahan="${item.key}" placeholder="Contoh: Abamectin">
          <label>Dosis</label>
          <input type="text" data-spray-dosis="${item.key}" placeholder="Contoh: 1 ml/L">
          <label>Pemakaian Air</label>
          <input type="text" data-spray-air="${item.key}" placeholder="Contoh: 200 L">
        </div>`;
    } else if (item.sub === 'pengocoran') {
      sub = `
        <div class="spray-sub">
          <div class="spray-title">💧 Detail Pengocoran</div>
          <label>Bahan Aktif</label>
          <input type="text" data-kocor-bahan="${item.key}" placeholder="Contoh: NPK 16-16-16">
          <label>Dosis</label>
          <input type="text" data-kocor-dosis="${item.key}" placeholder="Contoh: 5 gram/tanaman">
          <label>Pemakaian Air</label>
          <input type="text" data-kocor-air="${item.key}" placeholder="Contoh: 500 L">
          <label>Aplikasi Berapa ml</label>
          <input type="text" data-kocor-ml="${item.key}" placeholder="Contoh: 100 ml">
        </div>`;
    } else if (item.sub === 'text') {
      sub = `<label>Jumlah Populasi (Tulis Manual)</label>
             <textarea data-text-lainnya="${item.key}" rows="2" placeholder="Contoh: Zona 1: 1200 tanaman"></textarea>`;
    } else if (item.sub === 'radio_selesai') {
      sub = `<label>Status</label>
             <div class="radio-group" style="margin-top:0.25rem">
               <label><input type="radio" name="radio-${sid}" value="SELESAI"> SELESAI</label>
               <label><input type="radio" name="radio-${sid}" value="TIDAK SELESAI"> TIDAK SELESAI</label>
             </div>`;
    } else if (item.sub === 'radio_bay') {
      sub = `<label>Cakupan Sanitasi</label>
             <div class="radio-group" style="margin-top:0.25rem">
               <label><input type="radio" name="radio-${sid}" value="BAY 1 - 5"> BAY 1 - 5</label>
               <label><input type="radio" name="radio-${sid}" value="BAY 6 - 10"> BAY 6 - 10</label>
             </div>`;
    } else if (item.sub === 'sensus') {
      sub = `<label>Row Berapa</label>
             <input type="text" data-sensus-row="${item.key}" placeholder="Contoh: Row 1-5">
             <label>Jumlah Tanaman Terinfeksi</label>
             <input type="text" data-sensus-jumlah="${item.key}" placeholder="Contoh: 10 tanaman">`;
    }
    return `
      <div class="activity-block" id="block-${sid}">
        <label class="activity-head">
          <input type="checkbox" id="${sid}" data-kegiatan-lainnya="${item.key}" data-sub="${item.sub}" onchange="toggleActivityBlock('${sid}')">
          ${item.key}
        </label>
        <div class="activity-sub" id="sub-${sid}">${sub}</div>
      </div>`;
  }).join('');
  html += `
    <div class="activity-block" id="block-kl-lain">
      <label class="activity-head">
        <input type="checkbox" id="kl-lain" onchange="toggleActivityBlock('kl-lain')">
        Yang lain:
      </label>
      <div class="activity-sub" id="sub-kl-lain">
        <label>Nama Kegiatan</label>
        <input type="text" id="glks-kegiatan-lainnya-text" placeholder="Sebutkan...">
        <label>Jumlah ROW</label>
        <select data-row-lainnya="__LAINNYA__">
          <option value="">Pilih jumlah row...</option>
          ${ROW_OPTIONS.map(o => `<option value="${o.value}">${o.label}</option>`).join('')}
        </select>
      </div>
    </div>`;
  c.innerHTML = html;
}

function toggleActivityBlock(sid) {
  const cb = document.getElementById(sid);
  const block = document.getElementById('block-' + sid);
  const sub = document.getElementById('sub-' + sid);
  if (!cb || !sub) return;
  if (cb.checked) {
    sub.classList.add('show'); block.classList.add('active');
  } else {
    sub.classList.remove('show'); block.classList.remove('active');
    sub.querySelectorAll('input[type="text"], input[type="radio"], select, textarea').forEach(el => {
      if (el.type === 'radio') el.checked = false; else el.value = '';
    });
  }
  scheduleDraftSave();
}

// ========== WELCOME ==========
async function welcomeConnect() {
  const btn = document.getElementById('welcome-btn');
  btn.disabled = true;
  btn.innerHTML = '⏳ Menyambungkan...';
  try {
    localStorage.setItem(WELCOMED_KEY, '1');
    try { await syncWithGoogleSheet(true); } catch (e) { console.warn('Sync awal gagal:', e.message); }
    showApp();
    startAutoSync();
    showToast('✅ Berhasil tersambung!', 'success');
  } catch (err) {
    console.error('Koneksi gagal:', err);
    showApp();
    startAutoSync();
    showToast('⚠️ Mode Offline', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '🔗 Sambung &amp; Mulai';
  }
}

// ========== SYNC (via POST) ==========
async function syncWithGoogleSheet(isInitial = false) {
  if (!navigator.onLine) throw new Error('Offline');
  if (isSyncing) return;
  isSyncing = true;
  try {
    console.log('📡 Sync via POST...');
    const response = await fetch(SCRIPT_URL, {
      method: 'POST', mode: 'cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'getAll' }),
      redirect: 'follow'
    });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch (e) { throw new Error('Bukan JSON'); }
    localStorage.setItem(DATA_KEY, JSON.stringify(data));
    lastSyncTime = new Date();
    updateSyncStatus();
    console.log('✅ Sync selesai. Total:', data.count);
    return data;
  } finally { isSyncing = false; }
}

async function kirimLksKeSheet(payload) {
  if (!navigator.onLine) throw new Error('Offline');
  console.log('📤 POST payload...');
  const response = await fetch(SCRIPT_URL, {
    method: 'POST', mode: 'cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
    redirect: 'follow'
  });
  if (!response.ok) throw new Error('HTTP ' + response.status);
  const text = await response.text();
  let result;
  try { result = JSON.parse(text); } catch (e) { throw new Error('Bukan JSON'); }
  if (result.status !== 'success') throw new Error(result.message || 'Server menolak');
  console.log('✅ POST sukses:', result.message);
  return result;
}

function startAutoSync() {
  if (syncTimer) clearInterval(syncTimer);
  syncTimer = setInterval(async () => {
    if (document.hidden || !navigator.onLine) return;
    const q = getQueue();
    if (q.length > 0) await flushQueue();
  }, SYNC_INTERVAL);
  console.log('🔄 Auto-sync tiap', SYNC_INTERVAL / 1000, 'detik');
}

// ========== DRAFT ==========
function scheduleDraftSave() {
  if (draftTimer) clearTimeout(draftTimer);
  draftTimer = setTimeout(saveDraft, 1500);
}
function saveDraft() {
  try {
    const data = collectLksGH1Data();
    delete data.kendalaFotoData;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  } catch (e) {}
}
function loadDraft() {
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
    if (!d || !d.nama) return;
    if (d.email) document.getElementById('glks-email').value = d.email;
    if (d.tanggal) document.getElementById('glks-tanggal').value = d.tanggal;
    if (d.nama) document.getElementById('glks-nama').value = d.nama;
    if (d.deskripsiKendala) document.getElementById('glks-kendala').value = d.deskripsiKendala;
    if (d.temuanHPT) document.getElementById('glks-temuan').value = d.temuanHPT;
    if (d.panenHariIni) {
      const el = document.querySelector(`input[name="glks-panen"][value="${d.panenHariIni}"]`);
      if (el) el.checked = true;
    }
    if (d.panenLainnya) document.getElementById('glks-panen-lainnya').value = d.panenLainnya;
    if (d.grading) {
      const el = document.querySelector(`input[name="glks-grading"][value="${d.grading}"]`);
      if (el) el.checked = true;
    }
    console.log('📥 Draft restored');
  } catch (e) {}
}

// ========== QUEUE ==========
function getQueue() { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); }
function pushToQueue(payload) {
  const q = getQueue(); q.push(payload);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
  updateSyncStatus();
}
async function flushQueue() {
  const q = getQueue();
  if (q.length === 0 || isSyncing) return;
  console.log('🔄 Kirim queue:', q.length);
  const rem = [];
  for (const item of q) {
    try { await kirimLksKeSheet(item); } catch (err) { rem.push(item); }
  }
  localStorage.setItem(QUEUE_KEY, JSON.stringify(rem));
  updateSyncStatus();
  if (rem.length === 0) showToast('✅ Queue tersinkron!', 'success');
}
function updateSyncStatus() {
  const el = document.getElementById('sync-status');
  if (!el) return;
  const q = getQueue();
  if (q.length > 0) {
    el.textContent = `⏳ ${q.length} menunggu sync`;
    el.style.color = '#facc15';
  } else if (lastSyncTime) {
    const t = lastSyncTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    el.textContent = `✅ Tersinkron ${t}`;
    el.style.color = '#86efac';
  } else {
    el.textContent = '⚪ Belum sync';
    el.style.color = '#e5e7eb';
  }
}

// ========== SHOW/HIDE ==========
function showApp() {
  const ws = document.getElementById('welcome-screen');
  const hd = document.getElementById('app-header');
  const app = document.getElementById('app-container');
  if (ws) ws.classList.add('hide');
  if (hd) hd.classList.remove('hide');
  if (app) app.classList.remove('hide');
}
function showWelcome() {
  const ws = document.getElementById('welcome-screen');
  const hd = document.getElementById('app-header');
  const app = document.getElementById('app-container');
  if (ws) ws.classList.remove('hide');
  if (hd) hd.classList.add('hide');
  if (app) app.classList.add('hide');
}

// ========== TOAST ==========
function showToast(msg, type = 'success') {
  const ex = document.querySelector('.toast');
  if (ex) ex.remove();
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// ========== ID ==========
function generateId() {
  return String(Date.now()) + String(Math.floor(Math.random() * 1000)).padStart(3, '0');
}

// ========== TOGGLE PANEN ==========
function toggleConditionalInputs() {
  const cb = document.querySelector('input[name="glks-panen"][value="Yang lain:"]');
  const inp = document.getElementById('glks-panen-lainnya');
  if (cb && inp) {
    inp.style.display = cb.checked ? 'block' : 'none';
    if (!cb.checked) inp.value = '';
  }
  scheduleDraftSave();
}

// ========== FOTO ==========
function initFotoUpload() {
  const fi = document.getElementById('glks-kendala-foto');
  if (!fi) return;
  fi.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) {
      kendalaPhotoData = null; kendalaPhotoName = null;
      document.getElementById('foto-preview').innerHTML = '';
      return;
    }
    kendalaPhotoName = file.name;
    if (file.size > 3 * 1024 * 1024) {
      showToast('⚠️ Ukuran foto maks 3MB', 'error');
      fi.value = ''; return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      kendalaPhotoData = ev.target.result;
      document.getElementById('foto-preview').innerHTML = `<img src="${kendalaPhotoData}" alt="Preview">`;
    };
    reader.readAsDataURL(file);
  });
}

// ========== COLLECT ==========
function collectLksGH1Data() {
  const getR = (n) => { const el = document.querySelector(`input[name="${n}"]:checked`); return el ? el.value : ''; };

  const kegiatanUtama = [];
  document.querySelectorAll('#glks-kegiatan-utama-container .activity-block').forEach(b => {
    const cb = b.querySelector('input[type="checkbox"]');
    if (!cb || !cb.checked) return;
    const namaAttr = cb.getAttribute('data-kegiatan-utama');
    let nama = namaAttr, row = '';
    if (namaAttr) {
      const s = b.querySelector(`select[data-row-utama="${namaAttr}"]`);
      row = s ? s.value : '';
    } else {
      const ni = b.querySelector('#glks-kegiatan-utama-lainnya');
      nama = ni ? ni.value : '';
      const s = b.querySelector(`select[data-row-utama="__LAINNYA__"]`);
      row = s ? s.value : '';
    }
    if (nama) kegiatanUtama.push({ kegiatan: nama, row: row });
  });

  const kegiatanLainnya = [];
  document.querySelectorAll('#glks-kegiatan-lainnya-container .activity-block').forEach(b => {
    const cb = b.querySelector('input[type="checkbox"]');
    if (!cb || !cb.checked) return;
    const key = cb.getAttribute('data-kegiatan-lainnya');
    const sub = cb.getAttribute('data-sub');
    const r = { kegiatan: '', sub: sub || '' };
    if (key) {
      r.kegiatan = key;
      if (sub === 'spray_bay') {
        const rd = b.querySelector('input[type="radio"]:checked');
        const b1 = b.querySelector(`input[data-spray-bahan="${key}"]`);
        const d1 = b.querySelector(`input[data-spray-dosis="${key}"]`);
        const a1 = b.querySelector(`input[data-spray-air="${key}"]`);
        r.status = rd ? rd.value : '';
        r.bahanAktif = b1 ? b1.value : '';
        r.dosis = d1 ? d1.value : '';
        r.air = a1 ? a1.value : '';
      } else if (sub === 'pengocoran') {
        const b1 = b.querySelector(`input[data-kocor-bahan="${key}"]`);
        const d1 = b.querySelector(`input[data-kocor-dosis="${key}"]`);
        const a1 = b.querySelector(`input[data-kocor-air="${key}"]`);
        const ml = b.querySelector(`input[data-kocor-ml="${key}"]`);
        r.bahanAktif = b1 ? b1.value : '';
        r.dosis = d1 ? d1.value : '';
        r.air = a1 ? a1.value : '';
        r.aplikasiMl = ml ? ml.value : '';
      } else if (sub === 'text') {
        const tx = b.querySelector(`textarea[data-text-lainnya="${key}"]`);
        r.text = tx ? tx.value : '';
      } else if (sub === 'radio_selesai' || sub === 'radio_bay') {
        const rd = b.querySelector('input[type="radio"]:checked');
        r.status = rd ? rd.value : '';
      } else if (sub === 'sensus') {
        const ri = b.querySelector(`input[data-sensus-row="${key}"]`);
        const ji = b.querySelector(`input[data-sensus-jumlah="${key}"]`);
        r.row = ri ? ri.value : '';
        r.jumlahTanaman = ji ? ji.value : '';
      }
    } else {
      const ni = b.querySelector('#glks-kegiatan-lainnya-text');
      r.kegiatan = ni ? ni.value : '';
      const s = b.querySelector(`select[data-row-lainnya="__LAINNYA__"]`);
      r.row = s ? s.value : '';
      r.sub = 'row';
    }
    if (r.kegiatan) kegiatanLainnya.push(r);
  });

  return {
    id: window.currentEditId || generateId(),
    timestamp: new Date().toISOString(),
    lokasi: 'GH 1',
    email: document.getElementById('glks-email').value.trim(),
    tanggal: document.getElementById('glks-tanggal').value,
    nama: document.getElementById('glks-nama').value,
    panenHariIni: getR('glks-panen'),
    panenLainnya: document.getElementById('glks-panen-lainnya').value,
    grading: getR('glks-grading'),
    kegiatanUtama: kegiatanUtama,
    kegiatanLainnya: kegiatanLainnya,
    deskripsiKendala: document.getElementById('glks-kendala').value,
    kendalaFotoName: kendalaPhotoName || '',
    kendalaFotoData: kendalaPhotoData || '',
    temuanHPT: document.getElementById('glks-temuan').value
  };
}

// ========== SIMPAN ==========
async function simpanDataLksGH1() {
  const data = collectLksGH1Data();
  if (!data.email) { showToast('Email wajib diisi!', 'error'); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    showToast('Format email tidak valid!', 'error'); return;
  }
  if (!data.tanggal || !data.nama) {
    showToast('Tanggal dan Nama wajib diisi!', 'error'); return;
  }

  let db = JSON.parse(localStorage.getItem(LKS_STORAGE_KEY) || '[]');
  const dataLocal = { ...data };
  delete dataLocal.kendalaFotoData;
  db.push(dataLocal);
  localStorage.setItem(LKS_STORAGE_KEY, JSON.stringify(db));
  localStorage.removeItem(DRAFT_KEY);
  showToast('⏳ Menyimpan...', 'success');

  try {
    await kirimLksKeSheet(data);
    showToast('✅ Berhasil disimpan & disinkronkan!', 'success');
    resetFormLksGH1();
    await syncWithGoogleSheet();
  } catch (error) {
    console.error('❌ Error:', error);
    pushToQueue(data);
    showToast('⚠️ Masuk queue, akan dicoba lagi.', 'error');
  }
}

// ========== RESET ==========
function resetFormLksGH1() {
  const f = document.getElementById('form-lks-gh1');
  if (f) f.reset();
  document.getElementById('glks-tanggal').value = new Date().toISOString().split('T')[0];
  document.querySelectorAll('.activity-block').forEach(b => {
    b.classList.remove('active');
    const s = b.querySelector('.activity-sub');
    if (s) s.classList.remove('show');
  });
  kendalaPhotoData = null; kendalaPhotoName = null;
  window.currentEditId = null;
  document.getElementById('foto-preview').innerHTML = '';
  localStorage.removeItem(DRAFT_KEY);
  toggleConditionalInputs();
}

function bindAutoSave() {
  const f = document.getElementById('form-lks-gh1');
  if (!f) return;
  f.addEventListener('input', scheduleDraftSave);
  f.addEventListener('change', scheduleDraftSave);
}

function initCore() {
  console.log('🔧 Init core...');
  renderKegiatanUtama();
  renderKegiatanLainnya();
  initFotoUpload();
  bindAutoSave();
  setTimeout(loadDraft, 500);
}
