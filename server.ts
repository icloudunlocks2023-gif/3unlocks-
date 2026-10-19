import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_BOT_TOKEN = '8919745003:AAFoAUbsXG-s-T4PNXJSgV3v4Ws7scO37_s';

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

      if (!chatId || !text) {
        return res.status(400).json({ ok: false, error: 'Missing chatId or text' });
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const telegramRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
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

  // 3. Server-side Telegram Updates Proxy
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
