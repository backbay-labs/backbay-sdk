#!/usr/bin/env node
/**
 * Compares current aesthetic scores against the saved baseline.
 * Exits with code 1 if any story degraded by >15 points (CI gate).
 *
 * Usage: node scripts/aesthetic-diff.mjs
 */
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GRADES_DIR = join(__dirname, "..", ".visual-review", "grades");

const GRADE_ORDER = { S: 4, A: 3, B: 2, C: 1, D: 0 };

function gradeDirection(oldGrade, newGrade) {
  const diff = GRADE_ORDER[newGrade] - GRADE_ORDER[oldGrade];
  if (diff > 0) return "up";
  if (diff < 0) return "down";
  return "same";
}

async function main() {
  const baselinePath = join(GRADES_DIR, "baseline.json");
  const scoresPath = join(GRADES_DIR, "scores.json");

  if (!existsSync(baselinePath)) {
    console.error("No baseline.json found. Run aesthetic-baseline first.");
    process.exit(1);
  }
  if (!existsSync(scoresPath)) {
    console.error("No scores.json found. Run aesthetic-grade first.");
    process.exit(1);
  }

  const baseline = JSON.parse(await readFile(baselinePath, "utf-8"));
  const current = JSON.parse(await readFile(scoresPath, "utf-8"));

  const baseMap = new Map(baseline.map((s) => [s.storyId, s]));
  const currMap = new Map(current.map((s) => [s.storyId, s]));

  const degraded = [];
  const improved = [];
  const newStories = [];
  const removed = [];

  // Check current stories against baseline
  for (const [id, curr] of currMap) {
    const base = baseMap.get(id);
    if (!base) {
      newStories.push(curr);
      continue;
    }
    const delta = curr.composite - base.composite;
    const gradeDelta = gradeDirection(base.grade, curr.grade);

    if (delta < -5 || gradeDelta === "down") {
      degraded.push({ id, base, curr, delta });
    } else if (delta > 5 || gradeDelta === "up") {
      improved.push({ id, base, curr, delta });
    }
  }

  // Check for removed stories
  for (const [id, base] of baseMap) {
    if (!currMap.has(id)) {
      removed.push(base);
    }
  }

  // Print report
  console.log("Aesthetic Score Regression Report");
  console.log("=================================");

  if (degraded.length > 0) {
    console.log("Degraded (action required):");
    for (const d of degraded.sort((a, b) => a.delta - b.delta)) {
      const sign = d.delta > 0 ? "+" : "";
      console.log(`  \u2B07 ${d.id}: ${d.base.grade}(${d.base.composite}) \u2192 ${d.curr.grade}(${d.curr.composite}) [${sign}${Math.round(d.delta * 10) / 10}]`);
    }
  } else {
    console.log("Degraded: none");
  }

  if (improved.length > 0) {
    console.log("Improved:");
    for (const d of improved.sort((a, b) => b.delta - a.delta)) {
      const sign = d.delta > 0 ? "+" : "";
      console.log(`  \u2B06 ${d.id}: ${d.base.grade}(${d.base.composite}) \u2192 ${d.curr.grade}(${d.curr.composite}) [${sign}${Math.round(d.delta * 10) / 10}]`);
    }
  }

  if (newStories.length > 0) {
    console.log("New (no baseline):");
    for (const s of newStories) {
      console.log(`  \u2605 ${s.storyId}: ${s.grade}(${s.composite})`);
    }
  }

  if (removed.length > 0) {
    console.log("Removed:");
    for (const s of removed) {
      console.log(`  \u2716 ${s.storyId}: was ${s.grade}(${s.composite})`);
    }
  }

  console.log(`\nSummary: ${degraded.length} degraded, ${improved.length} improved, ${newStories.length} new, ${removed.length} removed`);

  // CI gate: fail if any story degraded by more than 15 points
  const severe = degraded.filter((d) => d.delta < -15);
  if (severe.length > 0) {
    console.log(`Exit: FAIL (${severe.length} degradation(s) >15 points)`);
    for (const s of severe) {
      console.log(`  !! ${s.id}: ${Math.round(s.delta * 10) / 10} points`);
    }
    process.exit(1);
  } else {
    console.log("Exit: PASS (no degradation >15 points)");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
