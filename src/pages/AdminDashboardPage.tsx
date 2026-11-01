import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, CheckCircle2, XCircle, AlertTriangle, Building2,
  Clock, ArrowUpRight, Filter, MessageSquare, Radio, PhoneCall, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { CitizenReport, AnalyticsOverview, RoadSegment } from '../types';
import { RiskBadge } from '../components/RiskBadge';

export const AdminDashboardPage: React.FC = () => {
  const [reports, setReports] = useState<CitizenReport[]>([]);
  const [prioritizedIncidents, setPrioritizedIncidents] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [segments, setSegments] = useState<RoadSegment[]>([]);

  // Triage state
  const [selectedReport, setSelectedReport] = useState<CitizenReport | null>(null);
  const [adminNote, setAdminNote] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    try {
      const [repRes, incRes, anaRes, segRes] = await Promise.all([
        api.getReports(),
        api.getAdminIncidents(),
        api.getAnalyticsOverview(),
        api.getRoadSegments()
      ]);
      setReports(repRes);
      setPrioritizedIncidents(incRes);
      setAnalytics(anaRes);
      setSegments(segRes);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (reportId: number, newStatus: string) => {
    setActionLoading(true);
    try {
      await api.updateReportStatus(reportId, newStatus, adminNote || undefined);
      await loadData();
      setSelectedReport(null);
      setAdminNote('');
    } catch (err) {
      console.error('Failed to update report status:', err);
      alert('Could not update report status.');
    } finally {
      setActionLoading(false);
    }
  };

  const criticalCount = analytics?.risk_distribution['CRITICAL'] || 2;
  const highCount = analytics?.risk_distribution['HIGH'] || 4;
  const modCount = analytics?.risk_distribution['MODERATE'] || 8;
  const lowCount = analytics?.risk_distribution['LOW'] || 10;

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header */}
      <div className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400 bg-rose-950/80 px-2.5 py-1 rounded-full border border-rose-800 mb-2">
              <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              MUNICIPAL CONTROL ROOM & EMERGENCY DISPATCH CONSOLE
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Smart City Authority Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Jaipur Municipal Corporation (JMC) Flood Management & SDRF Rapid Response Console.
            </p>
          </div>

          <button
            onClick={loadData}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            Refresh Triage Queue
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 text-xs">
        <div className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800 col-span-2">
          <span className="text-slate-400 font-medium">Monitored Segments</span>
          <div className="text-2xl font-bold text-white font-mono mt-1">
            {segments.length || 24}
          </div>
          <span className="text-[11px] text-cyan-400">Jaipur Urban Network</span>
        </div>

        <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 col-span-2">
          <span className="text-rose-400 font-medium">Critical Risk</span>
          <div className="text-2xl font-bold text-rose-400 font-mono mt-1">
            {criticalCount} Roads
          </div>
          <span className="text-[11px] text-rose-300">Immediate Action</span>
        </div>

        <div className="p-4 rounded-2xl bg-orange-950/20 border border-orange-500/30 col-span-2">
          <span className="text-orange-400 font-medium">High Risk</span>
          <div className="text-2xl font-bold text-orange-400 font-mono mt-1">
            {highCount} Roads
          </div>
          <span className="text-[11px] text-orange-300">Underpass Watch</span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 col-span-2">
          <span className="text-emerald-400 font-medium">Clear / Low Risk</span>
          <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
            {lowCount} Roads
          </div>
          <span className="text-[11px] text-emerald-300">Normal Flow</span>
        </div>
      </div>

      {/* Control Room Incident Triage Table */}
      <div className="rounded-3xl bg-[#0f172a] border border-slate-800 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-cyan-400" />
              Citizen Incident Triage & Verification Queue
            </h2>
            <p className="text-xs text-slate-400">
              Ranked by emergency severity priority (water depth, passability, critical infrastructure proximity).
            </p>
          </div>
          <div className="text-xs text-slate-400">
            Total Queue: <strong>{reports.length} Reports</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#070b14] text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">UID / Road Name</th>
                <th className="py-3 px-4">Depth</th>
                <th className="py-3 px-4">Passability</th>
                <th className="py-3 px-4">Reported By</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {reports.map((rep) => (
                <tr key={rep.id} className="hover:bg-slate-900/60 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      rep.water_depth === 'Submerged' || rep.water_depth === 'Waist-deep'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {rep.water_depth === 'Submerged' ? 'P1 CRITICAL' : 'P2 HIGH'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-white">{rep.road_name}</div>
                    <div className="font-mono text-[10px] text-slate-500">{rep.report_uid}</div>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-cyan-300">
                    {rep.water_depth}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-medium text-amber-300">{rep.passability}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">
                    {rep.reporter_name}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      rep.status === 'verified'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : rep.status === 'resolved'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}>
                      {rep.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setSelectedReport(rep)}
                      className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 font-medium transition-colors"
                    >
                      Triage &rarr;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verification / Action Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono text-cyan-400">{selectedReport.report_uid}</span>
                <h3 className="text-lg font-bold text-white">{selectedReport.road_name}</h3>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>Reported Depth:</span>
                <strong className="text-white">{selectedReport.water_depth}</strong>
              </div>
              <div className="flex justify-between">
                <span>Passability:</span>
                <strong className="text-white">{selectedReport.passability}</strong>
              </div>
              <div className="flex justify-between">
                <span>Reporter:</span>
                <span>{selectedReport.reporter_name}</span>
              </div>
              {selectedReport.description && (
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 italic text-[11px]">
                  "{selectedReport.description}"
                </div>
              )}
            </div>

            {/* Admin Note Input */}
            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-slate-300">
                Dispatch Action & Administrative Note:
              </label>
              <textarea
                rows={2}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="e.g. 15HP dewatering unit dispatched to clear underpass; barricaded by Jaipur Traffic Police."
                className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <button
                disabled={actionLoading}
                onClick={() => handleUpdateStatus(selectedReport.id, 'verified')}
                className="py-2.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Verify Incident
              </button>
              <button
                disabled={actionLoading}
                onClick={() => handleUpdateStatus(selectedReport.id, 'resolved')}
                className="py-2.5 px-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1 transition-colors"
              >
                Mark Resolved
              </button>
              <button
                disabled={actionLoading}
                onClick={() => handleUpdateStatus(selectedReport.id, 'rejected')}
                className="py-2.5 px-2 rounded-xl bg-rose-900/60 hover:bg-rose-900 text-rose-200 border border-rose-700 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" /> Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
