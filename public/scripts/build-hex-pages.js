#!/usr/bin/env node
// scripts/build-hex-pages.js
// Reads colors.json and generates static HTML for /hex/<code>.html
// for each color. Each page is a real file Google can crawl.

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC_JSON = path.join(ROOT, "colors.json");
const OUT_DIR = path.join(ROOT, "hex");
const BASE_URL = "https://colourdetails.com";

// Import the color math by evaluating color.js in this scope.
// color.js defines functions on `global` when loaded as a module.
require(path.join(ROOT, "color.js"));
const { hex2rgb, hex2hsl, hex2cmyk, rgb2xyz, xyz2cielab, hex2inverse,
        hex2websafe, hex2complementary } = global;

if (!fs.existsSync(SRC_JSON)) {
  console.error("Missing colors.json");
  process.exit(1);
}
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const colors = JSON.parse(fs.readFileSync(SRC_JSON, "utf8"));

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function renderHexPage(color) {
  const hex = color.hex;
  const lower = hex.toLowerCase();
  const names = color.names || [];
  const primary = names[0] ? names[0].name : "Unnamed";
  const rgb = hex2rgb(hex);
  const [h, s, l] = hex2hsl(hex);
  const cmyk = hex2cmyk(hex);
  const complement = hex2complementary(hex);
  const inverse = hex2inverse(hex);
  const websafe = hex2websafe(hex);

  const hue = Math.round(h * 360);
  const sat = Math.round(s * 100);
  const light = Math.round(l * 100);

  const title = `${primary} (#${hex}) — Color Details, RGB, HSL, Harmonies`;
  const desc = `#${hex} ${primary}. RGB ${rgb.red}, ${rgb.green}, ${rgb.blue}. HSL ${hue}°, ${sat}%, ${light}%. Complementary #${complement}. Full details, harmonies, and CSS.`;
  const url = `${BASE_URL}/hex/${lower}.html`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}" />
  <link rel="canonical" href="${url}" />
  <link rel="stylesheet" href="/style.css" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:type" content="article" />
  <meta name="twitter:card" content="summary_large_image" />
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
        <span class="muted">RGB ${rgb.red}, ${rgb.green}, ${rgb.blue}</span>
      </div>
    </div>

    <section class="card">
      <h2>Color values</h2>
      <table class="base-table">
        <tbody>
          <tr><th>Hex</th><td>#${hex}</td></tr>
          <tr><th>RGB</th><td>rgb(${rgb.red}, ${rgb.green}, ${rgb.blue})</td></tr>
          <tr><th>HSL</th><td>hsl(${hue}, ${sat}%, ${light}%)</td></tr>
          <tr><th>CMYK</th><td>${(cmyk[0]*100).toFixed(0)}%, ${(cmyk[1]*100).toFixed(0)}%, ${(cmyk[2]*100).toFixed(0)}%, ${(cmyk[3]*100).toFixed(0)}%</td></tr>
          <tr><th>Complementary</th><td><a href="/hex/${complement.toLowerCase()}.html">#${complement}</a></td></tr>
          <tr><th>Inverse</th><td>#${inverse}</td></tr>
          <tr><th>Web-safe</th><td><a href="/hex/${websafe.toLowerCase()}.html">#${websafe}</a></td></tr>
        </tbody>
      </table>
    </section>

    ${names.length > 1 ? `
    <section class="card">
      <h2>Also known as</h2>
      <ul>
        ${names.map((n) => `<li>${esc(n.name)} <span class="muted">(${esc(n.source)})</span></li>`).join("")}
      </ul>
    </section>` : ""}

    <section class="card">
      <h2>Try a different color</h2>
      <form action="/" method="get">
        <input type="text" name="color" placeholder="e.g. beff00 or #beff00" />
        <button type="submit">Preview</button>
      </form>
    </section>
  </main>
  <!-- @include footer -->
</body>
</html>
`;
}

let count = 0;
for (const color of colors) {
  const outPath = path.join(OUT_DIR, `${color.hex.toLowerCase()}.html`);
  fs.writeFileSync(outPath, renderHexPage(color));
  count++;
}

console.log(`[build-hex-pages] Wrote ${count} hex pages to /hex/`);