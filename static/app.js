let selectedExpIds = [];

// DOM Elements
const rawNotesInput = document.getElementById('rawNotesInput');
const captureBtn = document.getElementById('captureBtn');
const captureBtnText = document.getElementById('captureBtnText');
const captureStatus = document.getElementById('captureStatus');
const experimentsGrid = document.getElementById('experimentsGrid');
const experimentCount = document.getElementById('experimentCount');
const compareBtn = document.getElementById('compareBtn');
const compareModal = document.getElementById('compareModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const compareLoading = document.getElementById('compareLoading');
const compareContent = document.getElementById('compareContent');

// Fetch and render experiments
async function loadExperiments() {
  try {
    const res = await fetch('/api/experiments');
    const data = await res.json();
    renderExperiments(data);
  } catch (err) {
    console.error('Failed to load experiments:', err);
  }
}

function renderExperiments(items) {
  experimentCount.textContent = `${items.length} eksperimen tercatat`;
  if (items.length === 0) {
    experimentsGrid.innerHTML = `
      <div class="col-span-full py-12 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
        Belum ada log seduh. Tulis catatan di atas untuk memulai eksperimen pertama Anda!
      </div>
    `;
    return;
  }

  experimentsGrid.innerHTML = items.map(exp => {
    const isSelected = selectedExpIds.includes(exp.id);
    const sensoryTags = (exp.sensory_notes || []).map(note => 
      `<span class="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-[10px]">${note}</span>`
    ).join(' ');

    return `
      <div class="bg-zinc-900 border ${isSelected ? 'border-amber-500 ring-1 ring-amber-500' : 'border-zinc-800'} rounded-xl p-4.5 space-y-3 relative hover:border-zinc-700 transition-all flex flex-col justify-between">
        <div class="space-y-2">
          <div class="flex items-start justify-between gap-2">
            <h3 class="font-bold text-sm text-zinc-100 line-clamp-1">${exp.bean_name || 'Unknown Bean'}</h3>
            <input type="checkbox" onchange="toggleSelect(${exp.id})" ${isSelected ? 'checked' : ''} class="w-4 h-4 rounded accent-amber-500 bg-zinc-800 border-zinc-700 cursor-pointer">
          </div>
          <div class="flex flex-wrap gap-1.5 text-[11px] text-zinc-400">
            <span class="bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-medium">${exp.method || 'V60'}</span>
            <span class="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">${exp.roast_level || 'Medium'}</span>
            ${exp.rating ? `<span class="bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded font-semibold">★ ${exp.rating}/10</span>` : ''}
          </div>
          <div class="grid grid-cols-2 gap-2 text-xs text-zinc-400 bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/60">
            <div>Dosis: <span class="text-zinc-200 font-medium">${exp.dose_grams || '-'}g</span></div>
            <div>Air: <span class="text-zinc-200 font-medium">${exp.water_grams || '-'}g (${exp.ratio || '-'})</span></div>
            <div>Suhu: <span class="text-zinc-200 font-medium">${exp.water_temp_c ? exp.water_temp_c + '°C' : '-'}</span></div>
            <div>Gilingan: <span class="text-zinc-200 font-medium">${exp.grind_size || '-'}</span></div>
            <div>Waktu: <span class="text-zinc-200 font-medium">${exp.brew_time_seconds ? exp.brew_time_seconds + 's' : '-'}</span></div>
          </div>
          <div class="flex flex-wrap gap-1 pt-1">
            ${sensoryTags}
          </div>
        </div>
        <div class="text-[10px] text-zinc-500 border-t border-zinc-800/60 pt-2 line-clamp-2 italic">
          "${exp.raw_notes}"
        </div>
      </div>
    `;
  }).join('');
}

function toggleSelect(id) {
  if (selectedExpIds.includes(id)) {
    selectedExpIds = selectedExpIds.filter(x => x !== id);
  } else {
    if (selectedExpIds.length >= 2) {
      selectedExpIds.shift(); // hanya simpan 2 pilihan terakhir
    }
    selectedExpIds.push(id);
  }
  updateCompareButton();
  loadExperiments();
}

function updateCompareButton() {
  if (selectedExpIds.length === 2) {
    compareBtn.classList.remove('hidden');
  } else {
    compareBtn.classList.add('hidden');
  }
}

// Capture flow
captureBtn.addEventListener('click', async () => {
  const text = rawNotesInput.value.trim();
  if (!text) return;

  captureBtn.disabled = true;
  captureBtnText.textContent = 'Mengekstrak dengan Local AI...';
  captureStatus.textContent = 'Memproses via Ollama...';

  try {
    const res = await fetch('/api/experiments/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    if (!res.ok) throw new Error(await res.text());
    rawNotesInput.value = '';
    captureStatus.textContent = 'Berhasil diekstrak & disimpan!';
    setTimeout(() => { captureStatus.textContent = ''; }, 3000);
    loadExperiments();
  } catch (err) {
    captureStatus.textContent = 'Gagal: ' + err.message;
  } finally {
    captureBtn.disabled = false;
    captureBtnText.textContent = 'Ekstrak & Simpan Eksperimen';
  }
});

// Compare flow
compareBtn.addEventListener('click', async () => {
  if (selectedExpIds.length !== 2) return;
  compareModal.classList.remove('hidden');
  compareLoading.classList.remove('hidden');
  compareContent.classList.add('hidden');

  try {
    const res = await fetch('/api/experiments/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        expreiment_id_a: selectedExpIds[0],
        expreiment_id_b: selectedExpIds[1]
      })
    });
    const data = await res.json();
    renderCompareResults(data);
  } catch (err) {
    alert('Gagal membandingkan: ' + err.message);
    compareModal.classList.add('hidden');
  }
});

function renderCompareResults(data) {
  const { experiment_a, experiment_b, parameter_diff, analysis } = data;

  document.getElementById('sideBySideBox').innerHTML = `
    <div class="space-y-1">
      <div class="font-bold text-zinc-100 pb-1 border-b border-zinc-800">Eksperimen A (${experiment_a.bean_name})</div>
      <div>Metode: ${experiment_a.method}</div>
      <div>Dosis: ${experiment_a.dose_grams}g</div>
      <div>Air: ${experiment_a.water_grams}g (${experiment_a.ratio})</div>
      <div>Suhu: ${experiment_a.water_temp_c}°C</div>
      <div>Gilingan: ${experiment_a.grind_size}</div>
      <div>Waktu: ${experiment_a.brew_time_seconds}s</div>
      <div>Rating: ${experiment_a.rating || '-'}/10</div>
    </div>
    <div class="space-y-1">
      <div class="font-bold text-zinc-100 pb-1 border-b border-zinc-800">Eksperimen B (${experiment_b.bean_name})</div>
      <div>Metode: ${experiment_b.method}</div>
      <div>Dosis: ${experiment_b.dose_grams}g <span class="text-amber-400">(${parameter_diff.dose_delta >= 0 ? '+' : ''}${parameter_diff.dose_delta || 0}g)</span></div>
      <div>Air: ${experiment_b.water_grams}g <span class="text-amber-400">(${parameter_diff.water_delta >= 0 ? '+' : ''}${parameter_diff.water_delta || 0}g)</span></div>
      <div>Suhu: ${experiment_b.water_temp_c}°C <span class="text-amber-400">(${parameter_diff.temp_delta >= 0 ? '+' : ''}${parameter_diff.temp_delta || 0}°C)</span></div>
      <div>Gilingan: ${experiment_b.grind_size}</div>
      <div>Waktu: ${experiment_b.brew_time_seconds}s <span class="text-amber-400">(${parameter_diff.time_delta >= 0 ? '+' : ''}${parameter_diff.time_delta || 0}s)</span></div>
      <div>Rating: ${experiment_b.rating || '-'}/10</div>
    </div>
  `;

  document.getElementById('explainText').textContent = analysis.extraction_explanation || 'Tidak ada penjelasan';
  document.getElementById('auditText').textContent = analysis.audit || 'Tidak ada audit';
  document.getElementById('recommendText').textContent = analysis.next_recommendation || 'Tidak ada rekomendasi';

  compareLoading.classList.add('hidden');
  compareContent.classList.remove('hidden');
}

closeModalBtn.addEventListener('click', () => {
  compareModal.classList.add('hidden');
});

// Initial load
loadExperiments();
