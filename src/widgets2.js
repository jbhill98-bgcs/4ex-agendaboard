/* 4 Example Classroom Board — widgets part 2: math & games */
const isHex = c => /^#[0-9a-fA-F]{6}$/.test(c);

/* ===== Spinner ===== */
const SPIN_PAL = [['#E5484D', 'Red'], ['#3B82F6', 'Blue'], ['#F5C842', 'Yellow'], ['#30A46C', 'Green'], ['#8E4EC6', 'Purple'], ['#F76B15', 'Orange'], ['#E93D82', 'Pink'], ['#12A594', 'Teal']];
const lightC = c => ['#F5C842'].includes(c);
function spinOrder(p) {
  const secs = p.sections, out = [];
  if (!p.mixed) { secs.forEach(s => { for (let k = 0; k < s.n; k++) out.push(s); }); return out; }
  const left = secs.map(s => s.n); let more = true;
  while (more) { more = false; secs.forEach((s, i) => { if (left[i] > 0) { out.push(s); left[i]--; more = true; } }); }
  return out;
}
function spinPresets() { return LS.get('spinPresets', []) || []; }
function setSpinPresets(list) { const t = Date.now(); LS.set('spinPresets', list); LS.set('spinPresetsUpdated', t); Cloud.put('spinPresets', { list, updated: t }, 0); }
W.spinner = {
  title: 'Spinner', icon: 'spinner', size: [9, 12], min: [4, 5],
  defaults: () => ({ sections: [{ c: '#E5484D', name: 'Red', n: 3 }, { c: '#3B82F6', name: 'Blue', n: 2 }, { c: '#F5C842', name: 'Yellow', n: 1 }], mixed: true, labels: 'num', showTally: false, tally: {}, rot: 0, last: null }),
  clean(p) {
    p.sections = (Array.isArray(p.sections) ? p.sections : []).slice(0, 8).map(s => ({ c: isHex(s.c) ? s.c : '#3B82F6', name: safeStr(s.name, 24) || 'Color', n: clamp(Math.round(+s.n || 1), 1, 24) }));
    if (!p.sections.length) p.sections = W.spinner.defaults().sections;
    p.tally = (p.tally && typeof p.tally === 'object') ? p.tally : {}; p.rot = +p.rot || 0;
  },
  onDuplicate(p) { p.tally = {}; p.last = null; },
  mount(b, p, api) {
    const order = spinOrder(p), n = order.length, step = 360 / n;
    const stops = order.map((s, i) => s.c + ' ' + (i * step) + 'deg ' + ((i + 1) * step) + 'deg').join(',');
    const wheel = h('div', { style: { position: 'absolute', inset: '7%', borderRadius: '50%', background: 'conic-gradient(' + stops + ')', border: '0.6cqmin solid #fff', boxShadow: '0 1cqmin 3cqmin rgba(0,0,0,.45)', transform: 'rotate(' + p.rot + 'deg)', cursor: 'pointer' } });
    const labelEls = [];
    order.forEach((s, i) => {
      if (n > 1) wheel.appendChild(h('div', { style: { position: 'absolute', left: 'calc(50% - 1px)', top: 0, width: '2px', height: '50%', background: 'rgba(255,255,255,.85)', transformOrigin: '50% 100%', transform: 'rotate(' + (i * step) + 'deg)' } }));
      if (p.labels !== 'none') {
        const mid = (i + .5) * step, rad = mid * Math.PI / 180, r = p.labels === 'name' ? 33 : 37;
        const l = h('span', { style: { position: 'absolute', left: (50 + r * Math.sin(rad)) + '%', top: (50 - r * Math.cos(rad)) + '%', transform: 'translate(-50%,-50%) rotate(' + mid + 'deg)', fontWeight: 700, color: lightC(s.c) ? '#0B1F3A' : '#fff', whiteSpace: 'nowrap', pointerEvents: 'none' } }, p.labels === 'name' ? s.name : String(i + 1));
        labelEls.push(l); wheel.appendChild(l);
      }
    });
    const hub = h('div', { style: { position: 'absolute', left: '44%', top: '44%', width: '12%', height: '12%', borderRadius: '50%', background: '#0B1F3A', border: '0.6cqmin solid #fff', pointerEvents: 'none' } });
    const ptr = h('div', { style: { position: 'absolute', left: '50%', top: '0', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '4.5cqmin solid transparent', borderRight: '4.5cqmin solid transparent', borderTop: '8cqmin solid #fff', filter: 'drop-shadow(0 .5cqmin .6cqmin rgba(0,0,0,.5))', zIndex: 2 } });
    const ww = h('div', { style: { position: 'relative', flex: 'none' } }, wheel, hub, ptr);
    const res = h('div', { style: { display: 'flex', alignItems: 'center', gap: '.4em', fontWeight: 600, fontSize: cellFs(.6), minHeight: '1.3em' } });
    const spinB = btn('Spin', () => spin(), 'pri');
    const bottom = h('div', { class: 'ctl', style: { alignItems: 'center', gap: '4cqw', flexWrap: 'nowrap' } }, spinB, res);
    const tallyBox = h('div', { style: { width: '100%', padding: '0 5cqw', display: p.showTally ? 'flex' : 'none', flexDirection: 'column', gap: '.25em', fontSize: cellFs(.38) } });
    b.appendChild(h('div', { class: 'fill', style: { gap: '1.5cqh', padding: '1cqh 0 2.5cqh', justifyContent: 'space-between' } }, ww, bottom, tallyBox));
    wheel.addEventListener('click', e => { e.stopPropagation(); spin(); });
    let spinning = false;
    function showRes() {
      res.innerHTML = '';
      if (!p.last) { return; }
      const s = p.sections.find(x => x.c === p.last.c) || { c: p.last.c, name: p.last.name };
      res.append(h('span', { style: { width: '1em', height: '1em', borderRadius: '.25em', background: s.c, flex: 'none' } }), h('span', {}, s.name + (p.labels === 'num' && p.last.num ? ' · ' + p.last.num : '')));
    }
    function drawTally() {
      tallyBox.innerHTML = ''; if (!p.showTally) return;
      const max = Math.max(1, ...p.sections.map(s => p.tally[s.c] || 0));
      p.sections.forEach(s => { const v = p.tally[s.c] || 0; tallyBox.appendChild(h('div', { style: { display: 'flex', alignItems: 'center', gap: '.5em' } }, h('span', { style: { width: '4.5em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, s.name), h('div', { style: { flex: 1, height: '.8em', background: 'var(--track)', borderRadius: '.4em', overflow: 'hidden' } }, h('div', { style: { width: (100 * v / max) + '%', height: '100%', background: s.c, borderRadius: '.4em' } })), h('span', { style: { width: '2em', textAlign: 'right' } }, v))); });
    }
    function spin() {
      if (spinning || !n) return; spinning = true; spinB.disabled = true; Sound.unlock();
      const idx = Math.floor(Math.random() * n), c = (idx + .5) * step + (Math.random() - .5) * step * .6;
      const rot = Math.ceil(p.rot / 360) * 360 + 360 * 6 + (360 - c);
      wheel.style.transition = 'transform 4.2s cubic-bezier(.12,.75,.15,1)';
      requestAnimationFrame(() => { wheel.style.transform = 'rotate(' + rot + 'deg)'; });
      p.rot = rot; res.innerHTML = '';
      setTimeout(() => {
        spinning = false; spinB.disabled = false; wheel.style.transition = 'none';
        const s = order[idx]; p.last = { c: s.c, name: s.name, num: idx + 1 }; p.tally[s.c] = (p.tally[s.c] || 0) + 1;
        Sound.play('pop'); showRes(); drawTally(); api.save();
      }, 4300);
    }
    showRes(); drawTally();
    return {
      onResize() {
        const bw = b.clientWidth, bh = b.clientHeight; if (!bw) return;
        const used = bottom.offsetHeight + (p.showTally ? tallyBox.offsetHeight : 0) + bh * .06 + 10;
        const s = Math.max(60, Math.min(bw - 12, bh - used));
        ww.style.width = s + 'px'; ww.style.height = s + 'px';
        const k = p.labels === 'name' ? Math.min(.075, .9 / Math.max(...order.map(o => o.name.length), 3) * (n > 8 ? .5 : 1)) : (n > 16 ? .045 : n > 10 ? .055 : .075);
        labelEls.forEach(l => l.style.fontSize = (s * k) + 'px');
      }
    };
  },
  settings(f, p, ctx) {
    const total = () => p.sections.reduce((a, s) => a + s.n, 0);
    const changed = (keep) => { if (!keep) p.last = null; ctx.save(); ctx.remount(); };
    f.sec('Colors and spaces');
    p.sections.forEach((s, i) => {
      const cnt = h('span', { style: { width: '28px', textAlign: 'center', fontSize: '18px', fontWeight: 600 } }, s.n);
      const nameI = h('input', { class: 'inp', value: s.name, style: { flex: 1, minWidth: 0 }, 'aria-label': 'Label for this color' });
      nameI.addEventListener('input', () => { s.name = nameI.value.slice(0, 24); changed(true); });
      f.node(h('div', { class: 'item' },
        h('button', { 'aria-label': 'Change color', style: { width: '40px', height: '40px', borderRadius: '10px', border: '2px solid #fff', background: s.c, flex: 'none', padding: 0 }, onClick: () => {
          const used = p.sections.map(x => x.c); let j = SPIN_PAL.findIndex(q => q[0] === s.c);
          for (let k = 1; k <= SPIN_PAL.length; k++) { const q = SPIN_PAL[(j + k) % SPIN_PAL.length]; if (!used.includes(q[0])) { const wasDefault = SPIN_PAL.some(z => z[1] === s.name); s.c = q[0]; if (wasDefault) s.name = q[1]; changed(); ctx.rebuild(); return; } }
        } }),
        nameI,
        h('button', { class: 'b sm', 'aria-label': 'Fewer spaces', onClick: () => { if (s.n > 1) { s.n--; cnt.textContent = s.n; changed(); } } }, '−'), cnt,
        h('button', { class: 'b sm', 'aria-label': 'More spaces', onClick: () => { if (total() < 24) { s.n++; cnt.textContent = s.n; changed(); } else toast('24 spaces is the most'); } }, '+'),
        h('button', { class: 'b sm', 'aria-label': 'Remove color', style: { border: 0 }, onClick: () => { if (p.sections.length > 1) { p.sections.splice(i, 1); changed(); ctx.rebuild(); } } }, '×')));
    });
    f.buttons([['+ Add a color', () => { const used = p.sections.map(x => x.c); const q = SPIN_PAL.find(z => !used.includes(z[0])); if (!q) { toast('All 8 colors are in use'); return; } if (total() >= 24) { toast('24 spaces is the most'); return; } p.sections.push({ c: q[0], name: q[1], n: 1 }); changed(); ctx.rebuild(); }]]);
    f.note('Tap a swatch to change its color. Type in the box to rename it (A, B, C, or a word).');
    f.chips('Arrange the spaces', [[true, 'Mixed around the wheel'], [false, 'Grouped together']], () => p.mixed, v => p.mixed = v);
    f.chips('Labels on the spaces', [['num', 'Numbers'], ['name', 'Color names'], ['none', 'None']], () => p.labels, v => p.labels = v);
    f.toggle('Show a results tally under the spinner', () => p.showTally, v => p.showTally = v);
    f.buttons([['Reset the tally', () => { p.tally = {}; p.last = null; changed(); }]]);
    f.sec('Saved spinners');
    const list = spinPresets();
    if (!list.length) f.note('Save this spinner to reuse it in another lesson.');
    list.forEach((sp, i) => f.node(h('div', { class: 'item' }, h('div', { class: 'grow' }, h('div', { class: 'nm' }, sp.name), h('div', { class: 'sub' }, sp.sections.map(s => s.n + ' ' + s.name).join(', '))),
      h('button', { class: 'b', onClick: () => { p.sections = clone(sp.sections); p.mixed = sp.mixed !== false; p.labels = sp.labels || 'num'; p.tally = {}; p.last = null; changed(); ctx.rebuild(); } }, 'Load'),
      confirmBtn('Delete', () => { const l = spinPresets(); l.splice(i, 1); setSpinPresets(l); ctx.rebuild(); }))));
    const nm = h('input', { class: 'inp', placeholder: 'Name, e.g. 3 red 2 blue 1 yellow', style: { flex: 1 } });
    f.node(h('div', { class: 'row', style: { marginTop: '8px' } }, nm, h('button', { class: 'b pri', onClick: () => { const l = spinPresets(); l.push({ name: nm.value.trim() || p.sections.map(s => s.n + ' ' + s.name).join(', '), sections: clone(p.sections), mixed: p.mixed, labels: p.labels }); setSpinPresets(l.slice(-40)); toast('Spinner saved'); ctx.rebuild(); } }, 'Save')));
  }
};

/* ===== Dice ===== */
const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
W.dice = {
  title: 'Dice', icon: 'dice', size: [9, 6], min: [3, 3],
  defaults: () => ({ count: 2, sides: 6, sum: true, vals: [3, 5] }),
  clean(p) { p.count = clamp(Math.round(+p.count || 1), 1, 6); p.sides = [4, 6, 8, 10, 12, 20, 100].includes(+p.sides) ? +p.sides : 6; p.vals = (Array.isArray(p.vals) ? p.vals : []).map(v => clamp(+v || 1, 1, p.sides)); },
  mount(b, p, api) {
    const area = h('div', { style: { flex: 1, minHeight: 0, width: '100%', display: 'flex', flexWrap: 'wrap', alignContent: 'center', justifyContent: 'center', gap: '3cqmin', cursor: 'pointer' } });
    const sumEl = h('span', { style: { fontSize: cellFs(.6), fontWeight: 500 } });
    const rollB = btn('Roll', () => roll(), 'pri');
    b.appendChild(h('div', { class: 'fill', style: { padding: '1cqh 2cqw 3cqh', gap: '2cqh', justifyContent: 'stretch' } }, area, h('div', { class: 'ctl', style: { alignItems: 'center', gap: '4cqw' } }, rollB, sumEl)));
    area.addEventListener('click', e => { e.stopPropagation(); roll(); });
    while (p.vals.length < p.count) p.vals.push(1 + Math.floor(Math.random() * p.sides));
    let size = 60, rolling = false;
    function die(v) {
      if (p.sides === 6) {
        const d = h('div', { style: { width: size + 'px', height: size + 'px', background: '#fff', borderRadius: (size * .18) + 'px', display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gridTemplateRows: 'repeat(3,minmax(0,1fr))', padding: (size * .12) + 'px', boxShadow: '0 ' + (size * .07) + 'px 0 #9CC8FF' } });
        for (let k = 0; k < 9; k++) d.appendChild(h('span', { style: PIPS[v].includes(k) ? { width: (size * .18) + 'px', height: (size * .18) + 'px', borderRadius: '50%', background: '#0B1F3A', alignSelf: 'center', justifySelf: 'center' } : {} }));
        return d;
      }
      return h('div', { style: { width: size + 'px', height: size + 'px', background: 'var(--accent)', color: '#0B1F3A', borderRadius: (size * .18) + 'px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: (size * (v >= 100 ? .34 : .46)) + 'px', boxShadow: '0 ' + (size * .07) + 'px 0 #2F6FD6', lineHeight: 1 } }, v, h('span', { style: { fontSize: '.32em', fontWeight: 500, opacity: .75, marginTop: '.2em' } }, 'd' + p.sides));
    }
    function draw(vals) { area.innerHTML = ''; vals.slice(0, p.count).forEach(v => area.appendChild(die(v))); const s = vals.slice(0, p.count).reduce((a, x) => a + x, 0); sumEl.textContent = p.sum && p.count > 1 ? 'Sum: ' + s : ''; }
    function roll() {
      if (rolling) return; rolling = true; rollB.disabled = true; let k = 0; Sound.unlock();
      const r = () => Array.from({ length: p.count }, () => 1 + Math.floor(Math.random() * p.sides));
      const it = setInterval(() => { draw(r()); if (++k >= 9) { clearInterval(it); p.vals = r(); draw(p.vals); rolling = false; rollB.disabled = false; Sound.play('pop'); api.save(); } }, 65);
      api.cleanup(() => clearInterval(it));
    }
    draw(p.vals);
    return {
      onResize() {
        const w = area.clientWidth, hh = area.clientHeight; if (!w) return; let best = 30;
        for (let cols = 1; cols <= p.count; cols++) { const rows = Math.ceil(p.count / cols); const s = Math.min((w - 12 * (cols + 1)) / cols, (hh - 12 * (rows + 1)) / rows); best = Math.max(best, s); }
        const ns = Math.floor(Math.min(best * .9, 260)); if (Math.abs(ns - size) > 1) { size = ns; draw(p.vals); }
      }
    };
  },
  settings(f, p) {
    f.chips('How many dice', [1, 2, 3, 4, 5, 6].map(n => [n, String(n)]), () => p.count, v => { p.count = v; p.vals = []; });
    f.chips('Sides', [[4, 'd4'], [6, 'd6'], [8, 'd8'], [10, 'd10'], [12, 'd12'], [20, 'd20'], [100, 'd100']], () => p.sides, v => { p.sides = v; p.vals = []; });
    f.toggle('Show the sum', () => p.sum, v => p.sum = v);
  }
};

/* ===== Coin ===== */
W.coin = {
  title: 'Coin flip', icon: 'coin', size: [6, 7], min: [3, 4],
  defaults: () => ({ face: 'H', heads: 0, tails: 0, tally: true, rot: 0 }),
  onDuplicate(p) { p.heads = 0; p.tails = 0; },
  mount(b, p, api) {
    const face = (t, back) => h('div', { style: { position: 'absolute', inset: 0, borderRadius: '50%', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: back ? 'rotateY(180deg)' : 'none', background: back ? 'radial-gradient(circle at 35% 30%, #F3F6FA, #AEB9C7)' : 'radial-gradient(circle at 35% 30%, #FFE58A, #D9A52A)', border: '0.9cqmin solid ' + (back ? '#8E9AAB' : '#B8861C'), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: back ? '#3A4656' : '#5C4100', fontWeight: 700 } }, h('span', { style: { fontSize: '0.42em', lineHeight: 1 } }, t[0]), h('span', { style: { fontSize: '0.11em', letterSpacing: '.12em', marginTop: '.3em' } }, t));
    const coin = h('div', { style: { position: 'absolute', inset: 0, transformStyle: 'preserve-3d', WebkitTransformStyle: 'preserve-3d', transform: 'rotateY(' + p.rot + 'deg)' } }, face('HEADS'), face('TAILS', true));
    const holder = h('div', { style: { position: 'relative', perspective: '800px', flex: 'none', cursor: 'pointer' } }, coin);
    const tally = h('div', { style: { fontSize: cellFs(.48), display: p.tally ? '' : 'none', textAlign: 'center' } });
    const flipB = btn('Flip', () => flip(), 'pri');
    const ctl = h('div', { class: 'ctl', style: { alignItems: 'center' } }, flipB, editOnly(btn('Reset', () => { p.heads = 0; p.tails = 0; api.save(); drawT(); }, 'sm')));
    b.appendChild(h('div', { class: 'fill', style: { gap: '2.5cqh', padding: '2cqh 0 3cqh', justifyContent: 'space-between' } }, holder, tally, ctl));
    holder.addEventListener('click', e => { e.stopPropagation(); flip(); });
    const drawT = () => { tally.textContent = 'Heads ' + p.heads + '   ·   Tails ' + p.tails; };
    let busy = false;
    function flip() {
      if (busy) return; busy = true; flipB.disabled = true; Sound.unlock();
      const r = Math.random() < .5 ? 'H' : 'T';
      p.rot = p.rot + 1800 + (r !== p.face ? 180 : 0);
      coin.style.transition = 'transform 1.2s cubic-bezier(.25,.9,.3,1)'; coin.style.transform = 'rotateY(' + p.rot + 'deg)';
      setTimeout(() => { busy = false; flipB.disabled = false; p.face = r; if (r === 'H') p.heads++; else p.tails++; drawT(); Sound.play('ding'); api.save(); }, 1250);
    }
    drawT();
    return { onResize() { const s = Math.max(40, Math.min(b.clientWidth * .82, b.clientHeight - ctl.offsetHeight - (p.tally ? tally.offsetHeight : 0) - b.clientHeight * .12)); holder.style.width = s + 'px'; holder.style.height = s + 'px'; holder.style.fontSize = s + 'px'; } };
  },
  settings(f, p) { f.toggle('Show heads/tails tally', () => p.tally, v => p.tally = v); f.buttons([['Reset tally', () => { p.heads = 0; p.tails = 0; f.fire(); }]]); }
};

/* ===== Random number ===== */
W.random = {
  title: 'Random number', icon: 'hash', size: [7, 5], min: [3, 3], titleOf: p => 'Random ' + p.min + '–' + p.max,
  defaults: () => ({ min: 1, max: 30, noRepeat: false, used: [], val: null }),
  clean(p) { p.min = Math.round(+p.min || 0); p.max = Math.round(+p.max); if (!isFinite(p.max) || p.max <= p.min) p.max = p.min + 10; p.used = (Array.isArray(p.used) ? p.used : []).slice(0, 2000); },
  onDuplicate(p) { p.used = []; p.val = null; },
  mount(b, p, api) {
    const big = h('div', { class: 'big', style: { fontSize: fs(String(p.max).length > 3 ? 26 : 40, 52) } }, p.val == null ? '?' : p.val);
    const info = h('div', { class: 'muted', style: { fontSize: cellFs(.4), minHeight: '1.2em' } });
    const pickB = btn('Pick', () => pick(), 'pri');
    b.appendChild(h('div', { class: 'fill', style: { gap: '2cqh' } }, big, info, h('div', { class: 'ctl' }, pickB, p.noRepeat ? btn('Reset', () => { p.used = []; p.val = null; big.textContent = '?'; api.save(); drawI(); }, 'sm') : null)));
    const range = p.max - p.min + 1;
    const drawI = () => { info.textContent = p.noRepeat ? (range - p.used.length) + ' of ' + range + ' left' : p.min + ' to ' + p.max; };
    let busy = false;
    function pick() {
      if (busy) return;
      let pool = null;
      if (p.noRepeat) { if (range > 2000) { toast('No-repeat works for ranges up to 2,000 numbers'); return; } const u = new Set(p.used); pool = []; for (let v = p.min; v <= p.max; v++) if (!u.has(v)) pool.push(v); if (!pool.length) { toast('Every number has been picked. Tap Reset.'); return; } }
      const r = () => pool ? pool[Math.floor(Math.random() * pool.length)] : p.min + Math.floor(Math.random() * range);
      busy = true; pickB.disabled = true; let k = 0; Sound.unlock();
      const it = setInterval(() => { big.textContent = r(); if (++k >= 12) { clearInterval(it); p.val = r(); big.textContent = p.val; if (p.noRepeat) p.used.push(p.val); busy = false; pickB.disabled = false; Sound.play('pop'); api.save(); drawI(); } }, 55);
      api.cleanup(() => clearInterval(it));
    }
    drawI();
  },
  settings(f, p) {
    f.node(h('div', { class: 'row' },
      (() => { const i = h('input', { class: 'inp', type: 'number', value: String(p.min) }); i.addEventListener('input', () => { if (i.value === '') return; p.min = Math.round(+i.value); p.used = []; f.fire(); }); return h('label', { class: 'fld', style: { flex: 1 } }, 'From', i); })(),
      (() => { const i = h('input', { class: 'inp', type: 'number', value: String(p.max) }); i.addEventListener('input', () => { if (i.value === '') return; p.max = Math.round(+i.value); p.used = []; f.fire(); }); return h('label', { class: 'fld', style: { flex: 1 } }, 'To', i); })()));
    f.toggle('Don’t repeat numbers until all are used', () => p.noRepeat, v => { p.noRepeat = v; p.used = []; });
  }
};

/* ===== Class lists: name picker & group maker ===== */
function getLists() { return LS.get('lists', {}) || {}; }
function setLists(l) { if (!LS.set('lists', l)) toast('Couldn’t save the list on this device.'); }
const listNames = id => { const l = getLists()[id]; return l ? l.names.map(s => s.trim()).filter(Boolean) : null; };
const NAME_STATE = new Map(), GROUP_STATE = new Map();
function listSettings(f, p, ctx) {
  const lists = getLists();
  f.sec('Class list');
  const ids = Object.keys(lists);
  if (ids.length) f.chips(null, ids.map(id => [id, lists[id].name || 'Untitled']), () => p.list, v => { p.list = v; NAME_STATE.delete(ctx.w.id); GROUP_STATE.delete(ctx.w.id); ctx.rebuild(); });
  f.buttons([['+ New class list', () => { const l = getLists(); const id = 'L' + uid(); l[id] = { name: 'Class ' + (Object.keys(l).length + 1), names: [] }; setLists(l); p.list = id; ctx.save(); ctx.remount(); ctx.rebuild(); }]]);
  const cur = lists[p.list];
  if (cur) {
    const save = () => { const l = getLists(); l[p.list] = cur; setLists(l); NAME_STATE.delete(ctx.w.id); ctx.remount(); };
    f.text('List name', () => cur.name, v => { cur.name = v.slice(0, 40); save(); }, 'e.g. Period 3');
    f.area('Names (one per line)', () => cur.names.join('\n'), v => { cur.names = v.split('\n').map(s => s.slice(0, 40)).slice(0, 200); save(); }, 'Paste names here, one per line', 12);
    f.node(confirmBtn('Delete this list', () => { const l = getLists(); delete l[p.list]; setLists(l); p.list = null; ctx.save(); ctx.remount(); ctx.rebuild(); }));
  } else if (!ids.length) f.note('Make a class list, then paste student names, one per line. Every name picker and group maker on this device can use it.');
  f.note('Class lists stay on this device only. They aren’t synced, exported, or sent anywhere.');
}
W.names = {
  title: 'Name picker', icon: 'user', size: [9, 5], min: [4, 3], titleOf: p => { const l = getLists()[p.list]; return l ? 'Name picker · ' + l.name : 'Name picker'; },
  defaults: () => { const ids = Object.keys(getLists()); return { list: ids[0] || null, noRepeat: true }; },
  mount(b, p, api) {
    const names = listNames(p.list);
    if (!names || !names.length) {
      b.appendChild(h('div', { class: 'fill', style: { gap: '3cqh', textAlign: 'center', padding: '4cqmin' } }, h('div', { class: 'muted', style: { fontSize: fs(5, 9) } }, names ? 'This list has no names yet.' : 'Add a class list to start picking names.'), btn(names ? 'Add names' : 'Add a class list', () => api.openSettings(), 'pri')));
      return;
    }
    const st = NAME_STATE.get(api.w.id) || { picked: [], cur: '' }; NAME_STATE.set(api.w.id, st);
    const big = h('div', { style: { fontWeight: 600, textAlign: 'center', lineHeight: 1.1, padding: '0 4cqw' } });
    const info = h('div', { class: 'muted', style: { fontSize: cellFs(.4), minHeight: '1.2em' } });
    const pickB = btn('Pick a name', () => pick(), 'pri');
    b.appendChild(h('div', { class: 'fill', style: { gap: '2.5cqh' } }, big, info, h('div', { class: 'ctl' }, pickB, p.noRepeat ? btn('Start over', () => { st.picked = []; st.cur = ''; show(''); drawI(); }, 'sm') : null)));
    const show = v => { big.textContent = v || '?'; big.style.fontSize = fs(Math.min(30, 150 / Math.max(4, (v || '?').length)), 42); };
    const drawI = () => { info.textContent = p.noRepeat ? (names.length - st.picked.length) + ' of ' + names.length + ' left' : names.length + ' names'; };
    let busy = false;
    function pick() {
      if (busy) return;
      let pool = p.noRepeat ? names.filter(n => !st.picked.includes(n)) : names;
      if (!pool.length) { st.picked = []; pool = names; toast('Everyone has been picked, starting over'); }
      busy = true; pickB.disabled = true; let k = 0, delay = 50; Sound.unlock();
      const final = pool[Math.floor(Math.random() * pool.length)];
      const step = () => {
        if (k++ < 14) { show(names[Math.floor(Math.random() * names.length)]); Sound.play('tick'); delay *= 1.15; tm = setTimeout(step, delay); return; }
        st.cur = final; if (p.noRepeat) st.picked.push(final); show(final); drawI(); busy = false; pickB.disabled = false; Sound.play('ding');
      };
      let tm = setTimeout(step, delay); api.cleanup(() => clearTimeout(tm));
    }
    show(st.cur); drawI();
  },
  settings(f, p, ctx) { f.toggle('Don’t repeat until everyone is picked', () => p.noRepeat, v => { p.noRepeat = v; NAME_STATE.delete(ctx.w.id); }); listSettings(f, p, ctx); }
};
W.groups = {
  title: 'Group maker', icon: 'users', size: [14, 8], min: [6, 4], titleOf: p => { const l = getLists()[p.list]; return l ? 'Groups · ' + l.name : 'Group maker'; },
  defaults: () => { const ids = Object.keys(getLists()); return { list: ids[0] || null, mode: 'size', n: 4 }; },
  mount(b, p, api) {
    const names = listNames(p.list);
    if (!names || !names.length) {
      b.appendChild(h('div', { class: 'fill', style: { gap: '3cqh', textAlign: 'center', padding: '4cqmin' } }, h('div', { class: 'muted', style: { fontSize: fs(4, 8) } }, 'Add a class list to make groups.'), btn('Add a class list', () => api.openSettings(), 'pri')));
      return;
    }
    const grid = h('div', { style: { flex: 1, minHeight: 0, width: '100%', display: 'grid', gap: 'calc(var(--cell)*.2)', padding: '0 calc(var(--cell)*.3)', overflow: 'auto', alignContent: 'start' } });
    const desc = p.mode === 'size' ? 'Groups of ' + p.n : p.n + ' groups';
    b.appendChild(h('div', { class: 'fill', style: { justifyContent: 'stretch', gap: '1.5cqh', padding: '0 0 calc(var(--cell)*.3)' } }, grid, h('div', { class: 'ctl', style: { alignItems: 'center' } }, btn('Make groups', () => make(), 'pri'), h('span', { class: 'muted', style: { fontSize: '14px' } }, desc + ' · ' + names.length + ' students'))));
    function make() {
      const a = names.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
      const g = Math.max(1, p.mode === 'size' ? Math.round(a.length / Math.max(1, p.n)) || 1 : Math.min(p.n, a.length));
      const out = Array.from({ length: g }, () => []); a.forEach((n, i) => out[i % g].push(n));
      GROUP_STATE.set(api.w.id, out); Sound.play('pop'); draw();
    }
    function draw() {
      const gs = GROUP_STATE.get(api.w.id); grid.innerHTML = '';
      if (!gs) { grid.style.display = 'flex'; grid.style.alignItems = 'center'; grid.style.justifyContent = 'center'; return; }
      grid.style.display = 'grid'; const bw = b.clientWidth || 600, bh = b.clientHeight || 400;
      const cols = clamp(Math.round(Math.sqrt(gs.length * bw / bh * .8)), 1, gs.length);
      grid.style.gridTemplateColumns = 'repeat(' + cols + ',minmax(0,1fr))';
      gs.forEach((g, i) => grid.appendChild(h('div', { style: { background: 'var(--navy)', borderRadius: '12px', padding: '.4em .6em', fontSize: cellFs(.42), border: '1px solid rgba(156,200,255,.25)' } }, h('div', { style: { color: 'var(--accent2)', fontWeight: 600, marginBottom: '.2em' } }, 'Group ' + (i + 1)), g.map(n => h('div', { style: { lineHeight: 1.3 } }, n)))));
    }
    draw();
    return { onResize: draw };
  },
  settings(f, p, ctx) {
    f.chips('Make', [['size', 'Groups of a certain size'], ['count', 'A certain number of groups']], () => p.mode, v => p.mode = v);
    f.input(p.mode === 'size' ? 'Students per group' : 'Number of groups', 'number', () => p.n, v => p.n = clamp(Math.round(+v || 2), 1, 40), { min: 1, max: 40 });
    listSettings(f, p, ctx);
  }
};

/* ===== Scoreboard ===== */
const TEAM_COLORS = ['#5DA9FF', '#FF6B5E', '#3DDC84', '#F5C842', '#B18CFF', '#FF9F43'];
W.score = {
  title: 'Scoreboard', icon: 'trophy', size: [12, 6], min: [5, 3],
  defaults: () => ({ teams: [{ name: 'Team 1', score: 0, c: TEAM_COLORS[0] }, { name: 'Team 2', score: 0, c: TEAM_COLORS[1] }], step: 1 }),
  clean(p) { p.teams = (Array.isArray(p.teams) ? p.teams : []).slice(0, 6).map((t, i) => ({ name: safeStr(t.name, 30) || 'Team ' + (i + 1), score: Math.round(+t.score || 0), c: isHex(t.c) ? t.c : TEAM_COLORS[i % 6] })); if (p.teams.length < 2) p.teams = W.score.defaults().teams; p.step = [1, 2, 5, 10, 100].includes(+p.step) ? +p.step : 1; },
  onDuplicate(p) { p.teams.forEach(t => t.score = 0); },
  mount(b, p, api) {
    const n = p.teams.length;
    const row = h('div', { style: { position: 'absolute', inset: 0, display: 'flex', gap: '1.5cqw', padding: '1cqh 2cqw 3cqh' } });
    p.teams.forEach(t => {
      const sc = h('div', { class: 'big', style: { fontSize: fs(Math.min(26, 70 / n), 40), color: t.c } }, t.score);
      const ch = d => { t.score += d; sc.textContent = t.score; api.save(); Sound.play('tick'); };
      row.appendChild(h('div', { style: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,.04)', borderRadius: '2cqmin', borderTop: '0.8cqmin solid ' + t.c, padding: '1.5cqh 1cqw' } },
        h('div', { style: { fontSize: fs(Math.min(7, 22 / n), 11), fontWeight: 600, textAlign: 'center', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, t.name), sc,
        h('div', { class: 'ctl', style: { flexWrap: 'nowrap' } }, btn('−', () => ch(-p.step), 'sm', 'Subtract'), btn('+' + (p.step > 1 ? p.step : ''), () => ch(p.step), 'pri', 'Add'))));
    });
    b.appendChild(row);
  },
  settings(f, p, ctx) {
    f.chips('Number of teams', [2, 3, 4, 5, 6].map(n => [n, String(n)]), () => p.teams.length, v => { while (p.teams.length < v) p.teams.push({ name: 'Team ' + (p.teams.length + 1), score: 0, c: TEAM_COLORS[p.teams.length % 6] }); p.teams.length = v; ctx.rebuild(); });
    p.teams.forEach((t, i) => f.text('Team ' + (i + 1) + ' name', () => t.name, v => t.name = v.slice(0, 30)));
    f.chips('Points per tap', [[1, '1'], [2, '2'], [5, '5'], [10, '10'], [100, '100']], () => p.step, v => p.step = v);
    f.node(confirmBtn('Reset all scores to 0', () => { p.teams.forEach(t => t.score = 0); ctx.save(); ctx.remount(); }));
  }
};

/* ===== Question draw ===== */
function fmtQ(s) {
  const esc = String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return esc.replace(/sqrt\(/g, '√(').replace(/\^\{([^}]{1,20})\}/g, '<sup>$1</sup>').replace(/\^(-?[\w.]{1,10})/g, '<sup>$1</sup>').replace(/_\{([^}]{1,20})\}/g, '<sub>$1</sub>').replace(/\*/g, '×');
}
W.questions = {
  title: 'Question draw', icon: 'q', size: [13, 6], min: [5, 3],
  defaults: () => ({ text: '', shuffle: true, order: [], pos: -1, size: 1 }),
  clean(p) { p.text = safeStr(p.text, 20000); p.order = Array.isArray(p.order) ? p.order.map(Number) : []; p.pos = Math.round(+p.pos); if (!isFinite(p.pos)) p.pos = -1; },
  onDuplicate(p) { p.pos = -1; },
  mount(b, p, api) {
    const items = p.text.split('\n').map(s => s.trim()).filter(Boolean);
    if (!items.length) { b.appendChild(h('div', { class: 'fill', style: { gap: '3cqh', textAlign: 'center', padding: '4cqmin' } }, h('div', { class: 'muted', style: { fontSize: fs(4.5, 9) } }, 'Paste a list of questions or problems, one per line. The board shows them one at a time.'), btn('Add questions', () => api.openSettings(), 'pri'))); return; }
    if (p.order.length !== items.length || p.order.some(i => i >= items.length)) { reorder(); }
    function reorder() { p.order = items.map((_, i) => i); if (p.shuffle) for (let i = p.order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [p.order[i], p.order[j]] = [p.order[j], p.order[i]]; } p.pos = -1; }
    const head = h('div', { class: 'muted', style: { fontSize: cellFs(.38), letterSpacing: '.05em', textTransform: 'uppercase' } });
    const q = h('div', { class: 'qtext', style: { fontSize: 'calc(var(--cell) * .9 * var(--ts) * ' + (p.size || 1) + ')', fontWeight: 500, lineHeight: 1.3, textAlign: 'center', padding: '0 4cqw', overflow: 'auto', maxHeight: '100%' } });
    const back = btn('‹ Back', () => { if (p.pos > 0) { p.pos--; api.save(); draw(); } }, 'sm');
    const next = btn('Next ›', () => { if (p.pos < items.length - 1) { p.pos++; api.save(); draw(); Sound.play('pop'); } else toast('That was the last one. Tap Restart to go again.'); }, 'pri');
    b.appendChild(h('div', { class: 'fill', style: { justifyContent: 'space-between', padding: '1.5cqh 0 3cqh', gap: '2cqh' } }, head, h('div', { style: { flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' } }, q),
      h('div', { class: 'ctl' }, back, next, editOnly(btn('Restart', () => { reorder(); api.save(); draw(); }, 'sm')))));
    function draw() {
      back.disabled = p.pos <= 0;
      if (p.pos < 0) { head.textContent = items.length + ' questions' + (p.shuffle ? ' · shuffled' : ''); q.innerHTML = ''; q.appendChild(h('span', { class: 'muted' }, 'Ready')); return; }
      head.textContent = 'Question ' + (p.pos + 1) + ' of ' + items.length; q.innerHTML = fmtQ(items[p.order[p.pos]]);
    }
    draw();
  },
  settings(f, p) {
    f.area('Questions (one per line)', () => p.text, v => { p.text = v.slice(0, 20000); p.order = []; }, 'Solve 3x + 5 = 20\nWhat is 2^5?\nFind the slope through (1, 2) and (4, 8)', 14);
    f.note('Type ^ for exponents (x^2 → x²) and sqrt( for square roots.');
    f.toggle('Shuffle the order', () => p.shuffle, v => { p.shuffle = v; p.order = []; });
    f.chips('Text size', [['0.7', 'S'], ['1', 'M'], ['1.4', 'L'], ['1.9', 'XL']], () => String(p.size), v => p.size = +v);
  }
};

/* ===== Coordinate plane ===== */
function compileExpr(src) {
  const s = String(src).toLowerCase().replace(/\s+/g, '').replace(/[−–]/g, '-').replace(/[×·]/g, '*').replace(/÷/g, '/').replace(/π/g, 'pi');
  let i = 0;
  const FN = { sqrt: Math.sqrt, abs: Math.abs, sin: Math.sin, cos: Math.cos, tan: Math.tan };
  function primary() {
    const c = s[i];
    if (c === '(') { i++; const e = expr(); if (s[i] !== ')') throw 0; i++; return e; }
    if (c === '|') { i++; const e = expr(); if (s[i] !== '|') throw 0; i++; return x => Math.abs(e(x)); }
    const m = s.slice(i).match(/^(\d+\.?\d*|\.\d+)/); if (m) { i += m[0].length; const v = parseFloat(m[0]); return () => v; }
    for (const k in FN) if (s.startsWith(k, i)) { i += k.length; const a = primary(), F = FN[k]; return x => F(a(x)); }
    if (s.startsWith('pi', i)) { i += 2; return () => Math.PI; }
    if (c === 'x') { i++; return x => x; }
    throw 0;
  }
  function power() { const b = primary(); if (s[i] === '^') { i++; const e = unary(); return x => Math.pow(b(x), e(x)); } return b; }
  function unary() { if (s[i] === '-') { i++; const u = unary(); return x => -u(x); } if (s[i] === '+') { i++; return unary(); } return power(); }
  function term() {
    let a = unary();
    while (i < s.length) {
      const c = s[i];
      if (c === '*' || c === '/') { i++; const b2 = unary(), A = a; a = c === '*' ? x => A(x) * b2(x) : x => A(x) / b2(x); }
      else if (c === '(' || c === 'x' || /[\d.a-z]/.test(c)) { const b2 = power(), A = a; a = x => A(x) * b2(x); }
      else break;
    }
    return a;
  }
  function expr() { let a = term(); while (s[i] === '+' || s[i] === '-') { const c = s[i++], b2 = term(), A = a; a = c === '+' ? x => A(x) + b2(x) : x => A(x) - b2(x); } return a; }
  try { const e = expr(); return i === s.length ? e : null; } catch (er) { return null; }
}
function parseEq(line) {
  let s = line.trim(); if (!s) return null;
  const vx = s.match(/^x\s*=\s*(-?[\d.]+)$/i); if (vx) return { vx: parseFloat(vx[1]) };
  s = s.replace(/^(y|f\(x\))\s*=/i, '');
  const f = compileExpr(s); return f ? { f } : null;
}
const PLANE_COLORS = ['#5DA9FF', '#FF9F43', '#3DDC84', '#B18CFF', '#FF6B5E', '#F5C842'];
W.plane = {
  title: 'Coordinate plane', icon: 'plane', size: [11, 11], min: [5, 5],
  defaults: () => ({ xmin: -10, xmax: 10, ymin: -10, ymax: 10, step: 1, nums: true, coords: true, points: [], eqs: '', light: false }),
  clean(p) { ['xmin', 'xmax', 'ymin', 'ymax'].forEach(k => p[k] = clamp(+p[k] || 0, -1000, 1000)); if (p.xmax <= p.xmin) p.xmax = p.xmin + 10; if (p.ymax <= p.ymin) p.ymax = p.ymin + 10; p.step = clamp(+p.step || 1, .1, 100); p.points = (Array.isArray(p.points) ? p.points : []).slice(0, 60).map(q => ({ x: +q.x || 0, y: +q.y || 0, l: safeStr(q.l, 6) })); p.eqs = safeStr(p.eqs, 600); },
  mount(b, p, api) {
    let plot = false;
    const svgBox = h('div', { style: { position: 'absolute', inset: 0 } });
    const plotB = editOnly(h('button', { class: 'b sm', style: { position: 'absolute', left: '8px', bottom: '6px', zIndex: 2, background: 'rgba(6,18,31,.85)' }, onClick: e => { e.stopPropagation(); plot = !plot; plotB.classList.toggle('on', plot); plotB.textContent = plot ? 'Plotting: tap the grid' : 'Plot points'; } }, 'Plot points'));
    b.append(svgBox, plotB);
    if (p.light) api.el.style.background = '#FFFFFF';
    let geo = null;
    function draw() {
      const Wd = b.clientWidth, Hd = b.clientHeight; if (!Wd || !Hd) return;
      const xr = p.xmax - p.xmin, yr = p.ymax - p.ymin, pad = 10;
      const u = Math.min((Wd - 2 * pad) / xr, (Hd - 2 * pad) / yr);
      const x0 = (Wd - u * xr) / 2, y0 = (Hd - u * yr) / 2;
      const X = x => x0 + (x - p.xmin) * u, Y = y => y0 + (p.ymax - y) * u;
      geo = { X, Y, u, x0, y0 };
      const ink = p.light ? '#0B1F3A' : '#F2F6FC', grid = p.light ? '#D6E3F3' : 'rgba(156,200,255,.18)', gridM = p.light ? '#A9C2E3' : 'rgba(156,200,255,.32)';
      let g = '';
      const st = p.step, first = v => Math.ceil(v / st - 1e-9) * st;
      for (let x = first(p.xmin); x <= p.xmax + 1e-9; x += st) g += '<line x1="' + X(x) + '" y1="' + Y(p.ymin) + '" x2="' + X(x) + '" y2="' + Y(p.ymax) + '" stroke="' + (Math.round(x / st) % 5 === 0 ? gridM : grid) + '" stroke-width="1"/>';
      for (let y = first(p.ymin); y <= p.ymax + 1e-9; y += st) g += '<line x1="' + X(p.xmin) + '" y1="' + Y(y) + '" x2="' + X(p.xmax) + '" y2="' + Y(y) + '" stroke="' + (Math.round(y / st) % 5 === 0 ? gridM : grid) + '" stroke-width="1"/>';
      const ax = clamp(0, p.xmin, p.xmax), ay = clamp(0, p.ymin, p.ymax);
      g += '<line x1="' + X(p.xmin) + '" y1="' + Y(ay) + '" x2="' + X(p.xmax) + '" y2="' + Y(ay) + '" stroke="' + ink + '" stroke-width="2"/><line x1="' + X(ax) + '" y1="' + Y(p.ymin) + '" x2="' + X(ax) + '" y2="' + Y(p.ymax) + '" stroke="' + ink + '" stroke-width="2"/>';
      const fsz = clamp(u * st * .42, 9, 16);
      if (p.nums) {
        const k = Math.max(1, Math.ceil(22 / (u * st)));
        const lab = v => String(Math.round(v * 1000) / 1000).replace('-', '−');
        for (let x = first(p.xmin), j = 0; x <= p.xmax + 1e-9; x += st, j++) { if (Math.abs(x) < 1e-9 || Math.round(x / st) % k) continue; g += '<text x="' + X(x) + '" y="' + (Y(ay) + fsz + 3) + '" font-size="' + fsz + '" fill="' + ink + '" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" opacity=".8">' + lab(x) + '</text>'; }
        for (let y = first(p.ymin); y <= p.ymax + 1e-9; y += st) { if (Math.abs(y) < 1e-9 || Math.round(y / st) % k) continue; g += '<text x="' + (X(ax) - 5) + '" y="' + (Y(y) + fsz * .35) + '" font-size="' + fsz + '" fill="' + ink + '" text-anchor="end" font-family="Arial,Helvetica,sans-serif" opacity=".8">' + lab(y) + '</text>'; }
      }
      p.eqs.split('\n').forEach((line, i) => {
        const e = parseEq(line); if (!e) return; const col = PLANE_COLORS[i % PLANE_COLORS.length];
        if (e.vx != null) { g += '<line x1="' + X(e.vx) + '" y1="' + Y(p.ymin) + '" x2="' + X(e.vx) + '" y2="' + Y(p.ymax) + '" stroke="' + col + '" stroke-width="3"/>'; return; }
        let d = '', pen = false; const N = 600, lim = yr * 4;
        for (let k = 0; k <= N; k++) {
          const x = p.xmin + xr * k / N; let y; try { y = e.f(x); } catch (er) { y = NaN; }
          if (!isFinite(y) || y > p.ymax + lim || y < p.ymin - lim) { pen = false; continue; }
          const sx = X(x).toFixed(1), sy = Y(clamp(y, p.ymin - yr, p.ymax + yr)).toFixed(1);
          d += (pen ? 'L' : 'M') + sx + ' ' + sy; pen = true;
        }
        if (d) g += '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="3" stroke-linejoin="round" clip-path="url(#pc' + api.w.id + ')"/>';
      });
      const r = clamp(u * .18, 4, 9);
      p.points.forEach(q => {
        g += '<circle cx="' + X(q.x) + '" cy="' + Y(q.y) + '" r="' + r + '" fill="#F5C842" stroke="' + (p.light ? '#0B1F3A' : '#0B1F3A') + '" stroke-width="2"/>';
        const t = (q.l ? q.l + ' ' : '') + (p.coords ? '(' + q.x + ', ' + q.y + ')' : '');
        if (t) g += '<text x="' + (X(q.x) + r + 3) + '" y="' + (Y(q.y) - r - 2) + '" font-size="' + clamp(fsz * 1.15, 11, 20) + '" font-weight="600" fill="' + ink + '" font-family="Arial,Helvetica,sans-serif" paint-order="stroke" stroke="' + (p.light ? '#fff' : '#13294B') + '" stroke-width="4">' + t.replace(/-/g, '−').replace(/[<>&]/g, '') + '</text>';
      });
      svgBox.innerHTML = '<svg width="' + Wd + '" height="' + Hd + '" role="img" aria-label="Coordinate plane"><defs><clipPath id="pc' + api.w.id + '"><rect x="' + X(p.xmin) + '" y="' + Y(p.ymax) + '" width="' + (xr * u) + '" height="' + (yr * u) + '"/></clipPath></defs>' + g + '</svg>';
    }
    svgBox.addEventListener('click', e => {
      if (!plot || !geo) return; e.stopPropagation();
      const r = svgBox.getBoundingClientRect(); const st = p.step;
      const x = Math.round(((e.clientX - r.left - geo.x0) / geo.u + p.xmin) / st) * st, y = Math.round((p.ymax - (e.clientY - r.top - geo.y0) / geo.u) / st) * st;
      const rx = +x.toFixed(3), ry = +y.toFixed(3);
      if (rx < p.xmin || rx > p.xmax || ry < p.ymin || ry > p.ymax) return;
      const hit = p.points.findIndex(q => Math.abs(q.x - rx) < st / 2 && Math.abs(q.y - ry) < st / 2);
      if (hit >= 0) p.points.splice(hit, 1);
      else { const used = new Set(p.points.map(q => q.l)); let l = ''; for (let c = 65; c < 91; c++) if (!used.has(String.fromCharCode(c))) { l = String.fromCharCode(c); break; } p.points.push({ x: rx, y: ry, l }); }
      api.save(); draw();
    });
    requestAnimationFrame(draw);
    return { onResize: draw };
  },
  settings(f, p) {
    f.sec('Window');
    f.node(h('div', { class: 'row', style: { flexWrap: 'wrap' } }, ['xmin', 'xmax', 'ymin', 'ymax', 'step'].map(k => { const i = h('input', { class: 'inp', type: 'number', step: 'any', value: String(p[k]) }); i.addEventListener('change', () => { const v = parseFloat(i.value); if (isFinite(v)) { p[k] = v; W.plane.clean(p); f.fire(); } }); return h('label', { class: 'fld', style: { width: '30%', minWidth: '90px' } }, { xmin: 'x min', xmax: 'x max', ymin: 'y min', ymax: 'y max', step: 'Grid step' }[k], i); })));
    f.buttons([['−10 to 10', () => { Object.assign(p, { xmin: -10, xmax: 10, ymin: -10, ymax: 10, step: 1 }); f.fire(); }], ['First quadrant 0–10', () => { Object.assign(p, { xmin: 0, xmax: 10, ymin: 0, ymax: 10, step: 1 }); f.fire(); }], ['−5 to 5', () => { Object.assign(p, { xmin: -5, xmax: 5, ymin: -5, ymax: 5, step: 1 }); f.fire(); }]]);
    f.sec('Graph lines and curves');
    f.area('Equations (one per line)', () => p.eqs, v => p.eqs = v.slice(0, 600), 'y = 2x + 1\ny = -x + 7\nx = 3', 4);
    f.note('Use x as the variable: 2x + 1, -1/2x + 3, x^2 - 4, |x|, sqrt(x).');
    f.sec('Points');
    f.area('Points (one per line, like A (2, 3))', () => p.points.map(q => (q.l ? q.l + ' ' : '') + '(' + q.x + ', ' + q.y + ')').join('\n'), v => {
      p.points = v.split('\n').map(line => { const m = line.match(/^\s*([A-Za-z]\w{0,4})?\s*\(?\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)?/); return m ? { l: m[1] || '', x: +m[2], y: +m[3] } : null; }).filter(Boolean).slice(0, 60);
    }, 'A (2, 3)\nB (-4, 1)', 4);
    f.note('Or tap “Plot points” on the widget and tap the grid. Tap a point again to remove it.');
    f.toggle('Show axis numbers', () => p.nums, v => p.nums = v);
    f.toggle('Show coordinates next to points', () => p.coords, v => p.coords = v);
    f.toggle('White background', () => p.light, v => p.light = v);
  }
};

/* ===== Desmos & YouTube ===== */
function embedMount(b, p, api, kind) {
  const isD = kind === 'desmos';
  const parse = () => {
    const u = (p.url || '').trim();
    if (isD) { const m = u.match(/desmos\.com\/(calculator|geometry|3d|scientific|fourfunction|matrix)(?:\/([A-Za-z0-9]+))?/i); if (m) return { src: 'https://www.desmos.com/' + m[1].toLowerCase() + (m[2] ? '/' + m[2] : '') + '?embed', open: 'https://www.desmos.com/' + m[1].toLowerCase() + (m[2] ? '/' + m[2] : '') }; return u ? null : { src: 'https://www.desmos.com/calculator?embed', open: 'https://www.desmos.com/calculator' }; }
    const m = u.match(/(?:youtu\.be\/|v=|\/embed\/|\/shorts\/|\/live\/)([A-Za-z0-9_-]{11})/); return m ? { src: 'https://www.youtube-nocookie.com/embed/' + m[1] + '?rel=0&playsinline=1', open: 'https://www.youtube.com/watch?v=' + m[1] } : null;
  };
  const t = parse();
  const inp = h('input', { class: 'inp', placeholder: isD ? 'Paste a Desmos graph link (optional)' : 'Paste a YouTube link', value: p.url || '' });
  const setUrl = () => { p.url = inp.value.trim().slice(0, 500); api.save(); api.remount(); };
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') setUrl(); });
  const urlRow = editOnly(h('div', { class: 'row', style: { width: '100%' } }, inp, btn('Use', setUrl, 'pri')));
  if (!t || (!isD && !p.url)) {
    b.appendChild(h('div', { class: 'fill', style: { gap: '3cqh', padding: '5cqmin', textAlign: 'center' } }, h('div', { class: 'muted', style: { fontSize: '15px' } }, p.url ? 'That doesn’t look like a ' + (isD ? 'Desmos' : 'YouTube') + ' link.' : (isD ? 'Paste a link to a saved Desmos graph.' : 'Paste a YouTube link to play a video on the board.')), urlRow));
    return;
  }
  if (FRAMED) {
    b.appendChild(h('div', { class: 'fill', style: { gap: '2.5cqh', padding: '5cqmin', textAlign: 'center' } },
      h('div', { style: { fontSize: fs(6, 10), fontWeight: 600 } }, isD ? (p.url ? 'Desmos graph' : 'Desmos calculator') : 'YouTube video'),
      h('a', { href: t.open, target: '_blank', rel: 'noopener', class: 'b pri', style: { textDecoration: 'none' } }, 'Open ' + (isD ? 'in Desmos' : 'on YouTube'), icon('ext', 16)),
      h('div', { class: 'muted', style: { fontSize: '13px', lineHeight: 1.4, maxWidth: '520px' } }, (isD ? 'Desmos' : 'Videos') + ' can’t play inside the Claude page. Once the board runs on its own website, this plays right here on the board.'),
      urlRow));
    return;
  }
  const fr = h('iframe', { src: t.src, title: isD ? 'Desmos' : 'YouTube video', style: { position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0, background: '#fff' }, allow: isD ? 'fullscreen' : 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen', referrerpolicy: 'strict-origin-when-cross-origin' });
  b.appendChild(fr);
}
W.desmos = {
  title: 'Desmos', icon: 'graph', size: [15, 11], min: [6, 5],
  defaults: () => ({ url: '' }), clean(p) { p.url = safeStr(p.url, 500); },
  mount: (b, p, api) => embedMount(b, p, api, 'desmos'),
  settings(f, p) { f.text('Desmos link (leave blank for a blank graphing calculator)', () => p.url, v => p.url = v.trim().slice(0, 500), 'https://www.desmos.com/calculator/…'); f.note('In Desmos, tap Share › copy the link, then paste it here.'); }
};
W.youtube = {
  title: 'YouTube', label: 'YouTube video', icon: 'play', size: [14, 9], min: [5, 4],
  defaults: () => ({ url: '' }), clean(p) { p.url = safeStr(p.url, 500); },
  mount: (b, p, api) => embedMount(b, p, api, 'youtube'),
  settings(f, p) { f.text('YouTube link', () => p.url, v => p.url = v.trim().slice(0, 500), 'https://youtu.be/…'); }
};
