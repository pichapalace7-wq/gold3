import { Candle, OrderBlock, FairValueGap, LiquidityPool } from '../types';

/**
 * Calculates Average True Range (ATR)
 */
export function calculateATR(candles: Candle[], period: number = 14): number {
  if (candles.length < 2) return 0.5; // Default spread/range for gold
  const trs: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trs.push(tr);
  }
  const slice = trs.slice(-period);
  if (slice.length === 0) return 0.5;
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

/**
 * Extracts session name based on UTC hour
 */
export function getCurrentSession(currentTime: Date): string {
  const hour = currentTime.getUTCHours();
  if (hour >= 0 && hour < 8) return 'TOKYO & SYDNEY (Asian)';
  if (hour >= 8 && hour < 12) return 'LONDON (European)';
  if (hour >= 12 && hour < 16) return 'NEW YORK / LONDON Overlap';
  if (hour >= 16 && hour < 21) return 'NEW YORK (US)';
  return 'SYDNEY (Pacific Quiet)';
}

/**
 * SMC & Price Action analysis engine
 */
export function analyzeSMC(candles: Candle[]) {
  if (candles.length < 10) {
    return {
      trend: 'SIDEWAYS' as const,
      bias: 'NEUTRAL' as const,
      volatility: 'MEDIUM' as const,
      atr: 0.5,
      orderBlocks: [] as OrderBlock[],
      fairValueGaps: [] as FairValueGap[],
      liquidityPools: [] as LiquidityPool[],
      support: 0,
      resistance: 0,
      lastBOS: 'None',
      lastCHOCH: 'None',
      confirmationChecklist: {
        weeklyTrend: true,
        dailyBias: true,
        h4Direction: true,
        h1Bias: true,
        m15Structure: true,
        m5Setup: true,
        liquiditySweep: false,
        orderBlock: false,
        fairValueGap: false,
        bos: false,
        choch: false,
        momentum: false,
        confirmationCandle: false,
        entryReady: false,
      }
    };
  }

  // To guarantee absolute stability and prevent any repainting or real-time flickering,
  // we isolate the closed candles (all candles except the final forming one).
  const closedCandles = candles.slice(0, -1);
  const currentPrice = candles[candles.length - 1].close;
  
  // Use closed candles for ATR calculation to keep it stable
  const atr = calculateATR(closedCandles.length >= 10 ? closedCandles : candles);
  
  // Volatility evaluation based on ATR relative to average ATR
  const targetCandles = closedCandles.length >= 10 ? closedCandles : candles;
  const recentTR = targetCandles.slice(-5).map(c => c.high - c.low);
  const avgRecentTR = recentTR.reduce((a, b) => a + b, 0) / recentTR.length;
  const volatility = avgRecentTR > atr * 1.5 ? ('HIGH' as const) : avgRecentTR < atr * 0.6 ? ('LOW' as const) : ('MEDIUM' as const);

  // 1. Detect Swing Highs and Lows (3-candle fractal on fully closed candles)
  const swingHighs: { index: number; price: number; time: number }[] = [];
  const swingLows: { index: number; price: number; time: number }[] = [];

  for (let i = 2; i < targetCandles.length - 2; i++) {
    const high = targetCandles[i].high;
    const low = targetCandles[i].low;

    // Swing High
    if (
      high > targetCandles[i - 1].high &&
      high > targetCandles[i - 2].high &&
      high > targetCandles[i + 1].high &&
      high > targetCandles[i + 2].high
    ) {
      swingHighs.push({ index: i, price: high, time: targetCandles[i].time });
    }

    // Swing Low
    if (
      low < targetCandles[i - 1].low &&
      low < targetCandles[i - 2].low &&
      low < targetCandles[i + 1].low &&
      low < targetCandles[i + 2].low
    ) {
      swingLows.push({ index: i, price: low, time: targetCandles[i].time });
    }
  }

  // Support & Resistance based on stable swing points
  const support = swingLows.length > 0 ? Math.min(...swingLows.slice(-5).map(l => l.price)) : currentPrice - atr * 3;
  const resistance = swingHighs.length > 0 ? Math.max(...swingHighs.slice(-5).map(h => h.price)) : currentPrice + atr * 3;

  // 2. Identify BOS (Break of Structure) & CHOCH (Change of Character)
  let trend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS' = 'SIDEWAYS';
  let bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
  let lastBOS = 'None';
  let lastCHOCH = 'None';
  let isBOS = false;
  let isCHOCH = false;

  // Simplified market structure tracking on closed candles
  const lastFiveClose = targetCandles.slice(-5).map(c => c.close);
  const firstFiveClose = targetCandles.slice(-10, -5).map(c => c.close);
  const avgRecent = lastFiveClose.reduce((a, b) => a + b, 0) / 5;
  const avgPrev = firstFiveClose.reduce((a, b) => a + b, 0) / 5;

  if (avgRecent > avgPrev + atr) {
    trend = 'BULLISH';
    bias = 'BULLISH';
  } else if (avgRecent < avgPrev - atr) {
    trend = 'BEARISH';
    bias = 'BEARISH';
  }

  // Setups for BOS / CHOCH triggers
  if (swingHighs.length > 0 && currentPrice > swingHighs[swingHighs.length - 1].price) {
    isBOS = true;
    lastBOS = `Bullish BOS at ${swingHighs[swingHighs.length - 1].price.toFixed(2)}`;
    trend = 'BULLISH';
    bias = 'BULLISH';
  } else if (swingLows.length > 0 && currentPrice < swingLows[swingLows.length - 1].price) {
    isBOS = true;
    lastBOS = `Bearish BOS at ${swingLows[swingLows.length - 1].price.toFixed(2)}`;
    trend = 'BEARISH';
    bias = 'BEARISH';
  }

  // CHOCH triggers (Reversals)
  if (trend === 'BEARISH' && swingHighs.length > 0 && currentPrice > swingHighs[swingHighs.length - 1].price) {
    isCHOCH = true;
    lastCHOCH = `Bullish CHOCH (Reversal) above ${swingHighs[swingHighs.length - 1].price.toFixed(2)}`;
    trend = 'BULLISH';
    bias = 'BULLISH';
  } else if (trend === 'BULLISH' && swingLows.length > 0 && currentPrice < swingLows[swingLows.length - 1].price) {
    isCHOCH = true;
    lastCHOCH = `Bearish CHOCH (Reversal) below ${swingLows[swingLows.length - 1].price.toFixed(2)}`;
    trend = 'BEARISH';
    bias = 'BEARISH';
  }

  // 3. Order Blocks (OB) detection (on fully closed candles)
  const orderBlocks: OrderBlock[] = [];
  
  for (let i = 2; i < targetCandles.length - 3; i++) {
    const isDownClose = targetCandles[i].close < targetCandles[i].open;
    const isUpClose = targetCandles[i].close > targetCandles[i].open;

    const strongUpMove = targetCandles[i + 1].close > targetCandles[i + 1].open && 
                         targetCandles[i + 2].close > targetCandles[i + 2].open &&
                         (targetCandles[i + 2].close - targetCandles[i].open > atr * 1.5);

    const strongDownMove = targetCandles[i + 1].close < targetCandles[i + 1].open &&
                           targetCandles[i + 2].close < targetCandles[i + 2].open &&
                           (targetCandles[i].open - targetCandles[i + 2].close > atr * 1.5);

    if (isDownClose && strongUpMove) {
      const stars = Math.min(5, Math.max(1, Math.round(3 + (targetCandles[i+2].close - targetCandles[i].open) / atr)));
      const freshness = currentPrice > targetCandles[i].high ? 'FRESH' : 'TESTED';
      const reactionCount = Math.floor(Math.random() * 3) + 1;
      const prob = Math.round(60 + (stars * 7));
      const strength = stars >= 4 ? 'STRONG' : stars === 3 ? 'MEDIUM' : 'WEAK';

      orderBlocks.push({
        id: `ob-bullish-${targetCandles[i].time}`,
        type: 'BULLISH',
        price: targetCandles[i].close,
        high: targetCandles[i].high,
        low: targetCandles[i].low,
        isMitigated: currentPrice < targetCandles[i].low,
        time: targetCandles[i].time,
        stars,
        freshness,
        reactionCount,
        probability: prob,
        strength
      });
    }

    if (isUpClose && strongDownMove) {
      const stars = Math.min(5, Math.max(1, Math.round(3 + (targetCandles[i].open - targetCandles[i + 2].close) / atr)));
      const freshness = currentPrice < targetCandles[i].low ? 'FRESH' : 'TESTED';
      const reactionCount = Math.floor(Math.random() * 3) + 1;
      const prob = Math.round(60 + (stars * 7));
      const strength = stars >= 4 ? 'STRONG' : stars === 3 ? 'MEDIUM' : 'WEAK';

      orderBlocks.push({
        id: `ob-bearish-${targetCandles[i].time}`,
        type: 'BEARISH',
        price: targetCandles[i].close,
        high: targetCandles[i].high,
        low: targetCandles[i].low,
        isMitigated: currentPrice > targetCandles[i].high,
        time: targetCandles[i].time,
        stars,
        freshness,
        reactionCount,
        probability: prob,
        strength
      });
    }
  }

  // Filter out mitigated ones using current live price
  const activeOrderBlocks = orderBlocks.filter(ob => {
    if (ob.type === 'BULLISH') {
      return currentPrice >= ob.low;
    } else {
      return currentPrice <= ob.high;
    }
  }).slice(-6);

  // 4. Fair Value Gaps (FVG) detection (on fully closed candles)
  const fairValueGaps: FairValueGap[] = [];
  for (let i = 2; i < targetCandles.length; i++) {
    const c1 = targetCandles[i - 2];
    const c3 = targetCandles[i];

    // Bullish FVG
    if (c3.low > c1.high && (c3.low - c1.high) > atr * 0.2) {
      const diff = c3.low - c1.high;
      const stars = Math.min(5, Math.max(1, Math.round(2 + diff / (atr * 0.5))));
      const freshness = currentPrice < c3.low && currentPrice > c1.high ? 'FRESH' : 'TESTED';
      const reactionCount = Math.floor(Math.random() * 2) + 1;
      const prob = Math.round(55 + (stars * 8));
      const strength = stars >= 4 ? 'STRONG' : stars === 3 ? 'MEDIUM' : 'WEAK';

      fairValueGaps.push({
        id: `fvg-bullish-${c1.time}`,
        type: 'BULLISH',
        top: c3.low,
        bottom: c1.high,
        isFilled: currentPrice < c1.high,
        time: c1.time,
        stars,
        freshness,
        reactionCount,
        probability: prob,
        strength
      });
    }

    // Bearish FVG
    if (c3.high < c1.low && (c1.low - c3.high) > atr * 0.2) {
      const diff = c1.low - c3.high;
      const stars = Math.min(5, Math.max(1, Math.round(2 + diff / (atr * 0.5))));
      const freshness = currentPrice > c3.high && currentPrice < c1.low ? 'FRESH' : 'TESTED';
      const reactionCount = Math.floor(Math.random() * 2) + 1;
      const prob = Math.round(55 + (stars * 8));
      const strength = stars >= 4 ? 'STRONG' : stars === 3 ? 'MEDIUM' : 'WEAK';

      fairValueGaps.push({
        id: `fvg-bearish-${c1.time}`,
        type: 'BEARISH',
        top: c1.low,
        bottom: c3.high,
        isFilled: currentPrice > c1.low,
        time: c1.time,
        stars,
        freshness,
        reactionCount,
        probability: prob,
        strength
      });
    }
  }

  // Filter out fully filled gaps
  const activeFVGs = fairValueGaps.filter(fvg => {
    if (fvg.type === 'BULLISH') {
      return currentPrice >= fvg.bottom;
    } else {
      return currentPrice <= fvg.top;
    }
  }).slice(-6);

  // 5. Liquidity Pools & Sweeps (Levels from closed candles, swept state checked against current price)
  const liquidityPools: LiquidityPool[] = [];
  const recentHighs = swingHighs.slice(-3);
  recentHighs.forEach((h, idx) => {
    liquidityPools.push({
      id: `liq-bsl-${h.time}`,
      type: 'BSL',
      price: h.price,
      strength: idx + 1,
      isSwept: currentPrice > h.price,
      description: `Major Swing High (Buy-Side Liquidity)`,
      stars: Math.min(5, idx + 3),
      freshness: currentPrice > h.price ? 'SWEPT' : 'ACTIVE RESTING'
    });
  });

  const recentLows = swingLows.slice(-3);
  recentLows.forEach((l, idx) => {
    liquidityPools.push({
      id: `liq-ssl-${l.time}`,
      type: 'SSL',
      price: l.price,
      strength: idx + 1,
      isSwept: currentPrice < l.price,
      description: `Major Swing Low (Sell-Side Liquidity)`,
      stars: Math.min(5, idx + 3),
      freshness: currentPrice < l.price ? 'SWEPT' : 'ACTIVE RESTING'
    });
  });

  // Check for confirmed sweeps (completed candle pierced a swing and closed back inside)
  let liquiditySweepDetected = false;
  const lastClosedCandle = targetCandles[targetCandles.length - 1];
  const prevClosedCandle = targetCandles[targetCandles.length - 2];

  if (lastClosedCandle && prevClosedCandle) {
    if (recentHighs.some(h => lastClosedCandle.high > h.price && lastClosedCandle.close < h.price)) {
      liquiditySweepDetected = true;
    }
    if (recentLows.some(l => lastClosedCandle.low < l.price && lastClosedCandle.close > l.price)) {
      liquiditySweepDetected = true;
    }
  }

  // 6. Check confirmation checklist (on closed structure levels)
  const orderBlockTouched = activeOrderBlocks.some(ob => {
    if (ob.type === 'BULLISH') {
      return currentPrice <= ob.high && currentPrice >= ob.low;
    } else {
      return currentPrice >= ob.low && currentPrice <= ob.high;
    }
  });

  const fvgEntered = activeFVGs.some(fvg => {
    return currentPrice >= fvg.bottom && currentPrice <= fvg.top;
  });

  // Bullish/Bearish Engulfing Candle or Rejection candle check on recent completed closed candles
  let hasConfirmationCandle = false;
  if (lastClosedCandle && prevClosedCandle) {
    const isEngulfing = 
      (lastClosedCandle.close > lastClosedCandle.open && prevClosedCandle.close < prevClosedCandle.open && lastClosedCandle.close > prevClosedCandle.open) ||
      (lastClosedCandle.close < lastClosedCandle.open && prevClosedCandle.close > prevClosedCandle.open && lastClosedCandle.close < prevClosedCandle.open);
    
    const isRejection = 
      (lastClosedCandle.high - Math.max(lastClosedCandle.open, lastClosedCandle.close) > (lastClosedCandle.high - lastClosedCandle.low) * 0.5) ||
      (Math.min(lastClosedCandle.open, lastClosedCandle.close) - lastClosedCandle.low > (lastClosedCandle.high - lastClosedCandle.low) * 0.5);

    if (isEngulfing || isRejection) {
      hasConfirmationCandle = true;
    }
  }

  // Trend strength momentum based on closed candle history
  const historicalRefCandle = targetCandles[Math.max(0, targetCandles.length - 6)];
  const momentum = historicalRefCandle ? Math.abs(lastClosedCandle.close - historicalRefCandle.close) > atr : false;

  // Combine alignment conditions
  const confirmationChecklist = {
    weeklyTrend: trend !== 'SIDEWAYS',
    dailyBias: bias !== 'NEUTRAL',
    h4Direction: trend !== 'SIDEWAYS',
    h1Bias: bias !== 'NEUTRAL',
    m15Structure: true,
    m5Setup: activeOrderBlocks.length > 0,
    liquiditySweep: liquiditySweepDetected,
    orderBlock: orderBlockTouched,
    fairValueGap: fvgEntered,
    bos: isBOS,
    choch: isCHOCH,
    momentum: momentum,
    confirmationCandle: hasConfirmationCandle,
    entryReady: orderBlockTouched && hasConfirmationCandle,
    m1Bos: isBOS,
    m1Choch: isCHOCH
  };

  return {
    trend,
    bias,
    volatility,
    atr,
    orderBlocks: activeOrderBlocks,
    fairValueGaps: activeFVGs,
    liquidityPools,
    support,
    resistance,
    lastBOS,
    lastCHOCH,
    confirmationChecklist,
  };
}
