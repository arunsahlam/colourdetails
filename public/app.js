// Normalize input like "ff5733", "#ff5733", "FF5733" → "ff5733"
function normalizeColor(input) {
  if (!input) return null;
  const cleaned = input.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(cleaned)) return null;
  return cleaned.toLowerCase();
}

function expandShortHex(hex) {
  if (hex.length === 3) {
    return hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  return hex;
}

function applyColor(hex6) {
  const full = expandShortHex(hex6);
  const color = "#" + full;

  document.documentElement.style.setProperty("--bg", color);

  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  document.documentElement.style.setProperty(
    "--text",
    luminance > 0.6 ? "#0f172a" : "#ffffff"
  );

  const swatch = document.getElementById("preview-swatch");
  const info = document.getElementById("preview-info");

  if (swatch) swatch.style.background = color;
  if (info) info.textContent = `Previewing color: #${full}`;
}

function readColorFromPath() {
  const match = window.location.pathname.match(/^\/color\/([0-9a-fA-F#]+)$/);
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
  const path = "/color/" + colorHex;

  if (window.history && window.history.pushState) {
    window.history.pushState({ color: colorHex }, "", path);
    // Immediately apply the new color
    applyColor(colorHex);
  } else {
    window.location.href = path;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("color-form");
  const input = document.getElementById("color-input");

  // On initial load, apply color from URL if present
  applyCurrentPathColor();

  if (!form || !input) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const raw = input.value;
    const color = normalizeColor(raw);

    if (!color) {
      alert("Please enter a valid 3 or 6 character hex color (e.g. ff5733 or #ff5733).");
      return;
    }

    // Update URL and apply color immediately
    updateURLAndApply(color);
  });

  // Handle browser back/forward
  window.addEventListener("popstate", applyCurrentPathColor);
});
