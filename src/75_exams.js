<script>
// ===== [7.5] data/exams — midterm practice sets with detailed Thai solutions =====
FA.EXAM_UI = {
  title: '8 · ข้อสอบฝึก Midterm (4 ชุด)',
  sub: 'ทำก่อน → ตรวจ → อ่านเฉลยละเอียด — คะแนนคิดแบบข้อสอบจริง (ปรนัย/ถูก-ผิด ตอบผิดติดลบ) · เลือกโหมด "อ่านเฉลย" เพื่อดูเฉลยทันที',
  modeQuiz: 'โหมดทำข้อสอบ', modeStudy: 'โหมดอ่านเฉลย',
  check: 'ตรวจคำตอบ', showSolution: 'ดูเฉลย', hideSolution: 'ซ่อนเฉลย', reset: 'ล้างคำตอบ', resetSet: 'ล้างคำตอบชุดนี้',
  score: 'คะแนน', progress: 'ทำแล้ว', correct: 'ถูก', wrong: 'ผิด', blank: 'ไม่ตอบ', yourAnswer: 'คำตอบของคุณ',
  trueLbl: 'True', falseLbl: 'False',
  drawInEditor: 'วาดใน Editor', checkDrawing: 'ตรวจที่วาด', loadAnswer: 'โหลดเฉลยเข้า Editor', openModule: 'ไปเล่นจริงใน module',
  understood: 'อ่านพิสูจน์แล้ว เข้าใจแล้ว (นับคะแนนเต็ม)', steps: 'เฉลยละเอียด', pitfalls: 'จุดที่มักพลาด', writeOnPaper: 'เขียนลงกระดาษคำตอบ',
  summary: 'สรุปคะแนน', byTopic: 'แยกตามหัวข้อ', tryAgain: 'ลองใหม่',
  traceHint: 'พิมพ์ configuration ต่อกันด้วย ⊢ (หรือ |- หรือ ->) เช่น (q0, ab) ⊢ (q1, b) ⊢ (q2, e) — ใช้ e แทน string ว่าง',
  setHint: 'พิมพ์เป็นเซต เช่น {q0, q1} — ลำดับไม่สำคัญ, ∅ = {}',
  marks: 'คะแนน', penaltyNote: 'ตอบผิดติดลบเท่าคะแนนข้อ (ไม่ตอบ = 0)',
  notDfa: 'ที่วาดยังไม่ใช่ DFA ที่สมบูรณ์', equivalent: '✔ ถูกต้อง — ภาษาเดียวกับเฉลยทุกประการ', notEquivalent: '✘ ยังไม่ตรง',
  witnessIn: 'string นี้ถูกเครื่องของคุณ accept แต่ไม่อยู่ในภาษา:', witnessOut: 'string นี้อยู่ในภาษา แต่เครื่องของคุณ reject:',
  drawFirst: 'กด "วาดใน Editor" แล้ววาดก่อน จึงกดตรวจ', expected: 'คำตอบที่ถูก', solutionLocked: 'ตรวจคำตอบก่อน หรือกด "ดูเฉลย"',
  givenFigure: 'โจทย์ให้รูปนี้มา (ลากดูได้ · กด "ไปเล่นจริงใน module" เพื่อรัน string)', buildStepByStep: 'เฉลยเป็นรูป — กด ⏮ แล้ว ▶ ทีละ step เพื่อดูว่าวาดมายังไง (แต่ละ state จำอะไร)',
};

FA.EXAMS = [];
(() => {
const NFA_X = { name: 'NFA (ข้อสอบฝึก)', alphabet: ['a', 'b'], start: 'q0', finals: ['q3', 'q4'], rows: { q0: { a: 'q0', b: 'q0,q2' }, q1: { b: 'q2,q4' }, q2: { a: 'q3' }, q3: {}, q4: { a: 'q3' } }, eps: { q0: ['q1'], q3: ['q4'] }, pos: { q0: [90, 200], q1: [260, 110], q2: [260, 290], q4: [440, 110], q3: [440, 290] } };
FA.EXAM_AUTOMATA = FA.EXAM_AUTOMATA || {}; FA.EXAM_AUTOMATA.NFA_X = NFA_X;
const EX212_COMP = { name: '¬M (Q12)', alphabet: ['a', 'b'], start: 'q0', finals: ['q3'], rows: { q0: { a: 'q0', b: 'q1' }, q1: { a: 'q0', b: 'q2' }, q2: { a: 'q0', b: 'q3' }, q3: { a: 'q3', b: 'q3' } }, notes: { q0: '<b>q0</b> = ยังไม่เห็น b ติดกันเลย — คัดลอกจาก M ทุกอย่าง แต่<b>เอาวงคู่ออก</b> (เดิม q0 เป็น final)', q1: '<b>q1</b> = เห็น b ติดกัน 1 ตัว (เอาวงคู่ออกเช่นกัน) — อ่าน a กลับไป q0 เหมือนเดิม', q2: '<b>q2</b> = เห็น b ติดกัน 2 ตัว (เอาวงคู่ออก) — อ่าน b อีกตัว = bbb', q3: '<b>q3</b> = เจอ bbb แล้ว — เดิมเป็น trap ตอนนี้กลายเป็น <b>final ตัวเดียว</b> วนตัวเองด้วย a,b (เจอ bbb แล้วรับตลอด)' }, pos: { q0: [90, 200], q1: [250, 200], q2: [410, 200], q3: [570, 200] } };
const D_ABA = { name: '{aba}', alphabet: ['a', 'b'], start: 'q0', finals: ['q3'], rows: { q0: { a: 'q1', b: 'd' }, q1: { b: 'q2', a: 'd' }, q2: { a: 'q3', b: 'd' }, q3: { a: 'd', b: 'd' }, d: { a: 'd', b: 'd' } }, notes: { q0: '<b>q0</b> = ยังไม่ได้อ่านอะไร (start) — string ที่ต้องการคือ aba ตัวเดียว จึงวาด "ทางเดิน" ทีละตัวอักษร', q1: '<b>q1</b> = อ่านมาแล้ว "a" (ตรงกับ prefix ตัวแรกของ aba) — เส้น q0 ─a→ q1', q2: '<b>q2</b> = อ่านมาแล้ว "ab" — เส้น q1 ─b→ q2', q3: '<b>q3</b> = อ่านครบ "aba" → <b>final</b> (วงคู่) — ถ้าจบตรงนี้พอดี accept', d: '<b>d (trap)</b> = อ่านตัวอักษรที่ "ผิดทาง" (q0 อ่าน b, q1 อ่าน a, q2 อ่าน b) หรืออ่านเกินหลัง aba — ตกมาแล้ววนตัวเองตลอด ไม่มีทางกลับ. ในข้อสอบวาดแค่ 3 เส้นแบบ NFA ก็ถูก' }, pos: { q0: [80, 200], q1: [220, 200], q2: [360, 200], q3: [500, 200], d: [290, 330] } };
const D_ASTAR = { name: 'aΣ*', alphabet: ['a', 'b'], start: 'q0', finals: ['q1'], rows: { q0: { a: 'q1', b: 'd' }, q1: { a: 'q1', b: 'q1' }, d: { a: 'd', b: 'd' } }, notes: { q0: '<b>q0</b> = ยังไม่ได้อ่านตัวแรก — สิ่งเดียวที่ต้องจำคือ "ตัวแรกเป็น a หรือเปล่า"', q1: '<b>q1</b> = ตัวแรกเป็น a แล้ว → หลังจากนี้อะไรก็ได้ (Σ*) จึงเป็น <b>final</b> และวนตัวเองด้วย a,b', d: '<b>d (trap)</b> = ตัวแรกเป็น b → ไม่มีทางอยู่ในภาษาแล้ว วนตัวเองตลอด' }, pos: { q0: [100, 200], q1: [300, 200], d: [300, 330] } };
const D_MOD3 = { name: '|ω| mod 3 = 0', alphabet: ['a', 'b'], start: 'q0', finals: ['q0'], rows: { q0: { a: 'q1', b: 'q1' }, q1: { a: 'q2', b: 'q2' }, q2: { a: 'q0', b: 'q0' } }, notes: { q0: '<b>q0</b> = ความยาวที่อ่านมา หาร 3 เหลือเศษ 0 — เป็น start (ยังไม่อ่าน = ยาว 0) และเป็น <b>final</b> (เศษ 0 คือสิ่งที่ต้องการ)', q1: '<b>q1</b> = เศษ 1 — อ่านตัวอักษรใดก็ได้ (a หรือ b เหมือนกัน เพราะสนใจแค่ความยาว) จาก q0 มา q1', q2: '<b>q2</b> = เศษ 2 — อ่านอีกตัวกลับไป q0 (เศษ 0) ครบวง 3 state' }, pos: { q0: [120, 200], q1: [300, 110], q2: [300, 290] } };
Object.assign(FA.EXAM_AUTOMATA, { EX212_COMP, D_ABA, D_ASTAR, D_MOD3 });
const mono = (s) => `<span class="mono">${s}</span>`;

FA.EXAMS.push({ id: 'p1', title: 'ชุดที่ 1', questions: [
{ id: '1', marks: 5, topic: 'เซต', type: 'tf', text: 'Indicate whether each of the following is true or false. <span class="note">(each correct = 1, wrong = −1, blank = 0)</span>',
  parts: [
    { text: '∅ = {∅}', answer: false, why: 'ซ้ายคือเซตว่าง (สมาชิก 0 ตัว) ขวาคือเซตที่มีสมาชิก 1 ตัว (คือ ∅ เอง) — จำนวนสมาชิกต่างกันจึงไม่เท่ากัน. คิดภาพ: กล่องเปล่า ≠ กล่องที่มีกล่องเปล่าอยู่ข้างใน' },
    { text: '{a, b, {a, b}} − {{a}} = {b, {a, b}}', answer: false, why: 'การลบเซตคือ "เอาสมาชิกที่ตรงกันออก". สมาชิกของ {{a}} คือ {a} ซึ่ง<b>ไม่ใช่</b>สมาชิกของเซตซ้าย (สมาชิกซ้ายคือ a, b, {a,b} — ไม่มี {a}) จึงลบอะไรไม่ได้เลย ผลลัพธ์ = {a, b, {a, b}} เท่าเดิม' },
    { text: '2<sup>∅</sup> = ∅', answer: false, why: 'power set = เซตของทุก subset. ∅ มี subset 1 ตัวคือ ∅ เอง (∅ ⊆ ∅ เสมอ) ดังนั้น 2<sup>∅</sup> = {∅} ซึ่งมีสมาชิก 1 ตัว ไม่ใช่เซตว่าง. สูตร |2<sup>A</sup>| = 2<sup>|A|</sup> = 2<sup>0</sup> = 1 ยืนยัน' },
    { text: 'For any set L, there exist X, Y ∈ 2<sup>L</sup> such that X ≠ Y.', answer: false, why: 'ต้องหา counterexample: L = ∅ → 2<sup>L</sup> = {∅} มีสมาชิกตัวเดียว เลือก X, Y ได้แค่ ∅ ทั้งคู่ → X = Y เสมอ. คำว่า "for any" ต้องจริงทุก L — L เดียวที่ผิดก็ทำให้ข้อความเป็นเท็จ' },
    { text: 'For any set L, ⋃ 2<sup>L</sup> = L', answer: true, why: '⋃S = รวมสมาชิกของทุกเซตใน S. subset ทุกตัวของ L มีสมาชิกอยู่ใน L (จึง ⋃ ⊆ L) และ L เองก็เป็น subset ของ L อยู่ใน 2<sup>L</sup> (จึง L ⊆ ⋃). สองทางรวมกันได้เท่ากัน' },
  ],
  solution: { steps: ['ข้อ T/F ชุดเซต จุดที่ต้องแม่น: <b>∈ vs ⊆</b>, <b>∅ vs {∅}</b>, และ <b>สมาชิกของ power set คือ "เซต"</b>', 'เทคนิค: ข้อความ "for any" ให้พยายามหา counterexample ก่อน (มักเป็น L = ∅) ถ้าหาไม่เจอค่อยพิสูจน์ว่าจริง', 'การลบเซต A − B: ดูทีละสมาชิกของ A ว่า "ตัวนี้เป็นสมาชิกของ B ไหม" — ต้องเทียบเป็นสมาชิก ไม่ใช่ดูว่าหน้าตาคล้าย'], pitfalls: ['{a} กับ a คนละอย่าง: {a} ∈ {{a}} แต่ a ∉ {{a}}', 'ข้อ (e) ใช้ ⋃ กับ "เซตของเซต" — ต้องรู้ว่า ⋃{A₁,A₂,…} = A₁ ∪ A₂ ∪ …'] } },

{ id: '2', marks: 5, topic: 'เซต', type: 'tf', text: 'If A, B, C are sets, then',
  parts: [
    { text: 'A ∪ A ⊆ A', answer: true, why: 'A ∪ A = A (idempotency) และเซตใดก็เป็น subset ของตัวเอง' },
    { text: 'A ∩ B ∩ C ⊆ A ∪ B ∪ C', answer: true, why: 'สมาชิกของ A∩B∩C อยู่ในทั้งสามเซต จึงอยู่ใน "อย่างน้อยหนึ่ง" ในสามเซตแน่นอน' },
    { text: '(A ∩ B) ∩ C = A ∩ (B ∩ C)', answer: true, why: 'associativity ของ ∩ — ทั้งสองข้างคือ "อยู่ในทั้ง A, B และ C"' },
    { text: 'A − (B ∪ C) = (A − B) ∩ (A − C)', answer: true, why: 'De Morgan: "อยู่ใน A แต่ไม่อยู่ใน B หรือ C" = "อยู่ใน A ไม่อยู่ใน B" และ "อยู่ใน A ไม่อยู่ใน C". ตรงกับสไลด์: A∖(B∪C) = (A∖B)∩(A∖C) (∪ กลับเป็น ∩)' },
    { text: '2<sup>A∪B</sup> = 2<sup>A</sup> ∪ 2<sup>B</sup>', answer: false, why: 'ซ้ายมี subset ที่ "ผสม" สมาชิกจาก A และ B (เช่น A∪B เอง) แต่ขวามีเฉพาะ subset ของ A ล้วนหรือ B ล้วน. counterexample: A={1}, B={2}: ซ้ายมี {1,2} ขวาไม่มี' },
  ],
  solution: { steps: ['(a)–(d) เป็นกฎมาตรฐาน: idempotency, ความหมายของ ∩/∪, associativity, De Morgan', '(e) เป็นข้อหลอก: power set ไม่กระจายกับ union. จำภาพ: 2<sup>A∪B</sup> ใหญ่กว่า 2<sup>A</sup> ∪ 2<sup>B</sup> เพราะมี "เซตผสม". (ในทางกลับกัน 2<sup>A∩B</sup> = 2<sup>A</sup> ∩ 2<sup>B</sup> จริง)'], pitfalls: ['อย่าตอบ (e) True เพราะ "ดูสมมาตรดี" — ให้ทดสอบด้วยเซตเล็ก ๆ A={1}, B={2} เสมอ'] } },

{ id: '3', marks: 5, topic: 'relation', type: 'tf', text: 'Consider R = ∅ as a binary relation on the set 2<sup>ℕ</sup>. Indicate whether each of the following is true or false.',
  parts: [
    { text: 'R is reflexive.', answer: false, why: 'reflexive ต้องมี (X, X) ∈ R ทุก X ∈ 2<sup>ℕ</sup> แต่ R ว่าง ไม่มีคู่ไหนเลย เช่น (ℕ, ℕ) ∉ R' },
    { text: 'R is symmetric.', answer: true, why: 'นิยาม: "ถ้า (A,B) ∈ R แล้ว (B,A) ∈ R" — เงื่อนไข "ถ้า" ไม่เคยเกิด (R ว่าง) ข้อความจึงจริงโดยว่างเปล่า (vacuously true)' },
    { text: 'R is anti-symmetric', answer: true, why: 'เหตุผลเดียวกัน: ไม่มีคู่ (A,B) ที่จะละเมิดได้ จึงจริงโดยว่างเปล่า' },
    { text: 'R is transitive', answer: true, why: 'ไม่มี (A,B),(B,C) ใน R ที่จะบังคับให้ต้องมี (A,C) — จริงโดยว่างเปล่า' },
    { text: 'R is a partial order', answer: false, why: 'partial order = reflexive + antisymmetric + transitive. ขาด reflexive (ข้อ a) จึงไม่ใช่' },
  ],
  solution: { steps: ['หลักสำคัญ: <b>relation ว่างเป็น symmetric, antisymmetric, transitive พร้อมกัน</b> (นิยามเป็นรูป "ถ้า…แล้ว…" ซึ่งจริงเมื่อไม่มีกรณีให้ตรวจ) แต่<b>ไม่ reflexive</b> (นิยามเป็นรูป "ทุก a ต้องมี (a,a)" ซึ่งต้องการสมาชิกจริง ๆ) — ยกเว้นกรณี A = ∅', 'ในข้อนี้ A = 2<sup>ℕ</sup> ไม่ว่าง (มี ∅, {0}, ℕ, …) จึงต้องมีคู่ (X,X) จำนวนอนันต์ แต่ R ไม่มีเลย', 'partial order ต้องครบ 3 อย่าง ขาดอันเดียวก็ไม่ใช่'], pitfalls: ['ข้อสอบชุด 4 ข้อ 7.1 ถามเรื่องเดียวกันบน A={a,b} — คำตอบเหมือนกัน', 'อย่าสับสน symmetric กับ antisymmetric ว่าต้อง "ตรงข้ามกัน" — เซตว่างเป็นทั้งสองอย่าง'] } },

{ id: '4', marks: 5, topic: 'ฟังก์ชัน', type: 'tf', text: 'Consider alphabet Σ = {0, 1, 2, …, 9} and the set of natural numbers ℕ. Function f : ℕ → Σ* maps each natural number n into its decimal representation (e.g. f(eleven) = 11).',
  parts: [
    { text: 'f is one-to-one', answer: true, why: 'ตัวเลขต่างกัน → เขียนทศนิยม (ไม่มี 0 นำหน้า) ต่างกัน ไม่มีสอง n ที่ได้ string เดียวกัน' },
    { text: 'f is onto Σ*', answer: false, why: 'onto ต้องให้ทุก string ใน Σ* มีต้นทาง แต่ string เช่น 001 หรือ 007 ไม่ใช่การเขียนทศนิยมมาตรฐานของเลขใด (เลข 1 เขียนว่า "1" ไม่ใช่ "001") จึงไม่มี n ที่ f(n) = 001. (string ว่าง e ก็ไม่มีต้นทางเช่นกัน)' },
    { text: 'f is a bijection', answer: false, why: 'bijection = one-to-one และ onto. ไม่ onto (ข้อ b) จึงไม่ใช่' },
    { text: 'ℕ and Σ* are equinumerous', answer: true, why: 'จริง — แต่ไม่ใช่เพราะ f ตัวนี้! ต้องมี bijection <i>ตัวอื่น</i>: Σ* นับได้ (เรียง string ตามความยาวแล้วตามพจนานุกรม: e, 0, 1, …, 9, 00, 01, …) จึงมี bijection กับ ℕ' },
  ],
  solution: { steps: ['แยกให้ชัด 3 คำ: <b>one-to-one</b> (ต้นทางต่างกัน → ปลายทางต่างกัน), <b>onto</b> (ปลายทางทุกตัวถูกชี้ถึง), <b>bijection</b> = ทั้งสอง', 'ข้อ (b) หลอกด้วยการให้ co-domain เป็น Σ* ทั้งหมด ซึ่งใหญ่กว่า "เลขที่เขียนถูกต้อง" — ต้องนึกถึง string แปลก ๆ อย่าง 007, e', 'ข้อ (d) เป็นคนละคำถาม: equinumerous ถามว่า "มี bijection สักตัวไหม" ไม่ใช่ "f เป็น bijection ไหม" — Σ* ของ alphabet จำกัดนับได้เสมอ (textbook §1.7: เรียงตามความยาวแล้ว lexicographic)'], pitfalls: ['ตอบ (d) False เพราะคิดว่าต้องใช้ f ตัวเดิม — ผิด', 'ลืม string ว่าง e ∈ Σ* ซึ่งไม่มี n ใดแทน'] } },

{ id: '5', marks: 5, topic: 'relation', type: 'short', text: 'Let A = {a, b, c} and R = {(a,a), (a,b), (b,c), (c,a)} ⊆ A × A.<br>(a) Find the smallest relation X ⊇ R that is <b>reflexive</b>.<br>(b) Find the smallest relation Y ⊇ R that is <b>reflexive and transitive</b>.',
  parts: [
    { label: '(a) X = ', kind: 'set', answer: '{(a,a),(a,b),(b,c),(c,a),(b,b),(c,c)}', why: 'reflexive closure = R ∪ {(x,x) | x ∈ A}. R มี (a,a) แล้ว เติม (b,b), (c,c)' },
    { label: '(b) Y = ', kind: 'set', answer: '{(a,a),(a,b),(b,c),(c,a),(b,b),(c,c),(a,c),(b,a),(c,b)}', why: 'ต่อจาก X เติมคู่ที่ transitivity บังคับจนไม่มีอะไรเพิ่ม: (a,b)+(b,c) → (a,c); (b,c)+(c,a) → (b,a); (c,a)+(a,b) → (c,b). รอบถัดไป (a,c)+(c,a)→(a,a) มีแล้ว, (b,a)+(a,b)→(b,b) มีแล้ว … ไม่มีใหม่ → ได้ทั้ง 9 คู่ = A × A' },
  ],
  solution: { steps: ['<b>(a) reflexive closure</b>: เติมแค่ self-loop ที่ขาด — R ∪ {(a,a),(b,b),(c,c)} (textbook §1.6: closure = เซตเล็กสุดที่มี R และมีสมบัติที่ต้องการ)', '<b>(b) reflexive transitive closure</b> ทำเป็นรอบ ๆ: เริ่มจาก X แล้วมองหา (x,y),(y,z) ∈ ปัจจุบัน ที่ (x,z) ยังไม่มี → เติม → ทำซ้ำจนไม่มีอะไรเติม (algorithm O(n⁵) ในหนังสือ)', 'รอบ 1: (a,b)(b,c)⇒(a,c) · (b,c)(c,a)⇒(b,a) · (c,a)(a,b)⇒(c,b). รอบ 2: ตรวจทุกคู่อีกครั้ง — ไม่มีใหม่. หยุด', 'มุมมองกราฟ: R มี cycle a→b→c→a จึงทุก node ไปถึงทุก node ได้ → closure = A × A ทั้งหมด (9 คู่)'], pitfalls: ['ลืมทำ "รอบที่สอง" หลังเติมคู่ใหม่ — คู่ที่เพิ่งเติมอาจสร้างคู่ใหม่ต่อ', 'ข้อ (a) ห้ามเติมคู่อื่นเกินจำเป็น ("smallest")'], write: 'X = R ∪ {(b,b),(c,c)} = {(a,a),(a,b),(b,c),(c,a),(b,b),(c,c)}<br>Y = X ∪ {(x,z) | ∃y: (x,y),(y,z) ∈ X} (ทำซ้ำจนนิ่ง) = {(a,a),(a,b),(b,c),(c,a),(b,b),(c,c),(a,c),(b,a),(c,b)}' } },

{ id: '6', marks: 5, topic: 'countability', type: 'tf', text: 'Suppose that Σ is an alphabet and f is a function from 2<sup>Σ*</sup> to Σ*. Indicate whether each of the following is true or false. <span class="note">(each = 2.5)</span>',
  parts: [
    { text: 'It is possible that f is an onto-Σ* function', answer: true, why: 'onto ต้องการแค่ "ทุก string ถูกชี้ถึง". 2<sup>Σ*</sup> ใหญ่กว่า Σ* มาก (uncountable vs countable) ย่อมมีฟังก์ชันที่ครอบคลุม Σ* ได้ เช่น f({w}) = w สำหรับ singleton และ f(L) = e สำหรับ L อื่น' },
    { text: 'It is possible that f is a bijection.', answer: false, why: 'bijection แปลว่าสองเซต equinumerous แต่ 2<sup>Σ*</sup> uncountable (Cantor/diagonalization) ส่วน Σ* countable — ขนาดต่างกันจึงไม่มี bijection ไม่ว่าจะเลือก f แบบไหน' },
  ],
  solution: { steps: ['ข้อนี้คือ "ภาษามีมากกว่า string" (สไลด์หน้า 49 / textbook §1.8): Σ* นับได้, 2<sup>Σ*</sup> นับไม่ได้', 'onto จาก "ใหญ่" ไป "เล็ก" ทำได้เสมอ (ยัดหลายตัวลงปลายทางเดียวกันได้) แต่ bijection ต้องขนาดเท่ากัน', 'นี่คือเหตุผลลึก ๆ ที่ไม่มีวิธี represent ทุกภาษาได้ด้วย string จำกัด — มี regular expression / grammar / automaton นับได้เท่านั้น'], pitfalls: ['อย่าคิดว่า "มี f ที่ one-to-one ได้ไหม" — จาก uncountable ไป countable one-to-one ก็ไม่ได้เช่นกัน (pigeonhole แบบอนันต์)'] } },

{ id: '7', marks: 5, topic: 'countability', type: 'proof', text: 'Let A = {a<sub>i</sub> | i ∈ ℕ} and B = {b<sub>j</sub> | j ∈ ℕ} where ℕ is the set of natural numbers. Give a bijection from A ∪ B to ℕ.',
  solution: { steps: ['ต้องการ "จับคู่" สมาชิกของ A ∪ B กับ 0, 1, 2, … โดยไม่ซ้ำและไม่ตกหล่น (dovetailing สลับกัน — Figure 1-7)', 'ให้ A ใช้เลขคู่ B ใช้เลขคี่: <b>f(a<sub>i</sub>) = 2i</b>, <b>f(b<sub>j</sub>) = 2j + 1</b>', 'one-to-one: a-ต่างกันได้เลขคู่ต่างกัน, b-ต่างกันได้เลขคี่ต่างกัน, a กับ b ไม่ชนกันเพราะคู่ ≠ คี่. onto: เลขคู่ 2k มาจาก a<sub>k</sub>, เลขคี่ 2k+1 มาจาก b<sub>k</sub>', 'ภาพ: a₀ b₀ a₁ b₁ a₂ b₂ … ↔ 0 1 2 3 4 5 …'], pitfalls: ['ถ้าเขียน f(a<sub>i</sub>) = i, f(b<sub>j</sub>) = j จะไม่ one-to-one (a₀ กับ b₀ ชนกันที่ 0)', 'ถ้าจะให้ครบ A ก่อนแล้วค่อย B จะไม่มีวันถึง B (A อนันต์) — ต้องสลับ'], write: 'นิยาม f : A ∪ B → ℕ โดย f(a<sub>i</sub>) = 2i และ f(b<sub>j</sub>) = 2j + 1. f เป็น one-to-one เพราะเลขคู่/คี่ไม่ซ้ำกัน และ onto เพราะทุก n ∈ ℕ เป็น 2i หรือ 2j+1 อย่างใดอย่างหนึ่ง ดังนั้น f เป็น bijection' } },

{ id: '8', marks: 5, topic: 'diagonalization', type: 'short', text: 'Let R = {(n, m) | n ∈ ℕ, m = n + 1} be a binary relation over ℕ.<br>(a) Enumerate the diagonal set D = {x ∈ ℕ | (x, x) ∉ R}.<br>(b) Enumerate the row set R<sub>0</sub>.',
  parts: [
    { label: '(a) D = ', kind: 'text', answer: ['N', 'ℕ', '{0,1,2,...}', '{0,1,2,…}'], why: '(x,x) ∈ R ต้องมี x = x+1 ซึ่งเป็นไปไม่ได้ → ทุก x อยู่ใน D → D = ℕ ทั้งหมด' },
    { label: '(b) R₀ = ', kind: 'set', answer: '{1}', why: 'R₀ = {m | (0,m) ∈ R} = {m | m = 0+1} = {1}' },
  ],
  solution: { steps: ['วาด R เป็นตาราง: แถว n มี ✓ ที่คอลัมน์ n+1 เท่านั้น (เส้นทแยงเลื่อนไปขวา 1 ช่อง) เส้นทแยงหลักจึงว่างทั้งเส้น', '<b>D</b> = ตำแหน่งบนเส้นทแยงที่ "ไม่มี ✓" = ทุกตำแหน่ง = ℕ', '<b>R₀</b> = แถวของ 0 = {1}. ตรวจ diagonalization principle: D = ℕ ≠ R<sub>n</sub> = {n+1} ทุก n ✓ (D ไม่เท่ากับแถวใดเลย ตามทฤษฎี)'], pitfalls: ['D นิยามด้วย ∉ (ตำแหน่งที่ "ไม่มี") — คนละอย่างกับ {x | (x,x) ∈ R} ซึ่งจะเป็น ∅'] } },

{ id: '9', marks: 5, topic: 'regular language', type: 'proof', text: 'Give two different, but equivalent definitions for the set of all regular languages over some fixed alphabet Σ.',
  solution: { steps: ['<b>นิยาม 1 (ผ่าน regular expression)</b>: {L ⊆ Σ* | มี regular expression α ที่ L(α) = L} — ภาษาที่ "เขียนเป็น regex ได้"', '<b>นิยาม 2 (ผ่าน closure)</b>: เซตเล็กที่สุดของภาษาที่ (i) มี ∅ และ {a} สำหรับทุก a ∈ Σ และ (ii) ปิดภายใต้ union, concatenation, Kleene star — คือถ้า L₁, L₂ อยู่ในเซตแล้ว L₁∪L₂, L₁L₂, L₁* ก็อยู่', 'ทำไมเท่ากัน: regex ก็สร้างจาก ∅, a และตัวดำเนินการ 3 ตัวนี้เป๊ะ (นิยาม regex ในสไลด์หน้า 50) — นิยาม 1 คือ "syntax" นิยาม 2 คือ "semantics" ของสิ่งเดียวกัน', '(บทที่ 2 ให้นิยามที่ 3: ภาษาที่มี finite automaton accept — Theorem 2.3.2)'], pitfalls: ['ต้องเขียนคำว่า "smallest/least set" ในนิยาม 2 — ถ้าไม่ใส่ เซตของทุกภาษาก็ผ่านเงื่อนไข (i)(ii) เหมือนกัน', 'อย่าลืม ∅ และ e (e ได้จาก ∅* ไม่ต้องใส่แยก)'], write: 'Def 1: R = {L ⊆ Σ* | ∃ regular expression α over Σ such that L(α) = L}.<br>Def 2: R is the smallest set of languages such that ∅ ∈ R, {a} ∈ R for every a ∈ Σ, and if L₁, L₂ ∈ R then L₁ ∪ L₂, L₁L₂, L₁* ∈ R.' } },

{ id: '10', marks: 5, topic: 'regex', type: 'tf', text: 'Indicate whether each of the following is true or false.',
  parts: [
    { text: 'L((a ∪ b)*) = {a, b}*', answer: true, why: '(a∪b)* = string ที่ประกอบจาก a หรือ b กี่ตัวก็ได้ = ทุก string บน {a,b}' },
    { text: 'L((a*b*) ∪ (a*b*)) = {a, b}*', answer: false, why: 'A ∪ A = A ดังนั้นซ้าย = L(a*b*) = a ทั้งหมดก่อนแล้ว b ทั้งหมด (เช่น aab, bbb) — ไม่มี "ba" จึงไม่ใช่ทุก string' },
    { text: 'L(b*a*) ∪ L(a*b*) = a* ∪ b*', answer: false, why: 'ซ้ายมี "ab" (จาก a*b*) แต่ขวามีเฉพาะ a ล้วนหรือ b ล้วน — ab ∉ a* ∪ b*. ที่จริงขวา ⊂ ซ้าย แต่ไม่เท่ากัน' },
    { text: 'for any language L, it holds that L* = LL*', answer: false, why: 'L* มี e เสมอ (ซ้ำ 0 รอบ) แต่ LL* จะมี e ก็ต่อเมื่อ e ∈ L. counterexample: L = {a}: L* = {e,a,aa,…} แต่ LL* = {a,aa,…}' },
    { text: 'for any language L, it holds that L* = (L*)*', answer: true, why: '(L*)* = ต่อ string จาก L* กี่ตัวก็ได้ = ต่อ string จาก L กี่ตัวก็ได้ = L*. (คีย์ของเฉลยชุดนี้ระบุ False ซึ่งขัดกับ textbook Problem 1.7.4(b) และเฉลยชุด 2 ข้อ 5(e)/ชุด 3 ข้อ 5 — ข้อความนี้เป็น<b>จริง</b>)' },
  ],
  solution: { steps: ['เทคนิคข้อ regex T/F: หา string สั้น ๆ ที่อยู่ข้างหนึ่งแต่ไม่อยู่อีกข้าง (มัก e, ab, ba)', '(b),(c) ทดสอบด้วย "ba" และ "ab"', '(d) ทดสอบด้วย e — L* มี e เสมอ', '(e) star ซ้อน star ไม่เพิ่มอะไร: (L*)* = L* (สไลด์หน้า 52 exercise)'], pitfalls: ['<b>ข้อ (e) เฉลยในไฟล์ชุด 1 พิมพ์ผิด</b> — ยึดตาม textbook: (L*)* = L* เป็นจริง. เว็บนี้ให้คะแนน True', 'จำ: L* ∋ e เสมอ, L⁺ = LL* อาจไม่มี e'] } },

{ id: '11a', marks: 2.5, topic: 'DFA', type: 'short', text: '11(a) The state diagram of a DFA M = (K, Σ, δ, q, F) is given (see module 1: preset "No three consecutive b\'s"). Specify formally each element of M.',
  parts: [
    { label: 'K = ', kind: 'set', answer: '{q0,q1,q2,q3}', why: 'state ทั้ง 4 ตัวในรูป' },
    { label: 'Σ = ', kind: 'set', answer: '{a,b}', why: 'สัญลักษณ์บนเส้น' },
    { label: 'F = ', kind: 'set', answer: '{q0,q1,q2}', why: 'วงคู่ 3 ตัว (q3 ไม่ใช่ final — เป็น trap)' },
    { label: 'δ = (เขียนเป็นเซตของ ((q,σ),q′))', kind: 'set', answer: ['{((q0,a),q0),((q0,b),q1),((q1,a),q0),((q1,b),q2),((q2,a),q0),((q2,b),q3),((q3,a),q3),((q3,b),q3)}', '{(q0,a,q0),(q0,b,q1),(q1,a,q0),(q1,b,q2),(q2,a,q0),(q2,b,q3),(q3,a,q3),(q3,b,q3)}'], why: 'อ่านจากทุกลูกศร: จาก state ไหน ด้วยตัวอักษรอะไร ไป state ไหน — DFA ต้องมีครบ |K|×|Σ| = 8 คู่' },
  ],
  link: { module: 'editor', automaton: 'ex212', sample: 'aaab' },
  solution: { steps: ['DFA คือ 5-tuple (K, Σ, δ, s, F): อ่านจากรูปทีละส่วน — วงกลม = K, ตัวอักษรบนเส้น = Σ, ▷ = s = q0, วงคู่ = F', 'δ เขียนได้ 2 แบบที่อาจารย์ยอมรับ: เซตของคู่ ((q,σ), q′) (ฟังก์ชันคือเซตของคู่) หรือ triple (q, σ, q′) แบบสไลด์หน้า 4', 'ตรวจว่าเป็น DFA จริง: ทุก state ต้องมีลูกศรออกครบทั้ง a และ b (8 เส้นพอดี)', 'ภาษา: string ที่ไม่มี bbb (Example 2.1.2) — q1, q2 = "เห็น b ติดกัน 1, 2 ตัว", q3 = trap'], pitfalls: ['ลืมใส่ self-loop ของ q3 ทั้งสองตัว', 'เขียน δ เป็น K × Σ → K แต่ไม่ enumerate — ข้อสอบให้ enumerate'] } },

{ id: '11b', marks: 2.5, topic: 'DFA', type: 'trace', text: '11(b) Complete the following runs of M (until the input strings are consumed fully).', automaton: 'ex212', inputs: ['aaab', 'bbbb'],
  link: { module: 'editor', automaton: 'ex212', sample: 'aaab' },
  solution: { steps: ['configuration = (state ปัจจุบัน, input ที่ยังไม่อ่าน) แต่ละ ⊢ อ่าน 1 ตัวอักษรตาม δ', '<b>aaab</b>: (q0,aaab) ⊢ (q0,aab) ⊢ (q0,ab) ⊢ (q0,b) ⊢ (q1,e) — q1 ∈ F → accept', '<b>bbbb</b>: (q0,bbbb) ⊢ (q1,bbb) ⊢ (q2,bb) ⊢ (q3,b) ⊢ (q3,e) — q3 ∉ F → reject (เจอ bbb แล้วติด trap)'], pitfalls: ['configuration สุดท้ายต้องเป็น (q, e) — เขียนจนอ่านหมด', 'ใช้ ⊢ (yields) ไม่ใช่ → หรือ = ในข้อสอบ'] } },

{ id: '12', marks: 5, topic: 'closure', type: 'draw', text: 'Draw the state-transition diagram of a FA M′ such that L(M′) = {a,b}* − L(M), where M is the DFA in Question 11.', alphabet: ['a', 'b'], answer: EX212_COMP,
  link: { module: 'closure' },
  solution: { steps: ['{a,b}* − L(M) คือ <b>complement</b>. M เป็น DFA ที่ complete อยู่แล้ว (ทุก state มีทางออกครบ) จึงทำได้ทันที: <b>สลับ final ↔ ไม่ final</b> ส่วนอื่นเหมือนเดิม', 'M มี F = {q0,q1,q2} → M′ มี F′ = K − F = {q3} ตัวเดียว', 'ความหมาย: M′ รับ string ที่ "มี bbb เป็น substring" — พอเจอ bbb ก็ตกไป q3 ซึ่งตอนนี้เป็น final และวนอยู่ตรงนั้น', 'ถ้า M ไม่ complete ต้องเพิ่ม trap ก่อนสลับ (ไม่งั้น string ที่ติดกลางทางจะไม่ถูก accept ทั้งสองเครื่อง) — และห้ามทำกับ NFA (module 5)'], pitfalls: ['สลับ final แล้วลืมว่า start state q0 ตอนนี้ไม่ใช่ final → e ∉ L(M′) ถูกแล้ว (e ∈ L(M))'], write: 'M′ = (K, Σ, δ, q0, K − F) = same diagram with F′ = {q3}' } },

{ id: '13', marks: 10, topic: 'DFA', type: 'draw', text: 'Draw the state-transition diagram of a FA accepting each of the following languages (over Σ = {a, b}).', alphabet: ['a', 'b'],
  parts: [
    { label: '(a) {aba}', answer: D_ABA },
    { label: '(b) aΣ*', answer: D_ASTAR },
    { label: '(c) {ω ∈ Σ* | len(ω) % 3 = 0}', answer: D_MOD3 },
  ],
  solution: { steps: ['<b>วิธีคิดทั่วไป</b>: ถามว่า "เครื่องต้องจำอะไรบ้าง" แล้วให้แต่ละสิ่งที่ต้องจำเป็น 1 state', '<b>(a) {aba}</b> — ภาษาจำกัด string เดียว: ต้องจำว่า "อ่านมาแล้วตรงกับ prefix ไหนของ aba": q0 (ยังไม่อ่าน) ─a→ q1 (a) ─b→ q2 (ab) ─a→ q3 (aba, final). ตัวอักษรอื่น ๆ ทุกกรณี → trap d (ไม่ final) และจาก q3 อ่านอะไรต่อก็ตกไป d (ห้ามยาวกว่า aba). ถ้าวาดเป็น NFA แบบข้อสอบ (3 เส้นไม่มี trap) ก็ถูก — เว็บตรวจด้วยภาษา', '<b>(b) aΣ*</b> = ขึ้นต้นด้วย a แล้วอะไรก็ได้: q0 ─a→ q1 (final) แล้ว q1 วนตัวเองด้วย a,b; q0 ─b→ trap. ต้องจำแค่ "ตัวแรกเป็น a หรือยัง"', '<b>(c) |ω| mod 3 = 0</b> — จำ "ความยาวที่อ่านมา mod 3" ได้ 3 ค่า → 3 state เรียงเป็นวง q0 → q1 → q2 → q0 ทุกตัวอักษร (a หรือ b เหมือนกัน) final = q0 (เศษ 0 รวม e ที่ยาว 0)'], pitfalls: ['(a) ลืม trap แล้วบอกว่าเป็น DFA — ตามนิยามเคร่ง ๆ ต้องมี; ข้อสอบยอมรับรูปไม่มี trap ถ้าเข้าใจว่าเป็น NFA', '(c) start ต้องเป็น final ด้วย (e มีความยาว 0 หาร 3 ลงตัว)', 'เขียนกำกับให้ครบทั้ง a และ b บนเส้น (a,b)'] } },

{ id: '14', marks: 10, topic: 'NFA→DFA', type: 'nfa2dfa', text: 'Suppose that you convert the following NFA into an equivalent DFA using the powerset algorithm (see module 2). What is q′₀ (the initial state of M′), and what is δ′(δ′(q′₀, a), b)?', automaton: NFA_X,
  parts: [
    { label: 'q′₀ = E(q₀) = ', kind: 'set', answer: '{q0,q1}', why: 'q0 ─e→ q1 จึง E(q0) = {q0, q1} (รวมตัวเอง)' },
    { label: 'δ′(q′₀, a) = ', kind: 'set', answer: '{q0,q1}', why: 'จาก {q0,q1} อ่าน a: q0 ─a→ q0 (loop), q1 ไม่มีเส้น a → {q0} → E(q0) = {q0,q1}' },
    { label: 'δ′(δ′(q′₀, a), b) = ', kind: 'set', answer: '{q0,q1,q2,q4}', why: 'จาก {q0,q1} อ่าน b: q0 → q0, q2; q1 → q2, q4 → {q0,q2,q4} → E(q0) ∪ E(q2) ∪ E(q4) = {q0,q1} ∪ {q2} ∪ {q4} = {q0,q1,q2,q4}' },
  ],
  solution: { steps: ['<b>ขั้น 1 e-Closure</b>: E(q0)={q0,q1}, E(q1)={q1}, E(q2)={q2}, E(q3)={q3,q4} (q3 ─e→ q4), E(q4)={q4}', '<b>ขั้น 2 start</b>: q′₀ = E(q0) = {q0,q1}', '<b>ขั้น 3 δ′(Q, σ)</b> = รวม E(p) ของทุก p ที่ไปถึงจากสมาชิกของ Q ด้วย σ: อ่าน a จาก {q0,q1} → q0 เท่านั้น → {q0,q1}; แล้วอ่าน b จาก {q0,q1} → {q0,q2,q4} → รวม closure = {q0,q1,q2,q4}', 'ข้อสอบเขียนว่า "consumes string aa" แต่ถามสูตร δ′(δ′(q′₀,a),b) = อ่าน a แล้ว b — ยึดตามสูตร (เฉลยชุดนี้ก็ทำแบบนี้)'], pitfalls: ['ลืมเอา e-Closure ของปลายทางมารวม (ต้องเป็น ⋃E(p) ไม่ใช่แค่ {p})', 'ลืมว่า q0 มี self-loop a,b — q0 อยู่ในเซตต่อไปเสมอ'] } },

{ id: '15', marks: 10, topic: 'pigeonhole', type: 'proof', text: 'Prove that, for any DFA, its state-transition diagram always contains a cycle.',
  link: { module: 'pumping' },
  solution: { steps: ['ให้ M = (K, Σ, δ, s, F) เป็น DFA ใด ๆ, n = |K|, เลือก a ∈ Σ', 'เดินด้วย aⁿ: q₀ = s, q<sub>i+1</sub> = δ(q<sub>i</sub>, a) ได้ลำดับ q₀…q<sub>n</sub> ยาว n+1 ตัว (เดินได้ตลอดเพราะ δ เป็นฟังก์ชันครบทุกคู่)', 'Pigeonhole: n+1 ตำแหน่ง แต่ state มี n ตัว → มี i &lt; j ที่ q<sub>i</sub> = q<sub>j</sub>', 'เส้นทาง q<sub>i</sub> → … → q<sub>j</sub> = q<sub>i</sub> ยาว j−i ≥ 1 เริ่มและจบที่เดิม = cycle ใน diagram', 'ดู module 6 แผง "โจทย์ที่ต้องใช้ pigeonhole" มีเวอร์ชันเดินบนเครื่องจริง'], pitfalls: ['ต้องเดิน n ตัว (ไม่ใช่ n−1) เพื่อได้ n+1 ตำแหน่ง', 'อ้างว่า δ เป็นฟังก์ชัน — NFA อาจไม่มี cycle'], write: 'Let M = (K, Σ, δ, s, F) be any DFA, n = |K|, and a ∈ Σ. Define q₀ = s and q<sub>i+1</sub> = δ(q<sub>i</sub>, a). The sequence q₀, …, q<sub>n</sub> has n+1 entries but K has only n elements, so by the pigeonhole principle q<sub>i</sub> = q<sub>j</sub> for some i &lt; j. The path q<sub>i</sub>, q<sub>i+1</sub>, …, q<sub>j</sub> starts and ends at the same state and has length ≥ 1, hence it is a cycle in the state-transition diagram. ∎' } },

{ id: '16', marks: 10, topic: 'pumping', type: 'proof', text: 'Prove that L = {aⁿbⁿcⁿ | n ≥ 0} is not a regular language.',
  link: { module: 'pumping' },
  solution: { steps: ['สมมติ L regular → Pumping Theorem ให้ n', 'เลือก ω = aⁿbⁿcⁿ ∈ L, |ω| = 3n ≥ n', 'theorem: ω = xyz, y ≠ e, |xy| ≤ n → xy อยู่ใน n ตัวแรกซึ่งเป็น a ล้วน → <b>y = aᵏ, k ≥ 1</b>', 'เลือก i = 0: xy⁰z = a<sup>n−k</sup>bⁿcⁿ มี a น้อยกว่า b (และ c) → ∉ L', 'ขัดแย้งกับ theorem (ที่บอกว่า xyⁱz ∈ L ทุก i) → L ไม่ regular ∎', 'เหมือนพิสูจน์ aⁿbⁿ ทุกประการ (เฉลยจึงเขียนว่า "the same") — เล่นในเกม module 6 ได้'], pitfalls: ['ต้องอธิบายว่าทำไม y เป็น a ล้วน (จาก |xy| ≤ n) ไม่ใช่สมมติเอาเอง', 'อย่าลืมกรณี k ≥ 1 (y ≠ e) เพื่อให้จำนวน a ลดจริง'], write: 'Suppose L is regular and let n be the constant of the Pumping Theorem. Take ω = aⁿbⁿcⁿ ∈ L with |ω| = 3n ≥ n. Then ω = xyz with y ≠ e and |xy| ≤ n, so y = aᵏ for some k ≥ 1. For i = 0, xy⁰z = a<sup>n−k</sup>bⁿcⁿ ∉ L since it has fewer a\'s than b\'s — a contradiction. Hence L is not regular. ∎' } },
] });
})();

(() => {
const P2Q9 = { name: 'M (ชุด 2 ข้อ 9)', alphabet: ['a', 'b'], start: 'q0', finals: ['q0'], rows: { q0: { a: 'q0', b: 'q1' }, q1: { a: 'q0', b: 'q2' }, q2: { a: 'q0', b: 'q3' }, q3: { a: 'q3', b: 'q3' } }, pos: { q0: [90, 200], q1: [250, 200], q2: [410, 200], q3: [570, 200] } };
FA.EXAM_AUTOMATA.P2Q9 = P2Q9;

const D_ABA_STAR = { name: '{ab}{a}*', alphabet: ['a', 'b'], start: 'q0', finals: ['q2'], rows: { q0: { a: 'q1', b: 'd' }, q1: { b: 'q2', a: 'd' }, q2: { a: 'q2', b: 'd' }, d: { a: 'd', b: 'd' } }, notes: { q0: '<b>q0</b> = ยังไม่อ่าน — ภาษาคือ ab แล้วตามด้วย a กี่ตัวก็ได้ จึงเริ่มด้วยทางเดิน a, b', q1: '<b>q1</b> = อ่าน "a" แล้ว', q2: '<b>q2</b> = อ่าน "ab" ครบส่วนบังคับ → <b>final</b>; a เพิ่มกี่ตัวก็ยังอยู่ในภาษา จึงวนตัวเองด้วย a', d: '<b>d (trap)</b> = ผิดทาง (b ก่อน a, a สองตัวติดตอนต้น, หรือ b หลัง ab) — วาดแบบ NFA ไม่ต้องมี d ก็ได้' }, pos: { q0: [80, 200], q1: [240, 200], q2: [400, 200], d: [240, 330] } };
const D_A_BB = { name: '{a}{a,b}*bb', alphabet: ['a', 'b'], start: 'q0', finals: ['q3'], rows: { q0: { a: 'q1', b: 'd' }, q1: { a: 'q1', b: 'q2' }, q2: { a: 'q1', b: 'q3' }, q3: { a: 'q1', b: 'q3' }, d: { a: 'd', b: 'd' } }, notes: { q0: '<b>q0</b> = ยังไม่อ่าน — ต้องจำ 2 อย่าง: (1) ตัวแรกเป็น a หรือยัง (2) ตอนนี้ลงท้ายด้วย b ติดกันกี่ตัว', q1: '<b>q1</b> = ขึ้นต้น a แล้ว และท้ายสุด<b>ไม่ใช่ b</b> (b ติดกัน 0 ตัว) — อ่าน a อยู่ที่เดิม', q2: '<b>q2</b> = ลงท้ายด้วย b <b>1 ตัว</b> — ถ้าอ่าน a จะกลับไป q1 (ล้าง b ท้าย)', q3: '<b>q3</b> = ลงท้ายด้วย bb (≥ 2) → <b>final</b>; อ่าน b ต่อยังลงท้าย bb (วนตัวเอง), อ่าน a กลับ q1', d: '<b>d (trap)</b> = ตัวแรกเป็น b — ไม่มีทางแก้แล้ว' }, pos: { q0: [80, 200], q1: [240, 200], q2: [400, 200], q3: [560, 200], d: [80, 330] } };
const D_A_OR_B = { name: 'a* ∪ b*', alphabet: ['a', 'b'], start: 'q0', finals: ['q0', 'qa', 'qb'], rows: { q0: { a: 'qa', b: 'qb' }, qa: { a: 'qa', b: 'd' }, qb: { b: 'qb', a: 'd' }, d: { a: 'd', b: 'd' } }, notes: { q0: '<b>q0</b> = ยังไม่อ่าน — e ไม่มี a เงื่อนไข "ถ้ามี a แล้วห้ามมี b" จึงจริง → start เป็น <b>final</b> ด้วย', qa: '<b>qa</b> = เห็นแต่ a ล้วน → <b>final</b> วนตัวเองด้วย a', qb: '<b>qb</b> = เห็นแต่ b ล้วน → <b>final</b> วนตัวเองด้วย b', d: '<b>d (trap)</b> = มีทั้ง a และ b ปนกัน (qa อ่าน b หรือ qb อ่าน a) — ไม่มีทางกลับ' }, pos: { q0: [100, 200], qa: [300, 100], qb: [300, 300], d: [500, 200] } };

Object.assign(FA.EXAM_AUTOMATA, { D_ABA_STAR, D_A_BB, D_A_OR_B });
FA.EXAMS.push({ id: 'p2', title: 'ชุดที่ 2', questions: [
{ id: '1', marks: 10, topic: 'เซต', type: 'tf', text: 'Indicate whether each of the following is true or false. <span class="note">(each = 2, wrong = −2)</span>',
  parts: [
    { text: '∅ ∈ {{∅}}', answer: false, why: '{{∅}} มีสมาชิก<b>ตัวเดียว</b>คือ {∅}. ถาม "∅ เป็นสมาชิกไหม" → ∅ ≠ {∅} จึงไม่ใช่. (ที่จริง ∅ ∈ {∅} และ {∅} ∈ {{∅}} — ลึกคนละชั้น)' },
    { text: 'S ⊆ 2<sup>S</sup> for any set S.', answer: false, why: 'สมาชิกของ 2<sup>S</sup> คือ "subset ของ S" แต่สมาชิกของ S เป็นอะไรก็ได้. counterexample: S = {1}: 2<sup>S</sup> = {∅, {1}} ไม่มี 1 → S ⊄ 2<sup>S</sup>' },
    { text: 'A − (B ∪ C) = (A − B) − C for any sets A, B, C', answer: true, why: '"เอาออกทั้ง B และ C พร้อมกัน" = "เอา B ออกก่อน แล้วค่อยเอา C ออก" — ทั้งสองข้างคือ {x ∈ A | x ∉ B และ x ∉ C}' },
    { text: 'For any sets A, B, C, A ∪ (B ∩ C) = (A ∩ B) ∪ (A ∩ C)', answer: false, why: 'กฎกระจายที่ถูกคือ A ∪ (B∩C) = (A∪B) ∩ (A∪C) และ A ∩ (B∪C) = (A∩B) ∪ (A∩C). ข้อนี้ผสมสองกฎ. counterexample: A={1}, B=C=∅: ซ้าย = {1}, ขวา = ∅' },
    { text: 'There exists a set X such that X = 2<sup>X</sup>', answer: false, why: '|2<sup>X</sup>| = 2<sup>|X|</sup> > |X| เสมอ (แม้ X อนันต์ — Cantor) จึงเท่ากันไม่ได้. ลอง X = ∅: 2<sup>∅</sup> = {∅} ≠ ∅' },
  ],
  solution: { steps: ['(a),(b) ทดสอบด้วยการนับ "ชั้น" ของวงเล็บปีกกา: ∅ อยู่ชั้น 0, {∅} ชั้น 1, {{∅}} ชั้น 2 — ∈ ลดได้ทีละชั้นเท่านั้น', '(c) วาด Venn: ลบ B∪C ออกจาก A = ลบ B แล้วลบ C', '(d) จำกฎกระจาย 2 แบบให้แม่น: ∪ กระจายเข้า ∩ และ ∩ กระจายเข้า ∪ — ข้อนี้เอาซ้ายจากกฎหนึ่ง ขวาจากอีกกฎ', '(e) power set ใหญ่กว่าเสมอ (2<sup>n</sup> > n ทุก n)'], pitfalls: ['ข้อ (d) ดู "คล้ายกฎกระจาย" มาก — ต้องเช็คตัวดำเนินการนอกวงเล็บว่าตรงกับกฎไหนจริง ๆ'] } },

{ id: '2', marks: 10, topic: 'relation', type: 'short', text: 'Let R = {(a,b), (b,c), (c,f), (b,a)}.',
  parts: [
    { label: '(a) |R⁻¹| = ', kind: 'number', answer: '4', why: 'R⁻¹ กลับด้านทุกคู่: {(b,a),(c,b),(f,c),(a,b)} — จำนวนเท่า R เสมอ (กลับด้านเป็น bijection)' },
    { label: '(b) |R ∘ R| = ', kind: 'number', answer: ['4', '5'], why: 'R∘R = {(x,z) | มี y: (x,y),(y,z) ∈ R}: (a,b)+(b,c)→(a,c); (a,b)+(b,a)→(a,a); (b,c)+(c,f)→(b,f); (b,a)+(a,b)→(b,b) → {(a,c),(a,a),(b,f),(b,b)} = <b>4 คู่</b>. (เฉลยในไฟล์เขียน 5 โดยใส่ (b,c) เพิ่ม ซึ่งไม่มี y ที่ (b,y),(y,c) ∈ R — น่าจะเป็นความผิดพลาดของเฉลย; เว็บนี้รับทั้ง 4 และ 5)' },
    { label: '(c) |((R⁻¹)⁻¹) ∘ R⁻¹| = ', kind: 'number', answer: '3', why: '(R⁻¹)⁻¹ = R ดังนั้นคือ R ∘ R⁻¹ = {(x,z) | (x,y) ∈ R และ (z,y) ∈ R} = คู่ที่ "ชี้ไปที่ y เดียวกัน": (a,a),(b,b),(c,c) → 3' },
    { label: '(d) |2<sup>R</sup>| = ', kind: 'number', answer: '16', why: '2<sup>|R|</sup> = 2⁴ = 16 (นับ subset ของเซตที่มี 4 คู่)' },
    { label: '(e) Can R be viewed as a function A → A, A = {a,…,f}? (yes/no)', kind: 'text', answer: ['no', 'No', 'NO'], why: 'ฟังก์ชันต้องให้ต้นทางแต่ละตัวมีปลายทางเดียว แต่ b มี 2 ปลายทาง: (b,c) และ (b,a) → ไม่ใช่ (อีกเหตุผล: a, d, e, f ไม่มีคู่เลย ก็ไม่ครบ domain)' },
  ],
  solution: { steps: ['<b>R⁻¹</b>: สลับตำแหน่งในทุกคู่ — ขนาดไม่เปลี่ยน', '<b>R ∘ R</b> (textbook §1.3): หา "ทางเดิน 2 ก้าว" x→y→z ในกราฟของ R แล้วบันทึก (x,z). วาดกราฟ a⇄b→c→f ช่วยได้มาก: จาก a: a→b→c, a→b→a; จาก b: b→c→f, b→a→b; จาก c: c→f→? ไม่มี', '<b>R ∘ R⁻¹</b>: เดินไปตาม R แล้วย้อนกลับตาม R: x→y←z. ทุก x ที่มีลูกศรออกย่อมได้ (x,x) — จึงมี (a,a),(b,b),(c,c); ไม่มีคู่อื่นเพราะไม่มี y ตัวไหนถูกชี้จาก 2 ต้นทางต่างกัน', '<b>2<sup>R</sup></b>: R เป็นเซต (ของคู่อันดับ) ธรรมดา → 2⁴', '<b>ฟังก์ชัน</b>: ตรวจ 2 อย่าง (1) ทุก a ∈ A มีคู่ (2) ไม่มีตัวไหนมี 2 คู่ — R ผิดทั้งสองอย่าง'], pitfalls: ['ข้อ (b) อย่านับ (b,c) ที่อยู่ใน R เดิมมาเป็นสมาชิกของ R∘R — ต้องมี "ทางเดิน 2 ก้าว" เท่านั้น', 'ข้อ (c) นิยาม ∘ ของ textbook: Q∘R = {(a,c) | (a,b) ∈ Q, (b,c) ∈ R}'] } },

{ id: '3', marks: 5, topic: 'relation', type: 'tf', text: 'Let R ⊆ (ℕ×ℕ)×(ℕ×ℕ) where ((m,n),(p,q)) ∈ R iff m × q ≥ n × p. <span class="note">(Yes = True, No = False; each = 1, wrong = −1)</span>',
  parts: [
    { text: 'Is R reflexive?', answer: true, why: '((m,n),(m,n)): m·n ≥ n·m จริงเสมอ ✓' },
    { text: 'Is R symmetric?', answer: false, why: '((2,1),(1,1)) ∈ R เพราะ 2·1 ≥ 1·1 แต่ ((1,1),(2,1)): 1·1 ≥ 1·2 เท็จ → ไม่ symmetric' },
    { text: 'Is R transitive?', answer: true, why: 'คิดเป็นเศษส่วน: m·q ≥ n·p ⇔ m/n ≥ p/q (เมื่อ n,q > 0). ≥ บนจำนวนเป็น transitive: ถ้า m/n ≥ p/q และ p/q ≥ r/s แล้ว m/n ≥ r/s' },
    { text: 'Is R a partial order?', answer: false, why: 'partial order ต้อง anti-symmetric แต่ ((1,1),(2,2)) และ ((2,2),(1,1)) อยู่ใน R ทั้งคู่ (1·2 ≥ 1·2) ทั้งที่ (1,1) ≠ (2,2) → ไม่ anti-symmetric' },
    { text: 'Is R a total order?', answer: false, why: 'total order ต้องเป็น partial order ก่อน (แล้วค่อยเพิ่มว่าเทียบได้ทุกคู่) — ไม่ผ่านตั้งแต่ข้อ (d)' },
  ],
  solution: { steps: ['ถอดรหัสนิยามก่อน: m·q ≥ n·p คือ "m/n ≥ p/q" (เทียบเศษส่วน) — เมื่อเห็นแบบนี้ทุกข้อจะง่าย: มันคือ ≥ บนเศษส่วน ที่มีหลายคู่แทนค่าเดียวกัน (1/1 = 2/2)', 'reflexive ✓, transitive ✓ (เหมือน ≥), symmetric ✗ (≥ ไม่ symmetric), anti-symmetric ✗ เพราะ (1,1) กับ (2,2) เป็น "ค่าเท่ากัน" แต่เป็นสมาชิกคนละตัว', 'partial order = reflexive + anti-symmetric + transitive; total order = partial order + เทียบได้ทุกคู่ — ขาด anti-symmetric จึงไม่ใช่ทั้งสอง'], pitfalls: ['ข้อสอบเขียน Yes/No — ในเว็บนี้ Yes = True', 'อย่าตอบ (d) Yes เพราะ "≥ เป็น partial order" — จริงบนจำนวน แต่ที่นี่คู่ (m,n) ต่างกันอาจแทนค่าเดียวกัน'] } },

{ id: '4', marks: 5, topic: 'ฟังก์ชัน', type: 'tf', text: 'Consider Σ = {0, 1} and ℕ. Function f : ({0} ∪ {1}Σ*) → ℕ maps each binary number (no leading zeros) into a natural number (e.g. f(100) = 4).',
  parts: [
    { text: 'f ⊆ Σ* × ℕ', answer: true, why: 'ฟังก์ชันคือ relation คือเซตของคู่ (string, number) — domain {0} ∪ {1}Σ* ⊆ Σ* จึง f ⊆ Σ* × ℕ' },
    { text: 'f is one-to-one', answer: true, why: 'เลขฐานสองไม่มี 0 นำหน้า — string ต่างกันแทนค่าต่างกัน' },
    { text: 'f is onto ℕ', answer: true, why: 'ทุกจำนวนธรรมชาติเขียนเป็นฐานสองได้ (0 → "0", อื่น ๆ ขึ้นต้นด้วย 1)' },
    { text: 'f is a bijection', answer: true, why: 'one-to-one + onto' },
    { text: 'ℕ and Σ* are equinumerous', answer: true, why: 'Σ* นับได้ (เรียงตามความยาวแล้วตามลำดับ) จึงมี bijection กับ ℕ — หรือใช้ Schröder–Bernstein ก็ได้' },
  ],
  solution: { steps: ['ข้อนี้คู่แฝดกับชุด 1 ข้อ 4 แต่<b>ตัด string ที่มี 0 นำหน้าออกจาก domain</b> ({0} ∪ {1}Σ* = "0" หรือขึ้นต้นด้วย 1) → ปัญหา 001 หายไป f จึงเป็น bijection จริง', 'ข้อ (a) ทดสอบความเข้าใจว่า "ฟังก์ชัน = เซตของคู่อันดับ" ตามสไลด์ (relation ชนิดพิเศษ)', 'ข้อ (e) ไม่ได้ถามเรื่อง f — Σ* ของ alphabet จำกัดนับได้เสมอ'], pitfalls: ['อ่าน domain ให้ดี: ชุด 1 domain = ℕ (มองจากตัวเลข → string) ชุดนี้ domain = string ที่ถูกต้อง → ℕ'] } },

{ id: '5', marks: 5, topic: 'regex', type: 'tf', text: 'Indicate whether each of the following is true or false.',
  parts: [
    { text: 'e ∈ L((a ∪ b)*)', answer: true, why: 'star ให้ "ซ้ำ 0 ครั้ง" = e เสมอ' },
    { text: 'L(a*b*) ∪ L(a*b*) = ∅', answer: false, why: 'A ∪ A = A = L(a*b*) ซึ่งมี e, a, b, ab, … ไม่ว่าง' },
    { text: 'L(∅* ∪ a) = {a}', answer: false, why: '∅* = {e} (ซ้ำ 0 ครั้งได้ e แม้ไม่มีอะไรให้ซ้ำ) → L = {e} ∪ {a} = {e, a}' },
    { text: 'for any language L, L* = LL*', answer: false, why: 'L = {a}: e ∈ L* แต่ e ∉ LL* (ทุก string ใน LL* ขึ้นต้นด้วย a)' },
    { text: 'for any language L, L* = (L*)*', answer: true, why: 'star ซ้อน star = star เดิม' },
  ],
  solution: { steps: ['หัวใจของข้อนี้: <b>∅* = {e}</b> และ <b>e ∈ L* เสมอ</b>', '(c) เป็นข้อหลอกยอดนิยม: ∅* ไม่ใช่ ∅', '(d) ทดสอบด้วย e เสมอ; (e) จำเป็นสูตร'], pitfalls: ['ชุด 1 ข้อ 10(e) ถามเหมือนกันแต่เฉลยในไฟล์ต่างกัน — คำตอบที่ถูกคือ True'] } },

{ id: '6', marks: 10, topic: 'countability', type: 'proof', text: 'Prove that A − B is uncountable if A is uncountable and B is countable.',
  solution: { steps: ['พิสูจน์โดยข้อขัดแย้ง: <b>สมมติ A − B นับได้</b>', 'ใช้ fact: union ของเซตนับได้สองเซตนับได้ (สลับ dovetail เหมือนชุด 1 ข้อ 7) → (A − B) ∪ B นับได้', 'แต่ (A − B) ∪ B ⊇ A (ทุก x ∈ A ถ้าอยู่ใน B ก็อยู่ขวา ถ้าไม่ก็อยู่ซ้าย) และ subset ของเซตนับได้ย่อมนับได้ → A นับได้', 'ขัดกับที่ให้ว่า A นับไม่ได้ ∎', 'ภาพ: เอา "ของนับได้" ออกจาก "ของนับไม่ได้" มันยังเหลือมหาศาล — เช่น ℝ − ℚ ยังนับไม่ได้'], pitfalls: ['ต้องอ้าง 2 fact ให้ชัด: (1) countable ∪ countable = countable (2) subset ของ countable = countable', 'อย่าเขียนว่า "A − B ใหญ่กว่า B" ลอย ๆ — ไม่ใช่การพิสูจน์'], write: 'Suppose, for contradiction, that A − B is countable. Since B is countable, (A − B) ∪ B is countable (union of two countable sets). But A ⊆ (A − B) ∪ B, and a subset of a countable set is countable, so A is countable — contradicting that A is uncountable. Hence A − B is uncountable. ∎' } },

{ id: '7', marks: 10, topic: 'countability', type: 'proof', text: 'Let R be the set of all regular languages over some alphabet Σ. Prove: (a) R is countably infinite. (b) There exists some language L ∈ 2<sup>Σ*</sup> such that L ∉ R.',
  solution: { steps: ['<b>(a) อนันต์</b>: {a}, {aa}, {aaa}, … ต่างกันหมดและทุกตัว regular → R อนันต์', '<b>(a) นับได้</b>: ทุก regular language มี regular expression α อย่างน้อยหนึ่งตัว และ α เป็น string บน alphabet Σ′ = Σ ∪ {∅, ∪, *, (, )} (จำกัด) → เซตของ regex ⊆ Σ′* นับได้ → R = {L(α)} เป็นภาพของเซตนับได้ (ฟังก์ชัน L(·) onto R — ชุด 3 ข้อ 4b) → นับได้', '<b>(b)</b> วิธี 1 (นับ): 2<sup>Σ*</sup> นับไม่ได้ (diagonalization) แต่ R นับได้ → R ⊊ 2<sup>Σ*</sup> จึงมี L ∉ R', '<b>(b)</b> วิธี 2 (ยกตัวอย่าง — ตามเฉลย): L = {aᵖ | p prime} ไม่ regular (พิสูจน์ด้วย pumping) → L ∉ R', 'ข้อ 20 ชุด 4 คือข้อเดียวกันในเวอร์ชันเปิด'], pitfalls: ['(a) ต้องพูดทั้ง "อนันต์" และ "นับได้" — คำว่า countably infinite มี 2 ส่วน', 'อย่าอ้างว่า "regex มีจำนวนเท่า Σ*" — regex เป็น subset ของ Σ′* ก็พอสำหรับนับได้'], write: '(a) R is infinite since {aⁿ} ∈ R for every n. Every L ∈ R equals L(α) for some regular expression α, and α is a string over the finite alphabet Σ′ = Σ ∪ {∅, ∪, *, (, )}; Σ′* is countable, so the set of regular expressions is countable, hence so is R.<br>(b) L = {aᵖ | p prime} is not regular (Pumping Theorem), so L ∈ 2<sup>Σ*</sup> but L ∉ R. (Alternatively: 2<sup>Σ*</sup> is uncountable while R is countable.)' } },

{ id: '8', marks: 10, topic: 'regular language', type: 'proof', text: 'Let L ⊆ Σ* be a language over alphabet Σ. Prove that if L is a finite set, then L is a regular language.',
  solution: { steps: ['L จำกัด → เขียนสมาชิกได้หมด: L = {ω₁, ω₂, …, ω<sub>n</sub>}', 'string แต่ละตัว ω = σ₁σ₂…σ<sub>k</sub> เป็น regular expression ในตัวเอง (concat ของสัญลักษณ์เดี่ยว) และ e = ∅* ก็เป็น regex', 'ดังนั้น α = ω₁ ∪ ω₂ ∪ … ∪ ω<sub>n</sub> เป็น regex และ L(α) = L → L regular', 'กรณี L = ∅: α = ∅ ก็ regular ∎', 'มุม automaton: วาด DFA แบบ "ต้นไม้" ที่มี path ละ string (เหมือนชุด 1 ข้อ 13a)'], pitfalls: ['อย่าลืมกรณี n = 0 (L = ∅) และ e ∈ L', 'บทกลับ<b>ไม่จริง</b>: regular ไม่จำเป็นต้องจำกัด (a* อนันต์) — ชุด 3 ข้อ 6 ใช้ contrapositive ของข้อนี้'], write: 'Let L = {ω₁, …, ω<sub>n</sub>} be finite. Each ω<sub>i</sub> is a regular expression (a concatenation of symbols, or ∅* for e), hence α = ω₁ ∪ ⋯ ∪ ω<sub>n</sub> is a regular expression with L(α) = L (and α = ∅ if L = ∅). Therefore L is regular. ∎' } },

{ id: '9a', marks: 2.5, topic: 'DFA', type: 'short', text: '9(a) The state diagram of a FA M = (K, Σ, δ, q0, F) is given (same transitions as "No three consecutive b\'s" but <b>F = {q0}</b>). Formally specify each component.',
  parts: [
    { label: 'K = ', kind: 'set', answer: '{q0,q1,q2,q3}', why: '4 วง' },
    { label: 'Σ = ', kind: 'set', answer: '{a,b}', why: '' },
    { label: 'F = ', kind: 'set', answer: '{q0}', why: 'วงคู่มีแค่ q0 — ต่างจากชุด 1 ข้อ 11' },
    { label: 'δ = ', kind: 'set', answer: ['{((q0,a),q0),((q0,b),q1),((q1,a),q0),((q1,b),q2),((q2,a),q0),((q2,b),q3),((q3,a),q3),((q3,b),q3)}', '{(q0,a,q0),(q0,b,q1),(q1,a,q0),(q1,b,q2),(q2,a,q0),(q2,b,q3),(q3,a,q3),(q3,b,q3)}'], why: '8 คู่ครบ |K|×|Σ|' },
  ],
  link: { module: 'editor', automaton: P2Q9, sample: 'aabb' },
  solution: { steps: ['อ่านรูปทีละส่วนเหมือนชุด 1 ข้อ 11 — แต่<b>ดูวงคู่ให้ดี</b> ชุดนี้ final มีแค่ q0', 'ภาษาของ M นี้: string ที่ไม่มี bbb <i>และ</i> ลงท้ายด้วย a (หรือเป็น e) — เพราะกลับมา q0 ได้ด้วย a เท่านั้น'], pitfalls: ['เฉลยในไฟล์พิมพ์ (q0, q) ↦ q0 — ที่ถูกคือ (q0, a) ↦ q0'] } },

{ id: '9b', marks: 2.5, topic: 'DFA', type: 'trace', text: '9(b) Complete the following computations of the machine.', automaton: P2Q9, inputs: ['aabb', 'bbbb'],
  link: { module: 'editor', automaton: P2Q9, sample: 'aabb' },
  solution: { steps: ['<b>aabb</b>: (q0,aabb) ⊢ (q0,abb) ⊢ (q0,bb) ⊢ (q1,b) ⊢ (q2,e) — q2 ∉ F → reject (ลงท้ายด้วย b)', '<b>bbbb</b>: (q0,bbbb) ⊢ (q1,bbb) ⊢ (q2,bb) ⊢ (q3,b) ⊢ (q3,e) — reject (เจอ bbb)'], pitfalls: ['ข้อสอบให้แค่ configuration แรก — ต้องเขียนต่อจนถึง (q, e) และควรระบุ accept/reject'] } },

{ id: '10', marks: 10, topic: 'DFA', type: 'draw', text: 'Draw the state-transition diagram of a FA accepting each of the following languages (over Σ = {a, b}).', alphabet: ['a', 'b'],
  parts: [
    { label: '(a) {ab}{a}*', answer: D_ABA_STAR },
    { label: '(b) {a}{a,b}*bb', answer: D_A_BB },
    { label: '(c) {ω ∈ {a,b}* | if ω contains a then it does not contain b}', answer: D_A_OR_B },
  ],
  solution: { steps: ['<b>(a) {ab}{a}*</b> = ab ตามด้วย a กี่ตัวก็ได้ (ab, aba, abaa, …): q0 ─a→ q1 ─b→ q2 (final) แล้ว q2 ─a→ q2 วนตัวเอง. ตัวอักษรอื่นทุกกรณี (q0 อ่าน b, q1 อ่าน a, q2 อ่าน b) → trap', '<b>(b) {a}{a,b}*bb</b> = ขึ้นต้น a, ลงท้าย bb: ต้องจำ 2 อย่าง "ตัวแรกเป็น a หรือยัง" และ "ลงท้ายด้วย b กี่ตัวติดกัน (0/1/≥2)": q0 ─a→ q1 (ยังไม่มี b ท้าย) ─b→ q2 (b 1 ตัว) ─b→ q3 (bb, final) ─b→ q3; อ่าน a จาก q1/q2/q3 → กลับ q1 (ล้าง b ท้าย); q0 ─b→ trap. เป็นข้อที่วาดเป็น NFA ง่ายกว่า (q0 ─a→ q1 วน a,b แล้ว ─b→ ─b→ final) — ข้อสอบยอมรับ NFA', '<b>(c) มี a แล้วห้ามมี b</b> = a ล้วน หรือ b ล้วน (รวม e) = a* ∪ b*: q0 (final) ─a→ qa (final, วน a) และ ─b→ qb (final, วน b); ผสมเมื่อไร (qa อ่าน b, qb อ่าน a) → trap. ตรรกะ "ถ้า…แล้ว…" เป็นจริงเมื่อไม่มี a ด้วย จึงรวม b* ทั้งหมด'], pitfalls: ['(b) ลืมว่า a หลัง bb ต้องกลับไปสถานะ "ยังไม่มี b ท้าย" ไม่ใช่ trap (abba… ยังอาจลงท้าย bb ได้ทีหลัง)', '(c) start ต้องเป็น final (e ไม่มี a → เงื่อนไขจริง)', 'ทุกข้อ: string ว่างอยู่ในภาษาไหม? (a) ไม่ (b) ไม่ (c) ใช่'] } },

{ id: '11', marks: 10, topic: 'pumping', type: 'proof', text: 'Is {a,b}* − {aⁿb<sup>2n</sup> | n ∈ ℕ} a regular language? Give a proof for your answer.',
  link: { module: 'pumping' },
  solution: { steps: ['<b>คำตอบ: ไม่ regular</b>', 'ให้ L₀ = {aⁿb<sup>2n</sup>}. ข้อสอบถามเรื่อง complement ของ L₀ = Σ* − L₀', 'ใช้ closure: regular ปิดภายใต้ complement (module 5). ถ้า Σ* − L₀ regular แล้ว complement ของมัน = L₀ ก็ regular', 'แต่ L₀ ไม่ regular ด้วย Pumping: เลือก ω = aⁿb<sup>2n</sup>, |xy| ≤ n → y = aᵏ (k ≥ 1), i = 0 ให้ a<sup>n−k</sup>b<sup>2n</sup> ซึ่งจำนวน b ≠ 2×จำนวน a → ∉ L₀', 'ขัดแย้ง → Σ* − L₀ ไม่ regular ∎'], pitfalls: ['ห้ามใช้ Pumping กับ Σ* − L₀ ตรง ๆ — มันซับซ้อนมาก; ใช้ closure โยนกลับไปหา L₀ ที่ง่ายกว่า', 'ต้องเขียนเหตุผลว่าทำไม y เป็น a ล้วน (|xy| ≤ n)'], write: 'Let L₀ = {aⁿb<sup>2n</sup> | n ∈ ℕ} and L = Σ* − L₀. If L were regular then, since regular languages are closed under complement, L₀ = Σ* − L would be regular. But L₀ is not regular: suppose it is, with pumping constant n; take ω = aⁿb<sup>2n</sup> ∈ L₀, ω = xyz with |xy| ≤ n, y ≠ e, so y = aᵏ, k ≥ 1; then xy⁰z = a<sup>n−k</sup>b<sup>2n</sup> ∉ L₀ — contradiction. Hence L is not regular. ∎' } },

{ id: '12', marks: 10, topic: 'pumping', type: 'proof', text: 'Is {a<sup>p−2</sup> | p is a prime number} a regular language? Give a proof for your answer.',
  link: { module: 'pumping' },
  solution: { steps: ['<b>คำตอบ: ไม่ regular</b>', 'ให้ L = {a<sup>p−2</sup> | p prime} = {e, a, aaa, a⁵, a⁹, …} (p = 2,3,5,7,11,…)', 'ใช้ closure ภายใต้ concatenation: {aa} regular (จำกัด) ดังนั้นถ้า L regular แล้ว L·{aa} = {a<sup>p−2</sup>aa} = {aᵖ | p prime} ก็ regular', 'แต่ {aᵖ | p prime} ไม่ regular (Example 2.4.3 / เกมใน module 6: เลือก p ≥ n prime, y = aᵏ, ปั๊ม i = p+1 ได้ a<sup>p + pk</sup> = a<sup>p(1+k)</sup> ซึ่งไม่ prime)', 'ขัดแย้ง → L ไม่ regular ∎'], pitfalls: ['ทิศทาง closure: ต้อง "จาก L สร้างภาษาที่รู้ว่าไม่ regular" ไม่ใช่กลับกัน', 'อย่าลืมว่า i ที่เลือกในการปั๊ม prime ต้องทำให้ความยาวแยกตัวประกอบได้: |xyⁱz| = p + (i−1)k, เลือก i = p+1 → p(1+k)'], write: 'Let L = {a<sup>p−2</sup> | p prime}. Suppose L is regular. Since {aa} is regular and regular languages are closed under concatenation, L{aa} = {aᵖ | p prime} is regular. But {aᵖ | p prime} is not regular (Pumping Theorem: take p ≥ n prime, ω = aᵖ = xyz with y = aᵏ, k ≥ 1; then |xy<sup>p+1</sup>z| = p + pk = p(k+1) is not prime). Contradiction, so L is not regular. ∎' } },
] });
})();

(() => {
const NFA_X = FA.EXAM_AUTOMATA.NFA_X;
const D_EMPTYSTR = { name: '{e}', alphabet: ['a', 'b'], start: 'q0', finals: ['q0'], rows: { q0: { a: 'd', b: 'd' }, d: { a: 'd', b: 'd' } }, notes: { q0: '<b>q0</b> = ยังไม่อ่านอะไร = string ว่าง e ซึ่งเป็นสมาชิกเดียวของภาษา → start เป็น <b>final</b>', d: '<b>d (trap)</b> = อ่านอะไรมาแล้วสัก 1 ตัว → ไม่ใช่ e อีกต่อไป — วาดแบบ NFA มีแค่ q0 ตัวเดียวก็ถูก' }, pos: { q0: [120, 200], d: [320, 200] } };
const D_EMPTY = { name: '{}', alphabet: ['a', 'b'], start: 'q0', finals: [], rows: { q0: { a: 'q0', b: 'q0' } }, notes: { q0: '<b>q0</b> = start ที่<b>ไม่ใช่ final</b> วนตัวเองด้วย a,b — ไม่มี final เลย จึงไม่รับ string ใด ๆ แม้แต่ e (จะไม่วาดเส้นเลยก็ได้)' }, pos: { q0: [200, 200] } };
const D_DIV4 = { name: 'binary ÷ 4', alphabet: ['0', '1'], start: 'q0', finals: ['t'], rows: { q0: { 0: 't', 1: 'o' }, o: { 0: 'p', 1: 'o' }, p: { 0: 't', 1: 'o' }, t: { 0: 't', 1: 'o' } }, notes: { q0: '<b>q0</b> = ยังไม่อ่าน — หาร 4 ลงตัว ⇔ เป็น "0" เดี่ยว หรือ<b>ลงท้ายด้วย 00</b> จึงต้องจำว่า "ท้ายสุดเป็นอะไร"', o: '<b>o</b> = บิตล่าสุดเป็น <b>1</b> — ยังไม่ลงตัวแน่ ๆ; อ่าน 1 อีกก็ยังอยู่ที่นี่', p: '<b>p</b> = ลงท้าย "10" (0 หนึ่งตัวหลัง 1) — เหลืออีก 0 เดียวจะลงตัว; อ่าน 1 กลับไป o', t: '<b>t</b> = ลงท้าย "00" หรือเป็น "0" เดี่ยว → <b>final</b>; อ่าน 0 ต่อยังลงท้าย 00 (วน), อ่าน 1 ไป o. q0 ─0→ t ทำให้ "0" ตัวเดียวถูกรับ' }, pos: { q0: [80, 200], o: [280, 110], p: [280, 290], t: [480, 200] } };

Object.assign(FA.EXAM_AUTOMATA, { D_EMPTYSTR, D_EMPTY, D_DIV4 });
FA.EXAMS.push({ id: 'p3', title: 'ชุดที่ 3', questions: [
{ id: '1abc', marks: 6, topic: 'เซต', type: 'tf', text: '1(a)–(c) Indicate whether each of the following is true or false. <span class="note">(each = 2, wrong = −2)</span>',
  parts: [
    { text: 'If A ⊆ B and B is an infinite set, then A must be also infinite.', answer: false, why: 'subset ของเซตอนันต์เล็กแค่ไหนก็ได้: A = ∅ หรือ A = {1} ⊆ ℕ ก็จำกัด (ทิศกลับกันจริง: superset ของเซตอนันต์ต้องอนันต์)' },
    { text: 'If all members of a set A are also members of a set B, then some member of A is a member of B.', answer: false, why: 'เงื่อนไขคือ A ⊆ B. ถ้า A = ∅ เงื่อนไขจริง (vacuously) แต่ "some member of A" ไม่มีเลย → ข้อสรุปเท็จ' },
    { text: 'The subset relation ⊆ is transitive: if A ⊆ B and B ⊆ C then A ⊆ C.', answer: true, why: 'x ∈ A → x ∈ B → x ∈ C' },
  ],
  solution: { steps: ['(a),(b) ทั้งคู่พังด้วย A = ∅ — เซตว่างเป็น counterexample ประจำของข้อ "for any set"', '(c) ⊆ เป็น reflexive, anti-symmetric, transitive → เป็น partial order บนเซตของเซต (สไลด์ Chapter 1)'], pitfalls: ['"all members … are also members" ฟังดูเหมือน A ไม่ว่าง — แต่ตรรกะ ∀ บนเซตว่างเป็นจริงเสมอ'] } },

{ id: '1de', marks: 4, topic: 'เซต', type: 'short', text: '1(d)–(e) Counting partitions.',
  parts: [
    { label: '(d) How many partitions does A = {a} have?', kind: 'number', answer: '1', why: 'Π = {A} = {{a}} เท่านั้น (partition ต้องไม่มีเซตว่างเป็นสมาชิก และรวมกันได้ A)' },
    { label: '(e) How many partitions does A = {a, b, c} have?', kind: 'number', answer: '5', why: '{{a,b,c}}, {{a},{b,c}}, {{b},{a,c}}, {{c},{a,b}}, {{a},{b},{c}} — 5 แบบ (Bell number B₃ = 5)' },
  ],
  solution: { steps: ['partition ของ A = เซตของ subset ไม่ว่าง ที่ไม่ซ้อนกัน และรวมกันได้ A ทั้งหมด (สไลด์ Chapter 1)', 'นับเป็นระบบตาม "จำนวนกลุ่ม": 1 กลุ่ม (1 แบบ), 2 กลุ่ม (เลือกตัวที่อยู่เดี่ยว 3 แบบ), 3 กลุ่ม (1 แบบ) = 5', 'ชุด 4 ข้อ 6.1 ถาม {a,b} → 2 แบบ, ข้อ 5.2 ถาม "ขนาดสูงสุดของ partition" = |A|'], pitfalls: ['อย่านับ {∅, {a,b,c}} — partition ห้ามมี ∅', 'ข้อสอบจริงเป็นปรนัยที่ 5 ไม่มีในตัวเลือก ("other number?") — ต้องกล้าตอบ 5'] } },

{ id: '2', marks: 10, topic: 'relation', type: 'short', text: 'Let R = {(a,b), (b,c), (a,d), (b,b)} be a binary relation over A = {a, b, c, d}.',
  parts: [
    { label: '(a) |R ∘ R| = ', kind: 'number', answer: '3', why: 'ทางเดิน 2 ก้าว: (a,b)+(b,c)→(a,c); (a,b)+(b,b)→(a,b); (b,b)+(b,c)→(b,c); (b,b)+(b,b)→(b,b) → {(a,c),(a,b),(b,c),(b,b)} = 4 คู่. เฉลยในไฟล์ให้ 3 (ลืม (b,b)) — เว็บนี้รับ 3 และ 4' },
    { label: '(b) Diagonal set D = ', kind: 'set', answer: ['{a,c,d}', '{(a,a),(c,c),(d,d)}'], why: 'D = {x | (x,x) ∉ R}: (a,a)? ไม่มี ✓, (b,b) มี ✗, (c,c) ไม่มี ✓, (d,d) ไม่มี ✓ → D = {a, c, d} (เฉลยเขียนเป็นคู่ {(a,a),(c,c),(d,d)} ก็รับ)' },
    { label: '(c) Can R be viewed as a function A → A? (yes/no)', kind: 'text', answer: ['no', 'No', 'NO'], why: 'a มี 2 ปลายทาง (a,b),(a,d) และ c, d ไม่มีคู่เลย → ไม่ใช่ฟังก์ชัน' },
    { label: '(d) Smallest reflexive relation ⊇ R = ', kind: 'set', answer: '{(a,b),(b,c),(a,d),(b,b),(a,a),(c,c),(d,d)}', why: 'เติม (x,x) ที่ขาด: (a,a),(c,c),(d,d) — (b,b) มีแล้ว' },
    { label: '(e) Smallest reflexive and transitive relation ⊇ R = ', kind: 'set', answer: '{(a,b),(b,c),(a,d),(b,b),(a,a),(c,c),(d,d),(a,c)}', why: 'จาก (d) เติมที่ transitivity บังคับ: (a,b)+(b,c) → (a,c). รอบต่อไป: (a,c)+(c,c) มีแล้ว, (a,d)+(d,d) มีแล้ว … ไม่มีใหม่ → 8 คู่' },
  ],
  solution: { steps: ['วาดกราฟ: a→b, a→d, b→c, b⟲ — ทุกข้อจะอ่านจากรูปได้', '(a) R∘R = ทางเดิน 2 ก้าว (รวม self-loop ที่ b ด้วย: b→b→c และ b→b→b)', '(b) diagonal set = จุดที่ "ไม่มี self-loop"', '(d) reflexive closure = เติม self-loop ทุกจุด', '(e) reflexive-transitive closure = (d) + ทางลัดทุกเส้นทาง: a ไปถึง c ผ่าน b จึงเติม (a,c); a→d ถึงแค่ d; ไม่มีเส้นทางอื่น'], pitfalls: ['(a) อย่าลืมว่า (b,b) ประกอบกับตัวเองและกับ (b,c) ได้', '(b) เฉลยในไฟล์ให้เป็นเซตของคู่ แต่ตามนิยาม D เป็นเซตของสมาชิก x'] } },

{ id: '3', marks: 10, topic: 'relation', type: 'tf', text: 'Let A be the set of all persons in an extended family. <span class="note">(Yes = True, No = False; each ≈ 1.43, wrong = same negative)</span>',
  parts: [
    { text: '(a) "mother of" — symmetric?', answer: false, why: 'ถ้า x เป็นแม่ของ y แล้ว y ไม่ใช่แม่ของ x' },
    { text: '(a) "mother of" — anti-symmetric?', answer: true, why: 'ไม่มีคู่ x ≠ y ที่เป็นแม่ของกันและกัน → anti-symmetric โดยไม่มีกรณีละเมิด' },
    { text: '(b) "is a sibling of" — symmetric?', answer: true, why: 'พี่น้องกันเป็นสองทางเสมอ' },
    { text: '(b) "is a sibling of" — anti-symmetric?', answer: false, why: 'มี (x,y) และ (y,x) ที่ x ≠ y → ละเมิด anti-symmetry' },
    { text: '(c) "is an ancestor of" — symmetric?', answer: false, why: 'บรรพบุรุษเป็นทางเดียว' },
    { text: '(c) "is an ancestor of" — transitive?', answer: true, why: 'บรรพบุรุษของบรรพบุรุษ = บรรพบุรุษ' },
    { text: '(d) Can "is an ancestor of" be a partial order?', answer: false, why: 'ไม่ reflexive (ไม่มีใครเป็นบรรพบุรุษของตัวเอง) — partial order ต้อง reflexive' },
  ],
  solution: { steps: ['แปลนิยามเป็นภาษาคน: symmetric = "ถ้า x~y แล้ว y~x", anti-symmetric = "ถ้า x~y และ y~x แล้ว x = y" (ห้ามมีคู่สองทางระหว่างคนต่างกัน), transitive = "ต่อกันได้"', 'สังเกต: relation ที่ไม่มีคู่สองทางเลย (แม่, บรรพบุรุษ) เป็น anti-symmetric อัตโนมัติ', '(d) "ancestor" เป็น strict order (irreflexive + transitive) ไม่ใช่ partial order — ถ้าจะเป็น partial order ต้องเติม "หรือเป็นคนเดียวกัน" (reflexive closure)'], pitfalls: ['symmetric กับ anti-symmetric ไม่ใช่ตรงข้ามกัน — relation ว่าง / relation ที่มีแต่ (x,x) เป็นทั้งสองอย่าง', 'ข้อสอบมี 7 ช่องแต่ 10 คะแนน (แต่ละคำถาม 2 คะแนนตามหัวข้อ; เว็บหารเท่า ๆ กัน)'] } },

{ id: '4', marks: 10, topic: 'ฟังก์ชัน', type: 'tf', text: 'Let R be the set of all regular languages over Σ and E the set of all regular expressions over Σ. Consider L : E → R mapping each α ∈ E to the language L(α). <span class="note">(prove each answer — see solution)</span>',
  parts: [
    { text: '(a) L is one-to-one.', answer: false, why: 'regex ต่างกันให้ภาษาเดียวกันได้: L(a*) = L((a*)*) แต่ a* ≠ (a*)* ในฐานะ string' },
    { text: '(b) L is onto R.', answer: true, why: 'นิยามของ regular language คือ "มี regex α ที่ L(α) = L" — ทุก L ∈ R จึงมีต้นทาง' },
    { text: '(c) L is a bijection.', answer: false, why: 'ไม่ one-to-one' },
  ],
  solution: { steps: ['ต้อง "prove" ทุกข้อ: (a) ยก counterexample 1 คู่ (เช่น a* กับ (a*)*, หรือ a∪b กับ b∪a) (b) อ้างนิยาม R (c) อ้าง (a)', 'ข้อนี้ = ชุด 4 ข้อ 10 (ที่นั่น co-domain เป็น 2<sup>Σ*</sup> จึง<b>ไม่ onto</b> — ต่างกันที่ co-domain!)', 'ความหมายลึก: มี regex นับได้ (string) แต่ภาษาทั้งหมดนับไม่ได้ → L(·) onto R แต่ไม่ onto 2<sup>Σ*</sup>'], pitfalls: ['อ่าน co-domain ให้ดีทุกครั้ง: onto R (จริง) vs onto 2<sup>Σ*</sup> (เท็จ)'] } },

{ id: '5', marks: 15, topic: 'regex', type: 'tf', text: 'Indicate whether each of the following is true or false. <span class="note">(each = 3, wrong = −3)</span>',
  parts: [
    { text: 'e ∈ L(∅)', answer: false, why: 'L(∅) = {} ไม่มีอะไรเลย แม้แต่ e' },
    { text: 'e ∈ L(∅*)', answer: true, why: 'L(∅*) = {}* = {e} (ซ้ำ 0 ครั้ง)' },
    { text: 'L((∅ ∪ a)*) = L(a*)', answer: true, why: '∅ ∪ {a} = {a} → ({a})* = L(a*)' },
    { text: 'for any language L, L* = LL⁺', answer: false, why: 'LL⁺ = LLL* ทุก string ยาวอย่างน้อย 2 ชิ้นจาก L. ถ้า L = {a}: e ∈ L* แต่ e ∉ LL⁺ (เท่ากันก็ต่อเมื่อ e ∈ L)' },
    { text: 'for any language L over Σ, L* ⊆ Σ*', answer: true, why: 'L* สร้างจากสัญลักษณ์ใน Σ ทั้งหมด → เป็น subset ของ Σ* (เซตของทุก string)' },
  ],
  solution: { steps: ['สามกฎที่ต้องท่อง: <b>L(∅) = {}</b>, <b>∅* = {e}</b>, <b>∅ ∪ X = X</b> (∅ เป็น identity ของ ∪) และ <b>∅X = ∅</b> (∅ ดูดกลืน concat — ชุด 4 ข้อ 12)', '(d) ทดสอบด้วย e ทุกครั้งที่เห็นสูตร L* = อะไรสักอย่างที่มี L นำหน้า', 'ข้อละ 3 คะแนน ติดลบ 3 — ถ้าไม่มั่นใจจริง ๆ ให้เว้น'], pitfalls: ['สับสน L(∅) (ภาษาว่าง) กับ L(∅*) (ภาษาที่มี e ตัวเดียว)'] } },

{ id: '6', marks: 10, topic: 'regular language', type: 'proof', text: 'Let L ⊆ Σ* be a language over alphabet Σ. Prove that if L is not a regular language then L is an infinite set.',
  solution: { steps: ['ใช้ <b>contrapositive</b>: "ถ้า L จำกัด แล้ว L regular" (ชุด 2 ข้อ 8) มีความหมายเท่ากับ "ถ้า L ไม่ regular แล้ว L ไม่จำกัด (= อนันต์)"', 'พิสูจน์ contrapositive: L จำกัด = {ω₁,…,ω<sub>n</sub>} → regex ω₁ ∪ … ∪ ω<sub>n</sub> → regular ∎', 'ภาพ: ภาษาไม่ regular ทุกตัว (aⁿbⁿ, prime, …) อนันต์หมด — เพราะจำกัดเมื่อไรก็วาด DFA ต้นไม้ได้'], pitfalls: ['อย่าพิสูจน์ "regular ⇒ อนันต์" หรือ "อนันต์ ⇒ ไม่ regular" — ทั้งสองเท็จ (∅ regular จำกัด, a* regular อนันต์)', 'ต้องเขียนคำว่า contrapositive/equivalently ให้ผู้ตรวจเห็นว่ารู้ตรรกะ'], write: 'We prove the contrapositive: if L is finite then L is regular. Let L = {ω₁, …, ω<sub>n</sub>}; then α = ω₁ ∪ ⋯ ∪ ω<sub>n</sub> (or ∅ if n = 0) is a regular expression with L(α) = L, so L is regular. Hence, if L is not regular, L cannot be finite, i.e. L is infinite. ∎' } },

{ id: '7', marks: 10, topic: 'NFA', type: 'short', text: 'The state diagram of a NFA M = (K, Σ, Δ, q0, F) is given (load it with the button below). (a) Formally specify each component. (b) For ω = ab, check whether ω ∈ L(M) by examining all computations from (q0, ω).',
  parts: [
    { label: 'K = ', kind: 'set', answer: '{q0,q1,q2,q3,q4}', why: '' },
    { label: 'Σ = ', kind: 'set', answer: '{a,b}', why: 'e ไม่ใช่สมาชิกของ Σ' },
    { label: 'F = ', kind: 'set', answer: '{q3,q4}', why: 'วงคู่ 2 ตัว' },
    { label: 'Δ = (เขียนเป็น triple (q,σ,q′))', kind: 'set', answer: '{(q0,a,q0),(q0,b,q0),(q0,e,q1),(q0,b,q2),(q1,b,q4),(q1,b,q2),(q2,a,q3),(q3,e,q4),(q4,a,q3)}', why: 'NFA ใช้ relation Δ ⊆ K × (Σ∪{e}) × K — 9 triple รวม e-transition 2 เส้น' },
    { label: '(b) ab ∈ L(M)? (yes/no)', kind: 'text', answer: ['yes', 'Yes', 'YES'], why: 'มี computation (q0,ab) ⊢ (q0,b) ⊢ (q1,b) ⊢ (q4,e) จบที่ q4 ∈ F → accept' },
  ],
  link: { module: 'editor', automaton: NFA_X, sample: 'ab' },
  solution: { steps: ['<b>(a)</b> NFA ต่างจาก DFA ตรง Δ เป็น<b>เซตของ triple</b> (ไม่ใช่ฟังก์ชัน) และมี e ได้ — เขียน (q0, e, q1) และ (q3, e, q4) ด้วย', '<b>(b) computation tree</b> ของ (q0, ab) — แตกกิ่งทุกทางเลือก:', '(q0,ab) ⊢ (q0,b) [อ่าน a วนที่ q0] และ ⊢ (q1,ab) [e ไป q1]', '(q1,ab): q1 ไม่มีเส้น a → <b>hang</b> (กิ่งตาย)', '(q0,b) ⊢ (q0,e) [b วน], ⊢ (q2,e) [b ไป q2], ⊢ (q1,b) [e ไป q1]', '(q0,e): q0 ∉ F ✗ · (q2,e): q2 ∉ F ✗ · (q1,b) ⊢ (q2,e) ✗ และ ⊢ (q4,e): q4 ∈ F → <b>accept!</b>', 'สรุป: มีอย่างน้อย 1 กิ่งจบที่ final พร้อม input หมด → ab ∈ L(M). กด "ไปเล่นจริง" แล้วเลือกมุมมอง computation tree ใน module 1'], pitfalls: ['NFA accept ถ้า "มีสักกิ่ง" ถึง final — กิ่งที่ hang หรือจบที่ non-final ไม่ทำให้ reject', 'e-transition ไม่กิน input: (q0,ab) ⊢ (q1,ab) ตัว input ยังเท่าเดิม', 'ต้องไล่ให้ครบทุกกิ่งจึงจะสรุปว่า reject ได้ (แต่ accept สรุปได้ทันทีที่เจอกิ่งสำเร็จ)'] } },

{ id: '8ab', marks: 10, topic: 'DFA', type: 'draw', text: '8(a)–(b) Draw the state-transition diagram of a FA accepting each language (over Σ = {a, b}).', alphabet: ['a', 'b'],
  parts: [
    { label: '(a) {e}', answer: D_EMPTYSTR },
    { label: '(b) {} (the empty language)', answer: D_EMPTY },
  ],
  solution: { steps: ['<b>(a) {e}</b> — รับเฉพาะ string ว่าง: start เป็น final แล้วอ่านอะไรก็ตามต้อง "ตกออก" → q0 (final) ─a,b→ trap (ไม่ final, วนตัวเอง). ถ้าวาดเป็น NFA ก็แค่ q0 final ตัวเดียวไม่มีเส้น', '<b>(b) {}</b> — ไม่รับอะไรเลยแม้แต่ e: state เดียว ไม่ใช่ final วนตัวเองด้วย a,b (หรือไม่มีเส้นเลย). สำคัญ: start ต้อง<b>ไม่</b> final', 'สองข้อนี้คือ base case ของนิยาม regular language: L(∅*) = {e}, L(∅) = {}'], pitfalls: ['(a) ลืมทำให้ q0 เป็น final → ได้ {} แทน', '(b) เผลอทำ start เป็น final → ได้ {e} แทน — สลับกันคือคำตอบของอีกข้อพอดี'] } },

{ id: '8c', marks: 5, topic: 'DFA', type: 'draw', text: '8(c) Draw a FA accepting {ω ∈ {0,1}* | the decimal value of ω is divisible by 4} — the value of b<sub>n</sub>…b<sub>0</sub> is Σ b<sub>i</sub>2<sup>i</sup>. <span class="note">(ตามเฉลย: e ไม่อยู่ในภาษา)</span>', alphabet: ['0', '1'], answer: D_DIV4,
  solution: { steps: ['<b>สังเกตทางคณิต</b>: เลขฐานสองหารด้วย 4 ลงตัว ⇔ สองบิตท้ายเป็น 00 (เพราะ 4 = 2², บิตอื่นเป็นพหุคูณของ 4 หมด) หรือเป็น "0" ตัวเดียว (ค่า 0)', 'เครื่องต้องจำ "ท้ายสุดเป็นอะไร": q0 = ยังไม่อ่าน · o = บิตล่าสุดเป็น 1 · p = ล่าสุด 0 แต่ก่อนหน้า 1 (ลงท้าย 10) · t = ลงท้าย 00 หรือเป็น "0" เดี่ยว (final)', 'เส้น: q0 ─0→ t, q0 ─1→ o · o ─1→ o, o ─0→ p · p ─0→ t, p ─1→ o · t ─0→ t, t ─1→ o', 'ตรวจ: 100 → q0→o→p→t ✓ (4) · 0 → t ✓ · 10 → o→p ✗ (2) · 1000 → o→p→t→t ✓ (8) · 0100 → t→o→p→t ✓', 'เฉลยของอาจารย์ใช้ 5 state และ e-transition (NFA) — ของเรา 4 state DFA ภาษาเดียวกัน (ปุ่มตรวจเทียบภาษา ไม่เทียบรูป)'], pitfalls: ['e อยู่ในภาษาไหม? เฉลยบอกว่าต้อง "เป็น 0 เดี่ยว หรือลงท้าย 00" → ไม่รวม e; ถ้าทำ q0 เป็น final เว็บจะแจ้ง witness e', 'อย่าลืมว่า "0" ตัวเดียว (ยาว 1) ก็หาร 4 ลงตัว — ต้องมีทาง q0 ─0→ final'] } },

{ id: '9', marks: 10, topic: 'NFA→DFA', type: 'nfa2dfa', text: 'Construct a DFA that is equivalent to the NFA of Question 7 (powerset construction). Fill in the closures and the DFA transition table.', automaton: NFA_X,
  parts: [
    { label: 'E(q0) = ', kind: 'set', answer: '{q0,q1}', why: 'q0 ─e→ q1' },
    { label: 'E(q3) = ', kind: 'set', answer: '{q3,q4}', why: 'q3 ─e→ q4' },
    { label: 'δ′({q0,q1}, a) = ', kind: 'set', answer: '{q0,q1}', why: 'a จาก q0 → q0 (q1 ไม่มี a) → E(q0) = {q0,q1}' },
    { label: 'δ′({q0,q1}, b) = ', kind: 'set', answer: '{q0,q1,q2,q4}', why: 'b: q0→{q0,q2}, q1→{q2,q4} → E(q0)∪E(q2)∪E(q4)' },
    { label: 'δ′({q0,q1,q2,q4}, a) = ', kind: 'set', answer: '{q0,q1,q3,q4}', why: 'a: q0→q0, q2→q3, q4→q3 → E(q0)∪E(q3) = {q0,q1,q3,q4}' },
    { label: 'δ′({q0,q1,q2,q4}, b) = ', kind: 'set', answer: '{q0,q1,q2,q4}', why: 'b: q0→{q0,q2}, q1→{q2,q4}, q2/q4 ไม่มี b → เหมือนเดิม' },
    { label: 'δ′({q0,q1,q3,q4}, a) = ', kind: 'set', answer: '{q0,q1,q3,q4}', why: 'a: q0→q0, q4→q3 → E(q0)∪E(q3)' },
    { label: 'δ′({q0,q1,q3,q4}, b) = ', kind: 'set', answer: '{q0,q1,q2,q4}', why: 'b: q0→{q0,q2}, q1→{q2,q4}' },
    { label: 'Final states of the DFA = ', kind: 'set', answer: '{{q0,q1,q2,q4},{q0,q1,q3,q4}}', why: 'superstate ที่มี q3 หรือ q4 (F ของ NFA) อยู่ข้างใน' },
  ],
  link: { module: 'powerset', automaton: NFA_X },
  solution: { steps: ['<b>ขั้น 1 ตาราง E(·)</b>: E(q0)={q0,q1}, E(q1)={q1}, E(q2)={q2}, E(q3)={q3,q4}, E(q4)={q4}', '<b>ขั้น 2 start</b> = E(q0) = {q0,q1}', '<b>ขั้น 3 worklist</b>: จากแต่ละ superstate อ่าน a และ b → ได้ superstate ใหม่ก็เพิ่มแถว จนไม่มีใหม่. ได้แค่ 3 superstate: A={q0,q1}, B={q0,q1,q2,q4}, C={q0,q1,q3,q4}', 'ตาราง: A ─a→ A, A ─b→ B · B ─a→ C, B ─b→ B · C ─a→ C, C ─b→ B', '<b>ขั้น 4 final</b>: B, C (มี q4/q3). A ไม่ final → e ∉ L', 'ภาษาที่ได้: string ที่มี b อย่างน้อยหนึ่งตัว (หลัง b ตัวแรกจะอยู่ใน B/C ตลอด) — ตรงกับ NFA: q0 ─b→ q2… ไม่ก็ q1 ─b→ q4', 'กด "ไปเล่นจริง" → module 2 จะเดินตารางนี้ทีละ cell พร้อมสูตร'], pitfalls: ['ทุก cell ต้องเอา E(·) ของปลายทางมา union — ลืมแล้วจะได้ {q0,q3} แทน {q0,q1,q3,q4}', 'ไม่ต้องสร้าง 2⁵ = 32 superstate — เอาเฉพาะที่ไปถึงได้จาก start (3 ตัว)', 'superstate ที่ไม่ใช่ final ยังต้องมีเส้นออกครบทั้ง a, b (DFA)'] } },
] });
})();

(() => {
const P4Q14 = { name: 'DFA (ชุด 4 ข้อ 14)', alphabet: ['0', '1'], start: 'q0', finals: ['q0'], rows: { q0: { 0: 'q0', 1: 'q1' }, q1: { 0: 'q2', 1: 'q0' }, q2: { 0: 'q1', 1: 'q2' } }, pos: { q0: [100, 200], q1: [300, 200], q2: [500, 200] } };
const P4Q17 = { name: 'DFA (ชุด 4 ข้อ 17)', alphabet: ['0', '1'], start: 'q0', finals: ['q2'], rows: { q0: { 1: 'q1', 0: 'q3' }, q3: { 0: 'q0', 1: 'q0' }, q1: { 0: 'q2', 1: 'q4' }, q4: { 0: 'q1', 1: 'q1' }, q2: {} }, pos: { q0: [100, 120], q3: [100, 300], q1: [320, 120], q4: [320, 300], q2: [540, 120] } };
const P4Q18 = { name: 'DFA (ชุด 4 ข้อ 18)', alphabet: ['a', 'b'], start: 'q0', finals: ['q2'], rows: { q0: { a: 'q1', b: 'q1' }, q1: { a: 'q1', b: 'q2' }, q2: { a: 'q0', b: 'q1' } }, pos: { q0: [100, 120], q1: [340, 120], q2: [220, 300] } };
Object.assign(FA.EXAM_AUTOMATA, { P4Q14, P4Q17, P4Q18 });
const O = (arr) => arr.map(([text, why]) => ({ text, why }));

FA.EXAMS.push({ id: 'p4', title: 'ชุดที่ 4 (ปรนัย)', questions: [
{ id: '1', marks: 4, topic: 'countability', type: 'mc', text: 'Which statement is correct?', answer: 1,
  options: O([
    ['Every subset of a countably infinite set is finite.', 'ℕ ⊆ ℕ ไม่จำกัด'],
    ['Every subset of a countably infinite set is finite or countably infinite.', '✓ subset ของเซตนับได้ นับได้เสมอ (เรียงตามลำดับเดิมแล้วข้ามตัวที่ไม่อยู่) — จะจำกัดหรืออนันต์นับได้ก็ได้'],
    ['Every subset of an uncountably infinite set is finite.', 'ℝ ⊆ ℝ ไม่จำกัด'],
    ['Every subset of an uncountably infinite set is finite or countably infinite.', 'ℝ เองเป็น subset ของ ℝ และนับไม่ได้'],
    ['None of the above statements are correct.', '(b) ถูก'],
  ]),
  solution: { steps: ['หลัก: <b>subset ของ countable = countable</b> (จำกัดหรืออนันต์นับได้) แต่ subset ของ uncountable เป็นได้ทุกแบบ (∅, ℕ, ℝ)', 'ตัวเลือกที่พูดว่า "every subset … is finite" ผิดทันทีเพราะเซตเป็น subset ของตัวเอง'], pitfalls: ['ปรนัยติดลบเท่าคะแนนข้อ — ตัดตัวเลือกด้วย counterexample "เซตเอง" ก่อน'] } },

{ id: '2', marks: 4, topic: 'relation', type: 'mc', text: 'Which statement is true about R = {(1,2), (2,5), (5,5), (3,3), (1,5)}?', answer: 1,
  options: O([
    ['R is symmetric.', '(1,2) ∈ R แต่ (2,1) ∉ R'],
    ['R is transitive.', '✓ ตรวจทุกคู่ต่อกัน: (1,2)(2,5)⇒(1,5) มี; (2,5)(5,5)⇒(2,5) มี; (1,5)(5,5)⇒(1,5) มี; (5,5)(5,5), (3,3)(3,3) มี — ครบ'],
    ['R is reflexive.', 'ไม่มี (1,1), (2,2)'],
    ['R is equivalent.', 'equivalence relation ต้อง reflexive+symmetric+transitive — ขาดสองอย่าง'],
    ['None of the above statements are correct.', '(b) ถูก'],
  ]),
  solution: { steps: ['ตรวจ transitive อย่างเป็นระบบ: หา (x,y),(y,z) ทุกคู่ที่ "ตัวกลาง y" ตรงกัน แล้วดูว่า (x,z) มีไหม — ในข้อนี้ y = 2 และ y = 5 (และ 3) ผ่านหมด', 'reflexive ต้องมี (x,x) ของ<b>ทุก</b> x ในเซตฐาน — มีแค่ (5,5),(3,3) ไม่พอ'], pitfalls: ['อย่าดูแค่ว่า "มี self-loop บ้าง" แล้วตอบ reflexive'] } },

{ id: '3', marks: 4, topic: 'เซต', type: 'mc', text: 'Which expression is equal to (Ā ∪ B) ∩ (Ā ∩ (B ∪ A))?', answer: 0,
  options: O([
    ['Ā ∩ B', '✓ ดูขั้นตอนใน solution'],
    ['Ā ∪ B', 'ใหญ่เกิน — สมาชิกที่อยู่ใน Ā แต่ไม่อยู่ใน B ไม่อยู่ในนิพจน์เดิม'],
    ['Ā ∩ B̄', 'สมาชิกที่ไม่อยู่ทั้ง A, B: ไม่ผ่านตัวประกอบขวา (ต้องอยู่ใน B∪A)'],
    ['Ā ∪ B̄', 'ใหญ่เกิน'],
    ['No answers', '(a) ถูก'],
  ]),
  solution: { steps: ['ทำตัวประกอบขวาก่อน: Ā ∩ (B ∪ A) = (Ā ∩ B) ∪ (Ā ∩ A) = (Ā ∩ B) ∪ ∅ = <b>Ā ∩ B</b>', 'แล้ว (Ā ∪ B) ∩ (Ā ∩ B): เนื่องจาก Ā ∩ B ⊆ Ā ⊆ Ā ∪ B การ ∩ กับเซตที่ใหญ่กว่าไม่เปลี่ยนอะไร → <b>Ā ∩ B</b>', 'วิธีเช็คเร็ว: ลองสมาชิก 4 ประเภท (ใน A/ไม่ใน A × ใน B/ไม่ใน B) — เฉพาะ "ไม่อยู่ใน A แต่อยู่ใน B" ผ่านทั้งสองตัวประกอบ'], pitfalls: ['Ā ∩ A = ∅ และ X ∩ Y = X เมื่อ X ⊆ Y — สองกฎนี้ทำให้ข้อนี้จบใน 2 บรรทัด'] } },

{ id: '4', marks: 4, topic: 'countability', type: 'mc', text: 'Which proof technique is useful for proving that infinite sets have different cardinalities?', answer: 3,
  options: O([
    ['Proof by Induction', 'ใช้กับข้อความบน ℕ ทีละ n'],
    ['Proof by Contradiction', 'ใช้ร่วมได้ แต่ไม่ใช่เทคนิคเฉพาะเรื่องนี้'],
    ['Proof by Construction', 'สร้าง bijection ใช้พิสูจน์ว่า "เท่ากัน" ไม่ใช่ "ต่างกัน"'],
    ['Diagonalization Principle', '✓ Cantor: พิสูจน์ 2<sup>ℕ</sup>, ℝ, 2<sup>Σ*</sup> นับไม่ได้ — ต่างขนาดกับ ℕ'],
    ['Pigeonhole Principle', 'ใช้กับเซตจำกัด (และ pumping theorem)'],
  ]),
  solution: { steps: ['สไลด์ Chapter 1 หน้า 47–49: diagonalization principle → 2<sup>ℕ</sup> ไม่นับได้ → มีเซตอนันต์ "ใหญ่กว่า" ℕ', 'ชุด 1 ข้อ 8 และชุดนี้ข้อ 8.3 ถามรายละเอียดของหลักการนี้'], pitfalls: [] } },

{ id: '5.1', marks: 2, topic: 'เซต', type: 'mc', text: '5.1 How many proper subsets does A = {a, b} have?', answer: 3,
  options: O([['0', ''], ['1', ''], ['2', 'นี่คือจำนวนสมาชิก ไม่ใช่ subset'], ['3', '✓ ∅, {a}, {b} — subset ทั้งหมด 2² = 4 ตัด A เอง'], ['4', 'นี่คือจำนวน subset ทั้งหมด (รวม A)']]),
  solution: { steps: ['subset ทั้งหมด = 2<sup>|A|</sup> = 4: ∅, {a}, {b}, {a,b}', 'proper subset = subset ที่ไม่ใช่ A เอง → 4 − 1 = 3'], pitfalls: ['∅ นับเป็น proper subset ด้วย'] } },
{ id: '5.2', marks: 2, topic: 'เซต', type: 'mc', text: '5.2 Let Π be a partition of A = {0, 1, 2, 4}. What is the maximal size of Π?', answer: 4,
  options: O([['0', ''], ['1', 'นี่คือขนาดต่ำสุด ({A})'], ['2', ''], ['3', ''], ['4', '✓ แยกทุกตัวเดี่ยว {{0},{1},{2},{4}} — บล็อกต้องไม่ว่างจึงมีได้ไม่เกิน |A|']]),
  solution: { steps: ['partition มีบล็อกได้อย่างมาก |A| บล็อก (ทุกตัวอยู่เดี่ยว) และอย่างน้อย 1 บล็อก ({A})'], pitfalls: ['อย่าถูกหลอกด้วยตัวเลข 0,1,2,4 — ขนาดของเซตคือ 4'] } },
{ id: '5.3', marks: 2, topic: 'ฟังก์ชัน', type: 'mc', text: '5.3 Let A = {0, 1, 2} and B = {1}. How many functions from A to B are there?', answer: 1,
  options: O([['0', ''], ['1', '✓ ทุกตัวต้องชี้ไป 1: {(0,1),(1,1),(2,1)} มีแบบเดียว'], ['2', ''], ['3', 'นี่คือ |A|'], ['None of the above', '']]),
  solution: { steps: ['จำนวนฟังก์ชัน A → B = |B|<sup>|A|</sup> = 1³ = 1 (แต่ละ a เลือกปลายทางได้ |B| แบบ)'], pitfalls: [] } },
{ id: '5.4', marks: 2, topic: 'ฟังก์ชัน', type: 'mc', text: '5.4 Let A = {0, 1, 2} and B = {}. How many functions from A to B are there?', answer: 0,
  options: O([['0', '✓ ฟังก์ชันต้องมีคู่ (0, b) สำหรับ b ∈ B แต่ B ว่าง — สร้างไม่ได้'], ['1', 'ฟังก์ชันว่างเป็นฟังก์ชัน ∅ → B ได้ แต่ domain ต้องว่างด้วย'], ['2', ''], ['3', ''], ['None of the above', '']]),
  solution: { steps: ['สูตร |B|<sup>|A|</sup> = 0³ = 0', 'สังเกตกลับกัน: จาก ∅ ไป B มี 1 ฟังก์ชัน (ฟังก์ชันว่าง) เพราะ |B|⁰ = 1'], pitfalls: ['อย่าสับสนกับข้อ 6.3 (relation ว่างมีได้ 1 ตัว แต่ฟังก์ชันไม่มี)'] } },

{ id: '6.1', marks: 2, topic: 'เซต', type: 'mc', text: '6.1 How many partitions does A = {a, b} have?', answer: 2,
  options: O([['0', ''], ['1', ''], ['2', '✓ {{a},{b}} และ {{a,b}}'], ['3', ''], ['4', 'นี่คือจำนวน subset']]),
  solution: { steps: ['1 บล็อก: {A}; 2 บล็อก: {{a},{b}} — รวม 2 (Bell number B₂ = 2, B₃ = 5 ในชุด 3)'], pitfalls: [] } },
{ id: '6.2', marks: 2, topic: 'countability', type: 'mc', text: '6.2 How many subsets of ℕ = {0, 1, 2, …} are finite?', answer: 3,
  options: O([['0', ''], ['1', 'ไม่ใช่แค่ ∅'], ['3', ''], ['Infinite', '✓ {0,…,n} ต่างกันทุก n — อนันต์ (และนับได้)'], ['None of the above answers are correct.', '']]),
  solution: { steps: ['ยกตระกูลอนันต์: Xₙ = {0,1,…,n} หรือ {n} ทุก n ∈ ℕ', 'ลึกกว่านั้น: subset จำกัดของ ℕ มี "นับได้อนันต์" ส่วน subset ทั้งหมดนับไม่ได้ (2<sup>ℕ</sup>)'], pitfalls: [] } },
{ id: '6.3', marks: 2, topic: 'relation', type: 'mc', text: '6.3 Let A = {0, 1, 2}, B = {} and R ⊆ A × B. What is the maximal size of R?', answer: 0,
  options: O([['0', '✓ A × B = {} → R ⊆ {} → R = {}'], ['1', ''], ['2', ''], ['3', ''], ['None of the above are correct.', '']]),
  solution: { steps: ['|A × B| = |A|·|B| = 3·0 = 0 → relation เดียวที่มีคือ ∅ ขนาด 0'], pitfalls: ['relation ว่าง "มีอยู่" (1 ตัว) แต่ "ขนาด" เป็น 0 — ข้อนี้ถามขนาด'] } },
{ id: '6.4', marks: 2, topic: 'relation', type: 'mc', text: '6.4 Let R ⊆ ℕ × ℕ be a reflexive relation over ℕ. What is the minimal size of R?', answer: 4,
  options: O([['0', ''], ['1', ''], ['2', ''], ['3', ''], ['None of the above are correct.', '✓ ต้องมี (n,n) ทุก n ∈ ℕ → อนันต์']]),
  solution: { steps: ['reflexive บนเซตฐาน A บังคับให้ {(x,x) | x ∈ A} ⊆ R → |R| ≥ |A| = อนันต์'], pitfalls: ['ตัวเลือก "None" ถูกเมื่อคำตอบเป็น "อนันต์" ซึ่งไม่ใช่ตัวเลข'] } },

{ id: '7.1', marks: 2, topic: 'relation', type: 'mc', text: '7.1 Let A = {a, b} and R = ∅. What can be said about R as a binary relation over A?', answer: [2, 3],
  options: O([
    ['A reflexive relation.', 'ต้องมี (a,a),(b,b)'],
    ['A symmetric relation but not transitive.', 'R ว่างเป็น transitive (vacuously)'],
    ['A transitive relation but not reflexive.', '✓ (รับได้)'],
    ['A symmetric and transitive relation.', '✓ (รับได้) — เฉลยยอมรับทั้ง (c) และ (d)'],
    ['None of the above', ''],
  ]),
  solution: { steps: ['relation ว่าง: symmetric ✓ antisymmetric ✓ transitive ✓ (นิยามรูป "ถ้า…แล้ว…" จริงโดยไม่มีกรณี) แต่ reflexive ✗ เมื่อ A ≠ ∅', 'เหมือนชุด 1 ข้อ 3 เป๊ะ'], pitfalls: ['ข้อนี้มี 2 ตัวเลือกถูก — เลือกอันไหนก็ได้คะแนน'] } },
{ id: '7.2', marks: 2, topic: 'relation', type: 'mc', text: '7.2 Let A = {a, b} and R = A × A. What can be said about R?', answer: 0,
  options: O([
    ['An equivalence relation.', '✓ มีทุกคู่ → reflexive, symmetric, transitive ครบ (partition = {A} บล็อกเดียว)'],
    ['A partial order but not total order.', 'ไม่ anti-symmetric: มีทั้ง (a,b),(b,a) แต่ a ≠ b'],
    ['A total order', 'ต้องเป็น partial order ก่อน'],
    ['A function from A to A', 'a มี 2 ปลายทาง (a,a),(a,b)'],
    ['None of the above', ''],
  ]),
  solution: { steps: ['A × A คือ relation "ทุกอย่างสัมพันธ์กับทุกอย่าง" = equivalence relation ที่หยาบที่สุด'], pitfalls: [] } },
{ id: '7.3', marks: 2, topic: 'relation', type: 'mc', text: '7.3 Let A = {a, b} and R = {(a,a), (a,b), (b,a)}. What can be said about R?', answer: 4,
  options: O([
    ['An equivalence relation.', 'ขาด (b,b) → ไม่ reflexive'],
    ['A partial order but not total order.', 'มี (a,b),(b,a) → ไม่ anti-symmetric'],
    ['A total order', 'ไม่ใช่ partial order ด้วยซ้ำ'],
    ['A function from A to A', 'a มี 2 ปลายทาง'],
    ['None of the above.', '✓'],
  ]),
  solution: { steps: ['ไล่เช็คทีละคุณสมบัติ: reflexive ✗ (ไม่มี (b,b)), symmetric ✓, anti-symmetric ✗, transitive ✗ ((b,a),(a,b) ⇒ ต้องมี (b,b))', 'ไม่เข้าข่ายอะไรเลย → None'], pitfalls: ['ระวังตอบ (a) เพราะ "ดูเหมือน symmetric" — equivalence ต้องครบ 3'] } },
{ id: '7.4', marks: 2, topic: 'ฟังก์ชัน', type: 'mc', text: '7.4 Let A = {a, b} and R = {(a,a), (a,b)}. What can be said about R⁻¹?', answer: 0,
  options: O([
    ['It is a function from A to A.', '✓ R⁻¹ = {(a,a),(b,a)}: a ↦ a, b ↦ a ครบทุกตัว ตัวละหนึ่งปลายทาง'],
    ['It is a binary relation over A but not a function from A to A', 'มันเป็นฟังก์ชัน'],
    ['It is a function from A ∪ {c} to A', 'domain ต้องมีคู่ของ c ด้วย'],
    ['None of the above', ''],
  ]),
  solution: { steps: ['กลับด้าน: R⁻¹ = {(a,a),(b,a)} แล้วเช็คนิยามฟังก์ชัน: ทุกสมาชิกของ domain มีคู่ (a ✓ b ✓) และไม่มีตัวไหนมี 2 ปลายทาง ✓', 'R เองไม่ใช่ฟังก์ชัน (a มี 2 ปลายทาง) แต่ R⁻¹ เป็น — inverse ของ non-function อาจเป็น function'], pitfalls: ['ข้อ 8.4 ถามซ้ำข้อเดียวกัน'] } },

{ id: '8.1', marks: 2, topic: 'diagonalization', type: 'mc', text: '8.1 Let A = {a, b, c, d} and R = {(a,a), (b,b), (c,c), (d,d)}. What can be said about R<sub>a</sub> = {x ∈ A | (a, x) ∈ R} (the row set of a)?', answer: 1,
  options: O([['R<sub>a</sub> is an empty set.', ''], ['R<sub>a</sub> is a singleton set.', '✓ R<sub>a</sub> = {a}'], ['R<sub>a</sub> contains two distinct elements.', ''], ['R<sub>a</sub> contains three distinct elements.', ''], ['None of the above', '']]),
  solution: { steps: ['แถวของ a ในตาราง R: คู่ที่ขึ้นต้นด้วย a มีแค่ (a,a) → R<sub>a</sub> = {a}'], pitfalls: [] } },
{ id: '8.2', marks: 2, topic: 'diagonalization', type: 'mc', text: '8.2 Same A and R. What can be said about the diagonal set D of R?', answer: 0,
  options: O([['D is an empty set.', '✓ D = {x | (x,x) ∉ R} — แต่ทุก x มี (x,x) ∈ R → D = ∅'], ['D is a singleton set.', ''], ['D contains two distinct elements.', ''], ['D contains three distinct elements.', ''], ['None of the above', '']]),
  solution: { steps: ['D นิยามด้วย ∉: "ตำแหน่งบนเส้นทแยงที่ว่าง" — R นี้เส้นทแยงเต็มหมด → D = ∅', 'ตรวจ diagonalization principle: D = ∅ ต่างจากทุกแถว R<sub>x</sub> = {x} ✓'], pitfalls: ['อย่าตอบ "4 ตัว" เพราะคิดว่า D = เส้นทแยง — D คือส่วนเติมเต็มของเส้นทแยง'] } },
{ id: '8.3', marks: 2, topic: 'diagonalization', type: 'mc', text: '8.3 What is asserted by the diagonalization principle?', answer: 0,
  options: O([
    ['The diagonal set of a relation is always different from any row set.', '✓ ข้อความตรงตาม textbook §1.5'],
    ['The diagonal set of a relation may be different from any row set.', '"may" อ่อนเกิน — หลักการยืนยันว่า "always"'],
    ['The diagonal set of a relation coincides with any row set.', 'ตรงข้าม'],
    ['There is no one-to-one function from A to B if |A| > |B|.', 'นี่คือ pigeonhole principle'],
    ['None of the above.', ''],
  ]),
  solution: { steps: ['Diagonalization principle: ให้ R ⊆ A × A, D = {a | (a,a) ∉ R} แล้ว D ≠ R<sub>a</sub> สำหรับทุก a ∈ A', 'เหตุผลสั้น ๆ: D กับ R<sub>a</sub> ต่างกันที่สมาชิก a เสมอ (a ∈ D ⇔ a ∉ R<sub>a</sub>)'], pitfalls: ['ตัวเลือก (d) เป็นหลักการอีกอันที่ใช้ใน pumping — อย่าสับสน'] } },
{ id: '8.4', marks: 2, topic: 'ฟังก์ชัน', type: 'mc', text: '8.4 Let A = {a, b} and R = {(a,a), (a,b)}. What can be said about R⁻¹?', answer: 0,
  options: O([['It is a function from A to A.', '✓ R⁻¹ = {(a,a),(b,a)}'], ['It is a binary relation over A but not a function from A to A', ''], ['It is a function from A ∪ {c} to A', 'ไม่มีคู่ของ c'], ['None of the above', '']]),
  solution: { steps: ['ข้อเดียวกับ 7.4'], pitfalls: [] } },

{ id: '9.1', marks: 2, topic: 'countability', type: 'mc', text: '9.1 Let Σ = {1}. What can be said about 2<sup>Σ*</sup>?', answer: 3,
  options: O([
    ['2<sup>Σ*</sup> is the set of all strings over Σ.', 'นั่นคือ Σ* — 2<sup>Σ*</sup> คือเซตของ<b>ภาษา</b>'],
    ['2<sup>Σ*</sup> is a finite set.', 'Σ* อนันต์ → power set อนันต์'],
    ['2<sup>Σ*</sup> is a countably infinite set.', 'power set ของเซตอนันต์นับได้ → นับไม่ได้'],
    ['2<sup>Σ*</sup> is an uncountably infinite set.', '✓ Σ* = {1ⁿ} ≈ ℕ → 2<sup>Σ*</sup> ≈ 2<sup>ℕ</sup> นับไม่ได้ (diagonalization)'],
    ['None of the above', ''],
  ]),
  solution: { steps: ['แม้ alphabet มีตัวเดียว Σ* = {e, 1, 11, 111, …} ก็ยังเทียบเท่า ℕ (1ⁿ ↔ n)', 'power set ของเซตที่เทียบเท่า ℕ ย่อมเทียบเท่า 2<sup>ℕ</sup> ซึ่งนับไม่ได้ → มีภาษาบน {1} มากกว่าที่จะเขียน regex/automaton ได้'], pitfalls: ['ขนาดของ alphabet ไม่มีผลกับความนับได้ของ Σ* (ยังนับได้) และของ 2<sup>Σ*</sup> (ยังนับไม่ได้)'] } },
{ id: '9.2', marks: 2, topic: 'ภาษา', type: 'mc', text: '9.2 Let Σ₁ = {0, 1} and Σ₂ = {0, 1, 2}. Which statement is true?', answer: 0,
  options: O([['Σ₁* ⊆ Σ₂*', '✓ string ที่ใช้แค่ 0,1 ก็เป็น string บน {0,1,2}'], ['Σ₂* ⊆ Σ₁*', '"2" ∈ Σ₂* แต่ ∉ Σ₁*'], ['Σ₁* = Σ₂*', 'ไม่เท่า'], ['Σ₁* and Σ₂* are disjoint.', 'มี e, 0, 01, … ร่วมกัน'], ['None of the above', '']]),
  solution: { steps: ['alphabet เล็กกว่า → Σ* เล็กกว่า (subset) — และทั้งสองมี e ร่วมกันเสมอ จึงไม่ disjoint'], pitfalls: [] } },
{ id: '9.3', marks: 2, topic: 'countability', type: 'mc', text: '9.3 Let ℕ be the set of natural numbers. Which statement is correct?', answer: 3,
  options: O([
    ['There is no one-to-one function from ℕ to ℕ × ℕ.', 'n ↦ (n,0) ก็ one-to-one'],
    ['If f is a function from ℕ to ℕ × ℕ, then f cannot be onto ℕ × ℕ.', 'dovetailing ให้ onto ได้'],
    ['There is no bijection from ℕ to ℕ × ℕ.', 'มี'],
    ['There is a bijection from ℕ to ℕ × ℕ.', '✓ ℕ × ℕ นับได้ (textbook หน้า 22 — เดินทแยงตาราง)'],
    ['None of the above.', ''],
  ]),
  solution: { steps: ['ℕ × ℕ นับได้: เรียงคู่ (i,j) ตาม i+j = 0,1,2,… (dovetailing / เดินทแยง) ทุกคู่ถูกนับถึงในเวลาจำกัด', 'สูตรชัดเจน: f(i,j) = (i+j)(i+j+1)/2 + i เป็น bijection'], pitfalls: ['"ใหญ่กว่า" ตามสัญชาตญาณ (ตารางสองมิติ) ไม่ได้แปลว่านับไม่ได้'] } },
{ id: '9.4', marks: 2, topic: 'relation', type: 'mc', text: '9.4 Suppose R ⊆ A × A is transitive. What do you know about R′ = {(a,b) ∈ R | (b,a) ∉ R}? <span class="note">(any of (a)–(d) is accepted)</span>', answer: [0, 1, 2, 3],
  options: O([
    ['R′ is not reflexive.', '✓ ถ้ามี (a,a) ∈ R′ ต้องได้ (a,a) ∈ R และ (a,a) ∉ R พร้อมกัน — ขัดแย้ง (ยกเว้น A = ∅)'],
    ['R′ is transitive.', '✓ (a,b),(b,c) ∈ R′ → (a,c) ∈ R; ถ้า (c,a) ∈ R จะได้ (c,b) ∈ R (จาก (c,a),(a,b)) ขัดกับ (b,c) ∈ R′ → (a,c) ∈ R′'],
    ['R′ is anti-symmetric.', '✓ (a,b) ∈ R′ → (b,a) ∉ R → (b,a) ∉ R′'],
    ['R′ is both transitive and anti-symmetric.', '✓ รวม (b),(c)'],
    ['None of the above.', 'ทุกข้อ (a)–(d) จริง'],
  ]),
  solution: { steps: ['R′ = "ส่วนเคร่งครัด" (strict part) ของ R — ตัดคู่ที่มีทั้งสองทิศออก', 'ทุกคุณสมบัติ (a)–(d) พิสูจน์ได้ตาม why ของแต่ละตัวเลือก; อาจารย์ให้คะแนนทุกข้อ', 'ตัวอย่าง: R = ≤ บน ℕ (transitive) → R′ = < ซึ่ง irreflexive, transitive, anti-symmetric'], pitfalls: ['ข้อ (b) พิสูจน์ยากสุด — ต้องใช้ contradiction ผ่าน (c,a) ∈ R'] } },

{ id: '10', marks: 3, topic: 'ฟังก์ชัน', type: 'mc', text: 'Which statement is true about the function L(·) that maps each regular expression α into a regular language L(α)?', answer: 3,
  options: O([
    ['L(·) is a one-to-one function.', 'L(a*) = L((a*)*) แต่ regex ต่างกัน'],
    ['L(·) is an onto 2<sup>Σ*</sup> function.', 'ภาษาที่ไม่ regular (aⁿbⁿ) ไม่มี regex → ไม่ onto 2<sup>Σ*</sup> (onto R เท่านั้น)'],
    ['L(·) is a bijection.', 'ไม่ผ่านทั้งสอง'],
    ['None of the above.', '✓'],
  ]),
  solution: { steps: ['เทียบชุด 3 ข้อ 4: co-domain ที่นั่นคือ R (regular languages) → onto จริง; ที่นี่ co-domain คือ 2<sup>Σ*</sup> (ทุกภาษา) → ไม่ onto', 'จึงไม่มีข้อไหนถูก → None'], pitfalls: ['อ่าน co-domain ในโจทย์ทุกครั้ง'] } },
{ id: '11', marks: 3, topic: 'regex', type: 'mc', text: 'Let α = a*. Which statement is true about L(α)?', answer: 0,
  options: O([['L(α) = {aⁱ | i ∈ ℕ}', '✓ i = 0,1,2,… รวม a⁰ = e'], ['L(α) = {aⁱ | i ∈ ℕ, i ≥ 1}', 'นี่คือ a⁺ — ขาด e'], ['L(α) = {a}⁺', 'ขาด e'], ['None of the above.', '']]),
  solution: { steps: ['a* = {e, a, aa, …} มี e; a⁺ = aa* ไม่มี e — ℕ ของวิชานี้เริ่มที่ 0'], pitfalls: [] } },
{ id: '12', marks: 3, topic: 'regex', type: 'mc', text: 'Let α = ∅**∅. Which statement is true about L(α)?', answer: 0,
  options: O([['L(α) = ∅', '✓ ∅** = {e}; {e}·∅ = ∅ (concat กับภาษาว่างได้ว่าง)'], ['L(α) = {∅}', '∅ ไม่ใช่ string'], ['L(α) is not defined since α is not a valid regular expression.', 'ถูกไวยากรณ์: (∅*)* ตามด้วย ∅ — star ซ้อนได้'], ['None of the above.', '']]),
  solution: { steps: ['แยกโครงสร้าง: α = ((∅*)*)·∅', '∅* = {e}, ({e})* = {e}, {e}·∅ = ∅ เพราะ X·∅ = ∅ ทุก X (ไม่มี string จาก ∅ ให้ต่อ)'], pitfalls: ['∅ เป็น "ตัวดูดกลืน" ของ concat แต่เป็น "identity" ของ union'] } },
{ id: '13', marks: 3, topic: 'closure', type: 'mc', text: 'Let M = (K, Σ, δ, s, F) be a DFA and M′ = (K, Σ, δ, s, (K − F) ∪ {s}) — final ↔ non-final swapped, and additionally s is final in M′. What is the relationship between L(M) and L(M′)?', answer: 2,
  options: O([
    ['L(M) = L(M′)', 'string ที่จบที่ state ใน F − {s} อยู่ใน L(M) แต่ไม่อยู่ใน L(M′)'],
    ['L(M) ∩ L(M′) = {e}', 'ถ้า s ∈ F ทั้งสองมี e และอาจมี string อื่นที่วนกลับมา s ด้วย; ถ้า s ∉ F แล้ว e ∉ L(M) → ∩ ไม่มี e'],
    ['L(M) ∪ L(M′) = Σ*', '✓ ทุก string จบที่ state ใดสักตัว ซึ่งเป็น final ของ M หรือของ M′ (K−F ∪ {s} ⊇ K−F) — ครอบคลุมทุก state'],
    ['L(M′) = Σ* − L(M)', 'จริงเฉพาะเมื่อ s ∉ F; ถ้า s ∈ F แล้ว s เป็น final ทั้งคู่ → ไม่ใช่ complement'],
    ['None of the above are correct.', ''],
  ]),
  solution: { steps: ['complement ปกติ = สลับ final (ชุด 1 ข้อ 12) ให้ L(M′) = Σ* − L(M)', 'ข้อนี้<b>เพิ่ม s เป็น final ด้วย</b> → F′ ⊇ K − F ดังนั้น F ∪ F′ = K ทุก string ถูก accept โดยเครื่องใดเครื่องหนึ่ง → ∪ = Σ* แน่นอน', 'ส่วน (d) ผิดได้เมื่อ s ∈ F (string ที่จบที่ s อยู่ในทั้งสองภาษา) — ต้องเลือกคำตอบที่จริง<b>เสมอ</b>'], pitfalls: ['อ่านโจทย์ให้ครบ: "Additionally, s is a final state" คือจุดพลิก'] } },
{ id: '14', marks: 3, topic: 'DFA', type: 'mc', text: 'Which is <b>not</b> true about the following DFA M = (K, Σ, δ, s, F)? (load with the button)', answer: 3,
  link: { module: 'editor', automaton: P4Q14, sample: '0110' },
  options: O([['K = {q0, q1, q2}', 'จริง'], ['Σ = {0, 1}', 'จริง'], ['s = q0', 'จริง'], ['F = q0', '✓ ไม่จริง — F ต้องเป็น<b>เซต</b>: F = {q0}'], ['No answers', '']]),
  solution: { steps: ['ข้อหลอกเรื่อง notation: s เป็น state (เขียน s = q0 ได้) แต่ F เป็นเซตของ state ต้องเขียน {q0}', 'DFA นี้: q0 ⟲0, ─1→ q1; q1 ─1→ q0, ─0→ q2; q2 ─0→ q1, ⟲1'], pitfalls: ['สังเกตคำว่า "not true" — ต้องหาข้อผิด'] } },
{ id: '15', marks: 3, topic: 'closure', type: 'mc', text: 'Which statement is true about regular languages? If A and B are regular languages…', answer: 4,
  link: { module: 'closure' },
  options: O([['A · B is regular.', 'จริง (concatenation)'], ['A \\ B is regular.', 'จริง: A − B = A ∩ B̄ (complement + intersection)'], ['A ∪ B is regular.', 'จริง (union)'], ['A ∩ B is regular.', 'จริง (product / De Morgan)'], ['All answers are correct', '✓']]),
  solution: { steps: ['Theorem 2.3.1: regular ปิดภายใต้ ∪, ·, *, complement, ∩ — และ difference ตามมาจาก complement + ∩', 'ดู module 5 สำหรับ construction ของแต่ละ op'], pitfalls: [] } },
{ id: '16', marks: 3, topic: 'DFA', type: 'mc', text: 'When are DFAs considered equivalent?', answer: 0,
  options: O([['They accept the same set of strings.', '✓ นิยาม: L(M₁) = L(M₂)'], ['They have the same initial state and final states.', 'ชื่อ state ไม่มีความหมาย'], ['They have the same number of states.', 'DFA ก่อน/หลัง minimize เท่ากันแม้จำนวน state ต่าง'], ['They share the same set of alphabet.', 'ไม่พอ'], ['No answers', '']]),
  solution: { steps: ['equivalent = ภาษาเดียวกัน — module 3 มีปุ่ม "ตรวจว่า 2 DFA equivalent" (minimize แล้วเทียบ)'], pitfalls: [] } },
{ id: '17', marks: 3, topic: 'DFA', type: 'mc', text: 'Which string is accepted by the following DFA? (load with the button; run each option in module 1)', answer: 4,
  link: { module: 'editor', automaton: P4Q17, sample: '00111110' },
  options: O([
    ['11110000', 'q0→q1→q4→q1→q4→q1→q2→ ติด (q2 ไม่มีเส้นออก) → reject'],
    ['01011010', 'q0→q3→q0→q3→q0→q1→q2→ ติด → reject'],
    ['01111010', 'q0→q3→q0→q1→q4→q1→q2→ ติด (เหลือ 10 แต่ q2 ไม่มีเส้นออก) → reject'],
    ['00001111', 'q0→q3→q0→q3→q0→q1→q4→q1→q4 — จบที่ q4 ∉ F'],
    ['00111110', '✓ q0→q3→q0→q1→q4→q1→q4→q1→q2 — จบที่ q2 ∈ F พอดี'],
  ]),
  solution: { steps: ['เครื่องนี้: q0 กับ q3 สลับกันด้วย 0 (q0 ─0→ q3 ─0,1→ q0); q0 ─1→ q1; q1 กับ q4 สลับกันด้วย 1; q1 ─0→ q2 (final, ทางตัน)', 'ภาษา: (0(0∪1))* 1 (1(0∪1))* 0 — ต้องจบด้วย 0 ที่อ่านตอนอยู่ q1 พอดี และห้ามอ่านอะไรต่อ', 'วิธีทำในห้องสอบ: ไล่ทีละ string เขียน state ใต้ตัวอักษร — ถ้าติดทางตันหรือจบไม่ตรง final ก็ตัดทิ้ง', 'ใช้ปุ่ม "ทดสอบหลาย string" ใน module 1 เช็คทั้ง 5 ตัวเลือกพร้อมกัน'], pitfalls: ['q2 ไม่มีเส้นออก: string ที่ถึง q2 แล้วยังมีตัวอักษรเหลือ = reject (DFA ไม่ complete — ถือว่าตกไป trap)'] } },
{ id: '18', marks: 3, topic: 'DFA', type: 'mc', text: 'Given the following DFA and ω = abbaab, which configuration is a possible yield from (q0, ω) in any number of steps? (load with the button)', answer: 4,
  link: { module: 'editor', automaton: P4Q18, sample: 'abbaab' },
  options: O([
    ['(q0, aab)', 'หลังอ่าน abb อยู่ที่ q1 ไม่ใช่ q0'],
    ['(q2, aab)', 'หลังอ่าน abb: q0→q1→q2→q1 อยู่ที่ q1'],
    ['(q0, e)', 'จบที่ q2'],
    ['(q1, e)', 'จบที่ q2'],
    ['(q2, e)', '✓ (q0,abbaab) ⊢ (q1,bbaab) ⊢ (q2,baab) ⊢ (q1,aab) ⊢ (q1,ab) ⊢ (q1,b) ⊢ (q2,e)'],
  ]),
  solution: { steps: ['⊢* (yield in any number of steps) = configuration ใดก็ได้ที่ปรากฏในการเดิน', 'เขียน run ทั้งหมด: (q0,abbaab) ⊢ (q1,bbaab) ⊢ (q2,baab) ⊢ (q1,aab) ⊢ (q1,ab) ⊢ (q1,b) ⊢ (q2,e) แล้วเทียบตัวเลือกทีละอัน — เฉพาะ (q2,e) อยู่ในรายการ', 'ตัวเลือก (a),(b) มี input เหลือ aab = อ่านไป 3 ตัว (abb) ต้องอยู่ที่ q1'], pitfalls: ['configuration ที่ถูกต้องต้อง "state ตรง และ input ที่เหลือตรง" พร้อมกัน'] } },

{ id: '19', marks: 8, topic: 'เซต', type: 'proof', text: 'Prove A ∩ B = A \\ B̄.',
  solution: { steps: ['พิสูจน์เซตเท่ากัน = แสดง ⊆ สองทาง (double inclusion)', '<b>(⊆)</b> ให้ x ∈ A ∩ B → x ∈ A และ x ∈ B → x ∉ B̄ → x ∈ A และ x ∉ B̄ → x ∈ A \\ B̄', '<b>(⊇)</b> ให้ x ∈ A \\ B̄ → x ∈ A และ x ∉ B̄ → x ∈ B → x ∈ A ∩ B ∎', 'ภาพ Venn: "อยู่ใน A ตัดส่วนที่ไม่อยู่ใน B ทิ้ง" = "อยู่ใน A และ B"'], pitfalls: ['ต้องเขียนทั้งสองทิศ — ทิศเดียวได้แค่ ⊆', 'ใช้ x ∉ B̄ ⇔ x ∈ B ให้ชัดเจน (นิยาม complement)'], write: '(⊆) Let x ∈ A ∩ B. Then x ∈ A and x ∈ B, so x ∉ B̄; hence x ∈ A \\ B̄.<br>(⊇) Let x ∈ A \\ B̄. Then x ∈ A and x ∉ B̄, i.e. x ∈ B; hence x ∈ A ∩ B.<br>Therefore A ∩ B = A \\ B̄. ∎' } },
{ id: '20', marks: 9, topic: 'countability', type: 'proof', text: 'Let Σ be an alphabet and R ⊆ 2<sup>Σ*</sup> the set of all regular languages. Is R finite or infinite? If infinite, is it countable or uncountable? Prove your answer.',
  solution: { steps: ['<b>อนันต์</b>: {aⁿ} regular ทุก n และต่างกันหมด (a ∈ Σ)', '<b>นับได้</b>: ทุก regular language = L(α) สำหรับ regex α บางตัว; α ∈ Σ′* โดย Σ′ = Σ ∪ {(, ), ∅, ∪, *} จำกัด → regex นับได้ → R (ภาพของฟังก์ชัน L จากเซตนับได้) นับได้', 'สรุป: R เป็นเซตอนันต์นับได้ (countably infinite)', 'เทียบ: 2<sup>Σ*</sup> นับไม่ได้ → ภาษาส่วนใหญ่ไม่ regular — ชุด 2 ข้อ 7 ข้อเดียวกัน'], pitfalls: ['ต้องตอบ 2 ส่วน (อนันต์ + นับได้) และพิสูจน์ทั้งสอง', 'อย่าลืมอ้างว่า Σ′* นับได้ (string บน alphabet จำกัดเรียงตามความยาวได้)'], write: 'R is infinite: for a ∈ Σ, {aⁿ} ∈ R for every n ∈ ℕ and these are pairwise distinct. R is countable: every L ∈ R equals L(α) for some regular expression α, which is a string over the finite alphabet Σ′ = Σ ∪ {(, ), ∅, ∪, *}. Since Σ′* is countably infinite, so is the set of regular expressions, and L(·) maps it onto R; hence R is countably infinite. ∎' } },
] });
})();
</script>
