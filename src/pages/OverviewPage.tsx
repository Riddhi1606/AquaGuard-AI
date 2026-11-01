import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert, CloudRain, Map, Compass, Sliders,
  ArrowRight, CheckCircle2, AlertTriangle, Cpu, Radio,
  Layers, Waves, Activity, Navigation, Building2
} from 'lucide-react';
import { api } from '../services/api';
import { RiskMapResponse, WeatherCurrent, RoadSegment } from '../types';
import { LeafletMap } from '../maps/LeafletMap';
import { RiskBadge } from '../components/RiskBadge';

export const OverviewPage: React.FC = () => {
  const [riskData, setRiskData] = useState<RiskMapResponse | null>(null);
  const [weather, setWeather] = useState<WeatherCurrent | null>(null);
  const [selectedSeg, setSelectedSeg] = useState<RoadSegment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [mapRes, weatherRes] = await Promise.all([
          api.getLiveRiskMap(),
          api.getCurrentWeather()
        ]);
        setRiskData(mapRes);
        setWeather(weatherRes);
        if (mapRes.segments.length > 0) {
          // Select Sodala underpass or highest risk segment by default
          const sodala = mapRes.segments.find(s => s.segment_id === 'JPR-RD-001') || mapRes.segments[0];
          setSelectedSeg(sodala);
        }
      } catch (err) {
        console.error('Failed to load overview data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="space-y-10 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#0b1329] via-[#0f172a] to-[#070b14] border border-slate-800 p-8 sm:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-semibold tracking-wide">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            JAIPUR HACKATHON PROTOTYPE
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
            Predict Before It Floods. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-400">
              Protect Every Street.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
            AquaGuard AI demonstrates how weather inputs, road-network context, terrain and drainage attributes,
            citizen reports, and machine-learning experiments could support a hyperlocal waterlogging workflow.
            This bundle uses Open-Meteo when reachable, illustrative Jaipur corridor attributes, and models trained
            on synthetic scenarios; its scores are not validated street-level flood forecasts.
          </p>

          {/* Quick CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/map"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all"
            >
              <Map className="w-4 h-4" />
              Explore Prototype Risk Map
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
            <Link
              to="/simulator"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm transition-all"
            >
              <Sliders className="w-4 h-4 text-cyan-400" />
              Simulate 60mm Cloudburst
            </Link>
            <Link
              to="/routes"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0f172a] hover:bg-slate-800 text-slate-300 border border-slate-700/80 text-sm font-medium transition-all"
            >
              <Compass className="w-4 h-4 text-amber-400" />
              Explore Risk-Weighted Route
            </Link>
          </div>
        </div>

        {/* Live Status KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10 pt-8 border-t border-slate-800/80">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="text-xs text-slate-400 font-medium">Monitored Jaipur Roads</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1 font-mono">
              {riskData?.total_segments ?? '—'}
            </div>
            <div className="text-[11px] text-cyan-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Illustrative demo corridors
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="text-xs text-slate-400 font-medium">Critical Risk Corridors</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-400 mt-1 font-mono">
              {riskData?.summary.CRITICAL ?? '—'}
            </div>
            <div className="text-[11px] text-rose-400/80 mt-1">
              Prototype score category only
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="text-xs text-slate-400 font-medium">Current-hour Precipitation</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-cyan-300 mt-1 font-mono">
              {weather ? `${weather.current_precipitation_mm}` : '—'} <span className="text-base text-slate-400">mm</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Source: {weather?.source || 'Open-Meteo API'}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="text-xs text-slate-400 font-medium">ML Evaluation</div>
            <div className="text-lg sm:text-xl font-extrabold text-emerald-400 mt-2 font-mono">
              Synthetic only
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Not real-world accuracy
            </div>
          </div>
        </div>
      </section>

      {/* Live Map Preview & Inspection Spotlight */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Map className="w-6 h-6 text-cyan-400" />
              Prototype Corridor Risk Map (Jaipur Demo)
            </h2>
            <p className="text-sm text-slate-400">
              Select any road segment to inspect elevation, slope, drain proximity, and AI contributing factors.
            </p>
          </div>
          <Link
            to="/map"
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 self-start sm:self-auto"
          >
            Open Fullscreen Map View <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <LeafletMap
              segments={riskData?.segments || []}
              selectedSegment={selectedSeg}
              onSelectSegment={(seg) => setSelectedSeg(seg)}
              height="500px"
            />
          </div>

          {/* Segment Details Card */}
          <div className="rounded-2xl bg-[#0f172a] border border-slate-800 p-6 flex flex-col justify-between">
            {selectedSeg ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider">
                      {selectedSeg.segment_id}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-0.5">{selectedSeg.name}</h3>
                  </div>
                  <RiskBadge
                    category={selectedSeg.risk_category || 'LOW'}
                    score={selectedSeg.risk_score}
                    size="md"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                    <span className="text-slate-400 block text-[11px]">Elevation</span>
                    <span className="text-base font-bold text-white font-mono">{selectedSeg.elevation_m} m</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                    <span className="text-slate-400 block text-[11px]">Terrain Slope</span>
                    <span className="text-base font-bold text-white font-mono">{selectedSeg.slope_deg}°</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                    <span className="text-slate-400 block text-[11px]">Drain Distance</span>
                    <span className="text-base font-bold text-white font-mono">{selectedSeg.distance_to_drain_m} m</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                    <span className="text-slate-400 block text-[11px]">Drain Status</span>
                    <span className="text-xs font-semibold text-amber-300 capitalize mt-1 block">
                      {(selectedSeg.drainage_status || 'Unknown').replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Factors */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-xs font-semibold text-slate-300 block">
                    AI Contributing Factors:
                  </span>
                  {selectedSeg.contributing_factors && selectedSeg.contributing_factors.length > 0 ? (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto text-xs">
                      {selectedSeg.contributing_factors.map((f, i) => (
                        <div key={i} className="p-2 rounded-lg bg-slate-900/80 text-[11px] border border-slate-800">
                          <div className="flex justify-between font-medium text-slate-200">
                            <span>{f.factor}</span>
                            <span className={f.impact.includes('Increases') ? 'text-rose-400' : 'text-emerald-400'}>
                              {f.impact}
                            </span>
                          </div>
                          <p className="text-slate-400 mt-0.5">{f.detail}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">Normal drainage capacity with minimal runoff hazard.</p>
                  )}
                </div>

                <div className="pt-2">
                  <Link
                    to={`/predict`}
                    className="block w-full py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold text-center transition-colors"
                  >
                    Launch AI Prediction Workbench &rarr;
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <Map className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <p>Click on any road corridor on the map to view real-time flood risk metrics.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How It Works Pipeline Architecture */}
      <section className="rounded-3xl bg-[#090f20] border border-slate-800 p-8 sm:p-10 space-y-8">
        <div>
          <span className="text-xs font-mono font-semibold text-cyan-400 uppercase tracking-widest">
            ENGINEERING & DATA PIPELINE
          </span>
          <h2 className="text-3xl font-extrabold text-white mt-1">
            How AquaGuard AI Estimates Hyperlocal Street Risk
          </h2>
          <p className="text-slate-400 text-sm max-w-2xl mt-2">
            Urban flooding is rarely uniform. While regional rain might be 30 mm, an enclosed underpass or low river basin
            accumulates runoff from square kilometers of asphalt within minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 relative group hover:border-cyan-500/50 transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold mb-3 border border-blue-500/20">
              1
            </div>
            <h4 className="font-bold text-white text-sm mb-1">Live Meteorology</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Open-Meteo current and hourly precipitation fields when the external service is reachable.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 relative group hover:border-cyan-500/50 transition-all">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold mb-3 border border-teal-500/20">
              2
            </div>
            <h4 className="font-bold text-white text-sm mb-1">DEM & Elevation</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Illustrative elevation and slope values in this bundle; no verified DEM extraction is included.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 relative group hover:border-cyan-500/50 transition-all">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold mb-3 border border-cyan-500/20">
              3
            </div>
            <h4 className="font-bold text-white text-sm mb-1">Drainage Channels</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Illustrative drainage distance and condition attributes; municipal capacity and blockage are not verified.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 relative group hover:border-cyan-500/50 transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold mb-3 border border-purple-500/20">
              4
            </div>
            <h4 className="font-bold text-white text-sm mb-1">Dual AI Engine</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Baseline rational runoff physics combined with XGBoost / Random Forest trained classifiers.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 relative group hover:border-cyan-500/50 transition-all">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold mb-3 border border-rose-500/20">
              5
            </div>
            <h4 className="font-bold text-white text-sm mb-1">Actionable Warnings</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Risk-weighted graph routing and an admin review workflow for citizen-submitted reports; no dispatch integration.
            </p>
          </div>
        </div>
      </section>

      {/* Hackathon Presentation Features Launchpad */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white">
          Hackathon Interactive Demonstration Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/simulator"
            className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 hover:border-cyan-500/50 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Sliders className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-base mb-2 group-hover:text-cyan-400 transition-colors">
              Digital Twin Simulator
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Test hypothetical rainfall and drainage-blockage inputs and compare prototype risk-score changes.
            </p>
            <span className="inline-flex items-center gap-1 text-xs text-cyan-400 font-semibold mt-4">
              Try Simulation &rarr;
            </span>
          </Link>

          <Link
            to="/routes"
            className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 hover:border-cyan-500/50 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-base mb-2 group-hover:text-amber-400 transition-colors">
              Risk-Weighted Route Prototype
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Compares shortest and lower-scored paths on the bundled illustrative road graph. Not a verified navigation service.
            </p>
            <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-semibold mt-4">
              Explore Risk-Weighted Route &rarr;
            </span>
          </Link>

          <Link
            to="/citizen"
            className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 hover:border-cyan-500/50 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-base mb-2 group-hover:text-rose-400 transition-colors">
              Citizen Reporting & Triage
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Crowdsource water depth and road passability reports from citizens, and verify them from the municipal authority dashboard.
            </p>
            <span className="inline-flex items-center gap-1 text-xs text-rose-400 font-semibold mt-4">
              Citizen Portal &rarr;
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
};
