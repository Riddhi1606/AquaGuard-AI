import React, { useState, useEffect } from 'react';
import {
  Compass, MapPin, Navigation, ShieldCheck, AlertTriangle,
  ArrowRight, CheckCircle2, RefreshCw, Car, Info
} from 'lucide-react';
import { api } from '../services/api';
import { SafeRouteResponse, RoadSegment } from '../types';
import { LeafletMap } from '../maps/LeafletMap';
import { RiskBadge } from '../components/RiskBadge';

const JAIPUR_LANDMARKS = [
  { name: 'Vaishali Nagar (Amrapali Circle)', coords: [26.9050, 75.7410] },
  { name: 'Malviya Nagar (WTP & Fortis)', coords: [26.8530, 75.8050] },
  { name: 'Sodala Metro Junction', coords: [26.9015, 75.7725] },
  { name: 'Civil Lines (Secretariat)', coords: [26.9080, 75.7920] },
  { name: 'Badi Chaupar (Walled City)', coords: [26.9238, 75.8265] },
  { name: 'Amer Road (Jal Mahal)', coords: [26.9530, 75.8360] },
  { name: 'Sikar Road (Dadi Ka Phatak)', coords: [26.9480, 75.7680] },
  { name: 'Mansarovar (Shipra Path)', coords: [26.8520, 75.7620] },
  { name: 'Sanganer Bridge & Airport', coords: [26.8280, 75.8010] },
];

export const SafeRoutePage: React.FC = () => {
  const [startIdx, setStartIdx] = useState<number>(0); // Vaishali Nagar
  const [endIdx, setEndIdx] = useState<number>(1);   // Malviya Nagar
  const [routeResult, setRouteResult] = useState<SafeRouteResponse | null>(null);
  const [segments, setSegments] = useState<RoadSegment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [calculating, setCalculating] = useState<boolean>(false);

  useEffect(() => {
    const init = async () => {
      try {
        const segs = await api.getRoadSegments();
        setSegments(segs);
        await planRoute(0, 1);
      } catch (err) {
        console.error('Failed to init routing:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const planRoute = async (sIdx: number, eIdx: number) => {
    setCalculating(true);
    const start = JAIPUR_LANDMARKS[sIdx].coords;
    const end = JAIPUR_LANDMARKS[eIdx].coords;

    try {
      const res = await api.calculateSafeRoute({
        start_lat: start[0],
        start_lon: start[1],
        end_lat: end[0],
        end_lon: end[1],
        avoid_high_risk: true
      });
      setRouteResult(res);
    } catch (err) {
      console.error('Failed to calculate safe route:', err);
    } finally {
      setCalculating(false);
    }
  };

  const handleCalculate = () => {
    planRoute(startIdx, endIdx);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded-full border border-cyan-800 mb-2">
          <Compass className="w-3.5 h-3.5" />
          RISK-AWARE NAVIGATION ENGINE
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          Risk-Weighted Route Prototype
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
          This demonstration compares a shortest path with a lower-scored path on the bundled illustrative road graph.
          Road geometry and risk attributes are not authoritative, so results are not safe-navigation instructions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Route Selector Card */}
        <div className="rounded-3xl bg-[#0f172a] border border-slate-800 p-6 space-y-5">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Car className="w-4 h-4 text-cyan-400" />
            Origin & Destination
          </h2>

          <div className="space-y-4 text-xs">
            {/* Start Landmark */}
            <div className="space-y-1.5">
              <label className="font-semibold text-emerald-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> Start Point (Jaipur):
              </label>
              <select
                value={startIdx}
                onChange={(e) => setStartIdx(parseInt(e.target.value))}
                className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                {JAIPUR_LANDMARKS.map((lm, idx) => (
                  <option key={idx} value={idx}>
                    {lm.name}
                  </option>
                ))}
              </select>
            </div>

            {/* End Landmark */}
            <div className="space-y-1.5">
              <label className="font-semibold text-rose-400 flex items-center gap-1">
                <Navigation className="w-3.5 h-3.5" /> Destination (Jaipur):
              </label>
              <select
                value={endIdx}
                onChange={(e) => setEndIdx(parseInt(e.target.value))}
                className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                {JAIPUR_LANDMARKS.map((lm, idx) => (
                  <option key={idx} value={idx}>
                    {lm.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleCalculate}
              disabled={calculating || startIdx === endIdx}
              className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
            >
              {calculating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Routing Through Graph...
                </>
              ) : (
                <>
                  <Compass className="w-4 h-4" />
                  Calculate Prototype Route
                </>
              )}
            </button>
          </div>

          {/* Route Comparison Stats */}
          {routeResult && (
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Corridor Comparison
              </h3>

              <div className="space-y-2 text-xs">
                {/* Standard Route */}
                <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30">
                  <div className="flex items-center justify-between text-rose-300 font-semibold mb-1">
                    <span>Standard Shortest Path</span>
                    <span className="font-mono text-[11px]">{routeResult.standard_route.distance_km} km</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Mean Prototype Score:</span>
                    <span className="font-bold text-rose-400">{routeResult.standard_route.avg_risk.toFixed(0)}% (relative score)</span>
                  </div>
                </div>

                {/* Flood Safe Route */}
                <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/40">
                  <div className="flex items-center justify-between text-cyan-300 font-semibold mb-1">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                      Lower-Score Prototype Path
                    </span>
                    <span className="font-mono text-[11px]">{routeResult.safe_route.distance_km} km</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Mean Prototype Score:</span>
                    <span className="font-bold text-emerald-400">{routeResult.safe_route.avg_risk.toFixed(0)}% (not a safety guarantee)</span>
                  </div>
                </div>

                {/* Risk Delta Summary */}
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Risk Reduction</span>
                    <span className="text-lg font-bold text-emerald-400">-{routeResult.risk_reduction_pct}%</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px]">Detour Length</span>
                    <span className="text-base font-bold text-slate-200 font-mono">
                      +{(routeResult.distance_delta_meters / 1000).toFixed(1)} km
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Avoided Segments */}
          {routeResult && routeResult.segments_avoided.length > 0 && (
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Higher-Scored Demo Segments on Shortest Path:
              </span>
              <div className="space-y-1.5">
                {routeResult.segments_avoided.map((s, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-rose-950/30 border border-rose-500/20 text-[11px] flex items-center justify-between">
                    <span className="text-slate-200 font-medium">{s.name}</span>
                    <RiskBadge category={s.risk_category} score={s.risk_score} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Map Column */}
        <div className="lg:col-span-2 space-y-4">
          <LeafletMap
            segments={segments}
            highlightRouteCoords={routeResult?.standard_route.coordinates}
            safeRouteCoords={routeResult?.safe_route.coordinates}
            height="580px"
          />

          {/* Travel Advisory Disclaimer */}
          <div className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800 flex items-start gap-3 text-xs">
            <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-slate-200">
                Safety Disclaimer & Operational Advisory:
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                {routeResult?.travel_advisory || 'Routes use illustrative graph and risk attributes; this result does not verify road passability. Never enter standing water of unknown depth.'}
                {' '}Model-estimated risk does not constitute official road closure notice. Always obey on-ground Jaipur Traffic Police directives.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
