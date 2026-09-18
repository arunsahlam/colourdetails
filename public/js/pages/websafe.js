(function () {
    const STEPS = ["00", "33", "66", "99", "CC", "FF"];
    const colors = [];
    for (const r of STEPS) {
    for (const g of STEPS) {
        for (const b of STEPS) {
        colors.push((r + g + b).toUpperCase());
        }
    }
    }

    document.getElementById("websafe-grid").innerHTML = colors
    .map((hex) => {
        const rgb = hex2rgb(hex);
        const textOn = readableTextOn(hex);
        return `
        <a class="ws-cell" href="/hex/${hex.toLowerCase()}"
            title="#${hex} — rgb(${rgb.red}, ${rgb.green}, ${rgb.blue})"
            style="background:#${hex};color:${textOn}">
            <span>#${hex}</span>
        </a>
        `;
    })
    .join("");
})();
