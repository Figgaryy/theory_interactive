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
RXM.view = new FA.AutomatonView('rx-canvas');
RXM.step = UI.stepper('rx-step', (i) => RXM.show(i));
RXM.build = () => {
  const s = $('rx-in').value;
  try {
    const ast = RX.parse(s); RXM.ast = ast; $('rx-ast').innerHTML = `<div class="note" style="font-family:var(--font)">โครงสร้าง (parse tree) — สร้างจากใบขึ้นไปราก</div><pre style="margin:0">${esc(RX.astTree(ast))}</pre>`;
    const r = RX.toNFA(ast); RXM.res = r;
    $('rx-stages').innerHTML = r.stages.map((sg, k) => `<div class="item" data-k="${k}"><b class="mono">${esc(sg.regex)}</b><div class="note">${esc(sg.desc)}</div></div>`).join('');
    RXM.step.setCount(r.stages.length, r.stages.length - 1);
  } catch (e) { $('rx-ast').innerHTML = `<span class="bad-t">${esc(e.message)}</span>`; }
};
RXM.show = (i) => { const sg = RXM.res.stages[i]; const m = sg.automaton.meta || {}; RXM.view.setAutomaton(sg.automaton); RXM.view.fit(); RXM.view.highlight({ transitions: m.added || [], states: m.addedStates || [] }); document.querySelectorAll('#rx-stages .item').forEach(d => { const on = +d.dataset.k === i; d.style.background = on ? 'var(--mark-soft)' : ''; if (on && d.scrollIntoView) d.scrollIntoView({ block: 'nearest' }); }); $('rx-explain').innerHTML = `<b>Stage ${i + 1}/${RXM.res.stages.length} · ${esc(sg.regex)}</b><br>${esc(sg.desc)}${(m.added || []).length ? ' — <b style="color:var(--blue-ink)">เส้นสีน้ำเงิน</b> = ที่เพิ่งเพิ่มใน stage นี้' : ''}<span class="f">state: ${sg.automaton.states.length} · transitions: ${sg.automaton.transitions.length} (มี e ${sg.automaton.transitions.filter(t => t.symbol === FA.E).length})</span>`; };
$('rx-build').onclick = RXM.build; $('rx-in').addEventListener('keydown', e => { if (e.key === 'Enter') RXM.build(); });
$('rx-to-editor').onclick = () => { if (RXM.res) App.goto('editor', RXM.res.nfa.clone()); };
$('rx-to-ps').onclick = () => { if (RXM.res) App.goto('powerset', RXM.res.nfa.clone()); };
document.querySelector('#m-regex .tabs2').addEventListener('click', (ev) => { const b = ev.target.closest('button[data-sub]'); if (!b) return; document.querySelectorAll('#m-regex .tabs2 button').forEach(x => x.classList.toggle('on', x === b)); $('sub-rx').classList.toggle('on', b.dataset.sub === 'rx'); $('sub-se').classList.toggle('on', b.dataset.sub === 'se'); if (b.dataset.sub === 'se') SE.view.fit(); else RXM.view.fit(); });

// ---------- M4b State elimination ----------
const SE = App.se = {};
SE.view = new FA.AutomatonView('se-canvas', { onStateClick: (id) => SE.eliminate(id) });
SE.load = (A) => { SE.A = A; SE.g = new RX.GA(A); SE.render(); $('se-log').innerHTML = ''; $('se-result').textContent = '—'; $('se-check-out').textContent = ''; $('se-explain').innerHTML = `<b>Special form:</b> เพิ่ม s ใหม่ (e → ${esc(A.labelOf(A.start))}) และ f ใหม่ (e จากทุก final) — ตอนนี้ทุกเส้นเป็น regex ได้; <b>คลิก state</b> (ยกเว้น s, f) เพื่อลบ`; $('rk-table').innerHTML = ''; };
SE.display = () => {
  const g = SE.g; const D = new FA.Automaton({ alphabet: [] });
  for (const id of g.alive()) D.states.push({ id, label: g.labels[id], x: g.pos[id].x, y: g.pos[id].y, isStart: id === g.S, isFinal: id === g.Fn });
  for (const k in g.edges) { const [i, j] = k.split('|'); if (g.eliminated.includes(i) || g.eliminated.includes(j)) continue; D.transitions.push({ from: i, symbol: RX.print(g.edges[k]), to: j }); }
  return D;
};
SE.render = (hl) => { SE.view.setAutomaton(SE.display()); SE.view.fit(); SE.view.highlight(hl || {}); if (SE.g.done()) $('se-result').textContent = RX.print(SE.g.result()); };
SE.eliminate = (id) => {
  const g = SE.g; if (!g || id === g.S || id === g.Fn) { UI.toast('ลบ s และ f ไม่ได้ — ต้องเหลือสองตัวนี้'); return; }
  const step = g.eliminate(id); if (!step) return;
  const A = SE.A;
  const item = document.createElement('div'); item.className = 'item';
  item.innerHTML = `<b>ลบ ${esc(g.labels[id])}</b>${step.gamma ? ` (loop γ = <span class="mono">${esc(RX.print(step.gamma))}</span>)` : ' (ไม่มี loop)'}<div class="mono note" style="white-space:pre-wrap">${step.pairs.length ? step.pairs.map(p => `${esc(g.labels[p.i])} → ${esc(g.labels[p.j])}:  ${esc(g.formula(p))}`).join('\n') : 'ไม่มีคู่เข้า-ออก → ลบทิ้งเฉย ๆ'}</div>`;
  $('se-log').appendChild(item);
  SE.render({ transitions: step.pairs.map(p => ({ from: p.i, to: p.j })) });
  $('se-explain').innerHTML = `<b>ลบ ${esc(g.labels[id])}:</b> ทุกคู่ (qᵢ → ${esc(g.labels[id])} → qⱼ) ได้เส้นใหม่ฉลาก <span class="mono">δ ∪ αγ*β</span> (α = เข้า, γ = loop, β = ออก, δ = เส้น qᵢ→qⱼ เดิม)${g.done() ? `<br><b>เสร็จ!</b> เหลือ s → f เส้นเดียว: <span class="mono">${esc(RX.print(g.result()))}</span>` : ` — เหลืออีก ${g.alive().length - 2} state`}`;
};
$('se-auto').onclick = () => { if (!SE.g) return; for (const q of SE.A.ids()) if (q !== SE.g.S && q !== SE.g.Fn && !SE.g.eliminated.includes(q)) SE.eliminate(q); };
$('se-reset').onclick = () => { if (SE.A) SE.load(SE.A); };
$('se-from-editor').onclick = () => SE.load(App.current.clone());
$('se-lib').onclick = () => UI.library(['M4', 'DFA', 'NFA'], (A) => SE.load(A));
$('se-check').onclick = () => { if (!SE.g || !SE.g.done()) { $('se-check-out').textContent = 'ยังลบไม่ครบ'; return; } const rx = SE.g.result(); const N = RX.toNFA(rx, SE.A.alphabet).nfa; const d = FA.dfaEquivalent(SE.A, N); $('se-check-out').innerHTML = d.equivalent ? `<span class="ok-t">✔ L(${esc(RX.print(rx))}) = L(M) (ตรวจ exact)</span>` : `<span class="bad-t">✘ ต่างกันที่ "${esc(d.witness)}"</span>`; };
$('rk-show').onclick = () => { if (!SE.A) return; const k = Math.max(0, Math.min(SE.A.states.length, parseInt($('rk-k').value) || 0)); const rk = RX.Rijk(SE.A); const ids = rk.ids; let h = `<tr><th>R(i,j,${k})</th>${ids.map(j => `<th>${esc(SE.A.labelOf(j))}</th>`).join('')}</tr>`; ids.forEach((qi, i) => { h += `<tr><td class="st">${esc(SE.A.labelOf(qi))}</td>${ids.map((qj, j) => `<td>${esc(RX.print(rk.R(i, j, k)))}</td>`).join('')}</tr>`; }); h += `<tr><td colspan="${ids.length + 1}" class="dim">state หมายเลข 1..n ตามลำดับ: ${ids.map((q, i) => `q${FA.sub(i + 1)}=${esc(SE.A.labelOf(q))}`).join(', ')} · L(M) = ⋃ R(start, f, n) = ${esc(RX.print(rk.language()))}</td></tr>`; $('rk-table').innerHTML = h; };

// ---------- M5 Closure ----------
const CL = App.closure = { op: 'union' };
CL.va = new FA.AutomatonView('cl-ca'); CL.vb = new FA.AutomatonView('cl-cb'); CL.vo = new FA.AutomatonView('cl-out');
fillSelect($('cl-a'), null, [{ v: '__editor', t: '(automaton ใน Editor)' }]); fillSelect($('cl-b'), null, [{ v: '__editor', t: '(automaton ใน Editor)' }]);
$('cl-a').value = 'ex211'; $('cl-b').value = 'exA';
$('cl-ops').addEventListener('click', (ev) => { const b = ev.target.closest('button[data-op]'); if (!b) return; CL.op = b.dataset.op; document.querySelectorAll('#cl-ops button').forEach(x => x.classList.toggle('on', x === b)); CL.run(); });
$('cl-a').onchange = $('cl-b').onchange = () => CL.run();
CL.run = () => {
  const A = pick($('cl-a').value), B = pick($('cl-b').value); CL.A = A; CL.B = B;
  CL.va.setAutomaton(A); CL.va.fit(); CL.vb.setAutomaton(B); CL.vb.fit();
  let r, extra = '';
  switch (CL.op) {
    case 'union': r = FA.union(A, B); break;
    case 'concat': r = FA.concat(A, B); break;
    case 'star': r = FA.star(A); break;
    case 'complement': r = FA.complement(A); break;
    case 'product': r = FA.product(A, B, 'and'); break;
    case 'demorgan': { const c1 = FA.complement(A), c2 = FA.complement(B); if (c1.error || c2.error) r = { error: c1.error || c2.error }; else { const u = FA.union(c1.M, c2.M).M; const D = FA.powerset(u).dfa; r = FA.complement(D); extra = `¬(¬L₁ ∪ ¬L₂): complement ทั้งคู่ → union (NFA) → แปลงเป็น DFA (${D.states.length} state) → complement อีกครั้ง`; } break; }
  }
  if (r.error) { $('cl-explain').innerHTML = `<span class="bad-t">${esc(r.error)}</span>`; CL.M = null; CL.vo.setAutomaton(new FA.Automaton()); return; }
  CL.M = r.M; CL.vo.setAutomaton(r.M); CL.vo.fit();
  const news = r.added || []; CL.vo.highlight({ states: news, transitions: r.M.transitions.filter(t => t.symbol === FA.E && (news.includes(t.from) || CL.op === 'concat' || CL.op === 'star')).map(t => ({ from: t.from, to: t.to })) });
  $('cl-explain').innerHTML = `<b>${{ union: 'Union (Figure 2-11)', concat: 'Concatenation (Figure 2-12)', star: 'Kleene star (Figure 2-13)', complement: 'Complement', product: 'Intersection — product construction (Problem 2.3.3)', demorgan: 'Intersection — De Morgan' }[CL.op]}:</b> ${esc(r.note)}${extra ? '<br>' + esc(extra) : ''}<br><span class="note">M มี ${r.M.states.length} state · ${r.M.kind()}</span>`;
};
$('cl-test-run').onclick = () => {
  if (!CL.M) return; const ws = $('cl-test').value.split(',').map(x => x.trim()).map(x => x === 'e' ? '' : x);
  let h = `<tr><th>ω</th><th>M₁</th><th>M₂</th><th>M</th></tr>`;
  for (const w of ws) { const f = (X) => { const ok = FA.accepts(X, w); return `<td class="${ok ? 'ok' : 'bad'}">${ok ? '✔' : '✘'}</td>`; }; h += `<tr><td>${w === '' ? 'e' : esc(w)}</td>${f(CL.A)}${f(CL.B)}${f(CL.M)}</tr>`; }
  $('cl-test-out').innerHTML = h;
};
$('cl-to-editor').onclick = () => { if (CL.M) App.goto('editor', CL.M.clone()); };

// ---------- M6 Pumping game ----------
const PG = App.pumping = { role: 'prover' };
const isPrime = (n) => { if (n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; };
const cnt = (w, c) => [...w].filter(x => x === c).length;
PG.langs = [
  { id: 'anbn', name: '{ aⁱbⁱ | i ≥ 0 }', alphabet: ['a', 'b'], regular: false, member: w => /^a*b*$/.test(w) && cnt(w, 'a') === cnt(w, 'b'), sample: n => 'a'.repeat(n) + 'b'.repeat(n), hint: 'เลือก ω = aⁿbⁿ: เพราะ |xy| ≤ n ทำให้ y มีแต่ a — ปั๊มแล้วจำนวน a ≠ b' },
  { id: 'eq', name: '{ ω | จำนวน a = จำนวน b }', alphabet: ['a', 'b'], regular: false, member: w => cnt(w, 'a') === cnt(w, 'b'), sample: n => 'a'.repeat(n) + 'b'.repeat(n), hint: 'ใช้ ω = aⁿbⁿ เหมือนเดิม (หรือใช้ closure: L ∩ a*b* = aⁿbⁿ ต้อง regular ถ้า L regular — Example 2.4.4)' },
  { id: 'prime', name: '{ aⁿ | n เป็นจำนวนเฉพาะ }', alphabet: ['a'], regular: false, member: w => /^a*$/.test(w) && isPrime(w.length), sample: n => { let p = n; while (!isPrime(p)) p++; return 'a'.repeat(p); }, hint: 'Example 2.4.3: ถ้า |y| = q, |ω| = p แล้ว i = p+1 ทำให้ |xyⁱz| = p + pq = p(1+q) ไม่ใช่จำนวนเฉพาะ' },
  { id: 'wwr', name: '{ wwᴿ | w ∈ {a,b}* }  (palindrome คู่)', alphabet: ['a', 'b'], regular: false, member: w => w.length % 2 === 0 && w === [...w].reverse().join(''), sample: n => 'a'.repeat(n) + 'bb' + 'a'.repeat(n), hint: 'ω = aⁿbbaⁿ — y อยู่ในกลุ่ม a หน้า ปั๊มแล้วไม่สมมาตร' },
  { id: 'ww', name: '{ ww | w ∈ {a,b}* }', alphabet: ['a', 'b'], regular: false, member: w => w.length % 2 === 0 && w.slice(0, w.length / 2) === w.slice(w.length / 2), sample: n => 'a'.repeat(n) + 'b' + 'a'.repeat(n) + 'b', hint: 'ω = aⁿbaⁿb' },
  { id: 'paren', name: 'วงเล็บสมดุล ( )  (Problem 2.4.6)', alphabet: ['(', ')'], regular: false, member: w => { let d = 0; for (const c of w) { d += c === '(' ? 1 : -1; if (d < 0) return false; } return d === 0; }, sample: n => '('.repeat(n) + ')'.repeat(n), hint: 'ω = (ⁿ)ⁿ' },
  { id: 'abba', name: '(ab ∪ ba)*  — regular! (ลองแล้วจะแพ้)', alphabet: ['a', 'b'], regular: true, dfa: () => FA.minimize(FA.preset('fig219')).dfa, sample: n => 'ab'.repeat(Math.ceil(n / 2)), hint: 'L regular → คู่แข่งใช้ cycle ใน DFA จริง แบ่งให้ y ปั๊มได้เสมอ → คุณหา i ไม่ได้' },
  { id: 'evenb', name: 'จำนวน b เป็นเลขคู่  — regular!', alphabet: ['a', 'b'], regular: true, dfa: () => FA.preset('ex211'), sample: n => 'a'.repeat(n), hint: 'L regular → คุณจะแพ้เสมอ' },
];
PG.langs.forEach(L => { if (L.regular) L.member = (w) => FA.runDFA(L.dfa(), w).accepted; });
$('pg-lang').innerHTML = PG.langs.map(L => `<option value="${L.id}">${esc(L.name)}</option>`).join('');
document.querySelectorAll('#m-pumping [data-role]').forEach(b => b.onclick = () => { PG.role = b.dataset.role; document.querySelectorAll('#m-pumping [data-role]').forEach(x => x.classList.toggle('on', x === b)); PG.start(); });
$('pg-lang').onchange = () => PG.start();
PG.lang = () => PG.langs.find(L => L.id === $('pg-lang').value);
PG.quant = (phase) => {
  const L = PG.lang(); const you = PG.role === 'prover';
  const rows = [
    ['∀ L regular', 'สมมติว่า L regular (เพื่อหาข้อขัดแย้ง)', ''],
    ['∃ n ≥ 1', you ? 'คู่แข่งเลือก n' : 'คุณเลือก n', you ? 'adv' : 'you'],
    ['∀ ω ∈ L, |ω| ≥ n', you ? 'คุณเลือก ω' : 'คู่แข่งเลือก ω', you ? 'you' : 'adv'],
    ['∃ x, y, z: ω = xyz, y ≠ e, |xy| ≤ n', you ? 'คู่แข่งแบ่ง' : 'คุณแบ่ง', you ? 'adv' : 'you'],
    ['∀ i ≥ 0: xyⁱz ∈ L', you ? 'คุณเลือก i ให้หลุด' : 'คู่แข่งเลือก i', you ? 'you' : 'adv'],
  ];
  $('pg-quant').innerHTML = rows.map((r, k) => `<div class="q ${r[2]} ${k === phase ? 'cur' : ''}">${esc(r[0])}<span class="who">${esc(r[1])}</span></div>`).join('');
};
PG.start = () => {
  const L = PG.lang(); $('pg-lang-note').textContent = L.hint; PG.state = { phase: 1 };
  PG.n = L.regular ? L.dfa().states.length : 3 + Math.floor(Math.random() * 3);
  PG.quant(1);
  const g = $('pg-game'); g.innerHTML = '';
  PG.add(`<b>${PG.role === 'prover' ? 'คู่แข่ง' : 'คุณ'}</b>: n = <b>${PG.n}</b>${L.regular ? ' (= จำนวน state ของ DFA)' : ' (สุ่ม — วิธีพิสูจน์ต้องใช้ได้กับทุก n)'}`);
  if (PG.role === 'prover') {
    PG.add(`<b>คุณ</b>: เลือก ω ∈ L ที่ยาว ≥ ${PG.n} <div class="row" style="margin-top:6px"><input type="text" class="mono" id="pg-omega" value="${esc(L.sample(PG.n))}" style="flex:1"><button class="btn sm primary" id="pg-omega-ok">ยืนยัน ω</button></div>`);
    $('pg-omega-ok').onclick = () => PG.chooseOmega($('pg-omega').value.trim());
  } else {
    PG.omega = L.sample(PG.n);
    PG.add(`<b>คู่แข่ง</b>: ω = <span class="mono">${esc(PG.omega)}</span> (|ω| = ${PG.omega.length})`);
    PG.askDecomp();
  }
};
PG.add = (html, cls = '') => { const d = document.createElement('div'); d.className = 'item ' + cls; d.innerHTML = html; $('pg-game').appendChild(d); return d; };
PG.decomps = (w, n) => { const out = []; for (let i = 0; i < w.length; i++) for (let j = i + 1; j <= Math.min(n, w.length); j++) out.push({ x: w.slice(0, i), y: w.slice(i, j), z: w.slice(j) }); return out; };
PG.xyz = (d) => `<span class="xyz"><span class="x">${esc(d.x) || '·'}</span><span class="y">${esc(d.y)}</span><span class="z">${esc(d.z) || '·'}</span></span> <span class="note">x = "${esc(d.x)}", y = "${esc(d.y)}", z = "${esc(d.z)}"</span>`;
PG.chooseOmega = (w) => {
  const L = PG.lang();
  if (!w || !L.member(w)) { UI.toast('ω ต้องอยู่ใน L'); return; } if (w.length < PG.n) { UI.toast(`ω ต้องยาว ≥ n = ${PG.n}`); return; }
  PG.omega = w; PG.quant(3);
  // adversary picks decomposition
  let d;
  if (L.regular) { const c = FA.findPumpingCycle(L.dfa(), w); d = c && !c.error ? { x: c.x, y: c.y, z: c.z, cyc: c } : PG.decomps(w, PG.n)[0]; }
  else { const all = PG.decomps(w, PG.n); d = all[Math.floor(Math.random() * all.length)]; }
  PG.d = d;
  PG.add(`<b>คู่แข่ง</b> แบ่ง ω = xyz (กติกา: y ≠ e, |xy| ≤ ${PG.n})${d.cyc ? ' — ใช้ cycle จริงของ DFA: state ' + esc(d.cyc.dfa.labelOf(d.cyc.seq[d.cyc.i])) + ' ซ้ำ' : ''}<br>${PG.xyz(d)}`);
  PG.quant(4);
  PG.add(`<b>คุณ</b>: เลือก i แล้วดู xy<sup>i</sup>z <div class="row" style="margin-top:6px">${[0, 1, 2, 3].map(i => `<button class="btn sm" data-i="${i}">i = ${i}</button>`).join('')}</div>`).querySelectorAll('button').forEach(b => b.onclick = () => PG.pick(+b.dataset.i));
};
PG.pick = (i) => {
  const L = PG.lang(); const d = PG.d; const s = d.x + d.y.repeat(i) + d.z; const inL = L.member(s);
  const win = !inL;
  PG.add(`i = ${i}: xy<sup>${i}</sup>z = <span class="mono">${esc(s) || 'e'}</span> → ${inL ? 'ยัง<b>อยู่ใน</b> L' : '<b>ไม่อยู่ใน</b> L'} ${win ? '— <b>คุณชนะรอบนี้</b> ✔' : '— ลอง i อื่น'}`, win ? 'win' : '');
  if (win && !L.regular) {
    const all = PG.decomps(PG.omega, PG.n);
    const rows = all.map(dd => { const ii = [0, 2, 3].find(k => !L.member(dd.x + dd.y.repeat(k) + dd.z)); return { dd, ii }; });
    const okAll = rows.every(r => r.ii !== undefined);
    PG.add(`<b>แต่</b> การพิสูจน์ต้องชนะ<u>ทุก</u>วิธีแบ่งของคู่แข่ง (${all.length} แบบ) — ตรวจอัตโนมัติ:<div class="tblwrap" style="margin-top:6px"><table class="tt"><tr><th>x</th><th>y</th><th>z</th><th>i ที่ทำให้หลุด</th></tr>${rows.map(r => `<tr><td>${esc(r.dd.x) || 'e'}</td><td class="mk">${esc(r.dd.y)}</td><td>${esc(r.dd.z) || 'e'}</td><td class="${r.ii !== undefined ? 'ok' : 'bad'}">${r.ii !== undefined ? 'i = ' + r.ii : 'ไม่พบใน {0,2,3}'}</td></tr>`).join('')}</table></div>${okAll ? '<br><b>✔ ทุกวิธีแบ่งมี i ที่หลุด → ขัดแย้งกับ theorem → L ไม่ regular ∎</b>' : '<br>ยังมีวิธีแบ่งที่หาไม่เจอ — ω นี้อาจไม่ดีพอ ลอง ω อื่น'}`, okAll ? 'win' : 'lose');
  }
  if (!win && L.regular) PG.add(`ทุก i จะยังอยู่ใน L เสมอ เพราะ y พา DFA วนกลับ state เดิม — <b>คุณแพ้ตามคาด</b>: Pumping Theorem ใช้พิสูจน์ "ไม่ regular" เท่านั้น ใช้พิสูจน์ "regular" ไม่ได้`, 'lose');
};
PG.askDecomp = () => {
  const w = PG.omega; PG.quant(3);
  const d = PG.add(`<b>คุณ</b> แบ่ง ω = xyz (y ≠ e, |xy| ≤ ${PG.n}):<div class="row" style="margin-top:6px"><label class="note">|x| =</label><input type="text" class="mono" id="pg-i" value="0" style="width:60px"><label class="note">|xy| =</label><input type="text" class="mono" id="pg-j" value="1" style="width:60px"><button class="btn sm primary" id="pg-dec-ok">ยืนยัน</button></div><div id="pg-dec-prev" style="margin-top:6px"></div>`);
  const prev = () => { const i = +$('pg-i').value, j = +$('pg-j').value; if (!(i >= 0 && j > i && j <= Math.min(PG.n, w.length))) { $('pg-dec-prev').innerHTML = '<span class="bad-t">ผิดกติกา</span>'; return null; } const dd = { x: w.slice(0, i), y: w.slice(i, j), z: w.slice(j) }; $('pg-dec-prev').innerHTML = PG.xyz(dd); return dd; };
  $('pg-i').oninput = $('pg-j').oninput = prev; prev();
  $('pg-dec-ok').onclick = () => { const dd = prev(); if (!dd) return; PG.quant(4); const L = PG.lang(); const ii = [0, 2, 3, 4].find(k => !L.member(dd.x + dd.y.repeat(k) + dd.z)); if (ii !== undefined) PG.add(`<b>คู่แข่ง</b> เลือก i = ${ii}: xy<sup>${ii}</sup>z = <span class="mono">${esc(dd.x + dd.y.repeat(ii) + dd.z) || 'e'}</span> ∉ L → คุณแพ้ (ทุกวิธีแบ่งของ ω นี้แพ้หมด เพราะ L ไม่ regular)`, 'lose'); else PG.add(`คู่แข่งหา i ใน {0,2,3,4} ไม่ได้ — การแบ่งนี้ปั๊มได้ ✔${L.regular ? ' (เพราะ L regular จริง)' : ''}`, 'win'); };
};
// pigeonhole
PG.view = new FA.AutomatonView('pg-canvas');
fillSelect($('pg-dfa'), ['DFA'], [{ v: '__editor', t: '(automaton ใน Editor)' }]);
$('pg-find').onclick = () => {
  const A = pick($('pg-dfa').value); const w = $('pg-w').value.trim() || 'a'.repeat(A.states.length);
  const r = FA.findPumpingCycle(A, w);
  if (!r || r.error) { $('pg-pigeon').innerHTML = `<div class="ln"><span class="why">${esc(r ? r.error : 'ไม่พบ')}</span></div>`; PG.view.setAutomaton(A); PG.view.fit(); return; }
  const D = r.dfa; PG.view.setAutomaton(D); PG.view.fit();
  const cyc = []; for (let k = r.i; k < r.j; k++) cyc.push({ from: r.seq[k], to: r.seq[k + 1] });
  PG.view.highlight({ states: [r.seq[r.i]], transitions: cyc });
  let h = `<div class="ln"><span class="why">n = |K| = ${r.n} → อ่าน ${r.n} ตัวแรกผ่าน ${r.n + 1} configuration แต่มีแค่ ${r.n} state → ต้องมี state ซ้ำ (pigeonhole)</span></div>`;
  r.seq.forEach((q, k) => { h += `<div class="ln ${(k === r.i || k === r.j) ? 'cur' : ''}"><span class="cfg">${k ? '⊢' : '&nbsp;'} (${esc(D.labelOf(q))}, ${esc(w.slice(k)) || 'e'})</span><span class="why">${k === r.i ? 'q' + FA.sub(r.i) + ' ← ซ้ำ' : k === r.j ? 'q' + FA.sub(r.j) + ' = q' + FA.sub(r.i) + ' ← ซ้ำ' : ''}</span></div>`; });
  h += `<div class="ln"><span class="why">x = "${esc(r.x)}", y = "${esc(r.y)}" (พา ${esc(D.labelOf(r.seq[r.i]))} กลับมา ${esc(D.labelOf(r.seq[r.i]))}), z = "${esc(r.z)}" → xyⁱz ${FA.runDFA(D, w).accepted ? 'ถูก accept ทุก i' : 'ถูก reject ทุก i (ω ∉ L แต่ cycle ยังจริง)'}: ${[0, 1, 2].map(i => `i=${i}: ${esc(r.x + r.y.repeat(i) + r.z) || 'e'} ${FA.runDFA(D, r.x + r.y.repeat(i) + r.z).accepted ? '✔' : '✘'}`).join(' · ')}</span></div>`;
  $('pg-pigeon').innerHTML = h;
};

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
