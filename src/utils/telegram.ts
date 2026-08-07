import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const TELEGRAM_BOT_TOKEN = '8919745003:AAFoAUbsXG-s-T4PNXJSgV3v4Ws7scO37_s';

// Verified Admin Chat ID fallback so alerts never fail even on new Vercel deployments
export const DEFAULT_ADMIN_CHAT_ID = '6899675358';

// Cache for known chat IDs
let cachedChatIds: string[] = [DEFAULT_ADMIN_CHAT_ID];

/**
 * Retrieves target Telegram Chat IDs.
 * Always includes verified default admin chat ID (6899675358).
 */
export async function getTelegramChatIds(): Promise<string[]> {
  const idsSet = new Set<string>();

  // 1. Always include verified default admin chat ID
  idsSet.add(DEFAULT_ADMIN_CHAT_ID.trim());

  // 2. Check localStorage
  try {
    const localId = localStorage.getItem('3u_telegram_chat_id');
    if (localId) idsSet.add(localId.trim());
  } catch {}

  // 3. Check cached memory
  cachedChatIds.forEach(id => {
    if (id) idsSet.add(id.trim());
  });

  // 4. Try Firestore site configuration
  try {
    const snap = await getDoc(doc(db, 'site_configs', 'general'));
    if (snap.exists()) {
      const data = snap.data();
      if (data.telegramChatId) {
        idsSet.add(String(data.telegramChatId).trim());
      }
    }
  } catch (err) {
    // Non-blocking warning
  }

  // 5. Optionally query Telegram getUpdates with a short 1.5s timeout so it never blocks
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          const discoveredId = update.message?.chat?.id || update.my_chat_member?.chat?.id || update.channel_post?.chat?.id;
          if (discoveredId) {
            idsSet.add(String(discoveredId).trim());
          }
        }
      }
    }
  } catch (err) {
    // Ignore timeout / network error
  }

  const result = Array.from(idsSet).filter(Boolean);
  cachedChatIds = result;

  if (result.length > 0 && result[0]) {
    try {
      localStorage.setItem('3u_telegram_chat_id', result[0]);
    } catch {}
  }

  return result;
}

/**
 * Sends a Telegram notification message to all target chat IDs.
 */
export async function sendTelegramNotification(messageHtml: string): Promise<boolean> {
  try {
    const chatIds = await getTelegramChatIds();

    if (chatIds.length === 0) {
      console.warn('Telegram bot notification notice: No chat IDs available.');
      return false;
    }

    let sentAny = false;
    for (const chatId of chatIds) {
      try {
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
          console.log(`Telegram notification successfully dispatched to chat ${chatId}`);
        } else {
          const errorData = await res.json().catch(() => ({}));
          console.warn(`Failed to send Telegram message to chat ${chatId}:`, errorData);
        }
      } catch (sendErr) {
        console.warn(`Telegram fetch error sending to ${chatId}:`, sendErr);
      }
    }

    return sentAny;
  } catch (err) {
    console.error('Error in sendTelegramNotification:', err);
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
  registrationDate?: string;
}) {
  const dateStr = user.registrationDate ? new Date(user.registrationDate).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }) : new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

  const messageHtml = `
<b>🆕 New User Account Created</b>

👤 <b>Username:</b> ${escapeHtml(user.username)}
📧 <b>Email:</b> ${escapeHtml(user.email)}
🆔 <b>User ID:</b> <code>${escapeHtml(user.userId)}</code>
💼 <b>Account Type:</b> ${escapeHtml(user.accountType)}
📅 <b>Date:</b> ${dateStr}
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

/**
 * Sends a Telegram notification when a user places a new unlock order.
 */
export async function notifyOrderSubmitted(order: {
  orderId: string;
  userId: string;
  userEmail: string;
  imei: string;
  ecid: string;
  price?: string;
}) {
  const formattedDate = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const messageHtml = `
<b>🛒 New Unlock Order Placed</b>

📦 <b>Order ID:</b> <code>${escapeHtml(order.orderId)}</code>
👤 <b>User:</b> ${escapeHtml(order.userEmail)}
🆔 <b>User ID:</b> <code>${escapeHtml(order.userId)}</code>

📲 <b>IMEI:</b> <code>${escapeHtml(order.imei)}</code>
🔑 <b>ECID:</b> <code>${escapeHtml(order.ecid)}</code>
💵 <b>Price:</b> ${escapeHtml(order.price || 'Pending')}
📅 <b>Date:</b> ${formattedDate}
`.trim();

  return sendTelegramNotification(messageHtml);
}

/**
 * Sends a Telegram notification when a user submits a USDT payment transaction hash.
 */
export async function notifyPaymentSubmitted(payment: {
  orderId: string;
  userId: string;
  userEmail: string;
  txId: string;
  amount?: string;
}) {
  const formattedDate = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const messageHtml = `
<b>💰 USDT Payment Submitted for Verification</b>

📦 <b>Order ID:</b> <code>${escapeHtml(payment.orderId)}</code>
👤 <b>User:</b> ${escapeHtml(payment.userEmail)}
🆔 <b>User ID:</b> <code>${escapeHtml(payment.userId)}</code>

🔗 <b>TxID / Hash:</b> <code>${escapeHtml(payment.txId)}</code>
💵 <b>Amount:</b> ${escapeHtml(payment.amount || 'USDT')}
📅 <b>Date:</b> ${formattedDate}
`.trim();

  return sendTelegramNotification(messageHtml);
}

/**
 * Sends a Telegram notification when a user requests a wallet balance deposit.
 */
export async function notifyDepositSubmitted(deposit: {
  depositId: string;
  userId: string;
  userEmail: string;
  txId: string;
}) {
  const formattedDate = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const messageHtml = `
<b>💳 Wallet Deposit Request Submitted</b>

🆔 <b>Deposit ID:</b> <code>${escapeHtml(deposit.depositId)}</code>
👤 <b>User:</b> ${escapeHtml(deposit.userEmail)}
🆔 <b>User ID:</b> <code>${escapeHtml(deposit.userId)}</code>

🔗 <b>TxID / Hash:</b> <code>${escapeHtml(deposit.txId)}</code>
📅 <b>Submitted At:</b> ${formattedDate}
`.trim();

  return sendTelegramNotification(messageHtml);
}

function escapeHtml(val: any): string {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
