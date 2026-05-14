import { Transaction, RiskLevel } from '../types';

export interface Incident {
  incident_id: string;
  timestamp: number;
  transactions: Transaction[];
  severity: RiskLevel;
  status: 'active' | 'resolved' | 'investigating';
  description: string;
}

export class IncidentService {
  private activeIncidents: Map<string, Incident> = new Map();
  private clusterThreshold = 60000; // 1 minute window for clustering

  public processTransaction(tx: Transaction): Incident | null {
    if ((tx.risk_score || 0) < 60) return null;

    // Try to find a recent incident in the same country
    for (const [id, incident] of this.activeIncidents) {
      const timeDiff = tx.timestamp - incident.timestamp;
      const sameRegion = incident.transactions.some(t => t.geo_location.country === tx.geo_location.country);

      if (timeDiff < this.clusterThreshold && sameRegion) {
        incident.transactions.push(tx);
        incident.severity = this.calculateSeverity(incident.transactions);
        return incident;
      }
    }

    // Create new incident
    const newIncident: Incident = {
      incident_id: `INC-${Math.floor(Math.random() * 10000)}`,
      timestamp: tx.timestamp,
      transactions: [tx],
      severity: tx.risk_level || 'medium',
      status: 'active',
      description: `Suspicious activity cluster detected in ${tx.geo_location.country}`
    };

    this.activeIncidents.set(newIncident.incident_id, newIncident);
    return newIncident;
  }

  private calculateSeverity(txs: Transaction[]): RiskLevel {
    const avgScore = txs.reduce((acc, tx) => acc + (tx.risk_score || 0), 0) / txs.length;
    if (avgScore > 80) return 'critical';
    if (avgScore > 60) return 'high';
    return 'medium';
  }

  public getActiveIncidents(): Incident[] {
    return Array.from(this.activeIncidents.values());
  }
}
