<script>
// ===== [6] modules M2–M7 =====
(() => {
const { $, esc } = FA.ui; const UI = FA.ui; const App = FA.App; const RX = FA.RX;
const lbl = (A, set) => FA.setLabel([...set].map(q => A.labelOf(q)));
const fillSelect = (sel, tags, extra = []) => { sel.innerHTML = extra.map(e => `<option value="${e.v}">${esc(e.t)}</option>`).join('') + FA.presets.filter(p => !tags || tags.some(t => p.tags.includes(t))).map(p => `<option value="${p.id}">${esc(p.title)}</option>`).join(''); };
const pick = (v) => v === '__editor' ? App.current.clone() : FA.preset(v);

// ---------- M2 Powerset ----------
const PS = App.powerset = {};
PS.src = new FA.AutomatonView('ps-src'); PS.out = new FA.AutomatonView('ps-out');
PS.step = UI.stepper('ps-step', (i) => PS.show(i));
PS.load = (A) => {
  PS.A = A; PS.src.setAutomaton(A); PS.src.fit();
  if (!A.start) { $('ps-explain').textContent = 'automaton ยังไม่มี start state'; return; }
  PS.res = FA.powerset(A); PS.ncol = PS.res.table.columns.length;
  PS.step.setCount(PS.ncol + PS.res.steps.length, 0);
};
PS.show = (i) => {
  const A = PS.A, R = PS.res, T = R.table; const ncol = PS.ncol;
  // --- closure table
  const shownCols = Math.min(i + 1, ncol);
  let h = `<tr><th>q</th>${Array.from({ length: shownCols }, (_, k) => `<th>Iter-${k + 1}${k === ncol - 1 ? ' = E(q)' : ''}</th>`).join('')}</tr>`;
  for (const q of T.states) h += `<tr><td class="st">${esc(A.labelOf(q))}</td>${Array.from({ length: shownCols }, (_, k) => `<td class="${k === shownCols - 1 && i < ncol ? 'mk' : ''}">${esc(lbl(A, T.columns[k][q]))}</td>`).join('')}</tr>`;
  $('ps-closure').innerHTML = h;
  $('ps-conv').textContent = i >= ncol - 1 ? `converged ที่ Iter-${ncol}` : '';
  if (i < ncol) {
    const k = i;
    const epsEdges = A.transitions.filter(t => t.symbol === FA.E).map(t => ({ from: t.from, to: t.to }));
    PS.src.highlight({ transitions: epsEdges });
    $('ps-table').innerHTML = ''; PS.out.setAutomaton(new FA.Automaton({ alphabet: A.alphabet })); PS.out.fit();
    $('ps-explain').innerHTML = k === 0 ? `<b>Iter-1:</b> E(q) เริ่มจาก {q} ∪ state ที่ไปถึงด้วย e เส้นเดียว (เส้นประ)<span class="f">E₁(q) = {q} ∪ {p | (q, e, p) ∈ Δ}</span>` : k === ncol - 1 ? `<b>Iter-${k + 1} = Iter-${k}</b> → ไม่มีอะไรเพิ่ม → <b>CONVERGENCE</b> ได้ e-Closure E(q) ของทุก state แล้ว` : `<b>Iter-${k + 1}:</b> รวม E ของสมาชิกทุกตัวในคอลัมน์ก่อนหน้า<span class="f">${T.states.map(q => `E(${A.labelOf(q)}) = ⋃ ${FA.sortIds(T.columns[k - 1][q]).map(p => 'E(' + A.labelOf(p) + ')').join(' ∪ ')} = ${lbl(A, T.columns[k][q])}`).join('\n')}</span>`;
    return;
  }
  // --- powerset steps
  const j = i - ncol; const steps = R.steps; const st = steps[j];
  const revealedRows = new Set(); const revealedCells = new Set();
  for (let k = 0; k <= j; k++) { const s = steps[k]; if (s.kind === 'start') revealedRows.add(R.rows[0].key); if (s.kind === 'cell') { revealedCells.add(s.row + '|' + s.sym); revealedRows.add(s.targetKey); } }
  let th = `<tr><th>superstate Q</th>${A.alphabet.map(a => `<th>δ′(Q, ${esc(a)})</th>`).join('')}</tr>`;
  R.rows.forEach((row, ri) => {
    if (!revealedRows.has(row.key)) return;
    const cur = st.kind === 'cell' && st.row === ri;
    th += `<tr class="${cur ? 'cur' : ''}"><td class="st">${row.isStart ? '▷ ' : ''}${row.isFinal ? '◎ ' : ''}${esc(row.key === '∅' ? '∅' : lbl(A, row.Q))}</td>` + A.alphabet.map(a => { const c = row.cells[a]; const on = revealedCells.has(ri + '|' + a); const mk = cur && st.sym === a; return `<td class="${mk ? 'mk' : ''} ${on ? '' : 'dim'}">${on ? esc(c.result.size ? lbl(A, c.result) : '∅') : '·'}</td>`; }).join('') + '</tr>';
  });
  $('ps-table').innerHTML = th;
  // partial DFA
  const D = R.dfa; const part = new FA.Automaton({ alphabet: A.alphabet });
  part.states = D.states.filter(s => revealedRows.has(s.id)).map(s => ({ ...s }));
  part.transitions = D.transitions.filter(t => { const ri = R.rows.findIndex(r => r.key === t.from); return revealedCells.has(ri + '|' + t.symbol); });
  PS.out.setAutomaton(part); PS.out.fit();
  if (st.kind === 'start') {
    PS.src.highlight({ states: [...st.Q] }); PS.out.highlight({ states: [R.rows[0].key] });
    $('ps-explain').innerHTML = `<b>เริ่ม:</b> start ของ DFA = E(start ของ NFA) ทั้งก้อน<span class="f">${esc(st.text)}</span>`;
  } else if (st.kind === 'cell') {
    const row = R.rows[st.row];
    PS.src.highlight({ states: [...row.Q], transitions: st.contrib.map(c => ({ from: c.q, to: c.p })), accept: [...st.result] });
    PS.out.highlight({ states: [row.key], accept: [st.targetKey], transitions: [{ from: row.key, to: st.targetKey }] });
    const parts = FA.sortIds(row.Q).map(q => { const ps = st.contrib.filter(c => c.q === q).map(c => A.labelOf(c.p)); return `${A.labelOf(q)},${st.sym} ↦ ${ps.length ? ps.join(' ') : '✗'}`; });
    const un = st.contrib.length ? [...new Set(st.contrib.map(c => c.p))].map(p => `E(${A.labelOf(p)})`).join(' ∪ ') : '∅';
    $('ps-explain').innerHTML = `<b>δ′(${esc(lbl(A, row.Q))}, ${esc(st.sym)})</b>: ดูทุก q ใน Q ว่าอ่าน ${esc(st.sym)} แล้วไปไหน แล้วเอา e-Closure ของปลายทางมารวมกัน${st.isNew ? ' — ได้ superstate <b>ใหม่</b> เพิ่มเป็นแถวใหม่' : ' — superstate นี้มีอยู่แล้ว'}<span class="f">${esc(parts.join(' · '))}\n⇒ ${esc(un)} = ${esc(st.result.size ? lbl(A, st.result) : '∅  (trap state)')}${st.result.size && row.isFinal !== undefined && [...st.result].some(q => A.isFinal(q)) ? '   ∋ final → superstate นี้เป็น final' : ''}</span>`;
  } else {
    PS.src.highlight({}); PS.out.highlight({ accept: D.states.filter(s => s.isFinal).map(s => s.id) });
    $('ps-explain').innerHTML = `<b>เสร็จ:</b> DFA มี ${D.states.length} state (จากที่เป็นไปได้ 2<sup>${A.states.length}</sup> = ${2 ** A.states.length}) — final = superstate ที่มี state ใน F = {${[...A.finals()].map(q => A.labelOf(q)).join(', ')}} อยู่ด้วย: ${D.states.filter(s => s.isFinal).map(s => esc(s.label)).join(', ')}`;
  }
};
$('ps-from-editor').onclick = () => PS.load(App.current.clone());
$('ps-lib').onclick = () => UI.library(['M2'], (A) => PS.load(A));
$('ps-to-editor').onclick = () => { if (PS.res) App.goto('editor', PS.res.dfa.clone()); };
$('ps-to-min').onclick = () => { if (PS.res) App.goto('minimize', PS.res.dfa.clone()); };

// ---------- M3 Minimization ----------
const MN = App.minimize = {};
MN.src = new FA.AutomatonView('mn-src'); MN.out = new FA.AutomatonView('mn-out');
MN.step = UI.stepper('mn-step', (i) => MN.show(i));
MN.load = (A) => {
  MN.A = A; MN.src.setAutomaton(A); MN.src.fit(); $('mn-part').innerHTML = ''; $('mn-unreach').innerHTML = '';
  const r = FA.minimize(A);
  if (r.error) { $('mn-explain').innerHTML = `<span class="bad-t">${esc(r.error)}</span>`; MN.res = null; MN.step.setCount(0); MN.out.setAutomaton(new FA.Automaton()); return; }
  MN.res = r;
  // steps: reach steps (each adds a state) + removal + trap + iterations + result
  MN.steps = [];
  r.prep.reachSteps.forEach((s, k) => MN.steps.push({ kind: 'reach', k }));
  MN.steps.push({ kind: 'remove' });
  if (r.prep.trapAdded) MN.steps.push({ kind: 'trap' });
  r.iterations.forEach((it, k) => MN.steps.push({ kind: 'iter', k }));
  MN.steps.push({ kind: 'result' });
  MN.step.setCount(MN.steps.length, 0);
};
MN.show = (i) => {
  const A = MN.A, R = MN.res, st = MN.steps[i]; const C = R.prep.completed;
  const reach = R.prep.reachSteps;
  if (st.kind === 'reach') {
    const got = reach.slice(0, st.k + 1).map(s => s.added); const cur = reach[st.k];
    MN.src.highlight({ states: got, accept: [cur.added], transitions: cur.via ? [{ from: cur.via.from, to: cur.added }] : [], dim: A.ids().filter(q => !got.includes(q)) });
    $('mn-unreach').innerHTML = `R = ${esc(lbl(A, got))}`;
    $('mn-explain').innerHTML = st.k === 0 ? `<b>ขั้น 1:</b> เริ่ม R := {s} แล้ววนเพิ่ม δ(p, a) ทุกตัวที่ p ∈ R<span class="f">R := {${esc(A.labelOf(cur.added))}}</span>` : `เพิ่ม <b>${esc(A.labelOf(cur.added))}</b> เพราะ δ(${esc(A.labelOf(cur.via.from))}, ${esc(cur.via.sym)}) = ${esc(A.labelOf(cur.added))}<span class="f">R = ${esc(lbl(A, got))}</span>`;
    MN.out.setAutomaton(new FA.Automaton()); $('mn-part').innerHTML = ''; return;
  }
  if (st.kind === 'remove') {
    MN.src.highlight({ dim: R.prep.removed, reject: R.prep.removed });
    $('mn-unreach').innerHTML = R.prep.removed.length ? `ลบ ${R.prep.removed.map(q => UI.pill(A.labelOf(q))).join('')} (ไม่มี string ไหนพามาถึง จึงไม่มีผลต่อ L(M))` : 'ทุก state ไปถึงได้ — ไม่ต้องลบอะไร';
    $('mn-explain').innerHTML = R.prep.removed.length ? `<b>ลบ state ที่ไม่อยู่ใน R:</b> ${esc(R.prep.removed.map(q => A.labelOf(q)).join(', '))} — Problem 2.1.7: ลบแล้ว L(M) ไม่เปลี่ยน` : `<b>ทุก state reachable</b> — ไปขั้นแบ่งกลุ่มได้เลย`;
    return;
  }
  if (st.kind === 'trap') {
    MN.src.setAutomaton(C); MN.src.fit(); MN.src.highlight({ states: [R.prep.trapId] });
    $('mn-explain').innerHTML = `<b>ทำให้ complete:</b> DFA เดิมมี (q, σ) ที่ไม่มีทางไป ${R.prep.missing ? '' : ''}— เพิ่ม trap state เพื่อให้ Lemma 2.5.1 ใช้ δ(q,a) ได้ทุกคู่`;
    return;
  }
  if (st.kind === 'iter') {
    const it = R.iterations[st.k]; const src = R.prep.trapAdded ? C : A; MN.src.setAutomaton(src); MN.src.fit();
    const groups = {}; it.partition.forEach((b, gi) => b.forEach(q => groups[q] = gi));
    MN.src.highlight({ groups });
    // table
    const prev = R.iterations[st.k - 1];
    const bo = {}; (prev ? prev.partition : it.partition).forEach((b, gi) => b.forEach(q => bo[q] = gi));
    let h = `<tr><th>state</th><th>กลุ่ม ≡${FA.sub(Math.max(st.k - 1, 0))}</th>${st.k > 0 ? src.alphabet.map(a => `<th>δ(q,${esc(a)}) อยู่กลุ่ม</th>`).join('') + `<th>กลุ่ม ≡${FA.sub(st.k)}</th>` : ''}</tr>`;
    for (const b of (prev ? prev.partition : it.partition)) for (const q of b) {
      h += `<tr><td class="st">${src.isFinal(q) ? '◎ ' : ''}${esc(src.labelOf(q))}</td><td>${bo[q] + 1}</td>`;
      if (st.k > 0) { h += src.alphabet.map(a => { const t = src.trans(q, a)[0]; return `<td>${esc(src.labelOf(t))} → <b>${bo[t] + 1}</b></td>`; }).join(''); const ng = groups[q] + 1; const split = it.splits.some(s => s.block.includes(q)); h += `<td class="${split ? 'mk' : ''}">${ng}</td>`; }
      h += '</tr>';
    }
    $('mn-part').innerHTML = h;
    const pstr = it.partition.map(b => '{' + b.map(q => src.labelOf(q)).join(',') + '}').join('  ');
    $('mn-explain').innerHTML = st.k === 0 ? `<b>≡₀:</b> แบ่งเป็น 2 กลุ่มตาม final / ไม่ final (string ยาว 0 = e แยกได้แค่นี้)<span class="f">${esc(pstr)}</span>` : (it.splits.length ? `<b>≡${FA.sub(st.k)}:</b> ใช้ Lemma 2.5.1 — p ≡${FA.sub(st.k)} q ต้องมี δ(p,a) กับ δ(q,a) อยู่กลุ่มเดียวกัน (ของรอบก่อน) ทุก a<br>${it.splits.map(s => '• ' + esc(s.reason)).join('<br>')}<span class="f">${esc(pstr)}</span>` : `<b>≡${FA.sub(st.k)} = ≡${FA.sub(st.k - 1)}</b> — ไม่มีกลุ่มไหนแยกได้อีก → <b>CONVERGED</b> (Lemma รับประกันว่า ≡${FA.sub(st.k + 1)}, ≡${FA.sub(st.k + 2)}, … ก็เท่ากันหมด)<span class="f">${esc(pstr)}</span>`);
    MN.out.setAutomaton(new FA.Automaton()); return;
  }
  if (st.kind === 'result') {
    const groups = {}; R.partition.forEach((b, gi) => b.forEach(q => groups[q] = gi));
    MN.src.highlight({ groups }); MN.out.setAutomaton(R.dfa); MN.out.fit();
    const g2 = {}; R.dfa.states.forEach((s, gi) => g2[s.id] = gi); MN.out.highlight({ groups: g2 });
    $('mn-explain').innerHTML = `<b>ขั้น 4:</b> รวมแต่ละกลุ่มเป็น state เดียว: ${R.dfa.states.length} state (จาก ${A.states.length}) — start = กลุ่มที่มี s, final = กลุ่มที่เป็น final, δ(G,a) = กลุ่มของ δ(สมาชิกใดก็ได้, a)${A.meta && A.meta.note ? `<br><span class="bad-t">${esc(A.meta.note)}</span>` : ''}`;
  }
};
$('mn-from-editor').onclick = () => MN.load(App.current.clone());
$('mn-lib').onclick = () => UI.library(['M3'], (A) => MN.load(A));
$('mn-to-editor').onclick = () => { if (MN.res) App.goto('editor', MN.res.dfa.clone()); };
fillSelect($('eq-a'), ['DFA', 'NFA'], [{ v: '__editor', t: '(automaton ใน Editor)' }]); fillSelect($('eq-b'), ['DFA', 'NFA'], [{ v: '__editor', t: '(automaton ใน Editor)' }]);
$('eq-run').onclick = () => { const A = pick($('eq-a').value), B = pick($('eq-b').value); const r = FA.dfaEquivalent(A, B); $('eq-out').innerHTML = r.equivalent ? `<span class="ok-t">✔ equivalent — L(M₁) = L(M₂)</span> (minimal DFA ของทั้งคู่มี ${FA.minimize(FA.toDFA(A)).dfa.states.length} state)` : `<span class="bad-t">✘ ไม่ equivalent</span> — string "${r.witness === '' ? 'e' : esc(r.witness)}" ${r.inA ? 'อยู่ใน L(M₁) แต่ไม่อยู่ใน L(M₂)' : 'อยู่ใน L(M₂) แต่ไม่อยู่ใน L(M₁)'}`; };

// ---------- M4a RegEx → NFA ----------
const RXM = App.regex = {};
RXM.view = new FA.AutomatonView('rx-canvas'); RXM.p1 = new FA.AutomatonView('rx-p1'); RXM.p2 = new FA.AutomatonView('rx-p2');
RXM.step = UI.stepper('rx-step', (i) => RXM.show(i));
const RX_RULES = {
  sym: 'กฎพื้นฐาน: ภาษา {c} ต้องมี FA — วาด 2 state เชื่อมด้วยเส้น c',
  eps: 'กฎพื้นฐาน: ภาษา {e} — state เดียวที่เป็น final',
  empty: 'กฎพื้นฐาน: ภาษา ∅ — state เดียวที่ไม่ final',
  cat: 'Theorem 2.3.1(b) concatenation: ต่อชิ้นที่ 1 เข้ากับชิ้นที่ 2 ด้วยเส้น e (สีน้ำเงิน) จาก final ของชิ้นที่ 1 ไป start ของชิ้นที่ 2',
  or: 'Theorem 2.3.1(a) union: start ใหม่ (สีน้ำเงิน) แตกเป็นเส้น e ไปหาทั้งสองชิ้น — เครื่องเดาว่า input อยู่ในภาษาไหน',
  star: 'Theorem 2.3.1(c) Kleene star: start ใหม่ที่เป็น final ด้วย + เส้น e เข้า และ เส้น e จาก final เดิมย้อนกลับไป start เดิม'
};
RXM.build = () => {
  try {
    const ast = RX.parse($('rx-in').value);
    RXM.ast = ast; RXM.res = RX.buildNFA(ast);
    RXM.readOut(ast);
    RXM.byId = {}; RXM.indexOf = {};
    RXM.res.stages.forEach((s, k) => { RXM.byId[s.id] = s; RXM.indexOf[s.id] = k; });
    RXM.drawTree();
    RXM.step.setCount(RXM.res.stages.length, 0);
  } catch (e) { $('rx-explain').innerHTML = `<span class="bad-t">${esc(e.message)}</span>`; }
};
RXM.drawTree = () => {
  const box = $('rx-tree'); box.innerHTML = '';
  const NS = 'http://www.w3.org/2000/svg';
  let slot = 0, maxDepth = 0; const pos = {};
  const place = (node, depth) => {
    maxDepth = Math.max(maxDepth, depth);
    let x;
    if (node.t === 'cat' || node.t === 'or') x = (place(node.l, depth + 1) + place(node.r, depth + 1)) / 2;
    else if (node.t === 'star') x = place(node.x, depth + 1);
    else { x = 50 + slot * 90; slot++; }
    pos[node.id] = { x, y: 40 + depth * 70 };
    return x;
  };
  place(RXM.ast, 0);
  const W = 100 + slot * 90, H = 80 + maxDepth * 70;
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('width', '100%'); svg.setAttribute('height', '100%');
  RXM.treeNodes = {}; RXM.treeLines = {};
  const kidsOf = (n) => (n.t === 'cat' || n.t === 'or') ? [n.l, n.r] : n.t === 'star' ? [n.x] : [];
  const addLines = (node) => {
    kidsOf(node).forEach(addLines);
    const p = pos[node.id];
    for (const c of kidsOf(node)) {
      const cp = pos[c.id];
      const ln = document.createElementNS(NS, 'line');
      ln.setAttribute('class', 'tl'); ln.setAttribute('data-child', String(c.id));
      ln.setAttribute('x1', p.x); ln.setAttribute('y1', p.y); ln.setAttribute('x2', cp.x); ln.setAttribute('y2', cp.y);
      svg.appendChild(ln); RXM.treeLines[c.id] = ln;
    }
  };
  addLines(RXM.ast);
  const TLBL = { sym: (n) => n.c, eps: () => 'e', empty: () => '∅', cat: () => '·', or: () => '∪', star: () => '*' };
  const addNodes = (node) => {
    kidsOf(node).forEach(addNodes);
    const p = pos[node.id];
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'tn'); g.setAttribute('data-id', String(node.id)); g.setAttribute('transform', `translate(${p.x},${p.y})`);
    const rect = document.createElementNS(NS, 'rect');
    rect.setAttribute('x', '-30'); rect.setAttribute('y', '-16'); rect.setAttribute('width', '60'); rect.setAttribute('height', '32');
    g.appendChild(rect);
    const text = document.createElementNS(NS, 'text'); text.textContent = TLBL[node.t](node); g.appendChild(text);
    const title = document.createElementNS(NS, 'title'); title.textContent = RX.print(node); g.appendChild(title);
    g.addEventListener('click', () => RXM.step.go(RXM.indexOf[node.id]));
    svg.appendChild(g); RXM.treeNodes[node.id] = g;
  };
  addNodes(RXM.ast);
  box.appendChild(svg);
};
RXM.paintTree = (i) => {
  RXM.res.stages.forEach((s, k) => {
    const g = RXM.treeNodes[s.id];
    if (g) g.setAttribute('class', k < i ? 'tn done' : k === i ? 'tn cur' : 'tn pending');
    const ln = RXM.treeLines[s.id];
    if (ln) ln.setAttribute('class', k < i ? 'tl done' : 'tl');
  });
};
RXM.howto = (st, kids) => {
  const k1 = kids[0], k2 = kids[1];
  const F1 = k1 ? FA.setLabel(k1.finals) : null, s1 = k1 ? k1.start : null;
  const s2 = k2 ? k2.start : null, F2 = k2 ? FA.setLabel(k2.finals) : null;
  const sNew = st.addedStates[0], e = esc;
  switch (st.kind) {
    case 'sym': { const s = st.addedStates[0], f = st.addedStates[1], c = st.regex; return [
      `วาด state ใหม่ 2 ตัว: <b>${e(s)}</b> (start, มี ▷) และ <b>${e(f)}</b> (final, วงคู่)`,
      `ลากเส้นจาก ${e(s)} → ${e(f)} แล้วเขียนสัญลักษณ์ <b>${e(c)}</b> กำกับ`,
      `ตรวจ: เครื่องนี้รับ string "${e(c)}" ตัวเดียวเท่านั้น` ]; }
    case 'eps': return [
      `วาด state เดียว <b>${e(sNew)}</b> ให้เป็นทั้ง start และ final`,
      `ไม่มีเส้นใด ๆ → รับเฉพาะ string ว่าง e` ];
    case 'empty': return [
      `วาด state เดียว <b>${e(sNew)}</b> เป็น start แต่ไม่ final`,
      `ไม่มีเส้น ไม่มี final → ไม่รับ string ใดเลย (∅)` ];
    case 'cat': return [
      `วางชิ้นที่ 1 [${e(k1.regex)}] ไว้ซ้าย ชิ้นที่ 2 [${e(k2.regex)}] ไว้ขวา — <b>ไม่ต้องเปลี่ยนชื่อ state</b>`,
      `จาก final ทุกตัวของชิ้นที่ 1 (${e(F1)}) ลากเส้น <b>e</b> → start ของชิ้นที่ 2 (<b>${e(s2)}</b>) — เส้นสีน้ำเงินในรูปผลลัพธ์`,
      `ยกเลิกวงคู่ของ ${e(F1)}: final ของเครื่องใหม่คือของชิ้นที่ 2 เท่านั้น (${e(F2)})`,
      `start ยังเป็น <b>${e(s1)}</b> เหมือนชิ้นที่ 1`,
      `ตรวจ: string ต้องเดินชิ้นที่ 1 จนถึง final แล้ว "กระโดด" ด้วย e ไปเริ่มชิ้นที่ 2 → รับ L₁·L₂ พอดี` ];
    case 'or': return [
      `วาด start ใหม่ <b>${e(sNew)}</b> ไว้ซ้ายสุด`,
      `วางชิ้นที่ 1 [${e(k1.regex)}] ไว้บน ชิ้นที่ 2 [${e(k2.regex)}] ไว้ล่าง`,
      `ลากเส้น <b>e</b> จาก ${e(sNew)} → ${e(s1)} และ ${e(sNew)} → ${e(s2)} (สีน้ำเงิน); ${e(s1)} กับ ${e(s2)} เลิกเป็น start`,
      `final = final ของทั้งสองชิ้นรวมกัน = ${e(FA.setLabel(st.finals))}`,
      `ตรวจ: เครื่อง "เดา" ตั้งแต่ก้าวแรกว่า input อยู่ใน L₁ หรือ L₂ — นี่คือ nondeterminism` ];
    case 'star': return [
      `วาด start ใหม่ <b>${e(sNew)}</b> และทำเป็น final ด้วย (วงคู่) — เพื่อรับ string ว่าง e`,
      `ลากเส้น <b>e</b> จาก ${e(sNew)} → start เดิม ${e(s1)} (${e(s1)} เลิกเป็น start)`,
      `จาก final เดิมทุกตัว (${e(F1)}) ลากเส้น <b>e</b> กลับไป ${e(s1)} — วนซ้ำได้กี่รอบก็ได้`,
      `final = ${e(F1)} ∪ {${e(sNew)}} = ${e(FA.setLabel(st.finals))}`,
      `ทำไมต้องมี ${e(sNew)} ใหม่ ไม่ทำ ${e(s1)} เป็น final เฉย ๆ? เพราะเส้น e ย้อนกลับเข้า ${e(s1)} จะทำให้ string ที่จบกลางทางถูก accept ผิด (Problem 2.3.2)` ];
  }
};
RXM.show = (i) => {
  const S = RXM.res.stages, st = S[i];
  const kids = st.children.map(id => RXM.byId[id]);
  if (kids[0]) { RXM.p1.setAutomaton(kids[0].automaton.clone()); RXM.p1.fit(); $('rx-p1-title').textContent = `ชิ้นที่ 1: ${kids[0].regex}`; }
  else { RXM.p1.setAutomaton(new FA.Automaton({ alphabet: [] })); RXM.p1.fit(); $('rx-p1-title').textContent = 'ชิ้นที่ 1: —'; }
  if (kids[1]) { RXM.p2.setAutomaton(kids[1].automaton.clone()); RXM.p2.fit(); $('rx-p2-title').textContent = `ชิ้นที่ 2: ${kids[1].regex}`; }
  else { RXM.p2.setAutomaton(new FA.Automaton({ alphabet: [] })); RXM.p2.fit(); $('rx-p2-title').textContent = 'ชิ้นที่ 2: —'; }
  RXM.view.setAutomaton(st.automaton); RXM.view.fit();
  RXM.view.highlight({ transitions: st.added, states: st.addedStates });
  RXM.paintTree(i);
  $('rx-explain').innerHTML = `<b>Stage ${i + 1}/${S.length} · สร้าง ${esc(st.regex)}</b><br>${RX_RULES[st.kind]}<span class="f">state: ${st.automaton.states.length} · เส้น: ${st.automaton.transitions.length} · start = ${st.start} · F = ${FA.setLabel(st.finals)}</span>`;
  $('rx-howto').innerHTML = RXM.howto(st, kids).map(li => `<li>${li}</li>`).join('');
  $('rx-try-out').innerHTML = '';
};

// exam guide: top-down reading of the regex + rule gallery
const RX_KIND = { star: 'star (*)', or: 'union (∪)', cat: 'concat (ต่อกัน)', sym: 'สัญลักษณ์เดี่ยว', eps: 'string ว่าง e', empty: '∅' };
RXM.readLines = (ast) => {
  const lines = [];
  const walk = (n, depth) => {
    const me = esc(RX.print(n));
    if (n.t === 'star') lines.push([depth, `<b>${me}</b> → ท้ายสุดมี * ⇒ <b>star</b> ของ ${esc(RX.print(n.x))}`]);
    else if (n.t === 'or') lines.push([depth, `<b>${me}</b> → มี ∪ นอกสุด ⇒ <b>union</b> ของ ${esc(RX.print(n.l))} กับ ${esc(RX.print(n.r))}`]);
    else if (n.t === 'cat') lines.push([depth, `<b>${me}</b> → ไม่มี * ท้าย ไม่มี ∪ นอกสุด ⇒ <b>concat</b> ของ ${esc(RX.print(n.l))} ต่อด้วย ${esc(RX.print(n.r))}`]);
    else lines.push([depth, `<b>${me}</b> → ${RX_KIND[n.t]} = ใบ (วาดได้ทันที)`]);
    if (n.t === 'star') walk(n.x, depth + 1); else if (n.t === 'cat' || n.t === 'or') { walk(n.l, depth + 1); walk(n.r, depth + 1); }
  };
  walk(ast, 0);
  return lines;
};
RXM.readOut = (ast) => {
  const lines = RXM.readLines(ast);
  $('rx-readout').innerHTML = `<b>อ่าน ${esc(RX.print(ast))} ทีละชั้น (บน → ล่าง):</b><ol>${lines.map(([d, t]) => `<li style="margin-left:${d * 14}px">${t}</li>`).join('')}</ol><span class="note">ลำดับวาดจริงคือกลับกัน: ใบก่อน แล้วไล่ขึ้นไปหาบรรทัดแรก (ดู stage ด้านล่าง)</span>`;
};
// ---- exam-style problems with full written solutions ----
const RX_EXAM = [
  { id: 'warm', title: 'อุ่นเครื่อง', rx: 'ab ∪ a*', src: 'มีครบ 3 กฎในข้อเดียว', text: 'Construct a finite automaton accepting L(ab ∪ a*).' },
  { id: 'f214', title: 'Figure 2-14', rx: '(ab ∪ aab)*', src: 'textbook §2.3 worked example', text: 'Using the construction in the proof of Theorem 2.3.1, construct a finite automaton accepting L((ab ∪ aab)*).' },
  { id: 'p234a', title: 'Problem 2.3.4(a)', rx: 'a*(ab ∪ ba ∪ e)b*', src: 'textbook', text: 'Using the construction in the proofs of Theorem 2.3.1, construct a finite automaton accepting a*(ab ∪ ba ∪ e)b*.' },
  { id: 'p234c', title: 'Problem 2.3.4(c)', rx: '((ab)* ∪ (bc)*)ab', src: 'textbook · Σ = {a,b,c}', text: 'Construct a finite automaton accepting ((ab)* ∪ (bc)*)ab.' },
  { id: 'p235', title: 'Problem 2.3.5', rx: '(ab ∪ aba)*a', src: 'textbook', text: 'Construct a nondeterministic finite automaton accepting (ab ∪ aba)*a. (ข้อเต็มให้ทำ star ต่ออีกชั้น: ((ab ∪ aba)*a)* — กดปุ่ม "ทำ star ต่อ" ท้ายเฉลย)' , next: '((ab ∪ aba)*a)*' },
  { id: 'lang', title: 'โจทย์ให้เป็นภาษา', rx: '(a ∪ b)*bb', src: 'แนวชุดฝึก: {ω | ω ends with bb}', text: 'Construct a finite automaton accepting {ω ∈ {a,b}* | ω ends with bb}.', pre: 'โจทย์ให้ภาษา ไม่ได้ให้ regex → ต้องเขียน regex ก่อน: "อะไรก็ได้ แล้วตามด้วย bb" = <b>(a ∪ b)*bb</b> จากนั้นทำเหมือนข้ออื่น' },
  { id: 'p234b', title: 'Problem 2.3.4(b)', rx: '((a ∪ b)*(e ∪ c)*)*', src: 'textbook · มี e และ star ซ้อน', text: 'Construct a finite automaton accepting ((a ∪ b)*(e ∪ c)*)*.' },
];
RXM.examList = () => {
  const box = $('rx-exam-list'); if (!box) return;
  box.innerHTML = RX_EXAM.map(p => `<button class="btn sm" data-ex="${p.id}"><b>${esc(p.title)}</b>&nbsp;<span class="mono">${esc(p.rx)}</span></button>`).join('');
  box.addEventListener('click', (ev) => { const b = ev.target.closest('button[data-ex]'); if (!b) return; RXM.examShow(b.dataset.ex); });
};
RXM.examViews = [];
RXM.examShow = (id, rxOverride) => {
  const p = RX_EXAM.find(x => x.id === id); if (!p) return;
  const rx = rxOverride || p.rx;
  $('rx-in').value = rx; RXM.build();
  const res = RXM.res, S = res.stages, ast = RXM.ast; const byId = RXM.byId;
  const final = S[S.length - 1].automaton;
  const samples = (A, n = 6) => { const acc = [], rej = []; for (const w of FA.stringsUpTo(A.alphabet, 4)) { (FA.runNFA(A, w).accepted ? acc : rej).push(w === '' ? 'e' : w); if (acc.length >= n && rej.length >= n) break; } return { acc: acc.slice(0, n), rej: rej.slice(0, n) }; };
  const fs = samples(final);
  let h = `<div class="prob"><div class="src">${esc(p.title)} · ${esc(p.src)}</div><div style="font-size:1.05rem;margin:4px 0"><b>โจทย์:</b> ${esc(p.text)}</div>${p.pre ? `<div class="def" style="margin-top:6px">${p.pre}</div>` : ''}
    <div class="row" style="margin-top:8px"><button class="btn sm primary" id="rx-ex-draw">ลองวาดเองใน Editor ก่อน</button><button class="btn sm" id="rx-ex-check">ตรวจที่วาด</button><span class="note" id="rx-ex-verdict"></span></div></div>`;
  h += `<div class="recipe"><div><b>① อ่านโจทย์</b>หา operator นอกสุด → แตกเป็นชิ้น → ได้ parse tree</div><div><b>② วาดใบ</b>ทุกสัญลักษณ์เดี่ยว = 2 state + 1 เส้น (e = 1 state final)</div><div><b>③ ประกอบขึ้นบน</b>concat: เส้น e เชื่อม · union: start ใหม่ + e 2 เส้น · star: start ใหม่ (final) + e เข้า + e กลับ</div><div><b>④ ตรวจ</b>ลอง string ที่ควรรับ/ไม่รับ 2–3 ตัว แล้วเขียนรูปสุดท้ายลงกระดาษ</div></div>`;
  const lines = RXM.readLines(ast);
  h += `<div class="wstep"><div><h4>ขั้นที่ 0 · อ่านโจทย์ (นอกสุด → ใน)</h4><div class="read"><ol>${lines.map(([d, t]) => `<li style="margin-left:${d * 12}px">${t}</li>`).join('')}</ol></div><p class="note" style="margin-top:6px">ได้ parse tree ที่มี ${S.length} node → ต้องทำ ${S.length} stage โดยเริ่มจากใบ (บรรทัดล่างสุด) ย้อนขึ้นไปถึงบรรทัดแรก</p></div><div><h4>สิ่งที่จะได้ตอนจบ</h4><div class="canvas" data-exv="final"></div><div class="lang">รับ: <span class="mono">${esc(fs.acc.join(', ') || '—')}</span> · ไม่รับ: <span class="mono">${esc(fs.rej.join(', ') || '—')}</span></div></div></div>`;
  S.forEach((st, i) => {
    const kids = st.children.map(id => byId[id]);
    const howto = RXM.howto(st, kids);
    const sm = samples(st.automaton, 4);
    const why = ({ sym: () => 'ใบของ tree — ภาษา {' + esc(st.regex) + '} ต้องมีเครื่องของตัวเองก่อน', eps: () => 'ใบของ tree — string ว่าง', empty: () => 'ใบของ tree — ภาษาว่าง', cat: () => `ใน tree node นี้คือ "·" ที่มีลูก ${esc(kids[0].regex)} และ ${esc(kids[1].regex)} — ทั้งสองลูกสร้างเสร็จแล้วใน stage ก่อนหน้า จึงเอามาต่อกันได้`, or: () => `node "∪" ลูกคือ ${esc(kids[0].regex)} กับ ${esc(kids[1].regex)} — เครื่องใหม่ต้องรับได้ทั้งสองภาษา`, star: () => `node "*" ลูกคือ ${esc(kids[0].regex)} — เครื่องใหม่ต้องรับ e และวนซ้ำภาษาลูกกี่รอบก็ได้` })[st.kind]();
    h += `<div class="wstep"><div><h4>Stage ${i + 1}/${S.length} · สร้าง <span class="mono">${esc(st.regex)}</span> <span class="badge blue">${esc({ sym: 'สัญลักษณ์', eps: 'e', empty: '∅', cat: 'concat', or: 'union', star: 'star' }[st.kind])}</span></h4><p class="note" style="margin:0 0 6px">ทำไมตอนนี้: ${why}</p><ol>${howto.map(x => `<li>${x}</li>`).join('')}</ol><div class="lang">หลัง stage นี้เครื่องรับ: <span class="mono">${esc(sm.acc.join(', ') || '—')}</span>${kids.length ? ` · state ที่มาจากชิ้นเดิมชื่อเดิม (ไม่ต้องเปลี่ยน) — เส้น/state <b>สีน้ำเงิน</b>คือของใหม่` : ''}</div></div><div><div class="canvas" data-exv="${i}"></div></div></div>`;
  });
  h += `<div class="wstep"><div><h4>สรุปคำตอบ (เขียนลงกระดาษ)</h4><ol><li>วาดรูป stage สุดท้าย (${final.states.length} state, ${final.transitions.length} เส้น) — ระบุ start ▷ และ final วงคู่ให้ชัด</li><li>ถ้าข้อสอบให้แสดงวิธีทำ: วาด stage ของ operator หลัก ๆ (concat/union/star) 2–3 รูป และเขียนว่าใช้กฎข้อไหน (Theorem 2.3.1 a/b/c)</li><li>ตรวจ: ${esc(fs.acc.slice(0, 3).join(', '))} ต้องรับ · ${esc(fs.rej.slice(0, 3).join(', '))} ต้องไม่รับ</li></ol>${p.next && !rxOverride ? `<div class="row" style="margin-top:8px"><button class="btn sm" id="rx-ex-next">ทำ star ต่อ → ${esc(p.next)}</button></div>` : ''}</div><div><div class="canvas" data-exv="final2"></div></div></div>`;
  const body = $('rx-exam-body'); body.innerHTML = h;
  RXM.examViews = [];
  body.querySelectorAll('[data-exv]').forEach(el => {
    const k = el.dataset.exv; const st = (k === 'final' || k === 'final2') ? S[S.length - 1] : S[+k];
    const v = new FA.AutomatonView(el); v.setAutomaton(st.automaton); v.fit(36);
    if (k !== 'final' && k !== 'final2') v.highlight({ transitions: st.added, states: st.addedStates });
    RXM.examViews.push(v);
  });
  $('rx-ex-draw').onclick = () => { App.editor.setCurrent(new FA.Automaton({ alphabet: final.alphabet, name: p.title }), { sample: '' }); App.show('editor'); window.scrollTo(0, 0); UI.toast('วาดเสร็จแล้วกลับมา module 4 กด "ตรวจที่วาด"'); };
  $('rx-ex-check').onclick = () => { const A = App.current; const out = $('rx-ex-verdict'); if (!A || !A.start || !A.transitions.length) { out.innerHTML = '<span class="bad-t">ยังไม่ได้วาด — กด "ลองวาดเองใน Editor ก่อน"</span>'; return; } const r = FA.dfaEquivalent(A, final); out.innerHTML = r.equivalent ? '<span class="verdict ok">✔ ภาษาเดียวกับเฉลย</span>' : `<span class="verdict bad">✘ ยังไม่ตรง</span> string <span class="mono">${esc(r.witness === '' ? 'e' : r.witness)}</span> ${r.inA ? 'เครื่องของคุณรับ แต่ไม่อยู่ในภาษา' : 'อยู่ในภาษา แต่เครื่องของคุณไม่รับ'}`; };
  const nx = $('rx-ex-next'); if (nx) nx.onclick = () => RXM.examShow(id, p.next);
  body.scrollIntoView({ behavior: 'smooth', block: 'start' });
};
RXM.examList();
// ---- star tool: cut a string into pieces according to the regex ----
const RXS_QUICK = [['a(ab)*', 'aabab'], ['a(ab)*', 'a'], ['a(ab)*', 'aaaaabbbbb'], ['a(ab)*', 'aabbbbb'], ['ab*', 'abbb'], ['(ab)*', 'abab'], ['a*b*', 'aaabb'], ['a*b*', 'ba'], ['(ab ∪ aab)*', 'abaabab']];
RXM.starRender = () => {
  const out = $('rxs-out'); let ast;
  try { ast = RX.parse($('rxs-rx').value); } catch (e) { out.innerHTML = `<span class="bad-t">${esc(e.message)}</span>`; return; }
  let w = $('rxs-w').value.replace(/\s+/g, ''); if (w === 'e' || w === 'ε') w = '';
  if (w.length > 40) { out.innerHTML = '<span class="bad-t">string ยาวเกิน 40 ตัว</span>'; return; }
  const rx = RX.print(ast); const r = RX.explain(ast, w);
  const piece = (p, lbl) => {
    if (p.kind === 'star') {
      const n = p.rounds.length;
      const rounds = p.rounds.map((rd, i) => `<div class="pc"><div class="t">${esc(rd.map(x => x.text).join('')) || 'e'}</div><div class="l">รอบ ${i + 1}</div></div>`).join('');
      return `<div class="grp"><div class="rounds">${rounds || '<div class="pc eps"><div class="t">e</div><div class="l">0 รอบ</div></div>'}</div><div class="gl">${esc(p.regex)} → วน ${n} รอบ (ก้อนละ "${esc(RX.print(p.inner))}")</div></div>`;
    }
    if (p.kind === 'or') return `<div class="pc"><div class="t">${esc(p.text) || 'e'}</div><div class="l">เลือก ${esc(p.chosen)} จาก ${esc(p.regex)}</div></div>`;
    if (p.kind === 'eps') return `<div class="pc eps"><div class="t">e</div><div class="l">string ว่าง</div></div>`;
    return `<div class="pc fixed"><div class="t">${esc(p.text)}</div><div class="l">ส่วนบังคับ ${esc(p.regex)}</div></div>`;
  };
  const wl = w === '' ? 'e' : w;
  if (r.ok) {
    const stars = r.pieces.filter(p => p.kind === 'star');
    const lines = r.pieces.map((p, i) => p.kind === 'star' ? `ก้อน ${i + 1}: <span class="mono">${esc(p.regex)}</span> → ตัดได้ <b>${p.rounds.length} รอบ</b>${p.rounds.length ? ': ' + p.rounds.map(rd => `<span class="mono">${esc(rd.map(x => x.text).join(''))}</span>`).join(' | ') : ' (ใช้สิทธิ์ 0 รอบ = ไม่กินตัวอักษรเลย)'}` : p.kind === 'or' ? `ก้อน ${i + 1}: <span class="mono">${esc(p.regex)}</span> → เลือกทาง <span class="mono">${esc(p.chosen)}</span> ได้ "<span class="mono">${esc(p.text) || 'e'}</span>"` : `ก้อน ${i + 1}: ส่วนบังคับ <span class="mono">${esc(p.regex)}</span> → ตัด "<span class="mono">${esc(p.text) || 'e'}</span>"`);
    out.innerHTML = `<div class="verdict ok">✔ "${esc(wl)}" ∈ L(${esc(rx)}) — ตัดได้หมดพอดี</div><div class="tape">${r.pieces.map(piece).join('<span style="align-self:center;color:var(--ink-3)">+</span>')}</div><ol style="margin:0;padding-left:20px;display:grid;gap:4px">${lines.map(l => `<li>${l}</li>`).join('')}</ol>${stars.length ? `<p class="note" style="margin-top:6px">ถ้าอยากรู้ว่า "วนกี่รอบ" — ไม่ต้องรู้ล่วงหน้า แค่ตัดไปเรื่อย ๆ จนตัดไม่ได้หรือหมด string จำนวนที่ตัดได้คือจำนวนรอบ (ต้องหมดพอดีเท่านั้น)</p>` : ''}`;
  } else {
    const p = r.maxPos;
    out.innerHTML = `<div class="verdict bad">✘ "${esc(wl)}" ∉ L(${esc(rx)}) — ตัดไม่ลงตัว</div><div class="stuck" style="margin:8px 0"><span class="okp">${esc(w.slice(0, p))}</span><span class="badp">${esc(w.slice(p)) || '(หมด string แต่ regex ยังต้องการตัวอักษรเพิ่ม)'}</span></div><p>ตัดตาม regex ได้ไกลสุดถึงตำแหน่ง ${p} (ส่วนสีเขียว) ${p < w.length ? `แล้วเจอ "<span class="mono">${esc(w[p])}</span>" ซึ่งไม่เข้ากับก้อนถัดไปที่ regex ต้องการ — ถอยไปลองตัดแบบอื่นทุกทางแล้วก็ไม่ลงตัว` : 'แต่ string หมดก่อนที่จะครบส่วนบังคับ'}</p><p class="note">เทคนิคดูเร็ว: ทุก string ใน ${esc(rx)} ต้องเขียนเป็น ${esc(RXM.starShape(ast))} — เทียบรูปร่างก่อนแล้วค่อยตัด</p>`;
  }
};
RXM.starShape = (n) => { switch (n.t) { case 'sym': return n.c; case 'eps': return 'e'; case 'empty': return '∅'; case 'cat': return RXM.starShape(n.l) + ' ' + RXM.starShape(n.r); case 'or': return '(' + RXM.starShape(n.l) + ' หรือ ' + RXM.starShape(n.r) + ')'; case 'star': return '(' + RXM.starShape(n.x) + ')ⁿ, n ≥ 0'; } };
RXM.starInit = () => {
  if (!$('rxs-run')) return;
  $('rxs-quick').innerHTML = RXS_QUICK.map(([r, w]) => `<button class="btn sm" data-rx="${esc(r)}" data-w="${esc(w)}"><span class="mono">${esc(r)}</span> ← ${esc(w)}</button>`).join('');
  $('rxs-quick').addEventListener('click', (ev) => { const b = ev.target.closest('button[data-rx]'); if (!b) return; $('rxs-rx').value = b.dataset.rx; $('rxs-w').value = b.dataset.w; RXM.starRender(); });
  $('rxs-run').onclick = RXM.starRender;
  $('rxs-w').addEventListener('keydown', (ev) => { if (ev.key === 'Enter') RXM.starRender(); });
  $('rxs-rx').addEventListener('keydown', (ev) => { if (ev.key === 'Enter') RXM.starRender(); });
  RXM.starRender();
};
RXM.starInit();

// ---- exam-notation problems solved by direct construction (what must the machine remember?) ----
const RX_DIRECT = [
  { id: 'aba', title: 'ชุด 1 ข้อ 13(a)', lang: '{aba}', spec: 'D_ABA', rx: 'aba', read: '{aba} = ภาษาที่มี string เดียวคือ aba → เครื่องต้อง "ตรวจสะกด" ทีละตัวอักษร', remember: 'อ่านมาแล้วตรงกับ prefix ไหนของ aba (ยังไม่อ่าน / a / ab / aba) + กรณีผิดทาง', mean: { 'q0': 'อ่านมาแล้ว 0 ตัว (ตรงกับส่วนหัวว่างของ aba)', 'q1': 'ตรงกับส่วนหัว "a" ของ aba', 'q2': 'ตรงกับส่วนหัว "ab"', 'q3': 'ตรง "aba" ครบพอดี → final', 'd': 'ผิดทางแล้ว — ไม่มีทางเป็น aba (trap)' }, why: { 'q0:a': 'ตัวแรกของ aba คือ a → ตรงส่วนหัว "a"', 'q0:b': 'ตัวแรกต้องเป็น a แต่ได้ b → เป็น aba ไม่ได้แล้ว', 'q1:b': '"a" ต่อด้วย b = "ab" ตรงส่วนหัวถัดไป', 'q1:a': '"aa" ไม่ใช่ส่วนหัวของ aba', 'q2:a': '"ab" ต่อด้วย a = "aba" ครบ', 'q2:b': '"abb" ไม่ใช่ส่วนหัวของ aba', 'q3:a': '"abaa" ยาวกว่า aba — ภาษามีแค่ aba ตัวเดียว', 'q3:b': '"abab" ยาวกว่า aba', 'd:a': 'ผิดแล้วผิดเลย อ่านอะไรต่อก็แก้ไม่ได้', 'd:b': 'ผิดแล้วผิดเลย' } },
  { id: 'astar', title: 'ชุด 1 ข้อ 13(b)', lang: 'aΣ*', spec: 'D_ASTAR', rx: 'a(a ∪ b)*', read: 'aΣ* = a หนึ่งตัว แล้วตามด้วยอะไรก็ได้ (Σ* = ทุก string) → สนใจแค่ตัวแรก', remember: 'ตัวแรกเป็น a หรือยัง (2 กรณี) + กรณีตัวแรกเป็น b', mean: { 'q0': 'ยังไม่ได้อ่านตัวแรก', 'q1': 'ตัวแรกเป็น a แล้ว → เงื่อนไขครบ (final)', 'd': 'ตัวแรกเป็น b → ผิดเงื่อนไขถาวร (trap)' }, why: { 'q0:a': 'ตัวแรกเป็น a ตามที่ aΣ* ต้องการ', 'q0:b': 'ตัวแรกเป็น b — ต่อให้อ่านอะไรอีก ตัวแรกก็เปลี่ยนไม่ได้', 'q1:a': 'Σ* = อะไรก็ได้ → สถานการณ์ไม่เปลี่ยน', 'q1:b': 'Σ* = อะไรก็ได้ → สถานการณ์ไม่เปลี่ยน', 'd:a': 'ผิดถาวร', 'd:b': 'ผิดถาวร' } },
  { id: 'mod3', title: 'ชุด 1 ข้อ 13(c)', lang: '{ω ∈ Σ* | len(ω) % 3 = 0}', spec: 'D_MOD3', rx: '((a ∪ b)(a ∪ b)(a ∪ b))*', read: 'ความยาวหาร 3 ลงตัว — ตัวอักษรเป็นอะไรไม่สำคัญ นับอย่างเดียว', remember: 'ความยาวที่อ่านมา mod 3 = 0, 1 หรือ 2 (3 กรณี) — ไม่ต้องมี trap เพราะไม่มีทางผิด', mean: { 'q0': 'ความยาวที่อ่านมา หาร 3 เหลือเศษ 0 (final — รวม e ที่ยาว 0)', 'q1': 'เศษ 1', 'q2': 'เศษ 2' }, why: { 'q0:a': 'ยาวขึ้น 1 → เศษ 0+1 = 1 (a หรือ b ไม่ต่างกัน สนใจแค่ความยาว)', 'q0:b': 'ยาวขึ้น 1 → เศษ 1', 'q1:a': 'เศษ 1+1 = 2', 'q1:b': 'เศษ 2', 'q2:a': 'เศษ 2+1 = 3 = หารลงตัว → เศษ 0', 'q2:b': 'เศษ 0' } },
  { id: 'comp', title: 'ชุด 1 ข้อ 12', lang: '{a,b}* − L(M)  (M = "ไม่มี bbb")', spec: 'EX212_COMP', rx: null, read: 'Σ* − L(M) คือ complement → ใช้เครื่องเดิมทั้งหมด แค่<b>สลับ final ↔ ไม่ final</b> (M ต้องเป็น DFA complete ก่อน)', remember: 'เหมือน M ทุกประการ: เห็น b ติดกัน 0/1/2 ตัว หรือเจอ bbb แล้ว — แต่ final กลายเป็น q3 ตัวเดียว', mean: { 'q0': 'b ติดกันท้ายสุด = 0 ตัว (ใน M เป็น final — ใน M′ ไม่ใช่)', 'q1': 'b ติดกันท้ายสุด = 1 ตัว (ไม่ final)', 'q2': 'b ติดกันท้ายสุด = 2 ตัว (ไม่ final)', 'q3': 'เคยเจอ bbb แล้ว → final ตัวเดียวของ M′' }, why: { 'q0:a': 'a ทำให้สาย b ที่ติดกันขาด → นับใหม่ = 0 (เหมือน M)', 'q0:b': 'b ติดกัน 1 ตัว', 'q1:a': 'สายขาด → 0', 'q1:b': '1+1 = b ติดกัน 2 ตัว', 'q2:a': 'สายขาด → 0', 'q2:b': '2+1 = bbb ครบ → เคยเจอ bbb', 'q3:a': 'เจอ bbb ไปแล้ว ลบไม่ได้ → อยู่ที่เดิม', 'q3:b': 'เจอแล้วเจอเลย' }, given: 'ex212', givenText: 'โจทย์ข้อ 11 ให้ DFA <b>M</b> นี้มา: M รับ string ที่<b>ไม่มี bbb</b> (b ติดกัน 3 ตัว) — F = {q0, q1, q2}, ส่วน q3 เป็น trap. ความหมาย state ของ M: q0/q1/q2 = "b ติดกันท้ายสุด = 0/1/2 ตัว", q3 = "เคยเจอ bbb แล้ว".<br><b>วิธีทำ complement:</b> Σ* − L(M) = string ที่ M <i>ไม่</i>รับ. การอ่าน string ไม่เปลี่ยน (state และเส้นเหมือน M ทุกเส้น) เปลี่ยนแค่ว่า "จบตรงไหนถือว่ารับ" → สลับ final: F′ = K − F = {q3}. (ทำได้เพราะ M เป็น DFA ที่มีเส้นครบทุก state — ถ้าไม่ครบต้องเติม trap ก่อน)' },
  { id: 'abastar', title: 'ชุด 2 ข้อ 10(a)', lang: '{ab}{a}*', spec: 'D_ABA_STAR', rx: 'ab a*', read: '{ab}{a}* = เซตต่อกัน: ab ก่อน แล้ว a อีก 0 ตัวขึ้นไป', remember: 'ผ่านส่วนบังคับ ab มาแล้วแค่ไหน (ยังไม่อ่าน / a / ab) แล้ววน a ที่ final', mean: { 'q0': 'ยังไม่อ่าน', 'q1': 'อ่าน a แล้ว รอ b', 'q2': 'ผ่าน ab แล้ว → final (ต่อด้วย a ได้อีกกี่ตัวก็ได้)', 'd': 'ผิดรูปแบบ ab a* แล้ว (trap)' }, why: { 'q0:a': 'ตัวแรกของ ab คือ a', 'q0:b': 'ต้องขึ้นต้นด้วย a', 'q1:b': 'ได้ ab ครบส่วนบังคับ', 'q1:a': '"aa" ไม่ใช่ ab', 'q2:a': '{a}* = เติม a ได้ไม่จำกัด ยังอยู่ในภาษา', 'q2:b': 'หลัง ab มีได้แต่ a — b ทำให้หลุด', 'd:a': 'ผิดถาวร', 'd:b': 'ผิดถาวร' } },
  { id: 'abb', title: 'ชุด 2 ข้อ 10(b)', lang: '{a}{a,b}*bb', spec: 'D_A_BB', rx: 'a(a ∪ b)*bb', read: 'ขึ้นต้น a · กลาง Σ* อะไรก็ได้ · ลงท้าย bb — ข้อนี้ยากสุดในชุด เพราะต้องจำ 2 อย่างพร้อมกัน', remember: '(1) ตัวแรกเป็น a หรือยัง (2) ตอนนี้ลงท้ายด้วย b ติดกัน 0 / 1 / ≥2 ตัว', mean: { 'q0': 'ยังไม่อ่านตัวแรก', 'q1': 'ขึ้นต้น a แล้ว · b ติดกันท้ายสุด = 0', 'q2': 'ขึ้นต้น a แล้ว · b ติดกันท้ายสุด = 1', 'q3': 'ขึ้นต้น a แล้ว · b ติดกันท้ายสุด ≥ 2 → ลงท้าย bb = final', 'd': 'ตัวแรกเป็น b (trap)' }, why: { 'q0:a': 'ตัวแรกเป็น a ผ่านเงื่อนไขแรก · ยังไม่มี b ท้าย', 'q0:b': 'ต้องขึ้นต้น a — แก้ไม่ได้แล้ว', 'q1:a': 'a ไม่ใช่ b → b ท้ายยังเป็น 0', 'q1:b': 'b ท้าย = 1', 'q2:a': 'a ทำให้สาย b ท้ายขาด → กลับเป็น 0', 'q2:b': 'b ท้าย = 2 → ลงท้าย bb แล้ว', 'q3:a': 'สายขาด → 0 (ต้องเริ่มสะสม b ใหม่)', 'q3:b': 'bbb ก็ยังลงท้ายด้วย bb → ยังอยู่ในภาษา', 'd:a': 'ผิดถาวร', 'd:b': 'ผิดถาวร' } },
  { id: 'aorb', title: 'ชุด 2 ข้อ 10(c)', lang: '{ω | if ω contains a then it does not contain b}', spec: 'D_A_OR_B', rx: 'a* ∪ b*', read: '"ถ้ามี a แล้วห้ามมี b" = a ล้วน หรือ b ล้วน หรือว่างเปล่า (เงื่อนไข "ถ้า…" จริงเมื่อไม่มี a ด้วย)', remember: 'ยังไม่เห็นอะไร / เห็นแต่ a / เห็นแต่ b / ปนกันแล้ว (trap)', mean: { 'q0': 'ยังไม่อ่าน (final เพราะ e ไม่มี a → เงื่อนไขจริง)', 'qa': 'เห็นแต่ a ล้วน (final)', 'qb': 'เห็นแต่ b ล้วน (final)', 'd': 'มีทั้ง a และ b ปนกัน → ผิดเงื่อนไข (trap)' }, why: { 'q0:a': 'ตัวแรก a → ตอนนี้เป็น a ล้วน', 'q0:b': 'ตัวแรก b → เป็น b ล้วน', 'qa:a': 'ยังเป็น a ล้วน', 'qa:b': 'มี a อยู่แล้วเจอ b → "ถ้ามี a ต้องไม่มี b" ถูกละเมิด', 'qb:b': 'ยังเป็น b ล้วน', 'qb:a': 'มี b อยู่แล้วเจอ a → ตอนนี้มีทั้งคู่ ผิดเงื่อนไข', 'd:a': 'ผิดถาวร', 'd:b': 'ผิดถาวร' } },
  { id: 'eps', title: 'ชุด 3 ข้อ 8(a)', lang: '{e}', spec: 'D_EMPTYSTR', rx: '∅*', read: 'ภาษาที่มี string ว่างตัวเดียว → รับได้เฉพาะตอน "ยังไม่อ่านอะไร"', remember: 'อ่านมาแล้วหรือยัง (2 กรณี)', mean: { 'q0': 'ยังไม่อ่านอะไร = string ว่าง e → final', 'd': 'อ่านมาแล้วอย่างน้อย 1 ตัว → ไม่ใช่ e (trap)' }, why: { 'q0:a': 'พออ่าน 1 ตัว string ก็ไม่ว่างแล้ว', 'q0:b': 'พออ่าน 1 ตัว string ก็ไม่ว่างแล้ว', 'd:a': 'ยาวขึ้นอีก ยิ่งไม่ใช่ e', 'd:b': 'ยาวขึ้นอีก ยิ่งไม่ใช่ e' } },
  { id: 'empty', title: 'ชุด 3 ข้อ 8(b)', lang: '{}', spec: 'D_EMPTY', rx: '∅', read: 'ภาษาว่าง — ไม่รับอะไรเลย → ไม่มี final', remember: 'ไม่ต้องจำอะไร (1 state ไม่ final)', mean: { 'q0': 'ไม่ต้องจำอะไร — ไม่มี final จึงไม่รับอะไรเลย' }, why: { 'q0:a': 'อ่านอะไรก็ไม่มีทางถึง final (ไม่มี final)', 'q0:b': 'อ่านอะไรก็ไม่มีทางถึง final' } },
  { id: 'div4', title: 'ชุด 3 ข้อ 8(c)', lang: '{ω ∈ {0,1}* | decimal value of ω divisible by 4}', spec: 'D_DIV4', rx: null, read: 'แปลงเงื่อนไขเลขคณิตเป็นเงื่อนไขบน string ก่อน: หาร 4 ลงตัว ⇔ เป็น "0" เดี่ยว หรือลงท้าย 00', remember: 'สองบิตท้ายสุดเป็นอะไร (…1 / …10 / …00 หรือ "0" เดี่ยว) + ยังไม่อ่าน', mean: { 'q0': 'ยังไม่อ่าน', 'o': 'บิตท้ายสุด = 1', 'p': 'ลงท้าย "10" (0 หนึ่งตัวหลัง 1)', 't': 'ลงท้าย "00" หรือเป็น "0" ตัวเดียว → หาร 4 ลงตัว = final' }, why: { 'q0:0': '"0" ตัวเดียว = ค่า 0 หาร 4 ลงตัว', 'q0:1': 'บิตท้าย 1 = เลขคี่ ไม่ลงตัว', 'o:0': 'ลงท้าย 10 = เหลืออีก 0 เดียวจะครบ 00', 'o:1': 'บิตท้ายยังเป็น 1', 'p:0': 'ลงท้าย 00 → หาร 4 ลงตัว', 'p:1': 'ลงท้าย 01 → บิตท้าย 1', 't:0': '000 ก็ยังลงท้าย 00', 't:1': 'บิตท้าย 1' } },
];
RXM.directList = () => {
  const box = $('rx-direct-list'); if (!box) return;
  box.innerHTML = RX_DIRECT.map(p => `<button class="btn sm" data-dx="${p.id}"><b>${esc(p.title)}</b>&nbsp;<span class="mono">${esc(p.lang)}</span></button>`).join('');
  box.addEventListener('click', (ev) => { const b = ev.target.closest('button[data-dx]'); if (!b) return; RXM.directShow(b.dataset.dx); });
};
RXM.directShow = (id) => {
  const p = RX_DIRECT.find(x => x.id === id); if (!p) return;
  const spec = FA.EXAM_AUTOMATA && FA.EXAM_AUTOMATA[p.spec]; if (!spec || !FA.exam) { UI.toast('ข้อมูลเฉลยยังไม่พร้อม'); return; }
  const steps = FA.exam.buildSteps(spec); const full = FA.exam.build(spec);
  const acc = [], rej = []; for (const w of FA.stringsUpTo(full.alphabet, 4)) { (FA.runDFA(full, w).accepted ? acc : rej).push(w === '' ? 'e' : w); if (acc.length >= 6 && rej.length >= 6) break; }
  const nF = [...full.finals()].map(q => full.labelOf(q)).join(', ');
  let h = `<div class="prob"><div class="src">${esc(p.title)} · โจทย์แบบข้อสอบจริง (วาดตรง)</div><div style="font-size:1.05rem;margin:4px 0"><b>โจทย์:</b> Draw the state-transition diagram of a FA accepting <span class="mono">${esc(p.lang)}</span> (over Σ = {${esc(full.alphabet.join(', '))}}).</div>
    <div class="row" style="margin-top:8px"><button class="btn sm primary" id="rx-dx-draw">ลองวาดเองใน Editor ก่อน</button><button class="btn sm" id="rx-dx-check">ตรวจที่วาด</button><span class="note" id="rx-dx-verdict"></span></div></div>`;
  h += `<div class="recipe"><div><b>① แปลโจทย์</b>อ่านสัญกรณ์เซตให้เป็นภาษาคน: ต้องขึ้นต้น/ลงท้าย/มีอะไร</div><div><b>② ถาม "ต้องจำอะไร"</b>ระหว่างอ่าน string ทีละตัว เครื่องต้องรู้อะไรบ้างถึงจะตัดสินได้ — แต่ละคำตอบ = 1 state</div><div><b>③ วาดเส้น</b>จากทุก state อ่านทุกตัวอักษร ไปไหน? (DFA ต้องครบ) · ผิดทาง → trap</div><div><b>④ เลือก final + ตรวจ</b>state ไหน "ตรงเงื่อนไข" = วงคู่ · ลอง string 2–3 ตัว รวม e ด้วย</div></div>`;
  const mean = p.mean || {}, why = p.why || {}; const L = (q) => full.labelOf(q);
  const order = steps.map(st => st.added[0]);
  if (p.given) {
    const G = FA.preset(p.given);
    h += `<div class="wstep"><div><h4>ขั้นที่ 0 · โจทย์ให้อะไรมา</h4><p>${p.givenText}</p></div><div><div class="note">เครื่อง M ที่โจทย์ให้ (final = วงคู่)</div><div class="canvas" data-dxv="given"></div><div class="lang">M รับ: <span class="mono">${esc([...FA.stringsUpTo(G.alphabet, 4)].filter(w => FA.runDFA(G, w).accepted).slice(0, 8).map(w => w || 'e').join(', '))}</span> · M ไม่รับ: <span class="mono">${esc([...FA.stringsUpTo(G.alphabet, 5)].filter(w => !FA.runDFA(G, w).accepted).slice(0, 6).map(w => w || 'e').join(', '))}</span></div></div></div>`;
  }
  h += `<div class="wstep"><div><h4>ขั้นที่ 1 · แปลโจทย์</h4><p>${p.read}</p><h4>ขั้นที่ 2 · เครื่องต้องจำอะไร → 1 สิ่งที่จำ = 1 state</h4><p>${esc(p.remember)}</p><table class="tt"><thead><tr><th>state</th><th>หมายถึง (สิ่งที่เครื่องรู้ ณ ตอนนี้)</th></tr></thead><tbody>${order.map(q => `<tr><td class="mono">${esc(L(q))}${q === full.start ? ' ▷' : ''}${full.isFinal(q) ? ' ◎' : ''}</td><td>${esc(mean[q] || '')}</td></tr>`).join('')}</tbody></table><p class="note" style="margin-top:6px">▷ = start (ก่อนอ่านอะไรเลย เครื่อง "รู้" สิ่งนี้) · ◎ = final (ถ้า string จบตอนเครื่องรู้สิ่งนี้ = ตรงเงื่อนไข → accept)</p></div><div><h4>สิ่งที่จะได้ตอนจบ</h4><div class="canvas" data-dxv="final"></div><div class="lang">รับ: <span class="mono">${esc(acc.join(', ') || '—')}</span> · ไม่รับ: <span class="mono">${esc(rej.join(', ') || '—')}</span></div></div></div>`;
  steps.forEach((st, i) => {
    const q = st.added[0]; const drawn = new Set(order.slice(0, i + 1));
    const rows = full.alphabet.map(a => { const t = full.transitions.find(t => t.from === q && t.symbol === a); if (!t) return `<tr><td class="mono">${esc(a)}</td><td colspan="2" class="note">ไม่มีเส้น (NFA — ติด/reject)</td></tr>`; const to = t.to; return `<tr><td class="mono">${esc(a)}</td><td>${why[q + ':' + a] || ''}</td><td class="mono">${esc(L(to))}${to === q ? ' (วนตัวเอง)' : ''}${drawn.has(to) ? '' : ' <span class="badge">วาดใน step ถัดไป</span>'}<div class="note" style="font-family:var(--font)">${esc(mean[to] || '')}</div></td></tr>`; }).join('');
    h += `<div class="wstep"><div><h4>ขั้นที่ 3.${i + 1} · วาด state <span class="mono">${esc(L(q))}</span>${full.isFinal(q) ? ' <span class="badge green">final</span>' : ''}${q === full.start ? ' <span class="badge blue">start</span>' : ''}</h4><p><b>${esc(L(q))} หมายถึง:</b> ${esc(mean[q] || '')}</p><p class="note">${st.text}</p><p style="margin:6px 0 4px"><b>เส้นออกจาก ${esc(L(q))}</b> — ถามทีละตัวอักษร: "ตอนนี้เครื่องรู้ว่า <i>${esc(mean[q] || '')}</i> แล้วอ่านตัวนี้ → เครื่องควรรู้อะไร?" คำตอบตรงกับ state ไหนก็ลากไปตรงนั้น</p><div class="tblwrap"><table class="tt"><thead><tr><th>อ่าน</th><th>เกิดอะไรขึ้น</th><th>ไป state (ความหมาย)</th></tr></thead><tbody>${rows}</tbody></table></div>${full.isFinal(q) ? `<p class="note" style="margin-top:6px">วงคู่: string ที่จบตอนเครื่องรู้ว่า "${esc(mean[q] || '')}" ตรงเงื่อนไขของภาษา</p>` : ''}</div><div><div class="note">รูปเต็ม — state ปัจจุบันและเส้นออกเป็นสีน้ำเงิน · state ที่ยังไม่ถึงคิววาดเป็นสีจาง</div><div class="canvas" data-dxv="${i}"></div></div></div>`;
  });
  h += `<div class="wstep"><div><h4>ขั้นที่ 4 · สรุปคำตอบ (เขียนลงกระดาษ)</h4><ol><li>รูปสุดท้าย ${full.states.length} state · start = ${esc(L(full.start))} · F = {${esc(nF)}}</li><li>ตรวจ: ${esc(acc.slice(0, 3).join(', '))} ต้องรับ · ${esc(rej.slice(0, 3).join(', '))} ต้องไม่รับ — <b>อย่าลืมเช็ค e</b> (start เป็น final ไหม?)</li><li>ถ้าวาดเป็น NFA (ไม่มี trap, เส้นไม่ครบ) ข้อสอบยอมรับ แต่ต้องเขียนกำกับให้ชัดว่า state ไหน final</li></ol>${p.rx ? `<div class="row" style="margin-top:8px"><button class="btn sm" id="rx-dx-thompson">เทียบกับ Thompson ของ ${esc(p.rx)} (ใหญ่กว่ามาก — ไม่แนะนำในข้อสอบ)</button></div>` : ''}</div><div><div class="canvas" data-dxv="final2"></div></div></div>`;
  const body = $('rx-exam-body'); body.innerHTML = h;
  body.querySelectorAll('[data-dxv]').forEach(el => {
    const k = el.dataset.dxv; const v = new FA.AutomatonView(el);
    if (k === 'given') { v.setAutomaton(FA.preset(p.given)); v.fit(36); return; }
    if (k === 'final' || k === 'final2') { v.setAutomaton(full); v.fit(36); return; }
    const i = +k, q = order[i]; const dim = order.slice(i + 1);
    v.setAutomaton(full); v.fit(36);
    v.highlight({ states: [q], transitions: full.transitions.filter(t => t.from === q).map(t => ({ from: t.from, to: t.to })), dim });
  });
  $('rx-dx-draw').onclick = () => { App.editor.setCurrent(new FA.Automaton({ alphabet: full.alphabet, name: p.title }), { sample: '' }); App.show('editor'); window.scrollTo(0, 0); UI.toast('วาดเสร็จแล้วกลับมา module 4 กด "ตรวจที่วาด"'); };
  $('rx-dx-check').onclick = () => { const A = App.current; const out = $('rx-dx-verdict'); if (!A || !A.start) { out.innerHTML = '<span class="bad-t">ยังไม่ได้วาด</span>'; return; } const r = FA.dfaEquivalent(A, full); out.innerHTML = r.equivalent ? '<span class="verdict ok">✔ ภาษาเดียวกับเฉลย</span>' : `<span class="verdict bad">✘ ยังไม่ตรง</span> string <span class="mono">${esc(r.witness === '' ? 'e' : r.witness)}</span> ${r.inA ? 'เครื่องของคุณรับ แต่ไม่อยู่ในภาษา' : 'อยู่ในภาษา แต่เครื่องของคุณไม่รับ'}`; };
  const th = $('rx-dx-thompson'); if (th) th.onclick = () => { $('rx-in').value = p.rx; RXM.build(); $('rx-tree').scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  body.scrollIntoView({ behavior: 'smooth', block: 'start' });
};
RXM.directList();

RXM.gallery = () => {
  const items = [['rx-g-sym', 'a'], ['rx-g-cat', 'ab'], ['rx-g-or', 'a ∪ b'], ['rx-g-star', 'a*']];
  for (const [id, rx] of items) {
    const el = $(id); if (!el) continue;
    const res = RX.buildNFA(RX.parse(rx)); const st = res.stages[res.stages.length - 1];
    const v = new FA.AutomatonView(el); v.setAutomaton(st.automaton); v.fit(28); v.highlight({ transitions: st.added, states: st.addedStates });
  }
  const ex = $('rx-examples'); if (ex) ex.addEventListener('click', (ev) => { const b = ev.target.closest('button[data-rx]'); if (!b) return; $('rx-in').value = b.dataset.rx; RXM.build(); });
};
RXM.gallery();
RXM.runTry = () => {
  if (!RXM.res) return;
  const st = RXM.res.stages[RXM.step.i];
  const ws = $('rx-try').value.split(',').map(x => x.trim()).filter(Boolean).map(x => (x === 'e' || x === 'ε' || x === 'ϵ') ? '' : x);
  let h = `<tr><th>ω</th><th>ผล</th><th>S สุดท้าย</th></tr>`;
  for (const w of ws) {
    const r = FA.runNFA(st.automaton, w);
    h += `<tr><td>${w === '' ? 'e' : esc(w)}</td><td class="${r.accepted ? 'ok' : 'bad'}">${r.accepted ? 'accept' : 'reject'}</td><td>${esc(FA.setLabel(r.sets[r.sets.length - 1].set))}</td></tr>`;
  }
  $('rx-try-out').innerHTML = h;
};
$('rx-build').onclick = RXM.build; $('rx-in').addEventListener('keydown', e => { if (e.key === 'Enter') RXM.build(); });
$('rx-to-editor').onclick = () => { if (RXM.res) App.goto('editor', RXM.res.nfa.clone()); };
$('rx-to-ps').onclick = () => { if (RXM.res) App.goto('powerset', RXM.res.nfa.clone()); };
$('rx-try-run').onclick = RXM.runTry; $('rx-try').addEventListener('keydown', e => { if (e.key === 'Enter') RXM.runTry(); });
document.querySelector('#m-regex .tabs2').addEventListener('click', (ev) => { const b = ev.target.closest('button[data-sub]'); if (!b) return; document.querySelectorAll('#m-regex .tabs2 button').forEach(x => x.classList.toggle('on', x === b)); $('sub-rx').classList.toggle('on', b.dataset.sub === 'rx'); $('sub-se').classList.toggle('on', b.dataset.sub === 'se'); if (b.dataset.sub === 'se') SE.view.fit(); else RXM.view.fit(); });

// ---------- M4b State elimination ----------
const SE = App.se = {};
SE.view = new FA.AutomatonView('se-canvas', { onStateClick: (id) => SE.eliminate(id) });
SE.load = (A) => { SE.A = A; SE.g = new RX.GA(A); SE.render(); $('se-howto').innerHTML = ''; $('se-pairs').innerHTML = ''; SE.orderHint(); $('se-log').innerHTML = ''; $('se-result').textContent = '—'; $('se-check-out').textContent = ''; $('se-explain').innerHTML = `<b>Special form:</b> เพิ่ม s ใหม่ (e → ${esc(A.labelOf(A.start))}) และ f ใหม่ (e จากทุก final) — ตอนนี้ทุกเส้นเป็น regex ได้; <b>คลิก state</b> (ยกเว้น s, f) เพื่อลบ`; $('rk-table').innerHTML = ''; };
SE.display = () => {
  const g = SE.g; const D = new FA.Automaton({ alphabet: [] });
  for (const id of g.alive()) D.states.push({ id, label: g.labels[id], x: g.pos[id].x, y: g.pos[id].y, isStart: id === g.S, isFinal: id === g.Fn });
  for (const k in g.edges) { const [i, j] = k.split('|'); if (g.eliminated.includes(i) || g.eliminated.includes(j)) continue; D.transitions.push({ from: i, symbol: RX.print(g.edges[k]), to: j }); }
  return D;
};
SE.render = (hl) => { SE.view.setAutomaton(SE.display()); SE.view.fit(); SE.view.highlight(hl || {}); if (SE.g.done()) $('se-result').textContent = RX.print(SE.g.result()); };
SE.orderHint = () => {
    // suggest an elimination order: fewest (in × out) pairs first
    const g = SE.g; if (!g) { $('se-order').innerHTML = ''; return; }
    const cand = g.alive().filter(q => q !== g.S && q !== g.Fn).map(q => {
      const ins = g.alive().filter(i => i !== q && g.edge(i, q)).length, outs = g.alive().filter(j => j !== q && g.edge(q, j)).length;
      return { q, ins, outs, pairs: ins * outs };
    }).sort((a, b) => a.pairs - b.pairs);
    $('se-order').innerHTML = cand.length ? 'ลำดับแนะนำ (คู่เข้า×ออกน้อยก่อน → regex สั้นกว่า): ' + cand.map(c => `<b>${esc(g.labels[c.q])}</b> (${c.ins}×${c.outs}=${c.pairs})`).join(' → ') : 'ลบครบแล้ว — อ่านคำตอบจากเส้น s → f';
  };
  SE.howto = (step) => {
    const g = SE.g; const L = (id) => esc(g.labels[id]); const P = (x) => x ? esc(RX.print(x)) : '—';
    const q = L(step.q); const m = (s) => `<span class="mono">${s}</span>`;
    const lab = (x) => x ? P(x) : '?';
    const inTxt = step.ins.map(i => m(`${L(i)} ─${lab(step.pairs.find(p => p.i === i)?.alpha)}→ ${q}`)).join(', ');
    const outTxt = step.outs.map(j => m(`${q} ─${lab(step.pairs.find(p => p.j === j)?.beta)}→ ${L(j)}`)).join(', ');
    const loopTxt = step.gamma ? `${m(`${q} ↻ ${P(step.gamma)}`)} — วนอยู่ที่ ${q} ได้กี่รอบก็ได้ (รวมศูนย์รอบ) จึงเขียนเป็น ${m(`(${P(step.gamma)})*`)}` : `${q} ไม่มีเส้นวนตัวเอง — ข้ามส่วนนี้ได้`;
    const ex = step.pairs[0];
    const exTxt = ex ? `ตัวอย่างคู่แรก: เข้า ${m(P(ex.alpha))} → วน ${m(ex.gamma ? '(' + P(ex.gamma) + ')*' : '(ไม่มี)')} → ออก ${m(P(ex.beta))} ⟹ เขียนต่อกันเป็นเส้นตรง ${m(`${L(ex.i)} ─${P(ex.simp)}→ ${L(ex.j)}`)}${ex.old ? ` (มีเส้นเดิม ${m(P(ex.old))} อยู่แล้ว จึงรวมเป็น "เดิม ∪ ใหม่")` : ''}` : 'ไม่มีคู่เข้า-ออกเลย → แค่ลบ state ทิ้ง';
    $('se-howto').innerHTML = [
      `เลือก state <b>${q}</b> ที่จะลบ`,
      `ดูเส้นที่ติดกับ ${q}: <b>ทางเข้า</b> ${inTxt || '—'} · <b>ทางออก</b> ${outTxt || '—'}`,
      `ดู <b>loop</b>: ${loopTxt}`,
      `ทุกเส้นทางที่ "เดินผ่าน ${q}" = เข้า → วน → ออก — เอาสัญลักษณ์ 3 ส่วนนี้มาเขียนต่อกัน แล้ววาดเป็นเส้นตรงจากต้นทางไปปลายทางแทน (ตารางด้านล่างมีทุกคู่)`,
      exTxt,
      `ลบ ${q} และเส้นทุกเส้นที่ติดกับมัน — เส้นตรงใหม่ "จำ" เส้นทางที่ผ่าน ${q} ไว้แล้ว ภาษาจึงไม่เปลี่ยน`,
      g.done() ? `เหลือแค่ s และ f → <b>คำตอบคือฉลากบนเส้น s → f = ${m(P(g.result()))}</b>` : `ยังเหลือ ${g.alive().length - 2} state → เลือก state ถัดไปแล้วทำซ้ำ`,
    ].map(x => `<li>${x}</li>`).join('');
    let h = `<tr><th>เส้นทางที่ผ่าน ${q}</th><th>เข้า</th><th>วน</th><th>ออก</th><th>เส้นเดิม</th><th>เส้นตรงใหม่</th></tr>`;
    for (const p of step.pairs) {
      const loop = p.gamma ? `(${P(p.gamma)})*` : '—';
      h += `<tr><td class="st">${L(p.i)} ─${P(p.alpha)}→ ${q}${p.gamma ? ` ↻${P(p.gamma)}` : ''} ─${P(p.beta)}→ ${L(p.j)}</td><td>${P(p.alpha)}</td><td>${loop}</td><td>${P(p.beta)}</td><td>${p.old ? P(p.old) : 'ไม่มี'}</td><td class="mk">${L(p.i)} ─<b>${P(p.simp)}</b>→ ${L(p.j)}</td></tr>`;
    }
    if (!step.pairs.length) h += `<tr><td colspan="6" class="dim">ไม่มีคู่เข้า-ออก → แค่ลบ state ทิ้ง</td></tr>`;
    $('se-pairs').innerHTML = h;
  };
SE.eliminate = (id) => {
  const g = SE.g; if (!g || id === g.S || id === g.Fn) { UI.toast('ลบ s และ f ไม่ได้ — ต้องเหลือสองตัวนี้'); return; }
  const step = g.eliminate(id); if (!step) return;
  const A = SE.A;
  const item = document.createElement('div'); item.className = 'item';
  const Pp = (x) => x ? esc(RX.print(x)) : '';
  item.innerHTML = `<b>ลบ ${esc(g.labels[id])}</b>${step.gamma ? ` (มี loop ${esc(RX.print(step.gamma))} → เขียนเป็น (${esc(RX.print(step.gamma))})*)` : ' (ไม่มี loop)'}<div class="mono note" style="white-space:pre-wrap">${step.pairs.length ? step.pairs.map(p => `${esc(g.labels[p.i])} ─${Pp(p.alpha)}→ ${esc(g.labels[id])}${p.gamma ? ' ↻' + Pp(p.gamma) : ''} ─${Pp(p.beta)}→ ${esc(g.labels[p.j])}   ⟹   ${esc(g.labels[p.i])} ─${Pp(p.simp)}→ ${esc(g.labels[p.j])}${p.old ? '   (รวมกับเส้นเดิม ' + Pp(p.old) + ')' : ''}`).join('\n') : 'ไม่มีคู่เข้า-ออก → ลบทิ้งเฉย ๆ'}</div>`;
  $('se-log').appendChild(item);
  SE.render({ transitions: step.pairs.map(p => ({ from: p.i, to: p.j })) });
  SE.howto(step); SE.orderHint();
  $('se-explain').innerHTML = `<b>ลบ ${esc(g.labels[id])}:</b> ทุกทางที่เคย "เดินผ่าน ${esc(g.labels[id])}" (เข้า → วน → ออก) ถูกแทนด้วยเส้นตรงสีน้ำเงินที่เขียนสัญลักษณ์ 3 ส่วนต่อกัน — ดู "วิธีทำทีละขั้น" ด้านขวา${g.done() ? `<br><b>เสร็จ!</b> เหลือ s → f เส้นเดียว: <span class="mono">${esc(RX.print(g.result()))}</span>` : ` — เหลืออีก ${g.alive().length - 2} state`}`;
};
$('se-auto').onclick = () => { if (!SE.g) return; for (const q of SE.A.ids()) if (q !== SE.g.S && q !== SE.g.Fn && !SE.g.eliminated.includes(q)) SE.eliminate(q); };
$('se-reset').onclick = () => { if (SE.A) SE.load(SE.A); };
SE.undo = () => {
  if (!SE.g || !SE.g.log.length) { UI.toast('ยังไม่มีการลบให้ย้อน'); return; }
  const order = SE.g.log.map(s => s.q).slice(0, -1);
  const last = SE.g.log[SE.g.log.length - 1].q;
  SE.load(SE.A); for (const q of order) SE.eliminate(q);
  $('se-explain').innerHTML = `<b>ย้อนแล้ว:</b> ${esc(SE.g.labels[last])} กลับมา${order.length ? ` — ลบไปแล้ว ${order.map(q => esc(SE.g.labels[q])).join(', ')}` : ' — กลับสู่จุดเริ่มต้น'}`;
  SE.view.highlight({ states: [last] });
};
$('se-undo').onclick = SE.undo;
document.addEventListener('keydown', (ev) => { if (ev.target.matches('input,textarea,select')) return; if (ev.key === 'Backspace' && $('m-regex').classList.contains('active') && $('sub-se').classList.contains('on')) { ev.preventDefault(); SE.undo(); } });
$('se-from-editor').onclick = () => SE.load(App.current.clone());
$('se-lib').onclick = () => UI.library(['M4', 'DFA', 'NFA'], (A) => SE.load(A));
$('se-check').onclick = () => { if (!SE.g || !SE.g.done()) { $('se-check-out').textContent = 'ยังลบไม่ครบ'; return; } const rx = SE.g.result(); const N = RX.toNFA(rx, SE.A.alphabet).nfa; const d = FA.dfaEquivalent(SE.A, N); $('se-check-out').innerHTML = d.equivalent ? `<span class="ok-t">✔ L(${esc(RX.print(rx))}) = L(M) (ตรวจ exact)</span>` : `<span class="bad-t">✘ ต่างกันที่ "${esc(d.witness)}"</span>`; };
$('rk-show').onclick = () => { if (!SE.A) return; const k = Math.max(0, Math.min(SE.A.states.length, parseInt($('rk-k').value) || 0)); const rk = RX.Rijk(SE.A); const ids = rk.ids; let h = `<tr><th>R(i,j,${k})</th>${ids.map(j => `<th>${esc(SE.A.labelOf(j))}</th>`).join('')}</tr>`; ids.forEach((qi, i) => { h += `<tr><td class="st">${esc(SE.A.labelOf(qi))}</td>${ids.map((qj, j) => `<td>${esc(RX.print(rk.R(i, j, k)))}</td>`).join('')}</tr>`; }); h += `<tr><td colspan="${ids.length + 1}" class="dim">state หมายเลข 1..n ตามลำดับ: ${ids.map((q, i) => `q${FA.sub(i + 1)}=${esc(SE.A.labelOf(q))}`).join(', ')} · L(M) = ⋃ R(start, f, n) = ${esc(RX.print(rk.language()))}</td></tr>`; $('rk-table').innerHTML = h; };

// ---------- M5 Closure ----------
const CL = App.closure = { op: 'union' };
CL.va = new FA.AutomatonView('cl-ca'); CL.vb = new FA.AutomatonView('cl-cb'); CL.vo = new FA.AutomatonView('cl-out');
CL.step = UI.stepper('cl-step', (i) => CL.show(i));
CL.walkStep = UI.stepper('cl-walk-step', (i) => CL.walkShow(i));
fillSelect($('cl-a'), null, [{ v: '__editor', t: '(automaton ใน Editor)' }]); fillSelect($('cl-b'), null, [{ v: '__editor', t: '(automaton ใน Editor)' }]);
$('cl-a').value = 'ex211'; $('cl-b').value = 'exA';
$('cl-ops').addEventListener('click', (ev) => { const b = ev.target.closest('button[data-op]'); if (!b) return; CL.op = b.dataset.op; document.querySelectorAll('#cl-ops button').forEach(x => x.classList.toggle('on', x === b)); CL.run(); });
$('cl-a').onchange = $('cl-b').onchange = () => CL.run();
const setTxt = (A) => `start = ${A.start ? A.labelOf(A.start) : '?'} · F = ${FA.setLabel([...A.finals()].map(q => A.labelOf(q)))} · ${A.kind()}`;
const L = (A, id) => esc(A.labelOf(id)); const LS = (A, ids) => esc(FA.setLabel(ids.map(q => A.labelOf(q))));
CL.run = () => {
  const A = pick($('cl-a').value), B = pick($('cl-b').value); CL.A = A; CL.B = B; CL.M = null;
  CL.va.setAutomaton(A); CL.va.fit(); CL.vb.setAutomaton(B); CL.vb.fit();
  $('cl-a-set').textContent = setTxt(A); $('cl-b-set').textContent = setTxt(B); $('cl-out-set').textContent = '';
  $('cl-counter').innerHTML = ''; $('cl-walk-out').innerHTML = ''; CL.walkStep.setCount(0);
  const r = FA.closureStages(CL.op, A, B); CL.res = r;
  if (r.error) {
    CL.vo.setAutomaton(new FA.Automaton()); CL.step.setCount(0); $('cl-howto').innerHTML = '';
    if (r.error === 'nfa') {
      const c = r.counter; const X = A.hasEpsilon() || A.isNondetChoice() ? A : B;
      $('cl-explain').innerHTML = `<span class="bad-t"><b>ทำไม่ได้กับ NFA</b> — complement ต้องเป็น DFA ก่อน (Problem 2.3.1)</span>`;
      $('cl-counter').innerHTML = c ? `<b>ดูว่าทำไมสลับวงคู่ใน NFA ถึงผิด:</b> string <span class="mono">${esc(c.w) || 'e'}</span> ใน ${X === A ? 'M₁' : 'M₂'} มีทางเดินจบที่ ${LS(X, c.inF)} (final → accept) <b>และ</b> ทางเดินจบที่ ${LS(X, c.outF)} (ไม่ final) พร้อมกัน<br>ถ้าสลับวงคู่: ${LS(X, c.outF)} กลายเป็น final → "${esc(c.w) || 'e'}" ยังถูก accept อยู่ดี ⇒ string เดียวกันอยู่ทั้งใน L และ "¬L" — เป็นไปไม่ได้ จึงไม่ใช่ complement<br><button class="btn sm" id="cl-fix-dfa" style="margin-top:6px">แปลงเป็น DFA ก่อน (powerset) แล้วทำต่อ</button>` : '';
      const fb = $('cl-fix-dfa'); if (fb) fb.onclick = () => { CL.fixed = { A: FA.toDFA(A), B: FA.toDFA(B) }; CL.runWith(CL.fixed.A, CL.fixed.B); };
    } else if (r.error === 'dfa') {
      $('cl-explain').innerHTML = `<span class="bad-t"><b>Product ต้องใช้ DFA ทั้งคู่</b> — เพราะ state คู่ (p,q) ต้องรู้แน่ว่าแต่ละเครื่องอยู่ที่ไหน</span>`;
      $('cl-counter').innerHTML = `<button class="btn sm" id="cl-fix-dfa">แปลงเป็น DFA ก่อน (powerset) แล้วทำต่อ</button>`;
      $('cl-fix-dfa').onclick = () => CL.runWith(FA.toDFA(A), FA.toDFA(B));
    }
    return;
  }
  CL.M = r.M; CL.step.setCount(r.stages.length, 0);
};
CL.runWith = (A, B) => { CL.A = A; CL.B = B; CL.va.setAutomaton(A); CL.va.fit(); CL.vb.setAutomaton(B); CL.vb.fit(); $('cl-a-set').textContent = setTxt(A); $('cl-b-set').textContent = setTxt(B); $('cl-counter').innerHTML = ''; const r = FA.closureStages(CL.op, A, B); CL.res = r; if (r.error) return; CL.M = r.M; CL.step.setCount(r.stages.length, 0); };
CL.text = (st) => {
  const M = st.automaton, I = st.info, A = CL.A, B = CL.B;
  const F = (ids) => LS(M, ids);
  switch (CL.op) {
    case 'union': return {
      place: () => ['วาง M₁ ไว้บน, M₂ ไว้ล่าง', ['คัดลอก M₁ ทั้งก้อน — state, เส้น, start, final เหมือนเดิมทุกอย่าง', 'คัดลอก M₂ ไว้ข้างล่าง — ถ้าชื่อ state ซ้ำกับ M₁ ให้เติม ′ (เช่น q0′) เพื่อไม่ให้สับสน', `ตอนนี้มี start 2 ตัว (${L(M, I.s1)} และ ${L(M, I.s2)}) — automaton ต้องมี start ตัวเดียว → ขั้นถัดไปแก้`]],
      newStart: () => ['เพิ่ม start ใหม่ชื่อ s', ['วาด state ใหม่ <b>s</b> ไว้ซ้ายสุด ให้เป็น start (▷) และไม่เป็น final', 'ยังไม่ต้องลากเส้นอะไรออกจาก s ในขั้นนี้']],
      eps: () => ['ลากเส้น e จาก s ไปหา start เดิมทั้งสอง', [`ลาก <b>s ─e→ ${L(M, I.s1)}</b> และ <b>s ─e→ ${L(M, I.s2)}</b> (เส้นสีน้ำเงิน)`, `${L(M, I.s1)} และ ${L(M, I.s2)} เลิกเป็น start (เอา ▷ ออก)`, 'ความหมาย: ก่อนอ่านตัวอักษรแรก เครื่อง "เลือก" ได้ว่าจะไปทำตัวเป็น M₁ หรือ M₂ — nondeterminism ทำให้เลือกถูกเสมอถ้ามีทางที่ถูก']],
      finals: () => ['final ไม่ต้องแก้อะไร', [`final = ${F(I.F)} คือ final ของ M₁ รวมกับของ M₂`, 'ตรวจ: string ที่ M₁ รับ → เดิน s ─e→ start ของ M₁ แล้วทำเหมือน M₁ → จบที่ final ของ M₁ ✓ (ฝั่ง M₂ ก็เช่นกัน) ⇒ L(M) = L₁ ∪ L₂']],
    }[st.key]?.();
    case 'concat': return {
      place: () => ['วาง M₁ ไว้ซ้าย, M₂ ไว้ขวา', ['คัดลอก M₁ ทั้งก้อนไว้ซ้าย', 'คัดลอก M₂ ไว้ขวา (ชื่อซ้ำเติม ′)', `ตอนนี้ M₂ ยังมี start ${L(M, I.s2)} และ M₁ ยังมี final ${F(I.F1)} — สองขั้นถัดไปจะเชื่อมและแก้`]],
      eps: () => ['ลากเส้น e จากทุก final ของ M₁ ไป start ของ M₂', [`จาก ${F(I.F1)} แต่ละตัว ลาก <b>─e→ ${L(M, I.s2)}</b> (เส้นสีน้ำเงิน)`, 'ความหมาย: พออ่านส่วนที่อยู่ใน L₁ จบ (ถึง final ของ M₁) ก็ "กระโดดฟรี" ไปเริ่มอ่านส่วนที่อยู่ใน L₂ ต่อทันที']],
      finals: () => ['ปรับ start และ final', [`start = ${L(M, I.s1)} (ของ M₁) ตัวเดียว — start เดิมของ M₂ เลิกเป็น start (เอา ▷ ออก)`,`final = ${F(I.F2)} (ของ M₂) เท่านั้น — ${F(I.F1)} <b>เลิกเป็น final</b> ไม่งั้นเครื่องจะรับ string ที่มีแค่ส่วน L₁ โดยไม่มีส่วน L₂`, 'ตรวจ: string = (ส่วนใน L₁)(ส่วนใน L₂) เดิน M₁ ถึง final → e → เดิน M₂ ถึง final ✓']],
    }[st.key]?.();
    case 'star': return {
      place: () => ['เริ่มจาก M₁', ['คัดลอก M₁ ทั้งก้อน']],
      newStart: () => ['เพิ่ม start ใหม่ s ที่เป็น final ด้วย', ['วาด <b>s</b> ใหม่ เป็น start และ final (วงคู่) พร้อมกัน', 'เหตุผล: L₁* ต้องรับ string ว่าง e (ซ้ำศูนย์รอบ) — จึงต้องมี state ที่เป็น start และ final ในตัวเดียว']],
      epsIn: () => ['ลาก s ─e→ start เดิม', [`<b>s ─e→ ${L(M, I.s1)}</b>; ${L(M, I.s1)} เลิกเป็น start`]],
      epsBack: () => ['ลาก e จากทุก final เดิม ย้อนกลับไป start เดิม', [`จาก ${F(I.F1)} ลาก <b>─e→ ${L(M, I.s1)}</b> (เส้นสีน้ำเงิน)`, 'ความหมาย: จบ 1 รอบของ L₁ แล้ว "เริ่มรอบใหม่" ได้ทันที = ซ้ำกี่รอบก็ได้', `final = ${F(I.F)} (final เดิม + s)`, `ทำไมไม่ทำ ${L(M, I.s1)} เป็น final เฉย ๆ แทนที่จะเพิ่ม s? ถ้า M₁ มีเส้นวนกลับเข้า ${L(M, I.s1)} กลางทาง string ที่ยังไม่ครบ 1 รอบจะถูก accept ผิด (Problem 2.3.2)`]],
    }[st.key]?.();
    case 'complement': return {
      check: () => ['ตรวจก่อน: เป็น DFA ไหม และ complete ไหม', [I.complete ? 'ทุก state มีทางออกครบทุกสัญลักษณ์ → ข้ามขั้นเพิ่ม trap ได้' : 'มี (state, สัญลักษณ์) ที่ไม่มีทางไป → ต้องเพิ่ม trap ก่อน ไม่งั้น string ที่ "ติด" จะไม่ถูก accept ทั้งใน M และ ¬M (ผิด เพราะทุก string ต้องอยู่ฝั่งใดฝั่งหนึ่ง)']],
      trap: () => ['เพิ่ม trap state', [`วาด state <b>${L(M, I.trap)}</b> (ไม่ final) แล้วลากทางที่ขาดทั้งหมด: ${I.missing.map(([q, a]) => `${L(M, q)} ─${esc(a)}→ ${L(M, I.trap)}`).join(', ')}`, `${L(M, I.trap)} วนตัวเองด้วยทุกสัญลักษณ์ — เข้าแล้วออกไม่ได้`]],
      swap: () => ['สลับ final ↔ ไม่ final', [`เดิม final = ${F(I.wasFinal)} → ตอนนี้ final = ${F(I.nowFinal)}`, 'ความหมาย: DFA พา string ทุกตัวไปจบที่ state เดียวแน่นอน — state ที่เคย accept ตอนนี้ reject และกลับกัน ⇒ L(¬M) = Σ* − L(M)']],
    }[st.key]?.();
    case 'product': return {
      complete: () => ['ทำ M₁ และ M₂ ให้ complete (ช่อง M ยังว่าง — ยังไม่ได้สร้างอะไร)', [I.trap1 ? 'M₁ ขาดบางทาง → เพิ่ม trap ให้ M₁' : 'M₁ complete อยู่แล้ว', I.trap2 ? 'M₂ ขาดบางทาง → เพิ่ม trap ให้ M₂' : 'M₂ complete อยู่แล้ว', 'เหตุผล: state คู่ (p,q) ต้องรู้แน่ว่าอ่านแล้วแต่ละเครื่องไปไหน']],
      start: () => [`state แรก = (start ของ M₁, start ของ M₂) = (${L(I.D1, I.p)},${L(I.D2, I.q)})`, ['state ของ M คือ "คู่" — คิดว่าเรากำลังรัน M₁ กับ M₂ ไปพร้อมกัน แล้วจดว่าแต่ละตัวอยู่ที่ไหน', 'เริ่มจากคู่ start ทั้งสอง แล้วค่อย ๆ หาคู่ที่ไปถึงได้ (worklist เหมือน powerset)']],
      pair: () => [`จาก (${L(I.D1, I.p)},${L(I.D2, I.q)}) อ่าน "${esc(I.a)}"`, [`M₁: ${L(I.D1, I.p)} ─${esc(I.a)}→ ${L(I.D1, I.p2)}`, `M₂: ${L(I.D2, I.q)} ─${esc(I.a)}→ ${L(I.D2, I.q2)}`, `ดังนั้น <b>(${L(I.D1, I.p)},${L(I.D2, I.q)}) ─${esc(I.a)}→ (${L(I.D1, I.p2)},${L(I.D2, I.q2)})</b>${I.isNew ? ' — คู่ใหม่ เพิ่มเข้าไปในเครื่อง' : ' — คู่นี้มีอยู่แล้ว แค่ลากเส้น'}`]],
      finals: () => ['final = คู่ที่ทั้งสองตัวเป็น final', [`F = ${esc(I.F.join(', ')) || '∅'}`, '<b>"final" ไม่ได้แปลว่าสร้างทีหลังสุด</b> — แปลว่า "จบ string ที่นี่แล้ว accept" (วงคู่) เช็คทีละคู่: p อยู่ใน F₁ และ q อยู่ใน F₂ ไหม', 'ทำไม? string ∈ L₁ ∩ L₂ ⇔ M₁ จบที่ final <b>และ</b> M₂ จบที่ final พร้อมกัน — ดูได้จาก "เดิน string" ด้านล่าง', 'ถ้าอยากได้ union แทน: ใช้คู่ที่ "อย่างน้อยหนึ่ง" เป็น final (ต้อง complete ทั้งคู่เหมือนกัน)']],
    }[st.key]?.();
    case 'demorgan': return {
      comp1: () => ['ขั้น 1: ¬M₁', ['ทำ complement ของ M₁ (เพิ่ม trap ถ้าจำเป็น แล้วสลับ final)']],
      comp2: () => ['ขั้น 2: ¬M₂', ['ทำ complement ของ M₂ แบบเดียวกัน']],
      union: () => ['ขั้น 3: ¬L₁ ∪ ¬L₂', ['union ด้วย start ใหม่ + e-transition (ได้ NFA)']],
      powerset: () => ['ขั้น 4: แปลง NFA เป็น DFA', [`ใช้ powerset ได้ DFA ${I.n} state — ต้องทำเพราะขั้นถัดไปเป็น complement ซึ่งใช้กับ NFA ไม่ได้`]],
      comp3: () => ['ขั้น 5: complement อีกครั้ง', ['¬(¬L₁ ∪ ¬L₂) = L₁ ∩ L₂ (De Morgan)', 'เห็นว่าใช้แค่ union กับ complement ก็ได้ intersection — นี่คือวิธีที่หนังสือพิสูจน์ (สั้นในทางเขียน แต่เครื่องใหญ่กว่า product มาก)']],
    }[st.key]?.();
  }
};
CL.show = (i) => {
  const r = CL.res; if (!r || r.error) return; const st = r.stages[i];
  CL.vo.setAutomaton(st.automaton); CL.vo.fit(); CL.vo.highlight(st.hl);
  if (st.info.D1) { CL.va.setAutomaton(st.info.D1); CL.va.fit(); CL.vb.setAutomaton(st.info.D2); CL.vb.fit(); if (st.key === 'complete') { CL.va.highlight({ states: st.info.trapId1 ? [st.info.trapId1] : [] }); CL.vb.highlight({ states: st.info.trapId2 ? [st.info.trapId2] : [] }); } else if (st.key === 'pair') { CL.va.highlight({ states: [st.info.p], accept: [st.info.p2], transitions: [{ from: st.info.p, to: st.info.p2 }] }); CL.vb.highlight({ states: [st.info.q], accept: [st.info.q2], transitions: [{ from: st.info.q, to: st.info.q2 }] }); } else { CL.va.highlight({}); CL.vb.highlight({}); } }
  $('cl-out-set').textContent = setTxt(st.automaton);
  const [title, howto] = CL.text(st) || ['', []];
  $('cl-explain').innerHTML = `<b>Step ${i + 1}/${r.stages.length} · ${title}</b>${i === r.stages.length - 1 ? '<br><span class="ok-t">เสร็จ — ลองป้อน string ด้านล่างเพื่อเดินทั้ง 3 เครื่องพร้อมกัน</span>' : ''}`;
  $('cl-howto').innerHTML = howto.map(x => `<li>${x}</li>`).join('');
};
CL.walk = () => {
  if (!CL.M) { UI.toast('ยังไม่มีเครื่อง M'); return; }
  const w = $('cl-walk').value.trim(); CL.w = w;
  const machines = [['M₁', CL.A, CL.va], ['M₂', CL.B, CL.vb], ['M', CL.M, CL.vo]];
  if (CL.op === 'product' && CL.res.D1) { machines[0][1] = CL.res.D1; machines[1][1] = CL.res.D2; CL.va.setAutomaton(CL.res.D1); CL.vb.setAutomaton(CL.res.D2); }
  CL.step.go(CL.res.stages.length - 1);
  CL.runs = machines.map(([name, A, v]) => ({ name, A, v, r: FA.runNFA(A, w) }));
  CL.walkStep.setCount(w.length + 1, 0);
};
CL.walkShow = (i) => {
  const w = CL.w; let h = `<tr><th>เครื่อง</th><th>อ่านแล้ว</th><th>state ตอนนี้</th><th>ผลสุดท้าย</th></tr>`;
  for (const m of CL.runs) {
    const S = m.r.sets[Math.min(i, m.r.sets.length - 1)].set; const F = m.A.finals();
    m.v.highlight({ states: [...S], accept: i === w.length ? [...S].filter(q => F.has(q)) : [], transitions: i > 0 && m.r.sets[i] ? m.r.sets[i].contrib.map(c => ({ from: c.q, to: c.p })) : [] });
    h += `<tr><td class="st">${m.name}</td><td>${esc(w.slice(0, i)) || 'e'}</td><td>${esc(FA.setLabel([...S].map(q => m.A.labelOf(q))))}</td><td class="${m.r.accepted ? 'ok' : 'bad'}">${m.r.accepted ? 'accept' : 'reject'}</td></tr>`;
  }
  $('cl-walk-out').innerHTML = h;
};
$('cl-walk-run').onclick = CL.walk; $('cl-walk').addEventListener('keydown', e => { if (e.key === 'Enter') CL.walk(); });
$('cl-to-editor').onclick = () => { if (CL.M) App.goto('editor', CL.M.clone()); };

// ---------- M6 Pumping game (stepper) ----------
const PG = App.pumping = { role: 'prover' };
const isPrime = (n) => { if (n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; };
const cnt = (w, c) => [...w].filter(x => x === c).length;
const rep = (s, k) => s.repeat(Math.max(0, k));
PG.langs = [
  { id: 'anbn', name: '{ aⁱbⁱ | i ≥ 0 }  เช่น e, ab, aabb', alphabet: ['a', 'b'], regular: false, member: w => /^a*b*$/.test(w) && cnt(w, 'a') === cnt(w, 'b'), sample: n => rep('a', n) + rep('b', n), omega: 'aⁿbⁿ', prefix: 'a ล้วน', yform: 'aᵏ', pumped: (i) => i === 0 ? 'aⁿ⁻ᵏbⁿ' : `aⁿ⁺⁽ⁱ⁻¹⁾ᵏbⁿ`, why: 'จำนวน a ไม่เท่ากับจำนวน b', hint: 'เลือก ω = aⁿbⁿ: n ตัวแรกเป็น a ล้วน ทำให้ y มีแต่ a — ปั๊มแล้วจำนวน a เปลี่ยนแต่ b ไม่เปลี่ยน' },
  { id: 'eq', name: '{ ω | จำนวน a = จำนวน b }', alphabet: ['a', 'b'], regular: false, member: w => cnt(w, 'a') === cnt(w, 'b'), sample: n => rep('a', n) + rep('b', n), omega: 'aⁿbⁿ', prefix: 'a ล้วน', yform: 'aᵏ', pumped: (i) => i === 0 ? 'aⁿ⁻ᵏbⁿ' : `aⁿ⁺⁽ⁱ⁻¹⁾ᵏbⁿ`, why: 'จำนวน a ไม่เท่ากับจำนวน b', hint: 'ใช้ ω = aⁿbⁿ เหมือนเดิม (ทางลัด Example 2.4.4: L ∩ a*b* = aⁿbⁿ ถ้า L regular ก็ต้อง regular ด้วย — ขัดแย้ง)' },
  { id: 'prime', name: '{ aᵖ | p เป็นจำนวนเฉพาะ }', alphabet: ['a'], regular: false, member: w => /^a*$/.test(w) && isPrime(w.length), sample: n => { let p = n; while (!isPrime(p)) p++; return rep('a', p); }, omega: 'aᵖ (p จำนวนเฉพาะ ≥ n)', prefix: 'a ล้วน', yform: 'aᵏ', pumped: (i) => `aᵖ⁺⁽ⁱ⁻¹⁾ᵏ`, why: 'ความยาว p + (i−1)k ไม่ใช่จำนวนเฉพาะ (ในข้อสอบเลือก i = p+1 จะได้ p(1+k) ซึ่งเป็นผลคูณเสมอ)', hint: 'Example 2.4.3 — ในเกมนี้ i ≤ 3 อาจต้องลองหลายค่า แต่ในการพิสูจน์เลือก i = p+1 ได้เลย' },
  { id: 'wwr', name: '{ wwᴿ | w ∈ {a,b}* }  (palindrome ยาวคู่)', alphabet: ['a', 'b'], regular: false, member: w => w.length % 2 === 0 && w === [...w].reverse().join(''), sample: n => rep('a', n) + 'bb' + rep('a', n), omega: 'aⁿbbaⁿ', prefix: 'a ล้วน', yform: 'aᵏ', pumped: (i) => i === 0 ? 'aⁿ⁻ᵏbbaⁿ' : `aⁿ⁺⁽ⁱ⁻¹⁾ᵏbbaⁿ`, why: 'a ข้างหน้ากับข้างหลังไม่เท่ากัน จึงไม่สมมาตร', hint: 'ω = aⁿbbaⁿ — y อยู่ในกลุ่ม a หน้า ปั๊มแล้วไม่สมมาตร' },
  { id: 'ww', name: '{ ww | w ∈ {a,b}* }', alphabet: ['a', 'b'], regular: false, member: w => w.length % 2 === 0 && w.slice(0, w.length / 2) === w.slice(w.length / 2), sample: n => rep('a', n) + 'b' + rep('a', n) + 'b', omega: 'aⁿbaⁿb', prefix: 'a ล้วน', yform: 'aᵏ', pumped: (i) => i === 0 ? 'aⁿ⁻ᵏbaⁿb' : `aⁿ⁺⁽ⁱ⁻¹⁾ᵏbaⁿb`, why: 'ครึ่งแรกกับครึ่งหลังไม่เหมือนกัน', hint: 'ω = aⁿbaⁿb' },
  { id: 'paren', name: 'วงเล็บสมดุล ( )  (Problem 2.4.6)', alphabet: ['(', ')'], regular: false, member: w => { let d = 0; for (const c of w) { d += c === '(' ? 1 : -1; if (d < 0) return false; } return d === 0; }, sample: n => rep('(', n) + rep(')', n), omega: '(ⁿ)ⁿ', prefix: '( ล้วน', yform: '(ᵏ', pumped: (i) => i === 0 ? '(ⁿ⁻ᵏ)ⁿ' : `(ⁿ⁺⁽ⁱ⁻¹⁾ᵏ)ⁿ`, why: 'จำนวน ( ไม่เท่ากับ )', hint: 'ω = (ⁿ)ⁿ' },
  { id: 'abba', name: '(ab ∪ ba)*  — regular! (ลองแล้วจะพิสูจน์ไม่สำเร็จ)', alphabet: ['a', 'b'], regular: true, dfa: () => FA.minimize(FA.preset('fig219')).dfa, sample: n => rep('ab', Math.ceil(n / 2)), hint: 'L regular → คู่แข่งใช้ loop จริงของ DFA แบ่งให้ y ปั๊มได้เสมอ → หา i ที่หลุดไม่ได้ (ตามที่ควรจะเป็น)' },
  { id: 'evenb', name: 'จำนวน b เป็นเลขคู่  — regular!', alphabet: ['a', 'b'], regular: true, dfa: () => FA.preset('ex211'), sample: n => rep('a', n), hint: 'L regular → พิสูจน์ไม่สำเร็จแน่นอน' },
];
PG.langs.forEach(Lg => { if (Lg.regular) Lg.member = (w) => FA.runDFA(Lg.dfa(), w).accepted; });
$('pg-lang').innerHTML = PG.langs.map(Lg => `<option value="${Lg.id}">${esc(Lg.name)}</option>`).join('');
PG.step = UI.stepper('pg-step', (i) => PG.show(i));
document.querySelectorAll('#m-pumping [data-role]').forEach(b => b.onclick = () => { PG.role = b.dataset.role; document.querySelectorAll('#m-pumping [data-role]').forEach(x => x.classList.toggle('on', x === b)); PG.start(); });
$('pg-lang').onchange = () => PG.start(); $('pg-restart').onclick = () => PG.start();
PG.lang = () => PG.langs.find(Lg => Lg.id === $('pg-lang').value);
PG.decomps = (w, n) => { const out = []; for (let i = 0; i < Math.min(n, w.length); i++) for (let j = i + 1; j <= Math.min(n, w.length); j++) out.push({ x: w.slice(0, i), y: w.slice(i, j), z: w.slice(j), i, j }); return out; };
PG.cells = (w, d, n) => { const cls = (k) => !d ? '' : k < d.i ? 'x' : k < d.j ? 'y' : 'z'; return `<div class="tapecells">${[...w].map((c, k) => `<div class="c ${cls(k)} ${n && k < n ? 'first' : ''}">${esc(c)}</div>`).join('')}${w === '' ? '<span class="note">e (ว่าง)</span>' : ''}</div>`; };
PG.start = () => {
  const Lg = PG.lang(); $('pg-lang-note').textContent = Lg.hint;
  PG.n = Lg.regular ? Lg.dfa().states.length : 3 + Math.floor(Math.random() * 3);
  PG.S = { omega: null, decomps: [], sel: null, advSel: null, i: null, results: null };
  $('pg-proof').innerHTML = 'เล่นจนถึง step 6 แล้วร่างพิสูจน์จะปรากฏที่นี่';
  PG.step.setCount(6, 0);
};
PG.quant = (phase) => {
  const you = PG.role === 'prover';
  const rows = [['สมมติว่า L regular', 'จุดตั้งต้นของการหาข้อขัดแย้ง', ''], ['∃ n ≥ 1', you ? 'คู่แข่งเลือก n' : 'คุณเลือก n', you ? 'adv' : 'you'], ['∀ ω ∈ L, |ω| ≥ n', you ? 'คุณเลือก ω' : 'คู่แข่งเลือก ω', you ? 'you' : 'adv'], ['∃ x, y, z: ω = xyz, y ≠ e, |xy| ≤ n', you ? 'คู่แข่งแบ่ง' : 'คุณแบ่ง', you ? 'adv' : 'you'], ['∀ i ≥ 0: xyⁱz ∈ L', you ? 'คุณเลือก i ให้หลุด' : 'คู่แข่งเลือก i', you ? 'you' : 'adv'], ['สรุป', 'ขัดแย้ง ⇒ L ไม่ regular', '']];
  $('pg-quant').innerHTML = rows.map((r, k) => `<div class="q ${r[2]} ${k === phase ? 'cur' : ''}">${esc(r[0])}<span class="who">${esc(r[1])}</span></div>`).join('');
};
PG.show = (k) => {
  const Lg = PG.lang(), S = PG.S, n = PG.n, you = PG.role === 'prover';
  // gates
  if (k >= 3 && !S.omega) { PG.step.go(2); UI.toast('ยืนยัน ω ก่อน'); return; }
  if (k >= 4 && S.sel === null) { PG.step.go(3); UI.toast(you ? 'ดูการแบ่งของคู่แข่งก่อน' : 'เลือกวิธีแบ่ง xyz ก่อน'); return; }
  if (k >= 5 && S.i === null) { PG.step.go(4); UI.toast(you ? 'เลือก i ก่อน' : 'ดู i ที่คู่แข่งเลือกก่อน'); return; }
  PG.quant(k);
  const B = $('pg-board'), X = $('pg-explain'), H = $('pg-howto');
  const titles = ['สมมติว่า L regular', 'คู่แข่งให้ n', 'เลือก ω', 'แบ่ง ω = xyz', 'ปั๊ม y แล้วเลือก i', 'สรุป'];
  $('pg-phase-title').textContent = `step ${k + 1}/6 · ${titles[k]}`;
  if (k === 0) {
    B.innerHTML = `<div class="chain"><div class="b">สมมติ: <b>L regular</b></div><div>⇒</div><div class="b">มี DFA ที่รับ L ได้ มี state จำนวนหนึ่ง = <b>n</b> (เราไม่รู้ว่าเท่าไหร่)</div><div>⇒</div><div class="b">Pumping Theorem ใช้กับ L ได้</div></div><p style="margin-top:14px">เป้าหมายของเรา: หา string ใน L ที่ "ปั๊มไม่ได้" → ขัดแย้งกับ theorem → สมมติฐานผิด → <b>L ไม่ regular</b></p><p class="note" style="margin-top:8px">${Lg.regular ? 'ภาษานี้ regular จริง — เล่นเพื่อดูว่าทำไมหาข้อขัดแย้งไม่ได้' : 'ภาษานี้ไม่ regular — เราจะพิสูจน์ให้ได้'}</p>`;
    X.innerHTML = `<b>ทำไมเริ่มด้วย "สมมติว่า regular"?</b> เพราะ theorem มีรูป "ถ้า regular แล้ว ปั๊มได้" — เราใช้มันได้ก็ต่อเมื่อสมมติว่า regular ก่อน แล้วค่อยพาไปชนข้อขัดแย้ง (proof by contradiction)`;
    H.innerHTML = `<li>เขียนบรรทัดแรกของพิสูจน์: "สมมติว่า L เป็น regular language"</li><li>ต่อด้วย: "ตาม Pumping Theorem จะมีจำนวนเต็ม n ≥ 1 ที่…"</li>`;
    return;
  }
  if (k === 1) {
    B.innerHTML = `<div style="font-size:2.4rem;font-family:var(--mono)">n = ${n}</div><p style="margin-top:8px">${Lg.regular ? `= จำนวน state ของ DFA ของภาษานี้ (${n} state)` : 'คู่แข่งเลือกได้ตามใจ — วิธีพิสูจน์ของเราจึงต้องใช้ได้กับ <b>ทุก n</b> ดังนั้นเราจะเขียน ω ในรูปของ n (เช่น aⁿbⁿ) ไม่ใช่ตัวเลขตายตัว'}</p><p class="note" style="margin-top:8px">ในเกมนี้สุ่ม n มาให้ เพื่อให้เห็น string จริง ๆ — ในข้อสอบเขียนว่า "ให้ n เป็นค่าจาก theorem" แล้วทำงานกับ n เป็นตัวแปร</p>`;
    X.innerHTML = `<b>n คืออะไร?</b> ในการพิสูจน์ theorem n = จำนวน state ของ DFA — string ที่ยาว ≥ n ต้องผ่าน state ซ้ำ (pigeonhole) นั่นคือที่มาของ "วนได้"`;
    H.innerHTML = `<li>เขียน: "ให้ n เป็นค่าที่ theorem รับประกัน"</li><li>ห้ามเลือก n เอง — n มาจากคู่แข่ง</li>`;
    return;
  }
  if (k === 2) {
    const val = S.omega ?? Lg.sample(n);
    B.innerHTML = `<p>เลือก ω ∈ L ที่ยาว ≥ n = ${n} <span class="note">(แนะนำ: ${esc(Lg.sample(n))})</span></p><div class="row" style="margin-top:8px"><input type="text" class="mono" id="pg-omega" value="${esc(val)}" style="flex:1" ${!you ? 'readonly' : ''}><button class="btn sm primary" id="pg-omega-ok">${S.omega ? 'เปลี่ยน ω' : 'ยืนยัน ω'}</button></div><div id="pg-omega-view" style="margin-top:12px">${S.omega ? PG.cells(S.omega, null, n) + `<p class="note" style="margin-top:6px">ขีดแดง = n ตัวแรก (${esc(S.omega.slice(0, n))}) — y จะต้องอยู่ในช่วงนี้</p>` : ''}</div>`;
    $('pg-omega-ok').onclick = () => {
      const w = $('pg-omega').value.trim();
      if (!Lg.member(w)) { UI.toast('ω ต้องอยู่ใน L'); return; } if (w.length < n) { UI.toast(`ω ต้องยาว ≥ n = ${n}`); return; }
      S.omega = w; S.decomps = PG.decomps(w, n); S.sel = null; S.i = null; S.results = null;
      if (Lg.regular) { const c = FA.findPumpingCycle(Lg.dfa(), w); S.advSel = c && !c.error ? S.decomps.findIndex(d => d.i === c.i && d.j === c.j) : 0; S.cycle = c; } else S.advSel = Math.floor(Math.random() * S.decomps.length);
      if (you) S.sel = S.advSel;
      PG.show(2);
    };
    X.innerHTML = `<b>เคล็ดลับเลือก ω:</b> ให้ <b>n ตัวแรกเป็นตัวอักษรเดียวกันหมด</b> (เช่น aⁿ…) — เพราะกติกา |xy| ≤ n บังคับให้ y อยู่ใน n ตัวแรก ⇒ y จะมีแต่ตัวอักษรนั้น ⇒ ปั๊มแล้วเสียสมดุลแน่นอน`;
    H.innerHTML = `<li>เขียน: "เลือก ω = ${esc(Lg.omega || 'string ที่ยาวอย่างน้อย n')} ซึ่ง ω ∈ L และ |ω| ≥ n"</li><li>ตรวจว่า ω อยู่ใน L จริง (เกมจะเช็คให้)</li>`;
    return;
  }
  if (k === 3) {
    const w = S.omega; const d = S.decomps[S.sel ?? S.advSel];
    const rows = S.decomps.map((dd, idx) => `<div class="d ${idx === S.sel ? 'sel' : ''}" data-idx="${idx}"><span class="bar">${[...w].slice(0, Math.min(w.length, n + 2)).map((c, q) => `<span class="${q < dd.i ? 'x' : q < dd.j ? 'y' : 'z'}">${esc(c)}</span>`).join('')}${w.length > n + 2 ? '<span class="z">…</span>' : ''}</span><span class="mono note">x="${esc(dd.x)}" y="${esc(dd.y)}" z="${esc(dd.z).slice(0, 12)}${dd.z.length > 12 ? '…' : ''}"</span>${idx === S.advSel && you ? '<span class="badge red">คู่แข่งเลือก</span>' : ''}</div>`).join('');
    B.innerHTML = `<p><b>กติกาการแบ่ง:</b> y ≠ e และ |xy| ≤ n = ${n} ⇒ <b>y ต้องอยู่ใน ${n} ตัวแรก</b> (ช่องขีดแดง)</p><div style="margin:10px 0">${PG.cells(w, d, n)}</div><div class="row" style="margin-bottom:6px"><span class="badge blue">x</span><span class="badge mark">y (ส่วนที่จะปั๊ม)</span><span class="badge green">z</span><span class="note">— วิธีแบ่งที่ถูกกติกามีทั้งหมด ${S.decomps.length} แบบ ${you ? 'คู่แข่งเลือกมา 1 แบบ (คลิกแบบอื่นเพื่อลองได้)' : '<b>คลิกเลือก 1 แบบ</b>'}</span></div><div class="decomp">${rows}</div>${S.cycle && !S.cycle.error ? `<p class="note" style="margin-top:8px">L นี้ regular: คู่แข่งใช้ loop จริงของ DFA — อ่าน ${n} ตัวแรกแล้ว state ${esc(S.cycle.dfa.labelOf(S.cycle.seq[S.cycle.i]))} ซ้ำ จึงตั้ง y = "${esc(S.cycle.y)}" ที่วนกลับมา state เดิม</p>` : ''}`;
    B.querySelectorAll('.d').forEach(el => el.onclick = () => { S.sel = +el.dataset.idx; S.i = null; S.results = null; PG.show(3); });
    const yInFirst = d ? (new Set([...d.y]).size === 1 ? `y = "${esc(d.y)}" มีแต่ "${esc(d.y[0])}" ล้วน` : `y = "${esc(d.y)}"`) : '';
    X.innerHTML = d ? `<b>ทำไมต้อง |xy| ≤ n?</b> ในพิสูจน์ theorem เราดูแค่ ${n} ตัวแรก ซึ่งผ่าน ${n + 1} configuration แต่มีแค่ ${n} state → state ซ้ำเกิดใน ${n} ตัวแรกแน่นอน → loop (y) จึงอยู่ในช่วงนั้น. ผลคือ ${yInFirst} — ${Lg.regular ? 'สำหรับภาษา regular นี่คือ loop จริง' : 'นี่คือจุดที่เราจะใช้โจมตี'}` : '';
    H.innerHTML = `<li>เขียน: "ตาม theorem, ω = xyz โดย y ≠ e และ |xy| ≤ n"</li><li>เขียน: "เพราะ ${n} ตัวแรกของ ω เป็น ${esc(Lg.prefix || 'แบบเดียวกัน')} ดังนั้น y = ${esc(Lg.yform || 'ส่วนหนึ่งของช่วงนั้น')} สำหรับบาง k ≥ 1"</li><li><b>ห้าม</b>เลือกวิธีแบ่งเอง — ต้องพิสูจน์ให้ครอบคลุม<u>ทุก</u>วิธีแบ่ง (step 6 จะตรวจให้)</li>`;
    return;
  }
  if (k === 4) {
    const d = S.decomps[S.sel];
    if (!you && S.i === null) { const ii = [0, 2, 3, 4].find(q => !Lg.member(d.x + rep(d.y, q) + d.z)); S.i = ii === undefined ? 1 : ii; }
    const rows = [0, 1, 2, 3].map(i => { const s = d.x + rep(d.y, i) + d.z; const inL = Lg.member(s); return `<div class="r ${S.i === i ? 'sel' : ''}" data-i="${i}"><span class="i">i = ${i}</span><div class="tapecells">${[...d.x].map(c => `<div class="c x">${esc(c)}</div>`).join('')}${Array.from({ length: i }, () => [...d.y].map(c => `<div class="c y">${esc(c)}</div>`).join('')).join('<span class="note">·</span>')}${[...d.z].map(c => `<div class="c z">${esc(c)}</div>`).join('')}${s === '' ? '<span class="note">e</span>' : ''}</div><span class="v ${inL ? 'in' : 'out'}">${inL ? '∈ L' : '∉ L'}</span></div>`; }).join('');
    B.innerHTML = `<p>ปั๊ม y = "<span class="mono">${esc(d.y)}</span>" ซ้ำ i ครั้ง (i = 0 คือตัดทิ้ง) แล้วดูว่ายังอยู่ใน L ไหม ${you ? '— <b>คลิกเลือก i ที่ทำให้หลุด</b>' : '— คู่แข่งเลือก i ให้แล้ว'}</p><div class="pump" style="margin-top:10px">${rows}</div>`;
    if (you) B.querySelectorAll('.r').forEach(el => el.onclick = () => { S.i = +el.dataset.i; PG.show(4); });
    const chosen = S.i !== null ? d.x + rep(d.y, S.i) + d.z : null; const inL = chosen !== null && Lg.member(chosen);
    X.innerHTML = S.i === null ? `<b>ความหมายของการปั๊ม:</b> ถ้า y คือ loop จริงของ DFA การวน 0, 1, 2, … รอบ ต้องพาไปจบ state เดิมเสมอ ⇒ ทุกแถวต้อง ∈ L. แถวไหน ∉ L = ข้อขัดแย้ง` : (inL ? `i = ${S.i}: "${esc(chosen)}" ยังอยู่ใน L — ${you ? 'ลอง i อื่น (ส่วนใหญ่ i = 0 หรือ 2 จะหลุด)' : 'คู่แข่งหา i ที่หลุดไม่ได้ (การแบ่งนี้ปั๊มได้)'}` : `<span class="ok-t">i = ${S.i}: "${esc(chosen) || 'e'}" <b>∉ L</b> — พบข้อขัดแย้งสำหรับการแบ่งนี้</span>`);
    H.innerHTML = `<li>เขียน: "เลือก i = ${S.i ?? '?'}: xy<sup>${S.i ?? 'i'}</sup>z = ${esc(Lg.pumped ? Lg.pumped(S.i ?? 0) : '…')}"</li><li>เขียนเหตุผลว่าทำไม string นี้ไม่อยู่ใน L: "${esc(Lg.why || '')}"</li><li>ปกติ i = 0 (ตัด y ทิ้ง) หรือ i = 2 ก็พอ — เลือกอันที่อธิบายง่าย</li>`;
    return;
  }
  if (k === 5) {
    const d = S.decomps[S.sel]; const chosen = d.x + rep(d.y, S.i) + d.z; const win = !Lg.member(chosen);
    if (!S.results) S.results = S.decomps.map(dd => ({ dd, ii: [0, 2, 3].find(q => !Lg.member(dd.x + rep(dd.y, q) + dd.z)) }));
    const allWin = S.results.every(r => r.ii !== undefined);
    const table = `<div class="tblwrap"><table class="tt"><tr><th>x</th><th>y</th><th>z</th><th>i ที่หลุด</th></tr>${S.results.map(r => `<tr class="${r.dd === d ? 'cur' : ''}"><td>${esc(r.dd.x) || 'e'}</td><td class="mk">${esc(r.dd.y)}</td><td>${esc(r.dd.z) || 'e'}</td><td class="${r.ii !== undefined ? 'ok' : 'bad'}">${r.ii !== undefined ? 'i = ' + r.ii : 'ไม่มี (ปั๊มได้)'}</td></tr>`).join('')}</table></div>`;
    if (Lg.regular || !allWin) {
      B.innerHTML = `<div class="chain"><div class="b">L regular ⇒ ปั๊มได้</div><div>?</div><div class="b ok">ปั๊มได้จริง (มีวิธีแบ่งที่ทุก i ยังอยู่ใน L)</div><div>⇒</div><div class="b">ไม่เกิดข้อขัดแย้ง — <b>สรุปอะไรไม่ได้</b></div></div><p style="margin:12px 0">${Lg.regular ? 'ภาษานี้ regular จริง จึงมีวิธีแบ่ง (loop จริงของ DFA) ที่ปั๊มได้ทุก i — theorem ไม่ได้ถูกละเมิด' : 'ω นี้อาจไม่ดีพอ — ลอง ω ที่ n ตัวแรกเป็นตัวอักษรเดียวกัน'}</p>${table}`;
      X.innerHTML = `<b>บทเรียน:</b> Pumping Theorem ใช้ได้ทางเดียว — "ปั๊มไม่ได้ ⇒ ไม่ regular". "ปั๊มได้" ไม่ได้แปลว่า regular (มีภาษาไม่ regular ที่ปั๊มได้)`;
      H.innerHTML = `<li>ถ้าเจอแบบนี้ในข้อสอบ: เปลี่ยน ω หรือใช้ closure property ช่วย (เช่น ∩ กับ a*b*)</li>`;
      $('pg-proof').innerHTML = `<span class="note">ไม่มีข้อขัดแย้ง — ${Lg.regular ? 'ภาษานี้ regular จึงเขียนพิสูจน์ "ไม่ regular" ไม่ได้ (ถ้าจะแสดงว่า regular ให้วาด DFA หรือเขียน regex แทน)' : 'ลอง ω ใหม่'}</span>`;
      return;
    }
    B.innerHTML = `<div class="chain"><div class="b">L regular ⇒ ทุก ω ยาว ≥ n ปั๊มได้</div><div>แต่</div><div class="b bad">ω = ${esc(S.omega)} ปั๊มไม่ได้ (ทุกวิธีแบ่งมี i ที่หลุด)</div><div>⇒</div><div class="b ok"><b>L ไม่ regular</b> ∎</div></div><p style="margin:12px 0">การแบ่งที่คุณเล่น (แถวสว่าง) ชนะแล้ว — และตารางยืนยันว่า<b>ทุกวิธีแบ่ง ${S.results.length} แบบ</b>ก็หา i ที่หลุดได้ จึงครบเงื่อนไข "∃ x,y,z" ของคู่แข่งทุกกรณี</p>${table}`;
    X.innerHTML = `<b>ทำไมสรุปว่า "ไม่ regular" ได้?</b> theorem: regular ⇒ P. เราแสดง ¬P (มี ω ที่ทุกการแบ่งปั๊มแล้วหลุด). ตรรกะ contrapositive: ¬P ⇒ ¬regular`;
    H.innerHTML = `<li>เขียนว่า "ขัดแย้งกับ Pumping Theorem"</li><li>ปิดท้าย: "ดังนั้น L ไม่เป็น regular language ∎"</li><li>คัดลอกร่างพิสูจน์ด้านล่างไปปรับใช้</li>`;
    PG.proof(Lg, d, S.i, chosen);
    return;
  }
};
PG.proof = (Lg, d, i, chosen) => {
  const kk = d.y.length;
  const lines = [
    `<b>Claim:</b> L = ${esc(Lg.name.split('  ')[0])} ไม่เป็น regular`,
    `<b>Proof.</b> สมมติว่า L เป็น regular. ตาม Pumping Theorem จะมีจำนวนเต็ม n ≥ 1 ที่ทุก string ใน L ที่ยาวอย่างน้อย n ปั๊มได้`,
    `เลือก ω = <span class="m">${esc(Lg.omega)}</span> จะได้ ω ∈ L และ |ω| ≥ n <span class="note">(ในเกม: n = ${PG.n}, ω = ${esc(PG.S.omega)})</span>`,
    `ตาม theorem เขียน ω = xyz ได้ โดย y ≠ e และ |xy| ≤ n. เพราะ ${n_(PG.n)} ตัวแรกของ ω เป็น ${esc(Lg.prefix)} จึงได้ <span class="m">y = ${esc(Lg.yform)}</span> สำหรับบาง k ≥ 1 <span class="note">(ในเกม: x = "${esc(d.x)}", y = "${esc(d.y)}" คือ k = ${kk}, z = "${esc(d.z)}")</span>`,
    `เลือก i = ${i}: <span class="m">xy<sup>${i}</sup>z = ${esc(Lg.pumped(i))}</span> ซึ่ง ${esc(Lg.why)} ดังนั้น xy<sup>${i}</sup>z ∉ L <span class="note">(ในเกม: "${esc(chosen) || 'e'}")</span>`,
    `ขัดแย้งกับ Pumping Theorem ที่บอกว่า xy<sup>i</sup>z ∈ L ทุก i ≥ 0. ดังนั้นสมมติฐานผิด — <b>L ไม่เป็น regular</b> ∎`,
    `<span class="note">หมายเหตุ: การพิสูจน์ต้องครอบคลุมทุกการแบ่ง — ประโยค "y = ${esc(Lg.yform)} สำหรับบาง k ≥ 1" ทำหน้าที่นั้น เพราะทุกการแบ่งที่ถูกกติกาจะให้ y แบบนี้เสมอ</span>`,
  ];
  $('pg-proof').innerHTML = `<div class="proof">${lines.map(l => `<div>${l}</div>`).join('')}</div>`;
};
const n_ = (n) => 'n';
// ---------- pigeonhole stepper ----------
const PH = App.pigeon = {};
PG.view = new FA.AutomatonView('pg-canvas');
fillSelect($('pg-dfa'), ['DFA'], [{ v: '__editor', t: '(automaton ใน Editor)' }]);
PH.step = UI.stepper('ph-step', (i) => PH.show(i));
PH.start = () => {
  const A = FA.complete(FA.toDFA(pick($('pg-dfa').value))).dfa; const n = A.states.length;
  let w = $('pg-w').value.trim();
  if (!w || w.length < n) {
    let sug = null; for (const u of FA.stringsUpTo(A.alphabet, n + 3)) { if (u.length >= n && FA.runDFA(A, u).accepted) { sug = u; break; } }
    if (sug) { w = sug; $('pg-w').value = w; UI.toast(`ใช้ ω = ${w} (ต้องยาว ≥ ${n})`); } else { UI.toast(`ต้องการ string ยาว ≥ ${n}`); return; }
  }
  const bad = [...w].find(c => !A.alphabet.includes(c)); if (bad) { UI.toast(`'${bad}' ไม่อยู่ใน Σ`); return; }
  const seq = [A.start]; let q = A.start; for (let i = 0; i < Math.min(n, w.length); i++) { q = A.trans(q, w[i])[0]; seq.push(q); }
  let rep = null; for (let j = 1; j < seq.length && !rep; j++) for (let i = 0; i < j; i++) if (seq[i] === seq[j]) { rep = { i, j }; break; }
  PH.d = { A, n, w, seq, rep, inL: FA.runDFA(A, w).accepted };
  PG.view.setAutomaton(A); PG.view.fit();
  PH.steps = [{ k: 'holes' }, { k: 'pigeons' }]; for (let i = 0; i <= Math.min(n, w.length); i++) PH.steps.push({ k: 'place', i }); PH.steps.push({ k: 'repeat' }, { k: 'pump' }, { k: 'theorem' });
  PH.step.setCount(PH.steps.length, 0);
};
PH.holes = (upto, curIdx) => {
  const { A, seq, rep } = PH.d;
  return `<div class="holes">${A.ids().map(q => { const birds = []; for (let i = 0; i <= upto && i < seq.length; i++) if (seq[i] === q) birds.push(i); const dup = rep && upto >= rep.j && q === seq[rep.j]; return `<div class="hole ${dup ? 'dup' : ''} ${curIdx !== null && seq[curIdx] === q ? 'cur' : ''}"><div class="hn">${esc(A.labelOf(q))}${A.isFinal(q) ? ' ◎' : ''}</div><div class="pg">${birds.map(i => `<span title="configuration ${i}">${i}</span>`).join('')}</div></div>`; }).join('')}</div>`;
};
PH.cfgs = (upto, curIdx) => { const { A, w, seq, rep } = PH.d; return `<div class="cfgs">${seq.slice(0, upto + 1).map((q, i) => `<div class="${i === curIdx ? 'on' : ''} ${rep && upto >= rep.j && (i === rep.i || i === rep.j) ? 'dup' : ''}">${i ? '⊢' : '&nbsp;'} #${i}: (${esc(A.labelOf(q))}, ${esc(w.slice(i)) || 'e'})</div>`).join('')}</div>`; };
PH.tape = (pos, d) => { const { w, n } = PH.d; const cls = (k) => !d ? '' : k < d.i ? 'x' : k < d.j ? 'y' : 'z'; return `<div class="tapecells">${[...w].map((c, k) => `<div class="c ${cls(k)} ${k < n ? 'first' : ''}" style="${k === pos ? 'outline:2px solid var(--blue)' : ''}">${esc(c)}</div>`).join('')}</div><p class="note" style="margin-top:4px">ขีดแดง = ${n} ตัวแรก${d ? ' · ฟ้า x · เหลือง y · เขียว z' : ''}</p>`; };
PH.show = (idx) => {
  const st = PH.steps[idx]; const { A, n, w, seq, rep, inL } = PH.d; const B = $('ph-board'), X = $('ph-explain'); const L = (q) => esc(A.labelOf(q));
  const m = (s) => `<span class="mono">${s}</span>`;
  if (st.k === 'holes') {
    PG.view.highlight({ states: A.ids() }); $('ph-tape').innerHTML = PH.tape(-1, null);
    B.innerHTML = `<p><b>ขั้น 1 · นับ "รัง"</b> — state ทั้งหมดของ DFA คือรังนกพิราบ</p>${PH.holes(-1, null)}<p style="margin-top:8px">n = |K| = <b>${n}</b> รัง</p>`;
    X.innerHTML = `Pigeonhole principle: ถ้ามีนกพิราบ<b>มากกว่า</b>รัง อย่างน้อยหนึ่งรังต้องมีนก ≥ 2 ตัว — เราจะให้ "นก" = configuration และ "รัง" = state`; return;
  }
  if (st.k === 'pigeons') {
    PG.view.highlight({}); $('ph-tape').innerHTML = PH.tape(-1, null);
    B.innerHTML = `<p><b>ขั้น 2 · นับ "นกพิราบ"</b> — อ่านแค่ <b>${n} ตัวแรก</b>ของ ω = ${m(esc(w))} (ช่องขีดแดง)</p><p style="margin-top:6px">ก่อนอ่าน 1 configuration + หลังอ่านแต่ละตัวอีก ${n} = <b>${n + 1} configuration</b> (นก ${n + 1} ตัว) แต่มีรังแค่ <b>${n}</b></p><div class="cfgs" style="margin-top:8px">${Array.from({ length: n + 1 }, (_, i) => `<div>#${i}: หลังอ่าน ${i} ตัว → อยู่ state ?</div>`).join('')}</div>`;
    X.innerHTML = `นก ${n + 1} ตัว > รัง ${n} รัง ⇒ <b>ต้องมีรังที่ได้นก 2 ตัว</b> = มี configuration สองอันที่อยู่ state เดียวกัน — ยังไม่รู้ว่ารังไหน แต่รู้แน่ว่ามี (หัวใจของพิสูจน์). ทำไมดูแค่ ${n} ตัวแรก? เพื่อบังคับให้การซ้ำเกิด<b>ภายใน ${n} ตัวแรก</b> → จะได้ |xy| ≤ n`; return;
  }
  if (st.k === 'place') {
    const i = st.i; const q = seq[i]; const prev = i ? seq[i - 1] : null;
    PG.view.highlight({ states: [q], transitions: prev !== null ? [{ from: prev, to: q }] : [] }); $('ph-tape').innerHTML = PH.tape(i, null);
    const dupNow = rep && i === rep.j; const used = new Set(seq.slice(0, i + 1)).size;
    B.innerHTML = `<p><b>ขั้น 3 · วางนกทีละตัว</b> — นก #${i} ${i ? `= หลังอ่าน "${esc(w[i - 1])}": δ(${L(prev)}, ${esc(w[i - 1])}) = <b>${L(q)}</b>` : `= ก่อนอ่านอะไร อยู่ start = <b>${L(q)}</b>`} → วางลงรัง ${L(q)}</p>${PH.holes(i, i)}${PH.cfgs(i, i)}`;
    X.innerHTML = dupNow ? `<span class="bad-t"><b>รัง ${L(q)} มีนก 2 ตัวแล้ว!</b> นก #${rep.i} และ #${rep.j} อยู่ state เดียวกัน</span> — configuration #${rep.i} = (${L(q)}, ${esc(w.slice(rep.i)) || 'e'}) และ #${rep.j} = (${L(q)}, ${esc(w.slice(rep.j)) || 'e'}) : เครื่องอ่าน "${esc(w.slice(rep.i, rep.j))}" แล้ว<b>กลับมาที่เดิม</b>` : (i < n ? `วางแล้ว ${i + 1} ตัว ใช้รังไป ${used} รัง ยังไม่ซ้ำ — เหลือนก ${n - i} ตัว รังว่าง ${n - used} รัง${n - i > n - used ? ' → นกที่เหลือมากกว่ารังว่าง <b>ต้องซ้ำแน่</b>' : ''}` : `วางครบ ${n + 1} ตัวใน ${n} รัง`); return;
  }
  if (st.k === 'repeat') {
    if (!rep) { B.innerHTML = 'ไม่พบการซ้ำ (string สั้นกว่า n?)'; return; }
    const d = { i: rep.i, j: rep.j }; const x = w.slice(0, rep.i), y = w.slice(rep.i, rep.j), z = w.slice(rep.j);
    const cyc = []; for (let k = rep.i; k < rep.j; k++) cyc.push({ from: seq[k], to: seq[k + 1] });
    PG.view.highlight({ states: [seq[rep.i]], transitions: cyc }); $('ph-tape').innerHTML = PH.tape(-1, d);
    B.innerHTML = `<p><b>ขั้น 4 · ตัด ω เป็น x y z ตรงจุดที่ซ้ำ</b></p><div class="xyz" style="margin:8px 0"><span class="x">${esc(x) || '·'}</span><span class="y">${esc(y)}</span><span class="z">${esc(z) || '·'}</span></div><ul style="margin:0;padding-left:18px;display:grid;gap:4px"><li>x = "${esc(x)}" = ตัวอักษรก่อนนก #${rep.i} → พา start ไป ${L(seq[rep.i])}</li><li><b>y = "${esc(y)}"</b> = ตัวอักษรระหว่างนก #${rep.i} กับ #${rep.j} → พา ${L(seq[rep.i])} <b>วนกลับมา ${L(seq[rep.j])} (state เดียวกัน)</b> — เส้นสีน้ำเงินบนกราฟ</li><li>z = "${esc(z)}" = ที่เหลือทั้งหมด</li></ul>${PH.holes(rep.j, null)}`;
    X.innerHTML = `เงื่อนไขของ theorem ออกมาเองจากตรงนี้: <b>y ≠ e</b> เพราะ #${rep.i} ≠ #${rep.j} (นกคนละตัว ห่างกันอย่างน้อย 1 ตัวอักษร) · <b>|xy| ≤ n</b> เพราะ |xy| = ${rep.j} ≤ ${n} (การซ้ำเกิดใน ${n} ตัวแรกที่เราดู)`; return;
  }
  if (st.k === 'pump') {
    const x = w.slice(0, rep.i), y = w.slice(rep.i, rep.j), z = w.slice(rep.j);
    const rows = [0, 1, 2, 3].map(i => { const s = x + y.repeat(i) + z; const r = FA.runDFA(A, s); return `<tr><td class="st">i = ${i}</td><td>${esc(s) || 'e'}</td><td>${L(r.final)}</td><td class="${r.accepted ? 'ok' : 'bad'}">${r.accepted ? 'accept' : 'reject'}</td></tr>`; }).join('');
    $('ph-tape').innerHTML = PH.tape(-1, { i: rep.i, j: rep.j });
    B.innerHTML = `<p><b>ขั้น 5 · ปั๊ม y</b> — เพราะ y พา ${L(seq[rep.i])} กลับมา ${L(seq[rep.i])} จะวน 0, 1, 2, … รอบ ก็ออกจาก ${L(seq[rep.i])} ไปอ่าน z เหมือนเดิม → จบ state เดิมเสมอ</p><div class="tblwrap" style="margin-top:8px"><table class="tt"><tr><th>i</th><th>xyⁱz</th><th>จบที่</th><th>ผล</th></tr>${rows}</table></div>`;
    X.innerHTML = inL ? `ω ∈ L จึงจบที่ final — และ xyⁱz ทุกตัวก็จบ state เดียวกัน ⇒ <b>xyⁱz ∈ L ทุก i</b> นี่คือข้อความของ Pumping Theorem` : `<span class="bad-t">ω ∉ L</span> — ทุก i จึง reject เหมือนกันหมด (cycle มีจริง แต่ theorem พูดถึงเฉพาะ ω ∈ L — ลอง string ที่อยู่ใน L)`; return;
  }
  if (st.k === 'theorem') {
    PG.view.highlight({}); $('ph-tape').innerHTML = PH.tape(-1, { i: rep.i, j: rep.j });
    B.innerHTML = `<div class="chain"><div class="b">มี DFA n state (L regular)</div><div>⇒</div><div class="b">string ยาว ≥ n ต้องมี state ซ้ำใน n ตัวแรก (pigeonhole)</div><div>⇒</div><div class="b ok">y ≠ e, |xy| ≤ n และ xyⁱz ∈ L ทุก i</div></div><p style="margin-top:12px">นี่คือพิสูจน์ของ <b>Theorem 2.4.1</b> ทั้งหมด — ไม่มีอะไรมากกว่านับนกกับรัง</p><p style="margin-top:6px"><b>เกมด้านบนใช้มันกลับด้าน:</b> ถ้าเจอ ω ∈ L ที่<u>ทุก</u>วิธีแบ่ง xyz มี i ที่ xyⁱz ∉ L ⇒ กล่องขวาสุดเป็นเท็จ ⇒ กล่องซ้ายสุดเป็นเท็จ ⇒ <b>ไม่มี DFA ⇒ L ไม่ regular</b></p>`;
    X.innerHTML = `ข้อสอบฝึกชุด 1 ข้อ 15 ("พิสูจน์ว่า diagram ของ DFA ทุกตัวมี cycle") ก็คือ pigeonhole แบบเดียวกัน: เดินด้วยตัวอักษร a ซ้ำ ๆ n ครั้ง ต้องกลับมา state เดิม = cycle`; return;
  }
};
$('pg-find').onclick = PH.start; $('pg-w').addEventListener('keydown', e => { if (e.key === 'Enter') PH.start(); });

// ---------- worked pigeonhole problems ----------
const EXP = App.exProblems = [
  {
    id: 'q15', title: 'ข้อสอบฝึกชุด 1 ข้อ 15 (10 คะแนน) — DFA ทุกตัวมี cycle',
    statement: 'พิสูจน์ว่า state-transition diagram ของ DFA ทุกตัวต้องมี cycle เสมอ',
    demo: (A) => A.alphabet[0].repeat(A.states.length),
    demoNote: 'เครื่องด้านบนจะเดินด้วยตัวอักษรตัวแรกของ Σ ซ้ำ n ครั้ง (n = จำนวน state) — ดู step 3–9: รังที่ได้นก 2 ตัวคือจุดที่ cycle อยู่',
    steps: [
      ['ตั้งชื่อสิ่งที่มี', 'ให้ M = (K, Σ, δ, s, F) เป็น DFA ใด ๆ, n = |K| และเลือกตัวอักษร a ∈ Σ ตัวใดก็ได้', '"ให้ M = (K, Σ, δ, s, F) เป็น DFA ใด ๆ และให้ n = |K|. เลือก a ∈ Σ"'],
      ['สร้างนกให้มากกว่ารัง', 'เดินเครื่องด้วย string aⁿ (a ซ้ำ n ตัว) จาก s แล้วจดลำดับ state ที่ผ่าน: q₀ = s, q₁ = δ(q₀,a), …, qₙ = δ(qₙ₋₁,a) ได้ทั้งหมด n+1 state — เดินได้ตลอดเพราะ δ ของ DFA นิยามครบทุกคู่ (state, ตัวอักษร)', '"นิยาม q₀ = s และ qᵢ₊₁ = δ(qᵢ, a) สำหรับ i = 0, …, n−1 จะได้ลำดับ q₀, q₁, …, qₙ ยาว n+1 ตัว"'],
      ['Pigeonhole', 'ลำดับมี n+1 ตำแหน่ง แต่ค่าที่เป็นไปได้มีแค่ n ค่า (สมาชิกของ K) → ต้องมี i < j ที่ qᵢ = qⱼ', '"เนื่องจากลำดับมีสมาชิก n+1 ตัวแต่ K มีสมาชิกเพียง n ตัว โดย pigeonhole principle จึงมี 0 ≤ i < j ≤ n ที่ qᵢ = qⱼ"'],
      ['การซ้ำ = cycle', 'ทางเดิน qᵢ →a qᵢ₊₁ →a … →a qⱼ ออกจาก qᵢ แล้วกลับมา qᵢ (เพราะ qⱼ = qᵢ) ยาว j−i ≥ 1 เส้น = cycle ใน diagram (ถ้า j−i = 1 คือ self-loop ซึ่งเป็น cycle เช่นกัน)', '"เส้นทาง qᵢ, qᵢ₊₁, …, qⱼ ใน state-transition diagram เริ่มและจบที่ state เดียวกันและมีความยาว j−i ≥ 1 จึงเป็น cycle"'],
      ['สรุป', 'M เป็น DFA ใดก็ได้ ดังนั้น diagram ของ DFA ทุกตัวมี cycle', '"ดังนั้น state-transition diagram ของ DFA ทุกตัวมี cycle ∎"'],
    ],
    pitfalls: ['ต้องเดิน n ตัว (ไม่ใช่ n−1) เพื่อให้ได้ n+1 ตำแหน่ง > n รัง', 'ต้องอ้างว่า δ เป็นฟังก์ชัน (DFA) — NFA อาจตายกลางทาง และ NFA ที่ไม่มี cycle มีจริง เช่น เครื่องรับ {aba} ที่ไม่มี trap', 'cycle อาจอยู่ที่ trap state (วนตัวเอง) ก็นับ — โจทย์ไม่ได้ถามว่าอยู่ตรงไหน'],
    lecturer: 'เฉลยอาจารย์: นิยาม f : K → K, f(q) = δ(q, a) แล้วอ้างว่ากราฟของฟังก์ชันบนเซตจำกัดต้องมี cycle — คือขั้น 2–4 ย่อในประโยคเดียว',
  },
  {
    id: 'p247', title: 'Textbook Problem 2.4.7 — ภาษาอนันต์ ⇔ มี string ยาว n ≤ |ω| < 2n',
    statement: 'ให้ M = (K, Σ, δ, s, F) เป็น DFA และ n = |K| จงพิสูจน์ว่า L(M) เป็นเซตอนันต์ ก็ต่อเมื่อ M รับ string ω บางตัวที่ n ≤ |ω| < 2n',
    demo: (A) => { const n = A.states.length; for (const u of FA.stringsUpTo(A.alphabet, 2 * n - 1)) if (u.length >= n && FA.runDFA(A, u).accepted) return u; return A.alphabet[0].repeat(n); },
    demoNote: 'เครื่องด้านบนใช้ string ที่ accept และยาว ≥ n — step 10 จะเห็นว่า xy²z, xy³z ยาวขึ้นเรื่อย ๆ แต่ยัง accept (ทิศ ⇐) และ xy⁰z สั้นลงไม่เกิน n ตัว (ทิศ ⇒)',
    steps: [
      ['(⇐) มี string ยาว ≥ n ที่ accept → ภาษาอนันต์', 'ให้ ω ∈ L(M), |ω| ≥ n อ่าน n ตัวแรกของ ω ผ่าน n+1 configuration แต่มี n state → มี i < j ≤ n ที่ state ซ้ำ (pigeonhole เหมือนข้อ 15 แต่ตัวอักษรเป็นของ ω เอง) เขียน ω = xyz โดย y = ตัวอักษรตำแหน่ง i+1..j (y ≠ e)', '"สมมติ ω ∈ L(M) และ |ω| ≥ n. พิจารณา state q₀, …, qₙ ที่ M ผ่านขณะอ่าน n ตัวแรกของ ω โดย pigeonhole มี i < j ≤ n ที่ qᵢ = qⱼ. ให้ ω = xyz โดย |x| = i, |xy| = j"'],
      ['ปั๊มให้ยาวไม่จำกัด', 'y พา qᵢ กลับมา qᵢ ดังนั้น xyᵏz ทุก k ≥ 0 พา M ไปจบ state เดียวกับ ω ซึ่งเป็น final → xy²z, xy³z, … ∈ L(M) และยาวขึ้นเรื่อย ๆ (y ≠ e) → L(M) มี string ไม่จำกัดจำนวน = อนันต์', '"เนื่องจาก (qᵢ, y) ⊢* (qᵢ, e) จึงได้ (s, xyᵏz) ⊢* (f, e) สำหรับทุก k ≥ 0 โดย f ∈ F เดียวกับของ ω. เพราะ y ≠ e string xyᵏz มีความยาวต่างกันทั้งหมด ดังนั้น L(M) อนันต์"'],
      ['(⇒) ภาษาอนันต์ → มี string ยาว n ≤ |ω| < 2n', 'L(M) อนันต์ จึงมี string ยาว ≥ n อยู่แน่ (string ที่ยาว < n มีจำกัด) เลือก ω ∈ L(M) ที่**สั้นที่สุด**ในบรรดาที่ยาว ≥ n', '"เนื่องจาก L(M) อนันต์และมี string ยาวน้อยกว่า n จำนวนจำกัด จึงมี string ใน L(M) ที่ยาว ≥ n. ให้ ω เป็นตัวที่สั้นที่สุดในบรรดานั้น"'],
      ['ถ้ายาวเกิน 2n จะขัดแย้ง', 'สมมติ |ω| ≥ 2n ทำ pigeonhole กับ n ตัวแรกได้ ω = xyz, 1 ≤ |y| ≤ |xy| ≤ n ตัด y ทิ้ง (k = 0): xz ยัง accept, สั้นลงอย่างมาก n ตัว → |xz| ≥ 2n − n = n แต่ |xz| < |ω| ขัดกับที่ว่า ω สั้นที่สุด ดังนั้น |ω| < 2n', '"สมมติ |ω| ≥ 2n. ตามขั้นก่อน ω = xyz โดย 1 ≤ |y| ≤ n และ xz ∈ L(M). แต่ |xz| = |ω| − |y| ≥ 2n − n = n และ |xz| < |ω| ขัดแย้งกับการเลือก ω. ดังนั้น n ≤ |ω| < 2n ∎"'],
    ],
    pitfalls: ['ทิศ ⇒ ต้องเลือก "สั้นที่สุด" ก่อน แล้วค่อยขัดแย้ง — ถ้าเลือก string ยาว ≥ 2n มาตัด อาจยังยาวเกิน 2n', 'ใช้ |xy| ≤ n เพื่อรับประกันว่าตัด y แล้วสั้นลงไม่เกิน n → ยังยาว ≥ n', 'ประโยชน์: เป็น algorithm ตัดสินว่า L(M) จำกัดหรือไม่ — แค่ทดสอบ string ยาว n..2n−1 ทุกตัว (จำนวนจำกัด)'],
    lecturer: '',
  },
];
$('ex-pick').innerHTML = EXP.map(e => `<option value="${e.id}">${esc(e.title)}</option>`).join('');
App.showEx = () => {
  const e = EXP.find(x => x.id === $('ex-pick').value); if (!e) return;
  $('ex-body').innerHTML = `<div class="def" style="margin-bottom:10px"><b>โจทย์:</b> ${esc(e.statement)}</div>
    <ol style="margin:0;padding-left:20px;display:grid;gap:10px">${e.steps.map(([t, why, write]) => `<li><b>${esc(t)}</b><div style="margin-top:2px">${why}</div><div class="proof" style="margin-top:4px;padding:6px 10px;border-left:3px solid var(--green);background:var(--green-soft);border-radius:0 6px 6px 0"><span class="note">เขียนลงกระดาษ:</span> ${esc(write)}</div></li>`).join('')}</ol>
    <p style="margin-top:10px"><b>จุดที่มักพลาด</b></p><ul style="margin:4px 0 0;padding-left:18px;display:grid;gap:3px">${e.pitfalls.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
    ${e.lecturer ? `<p class="note" style="margin-top:8px">${esc(e.lecturer)}</p>` : ''}
    <p class="note" style="margin-top:8px">▶ ทดลองบนเครื่อง: ${esc(e.demoNote)}</p>`;
};
$('ex-pick').onchange = App.showEx; App.showEx();
$('ex-demo').onclick = () => { const e = EXP.find(x => x.id === $('ex-pick').value); const A = FA.complete(FA.toDFA(pick($('pg-dfa').value))).dfa; $('pg-w').value = e.demo(A); PH.start(); document.querySelector('#pg-canvas').scrollIntoView({ block: 'center' }); };

// ---------- M7 Reference ----------
const EX = [
  ['2.1.1', 'e ∈ L(M) เมื่อไหร่? พิสูจน์', 'slide4', 'ลอง ω = e กับ M ที่ s ∈ F และ s ∉ F'],
  ['2.1.2', 'อธิบายภาษาของ DFA ที่ให้', 'ex212', 'ใช้ "ทดสอบหลาย string" + "ตรวจกับ RegEx"'],
  ['2.1.3', 'สร้าง DFA สำหรับ 5 ภาษา (a)–(e)', null, 'วาดเองแล้วตรวจกับ regex เช่น (c) = (ab)*(a ∪ e) ∪ (ba)*(b ∪ e)'],
  ['2.2.1(a)', 'string ไหนถูก NFA accept: a, aa, aab, e', 'fig25', 'ใช้ computation tree'],
  ['2.2.2', 'เขียน regex ของ NFA ในข้อ 2.2.1', 'fig25', 'ใช้ state elimination'],
  ['2.2.3', 'วาด NFA ของ (ab)*(ba)* ∪ aa*, ((ab ∪ aab)*a*)*, …', null, 'ใช้ RegEx → NFA แล้วดูว่าย่อได้ไหม'],
  ['2.4.5', 'พิสูจน์ wwᴿ, ww, ww̄ ไม่ regular', null, 'เล่นเกม Pumping กับภาษา wwᴿ, ww'],
  ['2.5.3', 'หา minimal DFA ของ automata ใน 2.1.2, 2.2.9', 'ex212', 'NFA → DFA → Minimize'],
];
$('ref-ex').innerHTML = EX.map(e => `<label><span style="min-width:64px;font-weight:600">${e[0]}</span><span style="flex:1;font-family:var(--font)">${esc(e[1])} <span class="note">— ${esc(e[3])}</span></span>${e[2] ? `<button class="btn sm" data-load="${e[2]}">โหลด</button>` : ''}</label>`).join('');
$('ref-ex').addEventListener('click', (ev) => { const b = ev.target.closest('button[data-load]'); if (b) App.goto('editor', FA.preset(b.dataset.load)); });
$('btn-tests').onclick = () => { const r = FA.runTests(); $('tests-out').innerHTML = r.text.split('\n').map(l => `<span class="${l.startsWith('✓') ? 'ok-t' : l.startsWith('✗') ? 'bad-t' : ''}">${esc(l)}</span>`).join('\n'); };
})();
</script>
