const els = {
    hex: document.getElementById("cvd-hex"),
    grid: document.getElementById("cvd-grid"),
    ui: document.getElementById("cvd-ui"),
};

function render() {
    const base = validateHex(els.hex.value, true);
    const groups = {};
    for (const v of CVD_VARIANTS) {
    (groups[v.group] = groups[v.group] || []).push(v);
    }

    els.grid.innerHTML = Object.entries(groups)
    .map(([group, variants]) => `
        <div class="cvd-group">
        <h3>${group}</h3>
        <div class="cvd-row">
            ${variants.map((v) => {
            const sim = v.id === "normal" ? HEX(base) : simulateCVD(base, v.id);
            return `
                <article class="cvd-card">
                <div class="cvd-swatch" style="background:#${sim}"></div>
                <div class="cvd-body">
                    <strong>${v.label}</strong>
                    <code>#${sim}</code>
                    <button class="copy-btn" data-copy="#${sim}">copy</button>
                </div>
                </article>
            `;
            }).join("")}
        </div>
        </div>
    `)
    .join("");

    // Sample UI for each variant
    els.ui.innerHTML = Object.entries(groups)
    .map(([group, variants]) => `
        <div class="cvd-group">
        <h3>${group}</h3>
        <div class="cvd-row">
            ${variants.map((v) => {
            const sim = v.id === "normal" ? HEX(base) : simulateCVD(base, v.id);
            const textOn = readableTextOn(sim);
            return `
                <article class="cvd-card">
                <div class="cvd-ui-preview" style="background:#${sim};color:${textOn}">
                    <span>Preview button</span>
                </div>
                <div class="cvd-body"><strong>${v.label}</strong></div>
                </article>
            `;
            }).join("")}
        </div>
        </div>
    `)
    .join("");

    attachCopy();
}

function attachCopy() {
    document.querySelectorAll("[data-copy]").forEach((btn) => {
    if (btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";
    btn.addEventListener("click", async () => {
        try {
        await navigator.clipboard.writeText(btn.getAttribute("data-copy"));
        btn.textContent = "copied";
        setTimeout(() => (btn.textContent = "copy"), 1200);
        } catch {}
    });
    });
}

els.hex.addEventListener("input", render);
render();