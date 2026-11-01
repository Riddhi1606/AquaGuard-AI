import React, { useState } from 'react';
import 'leaflet/dist/leaflet.css';
import {
  MapContainer, TileLayer, Polyline, Marker, Popup, LayersControl, useMap
} from 'react-leaflet';
import L from 'leaflet';
import {
  Navigation, Eye, ShieldAlert, AlertTriangle, Crosshair, MapPin
} from 'lucide-react';
import { RoadSegment, CitizenReport, RiskCategory } from '../types';
import { RiskBadge } from '../components/RiskBadge';

// Fix standard Leaflet default icon issues in bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom incident icons
const reportIcon = L.divIcon({
  className: 'custom-report-marker',
  html: `<div style="background-color: #f43f5e; width: 22px; height: 22px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px rgba(244,63,94,0.8);"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M12 9v4m0 4h.01M20.66 19H3.34a2 2 0 0 1-1.73-3L10.27 3a2 2 0 0 1 3.46 0l8.66 13a2 2 0 0 1-1.73 3z"/></svg></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11]
});

const emergencyIcon = L.divIcon({
  className: 'custom-emergency-marker',
  html: `<div style="background-color: #06b6d4; width: 22px; height: 22px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px rgba(6,182,212,0.8);"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11]
});

const userLocationIcon = L.divIcon({
  className: 'user-marker',
  html: `<div style="background-color: #3b82f6; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px #3b82f6;"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9]
});

function getSegmentColor(cat?: RiskCategory | string): string {
  switch (cat) {
    case 'CRITICAL': return '#ef4444'; // Red
    case 'HIGH': return '#f97316';     // Orange
    case 'MODERATE': return '#eab308'; // Yellow
    case 'LOW':
    default: return '#22c55e';         // Green
  }
}

interface MapControllerProps {
  center: [number, number];
  zoom: number;
}

const MapController: React.FC<MapControllerProps> = ({ center, zoom }) => {
  const map = useMap();
  React.useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

interface LeafletMapProps {
  segments: RoadSegment[];
  reports?: CitizenReport[];
  emergencyServices?: any[];
  selectedSegment?: RoadSegment | null;
  onSelectSegment?: (segment: RoadSegment) => void;
  center?: [number, number];
  zoom?: number;
  highlightRouteCoords?: [number, number][];
  safeRouteCoords?: [number, number][];
  height?: string;
  onMapClick?: (lat: number, lon: number) => void;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  segments,
  reports = [],
  emergencyServices = [],
  selectedSegment,
  onSelectSegment,
  center = [26.9124, 75.7873], // Jaipur
  zoom = 12,
  highlightRouteCoords,
  safeRouteCoords,
  height = '600px',
  onMapClick
}) => {
  const [mapCenter, setMapCenter] = useState<[number, number]>(center);
  const [mapZoom, setMapZoom] = useState<number>(zoom);
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState<boolean>(false);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLoc(coords);
        setMapCenter(coords);
        setMapZoom(14);
        setLocating(false);
      },
      (err) => {
        console.warn('Geolocation denied or unavailable:', err);
        alert('Could not access current location. Centering on Jaipur.');
        setLocating(false);
      }
    );
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-[#090f20]" style={{ height }}>
      {/* Map Actions Overlay */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <button
          onClick={handleLocateMe}
          disabled={locating}
          className="p-2.5 rounded-xl bg-[#0f172a]/90 text-cyan-400 hover:text-white hover:bg-cyan-600/30 border border-slate-700/80 shadow-lg backdrop-blur-md transition-all flex items-center justify-center text-xs font-medium gap-1.5"
          title="Detect Current Location"
        >
          <Crosshair className={`w-4 h-4 ${locating ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">My Location</span>
        </button>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-[#0f172a]/95 border border-slate-700/80 rounded-xl p-3 shadow-xl backdrop-blur-md text-xs">
        <div className="font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
          Flood Risk Classification
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#22c55e]"></span>
            <span className="text-slate-300">Low (0-30%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#eab308]"></span>
            <span className="text-slate-300">Mod (30-60%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#f97316]"></span>
            <span className="text-slate-300">High (60-80%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#ef4444]"></span>
            <span className="text-slate-300">Critical (&gt;80%)</span>
          </div>
        </div>
        {safeRouteCoords && (
          <div className="mt-2 pt-2 border-t border-slate-800 flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-cyan-400">
              <span className="w-4 h-1 bg-cyan-400 rounded"></span> Safe Route
            </span>
            <span className="flex items-center gap-1 text-rose-400">
              <span className="w-4 h-1 border-t-2 border-dashed border-rose-400"></span> Standard (Flooded)
            </span>
          </div>
        )}
      </div>

      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={true}
      >
        <MapController center={mapCenter} zoom={mapZoom} />

        {/* CartoDB Dark Matter Basemap */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* User GPS Location Marker */}
        {userLoc && (
          <Marker position={userLoc} icon={userLocationIcon}>
            <Popup>
              <div className="text-xs text-slate-800">
                <strong>Your Current Location</strong>
                <p>Coordinates: {userLoc[0].toFixed(4)}, {userLoc[1].toFixed(4)}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Road Network Polylines */}
        {segments.map((seg) => {
          const isSelected = selectedSegment?.segment_id === seg.segment_id;
          const color = getSegmentColor(seg.risk_category);
          return (
            <Polyline
              key={seg.segment_id}
              positions={seg.coordinates}
              pathOptions={{
                color: isSelected ? '#22d3ee' : color,
                weight: isSelected ? 8 : 5,
                opacity: isSelected ? 1.0 : 0.85,
                lineCap: 'round',
                lineJoin: 'round',
              }}
              eventHandlers={{
                click: () => onSelectSegment && onSelectSegment(seg),
              }}
            >
              <Popup>
                <div className="p-1 max-w-xs text-xs text-slate-900">
                  <div className="font-bold text-sm mb-1">{seg.name}</div>
                  <div className="flex items-center gap-1 mb-2">
                    <RiskBadge category={seg.risk_category || 'LOW'} score={seg.risk_score} size="sm" />
                    {seg.underpass && (
                      <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-semibold">
                        Underpass
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 text-slate-600 text-[11px]">
                    <div>Elevation: <strong>{seg.elevation_m}m</strong> | Slope: <strong>{seg.slope_deg}°</strong></div>
                    <div>Distance to drain: <strong>{seg.distance_to_drain_m}m</strong></div>
                    <div>Drain status: <strong>{seg.drainage_status || 'Unknown'}</strong></div>
                  </div>
                  {onSelectSegment && (
                    <button
                      onClick={() => onSelectSegment(seg)}
                      className="mt-2.5 w-full py-1 rounded bg-cyan-600 hover:bg-cyan-700 text-white font-medium text-xs transition-colors"
                    >
                      Inspect AI Prediction
                    </button>
                  )}
                </div>
              </Popup>
            </Polyline>
          );
        })}

        {/* Safe Route Highlight Overlays */}
        {highlightRouteCoords && highlightRouteCoords.length > 1 && (
          <Polyline
            positions={highlightRouteCoords}
            pathOptions={{
              color: '#ef4444',
              weight: 4,
              dashArray: '8, 8',
              opacity: 0.8,
            }}
          />
        )}
        {safeRouteCoords && safeRouteCoords.length > 1 && (
          <Polyline
            positions={safeRouteCoords}
            pathOptions={{
              color: '#06b6d4',
              weight: 6,
              opacity: 0.95,
            }}
          />
        )}

        {/* Citizen Report Markers */}
        {reports.map((rep) => (
          <Marker
            key={rep.id}
            position={[rep.latitude, rep.longitude]}
            icon={reportIcon}
          >
            <Popup>
              <div className="text-xs text-slate-900 p-1 max-w-xs">
                <div className="font-bold text-rose-700 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Citizen Report
                </div>
                <div className="font-semibold text-slate-800 mt-1">{rep.road_name}</div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-medium text-[10px]">
                    Depth: {rep.water_depth}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-medium text-[10px]">
                    {rep.passability}
                  </span>
                </div>
                {rep.description && (
                  <p className="mt-1.5 text-slate-600 text-[11px] italic">"{rep.description}"</p>
                )}
                <div className="mt-2 text-[10px] text-slate-400">
                  Status: <strong>{rep.status.toUpperCase()}</strong>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Emergency Response Centers */}
        {emergencyServices.map((emg) => (
          <Marker
            key={emg.id}
            position={emg.coordinates}
            icon={emergencyIcon}
          >
            <Popup>
              <div className="text-xs text-slate-900 p-1">
                <div className="font-bold text-cyan-800">{emg.name}</div>
                <div className="text-[11px] text-slate-600 mt-0.5">{emg.address}</div>
                <div className="mt-1.5 font-mono text-cyan-700 font-semibold">📞 {emg.phone}</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
