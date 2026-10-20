// Shared illustration pieces: palette, gradients, the 3/4-view artery tube,
// cracks / repairs, LDL / HDL / red-blood-cell particles, and the cross-section.
// Modules compose these; tweak the look here and every module follows.

import { el, set, rng, mix, lerp, clamp, blobPath, smoothClosed } from './core.js';

export const C = {
  bg: '#0b0f17',
  ink: '#e8eef7',
  inkDim: '#9aa7ba',
  lumenLine: '#f4b06a',
  ldl: '#f2cf73',
  ldlEdge: '#b98a34',
  hdl: '#3fd2b0',
  hdlEdge: '#0f6e5a',
  scarBrown: '#8f5a2e',
  lumenMid: '#f2a65e',
  plaque: '#e6c477',
  plaqueDark: '#a87a3c',
  sugar: '#4aa3ff',
  sugarHi: '#d4ebff',
  calcium: '#f3efe4',
  rbc: '#d22a33',
  rbcRim: '#8f0f1a',
  tissue: '#d7a3a7',
  tissueDead: '#4a4652',
};

function grad(defs, type, id, stops, attrs = {}) {
  const g = el(type, { id, ...attrs }, defs);
  stops.forEach(([o, c, op]) => el('stop', { offset: o, 'stop-color': c, 'stop-opacity': op ?? 1 }, g));
  return g;
}

export function installDefs(svg) {
  const d = el('defs', {}, svg);
  const V = { x1: 0, y1: 0, x2: 0, y2: 1 };
  grad(d, 'linearGradient', 'lumenGrad', [[0, '#8a2e1c'], [0.22, '#d9733f'], [0.5, '#f7bd6c'], [0.78, '#d9733f'], [1, '#8a2e1c']], V);
  grad(d, 'linearGradient', 'wallGrad', [[0, '#5a0f1a'], [0.16, '#c23c48'], [0.3, '#ea7178'], [0.48, '#c43c48'], [0.85, '#7a1824'], [1, '#4a0b14']], V);
  grad(d, 'radialGradient', 'openGrad', [[0, '#2a040a'], [0.7, '#4f0b13'], [1, '#86222a']]);
  grad(d, 'radialGradient', 'ldlGrad', [[0, '#fff3cc'], [0.55, '#f2cf73'], [1, '#d4a144']], { cx: 0.4, cy: 0.35, r: 0.7 });
  grad(d, 'radialGradient', 'hdlGrad', [[0, '#d2fff5'], [0.35, '#4fe0bf'], [1, '#0e6655']], { cx: 0.35, cy: 0.3, r: 0.75 });
  grad(d, 'radialGradient', 'rbcGrad', [[0, '#f27e74'], [0.42, '#e0484c'], [0.75, '#c8222e'], [1, '#93101c']]);
  grad(d, 'radialGradient', 'scarGrad', [[0, '#fff2c6'], [0.35, '#efc979'], [0.8, '#bd8a42'], [1, '#8a5428']], { cx: 0.4, cy: 0.32, r: 0.75 });
  grad(d, 'radialGradient', 'bloodGrad', [[0, '#741420'], [1, '#33060c']]);
  grad(d, 'radialGradient', 'glowGrad', [[0, '#ff4a5a', 0.22], [0.6, '#ff4a5a', 0.06], [1, '#ff4a5a', 0]]);
  grad(d, 'radialGradient', 'sugarGrad', [[0, '#e6f3ff'], [0.4, '#6db7ff'], [1, '#1d63c4']], { cx: 0.35, cy: 0.3 });
  return d;
}

// Position / scale / fade any particle group.
export function place(node, x, y, s = 1, o = 1, rot = 0) {
  set(node, { transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${s.toFixed(3)})`, opacity: o });
}

// ---------- particles ----------

const CLOUD = [[0, 0, 1], [0.62, -0.18, 0.62], [-0.64, 0.08, 0.64], [0.14, 0.58, 0.56], [-0.22, -0.58, 0.56], [0.5, 0.46, 0.46], [-0.52, -0.42, 0.46], [-0.4, 0.5, 0.42]];

// LDL: big, puffy, cloud-like. Drawn as a union of circles (outline layer + fill layer).
export function makeLDL(parent, size = 30, seed = 1) {
  const g = el('g', {}, parent);
  const r = rng(seed);
  const parts = CLOUD.map(([x, y, k]) => [x * size * (0.9 + r() * 0.2), y * size * (0.9 + r() * 0.2), k * size * (0.9 + r() * 0.15)]);
  const outline = el('g', {}, g);
  const fill = el('g', {}, g);
  parts.forEach(([x, y, rr]) => {
    el('circle', { cx: x, cy: y, r: rr, fill: C.ldlEdge, stroke: C.ldlEdge, 'stroke-width': 3 }, outline);
    el('circle', { cx: x, cy: y, r: rr, fill: 'url(#ldlGrad)' }, fill);
  });
  return g;
}

// HDL: small, dense, smooth.
export function makeHDL(parent, size = 10) {
  const g = el('g', {}, parent);
  el('circle', { r: size, fill: 'url(#hdlGrad)', stroke: C.hdlEdge, 'stroke-width': Math.max(1, size * 0.12) }, g);
  el('circle', { cx: -size * 0.35, cy: -size * 0.38, r: size * 0.22, fill: '#ffffff', opacity: 0.7 }, g);
  return g;
}

// Red blood cell, face-on, with an optional sugar coating and sharp "crystal" spikes.
export function makeRBC(parent, r = 20, seed = 1) {
  const g = el('g', {}, parent);
  const R = rng(seed);
  const spikes = el('g', { opacity: 0 }, g);
  const nSp = 16;
  for (let i = 0; i < nSp; i++) {
    const a = (i / nSp) * Math.PI * 2 + (R() - 0.5) * 0.25;
    const w = 0.13 + R() * 0.08;
    const tip = r * (1.32 + R() * 0.3);
    const p = (ang, rad) => `${(Math.cos(ang) * rad).toFixed(1)},${(Math.sin(ang) * rad).toFixed(1)}`;
    el('polygon', { points: `${p(a - w, r * 0.9)} ${p(a + (R() - 0.5) * 0.1, tip)} ${p(a + w, r * 0.9)}`, fill: C.sugar, stroke: C.sugarHi, 'stroke-width': Math.max(0.6, r * 0.03), 'stroke-linejoin': 'round' }, spikes);
  }
  el('circle', { r, fill: 'url(#rbcGrad)', stroke: C.rbcRim, 'stroke-width': Math.max(0.8, r * 0.07) }, g);
  el('circle', { r: r * 0.42, fill: '#f08a7e', opacity: 0.35 }, g);
  const sugarG = el('g', {}, g);
  const dots = [];
  const nDots = 34;
  for (let i = 0; i < nDots; i++) {
    const a = R() * Math.PI * 2;
    const rad = r * (0.25 + 0.68 * Math.sqrt(R()));
    dots.push(el('circle', { cx: Math.cos(a) * rad, cy: Math.sin(a) * rad, r: r * (0.09 + R() * 0.04), fill: C.sugar, stroke: C.sugarHi, 'stroke-width': Math.max(0.4, r * 0.02), style: 'display:none' }, sugarG));
  }
  let shown = 0;
  return {
    g,
    // 0..1 fraction of the coating shown
    setSugar(f) {
      const k = Math.round(clamp(f) * nDots);
      if (k === shown) return;
      dots.forEach((d, i) => { d.style.display = i < k ? '' : 'none'; });
      shown = k;
    },
    // 0..1 how sharp / crystal-covered the cell looks
    setSpiky(s) {
      set(spikes, { opacity: s > 0.01 ? 1 : 0, transform: `scale(${(0.68 + 0.32 * clamp(s)).toFixed(3)})` });
    },
  };
}

// ---------- cracks & repairs ----------

// A jagged crack centered at (x, y). Returns its group (for patches/scars at the same spot),
// the crack outline path `d`, and slot points along the crack for packing particles.
export function makeCrack(parent, { x, y, len = 150, gap = 22, angle = 0, seed = 1 }) {
  const g = el('g', { transform: `translate(${x} ${y}) rotate(${angle})` }, parent);
  const inner = el('g', {}, g);
  const R = rng(seed);
  const n = 16;
  let cy = 0;
  const top = [], bot = [], center = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const px = -len / 2 + len * t;
    cy += (R() - 0.5) * gap * 0.45;
    const w = gap * Math.pow(Math.sin(Math.PI * t), 0.7) * (0.6 + 0.4 * R());
    top.push([px, cy - w / 2]);
    bot.push([px, cy + w / 2]);
    center.push([px, cy, w]);
  }
  const d = 'M ' + top.map(p => p.map(v => v.toFixed(1)).join(' ')).join(' L ') + ' L ' +
    bot.slice().reverse().map(p => p.map(v => v.toFixed(1)).join(' ')).join(' L ') + ' Z';
  el('path', { d, fill: '#2a0508', stroke: '#ffd9a8', 'stroke-width': 1.4, 'stroke-linejoin': 'round' }, inner);
  // hairline branches
  const branches = [];
  for (let k = 0; k < 4; k++) {
    const c = center[3 + Math.floor(R() * (n - 6))];
    const dir = R() < 0.5 ? -1 : 1;
    const pts = [[c[0], c[1]]];
    let bx = c[0], by = c[1];
    for (let j = 0; j < 3; j++) { bx += (R() - 0.5) * 18; by += dir * (6 + R() * 8); pts.push([bx, by]); }
    branches.push(el('polyline', { points: pts.map(p => p.join(',')).join(' '), fill: 'none', stroke: '#3a080c', 'stroke-width': 1.6, 'stroke-linecap': 'round', 'pathLength': 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1 }, inner));
  }
  return {
    g, d, center, len, gap, inner,
    // t: 0..1 how far the crack has opened; o: its opacity (fade it once repaired)
    grow(t, o = 1) {
      t = clamp(t);
      set(inner, { transform: `scale(${(0.02 + 0.98 * t).toFixed(3)} ${(0.25 + 0.75 * t).toFixed(3)})`, opacity: t > 0.001 ? o : 0 });
      branches.forEach(b => set(b, { 'stroke-dashoffset': 1 - clamp((t - 0.55) / 0.45) }));
    },
    // points along the crack where small particles fit
    slots(count) {
      const out = [];
      for (let i = 0; i < count; i++) {
        const idx = Math.round(2 + (i / Math.max(1, count - 1)) * (n - 4));
        out.push([center[idx][0], center[idx][1]]);
      }
      return out;
    },
  };
}

// A thin patch exactly filling a crack (HDL-style repair).
export function makePatch(crack) {
  return el('path', { d: crack.d, fill: C.scarBrown, opacity: 0, stroke: 'none' }, crack.g);
}

// A thick, bulging scar spilling past the crack edges (LDL-style repair).
export function makeScar(crack, seed = 7, bulk = 1) {
  const g = el('g', { opacity: 0 }, crack.g);
  const rx = crack.len * 0.62 * bulk, ry = crack.gap * 2.3 * bulk;
  el('path', { d: blobPath(rx * 1.02, ry * 1.05, seed + 1, 0.1), fill: '#3a0e08', opacity: 0.35, transform: 'translate(6 10)' }, g);
  el('path', { d: blobPath(rx, ry, seed, 0.12), fill: 'url(#scarGrad)', stroke: '#8a5428', 'stroke-width': 1.5 }, g);
  el('path', { d: blobPath(rx * 0.45, ry * 0.3, seed + 3, 0.2), fill: '#fff6d8', opacity: 0.35, transform: `translate(${-rx * 0.2} ${-ry * 0.35})` }, g);
  return g;
}

// ---------- the 3/4-view artery tube ----------

export class Tube {
  constructor(parent, { cx = 600, cy = 450, angle = -28, len = 1000, R = 150, r = 124, ex = 66, cells = 16, sugarDots = 0, seed = 3 } = {}) {
    Object.assign(this, { len, R, r, ex, cx, cy, angle });
    const L = len / 2, er = (ex * r) / R;
    this.L = L;
    this.root = el('g', {}, parent);
    el('ellipse', { cx, cy, rx: L + 140, ry: R + 200, fill: 'url(#glowGrad)', transform: `rotate(${angle} ${cx} ${cy})` }, this.root);
    this.g = el('g', { transform: `translate(${cx} ${cy}) rotate(${angle})` }, this.root);
    const body = `M ${-L} ${-R} L ${L} ${-R} A ${ex} ${R} 0 0 1 ${L} ${R} L ${-L} ${R} A ${ex} ${R} 0 0 1 ${-L} ${-R} Z`;
    const inner = `M ${-L} ${-r} L ${L} ${-r} A ${er} ${r} 0 0 1 ${L} ${r} L ${-L} ${r} A ${er} ${r} 0 0 0 ${-L} ${-r} Z`;
    const id = 'tubeclip' + Math.floor(Math.random() * 1e9);
    const cp = el('clipPath', { id }, this.g);
    el('path', { d: inner }, cp);

    el('path', { d: body, fill: '#4a0c15' }, this.g); // back of the wall
    el('path', { d: inner, fill: 'url(#lumenGrad)' }, this.g); // inner lining (back wall)
    this.deco = el('g', { 'clip-path': `url(#${id})` }, this.g); // cracks, patches, scars
    this.lumen = el('g', { 'clip-path': `url(#${id})` }, this.g); // flowing blood
    this.particles = el('g', {}, this.g); // LDL / HDL etc.
    this.front = el('path', { d: body, fill: 'url(#wallGrad)' }, this.g);
    this.sheen = el('path', { d: `M ${-L + 30} ${-R * 0.62} L ${L - 20} ${-R * 0.62}`, stroke: '#ffffff', 'stroke-width': 12, 'stroke-linecap': 'round', opacity: 0.16 }, this.g);
    el('path', { d: body, fill: 'none', stroke: '#ff9aa2', 'stroke-width': 2, opacity: 0.55 }, this.g);
    // near (open) end: wall ring + opening
    el('ellipse', { cx: -L, cy: 0, rx: ex, ry: R, fill: '#a6303c', stroke: '#ff9aa2', 'stroke-width': 2 }, this.g);
    el('ellipse', { cx: -L, cy: 0, rx: ex * 0.91, ry: R * 0.91, fill: 'none', stroke: '#6e1622', 'stroke-width': 3, opacity: 0.8 }, this.g);
    el('ellipse', { cx: -L, cy: 0, rx: er, ry: r, fill: 'url(#openGrad)', stroke: C.lumenLine, 'stroke-width': 3 }, this.g);
    this.overlay = el('g', {}, this.g); // things drawn on top of everything (labels, cut line)

    // flowing red cells (seen at a slant, so squashed)
    const rnd = rng(seed);
    this.cells = [];
    for (let i = 0; i < cells; i++) {
      const rbc = makeRBC(this.lumen, 17, seed * 100 + i);
      this.cells.push({ rbc, x: -L + rnd() * len, y: (rnd() - 0.5) * 2 * (r - 26), rot: rnd() * 180, sq: 0.45 + rnd() * 0.3, spd: 0.8 + rnd() * 0.4 });
    }
    this.sugar = [];
    for (let i = 0; i < sugarDots; i++) {
      const c = el('circle', { r: 4.5, fill: 'url(#sugarGrad)', style: 'display:none' }, this.lumen);
      this.sugar.push({ c, x: -L + rnd() * len, y: (rnd() - 0.5) * 2 * (r - 10), spd: 0.8 + rnd() * 0.4, on: false });
    }
    this.flow = 90;
    this.sugarLevel = 0;
  }
  setFront(o) {
    set(this.front, { opacity: o });
    set(this.sheen, { opacity: 0.16 * o });
  }
  setOpacity(o, s = 1) {
    set(this.root, { opacity: o, transform: s === 1 ? '' : `translate(${this.cx} ${this.cy}) scale(${s}) translate(${-this.cx} ${-this.cy})`, display: o < 0.005 ? 'none' : '' });
  }
  tick(dt) {
    const span = this.len + 120;
    for (const c of this.cells) {
      c.x += this.flow * c.spd * dt;
      if (c.x > this.L + 60) c.x -= span;
      set(c.rbc.g, { transform: `translate(${c.x.toFixed(1)} ${c.y.toFixed(1)}) rotate(${c.rot.toFixed(0)}) scale(${c.sq.toFixed(2)} 1)` });
    }
    const k = Math.round(this.sugarLevel * this.sugar.length);
    this.sugar.forEach((s, i) => {
      const on = i < k;
      if (on !== s.on) { s.c.style.display = on ? '' : 'none'; s.on = on; }
      if (!on) return;
      s.x += this.flow * s.spd * dt;
      if (s.x > this.L + 60) s.x -= span;
      set(s.c, { cx: s.x, cy: s.y });
    });
  }
  // tube-local point -> SVG coordinates (for labels and leader lines)
  toScreen(x, y) {
    const a = (this.angle * Math.PI) / 180;
    return [this.cx + x * Math.cos(a) - y * Math.sin(a), this.cy + x * Math.sin(a) + y * Math.cos(a)];
  }
  setCellSugar(coat, spiky) {
    for (const c of this.cells) { c.rbc.setSugar(coat); c.rbc.setSpiky(spiky); }
  }
}

// ---------- cross-section ----------

const PRESETS = {
  healthy: { endR: 0.66, endOff: 0.02, plaque: '#eaa56a', rings: '#c98652', calcify: false },
  plaque: { endR: 0.26, endOff: 0.3, plaque: C.plaque, rings: C.plaqueDark, calcify: true },
};

export class CrossSection {
  constructor(parent, { cx, cy, R = 170, title = '', mode = 'healthy', seed = 11, dir = 35 }) {
    const P = PRESETS[mode];
    Object.assign(this, { R, P });
    this.Ri = R * 0.72;
    this.startR = R * 0.68;
    this.dir = [Math.cos((dir * Math.PI) / 180), Math.sin((dir * Math.PI) / 180)];
    this.root = el('g', { transform: `translate(${cx} ${cy})` }, parent);
    this.titleEl = el('text', { y: -R - 34, 'text-anchor': 'middle', class: 'svg-title', text: title }, this.root);
    this.note = el('text', { y: R + 56, 'text-anchor': 'middle', class: 'svg-note', text: '' }, this.root);
    this.pulse = el('g', {}, this.root);
    this.adv = el('circle', { r: R, fill: '#7d1e2a', stroke: '#ff9aa2', 'stroke-width': 2 }, this.pulse);
    this.media = el('circle', { r: R * 0.86, fill: '#b13a45' }, this.pulse);
    this.intima = el('circle', { r: this.Ri, fill: P.plaque }, this.pulse);
    this.ringsG = el('g', {}, this.pulse);
    this.rings = [];
    for (let k = 0; k < 8; k++) this.rings.push(el('circle', { fill: 'none', stroke: P.rings, 'stroke-width': 2.2, opacity: 0, r: 1 }, this.ringsG));
    this.calc = [];
    const rnd = rng(seed);
    if (P.calcify) {
      const end = this.lumenAt(1);
      let tries = 0;
      while (this.calc.length < 18 && tries++ < 2000) {
        const a = rnd() * Math.PI * 2, rad = Math.sqrt(rnd()) * (this.Ri - 9);
        const x = Math.cos(a) * rad, y = Math.sin(a) * rad;
        if (Math.hypot(x - end.x, y - end.y) < end.r + 10) continue;
        const s = 4 + rnd() * 6;
        const pts = [];
        for (let i = 0; i < 6; i++) { const b = (i / 6) * Math.PI * 2; const k = s * (0.6 + rnd() * 0.6); pts.push([x + Math.cos(b) * k, y + Math.sin(b) * k]); }
        this.calc.push({ x, y, thr: 0.05 + rnd() * 0.9, node: el('path', { d: smoothClosed(pts), fill: C.calcium, stroke: '#bdb6a6', 'stroke-width': 1, opacity: 0 }, this.pulse) });
      }
    }
    this.lumenC = el('circle', { fill: 'url(#bloodGrad)', stroke: C.lumenLine, 'stroke-width': 3 }, this.pulse);
    this.cellsG = el('g', {}, this.pulse);
    this.cells = [];
    for (let i = 0; i < 46; i++) {
      const a = rnd() * Math.PI * 2, rad = Math.sqrt(rnd()) * (this.startR - 12);
      const g = el('g', {}, this.cellsG);
      el('circle', { r: 9, fill: C.rbc, stroke: C.rbcRim, 'stroke-width': 1.2 }, g);
      el('circle', { r: 3.5, fill: '#f08a7e', opacity: 0.5 }, g);
      this.cells.push({ x: Math.cos(a) * rad, y: Math.sin(a) * rad, ph: rnd() * 6.28, g });
    }
  }
  lumenAt(t) {
    const r = lerp(this.startR, this.R * this.P.endR, t);
    const off = this.R * this.P.endOff * t;
    return { r, x: this.dir[0] * off, y: this.dir[1] * off };
  }
  // t: 0..1 years of repair; hard: 0..1 hardening; time: seconds (for heartbeat)
  update(t, hard, time, o = 1) {
    set(this.root, { opacity: o, display: o < 0.005 ? 'none' : '' });
    if (o < 0.005) return;
    const L = this.lumenAt(t);
    const beat = Math.pow(Math.max(0, Math.sin(time * Math.PI * 2 * 1.1)), 6);
    const amp = 0.04 * (1 - 0.92 * hard);
    set(this.pulse, { transform: `scale(${(1 + amp * beat).toFixed(4)})` });
    set(this.media, { fill: mix('#b13a45', '#9c8c86', hard * 0.85) });
    set(this.adv, { fill: mix('#7d1e2a', '#5e4a4c', hard * 0.6) });
    set(this.intima, { fill: mix('#eaa56a', this.P.plaque, clamp(t * 3)) });
    set(this.lumenC, { cx: L.x, cy: L.y, r: L.r });
    this.rings.forEach((ring, k) => {
      const tk = (k + 1) / 9;
      if (t <= tk) { set(ring, { opacity: 0 }); return; }
      const Lk = this.lumenAt(tk);
      set(ring, { cx: Lk.x, cy: Lk.y, r: Lk.r, opacity: 0.6 * clamp((t - tk) * 12) });
    });
    this.calc.forEach(c => {
      const outside = Math.hypot(c.x - L.x, c.y - L.y) > L.r + 7;
      set(c.node, { opacity: outside ? clamp((hard - c.thr) * 8) : 0 });
    });
    this.cells.forEach(c => {
      const x = c.x + Math.sin(time * 1.7 + c.ph) * 3, y = c.y + Math.cos(time * 1.3 + c.ph) * 3;
      const inside = Math.hypot(x - L.x, y - L.y) + 10 < L.r;
      set(c.g, { transform: `translate(${x.toFixed(1)} ${y.toFixed(1)})`, opacity: inside ? 1 : 0 });
    });
  }
}
