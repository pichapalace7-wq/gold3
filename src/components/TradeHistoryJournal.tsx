import { useState } from 'react';
import { TradeIdea } from '../types';
import { getSetupGrade } from './ActiveTradeMonitor';
import { 
  CheckCircle2, 
  XCircle, 
  ChevronDown, 
  ChevronUp, 
  MessageSquare, 
  Clock, 
  FileText, 
  Target, 
  TrendingUp, 
  AlertCircle,
  HelpCircle,
  Award,
  BookOpen,
  Calendar,
  Check,
  ShieldCheck,
  Info
} from 'lucide-react';

interface TradeHistoryJournalProps {
  history: TradeIdea[];
}

export function TradeHistoryJournal({ history }: TradeHistoryJournalProps) {
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setSelectedTradeId(prev => (prev === id ? null : id));
  };

  const getBadgeColor = (state: string) => {
    switch (state) {
      case 'TP3_HIT':
        return 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30';
      case 'TP2_HIT':
      case 'TP1_HIT':
        return 'bg-teal-950/40 text-teal-300 border-teal-900/30';
      case 'STOP_LOSS_HIT':
        return 'bg-rose-950/40 text-rose-400 border-rose-900/30';
      case 'CANCELLED':
        return 'bg-slate-950/40 text-slate-400 border-slate-800';
      default:
        return 'bg-slate-950/40 text-slate-400 border-slate-800';
    }
  };

  const getOutcomeText = (state: string) => {
    switch (state) {
      case 'TP3_HIT':
        return '🏆 TP3 SECURED (FULL WIN)';
      case 'TP2_HIT':
        return '💰 TP2 REACHED (PARTIAL WIN)';
      case 'TP1_HIT':
        return '💰 TP1 REACHED (PARTIAL WIN)';
      case 'STOP_LOSS_HIT':
        return '🚨 STOP LOSS HIT (LOSS)';
      case 'CANCELLED':
        return '⚪ CANCELLED BEFORE ENTRY';
      case 'EXPIRED':
        return '⚪ EXPIRED';
      default:
        return '⚪ RESOLVED';
    }
  };

  return (
    <div id="trade-history-journal-container" className="space-y-4">
      
      {/* HEADER EXPLANATION */}
      <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-xl flex items-center gap-4 shadow-lg">
        <div className="bg-amber-500/10 p-3 rounded-lg text-amber-500 shrink-0">
          <BookOpen className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-white text-sm font-bold uppercase tracking-wider">Hedge Fund Execution Log & Permanent Journal</h3>
          <p className="text-[11px] text-slate-400 leading-relaxed mt-1 max-w-2xl">
            Every published trade ticket is frozen at generation. Access original pricing levels, locked SMC checklists, similar historical setups, and comprehensive post-trade AI self-reviews below.
          </p>
        </div>
      </div>

      {/* TRADE LIST */}
      <div className="space-y-3">
        {history.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800/60 p-8 rounded-xl text-center text-xs text-slate-500 font-mono italic">
            No historical trade logs registered in your clearing account yet.
          </div>
        ) : (
          history.map((trade, idx) => {
            const isExpanded = selectedTradeId === trade.id;
            const isProfit = (trade.finalProfitPts || 0) >= 0;
            const gradeInfo = getSetupGrade(trade.qualityScore);

            return (
              <div 
                key={`${trade.id}-${idx}`} 
                className={`bg-slate-900 border ${isExpanded ? 'border-amber-500/40' : 'border-slate-800 hover:border-slate-700'} rounded-xl overflow-hidden transition-all duration-200 shadow-md`}
              >
                {/* COMPACT TRIGGER HEADER */}
                <div 
                  onClick={() => toggleExpand(trade.id)}
                  className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded border ${getBadgeColor(trade.state)}`}>
                      {trade.direction}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-white flex items-center gap-2">
                        Spot Gold Setup Ticket
                        <span className="text-[10px] text-slate-500 font-mono font-normal">ID: {trade.id}</span>
                        <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[8px] font-mono font-bold rounded">
                          GRADE {gradeInfo.grade}
                        </span>
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-500" />
                        Published: {new Date(trade.publishedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-auto font-mono text-xs">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 uppercase">Outcome</p>
                      <p className={`font-black uppercase text-[10px] ${
                        trade.state.includes('TP') ? 'text-emerald-400' :
                        trade.state.includes('STOP') ? 'text-rose-400' :
                        'text-slate-400'
                      }`}>
                        {getOutcomeText(trade.state)}
                      </p>
                    </div>

                    <div className="text-right border-l border-slate-800 pl-4 min-w-[70px]">
                      <p className="text-[10px] text-slate-500 uppercase">Profit</p>
                      <p className={`font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {trade.finalProfitPts === 0 ? '0.00 pts' : `${isProfit ? '+' : ''}${trade.finalProfitPts?.toFixed(2)} pts`}
                      </p>
                    </div>

                    <div className="text-slate-400">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </div>

                {/* EXPANDED SYSTEM JOURNAL (Goal 11) */}
                {isExpanded && (
                  <div className="border-t border-slate-800 bg-slate-950/80 p-5 space-y-6">
                    
                    {/* BENTO GRID BOX */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      
                      {/* STATS PANEL */}
                      <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-lg">
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider block mb-2 font-mono">Pricing targets</span>
                        <div className="space-y-1.5 text-xs font-mono">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Entry Price:</span>
                            <span className="text-slate-200 font-bold">{trade.entryPrice.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Stop Loss:</span>
                            <span className="text-rose-400 font-bold">{trade.stopLoss.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Target TP1:</span>
                            <span className="text-emerald-400 font-bold">{trade.tp1.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Target TP2:</span>
                            <span className="text-emerald-400 font-bold">{trade.tp2.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Target TP3:</span>
                            <span className="text-emerald-400 font-bold">{trade.tp3.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between border-t border-slate-800 pt-1.5 mt-1">
                            <span className="text-slate-400">Risk Reward Ratio:</span>
                            <span className="text-amber-500 font-bold">{trade.riskRewardRatio}</span>
                          </div>
                        </div>
                      </div>

                      {/* CONFLUENCE STATS */}
                      <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-lg">
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider block mb-2 font-mono">Institutional Rating</span>
                        <div className="space-y-1.5 text-xs font-mono">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Setup Grade:</span>
                            <span className="text-amber-400 font-black">GRADE {gradeInfo.grade}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Rating Stars:</span>
                            <span className="text-amber-400 font-bold">{gradeInfo.ratingText}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">SMC Quality Score:</span>
                            <span className="text-white font-bold">{trade.qualityScore}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">AI Confidence:</span>
                            <span className="text-white font-bold">{trade.confidence}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Calculated Win Prob:</span>
                            <span className="text-white font-bold">{trade.probability}%</span>
                          </div>
                          <div className="flex justify-between border-t border-slate-800 pt-1.5 mt-1">
                            <span className="text-slate-400">Invalidation Level:</span>
                            <span className="text-rose-400 font-bold">{trade.invalidationLevel.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      {/* LOCK REASONING */}
                      <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-lg flex flex-col justify-between">
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase tracking-wider block mb-2 font-mono">Trigger snapshots</span>
                          <div className="space-y-1 text-xs">
                            <p className="text-slate-300 leading-tight">
                              <span className="text-[10px] text-slate-500 block uppercase font-mono">Expected Trigger:</span>
                              {trade.expectedTrigger}
                            </p>
                          </div>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-3 space-y-1">
                          <div className="flex justify-between">
                            <span>Hold Limit:</span>
                            <span className="text-slate-300">{trade.holdingTime}</span>
                          </div>
                          {trade.resolvedAt && (
                            <div className="flex justify-between">
                              <span>Holding Time:</span>
                              <span className="text-emerald-400 font-bold">
                                {Math.round((trade.resolvedAt - (trade.entryTriggeredAt || trade.publishedAt)) / (1000 * 60))} mins
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* LOCKED SMC CHECKLIST */}
                    <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-lg">
                      <span className="text-[9px] text-slate-500 uppercase tracking-wider block mb-3 font-mono font-bold">Frozen SMC Checklist at Execution</span>
                      {trade.entryChecklist ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                          {Object.entries(trade.entryChecklist).map(([key, active]) => {
                            const formattedKey = key
                              .replace(/([A-Z])/g, ' $1')
                              .replace(/^./, str => str.toUpperCase());

                            return (
                              <div key={key} className={`flex items-center gap-2 p-1.5 rounded border ${
                                active ? 'bg-emerald-950/20 border-emerald-950/40 text-emerald-400' : 'bg-slate-950/40 border-slate-900/60 text-slate-600'
                              }`}>
                                {active ? (
                                  <Check className="h-3 w-3 text-emerald-400 font-black shrink-0" />
                                ) : (
                                  <XCircle className="h-3.5 w-3.5 text-slate-700 shrink-0" />
                                )}
                                <span className="truncate text-[10px]">{formattedKey}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 font-mono italic">
                          No checklist snapshot recorded (Setup was cancelled before entry triggered).
                        </p>
                      )}
                    </div>

                    {/* TICK VALIDATION EVIDENCE LOG */}
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider font-mono font-bold flex items-center gap-1.5">
                          <ShieldCheck className="h-4 w-4 text-emerald-400" /> Take Profit Tick Validation Logs
                        </span>
                        <span className="text-[8px] font-mono text-emerald-400 uppercase bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-900/30">
                          Verified Outcomes Only
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                        <div className="bg-slate-950 p-3 rounded border border-slate-900 flex flex-col justify-between">
                          <span className="text-slate-500 text-[10px] block uppercase">TP1 Target ({trade.tp1.toFixed(2)})</span>
                          <span className={`font-black text-sm mt-1.5 ${trade.tp1Validated || trade.state === 'TP1_HIT' || trade.state === 'TP2_HIT' || trade.state === 'TP3_HIT' ? 'text-emerald-400' : 'text-slate-600'}`}>
                            {trade.tp1Validated || trade.state === 'TP1_HIT' || trade.state === 'TP2_HIT' || trade.state === 'TP3_HIT' ? "✓ VALIDATED HIT" : "✗ UNREACHED"}
                          </span>
                        </div>
                        <div className="bg-slate-950 p-3 rounded border border-slate-900 flex flex-col justify-between">
                          <span className="text-slate-500 text-[10px] block uppercase">TP2 Target ({trade.tp2.toFixed(2)})</span>
                          <span className={`font-black text-sm mt-1.5 ${trade.tp2Validated || trade.state === 'TP2_HIT' || trade.state === 'TP3_HIT' ? 'text-emerald-400' : 'text-slate-600'}`}>
                            {trade.tp2Validated || trade.state === 'TP2_HIT' || trade.state === 'TP3_HIT' ? "✓ VALIDATED HIT" : "✗ UNREACHED"}
                          </span>
                        </div>
                        <div className="bg-slate-950 p-3 rounded border border-slate-900 flex flex-col justify-between">
                          <span className="text-slate-500 text-[10px] block uppercase">TP3 Target ({trade.tp3.toFixed(2)})</span>
                          <span className={`font-black text-sm mt-1.5 ${trade.tp3Validated || trade.state === 'TP3_HIT' ? 'text-emerald-400' : 'text-slate-600'}`}>
                            {trade.tp3Validated || trade.state === 'TP3_HIT' ? "✓ VALIDATED HIT" : "✗ UNREACHED"}
                          </span>
                        </div>
                      </div>
                      {trade.tpValidationLog && trade.tpValidationLog.length > 0 ? (
                        <div className="bg-slate-950/40 p-3 rounded border border-slate-900 font-mono text-[10px] space-y-1.5">
                          <p className="text-slate-400 font-bold uppercase tracking-wider text-[8px]">
                            Tick Crossing Audit Evidence:
                          </p>
                          {trade.tpValidationLog.map((log, idx) => (
                            <div key={idx} className="flex flex-col sm:flex-row sm:justify-between bg-slate-900/60 p-2 rounded border border-slate-900 gap-1 sm:gap-0">
                              <span className="text-slate-300 font-bold">🎯 TP{log.tpNumber} Hit Verified:</span>
                              <div className="flex items-center gap-3 text-slate-400 text-[9px]">
                                <span>Level: <span className="text-white font-bold">{log.tpLevel.toFixed(2)}</span></span>
                                <span>Exact Tick: <span className="text-emerald-400 font-bold">{log.exactTickPrice.toFixed(2)}</span></span>
                                <span>Time: <span className="text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</span></span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        trade.state !== 'CANCELLED' && trade.state !== 'EXPIRED' && trade.state !== 'WAITING_FOR_ENTRY' && (
                          <p className="text-[10px] text-slate-500 font-mono italic">
                            No TP crossing ticks recorded. Position resolved at Stop Loss / Breakeven.
                          </p>
                        )
                      )}
                    </div>

                    {/* ORIGINAL TECHNICAL REASONING */}
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
                      <span className="text-[9px] text-slate-500 uppercase tracking-wider block mb-2 font-mono">Original Technical Reasoning</span>
                      <div className="space-y-1">
                        {trade.institutionalReasoning.map((r, rIdx) => (
                          <div key={rIdx} className="flex gap-2 items-start text-xs text-slate-300 leading-tight">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                            <span>{r}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-800/60">
                        <span className="text-[9px] text-slate-500 uppercase block mb-1 font-mono">Market Story Snapshot</span>
                        <p className="text-slate-400 text-xs italic leading-relaxed">"{trade.marketStory}"</p>
                      </div>
                    </div>

                    {/* SMART BREAK-EVEN PROTECTION V2 ANALYSIS REPORT */}
                    {trade.aiBreakEvenEvaluation && (
                      <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
                          <ShieldCheck className="h-5 w-5 text-amber-500 shrink-0" />
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-500 block font-mono">
                              SMART BREAK-EVEN PROTECTION V2 AUDIT
                            </span>
                            <span className="text-[9px] text-slate-500 font-mono">Hedge Fund Capital Preservation Post-Trade Audit</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                          <div className="space-y-3">
                            <div className="bg-slate-950 p-3 rounded border border-slate-900">
                              <span className="text-slate-500 text-[9px] block uppercase">Original Risk & Protection Specs</span>
                              <div className="space-y-1.5 mt-2 text-[11px]">
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Original Stop Loss:</span>
                                  <span className="text-slate-200">{(trade.originalStopLoss || trade.stopLoss).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Dynamic Buffer Captured:</span>
                                  <span className="text-amber-500">{(trade.dynamicBufferUsed || 0).toFixed(2)} pts</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Spread at Activation:</span>
                                  <span className="text-slate-200">{(trade.spreadAtActivation || 0.05).toFixed(3)} pts</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">ATR at Activation:</span>
                                  <span className="text-slate-200">{(trade.atrAtActivation || 1.2).toFixed(2)} pts</span>
                                </div>
                              </div>
                            </div>

                            <div className="bg-slate-950 p-3 rounded border border-slate-900">
                              <span className="text-slate-500 text-[9px] block uppercase">Excursion Limits</span>
                              <div className="space-y-1.5 mt-2 text-[11px]">
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Max Favourable Excursion (MFE):</span>
                                  <span className="text-emerald-400">+{trade.mfePoints?.toFixed(2) || '0.00'} pts</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Max Adverse Excursion (MAE):</span>
                                  <span className="text-rose-400">-{trade.maePoints?.toFixed(2) || '0.00'} pts</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="bg-slate-950 p-3 rounded border border-slate-900 h-full flex flex-col justify-between">
                              <div>
                                <span className="text-slate-500 text-[9px] block uppercase">AI Smart Protection Critic</span>
                                <div className="space-y-2 mt-2 text-[11px]">
                                  <p className="text-slate-300 leading-normal">
                                    <span className="text-amber-500 font-bold font-mono">1. Was BE Activated Too Early?</span><br />
                                    {trade.aiBreakEvenEvaluation.wasBEActivatedTooEarly}
                                  </p>
                                  <p className="text-slate-300 leading-normal">
                                    <span className="text-amber-500 font-bold font-mono">2. Dynamic Buffer Sizing Critique:</span><br />
                                    {trade.aiBreakEvenEvaluation.wasBufferTooSmall || trade.aiBreakEvenEvaluation.wasBufferTooLarge}
                                  </p>
                                  <p className="text-slate-300 leading-normal">
                                    <span className="text-amber-500 font-bold font-mono">3. Alternative Stop Strategy Comparison:</span><br />
                                    {trade.aiBreakEvenEvaluation.wouldLeavingOriginalStopHaveProducedBetterResult}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* COMPREHENSIVE AI SELF-REVIEW REPORT (Goal 6) */}
                    <div className="bg-slate-900 border-2 border-amber-500/20 p-5 rounded-lg space-y-4">
                      <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
                        <MessageSquare className="h-5 w-5 text-amber-500 shrink-0" />
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-amber-500 block font-mono">
                            INSTITUTIONAL AI SELF-REVIEW REPORT (POST-TRADE)
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono">Comprehensive Critique of Execution Quality</span>
                        </div>
                      </div>

                      {trade.aiSelfReview ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="space-y-2">
                            <div className="bg-slate-950 p-3 rounded border border-slate-900">
                              <span className="text-slate-400 font-bold block uppercase text-[9px] font-mono">1. Entry Optimization</span>
                              <p className="text-slate-300 leading-normal mt-1">{trade.aiSelfReview.entryOptimal}</p>
                            </div>
                            <div className="bg-slate-950 p-3 rounded border border-slate-900">
                              <span className="text-slate-400 font-bold block uppercase text-[9px] font-mono">2. Stop Placement Legitimacy</span>
                              <p className="text-slate-300 leading-normal mt-1">{trade.aiSelfReview.stopPlacement}</p>
                            </div>
                            <div className="bg-slate-950 p-3 rounded border border-slate-900">
                              <span className="text-slate-400 font-bold block uppercase text-[9px] font-mono">3. Confluence Sufficiency</span>
                              <p className="text-slate-300 leading-normal mt-1">{trade.aiSelfReview.confirmationsSufficient}</p>
                            </div>
                            <div className="bg-slate-950 p-3 rounded border border-slate-900">
                              <span className="text-slate-400 font-bold block uppercase text-[9px] font-mono">4. Entry Improvement Vector</span>
                              <p className="text-slate-300 leading-normal mt-1">{trade.aiSelfReview.entryImprovement}</p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="bg-slate-950 p-3 rounded border border-slate-900">
                              <span className="text-slate-400 font-bold block uppercase text-[9px] font-mono">5. Take Profit Calibration</span>
                              <p className="text-slate-300 leading-normal mt-1">{trade.aiSelfReview.tpImprovement}</p>
                            </div>
                            <div className="bg-slate-950 p-3 rounded border border-slate-900">
                              <span className="text-slate-400 font-bold block uppercase text-[9px] font-mono">6. Risk Parameter Compliance</span>
                              <p className="text-slate-300 leading-normal mt-1">{trade.aiSelfReview.riskAcceptable}</p>
                            </div>
                            <div className="bg-slate-950 p-3 rounded border border-slate-900">
                              <span className="text-slate-400 font-bold block uppercase text-[9px] font-mono">7. Institutional Repeatability</span>
                              <p className="text-slate-300 leading-normal mt-1">{trade.aiSelfReview.institutionalRepeat}</p>
                            </div>
                            <div className="bg-slate-950 p-3 rounded border-amber-500/10">
                              <span className="text-amber-500 font-bold block uppercase text-[9px] font-mono">8. Core Lessons Learned</span>
                              <p className="text-slate-300 font-medium leading-normal mt-1 italic">"{trade.aiSelfReview.lessonsLearned}"</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-slate-300 text-xs italic leading-relaxed">
                            "{trade.aiEvaluation || "Awaiting trade resolution to compile evaluation critique."}"
                          </p>
                        </div>
                      )}
                    </div>

                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
