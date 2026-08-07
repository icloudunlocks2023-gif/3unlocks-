import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const TELEGRAM_BOT_TOKEN = '8919745003:AAFoAUbsXG-s-T4PNXJSgV3v4Ws7scO37_s';

// Verified Admin Chat ID fallback so alerts never fail even on new Vercel deployments
export const DEFAULT_ADMIN_CHAT_ID = '6899675358';

// Cache for known chat IDs
let cachedChatIds: string[] = [];

/**
 * Retrieves target Telegram Chat IDs.
 * Checks local storage, Firestore site_configs/general, built-in admin fallback, and queries Telegram getUpdates.
 */
export async function getTelegramChatIds(): Promise<string[]> {
  const idsSet = new Set<string>();

  // 1. Always include verified default admin chat ID
  if (DEFAULT_ADMIN_CHAT_ID) {
    idsSet.add(DEFAULT_ADMIN_CHAT_ID.trim());
  }

  // 2. Check localStorage
  const localId = localStorage.getItem('3u_telegram_chat_id');
  if (localId) idsSet.add(localId.trim());

  // 3. Check cached memory
  cachedChatIds.forEach(id => idsSet.add(id));

  // 4. Check Firestore site configuration
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

  // 5. Query Telegram getUpdates API to discover chat IDs from bot subscribers
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`);
    if (res.ok) {
      const data = await res.json();
      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          const discoveredId = update.message?.chat?.id || update.my_chat_member?.chat?.id || update.channel_post?.chat?.id;
          if (discoveredId) {
            idsSet.add(String(discoveredId));
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
    // Persist to Firestore site_configs so every client on Vercel reads it instantly
    setDoc(doc(db, 'site_configs', 'general'), { telegramChatId: result[0] }, { merge: true })
      .catch(() => {});
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
}) {
  const formattedDate = new Date(check.submittedAt || Date.now()).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const messageHtml = `
<b>📱 New Device Check Submitted</b>

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
export async function notifySupportMessage(data: {
  userId: string;
  userEmail: string;
  username: string;
  topic?: string;
  message: string;
}) {
  const formattedDate = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const messageHtml = `
<b>💬 New Support Message Received</b>

👤 <b>User:</b> ${escapeHtml(data.username)} (${escapeHtml(data.userEmail)})
🆔 <b>User ID:</b> <code>${escapeHtml(data.userId)}</code>
${data.topic ? `📌 <b>Topic:</b> ${escapeHtml(data.topic)}\n` : ''}💬 <b>Message:</b>
<i>${escapeHtml(data.message)}</i>

📅 <b>Time:</b> ${formattedDate}
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

