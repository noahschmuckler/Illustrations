// Scroll-driven slideshow engine.
//
// A module provides a list of steps (captions) plus build() and render().
// Scrolling moves a progress value through the steps; render() is called every
// animation frame with S(id) -> 0..1 progress within that step, so each
// illustration can be timed against the caption it belongs to.
//
// Controls: scroll / swipe, ↓ → Space PageDown = next step, ↑ ← PageUp = previous,
// Home/End, C = toggle captions, Esc = back to the library.
//
// Optional narration: pass `narration: ['part1.m4a', ...]` and give steps
// `audio: [partIndex, startSeconds]`. While narration plays, the slideshow follows
// the audio; scrolling or jumping to another step moves the audio there.

import { el, clamp, seg } from './core.js';
import { installDefs } from './art.js';

export function runModule({ title, steps, build, render, viewBox = '0 0 1200 900', stepHeight = 1.15, dense = false, narration = null }) {
  document.title = `${title} · Illustrations`;
  document.body.classList.add('module');
  // provider modules carry more text per step
  if (dense) document.body.classList.add('dense');

  // ---- DOM ----
  const top = document.createElement('header');
  top.className = 'topbar';
  top.innerHTML = `<a class="back" href="../index.html" aria-label="Back to library">← Library</a>
    <span class="mod-title">${title}</span>
    ${narration ? '<button class="narrate" type="button" title="Play / pause narration (N)">▶ Listen</button>' : ''}
    <button class="cap-toggle" type="button" title="Show / hide captions (C)">Captions</button>`;
  document.body.appendChild(top);

  const stage = document.createElement('main');
  stage.className = 'stage';
  const captions = document.createElement('section');
  captions.className = 'captions';
  const artWrap = document.createElement('div');
  artWrap.className = 'art';
  stage.append(captions, artWrap);
  document.body.appendChild(stage);

  const svg = el('svg', { viewBox, preserveAspectRatio: 'xMidYMid meet', role: 'img', 'aria-label': title });
  artWrap.appendChild(svg);
  installDefs(svg);

  const total = steps.reduce((s, st) => s + (st.weight || 1), 0);
  let acc = 0;
  const ranges = {};
  const capEls = steps.map((st, i) => {
    const w = st.weight || 1;
    const a = acc / total, b = (acc + w) / total;
    acc += w;
    ranges[st.id] = [a, b, i];
    const c = document.createElement('article');
    c.className = 'caption';
    c.innerHTML = st.html;
    captions.appendChild(c);
    return c;
  });

  const rail = document.createElement('nav');
  rail.className = 'rail';
  const dots = steps.map((st, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.title = (st.html.match(/<h2>(.*?)<\/h2>/) || [, st.id])[1].replace(/<[^>]+>/g, '');
    b.addEventListener('click', () => goTo(i));
    rail.appendChild(b);
    return b;
  });
  document.body.appendChild(rail);

  const hint = document.createElement('div');
  hint.className = 'hint';
  hint.textContent = 'Scroll, swipe, or press ↓ / space';
  document.body.appendChild(hint);

  const spacer = document.createElement('div');
  spacer.className = 'spacer';
  document.body.appendChild(spacer);
  const sizeSpacer = () => { spacer.style.height = `${(total * stepHeight + 1) * 100}vh`; };
  sizeSpacer();

  // ---- progress ----
  const maxScroll = () => Math.max(1, document.documentElement.scrollHeight - innerHeight);
  const targetP = () => clamp(scrollY / maxScroll());
  let sp = targetP();

  const S = id => {
    const r = ranges[id];
    if (!r) throw new Error('Unknown step ' + id);
    return seg(sp, r[0], r[1]);
  };
  // Scroll position where a step is "fully shown" (animation done, caption visible).
  const stopFor = i => {
    const r = ranges[steps[i].id];
    return i === 0 ? 0 : r[0] + (r[1] - r[0]) * (i === steps.length - 1 ? 1 : 0.82);
  };
  function goTo(i) {
    i = clamp(i, 0, steps.length - 1);
    window.scrollTo({ top: stopFor(i) * maxScroll(), behavior: 'instant' });
  }
  const stops = () => steps.map((_, i) => stopFor(i));

  addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const p = targetP();
    const s = stops();
    if (['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(e.key)) {
      e.preventDefault();
      // while narrating, the reader sits mid-step, so step by whole steps
      if (narrator?.playing) return goTo(stepAt(p) + 1);
      const i = s.findIndex(v => v > p + 0.002);
      goTo(i === -1 ? steps.length - 1 : i);
    } else if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) {
      e.preventDefault();
      if (narrator?.playing) return goTo(stepAt(p) - 1);
      let i = -1;
      s.forEach((v, k) => { if (v < p - 0.002) i = k; });
      goTo(Math.max(0, i));
    } else if (e.key === 'Home') { e.preventDefault(); goTo(0); }
    else if (e.key === 'End') { e.preventDefault(); goTo(steps.length - 1); }
    else if (e.key === 'c' || e.key === 'C') toggleCaptions();
    else if ((e.key === 'n' || e.key === 'N') && narrator) narrator.toggle();
    else if (e.key === 'Escape') location.href = '../index.html';
  });

  function toggleCaptions() { document.body.classList.toggle('no-captions'); }
  top.querySelector('.cap-toggle').addEventListener('click', toggleCaptions);
  addEventListener('resize', sizeSpacer);

  // ---- narration ----
  const stepAt = p => {
    let k = 0;
    steps.forEach((st, i) => { if (p >= ranges[st.id][0] - 1e-6) k = i; });
    return k;
  };
  const narrator = narration ? makeNarrator() : null;
  function makeNarrator() {
    const audio = new Audio();
    audio.preload = 'auto';
    const btn = top.querySelector('.narrate');
    const cues = steps.map((st, i) => (st.audio ? { i, part: st.audio[0], at: st.audio[1] } : null)).filter(Boolean);
    let part = -1, playing = false, setY = null, cue = null;
    const label = () => { btn.textContent = playing ? '❚❚ Pause' : '▶ Listen'; btn.classList.toggle('on', playing); };
    // play from the cue for step i (or the next narrated step after it)
    function startAt(i) {
      cue = cues.find(c => c.i >= i);
      if (!cue) return stop();
      const go = () => { audio.currentTime = cue.at; if (playing) audio.play().catch(stop); };
      if (part !== cue.part) {
        part = cue.part;
        audio.src = narration[part];
        audio.addEventListener('loadedmetadata', go, { once: true });
      } else go();
    }
    function stop() { playing = false; audio.pause(); setY = null; label(); }
    audio.addEventListener('ended', () => {
      const next = cues.find(c => c.part === part + 1);
      if (next) startAt(next.i); else stop();
    });
    btn.addEventListener('click', () => toggle());
    function toggle() {
      if (playing) return stop();
      playing = true;
      label();
      setY = null;
      startAt(stepAt(targetP()));
    }
    return {
      toggle,
      get playing() { return playing; },
      // each frame: follow the audio, or follow the reader if they moved
      tick() {
        if (!playing || !cue || audio.readyState < 1) return;
        if (setY !== null && Math.abs(scrollY - setY) > 8) { setY = null; startAt(stepAt(targetP())); return; }
        const t = audio.currentTime;
        const inPart = cues.filter(c => c.part === part);
        let k = 0;
        inPart.forEach((c, j) => { if (t >= c.at) k = j; });
        cue = inPart[k];
        const end = inPart[k + 1] ? inPart[k + 1].at : audio.duration || cue.at + 30;
        const frac = clamp((t - cue.at) / Math.max(1, end - cue.at));
        const r = ranges[steps[cue.i].id];
        const local = cue.i === 0 ? 0.7 * frac : 0.12 + 0.7 * frac;
        const y = Math.round((r[0] + (r[1] - r[0]) * local) * maxScroll());
        if (Math.abs(scrollY - y) >= 1) window.scrollTo({ top: y, behavior: 'instant' });
        setY = scrollY;
      },
    };
  }

  // ---- build + loop ----
  build(svg, { S });
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (narrator) narrator.tick();
    const tp = targetP();
    // Ease toward the scroll position so wheel "clicks" become smooth motion.
    sp += (tp - sp) * (1 - Math.pow(0.0015, dt));
    if (Math.abs(tp - sp) < 1e-5) sp = tp;

    capEls.forEach((c, i) => {
      const r = ranges[steps[i].id];
      const l = (sp - r[0]) / (r[1] - r[0]);
      let o;
      if (l < 0) o = 0;
      else if (l > 1) o = i === steps.length - 1 ? 1 : 0;
      else {
        const fin = i === 0 ? 1 : seg(l, 0.02, 0.14);
        const fout = i === steps.length - 1 ? 1 : 1 - seg(l, 0.9, 1);
        o = Math.min(fin, fout);
      }
      c.style.opacity = o.toFixed(3);
      c.style.transform = `translateY(${((1 - o) * (l < 0.5 ? 24 : -24)).toFixed(1)}px)`;
      c.style.visibility = o < 0.01 ? 'hidden' : 'visible';
      const active = sp >= r[0] && (sp < r[1] || i === steps.length - 1);
      dots[i].classList.toggle('on', active);
    });
    hint.style.opacity = (1 - clamp(sp * 40)).toFixed(3);

    render(S, now / 1000, dt, sp);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
