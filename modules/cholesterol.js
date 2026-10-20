// Cholesterol: how arteries crack and get repaired, why HDL repairs smoothly and
// LDL leaves bulging scars, and what decades of each do to the artery.

import { runModule } from '../js/scrolly.js';
import { el, set, seg, ease, easeOut, lerp, mix, rng } from '../js/core.js';
import { C, Tube, CrossSection, makeCrack, makePatch, makeScar, makeLDL, makeHDL, place } from '../js/art.js';

const steps = [
  { id: 'artery', html: `<h2>Your arteries</h2><p>Arteries are flexible tubes that carry blood from the heart to every part of the body.</p>` },
  { id: 'inside', html: `<h2>Looking inside</h2><p>The inner lining is normally smooth, so blood flows through easily.</p>` },
  { id: 'cracks', html: `<h2>Everyday wear and tear</h2><p>The lining is constantly getting tiny cracks — from blood pressure, smoking, high blood sugar, inflammation, and simply living. The body is always repairing them.</p>` },
  { id: 'meet', html: `<h2>The repair crew: cholesterol</h2><p>Cholesterol travels in the blood inside particles.</p><p><b class="ldl">LDL</b> is big and puffy.<br><b class="hdl">HDL</b> is small and dense.</p><p>Both get used to patch the cracks.</p>` },
  { id: 'hdl', weight: 1.4, html: `<h2><span class="hdl">HDL</span> repairs smoothly</h2><p>HDL fits neatly into a crack. The repair may leave a faint mark at first, but it smooths over and blends back in.</p>` },
  { id: 'ldl', weight: 1.4, html: `<h2><span class="ldl">LDL</span> leaves a bump</h2><p>LDL is too bulky to fit. It spills over the edges and heals as a thick, bulging scar — the beginning of <b>plaque</b>.</p>` },
  { id: 'slice', html: `<h2>Looking end-on</h2><p>If we slice across the artery, we can watch what years of repairs do to the opening that blood flows through.</p>` },
  { id: 'years', weight: 1.8, html: `<h2>Over the years</h2><p>Repairs done mostly by <b class="hdl">HDL</b> keep the opening wide.</p><p>Repairs done mostly by <b class="ldl">LDL</b> stack up, layer on layer, narrowing the artery.</p>` },
  { id: 'harden', weight: 1.3, html: `<h2>Narrow <em>and</em> hard</h2><p>Old plaque also hardens with calcium. A healthy artery flexes with every heartbeat; a hardened one can’t.</p><p>Narrowed, hardened arteries are what lead to heart attacks and strokes.</p>` },
  { id: 'action', html: `<h2>What we can do</h2><ul>
      <li>Swap saturated &amp; trans fats for <b>healthy fats</b> — olive oil, nuts, avocado, fish</li>
      <li><b>Move</b> every day — exercise helps raise HDL</li>
      <li>Don’t smoke; keep blood pressure and sugar in range</li>
      <li>A <b>statin</b> lowers LDL and helps stabilize plaque that’s already there</li></ul>` },
];

let tube, crackH, crackL, patch, scar, hdls, ldls, legend, crackLabel, cut, cutLabel, csH, csL, yearText, yearBar, yearFill;

// map a point in a crack's frame to tube-local coordinates
function crackToTube(cr, x, y, [px, py]) {
  const a = (cr.angle * Math.PI) / 180;
  return [x + px * Math.cos(a) - py * Math.sin(a), y + px * Math.sin(a) + py * Math.cos(a)];
}

function build(svg) {
  tube = new Tube(svg, { cells: 16 });
  const L = tube.L;

  const H = { x: -205, y: -60, angle: -6 }, Lc = { x: 175, y: -56, angle: 5 };
  crackH = makeCrack(tube.deco, { ...H, len: 150, gap: 22, seed: 5 });
  crackL = makeCrack(tube.deco, { ...Lc, len: 160, gap: 24, seed: 9 });
  patch = makePatch(crackH);
  scar = makeScar(crackL, 21);

  const r = rng(42);
  hdls = crackH.slots(9).map((s, i) => ({
    node: makeHDL(tube.particles, 9.5),
    start: [-L + 30, (r() - 0.5) * 60],
    wait: [lerp(-400, -150, r()), lerp(15, 95, r())],
    slot: crackToTube(H, H.x, H.y, s),
    ph: r() * 6.28,
  }));
  ldls = crackL.slots(5).map((s, i) => ({
    node: makeLDL(tube.particles, 25, 30 + i),
    start: [-L + 40, (r() - 0.5) * 60],
    wait: [lerp(-80, 320, i / 4) + (r() - 0.5) * 40, lerp(35, 80, r())],
    slot: crackToTube(Lc, Lc.x, Lc.y, [s[0], s[1] + (i % 2 ? 9 : -9)]),
    ph: r() * 6.28,
  }));

  // label pointing at the cracks
  crackLabel = el('g', { opacity: 0 }, svg);
  const tip1 = tube.toScreen(H.x, H.y - 14), tip2 = tube.toScreen(Lc.x, Lc.y - 16);
  el('text', { x: 150, y: 120, class: 'svg-label', text: 'tiny cracks' }, crackLabel);
  el('path', { d: `M 205 135 Q ${tip1[0] - 40} ${tip1[1] - 90} ${tip1[0]} ${tip1[1]}`, class: 'leader' }, crackLabel);
  el('path', { d: `M 290 120 Q ${tip2[0] - 80} ${tip2[1] - 120} ${tip2[0]} ${tip2[1]}`, class: 'leader' }, crackLabel);

  // legend: the two particles, big and labeled
  legend = el('g', { opacity: 0 }, svg);
  const ldlBig = makeLDL(legend, 46, 3);
  place(ldlBig, 860, 735);
  el('text', { x: 860, y: 747, 'text-anchor': 'middle', class: 'particle-name', fill: '#4a3008', text: 'LDL' }, legend);
  el('text', { x: 860, y: 832, 'text-anchor': 'middle', class: 'svg-note', text: 'big · puffy' }, legend);
  const hdlBig = makeHDL(legend, 22);
  place(hdlBig, 1060, 735);
  el('text', { x: 1060, y: 790, 'text-anchor': 'middle', class: 'particle-name', fill: C.hdl, text: 'HDL' }, legend);
  el('text', { x: 1060, y: 832, 'text-anchor': 'middle', class: 'svg-note', text: 'small · dense' }, legend);

  // slicing line
  cut = el('ellipse', { cx: 0, cy: 0, rx: tube.ex, ry: tube.R + 10, fill: 'none', stroke: '#ffffff', 'stroke-width': 3, 'stroke-dasharray': '10 8', opacity: 0 }, tube.overlay);
  const cp = tube.toScreen(0, -tube.R - 30);
  cutLabel = el('text', { x: cp[0] - 30, y: cp[1] - 10, 'text-anchor': 'middle', class: 'svg-label', opacity: 0, text: 'slice' }, svg);

  // cross-sections
  csH = new CrossSection(svg, { cx: 320, cy: 480, R: 165, title: 'Repaired mostly by HDL', mode: 'healthy', seed: 4 });
  csL = new CrossSection(svg, { cx: 880, cy: 480, R: 165, title: 'Repaired mostly by LDL', mode: 'plaque', seed: 8 });
  csH.titleEl.classList.add('hdl-fill');
  csL.titleEl.classList.add('ldl-fill');
  yearText = el('text', { x: 600, y: 120, 'text-anchor': 'middle', class: 'svg-big', opacity: 0, text: '' }, svg);
  yearBar = el('rect', { x: 420, y: 146, width: 360, height: 8, rx: 4, fill: '#2a3344', opacity: 0 }, svg);
  yearFill = el('rect', { x: 420, y: 146, width: 0, height: 8, rx: 4, fill: C.ink, opacity: 0 }, svg);
}

function render(S, time, dt) {
  const sInside = S('inside'), sCracks = S('cracks'), sMeet = S('meet'), sHdl = S('hdl'), sLdl = S('ldl');
  const sSlice = S('slice'), sYears = S('years'), sHard = S('harden');

  // --- long view of the artery ---
  const tubeO = 1 - seg(sSlice, 0.45, 0.8);
  tube.setOpacity(tubeO, lerp(1, 0.9, seg(sSlice, 0.45, 0.8)));
  if (tubeO > 0) {
    tube.setFront(1 - 0.76 * ease(seg(sInside, 0.1, 0.6)));
    tube.tick(dt);

    // cracks open
    const hFill = seg(sHdl, 0.48, 0.6);
    crackH.grow(easeOut(seg(sCracks, 0.1, 0.45)), 1 - hFill);
    crackL.grow(easeOut(seg(sCracks, 0.3, 0.65)));

    // particles arrive, then wait in the bloodstream
    hdls.forEach((p, i) => {
      const a = seg(sMeet, 0.08 + i * 0.035, 0.45 + i * 0.035);
      const bob = [Math.sin(time * 1.3 + p.ph) * 6, Math.cos(time * 1.1 + p.ph) * 5];
      let x = lerp(p.start[0], p.wait[0], ease(a)) + bob[0];
      let y = lerp(p.start[1], p.wait[1], ease(a)) + bob[1];
      // HDL slips into its crack
      const m = ease(seg(sHdl, 0.05 + i * 0.03, 0.38 + i * 0.03));
      x = lerp(x, p.slot[0], m);
      y = lerp(y, p.slot[1], m);
      const o = seg(a, 0, 0.15) * (1 - seg(sHdl, 0.52, 0.64));
      place(p.node, x, y, 1, o);
    });
    ldls.forEach((p, i) => {
      const a = seg(sMeet, 0.15 + i * 0.06, 0.55 + i * 0.06);
      const bob = [Math.sin(time * 0.9 + p.ph) * 7, Math.cos(time * 0.8 + p.ph) * 6];
      let x = lerp(p.start[0], p.wait[0], ease(a)) + bob[0];
      let y = lerp(p.start[1], p.wait[1], ease(a)) + bob[1];
      // LDL crowds into its crack, spills over, and smears
      const m = ease(seg(sLdl, 0.05 + i * 0.05, 0.36 + i * 0.05));
      x = lerp(x, p.slot[0], m);
      y = lerp(y, p.slot[1], m);
      const spread = 1 + 0.25 * seg(sLdl, 0.42, 0.58);
      const o = seg(a, 0, 0.15) * (1 - seg(sLdl, 0.58, 0.72));
      place(p.node, x, y, spread, o, Math.sin(time * 0.5 + p.ph) * 10);
    });

    // HDL patch: brownish at first, then blends back into the lining
    set(patch, {
      opacity: seg(sHdl, 0.45, 0.58),
      fill: mix(C.scarBrown, '#d9773f', 0.86 * ease(seg(sHdl, 0.66, 0.9))),
    });
    // LDL scar: bulges up past the crack
    const sc = seg(sLdl, 0.5, 0.7);
    set(scar, { opacity: sc, transform: `scale(${lerp(0.55, 1, easeOut(sc)).toFixed(3)})` });

    // legend
    set(legend, { opacity: seg(sMeet, 0.05, 0.3) * (1 - 0.35 * seg(sHdl, 0, 0.2)) * (1 - seg(sSlice, 0.3, 0.6)) });

    // slice line
    const cutO = seg(sSlice, 0.05, 0.25) * (1 - seg(sSlice, 0.55, 0.75));
    set(cut, { opacity: cutO });
    set(cutLabel, { opacity: cutO });
  } else {
    set(legend, { opacity: 0 });
    set(cutLabel, { opacity: 0 });
  }
  set(crackLabel, { opacity: seg(sCracks, 0.55, 0.75) * (1 - seg(sMeet, 0.05, 0.25)) });

  // --- cross-sections over the years ---
  const csO = seg(sSlice, 0.55, 0.9);
  const t = ease(seg(sYears, 0.08, 0.92));
  const hard = ease(seg(sHard, 0.05, 0.75));
  csH.update(t, 0, time, csO);
  csL.update(t, hard, time, csO);
  const years = Math.round(t * 40);
  const yO = csO * seg(sYears, 0, 0.08);
  set(yearText, { opacity: yO, text: years === 0 ? 'Today' : `${years} years of repairs` });
  set(yearBar, { opacity: yO });
  set(yearFill, { opacity: yO, width: 360 * t });
  const shrink = Math.round((1 - Math.pow(csL.lumenAt(t).r / csL.startR, 2)) * 100);
  const shrinkH = Math.round((1 - Math.pow(csH.lumenAt(t).r / csH.startR, 2)) * 100);
  set(csH.note, { text: sHard > 0.3 ? 'still flexible' : t > 0.05 ? `opening ${shrinkH}% smaller` : '' });
  set(csL.note, { text: sHard > 0.3 ? 'stiff & calcified' : t > 0.05 ? `opening ${shrink}% smaller` : '' });
}

runModule({ title: 'Cholesterol', steps, build, render });
