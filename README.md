# Finite Automata Lab

Interactive, single-file website for **Theory of Computation – Chapter 2: Finite Automata**
(Lewis & Papadimitriou, *Elements of the Theory of Computation*; lecture slides by ND Hung, SIIT).

Open `index.html` in a browser — no build step, no server, no dependencies.

## Modules (learning path)

| # | Module | What you can do |
|---|--------|-----------------|
| 1 | Editor + Simulator | Draw a DFA/NFA (drag-and-drop or transition table), run a string on the input tape, step through configurations `(q, ω) ⊢ (q′, ω′)`; NFA shows active-set view and full computation tree; check your automaton against a regular expression |
| 2 | NFA → DFA | Powerset construction, one cell at a time: e-Closure table (iterations until convergence), powerset transition table, resulting DFA |
| 3 | DFA Minimization | Remove unreachable states, split ≡₀ → refine ≡ₙ with Lemma 2.5.1 (with the reason for every split), merged DFA; DFA equivalence checker |
| 4 | RegEx ↔ FA | Thompson-style construction stage by stage (Theorem 2.3.1); state elimination — click the state to eliminate; R(i, j, k) table |
| 5 | Closure properties | union / concatenation / Kleene star / complement / intersection (product and De Morgan), side by side |
| 6 | Pumping Theorem | Adversary game (prover or adversary role), automatic check over *all* decompositions, pigeonhole visualizer on a real DFA |
| 7 | Reference | Complexity table (Theorem 2.6.1), glossary, textbook-only topics, assigned exercises, built-in self-tests |

All worked examples from the slides and the textbook are in the 📚 Library (Figure 2-9, 2-15, 2-19/2-20, Example 2.6.1, …).
UI is in Thai with the slides' English notation (K, Σ, δ, Δ, s, F, e, ⊢, E(q)).

## Development

```
src/            source split into parts (model, algorithms, regex, renderer, UI, presets, tests, app)
build.py        concatenates src/ → index.html (standalone) and artifact.html (body only)
src/node_test.js runs the algorithm tests in Node without a browser
```

```sh
python build.py
node src/node_test.js      # 64 tests against the worked examples
```

Pure algorithms live in `src/20_algorithms.js` and `src/30_regex.js` and return `{ result, steps[] }`
so every module can replay them step by step.
