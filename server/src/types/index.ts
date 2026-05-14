export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Transaction {
  transaction_id: string;
  timestamp: number;
  user_id: string;
  merchant_id: string;
  amount: number;
  currency: string;
  geo_location: {
    lat: number;
    lng: number;
    country: string;
  };
  device_id: string;
  payment_method: string;
  risk_seed_score: number;
  category: string;
  risk_score?: number;
  risk_level?: RiskLevel;
  explanation?: string;
}

export interface AnomalyEvent {
  event_id: string;
  timestamp: number;
  type: string;
  severity: RiskLevel;
  description: string;
  transaction_ids: string[];
}

export interface SystemState {
  tps: number;
  avg_risk: number;
  active_alerts: number;
  incident_count: number;
}
