(function () {
  "use strict";

  const ALL = window.COLOR_NAMES_DATA || [];

  const els = {
    search: document.getElementById("names-search"),
    sort:   document.getElementById("names-sort"),
    grid:   document.getElementById("names-grid"),
    count:  document.getElementById("names-count"),
    empty:  document.getElementById("names-empty"),
    more:   document.getElementById("names-more"),
  };

  if (!els.grid) return;

  let filtered = [];
  let rendered = 0;
  const PAGE = 60;

  const hslCache = new Map();
  function getHSL(hex) {
    let v = hslCache.get(hex);
    if (!v) { v = hex2hsl(hex); hslCache.set(hex, v); }
    return v;
  }

  function primaryName(c) {
    return c.names && c.names[0] ? c.names[0].name : "Unnamed";
  }

  function haystack(c) {
    if (c._hay) return c._hay;
    const parts = [c.hex];
    for (const n of c.names || []) {
      parts.push(n.name, n.source, `${n.name} (${n.source})`);
    }
    c._hay = parts.join("\u0001").toLowerCase();
    return c._hay;
  }

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]));

  function applyFilter() {
    const q = els.search.value.trim().toLowerCase().replace(/^#/, "");
    filtered = !q ? ALL.slice() : ALL.filter((c) => haystack(c).includes(q));

    switch (els.sort.value) {
      case "name-desc":  filtered.sort((a,b) => primaryName(b).localeCompare(primaryName(a))); break;
      case "hex-asc":    filtered.sort((a,b) => a.hex.localeCompare(b.hex)); break;
      case "hue-asc":    filtered.sort((a,b) => getHSL(a.hex)[0] - getHSL(b.hex)[0]); break;
      case "light-asc":  filtered.sort((a,b) => getHSL(a.hex)[2] - getHSL(b.hex)[2]); break;
      case "light-desc": filtered.sort((a,b) => getHSL(b.hex)[2] - getHSL(a.hex)[2]); break;
      default:           filtered.sort((a,b) => primaryName(a).localeCompare(primaryName(b)));
    }

    els.count.textContent = filtered.length === ALL.length
      ? `${ALL.length} colors`
      : `${filtered.length} of ${ALL.length} colors`;

    els.empty.hidden = filtered.length > 0;
    els.grid.innerHTML = "";
    rendered = 0;
    renderPage();
  }

  function cardHTML(c) {
    const rgb = hex2rgb(c.hex);
    const [h, s, l] = getHSL(c.hex);
    const primary = primaryName(c);
    const extra = (c.names ? c.names.length : 1) - 1;
    const nameLine = extra > 0
      ? `${esc(primary)} <span class="name-more">+${extra}</span>`
      : esc(primary);
    const allNames = (c.names || []).map((n) => `${n.name} (${n.source})`).join(" · ");
    return `<a class="name-card" href="/hex/${c.hex.toLowerCase()}" title="${esc(allNames)}">
      <div class="name-swatch" style="background:#${c.hex}"></div>
      <div class="name-info">
        <strong>${nameLine}</strong>
        <code>#${c.hex}</code>
        <span class="muted">rgb(${rgb.red}, ${rgb.green}, ${rgb.blue})</span>
        <span class="muted">hsl(${Math.round(h*360)}, ${Math.round(s*100)}%, ${Math.round(l*100)}%)</span>
      </div>
    </a>`;
  }

  function renderPage() {
    const next = filtered.slice(rendered, rendered + PAGE);
    if (!next.length) { els.more.hidden = true; return; }
    const frag = document.createElement("div");
    frag.innerHTML = next.map(cardHTML).join("");
    while (frag.firstChild) els.grid.appendChild(frag.firstChild);
    rendered += next.length;
    els.more.hidden = rendered >= filtered.length;
  }

  els.search.addEventListener("input", applyFilter);
  els.sort.addEventListener("change", applyFilter);
  els.more.addEventListener("click", renderPage);

  if (!ALL.length) {
    els.grid.innerHTML = `<p class="muted">No color data loaded. Run <code>node scripts/build-colors.js</code>.</p>`;
    return;
  }
  applyFilter();
})();