import { useState, useMemo } from 'react';
import { TradeIdea, PerformanceStats } from '../types';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Percent,
  Layers,
  Award,
  Clock,
  Settings,
  XCircle,
  Play,
  Briefcase,
  AlertTriangle,
  History,
  HelpCircle,
  FileText,
  LineChart,
  Calendar,
  ShieldCheck
} from 'lucide-react';

interface VirtualAccountProps {
  accountBalance: number;
  onResetAccount: () => void;
  activeSetupGold: TradeIdea | null;
  activeSetupVol: TradeIdea | null;
  tradeHistoryGold: TradeIdea[];
  tradeHistoryVol: TradeIdea[];
  autoExecSettings: {
    fixedLotSize: number;
    riskPercent: number;
    positionSizeType: 'fixed' | 'risk';
    beBaseBuffer?: number;
    beAtrMultiplier?: number;
    beSpreadMultiplier?: number;
    beEnableSmartTrailing?: boolean;
    beEnableWhatsAppAlerts?: boolean;
    beEnableStatistics?: boolean;
  };
  onUpdateSettings: (settings: any) => void;
  lastTickPrice: number;
  currentMarket: 'gold' | 'vol';
}

export function VirtualAccount({
  accountBalance,
  onResetAccount,
  activeSetupGold,
  activeSetupVol,
  tradeHistoryGold,
  tradeHistoryVol,
  autoExecSettings,
  onUpdateSettings,
  lastTickPrice,
  currentMarket
}: VirtualAccountProps) {
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [activeCurve, setActiveCurve] = useState<'balance' | 'profit' | 'drawdown'>('balance');

  // Combine both market histories for a global virtual account view
  const globalHistory = useMemo(() => {
    return [...tradeHistoryGold, ...tradeHistoryVol].sort(
      (a, b) => (b.resolvedAt || b.publishedAt) - (a.resolvedAt || a.publishedAt)
    );
  }, [tradeHistoryGold, tradeHistoryVol]);

  // Helper to extract Cash Profit and Loss for a trade
  const getTradeCashPL = (trade: TradeIdea) => {
    if (trade.netProfitCash !== undefined) return trade.netProfitCash;
    const isGold = trade.id?.toLowerCase().includes('gold') || trade.id?.toLowerCase().includes('xau') || trade.marketStory?.toLowerCase().includes('gold') || trade.marketStory?.toLowerCase().includes('xau');
    const pointValue = isGold ? 100 : 1;
    const profitPoints = trade.finalProfitPts || 0;
    const lot = trade.lotSize || 0.10;
    return profitPoints * lot * pointValue;
  };

  // Chronological history (oldest first) for running computations and charts
  const chronoHistory = useMemo(() => {
    return [...globalHistory]
      .filter(t => t.state !== 'CANCELLED' && t.state !== 'EXPIRED' && t.state !== 'WAITING_FOR_ENTRY')
      .sort((a, b) => (a.resolvedAt || a.publishedAt) - (b.resolvedAt || b.publishedAt));
  }, [globalHistory]);

  // Compute live floating PnL
  const activePositions = useMemo(() => {
    const list: { trade: TradeIdea; market: 'gold' | 'vol'; floatingPL: number }[] = [];
    
    if (activeSetupGold && (activeSetupGold.state === 'TRADE_ACTIVE' || activeSetupGold.state === 'TP1_HIT' || activeSetupGold.state === 'TP2_HIT')) {
      const directionSign = activeSetupGold.direction === 'BULLISH' ? 1 : -1;
      const profitPoints = (lastTickPrice - activeSetupGold.entryPrice) * directionSign;
      const lotVal = activeSetupGold.lotSize || autoExecSettings.fixedLotSize;
      const floating = profitPoints * lotVal * 100; // Gold pointValue is 100
      list.push({ trade: activeSetupGold, market: 'gold', floatingPL: floating });
    }

    if (activeSetupVol && (activeSetupVol.state === 'TRADE_ACTIVE' || activeSetupVol.state === 'TP1_HIT' || activeSetupVol.state === 'TP2_HIT')) {
      const directionSign = activeSetupVol.direction === 'BULLISH' ? 1 : -1;
      const profitPoints = (lastTickPrice - activeSetupVol.entryPrice) * directionSign;
      const lotVal = activeSetupVol.lotSize || autoExecSettings.fixedLotSize;
      const floating = profitPoints * lotVal * 10; // Vol pointValue is 10
      list.push({ trade: activeSetupVol, market: 'vol', floatingPL: floating });
    }

    return list;
  }, [activeSetupGold, activeSetupVol, lastTickPrice, autoExecSettings.fixedLotSize]);

  const totalFloatingPL = useMemo(() => {
    return activePositions.reduce((sum, p) => sum + p.floatingPL, 0);
  }, [activePositions]);

  // Equity is current balance + current floating profit/loss
  const currentEquity = accountBalance + totalFloatingPL;

  // Margin calculation: assume a standard margin of $10 per micro-lot (0.01) for index/gold (1:100 virtual leverage)
  const marginRequired = useMemo(() => {
    return activePositions.reduce((sum, p) => sum + (p.trade.lotSize || autoExecSettings.fixedLotSize) * 1000, 0);
  }, [activePositions, autoExecSettings.fixedLotSize]);

  const availableBalance = Math.max(0, currentEquity - marginRequired);

  // Compute stats based on trade history
  const statsData = useMemo(() => {
    let runningBal = 50.00;
    let peak = 50.00;
    let maxDD = 0.00;
    let winsCount = 0;
    let lossesCount = 0;
    let breakevenCount = 0;
    let grossWins = 0;
    let grossLosses = 0;
    let largestWinVal = 0;
    let largestLossVal = 0;
    let totalHoldingTimeMs = 0;
    let tradesWithDuration = 0;

    const dataPoints: { balance: number; profit: number; drawdown: number; index: number }[] = [
      { balance: 50.00, profit: 0.00, drawdown: 0.00, index: -1 }
    ];

    chronoHistory.forEach((t, i) => {
      const cashPL = getTradeCashPL(t);
      runningBal += cashPL;
      peak = Math.max(peak, runningBal);
      const currentDD = peak > 0 ? ((peak - runningBal) / peak) * 100 : 0;
      maxDD = Math.max(maxDD, currentDD);

      if (cashPL > 0.01) {
        winsCount++;
        grossWins += cashPL;
        largestWinVal = Math.max(largestWinVal, cashPL);
      } else if (cashPL < -0.01) {
        lossesCount++;
        grossLosses += Math.abs(cashPL);
        largestLossVal = Math.min(largestLossVal, cashPL);
      } else {
        breakevenCount++;
      }

      // Compute holding time if timestamps are available
      if (t.entryTriggeredAt && t.resolvedAt) {
        totalHoldingTimeMs += (t.resolvedAt - t.entryTriggeredAt);
        tradesWithDuration++;
      }

      dataPoints.push({
        balance: runningBal,
        profit: runningBal - 50.00,
        drawdown: currentDD,
        index: i
      });
    });

    const totalTrades = chronoHistory.length;
    const winRate = totalTrades > 0 ? Math.round((winsCount / totalTrades) * 100) : 0;
    const lossRate = totalTrades > 0 ? Math.round((lossesCount / totalTrades) * 100) : 0;
    const profitFactor = grossLosses > 0 ? Number((grossWins / grossLosses).toFixed(2)) : grossWins > 0 ? 99.9 : 0;

    // Streaks
    let maxWinsStreak = 0;
    let maxLossesStreak = 0;
    let currentWinsStreak = 0;
    let currentLossesStreak = 0;

    chronoHistory.forEach(t => {
      const cashPL = getTradeCashPL(t);
      if (cashPL > 0.01) {
        currentWinsStreak++;
        currentLossesStreak = 0;
        maxWinsStreak = Math.max(maxWinsStreak, currentWinsStreak);
      } else if (cashPL < -0.01) {
        currentLossesStreak++;
        currentWinsStreak = 0;
        maxLossesStreak = Math.max(maxLossesStreak, currentLossesStreak);
      } else {
        currentWinsStreak = 0;
        currentLossesStreak = 0;
      }
    });

    // Average RR
    const totalRR = chronoHistory.reduce((sum, t) => sum + (t.finalProfitPercent || 0), 0);
    const avgRR = totalTrades > 0 ? Number((totalRR / totalTrades).toFixed(2)) : 0;

    // Average holding time string
    let avgHoldingTimeStr = "0m";
    if (tradesWithDuration > 0) {
      const avgMs = totalHoldingTimeMs / tradesWithDuration;
      const totalSecs = Math.round(avgMs / 1000);
      const mins = Math.floor(totalSecs / 60);
      const secs = totalSecs % 60;
      avgHoldingTimeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    }

    return {
      totalTrades,
      wins: winsCount,
      losses: lossesCount,
      breakeven: breakevenCount,
      winRate,
      lossRate,
      profitFactor,
      averageRR: avgRR,
      averageHoldingTime: avgHoldingTimeStr,
      largestWin: largestWinVal,
      largestLoss: largestLossVal,
      maxDrawdown: maxDD,
      winningStreak: currentWinsStreak,
      losingStreak: currentLossesStreak,
      maxWinsStreak,
      maxLossesStreak,
      growthAmt: accountBalance - 50.00,
      growthPct: ((accountBalance - 50.00) / 50.00) * 100,
      dataPoints
    };
  }, [chronoHistory, accountBalance]);

  // Group trades into Monthly Reports
  const monthlyReports = useMemo(() => {
    const monthsMap: {
      [key: string]: {
        monthName: string;
        trades: TradeIdea[];
        profit: number;
        loss: number;
        net: number;
        startBalance: number;
      };
    } = {};

    let runningBal = 50.00;

    // We process chronologically to track dynamic starting balance for each month
    chronoHistory.forEach((trade) => {
      const date = new Date(trade.publishedAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      const cashPL = getTradeCashPL(trade);

      if (!monthsMap[monthKey]) {
        monthsMap[monthKey] = {
          monthName,
          trades: [],
          profit: 0,
          loss: 0,
          net: 0,
          startBalance: runningBal
        };
      }

      monthsMap[monthKey].trades.push(trade);
      if (cashPL > 0) {
        monthsMap[monthKey].profit += cashPL;
      } else {
        monthsMap[monthKey].loss += Math.abs(cashPL);
      }
      monthsMap[monthKey].net += cashPL;

      runningBal += cashPL;
    });

    return Object.keys(monthsMap)
      .sort((a, b) => b.localeCompare(a)) // show newest month first
      .map((key) => {
        const item = monthsMap[key];
        const returnPct = item.startBalance > 0 ? (item.net / item.startBalance) * 100 : 0;

        // Best and Worst trades
        let bestTrade = 0;
        let worstTrade = 0;
        item.trades.forEach(t => {
          const cashPL = getTradeCashPL(t);
          bestTrade = Math.max(bestTrade, cashPL);
          worstTrade = Math.min(worstTrade, cashPL);
        });

        // Group sessions to find best/worst session
        const sessionsMap: { [key: string]: number } = { Tokyo: 0, London: 0, NY: 0 };
        item.trades.forEach(t => {
          const hr = new Date(t.publishedAt).getUTCHours();
          let session = "London";
          if (hr >= 0 && hr < 8) session = "Tokyo";
          else if (hr >= 16 && hr <= 23) session = "NY";
          
          sessionsMap[session] += getTradeCashPL(t);
        });

        let bestSession = "Tokyo";
        let worstSession = "London";
        let maxSessNet = -Infinity;
        let minSessNet = Infinity;

        Object.keys(sessionsMap).forEach(sess => {
          if (sessionsMap[sess] > maxSessNet) {
            maxSessNet = sessionsMap[sess];
            bestSession = sess;
          }
          if (sessionsMap[sess] < minSessNet) {
            minSessNet = sessionsMap[sess];
            worstSession = sess;
          }
        });

        // Average Daily Return
        const daysMap: { [key: string]: number } = {};
        item.trades.forEach(t => {
          const dayStr = new Date(t.publishedAt).toDateString();
          daysMap[dayStr] = (daysMap[dayStr] || 0) + getTradeCashPL(t);
        });
        const dailyNetValues = Object.values(daysMap);
        const avgDailyReturn = dailyNetValues.length > 0 
          ? dailyNetValues.reduce((s, v) => s + v, 0) / dailyNetValues.length 
          : 0;

        return {
          monthName: item.monthName,
          profit: item.profit,
          loss: item.loss,
          net: item.net,
          returnPct,
          bestTrade,
          worstTrade,
          bestSession: maxSessNet > 0 ? `${bestSession} ($${maxSessNet.toFixed(2)})` : "N/A",
          worstSession: minSessNet < 0 ? `${worstSession} ($${minSessNet.toFixed(2)})` : "N/A",
          avgDailyReturn
        };
      });
  }, [chronoHistory]);

  // Equity Curve Chart SVG helpers
  const svgChart = useMemo(() => {
    const width = 600;
    const height = 180;
    const pts = statsData.dataPoints;

    if (pts.length <= 1) return { width, height, linePath: "", areaPath: "", drawLinePath: "", maxVal: 50, minVal: 50 };

    let values: number[] = [];
    if (activeCurve === 'balance') values = pts.map(p => p.balance);
    else if (activeCurve === 'profit') values = pts.map(p => p.profit);
    else values = pts.map(p => p.drawdown);

    const maxVal = Math.max(...values, activeCurve === 'drawdown' ? 10 : 50) * 1.05;
    const minVal = Math.min(...values, activeCurve === 'drawdown' ? 0 : 45) * 0.95;
    const valRange = maxVal - minVal || 1.0;

    const getX = (index: number) => {
      return (index + 1) * (width / (pts.length - 1));
    };

    const getY = (val: number) => {
      return height - ((val - minVal) / valRange) * height;
    };

    const coords = pts.map((p, idx) => {
      const val = activeCurve === 'balance' ? p.balance : activeCurve === 'profit' ? p.profit : p.drawdown;
      return `${getX(idx - 1).toFixed(1)},${getY(val).toFixed(1)}`;
    });

    const linePath = coords.join(" ");
    
    // Polyfill area path for shaded gradient
    const firstX = getX(-1).toFixed(1);
    const lastX = getX(pts.length - 2).toFixed(1);
    const bottomY = height.toFixed(1);
    const areaPath = `${firstX},${bottomY} ${linePath} ${lastX},${bottomY}`;

    return {
      width,
      height,
      linePath,
      areaPath,
      maxVal,
      minVal,
      points: pts.map((p, idx) => ({
        x: getX(idx - 1),
        y: getY(activeCurve === 'balance' ? p.balance : activeCurve === 'profit' ? p.profit : p.drawdown),
        val: activeCurve === 'balance' ? p.balance : activeCurve === 'profit' ? p.profit : p.drawdown,
        isWin: idx > 0 ? getTradeCashPL(chronoHistory[idx - 1]) > 0 : true
      }))
    };
  }, [statsData.dataPoints, activeCurve, chronoHistory]);

  const handleConfirmReset = () => {
    if (window.confirm("Reset the virtual account back to $50 and delete all virtual trades?")) {
      onResetAccount();
    }
  };

  return (
    <div id="virtual-account-module" className="space-y-6">
      
      {/* HEADER BANNER */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-lg">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-sans font-bold text-white tracking-tight">Institutional Virtual Account</h1>
              <p className="text-xs text-slate-400 font-mono">Simulating real-time AI trading strategy on live Deriv feed</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleConfirmReset}
          className="px-5 py-2.5 bg-rose-950/40 text-rose-400 border border-rose-900/50 hover:bg-rose-950/70 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-md"
        >
          <XCircle className="h-4 w-4" /> RESET ACCOUNT
        </button>
      </div>

      {/* CORE STATS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1 relative">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono block">Current Balance</span>
          <div className="text-xl font-mono font-bold text-white">${accountBalance.toFixed(2)}</div>
          <div className="text-[10px] text-slate-500 font-mono">Virtual equity bank</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono block">Equity</span>
          <div className="text-xl font-mono font-bold text-amber-500">${currentEquity.toFixed(2)}</div>
          <div className="text-[10px] text-slate-500 font-mono">Balance + Floating PnL</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono block">Floating P&L</span>
          <div className={`text-xl font-mono font-bold flex items-center gap-1 ${
            totalFloatingPL > 0.01 ? 'text-emerald-400' : totalFloatingPL < -0.01 ? 'text-rose-400' : 'text-slate-400'
          }`}>
            {totalFloatingPL > 0.01 ? '+' : ''}${totalFloatingPL.toFixed(2)}
            {totalFloatingPL > 0.01 ? (
              <ArrowUpRight className="h-4 w-4 shrink-0" />
            ) : totalFloatingPL < -0.01 ? (
              <ArrowDownRight className="h-4 w-4 shrink-0" />
            ) : null}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">Running live positions</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono block">Available Balance</span>
          <div className="text-xl font-mono font-bold text-emerald-400">${availableBalance.toFixed(2)}</div>
          <div className="text-[10px] text-slate-500 font-mono">Equity - Used Margin</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 col-span-2 md:col-span-1 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono block">Account Growth</span>
          <div className={`text-xl font-mono font-bold ${
            statsData.growthAmt >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {statsData.growthAmt >= 0 ? '+' : ''}${statsData.growthAmt.toFixed(2)} ({statsData.growthPct.toFixed(2)}%)
          </div>
          <div className="text-[10px] text-slate-500 font-mono">Benchmark baseline $50</div>
        </div>

      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        
        <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-3 text-center">
          <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono block">Win Rate</span>
          <span className="text-lg font-bold text-white font-mono">{statsData.winRate}%</span>
        </div>

        <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-3 text-center">
          <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono block">Max Drawdown</span>
          <span className="text-lg font-bold text-rose-400 font-mono">{statsData.maxDrawdown.toFixed(2)}%</span>
        </div>

        <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-3 text-center">
          <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono block">Winning Streak</span>
          <span className="text-lg font-bold text-emerald-400 font-mono">{statsData.winningStreak}</span>
        </div>

        <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-3 text-center">
          <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono block">Losing Streak</span>
          <span className="text-lg font-bold text-rose-400 font-mono">{statsData.losingStreak}</span>
        </div>

        <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-3 text-center col-span-2 md:col-span-1">
          <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono block">Total Return %</span>
          <span className={`text-lg font-bold font-mono ${statsData.growthPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {statsData.growthPct >= 0 ? '+' : ''}{statsData.growthPct.toFixed(2)}%
          </span>
        </div>

      </div>

      {/* CORE CONTROL GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COLUMN 1: POSITION SIZING CONFIG (col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* POSITION SIZING SETTINGS */}
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-xs font-sans font-black text-slate-300 uppercase tracking-widest flex items-center gap-2 border-b border-slate-800 pb-3">
              <Settings className="h-4 w-4 text-amber-500" /> Virtual Position Sizing
            </h2>

            <div className="space-y-3">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Sizing Engine Mode</label>
              <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-850">
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ positionSizeType: 'fixed' })}
                  className={`flex-1 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    autoExecSettings.positionSizeType === 'fixed'
                      ? 'bg-slate-800 text-amber-500 font-black'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Fixed Lots
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ positionSizeType: 'risk' })}
                  className={`flex-1 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    autoExecSettings.positionSizeType === 'risk'
                      ? 'bg-slate-800 text-amber-500 font-black'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Risk % Per Trade
                </button>
              </div>
            </div>

            {autoExecSettings.positionSizeType === 'fixed' ? (
              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  Fixed Lot Size
                  <HelpCircle className="h-3 w-3 text-slate-500 hover:text-white cursor-help" onClick={() => setShowTooltip(showTooltip === 'lot' ? null : 'lot')} />
                </label>
                {showTooltip === 'lot' && (
                  <p className="text-[9px] text-amber-400 bg-amber-500/5 p-2 rounded border border-amber-500/15 font-mono">
                    Every virtual trade will execute with exactly this lot size, regardless of stop-loss width.
                  </p>
                )}
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="1.00"
                  value={autoExecSettings.fixedLotSize}
                  onChange={(e) => onUpdateSettings({ fixedLotSize: parseFloat(e.target.value) || 0.01 })}
                  className="w-full bg-slate-950 text-white border border-slate-850 rounded px-3 py-2 text-xs font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  Percentage Risk Per Trade (%)
                  <HelpCircle className="h-3 w-3 text-slate-500 hover:text-white cursor-help" onClick={() => setShowTooltip(showTooltip === 'risk' ? null : 'risk')} />
                </label>
                {showTooltip === 'risk' && (
                  <p className="text-[9px] text-amber-400 bg-amber-500/5 p-2 rounded border border-amber-500/15 font-mono">
                    Dynamically calculates lot size so that the Stop Loss equals exactly this percentage of account balance (Baseline 1% is $0.50).
                  </p>
                )}
                <div className="flex items-center bg-slate-950 rounded border border-slate-850 px-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="10.0"
                    value={autoExecSettings.riskPercent}
                    onChange={(e) => onUpdateSettings({ riskPercent: parseFloat(e.target.value) || 1.0 })}
                    className="w-full bg-transparent text-white py-2 text-xs font-mono focus:outline-none"
                  />
                  <Percent className="h-3.5 w-3.5 text-slate-500" />
                </div>
              </div>
            )}

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-850 text-[10px] space-y-1.5 text-slate-400 font-mono">
              <span className="text-amber-500 font-bold">CALCULATOR SIMULATOR:</span>
              <div>Selected: <span className="text-white">{autoExecSettings.positionSizeType === 'fixed' ? 'Fixed Volume' : `Risk ${autoExecSettings.riskPercent}%`}</span></div>
              <div>Standard risk amount: <span className="text-white">${(accountBalance * (autoExecSettings.riskPercent / 100)).toFixed(2)}</span></div>
              <div>Minimum Lot Limit: <span className="text-slate-500">0.01 Lots</span></div>
            </div>
          </section>

          {/* SMART BREAK-EVEN PROTECTION V2 SETTINGS */}
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-xs font-sans font-black text-slate-300 uppercase tracking-widest flex items-center gap-2 border-b border-slate-800 pb-3">
              <ShieldCheck className="h-4 w-4 text-amber-500" /> Smart Break-Even V2
            </h2>

            {/* Base Buffer */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex justify-between items-center">
                <span>Base Buffer (points)</span>
                <span className="text-amber-500 font-mono font-bold">{autoExecSettings.beBaseBuffer ?? 0.20}</span>
              </label>
              <input
                type="number"
                step="0.05"
                min="0.05"
                max="5.0"
                value={autoExecSettings.beBaseBuffer ?? 0.20}
                onChange={(e) => onUpdateSettings({ beBaseBuffer: parseFloat(e.target.value) || 0.20 })}
                className="w-full bg-slate-950 text-white border border-slate-850 rounded px-3 py-2 text-xs font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* ATR Multiplier */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex justify-between items-center">
                <span>ATR Multiplier (e.g. 0.10)</span>
                <span className="text-amber-500 font-mono font-bold">{autoExecSettings.beAtrMultiplier ?? 0.10}</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="2.0"
                value={autoExecSettings.beAtrMultiplier ?? 0.10}
                onChange={(e) => onUpdateSettings({ beAtrMultiplier: parseFloat(e.target.value) || 0.10 })}
                className="w-full bg-slate-950 text-white border border-slate-850 rounded px-3 py-2 text-xs font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Spread Multiplier */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex justify-between items-center">
                <span>Spread Multiplier</span>
                <span className="text-amber-500 font-mono font-bold">{autoExecSettings.beSpreadMultiplier ?? 1.5}</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="5.0"
                value={autoExecSettings.beSpreadMultiplier ?? 1.5}
                onChange={(e) => onUpdateSettings({ beSpreadMultiplier: parseFloat(e.target.value) || 1.5 })}
                className="w-full bg-slate-950 text-white border border-slate-850 rounded px-3 py-2 text-xs font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Toggle Switches */}
            <div className="space-y-3 pt-2 border-t border-slate-800/60">
              {/* Enable Smart Trailing */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-white font-bold uppercase tracking-wider block">Smart Trailing</span>
                  <span className="text-[9px] text-slate-400 font-mono">Trail with market structure only</span>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ beEnableSmartTrailing: !autoExecSettings.beEnableSmartTrailing })}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                    autoExecSettings.beEnableSmartTrailing ? 'bg-emerald-500' : 'bg-slate-800'
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ease-in-out ${
                    autoExecSettings.beEnableSmartTrailing ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Enable WhatsApp Alerts */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-white font-bold uppercase tracking-wider block">WhatsApp Alerts</span>
                  <span className="text-[9px] text-slate-400 font-mono">Send 🛡️ TRADE PROTECTED alerts</span>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ beEnableWhatsAppAlerts: !autoExecSettings.beEnableWhatsAppAlerts })}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                    autoExecSettings.beEnableWhatsAppAlerts ? 'bg-emerald-500' : 'bg-slate-800'
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ease-in-out ${
                    autoExecSettings.beEnableWhatsAppAlerts ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Enable Break-Even Statistics */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-white font-bold uppercase tracking-wider block">BE Analytics v2</span>
                  <span className="text-[9px] text-slate-400 font-mono">Enable capital defense dashboard</span>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ beEnableStatistics: !autoExecSettings.beEnableStatistics })}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                    autoExecSettings.beEnableStatistics !== false ? 'bg-emerald-500' : 'bg-slate-800'
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ease-in-out ${
                    autoExecSettings.beEnableStatistics !== false ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>
          </section>

          {/* ACTIVE VIRTUAL POSITIONS */}
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-xs font-sans font-black text-slate-300 uppercase tracking-widest flex items-center gap-2 border-b border-slate-800 pb-3">
              <Briefcase className="h-4 w-4 text-emerald-500" /> Active Positions ({activePositions.length})
            </h2>

            {activePositions.length === 0 ? (
              <div className="py-8 text-center bg-slate-950/40 rounded-lg border border-slate-850 border-dashed">
                <RefreshCw className="h-6 w-6 text-slate-600 mx-auto mb-2 animate-spin" />
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Hands Flat / No Trades Active</p>
                <p className="text-[9px] text-slate-500 mt-1">Automatically following live Sniper AI signals...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activePositions.map(({ trade, market, floatingPL }) => (
                  <div key={trade.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-xs font-bold text-white uppercase">{market === 'gold' ? 'Spot Gold' : 'Volatility Index'}</span>
                        <span className="text-[9px] text-slate-500 font-mono ml-2">#{trade.id.substring(6, 12)}</span>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        trade.direction === 'BULLISH' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/30' : 'bg-rose-950 text-rose-400 border border-rose-900/30'
                      }`}>
                        {trade.direction === 'BULLISH' ? 'BUY' : 'SELL'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
                      <div>
                        <span className="text-slate-500 block">Entry</span>
                        <span className="text-slate-300 font-bold">${trade.entryPrice.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Lot Size</span>
                        <span className="text-slate-300 font-bold">{trade.lotSize?.toFixed(2) || autoExecSettings.fixedLotSize}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Floating PL</span>
                        <span className={`font-black ${floatingPL > 0 ? 'text-emerald-400' : floatingPL < 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                          {floatingPL > 0 ? '+' : ''}${floatingPL.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[8px] uppercase tracking-wider font-mono text-slate-500">
                        <span>StopLoss: ${trade.stopLoss.toFixed(2)}</span>
                        <span>TP1: ${trade.tp1.toFixed(2)}</span>
                        <span>TP3: ${trade.tp3.toFixed(2)}</span>
                      </div>
                      <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${floatingPL > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                          style={{ width: `${Math.min(100, Math.max(10, ((lastTickPrice - trade.entryPrice) / (trade.tp3 - trade.entryPrice)) * 100))}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>

        {/* COLUMN 2 & 3: CHARTS & REPORTS (col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* EQUITY CURVE VISUALIZER */}
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-800 pb-3">
              <h2 className="text-xs font-sans font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                <LineChart className="h-4 w-4 text-amber-500" /> Strategy Equity Curve
              </h2>
              <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-850">
                <button
                  onClick={() => setActiveCurve('balance')}
                  className={`px-3 py-1 rounded text-[9px] font-bold uppercase tracking-wider cursor-pointer ${
                    activeCurve === 'balance' ? 'bg-slate-800 text-amber-400' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Balance
                </button>
                <button
                  onClick={() => setActiveCurve('profit')}
                  className={`px-3 py-1 rounded text-[9px] font-bold uppercase tracking-wider cursor-pointer ${
                    activeCurve === 'profit' ? 'bg-slate-800 text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Profit PnL
                </button>
                <button
                  onClick={() => setActiveCurve('drawdown')}
                  className={`px-3 py-1 rounded text-[9px] font-bold uppercase tracking-wider cursor-pointer ${
                    activeCurve === 'drawdown' ? 'bg-slate-800 text-rose-400' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Drawdown %
                </button>
              </div>
            </div>

            {chronoHistory.length === 0 ? (
              <div className="py-12 text-center bg-slate-950/25 rounded-lg border border-slate-850 border-dashed">
                <History className="h-8 w-8 text-slate-700 mx-auto mb-2" />
                <p className="text-xs text-slate-400 uppercase tracking-wider font-mono">Awaiting completed trades to plot curve</p>
                <p className="text-[10px] text-slate-500 mt-1">Let the Sniper AI trigger and resolve some trades...</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-full h-[180px] relative bg-slate-950/60 p-2 rounded-lg border border-slate-850 overflow-hidden">
                  <svg viewBox={`0 0 ${svgChart.width} ${svgChart.height}`} className="w-full h-full overflow-visible">
                    <defs>
                      <linearGradient id="curve-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={activeCurve === 'balance' ? '#f59e0b' : activeCurve === 'profit' ? '#10b981' : '#f43f5e'} stopOpacity="0.15" />
                        <stop offset="100%" stopColor={activeCurve === 'balance' ? '#f59e0b' : activeCurve === 'profit' ? '#10b981' : '#f43f5e'} stopOpacity="0.00" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal grid lines */}
                    {Array.from({ length: 4 }).map((_, i) => {
                      const y = (svgChart.height / 4) * i;
                      const val = svgChart.maxVal - ((svgChart.maxVal - svgChart.minVal) / 4) * i;
                      return (
                        <g key={i}>
                          <line x1="0" y1={y} x2={svgChart.width} y2={y} stroke="#1e293b" strokeWidth="0.8" strokeDasharray="3 3" />
                          <text x="5" y={y - 4} fill="#64748b" className="text-[8px] font-mono">{activeCurve === 'drawdown' ? `${val.toFixed(1)}%` : `$${val.toFixed(2)}`}</text>
                        </g>
                      );
                    })}

                    {/* Shaded Area */}
                    {svgChart.points.length > 1 && (
                      <polygon points={svgChart.areaPath} fill="url(#curve-grad)" />
                    )}

                    {/* Polyline Path */}
                    <polyline
                      fill="none"
                      stroke={activeCurve === 'balance' ? '#f59e0b' : activeCurve === 'profit' ? '#10b981' : '#f43f5e'}
                      strokeWidth="2"
                      points={svgChart.linePath}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Circles on Nodes */}
                    {svgChart.points.map((pt, idx) => (
                      <circle
                        key={idx}
                        cx={pt.x}
                        cy={pt.y}
                        r="3"
                        fill={idx === 0 ? "#475569" : pt.isWin ? "#10b981" : "#f43f5e"}
                        stroke="#020617"
                        strokeWidth="1"
                      />
                    ))}
                  </svg>
                </div>
                <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono">
                  <span>Start (Baseline $50.00)</span>
                  <span>{statsData.totalTrades} trades resolved</span>
                  <span>Latest: ${accountBalance.toFixed(2)}</span>
                </div>
              </div>
            )}
          </section>

          {/* PERFORMANCE DASHBOARD SUMMARY */}
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-xs font-sans font-black text-slate-300 uppercase tracking-widest flex items-center gap-2 border-b border-slate-800 pb-3">
              <Award className="h-4 w-4 text-amber-500" /> Virtual Portfolio Analytics
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-850/60 font-mono space-y-1">
                <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Total Executions</span>
                <span className="text-sm font-bold text-white block">{statsData.totalTrades} trades</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-850/60 font-mono space-y-1">
                <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Winning Trades</span>
                <span className="text-sm font-bold text-emerald-400 block">{statsData.wins} / {statsData.totalTrades}</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-850/60 font-mono space-y-1">
                <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Losing Trades</span>
                <span className="text-sm font-bold text-rose-400 block">{statsData.losses} / {statsData.totalTrades}</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-850/60 font-mono space-y-1">
                <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Breakeven Trades</span>
                <span className="text-sm font-bold text-slate-400 block">{statsData.breakeven} trades</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-850/60 font-mono space-y-1">
                <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Profit Factor</span>
                <span className={`text-sm font-bold block ${statsData.profitFactor >= 1.5 ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {statsData.profitFactor === 99.9 ? '∞ (No Losses)' : statsData.profitFactor}
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-850/60 font-mono space-y-1">
                <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Average Achieved RR</span>
                <span className="text-sm font-bold text-white block">1:{statsData.averageRR}</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-850/60 font-mono space-y-1">
                <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Average Holding Time</span>
                <span className="text-sm font-bold text-white block">{statsData.averageHoldingTime}</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-850/60 font-mono space-y-1">
                <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Peak Win Streak</span>
                <span className="text-sm font-bold text-emerald-400 block">{statsData.maxWinsStreak} consecutive</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-850/60 font-mono space-y-1">
                <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Largest Winner</span>
                <span className="text-sm font-bold text-emerald-400 block">${statsData.largestWin.toFixed(2)}</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-850/60 font-mono space-y-1">
                <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Largest Loser</span>
                <span className="text-sm font-bold text-rose-400 block">-${Math.abs(statsData.largestLoss).toFixed(2)}</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-850/60 font-mono space-y-1">
                <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Baseline Balance</span>
                <span className="text-sm font-bold text-slate-400 block">$50.00</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-850/60 font-mono space-y-1">
                <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Current Equity</span>
                <span className="text-sm font-bold text-amber-500 block">${currentEquity.toFixed(2)}</span>
              </div>

            </div>
          </section>

          {/* MONTHLY REPORT */}
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-xs font-sans font-black text-slate-300 uppercase tracking-widest flex items-center gap-2 border-b border-slate-800 pb-3">
              <Calendar className="h-4 w-4 text-amber-500" /> Monthly Audit Reports ({monthlyReports.length})
            </h2>

            {monthlyReports.length === 0 ? (
              <div className="py-8 text-center bg-slate-950/40 rounded-lg border border-slate-850 border-dashed">
                <FileText className="h-8 w-8 text-slate-700 mx-auto mb-2" />
                <p className="text-xs text-slate-400 uppercase tracking-wider font-mono">No monthly archives recorded yet</p>
                <p className="text-[10px] text-slate-500 mt-1">SMC paper-trading reports compile at month-end intervals.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {monthlyReports.map((rep, idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-850 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-800/85 pb-2">
                      <span className="text-xs font-bold text-white uppercase">{rep.monthName}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        rep.net >= 0 ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/30' : 'bg-rose-950/50 text-rose-400 border border-rose-900/30'
                      }`}>
                        {rep.net >= 0 ? '+' : ''}{rep.returnPct.toFixed(2)}% Return
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px] font-mono">
                      <div>
                        <span className="text-slate-500 block">Monthly Profit</span>
                        <span className="text-emerald-400 font-bold">${rep.profit.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Monthly Loss</span>
                        <span className="text-rose-400 font-bold">-${rep.loss.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Best Trade Winner</span>
                        <span className="text-emerald-400 font-bold">${rep.bestTrade.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Worst Trade Loser</span>
                        <span className="text-rose-400 font-bold">-${Math.abs(rep.worstTrade).toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-[10px] font-mono pt-2 border-t border-slate-850/40">
                      <div>
                        <span className="text-slate-500 block">Best Trading Session</span>
                        <span className="text-slate-300 font-bold">{rep.bestSession}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Worst Trading Session</span>
                        <span className="text-slate-300 font-bold">{rep.worstSession}</span>
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <span className="text-slate-500 block">Avg. Daily Net Return</span>
                        <span className={`font-bold ${rep.avgDailyReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {rep.avgDailyReturn >= 0 ? '+' : ''}${rep.avgDailyReturn.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>

      </div>

    </div>
  );
}
