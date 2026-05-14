import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { TransactionGenerator } from './services/generator';
import { RiskEngine } from './services/riskEngine';
import { AIService } from './services/aiService';
import { IncidentService } from './services/incidentService';
import { Transaction } from './types';

dotenv.config();

if (process.env.GEMINI_API_KEY) {
  console.log('◇ [SYSTEM] Gemini API Key detected. Live Intelligence active.');
} else {
  console.warn('◈ [SYSTEM] Gemini API Key NOT found. Falling back to simulation.');
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Transaction Generator Instance
const riskEngine = new RiskEngine();
const aiService = new AIService();
const incidentService = new IncidentService();
const generator = new TransactionGenerator(io);

// Store recent transactions for context
const contextBuffer: Transaction[] = [];

// Override the emit to include risk analysis
const originalEmit = io.emit.bind(io);
// @ts-ignore
io.emit = (event: string, ...args: any[]) => {
  if (event === 'transaction') {
    const tx = args[0] as Transaction;
    const analysis = riskEngine.analyze(tx);
    tx.risk_score = analysis.score;
    tx.risk_level = analysis.level;
    tx.explanation = analysis.explanation.join(' | ');
    
    // Update context buffer
    contextBuffer.unshift(tx);
    if (contextBuffer.length > 100) contextBuffer.pop();

    if (tx.risk_score > 70) {
      originalEmit('alert', {
        id: uuidv4(),
        type: 'RISK_ALERT',
        severity: tx.risk_level,
        message: `High risk transaction detected in ${tx.geo_location.country}`,
        transaction: tx
      });

      const incident = incidentService.processTransaction(tx);
      if (incident) {
        originalEmit('incident', incident);
      }
    }
  }
  return originalEmit(event, ...args);
};

app.get('/health', (req, res) => {
  res.json({ status: 'active', system: 'OBLIVION' });
});

app.post('/api/config', (req, res) => {
  const { tps } = req.body;
  if (tps) {
    generator.setTPS(tps);
    res.json({ message: `TPS updated to ${tps}` });
  } else {
    res.status(400).json({ error: 'Missing tps value' });
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('analyze', async (data: { query: string, context: any[] }) => {
    console.log(`◇ [SYSTEM] AI Request Received: "${data.query}"`);
    try {
      const report = await aiService.analyzeContext(data.query, data.context);
      console.log(`◇ [SYSTEM] AI Report Generated. Sending to client...`);
      socket.emit('analysis_report', report);
    } catch (error) {
      console.error('AI analysis failed:', error);
      socket.emit('error', { message: 'AI analysis failed' });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start generating transactions
generator.start();

httpServer.listen(PORT, () => {
  console.log(`OBLIVION Backend Pulse active at http://localhost:${PORT}`);
});
