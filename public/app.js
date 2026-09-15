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

  // Adjust text color for contrast (simple heuristic)
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
  // Supports /color/ff5733 or /color/#ff5733
  const match = window.location.pathname.match(/^\/color\/([0-9a-fA-F#]+)$/);
  if (!match) return null;
  return normalizeColor(match[1]);
}

function updateURL(colorHex) {
  const path = "/color/" + colorHex;
  if (window.history && window.history.pushState) {
    window.history.pushState({ color: colorHex }, "", path);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("color-form");
  const input = document.getElementById("color-input");

  // Apply color from URL on load (for dynamic URLs like /color/ff5733)
  const pathColor = readColorFromPath();
  if (pathColor) {
    applyColor(pathColor);
    if (input) input.value = pathColor;
  }

  if (!form || !input) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const raw = input.value;
    const color = normalizeColor(raw);
    if (!color) {
      alert("Please enter a valid 3 or 6 character hex color (e.g. ff5733 or #ff5733).");
      return;
    }
    applyColor(color);
    updateURL(color);
  });
});
