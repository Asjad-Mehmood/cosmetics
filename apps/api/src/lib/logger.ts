import pino from "pino";
import { env, isProd, isTest } from "../config/env";

export const logger = pino({
  level: isTest ? "silent" : env.LOG_LEVEL,
  redact: {
    paths: ["req.headers.authorization", "req.headers.cookie", "*.password", "*.passwordHash"],
    censor: "[redacted]",
  },
  // Pretty logs only for a developer's terminal: pino-pretty is a dev dependency
  // and is not shipped to hosted functions (whose stdout is never a TTY).
  ...(isProd || isTest || !process.stdout.isTTY
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "HH:MM:ss" },
        },
      }),
});
