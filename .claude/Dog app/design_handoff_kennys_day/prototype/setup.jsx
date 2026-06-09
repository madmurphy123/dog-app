/* setup.jsx — View 1: Setup (data entry). Exports SetupForm to window. */

function FieldLabel({ icon, children, hint }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}>
      {icon && <Icon name={icon} size={15} color="var(--ink-faint)" stroke={2.2} />}
      <span className="kd-eyebrow" style={{ color: 'var(--ink-soft)' }}>{children}</span>
      {hint && <span style={{ fontSize: 11.5, color: 'var(--ink-faint)', fontWeight: 500, marginLeft: 'auto', letterSpacing: 0 }}>{hint}</span>}
    </div>
  );
}

function SetupForm({ form, setForm, onBuild }) {
  const uid = () => Math.random().toString(36).slice(2, 8);
  const set = (patch) => setForm({ ...form, ...patch });

  const addEvent = () => set({ events: [...form.events, { id: uid(), start: '11:00', end: '12:00', label: '' }] });
  const updEvent = (id, patch) => set({ events: form.events.map((e) => e.id === id ? { ...e, ...patch } : e) });
  const delEvent = (id) => set({ events: form.events.filter((e) => e.id !== id) });

  const [newWalk, setNewWalk] = React.useState('08:00');
  const addWalk = () => {
    if (form.walks.some((w) => w.time === newWalk)) return;
    set({ walks: [...form.walks, { id: uid(), time: newWalk }].sort((a, b) => a.time.localeCompare(b.time)) });
  };
  const delWalk = (id) => set({ walks: form.walks.filter((w) => w.id !== id) });

  const dayCareDates = form.dayCareDates || [];
  const isDayCare = dayCareDates.includes(form.date);
  const toggleDayCare = () => {
    const s = new Set(dayCareDates);
    s.has(form.date) ? s.delete(form.date) : s.add(form.date);
    set({ dayCareDates: [...s] });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* date + window */}
      <div className="kd-card" style={{ padding: 18 }}>
        <FieldLabel icon="calendar">The day</FieldLabel>
        <input type="date" className="kd-input kd-mono" value={form.date}
          onChange={(e) => set({ date: e.target.value })} style={{ marginBottom: 16 }} />
        <FieldLabel icon="sun" hint="Kenny’s hours">Awake window</FieldLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 10 }}>
          <input type="time" className="kd-input kd-mono" value={form.dayStart} onChange={(e) => set({ dayStart: e.target.value })} />
          <span style={{ color: 'var(--ink-faint)', fontWeight: 700 }}>–</span>
          <input type="time" className="kd-input kd-mono" value={form.dayEnd} onChange={(e) => set({ dayEnd: e.target.value })} />
        </div>
      </div>

      {/* commitments */}
      <div className="kd-card" style={{ padding: 18 }}>
        <FieldLabel icon="clock" hint={`${form.events.length} blocked`}>Your commitments</FieldLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {form.events.length === 0 && (
            <div style={{ fontSize: 13.5, color: 'var(--ink-faint)', padding: '6px 2px 10px' }}>
              Nothing booked yet — add the meetings and deep-work blocks Kenny has to fit around.
            </div>
          )}
          {form.events.map((e) => (
            <div key={e.id} style={{
              display: 'grid', gridTemplateColumns: 'auto auto 1fr auto', gap: 8, alignItems: 'center',
              background: 'var(--paper)', borderRadius: 'var(--r-md)', padding: 8,
            }}>
              <input type="time" className="kd-input kd-mono" value={e.start} onChange={(ev) => updEvent(e.id, { start: ev.target.value })} style={{ padding: '9px 8px', fontSize: 14, width: 92 }} />
              <input type="time" className="kd-input kd-mono" value={e.end} onChange={(ev) => updEvent(e.id, { end: ev.target.value })} style={{ padding: '9px 8px', fontSize: 14, width: 92 }} />
              <input type="text" className="kd-input" placeholder="Label" value={e.label} onChange={(ev) => updEvent(e.id, { label: ev.target.value })} style={{ padding: '9px 11px', fontSize: 14, minWidth: 0 }} />
              <button className="kd-btn" onClick={() => delEvent(e.id)} aria-label="Remove" style={{ background: 'transparent', padding: 7, color: 'var(--ink-faint)' }}>
                <Icon name="trash" size={17} stroke={2} />
              </button>
            </div>
          ))}
        </div>
        <button className="kd-btn kd-btn-ghost" onClick={addEvent} style={{ marginTop: 12, width: '100%', fontSize: 14.5 }}>
          <Icon name="plus" size={17} stroke={2.4} /> Add commitment
        </button>
      </div>

      {/* walks */}
      <div className="kd-card" style={{ padding: 18 }}>
        <FieldLabel icon="walk" hint="fixed points in the day">Walk times</FieldLabel>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: form.walks.length ? 14 : 4 }}>
          {form.walks.map((w) => (
            <span key={w.id} className="kd-chip" style={{ background: 'var(--walk-tint)', color: 'var(--walk-deep)', paddingRight: 7 }}>
              <Icon name="walk" size={15} color="var(--walk)" stroke={2.2} />
              <span className="kd-mono" style={{ fontWeight: 700, fontSize: 13.5 }}>{w.time}</span>
              <button className="kd-btn" onClick={() => delWalk(w.id)} aria-label="Remove walk" style={{ background: 'oklch(0.585 0.075 168 / 0.18)', padding: 3, marginLeft: 2, color: 'var(--walk-deep)' }}>
                <Icon name="close" size={13} stroke={2.6} />
              </button>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="time" className="kd-input kd-mono" value={newWalk} onChange={(e) => setNewWalk(e.target.value)} style={{ flex: 1, padding: '11px 12px', fontSize: 14.5 }} />
          <button className="kd-btn kd-btn-ghost" onClick={addWalk} style={{ fontSize: 14.5, paddingLeft: 16, paddingRight: 18 }}>
            <Icon name="plus" size={17} stroke={2.4} /> Add walk
          </button>
        </div>
      </div>

      {/* day care — block out the whole day */}
      <button className="kd-card" onClick={toggleDayCare} style={{
        padding: '15px 18px', display: 'flex', alignItems: 'center', gap: 13, cursor: 'pointer',
        border: 'none', textAlign: 'left', width: '100%', font: 'inherit', color: 'inherit',
        background: isDayCare ? 'var(--care-tint)' : 'var(--paper-card)',
      }}>
        <div style={{
          width: 42, height: 42, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          background: isDayCare ? 'var(--care)' : 'oklch(0.5 0.03 320 / 0.07)',
        }}>
          <Icon name="pin" size={21} color={isDayCare ? '#fff' : 'var(--ink-faint)'} stroke={2.1} />
        </div>
        <div style={{ flex: 1 }}>
          <div className="kd-display" style={{ fontSize: 16 }}>At doggy day care</div>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Block the whole day — Kenny’s out having fun.</div>
        </div>
        <span style={{
          width: 50, height: 30, borderRadius: 99, position: 'relative', flexShrink: 0, transition: 'background .2s ease',
          background: isDayCare ? 'var(--care)' : 'oklch(0.33 0.078 350 / 0.18)',
        }}>
          <span style={{
            position: 'absolute', top: 3, left: isDayCare ? 23 : 3, width: 24, height: 24, borderRadius: 99,
            background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.25)', transition: 'left .2s cubic-bezier(.2,.9,.3,1.2)',
          }} />
        </span>
      </button>

      {/* reminders */}
      <button className="kd-card" onClick={() => set({ reminders: !form.reminders })} style={{
        padding: '15px 18px', display: 'flex', alignItems: 'center', gap: 13, cursor: 'pointer',
        border: 'none', textAlign: 'left', width: '100%', font: 'inherit', color: 'inherit',
      }}>
        <div style={{
          width: 42, height: 42, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          background: form.reminders ? 'var(--high-tint)' : 'oklch(0.33 0.078 350 / 0.07)',
        }}>
          <Icon name={form.reminders ? 'bell' : 'bellOff'} size={21} color={form.reminders ? 'var(--high)' : 'var(--ink-faint)'} stroke={2.1} />
        </div>
        <div style={{ flex: 1 }}>
          <div className="kd-display" style={{ fontSize: 16 }}>Shoulder taps</div>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>A toast + chime at each prompt’s time.</div>
        </div>
        <span style={{
          width: 50, height: 30, borderRadius: 99, position: 'relative', flexShrink: 0, transition: 'background .2s ease',
          background: form.reminders ? 'var(--high)' : 'oklch(0.33 0.078 350 / 0.18)',
        }}>
          <span style={{
            position: 'absolute', top: 3, left: form.reminders ? 23 : 3, width: 24, height: 24, borderRadius: 99,
            background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.25)', transition: 'left .2s cubic-bezier(.2,.9,.3,1.2)',
          }} />
        </span>
      </button>

      {/* build */}
      <button className="kd-btn kd-btn-primary" onClick={onBuild} style={{ width: '100%', fontSize: 17, padding: '17px 22px', marginTop: 2 }}>
        <Icon name="sparkle" size={19} color="#fff" stroke={2.2} /> Build Kenny’s day
      </button>
    </div>
  );
}

Object.assign(window, { SetupForm });
