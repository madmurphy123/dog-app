/* app.jsx — Kenny's Day. Tab nav, state, views, toasts, chime, tweaks. */
const { useState, useMemo, useEffect, useRef } = React;
const E = window.KennyEngine;

/* ---- helpers ---- */
function fmtDate(iso) {
  try {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase();
  } catch (e) { return iso; }
}
function todayISO() {
  const d = new Date(); const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function playChime() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext; const ac = new AC();
    const now = ac.currentTime;
    [880, 1318.5].forEach((f, i) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'sine'; o.frequency.value = f; o.connect(g); g.connect(ac.destination);
      const ts = now + i * 0.13;
      g.gain.setValueAtTime(0, ts); g.gain.linearRampToValueAtTime(0.16, ts + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, ts + 0.5); o.start(ts); o.stop(ts + 0.55);
    });
  } catch (e) {}
}
const load = (k, f) => { try { const v = localStorage.getItem('kenny_' + k); return v ? JSON.parse(v) : f; } catch (e) { return f; } };
const save = (k, v) => { try { localStorage.setItem('kenny_' + k, JSON.stringify(v)); } catch (e) {} };

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "layout": "now",
  "arousal": "bars",
  "palette": "sunset",
  "voice": "warm"
}/*EDITMODE-END*/;

const VOICE = {
  warm: { setup: 'Let’s plan Kenny’s day', plan: 'Kenny’s on the books' },
  plain: { setup: 'Set up the day', plan: 'Today’s plan' },
};
const TAB_TITLE = { week: 'Kenny’s week', kit: 'Kenny’s kit' };

function Header({ title, subtitle, reminders, onToggleReminders }) {
  return (
    <div style={{
      background: 'var(--grad-header)', color: 'var(--on-plum)', borderRadius: 'var(--r-card)',
      padding: 18, boxShadow: 'var(--sh-plum)', position: 'relative', overflow: 'hidden', marginBottom: 16,
    }}>
      <div style={{ position: 'absolute', right: -18, top: -22, opacity: 0.10 }}>
        <Icon name="paw" size={130} color="var(--on-plum)" />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, position: 'relative' }}>
        <span className="kd-eyebrow" style={{ color: 'var(--on-plum-soft)' }}>Kenny’s Day</span>
        <button className="kd-btn" onClick={onToggleReminders} aria-label="Toggle reminders" style={{
          marginLeft: 'auto', background: reminders ? 'var(--high)' : 'oklch(1 0 0 / 0.12)', color: reminders ? '#fff' : 'var(--on-plum)',
          width: 38, height: 38, padding: 0, borderRadius: 12,
        }}>
          <Icon name={reminders ? 'bell' : 'bellOff'} size={18} stroke={2.1} />
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, position: 'relative' }}>
        <div style={{ flex: 1 }}>
          <div className="kd-mono" style={{ fontSize: 12, letterSpacing: '0.08em', color: 'var(--on-plum-soft)', marginBottom: 7 }}>{subtitle}</div>
          <h1 className="kd-display" style={{ fontSize: 26, margin: 0, lineHeight: 1.05 }}>{title}</h1>
        </div>
        <image-slot id="kenny-avatar" shape="circle" placeholder="Kenny"
          style={{ width: 70, height: 70, flexShrink: 0, borderRadius: '50%', boxShadow: '0 4px 14px rgba(0,0,0,.25), inset 0 0 0 3px oklch(1 0 0 / 0.5)' }}></image-slot>
      </div>
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [form, setForm] = useState(() => load('form', {
    date: todayISO(), dayStart: '08:00', dayEnd: '21:00', reminders: true, dayCareDates: [],
    events: [
      { id: 'a', start: '09:30', end: '10:30', label: 'Standup + emails' },
      { id: 'b', start: '13:00', end: '15:30', label: 'Deep work' },
    ],
    walks: [{ id: 'w1', time: '08:00' }, { id: 'w2', time: '17:30' }],
  }));
  const [tab, setTab] = useState(() => { const s = load('tab', 'setup'); return ['today', 'week', 'kit', 'setup'].includes(s) ? s : 'setup'; });   // today | week | kit | setup
  const [nonce, setNonce] = useState(0);
  const [doneSet, setDoneSet] = useState(() => new Set(load('done', [])));
  const [ownedKit, setOwnedKit] = useState(() => new Set(load('kit', ['Treat pouch', 'Long training line', 'Dog toothbrush & paste', 'Treat variety pack'])));
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const shopping = useMemo(() => E.buildShoppingList(), []);
  // Plan is derived: reacts live to edits, kit ownership, and reshuffle.
  const plan = useMemo(() => E.buildDogDay({
    date: form.date + (nonce ? '~' + nonce : ''),
    events: form.events.filter((e) => e.start && e.end),
    walks: form.walks.map((w) => w.time),
    dayStart: form.dayStart, dayEnd: form.dayEnd, owned: [...ownedKit],
  }), [form, nonce, ownedKit]);

  useEffect(() => save('form', form), [form]);
  useEffect(() => save('tab', tab), [tab]);
  useEffect(() => save('done', [...doneSet]), [doneSet]);
  useEffect(() => save('kit', [...ownedKit]), [ownedKit]);

  const reshuffle = () => setNonce((n) => n + 1);
  const openDay = (iso) => { setForm((f) => ({ ...f, date: iso })); setNonce(0); setDoneSet(new Set()); setTab('today'); };

  const showToast = (item) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(item); playChime();
    try { if (window.Notification && Notification.permission === 'granted') new Notification(item.title, { body: item.detail }); } catch (e) {}
    toastTimer.current = setTimeout(() => setToast(null), 6000);
  };
  const previewNudge = () => {
    const next = (plan || []).find((it) => !doneSet.has(window.itemKey(it))) || (plan || [])[0];
    if (next) showToast(next);
  };
  const toggleReminders = () => {
    const on = !form.reminders;
    setForm({ ...form, reminders: on });
    if (on && window.Notification && Notification.permission === 'default') { try { Notification.requestPermission(); } catch (e) {} }
  };
  const toggleDone = (item) => {
    const k = window.itemKey(item); const s = new Set(doneSet);
    s.has(k) ? s.delete(k) : s.add(k); setDoneSet(s);
  };
  const toggleKit = (name) => {
    const s = new Set(ownedKit); s.has(name) ? s.delete(name) : s.add(name); setOwnedKit(s);
  };

  const voice = VOICE[t.voice] || VOICE.warm;
  const headerTitle = tab === 'setup' ? voice.setup : (TAB_TITLE[tab] || voice.plan);
  const isDayCare = (form.dayCareDates || []).includes(form.date);
  const hasTreat = plan && plan.some((i) => i.type === 'treat');
  const clearDayCare = () => setForm((f) => ({ ...f, dayCareDates: (f.dayCareDates || []).filter((d) => d !== f.date) }));

  return (
    <div className="kd-root" data-palette={t.palette} style={{ height: '100%', position: 'relative' }}>
      <Toast toast={toast} onClose={() => setToast(null)} />
      <div className="kd-scroll">
        <Header title={headerTitle} subtitle={fmtDate(form.date)} reminders={form.reminders} onToggleReminders={toggleReminders} />

        {tab === 'setup' && (
          <div style={{ animation: 'kd-rise .3s ease' }}>
            <SetupForm form={form} setForm={setForm} onBuild={() => setTab('today')} />
          </div>
        )}

        {tab === 'today' && (
          <div style={{ animation: 'kd-rise .3s ease' }}>
            {isDayCare ? (
              <div className="kd-card" style={{ padding: '36px 24px', textAlign: 'center', animation: 'kd-pop .3s ease' }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--care-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Icon name="pin" size={30} color="var(--care)" stroke={2} />
                </div>
                <h3 className="kd-display" style={{ fontSize: 20, margin: '0 0 7px' }}>Kenny’s at day care</h3>
                <p style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.45, margin: '0 auto', maxWidth: 260 }}>
                  Nothing to plan today — enjoy the quiet. He’ll come home happily worn out.
                </p>
                <button className="kd-btn kd-btn-ghost" onClick={clearDayCare} style={{ marginTop: 18 }}>
                  <Icon name="edit" size={16} stroke={2.2} /> Plan today after all
                </button>
              </div>
            ) : (
              <>
                {form.reminders && plan && plan.length > 0 && (
                  <button className="kd-btn" onClick={previewNudge} style={{
                    width: '100%', justifyContent: 'space-between', marginBottom: 14, padding: '11px 14px',
                    background: 'var(--high-tint)', color: 'var(--high)', borderRadius: 'var(--r-md)', fontSize: 13.5,
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="bell" size={16} stroke={2.2} /> Reminders are on</span>
                    <span style={{ fontWeight: 700 }}>Preview a nudge ›</span>
                  </button>
                )}
                {hasTreat && (
                  <div className="kd-card" style={{ padding: '11px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10, background: 'var(--treat-tint)' }}>
                    <Icon name="gift" size={18} color="var(--treat)" stroke={2.1} />
                    <span style={{ fontSize: 13, color: 'var(--treat)', fontWeight: 600 }}>Treat day — there’s a little surprise in the mix.</span>
                  </div>
                )}
                <DayView items={plan} layout={t.layout} arousalVariant={t.arousal}
                  doneSet={doneSet} onToggleDone={toggleDone} onReshuffle={reshuffle} />
              </>
            )}
          </div>
        )}

        {tab === 'week' && (
          <div style={{ animation: 'kd-rise .3s ease' }}>
            <WeekView form={form} owned={ownedKit} activeDate={form.date} dayCareDates={form.dayCareDates || []} onOpenDay={openDay} />
          </div>
        )}

        {tab === 'kit' && (
          <div style={{ animation: 'kd-rise .3s ease' }}>
            <KitView items={shopping} owned={ownedKit} onToggle={toggleKit} />
          </div>
        )}
      </div>

      <BottomNav value={tab} onChange={setTab} items={[
        { id: 'today', label: 'Today', icon: 'list', varc: '--plum', tint: '--plum-tint' },
        { id: 'week', label: 'Week', icon: 'calendar', varc: '--low', tint: '--low-tint' },
        { id: 'kit', label: 'Kit', icon: 'cart', varc: '--walk', tint: '--walk-tint' },
        { id: 'setup', label: 'Setup', icon: 'edit', varc: '--high', tint: '--high-tint' },
      ]} />

      <TweaksPanel>
        <TweakSection label="Timeline layout" />
        <TweakRadio label="The Day shows as" value={t.layout}
          options={[{ value: 'now', label: 'Up next' }, { value: 'rail', label: 'Rail' }, { value: 'ribbon', label: 'Ribbon' }]}
          onChange={(v) => setTweak('layout', v)} />
        <TweakSection label="Energy indicator" />
        <TweakRadio label="Arousal level" value={t.arousal}
          options={[{ value: 'bars', label: 'Bars' }, { value: 'tag', label: 'Tag' }, { value: 'glyph', label: 'Glyph' }]}
          onChange={(v) => setTweak('arousal', v)} />
        <TweakSection label="Feel" />
        <TweakRadio label="Palette" value={t.palette}
          options={[{ value: 'sunset', label: 'Sunset' }, { value: 'warm', label: 'Warm' }]}
          onChange={(v) => setTweak('palette', v)} />
        <TweakRadio label="Voice" value={t.voice}
          options={[{ value: 'warm', label: 'Warm' }, { value: 'plain', label: 'Plain' }]}
          onChange={(v) => setTweak('voice', v)} />
      </TweaksPanel>
    </div>
  );
}

function Root() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'oklch(0.945 0.012 80)' }}>
      <IOSDevice><App /></IOSDevice>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root />);
