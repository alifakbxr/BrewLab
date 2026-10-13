let allExperiments = [];
let selectedExpIds = [];
let currentComparisonData = null;

// DOM Elements
const rawNotesInput = document.getElementById('rawNotesInput');
const captureBtn = document.getElementById('captureBtn');
const captureBtnText = document.getElementById('captureBtnText');
const captureStatus = document.getElementById('captureStatus');
const experimentsGrid = document.getElementById('experimentsGrid');
const experimentCount = document.getElementById('experimentCount');
const searchInput = document.getElementById('searchInput');
const methodFilter = document.getElementById('methodFilter');

// Compare Elements
const bottomCompareBar = document.getElementById('bottomCompareBar');
const triggerCompareBtn = document.getElementById('triggerCompareBtn');
const clearSelectionBtn = document.getElementById('clearSelectionBtn');
const compareModal = document.getElementById('compareModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const compareLoading = document.getElementById('compareLoading');
const compareContent = document.getElementById('compareContent');
const applyDialInBtn = document.getElementById('applyDialInBtn');

// Feed Elements
const feedCard = document.getElementById('feedCard');
const feedLoading = document.getElementById('feedLoading');
const refreshFeedBtn = document.getElementById('refreshFeedBtn');
const applyFeedBtn = document.getElementById('applyFeedBtn');
let currentDailyRecipe = null;

// Mobile Tab Switcher
const tabExperimentsBtn = document.getElementById('tabExperimentsBtn');
const tabCaptureBtn = document.getElementById('tabCaptureBtn');
const leftColumn = document.getElementById('leftColumn');
const rightColumn = document.getElementById('rightColumn');

// 1. Data Loading & Rendering
async function loadExperiments() {
  try {
    const res = await fetch('/api/experiments');
    allExperiments = await res.json();
    renderFilteredExperiments();
  } catch (err) {
    console.error('Failed to load experiments:', err);
  }
}

async function deleteExperiment(id, name) {
  if (!confirm(`Apakah Anda yakin ingin menghapus eksperimen "${name}"?`)) {
    return;
  }

  try {
    const res = await fetch(`/api/experiments/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(await res.text());

    // Hapus dari daftar seleksi jika sedang dipilih
    selectedExpIds = selectedExpIds.filter(x => x !== id);
    updateCompareBar();

    // Reload data
    await loadExperiments();
  } catch (err) {
    alert('Gagal menghapus eksperimen: ' + err.message);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}



function renderFilteredExperiments() {
  const query = searchInput ? searchInput.value.toLowerCase() : '';
  const selectedMethod = methodFilter ? methodFilter.value : '';

  const filtered = allExperiments.filter(exp => {
    const matchQuery = (exp.bean_name || '').toLowerCase().includes(query) ||
                       (exp.raw_notes || '').toLowerCase().includes(query);
    const matchMethod = !selectedMethod || (exp.method || '').toLowerCase() === selectedMethod.toLowerCase();
    return matchQuery && matchMethod;
  });

  if (experimentCount) {
    experimentCount.textContent = `${filtered.length} eksperimen`;
  }

  if (filtered.length === 0) {
    experimentsGrid.innerHTML = `
      <div class="col-span-full py-12 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-2xl p-6">
        <p class="text-xs">Tidak ada eksperimen yang cocok.</p>
      </div>
    `;
    return;
  }

  experimentsGrid.innerHTML = filtered.map(exp => {
    const isSelected = selectedExpIds.includes(exp.id);
    const sensoryTags = (exp.sensory_notes || []).map(note => 
      `<span class="bg-zinc-800/80 text-zinc-300 px-2 py-0.5 rounded text-[10px]">${escapeHtml(note)}</span>`
    ).join(' ');

    const safeBeanName = escapeHtml(exp.bean_name || 'Unknown Bean');
    const safeMethod = escapeHtml(exp.method || 'V60');
    const safeRoast = escapeHtml(exp.roast_level || 'Medium');
    const safeGrind = escapeHtml(exp.grind_size || '-');
    const safeNotes = escapeHtml(exp.raw_notes || '');

    return `
      <div onclick="toggleSelect(${exp.id})" class="cursor-pointer bg-[#121215] border ${isSelected ? 'border-amber-500 ring-1 ring-amber-500 bg-amber-500/[0.02]' : 'border-zinc-800/80'} rounded-2xl p-4 space-y-3 hover:border-zinc-700 transition-all flex flex-col justify-between">
        <div class="space-y-2.5">
          <div class="flex items-start justify-between gap-2">
            <div>
              <h3 class="font-bold text-sm text-zinc-100 line-clamp-1">${safeBeanName}</h3>
              <div class="flex items-center gap-1.5 text-[11px] text-zinc-400 pt-0.5">
                <span class="text-amber-400 font-semibold">${safeMethod}</span>
                <span>•</span>
                <span>${safeRoast}</span>
              </div>
            </div>
            <div class="flex items-center gap-1.5" onclick="event.stopPropagation()">
              <button onclick="deleteExperiment(${exp.id}, '${safeBeanName.replace(/'/g, "\\'")}')" title="Delete Experiment" class="text-zinc-500 hover:text-red-400 p-1 rounded hover:bg-zinc-800/80 transition-colors text-xs">
                🗑️
              </button>
              <input type="checkbox" ${isSelected ? 'checked' : ''} onclick="toggleSelect(${exp.id})" class="w-4 h-4 rounded accent-amber-500 bg-zinc-800 border-zinc-700 cursor-pointer">
            </div>
          </div>

          <div class="grid grid-cols-3 gap-1.5 text-[11px] text-zinc-300 bg-[#09090b] p-2 rounded-xl border border-zinc-800/60 text-center mono">
            <div><span class="text-[9px] text-zinc-500 block">Dose</span>${exp.dose_grams || '-'}g</div>
            <div><span class="text-[9px] text-zinc-500 block">Water</span>${exp.water_grams || '-'}g</div>
            <div><span class="text-[9px] text-zinc-500 block">Ratio</span>${escapeHtml(exp.ratio || '-')}</div>
          </div>

          <div class="flex items-center justify-between text-[11px] text-zinc-400 px-0.5">
            <div>Temp: <span class="text-zinc-200">${exp.water_temp_c ? exp.water_temp_c + '°C' : '-'}</span></div>
            <div>Grind: <span class="text-zinc-200">${safeGrind}</span></div>
            ${exp.rating ? `<div class="text-amber-400 font-bold">★ ${exp.rating}/10</div>` : ''}
          </div>

          <div class="flex flex-wrap gap-1 pt-0.5">
            ${sensoryTags}
          </div>
        </div>

        <div class="text-[10px] text-zinc-500 border-t border-zinc-800/60 pt-2 line-clamp-2 italic">
          "${safeNotes}"
        </div>
      </div>
    `;
  }).join('');

}

// 2. Selection & Comparison Flow
function toggleSelect(id) {
  if (selectedExpIds.includes(id)) {
    selectedExpIds = selectedExpIds.filter(x => x !== id);
  } else {
    if (selectedExpIds.length >= 2) selectedExpIds.shift();
    selectedExpIds.push(id);
  }
  updateCompareBar();
  renderFilteredExperiments();
}

function updateCompareBar() {
  if (!bottomCompareBar) return;
  if (selectedExpIds.length === 2) {
    bottomCompareBar.classList.remove('translate-y-full');
  } else {
    bottomCompareBar.classList.add('translate-y-full');
  }
}

if (clearSelectionBtn) {
  clearSelectionBtn.addEventListener('click', () => {
    selectedExpIds = [];
    updateCompareBar();
    renderFilteredExperiments();
  });
}

if (triggerCompareBtn) {
  triggerCompareBtn.addEventListener('click', async () => {
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

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }

      currentComparisonData = await res.json();
      renderCompareResults(currentComparisonData);

    } catch (err) {
      alert('Gagal membandingkan: ' + err.message);
      compareModal.classList.add('hidden');
    }
  });
}

function renderCompareResults(data) {
  const { experiment_a, experiment_b, parameter_diff, analysis } = data;

  const renderDelta = (val, unit) => {
    if (val === null || val === undefined) return '';
    const sign = val >= 0 ? '+' : '';
    return `<span class="text-amber-400 ml-1">(${sign}${val}${unit})</span>`;
  };

  document.getElementById('sideBySideBox').innerHTML = `
    <div class="space-y-1.5 p-2 bg-[#121215] rounded-lg">
      <div class="font-bold text-zinc-100 pb-1 border-b border-zinc-800">Eksperimen A (${experiment_a.bean_name})</div>
      <div>Metode: <span class="text-zinc-200">${experiment_a.method}</span></div>
      <div>Dosis: <span class="text-zinc-200">${experiment_a.dose_grams}g</span></div>
      <div>Air: <span class="text-zinc-200">${experiment_a.water_grams}g (${experiment_a.ratio})</span></div>
      <div>Suhu: <span class="text-zinc-200">${experiment_a.water_temp_c}°C</span></div>
      <div>Gilingan: <span class="text-zinc-200">${experiment_a.grind_size}</span></div>
      <div>Waktu: <span class="text-zinc-200">${experiment_a.brew_time_seconds}s</span></div>
      <div>Rating: <span class="text-amber-400">${experiment_a.rating || '-'}/10</span></div>
    </div>
    <div class="space-y-1.5 p-2 bg-[#121215] rounded-lg">
      <div class="font-bold text-zinc-100 pb-1 border-b border-zinc-800">Eksperimen B (${experiment_b.bean_name})</div>
      <div>Metode: <span class="text-zinc-200">${experiment_b.method}</span></div>
      <div>Dosis: <span class="text-zinc-200">${experiment_b.dose_grams}g</span> ${renderDelta(parameter_diff.dose_delta, 'g')}</div>
      <div>Air: <span class="text-zinc-200">${experiment_b.water_grams}g</span> ${renderDelta(parameter_diff.water_delta, 'g')}</div>
      <div>Suhu: <span class="text-zinc-200">${experiment_b.water_temp_c}°C</span> ${renderDelta(parameter_diff.temp_delta, '°C')}</div>
      <div>Gilingan: <span class="text-zinc-200">${experiment_b.grind_size}</span></div>
      <div>Waktu: <span class="text-zinc-200">${experiment_b.brew_time_seconds}s</span> ${renderDelta(parameter_diff.time_delta, 's')}</div>
      <div>Rating: <span class="text-amber-400">${experiment_b.rating || '-'}/10</span></div>
    </div>
  `;

  document.getElementById('explainText').textContent = analysis.extraction_explanation || '-';
  document.getElementById('auditText').textContent = analysis.audit || '-';
  document.getElementById('recommendText').textContent = analysis.next_recommendation || '-';

  compareLoading.classList.add('hidden');
  compareContent.classList.remove('hidden');
}

if (closeModalBtn) {
  closeModalBtn.addEventListener('click', () => {
    compareModal.classList.add('hidden');
  });
}

// Dial-in helper
if (applyDialInBtn) {
  applyDialInBtn.addEventListener('click', () => {
    if (!currentComparisonData) return;
    const b = currentComparisonData.experiment_b;
    const rec = currentComparisonData.analysis.next_recommendation;

    rawNotesInput.value = `Next Iteration (${b.bean_name}): Method ${b.method}, Dose ${b.dose_grams}g, Water ${b.water_grams}g, Temp ${b.water_temp_c}C. Adjustment: ${rec}`;
    compareModal.classList.add('hidden');

    if (window.innerWidth < 1024) switchMobileTab('capture');
    rawNotesInput.focus();
  });
}

// 3. Capture Flow
if (captureBtn) {
  captureBtn.addEventListener('click', async () => {
    const text = rawNotesInput.value.trim();
    if (!text) return;

    captureBtn.disabled = true;
    captureBtnText.textContent = 'Mengekstrak AI...';
    captureStatus.textContent = 'Memproses...';

    try {
      const res = await fetch('/api/experiments/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      if (!res.ok) throw new Error(await res.text());
      rawNotesInput.value = '';
      captureStatus.textContent = 'Tersimpan!';
      setTimeout(() => { captureStatus.textContent = ''; }, 3000);
      await loadExperiments();
      loadDailyFeed();
      if (window.innerWidth < 1024) switchMobileTab('experiments');
    } catch (err) {
      captureStatus.textContent = 'Error: ' + err.message;
    } finally {
      captureBtn.disabled = false;
      captureBtnText.textContent = 'Ekstrak & Simpan';
    }
  });
}

// 4. Daily Feed Recipe
async function loadDailyFeed() {
  if (!feedLoading || !feedCard) return;
  feedLoading.classList.remove('hidden');
  feedCard.classList.add('hidden');

  try {
    const res = await fetch('/api/feed/daily-recipe');
    currentDailyRecipe = await res.json();

    document.getElementById('feedTitle').textContent = currentDailyRecipe.title || 'Specialty Daily Brew';
    document.getElementById('feedBean').textContent = currentDailyRecipe.recommended_bean || currentDailyRecipe.recommendation_bean || 'Single Origin';
    document.getElementById('feedRatio').textContent = `${currentDailyRecipe.dose_grams}g / ${currentDailyRecipe.water_grams}g`;
    document.getElementById('feedTemp').textContent = `${currentDailyRecipe.water_temp_c}°C`;
    document.getElementById('feedMethod').textContent = currentDailyRecipe.method || 'V60';
    document.getElementById('feedFlavor').textContent = `🎯 Target Flavor: ${currentDailyRecipe.flavor_profile_target || '-'} | Pro Tip: ${currentDailyRecipe.pro_tip || '-'}`;

    feedCard.classList.remove('hidden');
  } catch (err) {
    console.error('Failed to load feed:', err);
  } finally {
    feedLoading.classList.add('hidden');
  }
}

if (refreshFeedBtn) refreshFeedBtn.addEventListener('click', loadDailyFeed);

if (applyFeedBtn) {
  applyFeedBtn.addEventListener('click', () => {
    if (!currentDailyRecipe) return;
    rawNotesInput.value = `Testing ${currentDailyRecipe.title}: Beans ${currentDailyRecipe.recommended_bean || currentDailyRecipe.recommendation_bean}, ${currentDailyRecipe.dose_grams}g kopi, ${currentDailyRecipe.water_grams}g air (${currentDailyRecipe.ratio}) suhu ${currentDailyRecipe.water_temp_c}C pake ${currentDailyRecipe.method}, grind ${currentDailyRecipe.grind_size}. Target waktu ${currentDailyRecipe.brew_time_target}.`;
    if (window.innerWidth < 1024) switchMobileTab('capture');
    rawNotesInput.focus();
  });
}

// 5. Export & Import Open Dataset
const exportBtn = document.getElementById('exportJsonBtn');
if (exportBtn) {
  exportBtn.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/experiments/export/json');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `brewlab-experiments-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Gagal export: ' + err.message);
    }
  });
}

const importInput = document.getElementById('importJsonInput');
if (importInput) {
  importInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const items = JSON.parse(event.target.result);
        const res = await fetch('/api/experiments/import/json', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(items)
        });
        const result = await res.json();
        alert(result.message);
        loadExperiments();
      } catch (err) {
        alert('Gagal impor: File JSON tidak valid');
      }
    };
    reader.readAsText(file);
  });
}

// 6. Search & Filters
if (searchInput) searchInput.addEventListener('input', renderFilteredExperiments);
if (methodFilter) methodFilter.addEventListener('change', renderFilteredExperiments);

// 7. Mobile Tab Handling
function switchMobileTab(tab) {
  if (!leftColumn || !rightColumn) return;
  if (tab === 'experiments') {
    leftColumn.classList.add('hidden');
    rightColumn.classList.remove('hidden');
    tabExperimentsBtn.className = "py-2 rounded-lg bg-amber-600 text-white shadow";
    tabCaptureBtn.className = "py-2 rounded-lg hover:text-zinc-200 text-zinc-400";
  } else {
    rightColumn.classList.add('hidden');
    leftColumn.classList.remove('hidden');
    tabCaptureBtn.className = "py-2 rounded-lg bg-amber-600 text-white shadow";
    tabExperimentsBtn.className = "py-2 rounded-lg hover:text-zinc-200 text-zinc-400";
  }
}

if (tabExperimentsBtn && tabCaptureBtn) {
  tabExperimentsBtn.addEventListener('click', () => switchMobileTab('experiments'));
  tabCaptureBtn.addEventListener('click', () => switchMobileTab('capture'));
}

// Initial Initialization
loadExperiments();
loadDailyFeed();
