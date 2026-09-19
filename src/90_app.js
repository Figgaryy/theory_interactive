<script>
// ===== [9] app — navigation, theme, persistence, boot =====
(() => {
const { $, esc } = FA.ui; const App = FA.App; const ED = App.editor;
const mods = [...document.querySelectorAll('section.module')];
const nav = $('sidenav'), chips = $('chips');
mods.forEach((m, i) => {
  const id = m.id.replace('m-', '');
  const b = document.createElement('button'); b.className = 'navbtn'; b.dataset.m = id;
  b.innerHTML = `<span class="n">${i + 1}</span><span><span class="t">${esc(m.dataset.title)}</span><span class="s">${esc(m.dataset.sub)}</span></span>`;
  b.onclick = () => App.show(id); nav.appendChild(b);
  const c = document.createElement('button'); c.className = 'chip'; c.dataset.m = id; c.textContent = `${i + 1} · ${m.dataset.title}`; c.onclick = () => App.show(id); chips.appendChild(c);
});
App.show = (id) => {
  mods.forEach(m => m.classList.toggle('active', m.id === 'm-' + id));
  document.querySelectorAll('[data-m]').forEach(b => b.classList.toggle('active', b.dataset.m === id));
  try { localStorage.setItem('fa.tab', id); } catch (e) { }
  if (location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
  for (const k in App.views) if (App.views[k].fit) App.views[k].fit();
  ['powerset', 'minimize', 'regex', 'se', 'closure', 'pumping'].forEach(k => { const M = App[k]; if (!M) return; ['src', 'out', 'view', 'va', 'vb', 'vo'].forEach(v => M[v] && M[v].A && M[v].fit()); });
  const chip = chips.querySelector(`[data-m="${id}"]`); if (chip && chip.scrollIntoView) chip.scrollIntoView({ inline: 'center', block: 'nearest' });
};
App.goto = (id, A) => {
  App.show(id);
  if (!A) return;
  if (id === 'editor') ED.setCurrent(A);
  else if (id === 'powerset') App.powerset.load(A);
  else if (id === 'minimize') App.minimize.load(A);
  else if (id === 'regex') { document.querySelector('#m-regex .tabs2 button[data-sub=se]').click(); App.se.load(A); }
  else if (id === 'pumping') { $('pg-dfa').value = '__editor'; $('pg-w').value = ''; $('pg-find').click(); }
  FA.ui.toast(`ส่ง ${A.name || 'M'} ไปที่ module แล้ว`);
};
// theme
const root = document.documentElement;
$('btn-theme').onclick = () => { const cur = root.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); const nx = cur === 'dark' ? 'light' : 'dark'; root.dataset.theme = nx; try { localStorage.setItem('fa.theme', nx); } catch (e) { } };
try { const th = localStorage.getItem('fa.theme'); if (th) root.dataset.theme = th; } catch (e) { }
// library / import / export
$('btn-library').onclick = () => FA.ui.library(null, (A, p) => { ED.setCurrent(A, { sample: p.sample || '', run: !!p.sample }); App.show('editor'); if (p.regex) $('ed-cmp-in').value = p.regex; });
$('btn-export').onclick = () => { const txt = JSON.stringify(App.current.toJSON(), null, 1); navigator.clipboard && navigator.clipboard.writeText(txt).then(() => FA.ui.toast('คัดลอก JSON ของ automaton ไปคลิปบอร์ดแล้ว')).catch(() => prompt('คัดลอก JSON:', txt)); };
$('btn-import').onclick = () => { const txt = prompt('วาง JSON ของ automaton (จากปุ่มส่งออก):'); if (!txt) return; try { ED.setCurrent(FA.Automaton.fromJSON(txt)); App.show('editor'); } catch (e) { FA.ui.toast('JSON ไม่ถูกต้อง'); } };
// persistence of current automaton
App.save = () => { try { localStorage.setItem('fa.current', JSON.stringify(App.current.toJSON())); } catch (e) { } };
let saved = null; try { const s = localStorage.getItem('fa.current'); if (s) saved = FA.Automaton.fromJSON(s); } catch (e) { saved = null; }
// boot
const first = FA.presets.find(p => p.id === 'slide4');
ED.setMode('select');
if (saved && saved.states.length) { ED.setCurrent(saved); const w = $('ed-input').value.trim(); if (saved.start && [...w].every(c => saved.alphabet.includes(c))) ED.runInput(); } else { ED.setCurrent(first.build(), { sample: first.sample, run: true }); $('ed-cmp-in').value = first.regex; }
App.powerset.load(FA.preset('fig29'));
App.minimize.load(FA.preset('fig219'));
App.regex.build();
App.se.load(FA.preset('fig215'));
App.closure.run();
App.pumping.start(); App.pumping.quant(1);
$('pg-dfa').value = 'slide4'; $('pg-w').value = 'aababa'; $('pg-find').click();
let tab = (location.hash || '').replace('#', ''); if (!tab) { try { tab = localStorage.getItem('fa.tab') || ''; } catch (e) { } }
App.show(mods.some(m => m.id === 'm-' + tab) ? tab : 'editor');
window.addEventListener('hashchange', () => { const t = location.hash.replace('#', ''); if (mods.some(m => m.id === 'm-' + t)) App.show(t); });
window.addEventListener('resize', () => { for (const k in App.views) App.views[k].fit && App.views[k].fit(); });
})();
</script>
