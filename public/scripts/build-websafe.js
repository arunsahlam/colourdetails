const STEPS = ["00", "33", "66", "99", "CC", "FF"];
const cells = [];
for (const r of STEPS) for (const g of STEPS) for (const b of STEPS) {
  const hex = (r + g + b).toUpperCase();
  cells.push(`<a class="ws-cell" href="/hex/${hex.toLowerCase()}" title="#${hex}">#${hex}</a>`);
}