import React, { useState } from 'react';
import { 
  Zap, 
  Target, 
  ShieldCheck, 
  ShieldAlert, 
  Activity, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  Sliders, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Compass, 
  Crosshair, 
  Radio, 
  BarChart3, 
  Flame, 
  Dna, 
  Calendar, 
  Search, 
  Info,
  ChevronRight,
  RefreshCw,
  Gauge
} from 'lucide-react';
import { 
  TrendPullbackRetestSetup, 
  EMASet 
} from '../utils/trendPullbackRetestEngine';
import { FinalDecisionCard } from './FinalDecisionCard';

interface TrendPullbackIntelligenceViewProps {
  activeSetup: TrendPullbackRetestSetup;
  emas: EMASet;
  currentPrice: number;
  symbolDisplayName: string;
  onArmSetup?: () => void;
}

export function TrendPullbackIntelligenceView({
  activeSetup,
  emas,
  currentPrice,
  symbolDisplayName,
  onArmSetup
}: TrendPullbackIntelligenceViewProps) {
  const [selectedSubView, setSelectedSubView] = useState<'OVERVIEW' | 'INSTITUTIONAL' | 'QUALITY' | 'DNA'>('OVERVIEW');

  const {
    regime,
    multiTimeframe,
    liquidityRadar,
    displacement,
    fvgData,
    obQuality,
    qualityBreakdown,
    proximity,
    conflicts,
    blockers,
    nextEvent,
    timeline,
    probabilityMatrix,
    sessionIntelligence,
    volatilityRisk,
    executionQuality,
    setupDNA,
    strategyRanks,
    similarSetups
  } = activeSetup;

  const isBull = activeSetup.direction === 'BULLISH';

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-300">
      
      {/* SECTION 25: PROMINENT FINAL DECISION CARD */}
      <FinalDecisionCard
        activeSetup={activeSetup}
        currentPrice={currentPrice}
        onArmSetup={onArmSetup}
      />

      {/* 1. TOP MACRO INTELLIGENCE BAR: REGIME, SESSION, DNA & QUALITY */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
        
        {/* Card 1: Market Regime Detector */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] uppercase font-mono font-bold tracking-wider text-slate-400 flex items-center gap-1">
              <Compass className="h-3 w-3 text-cyan-400" /> Market Regime
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
              {regime.confidence}% CONF
            </span>
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-wide text-white flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${
                regime.regime === 'STRONG_TREND' ? 'bg-emerald-400 animate-ping' :
                regime.regime === 'PULLBACK' ? 'bg-cyan-400' :
                regime.regime === 'COMPRESSION' ? 'bg-amber-400' : 'bg-purple-400'
              }`}></span>
              {regime.label}
            </div>
            <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-tight">
              {regime.description}
            </p>
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-900 flex items-center justify-between text-[9px] font-mono text-slate-500">
            <span>Pullback: <strong className={regime.strategyAdaptation.pullbackStatus === 'PREFERRED' ? 'text-emerald-400' : 'text-slate-400'}>{regime.strategyAdaptation.pullbackStatus}</strong></span>
            <span>Retest: <strong className={regime.strategyAdaptation.retestStatus === 'PREFERRED' ? 'text-cyan-400' : 'text-slate-400'}>{regime.strategyAdaptation.retestStatus}</strong></span>
          </div>
        </div>

        {/* Card 2: Session Intelligence */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] uppercase font-mono font-bold tracking-wider text-slate-400 flex items-center gap-1">
              <Clock className="h-3 w-3 text-amber-400" /> Session Timing
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono ${
              sessionIntelligence.strategyHistoricalFit === 'EXCELLENT' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse' : 'bg-slate-900 text-slate-400'
            }`}>
              {(sessionIntelligence.currentSession || 'ASIAN').replace(/_/g, ' ')}
            </span>
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-wide text-white">
              {sessionIntelligence.sessionName}
            </div>
            <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-tight">
              {sessionIntelligence.sessionNote}
            </p>
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-900 flex items-center justify-between text-[9px] font-mono text-slate-500">
            <span>Volume: <strong className="text-white">{sessionIntelligence.sessionVolumeRating}</strong></span>
            <span>Strategy Fit: <strong className="text-emerald-400">{sessionIntelligence.strategyHistoricalFit}</strong></span>
          </div>
        </div>

        {/* Card 3: Setup DNA Archetype */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] uppercase font-mono font-bold tracking-wider text-slate-400 flex items-center gap-1">
              <Dna className="h-3 w-3 text-purple-400" /> Setup DNA Archetype
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-purple-950 text-purple-300 border border-purple-800">
              {(activeSetup.strategyType || 'TREND_PULLBACK').replace(/_/g, ' ')}
            </span>
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-wide text-purple-300 truncate">
              {setupDNA.dnaString}
            </div>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {setupDNA.tags.slice(0, 3).map((tag, idx) => (
                <span key={idx} className="px-1.5 py-0.5 rounded bg-purple-950/60 border border-purple-800/40 text-purple-300 text-[8px] font-mono">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-900 flex items-center justify-between text-[9px] font-mono text-slate-500">
            <span>Historical Matches: <strong className="text-white">{similarSetups.matchCount}</strong></span>
            <span>Sample Win Rate: <strong className="text-emerald-400">{similarSetups.winRate}%</strong></span>
          </div>
        </div>

        {/* Card 4: Quality & Probability */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] uppercase font-mono font-bold tracking-wider text-slate-400 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-emerald-400" /> Quality & Win Edge
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono border ${qualityBreakdown.gradeBadgeColor}`}>
              GRADE {qualityBreakdown.grade}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-xl font-black font-mono text-white">
                {qualityBreakdown.totalScore}
              </span>
              <span className="text-[10px] text-slate-500 font-mono ml-1">/100</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-black font-mono text-emerald-400">
                {isBull ? probabilityMatrix.buyProbability : probabilityMatrix.sellProbability}% Win Prob
              </span>
              <span className="text-[9px] text-slate-500 block font-mono">
                {probabilityMatrix.directionalBias} BIAS
              </span>
            </div>
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-900 flex items-center justify-between text-[9px] font-mono text-slate-500">
            <span>MTF Align: <strong className={multiTimeframe.isAligned ? 'text-emerald-400' : 'text-amber-400'}>{multiTimeframe.alignmentScore}%</strong></span>
            <span>Blockers: <strong className={blockers.activeBlockerCount === 0 ? 'text-emerald-400' : 'text-rose-400'}>{blockers.activeBlockerCount} Active</strong></span>
          </div>
        </div>

      </div>

      {/* 2. SUBVIEW NAVIGATION TABS */}
      <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs font-mono">
        <button
          onClick={() => setSelectedSubView('OVERVIEW')}
          className={`flex-1 py-1.5 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            selectedSubView === 'OVERVIEW'
              ? 'bg-gradient-to-r from-amber-500/20 to-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Activity className="h-3.5 w-3.5 text-cyan-400" />
          <span>REGIME & GATES</span>
        </button>

        <button
          onClick={() => setSelectedSubView('INSTITUTIONAL')}
          className={`flex-1 py-1.5 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            selectedSubView === 'INSTITUTIONAL'
              ? 'bg-gradient-to-r from-amber-500/20 to-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Radio className="h-3.5 w-3.5 text-amber-400" />
          <span>LIQUIDITY & FVG & OB</span>
        </button>

        <button
          onClick={() => setSelectedSubView('QUALITY')}
          className={`flex-1 py-1.5 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            selectedSubView === 'QUALITY'
              ? 'bg-gradient-to-r from-amber-500/20 to-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>QUALITY SCORE & PROBABILITY</span>
        </button>

        <button
          onClick={() => setSelectedSubView('DNA')}
          className={`flex-1 py-1.5 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            selectedSubView === 'DNA'
              ? 'bg-gradient-to-r from-amber-500/20 to-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Dna className="h-3.5 w-3.5 text-purple-400" />
          <span>SETUP DNA & HISTORICAL MATCH</span>
        </button>
      </div>

      {/* VIEW 1: REGIME, MTF, ENTRY GATES & TIMELINE */}
      {selectedSubView === 'OVERVIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          
          {/* Column 1: Multi-Timeframe Alignment Matrix (5 Cols) */}
          <div className="lg:col-span-5 bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 space-y-3 shadow-lg">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-cyan-400" /> Multi-Timeframe Alignment
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                multiTimeframe.isAligned ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}>
                {multiTimeframe.alignmentScore}% CONVERGENCE
              </span>
            </div>

            <div className="space-y-2">
              {multiTimeframe.timeframes.map((item) => (
                <div 
                  key={item.tf}
                  className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/80 flex items-center justify-between text-xs font-mono"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200 w-8">{item.tf}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                      item.bias === 'BULLISH' ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50' :
                      item.bias === 'BEARISH' ? 'bg-rose-950/80 text-rose-400 border border-rose-800/50' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {item.bias}
                    </span>
                    <span className="text-[10px] text-slate-400 hidden sm:inline truncate max-w-[130px]">{item.detail}</span>
                  </div>
                  <div className="flex items-center gap-2 text-right">
                    <span className="text-[10px] text-slate-400">Score: {item.trendScore}</span>
                    {item.bias === activeSetup.direction ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-2.5 bg-slate-900/40 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-300 flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
              <span>HTF Bias: <strong className="text-white">{multiTimeframe.htfBias}</strong> | LTF Bias: <strong className="text-white">{multiTimeframe.ltfBias}</strong> | Entry Trigger TF: <strong className="text-cyan-400">{multiTimeframe.entryTimeframe}</strong></span>
            </div>
          </div>

          {/* Column 2: Entry Proximity & Institutional Blockers (4 Cols) */}
          <div className="lg:col-span-4 bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 space-y-3 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Crosshair className="h-3.5 w-3.5 text-amber-400" /> Entry Proximity & Blockers
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                  proximity.classification === 'INSIDE_ZONE' || proximity.classification === 'OPTIMAL' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 animate-pulse' :
                  proximity.classification === 'APPROACHING' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' :
                  'bg-rose-950 text-rose-300 border border-rose-800'
                }`}>
                  {(proximity.classification || 'APPROACHING').replace(/_/g, ' ')}
                </span>
              </div>

              {/* Distance Meter */}
              <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 mb-2.5">
                <div className="flex justify-between items-center text-xs font-mono mb-1">
                  <span className="text-slate-400">Distance to Entry:</span>
                  <span className="text-amber-400 font-bold">{proximity.distancePts} pts ({proximity.distancePercent}%)</span>
                </div>
                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden flex">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      proximity.distancePts < 2 ? 'bg-emerald-400' : proximity.distancePts < 5 ? 'bg-cyan-400' : 'bg-amber-400'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(10, 100 - proximity.distancePercent * 20))}%` }}
                  ></div>
                </div>
                {proximity.isLateEntryBlocked && (
                  <p className="text-[9px] text-rose-400 font-mono mt-1 font-bold">
                    ⚠️ {proximity.blockReason}
                  </p>
                )}
              </div>

              {/* Entry Blocker Hard Gates */}
              <div className="space-y-1.5">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Institutional Entry Gates</span>
                {blockers.blockers.map((b) => (
                  <div 
                    key={b.id}
                    className={`flex items-center justify-between p-1.5 rounded text-[10px] font-mono border ${
                      !b.isBlocked ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300' : 'bg-rose-950/20 border-rose-900/40 text-rose-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {!b.isBlocked ? <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" /> : <XCircle className="h-3 w-3 text-rose-400 shrink-0" />}
                      <span className="truncate">{b.condition}</span>
                    </div>
                    <span className="text-[8px] uppercase font-bold px-1 rounded bg-slate-900 text-slate-400 shrink-0 ml-1">
                      {!b.isBlocked ? 'CLEARED' : 'BLOCKED'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Conflict Warnings */}
            <div className="mt-2.5 pt-2 border-t border-slate-900">
              {conflicts.hasConflict ? (
                <div className="bg-amber-950/30 border border-amber-800/40 p-2 rounded text-[9px] text-amber-300 font-mono">
                  <span className="font-bold block uppercase flex items-center gap-1 text-amber-400">
                    <AlertTriangle className="h-3 w-3" /> Conflict Detected:
                  </span>
                  {conflicts.warningMessage || 'Confluence conflict between trend and oscillator reset.'}
                </div>
              ) : (
                <div className="text-[9px] text-emerald-400 font-mono flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Zero structural conflicts. Path to target clear.
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Setup Evolution Timeline & Strategy Ranking (3 Cols) */}
          <div className="lg:col-span-3 bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-3">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-purple-400" /> Setup Timeline
                </span>
                <span className="text-[9px] font-mono text-slate-400">
                  {timeline.length} Milestones
                </span>
              </div>

              {/* Vertical Step Timeline */}
              <div className="space-y-2 relative pl-2 border-l border-slate-800 ml-1.5">
                {timeline.map((step, idx) => (
                  <div key={idx} className="relative pl-3 text-xs font-mono">
                    <span className={`absolute -left-[13px] top-0.5 h-2.5 w-2.5 rounded-full border-2 ${
                      step.type === 'TRIGGER'
                        ? 'bg-emerald-500 border-slate-950 ring-2 ring-emerald-500/30 animate-pulse' 
                        : step.type === 'CONFIRMATION'
                        ? 'bg-cyan-500 border-slate-950'
                        : 'bg-slate-700 border-slate-600'
                    }`}></span>
                    <div>
                      <div className="flex justify-between items-center">
                        <span className={`font-bold block text-[10px] ${
                          step.type === 'TRIGGER' ? 'text-emerald-300' :
                          step.type === 'CONFIRMATION' ? 'text-cyan-300' : 'text-slate-300'
                        }`}>
                          {step.stage}
                        </span>
                        <span className="text-[8px] text-slate-500">{step.timeFormatted}</span>
                      </div>
                      <span className="text-[9px] text-slate-400 block leading-tight mt-0.5">
                        {step.description}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Expected Step */}
            <div className="mt-3 pt-2.5 border-t border-slate-900">
              <span className="text-[9px] uppercase font-bold text-cyan-400 font-mono block mb-1">
                Next Expected Action
              </span>
              <p className="text-[10px] text-slate-300 font-mono bg-slate-900/60 p-2 rounded border border-slate-800">
                {nextEvent.predictiveWorkflowText}
              </p>
            </div>
          </div>

        </div>
      )}

      {/* VIEW 2: INSTITUTIONAL LIQUIDITY, FVG & ORDER BLOCKS */}
      {selectedSubView === 'INSTITUTIONAL' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          
          {/* Liquidity Radar (4 Cols) */}
          <div className="lg:col-span-4 bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="h-3.5 w-3.5 text-amber-400" /> Institutional Liquidity Radar
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                liquidityRadar.sweepDetected ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 animate-pulse' : 'bg-slate-900 text-slate-400'
              }`}>
                {liquidityRadar.sweepDetected ? '⚡ SWEEP DETECTED' : 'POOLS ACTIVE'}
              </span>
            </div>

            {/* Key Liquidity Levels */}
            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {liquidityRadar.levels.map((lvl) => (
                <div 
                  key={lvl.id}
                  className={`bg-slate-900/60 p-2.5 rounded-lg border text-xs font-mono space-y-1 ${
                    lvl.type === 'BSL' || lvl.type === 'PDH' || lvl.type === 'PSH' || lvl.type === 'CSH' || lvl.type === 'EQH'
                      ? 'border-emerald-900/40 text-emerald-300'
                      : 'border-rose-900/40 text-rose-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold">{lvl.label}</span>
                    <span className="text-white font-bold">{lvl.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Distance: {lvl.distancePts} pts ({lvl.distancePercent}%)</span>
                    <span className={lvl.isSwept ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                      {lvl.isSwept ? '✅ SWEPT' : 'Resting Pool'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Sweep Narrative */}
            <div className="bg-slate-900/30 p-2 rounded text-[10px] font-mono text-slate-400">
              <span className="text-amber-400 font-bold uppercase block mb-0.5">Sweep Status:</span>
              {liquidityRadar.sweepDetails || 'Tracking institutional orderbook distribution.'}
            </div>
          </div>

          {/* Fair Value Gaps (FVG) Engine (4 Cols) */}
          <div className="lg:col-span-4 bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-cyan-400" /> Fair Value Gaps (FVG)
              </span>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
                {fvgData.gaps.length} Detected
              </span>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {fvgData.gaps.length > 0 ? (
                fvgData.gaps.map((fvg) => (
                  <div 
                    key={fvg.id}
                    className={`p-2 rounded-lg border text-xs font-mono space-y-1 ${
                      fvg.type === 'BULLISH' ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300' : 'bg-rose-950/30 border-rose-800/40 text-rose-300'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[11px]">{fvg.type} FVG ({fvg.sizePts} pts)</span>
                      <span className="text-[9px] px-1.5 rounded bg-slate-900 text-slate-300">{fvg.freshness}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Zone:</span>
                      <span className="text-white font-bold">{fvg.bottom.toFixed(2)} - {fvg.top.toFixed(2)}</span>
                    </div>
                    {fvg.confluences.length > 0 && (
                      <div className="text-[9px] text-amber-400 font-bold">
                        ★ {fvg.confluences.join(' | ')}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic py-4 text-center">No unmitigated price imbalances detected in recent candles.</p>
              )}
            </div>

            <div className="p-2 bg-slate-900/50 rounded border border-slate-800 text-[10px] font-mono text-slate-400">
              <span>FVG Confluence State: <strong className={fvgData.hasFVGConfluence ? 'text-emerald-400' : 'text-slate-400'}>{fvgData.hasFVGConfluence ? 'CONFIRMED' : 'NO DIRECT FVG'}</strong></span>
            </div>
          </div>

          {/* Order Block Quality & Displacement (4 Cols) */}
          <div className="lg:col-span-4 bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-purple-400" /> Order Block & Displacement
              </span>
              <span className="text-[10px] font-mono text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800/60">
                {displacement.strength} STRENGTH
              </span>
            </div>

            {/* Displacement Engine */}
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 text-xs font-mono space-y-1">
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-amber-400 font-bold">Displacement Impulse:</span>
                <span className="font-bold text-white">{displacement.relativeSizeMultiplier}x Avg Candle</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Latest Candle Body:</span>
                <span className="text-slate-200">{displacement.latestCandleBody} pts</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>BOS Structure Break:</span>
                <span className={displacement.bosDetected ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                  {displacement.bosDetected ? 'CONFIRMED' : 'NONE'}
                </span>
              </div>
            </div>

            {/* Active Order Block */}
            {obQuality.primaryOB ? (
              <div className="bg-purple-950/20 p-2.5 rounded-lg border border-purple-800/40 text-xs font-mono space-y-1">
                <div className="flex justify-between items-center text-purple-300">
                  <span className="font-bold">Primary {obQuality.primaryOB.type} OB:</span>
                  <span className="font-bold text-white">{obQuality.primaryOB.low.toFixed(2)} - {obQuality.primaryOB.high.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>OB Freshness:</span>
                  <span className="text-emerald-400 font-bold">{obQuality.primaryOB.freshness}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Quality Score:</span>
                  <span className="text-amber-400 font-bold">{obQuality.primaryOB.qualityScore}/100</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic py-2">Scanning order block mitigations...</p>
            )}

            <div className="text-[10px] text-slate-400 font-mono">
              <span>OB Best Quality: <strong className="text-slate-200">{obQuality.bestOBQuality}/100</strong></span>
            </div>
          </div>

        </div>
      )}

      {/* VIEW 3: QUALITY SCORING & PROBABILITY MATRIX */}
      {selectedSubView === 'QUALITY' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          
          {/* Transparent Quality Scoring (7 Cols) */}
          <div className="lg:col-span-7 bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-400" /> Transparent Setup Quality Score
                </span>
                <span className="text-[9px] text-slate-400 font-mono">Itemized 100-point algorithmic weighting model</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-black font-mono text-amber-300">{qualityBreakdown.totalScore}/100</span>
                <span className="text-[9px] font-bold font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 ml-1">
                  GRADE {qualityBreakdown.grade}
                </span>
              </div>
            </div>

            {/* Score Factor Breakdown */}
            <div className="space-y-2 text-xs font-mono">
              {[
                { name: 'Trend Alignment', factor: qualityBreakdown.trendAlignment },
                { name: 'Market Structure & Retest', factor: qualityBreakdown.marketStructure },
                { name: 'Entry Location / Golden Pocket', factor: qualityBreakdown.entryLocation },
                { name: 'Momentum Velocity & RSI', factor: qualityBreakdown.momentum },
                { name: 'Price Action Rejection Wick', factor: qualityBreakdown.priceActionRejection },
                { name: 'Risk:Reward Ratio', factor: qualityBreakdown.riskRewardRatio },
              ].map((item, idx) => (
                <div key={idx} className="bg-slate-900/60 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <span className="font-bold text-white block">{item.name}</span>
                    <span className="text-[9px] text-slate-400 block truncate">{item.factor.details}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-amber-400 text-[11px]">{item.factor.score} / {item.factor.max} pts</span>
                    <div className="w-16 bg-slate-950 h-1.5 rounded-full overflow-hidden mt-0.5">
                      <div 
                        className="bg-amber-400 h-full rounded-full"
                        style={{ width: `${(item.factor.score / item.factor.max) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bayesian Probability Matrix (5 Cols) */}
          <div className="lg:col-span-5 bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Gauge className="h-3.5 w-3.5 text-emerald-400" /> Probability Matrix
                </span>
                <span className="text-xs font-black font-mono text-emerald-300">
                  {probabilityMatrix.directionalBias} BIAS
                </span>
              </div>

              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between items-center bg-slate-900/60 p-2 rounded border border-slate-800">
                  <span className="text-emerald-400">Bullish Probability:</span>
                  <span className="text-emerald-400 font-bold">{probabilityMatrix.buyProbability}%</span>
                </div>
                <div className="flex justify-between items-center bg-slate-900/60 p-2 rounded border border-slate-800">
                  <span className="text-rose-400">Bearish Probability:</span>
                  <span className="text-rose-400 font-bold">{probabilityMatrix.sellProbability}%</span>
                </div>
                <div className="flex justify-between items-center bg-slate-900/60 p-2 rounded border border-slate-800">
                  <span className="text-slate-400">Model Certainty:</span>
                  <span className="text-cyan-400 font-bold">{probabilityMatrix.modelCertainty}%</span>
                </div>
              </div>

              <div className="mt-3 p-2.5 bg-emerald-950/30 rounded-lg border border-emerald-800/40 text-[10px] font-mono space-y-1">
                <span className="text-slate-300 block">{probabilityMatrix.description}</span>
                <div className="flex justify-between text-slate-400 mt-1">
                  <span>ATR Volatility: {volatilityRisk.currentATR} pts</span>
                  <span className="text-amber-400">{volatilityRisk.volatilityState}</span>
                </div>
              </div>
            </div>

            {/* Risk Quality Snapshot */}
            <div className="pt-2 border-t border-slate-900 text-[10px] font-mono flex justify-between text-slate-400">
              <span>Execution Quality: <strong className="text-slate-200">{executionQuality.qualityScore}/100</strong></span>
              <span>Slippage Risk: <strong className="text-slate-200">{executionQuality.slippageRisk}</strong></span>
            </div>
          </div>

        </div>
      )}

      {/* VIEW 4: SETUP DNA & HISTORICAL SEARCH */}
      {selectedSubView === 'DNA' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          
          {/* Setup DNA Deep Anatomy (6 Cols) */}
          <div className="lg:col-span-6 bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <Dna className="h-3.5 w-3.5 text-purple-400" /> Setup DNA Anatomy
              </span>
              <span className="text-[10px] font-mono text-purple-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-800">
                {activeSetup.strategyType}
              </span>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-lg border border-purple-900/40 text-xs font-mono space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">DNA Signature:</span>
                <span className="text-purple-300 font-bold">{setupDNA.dnaString}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Directional Bias:</span>
                <span className={isBull ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{activeSetup.direction}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Risk-to-Reward Class:</span>
                <span className="text-white font-bold">{activeSetup.riskRewardRatio}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {setupDNA.tags.map((tag, idx) => (
                <span key={idx} className="px-2 py-1 rounded bg-purple-950/40 border border-purple-800/40 text-purple-300 text-[10px] font-mono">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Similar Setup Historical Search & Performance (6 Cols) */}
          <div className="lg:col-span-6 bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Search className="h-3.5 w-3.5 text-amber-400" /> Historical Setup Matching
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  {similarSetups.winRate}% Sample Win Edge
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-500 uppercase block">Sample Size</span>
                  <span className="text-sm font-bold text-white">{similarSetups.matchCount} Matches</span>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-emerald-500 uppercase block">Historical Win Rate</span>
                  <span className="text-sm font-bold text-emerald-400">{similarSetups.winRate}%</span>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-cyan-500 uppercase block">Avg Reward Ratio</span>
                  <span className="text-sm font-bold text-cyan-400">1:{similarSetups.avgRR}</span>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-amber-500 uppercase block">Avg Duration</span>
                  <span className="text-sm font-bold text-amber-300">{similarSetups.medianDurationMin} mins</span>
                </div>
              </div>
            </div>

            <div className="p-2.5 bg-slate-900/40 rounded-lg border border-slate-800 text-[10px] text-slate-400 font-mono">
              <span className="text-white font-bold block mb-1">Algorithmic Guidance:</span>
              This setup matches high-probability institutional pullback footprints. Maintain strict stop loss adherence at the invalidation level ({activeSetup.invalidationLevel.toFixed(2)}).
            </div>
          </div>

        </div>
      )}

      {/* FINAL DECISION CARD & EXECUTION ARMING BAR */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
            <Zap className="h-5 w-5 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase text-white tracking-wider">
                FINAL EXECUTION DIRECTIVE:
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono border ${
                activeSetup.executionState === 'ENTRY_TRIGGERED'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 animate-pulse'
                  : activeSetup.executionState === 'ENTRY_ARMED'
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/60'
                  : activeSetup.executionState === 'SETUP_VALIDATED'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                {(activeSetup.executionState || 'STANDBY').replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-mono mt-0.5">
              {activeSetup.executionRuleText}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-2 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-mono font-bold shadow-lg flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
            <Zap className="h-4 w-4 text-emerald-400" />
            <span>AUTO-EXECUTION ARMED</span>
          </div>
        </div>
      </div>

    </div>
  );
}
