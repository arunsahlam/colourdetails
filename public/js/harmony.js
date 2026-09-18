// ============================================================
// harmony.js — Color harmonies + SVG wheel
// Depends on color.js
// ============================================================

function rotateHue(h, offsetDeg) {
  let hh = h + offsetDeg / 360;
  if (hh < 0) hh += 1;
  if (hh > 1) hh -= 1;
  return hh;
}
/*
function hex2complementary(hexStr) {
  const [h, s, l] = hex2hsl(hexStr);
  return hsl2hex([rotateHue(h, CONFIG.HARMONY_OFFSETS.complementary), s, l]);
} 
*/

function hex2splitcomplementary(hexStr) {
  const [h, s, l] = hex2hsl(hexStr);
  return CONFIG.HARMONY_OFFSETS.split.map((deg) => hsl2hex([rotateHue(h, deg), s, l]));
}

function hex2triadic(hexStr) {
  const [h, s, l] = hex2hsl(hexStr);
  return CONFIG.HARMONY_OFFSETS.triadic.map((deg) => hsl2hex([rotateHue(h, deg), s, l]));
}

function hex2tetradic(hexStr, clockwise = true) {
  const [h, s, l] = hex2hsl(hexStr);
  const offsets = clockwise
    ? CONFIG.HARMONY_OFFSETS.tetradicCW
    : CONFIG.HARMONY_OFFSETS.tetradicCCW;
  return offsets.map((deg) => hsl2hex([rotateHue(h, deg), s, l]));
}

function hex2tetradicsqr(hexStr) {
  const [h, s, l] = hex2hsl(hexStr);
  return CONFIG.HARMONY_OFFSETS.tetradicSquare.map((deg) =>
    hsl2hex([rotateHue(h, deg), s, l])
  );
}

function hex2analagous(hexStr) {
  const [h, s, l] = hex2hsl(hexStr);
  const [minus, plus] = CONFIG.HARMONY_OFFSETS.analogous;
  return [
    hsl2hex([rotateHue(h, minus), s, l]),
    hexStr,
    hsl2hex([rotateHue(h, plus), s, l]),
  ];
}

// ------------------------------------------------------------
// Explicit aliases (matching ColorHexa's named lists)
// ------------------------------------------------------------
function triadicColors(hexStr) {
  const [a, b] = hex2triadic(hexStr);
  // ColorHexa lists base + 2 companions. Order: +120°, +240°.
  return [hexStr, a, b];
}

function analogousColors(hexStr) {
  const [minus, base, plus] = hex2analagous(hexStr);
  return [minus, base, plus];
}

// ------------------------------------------------------------
// SVG wheel
// ------------------------------------------------------------

// hue 0 (red) at top, increasing clockwise.
function hueToPoint(hue, cx, cy, r) {
  const angle = hue * 2 * Math.PI - Math.PI / 2;
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

function arcPath(h1, h2, cx, cy, r) {
  const p1 = hueToPoint(h1, cx, cy, r);
  const p2 = hueToPoint(h2, cx, cy, r);
  let delta = h2 - h1;
  while (delta < 0) delta += 1;
  const largeArc = delta > 0.5 ? 1 : 0;
  const sweep = 1;
  return `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} ${sweep} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
}

/**
 * Render one color wheel into a container.
 *
 * @param {HTMLElement} el       - container
 * @param {string}      baseHex  - base color (6-digit)
 * @param {string[]}    hexes    - all colors to plot
 * @param {Array<[string,string]>} arcs - pairs of hexes to connect
 * @param {Object}      opts     - { size, showLabels }
 */
function drawWheel(el, baseHex, hexes, arcs, opts = {}) {
  if (!el) return;
  const size = opts.size || 200;
  const cx = size / 2;
  const cy = size / 2;
  const ringOuter = size * 0.42;
  const ringInner = size * 0.30;
  const dotR = size * 0.045;
  const baseRingR = (ringOuter + ringInner) / 2;
  const showLabels = opts.showLabels !== false;

  const segments = CONFIG.WHEEL_SEGMENTS;
  const segs = [];
  for (let i = 0; i < segments; i++) {
    const h1 = i / segments;
    const h2 = (i + 1) / segments;
    const p1 = hueToPoint(h1, cx, cy, ringOuter);
    const p2 = hueToPoint(h2, cx, cy, ringOuter);
    const p1i = hueToPoint(h1, cx, cy, ringInner);
    const p2i = hueToPoint(h2, cx, cy, ringInner);
    const d =
      `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} ` +
      `A ${ringOuter} ${ringOuter} 0 0 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} ` +
      `L ${p2i.x.toFixed(2)} ${p2i.y.toFixed(2)} ` +
      `A ${ringInner} ${ringInner} 0 0 0 ${p1i.x.toFixed(2)} ${p1i.y.toFixed(2)} Z`;
    segs.push(`<path d="${d}" fill="hsl(${(h1 * 360).toFixed(1)}, 100%, 50%)" />`);
  }

  const arcEls = [];
  for (const [a, b] of arcs || []) {
    const [ha] = hex2hsl(a);
    const [hb] = hex2hsl(b);
    arcEls.push(`<path class="wheel-arc" d="${arcPath(ha, hb, cx, cy, baseRingR)}" />`);
  }

  const dotEls = [];
  const labelEls = [];
  const seen = new Set();
  for (const hx of hexes) {
    const [h, s] = hex2hsl(hx);
    const key = h.toFixed(4);
    if (seen.has(key)) continue;
    seen.add(key);

    const inner = ringInner * 0.85;
    const outer = ringOuter * 0.95;
    const satR = inner + (outer - inner) * Math.sqrt(Math.max(0, Math.min(1, s)));

    const p = hueToPoint(h, cx, cy, satR);
    const isBase = hx.toLowerCase() === baseHex.toLowerCase();
    const r = isBase ? dotR * 1.35 : dotR;

    dotEls.push(
      `<circle class="wheel-dot${isBase ? " base" : ""}" ` +
        `cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" ` +
        `r="${r.toFixed(2)}" fill="#${hx}" ` +
        `data-hex="${hx}" tabindex="0" role="link" ` +
        `aria-label="Preview color #${HEX(hx)}" />`
    );

    if (showLabels && isBase) {
      const lp = hueToPoint(h, cx, cy, ringOuter + 12);
      labelEls.push(
        `<text class="wheel-label" x="${lp.x.toFixed(2)}" y="${lp.y.toFixed(2)}" ` +
          `text-anchor="middle" dominant-baseline="middle">#${HEX(baseHex)}</text>`
      );
    }
  }

  el.innerHTML =
    `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" aria-label="Color wheel">` +
    segs.join("") +
    `<circle class="wheel-ring" cx="${cx}" cy="${cy}" r="${ringOuter}" />` +
    `<circle class="wheel-ring" cx="${cx}" cy="${cy}" r="${ringInner}" />` +
    arcEls.join("") +
    dotEls.join("") +
    labelEls.join("") +
    `</svg>`;

  // Wheel dots are interactive — clicking navigates to that color.
  // `navigateToColor` is provided by app.js at DOMContentLoaded.
  el.querySelectorAll(".wheel-dot").forEach((dot) => {
    dot.addEventListener("click", () => {
      const hx = dot.getAttribute("data-hex");
      if (hx && typeof navigateToColor === "function") navigateToColor(hx.toLowerCase());
    });
    dot.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const hx = dot.getAttribute("data-hex");
        if (hx && typeof navigateToColor === "function") navigateToColor(hx.toLowerCase());
      }
    });
  });
}
