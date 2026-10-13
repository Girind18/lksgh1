// ========== CORE.JS ==========

// ⚠️ WAJIB GANTI dengan URL Web App Apps Script Anda
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbYOUR_SCRIPT_ID_HERE/exec';

// ========== KONFIGURASI ==========
const WELCOMED_KEY = 'awb_gh1_welcomed_v1';
const DATA_KEY = 'awb_gh1_data_v1';
const LKS_STORAGE_KEY = 'awb_gh1_lks_v1';
const QUEUE_KEY = 'awb_gh1_queue_v1';

// ========== MASTER KEGIATAN ==========
// Bagian 4: Jenis Kegiatan Utama
const KEGIATAN_UTAMA = [
  'GENERAL PRUNING',
  'PRUNING DAUN',
  'PRUNING SULUR',
  'PRUNING TUNAS AIR DAN CUKUP',
  'PRUNING BUNGA DAN BUAH'
];

// Bagian 13: Kegiatan Lainnya
const KEGIATAN_LAINNYA = [
  { key: 'SPRAYING CHEMICAL (PESTISIDA)', spray: true },
  { key: 'SPRAYING FOLIAR', spray: true },
  { key: 'SPRAYING CHEMICAL & SPRAYING FOLIAR', spray: true },
  { key: 'PENGOCOORAN', spray: false },
  { key: 'PERHITUNGAN POPULASI', spray: false },
  { key: 'OPERASI SEMUT', spray: false },
  { key: 'SANITASI RUANG TRANSIT DAN STERIL', spray: false },
  { key: 'SANITASI GH', spray: false },
  { key: 'SENSUS TANAMAN TERKENA HPT', spray: false }
];

// Opsi jumlah ROW
const ROW_OPTIONS = [];
for (let i = 0.5; i <= 9; i += 0.5) {
  const label = String(i).replace('.', ',') + ' row';
  ROW_OPTIONS.push({ value: String(i), label: label });
}

// ========== RENDER DINAMIS KEGIATAN ==========
function renderKegiatanUtama() {
  const container = document.getElementById('glks-kegiatan-utama-container');
  if (!container) return;

  container.innerHTML = KEGIATAN_UTAMA.map((nama, idx) => {
    const safeId = 'ku-' + idx;
    return `
      <div class="activity-block" id="block-${safeId}">
        <label class="activity-head">
          <input type="checkbox" id="${safeId}" data-kegiatan-utama="${nama}"
                 onchange="toggleActivityBlock('${safeId}')">
          ${nama}
        </label>
        <div class="activity-sub" id="sub-${safeId}">
          <label>Jumlah ROW</label>
          <select data-row-utama="${nama}">
            <option value="">Pilih jumlah row...</option>
            ${ROW_OPTIONS.map(o => `<option value="${o.value}">${o.label}</option>`).join('')}
          </select>
        </div>
      </div>
    `;
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
    </div>
  `;
}

function renderKegiatanLainnya() {
  const container = document.getElementById('glks-kegiatan-lainnya-container');
  if (!container) return;

  container.innerHTML = KEGIATAN_LAINNYA.map((item, idx) => {
    const safeId = 'kl-' + idx;
    const sprayBlock = item.spray ? `
      <div class="spray-sub">
        <div class="spray-title">🧪 Detail Spray</div>
        <label>Bahan Aktif</label>
        <input type="text" data-spray-bahan="${item.key}" placeholder="Contoh: Abamectin">
        <label>Dosis</label>
        <input type="text" data-spray-dosis="${item.key}" placeholder="Contoh: 1 ml/L">
        <label>Pemakaian Air</label>
        <input type="text" data-spray-air="${item.key}" placeholder="Contoh: 200 L">
      </div>
    ` : '';

    return `
      <div class="activity-block" id="block-${safeId}">
        <label class="activity-head">
          <input type="checkbox" id="${safeId}" data-kegiatan-lainnya="${item.key}"
                 data-spray="${item.spray}" onchange="toggleActivityBlock('${safeId}')">
          ${item.key}
        </label>
        <div class="activity-sub" id="sub-${safeId}">
          <label>Jumlah ROW</label>
          <select data-row-lainnya="${item.key}">
            <option value="">Pilih jumlah row...</option>
            ${ROW_OPTIONS.map(o => `<option value="${o.value}">${o.label}</option>`).join('')}
          </select>
          ${sprayBlock}
        </div>
      </div>
    `;
  }).join('') + `
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
    </div>
  `;
}

function toggleActivityBlock(safeId) {
  const cb = document.getElementById(safeId);
  const block = document.getElementById('block-' + safeId);
  const sub = document.getElementById('sub-' + safeId);
  if (!cb || !sub) return;

  if (cb.checked) {
    sub.classList.add('show');
    block.classList.add('active');
  } else {
    sub.classList.remove('show');
    block.classList.remove('active');
    // Reset input di dalam sub
    sub.querySelectorAll('input[type="text"], select').forEach(el => el.value = '');
  }
}

// ========== WELCOME CONNECT ==========
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

// ========== GET ==========
async function syncWithGoogleSheet(isInitial = false) {
  if (!navigator.onLine) throw new Error('Tidak ada koneksi internet');

  console.log('📡 GET dari:', SCRIPT_URL);
  const response = await fetch(SCRIPT_URL + '?t=' + Date.now(), {
    method: 'GET', redirect: 'follow'
  });
  console.log('📡 Status:', response.status);

  if (!response.ok) throw new Error('HTTP ' + response.status);

  const text = await response.text();
  let data;
  try { data = JSON.parse(text); }
  catch (e) { throw new Error('Response bukan JSON: ' + text.substring(0, 200)); }

  localStorage.setItem(DATA_KEY, JSON.stringify(data));
  return data;
}

// ========== POST ==========
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
  if (!response.ok) throw new Error('HTTP ' + response.status);

  const text = await response.text();
  console.log('📥 Response body:', text);

  let result;
  try { result = JSON.parse(text); }
  catch (e) { throw new Error('Response bukan JSON: ' + text.substring(0, 200)); }

  if (result.status !== 'success') throw new Error(result.message || 'Server menolak data');

  console.log('✅ Berhasil disimpan ke Sheet');
  return result;
}

// ========== QUEUE ==========
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
    try { await kirimLksKeSheet(item); }
    catch (err) { console.warn('Gagal:', err); remaining.push(item); }
  }

  localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  if (remaining.length === 0) showToast('✅ Semua data queue tersinkron!', 'success');
}

// ========== SHOW APP ==========
function showApp() {
  const ws = document.getElementById('welcome-screen');
  const hd = document.getElementById('app-header');
  const app = document.getElementById('app-container');

  ws.style.opacity = '0';
  setTimeout(() => {
    ws.classList.add('hide');
    hd.classList.remove('app-container-hidden');
    app.classList.remove('app-container-hidden');
  }, 300);
}

// ========== TOAST ==========
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

// ========== ID ==========
function generateId() {
  return String(Date.now()) + String(Math.floor(Math.random() * 1000)).padStart(3, '0');
}

// ========== TOGGLE CONDITIONAL (Bagian 2) ==========
function toggleConditionalInputs() {
  const panenLainnya = document.querySelector('input[name="glks-panen"][value="Yang lain:"]');
  const panenInput = document.getElementById('glks-panen-lainnya');
  if (panenLainnya && panenInput) {
    panenInput.style.display = panenLainnya.checked ? 'block' : 'none';
    if (!panenLainnya.checked) panenInput.value = '';
  }
}

// ========== COLLECT DATA ==========
function collectLksGH1Data() {
  const getRadioValue = (name) => {
    const el = document.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : '';
  };

  // Bagian 4: Kegiatan Utama
  const kegiatanUtama = [];
  document.querySelectorAll('#glks-kegiatan-utama-container .activity-block').forEach(block => {
    const cb = block.querySelector('input[type="checkbox"]');
    if (!cb || !cb.checked) return;

    const namaAttr = cb.getAttribute('data-kegiatan-utama');
    let nama = namaAttr;
    let row = '';

    if (namaAttr) {
      // Kegiatan standar
      const select = block.querySelector(`select[data-row-utama="${namaAttr}"]`);
      row = select ? select.value : '';
    } else {
      // "Yang lain:"
      const namaInput = block.querySelector('#glks-kegiatan-utama-lainnya');
      nama = namaInput ? namaInput.value : '';
      const select = block.querySelector('select[data-row-utama="__LAINNYA__"]');
      row = select ? select.value : '';
    }

    if (nama) {
      kegiatanUtama.push({ kegiatan: nama, row: row });
    }
  });

  // Bagian 13: Kegiatan Lainnya
  const kegiatanLainnya = [];
  document.querySelectorAll('#glks-kegiatan-lainnya-container .activity-block').forEach(block => {
    const cb = block.querySelector('input[type="checkbox"]');
    if (!cb || !cb.checked) return;

    const namaAttr = cb.getAttribute('data-kegiatan-lainnya');
    const isSpray = cb.getAttribute('data-spray') === 'true';
    let nama = namaAttr;
    let row = '';
    let bahanAktif = '';
    let dosis = '';
    let air = '';

    if (namaAttr) {
      const select = block.querySelector(`select[data-row-lainnya="${namaAttr}"]`);
      row = select ? select.value : '';

      if (isSpray) {
        const b = block.querySelector(`input[data-spray-bahan="${namaAttr}"]`);
        const d = block.querySelector(`input[data-spray-dosis="${namaAttr}"]`);
        const a = block.querySelector(`input[data-spray-air="${namaAttr}"]`);
        bahanAktif = b ? b.value : '';
        dosis = d ? d.value : '';
        air = a ? a.value : '';
      }
    } else {
      const namaInput = block.querySelector('#glks-kegiatan-lainnya-text');
      nama = namaInput ? namaInput.value : '';
      const select = block.querySelector('select[data-row-lainnya="__LAINNYA__"]');
      row = select ? select.value : '';
    }

    if (nama) {
      kegiatanLainnya.push({
        kegiatan: nama,
        row: row,
        bahanAktif: bahanAktif,
        dosis: dosis,
        air: air
      });
    }
  });

  return {
    id: generateId(),
    timestamp: new Date().toISOString(),
    lokasi: 'GH 1',
    tanggal: document.getElementById('glks-tanggal').value,
    nama: document.getElementById('glks-nama').value,
    panenHariIni: getRadioValue('glks-panen'),
    panenLainnya: document.getElementById('glks-panen-lainnya').value,
    grading: getRadioValue('glks-grading'),
    kegiatanUtama: kegiatanUtama,
    kegiatanLainnya: kegiatanLainnya,
    perhitunganPopulasi: document.getElementById('glks-populasi').value,
    operasiSemut: getRadioValue('glks-semut'),
    sanitasiTransit: getRadioValue('glks-sanitasi-transit'),
    sanitasiGH: getRadioValue('glks-sanitasi-gh'),
    sensusTanaman: document.getElementById('glks-sensus').value,
    deskripsiKendala: document.getElementById('glks-kendala').value,
    temuanHPT: document.getElementById('glks-temuan').value
  };
}

// ========== SIMPAN ==========
async function simpanDataLksGH1() {
  const data = collectLksGH1Data();

  if (!data.tanggal || !data.nama) {
    showToast('Tanggal dan Nama wajib diisi!', 'error');
    return;
  }

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
    pushToQueue(data);
    showToast('⚠️ Gagal sync: ' + error.message, 'error');
  }
}

// ========== RESET ==========
function resetFormLksGH1() {
  const form = document.getElementById('form-lks-gh1');
  if (form) form.reset();

  document.getElementById('glks-tanggal').value = new Date().toISOString().split('T')[0];

  // Reset semua activity block
  document.querySelectorAll('.activity-block').forEach(block => {
    block.classList.remove('active');
    const sub = block.querySelector('.activity-sub');
    if (sub) sub.classList.remove('show');
  });

  toggleConditionalInputs();
}

// ========== INIT RENDER ==========
document.addEventListener('DOMContentLoaded', () => {
  renderKegiatanUtama();
  renderKegiatanLainnya();
});
