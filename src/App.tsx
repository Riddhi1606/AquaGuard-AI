import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { OverviewPage } from './pages/OverviewPage';
import { LiveMapPage } from './pages/LiveMapPage';
import { PredictPage } from './pages/PredictPage';
import { RainfallPage } from './pages/RainfallPage';
import { SafeRoutePage } from './pages/SafeRoutePage';
import { CitizenPortalPage } from './pages/CitizenPortalPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { HistoricalAnalyticsPage } from './pages/HistoricalAnalyticsPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AboutPage } from './pages/AboutPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <Routes>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/map" element={<LiveMapPage />} />
            <Route path="/predict" element={<PredictPage />} />
            <Route path="/rainfall" element={<RainfallPage />} />
            <Route path="/routes" element={<SafeRoutePage />} />
            <Route path="/citizen" element={<CitizenPortalPage />} />
            <Route path="/simulator" element={<SimulatorPage />} />
            <Route path="/analytics" element={<HistoricalAnalyticsPage />} />
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;
