# Illustrations

Scroll-driven visual explanations for patient visits, used in place of drawing in MS Paint.
It's a static site with no build step: plain HTML, CSS and JavaScript modules, with SVG art.

**Live site:** https://noahschmuckler.github.io/Illustrations/

## Modules

| # | Module | File |
|---|--------|------|
| 1 | Cholesterol: cracks, HDL vs LDL repair, narrowing and hardening | `modules/cholesterol.js` |
| 2 | Blood sugar & A1c: capillaries, sugar-coated red cells, capillary loss, large-artery damage | `modules/a1c.js` |

## Presenting

- Scroll or swipe to move through a module.
- Keys: <kbd>↓</kbd> / <kbd>Space</kbd> / <kbd>→</kbd> go to the next step, and <kbd>↑</kbd> / <kbd>←</kbd> go back.
- <kbd>C</kbd> hides the captions so the picture fills the screen. <kbd>Esc</kbd> returns to the library.
- The dots on the right edge jump straight to a step.

## Layout

```
index.html            library menu (cards come from js/modules.js)
css/style.css         all styling
js/core.js            helpers: svg creation, easing, color mixing, seeded random
js/scrolly.js         the scroll engine: captions, progress, keyboard and rail navigation
js/art.js             shared art: artery tube, cracks, HDL/LDL, red cells, cross-section
modules/<name>.html   tiny shell page that loads modules/<name>.js
modules/<name>.js     one module: its `steps` (caption text) plus build() and render()
```

### How a module works

Each module lists `steps`, and each step has an `id`, caption `html`, and an optional `weight`
that controls how much scrolling it takes. `render(S, time, dt)` runs every frame. `S('stepId')` returns
0→1 progress through that step, so each part of the animation is timed against its caption.
For example, `crack.grow(seg(S('cracks'), 0.1, 0.45))` opens the crack during the first part of the "cracks" step.

### Adding a module

1. Copy `modules/cholesterol.html` to `modules/<new>.html` and point its script tag at `<new>.js`.
2. Write `modules/<new>.js` with `steps`, `build`, and `render`, then call `runModule(...)`.
3. Add an entry to `js/modules.js`. It then shows up on the home page.

## Running locally

ES modules don't load from `file://`, so serve the folder:

```
python3 -m http.server 8000
# open http://localhost:8000
```
