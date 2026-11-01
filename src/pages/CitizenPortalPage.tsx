import React, { useState, useEffect } from 'react';
import {
  FileText, MapPin, Camera, AlertTriangle, CheckCircle2,
  Send, Crosshair, Clock, ShieldAlert, Car, ThumbsUp, Radio
} from 'lucide-react';
import { api } from '../services/api';
import { CitizenReport, AlertItem, RoadSegment } from '../types';
import { RiskBadge } from '../components/RiskBadge';

export const CitizenPortalPage: React.FC = () => {
  const [reports, setReports] = useState<CitizenReport[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [segments, setSegments] = useState<RoadSegment[]>([]);

  // Form State
  const [roadName, setRoadName] = useState<string>('');
  const [latitude, setLatitude] = useState<number>(26.9042);
  const [longitude, setLongitude] = useState<number>(75.7780);
  const [waterDepth, setWaterDepth] = useState<string>('Knee-deep');
  const [passability, setPassability] = useState<string>('4x4 Only');
  const [description, setDescription] = useState<string>('');
  const [reporterName, setReporterName] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rep, alt, segs] = await Promise.all([
          api.getReports(),
          api.getAlerts(),
          api.getRoadSegments()
        ]);
        setReports(rep);
        setAlerts(alt);
        setSegments(segs);
      } catch (err) {
        console.error('Failed to load citizen portal data:', err);
      }
    };
    fetchData();
  }, []);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(parseFloat(pos.coords.latitude.toFixed(4)));
        setLongitude(parseFloat(pos.coords.longitude.toFixed(4)));
        setRoadName('Current GPS Location (Jaipur)');
      },
      (err) => {
        alert('Could not access current GPS location. You may type the road name manually.');
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roadName.trim()) {
      alert('Please specify the street name or landmark.');
      return;
    }
    setSubmitting(true);
    try {
      const created = await api.submitReport({
        latitude,
        longitude,
        road_name: roadName,
        water_depth: waterDepth,
        passability: passability,
        description: description,
        reporter_name: reporterName || 'Anonymous Citizen'
      });
      setReports([created, ...reports]);
      setSubmitSuccess(true);
      setDescription('');
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (err) {
      console.error('Failed to submit report:', err);
      alert('Could not submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded-full border border-cyan-800 mb-2">
          <Radio className="w-3.5 h-3.5" />
          COMMUNITY EARLY WARNING & HYPERLOCAL INCIDENT REPORTING
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          Citizen Waterlogging Portal
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
          Report active waterlogging and street inundation directly to Jaipur Municipal Control Room.
          Your crowdsourced reports validate AI predictions and warn fellow commuters in real time.
        </p>
      </div>

      {/* Active Hyperlocal Warnings Card */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            Active Hyperlocal Road Warnings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alerts.map((alt) => (
              <div
                key={alt.id}
                className="p-5 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-xs space-y-2 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{alt.location_name}</span>
                  <RiskBadge category={alt.risk_level} size="sm" />
                </div>
                <p className="text-slate-300 leading-relaxed">{alt.alert_message}</p>
                <div className="pt-2 border-t border-rose-500/20 flex items-center justify-between text-[11px]">
                  <span className="text-cyan-400 font-medium">Action: {alt.suggested_action}</span>
                  <span className="text-slate-500">{new Date(alt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Report Submission Form */}
        <div className="rounded-3xl bg-[#0f172a] border border-slate-800 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Camera className="w-4 h-4 text-cyan-400" />
              Submit Waterlogging Report
            </h2>
            <button
              type="button"
              onClick={handleDetectLocation}
              className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-800"
            >
              <Crosshair className="w-3.5 h-3.5" />
              Auto-Locate
            </button>
          </div>

          {submitSuccess && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Report submitted successfully! Dispatched to Jaipur Control Room.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Street / Location Name */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">
                Road / Underpass Name:
              </label>
              <input
                type="text"
                required
                value={roadName}
                onChange={(e) => setRoadName(e.target.value)}
                placeholder="e.g. Sodala Underpass, Tonk Road near WTP..."
                className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Coordinates */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={latitude}
                  onChange={(e) => setLatitude(parseFloat(e.target.value))}
                  className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={longitude}
                  onChange={(e) => setLongitude(parseFloat(e.target.value))}
                  className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Water Depth Category */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">
                Water Depth Level:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['Ankle-deep', 'Knee-deep', 'Waist-deep', 'Submerged'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setWaterDepth(d)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-medium border text-center transition-all ${
                      waterDepth === d
                        ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 font-bold'
                        : 'bg-[#070b14] border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Road Passability */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">
                Current Road Passability:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Passable', '4x4 Only', 'Impassable'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPassability(p)}
                    className={`py-2 px-1.5 rounded-xl text-[11px] font-medium border text-center transition-all ${
                      passability === p
                        ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 font-bold'
                        : 'bg-[#070b14] border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">
                Observations / Blocked Drains:
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mention stalled vehicles, manhole overflow, or water level trajectory..."
                className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Reporter Name */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">
                Your Name / Contact (Optional):
              </label>
              <input
                type="text"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                placeholder="e.g. Ramesh Meena (Commuter)"
                className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Transmitting to Control Room...' : 'Submit Incident Report'}
            </button>
          </form>
        </div>

        {/* Live Community Incident Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Recent Citizen Waterlogging Reports
            </h2>
            <span className="text-xs text-slate-400">{reports.length} Reports Logged</span>
          </div>

          <div className="space-y-3">
            {reports.map((rep) => (
              <div
                key={rep.id}
                className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-3 shadow-md"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-mono text-cyan-400">{rep.report_uid}</span>
                    <h3 className="text-base font-bold text-white mt-0.5">{rep.road_name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      rep.status === 'verified'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : rep.status === 'resolved'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}>
                      {rep.status.toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(rep.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                    Depth: <strong className="text-cyan-300">{rep.water_depth}</strong>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                    Passability: <strong className="text-amber-300">{rep.passability}</strong>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                    Reporter: <span className="text-slate-400">{rep.reporter_name}</span>
                  </span>
                </div>

                {rep.description && (
                  <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    "{rep.description}"
                  </p>
                )}

                {rep.admin_notes && (
                  <div className="p-2.5 rounded-xl bg-blue-950/30 border border-blue-500/30 text-xs text-blue-300 flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block">Municipal Dispatch Note:</span>
                      <span className="text-slate-300">{rep.admin_notes}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
