// Renin-angiotensin-aldosterone system: a clinician-level review in three parts —
// physiology; hypertension and kidney disease; medications on the pathway.
// Content follows the "RAAS audio review" (Nov 12, 2026) transcript and its sources.

import { runModule } from '../js/scrolly.js';
import { el, set, seg, ease, lerp, mix, rng, clamp } from '../js/core.js';
import { C } from '../js/art.js';

const P1 = '<span class="part">Part 1 · Physiology</span>';
const P2 = '<span class="part">Part 2 · Hypertension &amp; kidney disease</span>';
const P3 = '<span class="part">Part 3 · Medications</span>';

const steps = [
  // ---- Part 1 ----
  { id: 'rescue', html: `${P1}<h2>A pressure-and-sodium rescue program</h2><p>The renin–angiotensin–aldosterone system preserves circulation when the kidney senses underfilling.</p><p>The problem: a useful short-term rescue can become a harmful long-term setting.</p>` },
  { id: 'triggers', weight: 1.2, html: `${P1}<h2>What releases renin</h2><p>Picture diarrhea in a patient taking a diuretic: less effective circulating volume reaches the kidney. Three signals increase renin release from juxtaglomerular cells:</p><ul><li>↓ pressure at the afferent arteriole</li><li>↓ NaCl delivery to the macula densa</li><li>sympathetic stimulation via β1 receptors</li></ul>` },
  { id: 'cascade', weight: 1.2, html: `${P1}<h2>The cascade</h2><p>Renin cleaves liver-derived <b>angiotensinogen</b> into <b>angiotensin I</b>. <b>ACE</b> converts that into <b class="ang">angiotensin II</b>.</p><p>ACE is on vascular endothelium — prominently in the lungs, but this isn’t a lung-only pathway.</p>` },
  { id: 'angii', weight: 1.2, html: `${P1}<h2>Angiotensin II at AT1</h2><p>Acting mainly through the <b>AT1 receptor</b>, angiotensin II raises vascular resistance and promotes renal sodium retention. It stimulates <b class="aldo">aldosterone</b> release from the adrenal cortex, and drives thirst and water conservation.</p><p>Pressure is defended by tighter vessels <em>and</em> retained sodium and water.</p>` },
  { id: 'aldo', weight: 1.4, html: `${P1}<h2>Aldosterone: the slower, distal arm</h2><p>It binds the mineralocorticoid receptor and increases sodium-uptake machinery — <b>ENaC</b> and the <b>Na⁺/K⁺ pump</b>. Sodium is retained; potassium and hydrogen-ion excretion increase. Excess explains hypertension, hypokalemia and metabolic alkalosis.</p><p>Aldosterone isn’t entirely renin-dependent: <b>potassium directly stimulates it</b>. And normal potassium doesn’t exclude aldosterone excess.</p>` },
  { id: 'glom', weight: 1.4, html: `${P1}<h2>Inside the glomerulus</h2><p>Incoming arteriole, capillary filter, outgoing arteriole. When perfusion is threatened, angiotensin-mediated <b>efferent constriction</b> helps support pressure inside the filter.</p><p>A useful bedside model — not a universal rule. Concentration, afferent tone and total renal blood flow also matter.</p>` },
  { id: 'block', weight: 1.3, html: `${P1}<h2>Blocking the system</h2><p>Blockade relaxes the efferent side and lowers intraglomerular pressure. That may cause a <b>modest early fall in eGFR</b> and rise in creatinine — even while reducing long-term injury.</p><p>A pressure change across the filter isn’t automatically structural kidney damage.</p>` },
  { id: 'ras', weight: 1.3, html: `${P1}<h2>When filtration depends on it</h2><p>With significant renal hypoperfusion or severe <b>bilateral renal artery stenosis</b>, filtration leans heavily on angiotensin’s efferent support.</p><p>Remove that support and filtration may <b>fall sharply</b>.</p>` },
  { id: 'effective', weight: 1.3, html: `${P1}<h2>Perceived, not total, filling</h2><p>The kidney responds to its perception of <b>effective arterial filling</b> — not simply the amount of fluid in the body.</p><p>A visibly congested heart-failure patient can still activate this rescue system. Chronic activation then adds vasoconstriction, sodium retention and tissue injury to a circulation that’s already struggling.</p>` },
  // ---- Part 2 ----
  { id: 'htn', weight: 1.3, html: `${P2}<h2>Hypertension is heterogeneous</h2><p>The question isn’t just whether renin is high, but whether sodium balance, vascular tone and aldosterone are <b>appropriate for the pressure and volume state</b>.</p><p>Some patients are low-renin and salt-sensitive. Low renin doesn’t make the pathway irrelevant — and renin isn’t a routine test for choosing every patient’s drug.</p>` },
  { id: 'ckd', weight: 1.4, html: `${P2}<h2>CKD: a reinforcing loop</h2><p>Higher pressure damages the remaining filters. Fewer nephrons carry the workload, and pressure in the surviving glomeruli can stay high.</p><p><b>Albuminuria</b> is a sign of kidney injury and a marker of risk — not just an incidental urine finding.</p>` },
  { id: 'acekid', weight: 1.3, html: `${P2}<h2>Why blockade protects kidneys</h2><p>Lowering intraglomerular pressure can reduce albumin leak and slow progression in appropriately selected patients.</p><p>KDIGO’s strongest support is in <b>albuminuric CKD</b>; strength varies with diabetes status and degree of albuminuria. With little or none, these drugs may still be right for hypertension or heart failure — but don’t claim an identical kidney benefit.</p>` },
  { id: 'monitor', weight: 1.6, html: `${P2}<h2>Expected change or warning sign?</h2><p>Check <b>BP, creatinine and K⁺ within 2–4 weeks</b> of starting or increasing an ACEi/ARB — earlier when higher risk.</p><p>KDIGO: continue unless creatinine rises <b>&gt;30% within 4 weeks</b>. Crossing it isn’t proof of toxicity — assess volume depletion, other drugs, AKI and renal artery stenosis.</p><p>Low eGFR alone isn’t a reason to stop: continue below 30 when tolerated. Correct contributors to hyperkalemia before abandoning protective therapy.</p>` },
  { id: 'pa', weight: 1.6, html: `${P2}<h2>Primary aldosteronism</h2><p>The adrenal makes aldosterone inappropriately; sodium retention and volume expansion <b>suppress renin</b>. The clue is aldosterone inappropriately high <em>with</em> suppressed renin — not the ratio in isolation.</p><p>Most patients aren’t hypokalemic; the 2025 Endocrine Society guideline suggests screening hypertension more broadly. Interpret with K⁺, medications, assay units and collection conditions.</p><p>Unilateral disease, surgery appropriate → adrenalectomy. Bilateral or nonsurgical → MR blockade.</p>` },
  // ---- Part 3 ----
  { id: 'acei', weight: 1.3, html: `${P3}<h2>ACE inhibitors</h2><p class="eg">e.g. lisinopril</p><p>Reduce conversion of angiotensin I to II. ACE also breaks down <b>bradykinin</b> — interfering with that helps explain the <b>cough and angioedema</b> of this class.</p>` },
  { id: 'arb', weight: 1.3, html: `${P3}<h2>Angiotensin receptor blockers</h2><p class="eg">e.g. losartan</p><p>Block the AT1 receptor instead. No direct effect on bradykinin breakdown, so cough is less common; angioedema less common, not impossible.</p><p>Shared risks: <b>hyperkalemia, hypotension, and a hemodynamic fall in filtration</b>.</p>` },
  { id: 'firstline', html: `${P3}<h2>Where they fit</h2><p>For ordinary hypertension, an ACEi or ARB is <b>one</b> first-line option alongside thiazide-type diuretics and long-acting dihydropyridine CCBs.</p><p>Albuminuric kidney disease is a reason to favor pathway blockade — not an assumption that it’s the best single drug for everybody.</p>` },
  { id: 'dual', weight: 1.2, html: `${P3}<h2>Don’t double up</h2><p>Don’t combine an ACEi and an ARB for extra kidney protection; KDIGO also advises against combining either with a <b>direct renin inhibitor</b> in CKD.</p><p>More blockade can reduce albuminuria while worsening outcomes through AKI and hyperkalemia. A better-looking surrogate doesn’t guarantee a better outcome.</p>` },
  { id: 'mra', weight: 1.6, html: `${P3}<h2>Mineralocorticoid receptor antagonists</h2><p><b>Spironolactone, eplerenone:</b> primary aldosteronism, resistant hypertension, selected heart failure. Spironolactone can cause breast tenderness or gynecomastia; eplerenone is more receptor-selective. Both raise K⁺ — especially with reduced kidney function or with ACEi/ARB.</p><p><b>Finerenone</b> (nonsteroidal): reduces kidney and CV risk in CKD with type 2 diabetes — an add-on for persistent albuminuria despite tolerated ACEi/ARB, not a replacement. Baseline K⁺ and eGFR; K⁺ at 4 weeks and after dose changes. Its indications have expanded beyond this example.</p>` },
  { id: 'indirect', weight: 1.4, html: `${P3}<h2>Indirect effects</h2><p><b>β-blockers</b> reduce renin release through β1 blockade.</p><p><b>Diuretics</b> remove sodium but trigger compensatory renin and aldosterone — not failure; it’s why complementary classes work together.</p><p><b>SGLT2 inhibitors</b> are a separate kidney-protective class, often layered on an ACEi/ARB — not direct RAAS blockers.</p>` },
  { id: 'whammy', weight: 1.5, html: `${P3}<h2>The triple whammy</h2><p><b>Diuretic</b> ↓ effective volume + <b>ACEi/ARB</b> removes efferent support + <b>NSAID</b> impairs prostaglandin-dependent renal perfusion → filtration can fall sharply.</p><p>When K⁺ rises, review supplements, potassium-containing salt substitutes and potassium-sparing drugs. ACEi and ARBs should not be used in pregnancy.</p>` },
  { id: 'closing', weight: 1.2, html: `<h2>The closing model</h2><p><b class="ang">Angiotensin</b> tightens vessels and supports sodium retention; <b class="aldo">aldosterone</b> retains sodium while promoting potassium loss.</p><p>Blocking them lowers pressure and protects vulnerable organs, but changes filtration and potassium handling. Follow <b>indication, albuminuria, volume state, creatinine trend and potassium</b> together.</p>` },
  { id: 'sources', html: `<h2>Sources</h2><ul class="sources">
      <li><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC11033231/" target="_blank" rel="noopener">Schrankl et al., RAAS physiology review (2024)</a></li>
      <li><a href="https://kdigo.org/wp-content/uploads/2024/03/KDIGO-2024-CKD-Guideline.pdf" target="_blank" rel="noopener">KDIGO 2024 CKD guideline</a> · <a href="https://kdigo.org/wp-content/uploads/2024/03/KDIGO-2024-CKD-Guideline-Top-10-Takeaways-for-PCPs-Management.pdf" target="_blank" rel="noopener">PCP summary</a></li>
      <li><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC12158546/" target="_blank" rel="noopener">KDIGO 2024 primer for pharmacists (2025)</a></li>
      <li><a href="https://www.jacc.org/doi/10.1016/j.jacc.2025.05.007" target="_blank" rel="noopener">2025 AHA/ACC hypertension guideline</a></li>
      <li><a href="https://www.endocrine.org/clinical-practice-guidelines/primary-aldosteronism-2" target="_blank" rel="noopener">2025 Endocrine Society primary aldosteronism guideline</a></li>
      <li><a href="https://www.msdmanuals.com/professional/endocrine-and-metabolic-disorders/adrenal-disorders/primary-aldosteronism" target="_blank" rel="noopener">MSD Manual: primary aldosteronism</a></li>
      <li>DailyMed labels: <a href="https://dailymed.nlm.nih.gov/dailymed/fda/fdaDrugXsl.cfm?setid=e6898cf8-34c8-44d5-8a86-fbe3be847b16&amp;type=display" target="_blank" rel="noopener">lisinopril</a> · <a href="https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=fc726765-5d5a-4d6e-b037-b847bda9fb7c" target="_blank" rel="noopener">finerenone</a> · <a href="https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=1c97ce61-8e49-4724-a636-d179479d346c" target="_blank" rel="noopener">spironolactone</a></li>
      <li><a href="https://bpac.org.nz/2018/triple-whammy.aspx" target="_blank" rel="noopener">bpacnz: avoiding the triple whammy (2018)</a></li></ul>
      <p class="eg">Educational synthesis, not a patient-specific prescribing plan. No doses.</p>` },
];

const SCENE = {
  glom: 'glom', block: 'glom', ras: 'glom', ckd: 'glom', acekid: 'glom', whammy: 'glom',
  monitor: 'chart', firstline: 'cards',
};
const sceneOf = id => SCENE[id] || 'path';

// which parts of the pathway light up in each step ('all' = everything)
const ACTIVE = {
  rescue: 'all', triggers: ['trig', 'kidney', 'renin'], cascade: ['liver', 'agt', 'renin', 'angi', 'ace', 'angii'],
  angii: ['angii', 'at1', 'eff', 'adrenal', 'fb'], aldo: ['adrenal', 'k', 'aldo', 'cell'], effective: 'all',
  htn: ['angii', 'at1', 'eff', 'adrenal', 'aldo', 'cell', 'fb'], pa: ['adrenal', 'aldo', 'cell', 'fb'],
  acei: ['angi', 'ace', 'angii', 'brady'], arb: ['angii', 'at1', 'eff'], dual: 'all', mra: ['adrenal', 'aldo', 'cell', 'k'],
  indirect: ['trig', 'kidney', 'renin', 'fb'], closing: 'all', sources: 'all',
};

const COL = { renin: '#7cc4ff', agt: '#c9d6ea', ang1: '#ffd27a', ang2: '#ffb84d', aldo: '#c99bff', na: '#ffe066', k: '#b98cff', h: '#7fe0d0', brady: '#ff8fb1', fb: '#ff6a74' };
const zoomT = (x, y, s) => `translate(${x} ${y}) scale(${s.toFixed(3)}) translate(${-x} ${-y})`;
const show = (node, o) => set(node, { opacity: o, display: o < 0.005 ? 'none' : '' });

// ---------------- shared bits ----------------
let hl = [];          // highlightable pathway elements: { node, keys, o }
let edges = [];       // particle flows: { path, len, dots, keys, color, speed, block, rate }
let badges = {};      // drug badges on the pathway / glomerulus

function reg(node, keys) { hl.push({ node, keys: [].concat(keys), o: 1 }); return node; }

function box(parent, cx, cy, w, label, keys, color = '#c9d6ea') {
  const g = el('g', {}, parent);
  el('rect', { x: cx - w / 2, y: cy - 25, width: w, height: 50, rx: 12, fill: '#141c2b', stroke: color, 'stroke-width': 2 }, g);
  el('text', { x: cx, y: cy + 7, 'text-anchor': 'middle', class: 'svg-label', style: 'font-size:20px', fill: color, text: label }, g);
  return reg(g, keys);
}

function edge(parent, d, keys, color, { n = 6, r = 6, speed = 0.35, arrow = true } = {}) {
  const path = el('path', { d, fill: 'none', stroke: '#5f6c86', 'stroke-width': 2.5, 'marker-end': arrow ? 'url(#rArrow)' : null }, parent);
  const len = path.getTotalLength();
  const dots = Array.from({ length: n }, () => el('circle', { r, fill: color }, parent));
  const e = { path, len, dots, keys: [].concat(keys), speed, block: 0, rate: 1, o: 1 };
  edges.push(e);
  return e;
}

function badge(parent, x, y, text, { w, color = '#ff6a74', sym = '⊣' } = {}) {
  const g = el('g', { opacity: 0, transform: `translate(${x} ${y})` }, parent);
  const width = Math.max(w || 0, 96, text.length * 9.4 + 58);
  el('rect', { x: -width / 2, y: -18, width, height: 36, rx: 18, fill: '#2a1220', stroke: color, 'stroke-width': 2 }, g);
  el('text', { x: -width / 2 + 16, y: 7, class: 'svg-label', style: 'font-size:19px', fill: color, text: sym }, g);
  el('text', { x: -width / 2 + 40, y: 7, class: 'svg-label', style: 'font-size:17px', fill: '#ffd6da', text }, g);
  return g;
}

// ---------------- scene: the pathway ----------------
let pathG, panel, panels, pileB, bradyNote, reninX, triggerBlock, compArrow, kidneyBody;
let cellFlows;

function buildPath(svg) {
  pathG = el('g', {}, svg);
  const defs = el('defs', {}, pathG);
  const m = el('marker', { id: 'rArrow', viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, defs);
  el('path', { d: 'M 0 0 L 10 5 L 0 10 z', fill: '#8592ab' }, m);

  // liver -> angiotensinogen -> Ang I -> Ang II -> AT1
  const liver = el('g', {}, pathG);
  el('path', { d: 'M -40 -10 C -30 -34 20 -34 40 -20 C 46 -6 30 12 0 22 C -26 28 -46 10 -40 -10 Z', fill: '#953a2c', stroke: '#e08a74', 'stroke-width': 2, transform: 'translate(62 120)' }, liver);
  el('text', { x: 62, y: 172, 'text-anchor': 'middle', class: 'svg-small', style: 'font-size:17px', text: 'liver' }, liver);
  reg(liver, 'liver');
  box(pathG, 235, 120, 190, 'Angiotensinogen', 'agt');
  box(pathG, 540, 120, 170, 'Angiotensin I', 'angi', COL.ang1);
  box(pathG, 830, 120, 170, 'Angiotensin II', 'angii', COL.ang2);
  box(pathG, 540, 235, 170, 'Bradykinin', 'brady', COL.brady);
  box(pathG, 830, 235, 190, 'inactive peptides', 'brady', '#8592ab');
  edge(pathG, 'M 96 120 L 138 120', 'liver', COL.agt, { n: 2, r: 5 });
  edge(pathG, 'M 332 120 L 453 120', ['agt', 'renin'], COL.ang1, { n: 4 });
  const eAce = edge(pathG, 'M 627 120 L 743 120', ['angi', 'ace'], COL.ang2, { n: 4 });
  const eAt1 = edge(pathG, 'M 917 120 L 962 120', ['angii', 'at1'], COL.ang2, { n: 2 });
  const eBrady = edge(pathG, 'M 627 235 L 733 235', ['brady', 'ace'], COL.brady, { n: 4 });
  reg(el('text', { x: 392, y: 100, 'text-anchor': 'middle', class: 'svg-label', style: 'font-size:19px', fill: COL.renin, text: 'renin' }, pathG), 'renin');
  const ace = el('g', {}, pathG);
  el('line', { x1: 685, y1: 122, x2: 685, y2: 153, stroke: '#8592ab', 'stroke-width': 2, 'stroke-dasharray': '4 4' }, ace);
  el('line', { x1: 685, y1: 203, x2: 685, y2: 233, stroke: '#8592ab', 'stroke-width': 2, 'stroke-dasharray': '4 4' }, ace);
  el('circle', { cx: 685, cy: 178, r: 26, fill: '#141c2b', stroke: '#ffd27a', 'stroke-width': 2 }, ace);
  el('text', { x: 685, y: 185, 'text-anchor': 'middle', class: 'svg-label', style: 'font-size:17px', fill: '#ffd27a', text: 'ACE' }, ace);
  reg(ace, 'ace');
  // AT1 receptor in a membrane
  const at1 = el('g', { transform: 'translate(990 120)' }, pathG);
  el('rect', { x: -28, y: 4, width: 56, height: 12, fill: '#3a4660' }, at1);
  el('path', { d: 'M -10 -18 L 0 -2 L 10 -18 M 0 -2 L 0 14', stroke: COL.ang2, 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round' }, at1);
  el('text', { x: 40, y: 8, class: 'svg-label', style: 'font-size:19px', fill: COL.ang2, text: 'AT1' }, at1);
  reg(at1, 'at1');
  // AT1 effects
  const eff = el('g', {}, pathG);
  el('path', { d: 'M 990 140 L 990 352', stroke: '#5f6c86', 'stroke-width': 2.5 }, eff);
  ['vasoconstriction', 'proximal Na⁺ retention', 'thirst · ADH', 'aldosterone release'].forEach((t, i) => {
    el('path', { d: `M 990 ${205 + i * 50} L 1002 ${205 + i * 50}`, stroke: '#5f6c86', 'stroke-width': 2.5 }, eff);
    el('text', { x: 1007, y: 210 + i * 50, class: 'svg-small', style: 'font-size:15px', fill: '#e8eef7', text: t }, eff);
  });
  reg(eff, 'eff');
  edge(pathG, 'M 990 140 L 990 352', 'eff', COL.ang2, { n: 3, r: 5, arrow: false });

  // adrenal + potassium
  const adr = el('g', { transform: 'translate(1080 470)' }, pathG);
  el('path', { d: 'M -46 22 C -40 -24 -10 -40 0 -40 C 12 -40 40 -24 46 22 Z', fill: '#d9a35a', stroke: '#ffd9a0', 'stroke-width': 2 }, adr);
  el('text', { x: -56, y: 12, 'text-anchor': 'end', class: 'svg-small', style: 'font-size:17px', text: 'adrenal cortex' }, adr);
  reg(adr, 'adrenal');
  edge(pathG, 'M 1060 362 L 1074 426', ['eff', 'adrenal'], COL.ang2, { n: 2, r: 5 });
  reg(el('text', { x: 1150, y: 600, 'text-anchor': 'middle', class: 'svg-label', style: 'font-size:22px', fill: COL.k, text: '↑ K⁺' }, pathG), 'k');
  edge(pathG, 'M 1140 578 L 1104 500', 'k', COL.k, { n: 3, r: 5 });

  // collecting duct principal cell
  const cell = el('g', {}, pathG);
  el('text', { x: 800, y: 606, 'text-anchor': 'middle', class: 'svg-small', style: 'font-size:17px', text: 'collecting duct · principal cell' }, cell);
  el('rect', { x: 600, y: 620, width: 400, height: 240, rx: 14, fill: '#141c2b', stroke: '#3a4660', 'stroke-width': 2 }, cell);
  el('rect', { x: 600, y: 620, width: 56, height: 240, rx: 14, fill: '#1f2a3a' }, cell);
  el('rect', { x: 944, y: 620, width: 56, height: 240, rx: 14, fill: '#3a0a12' }, cell);
  el('text', { x: 628, y: 875, 'text-anchor': 'middle', class: 'svg-small', style: 'font-size:15px', text: 'urine' }, cell);
  el('text', { x: 972, y: 875, 'text-anchor': 'middle', class: 'svg-small', style: 'font-size:15px', text: 'blood' }, cell);
  el('rect', { x: 656, y: 620, width: 288, height: 240, fill: '#2a2234' }, cell);
  el('circle', { cx: 800, cy: 700, r: 24, fill: '#3a2a50', stroke: COL.aldo, 'stroke-width': 2.5 }, cell);
  el('text', { x: 800, y: 706, 'text-anchor': 'middle', class: 'svg-label', style: 'font-size:16px', fill: COL.aldo, text: 'MR' }, cell);
  el('rect', { x: 648, y: 672, width: 16, height: 36, rx: 4, fill: COL.na }, cell);
  el('text', { x: 690, y: 664, class: 'svg-small', style: 'font-size:14px', text: 'ENaC' }, cell);
  el('rect', { x: 648, y: 776, width: 16, height: 30, rx: 4, fill: COL.k }, cell);
  el('circle', { cx: 944, cy: 765, r: 18, fill: '#2a2234', stroke: '#e8eef7', 'stroke-width': 2 }, cell);
  el('text', { x: 900, y: 818, 'text-anchor': 'middle', class: 'svg-small', style: 'font-size:14px', text: 'Na⁺/K⁺ pump' }, cell);
  reg(cell, 'cell');
  edge(pathG, 'M 1050 500 C 1000 560 880 600 816 676', ['adrenal', 'aldo'], COL.aldo, { n: 4 });
  cellFlows = [
    edge(pathG, 'M 612 690 L 680 690 C 760 690 880 760 930 765 L 990 765', 'cell', COL.na, { n: 5, r: 5, arrow: false, speed: 0.3 }),
    edge(pathG, 'M 990 790 L 940 778 C 860 800 740 792 664 791 L 610 791', 'cell', COL.k, { n: 4, r: 5, arrow: false, speed: 0.3 }),
    edge(pathG, 'M 760 840 L 612 840', 'cell', COL.h, { n: 3, r: 4, arrow: false, speed: 0.3 }),
  ];
  const leg = el('g', {}, pathG);
  [[COL.na, 'Na⁺ retained'], [COL.k, 'K⁺ excreted'], [COL.h, 'H⁺ excreted']].forEach(([c, t], i) => {
    el('circle', { cx: 620 + i * 140, cy: 888, r: 6, fill: c }, leg);
    el('text', { x: 632 + i * 140, y: 894, class: 'svg-small', style: 'font-size:15px', text: t }, leg);
  });
  reg(leg, 'cell');

  // kidney / JG apparatus and its triggers
  const kid = el('g', { transform: 'translate(195 455) scale(0.82)' }, pathG);
  kidneyBody = el('path', { d: 'M 20 -110 C 120 -110 140 90 40 115 C -20 128 -70 70 -26 22 C 2 -6 -6 -30 -34 -50 C -70 -80 -36 -110 20 -110 Z', fill: '#b4504c', stroke: '#e89088', 'stroke-width': 3 }, kid);
  el('circle', { cx: 46, cy: -40, r: 13, fill: COL.renin, stroke: '#e8eef7', 'stroke-width': 2 }, kid);

  reg(kid, 'kidney');
  reg(el('text', { x: 70, y: 450, 'text-anchor': 'middle', class: 'svg-label', style: 'font-size:19px', text: 'kidney' }, pathG), 'kidney');
  reg(el('text', { x: 70, y: 474, 'text-anchor': 'middle', class: 'svg-small', style: 'font-size:16px', text: 'JG cells' }, pathG), 'kidney');
  edge(pathG, 'M 236 418 C 270 300 360 230 392 132', 'renin', COL.renin, { n: 5, r: 6 });
  const trig = el('g', {}, pathG);
  ['↓ afferent arteriole pressure', '↓ NaCl at macula densa', 'β1 sympathetic stimulation'].forEach((t, i) => {
    const y = 650 + i * 46;
    el('text', { x: 18, y, class: 'svg-small', style: 'font-size:17px', fill: '#e8eef7', text: t }, trig);
    el('path', { d: `M ${[250, 210, 240][i]} ${y - 6} L 290 ${y - 6}`, stroke: '#5f6c86', 'stroke-width': 2 }, trig);
  });
  el('path', { d: 'M 290 644 L 290 736', stroke: '#5f6c86', 'stroke-width': 2 }, trig);
  reg(trig, 'trig');
  edge(pathG, 'M 290 644 C 290 610 270 590 250 570', 'trig', '#e8eef7', { n: 3, r: 4 });
  triggerBlock = el('path', { d: 'M 266 732 L 290 732', stroke: '#ff6a74', 'stroke-width': 5, opacity: 0 }, pathG);

  // negative feedback: pressure & volume suppress renin
  box(pathG, 470, 480, 230, '↑ BP · ↑ volume', 'fb', '#ff8a92');
  edge(pathG, 'M 995 300 C 880 330 700 440 590 474', ['eff', 'fb'], COL.fb, { n: 4, r: 5 });
  edge(pathG, 'M 610 690 C 540 650 480 600 470 508', ['cell', 'fb'], COL.fb, { n: 3, r: 5 });
  edge(pathG, 'M 354 480 L 290 470', 'fb', COL.fb, { n: 2, r: 5 });
  reg(el('text', { x: 360, y: 530, 'text-anchor': 'middle', class: 'svg-small', style: 'font-size:15px', text: 'suppresses renin' }, pathG), 'fb');

  // bradykinin pile-up (ACE inhibition)
  pileB = Array.from({ length: 14 }, (_, i) => el('circle', { cx: 470 + (i % 7) * 22, cy: 278 + Math.floor(i / 7) * 16, r: 6, fill: COL.brady, opacity: 0 }, pathG));
  bradyNote = el('text', { x: 830, y: 300, 'text-anchor': 'middle', class: 'svg-label', style: 'font-size:18px', fill: COL.brady, opacity: 0, text: '↑ bradykinin → cough, angioedema' }, pathG);
  reninX = el('g', { opacity: 0 }, pathG);
  el('path', { d: 'M 300 330 L 340 370 M 340 330 L 300 370', stroke: '#ff6a74', 'stroke-width': 6, 'stroke-linecap': 'round' }, reninX);
  el('text', { x: 350, y: 358, class: 'svg-label', style: 'font-size:18px', fill: '#ff8a92', text: 'renin suppressed' }, reninX);
  compArrow = el('g', { opacity: 0 }, pathG);
  el('path', { d: 'M 470 600 C 400 600 330 560 300 520', stroke: '#7cc4ff', 'stroke-width': 3, fill: 'none', 'stroke-dasharray': '6 5', 'marker-end': 'url(#rArrow)' }, compArrow);
  el('text', { x: 400, y: 640, 'text-anchor': 'middle', class: 'svg-small', style: 'font-size:15px', fill: '#9cc9ff', text: 'compensatory ↑ renin' }, compArrow);

  // drug badges
  badges.dri = badge(pathG, 392, 58, 'direct renin inhibitor');
  badges.acei = badge(pathG, 560, 178, 'ACE inhibitor', { w: 170 });
  badges.arb = badge(pathG, 990, 58, 'ARB');
  badges.mra = badge(pathG, 870, 660, 'MRA', { w: 96 });
  badges.bb = badge(pathG, 380, 742, 'β-blocker', { w: 140 });
  badges.diu = badge(pathG, 520, 590, 'diuretic: Na⁺ out', { w: 200, color: '#7cc4ff', sym: '↓' });
  badges.sglt2 = badge(pathG, 132, 330, 'SGLT2i: not RAAS', { color: '#3fbf7f', sym: '+' });
  Object.assign(edges.find(e => e.path.getAttribute('d').startsWith('M 332')), { tag: 'renin' });
  eAce.tag = 'ace'; eAt1.tag = 'at1'; eBrady.tag = 'brady';
  edges.find(e => e.path.getAttribute('d').startsWith('M 1050 500')).tag = 'mr';
  edges.find(e => e.path.getAttribute('d').startsWith('M 236 418')).tag = 'reninRel';
  edges.find(e => e.path.getAttribute('d').startsWith('M 290 644')).tag = 'trig';

  // centre panel used by a few steps
  panel = el('g', { opacity: 0 }, pathG);
  el('rect', { x: 330, y: 300, width: 600, height: 280, rx: 18, fill: '#101724', stroke: '#3a4660', 'stroke-width': 2 }, panel);
  panels = {};
  // effective arterial filling
  panels.effective = el('g', {}, panel);
  [['Total body sodium & water', 0.85, '#7cc4ff', 'high — congested'], ['Effective arterial filling (what the kidney senses)', 0.28, '#ff8a92', 'low']].forEach(([t, v, c, s], i) => {
    const y = 350 + i * 100;
    el('text', { x: 360, y, class: 'svg-small', style: 'font-size:18px', fill: '#e8eef7', text: t }, panels.effective);
    el('rect', { x: 360, y: y + 14, width: 520, height: 22, rx: 11, fill: '#24304a' }, panels.effective);
    el('rect', { x: 360, y: y + 14, width: 520 * v, height: 22, rx: 11, fill: c }, panels.effective);
    el('text', { x: 880, y, 'text-anchor': 'end', class: 'svg-label', style: 'font-size:17px', fill: c, text: s }, panels.effective);
  });
  el('text', { x: 630, y: 555, 'text-anchor': 'middle', class: 'svg-label', style: 'font-size:22px', fill: '#ffb84d', text: 'heart failure: RAAS stays switched on' }, panels.effective);
  // primary aldosteronism labs
  panels.pa = el('g', {}, panel);
  [['Aldosterone', 'inappropriately ↑', '#c99bff'], ['Renin', 'suppressed ↓', '#7cc4ff'], ['K⁺', 'often normal', '#e8eef7']].forEach(([a, b, c], i) => {
    el('text', { x: 370, y: 350 + i * 48, class: 'svg-label', style: 'font-size:21px', fill: c, text: a }, panels.pa);
    el('text', { x: 560, y: 350 + i * 48, class: 'svg-label', style: 'font-size:21px', fill: c, text: b }, panels.pa);
  });
  el('text', { x: 370, y: 498, class: 'svg-small', style: 'font-size:16px', text: 'Interpret aldosterone + renin + ratio with K⁺, medications,' }, panels.pa);
  el('text', { x: 370, y: 520, class: 'svg-small', style: 'font-size:16px', text: 'assay units and collection. β-blockers ↓ renin; ACEi/ARB/' }, panels.pa);
  el('text', { x: 370, y: 542, class: 'svg-small', style: 'font-size:16px', text: 'diuretics shift results; low K⁺ falsely lowers aldosterone.' }, panels.pa);
  // dual blockade
  panels.dual = el('g', {}, panel);
  el('text', { x: 630, y: 345, 'text-anchor': 'middle', class: 'svg-label', style: 'font-size:22px', text: 'ACEi + ARB  (or either + direct renin inhibitor)' }, panels.dual);
  [['albuminuria', 0.3, '#3fbf7f', '↓ better-looking surrogate'], ['AKI & hyperkalemia', 0.85, '#ff6a74', '↑ worse outcomes']].forEach(([t, v, c, s], i) => {
    const y = 400 + i * 80;
    el('text', { x: 360, y, class: 'svg-small', style: 'font-size:18px', fill: '#e8eef7', text: t }, panels.dual);
    el('rect', { x: 360, y: y + 12, width: 380, height: 22, rx: 11, fill: '#24304a' }, panels.dual);
    el('rect', { x: 360, y: y + 12, width: 380 * v, height: 22, rx: 11, fill: c }, panels.dual);
    el('text', { x: 900, y: y + 30, 'text-anchor': 'end', class: 'svg-small', style: 'font-size:16px', fill: c, text: s }, panels.dual);
  });
}

// ---------------- scene: glomerulus ----------------
let glomG, aff, effA, tuft, tuftIn, rbcG, filtDots, albDots, meters, glomBadges, nephG, nephs, glomNote;
const GX = 600, GY = 470;

function flowerPath(r0, a, k, n = 120) {
  let d = '';
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2;
    const r = r0 + a * Math.sin(k * t);
    d += `${i ? 'L' : 'M'} ${(GX + r * Math.cos(t)).toFixed(1)} ${(GY + r * Math.sin(t)).toFixed(1)} `;
  }
  return d + 'Z';
}

function buildGlom(svg) {
  glomG = el('g', {}, svg);
  const r = rng(61);
  el('circle', { cx: GX, cy: GY, r: 196, fill: '#1a2130', stroke: '#c9d6ea', 'stroke-width': 3 }, glomG);
  el('rect', { x: 575, y: 660, width: 50, height: 230, fill: '#1a2130', stroke: '#c9d6ea', 'stroke-width': 3 }, glomG);
  el('rect', { x: 577, y: 650, width: 46, height: 30, fill: '#1a2130' }, glomG);
  el('text', { x: 640, y: 860, class: 'svg-small', style: 'font-size:17px', text: 'filtrate → tubule' }, glomG);
  el('text', { x: GX + 150, y: GY + 196, class: 'svg-small', style: 'font-size:16px', text: "Bowman's capsule" }, glomG);
  aff = { wall: el('rect', { fill: '#c8606a' }, glomG), lum: el('rect', { fill: '#3a0a12' }, glomG), rings: [] };
  effA = { wall: el('rect', { fill: '#c8606a' }, glomG), lum: el('rect', { fill: '#3a0a12' }, glomG), rings: [] };
  for (let k = 0; k < 4; k++) {
    aff.rings.push(el('ellipse', { fill: 'none', stroke: '#f07a84', opacity: 0.9 }, glomG));
    effA.rings.push(el('ellipse', { fill: 'none', stroke: '#f07a84', opacity: 0.9 }, glomG));
  }
  el('text', { x: 230, y: GY + 80, 'text-anchor': 'middle', class: 'svg-small', style: 'font-size:17px', text: 'afferent arteriole →' }, glomG);
  el('text', { x: 980, y: GY + 80, 'text-anchor': 'middle', class: 'svg-small', style: 'font-size:17px', text: '→ efferent arteriole' }, glomG);
  tuft = el('path', { d: flowerPath(120, 32, 7), fill: 'none', 'stroke-width': 16, 'stroke-linejoin': 'round' }, glomG);
  tuftIn = el('path', { d: flowerPath(62, 18, 5), fill: 'none', 'stroke-width': 12, 'stroke-linejoin': 'round' }, glomG);
  tuft.len = tuft.getTotalLength();
  rbcG = Array.from({ length: 22 }, (_, i) => ({ u: i / 22, node: el('circle', { r: 6.5, fill: C.rbc, stroke: C.rbcRim, 'stroke-width': 1 }, glomG) }));
  filtDots = Array.from({ length: 40 }, () => ({ ph: r(), a: r() * Math.PI * 2, x: 585 + r() * 30, node: el('circle', { r: 4.5, fill: '#7fc8ff' }, glomG) }));
  albDots = Array.from({ length: 12 }, () => ({ ph: r(), a: r() * Math.PI * 2, x: 585 + r() * 30, node: el('circle', { r: 7, fill: '#b98cff', stroke: '#6b45b0' }, glomG) }));

  // meters
  meters = [['Glomerular capillary pressure', '#ffb84d'], ['GFR (filtration)', '#7cc4ff'], ['Albuminuria', '#b98cff']].map(([t, c], i) => {
    const x = 70 + i * 375;
    el('text', { x, y: 52, class: 'svg-small', style: 'font-size:17px', fill: '#e8eef7', text: t }, glomG);
    el('rect', { x, y: 64, width: 300, height: 18, rx: 9, fill: '#24304a' }, glomG);
    const bar = el('rect', { x, y: 64, width: 0, height: 18, rx: 9, fill: c }, glomG);
    const note = el('text', { x, y: 108, class: 'svg-small', style: 'font-size:16px', text: '' }, glomG);
    return { bar, note };
  });
  glomNote = el('text', { x: GX, y: 186, 'text-anchor': 'middle', class: 'svg-label', style: 'font-size:22px', text: '' }, glomG);
  glomBadges = {
    ang2: badge(glomG, 960, GY - 70, 'Ang II: efferent constriction', { w: 290, color: '#ffb84d', sym: '↑' }),
    block: badge(glomG, 960, GY + 130, 'ACEi / ARB: efferent relaxes', { w: 290 }),
    perf: badge(glomG, 230, GY - 70, 'renal perfusion', { w: 210, color: '#7cc4ff', sym: '↓' }),
    nsaid: badge(glomG, 230, GY + 130, 'NSAID: afferent constricts', { w: 270 }),
  };
  // nephron count (CKD)
  nephG = el('g', { opacity: 0 }, glomG);
  el('text', { x: 60, y: 735, class: 'svg-small', style: 'font-size:17px', fill: '#e8eef7', text: 'nephrons still working' }, nephG);
  nephs = Array.from({ length: 24 }, (_, k) => ({ thr: ((k * 7) % 24) / 24, node: el('circle', { cx: 74 + (k % 8) * 34, cy: 765 + Math.floor(k / 8) * 34, r: 13, fill: '#c8606a' }, nephG) }));
}

// pressure-flow toy model: inflow pressure split by afferent (Ra) and efferent (Re) resistance
function glomState(S) {
  const k = (id, a, b) => ease(seg(S(id), a, b));
  let Pin = 1, Ra = 1, Re = 1, neph = 1, dmg = 0, note = '';
  // glom: perfusion falls, Ang II constricts efferent to defend filtration pressure
  Pin = lerp(Pin, 0.7, k('glom', 0.12, 0.42));
  Re = lerp(Re, 1.8, k('glom', 0.5, 0.85));
  // block: a kidney with Ang II tone; blockade relaxes the efferent
  Pin = lerp(Pin, 1.05, k('block', 0, 0.2)); Re = lerp(Re, 1.35, k('block', 0, 0.2));
  Re = lerp(Re, 0.95, k('block', 0.35, 0.8));
  // ras: filtration dependent on efferent support, then it is removed
  Pin = lerp(Pin, 0.55, k('ras', 0, 0.25)); Re = lerp(Re, 1.9, k('ras', 0, 0.25));
  Re = lerp(Re, 0.95, k('ras', 0.45, 0.85));
  // ckd: fewer nephrons, each hyperfiltering
  Pin = lerp(Pin, 1.05, k('ckd', 0, 0.25)); Re = lerp(Re, 1.45, k('ckd', 0, 0.3));
  neph = lerp(neph, 0.45, k('ckd', 0.2, 0.75)); dmg = lerp(dmg, 1, k('ckd', 0.2, 0.75));
  // acekid: blockade lowers intraglomerular pressure
  Re = lerp(Re, 0.85, k('acekid', 0.15, 0.7));
  // whammy: diuretic lowers inflow, NSAID constricts afferent, efferent already relaxed
  Pin = lerp(Pin, 0.72, k('whammy', 0.1, 0.35));
  Ra = lerp(Ra, 1.7, k('whammy', 0.45, 0.75));
  const Pgc = (Pin * Re) / (Ra + Re);
  const flow = (2 * Pin) / (Ra + Re);
  const sngfr = clamp((Pgc - 0.2) / 0.4, 0, 1.4);
  const gfr = sngfr * neph;
  const leak = clamp(((Pgc - 0.4) / 0.25) * (0.35 + dmg));
  if (S('glom') > 0.55 && S('block') === 0) note = 'efferent tone supports filtration';
  if (S('block') > 0.45 && S('ras') === 0) note = 'modest, expected fall in filtration';
  if (S('ras') > 0 && S('ckd') === 0) note = S('ras') > 0.55 ? 'filtration falls sharply' : 'filtration depends on Ang II';
  if (S('ckd') > 0.3 && S('acekid') === 0) note = 'fewer nephrons, each under high pressure';
  if (S('acekid') > 0.4 && S('whammy') === 0) note = 'lower pressure → less albumin leak';
  if (S('whammy') > 0.55) note = 'acute kidney injury risk';
  return { Pin, Ra, Re, neph, dmg, Pgc, flow, gfr, leak, note };
}

function drawArteriole(a, x0, x1, R) {
  const h = 34 / R, wall = 10 + 8 * (R - 1);
  set(a.wall, { x: x0, y: GY - h - wall, width: x1 - x0, height: 2 * (h + wall) });
  set(a.lum, { x: x0, y: GY - h, width: x1 - x0, height: 2 * h });
  a.rings.forEach((ring, k) => set(ring, { cx: x0 + 50 + k * ((x1 - x0 - 100) / 3), cy: GY, rx: 5 + 4 * (R - 1), ry: h + wall + 2, 'stroke-width': 3 + 5 * Math.max(0, R - 0.9) }));
}

function renderGlom(S, time, dt, o) {
  show(glomG, o);
  if (o < 0.005) return;
  const g = glomState(S);
  drawArteriole(aff, 40, 410, g.Ra);
  drawArteriole(effA, 790, 1160, g.Re);
  const heat = clamp((g.Pgc - 0.25) / 0.45);
  set(tuft, { stroke: mix('#7a3040', '#ff6a5a', heat) });
  set(tuftIn, { stroke: mix('#6a2a38', '#ff8a6a', heat) });
  // red cells: afferent -> around the tuft -> efferent
  rbcG.forEach(c => {
    c.u = (c.u + dt * 0.12 * g.flow) % 1;
    let x, y;
    if (c.u < 0.3) { x = lerp(40, 410, c.u / 0.3); y = GY + Math.sin(c.u * 40) * 6; }
    else if (c.u < 0.7) { const p = tuft.getPointAtLength((0.5 + (c.u - 0.3) / 0.4 * 0.5) * tuft.len); x = p.x; y = p.y; }
    else { x = lerp(790, 1160, (c.u - 0.7) / 0.3); y = GY + Math.sin(c.u * 40) * 6; }
    set(c.node, { cx: x, cy: y });
  });
  // filtrate leaves the tuft into the capsule and down the tubule
  const pf = (d, u) => {
    const r0 = 140, r1 = 180;
    if (u < 0.35) { const rr = lerp(r0, r1, u / 0.35); return [GX + rr * Math.cos(d.a), GY + rr * Math.sin(d.a)]; }
    const v = (u - 0.35) / 0.65;
    // slide round the capsule to the urinary pole, then down the tubule
    let a = d.a, target = Math.PI / 2;
    let diff = ((target - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    if (v < 0.55) { const q = v / 0.55; const aa = a + diff * q; return [GX + r1 * Math.cos(aa), GY + r1 * Math.sin(aa)]; }
    const q = (v - 0.55) / 0.45;
    return [lerp(GX, d.x, q), lerp(GY + r1, 900, q)];
  };
  const nF = Math.round(clamp(g.gfr / 1.2) * filtDots.length);
  filtDots.forEach((d, i) => {
    const u = (time * 0.25 + d.ph) % 1;
    const [x, y] = pf(d, u);
    set(d.node, { cx: x, cy: y, opacity: i < nF ? 0.9 : 0 });
  });
  const nA = Math.round(g.leak * albDots.length);
  albDots.forEach((d, i) => {
    const u = (time * 0.2 + d.ph) % 1;
    const [x, y] = pf(d, u);
    set(d.node, { cx: x, cy: y, opacity: i < nA ? 0.95 : 0 });
  });
  const vals = [clamp(g.Pgc / 0.75), clamp(g.gfr / 1.3), g.leak];
  const words = [g.Pgc > 0.56 ? 'high' : g.Pgc < 0.33 ? 'low' : 'normal', g.gfr > 0.85 ? 'preserved' : g.gfr > 0.45 ? 'reduced' : 'low', g.leak > 0.6 ? 'high' : g.leak > 0.2 ? 'moderate' : 'low'];
  meters.forEach((m, i) => { set(m.bar, { width: 300 * vals[i] }); set(m.note, { text: words[i] }); });
  set(glomNote, { text: g.note });
  set(glomBadges.ang2, { opacity: clamp((g.Re - 1.15) * 3) * (S('ckd') > 0 && S('acekid') === 0 ? 1 : S('ckd') > 0 ? 0 : 1) });
  set(glomBadges.block, { opacity: Math.max(seg(S('block'), 0.3, 0.45), S('ras') > 0 ? seg(S('ras'), 0.4, 0.55) : 0, seg(S('acekid'), 0.1, 0.25), S('whammy') > 0 ? 1 : 0) * (S('ckd') > 0 && S('acekid') === 0 ? 0 : 1) * (S('ras') > 0 && S('ras') < 0.4 ? 0 : 1) });
  set(glomBadges.perf, { opacity: Math.max(S('glom') > 0.1 && S('block') === 0 ? 1 : 0, S('ras') > 0.05 && S('ckd') === 0 ? 1 : 0, seg(S('whammy'), 0.1, 0.25)) });
  set(glomBadges.nsaid, { opacity: seg(S('whammy'), 0.4, 0.55) });
  set(nephG, { opacity: S('ckd') > 0 && S('whammy') === 0 ? seg(S('ckd'), 0.1, 0.3) : 0 });
  nephs.forEach(n => set(n.node, { fill: n.thr < g.neph ? mix('#c8606a', '#ff6a5a', heat) : '#4b4652' }));
}

// ---------------- scene: creatinine after starting ACEi/ARB ----------------
let chartG, curveA, curveB, checkBox;
const CX0 = 160, CX1 = 1060, CY0 = 720, CY1 = 260;
const cx = w => CX0 + (w / 8) * (CX1 - CX0), cy = p => CY0 - (p / 60) * (CY0 - CY1);
function buildChart(svg) {
  chartG = el('g', {}, svg);
  el('rect', { x: cx(2), y: CY1, width: cx(4) - cx(2), height: CY0 - CY1, fill: '#7cc4ff', opacity: 0.1 }, chartG);
  el('text', { x: cx(3), y: CY1 - 14, 'text-anchor': 'middle', class: 'svg-small', style: 'font-size:17px', fill: '#9cc9ff', text: 'check BP · creatinine · K⁺ (2–4 wk)' }, chartG);
  [0, 15, 30, 45, 60].forEach(p => {
    el('line', { x1: CX0, x2: CX1, y1: cy(p), y2: cy(p), stroke: p === 30 ? '#ff6a74' : '#2a3446', 'stroke-width': p === 30 ? 2.5 : 1.5, 'stroke-dasharray': p === 30 ? '8 6' : null }, chartG);
    el('text', { x: CX0 - 12, y: cy(p) + 6, 'text-anchor': 'end', class: 'svg-small', style: 'font-size:16px', text: `+${p}%` }, chartG);
  });
  el('text', { x: CX1, y: cy(30) - 10, 'text-anchor': 'end', class: 'svg-small', style: 'font-size:16px', fill: '#ff8a92', text: '>30% within 4 weeks → assess' }, chartG);
  for (let w = 0; w <= 8; w += 2) el('text', { x: cx(w), y: CY0 + 30, 'text-anchor': 'middle', class: 'svg-small', style: 'font-size:16px', text: `${w} wk` }, chartG);
  el('text', { x: (CX0 + CX1) / 2, y: CY0 + 62, 'text-anchor': 'middle', class: 'svg-small', style: 'font-size:17px', text: 'weeks after starting or increasing an ACEi / ARB' }, chartG);
  el('text', { x: CX0 - 60, y: CY1 - 40, class: 'svg-label', style: 'font-size:20px', text: 'creatinine change' }, chartG);
  curveA = el('polyline', { fill: 'none', stroke: '#3fbf7f', 'stroke-width': 4 }, chartG);
  curveB = el('polyline', { fill: 'none', stroke: '#ff6a74', 'stroke-width': 4 }, chartG);
  curveA.lab = el('text', { class: 'svg-small', style: 'font-size:17px', fill: '#3fbf7f', text: 'expected hemodynamic rise → continue' }, chartG);
  curveB.lab = el('text', { class: 'svg-small', style: 'font-size:17px', fill: '#ff8a92', text: 'rise beyond 30%' }, chartG);
  checkBox = el('g', { opacity: 0 }, chartG);
  el('rect', { x: 640, y: 618, width: 420, height: 92, rx: 14, fill: '#101724', stroke: '#ff6a74', 'stroke-width': 2 }, checkBox);
  ['Assess — don’t just stop:', 'volume depletion · other drugs (NSAIDs, diuretics)', 'acute kidney injury · renal artery stenosis'].forEach((t, i) =>
    el('text', { x: 658, y: 643 + i * 26, class: i ? 'svg-small' : 'svg-label', style: `font-size:${i ? 16 : 18}px`, fill: '#e8eef7', text: t }, checkBox));
}
function renderChart(S, time, dt, o) {
  show(chartG, o);
  if (o < 0.005) return;
  const s = S('monitor');
  const draw = (node, f, upto, labW) => {
    const pts = [];
    for (let w = 0; w <= 8 * upto; w += 0.1) pts.push(`${cx(w).toFixed(1)},${cy(f(w)).toFixed(1)}`);
    set(node, { points: pts.join(' ') });
    set(node.lab, { x: cx(labW) + 10, y: cy(f(labW)) - 12, opacity: upto > labW / 8 ? 1 : 0 });
  };
  draw(curveA, w => 15 * (1 - Math.exp(-w / 1.2)), ease(seg(s, 0.05, 0.4)), 4.6);
  draw(curveB, w => 46 * (1 - Math.exp(-w / 1.5)), ease(seg(s, 0.4, 0.75)), 5.6);
  set(checkBox, { opacity: seg(s, 0.65, 0.8) });
}

// ---------------- scene: first-line cards ----------------
let cardsG, cardHi;
function buildCards(svg) {
  cardsG = el('g', {}, svg);
  el('text', { x: 600, y: 250, 'text-anchor': 'middle', class: 'svg-label', style: 'font-size:24px', text: 'First-line options for ordinary hypertension' }, cardsG);
  [['ACEi or ARB', 'lisinopril · losartan'], ['Thiazide-type diuretic', 'chlorthalidone · HCTZ'], ['Long-acting DHP CCB', 'amlodipine']].forEach(([t, s], i) => {
    const x = 120 + i * 330;
    el('rect', { x, y: 300, width: 300, height: 180, rx: 18, fill: '#141c2b', stroke: '#3a4660', 'stroke-width': 2 }, cardsG);
    el('text', { x: x + 150, y: 385, 'text-anchor': 'middle', class: 'svg-label', style: 'font-size:22px', text: t }, cardsG);
    el('text', { x: x + 150, y: 420, 'text-anchor': 'middle', class: 'svg-small', style: 'font-size:17px', text: s }, cardsG);
  });
  cardHi = el('g', { opacity: 0 }, cardsG);
  el('rect', { x: 116, y: 296, width: 308, height: 188, rx: 20, fill: 'none', stroke: '#3fbf7f', 'stroke-width': 4 }, cardHi);
  el('text', { x: 270, y: 530, 'text-anchor': 'middle', class: 'svg-label', style: 'font-size:20px', fill: '#3fbf7f', text: 'albuminuric CKD → favor this' }, cardHi);
}
function renderCards(S, time, dt, o) {
  show(cardsG, o);
  if (o < 0.005) return;
  set(cardHi, { opacity: seg(S('firstline'), 0.4, 0.6) });
}

// ---------------- pathway animation ----------------
function renderPath(S, time, dt, o, stepId) {
  show(pathG, o);
  if (o < 0.005) return;
  const act = ACTIVE[stepId] || 'all';
  const on = keys => act === 'all' || keys.some(k => act.includes(k));
  const ease1 = 1 - Math.pow(0.002, dt);
  hl.forEach(h => { h.o += ((on(h.keys) ? 1 : 0.16) - h.o) * ease1; set(h.node, { opacity: h.o }); });

  // drug effects by step
  const at = (id, a = 0.1, b = 0.3) => seg(S(id), a, b);
  const cur = id => stepId === id;
  const acei = cur('acei') ? at('acei') : cur('dual') || cur('closing') || cur('sources') ? 1 : 0;
  const arb = cur('arb') ? at('arb') : cur('dual') || cur('closing') || cur('sources') ? 1 : 0;
  const dri = cur('dual') ? at('dual') : 0;
  const mra = cur('mra') ? at('mra') : cur('closing') || cur('sources') ? 1 : 0;
  const bb = cur('indirect') ? at('indirect') : cur('closing') || cur('sources') ? 1 : 0;
  const diu = cur('indirect') ? at('indirect', 0.35, 0.5) : 0;
  const sglt = cur('indirect') ? at('indirect', 0.65, 0.8) : 0;
  const lowRenin = cur('pa') ? at('pa', 0.05, 0.3) : cur('htn') ? 0.6 * at('htn', 0.2, 0.5) : 0;
  set(badges.acei, { opacity: acei }); set(badges.arb, { opacity: arb }); set(badges.dri, { opacity: dri });
  set(badges.mra, { opacity: mra }); set(badges.bb, { opacity: bb }); set(badges.diu, { opacity: diu }); set(badges.sglt2, { opacity: sglt });
  set(triggerBlock, { opacity: bb });
  set(compArrow, { opacity: diu });
  set(reninX, { opacity: cur('pa') ? lowRenin : 0 });
  set(kidneyBody, { fill: '#b4504c' });

  edges.forEach(e => {
    e.o += ((on(e.keys) ? 1 : 0.12) - e.o) * ease1;
    set(e.path, { opacity: 0.35 + 0.65 * e.o });
    let block = 0, rate = 1, speed = e.speed;
    if (e.tag === 'ace') block = acei;
    if (e.tag === 'brady') block = acei;
    if (e.tag === 'at1') block = arb;
    if (e.tag === 'renin') block = dri;
    if (e.tag === 'mr') block = mra;
    if (e.tag === 'trig') block = bb * 0.6;
    if (e.tag === 'reninRel') rate = 1 - 0.8 * lowRenin + 0.6 * diu;
    if (e.tag === 'renin' || e.tag === 'ace' || e.tag === 'at1') rate = 1 - 0.7 * lowRenin;
    if (cellFlows.includes(e)) rate = 1 - 0.75 * mra;
    const n = e.dots.length;
    e.dots.forEach((d, i) => {
      const u = (time * speed + i / n) % 1;
      const stopU = 0.62;
      const uu = block > 0.5 ? Math.min(u, stopU) : u;
      const p = e.path.getPointAtLength(uu * e.len);
      let op = e.o * (i / n < rate ? 1 : 0);
      if (block > 0.5 && u > stopU) op *= Math.max(0, 1 - (u - stopU) * 8);
      set(d, { cx: p.x, cy: p.y, opacity: op });
    });
  });
  // bradykinin accumulates when ACE is inhibited
  const pile = cur('acei') ? at('acei', 0.3, 0.8) : 0;
  pileB.forEach((c, i) => set(c, { opacity: i < pile * pileB.length ? 0.95 : 0 }));
  set(bradyNote, { opacity: cur('acei') ? at('acei', 0.5, 0.7) : 0 });

  // centre panel
  const pk = ['effective', 'pa', 'dual'].find(cur);
  set(panel, { opacity: pk ? at(pk, 0.15, 0.35) : 0 });
  Object.entries(panels).forEach(([k, g]) => set(g, { opacity: k === pk ? 1 : 0 }));
}

function build(svg) {
  buildPath(svg);
  buildGlom(svg);
  buildChart(svg);
  buildCards(svg);
}

function render(S, time, dt) {
  let i = 0;
  steps.forEach((s, k) => { if (S(s.id) > 0) i = k; });
  const id = steps[i].id, l = S(id);
  const curScene = sceneOf(id), prev = i > 0 ? sceneOf(steps[i - 1].id) : curScene;
  const O = {};
  if (prev === curScene) O[curScene] = 1;
  else { O[prev] = 1 - seg(l, 0, 0.25); O[curScene] = seg(l, 0.1, 0.35); }
  renderPath(S, time, dt, O.path ?? 0, id);
  renderGlom(S, time, dt, O.glom ?? 0);
  renderChart(S, time, dt, O.chart ?? 0);
  renderCards(S, time, dt, O.cards ?? 0);
}

runModule({ title: 'RAAS', steps, build, render, dense: true });
