/* 4 Example Classroom Board — widgets part 3: organizers, vocabulary, lab data, timeline, read aloud */
const PT = (() => { try { const d = document.createElement('div'); d.contentEditable = 'plaintext-only'; return d.contentEditable === 'plaintext-only' ? 'plaintext-only' : 'true'; } catch (e) { return 'true'; } })();
function ceField(text, ph, onText, style) {
  const el = h('div', { class: 'ce', contenteditable: PT, spellcheck: 'false', 'data-ph': ph || '', style: style || {} }, text || '');
  el.addEventListener('input', () => onText(el.innerText.replace(/\n$/, '')));
  el.addEventListener('paste', e => { e.preventDefault(); const s = (e.clipboardData || window.clipboardData).getData('text/plain'); try { document.execCommand('insertText', false, s); } catch (er) { } });
  return el;
}

/* ===== Read aloud ===== */
const Speech = {
  on: null,
  speak(text, b, rate) {
    const ss = window.speechSynthesis;
    if (!ss || !window.SpeechSynthesisUtterance) { toast('Read aloud isn’t available in this browser'); return; }
    if (this.on === b) { ss.cancel(); this.done(); return; }
    ss.cancel(); this.done();
    const u = new SpeechSynthesisUtterance(text); u.lang = 'en-US'; u.rate = rate || 1;
    u.onend = u.onerror = () => { if (this.on === b) this.done(); };
    this.on = b; b.classList.add('on'); b.innerHTML = ''; b.appendChild(icon('stop', 20)); ss.speak(u);
  },
  done() { if (this.on) { this.on.classList.remove('on'); this.on.innerHTML = ''; this.on.appendChild(icon('speak', 20)); } this.on = null; }
};
function speakBtn(getText, rate, api) {
  const b = h('button', { class: 'spk noLP', 'aria-label': 'Read aloud' }, icon('speak', 20));
  b.addEventListener('click', e => { e.stopPropagation(); const t = (getText() || '').replace(/\s+/g, ' ').trim(); if (t) Speech.speak(t, b, rate); });
  if (api) api.cleanup(() => { if (Speech.on === b) { try { speechSynthesis.cancel(); } catch (e) { } Speech.on = null; } });
  return b;
}
function speakSettings(f, p) {
  f.toggle('Show a read-aloud button', () => !!p.speak, v => p.speak = v);
  if (p.speak) f.chips('Reading speed', [[0.8, 'Slower'], [1, 'Normal'], [1.2, 'Faster']], () => p.rate || 1, v => p.rate = v);
}
// add read aloud to text boxes, sticky notes and question draw
(function () {
  const wrapMount = (type, getText) => {
    const d = W[type], m = d.mount, s = d.settings;
    d.mount = (b, p, api) => { const r = m(b, p, api); if (p.speak) b.appendChild(speakBtn(() => getText(b), p.rate, api)); return r; };
    d.settings = (f, p, ctx) => { if (s) s(f, p, ctx); f.sec('Read aloud'); speakSettings(f, p); };
  };
  wrapMount('text', b => { const t = b.querySelector('.txt'); return t ? t.innerText : ''; });
  wrapMount('sticky', b => { const t = b.querySelector('.txt'); return t ? t.innerText : ''; });
  wrapMount('questions', b => { const q = b.querySelector('.qtext'); return q ? q.innerText : ''; });
})();

/* ===== Graphic organizer ===== */
const ORG = {
  tchart: { name: 'T-chart', heads: ['Column A', 'Column B'], cells: 2 },
  venn: { name: 'Venn diagram', heads: ['Topic A', 'Topic B', 'Both'], cells: 3 },
  kwl: { name: 'KWL chart', heads: ['What I Know', 'What I Want to know', 'What I Learned'], cells: 3 },
  frayer: { name: 'Frayer model', heads: ['Definition', 'Characteristics', 'Examples', 'Non-examples', 'Word'], cells: 4 }
};
W.organizer = {
  title: 'Graphic organizer', icon: 'organizer', size: [16, 10], min: [6, 5], titleOf: p => (ORG[p.kind] || ORG.tchart).name,
  defaults: () => ({ kind: 'tchart', title: '', size: 1, data: {} }),
  clean(p) { if (!ORG[p.kind]) p.kind = 'tchart'; p.title = safeStr(p.title, 80); p.data = (p.data && typeof p.data === 'object') ? p.data : {}; Object.keys(p.data).forEach(k => { const d = p.data[k] || {}; p.data[k] = { h: (Array.isArray(d.h) ? d.h : []).map(x => safeStr(x, 60)), c: (Array.isArray(d.c) ? d.c : []).map(x => safeStr(x, 2000)) }; }); },
  mount(b, p, api) {
    const K = ORG[p.kind] || ORG.tchart, D = p.data[p.kind] = p.data[p.kind] || { h: [], c: [] };
    const k = p.size || 1, sz = m => 'calc(var(--cell) * ' + (m * k) + ' * var(--ts))';
    const head = i => ceField(D.h[i] != null && D.h[i] !== '' ? D.h[i] : K.heads[i], K.heads[i], v => { D.h[i] = v; api.save(); }, { fontWeight: 700, fontSize: sz(.55), color: 'var(--accent2)', textAlign: 'center' });
    const cell = (i, extra) => ceField(D.c[i] || '', 'Type here…', v => { D.c[i] = v; api.save(); }, Object.assign({ fontSize: sz(.48), lineHeight: 1.35, flex: 1, overflow: 'auto', padding: '.3em .4em' }, extra || {}));
    const root = h('div', { style: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', padding: 'calc(var(--cell)*.3)', gap: 'calc(var(--cell)*.2)' } });
    if (p.title) root.appendChild(h('div', { style: { fontSize: sz(.7), fontWeight: 700, textAlign: 'center' } }, p.title));
    const line = '0.12em solid var(--accent)';
    if (p.kind === 'tchart' || p.kind === 'kwl') {
      const n = K.cells, g = h('div', { style: { flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'repeat(' + n + ',minmax(0,1fr))', gridTemplateRows: 'auto minmax(0,1fr)' } });
      for (let i = 0; i < n; i++) g.appendChild(h('div', { style: { borderBottom: line, borderLeft: i ? line : 'none', padding: '.25em .3em .35em', fontSize: sz(.55) } }, head(i)));
      for (let i = 0; i < n; i++) g.appendChild(h('div', { style: { borderLeft: i ? line : 'none', display: 'flex', minHeight: 0 } }, cell(i)));
      root.appendChild(g);
    } else if (p.kind === 'frayer') {
      const g = h('div', { style: { flex: 1, minHeight: 0, position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', border: line, borderRadius: '6px' } });
      [0, 1, 2, 3].forEach(i => g.appendChild(h('div', { style: { display: 'flex', flexDirection: i < 2 ? 'column' : 'column-reverse', minHeight: 0, borderRight: i % 2 === 0 ? line : 'none', borderBottom: i < 2 ? line : 'none', padding: '.3em' } }, h('div', { style: { textAlign: i % 2 ? 'right' : 'left' } }, head(i)), cell(i, i < 2 ? { paddingBottom: '1.8em' } : { paddingTop: '1.8em' }))));
      const wordEl = ceField(D.h[4] || '', 'Word', v => { D.h[4] = v; api.save(); }, { fontWeight: 700, fontSize: sz(.75), textAlign: 'center', minWidth: '4em' });
      g.appendChild(h('div', { style: { position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', background: 'var(--card)', border: line, borderRadius: '999px', padding: '.35em 1.1em', maxWidth: '46%' } }, wordEl));
      root.appendChild(g);
    } else {
      const v = h('div', { style: { flex: 1, minHeight: 0, position: 'relative' } });
      const circ = (l, c) => h('div', { style: { position: 'absolute', top: '2%', bottom: '2%', left: l, width: '58%', borderRadius: '50%', border: '0.12em solid ' + c, background: c + '1F', fontSize: sz(.5) } });
      v.append(circ('3%', '#5DA9FF'), circ('39%', '#F5C842'));
      const reg = (l, w, i, hd) => h('div', { style: { position: 'absolute', left: l, width: w, top: '10%', bottom: '10%', display: 'flex', flexDirection: 'column', gap: '.2em', zIndex: 1 } }, hd, cell(i, { textAlign: 'center' }));
      v.append(reg('9%', '28%', 0, head(0)), reg('39%', '22%', 2, head(2)), reg('63%', '28%', 1, head(1)));
      root.appendChild(v);
    }
    b.appendChild(root);
  },
  settings(f, p) {
    f.chips('Type', Object.keys(ORG).map(k => [k, ORG[k].name]), () => p.kind, v => p.kind = v);
    f.text('Title (optional)', () => p.title, v => p.title = v.slice(0, 80), 'e.g. Plant vs. animal cells');
    f.chips('Text size', [['0.75', 'S'], ['1', 'M'], ['1.3', 'L'], ['1.7', 'XL']], () => String(p.size), v => p.size = +v);
    f.note('Tap any heading or box on the board to type in it. Each type keeps its own text, so you can switch back and forth.');
    f.node(confirmBtn('Clear this organizer', () => { p.data[p.kind] = { h: [], c: [] }; f.fire(); }));
  }
};

/* ===== Vocabulary card ===== */
W.vocab = {
  title: 'Vocabulary', label: 'Vocabulary card', icon: 'vocab', size: [14, 7], min: [6, 4], titleOf: p => p.word ? 'Vocabulary · ' + p.word : 'Vocabulary',
  defaults: () => ({ word: '', pos: '', def: '', ex: '', img: null, speak: true, rate: 1, size: 1 }),
  clean(p) { p.word = safeStr(p.word, 60); p.pos = safeStr(p.pos, 30); p.def = safeStr(p.def, 600); p.ex = safeStr(p.ex, 600); p.img = typeof p.img === 'string' ? p.img.slice(0, 40) : null; },
  mount(b, p, api) {
    const k = p.size || 1, sz = m => 'calc(var(--cell) * ' + (m * k) + ' * var(--ts))';
    const save = () => api.save();
    const word = ceField(p.word, 'Word', v => { p.word = v.trim(); api.refreshTitle(); save(); }, { fontSize: sz(1.15), fontWeight: 700, lineHeight: 1.05 });
    const pos = ceField(p.pos, 'part of speech', v => { p.pos = v.trim(); save(); }, { fontSize: sz(.42), fontStyle: 'italic', color: 'var(--accent2)', background: 'rgba(93,169,255,.14)', borderRadius: '6px', padding: '.1em .5em', alignSelf: 'flex-start' });
    const lab = t => h('div', { style: { fontSize: sz(.34), letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 700, marginTop: '.5em' } }, t);
    const def = ceField(p.def, 'What it means…', v => { p.def = v; save(); }, { fontSize: sz(.55), lineHeight: 1.35 });
    const ex = ceField(p.ex, 'Use it in a sentence…', v => { p.ex = v; save(); }, { fontSize: sz(.5), lineHeight: 1.35, fontStyle: 'italic' });
    const col = h('div', { style: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '.25em', overflow: 'auto' } }, h('div', { style: { display: 'flex', alignItems: 'baseline', gap: '.6em', flexWrap: 'wrap' } }, word, pos), lab('Definition'), def, lab('Example'), ex);
    const data = Images.get(p.img);
    b.appendChild(h('div', { style: { position: 'absolute', inset: 0, display: 'flex', gap: 'calc(var(--cell)*.4)', padding: 'calc(var(--cell)*.35) calc(var(--cell)*.5)' } }, col,
      data ? h('div', { style: { width: '34%', flex: 'none', display: 'flex', alignItems: 'center' } }, h('img', { src: data, alt: p.word || 'Vocabulary picture', draggable: 'false', style: { width: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px', background: '#fff' } })) : null));
    if (p.speak) b.appendChild(speakBtn(() => [p.word, p.pos, p.def ? 'Definition: ' + p.def : '', p.ex ? 'Example: ' + p.ex : ''].filter(Boolean).join('. '), p.rate, api));
  },
  settings(f, p, ctx) {
    f.text('Word', () => p.word, v => p.word = v.slice(0, 60));
    f.text('Part of speech', () => p.pos, v => p.pos = v.slice(0, 30), 'noun, verb, adjective…');
    f.area('Definition', () => p.def, v => p.def = v.slice(0, 600), '', 3);
    f.area('Example sentence', () => p.ex, v => p.ex = v.slice(0, 600), '', 3);
    f.buttons([[p.img ? 'Replace picture' : 'Add a picture', async () => { const file = await pickFile('image/*'); if (!file) return; try { p.img = Images.put(await readImageFile(file, 1200)); ctx.save(); ctx.remount(); ctx.rebuild(); } catch (e) { toast(e.message); } }], p.img ? ['Remove picture', () => { p.img = null; ctx.save(); ctx.remount(); ctx.rebuild(); }] : null]);
    f.chips('Text size', [['0.75', 'S'], ['1', 'M'], ['1.3', 'L'], ['1.7', 'XL']], () => String(p.size), v => p.size = +v);
    f.sec('Read aloud'); speakSettings(f, p);
    f.note('You can also tap the word, definition or example on the board and type right there.');
  }
};

/* ===== Lab data table + graph ===== */
const SERIES = ['#5DA9FF', '#FF9F43', '#3DDC84'];
function niceStep(range, n) { const raw = range / Math.max(1, n), m = Math.pow(10, Math.floor(Math.log10(raw))), r = raw / m; return (r <= 1 ? 1 : r <= 2 ? 2 : r <= 5 ? 5 : 10) * m; }
const fmtN = v => { const a = Math.abs(v); return (a >= 1e5 || (a > 0 && a < 1e-3)) ? v.toExponential(1) : String(Math.round(v * 1000) / 1000); };
W.labdata = {
  title: 'Lab data', label: 'Lab data table + graph', icon: 'lab', size: [18, 10], min: [8, 5], titleOf: p => p.title ? 'Lab data · ' + p.title : 'Lab data',
  defaults: () => ({ title: '', x: 'Time (s)', ys: ['Distance (m)'], rows: [['', ''], ['', ''], ['', ''], ['', ''], ['', ''], ['', '']], kind: 'scatter', fit: false, table: true }),
  clean(p) {
    p.title = safeStr(p.title, 80); p.x = safeStr(p.x, 40) || 'x'; p.ys = (Array.isArray(p.ys) ? p.ys : ['y']).slice(0, 3).map(s => safeStr(s, 40) || 'y'); if (!p.ys.length) p.ys = ['y'];
    p.rows = (Array.isArray(p.rows) ? p.rows : []).slice(0, 60).map(r => { const a = Array.isArray(r) ? r : []; return Array.from({ length: p.ys.length + 1 }, (_, i) => safeStr(a[i] == null ? '' : String(a[i]), 20)); });
    if (!p.rows.length) p.rows = [Array(p.ys.length + 1).fill('')];
  },
  mount(b, p, api) {
    const nc = p.ys.length + 1;
    p.rows.forEach(r => { while (r.length < nc) r.push(''); r.length = nc; });
    const wrap = h('div', { style: { position: 'absolute', inset: 0, display: 'flex', gap: 'calc(var(--cell)*.3)', padding: 'calc(var(--cell)*.3)' } });
    const tableBox = h('div', { class: 'noLP', style: { flex: 'none', overflow: 'auto', display: p.table ? 'flex' : 'none', flexDirection: 'column', gap: '6px' } });
    const graph = h('div', { style: { flex: 1, minWidth: 0, minHeight: 0, position: 'relative' } });
    wrap.append(tableBox, graph); b.appendChild(wrap);
    const cellStyle = { width: '100%', minWidth: '4.2em', boxSizing: 'border-box', border: '1px solid rgba(156,200,255,.3)', background: 'rgba(0,0,0,.18)', color: 'var(--text)', borderRadius: '6px', padding: '.3em .4em', fontSize: '15px', fontFamily: 'inherit', textAlign: 'center' };
    const tbl = h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(' + nc + ', minmax(4.2em, 6.5em))', gap: '4px' } });
    const hdr = (val, i) => { const inp = h('input', { value: val, 'aria-label': 'Column name', style: Object.assign({}, cellStyle, { fontWeight: 700, background: 'transparent', border: '0', borderBottom: '2px solid ' + (i ? SERIES[i - 1] : 'var(--accent2)'), borderRadius: 0, fontSize: '13px' }) }); inp.addEventListener('input', () => { if (i === 0) p.x = inp.value.slice(0, 40); else p.ys[i - 1] = inp.value.slice(0, 40); api.save(); draw(); }); return inp; };
    tbl.append(hdr(p.x, 0), ...p.ys.map((y, i) => hdr(y, i + 1)));
    const inputs = [];
    p.rows.forEach((r, ri) => r.forEach((v, ci) => {
      const inp = h('input', { value: v, inputmode: 'decimal', 'aria-label': (ci ? p.ys[ci - 1] : p.x) + ' row ' + (ri + 1), style: cellStyle });
      inp.addEventListener('input', () => { p.rows[ri][ci] = inp.value.slice(0, 20); api.save(); draw(); });
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); const nx = inputs[(ri + 1) * nc + ci]; if (nx) nx.focus(); else { p.rows.push(Array(nc).fill('')); api.save(); api.remount(); setTimeout(() => { const it = inst.get(api.w.id); const all = it && it.body.querySelectorAll('input[inputmode=decimal]'); if (all) all[(ri + 1) * nc + ci].focus(); }, 30); } } });
      inputs.push(inp); tbl.appendChild(inp);
    }));
    tableBox.append(tbl, h('div', { class: 'row selonly', style: { gap: '6px' } }, btn('+ Row', () => { p.rows.push(Array(nc).fill('')); api.save(); api.remount(); }, 'sm'), p.rows.length > 1 ? btn('− Row', () => { p.rows.pop(); api.save(); api.remount(); }, 'sm') : null));
    function draw() {
      const Wd = graph.clientWidth, Hd = graph.clientHeight; if (!Wd || !Hd) return;
      const series = p.ys.map((name, si) => p.rows.map(r => [parseFloat(r[0]), parseFloat(r[si + 1])]).filter(q => isFinite(q[0]) && isFinite(q[1])));
      const pts = series.flat();
      const ink = getComputedStyle(api.el).getPropertyValue('--text').trim() || '#F2F6FC';
      if (!pts.length) { graph.innerHTML = ''; graph.appendChild(h('div', { class: 'muted', style: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontSize: '15px', padding: '10px', border: '2px dashed rgba(156,200,255,.25)', borderRadius: '8px' } }, 'Type data in the table and the graph appears here')); return; }
      let x0 = Math.min(...pts.map(q => q[0])), x1 = Math.max(...pts.map(q => q[0])), y0 = Math.min(...pts.map(q => q[1])), y1 = Math.max(...pts.map(q => q[1]));
      if (x0 >= 0) x0 = 0; if (y0 >= 0) y0 = 0; if (x1 === x0) x1 = x0 + 1; if (y1 === y0) y1 = y0 + 1;
      const sx = niceStep(x1 - x0, 6), sy = niceStep(y1 - y0, 5);
      x0 = Math.floor(x0 / sx) * sx; x1 = Math.ceil(x1 / sx) * sx; y0 = Math.floor(y0 / sy) * sy; y1 = Math.ceil(y1 / sy) * sy;
      const fsz = clamp(Math.min(Wd, Hd) * .045, 11, 16), L = fsz * 4.2, B = fsz * 3.4, T = p.title ? fsz * 2.2 : fsz * .8, R = fsz;
      const X = v => L + (v - x0) / (x1 - x0) * (Wd - L - R), Y = v => Hd - B - (v - y0) / (y1 - y0) * (Hd - B - T);
      let g = '';
      for (let v = x0; v <= x1 + sx / 2; v += sx) g += '<line x1="' + X(v) + '" y1="' + Y(y0) + '" x2="' + X(v) + '" y2="' + Y(y1) + '" stroke="var(--track)" /><text x="' + X(v) + '" y="' + (Y(y0) + fsz * 1.3) + '" font-size="' + fsz + '" text-anchor="middle" fill="' + ink + '" opacity=".8">' + fmtN(v) + '</text>';
      for (let v = y0; v <= y1 + sy / 2; v += sy) g += '<line x1="' + X(x0) + '" y1="' + Y(v) + '" x2="' + X(x1) + '" y2="' + Y(v) + '" stroke="var(--track)" /><text x="' + (X(x0) - 6) + '" y="' + (Y(v) + fsz * .35) + '" font-size="' + fsz + '" text-anchor="end" fill="' + ink + '" opacity=".8">' + fmtN(v) + '</text>';
      g += '<line x1="' + X(x0) + '" y1="' + Y(y0) + '" x2="' + X(x1) + '" y2="' + Y(y0) + '" stroke="' + ink + '" stroke-width="2"/><line x1="' + X(x0) + '" y1="' + Y(y0) + '" x2="' + X(x0) + '" y2="' + Y(y1) + '" stroke="' + ink + '" stroke-width="2"/>';
      const esc = s => String(s).replace(/[<>&"]/g, '');
      g += '<text x="' + ((X(x0) + X(x1)) / 2) + '" y="' + (Hd - fsz * .5) + '" font-size="' + fsz * 1.05 + '" font-weight="700" text-anchor="middle" fill="' + ink + '">' + esc(p.x) + '</text>';
      if (p.ys.length === 1) g += '<text transform="translate(' + (fsz * 1.1) + ',' + ((Y(y0) + Y(y1)) / 2) + ') rotate(-90)" font-size="' + fsz * 1.05 + '" font-weight="700" text-anchor="middle" fill="' + ink + '">' + esc(p.ys[0]) + '</text>';
      else p.ys.forEach((n, si) => { g += '<rect x="' + (X(x0) + 8) + '" y="' + (T + si * fsz * 1.4) + '" width="' + fsz * .8 + '" height="' + fsz * .8 + '" rx="2" fill="' + SERIES[si] + '"/><text x="' + (X(x0) + 8 + fsz) + '" y="' + (T + si * fsz * 1.4 + fsz * .75) + '" font-size="' + fsz + '" fill="' + ink + '">' + esc(n) + '</text>'; });
      if (p.title) g += '<text x="' + (Wd / 2) + '" y="' + fsz * 1.4 + '" font-size="' + fsz * 1.2 + '" font-weight="700" text-anchor="middle" fill="' + ink + '">' + esc(p.title) + '</text>';
      const eqs = [];
      series.forEach((s, si) => {
        const c = SERIES[si];
        if (p.kind === 'line' && s.length > 1) g += '<polyline fill="none" stroke="' + c + '" stroke-width="2.5" points="' + s.slice().sort((a, b) => a[0] - b[0]).map(q => X(q[0]) + ',' + Y(q[1])).join(' ') + '"/>';
        if (p.fit && s.length > 1) {
          const n = s.length, mx = s.reduce((a, q) => a + q[0], 0) / n, my = s.reduce((a, q) => a + q[1], 0) / n;
          const sxx = s.reduce((a, q) => a + (q[0] - mx) ** 2, 0), sxy = s.reduce((a, q) => a + (q[0] - mx) * (q[1] - my), 0);
          if (sxx > 0) { const m = sxy / sxx, k = my - m * mx; g += '<line x1="' + X(x0) + '" y1="' + Y(m * x0 + k) + '" x2="' + X(x1) + '" y2="' + Y(m * x1 + k) + '" stroke="' + c + '" stroke-width="2" stroke-dasharray="6 5" clip-path="url(#lc' + api.w.id + ')"/>'; eqs.push([c, 'y = ' + fmtN(m) + 'x ' + (k < 0 ? '− ' : '+ ') + fmtN(Math.abs(k))]); }
        }
        s.forEach(q => { g += '<circle cx="' + X(q[0]) + '" cy="' + Y(q[1]) + '" r="' + clamp(fsz * .38, 4, 7) + '" fill="' + c + '" stroke="#0B1F3A" stroke-width="1.5"/>'; });
      });
      eqs.forEach((e, i) => { g += '<text x="' + (X(x1) - 4) + '" y="' + (Y(y0) - fsz * .7 - (eqs.length - 1 - i) * fsz * 1.4) + '" paint-order="stroke" stroke="var(--card)" stroke-width="4" font-size="' + fsz * 1.05 + '" font-weight="700" text-anchor="end" fill="' + e[0] + '">' + e[1] + '</text>'; });
      graph.innerHTML = '<svg width="' + Wd + '" height="' + Hd + '" role="img" aria-label="Graph of the lab data" style="font-family:Arial,Helvetica,sans-serif"><defs><clipPath id="lc' + api.w.id + '"><rect x="' + X(x0) + '" y="' + Y(y1) + '" width="' + (X(x1) - X(x0)) + '" height="' + (Y(y0) - Y(y1)) + '"/></clipPath></defs>' + g + '</svg>';
    }
    const layoutDir = () => { const wide = b.clientWidth > b.clientHeight * 1.25; wrap.style.flexDirection = wide ? 'row' : 'column'; tableBox.style.maxHeight = wide ? '' : '45%'; tableBox.style.maxWidth = wide ? '48%' : ''; };
    requestAnimationFrame(() => { layoutDir(); draw(); });
    return { onResize() { layoutDir(); draw(); } };
  },
  settings(f, p) {
    f.text('Title (optional)', () => p.title, v => p.title = v.slice(0, 80), 'e.g. Ramp height vs. speed');
    f.text('x column (what you change)', () => p.x, v => p.x = v.slice(0, 40), 'Time (s)');
    f.chips('Number of data columns', [[1, '1'], [2, '2'], [3, '3 (trials)']], () => p.ys.length, v => { while (p.ys.length < v) p.ys.push('Trial ' + (p.ys.length + 1)); p.ys.length = v; p.rows.forEach(r => { while (r.length < v + 1) r.push(''); r.length = v + 1; }); });
    p.ys.forEach((y, i) => f.text('Data column ' + (i + 1) + ' name', () => p.ys[i], v => p.ys[i] = v.slice(0, 40)));
    f.chips('Graph', [['scatter', 'Dots'], ['line', 'Dots + line']], () => p.kind, v => p.kind = v);
    f.toggle('Show a line of best fit (with its equation)', () => p.fit, v => p.fit = v);
    f.toggle('Show the table (turn off to show only the graph)', () => p.table, v => p.table = v);
    f.node(confirmBtn('Clear all data', () => { p.rows = Array.from({ length: 6 }, () => Array(p.ys.length + 1).fill('')); f.fire(); }));
  }
};

/* ===== Timeline ===== */
function tlNum(s) {
  s = String(s || '').trim(); let m;
  if ((m = s.match(/^(\d{1,6})\s*(b\.?c\.?e?\.?)$/i))) return -(+m[1]);
  if ((m = s.match(/^-\s*(\d{1,6})$/))) return -(+m[1]);
  if ((m = s.match(/^(\d{1,6})\s*(c\.?e\.?|a\.?d\.?)?$/i))) return +m[1];
  if ((m = s.match(/^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$/))) return +m[1] + ((+m[2] - 1) * 30.4 + (+m[3] || 1)) / 366;
  const t = Date.parse(s); if (!isNaN(t)) { const d = new Date(t); return d.getFullYear() + (d.getMonth() * 30.4 + d.getDate()) / 366; }
  if ((m = s.match(/(\d{3,4})s?/))) return +m[1];
  return null;
}
W.timeline = {
  title: 'Timeline', icon: 'timeline', size: [24, 8], min: [8, 4], titleOf: p => p.title ? 'Timeline · ' + p.title : 'Timeline',
  defaults: () => ({ title: '', events: [], scale: true, size: 1 }),
  clean(p) { p.title = safeStr(p.title, 80); p.events = (Array.isArray(p.events) ? p.events : []).slice(0, 40).map(e => ({ d: safeStr(e && e.d, 40), t: safeStr(e && e.t, 140) })).filter(e => e.d || e.t); },
  mount(b, p, api) {
    const k = p.size || 1;
    const area = h('div', { style: { position: 'absolute', left: 0, right: 0, top: p.title ? 'calc(var(--cell)*.9)' : '0', bottom: 'calc(var(--cell)*.1)' } });
    const di = h('input', { class: 'inp', placeholder: 'Date or year', style: { width: '9em' } }), ti = h('input', { class: 'inp', placeholder: 'What happened', style: { flex: 1 } });
    const addE = () => { if (!di.value.trim() && !ti.value.trim()) return; p.events.push({ d: di.value.trim().slice(0, 40), t: ti.value.trim().slice(0, 140) }); api.save(); api.remount(); };
    [di, ti].forEach(x => x.addEventListener('keydown', e => { if (e.key === 'Enter') addE(); }));
    b.append(p.title ? h('div', { style: { position: 'absolute', left: 0, right: 0, top: 'calc(var(--cell)*.2)', textAlign: 'center', fontWeight: 700, fontSize: 'calc(var(--cell)*' + (.65 * k) + '*var(--ts))' } }, p.title) : '', area,
      h('div', { class: 'row selonly', style: { position: 'absolute', left: '10px', right: '10px', bottom: '8px', zIndex: 3, background: 'rgba(6,16,30,.85)', borderRadius: '10px', padding: '6px' } }, di, ti, btn('Add', addE, 'pri')));
    function draw() {
      area.innerHTML = '';
      const ev = p.events.map((e, i) => ({ e, i, n: tlNum(e.d) })).filter(x => x.e.d || x.e.t);
      if (!ev.length) { area.appendChild(h('div', { class: 'muted', style: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' } }, 'Add events with a date or year, like “1776” or “500 BCE”.')); return; }
      ev.sort((a, b) => (a.n == null ? 1e9 : a.n) - (b.n == null ? 1e9 : b.n) || a.i - b.i);
      const nums = ev.filter(x => x.n != null).map(x => x.n), lo = Math.min(...nums), hi = Math.max(...nums);
      const pos = (x, j) => p.scale && hi > lo && x.n != null ? (x.n - lo) / (hi - lo) : (ev.length === 1 ? .5 : j / (ev.length - 1));
      const W0 = area.clientWidth || 600, M = .07;
      area.appendChild(h('div', { style: { position: 'absolute', left: (M * 100 - 3) + '%', right: (M * 100 - 3) + '%', top: 'calc(50% - 2px)', height: '4px', background: 'var(--accent)', borderRadius: '2px' } }));
      const lastX = { up: [-1, -1], dn: [-1, -1] };
      ev.forEach((x, j) => {
        const f = M + pos(x, j) * (1 - 2 * M), px = f * W0, side = j % 2 === 0 ? 'up' : 'dn';
        const tier = (px - lastX[side][0]) < W0 * .16 && lastX[side][1] === 0 ? 1 : 0; lastX[side] = [px, tier];
        const off = (tier ? 46 : 12);
        area.appendChild(h('div', { style: { position: 'absolute', left: 'calc(' + (f * 100) + '% - 7px)', top: 'calc(50% - 7px)', width: '14px', height: '14px', borderRadius: '50%', background: '#F5C842', border: '2px solid #0B1F3A', zIndex: 2 } }));
        area.appendChild(h('div', { style: { position: 'absolute', left: 'calc(' + (f * 100) + '% - 1px)', width: '2px', background: 'var(--accent2)', opacity: .6, top: side === 'up' ? 'calc(' + (50 - off) + '%)' : '50%', height: off + '%' } }));
        const box = h('div', { style: { position: 'absolute', width: 'max-content', maxWidth: Math.max(110, W0 * .2) + 'px', fontSize: 'calc(var(--cell)*' + (.42 * k) + '*var(--ts))', lineHeight: 1.25, textAlign: 'center', transform: 'translateX(' + (f < .12 ? '-10%' : f > .88 ? '-90%' : '-50%') + ')' + (side === 'up' ? ' translateY(-100%)' : ''), left: (f * 100) + '%', top: side === 'up' ? 'calc(' + (50 - off) + '% - 4px)' : 'calc(' + (50 + off) + '% + 4px)' } },
          h('div', { style: { fontWeight: 700, color: 'var(--accent2)' } }, x.e.d), h('div', {}, x.e.t));
        area.appendChild(box);
      });
    }
    requestAnimationFrame(draw);
    return { onResize: draw };
  },
  settings(f, p) {
    f.text('Title (optional)', () => p.title, v => p.title = v.slice(0, 80), 'e.g. Road to the Revolution');
    f.area('Events, one per line as “date | what happened”', () => p.events.map(e => e.d + ' | ' + e.t).join('\n'), v => { p.events = v.split('\n').map(l => { const i = l.indexOf('|'); return i < 0 ? { d: l.trim().slice(0, 40), t: '' } : { d: l.slice(0, i).trim().slice(0, 40), t: l.slice(i + 1).trim().slice(0, 140) }; }).filter(e => e.d || e.t).slice(0, 40); }, '1765 | Stamp Act\n1770 | Boston Massacre\n1773 | Boston Tea Party\nJuly 4, 1776 | Declaration of Independence', 10);
    f.note('Dates can be years (1776, 500 BCE) or full dates (July 4, 1776).');
    f.toggle('Space events by their dates (to scale)', () => p.scale, v => p.scale = v);
    f.chips('Text size', [['0.8', 'S'], ['1', 'M'], ['1.3', 'L'], ['1.6', 'XL']], () => String(p.size), v => p.size = +v);
  }
};
