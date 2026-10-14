import React, { useState, useEffect } from 'react';
import {
  Coffee, Sparkles, Scale, Trash2, Download, Upload,
  Search, RefreshCw, X, ArrowRight, Lightbulb, Stethoscope, Target, Check
} from 'lucide-react';

export default function App() {
  const [experiments, setExperiments] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [rawText, setRawText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');

  // Status states
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureStatus, setCaptureStatus] = useState('');
  const [mobileTab, setMobileTab] = useState('experiments'); // 'experiments' or 'capture'

  // Daily Feed states
  const [dailyRecipe, setDailyRecipe] = useState(null);
  const [feedLoading, setFeedLoading] = useState(false);

  // Compare states
  const [isComparing, setIsComparing] = useState(false);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);

  useEffect(() => {
    fetchExperiments();
    fetchDailyRecipe();
  }, []);

  const fetchExperiments = async () => {
    try {
      const res = await fetch('/api/experiments');
      const data = await res.json();
      setExperiments(data);
    } catch (err) {
      console.error('Error fetching experiments:', err);
    }
  };

  const fetchDailyRecipe = async () => {
    setFeedLoading(true);
    try {
      const res = await fetch('/api/feed/daily-recipe');
      const data = await res.json();
      setDailyRecipe(data);
    } catch (err) {
      console.error('Error fetching daily feed:', err);
    } finally {
      setFeedLoading(false);
    }
  };

  const handleCapture = async (e) => {
    e.preventDefault();
    if (!rawText.trim()) return;

    setIsCapturing(true);
    setCaptureStatus('Extracting parameters with Local AI...');

    try {
      const res = await fetch('/api/experiments/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText.trim() }),
      });

      if (!res.ok) throw new Error(await res.text());

      setRawText('');
      setCaptureStatus('Saved successfully!');
      setTimeout(() => setCaptureStatus(''), 3000);

      await fetchExperiments();
      fetchDailyRecipe();
      setMobileTab('experiments');
    } catch (err) {
      setCaptureStatus('Extraction failed: ' + err.message);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleDelete = async (id, name, e) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete "${name || 'this experiment'}"?`)) return;

    try {
      const res = await fetch(`/api/experiments/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      setSelectedIds(prev => prev.filter(x => x !== id));
      fetchExperiments();
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      }
      if (prev.length >= 2) {
        return [prev[1], id];
      }
      return [...prev, id];
    });
  };

  const handleCompare = async () => {
    if (selectedIds.length !== 2) return;
    setCompareModalOpen(true);
    setIsComparing(true);
    setComparisonResult(null);

    try {
      const res = await fetch('/api/experiments/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experiment_id_a: selectedIds[0],
          experiment_id_b: selectedIds[1],
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setComparisonResult(data);
    } catch (err) {
      alert('Comparison error: ' + err.message);
      setCompareModalOpen(false);
    } finally {
      setIsComparing(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await fetch('/api/experiments/export/json');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `brewlab-dataset-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export failed: ' + err.message);
    }
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const items = JSON.parse(event.target.result);
        const res = await fetch('/api/experiments/import/json', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(items),
        });
        const result = await res.json();
        alert(result.message);
        fetchExperiments();
      } catch (err) {
        alert('Invalid JSON dataset: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const applyDialInToCapture = () => {
    if (!comparisonResult) return;
    const b = comparisonResult.experiment_b;
    const rec = comparisonResult.analysis?.next_recommendation || '';
    setRawText(`Next Iteration (${b.bean_name}): Method ${b.method}, Dose ${b.dose_grams}g, Water ${b.water_grams}g, Temp ${b.water_temp_c}C. Adjustment: ${rec}`);
    setCompareModalOpen(false);
    setMobileTab('capture');
  };

  const applyDailyRecipeToCapture = () => {
    if (!dailyRecipe) return;
    setRawText(`Testing ${dailyRecipe.title}: Beans ${dailyRecipe.recommended_bean || dailyRecipe.recommendation_bean || 'Single Origin'}, ${dailyRecipe.dose_grams}g coffee, ${dailyRecipe.water_grams}g water (${dailyRecipe.ratio}) at ${dailyRecipe.water_temp_c}C on ${dailyRecipe.method}, grind ${dailyRecipe.grind_size}. Target time ${dailyRecipe.brew_time_target}.`);
    setMobileTab('capture');
  };

  const filteredExperiments = experiments.filter(exp => {
    const query = searchQuery.toLowerCase();
    const matchQuery = (exp.bean_name || '').toLowerCase().includes(query) ||
      (exp.raw_notes || '').toLowerCase().includes(query);
    const matchMethod = !selectedMethod || (exp.method || '').toLowerCase() === selectedMethod.toLowerCase();
    return matchQuery && matchMethod;
  });

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">

      {/* Top Navbar */}
      <header className="border-b border-zinc-800/80 bg-[#0c0c0e]/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-700/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight">BrewLab</span>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Local AI
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">Open-Source Coffee Experiment Assistant</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 transition-all flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Import</span>
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
            <button onClick={handleExport} className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 transition-all flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export Dataset</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Tab Switcher */}
      <div className="lg:hidden max-w-7xl mx-auto px-4 pt-4 w-full">
        <div className="grid grid-cols-2 p-1 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setMobileTab('experiments')}
            className={`py-2 rounded-lg transition-all ${mobileTab === 'experiments' ? 'bg-amber-600 text-white shadow' : 'text-zinc-400'}`}>
            🔬 Experiments
          </button>
          <button
            onClick={() => setMobileTab('capture')}
            className={`py-2 rounded-lg transition-all ${mobileTab === 'capture' ? 'bg-amber-600 text-white shadow' : 'text-zinc-400'}`}>
            📝 Capture & Feed
          </button>
        </div>
      </div>

      {/* Main Grid Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:py-8 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Capture Notebook & Daily Feed */}
          <div className={`space-y-6 lg:col-span-5 ${mobileTab === 'capture' ? 'block' : 'hidden lg:block'}`}>

            {/* Pillar 1: Capture Card */}
            <section className="bg-[#121215] border border-zinc-800/90 rounded-2xl p-5 sm:p-6 shadow-xl relative">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                    <span>📝</span> Capture Messy Notes
                  </h2>
                  <p className="text-xs text-zinc-400">Natural language input. AI extracts structured parameters automatically.</p>
                </div>
                <span className="text-[10px] mono bg-zinc-800/80 text-zinc-400 px-2 py-0.5 rounded">Pillar 1</span>
              </div>

              <form onSubmit={handleCapture} className="space-y-3">
                <textarea
                  rows={4}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="e.g. Brewed Gayo Wine 15g with 225g water at 92C on V60. Grind medium fine 18 clicks. Time 2m 30s. Bright acidity, winey aroma, sweet finish. Rating 8.5/10."
                  className="w-full bg-[#0a0a0c] border border-zinc-800 rounded-xl p-3.5 text-xs sm:text-sm text-zinc-200 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 transition-all leading-relaxed"
                />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-medium text-zinc-400 truncate max-w-[200px]">{captureStatus}</span>
                  <button
                    type="submit"
                    disabled={isCapturing || !rawText.trim()}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/20 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer">
                    {isCapturing ? 'Extracting with AI...' : 'Extract & Save'}
                  </button>
                </div>
              </form>
            </section>

            {/* Daily Feed Card */}
            <section className="bg-gradient-to-b from-[#161412] to-[#121215] border border-amber-900/30 rounded-2xl p-5 sm:p-6 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-bold text-amber-200 uppercase tracking-wider">Daily Recipe Feed</h3>
                </div>
                <button
                  onClick={fetchDailyRecipe}
                  disabled={feedLoading}
                  className="text-[11px] text-amber-400/80 hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer">
                  <RefreshCw className={`w-3 h-3 ${feedLoading ? 'animate-spin' : ''}`} /> Refresh
                </button>
              </div>

              {dailyRecipe && (
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-bold text-zinc-100">{dailyRecipe.title || 'Specialty Daily Brew'}</h4>
                    <p className="text-xs text-amber-400/90 font-medium">{dailyRecipe.recommended_bean || dailyRecipe.recommendation_bean || 'Single Origin'}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-[#09090b]/80 border border-zinc-800/60 p-2.5 rounded-xl text-center text-xs mono">
                    <div>
                      <div className="text-[10px] text-zinc-500">Dose / Water</div>
                      <div className="font-bold text-zinc-200">{dailyRecipe.dose_grams}g / {dailyRecipe.water_grams}g</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-500">Temp</div>
                      <div className="font-bold text-zinc-200">{dailyRecipe.water_temp_c}°C</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-500">Method</div>
                      <div className="font-bold text-zinc-200">{dailyRecipe.method || 'V60'}</div>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed italic bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-800/40">
                    🎯 Flavor: {dailyRecipe.flavor_profile_target || '-'} | Tip: {dailyRecipe.pro_tip || '-'}
                  </p>

                  <button
                    onClick={applyDailyRecipeToCapture}
                    className="w-full py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5">
                    Use This Recipe in Capture Form <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </section>

          </div>

          {/* Right Column: Filter Bar & Experiments Grid */}
          <div className={`space-y-4 lg:col-span-7 ${mobileTab === 'experiments' ? 'block' : 'hidden lg:block'}`}>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121215] border border-zinc-800/90 rounded-2xl p-4">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-56">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search bean or notes..."
                    className="bg-[#09090b] border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500/60 w-full"
                  />
                </div>
                <select
                  value={selectedMethod}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  className="bg-[#09090b] border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-amber-500/60">
                  <option value="">All Methods</option>
                  <option value="V60">V60</option>
                  <option value="Aeropress">Aeropress</option>
                  <option value="Kalita">Kalita</option>
                  <option value="French Press">French Press</option>
                  <option value="Espresso">Espresso</option>
                </select>
              </div>
              <span className="text-xs text-zinc-400 font-medium whitespace-nowrap self-end sm:self-center">
                {filteredExperiments.length} experiments
              </span>
            </div>

            {/* Experiment Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {filteredExperiments.length === 0 ? (
                <div className="col-span-full py-12 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-2xl p-6">
                  <p className="text-xs">No matching experiments found.</p>
                </div>
              ) : (
                filteredExperiments.map(exp => {
                  const isSelected = selectedIds.includes(exp.id);
                  return (
                    <div
                      key={exp.id}
                      onClick={() => toggleSelect(exp.id)}
                      className={`cursor-pointer bg-[#121215] border ${isSelected ? 'border-amber-500 ring-1 ring-amber-500 bg-amber-500/[0.02]' : 'border-zinc-800/80'} rounded-2xl p-4 space-y-3 hover:border-zinc-700 transition-all flex flex-col justify-between`}>

                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-bold text-sm text-zinc-100 line-clamp-1">{exp.bean_name || 'Unknown Bean'}</h3>
                            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 pt-0.5">
                              <span className="text-amber-400 font-semibold">{exp.method || 'V60'}</span>
                              <span>•</span>
                              <span>{exp.roast_level || 'Medium'}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => handleDelete(exp.id, exp.bean_name, e)}
                              title="Delete Experiment"
                              className="text-zinc-500 hover:text-red-400 p-1 rounded hover:bg-zinc-800/80 transition-colors text-xs">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(exp.id)}
                              className="w-4 h-4 rounded accent-amber-500 bg-zinc-800 border-zinc-700 cursor-pointer"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-1.5 text-[11px] text-zinc-300 bg-[#09090b] p-2 rounded-xl border border-zinc-800/60 text-center mono">
                          <div><span className="text-[9px] text-zinc-500 block">Dose</span>{exp.dose_grams || '-'}g</div>
                          <div><span className="text-[9px] text-zinc-500 block">Water</span>{exp.water_grams || '-'}g</div>
                          <div><span className="text-[9px] text-zinc-500 block">Ratio</span>{exp.ratio || '-'}</div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-zinc-400 px-0.5">
                          <div>Temp: <span className="text-zinc-200">{exp.water_temp_c ? `${exp.water_temp_c}°C` : '-'}</span></div>
                          <div>Grind: <span className="text-zinc-200">{exp.grind_size || '-'}</span></div>
                          {exp.rating && <div className="text-amber-400 font-bold">★ {exp.rating}/10</div>}
                        </div>

                        {exp.sensory_notes && exp.sensory_notes.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {exp.sensory_notes.map((note, idx) => (
                              <span key={idx} className="bg-zinc-800/80 text-zinc-300 px-2 py-0.5 rounded text-[10px]">
                                {note}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="text-[10px] text-zinc-500 border-t border-zinc-800/60 pt-2 line-clamp-2 italic">
                        "{exp.raw_notes}"
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>

        </div>
      </main>

      {/* Sticky Bottom Compare Bar */}
      <div className={`fixed bottom-0 inset-x-0 bg-[#0c0c0e]/95 backdrop-blur-md border-t border-amber-500/30 p-4 z-30 transition-transform duration-300 ${selectedIds.length === 2 ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Scale className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-xs font-bold text-zinc-100">2 Experiments Selected</div>
              <div className="text-[11px] text-zinc-400">Ready for variable deltas & extraction science audit</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 text-xs font-medium cursor-pointer">
              Cancel
            </button>
            <button
              onClick={handleCompare}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/30 flex items-center gap-1.5 transition-all cursor-pointer">
              Compare & Audit Now <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Compare Modal */}
      {compareModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#121215] border border-zinc-800 rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-zinc-100">Experiment Comparison & Audit</h3>
              </div>
              <button onClick={() => setCompareModalOpen(false)} className="text-zinc-400 hover:text-zinc-100 p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {isComparing ? (
              <div className="py-12 text-center space-y-3">
                <div className="inline-block animate-spin text-3xl text-amber-500">☕</div>
                <p className="text-xs sm:text-sm text-zinc-400">Analyzing extraction variables with Local AI...</p>
              </div>
            ) : comparisonResult ? (
              <div className="space-y-5">
                {/* Side-by-side Table */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#09090b] p-4 rounded-xl border border-zinc-800 text-xs">
                  <div className="space-y-1.5 p-2 bg-[#121215] rounded-lg">
                    <div className="font-bold text-zinc-100 pb-1 border-b border-zinc-800">
                      Brew A ({comparisonResult.experiment_a.bean_name})
                    </div>
                    <div>Method: <span className="text-zinc-200">{comparisonResult.experiment_a.method}</span></div>
                    <div>Dose: <span className="text-zinc-200">{comparisonResult.experiment_a.dose_grams}g</span></div>
                    <div>Water: <span className="text-zinc-200">{comparisonResult.experiment_a.water_grams}g ({comparisonResult.experiment_a.ratio})</span></div>
                    <div>Temp: <span className="text-zinc-200">{comparisonResult.experiment_a.water_temp_c}°C</span></div>
                    <div>Grind: <span className="text-zinc-200">{comparisonResult.experiment_a.grind_size}</span></div>
                    <div>Time: <span className="text-zinc-200">{comparisonResult.experiment_a.brew_time_seconds}s</span></div>
                    <div>Rating: <span className="text-amber-400">{comparisonResult.experiment_a.rating || '-'}/10</span></div>
                  </div>

                  <div className="space-y-1.5 p-2 bg-[#121215] rounded-lg">
                    <div className="font-bold text-zinc-100 pb-1 border-b border-zinc-800">
                      Brew B ({comparisonResult.experiment_b.bean_name})
                    </div>
                    <div>Method: <span className="text-zinc-200">{comparisonResult.experiment_b.method}</span></div>
                    <div>
                      Dose: <span className="text-zinc-200">{comparisonResult.experiment_b.dose_grams}g</span>
                      {comparisonResult.parameter_diff?.dose_delta !== null && (
                        <span className="text-amber-400 ml-1">({comparisonResult.parameter_diff.dose_delta >= 0 ? '+' : ''}{comparisonResult.parameter_diff.dose_delta}g)</span>
                      )}
                    </div>
                    <div>
                      Water: <span className="text-zinc-200">{comparisonResult.experiment_b.water_grams}g</span>
                      {comparisonResult.parameter_diff?.water_delta !== null && (
                        <span className="text-amber-400 ml-1">({comparisonResult.parameter_diff.water_delta >= 0 ? '+' : ''}{comparisonResult.parameter_diff.water_delta}g)</span>
                      )}
                    </div>
                    <div>
                      Temp: <span className="text-zinc-200">{comparisonResult.experiment_b.water_temp_c}°C</span>
                      {comparisonResult.parameter_diff?.temp_delta !== null && (
                        <span className="text-amber-400 ml-1">({comparisonResult.parameter_diff.temp_delta >= 0 ? '+' : ''}{comparisonResult.parameter_diff.temp_delta}°C)</span>
                      )}
                    </div>
                    <div>Grind: <span className="text-zinc-200">{comparisonResult.experiment_b.grind_size}</span></div>
                    <div>
                      Time: <span className="text-zinc-200">{comparisonResult.experiment_b.brew_time_seconds}s</span>
                      {comparisonResult.parameter_diff?.time_delta !== null && (
                        <span className="text-amber-400 ml-1">({comparisonResult.parameter_diff.time_delta >= 0 ? '+' : ''}{comparisonResult.parameter_diff.time_delta}s)</span>
                      )}
                    </div>
                    <div>Rating: <span className="text-amber-400">{comparisonResult.experiment_b.rating || '-'}/10</span></div>
                  </div>
                </div>

                {/* AI Explain */}
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 space-y-1.5">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5" /> Explain (Extraction Science)
                  </h4>
                  <p className="text-xs leading-relaxed text-zinc-200">
                    {comparisonResult.analysis?.extraction_explanation || '-'}
                  </p>
                </div>

                {/* AI Audit & Recommendation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-1.5">
                    <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Stethoscope className="w-3.5 h-3.5" /> Diagnostic Audit
                    </h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {comparisonResult.analysis?.audit || '-'}
                    </p>
                  </div>

                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 space-y-2 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5" /> Next Brew Recommendation
                      </h4>
                      <p className="text-xs text-zinc-200 leading-relaxed">
                        {comparisonResult.analysis?.next_recommendation || '-'}
                      </p>
                    </div>

                    <button
                      onClick={applyDialInToCapture}
                      className="mt-2 py-1.5 px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all text-left cursor-pointer flex items-center justify-between">
                      <span>Apply as Next Brew Base</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            ) : null}
          </div>
        </div>
      )}

    </div>
  );
}
