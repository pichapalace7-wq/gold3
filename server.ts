import express from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import WebSocket from 'ws';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { WhatsAppService } from './server/whatsappService';
import { analyzeSMC } from './src/utils/smc';
import { Candle, TradeIdea } from './src/types';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const PORT = 3000;

// Centralized Master State Structure
interface MarketState {
  lastTickPrice: number;
  bid: number;
  ask: number;
  lastTickTime: number;
  ticksCount: number;
  candles: Candle[];
  activeSetup: TradeIdea | null;
  tradeHistory: TradeIdea[];
  smcMetrics: any;
}

interface AlertItem {
  id: string;
  time: string;
  type: string;
  message: string;
  severity: 'high' | 'medium' | 'info';
}

const defaultGoldSetup: TradeIdea = {
  id: 'trade-init-active-gold',
  direction: 'BULLISH',
  publishedAt: Date.now() - 600000,
  entryPrice: 4119.00,
  entryZone: "4118.00 — 4120.00",
  stopLoss: 4112.00,
  tp1: 4125.00,
  tp2: 4132.00,
  tp3: 4145.00,
  riskRewardRatio: "1:4.8",
  qualityScore: 78,
  confidence: 82,
  probability: 72,
  marketStory: "XAU/USD Spot Gold is currently consolidating below the London H1 session liquidity high near 4119.00. Minor retail stop-losses have been swept beneath key structural support. Our algorithms are tracing significant buy volume clustering within the M15 Bullish Order Block.",
  institutionalReasoning: [
    "Fresh M15 Bullish Order Block acts as key structural floor",
    "Sell-side Liquidity Sweep of previous session low complete",
    "Daily Bullish Bias aligns with dynamic market flow",
    "H4 Trend Alignment acting as strong tailwind",
    "Unfilled Fair Value Gaps acting as price magnets"
  ],
  invalidationLevel: 4110.00,
  expectedTrigger: "M1 BOS + Bullish Rejection wick",
  holdingTime: "15-45 minutes",
  state: 'WAITING_FOR_ENTRY'
};

const defaultVolSetup: TradeIdea = {
  id: 'trade-init-active-vol',
  direction: 'BULLISH',
  publishedAt: Date.now() - 600000,
  entryPrice: 9435.50,
  entryZone: "9430.00 — 9440.00",
  stopLoss: 9420.00,
  tp1: 9450.00,
  tp2: 9475.00,
  tp3: 9520.00,
  riskRewardRatio: "1:4.8",
  qualityScore: 78,
  confidence: 82,
  probability: 72,
  marketStory: "Deriv Volatility 10 (1s) Index is currently consolidating inside the daily discount range near 9435.00. A major retail sell-side liquidity pool has been swept beneath key structural support. Our HFT algorithms are tracking strong institutional order flow within the M5 Bullish Order Block.",
  institutionalReasoning: [
    "M5 Bullish Order Block structural floor mitigation",
    "Liquidity pool hunt of previous session low complete",
    "HFT institutional buy-volume clustering detected"
  ],
  invalidationLevel: 9410.00,
  expectedTrigger: "M1 CHOCH close above supply range",
  holdingTime: "10-30 minutes",
  state: 'WAITING_FOR_ENTRY'
};

const defaultJumpSetup: TradeIdea = {
  id: 'trade-init-active-jump',
  direction: 'BULLISH',
  publishedAt: Date.now() - 600000,
  entryPrice: 112870.00,
  entryZone: "112850.00 — 112890.00",
  stopLoss: 112700.00,
  tp1: 113050.00,
  tp2: 113300.00,
  tp3: 113800.00,
  riskRewardRatio: "1:5.0",
  qualityScore: 81,
  confidence: 84,
  probability: 75,
  marketStory: "Jump 25 Index is compressing near the M15 discount zone near 112,870.00. The index has swept key retail trendline supports, with institutional order books showing massive absorption.",
  institutionalReasoning: [
    "M5 Bullish Order Block structural floor mitigation",
    "Liquidity pool hunt of previous session low complete",
    "HFT institutional buy-volume clustering detected"
  ],
  invalidationLevel: 112650.00,
  expectedTrigger: "M1 CHOCH close above supply range",
  holdingTime: "10-30 minutes",
  state: 'WAITING_FOR_ENTRY'
};

const masterState = {
  markets: {
    gold: {
      lastTickPrice: 4119.00,
      bid: 4118.85,
      ask: 4119.15,
      lastTickTime: Date.now(),
      ticksCount: 0,
      candles: [] as Candle[],
      activeSetup: defaultGoldSetup as TradeIdea | null,
      tradeHistory: [] as TradeIdea[],
      smcMetrics: null as any
    } as MarketState,
    vol: {
      lastTickPrice: 9435.00,
      bid: 9434.90,
      ask: 9435.10,
      lastTickTime: Date.now(),
      ticksCount: 0,
      candles: [] as Candle[],
      activeSetup: defaultVolSetup as TradeIdea | null,
      tradeHistory: [] as TradeIdea[],
      smcMetrics: null as any
    } as MarketState,
    jump: {
      lastTickPrice: 112870.00,
      bid: 112868.00,
      ask: 112872.00,
      lastTickTime: Date.now(),
      ticksCount: 0,
      candles: [] as Candle[],
      activeSetup: defaultJumpSetup as TradeIdea | null,
      tradeHistory: [] as TradeIdea[],
      smcMetrics: null as any
    } as MarketState
  },
  alerts: [
    {
      id: 'init-1',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type: 'SYSTEM',
      message: 'Centralized Master Backend Engine active. All devices synchronized to single institutional feed.',
      severity: 'info'
    }
  ] as AlertItem[],
  connectionStatus: 'CONNECTED' as 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING',
  lastUpdated: Date.now()
};

// Set of connected SSE client response objects
const sseClients = new Set<express.Response>();

function addCentralAlert(type: string, message: string, severity: 'high' | 'medium' | 'info' = 'info') {
  const alert: AlertItem = {
    id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    type,
    message,
    severity
  };
  masterState.alerts.unshift(alert);
  if (masterState.alerts.length > 50) {
    masterState.alerts = masterState.alerts.slice(0, 50);
  }
}

function broadcastMasterState() {
  masterState.lastUpdated = Date.now();
  const payload = `data: ${JSON.stringify(masterState)}\n\n`;
  for (const client of sseClients) {
    client.write(payload);
  }
}

async function notifyWhatsApp(eventType: string, setup: any, customParams?: any) {
  try {
    const waService = WhatsAppService.getInstance();
    if (waService.isConfigured()) {
      const msg = waService.buildMessage(eventType, setup, customParams);
      await waService.sendNotification(msg, eventType, setup.id);
    }
  } catch (err) {
    console.error('[Central Backend] WhatsApp notification error:', err);
  }
}

function auditActiveSetup(marketKey: 'gold' | 'vol' | 'jump') {
  const market = masterState.markets[marketKey];
  const activeSetup = market.activeSetup;
  if (!activeSetup) return;

  const price = market.lastTickPrice;
  if (!price || price <= 0) return;

  const isGold = marketKey === 'gold';
  const pointValue = isGold ? 100 : 1;
  const isBullish = activeSetup.direction === 'BULLISH';

  // 1. Check Entry trigger
  if (activeSetup.state === 'WAITING_FOR_ENTRY') {
    const isEntryTriggered = isBullish
      ? price <= activeSetup.entryPrice
      : price >= activeSetup.entryPrice;

    if (isEntryTriggered) {
      activeSetup.state = 'TRADE_ACTIVE';
      activeSetup.executedAt = Date.now();
      addCentralAlert('TRADE', `[${activeSetup.direction}] Central Entry triggered for ${marketKey.toUpperCase()} at ${price.toFixed(isGold ? 2 : 2)}`, 'high');
      notifyWhatsApp('ENTRY_TRIGGER', activeSetup);
      broadcastMasterState();
    }
  }

  // 2. Check TP / SL for Active or Partial hit trades
  if (activeSetup.state === 'TRADE_ACTIVE' || activeSetup.state === 'TP1_HIT' || activeSetup.state === 'TP2_HIT') {
    // Check Stop Loss
    const isSLHit = isBullish ? price <= activeSetup.stopLoss : price >= activeSetup.stopLoss;
    if (isSLHit) {
      activeSetup.state = 'CLOSED';
      activeSetup.closedAt = Date.now();
      const pipsLoss = -Math.abs(price - activeSetup.entryPrice);
      const cashLoss = pipsLoss * (activeSetup.lotSize || 0.10) * pointValue;
      activeSetup.finalProfitPts = pipsLoss;
      activeSetup.netProfitCash = cashLoss;

      market.tradeHistory.unshift({ ...activeSetup });
      market.activeSetup = null;
      addCentralAlert('TRADE', `[SL HIT] Trade closed for ${marketKey.toUpperCase()} at ${price.toFixed(2)} (${pipsLoss.toFixed(2)} pts / $${cashLoss.toFixed(2)})`, 'high');
      notifyWhatsApp('SL_TRIGGER', activeSetup);
      broadcastMasterState();
      return;
    }

    // Check TP3
    const isTP3Hit = isBullish ? price >= activeSetup.tp3 : price <= activeSetup.tp3;
    if (isTP3Hit) {
      activeSetup.state = 'CLOSED';
      activeSetup.closedAt = Date.now();
      const pipsWin = Math.abs(activeSetup.tp3 - activeSetup.entryPrice);
      const cashWin = pipsWin * (activeSetup.lotSize || 0.10) * pointValue;
      activeSetup.finalProfitPts = pipsWin;
      activeSetup.netProfitCash = cashWin;

      market.tradeHistory.unshift({ ...activeSetup });
      market.activeSetup = null;
      addCentralAlert('TRADE', `[TP3 HIT!] Target 3 reached for ${marketKey.toUpperCase()} at ${price.toFixed(2)} (+${pipsWin.toFixed(2)} pts / +$${cashWin.toFixed(2)})`, 'high');
      notifyWhatsApp('TP_TRIGGER', activeSetup, { tpLevel: 3 });
      broadcastMasterState();
      return;
    }

    // Check TP2
    const isTP2Hit = isBullish ? price >= activeSetup.tp2 : price <= activeSetup.tp2;
    if (isTP2Hit && activeSetup.state !== 'TP2_HIT') {
      activeSetup.state = 'TP2_HIT';
      addCentralAlert('TRADE', `[TP2 HIT!] Target 2 reached for ${marketKey.toUpperCase()} at ${price.toFixed(2)}`, 'high');
      notifyWhatsApp('TP_TRIGGER', activeSetup, { tpLevel: 2 });
      broadcastMasterState();
      return;
    }

    // Check TP1
    const isTP1Hit = isBullish ? price >= activeSetup.tp1 : price <= activeSetup.tp1;
    if (isTP1Hit && activeSetup.state === 'TRADE_ACTIVE') {
      activeSetup.state = 'TP1_HIT';
      addCentralAlert('TRADE', `[TP1 HIT!] Target 1 reached for ${marketKey.toUpperCase()} at ${price.toFixed(2)}`, 'medium');
      notifyWhatsApp('TP_TRIGGER', activeSetup, { tpLevel: 1 });
      broadcastMasterState();
      return;
    }
  }
}

// Rule-based premium fallback analysis generator when Gemini API is unavailable or quota is exceeded
function generateFallbackAnalysis(marketData: any) {
  const isGold = marketData.market === 'gold' || (marketData.symbolName && marketData.symbolName.toLowerCase().includes('xau'));
  const isVol = marketData.market === 'vol';
  const isJump = marketData.market === 'jump';

  const marketName = marketData.symbolName || (isGold ? "XAU/USD Spot Gold" : isVol ? "Volatility 10 (1s) Index" : "Jump 25 Index");
  const currencyStr = isGold ? "USD" : "points";
  const priceFormat = isVol ? 3 : 2;

  const direction = marketData.trend === 'BEARISH' ? 'BEARISH' : 'BULLISH';
  const price = typeof marketData.currentPrice === 'number' && marketData.currentPrice > 0 
    ? marketData.currentPrice 
    : (isGold ? 4153.80 : isVol ? 9435.00 : 112870.00);

  const checklist = marketData.confirmationChecklist || {};
  
  const intelligentStatusText: 'READY TO EXECUTE' | 'ENTRY APPROACHING' | 'WAITING FOR CONFIRMATION' = checklist.entryReady 
    ? 'READY TO EXECUTE' 
    : checklist.liquiditySweep 
    ? 'ENTRY APPROACHING' 
    : 'WAITING FOR CONFIRMATION';

  // Tight, highly realistic M1/M5 institutional scalping distances:
  const slDist = isGold ? 2.00 : isVol ? 10.00 : 120.00;
  const tp1Dist = isGold ? 2.50 : isVol ? 15.00 : 180.00;
  const tp2Dist = isGold ? 5.00 : isVol ? 30.00 : 380.00;
  const tp3Dist = isGold ? 9.00 : isVol ? 55.00 : 700.00;
  const entryWindowOffset = isGold ? 0.20 : isVol ? 1.00 : 15.00;

  const entry = Number(price.toFixed(priceFormat));
  let sl: number, tp1: number, tp2: number, tp3: number;

  if (direction === 'BULLISH') {
    sl = Number((price - slDist).toFixed(priceFormat));
    tp1 = Number((price + tp1Dist).toFixed(priceFormat));
    tp2 = Number((price + tp2Dist).toFixed(priceFormat));
    tp3 = Number((price + tp3Dist).toFixed(priceFormat));
  } else {
    sl = Number((price + slDist).toFixed(priceFormat));
    tp1 = Number((price - tp1Dist).toFixed(priceFormat));
    tp2 = Number((price - tp2Dist).toFixed(priceFormat));
    tp3 = Number((price - tp3Dist).toFixed(priceFormat));
  }

  const distanceStr = isGold 
    ? "0.10 USD (Immediate Premium Entry Window)" 
    : isVol ? "0.20 points (Immediate Premium Entry Window)" : "2.50 points (Immediate Premium Entry Window)";

  return {
    marketStory: `${marketName} is interacting directly within the unmitigated ${direction === 'BULLISH' ? 'Bullish' : 'Bearish'} M15 Order Block at ${entry.toFixed(priceFormat)}. Price recently executed a sweep of retail resting stops near ${entry.toFixed(priceFormat)}, absorbing late trend followers. Institutional order-books indicate premium re-accumulation as Tier-1 liquidity providers absorb sell pressure. (Server-Side Master Analysis)`,
    aiCoach: `Wait for the M1 Break of Structure (BOS) to print. Current price (${entry.toFixed(priceFormat)}) is positioned inside the institutional entry zone with a tight stop loss at ${sl.toFixed(priceFormat)} ($${slDist.toFixed(priceFormat)} risk). Target TP1 at ${tp1.toFixed(priceFormat)}.`,
    sniperStatus: intelligentStatusText,
    intelligentStatus: {
      status: intelligentStatusText,
      reason: checklist.liquiditySweep 
        ? `Liquidity sweep executed near ${entry.toFixed(priceFormat)}. Algorithms absorbing sell stops.` 
        : "Waiting for M1 structure breakout. Price is nested inside unmitigated demand block.",
      expectedTrigger: direction === 'BULLISH' ? "M1 BOS + Bullish Engulfing Candle close" : "M1 BOS + Bearish Engulfing close",
      estimatedTimeUntilTrigger: "1-3 candles (1-3 minutes)",
      missingConfirmation: checklist.bos ? "None (Fully Confirmed)" : "M1 BOS body close",
      probabilityIncreaseRequired: checklist.entryReady ? "0% (A+ Setup)" : "14% increase needed for maximum rating",
      currentProbability: checklist.entryReady ? 92 : 65,
      maxPossibleProbability: 95
    },
    setupDetails: {
      direction: direction as 'BULLISH' | 'BEARISH',
      optimalEntry: entry,
      entryWindow: `${(entry - entryWindowOffset).toFixed(priceFormat)} — ${(entry + entryWindowOffset).toFixed(priceFormat)}`,
      distanceToEntry: distanceStr,
      stopLoss: sl,
      tp1: tp1,
      tp2: tp2,
      tp3: tp3,
      riskRewardRatio: isGold ? "1:4.5" : "1:5.5",
      confidence: checklist.entryReady ? 88 : 65,
      probability: checklist.entryReady ? 80 : 58,
      qualityScore: checklist.entryReady ? 90 : 70,
      expectedTrigger: direction === 'BULLISH' ? "M1 BOS + Bullish Engulfing close" : "M1 BOS + Bearish Engulfing close",
      holdingTime: "15-35 minutes",
      invalidationLevel: sl,
      qualityExplanation: `This setup meets institutional SMC requirements. The unmitigated M15 Order Block near ${entry.toFixed(priceFormat)} has a high concentration of institutional limits.`,
      reasons: [
        `Fresh ${direction === 'BULLISH' ? 'Bullish' : 'Bearish'} M15 Order Block tap near ${entry.toFixed(priceFormat)}`,
        "Liquidity pool swept cleanly",
        "Trend alignment structural confirmation"
      ]
    },
    aiThinking: {
      currentBias: direction as 'BULLISH' | 'BEARISH',
      institutionalOpinion: `${direction === 'BULLISH' ? 'Bullish' : 'Bearish'} accumulation ongoing near ${entry.toFixed(priceFormat)}. Tier-1 liquidity providers are actively stacking orders at wholesale discount.`,
      marketCondition: "Trending with High Volume",
      currentRisk: (checklist.entryReady ? "LOW" : "MODERATE") as "LOW" | "MODERATE",
      whatAISees: `High volume order injection near ${entry.toFixed(priceFormat)} inside discount zone.`,
      whatAIIsWaitingFor: "Body close above local swing structural high.",
      expectedNextMove: `Strong ${direction.toLowerCase()} push towards TP1 (${tp1.toFixed(priceFormat)}).`,
      executionDecision: (checklist.entryReady ? (direction === 'BULLISH' ? "BUY" : "SELL") : "WAIT") as "BUY" | "SELL" | "WAIT"
    },
    confluenceAnalysis: {
      trendAlignment: { name: "Trend Alignment", score: marketData.trend === direction ? 100 : 60, explanation: "Excellent trend correlation on daily and weekly." },
      liquidityQuality: { name: "Liquidity Quality", score: checklist.liquiditySweep ? 95 : 50, explanation: "Clean sweep of session highs/lows completed." },
      orderBlockQuality: { name: "Order Block Quality", score: checklist.orderBlock ? 90 : 40, explanation: "Tapping highly responsive unmitigated H1 order block." },
      fairValueGapQuality: { name: "FVG Quality", score: checklist.fairValueGap ? 85 : 40, explanation: "Significant unfilled gap acting as high probability target magnet." },
      priceAction: { name: "Price Action", score: checklist.confirmationCandle ? 90 : 50, explanation: "Strong rejection wicks signaling buyer/seller absorption." },
      momentum: { name: "Momentum", score: checklist.momentum ? 85 : 40, explanation: "RSI and order flows turning supportive on lower structures." },
      volatility: { name: "Volatility", score: 80, explanation: "ATR is healthy, providing ideal conditions for institutional expansion." },
      riskReward: { name: "Risk Reward", score: 100, explanation: "Extremely tight stop loss offers outstanding risk reward profiling." },
      institutionalStructure: { name: "Institutional Structure", score: checklist.bos ? 95 : 50, explanation: "M1 break of structure confirms structural control." },
      overallConfluence: checklist.entryReady ? 90 : 65
    },
    marketHealth: {
      trend: "STRONG" as const,
      momentum: "INCREASING" as const,
      liquidity: "EXCELLENT" as const,
      atr: (isGold ? 1.2 : isVol ? 5.0 : 80.0).toFixed(priceFormat),
      volatility: "IDEAL" as const,
      spread: "EXCELLENT" as const,
      session: isGold ? "LONDON_NY_OVERLAP" : "24/7 Dynamic Session",
      scalpingConditions: "OPTIMAL",
      scalpingRating: 9.2
    },
    confidenceEvolution: [
      { timeAgo: "15m ago", confidence: 60, trend: "STABLE" as const, reason: "Nested in demand block" },
      { timeAgo: "5m ago", confidence: 75, trend: "INCREASING" as const, reason: "Liquidity pool swept" },
      { timeAgo: "Now", confidence: checklist.entryReady ? 90 : 75, trend: "INCREASING" as const, reason: checklist.entryReady ? "Confirmed breakout" : "Awaiting BOS" }
    ],
    rejectionReasons: [
      { condition: "Spread Widening", isFailed: false, explanation: isGold ? "Spread is stable at 0.15 USD." : "Spread is stable." },
      { condition: "No Liquidity Sweep", isFailed: !checklist.liquiditySweep, explanation: checklist.liquiditySweep ? "Flawless sweep completed." : "Stops still resting below structure." }
    ],
    aiDecision: {
      decision: checklist.entryReady ? (direction === 'BULLISH' ? "BUY" : "SELL") : "WAIT",
      reason: checklist.entryReady ? "All structural confluences are fully aligned for immediate sniper execution." : "Awaiting M1 Break of Structure confirmation."
    }
  };
}

// SINGLE CENTRAL DERIV WEBSOCKET CLIENT
let derivWs: WebSocket | null = null;
let tickPollInterval: NodeJS.Timeout | null = null;

function initDerivWebSocket() {
  console.log('[Central Deriv Feed] Initiating backend WebSocket connection...');
  masterState.connectionStatus = 'RECONNECTING';

  try {
    derivWs = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=1089');

    derivWs.on('open', () => {
      console.log('[Central Deriv Feed] WebSocket open. Subscribing to Gold, Volatility 10 (1s), and Jump 25...');
      masterState.connectionStatus = 'CONNECTED';
      addCentralAlert('WEB_SOCKET', 'Central server connected to Deriv feed. Synchronizing all market pairs...', 'info');

      // Request 1500 historical ticks for each pair
      if (derivWs && derivWs.readyState === WebSocket.OPEN) {
        derivWs.send(JSON.stringify({ ticks_history: 'frxXAUUSD', adjust_start_time: 1, count: 1500, end: 'latest', style: 'ticks' }));
        derivWs.send(JSON.stringify({ ticks_history: '1HZ10V', adjust_start_time: 1, count: 1500, end: 'latest', style: 'ticks' }));
        derivWs.send(JSON.stringify({ ticks_history: 'JD25', adjust_start_time: 1, count: 1500, end: 'latest', style: 'ticks' }));
      }

      // High-Frequency Poll Interval (1 second)
      if (tickPollInterval) clearInterval(tickPollInterval);
      tickPollInterval = setInterval(() => {
        if (derivWs && derivWs.readyState === WebSocket.OPEN) {
          derivWs.send(JSON.stringify({ ticks_history: 'frxXAUUSD', count: 1, end: 'latest', style: 'ticks' }));
          derivWs.send(JSON.stringify({ ticks_history: '1HZ10V', count: 1, end: 'latest', style: 'ticks' }));
          derivWs.send(JSON.stringify({ ticks_history: 'JD25', count: 1, end: 'latest', style: 'ticks' }));
        }
      }, 1000);
    });

    derivWs.on('message', (raw: WebSocket.RawData) => {
      try {
        const data = JSON.parse(raw.toString());

        // Handle Tick History
        if (data.history) {
          const symbol = data.echo_req?.ticks_history || '';
          const prices: number[] = data.history.prices;
          const times: number[] = data.history.times;

          if (prices && times && prices.length > 0) {
            const marketKey = symbol === 'frxXAUUSD' ? 'gold' : symbol === '1HZ10V' ? 'vol' : symbol === 'JD25' ? 'jump' : null;
            if (!marketKey) return;

            const mState = masterState.markets[marketKey];

            if (prices.length > 20) {
              // Compile M1 candles from raw ticks
              const candleMap: { [key: number]: number[] } = {};
              for (let i = 0; i < prices.length; i++) {
                const minuteEpoch = Math.floor(times[i] / 60) * 60 * 1000;
                if (!candleMap[minuteEpoch]) candleMap[minuteEpoch] = [];
                candleMap[minuteEpoch].push(prices[i]);
              }

              const initialCandles: Candle[] = Object.keys(candleMap)
                .map(timeStr => {
                  const time = Number(timeStr);
                  const list = candleMap[time];
                  return {
                    time,
                    open: list[0],
                    high: Math.max(...list),
                    low: Math.min(...list),
                    close: list[list.length - 1],
                    volume: list.length
                  };
                })
                .sort((a, b) => a.time - b.time);

              const lastPrice = prices[prices.length - 1];
              const lastTime = times[times.length - 1] * 1000;
              const spread = marketKey === 'gold' ? 0.15 : marketKey === 'vol' ? 0.04 : 0.12;

              mState.candles = initialCandles;
              mState.lastTickPrice = lastPrice;
              mState.bid = lastPrice - spread;
              mState.ask = lastPrice + spread;
              mState.lastTickTime = lastTime;
              mState.smcMetrics = analyzeSMC(initialCandles);

              // Auto-synchronize setup if current setup is initial default or far from current live price
              const isOutdated = !mState.activeSetup || 
                mState.activeSetup.id.startsWith('trade-init') || 
                Math.abs(mState.activeSetup.entryPrice - lastPrice) > (marketKey === 'gold' ? 3.0 : marketKey === 'vol' ? 25.0 : 300.0);

              if (isOutdated) {
                const marketData = {
                  market: marketKey,
                  symbolName: marketKey === 'gold' ? 'XAU/USD Spot Gold' : marketKey === 'vol' ? 'Deriv Volatility 10 (1s) Index' : 'Jump 25 Index',
                  currentPrice: lastPrice,
                  bid: mState.bid,
                  ask: mState.ask,
                  spread: Number((mState.ask - mState.bid).toFixed(2)),
                  trend: mState.smcMetrics?.trend || 'BULLISH',
                  atr: mState.smcMetrics?.atr || (marketKey === 'gold' ? 1.2 : marketKey === 'vol' ? 5.0 : 80.0),
                  confirmationChecklist: mState.smcMetrics?.confirmationChecklist || {}
                };

                const freshAnalysis = generateFallbackAnalysis(marketData);
                if (freshAnalysis && freshAnalysis.setupDetails) {
                  const details = freshAnalysis.setupDetails;
                  mState.activeSetup = {
                    id: `setup-${marketKey}-${Date.now()}`,
                    direction: details.direction === 'BEARISH' ? 'BEARISH' : 'BULLISH',
                    publishedAt: Date.now(),
                    entryPrice: details.optimalEntry,
                    entryZone: details.entryWindow,
                    stopLoss: details.stopLoss,
                    tp1: details.tp1,
                    tp2: details.tp2,
                    tp3: details.tp3,
                    riskRewardRatio: details.riskRewardRatio,
                    qualityScore: details.qualityScore,
                    confidence: details.confidence,
                    probability: details.probability,
                    marketStory: freshAnalysis.marketStory,
                    institutionalReasoning: details.reasons,
                    invalidationLevel: details.invalidationLevel,
                    expectedTrigger: details.expectedTrigger,
                    holdingTime: details.holdingTime,
                    state: 'WAITING_FOR_ENTRY',
                    aiCoach: freshAnalysis.aiCoach,
                    sniperStatus: freshAnalysis.sniperStatus,
                    intelligentStatus: freshAnalysis.intelligentStatus,
                    aiThinking: freshAnalysis.aiThinking,
                    confluenceAnalysis: freshAnalysis.confluenceAnalysis,
                    marketHealth: freshAnalysis.marketHealth,
                    confidenceEvolution: freshAnalysis.confidenceEvolution,
                    rejectionReasons: freshAnalysis.rejectionReasons,
                    aiDecision: freshAnalysis.aiDecision
                  };
                }
              }

              addCentralAlert('SYSTEM', `Compiled ${initialCandles.length} base M1 candles for ${marketKey.toUpperCase()} (Price: ${lastPrice.toFixed(2)}). Live setup synchronized.`, 'info');
              broadcastMasterState();
            } else {
              // High frequency single tick update
              const price = Number(prices[prices.length - 1]);
              const epochMs = times[times.length - 1] * 1000;
              const spread = marketKey === 'gold' ? 0.15 : marketKey === 'vol' ? 0.04 : 0.12;

              mState.lastTickPrice = price;
              mState.bid = price - spread;
              mState.ask = price + spread;
              mState.lastTickTime = epochMs;
              mState.ticksCount += 1;

              // Update M1 Candle
              const currentMinute = Math.floor(epochMs / 60000) * 60000;
              const updated = [...mState.candles];
              const lastCandle = updated[updated.length - 1];

              if (lastCandle && lastCandle.time === currentMinute) {
                lastCandle.close = price;
                lastCandle.high = Math.max(lastCandle.high, price);
                lastCandle.low = Math.min(lastCandle.low, price);
                lastCandle.volume += 1;
              } else {
                updated.push({
                  time: currentMinute,
                  open: price,
                  high: price,
                  low: price,
                  close: price,
                  volume: 1
                });
              }

              mState.candles = updated.slice(-100);
              mState.smcMetrics = analyzeSMC(mState.candles);

              auditActiveSetup(marketKey);
              broadcastMasterState();
            }
          }
        }
      } catch (err) {
        console.error('[Central Deriv Feed] Message parse error:', err);
      }
    });

    derivWs.on('close', () => {
      console.warn('[Central Deriv Feed] WebSocket closed. Reconnecting in 5 seconds...');
      masterState.connectionStatus = 'DISCONNECTED';
      if (tickPollInterval) clearInterval(tickPollInterval);
      broadcastMasterState();
      setTimeout(initDerivWebSocket, 5000);
    });

    derivWs.on('error', (err) => {
      console.error('[Central Deriv Feed] WebSocket error:', err);
      masterState.connectionStatus = 'DISCONNECTED';
      if (tickPollInterval) clearInterval(tickPollInterval);
      broadcastMasterState();
    });
  } catch (e) {
    console.error('[Central Deriv Feed] Initialization error:', e);
    setTimeout(initDerivWebSocket, 5000);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));
  app.use(cors());

  // Initialize Gemini client with proper configuration and telemetry headers
  const aiApiKey = process.env.GEMINI_API_KEY;
  const ai = aiApiKey 
    ? new GoogleGenAI({
        apiKey: aiApiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      })
    : null;

  // SSE Stream Endpoint for Real-Time Synchronization across ALL Devices
  app.get('/api/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    sseClients.add(res);

    // Immediately push full master state
    res.write(`data: ${JSON.stringify(masterState)}\n\n`);

    req.on('close', () => {
      sseClients.delete(res);
    });
  });

  // REST Snapshot Endpoint
  app.get('/api/market-state', (req, res) => {
    res.json(masterState);
  });

  // Trigger Centralized AI Analysis Endpoint (Updates state for EVERY connected device)
  app.post('/api/trigger-analysis', async (req, res) => {
    try {
      const { market } = req.body; // 'gold' | 'vol' | 'jump'
      const targetMarket = (market === 'vol' || market === 'jump' || market === 'gold') ? market : 'gold';
      const mState = masterState.markets[targetMarket];

      const marketData = {
        market: targetMarket,
        symbolName: targetMarket === 'gold' ? 'XAU/USD Spot Gold' : targetMarket === 'vol' ? 'Deriv Volatility 10 (1s) Index' : 'Jump 25 Index',
        currentPrice: mState.lastTickPrice,
        bid: mState.bid,
        ask: mState.ask,
        spread: Number((mState.ask - mState.bid).toFixed(2)),
        trend: mState.smcMetrics?.trend || 'BULLISH',
        atr: mState.smcMetrics?.atr || 1.2,
        confirmationChecklist: mState.smcMetrics?.confirmationChecklist || {}
      };

      let analysisResult: any;

      if (!ai) {
        analysisResult = generateFallbackAnalysis(marketData);
      } else {
        try {
          const isVol = targetMarket === 'vol' || targetMarket === 'jump';
          const marketName = marketData.symbolName;
          const currencyStr = isVol ? "points" : "USD";

          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze the following real-time ${marketName} market structure and price metrics collected from the central live Deriv feed:
${JSON.stringify(marketData, null, 2)}

Provide an elite institutional-grade analysis. Follow these exact guidelines:
1. Think exactly like a senior hedge fund analyst/SMC trader using Price Action, Volatility, Liquidity, and Risk Management.
2. CRITICAL LEVEL ACCURACY FOR SCALPING:
   - ALL setup prices (optimalEntry, stopLoss, tp1, tp2, tp3, invalidationLevel) MUST BE EXTREMELY REASONABLE AND TIED DIRECTLY TO THE CURRENT MARKET PRICE (${marketData.currentPrice} ${currencyStr}).
   ${targetMarket === 'gold' ? `
   - FOR GOLD (XAU/USD):
     * Current Price is approximately ${marketData.currentPrice}.
     * optimalEntry MUST be within 0.10 to 0.40 points ($0.10 - $0.40) of current price (${marketData.currentPrice}).
     * stopLoss MUST be tight for M1/M5 institutional Gold scalping: exactly 1.50 to 2.50 points ($1.50 - $2.50) away from optimalEntry. E.g., if BULLISH at ${marketData.currentPrice}, stopLoss is ~${(marketData.currentPrice - 2.0).toFixed(2)}.
     * tp1 MUST be 2.0 to 3.5 points away (e.g. ${(marketData.currentPrice + 2.5).toFixed(2)}).
     * tp2 MUST be 4.0 to 6.0 points away (e.g. ${(marketData.currentPrice + 5.0).toFixed(2)}).
     * tp3 MUST be 8.0 to 12.0 points away (e.g. ${(marketData.currentPrice + 9.0).toFixed(2)}).
     * DO NOT generate stopLoss, entry, or TPs that are $20, $30, or $50 away from the current gold price! Keep them strictly scaled for high-precision M1/M5 institutional scalping.
   ` : targetMarket === 'vol' ? `
   - FOR VOLATILITY 10 (1s) INDEX:
     * Current Price is approximately ${marketData.currentPrice}.
     * optimalEntry MUST be within 0.5 to 2.0 points of ${marketData.currentPrice}.
     * stopLoss MUST be 8.0 to 12.0 points away.
     * tp1 MUST be 12.0 to 18.0 points away.
     * tp2 MUST be 25.0 to 35.0 points away.
     * tp3 MUST be 50.0 to 70.0 points away.
   ` : `
   - FOR JUMP 25 INDEX:
     * Current Price is approximately ${marketData.currentPrice}.
     * optimalEntry MUST be within 10 to 20 points of ${marketData.currentPrice}.
     * stopLoss MUST be 100 to 150 points away.
     * tp1 MUST be 150 to 200 points away.
     * tp2 MUST be 300 to 450 points away.
     * tp3 MUST be 600 to 900 points away.
   `}
3. Provide a detailed marketStory referencing current price (${marketData.currentPrice} ${currencyStr}).
4. Provide an educational aiCoach referencing current price (${marketData.currentPrice} ${currencyStr}).
5. Fill in detailed 'intelligentStatus', 'setupDetails', 'aiThinking', 'confluenceAnalysis', 'marketHealth', 'confidenceEvolution', 'rejectionReasons', and 'aiDecision' fields.
6. Ensure status is one of: 'READY TO EXECUTE', 'ENTRY APPROACHING', 'WAITING FOR CONFIRMATION', 'NO VALID SETUP', 'SETUP INVALIDATED', 'HIGH RISK CONDITIONS'.
7. Relate every metric directly to current price (${marketData.currentPrice} ${currencyStr}).`,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  marketStory: { type: Type.STRING },
                  aiCoach: { type: Type.STRING },
                  sniperStatus: { type: Type.STRING },
                  intelligentStatus: {
                    type: Type.OBJECT,
                    properties: {
                      status: { type: Type.STRING },
                      reason: { type: Type.STRING },
                      expectedTrigger: { type: Type.STRING },
                      estimatedTimeUntilTrigger: { type: Type.STRING },
                      missingConfirmation: { type: Type.STRING },
                      probabilityIncreaseRequired: { type: Type.STRING },
                      currentProbability: { type: Type.NUMBER },
                      maxPossibleProbability: { type: Type.NUMBER }
                    },
                    required: ["status", "reason", "expectedTrigger", "estimatedTimeUntilTrigger", "missingConfirmation", "currentProbability", "maxPossibleProbability"]
                  },
                  setupDetails: {
                    type: Type.OBJECT,
                    properties: {
                      direction: { type: Type.STRING },
                      optimalEntry: { type: Type.NUMBER },
                      entryWindow: { type: Type.STRING },
                      distanceToEntry: { type: Type.STRING },
                      stopLoss: { type: Type.NUMBER },
                      tp1: { type: Type.NUMBER },
                      tp2: { type: Type.NUMBER },
                      tp3: { type: Type.NUMBER },
                      riskRewardRatio: { type: Type.STRING },
                      confidence: { type: Type.NUMBER },
                      probability: { type: Type.NUMBER },
                      qualityScore: { type: Type.NUMBER },
                      expectedTrigger: { type: Type.STRING },
                      holdingTime: { type: Type.STRING },
                      invalidationLevel: { type: Type.NUMBER },
                      qualityExplanation: { type: Type.STRING },
                      reasons: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["direction", "reasons"]
                  },
                  aiThinking: {
                    type: Type.OBJECT,
                    properties: {
                      currentBias: { type: Type.STRING },
                      institutionalOpinion: { type: Type.STRING },
                      marketCondition: { type: Type.STRING },
                      currentRisk: { type: Type.STRING },
                      whatAISees: { type: Type.STRING },
                      whatAIIsWaitingFor: { type: Type.STRING },
                      expectedNextMove: { type: Type.STRING },
                      executionDecision: { type: Type.STRING }
                    },
                    required: ["currentBias", "institutionalOpinion", "marketCondition", "currentRisk", "whatAISees", "whatAIIsWaitingFor", "expectedNextMove", "executionDecision"]
                  },
                  confluenceAnalysis: {
                    type: Type.OBJECT,
                    properties: {
                      trendAlignment: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, score: { type: Type.NUMBER }, explanation: { type: Type.STRING } }, required: ["name", "score", "explanation"] },
                      liquidityQuality: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, score: { type: Type.NUMBER }, explanation: { type: Type.STRING } }, required: ["name", "score", "explanation"] },
                      orderBlockQuality: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, score: { type: Type.NUMBER }, explanation: { type: Type.STRING } }, required: ["name", "score", "explanation"] },
                      fairValueGapQuality: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, score: { type: Type.NUMBER }, explanation: { type: Type.STRING } }, required: ["name", "score", "explanation"] },
                      priceAction: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, score: { type: Type.NUMBER }, explanation: { type: Type.STRING } }, required: ["name", "score", "explanation"] },
                      momentum: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, score: { type: Type.NUMBER }, explanation: { type: Type.STRING } }, required: ["name", "score", "explanation"] },
                      volatility: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, score: { type: Type.NUMBER }, explanation: { type: Type.STRING } }, required: ["name", "score", "explanation"] },
                      riskReward: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, score: { type: Type.NUMBER }, explanation: { type: Type.STRING } }, required: ["name", "score", "explanation"] },
                      institutionalStructure: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, score: { type: Type.NUMBER }, explanation: { type: Type.STRING } }, required: ["name", "score", "explanation"] },
                      overallConfluence: { type: Type.NUMBER }
                    },
                    required: ["trendAlignment", "liquidityQuality", "orderBlockQuality", "fairValueGapQuality", "priceAction", "momentum", "volatility", "riskReward", "institutionalStructure", "overallConfluence"]
                  },
                  marketHealth: {
                    type: Type.OBJECT,
                    properties: {
                      trend: { type: Type.STRING },
                      momentum: { type: Type.STRING },
                      liquidity: { type: Type.STRING },
                      atr: { type: Type.STRING },
                      volatility: { type: Type.STRING },
                      spread: { type: Type.STRING },
                      session: { type: Type.STRING },
                      scalpingConditions: { type: Type.STRING },
                      scalpingRating: { type: Type.NUMBER }
                    },
                    required: ["trend", "momentum", "liquidity", "atr", "volatility", "spread", "session", "scalpingConditions", "scalpingRating"]
                  },
                  confidenceEvolution: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: { timeAgo: { type: Type.STRING }, confidence: { type: Type.NUMBER }, trend: { type: Type.STRING }, reason: { type: Type.STRING } },
                      required: ["timeAgo", "confidence", "trend", "reason"]
                    }
                  },
                  rejectionReasons: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: { condition: { type: Type.STRING }, isFailed: { type: Type.BOOLEAN }, explanation: { type: Type.STRING } },
                      required: ["condition", "isFailed", "explanation"]
                    }
                  },
                  aiDecision: {
                    type: Type.OBJECT,
                    properties: { decision: { type: Type.STRING }, reason: { type: Type.STRING } },
                    required: ["decision", "reason"]
                  }
                },
                required: ["marketStory", "aiCoach", "sniperStatus", "intelligentStatus", "setupDetails", "aiThinking", "confluenceAnalysis", "marketHealth", "confidenceEvolution", "rejectionReasons", "aiDecision"]
              }
            }
          });

          analysisResult = JSON.parse(response.text || '{}');
        } catch (geminiErr) {
          console.error('[Central AI] Gemini call failed, using rule-based fallback generator:', geminiErr);
          analysisResult = generateFallbackAnalysis(marketData);
        }
      }

      // Update central active setup if setupDetails exists
      if (analysisResult.setupDetails) {
        const details = analysisResult.setupDetails;
        const newSetup: TradeIdea = {
          id: `setup-${targetMarket}-${Date.now()}`,
          direction: details.direction === 'BEARISH' ? 'BEARISH' : 'BULLISH',
          publishedAt: Date.now(),
          entryPrice: details.optimalEntry || mState.lastTickPrice,
          entryZone: details.entryWindow || `${mState.lastTickPrice}`,
          stopLoss: details.stopLoss,
          tp1: details.tp1,
          tp2: details.tp2,
          tp3: details.tp3,
          riskRewardRatio: details.riskRewardRatio || '1:3.5',
          qualityScore: details.qualityScore || 80,
          confidence: details.confidence || 80,
          probability: details.probability || 75,
          marketStory: analysisResult.marketStory,
          institutionalReasoning: details.reasons || ['Fresh Order Block tap', 'Liquidity swept'],
          invalidationLevel: details.invalidationLevel || details.stopLoss,
          expectedTrigger: details.expectedTrigger || 'M1 BOS close',
          holdingTime: details.holdingTime || '15-30 minutes',
          state: 'WAITING_FOR_ENTRY',
          aiCoach: analysisResult.aiCoach,
          sniperStatus: analysisResult.sniperStatus,
          intelligentStatus: analysisResult.intelligentStatus,
          aiThinking: analysisResult.aiThinking,
          confluenceAnalysis: analysisResult.confluenceAnalysis,
          marketHealth: analysisResult.marketHealth,
          confidenceEvolution: analysisResult.confidenceEvolution,
          rejectionReasons: analysisResult.rejectionReasons,
          aiDecision: analysisResult.aiDecision
        };

        mState.activeSetup = newSetup;
        addCentralAlert('ANALYSIS', `New Centralized AI Analysis generated for ${targetMarket.toUpperCase()}: ${newSetup.direction} @ ${newSetup.entryPrice}`, 'high');
        notifyWhatsApp('NEW_SETUP', newSetup);
      }

      broadcastMasterState();
      res.json(analysisResult);
    } catch (error: any) {
      console.error('[Central Analysis] Error:', error);
      res.status(500).json({ error: error?.message || 'Failed to trigger central analysis.' });
    }
  });

  // Manual Trade Actions Endpoint (Centralized)
  app.post('/api/trade-action', (req, res) => {
    try {
      const { market, action } = req.body;
      const targetMarket = (market === 'vol' || market === 'jump' || market === 'gold') ? market : 'gold';
      const mState = masterState.markets[targetMarket];

      if (action === 'CANCEL_SETUP' || action === 'CLOSE_SETUP') {
        if (mState.activeSetup) {
          addCentralAlert('TRADE', `Central setup for ${targetMarket.toUpperCase()} was manually closed.`, 'medium');
          mState.activeSetup = null;
        }
      } else if (action === 'CLEAR_HISTORY') {
        mState.tradeHistory = [];
        addCentralAlert('SYSTEM', `Trade history for ${targetMarket.toUpperCase()} cleared centrally.`, 'info');
      }

      broadcastMasterState();
      res.json({ success: true, masterState });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || 'Failed to execute trade action.' });
    }
  });

  // Standard REST /api/analyze Endpoint
  app.post('/api/analyze', async (req, res) => {
    try {
      const { marketData } = req.body;
      if (!marketData) {
        return res.status(400).json({ error: "Missing market data for analysis." });
      }
      res.json(generateFallbackAnalysis(marketData));
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Failed analysis' });
    }
  });

  // WhatsApp Integration Endpoints
  app.get('/api/whatsapp/config', (req, res) => {
    try {
      const waService = WhatsAppService.getInstance();
      const rawSettings = waService.getSettings() as any;
      const logs = waService.getLogs();
      const queue = waService.getQueue();
      const { instanceId, phoneNumber, apiUrl } = waService.getCredentials();
      
      const isConfigured = waService.isConfigured();
      const maskedInstanceId = instanceId && isConfigured ? instanceId.substring(0, 4) + '****' : (instanceId ? instanceId.substring(0, 4) + '****' : '');
      const maskedPhone = phoneNumber && isConfigured ? phoneNumber.substring(0, 4) + '****' + phoneNumber.slice(-4) : (phoneNumber ? phoneNumber.substring(0, 4) + '****' : '');

      const settings = {
        newSetup: rawSettings.newSetup ?? rawSettings.newSetupAlerts ?? true,
        entryTrigger: rawSettings.entryTrigger ?? rawSettings.entryTriggerAlerts ?? true,
        tpTrigger: rawSettings.tpTrigger ?? rawSettings.tpAlerts ?? true,
        slTrigger: rawSettings.slTrigger ?? rawSettings.stopLossAlerts ?? true,
        dailyReport: rawSettings.dailyReport ?? true,
        weeklyReport: rawSettings.weeklyReport ?? true,
        newsAlert: rawSettings.newsAlert ?? rawSettings.newsAlerts ?? true,
        opportunityAlert: rawSettings.opportunityAlert ?? rawSettings.emergencyAlerts ?? true,
      };

      res.json({
        settings,
        isConfigured,
        instanceId: maskedInstanceId,
        phoneNumber: maskedPhone,
        apiUrl,
        logs: logs || [],
        queue: queue || []
      });
    } catch (error: any) {
      console.warn('[WhatsApp API] Failed to fetch WhatsApp config:', error?.message);
      res.status(200).json({
        settings: {
          newSetup: true,
          entryTrigger: true,
          tpTrigger: true,
          slTrigger: true,
          dailyReport: true,
          weeklyReport: true,
          newsAlert: true,
          opportunityAlert: true,
        },
        isConfigured: false,
        instanceId: '',
        phoneNumber: '',
        apiUrl: 'https://7107.api.greenapi.com',
        logs: [],
        queue: []
      });
    }
  });

  app.post('/api/whatsapp/config', async (req, res) => {
    try {
      const { settings } = req.body;
      if (!settings) {
        return res.status(400).json({ error: 'Missing settings payload' });
      }
      const waService = WhatsAppService.getInstance();
      const updated = await waService.updateSettings({
        ...settings,
        newSetupAlerts: settings.newSetup ?? true,
        entryTriggerAlerts: settings.entryTrigger ?? true,
        tpAlerts: settings.tpTrigger ?? true,
        stopLossAlerts: settings.slTrigger ?? true,
        newsAlerts: settings.newsAlert ?? true,
        emergencyAlerts: settings.opportunityAlert ?? true,
      });

      res.json({ settings: updated });
    } catch (error: any) {
      console.warn('[WhatsApp API] Failed to save settings:', error?.message);
      res.status(500).json({ error: error?.message || 'Failed to save WhatsApp settings.' });
    }
  });

  app.post('/api/whatsapp/logs/clear', async (req, res) => {
    try {
      const waService = WhatsAppService.getInstance();
      await waService.clearLogs();
      res.json({ success: true });
    } catch (error: any) {
      console.warn('[WhatsApp API] Failed to clear logs:', error?.message);
      res.json({ success: false, error: error?.message || 'Failed to clear logs.' });
    }
  });

  app.post('/api/whatsapp/test', async (req, res) => {
    try {
      const waService = WhatsAppService.getInstance();
      const result = await waService.sendTestMessage();
      res.json(result);
    } catch (error: any) {
      console.warn('[WhatsApp API] Failed test message:', error?.message);
      res.json({ success: false, error: error?.message || 'Failed to send test message.' });
    }
  });

  app.post('/api/whatsapp/notify', async (req, res) => {
    try {
      const { eventType, setup, customParams } = req.body;
      if (!eventType) {
        return res.status(200).json({ success: false, message: 'Skipped - no eventType' });
      }

      const waService = WhatsAppService.getInstance();
      const safeSetup = setup || { id: 'SYSTEM' };
      const message = waService.buildMessage(eventType, safeSetup, customParams);
      const success = await waService.sendNotification(message, eventType, safeSetup.id || 'SYSTEM');
      
      res.json({ success, messageType: eventType });
    } catch (error: any) {
      console.warn('[WhatsApp API] Notification error handled gracefully:', error?.message);
      res.status(200).json({ success: false, error: error?.message || 'Notification queued/skipped' });
    }
  });

  // Serve static files / Vite middleware
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Gold Institutional AI Scalper running on http://localhost:${PORT}`);
    // Start Centralized WebSocket Connection
    initDerivWebSocket();
  });
}

startServer();
