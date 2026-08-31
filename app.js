/* ---------- IndexedDB ---------- */
const DB_NAME = 'bp_bitacora';
const STORE = 'readings';
let dbPromise = new Promise((resolve, reject) => {
  const req = indexedDB.open(DB_NAME, 1);
  req.onupgradeneeded = () => {
    const db = req.result;
    if (!db.objectStoreNames.contains(STORE)) {
      const os = db.createObjectStore(STORE, { keyPath: 'id' });
      os.createIndex('by_datetime', 'datetime');
    }
  };
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});

async function dbAll() {
  const db = await dbPromise;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result.sort((a, b) => b.datetime.localeCompare(a.datetime)));
    req.onerror = () => reject(req.error);
  });
}

async function dbPut(record) {
  const db = await dbPromise;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function dbDelete(id) {
  const db = await dbPromise;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/* ---------- Categorization (referencia general, no es consejo médico) ---------- */
function categorize(sys, dia) {
  if (sys >= 180 || dia >= 120) return { label: 'Crisis hipertensiva', cls: 'danger' };
  if (sys >= 140 || dia >= 90) return { label: 'Hipertensión etapa 2', cls: 'danger' };
  if (sys >= 130 || dia >= 80) return { label: 'Hipertensión etapa 1', cls: 'caution' };
  if (sys >= 120) return { label: 'Elevada', cls: 'caution' };
  if (sys < 90 || dia < 60) return { label: 'Baja', cls: 'caution' };
  return { label: 'Normal', cls: 'good' };
}

/* ---------- Utilities ---------- */
function pad(n) { return String(n).padStart(2, '0'); }
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function nowTimeStr() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fmtDateHuman(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}
function uid() { return 'r_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8); }
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(showToast._h);
  showToast._h = setTimeout(() => t.classList.add('hidden'), 2200);
}

/* ---------- Tabs ---------- */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.view).classList.add('active');
    if (btn.dataset.view === 'view-add') resetAddForm();
  });
});

function switchToLog() {
  document.querySelector('.tab-btn[data-view="view-log"]').click();
}

/* ---------- Add form ---------- */
const inputSys = document.getElementById('inputSys');
const inputDia = document.getElementById('inputDia');
const inputPulse = document.getElementById('inputPulse');
const inputDate = document.getElementById('inputDate');
const inputTime = document.getElementById('inputTime');
const inputNotes = document.getElementById('inputNotes');
const catBanner = document.getElementById('catBanner');
const saveBtn = document.getElementById('saveBtn');
const digSys = document.getElementById('digSys');
const digDia = document.getElementById('digDia');
const digPulse = document.getElementById('digPulse');

function resetAddForm() {
  inputSys.value = '';
  inputDia.value = '';
  inputPulse.value = '';
  inputNotes.value = '';
  inputDate.value = todayStr();
  inputTime.value = nowTimeStr();
  digSys.textContent = '--';
  digDia.textContent = '--';
  digPulse.textContent = '--';
  catBanner.classList.add('hidden');
}

function updateLcdPreview() {
  digSys.textContent = inputSys.value || '--';
  digDia.textContent = inputDia.value || '--';
  digPulse.textContent = inputPulse.value || '--';
  const s = parseInt(inputSys.value), d = parseInt(inputDia.value);
  if (s && d) {
    const cat = categorize(s, d);
    catBanner.textContent = cat.label;
    catBanner.className = 'cat-banner ' + cat.cls;
  } else {
    catBanner.classList.add('hidden');
  }
}
[inputSys, inputDia, inputPulse].forEach(el => el.addEventListener('input', updateLcdPreview));

saveBtn.addEventListener('click', async () => {
  const sys = parseInt(inputSys.value);
  const dia = parseInt(inputDia.value);
  const pulse = parseInt(inputPulse.value);
  if (!sys || !dia || !pulse) {
    showToast('Completa sistólica, diastólica y pulso');
    return;
  }
  const date = inputDate.value || todayStr();
  const time = inputTime.value || nowTimeStr();
  const record = {
    id: uid(),
    datetime: `${date}T${time}`,
    date, time, sys, dia, pulse,
    notes: inputNotes.value.trim(),
  };
  await dbPut(record);
  showToast('Registro guardado');
  await renderAll();
  switchToLog();
});

/* ---------- Shared date range filter ---------- */
function getFilteredReadings(all) {
  const range = document.getElementById('rangeSelect').value;
  const sorted = [...all].sort((a, b) => a.datetime.localeCompare(b.datetime));
  if (range === 'all') return sorted;
  if (range === 'custom') {
    const from = document.getElementById('rangeFrom').value;
    const to = document.getElementById('rangeTo').value;
    return sorted.filter(r => (!from || r.date >= from) && (!to || r.date <= to));
  }
  const days = parseInt(range);
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - days);
  return sorted.filter(r => new Date(r.date + 'T00:00:00') >= cutoff);
}

document.getElementById('rangeSelect').addEventListener('change', () => {
  const isCustom = document.getElementById('rangeSelect').value === 'custom';
  document.getElementById('customRangeRow').classList.toggle('hidden', !isCustom);
  if (!isCustom) renderAll();
});
document.getElementById('rangeFrom').addEventListener('change', renderAll);
document.getElementById('rangeTo').addEventListener('change', renderAll);

/* ---------- Log list ---------- */
async function renderLog() {
  const all = await dbAll();
  const filtered = getFilteredReadings(all).slice().reverse(); // newest first
  const list = document.getElementById('logList');
  const empty = document.getElementById('emptyState');
  const countBadge = document.getElementById('countBadge');
  countBadge.textContent = filtered.length;
  list.innerHTML = '';
  if (filtered.length === 0) {
    empty.querySelector('p').textContent = all.length === 0
      ? 'Aún no hay registros.'
      : 'No hay registros en este periodo.';
    empty.querySelector('.empty-sub').textContent = all.length === 0
      ? 'Toca "Registrar" para capturar tu primera lectura.'
      : 'Prueba otro rango de fechas arriba.';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  for (const r of filtered) {
    const cat = categorize(r.sys, r.dia);
    const li = document.createElement('li');
    li.className = 'log-item';
    li.innerHTML = `
      <div class="log-item-main">
        <div class="log-nums">
          <div class="bp">${r.sys}/${r.dia}</div>
          <div class="pulse">♥ ${r.pulse} lpm</div>
        </div>
        <div class="log-meta">
          <div>${fmtDateHuman(r.date)} · ${r.time}</div>
          ${r.notes ? `<div class="notes">${escapeHtml(r.notes)}</div>` : ''}
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:6px;">
        <span class="status-chip chip-${cat.cls}">${cat.label}</span>
        <button class="del-btn" data-id="${r.id}" aria-label="Eliminar">
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>
        </button>
      </div>`;
    list.appendChild(li);
  }

  list.querySelectorAll('.del-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('¿Eliminar este registro?')) {
        await dbDelete(btn.dataset.id);
        await renderAll();
      }
    });
  });
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ---------- Chart ---------- */
let chartInstance = null;
async function renderChart() {
  const all = await dbAll();
  const filtered = getFilteredReadings(all);

  const labels = filtered.map(r => fmtDateHuman(r.date) + ' ' + r.time.slice(0, 5));
  const sysData = filtered.map(r => r.sys);
  const diaData = filtered.map(r => r.dia);
  const pulseData = filtered.map(r => r.pulse);

  const sub = document.getElementById('rangeSub');
  if (filtered.length) {
    const avgSys = Math.round(sysData.reduce((a, b) => a + b, 0) / sysData.length);
    const avgDia = Math.round(diaData.reduce((a, b) => a + b, 0) / diaData.length);
    sub.textContent = `Promedio: ${avgSys}/${avgDia} mmHg · ${filtered.length} registro(s)`;
  } else {
    sub.textContent = 'Sin registros en este rango';
  }

  const ctx = document.getElementById('trendChart').getContext('2d');
  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Sistólica', data: sysData, borderColor: '#C0392B', backgroundColor: '#C0392B', tension: 0.3, pointRadius: 3, borderWidth: 2 },
        { label: 'Diastólica', data: diaData, borderColor: '#0A6E93', backgroundColor: '#0A6E93', tension: 0.3, pointRadius: 3, borderWidth: 2 },
        { label: 'Pulso', data: pulseData, borderColor: '#7A8C4A', backgroundColor: '#7A8C4A', tension: 0.3, pointRadius: 3, borderWidth: 2, borderDash: [4, 3] },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { maxRotation: 0, autoSkip: true, font: { size: 10 } }, grid: { display: false } },
        y: { ticks: { font: { size: 10 } }, grid: { color: '#EAEFEE' } },
      },
    },
  });
}


/* ---------- PDF export ---------- */
document.getElementById('exportBtn').addEventListener('click', async () => {
  const all = await dbAll();
  const sorted = getFilteredReadings(all);
  if (sorted.length === 0) {
    showToast('No hay registros en este periodo para exportar');
    return;
  }
  showToast('Generando PDF...');
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 40;

  doc.setFontSize(17);
  doc.setTextColor('#003C52');
  doc.text('Bitácora de Presión Arterial', margin, 50);
  doc.setFontSize(10);
  doc.setTextColor('#5A6B72');
  const rangeLabel = document.getElementById('rangeSub').textContent;
  doc.text(`Generado: ${new Date().toLocaleString('es-MX')}  ·  ${rangeLabel}`, margin, 66);

  // Chart image
  const chartCanvas = document.getElementById('trendChart');
  const chartImg = chartCanvas.toDataURL('image/png', 1.0);
  const imgW = pageW - margin * 2;
  const imgH = imgW * (chartCanvas.height / chartCanvas.width);
  doc.addImage(chartImg, 'PNG', margin, 82, imgW, imgH);

  // Table
  let y = 82 + imgH + 26;
  const rowH = 16;
  const cols = [
    { title: 'Fecha', w: 70 },
    { title: 'Hora', w: 45 },
    { title: 'SYS', w: 40 },
    { title: 'DIA', w: 40 },
    { title: 'Pulso', w: 45 },
    { title: 'Categoría', w: 100 },
    { title: 'Notas', w: pageW - margin * 2 - (70 + 45 + 40 + 40 + 45 + 100) },
  ];

  function drawHeader() {
    doc.setFillColor('#EAF3F2');
    doc.rect(margin, y - 12, pageW - margin * 2, rowH, 'F');
    doc.setFontSize(9);
    doc.setTextColor('#003C52');
    let x = margin + 4;
    cols.forEach(c => { doc.text(c.title, x, y); x += c.w; });
    y += rowH;
  }

  drawHeader();
  doc.setFontSize(9);
  sorted.forEach((r, i) => {
    if (y > doc.internal.pageSize.getHeight() - 50) {
      doc.addPage();
      y = 50;
      drawHeader();
    }
    const cat = categorize(r.sys, r.dia);
    doc.setTextColor('#16232B');
    let x = margin + 4;
    const vals = [fmtDateHuman(r.date), r.time, String(r.sys), String(r.dia), String(r.pulse), cat.label, r.notes || ''];
    vals.forEach((v, idx) => {
      doc.text(String(v).slice(0, idx === 6 ? 40 : 20), x, y);
      x += cols[idx].w;
    });
    y += rowH;
    if (i % 2 === 0) {
      doc.setDrawColor('#EEF1F0');
    }
  });

  doc.setFontSize(8);
  doc.setTextColor('#9AA7AB');
  doc.text('Este documento es un registro personal y no sustituye una valoración médica.', margin, doc.internal.pageSize.getHeight() - 24);

  const filename = `bitacora_presion_${todayStr()}.pdf`;
  doc.save(filename);
});

/* ---------- Backup: export / import JSON ---------- */
document.getElementById('backupBtn').addEventListener('click', async () => {
  const all = await dbAll();
  if (all.length === 0) {
    showToast('No hay registros para respaldar');
    return;
  }
  const payload = { app: 'bitacora-presion', version: 1, exportedAt: new Date().toISOString(), readings: all };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `respaldo_presion_${todayStr()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast('Respaldo descargado');
});

document.getElementById('importInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  try {
    const text = await file.text();
    const payload = JSON.parse(text);
    const readings = Array.isArray(payload) ? payload : payload.readings;
    if (!Array.isArray(readings)) throw new Error('formato inválido');
    let count = 0;
    for (const r of readings) {
      if (!r.id || !r.datetime || !r.sys || !r.dia || !r.pulse) continue;
      await dbPut(r);
      count += 1;
    }
    showToast(`${count} registro(s) restaurados`);
    await renderAll();
  } catch (err) {
    console.error(err);
    showToast('No se pudo leer el archivo de respaldo');
  }
});

/* ---------- Init ---------- */
async function renderAll() {
  await renderLog();
  await renderChart();
}
resetAddForm();
renderAll();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  });
}
