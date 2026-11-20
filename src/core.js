/* 4 Example Classroom Board — core */
'use strict';
const COLS = 32;
const W = {};            // widget registry
const $ = (s, r) => (r || document).querySelector(s);
function h(tag, attrs) {
  const el = document.createElement(tag);
  if (attrs) for (const k in attrs) {
    const v = attrs[k];
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'html') el.innerHTML = v; // trusted strings only (icons)
    else if (k === 'text') el.textContent = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (let i = 2; i < arguments.length; i++) add(el, arguments[i]);
  return el;
}
function add(el, kid) {
  if (kid == null || kid === false) return;
  if (Array.isArray(kid)) { kid.forEach(k => add(el, k)); return; }
  el.appendChild(typeof kid === 'object' ? kid : document.createTextNode(String(kid)));
}
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const clone = o => JSON.parse(JSON.stringify(o));
const pad2 = n => String(n).padStart(2, '0');
function fmtTime(sec) {
  sec = Math.max(0, Math.ceil(sec));
  const hh = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
  return hh ? hh + ':' + pad2(m) + ':' + pad2(s) : m + ':' + pad2(s);
}
const todayKey = (d) => { d = d || new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); };
const FRAMED = (() => { try { return window.self !== window.top; } catch (e) { return true; } })();

/* ---------- icons ---------- */
const IC = {
  plus: '<path d="M12 5v14M5 12h14"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  timer: '<path d="M6 3h12M6 21h12M7 3c0 5 10 5 10 9s-10 4-10 9M17 3c0 5-10 5-10 9"/>',
  stopwatch: '<circle cx="12" cy="14" r="7"/><path d="M12 14V10M10 3h4M18 7l1.5-1.5"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  bell: '<path d="M6 8a6 6 0 1112 0c0 7 3 8 3 8H3s3-1 3-8M10 20a2 2 0 004 0"/>',
  text: '<path d="M5 6h14M12 6v13M9 19h6"/>',
  note: '<path d="M4 4h16v11l-5 5H4z"/><path d="M15 20v-5h5"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  light: '<rect x="7" y="2" width="10" height="20" rx="5"/><circle cx="12" cy="7" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="17" r="2"/>',
  vol: '<path d="M4 20v-4M9 20v-8M14 20v-12M19 20V4"/>',
  sign: '<rect x="3" y="5" width="18" height="11" rx="2"/><path d="M12 16v5M8 21h8"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
  qr: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 20h2M20 14v2"/>',
  spinner: '<circle cx="12" cy="12" r="9"/><path d="M12 3v9l6.4 6.4M12 12L3.5 9"/>',
  dice: '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.2"/><circle cx="15" cy="15" r="1.2"/><circle cx="15" cy="9" r="1.2"/><circle cx="9" cy="15" r="1.2"/>',
  coin: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="6"/>',
  hash: '<path d="M5 9h14M5 15h14M10 4L8 20M16 4l-2 16"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><circle cx="17" cy="9" r="2.5"/><path d="M2 20c1-4 3.5-5.5 7-5.5s6 1.5 7 5.5M16 14c3 0 5 1.5 6 5"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 01-8 0zM8 6H4c0 3 2 4 4 4M16 6h4c0 3-2 4-4 4M12 13v4M8 21h8M9 17h6"/>',
  q: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 115 0c0 1.5-2.5 2-2.5 4M12 17h.01"/>',
  plane: '<path d="M12 2v20M2 12h20M5 19L19 5"/>',
  graph: '<path d="M3 3v18h18"/><path d="M6 16c3-8 6-8 8-4s4 2 6-6"/>',
  play: '<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M10 9l5 3-5 3z"/>',
  pen: '<path d="M4 20l4-1 11-11-3-3L5 16z"/><path d="M14 6l3 3"/>',
  bg: '<path d="M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18"/>',
  boards: '<path d="M5 3h11l3 3v15H5zM8 3v6h7V3"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 010 12h-3"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/>',
  unlock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 017.5-2"/>',
  tv: '<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 115 0c0 1.5-2.5 2-2.5 4M12 17h.01"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-2.7 1.1V21a2 2 0 01-4 0v-.1a1.6 1.6 0 00-2.7-1.1l-.1.1a2 2 0 11-2.8-2.8l.1-.1A1.6 1.6 0 003 15H3a2 2 0 010-4h.1a1.6 1.6 0 001.1-2.7l-.1-.1a2 2 0 112.8-2.8l.1.1A1.6 1.6 0 009 4.1V4a2 2 0 014 0v.1a1.6 1.6 0 002.7 1.1l.1-.1a2 2 0 112.8 2.8l-.1.1A1.6 1.6 0 0019.9 11H20a2 2 0 010 4z"/>',
  copy: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 00-2-2H5a2 2 0 00-2 2v9a2 2 0 002 2h3"/>',
  front: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M4 16V5a1 1 0 011-1h11"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  erase: '<path d="M20 20H9L4 15l9-9 7 7-7 7"/><path d="M8 11l6 6"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  ext: '<path d="M14 4h6v6M20 4L10 14M18 14v6H4V6h6"/>',
  check: '<path d="M5 12l5 5L20 7"/>'
};
function icon(name, size) {
  size = size || 22;
  return h('span', { style: { display: 'inline-flex' }, html: '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (IC[name] || '') + '</svg>' });
}

/* ---------- storage ---------- */
const LS_OK = (() => { try { localStorage.setItem('cb4.t', '1'); localStorage.removeItem('cb4.t'); return true; } catch (e) { return false; } })();
const LS = {
  get(k, d) { try { const v = localStorage.getItem('cb4.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('cb4.' + k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  del(k) { try { localStorage.removeItem('cb4.' + k); } catch (e) { } }
};
const Images = {
  mem: new Map(),
  get(id) { if (!id) return null; if (this.mem.has(id)) return this.mem.get(id); let v = null; try { v = localStorage.getItem('cb4.img.' + id); } catch (e) { } if (v) this.mem.set(id, v); return v; },
  put(data) {
    const id = 'i' + uid(); this.mem.set(id, data);
    try { localStorage.setItem('cb4.img.' + id, data); } catch (e) { toast('Storage is full: this image will show until you close the page. Remove an image or two to free space.', 5000); }
    return id;
  },
  putWithId(id, data) { this.mem.set(id, data); try { localStorage.setItem('cb4.img.' + id, data); } catch (e) { } },
  gc() { // remove images no board uses
    try {
      const used = new Set(); const scan = b => { if (!b) return; if (b.bg && b.bg.photo) used.add(b.bg.photo); (b.widgets || []).forEach(w => { if (w.p && w.p.img) used.add(w.p.img); }); };
      scan(board); Object.values(savedBoards()).forEach(scan);
      for (let i = localStorage.length - 1; i >= 0; i--) { const k = localStorage.key(i); if (k && k.indexOf('cb4.img.') === 0 && !used.has(k.slice(8))) localStorage.removeItem(k); }
    } catch (e) { }
  }
};
function readImageFile(file, maxSide) {
  return new Promise((res, rej) => {
    if (!file || !/^image\//.test(file.type)) return rej(new Error('Not an image'));
    const fr = new FileReader();
    fr.onerror = () => rej(fr.error);
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        const s = Math.min(1, (maxSide || 1600) / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        const ctx = c.getContext('2d');
        const png = file.type === 'image/png' && file.size < 400000;
        if (!png) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); }
        ctx.drawImage(img, 0, 0, c.width, c.height);
        res(png ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => rej(new Error('Could not read that image'));
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}
function pickFile(accept) {
  return new Promise(res => {
    const i = h('input', { type: 'file', accept: accept, style: { position: 'fixed', left: '-999px' } });
    i.addEventListener('change', () => { res(i.files && i.files[0]); i.remove(); });
    document.body.appendChild(i); i.click();
  });
}

/* ---------- Claude account sync (only when the page runs as a Claude artifact) ---------- */
const Cloud = {
  db: null, uid: null, ready: false, queue: {}, writing: {}, timers: {},
  async init() {
    if (!window.claude || typeof window.claude.use !== 'function') return;
    try {
      const db = await window.claude.use('db'); const user = await window.claude.use('user');
      if (!db || !user) return;
      const id = await user.id(); if (!id) return;
      this.db = db; this.uid = id; this.ready = true; onCloudReady();
    } catch (e) { }
  },
  ref(k) { return this.db.collection('data/users/' + this.uid).doc(k); },
  async get(k) { if (!this.ready) return null; try { const s = await this.ref(k).get(); return s.exists ? s.data() : null; } catch (e) { return null; } },
  put(k, data, delay) {
    if (!this.ready) return;
    clearTimeout(this.timers[k]);
    this.timers[k] = setTimeout(() => { this.queue[k] = data; this.flush(k); }, delay == null ? 1500 : delay);
  },
  async flush(k) {
    if (this.writing[k]) return;
    while (this.queue[k]) {
      const d = this.queue[k]; delete this.queue[k]; this.writing[k] = true;
      try { await this.ref(k).set(clone(d)); }
      catch (e) { if (e && e.code === 'unavailable') { await new Promise(r => setTimeout(r, 800 + Math.random() * 800)); try { await this.ref(k).set(clone(d)); } catch (e2) { } } }
      this.writing[k] = false;
    }
  },
  async del(k) { if (!this.ready) return; try { await this.ref(k).delete(); } catch (e) { } },
  async list() { if (!this.ready) return []; try { const q = await this.db.collection('data/users/' + this.uid).get(); return q.docs.map(d => ({ id: d.id, data: d.data() })); } catch (e) { return []; } }
};

/* ---------- prefs, lists, presets ---------- */
const prefs = Object.assign({ tour: false, wake: true }, LS.get('prefs', {}));
const savePrefs = () => LS.set('prefs', prefs);
function savedBoards() { return LS.get('boards', {}) || {}; }

/* ---------- board state ---------- */
function newBoard() {
  return { v: 1, id: uid(), name: 'My board', updated: Date.now(), bg: { kind: 'grid', photo: null, grid: true, snap: true, axes: false }, aspect: 'fit', scale: 1, widgets: [], ink: [] };
}
let board = newBoard();
let cell = 40, BW = 0, BH = 0, ROWS = 20;
let selected = null;
let locked = false;
const inst = new Map();      // id -> {el, body, destroy, onResize, ...}
const tickers = new Set();
let saveTimer = null, saveWarned = false;

function saveCurrent(now) {
  board.updated = Date.now();
  clearTimeout(saveTimer);
  const go = () => {
    if (!LS.set('current', board) && !saveWarned && !Cloud.ready) { saveWarned = true; toast(LS_OK ? 'This device is out of storage. Remove an image to keep saving.' : 'This browser isn’t letting the board save here. Your board will reset if you close the page.', 5000); }
    Cloud.put('current', { board: board });
  };
  if (now) go(); else saveTimer = setTimeout(go, 400);
}

const undoStack = [];
const snap = () => JSON.stringify(board);
function pushUndo(s) { undoStack.push(s); if (undoStack.length > 60) undoStack.shift(); refreshDock(); }
function undo() {
  const s = undoStack.pop();
  if (!s) { toast('Nothing to undo'); return; }
  board = JSON.parse(s); renderAll(); saveCurrent(); refreshDock(); toast('Undone');
}

/* ---------- layout ---------- */
const stage = h('div', { id: 'stage' });
const boardEl = h('div', { id: 'board' });
const bgPhoto = h('div', { id: 'bgphoto' });
const gridLayer = h('div', { id: 'gridlayer' });
const axesLayer = h('div', { id: 'axes' });
const widgetsEl = h('div', { id: 'widgets' });
const inkCanvas = h('canvas', { id: 'ink' });
const emptyEl = h('div', { id: 'empty' },
  h('button', { 'aria-label': 'Add a widget', onClick: () => openAdd() }, '+'),
  h('div', { class: 't1' }, 'Tap + to add your first widget'),
  h('div', { class: 't2' }, 'Drag a widget by its top bar · pull the corner to resize'));
boardEl.append(bgPhoto, gridLayer, axesLayer, widgetsEl, inkCanvas, emptyEl);
stage.appendChild(boardEl);

function layout() {
  const Wd = window.innerWidth, Hd = window.innerHeight;
  let bw = Wd, bh = Hd;
  if (board.aspect === '16:9') { if (Wd / Hd > 16 / 9) { bh = Hd; bw = Hd * 16 / 9; } else { bw = Wd; bh = Wd * 9 / 16; } }
  BW = Math.floor(bw); BH = Math.floor(bh); cell = BW / COLS; ROWS = Math.max(6, Math.floor(BH / cell));
  boardEl.style.width = BW + 'px'; boardEl.style.height = BH + 'px';
  boardEl.style.setProperty('--cell', cell + 'px');
  boardEl.style.setProperty('--ts', board.scale || 1);
  applyBg();
  inst.forEach((it, id) => { const w = findW(id); if (w) placeW(w); });
  Ink.resize();
}
const BGS = {
  grid: { name: '4 Example grid', c: '#0B1F3A', minor: 'rgba(120,170,235,.10)', major: 'rgba(120,170,235,.24)' },
  navy: { name: 'Plain navy', c: '#0B1F3A', minor: 'rgba(120,170,235,.06)', major: 'rgba(120,170,235,.12)' },
  graph: { name: 'Graph paper', c: '#FFFFFF', minor: '#D6E3F3', major: '#A9C2E3' },
  cream: { name: 'Cream', c: '#F6EFDF', minor: 'rgba(11,31,58,.07)', major: 'rgba(11,31,58,.14)' },
  chalk: { name: 'Chalkboard', c: '#22362C', minor: 'rgba(255,255,255,.06)', major: 'rgba(255,255,255,.13)' },
  slate: { name: 'Slate', c: '#1E2530', minor: 'rgba(255,255,255,.05)', major: 'rgba(255,255,255,.11)' },
  photo: { name: 'Your photo', c: '#0B1F3A', minor: 'rgba(255,255,255,.10)', major: 'rgba(255,255,255,.22)' }
};
function applyBg() {
  const b = board.bg, d = BGS[b.kind] || BGS.grid;
  boardEl.style.backgroundColor = d.c;
  const photo = b.kind === 'photo' ? Images.get(b.photo) : null;
  bgPhoto.style.backgroundImage = photo ? 'url("' + photo + '")' : 'none';
  const showGrid = b.grid !== false && (b.kind !== 'navy' || b.grid === true);
  if (showGrid) {
    const c = cell, M = c * 5;
    gridLayer.style.backgroundImage = 'linear-gradient(' + d.major + ' 1px,transparent 1px),linear-gradient(90deg,' + d.major + ' 1px,transparent 1px),linear-gradient(' + d.minor + ' 1px,transparent 1px),linear-gradient(90deg,' + d.minor + ' 1px,transparent 1px)';
    gridLayer.style.backgroundSize = M + 'px ' + M + 'px,' + M + 'px ' + M + 'px,' + c + 'px ' + c + 'px,' + c + 'px ' + c + 'px';
  } else gridLayer.style.backgroundImage = 'none';
  axesLayer.innerHTML = '';
  if (b.axes) {
    const cx = Math.round(COLS / 2) * cell, cy = Math.round(ROWS / 2) * cell;
    axesLayer.append(h('div', { style: { left: (cx - 1) + 'px', top: 0, bottom: 0, width: '2px' } }), h('div', { style: { top: (cy - 1) + 'px', left: 0, right: 0, height: '2px' } }));
  }
  document.body.classList.toggle('lightbg', b.kind === 'graph' || b.kind === 'cream');
}

/* ---------- widgets on the board ---------- */
const findW = id => board.widgets.find(w => w.id === id);
function placeW(w) {
  const it = inst.get(w.id); if (!it) return;
  let ww = Math.min(w.w, COLS), hh = Math.min(w.h, ROWS);
  const x = clamp(w.x, 0, COLS - ww), y = clamp(w.y, 0, ROWS - hh);
  Object.assign(it.el.style, { left: x * cell + 'px', top: y * cell + 'px', width: ww * cell + 'px', height: hh * cell + 'px', zIndex: w.z || 1 });
  if (it.onResize) try { it.onResize(); } catch (e) { console.error(e); }
}
function titleOf(w) { const d = W[w.type]; return (d.titleOf && d.titleOf(w.p)) || d.title; }
function mountW(w) {
  const d = W[w.type]; if (!d) return;
  const titleEl = h('span', { class: 'wg-title' }, titleOf(w));
  const tools = h('span', { class: 'wg-tools' },
    d.settings ? h('button', { 'aria-label': 'Settings', title: 'Settings', onClick: e => { e.stopPropagation(); openSettings(w.id); } }, icon('gear', 17)) : null,
    h('button', { class: 'lk', 'aria-label': 'Duplicate', title: 'Duplicate', onClick: e => { e.stopPropagation(); duplicateW(w.id); } }, icon('copy', 17)),
    h('button', { class: 'lk', 'aria-label': 'Bring to front', title: 'Bring to front', onClick: e => { e.stopPropagation(); frontW(w.id); } }, icon('front', 17)),
    h('button', { class: 'del lk', 'aria-label': 'Remove widget', title: 'Remove', onClick: e => { e.stopPropagation(); removeW(w.id); } }, icon('x', 17)));
  const gear = d.settings ? h('button', { class: 'wg-gear', 'aria-label': 'Settings', onClick: e => { e.stopPropagation(); select(w.id); openSettings(w.id); } }, icon('gear', 16)) : null;
  const head = h('div', { class: 'wg-head' }, titleEl, gear, tools);
  const body = h('div', { class: 'wg-body' });
  const rs = h('div', { class: 'wg-rs', 'aria-hidden': 'true' });
  const el = h('div', { class: 'wg wg-' + w.type + (d.clear ? ' clear' : ''), 'data-id': w.id }, head, body, rs);
  widgetsEl.appendChild(el);
  const owned = [];
  const api = {
    w, el, body,
    save: () => saveCurrent(),
    setTitle: t => { titleEl.textContent = t || d.title; },
    refreshTitle: () => { titleEl.textContent = titleOf(w); },
    tick: fn => { const t = { fn }; tickers.add(t); owned.push(() => tickers.delete(t)); },
    cleanup: fn => owned.push(fn),
    sound: n => Sound.play(n),
    toast,
    openSettings: () => openSettings(w.id),
    remount: () => remountW(w.id),
    cell: () => cell
  };
  const it = { el, body, w, api, destroy: () => { owned.forEach(f => { try { f(); } catch (e) { } }); } };
  inst.set(w.id, it);
  try {
    const r = d.mount(body, w.p, api) || {};
    it.onResize = r.onResize; it.onDestroy = r.destroy;
    if (r.onResize && window.ResizeObserver) { let raf = 0; const ro = new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { try { r.onResize(); } catch (e) { } }); }); ro.observe(body); owned.push(() => ro.disconnect()); }
  } catch (e) { console.error(e); body.textContent = 'This widget hit an error.'; }
  head.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; startDrag(e, w.id, 'move'); });
  rs.addEventListener('pointerdown', e => startDrag(e, w.id, 'size'));
  el.addEventListener('pointerdown', () => { if (!document.body.classList.contains('present')) select(w.id); }, true);
  placeW(w);
  if (selected === w.id) el.classList.add('sel');
}
function destroyW(id) {
  const it = inst.get(id); if (!it) return;
  try { it.onDestroy && it.onDestroy(); } catch (e) { }
  it.destroy(); it.el.remove(); inst.delete(id);
}
function remountW(id) { const w = findW(id); if (!w) return; destroyW(id); mountW(w); refreshEmpty(); }
function renderAll() {
  [...inst.keys()].forEach(destroyW);
  board.widgets.sort((a, b) => (a.z || 0) - (b.z || 0)).forEach(mountW);
  boardEl.style.setProperty('--ts', board.scale || 1);
  layout(); Ink.redraw(); refreshEmpty();
}
function refreshEmpty() { emptyEl.style.display = board.widgets.length ? 'none' : 'flex'; }
function topZ() { return board.widgets.reduce((m, w) => Math.max(m, w.z || 0), 0); }
function findSpot(wd, ht) {
  const occ = (x, y) => board.widgets.some(o => x < o.x + o.w && x + wd > o.x && y < o.y + o.h && y + ht > o.y);
  const maxY = Math.max(0, ROWS - ht - 2); // keep clear of the dock
  for (let y = 1; y <= maxY; y++) for (let x = 1; x <= COLS - wd - 1; x++) if (!occ(x, y)) return [x, y];
  const n = board.widgets.length % 6;
  return [clamp(2 + n, 0, COLS - wd), clamp(2 + n, 0, Math.max(0, ROWS - ht))];
}
function addW(type, extra) {
  const d = W[type]; if (!d) return;
  const before = snap();
  const size = d.size || [8, 5];
  const wd = Math.min(size[0], COLS - 2), ht = Math.min(size[1], ROWS - 2);
  const xy = findSpot(wd, ht);
  const w = { id: uid(), type, x: xy[0], y: xy[1], w: wd, h: ht, z: topZ() + 1, p: Object.assign(d.defaults ? d.defaults() : {}, extra || {}) };
  board.widgets.push(w); mountW(w); select(w.id); refreshEmpty(); pushUndo(before); saveCurrent();
  return w;
}
function duplicateW(id) {
  const w = findW(id); if (!w) return; const before = snap();
  const c = clone(w); c.id = uid(); c.x = clamp(w.x + 1, 0, COLS - w.w); c.y = clamp(w.y + 1, 0, ROWS - w.h); c.z = topZ() + 1;
  if (W[c.type].onDuplicate) W[c.type].onDuplicate(c.p);
  board.widgets.push(c); mountW(c); select(c.id); pushUndo(before); saveCurrent();
}
function frontW(id) { const w = findW(id); if (!w) return; const before = snap(); w.z = topZ() + 1; placeW(w); pushUndo(before); saveCurrent(); }
function removeW(id) {
  const before = snap();
  destroyW(id); board.widgets = board.widgets.filter(w => w.id !== id);
  if (selected === id) selected = null;
  refreshEmpty(); pushUndo(before); saveCurrent(); toast('Widget removed · tap Undo to bring it back');
}
function select(id) {
  if (selected === id) return;
  if (selected && inst.get(selected)) inst.get(selected).el.classList.remove('sel');
  selected = id;
  if (id && inst.get(id)) inst.get(id).el.classList.add('sel');
}
boardEl.addEventListener('pointerdown', e => {
  if (e.target === boardEl || e.target === widgetsEl || e.target === gridLayer || e.target === bgPhoto) {
    select(null);
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }
});

/* drag & resize */
function startDrag(e, id, mode) {
  if (locked || document.body.classList.contains('present')) return;
  const w = findW(id), it = inst.get(id); if (!w || !it) return;
  e.preventDefault(); e.stopPropagation(); select(id);
  const t = e.currentTarget; try { t.setPointerCapture(e.pointerId); } catch (er) { }
  const el = it.el, sx = e.clientX, sy = e.clientY;
  const ox = el.offsetLeft, oy = el.offsetTop, ow = el.offsetWidth, oh = el.offsetHeight;
  const d = W[w.type], minW = (d.min || [3, 2])[0] * cell, minH = (d.min || [3, 2])[1] * cell;
  const before = snap(); let moved = false;
  el.classList.add('dragging'); el.style.zIndex = 4000;
  const mv = ev => {
    const dx = ev.clientX - sx, dy = ev.clientY - sy;
    if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
    if (mode === 'move') { el.style.left = clamp(ox + dx, 0, BW - ow) + 'px'; el.style.top = clamp(oy + dy, 0, BH - oh) + 'px'; }
    else { el.style.width = clamp(ow + dx, minW, BW - ox) + 'px'; el.style.height = clamp(oh + dy, minH, BH - oy) + 'px'; if (it.onResize) it.onResize(); }
  };
  const up = () => {
    t.removeEventListener('pointermove', mv); t.removeEventListener('pointerup', up); t.removeEventListener('pointercancel', up);
    el.classList.remove('dragging');
    if (moved) {
      const sn = board.bg.snap !== false, r = v => sn ? Math.round(v / cell) : Math.round(v / cell * 4) / 4;
      if (mode === 'move') { w.x = r(el.offsetLeft); w.y = r(el.offsetTop); }
      else { w.w = Math.max(d.min ? d.min[0] : 3, r(el.offsetWidth)); w.h = Math.max(d.min ? d.min[1] : 2, r(el.offsetHeight)); }
      pushUndo(before); saveCurrent();
    }
    placeW(w);
  };
  t.addEventListener('pointermove', mv); t.addEventListener('pointerup', up); t.addEventListener('pointercancel', up);
}

/* ---------- sound ---------- */
const Sound = {
  ctx: null,
  unlock() {
    try {
      if (!this.ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) this.ctx = new AC(); }
      if (this.ctx && this.ctx.state !== 'running') this.ctx.resume().catch(() => { });
      if (this.ctx && !this.primed) { this.primed = true; const b = this.ctx.createBuffer(1, 1, 22050); const s = this.ctx.createBufferSource(); s.buffer = b; s.connect(this.ctx.destination); s.start(0); }
    } catch (e) { }
  },
  tone(f, t, dur, type, vol) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || .25, t + .02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + .05);
  },
  play(name) {
    if (!name || name === 'none') return;
    this.unlock(); if (!this.ctx) return;
    const t = this.ctx.currentTime + .03;
    try {
      if (name === 'chime') { for (let r = 0; r < 2; r++)[659.3, 830.6, 987.8, 1318.5].forEach((f, i) => this.tone(f, t + r * 1.1 + i * .16, 1.0, 'sine', .28)); }
      else if (name === 'buzzer') { for (let i = 0; i < 3; i++) { this.tone(196, t + i * .5, .38, 'square', .12); this.tone(147, t + i * .5, .38, 'sawtooth', .07); } }
      else if (name === 'bell') { [1046.5, 1568, 2093].forEach((f, i) => this.tone(f, t, 2.2 - i * .5, 'sine', .22 / (i + 1))); this.tone(1046.5, t + .9, 1.8, 'sine', .2); }
      else if (name === 'pop') this.tone(740, t, .12, 'triangle', .22);
      else if (name === 'tick') this.tone(1500, t, .03, 'square', .05);
      else if (name === 'ding') { this.tone(1318.5, t, .7, 'sine', .25); this.tone(1975.5, t + .08, .6, 'sine', .12); }
    } catch (e) { }
  }
};
const SOUND_OPTS = [['chime', 'Chime'], ['bell', 'Bell'], ['buzzer', 'Buzzer'], ['none', 'Silent']];

/* ---------- keep awake ---------- */
const Wake = {
  lock: null, failed: false,
  async req() {
    if (!prefs.wake || !('wakeLock' in navigator) || this.lock) return;
    try { this.lock = await navigator.wakeLock.request('screen'); this.failed = false; this.lock.addEventListener('release', () => { this.lock = null; }); }
    catch (e) { this.failed = true; }
  },
  async off() { try { this.lock && await this.lock.release(); } catch (e) { } this.lock = null; },
  status() {
    if (!('wakeLock' in navigator)) return 'This browser can’t keep the screen awake. On the iPad, set Settings › Display & Brightness › Auto-Lock to Never during class.';
    if (this.lock) return 'On: the screen will stay awake while the board is open.';
    if (this.failed) return 'Blocked here. It works when the board runs on its own site or from your Home Screen. Until then, set Auto-Lock to Never on the iPad.';
    return 'Turns on after your first tap on the board.';
  }
};
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') Wake.req(); });

/* ---------- toast / popup ---------- */
const toastEl = h('div', { id: 'toast', role: 'status' });
let toastT = null;
function toast(msg, ms) { toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), ms || 2400); }
const popupEl = h('div', { id: 'popup', role: 'alert' });
const popQueue = []; let popShowing = false;
function showPopup(title, msg, onSnooze) {
  popQueue.push({ title, msg, onSnooze }); if (!popShowing) nextPopup();
}
function nextPopup() {
  const p = popQueue.shift(); if (!p) { popShowing = false; popupEl.classList.remove('show'); return; }
  popShowing = true; popupEl.innerHTML = '';
  popupEl.append(icon('bell', 48), h('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' } }, h('span', { class: 'pt' }, p.title), h('span', { class: 'pm' }, p.msg)),
    h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
      h('button', { style: { border: 0, background: '#2B2200', color: '#F2C94C' }, onClick: () => nextPopup() }, 'Dismiss'),
      p.onSnooze ? h('button', { style: { border: '2px solid #2B2200', background: 'transparent', color: '#2B2200' }, onClick: () => { p.onSnooze(); nextPopup(); } }, 'Snooze 2 min') : null));
  popupEl.classList.add('show'); Sound.play('ding');
}

/* ---------- sheets & forms ---------- */
let openSheet = null;
function sheet(title, build, opts) {
  closeSheet();
  opts = opts || {};
  const body = h('div', { class: 'sheet-b' });
  const panel = h('div', { class: 'sheet' + (opts.wide ? ' wide' : ''), role: 'dialog', 'aria-label': title },
    h('div', { class: 'sheet-h' }, h('h2', {}, title), h('button', { class: 'b', onClick: () => closeSheet() }, 'Done')), body);
  const scrim = h('div', { class: 'scrim' }, panel);
  scrim.addEventListener('pointerdown', e => { if (e.target === scrim) closeSheet(); });
  document.body.appendChild(scrim);
  openSheet = { scrim, body, onClose: opts.onClose, rebuild: () => { body.innerHTML = ''; build(body); } };
  build(body);
  return openSheet;
}
function closeSheet() { if (!openSheet) return; const s = openSheet; openSheet = null; s.scrim.remove(); if (s.onClose) s.onClose(); }
function Form(root, changed) {
  const f = {
    root, fire: () => changed(),
    sec(t) { root.appendChild(h('div', { class: 'sec' }, t)); },
    note(t) { const n = h('div', { class: 'note' }, t); root.appendChild(n); return n; },
    node(n) { root.appendChild(n); return n; },
    text(label, get, set, ph) {
      const i = h('input', { class: 'inp', value: get() == null ? '' : get(), placeholder: ph || '' });
      i.addEventListener('input', () => { set(i.value); changed(); });
      root.appendChild(h('label', { class: 'fld' }, label, i)); return i;
    },
    area(label, get, set, ph, rows) {
      const t = h('textarea', { placeholder: ph || '', rows: rows || 6 }); t.value = get() || '';
      t.addEventListener('input', () => { set(t.value); changed(); });
      root.appendChild(h('label', { class: 'fld' }, label, t)); return t;
    },
    input(label, type, get, set, attrs) {
      const i = h('input', Object.assign({ class: 'inp', type }, attrs || {})); i.value = get() == null ? '' : get();
      i.addEventListener(type === 'range' ? 'input' : 'change', () => { set(i.value); changed(); });
      if (type === 'number' || type === 'time' || type === 'date') i.addEventListener('input', () => { if (i.value !== '') { set(i.value); changed(); } });
      root.appendChild(h('label', { class: 'fld' }, label, i)); return i;
    },
    chips(label, opts, get, set) {
      const wrap = h('div', { class: 'chips' });
      const draw = () => { wrap.innerHTML = ''; opts.forEach(o => wrap.appendChild(h('button', { class: 'b' + (get() === o[0] ? ' on' : ''), onClick: () => { set(o[0]); draw(); changed(); } }, o[1]))); };
      draw(); root.appendChild(label ? h('div', { class: 'fld' }, label, wrap) : wrap); return wrap;
    },
    toggle(label, get, set) {
      const sw = h('button', { class: 'switch' + (get() ? ' on' : ''), role: 'switch', 'aria-checked': String(!!get()), 'aria-label': label });
      sw.addEventListener('click', () => { set(!get()); sw.classList.toggle('on', !!get()); sw.setAttribute('aria-checked', String(!!get())); changed(); });
      root.appendChild(h('div', { class: 'tog' }, h('span', {}, label), sw)); return sw;
    },
    button(label, fn, cls) { const b = h('button', { class: 'b ' + (cls || ''), onClick: fn }, label); root.appendChild(b); return b; },
    buttons(list) { const r = h('div', { class: 'chips', style: { margin: '10px 0' } }); list.forEach(x => x && r.appendChild(h('button', { class: 'b ' + (x[2] || ''), onClick: x[1] }, x[0]))); root.appendChild(r); return r; }
  };
  return f;
}
function confirmBtn(label, fn, cls) {
  let armed = false, t = null;
  const b = h('button', { class: 'b ' + (cls || '') }, label);
  b.addEventListener('click', () => {
    if (!armed) { armed = true; b.textContent = 'Tap again to confirm'; b.style.borderColor = '#FF9A90'; t = setTimeout(() => { armed = false; b.textContent = label; b.style.borderColor = ''; }, 3000); return; }
    clearTimeout(t); fn();
  });
  return b;
}
function openSettings(id) {
  const w = findW(id); if (!w) return; const d = W[w.type]; if (!d.settings) return;
  const before = snap();
  sheet(titleOf(w) + ' settings', body => {
    const f = Form(body, () => { remountW(id); saveCurrent(); });
    d.settings(f, w.p, { w, rebuild: () => openSheet && openSheet.rebuild(), remount: () => remountW(id), save: () => saveCurrent() });
    f.sec('Widget');
    f.buttons([['Duplicate', () => { closeSheet(); duplicateW(id); }], ['Bring to front', () => frontW(id)]]);
    f.node(confirmBtn('Remove this widget', () => { closeSheet(); removeW(id); }));
  }, { onClose: () => { if (snap() !== before) pushUndo(before); } });
}

/* ---------- add drawer ---------- */
const CATS = [
  ['Time', ['clock', 'timer', 'stopwatch', 'date', 'calendar', 'countdown', 'period']],
  ['Classroom', ['text', 'sticky', 'target', 'reminders', 'stoplight', 'volume', 'sign', 'image', 'qr']],
  ['Math & games', ['spinner', 'dice', 'coin', 'random', 'names', 'groups', 'score', 'questions', 'plane', 'desmos', 'youtube']]
];
function openAdd() {
  sheet('Add a widget', body => {
    CATS.forEach(c => {
      body.appendChild(h('div', { class: 'sec' }, c[0]));
      const g = h('div', { class: 'tiles' });
      c[1].forEach(t => {
        const d = W[t]; if (!d) return;
        g.appendChild(h('button', { class: 'tile', onClick: () => { closeSheet(); addW(t, d.addExtra ? d.addExtra() : null); } }, icon(d.icon, 28), d.label || d.title));
      });
      body.appendChild(g);
    });
  }, { wide: true });
}

/* ---------- board / display panel ---------- */
function openBoardPanel() {
  const before = snap();
  sheet('Background & display', body => {
    const f = Form(body, () => { applyBg(); saveCurrent(); });
    f.sec('Background');
    const g = h('div', { class: 'bgs' });
    Object.keys(BGS).forEach(k => {
      const d = BGS[k];
      const btn = h('button', { class: board.bg.kind === k ? 'on' : '', 'aria-label': d.name, style: { backgroundColor: d.c, backgroundImage: k === 'photo' ? 'none' : 'linear-gradient(' + d.major + ' 1px,transparent 1px),linear-gradient(90deg,' + d.major + ' 1px,transparent 1px)', backgroundSize: '20px 20px' } });
      if (k === 'photo') { const ph = Images.get(board.bg.photo); if (ph) { btn.style.backgroundImage = 'url("' + ph + '")'; btn.style.backgroundSize = 'cover'; } else { btn.appendChild(h('span', { style: { fontSize: '40px', marginTop: 0, color: '#9CC8FF' } }, '+')); btn.style.border = '2px dashed rgba(156,200,255,.5)'; } }
      btn.addEventListener('click', async () => {
        if (k === 'photo') {
          const file = await pickFile('image/*'); if (!file) return;
          try { const data = await readImageFile(file, 2000); board.bg.photo = Images.put(data); } catch (e) { toast(e.message); return; }
        }
        board.bg.kind = k; applyBg(); saveCurrent(); openSheet && openSheet.rebuild();
      });
      g.appendChild(h('div', {}, btn, h('span', {}, d.name)));
    });
    body.appendChild(g);
    if (board.bg.kind === 'photo' && board.bg.photo) f.button('Choose a different photo', async () => { const file = await pickFile('image/*'); if (!file) return; try { board.bg.photo = Images.put(await readImageFile(file, 2000)); applyBg(); saveCurrent(); } catch (e) { toast(e.message); } });
    f.sec('Grid');
    f.toggle('Grid lines', () => board.bg.grid !== false, v => { board.bg.grid = v; });
    f.toggle('Snap widgets to the grid', () => board.bg.snap !== false, v => { board.bg.snap = v; });
    f.toggle('Show x- and y-axes', () => !!board.bg.axes, v => { board.bg.axes = v; });
    f.sec('Display');
    f.chips('Board shape', [['fit', 'Fill this screen'], ['16:9', 'Match the TV (16:9)']], () => board.aspect || 'fit', v => { board.aspect = v; layout(); });
    f.note('“Match the TV” keeps the same layout on the iPad, laptop and TV. “Fill this screen” uses every inch of the device you’re on.');
    const lab = h('span', {}, 'Text size on the board: ' + Math.round((board.scale || 1) * 100) + '%');
    const rng = h('input', { type: 'range', min: '0.7', max: '1.6', step: '0.05', value: String(board.scale || 1) });
    rng.addEventListener('input', () => { board.scale = parseFloat(rng.value); lab.textContent = 'Text size on the board: ' + Math.round(board.scale * 100) + '%'; boardEl.style.setProperty('--ts', board.scale); inst.forEach(it => it.onResize && it.onResize()); saveCurrent(); });
    body.appendChild(h('label', { class: 'fld' }, lab, rng));
    f.sec('Classroom');
    f.toggle('Keep the screen awake', () => prefs.wake, v => { prefs.wake = v; savePrefs(); if (v) Wake.req(); else Wake.off(); });
    f.note(Wake.status());
    f.buttons([['Test sound', () => Sound.play('chime')], ['Clear drawing', () => { if (!board.ink.length) return; pushUndo(snap()); board.ink = []; Ink.redraw(); saveCurrent(); toast('Drawing cleared'); }]]);
  }, { onClose: () => { if (snap() !== before) pushUndo(before); } });
}

/* ---------- saved boards ---------- */
function boardsMerged() { return savedBoards(); }
function saveBoardAs(name) {
  const all = savedBoards();
  const b = clone(board); b.id = uid(); b.name = name || 'Untitled board'; b.updated = Date.now();
  all[b.id] = b; if (!LS.set('boards', all)) toast('This device is out of storage.');
  Cloud.put('board-' + b.id, { board: b }, 0);
  board.id = b.id; board.name = b.name; saveCurrent();
  return b;
}
function updateSaved() {
  const all = savedBoards();
  const b = clone(board); b.updated = Date.now(); all[b.id] = b; LS.set('boards', all); Cloud.put('board-' + b.id, { board: b }, 0);
}
function deleteSaved(id) { const all = savedBoards(); delete all[id]; LS.set('boards', all); Cloud.del('board-' + id); Images.gc(); }
function loadBoard(b) {
  pushUndo(snap());
  board = normalizeBoard(clone(b)) || newBoard(); selected = null;
  renderAll(); saveCurrent(true);
}
function openBoards() {
  sheet('Saved boards', body => {
    const all = boardsMerged();
    const f = Form(body, () => saveCurrent());
    f.sec('This board');
    f.text('Name', () => board.name, v => { board.name = v; }, 'e.g. Bell Work');
    const isSaved = !!all[board.id];
    f.buttons([
      isSaved ? ['Save changes', () => { updateSaved(); toast('Saved “' + board.name + '”'); openSheet.rebuild(); }, 'pri'] : null,
      ['Save as new board', () => { const b = saveBoardAs(board.name && board.name !== 'My board' ? board.name : 'Board ' + (Object.keys(all).length + 1)); toast('Saved “' + b.name + '”'); openSheet.rebuild(); }, isSaved ? '' : 'pri'],
      ['New blank board', () => { loadBoard(newBoard()); closeSheet(); toast('Blank board · tap Undo to go back'); }]
    ]);
    f.sec('Your boards');
    const list = Object.values(all).sort((a, b) => (b.updated || 0) - (a.updated || 0));
    if (!list.length) f.note('No saved boards yet. Set up a board, give it a name, and tap “Save as new board.”');
    list.forEach(b => {
      body.appendChild(h('div', { class: 'item' },
        h('div', { class: 'grow' }, h('div', { class: 'nm' }, b.name || 'Untitled'), h('div', { class: 'sub' }, (b.widgets || []).length + ' widgets · ' + new Date(b.updated || 0).toLocaleDateString())),
        h('button', { class: 'b' + (b.id === board.id ? ' on' : ''), onClick: () => { loadBoard(b); closeSheet(); toast('Loaded “' + b.name + '”'); } }, b.id === board.id ? 'Reload' : 'Load'),
        confirmBtn('Delete', () => { deleteSaved(b.id); openSheet.rebuild(); })));
    });
    f.note(Cloud.ready ? 'Your boards sync to your Claude account, so they show up on your iPad and laptop.' : 'Boards are saved on this device. Use Export and Import to move a board to another device or share it with a colleague.');
    f.sec('Share or move a board');
    f.buttons([['Export this board', exportBoard], ['Import a board file', importBoard]]);
    f.note('An exported board file includes its images. Class lists for the name picker are never included; they stay on this device.');
  });
}
function boardFile(b) {
  const imgs = {}; const grab = id => { const d = Images.get(id); if (d) imgs[id] = d; };
  if (b.bg.photo) grab(b.bg.photo); b.widgets.forEach(w => { if (w.p && w.p.img) grab(w.p.img); });
  return JSON.stringify({ format: '4example-board', v: 1, board: b, images: imgs });
}
let Downloads = null;
async function exportBoard() {
  const data = boardFile(board), name = (board.name || 'board').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') + '.board.json';
  if (Downloads) { try { await Downloads.save({ filename: name, data }); return; } catch (e) { toast('Export was cancelled.'); return; } }
  if (!FRAMED) { const a = h('a', { href: URL.createObjectURL(new Blob([data], { type: 'application/json' })), download: name }); document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); return; }
  try { await navigator.clipboard.writeText(data); toast('Board copied. Paste it into a note or email to move it.', 4000); } catch (e) { toast('Exporting isn’t available here.'); }
}
async function importBoard() {
  const file = await pickFile('.json,application/json,text/plain'); if (!file) return;
  let obj; try { obj = JSON.parse(await file.text()); } catch (e) { toast('That file isn’t a board file.'); return; }
  if (!obj || obj.format !== '4example-board' || !obj.board) { toast('That file isn’t a board file.'); return; }
  const map = {};
  Object.keys(obj.images || {}).forEach(id => { const d = obj.images[id]; if (typeof d === 'string' && /^data:image\/(png|jpeg|gif|webp);base64,[A-Za-z0-9+/=]+$/.test(d)) { map[id] = Images.put(d); } });
  const b = normalizeBoard(obj.board); if (!b) { toast('That board file is damaged.'); return; }
  b.id = uid(); if (b.bg.photo) b.bg.photo = map[b.bg.photo] || null; b.widgets.forEach(w => { if (w.p && w.p.img) w.p.img = map[w.p.img] || null; });
  loadBoard(b); closeSheet(); toast('Imported “' + b.name + '” · save it to keep it in your list', 4000);
}

/* ---------- sanitizing ---------- */
function cleanHTML(html) {
  const doc = new DOMParser().parseFromString('<div>' + String(html || '') + '</div>', 'text/html');
  const OK = { B: 1, STRONG: 1, I: 1, EM: 1, U: 1, SUP: 1, SUB: 1, SPAN: 1, BR: 1, DIV: 1, P: 1 };
  const DROP = { SCRIPT: 1, STYLE: 1, IFRAME: 1, OBJECT: 1, EMBED: 1, TEMPLATE: 1, svg: 1, SVG: 1, MATH: 1, math: 1, LINK: 1, META: 1, IMG: 1, VIDEO: 1, AUDIO: 1, FORM: 1, INPUT: 1, TEXTAREA: 1, BUTTON: 1, SELECT: 1 };
  const CLS = { frac: 1, num: 1, den: 1, sqrt: 1, rad: 1, hl: 1, big: 1 };
  (function walk(node) {
    [...node.childNodes].forEach(c => {
      if (c.nodeType === 3) return;
      if (c.nodeType !== 1 || DROP[c.tagName]) { c.remove(); return; }
      walk(c);
      if (!OK[c.tagName]) { c.replaceWith(...c.childNodes); return; }
      [...c.attributes].forEach(a => {
        if (a.name === 'class') { const v = a.value.split(/\s+/).filter(x => CLS[x]).join(' '); v ? c.setAttribute('class', v) : c.removeAttribute('class'); }
        else if (a.name === 'contenteditable' && /^(true|false)$/.test(a.value)) { }
        else c.removeAttribute(a.name);
      });
    });
  })(doc.body.firstChild);
  return doc.body.firstChild.innerHTML.slice(0, 200000);
}
function normalizeBoard(b) {
  if (!b || typeof b !== 'object' || !Array.isArray(b.widgets)) return null;
  const n = newBoard();
  n.id = typeof b.id === 'string' ? b.id.slice(0, 40).replace(/[^\w-]/g, '') || n.id : n.id;
  n.name = typeof b.name === 'string' ? b.name.slice(0, 80) : n.name;
  n.updated = +b.updated || Date.now();
  const bg = b.bg || {};
  n.bg = { kind: BGS[bg.kind] ? bg.kind : 'grid', photo: typeof bg.photo === 'string' ? bg.photo.slice(0, 40) : null, grid: bg.grid !== false, snap: bg.snap !== false, axes: !!bg.axes };
  n.aspect = b.aspect === '16:9' ? '16:9' : 'fit';
  n.scale = clamp(+b.scale || 1, 0.6, 1.8);
  n.widgets = b.widgets.filter(w => w && W[w.type]).slice(0, 120).map(w => {
    const d = W[w.type], size = d.size || [8, 5];
    const p = Object.assign(d.defaults ? d.defaults() : {}, (w.p && typeof w.p === 'object') ? w.p : {});
    if (d.clean) d.clean(p);
    return { id: typeof w.id === 'string' ? w.id.slice(0, 40) : uid(), type: w.type, x: clamp(+w.x || 0, 0, COLS - 1), y: clamp(+w.y || 0, 0, 200), w: clamp(+w.w || size[0], 1, COLS), h: clamp(+w.h || size[1], 1, 60), z: +w.z || 1, p };
  });
  n.ink = Array.isArray(b.ink) ? b.ink.filter(s => s && Array.isArray(s.p)).slice(0, 2000).map(s => ({ c: /^#[0-9a-fA-F]{6}$/.test(s.c) ? s.c : '#FFFFFF', w: clamp(+s.w || .15, .02, 1), p: s.p.filter(q => Array.isArray(q) && q.length === 2).map(q => [+q[0] || 0, +q[1] || 0]) })) : [];
  return n;
}
const safeStr = (v, max, d) => typeof v === 'string' ? v.slice(0, max || 500) : (d == null ? '' : d);

/* ---------- ink (pen layer) ---------- */
const Ink = {
  ctx: null, color: '#FFFFFF', size: .15, erase: false, cur: null, before: null, dpr: 1,
  resize() { this.dpr = window.devicePixelRatio || 1; inkCanvas.width = Math.round(BW * this.dpr); inkCanvas.height = Math.round(BH * this.dpr); inkCanvas.style.width = BW + 'px'; inkCanvas.style.height = BH + 'px'; this.ctx = inkCanvas.getContext('2d'); this.redraw(); },
  redraw() { if (!this.ctx) return; const c = this.ctx; c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); c.clearRect(0, 0, BW, BH); board.ink.forEach(s => this.stroke(s)); },
  stroke(s) {
    const c = this.ctx, p = s.p; if (!p.length) return;
    c.strokeStyle = s.c; c.fillStyle = s.c; c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = s.w * cell;
    if (p.length === 1) { c.beginPath(); c.arc(p[0][0] * BW, p[0][1] * BH, s.w * cell / 2, 0, 7); c.fill(); return; }
    c.beginPath(); c.moveTo(p[0][0] * BW, p[0][1] * BH);
    for (let i = 1; i < p.length - 1; i++) { const mx = (p[i][0] + p[i + 1][0]) / 2, my = (p[i][1] + p[i + 1][1]) / 2; c.quadraticCurveTo(p[i][0] * BW, p[i][1] * BH, mx * BW, my * BH); }
    const l = p[p.length - 1]; c.lineTo(l[0] * BW, l[1] * BH); c.stroke();
  },
  pt(e) { const r = inkCanvas.getBoundingClientRect(); return [(e.clientX - r.left) / BW, (e.clientY - r.top) / BH]; },
  eraseAt(q) { const n = board.ink.length; board.ink = board.ink.filter(s => !s.p.some(a => Math.hypot((a[0] - q[0]) * BW, (a[1] - q[1]) * BH) < Math.max(14, s.w * cell))); if (board.ink.length !== n) this.redraw(); },
  down(e) { e.preventDefault(); try { inkCanvas.setPointerCapture(e.pointerId); } catch (er) { } this.before = snap(); const q = this.pt(e); if (this.erase) { this.eraseAt(q); this.cur = 'erase'; return; } this.cur = { c: this.color, w: this.size, p: [q] }; this.stroke(this.cur); },
  move(e) { if (!this.cur) return; const q = this.pt(e); if (this.cur === 'erase') { this.eraseAt(q); return; } const l = this.cur.p[this.cur.p.length - 1]; if (Math.hypot((q[0] - l[0]) * BW, (q[1] - l[1]) * BH) < 2) return; this.cur.p.push([Math.round(q[0] * 1e4) / 1e4, Math.round(q[1] * 1e4) / 1e4]); this.redraw(); this.stroke(this.cur); },
  up() { if (!this.cur) return; if (this.cur !== 'erase') board.ink.push(this.cur); this.cur = null; if (snap() !== this.before) { pushUndo(this.before); saveCurrent(); } this.redraw(); }
};
inkCanvas.addEventListener('pointerdown', e => Ink.down(e));
inkCanvas.addEventListener('pointermove', e => Ink.move(e));
inkCanvas.addEventListener('pointerup', () => Ink.up());
inkCanvas.addEventListener('pointercancel', () => Ink.up());
const INK_COLORS = ['#FFFFFF', '#F5C842', '#FF5A4E', '#5DA9FF', '#3DDC84', '#0B1F3A'];
const inkbar = h('div', { id: 'inkbar' });
function buildInkbar() {
  inkbar.innerHTML = '';
  INK_COLORS.forEach(c => inkbar.appendChild(h('button', { class: 'sw' + (!Ink.erase && Ink.color === c ? ' on' : ''), 'aria-label': 'Pen color ' + c, style: { background: c, outline: c === '#0B1F3A' ? '1px solid #5DA9FF' : '' }, onClick: () => { Ink.color = c; Ink.erase = false; buildInkbar(); } })));
  [['S', .08], ['M', .15], ['L', .32]].forEach(s => inkbar.appendChild(h('button', { class: 'b sm' + (Ink.size === s[1] ? ' on' : ''), onClick: () => { Ink.size = s[1]; buildInkbar(); } }, s[0])));
  inkbar.appendChild(h('button', { class: 'b sm' + (Ink.erase ? ' on' : ''), 'aria-label': 'Eraser', onClick: () => { Ink.erase = !Ink.erase; buildInkbar(); } }, icon('erase', 18), 'Erase'));
  inkbar.appendChild(h('button', { class: 'b sm', onClick: () => { if (!board.ink.length) return; pushUndo(snap()); board.ink = []; Ink.redraw(); saveCurrent(); } }, 'Clear'));
  inkbar.appendChild(h('button', { class: 'b sm pri', onClick: () => setDrawing(false) }, 'Done'));
}
function setDrawing(on) { document.body.classList.toggle('drawing', on); if (on) { select(null); const light = board.bg.kind === 'graph' || board.bg.kind === 'cream'; if (light && Ink.color === '#FFFFFF') Ink.color = '#0B1F3A'; if (!light && Ink.color === '#0B1F3A') Ink.color = '#FFFFFF'; buildInkbar(); } refreshDock(); }

/* ---------- dock ---------- */
const dock = h('div', { id: 'dock', role: 'toolbar', 'aria-label': 'Board tools' });
const dockBtns = {};
function dbtn(key, ic, label, fn) { const b = h('button', { 'aria-label': label, onClick: fn }, icon(ic, 22), label); dockBtns[key] = b; return b; }
dock.append(
  dbtn('add', 'plus', 'Add', () => openAdd()),
  dbtn('draw', 'pen', 'Draw', () => setDrawing(!document.body.classList.contains('drawing'))),
  dbtn('bg', 'bg', 'Background', () => openBoardPanel()),
  dbtn('boards', 'boards', 'Boards', () => openBoards()),
  h('span', { class: 'sep' }),
  dbtn('undo', 'undo', 'Undo', () => undo()),
  dbtn('lock', 'lock', 'Lock', () => setLocked(!locked)),
  dbtn('present', 'tv', 'Present', () => setPresent(true)),
  dbtn('help', 'help', 'Help', () => openHelp()));
function refreshDock() {
  dockBtns.undo.disabled = !undoStack.length;
  dockBtns.draw.classList.toggle('on', document.body.classList.contains('drawing'));
  dockBtns.lock.classList.toggle('on', locked);
  dockBtns.lock.innerHTML = ''; add(dockBtns.lock, [icon(locked ? 'lock' : 'unlock', 22), locked ? 'Locked' : 'Lock']);
}
function setLocked(v) { locked = v; document.body.classList.toggle('locked', v); refreshDock(); toast(v ? 'Locked: widgets can’t be moved, resized or removed' : 'Unlocked'); }
const exitBtn = h('button', { id: 'exitPresent', onClick: () => setPresent(false) }, 'Exit present mode');
function setPresent(v) {
  document.body.classList.toggle('present', v); select(null); setDrawing(false);
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  try {
    if (v && document.documentElement.requestFullscreen && !document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => { });
    if (!v && document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => { });
  } catch (e) { }
  if (v) { exitBtn.classList.add('peek'); setTimeout(() => exitBtn.classList.remove('peek'), 2500); }
}
document.addEventListener('pointerdown', e => {
  if (document.body.classList.contains('present') && !e.target.closest('.wg')) { exitBtn.classList.add('peek'); clearTimeout(exitBtn._t); exitBtn._t = setTimeout(() => exitBtn.classList.remove('peek'), 2500); }
});

/* ---------- help & tour ---------- */
const TOUR = [
  ['Welcome to your classroom board', 'The board opens blank. Tap + Add at the bottom to put a clock, timer, spinner or anything else on it.'],
  ['Move and resize', 'Drag a widget by its top bar. Pull the bottom-right corner to resize it. Widgets snap to the grid squares, and the text grows with the widget.'],
  ['Change any widget', 'Tap the gear on a widget to change it: timer length and style, spinner colors and spaces, stoplight labels, and more.'],
  ['Show it on the TV', 'AirPlay or Screen Mirror this screen, then tap Present to hide every control. Lock keeps widgets from getting bumped.'],
  ['Save your setups', 'Use Boards to save layouts like Bell Work or Test Day and load them in one tap. Undo fixes any slip.']
];
const tourEl = h('div', { id: 'tour', role: 'dialog', 'aria-label': 'Quick tour' });
function showTour(i) {
  i = i || 0; tourEl.innerHTML = '';
  const s = TOUR[i];
  tourEl.appendChild(h('div', { class: 'card' },
    h('div', { class: 'dots' }, TOUR.map((_, j) => h('i', { class: j === i ? 'on' : '' }))),
    h('h3', {}, s[0]), h('p', {}, s[1]),
    h('div', { class: 'row', style: { justifyContent: 'space-between', marginTop: '24px' } },
      h('button', { class: 'b', onClick: () => { tourEl.classList.remove('show'); prefs.tour = true; savePrefs(); } }, 'Skip'),
      h('button', { class: 'b pri', onClick: () => { if (i < TOUR.length - 1) showTour(i + 1); else { tourEl.classList.remove('show'); prefs.tour = true; savePrefs(); } } }, i < TOUR.length - 1 ? 'Next' : 'Start'))));
  tourEl.classList.add('show');
}
function openHelp() {
  sheet('Help', body => {
    const f = Form(body, () => { });
    f.buttons([['Replay the quick tour', () => { closeSheet(); showTour(0); }, 'pri']]);
    f.sec('Tips');
    [
      'Tap a widget to select it. Use the buttons on its top bar to change settings, duplicate, bring it to the front, or remove it.',
      'Present hides every control so only the widgets show on the TV. Tap the faint button in the top-right corner to exit.',
      'Draw turns on the pen layer. It works with an Apple Pencil or your finger and sits on top of the widgets.',
      'Drop an image file onto the board (on the laptop) to add it as an image widget.',
      'On the laptop: Ctrl/⌘ + Z undoes, Delete removes the selected widget, Esc leaves present mode.',
      'Timer sounds need one tap on the board after it loads. That’s an iPad rule, not a bug.'
    ].forEach(t => f.note('• ' + t));
    f.sec('Put it on the iPad Home Screen');
    f.note('Open the board in Safari, tap Share › Add to Home Screen. Once the board lives on its own website, it opens full screen like an app.');
    f.sec('About');
    f.note('4 Example Classroom Board. Boards and class lists are saved on this device' + (Cloud.ready ? ', and boards also sync to your Claude account.' : '.'));
  });
}

/* ---------- reminders scheduler ---------- */
const snoozes = [];
function checkReminders(now) {
  const hm = pad2(now.getHours()) + ':' + pad2(now.getMinutes()), day = todayKey(now);
  let changed = false;
  board.widgets.forEach(w => {
    if (w.type !== 'reminders') return;
    (w.p.items || []).forEach(it => {
      if (!it.popup || !it.time || it.time !== hm || it.fired === day) return;
      if (!it.daily && it.firedOnce) return;
      it.fired = day; it.firedOnce = true; changed = true;
      showPopup('Reminder · ' + fmt12(it.time), it.text || 'Reminder', () => snoozes.push({ at: Date.now() + 120000, text: it.text, time: it.time }));
    });
  });
  for (let i = snoozes.length - 1; i >= 0; i--) if (Date.now() >= snoozes[i].at) { const s = snoozes.splice(i, 1)[0]; showPopup('Reminder (snoozed)', s.text, () => snoozes.push({ at: Date.now() + 120000, text: s.text })); }
  if (changed) { saveCurrent(); inst.forEach(it => { if (it.w.type === 'reminders') it.api.remount(); }); }
}
function fmt12(hm) { const [H, M] = hm.split(':').map(Number); const ap = H >= 12 ? 'PM' : 'AM'; return ((H + 11) % 12 + 1) + ':' + pad2(M) + ' ' + ap; }

/* ---------- global events ---------- */
let lastMin = -1;
setInterval(() => {
  const now = new Date();
  tickers.forEach(t => { try { t.fn(now); } catch (e) { console.error(e); } });
  if (now.getMinutes() !== lastMin || snoozes.length) { lastMin = now.getMinutes(); checkReminders(now); }
}, 250);
let firstTap = true;
document.addEventListener('pointerdown', () => { Sound.unlock(); if (firstTap) { firstTap = false; Wake.req(); toastEl.classList.remove('show'); } }, true);
document.addEventListener('keydown', e => {
  const typing = e.target.closest && e.target.closest('input,textarea,[contenteditable="true"]');
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !typing) { e.preventDefault(); undo(); }
  else if ((e.key === 'Delete' || e.key === 'Backspace') && selected && !typing && !locked && !openSheet) { e.preventDefault(); removeW(selected); }
  else if (e.key === 'Escape') { if (openSheet) closeSheet(); else if (document.body.classList.contains('present')) setPresent(false); else if (document.body.classList.contains('drawing')) setDrawing(false); else select(null); }
});
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && document.body.classList.contains('present')) { /* stay in present; user may exit via button */ } });
window.addEventListener('resize', () => layout());
boardEl.addEventListener('dragover', e => { e.preventDefault(); });
boardEl.addEventListener('drop', async e => {
  e.preventDefault(); const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
  if (!file || !/^image\//.test(file.type)) return;
  try { const data = await readImageFile(file, 1600); addW('image', { img: Images.put(data) }); } catch (er) { toast(er.message); }
});
document.addEventListener('gesturestart', e => e.preventDefault());

/* ---------- cloud ready ---------- */
async function onCloudReady() {
  const cur = await Cloud.get('current');
  if (cur && cur.board) {
    const cb = normalizeBoard(cur.board);
    if (cb && (cb.updated || 0) > (board.updated || 0) + 2000) { board = cb; selected = null; renderAll(); LS.set('current', board); toast('Loaded your latest board from your other device'); }
  } else if (board.widgets.length) Cloud.put('current', { board }, 0);
  const docs = await Cloud.list();
  const all = savedBoards(); let changed = false;
  docs.forEach(d => {
    if (d.id.indexOf('board-') !== 0 || !d.data || !d.data.board) return;
    const b = normalizeBoard(d.data.board); if (!b) return;
    if (!all[b.id] || (all[b.id].updated || 0) < (b.updated || 0)) { all[b.id] = b; changed = true; }
  });
  Object.values(all).forEach(b => { if (!docs.some(d => d.id === 'board-' + b.id)) Cloud.put('board-' + b.id, { board: b }, 0); });
  if (changed) LS.set('boards', all);
  const sp = docs.find(d => d.id === 'spinPresets');
  if (sp && sp.data && Array.isArray(sp.data.list)) { const local = LS.get('spinPresets', []); if ((sp.data.updated || 0) > (LS.get('spinPresetsUpdated', 0))) { LS.set('spinPresets', sp.data.list); LS.set('spinPresetsUpdated', sp.data.updated); } else if (local.length) Cloud.put('spinPresets', { list: local, updated: Date.now() }, 0); }
}

/* ---------- boot ---------- */
function boot() {
  board = normalizeBoard(LS.get('current', null)) || newBoard();
  document.body.append(stage, dock, inkbar, exitBtn, toastEl, popupEl, tourEl);
  renderAll(); refreshDock();
  if (!prefs.tour) showTour(0);
  else toast('Tap anywhere to turn on sounds', 3500);
  Cloud.init();
  if (window.claude && typeof window.claude.use === 'function') window.claude.use('downloads').then(d => { Downloads = d; }).catch(() => { });
  setTimeout(() => Images.gc(), 5000);
}
