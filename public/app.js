// ============================================================
// Color Conversion Utilities (ported from ColoursUtility.php)
// ============================================================

// Normalize input like "ff5733", "#ff5733", "FF5733" → "ff5733"
function normalizeColor(input) {
  if (!input) return null;
  const cleaned = input.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(cleaned)) return null;
  return cleaned.toLowerCase();
}

function expandShortHex(hex) {
  if (hex.length === 3) {
    return hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  return hex;
}

// Validate hex and return 6-digit hex (or default "000000")
function validateHex(hex, defaultColor = true) {
  if (!hex) return defaultColor ? "000000" : false;
  let h = hex.replace(/^#/, "");
  if (/^[0-9a-fA-F]{6}$/.test(h)) return h.toLowerCase();
  if (/^[0-9a-fA-F]{3}$/.test(h)) return expandShortHex(h.toLowerCase());
  return defaultColor ? "000000" : false;
}

function hex2rgb(hexStr) {
  const hex = validateHex(hexStr);
  const colorVal = parseInt(hex, 16);
  return {
    red: (colorVal >> 16) & 0xff,
    green: (colorVal >> 8) & 0xff,
    blue: colorVal & 0xff,
  };
}

function rgb2hex(rgb) {
  const r = Math.round(255 * rgb[0]);
  const g = Math.round(255 * rgb[1]);
  const b = Math.round(255 * rgb[2]);
  return (
    r.toString(16).padStart(2, "0") +
    g.toString(16).padStart(2, "0") +
    b.toString(16).padStart(2, "0")
  ).toUpperCase();
}

// Returns [h, s, l] with values 0..1
function rgb2hsl(rgb) {
  const [r, g, b] = rgb;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const chroma = max - min;
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (chroma !== 0) {
    s = l < 0.5 ? chroma / (max + min) : chroma / (2 - max - min);
    const delR = ((max - r) / 6 + chroma / 2) / chroma;
    const delG = ((max - g) / 6 + chroma / 2) / chroma;
    const delB = ((max - b) / 6 + chroma / 2) / chroma;
    if (r === max) h = delB - delG;
    else if (g === max) h = 1 / 3 + delR - delB;
    else if (b === max) h = 2 / 3 + delG - delR;
    if (h < 0) h += 1;
    if (h > 1) h -= 1;
  }
  return [h, s, l];
}

// Returns [h, s, v] with values 0..1
function rgb2hsv(rgb) {
  const [r, g, b] = rgb;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const chroma = max - min;
  const v = max;
  let h = 0, s = 0;
  if (chroma !== 0) {
    s = chroma / max;
    const delR = ((max - r) / 6 + chroma / 2) / chroma;
    const delG = ((max - g) / 6 + chroma / 2) / chroma;
    const delB = ((max - b) / 6 + chroma / 2) / chroma;
    if (r === max) h = delB - delG;
    else if (g === max) h = 1 / 3 + delR - delB;
    else if (b === max) h = 2 / 3 + delG - delR;
    if (h < 0) h += 1;
    if (h > 1) h -= 1;
  }
  return [h, s, v];
}

function rgb2cmy(rgb) {
  return [1 - rgb[0], 1 - rgb[1], 1 - rgb[2]];
}

function cmy2cmyk(cmy) {
  const [c, m, y] = cmy;
  let k = 1;
  if (c < k) k = c;
  if (m < k) k = m;
  if (y < k) k = y;
  if (k === 1) return [0, 0, 0, 1];
  return [(c - k) / (1 - k), (m - k) / (1 - k), (y - k) / (1 - k), k];
}

function rgb2xyz(rgb) {
  let [r, g, b] = rgb;
  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
  r *= 100; g *= 100; b *= 100;
  return [
    r * 0.4124 + g * 0.3576 + b * 0.1805,
    r * 0.2126 + g * 0.7152 + b * 0.0722,
    r * 0.0193 + g * 0.1192 + b * 0.9505,
  ];
}

function xyz2yxy(xyz) {
  const [x, y, z] = xyz;
  const sum = x + y + z;
  const x2 = sum !== 0 ? x / sum : 0;
  const y2 = sum !== 0 ? y / sum : 0;
  return [y, x2, y2];
}

function xyz2hlab(xyz) {
  const [x, y, z] = xyz;
  if (y === 0) return [0, 0, 0];
  const l = 10 * Math.sqrt(y);
  const a = 17.5 * ((1.02 * x - y) / Math.sqrt(y));
  const b = 7 * ((y - 0.847 * z) / Math.sqrt(y));
  return [l, a, b];
}

function xyz2cielab(xyz) {
  let [x, y, z] = xyz;
  x /= 95.047; y /= 100.0; z /= 108.883;
  x = x > 0.008856 ? Math.cbrt(x) : 7.787 * x + 16 / 116;
  y = y > 0.008856 ? Math.cbrt(y) : 7.787 * y + 16 / 116;
  z = z > 0.008856 ? Math.cbrt(z) : 7.787 * z + 16 / 116;
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

function cielab2cielch(lab) {
  const [l, a, b] = lab;
  let h = Math.atan2(b, a);
  if (h > 0) h = (h / Math.PI) * 180;
  else h = 360 - (Math.abs(h) / Math.PI) * 180;
  const c = Math.sqrt(a * a + b * b);
  return [l, c, h];
}

function xyz2cieluv(xyz) {
  const [x, y, z] = xyz;
  const denom = x + 15 * y + 3 * z;
  const varU = denom !== 0 ? (4 * x) / denom : 0;
  const varV = denom !== 0 ? (9 * y) / denom : 0;
  let varY = y / 100;
  varY = varY > 0.008856 ? Math.cbrt(varY) : 7.787 * varY + 16 / 116;
  const refX = 95.047, refY = 100.0, refZ = 108.883;
  const refDenom = refX + 15 * refY + 3 * refZ;
  const refU = (4 * refX) / refDenom;
  const refV = (9 * refY) / refDenom;
  const cieL = 116 * varY - 16;
  return [cieL, 13 * cieL * (varU - refU), 13 * cieL * (varV - refV)];
}

function hex2yiq(hexStr) {
  const rgb = hex2rgb(hexStr);
  const r = rgb.red / 255, g = rgb.green / 255, b = rgb.blue / 255;
  return [
    0.299 * r + 0.587 * g + 0.114 * b,
    0.596 * r - 0.275 * g - 0.321 * b,
    0.212 * r - 0.523 * g + 0.311 * b,
  ];
}

function hex2websafe(hexStr) {
  const hex = validateHex(hexStr);
  const r = Math.round((parseInt(hex.slice(0, 2), 16) / 255) * 5) * 51;
  const g = Math.round((parseInt(hex.slice(2, 4), 16) / 255) * 5) * 51;
  const b = Math.round((parseInt(hex.slice(4, 6), 16) / 255) * 5) * 51;
  return (
    r.toString(16).padStart(2, "0") +
    g.toString(16).padStart(2, "0") +
    b.toString(16).padStart(2, "0")
  ).toUpperCase();
}

function hex2inverse(hexStr) {
  const rgb = hex2rgb(hexStr);
  return (
    (255 - rgb.red).toString(16).padStart(2, "0") +
    (255 - rgb.green).toString(16).padStart(2, "0") +
    (255 - rgb.blue).toString(16).padStart(2, "0")
  ).toUpperCase();
}

function hex2grayscale(hexStr) {
  const rgb = hex2rgb(hexStr);
  const gs = Math.floor(0.3 * rgb.red + 0.59 * rgb.green + 0.11 * rgb.blue);
  const h = gs.toString(16).padStart(2, "0");
  return (h + h + h).toUpperCase();
}

// HSL -> RGB, input [h,s,l] 0..1, output [r,g,b] 0..1
function hsl2rgb(hsl) {
  const [h, s, l] = hsl;
  if (s === 0) return [l, l, l];
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const h_ = h * 6;
  const x = chroma * (1 - Math.abs((h_ % 2) - 1));
  const m = l - chroma / 2;
  let rgb;
  if (h_ >= 0 && h_ < 1) rgb = [chroma, x, 0];
  else if (h_ < 2) rgb = [x, chroma, 0];
  else if (h_ < 3) rgb = [0, chroma, x];
  else if (h_ < 4) rgb = [0, x, chroma];
  else if (h_ < 5) rgb = [x, 0, chroma];
  else rgb = [chroma, 0, x];
  return [rgb[0] + m, rgb[1] + m, rgb[2] + m];
}

function hsl2hex(hsl) {
  return rgb2hex(hsl2rgb(hsl));
}

function hex2hsl(hexStr) {
  const rgb = hex2rgb(hexStr);
  return rgb2hsl([rgb.red / 255, rgb.green / 255, rgb.blue / 255]);
}

function hex2hsv(hexStr) {
  const rgb = hex2rgb(hexStr);
  return rgb2hsv([rgb.red / 255, rgb.green / 255, rgb.blue / 255]);
}

function hex2cmyk(hexStr) {
  const rgb = hex2rgb(hexStr);
  return cmy2cmyk(rgb2cmy([rgb.red / 255, rgb.green / 255, rgb.blue / 255]));
}

// ============================================================
// Color Harmony Schemes
// ============================================================

function hex2complementary(hexStr) {
  const [h, s, l] = hex2hsl(hexStr);
  let h1 = h + 0.5;
  if (h > 0.5) h1 = h - 0.5;
  return hsl2hex([h1, s, l]);
}

function hex2splitcomplementary(hexStr) {
  const [h, s, l] = hex2hsl(hexStr);
  let h1 = h + 150 / 360;
  if (h1 < 0) h1 += 1; if (h1 > 1) h1 -= 1;
  let h2 = h + 210 / 360;
  if (h2 < 0) h2 += 1; if (h2 > 1) h2 -= 1;
  return [hsl2hex([h1, s, l]), hsl2hex([h2, s, l])];
}

function hex2triadic(hexStr) {
  const [h, s, l] = hex2hsl(hexStr);
  let h1 = h + 120 / 360; if (h1 < 0) h1 += 1; if (h1 > 1) h1 -= 1;
  let h2 = h + 240 / 360; if (h2 < 0) h2 += 1; if (h2 > 1) h2 -= 1;
  return [hsl2hex([h1, s, l]), hsl2hex([h2, s, l])];
}

function hex2tetradic(hexStr, clockwise = true) {
  const [h, s, l] = hex2hsl(hexStr);
  const dir = clockwise ? 1 : -1;
  const offs = [120, 180, 300];
  return offs.map((deg) => {
    let hh = h + (dir * deg) / 360;
    if (hh < 0) hh += 1; if (hh > 1) hh -= 1;
    return hsl2hex([hh, s, l]);
  });
}

function hex2tetradicsqr(hexStr) {
  const [h, s, l] = hex2hsl(hexStr);
  return [90, 180, 270].map((deg) => {
    let hh = h + deg / 360;
    if (hh < 0) hh += 1; if (hh > 1) hh -= 1;
    return hsl2hex([hh, s, l]);
  });
}

function hex2analagous(hexStr) {
  const [h, s, l] = hex2hsl(hexStr);
  let h1 = h - 30 / 360; if (h1 < 0) h1 += 1; if (h1 > 1) h1 -= 1;
  let h2 = h + 30 / 360; if (h2 < 0) h2 += 1; if (h2 > 1) h2 -= 1;
  return [hsl2hex([h1, s, l]), hexStr, hsl2hex([h2, s, l])];
}

// ============================================================
// Monochromatic variations
// ============================================================

function getShades(hexStr) {
  const [h, s, l] = hex2hsl(hexStr);
  const lDiff = l / 8;
  const out = [];
  for (let i = 0; i <= 8; i++) {
    out.push(hsl2hex([h, s, Math.max(0, l - lDiff * i)]));
  }
  return out;
}

function getTints(hexStr) {
  const [h, s, l] = hex2hsl(hexStr);
  const lDiff = (1 - l) / 8;
  const out = [];
  for (let i = 0; i <= 8; i++) {
    out.push(hsl2hex([h, s, Math.min(1, l + lDiff * i)]));
  }
  return out;
}

function getSaturationTones(hexStr, more = true) {
  const [h, s, l] = hex2hsl(hexStr);
  const sDiff = more ? (1 - s) / 8 : s / 8;
  const out = [];
  for (let i = 0; i <= 8; i++) {
    const sv = more ? s + sDiff * i : s - sDiff * i;
    out.push(hsl2hex([h, Math.max(0, Math.min(1, sv)), l]));
  }
  return out;
}

// ============================================================
// Rendering
// ============================================================

function applyColor(hex6) {
  const full = expandShortHex(hex6);
  const color = "#" + full;

  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  const isLight = luminance > 0.6;

  // Main theme
  document.documentElement.style.setProperty("--bg", color);
  document.documentElement.style.setProperty("--text", isLight ? "#0f172a" : "#ffffff");

  // Surface tokens (cards, panels) — flip with the theme
  document.documentElement.style.setProperty("--surface", isLight ? "#ffffff" : "#1e293b");
  document.documentElement.style.setProperty("--surface-2", isLight ? "#f8fafc" : "#0f172a");
  document.documentElement.style.setProperty("--surface-3", isLight ? "#f1f5f9" : "#334155");
  document.documentElement.style.setProperty("--text-muted", isLight ? "#64748b" : "#cbd5e1");
  document.documentElement.style.setProperty("--border", isLight ? "#e2e8f0" : "#334155");
  document.documentElement.style.setProperty("--code-bg", isLight ? "#0f172a" : "#020617");
  document.documentElement.style.setProperty("--code-text", "#e2e8f0");

  const swatch = document.getElementById("preview-swatch");
  const info = document.getElementById("preview-info");

  if (swatch) swatch.style.background = color;
  if (info) info.textContent = `Previewing color: #${full.toUpperCase()}`;

  renderDetails(full);
}

function swatchItem(hex, label) {
  const h = hex.toUpperCase();
  return `<a class="swatch-item" href="/hex/${h.toLowerCase()}" title="#${h}">
    <span class="swatch" style="background:#${h}"></span>
    <span class="swatch-label">${label || "#" + h}</span>
  </a>`;
}

function swatchRow(hexes) {
  return `<div class="swatch-row">${hexes.map((h) => swatchItem(h)).join("")}</div>`;
}

function renderDetails(hex) {
  const rgb = hex2rgb(hex);
  const hsl = hex2hsl(hex);
  const hsv = hex2hsv(hex);
  const cmyk = hex2cmyk(hex);
  const xyz = rgb2xyz([rgb.red / 255, rgb.green / 255, rgb.blue / 255]);
  const yxy = xyz2yxy(xyz);
  const hlab = xyz2hlab(xyz);
  const cielab = xyz2cielab(xyz);
  const cielch = cielab2cielch(cielab);
  const cieluv = hex !== "000000" ? xyz2cieluv(xyz) : null;
  const yiq = hex2yiq(hex);

  const hue = Math.round(hsl[0] * 360 * 10) / 10;
  const sat = Math.round(hsl[1] * 100 * 10) / 10;
  const light = Math.round(hsl[2] * 100 * 10) / 10;

  const inverse = hex2inverse(hex);
  const grayscale = hex2grayscale(hex);
  const websafe = hex2websafe(hex);
  const complementary = hex2complementary(hex);
  const split = hex2splitcomplementary(hex);
  const triadic = hex2triadic(hex);
  const tetradicCW = hex2tetradic(hex, true);
  const tetradicCCW = hex2tetradic(hex, false);
  const tetradicSqr = hex2tetradicsqr(hex);
  const analogous = hex2analagous(hex);
  const shades = getShades(hex);
  const tints = getTints(hex);
  const moreSat = getSaturationTones(hex, true);
  const lessSat = getSaturationTones(hex, false);

  // --- Color spaces ---
  const spacesEl = document.getElementById("color-spaces");
  if (spacesEl) {
    spacesEl.innerHTML = `
      <h2>Color Spaces</h2>
      <div class="space-grid">
        <div class="space-card">
          <h3>RGB</h3>
          <div class="space-values">
            <span><b>R</b> ${rgb.red}</span>
            <span><b>G</b> ${rgb.green}</span>
            <span><b>B</b> ${rgb.blue}</span>
          </div>
          <p class="muted">rgb(${rgb.red}, ${rgb.green}, ${rgb.blue})</p>
        </div>
        <div class="space-card">
          <h3>HSL</h3>
          <div class="space-values">
            <span><b>H</b> ${hue}°</span>
            <span><b>S</b> ${sat}%</span>
            <span><b>L</b> ${light}%</span>
          </div>
          <p class="muted">hsl(${hue}, ${sat}%, ${light}%)</p>
        </div>
        <div class="space-card">
          <h3>HSV</h3>
          <div class="space-values">
            <span><b>H</b> ${hue}°</span>
            <span><b>S</b> ${Math.round(hsv[1] * 10000) / 100}%</span>
            <span><b>V</b> ${Math.round(hsv[2] * 10000) / 100}%</span>
          </div>
        </div>
        <div class="space-card">
          <h3>CMYK</h3>
          <div class="space-values">
            <span><b>C</b> ${Math.round(cmyk[0] * 10000) / 100}%</span>
            <span><b>M</b> ${Math.round(cmyk[1] * 10000) / 100}%</span>
            <span><b>Y</b> ${Math.round(cmyk[2] * 10000) / 100}%</span>
            <span><b>K</b> ${Math.round(cmyk[3] * 10000) / 100}%</span>
          </div>
        </div>
        <div class="space-card">
          <h3>CIE XYZ</h3>
          <div class="space-values">
            <span><b>X</b> ${xyz[0].toFixed(3)}</span>
            <span><b>Y</b> ${xyz[1].toFixed(3)}</span>
            <span><b>Z</b> ${xyz[2].toFixed(3)}</span>
          </div>
        </div>
        <div class="space-card">
          <h3>CIE Yxy</h3>
          <div class="space-values">
            <span><b>Y</b> ${yxy[0].toFixed(3)}</span>
            <span><b>x</b> ${yxy[1].toFixed(3)}</span>
            <span><b>y</b> ${yxy[2].toFixed(3)}</span>
          </div>
        </div>
        <div class="space-card">
          <h3>Hunter-Lab</h3>
          <div class="space-values">
            <span><b>L</b> ${hlab[0].toFixed(2)}</span>
            <span><b>a</b> ${hlab[1].toFixed(2)}</span>
            <span><b>b</b> ${hlab[2].toFixed(2)}</span>
          </div>
        </div>
        <div class="space-card">
          <h3>CIELAB</h3>
          <div class="space-values">
            <span><b>L</b> ${cielab[0].toFixed(2)}</span>
            <span><b>a</b> ${cielab[1].toFixed(2)}</span>
            <span><b>b</b> ${cielab[2].toFixed(2)}</span>
          </div>
        </div>
        ${cieluv ? `
        <div class="space-card">
          <h3>CIELUV</h3>
          <div class="space-values">
            <span><b>L</b> ${cieluv[0].toFixed(4)}</span>
            <span><b>u</b> ${cieluv[1].toFixed(4)}</span>
            <span><b>v</b> ${cieluv[2].toFixed(4)}</span>
          </div>
        </div>` : ""}
        <div class="space-card">
          <h3>CIELCH</h3>
          <div class="space-values">
            <span><b>L</b> ${cielch[0].toFixed(4)}</span>
            <span><b>C</b> ${cielch[1].toFixed(4)}</span>
            <span><b>H</b> ${cielch[2].toFixed(4)}</span>
          </div>
        </div>
        <div class="space-card">
          <h3>YIQ</h3>
          <div class="space-values">
            <span><b>Y</b> ${yiq[0].toFixed(4)}</span>
            <span><b>I</b> ${yiq[1].toFixed(4)}</span>
            <span><b>Q</b> ${yiq[2].toFixed(4)}</span>
          </div>
        </div>
      </div>
    `;
  }

  // --- Base numbers ---
  const baseEl = document.getElementById("base-numbers");
  if (baseEl) {
    const bin = (n) => n.toString(2).padStart(8, "0");
    const oct = (n) => n.toString(8);
    const dec = (n) => n.toString(10);
    const hx = (n) => n.toString(16).toUpperCase().padStart(2, "0");
    baseEl.innerHTML = `
      <h2>Base Numbers</h2>
      <table class="base-table">
        <thead><tr><th>Base</th><th class="red">Red</th><th class="green">Green</th><th class="blue">Blue</th></tr></thead>
        <tbody>
          <tr><th>Binary</th><td>${bin(rgb.red)}</td><td>${bin(rgb.green)}</td><td>${bin(rgb.blue)}</td></tr>
          <tr><th>Octal</th><td>${oct(rgb.red)}</td><td>${oct(rgb.green)}</td><td>${oct(rgb.blue)}</td></tr>
          <tr><th>Decimal</th><td>${dec(rgb.red)}</td><td>${dec(rgb.green)}</td><td>${dec(rgb.blue)}</td></tr>
          <tr><th>Hex</th><td>${hx(rgb.red)}</td><td>${hx(rgb.green)}</td><td>${hx(rgb.blue)}</td></tr>
        </tbody>
      </table>
      <p class="muted">OLE color (RGB Long): <b>${65536 * rgb.blue + 256 * rgb.green + rgb.red}</b> &middot; Decimal: <b>${65536 * rgb.red + 256 * rgb.green + rgb.blue}</b></p>
    `;
  }

  // --- Harmonies ---
  const harmEl = document.getElementById("harmonies");
  if (harmEl) {
    const schemeAvailable = hsl[1] !== 0;
    harmEl.innerHTML = `
      <h2>Color Harmonies</h2>
      ${!schemeAvailable ? `<p class="muted">No color harmony available for achromatic (grey) colors.</p>` : `
        <div class="harmony-block">
          <h3>Complementary</h3>
          <p class="muted">Opposite on the color wheel (hue + 180°).</p>
          ${swatchRow([hex, complementary])}
        </div>
        <div class="harmony-block">
          <h3>Split-Complementary</h3>
          <p class="muted">Two colors adjacent to the complement (hue ± 150°).</p>
          ${swatchRow([split[0], hex, split[1]])}
        </div>
        <div class="harmony-block">
          <h3>Triadic</h3>
          <p class="muted">Three colors evenly spaced around the wheel (hue ± 120°).</p>
          ${swatchRow([triadic[0], hex, triadic[1]])}
        </div>
        <div class="harmony-block">
          <h3>Tetradic (Rectangle) — Clockwise</h3>
          <p class="muted">Four colors: base, +120°, +180°, +300°.</p>
          ${swatchRow([hex, ...tetradicCW])}
        </div>
        <div class="harmony-block">
          <h3>Tetradic (Rectangle) — Counter-clockwise</h3>
          <p class="muted">Four colors: base, −120°, −180°, −300°.</p>
          ${swatchRow([hex, ...tetradicCCW])}
        </div>
        <div class="harmony-block">
          <h3>Tetradic (Square)</h3>
          <p class="muted">Four colors evenly spaced (hue + 90°, +180°, +270°).</p>
          ${swatchRow([hex, ...tetradicSqr])}
        </div>
        <div class="harmony-block">
          <h3>Analogous</h3>
          <p class="muted">Three colors next to each other (hue ± 30°).</p>
          ${swatchRow(analogous)}
        </div>
      `}
    `;
  }

  // --- Monochromatic ---
  const monoEl = document.getElementById("monochromatic");
  if (monoEl) {
    monoEl.innerHTML = `
      <h2>Monochromatic Variations</h2>
      <div class="harmony-block">
        <h3>Shades (Darker)</h3>
        <p class="muted">A shade is achieved by adding black to a pure hue.</p>
        ${swatchRow(shades)}
      </div>
      <div class="harmony-block">
        <h3>Tints (Brighter)</h3>
        <p class="muted">A tint is created by mixing white into a pure color.</p>
        ${swatchRow(tints)}
      </div>
      <div class="harmony-block">
        <h3>Tones with More Saturation</h3>
        <p class="muted">A tone is produced by adding gray to a pure hue.</p>
        ${swatchRow(moreSat)}
      </div>
      <div class="harmony-block">
        <h3>Tones with Less Saturation</h3>
        <p class="muted">A tone is produced by adding gray to a pure hue.</p>
        ${swatchRow(lessSat)}
      </div>
    `;
  }

  // --- Related colors ---
  const relEl = document.getElementById("related-colors");
  if (relEl) {
    relEl.innerHTML = `
      <h2>Related Colors</h2>
      <div class="swatch-grid">
        ${swatchItem(hex, "#" + hex.toUpperCase() + " (current)")}
        ${swatchItem(inverse, "#" + inverse + " (inverse)")}
        ${swatchItem(grayscale, "#" + grayscale + " (grayscale)")}
        ${swatchItem(websafe, "#" + websafe + (websafe === hex.toUpperCase() ? " (web-safe)" : " (nearby web-safe)"))}
        ${swatchItem(complementary, "#" + complementary + " (complementary)")}
      </div>
    `;
  }

  // --- CSS examples ---
  const cssEl = document.getElementById("css-examples");
  if (cssEl) {
    const H = hex.toUpperCase();
    cssEl.innerHTML = `
      <h2>CSS Code Examples</h2>
      <pre><code>.myforecolor {
  color: #${H};
}
.mybgcolor {
  background-color: #${H};
}
.mybordercolor {
  border: 3px solid #${H};
}</code></pre>
      <h3>Text color</h3>
      <p style="color:#${H}">The quick brown fox jumps over the lazy dog.</p>
      <h3>Background color</h3>
      <div style="padding:10px;color:#fff;text-align:center;background-color:#${H}">
        Background #${H}
      </div>
      <h3>Border color</h3>
      <div style="padding:10px;color:#fff;text-align:center;border:3px solid #${H}">
        Border #${H}
      </div>
      <h3>Text shadow</h3>
      <p style="text-shadow: 4px 4px 2px #${H};">Text with shadow #${H}</p>
      <h3>Box shadow</h3>
      <div style="padding:10px;box-shadow: 1px 1px 3px 2px #${H};">
        Box with shadow #${H}
      </div>
    `;
  }
}

// ============================================================
// Routing / Event wiring
// ============================================================

function readColorFromPath() {
  // Supports /color/xxxxxx and /hex/xxxxxx
  const match = window.location.pathname.match(/^\/(?:color|hex)\/([0-9a-fA-F#]+)$/);
  if (!match) return null;
  return normalizeColor(match[1]);
}

function applyCurrentPathColor() {
  const color = readColorFromPath();
  if (!color) return;

  const input = document.getElementById("color-input");
  applyColor(color);
  if (input) input.value = color;
}

function updateURLAndApply(colorHex) {
  const path = "/hex/" + colorHex;

  if (window.history && window.history.pushState) {
    window.history.pushState({ color: colorHex }, "", path);
    applyColor(colorHex);
  } else {
    window.location.href = path;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("color-form");
  const input = document.getElementById("color-input");

  // On initial load, apply color from URL if present
  applyCurrentPathColor();

  if (!form || !input) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const raw = input.value;
    const color = normalizeColor(raw);

    if (!color) {
      alert(
        "Please enter a valid 3 or 6 character hex color (e.g. ff5733 or #ff5733)."
      );
      return;
    }

    updateURLAndApply(color);
  });

  // Handle browser back/forward
  window.addEventListener("popstate", applyCurrentPathColor);
});
