/* shopping.jsx — Kit: a weekly inventory of small buys. Owning kit unlocks games. */

function KitItem({ item, owned, onToggle }) {
  return (
    <button onClick={onToggle} className="kd-card" style={{
      padding: 15, display: 'flex', gap: 13, alignItems: 'flex-start', textAlign: 'left',
      width: '100%', border: 'none', cursor: 'pointer', font: 'inherit', color: 'inherit',
      background: owned ? 'oklch(0.585 0.075 168 / 0.07)' : 'var(--paper-card)',
      transition: 'background .2s ease',
    }}>
      <span style={{
        width: 26, height: 26, borderRadius: 9, flexShrink: 0, marginTop: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .18s ease',
        background: owned ? 'var(--walk)' : 'transparent',
        boxShadow: owned ? 'none' : 'inset 0 0 0 2px oklch(0.33 0.078 350 / 0.22)',
      }}>
        {owned && <Icon name="check" size={16} color="#fff" stroke={3} />}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
          <span className="kd-display" style={{ fontSize: 16 }}>{item.name}</span>
          {item.essential && (
            <span className="kd-chip" style={{ background: 'var(--high-tint)', color: 'var(--high)', padding: '2px 8px', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Essential</span>
          )}
          {owned && (
            <span className="kd-chip" style={{ background: 'var(--walk-tint)', color: 'var(--walk-deep)', padding: '2px 8px', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>In the kit</span>
          )}
        </span>
        <span style={{ display: 'block', fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.4, marginBottom: 7, textWrap: 'pretty' }}>{item.why}</span>
        {item.unlocks.length > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: owned ? 'var(--low)' : 'var(--ink-faint)' }}>
            <Icon name="sparkle" size={13} color={owned ? 'var(--low)' : 'var(--ink-faint)'} stroke={2.2} />
            {owned ? 'Unlocked' : 'Unlocks'} {item.unlocks.slice(0, 2).join(', ')}{item.unlocks.length > 2 ? ` +${item.unlocks.length - 2}` : ''}
          </span>
        )}
      </span>
    </button>
  );
}

function KitView({ items, owned, onToggle }) {
  const have = items.filter((i) => owned.has(i.name)).length;
  const toGet = items.length - have;
  const GROUPS = [
    { key: 'Enrichment', icon: 'paw', hint: 'games & training' },
    { key: 'Treats & food', icon: 'gift', hint: 'little surprises' },
    { key: 'Hygiene', icon: 'droplet', hint: 'keep him healthy' },
  ];

  const Section = ({ g }) => {
    const list = items.filter((i) => i.group === g.key);
    if (!list.length) return null;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 2px 0' }}>
          <Icon name={g.icon} size={15} color="var(--ink-faint)" stroke={2.1} />
          <span className="kd-eyebrow" style={{ color: 'var(--ink-soft)' }}>{g.key}</span>
          <span style={{ fontSize: 12, color: 'var(--ink-faint)', marginLeft: 'auto' }}>{g.hint}</span>
        </div>
        {list.map((it) => <KitItem key={it.name} item={it} owned={owned.has(it.name)} onToggle={() => onToggle(it.name)} />)}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* weekly framing */}
      <div className="kd-card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 46, height: 46, borderRadius: 14, background: 'var(--walk-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="cart" size={24} color="var(--walk)" stroke={2.1} />
        </div>
        <div style={{ flex: 1 }}>
          <div className="kd-display" style={{ fontSize: 16, marginBottom: 2 }}>This week’s kit</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>
            {toGet > 0 ? <><b style={{ color: 'var(--high)' }}>{toGet} to pick up</b> · {have} in the kit</> : 'Fully stocked — everything’s in play.'}
          </div>
        </div>
      </div>

      <div className="kd-card" style={{ padding: '12px 15px', display: 'flex', gap: 10, alignItems: 'flex-start', background: 'var(--plum-tint)' }}>
        <Icon name="sparkle" size={16} color="var(--plum)" stroke={2.2} />
        <span style={{ fontSize: 12.5, color: 'var(--plum-deep)', lineHeight: 1.45, textWrap: 'pretty' }}>
          Buy a few across the week — tick each off when it lands. Kenny’s days only pull in the games, treats and care you’ve got the kit for.
        </span>
      </div>

      {GROUPS.map((g) => <Section key={g.key} g={g} />)}
    </div>
  );
}

Object.assign(window, { KitView, ShoppingList: KitView });
