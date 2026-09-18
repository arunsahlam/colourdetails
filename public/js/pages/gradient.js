const els = {
    a: document.getElementById("grad-a"),
    b: document.getElementById("grad-b"),
    angle: document.getElementById("angle"),
    angleLabel: document.getElementById("angle-label"),
    preview: document.getElementById("grad-preview"),
    code: document.getElementById("grad-code"),
    copy: document.getElementById("grad-copy"),
};

function render() {
    const a = validateHex(els.a.value, true);
    const b = validateHex(els.b.value, true);
    const deg = els.angle.value;
    els.angleLabel.textContent = deg + "°";

    const css = `background: linear-gradient(${deg}deg, #${HEX(a)}, #${HEX(b)});`;
    els.preview.style.background = `linear-gradient(${deg}deg, #${a}, #${b})`;
    els.code.textContent = css;
    els.copy.setAttribute("data-copy", css);
}

["input", "change"].forEach((ev) => {
    els.a.addEventListener(ev, render);
    els.b.addEventListener(ev, render);
    els.angle.addEventListener(ev, render);
});

els.copy.addEventListener("click", async () => {
    try {
    await navigator.clipboard.writeText(els.copy.getAttribute("data-copy"));
    els.copy.textContent = "copied";
    setTimeout(() => (els.copy.textContent = "copy"), 1200);
    } catch {}
});

render();