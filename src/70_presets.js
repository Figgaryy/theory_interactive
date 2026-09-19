<script>
// ===== [7] data/presets — automata from the slides, lecturer's notes and the textbook =====
(() => {
const T = FA.Automaton.fromTable;
const P = [];
const add = (id, title, src, tags, build, extra = {}) => P.push({ id, title, src, tags, build, ...extra });

add('slide4', '(a ∪ b*a)*  —  DFA 2 state {s, q}', 'สไลด์หน้า 3–7 · trace ของ ω = aababa', ['DFA', 'M1'],
  () => T({ name: 'M (slide 4)', alphabet: ['a', 'b'], start: 's', finals: ['s'], rows: { s: { a: 's', b: 'q' }, q: { a: 's', b: 'q' } }, pos: { s: [200, 200], q: [420, 200] } }),
  { sample: 'aababa', regex: '(a ∪ b*a)*' });

add('slide10', '(a ∪ ab)*  —  NFA มี e-transition', 'สไลด์หน้า 10 · อาจารย์ trace aababa หน้า 12', ['NFA', 'M1', 'M2'],
  () => T({ name: 'M (slide 10)', alphabet: ['a', 'b'], start: 's', finals: ['s'], rows: { s: { a: 'q' }, q: { b: 's' } }, eps: { q: ['s'] }, pos: { s: [200, 200], q: [420, 200] } }),
  { sample: 'aababa', regex: '(a ∪ ab)*' });

add('ex211', 'Even number of b\'s', 'Example 2.1.1 / Figure 2-2 · trace aabba', ['DFA', 'M1'],
  () => T({ name: 'M (Ex 2.1.1)', alphabet: ['a', 'b'], start: 'q0', finals: ['q0'], rows: { q0: { a: 'q0', b: 'q1' }, q1: { a: 'q1', b: 'q0' } }, pos: { q0: [200, 200], q1: [420, 200] } }),
  { sample: 'aabba', regex: '(a ∪ ba*b)*' });

add('ex212', 'No three consecutive b\'s (มี dead state)', 'Example 2.1.2 / Figure 2-3', ['DFA', 'M1', 'M3'],
  () => T({ name: 'M (Ex 2.1.2)', alphabet: ['a', 'b'], start: 'q0', finals: ['q0', 'q1', 'q2'], rows: { q0: { a: 'q0', b: 'q1' }, q1: { a: 'q0', b: 'q2' }, q2: { a: 'q0', b: 'q3' }, q3: { a: 'q3', b: 'q3' } }, pos: { q0: [90, 200], q1: [250, 200], q2: [410, 200], q3: [570, 200] } }),
  { sample: 'abbabba' });

add('fig24', '(ab ∪ aba)*  —  DFA 5 state (เล็กสุดแล้ว)', 'Figure 2-4 หน้า 64', ['DFA', 'M1', 'M3'],
  () => T({ name: 'M (Fig 2-4)', alphabet: ['a', 'b'], start: 'q0', finals: ['q0', 'q2', 'q3'], rows: { q0: { a: 'q1', b: 'd' }, q1: { a: 'd', b: 'q2' }, q2: { a: 'q3', b: 'd' }, q3: { a: 'q1', b: 'q2' }, d: { a: 'd', b: 'd' } }, pos: { q0: [80, 200], q1: [240, 120], q2: [400, 200], q3: [240, 290], d: [560, 200] } }),
  { sample: 'ababa', regex: '(ab ∪ aba)*' });

add('fig25', '(ab ∪ aba)*  —  NFA 3 state', 'Figure 2-5 หน้า 65 · สไลด์หน้า 12 exercise', ['NFA', 'M1', 'M2'],
  () => T({ name: 'M (Fig 2-5)', alphabet: ['a', 'b'], start: 'q0', finals: ['q0'], rows: { q0: { a: 'q1' }, q1: { b: 'q0,q2' }, q2: { a: 'q0' } }, pos: { q0: [120, 200], q1: [320, 120], q2: [320, 290] } }),
  { sample: 'aba', regex: '(ab ∪ aba)*' });

add('fig26', '(ab ∪ aba)*  —  NFA มี e', 'Figure 2-6 หน้า 65', ['NFA', 'M1', 'M2'],
  () => T({ name: 'M (Fig 2-6)', alphabet: ['a', 'b'], start: 'q0', finals: ['q0'], rows: { q0: { a: 'q1' }, q1: { b: 'q2' }, q2: { a: 'q0' } }, eps: { q2: ['q0'] }, pos: { q0: [120, 200], q1: [320, 120], q2: [320, 290] } }),
  { sample: 'abab', regex: '(ab ∪ aba)*' });

add('fig27', 'มี bb หรือ bab เป็น substring', 'Example 2.2.1 / Figure 2-7 · input bababab', ['NFA', 'M1', 'M2'],
  () => T({ name: 'M (Fig 2-7)', alphabet: ['a', 'b'], start: 'q0', finals: ['q4'], rows: { q0: { a: 'q0', b: 'q0,q1' }, q1: { a: 'q3', b: 'q2' }, q2: {}, q3: { b: 'q4' }, q4: { a: 'q4', b: 'q4' } }, eps: { q2: ['q4'] }, pos: { q0: [80, 200], q1: [230, 200], q2: [380, 110], q3: [380, 290], q4: [540, 200] } }),
  { sample: 'bababab', regex: '(a ∪ b)*(bb ∪ bab)(a ∪ b)*' });

add('fig28', 'มีสัญลักษณ์บางตัวไม่ปรากฏ (n = 3)', 'Example 2.2.2 / Figure 2-8 · DFA ต้อง exponential (Ex 2.2.5)', ['NFA', 'M2'],
  () => T({ name: 'M (Fig 2-8)', alphabet: ['a', 'b', 'c'], start: 's', finals: ['q1', 'q2', 'q3'], rows: { s: {}, q1: { b: 'q1', c: 'q1' }, q2: { a: 'q2', c: 'q2' }, q3: { a: 'q3', b: 'q3' } }, eps: { s: ['q1', 'q2', 'q3'] }, pos: { s: [100, 200], q1: [340, 90], q2: [340, 200], q3: [340, 310] } }),
  { sample: 'abab' });

add('fig29', 'Figure 2-9  —  ตัวอย่างหลักที่อาจารย์ทำมือ', 'Example 2.2.3–2.2.4 หน้า 70–73 · annotated หน้า 19–23', ['NFA', 'M2', 'star'],
  () => T({ name: 'M (Fig 2-9)', alphabet: ['a', 'b'], start: 'q0', finals: ['q4'], rows: { q0: { b: 'q2' }, q1: { a: 'q0,q4' }, q2: { b: 'q4' }, q3: { a: 'q4' }, q4: {} }, eps: { q0: ['q1'], q1: ['q2', 'q3'], q4: ['q3'] }, pos: { q0: [90, 310], q1: [270, 110], q2: [270, 310], q3: [470, 110], q4: [470, 310] } }),
  { sample: 'ab' });

add('fig215', '3k+1 b\'s  —  ตัวอย่าง state elimination', 'Example 2.3.2 / Figure 2-15 หน้า 80–83 · annotated หน้า 26–27', ['DFA', 'M4', 'star'],
  () => T({ name: 'M (Fig 2-15)', alphabet: ['a', 'b'], start: 'q1', finals: ['q3'], rows: { q1: { a: 'q1', b: 'q3' }, q2: { a: 'q2', b: 'q1' }, q3: { a: 'q3', b: 'q2' } }, pos: { q1: [140, 300], q3: [320, 110], q2: [500, 300] } }),
  { sample: 'abab', regex: 'a*b(a ∪ ba*ba*b)*' });

add('fig219', '(ab ∪ ba)*  —  7 state มี q7 ไปไม่ถึง', 'Figure 2-19/2-20 หน้า 93–100 · Example 2.5.3 ย่อเหลือ 4 state', ['DFA', 'M3', 'star'],
  () => T({ name: 'M (Fig 2-19)', alphabet: ['a', 'b'], start: 'q1', finals: ['q1', 'q3'], rows: { q1: { a: 'q2', b: 'q4' }, q2: { a: 'q5', b: 'q3' }, q3: { a: 'q2', b: 'q6' }, q4: { a: 'q1', b: 'q5' }, q5: { a: 'q5', b: 'q5' }, q6: { a: 'q3', b: 'q5' }, q7: { a: 'q1', b: 'q5' } }, pos: { q1: [80, 200], q2: [240, 110], q4: [240, 290], q3: [400, 110], q5: [400, 290], q6: [560, 110], q7: [560, 320] } }),
  { sample: 'abba', regex: '(ab ∪ ba)*' });

add('profmin', 'ตัวอย่าง minimization ของอาจารย์ (Σ = {0,1})', 'annotated หน้า 33–35 · q2, q4 ไปไม่ถึง → G1, G2, G3', ['DFA', 'M3', 'star'],
  () => T({ name: 'M (lecturer)', alphabet: ['0', '1'], start: 'q0', finals: ['q3', 'q5'], rows: { q0: { 0: 'q1', 1: 'q3' }, q1: { 0: 'q0', 1: 'q3' }, q2: { 0: 'q1', 1: 'q4' }, q3: { 0: 'q5', 1: 'q5' }, q4: { 0: 'q3', 1: 'q3' }, q5: { 0: 'q5', 1: 'q5' } }, pos: { q0: [80, 130], q1: [260, 130], q2: [420, 130], q4: [580, 130], q3: [340, 280], q5: [520, 340] } }),
  { sample: '0011' });

add('fig224', 'Example 2.6.1  —  รัน NFA ตรง ๆ ด้วย active set', 'Figure 2-24 หน้า 107 · input aaaba (reconstructed ให้ S₀…S₅ ตรงหนังสือ)', ['NFA', 'M1'],
  () => T({ name: 'M (Fig 2-24)', alphabet: ['a', 'b'], start: 'q0', finals: ['q4'], rows: { q0: { a: 'q0' }, q1: { a: 'q2', b: 'q1,q2' }, q2: { b: 'q3' }, q3: { a: 'q3' }, q4: { a: 'q4', b: 'q4' } }, eps: { q0: ['q1'], q3: ['q4'] }, pos: { q0: [80, 200], q1: [230, 200], q2: [380, 200], q3: [530, 200], q4: [680, 200] } }),
  { sample: 'aaaba' });

add('exA', 'เฉลย exercise: a*ba*b', 'สไลด์หน้า 7 exercise', ['DFA', 'M1'],
  () => T({ name: 'M (a*ba*b)', alphabet: ['a', 'b'], start: 'q0', finals: ['q2'], rows: { q0: { a: 'q0', b: 'q1' }, q1: { a: 'q1', b: 'q2' }, q2: { a: 'd', b: 'd' }, d: { a: 'd', b: 'd' } }, pos: { q0: [90, 200], q1: [250, 200], q2: [410, 200], d: [570, 200] } }),
  { sample: 'aabab', regex: 'a*ba*b' });

add('exB', '(a ∪ ab)* แบบไม่มี e-transition', 'สไลด์หน้า 12 exercise ข้อ 2', ['NFA', 'M1', 'M2'],
  () => T({ name: 'M (no e)', alphabet: ['a', 'b'], start: 's', finals: ['s'], rows: { s: { a: 's,q' }, q: { b: 's' } }, pos: { s: [200, 200], q: [420, 200] } }),
  { sample: 'aab', regex: '(a ∪ ab)*' });

FA.presets = P;
FA.preset = (id) => { const p = P.find(p => p.id === id); return p ? p.build() : null; };
})();
</script>
