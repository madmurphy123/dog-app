# Deploy to GitHub Pages + iPhone install

This is the full path to getting **Dog Day** live on the free web and installed on your
iPhone. Phone **push notifications** are Part 3 — they require the app to be live first,
so do Parts 1 and 2, then we build push.

Replace `<your-username>` with your GitHub username throughout. The repo is assumed to be
named **`dog-care-app`** (the deploy workflow auto-detects the name, so any name works — but
keep it consistent in the URLs below).

---

## Part 1 — Put it live on GitHub Pages (free)

### 1.1 Make `dog-care-app` its own git repo
The project was scaffolded without git. From a terminal **in the project folder**:

```powershell
cd C:\Users\murph\Documents\dog-care-app
git init
git branch -M main
git add -A
git commit -m "Initial commit: Dog Day PWA"
```

> Note: this folder lives inside your `Documents` git repo. A nested repo here is fine —
> just treat `dog-care-app` as its own project from now on.

### 1.2 Create the GitHub repo and push
**Option A — GitHub CLI (easiest):**
```powershell
gh repo create dog-care-app --public --source . --remote origin --push
```

**Option B — Web UI:**
1. Go to <https://github.com/new>, name it `dog-care-app`, **Public**, do **not** add a
   README/.gitignore (you already have them), click **Create repository**.
2. Then:
   ```powershell
   git remote add origin https://github.com/<your-username>/dog-care-app.git
   git push -u origin main
   ```

### 1.3 Turn on Pages (source = GitHub Actions)
1. In the repo: **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.

### 1.4 Let it deploy
- The push from 1.2 already triggered the **Deploy to GitHub Pages** workflow
  (`.github/workflows/deploy.yml`).
- Watch it in the **Actions** tab. If the very first run happened *before* you set the
  Source in 1.3, just open that run and click **Re-run all jobs**.
- When it's green, your app is live at:

  **`https://<your-username>.github.io/dog-care-app/`**

Every future `git push` to `main` redeploys automatically.

### 1.5 Local production preview (optional)
To preview the production build on your PC first (run in **PowerShell**, not Git Bash):
```powershell
npm run deploy:build
npx http-server dist/dog-care-app -p 8080
```
Then open <http://localhost:8080>.

---

## Part 2 — Install it on your iPhone

iOS only allows web-push for an **installed** PWA, so this step is required (and it's nice
anyway — a real app icon, full screen, no Safari chrome).

1. On your iPhone, open **Safari** (must be Safari, not Chrome) and go to
   `https://<your-username>.github.io/dog-care-app/`.
2. Tap the **Share** button (the square with the up-arrow).
3. Scroll down, tap **Add to Home Screen**, then **Add**.
4. Open **Dog Day** from your home screen. It now runs full-screen as an app.

> Requires **iOS 16.4 or later** for push to work later. Check **Settings → General →
> About → Software Version** if unsure.

At this point the app fully works (plan a day, kit, week) with **in-app** reminders while
it's open. Next we make it nudge you even when it's closed.

---

## Part 3 — Phone push notifications (next build)

This is what we build after the app is live. High level:

1. **VAPID keys** — a public/private keypair generated once (free). Public key ships in the
   app; private key is a secret on the backend.
2. **Cloudflare Worker** (free) — a tiny backend with:
   - a `/subscribe` endpoint that stores your push subscription in **Workers KV**,
   - a **Cron Trigger** that runs every minute, re-runs the planning engine, and sends a
     Web Push for any reminder due that minute.
3. **App changes** — a "Turn on phone notifications" button using Angular's `SwPush` to
   request permission, subscribe with the VAPID key, and send the subscription to the Worker.

### What you can do now to prepare
- Create a **free Cloudflare account**: <https://dash.cloudflare.com/sign-up>
- Confirm your iPhone is on **iOS 16.4+**.
- Make sure Parts 1 and 2 are done (app live + installed) — push can't be tested otherwise.

Once the app is live and you've got the Cloudflare account, tell me and we'll build Part 3.
