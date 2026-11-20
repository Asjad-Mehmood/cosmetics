import base from "@store/config/eslint/base";

export default [
  ...base,
  // The seed is a CLI script: printing progress to stdout is intended.
  { files: ["prisma/**/*.ts"], rules: { "no-console": "off" } },
];
