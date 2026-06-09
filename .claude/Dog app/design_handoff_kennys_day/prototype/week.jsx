/* week.jsx — View: Week planner. 7-day overview, each a mini-timeline, tap to open. */

function isoOf(d) { const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; }
function mondayOf(iso) {
  const d = new Date(iso + 'T00:00:00');
  const wd = d.getDay(); // 0 Sun..6 Sat
  d.setDate(d.getDate() + (wd === 0 ? -6 : 1 - wd));
  return d;
}

function MiniTimeline({ items, startMin, endMin }) {
  const span = Math.max(1, endMin - startMin);
  const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
  return (
    <div style={{ position: 'relative', height: 22, borderRadius: 99, background: 'oklch(0.33 0.078 350 / 0.06)', overflow: 'hidden' }}>
      {/* midday tick */}
      <span style={{ position: 'absolute', left: `${((12 * 60 - startMin) / span) * 100}%`, top: 0, bottom: 0, width: 1, background: 'oklch(0.33 0.078 350 / 0.10)' }} />
      {items.map((it, i) => {
        const m = entryMeta(it);
        const isWalk = it.type === 'walk';
        const left = Math.min(96, Math.max(2, ((toMin(it.time) - startMin) / span) * 100));
        return (
          <span key={i} title={`${it.time} ${it.title}`} style={{
            position: 'absolute', left: `${left}%`, top: '50%', transform: 'translate(-50%,-50%)',
            width: isWalk ? 11 : 9, height: isWalk ? 11 : 9, borderRadius: isWalk ? 4 : 99,
            background: m.accent, boxShadow: '0 0 0 2px var(--paper-card)',
          }} />
        );
      })}
    </div>
  );
}

function WeekView({ form, owned, activeDate, dayCareDates = [], onOpenDay }) {
  const startMin = (() => { const [h, m] = form.dayStart.split(':').map(Number); return h * 60 + m; })();
  const endMin = (() => { const [h, m] = form.dayEnd.split(':').map(Number); return h * 60 + m; })();
  const realToday = isoOf(new Date());
  const mon = mondayOf(form.date);

  const days = React.useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(mon); d.setDate(mon.getDate() + i);
      const iso = isoOf(d);
      const care = dayCareDates.includes(iso);
      const items = care ? [] : window.KennyEngine.buildDogDay({
        date: iso,
        events: form.events.filter((e) => e.start && e.end),
        walks: form.walks.map((w) => w.time),
        dayStart: form.dayStart, dayEnd: form.dayEnd,
        owned: [...owned],
      });
      return { iso, d, care, items, games: items.filter((x) => x.type === 'game').length, walks: items.filter((x) => x.type === 'walk').length };
    });
  }, [form, owned, dayCareDates]);

  const wl = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* week strip */}
      <div className="kd-card" style={{ padding: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 5 }}>
          {days.map((dy, i) => {
            const on = dy.iso === activeDate;
            const isToday = dy.iso === realToday;
            return (
              <button key={dy.iso} className="kd-btn" onClick={() => onOpenDay(dy.iso)} style={{
                flexDirection: 'column', gap: 3, padding: '8px 0', borderRadius: 14,
                background: on ? 'var(--plum)' : 'transparent', color: on ? 'var(--on-plum)' : 'var(--ink)',
              }}>
                <span className="kd-mono" style={{ fontSize: 10, fontWeight: 700, opacity: on ? 0.7 : 0.45 }}>{wl[i]}</span>
                <span className="kd-display" style={{ fontSize: 16 }}>{dy.d.getDate()}</span>
                <span style={{ width: 5, height: 5, borderRadius: 99, background: dy.care ? (on ? 'var(--on-plum)' : 'var(--care)') : (isToday ? (on ? 'var(--on-plum)' : 'var(--high)') : 'transparent') }} />
              </button>
            );
          })}
        </div>
      </div>

      {/* per-day rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {days.map((dy) => {
          const on = dy.iso === activeDate;
          return (
            <button key={dy.iso} onClick={() => onOpenDay(dy.iso)} className="kd-card" style={{
              padding: 14, textAlign: 'left', border: 'none', cursor: 'pointer', font: 'inherit', color: 'inherit',
              boxShadow: on ? '0 0 0 2px var(--plum), var(--sh-1)' : 'var(--sh-1)', background: 'var(--paper-card)',
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 9 }}>
                <span className="kd-display" style={{ fontSize: 15 }}>{dy.d.toLocaleDateString('en-GB', { weekday: 'long' })}</span>
                <span className="kd-mono" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>{dy.d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase()}</span>
                {!dy.care && (
                  <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                    <span className="kd-chip" style={{ background: 'var(--chip)', color: 'var(--ink-soft)', fontSize: 11.5, padding: '4px 9px' }}>{dy.games} games</span>
                    <span className="kd-chip" style={{ background: 'var(--walk-tint)', color: 'var(--walk-deep)', fontSize: 11.5, padding: '4px 9px' }}>{dy.walks} walks</span>
                  </span>
                )}
                {dy.care && <span className="kd-chip" style={{ marginLeft: 'auto', background: 'var(--care-tint)', color: 'var(--care)', fontSize: 11.5, padding: '4px 10px' }}>Day care</span>}
              </div>
              {dy.care
                ? <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 22, color: 'var(--ink-faint)', fontSize: 12.5 }}><Icon name="moon" size={15} color="var(--care)" stroke={2} /> Out at day care — a day off the plan.</div>
                : <MiniTimeline items={dy.items} startMin={startMin} endMin={endMin} />}
            </button>
          );
        })}
      </div>

      <p style={{ fontSize: 12, color: 'var(--ink-faint)', textAlign: 'center', lineHeight: 1.5, margin: '2px 16px 0' }}>
        Same commitments, a different mix each day. Tap a day to open it.
      </p>
    </div>
  );
}

Object.assign(window, { WeekView });
