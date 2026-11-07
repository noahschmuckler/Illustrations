// Triglycerides: extra energy (alcohol, sugar, fat) -> the liver makes triglycerides;
// genes matter too. Triglycerides thicken and inflame LDL plaque (same end point as LDL
// and sugar), and very high levels clog pancreas capillaries -> pancreatitis.

import { runModule } from '../js/scrolly.js';
import { el, set, seg, ease, lerp, rng, clamp, smoothClosed, blobPath } from '../js/core.js';
import { C, Tube, CrossSection, Capillary, makeCrack, makeScar, makeTG, makeLDL, place } from '../js/art.js';

const steps = [
  { id: 'liver', weight: 1.2, html: `<h2>Extra energy goes to the liver</h2><p>When more energy comes in than your body needs right now, the liver packs the extra away as <b class="tg">triglycerides</b> — fat for storage — and sends them out into the blood.</p>` },
  { id: 'alcohol', weight: 1.2, html: `<h2>Alcohol: pure extra energy</h2><p>Alcohol is loaded with energy and nothing else your body needs. The liver turns much of it straight into <b class="tg">triglycerides</b>.</p>` },
  { id: 'sugarfat', weight: 1.2, html: `<h2>Sugar and fat, too</h2><p>Sweets, sugary drinks, white bread and pasta, and large amounts of fatty food all add extra energy — and more triglycerides.</p>` },
  { id: 'genes', html: `<h2>Genes play a part</h2><p>Some people’s livers make more triglycerides, or clear them more slowly. The same diet raises their levels more — which is why high triglycerides can run in families.</p>` },
  { id: 'meet', weight: 1.1, html: `<h2>Triglycerides in the blood</h2><p>Triglycerides travel in the blood as <b class="tg">oily droplets</b>. When there are a lot of them, the blood can even look milky.</p>` },
  { id: 'plaque', weight: 1.5, html: `<h2>They make LDL bumps worse</h2><p>Remember the bulging <b class="ldl">LDL</b> repairs? Triglycerides seep into them, making them <b>thicker</b> — and more <b>irritated and inflamed</b>.</p>` },
  { id: 'narrow', weight: 1.4, html: `<h2>The same end point</h2><p>So high triglycerides lead to the same place as high LDL and high blood sugar: thicker, harder, narrower arteries — the setup for heart attacks and strokes.</p>` },
  { id: 'pancreas', weight: 1.3, html: `<h2>Meet the pancreas</h2><p>The pancreas makes powerful <b class="enzyme">digestive enzymes</b>. They’re made inside pancreas cells and sent into the intestine to break down food.</p>` },
  { id: 'pcap', html: `<h2>Pancreas cells need blood too</h2><p>Like every organ, the pancreas is threaded with capillaries that feed its enzyme-packed cells.</p>` },
  { id: 'clog', weight: 1.4, html: `<h2>Very high levels clog capillaries</h2><p>When triglycerides get very high, the blood turns thick and milky, and the oily droplets can <b>jam the tiny capillaries</b>.</p>` },
  { id: 'die', weight: 1.6, html: `<h2>The pancreas digests itself</h2><p>Without blood, pancreas cells die and burst open. Their <b class="enzyme">enzymes</b> spill out and start digesting the pancreas itself.</p><p>This is <b>pancreatitis</b> — severe belly pain, usually a hospital stay.</p>` },
  { id: 'action', weight: 1.2, html: `<h2>What we can do</h2><ul>
      <li>Cut back on <b>alcohol</b> — often the biggest single change</li>
      <li>Cut <b>sugar</b> and refined carbs: sweets, sugary drinks, white bread</li>
      <li>Cut <b>excess fat</b>; lose weight and move more</li>
      <li>Keep blood sugar under control</li>
      <li>If that isn’t enough, <b>medicines</b> help: a statin to protect the arteries, and for very high levels, fenofibrate or prescription fish oil to prevent pancreatitis</li></ul>` },
];

const ENZ = '#9be15d', ENZ_EDGE = '#3f7a1c';
const zoomT = (x, y, s) => `translate(${x} ${y}) scale(${s.toFixed(3)}) translate(${-x} ${-y})`;
const show = (node, o) => set(node, { opacity: o, display: o < 0.005 ? 'none' : '' });
const bez = (p0, p1, p2, p3, t) => {
  const u = 1 - t;
  return [0, 1].map(k => u * u * u * p0[k] + 3 * u * u * t * p1[k] + 3 * u * t * t * p2[k] + t * t * t * p3[k]);
};
// pac-man "enzyme" outline; mouth = half-angle of the open mouth in radians
function pac(r, mouth) {
  const x = (r * Math.cos(mouth)).toFixed(1), y = (r * Math.sin(mouth)).toFixed(1);
  return `M 0 0 L ${x} ${-y} A ${r} ${r} 0 1 0 ${x} ${y} Z`;
}
function makeEnzyme(parent, r = 9) {
  const node = el('path', { d: pac(r, 0.5), fill: ENZ, stroke: ENZ_EDGE, 'stroke-width': 1.3 }, parent);
  return { node, r, ph: Math.random() * 6.28 };
}
function chomp(e, time, speed = 6) {
  set(e.node, { d: pac(e.r, 0.12 + 0.5 * Math.abs(Math.sin(time * speed + e.ph))) });
}

// pick which particles of a pool are visible so they spread out evenly
const spread = (i, rate) => (i * 0.6180339) % 1 < rate;

// TG lab gauge: non-linear scale so the important cut-offs get room
const TG_STOPS = [[0, 0], [150, 0.28], [500, 0.58], [1000, 0.8], [2000, 1]];
function tgPos(v) {
  for (let i = 1; i < TG_STOPS.length; i++) {
    const [a, pa] = TG_STOPS[i - 1], [b, pb] = TG_STOPS[i];
    if (v <= b) return lerp(pa, pb, (v - a) / (b - a));
  }
  return 1;
}

let gauge, gMarker, gText;
let liverG, streams, tgOut, liverFat, sources, dna, dnaA, dnaB, dnaRungs;
let tube, tubeTG, scars, tubeMilk, scarLabel, legend;
let csN, csH, csHead;
let pancG, panZoom, food, ductEnz, gutEnz, ductPath, gutPath;
let capG, cap, capTG, capMilk, clump, glow, pTitle;

function buildGauge(svg) {
  gauge = el('g', { opacity: 0 }, svg);
  const X0 = 280, W = 720, Y = 98;
  gauge.X = v => X0 + W * tgPos(v);
  [[0, 150, '#3fbf7f'], [150, 500, '#e8b84a'], [500, 1000, '#ef7d3a'], [1000, 2000, '#e0464e']].forEach(([a, b, c]) =>
    el('rect', { x: gauge.X(a), y: Y, width: gauge.X(b) - gauge.X(a), height: 14, fill: c, opacity: 0.88 }, gauge));
  [150, 500, 1000].forEach(v => el('text', { x: gauge.X(v), y: Y + 34, 'text-anchor': 'middle', class: 'svg-small', style: 'font-size:15px', text: v }, gauge));
  [[75, 'normal'], [320, 'high'], [740, 'very high'], [1500, 'pancreatitis risk']].forEach(([v, t]) =>
    el('text', { x: gauge.X(v), y: Y + 56, 'text-anchor': 'middle', class: 'svg-small', style: 'font-size:16px', text: t }, gauge));
  gMarker = el('polygon', { points: '-11,-16 11,-16 0,0', fill: C.ink }, gauge);
  gText = el('text', { y: Y - 24, 'text-anchor': 'middle', class: 'svg-label', style: 'font-size:26px', text: '' }, gauge);
}

function buildLiver(svg) {
  liverG = el('g', {}, svg);
  const r = rng(3);

  // where the extra energy comes from
  sources = {};
  const srcG = el('g', {}, liverG);
  const mk = (key, y, label, draw) => {
    const g = el('g', { transform: `translate(130 ${y})` }, srcG);
    draw(g);
    el('text', { y: 62, 'text-anchor': 'middle', class: 'svg-small', text: label }, g);
    sources[key] = { g, y };
  };
  mk('sugar', 210, 'sugar & refined carbs', g => {
    [[-22, 10], [8, 10], [-7, -20]].forEach(([x, y]) => el('rect', { x: x - 2, y: y - 6, width: 28, height: 26, rx: 3, fill: '#e3f0ff', stroke: C.sugar, 'stroke-width': 2.5 }, g));
  });
  mk('fat', 450, 'excess fat', g => {
    el('path', { d: 'M 0 -34 C 18 -8 28 6 28 18 A 28 28 0 0 1 -28 18 C -28 6 -18 -8 0 -34 Z', fill: '#ffd84d', stroke: '#b8901c', 'stroke-width': 2.5 }, g);
    el('ellipse', { cx: -9, cy: 10, rx: 6, ry: 9, fill: '#fff6c8', opacity: 0.8 }, g);
  });
  mk('alcohol', 690, 'alcohol', g => {
    el('path', { d: 'M -24 -34 L 24 -34 C 24 -6 14 8 0 10 C -14 8 -24 -6 -24 -34 Z', fill: 'none', stroke: '#e0d0ff', 'stroke-width': 2.5 }, g);
    el('path', { d: 'M -22 -18 L 22 -18 C 20 -2 12 7 0 8 C -12 7 -20 -2 -22 -18 Z', fill: '#a66cff' }, g);
    el('path', { d: 'M 0 10 L 0 32 M -16 34 L 16 34', stroke: '#e0d0ff', 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
  });

  // particle streams into the liver
  const streamDefs = {
    sugar: { from: [175, 205], c1: [270, 200], c2: [330, 330], to: [420, 370], make: g => el('circle', { r: 5.5, fill: 'url(#sugarGrad)' }, g) },
    fat: { from: [175, 450], c1: [260, 450], c2: [320, 455], to: [420, 460], make: g => el('circle', { r: 6.5, fill: '#ffd84d', stroke: '#b8901c', 'stroke-width': 1.2 }, g) },
    alcohol: { from: [175, 670], c1: [270, 680], c2: [330, 570], to: [430, 540], make: g => el('circle', { r: 6.5, fill: '#a66cff', stroke: '#e0d0ff', 'stroke-width': 1.2 }, g) },
  };
  const streamG = el('g', {}, liverG);
  streams = {};
  for (const [k, d] of Object.entries(streamDefs)) {
    streams[k] = { ...d, pts: Array.from({ length: 44 }, (_, i) => ({ ph: i / 44 + r() * 0.02, off: (r() - 0.5) * 44, node: d.make(streamG) })) };
  }

  // out to the blood
  el('path', { d: 'M 780 430 C 920 430 1040 470 1280 470', stroke: '#a8323e', 'stroke-width': 56, fill: 'none' }, liverG);
  el('path', { d: 'M 780 430 C 920 430 1040 470 1280 470', stroke: '#3a0a12', 'stroke-width': 40, fill: 'none' }, liverG);
  const outG = el('g', {}, liverG);
  tgOut = Array.from({ length: 34 }, (_, i) => ({ ph: i / 34 + r() * 0.02, off: (r() - 0.5) * 22, node: makeTG(outG, 9 + r() * 3) }));
  el('text', { x: 1040, y: 540, 'text-anchor': 'middle', class: 'svg-label tg-fill', style: 'font-size:26px', text: 'triglycerides → blood' }, liverG);

  // the liver
  const liverPts = [[430, 300], [560, 262], [720, 266], [880, 290], [948, 318], [890, 384], [760, 436], [640, 520], [520, 600], [430, 606], [376, 540], [370, 400]];
  const d = el('defs', {}, liverG);
  const lg = el('radialGradient', { id: 'liverGrad', cx: 0.35, cy: 0.35, r: 0.8 }, d);
  [[0, '#c7604a'], [0.6, '#953a2c'], [1, '#6a2219']].forEach(([o, c]) => el('stop', { offset: o, 'stop-color': c }, lg));
  el('path', { d: smoothClosed(liverPts), fill: 'url(#liverGrad)', stroke: '#e08a74', 'stroke-width': 2.5 }, liverG);
  el('path', { d: 'M 470 330 C 560 300 680 296 800 312', stroke: '#ffffff', 'stroke-width': 10, 'stroke-linecap': 'round', fill: 'none', opacity: 0.12 }, liverG);
  const lc = el('clipPath', { id: 'liverClip' }, d);
  el('path', { d: smoothClosed(liverPts) }, lc);
  liverFat = el('g', { opacity: 0, 'clip-path': 'url(#liverClip)' }, liverG);
  for (let i = 0; i < 16; i++) {
    const tg = makeTG(liverFat, 6 + r() * 5);
    const x = lerp(420, 880, r());
    place(tg, x, lerp(310, x < 640 ? 560 : 400, r()), 1, 0.85);
  }
  el('text', { x: 600, y: 470, 'text-anchor': 'middle', class: 'svg-big', text: 'liver' }, liverG);

  // genes
  dna = el('g', { opacity: 0, transform: 'translate(640 735)' }, liverG);
  dnaRungs = el('g', {}, dna);
  dnaA = el('path', { fill: 'none', stroke: '#7cc4ff', 'stroke-width': 4 }, dna);
  dnaB = el('path', { fill: 'none', stroke: '#ff8fb1', 'stroke-width': 4 }, dna);
  el('text', { y: 72, 'text-anchor': 'middle', class: 'svg-label', style: 'font-size:26px', text: 'your genes' }, dna);
  el('path', { d: 'M 0 -40 L 0 -128', class: 'leader' }, dna);
  el('path', { d: 'M -9 -116 L 0 -130 L 9 -116', stroke: C.ink, 'stroke-width': 2, fill: 'none' }, dna);
}

function buildTube(svg) {
  tube = new Tube(svg, { cells: 14, seed: 5 });
  tube.setFront(0.24);
  const L = tube.L;
  const spots = [{ x: -210, y: -58, angle: -6, seed: 5 }, { x: 160, y: -54, angle: 5, seed: 9 }, { x: -20, y: 66, angle: -3, seed: 13 }];
  const r = rng(77);
  scars = spots.map((s, i) => {
    const crack = makeCrack(tube.deco, { ...s, len: 150, gap: 22 });
    crack.grow(1, 0);
    const rx = 150 * 0.62 * 0.9, ry = 22 * 2.3 * 0.9;
    const glowEl = el('ellipse', { rx: rx * 1.5, ry: ry * 1.9, fill: 'url(#inflameGrad)', opacity: 0 }, crack.g);
    const scar = makeScar(crack, 21 + i * 7, 0.9);
    crack.g.appendChild(scar);
    set(scar, { opacity: 1 });
    const tint = el('path', { d: blobPath(rx, ry, 21 + i * 7, 0.12), fill: '#ff4a2a', stroke: '#ff2a1a', 'stroke-width': 4, opacity: 0 }, scar);
    const spotsIn = Array.from({ length: 6 }, () => {
      const a = r() * 6.28, k = Math.sqrt(r()) * 0.6;
      const t = makeTG(scar, 5 + r() * 3);
      place(t, Math.cos(a) * rx * k, Math.sin(a) * ry * k, 1, 0);
      return { t, x: Math.cos(a) * rx * k, y: Math.sin(a) * ry * k, thr: r() };
    });
    return { ...s, crack, scar, glow: glowEl, tint, spotsIn };
  });
  // milky plasma (behind the flowing droplets, over the red cells)
  tubeMilk = el('rect', { x: -L, y: -tube.r, width: tube.len, height: tube.r * 2, fill: '#f6ead0', opacity: 0 }, tube.lumen);
  tubeTG = Array.from({ length: 28 }, (_, i) => ({
    x: -L + r() * tube.len, y: (r() - 0.5) * 2 * (tube.r - 22), spd: 0.7 + r() * 0.5,
    node: makeTG(tube.particles, 9 + r() * 4), target: i < 12 ? i % 3 : -1, ph: r(),
  }));

  scarLabel = el('g', { opacity: 0 }, svg);
  const lt = el('text', { x: 140, y: 120, class: 'svg-label', text: 'LDL bumps' }, scarLabel);
  scarLabel.text = lt;
  [scars[0], scars[1]].forEach((s, i) => {
    const p = tube.toScreen(s.x, s.y - 40);
    el('path', { d: `M ${200 + i * 90} 136 Q ${p[0] - 60} ${p[1] - 100} ${p[0]} ${p[1]}`, class: 'leader' }, scarLabel);
  });

  legend = el('g', { opacity: 0 }, svg);
  const big = makeTG(legend, 30);
  place(big, 1000, 730);
  el('text', { x: 1000, y: 741, 'text-anchor': 'middle', class: 'particle-name', fill: '#5a2a04', style: 'font-size:26px', text: 'TG' }, legend);
  el('text', { x: 1000, y: 800, 'text-anchor': 'middle', class: 'svg-note', text: 'triglyceride' }, legend);
  const ldl = makeLDL(legend, 26, 3);
  place(ldl, 840, 730);
  el('text', { x: 840, y: 800, 'text-anchor': 'middle', class: 'svg-note', text: 'LDL' }, legend);
}

function buildCross(svg) {
  csN = new CrossSection(svg, { cx: 320, cy: 490, R: 165, title: 'Normal triglycerides', mode: 'healthy', seed: 6 });
  csH = new CrossSection(svg, { cx: 880, cy: 490, R: 165, title: 'High triglycerides', mode: 'plaque', seed: 12 });
  csH.titleEl.classList.add('tg-fill');
  csHead = el('text', { x: 600, y: 120, 'text-anchor': 'middle', class: 'svg-label', opacity: 0 }, svg);
  [['High LDL', C.ldl], [' · ', C.inkDim], ['high sugar', C.sugar], [' · ', C.inkDim], ['high triglycerides', '#ffad4a'], ['  → same result', C.ink]].forEach(([t, c]) =>
    el('tspan', { fill: c, text: t }, csHead));
}

function buildPancreas(svg) {
  pancG = el('g', {}, svg);
  const r = rng(31);
  // small intestine (duodenum) curling around the head of the pancreas
  const gut = [[360, 160], [150, 190], [150, 720], [370, 740]];
  gutPath = gut;
  const gd = `M ${gut[0]} C ${gut[1]} ${gut[2]} ${gut[3]}`;
  el('path', { d: gd, stroke: '#c9786c', 'stroke-width': 76, fill: 'none', 'stroke-linecap': 'round' }, pancG);
  el('path', { d: gd, stroke: '#3a1416', 'stroke-width': 50, fill: 'none', 'stroke-linecap': 'round' }, pancG);
  el('text', { x: 90, y: 120, class: 'svg-small', text: 'intestine' }, pancG);
  const foodG = el('g', {}, pancG);
  food = Array.from({ length: 9 }, (_, i) => {
    const pts = Array.from({ length: 6 }, (_, k) => { const a = (k / 6) * 6.28, s = 9 + r() * 7; return [Math.cos(a) * s, Math.sin(a) * s]; });
    return { ph: i / 9, off: (r() - 0.5) * 22, node: el('path', { d: smoothClosed(pts), fill: r() < 0.5 ? '#a57a3e' : '#7f9a43', stroke: '#2a1a0a', 'stroke-width': 1 }, foodG) };
  });

  // the pancreas: a lumpy gland made of lobules
  const shape = [[262, 400], [360, 340], [520, 330], [700, 300], [880, 268], [1030, 266], [1086, 300], [1040, 342], [880, 362], [700, 404], [540, 444], [460, 530], [370, 566], [290, 528], [256, 460]];
  const sd = smoothClosed(shape);
  const cp = el('clipPath', { id: 'pancClip' }, pancG);
  el('path', { d: sd }, cp);
  el('path', { d: sd, fill: '#e2a370', stroke: '#f6c79a', 'stroke-width': 3 }, pancG);
  const lob = el('g', { 'clip-path': 'url(#pancClip)' }, pancG);
  for (let i = 0; i < 160; i++) {
    el('circle', { cx: lerp(250, 1090, r()), cy: lerp(260, 570, r()), r: 14 + r() * 12, fill: r() < 0.5 ? '#eab07e' : '#d8955f', stroke: '#b97644', 'stroke-width': 1.2, opacity: 0.9 }, lob);
  }
  // duct carrying enzymes into the intestine
  ductPath = el('path', { d: 'M 1040 302 C 880 318 720 352 560 392 C 440 422 320 452 205 456', stroke: '#fff2d8', 'stroke-width': 7, fill: 'none', opacity: 0.85 }, pancG);
  ductPath.len = ductPath.getTotalLength();
  const enzG = el('g', {}, pancG);
  ductEnz = Array.from({ length: 16 }, (_, i) => ({ ...makeEnzyme(enzG, 9), u: i / 16 + r() * 0.03 }));
  gutEnz = Array.from({ length: 10 }, (_, i) => ({ ...makeEnzyme(enzG, 9), u: i / 10, off: (r() - 0.5) * 26 }));
  el('text', { x: 830, y: 230, 'text-anchor': 'middle', class: 'svg-big', text: 'pancreas' }, pancG);
  const leg = el('g', { transform: 'translate(700 560)' }, pancG);
  const big = makeEnzyme(leg, 22);
  set(big.node, { transform: 'rotate(180)' });
  el('text', { x: 36, y: 9, class: 'svg-label enzyme', fill: ENZ, style: 'font-size:26px', text: 'digestive enzymes' }, leg);
  panZoom = [700, 370];
}

function buildCap(svg) {
  capG = el('g', {}, svg);
  glow = el('ellipse', { cx: 600, cy: 600, rx: 700, ry: 330, fill: 'url(#inflameGrad)', opacity: 0 }, capG);
  cap = new Capillary(capG, {
    y0: 600, seed: 23, sugarDots: 0, nicks: 0, label: 'pancreas cells, packed with enzymes',
    decorateCell: (inner, r, t) => {
      const enz = [];
      for (let k = 0; k < 8; k++) {
        const a = r() * 6.28, rad = 0.35 + 0.6 * Math.sqrt(r());
        const e = makeEnzyme(t.g, 8);
        const lx = Math.cos(a) * rad * 52, ly = Math.sin(a) * rad * 26;
        enz.push({ ...e, lx, ly, dir: Math.atan2(ly, lx) + (r() - 0.5) * 0.8, dist: 50 + r() * 70, rot: r() * 360 });
      }
      const bites = Array.from({ length: 6 }, () => {
        const a = r() * 6.28;
        return el('circle', { cx: Math.cos(a) * 74, cy: Math.sin(a) * 42, r: 0, fill: '#4a1218', stroke: '#ff5a5a', 'stroke-width': 1.5 }, inner);
      });
      return { enz, bites, maxBite: 12 + r() * 12 };
    },
  });
  capMilk = el('rect', { x: -60, y: 540, width: 1320, height: 120, fill: '#f3e3c0', opacity: 0 }, cap.plasma);
  const r = rng(41);
  capTG = Array.from({ length: 40 }, () => ({ x: r() * 1300, y: (r() - 0.5) * 70, s: 0.8 + r() * 0.5, node: makeTG(cap.plasma, 9) }));
  clump = el('g', { opacity: 0 }, cap.front);
  for (let i = 0; i < 12; i++) place(makeTG(clump, 20 + r() * 16), (r() - 0.5) * 150, (r() - 0.5) * 70);
  pTitle = el('text', { x: 600, y: 210, 'text-anchor': 'middle', class: 'svg-big danger-fill', style: 'font-size:56px', opacity: 0, text: 'Pancreatitis' }, capG);
}

function build(svg) {
  buildLiver(svg);
  buildTube(svg);
  buildCross(svg);
  buildPancreas(svg);
  buildCap(svg);
  buildGauge(svg);
}

let streamT = 0;

function render(S, time, dt) {
  const sAlc = S('alcohol'), sSF = S('sugarfat'), sGenes = S('genes'), sMeet = S('meet'), sPlaque = S('plaque');
  const sNarrow = S('narrow'), sPanc = S('pancreas'), sPcap = S('pcap'), sClog = S('clog'), sDie = S('die'), sAct = S('action');

  // ----- scene visibility -----
  const liverO = Math.max(1 - seg(sMeet, 0, 0.3), seg(sAct, 0.15, 0.45));
  const tubeO = seg(sMeet, 0.15, 0.4) * (1 - seg(sNarrow, 0, 0.3));
  const csO = seg(sNarrow, 0.15, 0.4) * (1 - seg(sPanc, 0, 0.3));
  const zIn = ease(seg(sPcap, 0, 0.5));
  const pancO = seg(sPanc, 0.15, 0.4) * (1 - seg(zIn, 0.35, 0.8));
  const capO = seg(zIn, 0.45, 0.9) * (1 - seg(sAct, 0, 0.3));

  // ----- the lab value -----
  const alcF = ease(seg(sAlc, 0.1, 0.6)), sfF = ease(seg(sSF, 0.1, 0.6)), gnF = ease(seg(sGenes, 0.1, 0.6));
  const actF = ease(seg(sAct, 0.2, 0.75));
  let V;
  if (sAct > 0) V = lerp(sPcap > 0 ? 1800 : 760, 140, actF);
  else if (sPcap > 0) V = lerp(300, 1800, ease(seg(sClog, 0.05, 0.6)));
  else V = 110 + 150 * alcF + 220 * sfF + 280 * gnF;
  const gO = Math.max(liverO * (sAct > 0 ? seg(sAct, 0.3, 0.5) : 1), capO * seg(sPcap, 0.4, 0.8) * (1 - seg(sDie, 0, 0.25)));
  show(gauge, gO);
  if (gO > 0.005) {
    const x = gauge.X(V);
    set(gMarker, { transform: `translate(${x.toFixed(1)} 96)` });
    set(gText, { x: clamp(x, 330, 900), text: `Triglycerides ${Math.round(V / 10) * 10} mg/dL` });
  }

  // ----- liver -----
  show(liverG, liverO);
  if (liverO > 0.005) {
    streamT += dt;
    const rates = {
      sugar: lerp(lerp(0.25, 0.9, sfF), 0.12, actF),
      fat: lerp(lerp(0.25, 0.9, sfF), 0.12, actF),
      alcohol: lerp(lerp(0.12, 1, alcF), 0.02, actF),
    };
    const tgRate = lerp(0.18 + 0.32 * alcF + 0.25 * sfF + 0.25 * gnF, 0.12, actF);
    // spotlight the source being talked about
    const alcOnly = seg(sAlc, 0.05, 0.2) * (1 - seg(sSF, 0, 0.15));
    const sfOnly = seg(sSF, 0.05, 0.2) * (1 - seg(sGenes, 0, 0.15));
    const hl = { sugar: 1 - 0.6 * alcOnly, fat: 1 - 0.6 * alcOnly, alcohol: 1 - 0.6 * sfOnly };
    const big = { sugar: sfOnly, fat: sfOnly, alcohol: alcOnly };
    for (const [k, st] of Object.entries(streams)) {
      set(sources[k].g, { opacity: hl[k], transform: `translate(130 ${sources[k].y}) scale(${(1 + 0.18 * big[k]).toFixed(3)})` });
      st.pts.forEach((p, i) => {
        const u = (streamT * 0.22 + p.ph) % 1;
        const [x, y] = bez(st.from, st.c1, st.c2, st.to, u);
        set(p.node, { transform: `translate(${x.toFixed(1)} ${(y + p.off * Math.sin(u * Math.PI)).toFixed(1)})`, opacity: spread(i, rates[k]) ? Math.min(1, u * 8) * hl[k] : 0 });
      });
    }
    tgOut.forEach((p, i) => {
      const u = (streamT * 0.16 + p.ph) % 1;
      const [x, y] = bez([780, 430], [920, 430], [1040, 470], [1280, 470], u);
      place(p.node, x, y + p.off, 1, spread(i, tgRate) ? 1 : 0);
    });
    set(liverFat, { opacity: clamp((tgRate - 0.3) * 1.6) });
    // genes
    show(dna, seg(sGenes, 0.1, 0.4) * (1 - seg(sAct, 0, 0.2)));
    if (sGenes > 0) {
      const A = [], B = [];
      dnaRungs.innerHTML = '';
      for (let x = -90; x <= 90; x += 5) {
        const y = 24 * Math.sin(x / 16 + time * 2);
        A.push(`${x} ${y.toFixed(1)}`);
        B.push(`${x} ${(-y).toFixed(1)}`);
        if ((x + 90) % 15 === 0) el('line', { x1: x, y1: y, x2: x, y2: -y, stroke: '#c9d6ea', 'stroke-width': 2, opacity: 0.6 }, dnaRungs);
      }
      set(dnaA, { d: 'M ' + A.join(' L ') });
      set(dnaB, { d: 'M ' + B.join(' L ') });
    }
  }

  // ----- artery with LDL bumps -----
  tube.setOpacity(tubeO);
  show(legend, tubeO * seg(sMeet, 0.35, 0.6));
  show(scarLabel, tubeO * seg(sMeet, 0.45, 0.7));
  if (tubeO > 0.005) {
    tube.tick(dt);
    const level = lerp(0.2, 1, seg(sMeet, 0.3, 0.8));
    set(tubeMilk, { opacity: 0.22 * seg(sMeet, 0.4, 0.9) });
    const L = tube.L, k = Math.round(level * tubeTG.length);
    tubeTG.forEach((d, i) => {
      d.x += tube.flow * 0.8 * d.spd * dt;
      if (d.x > L + 40) d.x -= tube.len + 80;
      let x = d.x, y = d.y + Math.sin(time + d.ph * 6) * 5;
      let o = i < k ? clamp((x + L - 30) / 80) * clamp((L - x) / 60) : 0;
      if (d.target >= 0) {
        const s = scars[d.target];
        const m = ease(seg(sPlaque, 0.06 + i * 0.035, 0.32 + i * 0.035));
        if (m > 0) {
          x = lerp(x, s.x + ((i % 4) - 1.5) * 18, m);
          y = lerp(y, s.y + ((i % 2) - 0.5) * 14, m);
          o = Math.max(o, m) * (1 - seg(m, 0.85, 1));
        }
      }
      place(d.node, x, y, 1, o);
    });
    const grow = ease(seg(sPlaque, 0.35, 0.8));
    const irr = seg(sPlaque, 0.5, 0.85);
    scars.forEach(s => {
      set(s.scar, { transform: `scale(${lerp(1, 1.38, grow).toFixed(3)})` });
      set(s.tint, { opacity: irr * (0.4 + 0.12 * Math.sin(time * 3 + s.x)) });
      set(s.glow, { opacity: irr * (0.75 + 0.25 * Math.sin(time * 3 + s.x)), transform: `scale(${lerp(1, 1.3, grow).toFixed(3)})` });
      s.spotsIn.forEach(p => place(p.t, p.x, p.y, 1, clamp((seg(sPlaque, 0.25, 0.8) - p.thr * 0.7) * 4)));
    });
    set(scarLabel.text, { text: irr > 0.5 ? 'thicker & inflamed' : 'LDL bumps' });
  }

  // ----- cross-sections: same end point -----
  const t = ease(seg(sNarrow, 0.25, 0.8)), hard = ease(seg(sNarrow, 0.45, 0.95));
  csN.update(t, 0, time, csO);
  csH.update(t, hard, time, csO);
  set(csN.note, { text: t > 0.5 ? 'open & flexible' : '' });
  set(csH.note, { text: t > 0.5 ? (hard > 0.4 ? 'narrowed & hardened' : 'thickening') : '' });
  show(csHead, csO * seg(sNarrow, 0.3, 0.5));

  // ----- pancreas overview -----
  show(pancG, pancO);
  set(pancG, { transform: zoomT(panZoom[0], panZoom[1], lerp(1, 5, zIn)) });
  if (pancO > 0.005) {
    ductEnz.forEach(e => {
      const u = (e.u + time * 0.07) % 1;
      const p = ductPath.getPointAtLength(u * ductPath.len);
      chomp(e, time);
      set(e.node, { transform: `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(180)`, opacity: Math.min(1, u * 10) * (1 - seg(u, 0.93, 1)) });
    });
    gutEnz.forEach(e => {
      const v = 0.5 + ((e.u + time * 0.05) % 1) * 0.5;
      const [x, y] = bez(...gutPath, v);
      chomp(e, time, 8);
      set(e.node, { transform: `translate(${(x + e.off).toFixed(1)} ${y.toFixed(1)}) rotate(${(90 + 60 * Math.sin(time + e.u * 9)).toFixed(0)})`, opacity: seg(v, 0.5, 0.55) * (1 - seg(v, 0.95, 1)) });
    });
    food.forEach(f => {
      const v = (f.ph + time * 0.05) % 1;
      const [x, y] = bez(...gutPath, v);
      const s = v < 0.5 ? 1 : lerp(1, 0.15, (v - 0.5) / 0.5);
      set(f.node, { transform: `translate(${x.toFixed(1)} ${(y + f.off * 0.3).toFixed(1)}) scale(${s.toFixed(2)})`, opacity: Math.min(1, v * 12) * (1 - seg(v, 0.95, 1)) });
    });
  }

  // ----- pancreas capillary: clog, cell death, self-digestion -----
  show(capG, capO);
  set(capG, { transform: zoomT(600, 600, lerp(0.55, 1, seg(zIn, 0.4, 1))) });
  if (capO > 0.005) {
    const milky = seg(sClog, 0.05, 0.5);
    const clog = ease(seg(sClog, 0.35, 0.85));
    cap.update({ dt, time, starve: clog, flow: 1 - clog, exchange: seg(sPcap, 0.5, 0.9) * (1 - seg(sDie, 0, 0.2)) });
    set(capMilk, { opacity: 0.62 * milky });
    set(cap.labelEl, { opacity: 1 - seg(sDie, 0, 0.2) });
    const k = Math.round(lerp(0.15, 1, seg(sClog, 0, 0.5)) * capTG.length);
    capTG.forEach((d, i) => {
      const x = ((d.x + cap.flowOff * 0.95) % 1300) - 50;
      place(d.node, x, 600 + d.y, d.s * lerp(1, 1.6, milky), i < k ? 1 : 0);
    });
    set(clump, { opacity: seg(clog, 0, 0.3), transform: `translate(620 600) scale(${lerp(0.2, 1, clog).toFixed(3)})` });

    const die = ease(seg(sDie, 0.05, 0.6));
    const spill = seg(sDie, 0.15, 0.75);
    const bite = seg(sDie, 0.4, 0.95);
    cap.tissue.forEach(tc => {
      const death = clamp(tc.sick * 1.4) * die;
      set(tc.body, { opacity: 0.9 - 0.5 * death });
      set(tc.inner, { transform: `scale(${(1 + 0.08 * Math.sin(death * Math.PI)).toFixed(3)})` });
      const out = clamp(tc.sick * 1.4) * spill;
      tc.decor.enz.forEach(e => {
        chomp(e, time, 4 + 6 * out);
        const dist = e.dist * ease(out);
        const wob = out * 6 * Math.sin(time * 2 + e.ph);
        set(e.node, { transform: `translate(${(e.lx + Math.cos(e.dir) * dist + wob).toFixed(1)} ${(e.ly + Math.sin(e.dir) * dist).toFixed(1)}) rotate(${(e.rot + out * 90).toFixed(0)})` });
      });
      tc.decor.bites.forEach((b, j) => set(b, { r: tc.decor.maxBite * clamp(bite * clamp(tc.sick * 1.4) * 1.3 - j * 0.08) }));
    });
    set(glow, { opacity: seg(sDie, 0.3, 0.8) * (0.8 + 0.2 * Math.sin(time * 2.5)) });
    set(pTitle, { opacity: seg(sDie, 0.55, 0.8) });
  }
}

runModule({ title: 'Triglycerides', steps, build, render });
