import React from 'react';
import { ShieldAlert, ExternalLink, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#070b14] border-t border-slate-800/80 py-8 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-500 flex items-center justify-center text-slate-950 font-bold">
                <ShieldAlert className="w-4 h-4 text-slate-950" />
              </div>
              <span className="text-sm font-bold text-white tracking-wide">
                AquaGuard <span className="text-cyan-400">AI</span>
              </span>
            </div>
            <p className="text-slate-400 max-w-md leading-relaxed">
              AI-Powered Hyperlocal Flood Prediction & Smart City Early Warning System.
              Protecting urban citizens, commuters, and critical infrastructure with street-level
              topographic runoff models and machine learning.
            </p>
            <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
              <span>Pilot City: Jaipur, Rajasthan</span>
              <span>•</span>
              <span>Bounding Box: [26.80°N, 75.70°E]</span>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-200 mb-3 uppercase tracking-wider text-[11px]">
              Geospatial & Data Stack
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li className="flex items-center gap-1.5 hover:text-cyan-400">
                <ExternalLink className="w-3 h-3 text-cyan-400" />
                <span>Copernicus DEM (planned integration)</span>
              </li>
              <li className="flex items-center gap-1.5 hover:text-cyan-400">
                <ExternalLink className="w-3 h-3 text-cyan-400" />
                <span>OSM / Overpass helper (separate utility)</span>
              </li>
              <li className="flex items-center gap-1.5 hover:text-cyan-400">
                <ExternalLink className="w-3 h-3 text-cyan-400" />
                <span>Open-Meteo High-Resolution Precipitation</span>
              </li>
              <li className="flex items-center gap-1.5 hover:text-cyan-400">
                <ExternalLink className="w-3 h-3 text-cyan-400" />
                <span>Dravyavati River Basin Infrastructure</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-200 mb-3 uppercase tracking-wider text-[11px]">
              AI Architecture
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li>XGBoost & Random Forest Classifiers</li>
              <li>SHAP (Shapley Additive Explanations)</li>
              <li>NetworkX Risk-Penalized Graph Routing</li>
              <li>Rational Method Hydrological Physics</li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <div>
            &copy; {new Date().getFullYear()} AquaGuard AI. Built for Smart City Disaster Resilience Hackathon.
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Designed for Municipal Impact with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>in India</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
