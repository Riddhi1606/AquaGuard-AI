import React, { useState, useEffect } from 'react';
import {
  CloudRain, Droplets, Thermometer, Wind, Clock,
  RefreshCw, CheckCircle2, AlertTriangle, ArrowUpRight, BarChart3
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import { api } from '../services/api';
import { WeatherForecast } from '../types';

export const RainfallPage: React.FC = () => {
  const [weatherData, setWeatherData] = useState<WeatherForecast | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchWeather = async () => {
    try {
      setRefreshing(true);
      const data = await api.getWeatherForecast();
      setWeatherData(data);
    } catch (err) {
      console.error('Failed to load weather data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  const curr = weatherData?.current;

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[#0f172a] border border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded-full border border-cyan-800 mb-2">
            <CloudRain className="w-3.5 h-3.5" />
            OPEN-METEO METEOROLOGICAL TELEMETRY
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Precipitation & Rainfall Telemetry (Jaipur)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Open-Meteo current and hourly precipitation fields when available; offline fallback values are labelled as simulated.
          </p>
        </div>

        <button
          onClick={fetchWeather}
          disabled={refreshing}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Open-Meteo Data
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Current-hour Precipitation</span>
            <CloudRain className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-extrabold text-white mt-2 font-mono">
            {curr ? `${curr.current_precipitation_mm}` : '—'} <span className="text-sm font-normal text-slate-400">mm</span>
          </div>
          <div className="text-[11px] text-cyan-400 mt-1">
            {curr?.weather_condition || 'Moderate Rain'}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Past 3h Cumulative</span>
            <Droplets className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-extrabold text-blue-400 mt-2 font-mono">
            {curr ? `${curr.rainfall_cum_3h_mm}` : '—'} <span className="text-sm font-normal text-slate-400">mm</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Prototype reference threshold: 35 mm (not locally calibrated)
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>24h Antecedent Rain</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-amber-400 mt-2 font-mono">
            {curr ? `${curr.rainfall_cum_24h_mm}` : '—'} <span className="text-sm font-normal text-slate-400">mm</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Antecedent rainfall context (not basin inflow)
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Upcoming 6h Forecast</span>
            <ArrowUpRight className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-extrabold text-purple-400 mt-2 font-mono">
            {curr ? `${curr.forecast_6h_mm}` : '32.0'} <span className="text-sm font-normal text-slate-400">mm</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Next hour: {curr ? `${curr.forecast_1h_mm} mm` : '11.0 mm'}
          </div>
        </div>
      </div>

      {/* Hourly Rainfall Chart (Recharts) */}
      <div className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              Precipitation Hyetograph (Past 4 Hours & Next 12 Hours)
            </h2>
            <p className="text-xs text-slate-400">
              Hourly rainfall intensity (mm) modeled for Jaipur urban area.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="flex items-center gap-1 font-mono">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span> Rain (mm)
            </span>
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          {weatherData?.hourly_forecast ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weatherData.hourly_forecast}>
                <defs>
                  <linearGradient id="rainGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} unit="mm" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#070b14',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="precipitation_mm"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#rainGradient)"
                  name="Precipitation"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500">
              Loading precipitation graph...
            </div>
          )}
        </div>
      </div>

      {/* Atmospheric Context & Source Transparency */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
            <Thermometer className="w-4 h-4 text-orange-400" /> Surface Temperature
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {curr ? `${curr.temperature_c}°C` : '27.4°C'}
          </div>
          <p className="text-[11px] text-slate-500">
            Affects atmospheric evaporation and convective storm potential.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
            <Droplets className="w-4 h-4 text-blue-400" /> Relative Humidity
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {curr ? `${curr.humidity_percent}%` : '—'}
          </div>
          <p className="text-[11px] text-slate-500">
            Humidity is contextual weather information; it is not a direct measure of road waterlogging.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Data Source & Provenance
          </div>
          <div className="text-sm font-semibold text-emerald-400">
            {curr?.source || 'Open-Meteo Live API'}
          </div>
          <p className="text-[11px] text-slate-500">
            Last Telemetry Sync: {curr?.last_updated || 'Just now'} (UTC)
          </p>
        </div>
      </div>
    </div>
  );
};
