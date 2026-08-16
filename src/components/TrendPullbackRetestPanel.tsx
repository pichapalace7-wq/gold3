import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  Zap, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Volume2, 
  VolumeX, 
  ChevronDown, 
  ChevronUp, 
  Target, 
  ShieldCheck, 
  ArrowRight, 
  Activity, 
  BarChart3, 
  Sliders, 
  Sparkles,
  RefreshCw,
  Eye,
  Info,
  BookOpen,
  MonitorPlay,
  Compass,
  Radio,
  Dna,
  Flame,
  Gauge
} from 'lucide-react';
import { Candle } from '../types';
import { 
  analyzeTrendPullbackAndRetest, 
  TrendPullbackRetestSetup, 
  EMASet, 
  TrendPullbackState, 
  BreakoutRetestState, 
  KeySRLevel,
  IndependentStrategyState,
  getDefaultStrategyHistory
} from '../utils/trendPullbackRetestEngine';
import { TrendPullbackActiveMonitor } from './TrendPullbackActiveMonitor';
import { TrendPullbackTradeLogs } from './TrendPullbackTradeLogs';
import { TrendPullbackIntelligenceView } from './TrendPullbackIntelligenceView';
import { FinalDecisionCard } from './FinalDecisionCard';

interface TrendPullbackRetestPanelProps {
  candles: Candle[];
  lastTickPrice: number;
  bid: number;
  ask: number;
  currentMarket: 'gold' | 'vol' | 'jump';
  selectedSymbol: string;
  symbolDisplayName: string;
  onAlertTriggered?: (type: string, message: string) => void;
}

export function TrendPullbackRetestPanel({
  candles,
  lastTickPrice,
  bid,
  ask,
  currentMarket,
  selectedSymbol,
  symbolDisplayName,
  onAlertTriggered
}: TrendPullbackRetestPanelProps) {
  // Strategy Display Tab: RADAR | INTELLIGENCE | MONITOR | LOGS
  const [activeTab, setActiveTab] = useState<'RADAR' | 'INTELLIGENCE' | 'MONITOR' | 'LOGS'>('RADAR');
  const [activeStrategyMode, setActiveStrategyMode] = useState<'AUTO' | 'PULLBACK' | 'RETEST'>('AUTO');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  
  // Independent Strategy Active Position & Trade Log States
  const [activeIndependentTrade, setActiveIndependentTrade] = useState<IndependentStrategyState | null>(() => {
    const saved = localStorage.getItem(`indep_trade_${selectedSymbol}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [strategyHistory, setStrategyHistory] = useState<IndependentStrategyState[]>(() => {
    const saved = localStorage.getItem(`indep_history_${selectedSymbol}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        // fallback
      }
    }
    return getDefaultStrategyHistory(symbolDisplayName || 'XAU/USD', lastTickPrice || 2350);
  });

  const spread = Math.max(0.01, Number(Math.abs(ask - bid).toFixed(currentMarket === 'gold' ? 2 : 2)));

  // Run the dedicated technical & price action calculation engine
  const analysis = useMemo(() => {
    return analyzeTrendPullbackAndRetest(candles, lastTickPrice, spread, symbolDisplayName);
  }, [candles, lastTickPrice, spread, symbolDisplayName]);

  const { emas, trendPullback, breakoutRetest, keyLevels, activeSetup } = analysis;

  // Persist state
  useEffect(() => {
    if (activeIndependentTrade) {
      localStorage.setItem(`indep_trade_${selectedSymbol}`, JSON.stringify(activeIndependentTrade));
    } else {
      localStorage.removeItem(`indep_trade_${selectedSymbol}`);
    }
  }, [activeIndependentTrade, selectedSymbol]);

  useEffect(() => {
    localStorage.setItem(`indep_history_${selectedSymbol}`, JSON.stringify(strategyHistory));
  }, [strategyHistory, selectedSymbol]);

  // Stable callback ref to avoid re-triggering effects
  const onAlertTriggeredRef = useRef(onAlertTriggered);
  useEffect(() => {
    onAlertTriggeredRef.current = onAlertTriggered;
  });

  // Audio tone generator for this independent panel
  const playPanelAlert = (type: 'READY' | 'TRIGGER' | 'WIN' | 'LOSS') => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'READY' || type === 'WIN') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(784, ctx.currentTime); // G5
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      }
    } catch (e) {
      // Audio context restricted or unavailable
    }
  };

  // Live Position Tracker Loop
  useEffect(() => {
    if (!activeIndependentTrade || !lastTickPrice) return;

    const trade = { ...activeIndependentTrade };
    const isBull = trade.direction === 'BULLISH';

    // Track excursion metrics
    const currentGain = isBull ? lastTickPrice - trade.entryPrice : trade.entryPrice - lastTickPrice;
    const currentDrawdown = isBull ? trade.entryPrice - lastTickPrice : lastTickPrice - trade.entryPrice;

    if (currentGain > (trade.maxFavorableExcursion || 0)) {
      trade.maxFavorableExcursion = Number(currentGain.toFixed(2));
    }
    if (currentDrawdown > (trade.maxAdverseExcursion || 0)) {
      trade.maxAdverseExcursion = Number(currentDrawdown.toFixed(2));
    }

    if (trade.status === 'WAITING') {
      const triggerCondition = isBull 
        ? lastTickPrice <= trade.entryPrice 
        : lastTickPrice >= trade.entryPrice;

      if (triggerCondition) {
        trade.status = 'TRIGGERED';
        trade.executionState = 'TRADE_ACTIVE';
        trade.entryTime = Date.now();
        trade.actualEntryPrice = lastTickPrice;
        setActiveIndependentTrade(trade);
        playPanelAlert('TRIGGER');
        onAlertTriggeredRef.current?.('PULLBACK_RETEST', `🎯 [Independent Strategy] ${trade.strategy.replace('_', ' ')} ${trade.direction} Entry Triggered at ${lastTickPrice.toFixed(2)}`);
      }
    } else if (trade.status === 'TRIGGERED' || trade.status === 'TP1_HIT' || trade.status === 'TP2_HIT') {
      const slHit = isBull ? lastTickPrice <= trade.stopLoss : lastTickPrice >= trade.stopLoss;
      const tp1Passed = isBull ? lastTickPrice >= trade.tp1 : lastTickPrice <= trade.tp1;
      const tp2Passed = isBull ? lastTickPrice >= trade.tp2 : lastTickPrice <= trade.tp2;
      const tp3Passed = isBull ? lastTickPrice >= trade.tp3 : lastTickPrice <= trade.tp3;

      if (slHit) {
        trade.status = 'SL_HIT';
        trade.executionState = 'INVALIDATED';
        trade.resolvedTime = Date.now();
        trade.profitPoints = -Math.abs(trade.entryPrice - trade.stopLoss);
        trade.profitPercent = -1.0;
        trade.exitPrice = trade.stopLoss;
        trade.exitReason = 'Stop loss boundary triggered during adverse price swing';
        trade.postMortemSummary = 'Adverse momentum breach. Hard risk containment prevented further drawdown.';
        setStrategyHistory(prev => [trade, ...prev]);
        setActiveIndependentTrade(null);
        playPanelAlert('LOSS');
        onAlertTriggeredRef.current?.('PULLBACK_RETEST', `🚨 [Independent Strategy] Stop Loss Hit at ${trade.stopLoss.toFixed(2)} (${trade.profitPoints.toFixed(2)} pts)`);
      } else if (tp3Passed) {
        trade.status = 'TP3_HIT';
        trade.executionState = 'TARGET_COMPLETE';
        trade.resolvedTime = Date.now();
        trade.profitPoints = Math.abs(trade.tp3 - trade.entryPrice);
        const risk = Math.abs(trade.entryPrice - trade.stopLoss);
        trade.profitPercent = risk > 0 ? (trade.profitPoints / risk) : 4.5;
        trade.exitPrice = trade.tp3;
        trade.exitReason = 'Full 100% Target 3 expansion reached';
        trade.postMortemSummary = 'Flawless impulse follow-through. All liquidity targets filled consecutively.';
        setStrategyHistory(prev => [trade, ...prev]);
        setActiveIndependentTrade(null);
        playPanelAlert('WIN');
        onAlertTriggeredRef.current?.('PULLBACK_RETEST', `🏆 [Independent Strategy] Full TP3 Hit at ${trade.tp3.toFixed(2)} (+${trade.profitPoints.toFixed(2)} pts)`);
      } else if (tp2Passed && (trade.status === 'TRIGGERED' || trade.status === 'TP1_HIT')) {
        // Sequential progression: only advance forward to TP2_HIT
        trade.status = 'TP2_HIT';
        trade.executionState = 'TP2_HIT';
        trade.partialTaken = true;
        setActiveIndependentTrade(trade);
        playPanelAlert('WIN');
        onAlertTriggeredRef.current?.('PULLBACK_RETEST', `🎯 [AUTO SECURED] TP2 reached at ${trade.tp2.toFixed(2)}.`);
      } else if (tp1Passed && trade.status === 'TRIGGERED') {
        // Sequential progression: only advance forward to TP1_HIT
        trade.status = 'TP1_HIT';
        trade.executionState = 'TP1_HIT';
        // AUTOMATIC 50% PROFIT SECURE
        const gain = isBull ? lastTickPrice - trade.entryPrice : trade.entryPrice - lastTickPrice;
        trade.partialTaken = true;
        trade.profitPoints = Number((gain * 0.5).toFixed(2));
        // AUTOMATIC STOP LOSS TO BREAKEVEN + BUFFER
        const beBuffer = isBull ? 0.20 : -0.20;
        trade.stopLoss = Number((trade.entryPrice + beBuffer).toFixed(2));
        trade.breakevenMoved = true;
        setActiveIndependentTrade(trade);
        playPanelAlert('WIN');
        onAlertTriggeredRef.current?.('PULLBACK_RETEST', `🎯 [AUTO 50% SECURED] TP1 reached at ${trade.tp1.toFixed(2)} (+${gain.toFixed(2)} pts). 50% profit secured automatically & Stop Loss moved to Break-Even.`);
      }
    }
  }, [lastTickPrice, activeIndependentTrade]);

  // Automated Trade Execution Engine: Executes automatically once conditions are met
  const lastAutoExecTimeRef = useRef<number>(0);
  const lastExecutedDnaRef = useRef<string>('');

  useEffect(() => {
    if (activeIndependentTrade || !lastTickPrice || activeSetup.direction === 'NEUTRAL') return;
    
    const now = Date.now();
    const currentDna = activeSetup.setupDNA?.dnaString || `${activeSetup.direction}-${activeSetup.entryPrice}`;
    
    // Cooldown of 8 seconds minimum between auto-executions, or 30s for the exact same setup
    if (now - lastAutoExecTimeRef.current < 8000) return;
    if (lastExecutedDnaRef.current === currentDna && (now - lastAutoExecTimeRef.current < 30000)) return;

    // Verify entry conditions
    const isTriggered = activeSetup.executionState === 'ENTRY_TRIGGERED';
    const isArmedInZone = activeSetup.executionState === 'ENTRY_ARMED' && !activeSetup.entryBlockers?.hasBlockers && (activeSetup.proximity?.classification === 'INSIDE_ZONE' || activeSetup.proximity?.classification === 'OPTIMAL' || (activeSetup.proximity?.distanceToZone ?? 1) <= 0.05);
    const isValidatedClose = activeSetup.executionState === 'SETUP_VALIDATED' && !activeSetup.entryBlockers?.hasBlockers && (activeSetup.proximity?.classification === 'INSIDE_ZONE' || activeSetup.proximity?.classification === 'OPTIMAL') && activeSetup.qualityScore >= 65;

    if (isTriggered || isArmedInZone || isValidatedClose) {
      const isBull = activeSetup.direction === 'BULLISH';
      
      // Sanity check: Ensure current price has not already surpassed TP2 or SL
      const alreadyBlown = isBull 
        ? (lastTickPrice >= activeSetup.tp2 || lastTickPrice <= activeSetup.stopLoss)
        : (lastTickPrice <= activeSetup.tp2 || lastTickPrice >= activeSetup.stopLoss);

      if (alreadyBlown) return;

      lastAutoExecTimeRef.current = now;
      lastExecutedDnaRef.current = currentDna;

      const newTrade: IndependentStrategyState = {
        id: `tpr-${now.toString().slice(-4)}`,
        assetSymbol: symbolDisplayName,
        strategy: activeSetup.strategyType === 'BREAKOUT_RETEST' ? 'BREAKOUT_RETEST' : 'TREND_PULLBACK',
        direction: isBull ? 'BULLISH' : 'BEARISH',
        status: 'TRIGGERED',
        executionState: 'TRADE_ACTIVE',
        entryPrice: activeSetup.entryPrice,
        actualEntryPrice: lastTickPrice,
        stopLoss: activeSetup.stopLoss,
        tp1: activeSetup.tp1,
        tp2: activeSetup.tp2,
        tp3: activeSetup.tp3,
        entryTime: now,
        profitPoints: 0,
        profitPercent: 0,
        riskReward: activeSetup.riskRewardRatio,
        qualityScore: activeSetup.qualityScore,
        winProbability: activeSetup.winProbability,
        triggerType: activeSetup.actualTriggerType || activeSetup.expectedTriggerPattern || 'AUTO_CONFLUENCE_TRIGGER',
        triggerPattern: activeSetup.expectedTriggerPattern,
        fibLevelTriggered: activeSetup.fibLevelTriggered,
        brokenKeyLevel: activeSetup.keyLevelTriggered,
        testedEMALevel: activeSetup.testedEMALevel,
        confirmations: activeSetup.confirmations,
        dnaString: activeSetup.setupDNA?.dnaString,
        regimeLabel: activeSetup.regime?.label,
        qualityGrade: activeSetup.qualityBreakdown?.grade,
        timeline: activeSetup.timeline,
        maxFavorableExcursion: 0,
        maxAdverseExcursion: 0
      };
      setActiveIndependentTrade(newTrade);
      setActiveTab('MONITOR');
      playPanelAlert('TRIGGER');
      onAlertTriggeredRef.current?.('PULLBACK_RETEST', `⚡ [AUTO-EXECUTION] ${newTrade.strategy.replace(/_/g, ' ')} ${newTrade.direction} Trade Automatically Placed at ${lastTickPrice.toFixed(2)} | SL: ${newTrade.stopLoss.toFixed(2)} | TP1: ${newTrade.tp1.toFixed(2)}`);
    }
  }, [activeIndependentTrade, lastTickPrice, activeSetup, symbolDisplayName]);

  // Handle manual / one-click activation of setup
  const activateStrategySetup = () => {
    const newTrade: IndependentStrategyState = {
      id: `tpr-${Date.now().toString().slice(-4)}`,
      assetSymbol: symbolDisplayName,
      strategy: activeSetup.strategyType === 'BREAKOUT_RETEST' ? 'BREAKOUT_RETEST' : 'TREND_PULLBACK',
      direction: activeSetup.direction === 'BEARISH' ? 'BEARISH' : 'BULLISH',
      status: activeSetup.executionState === 'ENTRY_TRIGGERED' ? 'TRIGGERED' : 'WAITING',
      executionState: activeSetup.executionState === 'ENTRY_TRIGGERED' ? 'TRADE_ACTIVE' : activeSetup.executionState,
      entryPrice: activeSetup.entryPrice,
      actualEntryPrice: activeSetup.executionState === 'ENTRY_TRIGGERED' ? lastTickPrice : undefined,
      stopLoss: activeSetup.stopLoss,
      tp1: activeSetup.tp1,
      tp2: activeSetup.tp2,
      tp3: activeSetup.tp3,
      entryTime: Date.now(),
      profitPoints: 0,
      profitPercent: 0,
      riskReward: activeSetup.riskRewardRatio,
      qualityScore: activeSetup.qualityScore,
      winProbability: activeSetup.winProbability,
      triggerType: activeSetup.actualTriggerType || activeSetup.expectedTriggerPattern,
      triggerPattern: activeSetup.expectedTriggerPattern,
      fibLevelTriggered: activeSetup.fibLevelTriggered,
      brokenKeyLevel: activeSetup.keyLevelTriggered,
      testedEMALevel: activeSetup.testedEMALevel,
      confirmations: activeSetup.confirmations,
      dnaString: activeSetup.setupDNA?.dnaString,
      regimeLabel: activeSetup.regime?.label,
      qualityGrade: activeSetup.qualityBreakdown?.grade,
      timeline: activeSetup.timeline,
      maxFavorableExcursion: 0,
      maxAdverseExcursion: 0
    };
    setActiveIndependentTrade(newTrade);
    setActiveTab('MONITOR'); // switch directly to monitor
    playPanelAlert('TRIGGER');
  };

  const cancelActiveTrade = () => {
    if (activeIndependentTrade) {
      const cancelled: IndependentStrategyState = {
        ...activeIndependentTrade,
        status: 'CANCELLED',
        resolvedTime: Date.now(),
        exitReason: 'Order cancelled manually by trader before fill'
      };
      setStrategyHistory(prev => [cancelled, ...prev]);
      setActiveIndependentTrade(null);
    }
  };

  const handleMoveToBreakeven = () => {
    if (!activeIndependentTrade) return;
    const isBull = activeIndependentTrade.direction === 'BULLISH';
    const beBuffer = isBull ? 0.20 : -0.20;
    const updated: IndependentStrategyState = {
      ...activeIndependentTrade,
      stopLoss: Number((activeIndependentTrade.entryPrice + beBuffer).toFixed(2)),
      breakevenMoved: true
    };
    setActiveIndependentTrade(updated);
    playPanelAlert('WIN');
  };

  const handleTakePartial = () => {
    if (!activeIndependentTrade) return;
    const isBull = activeIndependentTrade.direction === 'BULLISH';
    const gain = isBull ? lastTickPrice - activeIndependentTrade.entryPrice : activeIndependentTrade.entryPrice - lastTickPrice;
    const updated: IndependentStrategyState = {
      ...activeIndependentTrade,
      partialTaken: true,
      profitPoints: Number((gain * 0.5).toFixed(2))
    };
    setActiveIndependentTrade(updated);
    playPanelAlert('WIN');
  };

  const handleMarketClose = () => {
    if (!activeIndependentTrade) return;
    const isBull = activeIndependentTrade.direction === 'BULLISH';
    const finalPoints = isBull ? lastTickPrice - activeIndependentTrade.entryPrice : activeIndependentTrade.entryPrice - lastTickPrice;
    const risk = Math.abs(activeIndependentTrade.entryPrice - activeIndependentTrade.stopLoss);
    const resolved: IndependentStrategyState = {
      ...activeIndependentTrade,
      status: finalPoints >= 0 ? 'TP1_HIT' : 'SL_HIT',
      resolvedTime: Date.now(),
      exitPrice: lastTickPrice,
      profitPoints: Number(finalPoints.toFixed(2)),
      profitPercent: risk > 0 ? Number((finalPoints / risk).toFixed(2)) : 1.0,
      exitReason: `Manual market close at spot price ${lastTickPrice.toFixed(2)}`,
      postMortemSummary: 'Trader performed proactive discretionary market liquidation.'
    };
    setStrategyHistory(prev => [resolved, ...prev]);
    setActiveIndependentTrade(null);
    playPanelAlert(finalPoints >= 0 ? 'WIN' : 'LOSS');
  };

  const handleClearHistory = () => {
    setStrategyHistory([]);
    localStorage.removeItem(`indep_history_${selectedSymbol}`);
  };

  // Status color helpers
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'READY TO EXECUTE':
      case 'RETEST CONFIRMED':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse';
      case 'PULLBACK IN ZONE':
      case 'IN_RETEST_ZONE':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'BREAKOUT PENDING RETEST':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'WAITING FOR PULLBACK':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <section 
      id="panel-trend-pullback-retest-top" 
      className="w-full bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b-2 border-amber-500/40 shadow-2xl relative z-40 transition-all duration-300"
    >
      {/* Top Main Bar: Strategy Engine Identity, Primary View Navigation & Controls */}
      <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80">
        
        {/* Left Side: Brand & Strategy Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 via-cyan-500/10 to-transparent border border-amber-500/30">
            <Zap className="h-5 w-5 text-amber-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black tracking-tight text-white uppercase flex items-center gap-2">
                TREND PULLBACK <span className="text-cyan-400">&</span> BREAKOUT-RETEST <span className="text-amber-400">ENGINE</span>
              </h2>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[9px] font-bold font-mono uppercase bg-cyan-950/60 text-cyan-300 border border-cyan-800/50">
                INDEPENDENT MODULE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
              <span>Dynamic Fib Golden Pocket • 20/50/200 EMA Ribbon • Polarity Flip Verification</span>
              <span className="text-amber-500 font-bold">• {symbolDisplayName}</span>
            </p>
          </div>
        </div>

        {/* Center: Top View Tabs (RADAR | INTELLIGENCE | ACTIVE MONITOR | TRADE LOGS) */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex gap-1 text-[11px] font-bold uppercase tracking-wider font-mono shadow-inner">
            <button
              id="btn-tpr-tab-radar"
              onClick={() => setActiveTab('RADAR')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'RADAR'
                  ? 'bg-amber-500 text-slate-950 font-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Target className="h-3.5 w-3.5" />
              Strategy Radar
            </button>

            <button
              id="btn-tpr-tab-intelligence"
              onClick={() => setActiveTab('INTELLIGENCE')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'INTELLIGENCE'
                  ? 'bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 font-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="h-3.5 w-3.5" />
              Market Intelligence
              <span className="px-1.5 py-0.2 bg-cyan-950/80 rounded text-[9px] text-cyan-300 font-mono border border-cyan-800/60">
                {activeSetup.regime?.label.slice(0, 8)}
              </span>
            </button>

            <button
              id="btn-tpr-tab-monitor"
              onClick={() => setActiveTab('MONITOR')}
              className={`px-3 py-1.5 rounded-lg transition-all relative flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'MONITOR'
                  ? 'bg-cyan-500 text-slate-950 font-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MonitorPlay className="h-3.5 w-3.5" />
              Active Monitor
              {activeIndependentTrade && (
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
              )}
            </button>

            <button
              id="btn-tpr-tab-logs"
              onClick={() => setActiveTab('LOGS')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'LOGS'
                  ? 'bg-purple-500 text-slate-950 font-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              Trade Logs
              <span className="px-1.5 py-0.2 bg-slate-900/80 rounded text-[9px] text-slate-300 font-mono">
                {strategyHistory.length}
              </span>
            </button>
          </div>
        </div>

        {/* Right Side: Sound & Collapse */}
        <div className="flex items-center gap-2">
          <button
            id="btn-panel-sound"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={soundEnabled ? "Mute Strategy Audio" : "Unmute Strategy Audio"}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4 text-emerald-400" /> : <VolumeX className="h-4 w-4 text-rose-400" />}
          </button>

          <button
            id="btn-panel-collapse"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={isExpanded ? "Collapse Panel" : "Expand Strategy Panel"}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Body */}
      {isExpanded && (
        <div className="p-4">
          
          {/* TAB 1: STRATEGY RADAR VIEW */}
          {activeTab === 'RADAR' && (
            <div className="space-y-3">
              {/* Quick Intelligence Summary Bar */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-bold text-[10px] uppercase flex items-center gap-1">
                    <Compass className="h-3 w-3 text-cyan-400" />
                    Regime: {activeSetup.regime?.label || 'TREND'} ({activeSetup.regime?.confidence || 75}%)
                  </span>

                  <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60 font-bold text-[10px] uppercase flex items-center gap-1">
                    <Clock className="h-3 w-3 text-amber-400" />
                    {(activeSetup.sessionIntelligence?.currentSession || 'ASIAN').replace(/_/g, ' ')}
                    {activeSetup.sessionIntelligence?.isKillzone && ' (KILLZONE)'}
                  </span>

                  <span className="px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/60 font-bold text-[10px] uppercase flex items-center gap-1">
                    <Dna className="h-3 w-3 text-purple-400" />
                    DNA: {(activeSetup.setupDNA?.archetype || activeSetup.strategyType || 'TREND_PULLBACK').replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">
                    MTF Alignment: <strong className="text-emerald-400">{activeSetup.multiTimeframe?.alignmentScore}%</strong>
                  </span>
                  <button
                    onClick={() => setActiveTab('INTELLIGENCE')}
                    className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 underline flex items-center gap-0.5 cursor-pointer"
                  >
                    Deep 26-Pt Analysis <ArrowRight className="h-2.5 w-2.5" />
                  </button>
                </div>
              </div>

              {/* SECTION 25: PROMINENT FINAL DECISION CARD */}
              <FinalDecisionCard
                activeSetup={activeSetup}
                currentPrice={lastTickPrice}
              />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                
                {/* COLUMN 1: Numerical Setup & Execution Terminal (4 Cols) */}
                <div className="lg:col-span-4 flex flex-col gap-3">
                
                {/* Setup Header Card */}
                <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400">
                          {activeSetup.strategyType === 'BREAKOUT_RETEST' 
                            ? '⚡ BREAKOUT & RETEST' 
                            : activeSetup.strategyType === 'TREND_PULLBACK'
                            ? '📈 TREND PULLBACK'
                            : '🎯 HYBRID STRATEGY'}
                        </span>
                        {/* Dynamic Execution State Badge */}
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase font-mono tracking-wider border ${
                          activeSetup.executionState === 'ENTRY_TRIGGERED'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 animate-pulse'
                            : activeSetup.executionState === 'ENTRY_ARMED'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/60 animate-pulse'
                            : activeSetup.executionState === 'SETUP_VALIDATED'
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                            : activeSetup.executionState === 'SETUP_FORMING'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        }`}>
                          {(activeSetup.executionState || 'SETUP_FORMING').replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded text-xs font-black uppercase tracking-wider flex items-center gap-1 ${
                          activeSetup.direction === 'BULLISH'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : activeSetup.direction === 'BEARISH'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {activeSetup.direction === 'BULLISH' ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                          {activeSetup.direction} ({activeSetup.direction === 'BULLISH' ? 'BUY' : 'SELL'})
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Dist: <strong className="text-amber-400">{activeSetup.distanceToEntry.toFixed(2)} pts</strong>
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Current Price</span>
                      <span className="text-lg font-mono font-bold text-white">{lastTickPrice.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Confidence Score Bar */}
                  <div className="my-1.5 p-2 rounded bg-slate-900/80 border border-slate-800">
                    <div className="flex justify-between items-center text-[10px] font-mono mb-1">
                      <span className="text-slate-400 uppercase font-bold flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-amber-400" />
                        Confidence Score
                      </span>
                      <span className="font-bold text-amber-300">
                        {activeSetup.confidence}% • {(activeSetup.executionState || 'SETUP_FORMING').replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden flex">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          activeSetup.confidence >= 80 
                            ? 'bg-gradient-to-r from-cyan-400 to-emerald-400' 
                            : activeSetup.confidence >= 60
                            ? 'bg-gradient-to-r from-amber-500 to-cyan-400'
                            : 'bg-gradient-to-r from-rose-500 to-amber-500'
                        }`}
                        style={{ width: `${Math.max(5, Math.min(100, activeSetup.confidence))}%` }}
                      ></div>
                    </div>
                    <p className="text-[9px] text-slate-400 mt-1 font-mono italic">
                      {activeSetup.confidenceScoreFormatted}
                    </p>
                  </div>

                  {/* Price Target Matrix */}
                  <div className="grid grid-cols-2 gap-2 my-2 text-xs font-mono">
                    <div className="bg-slate-900/90 p-2.5 rounded border border-emerald-900/30">
                      <span className="text-[9px] text-emerald-500 font-bold block uppercase">Optimal Entry Zone</span>
                      <span className="text-sm font-bold text-emerald-400">{activeSetup.entryPrice.toFixed(2)}</span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">({activeSetup.entryZoneMin.toFixed(2)} - {activeSetup.entryZoneMax.toFixed(2)})</span>
                    </div>

                    <div className="bg-slate-900/90 p-2.5 rounded border border-rose-900/30">
                      <span className="text-[9px] text-rose-500 font-bold block uppercase">Stop Loss (Risk)</span>
                      <span className="text-sm font-bold text-rose-400">{activeSetup.stopLoss.toFixed(2)}</span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">Risk: {Math.abs(activeSetup.entryPrice - activeSetup.stopLoss).toFixed(2)} pts</span>
                    </div>
                  </div>

                  <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800/80 space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> TP1 (Swing Retest):
                      </span>
                      <span className="font-bold text-emerald-400">{activeSetup.tp1.toFixed(2)} (+{Math.abs(activeSetup.tp1 - activeSetup.entryPrice).toFixed(2)} pts)</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] border-t border-slate-800/60 pt-1">
                      <span className="text-slate-400 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span> TP2 (Fib Extension 1.272):
                      </span>
                      <span className="font-bold text-emerald-400">{activeSetup.tp2.toFixed(2)} (+{Math.abs(activeSetup.tp2 - activeSetup.entryPrice).toFixed(2)} pts)</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] border-t border-slate-800/60 pt-1">
                      <span className="text-slate-400 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-300"></span> TP3 (Major Trend Expansion):
                      </span>
                      <span className="font-bold text-emerald-300">{activeSetup.tp3.toFixed(2)} (+{Math.abs(activeSetup.tp3 - activeSetup.entryPrice).toFixed(2)} pts)</span>
                    </div>
                  </div>

                  {/* Auto-Execution Active Status Bar */}
                  <div className="mt-3">
                    {!activeIndependentTrade ? (
                      <div className="w-full p-2.5 rounded-lg bg-gradient-to-r from-emerald-950/80 via-slate-900 to-cyan-950/80 border border-emerald-500/40 flex items-center justify-between text-xs font-mono shadow">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                          <span className="font-bold text-emerald-300">
                            AUTO-EXECUTION ACTIVE
                          </span>
                        </div>
                        <span className="text-[10px] text-cyan-300 font-bold">
                          {activeSetup.executionState === 'ENTRY_TRIGGERED' 
                            ? 'Placing Trade...' 
                            : 'Scanning Trigger'}
                        </span>
                      </div>
                    ) : (
                      <div className="w-full flex items-center justify-between gap-2 bg-emerald-950/60 border border-emerald-500/60 p-2.5 rounded-lg text-[11px] shadow">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                          <span className="font-bold text-emerald-300 font-mono">
                            Live Trade: {activeIndependentTrade.direction} ({activeIndependentTrade.status})
                          </span>
                        </div>
                        <button
                          id="btn-switch-to-monitor"
                          onClick={() => setActiveTab('MONITOR')}
                          className="px-2.5 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[10px] font-black uppercase transition-colors cursor-pointer shadow"
                        >
                          View Active Monitor
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Invalidation & Execution Plan Note */}
                <div className="bg-slate-950/60 border border-slate-800/80 p-2.5 rounded-lg text-[10px] text-slate-400 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-rose-400 uppercase font-bold">Hard Invalidation:</span>
                    <span className="font-mono text-rose-300 font-bold">Close beyond {activeSetup.invalidationLevel.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Hold Time Horizon:</span>
                    <span className="font-mono text-slate-300">{activeSetup.estimatedHoldTime}</span>
                  </div>
                </div>

              </div>

              {/* COLUMN 2: Deep Technical Visualizer (EMA Ribbons, Fib Ladder, S/R Levels) (5 Cols) */}
              <div className="lg:col-span-5 flex flex-col gap-3">
                
                {/* Mode Selector for visualizer */}
                <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-[10px] font-mono font-bold uppercase gap-1">
                  <button
                    onClick={() => setActiveStrategyMode('AUTO')}
                    className={`flex-1 py-1 rounded transition-all ${
                      activeStrategyMode === 'AUTO' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    Dual Ladder
                  </button>
                  <button
                    onClick={() => setActiveStrategyMode('PULLBACK')}
                    className={`flex-1 py-1 rounded transition-all ${
                      activeStrategyMode === 'PULLBACK' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    Fib Golden Pocket
                  </button>
                  <button
                    onClick={() => setActiveStrategyMode('RETEST')}
                    className={`flex-1 py-1 rounded transition-all ${
                      activeStrategyMode === 'RETEST' ? 'bg-purple-500 text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    S/R Polarity Flip
                  </button>
                </div>

                {/* Pullback & Fib Ladder */}
                {(activeStrategyMode === 'AUTO' || activeStrategyMode === 'PULLBACK') && (
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Sliders className="h-3.5 w-3.5 text-cyan-400" /> Fibonacci Golden Pocket Matrix
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
                        Zone: <strong className="text-cyan-300">{trendPullback.fibDetails?.pullbackZone || 'SCANNING'}</strong>
                      </span>
                    </div>

                    {trendPullback.fibDetails ? (
                      <div className="space-y-1.5 text-[11px] font-mono">
                        <div className="flex justify-between items-center bg-slate-900/40 px-2 py-1 rounded">
                          <span className="text-slate-400">0.00% (Impulse Origin):</span>
                          <span className="text-slate-300">{trendPullback.fibDetails.swingHigh.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-900/40 px-2 py-1 rounded">
                          <span className="text-slate-400">38.20% (Shallow Retracement):</span>
                          <span className="text-slate-300">{trendPullback.fibDetails.fib382.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center bg-cyan-950/40 border border-cyan-800/40 px-2 py-1 rounded">
                          <span className="text-cyan-400 font-bold">50.00% Equilibrium:</span>
                          <span className="text-cyan-300 font-bold">{trendPullback.fibDetails.fib500.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center bg-amber-950/50 border border-amber-500/50 px-2 py-1.5 rounded shadow">
                          <span className="text-amber-400 font-black flex items-center gap-1">
                            <Sparkles className="h-3 w-3" /> 61.80% Golden Pocket:
                          </span>
                          <span className="text-amber-300 font-bold text-xs">{trendPullback.fibDetails.fib618.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center bg-rose-950/20 px-2 py-1 rounded">
                          <span className="text-rose-400">78.60% Deep Retracement (SL Anchor):</span>
                          <span className="text-rose-300">{trendPullback.fibDetails.fib786.toFixed(2)}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic py-2">Analyzing high-frequency price swings for Fibonacci ladder...</p>
                    )}

                    {trendPullback.fibDetails && (
                      <div>
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                          <span>Current Retracement Depth</span>
                          <span className="text-cyan-300 font-bold">{trendPullback.fibDetails.currentDepthPercent}%</span>
                        </div>
                        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden flex">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              trendPullback.fibDetails.currentDepthPercent >= 38.2 && trendPullback.fibDetails.currentDepthPercent <= 68
                                ? 'bg-gradient-to-r from-cyan-500 to-amber-500'
                                : 'bg-slate-600'
                            }`} 
                            style={{ width: `${Math.min(100, Math.max(5, trendPullback.fibDetails.currentDepthPercent))}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Breakout & Retest Levels */}
                {(activeStrategyMode === 'AUTO' || activeStrategyMode === 'RETEST') && (
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-purple-400" /> Key S/R Polarity Flip Radar
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-slate-900 px-2 py-0.5 rounded">
                        Status: <strong>{breakoutRetest.retestStatus.replace('_', ' ')}</strong>
                      </span>
                    </div>

                    <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800/80 text-[11px] font-mono space-y-1">
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-500 uppercase">Polarity Transition:</span>
                        <span className="text-amber-400 font-bold">{breakoutRetest.polarityFlip}</span>
                      </div>
                      <div className="flex justify-between text-slate-300 border-t border-slate-800/60 pt-1">
                        <span className="text-slate-500 uppercase">Retest Target Zone:</span>
                        <span className="text-cyan-300 font-bold">{breakoutRetest.retestZone.min.toFixed(2)} — {breakoutRetest.retestZone.max.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-300 border-t border-slate-800/60 pt-1">
                        <span className="text-slate-500 uppercase">Rejection Wick:</span>
                        <span className={breakoutRetest.rejectionWickDetected ? "text-emerald-400 font-bold" : "text-slate-500"}>
                          {breakoutRetest.rejectionWickDetected ? "✅ Confirmed Rejection Wick" : "⏳ Awaiting Rejection Touch"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* EMA Ribbon Matrix */}
                <div className="bg-slate-950/60 border border-slate-800/80 p-2.5 rounded-lg flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Dynamic EMAs:</span>
                  <span className="text-cyan-400 font-bold">9: {emas.ema9.toFixed(2)}</span>
                  <span className="text-amber-400 font-bold">21: {emas.ema21.toFixed(2)}</span>
                  <span className="text-emerald-400 font-bold">50: {emas.ema50.toFixed(2)}</span>
                  <span className="text-purple-400 font-bold">200: {emas.ema200.toFixed(2)}</span>
                </div>

              </div>

              {/* COLUMN 3: Accuracy Checklist & Live Confluence Engine (3 Cols) */}
              <div className="lg:col-span-3 flex flex-col gap-3">
                
                <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-2.5">
                      <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-amber-400" /> Strategy Confluences
                      </h3>
                      <span className="text-[10px] font-mono font-bold text-emerald-400 bg-slate-900 px-2 py-0.5 rounded">
                        Score: {activeSetup.qualityScore}%
                      </span>
                    </div>

                    {/* Categorized 3-State Confluence Checklist */}
                    <div className="space-y-1.5 text-[11px] max-h-[340px] overflow-y-auto pr-0.5">
                      {(activeSetup.detailedConfluences || []).map((item) => (
                        <div 
                          key={item.id} 
                          className={`flex items-center justify-between p-1.5 rounded border transition-colors ${
                            item.status === 'CONFIRMED'
                              ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300'
                              : item.status === 'WAITING'
                              ? 'bg-amber-950/20 border-amber-900/40 text-amber-300'
                              : 'bg-slate-900/30 border-slate-800/40 text-slate-500'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0 pr-1">
                            <span className="text-[8px] font-bold font-mono uppercase px-1 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800 shrink-0">
                              {item.category.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] font-medium truncate">{item.label}</span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {item.status === 'CONFIRMED' ? (
                              <span className="flex items-center gap-0.5 text-emerald-400 font-bold text-[10px]" title={item.detail}>
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              </span>
                            ) : item.status === 'WAITING' ? (
                              <span className="flex items-center gap-0.5 text-amber-400 font-bold text-[10px]" title={item.detail}>
                                <Clock className="h-3.5 w-3.5" />
                              </span>
                            ) : (
                              <span className="flex items-center gap-0.5 text-slate-500 font-bold text-[10px]" title={item.detail}>
                                <XCircle className="h-3.5 w-3.5" />
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Strategy Execution Rule Verdict */}
                  <div className="mt-3 bg-slate-900/80 p-2.5 rounded border border-slate-800 text-[10px] leading-relaxed">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-amber-400 font-bold uppercase text-[9px]">Execution Rule:</span>
                      <span className="text-[9px] font-mono text-cyan-400">{activeSetup.executionState}</span>
                    </div>
                    <p className="text-slate-300 italic font-mono text-[10px]">
                      {activeSetup.executionRuleText || (
                        trendPullback.reversalCandlePattern !== 'NONE'
                          ? `Reversal trigger verified: ${trendPullback.reversalCandlePattern.replace('_', ' ')}. Execute limit entries inside the value zone.`
                          : "Awaiting final candlestick rejection trigger off the dynamic 20 EMA or 61.8% Golden Pocket floor before firing entries."
                      )}
                    </p>
                  </div>
                </div>

              </div>

            </div>
          </div>
          )}

          {/* TAB 2: ADVANCED MARKET INTELLIGENCE (26-POINT SUITE) */}
          {activeTab === 'INTELLIGENCE' && (
            <TrendPullbackIntelligenceView
              activeSetup={activeSetup}
              emas={emas}
              currentPrice={lastTickPrice}
              symbolDisplayName={symbolDisplayName}
              onArmSetup={activateStrategySetup}
            />
          )}

          {/* TAB 3: DEDICATED ACTIVE MONITOR VIEW */}
          {activeTab === 'MONITOR' && (
            <TrendPullbackActiveMonitor
              activeTrade={activeIndependentTrade}
              activeSetup={activeSetup}
              trendPullback={trendPullback}
              breakoutRetest={breakoutRetest}
              emas={emas}
              currentPrice={lastTickPrice}
              symbolDisplayName={symbolDisplayName}
              onArmSetup={activateStrategySetup}
              onCancelTrade={cancelActiveTrade}
              onMoveToBreakeven={handleMoveToBreakeven}
              onTakePartial={handleTakePartial}
              onMarketClose={handleMarketClose}
            />
          )}

          {/* TAB 3: DEDICATED PAST TRADE LOGS & JOURNAL VIEW */}
          {activeTab === 'LOGS' && (
            <TrendPullbackTradeLogs
              history={strategyHistory}
              onClearHistory={handleClearHistory}
            />
          )}

        </div>
      )}

    </section>
  );
}

