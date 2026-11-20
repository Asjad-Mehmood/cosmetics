import { defineConfig } from "tsup";

/**
 * The bundle for the `api` Vercel service, loaded by vercel-entry.js (see
 * there for why it lives in vercel-bundle/ and not dist/).
 */
export default defineConfig({
  entry: { index: "src/vercel.ts" },
  outDir: "vercel-bundle",
  format: ["esm"],
  target: "node22",
  platform: "node",
  sourcemap: true,
  clean: true,
  // Workspace packages ship TypeScript source, so bundle them into the output.
  noExternal: [/^@store\//],
});
