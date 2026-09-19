<script>
// ===== [5] ui helpers + M1 editor/simulator =====
(() => {
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const UI = { $, esc };
FA.ui = UI;
const App = FA.App = { current: null, views: {} };

UI.toast = (msg) => { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2200); };
UI.pill = (txt, cls = '') => `<span class="setpill ${cls}">${esc(txt)}</span>`;
UI.setPills = (set, A, cls = '') => { const arr = FA.sortIds(set); return arr.length ? arr.map(q => UI.pill(A ? A.labelOf(q) : q, (A && A.isFinal(q) ? 'final ' : '') + cls)).join('') : '<span class="setpill">∅</span>'; };
UI.cfg = (A, q, w) => `(${A.labelOf(q)}, ${w === '' ? 'e' : w})`;

// stepper: ⏮ ◀ ▶ ⏭ auto + counter
UI.stepper = (container, onStep) => {
  const c = typeof container === 'string' ? $(container) : container;
  c.innerHTML = `<button class="btn sm" data-a="first" title="ไปต้น">⏮</button><button class="btn sm" data-a="prev" title="ย้อน 1 step">◀</button><button class="btn sm primary" data-a="next" title="ถัดไป 1 step">▶ Step</button><button class="btn sm" data-a="last" title="ไปจบ">⏭</button><button class="btn sm" data-a="auto" title="เล่นอัตโนมัติ">▶▶ Auto</button><span class="cnt">0 / 0</span>`;
  const st = { i: 0, n: 0, timer: null };
  const paint = () => { c.querySelector('.cnt').textContent = `${st.i} / ${Math.max(st.n - 1, 0)}`; c.querySelector('[data-a=prev]').disabled = st.i <= 0; c.querySelector('[data-a=next]').disabled = st.i >= st.n - 1; };
  const go = (i) => { if (!st.n) return; st.i = Math.max(0, Math.min(st.n - 1, i)); paint(); onStep(st.i); };
  const stopAuto = () => { if (st.timer) { clearInterval(st.timer); st.timer = null; c.querySelector('[data-a=auto]').classList.remove('on'); } };
  c.addEventListener('click', (ev) => {
    const b = ev.target.closest('button'); if (!b) return; const a = b.dataset.a;
    if (a === 'first') { stopAuto(); go(0); } else if (a === 'prev') { stopAuto(); go(st.i - 1); } else if (a === 'next') { stopAuto(); go(st.i + 1); } else if (a === 'last') { stopAuto(); go(st.n - 1); }
    else if (a === 'auto') { if (st.timer) stopAuto(); else { b.classList.add('on'); if (st.i >= st.n - 1) go(0); st.timer = setInterval(() => { if (st.i >= st.n - 1) stopAuto(); else go(st.i + 1); }, 900); } }
  });
  return { setCount: (n, start = 0) => { stopAuto(); st.n = n; go(start); }, go, get i() { return st.i; }, get n() { return st.n; }, stop: stopAuto };
};

// library dialog
UI.library = (tags, onPick) => {
  const body = $('dlg-lib-body'); body.innerHTML = '';
  const list = FA.presets.filter(p => !tags || tags.some(t => p.tags.includes(t)));
  for (const p of list) {
    const d = document.createElement('div'); d.className = 'preset';
    d.innerHTML = `<span class="t">${esc(p.title)}${p.tags.includes('star') ? ' <span class="badge mark">worked example</span>' : ''}</span><span class="src">${p.tags.filter(t => t === 'DFA' || t === 'NFA').join('')}</span><span class="s">${esc(p.src)}</span>`;
    d.onclick = () => { $('dlg-library').close(); onPick(p.build(), p); };
    body.appendChild(d);
  }
  $('dlg-library').showModal();
};
$('dlg-lib-close').onclick = () => $('dlg-library').close();
UI.askSymbols = (title, def = 'a') => new Promise((res) => {
  const d = $('dlg-sym'); $('dlg-sym-title').textContent = title; const inp = $('dlg-sym-in'); inp.value = def;
  const done = (v) => { d.close(); $('dlg-sym-ok').onclick = null; $('dlg-sym-cancel').onclick = null; res(v); };
  $('dlg-sym-ok').onclick = () => done(inp.value); $('dlg-sym-cancel').onclick = () => done(null);
  inp.onkeydown = (e) => { if (e.key === 'Enter') done(inp.value); if (e.key === 'Escape') done(null); };
  d.showModal(); inp.focus(); inp.select();
});
UI.parseSyms = (s) => s.split(/[,\s]+/).map(x => x.trim()).filter(Boolean).map(x => (x === 'ε' || x === 'ϵ') ? FA.E : x);
UI.stringList = (s) => s.split(',').map(x => x.trim()).map(x => (x === 'e' || x === 'ε' || x === '""') ? '' : x).filter((x, i, a) => x !== '' || s.includes('e') || s.includes('""') || i === 0 && a.length === 1);

// ---------- M1 Editor + Simulator ----------
const ED = App.editor = { mode: 'select', pending: null, selected: null, run: null, nfaView: 'set' };
const view = App.views.editor = new FA.AutomatonView('ed-canvas', {
  editable: true,
  onChange: () => { ED.dirty(); },
  onStateClick: (id) => ED.stateClick(id),
  onStateDblClick: async (id) => { const A = App.current; const v = await UI.askSymbols('ชื่อ state ใหม่', A.labelOf(id)); if (v && v.trim()) { A.renameState(id, v.trim()); ED.dirty(); } },
  onEdgeClick: (from, to) => ED.edgeClick(from, to),
  onCanvasClick: (p) => ED.canvasClick(p),
});
const stepper = UI.stepper('ed-step', (i) => ED.showStep(i));

ED.setCurrent = (A, opts = {}) => {
  App.current = A; view.setAutomaton(A); view.fit(); ED.pending = null; ED.selected = null; view.clearGhost();
  $('ed-alpha').value = A.alphabet.join(' ');
  if (opts.sample !== undefined) $('ed-input').value = opts.sample;
  ED.refreshDef(); ED.resetRun(); App.save && App.save();
  if (opts.run) ED.runInput();
};
ED.dirty = () => { view.render(); ED.refreshDef(); ED.resetRun(); App.save && App.save(); };
ED.refreshDef = () => {
  const A = App.current; if (!A) return;
  const kind = A.kind();
  const badge = $('ed-badge'); badge.className = 'badge ' + (kind === 'DFA' ? 'green' : kind.startsWith('NFA') ? 'blue' : 'red');
  badge.textContent = { 'DFA': 'DFA', 'NFA-e': 'NFA (มี e)', 'NFA': 'NFA (หลายทาง)', 'DFA-incomplete': 'ไม่ complete', 'empty': 'ว่าง' }[kind];
  $('ed-complete').hidden = kind !== 'DFA-incomplete';
  $('ed-tuple').innerHTML = A.tupleHTML();
  $('ed-nfaview').hidden = kind === 'DFA' || kind === 'DFA-incomplete';
  const w = A.validate(); $('ed-hint').textContent = w.length ? '⚠ ' + w.join(' · ') : 'ลาก state เพื่อจัดวาง · ดับเบิลคลิก state เพื่อเปลี่ยนชื่อ · เลื่อนล้อเมาส์เพื่อซูม';
  // table
  const cols = [...A.alphabet, FA.E];
  let h = `<tr><th>state</th>${cols.map(a => `<th>${a === FA.E ? 'e' : esc(a)}</th>`).join('')}</tr>`;
  for (const s of A.states) {
    h += `<tr><td class="st">${s.isStart ? '▷ ' : ''}${s.isFinal ? '◎ ' : ''}${esc(s.label)}</td>` + cols.map(a => `<td><input data-q="${s.id}" data-a="${a}" value="${esc(A.trans(s.id, a).map(t => A.labelOf(t)).join(','))}" spellcheck="false"></td>`).join('') + '</tr>';
  }
  $('ed-table').innerHTML = h;
};
$('ed-table').addEventListener('change', (ev) => {
  const inp = ev.target; if (inp.tagName !== 'INPUT') return;
  const A = App.current; const q = inp.dataset.q, a = inp.dataset.a;
  const labels = inp.value.split(/[,\s]+/).map(x => x.trim()).filter(Boolean);
  const ids = []; for (const lb of labels) { const st = A.states.find(s => s.label === lb || s.id === lb); if (!st) { UI.toast(`ไม่มี state ชื่อ "${lb}"`); ED.refreshDef(); return; } ids.push(st.id); }
  A.transitions = A.transitions.filter(t => !(t.from === q && t.symbol === a));
  ids.forEach(to => A.addTransition(q, a, to));
  ED.dirty();
});
$('ed-alpha').addEventListener('change', () => { App.current.setAlphabet(UI.parseSyms($('ed-alpha').value)); ED.dirty(); });
$('ed-complete').onclick = () => { const r = FA.complete(App.current); if (r.added) { ED.setCurrent(r.dfa); UI.toast('เพิ่ม trap state แล้ว: ทุก (q,σ) ที่ไม่มีทางไป → trap'); } };
$('ed-tools').addEventListener('click', (ev) => { const b = ev.target.closest('button[data-mode]'); if (!b) return; ED.setMode(b.dataset.mode); });
ED.setMode = (m) => { ED.mode = m; view.mode = m; ED.pending = null; view.clearGhost(); document.querySelectorAll('#ed-tools [data-mode]').forEach(b => b.classList.toggle('on', b.dataset.mode === m)); view.highlight({ selected: ED.selected });
  $('ed-hint').textContent = { select: 'ลาก state เพื่อจัดวาง · ดับเบิลคลิกเพื่อเปลี่ยนชื่อ', state: 'คลิกพื้นที่ว่างเพื่อวาง state ใหม่', trans: 'คลิก state ต้นทาง แล้วคลิก state ปลายทาง (คลิกตัวเดิม = self-loop)', start: 'คลิก state ที่จะให้เป็น start', final: 'คลิก state เพื่อสลับ final / ไม่ final', delete: 'คลิก state หรือเส้น เพื่อลบ' }[m]; };
ED.stateClick = async (id) => {
  const A = App.current;
  switch (ED.mode) {
    case 'select': ED.selected = id; view.highlight({ selected: id }); break;
    case 'start': A.setStart(id); ED.dirty(); break;
    case 'final': A.toggleFinal(id); ED.dirty(); break;
    case 'delete': A.removeState(id); ED.dirty(); break;
    case 'trans': {
      if (!ED.pending) { ED.pending = id; view.pending = id; view.highlight({ selected: id }); break; }
      const from = ED.pending; ED.pending = null; view.pending = null; view.clearGhost();
      const v = await UI.askSymbols(`เส้น ${A.labelOf(from)} → ${A.labelOf(id)}`, A.alphabet[0] || 'a');
      if (v !== null) { for (const s of UI.parseSyms(v)) { if (s !== FA.E && !A.alphabet.includes(s)) { A.alphabet.push(s); $('ed-alpha').value = A.alphabet.join(' '); } A.addTransition(from, s, id); } }
      ED.dirty(); break;
    }
  }
};
ED.edgeClick = async (from, to) => {
  const A = App.current;
  if (ED.mode === 'delete') { A.removeEdge(from, to); ED.dirty(); return; }
  if (ED.mode === 'select' || ED.mode === 'trans') {
    const v = await UI.askSymbols(`แก้เส้น ${A.labelOf(from)} → ${A.labelOf(to)} (ว่าง = ลบ)`, A.edgeLabel(from, to));
    if (v === null) return; A.removeEdge(from, to); for (const s of UI.parseSyms(v)) { if (s !== FA.E && !A.alphabet.includes(s)) A.alphabet.push(s); A.addTransition(from, s, to); } ED.dirty();
  }
};
ED.canvasClick = (p) => {
  const A = App.current;
  if (ED.mode === 'state') { A.addState({ x: Math.round(p.x), y: Math.round(p.y) }); ED.dirty(); }
  else if (ED.mode === 'select') { ED.selected = null; view.highlight({}); }
  else if (ED.mode === 'trans') { ED.pending = null; view.pending = null; view.clearGhost(); view.highlight({}); }
};
document.addEventListener('keydown', (ev) => {
  if (ev.target.matches('input,textarea,select')) return;
  if (!$('m-editor').classList.contains('active')) return;
  if ((ev.key === 'Delete' || ev.key === 'Backspace') && ED.selected) { App.current.removeState(ED.selected); ED.selected = null; ED.dirty(); }
  if (ev.key === 'Escape') ED.setMode('select');
  const km = { s: 'select', a: 'state', t: 'trans', f: 'final', d: 'delete' }; if (km[ev.key]) ED.setMode(km[ev.key]);
  if (ev.key === 'ArrowRight') stepper.go(stepper.i + 1); if (ev.key === 'ArrowLeft') stepper.go(stepper.i - 1);
});
$('ed-layout').onclick = () => { FA.layoutCircle(App.current); view.fit(); ED.dirty(); };
$('ed-clear').onclick = () => { ED.setCurrent(new FA.Automaton({ alphabet: UI.parseSyms($('ed-alpha').value) || ['a', 'b'] })); };

// ---- simulation ----
ED.resetRun = () => { ED.run = null; stepper.setCount(0); $('ed-trace').innerHTML = ''; $('ed-tree').innerHTML = ''; $('ed-verdict').className = 'verdict wait'; $('ed-verdict').textContent = 'ยังไม่ได้รัน'; $('ed-explain').textContent = 'กด ▶ Run แล้วใช้ ◀ ▶ เดินทีละ step'; ED.tape($('ed-input').value, -1); view.highlight({}); };
ED.tape = (w, pos, opts = {}) => {
  const t = $('ed-tape'); let h = '';
  for (let i = 0; i < w.length; i++) h += `<div class="cell ${i < pos ? 'read' : ''} ${i === pos ? 'head' : ''}">${esc(w[i])}</div>`;
  h += `<div class="cell eof ${pos === w.length ? 'head' : ''}">EOF</div>`;
  h += `<div class="ctl"><span class="note">${opts.note || (pos < 0 ? 'input tape' : `อ่านแล้ว ${pos} / ${w.length}`)}</span></div>`;
  t.innerHTML = h;
};
$('ed-input').addEventListener('input', () => ED.resetRun());
$('ed-run').onclick = () => ED.runInput();
$('ed-nfaview').addEventListener('click', (ev) => { const b = ev.target.closest('button[data-view]'); if (!b) return; ED.nfaView = b.dataset.view; document.querySelectorAll('#ed-nfaview button').forEach(x => x.classList.toggle('on', x === b)); $('ed-trace').hidden = ED.nfaView === 'tree'; $('ed-tree').hidden = ED.nfaView !== 'tree'; if (ED.run) ED.showStep(stepper.i); });
ED.runInput = () => {
  const A = App.current; const w = $('ed-input').value.trim();
  const bad = [...w].find(c => !A.alphabet.includes(c)); if (bad) { UI.toast(`'${bad}' ไม่อยู่ใน Σ = {${A.alphabet.join(', ')}}`); return; }
  const det = !A.hasEpsilon() && !A.isNondetChoice();
  ED.run = det ? { kind: 'dfa', w, r: FA.runDFA(A, w) } : { kind: 'nfa', w, r: FA.runNFA(A, w) };
  const n = det ? ED.run.r.steps.length : ED.run.r.sets.length;
  const v = $('ed-verdict'); v.className = 'verdict ' + (ED.run.r.accepted ? 'ok' : 'bad'); v.innerHTML = (ED.run.r.accepted ? '✔ ACCEPTED' : '✘ REJECTED') + ` <span class="note" style="font-weight:400">${esc(ED.run.r.reason)}</span>`;
  $('ed-trace').hidden = !det && ED.nfaView === 'tree'; $('ed-tree').hidden = det || ED.nfaView !== 'tree';
  if (!det) ED.renderTree();
  stepper.setCount(n, 0);
};
ED.showStep = (i) => {
  const A = App.current, R = ED.run; if (!R) return; const w = R.w;
  if (R.kind === 'dfa') {
    const steps = R.r.steps; const s = steps[i]; const prev = steps[i - 1];
    ED.tape(w, s.pos);
    const hl = { states: [s.state] }; if (prev) hl.transitions = [{ from: prev.state, to: s.state }];
    if (i === steps.length - 1) { if (R.r.accepted) hl.accept = [s.state]; else hl.reject = [s.state]; }
    view.highlight(hl);
    let h = ''; steps.forEach((st, k) => {
      const why = k === 0 ? 'start configuration' : `อ่าน ${steps[k - 1].read}: δ(${A.labelOf(steps[k - 1].state)}, ${steps[k - 1].read}) = ${A.labelOf(st.state)}`;
      h += `<div class="ln ${k === i ? 'cur' : ''} ${k > i ? 'dead' : ''}"><span class="cfg">${k ? '⊢' : '&nbsp;'} ${esc(UI.cfg(A, st.state, st.remaining))}${st.stuck ? ' ✗' : ''}</span><span class="why">${esc(why)}</span></div>`;
    });
    $('ed-trace').innerHTML = h;
    const last = i === steps.length - 1;
    $('ed-explain').innerHTML = last ? (R.r.accepted ? `<b>อ่านครบแล้ว</b> (${A.labelOf(s.state)}, e) — ${A.labelOf(s.state)} ∈ F → <b>accept</b>` : `<b>${esc(R.r.reason)}</b> → reject`) : `ตอนนี้อยู่ที่ <b>${A.labelOf(s.state)}</b> เหลือ input "${esc(s.remaining)}" — อ่าน <b>${esc(s.read)}</b> แล้วไป δ(${A.labelOf(s.state)}, ${esc(s.read)}) = <b>${A.labelOf(s.next)}</b><span class="f">${esc(UI.cfg(A, s.state, s.remaining))} ⊢ ${esc(UI.cfg(A, s.next, s.remaining.slice(1)))}</span>`;
  } else {
    const sets = R.r.sets; const S = sets[i];
    ED.tape(w, S.pos);
    const hl = { states: [...S.set] };
    if (S.contrib) hl.transitions = S.contrib.map(c => ({ from: c.q, to: c.p }));
    if (i === sets.length - 1) { const F = A.finals(); hl.accept = [...S.set].filter(q => F.has(q)); if (!hl.accept.length) hl.reject = [...S.set]; }
    view.highlight(hl);
    let h = ''; sets.forEach((st, k) => {
      h += `<div class="ln ${k === i ? 'cur' : ''} ${k > i ? 'dead' : ''}"><span class="cfg">${k ? '⊢ ' + esc(st.sym) + ':' : '&nbsp;&nbsp;'} S${FA.sub(k)} = ${esc(FA.setLabel([...st.set].map(q => A.labelOf(q))))}</span><span class="why">${k ? esc(st.contrib.map(c => `(${A.labelOf(c.q)},${st.sym},${A.labelOf(c.p)})`).join(' ') || 'ไม่มี transition — set ว่าง') : 'E(start)'}</span></div>`;
    });
    $('ed-trace').innerHTML = h;
    const last = i === sets.length - 1;
    const contribTxt = S.contrib ? (S.contrib.length ? S.contrib.map(c => `${A.labelOf(c.q)},${S.sym} ↦ ${A.labelOf(c.p)}`).join(' · ') : 'ไม่มี transition ใด ๆ') : '';
    $('ed-explain').innerHTML = last ? `<b>อ่านครบแล้ว</b> S${FA.sub(i)} ∩ F ${R.r.accepted ? '≠ ∅ → <b>accept</b> (มีอย่างน้อยหนึ่งเส้นทางถึง final)' : '= ∅ → <b>reject</b> (ไม่มีเส้นทางไหนถึง final เลย)'}` : (i === 0 ? `เริ่มที่ E(${A.labelOf(A.start)}) = ${esc(FA.setLabel([...S.set].map(q => A.labelOf(q))))} — ทุก state ที่ไปถึงได้ด้วย e ก่อนอ่านอะไร` : `อ่าน <b>${esc(S.sym)}</b>: ${esc(contribTxt)} ⇒ ${esc(S.formula)}<span class="f">S${FA.sub(i)} = ${esc(FA.setLabel([...S.set].map(q => A.labelOf(q))))}</span>`);
    if (ED.nfaView === 'tree') ED.renderTree(i);
  }
};
ED.renderTree = (cur = null) => {
  const A = App.current, R = ED.run; if (!R || R.kind !== 'nfa') return;
  const w = R.w; const lines = [];
  const walk = (n, depth, last) => {
    const pad = '&nbsp;'.repeat(depth * 3);
    const via = n.via === null ? '' : (n.via === FA.E ? '<span class="e">e</span>→' : esc(n.via) + '→');
    const stat = n.status === 'acc' ? ' <span class="acc">✔ accept</span>' : n.status === 'dead' ? ' <span class="dead">✗</span>' : n.status === 'dup' ? ' <span class="dead">(วนซ้ำ)</span>' : n.status === 'cut' ? ' …' : '';
    const cls = n.status === 'dead' || n.status === 'dup' ? 'dead' : (n.status === 'acc' || n.status === 'subacc') ? '' : '';
    const hlc = cur !== null && n.pos === cur ? 'style="background:var(--blue-soft)"' : '';
    lines.push(`<div class="node ${cls}" ${hlc}>${pad}${via}${esc(UI.cfg(A, n.state, w.slice(n.pos)))}${stat}</div>`);
    n.children.forEach((c, k) => walk(c, depth + 1, k === n.children.length - 1));
  };
  walk(R.r.tree, 0, true);
  $('ed-tree').innerHTML = `<div class="note" style="font-family:var(--font)">ทุกเส้นทางที่เป็นไปได้ (e = ไม่อ่าน input) — accept ถ้ามี ✔ อย่างน้อยหนึ่งใบ</div>` + lines.join('');
};
$('ed-multi-run').onclick = () => {
  const A = App.current; const ws = $('ed-multi-in').value.split(',').map(x => x.trim()).filter((x, i, a) => a.length).map(x => x === 'e' ? '' : x);
  let h = '<tr><th>ω</th><th>ผล</th><th>state สุดท้าย / S<sub>n</sub></th></tr>';
  for (const w of ws) { const det = !A.hasEpsilon() && !A.isNondetChoice(); const r = det ? FA.runDFA(A, w) : FA.runNFA(A, w); const fin = det ? (r.final ? A.labelOf(r.final) : '—') : FA.setLabel([...r.final].map(q => A.labelOf(q))); h += `<tr><td>${w === '' ? 'e' : esc(w)}</td><td class="${r.accepted ? 'ok' : 'bad'}">${r.accepted ? 'accept' : 'reject'}</td><td>${esc(fin)}</td></tr>`; }
  $('ed-multi').innerHTML = h;
};
$('ed-cmp-run').onclick = () => {
  const A = App.current; const out = $('ed-cmp-out');
  try {
    const ast = FA.RX.parse($('ed-cmp-in').value); const N = FA.RX.toNFA(ast, A.alphabet);
    const d = FA.dfaEquivalent(A, N);
    out.innerHTML = d.equivalent ? `<span class="ok-t">✔ L(M) = L(${esc(FA.RX.print(ast))}) — ตรวจแบบ exact ด้วย product DFA</span>` : `<span class="bad-t">✘ ต่างกัน: string "${d.witness === '' ? 'e' : esc(d.witness)}" ${d.inA ? 'ถูก M accept แต่ไม่อยู่ใน regex' : 'อยู่ใน regex แต่ M reject'}</span>`;
  } catch (e) { out.innerHTML = `<span class="bad-t">regex ผิดรูปแบบ: ${esc(e.message)}</span>`; }
};
document.querySelectorAll('[data-send]').forEach(b => b.onclick = () => App.goto(b.dataset.send, App.current.clone()));
})();
</script>
