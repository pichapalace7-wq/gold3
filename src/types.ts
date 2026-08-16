export interface Candle {
  time: number; // UTC timestamp in milliseconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OrderBlock {
  id: string;
  type: 'BULLISH' | 'BEARISH';
  price: number;
  high: number;
  low: number;
  isMitigated: boolean;
  time: number;
  stars: number; // 1 to 5 stars ranking
  freshness: string; // e.g. "FRESH", "MITIGATED", "TESTED"
  reactionCount: number;
  probability: number;
  strength: 'STRONG' | 'MEDIUM' | 'WEAK';
}

export interface FairValueGap {
  id: string;
  type: 'BULLISH' | 'BEARISH';
  top: number;
  bottom: number;
  isFilled: boolean;
  time: number;
  stars: number;
  freshness: string;
  reactionCount: number;
  probability: number;
  strength: 'STRONG' | 'MEDIUM' | 'WEAK';
}

export interface LiquidityPool {
  id: string;
  type: 'BSL' | 'SSL'; // Buy Side or Sell Side Liquidity
  price: number;
  strength: number; // Number of touches or volume
  isSwept: boolean;
  description: string;
  stars: number;
  freshness: string;
}

export interface MarketMetrics {
  currentPrice: number;
  bid: number;
  ask: number;
  spread: number;
  trend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  volatility: 'LOW' | 'MEDIUM' | 'HIGH';
  atr: number;
  session: string;
  marketPhase: string;
  connectionStatus: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING';
  lastTickTime: number;
  orderBlocks: OrderBlock[];
  fairValueGaps: FairValueGap[];
  liquidityPools: LiquidityPool[];
  support: number;
  resistance: number;
  confirmationChecklist: {
    weeklyTrend: boolean;
    dailyBias: boolean;
    h4Direction: boolean;
    h1Bias: boolean;
    m15Structure: boolean;
    m5Setup: boolean;
    liquiditySweep: boolean;
    orderBlock: boolean;
    fairValueGap: boolean;
    bos: boolean;
    choch: boolean;
    momentum: boolean;
    confirmationCandle: boolean;
    entryReady: boolean;
    m1Bos: boolean;
    m1Choch: boolean;
  };
}

export interface SniperSetup {
  direction: 'BULLISH' | 'BEARISH' | 'NONE';
  optimalEntry?: number;
  entryWindow?: string;
  distanceToEntry?: string;
  stopLoss?: number;
  tp1?: number;
  tp2?: number;
  tp3?: number;
  riskRewardRatio?: string;
  confidence?: number;
  probability?: number;
  qualityScore?: number;
  expectedTrigger?: string;
  holdingTime?: string;
  invalidationLevel?: number;
  qualityExplanation?: string;
  reasons: string[]; // List of reasons why each level exists
}

export interface AIThinking {
  currentBias: string;
  institutionalOpinion: string;
  marketCondition: string;
  currentRisk: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
  whatAISees: string;
  whatAIIsWaitingFor: string;
  expectedNextMove: string;
  executionDecision: 'BUY' | 'SELL' | 'WAIT' | 'CANCEL' | 'REASSESS';
}

export interface ConfluenceItem {
  name: string;
  score: number; // percentage 0-100
  explanation: string;
}

export interface ConfluenceAnalysis {
  trendAlignment: ConfluenceItem;
  liquidityQuality: ConfluenceItem;
  orderBlockQuality: ConfluenceItem;
  fairValueGapQuality: ConfluenceItem;
  priceAction: ConfluenceItem;
  momentum: ConfluenceItem;
  volatility: ConfluenceItem;
  riskReward: ConfluenceItem;
  institutionalStructure: ConfluenceItem;
  overallConfluence: number;
}

export interface MarketHealth {
  trend: 'STRONG' | 'MODERATE' | 'WEAK';
  momentum: 'INCREASING' | 'STABLE' | 'DECREASING';
  liquidity: 'EXCELLENT' | 'GOOD' | 'POOR';
  atr: string;
  volatility: 'IDEAL' | 'HIGH' | 'LOW';
  spread: 'EXCELLENT' | 'HIGH_SPREAD';
  session: string;
  scalpingConditions: string;
  scalpingRating: number; // out of 10
}

export interface ConfidenceTimelineItem {
  timeAgo: string; // e.g. "15 minutes ago", "10 minutes ago", "Now"
  confidence: number;
  trend: 'INCREASING' | 'DECREASING' | 'STABLE';
  reason: string;
}

export interface IntelligentStatus {
  status: 'READY TO EXECUTE' | 'ENTRY APPROACHING' | 'WAITING FOR CONFIRMATION' | 'NO VALID SETUP' | 'SETUP INVALIDATED' | 'HIGH RISK CONDITIONS';
  reason: string;
  expectedTrigger: string;
  estimatedTimeUntilTrigger: string;
  missingConfirmation: string;
  probabilityIncreaseRequired: string;
  currentProbability: number;
  maxPossibleProbability: number;
}

export interface RejectionReason {
  condition: string;
  isFailed: boolean;
  explanation: string;
}

export interface AnalysisResult {
  marketStory: string;
  aiCoach: string;
  sniperStatus: 'READY TO EXECUTE' | 'ENTRY APPROACHING' | 'WAITING FOR CONFIRMATION' | 'NO VALID SETUP' | 'SETUP INVALIDATED' | 'HIGH RISK CONDITIONS';
  intelligentStatus: IntelligentStatus;
  setupDetails: SniperSetup;
  aiThinking: AIThinking;
  confluenceAnalysis: ConfluenceAnalysis;
  marketHealth: MarketHealth;
  confidenceEvolution: ConfidenceTimelineItem[];
  rejectionReasons: RejectionReason[];
  aiDecision: {
    decision: 'BUY' | 'SELL' | 'WAIT' | 'CANCEL' | 'REASSESS';
    reason: string;
  };
}

export type TradeState =
  | 'WAITING_FOR_ENTRY'
  | 'TRADE_ACTIVE'
  | 'TP1_HIT'
  | 'TP2_HIT'
  | 'TP3_HIT'
  | 'STOP_LOSS_HIT'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'CLOSED';

export interface TPValidationItem {
  tradeId: string;
  tpNumber: 1 | 2 | 3;
  exactTickPrice: number;
  timestamp: number;
  marketPrice: number;
  holdingTime: string;
  tpLevel: number;
  confirmationTick: {
    price: number;
    timestamp: number;
  };
}

export interface TradeIdea {
  id: string;
  direction: 'BULLISH' | 'BEARISH';
  publishedAt: number;
  entryPrice: number;
  entryZone: string;
  stopLoss: number;
  tp1: number;
  tp2: number;
  tp3: number;
  riskRewardRatio: string;
  qualityScore: number;
  confidence: number;
  probability: number;
  marketStory: string;
  institutionalReasoning: string[];
  invalidationLevel: number;
  expectedTrigger: string;
  holdingTime: string;

  // Real-time tracking
  state: TradeState;
  maxDrawdownPoints?: number;
  maxProfitPoints?: number;
  resolvedAt?: number;
  entryTriggeredAt?: number;
  executedAt?: number;
  closedAt?: number;
  aiCoach?: string;
  sniperStatus?: string;
  intelligentStatus?: IntelligentStatus;
  aiThinking?: AIThinking;
  confluenceAnalysis?: ConfluenceAnalysis;
  marketHealth?: MarketHealth;
  confidenceEvolution?: ConfidenceTimelineItem[];
  rejectionReasons?: RejectionReason[];
  aiDecision?: any;
  
  // Validation status fields
  tp1Validated?: boolean;
  tp2Validated?: boolean;
  tp3Validated?: boolean;
  tpValidationLog?: TPValidationItem[];
  
  // Post-Trade Analysis
  aiEvaluation?: string;
  finalProfitPts?: number;
  finalProfitPercent?: number;
  aiSelfReview?: AISelfReview;
  stopLossCause?: string;

  // Checklist at the time of entry
  entryChecklist?: {
    weeklyTrend: boolean;
    dailyBias: boolean;
    h4Direction: boolean;
    h1Bias: boolean;
    m15Structure: boolean;
    m5Setup: boolean;
    liquiditySweep: boolean;
    orderBlock: boolean;
    fairValueGap: boolean;
    bos: boolean;
    choch: boolean;
    momentum: boolean;
    confirmationCandle: boolean;
    entryReady: boolean;
  };

  // Auto-execution additions
  lotSize?: number;
  executionType?: 'manual' | 'automatic';
  executionReason?: string;
  netProfitCash?: number;

  // Smart Break-Even Protection V2 Additions
  originalStopLoss?: number;
  isBreakEvenActivated?: boolean;
  breakEvenActivationTime?: number;
  dynamicBufferUsed?: number;
  spreadAtActivation?: number;
  atrAtActivation?: number;
  highestPriceReached?: number;
  lowestPriceReached?: number;
  isProtectedExit?: boolean;
  mfePoints?: number; // Max Favourable Excursion
  maePoints?: number; // Max Adverse Excursion
  exitReason?: string;
  aiBreakEvenEvaluation?: {
    wasBEActivatedTooEarly: string;
    wasBufferTooSmall: string;
    wasBufferTooLarge: string;
    wouldStructureTrailingStopHaveImproved: string;
    wouldLeavingOriginalStopHaveProducedBetterResult: string;
    storedFindings: string;
  };
}

export interface PerformanceStats {
  totalTrades: number;
  wins: number;
  losses: number;
  cancelled: number;
  expired: number;
  winRate: number;
  netPoints: number;
  totalRRUnits: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  averageQualityScore: number;
  averageConfidence: number;
  tp1SuccessRate?: number;
  tp2SuccessRate?: number;
  tp3SuccessRate?: number;
  fullTP3WinRate?: number;
  partialWinRate?: number;
  lossRate?: number;
  averageRRAchieved?: number;

  // Smart Break-Even Protection V2 Analytics
  beProtectedTrades?: number;
  beBreakEvenActivations?: number;
  beProtectedWinRate?: number;
  beAverageProtectedProfit?: number;
  beAverageDynamicBuffer?: number;
  beAverageSpread?: number;
  beAverageATR?: number;
  beTradesSavedByBE?: number;
  beTradesStoppedAtBE?: number;
  beTradesReachingTP2AfterBE?: number;
  beTradesReachingTP3AfterBE?: number;
}

export interface LearningInsight {
  conditionName: string;
  frequencyInWins: number;
  frequencyInLosses: number;
  winProbabilityBoost: number;
}

export interface AISelfReview {
  entryOptimal: string;
  stopPlacement: string;
  confirmationsSufficient: string;
  entryImprovement: string;
  tpImprovement: string;
  riskAcceptable: string;
  institutionalRepeat: string;
  lessonsLearned: string;
  suggestedImprovements: string;
}

export type EconomicImpactLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export type AIRecommendationDecision = 
  | 'TRADE_NORMALLY' 
  | 'REDUCE_CONFIDENCE' 
  | 'DELAY_ENTRY' 
  | 'AVOID_NEW_TRADES' 
  | 'PAUSE_TRADING';

export interface ScenarioDetails {
  condition: string; // e.g. "Actual > Forecast", "Actual < Forecast", "Actual ≈ Forecast"
  likelyBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  reason: string;
}

export interface MarketBiasAnalysis {
  currentInstitutionalBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  expectedVolatility: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  potentialGoldBias: string;
  confidence: number; // percentage (e.g. 82)
  reasoning: string;
}

export interface PostNewsAnalysis {
  actualReleased: boolean;
  outcomeBias?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  marketReactionExplanation?: string;
  institutionalInterpretation?: string;
  htfBiasChange?: string;
}

export interface MacroEconomicEvent {
  id: string;
  eventName: string;
  country: string;
  currency: string;
  impactLevel: EconomicImpactLevel;
  previous: string;
  forecast: string;
  actual?: string;
  releaseTime: number; // UTC timestamp in milliseconds
  marketBiasAnalysis: MarketBiasAnalysis;
  scenarios: {
    greaterThanForecast: ScenarioDetails; // Scenario A: Actual > Forecast
    lessThanForecast: ScenarioDetails;    // Scenario B: Actual < Forecast
    approxForecast: ScenarioDetails;      // Scenario C: Actual ≈ Forecast
  };
  aiTradingImpact: {
    decision: AIRecommendationDecision;
    reason: string;
  };
  postNewsAnalysis?: PostNewsAnalysis;
  notified60?: boolean;
  notified30?: boolean;
  notified15?: boolean;
  notified5?: boolean;
  notifiedReleased?: boolean;
  notifiedPostAnalysis?: boolean;
}

export interface EconomicNewsHistoryItem {
  id: string;
  eventName: string;
  date: number; // UTC timestamp in milliseconds
  forecast: string;
  actual: string;
  previous: string;
  goldReaction: string; // "BULLISH" | "BEARISH" | "NEUTRAL"
  highestPriceMove: number; // point move, e.g. 15.5
  lowestPriceMove: number; // point move, e.g. -8.2
  volatility: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  aiPrediction: string; // e.g. "Bullish if CPI < 3.1%"
  outcome: string; // e.g. "SUCCESS", "FAILED"
}


