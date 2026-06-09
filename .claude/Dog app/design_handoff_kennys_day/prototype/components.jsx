/* components.jsx — shared UI primitives. Exports to window. */

/* ---- minimal line icons (functional affordances, simple geometry) ---- */
function Icon({ name, size = 20, color = 'currentColor', stroke = 2 }) {
  const p = { fill: 'none', stroke: color, strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    search: <><circle cx="11" cy="11" r="7" {...p} /><path d="M21 21l-4.3-4.3" {...p} /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h11" {...p} /></>,
    plus: <path d="M12 5v14M5 12h14" {...p} />,
    close: <path d="M6 6l12 12M18 6L6 18" {...p} />,
    trash: <><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" {...p} /></>,
    clock: <><circle cx="12" cy="12" r="9" {...p} /><path d="M12 7v5l3 2" {...p} /></>,
    bell: <><path d="M6 9a6 6 0 0112 0c0 6 2 7 2 7H4s2-1 2-7" {...p} /><path d="M10 20a2 2 0 004 0" {...p} /></>,
    bellOff: <><path d="M6 9a6 6 0 019-5M18 9c0 6 2 7 2 7H8" {...p} /><path d="M4 4l16 16" {...p} /><path d="M10 20a2 2 0 004 0" {...p} /></>,
    check: <path d="M5 12.5l4.5 4.5L19 6.5" {...p} />,
    shuffle: <><path d="M16 4h4v4M4 20l16-16M4 4l5 5M15 15l5 5M16 20h4v-4" {...p} /></>,
    edit: <><path d="M4 20h4L19 9l-4-4L4 16v4z" {...p} /><path d="M14 6l4 4" {...p} /></>,
    chevR: <path d="M9 5l7 7-7 7" {...p} />,
    chevL: <path d="M15 5l-7 7 7 7" {...p} />,
    chevD: <path d="M5 9l7 7 7-7" {...p} />,
    calendar: <><rect x="3.5" y="5" width="17" height="16" rx="3" {...p} /><path d="M3.5 9.5h17M8 3v4M16 3v4" {...p} /></>,
    sun: <><circle cx="12" cy="12" r="4.5" {...p} /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" {...p} /></>,
    moon: <path d="M20 14.5A8 8 0 119.5 4 6.5 6.5 0 0020 14.5z" {...p} />,
    paw: <><circle cx="7.5" cy="10" r="1.9" fill={color} stroke="none" /><circle cx="12" cy="8" r="1.9" fill={color} stroke="none" /><circle cx="16.5" cy="10" r="1.9" fill={color} stroke="none" /><path d="M12 12.4c-2.6 0-4.6 1.7-4.6 3.8 0 1.5 1.3 2.3 2.6 2 .8-.2 1.3-.5 2-.5s1.2.3 2 .5c1.3.3 2.6-.5 2.6-2 0-2.1-2-3.8-4.6-3.8z" fill={color} stroke="none" /></>,
    walk: <><circle cx="13" cy="4.5" r="1.8" fill={color} stroke="none" /><path d="M12 8l-2 4 2 2v6M12 12l3 2 2-1M10 12l-2 3-3 1" {...p} /></>,
    cart: <><circle cx="9" cy="20" r="1.4" fill={color} stroke="none" /><circle cx="17" cy="20" r="1.4" fill={color} stroke="none" /><path d="M3 4h2l2.5 12h11l2-8H6" {...p} /></>,
    list: <><path d="M8 6h12M8 12h12M8 18h12" {...p} /><circle cx="4" cy="6" r="1" fill={color} stroke="none" /><circle cx="4" cy="12" r="1" fill={color} stroke="none" /><circle cx="4" cy="18" r="1" fill={color} stroke="none" /></>,
    flame: <path d="M12 3c1 3-2 4-2 7a2 2 0 004 0c0-1 0-1.5-.3-2 1.8 1 3.3 3 3.3 5.5a5 5 0 11-10 0C7 12 12 11 12 3z" {...p} />,
    leaf: <><path d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14z" {...p} /><path d="M5 19C9 14 13 11 17 9" {...p} /></>,
    sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" {...p} />,
    pin: <><path d="M12 21s7-6.3 7-11a7 7 0 10-14 0c0 4.7 7 11 7 11z" {...p} /><circle cx="12" cy="10" r="2.5" {...p} /></>,
    gift: <><rect x="4" y="9" width="16" height="11.5" rx="2" {...p} /><path d="M3 9h18M12 9v11.5" {...p} /><path d="M12 9S10.4 4.8 8.2 5.4C6.6 5.9 7.4 9 9.3 9H12zM12 9s1.6-4.2 3.8-3.6C17.4 5.9 16.6 9 14.7 9H12z" {...p} /></>,
    droplet: <path d="M12 3.5S5.5 10 5.5 14.5a6.5 6.5 0 0013 0C18.5 10 12 3.5 12 3.5z" {...p} />,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block', flexShrink: 0 }}>
      {paths[name] || null}
    </svg>
  );
}

/* ---- arousal meta + indicator (3 tweakable variants) ---- */
const AROUSAL = {
  high: { label: 'High energy', short: 'High', level: 3, varc: '--high', tint: '--high-tint', glyph: 'flame' },
  med:  { label: 'Medium',      short: 'Med',  level: 2, varc: '--med',  tint: '--med-tint',  glyph: 'sparkle' },
  low:  { label: 'Calm',        short: 'Calm', level: 1, varc: '--low',  tint: '--low-tint',  glyph: 'leaf' },
};

function ArousalIndicator({ arousal, variant = 'bars' }) {
  const a = AROUSAL[arousal] || AROUSAL.med;
  const c = `var(${a.varc})`;
  if (variant === 'tag') {
    return (
      <span className="kd-chip" style={{ background: `var(${a.tint})`, color: c, padding: '5px 11px', fontSize: 12, fontWeight: 700 }}>
        <span style={{ width: 7, height: 7, borderRadius: 99, background: c }} />
        {a.label}
      </span>
    );
  }
  if (variant === 'glyph') {
    return (
      <span className="kd-chip" style={{ background: `var(${a.tint})`, color: c, padding: '5px 10px 5px 8px', fontSize: 12, fontWeight: 700, gap: 5 }}>
        <Icon name={a.glyph} size={14} color={c} stroke={2.2} />
        {a.short}
      </span>
    );
  }
  // bars (default)
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ display: 'inline-flex', alignItems: 'flex-end', gap: 2.5, height: 14 }}>
        {[1, 2, 3].map((i) => (
          <span key={i} style={{
            width: 4, height: 5 + i * 3, borderRadius: 2,
            background: i <= a.level ? c : 'currentColor',
            opacity: i <= a.level ? 1 : 0.16,
          }} />
        ))}
      </span>
      <span className="kd-mono" style={{ fontSize: 11, fontWeight: 700, color: c, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{a.short}</span>
    </span>
  );
}

/* ---- segmented tab switcher ---- */
function TabSwitcher({ tabs, value, onChange }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: `repeat(${tabs.length},1fr)`, gap: 4,
      background: 'oklch(0.33 0.078 350 / 0.07)', borderRadius: 'var(--r-pill)', padding: 4,
    }}>
      {tabs.map((t) => {
        const on = t.id === value;
        return (
          <button key={t.id} className="kd-btn" onClick={() => onChange(t.id)} style={{
            padding: '10px 8px', fontSize: 14.5, borderRadius: 'var(--r-pill)',
            background: on ? 'var(--paper-card)' : 'transparent',
            color: on ? 'var(--ink)' : 'var(--ink-soft)',
            boxShadow: on ? 'var(--sh-1)' : 'none',
          }}>
            <Icon name={t.icon} size={17} color={on ? `var(${t.varc || '--plum'})` : 'var(--ink-faint)'} stroke={2.2} />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---- per-entry visual identity (walk / game / treat / care) ---- */
function entryMeta(item) {
  if (!item) return { accent: 'var(--plum)', tint: 'var(--plum-tint)', icon: 'paw', type: 'Game' };
  if (item.type === 'walk') return { accent: 'var(--walk)', tint: 'var(--walk-tint)', icon: 'walk', type: 'Walk' };
  if (item.type === 'treat') return { accent: 'var(--treat)', tint: 'var(--treat-tint)', icon: 'gift', type: 'Treat' };
  if (item.type === 'care') return { accent: 'var(--care)', tint: 'var(--care-tint)', icon: 'droplet', type: 'Care' };
  const a = AROUSAL[item.arousal] || AROUSAL.med;
  return { accent: `var(${a.varc})`, tint: `var(${a.tint})`, icon: 'paw', type: 'Game' };
}

/* ---- toast / nudge ---- */
function Toast({ toast, onClose }) {
  if (!toast) return null;
  const m = entryMeta(toast);
  return (
    <div style={{
      position: 'absolute', top: 64, left: 14, right: 14, zIndex: 200,
      animation: 'kd-toast-in .34s cubic-bezier(.2,.9,.3,1.2)',
    }}>
      <div className="kd-card" style={{
        padding: '13px 14px', display: 'flex', gap: 12, alignItems: 'flex-start',
        boxShadow: 'var(--sh-2)', borderRadius: 'var(--r-lg)', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, background: m.accent }} />
        <div style={{
          width: 40, height: 40, borderRadius: 12, flexShrink: 0, marginLeft: 3, background: m.tint,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name={m.icon} size={22} color={m.accent} stroke={2.2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
            <span className="kd-eyebrow" style={{ color: m.accent }}>Now · {toast.time}</span>
          </div>
          <div className="kd-display" style={{ fontSize: 16, marginBottom: 2 }}>{toast.title}</div>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.35 }}>{toast.detail}</div>
        </div>
        <button className="kd-btn" onClick={onClose} style={{ background: 'transparent', padding: 4, color: 'var(--ink-faint)' }}>
          <Icon name="close" size={18} stroke={2.2} />
        </button>
      </div>
    </div>
  );
}

/* ---- persistent bottom tab bar — deep capsule, warm active pill ---- */
function BottomNav({ value, onChange, items }) {
  return (
    <div style={{
      position: 'absolute', left: 16, right: 16, bottom: 20, zIndex: 100,
    }}>
      <nav style={{
        display: 'grid', gridTemplateColumns: `repeat(${items.length},1fr)`, gap: 5,
        padding: 6, borderRadius: 'var(--r-pill)', background: 'var(--nav-bg)',
        boxShadow: 'var(--sh-plum), inset 0 1px 0 oklch(1 0 0 / 0.10)',
      }}>
        {items.map((it) => {
          const on = it.id === value;
          return (
            <button key={it.id} className="kd-btn" onClick={() => onChange(it.id)} aria-label={it.label} style={{
              padding: on ? '11px 12px' : '11px 0', borderRadius: 'var(--r-pill)', overflow: 'hidden',
              background: on ? 'var(--grad-primary)' : 'transparent',
              color: on ? 'var(--plum-deep)' : 'var(--on-plum-soft)',
              boxShadow: on ? '0 4px 12px oklch(0.63 0.18 30 / 0.40)' : 'none',
              transition: 'background .2s ease, color .2s ease, padding .2s ease',
            }}>
              <Icon name={it.icon} size={20} color={on ? 'var(--plum-deep)' : 'var(--on-plum-soft)'} stroke={2.2} />
              {on && <span style={{ fontSize: 13.5, fontWeight: 700, whiteSpace: 'nowrap' }}>{it.label}</span>}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

Object.assign(window, { Icon, ArousalIndicator, AROUSAL, entryMeta, TabSwitcher, BottomNav, Toast });
