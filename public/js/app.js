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
function applyThemeTokens() {
  // Only the theme-color meta follows the selected color — it's the
  // browser chrome on mobile, not page content.
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    const color = readColorFromPath() || "ffffff";
    meta.setAttribute("content", "#" + color.toUpperCase());
  }
}

// ============================================================
// applyColor
// ============================================================
function applyColor(hex6) {
  showDetails();

  const full = expandShortHex(hex6);
  const color = "#" + full;

  const swatch = document.getElementById("preview-swatch");
  if (swatch) swatch.style.background = color;

  const info = document.getElementById("preview-info");
  if (info) {
    const textOn = readableTextOn(full);
    info.innerHTML =
      `<span class="hex-label">#${HEX(full)}</span>` +
      `<button class="copy-btn" data-copy="${HEX(full)}">copy</button>` +
      `<span class="contrast-hint">text on this bg → <code>${textOn}</code></span>`;
    attachCopyHandlers(info);
  }

  const canonical = document.getElementById("canonical-link");
  if (canonical) canonical.setAttribute("href", `/hex/${full.toLowerCase()}`);

  // Dynamic head / H1 updates for SEO and crawlability
  const url = `https://colourdetails.com/hex/${full.toLowerCase()}`;
  let name = "";
  try {
    const record = window.COLOR_NAMES_DATA?.find((r) => r.hex === full.toUpperCase());
    if (record && record.names && record.names.length) name = record.names[0].name;
  } catch (e) {}
  const displayName = name ? `${name} ` : "";
  const title = `${displayName}#${full.toUpperCase()} — RGB, HSL, CMYK, Harmonies & CSS`;
  const desc = name
    ? `${name} (#${full.toUpperCase()}). RGB, HSL, CMYK, CIELAB, color harmonies, shades, tints, WCAG contrast ratios, and copy-ready CSS.`
    : `#${full.toUpperCase()} color details. RGB, HSL, CMYK, CIELAB, harmonies, shades, tints, contrast ratios, and CSS examples.`;

  document.title = title;
  const setMeta = (attr, val, prop = "name") => {
    let el = document.querySelector(`meta[${prop}="${attr}"]`);
    if (!el) { el = document.createElement("meta"); el.setAttribute(prop, attr); document.head.appendChild(el); }
    el.setAttribute("content", val);
  };
  setMeta("description", desc);
  setMeta("og:title", title, "property");
  setMeta("og:description", desc, "property");
  setMeta("og:url", url, "property");
  setMeta("twitter:title", title);
  setMeta("twitter:description", desc);

  const h1 = document.querySelector("main h1");
  if (h1) h1.textContent = name ? `${name} #${full.toUpperCase()}` : `#${full.toUpperCase()}`;

  updateJSONLD(full);

  // Theme-color meta only
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", color.toUpperCase());

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

function swatchStrip(hexes) {
  const cells = hexes.map((h) => {
    const H = HEX(h);
    return `<a class="swatch-item" href="/hex/${h.toLowerCase()}"
              title="#${H}" aria-label="Preview color #${H}">
      <span class="swatch" style="background:#${H}"></span>
    </a>`;
  }).join("");

  const codes = hexes.map((h) => `<span>#${HEX(h)}</span>`).join("");

  return `
    <div class="swatch-strip" style="grid-template-columns: repeat(${hexes.length}, 1fr)">
      ${cells}
    </div>
    <div class="swatch-strip-codes" style="grid-template-columns: repeat(${hexes.length}, 1fr)">
      ${codes}
    </div>
  `;
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

// Show 4 neighbors from the named-colors index with hues within ±20°
// Find up to `count` named colors whose hue is within `windowDeg`
// of the given hex's hue, sorted by closest hue. Skips greys and
// near-greys (they have unstable hues) and the input color itself.
function nearbyNamedColors(hex, all, count = 5, windowDeg = 20) {
  if (!Array.isArray(all) || all.length === 0) return [];

  const H = HEX(hex);
  const [baseH, baseS] = hex2hsl(hex);

  // If the base is grey, hue is meaningless — bail.
  if (baseS < 0.05) return [];

  const windowN = windowDeg / 360;

  return all
    .filter((c) => c.hex !== H)
    .map((c) => {
      const [ch, cs] = hex2hsl(c.hex);
      // Skip greys — their hue is meaningless.
      if (cs < 0.1) return null;
      let dh = Math.abs(ch - baseH);
      if (dh > 0.5) dh = 1 - dh;
      return { hex: c.hex, names: c.names, dh };
    })
    .filter((c) => c && c.dh <= windowN)
    .sort((a, b) => a.dh - b.dh)
    .slice(0, count);
}

function renderContrast(hex) {
  const el = document.getElementById("contrast");
  if (!el) return;

  const H = HEX(hex);
  const report = contrastReport(hex);
  const { whiteRatio, blackRatio, whiteLevels, blackLevels, whiteWins, suggestion } = report;

  const fmt = (r) => r.toFixed(2) + ":1";

  const badge = (pass, label) =>
    `<span class="wcag-badge ${pass ? "pass" : "fail"}">${label}: ${pass ? "✔ Pass" : "✖ Fail"}</span>`;

  const row = (label, ratio, levels, tone) => `
    <div class="wcag-row" style="background:#${H};color:${tone}">
      <span class="wcag-swatch-label">${label}</span>
      <span class="wcag-ratio">${fmt(ratio)}</span>
      <span class="wcag-badges">
        ${badge(levels.aaNormal, "AA normal")}
        ${badge(levels.aaLarge, "AA large")}
        ${badge(levels.aaaNormal, "AAA normal")}
        ${badge(levels.aaaLarge, "AAA large")}
      </span>
    </div>
  `;

  const bestSentence = whiteWins
    ? `White text has the stronger contrast at ${fmt(whiteRatio)}.`
    : `Black text has the stronger contrast at ${fmt(blackRatio)}.`;

  const suggestionHTML = suggestion
    ? `
      <p class="muted">
        Neither pure white nor pure black reaches AAA for normal text on #${H}.
        Try the
        <a href="/hex/${suggestion.hex.toLowerCase()}">#${suggestion.hex}</a>
        (${suggestion.step}) instead — it reaches ${suggestion.ratio.toFixed(2)}:1,
        which passes AAA normal.
      </p>
    `
    : "";

  // ---- Nearby colors ----
  const all = window.COLOR_NAMES_DATA || [];
  const nearby = nearbyNamedColors(hex, all, 5, 20);

  const nearbyHTML = nearby.length
    ? `
      <h3 class="nearby-heading">Nearby colors</h3>
      <div class="nearby-pills">
        ${nearby.map((c) => {
          const name = c.names[0]?.name || "Unnamed";
          const HH = HEX(c.hex);
          return `
            <a class="nearby-pill" href="/hex/${c.hex.toLowerCase()}"
               title="${name} — #${HH}">
              <span class="nearby-swatch" style="background:#${HH}"></span>
              <span class="nearby-label">
                <strong>#${HH}</strong>
                <em>${name}</em>
              </span>
            </a>
          `;
        }).join("")}
      </div>
    `
    : "";

  el.innerHTML = `
    <h2>WCAG Contrast</h2>
    <p class="muted">
      Contrast ratios for text placed on a #${H} background.
      WCAG requires <strong>4.5:1</strong> for normal text (AA),
      <strong>3:1</strong> for large text (AA), and
      <strong>7:1</strong> for normal text (AAA).
    </p>
    <div class="wcag-grid">
      ${row("White text", whiteRatio, whiteLevels, "#ffffff")}
      ${row("Black text", blackRatio, blackLevels, "#000000")}
    </div>
    <p class="muted">${bestSentence}</p>
    ${suggestionHTML}
    ${nearbyHTML}
  `;
}

// ------------------------------------------------------------
// Known color names (from colors.json via window.COLOR_NAMES_DATA)
// ------------------------------------------------------------
function renderColorNames(hex) {
  const el = document.getElementById("color-names");
  if (!el) return;

  const H = HEX(hex);
  const all = window.COLOR_NAMES_DATA || [];
  const entry = all.find((c) => c.hex === H);

  if (!entry || !entry.names.length) {
    el.innerHTML = `
      <h2>Known names</h2>
      <p class="muted">No commonly-used name is registered for #${H}.</p>
    `;
    return;
  }

  const pills = entry.names
    .map(
      (n) =>
        `<span class="name-pill" title="Source: ${escapeHtml(n.source)}">
          ${escapeHtml(n.name)}
          <em>${escapeHtml(n.source)}</em>
        </span>`
    )
    .join("");

  el.innerHTML = `
  <h2>Known names</h2>
  <dl class="name-list">
    ${entry.names.map(n => `
      <dt>${escapeHtml(n.name)}</dt>
      <dd>${escapeHtml(n.source)}</dd>
    `).join("")}
  </dl>
  <p class="muted">${entry.names.length} name${entry.names.length === 1 ? "" : "s"} in the <a href="/colors.html">named colors index</a>.</p>
`;
}

// Tiny inline escaper (nothing in colors.json is user input, but be safe)
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

function renderInlineCVD(hex) {
  const el = document.getElementById("cvd-inline-grid");
  const hexLabel = document.getElementById("cvd-inline-hex");
  if (!el) return;

  const H = HEX(hex);
  if (hexLabel) hexLabel.textContent = H;

  const groups = {};
  for (const v of CVD_VARIANTS) {
    (groups[v.group] = groups[v.group] || []).push(v);
  }

  el.innerHTML = Object.entries(groups).map(([group, variants]) => `
    <div class="cvd-group">
      <h4>${group}</h4>
      <div class="cvd-row">
        ${variants.map((v) => {
          const sim = v.id === "normal" ? H : simulateCVD(hex, v.id);
          return `
            <article class="cvd-card">
              <div class="cvd-swatch" style="background:#${sim}"></div>
              <div class="cvd-body">
                <strong>${v.label}</strong>
                <code>#${sim}</code>
              </div>
            </article>
          `;
        }).join("")}
      </div>
    </div>
  `).join("");
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
    const rgbPct = rgbPercent(safe);
    const cmykPct = cmykPercent(safe);

    const wsNote = websafe === H
      ? `#${H} is already a web-safe color.`
      : `Web safe color of #${H} is #${websafe}.`;

    spacesEl.innerHTML = `
      <h2>Color Spaces</h2>

      <p class="callout">
        <strong>Web-safe fallback:</strong>
        ${websafe === H
          ? `#${H} is already web-safe.`
          : `<a href="/hex/${websafe.toLowerCase()}">#${websafe}</a> ${copyChip("#" + websafe)}`}
        <span class="muted"> — closest color from the 216-color legacy palette.</span>
      </p>

      <div class="space-grid">
        <div class="space-card">
          <h3>RGB</h3>
          <div class="space-values">
            <span><b>R</b> ${rgb.red}</span>
            <span><b>G</b> ${rgb.green}</span>
            <span><b>B</b> ${rgb.blue}</span>
          </div>
          <p class="muted">rgb(${rgb.red}, ${rgb.green}, ${rgb.blue}) ${copyChip(`rgb(${rgb.red}, ${rgb.green}, ${rgb.blue})`)}</p>
          <div class="pct-bar" role="img" aria-label="RGB percentages">
            <div class="pct-seg" style="background:#dc2626;flex:${rgbPct[0] || 0.001}">${rgbPct[0].toFixed(1)}%</div>
            <div class="pct-seg" style="background:#16a34a;flex:${rgbPct[1] || 0.001}">${rgbPct[1].toFixed(1)}%</div>
            <div class="pct-seg" style="background:#2563eb;flex:${rgbPct[2] || 0.001}">${rgbPct[2].toFixed(1)}%</div>
          </div>
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
          <p class="muted">Percentages: ${cmykPct.map((v) => v.toFixed(0) + "%").join(" / ")}</p>
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
        description: DESCRIPTIONS.complementary,
        hexes: [safe, complementary], arcs: [[safe, complementary]],
        labels: ["Base", "Complement"],
      },
      {
        id: "split", name: "Split-Complementary",
        rule: "Two colors adjacent to the complement — hue ± 150°.",
        description: DESCRIPTIONS.splitComplement,
        hexes: [split[0], safe, split[1]],
        arcs: [[safe, split[0]], [safe, split[1]]],
        labels: ["−150°", "Base", "+150°"],
      },
      {
        id: "triadic", name: "Triadic",
        rule: "Three colors evenly spaced — hue ± 120°.",
        description: DESCRIPTIONS.triad,
        hexes: [triadic[0], safe, triadic[1]],
        arcs: [[safe, triadic[0]], [safe, triadic[1]], [triadic[0], triadic[1]]],
        labels: ["−120°", "Base", "+120°"],
      },
      {
        id: "tetra-cw", name: "Tetradic (Rectangle) — Clockwise",
        rule: "Base and hue + 120°, + 180°, + 300°.",
        description: DESCRIPTIONS.tetrad,
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
        description: DESCRIPTIONS.analogous,
        hexes: analogous, arcs: [[analogous[0], safe], [safe, analogous[2]]],
        labels: ["−30°", "Base", "+30°"],
      },
    ];

    harmEl.innerHTML = `
      <h2>Color Harmonies</h2>
      ${!schemeAvailable ? `<p class="muted">No color harmony for achromatic (grey) colors.</p>` : ""}
      ${harmonyDefs.map((def, idx) => `
        <details class="harmony-block" data-harmony="${def.id}" style="border-left-color:#${HEX(def.hexes[0])}" open>
          <summary>
            <span class="harmony-index">${idx + 1}</span>
            <h3>${def.name}</h3>
            <span class="summary-rule">${def.rule}</span>
          </summary>
          <div class="harmony-body">
            <p class="muted harmony-desc">${def.description}</p>
            <div class="harmony-meta">
              ${def.hexes.map((h, i) =>
                `<span class="item"><span class="chip" style="background:#${HEX(h)}"></span>${def.labels[i] || ""} #${HEX(h)} ${copyChip("#" + HEX(h))}</span>`
              ).join("")}
            </div>
            <div class="harmony-values muted">
              ${def.hexes.map((hx) => `#${HEX(hx)}`).join(" | ")}
            </div>
            <div class="harmony-wheel" id="wheel-${def.id}"></div>
            <div class="swatch-row">${def.hexes.map((h) => swatchItem(h)).join("")}</div>
          </div>
        </details>
      `).join("")}
    `;

    harmonyDefs.forEach((def) => {
      const el = document.getElementById("wheel-" + def.id);
      if (!el) return;
      drawWheel(el, safe, def.hexes, def.arcs, { size: 200 });
    });
  }

  // --- Monochromatic ---
  const monoEl = document.getElementById("monochromatic");
  if (monoEl) {
    const shadeRamp = shadeSteps(safe);
    const tintRamp  = tintSteps(safe);
    const moreRamp  = moreSaturationSteps(safe);
    const lessRamp  = lessSaturationSteps(safe);

    const blocks = [
      {
        title: "Shades",
        description: `Each step blends #${H} toward black using <code>new = old × (1 − factor)</code>.`,
        ramp: shadeRamp,
      },
      {
        title: "Tints",
        description: `Each step blends #${H} toward white using <code>new = old + (255 − old) × factor</code>.`,
        ramp: tintRamp,
      },
      {
        title: "More Saturation",
        description: "Shifts saturation toward fully saturated at the same hue and lightness.",
        ramp: moreRamp,
      },
      {
        title: "Less Saturation",
        description: "Shifts saturation toward grey at the same hue and lightness.",
        ramp: lessRamp,
      },
    ];

    monoEl.innerHTML = `
      <h2>Monochromatic Variations</h2>
      <p class="muted">${DESCRIPTIONS.monochromatic}</p>
      ${blocks.map(rampSection).join("")}
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

  // --- CSS examples (paired code + live preview) ---
  const cssEl = document.getElementById("css-examples");
  if (cssEl) {
    const H = HEX(safe);
    const textOn = readableTextOn(safe);
    const dark = "#" + HEX(shades[2]);
    const soft = "#" + HEX(tints[2]);
    const rgb = hex2rgb(safe);

    const examples = [
      {
        label: "Design tokens",
        code: `:root {
  --accent: #${H};
  --accent-dark: #${dark.slice(1)};
  --accent-soft: #${soft.slice(1)};
}`,
        preview: `
          <div class="preview-tokens">
            <div class="preview-token-group">
              <span class="preview-token" style="background:#${H}" title="--accent">--accent</span>
              <span class="preview-token" style="background:#${dark.slice(1)}" title="--accent-dark">--accent-dark</span>
              <span class="preview-token" style="background:#${soft.slice(1)}" title="--accent-soft">--accent-soft</span>
            </div> 
          </div>
        `,
      },
      {
        label: "Simple class names",
        code: `.myforecolor { color: #${H}; }
.mybgcolor   { background-color: #${H}; }
.mybordercolor { border: 3px solid #${H}; }`,
        preview: `
          <div class="preview-simple">
            <p style="color:#${H};margin:0 0 6px">Text with <code>myforecolor</code></p>
            <div style="background:#${H};color:${textOn};padding:6px 10px;border-radius:6px;margin-bottom:6px">
              Div with <code>mybgcolor</code>
            </div>
            <div style="border:3px solid #${H};padding:6px 10px;border-radius:6px">
              Div with <code>mybordercolor</code>
            </div>
          </div>
        `,
      },
      {
        label: "Button",
        code: `.cta {
  background: #${H};
  color: ${textOn};
  padding: 8px 16px;
  border-radius: 999px;
  font-weight: 600;
}`,
        preview: `
          <div class="preview-center">
            <span style="display:inline-block;background:#${H};color:${textOn};
                         padding:8px 16px;border-radius:999px;font-weight:600">
              Click me
            </span>
          </div>
        `,
      },
      {
        label: "Border",
        code: `.outline {
  border: 2px solid #${H};
  padding: 10px 14px;
  border-radius: 8px;
}`,
        preview: `
          <div class="preview-center">
            <div style="border:2px solid #${H};padding:10px 14px;border-radius:8px">
              Outlined box
            </div>
          </div>
        `,
      },
      {
        label: "Text shadow (hex)",
        code: `.text-shadow-hex {
  text-shadow: 4px 4px 2px #${H};
}`,
        preview: `
          <div class="preview-center">
            <p style="text-shadow:4px 4px 2px #${H};font-size:1.25rem;font-weight:700;margin:0">
              Shadowed text
            </p>
          </div>
        `,
      },
      {
        label: "Text shadow (rgb)",
        code: `.text-shadow-rgb {
  text-shadow: 4px 4px 2px rgba(${rgb.red}, ${rgb.green}, ${rgb.blue}, 0.8);
}`,
        preview: `
          <div class="preview-center">
            <p style="text-shadow:4px 4px 2px rgba(${rgb.red}, ${rgb.green}, ${rgb.blue}, 0.8);
                       font-size:1.25rem;font-weight:700;margin:0">
              Shadowed text
            </p>
          </div>
        `,
      },
      {
        label: "Box shadow (prefixed)",
        code: `.box-shadow {
  -moz-box-shadow:    1px 1px 3px 2px #${H};
  -webkit-box-shadow: 1px 1px 3px 2px #${H};
  box-shadow:         1px 1px 3px 2px #${H};
}`,
        preview: `
          <div class="preview-center">
            <div style="box-shadow:1px 1px 3px 2px #${H};padding:10px 16px;border-radius:8px;background:var(--surface)">
              Raised box
            </div>
          </div>
        `,
      },
      {
        label: "Glow",
        code: `.glow {
  box-shadow: 0 0 24px #${H};
}`,
        preview: `
          <div class="preview-center">
            <div style="box-shadow:0 0 24px #${H};padding:10px 16px;border-radius:8px;background:var(--surface)">
              Glowing box
            </div>
          </div>
        `,
      },
      {
        label: "Gradient",
        code: `.hero {
        background: linear-gradient(
          135deg,
          #${H},
          #${HEX(soft).replace(/^#/, "")}
        );
      }`,
        preview: `<div class="preview-gradient" style="--g-start:#${H};--g-end:#${HEX(soft).replace(/^#/, "")}"></div>`,
      },
    ];

    cssEl.innerHTML = `
      <h2>CSS Examples</h2>
      <p class="muted">Each snippet is paired with a live preview using the current color.</p>
      <div class="code-demo-grid">
        ${examples.map((ex) => `
          <div class="code-demo">
            <div class="code-demo-head">
              <span class="label">${ex.label}</span>
              <button class="copy-btn" type="button"
                      data-copy="${ex.code.replace(/"/g, "&quot;")}"
                      aria-label="Copy ${ex.label} CSS">copy</button>
            </div>
            <pre class="code-demo-code"><code>${ex.code.replace(/</g, "&lt;")}</code></pre>
            <div class="code-demo-preview">${ex.preview}</div>
          </div>
        `).join("")}
      </div>
    `;
  }

  // --- Color Blindness ---
  renderInlineCVD(safe);
  
  // --- Known names ---
  renderColorNames(safe);

  // --- WCAG contrast ---
  renderContrast(safe);

  // Re-bind copy handlers for all freshly rendered sections
  [
    "verdict", 
    "contrast",
    "compare", 
    "color-names", 
    "color-spaces", 
    "base-numbers", 
    "harmonies", 
    "monochromatic", 
    "alternatives", 
    "related-colors", 
    "css-examples",
    "color-blindness"
  ]
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
  // ------------------------------------------------------------
  // 1. Initial state: apply color from URL or show welcome
  // ------------------------------------------------------------
  applyCurrentPathColor();

  // ------------------------------------------------------------
  // 2. Page form (#color-form on /index.html)
  // ------------------------------------------------------------
  const form = document.getElementById("color-form");
  const input = document.getElementById("color-input");

  if (form && input) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      // Clear any previous error
      const errorEl = document.getElementById("color-error");
      if (errorEl) {
        errorEl.textContent = "";
        errorEl.hidden = true;
      }
      input.removeAttribute("aria-invalid");

      const raw = input.value.trim();
      const color = normalizeColor(raw);

      if (!color) {
        if (errorEl) {
          errorEl.textContent =
            "Please enter a valid 3 or 6 character hex color (e.g. ff5733 or #ff5733).";
          errorEl.hidden = false;
        }
        input.setAttribute("aria-invalid", "true");
        input.focus();
        return;
      }

      // Normalize the input value to lowercase, no leading #
      input.value = color;

      // Update URL and render — on the home page this is an in-place
      // navigation (no reload); on other pages it's a full navigation.
      updateURLAndApply(color);
    });

    // Clear error as soon as the user starts typing again
    input.addEventListener("input", () => {
      const errorEl = document.getElementById("color-error");
      if (errorEl && !errorEl.hidden) {
        errorEl.textContent = "";
        errorEl.hidden = true;
      }
      input.removeAttribute("aria-invalid");
    });
  }

  // ------------------------------------------------------------
  // 3. Browser back/forward
  // ------------------------------------------------------------
  window.addEventListener("popstate", applyCurrentPathColor);

  // ------------------------------------------------------------
  // 4. Welcome-state suggestion swatches
  //    (optional — makes the samples update in place instead of
  //     doing a full navigation)
  // ------------------------------------------------------------
  document.querySelectorAll(".welcome-swatch[data-color]").forEach((a) => {
    a.addEventListener("click", (e) => {
      const color = a.getAttribute("data-color");
      if (!color) return;
      const normalized = normalizeColor(color);
      if (!normalized) return;

      e.preventDefault();
      const pageInput = document.getElementById("color-input");
      if (pageInput) pageInput.value = normalized;
      updateURLAndApply(normalized);
    });
  });
});
/*
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
*/
// Labeled ramp: one row per step, showing label / swatch / hex / copy.
function factorRamp(steps, heading) {
  return `
    <div class="factor-ramp">
      ${heading ? `<h4 class="factor-ramp-heading">${heading}</h4>` : ""}
      <div class="factor-ramp-rows">
        ${steps.map(({ label, hex }) => {
          const H = HEX(hex);
          return `
            <div class="factor-row">
              <span class="factor-label">${label}</span>
              <a class="factor-swatch" href="/hex/${hex.toLowerCase()}"
                 title="#${H}" style="background:#${H}"></a>
              <code class="factor-hex">#${H}</code>
              <button class="copy-btn" type="button"
                      data-copy="#${H}"
                      aria-label="Copy #${H}">copy</button>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

// Human-readable explanation for a no-op ramp.
function rampFallbackMessage(reason, hex) {
  const H = HEX(hex);
  switch (reason) {
    case "already-white":
      return `#${H} is already white — blending it toward white produces no change.`;
    case "already-black":
      return `#${H} is already black — blending it toward black produces no change.`;
    case "already-saturated":
      return `#${H} is already at 100% saturation at this hue and lightness. To make it feel more vivid, try a lighter tint or shift the hue toward a warmer or cooler neighbor.`;
    case "already-grey":
      return `#${H} is fully desaturated (grey) — there's no saturation left to remove.`;
    case "l-at-max":
      return `#${H} has maximum lightness — changing saturation doesn't affect its color. Pick a tint or shade of the underlying hue first.`;
    case "l-at-min":
      return `#${H} has minimum lightness — changing saturation doesn't affect its color. Pick a tint or shade of the underlying hue first.`;
    default:
      return `#${H} has no values for this ramp.`;
  }
}

// Render one monochromatic ramp, handling the no-op case.
function rampSection({ title, description, formula, ramp }) {
  if (ramp.available) {
    return `
      <section class="mono-group">
        <h3>${title}</h3>
        <p class="muted">${description}</p>
        ${formula ? `<p class="muted formula">${formula}</p>` : ""}
        ${factorRamp(ramp.steps)}
      </section>
    `;
  }
  return `
    <section class="mono-group">
      <h3>${title}</h3>
      <p class="muted">${rampFallbackMessage(ramp.reason, ramp.steps[0].hex)}</p>
    </section>
  `;
}

function hueSteps(hexStr, stepDeg = 15) {
  const [h, s, l] = hex2hsl(hexStr);
  const out = [{ label: "Base", hex: HEX(hexStr) }];
  for (let deg = stepDeg; deg <= 180; deg += stepDeg) {
    for (const sign of [-1, 1]) {
      let hh = h + (sign * deg) / 360;
      if (hh < 0) hh += 1;
      if (hh > 1) hh -= 1;
      out.push({
        label: `${sign > 0 ? "+" : "−"}${deg}°`,
        hex: hsl2hex([hh, s, l]),
      });
    }
  }
  return { steps: out, available: true };
}

function applyCurrentPathColor() {
  const color = readColorFromPath();
  if (!color) {
    showWelcome();
    return;
  }
  applyColor(color);
  const input = document.getElementById("color-input");
  if (input) input.value = color;
}

function showWelcome() {
  const welcome = document.getElementById("welcome");
  const details = document.getElementById("details");
  if (welcome) welcome.hidden = false;
  if (details) details.hidden = true;
}

function showDetails() {
  const welcome = document.getElementById("welcome");
  const details = document.getElementById("details");
  if (welcome) welcome.hidden = true;
  if (details) details.hidden = false;
}
