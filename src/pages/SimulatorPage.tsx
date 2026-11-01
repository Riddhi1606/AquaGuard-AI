import React, { useState, useEffect } from 'react';
import {
  Sliders, CloudRain, AlertTriangle, ArrowRight, CheckCircle2,
  Play, RefreshCw, BarChart2, ShieldAlert, Layers, Info
} from 'lucide-react';
import { api } from '../services/api';
import { SimulationResponse, RoadSegment } from '../types';
import { LeafletMap } from '../maps/LeafletMap';
import { RiskBadge } from '../components/RiskBadge';

export const SimulatorPage: React.FC = () => {
  const [rainScenario, setRainScenario] = useState<number>(60.0);
  const [duration, setDuration] = useState<number>(2.0);
  const [blockage, setBlockage] = useState<number>(0.4);
  const [antecedent, setAntecedent] = useState<number>(25.0);

  const [simResult, setSimResult] = useState<SimulationResponse | null>(null);
  const [running, setRunning] = useState<boolean>(false);
  const [selectedSeg, setSelectedSeg] = useState<RoadSegment | null>(null);

  const runSimulation = async (rain: number, dur: number, blk: number, ant: number) => {
    setRunning(true);
    try {
      const res = await api.simulateScenario({
        rainfall_scenario_mm: rain,
        duration_hours: dur,
        drainage_blockage_factor: blk,
        antecedent_rainfall_mm: ant
      });
      setSimResult(res);
      if (res.segments.length > 0) {
        setSelectedSeg(res.segments[0]);
      }
    } catch (err) {
      console.error('Simulation failed:', err);
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    runSimulation(rainScenario, duration, blockage, antecedent);
  }, []);

  const handleApplyPreset = (rain: number, blk: number) => {
    setRainScenario(rain);
    setBlockage(blk);
    runSimulation(rain, duration, blk, antecedent);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-400 bg-purple-950/80 px-2.5 py-1 rounded-full border border-purple-800 mb-2">
          <Sliders className="w-3.5 h-3.5" />
          DIGITAL TWIN MONSOON SIMULATOR
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          Rainfall Scenario Simulator & Stress Tester
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
          Stress-test the entire Jaipur urban drainage network under hypothetical rainfall downpours.
          Observe how localized underpasses and river basin outfalls escalate into critical flood corridors.
        </p>
      </div>

      {/* Preset Scenario Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Scenario 1: Light Rain', rain: 20, blk: 0.1, color: 'border-emerald-500/40 text-emerald-400', desc: '20 mm rain, clean drains' },
          { label: 'Scenario 2: Moderate Downpour', rain: 40, blk: 0.25, color: 'border-amber-500/40 text-amber-400', desc: '40 mm rain, moderate runoff' },
          { label: 'Scenario 3: Severe Monsoon Storm', rain: 60, blk: 0.5, color: 'border-orange-500/40 text-orange-400', desc: '60 mm rain, 50% silted canals' },
          { label: 'Scenario 4: Flash Cloudburst', rain: 100, blk: 0.75, color: 'border-rose-500/50 text-rose-400', desc: '100 mm cloudburst + blocked canals' },
        ].map((sc, i) => (
          <button
            key={i}
            onClick={() => handleApplyPreset(sc.rain, sc.blk)}
            className={`p-4 rounded-2xl bg-[#0f172a] border text-left transition-all hover:bg-slate-900 ${
              rainScenario === sc.rain ? `${sc.color} ring-1 ring-cyan-500/50` : 'border-slate-800 text-slate-300'
            }`}
          >
            <div className="text-xs font-bold">{sc.label}</div>
            <div className="text-xl font-extrabold font-mono mt-1 text-white">{sc.rain} mm</div>
            <div className="text-[11px] text-slate-400 mt-1">{sc.desc}</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Custom Slider Controls */}
        <div className="rounded-3xl bg-[#0f172a] border border-slate-800 p-6 space-y-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Hypothetical Scenario Controls
          </h2>

          <div className="space-y-4 text-xs">
            {/* Rainfall slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-300 font-medium">Precipitation Volume:</span>
                <span className="font-mono text-cyan-300 font-bold">{rainScenario} mm</span>
              </div>
              <input
                type="range"
                min="10"
                max="180"
                step="5"
                value={rainScenario}
                onChange={(e) => setRainScenario(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 bg-slate-800 rounded-lg h-2"
              />
            </div>

            {/* Duration slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-300 font-medium">Downpour Duration:</span>
                <span className="font-mono text-cyan-300 font-bold">{duration} hours</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="6"
                step="0.5"
                value={duration}
                onChange={(e) => setDuration(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 bg-slate-800 rounded-lg h-2"
              />
            </div>

            {/* Blockage slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-300 font-medium">Drainage Siltation / Clogging:</span>
                <span className="font-mono text-rose-300 font-bold">{(blockage * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={blockage}
                onChange={(e) => setBlockage(parseFloat(e.target.value))}
                className="w-full accent-rose-400 bg-slate-800 rounded-lg h-2"
              />
            </div>

            {/* Antecedent Soil Saturation */}
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-300 font-medium">Antecedent 24h Rain:</span>
                <span className="font-mono text-amber-300 font-bold">{antecedent} mm</span>
              </div>
              <input
                type="range"
                min="0"
                max="120"
                step="5"
                value={antecedent}
                onChange={(e) => setAntecedent(parseFloat(e.target.value))}
                className="w-full accent-amber-400 bg-slate-800 rounded-lg h-2"
              />
            </div>

            <button
              onClick={() => runSimulation(rainScenario, duration, blockage, antecedent)}
              disabled={running}
              className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              {running ? 'Recalculating City Risk...' : 'Run Simulation'}
            </button>
          </div>

          {/* Delta Statistics */}
          {simResult && (
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Network Category Shifts
              </h3>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Critical Roads</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-lg font-bold text-slate-500 font-mono">
                      {simResult.category_counts_before['CRITICAL']}
                    </span>
                    <span className="text-slate-600">&rarr;</span>
                    <span className="text-xl font-bold text-rose-400 font-mono">
                      {simResult.category_counts_after['CRITICAL']}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">High Risk Roads</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-lg font-bold text-slate-500 font-mono">
                      {simResult.category_counts_before['HIGH']}
                    </span>
                    <span className="text-slate-600">&rarr;</span>
                    <span className="text-xl font-bold text-orange-400 font-mono">
                      {simResult.category_counts_after['HIGH']}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Explicit Simulation Disclaimer */}
          <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/20 text-xs text-purple-200 flex items-start gap-2">
            <Info className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Simulation Notice:</strong> Outputs reflect hypothetical "what-if" monsoonal conditions, not live meteorological forecasts.
            </p>
          </div>
        </div>

        {/* Map & Escalated Segments Column */}
        <div className="lg:col-span-2 space-y-6">
          <LeafletMap
            segments={simResult?.segments || []}
            selectedSegment={selectedSeg}
            onSelectSegment={(s) => setSelectedSeg(s)}
            height="550px"
          />

          {/* Escalated Segments List */}
          {simResult && simResult.escalated_segments.length > 0 && (
            <div className="rounded-3xl bg-[#0f172a] border border-slate-800 p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                Most Vulnerable Escalated Road Segments Under This Scenario:
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {simResult.escalated_segments.slice(0, 6).map((es) => (
                  <div
                    key={es.segment_id}
                    className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">{es.road_name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Cause: {es.primary_cause}
                      </div>
                    </div>
                    <RiskBadge category={es.risk_category} score={es.risk_score} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
