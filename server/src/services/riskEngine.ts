import { Transaction, RiskLevel } from '../types';

export class RiskEngine {
  private userHistory: Map<string, { count: number, lastTime: number, countries: Set<string> }> = new Map();
  private avgTransactionAmount = 500; // Simulated moving average

  public analyze(tx: Transaction): { score: number, level: RiskLevel, explanation: string[] } {
    let score = tx.risk_seed_score * 40; // Base score from seed
    const explanations: string[] = [];

    // 1. Amount Anomaly
    if (tx.amount > this.avgTransactionAmount * 5) {
      score += 30;
      explanations.push(`High value transaction: $${tx.amount} exceeds average threshold`);
    }

    // 2. Velocity Check
    const history = this.userHistory.get(tx.user_id) || { count: 0, lastTime: 0, countries: new Set() };
    const now = Date.now();
    
    if (history.lastTime > 0) {
      const timeDiff = (now - history.lastTime) / 1000; // seconds
      if (timeDiff < 5) {
        score += 25;
        explanations.push(`High velocity detected: ${timeDiff.toFixed(1)}s since last transaction`);
      }
    }

    // 3. Geo Anomaly
    if (history.countries.size > 0 && !history.countries.has(tx.geo_location.country)) {
      score += 20;
      explanations.push(`Geographic shift: User seen in ${tx.geo_location.country} after ${Array.from(history.countries).join(', ')}`);
    }

    // Update history
    history.count++;
    history.lastTime = now;
    history.countries.add(tx.geo_location.country);
    this.userHistory.set(tx.user_id, history);

    // Final score normalization
    const finalScore = Math.min(100, Math.max(0, score));
    
    return {
      score: finalScore,
      level: this.getRiskLevel(finalScore),
      explanation: explanations.length > 0 ? explanations : ['Nominal behavior patterns detected']
    };
  }

  private getRiskLevel(score: number): RiskLevel {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 30) return 'medium';
    return 'low';
  }
}
