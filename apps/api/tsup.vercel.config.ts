import { defineConfig } from "tsup";

/**
 * The bundle for the `api` Vercel service (vercel.json → services.api).
 *
 * It goes to its own folder, dist/vercel, which is the service's
 * outputDirectory: after the build command, Vercel serves the index.js it finds
 * there. (Without that setting it would search dist/ and pick dist/server.js,
 * the long-running server for other hosts.)
 */
export default defineConfig({
  entry: { index: "src/vercel.ts" },
  outDir: "dist/vercel",
  format: ["esm"],
  target: "node22",
  platform: "node",
  sourcemap: true,
  clean: true,
  // Workspace packages ship TypeScript source, so bundle them into the output.
  noExternal: [/^@store\//],
});
