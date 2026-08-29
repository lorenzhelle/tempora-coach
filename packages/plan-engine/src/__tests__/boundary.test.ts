// Enforces the package's hard rules (see the plan-engine section of the
// implementation plan / ADR-0009): pure, deterministic, and isolated. A
// grep-based test rather than an eslint-plugin-boundaries setup, since the
// repo has no module-boundary tooling yet (docs/architecture.md notes
// boundaries are documented prose, not mechanically enforced) — this is
// the cheapest enforcement that still fails CI on a violation.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const srcDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function listSourceFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      files.push(...listSourceFiles(fullPath));
    } else if (entry.endsWith(".ts") && !entry.endsWith(".test.ts")) {
      files.push(fullPath);
    }
  }
  return files;
}

const sourceFiles = listSourceFiles(srcDir);

const IMPORT_PATTERN = /(?:from|require\()\s*["']([^"']+)["']/g;
const FORBIDDEN_APIS: RegExp[] = [
  /\bDate\.now\(/,
  /\bnew Date\(\s*\)/,
  /\bMath\.random\(/,
  /\bprocess\.env\b/,
];

describe("plan-engine package boundary", () => {
  it("has at least one source file to check (sanity guard against an empty glob)", () => {
    expect(sourceFiles.length).toBeGreaterThan(0);
  });

  it("imports nothing outside itself except zod and Node built-ins used by tests", () => {
    for (const file of sourceFiles) {
      const content = readFileSync(file, "utf-8");
      for (const match of content.matchAll(IMPORT_PATTERN)) {
        const specifier = match[1];
        const isRelative = specifier.startsWith(".");
        const isZod = specifier === "zod";
        expect(
          isRelative || isZod,
          `${relative(srcDir, file)} imports "${specifier}" — only relative imports and "zod" are allowed`,
        ).toBe(true);
      }
    }
  });

  it("never calls Date.now(), new Date(), Math.random(), or reads process.env", () => {
    for (const file of sourceFiles) {
      const content = readFileSync(file, "utf-8");
      for (const pattern of FORBIDDEN_APIS) {
        expect(
          pattern.test(content),
          `${relative(srcDir, file)} matches forbidden pattern ${pattern} — pass values as explicit inputs instead`,
        ).toBe(false);
      }
    }
  });
});
