import { defineConfig } from "vitest/config";

// Unit tests only — Playwright (e2e/, playwright.config.ts) stays the
// separate e2e suite. Currently only packages/plan-engine has unit tests;
// this file is at the root so `npm run test:unit` has one obvious place to
// look regardless of which package grows tests next.
export default defineConfig({
  test: {
    include: ["packages/**/*.test.ts"],
    exclude: ["**/node_modules/**"],
  },
});
