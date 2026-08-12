import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const TELEGRAM_BOT_TOKEN = '8919745003:AAFoAUbsXG-s-T4PNXJSgV3v4Ws7scO37_s';

// Cache for known chat IDs
let cachedChatIds: string[] = [];

/**
 * Retrieves target Telegram Chat IDs.
 * Checks local storage, Firestore site_configs/general, and queries Telegram getUpdates.
 */
export async function getTelegramChatIds(): Promise<string[]> {
  const idsSet = new Set<string>();

  // 1. Check localStorage
  const localId = localStorage.getItem('3u_telegram_chat_id');
  if (localId) idsSet.add(localId.trim());

  // 2. Check cached memory
  cachedChatIds.forEach(id => idsSet.add(id));

  // 3. Check Firestore site configuration
  try {
    const snap = await getDoc(doc(db, 'site_configs', 'general'));
    if (snap.exists()) {
      const data = snap.data();
      if (data.telegramChatId) {
        idsSet.add(String(data.telegramChatId).trim());
      }
    }
  } catch (err) {
    console.warn('Could not read telegramChatId from Firestore:', err);
  }

  // If explicit admin chat IDs were configured, use ONLY those configured chat IDs.
  // This prevents sending alerts to unverified random third-party chat IDs.
  const configuredIds = Array.from(idsSet).filter(Boolean);
  if (configuredIds.length > 0) {
    cachedChatIds = configuredIds;
    localStorage.setItem('3u_telegram_chat_id', configuredIds[0]);
    return configuredIds;
  }

  // 4. Fallback: Query Telegram getUpdates API to find chat IDs from genuine bot subscribers
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`);
    if (res.ok) {
      const data = await res.json();
      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          // SECURITY FIX: Ignore updates coming from other bots to prevent spam loops with third-party bots
          const msg = update.message || update.edited_message;
          if (msg?.from?.is_bot) continue;

          // Ignore Russian search/OSINT spam bot text patterns
          if (msg?.text && (msg.text.includes('Пробива') || msg.text.includes('Найдётся') || msg.text.includes('ЭНИГМА'))) {
            continue;
          }

          if (update.message?.chat?.id && !update.message.from?.is_bot) {
            idsSet.add(String(update.message.chat.id));
          } else if (update.my_chat_member?.chat?.id && !update.my_chat_member.from?.is_bot) {
            idsSet.add(String(update.my_chat_member.chat.id));
          } else if (update.channel_post?.chat?.id) {
            idsSet.add(String(update.channel_post.chat.id));
          }
        }
      }
    }
  } catch (err) {
    console.warn('Telegram getUpdates check failed:', err);
  }

  const result = Array.from(idsSet).filter(Boolean);
  cachedChatIds = result;
  if (result.length > 0 && result[0]) {
    localStorage.setItem('3u_telegram_chat_id', result[0]);
  }
  return result;
}

/**
 * Sends a Telegram notification message to all configured/detected chat IDs.
 */
export async function sendTelegramNotification(messageHtml: string): Promise<boolean> {
  try {
    const chatIds = await getTelegramChatIds();

    if (chatIds.length === 0) {
      console.info(
        'Telegram bot notification notice: No Telegram chat ID detected yet. ' +
        'Please start a chat with the bot or send any message to it, or configure a Telegram Chat ID in Admin Settings.'
      );
      return false;
    }

    let sentAny = false;
    for (const chatId of chatIds) {
      const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: messageHtml,
          parse_mode: 'HTML'
        })
      });

      if (res.ok) {
        sentAny = true;
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.warn(`Failed to send Telegram message to chat ${chatId}:`, errorData);
      }
    }

    return sentAny;
  } catch (err) {
    console.error('Error sending Telegram notification:', err);
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
  ecid: string;
  iosVersion: string;
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

  const messageHtml = `
<b>📱 New Device Check Submitted</b>
${statusBadge ? `📡 <b>Server Status:</b> ${statusBadge}\n` : ''}
📋 <b>Request ID:</b> <code>${escapeHtml(check.requestId)}</code>
👤 <b>User ID:</b> <code>${escapeHtml(check.userId)}</code>
📧 <b>User:</b> ${escapeHtml(check.username)} (${escapeHtml(check.userEmail)})

📲 <b>IMEI / Serial:</b> <code>${escapeHtml(check.imeiSerial)}</code>
🔑 <b>ECID:</b> <code>${escapeHtml(check.ecid)}</code>
💿 <b>iOS Version:</b> ${escapeHtml(check.iosVersion)}
📅 <b>Submitted At:</b> ${formattedDate}
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

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
