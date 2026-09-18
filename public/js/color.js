// ============================================================
// color.js — Color math and conversions
// Ported from ColoursUtility.php
// Loaded before harmony.js and app.js
// ============================================================

// ------------------------------------------------------------
// Config
// ------------------------------------------------------------
const CONFIG = {
  LUMINANCE_THRESHOLD: 0.6,
  HARMONY_OFFSETS: {
    complementary: 180,
    split: [150, 210],
    triadic: [120, 240],
    tetradicCW: [120, 180, 300],
    tetradicCCW: [-120, -180, -300],
    tetradicSquare: [90, 180, 270],
    analogous: [-30, 30],
  },
  CIELUV_MIN_Y: 0.5,
  WHEEL_SEGMENTS: 72,
  DEFAULT_HEX: "000000",
  // Body-text readability band. Outside this range, text is a bad idea.
  TEXT_L_MIN: 0.15,
  TEXT_L_MAX: 0.85,
  // Saturation above which a color is "loud".
  LOUD_SAT: 0.8,
  // Saturation below which a color is "neutral".
  NEUTRAL_SAT: 0.2,
};

// Uppercase helper — use at every render point so we never leak lowercase.
const HEX = (h) => String(h).toUpperCase();

const RAMP_EPSILON = 0.004;  // ~1/255 — treat smaller deltas as no-op

// ------------------------------------------------------------
// Validation / normalization
// ------------------------------------------------------------
function normalizeColor(input) {
  if (!input) return null;
  const cleaned = String(input).trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(cleaned)) return null;
  return cleaned.toLowerCase();
}

function expandShortHex(hex) {
  if (hex.length === 3) {
    return hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  return hex;
}

function validateHex(hex, defaultColor = true) {
  if (!hex) return defaultColor ? CONFIG.DEFAULT_HEX : false;
  let h = String(hex).replace(/^#/, "");
  if (/^[0-9a-fA-F]{6}$/.test(h)) return h.toLowerCase();
  if (/^[0-9a-fA-F]{3}$/.test(h)) return expandShortHex(h.toLowerCase());
  return defaultColor ? CONFIG.DEFAULT_HEX : false;
}

// ------------------------------------------------------------
// RGB
// ------------------------------------------------------------
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

// ------------------------------------------------------------
// HSL / HSV
// ------------------------------------------------------------
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

function hex2complementary(hexStr) {
  const [h, s, l] = hex2hsl(hexStr);
  let h1 = h + 0.5;
  if (h > 0.5) h1 = h - 0.5;
  return hsl2hex([h1, s, l]);
}

function hex2hsl(hexStr) {
  const rgb = hex2rgb(hexStr);
  return rgb2hsl([rgb.red / 255, rgb.green / 255, rgb.blue / 255]);
}

function hex2hsv(hexStr) {
  const rgb = hex2rgb(hexStr);
  return rgb2hsv([rgb.red / 255, rgb.green / 255, rgb.blue / 255]);
}

// ------------------------------------------------------------
// CMY / CMYK
// ------------------------------------------------------------
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

function hex2cmyk(hexStr) {
  const rgb = hex2rgb(hexStr);
  return cmy2cmyk(rgb2cmy([rgb.red / 255, rgb.green / 255, rgb.blue / 255]));
}

// ------------------------------------------------------------
// CIE XYZ and derived spaces
// ------------------------------------------------------------
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

// ------------------------------------------------------------
// YIQ
// ------------------------------------------------------------
function hex2yiq(hexStr) {
  const rgb = hex2rgb(hexStr);
  const r = rgb.red / 255, g = rgb.green / 255, b = rgb.blue / 255;
  return [
    0.299 * r + 0.587 * g + 0.114 * b,
    0.596 * r - 0.275 * g - 0.321 * b,
    0.212 * r - 0.523 * g + 0.311 * b,
  ];
}

// ------------------------------------------------------------
// Derived / practical values
// ------------------------------------------------------------
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

// Luminance 0..1 (Rec. 601, matches the old applyColor formula)
function hexLuminance(hexStr) {
  const rgb = hex2rgb(hexStr);
  return (0.299 * rgb.red + 0.587 * rgb.green + 0.114 * rgb.blue) / 255;
}

// Best text color to sit on the given background.
function readableTextOn(hexStr) {
  return hexLuminance(hexStr) > CONFIG.LUMINANCE_THRESHOLD ? "#0f172a" : "#ffffff";
}

// Relative luminance per WCAG for contrast ratio.
function wcagLuminance(hexStr) {
  const rgb = hex2rgb(hexStr);
  const chan = (v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * chan(rgb.red) + 0.7152 * chan(rgb.green) + 0.0722 * chan(rgb.blue);
}

function contrastRatio(hexA, hexB) {
  const la = wcagLuminance(hexA);
  const lb = wcagLuminance(hexB);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

// ------------------------------------------------------------
// Palette suggestions
// ------------------------------------------------------------
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

// Returns a 3-tile verdict on the color's practical uses.
function colorVerdict(hexStr) {
  const [h, s, l] = hex2hsl(hexStr);
  const ratioOnWhite = contrastRatio(hexStr, "ffffff");
  const ratioOnBlack = contrastRatio(hexStr, "000000");

  const isGrey = s < 0.05;

  // Accent
  let accent;
  if (s < CONFIG.NEUTRAL_SAT) accent = { label: "Neutral", note: "Safe for surfaces and borders." };
  else if (s > CONFIG.LOUD_SAT) accent = { label: "Strong accent", note: "Great for CTAs; avoid large areas." };
  else accent = { label: "Accent", note: "Buttons, chips, active states." };

  // Body text
  let body;
  if (l < CONFIG.TEXT_L_MIN || l > CONFIG.TEXT_L_MAX || ratioOnWhite < 4.5) {
    body = { label: "Avoid", note: "Not enough contrast for body copy." };
  } else {
    body = { label: "Okay", note: "Usable for text at 4.5:1 or better." };
  }

  // Background
  let bg;
  const textOn = readableTextOn(hexStr);
  const ratio = textOn === "#ffffff" ? ratioOnBlack : ratioOnWhite;
  if (ratio >= 7) bg = { label: "Excellent", note: `Use ${HEX(textOn)} text for AAA contrast.` };
  else if (ratio >= 4.5) bg = { label: "Good", note: `Use ${HEX(textOn)} text for AA contrast.` };
  else bg = { label: "Weak", note: "Neither black nor white reaches AA." };

  return { accent, body, background: bg, isGrey };
}

// ------------------------------------------------------------
// Percentages
// ------------------------------------------------------------
function rgbPercent(hexStr) {
  const rgb = hex2rgb(hexStr);
  return [
    (rgb.red / 255) * 100,
    (rgb.green / 255) * 100,
    (rgb.blue / 255) * 100,
  ];
}

function cmykPercent(hexStr) {
  return hex2cmyk(hexStr).map((v) => v * 100);
}

// ------------------------------------------------------------
// Blend / mix (linear RGB)
// ------------------------------------------------------------
function mixColors(hexA, hexB, t = 0.5) {
  const a = hex2rgb(hexA);
  const b = hex2rgb(hexB);
  const r = Math.round(a.red * (1 - t) + b.red * t);
  const g = Math.round(a.green * (1 - t) + b.green * t);
  const bl = Math.round(a.blue * (1 - t) + b.blue * t);
  return (
    r.toString(16).padStart(2, "0") +
    g.toString(16).padStart(2, "0") +
    bl.toString(16).padStart(2, "0")
  ).toUpperCase();
}

// Build a gradient of N stops between two colors
function buildGradient(hexA, hexB, steps = 10) {
  const out = [];
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    out.push(mixColors(hexA, hexB, t));
  }
  return out;
}

// ------------------------------------------------------------
// Color vision deficiency simulation
// Matrices from Machado, Oliveira, Fernandes (2009).
// Return simulated hex. Severity 0..1.
// ------------------------------------------------------------
// ------------------------------------------------------------
// Color Vision Deficiency (CVD) simulation
// Machado et al. (2009) matrices, 8 variants.
// Includes anomalous trichromacy (protanomaly/deuteranomaly/tritanomaly),
// dichromacy (protanopia/deuteranopia/tritanopia), and monochromacy
// (achromatopsia / atypical achromatopsia).
// ------------------------------------------------------------

// Machado 2009, severity 1.0 (dichromacy)
// Reference: http://www.inf.ufrgs.br/~oliveira/pubs_files/CVD_Simulation/CVD_Simulation.html
const CVD_DICHROMACY = {
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.011820, 0.042940, 0.968881],
  ],
  tritanopia: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.303900],
  ],
};

// Machado 2009, severity 0.5 (anomalous trichromacy, "mild" default)
// These are the severity-0.5 matrices from the Machado supplementary table.
const CVD_ANOMALOUS = {
  protanomaly: [
    [0.458064, 0.679578, -0.137642],
    [0.092785, 0.846313, 0.060902],
    [-0.007494, -0.016807, 1.024301],
  ],
  deuteranomaly: [
    [0.547494, 0.607765, -0.155259],
    [0.181692, 0.781742, 0.036566],
    [-0.010410, 0.027275, 0.983136],
  ],
  tritanomaly: [
    [1.017277, 0.027029, -0.044306],
    [-0.006113, 0.958479, 0.047634],
    [0.006379, 0.248708, 0.744913],
  ],
};

// Full list of variants for the simulator UI
const CVD_VARIANTS = [
  { id: "normal",              label: "Normal vision",                group: "Normal",        matrix: null },
  { id: "achromatopsia",       label: "Achromatopsia (total)",        group: "Monochromacy",  matrix: "achromatopsia" },
  { id: "atypical_achromatopsia", label: "Atypical Achromatopsia",    group: "Monochromacy",  matrix: "atypical_achromatopsia" },
  { id: "protanopia",          label: "Protanopia (red-blind)",       group: "Dichromacy",    matrix: "protanopia" },
  { id: "deuteranopia",        label: "Deuteranopia (green-blind)",   group: "Dichromacy",    matrix: "deuteranopia" },
  { id: "tritanopia",          label: "Tritanopia (blue-blind)",      group: "Dichromacy",    matrix: "tritanopia" },
  { id: "protanomaly",         label: "Protanomaly (red-weak)",       group: "Trichromacy",   matrix: "protanomaly" },
  { id: "deuteranomaly",       label: "Deuteranomaly (green-weak)",   group: "Trichromacy",   matrix: "deuteranomaly" },
  { id: "tritanomaly",         label: "Tritanomaly (blue-weak)",      group: "Trichromacy",   matrix: "tritanomaly" },
];

// Luminance weights for achromatopsia (Rec. 709 / sRGB)
const LUMA_R = 0.2126;
const LUMA_G = 0.7152;
const LUMA_B = 0.0722;

// sRGB linearization helpers (Machado matrices are meant to be
// applied in linear RGB, then re-encoded to sRGB).
function srgbToLinear(v) {
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}
function linearToSrgb(v) {
  return v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
}

function applyMatrix(m, r, g, b) {
  return [
    m[0][0] * r + m[0][1] * g + m[0][2] * b,
    m[1][0] * r + m[1][1] * g + m[1][2] * b,
    m[2][0] * r + m[2][1] * g + m[2][2] * b,
  ];
}

/**
 * Simulate color vision deficiency for a given hex.
 * @param {string} hexStr - 6-digit hex
 * @param {string} variantId - one of CVD_VARIANTS ids
 * @returns {string} 6-digit hex (uppercase)
 */
function simulateCVD(hexStr, variantId) {
  const variant = CVD_VARIANTS.find((v) => v.id === variantId);
  if (!variant || !variant.matrix) return HEX(hexStr);

  const rgb = hex2rgb(hexStr);
  let r = rgb.red / 255, g = rgb.green / 255, b = rgb.blue / 255;

  // Achromatopsia: pure luminance (grayscale)
  if (variant.matrix === "achromatopsia") {
    const y = LUMA_R * r + LUMA_G * g + LUMA_B * b;
    return rgbToHexFromUnit(y, y, y);
  }

  // Atypical achromatopsia: partial desaturation toward luminance (~60%)
  if (variant.matrix === "atypical_achromatopsia") {
    const y = LUMA_R * r + LUMA_G * g + LUMA_B * b;
    const t = 0.6;
    return rgbToHexFromUnit(
      r * (1 - t) + y * t,
      g * (1 - t) + y * t,
      b * (1 - t) + y * t
    );
  }

  const m =
    CVD_DICHROMACY[variant.matrix] || CVD_ANOMALOUS[variant.matrix];
  if (!m) return HEX(hexStr);

  // Linearize sRGB → linear RGB
  let lr = srgbToLinear(r);
  let lg = srgbToLinear(g);
  let lb = srgbToLinear(b);

  // Apply CVD matrix
  const [nr, ng, nb] = applyMatrix(m, lr, lg, lb);

  // Clamp (gamut mapping: simple clamp — good enough for display preview)
  const cr = Math.max(0, Math.min(1, nr));
  const cg = Math.max(0, Math.min(1, ng));
  const cb = Math.max(0, Math.min(1, nb));

  // Re-encode linear RGB → sRGB
  return rgbToHexFromUnit(
    linearToSrgb(cr),
    linearToSrgb(cg),
    linearToSrgb(cb)
  );
}

function rgbToHexFromUnit(r, g, b) {
  const to255 = (v) =>
    Math.round(Math.max(0, Math.min(1, v)) * 255)
      .toString(16)
      .padStart(2, "0");
  return (to255(r) + to255(g) + to255(b)).toUpperCase();
}

// Convenience helpers for the three common types (backwards compat)
function hex2protanopia(hexStr)   { return simulateCVD(hexStr, "protanopia"); }
function hex2deuteranopia(hexStr) { return simulateCVD(hexStr, "deuteranopia"); }
function hex2tritanopia(hexStr)   { return simulateCVD(hexStr, "tritanopia"); }
function hex2achromatopsia(hexStr){ return simulateCVD(hexStr, "achromatopsia"); }

// ------------------------------------------------------------
// Explicit tint/shade by factor (matches hextints.com model)
// Tint: new = old + (255 - old) * factor  (mix toward white)
// Shade: new = old * (1 - factor)          (mix toward black)
// Both operate per RGB channel.
// ------------------------------------------------------------

function tintByFactor(hexStr, factor) {
  const { red, green, blue } = hex2rgb(hexStr);
  const mix = (c) => Math.round(c + (255 - c) * factor);
  return (
    mix(red).toString(16).padStart(2, "0") +
    mix(green).toString(16).padStart(2, "0") +
    mix(blue).toString(16).padStart(2, "0")
  ).toUpperCase();
}

function shadeByFactor(hexStr, factor) {
  const { red, green, blue } = hex2rgb(hexStr);
  const mix = (c) => Math.round(c * (1 - factor));
  return (
    mix(red).toString(16).padStart(2, "0") +
    mix(green).toString(16).padStart(2, "0") +
    mix(blue).toString(16).padStart(2, "0")
  ).toUpperCase();
}

// Return array of { label, factor, hex } for the 10%..90% band,
// with the 0% base prepended.
function tintSteps(hexStr) {
  const rgb = hex2rgb(hexStr);
  const out = [{ label: "Base", hex: HEX(hexStr) }];

  // Max channel distance to white. If already at/near white, no-op.
  const distToWhite = Math.max(
    255 - rgb.red,
    255 - rgb.green,
    255 - rgb.blue
  );
  if (distToWhite <= 1) {
    return { steps: out, available: false, reason: "already-white" };
  }

  for (let pct = 10; pct <= 90; pct += 10) {
    const factor = pct / 100;
    out.push({
      label: `${pct}% tint`,
      hex: tintByFactor(hexStr, factor),
    });
  }
  return { steps: out, available: true };
}

function shadeSteps(hexStr) {
  const rgb = hex2rgb(hexStr);
  const out = [{ label: "Base", hex: HEX(hexStr) }];

  // Max channel value. If already at/near black, no-op.
  const maxChannel = Math.max(rgb.red, rgb.green, rgb.blue);
  if (maxChannel <= 1) {
    return { steps: out, available: false, reason: "already-black" };
  }

  for (let pct = 10; pct <= 90; pct += 10) {
    const factor = pct / 100;
    out.push({
      label: `${pct}% shade`,
      hex: shadeByFactor(hexStr, factor),
    });
  }
  return { steps: out, available: true };
}

// ------------------------------------------------------------
// Saturation steps with labels
// More: shift S toward 1 (fully saturated at same L)
// Less: shift S toward 0 (grey at same L)
// ------------------------------------------------------------

function moreSaturationSteps(hexStr) {
  const [h, s, l] = hex2hsl(hexStr);
  const out = [{ label: "Base", hex: HEX(hexStr) }];

  // No-op reasons, in priority order:
  // 1. Lightness is at an extreme — S has no effect on RGB.
  if (!saturationIsMeaningful(l)) {
    return {
      steps: out,
      available: false,
      reason: l >= 1 - RAMP_EPSILON ? "l-at-max" : "l-at-min",
    };
  }

  // 2. Already at (or effectively at) full saturation.
  if (s >= 1 - RAMP_EPSILON) {
    return { steps: out, available: false, reason: "already-saturated" };
  }

  const delta = (1 - s) / 9;
  for (let i = 1; i <= 9; i++) {
    const newS = Math.min(1, s + delta * i);
    out.push({
      label: `S+${Math.round((i / 9) * 100)}%`,
      hex: hsl2hex([h, newS, l]),
    });
  }
  return { steps: out, available: true };
}

function lessSaturationSteps(hexStr) {
  const [h, s, l] = hex2hsl(hexStr);
  const out = [{ label: "Base", hex: HEX(hexStr) }];

  // Same first check: L at an extreme means S is invisible.
  if (!saturationIsMeaningful(l)) {
    return {
      steps: out,
      available: false,
      reason: l >= 1 - RAMP_EPSILON ? "l-at-max" : "l-at-min",
    };
  }

  if (s <= RAMP_EPSILON) {
    return { steps: out, available: false, reason: "already-grey" };
  }

  const delta = s / 9;
  for (let i = 1; i <= 9; i++) {
    const newS = Math.max(0, s - delta * i);
    out.push({
      label: `S−${Math.round((i / 9) * 100)}%`,
      hex: hsl2hex([h, newS, l]),
    });
  }
  return { steps: out, available: true };
}

// Saturation only changes the rendered color when lightness is strictly
// between 0 and 1. At l = 0 or l = 1, S has no effect on the RGB result.
function saturationIsMeaningful(l) {
  return l > RAMP_EPSILON && l < 1 - RAMP_EPSILON;
}

// ------------------------------------------------------------
// WCAG 2.x contrast evaluation
// Thresholds:
//   AA normal:  4.5:1
//   AA large:   3.0:1
//   AAA normal: 7.0:1
//   AAA large:  4.5:1
// ------------------------------------------------------------

function wcagLevels(ratio) {
  return {
    aaNormal: ratio >= 4.5,
    aaLarge:  ratio >= 3.0,
    aaaNormal: ratio >= 7.0,
    aaaLarge:  ratio >= 4.5,
  };
}

// Find the nearest color (by lightness step) on the tint or shade ramp
// that reaches the given contrast threshold against the base color.
// Returns { hex, ratio, direction, step } or null.
function nearestPassingVariation(baseHex, towardWhite, threshold) {
  const steps = towardWhite
    ? tintSteps(baseHex).steps
    : shadeSteps(baseHex).steps;

  // Skip index 0 (the base itself)
  for (let i = 1; i < steps.length; i++) {
    const candidate = steps[i].hex;
    const ratio = contrastRatio(candidate, baseHex);
    if (ratio >= threshold) {
      return {
        hex: candidate,
        ratio,
        direction: towardWhite ? "tint" : "shade",
        step: steps[i].label,
      };
    }
  }
  return null;
}

// Full contrast report for a color used as a background.
function contrastReport(bgHex) {
  const whiteRatio = contrastRatio(bgHex, "FFFFFF");
  const blackRatio = contrastRatio(bgHex, "000000");
  const whiteLevels = wcagLevels(whiteRatio);
  const blackLevels = wcagLevels(blackRatio);

  const whiteWins = whiteRatio >= blackRatio;
  const best = whiteWins
    ? { color: "white", ratio: whiteRatio, levels: whiteLevels }
    : { color: "black", ratio: blackRatio, levels: blackLevels };

  // If neither reaches AAA normal, suggest a nearby tint/shade.
  let suggestion = null;
  if (!whiteLevels.aaaNormal && !blackLevels.aaaNormal) {
    // Trying lighter (tint) tends to help white text pass.
    const viaTint = nearestPassingVariation(bgHex, true, 7.0);
    // Trying darker (shade) tends to help white text pass on dark colors.
    const viaShade = nearestPassingVariation(bgHex, false, 7.0);
    suggestion =
      viaTint && (!viaShade || viaTint.ratio > viaShade.ratio)
        ? { ...viaTint, target: "AAA" }
        : viaShade
          ? { ...viaShade, target: "AAA" }
          : null;
  }

  return { whiteRatio, blackRatio, whiteLevels, blackLevels, whiteWins, best, suggestion };
}
// ------------------------------------------------------------
// Section descriptions
// One source of truth for the copy that appears under each
// section heading, in tooltips, and in the color-wheel legend.
// ------------------------------------------------------------
const DESCRIPTIONS = {
  variations:
    "A comprehensive collection of color modifications and harmonies derived " +
    "from the base color, including tints, shades, tones, and complementary palettes.",

  brighten:
    "Lighter variations (tints) created by mixing the base color with white, " +
    "increasing its overall lightness and brightness.",

  darken:
    "Darker variations (shades) created by mixing the base color with black, " +
    "adding depth and reducing lightness.",

  desaturate:
    "Muted variations created by reducing the color's intensity and adding gray, " +
    "resulting in softer, more subdued tones.",

  hue:
    "Smooth transitions across the color spectrum. This shifts the base color " +
    "to adjacent hues while maintaining consistent saturation and lightness.",

  analogous:
    "A harmonious palette consisting of colors located directly next to each " +
    "other on the color wheel, creating a serene and cohesive look.",

  monochromatic:
    "A single-hue palette that explores various lightness and saturation levels " +
    "of the base color, offering a clean, elegant, and unified aesthetic.",

  complementary:
    "A high-contrast pairing consisting of the base color and its exact opposite " +
    "on the color wheel, creating vibrant and dynamic visual tension.",

  splitComplement:
    "A three-color variation that uses the base color alongside the two colors " +
    "adjacent to its direct complement, offering high contrast with less visual " +
    "tension than a standard complementary pair.",

  triad:
    "A vibrant, three-color palette formed by selecting colors evenly spaced in " +
    "a triangle across the color wheel, perfectly balancing contrast and harmony.",

  tetrad:
    "A rich, four-color palette formed by two complementary pairs arranged in a " +
    "square or rectangle across the color wheel, offering immense variety and " +
    "strong visual contrast.",
};
// At the very end of color.js
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    CONFIG,
    HEX,
    normalizeColor,
    expandShortHex,
    validateHex,
    hex2rgb,
    rgb2hex,
    rgb2hsl,
    rgb2hsv,
    rgb2cmy,
    cmy2cmyk,
    rgb2xyz,
    xyz2yxy,
    xyz2hlab,
    xyz2cielab,
    cielab2cielch,
    xyz2cieluv,
    hex2yiq,
    hex2websafe,
    hex2inverse,
    hex2grayscale,
    hexLuminance,
    readableTextOn,
    wcagLuminance,
    contrastRatio,
    getShades,
    getTints,
    getSaturationTones,
    colorVerdict,
    hsl2rgb,
    hsl2hex,
    hex2hsl,
    hex2hsv,
    hex2cmyk,
    hex2complementary,
    tintByFactor,
    shadeByFactor,
    tintSteps,
    shadeSteps,
    moreSaturationSteps,
    lessSaturationSteps,
    mixColors,
    buildGradient,
    rgbPercent,
    cmykPercent,
    simulateCVD,
    CVD_VARIANTS,
    rgbToHexFromUnit,
  };
}