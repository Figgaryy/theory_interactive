<script>
// ===== [8] tests — compare against worked examples in the slides / textbook =====
FA.runTests = () => {
  const out = []; let pass = 0, fail = 0;
  const t = (name, cond, detail = '') => { if (cond) { pass++; out.push('✓ ' + name); } else { fail++; out.push('✗ ' + name + (detail ? '  — ' + detail : '')); } };
  const S = (arr) => new Set(arr);
  const eq = FA.setEq;
  const P = FA.preset;

  // --- slide 4 DFA, trace aababa (annotated p.7): 7 configurations, accepted
  { const A = P('slide4'); const r = FA.runDFA(A, 'aababa');
    t('slide4: aababa accepted', r.accepted);
    t('slide4: trace has 7 configurations', r.steps.length === 7, String(r.steps.length));
    t('slide4: trace states s,s,s,q,s,q,s', r.steps.map(s => s.state).join('') === 'sssqsqs', r.steps.map(s => s.state).join(''));
    t('slide4: e accepted (s ∈ F)', FA.runDFA(A, '').accepted);
    t('slide4: "b" rejected', !FA.runDFA(A, 'b').accepted); }
  // --- Example 2.1.1 aabba
  { const r = FA.runDFA(P('ex211'), 'aabba'); t('ex211: aabba accepted, ends q0', r.accepted && r.final === 'q0'); }
  // --- slide 10 NFA aababa (annotated p.12)
  { const A = P('slide10'); const r = FA.runNFA(A, 'aababa'); t('slide10: NFA accepts aababa', r.accepted); t('slide10: NFA rejects abb', !FA.runNFA(A, 'abb').accepted); }
  // --- Fig 2-7 bababab
  { const r = FA.runNFA(P('fig27'), 'bababab'); t('fig27: bababab ∈ L', r.accepted); t('fig27: "aaa" ∉ L', !FA.runNFA(P('fig27'), 'aaa').accepted); }
  // --- Fig 2-9 e-closure (Example 2.2.3 + lecturer's table)
  { const A = P('fig29'); const ct = FA.closureTable(A);
    t('fig29: E(q0) = {q0,q1,q2,q3}', eq(ct.E.q0, S(['q0', 'q1', 'q2', 'q3'])), FA.setLabel(ct.E.q0));
    t('fig29: E(q1) = {q1,q2,q3}', eq(ct.E.q1, S(['q1', 'q2', 'q3'])));
    t('fig29: E(q2) = {q2}', eq(ct.E.q2, S(['q2'])));
    t('fig29: E(q4) = {q3,q4}', eq(ct.E.q4, S(['q3', 'q4'])));
    t('fig29: closure converges at Iter-3 (3 columns)', ct.columns.length === 3, String(ct.columns.length));
    t('fig29: Iter-1 E(q0) = {q0,q1}', eq(ct.columns[0].q0, S(['q0', 'q1'])));
    // powerset (Example 2.2.4 / Fig 2-10)
    const ps = FA.powerset(A); const D = ps.dfa;
    const keys = ps.rows.map(r => r.key);
    t('fig29→DFA: 4 superstates + ∅ = 5 (Figure 2-10)', keys.length === 5, keys.join(' | '));
    t('fig29→DFA: s′ = {q0,q1,q2,q3}', ps.rows[0].key === 'q0,q1,q2,q3');
    t("fig29→DFA: δ′(s′,a) = {q0,q1,q2,q3,q4}", ps.rows[0].cells.a.targetKey === 'q0,q1,q2,q3,q4');
    t("fig29→DFA: δ′(s′,b) = {q2,q3,q4}", ps.rows[0].cells.b.targetKey === 'q2,q3,q4');
    t("fig29→DFA: δ′({q2,q3,q4},a) = {q3,q4}", D.trans('q2,q3,q4', 'a')[0] === 'q3,q4');
    t("fig29→DFA: δ′({q3,q4},b) = ∅", D.trans('q3,q4', 'b')[0] === '∅');
    t('fig29→DFA: exactly 3 final superstates', D.states.filter(s => s.isFinal).length === 3);
    t('fig29→DFA: equivalent to NFA (exact)', FA.dfaEquivalent(A, D).equivalent);
    t('fig29→DFA: is deterministic & complete', D.isDeterministic()); }
  // --- Problem 2.2.10: powerset of a DFA gives an equivalent DFA with same #states (reachable)
  { const A = P('slide4'); const D = FA.powerset(A).dfa; t('powerset(DFA) same size & equivalent', D.states.length === 2 && FA.dfaEquivalent(A, D).equivalent); }
  // --- Fig 2-8 exponential: n=3 → 2^3 = 8 reachable superstates
  { const D = FA.powerset(P('fig28')).dfa; t('fig28: powerset has 8 reachable states (2^n)', D.states.length === 8, String(D.states.length)); }
  // --- Minimization Fig 2-20 (Example 2.5.3)
  { const A = P('fig219'); const m = FA.minimize(A);
    t('fig219: q7 removed as unreachable', m.prep.removed.join() === 'q7');
    const p1 = m.iterations[1].partition.map(b => b.join(',')).sort().join(' | ');
    t('fig219: ≡₁ = {q1,q3},{q2},{q4,q6},{q5}', p1 === 'q1,q3 | q2 | q4,q6 | q5', p1);
    t('fig219: converged after 2nd iteration', m.iterations.length === 3, String(m.iterations.length));
    t('fig219: minimal DFA has 4 states', m.dfa.states.length === 4, String(m.dfa.states.length));
    t('fig219: minimal DFA equivalent', FA.dfaEquivalent(A, m.dfa).equivalent); }
  // --- lecturer's minimization example
  { const A = P('profmin'); const m = FA.minimize(A);
    t('profmin: q2,q4 unreachable', m.prep.removed.sort().join() === 'q2,q4', m.prep.removed.join());
    const fin = m.partition.map(b => b.join(',')).sort().join(' | ');
    // NOTE: the web example the lecturer pasted claims {q0},{q1},{q3,q5}; Lemma 2.5.1 shows q0 ≡ q1 (both accept 0*1Σ*)
    t('profmin: correct groups {q0,q1},{q3,q5} (lecturer\'s pasted example is not minimal)', fin === 'q0,q1 | q3,q5', fin);
    t('profmin: L(q0)=L(q1) confirmed by exact equivalence', (() => { const B = A.clone(); B.setStart('q1'); return FA.dfaEquivalent(A, B).equivalent; })());
    t('profmin: equivalent', FA.dfaEquivalent(A, m.dfa).equivalent); }
  // --- Fig 2-4 already minimal
  { const m = FA.minimize(P('fig24')); t('fig24: 5-state DFA stays 5 states', m.dfa.states.length === 5, String(m.dfa.states.length)); }
  // --- regex parse/print
  { const RX = FA.RX; const r = RX.parse('(ab ∪ aab)*');
    t('regex: print roundtrip', RX.print(r) === '(ab ∪ aab)*', RX.print(r));
    t('regex: | and U accepted', RX.print(RX.parse('a|b')) === 'a ∪ b' && RX.print(RX.parse('aUb')) === 'a ∪ b');
    t('regex: simplify e·a = a', RX.print(RX.simplify(RX.CAT(RX.EPS, RX.SYM('a')))) === 'a');
    t('regex: simplify ∅* = e', RX.print(RX.simplify(RX.STAR(RX.EMPTY))) === 'e');
    t('regex: (e ∪ a)* → a*', RX.print(RX.simplify(RX.parse('(e ∪ a)*'))) === 'a*', RX.print(RX.simplify(RX.parse('(e ∪ a)*'))));
    t('regex: (e ∪ a)(e ∪ a)*(e ∪ a) → a*', RX.print(RX.simplify(RX.parse('(e ∪ a)(e ∪ a)*(e ∪ a)'))) === 'a*', RX.print(RX.simplify(RX.parse('(e ∪ a)(e ∪ a)*(e ∪ a)'))));
    t('regex: e ∪ a ∪ a* → a*', RX.print(RX.simplify(RX.parse('e ∪ a ∪ a*'))) === 'a*', RX.print(RX.simplify(RX.parse('e ∪ a ∪ a*'))));
    t('regex: a*a* → a*', RX.print(RX.simplify(RX.parse('a*a*'))) === 'a*', RX.print(RX.simplify(RX.parse('a*a*'))));
    // Thompson
    const { nfa, stages } = RX.toNFA(r);
    t('regex→NFA: (ab∪aab)* accepts e, ab, aab, abaab', ['', 'ab', 'aab', 'abaab'].every(w => FA.runNFA(nfa, w).accepted));
    t('regex→NFA: rejects a, ba, aa', ['a', 'ba', 'aa'].every(w => !FA.runNFA(nfa, w).accepted));
    t('regex→NFA: 10 build stages for (ab ∪ aab)*', stages.length === 10, String(stages.length));
    const n2 = RX.toNFA(RX.parse('a*ba*b')).nfa; t('regex a*ba*b ≡ exercise DFA', FA.dfaEquivalent(n2, P('exA')).equivalent);
    const n3 = RX.toNFA(RX.parse('(a ∪ b*a)*')).nfa; t('regex (a∪b*a)* ≡ slide4 DFA', FA.dfaEquivalent(n3, P('slide4')).equivalent);
    const n4 = RX.toNFA(RX.parse('(ab ∪ aba)*')).nfa; t('regex (ab∪aba)* ≡ Fig 2-4 ≡ Fig 2-5 ≡ Fig 2-6', FA.dfaEquivalent(n4, P('fig24')).equivalent && FA.dfaEquivalent(P('fig25'), P('fig26')).equivalent && FA.dfaEquivalent(n4, P('fig25')).equivalent);
    const n5 = RX.toNFA(RX.parse('(a ∪ b)*(bb ∪ bab)(a ∪ b)*')).nfa; t('fig27 ≡ regex (a∪b)*(bb∪bab)(a∪b)*', FA.dfaEquivalent(n5, P('fig27')).equivalent); }
  // --- State elimination Fig 2-15 (Example 2.3.2)
  { const RX = FA.RX; const A = P('fig215'); const g = new RX.GA(A);
    g.eliminate('q1'); g.eliminate('q2'); g.eliminate('q3');
    const rx = g.result();
    const target = RX.toNFA(RX.parse('a*b(a ∪ ba*ba*b)*')).nfa;
    t('fig215 elimination q1,q2,q3 → regex equivalent to a*b(a∪ba*ba*b)*', FA.dfaEquivalent(RX.toNFA(rx, A.alphabet).nfa, target).equivalent, RX.print(rx));
    const g2 = new RX.GA(A); g2.eliminate('q3'); g2.eliminate('q2'); g2.eliminate('q1');
    t('fig215 other order still equivalent', FA.dfaEquivalent(RX.toNFA(g2.result(), A.alphabet).nfa, A).equivalent, RX.print(g2.result()));
    const rk = RX.Rijk(A); t('fig215 R(i,j,k) language equivalent', FA.dfaEquivalent(RX.toNFA(rk.language(), A.alphabet).nfa, A).equivalent, RX.print(rk.language())); }
  // --- closure constructions
  { const A = P('ex211'), B = P('exA');
    const U = FA.union(A, B).M; t('union: accepts strings of either', FA.accepts(U, 'aa') && FA.accepts(U, 'bab') && !FA.accepts(U, 'b'));
    const C = FA.concat(P('exA'), P('exA')).M; t('concat: a*ba*b · a*ba*b accepts bbbb, rejects bb', FA.accepts(C, 'bbbb') && !FA.accepts(C, 'bb'));
    const K = FA.star(P('exA')).M; t('star: (a*ba*b)* accepts e, bb, bbabab', ['', 'bb', 'bbabab'].every(w => FA.accepts(K, w)));
    const N = FA.complement(A).M; t('complement: odd b\'s', FA.accepts(N, 'b') && !FA.accepts(N, 'bb'));
    const I = FA.product(A, P('ex212'), 'and').M; t('product ∩: even b & no bbb', FA.accepts(I, 'bb') && !FA.accepts(I, 'bbb') && !FA.accepts(I, 'bbbb') && FA.accepts(I, 'bbabb'));
    t('complement of NFA refused', !!FA.complement(P('slide10')).error); }
  // --- language tools
  { t('languageDiff finds witness', FA.languageDiff(P('ex211'), P('exA'), 5)?.w !== undefined);
    t('dfaEquivalent witness for slide4 vs exB', FA.dfaEquivalent(P('slide4'), P('exB')).equivalent === false); }
  // --- pumping cycle
  { const r = FA.findPumpingCycle(P('slide4'), 'aababa'); t('pumping: cycle found with |xy| ≤ n', r && r.y.length > 0 && (r.x + r.y).length <= r.n); }
  // --- Example 2.6.1 active sets
  { const r = FA.runNFA(P('fig224'), 'aaaba'); const ks = r.sets.map(s => FA.setKey(s.set));
    t('fig224: S0={q0,q1}', ks[0] === 'q0,q1', ks[0]); t('fig224: S1..S3={q0,q1,q2}', ks[1] === 'q0,q1,q2' && ks[3] === 'q0,q1,q2', ks.join(' ; '));
    t('fig224: S4={q1,q2,q3,q4}', ks[4] === 'q1,q2,q3,q4', ks[4]); t('fig224: S5={q2,q3,q4} accepted', ks[5] === 'q2,q3,q4' && r.accepted, ks[5]); }
  out.unshift(`${pass} passed, ${fail} failed`);
  return { pass, fail, text: out.join('\n') };
};
</script>
