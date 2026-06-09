/* day.jsx — View 2: The Day. Three timeline layouts + item cards. */

/* Single rich card for a timeline entry (walk / game / treat / care). */
function EntryCard({ item, arousalVariant, done, onDone, dimmed }) {
  const m = entryMeta(item);
  const isWalk = item.type === 'walk';
  let right = null;
  if (isWalk) right = <span className="kd-chip" style={{ background: 'var(--walk-tint)', color: 'var(--walk-deep)', padding: '5px 10px 5px 8px', fontSize: 12, fontWeight: 700, gap: 5 }}><Icon name="leaf" size={14} color="var(--walk)" stroke={2.2} />Sniff & stroll</span>;
  else if (item.type === 'game') right = <ArousalIndicator arousal={item.arousal} variant={arousalVariant} />;
  else if (item.type === 'treat') right = <span className="kd-chip" style={{ background: 'var(--treat-tint)', color: 'var(--treat)', padding: '5px 10px 5px 8px', fontSize: 12, fontWeight: 700, gap: 5 }}><Icon name="sparkle" size={14} color="var(--treat)" stroke={2.2} />Surprise</span>;
  else if (item.type === 'care') right = <span className="kd-chip" style={{ background: 'var(--care-tint)', color: 'var(--care)', padding: '5px 11px', fontSize: 12, fontWeight: 700 }}>Reminder</span>;
  return (
    <article className="kd-card" style={{
      padding: 16, position: 'relative', overflow: 'hidden',
      opacity: dimmed ? 0.55 : 1, transition: 'opacity .25s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9 }}>
        <span className="kd-mono" style={{
          fontSize: 13, fontWeight: 700, color: m.accent, background: m.tint,
          padding: '4px 9px', borderRadius: 8, letterSpacing: '-0.02em',
        }}>{item.time}</span>
        <span className="kd-eyebrow" style={{ color: 'var(--ink-faint)' }}>{m.type}</span>
        <span style={{ marginLeft: 'auto' }}>{right}</span>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 13, flexShrink: 0, background: m.tint,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name={m.icon} size={24} color={m.accent} stroke={2.1} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className="kd-display" style={{ fontSize: 18, margin: '1px 0 3px', textDecoration: done ? 'line-through' : 'none', textDecorationColor: 'var(--ink-faint)' }}>{item.title}</h3>
          <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.4, margin: 0, textWrap: 'pretty' }}>{item.detail}</p>
        </div>
      </div>

      {isWalk && item.tasks && (
        <ul style={{ listStyle: 'none', margin: '12px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
          {item.tasks.map((t, i) => (
            <li key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', fontSize: 13, color: 'var(--ink)', lineHeight: 1.35 }}>
              <span style={{ width: 18, height: 18, borderRadius: 6, background: 'var(--walk-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <span style={{ width: 5, height: 5, borderRadius: 99, background: 'var(--walk)' }} />
              </span>
              <span style={{ textWrap: 'pretty' }}>{t}</span>
            </li>
          ))}
        </ul>
      )}

      {onDone && (
        <button className="kd-btn" onClick={onDone} style={{
          marginTop: 13, width: '100%', padding: '10px', fontSize: 13.5, borderRadius: 'var(--r-md)',
          background: done ? m.tint : 'var(--chip)',
          color: done ? m.accent : 'var(--ink-soft)',
        }}>
          <Icon name="check" size={16} stroke={2.4} /> {done ? 'Done with Kenny' : 'Mark as done'}
        </button>
      )}
    </article>
  );
}

/* compact one-line row for the ribbon / agenda layout */
function RibbonRow({ item, arousalVariant, done }) {
  const m = entryMeta(item);
  const treatLabel = { toy: 'Treat · a new toy', food: 'Treat · something tasty', chew: 'Treat · a chew', treat: 'Treat · new flavour' };
  const sub = item.type === 'walk' ? 'Walk · sniff & stroll'
    : item.type === 'treat' ? (treatLabel[item.treatKind] || 'A little surprise')
    : item.type === 'care' ? 'Care reminder'
    : (AROUSAL[item.arousal] || AROUSAL.med).label;
  return (
    <div className="kd-card" style={{ padding: '11px 13px', display: 'flex', alignItems: 'center', gap: 12, opacity: done ? 0.5 : 1 }}>
      <span className="kd-mono" style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-soft)', width: 42, flexShrink: 0 }}>{item.time}</span>
      <span style={{ width: 34, height: 34, borderRadius: 10, background: m.tint, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name={m.icon} size={18} color={m.accent} stroke={2.2} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span className="kd-display" style={{ fontSize: 14.5, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: done ? 'line-through' : 'none' }}>{item.title}</span>
        <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>{sub}</span>
      </span>
      <span style={{ width: 9, height: 9, borderRadius: 99, background: m.accent, flexShrink: 0 }} />
    </div>
  );
}

function DayHeadline({ items, doneSet }) {
  const remaining = items.filter((it) => !doneSet.has(itemKey(it)));
  const nGames = items.filter((i) => i.type === 'game').length;
  const nWalks = items.filter((i) => i.type === 'walk').length;
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
      <span className="kd-chip" style={{ background: 'var(--chip)', color: 'var(--ink-soft)', fontSize: 12.5 }}>
        <Icon name="paw" size={14} color="var(--plum)" /> {nGames} games
      </span>
      <span className="kd-chip" style={{ background: 'var(--walk-tint)', color: 'var(--walk-deep)', fontSize: 12.5 }}>
        <Icon name="walk" size={14} color="var(--walk)" /> {nWalks} walks
      </span>
      <span className="kd-chip" style={{ background: 'var(--high-tint)', color: 'var(--high)', fontSize: 12.5, marginLeft: 'auto' }}>
        {remaining.length} to go
      </span>
    </div>
  );
}

function itemKey(it) { return `${it.time}-${it.title}`; }

function DayView({ items, layout, arousalVariant, doneSet, onToggleDone, onReshuffle }) {
  if (!items || items.length === 0) {
    return (
      <div className="kd-card" style={{ padding: '36px 24px', textAlign: 'center', animation: 'kd-pop .3s ease' }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--plum-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Icon name="moon" size={30} color="var(--plum)" stroke={2} />
        </div>
        <h3 className="kd-display" style={{ fontSize: 19, margin: '0 0 7px' }}>No room today</h3>
        <p style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.45, margin: '0 auto', maxWidth: 260 }}>
          Your day’s packed wall-to-wall. Free up a 25-minute gap or add a walk, then build again — Kenny will take what he can get.
        </p>
        <button className="kd-btn kd-btn-ghost" onClick={onReshuffle} style={{ marginTop: 18 }}>
          <Icon name="shuffle" size={16} stroke={2.2} /> Try again
        </button>
      </div>
    );
  }

  const firstPending = items.find((it) => !doneSet.has(itemKey(it)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <DayHeadline items={items} doneSet={doneSet} />

      {/* NOW-FOCUSED ------------------------------------------------------- */}
      {layout === 'now' && (
        <>
          {firstPending && (
            <div style={{ animation: 'kd-rise .3s ease' }}>
              <div className="kd-eyebrow" style={{ color: 'var(--high)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: 99, background: 'var(--high)', animation: 'kd-pulse 1.8s infinite' }} /> Up next for Kenny
              </div>
              <EntryCard item={firstPending} arousalVariant={arousalVariant}
                done={doneSet.has(itemKey(firstPending))} onDone={() => onToggleDone(firstPending)} />
            </div>
          )}
          {items.filter((it) => it !== firstPending).length > 0 && (
            <div>
              <div className="kd-eyebrow" style={{ color: 'var(--ink-faint)', margin: '6px 2px 10px' }}>Later today</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {items.filter((it) => it !== firstPending).map((it) => (
                  <RibbonRow key={itemKey(it)} item={it} arousalVariant={arousalVariant} done={doneSet.has(itemKey(it))} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* VERTICAL RAIL ----------------------------------------------------- */}
      {layout === 'rail' && (
        <div style={{ position: 'relative' }}>
          {items.map((it, i) => {
            const isWalk = it.type === 'walk';
            const accent = isWalk ? 'var(--walk)' : `var(${(AROUSAL[it.arousal] || AROUSAL.med).varc})`;
            return (
              <div key={itemKey(it)} style={{ display: 'grid', gridTemplateColumns: '28px 1fr', gap: 10, animation: 'kd-rise .3s ease', animationDelay: `${i * 0.04}s`, animationFillMode: 'backwards' }}>
                <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                  {i < items.length - 1 && <span style={{ position: 'absolute', top: 18, bottom: -14, width: 2.5, background: 'oklch(0.33 0.078 350 / 0.12)', borderRadius: 2 }} />}
                  <span style={{ width: 15, height: 15, borderRadius: 99, background: 'var(--paper-card)', border: `3.5px solid ${accent}`, marginTop: 9, zIndex: 1, boxShadow: '0 0 0 4px var(--paper)' }} />
                </div>
                <div style={{ paddingBottom: 14 }}>
                  <EntryCard item={it} arousalVariant={arousalVariant} done={doneSet.has(itemKey(it))} onDone={() => onToggleDone(it)} dimmed={doneSet.has(itemKey(it))} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* RIBBON ------------------------------------------------------------ */}
      {layout === 'ribbon' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {items.map((it, i) => (
            <div key={itemKey(it)} onClick={() => onToggleDone(it)} style={{ cursor: 'pointer', animation: 'kd-rise .3s ease', animationDelay: `${i * 0.03}s`, animationFillMode: 'backwards' }}>
              <RibbonRow item={it} arousalVariant={arousalVariant} done={doneSet.has(itemKey(it))} />
            </div>
          ))}
        </div>
      )}

      <button className="kd-btn kd-btn-plum" onClick={onReshuffle} style={{ width: '100%', marginTop: 4 }}>
        <Icon name="shuffle" size={18} color="var(--on-plum)" stroke={2.2} /> Reshuffle the day
      </button>
    </div>
  );
}

Object.assign(window, { DayView, EntryCard, itemKey });
