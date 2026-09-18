const els = {
    a: document.getElementById("sub-a"),
    b: document.getElementById("sub-b"),
    aPrev: document.getElementById("sub-a-preview"),
    bPrev: document.getElementById("sub-b-preview"),
    result: document.getElementById("sub-result"),
    info: document.getElementById("sub-info"),
    opGrid: document.getElementById("op-grid"),
};

// Subtract b from a in CMYK
function subtractColors(a, b) {
    const ca = hex2cmyk(a);
    const cb = hex2cmyk(b);
    const out = ca.map((v, i) => Math.max(0, v - cb[i]));
    return cmyk2hex(out);
}

// cmyk [0..1]^4 → hex
function cmyk2hex(cmyk) {
    const [c, m, y, k] = cmyk;
    const r = 255 * (1 - c) * (1 - k);
    const g = 255 * (1 - m) * (1 - k);
    const b = 255 * (1 - y) * (1 - k);
    return rgbToHexFromUnit(r / 255, g / 255, b / 255);
}

function subtract(a, b) {
    const cmykA = hex2cmyk(a);
    const cmykB = hex2cmyk(b);
    const out = cmykA.map((v, i) => Math.max(0, v - cmykB[i]));
    // Convert back to RGB manually
    const [c, m, y, k] = out;
    const r = 1 - Math.min(1, c + k);
    const g = 1 - Math.min(1, m + k);
    const bl = 1 - Math.min(1, y + k);
    return rgbToHexFromUnit(r, g, bl);
}

function setSwatch(el, hex) {
    el.style.background = "#" + hex;
    el.textContent = "#" + hex;
    el.style.color = readableTextOn(hex);
    el.style.display = "flex";
    el.style.alignItems = "center";
    el.style.justifyContent = "center";
    el.style.fontFamily = "ui-monospace, Menlo, monospace";
    el.style.fontSize = "0.8rem";
    el.style.fontWeight = "600";
}

function render() {
    const a = validateHex(els.a.value);
    const b = validateHex(els.b.value);
    const res = subtract(a, b);

    setSwatch(els.aPrev, a);
    setSwatch(els.bPrev, b);
    setSwatch(els.result, res);

    const rgb = hex2rgb(res);
    els.info.innerHTML =
    `<span class="hex-label">#${res}</span>` +
    `<span class="muted">rgb(${rgb.red}, ${rgb.green}, ${rgb.blue})</span>`;

    // All four operations grid
    const ops = [
    ["A − B", subtract(a, b)],
    ["B − A", subtract(b, a)],
    ["A + B (blend 50%)", mixColors(a, b, 0.5)],
    ["A ⊕ B (XOR-ish)", rgbToHexFromUnit(
        (hex2rgb(a).red / 255) ^ (hex2rgb(b).red / 255) / 255,
        (hex2rgb(a).green / 255) ^ (hex2rgb(b).green / 255) / 255,
        (hex2rgb(a).blue / 255) ^ (hex2rgb(b).blue / 255) / 255
    )],
    ];

    els.opGrid.innerHTML = ops.map(([label, hex]) => {
    const textOn = readableTextOn(hex);
    return `
        <div class="op-card">
        <div class="op-swatch" style="background:#${hex};color:${textOn}">#${hex}</div>
        <div class="op-label">${label}</div>
        </div>
    `;
    }).join("");
}

["input", "change"].forEach((ev) => {
    els.a.addEventListener(ev, render);
    els.b.addEventListener(ev, render);
});
render();