import React from 'react';
import { 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  Target, 
  Sparkles, 
  Crosshair, 
  Layers, 
  Radio, 
  Compass, 
  Clock 
} from 'lucide-react';
import { TrendPullbackRetestSetup } from '../utils/trendPullbackRetestEngine';

interface FinalDecisionCardProps {
  activeSetup: TrendPullbackRetestSetup;
  currentPrice?: number;
  onArmSetup?: () => void;
  compact?: boolean;
}

export function FinalDecisionCard({
  activeSetup,
  currentPrice,
  onArmSetup,
  compact = false
}: FinalDecisionCardProps) {
  const isBull = activeSetup.direction === 'BULLISH';
  const isArmed = activeSetup.executionState === 'ENTRY_ARMED' || activeSetup.executionState === 'ENTRY_TRIGGERED';

  // Compute clean display values
  const directionText = activeSetup.direction || 'BULLISH';
  const regimeText = activeSetup.regime?.label || 'TRENDING';
  const htfBiasText = activeSetup.multiTimeframe?.htfBias || activeSetup.direction;
  const setupText = (activeSetup.strategyType || 'TREND_PULLBACK').replace(/_/g, ' ');
  const locationText = activeSetup.proximity?.classification === 'INSIDE_ZONE' || activeSetup.proximity?.classification === 'OPTIMAL' 
    ? 'VALUE ZONE' 
    : activeSetup.proximity?.classification === 'APPROACHING' 
    ? 'APPROACHING ZONE' 
    : 'OUTSIDE ZONE';

  const liquidityText = activeSetup.liquidityRadar?.sweepDetected
    ? (activeSetup.liquidityRadar.sweepType === 'BUYSIDE_SWEEP' ? 'BUY-SIDE SWEEP CONFIRMED' : 'SELL-SIDE SWEEP CONFIRMED')
    : 'MONITORING POOLS';

  const displacementText = activeSetup.displacement?.type !== 'NO_DISPLACEMENT'
    ? `STRONG (${activeSetup.displacement?.strength || 85}/100)`
    : 'MODERATE';

  const fvgText = activeSetup.fvgData?.activeEntryFVG
    ? `VALID (${activeSetup.fvgData.activeEntryFVG.freshness.toUpperCase()})`
    : 'NO FVG OVERLAP';

  const paText = activeSetup.actualTriggerType
    ? `${activeSetup.actualTriggerType.replace(/_/g, ' ')} CONFIRMED`
    : activeSetup.expectedTriggerPattern
    ? `AWAITING ${activeSetup.expectedTriggerPattern.replace(/_/g, ' ')}`
    : 'AWAITING REJECTION';

  const rrText = activeSetup.riskRewardRatio.replace('1:', '') || '2.8';
  const qualityText = `${activeSetup.qualityBreakdown?.totalScore || activeSetup.qualityScore || 85}/100 — ${activeSetup.qualityBreakdown?.grade || 'A'}`;
  const entryText = `${activeSetup.entryZoneMin.toFixed(2)} – ${activeSetup.entryZoneMax.toFixed(2)}`;
  const slText = activeSetup.stopLoss.toFixed(2);
  const tp1Text = activeSetup.tp1.toFixed(2);
  const tp2Text = activeSetup.tp2.toFixed(2);
  const tp3Text = activeSetup.tp3.toFixed(2);

  const statusText = activeSetup.executionState === 'ENTRY_TRIGGERED'
    ? 'ENTRY TRIGGERED — EXECUTE NOW'
    : activeSetup.executionState === 'ENTRY_ARMED'
    ? 'ENTRY ARMED — WAITING FOR CONFIRMED CLOSE'
    : activeSetup.executionState === 'SETUP_VALIDATED'
    ? 'SETUP VALIDATED — APPROACHING ENTRY'
    : activeSetup.executionState === 'SETUP_FORMING'
    ? 'SETUP FORMING — AWAITING CONFLUENCE'
    : activeSetup.executionState === 'INVALIDATED'
    ? 'SETUP INVALIDATED — RE-ANALYZING'
    : activeSetup.executionState === 'EXPIRED'
    ? 'SETUP EXPIRED — NEW ROTATION'
    : activeSetup.executionState === 'TRADE_ACTIVE'
    ? 'TRADE ACTIVE — MANAGING EXCURSION'
    : 'SCANNING FOR CONFLUENCE';

  return (
    <div id="final-decision-card" className="bg-slate-950/95 border-2 border-slate-800 hover:border-slate-700 rounded-xl p-4 sm:p-5 shadow-2xl transition-all relative overflow-hidden">
      
      {/* Background Subtle Gradient Glow */}
      <div className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-10 pointer-events-none ${
        isBull ? 'bg-emerald-500' : 'bg-rose-500'
      }`}></div>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5 mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${
            isBull ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'bg-rose-500/10 border-rose-500/40 text-rose-400'
          }`}>
            {isBull ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                MARKET DECISION
              </h2>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono tracking-wider border ${
                activeSetup.executionState === 'ENTRY_TRIGGERED'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 animate-pulse'
                  : activeSetup.executionState === 'ENTRY_ARMED'
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/60 animate-pulse'
                  : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
              }`}>
                {activeSetup.executionState?.replace(/_/g, ' ') || 'SCANNING'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Unified Sniper Decision Engine • Multi-Factor Institutional Confluence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-mono font-bold shadow-lg">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
          <Zap className="h-3.5 w-3.5 text-emerald-400" />
          <span>AUTO-EXECUTION ARMED</span>
        </div>
      </div>

      {/* Structured Key-Value Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 text-xs font-mono">
        
        {/* Direction */}
        <div className="bg-slate-900/90 border border-slate-800/80 p-2.5 rounded-lg">
          <span className="text-[9px] uppercase text-slate-500 block mb-0.5">Direction</span>
          <span className={`font-black text-xs sm:text-sm uppercase flex items-center gap-1 ${
            isBull ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {directionText}
          </span>
        </div>

        {/* Regime */}
        <div className="bg-slate-900/90 border border-slate-800/80 p-2.5 rounded-lg">
          <span className="text-[9px] uppercase text-slate-500 block mb-0.5">Regime</span>
          <span className="font-bold text-xs sm:text-sm text-cyan-300 uppercase truncate block">
            {regimeText}
          </span>
        </div>

        {/* HTF Bias */}
        <div className="bg-slate-900/90 border border-slate-800/80 p-2.5 rounded-lg">
          <span className="text-[9px] uppercase text-slate-500 block mb-0.5">HTF Bias</span>
          <span className={`font-bold text-xs sm:text-sm uppercase ${
            htfBiasText === 'BULLISH' ? 'text-emerald-400' : htfBiasText === 'BEARISH' ? 'text-rose-400' : 'text-slate-300'
          }`}>
            {htfBiasText}
          </span>
        </div>

        {/* Setup */}
        <div className="bg-slate-900/90 border border-slate-800/80 p-2.5 rounded-lg">
          <span className="text-[9px] uppercase text-slate-500 block mb-0.5">Setup</span>
          <span className="font-bold text-xs sm:text-sm text-amber-400 uppercase truncate block">
            {setupText}
          </span>
        </div>

        {/* Location */}
        <div className="bg-slate-900/90 border border-slate-800/80 p-2.5 rounded-lg">
          <span className="text-[9px] uppercase text-slate-500 block mb-0.5">Location</span>
          <span className="font-bold text-xs sm:text-sm text-emerald-300 uppercase truncate block">
            {locationText}
          </span>
        </div>

        {/* Liquidity */}
        <div className="bg-slate-900/90 border border-slate-800/80 p-2.5 rounded-lg">
          <span className="text-[9px] uppercase text-slate-500 block mb-0.5">Liquidity</span>
          <span className="font-bold text-xs text-purple-300 uppercase truncate block">
            {liquidityText}
          </span>
        </div>

        {/* Displacement */}
        <div className="bg-slate-900/90 border border-slate-800/80 p-2.5 rounded-lg">
          <span className="text-[9px] uppercase text-slate-500 block mb-0.5">Displacement</span>
          <span className="font-bold text-xs text-cyan-400 uppercase truncate block">
            {displacementText}
          </span>
        </div>

        {/* FVG */}
        <div className="bg-slate-900/90 border border-slate-800/80 p-2.5 rounded-lg">
          <span className="text-[9px] uppercase text-slate-500 block mb-0.5">Fair Value Gap</span>
          <span className="font-bold text-xs text-amber-300 uppercase truncate block">
            {fvgText}
          </span>
        </div>

        {/* Price Action */}
        <div className="bg-slate-900/90 border border-slate-800/80 p-2.5 rounded-lg">
          <span className="text-[9px] uppercase text-slate-500 block mb-0.5">Price Action</span>
          <span className="font-bold text-xs text-emerald-400 uppercase truncate block">
            {paText}
          </span>
        </div>

        {/* Risk : Reward */}
        <div className="bg-slate-900/90 border border-slate-800/80 p-2.5 rounded-lg">
          <span className="text-[9px] uppercase text-slate-500 block mb-0.5">Risk : Reward</span>
          <span className="font-bold text-xs sm:text-sm text-amber-400">
            1:{rrText}
          </span>
        </div>

        {/* Setup Quality */}
        <div className="bg-slate-900/90 border border-slate-800/80 p-2.5 rounded-lg">
          <span className="text-[9px] uppercase text-slate-500 block mb-0.5">Setup Quality</span>
          <span className="font-black text-xs sm:text-sm text-emerald-400">
            {qualityText}
          </span>
        </div>

        {/* Entry Zone */}
        <div className="bg-slate-900/90 border border-slate-800/80 p-2.5 rounded-lg">
          <span className="text-[9px] uppercase text-emerald-500 font-bold block mb-0.5">Entry Zone</span>
          <span className="font-bold text-xs sm:text-sm text-white">
            {entryText}
          </span>
        </div>

        {/* Stop Loss */}
        <div className="bg-slate-900/90 border border-slate-800/80 p-2.5 rounded-lg">
          <span className="text-[9px] uppercase text-rose-500 font-bold block mb-0.5">Stop Loss</span>
          <span className="font-bold text-xs sm:text-sm text-rose-400">
            {slText}
          </span>
        </div>

        {/* TP1 & TP2 */}
        <div className="bg-slate-900/90 border border-slate-800/80 p-2.5 rounded-lg">
          <span className="text-[9px] uppercase text-emerald-500 font-bold block mb-0.5">TP1 / TP2</span>
          <span className="font-bold text-xs sm:text-sm text-emerald-400">
            {tp1Text} / {tp2Text}
          </span>
        </div>

        {/* TP3 */}
        <div className="bg-slate-900/90 border border-slate-800/80 p-2.5 rounded-lg">
          <span className="text-[9px] uppercase text-emerald-500 font-bold block mb-0.5">TP3 (Runner)</span>
          <span className="font-bold text-xs sm:text-sm text-emerald-300">
            {tp3Text}
          </span>
        </div>

      </div>

      {/* Footer Status Line */}
      <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 bg-slate-900/60 p-2.5 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Status:</span>
          <span className={`text-xs font-mono font-black uppercase tracking-wider ${
            isArmed ? 'text-emerald-400' : 'text-amber-400'
          }`}>
            {statusText}
          </span>
        </div>

        <div className="text-[10px] font-mono text-slate-400 flex items-center gap-3">
          {currentPrice && (
            <span>Live Price: <strong className="text-white">{currentPrice.toFixed(2)}</strong></span>
          )}
          <span>Execution Principle: <strong className="text-cyan-300">High Score + Value Location + PA Wick + Risk = Valid Entry</strong></span>
        </div>
      </div>

    </div>
  );
}
