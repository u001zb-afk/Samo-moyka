import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

const app = new Hono();

function verifyTelegramInitData(initData, botToken) {
  if (!initData || typeof initData !== 'string' || !botToken) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');
  const authDate = Number(params.get('auth_date'));
  if (!authDate || Math.abs(Date.now() / 1000 - authDate) > 86400) return null;
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`).join('\n');
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  const a = Buffer.from(calculatedHash, 'hex');
  const b = Buffer.from(hash, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const user = JSON.parse(params.get('user') || '{}');
    return user.id ? user : null;
  } catch { return null; }
}

function db(env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Supabase sozlamalari topilmadi.');
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

async function telegramUser(c, next) {
  const user = verifyTelegramInitData(c.req.header('x-telegram-init-data'), c.env.BOT_TOKEN);
  if (!user) return c.json({ error: "Telegram tasdiqlashi topilmadi. Mini App'ni bot ichidan oching." }, 401);
  c.set('telegramUser', user);
  await next();
}

async function adminOnly(c, next) {
  if (String(c.get('telegramUser').id) !== String(c.env.ADMIN_TELEGRAM_ID || '6177821743')) {
    return c.json({ error: 'Bu bo‘lim faqat administrator uchun.' }, 403);
  }
  await next();
}

app.get('/api/health', (c) => c.json({ ok: true, app: 'Samo Moyka' }));

app.get('/api/status', async (c) => {
  try {
    c.header('Cache-Control', 'no-store');
    const { data, error } = await db(c.env).from('wash_status').select('*').eq('id', 1).single();
    if (error) throw error;
    return c.json(data);
  } catch (e) {
    console.error('status read:', e.message);
    return c.json({ error: 'Holatni yuklab bo‘lmadi.' }, 500);
  }
});

app.get('/api/me', telegramUser, (c) => c.json({
  id: String(c.get('telegramUser').id),
  isAdmin: String(c.get('telegramUser').id) === String(c.env.ADMIN_TELEGRAM_ID || '6177821743')
}));

app.put('/api/status', telegramUser, adminOnly, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { box1_busy, box2_busy, queue_enabled, queue_count, note } = body;
  if (![box1_busy, box2_busy, queue_enabled].every(v => typeof v === 'boolean'))
    return c.json({ error: 'Box va navbat holatlari noto‘g‘ri.' }, 400);
  const count = Number(queue_count);
  if (!Number.isInteger(count) || count < 0 || count > 999)
    return c.json({ error: 'Navbat soni 0 dan 999 gacha butun son bo‘lishi kerak.' }, 400);
  const cleanNote = typeof note === 'string' ? note.trim().slice(0, 240) : '';
  try {
    const { data, error } = await db(c.env).from('wash_status').update({
      box1_busy, box2_busy, queue_enabled, queue_count: queue_enabled ? count : 0,
      note: cleanNote, updated_at: new Date().toISOString()
    }).eq('id', 1).select().single();
    if (error) throw error;
    return c.json(data);
  } catch (e) {
    console.error('status update:', e.message);
    return c.json({ error: 'Holatni saqlab bo‘lmadi.' }, 500);
  }
});

app.post('/api/announcement', telegramUser, adminOnly, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const message = typeof body.text === 'string' ? body.text.trim() : '';
  if (!message || message.length > 3500) return c.json({ error: 'E’lon 1–3500 belgi bo‘lishi kerak.' }, 400);
  try {
    const response = await fetch(`https://api.telegram.org/bot${c.env.BOT_TOKEN}/sendMessage`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: c.env.CHANNEL_USERNAME || '@sabomoyka', text: message, disable_web_page_preview: true })
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      console.error('Telegram announcement:', result);
      return c.json({ error: 'Telegram kanalga yuborilmadi. Bot kanal administratori ekanini tekshiring.' }, 502);
    }
    return c.json({ ok: true, message_id: result.result.message_id });
  } catch (e) {
    console.error('announcement:', e.message);
    return c.json({ error: 'Telegram bilan bog‘lanib bo‘lmadi.' }, 502);
  }
});

export default app;
