import fs from 'fs/promises';
import path from 'path';

// WhatsApp notification settings interface
export interface WhatsAppSettings {
  enabled: boolean;
  newSetupAlerts: boolean;
  entryTriggerAlerts: boolean;
  tpAlerts: boolean;
  stopLossAlerts: boolean;
  dailyReport: boolean;
  weeklyReport: boolean;
  newsAlerts: boolean;
  emergencyAlerts: boolean;
}

// WhatsApp delivery log interface
export interface WhatsAppLogItem {
  id: string;
  timestamp: number;
  setupId: string;
  eventType: string;
  message: string;
  success: boolean;
  attempts: number;
  error?: string;
}

// Queued message interface
export interface WhatsAppQueueItem {
  id: string;
  chatId: string;
  message: string;
  eventType: string;
  setupId: string;
  addedAt: number;
  attempts: number;
  nextRetryAt: number;
}

// Store structure for file persistence
interface WhatsAppStore {
  settings: WhatsAppSettings;
  logs: WhatsAppLogItem[];
  queue: WhatsAppQueueItem[];
  sentKeys: string[]; // Duplicate prevention: format is `${setupId}_${eventType}`
}

const STORE_FILE_PATH = path.join(process.cwd(), 'whatsapp_store.json');

const DEFAULT_SETTINGS: WhatsAppSettings = {
  enabled: true,
  newSetupAlerts: true,
  entryTriggerAlerts: true,
  tpAlerts: true,
  stopLossAlerts: true,
  dailyReport: true,
  weeklyReport: true,
  newsAlerts: true,
  emergencyAlerts: true,
};

export class WhatsAppService {
  private static instance: WhatsAppService;
  private settings: WhatsAppSettings = { ...DEFAULT_SETTINGS };
  private logs: WhatsAppLogItem[] = [];
  private queue: WhatsAppQueueItem[] = [];
  private sentKeys: string[] = [];
  private isProcessingQueue = false;
  private queueInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.init();
  }

  public static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService();
    }
    return WhatsAppService.instance;
  }

  /**
   * Initialize and load persisted store from disk
   */
  private async init() {
    try {
      const exists = await fs.access(STORE_FILE_PATH).then(() => true).catch(() => false);
      if (exists) {
        const fileContent = await fs.readFile(STORE_FILE_PATH, 'utf-8');
        const parsed: WhatsAppStore = JSON.parse(fileContent);
        this.settings = { ...DEFAULT_SETTINGS, ...parsed.settings };
        this.logs = parsed.logs || [];
        this.queue = parsed.queue || [];
        this.sentKeys = parsed.sentKeys || [];
        console.log(`[WhatsAppService] Persisted data loaded successfully. Loaded ${this.logs.length} logs, ${this.queue.length} queued items.`);
      } else {
        await this.saveStore();
        console.log('[WhatsAppService] Initialized default whatsapp_store.json file.');
      }
    } catch (error) {
      console.error('[WhatsAppService] Initialization error:', error);
    }

    // Periodically run background queue processing
    this.startQueueWorker();
  }

  /**
   * Save current store to disk
   */
  private async saveStore() {
    try {
      const dataToSave: WhatsAppStore = {
        settings: this.settings,
        logs: this.logs.slice(-200), // Keep last 200 logs to prevent file bloat
        queue: this.queue,
        sentKeys: this.sentKeys.slice(-1000), // Keep last 1000 keys for duplicate check
      };
      await fs.writeFile(STORE_FILE_PATH, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (error) {
      console.error('[WhatsAppService] Error saving store to disk:', error);
    }
  }

  /**
   * Retrieve Green API credentials from environment variables
   */
  public getCredentials() {
    const apiUrl = process.env.GREEN_API_URL || 'https://7107.api.greenapi.com';
    const mediaUrl = process.env.GREEN_MEDIA_URL || 'https://7107.api.greenapi.com';
    const instanceId = process.env.GREEN_INSTANCE_ID || '';
    const apiToken = process.env.GREEN_API_TOKEN || '';
    const phoneNumber = process.env.WHATSAPP_PHONE_NUMBER || '';

    return { apiUrl, mediaUrl, instanceId, apiToken, phoneNumber };
  }

  /**
   * Check whether Green API credentials are validly set and not placeholder values
   */
  public isConfigured(): boolean {
    const { instanceId, apiToken, phoneNumber } = this.getCredentials();
    if (!instanceId || !apiToken || !phoneNumber) return false;

    const placeholders = [
      'ENTER_YOUR',
      'YOUR_',
      'CHANGE_ME',
      'ENTER_YOUR_INSTANCE_ID',
      'ENTER_YOUR_API_TOKEN',
      'ENTER_YOUR_PHONE_NUMBER',
      '7107615856',
      '22ba1ed4ea2c4759bfb0a0ca316906973431128b60374e3097',
      '254701434851'
    ];

    const isPlaceholder = (val: string) =>
      placeholders.some((p) => val.toUpperCase().includes(p.toUpperCase()));

    return !isPlaceholder(instanceId) && !isPlaceholder(apiToken) && !isPlaceholder(phoneNumber);
  }

  /**
   * Returns current settings
   */
  public getSettings(): WhatsAppSettings {
    return this.settings;
  }

  /**
   * Update and save settings
   */
  public async updateSettings(newSettings: Partial<WhatsAppSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    await this.saveStore();
    console.log('[WhatsAppService] Settings updated:', this.settings);
    return this.settings;
  }

  /**
   * Returns the log history
   */
  public getLogs(): WhatsAppLogItem[] {
    return this.logs;
  }

  /**
   * Returns the current message queue
   */
  public getQueue(): WhatsAppQueueItem[] {
    return this.queue;
  }

  /**
   * Clear logs
   */
  public async clearLogs() {
    this.logs = [];
    await this.saveStore();
  }

  /**
   * Background worker to process queued messages with backoff
   */
  private startQueueWorker() {
    if (this.queueInterval) {
      clearInterval(this.queueInterval);
    }
    this.queueInterval = setInterval(() => {
      this.processQueue();
    }, 15000); // Check every 15 seconds
  }

  /**
   * Sends or queues a WhatsApp message to the registered phone number
   */
  public async sendNotification(message: string, eventType: string, setupId: string = 'SYSTEM'): Promise<boolean> {
    if (!this.isConfigured()) {
      console.log(`[WhatsAppService] Green API unconfigured or placeholder credentials. Skipping event: ${eventType}`);
      return false;
    }

    const { phoneNumber } = this.getCredentials();
    const chatId = `${phoneNumber.replace('+', '').trim()}@c.us`;

    // 1. Check master setting
    if (!this.settings.enabled) {
      console.log(`[WhatsAppService] Integration is disabled. Skipping event: ${eventType}`);
      return false;
    }

    // 2. Check individual alert settings
    if (!this.isAlertEnabledForEvent(eventType)) {
      console.log(`[WhatsAppService] Notification type '${eventType}' is disabled in settings.`);
      return false;
    }

    // 3. Duplicate Prevention: Each Setup ID can only generate one notification per event.
    const duplicateKey = `${setupId}_${eventType}`;
    if (setupId !== 'SYSTEM' && this.sentKeys.includes(duplicateKey)) {
      console.log(`[WhatsAppService] Prevented duplicate notification for key: ${duplicateKey}`);
      return false;
    }

    if (setupId !== 'SYSTEM') {
      this.sentKeys.push(duplicateKey);
    }

    // 4. Send Message
    const success = await this.sendMessageImmediate(chatId, message, eventType, setupId);
    
    if (!success && this.isConfigured()) {
      // Offline/Transient Failure: Queue the message
      this.queueMessage(chatId, message, eventType, setupId);
    }

    await this.saveStore();
    return success;
  }

  /**
   * Check if a specific event alert type is active in settings
   */
  private isAlertEnabledForEvent(eventType: string): boolean {
    switch (eventType) {
      case 'NEW_SETUP':
      case 'EXCEPTIONAL_OPPORTUNITY':
        return this.settings.newSetupAlerts;
      case 'ENTRY_ACTIVATED':
        return this.settings.entryTriggerAlerts;
      case 'TP1_HIT':
      case 'TP2_HIT':
      case 'TP3_HIT':
        return this.settings.tpAlerts;
      case 'STOP_LOSS_HIT':
        return this.settings.stopLossAlerts;
      case 'DAILY_REPORT':
        return this.settings.dailyReport;
      case 'WEEKLY_REPORT':
        return this.settings.weeklyReport;
      case 'NEWS_WARNING':
        return this.settings.newsAlerts;
      case 'EMERGENCY':
        return this.settings.emergencyAlerts;
      default:
        return true; // Default to send if event type doesn't map directly
    }
  }

  /**
   * Low-level method to send a Green API message immediately
   */
  private async sendMessageImmediate(
    chatId: string,
    message: string,
    eventType: string,
    setupId: string,
    attempt: number = 1
  ): Promise<boolean> {
    if (!this.isConfigured()) {
      console.log('[WhatsAppService] Green API unconfigured. Skipping message dispatch.');
      this.logDelivery(setupId, eventType, message, false, 1, 'Green API credentials not configured.');
      return false;
    }

    const { apiUrl, instanceId, apiToken } = this.getCredentials();
    const endpoint = `${apiUrl.replace(/\/$/, '')}/waInstance${instanceId}/sendMessage/${apiToken}`;

    try {
      console.log(`[WhatsAppService] Sending message to ${chatId} (Attempt ${attempt})...`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chatId, message }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        const isNonRetryable = response.status === 404 || response.status === 401 || response.status === 403 || response.status === 400;
        const errDetail = response.status === 404 
          ? `Green API returned status code 404 (Instance/Token not found. Verify GREEN_INSTANCE_ID)`
          : response.status === 401 || response.status === 403
          ? `Green API Authentication Failed (${response.status}). Verify GREEN_API_TOKEN.`
          : `Green API returned HTTP ${response.status}: ${errorText || 'Bad Request'}`;

        console.error(`[WhatsAppService] Failed to send message (Attempt ${attempt}): ${errDetail}`);

        if (isNonRetryable || attempt >= 3) {
          this.logDelivery(setupId, eventType, message, false, attempt, errDetail);
          return false;
        }

        const delay = Math.pow(2, attempt) * 2000;
        console.log(`[WhatsAppService] Retrying transient error in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.sendMessageImmediate(chatId, message, eventType, setupId, attempt + 1);
      }

      const body = await response.json();
      if (!body || !body.idMessage) {
        throw new Error(`Invalid Green API response payload: ${JSON.stringify(body)}`);
      }

      console.log(`[WhatsAppService] Message delivered successfully. ID: ${body.idMessage}`);
      this.logDelivery(setupId, eventType, message, true, attempt);
      return true;
    } catch (error: any) {
      const isNonRetryable = error?.message?.includes('404') || error?.message?.includes('401') || error?.message?.includes('403');
      console.error(`[WhatsAppService] Failed to send message (Attempt ${attempt}):`, error?.message || error);
      
      if (!isNonRetryable && attempt < 3) {
        const delay = Math.pow(2, attempt) * 2000; // Exponential backoff: 4s, 8s
        console.log(`[WhatsAppService] Retrying transient error in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.sendMessageImmediate(chatId, message, eventType, setupId, attempt + 1);
      }

      this.logDelivery(setupId, eventType, message, false, attempt, error?.message || 'Network/Server Error');
      return false;
    }
  }

  /**
   * Append an event to the delivery logs
   */
  private logDelivery(
    setupId: string,
    eventType: string,
    message: string,
    success: boolean,
    attempts: number,
    error?: string
  ) {
    const logItem: WhatsAppLogItem = {
      id: `LOG_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      setupId,
      eventType,
      message,
      success,
      attempts,
      error,
    };
    this.logs.unshift(logItem);
  }

  /**
   * Add message to offline queue
   */
  private queueMessage(chatId: string, message: string, eventType: string, setupId: string) {
    if (!this.isConfigured()) return;

    const queueItem: WhatsAppQueueItem = {
      id: `QUEUE_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      chatId,
      message,
      eventType,
      setupId,
      addedAt: Date.now(),
      attempts: 0,
      nextRetryAt: Date.now() + 10000,
    };
    this.queue.push(queueItem);
    console.log(`[WhatsAppService] Message queued. Queue size: ${this.queue.length}`);
  }

  /**
   * Process and flush queued messages sequentially
   */
  private async processQueue() {
    if (!this.isConfigured()) {
      if (this.queue.length > 0) {
        this.queue = [];
        await this.saveStore();
      }
      return;
    }

    if (this.isProcessingQueue || this.queue.length === 0) return;
    this.isProcessingQueue = true;

    console.log(`[WhatsAppService] Processing queue (${this.queue.length} items)...`);
    const now = Date.now();
    const activeQueue = [...this.queue];

    for (const item of activeQueue) {
      if (now < item.nextRetryAt) continue;

      item.attempts++;
      const success = await this.sendMessageImmediate(item.chatId, item.message, item.eventType, item.setupId, item.attempts);

      if (success || !this.isConfigured() || item.attempts >= 3) {
        // Remove from queue if successful, unconfigured, or max attempts exceeded
        this.queue = this.queue.filter((q) => q.id !== item.id);
      } else {
        // Update retry timer with exponential backoff
        const nextBackoff = Math.min(60 * 60 * 1000, Math.pow(3, item.attempts) * 10000);
        item.nextRetryAt = Date.now() + nextBackoff;
        console.log(`[WhatsAppService] Queue item ${item.id} failed again. Rescheduled retry in ${nextBackoff / 1000}s.`);
      }
      await this.saveStore();
    }

    this.isProcessingQueue = false;
  }

  /**
   * Trigger manually from the UI to test connections
   */
  public async sendTestMessage(): Promise<{ success: boolean; msg: string }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        msg: 'Green API credentials are not configured or using default placeholders. Please set GREEN_INSTANCE_ID, GREEN_API_TOKEN, and WHATSAPP_PHONE_NUMBER in Secrets.'
      };
    }

    const { phoneNumber } = this.getCredentials();
    const testMessage = `🧪 *GOLD SNIPER AI SCALPER: TEST MESSAGE* \n\nYour Green API WhatsApp integration is successfully configured and active!\n\n🕒 *Timestamp:* ${new Date().toLocaleTimeString()}\n🔒 *Status:* COMPLIANT & CONNECTED\n📊 *Security Level:* INSTITUTIONAL ENGINE`;
    
    // Bypass normal disabled flag to allow manual tests
    const chatId = `${phoneNumber.replace('+', '').trim()}@c.us`;
    const success = await this.sendMessageImmediate(chatId, testMessage, 'TEST_ALERT', 'TEST_ID');
    
    if (success) {
      return { success: true, msg: 'Test message sent successfully to ' + phoneNumber };
    } else {
      return { success: false, msg: 'Failed to deliver test message. Verify GREEN_INSTANCE_ID and GREEN_API_TOKEN in Secrets.' };
    }
  }

  /**
   * Build beautiful templated notification messages based on trading events
   */
  public buildMessage(eventType: string, setup: any, customParams: any = {}): string {
    const timestampStr = new Date().toLocaleString('en-US', { timeZone: 'UTC' }) + ' UTC';
    
    switch (eventType) {
      case 'AUTO_EXEC_ENABLED': {
        return `🤖 *AUTO EXECUTION ENABLED*

The Gold Institutional AI Scalper has been authorized to automatically execute trades on the connected MT5 account.

Risk Profile:
• Lot Size: ${customParams.lotSize || '0.10'}
• Risk %: ${customParams.riskPercent || '1.0%'}
• Max Daily Loss: $${customParams.maxDailyLoss || '1000'}
• Max Open Trades: ${customParams.maxOpenTrades || '3'}

Time: ${timestampStr}`;
      }

      case 'AUTO_EXEC_DISABLED': {
        return `⚪ *AUTO EXECUTION DISABLED*

Auto execution mode has been deactivated. The terminal has reverted to AI Analyst mode.

Reason: ${customParams.reason || 'User manual request.'}

Time: ${timestampStr}`;
      }

      case 'AUTO_EXEC_PLACED': {
        const directionStr = setup.direction === 'BULLISH' ? 'BUY' : setup.direction === 'BEARISH' ? 'SELL' : setup.direction || 'BUY';
        return `🤖 *AUTO EXECUTION*

Trade Executed

Setup ID:
#${setup.id || 'N/A'}

Symbol:
${customParams.symbol || 'XAU/USD'}

Direction:
${directionStr}

Entry:
${setup.entryPrice || 'N/A'}

Stop Loss:
${setup.stopLoss || 'N/A'}

TP1:
${setup.tp1 || 'N/A'}

TP2:
${setup.tp2 || 'N/A'}

TP3:
${setup.tp3 || 'N/A'}

Lot Size:
${customParams.lotSize || '0.10'}

Risk:
${customParams.risk || '1%'}

Quality:
${setup.qualityScore || '95'}%

Confidence:
${setup.confidence || '90'}%`;
      }

      case 'AUTO_EXEC_MODIFIED': {
        return `🤖 *AUTO EXECUTION MODIFIED*

Setup ID: #${setup.id || 'N/A'}
Action: ${customParams.action || 'Stop moved to break-even'}
Current Price: ${customParams.currentPrice || 'N/A'}
Time: ${timestampStr}`;
      }

      case 'TRADE_PROTECTED': {
        const directionStr = setup.direction === 'BULLISH' ? 'BULLISH' : setup.direction === 'BEARISH' ? 'BEARISH' : setup.direction || 'BUY';
        return `🛡 *TRADE PROTECTED*

Setup ID: #${setup.id || 'N/A'}
Direction: ${directionStr}
Entry: ${setup.entryPrice || 'N/A'}
Original Stop: ${customParams.originalStop || 'N/A'}
New Stop: ${setup.stopLoss || 'N/A'}
Dynamic Buffer: ${customParams.dynamicBuffer || '0.20'}
Current Spread: ${customParams.currentSpread || 'N/A'}
Current ATR: ${customParams.currentATR || 'N/A'}

Reason: TP1 verified using live Deriv data. Capital is now protected.`;
      }

      case 'AUTO_EXEC_EMERGENCY': {
        return `🚨 *EMERGENCY SAFETY ACTIVATED*

Auto Execution has been IMMEDIATELY disabled!

Reason: ${customParams.reason || 'Safety limit breached.'}
Account Balance: $${customParams.balance || 'N/A'}
Margin Level: ${customParams.marginLevel || 'N/A'}%

The system has reverted to AI Analyst mode only. Please review active orders and market exposure.

Time: ${timestampStr}`;
      }

      case 'NEW_SETUP':
      case 'EXCEPTIONAL_OPPORTUNITY': {
        const isExceptional = eventType === 'EXCEPTIONAL_OPPORTUNITY';
        const header = isExceptional 
          ? '🌟 INSTITUTIONAL GOLD OPPORTUNITY (EXCEPTIONAL) 🌟'
          : `🚨 GOLD SNIPER SETUP #${setup.id || 'N/A'}`;

        const directionStr = setup.direction === 'BULLISH' ? 'BUY' : setup.direction === 'BEARISH' ? 'SELL' : setup.direction || 'BUY';
        const reasons = Array.isArray(setup.institutionalReasoning) 
          ? setup.institutionalReasoning.join('\n- ') 
          : Array.isArray(setup.reasons) 
            ? setup.reasons.join('\n- ')
            : 'SMC Confluence Confirmation';

        return `${header}

Status:
${isExceptional ? 'EXCEPTIONAL INSTITUTIONAL ENTRY READY' : (setup.state || 'READY TO EXECUTE')}

Direction:
${directionStr}

Current Price:
$${customParams.currentPrice || setup.entryPrice || 'N/A'}

Entry:
$${setup.entryPrice || setup.optimalEntry || 'N/A'}

Entry Zone:
${setup.entryZone || setup.entryWindow || 'N/A'}

Stop Loss:
$${setup.stopLoss || 'N/A'}

Take Profit 1:
$${setup.tp1 || 'N/A'}

Take Profit 2:
$${setup.tp2 || 'N/A'}

Take Profit 3:
$${setup.tp3 || 'N/A'}

Risk Reward:
${setup.riskRewardRatio || '1:3'}

Quality Score:
${setup.qualityScore || 85}/100

Confidence:
${setup.confidence || 80}%

Probability:
${setup.probability || 80}%

Expected Holding Time:
${setup.holdingTime || '15-45 mins'}

Institutional Reason:
- ${reasons}

Market Story:
${setup.marketStory || 'Heavy sell-side liquidity swept. High-volume displacement into premium order block.'}

Generated:
${timestampStr}`;
      }

      case 'ENTRY_ACTIVATED': {
        const directionStr = setup.direction === 'BULLISH' ? 'BUY' : setup.direction === 'BEARISH' ? 'SELL' : setup.direction || 'BUY';
        return `🟢 ENTRY ACTIVATED

Setup ID:
${setup.id || 'N/A'}

Direction:
${directionStr}

Entry Executed:
$${setup.entryPrice || 'N/A'}

Current Price:
$${customParams.currentPrice || setup.entryPrice || 'N/A'}

Floating P/L:
${customParams.floatingPL || '+0.0 Pts'}`;
      }

      case 'TP1_HIT':
      case 'TP2_HIT':
      case 'TP3_HIT': {
        const index = eventType.split('_')[0]; // "TP1", "TP2" or "TP3"
        return `🎯 ${index} HIT

Setup ID:
${setup.id || 'N/A'}

Entry:
$${setup.entryPrice || 'N/A'}

Current Price:
$${customParams.currentPrice || 'N/A'}

Profit:
+${customParams.profit || '0.0'} Pts

Holding Time:
${customParams.holdingTime || setup.holdingTime || 'N/A'}`;
      }

      case 'STOP_LOSS_HIT': {
        return `❌ STOP LOSS HIT

Setup ID:
${setup.id || 'N/A'}

Loss:
-${customParams.loss || '0.0'} Pts

Holding Time:
${customParams.holdingTime || setup.holdingTime || 'N/A'}

Reason:
${customParams.invalidationReason || 'Market swept structural high/low, breaking institutional alignment.'}`;
      }

      case 'TRADE_CANCELLED': {
        return `⚠️ TRADE CANCELLED

Setup ID:
${setup.id || 'N/A'}

Reason:
${customParams.reason || 'SMC metrics shift. Market structure setup dissolved to preserve capital margins.'}

Date:
${timestampStr}`;
      }

      case 'TRADE_EXPIRED': {
        return `⏳ TRADE EXPIRED

Setup ID:
${setup.id || 'N/A'}

Reason:
${customParams.reason || 'Timeframe boundary exceeded without triggering the entry price parameters.'}

Date:
${timestampStr}`;
      }

      case 'NEWS_WARNING': {
        return `📰 HIGH IMPACT NEWS WARNING

Event:
${customParams.event || 'US FOMC Statement / NFP Release'}

Impact:
HIGH VOLATILITY EXPECTED

Gold (XAU/USD) Recommendation:
${customParams.recommendation || 'Hedge funds recommending flat/reduced size exposure. Safe-haven assets active.'}

Time:
${customParams.time || timestampStr}`;
      }

      case 'DAILY_REPORT': {
        const stats = customParams.stats || {};
        return `📊 GOLD DAILY PERFORMANCE

Date:
${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

Total Trades:
${stats.totalTrades || 0}

Wins:
${stats.wins || 0}

Losses:
${stats.losses || 0}

Cancelled:
${stats.cancelled || 0}

Win Rate:
${stats.winRate || 0}%

Average RR:
${stats.averageRR || '1:2.8'}

Profit Factor:
${stats.profitFactor || '1.92'}

Current Open Trades:
${stats.openTrades || 0}

Best Trade:
${stats.bestTrade || 'N/A'}

Worst Trade:
${stats.worstTrade || 'N/A'}`;
      }

      case 'WEEKLY_REPORT': {
        const stats = customParams.stats || {};
        return `📈 WEEKLY GOLD REPORT

Total Trades:
${stats.totalTrades || 0}

Winning Trades:
${stats.wins || 0}

Losing Trades:
${stats.losses || 0}

Win Rate:
${stats.winRate || 0}%

Profit Factor:
${stats.profitFactor || '2.14'}

Average RR:
${stats.averageRR || '1:3.1'}

Maximum Drawdown:
${stats.maxDrawdown || '0.0 Pts'}

Best Performing Setup Type:
${stats.bestSetupType || 'Premium Order Block Sweep'}

Worst Performing Setup Type:
${stats.worstSetupType || 'Aggressive FVG Re-entry'}

AI Recommendations:
${stats.aiRecommendations || '- Trade only during NY Session liquidity sweeps.\n- Cut positions early if volume dies down in London lunch.\n- Wait for M1 BOS confirmation.'}`;
      }

      case 'CLOSED': {
        return `🏁 TRADE CLOSED

Setup ID:
${setup.id || 'N/A'}

Result:
${customParams.result || (setup.state === 'STOP_LOSS_HIT' ? 'LOSS' : 'WIN')}

Exit Price:
$${customParams.exitPrice || 'N/A'}

Risk Reward Achieved:
${customParams.achievedRR || setup.riskRewardRatio || 'N/A'}

Holding Time:
${customParams.holdingTime || setup.holdingTime || 'N/A'}

Quality Score:
${setup.qualityScore || 85}/100

Confidence:
${setup.confidence || 80}%

AI Review:
${customParams.tradeReview || setup.aiEvaluation || 'Hedge Fund Audit: Structured trade completed in alignment with high-volume institutional order blocks.'}`;
      }

      default:
        return `🔔 GOLD INSTITUTIONAL UPDATE

Event:
${eventType}

Setup ID:
${setup.id || 'N/A'}

Details:
${customParams.message || 'Notification triggered.'}

Time:
${timestampStr}`;
    }
  }
}
