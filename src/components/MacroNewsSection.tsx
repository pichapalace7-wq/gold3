import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  Sliders, 
  Plus, 
  Play, 
  History, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  Calendar, 
  Bell, 
  Activity, 
  Zap, 
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { 
  MacroEconomicEvent, 
  EconomicNewsHistoryItem, 
  EconomicImpactLevel, 
  AIRecommendationDecision 
} from '../types';

interface MacroNewsSectionProps {
  currentPrice: number;
  onAddAlert: (type: string, message: string, severity: 'high' | 'medium' | 'info') => void;
  onPriceShock?: (direction: 'BULLISH' | 'BEARISH', magnitude: number) => void;
  isAutoExecutionEnabled?: boolean;
}

export const MacroNewsSection: React.FC<MacroNewsSectionProps> = ({ 
  currentPrice, 
  onAddAlert, 
  onPriceShock,
  isAutoExecutionEnabled = false
}) => {
  // Current tab local state
  const [newsTab, setNewsTab] = useState<'upcoming' | 'history' | 'add_event'>('upcoming');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  
  // Custom event form state
  const [formEventName, setFormEventName] = useState('');
  const [formCountry, setFormCountry] = useState('US');
  const [formCurrency, setFormCurrency] = useState('USD');
  const [formImpact, setFormImpact] = useState<EconomicImpactLevel>('HIGH');
  const [formPrevious, setFormPrevious] = useState('');
  const [formForecast, setFormForecast] = useState('');
  const [formMinutesUntil, setFormMinutesUntil] = useState('10');

  // Core dynamic calendar events
  const [events, setEvents] = useState<MacroEconomicEvent[]>(() => {
    const saved = localStorage.getItem('macro_news_events');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing saved macro events:", e);
      }
    }

    const now = Date.now();
    return [
      {
        id: 'ev-cpi-us',
        eventName: 'Consumer Price Index (CPI) MoM / YoY',
        country: 'US',
        currency: 'USD',
        impactLevel: 'HIGH',
        previous: '3.3%',
        forecast: '3.1%',
        releaseTime: now + 18 * 60 * 1000, // 18 Minutes from now (corresponds to CPI 18 mins example!)
        marketBiasAnalysis: {
          currentInstitutionalBias: 'NEUTRAL',
          expectedVolatility: 'VERY_HIGH',
          potentialGoldBias: 'Bullish if inflation comes in below expectations. Bearish if inflation exceeds expectations.',
          confidence: 82,
          reasoning: 'Lower-than-expected inflation may increase expectations of future rate cuts, which has historically supported Gold. Higher-than-expected inflation may strengthen expectations for tighter monetary policy, which can pressure Gold.'
        },
        scenarios: {
          greaterThanForecast: {
            condition: 'CPI > 3.1%',
            likelyBias: 'BEARISH',
            reason: 'Strengthens expectations for higher-for-longer interest rates. Bond yields and USD expand, aggressively compressing non-yielding Spot Gold.'
          },
          lessThanForecast: {
            condition: 'CPI < 3.1%',
            likelyBias: 'BULLISH',
            reason: 'Solidifies institutional expectations for an imminent Federal Reserve rate cut. Yields collapse, driving rapid capital inflow into Spot Gold.'
          },
          approxForecast: {
            condition: 'CPI ≈ 3.1%',
            likelyBias: 'NEUTRAL',
            reason: 'Consolidates within the existing session range. Minor volatility whipsaws both ways as algorithmic programs sweep local liquidity pools.'
          }
        },
        aiTradingImpact: {
          decision: 'AVOID_NEW_TRADES',
          reason: 'High-impact event with elevated volatility risk. Suspension of automated entry limits recommended to safeguard margins.'
        }
      },
      {
        id: 'ev-fomc-rate',
        eventName: 'FOMC Interest Rate Decision',
        country: 'US',
        currency: 'USD',
        impactLevel: 'HIGH',
        previous: '5.25%',
        forecast: '5.25%',
        releaseTime: now + 2 * 60 * 60 * 1000 + 18 * 60 * 1000, // 2h 18m from now
        marketBiasAnalysis: {
          currentInstitutionalBias: 'NEUTRAL',
          expectedVolatility: 'VERY_HIGH',
          potentialGoldBias: 'Conditional (Depends on Statement and Dot Plot)',
          confidence: 85,
          reasoning: 'While rates are expected to hold steady, any shifts in the Dot Plot or Powell’s post-meeting press conference language regarding monetary easing will trigger massive macro volatility.'
        },
        scenarios: {
          greaterThanForecast: {
            condition: 'Rate Cut Deferred / Hawkish Dot Plot',
            likelyBias: 'BEARISH',
            reason: 'Sellers swarm Gold as higher real yields increase the opportunity cost of holding non-yielding metals. Dollar Index (DXY) breaks out.'
          },
          lessThanForecast: {
            condition: 'Rate Cut Initiated / Dovish Dot Plot',
            likelyBias: 'BULLISH',
            reason: 'Massive institutional buy program triggered. Liquidity flows out of Treasury bonds and Cash, sending Gold to record-breaking expansion highs.'
          },
          approxForecast: {
            condition: 'Rate Steady / Balanced Guidance',
            likelyBias: 'NEUTRAL',
            reason: 'Initial volatility surge as algos scan the statement. Price ranges inside previous daily high and low boundaries.'
          }
        },
        aiTradingImpact: {
          decision: 'PAUSE_TRADING',
          reason: 'Severe interest rate risk event. Standard risk models completely fail during interest rate decisions. Pause trading until statement is absorbed.'
        }
      },
      {
        id: 'ev-nfp-us',
        eventName: 'Non-Farm Payrolls (NFP) & Unemployment Rate',
        country: 'US',
        currency: 'USD',
        impactLevel: 'HIGH',
        previous: '218K',
        forecast: '185K',
        releaseTime: now + 6 * 60 * 60 * 1000, // 6h from now
        marketBiasAnalysis: {
          currentInstitutionalBias: 'BULLISH',
          expectedVolatility: 'HIGH',
          potentialGoldBias: 'Bullish if labor market cooling is verified. Bearish if NFP significantly beats forecast.',
          confidence: 78,
          reasoning: 'Cooler labor statistics pave a smooth path for interest rate cuts. A hot job market gives the Fed room to remain hawkish, boosting USD at Golds expense.'
        },
        scenarios: {
          greaterThanForecast: {
            condition: 'NFP > 195K / Unemployment falls',
            likelyBias: 'BEARISH',
            reason: 'Indicates robust economic resilience, giving the central bank license to delay rate cuts. Bears seek to target Sell-Side Liquidity (SSL).'
          },
          lessThanForecast: {
            condition: 'NFP < 175K / Unemployment rises',
            likelyBias: 'BULLISH',
            reason: 'Signals macro cooling and labor stress. Rate cut expectations advance. Spot Gold aggressively bids toward Buy-Side Liquidity (BSL).'
          },
          approxForecast: {
            condition: 'NFP ≈ 185K / Balanced metrics',
            likelyBias: 'NEUTRAL',
            reason: 'Whipsaw reaction in the first 5 minutes, followed by a drift back into the pre-news consolidation value area.'
          }
        },
        aiTradingImpact: {
          decision: 'DELAY_ENTRY',
          reason: 'High volatility payroll expansion. Delay entries until 15 minutes post-release to allow spreads to compress and market direction to solidify.'
        }
      },
      {
        id: 'ev-gdp-us',
        eventName: 'GDP Growth Rate QoQ (Advance)',
        country: 'US',
        currency: 'USD',
        impactLevel: 'HIGH',
        previous: '1.6%',
        forecast: '1.8%',
        releaseTime: now + 24 * 60 * 60 * 1000, // 24h from now
        marketBiasAnalysis: {
          currentInstitutionalBias: 'BULLISH',
          expectedVolatility: 'MEDIUM',
          potentialGoldBias: 'Bullish if GDP slows (stagflation hedge). Bearish if growth exceeds expectations.',
          confidence: 72,
          reasoning: 'Strong GDP growth reinforces a resilient economy, supporting higher interest rates. Weak GDP sparks recession anxieties, driving flight-to-safety flows into Gold.'
        },
        scenarios: {
          greaterThanForecast: {
            condition: 'GDP > 2.0%',
            likelyBias: 'BEARISH',
            reason: 'Gold slides as yields rally on expectations of robust economic expansion keeping interest rates elevated.'
          },
          lessThanForecast: {
            condition: 'GDP < 1.5%',
            likelyBias: 'BULLISH',
            reason: 'Prompts safe-haven buying. Gold gains on recession risk and rising expectations of aggressive central bank liquidity injection.'
          },
          approxForecast: {
            condition: 'GDP ≈ 1.8%',
            likelyBias: 'NEUTRAL',
            reason: 'Minimal deviation triggers quiet trading inside the established daily boundaries with steady order book liquidity.'
          }
        },
        aiTradingImpact: {
          decision: 'REDUCE_CONFIDENCE',
          reason: 'Medium-to-high impact economic growth data. Reduce position size by 50% and widen stop-loss boundaries to account for spread widening.'
        }
      }
    ];
  });

  // News history database state
  const [history, setHistory] = useState<EconomicNewsHistoryItem[]>(() => {
    const saved = localStorage.getItem('macro_news_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing saved macro history:", e);
      }
    }

    const now = Date.now();
    return [
      {
        id: 'h-cpi-jun',
        eventName: 'Core CPI YoY (June Release)',
        date: now - 3 * 24 * 60 * 60 * 1000,
        forecast: '3.4%',
        actual: '3.3%',
        previous: '3.4%',
        goldReaction: 'BULLISH',
        highestPriceMove: 24.50,
        lowestPriceMove: -3.20,
        volatility: 'HIGH',
        aiPrediction: 'Bullish if CPI < 3.4%',
        outcome: 'SUCCESS'
      },
      {
        id: 'h-nfp-jun',
        eventName: 'US Non-Farm Payrolls (June Release)',
        date: now - 7 * 24 * 60 * 60 * 1000,
        forecast: '190K',
        actual: '206K',
        previous: '215K',
        goldReaction: 'BEARISH',
        highestPriceMove: 4.80,
        lowestPriceMove: -18.60,
        volatility: 'HIGH',
        aiPrediction: 'Bearish if NFP > 190K',
        outcome: 'SUCCESS'
      },
      {
        id: 'h-pce-may',
        eventName: 'US Core PCE Price Index MoM',
        date: now - 12 * 24 * 60 * 60 * 1000,
        forecast: '0.1%',
        actual: '0.1%',
        previous: '0.2%',
        goldReaction: 'NEUTRAL',
        highestPriceMove: 6.20,
        lowestPriceMove: -5.40,
        volatility: 'MEDIUM',
        aiPrediction: 'Neutral on exact match',
        outcome: 'SUCCESS'
      }
    ];
  });

  // Simulation actual values helpers
  const [simActualValue, setSimActualValue] = useState<string>('');
  const [isSimulatingRelease, setIsSimulatingRelease] = useState<string | null>(null);

  // Stabilize alert callback ref
  const onAddAlertRef = useRef(onAddAlert);
  useEffect(() => {
    onAddAlertRef.current = onAddAlert;
  });

  // Sync to local storage on change
  useEffect(() => {
    localStorage.setItem('macro_news_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('macro_news_history', JSON.stringify(history));
  }, [history]);

  // Live countdown timer and alert trigger loop
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      let updated = false;

      const nextEvents = events.map(ev => {
        const remainingMs = ev.releaseTime - now;
        const remainingMinutes = Math.floor(remainingMs / 60000);

        // Clones event to mutate
        let clone = { ...ev };

        // 60 Minutes Notification Alert
        if (remainingMinutes === 60 && !clone.notified60) {
          clone.notified60 = true;
          onAddAlertRef.current?.('MACRO_RISK', `⚠️ 60 MINUTES UNTIL ${clone.eventName}: High volatility expected. Assess pending sniper limits.`, 'medium');
          updated = true;
        }

        // 30 Minutes Notification Alert
        if (remainingMinutes === 30 && !clone.notified30) {
          clone.notified30 = true;
          onAddAlertRef.current?.('MACRO_RISK', `⚠️ 30 MINUTES UNTIL ${clone.eventName}: AI Decision updated to Avoid New Trades.`, 'medium');
          updated = true;
        }

        // 15 Minutes Notification Alert
        if (remainingMinutes === 15 && !clone.notified15) {
          clone.notified15 = true;
          onAddAlertRef.current?.('MACRO_RISK', `🚨 15 MINUTES UNTIL ${clone.eventName}: Trading limits highly restricted. Volatility warning.`, 'high');
          updated = true;
        }

        // 5 Minutes Notification Alert
        if (remainingMinutes === 5 && !clone.notified5) {
          clone.notified5 = true;
          onAddAlertRef.current?.('MACRO_RISK', `🔥 5 MINUTES UNTIL ${clone.eventName} RELEASE: Dynamic spread protective offsets active.`, 'high');
          updated = true;
        }

        // Auto release if countdown reaches 0 and has not been released yet
        if (remainingMs <= 0 && !clone.actual && !clone.notifiedReleased) {
          clone.notifiedReleased = true;
          updated = true;
          
          // Auto release simulation logic with random deviation
          const forecastNum = parseFloat(clone.forecast);
          const deviation = (Math.random() - 0.5) * 0.4; // random variance
          const finalActualVal = (forecastNum + deviation).toFixed(1) + (clone.forecast.includes('%') ? '%' : '');
          
          setTimeout(() => {
            handleExecuteRelease(clone.id, finalActualVal);
          }, 1000);
        }

        return clone;
      });

      if (updated) {
        setEvents(nextEvents);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [events]);

  // Formats time remaining cleanly
  const formatCountdown = (releaseTime: number) => {
    const remainingMs = releaseTime - Date.now();
    if (remainingMs <= 0) {
      return "Released";
    }

    const totalSeconds = Math.floor(remainingMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    return `${minutes}m ${seconds}s`;
  };

  // Triggers immediate simulated release of an event
  const handleExecuteRelease = (eventId: string, customActualValue?: string) => {
    const targetEvent = events.find(e => e.id === eventId);
    if (!targetEvent) return;

    const actualVal = customActualValue || simActualValue || targetEvent.forecast;
    setSimActualValue('');
    setIsSimulatingRelease(null);

    // Parse values for comparison
    const fVal = parseFloat(targetEvent.forecast);
    const aVal = parseFloat(actualVal);
    const pVal = parseFloat(targetEvent.previous);

    let outcome: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
    let pAnalysis: any = {};
    let magnitude = 10.0; // Price shock magnitude in Gold points

    // General economic logic: CPI/NFP exceeds forecast is Bearish for Gold (strengthens Dollar)
    // and below forecast is Bullish for Gold (weakens Dollar, encourages rate cuts).
    const isInflationOrLabor = targetEvent.eventName.includes('CPI') || 
                               targetEvent.eventName.includes('NFP') || 
                               targetEvent.eventName.includes('Rate') || 
                               targetEvent.eventName.includes('PMI');

    if (isInflationOrLabor) {
      if (aVal > fVal) {
        outcome = 'BEARISH';
        magnitude = Math.min(25.0, 8.0 + (aVal - fVal) * 15);
        pAnalysis = {
          outcomeBias: 'BEARISH',
          marketReactionExplanation: `The actual release of ${actualVal} exceeded the forecasted ${targetEvent.forecast}, triggering rapid short positioning. This strong economic momentum dampens expectations for loose central bank policy.`,
          institutionalInterpretation: 'Institutional desks aggressively bought US Treasuries and liquidated long Gold bags. Big bank algos triggered immediate automated sell programs.',
          htfBiasChange: 'Higher timeframe remains technically bullish, but this release introduces a short-term liquidity-grab phase into deep discount blocks.'
        };
      } else if (aVal < fVal) {
        outcome = 'BULLISH';
        magnitude = Math.min(25.0, 8.0 + (fVal - aVal) * 15);
        pAnalysis = {
          outcomeBias: 'BULLISH',
          marketReactionExplanation: `The actual release of ${actualVal} printed cooler than the forecasted ${targetEvent.forecast}. This cements a dovish pivot and expands the probability of aggressive monetary stimulus.`,
          institutionalInterpretation: 'Massive buy order flow cluster executed within a fraction of a millisecond. Yields collapsed, driving a stampede of capital into physical Spot Gold assets.',
          htfBiasChange: 'This high-impact release confirms macro bullish continuation. Previous supply blocks are completely blown through.'
        };
      } else {
        outcome = 'NEUTRAL';
        magnitude = 3.0;
        pAnalysis = {
          outcomeBias: 'NEUTRAL',
          marketReactionExplanation: 'The actual print matched expectations exactly. A brief volatile whipsaw took out both local buy and sell stops before price reverted to its mean equilibrium.',
          institutionalInterpretation: 'Institutional players sat on their hands. No major portfolio adjustments or structural repositioning occurred.',
          htfBiasChange: 'HTF structural alignment remains unchanged. Range-bound scalping rules remain optimal.'
        };
      }
    } else {
      // General growth indexes (GDP, retail sales) where beat is bearish for Gold (risk on / strong USD)
      if (aVal > fVal) {
        outcome = 'BEARISH';
        magnitude = 8.0;
        pAnalysis = {
          outcomeBias: 'BEARISH',
          marketReactionExplanation: `GDP growth beat forecasts, indicating a hot economy that limits rate-cut prospects.`,
          institutionalInterpretation: 'Risk-on capital rotated into equities, while yields popped, pressurizing Gold prices.',
          htfBiasChange: 'Maintains sideways-to-bearish consolidation pressure.'
        };
      } else {
        outcome = 'BULLISH';
        magnitude = 12.0;
        pAnalysis = {
          outcomeBias: 'BULLISH',
          marketReactionExplanation: `GDP came in weak, heightening stagflation fears and driving defensive flows.`,
          institutionalInterpretation: 'Hedge funds actively rotated capital into hard assets as macro buffers.',
          htfBiasChange: 'Adds structural fuel to the macro bullish reversal.'
        };
      }
    }

    // Trigger price shock to charts if callback provided
    if (onPriceShock && magnitude > 0) {
      onPriceShock(outcome, magnitude);
    }

    // Update event list
    setEvents(prev => prev.filter(e => e.id !== eventId));

    // Append to news history
    const historyItem: EconomicNewsHistoryItem = {
      id: `h-sim-${Date.now()}`,
      eventName: targetEvent.eventName,
      date: Date.now(),
      forecast: targetEvent.forecast,
      actual: actualVal,
      previous: targetEvent.previous,
      goldReaction: outcome,
      highestPriceMove: outcome === 'BULLISH' ? magnitude : magnitude * 0.2,
      lowestPriceMove: outcome === 'BEARISH' ? -magnitude : -magnitude * 0.2,
      volatility: magnitude > 15 ? 'EXTREME' : magnitude > 8 ? 'HIGH' : 'MEDIUM',
      aiPrediction: targetEvent.scenarios.lessThanForecast.condition,
      outcome: 'SUCCESS'
    };

    setHistory(prev => [historyItem, ...prev]);

    // Send visual alerts and logs
    onAddAlert('ECONOMIC_RELEASE', `📡 RELEASE: ${targetEvent.eventName} released! Actual: ${actualVal} (Forecast: ${targetEvent.forecast}). Reaction is ${outcome} for Gold.`, 'high');
    
    // Play alert feedback
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch(e) {}

    // Show detailed Post-News Analysis modal or block
    setTimeout(() => {
      onAddAlert('MACRO_ANALYSIS', `📊 POST-NEWS COMPLETED: Gold reacted with a ${magnitude.toFixed(1)} pt expansion. Bias is confirmed as ${outcome}.`, 'medium');
    }, 1500);
  };

  // Dynamically adds a new custom event to the upcoming calendar queue
  const handleAddCustomEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEventName) {
      alert("Please provide a valid event name.");
      return;
    }

    const minutes = parseInt(formMinutesUntil) || 10;
    const releaseTime = Date.now() + minutes * 60 * 1000;

    const newEvent: MacroEconomicEvent = {
      id: `ev-cust-${Date.now()}`,
      eventName: formEventName,
      country: formCountry,
      currency: formCurrency,
      impactLevel: formImpact,
      previous: formPrevious || '0.0%',
      forecast: formForecast || '0.0%',
      releaseTime,
      marketBiasAnalysis: {
        currentInstitutionalBias: 'NEUTRAL',
        expectedVolatility: formImpact === 'HIGH' ? 'HIGH' : 'MEDIUM',
        potentialGoldBias: `Conditional upon simulated actual values vs forecasted ${formForecast || '0.0%'}`,
        confidence: 70,
        reasoning: `Newly mapped calendar event injected by portfolio manager. High alert tracking active.`
      },
      scenarios: {
        greaterThanForecast: {
          condition: `Actual > ${formForecast || '0.0%'}`,
          likelyBias: 'BEARISH',
          reason: 'Aggressive algorithmic sell-stop sweep program activated.'
        },
        lessThanForecast: {
          condition: `Actual < ${formForecast || '0.0%'}`,
          likelyBias: 'BULLISH',
          reason: 'Dynamic order block mitigation and bullish impulse continuation.'
        },
        approxForecast: {
          condition: `Actual ≈ ${formForecast || '0.0%'}`,
          likelyBias: 'NEUTRAL',
          reason: 'Standard price range compression and value area rotation.'
        }
      },
      aiTradingImpact: {
        decision: formImpact === 'HIGH' ? 'AVOID_NEW_TRADES' : 'REDUCE_CONFIDENCE',
        reason: `Awaiting custom user simulated release in ${minutes} minutes. Risk profile mapped.`
      }
    };

    setEvents(prev => [...prev, newEvent]);
    onAddAlert('SYSTEM', `🆕 CALENDAR ADDED: Injected High-Impact Event "${formEventName}" scheduled in ${minutes}m.`, 'info');

    // Reset Form
    setFormEventName('');
    setFormPrevious('');
    setFormForecast('');
    setFormMinutesUntil('10');
    setNewsTab('upcoming');
  };

  // Computes current system-wide news warning state
  const activeWarningEvent = events.find(ev => {
    const minRemaining = (ev.releaseTime - Date.now()) / 60000;
    return minRemaining > 0 && minRemaining <= 30 && ev.impactLevel === 'HIGH';
  });

  return (
    <div id="macro-news-intelligence" className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-4 gap-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-amber-500 flex items-center gap-2">
            <Activity className="h-4 w-4 animate-pulse text-amber-500" /> Market News & Macro Events
          </h2>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
            Institutional Gold Economic Calendar & Risk Assessment System
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-semibold">
          <button
            id="tab-news-upcoming"
            onClick={() => setNewsTab('upcoming')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              newsTab === 'upcoming' 
                ? 'bg-amber-500 text-slate-950 font-black' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Upcoming ({events.length})
          </button>
          <button
            id="tab-news-history"
            onClick={() => setNewsTab('history')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              newsTab === 'history' 
                ? 'bg-amber-500 text-slate-950 font-black' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" /> News History ({history.length})
          </button>
          <button
            id="tab-news-add"
            onClick={() => setNewsTab('add_event')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              newsTab === 'add_event' 
                ? 'bg-amber-500 text-slate-950 font-black' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" /> Inject Event
          </button>
        </div>
      </div>

      {/* Global AI News Recommendation Banner */}
      {activeWarningEvent ? (
        <div id="ai-news-recommendation-banner" className="bg-rose-950/20 border border-rose-500/40 p-3.5 rounded-lg flex items-start gap-3 text-rose-300 animate-pulse">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold uppercase block text-rose-400 tracking-wider">
              ⚠️ CRITICAL VOLATILITY WARNING: {activeWarningEvent.eventName} releasing in {Math.ceil((activeWarningEvent.releaseTime - Date.now()) / 60000)} minutes!
            </span>
            <p className="mt-1 text-[11px] text-slate-300">
              AI Decision: <strong className="text-rose-400 font-extrabold uppercase font-mono bg-rose-950/50 px-1.5 py-0.5 rounded border border-rose-900/30">{activeWarningEvent.aiTradingImpact.decision.replace(/_/g, ' ')}</strong>
            </p>
            <p className="mt-1 text-[11px] text-slate-400 italic">
              Reason: {activeWarningEvent.aiTradingImpact.reason}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-950/10 border border-emerald-900/30 p-3 rounded-lg flex items-center gap-2.5 text-emerald-400 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>
            <strong>AI Status Monitor:</strong> No high-impact macro announcements within 30 minutes. Spot Gold systems are operating normally with standard SMC rules.
          </span>
        </div>
      )}

      {/* Content Area */}
      {newsTab === 'upcoming' && (
        <div className="space-y-4">
          {events.length === 0 ? (
            <div className="text-center text-slate-500 py-8 font-mono text-xs">
              No upcoming events in calendar queue. Use the Inject tab to dynamically mock new ones!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.map((ev) => {
                const isExpanded = expandedEventId === ev.id;
                const isReleasingNow = isSimulatingRelease === ev.id;
                const minutesRemaining = Math.max(0, Math.ceil((ev.releaseTime - Date.now()) / 60000));
                
                return (
                  <div 
                    key={ev.id} 
                    className={`bg-slate-950 border rounded-xl p-4 transition-all duration-300 ${
                      minutesRemaining <= 30 && ev.impactLevel === 'HIGH'
                        ? 'border-rose-500/50 shadow-rose-950/10 shadow-lg' 
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Header Info */}
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px]" title={ev.country}>
                          {ev.country === 'US' ? '🇺🇸' : ev.country === 'EU' ? '🇪🇺' : '🇬🇧'}
                        </span>
                        <div>
                          <span className="font-mono text-[9px] font-bold text-slate-500 tracking-wider">
                            {ev.country} ({ev.currency})
                          </span>
                          <h4 className="text-xs font-bold text-slate-200 leading-snug line-clamp-1">
                            {ev.eventName}
                          </h4>
                        </div>
                      </div>

                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        ev.impactLevel === 'HIGH' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        ev.impactLevel === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        🔴 High Impact
                      </span>
                    </div>

                    {/* Clock Countdown Row */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-900 text-center font-mono my-3">
                      <div>
                        <span className="text-[8px] text-slate-500 block uppercase">Forecast</span>
                        <span className="text-xs font-bold text-slate-200">{ev.forecast}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-500 block uppercase">Previous</span>
                        <span className="text-xs font-bold text-slate-400">{ev.previous}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-amber-500 block uppercase flex items-center justify-center gap-0.5">
                          <Clock className="w-2.5 h-2.5 animate-spin-slow" /> Time Left
                        </span>
                        <span className="text-xs font-black text-amber-400">
                          {formatCountdown(ev.releaseTime)}
                        </span>
                      </div>
                    </div>

                    {/* AI Trading Impact Advisory Banner */}
                    <div className="bg-slate-900 p-2.5 rounded border border-slate-900 text-[11px] mb-3">
                      <div className="flex justify-between font-mono mb-1">
                        <span className="text-slate-500 uppercase text-[9px]">AI RECOMMENDATION</span>
                        <span className={`font-black uppercase text-[9px] ${
                          ev.aiTradingImpact.decision === 'TRADE_NORMALLY' ? 'text-emerald-400' :
                          ev.aiTradingImpact.decision === 'REDUCE_CONFIDENCE' ? 'text-amber-400' : 'text-rose-400'
                        }`}>
                          {ev.aiTradingImpact.decision.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-slate-300 leading-normal">{ev.aiTradingImpact.reason}</p>
                    </div>

                    {/* Collapse Toggle */}
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-900">
                      <button
                        onClick={() => setExpandedEventId(isExpanded ? null : ev.id)}
                        className="text-slate-400 hover:text-white text-[10px] uppercase font-bold font-mono flex items-center gap-1 transition-all"
                      >
                        {isExpanded ? (
                          <>Hide Scenarios <ChevronUp className="w-3 h-3" /></>
                        ) : (
                          <>Analyze Scenarios <ChevronDown className="w-3 h-3" /></>
                        )}
                      </button>

                      {/* Manual Simulation Button */}
                      <button
                        onClick={() => setIsSimulatingRelease(isReleasingNow ? null : ev.id)}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-mono text-[9px] font-black uppercase px-2.5 py-1 rounded tracking-wider flex items-center gap-1 transition-all shadow-md"
                      >
                        <Play className="w-2.5 h-2.5 fill-current" /> Simulate Release
                      </button>
                    </div>

                    {/* Dynamic Simulation Panel (when simulation clicked) */}
                    {isReleasingNow && (
                      <div className="mt-4 bg-slate-900 p-3 rounded-lg border border-amber-500/30 text-xs space-y-2.5 animate-fade-in">
                        <span className="font-bold text-[9px] uppercase tracking-wider text-amber-400 block border-b border-slate-800 pb-1">
                          📊 Economic Data Release Simulator
                        </span>
                        <p className="text-[10px] text-slate-400 leading-normal">
                          Provide an actual value to compare against the forecast of <strong className="text-slate-200">{ev.forecast}</strong>. Algos will instantly analyze the deviation and update Gold price structures.
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder={`e.g. 3.0% or 200K`}
                            value={simActualValue}
                            onChange={(e) => setSimActualValue(e.target.value)}
                            className="bg-slate-950 text-white border border-slate-800 rounded px-2 py-1.5 text-xs w-full focus:outline-none focus:border-amber-500 font-mono"
                          />
                          <button
                            onClick={() => handleExecuteRelease(ev.id)}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black uppercase px-3 py-1.5 rounded transition-all text-[10px] shrink-0 font-mono"
                          >
                            Release
                          </button>
                        </div>
                        <div className="flex justify-between items-center text-[9px] text-slate-500 pt-1">
                          <span>Or trigger auto-deviation:</span>
                          <div className="flex gap-1">
                            <button 
                              onClick={() => handleExecuteRelease(ev.id, (parseFloat(ev.forecast) - 0.3).toFixed(1) + (ev.forecast.includes('%') ? '%' : ''))}
                              className="text-emerald-400 hover:underline bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-800"
                            >
                              Bullish (Cooler)
                            </button>
                            <button 
                              onClick={() => handleExecuteRelease(ev.id, (parseFloat(ev.forecast) + 0.3).toFixed(1) + (ev.forecast.includes('%') ? '%' : ''))}
                              className="text-rose-400 hover:underline bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-800"
                            >
                              Bearish (Hotter)
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Collapsible Scenarios */}
                    {isExpanded && (
                      <div className="mt-4 border-t border-slate-900 pt-4 space-y-4 animate-fade-in text-xs">
                        {/* Market Bias analysis sub-card */}
                        <div className="bg-slate-900/40 border border-slate-900 p-3 rounded-lg">
                          <h5 className="font-bold text-[9px] uppercase tracking-wider text-amber-500 mb-1 font-mono">
                            Institutional Sentiment Analysis
                          </h5>
                          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono mb-2">
                            <div>
                              <span className="text-slate-500 block">VOLATILITY</span>
                              <span className="text-rose-400 font-bold">{ev.marketBiasAnalysis.expectedVolatility}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">AI CONFIDENCE</span>
                              <span className="text-emerald-400 font-bold">{ev.marketBiasAnalysis.confidence}%</span>
                            </div>
                          </div>
                          <p className="text-slate-300 leading-relaxed text-[11px] mb-2">
                            <strong>Reasoning:</strong> {ev.marketBiasAnalysis.reasoning}
                          </p>
                        </div>

                        {/* Scenarios A, B, C */}
                        <div className="space-y-2.5">
                          <h5 className="font-bold text-[9px] uppercase tracking-wider text-slate-400 font-mono">
                            Conditional Scenario Matrix
                          </h5>

                          {/* Scenario A */}
                          <div className="bg-slate-900 border-l-2 border-rose-500 p-2.5 rounded-r">
                            <div className="flex justify-between font-mono mb-1 text-[10px]">
                              <span className="font-bold text-slate-300">Scenario A (Actual &gt; Forecast)</span>
                              <span className="text-rose-400 font-bold">Gold BEARISH Bias</span>
                            </div>
                            <p className="text-[10px] text-slate-400 leading-snug">{ev.scenarios.greaterThanForecast.reason}</p>
                          </div>

                          {/* Scenario B */}
                          <div className="bg-slate-900 border-l-2 border-emerald-500 p-2.5 rounded-r">
                            <div className="flex justify-between font-mono mb-1 text-[10px]">
                              <span className="font-bold text-slate-300">Scenario B (Actual &lt; Forecast)</span>
                              <span className="text-emerald-400 font-bold">Gold BULLISH Bias</span>
                            </div>
                            <p className="text-[10px] text-slate-400 leading-snug">{ev.scenarios.lessThanForecast.reason}</p>
                          </div>

                          {/* Scenario C */}
                          <div className="bg-slate-900 border-l-2 border-slate-600 p-2.5 rounded-r">
                            <div className="flex justify-between font-mono mb-1 text-[10px]">
                              <span className="font-bold text-slate-300">Scenario C (Actual ≈ Forecast)</span>
                              <span className="text-slate-400 font-bold">Gold NEUTRAL Bias</span>
                            </div>
                            <p className="text-[10px] text-slate-400 leading-snug">{ev.scenarios.approxForecast.reason}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {newsTab === 'history' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 uppercase text-[9px] tracking-wider font-bold">
                <th className="pb-2">Event</th>
                <th className="pb-2">Date</th>
                <th className="pb-2">Forecast</th>
                <th className="pb-2">Actual</th>
                <th className="pb-2">Previous</th>
                <th className="pb-2 text-right">Gold Reaction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {history.map((h) => (
                <tr key={h.id} className="hover:bg-slate-950/40 transition-colors">
                  <td className="py-3 pr-2 font-sans font-bold text-slate-200">
                    {h.eventName}
                  </td>
                  <td className="py-3 text-[10px] text-slate-400">
                    {new Date(h.date).toLocaleDateString()}
                  </td>
                  <td className="py-3 text-slate-300">{h.forecast}</td>
                  <td className={`py-3 font-bold ${
                    parseFloat(h.actual) < parseFloat(h.forecast) ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {h.actual}
                  </td>
                  <td className="py-3 text-slate-400">{h.previous}</td>
                  <td className="py-3 text-right">
                    <span className={`inline-block px-1.5 py-0.5 rounded font-bold uppercase text-[9px] ${
                      h.goldReaction === 'BULLISH' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' :
                      h.goldReaction === 'BEARISH' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {h.goldReaction}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {newsTab === 'add_event' && (
        <form onSubmit={handleAddCustomEvent} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
          <span className="font-bold text-[10px] uppercase tracking-widest text-amber-500 block border-b border-slate-900 pb-2">
            🆕 Dynamically Add Calendar Event (High-Impact Automation)
          </span>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Event Name */}
            <div className="space-y-1">
              <label className="text-slate-400 font-mono text-[10px] block">EVENT NAME</label>
              <input
                type="text"
                placeholder="e.g. FOMC Meeting Minutes"
                value={formEventName}
                onChange={(e) => setFormEventName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            {/* Minutes Until Release */}
            <div className="space-y-1">
              <label className="text-slate-400 font-mono text-[10px] block">MINUTES UNTIL RELEASE</label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 15"
                value={formMinutesUntil}
                onChange={(e) => setFormMinutesUntil(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-500 font-mono"
                required
              />
            </div>

            {/* Country flag select */}
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-slate-400 font-mono text-[10px] block">COUNTRY</label>
                <select
                  value={formCountry}
                  onChange={(e) => setFormCountry(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-white focus:outline-none"
                >
                  <option value="US">US 🇺🇸</option>
                  <option value="EU">EU 🇪🇺</option>
                  <option value="GB">GB 🇬🇧</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-mono text-[10px] block">CURRENCY</label>
                <select
                  value={formCurrency}
                  onChange={(e) => setFormCurrency(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-white focus:outline-none"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-mono text-[10px] block">IMPACT</label>
                <select
                  value={formImpact}
                  onChange={(e) => setFormImpact(e.target.value as EconomicImpactLevel)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-white focus:outline-none"
                >
                  <option value="HIGH">HIGH (🔴)</option>
                  <option value="MEDIUM">MEDIUM (🟡)</option>
                  <option value="LOW">LOW (⚪)</option>
                </select>
              </div>
            </div>

            {/* Previous & Forecast values */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-slate-400 font-mono text-[10px] block">PREVIOUS VALUE</label>
                <input
                  type="text"
                  placeholder="e.g. 5.25% or 2.1%"
                  value={formPrevious}
                  onChange={(e) => setFormPrevious(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-white focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-mono text-[10px] block">FORECAST VALUE</label>
                <input
                  type="text"
                  placeholder="e.g. 5.25% or 2.0%"
                  value={formForecast}
                  onChange={(e) => setFormForecast(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-white focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black uppercase text-xs tracking-widest py-2.5 rounded transition-all shadow-md"
          >
            Incorporate Economic Calendar Event
          </button>
        </form>
      )}
    </div>
  );
};
