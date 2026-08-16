import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Settings, 
  ShieldAlert, 
  Send, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  RefreshCw, 
  Trash2, 
  Info, 
  Calendar, 
  TrendingUp,
  Sliders,
  Check
} from 'lucide-react';

interface WhatsAppLogItem {
  id: string;
  timestamp: string;
  eventType: string;
  status: 'SENT' | 'QUEUED' | 'FAILED';
  retries: number;
  message: string;
  error?: string;
}

interface WhatsAppSettings {
  newSetup: boolean;
  entryTrigger: boolean;
  tpTrigger: boolean;
  slTrigger: boolean;
  dailyReport: boolean;
  weeklyReport: boolean;
  newsAlert: boolean;
  opportunityAlert: boolean;
}

interface WhatsAppState {
  settings: WhatsAppSettings;
  isConfigured: boolean;
  instanceId: string;
  phoneNumber: string;
  apiUrl: string;
  logs: WhatsAppLogItem[];
  queue: any[];
}

const DEFAULT_FALLBACK_STATE: WhatsAppState = {
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
};

export const WhatsAppAssistant: React.FC<{
  tradeHistory: any[];
  activeSetup: any;
  currentPrice: number;
}> = ({ tradeHistory, activeSetup, currentPrice }) => {
  const [state, setState] = useState<WhatsAppState>(DEFAULT_FALLBACK_STATE);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fetchConfig = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch('/api/whatsapp/config', { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data && data.settings) {
          setState({
            settings: {
              newSetup: data.settings.newSetup ?? true,
              entryTrigger: data.settings.entryTrigger ?? true,
              tpTrigger: data.settings.tpTrigger ?? true,
              slTrigger: data.settings.slTrigger ?? true,
              dailyReport: data.settings.dailyReport ?? true,
              weeklyReport: data.settings.weeklyReport ?? true,
              newsAlert: data.settings.newsAlert ?? true,
              opportunityAlert: data.settings.opportunityAlert ?? true,
            },
            isConfigured: data.isConfigured ?? false,
            instanceId: data.instanceId || '',
            phoneNumber: data.phoneNumber || '',
            apiUrl: data.apiUrl || 'https://7107.api.greenapi.com',
            logs: Array.isArray(data.logs) ? data.logs : [],
            queue: Array.isArray(data.queue) ? data.queue : []
          });
        }
      }
    } catch {
      // Gracefully catch fetch errors (e.g. server boot or transient network drop)
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    // Poll logs and queue state every 8 seconds for live updates
    const pollInterval = setInterval(() => {
      fetchConfig();
    }, 8000);
    return () => clearInterval(pollInterval);
  }, []);

  const handleToggleSetting = async (key: keyof WhatsAppSettings) => {
    if (!state) return;
    const updatedSettings = {
      ...state.settings,
      [key]: !state.settings[key]
    };
    
    // Optimistic UI update
    setState({
      ...state,
      settings: updatedSettings
    });

    try {
      const res = await fetch('/api/whatsapp/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: updatedSettings })
      });
      if (!res.ok) {
        throw new Error('Failed to update settings');
      }
    } catch (error: any) {
      setStatusMsg({ type: 'error', text: 'Failed to update alert settings.' });
      fetchConfig(); // rollback
    }
  };

  const handleSendTestMessage = async () => {
    setActionLoading('test');
    setStatusMsg(null);
    try {
      const res = await fetch('/api/whatsapp/test', { method: 'POST' });
      const data = await res.json().catch(() => ({ success: false }));
      if (res.ok && data.success) {
        setStatusMsg({ type: 'success', text: 'Test message sent successfully to WhatsApp!' });
      } else {
        setStatusMsg({ type: 'error', text: data.msg || data.error || 'Green API not configured or offline.' });
      }
    } catch (error: any) {
      setStatusMsg({ type: 'error', text: `Failed: ${error?.message || 'Verification failed.'}` });
    } finally {
      setActionLoading(null);
      fetchConfig();
    }
  };

  const handleClearLogs = async () => {
    setActionLoading('clear_logs');
    try {
      const res = await fetch('/api/whatsapp/logs/clear', { method: 'POST' });
      if (res.ok) {
        setStatusMsg({ type: 'success', text: 'WhatsApp logs successfully cleared.' });
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Failed to clear WhatsApp logs.' });
    } finally {
      setActionLoading(null);
      fetchConfig();
    }
  };

  const triggerCustomNotification = async (eventType: string, setupData: any, customParams: any = {}) => {
    setActionLoading(eventType);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/whatsapp/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType,
          setup: setupData,
          customParams
        })
      });
      const data = await res.json().catch(() => ({ success: false }));
      if (res.ok && data.success) {
        setStatusMsg({ type: 'success', text: `Sent ${eventType} notification to WhatsApp queue.` });
      } else {
        setStatusMsg({ type: 'error', text: data.error || 'Notification skipped or unconfigured.' });
      }
    } catch (error: any) {
      setStatusMsg({ type: 'error', text: `Notification Failed: ${error?.message || 'Connection failed'}` });
    } finally {
      setActionLoading(null);
      fetchConfig();
    }
  };

  const handleSendManualReport = (type: 'DAILY' | 'WEEKLY') => {
    const wins = tradeHistory.filter(t => t.state === 'TP3_HIT').length;
    const losses = tradeHistory.filter(t => t.state === 'STOP_LOSS_HIT').length;
    const totalTrades = tradeHistory.length;
    const winRate = totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0;
    const pointsCaptured = tradeHistory.reduce((sum, t) => sum + (t.finalProfitPts || 0), 0).toFixed(2);

    const mockSetup = {
      id: `manual-report-${Date.now()}`,
      direction: 'BULLISH',
      entryPrice: currentPrice,
    };

    triggerCustomNotification(type === 'DAILY' ? 'DAILY_REPORT' : 'WEEKLY_REPORT', mockSetup, {
      totalTrades,
      wins,
      losses,
      winRate,
      pointsCaptured,
      marketOutlook: 'The Spot Gold market shows solid institutional buyer absorption around the daily discount zone. High timeframe bias remains heavily bullish heading into next session.'
    });
  };

  const handleSendNewsAlert = () => {
    const mockSetup = {
      id: `news-${Date.now()}`,
      direction: 'NONE',
      entryPrice: currentPrice,
    };
    triggerCustomNotification('NEWS_WARNING', mockSetup, {
      newsHeadline: '⚠️ US Core Retail Sales m/m',
      impactLevel: 'HIGH',
      releaseTime: '8:30 AM EST (In 15 minutes)',
      forecast: '0.4% Forecast vs 0.2% Previous',
      advisory: 'Exceptional spreads expansion expected. Standard risk parameters must be strictly reduced by 50% or flat hands.'
    });
  };

  const handleSendOpportunityAlert = () => {
    const mockSetup = {
      id: `opportunity-${Date.now()}`,
      direction: 'BULLISH',
      entryPrice: currentPrice,
      entryZone: `${(currentPrice - 0.4).toFixed(2)} - ${(currentPrice + 0.4).toFixed(2)}`,
      stopLoss: currentPrice - 3.5,
      tp1: currentPrice + 4.0,
      tp2: currentPrice + 8.5,
      tp3: currentPrice + 16.0,
      riskRewardRatio: '1:4.5',
      confidence: 94,
      probability: 91,
      qualityScore: 95,
      expectedTrigger: 'M1 Double Bottom + Volume Expansion',
      marketStory: 'A massive sell-stop sweep completed below previous daily low. Premium Tier-1 institutional orders are flooding order-books.'
    };
    triggerCustomNotification('EXCEPTIONAL_OPPORTUNITY', mockSetup, {
      headline: '⭐️ ELITE A+ INSTITUTIONAL OPPORTUNITY DETECTED',
      reasons: 'Perfect confluence of H1 Order Block tap, M15 liquidity pool sweep, and M1 BOS expansion.'
    });
  };

  if (loading) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-lg flex items-center justify-center h-[120px]">
        <Loader2 className="h-5 w-5 text-amber-500 animate-spin" />
        <span className="text-xs text-slate-400 font-mono ml-2">Loading WhatsApp Hub...</span>
      </div>
    );
  }

  const isConfigured = state?.isConfigured || false;

  return (
    <section id="panel-whatsapp-assistant" className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex flex-col shadow-lg">
      {/* HEADER SECTION */}
      <div 
        onClick={() => setIsOpen(!isOpen)} 
        className="p-4 flex justify-between items-center bg-slate-900 hover:bg-slate-850 cursor-pointer transition-colors border-b border-slate-800/50"
      >
        <div className="flex items-center gap-2">
          <MessageSquare className={`h-4.5 w-4.5 ${isConfigured ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-300">WhatsApp Alert Hub</h2>
            <p className="text-[9px] text-slate-500 font-mono">Green API Notification Engine</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-1.5 py-0.5 text-[8px] font-bold rounded uppercase tracking-wider ${
            isConfigured ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30' : 'bg-slate-950 text-slate-400 border border-slate-900'
          }`}>
            {isConfigured ? 'Connected' : 'Unconfigured'}
          </span>
          <span className="text-slate-500 text-xs font-mono">{isOpen ? '▼' : '▲'}</span>
        </div>
      </div>

      {/* EXPANDABLE SECTION */}
      {(!isOpen) && (
        <div className="p-3 bg-slate-950/40 text-[10px] text-slate-400 flex justify-between items-center font-mono">
          <span>Active Queues: {state?.queue.length || 0}</span>
          <span>Delivery Success Rate: {state && state.logs.length > 0 ? Math.round((state.logs.filter(l => l.status === 'SENT').length / state.logs.length) * 100) : 100}%</span>
        </div>
      )}

      {isOpen && (
        <div className="p-4 flex flex-col gap-4 bg-slate-950/40 border-t border-slate-950">
          
          {/* CREDENTIALS METRICS */}
          <div className="bg-slate-950 p-3 rounded border border-slate-900 text-xs">
            <div className="flex justify-between items-center mb-1 pb-1 border-b border-slate-900">
              <span className="text-slate-500 uppercase text-[9px] font-bold">Credential Status</span>
              <span className={`inline-flex items-center gap-1 text-[9px] font-bold ${isConfigured ? 'text-emerald-400' : 'text-amber-500'}`}>
                {isConfigured ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                {isConfigured ? 'Securely Loaded' : 'Awaiting Config'}
              </span>
            </div>
            {isConfigured ? (
              <div className="space-y-1 font-mono text-[10px] text-slate-400">
                <div className="flex justify-between"><span className="text-slate-500">Instance ID:</span> <span>{state?.instanceId}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Recipient Phone:</span> <span>{state?.phoneNumber}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">API Endpoint:</span> <span className="text-slate-500 overflow-ellipsis truncate max-w-[150px]">{state?.apiUrl}</span></div>
              </div>
            ) : (
              <p className="text-[10px] text-slate-500 leading-normal">
                Credentials are automatically loaded from secure server-side variables. Ensure <code className="text-slate-300">GREEN_INSTANCE_ID</code> & <code className="text-slate-300">WHATSAPP_PHONE_NUMBER</code> are set in the secrets configuration.
              </p>
            )}
          </div>

          {/* DYNAMIC FEEDBACK FEED */}
          {statusMsg && (
            <div className={`p-2.5 rounded text-[11px] flex gap-2 items-start ${
              statusMsg.type === 'success' 
                ? 'bg-emerald-950/20 border border-emerald-900/40 text-emerald-300' 
                : 'bg-rose-950/20 border border-rose-900/40 text-rose-300'
            }`}>
              {statusMsg.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> : <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />}
              <span className="leading-tight">{statusMsg.text}</span>
            </div>
          )}

          {/* CHANNELS TOGGLE BLOCK */}
          <div className="space-y-2">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Sliders className="h-3 w-3 text-amber-500" /> Alert Category Triggers
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
              {[
                { key: 'newSetup', label: '🎯 Fresh Setup Alerts' },
                { key: 'entryTrigger', label: '⚡ Entry Trigger Alerts' },
                { key: 'tpTrigger', label: '💰 Take Profit Alerts' },
                { key: 'slTrigger', label: '🚨 Stop Loss Alerts' },
                { key: 'dailyReport', label: '📊 Daily Performance Report' },
                { key: 'weeklyReport', label: '🗓️ Weekly Macro Summary' },
                { key: 'newsAlert', label: '⚠️ High Impact News Alerts' },
                { key: 'opportunityAlert', label: '⭐️ Exceptional Opp. Alerts' }
              ].map(item => {
                const settingKey = item.key as keyof WhatsAppSettings;
                const isChecked = state?.settings?.[settingKey] ?? false;
                return (
                  <button 
                    key={item.key}
                    onClick={() => handleToggleSetting(settingKey)}
                    className={`flex items-center justify-between p-2 rounded text-left border cursor-pointer transition-all ${
                      isChecked 
                        ? 'bg-amber-500/5 border-amber-500/20 text-amber-200' 
                        : 'bg-slate-950/20 border-slate-900 text-slate-500 hover:text-slate-400'
                    }`}
                  >
                    <span className="text-[10px] tracking-wide font-medium">{item.label}</span>
                    <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${
                      isChecked ? 'bg-amber-500 border-amber-500' : 'border-slate-700 bg-slate-950'
                    }`}>
                      {isChecked && <Check className="h-3 w-3 text-slate-950 font-black" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* TELEMETRY PREVIEW TRIGGERS */}
          <div className="space-y-2 pt-1.5 border-t border-slate-900/60">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Send className="h-3 w-3 text-amber-500" /> Dispatch Test Alerts
            </h3>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={actionLoading !== null || !isConfigured}
                onClick={handleSendTestMessage}
                className="bg-slate-950 hover:bg-slate-900 disabled:opacity-40 text-slate-300 text-[10px] font-bold uppercase py-2 rounded border border-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {actionLoading === 'test' ? <Loader2 className="h-3 w-3 animate-spin text-amber-500" /> : <MessageSquare className="h-3 w-3 text-amber-500" />}
                Basic Test Msg
              </button>

              <button
                disabled={actionLoading !== null || !isConfigured}
                onClick={handleSendNewsAlert}
                className="bg-slate-950 hover:bg-slate-900 disabled:opacity-40 text-slate-300 text-[10px] font-bold uppercase py-2 rounded border border-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {actionLoading === 'NEWS_WARNING' ? <Loader2 className="h-3 w-3 animate-spin text-amber-500" /> : <ShieldAlert className="h-3 w-3 text-rose-500" />}
                News Alert
              </button>

              <button
                disabled={actionLoading !== null || !isConfigured}
                onClick={() => handleSendManualReport('DAILY')}
                className="bg-slate-950 hover:bg-slate-900 disabled:opacity-40 text-slate-300 text-[10px] font-bold uppercase py-2 rounded border border-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {actionLoading === 'DAILY_REPORT' ? <Loader2 className="h-3 w-3 animate-spin text-amber-500" /> : <Calendar className="h-3 w-3 text-emerald-500" />}
                Daily Report
              </button>

              <button
                disabled={actionLoading !== null || !isConfigured}
                onClick={handleSendOpportunityAlert}
                className="bg-slate-950 hover:bg-slate-900 disabled:opacity-40 text-slate-300 text-[10px] font-bold uppercase py-2 rounded border border-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {actionLoading === 'EXCEPTIONAL_OPPORTUNITY' ? <Loader2 className="h-3 w-3 animate-spin text-amber-500" /> : <TrendingUp className="h-3 w-3 text-amber-500 animate-pulse" />}
                A+ Opportunity
              </button>
            </div>
          </div>

          {/* REALTIME DELIVERY LOGS */}
          <div className="space-y-2 pt-2.5 border-t border-slate-900/60 flex-1 flex flex-col min-h-[220px]">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Info className="h-3 w-3 text-amber-500" /> Execution Queue & Logs
              </h3>
              <div className="flex gap-2">
                <button 
                  onClick={fetchConfig}
                  className="text-slate-500 hover:text-slate-300 text-[9px] font-bold flex items-center gap-1 cursor-pointer"
                  title="Force Refresh Log Feed"
                >
                  <RefreshCw className="h-2.5 w-2.5" />
                </button>
                <button
                  disabled={actionLoading === 'clear_logs' || !state?.logs.length}
                  onClick={handleClearLogs}
                  className="text-rose-500/70 hover:text-rose-400 disabled:opacity-40 text-[9px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="h-2.5 w-2.5" /> Clear Logs
                </button>
              </div>
            </div>

            <div className="bg-slate-950 rounded border border-slate-900/80 p-2 text-[10px] font-mono flex-1 overflow-y-auto max-h-[240px] space-y-1.5 min-h-[160px]">
              {state?.logs.length === 0 ? (
                <div className="text-center text-slate-600 italic py-12 leading-relaxed">
                  WhatsApp telemetry feed empty.<br />Active signal events will stream here.
                </div>
              ) : (
                state?.logs.map((log) => (
                  <div key={log.id} className="p-2 rounded bg-slate-900/50 border border-slate-900 text-[10px] flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[9px] border-b border-slate-950 pb-1 mb-1">
                      <span className="text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      <span className={`font-bold px-1 rounded uppercase tracking-widest text-[8px] ${
                        log.status === 'SENT' ? 'bg-emerald-950/40 text-emerald-400' :
                        log.status === 'QUEUED' ? 'bg-amber-950/40 text-amber-400 animate-pulse' :
                        'bg-rose-950/40 text-rose-400'
                      }`}>
                        {log.status} {log.retries > 0 && `(Retry x${log.retries})`}
                      </span>
                    </div>
                    <div className="flex justify-between text-[9px]">
                      <span className="text-amber-500 font-bold uppercase tracking-wider">{log.eventType}</span>
                    </div>
                    <p className="text-slate-300 bg-slate-950 p-1 rounded font-mono leading-tight max-h-[80px] overflow-y-auto whitespace-pre-wrap select-text text-[9.5px]">
                      {log.message}
                    </p>
                    {log.error && (
                      <span className="text-[8px] text-rose-400 font-semibold bg-rose-950/10 p-1 rounded block select-all">
                        Error: {log.error}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}
    </section>
  );
};
