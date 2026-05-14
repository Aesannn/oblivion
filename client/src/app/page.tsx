'use client';

import { useEffect, useState, useRef, memo } from 'react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Activity, 
  Zap, 
  AlertTriangle, 
  ChevronRight,
  Target,
  Cpu,
  X,
  TrendingUp,
  Info,
  BarChart3,
  Radar
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  ResponsiveContainer, 
  Tooltip
} from 'recharts';

interface Transaction {
  transaction_id: string;
  amount: number;
  merchant_id: string;
  user_id: string;
  geo_location: {
    lat: number;
    lng: number;
    country: string;
  };
  category: string;
  timestamp: string;
  risk_score?: number;
  risk_level?: 'low' | 'medium' | 'high' | 'critical';
  explanation?: string;
}

interface Incident {
  id: string;
  type: string;
  severity: string;
  transactions: string[];
  summary: string;
  status: string;
  timestamp?: string;
  source_ip?: string;
}

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [systemState, setSystemState] = useState({
    avg_risk: 0,
    active_alerts: 0,
    throughput: 32, // Calibrated to 32
    uptime: '99.9%'
  });
  const [query, setQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [riskHistory, setRiskHistory] = useState<{time: string, risk: number}[]>([]);
  const [anomalyHistory, setAnomalyHistory] = useState<{time: string, count: number}[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Artificial loading delay for cinematic effect
    const loadingTimer = setTimeout(() => setIsLoading(false), 3500);
    return () => clearTimeout(loadingTimer);
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const s = io('http://localhost:3001');
    setSocket(s);

    const txBuffer: Transaction[] = [];

    s.on('connect', () => setIsConnected(true));
    s.on('disconnect', () => setIsConnected(false));

    s.on('transaction', (tx: Transaction) => {
      txBuffer.push(tx);
    });

    // --- TACTICAL SIMULATION FALLBACK ---
    const simulationInterval = setInterval(() => {
      if (!s.connected) {
        const mockTx: Transaction = {
          transaction_id: Math.random().toString(16).slice(2, 10),
          amount: Math.floor(Math.random() * 8000) + 100,
          category: ['retail', 'travel', 'electronics', 'crypto', 'food', 'gaming', 'luxury'][Math.floor(Math.random() * 7)],
          merchant_id: `MOCK_VENDOR_${Math.floor(Math.random() * 999)}`,
          geo_location: {
            lat: (Math.random() * 120) - 40,
            lng: (Math.random() * 360) - 180,
            country: ['US', 'GB', 'JP', 'DE', 'FR', 'SG', 'AE', 'CH', 'BR', 'AU'][Math.floor(Math.random() * 10)]
          },
          risk_score: Math.random() * 100,
          risk_level: Math.random() > 0.85 ? 'high' : 'low',
          status: 'processed'
        };
        txBuffer.push(mockTx);
      }
    }, 1500);

    const interval = setInterval(() => {
      if (txBuffer.length === 0) return;
      const newBatch = [...txBuffer].reverse();
      txBuffer.length = 0;
      
      setTransactions(prev => [...newBatch, ...prev].slice(0, 50));
      
      // Auto-trigger alerts for any transaction > 70% risk to synchronize with Live Pulse
      newBatch.filter(tx => (tx.risk_score || 0) > 70).forEach(tx => {
        const alertWithId = { 
          id: tx.transaction_id,
          internal_id: `${tx.transaction_id}-pulse-${Date.now()}`,
          message: `High risk activity detected: ${tx.geo_location.country} (${tx.risk_score?.toFixed(1)}%)`
        };
        setAlerts(prev => [alertWithId, ...prev].slice(0, 4));
        setTimeout(() => setAlerts(p => p.filter(a => a.internal_id !== alertWithId.internal_id)), 8000);
      });

      // Diversify Investigation Timeline
      const newIncidents = newBatch
        .filter(tx => (tx.risk_score || 0) > 50)
        .map(tx => {
          const risk = tx.risk_score || 0;
          let type: any = 'ANOMALY_DETECTION';
          let description = tx.explanation || 'Unusual vector activity.';
          let severity: any = 'medium';

          if (risk > 85) {
            type = 'CRITICAL_VULNERABILITY';
            severity = 'high';
          } else if (tx.amount > 5000) {
            type = 'LARGE_CAP_FLIGHT';
            description = `High-value shift: $${tx.amount.toLocaleString()} detected in ${tx.geo_location.country}.`;
          } else if (Math.random() > 0.7) {
            type = 'GEO_VELOCITY_SHIFT';
            description = `Rapid relocation pattern detected in ${tx.geo_location.country} sector.`;
          }

          return {
            id: `${tx.transaction_id.slice(0, 4)}-${type.slice(0, 4)}`,
            type,
            severity,
            summary: description,
            transactions: [tx.transaction_id],
            timestamp: new Date().toISOString(),
            status: 'investigating',
            source_ip: `0x${tx.transaction_id.slice(0, 4)}::TACTICAL`
          };
        });

      if (newIncidents.length > 0) {
        setIncidents(prev => [...newIncidents, ...prev].slice(0, 10));
      }
      
      setSystemState(prev => {
        let avgRisk = prev.avg_risk;
        let anomalyCount = 0;
        newBatch.forEach(tx => {
          avgRisk = (avgRisk * 0.98) + ((tx.risk_score || 0) * 0.02);
          if ((tx.risk_score || 0) > 75) anomalyCount++;
        });
        
        const timeStr = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setRiskHistory(h => [...h, { time: timeStr, risk: avgRisk }].slice(-20));
        setAnomalyHistory(h => [...h, { time: timeStr, count: anomalyCount }].slice(-20));

        return {
          ...prev,
          avg_risk: parseFloat(avgRisk.toFixed(2)),
          active_alerts: prev.active_alerts + anomalyCount
        };
      });
    }, 150); // Slightly throttled for smoother rendering

    s.on('alert', (alert: any) => {
      const alertWithId = { 
        ...alert, 
        internal_id: `${alert.id || Math.random()}-${Date.now()}` 
      };
      setAlerts(prev => [alertWithId, ...prev].slice(0, 4));
      setTimeout(() => setAlerts(p => p.filter(a => a.internal_id !== alertWithId.internal_id)), 10000);
    });

    s.on('incidents', (data: Incident[]) => {
      // Merge server incidents with our local tactical stream
      setIncidents(prev => {
        const combined = [...data, ...prev];
        const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
        return unique.slice(0, 10);
      });
    });

    return () => {
      s.disconnect();
      clearInterval(interval);
      clearInterval(simulationInterval);
    };
  }, [isLoading]);

  const handleAnalyze = () => {
    if (!query || !socket) return;
    setIsAnalyzing(true);
    socket.emit('analyze', { query, context: transactions.slice(0, 100) });
    socket.once('analysis_report', (report) => {
      setAiAnalysis(report);
      setIsAnalyzing(false);
    });
  };

  return (
    <div className="min-h-screen md:h-screen w-full bg-background relative overflow-x-hidden overflow-y-auto md:overflow-hidden">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <LoadingScreen key="loading" isMounted={isMounted} />
        ) : (
          <motion.main
            key="dashboard"
            initial={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0)' }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="min-h-screen md:h-screen bg-background text-foreground hex-bg overflow-x-hidden overflow-y-auto md:overflow-hidden flex flex-col p-2 md:p-3 relative pb-24 md:pb-3"
          >
            <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
              <div className="w-full h-1/2 bg-gradient-to-b from-transparent via-primary/5 to-transparent animate-scanline opacity-10" />
            </div>

            <header className="min-h-16 md:h-16 shrink-0 flex flex-col md:flex-row items-center justify-between px-4 md:px-6 py-3 md:py-0 glass-panel border-white/5 mb-3 gap-4 md:gap-0">
              <div className="flex items-center gap-4">
                <Shield className="w-6 h-6 text-primary" />
                <div>
                  <h1 className="text-xl font-black tracking-tighter text-white italic uppercase">Oblivion</h1>
                  <p className="text-[10px] font-mono text-primary/60 tracking-[0.4em] uppercase">Tactical_Command_OS</p>
                </div>
              </div>
              
              <div className="flex items-center gap-10">
                <MetricMini label="SYSTEM_LOAD" value={`${systemState.throughput} TPS`} color="text-primary" />
                <MetricMini label="THREAT_LEVEL" value={`${systemState.avg_risk}%`} color="text-risk-medium" />
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-risk-low animate-pulse' : 'bg-risk-critical'}`} />
              </div>
            </header>

            <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-3 mb-3">
              <aside className="col-span-1 md:col-span-3 flex flex-col gap-3 min-h-0">
                <div className="h-[300px] md:h-auto md:flex-1 glass-panel flex flex-col p-4 bg-black/40 min-h-0">
                    <div className="flex items-center gap-2 mb-3 shrink-0">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Risk Vector</span>
                    </div>
                    <div className="flex-1 min-h-0 w-full h-full">
                      {isMounted && (
                        <ResponsiveContainer width="100%" height="100%" debounce={50}>
                            <AreaChart data={riskHistory}>
                              <Area type="monotone" dataKey="risk" stroke="var(--primary)" fillOpacity={0.1} fill="var(--primary)" isAnimationActive={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/5 flex justify-between px-1">
                       <div className="flex flex-col"><span className="text-[7px] text-primary/40 uppercase">Peak Vector</span><span className="text-[10px] font-mono text-white/80">{Math.max(...riskHistory.map(h => h.risk || 0), 0).toFixed(1)}%</span></div>
                       <div className="flex flex-col items-center"><span className="text-[7px] text-primary/40 uppercase">Volatility</span><span className="text-[10px] font-mono text-white/80">LOW</span></div>
                       <div className="flex flex-col items-end"><span className="text-[7px] text-primary/40 uppercase">Stability</span><span className="text-[10px] font-mono text-white/80">NOMINAL</span></div>
                    </div>
                </div>
                <div className="h-[350px] md:h-auto md:flex-1 glass-panel flex flex-col p-4 bg-black/40 min-h-0">
                    <div className="flex items-center gap-2 mb-3 shrink-0">
                      <BarChart3 className="w-4 h-4 text-risk-high" />
                      <span className="text-[10px] font-bold tracking-widest uppercase text-risk-high">Anomaly Clusters</span>
                    </div>
                    <div className="flex-1 min-h-0 relative flex items-center justify-center overflow-hidden">
                      {transactions.length > 0 ? (
                        <AnomalyHub transactions={transactions} />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="flex flex-col items-center gap-2 opacity-20">
                            <Activity className="w-8 h-8 text-risk-high animate-pulse" />
                            <span className="text-[8px] font-mono uppercase tracking-widest">Scanning_Neural_Nodes...</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/5 flex justify-between px-1">
                       <div className="flex flex-col"><span className="text-[7px] text-risk-high/40 uppercase">Active Nodes</span><span className="text-[10px] font-mono text-white/80">07</span></div>
                       <div className="flex flex-col items-center"><span className="text-[7px] text-risk-high/40 uppercase">Max Vector</span><span className="text-[10px] font-mono text-white/80">CRYPTO::84%</span></div>
                       <div className="flex flex-col items-end"><span className="text-[7px] text-risk-high/40 uppercase">Status</span><span className="text-[10px] font-mono text-risk-high">ALERT</span></div>
                    </div>
                </div>
                <div className="h-36 shrink-0 glass-panel p-4 bg-primary/5">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-4 h-4 text-primary" />
                      <span className="text-[10px] font-bold tracking-widest uppercase">System Bulletin</span>
                    </div>
                    <div className="text-[11px] font-mono text-muted-foreground leading-relaxed italic mb-3">
                      [SYS] Gemini-Pro recalibrated. Active monitoring online.
                    </div>
                    <div className="space-y-2">
                      <MetricProgress label="Network Saturation" value={64} />
                      <MetricProgress label="Threat Buffer" value={systemState.avg_risk} color="var(--risk-medium)" />
                    </div>
                </div>
              </aside>

              <section className="col-span-1 md:col-span-6 flex flex-col gap-3 min-h-0">
                <div className="h-[400px] md:h-auto md:flex-[3] glass-panel relative bg-black/60 overflow-hidden min-h-0 border-primary/20">
                  <div className="absolute top-4 left-4 z-20">
                    <div className="px-3 py-1.5 bg-black/60 border border-white/10 rounded text-[10px] font-mono text-primary flex items-center gap-2 backdrop-blur-md uppercase tracking-widest">
                        <Radar className="w-4 h-4 animate-pulse" />
                        Tactical_Geoprojection_v6
                    </div>
                  </div>
                  <HolographicMap transactions={transactions} isMounted={isMounted} />
                </div>
                <div className="h-36 shrink-0 glass-panel flex flex-col overflow-hidden bg-black/40">
                  <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-risk-high" />
                      <span className="text-[10px] font-bold tracking-widest uppercase">Investigation Timeline</span>
                    </div>
                    <div className="flex items-center gap-4 text-[8px] font-mono text-white/40 uppercase tracking-tighter">
                      <span>Live_Monitoring_Active</span>
                      <div className="flex gap-1">
                        {[1, 2, 3].map(i => <motion.div key={i} className="w-1 h-1 bg-risk-low" animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }} />)}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 flex gap-3 p-3 overflow-x-auto tactical-scrollbar min-h-0 relative">
                    {incidents.length > 0 ? (
                      incidents.map((inc, i) => (
                        <IncidentCard key={inc.id || `inc-${i}`} incident={inc} />
                      ))
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex items-center gap-3 opacity-20">
                          <Cpu className="w-5 h-5 animate-spin" />
                          <span className="text-[9px] font-mono uppercase tracking-[0.4em] italic">Awaiting_Threat_Detection_Sequence...</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <aside className="col-span-1 md:col-span-3 h-[450px] md:h-auto glass-panel flex flex-col bg-black/20 min-h-0 border-white/5">
                <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0 bg-primary/5">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    <span className="text-[11px] font-bold tracking-widest uppercase">Live Intelligence Pulse</span>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto tactical-scrollbar p-3 space-y-2 min-h-0">
                  <AnimatePresence initial={false}>
                    {transactions.map((tx, i) => (
                      <TransactionItem key={tx.transaction_id || `tx-${i}`} tx={tx} />
                    ))}
                  </AnimatePresence>
                </div>
              </aside>
            </div>

            <footer className="fixed md:relative bottom-4 md:bottom-0 left-0 right-0 md:left-auto md:right-auto md:w-full shrink-0 glass-panel p-3 md:p-4 bg-black/95 md:bg-black/90 border-t md:border-none border-primary/20 z-50 mx-2 md:mx-0 rounded-lg md:rounded-none">
              <AnimatePresence>
                {aiAnalysis && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="relative border-b border-white/10 pb-4 mb-3">
                    <button onClick={() => setAiAnalysis(null)} className="absolute top-0 right-0 p-1 text-muted-foreground hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pr-10">
                      <div><span className="text-[10px] font-bold text-primary uppercase">Tactical Summary</span><p className="text-[12px] text-foreground font-mono mt-1 leading-relaxed">{aiAnalysis.summary}</p></div>
                      <div><span className="text-[10px] font-bold text-risk-medium uppercase">Risk Insights</span><ul className="mt-1 space-y-1">{aiAnalysis.insights.map((insight: string, i: number) => (<li key={i} className="text-[11px] text-muted-foreground flex gap-2"><ChevronRight className="w-3 h-3 text-primary shrink-0" />{insight}</li>))}</ul></div>
                      <div className="p-3 bg-primary/5 border border-primary/20 rounded"><span className="text-[10px] font-bold text-primary uppercase italic">Directive</span><p className="text-[11px] text-white font-mono mt-1 font-bold">{aiAnalysis.recommendation}</p></div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/20 rounded flex items-center justify-center shrink-0 border border-primary/30"><Cpu className={`w-5 h-5 text-primary ${isAnalyzing ? 'animate-spin' : ''}`} /></div>
                <div className="flex-1 relative"><input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()} type="text" placeholder="Query OBLIVION Intel Engine..." className="w-full bg-white/5 border border-white/10 rounded-lg px-5 py-3 text-xs font-mono outline-none focus:border-primary/50 transition-all" /></div>
              </div>
            </footer>

            {/* FIXED ALERT OVERLAY: Smooth Top-Down Flow with popLayout to prevent gaps */}
            <div className="fixed top-4 right-4 md:top-20 md:right-8 z-[60] flex flex-col gap-2 md:gap-3 w-72 md:w-80 pointer-events-none">
              <AnimatePresence mode="popLayout">
                {alerts.map((alert) => (
                  <motion.div
                    layout
                    key={alert.internal_id}
                    initial={{ y: -150, opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
                    animate={{ y: 0, opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    exit={{ x: 200, opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 500, 
                      damping: 35,
                      mass: 1
                    }}
                    className="glass-panel bg-risk-high/20 border-risk-high/50 p-3 md:p-4 shadow-[0_0_25px_rgba(248,81,73,0.2)] backdrop-blur-xl group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-risk-high/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-risk-high/20 flex items-center justify-center border border-risk-high/30">
                        <AlertTriangle className="w-5 h-5 text-risk-high animate-pulse" />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black text-risk-high uppercase tracking-[0.2em]">Threat_Detected</span>
                          <span className="text-[8px] font-mono text-white/40">{isMounted ? new Date().toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' }) : '--:--:--'}</span>
                        </div>
                        <p className="text-xs font-mono text-white leading-tight font-bold tracking-tight mt-0.5">{alert.message}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  );
}

function LoadingScreen({ isMounted }: { isMounted: boolean }) {
  return (
    <motion.div
      exit={{ opacity: 0, scale: 0.9, filter: 'blur(20px)' }}
      className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center overflow-hidden hex-bg"
    >
      {isMounted && (
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none select-none overflow-hidden text-[9px] font-mono leading-none text-primary break-all">
          {Array(5000).fill(0).map((_, i) => (i % 2 === 0 ? '1' : '0'))}
        </div>
      )}
      
      <div className="relative">
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.05, 1],
          }}
          transition={{ 
            rotate: { duration: 4, repeat: Infinity, ease: "linear" },
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }}
          className="w-48 h-48 rounded-full border-2 border-primary/20 flex items-center justify-center relative"
        >
          <div className="absolute inset-0 rounded-full border-t-4 border-primary animate-pulse" />
          <div className="absolute inset-4 rounded-full border border-primary/10 border-dashed" />
        </motion.div>
        
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-primary"
          >
            <Shield className="w-16 h-16" />
          </motion.div>
        </div>
      </div>

      <div className="mt-12 text-center space-y-4">
        <motion.h2 
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-2xl font-black italic uppercase tracking-[0.4em] text-white"
        >
          Oblivion
        </motion.h2>
        
        <div className="flex flex-col gap-1 items-center">
          <div className="w-64 h-1 bg-white/5 rounded-full overflow-hidden relative">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 2.5, ease: "circOut" }}
              className="h-full bg-primary shadow-[0_0_10px_rgba(88,166,255,0.8)]"
            />
          </div>
          <div className="flex justify-between w-64 text-[8px] font-mono text-primary/40 uppercase tracking-widest pt-1">
            <span>Auth_Sequence</span>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              COMPLETE
            </motion.span>
          </div>
        </div>

        <div className="space-y-1">
          {['INIT_KERNEL', 'SYNC_GEO_PROJECTION', 'LINK_GEMINI_REASONING'].map((text, i) => (
            <motion.div 
              key={text}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.5 + 0.5 }}
              className="text-[9px] font-mono text-primary/60 flex items-center justify-center gap-2"
            >
              <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-pulse" />
              {text}::OK
            </motion.div>
          ))}
        </div>
      </div>
      
      <div className="absolute bottom-10 left-10 text-[8px] font-mono text-white/20 uppercase tracking-[0.5em]">
        Tactical_OS_v6.4.1_PROD
      </div>
    </motion.div>
  );
}


function MetricMini({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <div className="flex flex-col items-end">
      <span className="text-[8px] text-muted-foreground uppercase font-bold tracking-[0.3em]">{label}</span>
      <span className={`text-sm font-black font-mono tracking-tighter ${color}`}>{value}</span>
    </div>
  );
}

function MetricProgress({ label, value, max = 100, color = 'var(--primary)' }: { label: string, value: number, max?: number, color?: string }) {
  return (
    <div className="space-y-1.5">
       <div className="flex justify-between text-[9px] font-mono uppercase tracking-widest opacity-70"><span>{label}</span><span>{Math.round(value)}%</span></div>
       <div className="h-1 bg-white/5 rounded-full overflow-hidden"><motion.div className="h-full" style={{ backgroundColor: color }} initial={{ width: 0 }} animate={{ width: `${(value / max) * 100}%` }} /></div>
    </div>
  );
}

const TransactionItem = memo(({ tx }: { tx: Transaction }) => {
  const getRiskColor = (level?: string) => {
    if (level === 'critical') return 'border-risk-critical bg-risk-critical/10';
    if (level === 'high') return 'border-risk-high bg-risk-high/10';
    if (level === 'medium') return 'border-risk-medium bg-risk-medium/5';
    return 'border-primary/40 bg-white/[0.02]';
  };
  return (
    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className={`p-3 border-l-2 ${getRiskColor(tx.risk_level)} flex flex-col gap-1 text-[11px] group hover:brightness-125 transition-all cursor-pointer`}>
      <div className="flex items-center justify-between"><span className="font-mono text-muted-foreground font-bold">{tx.transaction_id.slice(0, 8)}</span><span className="font-mono font-black opacity-90 text-sm">${tx.amount.toLocaleString()}</span></div>
      <div className="flex items-center justify-between opacity-60 text-[9px] uppercase truncate"><span>{tx.merchant_id}</span><span className="text-primary/70">{tx.geo_location.country}</span></div>
      {(tx.risk_level === 'high' || tx.risk_level === 'critical') && tx.explanation && (
        <div className="mt-1.5 pt-1.5 border-t border-white/5"><p className="text-[10px] font-mono text-risk-high leading-tight italic uppercase tracking-tighter">{tx.explanation}</p></div>
      )}
    </motion.div>
  );
});

TransactionItem.displayName = 'TransactionItem';

function IncidentCard({ incident }: { incident: Incident }) {
  return (
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="min-w-[180px] glass-panel p-3 border-risk-high/40 flex flex-col gap-1 bg-risk-high/[0.02]">
       <div className="flex items-center justify-between"><span className="text-[8px] font-mono text-risk-high opacity-80">{incident.id}</span></div>
       <p className="text-[11px] font-bold leading-tight uppercase truncate">{incident.type}</p>
       <p className="text-[10px] text-muted-foreground truncate italic opacity-70">{incident.summary}</p>
    </motion.div>
  );
}

function HolographicMap({ transactions, isMounted }: { transactions: Transaction[], isMounted: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pings = useRef<any[]>([]);
  const rotation = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const resize = () => { 
      canvas.width = container.clientWidth * window.devicePixelRatio; 
      canvas.height = container.clientHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);
    
    let animationId: number;
    
    const render = () => {
      const w = canvas.width / window.devicePixelRatio;
      const h = canvas.height / window.devicePixelRatio;
      const centerX = w / 2;
      const centerY = h / 2;

      // Clear with trail effect
      ctx.fillStyle = 'rgba(2, 4, 10, 0.2)';
      ctx.fillRect(0, 0, w, h);

      // 1. NESTED ORBITAL RINGS
      rotation.current += 0.002;
      [150, 250, 350, 450].forEach((radius, i) => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(88, 166, 255, ${0.05 - i * 0.01})`;
        ctx.setLineDash([5, 15]);
        ctx.stroke();
        
        // Rotating Segments
        const dir = i % 2 === 0 ? 1 : -1;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(rotation.current * (i + 1) * dir);
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 0.4);
        ctx.strokeStyle = `rgba(88, 166, 255, ${0.15 - i * 0.02})`;
        ctx.setLineDash([]);
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Sector Label
        if (i < 3) {
          ctx.fillStyle = `rgba(88, 166, 255, 0.3)`;
          ctx.font = '8px monospace';
          ctx.fillText(`SECTOR_0${i+1}_ORBITAL`, radius + 10, 0);
        }
        ctx.restore();
      });

      // 2. TACTICAL GRID
      ctx.setLineDash([]);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(88, 166, 255, 0.02)';
      ctx.beginPath();
      for (let x = 0; x <= w; x += 60) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
      for (let y = 0; y <= h; y += 60) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
      ctx.stroke();

      // 3. ENHANCED PINGS WITH COLLISION AVOIDANCE
      pings.current = pings.current.filter(p => p.life > 0);
      
      const activeLabels: { x: number, y: number, w: number, h: number }[] = [];

      pings.current.forEach((p, idx) => {
        const alpha = p.life / 100;
        const color = p.risk > 75 ? `248, 81, 73` : `88, 166, 255`;
        const pulse = Math.sin(Date.now() / 200) * 0.5 + 0.5;

        // Core
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color}, ${alpha})`;
        ctx.fill();

        // Nested Pulsing Rings
        [1.5, 2.5].forEach(scale => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, (100 - p.life) * scale, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${color}, ${alpha * (0.3 / scale)})`;
          ctx.stroke();
        });

        // Orbital Particles
        for (let i = 0; i < 3; i++) {
          const angle = (Date.now() / 500) + (i * Math.PI * 2 / 3);
          const px = p.x + Math.cos(angle) * 15;
          const py = p.y + Math.sin(angle) * 15;
          ctx.beginPath();
          ctx.arc(px, py, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${color}, ${alpha * 0.6})`;
          ctx.fill();
        }

        // --- LABEL COLLISION LOGIC ---
        let labelX = p.x + 25;
        let labelY = p.y - 15;
        const labelWidth = 80;
        const labelHeight = 25;

        // Simple repulsion from existing labels
        activeLabels.forEach(other => {
          const dx = labelX - other.x;
          const dy = labelY - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 30) {
            labelY -= 35; // Shift up if overlapping
            if (labelY < 20) labelY = p.y + 25; // Flip to bottom if hitting top edge
          }
        });
        activeLabels.push({ x: labelX, y: labelY, w: labelWidth, h: labelHeight });

        // Leader Line
        ctx.beginPath();
        ctx.moveTo(p.x + 5, p.y - 5);
        ctx.lineTo(labelX - 5, labelY + 10);
        ctx.strokeStyle = `rgba(${color}, ${alpha * 0.2})`;
        ctx.setLineDash([2, 2]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label Background Pill
        ctx.fillStyle = `rgba(2, 4, 10, ${alpha * 0.8})`;
        ctx.beginPath();
        ctx.roundRect(labelX - 5, labelY - 12, labelWidth, labelHeight, 4);
        ctx.fill();
        ctx.strokeStyle = `rgba(${color}, ${alpha * 0.3})`;
        ctx.stroke();

        // Tactical Text
        ctx.fillStyle = `rgba(${color}, ${alpha})`;
        ctx.font = 'bold 9px monospace';
        ctx.fillText(`[${p.country}] RISK_${p.risk}%`, labelX, labelY);
        ctx.font = '8px monospace';
        ctx.fillStyle = `rgba(${color}, ${alpha * 0.5})`;
        ctx.fillText(`0x${Math.floor(p.x)}::0x${Math.floor(p.y)}`, labelX, labelY + 10);

        p.life -= 1.2;
      });
      
      animationId = requestAnimationFrame(render);
    };
    render();
    return () => { cancelAnimationFrame(animationId); window.removeEventListener('resize', resize); };
  }, []);

  useEffect(() => {
    if (transactions.length === 0) return;
    const latest = transactions[0];
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width / window.devicePixelRatio;
    const h = canvas.height / window.devicePixelRatio;
    
    // Smooth coordinate mapping
    const x = (latest.geo_location.lng + 180) * (w / 360);
    const y = (90 - latest.geo_location.lat) * (h / 180);
    pings.current.push({ x, y, life: 100, risk: Math.round(latest.risk_score || 0), country: latest.geo_location.country });
  }, [transactions]);

  return (
    <div ref={containerRef} className="relative w-full h-full flex items-center justify-center overflow-hidden">
       {isMounted && (
         <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none overflow-hidden text-[7px] font-mono leading-none text-primary break-all">
            {Array(5000).fill(0).map((_, i) => (i % 2 === 0 ? '1' : '0'))}
         </div>
       )}
       <div className="absolute inset-0 bg-gradient-radial from-transparent via-black/20 to-black/60 pointer-events-none z-20" />
       <canvas ref={canvasRef} className="w-full h-full relative z-10" />
       
       {/* Holographic Scanline Overlay */}
       <div className="absolute inset-0 pointer-events-none z-30 opacity-20 cyber-grid" />
    </div>
  );
}

function AnomalyHub({ transactions }: { transactions: Transaction[] }) {
  const categories = ['retail', 'travel', 'electronics', 'crypto', 'food', 'gaming', 'luxury'];
  
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Central Core */}
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.8, 0.5]
        }}
        transition={{ duration: 2, repeat: Infinity }}
        className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center z-20 shadow-[0_0_20px_rgba(88,166,255,0.2)]"
      >
        <div className="w-5 h-5 rounded-full bg-primary/40 animate-pulse" />
      </motion.div>

      <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
        {categories.map((cat, i) => {
          const angle = (i * Math.PI * 2) / categories.length;
          const radius = i % 2 === 0 ? 38 : 30; // Increased radius for better spread
          const x1 = 50 + Math.cos(angle) * 12;
          const y1 = 50 + Math.sin(angle) * 12;
          const x2 = 50 + Math.cos(angle) * radius;
          const y2 = 50 + Math.sin(angle) * radius;

          const catTransactions = transactions.filter(t => t.category === cat);
          const avgRisk = catTransactions.reduce((acc, t) => acc + (t.risk_score || 0), 0) / (catTransactions.length || 1);
          const color = avgRisk > 60 ? '#f85149' : '#58a6ff'; 
          const opacity = 0.1 + (avgRisk / 100) * 0.4;

          return (
            <g key={cat}>
              <motion.line 
                x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`}
                stroke={color} strokeWidth="1" strokeOpacity={opacity}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
              />
              {avgRisk > 40 && (
                <motion.circle
                  initial={{ cx: `${x1}%`, cy: `${y1}%`, opacity: 0 }}
                  cx={`${x1}%`} cy={`${y1}%`} r="1.5" fill={color}
                  animate={{ 
                    cx: [`${x1}%`, `${x2}%`],
                    cy: [`${y1}%`, `${y2}%`],
                    opacity: [0, 1, 0]
                  }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                />
              )}
            </g>
          );
        })}
      </svg>

      {categories.map((cat, i) => {
        const angle = (i * Math.PI * 2) / categories.length;
        const radius = i % 2 === 0 ? 38 : 30; // Matches SVG radius
        const txs = transactions.filter(t => t.category === cat);
        const avgRisk = txs.reduce((acc, t) => acc + (t.risk_score || 0), 0) / (txs.length || 1);
        const colorClass = avgRisk > 60 ? 'bg-risk-high/40 border-risk-high shadow-[0_0_15px_rgba(248,81,73,0.3)]' : 'bg-primary/20 border-primary/40';
        
        return (
          <motion.div
            key={cat}
            style={{ 
              left: `${50 + Math.cos(angle) * radius}%`,
              top: `${50 + Math.sin(angle) * radius}%`,
              transform: 'translate(-50%, -50%)'
            }}
            className="absolute z-30 flex flex-col items-center"
          >
            <motion.div 
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
              className={`w-9 h-9 rounded-full border-2 ${colorClass} flex items-center justify-center backdrop-blur-md`}
            >
              <span className="text-[9px] font-black font-mono text-white">{Math.round(avgRisk)}</span>
            </motion.div>
            <span className="text-[8px] font-black font-mono uppercase tracking-widest text-white/60 mt-1.5 whitespace-nowrap bg-black/40 px-2 py-0.5 rounded border border-white/5">{cat}</span>
          </motion.div>
        );
      })}
    </div>
  );
}

