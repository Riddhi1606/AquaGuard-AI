import React, { useState, useEffect } from 'react';
import {
  Map, Filter, Search, ShieldAlert, AlertTriangle, Layers,
  Compass, Radio, X, CheckCircle2, ChevronRight, Info
} from 'lucide-react';
import { api } from '../services/api';
import { RoadSegment, CitizenReport, RiskCategory } from '../types';
import { LeafletMap } from '../maps/LeafletMap';
import { RiskBadge } from '../components/RiskBadge';

export const LiveMapPage: React.FC = () => {
  const [segments, setSegments] = useState<RoadSegment[]>([]);
  const [reports, setReports] = useState<CitizenReport[]>([]);
  const [emergencyServices, setEmergencyServices] = useState<any[]>([]);
  const [selectedSeg, setSelectedSeg] = useState<RoadSegment | null>(null);
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [underpassOnly, setUnderpassOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mapRes, repRes, emgRes] = await Promise.all([
          api.getLiveRiskMap(),
          api.getReports(),
          api.getEmergencyServices()
        ]);
        setSegments(mapRes.segments);
        setReports(repRes);
        setEmergencyServices(emgRes);
        if (mapRes.segments.length > 0) {
          const highRisk = mapRes.segments.find(s => s.risk_category === 'CRITICAL') || mapRes.segments[0];
          setSelectedSeg(highRisk);
        }
      } catch (err) {
        console.error('Failed to load map data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredSegments = segments.filter(seg => {
    if (riskFilter !== 'ALL' && seg.risk_category !== riskFilter) return false;
    if (underpassOnly && !seg.underpass) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return seg.name.toLowerCase().includes(q) || seg.segment_id.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0f172a] border border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Map className="w-6 h-6 text-cyan-400" />
            Prototype Flood & Waterlogging Risk Map
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Prototype risk scores using live weather when available and illustrative road / drainage attributes. Not an operational flood warning.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Bar */}
          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search street, e.g. Sodala..."
              className="w-full bg-[#070b14] border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Risk Level Pills */}
          <div className="flex items-center gap-1 bg-[#070b14] p-1 rounded-xl border border-slate-800 text-xs">
            {['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setRiskFilter(lvl)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  riskFilter === lvl
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Underpass Toggle */}
          <button
            onClick={() => setUnderpassOnly(!underpassOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              underpassOnly
                ? 'bg-purple-950/80 border-purple-500 text-purple-300'
                : 'bg-[#070b14] border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            Underpasses Only
          </button>
        </div>
      </div>

      {/* Main Map + Inspection Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaflet Interactive Map */}
        <div className="lg:col-span-2 space-y-3">
          <LeafletMap
            segments={filteredSegments}
            reports={reports}
            emergencyServices={emergencyServices}
            selectedSegment={selectedSeg}
            onSelectSegment={(seg) => setSelectedSeg(seg)}
            height="620px"
          />
          <div className="flex items-center justify-between text-xs text-slate-400 px-2">
            <span>Showing {filteredSegments.length} of {segments.length} illustrative road corridors in Jaipur</span>
            <span className="font-mono text-cyan-400 text-[11px]">Lat: 26.9124°N, Lon: 75.7873°E</span>
          </div>
        </div>

        {/* Detailed Segment Inspection Drawer */}
        <div className="space-y-4">
          {selectedSeg ? (
            <div className="rounded-2xl bg-[#0f172a] border border-slate-800 p-6 space-y-5 shadow-xl">
              <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest">
                    SEGMENT IDENTIFIER: {selectedSeg.segment_id}
                  </span>
                  <h2 className="text-xl font-bold text-white mt-0.5">{selectedSeg.name}</h2>
                  <p className="text-xs text-slate-400">{(selectedSeg.road_type || 'ROAD').toUpperCase()} HIGHWAY CORRIDOR</p>
                </div>
                <RiskBadge
                  category={selectedSeg.risk_category || 'LOW'}
                  score={selectedSeg.risk_score}
                  size="lg"
                />
              </div>

              {/* Topographic & GIS Characteristics */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80">
                  <span className="text-slate-400 block text-[11px]">Elevation Profile</span>
                  <span className="text-lg font-bold text-white font-mono">{selectedSeg.elevation_m} m</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Illustrative demo value</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80">
                  <span className="text-slate-400 block text-[11px]">Surface Slope</span>
                  <span className="text-lg font-bold text-white font-mono">{selectedSeg.slope_deg}°</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Terrain runoff slope</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80">
                  <span className="text-slate-400 block text-[11px]">Distance to Drain</span>
                  <span className="text-lg font-bold text-white font-mono">{selectedSeg.distance_to_drain_m} m</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Nearest stormwater canal</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80">
                  <span className="text-slate-400 block text-[11px]">Drainage Status</span>
                  <span className="text-sm font-semibold text-amber-300 capitalize block mt-1">
                    {(selectedSeg.drainage_status || 'Unknown').replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] text-slate-500 block">Cap: {selectedSeg.drainage_capacity_m3s} m³/s</span>
                </div>
              </div>

              {/* Historical Incident Record */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[11px]">Historical Incident Frequency</span>
                  <span className="font-semibold text-slate-200">
                    {selectedSeg.historical_incidents_count} documented floods in monsoon records
                  </span>
                </div>
                {selectedSeg.underpass && (
                  <span className="px-2 py-1 rounded bg-purple-950 text-purple-300 border border-purple-800 text-[11px] font-semibold">
                    Enclosed Underpass
                  </span>
                )}
              </div>

              {/* AI Contributing Factors Breakdown */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
                  Primary Risk Factors (SHAP & Physical Attributions)
                </h4>
                {selectedSeg.contributing_factors && selectedSeg.contributing_factors.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedSeg.contributing_factors.map((f, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                        <div className="flex items-center justify-between font-medium">
                          <span className="text-white">{f.factor}</span>
                          <span className={`text-[11px] font-semibold ${
                            f.impact.includes('Increases') ? 'text-rose-400' : 'text-emerald-400'
                          }`}>
                            {f.impact} ({f.contribution > 0 ? `+${f.contribution}` : f.contribution})
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px] mt-1">{f.detail}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No adverse flood factors detected for this segment.</p>
                )}
              </div>

              {/* Recommended Action */}
              <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs space-y-1">
                <span className="font-semibold text-cyan-300 block">Recommended Action:</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {selectedSeg.recommended_action || 'Check official/local conditions; this prototype does not confirm road passability.'}
                </p>
              </div>

              {/* Data Quality Indicator */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-amber-400" /> Illustrative, unverified GIS attributes
                </span>
                <span>Model scores are not calibrated against real incidents</span>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-[#0f172a] border border-slate-800 p-8 text-center text-slate-400">
              <Map className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p>Click a demo road corridor to inspect the prototype score and configured inputs.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
