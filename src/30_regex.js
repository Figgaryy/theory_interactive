<script>
// ===== [3] core/regex — parser, printer, simplifier, Thompson, state elimination, R(i,j,k) =====
(() => {
const E = FA.E;
const RX = {};
FA.RX = RX;
const SYM = (c) => ({ t: 'sym', c }), EPS = { t: 'eps' }, EMPTY = { t: 'empty' };
const CAT = (l, r) => ({ t: 'cat', l, r }), OR = (l, r) => ({ t: 'or', l, r }), STAR = (x) => ({ t: 'star', x });
RX.SYM = SYM; RX.EPS = EPS; RX.EMPTY = EMPTY; RX.CAT = CAT; RX.OR = OR; RX.STAR = STAR;

RX.tokenize = (s) => {
  const toks = [];
  for (const ch of s.replace(/\s+/g, '')) {
    if (ch === '(' || ch === ')' || ch === '*') toks.push({ k: ch });
    else if (ch === '∪' || ch === '|' || ch === 'U' || ch === '+') toks.push({ k: 'or' });
    else if (ch === 'e' || ch === 'ε' || ch === 'ϵ') toks.push({ k: 'eps' });
    else if (ch === '∅' || ch === 'Ø') toks.push({ k: 'empty' });
    else toks.push({ k: 'sym', c: ch });
  }
  return toks;
};
RX.parse = (s) => {
  const toks = RX.tokenize(s); let i = 0;
  const peek = () => toks[i], next = () => toks[i++];
  const atom = () => {
    const t = next(); if (!t) throw new Error('จบ expression กะทันหัน');
    if (t.k === '(') { const x = orx(); const c = next(); if (!c || c.k !== ')') throw new Error('ขาด )'); return x; }
    if (t.k === 'sym') return SYM(t.c);
    if (t.k === 'eps') return EPS;
    if (t.k === 'empty') return EMPTY;
    throw new Error(`ไม่คาดว่าจะเจอ '${t.k}' ที่ตำแหน่ง ${i}`);
  };
  const starx = () => { let x = atom(); while (peek() && peek().k === '*') { next(); x = STAR(x); } return x; };
  const catx = () => { let x = starx(); while (peek() && (peek().k === 'sym' || peek().k === '(' || peek().k === 'eps' || peek().k === 'empty')) x = CAT(x, starx()); return x; };
  const orx = () => { let x = catx(); while (peek() && peek().k === 'or') { next(); x = OR(x, catx()); } return x; };
  if (!toks.length) return EPS;
  const r = orx();
  if (i < toks.length) throw new Error(`มี token เกินที่ตำแหน่ง ${i}: '${toks[i].k}'`);
  return r;
};
const prec = { or: 0, cat: 1, star: 2, sym: 3, eps: 3, empty: 3 };
RX.print = (n) => {
  const p = (x, need) => { const s = RX.print(x); return prec[x.t] < need ? '(' + s + ')' : s; };
  switch (n.t) {
    case 'sym': return n.c; case 'eps': return 'e'; case 'empty': return '∅';
    case 'cat': return p(n.l, 1) + p(n.r, 1);
    case 'or': return p(n.l, 0) + ' ∪ ' + p(n.r, 0);
    case 'star': return p(n.x, 3) + '*';
  }
};
RX.eq = (a, b) => RX.print(a) === RX.print(b);
RX.simplify = (n) => {
  if (!n) return EMPTY;
  const isEpsOr = (x) => x.t === 'or' && RX.alts(x).some(a => a.t === 'eps');
  const dropEps = (x) => { const as = RX.alts(x).filter(a => a.t !== 'eps'); return as.length ? as.reduce((p, q) => OR(p, q)) : EPS; };
  switch (n.t) {
    case 'cat': {
      const l = RX.simplify(n.l), r = RX.simplify(n.r);
      if (l.t === 'empty' || r.t === 'empty') return EMPTY;
      if (l.t === 'eps') return r; if (r.t === 'eps') return l;
      // X* X* = X*
      if (l.t === 'star' && r.t === 'star' && RX.eq(l.x, r.x)) return l;
      // X* (e ∪ X) = X*   and   (e ∪ X) X* = X*
      if (l.t === 'star' && isEpsOr(r) && RX.eq(dropEps(r), l.x)) return l;
      if (r.t === 'star' && isEpsOr(l) && RX.eq(dropEps(l), r.x)) return r;
      return CAT(l, r);
    }
    case 'or': {
      const l = RX.simplify(n.l), r = RX.simplify(n.r);
      const seen = new Set(); let alts = [];
      for (const a of [...RX.alts(l), ...RX.alts(r)]) { if (a.t === 'empty') continue; const k = RX.print(a); if (!seen.has(k)) { seen.add(k); alts.push(a); } }
      // if X* is an alternative, drop alternatives e and X (they are already inside X*)
      const stars = alts.filter(a => a.t === 'star');
      if (stars.length) alts = alts.filter(a => !(a.t === 'eps' || stars.some(s => RX.eq(s.x, a))));
      if (!alts.length) return EMPTY;
      return alts.reduce((p, q) => OR(p, q));
    }
    case 'star': {
      let x = RX.simplify(n.x);
      if (x.t === 'empty' || x.t === 'eps') return EPS;
      if (x.t === 'star') return x;
      // (e ∪ X)* = X*
      if (isEpsOr(x)) { x = dropEps(x); if (x.t === 'star') return x; }
      return STAR(x);
    }
    default: return n;
  }
};
// ---- explain: split a string into pieces according to the regex (backtracking, greedy star) ----
// result: { ok, pieces: [piece], maxPos, steps }  piece = { kind:'sym'|'eps'|'or'|'star', regex, text, rounds?:[pieces[]] , chosen?:string, inner?:pieces }
RX.explain = (ast, w, limit = 20000) => {
  let steps = 0, maxPos = 0; const budget = () => { if (++steps > limit) throw new Error('budget'); };
  const m = (n, i, k) => {
    budget(); if (i > maxPos) maxPos = i;
    switch (n.t) {
      case 'sym': if (w[i] === n.c) { if (i + 1 > maxPos) maxPos = i + 1; return k(i + 1, [{ kind: 'sym', regex: n.c, text: n.c }]); } return false;
      case 'eps': return k(i, [{ kind: 'eps', regex: 'e', text: '' }]);
      case 'empty': return false;
      case 'cat': return m(n.l, i, (j, a) => m(n.r, j, (j2, b) => k(j2, a.concat(b))));
      case 'or': return m(n.l, i, (j, a) => k(j, [{ kind: 'or', regex: RX.print(n), chosen: RX.print(n.l), text: a.map(x => x.text).join(''), inner: a }])) || m(n.r, i, (j, a) => k(j, [{ kind: 'or', regex: RX.print(n), chosen: RX.print(n.r), text: a.map(x => x.text).join(''), inner: a }]));
      case 'star': {
        const rx = RX.print(n);
        const go = (pos, rounds) => (
          // greedy: try one more round first (must consume ≥1 char), then stop
          m(n.x, pos, (j, a) => j > pos && go(j, rounds.concat([a]))) ||
          k(pos, [{ kind: 'star', regex: rx, inner: n.x, text: rounds.map(r => r.map(x => x.text).join('')).join(''), rounds }]));
        return go(i, []);
      }
    }
    return false;
  };
  let out = null;
  try { m(ast, 0, (j, pieces) => { if (j === w.length) { out = pieces; return true; } return false; }); }
  catch (e) { if (e.message !== 'budget') throw e; return { ok: false, pieces: [], maxPos, steps, tooLong: true }; }
  return { ok: !!out, pieces: out || [], maxPos: Math.min(maxPos, w.length), steps };
};
RX.alts = (n) => n.t === 'or' ? [...RX.alts(n.l), ...RX.alts(n.r)] : [n];
RX.astTree = (n, depth = 0) => {
  const pad = '  '.repeat(depth);
  switch (n.t) {
    case 'sym': return pad + `sym "${n.c}"`; case 'eps': return pad + 'e'; case 'empty': return pad + '∅';
    case 'cat': return pad + 'concat\n' + RX.astTree(n.l, depth + 1) + '\n' + RX.astTree(n.r, depth + 1);
    case 'or': return pad + 'union ∪\n' + RX.astTree(n.l, depth + 1) + '\n' + RX.astTree(n.r, depth + 1);
    case 'star': return pad + 'star *\n' + RX.astTree(n.x, depth + 1);
  }
};

// ---- Thompson-style construction following Theorem 2.3.1 ----
const tidy = (A) => {
  // relabel states q0..qn in BFS order from start, keep structure
  const order = []; const seen = new Set(); const q = [A.start]; seen.add(A.start);
  while (q.length) { const u = q.shift(); order.push(u); for (const t of A.transitions) if (t.from === u && !seen.has(t.to)) { seen.add(t.to); q.push(t.to); } }
  for (const id of A.ids()) if (!seen.has(id)) order.push(id);
  const map = {}; order.forEach((id, i) => map[id] = 'q' + i);
  const B = new FA.Automaton({ alphabet: A.alphabet, name: A.name });
  B.states = order.map(id => { const s = A.state(id); return { ...s, id: map[id], label: map[id] }; });
  B.transitions = A.transitions.map(t => ({ from: map[t.from], symbol: t.symbol, to: map[t.to] }));
  const m = A.meta || {};
  B.meta = { added: (m.added || []).map(t => ({ from: map[t.from], to: map[t.to] })), addedStates: (m.addedStates || []).map(id => map[id]) };
  FA.layoutSnake(B);
  return B;
};
RX.toNFA = (ast, alphabet) => {
  const stages = [];
  const alpha = alphabet || [...new Set(RX.symbols(ast))];
  const single = (isFinal, label) => { const A = new FA.Automaton({ alphabet: alpha }); A.states.push({ id: 'q0', label: 'q0', x: 60, y: 200, isStart: true, isFinal }); return A; };
  const build = (n) => {
    let A, desc;
    switch (n.t) {
      case 'sym': { A = single(false); A.states.push({ id: 'q1', label: 'q1', x: 180, y: 200, isStart: false, isFinal: true }); A.addTransition('q0', n.c, 'q1'); A.meta = { added: [{ from: 'q0', to: 'q1' }], addedStates: ['q0', 'q1'] }; desc = `สัญลักษณ์เดี่ยว "${n.c}": 2 state ต่อด้วยเส้น ${n.c}`; break; }
      case 'eps': { A = single(true); desc = 'e: state เดียวที่เป็นทั้ง start และ final (รับเฉพาะ string ว่าง)'; break; }
      case 'empty': { A = single(false); desc = '∅: state เดียวที่ไม่ final (ไม่รับอะไรเลย)'; break; }
      case 'cat': { const L = build(n.l), R = build(n.r); A = tidy(FA.concat(L, R).M); desc = `concat: e จากทุก final ของ [${RX.print(n.l)}] → start ของ [${RX.print(n.r)}]`; break; }
      case 'or': { const L = build(n.l), R = build(n.r); A = tidy(FA.union(L, R).M); desc = `union: start ใหม่ + e → start ของ [${RX.print(n.l)}] และ [${RX.print(n.r)}]`; break; }
      case 'star': { const X = build(n.x); A = tidy(FA.star(X).M); desc = `star: start ใหม่ (final) + e → start ของ [${RX.print(n.x)}] + e จาก final กลับไป start เดิม`; break; }
    }
    A.alphabet = alpha;
    stages.push({ regex: RX.print(n), desc, automaton: A.clone() });
    return A;
  };
  const nfa = build(ast);
  return { nfa, stages };
};
// ---- AST annotation: pre-order node ids ----
RX.annotate = (ast) => {
  let n = 0;
  const walk = (x) => { x.id = n++; if (x.t === 'cat' || x.t === 'or') { walk(x.l); walk(x.r); } else if (x.t === 'star') walk(x.x); };
  walk(ast);
  return n;
};

// ---- Compositional Thompson construction (Theorem 2.3.1): stable state ids + layout ----
const bbox = (A) => {
  const xs = A.states.map(s => s.x), ys = A.states.map(s => s.y);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
};
const shift = (A, dx, dy) => A.states.forEach(s => { s.x += dx; s.y += dy; });
const normalize = (A) => { const b = bbox(A); shift(A, -b.x0, -(b.y0 + b.y1) / 2); };
RX.buildNFA = (ast, alphabet) => {
  const count = RX.annotate(ast);
  const alpha = alphabet || [...new Set(RX.symbols(ast))];
  let counter = 0; const fresh = () => 'q' + (counter++);
  const DX = 110, DY = 110;
  const stages = [];
  const build = (node) => {
    let M, added = [], addedStates = [];
    switch (node.t) {
      case 'sym': { M = new FA.Automaton({ alphabet: alpha }); const s = fresh(), f = fresh(); M.states.push({ id: s, label: s, x: 0, y: 0, isStart: true, isFinal: false }); M.states.push({ id: f, label: f, x: DX, y: 0, isStart: false, isFinal: true }); M.addTransition(s, node.c, f); added = [{ from: s, to: f }]; addedStates = [s, f]; break; }
      case 'eps': { M = new FA.Automaton({ alphabet: alpha }); const s = fresh(); M.states.push({ id: s, label: s, x: 0, y: 0, isStart: true, isFinal: true }); addedStates = [s]; break; }
      case 'empty': { M = new FA.Automaton({ alphabet: alpha }); const s = fresh(); M.states.push({ id: s, label: s, x: 0, y: 0, isStart: true, isFinal: false }); addedStates = [s]; break; }
      case 'cat': { const L = build(node.l), R = build(node.r); M = new FA.Automaton({ alphabet: alpha }); const bL = bbox(L), bR = bbox(R); shift(R, bL.x1 + DX - bR.x0, 0); M.states = [...L.states, ...R.states]; M.transitions = [...L.transitions, ...R.transitions]; for (const f of L.finals()) { M.addTransition(f, E, R.start); M.state(f).isFinal = false; added.push({ from: f, to: R.start }); } break; }
      case 'or': { const L = build(node.l), R = build(node.r); M = new FA.Automaton({ alphabet: alpha }); const s = fresh(); M.states.push({ id: s, label: s, x: 0, y: 0, isStart: true, isFinal: false }); const bL = bbox(L), bR = bbox(R); shift(L, DX - bL.x0, -DY / 2 - (bL.y0 + bL.y1) / 2); shift(R, DX - bR.x0, DY / 2 - (bR.y0 + bR.y1) / 2); M.states = M.states.concat(L.states.map(st => ({ ...st, isStart: false })), R.states.map(st => ({ ...st, isStart: false }))); M.transitions = [...L.transitions, ...R.transitions]; M.addTransition(s, E, L.start); M.addTransition(s, E, R.start); added = [{ from: s, to: L.start }, { from: s, to: R.start }]; addedStates = [s]; break; }
      case 'star': { const X = build(node.x); M = new FA.Automaton({ alphabet: alpha }); const s = fresh(); M.states.push({ id: s, label: s, x: 0, y: 0, isStart: true, isFinal: true }); const bX = bbox(X); shift(X, DX - bX.x0, 0); M.states = M.states.concat(X.states.map(st => ({ ...st, isStart: false }))); M.transitions = [...X.transitions]; M.addTransition(s, E, X.start); added.push({ from: s, to: X.start }); for (const f of X.finals()) { M.addTransition(f, E, X.start); added.push({ from: f, to: X.start }); } addedStates = [s]; break; }
    }
    normalize(M);
    M.states.forEach(st => { st.x = Math.round(st.x); st.y = Math.round(st.y); });
    M.alphabet = alpha;
    M.meta = { added, addedStates };
    stages.push({ id: node.id, kind: node.t, regex: RX.print(node), children: node.t === 'cat' || node.t === 'or' ? [node.l.id, node.r.id] : node.t === 'star' ? [node.x.id] : [], automaton: M.clone(), added, addedStates, start: M.start, finals: [...M.finals()] });
    return M;
  };
  const root = build(ast);
  shift(root, 80, 230);
  root.states.forEach(st => { st.x = Math.round(st.x); st.y = Math.round(st.y); });
  return { nfa: root, stages, count };
};
RX.symbols = (n) => n.t === 'sym' ? [n.c] : n.t === 'cat' || n.t === 'or' ? [...RX.symbols(n.l), ...RX.symbols(n.r)] : n.t === 'star' ? RX.symbols(n.x) : [];

// ---- State elimination (generalized automaton) ----
class GA {
  constructor(A) {
    this.A = A; this.alphabet = A.alphabet;
    this.S = 's*'; this.Fn = 'f*';
    this.states = [this.S, ...A.ids(), this.Fn];
    this.labels = { [this.S]: 's', [this.Fn]: 'f' }; A.states.forEach(s => this.labels[s.id] = s.label);
    this.pos = { [this.S]: { x: 40, y: 200 }, [this.Fn]: { x: Math.max(...A.states.map(s => s.x)) + 120, y: 200 } };
    A.states.forEach(s => this.pos[s.id] = { x: s.x + 80, y: s.y });
    this.edges = {}; // key i|j → ast
    for (const t of A.transitions) this.addEdge(t.from, t.to, t.symbol === E ? EPS : SYM(t.symbol));
    this.addEdge(this.S, A.start, EPS);
    for (const f of A.finals()) this.addEdge(f, this.Fn, EPS);
    this.eliminated = []; this.log = [];
  }
  key(i, j) { return i + '|' + j; }
  edge(i, j) { return this.edges[this.key(i, j)] || null; }
  addEdge(i, j, ast) { const k = this.key(i, j); this.edges[k] = this.edges[k] ? RX.simplify(OR(this.edges[k], ast)) : ast; }
  alive() { return this.states.filter(s => !this.eliminated.includes(s)); }
  eliminate(q) {
    if (q === this.S || q === this.Fn || this.eliminated.includes(q)) return null;
    const gamma = this.edge(q, q);
    const ins = this.alive().filter(i => i !== q && this.edge(i, q));
    const outs = this.alive().filter(j => j !== q && this.edge(q, j));
    const pairs = [];
    for (const i of ins) for (const j of outs) {
      const alpha = this.edge(i, q), beta = this.edge(q, j), old = this.edge(i, j);
      const mid = gamma ? CAT(CAT(alpha, STAR(gamma)), beta) : CAT(alpha, beta);
      const raw = old ? OR(old, mid) : mid;
      const simp = RX.simplify(raw);
      pairs.push({ i, j, alpha, beta, gamma, old, raw, simp });
    }
    for (const p of pairs) this.edges[this.key(p.i, p.j)] = p.simp;
    for (const k of Object.keys(this.edges)) { const [i, j] = k.split('|'); if (i === q || j === q) delete this.edges[k]; }
    this.eliminated.push(q);
    const step = { q, pairs, gamma, ins, outs };
    this.log.push(step);
    return step;
  }
  result() { return this.edge(this.S, this.Fn) || EMPTY; }
  done() { return this.alive().length === 2; }
  formula(p) {
    const P = RX.print;
    const a = P(p.alpha), b = P(p.beta), g = p.gamma ? P(p.gamma) : null;
    const mid = g ? `(${a})(${g})*(${b})` : `(${a})(${b})`;
    return (p.old ? `(${P(p.old)}) ∪ ` : '') + mid + `  →  ${P(p.simp)}`;
  }
}
RX.GA = GA;

// ---- R(i,j,k) ----
RX.Rijk = (A) => {
  const ids = A.ids(); const n = ids.length; const memo = {};
  const base = (i, j) => {
    const syms = A.transitions.filter(t => t.from === ids[i] && t.to === ids[j]).map(t => t.symbol === E ? EPS : SYM(t.symbol));
    let r = syms.length ? syms.reduce((a, b) => OR(a, b)) : EMPTY;
    if (i === j) r = OR(EPS, r);
    return RX.simplify(r);
  };
  const R = (i, j, k) => {
    const key = i + ',' + j + ',' + k; if (memo[key]) return memo[key];
    let r;
    if (k === 0) r = base(i, j);
    else { const kk = k - 1; r = RX.simplify(OR(R(i, j, kk), CAT(CAT(R(i, k - 1, kk), STAR(R(k - 1, k - 1, kk))), R(k - 1, j, kk)))); }
    return memo[key] = r;
  };
  return { R, n, ids, language: () => { const fs = ids.map((id, j) => A.isFinal(id) ? j : -1).filter(j => j >= 0); const si = ids.indexOf(A.start); return RX.simplify(fs.map(j => R(si, j, n)).reduce((a, b) => OR(a, b), EMPTY)); } };
};
})();
</script>
