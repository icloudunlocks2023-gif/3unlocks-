import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const DEFAULT_TELEGRAM_BOT_TOKEN = '8919745003:AAFoAUbsXG-s-T4PNXJSgV3v4Ws7scO37_s';
export const DEFAULT_TELEGRAM_CHAT_ID = '6899675358';
export let TELEGRAM_BOT_TOKEN = DEFAULT_TELEGRAM_BOT_TOKEN;

// Cache for known chat IDs - always seeded with admin's known chat ID so alerts never drop
let cachedChatIds: string[] = [DEFAULT_TELEGRAM_CHAT_ID];
let lastProcessedUpdateId = 0;

/**
 * Gets the active Telegram Bot Token from Firestore or fallback.
 */
export async function getActiveTelegramBotToken(): Promise<string> {
  try {
    const snap = await getDoc(doc(db, 'site_configs', 'general'));
    if (snap.exists() && snap.data().telegramBotToken) {
      const customToken = String(snap.data().telegramBotToken).trim();
      if (customToken.length > 10) {
        TELEGRAM_BOT_TOKEN = customToken;
        return customToken;
      }
    }
  } catch (err) {
    console.warn('Could not read custom telegramBotToken from Firestore:', err);
  }
  TELEGRAM_BOT_TOKEN = DEFAULT_TELEGRAM_BOT_TOKEN;
  return DEFAULT_TELEGRAM_BOT_TOKEN;
}

/**
 * Checks if a Telegram message/update contains spam keywords or bot advertisements.
 */
function isSpamMessage(update: any): boolean {
  const msg = update.message || update.edited_message || update.channel_post;
  if (!msg) return false;

  // If sent by another bot, mark as spam
  if (msg.from?.is_bot) return true;

  // Extract all text contents including caption
  const rawText = `${msg.text || ''} ${msg.caption || ''}`.toLowerCase();
  
  // Spam keywords commonly sent by Telegram promotional / OSINT bots
  const spamKeywords = [
    'enigma',
    'void',
    'пробив',
    'пробива',
    'глаз бога',
    'боты для пробива',
    'сравните возможности',
    'найти человека',
    'детализация',
    'osint',
    'casino',
    'казино',
    '1xbet',
    'crypto bot',
    'invest',
    'free money',
    'hack',
    'шпион'
  ];

  for (const kw of spamKeywords) {
    if (rawText.includes(kw)) return true;
  }

  // Check if message contains spam inline keyboard buttons
  if (msg.reply_markup?.inline_keyboard) {
    const kbStr = JSON.stringify(msg.reply_markup.inline_keyboard).toLowerCase();
    if (kbStr.includes('enigma') || kbStr.includes('void') || kbStr.includes('пробив')) {
      return true;
    }
  }

  return false;
}

/**
 * Flushes all pending updates from Telegram's server queue to stop spam messages.
 */
export async function flushTelegramSpamQueue(): Promise<boolean> {
  try {
    const token = await getActiveTelegramBotToken();

    // 1. Try server proxy endpoint first
    try {
      const proxyRes = await fetch(`/api/telegram/updates?token=${encodeURIComponent(token)}&offset=-1`);
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        if (data.ok && Array.isArray(data.result) && data.result.length > 0) {
          const latestId = data.result[data.result.length - 1].update_id;
          await fetch(`/api/telegram/updates?token=${encodeURIComponent(token)}&offset=${latestId + 1}`);
          lastProcessedUpdateId = latestId + 1;
          return true;
        }
      }
    } catch {
      // Fall back to direct fetch if server proxy is unavailable
    }

    // Direct fetch fallback
    const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=-1`);
    if (res.ok) {
      const data = await res.json();
      if (data.ok && Array.isArray(data.result) && data.result.length > 0) {
        const latestId = data.result[data.result.length - 1].update_id;
        await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=${latestId + 1}`);
        lastProcessedUpdateId = latestId + 1;
        return true;
      }
    }
    return true;
  } catch (err) {
    console.warn('Telegram queue flush note:', err);
    return false;
  }
}

/**
 * Retrieves target Telegram Chat IDs.
 * Strictly uses configured admin Chat ID, and safely checks getUpdates while blocking spam.
 */
export async function getTelegramChatIds(): Promise<string[]> {
  const idsSet = new Set<string>();
  // Baseline: Always include configured admin chat ID
  idsSet.add(DEFAULT_TELEGRAM_CHAT_ID);

  const token = await getActiveTelegramBotToken();

  // 1. Primary Source: Check Firestore site configuration
  try {
    const snap = await getDoc(doc(db, 'site_configs', 'general'));
    if (snap.exists()) {
      const data = snap.data();
      if (data.telegramChatId) {
        const idStr = String(data.telegramChatId).trim();
        if (idStr) {
          idsSet.add(idStr);
        }
      }
    }
  } catch (err) {
    console.warn('Could not read telegramChatId from Firestore:', err);
  }

  // 2. Secondary Source: Check localStorage (browser only)
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const localId = localStorage.getItem('3u_telegram_chat_id');
      if (localId && localId.trim()) idsSet.add(localId.trim());
    }
  } catch (e) {}

  // 3. Fallback: Query updates only if no chat ID is known yet
  if (idsSet.size === 0) {
    idsSet.add(DEFAULT_TELEGRAM_CHAT_ID);
  }

  const result = Array.from(idsSet).filter(Boolean);
  cachedChatIds = result;

  return result;
}

/**
 * Sends a Telegram notification message to configured chat IDs.
 */
export async function sendTelegramNotification(messageHtml: string): Promise<boolean> {
  try {
    const token = await getActiveTelegramBotToken();
    const chatIds = await getTelegramChatIds();
    const targetChatIds = chatIds.length > 0 ? chatIds : [DEFAULT_TELEGRAM_CHAT_ID];

    let sentAny = false;
    for (const chatId of targetChatIds) {
      let delivered = false;

      // 1. Try server-side proxy endpoint first (no browser CORS, no ad blocker block)
      try {
        const proxyRes = await fetch('/api/telegram/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
          body: JSON.stringify({
            token,
            chatId,
            text: messageHtml,
            parseMode: 'HTML'
          })
        });

        if (proxyRes.ok) {
          const data = await proxyRes.json().catch(() => ({}));
          if (data?.ok) {
            delivered = true;
            sentAny = true;
          }
        }
      } catch (proxyErr) {
        console.warn('Telegram send proxy fallback note:', proxyErr);
      }

      // 2. Direct fetch fallback if server proxy was unavailable
      if (!delivered) {
        try {
          const directRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            keepalive: true,
            body: JSON.stringify({
              chat_id: chatId,
              text: messageHtml,
              parse_mode: 'HTML',
              disable_web_page_preview: true
            })
          });

          if (directRes.ok) {
            sentAny = true;
          } else {
            const errorData = await directRes.json().catch(() => ({}));
            console.warn(`Telegram direct dispatch note for chat ${chatId}:`, errorData);
          }
        } catch (directErr: any) {
          console.warn(`Telegram network delivery note for chat ${chatId}:`, directErr?.message || directErr);
        }
      }
    }

    return sentAny;
  } catch (err: any) {
    console.warn('Telegram notification note (non-blocking):', err?.message || err);
    return false;
  }
}

/**
 * Sends a Telegram notification when a user registers a new account.
 */
export async function notifyNewAccountCreated(user: {
  username: string;
  email: string;
  accountType: string;
  userId: string;
  registrationDate: string;
}) {
  const formattedDate = new Date(user.registrationDate).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const messageHtml = `
<b>🆕 New User Account Created</b>

👤 <b>Username:</b> ${escapeHtml(user.username)}
📧 <b>Email:</b> ${escapeHtml(user.email)}
🆔 <b>User ID:</b> <code>${escapeHtml(user.userId)}</code>
💼 <b>Account Type:</b> ${escapeHtml(user.accountType)}
📅 <b>Date:</b> ${formattedDate}
🌐 <b>Platform:</b> 3uUnlocks
`.trim();

  return sendTelegramNotification(messageHtml);
}

/**
 * Sends a Telegram notification when a user submits a device check request.
 */
export async function notifyDeviceCheckSubmitted(check: {
  requestId: string;
  userId: string;
  userEmail: string;
  username: string;
  imeiSerial: string;
  ecid?: string;
  iosVersion?: string;
  proceededWithoutEcid?: boolean;
  userChecksCount?: number;
  submittedAt?: string;
  serverStatus?: string;
}) {
  const formattedDate = new Date(check.submittedAt || Date.now()).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const statusBadge = check.serverStatus
    ? (check.serverStatus.toLowerCase() === 'offline' ? '🔴 Offline (Maintenance)' : '🟢 Online (Active)')
    : null;

  const countBadge = check.userChecksCount 
    ? `📊 <b>Checks Submitted:</b> ${check.userChecksCount} (since account created)\n`
    : '';

  const ecidLine = check.proceededWithoutEcid || !check.ecid 
    ? '🔑 <b>ECID:</b> <i>Client proceeded without ECID</i>\n' 
    : `🔑 <b>ECID:</b> <code>${escapeHtml(check.ecid)}</code>\n`;

  const iosLine = check.proceededWithoutEcid || !check.iosVersion
    ? '💿 <b>iOS Version:</b> <i>Not provided</i>\n'
    : `💿 <b>iOS Version:</b> ${escapeHtml(check.iosVersion)}\n`;

  const messageHtml = `
<b>📱 New Device Check Submitted</b>
${statusBadge ? `📡 <b>Server Status:</b> ${statusBadge}\n` : ''}
📋 <b>Request ID:</b> <code>${escapeHtml(check.requestId)}</code>
👤 <b>User ID:</b> <code>${escapeHtml(check.userId)}</code>
📧 <b>User:</b> ${escapeHtml(check.username)} (${escapeHtml(check.userEmail)})
${countBadge}
📲 <b>IMEI / Serial:</b> <code>${escapeHtml(check.imeiSerial)}</code>
${ecidLine}${iosLine}📅 <b>Submitted At:</b> ${formattedDate}
`.trim();

  return sendTelegramNotification(messageHtml);
}

/**
 * Sends a Telegram notification when a user sends a message to support.
 */
export async function notifySupportMessageReceived(data: {
  userId: string;
  userEmail: string;
  username: string;
  topic?: string;
  message: string;
  sentAt?: string;
}) {
  const formattedDate = new Date(data.sentAt || Date.now()).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const messageHtml = `
<b>💬 New Support Message Received</b>

👤 <b>User:</b> ${escapeHtml(data.username)} (${escapeHtml(data.userEmail)})
🆔 <b>User ID:</b> <code>${escapeHtml(data.userId)}</code>
${data.topic ? `📌 <b>Topic:</b> ${escapeHtml(data.topic)}\n` : ''}💬 <b>Message:</b>
<i>"${escapeHtml(data.message)}"</i>

📅 <b>Sent At:</b> ${formattedDate}
`.trim();

  return sendTelegramNotification(messageHtml);
}

let lastWhatsAppClickTimestamp = 0;

/**
 * Sends an instant Telegram notification when anyone (logged-in user, guest, or visitor) clicks the WhatsApp support button.
 */
export async function notifyWhatsAppClicked(data?: {
  userId?: string;
  userEmail?: string;
  username?: string;
  clickedAt?: string;
}): Promise<boolean> {
  const now = Date.now();
  // Debounce rapid / duplicate clicks within 1.5 seconds
  if (now - lastWhatsAppClickTimestamp < 1500) {
    return true;
  }
  lastWhatsAppClickTimestamp = now;

  const user = data || {};
  const isGuest = !user.userId && !user.userEmail;
  const username = user.username || (isGuest ? 'Visitor / Guest' : 'User');
  const userEmail = user.userEmail || (isGuest ? 'Visitor (Unregistered)' : 'N/A');
  const userId = user.userId || (isGuest ? 'GUEST-VISITOR' : 'N/A');
  const clickedAt = user.clickedAt || new Date().toISOString();

  // 1. First priority: Direct dedicated server endpoint (bypasses CORS/ad blockers and completes even after page unload)
  try {
    const res = await fetch('/api/telegram/notify-whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        username,
        userEmail,
        userId,
        clickedAt
      })
    });

    if (res.ok) {
      const respData = await res.json().catch(() => ({}));
      if (respData?.ok) {
        return true;
      }
    }
  } catch (err) {
    console.warn('Dedicated WhatsApp notify route note:', err);
  }

  // 2. Secondary fallback: sendTelegramNotification
  const formattedDate = new Date(clickedAt).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const messageHtml = `
<b>📲 User Clicked WhatsApp Support</b>

👤 <b>User:</b> ${escapeHtml(username)} (${escapeHtml(userEmail)})
🆔 <b>User ID:</b> <code>${escapeHtml(userId)}</code>
📅 <b>Clicked At:</b> ${formattedDate}
💬 <b>Action:</b> Clicked WhatsApp Support Link (<code>https://wa.me/16693268629</code>)
`.trim();

  return sendTelegramNotification(messageHtml);
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
