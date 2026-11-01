import React from 'react';
import {
  ShieldAlert, Database, Cpu, Compass, CheckCircle2,
  AlertCircle, ExternalLink, Heart, Layers, Radio
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-16">
      {/* Header */}
      <div className="p-8 rounded-3xl bg-[#0f172a] border border-slate-800 space-y-4">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 bg-cyan-950/80 px-3 py-1 rounded-full border border-cyan-800">
          <ShieldAlert className="w-3.5 h-3.5" />
          DISASTER RESILIENCE ARCHITECTURE
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
          About AquaGuard AI
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl">
          Urban waterlogging disrupts commuters, damages private and public property, and hampers emergency first responders.
          While conventional weather forecasts predict broad regional rainfall, they fail to answer the critical question
          for citizens and authorities: <strong>"Will my street or underpass be submerged?"</strong>
        </p>
        <p className="text-xs sm:text-sm text-cyan-300 font-medium">
          Tagline: Predict Before It Floods. Protect Every Street.
        </p>
      </div>

      {/* System Methodology Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold">
            <Database className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Topographic & GIS Analysis</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            This version uses bundled illustrative road coordinates and hand-entered terrain / drainage attributes.
            A standalone Overpass helper is included, but authoritative OSM road ingestion and Copernicus DEM processing
            are not wired into the live prediction workflow.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Dual AI & Hydrological Engine</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            The platform combines a transparent <strong>Rational Method Hydrological Baseline</strong> with
            <strong>supervised machine learning (XGBoost & Random Forest)</strong>. Explainability is powered by
            <strong>SHAP (Shapley Additive Explanations)</strong>, detailing why a road segment is flagged.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
            <Compass className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Topological Safe Routing</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Using NetworkX, the prototype compares a shortest path with a lower-relative-score path on the bundled
            illustrative road graph. The graph is not a verified connected road network and the output is not safe navigation.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
            <Radio className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Citizen Crowdsourcing & Dispatch</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Citizens can submit water-depth and passability reports. Admin users can review report status with a server-side
            key. No municipal verification, pump dispatch, or emergency notification integration is included.
          </p>
        </div>
      </div>

      {/* Data Provenance & Ethics Disclosure */}
      <div className="p-8 rounded-3xl bg-[#090f20] border border-slate-800 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-400" />
          Data Provenance & Ethical AI Disclosure
        </h2>
        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">External Data Used:</strong> Open-Meteo current and forecast fields are fetched when
              the API is reachable. Bundled road coordinates, elevation, slope, drainage, and incident-count attributes are
              illustrative demo values and are not verified municipal or survey records.
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">Synthetic Benchmark Training Data:</strong> Because Indian municipal governments
              do not publish open hourly historical road sensor water depth records, the ML models were trained on 2,880
              synthetic scenarios generated by programmed rules for software testing. Their benchmark metrics are not
              evidence of real-world flood prediction accuracy.
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">Report Review Workflow:</strong> Citizen submissions are stored as pending reports
              and can be reviewed by an authorized admin. They are not automatically treated as verified ground truth and are
              not currently used to retrain the bundled models.
            </div>
          </div>
        </div>
      </div>

      {/* Open Source Attributions */}
      <div className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 text-xs space-y-3 text-slate-400">
        <h4 className="font-bold text-white text-sm">Reference Technologies & Potential Data Sources</h4>
        <p className="text-[11px] text-amber-300">These are reference sources / planned integrations; they are not all ingested into the current prototype.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <div className="font-semibold text-slate-200">Open-Meteo Weather API</div>
            <p className="text-[11px] text-slate-500 mt-0.5">High-resolution numerical weather prediction models (CC-BY 4.0).</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <div className="font-semibold text-slate-200">OpenStreetMap Contributors</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Potential road-data source; current map uses bundled illustrative coordinates.</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <div className="font-semibold text-slate-200">Copernicus DEM (European Space Agency)</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Potential elevation source; no DEM extraction is included in this version.</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <div className="font-semibold text-slate-200">Jaipur Municipal Corporation (JMC)</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Municipal reference domain; no verified JMC drainage feed is connected.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
