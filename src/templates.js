/* Starter boards */
const T = (type, x, y, w, hh, p, card) => ({ type, x, y, w, h: hh, p: p || {}, card: card || null });
const TEMPLATES = [
  { name: 'Bell Work', desc: 'Clock, date, learning target, bell-work box and a 5-minute timer', w: [
    T('clock', 1, 1, 8, 4), T('date', 10, 1, 11, 4), T('timer', 22, 1, 9, 9, { dur: 300, left: 300, style: 'pie', label: 'Bell work' }),
    T('target', 1, 6, 20, 5, { target: '', std: '', showAgenda: false }), T('text', 1, 12, 20, 5, { html: '<b>Bell work:</b> ' }), T('sign', 22, 11, 9, 4, { preset: 'work', idx: 0 })] },
  { name: 'Test Day', desc: 'Big timer, red stoplight, calculator sign and test reminders', w: [
    T('timer', 1, 1, 18, 10, { dur: 2700, left: 2700, style: 'digital', label: 'Test' }), T('stoplight', 20, 1, 4, 10, { on: 'red', labels: { red: 'Silent: testing', yellow: 'Quiet questions', green: 'Test is over' } }),
    T('sign', 25, 1, 7, 4, { preset: 'calc', idx: 0 }), T('reminders', 25, 6, 7, 9, { items: [{ id: 'r1', text: 'Name on your paper' }, { id: 'r2', text: 'Show your work' }, { id: 'r3', text: 'Check every answer' }, { id: 'r4', text: 'Turn it in face down' }] }),
    T('clock', 1, 12, 8, 4), T('text', 10, 12, 14, 4, { html: 'When you finish, read silently.', size: 1.4 })] },
  { name: 'Group Work', desc: 'Progress-bar timer, voice level, stoplight, group maker and norms', w: [
    T('timer', 1, 1, 16, 5, { dur: 900, left: 900, style: 'bar', label: 'Group work' }), T('volume', 18, 1, 9, 6, { level: 4 }), T('stoplight', 28, 1, 4, 10, { on: 'green' }),
    T('groups', 1, 7, 16, 9, { mode: 'size', n: 4 }), T('sign', 18, 8, 9, 4, { preset: 'work', idx: 2 }),
    T('reminders', 18, 13, 9, 4, { items: [{ id: 'g1', text: 'Everyone talks' }, { id: 'g2', text: 'Write it down' }] })] },
  { name: 'Study Hall', desc: 'Clock, period countdown, check-in checklist and a work timer', w: [
    T('clock', 1, 1, 8, 4), T('period', 10, 1, 11, 4), T('timer', 22, 1, 9, 9, { dur: 1200, left: 1200, style: 'pie', label: 'Work time' }),
    T('reminders', 1, 6, 12, 10, { items: [{ id: 's1', text: 'Check your school email' }, { id: 's2', text: 'Check your grades' }, { id: 's3', text: 'List any missing work' }, { id: 's4', text: 'Pick one assignment to finish' }] }),
    T('stoplight', 14, 6, 4, 10, { on: 'yellow', labels: { red: 'Silent work', yellow: 'Quiet work', green: 'Talk quietly' } }), T('sticky', 19, 11, 8, 5, { html: 'Need help? Raise your hand.' })] },
  { name: 'Review Game', desc: 'Scoreboard, question draw, spinner and dice', w: [
    T('score', 1, 1, 15, 6, { teams: [{ name: 'Team 1', score: 0, c: '#5DA9FF' }, { name: 'Team 2', score: 0, c: '#FF6B5E' }, { name: 'Team 3', score: 0, c: '#3DDC84' }] }),
    T('questions', 1, 8, 15, 8, { text: '' }), T('spinner', 17, 1, 8, 11), T('dice', 26, 1, 6, 6, { count: 2 }), T('timer', 26, 8, 6, 8, { dur: 60, left: 60, style: 'pie' })] }
];
function makeTemplate(tp) {
  const b = newBoard(); b.name = tp.name; b.id = uid();
  b.widgets = tp.w.map((t, i) => { const d = W[t.type]; return { id: uid(), type: t.type, x: t.x, y: t.y, w: t.w, h: t.h, z: i + 1, card: t.card, p: Object.assign(d.defaults ? d.defaults() : {}, clone(t.p)) }; });
  return normalizeBoard(b);
}
