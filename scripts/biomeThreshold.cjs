#!/usr/bin/env node
const fs = require("node:fs");

const [, , reportPath, thresholdStr = "20"] = process.argv;
const threshold = Number.parseInt(thresholdStr, 10);

if (!reportPath || Number.isNaN(threshold)) {
  console.error(
    "[BiomeThreshold] Usage: node scripts/biomeThreshold.cjs <report.json> <threshold>",
  );
  process.exit(2);
}

let json;
try {
  json = JSON.parse(fs.readFileSync(reportPath, "utf8"));
} catch (e) {
  console.error(`[BiomeThreshold] Failed to read or parse report: ${reportPath}`);
  console.error(e);
  process.exit(2);
}

let errors = 0;
let warnings = 0;

function walk(node) {
  if (Array.isArray(node)) {
    node.forEach(walk);
    return;
  }
  if (node && typeof node === "object") {
    if (node.severity === "error") errors += 1;
    else if (node.severity === "warning") warnings += 1;
    Object.values(node).forEach(walk);
  }
}

walk(json);

console.log(`[BiomeThreshold] errors=${errors} warnings=${warnings} threshold=${threshold}`);

if (errors > threshold) {
  console.error(`[BiomeThreshold] Failing: errors (${errors}) exceed threshold (${threshold}).`);
  process.exit(1);
}

console.log("[BiomeThreshold] Passed: error count within threshold.");
process.exit(0);
