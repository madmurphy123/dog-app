# Phone push notifications — setup

This wires up real lock-screen notifications on your installed iPhone PWA, free,
using a small Cloudflare Worker. Do this **after** the app is live on Pages and
installed on your phone (see `DEPLOY.md`).

You'll need:
- The **VAPID private key** from earlier (kept somewhere safe — it is a secret).
- A free **Cloudflare account** (already done).
- **Node.js** on your PC.

---

## Part A — Deploy the Worker

All commands run from the **`worker/`** folder.

```powershell
cd C:\Users\murph\Documents\dog-care-app\worker
npm install
npx wrangler login        # opens a browser to authorise
```

### A.1 Create the KV store (where subscriptions live)
```powershell
npx wrangler kv namespace create SUBSCRIBERS
```
It prints an `id = "..."`. Copy that id into **`worker/wrangler.toml`**, replacing
`REPLACE_WITH_KV_NAMESPACE_ID`.

### A.2 Set your details in `wrangler.toml`
- `VAPID_SUBJECT` → change to your real email, e.g. `mailto:murphyaaron123@gmail.com`.
- `ALLOWED_ORIGIN` is already `https://madmurphy123.github.io` (your Pages origin) — leave it.
- `APP_ICON_URL` is already your app's icon — leave it.

### A.3 Store the private key as a secret (never in the file)
```powershell
npx wrangler secret put VAPID_PRIVATE_KEY
```
Paste the **private key** when prompted, press Enter.

### A.4 Deploy
```powershell
npx wrangler deploy
```
It prints your Worker URL, e.g. **`https://dog-day-push.<your-subdomain>.workers.dev`**.
Copy it.

---

## Part B — Point the app at the Worker

1. Open **`src/app/config/push.config.ts`**.
2. Set `workerUrl` to your Worker URL (no trailing slash):
   ```ts
   workerUrl: 'https://dog-day-push.<your-subdomain>.workers.dev',
   ```
3. Commit + push (Pages auto-redeploys):
   ```powershell
   cd C:\Users\murph\Documents\dog-care-app
   git add -A
   git commit -m "Connect push notifications to the Worker"
   git push
   ```

---

## Part C — Turn it on and test (on the iPhone)

1. After the Pages deploy finishes (~2 min), open the installed **Dog Day** app on
   your phone. If it looks unchanged, close it fully and reopen once or twice so the
   service worker updates. (If it's stubborn, delete the home-screen icon and re-add
   it from Safari — that guarantees the latest version.)
2. Go to the **Setup** tab → **Phone alerts** → **Turn on phone alerts**.
3. iOS asks to allow notifications → **Allow**.
4. Tap **Send a test**. Within a few seconds you should get a **Dog Day** notification
   — even works with the app closed or phone locked. 🎉
5. From then on, your scheduled reminders fire at their times (the Worker checks every
   minute). The app re-uploads your schedule whenever you change your plan.

---

## Troubleshooting

- **"Open the installed app on your phone to switch this on."** — You're on a browser
  tab or desktop without an active service worker. Use the installed PWA on the phone.
- **"Almost there — the notification server isn't connected yet."** — `workerUrl` is
  still empty in `push.config.ts`, or the Pages redeploy hasn't landed / the PWA hasn't
  updated yet.
- **Allow button never appeared / no test notification:**
  - Confirm iOS is **16.4+**.
  - Confirm you opened it from the **home-screen icon**, not Safari.
  - Check the Worker logs live while you tap test: `npx wrangler tail` (run in `worker/`).
- **Test works but scheduled ones don't:** make sure **Reminders** is on in Setup, the
  day isn't a **day-care** day, and you've actually set up a day (a walk/commitment) so
  there are entries to fire.
- **Inspect what's stored:** `npx wrangler kv key list --binding SUBSCRIBERS` (needs the
  namespace id in `wrangler.toml`).

## How it works (for later you)
- The app computes reminders for the next 7 days as absolute timestamps and POSTs them
  + your push subscription to the Worker `/subscribe`.
- The Worker stores that in KV and, every minute (`crons = ["* * * * *"]`), sends a Web
  Push for anything due. No timezone math on the server — the app already baked it in.
- All free: Cloudflare Workers + KV + Cron on the free tier, GitHub Pages for the app.
