<script>
// ===== [2] core/algorithms — pure functions, no DOM =====
(() => {
const E = FA.E;
const setEq = (a, b) => a.size === b.size && [...a].every(x => b.has(x));
const union = (...sets) => { const r = new Set(); for (const s of sets) for (const x of s) r.add(x); return r; };
FA.setEq = setEq; FA.setUnion = union;

// ---- e-Closure ----
// E1(q) = {q} ∪ {p | (q,e,p) ∈ Δ}
const E1 = (A, q) => new Set([q, ...A.trans(q, E)]);
// Synchronous iteration exactly like the lecturer's table: Iter(k+1)[q] = ⋃_{p ∈ Iter(k)[q]} Iter(k)[p]
FA.closureTable = (A) => {
  const ids = A.ids();
  const columns = [];
  let cur = {}; ids.forEach(q => cur[q] = E1(A, q));
  columns.push(cur);
  for (let k = 0; k < ids.length + 2; k++) {
    const next = {};
    for (const q of ids) next[q] = union(...[...cur[q]].map(p => cur[p]));
    columns.push(next);
    if (ids.every(q => setEq(next[q], cur[q]))) break;
    cur = next;
  }
  const E_ = columns[columns.length - 1];
  return { states: ids, columns, E: E_, convergedAt: columns.length };
};
FA.eClosure = (A, q) => FA.closureTable(A).E[q];
FA.closureOfSet = (A, set) => { const t = FA.closureTable(A).E; return union(...[...set].map(q => t[q] || new Set([q]))); };

// ---- DFA run ----
FA.runDFA = (A, w) => {
  const s = A.start; const steps = [];
  if (!s) return { accepted: false, reason: 'ไม่มี start state', steps };
  let q = s;
  steps.push({ state: q, remaining: w, pos: 0 });
  for (let i = 0; i < w.length; i++) {
    const a = w[i];
    if (!A.alphabet.includes(a)) return { accepted: false, reason: `สัญลักษณ์ '${a}' ไม่อยู่ใน Σ`, steps, stuckAt: i };
    const tg = A.trans(q, a);
    if (tg.length === 0) { steps[steps.length - 1].stuck = a; return { accepted: false, reason: `δ(${A.labelOf(q)}, ${a}) ไม่นิยาม — เครื่องติด (reject)`, steps, stuckAt: i }; }
    const nq = tg[0];
    steps[steps.length - 1].read = a; steps[steps.length - 1].next = nq;
    q = nq; steps.push({ state: q, remaining: w.slice(i + 1), pos: i + 1 });
  }
  const acc = A.isFinal(q);
  return { accepted: acc, final: q, reason: acc ? `อ่านหมดแล้วอยู่ที่ ${A.labelOf(q)} ∈ F` : `อ่านหมดแล้วอยู่ที่ ${A.labelOf(q)} ∉ F`, steps };
};

// ---- NFA run: active-set (Theorem 2.6.3) + computation tree ----
FA.runNFA = (A, w, opts = {}) => {
  const s = A.start;
  if (!s) return { accepted: false, reason: 'ไม่มี start state', sets: [], tree: null };
  const Et = FA.closureTable(A).E;
  const cl = (set) => union(...[...set].map(q => Et[q]));
  const sets = [];
  let S = cl(new Set([s]));
  sets.push({ set: S, pos: 0, formula: `S₀ = E(${A.labelOf(s)})` });
  for (let i = 0; i < w.length; i++) {
    const a = w[i];
    const contrib = [];
    for (const q of S) for (const p of A.trans(q, a)) contrib.push({ q, p });
    const moved = new Set(contrib.map(c => c.p));
    S = cl(moved);
    sets.push({ set: S, pos: i + 1, sym: a, contrib, moved, formula: `S${sub(i + 1)} = ⋃ E(p) สำหรับ (q, ${a}, p) ∈ Δ, q ∈ S${sub(i)}` });
    if (!A.alphabet.includes(a)) break;
  }
  const F = A.finals();
  const accepted = [...S].some(q => F.has(q));
  // tree
  const maxNodes = opts.maxNodes || 600; let count = 0;
  const build = (state, pos, via, onPath) => {
    const node = { state, pos, via, children: [], status: 'cont' };
    count++;
    const key = state + '@' + pos;
    if (onPath.has(key)) { node.status = 'dup'; return node; }
    const np = new Set(onPath); np.add(key);
    if (count > maxNodes) { node.status = 'cut'; return node; }
    const nexts = [];
    for (const p of A.trans(state, E)) nexts.push({ p, sym: E, npos: pos });
    if (pos < w.length) for (const p of A.trans(state, w[pos])) nexts.push({ p, sym: w[pos], npos: pos + 1 });
    if (pos === w.length && F.has(state)) node.status = 'acc';
    if (!nexts.length) { if (node.status !== 'acc') node.status = 'dead'; return node; }
    for (const n of nexts) node.children.push(build(n.p, n.npos, n.sym, np));
    if (node.status !== 'acc') node.status = node.children.some(c => c.status === 'acc' || c.status === 'subacc') ? 'subacc' : 'dead';
    return node;
  };
  const tree = build(s, 0, null, new Set());
  return { accepted, sets, tree, final: S, reason: accepted ? `S${sub(w.length)} ∩ F ≠ ∅` : `S${sub(w.length)} ∩ F = ∅` };
};
const sub = (n) => String(n).replace(/\d/g, d => '₀₁₂₃₄₅₆₇₈₉'[d]);
FA.sub = sub;
FA.accepts = (A, w) => (A.isDeterministic() ? FA.runDFA(A, w) : FA.runNFA(A, w)).accepted;

// ---- Powerset construction ----
FA.powerset = (A) => {
  const s = A.start;
  const table = FA.closureTable(A);
  const Et = table.E;
  const F = A.finals();
  const keyOf = (set) => set.size ? FA.setKey(set) : '∅';
  const rows = []; const rowByKey = {};
  const steps = [];
  const addRow = (set) => {
    const key = keyOf(set);
    if (rowByKey[key]) return { row: rowByKey[key], isNew: false };
    const row = { Q: set, key, cells: {}, isFinal: [...set].some(q => F.has(q)), isStart: rows.length === 0, index: rows.length };
    rows.push(row); rowByKey[key] = row; return { row, isNew: true };
  };
  const S0 = Et[s];
  addRow(S0);
  steps.push({ kind: 'start', Q: S0, text: `s′ = E(${A.labelOf(s)}) = ${FA.setLabel(S0)}` });
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (const a of A.alphabet) {
      const contrib = [];
      for (const q of FA.sortIds(row.Q)) for (const p of A.trans(q, a)) contrib.push({ q, p });
      const result = union(...contrib.map(c => Et[c.p]));
      const { row: target, isNew } = addRow(result);
      row.cells[a] = { contrib, result, targetKey: target.key, isNew };
      steps.push({ kind: 'cell', row: r, sym: a, contrib, result, isNew, targetKey: target.key });
    }
  }
  steps.push({ kind: 'done' });
  // build DFA
  const D = new FA.Automaton({ alphabet: A.alphabet, name: A.name + "′" });
  rows.forEach((row) => {
    D.states.push({ id: row.key, label: row.key === '∅' ? '∅' : FA.setLabel(row.Q), x: 0, y: 0, isStart: row.isStart, isFinal: row.isFinal });
  });
  rows.forEach(row => { for (const a of A.alphabet) D.addTransition(row.key, a, row.cells[a].targetKey); });
  FA.layoutLayers(D, 110, 230, 190, 110);
  return { dfa: D, table, rows, steps };
};

// ---- reachability / completion ----
FA.reachable = (A) => {
  const s = A.start; const R = new Set(); const steps = [];
  if (!s) return { set: R, steps };
  R.add(s); steps.push({ added: s, via: null });
  const q = [s];
  while (q.length) {
    const u = q.shift();
    for (const a of [...A.alphabet, E]) for (const v of A.trans(u, a)) if (!R.has(v)) { R.add(v); steps.push({ added: v, via: { from: u, sym: a } }); q.push(v); }
  }
  return { set: R, steps };
};
FA.removeUnreachable = (A) => {
  const { set, steps } = FA.reachable(A);
  const B = A.clone();
  const removed = B.ids().filter(id => !set.has(id));
  removed.forEach(id => B.removeState(id));
  return { dfa: B, removed, steps };
};
FA.complete = (A) => {
  const B = A.clone();
  const missing = [];
  for (const q of B.ids()) for (const a of B.alphabet) if (B.trans(q, a).length === 0) missing.push([q, a]);
  if (!missing.length) return { dfa: B, added: false, trapId: null, missing };
  const trap = B.addState({ id: B.state('trap') ? B.freshId('trap') : 'trap', label: 'trap', x: 520, y: 340, isStart: false, isFinal: false });
  for (const [q, a] of missing) B.addTransition(q, a, trap.id);
  for (const a of B.alphabet) B.addTransition(trap.id, a, trap.id);
  return { dfa: B, added: true, trapId: trap.id, missing };
};

// ---- Minimization (partition refinement, Lemma 2.5.1) ----
FA.minimize = (A0) => {
  if (A0.hasEpsilon() || A0.isNondetChoice()) return { error: 'ต้องเป็น DFA ก่อน — ใช้ module NFA→DFA แปลงก่อน' };
  const ru = FA.removeUnreachable(A0);
  const cp = FA.complete(ru.dfa);
  const A = cp.dfa;
  const ids = A.ids(); const F = A.finals();
  const finals = ids.filter(q => F.has(q)), nonf = ids.filter(q => !F.has(q));
  let P = [finals, nonf].filter(b => b.length).map(b => FA.sortIds(b));
  const iterations = [];
  const blockOf = (P) => { const m = {}; P.forEach((b, i) => b.forEach(q => m[q] = i)); return m; };
  iterations.push({ n: 0, partition: P.map(b => [...b]), splits: [], table: null, note: '≡₀: แยกตาม final / ไม่ final' });
  for (let n = 1; n <= ids.length + 1; n++) {
    const bo = blockOf(P);
    const table = ids.map(q => ({ q, block: bo[q], sig: Object.fromEntries(A.alphabet.map(a => [a, bo[A.trans(q, a)[0]]])) }));
    const sigStr = (q) => A.alphabet.map(a => bo[A.trans(q, a)[0]]).join('|');
    const newP = []; const splits = [];
    for (const b of P) {
      const groups = {}; for (const q of b) (groups[sigStr(q)] ||= []).push(q);
      const gs = Object.values(groups);
      if (gs.length > 1) {
        const reason = [];
        const [g1, g2] = gs;
        const a = A.alphabet.find(a => bo[A.trans(g1[0], a)[0]] !== bo[A.trans(g2[0], a)[0]]);
        reason.push(`${A.labelOf(g1[0])} กับ ${A.labelOf(g2[0])} แยกกัน เพราะ δ(${A.labelOf(g1[0])},${a}) อยู่กลุ่ม ${bo[A.trans(g1[0], a)[0]] + 1} แต่ δ(${A.labelOf(g2[0])},${a}) อยู่กลุ่ม ${bo[A.trans(g2[0], a)[0]] + 1}`);
        splits.push({ block: [...b], into: gs.map(g => [...g]), reason: reason.join('; ') });
      }
      gs.forEach(g => newP.push(FA.sortIds(g)));
    }
    const changed = newP.length !== P.length;
    iterations.push({ n, partition: newP.map(b => [...b]), splits, table, note: changed ? `≡${sub(n)}: แยกได้ ${splits.length} กลุ่ม` : `≡${sub(n)} = ≡${sub(n - 1)} → CONVERGED` });
    P = newP;
    if (!changed) break;
  }
  // build minimized DFA
  const bo = blockOf(P);
  const M = new FA.Automaton({ alphabet: A.alphabet, name: A0.name + ' (min)' });
  const s = A.start;
  const blockLabel = (b) => b.length === 1 ? A.labelOf(b[0]) : FA.setLabel(b.map(q => A.labelOf(q)));
  P.forEach((b, i) => M.states.push({ id: 'B' + i, label: blockLabel(b), x: 0, y: 0, isStart: b.includes(s), isFinal: F.has(b[0]) }));
  P.forEach((b, i) => { for (const a of A.alphabet) M.addTransition('B' + i, a, 'B' + bo[A.trans(b[0], a)[0]]); });
  // drop trap block if it was added and stays a lone non-final sink → keep (so DFA stays complete). Mark meta.
  FA.layoutLayers(M, 110, 220, 170, 100);
  return { dfa: M, prep: { removed: ru.removed, reachSteps: ru.steps, trapAdded: cp.added, trapId: cp.trapId, completed: A }, iterations, partition: P, mapping: bo };
};

// ---- closure constructions ----
const relabel = (A, prefix, primes) => {
  const B = new FA.Automaton({ alphabet: A.alphabet, name: A.name });
  const map = {};
  A.states.forEach(s => { map[s.id] = prefix + s.id; B.states.push({ ...s, id: prefix + s.id, label: s.label + (primes ? '′' : '') }); });
  A.transitions.forEach(t => B.transitions.push({ from: map[t.from], symbol: t.symbol, to: map[t.to] }));
  return { B, map };
};
const shift = (A, dx, dy) => A.states.forEach(s => { s.x += dx; s.y += dy; });
FA.union = (A1, A2) => {
  const a = relabel(A1, 'a:', false), b = relabel(A2, 'b:', true);
  const M = new FA.Automaton({ alphabet: [...new Set([...A1.alphabet, ...A2.alphabet])], name: 'M₁ ∪ M₂' });
  shift(a.B, 120, -110); shift(b.B, 120, 110);
  M.states = [{ id: 's', label: 's', x: 40, y: 200, isStart: true, isFinal: false }, ...a.B.states.map(s => ({ ...s, isStart: false })), ...b.B.states.map(s => ({ ...s, isStart: false }))];
  M.transitions = [...a.B.transitions, ...b.B.transitions];
  M.addTransition('s', E, a.map[A1.start]); M.addTransition('s', E, b.map[A2.start]);
  M.meta = { added: [{ from: 's', to: a.map[A1.start] }, { from: 's', to: b.map[A2.start] }], addedStates: ['s'] };
  return { M, added: ['s'], maps: { a: a.map, b: b.map }, note: 's ใหม่ + (s, e, s₁), (s, e, s₂); F = F₁ ∪ F₂' };
};
FA.concat = (A1, A2) => {
  const a = relabel(A1, 'a:', false), b = relabel(A2, 'b:', true);
  const M = new FA.Automaton({ alphabet: [...new Set([...A1.alphabet, ...A2.alphabet])], name: 'M₁M₂' });
  const w = Math.max(...A1.states.map(s => s.x)) + 120;
  shift(b.B, w, 0);
  M.states = [...a.B.states.map(s => ({ ...s, isFinal: false })), ...b.B.states.map(s => ({ ...s, isStart: false }))];
  M.transitions = [...a.B.transitions, ...b.B.transitions];
  for (const f of A1.finals()) M.addTransition(a.map[f], E, b.map[A2.start]);
  M.meta = { added: [...A1.finals()].map(f => ({ from: a.map[f], to: b.map[A2.start] })), addedStates: [] };
  return { M, maps: { a: a.map, b: b.map }, note: 'e จากทุก f ∈ F₁ → s₂; F = F₂ (state ของ M₁ เลิกเป็น final)' };
};
FA.star = (A1) => {
  const a = relabel(A1, 'a:', false);
  const M = new FA.Automaton({ alphabet: A1.alphabet, name: 'M₁*' });
  shift(a.B, 110, 0);
  M.states = [{ id: 's', label: 's', x: 40, y: a.B.state(a.map[A1.start]).y, isStart: true, isFinal: true }, ...a.B.states.map(s => ({ ...s, isStart: false }))];
  M.transitions = [...a.B.transitions];
  M.addTransition('s', E, a.map[A1.start]);
  for (const f of A1.finals()) M.addTransition(a.map[f], E, a.map[A1.start]);
  M.meta = { added: [{ from: 's', to: a.map[A1.start] }, ...[...A1.finals()].map(f => ({ from: a.map[f], to: a.map[A1.start] }))], addedStates: ['s'] };
  return { M, maps: { a: a.map }, note: 's ใหม่ (เป็น final เพื่อรับ e) + (s, e, s₁) + e จากทุก f ∈ F₁ กลับไป s₁' };
};
FA.complement = (A1) => {
  if (A1.hasEpsilon() || A1.isNondetChoice()) return { error: 'Complement ต้องทำกับ DFA เท่านั้น (Problem 2.3.1) — แปลงเป็น DFA ก่อน' };
  const c = FA.complete(A1);
  const M = c.dfa; M.name = '¬M₁';
  M.states.forEach(s => s.isFinal = !s.isFinal);
  return { M, note: (c.added ? 'เพิ่ม trap state ให้ complete ก่อน แล้ว' : '') + 'สลับ F ↔ K − F' };
};
FA.product = (A1, A2, mode = 'and') => {
  if (A1.hasEpsilon() || A1.isNondetChoice() || A2.hasEpsilon() || A2.isNondetChoice()) return { error: 'Product construction ต้องใช้ DFA ทั้งคู่' };
  const alphabet = [...new Set([...A1.alphabet, ...A2.alphabet])];
  const c1 = FA.complete(new FA.Automaton({ ...A1.toJSON(), alphabet })).dfa, c2 = FA.complete(new FA.Automaton({ ...A2.toJSON(), alphabet })).dfa;
  const M = new FA.Automaton({ alphabet, name: mode === 'and' ? 'M₁ × M₂ (∩)' : 'M₁ × M₂ (∪)' });
  const id = (p, q) => p + '|' + q;
  const seen = new Set(); const queue = [[c1.start, c2.start]];
  seen.add(id(c1.start, c2.start));
  while (queue.length) {
    const [p, q] = queue.shift();
    const f1 = c1.isFinal(p), f2 = c2.isFinal(q);
    M.states.push({ id: id(p, q), label: `(${c1.labelOf(p)},${c2.labelOf(q)})`, x: 0, y: 0, isStart: p === c1.start && q === c2.start, isFinal: mode === 'and' ? (f1 && f2) : (f1 || f2) });
    for (const a of alphabet) {
      const p2 = c1.trans(p, a)[0], q2 = c2.trans(q, a)[0];
      M.addTransition(id(p, q), a, id(p2, q2));
      if (!seen.has(id(p2, q2))) { seen.add(id(p2, q2)); queue.push([p2, q2]); }
    }
  }
  FA.layoutLayers(M, 90, 200, 150, 90);
  return { M, note: 'state = คู่ (p, q); δ((p,q),a) = (δ₁(p,a), δ₂(q,a)); final เมื่อ' + (mode === 'and' ? 'ทั้งคู่ final' : 'อย่างน้อยหนึ่ง final') };
};

// ---- closure constructions as step-by-step stages (for the UI) ----
// A string that shows why swapping finals in an NFA is not complement:
// it has one run ending in F and another ending outside F.
FA.nfaComplementCounterexample = (A, maxLen = 6) => {
  const F = A.finals();
  for (const w of FA.stringsUpTo(A.alphabet, maxLen)) {
    const S = FA.runNFA(A, w).final;
    const inF = [...S].filter(q => F.has(q)), outF = [...S].filter(q => !F.has(q));
    if (inF.length && outF.length) return { w, inF, outF };
  }
  return null;
};
FA.closureStages = (op, A1, A2) => {
  const stages = []; const push = (key, automaton, hl = {}, info = {}) => stages.push({ key, automaton, hl, info });
  const strip = (M, pred) => { const B = M.clone(); B.transitions = B.transitions.filter(t => !pred(t)); return B; };
  if (op === 'union') {
    const r = FA.union(A1, A2); const M = r.M; const s1 = r.maps.a[A1.start], s2 = r.maps.b[A2.start];
    const placed = strip(M, t => t.from === 's'); placed.states = placed.states.filter(s => s.id !== 's'); placed.state(s1).isStart = true; placed.state(s2).isStart = true;
    push('place', placed, {}, { s1, s2 });
    const withS = strip(M, t => t.from === 's'); withS.state(s1).isStart = true; withS.state(s2).isStart = true; withS.state('s').isStart = true;
    push('newStart', withS, { states: ['s'] }, { s: 's' });
    push('eps', M, { states: ['s'], transitions: M.meta.added }, { s: 's', s1, s2 });
    push('finals', M, { accept: [...M.finals()] }, { F: [...M.finals()] });
    return { M, stages, maps: r.maps };
  }
  if (op === 'concat') {
    const r = FA.concat(A1, A2); const M = r.M; const s1 = r.maps.a[A1.start], s2 = r.maps.b[A2.start]; const F1 = [...A1.finals()].map(f => r.maps.a[f]);
    const isAdded = (t) => t.symbol === E && M.meta.added.some(a => a.from === t.from && a.to === t.to); const placed = strip(M, isAdded); F1.forEach(f => placed.state(f).isFinal = true); placed.state(s2).isStart = true;
    push('place', placed, {}, { s1, s2, F1 });
    const eps = M.clone(); F1.forEach(f => eps.state(f).isFinal = true); eps.state(s2).isStart = true;
    push('eps', eps, { transitions: M.meta.added, states: [s2] }, { F1, s2 });
    push('finals', M, { accept: [...M.finals()], states: [s1] }, { F1, F2: [...M.finals()], s1 });
    return { M, stages, maps: r.maps };
  }
  if (op === 'star') {
    const r = FA.star(A1); const M = r.M; const s1 = r.maps.a[A1.start]; const F1 = [...A1.finals()].map(f => r.maps.a[f]);
    const isAdded = (t) => t.symbol === E && M.meta.added.some(a => a.from === t.from && a.to === t.to); const placed = strip(M, isAdded); placed.states = placed.states.filter(s => s.id !== 's'); placed.state(s1).isStart = true;
    push('place', placed, {}, { s1, F1 });
    const withS = placed.clone(); withS.states.unshift({ ...M.state('s') }); withS.state(s1).isStart = false;
    push('newStart', withS, { states: ['s'] }, { s: 's' });
    const eps1 = withS.clone(); eps1.addTransition('s', E, s1);
    push('epsIn', eps1, { transitions: [{ from: 's', to: s1 }] }, { s: 's', s1 });
    push('epsBack', M, { transitions: F1.map(f => ({ from: f, to: s1 })) }, { F1, s1, F: [...M.finals()] });
    return { M, stages, maps: r.maps };
  }
  if (op === 'complement') {
    if (A1.hasEpsilon() || A1.isNondetChoice()) return { error: 'nfa', counter: FA.nfaComplementCounterexample(A1), stages };
    const c = FA.complete(A1);
    push('check', A1.clone(), {}, { complete: !c.added });
    if (c.added) push('trap', c.dfa, { states: [c.trapId], transitions: c.missing.map(([q, a]) => ({ from: q, to: c.trapId })) }, { trap: c.trapId, missing: c.missing });
    const M = c.dfa.clone(); M.states.forEach(s => s.isFinal = !s.isFinal); M.name = '¬M₁';
    push('swap', M, { accept: [...M.finals()], reject: [...c.dfa.finals()] }, { wasFinal: [...c.dfa.finals()], nowFinal: [...M.finals()] });
    return { M, stages };
  }
  if (op === 'product' || op === 'productOr') {
    if (A1.hasEpsilon() || A1.isNondetChoice() || A2.hasEpsilon() || A2.isNondetChoice()) return { error: 'dfa', stages };
    const mode = op === 'product' ? 'and' : 'or';
    const alphabet = [...new Set([...A1.alphabet, ...A2.alphabet])];
    const c1 = FA.complete(new FA.Automaton({ ...A1.toJSON(), alphabet })), c2 = FA.complete(new FA.Automaton({ ...A2.toJSON(), alphabet }));
    const D1 = c1.dfa, D2 = c2.dfa; const full = FA.product(D1, D2, mode).M;
    push('complete', new FA.Automaton({ alphabet }), {}, { trap1: c1.added, trap2: c2.added, trapId1: c1.trapId, trapId2: c2.trapId, D1, D2 });
    const id = (p, q) => p + '|' + q; const seen = new Set([id(D1.start, D2.start)]); const queue = [[D1.start, D2.start]]; const revealedE = new Set();
    const partial = () => { const B = new FA.Automaton({ alphabet }); B.states = full.states.filter(s => seen.has(s.id)).map(s => ({ ...s, isFinal: false })); B.transitions = full.transitions.filter(t => revealedE.has(t.from + '|' + t.symbol)); return B; };
    push('start', partial(), { states: [id(D1.start, D2.start)] }, { p: D1.start, q: D2.start, D1, D2 });
    while (queue.length) {
      const [p, q] = queue.shift();
      for (const a of alphabet) {
        const p2 = D1.trans(p, a)[0], q2 = D2.trans(q, a)[0]; const isNew = !seen.has(id(p2, q2)); seen.add(id(p2, q2)); if (isNew) queue.push([p2, q2]); revealedE.add(id(p, q) + '|' + a);
        push('pair', partial(), { states: [id(p, q)], accept: [id(p2, q2)], transitions: [{ from: id(p, q), to: id(p2, q2) }] }, { p, q, a, p2, q2, isNew, D1, D2 });
      }
    }
    push('finals', full, { accept: full.states.filter(s => s.isFinal).map(s => s.id) }, { mode, F: full.states.filter(s => s.isFinal).map(s => s.label), D1, D2 });
    return { M: full, stages, D1, D2 };
  }
  if (op === 'demorgan') {
    const c1 = FA.closureStages('complement', A1), c2 = FA.closureStages('complement', A2);
    if (c1.error || c2.error) return { error: 'nfa', counter: (c1.counter || c2.counter), stages };
    push('comp1', c1.M, { accept: [...c1.M.finals()] }, {}); push('comp2', c2.M, { accept: [...c2.M.finals()] }, {});
    const u = FA.union(c1.M, c2.M).M; push('union', u, { states: ['s'], transitions: u.meta.added }, {});
    const D = FA.powerset(u).dfa; push('powerset', D, {}, { n: D.states.length });
    const M = D.clone(); M.states.forEach(s => s.isFinal = !s.isFinal); M.name = 'M₁ ∩ M₂';
    push('comp3', M, { accept: [...M.finals()] }, {});
    return { M, stages };
  }
  return { error: 'op', stages };
};

// ---- language tools ----
FA.stringsUpTo = function* (alphabet, maxLen) {
  yield '';
  let layer = [''];
  for (let n = 1; n <= maxLen; n++) { const next = []; for (const w of layer) for (const a of alphabet) { next.push(w + a); yield w + a; } layer = next; }
};
FA.toDFA = (A) => A.isDeterministic() ? A : FA.powerset(A).dfa;
FA.languageDiff = (A, B, maxLen = 7) => {
  const alphabet = [...new Set([...A.alphabet, ...B.alphabet])];
  const DA = FA.complete(new FA.Automaton({ ...FA.toDFA(A).toJSON(), alphabet })).dfa;
  const DB = FA.complete(new FA.Automaton({ ...FA.toDFA(B).toJSON(), alphabet })).dfa;
  for (const w of FA.stringsUpTo(alphabet, maxLen)) { const x = FA.runDFA(DA, w).accepted, y = FA.runDFA(DB, w).accepted; if (x !== y) return { w, inA: x, inB: y }; }
  return null;
};
FA.dfaEquivalent = (A, B) => {
  const alphabet = [...new Set([...A.alphabet, ...B.alphabet])];
  const DA = FA.complete(new FA.Automaton({ ...FA.toDFA(A).toJSON(), alphabet })).dfa;
  const DB = FA.complete(new FA.Automaton({ ...FA.toDFA(B).toJSON(), alphabet })).dfa;
  const seen = new Set(); const q = [[DA.start, DB.start, '']];
  while (q.length) {
    const [p, r, w] = q.shift();
    if (DA.isFinal(p) !== DB.isFinal(r)) return { equivalent: false, witness: w, inA: DA.isFinal(p), inB: DB.isFinal(r) };
    for (const a of alphabet) { const p2 = DA.trans(p, a)[0], r2 = DB.trans(r, a)[0]; const k = p2 + '|' + r2; if (!seen.has(k)) { seen.add(k); q.push([p2, r2, w + a]); } }
  }
  return { equivalent: true };
};
FA.findPumpingCycle = (A, w) => {
  const D = FA.complete(FA.toDFA(A)).dfa;
  const n = D.states.length;
  if (w.length < n) return { error: `|ω| = ${w.length} < |K| = ${n} — theorem ไม่รับประกันอะไร` };
  const seq = [D.start]; let q = D.start;
  for (let i = 0; i < n; i++) { q = D.trans(q, w[i])[0]; seq.push(q); }
  for (let j = 1; j <= n; j++) for (let i = 0; i < j; i++) if (seq[i] === seq[j]) return { i, j, seq, x: w.slice(0, i), y: w.slice(i, j), z: w.slice(j), dfa: D, n };
  return null;
};
})();
</script>
