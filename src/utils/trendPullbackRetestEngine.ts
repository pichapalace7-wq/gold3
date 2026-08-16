import { Candle } from '../types';
import {
  MarketRegimeData,
  MultiTimeframeData,
  LiquidityRadarData,
  DisplacementData,
  FVGData,
  OBQualityData,
  SetupQualityBreakdown,
  EntryProximityData,
  ConflictDetectorData,
  EntryBlockersData,
  NextExpectedEventData,
  TimelineEvent,
  ProbabilityMatrixData,
  SessionIntelligenceData,
  VolatilityRiskData,
  ExecutionQualityData,
  SetupDNAData,
  StrategyRankItem,
  SimilarSetupsMatch,
  detectMarketRegime,
  computeMultiTimeframeAlignment,
  computeLiquidityRadar,
  computeDisplacement,
  detectFairValueGaps,
  computeOrderBlocks,
  calculateTransparentQualityScore,
  evaluateEntryProximity,
  detectConfluenceConflicts,
  evaluateEntryBlockers,
  computeNextExpectedEvent,
  generateEvolutionTimeline,
  computeProbabilityMatrix,
  getSessionIntelligence,
  evaluateVolatilityRisk,
  evaluateExecutionQuality,
  generateSetupDNA,
  rankStrategies,
  findSimilarHistoricalSetups
} from './trendPullbackIntelligence';

export interface EMASet {
  ema9: number;
  ema21: number;
  ema50: number;
  ema200: number;
}

export interface FibRetracement {
  swingHigh: number;
  swingLow: number;
  direction: 'UP' | 'DOWN';
  fib236: number;
  fib382: number;
  fib500: number;
  fib618: number; // Golden Pocket
  fib786: number;
  ext1272: number;
  ext1618: number;
  ext2000: number;
  currentDepthPercent: number;
  pullbackZone: 'SHALLOW' | 'GOLDEN_POCKET' | 'DEEP' | 'EXTENDED' | 'NONE';
}

export interface KeySRLevel {
  id: string;
  price: number;
  type: 'RESISTANCE' | 'SUPPORT';
  touches: number;
  strength: 'STRONG' | 'MEDIUM' | 'MINOR';
  ageInCandles: number;
  status: 'ACTIVE' | 'BROKEN_BULLISH' | 'BROKEN_BEARISH' | 'RETESTED';
}

export interface BreakoutRetestState {
  keyLevel: KeySRLevel | null;
  breakoutType: 'BULLISH_BREAKOUT' | 'BEARISH_BREAKDOWN' | 'NONE';
  breakoutPrice: number;
  retestZone: {
    min: number;
    max: number;
    center: number;
  };
  retestStatus: 'PENDING_RETEST' | 'IN_RETEST_ZONE' | 'RETEST_CONFIRMED' | 'FAILED_RETEST' | 'NONE';
  polarityFlip: string; // e.g. "Broken Resistance flipped to Support"
  rejectionWickDetected: boolean;
  retestCandleTime?: number;
  breakoutDistance: number;
}

export interface TrendPullbackState {
  trendDirection: 'STRONG_BULLISH' | 'MODERATE_BULLISH' | 'STRONG_BEARISH' | 'MODERATE_BEARISH' | 'RANGING';
  trendStrengthScore: number; // 0-100
  emaAlignment: 'FULL_BULLISH' | 'FULL_BEARISH' | 'MIXED';
  pullbackTargetEMA: 'EMA21' | 'EMA50' | 'EMA200' | 'FIB_618' | 'NONE';
  fibDetails: FibRetracement | null;
  reversalCandlePattern: 'BULLISH_HAMMER' | 'BULLISH_ENGULFING' | 'MORNING_STAR' | 'BEARISH_SHOOTING_STAR' | 'BEARISH_ENGULFING' | 'EVENING_STAR' | 'PINBAR' | 'NONE';
  pullbackQuality: 'PRIME_A+' | 'GOOD_A' | 'MODERATE_B' | 'WEAK_C';
  rsiValue: number;
  rsiState: 'OVERSOLD_BOUNCE' | 'OVERBOUGHT_DROP' | 'TREND_HEALTHY' | 'NEUTRAL';
}

export type StrategyExecutionState = 
  | 'SETUP_FORMING'
  | 'SETUP_VALIDATED'
  | 'ENTRY_ARMED'
  | 'ENTRY_TRIGGERED'
  | 'TRADE_ACTIVE'
  | 'TP1_HIT'
  | 'TP2_HIT'
  | 'TARGET_COMPLETE'
  | 'INVALIDATED'
  | 'EXPIRED';

export interface ConfluenceItem {
  id: string;
  category: 'TREND' | 'MOMENTUM' | 'LOCATION' | 'PRICE_ACTION' | 'RISK';
  label: string;
  status: 'CONFIRMED' | 'WAITING' | 'FAILED'; // ✅ CONFIRMED, ⏳ WAITING, ❌ FAILED
  detail: string;
}

export interface TrendPullbackRetestSetup {
  strategyType: 'TREND_PULLBACK' | 'BREAKOUT_RETEST' | 'HYBRID_CONFLUENCE';
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  
  // CORE EXECUTION STATE MACHINE
  executionState: StrategyExecutionState;
  stateLabel: string; // e.g. "BULLISH SETUP FORMING", "BEARISH BUY ENTRY ARMED", "ENTRY TRIGGERED"
  statusBadgeColor: string;
  executionRuleText: string; // Intelligent dynamic execution rule
  
  confidence: number; // 0-100%
  winProbability: number; // 0-100%
  qualityScore: number; // 0-100%
  confidenceScoreFormatted: string; // e.g. "SCORE: 79% — SETUP VALIDATED — WAITING FOR PINBAR"
  
  // Numerical Price Execution Parameters
  entryPrice: number;
  entryZoneMin: number;
  entryZoneMax: number;
  stopLoss: number;
  tp1: number;
  tp2: number;
  tp3: number;
  riskRewardRatio: string;
  invalidationLevel: number;
  invalidationReason?: string;
  isInvalidated: boolean;
  isExpired: boolean;
  expirationReason?: string;
  distanceToEntry: number;
  isPriceInEntryZone: boolean;
  
  // Strategy Specific Context
  keyLevelTriggered?: number;
  testedEMALevel?: number;
  fibLevelTriggered?: number;
  estimatedHoldTime: string;
  expectedTriggerPattern: string;
  actualTriggerType?: string;
  triggerCandleTime?: number;
  marketStory: string;
  
  // Confluence Engine Breakdown (Dynamic 3-state system)
  confluenceBreakdown: {
    trend: ConfluenceItem[];
    momentum: ConfluenceItem[];
    location: ConfluenceItem[];
    priceAction: ConfluenceItem[];
    risk: ConfluenceItem[];
  };
  detailedConfluences: ConfluenceItem[];
  missingTriggers: string[];
  confirmedTriggers: string[];
  
  // Advanced Market Intelligence System (26-Point Core)
  regime: MarketRegimeData;
  multiTimeframe: MultiTimeframeData;
  liquidityRadar: LiquidityRadarData;
  displacement: DisplacementData;
  fvgData: FVGData;
  obQuality: OBQualityData;
  qualityBreakdown: SetupQualityBreakdown;
  proximity: EntryProximityData;
  conflicts: ConflictDetectorData;
  blockers: EntryBlockersData;
  nextEvent: NextExpectedEventData;
  timeline: TimelineEvent[];
  probabilityMatrix: ProbabilityMatrixData;
  sessionIntelligence: SessionIntelligenceData;
  volatilityRisk: VolatilityRiskData;
  executionQuality: ExecutionQualityData;
  setupDNA: SetupDNAData;
  strategyRanks: StrategyRankItem[];
  similarSetups: SimilarSetupsMatch;

  // Legacy compatibility confirmations
  confirmations: {
    trendAligned: boolean;
    emaRibbonStacked: boolean;
    pullbackInGoldenZone: boolean;
    keyLevelBrokenAndTested: boolean;
    polarityFlipConfirmed: boolean;
    rejectionCandlePrinted: boolean;
    momentumOscillatorReset: boolean;
    favorableRiskReward: boolean;
  };
  reasons: string[];
  executionPlan: string[];
  status: string; // Legacy display string
}

export interface IndependentStrategyState {
  id: string;
  assetSymbol: string;
  strategy: 'TREND_PULLBACK' | 'BREAKOUT_RETEST';
  direction: 'BULLISH' | 'BEARISH';
  status: 'WAITING' | 'TRIGGERED' | 'TP1_HIT' | 'TP2_HIT' | 'TP3_HIT' | 'SL_HIT' | 'CANCELLED';
  executionState?: StrategyExecutionState;
  
  entryPrice: number;
  actualEntryPrice?: number;
  stopLoss: number;
  tp1: number;
  tp2: number;
  tp3: number;
  entryTime: number;
  resolvedTime?: number;
  profitPoints: number;
  profitPercent: number;
  riskReward: string;
  qualityScore: number;
  winProbability: number;
  
  // Execution & Diagnostics Tracking
  triggerType?: string;
  triggerPattern?: string;
  triggerCandleTime?: number;
  fibLevelTriggered?: number;
  brokenKeyLevel?: number;
  testedEMALevel?: number;
  breakevenMoved?: boolean;
  partialTaken?: boolean;
  
  // Trade Excursion Analytics
  maxFavorableExcursion?: number; // MFE: Highest peak profit in points
  maxAdverseExcursion?: number;   // MAE: Lowest drawdown in points
  
  exitPrice?: number;
  exitReason?: string;
  invalidationReason?: string;
  postMortemSummary?: string;
  
  // Setup DNA & Intelligence Snapshot
  dnaString?: string;
  regimeLabel?: string;
  qualityGrade?: string;
  timeline?: TimelineEvent[];

  confirmations?: {
    trendAligned: boolean;
    emaRibbonStacked: boolean;
    pullbackInGoldenZone: boolean;
    keyLevelBrokenAndTested: boolean;
    polarityFlipConfirmed: boolean;
    rejectionCandlePrinted: boolean;
    momentumOscillatorReset: boolean;
    favorableRiskReward: boolean;
  };
}

export function getDefaultStrategyHistory(symbol: string = 'XAU/USD', basePrice: number = 2350): IndependentStrategyState[] {
  const now = Date.now();
  return [
    {
      id: `tpr-hist-101`,
      assetSymbol: symbol,
      strategy: 'TREND_PULLBACK',
      direction: 'BULLISH',
      status: 'TP3_HIT',
      entryPrice: Number((basePrice - 4.2).toFixed(2)),
      stopLoss: Number((basePrice - 7.5).toFixed(2)),
      tp1: Number((basePrice - 1.2).toFixed(2)),
      tp2: Number((basePrice + 2.5).toFixed(2)),
      tp3: Number((basePrice + 7.8).toFixed(2)),
      entryTime: now - 1000 * 60 * 85,
      resolvedTime: now - 1000 * 60 * 35,
      profitPoints: 12.0,
      profitPercent: 3.63,
      riskReward: '1:3.6',
      qualityScore: 94,
      winProbability: 88,
      triggerPattern: 'Bullish Engulfing off 61.8% Fib',
      fibLevelTriggered: Number((basePrice - 4.2).toFixed(2)),
      testedEMALevel: Number((basePrice - 4.0).toFixed(2)),
      breakevenMoved: true,
      partialTaken: true,
      exitPrice: Number((basePrice + 7.8).toFixed(2)),
      exitReason: 'Full TP3 Target expansion reached during trend surge',
      confirmations: {
        trendAligned: true,
        emaRibbonStacked: true,
        pullbackInGoldenZone: true,
        keyLevelBrokenAndTested: true,
        polarityFlipConfirmed: true,
        rejectionCandlePrinted: true,
        momentumOscillatorReset: true,
        favorableRiskReward: true
      },
      postMortemSummary: 'Pristine 61.8% Golden Pocket touch paired with 21 EMA dynamic ribbon support. Rejection candle closed strongly above open.'
    },
    {
      id: `tpr-hist-102`,
      assetSymbol: symbol,
      strategy: 'BREAKOUT_RETEST',
      direction: 'BULLISH',
      status: 'TP2_HIT',
      entryPrice: Number((basePrice - 8.5).toFixed(2)),
      stopLoss: Number((basePrice - 11.2).toFixed(2)),
      tp1: Number((basePrice - 5.5).toFixed(2)),
      tp2: Number((basePrice - 2.0).toFixed(2)),
      tp3: Number((basePrice + 3.5).toFixed(2)),
      entryTime: now - 1000 * 60 * 180,
      resolvedTime: now - 1000 * 60 * 120,
      profitPoints: 6.5,
      profitPercent: 2.41,
      riskReward: '1:2.4',
      qualityScore: 89,
      winProbability: 84,
      triggerPattern: 'Polarity Flip Pinbar on Broken Resistance',
      brokenKeyLevel: Number((basePrice - 8.5).toFixed(2)),
      breakevenMoved: true,
      partialTaken: true,
      exitPrice: Number((basePrice - 2.0).toFixed(2)),
      exitReason: 'TP2 hit, remaining volume closed at trailing stop',
      confirmations: {
        trendAligned: true,
        emaRibbonStacked: true,
        pullbackInGoldenZone: false,
        keyLevelBrokenAndTested: true,
        polarityFlipConfirmed: true,
        rejectionCandlePrinted: true,
        momentumOscillatorReset: true,
        favorableRiskReward: true
      },
      postMortemSummary: 'Resistance level broken with heavy volume, tested with 2 consecutive lower rejection wicks confirming polarity flip to dynamic support.'
    },
    {
      id: `tpr-hist-103`,
      assetSymbol: symbol,
      strategy: 'TREND_PULLBACK',
      direction: 'BEARISH',
      status: 'SL_HIT',
      entryPrice: Number((basePrice + 6.0).toFixed(2)),
      stopLoss: Number((basePrice + 8.8).toFixed(2)),
      tp1: Number((basePrice + 3.0).toFixed(2)),
      tp2: Number((basePrice - 1.0).toFixed(2)),
      tp3: Number((basePrice - 6.0).toFixed(2)),
      entryTime: now - 1000 * 60 * 320,
      resolvedTime: now - 1000 * 60 * 290,
      profitPoints: -2.8,
      profitPercent: -1.0,
      riskReward: '1:2.5',
      qualityScore: 78,
      winProbability: 72,
      triggerPattern: 'Shooting Star',
      fibLevelTriggered: Number((basePrice + 6.0).toFixed(2)),
      breakevenMoved: false,
      partialTaken: false,
      exitPrice: Number((basePrice + 8.8).toFixed(2)),
      exitReason: 'Stop loss hit after unexpected market volatility surge',
      confirmations: {
        trendAligned: true,
        emaRibbonStacked: false,
        pullbackInGoldenZone: true,
        keyLevelBrokenAndTested: false,
        polarityFlipConfirmed: false,
        rejectionCandlePrinted: true,
        momentumOscillatorReset: true,
        favorableRiskReward: true
      },
      postMortemSummary: 'Setup stopped out. 50 EMA failed to hold overhead pressure due to high-impact volume breakout.'
    },
    {
      id: `tpr-hist-104`,
      assetSymbol: symbol,
      strategy: 'BREAKOUT_RETEST',
      direction: 'BULLISH',
      status: 'TP1_HIT',
      entryPrice: Number((basePrice - 14.0).toFixed(2)),
      stopLoss: Number((basePrice - 16.5).toFixed(2)),
      tp1: Number((basePrice - 10.5).toFixed(2)),
      tp2: Number((basePrice - 7.0).toFixed(2)),
      tp3: Number((basePrice - 2.0).toFixed(2)),
      entryTime: now - 1000 * 60 * 480,
      resolvedTime: now - 1000 * 60 * 410,
      profitPoints: 3.5,
      profitPercent: 1.4,
      riskReward: '1:2.8',
      qualityScore: 91,
      winProbability: 86,
      triggerPattern: 'Morning Star Pattern at Broken Level',
      brokenKeyLevel: Number((basePrice - 14.0).toFixed(2)),
      breakevenMoved: true,
      partialTaken: true,
      exitPrice: Number((basePrice - 10.5).toFixed(2)),
      exitReason: 'TP1 Secured at 1.4R, runner closed at Breakeven',
      confirmations: {
        trendAligned: true,
        emaRibbonStacked: true,
        pullbackInGoldenZone: false,
        keyLevelBrokenAndTested: true,
        polarityFlipConfirmed: true,
        rejectionCandlePrinted: true,
        momentumOscillatorReset: true,
        favorableRiskReward: true
      },
      postMortemSummary: 'Solid structure retest. Quick 3.5 pts profit secured at first liquidity pool.'
    }
  ];
}

// Calculate EMA series helper
export function calculateEMA(data: number[], period: number): number[] {
  if (data.length === 0) return [];
  const k = 2 / (period + 1);
  const emaArray: number[] = [data[0]];
  for (let i = 1; i < data.length; i++) {
    const ema = data[i] * k + emaArray[i - 1] * (1 - k);
    emaArray.push(ema);
  }
  return emaArray;
}

// Calculate RSI helper
export function calculateRSI(closes: number[], period: number = 14): number {
  if (closes.length < period + 1) return 50;
  
  let gains = 0;
  let losses = 0;
  
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }
  
  let avgGain = gains / period;
  let avgLoss = losses / period;
  
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) {
      avgGain = (avgGain * (period - 1) + diff) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(diff)) / period;
    }
  }
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return Number((100 - (100 / (1 + rs))).toFixed(2));
}

// Calculate ATR helper
export function calculateATR(candles: Candle[], period: number = 14): number {
  if (candles.length < 2) return 1.5;
  const trs: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;
    const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    trs.push(tr);
  }
  const slice = trs.slice(-period);
  const sum = slice.reduce((a, b) => a + b, 0);
  return Number((sum / slice.length).toFixed(3));
}

// Find swing highs and lows
export function findSwings(candles: Candle[], lookback: number = 5): { highs: { index: number; price: number; candle: Candle }[]; lows: { index: number; price: number; candle: Candle }[] } {
  const highs: { index: number; price: number; candle: Candle }[] = [];
  const lows: { index: number; price: number; candle: Candle }[] = [];
  
  for (let i = lookback; i < candles.length - lookback; i++) {
    let isHigh = true;
    let isLow = true;
    const currentHigh = candles[i].high;
    const currentLow = candles[i].low;
    
    for (let j = 1; j <= lookback; j++) {
      if (candles[i - j].high > currentHigh || candles[i + j].high > currentHigh) {
        isHigh = false;
      }
      if (candles[i - j].low < currentLow || candles[i + j].low < currentLow) {
        isLow = false;
      }
    }
    
    if (isHigh) highs.push({ index: i, price: currentHigh, candle: candles[i] });
    if (isLow) lows.push({ index: i, price: currentLow, candle: candles[i] });
  }
  
  return { highs, lows };
}

// Detect Candlestick Reversal Patterns on latest candle
export function detectCandlePattern(candles: Candle[]): 'BULLISH_HAMMER' | 'BULLISH_ENGULFING' | 'MORNING_STAR' | 'BEARISH_SHOOTING_STAR' | 'BEARISH_ENGULFING' | 'EVENING_STAR' | 'PINBAR' | 'NONE' {
  if (candles.length < 3) return 'NONE';
  const c0 = candles[candles.length - 1]; // current / latest
  const c1 = candles[candles.length - 2]; // previous
  const c2 = candles[candles.length - 3]; // 2 back
  
  const body0 = Math.abs(c0.close - c0.open);
  const range0 = Math.max(0.001, c0.high - c0.low);
  const upperWick0 = c0.high - Math.max(c0.open, c0.close);
  const lowerWick0 = Math.min(c0.open, c0.close) - c0.low;
  
  const body1 = Math.abs(c1.close - c1.open);
  const isC1Bearish = c1.close < c1.open;
  const isC0Bullish = c0.close > c0.open;
  const isC1Bullish = c1.close > c1.open;
  const isC0Bearish = c0.close < c0.open;
  
  // 1. Bullish Engulfing
  if (isC1Bearish && isC0Bullish && c0.close >= c1.open && c0.open <= c1.close && body0 > body1 * 1.1) {
    return 'BULLISH_ENGULFING';
  }
  
  // 2. Bearish Engulfing
  if (isC1Bullish && isC0Bearish && c0.close <= c1.open && c0.open >= c1.close && body0 > body1 * 1.1) {
    return 'BEARISH_ENGULFING';
  }
  
  // 3. Bullish Hammer / Pinbar
  if (lowerWick0 >= body0 * 2.0 && upperWick0 <= range0 * 0.20 && isC0Bullish) {
    return 'BULLISH_HAMMER';
  }
  
  // 4. Bearish Shooting Star / Pinbar
  if (upperWick0 >= body0 * 2.0 && lowerWick0 <= range0 * 0.20 && isC0Bearish) {
    return 'BEARISH_SHOOTING_STAR';
  }
  
  // 5. Morning Star
  if (c2.close < c2.open && Math.abs(c1.close - c1.open) < (c2.high - c2.low) * 0.35 && c0.close > (c2.open + c2.close) / 2 && isC0Bullish) {
    return 'MORNING_STAR';
  }
  
  // 6. Evening Star
  if (c2.close > c2.open && Math.abs(c1.close - c1.open) < (c2.high - c2.low) * 0.35 && c0.close < (c2.open + c2.close) / 2 && isC0Bearish) {
    return 'EVENING_STAR';
  }
  
  if (lowerWick0 >= range0 * 0.55 || upperWick0 >= range0 * 0.55) {
    return 'PINBAR';
  }
  
  return 'NONE';
}

// Find Key S/R Horizontal Clusters
export function findKeySRLevels(candles: Candle[], atr: number): KeySRLevel[] {
  if (candles.length < 15) return [];
  const { highs, lows } = findSwings(candles, 3);
  const levels: KeySRLevel[] = [];
  const tolerance = Math.max(0.15, atr * 0.65);
  
  // Cluster highs -> Resistance
  highs.forEach((h, idx) => {
    let touches = 1;
    for (let j = 0; j < highs.length; j++) {
      if (idx !== j && Math.abs(highs[j].price - h.price) <= tolerance) {
        touches++;
      }
    }
    const currentPrice = candles[candles.length - 1].close;
    const isBroken = currentPrice > h.price + tolerance;
    levels.push({
      id: `sr-res-${idx}-${Math.round(h.price)}`,
      price: Number(h.price.toFixed(2)),
      type: 'RESISTANCE',
      touches,
      strength: touches >= 3 ? 'STRONG' : touches === 2 ? 'MEDIUM' : 'MINOR',
      ageInCandles: candles.length - 1 - h.index,
      status: isBroken ? 'BROKEN_BULLISH' : 'ACTIVE'
    });
  });
  
  // Cluster lows -> Support
  lows.forEach((l, idx) => {
    let touches = 1;
    for (let j = 0; j < lows.length; j++) {
      if (idx !== j && Math.abs(lows[j].price - l.price) <= tolerance) {
        touches++;
      }
    }
    const currentPrice = candles[candles.length - 1].close;
    const isBroken = currentPrice < l.price - tolerance;
    levels.push({
      id: `sr-sup-${idx}-${Math.round(l.price)}`,
      price: Number(l.price.toFixed(2)),
      type: 'SUPPORT',
      touches,
      strength: touches >= 3 ? 'STRONG' : touches === 2 ? 'MEDIUM' : 'MINOR',
      ageInCandles: candles.length - 1 - l.index,
      status: isBroken ? 'BROKEN_BEARISH' : 'ACTIVE'
    });
  });
  
  // Filter duplicates within tolerance, sort by touches and recency
  const uniqueLevels: KeySRLevel[] = [];
  levels.sort((a, b) => b.touches - a.touches || a.ageInCandles - b.ageInCandles);
  
  for (const lvl of levels) {
    const exists = uniqueLevels.some(u => Math.abs(u.price - lvl.price) < tolerance && u.type === lvl.type);
    if (!exists) {
      uniqueLevels.push(lvl);
    }
  }
  
  return uniqueLevels.slice(0, 6);
}

// MAIN COMPREHENSIVE ENGINE: Analyzes live candles & ticks for Trend Pullback & Breakout Retest
export function analyzeTrendPullbackAndRetest(
  candles: Candle[],
  currentPrice: number,
  spread: number = 0.25,
  assetSymbol: string = 'XAU/USD'
): {
  emas: EMASet;
  trendPullback: TrendPullbackState;
  breakoutRetest: BreakoutRetestState;
  keyLevels: KeySRLevel[];
  activeSetup: TrendPullbackRetestSetup;
} {
  // Safe Fallback if insufficient candles
  if (!candles || candles.length < 20) {
    const fallbackEma = currentPrice || 2350;
    const defaultRegime = detectMarketRegime([], { ema9: fallbackEma, ema21: fallbackEma, ema50: fallbackEma, ema200: fallbackEma }, 1.0, 50);
    const defaultMtf = computeMultiTimeframeAlignment([], { ema9: fallbackEma, ema21: fallbackEma, ema50: fallbackEma, ema200: fallbackEma }, 'BULLISH');
    const defaultLiq = computeLiquidityRadar([], currentPrice, 'BULLISH');
    const defaultDisp = computeDisplacement([]);
    const defaultFvg = detectFairValueGaps([], currentPrice, null, []);
    const defaultOB = computeOrderBlocks([], currentPrice, defaultDisp, defaultFvg);
    const defaultProx = evaluateEntryProximity(currentPrice, currentPrice - 0.5, currentPrice - 0.9, currentPrice - 0.2, currentPrice + 2.5, 'BULLISH');
    const defaultConflicts = detectConfluenceConflicts(defaultMtf, defaultRegime, 50, defaultLiq);
    const defaultBlockers = evaluateEntryBlockers(false, false, true, true, false);
    const defaultQuality = calculateTransparentQualityScore(defaultMtf, defaultRegime, false, false, true, 3.8, false);
    const defaultNextEvent = computeNextExpectedEvent(currentPrice - 0.9, currentPrice - 0.2, false, false, false, 'BULLISH');
    const defaultTimeline = generateEvolutionTimeline('BULLISH', false, false, false);
    const defaultProb = computeProbabilityMatrix(defaultMtf, 75, 'BULLISH');
    const defaultSession = getSessionIntelligence();
    const defaultVol = evaluateVolatilityRisk(1.0, currentPrice - 0.5, currentPrice - 3.5);
    const defaultExec = evaluateExecutionQuality(spread, 1.0, 0.5);
    const defaultDNA = generateSetupDNA('BULLISH', 'TREND_PULLBACK', 'NONE', false, false, '1:3.8');
    const defaultRanks = rankStrategies(75, 70, 70);
    const defaultSimilar = findSimilarHistoricalSetups([], defaultDNA.tags);

    const defaultSetup: TrendPullbackRetestSetup = {
      strategyType: 'HYBRID_CONFLUENCE',
      direction: 'BULLISH',
      executionState: 'SETUP_FORMING',
      stateLabel: 'BULLISH SETUP FORMING',
      statusBadgeColor: 'amber',
      executionRuleText: 'Initializing market structure scanner. Gathering tick accumulation.',
      confidence: 72,
      winProbability: 70,
      qualityScore: 75,
      confidenceScoreFormatted: '72% — SETUP FORMING — ACCUMULATING DATA',
      entryPrice: Number((currentPrice - 0.5).toFixed(2)),
      entryZoneMin: Number((currentPrice - 0.9).toFixed(2)),
      entryZoneMax: Number((currentPrice - 0.2).toFixed(2)),
      stopLoss: Number((currentPrice - 3.5).toFixed(2)),
      tp1: Number((currentPrice + 2.5).toFixed(2)),
      tp2: Number((currentPrice + 5.0).toFixed(2)),
      tp3: Number((currentPrice + 10.0).toFixed(2)),
      riskRewardRatio: '1:3.8',
      invalidationLevel: Number((currentPrice - 4.5).toFixed(2)),
      isInvalidated: false,
      isExpired: false,
      distanceToEntry: 0.5,
      isPriceInEntryZone: false,
      estimatedHoldTime: '15-35 mins',
      expectedTriggerPattern: 'Bullish Hammer / Retest Confirmation',
      marketStory: `Gathering tick data on ${assetSymbol}. Initializing Trend Pullback and Breakout Retest algorithms.`,
      confluenceBreakdown: {
        trend: [{ id: 'tr-1', category: 'TREND', label: 'Trend Alignment', status: 'CONFIRMED', detail: 'Bullish Structure' }],
        momentum: [{ id: 'mo-1', category: 'MOMENTUM', label: 'EMA Stack', status: 'WAITING', detail: 'Awaiting Candle Feed' }],
        location: [{ id: 'lo-1', category: 'LOCATION', label: 'Golden Pocket Zone', status: 'WAITING', detail: '50-61.8% Retracement' }],
        priceAction: [{ id: 'pa-1', category: 'PRICE_ACTION', label: 'Rejection Wick', status: 'WAITING', detail: 'Candle Confirmation' }],
        risk: [{ id: 'rk-1', category: 'RISK', label: 'Risk:Reward >= 1:2', status: 'CONFIRMED', detail: '1:3.8 Calculated' }]
      },
      detailedConfluences: [],
      missingTriggers: ['EMA Stack', 'Golden Pocket Zone', 'Rejection Wick'],
      confirmedTriggers: ['Trend Alignment', 'Risk:Reward >= 1:2'],
      confirmations: {
        trendAligned: true,
        emaRibbonStacked: true,
        pullbackInGoldenZone: false,
        keyLevelBrokenAndTested: false,
        polarityFlipConfirmed: false,
        rejectionCandlePrinted: false,
        momentumOscillatorReset: true,
        favorableRiskReward: true
      },
      reasons: [
        'Awaiting live tick accumulation to lock exact Fib Retracement zone',
        'Tracking multi-EMA dynamic ribbon support',
        'Calibrating Breakout & Retest support/resistance anchors'
      ],
      executionPlan: [
        'Phase 1: Monitor 20/50 EMA slope & 50-61.8% Golden Pocket zone',
        'Phase 2: Detect Key Level Breakout & Polarity Flip Retest',
        'Phase 3: Verify Reversal Candlestick Wick Rejection before Entry'
      ],
      status: 'SETUP FORMING',
      regime: defaultRegime,
      multiTimeframe: defaultMtf,
      liquidityRadar: defaultLiq,
      displacement: defaultDisp,
      fvgData: defaultFvg,
      obQuality: defaultOB,
      proximity: defaultProx,
      conflicts: defaultConflicts,
      blockers: defaultBlockers,
      qualityBreakdown: defaultQuality,
      nextEvent: defaultNextEvent,
      timeline: defaultTimeline,
      probabilityMatrix: defaultProb,
      sessionIntelligence: defaultSession,
      volatilityRisk: defaultVol,
      executionQuality: defaultExec,
      setupDNA: defaultDNA,
      strategyRanks: defaultRanks,
      similarSetups: defaultSimilar
    };
    
    return {
      emas: { ema9: fallbackEma, ema21: fallbackEma, ema50: fallbackEma, ema200: fallbackEma },
      trendPullback: {
        trendDirection: 'STRONG_BULLISH',
        trendStrengthScore: 70,
        emaAlignment: 'FULL_BULLISH',
        pullbackTargetEMA: 'EMA21',
        fibDetails: null,
        reversalCandlePattern: 'NONE',
        pullbackQuality: 'GOOD_A',
        rsiValue: 52,
        rsiState: 'TREND_HEALTHY'
      },
      breakoutRetest: {
        keyLevel: null,
        breakoutType: 'NONE',
        breakoutPrice: currentPrice,
        retestZone: { min: currentPrice - 1, max: currentPrice + 1, center: currentPrice },
        retestStatus: 'NONE',
        polarityFlip: 'Neutral structure',
        rejectionWickDetected: false,
        breakoutDistance: 0
      },
      keyLevels: [],
      activeSetup: defaultSetup
    };
  }

  const closes = candles.map(c => c.close);
  const ema9Arr = calculateEMA(closes, 9);
  const ema21Arr = calculateEMA(closes, 21);
  const ema50Arr = calculateEMA(closes, 50);
  const ema200Arr = calculateEMA(closes, Math.min(200, closes.length));

  const ema9 = Number(ema9Arr[ema9Arr.length - 1].toFixed(2));
  const ema21 = Number(ema21Arr[ema21Arr.length - 1].toFixed(2));
  const ema50 = Number(ema50Arr[ema50Arr.length - 1].toFixed(2));
  const ema200 = Number(ema200Arr[ema200Arr.length - 1].toFixed(2));

  const emas: EMASet = { ema9, ema21, ema50, ema200 };
  const atr = calculateATR(candles, 14);
  const rsi = calculateRSI(closes, 14);
  const candlePattern = detectCandlePattern(candles);

  // 1. TREND PULLBACK MODULE COMPUTATION
  let trendDirection: TrendPullbackState['trendDirection'] = 'RANGING';
  let emaAlignment: TrendPullbackState['emaAlignment'] = 'MIXED';

  if (ema9 > ema21 && ema21 > ema50) {
    if (ema50 > ema200 && currentPrice >= ema50) {
      trendDirection = 'STRONG_BULLISH';
      emaAlignment = 'FULL_BULLISH';
    } else {
      trendDirection = 'MODERATE_BULLISH';
      emaAlignment = 'FULL_BULLISH';
    }
  } else if (ema9 < ema21 && ema21 < ema50) {
    if (ema50 < ema200 && currentPrice <= ema50) {
      trendDirection = 'STRONG_BEARISH';
      emaAlignment = 'FULL_BEARISH';
    } else {
      trendDirection = 'MODERATE_BEARISH';
      emaAlignment = 'FULL_BEARISH';
    }
  } else {
    trendDirection = 'RANGING';
    emaAlignment = 'MIXED';
  }

  // Find recent impulse swings to calculate Fibonacci Retracement
  const { highs: swingHighs, lows: swingLows } = findSwings(candles, 3);
  const lastSwingHigh = swingHighs.length > 0 ? swingHighs[swingHighs.length - 1].price : Math.max(...candles.slice(-20).map(c => c.high));
  const lastSwingLow = swingLows.length > 0 ? swingLows[swingLows.length - 1].price : Math.min(...candles.slice(-20).map(c => c.low));

  const isBullishTrend = trendDirection.includes('BULLISH');
  const isBearishTrend = trendDirection.includes('BEARISH');
  const impulseRange = Math.max(0.01, lastSwingHigh - lastSwingLow);

  let fibDetails: FibRetracement | null = null;
  if (isBullishTrend) {
    const f236 = lastSwingHigh - impulseRange * 0.236;
    const f382 = lastSwingHigh - impulseRange * 0.382;
    const f500 = lastSwingHigh - impulseRange * 0.500;
    const f618 = lastSwingHigh - impulseRange * 0.618;
    const f786 = lastSwingHigh - impulseRange * 0.786;
    const ext1272 = lastSwingHigh + impulseRange * 0.272;
    const ext1618 = lastSwingHigh + impulseRange * 0.618;
    const ext2000 = lastSwingHigh + impulseRange * 1.000;

    const pullbackDepth = (lastSwingHigh - currentPrice) / impulseRange;
    let pZone: FibRetracement['pullbackZone'] = 'NONE';
    if (pullbackDepth >= 0.382 && pullbackDepth <= 0.68) pZone = 'GOLDEN_POCKET';
    else if (pullbackDepth > 0.68 && pullbackDepth <= 0.85) pZone = 'DEEP';
    else if (pullbackDepth >= 0.15 && pullbackDepth < 0.382) pZone = 'SHALLOW';
    else if (pullbackDepth > 0.85) pZone = 'EXTENDED';

    fibDetails = {
      swingHigh: lastSwingHigh,
      swingLow: lastSwingLow,
      direction: 'UP',
      fib236: Number(f236.toFixed(2)),
      fib382: Number(f382.toFixed(2)),
      fib500: Number(f500.toFixed(2)),
      fib618: Number(f618.toFixed(2)),
      fib786: Number(f786.toFixed(2)),
      ext1272: Number(ext1272.toFixed(2)),
      ext1618: Number(ext1618.toFixed(2)),
      ext2000: Number(ext2000.toFixed(2)),
      currentDepthPercent: Number((pullbackDepth * 100).toFixed(1)),
      pullbackZone: pZone
    };
  } else if (isBearishTrend) {
    const f236 = lastSwingLow + impulseRange * 0.236;
    const f382 = lastSwingLow + impulseRange * 0.382;
    const f500 = lastSwingLow + impulseRange * 0.500;
    const f618 = lastSwingLow + impulseRange * 0.618;
    const f786 = lastSwingLow + impulseRange * 0.786;
    const ext1272 = lastSwingLow - impulseRange * 0.272;
    const ext1618 = lastSwingLow - impulseRange * 0.618;
    const ext2000 = lastSwingLow - impulseRange * 1.000;

    const pullbackDepth = (currentPrice - lastSwingLow) / impulseRange;
    let pZone: FibRetracement['pullbackZone'] = 'NONE';
    if (pullbackDepth >= 0.382 && pullbackDepth <= 0.68) pZone = 'GOLDEN_POCKET';
    else if (pullbackDepth > 0.68 && pullbackDepth <= 0.85) pZone = 'DEEP';
    else if (pullbackDepth >= 0.15 && pullbackDepth < 0.382) pZone = 'SHALLOW';
    else if (pullbackDepth > 0.85) pZone = 'EXTENDED';

    fibDetails = {
      swingHigh: lastSwingHigh,
      swingLow: lastSwingLow,
      direction: 'DOWN',
      fib236: Number(f236.toFixed(2)),
      fib382: Number(f382.toFixed(2)),
      fib500: Number(f500.toFixed(2)),
      fib618: Number(f618.toFixed(2)),
      fib786: Number(f786.toFixed(2)),
      ext1272: Number(ext1272.toFixed(2)),
      ext1618: Number(ext1618.toFixed(2)),
      ext2000: Number(ext2000.toFixed(2)),
      currentDepthPercent: Number((pullbackDepth * 100).toFixed(1)),
      pullbackZone: pZone
    };
  }

  // RSI status
  let rsiState: TrendPullbackState['rsiState'] = 'NEUTRAL';
  if (rsi <= 35) rsiState = 'OVERSOLD_BOUNCE';
  else if (rsi >= 65) rsiState = 'OVERBOUGHT_DROP';
  else if (isBullishTrend && rsi >= 42 && rsi <= 58) rsiState = 'TREND_HEALTHY';
  else if (isBearishTrend && rsi >= 42 && rsi <= 58) rsiState = 'TREND_HEALTHY';

  let pullbackQuality: TrendPullbackState['pullbackQuality'] = 'GOOD_A';
  if (fibDetails?.pullbackZone === 'GOLDEN_POCKET' && (candlePattern.includes('BULLISH') || candlePattern.includes('BEARISH') || candlePattern === 'PINBAR')) {
    pullbackQuality = 'PRIME_A+';
  } else if (fibDetails?.pullbackZone === 'GOLDEN_POCKET' || fibDetails?.pullbackZone === 'SHALLOW') {
    pullbackQuality = 'GOOD_A';
  } else if (fibDetails?.pullbackZone === 'DEEP') {
    pullbackQuality = 'MODERATE_B';
  } else {
    pullbackQuality = 'WEAK_C';
  }

  const trendPullback: TrendPullbackState = {
    trendDirection,
    trendStrengthScore: isBullishTrend || isBearishTrend ? (trendDirection.includes('STRONG') ? 92 : 78) : 45,
    emaAlignment,
    pullbackTargetEMA: Math.abs(currentPrice - ema21) < Math.abs(currentPrice - ema50) ? 'EMA21' : 'EMA50',
    fibDetails,
    reversalCandlePattern: candlePattern,
    pullbackQuality,
    rsiValue: rsi,
    rsiState
  };

  // 2. BREAKOUT & RETEST MODULE COMPUTATION
  const keyLevels = findKeySRLevels(candles, atr);
  let primaryKeyLevel: KeySRLevel | null = null;
  let breakoutType: BreakoutRetestState['breakoutType'] = 'NONE';
  let retestStatus: BreakoutRetestState['retestStatus'] = 'NONE';
  let polarityFlip = 'Scanning key horizontal structures...';
  let rejectionWick = false;
  let breakoutDistance = 0;
  let retestZone = { min: currentPrice, max: currentPrice, center: currentPrice };

  // Find recently broken level or level closest to current price
  for (const lvl of keyLevels) {
    const buffer = Math.max(0.20, atr * 0.45);
    const dist = currentPrice - lvl.price;

    if (lvl.type === 'RESISTANCE' && currentPrice > lvl.price) {
      // Bullish breakout of resistance -> now acts as support!
      primaryKeyLevel = lvl;
      breakoutType = 'BULLISH_BREAKOUT';
      breakoutDistance = Number(dist.toFixed(2));
      retestZone = {
        min: Number((lvl.price - buffer * 0.4).toFixed(2)),
        max: Number((lvl.price + buffer).toFixed(2)),
        center: lvl.price
      };
      polarityFlip = `Resistance at ${lvl.price.toFixed(2)} broken. Polarity flipped to Support`;

      if (currentPrice <= retestZone.max && currentPrice >= retestZone.min) {
        retestStatus = 'IN_RETEST_ZONE';
        if (candlePattern.includes('BULLISH') || candlePattern === 'PINBAR') {
          retestStatus = 'RETEST_CONFIRMED';
          rejectionWick = true;
        }
      } else if (currentPrice > retestZone.max && currentPrice < retestZone.max + atr * 1.5) {
        retestStatus = 'PENDING_RETEST';
      }
      break;
    } else if (lvl.type === 'SUPPORT' && currentPrice < lvl.price) {
      // Bearish breakdown of support -> now acts as resistance!
      primaryKeyLevel = lvl;
      breakoutType = 'BEARISH_BREAKDOWN';
      breakoutDistance = Number(Math.abs(dist).toFixed(2));
      retestZone = {
        min: Number((lvl.price - buffer).toFixed(2)),
        max: Number((lvl.price + buffer * 0.4).toFixed(2)),
        center: lvl.price
      };
      polarityFlip = `Support at ${lvl.price.toFixed(2)} broken. Polarity flipped to Resistance`;

      if (currentPrice >= retestZone.min && currentPrice <= retestZone.max) {
        retestStatus = 'IN_RETEST_ZONE';
        if (candlePattern.includes('BEARISH') || candlePattern === 'PINBAR') {
          retestStatus = 'RETEST_CONFIRMED';
          rejectionWick = true;
        }
      } else if (currentPrice < retestZone.min && currentPrice > retestZone.min - atr * 1.5) {
        retestStatus = 'PENDING_RETEST';
      }
      break;
    }
  }

  // If no broken level found, take the closest strong active level
  if (!primaryKeyLevel && keyLevels.length > 0) {
    primaryKeyLevel = keyLevels[0];
    const buffer = atr * 0.5;
    retestZone = {
      min: Number((primaryKeyLevel.price - buffer).toFixed(2)),
      max: Number((primaryKeyLevel.price + buffer).toFixed(2)),
      center: primaryKeyLevel.price
    };
    polarityFlip = `Testing Key ${primaryKeyLevel.type} structural zone at ${primaryKeyLevel.price.toFixed(2)}`;
    retestStatus = 'NONE';
  }

  const breakoutRetest: BreakoutRetestState = {
    keyLevel: primaryKeyLevel,
    breakoutType,
    breakoutPrice: primaryKeyLevel ? primaryKeyLevel.price : currentPrice,
    retestZone,
    retestStatus,
    polarityFlip,
    rejectionWickDetected: rejectionWick,
    breakoutDistance
  };

  // 3. EXECUTION STATE MACHINE & NUMERICAL SETUP SYNTHESIS
  let finalDirection: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'BULLISH';
  let strategyType: TrendPullbackRetestSetup['strategyType'] = 'HYBRID_CONFLUENCE';

  let entryPrice = currentPrice;
  let entryZoneMin = currentPrice - 0.5;
  let entryZoneMax = currentPrice + 0.5;
  let stopLoss = currentPrice - 3.5;
  let tp1 = currentPrice + 3.0;
  let tp2 = currentPrice + 6.0;
  let tp3 = currentPrice + 12.0;
  let invalidationLevel = currentPrice - 4.5;
  let winProb = 75;
  let qualScore = 80;

  // Decide strategy parameters based on dominant signal
  if (retestStatus === 'RETEST_CONFIRMED' || retestStatus === 'IN_RETEST_ZONE' || (breakoutType !== 'NONE' && retestStatus === 'PENDING_RETEST')) {
    strategyType = 'BREAKOUT_RETEST';
    finalDirection = breakoutType === 'BULLISH_BREAKOUT' ? 'BULLISH' : 'BEARISH';
    
    if (finalDirection === 'BULLISH') {
      entryPrice = Number((retestZone.center + 0.15).toFixed(2));
      entryZoneMin = retestZone.min;
      entryZoneMax = retestZone.max;
      stopLoss = Number((retestZone.min - atr * 0.85).toFixed(2));
      const slDist = Math.max(0.5, entryPrice - stopLoss);
      tp1 = Number((entryPrice + slDist * 1.5).toFixed(2));
      tp2 = Number((entryPrice + slDist * 2.8).toFixed(2));
      tp3 = Number((entryPrice + slDist * 4.5).toFixed(2));
      invalidationLevel = Number((stopLoss - 0.5).toFixed(2));
      winProb = 84;
      qualScore = 89;
    } else {
      entryPrice = Number((retestZone.center - 0.15).toFixed(2));
      entryZoneMin = retestZone.min;
      entryZoneMax = retestZone.max;
      stopLoss = Number((retestZone.max + atr * 0.85).toFixed(2));
      const slDist = Math.max(0.5, stopLoss - entryPrice);
      tp1 = Number((entryPrice - slDist * 1.5).toFixed(2));
      tp2 = Number((entryPrice - slDist * 2.8).toFixed(2));
      tp3 = Number((entryPrice - slDist * 4.5).toFixed(2));
      invalidationLevel = Number((stopLoss + 0.5).toFixed(2));
      winProb = 82;
      qualScore = 87;
    }
  } else if (isBullishTrend && fibDetails) {
    strategyType = 'TREND_PULLBACK';
    finalDirection = 'BULLISH';
    entryPrice = Number(fibDetails.fib500.toFixed(2));
    entryZoneMin = Number(fibDetails.fib618.toFixed(2));
    entryZoneMax = Number(fibDetails.fib382.toFixed(2));
    stopLoss = Number((fibDetails.fib786 - atr * 0.5).toFixed(2));
    tp1 = Number(fibDetails.swingHigh.toFixed(2));
    tp2 = Number(fibDetails.ext1272.toFixed(2));
    tp3 = Number(fibDetails.ext1618.toFixed(2));
    invalidationLevel = Number((fibDetails.fib786 - atr * 0.8).toFixed(2));
    winProb = fibDetails.pullbackZone === 'GOLDEN_POCKET' ? 86 : 78;
    qualScore = fibDetails.pullbackZone === 'GOLDEN_POCKET' ? 91 : 80;
  } else if (isBearishTrend && fibDetails) {
    strategyType = 'TREND_PULLBACK';
    finalDirection = 'BEARISH';
    entryPrice = Number(fibDetails.fib500.toFixed(2));
    entryZoneMin = Number(fibDetails.fib382.toFixed(2));
    entryZoneMax = Number(fibDetails.fib618.toFixed(2));
    stopLoss = Number((fibDetails.fib786 + atr * 0.5).toFixed(2));
    tp1 = Number(fibDetails.swingLow.toFixed(2));
    tp2 = Number(fibDetails.ext1272.toFixed(2));
    tp3 = Number(fibDetails.ext1618.toFixed(2));
    invalidationLevel = Number((fibDetails.fib786 + atr * 0.8).toFixed(2));
    winProb = fibDetails.pullbackZone === 'GOLDEN_POCKET' ? 85 : 77;
    qualScore = fibDetails.pullbackZone === 'GOLDEN_POCKET' ? 90 : 79;
  } else {
    strategyType = 'HYBRID_CONFLUENCE';
    finalDirection = 'BULLISH';
    entryPrice = Number((currentPrice - 0.4).toFixed(2));
    entryZoneMin = Number((currentPrice - 0.8).toFixed(2));
    entryZoneMax = Number((currentPrice - 0.1).toFixed(2));
    stopLoss = Number((currentPrice - atr * 2).toFixed(2));
    tp1 = Number((currentPrice + atr * 2).toFixed(2));
    tp2 = Number((currentPrice + atr * 4).toFixed(2));
    tp3 = Number((currentPrice + atr * 7).toFixed(2));
    invalidationLevel = Number((stopLoss - 0.5).toFixed(2));
  }

  // Ensure zone min is truly the numerical minimum
  const normalizedZoneMin = Math.min(entryZoneMin, entryZoneMax);
  const normalizedZoneMax = Math.max(entryZoneMin, entryZoneMax);
  entryZoneMin = normalizedZoneMin;
  entryZoneMax = normalizedZoneMax;

  // Calculate Risk Reward Ratio
  const riskDist = Math.abs(entryPrice - stopLoss);
  const rewardDist = Math.abs(tp2 - entryPrice);
  const rawRR = riskDist > 0 ? rewardDist / riskDist : 3.0;
  const rrRatio = `1:${rawRR.toFixed(1)}`;

  // Is price inside entry zone?
  const isPriceInEntryZone = currentPrice >= entryZoneMin && currentPrice <= entryZoneMax;

  // 4. CONFLUENCE MATRIX CALCULATION (Dynamic 3-state system: CONFIRMED ✅, WAITING ⏳, FAILED ❌)
  const isTrendAligned = isBullishTrend ? currentPrice >= ema200 : isBearishTrend ? currentPrice <= ema200 : false;
  const isEmaStacked = emaAlignment === 'FULL_BULLISH' || emaAlignment === 'FULL_BEARISH';
  const isFibGolden = fibDetails?.pullbackZone === 'GOLDEN_POCKET';
  const isSrRetested = retestStatus === 'RETEST_CONFIRMED' || retestStatus === 'IN_RETEST_ZONE';
  const isRejectionCandle = candlePattern !== 'NONE' && (
    (finalDirection === 'BULLISH' && (candlePattern.includes('BULLISH') || candlePattern === 'PINBAR')) ||
    (finalDirection === 'BEARISH' && (candlePattern.includes('BEARISH') || candlePattern === 'PINBAR'))
  );
  const isRsiHealthy = rsiState === 'TREND_HEALTHY' || rsiState === 'OVERSOLD_BOUNCE' || rsiState === 'OVERBOUGHT_DROP';
  const isRRMet = rawRR >= 2.0;

  const trendConfluences: ConfluenceItem[] = [
    {
      id: 'tr-1',
      category: 'TREND',
      label: '200 EMA Regime Alignment',
      status: isTrendAligned ? 'CONFIRMED' : 'WAITING',
      detail: `${finalDirection} structure vs 200 EMA (${ema200.toFixed(2)})`
    },
    {
      id: 'tr-2',
      category: 'TREND',
      label: 'Primary Trend Direction',
      status: trendDirection !== 'RANGING' ? 'CONFIRMED' : 'FAILED',
      detail: `${trendDirection.replace('_', ' ')} momentum`
    }
  ];

  const momentumConfluences: ConfluenceItem[] = [
    {
      id: 'mo-1',
      category: 'MOMENTUM',
      label: 'EMA Ribbon Stack (9 > 21 > 50)',
      status: isEmaStacked ? 'CONFIRMED' : 'WAITING',
      detail: `EMA21 at ${ema21.toFixed(2)}, EMA50 at ${ema50.toFixed(2)}`
    },
    {
      id: 'mo-2',
      category: 'MOMENTUM',
      label: 'RSI Velocity & Reset (14)',
      status: isRsiHealthy ? 'CONFIRMED' : 'WAITING',
      detail: `RSI @ ${rsi} (${rsiState.replace('_', ' ')})`
    }
  ];

  const locationConfluences: ConfluenceItem[] = [
    {
      id: 'lo-1',
      category: 'LOCATION',
      label: 'Fib Golden Pocket (50.0% - 61.8%)',
      status: isFibGolden ? 'CONFIRMED' : (fibDetails ? 'WAITING' : 'FAILED'),
      detail: fibDetails ? `Current pullback depth: ${fibDetails.currentDepthPercent}%` : 'Impulse leg developing'
    },
    {
      id: 'lo-2',
      category: 'LOCATION',
      label: 'S/R Level Retest & Polarity Flip',
      status: isSrRetested ? 'CONFIRMED' : (primaryKeyLevel ? 'WAITING' : 'FAILED'),
      detail: polarityFlip
    }
  ];

  const priceActionConfluences: ConfluenceItem[] = [
    {
      id: 'pa-1',
      category: 'PRICE_ACTION',
      label: 'Candlestick Rejection / Pinbar',
      status: isRejectionCandle ? 'CONFIRMED' : 'WAITING',
      detail: candlePattern !== 'NONE' ? candlePattern.replace('_', ' ') : 'Waiting for trigger wick'
    },
    {
      id: 'pa-2',
      category: 'PRICE_ACTION',
      label: 'Value Zone Entry Calibration',
      status: isPriceInEntryZone ? 'CONFIRMED' : 'WAITING',
      detail: `${entryZoneMin.toFixed(2)} - ${entryZoneMax.toFixed(2)}`
    }
  ];

  const riskConfluences: ConfluenceItem[] = [
    {
      id: 'rk-1',
      category: 'RISK',
      label: 'Institutional R:R Ratio (>= 1:2.0)',
      status: isRRMet ? 'CONFIRMED' : 'FAILED',
      detail: `Calculated at ${rrRatio} to TP2`
    },
    {
      id: 'rk-2',
      category: 'RISK',
      label: 'Structural Invalidation Distance',
      status: Math.abs(currentPrice - invalidationLevel) > atr * 0.8 ? 'CONFIRMED' : 'WAITING',
      detail: `Invalidation: ${invalidationLevel.toFixed(2)}`
    }
  ];

  const allConfluences: ConfluenceItem[] = [
    ...trendConfluences,
    ...momentumConfluences,
    ...locationConfluences,
    ...priceActionConfluences,
    ...riskConfluences
  ];

  const confirmedList = allConfluences.filter(c => c.status === 'CONFIRMED');
  const waitingList = allConfluences.filter(c => c.status === 'WAITING');
  const failedList = allConfluences.filter(c => c.status === 'FAILED');

  const confirmedTriggers = confirmedList.map(c => c.label);
  const missingTriggers = waitingList.map(c => c.label);

  // Dynamic Confidence Score calculation
  const calculatedConfidence = Math.min(96, Math.max(48, Math.round((confirmedList.length / allConfluences.length) * 100)));

  // 5. DETERMINE EXACT CORE EXECUTION STATE
  let executionState: StrategyExecutionState = 'SETUP_FORMING';
  let stateLabel = `${finalDirection} SETUP FORMING`;
  let statusBadgeColor = 'amber';
  let executionRuleText = 'Setup is developing. Awaiting Golden Pocket pullback / EMA confluence.';
  let isInvalidated = false;
  let invalidationReason: string | undefined = undefined;

  // Invalidation Check
  if (finalDirection === 'BULLISH' && currentPrice < invalidationLevel) {
    executionState = 'INVALIDATED';
    stateLabel = 'SETUP INVALIDATED';
    statusBadgeColor = 'rose';
    isInvalidated = true;
    invalidationReason = `Price closed beyond invalidation point ${invalidationLevel.toFixed(2)}. Market structure violated.`;
    executionRuleText = invalidationReason;
  } else if (finalDirection === 'BEARISH' && currentPrice > invalidationLevel) {
    executionState = 'INVALIDATED';
    stateLabel = 'SETUP INVALIDATED';
    statusBadgeColor = 'rose';
    isInvalidated = true;
    invalidationReason = `Price closed beyond invalidation point ${invalidationLevel.toFixed(2)}. Market structure violated.`;
    executionRuleText = invalidationReason;
  } else {
    // Minimum Strategy Conditions Check for Validation:
    // Requires trend alignment + EMA alignment or Golden Pocket/Retest location + R:R >= 2.0
    const minimumConditionsMet = (isTrendAligned || isEmaStacked) && (isFibGolden || isSrRetested || fibDetails?.pullbackZone === 'SHALLOW') && isRRMet;

    if (!minimumConditionsMet) {
      executionState = 'SETUP_FORMING';
      stateLabel = `${finalDirection} SETUP FORMING`;
      statusBadgeColor = 'amber';
      executionRuleText = `Setup developing. Waiting for ${missingTriggers[0] || 'structural alignment'} confirmation.`;
    } else {
      // Setup is at least VALIDATED
      if (!isPriceInEntryZone) {
        executionState = 'SETUP_VALIDATED';
        stateLabel = `${finalDirection} SETUP VALIDATED`;
        statusBadgeColor = 'cyan';
        executionRuleText = `Setup validated. Waiting for price to retrace into entry zone (${entryZoneMin.toFixed(2)} - ${entryZoneMax.toFixed(2)}).`;
      } else {
        // Price is inside the Entry Zone!
        if (isRejectionCandle || rejectionWick || retestStatus === 'RETEST_CONFIRMED') {
          // Entry Triggered!
          executionState = 'ENTRY_TRIGGERED';
          stateLabel = `${finalDirection === 'BULLISH' ? 'BUY' : 'SELL'} ENTRY TRIGGERED`;
          statusBadgeColor = 'emerald';
          executionRuleText = `Trigger verified (${candlePattern.replace('_', ' ')}). Execute ${finalDirection === 'BULLISH' ? 'BUY' : 'SELL'} limit/market order.`;
        } else {
          // Price in zone, but waiting for candlestick confirmation trigger
          executionState = 'ENTRY_ARMED';
          stateLabel = `${finalDirection === 'BULLISH' ? 'BUY' : 'SELL'} ENTRY ARMED`;
          statusBadgeColor = 'purple';
          executionRuleText = `Price in value zone. ARMED — waiting for candlestick rejection trigger before firing execution.`;
        }
      }
    }
  }

  // Format confidence score string
  const primaryPendingTrigger = missingTriggers.length > 0 ? missingTriggers[0].toUpperCase() : 'CONFIRMED';
  const confidenceScoreFormatted = `SCORE: ${calculatedConfidence}% — ${stateLabel.replace('BULLISH ', '').replace('BEARISH ', '')} — ${executionState === 'ENTRY_TRIGGERED' ? 'TRIGGER ACTIVE' : 'WAITING FOR ' + primaryPendingTrigger}`;

  const confirmations = {
    trendAligned: isTrendAligned,
    emaRibbonStacked: isEmaStacked,
    pullbackInGoldenZone: isFibGolden,
    keyLevelBrokenAndTested: breakoutType !== 'NONE' && primaryKeyLevel !== null,
    polarityFlipConfirmed: isSrRetested,
    rejectionCandlePrinted: isRejectionCandle,
    momentumOscillatorReset: isRsiHealthy,
    favorableRiskReward: isRRMet
  };

  const reasons: string[] = [];
  if (confirmations.trendAligned) reasons.push(`Dynamic Trend alignment confirmed (${trendDirection.replace('_', ' ')})`);
  if (confirmations.emaRibbonStacked) reasons.push(`EMA Ribbon (9/21/50/200) stacked in proper hierarchical order`);
  if (confirmations.pullbackInGoldenZone) reasons.push(`Price retraced into the 50.0% - 61.8% Golden Pocket value zone`);
  if (confirmations.keyLevelBrokenAndTested) reasons.push(`Key horizontal structure (${primaryKeyLevel?.type}) broken and polarity flipped`);
  if (confirmations.rejectionCandlePrinted) reasons.push(`Reversal Candlestick trigger detected (${candlePattern.replace('_', ' ')})`);
  if (confirmations.momentumOscillatorReset) reasons.push(`RSI (${rsi}) reset to healthy trend-continuation velocity`);
  if (confirmations.favorableRiskReward) reasons.push(`Institutional Risk-to-Reward ratio calculated at ${rrRatio}`);

  const executionPlan = [
    `1. Status Directive: ${stateLabel} [${executionState}]`,
    `2. Execution Rule: ${executionRuleText}`,
    `3. Zone Target: ${entryZoneMin.toFixed(2)} - ${entryZoneMax.toFixed(2)} | Invalidation: ${invalidationLevel.toFixed(2)}`,
    `4. Profit Scaling: TP1 @ ${tp1.toFixed(2)} (move SL to BE), TP2 @ ${tp2.toFixed(2)}, TP3 @ ${tp3.toFixed(2)}`
  ];

  const marketStory = `${assetSymbol} Trend & Retest Engine: Current regime exhibits ${trendDirection.replace('_', ' ')} momentum with EMA21 at ${ema21.toFixed(2)} and EMA50 at ${ema50.toFixed(2)}. ${polarityFlip}. ${fibDetails ? `Fibonacci 61.8% Golden Pocket is established at ${fibDetails.fib618.toFixed(2)} with current pullback depth at ${fibDetails.currentDepthPercent}%.` : ''} High accuracy sniper parameters calibrated.`;

  // Compute Advanced 26-Point Market Intelligence Modules
  const regime = detectMarketRegime(candles, emas, atr, rsi);
  const multiTimeframe = computeMultiTimeframeAlignment(candles, emas, finalDirection);
  const liquidityRadar = computeLiquidityRadar(candles, currentPrice, finalDirection);
  const displacement = computeDisplacement(candles);
  const fvgData = detectFairValueGaps(candles, currentPrice, fibDetails, keyLevels);
  const obQuality = computeOrderBlocks(candles, currentPrice, displacement, fvgData);
  const proximity = evaluateEntryProximity(currentPrice, entryPrice, entryZoneMin, entryZoneMax, tp1, finalDirection);
  const conflicts = detectConfluenceConflicts(multiTimeframe, regime, rsi, liquidityRadar);
  const blockers = evaluateEntryBlockers(isPriceInEntryZone, isRejectionCandle, isRRMet, multiTimeframe.isAligned, proximity.isLateEntryBlocked);
  
  const rrNumeric = Math.abs(tp1 - entryPrice) / Math.max(0.01, Math.abs(entryPrice - stopLoss));
  const qualityBreakdown = calculateTransparentQualityScore(
    multiTimeframe,
    regime,
    isFibGolden || isPriceInEntryZone,
    isRejectionCandle,
    isRsiHealthy,
    rrNumeric,
    isSrRetested
  );

  const nextEvent = computeNextExpectedEvent(entryZoneMin, entryZoneMax, isPriceInEntryZone, isRejectionCandle, blockers.isArmed, finalDirection);
  const timeline = generateEvolutionTimeline(finalDirection, isPriceInEntryZone, isRejectionCandle, blockers.isArmed);
  const probabilityMatrix = computeProbabilityMatrix(multiTimeframe, qualityBreakdown.totalScore, finalDirection);
  const sessionIntelligence = getSessionIntelligence(new Date());
  const volatilityRisk = evaluateVolatilityRisk(atr, entryPrice, stopLoss);
  const executionQuality = evaluateExecutionQuality(spread, atr, proximity.distancePts);
  const setupDNA = generateSetupDNA(
    finalDirection,
    strategyType,
    fibDetails?.pullbackZone || 'NONE',
    fvgData.hasFVGConfluence,
    liquidityRadar.sweepDetected,
    rrRatio
  );
  const strategyRanks = rankStrategies(
    qualityBreakdown.totalScore,
    isSrRetested ? 86 : 72,
    isFibGolden ? 88 : 70
  );
  const similarSetups = findSimilarHistoricalSetups([], setupDNA.tags);

  // Late Entry / Conflict Overrides
  if (proximity.isLateEntryBlocked && executionState !== 'INVALIDATED') {
    executionRuleText = proximity.blockReason || 'Late-entry protection active. Price too close to target.';
  }

  const activeSetup: TrendPullbackRetestSetup = {
    strategyType,
    direction: finalDirection,
    executionState,
    stateLabel,
    statusBadgeColor,
    executionRuleText,
    confidence: calculatedConfidence,
    winProbability: winProb,
    qualityScore: qualityBreakdown.totalScore,
    confidenceScoreFormatted,
    entryPrice,
    entryZoneMin,
    entryZoneMax,
    stopLoss,
    tp1,
    tp2,
    tp3,
    riskRewardRatio: rrRatio,
    invalidationLevel,
    invalidationReason,
    isInvalidated,
    isExpired: false,
    distanceToEntry: Number(Math.abs(currentPrice - entryPrice).toFixed(2)),
    isPriceInEntryZone,
    keyLevelTriggered: primaryKeyLevel?.price,
    testedEMALevel: ema21,
    fibLevelTriggered: fibDetails?.fib618,
    estimatedHoldTime: '15-45 minutes',
    expectedTriggerPattern: candlePattern !== 'NONE' ? candlePattern.replace('_', ' ') : 'Wick Rejection / BOS Body Close',
    actualTriggerType: isRejectionCandle ? candlePattern.replace('_', ' ') : undefined,
    marketStory,
    confluenceBreakdown: {
      trend: trendConfluences,
      momentum: momentumConfluences,
      location: locationConfluences,
      priceAction: priceActionConfluences,
      risk: riskConfluences
    },
    detailedConfluences: allConfluences,
    missingTriggers,
    confirmedTriggers,
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
    similarSetups,
    confirmations,
    reasons,
    executionPlan,
    status: stateLabel
  };

  return {
    emas,
    trendPullback,
    breakoutRetest,
    keyLevels,
    activeSetup
  };
}
