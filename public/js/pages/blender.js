const els = {
    a: document.getElementById("blend-a"),
    b: document.getElementById("blend-b"),
    mix: document.getElementById("mix"),
    mixLabel: document.getElementById("mix-label"),
    swatch: document.getElementById("blend-swatch"),
    info: document.getElementById("blend-info"),
    ramp: document.getElementById("ramp"),
    rampValues: document.getElementById("ramp-values"),
};

function render() {
    const a = validateHex(els.a.value, true);
    const b = validateHex(els.b.value, true);
    const t = Number(els.mix.value) / 100;
    els.mixLabel.textContent = els.mix.value + "%";

    const mixed = mixColors(a, b, t);
    els.swatch.style.background = "#" + mixed;
    const rgb = hex2rgb(mixed);
    els.info.innerHTML =
    `<span class="hex-label">#${mixed}</span>` +
    `<span class="muted">rgb(${rgb.red}, ${rgb.green}, ${rgb.blue})</span>`;

    const stops = buildGradient(a, b, 11);
    els.ramp.innerHTML = stops
    .map((hx) => `<span class="ramp-stop" style="background:#${hx}" title="#${hx}"></span>`)
    .join("");
    els.rampValues.innerHTML = stops
    .map((hx) => `<span>#${hx}</span>`)
    .join("");
}

["input", "change"].forEach((ev) => {
    els.a.addEventListener(ev, render);
    els.b.addEventListener(ev, render);
    els.mix.addEventListener(ev, render);
});
render();
