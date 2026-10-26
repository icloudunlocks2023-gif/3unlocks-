import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_BOT_TOKEN = '8919745003:AAFoAUbsXG-s-T4PNXJSgV3v4Ws7scO37_s';
const DEFAULT_CHAT_ID = '6899675358';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 1. Health check API
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 2. Server-side Telegram Send Proxy (completely bypasses browser CORS & ad blockers)
  app.post('/api/telegram/send', async (req, res) => {
    try {
      const { token, chatId, text, parseMode = 'HTML' } = req.body;
      const botToken = (token && String(token).trim().length > 10) 
        ? String(token).trim() 
        : (process.env.TELEGRAM_BOT_TOKEN || DEFAULT_BOT_TOKEN);

      const targetChatId = (chatId && String(chatId).trim()) 
        ? String(chatId).trim() 
        : (process.env.TELEGRAM_CHAT_ID || DEFAULT_CHAT_ID);

      if (!text) {
        return res.status(400).json({ ok: false, error: 'Missing text' });
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const telegramRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: targetChatId,
          text,
          parse_mode: parseMode,
          disable_web_page_preview: true
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await telegramRes.json().catch(() => ({}));
      return res.status(telegramRes.status).json(data);
    } catch (err: any) {
      console.warn('Telegram send proxy warning:', err?.message || err);
      return res.status(502).json({ ok: false, error: err?.message || 'Failed to reach Telegram API' });
    }
  });

  // 3. Fast dedicated WhatsApp Click Notification Endpoint
  app.post('/api/telegram/notify-whatsapp', async (req, res) => {
    try {
      const { username, userEmail, userId, clickedAt } = req.body || {};
      const botToken = process.env.TELEGRAM_BOT_TOKEN || DEFAULT_BOT_TOKEN;
      const targetChatId = process.env.TELEGRAM_CHAT_ID || DEFAULT_CHAT_ID;

      const formattedDate = new Date(clickedAt || Date.now()).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });

      const escape = (str?: string) => (str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      const isGuest = !userId || userId.toLowerCase().includes('guest') || !userEmail || userEmail.toLowerCase().includes('guest');
      const userDisplay = isGuest && !userEmail 
        ? 'Visitor / Guest' 
        : `${escape(username || 'Visitor')} (${escape(userEmail || 'N/A')})`;
      const idDisplay = escape(userId || (isGuest ? 'Guest' : 'N/A'));

      const messageHtml = `
<b>📲 User Clicked WhatsApp Support</b>

👤 <b>User:</b> ${userDisplay}
🆔 <b>User ID:</b> <code>${idDisplay}</code>
📅 <b>Clicked At:</b> ${formattedDate}
💬 <b>Action:</b> Clicked WhatsApp Support Link (<code>https://wa.me/16693268629</code>)
      `.trim();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const telegramRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: targetChatId,
          text: messageHtml,
          parse_mode: 'HTML',
          disable_web_page_preview: true
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await telegramRes.json().catch(() => ({}));
      return res.status(telegramRes.status).json(data);
    } catch (err: any) {
      console.warn('Telegram notify-whatsapp warning:', err?.message || err);
      return res.status(500).json({ ok: false, error: err?.message || 'Failed to dispatch Telegram alert' });
    }
  });

  // 4. Dedicated Fast Server-Side Registration Notification Endpoint
  app.post('/api/telegram/notify-registration', async (req, res) => {
    try {
      const { username, email, accountType, userId, registrationDate } = req.body || {};
      const botToken = process.env.TELEGRAM_BOT_TOKEN || DEFAULT_BOT_TOKEN;
      const targetChatId = process.env.TELEGRAM_CHAT_ID || DEFAULT_CHAT_ID;

      const formattedDate = new Date(registrationDate || Date.now()).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });

      const escape = (str?: string) => (str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      const messageHtml = `
<b>🆕 New User Account Created</b>

👤 <b>Username:</b> ${escape(username || 'Client')}
📧 <b>Email:</b> ${escape(email || 'N/A')}
🆔 <b>User ID:</b> <code>${escape(userId || 'N/A')}</code>
💼 <b>Account Type:</b> ${escape(accountType || 'Personal User')}
📅 <b>Date:</b> ${formattedDate}
🌐 <b>Platform:</b> 3uUnlocks
      `.trim();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const telegramRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: targetChatId,
          text: messageHtml,
          parse_mode: 'HTML',
          disable_web_page_preview: true
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await telegramRes.json().catch(() => ({}));
      return res.status(telegramRes.status).json(data);
    } catch (err: any) {
      console.warn('Telegram notify-registration warning:', err?.message || err);
      return res.status(500).json({ ok: false, error: err?.message || 'Failed to dispatch Telegram registration alert' });
    }
  });

  // 5. Dedicated Fast Server-Side Device Check Notification Endpoint
  app.post('/api/telegram/notify-device-check', async (req, res) => {
    try {
      const {
        requestId,
        userId,
        userEmail,
        username,
        imeiSerial,
        ecid,
        iosVersion,
        proceededWithoutEcid,
        userChecksCount,
        submittedAt,
        serverStatus,
        isRecheck
      } = req.body || {};

      const botToken = process.env.TELEGRAM_BOT_TOKEN || DEFAULT_BOT_TOKEN;
      const targetChatId = process.env.TELEGRAM_CHAT_ID || DEFAULT_CHAT_ID;

      const formattedDate = new Date(submittedAt || Date.now()).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });

      const escape = (str?: string) => (str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      const statusBadge = serverStatus
        ? (String(serverStatus).toLowerCase() === 'offline' ? '🔴 Offline (Maintenance)' : '🟢 Online (Active)')
        : null;

      const countBadge = userChecksCount 
        ? `📊 <b>Checks Submitted:</b> ${userChecksCount} (since account created)\n`
        : '';

      const ecidLine = proceededWithoutEcid || !ecid 
        ? '🔑 <b>ECID:</b> <i>Client proceeded without ECID</i>\n' 
        : `🔑 <b>ECID:</b> <code>${escape(ecid)}</code>\n`;

      const iosLine = proceededWithoutEcid || !iosVersion
        ? '💿 <b>iOS Version:</b> <i>Not provided</i>\n'
        : `💿 <b>iOS Version:</b> ${escape(iosVersion)}\n`;

      const headerTitle = isRecheck ? '📱 Device Check Re-Submitted / Verified' : '📱 New Device Check Submitted';

      const messageHtml = `
<b>${headerTitle}</b>
${statusBadge ? `📡 <b>Server Status:</b> ${statusBadge}\n` : ''}
📋 <b>Request ID:</b> <code>${escape(requestId || 'N/A')}</code>
👤 <b>User ID:</b> <code>${escape(userId || 'N/A')}</code>
📧 <b>User:</b> ${escape(username || 'Client')} (${escape(userEmail || 'N/A')})
${countBadge}
📲 <b>IMEI / Serial:</b> <code>${escape(imeiSerial || 'N/A')}</code>
${ecidLine}${iosLine}📅 <b>Submitted At:</b> ${formattedDate}
      `.trim();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const telegramRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: targetChatId,
          text: messageHtml,
          parse_mode: 'HTML',
          disable_web_page_preview: true
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await telegramRes.json().catch(() => ({}));
      return res.status(telegramRes.status).json(data);
    } catch (err: any) {
      console.warn('Telegram notify-device-check warning:', err?.message || err);
      return res.status(500).json({ ok: false, error: err?.message || 'Failed to dispatch Telegram device check alert' });
    }
  });

  // 6. Server-side Telegram Updates Proxy
  app.get('/api/telegram/updates', async (req, res) => {
    try {
      const token = (req.query.token && String(req.query.token).trim().length > 10)
        ? String(req.query.token).trim()
        : (process.env.TELEGRAM_BOT_TOKEN || DEFAULT_BOT_TOKEN);

      const offset = req.query.offset ? `?offset=${encodeURIComponent(String(req.query.offset))}` : '';
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const telegramRes = await fetch(`https://api.telegram.org/bot${token}/getUpdates${offset}`, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await telegramRes.json().catch(() => ({}));
      return res.status(telegramRes.status).json(data);
    } catch (err: any) {
      console.warn('Telegram updates proxy warning:', err?.message || err);
      return res.status(502).json({ ok: false, error: err?.message || 'Failed to fetch updates' });
    }
  });

  // 4. Vite Middleware / Static Serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
