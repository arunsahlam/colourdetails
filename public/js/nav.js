// /nav.js — site-wide nav and theme wiring
(function () {
  // ---- Active nav link ----
  const path = location.pathname.replace(/\/$/, "") || "/index.html";
  document.querySelectorAll(".site-links a").forEach((a) => {
    const href = (a.getAttribute("href") || "").replace(/\/$/, "");
    if (href === path) a.setAttribute("aria-current", "page");
  });

  // ---- Theme toggle ----
const Theme = (function () {
  const KEY = "colorguide.theme";
  const root = document.documentElement;
  let mode = "auto";

  function systemPrefersDark() {
    return matchMedia("(prefers-color-scheme: dark)").matches;
  }
  function effective() {
    if (mode === "light") return "light";
    if (mode === "dark")  return "dark";
    return systemPrefersDark() ? "dark" : "light";
  }
  function apply() {
    root.setAttribute("data-theme", effective());
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
    if (matchMedia) {
      matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
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
  };
})();

  // Expose for app.js so it can nudge the theme when the color changes
  window.SiteTheme = Theme;

  // Wire the toggle button
  function renderButton() {
    const btn = document.getElementById("theme-toggle");
    if (!btn) return;
    const labels = { auto: "Auto", light: "Light", dark: "Dark" };
    const icons  = { auto: "◐", light: "☀", dark: "☾" };
    const m = Theme.getMode();
    btn.innerHTML = `${icons[m]}<span class="label"> ${labels[m]}</span>`;
    btn.setAttribute("aria-label", `Theme: ${labels[m]} (click to cycle)`);
  }

  Theme.init();
  renderButton();
  const btn = document.getElementById("theme-toggle");
  if (btn) {
    btn.addEventListener("click", () => {
      Theme.cycle();
      renderButton();
    });
  }

  // ---- Optional: scroll-spy on subnav (only on pages that have one) ----
  const subnavLinks = document.querySelectorAll(".subnav a[href^='#']");
  if (subnavLinks.length) {
    const sections = Array.from(subnavLinks)
      .map((a) => document.querySelector(a.getAttribute("href")))
      .filter(Boolean);
    if (sections.length) {
      const headerH = parseInt(getComputedStyle(document.documentElement)
        .getPropertyValue("--header-h")) || 56;
      const subnavH = parseInt(getComputedStyle(document.documentElement)
        .getPropertyValue("--subnav-h")) || 44;
      const total = headerH + subnavH;
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              subnavLinks.forEach((a) =>
                a.classList.toggle(
                  "active",
                  a.getAttribute("href") === "#" + entry.target.id
                )
              );
            }
          });
        },
        { rootMargin: `-${total + 8}px 0px -60% 0px`, threshold: 0 }
      );
      sections.forEach((s) => obs.observe(s));
    }
  }
})();

// ---- Nav color search ----
(function navSearch() {
  const form = document.getElementById("nav-color-form");
  const input = document.getElementById("nav-color-input");
  if (!form || !input) return;

  // Remove any existing error node
  let error = form.querySelector(".nav-search-error");

  function showError(message) {
    input.setAttribute("aria-invalid", "true");
    if (!error) {
      error = document.createElement("div");
      error.className = "nav-search-error";
      error.setAttribute("role", "alert");
      form.appendChild(error);
    }
    error.textContent = message;
  }

  function clearError() {
    input.removeAttribute("aria-invalid");
    if (error) {
      error.remove();
      error = null;
    }
  }

  // Clear on typing
  input.addEventListener("input", clearError);

  // Submit → navigate to /hex/<code>
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    clearError();

    const raw = input.value.trim();
    if (!raw) {
      showError("Enter a hex color code.");
      input.focus();
      return;
    }

    // Reuse the canonical normalizer from color.js
    const normalized =
      typeof normalizeColor === "function"
        ? normalizeColor(raw)
        : (() => {
            const cleaned = raw.replace(/^#/, "");
            return /^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(cleaned)
              ? cleaned.toLowerCase()
              : null;
          })();

    if (!normalized) {
      showError("Enter a valid 3 or 6 character hex, e.g. ff5733.");
      input.focus();
      return;
    }

    // If we're already on the home page, use the SPA router so the
    // page updates without a full reload.
    if (location.pathname === "/" || location.pathname === "/index.html") {
      if (typeof updateURLAndApply === "function") {
        updateURLAndApply(normalized);
        input.value = normalized;
        input.blur();
        return;
      }
    }

    // Otherwise, full navigation to the hex page
    location.href = "/hex/" + normalized;
  });

  // Optional: mobile collapsible
  const mobileToggle = form.querySelector("[data-nav-search-toggle]");
  if (mobileToggle) {
    mobileToggle.addEventListener("click", (e) => {
      // Only intercept if the input is currently collapsed
      if (window.matchMedia("(max-width: 480px)").matches && !form.classList.contains("open")) {
        e.preventDefault();
        form.classList.add("open");
        input.focus();
      }
    });
    input.addEventListener("blur", () => {
      if (!input.value) form.classList.remove("open");
    });
  }
})();

// nav.js
function syncHeaderHeight() {
  const header = document.querySelector(".site-header");
  const subnav = document.querySelector(".subnav");
  if (header) {
    document.documentElement.style.setProperty(
      "--header-h",
      header.offsetHeight + "px"
    );
  }
  if (subnav) {
    document.documentElement.style.setProperty(
      "--subnav-h",
      subnav.offsetHeight + "px"
    );
  }
}
syncHeaderHeight();
addEventListener("resize", syncHeaderHeight);

(function navSearch() {
  const form = document.getElementById("nav-color-form");
  const input = document.getElementById("nav-color-input");
  if (!form || !input) return;

  // Bail if the search row is hidden (e.g. on the home page)
  if (form.closest(".site-search-row")?.offsetParent === null) return;
  // …rest unchanged
})();