import { VapidConfig, WebPushSubscription, sendWebPush } from './webpush';

export interface Env {
  SUBSCRIBERS: KVNamespace;
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  VAPID_SUBJECT: string;
  ALLOWED_ORIGIN: string;
  APP_ICON_URL?: string;
}

interface Reminder {
  id: string;
  at: number;
  title: string;
  body: string;
}

interface SubRecord {
  subscription: WebPushSubscription;
  reminders: Reminder[];
  sent: string[];
}

const GRACE_MS = 5 * 60 * 1000;

function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

function json(data: unknown, status: number, origin: string): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) }
  });
}

function vapidFrom(env: Env): VapidConfig {
  return { publicKey: env.VAPID_PUBLIC_KEY, privateKey: env.VAPID_PRIVATE_KEY, subject: env.VAPID_SUBJECT };
}

async function keyFor(endpoint: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint));
  const bytes = new Uint8Array(digest);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, '0');
  return 'sub:' + hex;
}

function payloadFor(title: string, body: string, env: Env): unknown {
  return {
    notification: {
      title,
      body,
      icon: env.APP_ICON_URL,
      badge: env.APP_ICON_URL,
      data: {}
    }
  };
}

async function handleSubscribe(req: Request, env: Env, origin: string): Promise<Response> {
  const body = (await req.json()) as { subscription?: WebPushSubscription; reminders?: Reminder[] };
  if (!body.subscription?.endpoint) return json({ error: 'missing subscription' }, 400, origin);

  const key = await keyFor(body.subscription.endpoint);
  const existing = await env.SUBSCRIBERS.get<SubRecord>(key, 'json');
  const record: SubRecord = {
    subscription: body.subscription,
    reminders: Array.isArray(body.reminders) ? body.reminders : [],
    sent: existing?.sent ?? []
  };
  await env.SUBSCRIBERS.put(key, JSON.stringify(record));
  return json({ ok: true, scheduled: record.reminders.length }, 200, origin);
}

async function handleUnsubscribe(req: Request, env: Env, origin: string): Promise<Response> {
  const body = (await req.json()) as { endpoint?: string };
  if (body.endpoint) await env.SUBSCRIBERS.delete(await keyFor(body.endpoint));
  return json({ ok: true }, 200, origin);
}

async function handleTest(req: Request, env: Env, origin: string): Promise<Response> {
  const body = (await req.json()) as { endpoint?: string };
  if (!body.endpoint) return json({ error: 'missing endpoint' }, 400, origin);

  const record = await env.SUBSCRIBERS.get<SubRecord>(await keyFor(body.endpoint), 'json');
  if (!record) return json({ error: 'not subscribed' }, 404, origin);

  const status = await sendWebPush(
    record.subscription,
    payloadFor('Dog Day', 'Test nudge — your phone alerts are working 🐾', env),
    vapidFrom(env)
  );
  return json({ ok: status >= 200 && status < 300, status }, 200, origin);
}

async function runDue(env: Env): Promise<void> {
  const now = Date.now();
  const list = await env.SUBSCRIBERS.list({ prefix: 'sub:' });

  for (const entry of list.keys) {
    const record = await env.SUBSCRIBERS.get<SubRecord>(entry.name, 'json');
    if (!record) continue;

    const sent = new Set(record.sent ?? []);
    const keep: Reminder[] = [];
    let changed = false;
    let dead = false;

    for (const reminder of record.reminders ?? []) {
      if (reminder.at < now - GRACE_MS) {
        changed = true; // too old — drop it
        continue;
      }
      if (reminder.at <= now && !sent.has(reminder.id)) {
        const status = await sendWebPush(
          record.subscription,
          payloadFor(reminder.title, reminder.body, env),
          vapidFrom(env)
        );
        if (status === 404 || status === 410) {
          dead = true;
          break;
        }
        sent.add(reminder.id);
        changed = true;
      }
      keep.push(reminder);
    }

    if (dead) {
      await env.SUBSCRIBERS.delete(entry.name);
      continue;
    }
    if (changed) {
      const keepIds = new Set(keep.map((r) => r.id));
      const prunedSent = [...sent].filter((id) => keepIds.has(id));
      await env.SUBSCRIBERS.put(entry.name, JSON.stringify({ ...record, reminders: keep, sent: prunedSent }));
    }
  }
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const origin = env.ALLOWED_ORIGIN || '*';
    if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders(origin) });

    const url = new URL(req.url);
    try {
      if (req.method === 'POST' && url.pathname === '/subscribe') return await handleSubscribe(req, env, origin);
      if (req.method === 'POST' && url.pathname === '/unsubscribe') return await handleUnsubscribe(req, env, origin);
      if (req.method === 'POST' && url.pathname === '/test') return await handleTest(req, env, origin);
      return json({ error: 'not found' }, 404, origin);
    } catch (err) {
      return json({ error: err instanceof Error ? err.message : 'error' }, 500, origin);
    }
  },

  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runDue(env));
  }
};
