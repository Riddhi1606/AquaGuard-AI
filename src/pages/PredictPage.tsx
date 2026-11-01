import React, { useState, useEffect } from 'react';
import {
  Cpu, Sliders, ShieldAlert, ArrowRight, CheckCircle2,
  AlertTriangle, RefreshCw, Layers, HelpCircle, BarChart2
} from 'lucide-react';
import { api } from '../services/api';
import { RoadSegment, WeatherCurrent, RiskCategory } from '../types';
import { RiskBadge } from '../components/RiskBadge';

export const PredictPage: React.FC = () => {
  const [segments, setSegments] = useState<RoadSegment[]>([]);
  const [selectedSegId, setSelectedSegId] = useState<string>('JPR-RD-001');
  const [weather, setWeather] = useState<WeatherCurrent | null>(null);

  // Custom simulation sliders
  const [rainIntensity, setRainIntensity] = useState<number>(35.0);
  const [rain3h, setRain3h] = useState<number>(60.0);
  const [drainCondition, setDrainCondition] = useState<string>('partially_blocked');
  const [modelType, setModelType] = useState<string>('hybrid');

  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [calculating, setCalculating] = useState<boolean>(false);

  useEffect(() => {
    const init = async () => {
      try {
        const [segs, w] = await Promise.all([
          api.getRoadSegments(),
          api.getCurrentWeather()
        ]);
        setSegments(segs);
        setWeather(w);
        if (w) {
          setRainIntensity(w.hourly_rate_mm || 25.0);
          setRain3h(w.rainfall_cum_3h_mm || 45.0);
        }
      } catch (err) {
        console.error('Failed to init prediction workbench:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const runPrediction = async () => {
    if (!selectedSegId) return;
    setCalculating(true);
    try {
      const res = await api.predictCustom({
        segment_id: selectedSegId,
        custom_rainfall_intensity: rainIntensity,
        custom_rainfall_3h: rain3h,
        custom_drainage_condition: drainCondition,
        model_type: modelType
      });
      setPrediction(res);
    } catch (err) {
      console.error('Prediction failed:', err);
    } finally {
      setCalculating(false);
    }
  };

  useEffect(() => {
    if (selectedSegId && !loading) {
      runPrediction();
    }
  }, [selectedSegId, rainIntensity, rain3h, drainCondition, modelType, loading]);

  const selectedRoad = segments.find(s => s.segment_id === selectedSegId);

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded-full border border-cyan-800 mb-2">
              <Cpu className="w-3.5 h-3.5" />
              AI & PHYSICAL HYDROLOGY WORKBENCH
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Hyperlocal Flood Risk Prediction Engine
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Simulate how different precipitation intensities and stormwater drainage conditions alter flood probabilities
              for individual streets across Jaipur.
            </p>
          </div>

          {/* Model Type Selector */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-[#070b14] p-1.5 rounded-2xl border border-slate-800 text-xs">
            <span className="text-slate-400 px-2 font-medium">Model:</span>
            {[
              { id: 'hybrid', label: 'Hybrid AI (Recommended)' },
              { id: 'ml_xgboost', label: 'Supervised ML' },
              { id: 'baseline_rules', label: 'Baseline Hydrology' }
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setModelType(m.id)}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                  modelType === m.id
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls Column */}
        <div className="rounded-3xl bg-[#0f172a] border border-slate-800 p-6 space-y-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Simulation Parameters
          </h2>

          {/* Road Segment Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Select Jaipur Road Segment:
            </label>
            <select
              value={selectedSegId}
              onChange={(e) => setSelectedSegId(e.target.value)}
              className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              {segments.map((s) => (
                <option key={s.segment_id} value={s.segment_id}>
                  {s.name} ({s.segment_id}) {s.underpass ? '⚡ Underpass' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Rainfall Intensity Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-slate-300">Rainfall Intensity</span>
              <span className="font-mono text-cyan-300 font-bold">{rainIntensity} mm/h</span>
            </div>
            <input
              type="range"
              min="0"
              max="150"
              step="5"
              value={rainIntensity}
              onChange={(e) => setRainIntensity(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 bg-slate-800 rounded-lg h-2 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0 (Dry)</span>
              <span>30 (Heavy)</span>
              <span>75 (Downpour)</span>
              <span>150 (Cloudburst)</span>
            </div>
          </div>

          {/* 3-Hour Cumulative Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-slate-300">3-Hour Cumulative Rainfall</span>
              <span className="font-mono text-amber-300 font-bold">{rain3h} mm</span>
            </div>
            <input
              type="range"
              min="0"
              max="250"
              step="5"
              value={rain3h}
              onChange={(e) => setRain3h(parseFloat(e.target.value))}
              className="w-full accent-amber-400 bg-slate-800 rounded-lg h-2 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0 mm</span>
              <span>50 mm</span>
              <span>120 mm</span>
              <span>250 mm</span>
            </div>
          </div>

          {/* Drainage Condition */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Stormwater Drain Condition:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'good', label: 'Good (Clean)' },
                { id: 'adequate', label: 'Adequate' },
                { id: 'partially_blocked', label: 'Partially Silted' },
                { id: 'poor', label: 'Severely Blocked' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setDrainCondition(c.id)}
                  className={`p-2 rounded-xl text-xs font-medium border text-left transition-all ${
                    drainCondition === c.id
                      ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 font-semibold'
                      : 'bg-[#070b14] border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Scenario Buttons */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <span className="text-xs font-semibold text-slate-400 block">Quick Monsoonal Presets:</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setRainIntensity(15); setRain3h(25); setDrainCondition('adequate'); }}
                className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-[11px] text-slate-300 font-medium text-center"
              >
                Light Monsoon (15mm)
              </button>
              <button
                onClick={() => { setRainIntensity(45); setRain3h(80); setDrainCondition('partially_blocked'); }}
                className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-[11px] text-amber-300 font-medium text-center"
              >
                Heavy Storm (45mm)
              </button>
              <button
                onClick={() => { setRainIntensity(85); setRain3h(150); setDrainCondition('poor'); }}
                className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-[11px] text-rose-300 font-medium text-center col-span-2"
              >
                Flash Cloudburst (85mm + Blocked Drains)
              </button>
            </div>
          </div>
        </div>

        {/* Prediction Results & Explainability Column */}
        <div className="lg:col-span-2 space-y-6">
          {prediction ? (
            <div className="rounded-3xl bg-[#0f172a] border border-slate-800 p-8 space-y-6 shadow-2xl">
              {/* Top Banner Result */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div>
                  <span className="text-xs font-mono text-cyan-400">
                    TARGET: {prediction.segment_id}
                  </span>
                  <h2 className="text-2xl font-extrabold text-white mt-0.5">
                    {prediction.road_name}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    {prediction.model_type}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block font-medium">Waterlogging Risk</span>
                    <span className="text-3xl font-extrabold text-white font-mono">
                      {prediction.risk_score.toFixed(0)}%
                    </span>
                  </div>
                  <RiskBadge
                    category={prediction.risk_category}
                    score={prediction.risk_score}
                    size="lg"
                  />
                </div>
              </div>

              {/* Visual Risk Gauge Meter */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400 font-medium">
                  <span>Risk Spectrum</span>
                  <span>Category: <strong className="text-white">{prediction.risk_category}</strong></span>
                </div>
                <div className="relative h-4 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${Math.max(5, Math.min(100, prediction.risk_score))}%`,
                      backgroundColor:
                        prediction.risk_category === 'CRITICAL' ? '#ef4444' :
                        prediction.risk_category === 'HIGH' ? '#f97316' :
                        prediction.risk_category === 'MODERATE' ? '#eab308' : '#22c55e'
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0% (Low)</span>
                  <span>30% (Moderate)</span>
                  <span>60% (High)</span>
                  <span>80% (Critical)</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Explainable AI: Feature Attribution Breakdown */}
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-cyan-400" />
                  Explainable AI (SHAP & Topographic Attributions)
                </h3>
                <p className="text-xs text-slate-400">
                  Why this specific road corridor received this score under current parameters:
                </p>

                <div className="space-y-2.5">
                  {prediction.contributing_factors.map((f: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-slate-200">{f.factor}</span>
                        <span className={f.impact.includes('Increases') ? 'text-rose-400' : 'text-emerald-400'}>
                          {f.impact} ({f.contribution > 0 ? `+${f.contribution}` : f.contribution} pts)
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px] leading-relaxed">{f.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actionable Advisory */}
              <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs space-y-1.5">
                <div className="font-bold text-cyan-300 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-cyan-400" />
                  Recommended Operational Advisory:
                </div>
                <p className="text-slate-200 leading-relaxed text-xs">
                  {prediction.recommended_action}
                </p>
              </div>

              {/* Provenance & Data Readiness */}
              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Data Readiness: High (Verified Jaipur Geometries + Calibrated Physical Formulations)
                </span>
                <span className="font-mono">Prediction Horizon: Next 1-3 Hours</span>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 bg-[#0f172a] rounded-3xl border border-slate-800">
              <RefreshCw className="w-8 h-8 mx-auto animate-spin text-cyan-400 mb-2" />
              <span>Calculating hydrological risk metrics...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
