import { LearningInsight } from '../types';
import { 
  Cpu, 
  Lightbulb, 
  TrendingUp, 
  HelpCircle, 
  Info,
  ShieldCheck,
  Award
} from 'lucide-react';

interface LearningEngineProps {
  insights: LearningInsight[];
}

export function LearningEngine({ insights }: LearningEngineProps) {
  
  const getBoostColor = (boost: number) => {
    if (boost > 20) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (boost > 5) return 'text-teal-400 bg-teal-500/10 border-teal-500/20';
    if (boost < -5) return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
  };

  const getOptimizationAdvice = (condition: string, boost: number) => {
    if (boost > 30) {
      return `Critical high-impact factor. Trades incorporating "${condition}" show a 30%+ increase in win frequency. Strict institutional filter: mandatory for A+ sniper execution.`;
    }
    if (boost > 15) {
      return `Strong confluence. Incorporating "${condition}" significantly strengthens the structural validation. Prioritize this signal in active London/NY overlaps.`;
    }
    if (boost > 0) {
      return `Healthy auxiliary indicator. Supports local momentum structure. Best combined with macro trend alignments.`;
    }
    if (boost < -15) {
      return `Potential trap warning! Trades with this indicator present actually underperform. Market makers frequently use this retail pattern to build opposing liquidity pools. Exercise maximum caution.`;
    }
    return `Neutral footprint influence. Validated for high-frequency scalping, but has marginal influence on long-term macro win-rates.`;
  };

  return (
    <div id="learning-engine-container" className="space-y-4">
      
      {/* EXPLANATORY HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 p-6 rounded-xl flex items-start gap-4 shadow-lg">
        <div className="bg-amber-500/10 p-3 rounded-xl text-amber-500 shrink-0">
          <Cpu className="h-6 w-6 animate-pulse" />
        </div>
        <div className="space-y-1">
          <h3 className="text-white text-sm font-bold uppercase tracking-wider flex items-center gap-1.5">
            Institutional Confluence Learning Engine
          </h3>
          <p className="text-[11px] text-slate-400 leading-relaxed max-w-3xl">
            This predictive matrix back-tests your live trade history in real-time. By comparing which Smart Money Concepts (SMC) confirmation variables were locked during wins versus losses, the engine isolates proprietary edge patterns, providing adaptive execution optimization.
          </p>
        </div>
      </div>

      {/* INSIGHTS DISPLAY TABLE / ROW LIST */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        
        {/* Table Headers */}
        <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 grid grid-cols-12 text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">
          <div className="col-span-4 sm:col-span-5">SMC Confirmation Indicator</div>
          <div className="col-span-2 text-center">Wins Freq</div>
          <div className="col-span-2 text-center">Losses Freq</div>
          <div className="col-span-4 sm:col-span-3 text-right">Probability Boost</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-800/60">
          {insights.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 font-mono italic">
              Awaiting more resolved trades in history to calculate learning frequencies...
            </div>
          ) : (
            insights.map((ins, idx) => (
              <div key={idx} className="px-5 py-4 grid grid-cols-12 items-center hover:bg-slate-950/20 transition-all">
                
                {/* Indicator name */}
                <div className="col-span-4 sm:col-span-5">
                  <span className="text-xs font-bold text-white block">{ins.conditionName}</span>
                  <span className="text-[10px] text-slate-400 leading-relaxed mt-1 block max-w-md hidden sm:block">
                    {getOptimizationAdvice(ins.conditionName, ins.winProbabilityBoost)}
                  </span>
                </div>

                {/* Win frequency */}
                <div className="col-span-2 text-center font-mono text-xs text-emerald-400 font-bold">
                  {ins.frequencyInWins}%
                </div>

                {/* Loss frequency */}
                <div className="col-span-2 text-center font-mono text-xs text-rose-400">
                  {ins.frequencyInLosses}%
                </div>

                {/* Boost score */}
                <div className="col-span-4 sm:col-span-3 text-right flex justify-end">
                  <span className={`text-xs font-mono font-black px-2.5 py-1 rounded border ${getBoostColor(ins.winProbabilityBoost)}`}>
                    {ins.winProbabilityBoost >= 0 ? '+' : ''}
                    {ins.winProbabilityBoost}% Boost
                  </span>
                </div>

                {/* Mobile advisor description row (stacked) */}
                <div className="col-span-12 mt-2 sm:hidden text-[9px] text-slate-400 bg-slate-950/50 p-2 rounded border border-slate-900 leading-normal">
                  <span className="font-bold text-amber-500/90 block uppercase text-[8px] mb-0.5">Hedge Fund Optimization advice:</span>
                  {getOptimizationAdvice(ins.conditionName, ins.winProbabilityBoost)}
                </div>

              </div>
            ))
          )}
        </div>

      </div>

    </div>
  );
}
