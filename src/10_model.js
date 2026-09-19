<script>
// ===== [1] core/model =====
const FA = {};
FA.E = 'e';
FA.setKey = (set) => [...set].sort(FA.cmpId).join(',');
FA.cmpId = (a, b) => {
  const na = a.match(/^([a-zA-Z]*)(\d+)$/), nb = b.match(/^([a-zA-Z]*)(\d+)$/);
  if (na && nb && na[1] === nb[1]) return (+na[2]) - (+nb[2]);
  return a < b ? -1 : a > b ? 1 : 0;
};
FA.sortIds = (arr) => [...arr].sort(FA.cmpId);
FA.setLabel = (set) => '{' + FA.sortIds(set).join(',') + '}';

class Automaton {
  constructor(o = {}) {
    this.name = o.name || 'M';
    this.alphabet = o.alphabet ? [...o.alphabet] : ['a', 'b'];
    this.states = (o.states || []).map(s => ({ id: s.id, label: s.label ?? s.id, x: s.x ?? 0, y: s.y ?? 0, isStart: !!s.isStart, isFinal: !!s.isFinal }));
    this.transitions = (o.transitions || []).map(t => ({ from: t.from, symbol: t.symbol, to: t.to }));
    this.meta = o.meta || {};
  }
  static fromJSON(j) { return new Automaton(typeof j === 'string' ? JSON.parse(j) : j); }
  toJSON() { return { name: this.name, alphabet: this.alphabet, states: this.states, transitions: this.transitions, meta: this.meta }; }
  clone() { return Automaton.fromJSON(JSON.parse(JSON.stringify(this.toJSON()))); }
  get start() { const s = this.states.find(s => s.isStart); return s ? s.id : null; }
  ids() { return this.states.map(s => s.id); }
  state(id) { return this.states.find(s => s.id === id); }
  finals() { return new Set(this.states.filter(s => s.isFinal).map(s => s.id)); }
  isFinal(id) { const s = this.state(id); return !!(s && s.isFinal); }
  trans(q, sym) { return this.transitions.filter(t => t.from === q && t.symbol === sym).map(t => t.to); }
  hasEpsilon() { return this.transitions.some(t => t.symbol === FA.E); }
  isDeterministic() {
    if (this.hasEpsilon()) return false;
    for (const q of this.ids()) for (const a of this.alphabet) if (this.trans(q, a).length !== 1) return false;
    return true;
  }
  isComplete() { for (const q of this.ids()) for (const a of this.alphabet) if (this.trans(q, a).length === 0) return false; return true; }
  isNondetChoice() { for (const q of this.ids()) for (const a of this.alphabet) if (this.trans(q, a).length > 1) return true; return false; }
  kind() {
    if (!this.states.length) return 'empty';
    if (this.isDeterministic()) return 'DFA';
    if (this.hasEpsilon()) return 'NFA-e';
    if (this.isNondetChoice()) return 'NFA';
    return 'DFA-incomplete';
  }
  freshId(prefix = 'q') {
    let i = 0; while (this.state(prefix + i)) i++; return prefix + i;
  }
  addState(o = {}) {
    const id = o.id || this.freshId();
    const st = { id, label: o.label ?? id, x: o.x ?? 100, y: o.y ?? 100, isStart: !!o.isStart || this.states.length === 0, isFinal: !!o.isFinal };
    if (st.isStart) this.states.forEach(s => s.isStart = false);
    this.states.push(st); return st;
  }
  removeState(id) {
    this.states = this.states.filter(s => s.id !== id);
    this.transitions = this.transitions.filter(t => t.from !== id && t.to !== id);
  }
  renameState(id, label) { const s = this.state(id); if (s) s.label = label; }
  setStart(id) { this.states.forEach(s => s.isStart = s.id === id); }
  toggleFinal(id) { const s = this.state(id); if (s) s.isFinal = !s.isFinal; }
  addTransition(from, symbol, to) {
    if (!this.transitions.some(t => t.from === from && t.symbol === symbol && t.to === to)) this.transitions.push({ from, symbol, to });
  }
  removeTransition(from, symbol, to) { this.transitions = this.transitions.filter(t => !(t.from === from && t.symbol === symbol && t.to === to)); }
  removeEdge(from, to) { this.transitions = this.transitions.filter(t => !(t.from === from && t.to === to)); }
  setAlphabet(list) {
    this.alphabet = [...new Set(list.filter(s => s && s !== FA.E))];
    this.transitions = this.transitions.filter(t => t.symbol === FA.E || this.alphabet.includes(t.symbol));
  }
  // label helpers
  labelOf(id) { const s = this.state(id); return s ? s.label : id; }
  edgeLabel(from, to) {
    const syms = this.transitions.filter(t => t.from === from && t.to === to).map(t => t.symbol);
    const order = [...this.alphabet, FA.E];
    return syms.sort((a, b) => order.indexOf(a) - order.indexOf(b)).join(', ');
  }
  validate() {
    const w = [];
    if (!this.states.length) w.push('ยังไม่มี state');
    if (this.states.length && !this.start) w.push('ยังไม่มี start state');
    if (this.states.length && !this.states.some(s => s.isFinal)) w.push('ไม่มี final state — จะ reject ทุก string');
    return w;
  }
  tupleHTML() {
    const det = this.isDeterministic();
    const K = this.ids().map(id => this.labelOf(id)).join(', ');
    const F = [...this.finals()].map(id => this.labelOf(id)).join(', ');
    const d = det ? 'δ' : 'Δ';
    const trs = this.transitions.map(t => det ? `((${this.labelOf(t.from)}, ${t.symbol}), ${this.labelOf(t.to)})` : `(${this.labelOf(t.from)}, ${t.symbol}, ${this.labelOf(t.to)})`);
    return `<span class="k">M</span> = (K, Σ, ${d}, s, F)<br>` +
      `<span class="k">K</span> = {${K}}<br><span class="k">Σ</span> = {${this.alphabet.join(', ')}}<br>` +
      `<span class="k">s</span> = ${this.start ? this.labelOf(this.start) : '?'}<br><span class="k">F</span> = {${F}}<br>` +
      `<span class="k">${d}</span> = {${trs.join(', ') || ' '}}`;
  }
  static fromTable(spec) {
    // spec: { alphabet, start, finals:[], rows:{q:{a:'q1'|'q1,q2'|''}}, eps:{q:[...]}, pos:{q:[x,y]} }
    const A = new Automaton({ alphabet: spec.alphabet, name: spec.name });
    const ids = Object.keys(spec.rows);
    ids.forEach((id, i) => {
      const p = spec.pos && spec.pos[id];
      A.states.push({ id, label: spec.labels && spec.labels[id] || id, x: p ? p[0] : 0, y: p ? p[1] : 0, isStart: id === spec.start, isFinal: (spec.finals || []).includes(id) });
    });
    for (const id of ids) {
      for (const a of spec.alphabet) {
        const tgt = spec.rows[id][a];
        if (tgt) String(tgt).split(',').map(s => s.trim()).filter(Boolean).forEach(t => A.addTransition(id, a, t));
      }
      if (spec.eps && spec.eps[id]) spec.eps[id].forEach(t => A.addTransition(id, FA.E, t));
    }
    if (!spec.pos) FA.layoutCircle(A);
    return A;
  }
}
FA.Automaton = Automaton;

FA.layoutCircle = (A, cx = 300, cy = 200, r = null) => {
  const n = A.states.length; if (!n) return;
  r = r ?? Math.min(150, 40 + n * 22);
  const start = A.states.findIndex(s => s.isStart);
  A.states.forEach((s, i) => {
    const k = (i - (start < 0 ? 0 : start) + n) % n;
    const ang = Math.PI + (2 * Math.PI * k) / n;
    s.x = Math.round(cx + r * Math.cos(ang)); s.y = Math.round(cy + r * Math.sin(ang));
  });
};
FA.layoutLayers = (A, x0 = 80, y0 = 200, dx = 130, dy = 90) => {
  const s = A.start; if (!s) return FA.layoutCircle(A);
  const depth = { [s]: 0 }; const q = [s];
  while (q.length) { const u = q.shift(); for (const t of A.transitions.filter(t => t.from === u)) if (!(t.to in depth)) { depth[t.to] = depth[u] + 1; q.push(t.to); } }
  let maxd = 0; for (const id of A.ids()) { if (!(id in depth)) depth[id] = ++maxd + 100; }
  const cols = {}; for (const id of A.ids()) (cols[depth[id]] ||= []).push(id);
  const keys = Object.keys(cols).map(Number).sort((a, b) => a - b);
  keys.forEach((d, ci) => { const col = cols[d]; col.forEach((id, ri) => { const st = A.state(id); st.x = x0 + ci * dx; st.y = y0 + (ri - (col.length - 1) / 2) * dy; }); });
};
</script>
