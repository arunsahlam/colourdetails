// ============================================================
// app.js — Routing, rendering, DOM wiring
// Depends on color.js and harmony.js
// ============================================================

// ============================================================
// Theme (light / dark / auto)
// ============================================================
const Theme = (() => {
  const KEY = "beff00.theme";
  const root = document.documentElement;
  let mode = "auto"; // 'auto' | 'light' | 'dark'
  let colorIsLight = true;
  let onChangeCbs = [];

  function systemPrefersDark() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  // Decide effective theme from mode + color luminance
  function effectiveIsLight() {
    if (mode === "light") return true;
    if (mode === "dark") return false;
    return colorIsLight;
  }

  function apply() {
    const isLight = effectiveIsLight();
    root.setAttribute("data-theme", isLight ? "light" : "dark");
    onChangeCbs.forEach((cb) => cb(isLight));
  }

  function setMode(next) {
    mode = next;
    try { localStorage.setItem(KEY, mode); } catch {}
    apply();
  }

  function init() {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === "light" || saved === "dark" || saved === "auto") mode = saved;
    } catch {}
    if (window.matchMedia) {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
        if (mode === "auto") apply();
      });
    }
    apply();
  }

  return {
    init,
    setMode,
    getMode: () => mode,
    cycle: () => setMode(mode === "auto" ? "light" : mode === "light" ? "dark" : "auto"),
    setColorIsLight: (v) => { colorIsLight = v; if (mode === "auto") apply(); },
    onChange: (cb) => onChangeCbs.push(cb),
    effectiveIsLight,
  };
})();

// ============================================================
// Theme tokens
// ============================================================
function applyThemeTokens(isLight, colorFull) {
  const root = document.documentElement;
  const color = "#" + colorFull;

  root.style.setProperty("--bg", isLight ? color : color);
  root.style.setProperty("--text", isLight ? "#0f172a" : "#ffffff");
  root.style.setProperty("--surface", isLight ? "#ffffff" : "#1e293b");
  root.style.setProperty("--surface-2", isLight ? "#f8fafc" : "#0f172a");
  root.style.setProperty("--surface-3", isLight ? "#f1f5f9" : "#334155");
  root.style.setProperty("--text-muted", isLight ? "#64748b" : "#cbd5e1");
  root.style.setProperty("--border", isLight ? "#e2e8f0" : "#334155");
  root.style.setProperty("--code-bg", isLight ? "#0f172a" : "#020617");
  root.style.setProperty("--code-text", "#e2e8f0");
  root.style.setProperty("--muted", isLight ? "#64748b" : "#cbd5e1");

  // Update the theme-color meta so mobile chrome matches
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", color.toUpperCase());
}

// ============================================================
// applyColor
// ============================================================
function applyColor(hex6) {
  const full = expandShortHex(hex6);
  const color = "#" + full;

  const luminance = hexLuminance(full);
  const colorIsLight = luminance > CONFIG.LUMINANCE_THRESHOLD;

  Theme.setColorIsLight(colorIsLight);
  applyThemeTokens(Theme.effectiveIsLight(), full);

  const swatch = document.getElementById("preview-swatch");
  const info = document.getElementById("preview-info");

  if (swatch) swatch.style.background = color;

  if (info) {
    const textOn = readableTextOn(full);
    info.innerHTML =
      `<span class="hex-label">#${HEX(full)}</span>` +
      `<button class="copy-btn" data-copy="${HEX(full)}" aria-label="Copy hex ${HEX(full)}">copy</button>` +
      `<span class="contrast-hint">text on this bg → <code>${textOn}</code></span>`;
    attachCopyHandlers(info);
  }

  // Canonical link + JSON-LD + theme-color
  const canonical = document.getElementById("canonical-link");
  if (canonical) canonical.setAttribute("href", `/hex/${full.toLowerCase()}`);
  updateJSONLD(full);

  renderDetails(full);
  renderOverviewWheel(full);
}

function updateJSONLD(hex) {
  const el = document.getElementById("jsonld");
  if (!el) return;
  const data = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `#${HEX(hex)} Color Guide`,
    description: `Color guide for #${HEX(hex)} with conversions, harmony, shades, and CSS.`,
    about: { "@type": "Thing", "name": `#${HEX(hex)}` },
    mainEntity: { "@type": "DefinedTerm", "termCode": `#${HEX(hex)}` },
  };
  el.textContent = JSON.stringify(data);
}

// ============================================================
// Clipboard
// ============================================================
function attachCopyHandlers(root) {
  root.querySelectorAll("[data-copy]").forEach((btn) => {
    if (btn.dataset.copyBound === "1") return;
    btn.dataset.copyBound = "1";
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      const value = btn.getAttribute("data-copy");
      try {
        await navigator.clipboard.writeText(value);
        const original = btn.textContent;
        btn.textContent = "copied";
        btn.classList.add("copied");
        setTimeout(() => {
          btn.textContent = original;
          btn.classList.remove("copied");
        }, 1200);
      } catch {
        window.prompt("Copy value:", value);
      }
    });
  });
}

// ============================================================
// Swatch helpers
// ============================================================
function swatchItem(hex, label) {
  const h = HEX(hex);
  return `<a class="swatch-item" href="/hex/${hex.toLowerCase()}" title="#${h}" aria-label="Preview color #${h}">
    <span class="swatch" style="background:#${h}"></span>
    <span class="swatch-label">${label || "#" + h}</span>
  </a>`;
}

function swatchRow(hexes) {
  return `<div class="swatch-row">${hexes.map((h) => swatchItem(h)).join("")}</div>`;
}

function infoCard(hex, label, note) {
  const h = HEX(hex);
  return `<article class="info-card">
    <div class="info-swatch" style="background:#${h}"></div>
    <div class="info-body">
      <span class="label">${label}</span>
      <div class="info-hex">
        <a href="/hex/${hex.toLowerCase()}">#${h}</a>
        <button class="copy-btn" data-copy="#${h}" aria-label="Copy hex #${h}">copy</button>
      </div>
      ${note ? `<p class="muted">${note}</p>` : ""}
    </div>
  </article>`;
}

function copyChip(value) {
  return `<button class="copy-btn copy-chip" data-copy="${value}" aria-label="Copy ${value}">copy</button>`;
}

// ============================================================
// Overview wheel
// ============================================================
function renderOverviewWheel(hex) {
  const el = document.getElementById("wheel-overview");
  if (!el) return;
  const [, s] = hex2hsl(hex);
  if (s === 0) {
    el.innerHTML = `<p class="muted">Achromatic color — no hue to plot.</p>`;
    return;
  }
  const comp = hex2complementary(hex);
  const split = hex2splitcomplementary(hex);
  const tri = hex2triadic(hex);
  const tetCW = hex2tetradic(hex, true);
  const tetSqr = hex2tetradicsqr(hex);
  const ana = hex2analagous(hex);

  const hexes = [hex, comp, split[0], split[1], tri[0], tri[1], ...tetCW, ...tetSqr, ...ana];
  const arcs = [
    [hex, comp],
    [hex, split[0]], [hex, split[1]],
    [hex, tri[0]], [hex, tri[1]], [tri[0], tri[1]],
    [hex, tetCW[1]], [tetCW[0], tetCW[2]],
    [hex, tetSqr[1]], [tetSqr[0], tetSqr[2]],
    [ana[0], hex], [hex, ana[2]],
  ];
  drawWheel(el, hex, hexes, arcs, { size: 300, showLabels: true });
}

// ============================================================
// Detail rendering
// ============================================================
function renderDetails(hex) {
  const safe = normalizeColor(hex);
  if (!safe) return;

  const rgb = hex2rgb(safe);
  const hsl = hex2hsl(safe);
  const hsv = hex2hsv(safe);
  const cmyk = hex2cmyk(safe);
  const xyz = rgb2xyz([rgb.red / 255, rgb.green / 255, rgb.blue / 255]);
  const yxy = xyz2yxy(xyz);
  const hlab = xyz2hlab(xyz);
  const cielab = xyz2cielab(xyz);
  const cielch = cielab2cielch(cielab);
  const cieluv = xyz[1] > CONFIG.CIELUV_MIN_Y ? xyz2cieluv(xyz) : null;
  const yiq = hex2yiq(safe);

  const hue = Math.round(hsl[0] * 360 * 10) / 10;
  const sat = Math.round(hsl[1] * 100 * 10) / 10;
  const light = Math.round(hsl[2] * 100 * 10) / 10;

  const inverse = hex2inverse(safe);
  const grayscale = hex2grayscale(safe);
  const websafe = hex2websafe(safe);
  const complementary = hex2complementary(safe);
  const split = hex2splitcomplementary(safe);
  const triadic = hex2triadic(safe);
  const tetradicCW = hex2tetradic(safe, true);
  const tetradicCCW = hex2tetradic(safe, false);
  const tetradicSqr = hex2tetradicsqr(safe);
  const analogous = hex2analagous(safe);
  const shades = getShades(safe);
  const tints = getTints(safe);
  const moreSat = getSaturationTones(safe, true);
  const lessSat = getSaturationTones(safe, false);
  const verdict = colorVerdict(safe);

  const H = HEX(safe);

  // --- Verdict ---
  const verdictEl = document.getElementById("verdict");
  if (verdictEl) {
    verdictEl.innerHTML = `
      <h2>Verdict</h2>
      <div class="verdict-grid">
        <div class="verdict-card">
          <span class="label">Accent</span>
          <strong>${verdict.accent.label}</strong>
          <p class="muted">${verdict.accent.note}</p>
        </div>
        <div class="verdict-card">
          <span class="label">Body text</span>
          <strong>${verdict.body.label}</strong>
          <p class="muted">${verdict.body.note}</p>
        </div>
        <div class="verdict-card">
          <span class="label">Background</span>
          <strong>${verdict.background.label}</strong>
          <p class="muted">${verdict.background.note}</p>
        </div>
      </div>
    `;
  }

  // --- Compare strip ---
  const compareEl = document.getElementById("compare");
  if (compareEl) {
    const textOn = readableTextOn(safe);
    compareEl.innerHTML = `
      <h2>Compare</h2>
      <div class="compare-grid">
        <div class="compare-tile" style="background:#ffffff;color:#${H}">#${H} on white</div>
        <div class="compare-tile" style="background:#0f172a;color:#${H}">#${H} on dark</div>
        <div class="compare-tile" style="background:#${H};color:${textOn}">${textOn} on #${H}</div>
        <div class="compare-tile" style="background:#${H};color:#${H};border:2px dashed var(--border)">#${H} on itself</div>
      </div>
    `;
  }

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
          <p class="muted">rgb(${rgb.red}, ${rgb.green}, ${rgb.blue}) ${copyChip(`rgb(${rgb.red}, ${rgb.green}, ${rgb.blue})`)}</p>
        </div>
        <div class="space-card">
          <h3>HSL</h3>
          <div class="space-values">
            <span><b>H</b> ${hue}°</span>
            <span><b>S</b> ${sat}%</span>
            <span><b>L</b> ${light}%</span>
          </div>
          <p class="muted">hsl(${hue}, ${sat}%, ${light}%) ${copyChip(`hsl(${hue}, ${sat}%, ${light}%)`)}</p>
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
          <tr><th>Decimal</th><td>${dec(rgb.red)} ${copyChip(dec(rgb.red))}</td><td>${dec(rgb.green)} ${copyChip(dec(rgb.green))}</td><td>${dec(rgb.blue)} ${copyChip(dec(rgb.blue))}</td></tr>
          <tr><th>Hex</th><td>${hx(rgb.red)}</td><td>${hx(rgb.green)}</td><td>${hx(rgb.blue)}</td></tr>
        </tbody>
      </table>
      <p class="muted">OLE (RGB Long): <b>${65536 * rgb.blue + 256 * rgb.green + rgb.red}</b> ${copyChip(String(65536 * rgb.blue + 256 * rgb.green + rgb.red))}
        &middot; Decimal: <b>${65536 * rgb.red + 256 * rgb.green + rgb.blue}</b> ${copyChip(String(65536 * rgb.red + 256 * rgb.green + rgb.blue))}</p>
    `;
  }

  // --- Harmonies ---
  const harmEl = document.getElementById("harmonies");
  if (harmEl) {
    const schemeAvailable = hsl[1] !== 0;
    const harmonyDefs = [
      {
        id: "complementary", name: "Complementary",
        rule: "Opposite on the wheel — hue + 180°.",
        hexes: [safe, complementary], arcs: [[safe, complementary]],
        labels: ["Base", "Complement"],
      },
      {
        id: "split", name: "Split-Complementary",
        rule: "Two colors adjacent to the complement — hue ± 150°.",
        hexes: [split[0], safe, split[1]],
        arcs: [[safe, split[0]], [safe, split[1]]],
        labels: ["−150°", "Base", "+150°"],
      },
      {
        id: "triadic", name: "Triadic",
        rule: "Three colors evenly spaced — hue ± 120°.",
        hexes: [triadic[0], safe, triadic[1]],
        arcs: [[safe, triadic[0]], [safe, triadic[1]], [triadic[0], triadic[1]]],
        labels: ["−120°", "Base", "+120°"],
      },
      {
        id: "tetra-cw", name: "Tetradic (Rectangle) — Clockwise",
        rule: "Base and hue + 120°, + 180°, + 300°.",
        hexes: [safe, ...tetradicCW],
        arcs: [[safe, tetradicCW[1]], [tetradicCW[0], tetradicCW[2]]],
        labels: ["Base", "+120°", "+180°", "+300°"],
      },
      {
        id: "tetra-ccw", name: "Tetradic (Rectangle) — Counter-clockwise",
        rule: "Base and hue − 120°, − 180°, − 300°.",
        hexes: [safe, ...tetradicCCW],
        arcs: [[safe, tetradicCCW[1]], [tetradicCCW[0], tetradicCCW[2]]],
        labels: ["Base", "−120°", "−180°", "−300°"],
      },
      {
        id: "tetra-sq", name: "Tetradic (Square)",
        rule: "Four colors evenly spaced — hue + 90°, + 180°, + 270°.",
        hexes: [safe, ...tetradicSqr],
        arcs: [
          [safe, tetradicSqr[1]],
          [tetradicSqr[0], tetradicSqr[2]],
          [safe, tetradicSqr[2]],
        ],
        labels: ["Base", "+90°", "+180°", "+270°"],
      },
      {
        id: "analogous", name: "Analogous",
        rule: "Three neighbors on the wheel — hue ± 30°.",
        hexes: analogous, arcs: [[analogous[0], safe], [safe, analogous[2]]],
        labels: ["−30°", "Base", "+30°"],
      },
    ];

    harmEl.innerHTML = `
      <h2>Color Harmonies</h2>
      ${!schemeAvailable ? `<p class="muted">No color harmony for achromatic (grey) colors.</p>` : ""}
      ${harmonyDefs.map((def, idx) => `
        <details class="harmony-block" data-harmony="${def.id}" ${idx === 0 ? "open" : ""}>
          <summary>
            <h3>${def.name}</h3>
            <span class="summary-rule">${def.rule}</span>
          </summary>
          <div class="harmony-body">
            <div class="harmony-meta">
              ${def.hexes.map((h, i) =>
                `<span class="item"><span class="chip" style="background:#${HEX(h)}"></span>${def.labels[i] || ""} #${HEX(h)} ${copyChip("#" + HEX(h))}</span>`
              ).join("")}
            </div>
            <div class="harmony-wheel" id="wheel-${def.id}"></div>
            <div class="swatch-row">${def.hexes.map((h) => swatchItem(h)).join("")}</div>
          </div>
        </details>
      `).join("")}
    `;

    harmonyDefs.forEach((def) => {
      const detail = harmEl.querySelector(`details[data-harmony="${def.id}"]`);
      const el = document.getElementById("wheel-" + def.id);
      if (!detail || !el) return;
      const paint = () => drawWheel(el, safe, def.hexes, def.arcs, { size: 200 });
      if (detail.open) { paint(); el.dataset.painted = "1"; }
      detail.addEventListener("toggle", () => {
        if (detail.open && !el.dataset.painted) {
          paint();
          el.dataset.painted = "1";
        }
      });
    });
  }

  // --- Monochromatic (collapsible) ---
  const monoEl = document.getElementById("monochromatic");
  if (monoEl) {
    const blocks = [
      { id: "shades", name: "Shades (Darker)", rule: "Black added to a pure hue.", hexes: shades },
      { id: "tints", name: "Tints (Brighter)", rule: "White mixed into a pure color.", hexes: tints },
      { id: "more-sat", name: "Tones with More Saturation", rule: "Gray added to a pure hue.", hexes: moreSat },
      { id: "less-sat", name: "Tones with Less Saturation", rule: "Gray added to a pure hue.", hexes: lessSat },
    ];
    monoEl.innerHTML = `
      <h2>Monochromatic Variations</h2>
      ${blocks.map((b) => `
        <details class="harmony-block">
          <summary>
            <h3>${b.name}</h3>
            <span class="summary-rule">${b.rule}</span>
          </summary>
          <div class="harmony-body">
            ${swatchRow(b.hexes)}
          </div>
        </details>
      `).join("")}
    `;
  }

  // --- Alternatives (grouped info cards) ---
  const altEl = document.getElementById("alternatives");
  if (altEl) {
    const websafeNote = websafe === H
      ? "Already the closest web-safe value."
      : "Nearest classic web-safe fallback.";
    altEl.innerHTML = `
      <h2>Alternatives</h2>
      <div class="info-grid">
        ${infoCard(websafe, "Web-safe", websafeNote)}
        ${infoCard(inverse, "Inverse", "Each RGB channel flipped (255 − v).")}
        ${infoCard(grayscale, "Grayscale", "Perceptual luma of the original.")}
        ${infoCard(complementary, "Complementary", "Opposite hue on the color wheel.")}
      </div>
    `;
  }

  // --- Related colors (info cards) ---
  const relEl = document.getElementById("related-colors");
  if (relEl) {
    const splitMore = hex2splitcomplementary(safe);
    const tri = hex2triadic(safe);
    relEl.innerHTML = `
      <h2>Related Colors</h2>
      <div class="info-grid">
        ${infoCard(safe, "Current", `#${H}`)}
        ${infoCard(splitMore[0], "Split −150°", "Adjacent to the complement.")}
        ${infoCard(splitMore[1], "Split +150°", "Adjacent to the complement.")}
        ${infoCard(tri[0], "Triadic −120°", "Evenly spaced triangle.")}
        ${infoCard(tri[1], "Triadic +120°", "Evenly spaced triangle.")}
        ${infoCard(analogous[0], "Analogous −30°", "Neighboring hue.")}
        ${infoCard(analogous[2], "Analogous +30°", "Neighboring hue.")}
      </div>
    `;
  }

  // --- CSS examples (as copy cards) ---
  const cssEl = document.getElementById("css-examples");
  if (cssEl) {
    const tokens = `:root {\n  --accent: #${H};\n  --accent-dark: #${HEX(shades[2])};\n  --accent-soft: #${HEX(tints[2])};\n}`;
    const button = `.cta {\n  background: #${H};\n  color: ${readableTextOn(safe)};\n}`;
    const border = `.outline {\n  border: 2px solid #${H};\n}`;
    const shadow = `.glow {\n  box-shadow: 0 0 24px #${H};\n}`;
    const gradient = `.hero {\n  background: linear-gradient(\n    135deg,\n    #${H},\n    #${HEX(tints[2])}\n  );\n}`;

    const cards = [
      ["Design tokens", tokens],
      ["Button", button],
      ["Border", border],
      ["Glow", shadow],
      ["Gradient", gradient],
    ];

    cssEl.innerHTML = `
      <h2>CSS Examples</h2>
      <div class="code-grid">
        ${cards.map(([label, code]) => `
          <article class="code-card">
            <div class="code-head">
              <span class="label">${label}</span>
              <button class="copy-btn" data-copy="${code.replace(/"/g, "&quot;")}" aria-label="Copy ${label} CSS">copy</button>
            </div>
            <pre><code>${code.replace(/</g, "&lt;")}</code></pre>
          </article>
        `).join("")}
      </div>
      <h3>Live previews</h3>
      <p style="color:#${H}">The quick brown fox jumps over the lazy dog.</p>
      <div style="padding:10px;color:${readableTextOn(safe)};text-align:center;background-color:#${H}">Background #${H}</div>
      <div style="padding:10px;color:${readableTextOn(safe)};text-align:center;border:3px solid #${H};margin-top:8px">Border #${H}</div>
      <p style="text-shadow: 4px 4px 2px #${H};margin-top:8px">Text with shadow #${H}</p>
      <div style="padding:10px;box-shadow: 1px 1px 3px 2px #${H};margin-top:8px">Box with shadow #${H}</div>
    `;
  }

  // Re-bind copy handlers for all freshly rendered sections
  ["verdict", "compare", "color-spaces", "base-numbers", "harmonies", "monochromatic", "alternatives", "related-colors", "css-examples"]
    .forEach((id) => {
      const el = document.getElementById(id);
      if (el) attachCopyHandlers(el);
    });
}

// ============================================================
// Routing
// ============================================================
function readColorFromPath() {
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

// Exposed for wheel dots
function navigateToColor(hex) {
  updateURLAndApply(hex);
}

// ============================================================
// Inline form error
// ============================================================
function showFormError(message) {
  const errorEl = document.getElementById("color-error");
  const input = document.getElementById("color-input");
  if (errorEl) { errorEl.textContent = message; errorEl.hidden = false; }
  if (input) { input.setAttribute("aria-invalid", "true"); input.focus(); }
}

function clearFormError() {
  const errorEl = document.getElementById("color-error");
  const input = document.getElementById("color-input");
  if (errorEl) { errorEl.textContent = ""; errorEl.hidden = true; }
  if (input) input.removeAttribute("aria-invalid");
}

// ============================================================
// Theme toggle button
// ============================================================
function renderThemeButton() {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;
  const mode = Theme.getMode();
  const labels = { auto: "Auto", light: "Light", dark: "Dark" };
  const icons = {
    auto: "◐",
    light: "☀",
    dark: "☾",
  };
  btn.textContent = `${icons[mode]} ${labels[mode]}`;
  btn.setAttribute("aria-label", `Theme: ${labels[mode]} (click to cycle)`);
}

// ============================================================
// Bootstrap
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  Theme.init();
  Theme.onChange((isLight) => {
    const color = readColorFromPath() || "ffffff";
    applyThemeTokens(isLight, color);
  });

  const themeBtn = document.getElementById("theme-toggle");
  if (themeBtn) {
    renderThemeButton();
    themeBtn.addEventListener("click", () => {
      Theme.cycle();
      renderThemeButton();
      const color = readColorFromPath();
      if (color) applyThemeTokens(Theme.effectiveIsLight(), color);
    });
  }

  applyCurrentPathColor();

  const form = document.getElementById("color-form");
  const input = document.getElementById("color-input");
  if (!form || !input) return;

  input.addEventListener("input", clearFormError);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    clearFormError();

    const color = normalizeColor(input.value);
    if (!color) {
      showFormError("Please enter a valid 3 or 6 character hex color (e.g. ff5733 or #ff5733).");
      return;
    }
    updateURLAndApply(color);
  });

  window.addEventListener("popstate", applyCurrentPathColor);
});