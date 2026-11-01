import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ShieldAlert, CloudRain, Map, Compass, Bell, Cpu,
  FileText, Sliders, BarChart3, Info, Building2,
  ChevronDown, AlertTriangle, Radio
} from 'lucide-react';
import { api } from '../services/api';
import { WeatherCurrent, AlertItem } from '../types';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [weather, setWeather] = useState<WeatherCurrent | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [showAlertDrawer, setShowAlertDrawer] = useState(false);
  const [activeCity] = useState('Jaipur, RJ');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const w = await api.getCurrentWeather();
        setWeather(w);
        const a = await api.getAlerts();
        setAlerts(a);
      } catch (e) {
        console.warn('Failed to load navbar data:', e);
      }
    };
    fetchData();
    const timer = setInterval(fetchData, 60000);
    return () => clearInterval(timer);
  }, []);

  const navLinks = [
    { to: '/', label: 'Overview', icon: Building2 },
    { to: '/map', label: 'Live Map', icon: Map },
    { to: '/predict', label: 'AI Risk', icon: Cpu },
    { to: '/rainfall', label: 'Rainfall', icon: CloudRain },
    { to: '/routes', label: 'Safe Routes', icon: Compass },
    { to: '/citizen', label: 'Citizen Portal', icon: FileText },
    { to: '/simulator', label: 'Digital Twin', icon: Sliders },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/admin', label: 'Command Center', icon: ShieldAlert },
    { to: '/about', label: 'About', icon: Info },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#070b14]/90 backdrop-blur-md border-b border-slate-800">
      {/* Top Banner Ticker */}
      <div className="bg-[#0b1329] px-4 py-1.5 border-b border-slate-800/60 text-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-cyan-400 font-semibold tracking-wide">
            <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
            JAIPUR HACKATHON PROTOTYPE
          </span>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-2 text-slate-300">
            <span>Current-hour rainfall:</span>
            <span className="font-mono text-cyan-300 font-semibold">
              {weather ? `${weather.current_precipitation_mm} mm` : '—'}
            </span>
            <span className="text-slate-500">({weather?.weather_condition || 'Weather unavailable'})</span>
          </div>
          <span className="hidden md:inline text-slate-600">|</span>
          <div className="hidden md:flex items-center gap-1.5 text-slate-400">
            <span>3h Acc:</span>
            <span className="font-mono text-amber-400 font-medium">
              {weather ? `${weather.rainfall_cum_3h_mm} mm` : '—'}
            </span>
          </div>
        </div>

        {/* Alerts Pill */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowAlertDrawer(!showAlertDrawer)}
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />
              <span className="font-semibold">{alerts.length} Alerts (incl. demo)</span>
              <ChevronDown className="w-3 h-3 ml-0.5" />
            </button>

            {/* Alert Dropdown Modal */}
            {showAlertDrawer && (
              <div className="absolute right-0 mt-2 w-80 md:w-96 bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl p-4 z-50 text-slate-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h4 className="font-semibold text-rose-400 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" /> Hyperlocal Early Warnings
                  </h4>
                  <button
                    onClick={() => setShowAlertDrawer(false)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Close
                  </button>
                </div>
                <div className="mt-3 space-y-2 max-h-72 overflow-y-auto">
                  {alerts.map((alt) => (
                    <div
                      key={alt.id}
                      className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-500/20 text-xs"
                    >
                      <div className="flex items-center justify-between font-semibold text-rose-300">
                        <span>{alt.location_name}</span>
                        <span className="px-1.5 py-0.2 bg-rose-500/20 rounded text-[10px]">
                          {alt.risk_level}
                        </span>
                      </div>
                      <p className="text-slate-300 mt-1">{alt.alert_message}</p>
                      <p className="text-cyan-400 mt-1 font-mono text-[11px]">
                        Action: {alt.suggested_action}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-amber-950/70 border-b border-amber-700/40 px-4 py-1.5 text-center text-[11px] text-amber-200">
        Prototype only: road, terrain and drainage values are illustrative; alerts and risk scores are not verified emergency warnings.
      </div>

      {/* Main Nav Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Branding */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                  AquaGuard <span className="text-cyan-400">AI</span>
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium tracking-wide">
                Predict Before It Floods. Protect Every Street.
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <Link
              to="/citizen"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-md shadow-cyan-500/20 transition-all"
            >
              <FileText className="w-3.5 h-3.5" />
              Report Flood
            </Link>
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 transition-all"
            >
              <Building2 className="w-3.5 h-3.5 text-cyan-400" />
              Control Room
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Horizontal Nav Bar */}
      <div className="lg:hidden overflow-x-auto flex items-center gap-1 px-3 py-2 bg-[#090f20] border-t border-slate-800 scrollbar-none">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {link.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
};
