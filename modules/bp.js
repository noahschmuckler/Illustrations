// Blood pressure: systolic vs diastolic, damage above 130/80, salt and water,
// the kidneys as filters (eGFR, UACR, CKD stage), the kidney's pressure feedback loop,
// and what each kind of medicine does.

import { runModule } from '../js/scrolly.js';
import { el, set, seg, ease, easeOut, lerp, mix, rng, clamp, smoothClosed } from '../js/core.js';
import { C, Tube, CrossSection, makeCrack, makePatch, makeScar, makeRBC, place } from '../js/art.js';

const steps = [
  { id: 'bp', html: `<h2>Blood pressure</h2><p>Every heartbeat pushes blood through your arteries. Blood pressure is how hard that blood pushes on the artery walls.</p><p>It’s written as two numbers, like <b>120/80</b>.</p>` },
  { id: 'sys', weight: 1.6, html: `<h2>The top number: systolic</h2><p><b>Systolic</b> is the pressure at the <b>peak</b> of each heartbeat.</p><p>It goes up when arteries are <b>stiff and hardened</b> and can’t stretch to soften each beat — and when the <b>muscle around the arteries</b> tightens.</p>` },
  { id: 'dia', weight: 1.3, html: `<h2>The bottom number: diastolic</h2><p><b>Diastolic</b> is the pressure <b>in between</b> heartbeats — the pressure that’s always there.</p><p>It depends on <b>how much fluid</b> fills your blood vessels, and how tight they are.</p>` },
  { id: 'damage', weight: 1.5, html: `<h2>Above 130/80, damage adds up</h2><p>Higher pressure pounds on the artery lining with every beat, causing more and more tiny cracks.</p><p>That means more repairs for <b class="hdl">HDL</b> and <b class="ldl">LDL</b> to make — and more LDL bumps. The higher the pressure, and the longer it lasts, the more damage.</p>` },
  { id: 'stiff', weight: 1.3, html: `<h2>Stiff, tight, narrow</h2><p>Over years, arteries under high pressure thicken, stiffen and narrow — which pushes blood pressure even higher.</p>` },
  { id: 'salt', weight: 1.4, html: `<h2>Salt holds water</h2><p>Your body keeps your blood at just the right saltiness. Eat more salt, and your body holds on to more water to keep it diluted.</p><p><b>More fluid in the same pipes means more pressure.</b></p>` },
  { id: 'lesssalt', weight: 1.3, html: `<h2>Less salt, less water</h2><p>Cut back on salt, and your kidneys let the extra water go. That’s the <b>“water weight”</b> people lose in the first week or two — and blood pressure comes down with it.</p>` },
  { id: 'kidney', weight: 1.3, html: `<h2>The kidneys: your filters</h2><p>Each kidney has about a million tiny filters, made of capillaries.</p><p>They let water, salt and waste pass into the urine, but keep <b class="protein">protein</b> (albumin) in the blood.</p>` },
  { id: 'leak', weight: 1.5, html: `<h2>Holes in the filter</h2><p>High blood pressure and high blood sugar damage these capillaries. Some filters die off, and the ones left get <b>bigger holes</b> — so protein starts slipping into the urine.</p>` },
  { id: 'ckd', weight: 1.4, html: `<h2>Measuring kidney health</h2><p><b>eGFR</b> estimates how much filtering is left.</p><p>The urine <b>albumin/creatinine ratio</b> (UACR) measures how much protein is leaking.</p><p>Together they give the stage of <b>chronic kidney disease (CKD)</b>.</p>` },
  { id: 'loop', weight: 1.6, html: `<h2>The kidneys set the pressure</h2><p>The kidneys constantly sense blood pressure. If it seems too low, they signal the blood vessels to tighten and the body to hold on to salt and water.</p><p>Damaged kidneys get less blood flow, so they think the pressure is too low — and keep pushing it higher. That causes more damage, and the cycle feeds itself.</p>` },
  { id: 'lifestyle', weight: 1.4, html: `<h2>What you can do</h2><p>Cutting salt, losing weight, exercising, limiting alcohol and reducing stress all lower blood pressure.</p><p>But each usually lowers it by just a few points, and they take weeks to months to work fully.</p>` },
  { id: 'whymeds', weight: 1.2, html: `<h2>Why medicines matter</h2><p>When pressure stays above 130/80, lifestyle changes alone often aren’t enough — and the damage keeps going while we wait, making pressure harder to control.</p><p>Medicines can <b>break the cycle</b>: slowing or stopping the damage, and giving arteries and kidneys a chance to heal.</p>` },
  { id: 'diuretic', weight: 1.3, html: `<h2>Water pills (diuretics)</h2><p class="eg">e.g. chlorthalidone, hydrochlorothiazide</p><p>They help the kidneys flush out extra <b>salt and water</b>, so there’s less fluid in the pipes.</p>` },
  { id: 'acearb', weight: 1.9, html: `<h2>ACE inhibitors &amp; ARBs</h2><p class="eg">e.g. lisinopril, losartan</p><p>They block the kidneys’ <b>“raise the pressure”</b> signal, so vessels relax and less salt and water is held.</p><p>They also ease the pressure inside the kidney’s filters, so <b>less protein leaks</b> — protecting the kidneys.</p>` },
  { id: 'ccb', weight: 1.3, html: `<h2>Calcium channel blockers</h2><p class="eg">e.g. amlodipine</p><p>They <b>relax the muscle</b> around the arteries, so the arteries open up and pressure falls.</p>` },
  { id: 'bb', weight: 1.3, html: `<h2>Beta blockers</h2><p class="eg">e.g. metoprolol, carvedilol</p><p>They make the heart beat <b>slower and less forcefully</b>. Usually used when there’s also a heart reason to take one.</p>` },
  { id: 'summary', html: `<h2>Getting below 130/80</h2><p>Lifestyle changes plus the right medicines bring the pressure down, stop the cycle of damage, and protect your <b>heart, brain and kidneys</b>.</p>` },
];

// which scene each step shows
const SCENE = {
  bp: 'pulse', sys: 'pulse', dia: 'pulse', damage: 'tube', stiff: 'cs', salt: 'salt', lesssalt: 'salt',
  kidney: 'filter', leak: 'filter', ckd: 'grid', loop: 'loop', lifestyle: 'bars', whymeds: 'loop',
  diuretic: 'salt', acearb: 'loop', ccb: 'pulse', bb: 'pulse', summary: 'pulse',
};

const zoomT = (x, y, s) => `translate(${x} ${y}) scale(${s.toFixed(3)}) translate(${-x} ${-y})`;
const show = (node, o) => set(node, { opacity: o, display: o < 0.005 ? 'none' : '' });
const PROTEIN = '#b98cff';

// ---------- the story's blood pressure, step by step ----------
// force: how hard the heart pushes; tight: muscle around arteries; stiff: hardened walls;
// vol: fluid in the vessels; hr: heart rate.
function bpState(S) {
  const k = (id, a = 0.15, b = 0.7) => ease(seg(S(id), a, b));
  let force = 0.5, hr = 70, tight = 0.2, stiff = 0, vol = 0.4;
  stiff = lerp(stiff, 0.6, k('sys', 0.12, 0.45));
  tight = lerp(tight, 0.6, k('sys', 0.5, 0.85));
  vol = lerp(vol, 0.85, k('dia'));
  vol = lerp(vol, 0.95, k('salt'));
  vol = lerp(vol, 0.7, k('lesssalt'));
  tight = lerp(tight, 0.75, k('loop', 0.35, 0.85));
  vol = lerp(vol, 0.85, k('loop', 0.35, 0.85));
  vol = lerp(vol, 0.7, k('lifestyle'));
  tight = lerp(tight, 0.68, k('lifestyle'));
  tight = lerp(tight, 0.8, k('whymeds'));
  vol = lerp(vol, 0.4, k('diuretic'));
  tight = lerp(tight, 0.5, k('acearb', 0.1, 0.5));
  vol = lerp(vol, 0.35, k('acearb', 0.1, 0.5));
  tight = lerp(tight, 0.2, k('ccb'));
  force = lerp(force, 0.3, k('bb'));
  hr = lerp(hr, 58, k('bb'));
  stiff = lerp(stiff, 0.5, k('summary'));
  const sys = 92 + 30 * force + 22 * tight + 28 * stiff + 18 * vol;
  const dia = 58 + 22 * tight + 18 * vol - 3 * stiff + 4 * force;
  return { force, hr, tight, stiff, vol, sys, dia };
}
function bpCategory(s, d) {
  if (s >= 140 || d >= 90) return ['stage 2 high', '#e0464e'];
  if (s >= 130 || d >= 80) return ['stage 1 high', '#ef9a3a'];
  if (s >= 120) return ['elevated', '#e8d04a'];
  return ['normal', '#3fbf7f'];
}

// arterial pressure waveform over one beat (0 = trough, 1 = peak)
function wave(ph) {
  ph = ((ph % 1) + 1) % 1;
  const k = 3, e1 = Math.exp(-0.85 * k);
  if (ph < 0.15) return Math.sin((ph / 0.15) * Math.PI / 2);
  return (Math.exp(-(ph - 0.15) * k) - e1) / (1 - e1) + 0.06 * Math.exp(-Math.pow((ph - 0.4) / 0.04, 2));
}

let readout, readNum, readCat;
let pulseG, trace, traceDot, sysLine, diaLine, sysLab, diaLab, heart, heartLab, lumen, wallTop, wallBot, bands, flecks, cellsA, waterA, stiffLab, muscleLab;
let tube, cracks, arrows, damageLab;
let csLow, csHigh;
let saltG, beakerWater, saltDots, crystals, shaker, drips, ring, ringWall, ringArrows, weightText, kidneyLab, follows;
let filterG, membrane, filt, albumin, rbcF, egfrText, uacrText, tufts, causeLab;
let gridG, marker, trail, gridEgfr;
let loopG, kidneyBody, dial, needle, sensorText, sigDots, presDots, topArc, botArc, vesselMuscle, blockX;
let barsG, bars;

// ---------- persistent BP readout ----------
function buildReadout(svg) {
  readout = el('g', { opacity: 0 }, svg);
  readNum = el('text', { x: 600, y: 82, 'text-anchor': 'middle', class: 'svg-big', text: '' }, readout);
  readCat = el('text', { x: 600, y: 112, 'text-anchor': 'middle', class: 'svg-small', text: '' }, readout);
}

// ---------- scene: pulse (heart, artery, pressure trace) ----------
const GX0 = 120, GX1 = 940, GY = p => 380 - ((p - 40) / 140) * 230;
const AY = 650, AX0 = 270, AX1 = 1180;

function buildPulse(svg) {
  pulseG = el('g', {}, svg);
  const r = rng(12);
  // trace grid
  [80, 130].forEach(v => {
    el('line', { x1: GX0, x2: GX1, y1: GY(v), y2: GY(v), stroke: '#3a4660', 'stroke-width': 1.5, 'stroke-dasharray': '4 6' }, pulseG);
    el('text', { x: GX0 - 10, y: GY(v) + 6, 'text-anchor': 'end', class: 'svg-small', text: v }, pulseG);
  });
  el('text', { x: GX0, y: 412, class: 'svg-small', style: 'font-size:16px', text: 'pressure over time →' }, pulseG);
  sysLine = el('line', { x1: GX0, x2: GX1, stroke: '#ff8a8a', 'stroke-width': 2, 'stroke-dasharray': '8 6', opacity: 0 }, pulseG);
  diaLine = el('line', { x1: GX0, x2: GX1, stroke: '#7cc4ff', 'stroke-width': 2, 'stroke-dasharray': '8 6', opacity: 0 }, pulseG);
  sysLab = el('text', { x: GX1 + 14, class: 'svg-label', style: 'font-size:24px', fill: '#ff8a8a', opacity: 0 }, pulseG);
  diaLab = el('text', { x: GX1 + 14, class: 'svg-label', style: 'font-size:24px', fill: '#7cc4ff', opacity: 0 }, pulseG);
  trace = el('polyline', { fill: 'none', stroke: '#ff5a64', 'stroke-width': 3.5, 'stroke-linejoin': 'round' }, pulseG);
  traceDot = el('circle', { r: 7, fill: '#ffd0d4' }, pulseG);

  // artery
  el('rect', { x: 200, y: AY - 30, width: 90, height: 60, rx: 10, fill: '#a8323e' }, pulseG);
  lumen = el('path', { fill: '#3a0a12' }, pulseG);
  const lumenClip = el('clipPath', { id: 'bpLumen' }, pulseG);
  lumen.clip = el('path', {}, lumenClip);
  const inner = el('g', { 'clip-path': 'url(#bpLumen)' }, pulseG);
  waterA = Array.from({ length: 60 }, () => ({ x: r() * 950, y: r() * 2 - 1, node: el('circle', { r: 3.5, fill: '#7fc8ff', opacity: 0.85 }, inner) }));
  cellsA = Array.from({ length: 14 }, (_, i) => ({ x: (i / 14) * 950, y: r() * 1.4 - 0.7, node: el('ellipse', { rx: 10, ry: 7, fill: C.rbc, stroke: C.rbcRim, 'stroke-width': 1.2 }, inner) }));
  wallTop = el('path', { stroke: '#ff9aa2', 'stroke-width': 1.5 }, pulseG);
  wallBot = el('path', { stroke: '#ff9aa2', 'stroke-width': 1.5 }, pulseG);
  flecks = Array.from({ length: 16 }, () => ({ x: lerp(320, 1150, r()), top: r() < 0.5, f: r(), thr: r(), node: el('path', { d: smoothClosed(Array.from({ length: 5 }, (_, k) => { const a = (k / 5) * 6.28, s = 3 + r() * 4; return [Math.cos(a) * s, Math.sin(a) * s]; })), fill: C.calcium, opacity: 0 }, pulseG) }));
  bands = [];
  for (let x = 330; x < 1160; x += 78) bands.push({ x, node: el('ellipse', { fill: 'none', stroke: '#f07a84', opacity: 0.85 }, pulseG) });

  heart = el('g', {}, pulseG);
  el('path', { d: 'M 0 42 C -80 -8 -66 -78 0 -44 C 66 -78 80 -8 0 42 Z', fill: '#c43a46', stroke: '#ff9aa2', 'stroke-width': 2.5 }, heart);
  el('path', { d: 'M -30 -40 C -40 -30 -42 -14 -34 0', stroke: '#ffffff', 'stroke-width': 6, fill: 'none', opacity: 0.25, 'stroke-linecap': 'round' }, heart);
  heartLab = el('text', { x: 150, y: AY + 100, 'text-anchor': 'middle', class: 'svg-label', style: 'font-size:24px', text: 'heart' }, pulseG);

  stiffLab = el('g', { opacity: 0 }, pulseG);
  el('text', { x: 520, y: 520, class: 'svg-label', style: 'font-size:24px', text: 'stiff, hardened wall' }, stiffLab);
  el('path', { d: 'M 600 530 L 640 590', class: 'leader' }, stiffLab);
  muscleLab = el('g', { opacity: 0 }, pulseG);
  el('text', { x: 720, y: 800, class: 'svg-label', style: 'font-size:24px', fill: '#f07a84', text: 'muscle around the artery' }, muscleLab);
  el('path', { d: 'M 800 772 L 798 712', class: 'leader' }, muscleLab);
}

let beat = 0;
const hist = [];

function renderPulse(st, time, dt, o, S) {
  show(pulseG, o);
  if (o < 0.005) return;
  const ph = beat % 1;
  const sSys = S('sys'), sDia = S('dia');

  // trace
  const x = t => GX1 - ((time - t) / 4) * (GX1 - GX0);
  set(trace, { points: hist.filter(h => time - h.t < 4).map(h => `${x(h.t).toFixed(1)},${GY(h.p).toFixed(1)}`).join(' ') });
  set(traceDot, { cx: GX1, cy: GY(hist[hist.length - 1].p) });
  const sysO = seg(sSys, 0.05, 0.2), diaO = seg(sDia, 0.05, 0.2);
  set(sysLine, { y1: GY(st.sys), y2: GY(st.sys), opacity: sysO });
  set(diaLine, { y1: GY(st.dia), y2: GY(st.dia), opacity: diaO });
  set(sysLab, { y: GY(st.sys) + 8, opacity: sysO, text: `systolic ${Math.round(st.sys)}` });
  set(diaLab, { y: GY(st.dia) + 8, opacity: diaO, text: `diastolic ${Math.round(st.dia)}` });

  // artery: narrower when the muscle tightens, fuller with more fluid, bulges less when stiff
  const base = 46 * (1 - 0.3 * st.tight) * (0.88 + 0.25 * st.vol);
  const amp = 9 * (1 - 0.75 * st.stiff) * (0.5 + st.force);
  const h = xx => base + amp * wave(ph - (xx - AX0) / 1500);
  const wall = 20 + 8 * st.stiff;
  const xs = [];
  for (let xx = AX0; xx <= AX1; xx += 20) xs.push(xx);
  const top = xs.map(xx => [xx, AY - h(xx)]), bot = xs.map(xx => [xx, AY + h(xx)]);
  const P = pts => pts.map(p => `${p[0]} ${p[1].toFixed(1)}`).join(' L ');
  const lum = `M ${P(top)} L ${P(bot.slice().reverse())} Z`;
  set(lumen, { d: lum });
  set(lumen.clip, { d: lum });
  const wallC = mix('#c8606a', '#b9a69e', st.stiff);
  set(wallTop, { d: `M ${P(top)} L ${P(top.slice().reverse().map(([a, b]) => [a, b - wall]))} Z`, fill: wallC });
  set(wallBot, { d: `M ${P(bot)} L ${P(bot.slice().reverse().map(([a, b]) => [a, b + wall]))} Z`, fill: wallC });
  flecks.forEach(f => {
    const y = f.top ? AY - h(f.x) - wall * f.f : AY + h(f.x) + wall * f.f;
    set(f.node, { transform: `translate(${f.x.toFixed(0)} ${y.toFixed(1)})`, opacity: clamp((st.stiff - f.thr * 0.6) * 4) });
  });
  bands.forEach(b => set(b.node, { cx: b.x, cy: AY, rx: 6 + 6 * st.tight, ry: h(b.x) + wall + 2, 'stroke-width': 4 + 8 * st.tight }));
  const flow = 140 * (0.6 + 0.8 * wave(ph));
  cellsA.forEach(c => {
    c.x = (c.x + flow * dt) % 950;
    const xx = AX0 + c.x;
    set(c.node, { cx: xx, cy: AY + c.y * (h(xx) - 12) });
  });
  const nW = Math.round(st.vol * waterA.length);
  waterA.forEach((w, i) => {
    w.x = (w.x + flow * 0.9 * dt) % 950;
    const xx = AX0 + w.x;
    set(w.node, { cx: xx, cy: AY + w.y * (h(xx) - 5), opacity: i < nW ? 0.85 : 0 });
  });

  // heart squeezes on each beat
  const squeeze = ph < 0.18 ? Math.sin((ph / 0.18) * Math.PI) : 0;
  set(heart, { transform: `translate(150 ${AY}) scale(${(1 - 0.12 * squeeze * (0.4 + st.force)).toFixed(3)})` });
  const sBB = S('bb');
  set(heartLab, { text: sBB > 0.3 && S('summary') === 0 ? 'slower, gentler' : 'heart' });

  set(stiffLab, { opacity: seg(sSys, 0.15, 0.3) * (1 - seg(sDia, 0, 0.2)) });
  set(muscleLab, { opacity: Math.max(seg(sSys, 0.5, 0.65) * (1 - seg(sDia, 0, 0.2)), seg(S('ccb'), 0.1, 0.3) * (1 - seg(sBB, 0, 0.2))) });
}

// ---------- scene: tube (pressure -> cracks -> repairs) ----------
function buildTube(svg) {
  tube = new Tube(svg, { cells: 14, seed: 4 });
  tube.setFront(0.24);
  const spots = [[-330, -64, -6], [-150, 70, 5], [-20, -50, 3], [120, 74, -6], [250, -76, 7], [360, 30, -4], [-260, 4, 10], [60, 6, -8], [-400, 60, 4], [300, -20, 6]];
  cracks = spots.map(([x, y, a], i) => {
    const c = makeCrack(tube.deco, { x, y, angle: a, len: 100 + (i % 3) * 22, gap: 18, seed: 90 + i });
    c.fix = i % 2 ? makeScar(c, 120 + i, 0.75) : makePatch(c);
    c.ldl = !!(i % 2);
    return c;
  });
  arrows = [];
  for (let k = 0; k < 7; k++) {
    [-1, 1].forEach(s => {
      const g = el('g', {}, tube.overlay);
      el('path', { d: 'M -4 0 L -4 -22 L -11 -22 L 0 -36 L 11 -22 L 4 -22 L 4 0 Z', fill: '#ffe1e1', opacity: 0.85 }, g);
      arrows.push({ g, x: -420 + k * 140, s });
    });
  }
  damageLab = el('text', { x: 90, y: 230, class: 'svg-label', style: 'font-size:26px', opacity: 0, text: '' }, svg);
}

function renderTube(st, time, dt, o, S, ph) {
  tube.setOpacity(o);
  show(damageLab, o);
  if (o < 0.005) return;
  tube.tick(dt);
  const d = S('damage');
  const pf = clamp((st.sys - 105) / 50);
  arrows.forEach(a => {
    const len = 0.5 + 0.9 * pf * wave(ph - (a.x + 500) / 1500);
    set(a.g, { transform: `translate(${a.x} ${a.s * (tube.R + 8)}) scale(1 ${(a.s * -len).toFixed(3)})` });
  });
  let fixed = 0;
  cracks.forEach((c, i) => {
    const t0 = 0.08 + i * 0.065;
    const g = seg(d, t0, t0 + 0.06);
    const fx = seg(d, t0 + 0.1, t0 + 0.18);
    if (fx > 0.5) fixed++;
    c.grow(easeOut(g), c.ldl ? 1 : 1 - fx);
    if (c.ldl) set(c.fix, { opacity: fx, transform: `scale(${lerp(0.5, 1, easeOut(fx)).toFixed(3)})` });
    else set(c.fix, { opacity: fx, fill: mix(C.scarBrown, '#d9773f', 0.8 * seg(d, t0 + 0.2, t0 + 0.3)) });
  });
  set(damageLab, { text: fixed ? `${fixed} repairs and counting…` : 'every beat pounds the lining' });
}

// ---------- scene: salt & water ----------
const BX0 = 170, BX1 = 470, BY1 = 790, BH = 470;
function buildSalt(svg) {
  saltG = el('g', {}, svg);
  const r = rng(33);
  el('text', { x: 320, y: 830, 'text-anchor': 'middle', class: 'svg-small', text: 'the water in your blood' }, saltG);
  beakerWater = el('rect', { x: BX0, width: BX1 - BX0, fill: '#2f6fb4', opacity: 0.55 }, saltG);
  saltDots = Array.from({ length: 80 }, () => ({ fx: r(), fy: r(), node: el('rect', { width: 8, height: 8, rx: 1.5, fill: '#ffffff', stroke: '#cfe3ff', opacity: 0 }, saltG) }));
  el('path', { d: `M ${BX0} 260 L ${BX0} ${BY1} L ${BX1} ${BY1} L ${BX1} 260`, fill: 'none', stroke: '#c9d6ea', 'stroke-width': 4, 'stroke-linejoin': 'round' }, saltG);
  follows = el('g', { opacity: 0 }, saltG);
  el('text', { x: 500, y: 300, class: 'svg-label', style: 'font-size:22px', text: 'water follows salt' }, follows);
  // shaker
  shaker = el('g', {}, saltG);
  el('path', { d: 'M -26 -10 L 26 -10 L 20 60 L -20 60 Z', fill: '#e8eef7', stroke: '#9aa7ba', 'stroke-width': 2 }, shaker);
  el('path', { d: 'M -26 -10 C -26 -40 26 -40 26 -10 Z', fill: '#9aa7ba' }, shaker);
  [[-8, -22], [0, -26], [8, -22]].forEach(([x, y]) => el('circle', { cx: x, cy: y, r: 2.5, fill: '#3a4660' }, shaker));
  crystals = Array.from({ length: 18 }, () => ({ ph: r(), dx: (r() - 0.5) * 40, node: el('rect', { width: 7, height: 7, fill: '#ffffff', opacity: 0 }, saltG) }));
  // kidney draining the beaker
  el('path', { d: `M ${BX1} 740 L 560 740`, stroke: '#9aa7ba', 'stroke-width': 8 }, saltG);
  const k = el('g', { transform: 'translate(600 740)' }, saltG);
  el('path', { d: 'M 10 -45 C 60 -45 70 40 20 48 C -10 52 -30 30 -10 10 C 2 0 -2 -12 -14 -20 C -30 -34 -14 -45 10 -45 Z', fill: '#b4504c', stroke: '#e89088', 'stroke-width': 2 }, k);
  kidneyLab = el('text', { x: 620, y: 676, 'text-anchor': 'middle', class: 'svg-small', text: 'kidneys' }, saltG);
  drips = Array.from({ length: 10 }, (_, i) => ({ ph: i / 10, node: el('path', { d: 'M 0 -8 C 5 0 6 4 0 8 C -6 4 -5 0 0 -8 Z', fill: '#f0d860', opacity: 0 }, saltG) }));
  // the blood vessels: same pipe, more fluid
  ring = el('circle', { cx: 900, cy: 420, fill: 'url(#bloodGrad)' }, saltG);
  ringWall = el('circle', { cx: 900, cy: 420, fill: 'none', stroke: '#c8606a' }, saltG);
  ringArrows = Array.from({ length: 8 }, (_, i) => {
    const g = el('g', {}, saltG);
    el('path', { d: 'M -3 0 L -3 -16 L -9 -16 L 0 -28 L 9 -16 L 3 -16 L 3 0 Z', fill: '#ffe1e1' }, g);
    return { g, a: (i / 8) * 360 };
  });
  el('text', { x: 900, y: 610, 'text-anchor': 'middle', class: 'svg-small', text: 'same pipes, more fluid → more pressure' }, saltG);
  el('rect', { x: 790, y: 700, width: 220, height: 80, rx: 14, fill: '#1c2433', stroke: '#3a4660', 'stroke-width': 2 }, saltG);
  weightText = el('text', { x: 900, y: 752, 'text-anchor': 'middle', class: 'svg-label', style: 'font-size:28px', text: '' }, saltG);
  el('text', { x: 900, y: 810, 'text-anchor': 'middle', class: 'svg-small', text: 'body weight' }, saltG);
}

function renderSalt(st, time, dt, o, S) {
  show(saltG, o);
  if (o < 0.005) return;
  const H = BH * lerp(0.35, 0.95, st.vol);
  set(beakerWater, { y: BY1 - H, height: H });
  const n = Math.round(st.vol * saltDots.length * 0.9);
  saltDots.forEach((d, i) => set(d.node, { x: BX0 + 8 + d.fx * (BX1 - BX0 - 24), y: BY1 - 12 - d.fy * (H - 20), opacity: i < n ? 0.95 : 0 }));
  const adding = seg(S('salt'), 0.05, 0.2) * (1 - seg(S('salt'), 0.75, 0.9));
  set(shaker, { transform: `translate(380 170) rotate(${(150 + 12 * Math.sin(time * 10) * adding).toFixed(1)})`, opacity: Math.max(0.35, adding) });
  crystals.forEach(c => {
    const u = (time * 0.9 + c.ph) % 1;
    set(c.node, { x: 380 + c.dx * u, y: lerp(200, BY1 - H, u), opacity: adding * (u < 0.95 ? 1 : 0) });
  });
  set(follows, { opacity: seg(S('salt'), 0.3, 0.5) * (1 - seg(S('lesssalt'), 0, 0.2)) });
  const draining = Math.max(seg(S('lesssalt'), 0.1, 0.25) * (1 - seg(S('lesssalt'), 0.8, 0.95)), seg(S('diuretic'), 0.1, 0.25) * (1 - seg(S('diuretic'), 0.85, 1)));
  drips.forEach(d => {
    const u = (time * 0.8 + d.ph) % 1;
    set(d.node, { transform: `translate(600 ${lerp(800, 880, u).toFixed(1)})`, opacity: draining * Math.sin(u * Math.PI) });
  });
  set(kidneyLab, { text: S('diuretic') > 0.1 ? 'water pill: kidneys flush more' : draining > 0.1 ? 'kidneys release water' : 'kidneys' });
  const R = 100 + 70 * (st.vol - 0.35);
  const wall = 26 * (110 / R);
  set(ring, { r: R });
  set(ringWall, { r: R + wall / 2, 'stroke-width': wall });
  ringArrows.forEach(a => set(a.g, { transform: `translate(900 420) rotate(${a.a}) translate(0 ${-(R + wall + 4).toFixed(1)}) scale(${lerp(0.4, 1.3, (st.vol - 0.35) / 0.6).toFixed(2)})` }));
  set(weightText, { text: `${Math.round(177 + (st.vol - 0.45) * 12)} lb` });
}

// ---------- scene: kidney filter ----------
const FY = 310, FM = 372;   // lumen center, membrane top
const PORES = Array.from({ length: 9 }, (_, j) => 150 + j * 70);
function buildFilter(svg) {
  filterG = el('g', {}, svg);
  const r = rng(51);
  el('text', { x: 110, y: 220, class: 'svg-small', text: 'blood in →' }, filterG);
  el('text', { x: 735, y: 220, 'text-anchor': 'end', class: 'svg-small', text: '→ back to the body' }, filterG);
  // filtrate chamber funnelling to the urine
  el('path', { d: `M 110 390 L 760 390 L 760 600 L 470 760 L 470 880 L 400 880 L 400 760 L 110 600 Z`, fill: '#1a2130', stroke: '#3a4660', 'stroke-width': 2 }, filterG);
  el('text', { x: 500, y: 860, class: 'svg-small', text: 'urine ↓' }, filterG);
  el('rect', { x: 110, y: 250, width: 650, height: 120, fill: '#3a0a12' }, filterG);
  el('rect', { x: 110, y: 232, width: 650, height: 18, fill: '#c8606a' }, filterG);
  membrane = el('g', {}, filterG);
  const clip = el('clipPath', { id: 'filtClip' }, filterG);
  el('rect', { x: 110, y: 200, width: 650, height: 700 }, clip);
  const inner = el('g', { 'clip-path': 'url(#filtClip)' }, filterG);
  filt = Array.from({ length: 46 }, (_, i) => ({
    ph: r(), y: r() * 80 - 40, pore: PORES[i % PORES.length], end: 435 + (r() - 0.5) * 50,
    node: el('circle', { r: 4.5, fill: i % 3 ? '#7fc8ff' : '#cfcfcf' }, inner),
  }));
  rbcF = Array.from({ length: 6 }, (_, i) => ({ x: i * 125, cell: makeRBC(inner, 26, 300 + i) }));
  albumin = Array.from({ length: 22 }, (_, i) => ({
    ph: i / 22, y: r() * 70 - 35, pore: PORES[(i * 4) % PORES.length], end: 435 + (r() - 0.5) * 40, leakThr: r(),
    node: el('path', { d: smoothClosed(Array.from({ length: 6 }, (_, k) => { const a = (k / 6) * 6.28, s = 10 + r() * 3; return [Math.cos(a) * s, Math.sin(a) * s]; })), fill: PROTEIN, stroke: '#6b45b0', 'stroke-width': 1.5 }, inner),
  }));
  // legend
  const leg = el('g', { transform: 'translate(800 250)' }, filterG);
  el('circle', { cx: 12, cy: 0, r: 11, fill: PROTEIN, stroke: '#6b45b0' }, leg);
  el('text', { x: 32, y: 7, class: 'svg-small', text: 'protein (albumin)' }, leg);
  el('circle', { cx: 12, cy: 38, r: 5, fill: '#7fc8ff' }, leg);
  el('text', { x: 32, y: 45, class: 'svg-small', text: 'water, salt, waste' }, leg);
  // readouts and filters left
  const panel = el('g', { transform: 'translate(800 380)' }, filterG);
  el('text', { y: 0, class: 'svg-small', text: 'eGFR — filtering left' }, panel);
  egfrText = el('text', { y: 44, class: 'svg-big', text: '' }, panel);
  el('text', { y: 100, class: 'svg-small', text: 'UACR — protein leaking' }, panel);
  uacrText = el('text', { y: 144, class: 'svg-big', text: '' }, panel);
  el('text', { y: 200, class: 'svg-small', text: 'filters still working' }, panel);
  tufts = [];
  for (let k = 0; k < 12; k++) {
    const g = el('g', { transform: `translate(${20 + (k % 6) * 50} ${240 + Math.floor(k / 6) * 50})` }, panel);
    const c = el('circle', { r: 18, fill: '#c8606a', stroke: '#ff9aa2', 'stroke-width': 1.5 }, g);
    el('path', { d: 'M -10 -4 C -4 -14 4 6 10 -4 M -10 6 C -4 -4 4 14 10 4', stroke: '#5a1018', 'stroke-width': 2.5, fill: 'none' }, g);
    tufts.push({ c, thr: (k * 7) % 12 / 12 });
  }
  causeLab = el('g', { opacity: 0 }, filterG);
  el('text', { x: 435, y: 170, 'text-anchor': 'middle', class: 'svg-label', style: 'font-size:24px', text: 'high blood pressure + high blood sugar' }, causeLab);
}

function kidneyNumbers(S) {
  const dmg = ease(seg(S('leak'), 0.15, 0.85));
  const fix = ease(seg(S('acearb'), 0.55, 0.95));
  const pore = lerp(lerp(0.12, 1, dmg), 0.55, fix);
  return {
    pore,
    leak: clamp((pore - 0.3) / 0.7),
    egfr: lerp(92, 48, dmg),
    uacr: lerp(lerp(12, 180, dmg), 60, fix),
    alive: lerp(1, 0.5, dmg),
  };
}

function renderFilter(st, time, dt, o, S) {
  show(filterG, o);
  if (o < 0.005) return;
  const kn = kidneyNumbers(S);
  const pw = lerp(7, 34, kn.pore);
  const key = pw.toFixed(1);
  if (membrane.__k !== key) {
    membrane.__k = key;
    membrane.innerHTML = '';
    let x0 = 110;
    PORES.forEach(px => {
      el('rect', { x: x0, y: FM, width: px - pw / 2 - x0, height: 18, fill: '#c8606a' }, membrane);
      x0 = px + pw / 2;
    });
    el('rect', { x: x0, y: FM, width: 760 - x0, height: 18, fill: '#c8606a' }, membrane);
  }
  // small things pass through the pores and drain to the urine
  const pathPt = (p, u, y) => {
    if (u < 0.45) return [lerp(80, p.pore, u / 0.45), FY + y];
    if (u < 0.55) return [p.pore, lerp(FY + y, FM + 30, (u - 0.45) / 0.1)];
    const v = (u - 0.55) / 0.45;
    return [lerp(p.pore, p.end, v), lerp(FM + 30, 900, v * v)];
  };
  filt.forEach(p => {
    const u = (time * 0.12 + p.ph) % 1;
    const [x, y] = pathPt(p, u, p.y);
    set(p.node, { cx: x, cy: y });
  });
  // protein stays in the blood unless the holes are big
  albumin.forEach(a => {
    const leaks = a.leakThr < kn.leak * 0.6;
    const u = (time * 0.1 + a.ph) % 1;
    let x, y;
    if (leaks) [x, y] = pathPt(a, u, a.y * 0.5);
    else { x = lerp(80, 800, u); y = FY + a.y; }
    set(a.node, { transform: `translate(${x.toFixed(1)} ${y.toFixed(1)})` });
  });
  rbcF.forEach(c => {
    c.x = (c.x + 60 * dt) % 760;
    set(c.cell.g, { transform: `translate(${(80 + c.x).toFixed(1)} ${FY}) scale(0.7 1)` });
  });
  set(egfrText, { text: `${Math.round(kn.egfr)}`, fill: kn.egfr >= 60 ? '#3fbf7f' : kn.egfr >= 45 ? '#e8d04a' : '#ef9a3a' });
  set(uacrText, { text: `${Math.round(kn.uacr)} mg/g`, fill: kn.uacr < 30 ? '#3fbf7f' : kn.uacr < 300 ? '#ef9a3a' : '#e0464e' });
  tufts.forEach(t => set(t.c, { fill: t.thr < kn.alive ? '#c8606a' : '#4b4652' }));
  set(causeLab, { opacity: seg(S('leak'), 0.05, 0.2) * (1 - seg(S('ckd'), 0, 0.1)) });
}

// ---------- scene: CKD grid (eGFR x UACR) ----------
const GRID = { x: 420, y: 230, cw: 200, rh: 92 };
const G_ROWS = [['G1', '90+'], ['G2', '60–89'], ['G3a', '45–59'], ['G3b', '30–44'], ['G4', '15–29'], ['G5', 'under 15']];
const G_COLORS = [
  ['#3fbf7f', '#e8d04a', '#ef9a3a'], ['#3fbf7f', '#e8d04a', '#ef9a3a'], ['#e8d04a', '#ef9a3a', '#e0464e'],
  ['#ef9a3a', '#e0464e', '#e0464e'], ['#e0464e', '#e0464e', '#b02a3a'], ['#b02a3a', '#b02a3a', '#b02a3a'],
];
const pw = (v, stops) => {
  for (let i = 1; i < stops.length; i++) {
    const [a, pa] = stops[i - 1], [b, pb] = stops[i];
    if ((v - a) * (b - a) >= 0 && (v - b) * (b - a) <= 0) return lerp(pa, pb, (v - a) / (b - a));
  }
  const last = stops[stops.length - 1];
  return Math.abs(v - stops[0][0]) < Math.abs(v - last[0]) ? stops[0][1] : last[1];
};
function buildGrid(svg) {
  gridG = el('g', {}, svg);
  const { x, y, cw, rh } = GRID;
  el('text', { x: x + cw * 1.5, y: y - 70, 'text-anchor': 'middle', class: 'svg-label', style: 'font-size:24px', text: 'UACR — protein leaking (mg/g)' }, gridG);
  ['A1 · under 30', 'A2 · 30–300', 'A3 · over 300'].forEach((t, j) => el('text', { x: x + cw * (j + 0.5), y: y - 20, 'text-anchor': 'middle', class: 'svg-small', text: t }, gridG));
  el('text', { x: x - 150, y: y - 20, 'text-anchor': 'middle', class: 'svg-label', style: 'font-size:24px', text: 'eGFR' }, gridG);
  G_ROWS.forEach(([g, range], i) => {
    el('text', { x: x - 150, y: y + rh * (i + 0.5) + 8, 'text-anchor': 'middle', class: 'svg-small', text: `${g} · ${range}` }, gridG);
    G_COLORS[i].forEach((c, j) => el('rect', { x: x + cw * j + 2, y: y + rh * i + 2, width: cw - 4, height: rh - 4, rx: 8, fill: c, opacity: 0.8 }, gridG));
  });
  el('text', { x: x + cw * 1.5, y: y + rh * 6 + 40, 'text-anchor': 'middle', class: 'svg-small', text: 'green = low risk  ·  red = high risk of kidney failure and heart disease' }, gridG);
  trail = el('polyline', { fill: 'none', stroke: '#ffffff', 'stroke-width': 3, 'stroke-dasharray': '6 6', opacity: 0.8 }, gridG);
  marker = el('g', {}, gridG);
  el('circle', { r: 20, fill: 'none', stroke: '#ffffff', 'stroke-width': 4 }, marker);
  el('circle', { r: 7, fill: '#ffffff' }, marker);
  gridEgfr = el('text', { x: 600, y: 92, 'text-anchor': 'middle', class: 'svg-big', text: '' }, gridG);
}
const gridXY = (egfr, uacr) => [
  GRID.x + GRID.cw * pw(uacr, [[0, 0], [30, 1], [300, 2], [1000, 3]]),
  GRID.y + GRID.rh * pw(egfr, [[120, 0], [90, 1], [60, 2], [45, 3], [30, 4], [15, 5], [0, 6]]),
];
function renderGrid(st, time, dt, o, S) {
  show(gridG, o);
  if (o < 0.005) return;
  const t = ease(seg(S('ckd'), 0.15, 0.75));
  const egfr = lerp(92, 48, t), uacr = lerp(12, 180, t);
  const [mx, my] = gridXY(egfr, uacr);
  set(marker, { transform: `translate(${mx.toFixed(1)} ${my.toFixed(1)}) scale(${(1 + 0.08 * Math.sin(time * 4)).toFixed(3)})` });
  const pts = [];
  for (let k = 0; k <= 20; k++) { const q = (k / 20) * t; pts.push(gridXY(lerp(92, 48, q), lerp(12, 180, q)).map(v => v.toFixed(1)).join(',')); }
  set(trail, { points: pts.join(' ') });
  set(gridEgfr, { text: `eGFR ${Math.round(egfr)}  ·  UACR ${Math.round(uacr)}  →  CKD ${egfr >= 90 ? 'G1' : egfr >= 60 ? 'G2' : egfr >= 45 ? 'G3a' : 'G3b'} ${uacr < 30 ? 'A1' : uacr < 300 ? 'A2' : 'A3'}` });
}

// ---------- scene: kidney feedback loop ----------
function buildLoop(svg) {
  loopG = el('g', {}, svg);
  topArc = el('path', { d: 'M 400 400 C 480 230 720 230 800 400', fill: 'none', stroke: '#ffb84d', 'stroke-width': 4, opacity: 0.6 }, loopG);
  el('path', { d: 'M 784 386 L 802 404 L 806 380', fill: 'none', stroke: '#ffb84d', 'stroke-width': 4, opacity: 0.8 }, loopG);
  botArc = el('path', { d: 'M 800 640 C 720 810 480 810 400 640', fill: 'none', stroke: '#ff6a74', 'stroke-width': 4, opacity: 0.6 }, loopG);
  el('path', { d: 'M 416 654 L 398 636 L 394 660', fill: 'none', stroke: '#ff6a74', 'stroke-width': 4, opacity: 0.8 }, loopG);
  el('text', { x: 600, y: 230, 'text-anchor': 'middle', class: 'svg-label', style: 'font-size:22px', fill: '#ffb84d', text: 'signal: tighten vessels, hold salt & water' }, loopG);
  el('text', { x: 600, y: 838, 'text-anchor': 'middle', class: 'svg-label', style: 'font-size:22px', fill: '#ff8a92', text: 'blood pressure reaches the kidneys' }, loopG);
  topArc.len = topArc.getTotalLength();
  botArc.len = botArc.getTotalLength();
  sigDots = Array.from({ length: 9 }, (_, i) => ({ u: i / 9, node: el('circle', { r: 7, fill: '#ffb84d' }, loopG) }));
  presDots = Array.from({ length: 9 }, (_, i) => ({ u: i / 9, node: el('circle', { r: 7, fill: '#ff6a74' }, loopG) }));
  // kidney with its pressure sensor
  const k = el('g', { transform: 'translate(320 520)' }, loopG);
  kidneyBody = el('path', { d: 'M 20 -110 C 120 -110 140 90 40 115 C -20 128 -70 70 -26 22 C 2 -6 -6 -30 -34 -50 C -70 -80 -36 -110 20 -110 Z', fill: '#b4504c', stroke: '#e89088', 'stroke-width': 3 }, k);
  dial = el('circle', { cx: 50, cy: 0, r: 34, fill: '#1c2433', stroke: '#c9d6ea', 'stroke-width': 3 }, k);
  el('path', { d: 'M 26 10 A 26 26 0 0 1 74 10', fill: 'none', stroke: '#3fbf7f', 'stroke-width': 5 }, k);
  needle = el('line', { x1: 50, y1: 10, x2: 50, y2: -18, stroke: '#ffffff', 'stroke-width': 3.5, 'stroke-linecap': 'round' }, k);
  el('text', { x: -50, y: 160, 'text-anchor': 'middle', class: 'svg-label', style: 'font-size:26px', text: 'kidneys' }, k);
  sensorText = el('text', { x: -50, y: 192, 'text-anchor': 'middle', class: 'svg-small', text: '' }, k);
  // blood vessels
  const v = el('g', { transform: 'translate(880 520)' }, loopG);
  vesselMuscle = el('circle', { r: 90, fill: 'none', stroke: '#f07a84' }, v);
  el('circle', { r: 66, fill: 'url(#bloodGrad)', stroke: C.lumenLine, 'stroke-width': 3 }, v);
  el('text', { x: 50, y: 150, 'text-anchor': 'middle', class: 'svg-label', style: 'font-size:26px', text: 'blood vessels' }, v);
  blockX = el('g', { opacity: 0, transform: 'translate(600 272)' }, loopG);
  el('circle', { r: 30, fill: '#1c2433', stroke: '#ff5a5a', 'stroke-width': 4 }, blockX);
  el('path', { d: 'M -14 -14 L 14 14 M 14 -14 L -14 14', stroke: '#ff5a5a', 'stroke-width': 6, 'stroke-linecap': 'round' }, blockX);
  el('text', { y: 64, 'text-anchor': 'middle', class: 'svg-label', style: 'font-size:22px', text: 'ACE inhibitor / ARB' }, blockX);
}

function renderLoop(st, time, dt, o, S) {
  show(loopG, o);
  if (o < 0.005) return;
  const dmg = Math.max(seg(S('loop'), 0.35, 0.8), S('lifestyle') > 0 ? 1 : 0) * (1 - 0.6 * seg(S('acearb'), 0.15, 0.5));
  const block = seg(S('acearb'), 0.05, 0.2);
  set(kidneyBody, { fill: mix('#b4504c', '#6a5a5c', dmg * 0.8) });
  // the damaged kidney "sees" too little pressure
  const reading = lerp(0, -1, dmg);
  const ang = reading * 55 + Math.sin(time * 2) * 4;
  set(needle, { transform: `rotate(${ang.toFixed(1)} 50 10)` });
  set(sensorText, { text: block > 0.5 ? 'signal blocked — vessels relax' : dmg > 0.4 ? 'reads: “too low!” (but it isn’t)' : 'reads: just right', fill: dmg > 0.4 && block < 0.5 ? '#ff8a8a' : C.inkDim });
  const speed = 0.12 + 0.3 * dmg * (1 - block);
  sigDots.forEach(d => {
    d.u = (d.u + speed * dt) % 1;
    const stopped = block > 0.5 && d.u > 0.46;
    const p = topArc.getPointAtLength(Math.min(d.u, block > 0.5 ? 0.46 : 1) * topArc.len);
    set(d.node, { cx: p.x, cy: p.y, opacity: stopped ? 0 : 1, r: 6 + 3 * dmg });
  });
  presDots.forEach(d => {
    d.u = (d.u + 0.15 * dt) % 1;
    const p = botArc.getPointAtLength(d.u * botArc.len);
    set(d.node, { cx: p.x, cy: p.y });
  });
  set(vesselMuscle, { 'stroke-width': 8 + 26 * st.tight });
  set(blockX, { opacity: block });
}

// ---------- scene: lifestyle bars ----------
const LIFE = [['Cut salt', 5], ['DASH-style eating', 8], ['Lose 10 lb', 5], ['Exercise most days', 6], ['Limit alcohol', 4], ['Less stress', 3]];
function buildBars(svg) {
  barsG = el('g', {}, svg);
  el('text', { x: 600, y: 210, 'text-anchor': 'middle', class: 'svg-label', style: 'font-size:26px', text: 'Typical drop in the top number' }, barsG);
  bars = LIFE.map(([label, v], i) => {
    const y = 270 + i * 82;
    el('text', { x: 420, y: y + 32, 'text-anchor': 'end', class: 'svg-label', style: 'font-size:24px', text: label }, barsG);
    const rect = el('rect', { x: 440, y: y + 8, height: 34, rx: 6, width: 0, fill: i === 5 ? '#6b8fb8' : '#4aa3ff' }, barsG);
    const val = el('text', { y: y + 33, class: 'svg-label', style: 'font-size:24px', text: i === 5 ? 'a few' : `≈ ${v}` }, barsG);
    return { rect, val, v };
  });
  el('text', { x: 600, y: 790, 'text-anchor': 'middle', class: 'svg-small', text: 'points (mmHg), in people with high blood pressure — each takes weeks to months' }, barsG);
}
function renderBars(st, time, dt, o, S) {
  show(barsG, o);
  if (o < 0.005) return;
  bars.forEach((b, i) => {
    const w = 50 * b.v * easeOut(seg(S('lifestyle'), 0.1 + i * 0.08, 0.3 + i * 0.08));
    set(b.rect, { width: w });
    set(b.val, { x: 452 + w, opacity: w > 1 ? 1 : 0 });
  });
}

function build(svg) {
  buildPulse(svg);
  buildTube(svg);
  csLow = new CrossSection(svg, { cx: 320, cy: 480, R: 165, title: 'Under 130/80', mode: 'healthy', seed: 3 });
  csHigh = new CrossSection(svg, { cx: 880, cy: 480, R: 165, title: 'Above 130/80 for years', mode: 'plaque', seed: 7 });
  csHigh.titleEl.classList.add('danger-fill');
  buildSalt(svg);
  buildFilter(svg);
  buildGrid(svg);
  buildLoop(svg);
  buildBars(svg);
  buildReadout(svg);
}

// crossfade between scenes as steps change
function sceneOpacities(S) {
  let i = 0;
  steps.forEach((s, k) => { if (S(s.id) > 0) i = k; });
  const id = steps[i].id, l = S(id);
  const cur = SCENE[id], prev = i > 0 ? SCENE[steps[i - 1].id] : cur;
  const out = {};
  if (prev === cur) out[cur] = 1;
  else { out[prev] = 1 - seg(l, 0, 0.25); out[cur] = seg(l, 0.1, 0.35); }
  if (id === 'acearb') { out.loop = (out.loop ?? 0) * (1 - seg(l, 0.5, 0.62)); out.filter = seg(l, 0.55, 0.72); }
  return out;
}

function render(S, time, dt) {
  const st = bpState(S);
  beat += (dt * st.hr) / 60;
  const ph = beat % 1;
  hist.push({ t: time, p: st.dia + (st.sys - st.dia) * wave(ph) });
  while (hist.length && time - hist[0].t > 4.2) hist.shift();

  const O = sceneOpacities(S);
  renderPulse(st, time, dt, O.pulse ?? 0, S);
  renderTube(st, time, dt, O.tube ?? 0, S, ph);
  const csO = O.cs ?? 0;
  const t = ease(seg(S('stiff'), 0.15, 0.75)), hard = ease(seg(S('stiff'), 0.4, 0.9));
  csLow.update(t, 0, time, csO);
  csHigh.update(t, hard, time, csO);
  set(csLow.note, { text: t > 0.5 ? 'open & flexible' : '' });
  set(csHigh.note, { text: t > 0.5 ? (hard > 0.4 ? 'thick, stiff & narrow' : 'thickening') : '' });
  renderSalt(st, time, dt, O.salt ?? 0, S);
  renderFilter(st, time, dt, O.filter ?? 0, S);
  renderGrid(st, time, dt, O.grid ?? 0, S);
  renderLoop(st, time, dt, O.loop ?? 0, S);
  renderBars(st, time, dt, O.bars ?? 0, S);

  const rO = Math.max(O.pulse ?? 0, O.tube ?? 0, O.salt ?? 0, O.loop ?? 0, O.bars ?? 0);
  show(readout, rO);
  const tO = O.tube ?? 0;
  set(readout, { transform: `translate(${(300 * tO).toFixed(1)} ${(700 * tO).toFixed(1)})` });
  const [cat, col] = bpCategory(st.sys, st.dia);
  set(readNum, { text: `Blood pressure ${Math.round(st.sys)}/${Math.round(st.dia)}`, fill: col });
  const goal = S('summary') > 0.3 && st.sys < 130 && st.dia < 80;
  set(readCat, { text: goal ? 'at goal: below 130/80' : cat, fill: goal ? '#3fbf7f' : C.inkDim });
}

runModule({ title: 'Blood Pressure', steps, build, render });
