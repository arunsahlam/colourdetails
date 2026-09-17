#!/usr/bin/env node
// scripts/build-pages.js
//
// Reads every file in _pages/, replaces @include markers with partials
// from _partials/, and writes the result to the web root.
//
// Usage:
//   node scripts/build-pages.js
//   node scripts/build-pages.js --watch   (rebuild on change)

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(ROOT, "_pages");
const PARTIALS_DIR = path.join(ROOT, "_partials");
const OUT_DIR = ROOT;   // write next to the source-root files

// Matches: <!-- @include name -->
const INCLUDE_RE = /<!--\s*@include\s+([a-z0-9_-]+)\s*-->/gi;

function log(...a) { console.log("[build-pages]", ...a); }

function loadPartials() {
  if (!fs.existsSync(PARTIALS_DIR)) {
    console.error("Missing _partials directory:", PARTIALS_DIR);
    process.exit(1);
  }
  const files = fs.readdirSync(PARTIALS_DIR).filter((f) => f.endsWith(".html"));
  const partials = {};
  for (const file of files) {
    const name = file.replace(/\.html$/, "");
    partials[name] = fs.readFileSync(path.join(PARTIALS_DIR, file), "utf8");
  }
  log(`Loaded ${files.length} partial(s):`, Object.keys(partials).join(", "));
  return partials;
}

function renderIncludes(source, partials) {
  // Support nested includes: keep substituting until stable.
  // Guards against infinite loops with a max pass count.
  let out = source;
  for (let pass = 0; pass < 10; pass++) {
    let changed = false;
    out = out.replace(INCLUDE_RE, (match, name) => {
      if (!partials[name]) {
        console.warn(`  ⚠ unknown partial: ${name}`);
        return match;
      }
      changed = true;
      return partials[name];
    });
    if (!changed) break;
  }
  return out;
}

function buildPage(file, partials) {
  const srcPath = path.join(SRC_DIR, file);
  const outPath = path.join(OUT_DIR, file);

  const source = fs.readFileSync(srcPath, "utf8");
  const rendered = renderIncludes(source, partials);
  
  // Prepend a banner so future readers know this file is generated.
  const banner =
    `<!--\n` +
    `  GENERATED FILE — do not edit directly.\n` +
    `  Source:    _pages/${file}\n` +
    `  Rebuild:   node scripts/build-pages.js\n` +
    `-->\n`;

  fs.writeFileSync(outPath, banner + rendered);
  
  const inKB  = (Buffer.byteLength(source)  / 1024).toFixed(1);
  const outKB = (Buffer.byteLength(rendered) / 1024).toFixed(1);
  log(`  ${file}  ${inKB} KB → ${outKB} KB`);
}

function buildAll() {
  const partials = loadPartials();

  if (!fs.existsSync(SRC_DIR)) {
    console.error("Missing _pages directory:", SRC_DIR);
    process.exit(1);
  }

  const pages = fs.readdirSync(SRC_DIR).filter((f) => f.endsWith(".html"));
  if (pages.length === 0) {
    console.warn("No pages found in", SRC_DIR);
    return;
  }

  log(`Building ${pages.length} page(s)…`);
  for (const file of pages) buildPage(file, partials);
  log("Done.");
}

function watch() {
  const { watch: fsWatch } = require("fs");
  log("Watching _pages/ and _partials/ for changes…");
  const rebuild = () => {
    try { buildAll(); } catch (e) { console.error(e); }
  };
  fsWatch(SRC_DIR, { recursive: true }, rebuild);
  fsWatch(PARTIALS_DIR, { recursive: true }, rebuild);
  buildAll();
}

if (process.argv.includes("--watch")) {
  watch();
} else {
  buildAll();
}