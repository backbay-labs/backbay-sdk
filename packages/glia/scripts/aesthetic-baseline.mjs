#!/usr/bin/env node
/**
 * Saves current aesthetic scores as the regression baseline.
 * Usage: node scripts/aesthetic-baseline.mjs
 */
import { readFile, writeFile, copyFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GRADES_DIR = join(__dirname, "..", ".visual-review", "grades");

async function main() {
  const scoresPath = join(GRADES_DIR, "scores.json");
  const baselinePath = join(GRADES_DIR, "baseline.json");

  if (!existsSync(scoresPath)) {
    console.error("No scores.json found. Run aesthetic-grade first.");
    process.exit(1);
  }

  await copyFile(scoresPath, baselinePath);

  const scores = JSON.parse(await readFile(scoresPath, "utf-8"));
  const dist = { S: 0, A: 0, B: 0, C: 0, D: 0 };
  for (const s of scores) dist[s.grade]++;
  const avg = scores.length > 0
    ? Math.round(scores.reduce((sum, s) => sum + s.composite, 0) / scores.length * 10) / 10
    : 0;

  console.log(`Baseline saved: ${scores.length} stories`);
  console.log(`Distribution: S:${dist.S} A:${dist.A} B:${dist.B} C:${dist.C} D:${dist.D}`);
  console.log(`Average: ${avg}`);
  console.log(`Written to: ${baselinePath}`);
}

main().catch(console.error);
