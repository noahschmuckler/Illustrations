// Blood sugar & A1c: capillaries, sugar-coated red cells ("powdered donuts"),
// what A1c measures, and how high sugar closes capillaries and damages larger arteries.

import { runModule } from '../js/scrolly.js';
import { el, set, seg, ease, easeOut, lerp, mix, rng, clamp, smoothOpen, blobPath } from '../js/core.js';
import { C, Tube, CrossSection, makeCrack, makeScar, makeRBC, place } from '../js/art.js';

const steps = [
  { id: 'bed', html: `<h2>Capillaries: where the work happens</h2><p>Arteries branch into smaller and smaller vessels, down to <b>capillaries</b> — a fine mesh running through every organ.</p><p>This is where oxygen and nutrients are handed off to your cells, and waste is picked up.</p>` },
  { id: 'single', weight: 1.2, html: `<h2>Single file</h2><p>Capillaries are so narrow that red blood cells squeeze through <b>one at a time</b>.</p>` },
  { id: 'sugar', html: `<h2>Sugar in the blood</h2><p>Your body keeps some <b class="sugar">sugar</b> in the blood at all times — it’s quick fuel for nearly everything.</p>` },
  { id: 'coat', weight: 1.3, html: `<h2>Powdered donuts</h2><p>Some of that sugar sticks to red blood cells, coating them like <b>powdered donuts</b>.</p><p>A red blood cell lives about <b>3 months</b>, collecting more coating the whole time.</p>` },
  { id: 'a1c', weight: 1.7, html: `<h2>That coating is your A1c</h2><p>The <b>A1c</b> measures how sugar-coated your red blood cells are — a picture of your average blood sugar over the last ~3 months.</p><p>More sugar in the blood → more coating → higher A1c.</p>` },
  { id: 'jagged', weight: 1.3, html: `<h2>Sharp edges</h2><p>At high levels it’s as if the cells are covered in <b>sharp sugar crystals</b>, scraping the delicate capillary walls as they squeeze through.</p>` },
  { id: 'close', weight: 1.2, html: `<h2>Capillaries shut down</h2><p>Damaged capillaries can simply <b>close off</b>. Blood stops flowing there, and the cells around it lose their supply.</p>` },
  { id: 'network', weight: 1.4, html: `<h2>Organs lose function</h2><p>As more of the network closes, organs work less well.</p><p>This is why high sugar damages the <b>eyes</b>, <b>kidneys</b>, and <b>nerves</b>.</p>` },
  { id: 'big', weight: 1.4, html: `<h2>Larger arteries too</h2><p>In bigger arteries, sugar causes more of the same <b>cracks</b> we see with cholesterol — so more repairs, and more plaque.</p>` },
  { id: 'narrow', weight: 1.5, html: `<h2>Thicker, harder, narrower</h2><p>Over years, those extra repairs thicken and harden the artery walls — raising the risk of heart attack and stroke.</p>` },
  { id: 'action', html: `<h2>The good news</h2><p>Every <b>1% drop in A1c</b> lowers the risk of eye, kidney, and nerve damage by roughly a third.</p><ul>
      <li>Below 5.7% — normal</li><li>5.7–6.4% — prediabetes</li><li>6.5% or higher — diabetes</li></ul>
      <p>Food choices, activity, weight, and medicines all bring it down.</p>` },
];

// A1c value (%) -> 0..1 amount of sugar shown
const sugarAmt = a => clamp((a - 4) / 8);
const eAG = a => Math.round(28.7 * a - 46.7); // estimated average glucose, mg/dL

let bedG, caps, links, bedCells, zoom;
let closeG, Y0 = 600, lumenPath, lumenClip, wallTop, wallBot, seamsG, tissueC, rbcs, sugar, nicks, exch, closeLabels;
let inset, lifeG, lifeCells, gaugeG, marker, markerText;
let tube, cracks, scars, csN, csH;

function buildBed(svg) {
  bedG = el('g', {}, svg);
  const d = el('defs', {}, bedG);
  const cg = el('linearGradient', { id: 'capGrad', gradientUnits: 'userSpaceOnUse', x1: 160, y1: 0, x2: 1040, y2: 0 }, d);
  el('stop', { offset: 0, 'stop-color': '#d0606c' }, cg);
  el('stop', { offset: 1, 'stop-color': '#8a64b0' }, cg);

  const r = rng(7);
  const cellsG = el('g', {}, bedG);
  const capG = el('g', {}, bedG);
  const vesselG = el('g', {}, bedG);

  // feeding artery (left) and draining vein (right)
  const art = [[140, -20], [170, 230], [150, 470], [176, 700], [158, 920]];
  const vein = [[1060, -20], [1030, 250], [1052, 490], [1024, 710], [1046, 920]];
  el('path', { d: smoothOpen(art), stroke: '#c43a46', 'stroke-width': 44, fill: 'none' }, vesselG);
  el('path', { d: smoothOpen(art), stroke: '#ec7880', 'stroke-width': 12, fill: 'none', opacity: 0.45, transform: 'translate(-8 0)' }, vesselG);
  el('path', { d: smoothOpen(vein), stroke: '#6d3f8f', 'stroke-width': 44, fill: 'none' }, vesselG);
  el('path', { d: smoothOpen(vein), stroke: '#a37ac8', 'stroke-width': 12, fill: 'none', opacity: 0.45, transform: 'translate(-8 0)' }, vesselG);
  el('text', { x: 205, y: 885, class: 'svg-small', text: '← from the artery' }, vesselG);
  el('text', { x: 995, y: 885, 'text-anchor': 'end', class: 'svg-small', text: 'back to the heart →' }, vesselG);

  // capillaries
  caps = [];
  for (let i = 0; i < 8; i++) {
    const y1 = 70 + i * 108 + (r() - 0.5) * 30;
    const y2 = y1 + (r() - 0.5) * 120;
    const pts = [[165, y1]];
    for (let k = 1; k <= 5; k++) pts.push([165 + (k / 6) * 870, lerp(y1, y2, k / 6) + (r() - 0.5) * 80]);
    pts.push([1035, y2]);
    const dd = smoothOpen(pts);
    const wall = el('path', { d: dd, stroke: 'url(#capGrad)', 'stroke-width': 13, fill: 'none', 'stroke-linecap': 'round' }, capG);
    const lum = el('path', { d: dd, stroke: '#3a0a12', 'stroke-width': 7, fill: 'none', 'stroke-linecap': 'round' }, capG);
    caps.push({ wall, lum, len: lum.getTotalLength(), cells: [], c: 0 });
  }
  // cross-links between neighbours
  links = [];
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < 2; j++) {
      const f = 0.2 + r() * 0.6;
      const a = caps[i].lum.getPointAtLength(f * caps[i].len), b = caps[i + 1].lum.getPointAtLength((f + (r() - 0.5) * 0.1) * caps[i + 1].len);
      const m = [(a.x + b.x) / 2 + (r() - 0.5) * 40, (a.y + b.y) / 2];
      const dd = smoothOpen([[a.x, a.y], m, [b.x, b.y]]);
      links.push({
        i,
        wall: el('path', { d: dd, stroke: 'url(#capGrad)', 'stroke-width': 10, fill: 'none' }, capG),
        lum: el('path', { d: dd, stroke: '#3a0a12', 'stroke-width': 5, fill: 'none' }, capG),
      });
    }
  }
  // red cells flowing single-file
  const rbcG = el('g', {}, capG);
  caps.forEach(c => {
    const n = Math.floor(c.len / 46);
    for (let k = 0; k < n; k++) c.cells.push({ k, node: el('circle', { r: 4.6, fill: '#ef3b45' }, rbcG) });
    c.n = n;
  });

  // tissue cells, each fed by its nearest capillary
  const samples = caps.map(c => Array.from({ length: 40 }, (_, k) => c.lum.getPointAtLength((k / 39) * c.len)));
  bedCells = [];
  for (let y = 40; y < 840; y += 58) {
    for (let x = 235; x < 990; x += 64) {
      const cx = x + (r() - 0.5) * 26, cy = y + (r() - 0.5) * 22;
      let best = 0, bd = 1e9;
      samples.forEach((ss, ci) => ss.forEach(p => { const dd = Math.hypot(p.x - cx, p.y - cy); if (dd < bd) { bd = dd; best = ci; } }));
      const g = el('g', { transform: `translate(${cx.toFixed(1)} ${cy.toFixed(1)})` }, cellsG);
      const body = el('path', { d: blobPath(27 + r() * 5, 21 + r() * 5, Math.floor(r() * 1e6), 0.16, 8), fill: C.tissue, opacity: 0.85 }, g);
      const nuc = el('circle', { cx: (r() - 0.5) * 8, cy: (r() - 0.5) * 6, r: 6.5, fill: '#7d4a5c' }, g);
      bedCells.push({ body, nuc, cap: best });
    }
  }
  zoom = caps[3].lum.getPointAtLength(caps[3].len * 0.5);
}

function edgeH(x, pinch) {
  return 50 * (1 - pinch * Math.exp(-Math.pow((x - 620) / 150, 2)));
}

function buildClose(svg) {
  closeG = el('g', {}, svg);
  const r = rng(19);

  // tissue cells above and below the capillary
  tissueC = [];
  [[440, 6], [770, 6]].forEach(([y, n]) => {
    for (let i = 0; i < n; i++) {
      const x = 110 + i * 196 + (r() - 0.5) * 40;
      const g = el('g', { transform: `translate(${x.toFixed(0)} ${(y + (r() - 0.5) * 20).toFixed(0)})` }, closeG);
      const body = el('path', { d: blobPath(78, 46, Math.floor(r() * 1e6), 0.12, 9), fill: C.tissue, opacity: 0.9 }, g);
      const nuc = el('circle', { cx: (r() - 0.5) * 30, r: 14, fill: '#7d4a5c' }, g);
      tissueC.push({ x, body, nuc });
    }
  });
  el('text', { x: 60, y: 384, class: 'svg-small', text: 'tissue cells' }, closeG);

  // oxygen / nutrients out, waste in
  exch = [];
  const exG = el('g', {}, closeG);
  for (let i = 0; i < 34; i++) {
    const up = i % 2 === 0;
    const out = r() < 0.65;
    exch.push({
      x: 40 + r() * 1120, up, out, ph: r(), node: el('circle', { r: out ? 7 : 6, fill: out ? '#ffe9b8' : '#9fe08f', stroke: out ? '#fff7e0' : '#d8ffd0', 'stroke-width': 1.5, opacity: 0 }, exG),
    });
  }

  // capillary
  const id = 'capclip';
  const cp = el('clipPath', { id }, closeG);
  lumenClip = el('path', {}, cp);
  lumenPath = el('path', { fill: '#2a0a10' }, closeG);
  wallTop = el('path', { fill: '#c8606a', stroke: '#f09aa2', 'stroke-width': 1.5 }, closeG);
  wallBot = el('path', { fill: '#c8606a', stroke: '#f09aa2', 'stroke-width': 1.5 }, closeG);
  seamsG = el('g', {}, closeG);
  nicks = [];
  const nickG = el('g', {}, closeG);
  for (let i = 0; i < 46; i++) {
    const top = r() < 0.5;
    const s = 0.7 + r() * 0.7;
    const pts = top ? `-6,0 -2,${-12 * s} 1,-5 4,${-15 * s} 7,0` : `-6,0 -2,${12 * s} 1,5 4,${15 * s} 7,0`;
    nicks.push({ x: 30 + r() * 1140, top, thr: r(), node: el('polygon', { points: pts, fill: '#3a0508', stroke: '#ffd2c8', 'stroke-width': 0.8, opacity: 0 }, nickG) });
  }
  const inner = el('g', { 'clip-path': `url(#${id})` }, closeG);
  sugar = [];
  for (let i = 0; i < 80; i++) {
    sugar.push({ x: r() * 1300, y: (r() - 0.5) * 84, node: el('circle', { r: 5, fill: 'url(#sugarGrad)', style: 'display:none' }, inner), on: false });
  }
  rbcs = [];
  for (let i = 0; i < 10; i++) rbcs.push({ i, age: 0.25 + r() * 0.75, cell: makeRBC(inner, 40, 50 + i) });

  closeLabels = el('g', { opacity: 0 }, closeG);
  el('circle', { cx: 400, cy: 862, r: 7, fill: '#ffe9b8' }, closeLabels);
  el('text', { x: 416, y: 869, class: 'svg-small', text: 'oxygen & nutrients out' }, closeLabels);
  el('circle', { cx: 700, cy: 862, r: 6, fill: '#9fe08f' }, closeLabels);
  el('text', { x: 716, y: 869, class: 'svg-small', text: 'waste in' }, closeLabels);
}

function buildInset(svg) {
  inset = el('g', {}, svg);
  // a red cell's ~3-month life
  lifeG = el('g', { opacity: 0 }, inset);
  el('text', { x: 600, y: 74, 'text-anchor': 'middle', class: 'svg-label', text: 'One red blood cell’s ~3-month life' }, lifeG);
  el('path', { d: 'M 250 140 L 960 140', stroke: '#5a6680', 'stroke-width': 3, 'marker-end': 'none' }, lifeG);
  el('path', { d: 'M 950 130 L 966 140 L 950 150', stroke: '#5a6680', 'stroke-width': 3, fill: 'none' }, lifeG);
  lifeCells = ['new', '1 month', '2 months', '3 months'].map((label, i) => {
    const x = 300 + i * 200;
    const c = makeRBC(lifeG, 34, 200 + i);
    place(c.g, x, 140);
    el('text', { x, y: 202, 'text-anchor': 'middle', class: 'svg-small', text: label }, lifeG);
    return { c, age: [0.08, 0.38, 0.68, 1][i] };
  });

  // A1c gauge
  gaugeG = el('g', { opacity: 0 }, inset);
  const X = a => 200 + ((a - 4) / 9) * 800;
  [[4, 5.7, '#3fbf7f'], [5.7, 6.5, '#e8b84a'], [6.5, 13, '#e0565e']].forEach(([a, b, c]) => {
    el('rect', { x: X(a), y: 282, width: X(b) - X(a), height: 16, fill: c, opacity: 0.85 }, gaugeG);
  });
  [[4.85, 'normal'], [6.1, 'prediabetes'], [9.75, 'diabetes']].forEach(([a, t]) => el('text', { x: X(a), y: 324, 'text-anchor': 'middle', class: 'svg-small', text: t }, gaugeG));
  [5.7, 6.5, 8, 10, 12].forEach(a => el('text', { x: X(a), y: 276, 'text-anchor': 'middle', class: 'svg-small', style: 'font-size:15px', text: a + '%' }, gaugeG));
  marker = el('polygon', { points: '-11,-16 11,-16 0,0', fill: C.ink }, gaugeG);
  markerText = el('text', { y: 238, 'text-anchor': 'middle', class: 'svg-label', text: '' }, gaugeG);
  gaugeG.X = X;
}

function buildBig(svg) {
  tube = new Tube(svg, { cells: 18, sugarDots: 60, seed: 9 });
  tube.setFront(0.16);
  const spots = [[-320, -70, -8], [-170, 62, 6], [-40, -48, 3], [80, 78, -5], [210, -82, 7], [330, 34, -4], [-250, 10, 12], [140, -5, -10]];
  cracks = spots.map(([x, y, a], i) => makeCrack(tube.deco, { x, y, angle: a, len: 110 + (i % 3) * 20, gap: 18, seed: 60 + i }));
  scars = cracks.map((c, i) => makeScar(c, 80 + i, 0.85));
  csN = new CrossSection(svg, { cx: 320, cy: 480, R: 165, title: 'Normal A1c', mode: 'healthy', seed: 5 });
  csH = new CrossSection(svg, { cx: 880, cy: 480, R: 165, title: 'High A1c, for years', mode: 'plaque', seed: 9 });
  csH.titleEl.classList.add('sugar-fill');
}

function build(svg) {
  buildBed(svg);
  buildClose(svg);
  buildInset(svg);
  buildBig(svg);
}

let flowOff = 0;
let bedFlow = 0;

function render(S, time, dt) {
  const sSingle = S('single'), sSugar = S('sugar'), sCoat = S('coat'), sA1c = S('a1c'), sJag = S('jagged');
  const sClose = S('close'), sNet = S('network'), sBig = S('big'), sNarrow = S('narrow');

  // ----- A1c level drives everything sugary -----
  const A = lerp(lerp(5.3, 9.5, ease(seg(sA1c, 0.2, 0.85))), 11, ease(seg(sJag, 0, 0.5)));
  const amt = sugarAmt(A);

  // ----- capillary bed (zoom in, later zoom back out) -----
  const zIn = ease(seg(sSingle, 0, 0.5));
  const zOut = ease(seg(sNet, 0, 0.4));
  const z = zIn * (1 - zOut);
  const bedO = (1 - seg(z, 0.35, 0.8)) * (1 - seg(sBig, 0, 0.3));
  set(bedG, { opacity: bedO, display: bedO < 0.005 ? 'none' : '', transform: `translate(${zoom.x} ${zoom.y}) scale(${lerp(1, 5, z).toFixed(3)}) translate(${-zoom.x} ${-zoom.y})` });
  if (bedO > 0.005) {
    const order = [3, 6, 1, 5, 0];
    caps.forEach((c, i) => {
      const k = order.indexOf(i);
      c.c = k === -1 ? 0 : k === 0 ? seg(sClose, 0.3, 0.8) : ease(seg(sNet, 0.35 + (k - 1) * 0.13, 0.5 + (k - 1) * 0.13));
      set(c.wall, { 'stroke-width': lerp(13, 5, c.c), stroke: c.c > 0.01 ? mix('#c85a68', '#4b4652', c.c) : 'url(#capGrad)' });
      set(c.lum, { 'stroke-width': lerp(7, 0, c.c), opacity: 1 - c.c });
    });
    links.forEach(l => {
      const c = Math.max(caps[l.i].c, caps[l.i + 1].c) * 0.9;
      set(l.wall, { 'stroke-width': lerp(10, 4, c), stroke: c > 0.01 ? mix('#b0607a', '#4b4652', c) : 'url(#capGrad)' });
      set(l.lum, { 'stroke-width': lerp(5, 0, c), opacity: 1 - c });
    });
    bedFlow += dt * 55;
    caps.forEach(c => {
      const sp = c.n * 46;
      c.cells.forEach(cell => {
        const d = (cell.k * 46 + bedFlow * (1 - c.c)) % sp;
        const p = c.lum.getPointAtLength(Math.min(d, c.len));
        set(cell.node, { cx: p.x, cy: p.y, opacity: d > c.len ? 0 : 1 - Math.min(1, c.c * 2.5) });
      });
    });
    bedCells.forEach(t => {
      const sick = caps[t.cap].c;
      set(t.body, { fill: mix(C.tissue, C.tissueDead, sick) });
      set(t.nuc, { opacity: 1 - 0.7 * sick });
    });
  }

  // ----- single capillary close-up -----
  const closeO = seg(zIn, 0.45, 0.9) * (1 - seg(zOut, 0, 0.45));
  set(closeG, { opacity: closeO, display: closeO < 0.005 ? 'none' : '', transform: `translate(600 600) scale(${lerp(0.55, 1, seg(zIn, 0.4, 1)) * lerp(1, 0.6, zOut)}) translate(-600 -600)` });
  if (closeO > 0.005) {
    const pinch = ease(seg(sClose, 0.1, 0.75));
    const speed = 85 * Math.pow(1 - pinch, 1.4);
    flowOff += speed * dt;

    // walls follow the pinch
    if (closeG.__pinch !== pinch.toFixed(3)) {
      closeG.__pinch = pinch.toFixed(3);
      const xs = [];
      for (let x = -60; x <= 1260; x += 15) xs.push(x);
      const topIn = xs.map(x => [x, Y0 - edgeH(x, pinch)]);
      const botIn = xs.map(x => [x, Y0 + edgeH(x, pinch)]);
      const P = pts => pts.map(p => `${p[0]} ${p[1].toFixed(1)}`).join(' L ');
      const lum = `M ${P(topIn)} L ${P(botIn.slice().reverse())} Z`;
      set(lumenPath, { d: lum });
      set(lumenClip, { d: lum });
      set(wallTop, { d: `M ${P(topIn)} L ${P(topIn.slice().reverse().map(([x, y]) => [x, y - 18]))} Z` });
      set(wallBot, { d: `M ${P(botIn)} L ${P(botIn.slice().reverse().map(([x, y]) => [x, y + 18]))} Z` });
      seamsG.innerHTML = '';
      for (let x = 40; x < 1200; x += 150) {
        [-1, 1].forEach(s => {
          const y = Y0 + s * edgeH(x, pinch);
          el('line', { x1: x, y1: y, x2: x, y2: y + s * 18, stroke: '#8a3440', 'stroke-width': 2 }, seamsG);
          el('ellipse', { cx: x + 75, cy: Y0 + s * (edgeH(x + 75, pinch) + 9), rx: 16, ry: 5, fill: '#8a3440' }, seamsG);
        });
      }
    }

    // red cells, single file
    const span = 1300;
    rbcs.forEach(({ i, age, cell }) => {
      const x = ((i * 130 + flowOff) % span) - 50;
      cell.setSugar(amt * age * 1.15 * seg(sCoat, 0.15, 0.45));
      cell.setSpiky(ease(seg(sJag, 0.1, 0.5)));
      set(cell.g, { transform: `translate(${x.toFixed(1)} ${Y0}) rotate(${(x * 0.15).toFixed(1)})` });
    });
    // sugar in the plasma
    const k = Math.round(sugar.length * amt * seg(sSugar, 0.1, 0.5));
    sugar.forEach((s, i) => {
      const on = i < k;
      if (on !== s.on) { s.node.style.display = on ? '' : 'none'; s.on = on; }
      if (!on) return;
      const x = ((s.x + flowOff * 1.05) % span) - 50;
      set(s.node, { cx: x, cy: Y0 + s.y * edgeH(x, pinch) / 50 });
    });
    // scrapes in the wall
    const dmg = seg(sJag, 0.3, 0.9) + 0.4 * seg(sClose, 0, 0.6);
    nicks.forEach(n => {
      const y = Y0 + (n.top ? -1 : 1) * edgeH(n.x, pinch);
      set(n.node, { transform: `translate(${n.x.toFixed(0)} ${y.toFixed(1)})`, opacity: clamp((dmg - n.thr) * 6) });
    });
    // exchange with tissue, fading where flow stops
    const exO = seg(sSingle, 0.6, 0.9) * (1 - seg(sCoat, 0, 0.3) * 0.6);
    exch.forEach(e => {
      const f = (time * 0.45 + e.ph) % 1;
      const local = 1 - pinch * (0.4 + 0.6 * Math.exp(-Math.pow((e.x - 620) / 260, 2)));
      const s = e.up ? -1 : 1;
      const d0 = 70, d1 = 160;
      const dist = e.out ? lerp(d0, d1, f) : lerp(d1, d0, f);
      const o = Math.sin(f * Math.PI) * exO * local;
      set(e.node, { cx: e.x, cy: Y0 + s * dist, opacity: o });
    });
    set(closeLabels, { opacity: exO });
    tissueC.forEach(t => {
      const sick = pinch * (0.35 + 0.65 * Math.exp(-Math.pow((t.x - 620) / 260, 2)));
      set(t.body, { fill: mix(C.tissue, C.tissueDead, sick) });
      set(t.nuc, { opacity: 1 - 0.7 * sick });
    });
  }

  // ----- inset: life of a red cell + A1c gauge -----
  const insetO = closeO * (1 - seg(sClose, 0, 0.2));
  const lifeO = seg(sCoat, 0.45, 0.65) * (1 - seg(sA1c, 0, 0.15));
  set(lifeG, { opacity: lifeO * insetO, display: lifeO * insetO < 0.005 ? 'none' : '' });
  lifeCells.forEach(({ c, age }) => c.setSugar(amt * age * 1.15));
  const gO = seg(sA1c, 0.05, 0.2) * insetO;
  set(gaugeG, { opacity: gO, display: gO < 0.005 ? 'none' : '' });
  if (gO > 0.005) {
    const x = gaugeG.X(A);
    set(marker, { transform: `translate(${x.toFixed(1)} 280)` });
    set(markerText, { x: clamp(x, 330, 870), text: `A1c ${A.toFixed(1)}%  ·  average sugar ≈ ${eAG(A)} mg/dL` });
  }

  // ----- larger artery -----
  const tubeO = seg(sBig, 0.15, 0.4) * (1 - seg(sNarrow, 0, 0.3));
  tube.setOpacity(tubeO);
  if (tubeO > 0.005) {
    tube.sugarLevel = 0.85;
    tube.setCellSugar(0.85, 1);
    tube.tick(dt);
    cracks.forEach((c, i) => c.grow(easeOut(seg(sBig, 0.3 + i * 0.05, 0.45 + i * 0.05))));
    scars.forEach((s, i) => {
      const o = seg(sBig, 0.62 + i * 0.04, 0.75 + i * 0.04);
      set(s, { opacity: o, transform: `scale(${lerp(0.5, 1, easeOut(o)).toFixed(3)})` });
    });
  }

  // ----- cross-sections -----
  const csO = seg(sNarrow, 0.15, 0.4);
  const t = ease(seg(sNarrow, 0.25, 0.8));
  const hard = ease(seg(sNarrow, 0.5, 0.95));
  csN.update(t, 0, time, csO);
  csH.update(t, hard, time, csO);
  set(csN.note, { text: t > 0.5 ? 'open & flexible' : '' });
  set(csH.note, { text: t > 0.5 ? (hard > 0.4 ? 'narrowed & hardened' : 'thickening') : '' });
}

runModule({ title: 'Blood Sugar & A1c', steps, build, render });
