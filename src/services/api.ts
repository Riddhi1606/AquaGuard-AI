import axios from 'axios';
import {
  WeatherCurrent, WeatherForecast, RiskMapResponse, RoadSegment,
  CitizenReport, SafeRouteResponse, SimulationResponse, AlertItem,
  AnalyticsOverview, ModelMetrics
} from '../types';

const configuredApiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const API_BASE = configuredApiUrl
  ? (configuredApiUrl.endsWith('/api') ? configuredApiUrl : `${configuredApiUrl}/api`)
  : '/api';

// Admin key is entered by an authorized operator and kept only for this tab.
// It is never baked into the public frontend build.
const getAdminHeaders = (): { 'X-Admin-Key': string } => {
  let key = sessionStorage.getItem('aquaguard_admin_key') || '';
  if (!key) {
    key = window.prompt('Enter the AquaGuard admin key to access control-room actions:') || '';
    if (key) sessionStorage.setItem('aquaguard_admin_key', key);
  }
  return { 'X-Admin-Key': key };
};

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

export const api = {
  // Health
  getHealth: async () => (await client.get('/health')).data,
  getCities: async () => (await client.get('/cities')).data,

  // Weather
  getCurrentWeather: async (): Promise<WeatherCurrent> => 
    (await client.get('/weather/current')).data,
  
  getWeatherForecast: async (): Promise<WeatherForecast> => 
    (await client.get('/weather/forecast')).data,

  // Map & Risk
  getRoadSegments: async (): Promise<RoadSegment[]> => 
    (await client.get('/map/road-segments')).data,

  getLiveRiskMap: async (): Promise<RiskMapResponse> => 
    (await client.get('/flood/risk-map')).data,

  getSegmentDetails: async (segmentId: string): Promise<RoadSegment> => 
    (await client.get(`/flood/segment/${segmentId}`)).data,

  predictCustom: async (params: {
    segment_id: string;
    custom_rainfall_intensity?: number;
    custom_rainfall_3h?: number;
    custom_drainage_condition?: string;
    model_type?: string;
  }) => (await client.post('/flood/predict', params)).data,

  // Simulation
  simulateScenario: async (params: {
    rainfall_scenario_mm: number;
    duration_hours: number;
    drainage_blockage_factor: number;
    antecedent_rainfall_mm: number;
  }): Promise<SimulationResponse> => 
    (await client.post('/flood/simulate', params)).data,

  // Citizen Reports
  submitReport: async (report: {
    latitude: number;
    longitude: number;
    road_name: string;
    water_depth: string;
    passability: string;
    description?: string;
    image_url?: string;
    reporter_name?: string;
  }): Promise<CitizenReport> => 
    (await client.post('/reports', report)).data,

  getReports: async (statusFilter?: string): Promise<CitizenReport[]> => 
    (await client.get('/reports', { params: { status_filter: statusFilter } })).data,

  updateReportStatus: async (reportId: number, status: string, adminNotes?: string): Promise<CitizenReport> => 
    (await client.patch(`/reports/${reportId}/status`, { status, admin_notes: adminNotes }, { headers: getAdminHeaders() })).data,

  // Routing
  calculateSafeRoute: async (params: {
    start_lat: number;
    start_lon: number;
    end_lat: number;
    end_lon: number;
    avoid_high_risk?: boolean;
  }): Promise<SafeRouteResponse> => 
    (await client.post('/routes/safe', params)).data,

  // Alerts
  getAlerts: async (): Promise<AlertItem[]> => 
    (await client.get('/alerts')).data,

  getEmergencyServices: async () => 
    (await client.get('/emergency-services')).data,

  // Analytics & Admin
  getAnalyticsOverview: async (): Promise<AnalyticsOverview> => 
    (await client.get('/analytics/overview')).data,

  getAdminIncidents: async () => 
    (await client.get('/admin/incidents', { headers: getAdminHeaders() })).data,

  getMLMetrics: async (): Promise<ModelMetrics> => 
    (await client.get('/ml/metrics')).data,
};
