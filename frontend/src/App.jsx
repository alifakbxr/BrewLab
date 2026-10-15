import React, { useState, useEffect } from 'react';
import { 
  Coffee, Sparkles, Scale, Trash2, Download, Upload, 
  Search, RefreshCw, X, ArrowRight, Lightbulb, Stethoscope, Target, Check,
  Trophy, AlertTriangle, Plus, Package, SlidersHorizontal, Flame, Droplets, Clock
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';


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

    // Active main view: 'lab' | 'champions' | 'beans'
  const [activeTab, setActiveTab] = useState('lab');

  // Bean Inventory States
  const [beans, setBeans] = useState([]);
  const [beansLoading, setBeansLoading] = useState(false);
  const [newBeanName, setNewBeanName] = useState('');
  const [newBeanRoast, setNewBeanRoast] = useState('Medium');
  const [newBeanStock, setNewBeanStock] = useState(200);

  // World Champions States
  const [championRecipes, setChampionRecipes] = useState([]);
  const [championsLoading, setChampionsLoading] = useState(false);
  const [championFilter, setChampionFilter] = useState('');


  useEffect(() => {
    fetchExperiments();
    fetchDailyRecipe();
    fetchBeans();
    fetchChampionRecipes();
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

    const fetchBeans = async () => {
    setBeansLoading(true);
    try {
      const res = await fetch('/api/beans');
      if (res.ok) setBeans(await res.json());
    } catch (e) {
      console.error('Error fetching beans:', e);
    } finally {
      setBeansLoading(false);
    }
  };

  const fetchChampionRecipes = async () => {
    setChampionsLoading(true);
    try {
      const res = await fetch('/api/recipes/champions');
      if (res.ok) setChampionRecipes(await res.json());
    } catch (e) {
      console.error('Error fetching champions:', e);
    } finally {
      setChampionsLoading(false);
    }
  };

  const seedBeansCatalog = async () => {
    try {
      const res = await fetch('/api/beans/seed-catalog', { method: 'POST' });
      const data = await res.json();
      alert(data.message);
      fetchBeans();
    } catch (e) {
      alert('Failed to load bean catalog: ' + e.message);
    }
  };

  const updateStock = async (beanId, newStock) => {
    try {
      await fetch(`/api/beans/${beanId}/stock?stock_grams=${newStock}`, { method: 'PATCH' });
      fetchBeans();
    } catch (e) {
      console.error('Failed to update stock:', e);
    }
  };

  const deleteBean = async (beanId, beanName) => {
    if (!confirm(`Delete ${beanName} from pantry?`)) return;
    try {
      await fetch(`/api/beans/${beanId}`, { method: 'DELETE' });
      fetchBeans();
    } catch (e) {
      console.error('Failed to delete bean:', e);
    }
  };

  const applyChampionRecipeToCapture = (champ) => {
    setRawText(`Brewed ${champ.bean_name} using ${champ.method} following ${champ.barista}'s (${champ.achievement}) method. Used ${champ.dose_grams}g coffee to ${champ.water_grams}g water (ratio ${champ.ratio}) at ${champ.water_temp_c}°C with ${champ.grind_size} grind. Target brew time ${champ.brew_time_target}. Technique: ${champ.technique_notes}.`);
    setActiveTab('lab');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">

      {/* Top Navbar */}
      <header className="border-b border-zinc-800/80 bg-[#0c0c0e]/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('lab')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-600/20 ring-1 ring-amber-400/30">
              <Coffee className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                BrewLab <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">AI Experiment Lab</span>
              </h1>
            </div>
          </div>

          {/* Primary View Navigation Tabs */}
          <nav className="flex items-center gap-1.5 p-1 bg-zinc-900/90 border border-zinc-800 rounded-xl">
            <button 
              onClick={() => setActiveTab('lab')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'lab' ? 'bg-amber-600 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'}`}>
              <Coffee className="w-3.5 h-3.5" />
              <span>Lab</span>
            </button>
            <button 
              onClick={() => setActiveTab('champions')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'champions' ? 'bg-amber-600 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'}`}>
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              <span>Champions</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-yellow-400/20 text-yellow-300 font-bold">{championRecipes.length}</span>
            </button>
            <button 
              onClick={() => setActiveTab('beans')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'beans' ? 'bg-amber-600 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'}`}>
              <Package className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pantry</span>
              {beans.some(b => b.stock_grams < 30) && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              )}
            </button>
          </nav>

          {/* Dataset Action Tools */}
          <div className="hidden sm:flex items-center gap-2">
            <button 
              onClick={handleExport}
              title="Export JSON Dataset"
              className="px-2.5 py-1.5 rounded-xl border border-zinc-800 hover:bg-zinc-800/80 text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer">
              <Download className="w-3.5 h-3.5 text-zinc-400" /> Export
            </button>
            <label 
              title="Import JSON Dataset"
              className="px-2.5 py-1.5 rounded-xl border border-zinc-800 hover:bg-zinc-800/80 text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-zinc-400" /> Import
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
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

      {/* Global Low Stock Notification Banner */}
      {beans.filter(b => b.stock_grams < 30).length > 0 && (
        <div className="bg-gradient-to-r from-red-950/40 via-amber-950/30 to-red-950/40 border-b border-red-500/20 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-amber-200">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 animate-bounce" />
              <span>
                <strong>Low Bean Stock Alert:</strong> {beans.filter(b => b.stock_grams < 30).map(b => `${b.name} (${b.stock_grams}g left)`).join(', ')}.
              </span>
            </div>
            <button 
              onClick={() => setActiveTab('beans')}
              className="text-[11px] underline text-amber-300 hover:text-white font-semibold cursor-pointer">
              Manage Stock &rarr;
            </button>
          </div>
        </div>
      )}


      {/* Main Grid Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:py-8 w-full flex-1">
        {activeTab === 'lab' && (
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
                    <Button
                      type="submit"
                      disabled={isCapturing || !rawText.trim()}
                      className="h-9 px-4 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-sm transition-all">
                      {isCapturing ? 'Analyzing with AI...' : 'Extract & Save Brew'}
                    </Button>

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
                      <Card 
                        key={exp.id}
                        onClick={() => toggleSelect(exp.id)}
                        className={`transition-all duration-200 cursor-pointer ${
                          isSelected 
                            ? 'border-amber-500/80 bg-amber-500/[0.03] ring-1 ring-amber-500/30' 
                            : 'border-zinc-800/80 bg-[#0f1117] hover:border-zinc-700'
                        }`}>
                        <CardHeader className="p-4 pb-2 flex-row items-start justify-between space-y-0">
                          <div>
                            <CardTitle className="text-sm font-semibold tracking-tight text-zinc-100 line-clamp-1">
                              {exp.bean_name || 'Unknown Bean'}
                            </CardTitle>
                            <div className="flex items-center gap-1.5 pt-1">
                              <Badge variant="default" className="text-[10px] py-0 px-1.5 font-mono">
                                {exp.method || 'V60'}
                              </Badge>
                              <span className="text-zinc-600 text-xs">•</span>
                              <span className="text-[11px] text-zinc-400 font-medium">{exp.roast_level || 'Medium'}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={(e) => handleDelete(exp.id, exp.bean_name, e)}
                              className="h-7 w-7 text-zinc-500 hover:text-red-400 hover:bg-zinc-800">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                            <Checkbox 
                              checked={isSelected}
                              onCheckedChange={() => toggleSelect(exp.id)}
                            />
                          </div>
                        </CardHeader>

                        <CardContent className="p-4 pt-1 space-y-3">
                          {/* Clean Monospace Lab Metrics Bar */}
                          <div className="grid grid-cols-3 gap-1.5 p-2 rounded-lg bg-[#090a0d] border border-zinc-800/80 text-center mono text-xs">
                            <div>
                              <span className="text-[9px] text-zinc-500 uppercase block tracking-wider">Dose</span>
                              <span className="font-semibold text-zinc-200">{exp.dose_grams || '-'}g</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-zinc-500 uppercase block tracking-wider">Water</span>
                              <span className="font-semibold text-zinc-200">{exp.water_grams || '-'}g</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-zinc-500 uppercase block tracking-wider">Ratio</span>
                              <span className="font-semibold text-amber-400">{exp.ratio || '-'}</span>
                            </div>
                          </div>

                          {/* Secondary Metrics */}
                          <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                            <span>{exp.water_temp_c ? `${exp.water_temp_c}°C` : 'Temp -'}</span>
                            <span>{exp.grind_size || 'Grind -'}</span>
                            {exp.rating && (
                              <span className="text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                ★ {exp.rating}/10
                              </span>
                            )}
                          </div>

                          {/* Flavor Notes Badges */}
                          {exp.sensory_notes && exp.sensory_notes.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {exp.sensory_notes.map((note, idx) => (
                                <Badge key={idx} variant="secondary" className="text-[10px] font-normal text-zinc-300 bg-zinc-900 border border-zinc-800">
                                  {note}
                                </Badge>
                              ))}
                            </div>
                          )}

                          <div className="text-[10px] text-zinc-500 border-t border-zinc-800/60 pt-2 line-clamp-2 italic font-sans">
                            &ldquo;{exp.raw_notes}&rdquo;
                          </div>
                        </CardContent>
                      </Card>

                    );
                  })
                )}
              </div>

            </div>

          </div>
        )}

                {/* TAB 2: WORLD CHAMPION RECIPES ARCHIVE (2000 - 2026) */}
        {activeTab === 'champions' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121215] border border-zinc-800/90 rounded-2xl p-5">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  World Champions & Legend Baristas Archive
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Master techniques from the inaugural WBC 2000 in Monte Carlo to the cutting edge of modern specialty brewing.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={championFilter} 
                  onChange={(e) => setChampionFilter(e.target.value)}
                  placeholder="Filter champion or method..."
                  className="bg-[#09090b] border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500/60"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {championRecipes
                .filter(c => !championFilter || c.barista.toLowerCase().includes(championFilter.toLowerCase()) || c.title.toLowerCase().includes(championFilter.toLowerCase()) || c.method.toLowerCase().includes(championFilter.toLowerCase()))
                .map((champ) => (
                  <div key={champ.id} className="bg-[#121215] border border-zinc-800/80 hover:border-amber-500/50 rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-all group">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                            {champ.year} • {champ.method}
                          </span>
                          <h3 className="text-sm font-bold text-white mt-1.5 group-hover:text-amber-300 transition-colors">
                            {champ.title}
                          </h3>
                          <p className="text-xs font-semibold text-zinc-300">{champ.barista}</p>
                          <p className="text-[11px] text-zinc-500">{champ.achievement}</p>
                        </div>
                      </div>

                      {/* Specs Matrix */}
                      <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/60 text-[11px]">
                        <div>
                          <span className="text-zinc-500 block text-[9px] uppercase">Dose/Water</span>
                          <span className="font-semibold text-zinc-200">{champ.dose_grams}g / {champ.water_grams}g</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block text-[9px] uppercase">Ratio / Temp</span>
                          <span className="font-semibold text-zinc-200">{champ.ratio} @ {champ.water_temp_c}°C</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block text-[9px] uppercase">Grind / Time</span>
                          <span className="font-semibold text-zinc-200">{champ.grind_size} ({champ.brew_time_target})</span>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <p className="text-zinc-400 text-[11px] leading-relaxed">
                          <strong className="text-zinc-300">Technique:</strong> {champ.technique_notes}
                        </p>
                        <p className="text-amber-300/90 text-[11px] italic bg-amber-950/20 p-2 rounded-lg border border-amber-500/10">
                          &ldquo;{champ.pro_tip}&rdquo;
                        </p>
                      </div>
                    </div>

                    <button 
                      onClick={() => applyChampionRecipeToCapture(champ)}
                      className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                      Brew This Champion Recipe <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
              ))}
            </div>
          </div>
        )}

                {/* TAB 3: BEAN PANTRY & STOCK MANAGEMENT */}
        {activeTab === 'beans' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121215] border border-zinc-800/90 rounded-2xl p-5">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-emerald-400" />
                  Coffee Bean Pantry & Inventory
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Track remaining grams, roast profiles, and get low-stock replenishment warnings automatically.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="emerald"
                  onClick={seedBeansCatalog}
                  className="h-9 px-3.5 text-xs font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Load Curated World Catalog
                </Button>

              </div>
            </div>

            {beans.length === 0 ? (
              <div className="text-center py-16 bg-[#121215] border border-zinc-800/90 rounded-2xl p-6">
                <Package className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-zinc-300">Your coffee pantry is empty</h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto mb-4">
                  Add beans manually or click the button below to load 5 world-famous specialty origins instantly.
                </p>
                <button 
                  onClick={seedBeansCatalog}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer">
                  Seed World Specialty Beans
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {beans.map((bean) => {
                  const isLow = bean.stock_grams < 30;
                  return (
                    <div key={bean.id} className={`bg-[#121215] border ${isLow ? 'border-red-500/50 bg-red-950/[0.04]' : 'border-zinc-800/80'} rounded-2xl p-5 space-y-4 flex flex-col justify-between`}>
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              {bean.origin} • {bean.process}
                            </span>
                            <h3 className="text-sm font-bold text-white mt-1.5">{bean.name}</h3>
                            <p className="text-xs text-zinc-400">{bean.roaster} ({bean.roast_level} Roast)</p>
                          </div>
                          <button 
                            onClick={() => deleteBean(bean.id, bean.name)}
                            className="text-zinc-600 hover:text-red-400 p-1 transition-colors cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Stock Progress & Badge */}
                        <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-400 font-medium">Stock Remaining:</span>
                            <span className={`font-bold flex items-center gap-1 ${isLow ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                              {isLow && <AlertTriangle className="w-3 h-3" />}
                              {bean.stock_grams}g
                            </span>
                          </div>
                          <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all ${isLow ? 'bg-red-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(100, (bean.stock_grams / 250) * 100)}%` }}>
                            </div>
                          </div>
                          {isLow && (
                            <p className="text-[10px] font-semibold text-red-400">
                              ⚠️ Running low! Only ~{Math.floor(bean.stock_grams / 15)} brews left.
                            </p>
                          )}
                        </div>

                        {/* Sensory Notes */}
                        {bean.flavor_notes && bean.flavor_notes.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {bean.flavor_notes.map((note, idx) => (
                              <span key={idx} className="text-[10px] bg-zinc-800/80 text-zinc-300 px-2 py-0.5 rounded-md border border-zinc-700/50">
                                {note}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Quick Adjust Buttons */}
                      <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/60">
                        <button 
                          onClick={() => updateStock(bean.id, Math.max(0, bean.stock_grams - 15))}
                          className="flex-1 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[11px] font-semibold border border-zinc-800 transition-colors cursor-pointer">
                          -15g (1 Brew)
                        </button>
                        <button 
                          onClick={() => updateStock(bean.id, bean.stock_grams + 200)}
                          className="flex-1 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[11px] font-semibold border border-zinc-800 transition-colors cursor-pointer">
                          +200g (Bag)
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}


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
            <Button 
              onClick={handleCompare}
              className="h-9 px-4 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5">
              Compare & Audit <ArrowRight className="w-3.5 h-3.5" />
            </Button>

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
