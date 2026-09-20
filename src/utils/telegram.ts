import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const DEFAULT_TELEGRAM_BOT_TOKEN = '8919745003:AAFoAUbsXG-s-T4PNXJSgV3v4Ws7scO37_s';
export let TELEGRAM_BOT_TOKEN = DEFAULT_TELEGRAM_BOT_TOKEN;

// Cache for known chat IDs
let cachedChatIds: string[] = [];
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

  // 2. Secondary Source: Check localStorage
  const localId = localStorage.getItem('3u_telegram_chat_id');
  if (localId) idsSet.add(localId.trim());

  // 3. Fallback: Query updates only if no chat ID is known yet
  if (idsSet.size === 0) {
    try {
      const offsetParam = lastProcessedUpdateId > 0 ? `&offset=${lastProcessedUpdateId}` : '';
      let updatesData: any = null;

      // Try server proxy first to avoid browser CORS / ad blocker blocks
      try {
        const proxyRes = await fetch(`/api/telegram/updates?token=${encodeURIComponent(token)}${offsetParam}`);
        if (proxyRes.ok) {
          updatesData = await proxyRes.json();
        }
      } catch {
        // Fallback to direct fetch
      }

      if (!updatesData) {
        const directOffset = lastProcessedUpdateId > 0 ? `?offset=${lastProcessedUpdateId}` : '';
        const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates${directOffset}`);
        if (res.ok) {
          updatesData = await res.json();
        }
      }

      if (updatesData?.ok && Array.isArray(updatesData.result)) {
        let highestId = lastProcessedUpdateId;

        for (const update of updatesData.result) {
          if (update.update_id > highestId) {
            highestId = update.update_id;
          }

          // Strictly filter out spam bots / messages
          if (isSpamMessage(update)) {
            continue;
          }

          if (update.message?.chat?.id && !update.message.from?.is_bot) {
            idsSet.add(String(update.message.chat.id));
          } else if (update.my_chat_member?.chat?.id && !update.my_chat_member.from?.is_bot) {
            idsSet.add(String(update.my_chat_member.chat.id));
          }
        }

        // Acknowledge updates up to highestId + 1 to prevent queue buildup
        if (highestId > 0) {
          lastProcessedUpdateId = highestId + 1;
          fetch(`/api/telegram/updates?token=${encodeURIComponent(token)}&offset=${highestId + 1}`).catch(() => {});
        }
      }
    } catch (err) {
      console.warn('Telegram updates check note:', err);
    }
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

    if (chatIds.length === 0) {
      console.info(
        'Telegram bot notification notice: No Telegram chat ID configured yet. ' +
        'Please enter your Telegram Chat ID in Admin Settings or start a chat with the bot.'
      );
      return false;
    }

    let sentAny = false;
    for (const chatId of chatIds) {
      let delivered = false;

      // 1. Try server-side proxy endpoint first (no browser CORS, no ad blocker block)
      try {
        const proxyRes = await fetch('/api/telegram/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
      } catch {
        // Fallback to direct fetch
      }

      // 2. Direct fetch fallback if server proxy was unavailable
      if (!delivered) {
        try {
          const directRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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

/**
 * Sends a Telegram notification when a logged-in user clicks the WhatsApp support button.
 */
export async function notifyWhatsAppClicked(data: {
  userId?: string;
  userEmail?: string;
  username?: string;
  clickedAt?: string;
}) {
  const formattedDate = new Date(data.clickedAt || Date.now()).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const messageHtml = `
<b>📲 User Clicked WhatsApp Support</b>

👤 <b>User:</b> ${escapeHtml(data.username || 'Logged In User')} (${escapeHtml(data.userEmail || 'N/A')})
🆔 <b>User ID:</b> <code>${escapeHtml(data.userId || 'N/A')}</code>
📅 <b>Clicked At:</b> ${formattedDate}
💬 <b>Action:</b> Clicked WhatsApp Support Link (<code>https://wa.me/message/VAWM7QDYEPBZF1</code>)
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
