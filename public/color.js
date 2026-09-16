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