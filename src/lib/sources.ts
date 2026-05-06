import fs from "node:fs";
import path from "node:path";
import type { SourceFile, StepFile } from "@/types/visualizer";

const SOURCES_DIR = path.join(process.cwd(), "sources");

function readStepsFile(stepsPath: string): StepFile | null {
  try {
    const raw = fs.readFileSync(stepsPath, "utf-8");
    return JSON.parse(raw) as StepFile;
  } catch {
    return null;
  }
}

export function getSourceFiles(): SourceFile[] {
  const results: SourceFile[] = [];

  function walk(dir: string, category: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath, entry.name);
        continue;
      }

      if (!entry.name.endsWith(".py")) continue;

      const slug = path.relative(SOURCES_DIR, fullPath).replace(/\.py$/, "").replace(/\\/g, "/");
      const code = fs.readFileSync(fullPath, "utf-8");
      // Prefer manual .steps.json, fall back to auto-generated .steps.auto.json
      const manualPath = fullPath.replace(/\.py$/, ".steps.json");
      const autoPath = fullPath.replace(/\.py$/, ".steps.auto.json");
      const steps = readStepsFile(manualPath) || readStepsFile(autoPath);

      if (!steps) continue;

      results.push({
        slug,
        category,
        title: steps.title,
        description: steps.description,
        code,
        steps,
      });
    }
  }

  walk(SOURCES_DIR, "");
  return results;
}

export function getSourceBySlug(slug: string): SourceFile | undefined {
  return getSourceFiles().find((f) => f.slug === slug);
}

export function getSourceCategories(): Record<string, SourceFile[]> {
  const files = getSourceFiles();
  const map: Record<string, SourceFile[]> = {};

  for (const f of files) {
    const cat = f.slug.split("/")[0] || "other";
    if (!map[cat]) map[cat] = [];
    map[cat].push(f);
  }

  return map;
}
