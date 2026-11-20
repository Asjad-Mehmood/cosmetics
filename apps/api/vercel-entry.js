/**
 * Entrypoint of the `api` Vercel service (vercel.json → services.api.entrypoint).
 *
 * The service's build command (scripts/vercel-build.mjs) bundles src/vercel.ts
 * with tsup.vercel.config.ts into vercel-bundle/; Vercel then bundles from this
 * committed file and traces the packages it needs, keeping the monorepo
 * layout, so the function can find node_modules at run time.
 *
 * Keep the bundle out of dist/: after a build command Vercel serves the first
 * server file it finds in dist/, build/ or output/ (it would pick
 * dist/server.js, the long-running server for other hosts), and when the
 * service sets outputDirectory the function loses its node_modules.
 */
export { default } from "./vercel-bundle/index.js";
