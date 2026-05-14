import { GoogleGenerativeAI } from '@google/generative-ai';
import { Transaction } from '../types';

export interface AIResponse {
  summary: string;
  insights: string[];
  risk_analysis: string;
  supporting_events: string[];
  recommendation: string;
}

export class AIService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      console.log('[AI_SERVICE] Initializing with Gemini API Key.');
      this.genAI = new GoogleGenerativeAI(apiKey);
    } else {
      console.warn('[AI_SERVICE] No Gemini API Key found in process.env');
    }
  }

  public async analyzeContext(query: string, recentTransactions: Transaction[]): Promise<AIResponse> {
    if (!this.genAI) {
      console.warn('[AI_SERVICE] No GEMINI_API_KEY found. Falling back to simulation.');
      return this.simulateReasoning(query, recentTransactions);
    }

    try {
      console.log(`[AI_SERVICE] Attempting universal model: gemini-pro`);
      const model = this.genAI.getGenerativeModel({ 
        model: 'gemini-pro'
      });

      const prompt = this.buildContextPrompt(query, recentTransactions);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      
      // Manually extract JSON if gemini-pro wraps it in markdown blocks
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      console.log(`[AI_SERVICE] Gemini response successful.`);
      return JSON.parse(text);
    } catch (error: any) {
      console.error(`[AI_SERVICE] !!! GEMINI API ERROR !!!`);
      console.error(`Message: ${error.message}`);
      if (error.response) {
        console.error(`Data: ${JSON.stringify(error.response.data)}`);
      }
      return this.simulateReasoning(query, recentTransactions);
    }
  }

  private buildContextPrompt(query: string, txs: Transaction[]): string {
    const dataSummary = txs.map(tx => ({
      id: tx.transaction_id.slice(0, 8),
      amount: tx.amount,
      country: tx.geo_location.country,
      risk: tx.risk_score,
      explanation: tx.explanation,
      category: tx.category
    }));

    return `
      System: You are OBLIVION_AI, the core reasoning engine for a financial intelligence OS.
      Data Context (Recent Transactions): ${JSON.stringify(dataSummary)}
      User Query: "${query}"

      Task: Analyze the data context relative to the query. 
      Output MUST be valid JSON with this exact schema:
      {
        "summary": "Brief overview of current system pulse",
        "insights": ["Specific insight 1", "Specific insight 2"],
        "risk_analysis": "Detailed reasoning about risk patterns and anomalies",
        "supporting_events": ["list of relevant transaction IDs"],
        "recommendation": "Executive action advice"
      }
      Focus on regional trends, high-risk clusters, and unusual category activity. Be sharp and professional.
    `;
  }

  private simulateReasoning(query: string, recentTransactions: Transaction[]): AIResponse {
    const highRiskCount = recentTransactions.filter(tx => (tx.risk_score || 0) > 70).length;
    const topCountries = Array.from(new Set(recentTransactions.map(tx => tx.geo_location.country))).slice(0, 3);

    return {
      summary: `[SIMULATION] Monitoring ${recentTransactions.length} events across ${topCountries.join(', ')}.`,
      insights: [
        `System state: ${highRiskCount > 0 ? 'ALERT' : 'NOMINAL'}`,
        `Query referenced: "${query}"`,
        `Directing focus to ${topCountries[0] || 'active clusters'}.`
      ],
      risk_analysis: `Manual Override: Gemini API key missing. Providing heuristic analysis based on regional velocity and risk seeds.`,
      supporting_events: recentTransactions.slice(0, 3).map(tx => tx.transaction_id.slice(0, 8)),
      recommendation: "Please provide GEMINI_API_KEY in .env for live intelligence reasoning."
    };
  }
}
