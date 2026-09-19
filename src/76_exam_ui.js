<script>
// ===== [7.6] M8 exam engine — pure scoring helpers (node-testable) + quiz/study UI =====
(() => {
const EX = FA.exam = {};
if (!FA.EXAMS) FA.EXAMS = [];
const T = (k) => (FA.EXAM_UI && FA.EXAM_UI[k]) || k.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());

// ---- pure helpers ----
EX.normalize = (s) => String(s == null ? '' : s).trim().replace(/\s+/g, '')
  .replace(/∅|Ø/g, '{}').replace(/ε/g, 'e').replace(/×/g, 'x').replace(/[−–]/g, '-').replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
const splitTop = (s) => {
  const out = []; let depth = 0, cur = '';
  for (const ch of s) {
    if ('({['.includes(ch)) depth++; else if (')}]'.includes(ch)) depth--;
    if (ch === ',' && depth === 0) { out.push(cur); cur = ''; } else cur += ch;
  }
  if (cur !== '' || out.length) out.push(cur);
  return out.filter(x => x !== '');
};
const canon = (s) => {
  s = EX.normalize(s);
  if (s.startsWith('{') && s.endsWith('}')) {
    // only strip when the outer pair matches each other
    let d = 0, ok = true;
    for (let i = 0; i < s.length; i++) { if (s[i] === '{') d++; else if (s[i] === '}') d--; if (d === 0 && i < s.length - 1) { ok = false; break; } }
    if (ok) return '{' + splitTop(s.slice(1, -1)).map(canon).sort().join(',') + '}';
  }
  return s;
};
EX.parseSet = (s) => {
  s = EX.normalize(s);
  if (s === '' || s === '{}') return '';
  const inner = canon(s.startsWith('{') ? s : '{' + s + '}');
  return inner.slice(1, -1);
};
EX.sameAnswer = (user, expected, kind = 'text') => {
  const exp = Array.isArray(expected) ? expected : [expected];
  return exp.some(e => {
    if (kind === 'set') return EX.parseSet(user) === EX.parseSet(e);
    if (kind === 'number') return Number(EX.normalize(user)) === Number(EX.normalize(e));
    return EX.normalize(user) === EX.normalize(e);
  });
};
EX.parseTrace = (s) => {
  const out = []; const re = /\(\s*([^,()]+?)\s*,\s*([^()]*?)\s*\)/g; let m;
  while ((m = re.exec(String(s || '')))) { const rest = EX.normalize(m[2]); out.push({ state: EX.normalize(m[1]), rest: rest === '' ? 'e' : rest }); }
  return out;
};
EX.expectedTrace = (A, w) => FA.runDFA(A, w).steps.map(st => ({ state: EX.normalize(A.labelOf(st.state)), rest: st.remaining === '' ? 'e' : st.remaining }));
const r2 = (x) => Math.round(x * 100) / 100;
EX.scoreTF = (q, resp) => {
  const v = q.marks / q.parts.length; let earned = 0; const perPart = q.parts.map((p, i) => {
    const r = resp && resp[i]; if (r === null || r === undefined) return 'blank';
    if (r === p.answer) { earned += v; return 'ok'; } earned -= v; return 'bad';
  });
  return { earned: r2(earned), max: q.marks, perPart };
};
EX.scoreMC = (q, resp) => {
  const acc = Array.isArray(q.answer) ? q.answer : [q.answer];
  if (resp === null || resp === undefined) return { earned: 0, max: q.marks, status: 'blank' };
  if (acc.includes(resp)) return { earned: q.marks, max: q.marks, status: 'ok' };
  return { earned: q.penalty === false ? 0 : -q.marks, max: q.marks, status: 'bad' };
};
EX.scoreShort = (q, resp) => {
  const v = q.marks / q.parts.length; let earned = 0; const perPart = q.parts.map((p, i) => {
    const r = (resp && resp[i]) || ''; if (EX.normalize(r) === '') return 'blank';
    if (EX.sameAnswer(r, p.answer, p.kind || 'text')) { earned += v; return 'ok'; } return 'bad';
  });
  return { earned: r2(earned), max: q.marks, perPart };
};
EX.scoreTrace = (q, A, resp) => {
  const v = q.marks / q.inputs.length; let earned = 0; const perPart = q.inputs.map((w, i) => {
    const r = (resp && resp[i]) || ''; if (r.trim() === '') return 'blank';
    const got = EX.parseTrace(r), exp = EX.expectedTrace(A, w);
    const same = got.length === exp.length && got.every((g, k) => g.state === exp[k].state && g.rest === exp[k].rest);
    if (same) { earned += v; return 'ok'; } return 'bad';
  });
  return { earned: r2(earned), max: q.marks, perPart };
};
EX.build = (spec) => typeof spec === 'string' ? FA.preset(spec) : FA.Automaton.fromTable(JSON.parse(JSON.stringify(spec)));
EX.scoreDraw = (q, A, part) => {
  const value = q.marks / (q.parts ? q.parts.length : 1);
  if (!A || !A.start) return { ok: false, earned: 0, value, noDrawing: true };
  const B = EX.build((part || q).answer);
  const r = FA.dfaEquivalent(A, B);
  return { ok: r.equivalent, earned: r.equivalent ? r2(value) : 0, value, witness: r.witness, inA: r.inA, inB: r.inB };
};
EX.scoreQ = (q, resp, extra) => {
  switch (q.type) {
    case 'tf': return EX.scoreTF(q, resp);
    case 'mc': return EX.scoreMC(q, resp);
    case 'short': case 'nfa2dfa': return EX.scoreShort(q, resp);
    case 'trace': return EX.scoreTrace(q, extra || EX.build(q.automaton), resp);
    case 'draw': { const parts = q.parts || [null]; const v = q.marks / parts.length; let e = 0; parts.forEach((p, i) => { if (resp && resp[i] === true) e += v; }); return { earned: r2(e), max: q.marks }; }
    case 'proof': return { earned: resp === true ? q.marks : 0, max: q.marks };
  }
  return { earned: 0, max: q.marks };
};

// ---- state ----
EX.state = { set: (FA.EXAMS[0] || {}).id || 'p1', mode: 'quiz', resp: {}, checked: {}, open: {} };
EX.load = () => { try { const s = JSON.parse(localStorage.getItem('fa.exam') || 'null'); if (s && typeof s === 'object') Object.assign(EX.state, s); } catch (e) { } };
EX.save = () => { try { localStorage.setItem('fa.exam', JSON.stringify(EX.state)); } catch (e) { } };
const bucket = (k, sid) => { const S = EX.state; S[k][sid] = S[k][sid] || {}; return S[k][sid]; };

if (typeof document !== 'undefined') {
  const { $, esc } = FA.ui; const App = FA.App;
  EX.load();
  if (!FA.EXAMS.find(s => s.id === EX.state.set)) EX.state.set = (FA.EXAMS[0] || {}).id;
  const curSet = () => FA.EXAMS.find(s => s.id === EX.state.set);
  const fmt = (x) => (x > 0 ? '+' : '') + (Math.round(x * 100) / 100);
  const badge = (t, cls = 'blue') => `<span class="badge ${cls}">${esc(t)}</span>`;

  const scoreOf = (set, q) => {
    const checked = bucket('checked', set.id)[q.id];
    if (!checked) return null;
    return EX.scoreQ(q, bucket('resp', set.id)[q.id]);
  };
  const renderSummary = () => {
    const set = curSet(); const box = $('ex8-summary'); if (!set) { box.innerHTML = ''; return; }
    let earned = 0, max = 0, n = 0; const topics = {};
    for (const q of set.questions) {
      max += q.marks; const s = scoreOf(set, q);
      const tp = topics[q.topic] = topics[q.topic] || { e: 0, m: 0 }; tp.m += q.marks;
      if (s) { n++; earned += s.earned; tp.e += s.earned; }
    }
    box.innerHTML = `<div class="row" style="gap:12px 20px"><b>${esc(T('summary'))}</b> <span class="scorebar">${esc(T('score'))} ${fmt(earned).replace(/^\+/, '')} / ${max}</span> <span class="note">${esc(T('progress'))} ${n} / ${set.questions.length}</span> <span class="note">${esc(T('penaltyNote'))}</span></div>` +
      `<details><summary class="note" style="cursor:pointer">${esc(T('byTopic'))}</summary><table class="tt"><tbody>${Object.entries(topics).map(([k, v]) => `<tr><td>${esc(k)}</td><td class="mono">${fmt(v.e).replace(/^\+/, '')} / ${v.m}</td></tr>`).join('')}</tbody></table></details>`;
  };

  const solutionHTML = (q) => {
    const s = q.solution || {}; let h = `<div class="sol"><h4>${esc(T('steps'))}</h4><ol>${(s.steps || []).map(x => `<li>${x}</li>`).join('')}</ol>`;
    if (s.write) h += `<h4>${esc(T('writeOnPaper'))}</h4><div class="write">${s.write}</div>`;
    if (s.pitfalls && s.pitfalls.length) h += `<h4>${esc(T('pitfalls'))}</h4><ul>${s.pitfalls.map(x => `<li>${x}</li>`).join('')}</ul>`;
    return h + '</div>';
  };

  const widget = (set, q, resp, checked) => {
    const sc = checked ? EX.scoreQ(q, resp) : null;
    if (q.type === 'tf') return `<div class="parts">${q.parts.map((p, i) => { const r = resp ? resp[i] : null; const st = sc ? sc.perPart[i] : ''; return `<div class="part ${st === 'ok' ? 'ok' : st === 'bad' ? 'bad' : ''}"><div>${p.text}</div><div class="row"><button class="btn sm ${r === true ? 'on' : ''}" data-tf="${i}:1">${esc(T('trueLbl'))}</button><button class="btn sm ${r === false ? 'on' : ''}" data-tf="${i}:0">${esc(T('falseLbl'))}</button></div>${checked ? `<div class="why"><b>${p.answer ? T('trueLbl') : T('falseLbl')}</b>${p.why ? ' — ' + p.why : ''}</div>` : ''}</div>`; }).join('')}</div>`;
    if (q.type === 'mc') { const acc = Array.isArray(q.answer) ? q.answer : [q.answer]; return `<div class="parts">${q.options.map((o, i) => { const sel = resp === i; let cls = sel ? 'sel' : ''; if (checked) { if (acc.includes(i)) cls = 'ok'; else if (sel) cls = 'bad'; } return `<div class="opt ${cls}" data-mc="${i}"><span class="mono">(${String.fromCharCode(97 + i)})</span><div>${o.text}${checked && o.why ? `<span class="why">${o.why}</span>` : ''}</div></div>`; }).join('')}</div>`; }
    if (q.type === 'short' || q.type === 'nfa2dfa') return `<div class="parts">${q.parts.map((p, i) => { const st = sc ? sc.perPart[i] : ''; const exp = Array.isArray(p.answer) ? p.answer[0] : p.answer; return `<div class="part wide ${st === 'ok' ? 'ok' : st === 'bad' ? 'bad' : ''}"><div>${p.label}</div><input type="text" class="mono" data-short="${i}" value="${esc((resp && resp[i]) || '')}" placeholder="${esc(p.kind === 'set' ? T('setHint') : '')}">${checked ? `<div class="why"><b>${esc(T('expected'))}:</b> <span class="mono">${esc(exp)}</span>${p.why ? ' — ' + p.why : ''}</div>` : ''}</div>`; }).join('')}</div>`;
    if (q.type === 'trace') { const A = EX.build(q.automaton); return `<div class="note">${esc(T('traceHint'))}</div><div class="parts">${q.inputs.map((w, i) => { const st = sc ? sc.perPart[i] : ''; return `<div class="part wide ${st === 'ok' ? 'ok' : st === 'bad' ? 'bad' : ''}"><div class="mono">(${esc(A.labelOf(A.start))}, ${esc(w)}) ⊢ …</div><textarea data-trace="${i}">${esc((resp && resp[i]) || '')}</textarea>${checked ? `<div class="why"><b>${esc(T('expected'))}:</b> <span class="mono">${EX.expectedTrace(A, w).map(c => `(${esc(c.state)}, ${esc(c.rest)})`).join(' ⊢ ')}</span> — ${FA.runDFA(A, w).accepted ? 'accept' : 'reject'}</div>` : ''}</div>`; }).join('')}</div>`; }
    if (q.type === 'draw') { const parts = q.parts || [{ label: '', answer: q.answer }]; return `<div class="parts">${parts.map((p, i) => { const ok = resp && resp[i] === true; return `<div class="part wide ${ok ? 'ok' : ''}"><div>${p.label || ''}</div><div class="row"><button class="btn sm primary" data-draw="${i}">${esc(T('drawInEditor'))}</button><button class="btn sm" data-drawchk="${i}">${esc(T('checkDrawing'))}</button><button class="btn sm" data-drawans="${i}">${esc(T('loadAnswer'))}</button>${ok ? badge(T('equivalent'), 'green') : ''}</div><div class="verdict" data-drawmsg="${i}"></div></div>`; }).join('')}</div>`; }
    if (q.type === 'proof') return `<label class="row" style="margin-top:10px;cursor:pointer"><input type="checkbox" data-proof ${resp === true ? 'checked' : ''}> ${esc(T('understood'))}</label>`;
    return '';
  };

  const isOpen = (set, q, checked) => { const o = bucket('open', set.id)[q.id]; return o === true || (o !== false && (EX.state.mode === 'study' || checked)); };
  const renderCard = (set, q, el) => {
    const resp = bucket('resp', set.id)[q.id];
    const checked = !!bucket('checked', set.id)[q.id];
    const open = isOpen(set, q, checked);
    const sc = checked ? EX.scoreQ(q, resp) : null;
    el.className = 'exq'; el.dataset.q = q.id;
    el.innerHTML = `<div class="qh"><span class="n">ข้อ ${esc(q.id)}</span>${badge(`${q.marks} ${T('marks')}`, 'mark')}${badge(q.topic)}${sc ? `<span class="scorebar">${fmt(sc.earned)} / ${sc.max}</span>` : ''}</div>` +
      `<div class="qtext">${q.text}</div>${widget(set, q, resp, checked)}` +
      `<div class="actions">${q.type !== 'proof' ? `<button class="btn sm primary" data-act="check">${esc(T('check'))}</button>` : ''}<button class="btn sm" data-act="sol">${esc(open ? T('hideSolution') : T('showSolution'))}</button>` +
      (q.link ? `<button class="btn sm" data-act="link">${esc(T('openModule'))} ${q.link.module === 'editor' ? '1' : q.link.module === 'powerset' ? '2' : q.link.module === 'closure' ? '5' : q.link.module === 'pumping' ? '6' : ''}</button>` : '') +
      (q.type === 'nfa2dfa' ? `<button class="btn sm" data-act="powerset">${esc(T('openModule'))} 2</button>` : '') + `</div>` +
      (open ? solutionHTML(q) : '');
  };

  const renderList = () => {
    const set = curSet(); const list = $('ex8-list'); list.innerHTML = ''; if (!set) return;
    for (const q of set.questions) { const el = document.createElement('div'); renderCard(set, q, el); list.appendChild(el); }
  };
  EX.render = () => {
    $('ex8-title').textContent = T('title'); $('ex8-sub').textContent = T('sub');
    $('ex8-mode').querySelectorAll('button').forEach(b => { b.textContent = b.dataset.mode === 'quiz' ? T('modeQuiz') : T('modeStudy'); b.classList.toggle('on', b.dataset.mode === EX.state.mode); });
    $('ex8-reset').textContent = T('resetSet');
    $('ex8-sets').innerHTML = FA.EXAMS.map(s => `<button class="${s.id === EX.state.set ? 'on' : ''}" data-set="${esc(s.id)}">${esc(s.title)}</button>`).join('');
    renderSummary(); renderList();
  };
  const rerender = (qid) => { const set = curSet(); const q = set.questions.find(x => x.id === qid); const el = $('ex8-list').querySelector(`[data-q="${CSS.escape(qid)}"]`); if (q && el) renderCard(set, q, el); renderSummary(); EX.save(); };

  // events
  $('ex8-sets').addEventListener('click', (ev) => { const b = ev.target.closest('button[data-set]'); if (!b) return; EX.state.set = b.dataset.set; EX.save(); EX.render(); });
  $('ex8-mode').addEventListener('click', (ev) => { const b = ev.target.closest('button[data-mode]'); if (!b) return; EX.state.mode = b.dataset.mode; EX.save(); EX.render(); });
  $('ex8-reset').onclick = () => { if (!confirm(T('resetSet') + '?')) return; const sid = EX.state.set; EX.state.resp[sid] = {}; EX.state.checked[sid] = {}; EX.state.open[sid] = {}; EX.save(); EX.render(); };

  $('ex8-list').addEventListener('click', (ev) => {
    const card = ev.target.closest('.exq'); if (!card) return;
    const set = curSet(); const q = set.questions.find(x => x.id === card.dataset.q); if (!q) return;
    const R = bucket('resp', set.id); const b = ev.target.closest('button, .opt');
    if (!b) return;
    if (b.dataset.tf) { const [i, v] = b.dataset.tf.split(':'); const arr = R[q.id] = R[q.id] || []; arr[+i] = arr[+i] === (v === '1') ? null : v === '1'; rerender(q.id); return; }
    if (b.dataset.mc !== undefined) { R[q.id] = R[q.id] === +b.dataset.mc ? null : +b.dataset.mc; rerender(q.id); return; }
    if (b.dataset.draw !== undefined) { EX.pending = { setId: set.id, qid: q.id, partIndex: +b.dataset.draw }; App.editor.setCurrent(new FA.Automaton({ alphabet: q.alphabet, name: `ข้อ ${q.id}` }), { sample: '' }); App.show('editor'); FA.ui.toast(T('drawInEditor') + ' — วาดเสร็จแล้วกลับมากด "' + T('checkDrawing') + '"'); return; }
    if (b.dataset.drawans !== undefined) { const p = q.parts ? q.parts[+b.dataset.drawans] : q; App.editor.setCurrent(EX.build(p.answer), { sample: '' }); App.show('editor'); return; }
    if (b.dataset.drawchk !== undefined) {
      const i = +b.dataset.drawchk; const p = q.parts ? q.parts[i] : null; const A = App.current;
      const msgEl = card.querySelector(`[data-drawmsg="${i}"]`);
      if (!A || !A.start || !A.transitions.length) { msgEl.innerHTML = `<span class="verdict wait">${esc(T('drawFirst'))}</span>`; return; }
      const r = EX.scoreDraw(q, A, p);
      const arr = R[q.id] = R[q.id] || []; arr[i] = r.ok;
      bucket('checked', set.id)[q.id] = true; rerender(q.id);
      const m2 = card.querySelector(`[data-drawmsg="${i}"]`);
      if (r.ok) m2.innerHTML = `<span class="verdict ok">${esc(T('equivalent'))}</span>`;
      else m2.innerHTML = `<span class="verdict bad">${esc(T('notEquivalent'))}</span> <span class="note">${esc(r.inA ? T('witnessIn') : T('witnessOut'))} <span class="mono">${esc(r.witness === '' ? 'e' : r.witness)}</span></span>`;
      return;
    }
    if (b.dataset.act === 'check') { bucket('checked', set.id)[q.id] = true; rerender(q.id); return; }
    if (b.dataset.act === 'sol') { bucket('open', set.id)[q.id] = !isOpen(set, q, !!bucket('checked', set.id)[q.id]); rerender(q.id); return; }
    if (b.dataset.act === 'link') {
      const L = q.link; const A = L.automaton ? EX.build(L.automaton) : null;
      if (L.module === 'editor' && A) { App.editor.setCurrent(A, { sample: L.sample || '', run: !!L.sample }); App.show('editor'); window.scrollTo(0, 0); FA.ui.toast(`ส่ง ${A.name || 'M'} ไปที่ module 1 แล้ว`); }
      else App.goto(L.module, A || undefined);
      return;
    }
    if (b.dataset.act === 'powerset') { App.goto('powerset', EX.build(q.automaton)); return; }
  });
  $('ex8-list').addEventListener('input', (ev) => {
    const card = ev.target.closest('.exq'); if (!card) return;
    const set = curSet(); const q = set.questions.find(x => x.id === card.dataset.q); if (!q) return;
    const R = bucket('resp', set.id); const t = ev.target;
    if (t.dataset.short !== undefined) { const arr = R[q.id] = R[q.id] || []; arr[+t.dataset.short] = t.value; EX.save(); }
    else if (t.dataset.trace !== undefined) { const arr = R[q.id] = R[q.id] || []; arr[+t.dataset.trace] = t.value; EX.save(); }
  });
  $('ex8-list').addEventListener('change', (ev) => {
    const card = ev.target.closest('.exq'); if (!card) return;
    const set = curSet(); const q = set.questions.find(x => x.id === card.dataset.q); if (!q) return;
    if (ev.target.dataset.proof !== undefined) { bucket('resp', set.id)[q.id] = ev.target.checked; bucket('checked', set.id)[q.id] = ev.target.checked; rerender(q.id); }
  });
  EX.render();
}
})();
</script>
