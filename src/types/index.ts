export type RiskCategory = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface WeatherCurrent {
  city: string;
  latitude: number;
  longitude: number;
  current_precipitation_mm: number;
  hourly_rate_mm: number;
  rainfall_previous_1h_mm: number;
  rainfall_cum_3h_mm: number;
  rainfall_cum_24h_mm: number;
  forecast_1h_mm: number;
  forecast_6h_mm: number;
  temperature_c: number;
  humidity_percent: number;
  weather_condition: string;
  source: string;
  last_updated: string;
  is_live: boolean;
}

export interface HourlyWeatherPoint {
  time: string;
  precipitation_mm: number;
  temperature_c: number;
}

export interface WeatherForecast {
  city: string;
  current: WeatherCurrent;
  hourly_forecast: HourlyWeatherPoint[];
}

export interface RiskFactor {
  factor: string;
  impact: string;
  contribution: number;
  detail: string;
}

export interface RoadSegment {
  segment_id: string;
  name: string;
  road_type: string;
  coordinates: [number, number][];
  length_m: number;
  elevation_m: number;
  slope_deg: number;
  distance_to_drain_m: number;
  drainage_status: string;
  drainage_capacity_m3s: number;
  basin_id?: string;
  underpass: boolean;
  historical_incidents_count: number;
  speed_limit_kmh: number;
  critical_infrastructure_nearby?: string;
  risk_score?: number;
  risk_category?: RiskCategory;
  confidence?: number;
  contributing_factors?: RiskFactor[];
  recommended_action?: string;
}

export interface RiskMapResponse {
  city: string;
  total_segments: number;
  summary: {
    LOW: number;
    MODERATE: number;
    HIGH: number;
    CRITICAL: number;
  };
  segments: RoadSegment[];
  weather_context: Record<string, any>;
  generated_at: string;
}

export interface CitizenReport {
  id: number;
  report_uid: string;
  latitude: number;
  longitude: number;
  road_name: string;
  water_depth: string;
  passability: string;
  description?: string;
  image_url?: string;
  reporter_name: string;
  status: 'pending' | 'verified' | 'rejected' | 'resolved';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface RouteDetail {
  coordinates: [number, number][];
  distance_m: number;
  distance_km: number;
  avg_risk: number;
  segments: {
    segment_id: string;
    name: string;
    risk: number;
    distance: number;
  }[];
}

export interface SafeRouteResponse {
  route_status: string;
  standard_route: RouteDetail;
  safe_route: RouteDetail;
  segments_avoided: {
    segment_id: string;
    name: string;
    risk_score: number;
    risk_category: RiskCategory;
  }[];
  risk_reduction_pct: number;
  distance_delta_meters: number;
  travel_advisory: string;
}

export interface SimulationResponse {
  scenario_description: string;
  rainfall_intensity_effective: number;
  total_segments_analyzed: number;
  category_counts_before: Record<string, number>;
  category_counts_after: Record<string, number>;
  escalated_segments: {
    segment_id: string;
    road_name: string;
    risk_score: number;
    risk_category: RiskCategory;
    primary_cause: string;
  }[];
  segments: RoadSegment[];
  simulated_at: string;
}

export interface AlertItem {
  id: number;
  alert_uid: string;
  segment_id?: string;
  location_name: string;
  risk_level: RiskCategory;
  alert_message: string;
  reason: string;
  suggested_action: string;
  created_at: string;
}

export interface AnalyticsOverview {
  monitored_city: string;
  total_road_network_km: number;
  total_monitored_segments: number;
  risk_distribution: Record<string, number>;
  active_incidents: number;
  verified_reports_24h: number;
  historical_hotspots: {
    rank: number;
    segment_id: string;
    name: string;
    historical_incidents: number;
    vulnerability_index: string;
  }[];
  rainfall_24h_trend: {
    hour: string;
    rainfall_mm: number;
  }[];
  system_readiness: string;
  last_evaluation: string;
}

export interface ModelMetrics {
  active_model: string;
  features: string[];
  training_samples: number;
  test_samples: number;
  evaluated_at: string;
  benchmark_comparison: Record<string, {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    roc_auc: number;
    pr_auc: number;
    confusion_matrix: number[][];
  }>;
  global_feature_importance: Record<string, number>;
  data_readiness: string;
}
