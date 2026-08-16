import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  ShieldAlert, 
  ShieldCheck, 
  Activity, 
  Zap, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Sliders, 
  Layers, 
  Sparkles, 
  RefreshCw,
  Award,
  ArrowRight,
  Crosshair,
  Lock,
  Percent
} from 'lucide-react';
import { 
  TrendPullbackRetestSetup, 
  IndependentStrategyState, 
  TrendPullbackState, 
  BreakoutRetestState,
  EMASet 
} from '../utils/trendPullbackRetestEngine';

interface TrendPullbackActiveMonitorProps {
  activeTrade: IndependentStrategyState | null;
  activeSetup: TrendPullbackRetestSetup;
  trendPullback: TrendPullbackState;
  breakoutRetest: BreakoutRetestState;
  emas: EMASet;
  currentPrice: number;
  symbolDisplayName: string;
  onArmSetup?: () => void;
  onCancelTrade: () => void;
  onMoveToBreakeven: () => void;
  onTakePartial: () => void;
  onMarketClose: () => void;
}

export function TrendPullbackActiveMonitor({
  activeTrade,
  activeSetup,
  trendPullback,
  breakoutRetest,
  emas,
  currentPrice,
  symbolDisplayName,
  onArmSetup,
  onCancelTrade,
  onMoveToBreakeven,
  onTakePartial,
  onMarketClose
}: TrendPullbackActiveMonitorProps) {
  const [elapsedTime, setElapsedTime] = useState<string>('0s');

  useEffect(() => {
    if (!activeTrade) return;
    const start = activeTrade.entryTime;
    const updateTime = () => {
      const diffMs = Math.max(0, Date.now() - start);
      const totalSec = Math.floor(diffMs / 1000);
      const m = Math.floor(totalSec / 60);
      const s = totalSec % 60;
      setElapsedTime(m > 0 ? `${m}m ${s}s` : `${s}s`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [activeTrade?.id, activeTrade?.entryTime]);

  // If there is an active trade running in the radar
  if (activeTrade) {
    const isBull = activeTrade.direction === 'BULLISH';
    const isTriggered = activeTrade.status !== 'WAITING';
    
    // Live floating points calculation
    const floatingPoints = isTriggered
      ? (isBull ? currentPrice - activeTrade.entryPrice : activeTrade.entryPrice - currentPrice)
      : 0;
    
    const riskDistance = Math.max(0.1, Math.abs(activeTrade.entryPrice - activeTrade.stopLoss));
    const floatingRR = isTriggered && riskDistance > 0 ? (floatingPoints / riskDistance).toFixed(2) : '0.00';
    const isPositive = floatingPoints >= 0;

    // Progress percentage calculation along the SL -> Entry -> TP3 path
    let progressPercent = 50;
    if (isTriggered) {
      if (isBull) {
        const totalSpan = activeTrade.tp3 - activeTrade.stopLoss;
        const currentSpan = currentPrice - activeTrade.stopLoss;
        progressPercent = Math.min(100, Math.max(0, (currentSpan / totalSpan) * 100));
      } else {
        const totalSpan = activeTrade.stopLoss - activeTrade.tp3;
        const currentSpan = activeTrade.stopLoss - currentPrice;
        progressPercent = Math.min(100, Math.max(0, (currentSpan / totalSpan) * 100));
      }
    }

    return (
      <div id="trend-pullback-active-monitor-running" className="bg-slate-950/90 border-2 border-cyan-500/40 rounded-xl p-4 sm:p-5 shadow-2xl space-y-4">
        
        {/* TOP STATUS HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg border ${
              isBull ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400' : 'bg-rose-500/15 border-rose-500/40 text-rose-400'
            }`}>
              {isBull ? <TrendingUp className="h-5 w-5 animate-bounce" /> : <TrendingDown className="h-5 w-5 animate-bounce" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono uppercase font-black tracking-widest text-slate-400">
                  {(activeTrade.strategy || 'TREND_PULLBACK').replace(/_/g, ' ')}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                  isBull ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/50' : 'bg-rose-950/80 text-rose-300 border-rose-700/50'
                }`}>
                  {activeTrade.direction} ({isBull ? 'BUY' : 'SELL'})
                </span>
                {/* State Machine Status */}
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase border animate-pulse ${
                  activeTrade.status === 'TRIGGERED'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60'
                    : activeTrade.status === 'TP1_HIT' || activeTrade.status === 'TP2_HIT'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {(activeTrade.executionState || activeTrade.status || 'MONITORING').replace(/_/g, ' ')}
                </span>
                {activeTrade.dnaString && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-950/80 text-purple-300 border border-purple-800/60">
                    🧬 {activeTrade.dnaString}
                  </span>
                )}
                {activeTrade.regimeLabel && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                    🧭 {activeTrade.regimeLabel}
                  </span>
                )}
                {activeTrade.qualityGrade && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-800/60">
                    ★ GRADE {activeTrade.qualityGrade}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-2 flex-wrap">
                <span>Asset: <strong className="text-white">{symbolDisplayName}</strong></span>
                <span>• ID: <span className="text-slate-500">{activeTrade.id}</span></span>
                <span>• Live Elapsed: <strong className="text-cyan-400">{elapsedTime}</strong></span>
                {activeTrade.triggerType && <span>• Trigger: <strong className="text-amber-400">{activeTrade.triggerType}</strong></span>}
              </p>
            </div>
          </div>

          {/* REAL-TIME FLOATING P&L BOX */}
          <div className="bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-xl text-right">
            <span className="text-[9px] uppercase font-mono tracking-wider text-slate-400 block">
              {isTriggered ? 'Floating Unrealized P&L' : 'Waiting for Price to Hit Entry'}
            </span>
            <div className="flex items-baseline justify-end gap-2">
              <span className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${
                isTriggered 
                  ? (isPositive ? 'text-emerald-400' : 'text-rose-400')
                  : 'text-amber-400'
              }`}>
                {isTriggered ? `${isPositive ? '+' : ''}${floatingPoints.toFixed(2)} pts` : 'ARMED / PENDING'}
              </span>
              {isTriggered && (
                <span className={`text-xs font-mono font-bold ${isPositive ? 'text-emerald-300' : 'text-rose-300'}`}>
                  ({isPositive ? '+' : ''}{floatingRR}R)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* PROGRESS VISUAL RADAR BAR */}
        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 space-y-2">
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span className="text-rose-400 font-bold">SL: {activeTrade.stopLoss.toFixed(2)}</span>
            <span className="text-cyan-300 font-bold">Entry: {activeTrade.entryPrice.toFixed(2)}</span>
            <span className="text-emerald-400">TP1: {activeTrade.tp1.toFixed(2)}</span>
            <span className="text-emerald-400 font-bold">TP2: {activeTrade.tp2.toFixed(2)}</span>
            <span className="text-emerald-300 font-black">TP3: {activeTrade.tp3.toFixed(2)}</span>
          </div>

          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800 relative">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${
                isPositive 
                  ? 'bg-gradient-to-r from-cyan-500 via-emerald-400 to-amber-300 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                  : 'bg-gradient-to-r from-rose-600 to-amber-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 flex-wrap gap-1">
            <span>Spot Current: <strong className="text-white">{currentPrice.toFixed(2)}</strong></span>
            <span>Max Run-Up (MFE): <strong className="text-emerald-400">+{activeTrade.maxFavorableExcursion || 0} pts</strong></span>
            <span>Max Drawdown (MAE): <strong className="text-rose-400">-{activeTrade.maxAdverseExcursion || 0} pts</strong></span>
            <span>R:R Target: <strong className="text-amber-400">{activeTrade.riskReward}</strong></span>
          </div>
        </div>

        {/* LIVE TRADE ACTION CONTROLS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <button
            id="btn-monitor-move-be"
            onClick={onMoveToBreakeven}
            disabled={!isTriggered || activeTrade.breakevenMoved}
            className={`py-2 px-3 rounded-lg border text-xs font-mono font-bold uppercase transition-all flex items-center justify-center gap-1.5 ${
              activeTrade.breakevenMoved
                ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300 shadow'
                : 'bg-slate-900 hover:bg-slate-800 border-cyan-500/40 text-cyan-300 hover:text-white cursor-pointer'
            }`}
          >
            <Lock className="h-3.5 w-3.5" />
            {activeTrade.breakevenMoved ? 'Auto SL at Break-Even' : 'Move SL to B.E.'}
          </button>

          <button
            id="btn-monitor-take-partial"
            onClick={onTakePartial}
            disabled={!isTriggered || activeTrade.partialTaken}
            className={`py-2 px-3 rounded-lg border text-xs font-mono font-bold uppercase transition-all flex items-center justify-center gap-1.5 ${
              activeTrade.partialTaken
                ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300 shadow'
                : 'bg-slate-900 hover:bg-slate-800 border-amber-500/40 text-amber-300 hover:text-white cursor-pointer'
            }`}
          >
            <Percent className="h-3.5 w-3.5" />
            {activeTrade.partialTaken ? 'Auto 50% Profit Secured' : 'Lock 50% Partial'}
          </button>

          <button
            id="btn-monitor-market-close"
            onClick={onMarketClose}
            className="py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-mono font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Crosshair className="h-3.5 w-3.5 text-amber-400" />
            Market Close
          </button>

          <button
            id="btn-monitor-cancel-setup"
            onClick={onCancelTrade}
            className="py-2 px-3 rounded-lg bg-rose-950/50 hover:bg-rose-900 border border-rose-800/80 text-rose-300 text-xs font-mono font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <XCircle className="h-3.5 w-3.5" />
            Cancel Trade
          </button>
        </div>

      </div>
    );
  }

  // IDLE / SCANNING RADAR VIEW (When no active trade is currently running)
  return (
    <div id="trend-pullback-active-monitor-idle" className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-xl space-y-4">
      
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Zap className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              TREND PULLBACK & RETEST ACTIVE MONITOR
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-bold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                AUTOMATIC EXECUTION ARMED
              </span>
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">
              Continuous price action scanner • Automatic trade placement upon condition verification • Automatic 50% profit secure at TP1.
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[9px] uppercase font-mono text-slate-500 block">Execution Engine</span>
          <span className={`text-xs font-mono font-black uppercase px-2.5 py-1 rounded border ${
            activeSetup.executionState === 'ENTRY_TRIGGERED'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 animate-pulse'
              : activeSetup.executionState === 'ENTRY_ARMED'
              ? 'bg-purple-500/20 text-purple-300 border-purple-500/60 animate-pulse'
              : activeSetup.executionState === 'SETUP_VALIDATED'
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
          }`}>
            {activeSetup.executionState.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* 2-COLUMN RADAR DIAGNOSTICS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* LEFT 7 COLS: Current Best Setup Parameters & Auto-Execution Indicator */}
        <div className="lg:col-span-7 bg-slate-900/70 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block">Calibrated Best-Fit Setup</span>
                <span className={`text-sm font-black font-mono uppercase flex items-center gap-1.5 ${
                  activeSetup.direction === 'BULLISH' ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {activeSetup.direction === 'BULLISH' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {activeSetup.strategyType.replace('_', ' ')} • {activeSetup.direction}
                </span>
              </div>

              <div className="text-right font-mono text-xs">
                <span className="text-slate-500 text-[10px] block">Confidence Score</span>
                <span className="text-amber-300 font-bold">{activeSetup.confidence}%</span>
              </div>
            </div>

            {/* Quick Price Targets Grid */}
            <div className="grid grid-cols-3 gap-2 my-2 text-[11px] font-mono">
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-[9px] text-slate-500 uppercase block">Optimal Entry</span>
                <span className="text-cyan-300 font-bold text-xs">{activeSetup.entryPrice.toFixed(2)}</span>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-[9px] text-slate-500 uppercase block">Hard Stop (SL)</span>
                <span className="text-rose-400 font-bold text-xs">{activeSetup.stopLoss.toFixed(2)}</span>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-[9px] text-slate-500 uppercase block">Take Profit (TP2)</span>
                <span className="text-emerald-400 font-bold text-xs">{activeSetup.tp2.toFixed(2)}</span>
              </div>
            </div>

            {/* Execution Rule Text */}
            <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800 text-[10px] font-mono">
              <span className="text-amber-400 font-bold block uppercase text-[9px] mb-0.5">Execution Rule:</span>
              <p className="text-slate-300 italic">
                {activeSetup.executionRuleText}
              </p>
            </div>
          </div>

          {/* AUTOMATED TRADE EXECUTION SYSTEM STATUS (REPLACING MANUAL ARM BUTTON) */}
          <div className="bg-gradient-to-r from-emerald-950/80 via-slate-950 to-cyan-950/80 border border-emerald-500/50 p-3.5 rounded-xl flex items-center justify-between gap-3 text-xs font-mono shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0">
                <Zap className="h-4 w-4 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-white uppercase text-xs">
                    AUTOMATIC TRADE EXECUTION ACTIVE
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50">
                    LIVE RADAR
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  When confluence and trigger verify, trade is placed automatically on Active Monitor. 50% profit secured automatically at TP1 with SL moved to B.E.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end shrink-0">
              <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>ARMED & READY</span>
              </div>
              <span className="text-[9px] text-slate-500 font-mono">
                {activeSetup.executionState === 'ENTRY_TRIGGERED' ? 'Triggering Now' : 'Scanning Zone'}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT 5 COLS: Diagnostic Confluence Filter Matrix */}
        <div className="lg:col-span-5 bg-slate-900/70 border border-slate-800/80 rounded-xl p-4 space-y-2">
          <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-400" /> Confluence Matrix
            </span>
            <span className="text-[9px] font-mono text-emerald-400 font-bold">
              Grade: {activeSetup.qualityScore >= 80 ? 'A+ Elite' : 'A Prime'}
            </span>
          </div>

          <div className="space-y-1 text-[10px] font-mono max-h-[220px] overflow-y-auto pr-0.5">
            {(activeSetup.detailedConfluences || []).map((check) => (
              <div 
                key={check.id} 
                className={`p-1.5 rounded flex items-center justify-between border ${
                  check.status === 'CONFIRMED'
                    ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300'
                    : check.status === 'WAITING'
                    ? 'bg-amber-950/20 border-amber-900/40 text-amber-300'
                    : 'bg-slate-950/40 border-slate-800/60 text-slate-500'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0 pr-1">
                  <span className="text-[8px] font-bold uppercase px-1 py-0.2 rounded bg-slate-950 text-slate-400 border border-slate-800 shrink-0">
                    {check.category.replace('_', ' ')}
                  </span>
                  <span className="truncate">{check.label}</span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {check.status === 'CONFIRMED' ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  ) : check.status === 'WAITING' ? (
                    <Clock className="h-3.5 w-3.5 text-amber-400" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-slate-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
