#!/usr/bin/env node
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const baseRef = process.env.BIOME_BASE_REF || "origin/main";
const diff = spawnSync(
  "git",
  ["diff", "--name-only", "--diff-filter=ACMRTUXB", `${baseRef}...HEAD`],
  { encoding: "utf8" },
);

if (diff.status !== 0) {
  console.error("[BiomeChanged] git diff failed:", diff.stderr);
  process.exit(diff.status || 2);
}

const files = diff.stdout
  .split(/\r?\n/)
  .filter(Boolean)
  .filter((f) => /\.(tsx?|jsx?)$/.test(f));

if (files.length === 0) {
  console.log("[BiomeChanged] No changed source files detected.");
  process.exit(0);
}

console.log("[BiomeChanged] Checking files:", files.join(", "));

const reportPath = path.resolve("biome-changed.json");
const res = spawnSync(
  "npx",
  ["biome", "check", "--max-diagnostics=200", "--reporter=json", ...files],
  { encoding: "utf8" },
);

if (res.status !== 0 && !res.stdout) {
  console.error("[BiomeChanged] Biome failed:", res.stderr);
  process.exit(res.status || 1);
}

fs.writeFileSync(reportPath, res.stdout || "{}", "utf8");

const threshold = process.env.BIOME_ERROR_THRESHOLD || "10";
const threshRes = spawnSync("node", ["scripts/biomeThreshold.cjs", reportPath, String(threshold)], {
  stdio: "inherit",
});

process.exit(threshRes.status || 0);
