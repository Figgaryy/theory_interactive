<script>
// ===== [4] render/svg — AutomatonView =====
(() => {
const NS = 'http://www.w3.org/2000/svg';
const R = 24;
const el = (tag, attrs = {}, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };

class AutomatonView {
  constructor(container, opts = {}) {
    this.c = typeof container === 'string' ? document.getElementById(container) : container;
    this.opts = opts; this.A = null; this.hl = {};
    this.vb = { x: 0, y: 0, w: 720, h: 420 };
    this.svg = el('svg', { viewBox: '0 0 720 420' }, this.c);
    const defs = el('defs', {}, this.svg);
    // marker ids must be unique per SVG: url(#id) resolves document-wide, and a marker inside a hidden (display:none) SVG does not render
    this.uid = 'v' + (AutomatonView._n = (AutomatonView._n || 0) + 1);
    const mk = (id, cls) => { const m = el('marker', { id, viewBox: '0 0 10 10', refX: '9', refY: '5', markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse' }, defs); el('path', { d: 'M0,0 L10,5 L0,10 z', class: cls }, m); };
    mk('arr-' + this.uid, 'arrow'); mk('arrhl-' + this.uid, 'arrowhl');
    const st = el('style', {}, defs); st.textContent = '.arrow{fill:var(--ink-2)} .arrowhl{fill:var(--blue)}';
    this.gE = el('g', { class: 'edges' }, this.svg); this.gS = el('g', { class: 'states' }, this.svg); this.gO = el('g', { class: 'overlay' }, this.svg);
    this.mode = 'select'; this.drag = null; this.pan = null; this.pending = null;
    this.bind();
  }
  setAutomaton(A) { this.A = A; this.render(); return this; }
  pt(ev) { const p = this.svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY; const m = this.svg.getScreenCTM(); return m ? p.matrixTransform(m.inverse()) : { x: 0, y: 0 }; }
  setViewBox() { const v = this.vb; this.svg.setAttribute('viewBox', `${v.x} ${v.y} ${v.w} ${v.h}`); }
  fit(pad = 70) {
    if (!this.A || !this.A.states.length) { this.vb = { x: 0, y: 0, w: 720, h: 420 }; this.setViewBox(); return; }
    const xs = this.A.states.map(s => s.x), ys = this.A.states.map(s => s.y);
    let x0 = Math.min(...xs) - pad - 20, x1 = Math.max(...xs) + pad, y0 = Math.min(...ys) - pad - 30, y1 = Math.max(...ys) + pad;
    const cw = this.c.clientWidth || 720, ch = this.c.clientHeight || 420, ar = cw / ch;
    let w = Math.max(x1 - x0, 300), h = Math.max(y1 - y0, 200);
    if (w / h < ar) { const nw = h * ar; x0 -= (nw - w) / 2; w = nw; } else { const nh = w / ar; y0 -= (nh - h) / 2; h = nh; }
    this.vb = { x: x0, y: y0, w, h }; this.setViewBox();
  }
  bind() {
    const svg = this.svg;
    svg.addEventListener('pointerdown', (ev) => {
      const p = this.pt(ev); const hit = this.hitState(p);
      if (hit && this.mode === 'select') { this.drag = { id: hit.id, dx: hit.x - p.x, dy: hit.y - p.y, moved: false, sx: p.x, sy: p.y }; svg.setPointerCapture(ev.pointerId); return; }
      if (!hit && (this.mode === 'select' || !this.opts.editable)) { this.pan = { x: ev.clientX, y: ev.clientY, vx: this.vb.x, vy: this.vb.y, moved: false }; svg.setPointerCapture(ev.pointerId); }
    });
    svg.addEventListener('pointermove', (ev) => {
      const p = this.pt(ev);
      if (this.drag) { const s = this.A.state(this.drag.id); if (!s) return; if (Math.hypot(p.x - this.drag.sx, p.y - this.drag.sy) > 3) this.drag.moved = true; if (this.drag.moved) { s.x = Math.round(p.x + this.drag.dx); s.y = Math.round(p.y + this.drag.dy); this.render(); } return; }
      if (this.pan) { const k = this.vb.w / (this.c.clientWidth || 720); const dx = (ev.clientX - this.pan.x) * k, dy = (ev.clientY - this.pan.y) * k; if (Math.hypot(dx, dy) > 3) this.pan.moved = true; this.vb.x = this.pan.vx - dx; this.vb.y = this.pan.vy - dy; this.setViewBox(); return; }
      if (this.pending) { this.ghost(this.pending, p); }
    });
    svg.addEventListener('pointerup', (ev) => {
      const p = this.pt(ev);
      if (this.drag) { const d = this.drag; this.drag = null; if (d.moved) { this.opts.onChange && this.opts.onChange('move'); } else { this.opts.onStateClick && this.opts.onStateClick(d.id, ev); } return; }
      if (this.pan) { const pn = this.pan; this.pan = null; if (!pn.moved) this.clickAt(p, ev); return; }
      this.clickAt(p, ev);
    });
    svg.addEventListener('dblclick', (ev) => { const p = this.pt(ev); const hit = this.hitState(p); if (hit && this.opts.onStateDblClick) this.opts.onStateDblClick(hit.id, ev); });
    svg.addEventListener('wheel', (ev) => { ev.preventDefault(); const p = this.pt(ev); const f = ev.deltaY > 0 ? 1.12 : 1 / 1.12; const v = this.vb; v.x = p.x - (p.x - v.x) * f; v.y = p.y - (p.y - v.y) * f; v.w *= f; v.h *= f; this.setViewBox(); }, { passive: false });
  }
  clickAt(p, ev) {
    const hit = this.hitState(p);
    if (hit) { this.opts.onStateClick && this.opts.onStateClick(hit.id, ev); return; }
    const e = this.hitEdge(ev);
    if (e) { this.opts.onEdgeClick && this.opts.onEdgeClick(e.from, e.to, ev); return; }
    this.opts.onCanvasClick && this.opts.onCanvasClick(p, ev);
  }
  hitState(p) { if (!this.A) return null; for (let i = this.A.states.length - 1; i >= 0; i--) { const s = this.A.states[i]; if (Math.hypot(s.x - p.x, s.y - p.y) <= R + 4) return s; } return null; }
  hitEdge(ev) { const t = ev.target; const g = t && t.closest ? t.closest('g.ed') : null; return g ? { from: g.dataset.from, to: g.dataset.to } : null; }
  ghost(fromId, p) { this.gO.innerHTML = ''; const s = this.A.state(fromId); if (!s) return; el('line', { x1: s.x, y1: s.y, x2: p.x, y2: p.y, class: 'ghost' }, this.gO); }
  clearGhost() { this.gO.innerHTML = ''; }
  highlight(h) { this.hl = h || {}; this.render(); }
  edgePath(u, v, bidir) {
    if (u.id === v.id) {
      const x = u.x, y = u.y - R;
      return { d: `M ${x - 10} ${y + 3} C ${x - 34} ${y - 40}, ${x + 34} ${y - 40}, ${x + 10} ${y + 3}`, lx: x, ly: y - 36 };
    }
    const dx = v.x - u.x, dy = v.y - u.y, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    if (!bidir) {
      const x1 = u.x + ux * R, y1 = u.y + uy * R, x2 = v.x - ux * (R + 3), y2 = v.y - uy * (R + 3);
      return { d: `M ${x1} ${y1} L ${x2} ${y2}`, lx: (x1 + x2) / 2 + nx * 13, ly: (y1 + y2) / 2 + ny * 13 };
    }
    const off = 30;
    const cx = (u.x + v.x) / 2 + nx * off, cy = (u.y + v.y) / 2 + ny * off;
    const a1 = Math.atan2(cy - u.y, cx - u.x), a2 = Math.atan2(cy - v.y, cx - v.x);
    const x1 = u.x + Math.cos(a1) * R, y1 = u.y + Math.sin(a1) * R, x2 = v.x + Math.cos(a2) * (R + 3), y2 = v.y + Math.sin(a2) * (R + 3);
    const mx = 0.25 * x1 + 0.5 * cx + 0.25 * x2, my = 0.25 * y1 + 0.5 * cy + 0.25 * y2;
    return { d: `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`, lx: mx + nx * 12, ly: my + ny * 12 };
  }
  render() {
    const A = this.A; this.gE.innerHTML = ''; this.gS.innerHTML = '';
    if (!A) return;
    const H = this.hl; const hs = new Set(H.states || []), acc = new Set(H.accept || []), rej = new Set(H.reject || []), dim = new Set(H.dim || []);
    const hlE = new Set((H.transitions || []).map(t => typeof t === 'string' ? t : t.from + '|' + t.to));
    const dimE = new Set((H.dimTransitions || []).map(t => typeof t === 'string' ? t : t.from + '|' + t.to));
    const pairs = {};
    for (const t of A.transitions) (pairs[t.from + '|' + t.to] ||= []).push(t.symbol);
    const labelFn = this.opts.edgeLabel || ((from, to) => A.edgeLabel(from, to));
    for (const key in pairs) {
      const [f, to] = key.split('|'); const u = A.state(f), v = A.state(to); if (!u || !v) continue;
      const bidir = f !== to && !!pairs[to + '|' + f];
      const { d, lx, ly } = this.edgePath(u, v, bidir);
      const isHl = hlE.has(key);
      const g = el('g', { class: 'ed' + (isHl ? ' hl' : '') + (dimE.has(key) || dim.has(f) || dim.has(to) ? ' dim' : '') + (pairs[key].every(s => s === FA.E) ? ' eps' : ''), 'data-from': f, 'data-to': to }, this.gE);
      el('path', { d, style: `marker-end:url(#${isHl ? 'arrhl' : 'arr'}-${this.uid})` }, g);
      const hit = el('g', { class: 'ed hit' }, g); el('path', { d }, hit);
      const tx = el('text', { x: lx, y: ly }, g); tx.textContent = labelFn(f, to);
    }
    for (const s of A.states) {
      const cls = ['st']; if (s.isFinal) cls.push('final');
      if (acc.has(s.id)) cls.push('acc'); else if (rej.has(s.id)) cls.push('rej'); else if (hs.has(s.id)) cls.push('hl');
      if (dim.has(s.id)) cls.push('dim'); if (H.selected === s.id) cls.push('sel');
      if (H.groups && s.id in H.groups) cls.push('g' + (H.groups[s.id] % 6));
      const g = el('g', { class: cls.join(' '), transform: `translate(${s.x},${s.y})`, 'data-id': s.id }, this.gS);
      if (s.isStart) el('path', { d: `M ${-R - 26} -10 L ${-R - 26} 10 L ${-R - 6} 0 z`, class: 'startmark' }, g);
      el('circle', { r: R, class: 'body' }, g);
      if (s.isFinal) el('circle', { r: R - 4.5, class: 'ring' }, g);
      const t = el('text', {}, g);
      if (s.label.length <= 6) t.textContent = s.label;
      else {
        const br = s.label.startsWith('{');
        const toks = s.label.replace(/[{}]/g, '').split(','); const lines = []; let cur = '';
        for (const tk of toks) { if (cur && (cur + ',' + tk).length > 7) { lines.push(cur + ','); cur = tk; } else cur = cur ? cur + ',' + tk : tk; }
        lines.push(cur);
        const fs = lines.length > 2 ? 8.5 : 9.5; t.setAttribute('font-size', fs);
        lines.forEach((ln, i) => { const ts = el('tspan', { x: 0, y: (i - (lines.length - 1) / 2) * (fs + 1.5) }, t); ts.textContent = (br && i === 0 ? '{' : '') + ln + (br && i === lines.length - 1 ? '}' : ''); });
      }
    }
  }
}
FA.AutomatonView = AutomatonView;
})();
</script>
