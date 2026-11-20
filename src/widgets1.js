/* 4 Example Classroom Board — widgets part 1: time & classroom */
const fs = (x, y) => 'calc(min(' + x + 'cqw, ' + y + 'cqh) * var(--ts))';
const cellFs = k => 'calc(var(--cell) * ' + k + ' * var(--ts))';
const editOnly = n => { n.classList.add('edit-only'); return n; };
function btn(label, fn, cls, aria) { return h('button', { class: 'b ' + (cls || ''), 'aria-label': aria || null, onClick: e => { e.stopPropagation(); fn(e); } }, label); }

/* ===== Clock ===== */
function analogSVG() {
  let t = '';
  for (let i = 0; i < 60; i++) { const a = i * 6, long = i % 5 === 0; t += '<line x1="100" y1="' + (long ? 14 : 12) + '" x2="100" y2="' + (long ? 28 : 19) + '" stroke="' + (long ? '#9CC8FF' : 'rgba(156,200,255,.45)') + '" stroke-width="' + (long ? 4 : 2) + '" stroke-linecap="round" transform="rotate(' + a + ' 100 100)"/>'; }
  let n = '';
  for (let i = 1; i <= 12; i++) { const a = i * Math.PI / 6; n += '<text x="' + (100 + 62 * Math.sin(a)).toFixed(1) + '" y="' + (100 - 62 * Math.cos(a) + 7).toFixed(1) + '" text-anchor="middle" font-size="20" font-weight="600" fill="#F2F6FC" font-family="Arial,Helvetica,sans-serif">' + i + '</text>'; }
  return '<svg viewBox="0 0 200 200" style="width:100%;height:100%" role="img" aria-label="Analog clock"><circle cx="100" cy="100" r="96" fill="#0B1F3A" stroke="#9CC8FF" stroke-width="4"/>' + t + n +
    '<line class="hh" x1="100" y1="100" x2="100" y2="52" stroke="#F2F6FC" stroke-width="9" stroke-linecap="round"/>' +
    '<line class="mh" x1="100" y1="100" x2="100" y2="30" stroke="#5DA9FF" stroke-width="6" stroke-linecap="round"/>' +
    '<line class="sh" x1="100" y1="114" x2="100" y2="24" stroke="#FF6B5E" stroke-width="2.5" stroke-linecap="round"/>' +
    '<circle cx="100" cy="100" r="7" fill="#F2F6FC"/></svg>';
}
W.clock = {
  title: 'Clock', icon: 'clock', size: [8, 4], min: [3, 2],
  defaults: () => ({ mode: 'digital', h24: false, sec: false }),
  mount(b, p, api) {
    const wrap = h('div', { class: 'fill', style: { flexDirection: 'row', gap: '4cqw', padding: '3cqmin' } });
    let face = null, dig = null, tEl = null, apEl = null;
    if (p.mode !== 'digital') { face = h('div', { style: { height: p.mode === 'both' ? 'min(92cqh, 46cqw)' : 'min(94cqh, 94cqw)', aspectRatio: '1', flex: 'none' }, html: analogSVG() }); wrap.appendChild(face); if (!p.sec) face.querySelector('.sh').style.display = 'none'; }
    if (p.mode !== 'analog') {
      const len = p.sec ? 8 : 5;
      const sz = p.mode === 'both' ? fs(len === 8 ? 10 : 15, 40) : fs(len === 8 ? 19 : 28, 72);
      tEl = h('span', { class: 'big' }); apEl = h('span', { style: { fontSize: '0.32em', color: 'var(--accent2)', fontWeight: 500, marginLeft: '.18em' } });
      dig = h('div', { style: { fontSize: sz, whiteSpace: 'nowrap', display: 'flex', alignItems: 'baseline' } }, tEl, apEl); wrap.appendChild(dig);
    }
    b.appendChild(wrap);
    const upd = now => {
      const H = now.getHours(), M = now.getMinutes(), S = now.getSeconds();
      if (tEl) { const hh = p.h24 ? pad2(H) : String((H + 11) % 12 + 1); tEl.textContent = hh + ':' + pad2(M) + (p.sec ? ':' + pad2(S) : ''); apEl.textContent = p.h24 ? '' : (H >= 12 ? 'PM' : 'AM'); }
      if (face) {
        face.querySelector('.hh').setAttribute('transform', 'rotate(' + ((H % 12) * 30 + M * .5) + ' 100 100)');
        face.querySelector('.mh').setAttribute('transform', 'rotate(' + (M * 6 + S * .1) + ' 100 100)');
        face.querySelector('.sh').setAttribute('transform', 'rotate(' + S * 6 + ' 100 100)');
      }
    };
    upd(new Date()); api.tick(upd);
  },
  settings(f, p) {
    f.chips('Style', [['digital', 'Digital'], ['analog', 'Analog'], ['both', 'Both']], () => p.mode, v => p.mode = v);
    f.toggle('Show seconds', () => p.sec, v => p.sec = v);
    f.toggle('24-hour time', () => p.h24, v => p.h24 = v);
  }
};

/* ===== Timer ===== */
const TIMER_COLORS = [['#5DA9FF', 'Blue'], ['#FF5A4E', 'Red'], ['#3DDC84', 'Green'], ['#F5C842', 'Yellow'], ['#B18CFF', 'Purple']];
W.timer = {
  title: 'Timer', icon: 'timer', size: [7, 8], min: [4, 4],
  titleOf: p => p.label ? 'Timer · ' + p.label : 'Timer',
  defaults: () => ({ dur: 300, left: 300, running: false, endAt: 0, label: '', style: 'pie', sound: 'chime', color: '#5DA9FF', done: false }),
  clean(p) { p.dur = clamp(+p.dur || 300, 1, 86400); p.left = clamp(+p.left || 0, 0, 86400); p.label = safeStr(p.label, 60); },
  onDuplicate(p) { p.running = false; p.left = p.dur; p.done = false; },
  mount(b, p, api) {
    const area = h('div', { style: { flex: 1, minHeight: 0, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', containerType: 'size' } });
    const ctl = h('div', { class: 'ctl', style: { padding: '0 2cqw 3cqh' } });
    const presets = editOnly(h('div', { class: 'ctl tpre', style: { padding: '0 2cqw 1.5cqh', flexWrap: 'nowrap' } }));
    const wrap = h('div', { class: 'fill', style: { justifyContent: 'stretch' } }, area, presets, ctl);
    b.appendChild(wrap);
    const rem = () => p.running ? Math.max(0, (p.endAt - Date.now()) / 1000) : p.left;
    let view = {};
    const timeTxt = h('span', { class: 'big' });
    timeTxt.addEventListener('click', () => { if (!p.running && !document.body.classList.contains('present')) api.openSettings(); });
    if (p.style === 'digital') {
      area.appendChild(h('div', { style: { fontSize: fs(p.dur >= 3600 ? 17 : 27, 75), cursor: 'pointer' } }, timeTxt));
    } else if (p.style === 'pie') {
      const pie = h('div', { style: { height: 'min(92cqh, 92cqw)', aspectRatio: '1', borderRadius: '50%', position: 'relative', boxShadow: 'inset 0 0 0 3px rgba(255,255,255,.12)' } });
      const center = h('div', { style: { position: 'absolute', inset: '22%', borderRadius: '50%', background: 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: fs(15, 15), cursor: 'pointer' } }, timeTxt);
      pie.appendChild(center); area.appendChild(pie); view.pie = pie; view.center = center;
    } else if (p.style === 'bar') {
      const fillEl = h('div', { style: { height: '100%', borderRadius: '999px', transition: 'width .25s linear' } });
      const bar = h('div', { style: { width: '100%', height: 'min(22cqh, 12cqw)', background: 'var(--track)', borderRadius: '999px', overflow: 'hidden' } }, fillEl);
      area.appendChild(h('div', { style: { width: '100%', padding: '0 5cqw', display: 'flex', flexDirection: 'column', gap: '4cqh' } }, h('div', { style: { fontSize: fs(22, 45), cursor: 'pointer' } }, timeTxt), bar));
      view.fill = fillEl;
    } else {
      const svg = h('div', { style: { height: 'min(94cqh, 62cqw)', aspectRatio: '120/180', flex: 'none' }, html: '<svg viewBox="0 0 120 180" style="width:100%;height:100%" role="img" aria-label="Hourglass timer"><defs><clipPath id="hgT' + api.w.id + '"><path d="M14 12h92c0 34-36 50-44 76h-4C50 62 14 46 14 12z"/></clipPath><clipPath id="hgB' + api.w.id + '"><path d="M58 92h4c8 26 44 42 44 76H14c0-34 36-50 44-76z"/></clipPath></defs>' +
        '<rect class="st" x="0" y="0" width="120" height="0" fill="#F2C94C" clip-path="url(#hgT' + api.w.id + ')"/><rect class="sb" x="0" y="168" width="120" height="0" fill="#F2C94C" clip-path="url(#hgB' + api.w.id + ')"/>' +
        '<rect class="stream" x="58.8" y="88" width="2.4" height="78" fill="#F2C94C"/>' +
        '<path d="M14 12h92c0 34-36 50-44 78 8 28 44 44 44 78H14c0-34 36-50 44-78C50 62 14 46 14 12z" fill="rgba(255,255,255,.06)" stroke="#9CC8FF" stroke-width="3"/>' +
        '<rect x="6" y="4" width="108" height="10" rx="4" fill="#9CC8FF"/><rect x="6" y="166" width="108" height="10" rx="4" fill="#9CC8FF"/></svg>' });
      area.style.gap = '4cqw';
      area.append(svg, h('div', { style: { fontSize: fs(13, 30), cursor: 'pointer' } }, timeTxt));
      view.hg = svg;
    }
    const doneMsg = h('div', { style: { position: 'absolute', inset: 0, display: 'none', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '2cqh', background: '#C93A30', fontWeight: 700, fontSize: fs(16, 24), textAlign: 'center' } }, 'Time’s up!', h('span', { style: { fontSize: '.45em', fontWeight: 500 } }, p.label || ''));
    area.appendChild(doneMsg);
    const startBtn = btn('Start', () => toggle(), 'pri');
    const resetBtn = btn('Reset', () => reset());
    ctl.append(startBtn, resetBtn, btn('+1 min', () => addMin()));
    [[60, '1m'], [180, '3m'], [300, '5m'], [600, '10m']].forEach(x => presets.appendChild(btn(x[1], () => { p.dur = x[0]; p.left = x[0]; p.running = false; p.done = false; api.save(); draw(); }, 'sm')));
    function toggle() {
      if (p.done) { reset(); return; }
      if (p.running) { p.left = rem(); p.running = false; }
      else { if (p.left <= 0) p.left = p.dur; p.endAt = Date.now() + p.left * 1000; p.running = true; Sound.unlock(); }
      api.save(); draw();
    }
    function reset() { p.running = false; p.left = p.dur; p.done = false; api.save(); draw(); }
    function addMin() { if (p.done) { p.done = false; p.left = 60; p.dur = Math.max(p.dur, 60); p.endAt = Date.now() + 60000; p.running = true; } else if (p.running) p.endAt += 60000; else p.left += 60; if (p.running || p.left > p.dur) p.dur = Math.max(p.dur, Math.ceil(rem())); api.save(); draw(); }
    function draw() {
      const r = rem(), fr = p.dur ? clamp(r / p.dur, 0, 1) : 0;
      timeTxt.textContent = fmtTime(r);
      startBtn.textContent = p.done ? 'Reset' : p.running ? 'Pause' : (p.left < p.dur && p.left > 0 ? 'Resume' : 'Start');
      presets.style.display = p.running || p.done ? 'none' : '';
      resetBtn.style.display = p.done ? 'none' : '';
      const col = p.color || '#5DA9FF';
      if (view.pie) view.pie.style.background = 'conic-gradient(' + col + ' 0deg ' + (fr * 360) + 'deg, var(--track) ' + (fr * 360) + 'deg 360deg)';
      if (view.fill) { view.fill.style.width = (fr * 100) + '%'; view.fill.style.background = p.color && p.color !== '#5DA9FF' ? p.color : (fr > .5 ? '#5DA9FF' : fr > .2 ? '#F5C842' : '#FF5A4E'); }
      if (view.hg) {
        const top = Math.sqrt(fr) * 74, bot = Math.pow(1 - fr, .75) * 70;
        const st = view.hg.querySelector('.st'), sb = view.hg.querySelector('.sb'), sm = view.hg.querySelector('.stream');
        st.setAttribute('y', 88 - top); st.setAttribute('height', top);
        sb.setAttribute('y', 168 - bot); sb.setAttribute('height', bot);
        sm.style.display = p.running && fr > 0 ? '' : 'none';
      }
      doneMsg.style.display = p.done ? 'flex' : 'none';
      doneMsg.classList.toggle('flash', !!p.done);
    }
    api.tick(() => {
      if (p.running && rem() <= 0) { p.running = false; p.left = 0; p.done = true; api.save(); Sound.play(p.sound); }
      draw();
    });
    if (p.running && rem() <= 0) { p.running = false; p.left = 0; p.done = true; }
    draw();
  },
  settings(f, p) {
    const m = Math.floor(p.dur / 60), s = p.dur % 60;
    let mm = m, ss = s;
    const setDur = () => { p.dur = clamp(mm * 60 + ss, 1, 86400); p.left = p.dur; p.running = false; p.done = false; };
    f.text('Label (optional)', () => p.label, v => p.label = v.slice(0, 60), 'e.g. Work time');
    f.node(h('div', { class: 'row' },
      (() => { const i = h('input', { class: 'inp', type: 'number', min: '0', max: '600', value: String(m), 'aria-label': 'Minutes' }); i.addEventListener('input', () => { mm = clamp(parseInt(i.value) || 0, 0, 600); setDur(); f.fire(); }); return h('label', { class: 'fld', style: { flex: 1 } }, 'Minutes', i); })(),
      (() => { const i = h('input', { class: 'inp', type: 'number', min: '0', max: '59', value: String(s), 'aria-label': 'Seconds' }); i.addEventListener('input', () => { ss = clamp(parseInt(i.value) || 0, 0, 59); setDur(); f.fire(); }); return h('label', { class: 'fld', style: { flex: 1 } }, 'Seconds', i); })()));
    f.chips('Style', [['digital', 'Digital'], ['pie', 'Pie'], ['bar', 'Progress bar'], ['hourglass', 'Hourglass']], () => p.style, v => p.style = v);
    f.chips('Color', TIMER_COLORS, () => p.color, v => p.color = v);
    f.chips('Sound at zero', SOUND_OPTS, () => p.sound, v => { p.sound = v; Sound.play(v); });
    f.note('Tip: tap the time on the timer to open these settings. The preset buttons (1m, 3m, 5m…) are on the widget itself.');
  }
};

/* ===== Stopwatch ===== */
W.stopwatch = {
  title: 'Stopwatch', icon: 'stopwatch', size: [8, 5], min: [4, 3],
  defaults: () => ({ running: false, start: 0, acc: 0, laps: [] }),
  onDuplicate(p) { p.running = false; p.acc = 0; p.laps = []; },
  mount(b, p, api) {
    const el = () => (p.running ? Date.now() - p.start : 0) + p.acc;
    const f = ms => { const t = Math.floor(ms / 100), s = Math.floor(t / 10); return (s >= 3600 ? Math.floor(s / 3600) + ':' + pad2(Math.floor(s % 3600 / 60)) : Math.floor(s / 60)) + ':' + pad2(s % 60) + '.' + (t % 10); };
    const tEl = h('div', { class: 'big', style: { fontSize: fs(19, 42) } });
    const laps = h('div', { class: 'muted', style: { fontSize: fs(5, 8), minHeight: '1.2em' } });
    const sb = btn('Start', () => { if (p.running) { p.acc = el(); p.running = false; } else { p.start = Date.now(); p.running = true; } api.save(); draw(); }, 'pri');
    b.appendChild(h('div', { class: 'fill', style: { gap: '4cqh' } }, tEl, laps, h('div', { class: 'ctl' }, sb,
      btn('Lap', () => { if (!p.running) return; p.laps = [el()].concat(p.laps).slice(0, 5); api.save(); draw(); }),
      btn('Reset', () => { p.running = false; p.acc = 0; p.laps = []; api.save(); draw(); }))));
    function draw() { tEl.textContent = f(el()); sb.textContent = p.running ? 'Stop' : (p.acc ? 'Resume' : 'Start'); laps.textContent = p.laps.length ? p.laps.slice(0, 3).map((l, i) => 'Lap ' + (p.laps.length - i) + ': ' + f(l)).join('   ·   ') : ''; }
    draw(); api.tick(draw);
  }
};

/* ===== Date & calendar ===== */
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
function dateMount(b, p, api) {
  let off = 0, lastDay = '';
  const root = h('div', { class: 'fill' }); b.appendChild(root);
  function draw() {
    const now = new Date(); lastDay = todayKey(now); root.innerHTML = '';
    if (p.view !== 'month') {
      root.style.alignItems = 'flex-start'; root.style.padding = '0 6cqw'; root.style.gap = '2cqh';
      root.append(h('div', { style: { fontSize: fs(9, 22), color: 'var(--accent2)', fontWeight: 500 } }, DAYS[now.getDay()]),
        h('div', { style: { fontSize: fs(p.year ? 8.2 : 11, 34), fontWeight: 600, lineHeight: 1.05 } }, MONTHS[now.getMonth()] + ' ' + now.getDate() + (p.year ? ', ' + now.getFullYear() : '')));
      return;
    }
    root.style.alignItems = 'stretch'; root.style.padding = '1cqh 3cqw 3cqh'; root.style.justifyContent = 'flex-start'; root.style.gap = '1.5cqh';
    const m = new Date(now.getFullYear(), now.getMonth() + off, 1);
    const head = h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' } },
      h('div', { style: { fontSize: fs(7, 8), fontWeight: 600 } }, MONTHS[m.getMonth()] + ' ' + m.getFullYear()),
      h('div', { class: 'ctl', style: { flexWrap: 'nowrap' } }, btn('‹', () => { off--; draw(); }, 'sm', 'Previous month'), off ? btn('Today', () => { off = 0; draw(); }, 'sm') : null, btn('›', () => { off++; draw(); }, 'sm', 'Next month')));
    const g = h('div', { style: { flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))', gridAutoRows: '1fr', gap: '0.6cqmin', fontSize: fs(4.6, 5.5) } });
    ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach(d => g.appendChild(h('div', { class: 'muted', style: { textAlign: 'center', alignSelf: 'center', fontSize: '.8em' } }, d)));
    for (let i = 0; i < m.getDay(); i++) g.appendChild(h('div'));
    const days = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= days; d++) {
      const isT = off === 0 && d === now.getDate(), we = [0, 6].includes(new Date(m.getFullYear(), m.getMonth(), d).getDay());
      g.appendChild(h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '1.2cqmin', fontWeight: isT ? 700 : 400, background: isT ? 'var(--accent)' : 'transparent', color: isT ? 'var(--navy)' : (we ? 'var(--muted)' : 'var(--text)') } }, d));
    }
    root.append(head, g);
  }
  draw(); api.tick(now => { if (todayKey(now) !== lastDay) draw(); });
}
W.date = {
  title: 'Date', icon: 'cal', size: [9, 4], min: [4, 2], titleOf: p => p.view === 'month' ? 'Calendar' : 'Today',
  defaults: () => ({ view: 'today', year: true }), mount: dateMount,
  settings(f, p) { f.chips('Show', [['today', 'Today’s date'], ['month', 'Month calendar']], () => p.view, v => p.view = v); f.toggle('Include the year', () => p.year, v => p.year = v); }
};
W.calendar = Object.assign({}, W.date, { title: 'Calendar', label: 'Month calendar', size: [9, 9], min: [5, 5], defaults: () => ({ view: 'month', year: true }) });

/* ===== Days-until countdown ===== */
W.countdown = {
  title: 'Countdown', label: 'Days until…', icon: 'flag', size: [7, 5], min: [4, 3], titleOf: p => p.label ? 'Countdown · ' + p.label : 'Countdown',
  defaults: () => { const d = new Date(); d.setDate(d.getDate() + 14); return { label: 'Test day', date: todayKey(d), school: false }; },
  clean(p) { p.label = safeStr(p.label, 60); p.date = /^\d{4}-\d{2}-\d{2}$/.test(p.date) ? p.date : ''; },
  mount(b, p, api) {
    const root = h('div', { class: 'fill', style: { gap: '2cqh', textAlign: 'center', padding: '0 4cqw' } }); b.appendChild(root);
    let last = '';
    function draw() {
      last = todayKey(); root.innerHTML = '';
      if (!p.date) { root.append(h('div', { class: 'muted', style: { fontSize: fs(7, 12) } }, 'Tap ⚙ to pick a date')); return; }
      const [Y, M, D] = p.date.split('-').map(Number), target = new Date(Y, M - 1, D), now = new Date(); now.setHours(0, 0, 0, 0);
      let n = Math.round((target - now) / 864e5);
      if (p.school && n > 0) { let c = 0; const d = new Date(now); for (let i = 0; i < n; i++) { d.setDate(d.getDate() + 1); if (d.getDay() % 6 !== 0) c++; } n = c; }
      const big = n > 0 ? String(n) : n === 0 ? 'Today!' : 'Done';
      root.append(h('div', { class: 'big', style: { fontSize: fs(n > 0 ? (n > 99 ? 24 : 34) : 18, 48) } }, big),
        h('div', { style: { fontSize: fs(6.5, 12), color: 'var(--accent2)', fontWeight: 500 } }, n > 0 ? (p.school ? (n === 1 ? 'school day' : 'school days') : (n === 1 ? 'day' : 'days')) + ' until ' + (p.label || 'the big day') : (p.label || '')));
    }
    draw(); api.tick(() => { if (todayKey() !== last) draw(); });
  },
  settings(f, p) {
    f.text('What are you counting down to?', () => p.label, v => p.label = v.slice(0, 60), 'e.g. Winter break');
    f.input('Date', 'date', () => p.date, v => p.date = v);
    f.toggle('Count school days only (skip weekends)', () => p.school, v => p.school = v);
  }
};

/* ===== Period countdown ===== */
function parseSched(txt) {
  const out = [];
  String(txt || '').split('\n').forEach(line => {
    const parts = line.split(/,|\t| - | to /).map(s => s.trim()).filter(Boolean);
    if (parts.length < 3) return;
    const t = s => { const m = s.match(/^(\d{1,2}):(\d{2})\s*([ap]\.?m?\.?)?$/i); if (!m) return null; let H = +m[1]; const ap = m[3] && m[3][0].toLowerCase(); if (ap === 'p' && H < 12) H += 12; if (ap === 'a' && H === 12) H = 0; if (!ap && H < 6) H += 12; return H * 60 + +m[2]; };
    const a = t(parts[1]), b = t(parts[2]); if (a == null || b == null || b <= a) return;
    out.push({ name: parts[0].slice(0, 40), a, b });
  });
  return out.sort((x, y) => x.a - y.a);
}
const minTo12 = m => { const H = Math.floor(m / 60), M = m % 60; return ((H + 11) % 12 + 1) + ':' + pad2(M); };
W.period = {
  title: 'Period countdown', label: 'Period countdown', icon: 'period', size: [10, 5], min: [5, 3],
  defaults: () => ({ sched: 'Period 1, 7:45, 8:35\nPeriod 2, 8:40, 9:30\nPeriod 3, 9:35, 10:25\nPeriod 4, 10:30, 11:20\nLunch, 11:25, 11:55\nPeriod 5, 12:00, 12:50\nPeriod 6, 12:55, 1:45\nPeriod 7, 1:50, 2:40', weekends: false }),
  clean(p) { p.sched = safeStr(p.sched, 3000); },
  mount(b, p, api) {
    const nameEl = h('div', { style: { fontSize: fs(9, 13), color: 'var(--accent2)', fontWeight: 500 } });
    const big = h('div', { class: 'big', style: { fontSize: fs(16, 34) } });
    const barF = h('div', { style: { height: '100%', background: 'var(--accent)', borderRadius: '999px' } });
    const bar = h('div', { style: { width: '100%', height: 'min(5cqh,3cqw)', minHeight: '6px', background: 'var(--track)', borderRadius: '999px', overflow: 'hidden' } }, barF);
    const next = h('div', { class: 'muted', style: { fontSize: fs(6.5, 9) } });
    b.appendChild(h('div', { class: 'fill', style: { alignItems: 'stretch', padding: '0 5cqw', gap: '2.5cqh' } }, nameEl, big, bar, next));
    let lastS = -1;
    function draw(now) {
      const s = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds(); if (s === lastS) return; lastS = s;
      const list = parseSched(p.sched), m = s / 60;
      const wk = now.getDay() % 6 === 0 && !p.weekends;
      const cur = wk ? null : list.find(x => m >= x.a && m < x.b), nx = wk ? null : list.find(x => x.a > m);
      if (!list.length) { nameEl.textContent = 'Add your bell schedule'; big.textContent = '—'; next.textContent = 'Tap ⚙ to enter periods and times.'; bar.style.display = 'none'; return; }
      bar.style.display = cur ? '' : 'none';
      if (cur) {
        const left = cur.b * 60 - s; nameEl.textContent = cur.name; big.textContent = left >= 600 ? Math.ceil(left / 60) + ' min left' : fmtTime(left) + ' left';
        barF.style.width = (100 * (1 - (s - cur.a * 60) / ((cur.b - cur.a) * 60))) + '%';
        next.textContent = nx ? 'Next: ' + nx.name + ' at ' + minTo12(nx.a) : 'Last period of the day';
      } else if (nx) {
        const until = nx.a * 60 - s; nameEl.textContent = list.some(x => x.b <= m) ? 'Passing time' : 'Before school';
        big.textContent = until >= 600 ? Math.ceil(until / 60) + ' min' : fmtTime(until); next.textContent = nx.name + ' starts at ' + minTo12(nx.a);
      } else { nameEl.textContent = wk ? 'Weekend' : 'School day is over'; big.textContent = '—'; next.textContent = list.length ? 'Tomorrow: ' + list[0].name + ' at ' + minTo12(list[0].a) : ''; }
    }
    draw(new Date()); api.tick(draw);
  },
  settings(f, p) {
    f.area('Bell schedule: one period per line as “Name, start, end”', () => p.sched, v => p.sched = v, 'Period 1, 7:45, 8:35', 10);
    f.note('Times without AM/PM before 6:00 are read as afternoon (1:45 = 1:45 PM). You can also write “1:45 PM”.');
    f.toggle('Run on weekends too', () => p.weekends, v => p.weekends = v);
  }
};

/* ===== Text box & sticky note ===== */
const SYMS = ['≤', '≥', '≠', '≈', '±', '×', '÷', '·', 'π', '°', '√', '∛', '∠', '△', '⊥', '∥', '≅', '∼', '∞', '½', '¾', '⅓', '→', '∈'];
const TEXT_SIZES = [['0.7', 'S'], ['1', 'M'], ['1.4', 'L'], ['2', 'XL'], ['2.8', 'XXL'], ['4', 'Huge']];
function textMount(b, p, api, kind) {
  const txt = h('div', { class: 'txt', contenteditable: 'true', spellcheck: 'false', 'data-ph': kind === 'sticky' ? 'Type a note…' : 'Type here…', role: 'textbox', 'aria-multiline': 'true' });
  txt.innerHTML = cleanHTML(p.html);
  txt.style.setProperty('--fs', p.size || 1); txt.style.textAlign = p.align || 'left'; let tc = p.color || (kind === 'sticky' ? '#1F1A00' : '#F2F6FC');
  if (kind !== 'sticky' && api.w.card) { if (isLight(api.w.card) && isLight(tc)) tc = '#0B1F3A'; if (!isLight(api.w.card) && !isLight(tc)) tc = '#F2F6FC'; }
  txt.style.color = tc;
  if (p.bold) txt.style.fontWeight = '600';
  const el = api.el;
  if (kind === 'sticky') { el.style.background = p.bg || '#FFE58A'; el.style.borderColor = 'rgba(0,0,0,.12)'; }
  else if (p.bg === 'clear') el.classList.add('clear');
  else if (p.bg && p.bg !== 'card') { el.style.background = p.bg; el.style.borderColor = 'rgba(0,0,0,.12)'; }
  const bar = h('div', { class: 'txt-bar' });
  const cmd = (c, v) => { try { document.execCommand(c, false, v); } catch (e) { } save(); };
  const ins = html => { txt.focus(); cmd('insertHTML', html); };
  const symPop = h('div', { class: 'sym-pop', style: { display: 'none' } }, SYMS.map(s => h('button', { onClick: () => { ins(s); symPop.style.display = 'none'; } }, s)));
  bar.append(
    h('button', { 'aria-label': 'Bold', style: { fontWeight: 700 }, onClick: () => cmd('bold') }, 'B'),
    h('button', { 'aria-label': 'Exponent', onClick: () => cmd('superscript'), html: 'x<sup>2</sup>' }),
    h('button', { 'aria-label': 'Fraction', onClick: () => { ins('<span class="frac" contenteditable="false"><span class="num" contenteditable="true">a</span><span class="den" contenteditable="true">b</span></span>&#8203;'); focusLast('.frac .num'); } }, 'a/b'),
    h('button', { 'aria-label': 'Square root', onClick: () => { ins('<span class="sqrt" contenteditable="false">√<span class="rad" contenteditable="true">x</span></span>&#8203;'); focusLast('.sqrt .rad'); } }, '√x'),
    h('button', { 'aria-label': 'Math symbols', onClick: () => { symPop.style.display = symPop.style.display === 'none' ? 'grid' : 'none'; } }, 'π ≤ °'),
    h('span', { class: 'sepv' }),
    h('button', { 'aria-label': 'Smaller text', onClick: () => bump(-1) }, 'A−'),
    h('button', { 'aria-label': 'Bigger text', onClick: () => bump(1) }, 'A+'),
    h('button', { 'aria-label': 'Done editing', onClick: () => txt.blur(), style: { background: '#0B1F3A', color: '#FFFFFF' } }, 'Done'));
  bar.addEventListener('pointerdown', e => { if (e.target.closest('button')) e.preventDefault(); });
  symPop.addEventListener('pointerdown', e => e.preventDefault());
  function focusLast(sel) { const all = txt.querySelectorAll(sel); const n = all[all.length - 1]; if (!n) return; const r = document.createRange(); r.selectNodeContents(n); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
  function bump(d) { const list = TEXT_SIZES.map(x => +x[0]); let i = list.indexOf(+p.size || 1); if (i < 0) i = 1; i = clamp(i + d, 0, list.length - 1); p.size = list[i]; txt.style.setProperty('--fs', p.size); api.save(); }
  let t = null;
  function save() { clearTimeout(t); t = setTimeout(() => { p.html = cleanHTML(txt.innerHTML); api.save(); }, 350); }
  txt.addEventListener('input', save);
  txt.addEventListener('focusin', () => { if (!document.body.classList.contains('present')) el.classList.add('editing'); });
  txt.addEventListener('focusout', () => { setTimeout(() => { if (!txt.contains(document.activeElement)) { el.classList.remove('editing'); symPop.style.display = 'none'; } }, 150); p.html = cleanHTML(txt.innerHTML); api.save(); });
  txt.addEventListener('paste', e => { e.preventDefault(); const s = (e.clipboardData || window.clipboardData).getData('text/plain'); try { document.execCommand('insertText', false, s); } catch (er) { } });
  b.append(txt); bar.appendChild(symPop); api.el.appendChild(bar);
  api.cleanup(() => { clearTimeout(t); });
}
W.text = {
  title: 'Text', label: 'Text box', icon: 'text', size: [12, 5], min: [3, 2],
  defaults: () => ({ html: '', size: 1, align: 'left', color: '#F2F6FC', bg: 'card', bold: false }),
  clean(p) { p.html = cleanHTML(p.html); p.size = clamp(+p.size || 1, .5, 5); },
  mount: (b, p, api) => textMount(b, p, api, 'text'),
  settings(f, p) {
    f.chips('Size', TEXT_SIZES, () => String(p.size), v => p.size = +v);
    f.chips('Align', [['left', 'Left'], ['center', 'Center'], ['right', 'Right']], () => p.align, v => p.align = v);
    f.toggle('Bold everything', () => p.bold, v => p.bold = v);
    f.chips('Text color', [['#F2F6FC', 'White'], ['#9CC8FF', 'Light blue'], ['#F5C842', 'Yellow'], ['#0B1F3A', 'Navy'], ['#111111', 'Black']], () => p.color, v => p.color = v);
    f.chips('Box', [['card', 'Navy card'], ['clear', 'No box'], ['#FFFFFF', 'White card'], ['#FFE58A', 'Yellow card']], () => p.bg, v => { p.bg = v; if ((v === '#FFFFFF' || v === '#FFE58A') && p.color === '#F2F6FC') p.color = '#0B1F3A'; if ((v === 'card' || v === 'clear') && (p.color === '#0B1F3A' || p.color === '#111111')) p.color = '#F2F6FC'; });
    f.note('While typing, the bar at the top of the box adds exponents, fractions, square roots and math symbols.');
  }
};
const STICKY = [['#FFE58A', 'Yellow'], ['#BFE3FF', 'Blue'], ['#FFC7DD', 'Pink'], ['#C8F2C2', 'Green'], ['#FFD3A8', 'Orange'], ['#E4D7FF', 'Purple']];
W.sticky = {
  title: 'Sticky note', ownColor: true, icon: 'note', size: [7, 5], min: [3, 2],
  defaults: () => ({ html: '', size: 1, align: 'left', color: '#1F1A00', bg: '#FFE58A' }),
  clean: W.text.clean,
  mount: (b, p, api) => textMount(b, p, api, 'sticky'),
  settings(f, p) {
    f.chips('Color', STICKY, () => p.bg, v => p.bg = v);
    f.chips('Size', TEXT_SIZES, () => String(p.size), v => p.size = +v);
    f.chips('Align', [['left', 'Left'], ['center', 'Center']], () => p.align, v => p.align = v);
  }
};

/* ===== Learning target ===== */
W.target = {
  title: 'Learning target', icon: 'target', size: [13, 6], min: [5, 3],
  defaults: () => ({ target: '', std: '', agenda: '', showAgenda: true, size: 1 }),
  clean(p) { p.target = safeStr(p.target, 400); p.std = safeStr(p.std, 40); p.agenda = safeStr(p.agenda, 1500); },
  mount(b, p, api) {
    const pt = (() => { const d = document.createElement('div'); try { d.contentEditable = 'plaintext-only'; return d.contentEditable === 'plaintext-only' ? 'plaintext-only' : 'true'; } catch (e) { return 'true'; } })();
    const sz = k => 'calc(var(--cell) * ' + k + ' * var(--ts) * ' + (p.size || 1) + ')';
    const stdEl = h('span', { contenteditable: pt, spellcheck: 'false', 'data-ph': 'Standard', class: 'txtph', style: { background: 'rgba(93,169,255,.18)', color: 'var(--accent2)', borderRadius: '8px', padding: '.1em .5em', fontSize: sz(.42), fontWeight: 600, outline: 'none', minWidth: '3em', WebkitUserSelect: 'text', userSelect: 'text' } }, p.std);
    const tEl = h('div', { contenteditable: pt, spellcheck: 'false', 'data-ph': 'I can…', style: { fontSize: sz(.78), fontWeight: 600, lineHeight: 1.25, outline: 'none', WebkitUserSelect: 'text', userSelect: 'text', minHeight: '1.2em' } }, p.target);
    const ag = h('div', { contenteditable: pt, spellcheck: 'false', 'data-ph': 'Agenda: one item per line', style: { fontSize: sz(.5), lineHeight: 1.45, outline: 'none', whiteSpace: 'pre-wrap', color: '#DCE8F8', WebkitUserSelect: 'text', userSelect: 'text', minHeight: '1.2em', borderTop: '1px solid rgba(156,200,255,.2)', paddingTop: '.5em', display: p.showAgenda ? '' : 'none' } }, p.agenda);
    [stdEl, tEl, ag].forEach(n => { n.classList.add('ph'); n.addEventListener('input', () => { p.std = stdEl.innerText.trim(); p.target = tEl.innerText; p.agenda = ag.innerText; api.save(); }); });
    b.appendChild(h('div', { style: { position: 'absolute', inset: 0, padding: 'calc(var(--cell)*.3) calc(var(--cell)*.5)', display: 'flex', flexDirection: 'column', gap: 'calc(var(--cell)*.3)', overflow: 'auto' } },
      h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' } }, h('span', { style: { fontSize: sz(.38), letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 500 } }, 'Today I can…'), stdEl), tEl, ag));
  },
  settings(f, p) {
    f.text('Standard code', () => p.std, v => p.std = v.slice(0, 40), '8.EE.C.8');
    f.area('Learning target', () => p.target, v => p.target = v.slice(0, 400), 'I can solve a system of equations by graphing.', 3);
    f.toggle('Show agenda', () => p.showAgenda, v => p.showAgenda = v);
    f.area('Agenda (one item per line)', () => p.agenda, v => p.agenda = v.slice(0, 1500), '1. Bell work\n2. Notes\n3. Practice', 5);
    f.chips('Size', [['0.75', 'S'], ['1', 'M'], ['1.3', 'L'], ['1.7', 'XL']], () => String(p.size), v => p.size = +v);
    f.note('You can also tap the target, standard or agenda on the board and type right there.');
  }
};

/* ===== Reminders ===== */
W.reminders = {
  title: 'Reminders', icon: 'bell', size: [9, 6], min: [4, 3],
  defaults: () => ({ items: [], size: 1 }),
  clean(p) { p.items = (Array.isArray(p.items) ? p.items : []).slice(0, 50).map(i => ({ id: safeStr(i.id, 20) || uid(), text: safeStr(i.text, 200), time: /^\d{2}:\d{2}$/.test(i.time) ? i.time : '', popup: !!i.popup, daily: !!i.daily, done: !!i.done, fired: safeStr(i.fired, 12), firedOnce: !!i.firedOnce })); },
  mount(b, p, api) {
    const fsz = 'calc(var(--cell) * .55 * var(--ts) * ' + (p.size || 1) + ')';
    const list = h('div', { style: { display: 'flex', flexDirection: 'column', gap: 'calc(var(--cell)*.18)' } });
    const inp = h('input', { class: 'inp', placeholder: 'Add a reminder…', style: { flex: 1 } });
    const addIt = () => { const v = inp.value.trim(); if (!v) return; p.items.push({ id: uid(), text: v, time: '', popup: false, daily: false, done: false }); inp.value = ''; api.save(); draw(); };
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') addIt(); });
    const addRow = editOnly(h('div', { class: 'row', style: { marginTop: 'calc(var(--cell)*.2)' } }, inp, btn('Add', addIt, 'pri')));
    b.appendChild(h('div', { style: { position: 'absolute', inset: 0, overflow: 'auto', padding: 'calc(var(--cell)*.1) calc(var(--cell)*.4) calc(var(--cell)*.4)', fontSize: fsz } }, list, addRow));
    function draw() {
      list.innerHTML = '';
      if (!p.items.length) list.appendChild(h('div', { class: 'muted', style: { fontSize: '.8em' } }, 'No reminders yet.'));
      p.items.forEach(it => {
        const chk = h('button', { 'aria-label': it.done ? 'Mark not done' : 'Mark done', style: { width: '1.15em', height: '1.15em', flex: 'none', borderRadius: '.25em', border: '2px solid var(--accent2)', background: it.done ? 'var(--accent)' : 'transparent', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--navy)', marginTop: '.12em' }, onClick: e => { e.stopPropagation(); it.done = !it.done; api.save(); draw(); } }, it.done ? icon('check', 16) : null);
        list.appendChild(h('div', { style: { display: 'flex', gap: '.45em', alignItems: 'flex-start' } }, chk,
          h('div', { style: { flex: 1, minWidth: 0, textDecoration: it.done ? 'line-through' : 'none', opacity: it.done ? .55 : 1, lineHeight: 1.3 } }, it.text,
            it.time ? h('span', { style: { marginLeft: '.5em', fontSize: '.7em', color: '#F5C842', whiteSpace: 'nowrap' } }, (it.popup ? 'Pop-up ' : '') + fmt12(it.time) + (it.daily ? ' daily' : '')) : null),
          editOnly(h('button', { 'aria-label': 'Delete reminder', style: { border: 0, background: 'transparent', color: 'var(--muted)', fontSize: '.9em', padding: '0 .2em' }, onClick: e => { e.stopPropagation(); p.items = p.items.filter(x => x !== it); api.save(); draw(); } }, '×'))));
      });
    }
    draw();
  },
  settings(f, p, ctx) {
    f.note('Give a reminder a time and turn on Pop-up to have it slide in over the whole board at that time, with a sound.');
    p.items.forEach(it => {
      const box = h('div', { class: 'item', style: { flexDirection: 'column', alignItems: 'stretch' } });
      const ti = h('input', { class: 'inp', value: it.text, placeholder: 'Reminder text' }); ti.addEventListener('input', () => { it.text = ti.value.slice(0, 200); ctx.save(); ctx.remount(); });
      const tm = h('input', { class: 'inp', type: 'time', value: it.time || '', style: { width: '140px' } }); tm.addEventListener('change', () => { it.time = tm.value; it.fired = ''; it.firedOnce = false; if (tm.value) it.popup = true; ctx.save(); ctx.remount(); ctx.rebuild(); });
      const chip = (label, key) => h('button', { class: 'b sm' + (it[key] ? ' on' : ''), onClick: () => { it[key] = !it[key]; if (key === 'popup' || key === 'daily') { it.fired = ''; it.firedOnce = false; } ctx.save(); ctx.remount(); ctx.rebuild(); } }, label);
      box.append(ti, h('div', { class: 'row', style: { flexWrap: 'wrap' } }, tm, chip('Pop-up', 'popup'), chip('Every day', 'daily'), h('button', { class: 'b sm', style: { marginLeft: 'auto' }, onClick: () => { p.items = p.items.filter(x => x !== it); ctx.save(); ctx.remount(); ctx.rebuild(); } }, 'Delete')));
      f.node(box);
    });
    f.buttons([['+ Add reminder', () => { p.items.push({ id: uid(), text: '', time: '', popup: false, daily: false, done: false }); ctx.save(); ctx.remount(); ctx.rebuild(); }, 'pri'], ['Uncheck all', () => { p.items.forEach(i => i.done = false); ctx.save(); ctx.remount(); }]]);
    f.chips('Text size', [['0.8', 'S'], ['1', 'M'], ['1.3', 'L'], ['1.7', 'XL']], () => String(p.size), v => p.size = +v);
  }
};

/* ===== Stoplight ===== */
W.stoplight = {
  title: 'Stoplight', icon: 'light', size: [4, 10], min: [2, 4],
  defaults: () => ({ on: 'red', orient: 'v', showLabel: true, labels: { red: 'Silent work', yellow: 'Whisper voices', green: 'Talk with your group' } }),
  clean(p) { p.labels = p.labels || {}; ['red', 'yellow', 'green'].forEach(k => p.labels[k] = safeStr(p.labels[k], 60)); },
  mount(b, p, api) {
    const v = p.orient !== 'h';
    const C = { red: ['#FF5A4E', '#4A1E1B', '#FF8A80'], yellow: ['#F5C842', '#4A4020', '#FFE08A'], green: ['#3DDC84', '#173B29', '#7EF0B0'] };
    const lab = h('div', { style: { fontWeight: 600, textAlign: 'center', fontSize: v ? fs(13, 5.5) : fs(6.5, 13), lineHeight: 1.15, display: p.showLabel ? '' : 'none' } });
    const house = h('div', { style: { background: '#081426', borderRadius: '999px', padding: v ? '4cqw' : '4cqh', display: 'flex', flexDirection: v ? 'column' : 'row', gap: v ? '3cqh' : '3cqw' } });
    const lights = {};
    ['red', 'yellow', 'green'].forEach(k => {
      const d = h('button', { 'aria-label': k + ' light', 'aria-pressed': String(p.on === k), style: { width: v ? 'min(58cqw, ' + (p.showLabel ? 22 : 25) + 'cqh)' : 'min(' + (p.showLabel ? 17 : 25) + 'cqw, 60cqh)', aspectRatio: '1', borderRadius: '50%', border: 0, padding: 0, transition: 'all .2s' }, onClick: e => { e.stopPropagation(); p.on = p.on === k ? null : k; api.save(); draw(); } });
      lights[k] = d; house.appendChild(d);
    });
    b.appendChild(h('div', { class: 'fill', style: { flexDirection: v ? 'column' : 'row', gap: v ? '3cqh' : '4cqw', padding: '2cqmin' } }, house, lab));
    function draw() {
      Object.keys(lights).forEach(k => { const on = p.on === k; lights[k].style.background = on ? C[k][0] : C[k][1]; lights[k].style.boxShadow = on ? 'inset 0 0 0 0.7cqmin rgba(255,255,255,.45)' : 'none'; lights[k].setAttribute('aria-pressed', String(on)); });
      lab.textContent = p.on ? (p.labels[p.on] || '') : ''; lab.style.color = p.on ? C[p.on][2] : 'var(--muted)';
    }
    draw();
  },
  settings(f, p) {
    f.chips('Layout', [['v', 'Vertical'], ['h', 'Horizontal']], () => p.orient, v => p.orient = v);
    f.toggle('Show a label under the light', () => p.showLabel, v => p.showLabel = v);
    f.text('Red label', () => p.labels.red, v => p.labels.red = v.slice(0, 60));
    f.text('Yellow label', () => p.labels.yellow, v => p.labels.yellow = v.slice(0, 60));
    f.text('Green label', () => p.labels.green, v => p.labels.green = v.slice(0, 60));
  }
};

/* ===== Voice level ===== */
const VOL_LABELS = ['Silent', 'Whisper', 'Whisper', 'Partner voice', 'Partner voice', 'Group voice', 'Group voice', 'Presenter voice', 'Presenter voice', 'Outside voice', 'Outside voice'];
const volColor = i => i <= 3 ? '#3DDC84' : i <= 6 ? '#F5C842' : '#FF5A4E';
W.volume = {
  title: 'Voice level', icon: 'vol', size: [10, 6], min: [5, 3],
  defaults: () => ({ mode: 'set', level: 2, goal: 5, sens: 0, labels: VOL_LABELS.join('\n') }),
  clean(p) { p.level = clamp(Math.round(+p.level || 0), 0, 10); p.goal = clamp(+p.goal || 5, 1, 10); p.labels = safeStr(p.labels, 800); },
  mount(b, p, api) {
    const labels = (p.labels || '').split('\n'); const lbl = i => (labels[i] || VOL_LABELS[i] || '').trim();
    const bars = h('div', { style: { flex: 1, minHeight: 0, width: '100%', display: 'flex', alignItems: 'flex-end', gap: '1.4cqw', padding: '0 4cqw', position: 'relative' } });
    const els = [];
    for (let i = 0; i <= 10; i++) {
      const bEl = h('button', { 'aria-label': 'Level ' + i, style: { flex: 1, height: (8 + i * 9.2) + '%', border: 0, borderRadius: '1.2cqmin', padding: 0, position: 'relative', transition: 'background .15s' }, onClick: e => { e.stopPropagation(); if (p.mode !== 'set') return; p.level = i; api.save(); draw(i); } });
      els.push(bEl); bars.appendChild(bEl);
    }
    const goalMark = h('div', { style: { position: 'absolute', top: 0, bottom: 0, width: '3px', background: '#fff', borderRadius: '2px', display: 'none' } });
    bars.appendChild(goalMark);
    const num = h('span', { class: 'big' }); const word = h('span', { style: { fontWeight: 500 } });
    const info = h('div', { style: { width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0 4cqw', gap: '10px', fontSize: fs(6, 12) } }, h('span', {}, num, h('span', { class: 'muted', style: { fontSize: '.6em' } }, ' / 10')), word);
    const msg = h('div', { class: 'muted', style: { fontSize: fs(4, 7), textAlign: 'center', padding: '0 4cqw', display: 'none' } });
    const micBtn = btn('Start listening', () => startMic(), 'pri');
    const modeRow = editOnly(h('div', { class: 'ctl', style: { flexWrap: 'nowrap' } }, btn('Set level', () => { p.mode = 'set'; api.save(); api.remount(); }, 'sm' + (p.mode === 'set' ? ' on' : '')), btn('Use mic', () => { p.mode = 'mic'; api.save(); api.remount(); }, 'sm' + (p.mode === 'mic' ? ' on' : ''))));
    b.appendChild(h('div', { class: 'fill', style: { gap: '2.5cqh', padding: '1cqh 0 3cqh', justifyContent: 'stretch' } }, bars, info, msg, h('div', { class: 'ctl' }, modeRow, p.mode === 'mic' ? micBtn : null)));
    function draw(lv, live) {
      els.forEach((e, i) => { e.style.background = i <= lv ? volColor(i) : 'var(--track)'; });
      num.textContent = Math.round(lv); word.textContent = live && lv > p.goal ? 'Too loud!' : lbl(Math.round(lv)); const lt = api.el.classList.contains('lightcard'); const vc = i => lt ? (i <= 3 ? '#1E8E4E' : i <= 6 ? '#9A6B00' : '#C9362B') : volColor(i);
      word.style.color = live && lv > p.goal ? (lt ? '#C9362B' : '#FF8A80') : vc(Math.round(lv));
    }
    draw(p.level);
    let stream = null, raf = 0, smooth = 0, ctx = null;
    async function startMic() {
      if (stream) { stopMic(); micBtn.textContent = 'Start listening'; return; }
      msg.style.display = 'none';
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
        const AC = window.AudioContext || window.webkitAudioContext; ctx = new AC(); const src = ctx.createMediaStreamSource(stream); const an = ctx.createAnalyser(); an.fftSize = 1024; src.connect(an);
        const buf = new Float32Array(an.fftSize); micBtn.textContent = 'Stop listening';
        const goalPos = () => { const e = els[clamp(Math.round(p.goal), 0, 10)]; goalMark.style.display = ''; goalMark.style.left = (e.offsetLeft + e.offsetWidth + 2) + 'px'; };
        goalPos();
        const loop = () => {
          an.getFloatTimeDomainData(buf); let s = 0; for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
          const db = 20 * Math.log10(Math.sqrt(s / buf.length) + 1e-8);
          const lv = clamp((db + 62 - (p.sens || 0) * 4) / 4.6, 0, 10);
          smooth = smooth * .85 + lv * .15; draw(smooth, true); raf = requestAnimationFrame(loop);
        };
        loop();
      } catch (e) {
        stream = null; msg.style.display = '';
        msg.textContent = FRAMED ? 'The microphone is blocked while the board runs inside the Claude page. Mic mode works once the board is on its own website. “Set level” works everywhere.' : 'The microphone isn’t available. Check that this site is allowed to use the mic.';
      }
    }
    function stopMic() { cancelAnimationFrame(raf); if (stream) stream.getTracks().forEach(t => t.stop()); stream = null; if (ctx) ctx.close().catch(() => { }); ctx = null; goalMark.style.display = 'none'; draw(p.level); }
    api.cleanup(stopMic);
    if (p.mode === 'mic') { draw(0); word.textContent = ''; }
  },
  settings(f, p) {
    f.chips('Mode', [['set', 'I set the level'], ['mic', 'Listen with the mic']], () => p.mode, v => p.mode = v);
    f.input('Mic: loudest OK level (goal)', 'number', () => p.goal, v => p.goal = clamp(+v || 5, 1, 10), { min: 1, max: 10 });
    f.input('Mic sensitivity (−5 less sensitive … +5 more sensitive)', 'range', () => p.sens || 0, v => p.sens = +v, { min: -5, max: 5, step: 1 });
    f.area('Labels for levels 0–10 (one per line)', () => p.labels, v => p.labels = v.slice(0, 800), '', 11);
  }
};

/* ===== Sign ===== */
const SIGNS = {
  work: [['Silent work', '#FF5A4E'], ['Partner talk', '#F5C842'], ['Group work', '#3DDC84']],
  phase: [['I do', '#5DA9FF'], ['We do', '#B18CFF'], ['You do', '#3DDC84']],
  calc: [['Calculators: YES', '#3DDC84'], ['Calculators: NO', '#FF5A4E']],
  devices: [['Devices: closed', '#FF5A4E'], ['Devices: open', '#3DDC84']]
};
const SIGN_PAL = ['#5DA9FF', '#3DDC84', '#F5C842', '#FF5A4E', '#B18CFF', '#FF9F43', '#F2F6FC'];
const darkText = c => ['#F5C842', '#3DDC84', '#F2F6FC', '#FF9F43', '#FFE58A'].includes(c);
W.sign = {
  title: 'Sign', ownColor: true, label: 'Sign (work mode, calculators…)', icon: 'sign', size: [9, 4], min: [3, 2],
  defaults: () => ({ preset: 'work', idx: 0, custom: 'Silent work\nPartner talk\nGroup work' }),
  clean(p) { p.custom = safeStr(p.custom, 600); p.idx = Math.max(0, +p.idx || 0); },
  mount(b, p, api) {
    const list = p.preset === 'custom' ? p.custom.split('\n').map(s => s.trim()).filter(Boolean).map((s, i) => [s, SIGN_PAL[i % SIGN_PAL.length]]) : (SIGNS[p.preset] || SIGNS.work);
    if (!list.length) list.push(['Tap ⚙ to add signs', '#5DA9FF']);
    const it = list[p.idx % list.length];
    api.el.style.background = it[1]; api.el.style.borderColor = 'rgba(0,0,0,.15)';
    const wl = Math.max(...it[0].split(' ').map(w => w.length), 3), two = it[0].length > wl + 3, longest = two ? Math.max(wl, Math.ceil(it[0].length / 2)) : it[0].length;
    b.appendChild(h('button', { class: 'fill', 'aria-label': 'Next sign', style: { border: 0, background: 'transparent', color: darkText(it[1]) ? '#0B1F3A' : '#FFFFFF', fontWeight: 700, fontSize: fs(Math.min(30, 150 / Math.max(longest, 4)), two ? 34 : 60), lineHeight: 1.05, textAlign: 'center', padding: '2cqmin 4cqw', width: '100%' },
      onClick: e => { e.stopPropagation(); p.idx = (p.idx + 1) % list.length; api.save(); api.remount(); } }, it[0]));
  },
  settings(f, p) {
    f.chips('Sign set', [['work', 'Silent / Partner / Group'], ['phase', 'I do / We do / You do'], ['calc', 'Calculators yes / no'], ['devices', 'Devices closed / open'], ['custom', 'My own']], () => p.preset, v => { p.preset = v; p.idx = 0; });
    if (p.preset === 'custom') f.area('Your signs (one per line)', () => p.custom, v => p.custom = v.slice(0, 600), 'Silent work\nPartner talk', 5);
    f.note('Tap the sign on the board to switch to the next one.');
  }
};

/* ===== Image ===== */
W.image = {
  title: 'Image', icon: 'image', size: [9, 7], min: [3, 3],
  defaults: () => ({ img: null, fit: 'contain', caption: '' }),
  clean(p) { p.img = typeof p.img === 'string' ? p.img.slice(0, 40) : null; p.caption = safeStr(p.caption, 140); },
  mount(b, p, api) {
    const data = Images.get(p.img);
    const upload = async () => { const file = await pickFile('image/*'); if (!file) return; try { p.img = Images.put(await readImageFile(file, 1600)); api.save(); api.remount(); } catch (e) { toast(e.message); } };
    if (!data) {
      b.appendChild(h('div', { class: 'fill', style: { gap: '3cqh', textAlign: 'center', padding: '4cqmin' } },
        h('div', { class: 'muted', style: { fontSize: fs(5, 8) } }, p.img ? 'This image was added on another device. Add it again here.' : 'Add a picture, a worksheet screenshot, anything.'),
        btn('Choose image', upload, 'pri')));
      return;
    }
    const im = h('img', { src: data, alt: p.caption || 'Board image', draggable: 'false', style: { width: '100%', height: '100%', objectFit: p.fit === 'cover' ? 'cover' : 'contain', display: 'block', minHeight: 0 } });
    b.appendChild(h('div', { style: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', padding: p.fit === 'cover' ? 0 : '1.5cqmin' } },
      h('div', { style: { flex: 1, minHeight: 0 } }, im),
      p.caption ? h('div', { style: { textAlign: 'center', fontSize: cellFs(.5), padding: '.3em .5em' } }, p.caption) : null));
  },
  settings(f, p, ctx) {
    f.buttons([['Replace image', async () => { const file = await pickFile('image/*'); if (!file) return; try { p.img = Images.put(await readImageFile(file, 1600)); ctx.save(); ctx.remount(); } catch (e) { toast(e.message); } }, 'pri']]);
    f.chips('Fit', [['contain', 'Show whole image'], ['cover', 'Fill the box']], () => p.fit, v => p.fit = v);
    f.text('Caption (optional)', () => p.caption, v => p.caption = v.slice(0, 140));
  }
};

/* ===== QR code ===== */
function qrSVG(text) {
  const q = qrcode(0, 'M'); q.addData(unescape(encodeURIComponent(text))); q.make();
  const n = q.getModuleCount(), m = 2; let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += 'M' + (c + m) + ' ' + (r + m) + 'h1v1h-1z';
  return '<svg viewBox="0 0 ' + (n + 2 * m) + ' ' + (n + 2 * m) + '" shape-rendering="crispEdges" style="width:100%;height:100%" role="img" aria-label="QR code"><rect width="100%" height="100%" fill="#fff"/><path d="' + d + '" fill="#0B1F3A"/></svg>';
}
W.qr = {
  title: 'QR code', icon: 'qr', size: [6, 8], min: [3, 4],
  defaults: () => ({ url: '', caption: '' }),
  clean(p) { p.url = safeStr(p.url, 1200); p.caption = safeStr(p.caption, 100); },
  mount(b, p, api) {
    if (!p.url) {
      const i = h('input', { class: 'inp', placeholder: 'Paste a link' });
      const go = () => { if (!i.value.trim()) return; p.url = i.value.trim(); api.save(); api.remount(); };
      i.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
      b.appendChild(h('div', { class: 'fill', style: { gap: '3cqh', padding: '5cqmin' } }, h('div', { class: 'muted', style: { fontSize: fs(6, 7), textAlign: 'center' } }, 'Make a QR code students can scan from the TV'), i, btn('Make QR code', go, 'pri')));
      return;
    }
    let svg = ''; try { svg = qrSVG(p.url); } catch (e) { svg = '<div style="color:#0B1F3A;padding:10px">That link is too long for a QR code.</div>'; }
    const cap = p.caption || p.url.replace(/^https?:\/\/(www\.)?/, '');
    b.appendChild(h('div', { class: 'fill', style: { gap: '2cqh', padding: '3cqmin' } },
      h('div', { style: { height: 'min(80cqh, 94cqw)', aspectRatio: '1', borderRadius: '2cqmin', overflow: 'hidden', flex: 'none' }, html: svg }),
      h('div', { style: { fontSize: fs(5.5, 6.5), textAlign: 'center', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, cap)));
  },
  settings(f, p) {
    f.text('Link', () => p.url, v => p.url = v.trim().slice(0, 1200), 'https://…');
    f.text('Caption (optional)', () => p.caption, v => p.caption = v.slice(0, 100), 'e.g. Exit ticket');
  }
};
