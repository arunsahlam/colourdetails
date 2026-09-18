#!/usr/bin/env node
// scripts/build-hex-pages.js
//
// Reads colors.json and generates one static HTML file per color
// at /hex/<code>.html — each with its own <title>, meta, canonical,
// JSON-LD, and precomputed values.
//
// Usage: node scripts/build-hex-pages.js

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC_JSON = path.join(ROOT, "colors.json");
const OUT_DIR = path.join(ROOT, "hex");
const BASE_URL = "https://colourdetails.com";

// ----------------------------------------------------------------
// Load color math from color.js
// ----------------------------------------------------------------
const C = require(path.join(ROOT, "js", "color.js"));
const {
  HEX, hex2rgb, hex2hsl, hex2cmyk, hex2inverse, hex2websafe,
  hex2complementary, hex2grayscale,
} = C;

// ----------------------------------------------------------------
// Load partials from _partials/
// ----------------------------------------------------------------
const PARTIALS_DIR = path.join(ROOT, "_partials");
const PARTIALS = {};
for (const file of fs.readdirSync(PARTIALS_DIR)) {
  if (!file.endsWith(".html")) continue;
  const name = file.replace(/\.html$/, "");
  PARTIALS[name] = fs.readFileSync(path.join(PARTIALS_DIR, file), "utf8");
}

const INCLUDE_RE = /<!--\s*@include\s+([a-z0-9_-]+)\s*-->/gi;

function inlinePartials(source) {
  let out = source;
  for (let pass = 0; pass < 10; pass++) {
    let changed = false;
    out = out.replace(INCLUDE_RE, (match, name) => {
      if (!PARTIALS[name]) {
        console.warn(`  ⚠ unknown partial: ${name}`);
        return match;
      }
      changed = true;
      return PARTIALS[name];
    });
    if (!changed) break;
  }
  return out;
}

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------
function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function rgbString(rgb) {
  return `rgb(${rgb.red}, ${rgb.green}, ${rgb.blue})`;
}

function hslString(hsl) {
  const h = Math.round(hsl[0] * 3600) / 10;
  const s = Math.round(hsl[1] * 1000) / 10;
  const l = Math.round(hsl[2] * 1000) / 10;
  return `hsl(${h}, ${s}%, ${l}%)`;
}

function cmykString(cmyk) {
  return cmyk.map((v) => Math.round(v * 100) + "%").join(", ");
}

// ----------------------------------------------------------------
// Render one hex page
// ----------------------------------------------------------------
function renderHexPage(color) {
  const hex = color.hex;
  const lower = hex.toLowerCase();
  const names = color.names || [];
  const primary = names[0] ? names[0].name : "Unnamed";

  const rgb = hex2rgb(hex);
  const hsl = hex2hsl(hex);
  const cmyk = hex2cmyk(hex);
  const complement = hex2complementary(hex);
  const inverse = hex2inverse(hex);
  const websafe = hex2websafe(hex);
  const grayscale = hex2grayscale(hex);

  const title = `${primary} (#${hex}) — Color Details, RGB, HSL, Harmonies`;
  const desc =
    `#${hex} ${primary}. RGB ${rgb.red}, ${rgb.green}, ${rgb.blue}. ` +
    `HSL ${Math.round(hsl[0] * 360)}°, ${Math.round(hsl[1] * 100)}%, ${Math.round(hsl[2] * 100)}%. ` +
    `Complementary #${complement}. Full details, harmonies, and CSS.`;
  const url = `${BASE_URL}/hex/${lower}.html`;

  const namesList = names.length
    ? names
        .map((n) => `<li><strong>${esc(n.name)}</strong> <span class="muted">(${esc(n.source)})</span></li>`)
        .join("")
    : `<li>${esc(primary)}</li>`;

  const html = `<!DOCTYPE html>
<html lang="en-US">
<head>
  <!-- @include head-meta -->
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}" />
  <link rel="canonical" href="${url}" />
  <meta name="theme-color" content="#${hex}" />
  <meta property="og:type"        content="article" />
  <meta property="og:title"       content="${esc(title)}" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta property="og:url"         content="${url}" />
  <meta property="og:image"       content="${BASE_URL}/assets/og-hex.png" />
  <meta name="twitter:card"       content="summary_large_image" />
  <meta name="twitter:title"      content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(desc)}" />
  <meta name="twitter:image"      content="${BASE_URL}/assets/og-hex.png" />
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "${esc(title)}",
    "url": "${url}",
    "about": { "@type": "Thing", "name": "#${hex}", "description": "${esc(primary)}" },
    "mainEntity": { "@type": "DefinedTerm", "name": "${esc(primary)}", "termCode": "#${hex}" }
  }
  </script>
</head>
<body data-page="hex">
  <!-- @include header -->

  <main class="container">
    <h1>#${hex} — ${esc(primary)}</h1>

    <div class="preview">
      <div class="preview-swatch" style="background:#${hex}"></div>
      <div class="preview-info">
        <strong>#${hex}</strong>
        <span class="muted">${rgbString(rgb)}</span>
      </div>
    </div>

    <section class="card">
      <h2>Color values</h2>
      <table class="base-table">
        <tbody>
          <tr><th>Hex</th><td>#${hex}</td></tr>
          <tr><th>RGB</th><td>${rgbString(rgb)}</td></tr>
          <tr><th>HSL</th><td>${hslString(hsl)}</td></tr>
          <tr><th>CMYK</th><td>${cmykString(cmyk)}</td></tr>
          <tr><th>Complementary</th><td><a href="/hex/${complement.toLowerCase()}.html">#${complement}</a></td></tr>
          <tr><th>Inverse</th><td>#${inverse}</td></tr>
          <tr><th>Grayscale</th><td>#${grayscale}</td></tr>
          <tr><th>Web-safe</th><td><a href="/hex/${websafe.toLowerCase()}.html">#${websafe}</a></td></tr>
        </tbody>
      </table>
    </section>

    ${
      names.length > 1
        ? `<section class="card">
      <h2>Also known as</h2>
      <ul>${namesList}</ul>
    </section>`
        : ""
    }

    <section class="card">
      <h2>Interactive details</h2>
      <p class="muted">
        For the full interactive view with live previews, harmonies, WCAG
        contrast checks, and copy-ready CSS, use the
        <a href="/?color=${lower}">homepage tool</a>.
      </p>
    </section>

    <section class="card">
      <h2>Try a different color</h2>
      <form action="/" method="get">
        <label for="hex-input">Hex color</label>
        <input id="hex-input" type="text" name="color" placeholder="e.g. beff00 or #beff00" />
        <button type="submit">Preview</button>
      </form>
    </section>
  </main>

  <!-- @include footer -->
</body>
</html>
`;

  return inlinePartials(html);
}

// ----------------------------------------------------------------
// Build
// ----------------------------------------------------------------
if (!fs.existsSync(SRC_JSON)) {
  console.error("Missing colors.json at", SRC_JSON);
  process.exit(1);
}
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const colors = JSON.parse(fs.readFileSync(SRC_JSON, "utf8"));
let count = 0;

for (const color of colors) {
  const outPath = path.join(OUT_DIR, `${color.hex.toLowerCase()}.html`);
  const html = renderHexPage(color);

  // Warn if any include markers survived
  const remaining = html.match(/<!--\s*@include\s+[^\s]+\s*-->/g);
  if (remaining) {
    console.warn(`  ⚠ ${color.hex}: unresolved includes — ${remaining.join(", ")}`);
  }

  fs.writeFileSync(outPath, html);
  count++;
}

console.log(`[build-hex-pages] Wrote ${count} hex pages to /hex/`);