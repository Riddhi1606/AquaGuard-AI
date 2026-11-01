import React, { useState, useEffect } from 'react';
import {
  BarChart3, Cpu, ShieldAlert, Award, CheckCircle2,
  TrendingUp, Layers, AlertCircle, ArrowUpRight
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell
} from 'recharts';
import { api } from '../services/api';
import { AnalyticsOverview, ModelMetrics } from '../types';

export const HistoricalAnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [aRes, mRes] = await Promise.all([
          api.getAnalyticsOverview(),
          api.getMLMetrics()
        ]);
        setAnalytics(aRes);
        setMetrics(mRes);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const featureChartData = metrics?.global_feature_importance
    ? Object.entries(metrics.global_feature_importance).map(([key, val]) => ({
        name: key.replace(/_/g, ' '),
        importance: val
      })).slice(0, 8)
    : [];

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded-full border border-cyan-800 mb-2">
          <BarChart3 className="w-3.5 h-3.5" />
          MUNICIPAL HYDROLOGICAL INTELLIGENCE & MODEL VALIDATION
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          Historical Flood Analytics & AI Evaluation
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
          Empirical evaluation benchmarks, historical flood recurrence hotspots in Jaipur, and model validation metrics.
        </p>
      </div>

      {/* Model Benchmark Performance Cards */}
      <div className="rounded-3xl bg-[#0f172a] border border-slate-800 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              Supervised Machine Learning Benchmark Comparison
            </h2>
            <p className="text-xs text-slate-400">
              Evaluated on 720 out-of-sample test instances using stratified cross-validation.
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-800">
            Active Model: {metrics?.active_model || 'RandomForest'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {metrics?.benchmark_comparison && Object.entries(metrics.benchmark_comparison).map(([name, m]) => (
            <div
              key={name}
              className={`p-5 rounded-2xl border transition-all ${
                name === metrics.active_model
                  ? 'bg-cyan-950/20 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-white text-sm">{name}</span>
                {name === metrics.active_model && (
                  <span className="px-2 py-0.5 rounded bg-cyan-500 text-slate-950 font-bold text-[10px]">
                    DEPLOYED
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] mb-3">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Accuracy</span>
                  <span className="text-base font-bold text-white font-mono">{(m.accuracy * 100).toFixed(1)}%</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">F1-Score</span>
                  <span className="text-base font-bold text-emerald-400 font-mono">{m.f1_score.toFixed(3)}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Precision</span>
                  <span className="text-base font-bold text-slate-200 font-mono">{m.precision.toFixed(3)}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Recall</span>
                  <span className="text-base font-bold text-cyan-300 font-mono">{m.recall.toFixed(3)}</span>
                </div>
              </div>

              {/* Confusion Matrix */}
              <div className="p-2.5 rounded-xl bg-[#070b14] border border-slate-800 text-[10px]">
                <span className="text-slate-500 block mb-1">Confusion Matrix (TN / FP / FN / TP):</span>
                <div className="grid grid-cols-2 gap-1 text-center font-mono font-semibold">
                  <div className="bg-slate-900 p-1 rounded text-slate-300">TN: {m.confusion_matrix[0][0]}</div>
                  <div className="bg-slate-900 p-1 rounded text-rose-400">FP: {m.confusion_matrix[0][1]}</div>
                  <div className="bg-slate-900 p-1 rounded text-amber-400">FN: {m.confusion_matrix[1][0]}</div>
                  <div className="bg-slate-900 p-1 rounded text-emerald-400">TP: {m.confusion_matrix[1][1]}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Historical Hotspot Ranking */}
        <div className="rounded-3xl bg-[#0f172a] border border-slate-800 p-6 space-y-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              Documented Jaipur Flood Hotspots
            </h2>
            <p className="text-xs text-slate-400">
              Ranked by frequency of waterlogging incidents in documented historical monsoon seasons.
            </p>
          </div>

          <div className="space-y-2.5">
            {analytics?.historical_hotspots.map((hs) => (
              <div
                key={hs.segment_id}
                className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 font-bold flex items-center justify-center text-xs">
                    #{hs.rank}
                  </span>
                  <div>
                    <div className="font-bold text-white">{hs.name}</div>
                    <div className="text-[11px] text-slate-400">{hs.vulnerability_index}</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-white text-sm">
                    {hs.historical_incidents}
                  </span>
                  <span className="text-[10px] text-slate-500 block">Incidents</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Global SHAP Feature Importance */}
        <div className="rounded-3xl bg-[#0f172a] border border-slate-800 p-6 space-y-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              Global SHAP Feature Importance Ranking
            </h2>
            <p className="text-xs text-slate-400">
              Mean absolute SHAP value impact across all flood classification predictions.
            </p>
          </div>

          <div className="h-64 w-full pt-2">
            {featureChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={featureChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis type="number" stroke="#64748b" fontSize={10} />
                  <YAxis dataKey="name" type="category" width={110} stroke="#94a3b8" fontSize={10} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#070b14',
                      border: '1px solid #334155',
                      borderRadius: '10px',
                      fontSize: '11px'
                    }}
                  />
                  <Bar dataKey="importance" fill="#06b6d4" radius={[0, 4, 4, 0]}>
                    {featureChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#22d3ee' : '#0284c7'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                Loading SHAP values...
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800 flex items-center justify-between">
            <span>Primary Driver: Rainfall Intensity & Antecedent Accumulation</span>
            <span className="text-cyan-400 font-medium">SHAP TreeExplainer v0.54</span>
          </div>
        </div>
      </div>
    </div>
  );
};
